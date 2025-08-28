import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getWeekRangeUtc, getCurrentWeekStartET, isCurrentWeek, isPrayerWeekVisible } from '@/lib/utils'
import { filterContent } from '@/lib/content-filter'
import { getOrCreatePrayerWall, updateWallStats, getDefaultOrganizationId, hasAdminAccess } from '@/lib/prayer-walls'
import dayjs from 'dayjs'
import type { Database } from '@/types/database.types'

// Helper type for ownership verification queries
type PrayerOwnershipData = {
  user_id: string | null
  created_at: string | null
}

/**
 * GET /api/prayers?week_start=YYYY-MM-DD&fellowship=ypf
 * OPTIMIZED: Uses prayer_walls + v_prayers_likes for better performance
 * - Gets or creates prayer_wall for the week/organization
 * - Queries prayers by wall_id instead of time ranges (O(1) vs O(log n))
 * - Uses v_prayers_likes view to eliminate N+1 query problem
 */
export async function GET(req: Request) {
  const supabase = await createServerSupabase()
  try {
    const { searchParams } = new URL(req.url)
    const qsWeekStart = searchParams.get('week_start') || getCurrentWeekStartET()
    const fellowship = searchParams.get('fellowship')
    const organizationId = searchParams.get('organizationId')
    const orgSlug = searchParams.get('orgSlug')
    
    // Get organization ID - support multiple ways to specify organization
    let orgId: string
    
    if (organizationId) {
      orgId = organizationId
    } else if (orgSlug) {
      // Look up organization by slug
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', orgSlug)
        .single()
      
      if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }
      orgId = org.id
    } else {
      // BACKWARD COMPATIBILITY: Use database function for default MGC organization
      const { data } = await supabase.rpc('get_default_organization_id')
      orgId = data
      console.log('SAFETY: Default to MGC organization for legacy API request')
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Step 1: Get or create prayer_wall (KEY OPTIMIZATION!)
    const wallResult = await getOrCreatePrayerWall(qsWeekStart, orgId, user?.id)
    if ('error' in wallResult) {
      return NextResponse.json({ error: wallResult.error }, { status: 500 })
    }
    
    const { data: wall, isNew } = wallResult
    
    // Step 2: Query prayers using wall_id, but fallback to time range for legacy data
    let query = supabase
      .from('v_prayers_likes') // Use optimized view to eliminate N+1 problem
      .select(`
        id,
        content,
        author_name,
        user_id,
        created_at,
        fellowship,
        thanksgiving_content,
        intercession_content,
        like_count,
        liked_by_me
      `)
      .eq('wall_id', wall.id) // O(1) query instead of time range O(log n)
      .eq('organization_id', orgId) // CRITICAL: Ensure organization filtering on main query too
      .order('created_at', { ascending: false })

    // Add fellowship filter if specified
    if (fellowship) {
      query = query.eq('fellowship', fellowship)
    }

    let { data: prayers, error } = await query

    // Fallback: If no prayers found via wall_id, try time range query for legacy data
    if (!error && (!prayers || prayers.length === 0) && !isNew) {
      const { startUtcISO, endUtcISO } = getWeekRangeUtc(qsWeekStart)
      
      let fallbackQuery = supabase
        .from('v_prayers_likes')
        .select(`
          id,
          content,
          author_name,
          user_id,
          created_at,
          fellowship,
          thanksgiving_content,
          intercession_content,
          like_count,
          liked_by_me
        `)
        .gte('created_at', startUtcISO)
        .lt('created_at', endUtcISO)
        .eq('organization_id', orgId) // CRITICAL: Filter by organization in fallback query
        .order('created_at', { ascending: false })

      if (fellowship) {
        fallbackQuery = fallbackQuery.eq('fellowship', fellowship)
      }

      const fallbackResult = await fallbackQuery
      if (!fallbackResult.error && fallbackResult.data) {
        prayers = fallbackResult.data
      }
    }

    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch prayers' }, { status: 500 })
    }

    // Privacy filtering: Get user profiles for privacy settings
    let filteredPrayers = prayers || []
    
    if (filteredPrayers.length > 0) {
      // Get unique user IDs from prayers
      const authorIds = [...new Set(filteredPrayers.map((p: any) => p.user_id).filter(Boolean))]
      
      if (authorIds.length > 0) {
        // Get privacy settings for all authors
        const { data: authorProfiles } = await supabase
          .from('user_profiles')
          .select('user_id, prayers_visibility_weeks')
          .in('user_id', authorIds)
        
        const privacyMap = new Map(
          (authorProfiles || []).map((p: any) => [p.user_id, p.prayers_visibility_weeks])
        )
        
        // Filter prayers based on privacy settings
        filteredPrayers = filteredPrayers.filter((prayer: any) => {
          // Skip prayers without user_id (guest prayers are always visible)
          if (!prayer.user_id) return true
          
          const authorPrivacy = privacyMap.get(prayer.user_id) ?? null
          const isOwnPrayer = user?.id === prayer.user_id
          
          // Calculate the actual week when this prayer was created
          const prayerDate = dayjs(prayer.created_at)
          const prayerWeekStart = prayerDate.subtract(prayerDate.day(), 'day').format('YYYY-MM-DD')
          
          return isPrayerWeekVisible(prayerWeekStart, authorPrivacy, isOwnPrayer)
        })
      }
    }

    // PERFORMANCE BOOST: v_prayers_likes view already includes like_count and liked_by_me
    // No need for additional N+1 queries! This eliminates 3 database queries per request.
    
    // Still need comment counts (not in view yet - could be future optimization)
    let prayersWithComments: any = filteredPrayers
    
    if (filteredPrayers && filteredPrayers.length > 0) {
      const prayerIds = filteredPrayers.map((p: any) => p.id).filter(Boolean)
      
      if (prayerIds.length > 0) {
        // Only 1 additional query needed instead of 3!
        const { data: commentsData } = await supabase
          .from('comments')
          .select('prayer_id')
          .in('prayer_id', prayerIds)
        
        // Create comment count lookup
        const commentCounts = new Map<string, number>()
        commentsData?.forEach((comment: any) => {
          const count = commentCounts.get(comment.prayer_id) || 0
          commentCounts.set(comment.prayer_id, count + 1)
        })
        
        // Add comment counts to prayers (like data already included from view)
        prayersWithComments = (filteredPrayers as any[]).map((prayer: any) => ({
          ...prayer,
          comment_count: commentCounts.get(prayer.id) || 0
        })) as any
      }
    } else {
      // Set default values for empty results
      prayersWithComments = (filteredPrayers as any[])?.map((prayer: any) => ({
        ...prayer,
        comment_count: 0
      })) as any || []
    }

    // Return enhanced response with prayer wall information
    return NextResponse.json({
      prayers: prayersWithComments,
      wall: {
        id: wall.id,
        theme: wall.theme,
        stats: wall.stats,
        is_active: wall.is_active,
        can_manage: user ? await hasAdminAccess(user.id, orgId) : false
      },
      meta: {
        week_start: qsWeekStart,
        organization_id: orgId,
        read_only: !isCurrentWeek(qsWeekStart),
        is_new_wall: isNew
      }
    })
  } catch (e) {
    console.error('Unhandled GET error:', e)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

/**
 * POST /api/prayers
 * body: { content: string; author_name?: string; fellowship?: string }
 * OPTIMIZED: Uses prayer_walls for proper organization and performance
 * - Creates or updates prayer_wall for the current week
 * - Associates prayer with wall_id for optimized queries
 * - Updates wall statistics automatically
 */
export async function POST(req: Request) {
  const supabase = await createServerSupabase()

  // Get user if logged in, but allow guest posting
  const { data: { user } } = await supabase.auth.getUser()
  // Note: user can be null for guest users

  try {
    const body = await req.json()
    
    // Support both new and legacy formats
    let content: string = (body?.content ?? '').toString().trim()
    let thanksgiving_content: string | null = (body?.thanksgiving_content ?? '').toString().trim() || null
    let intercession_content: string | null = (body?.intercession_content ?? '').toString().trim() || null
    let author_name: string | null = (body?.author_name ?? '').toString().trim() || null
    let fellowship: string = (body?.fellowship ?? 'weekday').toString().trim()

    // Determine if this is new format (dual-field) or legacy format
    const hasNewContent = thanksgiving_content || intercession_content
    const hasLegacyContent = content.length > 0

    // Calculate total user content (no markers)
    const userContentLength = (thanksgiving_content?.length || 0) + (intercession_content?.length || 0)
    const totalContentLength = userContentLength + content.length

    // Validation
    if (!author_name) {
      return NextResponse.json({ error: '请输入您的姓名' }, { status: 400 })
    }
    
    // Content filtering validation
    const authorFilter = filterContent(author_name)
    if (!authorFilter.isValid) {
      return NextResponse.json({ error: '姓名可能包含不当词汇，请修改后重新提交' }, { status: 400 })
    }
    
    if (thanksgiving_content) {
      const thanksgivingFilter = filterContent(thanksgiving_content)
      if (!thanksgivingFilter.isValid) {
        return NextResponse.json({ error: thanksgivingFilter.reason || '感恩祷告内容可能包含不当词汇' }, { status: 400 })
      }
    }
    
    if (intercession_content) {
      const intercessionFilter = filterContent(intercession_content)
      if (!intercessionFilter.isValid) {
        return NextResponse.json({ error: intercessionFilter.reason || '代祷请求内容可能包含不当词汇' }, { status: 400 })
      }
    }
    
    if (content) {
      const contentFilter = filterContent(content)
      if (!contentFilter.isValid) {
        return NextResponse.json({ error: contentFilter.reason || '祷告内容可能包含不当词汇' }, { status: 400 })
      }
    }
    
    if (hasNewContent) {
      // New format validation - check user content only (500 chars)
      if (userContentLength === 0) {
        return NextResponse.json({ error: '至少需要填写感恩祷告或代祷请求中的一项' }, { status: 400 })
      }
      if (userContentLength > 500) {
        return NextResponse.json({ error: '总字数不能超过500字符' }, { status: 400 })
      }
    } else if (hasLegacyContent) {
      // Legacy format validation
      if (content.length > 500) {
        return NextResponse.json({ error: 'Invalid content' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    }

    // 限制作者名长度
    if (author_name && author_name.length > 24) {
      author_name = author_name.slice(0, 24)
    }

    // Validate fellowship value
    const validFellowships = ['sunday', 'ypf', 'jcf', 'student', 'lic', 'weekday']
    if (!validFellowships.includes(fellowship)) {
      fellowship = 'weekday'
    }

    // Phase 1: Get organization - reuse logic from GET method
    const bodyOrganizationId = body.organizationId
    const bodyOrgSlug = body.orgSlug
    
    let orgId: string
    
    if (bodyOrganizationId) {
      orgId = bodyOrganizationId
    } else if (bodyOrgSlug) {
      // Look up organization by slug
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', bodyOrgSlug)
        .single()
      
      if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }
      orgId = org.id
    } else {
      // BACKWARD COMPATIBILITY: Use database function for default MGC organization
      // This trigger will handle new prayers automatically
      const { data } = await supabase.rpc('get_default_organization_id')
      orgId = data
      console.log('SAFETY: Using default MGC organization for legacy request')
    }
    
    const weekStart = getCurrentWeekStartET()
    
    const wallResult = await getOrCreatePrayerWall(weekStart, orgId, user?.id)
    if ('error' in wallResult) {
      return NextResponse.json({ error: wallResult.error }, { status: 500 })
    }
    
    const { data: wall } = wallResult
    
    // Prepare insert data with proper typing
    let insertData: Database['public']['Tables']['prayers']['Insert'] = {
      author_name,
      user_id: user?.id || null,
      fellowship,
      organization_id: orgId, // KEY: Associate with organization
      wall_id: wall.id, // KEY: Associate with prayer wall for optimized queries
      content: '' // Will be set below based on content type
    }

    if (hasNewContent) {
      // New format: merge with markers into content field
      let mergedContent = ''
      if (thanksgiving_content) {
        mergedContent += `[感恩] ${thanksgiving_content}`
      }
      if (intercession_content) {
        if (mergedContent) mergedContent += '\n\n'
        mergedContent += `[代祷] ${intercession_content}`
      }
      
      // Safety check - should not happen with proper frontend validation
      if (mergedContent.length > 512) {
        return NextResponse.json({ 
          error: '内容过长，请减少字数' 
        }, { status: 400 })
      }
      
      insertData.content = mergedContent
      // Store in separate fields for frontend to know the structure
      insertData.thanksgiving_content = thanksgiving_content
      insertData.intercession_content = intercession_content
    } else {
      // Legacy format: single content field
      insertData.content = content
    }

    const { data, error } = await (supabase as any)
      .from('prayers')
      .insert([insertData])
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    
    // Update prayer wall statistics asynchronously (don't block response)
    if (data?.[0]) {
      updateWallStats(wall.id).catch(err => 
        console.error('Failed to update wall stats:', err)
      )
    }

    return NextResponse.json(data?.[0] || { success: true }, { status: 201 })
  } catch (err) {
    console.error('Unhandled POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/prayers?id=123
 * body: { content: string; author_name?: string }
 * - Updates user's own prayer
 * - Only allows editing current week prayers
 */
export async function PATCH(req: Request) {
  const supabase = await createServerSupabase()

  // Require login
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const prayerId = searchParams.get('id')
    
    if (!prayerId) {
      return NextResponse.json({ error: 'Prayer ID required' }, { status: 400 })
    }

    // Get the prayer to verify ownership and check week
    const { data: existingPrayer, error: fetchError } = await (supabase as any)
      .from('prayers')
      .select('user_id, created_at')
      .eq('id', prayerId)
      .single() as { data: PrayerOwnershipData | null, error: any }

    if (fetchError || !existingPrayer) {
      return NextResponse.json({ error: 'Prayer not found' }, { status: 404 })
    }

    // Check ownership
    if (existingPrayer.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Check if prayer is from current week (ET)
    const prayerDate = dayjs(existingPrayer.created_at)
    const prayerWeekStart = prayerDate.subtract(prayerDate.day(), 'day').format('YYYY-MM-DD')
    
    if (!isCurrentWeek(prayerWeekStart)) {
      return NextResponse.json({ error: 'Can only edit current week prayers' }, { status: 400 })
    }

    const body = await req.json()
    
    // Support both new and legacy formats (same as POST)
    let content: string = (body?.content ?? '').toString().trim()
    let thanksgiving_content: string | null = (body?.thanksgiving_content ?? '').toString().trim() || null
    let intercession_content: string | null = (body?.intercession_content ?? '').toString().trim() || null
    let author_name: string | null = (body?.author_name ?? '').toString().trim() || null
    let fellowship: string = (body?.fellowship ?? 'weekday').toString().trim()

    // Determine format and validate (reuse from POST)
    const hasNewContent = thanksgiving_content || intercession_content
    const hasLegacyContent = content.length > 0
    const userContentLength = (thanksgiving_content?.length || 0) + (intercession_content?.length || 0)
    const totalContentLength = userContentLength + content.length

    // Validation
    if (!author_name) {
      return NextResponse.json({ error: '请输入您的姓名' }, { status: 400 })
    }
    
    // Content filtering validation  
    const authorFilter = filterContent(author_name)
    if (!authorFilter.isValid) {
      return NextResponse.json({ error: '姓名可能包含不当词汇，请修改后重新提交' }, { status: 400 })
    }
    
    if (thanksgiving_content) {
      const thanksgivingFilter = filterContent(thanksgiving_content)
      if (!thanksgivingFilter.isValid) {
        return NextResponse.json({ error: thanksgivingFilter.reason || '感恩祷告内容可能包含不当词汇' }, { status: 400 })
      }
    }
    
    if (intercession_content) {
      const intercessionFilter = filterContent(intercession_content)
      if (!intercessionFilter.isValid) {
        return NextResponse.json({ error: intercessionFilter.reason || '代祷请求内容可能包含不当词汇' }, { status: 400 })
      }
    }
    
    if (content) {
      const contentFilter = filterContent(content)
      if (!contentFilter.isValid) {
        return NextResponse.json({ error: contentFilter.reason || '祷告内容可能包含不当词汇' }, { status: 400 })
      }
    }
    
    if (hasNewContent) {
      if (userContentLength === 0) {
        return NextResponse.json({ error: '至少需要填写感恩祷告或代祷请求中的一项' }, { status: 400 })
      }
      if (userContentLength > 500) {
        return NextResponse.json({ error: '总字数不能超过500字符' }, { status: 400 })
      }
    } else if (hasLegacyContent) {
      if (content.length > 500) {
        return NextResponse.json({ error: 'Invalid content' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    }

    if (author_name && author_name.length > 24) {
      author_name = author_name.slice(0, 24)
    }

    // Validate fellowship value
    const validFellowships = ['sunday', 'ypf', 'jcf', 'student', 'lic', 'weekday']
    if (!validFellowships.includes(fellowship)) {
      fellowship = 'weekday'
    }

    // Prepare update data with proper typing
    let updateData: Database['public']['Tables']['prayers']['Update'] = { 
      author_name, 
      fellowship 
    }

    if (hasNewContent) {
      // New format: merge with markers into content field
      let mergedContent = ''
      if (thanksgiving_content) {
        mergedContent += `[感恩] ${thanksgiving_content}`
      }
      if (intercession_content) {
        if (mergedContent) mergedContent += '\n\n'
        mergedContent += `[代祷] ${intercession_content}`
      }
      
      updateData.content = mergedContent
      // Store in separate fields for frontend to know the structure
      updateData.thanksgiving_content = thanksgiving_content
      updateData.intercession_content = intercession_content
    } else {
      // Legacy format: update single content field, clear dual fields
      updateData.content = content
      updateData.thanksgiving_content = null
      updateData.intercession_content = null
    }

    const { data: updatedPrayer, error: updateError } = await (supabase as any)
      .from('prayers')
      .update(updateData)
      .eq('id', prayerId)
      .eq('user_id', user.id) // Double-check ownership
      .select('wall_id')
      .single()

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    
    // Update prayer wall statistics asynchronously
    if (updatedPrayer?.wall_id) {
      updateWallStats(updatedPrayer.wall_id).catch(err => 
        console.error('Failed to update wall stats:', err)
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unhandled PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/prayers?id=123
 * - Deletes user's own prayer
 * - Only allows deleting current week prayers
 */
export async function DELETE(req: Request) {
  const supabase = await createServerSupabase()

  // Require login
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const prayerId = searchParams.get('id')
    
    if (!prayerId) {
      return NextResponse.json({ error: 'Prayer ID required' }, { status: 400 })
    }

    // Get the prayer to verify ownership and check week
    const { data: existingPrayer, error: fetchError } = await (supabase as any)
      .from('prayers')
      .select('user_id, created_at')
      .eq('id', prayerId)
      .single() as { data: PrayerOwnershipData | null, error: any }

    if (fetchError || !existingPrayer) {
      return NextResponse.json({ error: 'Prayer not found' }, { status: 404 })
    }

    // Check ownership
    if (existingPrayer.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Check if prayer is from current week (ET)
    const prayerDate = dayjs(existingPrayer.created_at)
    const prayerWeekStart = prayerDate.subtract(prayerDate.day(), 'day').format('YYYY-MM-DD')
    
    if (!isCurrentWeek(prayerWeekStart)) {
      return NextResponse.json({ error: 'Can only delete current week prayers' }, { status: 400 })
    }

    // Get wall_id before deleting for stats update
    const wallId = existingPrayer.user_id ? 
      await supabase.from('prayers').select('wall_id').eq('id', prayerId).single().then(r => r.data?.wall_id) : 
      null
    
    const { error: deleteError } = await supabase
      .from('prayers')
      .delete()
      .eq('id', prayerId)
      .eq('user_id', user.id) // Double-check ownership

    if (deleteError) {
      console.error('Supabase delete error:', deleteError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    
    // Update prayer wall statistics asynchronously
    if (wallId) {
      updateWallStats(wallId).catch(err => 
        console.error('Failed to update wall stats:', err)
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unhandled DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

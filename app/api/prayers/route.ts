import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getWeekRangeUtc, getCurrentWeekStartET, isCurrentWeek } from '@/lib/utils'
import { filterContent } from '@/lib/content-filter'
import dayjs from 'dayjs'

/**
 * GET /api/prayers?week_start=YYYY-MM-DD&fellowship=ypf
 * - 按"美东周日"为起点的当周范围（在服务端换算为 UTC ISO）过滤
 * - 如果未提供 week_start，则默认使用当前周（ET）的周日
 * - fellowship 参数用于过滤指定团契的祷告，不提供则显示所有
 */
export async function GET(req: Request) {
  const supabase = await createServerSupabase()
  try {
    const { searchParams } = new URL(req.url)
    const qsWeekStart = searchParams.get('week_start') || getCurrentWeekStartET()
    const fellowship = searchParams.get('fellowship')

    // 计算该周在 UTC 下的起止 ISO（用于数据库过滤）
    const { startUtcISO, endUtcISO } = getWeekRangeUtc(qsWeekStart)

    let query = supabase
      .from('prayers')
      .select(`
        id,
        content,
        author_name,
        user_id,
        created_at,
        fellowship,
        thanksgiving_content,
        intercession_content
      `)
      .gte('created_at', startUtcISO)
      .lt('created_at', endUtcISO)
      .order('created_at', { ascending: false })

    // Add fellowship filter if specified
    if (fellowship) {
      query = query.eq('fellowship', fellowship)
    } else {
      // When no fellowship filter, show all prayers (including those without fellowship)
      // This ensures backward compatibility with existing prayers
    }

    const { data: prayers, error } = await query

    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch prayers' }, { status: 500 })
    }

    // Get current user for like information
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    // Optimized: Fix N+1 query problem - get like data in batch queries
    let prayersWithLikes = prayers || []
    
    if (prayers && prayers.length > 0) {
      const prayerIds = prayers.map((p: any) => p.id).filter(Boolean)
      
      if (prayerIds.length > 0) {
        // Batch query 1: Get all like counts
        const { data: likesData } = await supabase
          .from('likes')
          .select('prayer_id')
          .in('prayer_id', prayerIds)
        
        // Batch query 2: Get user's like status (if logged in)
        let userLikesData: any[] = []
        if (userId) {
          const { data: userLikes } = await supabase
            .from('likes')
            .select('prayer_id')
            .eq('user_id', userId)
            .in('prayer_id', prayerIds)
          userLikesData = userLikes || []
        }
        
        // Create lookup maps for O(1) access
        const likeCounts = new Map<string, number>()
        const userLikedSet = new Set<string>()
        
        // Process like counts
        likesData?.forEach(like => {
          const count = likeCounts.get(like.prayer_id) || 0
          likeCounts.set(like.prayer_id, count + 1)
        })
        
        // Process user likes
        userLikesData.forEach(userLike => {
          userLikedSet.add(userLike.prayer_id)
        })
        
        // Combine results with like data
        prayersWithLikes = prayers.map((prayer: any) => ({
          ...prayer,
          like_count: likeCounts.get(prayer.id) || 0,
          liked_by_me: userLikedSet.has(prayer.id)
        }))
      }
    } else {
      // Set default values for empty results
      prayersWithLikes = prayers?.map((prayer: any) => ({
        ...prayer,
        like_count: 0,
        liked_by_me: false
      })) || []
    }

    return NextResponse.json(prayersWithLikes)
  } catch (e) {
    console.error('Unhandled GET error:', e)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

/**
 * POST /api/prayers
 * body: { content: string; author_name?: string; fellowship?: string }
 * - 服务器端进行基础校验（长度、必填）
 * - 只依赖默认 created_at=now()，周归属由查询时段决定
 * - fellowship 指定祷告所属团契，默认为 weekday
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

    // Prepare insert data
    const insertData: any = {
      author_name,
      user_id: user?.id || null,
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

    const { data, error } = await supabase
      .from('prayers')
      .insert([insertData])
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
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
    const { data: existingPrayer, error: fetchError } = await supabase
      .from('prayers')
      .select('user_id, created_at')
      .eq('id', prayerId)
      .single()

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

    // Prepare update data
    const updateData: any = { author_name, fellowship }

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

    const { error: updateError } = await supabase
      .from('prayers')
      .update(updateData)
      .eq('id', prayerId)
      .eq('user_id', user.id) // Double-check ownership

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
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
    const { data: existingPrayer, error: fetchError } = await supabase
      .from('prayers')
      .select('user_id, created_at')
      .eq('id', prayerId)
      .single()

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

    const { error: deleteError } = await supabase
      .from('prayers')
      .delete()
      .eq('id', prayerId)
      .eq('user_id', user.id) // Double-check ownership

    if (deleteError) {
      console.error('Supabase delete error:', deleteError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unhandled DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

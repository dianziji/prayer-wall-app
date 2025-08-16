import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  const userId = user.id
  const { searchParams } = new URL(request.url)
  
  // Parse query parameters
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')))
  const sort = searchParams.get('sort') || 'recent' // recent, most_liked, most_commented
  const timeRange = searchParams.get('timeRange') || 'all' // all, this_month, last_3_months
  const fellowship = searchParams.get('fellowship') || null // fellowship filter

  try {
    // Calculate time range filter
    let timeFilter = new Date(0).toISOString() // Default to beginning of time
    if (timeRange === 'this_month') {
      const thisMonth = new Date()
      thisMonth.setDate(1) // First day of this month
      thisMonth.setHours(0, 0, 0, 0)
      timeFilter = thisMonth.toISOString()
    } else if (timeRange === 'last_3_months') {
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      timeFilter = threeMonthsAgo.toISOString()
    }

    // Build base query using the prayers table directly
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
      .eq('user_id', userId)
      .gte('created_at', timeFilter)
    
    // Apply fellowship filter if specified
    if (fellowship && fellowship !== 'all') {
      query = query.eq('fellowship', fellowship)
    }

    // Apply sorting
    switch (sort) {
      case 'most_liked':
        query = query.order('like_count', { ascending: false })
        break
      case 'most_commented':
        // For commented sorting, we need to join with comments count
        // Since v_prayers_likes doesn't include comment count, we'll fall back to recent for now
        // This could be enhanced with a more complex query or additional view
        query = query.order('created_at', { ascending: false })
        break
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('v_prayers_likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', timeFilter)
    
    // Apply fellowship filter to count query as well
    if (fellowship && fellowship !== 'all') {
      countQuery = countQuery.eq('fellowship', fellowship)
    }
    
    const { count: totalCount } = await countQuery

    // Apply pagination
    const offset = (page - 1) * limit
    const { data: prayers, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch prayers' },
        { status: 500 }
      )
    }

    // For each prayer, get comment count and like info
    const prayersWithEngagement = await Promise.all(
      (prayers || []).map(async (prayer: any) => {
        if (prayer.id) {
          // Get comment count
          const { count: commentCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('prayer_id', prayer.id)
          
          // Get like count and user's like status
          const { count: likeCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('prayer_id', prayer.id)
          
          const { data: userLike } = await supabase
            .from('likes')
            .select('*', { head: true })
            .eq('prayer_id', prayer.id)
            .eq('user_id', userId)
            .maybeSingle()
          
          return {
            ...prayer,
            comment_count: commentCount || 0,
            like_count: likeCount || 0,
            liked_by_me: !!userLike
          }
        }
        return {
          ...prayer,
          comment_count: 0,
          like_count: 0,
          liked_by_me: false
        }
      })
    )

    // Sort by comment count if requested
    if (sort === 'most_commented') {
      prayersWithEngagement.sort((a, b) => ((b as any).comment_count || 0) - ((a as any).comment_count || 0))
    }

    const totalPages = Math.ceil((totalCount || 0) / limit)

    const response = {
      prayers: prayersWithEngagement,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching user prayers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user prayers' },
      { status: 500 }
    )
  }
}
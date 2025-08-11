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

    // Build base query using the v_prayers_likes view for enriched data
    let query = supabase
      .from('v_prayers_likes')
      .select(`
        id,
        content,
        author_name,
        user_id,
        created_at,
        like_count,
        liked_by_me
      `)
      .eq('user_id', userId)
      .gte('created_at', timeFilter)

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
    const { count: totalCount } = await supabase
      .from('v_prayers_likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', timeFilter)

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

    // For each prayer, get comment count (needed for all prayers, not just sorting)
    const prayersWithComments = await Promise.all(
      (prayers || []).map(async (prayer: any) => {
        if (prayer.id) {
          const { count: commentCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('prayer_id', prayer.id)
          
          return {
            ...prayer,
            comment_count: commentCount || 0
          }
        }
        return {
          ...prayer,
          comment_count: 0
        }
      })
    )

    // Sort by comment count if requested
    if (sort === 'most_commented') {
      prayersWithComments.sort((a, b) => ((b as any).comment_count || 0) - ((a as any).comment_count || 0))
    }

    const totalPages = Math.ceil((totalCount || 0) / limit)

    const response = {
      prayers: prayersWithComments,
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
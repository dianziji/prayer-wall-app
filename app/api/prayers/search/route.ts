import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabase()
    const { searchParams } = new URL(request.url)
    
    // Get search parameters
    const text = searchParams.get('text')
    const fellowship = searchParams.get('fellowship')
    const prayerType = searchParams.get('prayerType') || 'all'
    const dateRange = searchParams.get('dateRange') || 'week'
    const weekStart = searchParams.get('week_start')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    let query = supabase
      .from('v_prayers_likes')
      .select(`
        *,
        user_profiles!prayers_user_id_fkey (
          username,
          avatar_url
        )
      `)
    
    // Text search
    if (text && text.trim()) {
      query = query.or(`content.ilike.%${text}%,author_name.ilike.%${text}%,thanksgiving_content.ilike.%${text}%,intercession_content.ilike.%${text}%`)
    }
    
    // Fellowship filter
    if (fellowship && fellowship !== 'all') {
      query = query.eq('fellowship', fellowship)
    }
    
    // Prayer type filter
    if (prayerType !== 'all') {
      switch (prayerType) {
        case 'thanksgiving':
          query = query.not('thanksgiving_content', 'is', null)
          break
        case 'intercession':
          query = query.not('intercession_content', 'is', null)
          break
        case 'both':
          query = query.not('thanksgiving_content', 'is', null).not('intercession_content', 'is', null)
          break
      }
    }
    
    // Date range filter
    const now = new Date()
    if (dateRange === 'week' && weekStart) {
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      query = query.gte('created_at', `${weekStart}T00:00:00Z`)
                   .lt('created_at', `${weekEnd.toISOString().split('T')[0]}T00:00:00Z`)
    } else if (dateRange === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      query = query.gte('created_at', monthStart.toISOString())
    }
    
    // Pagination
    const offset = (page - 1) * limit
    query = query.order('created_at', { ascending: false })
                 .range(offset, offset + limit - 1)

    const { data: prayers, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('prayers')
      .select('id', { count: 'exact', head: true })
    
    if (text && text.trim()) {
      countQuery = countQuery.or(`content.ilike.%${text}%,author_name.ilike.%${text}%`)
    }
    if (fellowship && fellowship !== 'all') {
      countQuery = countQuery.eq('fellowship', fellowship)
    }
    
    const { count } = await countQuery

    return NextResponse.json({
      prayers: prayers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      filters: {
        text,
        fellowship,
        prayerType,
        dateRange
      }
    })

  } catch (error) {
    console.error('Prayer search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
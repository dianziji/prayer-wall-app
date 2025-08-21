import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  
  // Check authentication - use getUser() instead of getSession() like other routes
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  const userId = user.id

  try {
    // Get total prayers count
    const { count: totalPrayers } = await supabase
      .from('prayers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Optimized: Use aggregate queries to get likes and comments count more efficiently
    let totalLikes = 0
    let totalComments = 0

    // Single query to get likes count using a join with prayers
    const { count: likesCount } = await supabase
      .from('likes')
      .select('*, prayers!inner(user_id)', { count: 'exact', head: true })
      .eq('prayers.user_id', userId)
    
    totalLikes = likesCount || 0

    // Single query to get comments count using a join with prayers  
    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*, prayers!inner(user_id)', { count: 'exact', head: true })
      .eq('prayers.user_id', userId)
    
    totalComments = commentsCount || 0

    // Get most active week (week with most prayers)
    const { data: weeklyData } = await supabase
      .from('prayers')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    let mostActiveWeek = 'N/A'
    if (weeklyData && weeklyData.length > 0) {
      // Group prayers by week and find the week with most prayers
      const weekCounts = new Map<string, number>()
      
      weeklyData.forEach(prayer => {
        if (!prayer.created_at) return
        const date = new Date(prayer.created_at)
        // Get Sunday of the week (normalized to ET Sunday)
        const sunday = new Date(date)
        sunday.setDate(date.getDate() - date.getDay())
        const weekKey = sunday.toISOString().split('T')[0]
        
        weekCounts.set(weekKey, (weekCounts.get(weekKey) || 0) + 1)
      })
      
      // Find week with maximum prayers
      let maxCount = 0
      let maxWeek = ''
      for (const [week, count] of weekCounts) {
        if (count > maxCount) {
          maxCount = count
          maxWeek = week
        }
      }
      
      if (maxWeek) {
        const weekStart = new Date(maxWeek)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        mostActiveWeek = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      }
    }

    // Get recent activity for the last 4 weeks
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
    
    const { data: recentData } = await supabase
      .from('prayers')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', fourWeeksAgo.toISOString())
      .order('created_at', { ascending: false })

    // Group recent activity by week
    const recentActivity = [0, 0, 0, 0] // Last 4 weeks
    if (recentData) {
      recentData.forEach(prayer => {
        if (!prayer.created_at) return
        const prayerDate = new Date(prayer.created_at)
        const weeksAgo = Math.floor((Date.now() - prayerDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
        if (weeksAgo >= 0 && weeksAgo < 4) {
          recentActivity[weeksAgo]++
        }
      })
    }

    const stats = {
      totalPrayers: totalPrayers || 0,
      totalLikes,
      totalComments,
      mostActiveWeek,
      recentActivity: recentActivity.reverse() // Most recent week last
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    )
  }
}
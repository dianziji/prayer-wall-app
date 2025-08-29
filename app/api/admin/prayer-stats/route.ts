import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getCurrentWeekStartET } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabase()
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getUser()
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, organization_id')
      .eq('user_id', session.user.id)

    const hasAdminRole = userRoles?.some(role => 
      role.role === 'admin' || role.role === 'org_admin'
    )
    
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const weekStart = searchParams.get('week_start') || getCurrentWeekStartET()

    // Get prayer stats for the specified week
    const { data: prayers, error: prayersError } = await supabase
      .from('v_prayers_likes')
      .select(`
        id,
        author_name, 
        fellowship,
        thanksgiving_content,
        intercession_content,
        created_at,
        like_count
      `)
      .gte('created_at', `${weekStart}T00:00:00.000Z`)
      .lt('created_at', `${weekStart}T23:59:59.999Z`)

    if (prayersError) {
      return NextResponse.json({ error: prayersError.message }, { status: 500 })
    }

    const prayerList = prayers || []

    // Calculate prayer type breakdown
    const prayerTypes = {
      thanksgiving_only: 0,
      intercession_only: 0,
      both: 0
    }

    const fellowshipCounts: Record<string, number> = {}
    const participantCounts: Record<string, number> = {}

    for (const prayer of prayerList) {
      const hasThanksgiving = Boolean(prayer.thanksgiving_content?.trim())
      const hasIntercession = Boolean(prayer.intercession_content?.trim())
      
      if (hasThanksgiving && hasIntercession) {
        prayerTypes.both++
      } else if (hasThanksgiving) {
        prayerTypes.thanksgiving_only++
      } else if (hasIntercession) {
        prayerTypes.intercession_only++
      }

      // Fellowship breakdown
      const fellowship = prayer.fellowship || 'other'
      fellowshipCounts[fellowship] = (fellowshipCounts[fellowship] || 0) + 1

      // Participant counts
      if (prayer.author_name) {
        participantCounts[prayer.author_name] = (participantCounts[prayer.author_name] || 0) + 1
      }
    }

    // Get weekly trend (last 4 weeks)
    const fourWeeksAgo = new Date(weekStart)
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
    
    const { data: weeklyData, error: weeklyError } = await supabase
      .from('archive_weeks')
      .select('week_start_et, prayer_count')
      .gte('week_start_et', fourWeeksAgo.toISOString().split('T')[0])
      .order('week_start_et', { ascending: false })
      .limit(4)

    const stats = {
      total_prayers: prayerList.length,
      prayer_types: prayerTypes,
      fellowship_breakdown: Object.entries(fellowshipCounts).map(([fellowship, count]) => ({
        fellowship,
        count
      })),
      weekly_trend: weeklyData || [],
      top_participants: Object.entries(participantCounts)
        .map(([author_name, prayer_count]) => ({ author_name, prayer_count }))
        .sort((a, b) => b.prayer_count - a.prayer_count)
        .slice(0, 5)
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Prayer stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
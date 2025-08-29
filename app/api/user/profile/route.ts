import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabase()
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getUser()
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Get user roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role, organization_id')
      .eq('user_id', session.user.id)

    // Get prayer statistics
    const { data: prayerStats } = await supabase
      .from('prayers')
      .select('id, created_at, fellowship')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    const stats = {
      total_prayers: prayerStats?.length || 0,
      recent_prayers: prayerStats?.slice(0, 5) || [],
      fellowships_participated: [...new Set(prayerStats?.map(p => p.fellowship).filter(Boolean))] || [],
      first_prayer_date: prayerStats?.length ? prayerStats[prayerStats.length - 1].created_at : null
    }

    return NextResponse.json({
      profile: profile || null,
      roles: roles || [],
      stats,
      user: {
        id: session.user.id,
        email: session.user.email,
        created_at: session.user.created_at
      }
    })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabase()
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getUser()
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { username, avatar_url, default_fellowship, prayers_visibility_weeks } = body

    // Update user profile
    const { data: profile, error: updateError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: session.user.id,
        username,
        avatar_url,
        default_fellowship,
        prayers_visibility_weeks,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
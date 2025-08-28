import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getCurrentWeekStartET } from '@/lib/utils'

export async function POST(request: Request) {
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
      role.role === 'admin'
    )
    
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get demo organization
    const { data: demoOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'demo')
      .single()

    if (!demoOrg) {
      return NextResponse.json({ error: 'Demo organization not found' }, { status: 404 })
    }

    const currentWeek = getCurrentWeekStartET()

    // Create demo prayer wall for current week
    const { data: demoWall, error: wallError } = await supabase
      .from('prayer_walls')
      .upsert({
        week_start: currentWeek,
        organization_id: demoOrg.id,
        theme: {
          title: 'Demo Prayer Wall',
          description: 'Welcome to our prayer community - share your heart with us',
          color: '#e0f2fe'
        },
        is_active: true,
        created_by: session.user.id
      }, { 
        onConflict: 'week_start,organization_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (wallError) {
      return NextResponse.json({ error: wallError.message }, { status: 500 })
    }

    // Demo prayers data
    const demoData = [
      {
        content: "感恩: 感谢神赐给我们健康的身体和美好的家庭",
        thanksgiving_content: "感谢神赐给我们健康的身体和美好的家庭",
        intercession_content: null,
        author_name: "张弟兄",
        fellowship: "sunday",
        wall_id: demoWall.id,
        organization_id: demoOrg.id,
        user_id: null,
        guest_id: `demo_guest_1_${Date.now()}`
      },
      {
        content: "代祷: 为生病的朋友祷告，求神医治",
        thanksgiving_content: null,
        intercession_content: "为生病的朋友祷告，求神医治",
        author_name: "李姊妹",
        fellowship: "ypf",
        wall_id: demoWall.id,
        organization_id: demoOrg.id,
        user_id: null,
        guest_id: `demo_guest_2_${Date.now()}`
      },
      {
        content: "感恩: Thank God for His grace and protection | 代祷: Pray for world peace",
        thanksgiving_content: "Thank God for His grace and protection",
        intercession_content: "Pray for world peace",
        author_name: "Demo User",
        fellowship: "student",
        wall_id: demoWall.id,
        organization_id: demoOrg.id,
        user_id: null,
        guest_id: `demo_guest_3_${Date.now()}`
      },
      {
        content: "代祷: 为教会复兴祷告，求神带领我们在真理中成长",
        thanksgiving_content: null,
        intercession_content: "为教会复兴祷告，求神带领我们在真理中成长",
        author_name: "王牧师",
        fellowship: "weekday",
        wall_id: demoWall.id,
        organization_id: demoOrg.id,
        user_id: null,
        guest_id: `demo_guest_4_${Date.now()}`
      }
    ]

    // Insert demo prayers
    const { error: prayersError } = await supabase
      .from('prayers')
      .insert(demoData)

    if (prayersError) {
      console.error('Demo prayers error:', prayersError)
      return NextResponse.json({ error: prayersError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Demo data created successfully',
      organization_id: demoOrg.id,
      wall_id: demoWall.id,
      prayers_created: demoData.length
    })

  } catch (error) {
    console.error('Demo data creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
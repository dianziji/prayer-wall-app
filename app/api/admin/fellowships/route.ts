import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/fellowships?orgId=xxx - 获取组织的Fellowship列表
 */
export async function GET(req: Request) {
  const supabase = await createServerSupabase()
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('orgId')

  try {
    // Check if user is authenticated and has admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Check if user has admin/moderator role for this organization
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', orgId)
      .in('role', ['admin', 'moderator'])

    if (!userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get fellowships for this organization
    const { data: fellowships, error } = await supabase
      .from('fellowships')
      .select('*')
      .eq('organization_id', orgId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching fellowships:', error)
      return NextResponse.json({ error: 'Failed to fetch fellowships' }, { status: 500 })
    }

    return NextResponse.json({ fellowships })
  } catch (e) {
    console.error('Fellowship API error:', e)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

/**
 * POST /api/admin/fellowships - 创建新的Fellowship
 */
export async function POST(req: Request) {
  const supabase = await createServerSupabase()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      id,
      display_name,
      name_en,
      description,
      description_en,
      color,
      organization_id,
      sort_order
    } = body

    if (!id || !display_name || !organization_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: id, display_name, organization_id' 
      }, { status: 400 })
    }

    // Check if user has admin/moderator role for this organization
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .in('role', ['admin', 'moderator'])

    if (!userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if fellowship ID already exists
    const { data: existingFellowship } = await supabase
      .from('fellowships')
      .select('id')
      .eq('id', id)
      .single()

    if (existingFellowship) {
      return NextResponse.json({ error: 'Fellowship ID already exists' }, { status: 409 })
    }

    // Get next sort order if not provided
    let finalSortOrder = sort_order
    if (!finalSortOrder) {
      const { data: lastFellowship } = await supabase
        .from('fellowships')
        .select('sort_order')
        .eq('organization_id', organization_id)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()

      finalSortOrder = (lastFellowship?.sort_order || 0) + 1
    }

    // Create new fellowship
    const { data: fellowship, error } = await supabase
      .from('fellowships')
      .insert({
        id,
        display_name,
        name_en,
        description,
        description_en,
        color,
        organization_id,
        sort_order: finalSortOrder,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating fellowship:', error)
      return NextResponse.json({ error: 'Failed to create fellowship' }, { status: 500 })
    }

    return NextResponse.json({ fellowship }, { status: 201 })
  } catch (e) {
    console.error('Fellowship creation error:', e)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
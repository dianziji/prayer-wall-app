import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/admin/fellowships/[fellowshipId] - 更新Fellowship
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ fellowshipId: string }> }
) {
  const supabase = await createServerSupabase()
  const { fellowshipId } = await params

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    console.log('Update request body:', body)
    console.log('Fellowship ID:', fellowshipId)
    
    const {
      display_name,
      name_en,
      description,
      description_en,
      color,
      is_active,
      sort_order
    } = body

    // Get current fellowship to check organization_id
    const { data: currentFellowship, error: fetchError } = await supabase
      .from('fellowships')
      .select('*')
      .eq('id', fellowshipId)
      .single()

    if (fetchError || !currentFellowship) {
      return NextResponse.json({ error: 'Fellowship not found' }, { status: 404 })
    }

    // Check if user has admin/moderator role for this organization
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', currentFellowship.organization_id)
      .in('role', ['admin', 'moderator'])

    if (!userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Update fellowship
    const updateData: any = {}
    if (display_name !== undefined) updateData.display_name = display_name
    if (name_en !== undefined) updateData.name_en = name_en
    if (description !== undefined) updateData.description = description
    if (description_en !== undefined) updateData.description_en = description_en
    if (color !== undefined) updateData.color = color
    if (is_active !== undefined) updateData.is_active = is_active
    if (sort_order !== undefined) updateData.sort_order = sort_order

    // If no fields to update, return current fellowship
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ fellowship: currentFellowship })
    }

    const { data: fellowships, error } = await supabase
      .from('fellowships')
      .update(updateData)
      .eq('id', fellowshipId)
      .select()

    if (error) {
      console.error('Error updating fellowship:', error)
      return NextResponse.json({ error: 'Failed to update fellowship' }, { status: 500 })
    }

    console.log('Update result:', { fellowships, updateData, fellowshipId })

    const fellowship = fellowships?.[0]

    if (!fellowship) {
      console.log('Fellowship not found after update. Fetching current state...')
      // Try to fetch the current fellowship to see what happened
      const { data: currentState } = await supabase
        .from('fellowships')
        .select('*')
        .eq('id', fellowshipId)
        .single()
      
      console.log('Current fellowship state:', currentState)
      return NextResponse.json({ 
        error: 'Fellowship not found after update',
        debug: { updateData, fellowshipId, currentState }
      }, { status: 404 })
    }

    return NextResponse.json({ fellowship })
  } catch (e) {
    console.error('Fellowship update error:', e)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

/**
 * DELETE /api/admin/fellowships/[fellowshipId] - 归档Fellowship (不支持实际删除)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ fellowshipId: string }> }
) {
  const supabase = await createServerSupabase()
  const { fellowshipId } = await params

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current fellowship and check usage
    const { data: fellowship, error: fetchError } = await supabase
      .from('fellowships')
      .select('*')
      .eq('id', fellowshipId)
      .single()

    if (fetchError || !fellowship) {
      return NextResponse.json({ error: 'Fellowship not found' }, { status: 404 })
    }

    // Check if user has admin/moderator role for this organization
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', fellowship.organization_id)
      .in('role', ['admin', 'moderator'])

    if (!userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if fellowship is being used
    const { count: prayerCount } = await supabase
      .from('prayers')
      .select('*', { count: 'exact', head: true })
      .eq('fellowship', fellowshipId)
      .eq('organization_id', fellowship.organization_id)

    // Always set fellowship to inactive instead of deleting
    const { data: inactivatedFellowships, error } = await supabase
      .from('fellowships')
      .update({ is_active: false })
      .eq('id', fellowshipId)
      .select()

    if (error) {
      console.error('Error deactivating fellowship:', error)
      return NextResponse.json({ error: 'Failed to deactivate fellowship' }, { status: 500 })
    }

    const inactivatedFellowship = inactivatedFellowships?.[0]
    
    const message = prayerCount && prayerCount > 0 
      ? `Fellowship archived successfully (${prayerCount} prayers preserved)`
      : 'Fellowship deactivated successfully'
    
    return NextResponse.json({
      message,
      fellowship: inactivatedFellowship,
      action: prayerCount && prayerCount > 0 ? 'archived' : 'deactivated',
      prayerCount: prayerCount || 0
    })
  } catch (e) {
    console.error('Fellowship deactivation error:', e)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
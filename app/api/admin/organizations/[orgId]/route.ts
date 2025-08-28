import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/admin/organizations/[orgId] - 更新组织信息
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const supabase = await createServerSupabase()
  const { orgId } = await params

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    console.log('Update organization request:', { orgId, body })
    
    const {
      name,
      slug,
      default_language,
      timezone,
      is_public
    } = body

    // Get current organization
    const { data: currentOrg, error: fetchError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (fetchError || !currentOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Check if user has admin role for this organization
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', orgId)
      .eq('role', 'admin')

    if (!userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: 'Only organization admins can update organization settings' }, { status: 403 })
    }

    // Check if slug already exists (if changing slug)
    if (slug && slug !== currentOrg.slug) {
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .neq('id', orgId)
        .single()

      if (existingOrg) {
        return NextResponse.json({ error: 'Organization slug already exists' }, { status: 409 })
      }
    }

    // Update organization
    const updateData: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (default_language !== undefined) updateData.default_language = default_language
    if (timezone !== undefined) updateData.timezone = timezone
    if (is_public !== undefined) updateData.is_public = is_public

    // If no fields to update, return current organization
    if (Object.keys(updateData).length === 1) { // only updated_at
      return NextResponse.json({ organization: currentOrg })
    }

    const { data: organizations, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', orgId)
      .select()

    if (error) {
      console.error('Error updating organization:', error)
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
    }

    console.log('Organization update result:', { organizations, updateData, orgId })

    const organization = organizations?.[0]

    if (!organization) {
      console.log('Organization not found after update. Fetching current state...')
      const { data: currentState } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()
      
      console.log('Current organization state:', currentState)
      return NextResponse.json({ 
        error: 'Organization not found after update',
        debug: { updateData, orgId, currentState }
      }, { status: 404 })
    }

    return NextResponse.json({ organization })
  } catch (e) {
    console.error('Organization update error:', e)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

/**
 * DELETE /api/admin/organizations/[orgId] - 软删除组织（设为非公开并归档）
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const supabase = await createServerSupabase()
  const { orgId } = await params

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current organization
    const { data: organization, error: fetchError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (fetchError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Check if user is super admin (has admin roles in multiple orgs)
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .eq('role', 'admin')

    if (!userRoles || userRoles.length < 2) {
      return NextResponse.json({ 
        error: 'Only super administrators can archive organizations' 
      }, { status: 403 })
    }

    // Check if organization has data (prayers, walls, etc.)
    const { count: prayerCount } = await supabase
      .from('prayers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)

    const { count: wallCount } = await supabase
      .from('prayer_walls')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)

    // Archive organization by making it private and adding archived flag in name
    const archivedName = organization.name.includes('[ARCHIVED]') 
      ? organization.name 
      : `[ARCHIVED] ${organization.name}`

    const { data: archivedOrganizations, error } = await supabase
      .from('organizations')
      .update({ 
        name: archivedName,
        is_public: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', orgId)
      .select()

    if (error) {
      console.error('Error archiving organization:', error)
      return NextResponse.json({ error: 'Failed to archive organization' }, { status: 500 })
    }

    const archivedOrganization = archivedOrganizations?.[0]
    
    return NextResponse.json({
      message: `Organization archived successfully (${prayerCount || 0} prayers, ${wallCount || 0} walls preserved)`,
      organization: archivedOrganization,
      action: 'archived',
      preservedData: {
        prayers: prayerCount || 0,
        walls: wallCount || 0
      }
    })
  } catch (e) {
    console.error('Organization archival error:', e)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
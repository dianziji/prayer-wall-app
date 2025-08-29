import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/organizations - 获取所有组织（超级管理员可见全部，普通管理员仅可见自己的）
 */
export async function GET() {
  const supabase = await createServerSupabase()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user roles to determine access level
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, organization_id, organizations(id, name, slug, default_language, timezone, is_public, created_at)')
      .eq('user_id', user.id)
      .in('role', ['admin', 'moderator'])

    if (!userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if user is super admin (has admin role in multiple orgs)
    const adminRoles = userRoles.filter(role => role.role === 'admin')
    const isSuperAdmin = adminRoles.length > 1

    let organizations

    if (isSuperAdmin) {
      // Super admin can see all organizations
      const { data: allOrgs, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching all organizations:', error)
        return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
      }

      organizations = allOrgs
    } else {
      // Regular admin can only see organizations they have roles in
      organizations = userRoles.map(role => role.organizations).filter(Boolean)
    }

    return NextResponse.json({ organizations, isSuperAdmin })
  } catch (e) {
    console.error('Organizations API error:', e)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

/**
 * POST /api/admin/organizations - 创建新的组织
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
      name,
      slug,
      default_language = 'zh-CN',
      timezone = 'America/New_York',
      is_public = false
    } = body

    if (!name || !slug) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, slug' 
      }, { status: 400 })
    }

    // Check if user has permission to create organizations (must be super admin)
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .eq('role', 'admin')

    if (!userRoles || userRoles.length < 2) {
      return NextResponse.json({ 
        error: 'Only super administrators can create organizations' 
      }, { status: 403 })
    }

    // Check if slug already exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingOrg) {
      return NextResponse.json({ error: 'Organization slug already exists' }, { status: 409 })
    }

    // Create new organization
    const { data: organization, error } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        default_language,
        timezone,
        is_public,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating organization:', error)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // Grant admin role to creator
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        organization_id: organization.id,
        role: 'admin',
        granted_by: user.id,
        granted_at: new Date().toISOString(),
        notes: 'Organization creator'
      })

    if (roleError) {
      console.error('Error granting admin role:', roleError)
      // Don't fail the request but log the error
    }

    return NextResponse.json({ organization }, { status: 201 })
  } catch (e) {
    console.error('Organization creation error:', e)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import { getCurrentWeekStartET } from '@/lib/utils'

type Props = {
  params: Promise<{ orgSlug: string }>
}

export default async function OrganizationHomePage({ params }: Props) {
  const { orgSlug } = await params
  const supabase = await createServerSupabase()

  // Verify organization exists
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, slug, is_public')
    .eq('slug', orgSlug)
    .single()

  if (!organization) {
    redirect('/404')
  }

  // Check if organization is public or user has access
  if (!organization.is_public) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/auth/login')
    }

    // Check if user has access to this organization
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organization.id)
      .single()

    if (!userRole) {
      redirect('/unauthorized')
    }
  }

  // Redirect to current week
  const currentWeek = getCurrentWeekStartET()
  redirect(`/${orgSlug}/week/${currentWeek}`)
}
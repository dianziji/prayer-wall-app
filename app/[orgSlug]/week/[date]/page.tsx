import { WeeklyWallClient } from '@/components/weekly-wall-client'
import { isCurrentWeek, normalizeToEtSunday } from '@/lib/utils'
import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ orgSlug: string; date: string }>
}

export default async function OrganizationWeekPage({ params }: Props) {
  const { orgSlug, date } = await params
  const supabase = await createServerSupabase()
  
  // Normalize the date to Sunday
  const canonical = normalizeToEtSunday(String(date ?? ''))

  // Redirect to canonical Sunday date if needed
  if (canonical !== date) {
    redirect(`/${orgSlug}/week/${canonical}`)
  }

  // Verify organization exists and get its ID
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

  const readOnly = !isCurrentWeek(canonical)

  return (
    <>
      <WeeklyWallClient 
        weekStart={canonical} 
        readOnly={readOnly} 
        organizationId={organization.id}
        organizationName={organization.name}
        organizationSlug={organization.slug}
      />
    </>
  )
}
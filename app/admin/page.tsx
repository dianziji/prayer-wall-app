import { createServerSupabase } from '@/lib/supabase-server'
import { getCurrentWeekStartET } from '@/lib/utils'
import AdminClient from '@/components/admin-client'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createServerSupabase()
  
  // Check if user is authenticated and has admin role
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Check if user has admin role for any organization
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role, organization_id, organizations(id, name, slug, is_public)')
    .eq('user_id', user.id)
    .in('role', ['admin', 'moderator'])

  if (!userRoles || userRoles.length === 0) {
    redirect('/')
  }

  // Get current week prayer wall
  const currentWeek = getCurrentWeekStartET()
  const { data: currentWall } = await supabase
    .from('prayer_walls')
    .select('*')
    .eq('week_start', currentWeek)
    .single()

  return (
    <AdminClient 
      currentWall={currentWall}
      userRoles={userRoles}
      weekStart={currentWeek}
    />
  )
}
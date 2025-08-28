import { createServerSupabase } from '@/lib/supabase-server'
import type { PrayerWallRow, PrayerWallInsert, PrayerWallUpdate } from '@/types/models'

/**
 * Get or create a prayer wall for a specific week and organization
 * This is the core function for the prayer_walls optimization
 */
export async function getOrCreatePrayerWall(
  weekStart: string,
  organizationId: string,
  userId?: string
): Promise<{ data: PrayerWallRow; isNew: boolean } | { error: string }> {
  const supabase = await createServerSupabase()

  try {
    // First, try to get existing prayer wall
    let { data: wall, error } = await supabase
      .from('prayer_walls')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('week_start', weekStart)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" - that's expected for new weeks
      console.error('Error fetching prayer wall:', error)
      return { error: 'Failed to fetch prayer wall' }
    }

    if (wall) {
      return { data: wall as PrayerWallRow, isNew: false }
    }

    // Create new prayer wall for this week
    const newWallData: PrayerWallInsert = {
      organization_id: organizationId,
      week_start: weekStart,
      is_active: true,
      stats: { 
        prayer_count: 0, 
        participant_count: 0,
        total_likes: 0,
        total_comments: 0
      },
      created_by: userId || null
    }

    const { data: newWall, error: createError } = await supabase
      .from('prayer_walls')
      .insert(newWallData as any)
      .select()
      .single()

    if (createError) {
      console.error('Error creating prayer wall:', createError)
      return { error: 'Failed to create prayer wall' }
    }

    return { data: newWall as PrayerWallRow, isNew: true }
  } catch (err) {
    console.error('Unexpected error in getOrCreatePrayerWall:', err)
    return { error: 'Internal server error' }
  }
}

/**
 * Update prayer wall statistics
 * Should be called after prayer operations (create, delete, like, comment)
 */
export async function updateWallStats(wallId: string): Promise<void> {
  const supabase = await createServerSupabase()

  try {
    // Get all prayers for this wall
    const { data: prayers } = await supabase
      .from('prayers')
      .select('id, user_id, fellowship, thanksgiving_content, intercession_content')
      .eq('wall_id', wallId)

    if (!prayers?.length) {
      // No prayers, set zero stats
      await supabase
        .from('prayer_walls')
        .update({ 
          stats: { 
            prayer_count: 0, 
            participant_count: 0, 
            total_likes: 0, 
            total_comments: 0,
            fellowship_breakdown: {},
            prayer_types: { thanksgiving: 0, intercession: 0, mixed: 0 },
            last_updated: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', wallId)
      return
    }

    const prayerIds = prayers.map((p: any) => p.id).filter(Boolean)

    // Get aggregated likes and comments for this wall
    const [likesData, commentsData] = await Promise.all([
      supabase.from('likes').select('id').in('prayer_id', prayerIds),
      supabase.from('comments').select('id').in('prayer_id', prayerIds)
    ])

    // Calculate statistics
    const stats = {
      prayer_count: prayers.length,
      participant_count: new Set(prayers.map((p: any) => p.user_id).filter(Boolean)).size,
      total_likes: likesData.data?.length || 0,
      total_comments: commentsData.data?.length || 0,
      fellowship_breakdown: prayers.reduce((acc: any, p: any) => {
        const fellowship = p.fellowship || 'weekday'
        acc[fellowship] = (acc[fellowship] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      prayer_types: {
        thanksgiving: prayers.filter((p: any) => p.thanksgiving_content).length,
        intercession: prayers.filter((p: any) => p.intercession_content).length,
        mixed: prayers.filter((p: any) => p.thanksgiving_content && p.intercession_content).length
      },
      last_updated: new Date().toISOString()
    }

    // Update the prayer wall with new stats
    await supabase
      .from('prayer_walls')
      .update({ 
        stats,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', wallId)

  } catch (err) {
    console.error('Error updating wall stats:', err)
    // Don't throw - stats update failure shouldn't break the main operation
  }
}

/**
 * Get default organization ID for backward compatibility
 * EMERGENCY HOTFIX: Use hardcoded ID to avoid database dependency issues
 */
export async function getDefaultOrganizationId(): Promise<string> {
  // HOTFIX: Return hardcoded MGC organization ID for immediate production fix
  return '15da0616-bd27-44a2-bf98-353c094d7581'
}

/**
 * Check if user has admin access to organization
 */
export async function hasAdminAccess(userId: string | undefined, orgId: string): Promise<boolean> {
  if (!userId) return false
  
  const supabase = await createServerSupabase()
  
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .maybeSingle()
  
  return ['admin', 'moderator'].includes((data as any)?.role || 'member')
}

/**
 * Update prayer wall theme (admin function)
 */
export async function updateWallTheme(
  wallId: string, 
  theme: any, 
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabase()

  try {
    // Get wall to check organization
    const { data: wall } = await supabase
      .from('prayer_walls')
      .select('organization_id')
      .eq('id', wallId)
      .maybeSingle()

    if (!wall) {
      return { success: false, error: 'Prayer wall not found' }
    }

    // Check admin access
    if (!await hasAdminAccess(userId, (wall as any).organization_id!)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Update theme
    const { error } = await supabase
      .from('prayer_walls')
      .update({ 
        theme, 
        updated_by: userId, 
        updated_at: new Date().toISOString() 
      } as any)
      .eq('id', wallId)

    if (error) {
      console.error('Error updating wall theme:', error)
      return { success: false, error: 'Failed to update theme' }
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error in updateWallTheme:', err)
    return { success: false, error: 'Internal server error' }
  }
}
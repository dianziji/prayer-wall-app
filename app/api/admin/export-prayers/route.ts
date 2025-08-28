import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabase()
    const { searchParams } = new URL(request.url)
    
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

    // Get export parameters
    const format = searchParams.get('format') || 'csv'
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const fellowship = searchParams.get('fellowship')
    const prayerType = searchParams.get('prayer_type')

    let query = supabase
      .from('v_prayers_likes')
      .select(`
        id,
        content,
        thanksgiving_content,
        intercession_content,
        author_name,
        fellowship,
        created_at,
        like_count,
        user_profiles!prayers_user_id_fkey (
          username
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (dateFrom) {
      query = query.gte('created_at', `${dateFrom}T00:00:00Z`)
    }
    if (dateTo) {
      query = query.lte('created_at', `${dateTo}T23:59:59Z`)
    }
    if (fellowship && fellowship !== 'all') {
      query = query.eq('fellowship', fellowship)
    }
    if (prayerType && prayerType !== 'all') {
      switch (prayerType) {
        case 'thanksgiving':
          query = query.not('thanksgiving_content', 'is', null)
          break
        case 'intercession':
          query = query.not('intercession_content', 'is', null)
          break
        case 'both':
          query = query.not('thanksgiving_content', 'is', null).not('intercession_content', 'is', null)
          break
      }
    }

    const { data: prayers, error } = await query.limit(1000) // Limit exports to 1000 records

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (format === 'json') {
      return NextResponse.json({
        prayers: prayers || [],
        exported_at: new Date().toISOString(),
        filters: {
          date_from: dateFrom,
          date_to: dateTo,
          fellowship,
          prayer_type: prayerType
        }
      })
    }

    // CSV Export
    const csvHeaders = [
      'ID',
      'Author Name',
      'Fellowship',
      'Thanksgiving Content',
      'Intercession Content',
      'Like Count',
      'Created At'
    ]

    const csvRows = (prayers || []).map(prayer => [
      prayer.id,
      prayer.author_name || '',
      prayer.fellowship || '',
      (prayer as any).thanksgiving_content || '',
      (prayer as any).intercession_content || '',
      (prayer as any).like_count || 0,
      prayer.created_at || ''
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => 
        typeof field === 'string' && field.includes(',') 
          ? `"${field.replace(/"/g, '""')}"` 
          : field
      ).join(','))
    ].join('\n')

    const filename = `prayers_export_${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Prayer export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
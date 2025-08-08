import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('archive_weeks')
    .select('week_start_et, prayer_count')
    .order('week_start_et', { ascending: false })
    .limit(52) // 最近 52 周，可按需调整

  if (error) {
    console.error('archive-weeks error:', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
  return NextResponse.json(data ?? [])
}
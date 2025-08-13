import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getWeekRangeUtc, getCurrentWeekStartET, isCurrentWeek } from '@/lib/utils'
import dayjs from 'dayjs'

/**
 * GET /api/prayers?week_start=YYYY-MM-DD
 * - 按“美东周日”为起点的当周范围（在服务端换算为 UTC ISO）过滤
 * - 如果未提供 week_start，则默认使用当前周（ET）的周日
 */
export async function GET(req: Request) {
  const supabase = await createServerSupabase()
  try {
    const { searchParams } = new URL(req.url)
    const qsWeekStart = searchParams.get('week_start') || getCurrentWeekStartET()

    // 计算该周在 UTC 下的起止 ISO（用于数据库过滤）
    const { startUtcISO, endUtcISO } = getWeekRangeUtc(qsWeekStart)

    const { data, error } = await supabase
      .from('v_prayers_likes')
      .select(`
        id,
        content,
        author_name,
        user_id,
        created_at,
        like_count,
        liked_by_me
      `)
      .gte('created_at', startUtcISO)
      .lt('created_at', endUtcISO)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch prayers' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (e) {
    console.error('Unhandled GET error:', e)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

/**
 * POST /api/prayers
 * body: { content: string; author_name?: string }
 * - 服务器端进行基础校验（长度、必填）
 * - 只依赖默认 created_at=now()，周归属由查询时段决定
 */
export async function POST(req: Request) {
  const supabase = await createServerSupabase()

  // Get user if logged in, but allow guest posting
  const { data: { user } } = await supabase.auth.getUser()
  // Note: user can be null for guest users

  try {
    const body = await req.json()
    let content: string = (body?.content ?? '').toString().trim()
    let author_name: string | null = (body?.author_name ?? '').toString().trim() || null

    // 校验内容（1 ~ 500 字符）
    if (!content || content.length > 500) {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 })
    }

    // 限制作者名长度（可按需调整，例如 24）
    if (author_name && author_name.length > 24) {
      author_name = author_name.slice(0, 24)
    }

    const { data, error } = await supabase
      .from('prayers')
      .insert([{ content, author_name, user_id: user?.id || null }])
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json(data?.[0] || { success: true }, { status: 201 })
  } catch (err) {
    console.error('Unhandled POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/prayers?id=123
 * body: { content: string; author_name?: string }
 * - Updates user's own prayer
 * - Only allows editing current week prayers
 */
export async function PATCH(req: Request) {
  const supabase = await createServerSupabase()

  // Require login
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const prayerId = searchParams.get('id')
    
    if (!prayerId) {
      return NextResponse.json({ error: 'Prayer ID required' }, { status: 400 })
    }

    // Get the prayer to verify ownership and check week
    const { data: existingPrayer, error: fetchError } = await supabase
      .from('prayers')
      .select('user_id, created_at')
      .eq('id', prayerId)
      .single()

    if (fetchError || !existingPrayer) {
      return NextResponse.json({ error: 'Prayer not found' }, { status: 404 })
    }

    // Check ownership
    if (existingPrayer.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Check if prayer is from current week (ET)
    const prayerDate = dayjs(existingPrayer.created_at)
    const prayerWeekStart = prayerDate.subtract(prayerDate.day(), 'day').format('YYYY-MM-DD')
    
    if (!isCurrentWeek(prayerWeekStart)) {
      return NextResponse.json({ error: 'Can only edit current week prayers' }, { status: 400 })
    }

    const body = await req.json()
    let content: string = (body?.content ?? '').toString().trim()
    let author_name: string | null = (body?.author_name ?? '').toString().trim() || null

    // Validation (reuse from POST)
    if (!content || content.length > 500) {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 })
    }

    if (author_name && author_name.length > 24) {
      author_name = author_name.slice(0, 24)
    }

    const { error: updateError } = await supabase
      .from('prayers')
      .update({ content, author_name })
      .eq('id', prayerId)
      .eq('user_id', user.id) // Double-check ownership

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unhandled PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/prayers?id=123
 * - Deletes user's own prayer
 * - Only allows deleting current week prayers
 */
export async function DELETE(req: Request) {
  const supabase = await createServerSupabase()

  // Require login
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const prayerId = searchParams.get('id')
    
    if (!prayerId) {
      return NextResponse.json({ error: 'Prayer ID required' }, { status: 400 })
    }

    // Get the prayer to verify ownership and check week
    const { data: existingPrayer, error: fetchError } = await supabase
      .from('prayers')
      .select('user_id, created_at')
      .eq('id', prayerId)
      .single()

    if (fetchError || !existingPrayer) {
      return NextResponse.json({ error: 'Prayer not found' }, { status: 404 })
    }

    // Check ownership
    if (existingPrayer.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Check if prayer is from current week (ET)
    const prayerDate = dayjs(existingPrayer.created_at)
    const prayerWeekStart = prayerDate.subtract(prayerDate.day(), 'day').format('YYYY-MM-DD')
    
    if (!isCurrentWeek(prayerWeekStart)) {
      return NextResponse.json({ error: 'Can only delete current week prayers' }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('prayers')
      .delete()
      .eq('id', prayerId)
      .eq('user_id', user.id) // Double-check ownership

    if (deleteError) {
      console.error('Supabase delete error:', deleteError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unhandled DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

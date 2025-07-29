import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { getWeekRangeUtc, getCurrentWeekStartET } from '@/lib/utils'

/**
 * GET /api/prayers?week_start=YYYY-MM-DD
 * - 按“美东周日”为起点的当周范围（在服务端换算为 UTC ISO）过滤
 * - 如果未提供 week_start，则默认使用当前周（ET）的周日
 */
export async function GET(req: Request) {
  const supabase = createClient()
  try {
    const { searchParams } = new URL(req.url)
    const qsWeekStart = searchParams.get('week_start') || getCurrentWeekStartET()

    // 计算该周在 UTC 下的起止 ISO（用于数据库过滤）
    const { startUtcISO, endUtcISO } = getWeekRangeUtc(qsWeekStart)

    const { data, error } = await supabase
      .from('prayers')
      .select('*')
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
  const supabase = createClient()

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

    const { error } = await supabase
      .from('prayers')
      .insert([{ content, author_name }])

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unhandled POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

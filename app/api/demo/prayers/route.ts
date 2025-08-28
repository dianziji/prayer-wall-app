import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getCurrentWeekStartET } from '@/lib/utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/demo/prayers - Demo组织专用API
 * 使用demo_prayers表而不是生产prayers表
 */
export async function GET(req: Request) {
  const supabase = await createServerSupabase()
  
  try {
    const { searchParams } = new URL(req.url)
    const qsWeekStart = searchParams.get('week_start') || getCurrentWeekStartET()
    const fellowship = searchParams.get('fellowship')
    
    // 固定使用Demo组织ID
    const demoOrgId = 'e5511cdd-440c-4b18-8c8c-43ea0bf4d1bd'
    
    // 获取Demo组织的prayer_wall
    let { data: wall } = await supabase
      .from('prayer_walls')
      .select('id, theme, stats, is_active')
      .eq('organization_id', demoOrgId)
      .eq('week_start', qsWeekStart)
      .single()
    
    if (!wall) {
      // 如果没有找到，创建一个基本的wall响应
      wall = {
        id: null,
        theme: {
          title: 'Demo祷告墙',
          title_en: 'Demo Prayer Wall',
          description: '这是演示版本',
          description_en: 'This is a demo version'
        },
        stats: { prayer_count: 0, participant_count: 0 },
        is_active: false
      }
    }
    
    // 从demo_prayers表查询祷告数据
    let query = supabase
      .from('demo_prayers')
      .select(`
        id,
        content,
        author_name,
        user_id,
        created_at,
        fellowship,
        thanksgiving_content,
        intercession_content,
        color,
        font_style
      `)
      .eq('organization_id', demoOrgId)
      .order('created_at', { ascending: false })
    
    // 添加团契过滤
    if (fellowship) {
      query = query.eq('fellowship', fellowship)
    }
    
    const { data: prayers, error } = await query
    
    if (error) {
      console.error('Demo prayers fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch demo prayers' }, { status: 500 })
    }
    
    // Demo fellowship映射，将MGC特定fellowship替换为通用demo fellowship
    const fellowshipMapping: Record<string, string> = {
      'sunday': 'community',
      'ypf': 'youth', 
      'jcf': 'family',
      'student': 'student',
      'lic': 'senior',
      'weekday': 'weekday'
    }
    
    // 为demo数据添加模拟的点赞和评论数据，并映射fellowship
    const demoEnhancedPrayers = (prayers || []).map((prayer: any) => ({
      ...prayer,
      fellowship: fellowshipMapping[prayer.fellowship] || prayer.fellowship || 'community', // 映射到demo fellowship
      like_count: Math.floor(Math.random() * 8) + 1, // 随机1-8个赞
      liked_by_me: Math.random() > 0.7, // 30%概率已点赞
      comment_count: Math.floor(Math.random() * 3) // 随机0-2个评论
    }))
    
    return NextResponse.json({
      prayers: demoEnhancedPrayers,
      wall: {
        id: wall.id,
        theme: wall.theme,
        stats: {
          ...wall.stats,
          prayer_count: demoEnhancedPrayers.length
        },
        is_active: wall.is_active,
        can_manage: false // Demo版本不允许管理
      },
      meta: {
        week_start: qsWeekStart,
        organization_id: demoOrgId,
        read_only: true, // Demo版本只读
        is_demo: true
      }
    })
  } catch (e) {
    console.error('Demo API error:', e)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// Demo版本不支持POST请求
export async function POST() {
  return NextResponse.json({ 
    error: 'Demo version does not support creating prayers. Please sign up to use the full version.' 
  }, { status: 403 })
}
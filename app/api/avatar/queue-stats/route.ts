import { NextResponse } from 'next/server'
import { avatarQueue } from '@/lib/avatar-queue'

export const runtime = 'nodejs'

/**
 * GET /api/avatar/queue-stats
 * 获取头像处理队列的统计信息 (用于监控和调试)
 */
export async function GET() {
  try {
    const stats = avatarQueue.getStats()
    
    return NextResponse.json({
      queue: stats,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      performance: {
        processingRate: stats.total > 0 ? (stats.completed / stats.total * 100).toFixed(1) + '%' : '0%',
        failureRate: stats.total > 0 ? (stats.failed / stats.total * 100).toFixed(1) + '%' : '0%',
        avgProcessingTime: '估算: 5-30秒'
      }
    })
  } catch (err: any) {
    console.error('Queue stats API error:', err)
    return NextResponse.json({ 
      error: err?.message ?? 'Failed to get queue stats' 
    }, { status: 500 })
  }
}
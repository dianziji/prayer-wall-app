import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { avatarQueue } from '@/lib/avatar-queue'

export const runtime = 'nodejs'

/**
 * GET /api/avatar/status?taskId=xxx
 * 或 GET /api/avatar/status (获取当前用户最新的头像任务状态)
 */
export async function GET(req: Request) {
  try {
    const supa = await createServerSupabase()
    
    // 验证用户登录
    const { data: { user } } = await supa.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('taskId')

    if (taskId) {
      // 查询特定任务状态
      const task = avatarQueue.getTaskStatus(taskId)
      if (!task) {
        return NextResponse.json({ 
          error: 'Task not found',
          taskId 
        }, { status: 404 })
      }

      // 确保用户只能查询自己的任务
      if (task.userId !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      return NextResponse.json({
        taskId: task.id,
        status: task.status,
        attempts: task.attempts,
        maxAttempts: task.maxAttempts,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        error: task.error,
        ...(task.status === 'completed' && await getUserAvatarUrl(supa, user.id))
      })
    } else {
      // 查询用户最新任务状态
      const latestTask = avatarQueue.getUserLatestTask(user.id)
      
      if (!latestTask) {
        return NextResponse.json({
          status: 'no_tasks',
          message: '没有找到头像处理任务'
        })
      }

      return NextResponse.json({
        taskId: latestTask.id,
        status: latestTask.status,
        attempts: latestTask.attempts,
        maxAttempts: latestTask.maxAttempts,
        createdAt: latestTask.createdAt,
        updatedAt: latestTask.updatedAt,
        error: latestTask.error,
        ...(latestTask.status === 'completed' && await getUserAvatarUrl(supa, user.id))
      })
    }

  } catch (err: any) {
    console.error('Avatar status API error:', err)
    return NextResponse.json({ 
      error: err?.message ?? 'Unexpected error' 
    }, { status: 500 })
  }
}

/**
 * 获取用户头像URL
 */
async function getUserAvatarUrl(supa: any, userId: string) {
  try {
    const { data, error } = await supa
      .from('user_profiles')
      .select('avatar_url, avatar_updated_at')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return {}
    }

    return {
      avatarUrl: data.avatar_url,
      avatarUpdatedAt: data.avatar_updated_at
    }
  } catch (err) {
    console.error('Failed to get user avatar URL:', err)
    return {}
  }
}
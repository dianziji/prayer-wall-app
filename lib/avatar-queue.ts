/**
 * 异步头像处理队列系统
 * 
 * 目标: 将头像处理从登录流程中分离，提升登录速度
 * 特性: 队列管理、并发控制、重试机制、状态跟踪
 */

interface AvatarTask {
  id: string
  userId: string
  sourceUrl: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  attempts: number
  maxAttempts: number
  createdAt: Date
  updatedAt: Date
  error?: string
}

class AvatarProcessingQueue {
  private tasks: Map<string, AvatarTask> = new Map()
  private processing: Set<string> = new Set()
  private maxConcurrent: number = 15 // 最多15个并发处理 (基于之前35用户测试的经验)
  private maxAttempts: number = 3
  private processingInterval: NodeJS.Timeout | null = null

  constructor() {
    // 启动队列处理器
    this.startProcessor()
  }

  /**
   * 添加头像处理任务到队列
   */
  addTask(userId: string, sourceUrl: string): string {
    const taskId = `avatar_${userId}_${Date.now()}`
    
    const task: AvatarTask = {
      id: taskId,
      userId,
      sourceUrl,
      status: 'pending',
      attempts: 0,
      maxAttempts: this.maxAttempts,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.tasks.set(taskId, task)
    console.log(`Avatar task queued: ${taskId} for user ${userId}`)
    
    return taskId
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): AvatarTask | null {
    return this.tasks.get(taskId) || null
  }

  /**
   * 获取用户的最新头像任务
   */
  getUserLatestTask(userId: string): AvatarTask | null {
    const userTasks = Array.from(this.tasks.values())
      .filter(task => task.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    
    return userTasks[0] || null
  }

  /**
   * 启动队列处理器
   */
  private startProcessor(): void {
    if (this.processingInterval) return

    this.processingInterval = setInterval(() => {
      this.processQueue()
    }, 2000) // 每2秒检查一次队列

    console.log('Avatar processing queue started')
  }

  /**
   * 停止队列处理器
   */
  stopProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
      console.log('Avatar processing queue stopped')
    }
  }

  /**
   * 处理队列中的任务
   */
  private async processQueue(): Promise<void> {
    const pendingTasks = Array.from(this.tasks.values())
      .filter(task => task.status === 'pending')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    const availableSlots = this.maxConcurrent - this.processing.size
    const tasksToProcess = pendingTasks.slice(0, availableSlots)

    for (const task of tasksToProcess) {
      this.processTask(task).catch(error => {
        console.error(`Error processing avatar task ${task.id}:`, error)
      })
    }
  }

  /**
   * 处理单个头像任务
   */
  private async processTask(task: AvatarTask): Promise<void> {
    if (this.processing.has(task.id)) return

    this.processing.add(task.id)
    task.status = 'processing'
    task.attempts += 1
    task.updatedAt = new Date()

    console.log(`Processing avatar task ${task.id} (attempt ${task.attempts}/${task.maxAttempts})`)

    try {
      await this.downloadAndUploadAvatar(task)
      
      task.status = 'completed'
      task.updatedAt = new Date()
      console.log(`Avatar task ${task.id} completed successfully`)
      
    } catch (error) {
      console.error(`Avatar task ${task.id} failed:`, error)
      task.error = error instanceof Error ? error.message : 'Unknown error'
      task.updatedAt = new Date()

      if (task.attempts >= task.maxAttempts) {
        task.status = 'failed'
        console.log(`Avatar task ${task.id} failed permanently after ${task.attempts} attempts`)
      } else {
        task.status = 'pending' // 重新排队
        console.log(`Avatar task ${task.id} will be retried (${task.attempts}/${task.maxAttempts})`)
      }
    } finally {
      this.processing.delete(task.id)
    }
  }

  /**
   * 下载并上传头像 (带图片优化)
   */
  private async downloadAndUploadAvatar(task: AvatarTask): Promise<void> {
    const { createServerSupabase } = await import('@/lib/supabase-server')
    const { optimizeAvatar, validateImage } = await import('@/lib/image-optimizer')
    const supa = await createServerSupabase()

    // 1. 验证和清理URL
    const safeUrl = this.sanitizeSourceUrl(task.sourceUrl)
    
    // 2. 下载头像 (添加超时)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

    let response: Response
    try {
      response = await fetch(safeUrl, { 
        cache: 'no-store',
        signal: controller.signal
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch avatar: ${response.status} ${response.statusText}`)
    }

    // 3. 获取原始图片数据
    const arrayBuffer = await response.arrayBuffer()
    const originalBuffer = Buffer.from(arrayBuffer)
    
    // 4. 检查原始文件大小 (限制10MB)
    if (originalBuffer.length > 10 * 1024 * 1024) {
      throw new Error('Avatar file too large (max 10MB)')
    }

    // 5. 验证图片格式
    let imageInfo
    try {
      imageInfo = await validateImage(originalBuffer)
    } catch (error) {
      throw new Error(`Invalid image file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    console.log(`Avatar optimization starting for ${task.userId}: ${imageInfo.format} ${imageInfo.width}x${imageInfo.height} (${(originalBuffer.length / 1024).toFixed(1)}KB)`)

    // 6. 优化图片 (压缩为128x128 WebP)
    let optimizeResult
    try {
      optimizeResult = await optimizeAvatar(originalBuffer, {
        maxWidth: 128,
        maxHeight: 128,
        quality: 80,
        format: 'webp',
        maxSize: 50 * 1024 // 50KB目标
      })
    } catch (error) {
      throw new Error(`Image optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    console.log(`Avatar optimized for ${task.userId}: ${optimizeResult.format} ${optimizeResult.width}x${optimizeResult.height} (${(optimizeResult.size / 1024).toFixed(1)}KB, ${optimizeResult.compressionRatio.toFixed(1)}% reduction)`)

    // 7. 上传优化后的图片
    const objectPath = `${task.userId}.webp` // 统一使用webp格式
    const { error: uploadError } = await supa.storage
      .from('avatars')
      .upload(objectPath, optimizeResult.buffer, {
        contentType: 'image/webp',
        upsert: true,
      })

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    // 8. 获取公共URL
    const { data: publicUrlData } = supa.storage
      .from('avatars')
      .getPublicUrl(objectPath)

    // 9. 更新用户档案
    const { error: profileError } = await (supa as any)
      .from('user_profiles')
      .upsert(
        { 
          user_id: task.userId, 
          avatar_url: publicUrlData.publicUrl,
          avatar_updated_at: new Date().toISOString()
        }, 
        { onConflict: 'user_id' }
      )

    if (profileError) {
      throw new Error(`Profile update failed: ${profileError.message}`)
    }
  }

  /**
   * 清理和验证源URL
   */
  private sanitizeSourceUrl(url: string): string {
    try {
      const u = new URL(url)
      const allowedHosts = new Set([
        'lh3.googleusercontent.com',
        'lh4.googleusercontent.com', 
        'lh5.googleusercontent.com',
        'lh6.googleusercontent.com',
        'googleusercontent.com',
        'avatars.githubusercontent.com', // GitHub头像
        'graph.facebook.com', // Facebook头像
      ])
      
      if (!allowedHosts.has(u.hostname)) {
        throw new Error(`Unsupported avatar host: ${u.hostname}`)
      }
      
      return u.toString()
    } catch (e) {
      throw new Error('Invalid avatar URL')
    }
  }

  /**
   * 从Content-Type获取文件扩展名
   */
  private getExtFromContentType(contentType?: string | null): 'jpg' | 'png' | 'webp' {
    if (!contentType) return 'jpg'
    const type = contentType.toLowerCase()
    if (type.includes('png')) return 'png'
    if (type.includes('webp')) return 'webp'
    return 'jpg'
  }

  /**
   * 获取默认Content-Type
   */
  private getDefaultContentType(ext: string): string {
    switch (ext) {
      case 'png': return 'image/png'
      case 'webp': return 'image/webp'
      default: return 'image/jpeg'
    }
  }

  /**
   * 清理旧任务 (保留最近24小时的任务)
   */
  cleanupOldTasks(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时前
    let removedCount = 0

    for (const [taskId, task] of this.tasks.entries()) {
      if (task.createdAt < cutoffTime && !this.processing.has(taskId)) {
        this.tasks.delete(taskId)
        removedCount++
      }
    }

    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} old avatar tasks`)
    }
  }

  /**
   * 获取队列统计信息
   */
  getStats() {
    const tasks = Array.from(this.tasks.values())
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      processing: tasks.filter(t => t.status === 'processing').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      currentProcessing: this.processing.size,
      maxConcurrent: this.maxConcurrent
    }
  }
}

// 单例实例
export const avatarQueue = new AvatarProcessingQueue()

// 定期清理任务 (每小时)
setInterval(() => {
  avatarQueue.cleanupOldTasks()
}, 60 * 60 * 1000)

export type { AvatarTask }
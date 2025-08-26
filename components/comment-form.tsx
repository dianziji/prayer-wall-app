'use client'
import { useState } from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { useSession } from '@/lib/useSession'
import { toast } from 'sonner'
import { mutate } from 'swr'
import type { Comment } from '@/types/models'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Smile } from 'lucide-react'
import { filterContent } from '@/lib/content-filter'

export function CommentForm({ prayerId, onPosted }: {
  prayerId: string
  onPosted: () => void
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
const { session, profile } = useSession()
  const supa = createBrowserSupabase()

  const maxLen = 250
  const disabled = text.trim().length === 0 || text.length > maxLen

  async function submit() {
    if (!session) return toast.error('请先登录')
    
    const trimmedText = text.trim()
    
    // Content filtering validation
    const contentFilter = filterContent(trimmedText)
    if (!contentFilter.isValid) {
      return toast.error(contentFilter.reason || '评论内容包含不当词汇，请修改后重新提交')
    }
        
    const {  data: inserted, error } = await (supa as any).from('comments').insert({
      prayer_id: prayerId,
      user_id: session.user.id,
      content: trimmedText,
     
    })      .select('id, content, user_id, created_at, prayer_id')
  .single()
    
    if (error) return toast.error('发送失败')
    setText('')
    // 触发对应 CommentList 的 SWR 重新获取
    const insertedWithName = { ...inserted, author_name: profile?.username ?? '匿名' } as Comment
    
    // 更新评论列表
    mutate(['comments', prayerId], (prev?: Comment[]) => {
      const next = prev ? [insertedWithName, ...prev] : [insertedWithName]
      return next
    }, { revalidate: false })
    
    // Note: comment count is now provided by API, will be refreshed when prayers are refetched
    onPosted()
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        maxLength={maxLen}
        placeholder="写下你的鼓励… (支持 emoji)"
        className="resize-none"
      />
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(!open)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Smile className="w-4 h-4 mr-1" />
          Emoji
        </Button>
        <span className="text-xs text-muted-foreground">
          {text.length}/{maxLen}
        </span>
        <Button
          onClick={submit}
          disabled={disabled}
          size="sm"
        >
          发布
        </Button>
      </div>
      {open &&
        <Picker
          data={data}
          onEmojiSelect={(e: any) => setText(t => t + e.native)}
          locale="zh"
          theme="light"
        />}
    </div>
  )
}
'use client'
import { useState } from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { useSession } from '@/lib/useSession'
import { toast } from 'sonner'
import { mutate } from 'swr'
import type { Comment } from '@/types/models'

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
        
    const {  data: inserted, error } = await supa.from('comments').insert({
      prayer_id: prayerId,
      user_id: session.user.id,
      content: text.trim(),
     
    })      .select('id, content, user_id, created_at, prayer_id')
  .single()
    
    if (error) return toast.error('发送失败')
    setText('')
    // 触发对应 CommentList 的 SWR 重新获取
    const insertedWithName = { ...inserted, author_name: profile?.username ?? '匿名' } as Comment
    // mutate(['comments', prayerId])
    mutate(['comments', prayerId], (prev?: Comment[]) => {
  const next = prev ? [insertedWithName, ...prev] : [insertedWithName]
  return next
}, { revalidate: false })
    onPosted()
  }

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        maxLength={maxLen}
        className="w-full border rounded p-2"
        placeholder="写下你的鼓励… (支持 emoji)"
      />
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          🙂 Emoji
        </button>
        <span className="text-xs text-gray-400">
          {text.length}/{maxLen}
        </span>
        <button
          onClick={submit}
          disabled={disabled}
          className="bg-indigo-600 text-white px-3 py-1 rounded disabled:opacity-40"
        >
          发布
        </button>
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
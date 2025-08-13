'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'                // 你的全局 toast，如无可换成 alert
import { useSession } from '@/lib/useSession'
import { createBrowserSupabase } from '@/lib/supabase-browser'

// Heart icons (outline ↔ solid)
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      className={filled ? "fill-pink-500" : "fill-none stroke-gray-400 stroke-2"}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type Props = {
  prayerId: string
  initialCount: number
  /** 若 API 已经返回当前用户是否点赞，可传入；否则默认 false */
  initiallyLiked?: boolean
}

export function LikeButton({
  prayerId,
  initialCount,
  initiallyLiked = false,
}: Props) {
  const { session } = useSession()
  const supa = createBrowserSupabase()

  const [liked, setLiked] = useState(initiallyLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  // 若后端没返回 liked 状态，可以在首次渲染时查询 likes 表
  useEffect(() => {
    if (!session) return
    supa
      .from('likes')
      .select('prayer_id')
      .eq('prayer_id', prayerId)
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error) setLiked(!!data)
      })
  }, [session?.user.id, prayerId])

  async function toggleLike() {
    if (!session) return toast.error('请先登录')

    setLoading(true)

    // 乐观更新 UI
    setLiked(prev => !prev)
    setCount(c => c + (liked ? -1 : 1))

    const { error } = liked
      ? await supa
          .from('likes')
          .delete()
          .eq('prayer_id', prayerId)
          .eq('user_id', session.user.id)
      : await supa.from('likes').insert({
          prayer_id: prayerId,
          user_id: session.user.id,
        })

    setLoading(false)

    if (error) {
      // 回滚 UI
      setLiked(prev => !prev)
      setCount(c => c + (liked ? 1 : -1))
      toast.error('操作失败，请稍后再试')
    }
  }

  return (
    <button
      onClick={toggleLike}
      disabled={loading}
      className="flex items-center gap-1 disabled:opacity-40"
    >
      <HeartIcon filled={liked} />
      <span className="text-sm text-gray-600">{count}</span>
    </button>
  )
}
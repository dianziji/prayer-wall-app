'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useSession } from '@/lib/useSession'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'


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
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLike}
      disabled={loading}
      className={`
        flex items-center gap-1.5 h-auto p-2 min-h-[44px] sm:min-h-auto sm:p-1.5 
        disabled:opacity-40 transition-colors duration-200 focus:outline-none focus:bg-transparent active:bg-transparent
        ${liked 
          ? 'text-pink-500 hover:text-pink-600' 
          : 'text-gray-400 hover:text-pink-400'
        }
        ${loading ? 'animate-pulse' : ''}
      `}
    >
      <Heart 
        className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200 flex-shrink-0 ${
          liked ? 'fill-current' : ''
        }`}
      />
      <span className="text-sm font-medium">{count}</span>
    </Button>
  )
}
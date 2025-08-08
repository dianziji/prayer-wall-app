'use client'
import { formatDistanceToNow } from "date-fns"
import { useState } from "react"
import type { Prayer } from '@/types/models'
import { LikeButton } from '@/components/like-button'
import { useSession } from '@/lib/useSession'
import { CommentForm } from '@/components/comment-form'
import { CommentList } from '@/components/comment-list'

type PrayerCardProps = { prayer: Prayer; authorAvatarUrl?: string | null }

export function PrayerCard({ prayer, authorAvatarUrl = null }: PrayerCardProps) {
  const time = typeof prayer.created_at === "string" ? new Date(prayer.created_at) : prayer.created_at ?? new Date()
  const { session, profile } = useSession()
  const [showCommentForm, setShowCommentForm] = useState(false)

  function truncateName(name: string, maxLen: number) {
    return name.length > maxLen ? name.slice(0, maxLen) + "…" : name
  }
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300 ease-in-out border border-gray-200">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
          {(() => {
            const anyPrayer = prayer as any
            const isMine = session?.user?.id && anyPrayer?.user_id && session.user.id === anyPrayer.user_id
            const src = authorAvatarUrl ?? (isMine ? (profile?.avatar_url ?? null) : null)
            if (src) {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={(prayer.author_name || 'User') + ' avatar'} className="w-full h-full object-cover" />
              )
            }
            const name = prayer.author_name || 'U'
            const initials = name.trim().slice(0, 2).toUpperCase()
            return <span>{initials}</span>
          })()}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">
  {truncateName(prayer.author_name || "Unknown", 15)}
</p>
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(time, { addSuffix: true })}
          </p>
        </div>
      </div>
      <div>
        <p className="text-lg font-medium text-gray-900 break-words">{prayer.content}</p>
              <div className="mt-4 flex items-center justify-end gap-4">
        <LikeButton
          prayerId={prayer.id}
          initialCount={prayer.like_count ?? 0}
          initiallyLiked={prayer.liked_by_me ?? false} // 如果 API 已返回
        />
        {session && (
          <button
            type="button"
            className="text-sm text-indigo-600 hover:underline"
            onClick={() => setShowCommentForm(prev => !prev)}
          >
            {showCommentForm ? '收起评论' : '写评论'}
          </button>
        )}
      </div>
      
        <div className="mt-4 mb-4 border-gray-200">
          <hr />
        </div>
    

      {/* 评论区 */}
      {session && showCommentForm && (
        <div className="mt-6">
          <CommentForm
            prayerId={prayer.id}
            onPosted={() => setShowCommentForm(false)}
          />
        </div>
      )}
      <CommentList prayerId={prayer.id} />

      </div>
    </div>
  )
}
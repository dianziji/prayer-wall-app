'use client'
import { formatDistanceToNow } from "date-fns"
import { useState } from "react"
import type { Prayer } from '@/types/models'
import { LikeButton } from '@/components/like-button'
import { useSession } from '@/lib/useSession'
import { CommentForm } from '@/components/comment-form'
import { CommentList } from '@/components/comment-list'

type PrayerCardProps = { 
  prayer: Prayer; 
  authorAvatarUrl?: string | null;
  onEdit?: (prayer: Prayer) => void;
  onDelete?: (prayerId: string) => void;
}

export function PrayerCard({ prayer, authorAvatarUrl = null, onEdit, onDelete }: PrayerCardProps) {
  const time = typeof prayer.created_at === "string" ? new Date(prayer.created_at) : prayer.created_at ?? new Date()
  const { session, profile } = useSession()
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Check if current user owns this prayer
  const isOwner = session?.user?.id && (prayer as any)?.user_id && session.user.id === (prayer as any).user_id
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Prayer Card Debug:', {
      prayerId: prayer.id,
      sessionUserId: session?.user?.id,
      prayerUserId: (prayer as any)?.user_id,
      isOwner,
      hasOnEdit: !!onEdit,
      hasOnDelete: !!onDelete,
      hasSession: !!session,
    })
  }

  function truncateName(name: string, maxLen: number) {
    return name.length > maxLen ? name.slice(0, maxLen) + "…" : name
  }
  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow duration-300 ease-in-out border border-gray-200">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xs sm:text-sm font-semibold text-gray-600">
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
            <p className="text-xs sm:text-sm font-semibold text-gray-800">
              {truncateName(prayer.author_name || "Unknown", 15)}
            </p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(time, { addSuffix: true })}
            </p>
          </div>
        </div>
        
        {/* Actions menu for prayer owner - aligned to right */}
        {isOwner && (onEdit || onDelete) && (
          <div className="relative ml-2 sm:ml-4">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {showActions && (
              <div className="absolute right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[140px] sm:min-w-[120px] z-dropdown transform-gpu will-change-transform">
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(prayer)
                      setShowActions(false)
                    }}
                    className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 touch-manipulation"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={async () => {
                      if (confirm('确定要删除这个祷告吗？')) {
                        setIsDeleting(true)
                        setShowActions(false)
                        try {
                          const res = await fetch(`/api/prayers?id=${prayer.id}`, {
                            method: 'DELETE'
                          })
                          if (res.ok) {
                            onDelete(prayer.id)
                          } else {
                            const error = await res.json()
                            alert(error.error || '删除失败')
                          }
                        } catch (err) {
                          alert('删除失败')
                        } finally {
                          setIsDeleting(false)
                        }
                      }
                    }}
                    disabled={isDeleting}
                    className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 touch-manipulation"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 break-words leading-relaxed">{prayer.content}</p>
              <div className="mt-3 sm:mt-4 flex items-center justify-end gap-3 sm:gap-4">
        <LikeButton
          prayerId={prayer.id}
          initialCount={prayer.like_count ?? 0}
          initiallyLiked={prayer.liked_by_me ?? false} // 如果 API 已返回
        />
        {session && (
          <button
            type="button"
            className="text-sm text-indigo-600 hover:underline px-2 py-1 rounded touch-manipulation"
            onClick={() => setShowCommentForm(prev => !prev)}
          >
            {showCommentForm ? '收起评论' : '写评论'}
          </button>
        )}
      </div>
      
        <div className="mt-3 sm:mt-4 mb-3 sm:mb-4 border-gray-200">
          <hr />
        </div>
    

      {/* 评论区 */}
      {session && showCommentForm && (
        <div className="mt-4 sm:mt-6">
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
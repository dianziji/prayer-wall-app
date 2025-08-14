'use client'
import { formatDistanceToNow } from "date-fns"
import { useState, useCallback } from "react"
import useSWR from 'swr'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import type { Prayer } from '@/types/models'
import { LikeButton } from '@/components/like-button'
import { useSession } from '@/lib/useSession'
import { CommentForm } from '@/components/comment-form'
import { CommentList } from '@/components/comment-list'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MessageCircle, ChevronUp } from 'lucide-react'

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
  
  // Fetch comment count
  const supa = createBrowserSupabase()
  const fetchCommentCount = useCallback(async () => {
    const { count } = await supa
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('prayer_id', prayer.id)
    return count || 0
  }, [prayer.id, supa])
  
  const { data: commentCount = 0 } = useSWR(`comments-count-${prayer.id}`, fetchCommentCount)
  
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

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 ease-in-out">
      <CardHeader className="pb-3 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 flex-shrink-0">
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
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {prayer.author_name || "Unknown"}
            </p>
            <CardDescription className="text-xs mt-1  text-gray-500 ">
              {formatDistanceToNow(time, { addSuffix: true })}
            </CardDescription>
          </div>
        </div>
        
        {/* Actions menu for prayer owner */}
        {isOwner && (onEdit || onDelete) && (
          <div className="relative flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowActions(!showActions)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </Button>
            {showActions && (
              <div className="absolute right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[140px] sm:min-w-[120px] z-dropdown transform-gpu will-change-transform">
                {onEdit && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      onEdit(prayer)
                      setShowActions(false)
                    }}
                    className="w-full justify-start h-auto px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
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
                    className="w-full justify-start h-auto px-4 py-3 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 p-4 sm:p-6">
        <p className="text-base lg:text-lg font-medium text-gray-900 break-words leading-relaxed mb-4">{prayer.content}</p>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <LikeButton
            prayerId={prayer.id}
            initialCount={prayer.like_count ?? 0}
            initiallyLiked={prayer.liked_by_me ?? false}
          />
          {session && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCommentForm(prev => !prev)}
              className={`
                flex items-center gap-1.5 min-h-[44px] sm:min-h-auto transition-all duration-200
                ${showCommentForm 
                  ? 'text-indigo-600 hover:text-gray-900' 
                  : 'text-gray-500 hover:text-gray-900'
                }
              `}
            >
              {showCommentForm ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">收起</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">评论</span>
                  {commentCount > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {commentCount}
                    </span>
                  )}
                </>
              )}
            </Button>
          )}
        </div>
        
        {/* 评论区 */}
        {((session && showCommentForm) || commentCount > 0) && (
          <Separator className="my-4" />
        )}
        
        {session && showCommentForm && (
          <CommentForm
            prayerId={prayer.id}
            onPosted={() => setShowCommentForm(false)}
          />
        )}
        
        {commentCount > 0 && (
          <div className={session && showCommentForm ? "mt-4" : ""}>
            <CommentList prayerId={prayer.id} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useSession } from '@/lib/useSession'
import { CommentList } from '@/components/comment-list'

interface Prayer {
  id: string
  content: string
  author_name: string | null
  user_id: string | null
  created_at: string | null
  like_count: number | null
  liked_by_me: boolean | null
  comment_count?: number
}

interface UserPrayerCardProps {
  prayer: Prayer
  showEngagement?: boolean
  onEdit?: (prayer: Prayer) => void
  onDelete?: (prayerId: string) => void
  onShare?: (prayer: Prayer) => void
}

export default function UserPrayerCard({ 
  prayer, 
  showEngagement = true,
  onEdit,
  onDelete,
  onShare 
}: UserPrayerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const { session, profile } = useSession()

  const contentPreview = prayer.content.length > 200 
    ? prayer.content.substring(0, 200) + '...'
    : prayer.content

  const timeAgo = prayer.created_at 
    ? formatDistanceToNow(new Date(prayer.created_at), { addSuffix: true })
    : 'Unknown time'

  const handleEdit = () => {
    if (onEdit) {
      onEdit(prayer)
    }
  }

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this prayer?')) {
      onDelete(prayer.id)
    }
  }

  const handleShare = () => {
    if (onShare) {
      onShare(prayer)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header with avatar, name, and actions */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
            {(() => {
              const anyPrayer = prayer as any
              const isMine = session?.user?.id && anyPrayer?.user_id && session.user.id === anyPrayer.user_id
              const src = isMine ? (profile?.avatar_url ?? null) : null
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
        </div>
        
        {/* Name and timestamp */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">
              {prayer.author_name || 'Anonymous'}
            </span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-500">{timeAgo}</span>
          </div>
          {prayer.created_at && (
            <div className="text-xs text-gray-400">
              {new Date(prayer.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            aria-label="More actions"
          >
            ⋯
          </button>
          
          {showActions && (
            <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
              {onShare && (
                <button
                  onClick={handleShare}
                  className="w-full px-3 py-2 text-sm text-left text-blue-600 hover:bg-blue-50 rounded-t-lg"
                >
                  📤 Share
                </button>
              )}
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className={`w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 ${onShare && !onDelete ? 'rounded-b-lg' : ''}`}
                >
                  ✏️ Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 rounded-b-lg"
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Prayer content */}
      <div className="mb-4">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {isExpanded ? prayer.content : contentPreview}
        </p>
        
        {prayer.content.length > 200 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Engagement stats */}
      {showEngagement && (
        <div className="py-2 border-t border-gray-100">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span className={prayer.liked_by_me ? '💙' : '🤍'}>
                {prayer.liked_by_me ? '💙' : '🤍'}
              </span>
              <span>{prayer.like_count || 0}</span>
              <span className="text-gray-400">
                {(prayer.like_count || 0) === 1 ? 'like' : 'likes'}
              </span>
            </div>
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <span>💬</span>
              <span>{prayer.comment_count || 0}</span>
              <span className="text-gray-400">
                {(prayer.comment_count || 0) === 1 ? 'comment' : 'comments'}
              </span>
              <span className="ml-1 text-xs">
                {showComments ? '▼' : '▶'}
              </span>
            </button>
            
            <div className="flex-1 text-right">
              <span className="text-xs text-gray-400">
                ID: {prayer.id.substring(0, 8)}...
              </span>
            </div>
          </div>
          
          {/* Comments section */}
          {showComments && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Comments ({prayer.comment_count || 0})
                </h4>
                <CommentList prayerId={prayer.id} />
              </div>
            </div>
          )}
        </div>
      )}


      {/* Click outside to close actions menu */}
      {showActions && (
        <div 
          className="fixed inset-0 z-0"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  )
}
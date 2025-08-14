'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useSession } from '@/lib/useSession'
import { CommentList } from '@/components/comment-list'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MoreHorizontal, Heart, MessageSquare, ChevronDown, ChevronRight, Share2, Edit, Trash2 } from 'lucide-react'

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
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        {/* Header with avatar, name, and actions */}
        <div className="flex items-start gap-3 mb-3 min-w-0">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
              <AvatarImage 
                src={(() => {
                  const anyPrayer = prayer as any
                  const isMine = session?.user?.id && anyPrayer?.user_id && session.user.id === anyPrayer.user_id
                  return isMine ? (profile?.avatar_url ?? '') : ''
                })()} 
                alt={(prayer.author_name || 'User') + ' avatar'} 
              />
              <AvatarFallback className="text-xs sm:text-sm">
                {(prayer.author_name || 'U').trim().slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Name and timestamp */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 mb-1 min-w-0">
              <span className="font-medium text-foreground text-sm truncate">
                {prayer.author_name || 'Anonymous'}
              </span>
              <span className="text-xs text-muted-foreground flex-shrink-0">•</span>
              <span className="text-xs text-muted-foreground truncate">{timeAgo}</span>
            </div>
            {prayer.created_at && (
              <div className="text-xs text-muted-foreground truncate">
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
            <Button
              onClick={() => setShowActions(!showActions)}
              variant="ghost"
              size="sm"
              className="p-1 h-auto w-auto"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            
            {showActions && (
              <div className="absolute right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-dropdown min-w-32">
                {onShare && (
                  <Button
                    onClick={handleShare}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-3 py-2 h-auto rounded-t-lg"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                )}
                {onEdit && (
                  <Button
                    onClick={handleEdit}
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start px-3 py-2 h-auto ${onShare && !onDelete ? 'rounded-b-lg' : ''}`}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    onClick={handleDelete}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-3 py-2 h-auto text-destructive hover:text-destructive rounded-b-lg"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Prayer content */}
        <div className="mb-4 min-w-0">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words text-sm">
            {isExpanded ? prayer.content : contentPreview}
          </p>
          
          {prayer.content.length > 200 && (
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="link"
              size="sm"
              className="mt-2 p-0 h-auto text-sm"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </div>

        {/* Engagement stats */}
        {showEngagement && (
          <div className="py-2 border-t border-border">
            <div className="flex items-center justify-between gap-2 sm:gap-4 mb-3 min-w-0">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <Heart className={`w-4 h-4 ${prayer.liked_by_me ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>{prayer.like_count || 0}</span>
                  <span className="hidden sm:inline">
                    {(prayer.like_count || 0) === 1 ? 'like' : 'likes'}
                  </span>
                </div>
                
                {(prayer.comment_count || 0) > 0 ? (
                  <Button
                    onClick={() => setShowComments(!showComments)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary h-auto p-0"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{prayer.comment_count}</span>
                    <span className="hidden sm:inline truncate">
                      {prayer.comment_count === 1 ? 'comment' : 'comments'}
                    </span>
                    {showComments ? <ChevronDown className="w-3 h-3 ml-1" /> : <ChevronRight className="w-3 h-3 ml-1" />}
                  </Button>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="w-4 h-4" />
                    <span>0</span>
                    <span className="hidden sm:inline truncate">comments</span>
                  </div>
                )}
              </div>
              
              <div className="flex-shrink-0">
                <span className="text-xs text-muted-foreground truncate max-w-20">
                  ID: {prayer.id.substring(0, 6)}...
                </span>
              </div>
            </div>
            
            {/* Comments section */}
            {showComments && (prayer.comment_count || 0) > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Comments ({prayer.comment_count})
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
      </CardContent>
    </Card>
  )
}
import { useState } from 'react'
import type { Comment } from '@/types/models'
import { formatDistanceToNow } from "date-fns"
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { MoreHorizontal, MoreVertical } from 'lucide-react'

export function CommentItem({
  comment, isMine, onDelete, onEdit
}: {
  comment: Comment
  isMine: boolean
  onDelete: (id: string) => void
  onEdit: (id: string, content: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(comment.content)
  const [showActions, setShowActions] = useState(false)

  if (editing) {
    return (
      <Card 
      className="p-2 sm:p-3 border-0 shadow-none"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
    >
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={2}
          maxLength={250}
          className="resize-none mb-2"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => { 
              onEdit(comment.id, text); 
              setEditing(false);
              setShowActions(false);
            }}
          >
            保存
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { 
              setEditing(false); 
              setText(comment.content);
              setShowActions(false);
            }}
          >
            取消
          </Button>
        </div>
      </Card>
    )
  }


  return (
    <Card 
      className="p-2 sm:p-3 border-0 shadow-none"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="mb-1">
            <div className="text-xs sm:text-sm font-medium sm:font-semibold text-foreground">{comment.author_name ?? '匿名'}</div>
            <div className="text-xs text-muted-foreground opacity-75" style={{ fontSize: '10px' }}>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: false })}</div>
          </div>
          <p className="whitespace-pre-wrap break-words mt-1 text-xs sm:text-sm lg:text-base">{comment.content}</p>
        </div>
        {isMine && (
          <div className="relative ml-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowActions(!showActions)}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="w-4 h-4 sm:hidden" />
              <MoreHorizontal className="w-4 h-4 hidden sm:block" />
            </Button>
            {showActions && (
              <div className="absolute right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[120px] z-dropdown">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(true)
                    setShowActions(false)
                  }}
                  className="w-full justify-start h-auto px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (confirm('确定要删除这条评论吗？')) {
                      onDelete(comment.id)
                    }
                    setShowActions(false)
                  }}
                  className="w-full justify-start h-auto px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  删除
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
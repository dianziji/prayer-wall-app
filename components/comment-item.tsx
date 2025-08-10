import { useState } from 'react'
import type { Comment } from '@/types/models'
import { formatDistanceToNow } from "date-fns"

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
      <li className="border p-2 rounded">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={2}
          maxLength={250}
          className="w-full border rounded p-1"
        />
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => { 
              onEdit(comment.id, text); 
              setEditing(false);
              setShowActions(false);
            }}
            className="px-2 py-0.5 bg-indigo-500 text-white rounded"
          >
            保存
          </button>
          <button
            onClick={() => { 
              setEditing(false); 
              setText(comment.content);
              setShowActions(false);
            }}
            className="text-sm text-gray-500"
          >
            取消
          </button>
        </div>
      </li>
    )
  }


  return (
  <li className="border p-2 rounded">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
          <span className="text-sm font-semibold text-gray-800">{comment.author_name ?? '匿名'}</span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
        </div>
        <p className="whitespace-pre-wrap break-words mt-0.5">{comment.content}</p>
      </div>
      {isMine && (
        <div className="relative ml-2">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {showActions && (
            <div className="absolute right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[120px] z-10">
              <button
                onClick={() => {
                  setEditing(true)
                  setShowActions(false)
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                编辑
              </button>
              <button
                onClick={() => {
                  if (confirm('确定要删除这条评论吗？')) {
                    onDelete(comment.id)
                  }
                  setShowActions(false)
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                删除
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  </li>
)
}
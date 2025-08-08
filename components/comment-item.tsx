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
            onClick={() => { onEdit(comment.id, text); setEditing(false) }}
            className="px-2 py-0.5 bg-indigo-500 text-white rounded"
          >
            保存
          </button>
          <button
            onClick={() => { setEditing(false); setText(comment.content) }}
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
        <span className="text-xs text-gray-500 flex flex-col gap-1 ml-2">
          <button onClick={() => setEditing(true)}>编辑</button>
          <button onClick={() => onDelete(comment.id)}>删除</button>
        </span>
      )}
    </div>
  </li>
)
}
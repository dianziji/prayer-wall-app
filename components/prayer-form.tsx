"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useSession } from '@/lib/useSession'

export type PrayerFormProps = {
  weekStart?: string
  onPost: () => void
  onCancel: () => void
}

export function PrayerForm({ weekStart, onPost, onCancel }: PrayerFormProps) {
  const { profile } = useSession()
  const [author, setAuthor] = useState(profile?.username ?? "")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.username) setAuthor(profile.username)
  }, [profile?.username])

  const MAX_CONTENT = 500
  const MAX_NAME = 24

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedContent = content.trim()
    const trimmedAuthor = author.trim()

    if (!trimmedContent) {
      setError("内容不能为空")
      return
    }
    if (trimmedContent.length > MAX_CONTENT) {
      setError(`内容不能超过 ${MAX_CONTENT} 字符`)
      return
    }
    if (trimmedAuthor.length > MAX_NAME) {
      setError(`名字不能超过 ${MAX_NAME} 个字符`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/prayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_name: trimmedAuthor || null,
          content: trimmedContent,
          // 如果将来后端需要按提交时周归属校验，可在此传递：week_start: weekStart
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any))
        throw new Error(j.error || "提交失败")
      }

      setContent("")
      setAuthor("")
      onPost()
    } catch (err: any) {
      setError(err?.message || "提交失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="mb-6 space-y-3" onSubmit={handleSubmit}>
      {weekStart && (
        <p className="text-xs text-gray-500">Posting to week: {weekStart}</p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div>
        <input
          className="border p-2 w-full mb-2 rounded-md"
          placeholder="Your name (optional)"
          value={author}
          readOnly={!!profile?.username}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={MAX_NAME}
        />
        <div className="text-xs text-gray-500 text-right">{author.length}/{MAX_NAME}</div>
      </div>

      <div>
        <textarea
          className="border p-2 w-full rounded-md"
          placeholder="Write your prayer here..."
          maxLength={MAX_CONTENT}
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="text-xs text-gray-500 text-right mb-2">{content.length}/{MAX_CONTENT}</div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-300 text-gray-800 py-2 px-4 rounded" disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-blue-500 text-white py-2 px-4 rounded disabled:opacity-50">
          {loading ? "Posting..." : "Post Prayer"}
        </Button>
      </div>
    </form>
  )
}

"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useSession } from '@/lib/useSession'

export type PrayerFormProps = {
  weekStart?: string
  onPost: () => void
  onCancel: () => void
  mode?: 'create' | 'edit'
  prayerId?: string
  initialValues?: {
    content: string
    author_name: string
  }
}

export function PrayerForm({ weekStart, onPost, onCancel, mode = 'create', prayerId, initialValues }: PrayerFormProps) {
  const { profile, session } = useSession()
  const [author, setAuthor] = useState(initialValues?.author_name ?? profile?.username ?? "")
  const [content, setContent] = useState(initialValues?.content ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.username) {
      setAuthor(profile.username)
    } else if (session?.user && !profile) {
      // 如果有session但profile还未加载，使用session中的信息作为fallback
      const fallbackName = session.user.user_metadata?.full_name || 
                           session.user.user_metadata?.name || 
                           session.user.email?.split('@')[0] || ''
      if (fallbackName) setAuthor(fallbackName)
    }
  }, [profile?.username, session?.user])

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
      const url = mode === 'edit' && prayerId 
        ? `/api/prayers?id=${prayerId}` 
        : "/api/prayers"
      const method = mode === 'edit' ? "PATCH" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_name: trimmedAuthor || null,
          content: trimmedContent,
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any))
        throw new Error(j.error || "提交失败")
      }

      if (mode === 'create') {
        setContent("")
        // 只有在没有profile username的情况下才清空author
        if (!profile?.username) {
          setAuthor("")
        }
      }
      onPost()
    } catch (err: any) {
      setError(err?.message || "提交失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="mb-4 sm:mb-6 space-y-4" onSubmit={handleSubmit}>
      {weekStart && (
        <p className="text-xs text-gray-500">Posting to week: {weekStart}</p>
      )}

      {error && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Input
          placeholder="Your name (optional)"
          value={author}
          readOnly={!!profile?.username}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={MAX_NAME}
          className="min-h-[44px] text-base sm:text-sm"
        />
        <div className="text-xs text-muted-foreground text-right">{author.length}/{MAX_NAME}</div>
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="Write your prayer here..."
          maxLength={MAX_CONTENT}
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[120px] text-base md:text-sm resize-none"
        />
        <div className="text-xs text-muted-foreground text-right">{content.length}/{MAX_CONTENT}</div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 pt-2">
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel} 
          disabled={loading}
          className="order-2 sm:order-1 min-h-[44px] text-base sm:text-sm"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className="order-1 sm:order-2 min-h-[44px] text-base sm:text-sm"
        >
          {loading 
            ? (mode === 'edit' ? "Updating..." : "Posting...") 
            : (mode === 'edit' ? "Update Prayer" : "Post Prayer")
          }
        </Button>
      </div>
    </form>
  )
}

"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useSession } from '@/lib/useSession'
import { PRAYER_COLORS } from '@/types/models'

export type PrayerFormProps = {
  weekStart?: string
  onPost: () => void
  onCancel: () => void
  mode?: 'create' | 'edit'
  prayerId?: string
  initialValues?: {
    content?: string
    thanksgiving_content?: string
    intercession_content?: string
    author_name: string
  }
}

export function PrayerForm({ weekStart, onPost, onCancel, mode = 'create', prayerId, initialValues }: PrayerFormProps) {
  const { profile, session } = useSession()
  const [author, setAuthor] = useState(initialValues?.author_name ?? profile?.username ?? "")
  const [thanksgivingContent, setThanksgivingContent] = useState(initialValues?.thanksgiving_content ?? "")
  const [intercessionContent, setIntercessionContent] = useState(initialValues?.intercession_content ?? "")
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

  // Calculate total user content (no markers, user sees full 500 chars)
  const totalCharCount = thanksgivingContent.length + intercessionContent.length
  const hasContent = thanksgivingContent.trim().length > 0 || intercessionContent.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedThanksgiving = thanksgivingContent.trim()
    const trimmedIntercession = intercessionContent.trim()
    const trimmedAuthor = author.trim()

    if (!trimmedThanksgiving && !trimmedIntercession) {
      setError("至少需要填写感恩祷告或代祷请求中的一项")
      return
    }
    if (totalCharCount > MAX_CONTENT) {
      setError(`总字数不能超过 ${MAX_CONTENT} 字符`)
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
          thanksgiving_content: trimmedThanksgiving || null,
          intercession_content: trimmedIntercession || null,
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any))
        throw new Error(j.error || "提交失败")
      }

      if (mode === 'create') {
        setThanksgivingContent("")
        setIntercessionContent("")
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
    <form className="mb-4 sm:mb-6 space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
      {weekStart && (
        <p className="text-xs text-gray-500">Posting to week: {weekStart}</p>
      )}

      {error && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      {/* Author name */}
      <div className="space-y-2">
        <Input
          placeholder="Your name (optional)"
          value={author}
          readOnly={!!profile?.username}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={MAX_NAME}
          className="min-h-[36px] sm:min-h-[44px] text-sm sm:text-base"
        />
        <div className="text-xs text-muted-foreground text-right">{author.length}/{MAX_NAME}</div>
      </div>

      {/* Thanksgiving content */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: '#edcd52' }}
          ></div>
          <label 
            className="text-sm font-medium" 
            style={{ color: '#edcd52' }}
          >
            感恩祷告
          </label>
          <span className="text-xs text-muted-foreground">分享感谢和赞美</span>
        </div>
        <Textarea
          placeholder="感谢神的恩典，分享你心中的感恩..."
          rows={3}
          value={thanksgivingContent}
          onChange={(e) => {
            const newValue = e.target.value
            // Only check user content, not including markers
            const newContentTotal = newValue.length + intercessionContent.length
            if (newContentTotal <= MAX_CONTENT) {
              setThanksgivingContent(newValue)
            }
          }}
          className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base resize-none"
        />
        <div className="text-xs text-muted-foreground text-right">{thanksgivingContent.length} 字</div>
      </div>

      {/* Intercession content */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: '#607ebf' }}
          ></div>
          <label 
            className="text-sm font-medium" 
            style={{ color: '#607ebf' }}
          >
            代祷请求
          </label>
          <span className="text-xs text-muted-foreground">为他人或事情祈求</span>
        </div>
        <Textarea
          placeholder="为他人代祷，分享你的祈求..."
          rows={3}
          value={intercessionContent}
          onChange={(e) => {
            const newValue = e.target.value
            // Only check user content, not including markers
            const newContentTotal = thanksgivingContent.length + newValue.length
            if (newContentTotal <= MAX_CONTENT) {
              setIntercessionContent(newValue)
            }
          }}
          className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base resize-none"
        />
        <div className="text-xs text-muted-foreground text-right">{intercessionContent.length} 字</div>
      </div>

      {/* Total character count */}
      <div className="text-xs text-muted-foreground text-center p-2 bg-gray-50 rounded-md">
        总字数: {totalCharCount}/{MAX_CONTENT}
        {totalCharCount > MAX_CONTENT && (
          <span className="text-red-500 ml-2">超出限制</span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 pt-2">
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel} 
          disabled={loading}
          className="order-2 sm:order-1 min-h-[36px] sm:min-h-[44px] text-sm sm:text-base py-2 sm:py-3 focus:outline-none focus:bg-transparent active:bg-transparent"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading || !hasContent || totalCharCount > MAX_CONTENT}
          className="order-1 sm:order-2 min-h-[36px] sm:min-h-[44px] text-sm sm:text-base py-2 sm:py-3 focus:outline-none focus:bg-transparent active:bg-transparent"
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

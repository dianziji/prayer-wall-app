'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Edit3, AlertCircle } from 'lucide-react'
import { FELLOWSHIP_OPTIONS, type Fellowship, getFellowshipInfo, parseContentWithMarkers } from '@/types/models'
import { filterContent } from '@/lib/content-filter'

interface Prayer {
  id: string
  content: string
  author_name: string | null
  user_id: string | null
  created_at: string | null
  fellowship?: Fellowship
  thanksgiving_content?: string | null
  intercession_content?: string | null
}

interface PrayerEditModalProps {
  prayer: Prayer | null
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

export default function PrayerEditModal({ 
  prayer, 
  isOpen, 
  onClose, 
  onUpdated 
}: PrayerEditModalProps) {
  const [thanksgivingContent, setThanksgivingContent] = useState('')
  const [intercessionContent, setIntercessionContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [fellowship, setFellowship] = useState<Fellowship>('weekday')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (prayer && isOpen) {
      // Check if prayer has categorized content
      if (prayer.thanksgiving_content || prayer.intercession_content) {
        setThanksgivingContent(prayer.thanksgiving_content || '')
        setIntercessionContent(prayer.intercession_content || '')
      } else {
        // Parse legacy content
        const parsed = parseContentWithMarkers(prayer.content)
        setThanksgivingContent(parsed.thanksgiving || '')
        setIntercessionContent(parsed.intercession || '')
      }
      
      setAuthorName(prayer.author_name || '')
      setFellowship(prayer.fellowship || 'weekday')
      setError(null)
    } else if (!isOpen) {
      // Reset form when modal is closed
      setThanksgivingContent('')
      setIntercessionContent('')
      setAuthorName('')
      setFellowship('weekday')
      setError(null)
    }
  }, [prayer, isOpen])

  const MAX_CONTENT = 500
  const MAX_NAME = 24
  const totalCharCount = thanksgivingContent.length + intercessionContent.length
  const hasContent = thanksgivingContent.trim().length > 0 || intercessionContent.trim().length > 0
  const hasAuthor = authorName.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prayer) return

    const trimmedThanksgiving = thanksgivingContent.trim()
    const trimmedIntercession = intercessionContent.trim()
    const trimmedAuthor = authorName.trim()

    // Validation
    if (!trimmedAuthor) {
      setError('请输入您的姓名')
      return
    }
    if (!trimmedThanksgiving && !trimmedIntercession) {
      setError('至少需要填写感恩祷告或代祷请求中的一项')
      return
    }
    if (totalCharCount > MAX_CONTENT) {
      setError(`总字数不能超过 ${MAX_CONTENT} 字符`)
      return
    }

    // Content filtering validation
    const thanksgivingFilter = filterContent(trimmedThanksgiving)
    if (!thanksgivingFilter.isValid) {
      setError(thanksgivingFilter.reason || '感恩祷告内容包含不当词汇')
      return
    }
    
    const intercessionFilter = filterContent(trimmedIntercession)
    if (!intercessionFilter.isValid) {
      setError(intercessionFilter.reason || '代祷请求内容包含不当词汇')
      return
    }
    
    const authorFilter = filterContent(trimmedAuthor)
    if (!authorFilter.isValid) {
      setError('姓名包含不当词汇，请修改后重新提交')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createBrowserSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('Please login to edit prayers')
        return
      }

      const response = await fetch(`/api/prayers?id=${prayer.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          author_name: trimmedAuthor,
          thanksgiving_content: trimmedThanksgiving || null,
          intercession_content: trimmedIntercession || null,
          fellowship
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update prayer')
      }

      onUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating prayer:', error)
      setError(error instanceof Error ? error.message : 'Failed to update prayer')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Edit Prayer
          </DialogTitle>
          <DialogDescription>
            Make changes to your prayer. You can only edit prayers from the current week.
          </DialogDescription>
        </DialogHeader>

        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fellowship selection */}
          <div className="space-y-2">
            <Label htmlFor="fellowship-select" className="text-sm font-medium flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getFellowshipInfo(fellowship).color }}
              />
              团契选择
            </Label>
            
            <select 
              id="fellowship-select"
              value={fellowship} 
              onChange={(e) => setFellowship(e.target.value as Fellowship)}
              disabled={isLoading}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
            >
              {FELLOWSHIP_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              当前选择: {getFellowshipInfo(fellowship).name}
            </p>
          </div>

          {/* Author name field */}
          <div className="space-y-2">
            <Label htmlFor="authorName">姓名 *</Label>
            <Input
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={MAX_NAME}
              placeholder="请输入您的姓名"
              disabled={isLoading}
              required
            />
            <p className="text-xs text-muted-foreground">
              {authorName.length}/{MAX_NAME} 字符
            </p>
          </div>

          {/* Thanksgiving content */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: '#edcd52' }}
              ></div>
              <Label className="text-sm font-medium" style={{ color: '#edcd52' }}>
                感恩祷告
              </Label>
              <span className="text-xs text-muted-foreground">分享感谢和赞美</span>
            </div>
            <Textarea
              placeholder="感谢神的恩典，分享你心中的感恩..."
              rows={3}
              value={thanksgivingContent}
              onChange={(e) => {
                const newValue = e.target.value
                const newContentTotal = newValue.length + intercessionContent.length
                if (newContentTotal <= MAX_CONTENT) {
                  setThanksgivingContent(newValue)
                }
              }}
              disabled={isLoading}
              className="resize-none"
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
              <Label className="text-sm font-medium" style={{ color: '#607ebf' }}>
                代祷请求
              </Label>
              <span className="text-xs text-muted-foreground">为他人或事情祈求</span>
            </div>
            <Textarea
              placeholder="为他人代祷，分享你的祈求..."
              rows={3}
              value={intercessionContent}
              onChange={(e) => {
                const newValue = e.target.value
                const newContentTotal = thanksgivingContent.length + newValue.length
                if (newContentTotal <= MAX_CONTENT) {
                  setIntercessionContent(newValue)
                }
              }}
              disabled={isLoading}
              className="resize-none"
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

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !hasContent || !hasAuthor || totalCharCount > MAX_CONTENT}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>

        {/* Info note */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You can only edit prayers from the current week.
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  )
}
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

interface Prayer {
  id: string
  content: string
  author_name: string | null
  user_id: string | null
  created_at: string | null
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
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (prayer && isOpen) {
      setContent(prayer.content)
      setAuthorName(prayer.author_name || '')
      setError(null)
    }
  }, [prayer, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prayer) return

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
          content: content.trim(),
          author_name: authorName.trim() || null
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
          {/* Author name field */}
          <div className="space-y-2">
            <Label htmlFor="authorName">Display Name (optional)</Label>
            <Input
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={24}
              placeholder="Your name"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {authorName.length}/24 characters
            </p>
          </div>

          {/* Content field */}
          <div className="space-y-2">
            <Label htmlFor="content">Prayer Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              rows={6}
              required
              placeholder="Share your prayer..."
              disabled={isLoading}
              className="resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {content.length}/500 characters
              </p>
              {content.length > 450 && (
                <p className="text-xs text-orange-500">
                  Approaching limit
                </p>
              )}
            </div>
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
              disabled={isLoading || !content.trim()}
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
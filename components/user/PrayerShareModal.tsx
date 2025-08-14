'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Share2, Link, QrCode, FileText, Copy, Download, Smartphone, CheckCircle } from 'lucide-react'

interface Prayer {
  id: string
  content: string
  author_name: string | null
  user_id: string | null
  created_at: string | null
}

interface PrayerShareModalProps {
  prayer: Prayer | null
  isOpen: boolean
  onClose: () => void
}

export default function PrayerShareModal({ 
  prayer, 
  isOpen, 
  onClose 
}: PrayerShareModalProps) {
  const [shareUrl, setShareUrl] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (prayer && isOpen) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const url = `${baseUrl}/prayer/${prayer.id}`
      setShareUrl(url)
      setCopySuccess(false)
    }
  }, [prayer, isOpen])

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  const handleCopyText = async () => {
    if (!prayer) return
    
    const shareText = `"${prayer.content}"

- ${prayer.author_name || 'Anonymous'}

Shared from Prayer Wall
${shareUrl}`

    try {
      await navigator.clipboard.writeText(shareText)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const handleNativeShare = async () => {
    if (!prayer || typeof window === 'undefined' || !('share' in navigator)) return

    try {
      await navigator.share({
        title: 'Prayer from Prayer Wall',
        text: `"${prayer.content}" - ${prayer.author_name || 'Anonymous'}`,
        url: shareUrl
      })
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error sharing:', err)
      }
    }
  }

  const downloadQR = () => {
    if (!prayer) return

    const svg = document.getElementById('prayer-qr')?.innerHTML
    if (!svg) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      canvas.width = 300
      canvas.height = 300
      ctx.drawImage(img, 0, 0, 300, 300)
      
      const link = document.createElement('a')
      link.download = `prayer-${prayer.id.substring(0, 8)}-qr.png`
      link.href = canvas.toDataURL()
      link.click()
      
      URL.revokeObjectURL(url)
    }
    
    img.src = url
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!prayer) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Prayer
          </DialogTitle>
          <DialogDescription>
            Share this prayer with others in various formats
          </DialogDescription>
        </DialogHeader>

        {/* Prayer Preview */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-2">
              <span className="text-sm text-muted-foreground">Sharing prayer by </span>
              <span className="font-medium text-foreground">
                {prayer.author_name || 'Anonymous'}
              </span>
              <span className="text-sm text-muted-foreground ml-2">
                • {formatDate(prayer.created_at)}
              </span>
            </div>
            <p className="text-foreground italic">
              &ldquo;{prayer.content.length > 150 
                ? prayer.content.substring(0, 150) + '...' 
                : prayer.content}&rdquo;
            </p>
          </CardContent>
        </Card>

        {/* Share method tabs */}
        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Link
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              QR Code
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shareUrl">Share URL</Label>
              <div className="flex gap-2">
                <Input
                  id="shareUrl"
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button onClick={handleCopyUrl} size="sm">
                  {copySuccess ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {typeof window !== 'undefined' && 'share' in navigator && (
              <Button onClick={handleNativeShare} className="w-full" variant="outline">
                <Smartphone className="w-4 h-4 mr-2" />
                Share via Device
              </Button>
            )}
          </TabsContent>

          <TabsContent value="qr" className="space-y-4">
            <div className="text-center">
              <div className="inline-block p-4 bg-white border-2 border-border rounded-lg">
                <div id="prayer-qr">
                  <QRCodeSVG
                    value={shareUrl}
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Scan with camera to view prayer
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleCopyUrl} variant="outline" className="flex-1">
                {copySuccess ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copySuccess ? 'Copied' : 'Copy Link'}
              </Button>
              <Button onClick={downloadQR} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download QR
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shareText">Formatted Text</Label>
              <Textarea
                id="shareText"
                value={`"${prayer.content}"

- ${prayer.author_name || 'Anonymous'}

Shared from Prayer Wall
${shareUrl}`}
                readOnly
                rows={6}
                className="resize-none"
              />
            </div>
            
            <Button onClick={handleCopyText} className="w-full">
              {copySuccess ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copySuccess ? 'Copied to Clipboard' : 'Copy Formatted Text'}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Success message */}
        {copySuccess && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Copied to clipboard successfully!</AlertDescription>
          </Alert>
        )}

        {/* Info note */}
        <Alert>
          <Share2 className="h-4 w-4" />
          <AlertDescription>
            Shared prayers can be viewed by anyone with the link. The prayer will be displayed in a beautiful, shareable format.
          </AlertDescription>
        </Alert>

        {/* Close button */}
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

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
  const [shareMethod, setShareMethod] = useState<'url' | 'qr' | 'text'>('url')

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

🙏 Shared from Prayer Wall
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

  if (!isOpen || !prayer) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-screen overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              📤 Share Prayer
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Prayer Preview */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-indigo-400">
            <div className="mb-2">
              <span className="text-sm text-gray-600">Sharing prayer by </span>
              <span className="font-medium text-gray-800">
                {prayer.author_name || 'Anonymous'}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                • {formatDate(prayer.created_at)}
              </span>
            </div>
            <p className="text-gray-800 italic">
              &ldquo;{prayer.content.length > 150 
                ? prayer.content.substring(0, 150) + '...' 
                : prayer.content}&rdquo;
            </p>
          </div>

          {/* Share method selection */}
          <div className="mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setShareMethod('url')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-t-lg ${
                  shareMethod === 'url' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🔗 Link
              </button>
              <button
                onClick={() => setShareMethod('qr')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-t-lg ${
                  shareMethod === 'qr' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📱 QR Code
              </button>
              <button
                onClick={() => setShareMethod('text')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-t-lg ${
                  shareMethod === 'text' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📝 Text
              </button>
            </div>
          </div>

          {/* Share content based on method */}
          <div className="mb-6">
            {shareMethod === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={handleCopyUrl}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                    >
                      {copySuccess ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>

                {typeof window !== 'undefined' && 'share' in navigator && (
                  <button
                    onClick={handleNativeShare}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    📱 Share via Device
                  </button>
                )}
              </div>
            )}

            {shareMethod === 'qr' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                    <div id="prayer-qr">
                      <QRCodeSVG
                        value={shareUrl}
                        size={200}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Scan with camera to view prayer
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyUrl}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    {copySuccess ? '✓ Copied' : 'Copy Link'}
                  </button>
                  <button
                    onClick={downloadQR}
                    className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    Download QR
                  </button>
                </div>
              </div>
            )}

            {shareMethod === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formatted Text
                  </label>
                  <textarea
                    value={`"${prayer.content}"

- ${prayer.author_name || 'Anonymous'}

🙏 Shared from Prayer Wall
${shareUrl}`}
                    readOnly
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm resize-none"
                  />
                </div>
                
                <button
                  onClick={handleCopyText}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  {copySuccess ? '✓ Copied to Clipboard' : 'Copy Formatted Text'}
                </button>
              </div>
            )}
          </div>

          {/* Success message */}
          {copySuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
              ✓ Copied to clipboard successfully!
            </div>
          )}

          {/* Info note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 Shared prayers can be viewed by anyone with the link. The prayer will be displayed in a beautiful, shareable format.
            </p>
          </div>

          {/* Close button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
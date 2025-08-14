"use client"
import QRCode from "react-qr-code"
import { useMemo } from "react"
import { getAppOrigin } from "@/lib/app-config"
import { Button } from '@/components/ui/button'
import { Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

export default function HomeQR() {
  // 使用统一的域名获取逻辑
  const url = useMemo(() => {
    const origin = getAppOrigin()
    return origin.endsWith("/") ? origin : origin + "/"
  }, [])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('URL copied to clipboard!')
    } catch (err) {
      toast.error('Failed to copy URL')
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* QR Code */}
      <div className="p-4 bg-white rounded-lg shadow-sm border">
        <QRCode value={url} size={192} />
      </div>
      
      {/* URL Display */}
      <div className="w-full space-y-3">
        <p className="text-sm text-muted-foreground break-all text-center font-mono bg-slate-100 p-2 rounded">
          {url}
        </p>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex-1"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy URL
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(url, '_blank')}
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Visit
          </Button>
        </div>
      </div>
      
 
    </div>
  )
}
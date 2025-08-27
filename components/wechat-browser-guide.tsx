'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Copy, Check } from 'lucide-react'
import { getWeChatInstructions, copyToClipboard, getOpenInBrowserUrl } from '@/lib/wechat-utils'

interface WeChatBrowserGuideProps {
  targetPath?: string
  lang?: 'zh' | 'en'
  onClose?: () => void
}

export default function WeChatBrowserGuide({ 
  targetPath = '/login', 
  lang = 'zh',
  onClose 
}: WeChatBrowserGuideProps) {
  const [copied, setCopied] = useState(false)
  const instructions = getWeChatInstructions(lang)
  const browserUrl = getOpenInBrowserUrl(targetPath)

  const handleCopyUrl = async () => {
    const success = await copyToClipboard(browserUrl)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F8F6F0' }}>
      <div className="w-full max-w-md">
        <Card className="border-orange-200 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-gray-800 mb-2">
              {instructions.title}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {instructions.subtitle}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Main instruction */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 leading-relaxed">
                {instructions.instruction}
              </p>
            </div>

            {/* Visual guide for WeChat menu */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-full">
                <span>•••</span>
                <span>→</span>
                <span>{lang === 'zh' ? '在浏览器中打开' : 'Open in Browser'}</span>
              </div>
            </div>

            {/* URL display - smaller, less prominent */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">
                {lang === 'zh' ? '链接地址：' : 'URL:'}
              </p>
              <div className="p-2 bg-gray-50 rounded-md text-xs font-mono text-gray-500 break-all border">
                {browserUrl}
              </div>
            </div>

            {/* Copy URL button - optional for users who need it */}
            <Button
              onClick={handleCopyUrl}
              className="w-full"
              variant="outline"
              disabled={copied}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {instructions.copiedText}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  {instructions.copyButtonText}
                </>
              )}
            </Button>

            {/* Alternative text */}
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              {instructions.alternativeText}
            </p>

            {/* Optional close button */}
            {onClose && (
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full text-gray-500"
              >
                {lang === 'zh' ? '返回' : 'Back'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
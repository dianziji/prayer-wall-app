// app/qr/page.tsx
import HomeQR from "@/components/home-qr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode } from 'lucide-react'

export const dynamic = "force-static" // 二维码可静态化

export default function QRPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F8F6F0' }}>
      <div className="max-w-md w-full">
        <section 
          className="rounded-lg sm:rounded-xl border-0 sm:border sm:border-white/20 shadow-none sm:shadow-sm p-6"
          style={{ 
            background: 'radial-gradient(circle at top left, rgba(255, 215, 111, 0.5) 0%, rgba(255, 185, 108, 0.5) 20%, rgba(253, 226, 195, 0.5) 40%, rgba(168, 199, 255, 0.35) 65%, rgba(221, 238, 225, 0.8) 100%)'
          }}
        >
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white/80 rounded-full">
                <QrCode className="w-8 h-8 text-gray-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Prayer Wall QR Code</h1>
            <p className="text-sm text-gray-600">
              Share this QR code to invite others to join our prayer community
            </p>
          </div>
          
          <div className="text-center mt-6">
            <HomeQR />
            
            <div className="mt-6 p-4 bg-white/60 rounded-lg border border-white/40">
              <p className="text-xs text-gray-700">
                提示：可将此页加入书签或打印张贴。二维码始终指向主页，用户扫描后会自动跳转到当周页面。
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
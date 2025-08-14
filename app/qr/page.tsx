// app/qr/page.tsx
import HomeQR from "@/components/home-qr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode } from 'lucide-react'

export const dynamic = "force-static" // 二维码可静态化

export default function QRPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gray-100 rounded-full">
              <QrCode className="w-8 h-8 text-black-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Prayer Wall QR Code</CardTitle>
          <CardDescription>
            Share this QR code to invite others to join our prayer community
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center">
          <HomeQR />
          
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              提示：可将此页加入书签或打印张贴。二维码始终指向主页，用户扫描后会自动跳转到当周页面。
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
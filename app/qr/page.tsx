// app/qr/page.tsx
import HomeQR from "@/components/home-qr"

export const dynamic = "force-static" // 二维码可静态化

export default function QRPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Prayer Wall — QR</h1>
        <HomeQR />
        <p className="text-xs text-gray-400 mt-4">
          提示：可将此页加入书签或打印张贴。二维码始终指向主页 / ，用户扫描后会自动跳转到当周页面。
        </p>
      </div>
    </main>
  )
}
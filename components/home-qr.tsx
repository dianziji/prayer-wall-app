"use client"
import QRCode from "react-qr-code"
import { useMemo } from "react"

export default function HomeQR() {
  // 优先使用 NEXT_PUBLIC_SITE_URL（生产环境可设你的域名），否则在浏览器用 window.origin
  const url = useMemo(() => {
    const env = process.env.NEXT_PUBLIC_SITE_URL
    if (env && env.startsWith("http")) return env.endsWith("/") ? env : env + "/"
    if (typeof window !== "undefined") return window.location.origin + "/"
    return "/"
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      <QRCode value={url} size={192} />
      <p className="text-sm text-gray-600 break-all text-center">{url}</p>
      <p className="text-xs text-gray-400">（扫描后将自动跳转到当周祷告墙）</p>
    </div>
  )
}
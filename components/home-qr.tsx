"use client"
import QRCode from "react-qr-code"
import { useMemo } from "react"
import { getAppOrigin } from "@/lib/app-config"

export default function HomeQR() {
  // 使用统一的域名获取逻辑
  const url = useMemo(() => {
    const origin = getAppOrigin()
    return origin.endsWith("/") ? origin : origin + "/"
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      <QRCode value={url} size={192} />
      <p className="text-sm text-gray-600 break-all text-center">{url}</p>
      <p className="text-xs text-gray-400">（扫描后将自动跳转到当周祷告墙）</p>
    </div>
  )
}
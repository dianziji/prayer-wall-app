'use client'
import { usePathname } from 'next/navigation'
import Header from '@/components/header'

export default function ConditionalHeader() {
  const pathname = usePathname()
  
  // 如果是demo或admin-demo路径，不显示原始header（它们有自己的layout和header）
  if (pathname.startsWith('/demo') || pathname.startsWith('/admin-demo')) {
    return null
  }
  
  return <Header />
}
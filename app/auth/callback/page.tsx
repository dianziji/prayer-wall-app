'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase-browser'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createBrowserSupabase()

    console.log('🔍 Auth Callback Debug:')
    console.log('- Current URL:', window.location.href)
    console.log('- Current origin:', window.location.origin)
    console.log('- Search params:', window.location.search)
    console.log('- Hash:', window.location.hash)

    // 解析 URL hash 并把 token 写入 cookie + localStorage
    supabase.auth
      .getSession()             // getSession 会自动处理 hash -> cookie
      .finally(() => {
        console.log('🔍 Auth Callback - Redirecting to home page from:', window.location.origin)
        // 无论成功还是失败，都跳到首页（首页会再 redirect /week/…）
        router.replace('/')
      })
  }, [router])

  return (
    <main className="p-8 text-center">
      <p className="text-lg">Signing you in…</p>
    </main>
  )
}
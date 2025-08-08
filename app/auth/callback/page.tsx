'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase-browser'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createBrowserSupabase()

    // 解析 URL hash 并把 token 写入 cookie + localStorage
    supabase.auth
      .getSession()             // getSession 会自动处理 hash -> cookie
      .finally(() => {
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
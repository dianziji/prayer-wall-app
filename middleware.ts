// middleware.ts  (项目根)
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// 设置你的生产主域名（用于把其它 vercel 预览域名 301 过来）
const PRIMARY_DOMAIN = 'prayer-wall-app.vercel.app'

export default async function middleware(request: NextRequest) {
  const url = new URL(request.url)

  // 1) 强制所有非主域名的 vercel.app 子域跳到主域名（避免从预览域名发起 OAuth）
  if (url.hostname.endsWith('.vercel.app') && url.hostname !== PRIMARY_DOMAIN) {
    url.hostname = PRIMARY_DOMAIN
    return NextResponse.redirect(url, 301)
  }

  // 2) 兜底：如果带了 ?code= 但路径不是 /auth/callback，则 302 到 /auth/callback
  if (url.searchParams.has('code') && url.pathname !== '/auth/callback') {
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url, 302)
  }

  // 3) 其他请求正常放行，并在需要时刷新 Supabase 的会话 Cookie
  const response = NextResponse.next()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          ),
      },
    },
  )

  // 匿名用户这里是 no-op；登录用户会在这里触发刷新/续签
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    // 排除静态资源和回调本身（回调是否命中由上面的第 2 步兜底处理）
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
// middleware.ts  (项目根)
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// 设置你的生产主域名（用于把其它 vercel 预览域名 301 过来）
const PRIMARY_DOMAIN = 'prayer-wall-app.vercel.app'

export default async function middleware(request: NextRequest) {
  const url = new URL(request.url)

  // 1) 域名重定向策略：
  // - 生产环境：将其他 vercel.app 域名重定向到主域名 (SEO和用户体验)
  // - 预览/开发环境：完全禁用重定向，允许在任意域名测试
  // - OAuth流程：无论什么环境都跳过重定向
  
  const isOAuthFlow = url.searchParams.has('code') || url.searchParams.has('state') || url.searchParams.has('access_token')
  const isProduction = process.env.VERCEL_ENV === 'production'
  
  // 只在生产环境且非OAuth流程时进行域名重定向
  if (isProduction && !isOAuthFlow && url.hostname.endsWith('.vercel.app') && url.hostname !== PRIMARY_DOMAIN) {
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
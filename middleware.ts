// middleware.ts  (项目根)
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/middleware'

export async function middleware(request: NextRequest) {
  // 在所有需要 Supabase Auth 的路由前刷新 cookie
  return await updateSession(request)
}

export const config = {
  matcher: [
    // 这里按需排除静态资源
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
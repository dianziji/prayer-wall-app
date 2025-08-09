// middleware.ts (move this file to project root as /middleware.ts)
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// Set your primary production domain here
const PRIMARY_DOMAIN = 'prayer-wall-app.vercel.app'

export default async function middleware(request: NextRequest) {
  const url = new URL(request.url)

  // 1) Force all non-primary vercel.app subdomains to the primary domain
  if (url.hostname.endsWith('.vercel.app') && url.hostname !== PRIMARY_DOMAIN) {
    url.hostname = PRIMARY_DOMAIN
    return NextResponse.redirect(url, 301)
  }

  // 2) If Supabase sent back ?code=... to a non-callback path, route it to /auth/callback
  if (url.searchParams.has('code') && url.pathname !== '/auth/callback') {
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url, 302)
  }

  // 3) Otherwise, let the request through and refresh session cookies when needed
  const response = NextResponse.next()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          ),
      },
    },
  )

  // Trigger refresh/write new cookies if needed (no-op for anonymous)
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    // Skip static files and the callback route itself (we only redirect other paths with ?code=...)
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
}
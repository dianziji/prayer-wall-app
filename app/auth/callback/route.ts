import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const supabase = await createServerSupabase()

  // Parse ?code= from the URL to be compatible across SDK versions
  const urlObj = new URL(request.url)
  const code = urlObj.searchParams.get('code')
  if (!code) {
    const url = new URL('/login', request.url)
    url.searchParams.set('error', 'Missing auth code')
    return NextResponse.redirect(url)
  }

  // Exchange code → session (writes HttpOnly cookies via createServerSupabase cookies.setAll)
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    const url = new URL('/login', request.url)
    url.searchParams.set('error', error.message)
    return NextResponse.redirect(url)
  }

  // Optional next redirect
  const next = urlObj.searchParams.get('next') || '/'
  return NextResponse.redirect(new URL(next, request.url))
}

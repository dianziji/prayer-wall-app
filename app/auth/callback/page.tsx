'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase-browser'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      const supabase = createBrowserSupabase();
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch (error) {
          console.error('Error exchanging code for session:', error);
        }
      }
      router.replace('/');
    };

    run();
  }, [router])

  return (
    <main className="p-8 text-center">
      <p className="text-lg">Signing you in…</p>
    </main>
  )
}
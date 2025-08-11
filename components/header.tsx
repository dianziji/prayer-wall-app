'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { useSession } from '@/lib/useSession'

type Profile = { username: string | null; avatar_url: string | null }

if (typeof window !== 'undefined' && !(window as any).supabaseTest) {
  ;(window as any).supabaseTest = createBrowserSupabase
}


export default function Header() {
    
  const [menuOpen, setMenuOpen] = useState(false)

  const { session, profile } = useSession()
  const userEmail = session?.user.email ?? null

  function toggleMenu() {
    setMenuOpen(prev => !prev)
  }

  function handleLogout() {
    createBrowserSupabase().auth.signOut().finally(() => {
      setMenuOpen(false)
      window.location.reload()
    })
  }


  return (
    <header className="bg-white shadow-sm relative overflow-visible z-30">
      <div className="h-12 max-w-6xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="font-bold">Prayer Wall</Link>

        {/* right‑side buttons + account menu */}
        <div className="flex items-center gap-4">
          <Link
            href="/qr"
            className="text-sm hover:text-indigo-600 transition-colors"
          >
            QR Code
          </Link>
          <Link
            href="/archive"
            className="text-sm hover:text-indigo-600 transition-colors"
          >
            Archive
          </Link>
          {userEmail ? (
            <div className="relative">
              <button
                onClick={toggleMenu}
                className="flex items-center gap-2 hover:text-indigo-600 focus:outline-none"
              >
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="avatar" className="w-8 h-8 rounded-full" />
                ) : (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 text-white">
                    {(profile?.username || userEmail)?.[0]?.toUpperCase() ?? 'U'}
                  </span>
                )}
                <span className="text-sm">{profile?.username || userEmail}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded shadow-lg z-50">
                  <Link
                    href="/account"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/my-prayers"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Prayers
                  </Link>
                  <Link
                    href="/reminders"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    🔔 Reminders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-sm text-indigo-600">Login</Link>
          )}
        </div>
      </div>
    </header>
  )
}
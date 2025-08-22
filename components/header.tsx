'use client'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { useSession } from '@/lib/useSession'
import { Button } from '@/components/ui/button'
import { QrCode } from "lucide-react";

type Profile = { username: string | null; avatar_url: string | null }

if (typeof window !== 'undefined' && !(window as any).supabaseTest) {
  ;(window as any).supabaseTest = createBrowserSupabase
}


export default function Header() {
    
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  // 点击外部区域关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])


  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="h-14 sm:h-16 max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="font-bold text-base sm:text-lg text-gray-900 hover:text-indigo-600 transition-colors focus:outline-none focus:text-gray-900 active:text-gray-900">
          Prayer Wall
        </Link>

        {/* right‑side buttons + account menu */}
        <div className="flex items-center gap-2">
<Button variant="ghost" size="sm" asChild>
  <Link href="/qr" className="flex items-center gap-1 focus:outline-none focus:bg-transparent active:bg-transparent">
     <QrCode className="w-4 h-4 sm:mr-1" />
    <span className="hidden sm:inline">QR Code</span>
  </Link>
</Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/archive" className="focus:outline-none focus:bg-transparent active:bg-transparent">
              Archive
            </Link>
          </Button>
          {userEmail ? (
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                onClick={toggleMenu}
                className="flex items-center gap-1 sm:gap-2 h-10 px-2 focus:outline-none focus:bg-transparent active:bg-transparent"
              >
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="avatar" className="w-8 h-8 rounded-full" />
                ) : (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 text-white">
                    {(profile?.username || userEmail)?.[0]?.toUpperCase() ?? 'U'}
                  </span>
                )}
                <span className="text-xs sm:text-sm hidden sm:inline">{profile?.username || userEmail}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white border border-gray-200 rounded-md shadow-lg z-dropdown">
                  <div className="py-1">
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/my-prayers"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      My Prayers
                    </Link>
                    <hr className="my-1 border-gray-200" />
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 h-auto"
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login" className="focus:outline-none focus:bg-transparent active:bg-transparent">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
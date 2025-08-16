'use client'

import { useSession } from '@/lib/useSession'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PrayerStats from '@/components/user/PrayerStats'
import PrayerAnalytics from '@/components/user/PrayerAnalytics'
import PrayerTimeline from '@/components/user/PrayerTimeline'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, BookOpen, Bell } from 'lucide-react'

export default function MyPrayersPage() {
  const { session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session !== null) {
      setIsLoading(false)
      if (!session) {
        router.push('/login')
      }
    }
  }, [session, router])

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F6F0' }}>
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading your prayers...</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!session) {
    return null // Will redirect to login
  }

  return (
    <main className="min-h-screen py-4 sm:py-8" style={{ backgroundColor: '#F8F6F0' }}>
      <div className="max-w-6xl lg:max-w-7xl xl:max-w-8xl mx-auto px-2 sm:px-6 space-y-4 sm:space-y-6">
        {/* Page Header */}
        <section 
          className="rounded-lg sm:rounded-xl border-0 sm:border sm:border-white/20 shadow-none sm:shadow-sm p-3 sm:p-6"
          style={{ 
            background: 'radial-gradient(circle at top left, rgba(255, 215, 111, 0.5) 0%, rgba(255, 185, 108, 0.5) 20%, rgba(253, 226, 195, 0.5) 40%, rgba(168, 199, 255, 0.35) 65%, rgba(221, 238, 225, 0.8) 100%)'
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/80 rounded-full">
                <BookOpen className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">My Prayers</h1>
                <p className="text-sm text-gray-600">
                  Track your prayer journey and spiritual growth
                </p>
              </div>
            </div>
            <Button 
              asChild 
              className="w-full sm:w-auto px-4 sm:px-6 py-3 text-base sm:text-lg min-h-[44px] touch-manipulation focus:outline-none focus:bg-transparent active:bg-transparent text-black hover:opacity-90"
              style={{ backgroundColor: '#ffca39' }}
            >
              <Link href="/reminders" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Prayer Reminders
              </Link>
            </Button>
          </div>
        </section>

        {/* Stats Dashboard */}
        <section 
          className="bg-transparent sm:bg-white/70 sm:backdrop-blur-sm rounded-lg sm:rounded-xl border-0 sm:border sm:border-white/20 shadow-none sm:shadow-sm p-0 sm:p-6"
          style={{ 
            background: 'linear-gradient(to top right, rgba(255, 215, 111, 0.2) 0%, rgba(255, 185, 108, 0.2) 20%, rgba(253, 226, 195, 0.2) 40%, rgba(168, 199, 255, 0.05) 65%, rgba(221, 238, 225, 0.5) 100%)'
          }}
        >
          <PrayerStats />
        </section>

        {/* Analytics Dashboard */}
        <section 
          className="bg-transparent sm:bg-white/70 sm:backdrop-blur-sm rounded-lg sm:rounded-xl border-0 sm:border sm:border-white/20 shadow-none sm:shadow-sm p-0 sm:p-6"
          style={{ 
            background: 'linear-gradient(to top right, rgba(255, 215, 111, 0.2) 0%, rgba(255, 185, 108, 0.2) 20%, rgba(253, 226, 195, 0.2) 40%, rgba(168, 199, 255, 0.05) 65%, rgba(221, 238, 225, 0.5) 100%)'
          }}
        >
          <PrayerAnalytics />
        </section>

        {/* Prayer Timeline */}
        <section 
          className="bg-transparent sm:bg-white/70 sm:backdrop-blur-sm rounded-lg sm:rounded-xl border-0 sm:border sm:border-white/20 shadow-none sm:shadow-sm p-0 sm:p-6"
          style={{ 
            background: 'linear-gradient(to top right, rgba(255, 215, 111, 0.2) 0%, rgba(255, 185, 108, 0.2) 20%, rgba(253, 226, 195, 0.2) 40%, rgba(168, 199, 255, 0.05) 65%, rgba(221, 238, 225, 0.5) 100%)'
          }}
        >
          <PrayerTimeline />
        </section>
      </div>
    </main>
  )
}
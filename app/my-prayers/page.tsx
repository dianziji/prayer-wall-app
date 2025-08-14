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
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <Card className="mb-6 sm:mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-full">
                  <BookOpen className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">My Prayers</h1>
                  <p className="text-sm text-muted-foreground">
                    Track your prayer journey and spiritual growth
                  </p>
                </div>
              </div>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/reminders" className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Prayer Reminders
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Dashboard */}
        <div className="mb-6 sm:mb-8">
          <PrayerStats />
        </div>

        {/* Analytics Dashboard */}
        <div className="mb-6 sm:mb-8">
          <PrayerAnalytics />
        </div>

        {/* Prayer Timeline */}
        <PrayerTimeline />
      </div>
    </main>
  )
}
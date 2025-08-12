'use client'

import { useSession } from '@/lib/useSession'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PrayerStats from '@/components/user/PrayerStats'
import PrayerAnalytics from '@/components/user/PrayerAnalytics'
import PrayerTimeline from '@/components/user/PrayerTimeline'
import Link from 'next/link'

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
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  if (!session) {
    return null // Will redirect to login
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Prayers</h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                Track your prayer journey and spiritual growth
              </p>
            </div>
            <Link
              href="/reminders"
              className="flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm sm:text-base min-h-[44px] touch-manipulation w-full sm:w-auto justify-center sm:justify-start"
            >
              🔔 Prayer Reminders
            </Link>
          </div>
        </div>

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
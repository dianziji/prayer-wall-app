'use client'

import { useSession } from '@/lib/useSession'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PrayerReminders from '@/components/user/PrayerReminders'
import PrayerReminderTester from '@/components/user/PrayerReminderTester'
import Link from 'next/link'

export default function RemindersPage() {
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
      <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  if (!session) {
    return null // Will redirect to login
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-purple-600 transition-colors">
              Prayer Wall
            </Link>
            <span>•</span>
            <Link href="/my-prayers" className="hover:text-purple-600 transition-colors">
              My Prayers
            </Link>
            <span>•</span>
            <span className="text-purple-600 font-medium">Reminders</span>
          </div>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">🔔</div>
            <h1 className="text-3xl font-bold text-gray-900">Prayer Reminders</h1>
          </div>
          <p className="text-lg text-gray-600">
            Set up personalized prayer reminders to help maintain your spiritual practice
          </p>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-purple-600">⏰</span>
              <h3 className="font-semibold text-gray-800">Custom Times</h3>
            </div>
            <p className="text-sm text-gray-600">
              Set personalized reminder times that fit your daily schedule
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-purple-600">📅</span>
              <h3 className="font-semibold text-gray-800">Flexible Schedule</h3>
            </div>
            <p className="text-sm text-gray-600">
              Choose daily, weekly, or custom day patterns
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-purple-600">💬</span>
              <h3 className="font-semibold text-gray-800">Personal Messages</h3>
            </div>
            <p className="text-sm text-gray-600">
              Customize reminder messages that inspire you
            </p>
          </div>
        </div>

        {/* Main Reminders Component */}
        <div className="mb-8">
          <PrayerReminders />
        </div>

        {/* Debug: Prayer Reminder Tester - Only in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8">
            <PrayerReminderTester />
          </div>
        )}

        {/* Help & Tips Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            💡 Tips for Effective Prayer Reminders
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Best Practices</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Choose consistent times that align with your daily routine</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Start with shorter, more frequent reminders</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Use personal, meaningful messages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Test your reminders to ensure they work</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Troubleshooting</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">?</span>
                  <span>Not receiving notifications? Check browser permission settings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">?</span>
                  <span>Wrong timing? Verify your system&apos;s timezone settings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">?</span>
                  <span>Settings not saving? Clear browser cache and try again</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">?</span>
                  <span>Use the test buttons to verify functionality</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">🙏 Remember</h4>
            <p className="text-sm text-purple-700">
              Prayer reminders are tools to support your spiritual journey. The most important thing 
              is your heart&apos;s intention and openness to connect with the divine. Let these reminders 
              guide you, but don&apos;t let them become a burden.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="text-center mt-8">
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/my-prayers"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              📊 View My Prayers
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              🏠 Back to Prayer Wall
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
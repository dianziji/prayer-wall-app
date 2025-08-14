'use client'

import { useSession } from '@/lib/useSession'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PrayerReminders from '@/components/user/PrayerReminders'
import PrayerReminderTester from '@/components/user/PrayerReminderTester'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Clock, Calendar, MessageSquare, Lightbulb, Heart, Home, BarChart3, HelpCircle, CheckCircle } from 'lucide-react'

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
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </main>
    )
  }

  if (!session) {
    return null // Will redirect to login
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <Card className="mb-6 sm:mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-full">
                  <Bell className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Prayer Reminders</h1>
                  <p className="text-sm text-muted-foreground">
                    Set up personalized prayer reminders to help maintain your spiritual practice
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/my-prayers" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    My Prayers
                  </Link>
                </Button>
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Prayer Wall
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Custom Times</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Set personalized reminder times that fit your daily schedule
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Flexible Schedule</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Choose daily, weekly, or custom day patterns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Personal Messages</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Customize reminder messages that inspire you
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Reminders Component */}
        <div className="mb-6 sm:mb-8">
          <PrayerReminders />
        </div>

        {/* Debug: Prayer Reminder Tester - Only in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 sm:mb-8">
            <PrayerReminderTester />
          </div>
        )}

        {/* Help & Tips Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Tips for Effective Prayer Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Best Practices</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Choose consistent times that align with your daily routine</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Start with shorter, more frequent reminders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Use personal, meaningful messages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Test your reminders to ensure they work</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Troubleshooting</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Not receiving notifications? Check browser permission settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Wrong timing? Verify your system&apos;s timezone settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Settings not saving? Clear browser cache and try again</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Use the test buttons to verify functionality</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted border border-border rounded-lg">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Remember
              </h4>
              <p className="text-sm text-muted-foreground">
                Prayer reminders are tools to support your spiritual journey. The most important thing 
                is your heart&apos;s intention and openness to connect with the divine. Let these reminders 
                guide you, but don&apos;t let them become a burden.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </main>
  )
}
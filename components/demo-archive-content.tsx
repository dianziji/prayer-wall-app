'use client'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { useLocale } from '@/lib/locale-context'

export function DemoArchiveContent() {
  const { locale, t } = useLocale()

  // Demo数据 - 一些示例的历史周
  const demoArchiveWeeks = [
    {
      week_start_et: '2025-08-24',
      prayer_count: 8,
      first_prayer_at: '2025-08-24T10:30:00Z',
      last_prayer_at: '2025-08-30T22:15:00Z'
    },
    {
      week_start_et: '2025-08-17', 
      prayer_count: 12,
      first_prayer_at: '2025-08-17T09:15:00Z',
      last_prayer_at: '2025-08-23T20:45:00Z'
    },
    {
      week_start_et: '2025-08-10',
      prayer_count: 15,
      first_prayer_at: '2025-08-10T11:20:00Z', 
      last_prayer_at: '2025-08-16T21:30:00Z'
    },
    {
      week_start_et: '2025-08-03',
      prayer_count: 9,
      first_prayer_at: '2025-08-03T08:45:00Z',
      last_prayer_at: '2025-08-09T19:20:00Z'
    }
  ]

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {locale === 'en' ? 'Prayer Wall Archive' : '祷告墙历史记录'}
        </h1>
        <p className="text-gray-600">
          {locale === 'en' ? 'Browse historical prayer weeks' : '浏览历史祷告周'}
        </p>
      </div>

      {/* Archive List */}
      <div className="space-y-4">
        {demoArchiveWeeks.map((week) => (
          <Link 
            key={week.week_start_et}
            href={`/demo/week/${week.week_start_et}`}
            className="block"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {locale === 'en' ? 
                        `Week of ${new Date(week.week_start_et).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}` :
                        `${new Date(week.week_start_et).toLocaleDateString('zh-CN', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} 的祷告周`
                      }
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {week.prayer_count} {locale === 'en' ? 'prayers' : '个祷告'} · 
                      {week.first_prayer_at && ` ${new Date(week.first_prayer_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN')}`} - 
                      {week.last_prayer_at && ` ${new Date(week.last_prayer_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN')}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {week.prayer_count}
                    </div>
                    <div className="text-sm text-gray-500">
                      {locale === 'en' ? 'prayers' : '祷告'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Back to current */}
      <div className="text-center mt-8">
        <Link
          href="/demo"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          ← {locale === 'en' ? 'Back to Current Week' : '返回当前周'}
        </Link>
      </div>
    </>
  )
}
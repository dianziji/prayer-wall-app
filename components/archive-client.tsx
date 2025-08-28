'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Archive } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from '@/lib/locale-context'
import { formatDate } from '@/lib/i18n'

type WeekRow = { week_start_et: string; prayer_count: number }

type Props = {
  weeks: WeekRow[]
  error?: boolean
}

export default function ArchiveClient({ weeks, error }: Props) {
  const { t, locale } = useLocale()

  if (error) {
    return (
      <main className="min-h-screen py-4 sm:py-8" style={{ backgroundColor: '#F8F6F0' }}>
        <div className="max-w-6xl lg:max-w-7xl xl:max-w-8xl mx-auto px-2 sm:px-6 space-y-4 sm:space-y-6">
          <section 
            className="rounded-lg sm:rounded-xl border-0 sm:border sm:border-white/20 shadow-none sm:shadow-sm p-3 sm:p-6"
            style={{ 
              background: 'radial-gradient(circle at top left, rgba(255, 215, 111, 0.5) 0%, rgba(255, 185, 108, 0.5) 20%, rgba(253, 226, 195, 0.5) 40%, rgba(168, 199, 255, 0.35) 65%, rgba(221, 238, 225, 0.8) 100%)'
            }}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/80 rounded-full">
                <Archive className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">{t('archive')}</h1>
                <p className="text-destructive text-sm">{t('loading_error')}</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-4 sm:py-8" style={{ backgroundColor: '#F8F6F0' }}>
      <div className="max-w-6xl lg:max-w-7xl xl:max-w-8xl mx-auto px-2 sm:px-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <section 
          className="rounded-lg sm:rounded-xl border-0 sm:border sm:border-white/20 shadow-none sm:shadow-sm p-3 sm:p-6"
          style={{ 
            background: 'radial-gradient(circle at top left, rgba(255, 215, 111, 0.5) 0%, rgba(255, 185, 108, 0.5) 20%, rgba(253, 226, 195, 0.5) 40%, rgba(168, 199, 255, 0.35) 65%, rgba(221, 238, 225, 0.8) 100%)'
          }}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/80 rounded-full">
              <Archive className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">{t('archive')}</h1>
              <p className="text-sm text-gray-600">
                {t('explore_past_prayers')}
              </p>
            </div>
          </div>
        </section>
        
        {/* Content */}
        <section 
          className="bg-transparent sm:bg-white/70 sm:backdrop-blur-sm rounded-lg sm:rounded-xl border-0 sm:border sm:border-white/20 shadow-none sm:shadow-sm p-0 sm:p-6"
          style={{ 
            background: 'linear-gradient(to top right, rgba(255, 215, 111, 0.2) 0%, rgba(255, 185, 108, 0.2) 20%, rgba(253, 226, 195, 0.2) 40%, rgba(168, 199, 255, 0.05) 65%, rgba(221, 238, 225, 0.5) 100%)'
          }}
        >
            {weeks.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {t('no_archive_weeks')}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {weeks.map((w) => (
                    <Link key={w.week_start_et} href={`/week/${w.week_start_et}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white/60 border-white/40">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">
                                {locale === 'en' 
                                  ? `Week of ${formatDate(w.week_start_et, 'en')}`
                                  : `${formatDate(w.week_start_et, 'zh-CN')} 周`
                                }
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {w.week_start_et}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {w.prayer_count}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
                
                <p className="text-sm text-muted-foreground text-center border-t pt-4">
                  {t('archive_note')}
                </p>
              </>
            )}
        </section>
      </div>
    </main>
  )
}
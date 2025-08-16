// app/archive/page.tsx
import { createServerSupabase } from '@/lib/supabase-server'
import { getCurrentWeekStartET } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Archive } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type WeekRow = { week_start_et: string; prayer_count: number }

export default async function ArchivePage() {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('archive_weeks')
    .select('week_start_et, prayer_count')
    .order('week_start_et', { ascending: false })
    .limit(52)

  if (error) {
    console.error('archive_weeks error:', error)
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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Prayer History</h1>
                <p className="text-destructive text-sm">Failed to load archive.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    )
  }

  const current = getCurrentWeekStartET()              // 本周周日（ET）
  const rows: WeekRow[] = (data ?? []) as WeekRow[]    // 明确类型
  const weeks = rows.filter((w) => w.week_start_et !== current)

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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Prayer History</h1>
              <p className="text-sm text-gray-600">
                Explore past weeks of prayers and community support
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
                  暂无历史周墙（还没有过往祷告）。
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
                                Week of {new Date(w.week_start_et).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
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
                  仅显示过往的周；当前周不会出现在这里。
                </p>
              </>
            )}
        </section>
      </div>
    </main>
  )
}
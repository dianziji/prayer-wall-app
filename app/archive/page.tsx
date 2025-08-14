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
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5" />
                Prayer History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">Failed to load archive.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const current = getCurrentWeekStartET()              // 本周周日（ET）
  const rows: WeekRow[] = (data ?? []) as WeekRow[]    // 明确类型
  const weeks = rows.filter((w) => w.week_start_et !== current)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="w-6 h-6" />
              Prayer History
            </CardTitle>
            <CardDescription>
              Explore past weeks of prayers and community support
            </CardDescription>
          </CardHeader>
          
          <CardContent>
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
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
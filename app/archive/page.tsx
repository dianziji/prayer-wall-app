// app/archive/page.tsx
import { createClient } from '@/lib/supabase'
import { getCurrentWeekStartET } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type WeekRow = { week_start_et: string; prayer_count: number }

export default async function ArchivePage() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('archive_weeks')
    .select('week_start_et, prayer_count')
    .order('week_start_et', { ascending: false })
    .limit(52)

  if (error) {
    console.error('archive_weeks error:', error)
    return (
      <main className="min-h-screen p-6">
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="text-red-500 mt-4">Failed to load archive.</p>
      </main>
    )
  }

  const current = getCurrentWeekStartET()              // 本周周日（ET）
  const weeks: WeekRow[] = (data ?? []).filter(
    (w) => w.week_start_et !== current                 // 排除当周
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">History</h1>

        {weeks.length === 0 ? (
          <p className="text-gray-600">暂无历史周墙（还没有过往祷告）。</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {weeks.map((w) => (
              <li key={w.week_start_et} className="bg-white rounded-lg shadow-sm border p-4">
                <a className="text-indigo-600 hover:underline" href={`/week/${w.week_start_et}`}>
                  Week of {w.week_start_et}
                </a>
                <span className="ml-2 text-sm text-gray-500">({w.prayer_count})</span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-sm text-gray-500">
          仅显示过往的周；当前周不会出现在这里。
        </p>
      </div>
    </main>
  )
}
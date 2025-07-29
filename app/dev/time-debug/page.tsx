// app/dev/time-debug/page.tsx
import { APP_TZ, getCurrentWeekStartET, getWeekRangeUtc, isCurrentWeek } from '@/lib/utils'

export const dynamic = 'force-dynamic' // 避免被静态缓存

export default function TimeDebugPage() {
  const weekStart = getCurrentWeekStartET()
  const range = getWeekRangeUtc(weekStart)

  const rows = [
    ['App 时区（预期 America/New_York）', APP_TZ],
    ['当前时间（ET 本地化）', new Date().toLocaleString('en-US', { timeZone: APP_TZ })],
    ['本周周日（ET）YYYY-MM-DD', weekStart],
    ['本周起始（UTC ISO，用于查询 >=）', range.startUtcISO],
    ['下周起始（UTC ISO，用于查询 <）', range.endUtcISO],
    ['isCurrentWeek(weekStart)', String(isCurrentWeek(weekStart))],
  ]

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Time Utils Debug</h1>
      <ul className="space-y-2">
        {rows.map(([k, v]) => (
          <li key={k as string}>
            <strong>{k}：</strong> {v as string}
          </li>
        ))}
      </ul>
      <p className="text-sm text-gray-500">
        提示：本页仅用于临时调试，功能完成后可以删除。
      </p>
    </main>
  )
}
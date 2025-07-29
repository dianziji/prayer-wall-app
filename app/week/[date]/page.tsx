// app/week/[date]/page.tsx
import Link from 'next/link'
import { WeeklyWallClient } from '@/components/weekly-wall-client'
import { isCurrentWeek, normalizeToEtSunday } from '@/lib/utils'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function WeekPage({ params }: { params: Promise<{ date: string }> }) {
  // Next 15: params is async and must be awaited
  const { date } = await params
  const canonical = normalizeToEtSunday(String(date ?? ''))

  // 若不是周日，重定向到规范的周日链接
  if (canonical !== date) {
    redirect(`/week/${canonical}`)
  }

  const readOnly = !isCurrentWeek(canonical)

  return (
    <>
      {/* 顶部工具栏：Archive 与 QR 固定入口 */}
      <div className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-end gap-3">
          <Link
            href="/archive"
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Archive
          </Link>
          <Link
            href="/qr"
            className="inline-flex items-center rounded-md bg-indigo-600 text-white px-3 py-1.5 text-sm hover:bg-indigo-700"
          >
            QR
          </Link>
        </div>
      </div>

      <WeeklyWallClient weekStart={canonical} readOnly={readOnly} />
    </>
  )
}
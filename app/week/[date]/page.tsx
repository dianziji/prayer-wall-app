// app/week/[date]/page.tsx
import Link from 'next/link'
import { WeeklyWallClient } from '@/components/weekly-wall-client'
import { isCurrentWeek, normalizeToEtSunday } from '@/lib/utils'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type PageProps = { params: { date: string } }

export default function WeekPage({ params: routeParams }: PageProps) {
  const canonical = normalizeToEtSunday(routeParams.date)

  // 如果传入的不是周日，比如 /week/2025-07-22，就规范化到 /week/2025-07-20
  if (canonical !== routeParams.date) {
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
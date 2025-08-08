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
      <WeeklyWallClient weekStart={canonical} readOnly={readOnly} />
    </>
  )
}
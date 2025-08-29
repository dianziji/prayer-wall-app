import { DemoWallClient } from '@/components/demo-wall-client'
import { DemoWeekNotice } from '@/components/demo-week-notice'
import { normalizeToEtSunday } from '@/lib/utils'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DemoWeekPage({ params }: { params: Promise<{ date: string }> }) {
  // Next 15: params is async and must be awaited
  const { date } = await params
  const canonical = normalizeToEtSunday(String(date ?? ''))

  // 若不是周日，重定向到规范的周日链接
  if (canonical !== date) {
    redirect(`/demo/week/${canonical}`)
  }

  return (
    <main className="min-h-screen py-4 sm:py-8" style={{ backgroundColor: '#F8F6F0' }}>
      <div className="max-w-6xl lg:max-w-7xl xl:max-w-8xl mx-auto px-2 sm:px-6 space-y-4 sm:space-y-6">
        <DemoWeekNotice weekStart={canonical} />
        <DemoWallClient weekStart={canonical} />
      </div>
    </main>
  )
}
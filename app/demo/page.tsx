import { DemoWallClient } from '@/components/demo-wall-client'
import { DemoNotice } from '@/components/demo-notice'
import { getCurrentWeekStartET } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DemoPage() {
  const currentWeek = getCurrentWeekStartET()
  
  return (
    <main className="min-h-screen py-4 sm:py-8" style={{ backgroundColor: '#F8F6F0' }}>
      <div className="max-w-6xl lg:max-w-7xl xl:max-w-8xl mx-auto px-2 sm:px-6 space-y-4 sm:space-y-6">
        <DemoNotice />
        <DemoWallClient weekStart={currentWeek} />
      </div>
    </main>
  )
}
import { redirect } from 'next/navigation'
import { getCurrentWeekStartET } from '@/lib/utils'
export const dynamic = 'force-dynamic'

export default function HomePage() {
  const weekStart = getCurrentWeekStartET()
  redirect(`/week/${weekStart}`)
}
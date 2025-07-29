// app/page.tsx
import { redirect } from 'next/navigation'
import { getCurrentWeekStartET } from '@/lib/utils'
export const dynamic = 'force-dynamic'


export default function HomePage() {
  const weekStart = getCurrentWeekStartET() // 例如 "2025-07-27"
  redirect(`/week/${weekStart}`)
}
'use client'
import { DemoWeeklyWallClient } from '@/components/demo-weekly-wall-client'

type DemoWallClientProps = {
  weekStart: string
}

export function DemoWallClient({ weekStart }: DemoWallClientProps) {
  return (
    <DemoWeeklyWallClient weekStart={weekStart} />
  )
}
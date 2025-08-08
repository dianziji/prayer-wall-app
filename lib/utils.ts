import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}
// ---- Time helpers (ET, Sunday start) ----
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'


dayjs.extend(utc)
dayjs.extend(timezone)

export const APP_TZ = 'America/New_York' as const

/** 本周周日 00:00（美东）的 YYYY-MM-DD */
export function getCurrentWeekStartET(): string {
  const nowET = dayjs().tz(APP_TZ)
  // day(): Sunday=0 ... Saturday=6
  const sundayET = nowET.startOf('day').subtract(nowET.day(), 'day')
  return sundayET.format('YYYY-MM-DD')
}

/** 给定“周日(ET)”YYYY-MM-DD，返回该周在 UTC 下的起止 ISO，用于 DB 过滤 */
export function getWeekRangeUtc(weekStartYYYYMMDD: string): {
  startUtcISO: string
  endUtcISO: string
} {
  const startET = dayjs.tz(weekStartYYYYMMDD, 'YYYY-MM-DD', APP_TZ).startOf('day')
  if (!startET.isValid()) throw new Error(`Invalid weekStart date string: ${weekStartYYYYMMDD}`)
  const endET = startET.add(7, 'day')
  return {
    startUtcISO: startET.utc().toISOString(),
    endUtcISO: endET.utc().toISOString(),
  }
}

/** 判断给定“周日(ET)”是否就是本周 */
export function isCurrentWeek(weekStartYYYYMMDD: string): boolean {
  return getCurrentWeekStartET() === weekStartYYYYMMDD
}


// 在 lib/utils.ts 末尾追加


export function getRecentWeeksET(n: number): string[] {
  // 以“周日”为起点，返回最近 n 个周日（含本周周日）
  const out: string[] = []
  const now = dayjs().tz(APP_TZ)
  const thisSunday = now.startOf("day").subtract(now.day(), "day") // 本周周日
  for (let i = 0; i < n; i++) {
    out.push(thisSunday.subtract(i, "week").format("YYYY-MM-DD"))
  }
  return out
}
// lib/utils.ts 末尾追加
export function normalizeToEtSunday(dateStr: string): string {
  // 把任意 YYYY-MM-DD 视为 ET 的某天，然后取该周的周日
  const d = dayjs.tz(dateStr, 'YYYY-MM-DD', APP_TZ)
  if (!d.isValid()) return getCurrentWeekStartET()
  const sunday = d.startOf('day').subtract(d.day(), 'day') // Sunday=0
  return sunday.format('YYYY-MM-DD')
}


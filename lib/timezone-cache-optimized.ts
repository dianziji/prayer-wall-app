// 极速NYC时区优化 - 专为纽约教会优化
// 大部分用户都在NYC，可以激进缓存

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const APP_TZ = 'America/New_York' as const

// 内存缓存 - 服务器重启后重置
let currentWeekCache: {
  weekStart: string
  utcRange: { startUtcISO: string; endUtcISO: string }
  cacheDate: string
} | null = null

/**
 * 超快速获取当前周 - 每天只计算一次
 */
export function getCachedCurrentWeekET(): string {
  const today = new Date().toDateString() // 今天的日期字符串
  
  // 如果缓存存在且是今天的，直接返回
  if (currentWeekCache && currentWeekCache.cacheDate === today) {
    return currentWeekCache.weekStart
  }
  
  // 重新计算并缓存
  const nowET = dayjs().tz(APP_TZ)
  const sundayET = nowET.startOf('day').subtract(nowET.day(), 'day')
  const weekStart = sundayET.format('YYYY-MM-DD')
  
  // 同时计算UTC范围，避免重复计算
  const startET = dayjs.tz(weekStart, 'YYYY-MM-DD', APP_TZ).startOf('day')
  const endET = startET.add(7, 'day')
  
  currentWeekCache = {
    weekStart,
    utcRange: {
      startUtcISO: startET.utc().toISOString(),
      endUtcISO: endET.utc().toISOString(),
    },
    cacheDate: today
  }
  
  return weekStart
}

/**
 * 超快速获取周范围UTC - 配合缓存使用
 */
export function getCachedWeekRangeUtc(weekStartYYYYMMDD: string): {
  startUtcISO: string
  endUtcISO: string
} {
  const today = new Date().toDateString()
  
  // 如果请求的是当前周，使用缓存
  if (currentWeekCache && 
      currentWeekCache.cacheDate === today &&
      currentWeekCache.weekStart === weekStartYYYYMMDD) {
    return currentWeekCache.utcRange
  }
  
  // 对于历史周，正常计算（这种情况较少）
  const startET = dayjs.tz(weekStartYYYYMMDD, 'YYYY-MM-DD', APP_TZ).startOf('day')
  if (!startET.isValid()) throw new Error(`Invalid weekStart date string: ${weekStartYYYYMMDD}`)
  const endET = startET.add(7, 'day')
  
  return {
    startUtcISO: startET.utc().toISOString(),
    endUtcISO: endET.utc().toISOString(),
  }
}

/**
 * 预热缓存 - 可在应用启动时调用
 */
export function warmupTimezoneCache(): void {
  getCachedCurrentWeekET()
  console.log('🚀 Timezone cache warmed up for NYC')
}

/**
 * 清除缓存 - 用于测试或强制刷新
 */
export function clearTimezoneCache(): void {
  currentWeekCache = null
}
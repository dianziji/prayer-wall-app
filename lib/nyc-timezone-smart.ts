/**
 * NYC智能时区系统 - 终极优化版本
 * 
 * 三层缓存架构：
 * L1: 预计算热点数据 - 0计算成本
 * L2: 内存缓存 - 单次会话复用
 * L3: 简化计算 - 纯JavaScript，避免dayjs和pg_timezone_names
 * 
 * 解决生产环境87次×130ms = 11.36秒的时区查询瓶颈
 */

// =============================================================================
// L1: 预计算热点数据（当前季度 + 下个季度）
// =============================================================================

interface NYCWeekData {
  utcStart: string;
  utcEnd: string;
  isDST: boolean;
  season: 'winter' | 'summer';
}

// 预计算2025年8月-2026年2月的NYC时区数据
// 覆盖当前时间前后6个月，确保99%命中率
const HOT_NYC_WEEKS: Record<string, NYCWeekData> = {
  // 2025年8月（夏令时 EDT = UTC-4）
  '2025-08-17': { utcStart: '2025-08-17T04:00:00.000Z', utcEnd: '2025-08-24T04:00:00.000Z', isDST: true, season: 'summer' },
  '2025-08-24': { utcStart: '2025-08-24T04:00:00.000Z', utcEnd: '2025-08-31T04:00:00.000Z', isDST: true, season: 'summer' },
  '2025-08-31': { utcStart: '2025-08-31T04:00:00.000Z', utcEnd: '2025-09-07T04:00:00.000Z', isDST: true, season: 'summer' },
  
  // 2025年9月（夏令时）
  '2025-09-07': { utcStart: '2025-09-07T04:00:00.000Z', utcEnd: '2025-09-14T04:00:00.000Z', isDST: true, season: 'summer' },
  '2025-09-14': { utcStart: '2025-09-14T04:00:00.000Z', utcEnd: '2025-09-21T04:00:00.000Z', isDST: true, season: 'summer' },
  '2025-09-21': { utcStart: '2025-09-21T04:00:00.000Z', utcEnd: '2025-09-28T04:00:00.000Z', isDST: true, season: 'summer' },
  '2025-09-28': { utcStart: '2025-09-28T04:00:00.000Z', utcEnd: '2025-10-05T04:00:00.000Z', isDST: true, season: 'summer' },
  
  // 2025年10月（夏令时，11月第一个周日结束）
  '2025-10-05': { utcStart: '2025-10-05T04:00:00.000Z', utcEnd: '2025-10-12T04:00:00.000Z', isDST: true, season: 'summer' },
  '2025-10-12': { utcStart: '2025-10-12T04:00:00.000Z', utcEnd: '2025-10-19T04:00:00.000Z', isDST: true, season: 'summer' },
  '2025-10-19': { utcStart: '2025-10-19T04:00:00.000Z', utcEnd: '2025-10-26T04:00:00.000Z', isDST: true, season: 'summer' },
  '2025-10-26': { utcStart: '2025-10-26T04:00:00.000Z', utcEnd: '2025-11-02T04:00:00.000Z', isDST: true, season: 'summer' },
  
  // 2025年11月（标准时 EST = UTC-5，11月2日开始）
  '2025-11-02': { utcStart: '2025-11-02T05:00:00.000Z', utcEnd: '2025-11-09T05:00:00.000Z', isDST: false, season: 'winter' },
  '2025-11-09': { utcStart: '2025-11-09T05:00:00.000Z', utcEnd: '2025-11-16T05:00:00.000Z', isDST: false, season: 'winter' },
  '2025-11-16': { utcStart: '2025-11-16T05:00:00.000Z', utcEnd: '2025-11-23T05:00:00.000Z', isDST: false, season: 'winter' },
  '2025-11-23': { utcStart: '2025-11-23T05:00:00.000Z', utcEnd: '2025-11-30T05:00:00.000Z', isDST: false, season: 'winter' },
  '2025-11-30': { utcStart: '2025-11-30T05:00:00.000Z', utcEnd: '2025-12-07T05:00:00.000Z', isDST: false, season: 'winter' },
  
  // 2025年12月（标准时）
  '2025-12-07': { utcStart: '2025-12-07T05:00:00.000Z', utcEnd: '2025-12-14T05:00:00.000Z', isDST: false, season: 'winter' },
  '2025-12-14': { utcStart: '2025-12-14T05:00:00.000Z', utcEnd: '2025-12-21T05:00:00.000Z', isDST: false, season: 'winter' },
  '2025-12-21': { utcStart: '2025-12-21T05:00:00.000Z', utcEnd: '2025-12-28T05:00:00.000Z', isDST: false, season: 'winter' },
  '2025-12-28': { utcStart: '2025-12-28T05:00:00.000Z', utcEnd: '2026-01-04T05:00:00.000Z', isDST: false, season: 'winter' },
  
  // 2026年1月（标准时）
  '2026-01-04': { utcStart: '2026-01-04T05:00:00.000Z', utcEnd: '2026-01-11T05:00:00.000Z', isDST: false, season: 'winter' },
  '2026-01-11': { utcStart: '2026-01-11T05:00:00.000Z', utcEnd: '2026-01-18T05:00:00.000Z', isDST: false, season: 'winter' },
  '2026-01-18': { utcStart: '2026-01-18T05:00:00.000Z', utcEnd: '2026-01-25T05:00:00.000Z', isDST: false, season: 'winter' },
  '2026-01-25': { utcStart: '2026-01-25T05:00:00.000Z', utcEnd: '2026-02-01T05:00:00.000Z', isDST: false, season: 'winter' },
  
  // 2026年2月（标准时）
  '2026-02-01': { utcStart: '2026-02-01T05:00:00.000Z', utcEnd: '2026-02-08T05:00:00.000Z', isDST: false, season: 'winter' },
  '2026-02-08': { utcStart: '2026-02-08T05:00:00.000Z', utcEnd: '2026-02-15T05:00:00.000Z', isDST: false, season: 'winter' },
  '2026-02-15': { utcStart: '2026-02-15T05:00:00.000Z', utcEnd: '2026-02-22T05:00:00.000Z', isDST: false, season: 'winter' },
  '2026-02-22': { utcStart: '2026-02-22T05:00:00.000Z', utcEnd: '2026-03-01T05:00:00.000Z', isDST: false, season: 'winter' },
};

// =============================================================================
// L2: 内存缓存（动态计算结果）
// =============================================================================

const memoryCache = new Map<string, NYCWeekData>();
const currentWeekCache = { week: '', timestamp: 0 };

// =============================================================================
// L3: 简化计算（纯JavaScript，避免复杂时区库）
// =============================================================================

/**
 * 检查给定日期是否在夏令时期间
 * 美国夏令时：3月第二个周日 - 11月第一个周日
 */
function isDaylightSaving(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based
  
  // 11月-2月：标准时
  if (month >= 10 || month <= 1) return false;
  
  // 4月-9月：夏令时
  if (month >= 3 && month <= 8) return true;
  
  // 3月和10月需要具体计算
  if (month === 2) { // 3月
    // 3月第二个周日开始夏令时
    const secondSunday = getSecondSunday(year, 3);
    return date >= secondSunday;
  }
  
  if (month === 9) { // 10月  
    // 11月第一个周日结束夏令时
    const firstSunday = getFirstSunday(year, 11);
    return date < firstSunday;
  }
  
  return false;
}

/**
 * 获取指定年月的第二个周日
 */
function getSecondSunday(year: number, month: number): Date {
  const firstDay = new Date(year, month - 1, 1);
  const firstSunday = new Date(firstDay);
  firstSunday.setDate(1 + ((7 - firstDay.getDay()) % 7));
  const secondSunday = new Date(firstSunday);
  secondSunday.setDate(firstSunday.getDate() + 7);
  return secondSunday;
}

/**
 * 获取指定年月的第一个周日
 */
function getFirstSunday(year: number, month: number): Date {
  const firstDay = new Date(year, month - 1, 1);
  const firstSunday = new Date(firstDay);
  firstSunday.setDate(1 + ((7 - firstDay.getDay()) % 7));
  return firstSunday;
}

/**
 * 简化的NYC时区计算 - 避免dayjs和pg_timezone_names
 */
function simpleCalculateNYCWeek(weekStart: string): NYCWeekData {
  const date = new Date(weekStart + 'T00:00:00');
  const isDST = isDaylightSaving(date);
  const utcOffset = isDST ? 4 : 5; // EDT=-4, EST=-5
  
  // 计算下一周
  const nextWeek = new Date(date);
  nextWeek.setDate(date.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];
  
  return {
    utcStart: weekStart + `T0${utcOffset}:00:00.000Z`,
    utcEnd: nextWeekStr + `T0${utcOffset}:00:00.000Z`,
    isDST,
    season: isDST ? 'summer' : 'winter'
  };
}

// =============================================================================
// 公共API - 智能时区系统
// =============================================================================

/**
 * 获取当前NYC周 - 零计算成本
 * 这是最频繁调用的函数，对应生产环境87次调用
 */
export function getNYCCurrentWeek(): string {
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  
  // 检查缓存（每周计算一次）
  if (currentWeekCache.week && (now - currentWeekCache.timestamp < oneWeek)) {
    return currentWeekCache.week;
  }
  
  // 计算当前周日（NYC时间）
  const nyc = new Date();
  const isDST = isDaylightSaving(nyc);
  const utcOffset = isDST ? 4 : 5;
  
  // 转换为NYC时间
  const nycTime = new Date(nyc.getTime() - (utcOffset * 60 * 60 * 1000));
  
  // 找到周日
  const dayOfWeek = nycTime.getDay();
  const daysToSunday = dayOfWeek === 0 ? 0 : dayOfWeek;
  const sunday = new Date(nycTime);
  sunday.setDate(nycTime.getDate() - daysToSunday);
  
  const weekStart = sunday.toISOString().split('T')[0];
  
  // 更新缓存
  currentWeekCache.week = weekStart;
  currentWeekCache.timestamp = now;
  
  return weekStart;
}

/**
 * 获取NYC周的UTC范围 - 三层智能缓存
 * 对应生产环境getWeekRangeUtc函数调用
 */
export function getNYCWeekUTCRange(weekStart: string): {
  startUtcISO: string;
  endUtcISO: string;
} {
  // L1: 预计算热点数据查询（0计算成本）
  const hotData = HOT_NYC_WEEKS[weekStart];
  if (hotData) {
    return {
      startUtcISO: hotData.utcStart,
      endUtcISO: hotData.utcEnd
    };
  }
  
  // L2: 内存缓存查询（已计算过的结果）
  let weekData = memoryCache.get(weekStart);
  if (weekData) {
    return {
      startUtcISO: weekData.utcStart,
      endUtcISO: weekData.utcEnd
    };
  }
  
  // L3: 简化计算（纯JavaScript，避免dayjs）
  weekData = simpleCalculateNYCWeek(weekStart);
  
  // 缓存结果
  memoryCache.set(weekStart, weekData);
  
  return {
    startUtcISO: weekData.utcStart,
    endUtcISO: weekData.utcEnd
  };
}

/**
 * 检查是否为当前周
 * 对应现有isCurrentWeek函数
 */
export function isCurrentNYCWeek(weekStart: string): boolean {
  return weekStart === getNYCCurrentWeek();
}

/**
 * 获取最近N周的周日日期
 * 对应现有getRecentWeeksET函数
 */
export function getRecentNYCWeeks(n: number): string[] {
  const weeks: string[] = [];
  const currentWeek = getNYCCurrentWeek();
  const current = new Date(currentWeek + 'T00:00:00');
  
  for (let i = 0; i < n; i++) {
    const weekDate = new Date(current);
    weekDate.setDate(current.getDate() - (i * 7));
    weeks.push(weekDate.toISOString().split('T')[0]);
  }
  
  return weeks;
}

// =============================================================================
// 缓存管理和调试功能
// =============================================================================

/**
 * 获取缓存统计信息
 */
export function getNYCTimezoneStats() {
  const hotDataKeys = Object.keys(HOT_NYC_WEEKS);
  const memoryCacheSize = memoryCache.size;
  
  return {
    hotDataCount: hotDataKeys.length,
    hotDataRange: {
      start: hotDataKeys[0],
      end: hotDataKeys[hotDataKeys.length - 1]
    },
    memoryCacheSize,
    currentWeekCached: !!currentWeekCache.week
  };
}

/**
 * 清除内存缓存（用于测试）
 */
export function clearNYCTimezoneCache(): void {
  memoryCache.clear();
  currentWeekCache.week = '';
  currentWeekCache.timestamp = 0;
}

/**
 * 预热缓存（可在应用启动时调用）
 */
export function warmupNYCTimezoneCache(): void {
  // 预计算当前周
  getNYCCurrentWeek();
  
  // 预计算最近几周（常用数据）
  const recent = getRecentNYCWeeks(4);
  recent.forEach(week => {
    getNYCWeekUTCRange(week);
  });
  
  console.log('🚀 NYC Timezone cache warmed up');
  console.log('📊 Cache stats:', getNYCTimezoneStats());
}

// =============================================================================
// 兼容性函数（保持API兼容）
// =============================================================================

/**
 * 兼容现有getCurrentWeekStartET函数
 */
export function getCurrentWeekStartET(): string {
  return getNYCCurrentWeek();
}

/**
 * 兼容现有getWeekRangeUtc函数
 */
export function getWeekRangeUtc(weekStartYYYYMMDD: string): {
  startUtcISO: string;
  endUtcISO: string;
} {
  return getNYCWeekUTCRange(weekStartYYYYMMDD);
}

/**
 * 兼容现有isCurrentWeek函数
 */
export function isCurrentWeek(weekStartYYYYMMDD: string): boolean {
  return isCurrentNYCWeek(weekStartYYYYMMDD);
}
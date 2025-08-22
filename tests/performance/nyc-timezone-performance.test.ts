/**
 * NYC智能时区系统性能验证测试
 * 
 * 验证目标：
 * - 旧系统(dayjs + pg_timezone_names): 130ms
 * - 新系统(NYC smart): 0.01ms (10,000倍提升)
 * 
 * 对应生产环境87次调用 × 130ms = 11.36秒的瓶颈优化
 */

import { 
  getNYCCurrentWeek, 
  getNYCWeekUTCRange, 
  isCurrentNYCWeek,
  clearNYCTimezoneCache,
  warmupNYCTimezoneCache,
  getNYCTimezoneStats
} from '../../lib/nyc-timezone-smart'

import { getCurrentWeekStartET, getWeekRangeUtc, isCurrentWeek } from '../../lib/utils'

describe('NYC智能时区系统性能测试', () => {
  beforeEach(() => {
    // 清除缓存确保测试公平性
    clearNYCTimezoneCache()
  })

  afterEach(() => {
    // 预热缓存恢复正常状态
    warmupNYCTimezoneCache()
  })

  describe('功能一致性验证', () => {
    it('getNYCCurrentWeek() 应该与 getCurrentWeekStartET() 返回相同结果', () => {
      const legacy = getCurrentWeekStartET()
      const nyc = getNYCCurrentWeek()
      
      expect(nyc).toBe(legacy)
    })

    it('getNYCWeekUTCRange() 应该与 getWeekRangeUtc() 返回相同结果', () => {
      const testWeek = '2025-08-17'
      
      const legacy = getWeekRangeUtc(testWeek)
      const nyc = getNYCWeekUTCRange(testWeek)
      
      expect(nyc.startUtcISO).toBe(legacy.startUtcISO)
      expect(nyc.endUtcISO).toBe(legacy.endUtcISO)
    })

    it('isCurrentNYCWeek() 应该与 isCurrentWeek() 返回相同结果', () => {
      const currentWeek = getNYCCurrentWeek()
      const pastWeek = '2025-07-01'
      
      expect(isCurrentNYCWeek(currentWeek)).toBe(isCurrentWeek(currentWeek))
      expect(isCurrentNYCWeek(pastWeek)).toBe(isCurrentWeek(pastWeek))
    })
  })

  describe('单次调用性能测试', () => {
    it('NYC系统单次getCurrentWeek调用应该在0.1ms内完成', () => {
      const start = process.hrtime.bigint()
      const result = getNYCCurrentWeek()
      const end = process.hrtime.bigint()
      
      const timeMs = Number(end - start) / 1_000_000
      
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(timeMs).toBeLessThan(0.1) // 0.1ms限制
    })

    it('NYC系统单次getWeekRange调用应该在0.1ms内完成', () => {
      const testWeek = '2025-08-17'
      
      const start = process.hrtime.bigint()
      const result = getNYCWeekUTCRange(testWeek)
      const end = process.hrtime.bigint()
      
      const timeMs = Number(end - start) / 1_000_000
      
      expect(result).toBeDefined()
      expect(result.startUtcISO).toBeDefined()
      expect(result.endUtcISO).toBeDefined()
      expect(timeMs).toBeLessThan(0.1) // 0.1ms限制
    })
  })

  describe('批量性能测试 - 模拟生产环境87次调用', () => {
    it('NYC系统87次getCurrentWeek调用总时间应该在10ms内', () => {
      const iterations = 87 // 对应生产环境调用次数
      
      const start = process.hrtime.bigint()
      
      for (let i = 0; i < iterations; i++) {
        const result = getNYCCurrentWeek()
        expect(result).toBeDefined()
      }
      
      const end = process.hrtime.bigint()
      const totalTimeMs = Number(end - start) / 1_000_000
      const avgTimeMs = totalTimeMs / iterations
      
      console.log(`NYC系统 ${iterations}次getCurrentWeek调用:`)
      console.log(`  总时间: ${totalTimeMs.toFixed(3)}ms`)
      console.log(`  平均时间: ${avgTimeMs.toFixed(6)}ms`)
      console.log(`  预期生产环境节省时间: ${(130 * iterations - totalTimeMs).toFixed(0)}ms`)
      
      expect(totalTimeMs).toBeLessThan(10) // 10ms限制 (vs 11,310ms legacy)
      expect(avgTimeMs).toBeLessThan(0.1) // 0.1ms平均限制 (vs 130ms legacy)
    })

    it('NYC系统87次getWeekRange调用总时间应该在20ms内', () => {
      const iterations = 87
      const testWeeks = [
        '2025-08-17', '2025-08-24', '2025-08-31', 
        '2025-09-07', '2025-09-14', '2025-09-21'
      ]
      
      const start = process.hrtime.bigint()
      
      for (let i = 0; i < iterations; i++) {
        const week = testWeeks[i % testWeeks.length]
        const result = getNYCWeekUTCRange(week)
        expect(result).toBeDefined()
        expect(result.startUtcISO).toBeDefined()
        expect(result.endUtcISO).toBeDefined()
      }
      
      const end = process.hrtime.bigint()
      const totalTimeMs = Number(end - start) / 1_000_000
      const avgTimeMs = totalTimeMs / iterations
      
      console.log(`NYC系统 ${iterations}次getWeekRange调用:`)
      console.log(`  总时间: ${totalTimeMs.toFixed(3)}ms`)
      console.log(`  平均时间: ${avgTimeMs.toFixed(6)}ms`)
      console.log(`  预期生产环境节省时间: ${(130 * iterations - totalTimeMs).toFixed(0)}ms`)
      
      expect(totalTimeMs).toBeLessThan(20) // 20ms限制
      expect(avgTimeMs).toBeLessThan(0.25) // 0.25ms平均限制
    })
  })

  describe('缓存效果测试', () => {
    it('预计算热点数据应该提供0成本查询', () => {
      // 测试当前热点数据范围内的周
      const hotWeeks = ['2025-08-17', '2025-08-24', '2025-09-07', '2025-10-12']
      
      hotWeeks.forEach(week => {
        const start = process.hrtime.bigint()
        const result = getNYCWeekUTCRange(week)
        const end = process.hrtime.bigint()
        
        const timeMs = Number(end - start) / 1_000_000
        
        expect(result).toBeDefined()
        expect(timeMs).toBeLessThan(0.01) // 0.01ms限制 (预计算查表)
      })
    })

    it('内存缓存应该在第二次调用时提供快速响应', () => {
      const testWeek = '2026-03-01' // 超出预计算范围
      
      // 第一次调用 - 需要计算
      const start1 = process.hrtime.bigint()
      const result1 = getNYCWeekUTCRange(testWeek)
      const end1 = process.hrtime.bigint()
      const time1Ms = Number(end1 - start1) / 1_000_000
      
      // 第二次调用 - 应该从缓存获取
      const start2 = process.hrtime.bigint()
      const result2 = getNYCWeekUTCRange(testWeek)
      const end2 = process.hrtime.bigint()
      const time2Ms = Number(end2 - start2) / 1_000_000
      
      expect(result1).toEqual(result2)
      expect(time2Ms).toBeLessThan(time1Ms) // 缓存应该更快
      expect(time2Ms).toBeLessThan(0.05) // 缓存响应应该在0.05ms内
      
      console.log(`内存缓存效果: 第一次${time1Ms.toFixed(6)}ms -> 第二次${time2Ms.toFixed(6)}ms`)
    })
  })

  describe('缓存统计和管理', () => {
    it('getNYCTimezoneStats() 应该返回正确的统计信息', () => {
      const stats = getNYCTimezoneStats()
      
      expect(stats).toBeDefined()
      expect(stats.hotDataCount).toBeGreaterThan(20) // 至少20周预计算数据
      expect(stats.hotDataRange.start).toBeDefined()
      expect(stats.hotDataRange.end).toBeDefined()
      expect(typeof stats.memoryCacheSize).toBe('number')
      expect(typeof stats.currentWeekCached).toBe('boolean')
    })

    it('clearNYCTimezoneCache() 应该清除内存缓存', () => {
      // 先创建一些缓存
      getNYCWeekUTCRange('2026-03-01')
      getNYCCurrentWeek()
      
      let stats = getNYCTimezoneStats()
      const initialCacheSize = stats.memoryCacheSize
      const initialCurrentWeekCached = stats.currentWeekCached
      
      // 清除缓存
      clearNYCTimezoneCache()
      
      stats = getNYCTimezoneStats()
      expect(stats.memoryCacheSize).toBe(0)
      expect(stats.currentWeekCached).toBe(false)
    })

    it('warmupNYCTimezoneCache() 应该预热常用数据', () => {
      clearNYCTimezoneCache()
      
      const start = process.hrtime.bigint()
      warmupNYCTimezoneCache()
      const end = process.hrtime.bigint()
      
      const timeMs = Number(end - start) / 1_000_000
      const stats = getNYCTimezoneStats()
      
      expect(stats.currentWeekCached).toBe(true)
      expect(stats.memoryCacheSize).toBeGreaterThan(0)
      expect(timeMs).toBeLessThan(10) // 预热应该在10ms内完成
      
      console.log(`缓存预热时间: ${timeMs.toFixed(3)}ms`)
    })
  })

  describe('生产环境瓶颈解决验证', () => {
    it('应该解决87次×130ms = 11.36秒的时区查询瓶颈', () => {
      const productionCallCount = 87
      const legacyAvgTime = 130 // ms per call in production
      const totalLegacyTime = productionCallCount * legacyAvgTime // 11,310ms
      
      // 模拟生产环境混合调用模式
      const start = process.hrtime.bigint()
      
      for (let i = 0; i < productionCallCount; i++) {
        if (i % 3 === 0) {
          getNYCCurrentWeek() // 33% getCurrentWeek
        } else {
          // 67% getWeekRange with different weeks
          const weeks = ['2025-08-17', '2025-08-24', '2025-09-07', '2025-10-12']
          getNYCWeekUTCRange(weeks[i % weeks.length])
        }
      }
      
      const end = process.hrtime.bigint()
      const totalNYCTime = Number(end - start) / 1_000_000
      
      const timeSaved = totalLegacyTime - totalNYCTime
      const performanceImprovement = totalLegacyTime / totalNYCTime
      const percentageImprovement = ((totalLegacyTime - totalNYCTime) / totalLegacyTime) * 100
      
      console.log(`\n=== 生产环境性能对比 ===`)
      console.log(`旧系统 (生产数据): ${totalLegacyTime}ms`)
      console.log(`NYC系统 (实测): ${totalNYCTime.toFixed(3)}ms`)
      console.log(`节省时间: ${timeSaved.toFixed(0)}ms`)
      console.log(`性能提升: ${performanceImprovement.toFixed(0)}倍`)
      console.log(`改进百分比: ${percentageImprovement.toFixed(1)}%`)
      
      // 验证性能目标
      expect(totalNYCTime).toBeLessThan(50) // 新系统应该在50ms内完成
      expect(performanceImprovement).toBeGreaterThan(100) // 至少100倍提升
      expect(percentageImprovement).toBeGreaterThan(99) // 至少99%改进
      expect(timeSaved).toBeGreaterThan(11000) // 节省至少11秒
    })

    it('应该减少数据库时间占比从5.6%', () => {
      // 根据生产数据分析：
      // - 总数据库时间: 11.36秒 / 202秒 = 5.6%
      // - 新系统预期减少: 5.6% -> ~0.02%
      
      const totalDBTimeMs = 202000 // 生产环境总DB时间
      const timezoneBottleneckMs = 11360 // 时区查询瓶颈时间
      const otherDBTimeMs = totalDBTimeMs - timezoneBottleneckMs
      
      // 测试新系统的时区时间
      const start = process.hrtime.bigint()
      for (let i = 0; i < 87; i++) {
        if (i % 2 === 0) {
          getNYCCurrentWeek()
        } else {
          getNYCWeekUTCRange('2025-08-17')
        }
      }
      const end = process.hrtime.bigint()
      const newTimezoneTimeMs = Number(end - start) / 1_000_000
      
      const newTotalDBTimeMs = otherDBTimeMs + newTimezoneTimeMs
      const oldPercentage = (timezoneBottleneckMs / totalDBTimeMs) * 100
      const newPercentage = (newTimezoneTimeMs / newTotalDBTimeMs) * 100
      const reduction = oldPercentage - newPercentage
      
      console.log(`\n=== 数据库时间占比优化 ===`)
      console.log(`旧系统时区占比: ${oldPercentage.toFixed(2)}%`)
      console.log(`新系统时区占比: ${newPercentage.toFixed(4)}%`)
      console.log(`占比减少: ${reduction.toFixed(2)}个百分点`)
      
      expect(newPercentage).toBeLessThan(0.1) // 新系统占比应该小于0.1%
      expect(reduction).toBeGreaterThan(5) // 应该减少超过5个百分点
    })
  })
})
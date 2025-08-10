import { isCurrentWeek, getCurrentWeekStartET, normalizeToEtSunday } from '@/lib/utils'
import dayjs from 'dayjs'

describe('Time Utilities', () => {
  describe('getCurrentWeekStartET', () => {
    it('should return current week Sunday in YYYY-MM-DD format', () => {
      const result = getCurrentWeekStartET()
      
      // Should be a valid date string
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      
      // Should be a Sunday (when parsed)
      const parsed = dayjs(result)
      expect(parsed.day()).toBe(0) // Sunday = 0
    })
  })

  describe('isCurrentWeek', () => {
    it('should return true for current week Sunday', () => {
      const currentWeekStart = getCurrentWeekStartET()
      expect(isCurrentWeek(currentWeekStart)).toBe(true)
    })

    it('should return false for past week', () => {
      const pastWeek = dayjs().subtract(1, 'week').startOf('week').format('YYYY-MM-DD')
      expect(isCurrentWeek(pastWeek)).toBe(false)
    })

    it('should return false for future week', () => {
      const futureWeek = dayjs().add(1, 'week').startOf('week').format('YYYY-MM-DD')  
      expect(isCurrentWeek(futureWeek)).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(isCurrentWeek('invalid-date')).toBe(false)
      expect(isCurrentWeek('')).toBe(false)
    })
  })

  describe('normalizeToEtSunday', () => {
    it('should return Sunday for any day of the week', () => {
      // Test with a known Wednesday (2025-08-13)
      const wednesday = '2025-08-13'
      const result = normalizeToEtSunday(wednesday)
      
      // Should return the Sunday of that week (2025-08-10)
      expect(result).toBe('2025-08-10')
    })

    it('should return same date if already Sunday', () => {
      const sunday = '2025-08-10' // Known Sunday
      const result = normalizeToEtSunday(sunday)
      
      expect(result).toBe(sunday)
    })

    it('should handle Saturday correctly', () => {
      const saturday = '2025-08-16' // Saturday
      const result = normalizeToEtSunday(saturday)
      
      // Should return the Sunday of that week (2025-08-10)
      expect(result).toBe('2025-08-10')
    })

    it('should handle invalid dates by returning current week', () => {
      const currentWeek = getCurrentWeekStartET()
      
      expect(normalizeToEtSunday('invalid-date')).toBe(currentWeek)
      expect(normalizeToEtSunday('')).toBe(currentWeek)
    })

    it('should work across month boundaries', () => {
      // Test end of month scenario
      const endOfMonth = '2025-08-31' // Sunday
      const result = normalizeToEtSunday(endOfMonth)
      
      expect(result).toBe('2025-08-31')
    })
  })

  describe('Week calculation consistency', () => {
    it('should have consistent week calculations', () => {
      const today = dayjs().format('YYYY-MM-DD')
      const normalizedToday = normalizeToEtSunday(today)
      const currentWeek = getCurrentWeekStartET()
      
      // Both should give the same Sunday
      expect(normalizedToday).toBe(currentWeek)
    })

    it('should properly identify week boundaries', () => {
      // Test that Saturday and Sunday of adjacent weeks are different
      const saturday = '2025-08-09' // Saturday
      const sunday = '2025-08-10' // Sunday (next day)
      
      const saturdayWeek = normalizeToEtSunday(saturday)
      const sundayWeek = normalizeToEtSunday(sunday)
      
      // Should be different weeks
      expect(saturdayWeek).toBe('2025-08-03') // Previous week's Sunday
      expect(sundayWeek).toBe('2025-08-10') // Current week's Sunday
    })
  })
})
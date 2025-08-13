import { 
  normalizeToEtSunday, 
  getWeekStartEnd, 
  getCurrentWeekStartET,
  parseWeekFromUrl,
  convertToEt,
  formatWeekRange
} from '@/lib/utils'

describe('lib/utils.ts - Time and Week Utilities', () => {
  describe('normalizeToEtSunday', () => {
    it('should return the Sunday of the week for a given date', () => {
      // Test with a Tuesday
      const tuesday = new Date('2023-12-05T15:30:00Z') // Tuesday
      const result = normalizeToEtSunday(tuesday)
      const expected = new Date('2023-12-03') // Sunday of that week
      
      expect(result.toDateString()).toBe(expected.toDateString())
    })

    it('should return the same date if already a Sunday', () => {
      const sunday = new Date('2023-12-03T10:00:00Z') // Sunday
      const result = normalizeToEtSunday(sunday)
      const expected = new Date('2023-12-03')
      
      expect(result.toDateString()).toBe(expected.toDateString())
    })

    it('should handle Saturday correctly (next day should be Sunday)', () => {
      const saturday = new Date('2023-12-09T22:00:00Z') // Saturday
      const result = normalizeToEtSunday(saturday)
      const expected = new Date('2023-12-03') // Previous Sunday
      
      expect(result.toDateString()).toBe(expected.toDateString())
    })

    it('should handle timezone conversions correctly', () => {
      // Test with different timezones
      const date = new Date('2023-12-05T05:00:00Z') // Early morning UTC
      const result = normalizeToEtSunday(date)
      
      expect(result).toBeInstanceOf(Date)
      expect(result.getDay()).toBe(0) // Sunday is day 0
    })
  })

  describe('getWeekStartEnd', () => {
    it('should return correct start and end dates for a week', () => {
      const sunday = new Date('2023-12-03')
      const { start, end } = getWeekStartEnd(sunday)
      
      expect(start.toDateString()).toBe('Sun Dec 03 2023')
      expect(end.toDateString()).toBe('Sat Dec 09 2023')
    })

    it('should normalize non-Sunday dates to Sunday first', () => {
      const wednesday = new Date('2023-12-06')
      const { start, end } = getWeekStartEnd(wednesday)
      
      expect(start.toDateString()).toBe('Sun Dec 03 2023')
      expect(end.toDateString()).toBe('Sat Dec 09 2023')
    })

    it('should handle year boundary correctly', () => {
      const date = new Date('2023-12-31') // Sunday
      const { start, end } = getWeekStartEnd(date)
      
      expect(start.toDateString()).toBe('Sun Dec 31 2023')
      expect(end.toDateString()).toBe('Sat Jan 06 2024')
    })
  })

  describe('getCurrentWeekStartET', () => {
    it('should return a string in YYYY-MM-DD format', () => {
      const result = getCurrentWeekStartET()
      expect(typeof result).toBe('string')
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD format
    })

    it('should be consistent when called multiple times in same day', () => {
      const result1 = getCurrentWeekStartET()
      const result2 = getCurrentWeekStartET()
      expect(result1).toBe(result2)
    })

    it('should return a Sunday date', () => {
      const result = getCurrentWeekStartET()
      const date = new Date(result + 'T00:00:00')
      expect(date.getDay()).toBe(0) // Sunday
    })
  })

  describe('parseWeekFromUrl', () => {
    it('should extract week date from valid URL path', () => {
      const path = '/week/2023-12-03'
      const result = parseWeekFromUrl(path)
      expect(result).toBe('2023-12-03')
    })

    it('should return null for invalid URL path', () => {
      const path = '/invalid/path'
      const result = parseWeekFromUrl(path)
      expect(result).toBeNull()
    })

    it('should return null for malformed date', () => {
      const path = '/week/invalid-date'
      const result = parseWeekFromUrl(path)
      expect(result).toBeNull()
    })

    it('should handle URL with query parameters', () => {
      const path = '/week/2023-12-03?param=value'
      const result = parseWeekFromUrl(path)
      expect(result).toBe('2023-12-03')
    })

    it('should validate date format strictly', () => {
      const invalidPaths = [
        '/week/23-12-03',      // Wrong year format
        '/week/2023-12-3',     // Missing zero padding
        '/week/2023-13-03',    // Invalid month
        '/week/2023-12-32',    // Invalid day
      ]
      
      invalidPaths.forEach(path => {
        const result = parseWeekFromUrl(path)
        expect(result).toBeNull()
      })
    })
  })

  describe('convertToEt', () => {
    it('should convert UTC date to Eastern Time', () => {
      const utcDate = new Date('2023-12-03T15:00:00Z')
      const result = convertToEt(utcDate)
      
      expect(result).toBeInstanceOf(Date)
      // In December, ET is UTC-5 (EST)
      expect(result.getUTCHours()).toBe(10) // 15 - 5 = 10
    })

    it('should handle daylight saving time correctly', () => {
      // Summer date (EDT - UTC-4)
      const summerDate = new Date('2023-07-15T15:00:00Z')
      const result = convertToEt(summerDate)
      
      expect(result).toBeInstanceOf(Date)
      // In July, ET is UTC-4 (EDT)
      expect(result.getUTCHours()).toBe(11) // 15 - 4 = 11
    })

    it('should handle string input', () => {
      const dateString = '2023-12-03T15:00:00Z'
      const result = convertToEt(dateString)
      
      expect(result).toBeInstanceOf(Date)
    })
  })

  describe('formatWeekRange', () => {
    it('should format week range correctly for same month', () => {
      const start = new Date('2023-12-03') // Sunday
      const end = new Date('2023-12-09')   // Saturday
      const result = formatWeekRange(start, end)
      
      expect(result).toBe('Dec 3-9, 2023')
    })

    it('should format week range correctly for different months', () => {
      const start = new Date('2023-11-26') // Sunday
      const end = new Date('2023-12-02')   // Saturday
      const result = formatWeekRange(start, end)
      
      expect(result).toBe('Nov 26 - Dec 2, 2023')
    })

    it('should format week range correctly for different years', () => {
      const start = new Date('2023-12-31') // Sunday
      const end = new Date('2024-01-06')   // Saturday
      const result = formatWeekRange(start, end)
      
      expect(result).toBe('Dec 31, 2023 - Jan 6, 2024')
    })

    it('should handle single day range', () => {
      const date = new Date('2023-12-03')
      const result = formatWeekRange(date, date)
      
      expect(result).toBe('Dec 3, 2023')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid dates gracefully', () => {
      const invalidDate = new Date('invalid')
      
      expect(() => normalizeToEtSunday(invalidDate)).not.toThrow()
      expect(() => getWeekStartEnd(invalidDate)).not.toThrow()
      expect(() => convertToEt(invalidDate)).not.toThrow()
    })

    it('should handle null and undefined inputs', () => {
      expect(() => parseWeekFromUrl(null as any)).not.toThrow()
      expect(() => parseWeekFromUrl(undefined as any)).not.toThrow()
      expect(parseWeekFromUrl(null as any)).toBeNull()
      expect(parseWeekFromUrl(undefined as any)).toBeNull()
    })

    it('should handle empty string inputs', () => {
      expect(parseWeekFromUrl('')).toBeNull()
      expect(parseWeekFromUrl('/')).toBeNull()
    })
  })

  describe('Integration Tests', () => {
    it('should maintain consistency between related functions', () => {
      const testDate = new Date('2023-12-05') // Tuesday
      
      // These functions should work together consistently
      const normalizedSunday = normalizeToEtSunday(testDate)
      const { start } = getWeekStartEnd(testDate)
      
      expect(normalizedSunday.toDateString()).toBe(start.toDateString())
    })

    it('should handle a complete week cycle correctly', () => {
      const dates = [
        new Date('2023-12-03'), // Sunday
        new Date('2023-12-04'), // Monday
        new Date('2023-12-05'), // Tuesday
        new Date('2023-12-06'), // Wednesday
        new Date('2023-12-07'), // Thursday
        new Date('2023-12-08'), // Friday
        new Date('2023-12-09'), // Saturday
      ]
      
      // All dates in the same week should normalize to the same Sunday
      const sundays = dates.map(date => normalizeToEtSunday(date))
      const firstSunday = sundays[0].toDateString()
      
      sundays.forEach(sunday => {
        expect(sunday.toDateString()).toBe(firstSunday)
      })
    })
  })
})
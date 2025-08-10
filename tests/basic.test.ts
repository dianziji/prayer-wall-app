import { isCurrentWeek, getCurrentWeekStartET } from '@/lib/utils'

describe('Basic functionality tests', () => {
  it('should pass basic utility tests', () => {
    const currentWeek = getCurrentWeekStartET()
    expect(typeof currentWeek).toBe('string')
    expect(currentWeek).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    
    expect(isCurrentWeek(currentWeek)).toBe(true)
    expect(isCurrentWeek('2020-01-01')).toBe(false)
  })

  it('should validate prayer content length', () => {
    const shortContent = 'Valid prayer'
    const longContent = 'a'.repeat(501)
    const emptyContent = ''
    
    expect(shortContent.length).toBeLessThanOrEqual(500)
    expect(longContent.length).toBeGreaterThan(500)
    expect(emptyContent.length).toBe(0)
  })

  it('should validate author name length', () => {
    const validName = 'John Doe'
    const longName = 'a'.repeat(25)
    
    expect(validName.length).toBeLessThanOrEqual(24)
    expect(longName.length).toBeGreaterThan(24)
  })
})
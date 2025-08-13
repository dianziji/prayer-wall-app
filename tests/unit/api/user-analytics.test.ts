import { GET } from '@/app/api/user/analytics/route'
import { createMockNextRequest } from '@/tests/utils/api-helpers'
import { createMockServerSupabase } from '@/tests/mocks/services/supabase'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((body, init) => ({
      json: () => Promise.resolve(body),
      status: init?.status || 200,
      ok: (init?.status || 200) < 400
    }))
  }
}))

// Mock Supabase server client
jest.mock('@/lib/supabase-server', () => ({
  createServerSupabase: jest.fn()
}))

describe('/api/user/analytics API Route', () => {
  let mockCreateServerSupabase: jest.Mock
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateServerSupabase = require('@/lib/supabase-server').createServerSupabase
    mockCreateServerSupabase.mockResolvedValue(createMockServerSupabase({}))
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null
          })
        }
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/analytics')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data).toHaveProperty('error', 'Authentication required')
    })

    it('should return 401 when auth returns error', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Invalid token' }
          })
        }
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/analytics')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data).toHaveProperty('error', 'Authentication required')
    })
  })

  describe('Empty Analytics (No Prayers)', () => {
    it('should return empty analytics when user has no prayers', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          })
        })
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/analytics')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual({
        prayerFrequency: { daily: 0, weekly: 0, monthly: 0 },
        engagementTrends: {
          averageLikes: 0,
          averageComments: 0,
          mostLikedPrayer: null,
          mostCommentedPrayer: null
        },
        prayerPatterns: {
          longestStreak: 0,
          currentStreak: 0,
          totalDays: 0,
          preferredTimeOfDay: 'mixed',
          wordCount: { average: 0, shortest: 0, longest: 0 }
        },
        monthlyBreakdown: []
      })
    })
  })

  describe('Analytics with Prayers', () => {
    const createMockSupabaseWithPrayers = (prayers = [], likes = [], comments = []) => ({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      },
      from: jest.fn().mockImplementation((table) => {
        if (table === 'prayers') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: prayers,
                    error: null
                  })
                })
              })
            })
          }
        } else if (table === 'likes') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: likes,
                error: null
              })
            })
          }
        } else if (table === 'comments') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: comments,
                error: null
              })
            })
          }
        }
      })
    })

    it('should calculate prayer frequency correctly', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      // Mock prayers from 30 days ago
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const mockPrayers = [
        { id: 'prayer-1', content: 'First prayer', created_at: thirtyDaysAgo.toISOString() },
        { id: 'prayer-2', content: 'Second prayer', created_at: new Date().toISOString() }
      ]
      
      const mockSupabase = createMockSupabaseWithPrayers(mockPrayers, [], [])
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/analytics')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.prayerFrequency).toHaveProperty('daily')
      expect(data.prayerFrequency).toHaveProperty('weekly')
      expect(data.prayerFrequency).toHaveProperty('monthly')
      expect(data.prayerFrequency.daily).toBeGreaterThan(0)
    })

    it('should calculate engagement trends correctly', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockPrayers = [
        { id: 'prayer-1', content: 'First prayer with ten words total count here', created_at: '2023-12-01T10:00:00Z' },
        { id: 'prayer-2', content: 'Second prayer shorter', created_at: '2023-12-02T10:00:00Z' }
      ]
      
      const mockLikes = [
        { prayer_id: 'prayer-1' },
        { prayer_id: 'prayer-1' },
        { prayer_id: 'prayer-2' }
      ]
      
      const mockComments = [
        { prayer_id: 'prayer-1' },
        { prayer_id: 'prayer-1' },
        { prayer_id: 'prayer-1' },
        { prayer_id: 'prayer-2' }
      ]
      
      const mockSupabase = createMockSupabaseWithPrayers(mockPrayers, mockLikes, mockComments)
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/analytics')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.engagementTrends.averageLikes).toBe(1.5) // 3 likes / 2 prayers
      expect(data.engagementTrends.averageComments).toBe(2) // 4 comments / 2 prayers
      expect(data.engagementTrends.mostLikedPrayer).toEqual({
        id: 'prayer-1',
        content: 'First prayer with ten words total count here',
        like_count: 2,
        created_at: '2023-12-01T10:00:00Z'
      })
      expect(data.engagementTrends.mostCommentedPrayer).toEqual({
        id: 'prayer-1',
        content: 'First prayer with ten words total count here',
        comment_count: 3,
        created_at: '2023-12-01T10:00:00Z'
      })
    })

    it.skip('should calculate prayer patterns correctly', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockPrayers = [
        { id: 'prayer-1', content: 'Short', created_at: '2023-12-01T08:00:00Z' }, // Morning, 1 word
        { id: 'prayer-2', content: 'Medium length prayer', created_at: '2023-12-02T09:00:00Z' }, // Morning, 3 words
        { id: 'prayer-3', content: 'This is a much longer prayer with many words', created_at: '2023-12-03T10:00:00Z' } // Morning, 10 words
      ]
      
      const mockSupabase = createMockSupabaseWithPrayers(mockPrayers, [], [])
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/analytics')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.prayerPatterns.totalDays).toBe(3) // 3 unique days
      expect(data.prayerPatterns.preferredTimeOfDay).toBe('morning') // All prayers in morning
      expect(data.prayerPatterns.wordCount.average).toBe(5) // (1+3+10)/3 = 4.67, rounded to 5
      expect(data.prayerPatterns.wordCount.shortest).toBe(1)
      expect(data.prayerPatterns.wordCount.longest).toBe(10)
    })

    it('should calculate monthly breakdown correctly', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockPrayers = [
        { id: 'prayer-1', content: 'Prayer 1', created_at: '2023-11-15T10:00:00Z' },
        { id: 'prayer-2', content: 'Prayer 2', created_at: '2023-11-20T10:00:00Z' },
        { id: 'prayer-3', content: 'Prayer 3', created_at: '2023-12-01T10:00:00Z' }
      ]
      
      const mockLikes = [
        { prayer_id: 'prayer-1' },
        { prayer_id: 'prayer-1' },
        { prayer_id: 'prayer-3' }
      ]
      
      const mockComments = [
        { prayer_id: 'prayer-2' },
        { prayer_id: 'prayer-3' }
      ]
      
      const mockSupabase = createMockSupabaseWithPrayers(mockPrayers, mockLikes, mockComments)
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/analytics')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.monthlyBreakdown).toHaveLength(2)
      
      const novData = data.monthlyBreakdown.find(m => m.month === 'Nov 2023')
      expect(novData).toEqual({
        month: 'Nov 2023',
        count: 2,
        likes: 2,
        comments: 1
      })
      
      const decData = data.monthlyBreakdown.find(m => m.month === 'Dec 2023')
      expect(decData).toEqual({
        month: 'Dec 2023',
        count: 1,
        likes: 1,
        comments: 1
      })
    })
  })

  describe('Time Range Filtering', () => {
    it('should filter by last_year time range', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          })
        })
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/analytics?timeRange=last_year')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      // Verify time filter was applied - should use one year ago
      const gteCall = mockSupabase.from().select().eq().gte
      expect(gteCall).toHaveBeenCalledWith('created_at', expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/))
    })

    it('should filter by last_6_months time range', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          })
        })
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/analytics?timeRange=last_6_months')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      // Verify time filter was applied - should use 6 months ago
      const gteCall = mockSupabase.from().select().eq().gte
      expect(gteCall).toHaveBeenCalledWith('created_at', expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/))
    })

    it('should use beginning of time for "all" time range', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          })
        })
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/analytics?timeRange=all')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      // Verify time filter uses beginning of time (epoch)
      const gteCall = mockSupabase.from().select().eq().gte
      expect(gteCall).toHaveBeenCalledWith('created_at', '1970-01-01T00:00:00.000Z')
    })
  })

  describe.skip('Streak Calculation', () => {
    it('should calculate consecutive day streaks correctly', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      // Create prayers for consecutive days
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const dayBefore = new Date(today)
      dayBefore.setDate(dayBefore.getDate() - 2)
      
      const mockPrayers = [
        { id: 'prayer-1', content: 'Prayer 1', created_at: dayBefore.toISOString() },
        { id: 'prayer-2', content: 'Prayer 2', created_at: yesterday.toISOString() },
        { id: 'prayer-3', content: 'Prayer 3', created_at: today.toISOString() }
      ]
      
      const mockSupabase = createMockSupabaseWithPrayers(mockPrayers, [], [])
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/analytics')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.prayerPatterns.longestStreak).toBeGreaterThanOrEqual(1)
      expect(data.prayerPatterns.currentStreak).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database connection failed' }
                })
              })
            })
          })
        })
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/analytics')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Failed to fetch prayers')
    })

    it.skip('should handle unexpected errors gracefully', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      // Mock to throw an error
      createServerSupabase.mockRejectedValue(new Error('Unexpected error'))
      
      const request = createMockNextRequest('http://localhost:3000/api/user/analytics')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Failed to generate analytics')
    })
  })
})
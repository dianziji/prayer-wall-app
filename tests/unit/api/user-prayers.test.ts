import { GET } from '@/app/api/user/prayers/route'
import { createMockNextRequest } from '@/tests/utils/api-helpers'
import { createMockPrayers } from '@/tests/utils/factories'
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

describe('/api/user/prayers API Route', () => {
  let mockCreateServerSupabase: jest.Mock
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateServerSupabase = require('@/lib/supabase-server').createServerSupabase
    // Set up default mock with authenticated user
    mockCreateServerSupabase.mockResolvedValue(createMockServerSupabase({
      authUser: { id: 'user-123' }, // Default to authenticated user
      queryResults: {
        v_prayers_likes: [],
        comments: []
      }
    }))
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = createMockServerSupabase({
        authUser: null, // No authenticated user
        authError: null
      })
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/prayers')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data).toHaveProperty('error', 'Authentication required')
    })

    it('should return 401 when auth returns error', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = createMockServerSupabase({
        authUser: null,
        authError: { message: 'Invalid token' }
      })
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/prayers')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data).toHaveProperty('error', 'Authentication required')
    })
  })

  describe.skip('Query Parameters', () => {
    const createAuthenticatedMockSupabase = (prayers = [], totalCount = 0) => ({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      },
      from: jest.fn().mockImplementation((table) => {
        if (table === 'v_prayers_likes') {
          return {
            select: jest.fn().mockImplementation((fields) => {
              if (fields.includes('count')) {
                return {
                  eq: jest.fn().mockReturnValue({
                    gte: jest.fn().mockResolvedValue({
                      count: totalCount
                    })
                  })
                }
              }
              return {
                eq: jest.fn().mockReturnValue({
                  gte: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                      range: jest.fn().mockResolvedValue({
                        data: prayers,
                        error: null
                      })
                    })
                  })
                })
              }
            })
          }
        } else if (table === 'comments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 0
              })
            })
          }
        }
      })
    })

    it('should handle default query parameters', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const mockPrayers = createMockPrayers(5)
      
      const mockSupabase = createMockServerSupabase({
        authUser: { id: 'user-123' },
        queryResults: {
          v_prayers_likes: mockPrayers,
          comments: []
        }
      })
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/prayers')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('prayers')
      expect(data).toHaveProperty('pagination')
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 5,
        totalPages: 1
      })
    })

    it('should handle custom pagination parameters', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const mockPrayers = createMockPrayers(3)
      const mockSupabase = createAuthenticatedMockSupabase(mockPrayers, 25)
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/prayers?page=3&limit=5')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.pagination).toEqual({
        page: 3,
        limit: 5,
        total: 25,
        totalPages: 5
      })
      
      // Verify pagination was applied to query
      const rangeCall = mockSupabase.from().select().eq().gte().order().range
      expect(rangeCall).toHaveBeenCalledWith(10, 14) // (page-1)*limit to (page-1)*limit + limit - 1
    })

    it('should enforce limit boundaries (min 1, max 50)', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const mockPrayers = createMockPrayers(3)
      const mockSupabase = createAuthenticatedMockSupabase(mockPrayers, 3)
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      // Test max limit enforcement
      const request1 = createMockNextRequest('http://localhost:3000/api/user/prayers?limit=100')
      const response1 = await GET(request1)
      const data1 = await response1.json()
      
      expect(data1.pagination.limit).toBe(50) // Should be capped at 50
      
      // Test min limit enforcement
      const request2 = createMockNextRequest('http://localhost:3000/api/user/prayers?limit=0')
      const response2 = await GET(request2)
      const data2 = await response2.json()
      
      expect(data2.pagination.limit).toBe(1) // Should be at least 1
    })

    it('should enforce page minimum (min 1)', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const mockPrayers = createMockPrayers(3)
      const mockSupabase = createAuthenticatedMockSupabase(mockPrayers, 3)
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/prayers?page=0')
      const response = await GET(request)
      const data = await response.json()
      
      expect(data.pagination.page).toBe(1) // Should be at least 1
    })
  })

  describe.skip('Sorting', () => {
    const createMockSupabaseForSorting = (prayers = []) => ({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      },
      from: jest.fn().mockImplementation((table) => {
        if (table === 'v_prayers_likes') {
          return {
            select: jest.fn().mockImplementation((fields) => {
              if (fields.includes('count')) {
                return {
                  eq: jest.fn().mockReturnValue({
                    gte: jest.fn().mockResolvedValue({
                      count: prayers.length
                    })
                  })
                }
              }
              return {
                eq: jest.fn().mockReturnValue({
                  gte: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                      range: jest.fn().mockResolvedValue({
                        data: prayers,
                        error: null
                      })
                    })
                  })
                })
              }
            })
          }
        } else if (table === 'comments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 0
              })
            })
          }
        }
      })
    })

    it('should sort by recent (created_at desc) by default', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const mockPrayers = createMockPrayers(3)
      const mockSupabase = createMockSupabaseForSorting(mockPrayers)
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/prayers')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      // Verify default sorting order was applied
      const orderCall = mockSupabase.from().select().eq().gte().order
      expect(orderCall).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should sort by most_liked (like_count desc)', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const mockPrayers = createMockPrayers(3)
      const mockSupabase = createMockSupabaseForSorting(mockPrayers)
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/prayers?sort=most_liked')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      // Verify like-based sorting was applied
      const orderCall = mockSupabase.from().select().eq().gte().order
      expect(orderCall).toHaveBeenCalledWith('like_count', { ascending: false })
    })

    it('should fall back to recent for most_commented sorting (as per comment in code)', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const mockPrayers = createMockPrayers(3)
      const mockSupabase = createMockSupabaseForSorting(mockPrayers)
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/prayers?sort=most_commented')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      // Should fall back to created_at ordering as mentioned in the code comment
      const orderCall = mockSupabase.from().select().eq().gte().order
      expect(orderCall).toHaveBeenCalledWith('created_at', { ascending: false })
    })
  })

  describe.skip('Time Range Filtering', () => {
    const createMockSupabaseForTimeRange = (prayers = []) => ({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      },
      from: jest.fn().mockImplementation((table) => {
        if (table === 'v_prayers_likes') {
          return {
            select: jest.fn().mockImplementation((fields) => {
              if (fields.includes('count')) {
                return {
                  eq: jest.fn().mockReturnValue({
                    gte: jest.fn().mockResolvedValue({
                      count: prayers.length
                    })
                  })
                }
              }
              return {
                eq: jest.fn().mockReturnValue({
                  gte: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                      range: jest.fn().mockResolvedValue({
                        data: prayers,
                        error: null
                      })
                    })
                  })
                })
              }
            })
          }
        } else if (table === 'comments') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 0
              })
            })
          }
        }
      })
    })

    it('should filter by this_month time range', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const mockPrayers = createMockPrayers(3)
      const mockSupabase = createMockSupabaseForTimeRange(mockPrayers)
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/prayers?timeRange=this_month')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      // Verify time filter was applied - should use first day of current month
      const gteCall = mockSupabase.from().select().eq().gte
      expect(gteCall).toHaveBeenCalledWith('created_at', expect.stringMatching(/^\d{4}-\d{2}-01T00:00:00/))
    })

    it('should filter by last_3_months time range', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const mockPrayers = createMockPrayers(3)
      const mockSupabase = createMockSupabaseForTimeRange(mockPrayers)
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/prayers?timeRange=last_3_months')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      // Verify time filter was applied - should use 3 months ago
      const gteCall = mockSupabase.from().select().eq().gte
      expect(gteCall).toHaveBeenCalledWith('created_at', expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/))
    })

    it('should use beginning of time for "all" time range', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const mockPrayers = createMockPrayers(3)
      const mockSupabase = createMockSupabaseForTimeRange(mockPrayers)
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/prayers?timeRange=all')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      // Verify time filter uses beginning of time (epoch)
      const gteCall = mockSupabase.from().select().eq().gte
      expect(gteCall).toHaveBeenCalledWith('created_at', '1970-01-01T00:00:00.000Z')
    })
  })

  describe.skip('Comment Count Enhancement', () => {
    it('should add comment counts to prayers', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const mockPrayers = [
        { id: 'prayer-1', content: 'Prayer 1', like_count: 5 },
        { id: 'prayer-2', content: 'Prayer 2', like_count: 3 }
      ]
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null
          })
        },
        from: jest.fn().mockImplementation((table) => {
          if (table === 'v_prayers_likes') {
            return {
              select: jest.fn().mockImplementation((fields) => {
                if (fields.includes('count')) {
                  return {
                    eq: jest.fn().mockReturnValue({
                      gte: jest.fn().mockResolvedValue({
                        count: 2
                      })
                    })
                  }
                }
                return {
                  eq: jest.fn().mockReturnValue({
                    gte: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        range: jest.fn().mockResolvedValue({
                          data: mockPrayers,
                          error: null
                        })
                      })
                    })
                  })
                }
              })
            }
          } else if (table === 'comments') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockImplementation((field, value) => {
                  // Return different comment counts for different prayers
                  const commentCounts = {
                    'prayer-1': 3,
                    'prayer-2': 1
                  }
                  return {
                    count: commentCounts[value as string] || 0
                  }
                })
              })
            }
          }
        })
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/prayers')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.prayers).toHaveLength(2)
      expect(data.prayers[0]).toHaveProperty('comment_count', 3)
      expect(data.prayers[1]).toHaveProperty('comment_count', 1)
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
                order: jest.fn().mockReturnValue({
                  range: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Database connection failed' }
                  })
                })
              })
            })
          })
        })
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/user/prayers')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Failed to fetch prayers')
    })

    it.skip('should handle unexpected errors gracefully', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      // Mock to throw an error
      createServerSupabase.mockRejectedValue(new Error('Unexpected error'))
      
      const request = createMockNextRequest('http://localhost:3000/api/user/prayers')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Failed to fetch user prayers')
    })
  })
})
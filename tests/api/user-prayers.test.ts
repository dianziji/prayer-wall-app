import { GET } from '@/app/api/user/prayers/route'
import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'

// Mock the Supabase server client
jest.mock('@/lib/supabase-server', () => ({
  createServerSupabase: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn()
  }))
}))

describe('/api/user/prayers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null
        })
      },
      from: jest.fn()
    }
    createServerSupabase.mockResolvedValue(mockSupabase)

    const nextRequest = new NextRequest(new URL('/api/user/prayers', 'http://localhost:3000'))
    
    const response = await GET(nextRequest)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: 'Authentication required' })
  })

  it('should return paginated prayers with default parameters', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    
    const mockUser = { id: 'test-user-id' }
    const mockPrayers = [
      {
        id: '1',
        content: 'Test prayer 1',
        author_name: 'Test User',
        user_id: 'test-user-id',
        created_at: '2023-12-01T00:00:00Z',
        like_count: 5,
        liked_by_me: false
      },
      {
        id: '2',
        content: 'Test prayer 2',
        author_name: 'Test User',
        user_id: 'test-user-id',
        created_at: '2023-12-02T00:00:00Z',
        like_count: 3,
        liked_by_me: true
      }
    ]
    
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      },
      from: jest.fn().mockImplementation((table) => {
        if (table === 'v_prayers_likes') {
          const mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockResolvedValue({
              data: mockPrayers,
              error: null
            }),
            count: 15 // Mock total count
          }
          return mockQuery
        }
        return {
          select: jest.fn(),
          eq: jest.fn(),
          gte: jest.fn(),
          count: 15
        }
      })
    }
    
    createServerSupabase.mockResolvedValue(mockSupabase)

    const nextRequest = new NextRequest(new URL('/api/user/prayers', 'http://localhost:3000'))
    
    const response = await GET(nextRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('prayers')
    expect(data).toHaveProperty('pagination')
    expect(data.prayers).toHaveLength(2)
    expect(data.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 15,
      totalPages: 2
    })
  })

  it('should handle pagination parameters correctly', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    
    const mockUser = { id: 'test-user-id' }
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      },
      from: jest.fn().mockImplementation((table) => {
        if (table === 'v_prayers_likes') {
          const mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockImplementation((start, end) => {
              // Verify pagination offset calculation
              expect(start).toBe(5) // (page 2 - 1) * limit 5 = 5
              expect(end).toBe(9)   // start + limit - 1 = 9
              return Promise.resolve({
                data: [],
                error: null
              })
            }),
            count: 20
          }
          return mockQuery
        }
        return {
          select: jest.fn(),
          eq: jest.fn(),
          gte: jest.fn(),
          count: 20
        }
      })
    }
    
    createServerSupabase.mockResolvedValue(mockSupabase)

    const nextRequest = new NextRequest(new URL('/api/user/prayers?page=2&limit=5', 'http://localhost:3000'))
    
    const response = await GET(nextRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 20,
      totalPages: 4
    })
  })

  it('should handle sorting parameters', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    
    const mockUser = { id: 'test-user-id' }
    let orderByCalled = false
    
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      },
      from: jest.fn().mockImplementation((table) => {
        if (table === 'v_prayers_likes') {
          const mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockImplementation((column, options) => {
              orderByCalled = true
              expect(column).toBe('like_count')
              expect(options.ascending).toBe(false)
              return {
                range: jest.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              }
            }),
            count: 0
          }
          return mockQuery
        }
        return {
          select: jest.fn(),
          eq: jest.fn(),
          gte: jest.fn(),
          count: 0
        }
      })
    }
    
    createServerSupabase.mockResolvedValue(mockSupabase)

    const nextRequest = new NextRequest(new URL('/api/user/prayers?sort=most_liked', 'http://localhost:3000'))
    
    const response = await GET(nextRequest)
    expect(response.status).toBe(200)
    expect(orderByCalled).toBe(true)
  })

  it('should handle time range filtering', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    
    const mockUser = { id: 'test-user-id' }
    let gteFilterCalled = false
    
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      },
      from: jest.fn().mockImplementation((table) => {
        if (table === 'v_prayers_likes') {
          const mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockImplementation((column, value) => {
              gteFilterCalled = true
              expect(column).toBe('created_at')
              // Should be filtering to this month
              const filterDate = new Date(value)
              const thisMonth = new Date()
              thisMonth.setDate(1)
              expect(filterDate.getMonth()).toBe(thisMonth.getMonth())
              return {
                order: jest.fn().mockReturnThis(),
                range: jest.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              }
            }),
            count: 0
          }
          return mockQuery
        }
        return {
          select: jest.fn(),
          eq: jest.fn(),
          gte: jest.fn(),
          count: 0
        }
      })
    }
    
    createServerSupabase.mockResolvedValue(mockSupabase)

    const nextRequest = new NextRequest(new URL('/api/user/prayers?timeRange=this_month', 'http://localhost:3000'))
    
    const response = await GET(nextRequest)
    expect(response.status).toBe(200)
    expect(gteFilterCalled).toBe(true)
  })

  it('should handle database errors gracefully', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    
    const mockUser = { id: 'test-user-id' }
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      },
      from: jest.fn().mockImplementation((table) => {
        if (table === 'v_prayers_likes') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    range: jest.fn().mockResolvedValue({
                      data: null,
                      error: new Error('Database connection failed')
                    })
                  })
                })
              })
            }),
            count: 0
          }
        }
        return {
          select: jest.fn(),
          eq: jest.fn(),
          gte: jest.fn(),
          count: 0
        }
      })
    }
    
    createServerSupabase.mockResolvedValue(mockSupabase)

    const nextRequest = new NextRequest(new URL('/api/user/prayers', 'http://localhost:3000'))
    
    const response = await GET(nextRequest)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to fetch prayers' })
  })
})
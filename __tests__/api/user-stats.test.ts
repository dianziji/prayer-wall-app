import { GET } from '@/app/api/user/stats/route'
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

describe('/api/user/stats', () => {
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

    const nextRequest = new NextRequest('http://localhost:3000/api/user/stats')
    
    const response = await GET(nextRequest)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: 'Authentication required' })
  })

  it('should return user stats when authenticated', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    
    const mockUser = { id: 'test-user-id' }
    const mockPrayersData = [
      { created_at: '2023-12-01T00:00:00Z' },
      { created_at: '2023-12-02T00:00:00Z' }
    ]
    
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      },
      from: jest.fn().mockImplementation((table) => {
        if (table === 'prayers') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                count: 2, // Total prayers count
                gte: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: mockPrayersData,
                    error: null
                  })
                })
              })
            })
          }
        }
        return {
          select: jest.fn(),
          eq: jest.fn(),
          count: jest.fn()
        }
      })
    }
    
    createServerSupabase.mockResolvedValue(mockSupabase)

    const nextRequest = new NextRequest('http://localhost:3000/api/user/stats')
    
    const response = await GET(nextRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('totalPrayers')
    expect(data).toHaveProperty('totalLikes')
    expect(data).toHaveProperty('totalComments')
    expect(data).toHaveProperty('mostActiveWeek')
    expect(data).toHaveProperty('recentActivity')
    expect(Array.isArray(data.recentActivity)).toBe(true)
    expect(data.recentActivity).toHaveLength(4) // Last 4 weeks
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
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Database connection failed'))
        })
      })
    }
    
    createServerSupabase.mockResolvedValue(mockSupabase)

    const nextRequest = new NextRequest('http://localhost:3000/api/user/stats')
    
    const response = await GET(nextRequest)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to fetch user statistics' })
  })
})
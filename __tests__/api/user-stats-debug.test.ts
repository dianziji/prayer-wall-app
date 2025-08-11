import { GET } from '@/app/api/user/stats/route'
import { NextRequest } from 'next/server'

// Mock the Supabase server client
jest.mock('@/lib/supabase-server', () => ({
  createServerSupabase: jest.fn()
}))

describe('/api/user/stats - Debug Likes/Comments Counting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should correctly count likes and comments on user prayers', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    
    const mockUser = { id: 'user-123' }
    
    // Mock user prayers
    const mockUserPrayers = [
      { id: 'prayer-1' },
      { id: 'prayer-2' },
      { id: 'prayer-3' }
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
            select: jest.fn().mockImplementation((fields) => {
              if (fields === '*') {
                // Count prayers query
                return {
                  eq: jest.fn().mockReturnValue({
                    count: 3 // User has 3 prayers
                  })
                }
              } else if (fields === 'id') {
                // Get prayer IDs query
                return {
                  eq: jest.fn().mockResolvedValue({
                    data: mockUserPrayers,
                    error: null
                  })
                }
              } else if (fields === 'created_at') {
                // Weekly data query
                return {
                  eq: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                      data: [
                        { created_at: '2023-12-01T00:00:00Z' },
                        { created_at: '2023-12-02T00:00:00Z' },
                        { created_at: '2023-12-03T00:00:00Z' }
                      ],
                      error: null
                    })
                  })
                }
              }
            })
          }
        } else if (table === 'likes') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockImplementation((field, values) => {
                expect(field).toBe('prayer_id')
                expect(values).toEqual(['prayer-1', 'prayer-2', 'prayer-3'])
                return {
                  count: 7 // User prayers received 7 total likes
                }
              })
            })
          }
        } else if (table === 'comments') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockImplementation((field, values) => {
                expect(field).toBe('prayer_id')
                expect(values).toEqual(['prayer-1', 'prayer-2', 'prayer-3'])
                return {
                  count: 5 // User prayers received 5 total comments
                }
              })
            })
          }
        }
      })
    }
    
    createServerSupabase.mockResolvedValue(mockSupabase)

    const nextRequest = new NextRequest('http://localhost:3000/api/user/stats')
    
    const response = await GET(nextRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      totalPrayers: 3,
      totalLikes: 7,    // Should be 7, not 3
      totalComments: 5, // Should be 5, not 3
      mostActiveWeek: expect.any(String),
      recentActivity: expect.any(Array)
    })

    // Verify the correct queries were called
    expect(mockSupabase.from).toHaveBeenCalledWith('prayers') // For prayer count and IDs
    expect(mockSupabase.from).toHaveBeenCalledWith('likes')   // For likes count
    expect(mockSupabase.from).toHaveBeenCalledWith('comments') // For comments count
  })

  it('should return zero likes and comments when user has no prayers', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    
    const mockUser = { id: 'user-no-prayers' }

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
            select: jest.fn().mockImplementation((fields) => {
              if (fields === '*') {
                return {
                  eq: jest.fn().mockReturnValue({
                    count: 0 // No prayers
                  })
                }
              } else if (fields === 'id') {
                return {
                  eq: jest.fn().mockResolvedValue({
                    data: [], // No prayer IDs
                    error: null
                  })
                }
              } else if (fields === 'created_at') {
                return {
                  eq: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                      data: [],
                      error: null
                    })
                  })
                }
              }
            })
          }
        }
      })
    }
    
    createServerSupabase.mockResolvedValue(mockSupabase)

    const nextRequest = new NextRequest('http://localhost:3000/api/user/stats')
    
    const response = await GET(nextRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      totalPrayers: 0,
      totalLikes: 0,    // Should be 0
      totalComments: 0, // Should be 0
      mostActiveWeek: 'N/A',
      recentActivity: expect.any(Array)
    })

    // Should not call likes/comments tables when no prayers exist
    expect(mockSupabase.from).toHaveBeenCalledWith('prayers')
    expect(mockSupabase.from).not.toHaveBeenCalledWith('likes')
    expect(mockSupabase.from).not.toHaveBeenCalledWith('comments')
  })

  it('should handle scenario where user has prayers but no likes/comments', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    
    const mockUser = { id: 'user-no-engagement' }
    const mockUserPrayers = [{ id: 'lonely-prayer' }]

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
            select: jest.fn().mockImplementation((fields) => {
              if (fields === '*') {
                return {
                  eq: jest.fn().mockReturnValue({
                    count: 1
                  })
                }
              } else if (fields === 'id') {
                return {
                  eq: jest.fn().mockResolvedValue({
                    data: mockUserPrayers,
                    error: null
                  })
                }
              } else if (fields === 'created_at') {
                return {
                  eq: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                      data: [{ created_at: '2023-12-01T00:00:00Z' }],
                      error: null
                    })
                  })
                }
              }
            })
          }
        } else if (table === 'likes') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                count: 0 // No likes
              })
            })
          }
        } else if (table === 'comments') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                count: 0 // No comments
              })
            })
          }
        }
      })
    }
    
    createServerSupabase.mockResolvedValue(mockSupabase)

    const nextRequest = new NextRequest('http://localhost:3000/api/user/stats')
    
    const response = await GET(nextRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      totalPrayers: 1,
      totalLikes: 0,
      totalComments: 0,
      mostActiveWeek: expect.any(String),
      recentActivity: expect.any(Array)
    })
  })
})
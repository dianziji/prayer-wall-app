import { GET, POST, PATCH, DELETE } from '@/app/api/prayers/route'
import { createMockNextRequest } from '@/tests/utils/api-helpers'
import { createMockPrayer, createMockPrayers } from '@/tests/utils/factories'
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

describe('/api/prayers API Routes', () => {
  let mockCreateServerSupabase: jest.Mock
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateServerSupabase = require('@/lib/supabase-server').createServerSupabase
    // Set up default mock
    mockCreateServerSupabase.mockResolvedValue(createMockServerSupabase({}))
  })

  describe('GET /api/prayers', () => {
    it('should return prayers for current week when no week parameter provided', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const mockPrayers = createMockPrayers(3)
      
      const mockSupabase = createMockServerSupabase({
        v_prayers_likes: mockPrayers
      })
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/prayers')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(3)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('content')
    })

    it('should return prayers for specific week when week parameter provided', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const mockPrayers = createMockPrayers(2, { 
        created_at: '2023-12-03T10:00:00Z' 
      })
      
      const mockSupabase = createMockServerSupabase({
        v_prayers_likes: mockPrayers
      })
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/prayers?week=2023-12-03')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
    })

    it('should return empty array when no prayers found', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = createMockServerSupabase({
        v_prayers_likes: []
      })
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/prayers')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lt: jest.fn().mockReturnValue({
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
      
      const request = createMockNextRequest('http://localhost:3000/api/prayers')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error')
    })
  })

  describe('POST /api/prayers', () => {
    it('should create prayer when authenticated with valid data', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const newPrayer = createMockPrayer({
        content: 'New prayer content',
        author_name: 'Test Author'
      })
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-id' } },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: [newPrayer],
              error: null
            })
          })
        })
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/prayers', {
        method: 'POST',
        body: JSON.stringify({
          content: 'New prayer content',
          author_name: 'Test Author'
        })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data).toHaveProperty('id')
      expect(data.content).toBe('New prayer content')
    })

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
      
      const request = createMockNextRequest('http://localhost:3000/api/prayers', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Prayer content'
        })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data).toHaveProperty('error')
    })

    it('should return 400 when content is missing', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-id' } },
            error: null
          })
        }
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/prayers', {
        method: 'POST',
        body: JSON.stringify({
          author_name: 'Test Author'
        })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })

    it('should return 400 when content is too long', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-id' } },
            error: null
          })
        }
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/prayers', {
        method: 'POST',
        body: JSON.stringify({
          content: 'a'.repeat(501), // Too long
          author_name: 'Test Author'
        })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })

  describe('PATCH /api/prayers', () => {
    it('should update prayer when authenticated and owns prayer', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const updatedPrayer = createMockPrayer({
        id: 'prayer-1',
        content: 'Updated content',
        user_id: 'user-id'
      })
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-id' } },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_id: 'user-id' },
                error: null
              })
            })
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: updatedPrayer,
                  error: null
                })
              })
            })
          })
        })
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/prayers?id=prayer-1', {
        method: 'PATCH',
        body: JSON.stringify({
          content: 'Updated content'
        })
      })
      
      const response = await PATCH(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.content).toBe('Updated content')
    })

    it('should return 400 when prayer ID is missing', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-id' } },
            error: null
          })
        }
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/prayers', {
        method: 'PATCH',
        body: JSON.stringify({
          content: 'Updated content'
        })
      })
      
      const response = await PATCH(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })

    it('should return 403 when user does not own prayer', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-id' } },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_id: 'other-user-id' },
                error: null
              })
            })
          })
        })
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/prayers?id=prayer-1', {
        method: 'PATCH',
        body: JSON.stringify({
          content: 'Updated content'
        })
      })
      
      const response = await PATCH(request)
      const data = await response.json()
      
      expect(response.status).toBe(403)
      expect(data).toHaveProperty('error')
    })
  })

  describe('DELETE /api/prayers', () => {
    it('should delete prayer when authenticated and owns prayer', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-id' } },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { user_id: 'user-id' },
                error: null
              })
            })
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/prayers?id=prayer-1', {
        method: 'DELETE'
      })
      
      const response = await DELETE(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
    })

    it('should return 400 when prayer ID is missing', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-id' } },
            error: null
          })
        }
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/prayers', {
        method: 'DELETE'
      })
      
      const response = await DELETE(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })

    it('should return 404 when prayer does not exist', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-id' } },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
              })
            })
          })
        })
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const request = createMockNextRequest('http://localhost:3000/api/prayers?id=nonexistent', {
        method: 'DELETE'
      })
      
      const response = await DELETE(request)
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data).toHaveProperty('error')
    })
  })
})
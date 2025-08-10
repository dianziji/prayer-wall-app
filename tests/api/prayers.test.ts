import { createMocks } from 'node-mocks-http'
import { PATCH, DELETE } from '@/app/api/prayers/route'

// Mock the Supabase modules
jest.mock('@/lib/supabase-server', () => ({
  createServerSupabase: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn()
  }))
}))

jest.mock('@/lib/utils', () => ({
  isCurrentWeek: jest.fn()
}))

describe('/api/prayers PATCH endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should update prayer when user is owner and prayer is from current week', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    const { isCurrentWeek } = require('@/lib/utils')
    
    // Mock successful auth
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ 
          data: { user: { id: 'user-1' } } 
        })
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_id: 'user-1', created_at: '2025-08-10T10:00:00Z' },
              error: null
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        })
      })
    }
    
    createServerSupabase.mockReturnValue(mockSupabase)
    isCurrentWeek.mockReturnValue(true)

    const { req } = createMocks({
      method: 'PATCH',
      url: '/api/prayers?id=prayer-1',
      body: {
        content: 'Updated prayer content',
        author_name: 'Updated Author'
      }
    })

    const response = await PATCH(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ success: true })
  })

  it('should return 401 when user is not authenticated', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } })
      }
    }
    
    createServerSupabase.mockReturnValue(mockSupabase)

    const { req } = createMocks({
      method: 'PATCH',
      url: '/api/prayers?id=prayer-1',
      body: { content: 'Updated content' }
    })

    const response = await PATCH(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('请先登录')
  })

  it('should return 400 when prayer ID is missing', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ 
          data: { user: { id: 'user-1' } } 
        })
      }
    }
    
    createServerSupabase.mockReturnValue(mockSupabase)

    const { req } = createMocks({
      method: 'PATCH',
      url: '/api/prayers',
      body: { content: 'Updated content' }
    })

    const response = await PATCH(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Prayer ID required')
  })

  it('should return 403 when user tries to edit someone else\'s prayer', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ 
          data: { user: { id: 'user-1' } } 
        })
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_id: 'user-2', created_at: '2025-08-10T10:00:00Z' },
              error: null
            })
          })
        })
      })
    }
    
    createServerSupabase.mockReturnValue(mockSupabase)

    const { req } = createMocks({
      method: 'PATCH',
      url: '/api/prayers?id=prayer-1',
      body: { content: 'Updated content' }
    })

    const response = await PATCH(req)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Not authorized')
  })

  it('should return 400 when trying to edit prayer from past week', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    const { isCurrentWeek } = require('@/lib/utils')
    
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ 
          data: { user: { id: 'user-1' } } 
        })
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_id: 'user-1', created_at: '2025-08-01T10:00:00Z' },
              error: null
            })
          })
        })
      })
    }
    
    createServerSupabase.mockReturnValue(mockSupabase)
    isCurrentWeek.mockReturnValue(false)

    const { req } = createMocks({
      method: 'PATCH', 
      url: '/api/prayers?id=prayer-1',
      body: { content: 'Updated content' }
    })

    const response = await PATCH(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Can only edit current week prayers')
  })
})

describe('/api/prayers DELETE endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should delete prayer when user is owner and prayer is from current week', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    const { isCurrentWeek } = require('@/lib/utils')
    
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ 
          data: { user: { id: 'user-1' } } 
        })
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_id: 'user-1', created_at: '2025-08-10T10:00:00Z' },
              error: null
            })
          })
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        })
      })
    }
    
    createServerSupabase.mockReturnValue(mockSupabase)
    isCurrentWeek.mockReturnValue(true)

    const { req } = createMocks({
      method: 'DELETE',
      url: '/api/prayers?id=prayer-1'
    })

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ success: true })
  })

  it('should return 401 when user is not authenticated', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } })
      }
    }
    
    createServerSupabase.mockReturnValue(mockSupabase)

    const { req } = createMocks({
      method: 'DELETE',
      url: '/api/prayers?id=prayer-1'
    })

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('请先登录')
  })

  it('should return 403 when user tries to delete someone else\'s prayer', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ 
          data: { user: { id: 'user-1' } } 
        })
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_id: 'user-2', created_at: '2025-08-10T10:00:00Z' },
              error: null
            })
          })
        })
      })
    }
    
    createServerSupabase.mockReturnValue(mockSupabase)

    const { req } = createMocks({
      method: 'DELETE',
      url: '/api/prayers?id=prayer-1'
    })

    const response = await DELETE(req)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Not authorized')
  })
})
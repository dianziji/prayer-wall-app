import { GET } from '@/app/api/archive-weeks/route'
import { createMockServerSupabase } from '@/tests/mocks/services/supabase'

// Mock NextResponse
jest.mock('next/server', () => ({
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

describe('/api/archive-weeks API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return archive weeks data successfully', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    const mockArchiveWeeks = [
      { week_start_et: '2023-12-03', prayer_count: 15 },
      { week_start_et: '2023-11-26', prayer_count: 12 },
      { week_start_et: '2023-11-19', prayer_count: 8 }
    ]
    
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: mockArchiveWeeks,
              error: null
            })
          })
        })
      })
    }
    
    createServerSupabase.mockResolvedValue(mockSupabase)
    
    const response = await GET()
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveLength(3)
    expect(data[0]).toHaveProperty('week_start_et', '2023-12-03')
    expect(data[0]).toHaveProperty('prayer_count', 15)
    
    // Verify correct query structure
    expect(mockSupabase.from).toHaveBeenCalledWith('archive_weeks')
    const selectCall = mockSupabase.from().select
    expect(selectCall).toHaveBeenCalledWith('week_start_et, prayer_count')
    
    const orderCall = selectCall().order
    expect(orderCall).toHaveBeenCalledWith('week_start_et', { ascending: false })
    
    const limitCall = orderCall().limit
    expect(limitCall).toHaveBeenCalledWith(52)
  })

  it('should return empty array when no archive weeks found', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      })
    }
    
    createServerSupabase.mockResolvedValue(mockSupabase)
    
    const response = await GET()
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toEqual([])
  })

  it('should return empty array when data is null', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      })
    }
    
    createServerSupabase.mockResolvedValue(mockSupabase)
    
    const response = await GET()
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toEqual([])
  })

  it('should handle database errors gracefully', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' }
            })
          })
        })
      })
    }
    
    createServerSupabase.mockResolvedValue(mockSupabase)
    
    const response = await GET()
    const data = await response.json()
    
    expect(response.status).toBe(500)
    expect(data).toHaveProperty('error', 'failed')
  })

  it('should limit results to 52 weeks', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    
    // Generate 60 weeks of data (more than limit)
    const mockArchiveWeeks = Array.from({ length: 60 }, (_, i) => ({
      week_start_et: `2023-${String(12 - Math.floor(i / 4)).padStart(2, '0')}-${String((i % 4) * 7 + 1).padStart(2, '0')}`,
      prayer_count: 10 + i
    }))
    
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: mockArchiveWeeks.slice(0, 52), // Database would handle the limit
              error: null
            })
          })
        })
      })
    }
    
    createServerSupabase.mockResolvedValue(mockSupabase)
    
    const response = await GET()
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveLength(52)
    
    // Verify limit was applied in query
    const limitCall = mockSupabase.from().select().order().limit
    expect(limitCall).toHaveBeenCalledWith(52)
  })

  it('should order results by week_start_et descending (most recent first)', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server')
    const mockArchiveWeeks = [
      { week_start_et: '2023-12-10', prayer_count: 20 },
      { week_start_et: '2023-12-03', prayer_count: 15 },
      { week_start_et: '2023-11-26', prayer_count: 12 }
    ]
    
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: mockArchiveWeeks,
              error: null
            })
          })
        })
      })
    }
    
    createServerSupabase.mockResolvedValue(mockSupabase)
    
    const response = await GET()
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data[0].week_start_et).toBe('2023-12-10') // Most recent first
    expect(data[2].week_start_et).toBe('2023-11-26') // Oldest last
    
    // Verify correct ordering in query
    const orderCall = mockSupabase.from().select().order
    expect(orderCall).toHaveBeenCalledWith('week_start_et', { ascending: false })
  })
})
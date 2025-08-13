import { POST } from '@/app/api/avatar/ingest/route'

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

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('/api/avatar/ingest API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
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
      
      const request = new Request('http://localhost:3000/api/avatar/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: 'https://lh3.googleusercontent.com/avatar.jpg' })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data).toHaveProperty('error', 'Unauthorized')
    })
  })

  describe('Input Validation', () => {
    const createMockAuthenticatedSupabase = () => ({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      },
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ error: null }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: 'https://storage.url/avatar.jpg' }
          })
        })
      },
      from: jest.fn().mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null })
      })
    })

    it('should return 400 when sourceUrl is missing', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      createServerSupabase.mockResolvedValue(createMockAuthenticatedSupabase())
      
      const request = new Request('http://localhost:3000/api/avatar/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'sourceUrl is required')
    })

    it('should return 400 when sourceUrl is not a string', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      createServerSupabase.mockResolvedValue(createMockAuthenticatedSupabase())
      
      const request = new Request('http://localhost:3000/api/avatar/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: 123 })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'sourceUrl is required')
    })

    it('should return 400 when sourceUrl is empty string', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      createServerSupabase.mockResolvedValue(createMockAuthenticatedSupabase())
      
      const request = new Request('http://localhost:3000/api/avatar/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: '' })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'sourceUrl is required')
    })
  })

  describe('URL Sanitization', () => {
    const createMockAuthenticatedSupabaseForValidation = () => ({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      },
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ error: null }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: 'https://storage.url/avatar.jpg' }
          })
        })
      },
      from: jest.fn().mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null })
      })
    })

    it('should accept valid Google avatar URLs', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const mockSupabase = createMockAuthenticatedSupabaseForValidation()
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      const validUrls = [
        'https://lh3.googleusercontent.com/avatar.jpg',
        'https://lh4.googleusercontent.com/avatar.png',
        'https://lh5.googleusercontent.com/avatar.webp',
        'https://lh6.googleusercontent.com/avatar.gif',
        'https://googleusercontent.com/avatar.jpg'
      ]
      
      // Mock successful avatar fetch and upload
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'image/jpeg']]),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      })
      
      // Mock successful storage operations
      mockSupabase.storage = {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ error: null }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: 'https://storage.url/avatar.jpg' }
          })
        })
      }
      
      // Mock successful profile update
      mockSupabase.from = jest.fn().mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null })
      })
      
      for (const url of validUrls) {
        const request = new Request('http://localhost:3000/api/avatar/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceUrl: url })
        })
        
        const response = await POST(request)
        
        // Should not error during URL sanitization
        expect(response.status).toBe(200)
        
        // Reset mocks for next iteration
        jest.clearAllMocks()
        mockFetch.mockResolvedValue({
          ok: true,
          headers: new Map([['content-type', 'image/jpeg']]),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
        })
        createServerSupabase.mockResolvedValue(mockSupabase)
      }
    })

    it('should reject non-Google URLs', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      createServerSupabase.mockResolvedValue(createMockAuthenticatedSupabaseForValidation())
      
      const invalidUrls = [
        'https://facebook.com/avatar.jpg',
        'https://github.com/avatar.png',
        'https://malicious-site.com/avatar.jpg',
        'https://example.com/avatar.png'
      ]
      
      for (const url of invalidUrls) {
        const request = new Request('http://localhost:3000/api/avatar/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceUrl: url })
        })
        
        const response = await POST(request)
        const data = await response.json()
        
        expect(response.status).toBe(400)
        expect(data).toHaveProperty('error')
        expect(data.error).toContain('Invalid sourceUrl')
      }
    })

    it('should reject malformed URLs', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const mockSupabase = createMockAuthenticatedSupabaseForValidation()
      
      const malformedUrls = [
        'not-a-url',
        'javascript:alert(1)',
        'data:image/png;base64,abc123'
      ]
      
      for (const url of malformedUrls) {
        jest.clearAllMocks()
        createServerSupabase.mockResolvedValue(mockSupabase)
        
        const request = new Request('http://localhost:3000/api/avatar/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceUrl: url })
        })
        
        const response = await POST(request)
        const data = await response.json()
        
        expect(response.status).toBe(400)
        expect(data).toHaveProperty('error')
        expect(data.error).toMatch(/Invalid sourceUrl/)
      }
    })

    it('should handle FTP URLs by failing at fetch stage', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const mockSupabase = createMockAuthenticatedSupabaseForValidation()
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      // Mock fetch to fail for FTP URLs (which it would in reality)
      mockFetch.mockRejectedValue(new Error('Unsupported protocol: ftp'))
      
      const request = new Request('http://localhost:3000/api/avatar/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: 'ftp://lh3.googleusercontent.com/avatar.jpg' })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('Unsupported protocol')
    })
  })

  describe('Avatar Fetching', () => {
    const createMockSupabaseWithStorage = () => ({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      },
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ error: null }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: 'https://storage.url/user-123.jpg' }
          })
        })
      },
      from: jest.fn().mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null })
      })
    })

    it('should handle successful avatar fetch', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const mockSupabase = createMockSupabaseWithStorage()
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'image/jpeg']]),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      })
      
      const request = new Request('http://localhost:3000/api/avatar/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: 'https://lh3.googleusercontent.com/avatar.jpg' })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('url', 'https://storage.url/user-123.jpg')
      expect(mockFetch).toHaveBeenCalledWith('https://lh3.googleusercontent.com/avatar.jpg', { cache: 'no-store' })
    })

    it('should handle failed avatar fetch (404)', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      createServerSupabase.mockResolvedValue(createMockSupabaseWithStorage())
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Not Found')
      })
      
      const request = new Request('http://localhost:3000/api/avatar/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: 'https://lh3.googleusercontent.com/nonexistent.jpg' })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(502)
      expect(data).toHaveProperty('error', 'Failed to fetch source')
      expect(data).toHaveProperty('status', 404)
    })

    it('should handle network errors during fetch', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      createServerSupabase.mockResolvedValue(createMockSupabaseWithStorage())
      
      mockFetch.mockRejectedValue(new Error('Network error'))
      
      const request = new Request('http://localhost:3000/api/avatar/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: 'https://lh3.googleusercontent.com/avatar.jpg' })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Network error')
    })
  })

  describe('File Extension Detection', () => {
    const createMockSupabaseWithStorage = () => ({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      },
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ error: null }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: 'https://storage.url/user-123.jpg' }
          })
        })
      },
      from: jest.fn().mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null })
      })
    })

    const testCases = [
      { contentType: 'image/jpeg', expectedExt: 'jpg' },
      { contentType: 'image/jpg', expectedExt: 'jpg' },
      { contentType: 'image/png', expectedExt: 'png' },
      { contentType: 'image/webp', expectedExt: 'webp' },
      { contentType: 'image/gif', expectedExt: 'jpg' }, // Falls back to jpg
      { contentType: null, expectedExt: 'jpg' }, // Default
      { contentType: '', expectedExt: 'jpg' }, // Default
      { contentType: 'application/octet-stream', expectedExt: 'jpg' } // Default
    ]

    testCases.forEach(({ contentType, expectedExt }) => {
      it(`should detect ${expectedExt} extension for content-type: ${contentType}`, async () => {
        const { createServerSupabase } = require('@/lib/supabase-server')
        const mockSupabase = createMockSupabaseWithStorage()
        createServerSupabase.mockResolvedValue(mockSupabase)
        
        const headers = new Map()
        if (contentType) {
          headers.set('content-type', contentType)
        }
        
        mockFetch.mockResolvedValue({
          ok: true,
          headers,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
        })
        
        const request = new Request('http://localhost:3000/api/avatar/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceUrl: 'https://lh3.googleusercontent.com/avatar.jpg' })
        })
        
        await POST(request)
        
        // Verify the correct file extension was used in upload
        const uploadCall = mockSupabase.storage.from().upload
        expect(uploadCall).toHaveBeenCalledWith(
          `user-123.${expectedExt}`,
          expect.any(Buffer),
          expect.objectContaining({
            upsert: true
          })
        )
      })
    })
  })

  describe('Storage Operations', () => {
    it('should handle storage upload failure', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null
          })
        },
        storage: {
          from: jest.fn().mockReturnValue({
            upload: jest.fn().mockResolvedValue({
              error: { message: 'Storage quota exceeded' }
            })
          })
        }
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'image/jpeg']]),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      })
      
      const request = new Request('http://localhost:3000/api/avatar/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: 'https://lh3.googleusercontent.com/avatar.jpg' })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Upload failed')
      expect(data).toHaveProperty('details', 'Storage quota exceeded')
    })

    it('should handle profile update failure', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null
          })
        },
        storage: {
          from: jest.fn().mockReturnValue({
            upload: jest.fn().mockResolvedValue({ error: null }),
            getPublicUrl: jest.fn().mockReturnValue({
              data: { publicUrl: 'https://storage.url/user-123.jpg' }
            })
          })
        },
        from: jest.fn().mockReturnValue({
          upsert: jest.fn().mockResolvedValue({
            error: { message: 'Database constraint violation' }
          })
        })
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'image/jpeg']]),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      })
      
      const request = new Request('http://localhost:3000/api/avatar/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: 'https://lh3.googleusercontent.com/avatar.jpg' })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Profile update failed')
      expect(data).toHaveProperty('details', 'Database constraint violation')
      expect(data).toHaveProperty('url', 'https://storage.url/user-123.jpg')
    })

    it('should use upsert to overwrite existing avatar', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server')
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null
          })
        },
        storage: {
          from: jest.fn().mockReturnValue({
            upload: jest.fn().mockResolvedValue({ error: null }),
            getPublicUrl: jest.fn().mockReturnValue({
              data: { publicUrl: 'https://storage.url/user-123.jpg' }
            })
          })
        },
        from: jest.fn().mockReturnValue({
          upsert: jest.fn().mockResolvedValue({ error: null })
        })
      }
      
      createServerSupabase.mockResolvedValue(mockSupabase)
      
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'image/png']]),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      })
      
      const request = new Request('http://localhost:3000/api/avatar/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: 'https://lh3.googleusercontent.com/avatar.png' })
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      
      // Verify upsert was used in both storage and profile update
      expect(mockSupabase.storage.from().upload).toHaveBeenCalledWith(
        'user-123.png',
        expect.any(Buffer),
        expect.objectContaining({ upsert: true })
      )
      
      expect(mockSupabase.from().upsert).toHaveBeenCalledWith(
        { user_id: 'user-123', avatar_url: 'https://storage.url/user-123.jpg' },
        { onConflict: 'user_id' }
      )
    })
  })
})
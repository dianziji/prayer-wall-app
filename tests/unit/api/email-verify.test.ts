import { POST } from '@/app/api/email-verify/route'
import dns from 'dns/promises'

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

// Mock dns/promises
jest.mock('dns/promises', () => ({
  resolveMx: jest.fn()
}))

const mockDns = dns as jest.Mocked<typeof dns>

describe('/api/email-verify API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Input Validation', () => {
    it('should return 400 for missing email', async () => {
      const request = new Request('http://localhost:3000/api/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toEqual({
        ok: false,
        reason: 'invalid_format'
      })
    })

    it('should return 400 for non-string email', async () => {
      const request = new Request('http://localhost:3000/api/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 123 })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toEqual({
        ok: false,
        reason: 'invalid_format'
      })
    })

    it('should return 400 for email without @ symbol', async () => {
      const request = new Request('http://localhost:3000/api/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid-email' })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toEqual({
        ok: false,
        reason: 'invalid_format'
      })
    })

    it('should return 400 for empty email string', async () => {
      const request = new Request('http://localhost:3000/api/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '' })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toEqual({
        ok: false,
        reason: 'invalid_format'
      })
    })
  })

  describe('MX Record Verification', () => {
    it('should return ok: true for email with valid MX records', async () => {
      const mockMxRecords = [
        { exchange: 'gmail-smtp-in.l.google.com', priority: 5 },
        { exchange: 'alt1.gmail-smtp-in.l.google.com', priority: 10 }
      ]
      
      mockDns.resolveMx.mockResolvedValueOnce(mockMxRecords)
      
      const request = new Request('http://localhost:3000/api/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@gmail.com' })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual({ ok: true })
      expect(mockDns.resolveMx).toHaveBeenCalledWith('gmail.com')
    })

    it('should return ok: false for email with no MX records', async () => {
      mockDns.resolveMx.mockResolvedValueOnce([])
      
      const request = new Request('http://localhost:3000/api/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual({ ok: false })
      expect(mockDns.resolveMx).toHaveBeenCalledWith('example.com')
    })

    it('should return ok: false for domain that does not exist', async () => {
      mockDns.resolveMx.mockRejectedValueOnce(new Error('Domain not found'))
      
      const request = new Request('http://localhost:3000/api/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@nonexistentdomain.xyz' })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual({
        ok: false,
        reason: 'no_mx'
      })
      expect(mockDns.resolveMx).toHaveBeenCalledWith('nonexistentdomain.xyz')
    })

    it('should return ok: false for DNS resolution failure', async () => {
      mockDns.resolveMx.mockRejectedValueOnce(new Error('DNS resolution failed'))
      
      const request = new Request('http://localhost:3000/api/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@invalid-domain' })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual({
        ok: false,
        reason: 'no_mx'
      })
    })
  })

  describe('Email Domain Extraction', () => {
    it('should correctly extract domain from various email formats', async () => {
      const testCases = [
        { email: 'user@example.com', expectedDomain: 'example.com' },
        { email: 'user.name@subdomain.example.org', expectedDomain: 'subdomain.example.org' },
        { email: 'user+tag@gmail.com', expectedDomain: 'gmail.com' },
        { email: 'user_name@company.co.uk', expectedDomain: 'company.co.uk' },
        { email: 'test123@domain-with-dash.net', expectedDomain: 'domain-with-dash.net' }
      ]
      
      mockDns.resolveMx.mockResolvedValue([{ exchange: 'mail.example.com', priority: 10 }])
      
      for (const testCase of testCases) {
        const request = new Request('http://localhost:3000/api/email-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testCase.email })
        })
        
        await POST(request)
        
        expect(mockDns.resolveMx).toHaveBeenCalledWith(testCase.expectedDomain)
        mockDns.resolveMx.mockClear()
      }
    })

    it('should handle emails with multiple @ symbols (invalid format)', async () => {
      mockDns.resolveMx.mockResolvedValueOnce([{ exchange: 'mail.domain.com', priority: 10 }])
      
      const request = new Request('http://localhost:3000/api/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@@domain.com' })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      // Should still attempt to verify since it contains @
      // Domain extraction will be empty string from split('@')[1] which is second @ symbol
      expect(mockDns.resolveMx).toHaveBeenCalledWith('')
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed JSON request body', async () => {
      const request = new Request('http://localhost:3000/api/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })
      
      // This should throw during JSON parsing, but the test framework might handle it
      await expect(POST(request)).rejects.toThrow()
    })

    it('should handle very long email addresses', async () => {
      const longDomain = 'a'.repeat(100) + '.com'
      const longEmail = `user@${longDomain}`
      
      mockDns.resolveMx.mockResolvedValueOnce([{ exchange: 'mail.example.com', priority: 10 }])
      
      const request = new Request('http://localhost:3000/api/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: longEmail })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual({ ok: true })
      expect(mockDns.resolveMx).toHaveBeenCalledWith(longDomain)
    })

    it('should handle email with trailing/leading whitespace', async () => {
      mockDns.resolveMx.mockResolvedValueOnce([{ exchange: 'mail.example.com', priority: 10 }])
      
      const request = new Request('http://localhost:3000/api/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '  user@example.com  ' })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual({ ok: true })
      // Note: The current implementation doesn't trim whitespace, so domain will be "example.com  "
      expect(mockDns.resolveMx).toHaveBeenCalledWith('example.com  ')
    })
  })

  describe('Common Email Providers', () => {
    const commonProviders = [
      { email: 'user@gmail.com', domain: 'gmail.com' },
      { email: 'user@yahoo.com', domain: 'yahoo.com' },
      { email: 'user@outlook.com', domain: 'outlook.com' },
      { email: 'user@hotmail.com', domain: 'hotmail.com' },
      { email: 'user@protonmail.com', domain: 'protonmail.com' }
    ]

    it('should verify common email providers', async () => {
      for (const provider of commonProviders) {
        mockDns.resolveMx.mockResolvedValueOnce([
          { exchange: `mail.${provider.domain}`, priority: 10 }
        ])
        
        const request = new Request('http://localhost:3000/api/email-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: provider.email })
        })
        
        const response = await POST(request)
        const data = await response.json()
        
        expect(response.status).toBe(200)
        expect(data).toEqual({ ok: true })
        expect(mockDns.resolveMx).toHaveBeenCalledWith(provider.domain)
        
        mockDns.resolveMx.mockClear()
      }
    })
  })
})
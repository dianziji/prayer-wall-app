/**
 * 测试 app-config.ts 中的域名获取逻辑
 */

import { getAppOrigin, getOAuthCallbackUrl } from '@/lib/app-config'

// Mock window.location for browser environment tests (skip due to JSDOM issues)
// Use Jest setup global mocks instead

describe('App Config Utilities', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.NEXT_PUBLIC_SITE_URL
  })

  describe('getAppOrigin', () => {
    it('should use default localhost in browser environment', () => {
      // With default Jest setup, should return localhost origin
      const result = getAppOrigin()
      expect(result).toContain('localhost')
    })

    it('should handle browser environment', () => {
      // Test that function works in browser context
      const result = getAppOrigin()
      expect(typeof result).toBe('string')
      expect(result.startsWith('http')).toBe(true)
    })

    it('should use environment variable when available in server environment', () => {
      // Mock server environment
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      
      process.env.NEXT_PUBLIC_SITE_URL = 'https://prayer-wall-app.vercel.app'
      expect(getAppOrigin()).toBe('https://prayer-wall-app.vercel.app')
      
      // Restore window
      global.window = originalWindow
    })

    it('should strip trailing slash from environment variable', () => {
      // Mock server environment
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      
      process.env.NEXT_PUBLIC_SITE_URL = 'https://prayer-wall-app.vercel.app/'
      expect(getAppOrigin()).toBe('https://prayer-wall-app.vercel.app')
      
      // Restore window
      global.window = originalWindow
    })

    it('should fallback to production domain in server environment without env var', () => {
      // Mock server environment
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      
      expect(getAppOrigin()).toBe('https://prayer-wall-app.vercel.app')
      
      // Restore window
      global.window = originalWindow
    })
  })

  describe('getOAuthCallbackUrl', () => {
    it('should return callback URL with /auth/callback suffix', () => {
      const result = getOAuthCallbackUrl()
      expect(result).toContain('/auth/callback')
      expect(result.startsWith('http')).toBe(true)
    })

    it('should be based on app origin', () => {
      const origin = getAppOrigin()
      const callback = getOAuthCallbackUrl()
      expect(callback).toBe(`${origin}/auth/callback`)
    })

    it('should handle localhost development environment', () => {
      const result = getOAuthCallbackUrl()
      expect(result).toContain('localhost')
      expect(result).toContain('/auth/callback')
    })
  })
})
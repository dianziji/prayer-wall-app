/**
 * 测试 app-config.ts 中的域名获取逻辑
 */

import { getAppOrigin, getOAuthCallbackUrl } from '@/lib/app-config'

// Mock window.location for browser environment tests
const mockLocation = {
  origin: 'http://localhost:3000',
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('App Config Utilities', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.NEXT_PUBLIC_SITE_URL
  })

  describe('getAppOrigin', () => {
    it('should return window.location.origin in browser environment', () => {
      mockLocation.origin = 'https://preview-abc123.vercel.app'
      expect(getAppOrigin()).toBe('https://preview-abc123.vercel.app')
    })

    it('should return localhost origin', () => {
      mockLocation.origin = 'http://localhost:3000'
      expect(getAppOrigin()).toBe('http://localhost:3000')
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
    it('should return correct callback URL for localhost', () => {
      mockLocation.origin = 'http://localhost:3000'
      expect(getOAuthCallbackUrl()).toBe('http://localhost:3000/auth/callback')
    })

    it('should return correct callback URL for preview environment', () => {
      mockLocation.origin = 'https://preview-abc123.vercel.app'
      expect(getOAuthCallbackUrl()).toBe('https://preview-abc123.vercel.app/auth/callback')
    })

    it('should return correct callback URL for production', () => {
      mockLocation.origin = 'https://prayer-wall-app.vercel.app'
      expect(getOAuthCallbackUrl()).toBe('https://prayer-wall-app.vercel.app/auth/callback')
    })
  })
})
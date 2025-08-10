import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Add global Response and Request for MSW compatibility
import { Request, Response } from 'whatwg-fetch'
global.Request = Request
global.Response = Response

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock window.location.reload
delete window.location
window.location = { reload: jest.fn() }

// Mock fetch globally
global.fetch = jest.fn()

// Mock window.confirm
global.confirm = jest.fn(() => true)

// Mock window.alert  
global.alert = jest.fn()

// Setup MSW (disabled temporarily due to environment issues)
// import { beforeAll, afterEach, afterAll } from '@jest/globals'
// import { server } from './tests/mocks/server'

// beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
// afterEach(() => server.resetHandlers())
// afterAll(() => server.close())
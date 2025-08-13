import '@testing-library/jest-dom'
import 'whatwg-fetch'
import { server } from '../mocks/api/server'

// Setup dayjs with timezone support for testing
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

// Setup MSW
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

// Mock global objects
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
    return '/'
  },
}))

// Mock fetch globally
global.fetch = jest.fn()

// Mock browser APIs
global.confirm = jest.fn(() => true)
global.alert = jest.fn()

// Mock Notification API
global.Notification = {
  requestPermission: jest.fn(() => Promise.resolve('granted')),
  permission: 'granted'
} as any

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock timers
global.setTimeout = jest.fn()
global.clearTimeout = jest.fn()
global.setInterval = jest.fn()
global.clearInterval = jest.fn()

// Add TextEncoder/TextDecoder polyfill for Node.js environment
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Global test utilities
export const setupTestEnvironment = () => {
  // Clean up any existing mocks
  jest.clearAllMocks()
  
  // Reset localStorage
  localStorage.clear()
  sessionStorage.clear()
}

export const teardownTestEnvironment = () => {
  // Cleanup after tests
  jest.restoreAllMocks()
}
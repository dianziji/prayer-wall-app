import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Setup dayjs with timezone support for testing
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

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

// Skip location mock - it causes issues with JSDOM

// Mock fetch globally
global.fetch = jest.fn()

// Mock window.confirm
global.confirm = jest.fn(() => true)

// Mock window.alert  
global.alert = jest.fn()

// Mock Notification API
global.Notification = {
  requestPermission: jest.fn(() => Promise.resolve('granted')),
  permission: 'granted'
}

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

// Setup MSW (disabled temporarily due to environment issues)
// import { beforeAll, afterEach, afterAll } from '@jest/globals'
// import { server } from './tests/mocks/server'

// beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
// afterEach(() => server.resetHandlers())
// afterAll(() => server.close())
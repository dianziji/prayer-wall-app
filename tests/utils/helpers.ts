import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextRequest } from 'next/server'

// Enhanced render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add any global providers here
  // e.g., initialState?: Partial<AppState>
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    // Add any providers here (Context, Redux, etc.)
    return React.createElement(React.Fragment, null, children)
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...options })
  }
}

// Helper to create properly typed NextRequest for API tests
export const createMockNextRequest = (url: string, options: RequestInit = {}) => {
  const request = new Request(url, options)
  return request as NextRequest
}

// Helper to create mock response for API tests
export const createMockResponse = (data: any, status = 200) => ({
  json: () => Promise.resolve(data),
  status,
  ok: status < 400,
  statusText: status < 400 ? 'OK' : 'Error'
})

// Helper for testing async operations
export const waitForAsyncOperation = (ms = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Helper for testing error boundaries
export const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return React.createElement('div', null, 'No error')
}

// Helper for mocking console methods
export const mockConsole = () => {
  const originalConsole = { ...console }
  const mockedMethods = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }

  // Replace console methods
  Object.assign(console, mockedMethods)

  return {
    ...mockedMethods,
    restore: () => {
      Object.assign(console, originalConsole)
    }
  }
}

// Helper for testing with fake timers
export const withFakeTimers = (testFn: () => void | Promise<void>) => {
  return async () => {
    jest.useFakeTimers()
    try {
      await testFn()
    } finally {
      jest.useRealTimers()
    }
  }
}

// Helper for testing component props
export const getComponentProps = <T extends Record<string, any>>(
  defaultProps: T,
  overrides: Partial<T> = {}
): T => {
  return { ...defaultProps, ...overrides }
}

// Helper for testing form submissions
export const fillAndSubmitForm = async (
  user: ReturnType<typeof userEvent.setup>,
  formData: Record<string, string>,
  submitButtonSelector = '[type="submit"]'
) => {
  // Fill form fields
  for (const [name, value] of Object.entries(formData)) {
    const field = document.querySelector(`[name="${name}"]`) as HTMLElement
    if (field) {
      await user.clear(field)
      await user.type(field, value)
    }
  }

  // Submit form
  const submitButton = document.querySelector(submitButtonSelector) as HTMLElement
  if (submitButton) {
    await user.click(submitButton)
  }
}

// Helper for testing accessibility
export const getAccessibilityHelpers = () => ({
  getByRole: (role: string, options?: any) => 
    document.querySelector(`[role="${role}"]`),
  getByLabelText: (text: string) => 
    document.querySelector(`[aria-label="${text}"]`),
  getByTestId: (testId: string) => 
    document.querySelector(`[data-testid="${testId}"]`)
})

// Helper for testing responsive behavior
export const testResponsiveBreakpoints = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1200, height: 800 }
}

// Helper for creating mock intersection observer
export const createMockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })
  
  window.IntersectionObserver = mockIntersectionObserver
  return mockIntersectionObserver
}

// Helper for testing localStorage
export const createLocalStorageTestHelpers = () => {
  let store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    getStore: () => ({ ...store })
  }
}
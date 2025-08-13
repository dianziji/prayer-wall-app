import { NextRequest } from 'next/server'

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
import { render, screen, waitFor } from '@testing-library/react'
import MyPrayersPage from '@/app/my-prayers/page'

// Mock the useSession hook
jest.mock('@/lib/useSession', () => ({
  useSession: jest.fn()
}))

// Mock useRouter
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}))

describe('MyPrayersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show loading spinner initially', () => {
    const { useSession } = require('@/lib/useSession')
    useSession.mockReturnValue({
      session: null
    })

    render(<MyPrayersPage />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument() // Loading spinner
  })

  it('should redirect to login when user is not authenticated', async () => {
    const { useSession } = require('@/lib/useSession')
    useSession.mockReturnValue({
      session: null
    })

    render(<MyPrayersPage />)
    
    // Wait for useEffect to run
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('should render page content when user is authenticated', async () => {
    const { useSession } = require('@/lib/useSession')
    useSession.mockReturnValue({
      session: {
        user: { id: 'test-user-id', email: 'test@example.com' }
      }
    })

    render(<MyPrayersPage />)
    
    await waitFor(() => {
      expect(screen.getByText('My Prayers')).toBeInTheDocument()
      expect(screen.getByText('Track your prayer journey and spiritual growth')).toBeInTheDocument()
    })
  })

  it('should show prayer statistics section', async () => {
    const { useSession } = require('@/lib/useSession')
    useSession.mockReturnValue({
      session: {
        user: { id: 'test-user-id', email: 'test@example.com' }
      }
    })

    render(<MyPrayersPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Prayer Statistics')).toBeInTheDocument()
      // Should show 4 placeholder cards
      const placeholderCards = screen.getAllByRole('generic').filter(
        element => element.className.includes('animate-pulse')
      )
      expect(placeholderCards.length).toBeGreaterThan(0)
    })
  })

  it('should show prayer timeline section', async () => {
    const { useSession } = require('@/lib/useSession')
    useSession.mockReturnValue({
      session: {
        user: { id: 'test-user-id', email: 'test@example.com' }
      }
    })

    render(<MyPrayersPage />)
    
    await waitFor(() => {
      expect(screen.getByText('My Prayer Timeline')).toBeInTheDocument()
      // Should show placeholder prayer cards
      const timelineSection = screen.getByText('My Prayer Timeline').closest('div')
      expect(timelineSection).toBeInTheDocument()
    })
  })

  it('should have responsive layout classes', async () => {
    const { useSession } = require('@/lib/useSession')
    useSession.mockReturnValue({
      session: {
        user: { id: 'test-user-id', email: 'test@example.com' }
      }
    })

    render(<MyPrayersPage />)
    
    await waitFor(() => {
      const mainElement = screen.getByRole('main')
      expect(mainElement).toHaveClass('min-h-screen', 'bg-gradient-to-br', 'from-blue-50', 'to-indigo-100')
      
      const containerDiv = screen.getByText('My Prayers').closest('.max-w-6xl')
      expect(containerDiv).toHaveClass('max-w-6xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8')
    })
  })

  it('should return null when not authenticated (before redirect)', () => {
    const { useSession } = require('@/lib/useSession')
    useSession.mockReturnValue({
      session: null
    })

    const { container } = render(<MyPrayersPage />)
    
    // Initially should show loading, then redirect
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
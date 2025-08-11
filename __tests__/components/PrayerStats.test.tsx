import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import PrayerStats from '@/components/user/PrayerStats'
import { SWRConfig } from 'swr'

// Mock the Supabase browser client
jest.mock('@/lib/supabase-browser', () => ({
  createBrowserSupabase: jest.fn(() => ({
    auth: {
      getSession: jest.fn()
    }
  }))
}))

// Mock fetch globally
global.fetch = jest.fn()

const mockStats = {
  totalPrayers: 12,
  totalLikes: 47,
  totalComments: 23,
  mostActiveWeek: 'Nov 12-18',
  recentActivity: [0, 2, 5, 5]
}

function renderWithSWR(component: React.ReactElement) {
  return render(
    <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
      {component}
    </SWRConfig>
  )
}

describe('PrayerStats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show loading state initially', () => {
    const { createBrowserSupabase } = require('@/lib/supabase-browser')
    createBrowserSupabase.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { access_token: 'test-token' } }
        })
      }
    })

    // Mock fetch to never resolve to test loading state
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

    renderWithSWR(<PrayerStats />)
    
    expect(screen.getByText('Prayer Statistics')).toBeInTheDocument()
    // Should show 4 loading cards
    const loadingCards = screen.getAllByText('', { selector: '.animate-pulse' })
    expect(loadingCards.length).toBeGreaterThan(0)
  })

  it('should display stats when data is loaded', async () => {
    const { createBrowserSupabase } = require('@/lib/supabase-browser')
    createBrowserSupabase.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { access_token: 'test-token' } }
        })
      }
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStats)
    })

    renderWithSWR(<PrayerStats />)
    
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument() // Total prayers
      expect(screen.getByText('47')).toBeInTheDocument() // Total likes
      expect(screen.getByText('23')).toBeInTheDocument() // Total comments
      expect(screen.getByText('Nov 12-18')).toBeInTheDocument() // Most active week
    })

    expect(screen.getByText('Total Prayers')).toBeInTheDocument()
    expect(screen.getByText('Total Likes')).toBeInTheDocument()
    expect(screen.getByText('Total Comments')).toBeInTheDocument()
    expect(screen.getByText('Most Active Week')).toBeInTheDocument()
  })

  it('should show error state when authentication fails', async () => {
    const { createBrowserSupabase } = require('@/lib/supabase-browser')
    createBrowserSupabase.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: null }
        })
      }
    })

    renderWithSWR(<PrayerStats />)
    
    await waitFor(() => {
      expect(screen.getByText('Please login to view your statistics')).toBeInTheDocument()
      expect(screen.getByText('⚠️')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })

  it('should show error state when API request fails', async () => {
    const { createBrowserSupabase } = require('@/lib/supabase-browser')
    createBrowserSupabase.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { access_token: 'test-token' } }
        })
      }
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500
    })

    renderWithSWR(<PrayerStats />)
    
    await waitFor(() => {
      expect(screen.getByText('HTTP error! status: 500')).toBeInTheDocument()
      expect(screen.getByText('⚠️')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })

  it('should have refresh button that works', async () => {
    const { createBrowserSupabase } = require('@/lib/supabase-browser')
    createBrowserSupabase.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { access_token: 'test-token' } }
        })
      }
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStats)
    })

    renderWithSWR(<PrayerStats />)
    
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument()
    })

    // Find and click refresh button
    const refreshButton = screen.getByTitle('Refresh statistics')
    expect(refreshButton).toBeInTheDocument()
    
    fireEvent.click(refreshButton)
    
    // Verify fetch was called again
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should display correct stat card icons', async () => {
    const { createBrowserSupabase } = require('@/lib/supabase-browser')
    createBrowserSupabase.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { access_token: 'test-token' } }
        })
      }
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStats)
    })

    renderWithSWR(<PrayerStats />)
    
    await waitFor(() => {
      expect(screen.getByText('🙏')).toBeInTheDocument() // Prayers icon
      expect(screen.getByText('💙')).toBeInTheDocument() // Likes icon
      expect(screen.getByText('💬')).toBeInTheDocument() // Comments icon
      expect(screen.getByText('📈')).toBeInTheDocument() // Activity icon
    })
  })
})
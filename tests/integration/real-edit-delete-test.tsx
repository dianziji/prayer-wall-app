/**
 * Real Integration Test for Prayer Edit/Delete
 * This test simulates the complete user flow with minimal mocking
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WeeklyWallClient } from '@/components/weekly-wall-client'

// Create a minimal session mock that can be controlled
const createMockUseSession = (userId: string | null = null) => {
  return {
    session: userId ? {
      user: { id: userId }
    } : null,
    profile: { username: 'Test User' }
  }
}

// Mock the session hook at module level
let mockSession = createMockUseSession(null)
jest.mock('@/lib/useSession', () => ({
  useSession: () => mockSession
}))

// Helper to create a mock prayer with specific owner
const createMockPrayer = (id: string, userId: string | null, content: string) => ({
  id,
  content,
  author_name: 'Test Author',
  user_id: userId,
  created_at: new Date().toISOString(),
  like_count: 5,
  liked_by_me: false,
  color: null,
  font_style: null,
  guest_id: null,
  metadata: null,
  wall_id: null,
})

describe('Real Edit/Delete Integration Test', () => {
  // Mock fetch globally for each test
  const mockFetch = jest.fn()
  
  beforeEach(() => {
    global.fetch = mockFetch
    mockFetch.mockClear()
    // Reset session to logged out
    mockSession = createMockUseSession(null)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('User Not Logged In', () => {
    it('should not show edit/delete buttons when user is not logged in', async () => {
      const mockPrayers = [
        createMockPrayer('prayer-1', 'user-123', 'Some prayer content')
      ]
      
      // Mock API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPrayers)
      })

      render(
        <WeeklyWallClient weekStart="2025-08-10" readOnly={false} />
      )

      // Wait for prayers to load
      await waitFor(() => {
        expect(screen.getByText('Some prayer content')).toBeInTheDocument()
      })

      // Should not find any three-dot menu buttons (they only appear for owners)
      const buttons = screen.getAllByRole('button')
      const hasActionMenu = buttons.some(button => {
        const svg = button.querySelector('svg')
        return svg?.getAttribute('viewBox') === '0 0 20 20'
      })
      
      expect(hasActionMenu).toBe(false)
    })
  })

  describe('User Logged In - Own Prayer', () => {
    beforeEach(() => {
      // Set up logged-in user
      mockSession = createMockUseSession('user-123')
    })

    it('should show edit/delete buttons for own prayer', async () => {
      const mockPrayers = [
        createMockPrayer('prayer-1', 'user-123', 'My prayer content') // Same user
      ]
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPrayers)
      })

      render(
        <WeeklyWallClient weekStart="2025-08-10" readOnly={false} />
      )

      await waitFor(() => {
        expect(screen.getByText('My prayer content')).toBeInTheDocument()
      })

      // Should find the three-dot menu button for own prayer
      const buttons = screen.getAllByRole('button')
      const actionMenuButton = buttons.find(button => {
        const svg = button.querySelector('svg')
        return svg?.getAttribute('viewBox') === '0 0 20 20'
      })
      
      expect(actionMenuButton).toBeDefined()
    })

    it('should open edit/delete menu when action button is clicked', async () => {
      const user = userEvent.setup()
      const mockPrayers = [
        createMockPrayer('prayer-1', 'user-123', 'My prayer content')
      ]
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPrayers)
      })

      render(
        <WeeklyWallClient weekStart="2025-08-10" readOnly={false} />
      )

      await waitFor(() => {
        expect(screen.getByText('My prayer content')).toBeInTheDocument()
      })

      // Find and click the action menu button
      const buttons = screen.getAllByRole('button')
      const actionMenuButton = buttons.find(button => {
        const svg = button.querySelector('svg')
        return svg?.getAttribute('viewBox') === '0 0 20 20'
      })
      
      if (actionMenuButton) {
        await user.click(actionMenuButton)
        
        // Should show edit and delete options
        await waitFor(() => {
          expect(screen.getByText('Edit')).toBeInTheDocument()
          expect(screen.getByText('Delete')).toBeInTheDocument()
        })
      } else {
        throw new Error('Action menu button not found')
      }
    })

    it('should open edit modal when Edit is clicked', async () => {
      const user = userEvent.setup()
      const mockPrayers = [
        createMockPrayer('prayer-1', 'user-123', 'My prayer content')
      ]
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPrayers)
      })

      render(
        <WeeklyWallClient weekStart="2025-08-10" readOnly={false} />
      )

      await waitFor(() => {
        expect(screen.getByText('My prayer content')).toBeInTheDocument()
      })

      // Click action menu button
      const buttons = screen.getAllByRole('button')
      const actionMenuButton = buttons.find(button => {
        const svg = button.querySelector('svg')
        return svg?.getAttribute('viewBox') === '0 0 20 20'
      })
      
      if (actionMenuButton) {
        await user.click(actionMenuButton)
        
        // Click Edit button
        const editButton = await screen.findByText('Edit')
        await user.click(editButton)
        
        // Should show edit modal
        await waitFor(() => {
          expect(screen.getByText('Edit Prayer')).toBeInTheDocument()
          expect(screen.getByDisplayValue('My prayer content')).toBeInTheDocument()
        })
      }
    })
  })

  describe('User Logged In - Other User\'s Prayer', () => {
    beforeEach(() => {
      mockSession = createMockUseSession('user-123')
    })

    it('should not show edit/delete buttons for other user\'s prayer', async () => {
      const mockPrayers = [
        createMockPrayer('prayer-1', 'user-456', 'Other user prayer') // Different user
      ]
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPrayers)
      })

      render(
        <WeeklyWallClient weekStart="2025-08-10" readOnly={false} />
      )

      await waitFor(() => {
        expect(screen.getByText('Other user prayer')).toBeInTheDocument()
      })

      // Should not find action menu button for other user's prayer
      const buttons = screen.getAllByRole('button')
      const hasActionMenu = buttons.some(button => {
        const svg = button.querySelector('svg')
        return svg?.getAttribute('viewBox') === '0 0 20 20'
      })
      
      expect(hasActionMenu).toBe(false)
    })
  })

  describe('Read Only Mode', () => {
    beforeEach(() => {
      mockSession = createMockUseSession('user-123')
    })

    it('should not show edit/delete buttons in read-only mode', async () => {
      const mockPrayers = [
        createMockPrayer('prayer-1', 'user-123', 'My old prayer') // Own prayer but read-only
      ]
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPrayers)
      })

      render(
        <WeeklyWallClient weekStart="2025-08-03" readOnly={true} />
      )

      await waitFor(() => {
        expect(screen.getByText('My old prayer')).toBeInTheDocument()
        expect(screen.getByText('Viewing a past week (read-only)')).toBeInTheDocument()
      })

      // Should not show any edit/delete functionality in read-only mode
      const buttons = screen.getAllByRole('button')
      const hasActionMenu = buttons.some(button => {
        const svg = button.querySelector('svg')
        return svg?.getAttribute('viewBox') === '0 0 20 20'
      })
      
      expect(hasActionMenu).toBe(false)
    })
  })

  describe('Error Scenarios', () => {
    beforeEach(() => {
      mockSession = createMockUseSession('user-123')
    })

    it('should handle prayer fetch errors gracefully', async () => {
      // Mock fetch failure
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <WeeklyWallClient weekStart="2025-08-10" readOnly={false} />
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to load prayers.')).toBeInTheDocument()
      })
    })
  })
})
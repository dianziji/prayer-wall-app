import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Header from '@/components/header'

// Mock dependencies
jest.mock('@/lib/useSession', () => ({
  useSession: jest.fn()
}))

jest.mock('@/lib/supabase-browser', () => ({
  createBrowserSupabase: jest.fn()
}))

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

const { useSession } = require('@/lib/useSession')
const { createBrowserSupabase } = require('@/lib/supabase-browser')

// Mock Supabase client
const mockSupabase = {
  auth: {
    signOut: jest.fn().mockResolvedValue({})
  }
}

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: jest.fn()
  },
  writable: true
})

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createBrowserSupabase.mockReturnValue(mockSupabase)
  })

  describe('Basic Rendering', () => {
    it('should render header with title and navigation links', () => {
      useSession.mockReturnValue({ session: null, profile: null })
      
      render(<Header />)
      
      expect(screen.getByText('Prayer Wall')).toBeInTheDocument()
      expect(screen.getByText('QR Code')).toBeInTheDocument()
      expect(screen.getByText('Archive')).toBeInTheDocument()
    })

    it('should render correct navigation links', () => {
      useSession.mockReturnValue({ session: null, profile: null })
      
      render(<Header />)
      
      const prayerWallLink = screen.getByText('Prayer Wall').closest('a')
      const qrLink = screen.getByText('QR Code').closest('a')
      const archiveLink = screen.getByText('Archive').closest('a')
      
      expect(prayerWallLink).toHaveAttribute('href', '/')
      expect(qrLink).toHaveAttribute('href', '/qr')
      expect(archiveLink).toHaveAttribute('href', '/archive')
    })
  })

  describe('Unauthenticated State', () => {
    it('should not show user menu when not logged in', () => {
      useSession.mockReturnValue({ session: null, profile: null })
      
      render(<Header />)
      
      expect(screen.queryByText('Profile')).not.toBeInTheDocument()
      expect(screen.queryByText('My Prayers')).not.toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('Authenticated State', () => {
    it('should show user menu button when logged in', () => {
      useSession.mockReturnValue({
        session: { user: { email: 'test@example.com' } },
        profile: { username: 'Test User', avatar_url: null }
      })
      
      render(<Header />)
      
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should show user email when no username is available', () => {
      useSession.mockReturnValue({
        session: { user: { email: 'test@example.com' } },
        profile: { username: null, avatar_url: null }
      })
      
      render(<Header />)
      
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('should show user avatar when available', () => {
      useSession.mockReturnValue({
        session: { user: { email: 'test@example.com' } },
        profile: { 
          username: 'Test User', 
          avatar_url: 'https://example.com/avatar.jpg' 
        }
      })
      
      render(<Header />)
      
      const avatar = screen.getByAltText('avatar')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('should show default avatar when no avatar URL is provided', () => {
      useSession.mockReturnValue({
        session: { user: { email: 'test@example.com' } },
        profile: { username: 'Test User', avatar_url: null }
      })
      
      render(<Header />)
      
      expect(screen.getByText('T')).toBeInTheDocument() // First letter of username
    })

    it('should show U as default when no username or email', () => {
      useSession.mockReturnValue({
        session: { user: {} },
        profile: { username: null, avatar_url: null }
      })
      
      render(<Header />)
      
      expect(screen.getByText('U')).toBeInTheDocument()
    })
  })

  describe('User Menu Interaction', () => {
    beforeEach(() => {
      useSession.mockReturnValue({
        session: { user: { email: 'test@example.com' } },
        profile: { username: 'Test User', avatar_url: null }
      })
    })

    it('should toggle menu when user button is clicked', async () => {
      const user = userEvent.setup()
      render(<Header />)
      
      const menuButton = screen.getByRole('button')
      
      // Menu should be closed initially
      expect(screen.queryByText('Profile')).not.toBeInTheDocument()
      
      // Click to open menu
      await user.click(menuButton)
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('My Prayers')).toBeInTheDocument()
      expect(screen.getByText('🔔 Reminders')).toBeInTheDocument()
      
      // Click again to close menu
      await user.click(menuButton)
      expect(screen.queryByText('Profile')).not.toBeInTheDocument()
    })

    it('should rotate chevron icon when menu is open', async () => {
      const user = userEvent.setup()
      render(<Header />)
      
      const menuButton = screen.getByRole('button')
      const chevron = menuButton.querySelector('svg')
      
      // Initially not rotated
      expect(chevron).not.toHaveClass('rotate-180')
      
      // Open menu - should rotate
      await user.click(menuButton)
      expect(chevron).toHaveClass('rotate-180')
      
      // Close menu - should not be rotated
      await user.click(menuButton)
      expect(chevron).not.toHaveClass('rotate-180')
    })

    it('should show all menu items when menu is open', async () => {
      const user = userEvent.setup()
      render(<Header />)
      
      await user.click(screen.getByRole('button'))
      
      const profileLink = screen.getByText('Profile').closest('a')
      const myPrayersLink = screen.getByText('My Prayers').closest('a')
      const remindersLink = screen.getByText('🔔 Reminders').closest('a')
      
      expect(profileLink).toHaveAttribute('href', '/account')
      expect(myPrayersLink).toHaveAttribute('href', '/my-prayers')
      expect(remindersLink).toHaveAttribute('href', '/reminders')
    })

    it('should close menu when clicking on menu items', async () => {
      const user = userEvent.setup()
      render(<Header />)
      
      // Open menu
      await user.click(screen.getByRole('button'))
      expect(screen.getByText('Profile')).toBeInTheDocument()
      
      // Click on menu item
      await user.click(screen.getByText('Profile'))
      
      // Menu should be closed
      await waitFor(() => {
        expect(screen.queryByText('Profile')).not.toBeInTheDocument()
      })
    })
  })

  describe('Logout Functionality', () => {
    beforeEach(() => {
      useSession.mockReturnValue({
        session: { user: { email: 'test@example.com' } },
        profile: { username: 'Test User', avatar_url: null }
      })
    })

    it('should call signOut and reload page when logout is clicked', async () => {
      const user = userEvent.setup()
      render(<Header />)
      
      // Open menu
      await user.click(screen.getByRole('button'))
      
      // Find and click logout button
      const logoutButton = screen.getByText('Logout')
      await user.click(logoutButton)
      
      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      })
      
      // Should reload page after signOut
      await waitFor(() => {
        expect(window.location.reload).toHaveBeenCalled()
      })
    })

    it('should close menu after logout', async () => {
      const user = userEvent.setup()
      render(<Header />)
      
      // Open menu
      await user.click(screen.getByRole('button'))
      expect(screen.getByText('Logout')).toBeInTheDocument()
      
      // Click logout
      await user.click(screen.getByText('Logout'))
      
      // Menu should be closed
      await waitFor(() => {
        expect(screen.queryByText('Logout')).not.toBeInTheDocument()
      })
    })

    it('should handle signOut errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock signOut to reject
      mockSupabase.auth.signOut.mockRejectedValueOnce(new Error('Network error'))
      
      render(<Header />)
      
      // Open menu and click logout
      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('Logout'))
      
      // Should still reload page even if signOut fails
      await waitFor(() => {
        expect(window.location.reload).toHaveBeenCalled()
      })
    })
  })

  describe('Responsive Design', () => {
    it('should show username on larger screens but hide on mobile', () => {
      useSession.mockReturnValue({
        session: { user: { email: 'test@example.com' } },
        profile: { username: 'Test User', avatar_url: null }
      })
      
      render(<Header />)
      
      const usernameElement = screen.getByText('Test User')
      expect(usernameElement).toHaveClass('hidden', 'sm:inline')
    })

    it('should apply responsive classes for touch targets', () => {
      useSession.mockReturnValue({
        session: { user: { email: 'test@example.com' } },
        profile: { username: 'Test User', avatar_url: null }
      })
      
      render(<Header />)
      
      const menuButton = screen.getByRole('button')
      expect(menuButton).toHaveClass('touch-manipulation')
      expect(menuButton).toHaveClass('min-h-[44px]')
    })
  })
})
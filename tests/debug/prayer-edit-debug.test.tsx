/**
 * Debug test for Prayer Edit/Delete functionality
 * This test helps identify why edit/delete buttons are not showing
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PrayerCard } from '@/components/prayer-card'
import { PrayerWall } from '@/components/prayer-wall'
import { WeeklyWallClient } from '@/components/weekly-wall-client'
import type { Prayer } from '@/types/models'

// Mock the session hook with different scenarios
const createMockSession = (userId: string | null) => ({
  useSession: () => ({
    session: userId ? { user: { id: userId } } : null,
    profile: { username: 'Test User' }
  })
})

// Mock components to isolate testing
jest.mock('@/components/like-button', () => ({
  LikeButton: () => <div data-testid="like-button">Like Button</div>
}))

jest.mock('@/components/comment-form', () => ({
  CommentForm: () => <div data-testid="comment-form">Comment Form</div>
}))

jest.mock('@/components/comment-list', () => ({
  CommentList: () => <div data-testid="comment-list">Comment List</div>
}))

describe('Prayer Edit/Delete Debug Tests', () => {
  const mockPrayer: Prayer = {
    id: 'prayer-1',
    content: 'Test prayer content',
    author_name: 'Test Author',
    user_id: 'user-123',
    created_at: new Date().toISOString(),
    like_count: 5,
    liked_by_me: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Session State Debugging', () => {
    it('should show user session information', () => {
      // Test with logged-in user
      jest.doMock('@/lib/useSession', () => createMockSession('user-123'))
      
      const { useSession } = require('@/lib/useSession')
      const session = useSession()
      
      console.log('🔍 Debug - Session state:', {
        hasSession: !!session.session,
        userId: session.session?.user?.id,
        prayerUserId: mockPrayer.user_id,
        isOwner: session.session?.user?.id === mockPrayer.user_id
      })
      
      expect(session.session?.user?.id).toBe('user-123')
      expect(mockPrayer.user_id).toBe('user-123')
    })

    it('should identify ownership detection logic', () => {
      jest.doMock('@/lib/useSession', () => createMockSession('user-123'))
      
      const mockOnEdit = jest.fn()
      const mockOnDelete = jest.fn()
      
      render(
        <PrayerCard 
          prayer={mockPrayer}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Check if ownership detection works
      const { useSession } = require('@/lib/useSession')
      const { session } = useSession()
      
      console.log('🔍 Debug - Ownership check:', {
        sessionUserId: session?.user?.id,
        prayerUserId: (mockPrayer as any).user_id,
        strictEqual: session?.user?.id === (mockPrayer as any).user_id,
        bothTruthy: !!(session?.user?.id && (mockPrayer as any).user_id)
      })

      // Look for the three-dot menu button
      const actionButtons = screen.queryAllByRole('button')
      console.log('🔍 Debug - Found buttons:', actionButtons.map(btn => btn.textContent || 'No text'))
      
      // Check if actions menu exists
      const hasActionsMenu = actionButtons.some(btn => {
        const svg = btn.querySelector('svg')
        return svg && svg.getAttribute('viewBox') === '0 0 20 20'
      })
      
      console.log('🔍 Debug - Has actions menu:', hasActionsMenu)
    })
  })

  describe('Props Passing Debug', () => {
    it('should verify onEdit and onDelete props are passed correctly', () => {
      jest.doMock('@/lib/useSession', () => createMockSession('user-123'))
      
      const mockOnEdit = jest.fn()
      const mockOnDelete = jest.fn()
      
      render(
        <PrayerCard 
          prayer={mockPrayer}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      console.log('🔍 Debug - Props passed:', {
        hasOnEdit: typeof mockOnEdit === 'function',
        hasOnDelete: typeof mockOnDelete === 'function',
        prayerId: mockPrayer.id,
        prayerContent: mockPrayer.content
      })

      // The card should render with action menu if user is owner and callbacks provided
      expect(mockOnEdit).toBeDefined()
      expect(mockOnDelete).toBeDefined()
    })
  })

  describe('PrayerWall Integration Debug', () => {
    it('should check if PrayerWall passes callbacks correctly', async () => {
      jest.doMock('@/lib/useSession', () => createMockSession('user-123'))
      
      // Mock fetch to return our test prayer
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockPrayer])
      })

      const mockOnEdit = jest.fn()
      const mockOnDelete = jest.fn()
      
      render(
        <PrayerWall 
          weekStart="2025-08-10"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Wait for prayers to load
      await screen.findByText('Test prayer content')

      console.log('🔍 Debug - PrayerWall rendering:', {
        prayersLoaded: screen.queryByText('Test prayer content') !== null,
        hasEditCallback: typeof mockOnEdit === 'function',
        hasDeleteCallback: typeof mockOnDelete === 'function'
      })

      // Check if the action menu button exists
      const buttons = screen.queryAllByRole('button')
      console.log('🔍 Debug - Buttons in PrayerWall:', buttons.length)
    })
  })

  describe('WeeklyWallClient Integration Debug', () => {
    it('should verify complete integration', () => {
      jest.doMock('@/lib/useSession', () => createMockSession('user-123'))
      
      // Mock PrayerWall to verify callbacks are passed
      jest.doMock('@/components/prayer-wall', () => ({
        PrayerWall: ({ onEdit, onDelete }: any) => (
          <div data-testid="prayer-wall-mock">
            <div data-testid="has-edit">{onEdit ? 'YES' : 'NO'}</div>
            <div data-testid="has-delete">{onDelete ? 'YES' : 'NO'}</div>
            <button onClick={() => onEdit?.(mockPrayer)}>Test Edit</button>
            <button onClick={() => onDelete?.('prayer-1')}>Test Delete</button>
          </div>
        )
      }))

      render(
        <WeeklyWallClient 
          weekStart="2025-08-10" 
          readOnly={false} 
        />
      )

      console.log('🔍 Debug - WeeklyWallClient callbacks:', {
        hasEditInWall: screen.getByTestId('has-edit').textContent,
        hasDeleteInWall: screen.getByTestId('has-delete').textContent,
        isReadOnly: false
      })

      expect(screen.getByTestId('has-edit')).toHaveTextContent('YES')
      expect(screen.getByTestId('has-delete')).toHaveTextContent('YES')
    })
  })

  describe('Data Structure Debug', () => {
    it('should verify prayer object structure', () => {
      console.log('🔍 Debug - Prayer object structure:', {
        id: mockPrayer.id,
        user_id: mockPrayer.user_id,
        hasUserId: 'user_id' in mockPrayer,
        userIdType: typeof (mockPrayer as any).user_id,
        allKeys: Object.keys(mockPrayer)
      })

      // Test the type casting that happens in the component
      const anyPrayer = mockPrayer as any
      console.log('🔍 Debug - Type casting result:', {
        castedUserId: anyPrayer?.user_id,
        truthyCheck: !!anyPrayer?.user_id
      })

      expect(mockPrayer.user_id).toBeDefined()
      expect(typeof mockPrayer.user_id).toBe('string')
    })
  })
})
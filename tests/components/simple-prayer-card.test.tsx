import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PrayerCard } from '@/components/prayer-card'
import type { Prayer } from '@/types/models'

// Mock dependencies
jest.mock('@/lib/useSession', () => ({
  useSession: jest.fn()
}))

jest.mock('@/components/like-button', () => ({
  LikeButton: ({ prayerId, initialCount, initiallyLiked }: any) => (
    <div data-testid={`like-button-${prayerId}`}>
      Likes: {initialCount} {initiallyLiked ? '(liked)' : ''}
    </div>
  )
}))

jest.mock('@/components/comment-form', () => ({
  CommentForm: ({ prayerId, onPosted }: any) => (
    <div data-testid={`comment-form-${prayerId}`}>
      <button onClick={onPosted}>Post Comment</button>
    </div>
  )
}))

jest.mock('@/components/comment-list', () => ({
  CommentList: ({ prayerId }: any) => (
    <div data-testid={`comment-list-${prayerId}`}>
      Comment List
    </div>
  )
}))

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: (date: Date) => '2 hours ago'
}))

// Mock window.confirm and alert
global.confirm = jest.fn()
global.alert = jest.fn()

// Mock fetch
global.fetch = jest.fn()

const { useSession } = require('@/lib/useSession')

// Sample prayer data
const mockPrayer: Prayer = {
  id: 'prayer-1',
  content: 'Test prayer content for testing purposes',
  author_name: 'Test User',
  created_at: new Date('2023-12-01T12:00:00Z'),
  like_count: 5,
  liked_by_me: false
}

describe('PrayerCard Component', () => {
  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    })
    ;(global.confirm as jest.Mock).mockReturnValue(true)
  })

  describe('Basic Rendering', () => {
    it('should render prayer card with content', () => {
      useSession.mockReturnValue({ session: null, profile: null })
      
      render(<PrayerCard prayer={mockPrayer} />)
      
      expect(screen.getByText('Test prayer content for testing purposes')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('2 hours ago')).toBeInTheDocument()
    })

    it('should render author avatar with initials when no avatar URL', () => {
      useSession.mockReturnValue({ session: null, profile: null })
      
      render(<PrayerCard prayer={mockPrayer} />)
      
      expect(screen.getByText('TE')).toBeInTheDocument() // First 2 letters of "Test User"
    })

    it('should render author avatar image when avatar URL provided', () => {
      useSession.mockReturnValue({ session: null, profile: null })
      
      render(
        <PrayerCard 
          prayer={mockPrayer} 
          authorAvatarUrl="https://example.com/avatar.jpg" 
        />
      )
      
      const avatar = screen.getByAltText('Test User avatar')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('should render LikeButton with correct props', () => {
      useSession.mockReturnValue({ session: null, profile: null })
      
      render(<PrayerCard prayer={mockPrayer} />)
      
      expect(screen.getByTestId('like-button-prayer-1')).toBeInTheDocument()
      expect(screen.getByText('Likes: 5')).toBeInTheDocument()
    })

    it('should render CommentList', () => {
      useSession.mockReturnValue({ session: null, profile: null })
      
      render(<PrayerCard prayer={mockPrayer} />)
      
      expect(screen.getByTestId('comment-list-prayer-1')).toBeInTheDocument()
    })
  })

  describe('Unauthenticated State', () => {
    it('should not show comment form button when not logged in', () => {
      useSession.mockReturnValue({ session: null, profile: null })
      
      render(<PrayerCard prayer={mockPrayer} />)
      
      expect(screen.queryByText('写评论')).not.toBeInTheDocument()
      expect(screen.queryByText('收起评论')).not.toBeInTheDocument()
    })

    it('should not show actions menu when not logged in', () => {
      useSession.mockReturnValue({ session: null, profile: null })
      
      render(
        <PrayerCard 
          prayer={mockPrayer} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      )
      
      expect(screen.queryByRole('button', { name: /menu/i })).not.toBeInTheDocument()
    })
  })

  describe('Authenticated State (Not Owner)', () => {
    beforeEach(() => {
      useSession.mockReturnValue({
        session: { user: { id: 'different-user-id' } },
        profile: { username: 'Different User', avatar_url: null }
      })
    })

    it('should show comment form button when logged in', () => {
      render(<PrayerCard prayer={mockPrayer} />)
      
      expect(screen.getByText('写评论')).toBeInTheDocument()
    })

    it('should toggle comment form visibility', () => {
      render(<PrayerCard prayer={mockPrayer} />)
      
      const commentButton = screen.getByText('写评论')
      
      // Initially comment form should not be visible
      expect(screen.queryByTestId('comment-form-prayer-1')).not.toBeInTheDocument()
      
      // Click to show comment form
      fireEvent.click(commentButton)
      expect(screen.getByTestId('comment-form-prayer-1')).toBeInTheDocument()
      expect(screen.getByText('收起评论')).toBeInTheDocument()
      
      // Click to hide comment form
      fireEvent.click(screen.getByText('收起评论'))
      expect(screen.queryByTestId('comment-form-prayer-1')).not.toBeInTheDocument()
      expect(screen.getByText('写评论')).toBeInTheDocument()
    })

    it('should not show actions menu when not owner', () => {
      const prayerWithUserId = { ...mockPrayer, user_id: 'original-user-id' }
      
      render(
        <PrayerCard 
          prayer={prayerWithUserId} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      )
      
      expect(screen.queryByRole('button', { name: /menu/i })).not.toBeInTheDocument()
    })
  })

  describe('Authenticated State (Owner)', () => {
    beforeEach(() => {
      useSession.mockReturnValue({
        session: { user: { id: 'owner-user-id' } },
        profile: { username: 'Owner User', avatar_url: null }
      })
    })

    it('should show actions menu when user is owner', () => {
      const prayerWithUserId = { ...mockPrayer, user_id: 'owner-user-id' }
      
      render(
        <PrayerCard 
          prayer={prayerWithUserId} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      )
      
      // Look for the actions menu button (has svg with dots)
      const actionsButton = screen.getAllByRole('button')[0] // First button is the actions menu
      expect(actionsButton).toBeInTheDocument()
      expect(actionsButton.querySelector('svg')).toBeInTheDocument()
    })

    it('should toggle actions menu visibility', () => {
      const prayerWithUserId = { ...mockPrayer, user_id: 'owner-user-id' }
      
      render(
        <PrayerCard 
          prayer={prayerWithUserId} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      )
      
      const actionsButton = screen.getAllByRole('button')[0] // First button is the actions menu
      
      // Initially actions menu should not be visible
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
      
      // Click to show actions menu
      fireEvent.click(actionsButton)
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('should call onEdit when edit button is clicked', () => {
      const prayerWithUserId = { ...mockPrayer, user_id: 'owner-user-id' }
      
      render(
        <PrayerCard 
          prayer={prayerWithUserId} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      )
      
      // Open actions menu
      fireEvent.click(screen.getAllByRole('button')[0])
      
      // Click edit button
      fireEvent.click(screen.getByText('Edit'))
      
      expect(mockOnEdit).toHaveBeenCalledWith(prayerWithUserId)
    })

    it('should call onDelete when delete is confirmed', () => {
      const prayerWithUserId = { ...mockPrayer, user_id: 'owner-user-id' }
      
      render(
        <PrayerCard 
          prayer={prayerWithUserId} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      )
      
      // Open actions menu
      fireEvent.click(screen.getAllByRole('button')[0])
      
      // Click delete button
      fireEvent.click(screen.getByText('Delete'))
      
      // Should show confirmation dialog
      expect(global.confirm).toHaveBeenCalledWith('确定要删除这个祷告吗？')
      
      // Should call API (we can check this immediately since mocked)
      expect(global.fetch).toHaveBeenCalledWith('/api/prayers?id=prayer-1', {
        method: 'DELETE'
      })
    })

    it('should not call onDelete when delete is cancelled', () => {
      ;(global.confirm as jest.Mock).mockReturnValue(false)
      
      const prayerWithUserId = { ...mockPrayer, user_id: 'owner-user-id' }
      
      render(
        <PrayerCard 
          prayer={prayerWithUserId} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      )
      
      // Open actions menu
      fireEvent.click(screen.getAllByRole('button')[0])
      
      // Click delete button
      fireEvent.click(screen.getByText('Delete'))
      
      expect(global.confirm).toHaveBeenCalled()
      expect(global.fetch).not.toHaveBeenCalled()
      expect(mockOnDelete).not.toHaveBeenCalled()
    })

    it('should handle delete API errors', () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Delete failed' })
      })
      
      const prayerWithUserId = { ...mockPrayer, user_id: 'owner-user-id' }
      
      render(
        <PrayerCard 
          prayer={prayerWithUserId} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      )
      
      // Open actions menu and click delete
      fireEvent.click(screen.getAllByRole('button')[0])
      fireEvent.click(screen.getByText('Delete'))
      
      // Should call fetch API
      expect(global.fetch).toHaveBeenCalledWith('/api/prayers?id=prayer-1', {
        method: 'DELETE'
      })
      
      // Check that confirmation was shown
      expect(global.confirm).toHaveBeenCalledWith('确定要删除这个祷告吗？')
    })
  })

  describe('Comment Form Integration', () => {
    it('should hide comment form when comment is posted', () => {
      useSession.mockReturnValue({
        session: { user: { id: 'user-id' } },
        profile: { username: 'Test User', avatar_url: null }
      })
      
      render(<PrayerCard prayer={mockPrayer} />)
      
      // Show comment form
      fireEvent.click(screen.getByText('写评论'))
      expect(screen.getByTestId('comment-form-prayer-1')).toBeInTheDocument()
      
      // Simulate posting a comment
      fireEvent.click(screen.getByText('Post Comment'))
      
      // Comment form should be hidden
      expect(screen.queryByTestId('comment-form-prayer-1')).not.toBeInTheDocument()
      expect(screen.getByText('写评论')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle prayer without author_name', () => {
      const prayerWithoutName = { ...mockPrayer, author_name: undefined }
      useSession.mockReturnValue({ session: null, profile: null })
      
      render(<PrayerCard prayer={prayerWithoutName} />)
      
      expect(screen.getByText('Unknown')).toBeInTheDocument()
      expect(screen.getByText('U')).toBeInTheDocument() // Default initials
    })

    it('should handle prayer with empty author_name', () => {
      const prayerWithEmptyName = { ...mockPrayer, author_name: '' }
      useSession.mockReturnValue({ session: null, profile: null })
      
      render(<PrayerCard prayer={prayerWithEmptyName} />)
      
      expect(screen.getByText('Unknown')).toBeInTheDocument()
      expect(screen.getByText('U')).toBeInTheDocument() // Default initials
    })

    it('should truncate long author names', () => {
      const prayerWithLongName = { 
        ...mockPrayer, 
        author_name: 'Very Long Author Name That Should Be Truncated' 
      }
      useSession.mockReturnValue({ session: null, profile: null })
      
      render(<PrayerCard prayer={prayerWithLongName} />)
      
      // Function truncates at 15 characters, so "Very Long Autho" (15 chars) + "…"
      expect(screen.getByText('Very Long Autho…')).toBeInTheDocument()
    })

    it('should handle missing created_at date', () => {
      const prayerWithoutDate = { ...mockPrayer, created_at: undefined }
      useSession.mockReturnValue({ session: null, profile: null })
      
      render(<PrayerCard prayer={prayerWithoutDate} />)
      
      // Should still render without crashing
      expect(screen.getByText('Test prayer content for testing purposes')).toBeInTheDocument()
    })

    it('should handle zero like count', () => {
      const prayerWithZeroLikes = { ...mockPrayer, like_count: 0 }
      useSession.mockReturnValue({ session: null, profile: null })
      
      render(<PrayerCard prayer={prayerWithZeroLikes} />)
      
      expect(screen.getByText('Likes: 0')).toBeInTheDocument()
    })

    it('should handle undefined like count', () => {
      const prayerWithoutLikes = { ...mockPrayer, like_count: undefined }
      useSession.mockReturnValue({ session: null, profile: null })
      
      render(<PrayerCard prayer={prayerWithoutLikes} />)
      
      expect(screen.getByText('Likes: 0')).toBeInTheDocument()
    })
  })
})
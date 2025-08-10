import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PrayerCard } from '@/components/prayer-card'
import type { Prayer } from '@/types/models'

// Mock the session hook
const mockSession = {
  user: { id: 'user-1' }
}

jest.mock('@/lib/useSession', () => ({
  useSession: () => ({
    session: mockSession,
    profile: { username: 'Test User' }
  })
}))

// Mock components that we don't need to test
jest.mock('@/components/like-button', () => ({
  LikeButton: ({ prayerId, initialCount, initiallyLiked }: any) => (
    <div data-testid="like-button">
      Likes: {initialCount}
    </div>
  )
}))

jest.mock('@/components/comment-form', () => ({
  CommentForm: ({ prayerId, onPosted }: any) => (
    <div data-testid="comment-form">Comment Form</div>
  )
}))

jest.mock('@/components/comment-list', () => ({
  CommentList: ({ prayerId }: any) => (
    <div data-testid="comment-list">Comments</div>
  )
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('PrayerCard', () => {
  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()

  const mockPrayer: Prayer = {
    id: 'prayer-1',
    content: 'Test prayer content',
    author_name: 'Test Author',
    user_id: 'user-1', // Same as session user
    created_at: new Date().toISOString(),
    like_count: 5,
    liked_by_me: false,
  }

  const otherUserPrayer: Prayer = {
    ...mockPrayer,
    id: 'prayer-2',
    user_id: 'user-2', // Different from session user
  }

  beforeEach(() => {
    mockFetch.mockClear()
    mockOnEdit.mockClear()
    mockOnDelete.mockClear()
    jest.clearAllMocks()
  })

  it('should render prayer content and basic info', () => {
    render(
      <PrayerCard prayer={mockPrayer} />
    )

    expect(screen.getByText('Test prayer content')).toBeInTheDocument()
    expect(screen.getByText('Test Author')).toBeInTheDocument()
    expect(screen.getByText('Likes: 5')).toBeInTheDocument()
  })

  it('should show edit/delete menu for prayer owner', async () => {
    const user = userEvent.setup()
    
    render(
      <PrayerCard 
        prayer={mockPrayer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    // Click the actions menu button (three dots)
    const menuButton = screen.getByRole('button')
    await user.click(menuButton)

    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('should not show edit/delete menu for other users prayers', () => {
    render(
      <PrayerCard 
        prayer={otherUserPrayer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    // Should not show menu button for other user's prayers
    const menuButtons = screen.queryAllByRole('button')
    // Only comment button should be present, no menu button
    expect(menuButtons).toHaveLength(1)
  })

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <PrayerCard 
        prayer={mockPrayer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const menuButton = screen.getByRole('button')
    await user.click(menuButton)

    const editButton = screen.getByText('Edit')
    await user.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledWith(mockPrayer)
  })

  it('should call onDelete when delete is confirmed', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })
    
    render(
      <PrayerCard 
        prayer={mockPrayer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const menuButton = screen.getByRole('button')
    await user.click(menuButton)

    const deleteButton = screen.getByText('Delete')
    await user.click(deleteButton)

    // Confirm deletion (mocked confirm returns true)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/prayers?id=prayer-1', {
        method: 'DELETE'
      })
    })

    expect(mockOnDelete).toHaveBeenCalledWith('prayer-1')
  })

  it('should handle delete API error gracefully', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Not authorized' })
    })
    
    render(
      <PrayerCard 
        prayer={mockPrayer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const menuButton = screen.getByRole('button')
    await user.click(menuButton)

    const deleteButton = screen.getByText('Delete')
    await user.click(deleteButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    // onDelete should not be called on error
    expect(mockOnDelete).not.toHaveBeenCalled()
  })

  it('should show loading state during deletion', async () => {
    const user = userEvent.setup()
    
    // Mock slow fetch
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => {
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        }), 100)
      })
    )
    
    render(
      <PrayerCard 
        prayer={mockPrayer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const menuButton = screen.getByRole('button')
    await user.click(menuButton)

    const deleteButton = screen.getByText('Delete')
    await user.click(deleteButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Deleting...')).toBeInTheDocument()
    })
  })

  it('should show comment form when comment button is clicked', async () => {
    const user = userEvent.setup()
    
    render(<PrayerCard prayer={mockPrayer} />)

    const commentButton = screen.getByText('写评论')
    await user.click(commentButton)

    expect(screen.getByTestId('comment-form')).toBeInTheDocument()
    expect(screen.getByText('收起评论')).toBeInTheDocument()
  })

  it('should display author avatar when provided', () => {
    render(
      <PrayerCard 
        prayer={mockPrayer}
        authorAvatarUrl="https://example.com/avatar.jpg"
      />
    )

    const avatar = screen.getByAltText('Test Author avatar')
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('should display initials when no avatar provided', () => {
    render(
      <PrayerCard prayer={mockPrayer} />
    )

    // Should show initials "TE" for "Test Author"
    expect(screen.getByText('TE')).toBeInTheDocument()
  })
})
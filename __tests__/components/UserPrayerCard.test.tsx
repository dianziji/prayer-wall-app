import { render, screen, fireEvent } from '@testing-library/react'
import UserPrayerCard from '@/components/user/UserPrayerCard'

const mockPrayer = {
  id: 'prayer-123',
  content: 'Please pray for healing and strength during this difficult time. I know God is with me.',
  author_name: 'Test User',
  user_id: 'user-123',
  created_at: '2023-12-01T12:00:00Z',
  like_count: 5,
  liked_by_me: true,
  comment_count: 3
}

const longContentPrayer = {
  ...mockPrayer,
  content: 'This is a very long prayer content that should be truncated and show a "Show more" button. '.repeat(10)
}

describe('UserPrayerCard', () => {
  it('should display prayer content and basic info', () => {
    render(<UserPrayerCard prayer={mockPrayer} />)
    
    expect(screen.getByText(/Please pray for healing/)).toBeInTheDocument()
    expect(screen.getByText('by Test User')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // Like count
    expect(screen.getByText('3')).toBeInTheDocument() // Comment count
  })

  it('should show time ago and formatted date', () => {
    render(<UserPrayerCard prayer={mockPrayer} />)
    
    // Should show relative time
    expect(screen.getByText(/ago/)).toBeInTheDocument()
    
    // Should show formatted date
    expect(screen.getByText(/Dec 1, 2023/)).toBeInTheDocument()
  })

  it('should show expand/collapse for long content', () => {
    render(<UserPrayerCard prayer={longContentPrayer} />)
    
    // Should show "Show more" button for long content
    const showMoreButton = screen.getByText('Show more')
    expect(showMoreButton).toBeInTheDocument()
    
    // Click to expand
    fireEvent.click(showMoreButton)
    
    // Should now show "Show less" button
    expect(screen.getByText('Show less')).toBeInTheDocument()
  })

  it('should show engagement stats correctly', () => {
    render(<UserPrayerCard prayer={mockPrayer} showEngagement={true} />)
    
    // Should show liked heart (blue) since liked_by_me is true
    expect(screen.getByText('💙')).toBeInTheDocument()
    
    // Should show like and comment counts with proper pluralization
    expect(screen.getByText('likes')).toBeInTheDocument() // 5 likes (plural)
    expect(screen.getByText('comments')).toBeInTheDocument() // 3 comments (plural)
  })

  it('should show actions menu when clicked', () => {
    const mockEdit = jest.fn()
    const mockDelete = jest.fn()
    
    render(
      <UserPrayerCard 
        prayer={mockPrayer} 
        onEdit={mockEdit}
        onDelete={mockDelete}
      />
    )
    
    // Click the actions button (⋯)
    const actionsButton = screen.getByLabelText('More actions')
    fireEvent.click(actionsButton)
    
    // Should show edit and delete options
    expect(screen.getByText('✏️ Edit')).toBeInTheDocument()
    expect(screen.getByText('🗑️ Delete')).toBeInTheDocument()
  })

  it('should call edit callback when edit is clicked', () => {
    const mockEdit = jest.fn()
    
    render(<UserPrayerCard prayer={mockPrayer} onEdit={mockEdit} />)
    
    // Open actions menu and click edit
    fireEvent.click(screen.getByLabelText('More actions'))
    fireEvent.click(screen.getByText('✏️ Edit'))
    
    expect(mockEdit).toHaveBeenCalledWith(mockPrayer)
  })

  it('should show confirmation dialog for delete', () => {
    const mockDelete = jest.fn()
    global.confirm = jest.fn(() => true)
    
    render(<UserPrayerCard prayer={mockPrayer} onDelete={mockDelete} />)
    
    // Open actions menu and click delete
    fireEvent.click(screen.getByLabelText('More actions'))
    fireEvent.click(screen.getByText('🗑️ Delete'))
    
    expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this prayer?')
    expect(mockDelete).toHaveBeenCalledWith('prayer-123')
  })

  it('should not call delete if user cancels confirmation', () => {
    const mockDelete = jest.fn()
    global.confirm = jest.fn(() => false)
    
    render(<UserPrayerCard prayer={mockPrayer} onDelete={mockDelete} />)
    
    // Open actions menu and click delete
    fireEvent.click(screen.getByLabelText('More actions'))
    fireEvent.click(screen.getByText('🗑️ Delete'))
    
    expect(global.confirm).toHaveBeenCalled()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('should handle prayer without engagement stats', () => {
    const prayerWithoutEngagement = {
      ...mockPrayer,
      like_count: null,
      liked_by_me: null,
      comment_count: undefined
    }
    
    render(<UserPrayerCard prayer={prayerWithoutEngagement} />)
    
    // Should show 0 for null/undefined stats
    expect(screen.getAllByText('0')).toHaveLength(2) // 0 likes, 0 comments
    expect(screen.getByText('🤍')).toBeInTheDocument() // Unliked heart
  })

  it('should handle prayer without created_at', () => {
    const prayerWithoutDate = {
      ...mockPrayer,
      created_at: null
    }
    
    render(<UserPrayerCard prayer={prayerWithoutDate} />)
    
    expect(screen.getByText('Unknown time')).toBeInTheDocument()
  })
})
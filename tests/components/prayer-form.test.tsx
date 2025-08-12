import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PrayerForm } from '@/components/prayer-form'

// Mock the session hook
jest.mock('@/lib/useSession', () => ({
  useSession: jest.fn(() => ({
    profile: { username: 'Test User' }
  }))
}))

const { useSession } = require('@/lib/useSession')

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe.skip('PrayerForm', () => {
  const mockOnPost = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    mockFetch.mockClear()
    mockOnPost.mockClear()
    mockOnCancel.mockClear()
    
    // Reset to default session mock
    useSession.mockReturnValue({
      profile: { username: 'Test User' }
    })
  })

  describe('Create Mode', () => {
    it('should render create form with empty fields', () => {
      render(
        <PrayerForm 
          onPost={mockOnPost}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByPlaceholderText('Your name (optional)')).toHaveValue('Test User')
      expect(screen.getByPlaceholderText('Write your prayer here...')).toHaveValue('')
      expect(screen.getByText('Post Prayer')).toBeInTheDocument()
    })

    it('should submit new prayer successfully', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      render(
        <PrayerForm 
          onPost={mockOnPost}
          onCancel={mockOnCancel}
        />
      )

      const contentInput = screen.getByPlaceholderText('Write your prayer here...')
      await user.type(contentInput, 'Test prayer content')

      const submitButton = screen.getByText('Post Prayer')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/prayers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author_name: 'Test User',
            content: 'Test prayer content'
          })
        })
      }, { timeout: 8000 })

      expect(mockOnPost).toHaveBeenCalled()
    })

    it('should show validation error for empty content', async () => {
      const user = userEvent.setup()
      
      render(
        <PrayerForm 
          onPost={mockOnPost}
          onCancel={mockOnCancel}
        />
      )

      const submitButton = screen.getByText('Post Prayer')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('内容不能为空')).toBeInTheDocument()
      }, { timeout: 3000 })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should show validation error for content too long', async () => {
      const user = userEvent.setup()
      const longContent = 'a'.repeat(501)
      
      render(
        <PrayerForm 
          onPost={mockOnPost}
          onCancel={mockOnCancel}
        />
      )

      const contentInput = screen.getByPlaceholderText('Write your prayer here...')
      await user.type(contentInput, longContent)

      const submitButton = screen.getByText('Post Prayer')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('内容不能超过 500 字符')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Edit Mode', () => {
    const initialValues = {
      content: 'Existing prayer content',
      author_name: 'Existing Author'
    }

    beforeEach(() => {
      // For edit mode, don't override with current user profile
      useSession.mockReturnValue({
        profile: { username: null }
      })
    })

    it('should render edit form with initial values', () => {
      render(
        <PrayerForm 
          mode="edit"
          prayerId="prayer-1"
          initialValues={initialValues}
          onPost={mockOnPost}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByDisplayValue('Existing Author')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Existing prayer content')).toBeInTheDocument()
      expect(screen.getByText('Update Prayer')).toBeInTheDocument()
    })

    it('should submit updated prayer successfully', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      render(
        <PrayerForm 
          mode="edit"
          prayerId="prayer-1"
          initialValues={initialValues}
          onPost={mockOnPost}
          onCancel={mockOnCancel}
        />
      )

      const contentInput = screen.getByDisplayValue('Existing prayer content')
      await user.clear(contentInput)
      await user.type(contentInput, 'Updated prayer content')

      const submitButton = screen.getByText('Update Prayer')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/prayers?id=prayer-1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author_name: 'Existing Author',
            content: 'Updated prayer content'
          })
        })
      }, { timeout: 8000 })

      expect(mockOnPost).toHaveBeenCalled()
    })

    it('should handle API error gracefully', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Not authorized' })
      })

      render(
        <PrayerForm 
          mode="edit"
          prayerId="prayer-1"
          initialValues={initialValues}
          onPost={mockOnPost}
          onCancel={mockOnCancel}
        />
      )

      const submitButton = screen.getByText('Update Prayer')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Not authorized')).toBeInTheDocument()
      }, { timeout: 5000 })

      expect(mockOnPost).not.toHaveBeenCalled()
    })
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <PrayerForm 
        onPost={mockOnPost}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    
    // Mock fetch to resolve slowly
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => {
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        }), 100)
      })
    )

    render(
      <PrayerForm 
        onPost={mockOnPost}
        onCancel={mockOnCancel}
      />
    )

    const contentInput = screen.getByPlaceholderText('Write your prayer here...')
    await user.type(contentInput, 'Test prayer')

    const submitButton = screen.getByText('Post Prayer')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Posting...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    }, { timeout: 3000 })
  })
})
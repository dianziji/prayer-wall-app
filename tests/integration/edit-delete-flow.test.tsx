import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WeeklyWallClient } from '@/components/weekly-wall-client'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

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

// Mock prayer wall to focus on edit/delete flow
jest.mock('@/components/prayer-wall', () => ({
  PrayerWall: ({ onEdit, onDelete, refreshKey }: any) => {
    const mockPrayer = {
      id: 'prayer-1',
      content: 'Test prayer content',
      author_name: 'Test Author',
      user_id: 'user-1',
      created_at: new Date().toISOString(),
      like_count: 5,
      liked_by_me: false,
    }

    return (
      <div data-testid="prayer-wall">
        <div data-testid="prayer-item">
          <p>{mockPrayer.content}</p>
          <button 
            onClick={() => onEdit?.(mockPrayer)}
            data-testid="edit-prayer"
          >
            Edit
          </button>
          <button 
            onClick={() => onDelete?.()}
            data-testid="delete-prayer"
          >
            Delete
          </button>
        </div>
        <div data-testid="refresh-key">{refreshKey}</div>
      </div>
    )
  }
}))

describe('Edit/Delete Prayer Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Edit Prayer Flow', () => {
    it('should open edit modal when edit button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <WeeklyWallClient 
          weekStart="2025-08-10" 
          readOnly={false} 
        />
      )

      const editButton = screen.getByTestId('edit-prayer')
      await user.click(editButton)

      // Should show edit modal
      await waitFor(() => {
        expect(screen.getByText('Edit Prayer')).toBeInTheDocument()
      })

      // Should show form with initial values
      expect(screen.getByDisplayValue('Test prayer content')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Author')).toBeInTheDocument()
      expect(screen.getByText('Update Prayer')).toBeInTheDocument()
    })

    it('should successfully update prayer content', async () => {
      const user = userEvent.setup()
      
      // Mock successful PATCH response
      server.use(
        http.patch('/api/prayers', () => {
          return HttpResponse.json({ success: true })
        })
      )

      render(
        <WeeklyWallClient 
          weekStart="2025-08-10" 
          readOnly={false} 
        />
      )

      // Open edit modal
      const editButton = screen.getByTestId('edit-prayer')
      await user.click(editButton)

      // Update content
      const contentField = screen.getByDisplayValue('Test prayer content')
      await user.clear(contentField)
      await user.type(contentField, 'Updated prayer content')

      // Submit update
      const updateButton = screen.getByText('Update Prayer')
      await user.click(updateButton)

      // Modal should close and data should refresh
      await waitFor(() => {
        expect(screen.queryByText('Edit Prayer')).not.toBeInTheDocument()
      })

      // Verify refresh happened (refreshKey should increment)
      const refreshKey = screen.getByTestId('refresh-key')
      expect(refreshKey.textContent).toBe('1')
    })

    it('should handle edit API error gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock error response
      server.use(
        http.patch('/api/prayers', () => {
          return HttpResponse.json(
            { error: 'Not authorized' },
            { status: 403 }
          )
        })
      )

      render(
        <WeeklyWallClient 
          weekStart="2025-08-10" 
          readOnly={false} 
        />
      )

      // Open edit modal
      const editButton = screen.getByTestId('edit-prayer')
      await user.click(editButton)

      // Submit update
      const updateButton = screen.getByText('Update Prayer')
      await user.click(updateButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Not authorized')).toBeInTheDocument()
      })

      // Modal should still be open
      expect(screen.getByText('Edit Prayer')).toBeInTheDocument()
    })

    it('should close edit modal when cancel is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <WeeklyWallClient 
          weekStart="2025-08-10" 
          readOnly={false} 
        />
      )

      // Open edit modal
      const editButton = screen.getByTestId('edit-prayer')
      await user.click(editButton)

      expect(screen.getByText('Edit Prayer')).toBeInTheDocument()

      // Click cancel
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText('Edit Prayer')).not.toBeInTheDocument()
      })
    })
  })

  describe('Delete Prayer Flow', () => {
    it('should refresh data when delete is successful', async () => {
      const user = userEvent.setup()
      
      render(
        <WeeklyWallClient 
          weekStart="2025-08-10" 
          readOnly={false} 
        />
      )

      // Initial refresh key should be 0
      expect(screen.getByTestId('refresh-key').textContent).toBe('0')

      // Delete prayer
      const deleteButton = screen.getByTestId('delete-prayer')
      await user.click(deleteButton)

      // Should refresh data (increment refresh key)
      await waitFor(() => {
        expect(screen.getByTestId('refresh-key').textContent).toBe('1')
      })
    })
  })

  describe('Read-Only Mode', () => {
    it('should not show edit/delete options in read-only mode', () => {
      render(
        <WeeklyWallClient 
          weekStart="2025-08-03" 
          readOnly={true} 
        />
      )

      expect(screen.getByText('Viewing a past week (read-only)')).toBeInTheDocument()
      
      // Should not show Submit a Prayer button
      expect(screen.queryByText('Submit a Prayer')).not.toBeInTheDocument()
    })
  })

  describe('Modal State Management', () => {
    it('should handle switching between create and edit modes', async () => {
      const user = userEvent.setup()
      
      render(
        <WeeklyWallClient 
          weekStart="2025-08-10" 
          readOnly={false} 
        />
      )

      // First, open create modal
      const createButton = screen.getByText('Submit a Prayer')
      await user.click(createButton)

      expect(screen.getByText('Share a Prayer')).toBeInTheDocument()
      expect(screen.getByText('Post Prayer')).toBeInTheDocument()

      // Close create modal
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('Share a Prayer')).not.toBeInTheDocument()
      })

      // Now open edit modal
      const editButton = screen.getByTestId('edit-prayer')
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Prayer')).toBeInTheDocument()
        expect(screen.getByText('Update Prayer')).toBeInTheDocument()
      })
    })

    it('should properly reset form state between modal opens', async () => {
      const user = userEvent.setup()
      
      render(
        <WeeklyWallClient 
          weekStart="2025-08-10" 
          readOnly={false} 
        />
      )

      // Open and close create modal
      await user.click(screen.getByText('Submit a Prayer'))
      await user.click(screen.getByText('Cancel'))

      // Open edit modal
      await user.click(screen.getByTestId('edit-prayer'))

      await waitFor(() => {
        // Should show edit-specific content, not create content
        expect(screen.getByDisplayValue('Test prayer content')).toBeInTheDocument()
        expect(screen.getByText('Edit Prayer')).toBeInTheDocument()
      })
    })
  })
})
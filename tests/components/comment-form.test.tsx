import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { CommentForm } from '@/components/comment-form'

// Mock dependencies
jest.mock('@/lib/useSession', () => ({
  useSession: jest.fn()
}))

jest.mock('@/lib/supabase-browser', () => ({
  createBrowserSupabase: jest.fn()
}))

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn()
  }
}))

jest.mock('swr', () => ({
  mutate: jest.fn()
}))

jest.mock('@emoji-mart/data', () => ({}))
jest.mock('@emoji-mart/react', () => {
  return function MockPicker({ onEmojiSelect }: any) {
    return (
      <div data-testid="emoji-picker">
        <button 
          onClick={() => onEmojiSelect({ native: '😀' })}
          data-testid="emoji-button"
        >
          Add Emoji
        </button>
      </div>
    )
  }
})

const { useSession } = require('@/lib/useSession')
const { createBrowserSupabase } = require('@/lib/supabase-browser')
const { toast } = require('sonner')
const { mutate } = require('swr')

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnValue({
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'comment-1',
            content: 'Test comment',
            user_id: 'user-1',
            created_at: '2023-12-01T12:00:00Z',
            prayer_id: 'prayer-1'
          },
          error: null
        })
      })
    })
  })
}

describe('CommentForm', () => {
  const mockOnPosted = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    createBrowserSupabase.mockReturnValue(mockSupabase)
  })

  describe('Rendering', () => {
    it('should render comment form with textarea and submit button', () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      expect(screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')).toBeInTheDocument()
      expect(screen.getByText('发布')).toBeInTheDocument()
      expect(screen.getByText('🙂 Emoji')).toBeInTheDocument()
      expect(screen.getByText('0/250')).toBeInTheDocument()
    })

    it('should show submit button as disabled when textarea is empty', () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const submitButton = screen.getByText('发布')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Text Input', () => {
    it('should update character count when typing', async () => {
      const user = userEvent.setup()
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      await user.type(textarea, 'Hello world')
      
      expect(screen.getByText('11/250')).toBeInTheDocument()
      expect(screen.getByText('发布')).not.toBeDisabled()
    })

    it('should disable submit when text exceeds max length', async () => {
      const user = userEvent.setup()
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      const longText = 'a'.repeat(251) // Exceeds 250 character limit
      await user.type(textarea, longText)
      
      expect(screen.getByText('发布')).toBeDisabled()
    })

    it('should disable submit when text is only whitespace', async () => {
      const user = userEvent.setup()
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      await user.type(textarea, '   ')
      
      expect(screen.getByText('发布')).toBeDisabled()
    })
  })

  describe('Emoji Picker', () => {
    it('should toggle emoji picker when emoji button is clicked', async () => {
      const user = userEvent.setup()
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const emojiButton = screen.getByText('🙂 Emoji')
      
      // Initially emoji picker should not be visible
      expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument()
      
      // Click to show emoji picker
      await user.click(emojiButton)
      expect(screen.getByTestId('emoji-picker')).toBeInTheDocument()
      
      // Click again to hide emoji picker
      await user.click(emojiButton)
      expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument()
    })

    it('should add emoji to textarea when emoji is selected', async () => {
      const user = userEvent.setup()
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      const emojiButton = screen.getByText('🙂 Emoji')
      
      // Type some text first
      await user.type(textarea, 'Hello')
      
      // Open emoji picker and select emoji
      await user.click(emojiButton)
      const addEmojiButton = screen.getByTestId('emoji-button')
      await user.click(addEmojiButton)
      
      expect(textarea).toHaveValue('Hello😀')
    })
  })

  describe('Authentication', () => {
    it('should show error when trying to submit without authentication', async () => {
      const user = userEvent.setup()
      useSession.mockReturnValue({ session: null })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      await user.type(textarea, 'Test comment')
      
      const submitButton = screen.getByText('发布')
      await user.click(submitButton)
      
      expect(toast.error).toHaveBeenCalledWith('请先登录')
    })
  })

  describe('Comment Submission', () => {
    it('should submit comment successfully', async () => {
      const user = userEvent.setup()
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      await user.type(textarea, 'Test comment')
      
      const submitButton = screen.getByText('发布')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('comments')
        expect(mockSupabase.from().insert).toHaveBeenCalledWith({
          prayer_id: 'prayer-1',
          user_id: 'user-1',
          content: 'Test comment'
        })
      })
      
      // Should clear the textarea and call onPosted
      await waitFor(() => {
        expect(textarea).toHaveValue('')
        expect(mockOnPosted).toHaveBeenCalled()
      })
    })

    it('should handle submission error', async () => {
      const user = userEvent.setup()
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      // Mock error from Supabase
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      await user.type(textarea, 'Test comment')
      
      const submitButton = screen.getByText('发布')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('发送失败')
      })
      
      // Should not clear textarea or call onPosted on error
      expect(textarea).toHaveValue('Test comment')
      expect(mockOnPosted).not.toHaveBeenCalled()
    })

    it('should trim whitespace from comment content', async () => {
      const user = userEvent.setup()
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      await user.type(textarea, '  Test comment  ')
      
      const submitButton = screen.getByText('发布')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockSupabase.from().insert).toHaveBeenCalledWith({
          prayer_id: 'prayer-1',
          user_id: 'user-1',
          content: 'Test comment'
        })
      })
    })

    it('should update SWR cache with new comment', async () => {
      const user = userEvent.setup()
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      await user.type(textarea, 'Test comment')
      
      const submitButton = screen.getByText('发布')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mutate).toHaveBeenCalledWith(
          ['comments', 'prayer-1'],
          expect.any(Function),
          { revalidate: false }
        )
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle user without profile username', async () => {
      const user = userEvent.setup()
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: null
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      await user.type(textarea, 'Test comment')
      
      const submitButton = screen.getByText('发布')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mutate).toHaveBeenCalledWith(
          ['comments', 'prayer-1'],
          expect.any(Function),
          { revalidate: false }
        )
      })
    })
  })
})
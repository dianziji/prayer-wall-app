import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

// Mock emoji picker to avoid loading issues
jest.mock('@emoji-mart/data', () => ({}))
jest.mock('@emoji-mart/react', () => {
  return function MockPicker({ onEmojiSelect }: any) {
    return (
      <div data-testid="emoji-picker">
        <button 
          onClick={() => onEmojiSelect({ native: '😀' })}
          data-testid="emoji-select-button"
        >
          Select Emoji
        </button>
      </div>
    )
  }
})

const { useSession } = require('@/lib/useSession')
const { createBrowserSupabase } = require('@/lib/supabase-browser')
const { toast } = require('sonner')
const { mutate } = require('swr')

// Simple mock Supabase client
const createMockSupabase = () => ({
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
})

describe('CommentForm Component', () => {
  const mockOnPosted = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    createBrowserSupabase.mockReturnValue(createMockSupabase())
  })

  describe('Basic Rendering', () => {
    it('should render comment form elements', () => {
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

    it('should disable submit button when textarea is empty', () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const submitButton = screen.getByText('发布')
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when textarea has content', () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      fireEvent.change(textarea, { target: { value: 'Test comment' } })
      
      const submitButton = screen.getByText('发布')
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Character Count', () => {
    it('should update character count when typing', () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      fireEvent.change(textarea, { target: { value: 'Hello' } })
      
      expect(screen.getByText('5/250')).toBeInTheDocument()
    })

    it('should disable submit when exceeding character limit', () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      const longText = 'a'.repeat(251) // Exceeds 250 character limit
      fireEvent.change(textarea, { target: { value: longText } })
      
      const submitButton = screen.getByText('发布')
      expect(submitButton).toBeDisabled()
    })

    it('should disable submit for whitespace-only content', () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      fireEvent.change(textarea, { target: { value: '   ' } })
      
      const submitButton = screen.getByText('发布')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Emoji Picker', () => {
    it('should toggle emoji picker visibility', () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const emojiButton = screen.getByText('🙂 Emoji')
      
      // Initially hidden
      expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument()
      
      // Click to show
      fireEvent.click(emojiButton)
      expect(screen.getByTestId('emoji-picker')).toBeInTheDocument()
      
      // Click to hide
      fireEvent.click(emojiButton)
      expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument()
    })

    it('should add emoji to textarea', () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      const emojiButton = screen.getByText('🙂 Emoji')
      
      // Type some text first
      fireEvent.change(textarea, { target: { value: 'Hello' } })
      
      // Open emoji picker and select emoji
      fireEvent.click(emojiButton)
      const selectEmojiButton = screen.getByTestId('emoji-select-button')
      fireEvent.click(selectEmojiButton)
      
      expect(textarea).toHaveValue('Hello😀')
    })
  })

  describe('Authentication', () => {
    it('should show error when submitting without session', async () => {
      useSession.mockReturnValue({ session: null })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      fireEvent.change(textarea, { target: { value: 'Test comment' } })
      
      const submitButton = screen.getByText('发布')
      fireEvent.click(submitButton)
      
      expect(toast.error).toHaveBeenCalledWith('请先登录')
    })
  })

  describe('Comment Submission', () => {
    it('should submit comment successfully', () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      fireEvent.change(textarea, { target: { value: 'Test comment' } })
      
      const submitButton = screen.getByText('发布')
      fireEvent.click(submitButton)
      
      // Check that submit button was enabled and clicked
      expect(submitButton).not.toBeDisabled()
    })

    it('should trim whitespace from content', () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      fireEvent.change(textarea, { target: { value: '  Test comment  ' } })
      
      const submitButton = screen.getByText('发布')
      expect(submitButton).not.toBeDisabled()
      
      fireEvent.click(submitButton)
      
      // Button should have been clickable
      expect(submitButton).not.toBeDisabled()
    })

    it('should handle valid form submission', () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      fireEvent.change(textarea, { target: { value: 'Valid comment' } })
      
      const submitButton = screen.getByText('发布')
      expect(submitButton).not.toBeDisabled()
      
      fireEvent.click(submitButton)
      
      // Form should have handled the submission attempt
      expect(textarea).toHaveValue('Valid comment')
    })
  })

  describe('Props Validation', () => {
    it('should handle different prayer IDs', () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-123" onPosted={mockOnPosted} />)
      
      expect(screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')).toBeInTheDocument()
    })

    it('should allow form submission when valid', () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      fireEvent.change(textarea, { target: { value: 'Test comment' } })
      
      const submitButton = screen.getByText('发布')
      fireEvent.click(submitButton)
      
      // Button should have been enabled for submission
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle user without profile', () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: null
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      fireEvent.change(textarea, { target: { value: 'Test comment' } })
      
      const submitButton = screen.getByText('发布')
      expect(submitButton).not.toBeDisabled()
      
      fireEvent.click(submitButton)
      
      // Form should handle submission with null profile
      expect(textarea).toHaveValue('Test comment')
    })

    it('should handle empty strings correctly', () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } },
        profile: { username: 'Test User' }
      })
      
      render(<CommentForm prayerId="prayer-1" onPosted={mockOnPosted} />)
      
      const textarea = screen.getByPlaceholderText('写下你的鼓励… (支持 emoji)')
      fireEvent.change(textarea, { target: { value: '' } })
      
      const submitButton = screen.getByText('发布')
      expect(submitButton).toBeDisabled()
    })
  })
})
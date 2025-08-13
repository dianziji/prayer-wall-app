import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LikeButton } from '@/components/like-button'

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

const { useSession } = require('@/lib/useSession')
const { createBrowserSupabase } = require('@/lib/supabase-browser')
const { toast } = require('sonner')

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })
    }),
    insert: jest.fn().mockResolvedValue({
      error: null
    }),
    delete: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null
        })
      })
    })
  })
}

describe('LikeButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createBrowserSupabase.mockReturnValue(mockSupabase)
  })

  describe('Authentication States', () => {
    it('should render with initial count and not liked state', () => {
      useSession.mockReturnValue({ session: null })
      
      render(
        <LikeButton 
          prayerId="prayer-1" 
          initialCount={5} 
          initiallyLiked={false} 
        />
      )
      
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should render with initial liked state', () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } } 
      })
      
      render(
        <LikeButton 
          prayerId="prayer-1" 
          initialCount={5} 
          initiallyLiked={true} 
        />
      )
      
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('User Interaction', () => {
    it('should show error toast when not authenticated and trying to like', async () => {
      useSession.mockReturnValue({ session: null })
      
      render(
        <LikeButton 
          prayerId="prayer-1" 
          initialCount={5} 
          initiallyLiked={false} 
        />
      )
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('请先登录')
      })
    })

    it('should toggle like when authenticated', async () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } } 
      })
      
      render(
        <LikeButton 
          prayerId="prayer-1" 
          initialCount={5} 
          initiallyLiked={false} 
        />
      )
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      // Should optimistically update the UI
      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument()
      })
      
      // Should call Supabase insert
      expect(mockSupabase.from).toHaveBeenCalledWith('likes')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        prayer_id: 'prayer-1',
        user_id: 'user-1'
      })
    })

    it('should toggle unlike when authenticated and already liked', async () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } } 
      })
      
      render(
        <LikeButton 
          prayerId="prayer-1" 
          initialCount={5} 
          initiallyLiked={true} 
        />
      )
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      // Should optimistically update the UI
      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument()
      })
      
      // Should call Supabase delete
      expect(mockSupabase.from).toHaveBeenCalledWith('likes')
      expect(mockSupabase.from().delete().eq().eq).toHaveBeenCalledWith('user_id', 'user-1')
    })
  })

  describe('Error Handling', () => {
    it('should rollback UI on like error', async () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } } 
      })
      
      // Mock error from Supabase
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          error: { message: 'Database error' }
        })
      })
      
      render(
        <LikeButton 
          prayerId="prayer-1" 
          initialCount={5} 
          initiallyLiked={false} 
        />
      )
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      // Should first optimistically show 6
      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument()
      })
      
      // Then rollback to 5 and show error
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument()
        expect(toast.error).toHaveBeenCalledWith('操作失败，请稍后再试')
      })
    })

    it('should rollback UI on unlike error', async () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } } 
      })
      
      // Mock error from Supabase
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: { message: 'Database error' }
            })
          })
        })
      })
      
      render(
        <LikeButton 
          prayerId="prayer-1" 
          initialCount={5} 
          initiallyLiked={true} 
        />
      )
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      // Should first optimistically show 4
      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument()
      })
      
      // Then rollback to 5 and show error
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument()
        expect(toast.error).toHaveBeenCalledWith('操作失败，请稍后再试')
      })
    })
  })

  describe('Loading States', () => {
    it('should disable button during API call', async () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } } 
      })
      
      // Mock slow API response
      let resolvePromise: (value: any) => void
      const slowPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue(slowPromise)
      })
      
      render(
        <LikeButton 
          prayerId="prayer-1" 
          initialCount={5} 
          initiallyLiked={false} 
        />
      )
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      // Button should be disabled during API call
      await waitFor(() => {
        expect(button).toBeDisabled()
      })
      
      // Resolve the promise
      resolvePromise!({ error: null })
      
      // Button should be enabled again
      await waitFor(() => {
        expect(button).not.toBeDisabled()
      })
    })
  })

  describe('Initialization', () => {
    it('should check initial like status when session is available', async () => {
      useSession.mockReturnValue({ 
        session: { user: { id: 'user-1' } } 
      })
      
      // Mock that user has already liked this prayer
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { prayer_id: 'prayer-1' },
                error: null
              })
            })
          })
        })
      })
      
      render(
        <LikeButton 
          prayerId="prayer-1" 
          initialCount={5} 
          initiallyLiked={false} 
        />
      )
      
      // Should query the likes table
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('likes')
      })
    })
  })
})
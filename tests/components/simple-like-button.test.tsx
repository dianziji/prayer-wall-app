import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LikeButton } from '@/components/like-button'

// Mock all dependencies to avoid complexity
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

// Simple mock Supabase that returns promises
const createMockSupabase = () => ({
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
    insert: jest.fn().mockResolvedValue({ error: null }),
    delete: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    })
  })
})

describe('LikeButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createBrowserSupabase.mockReturnValue(createMockSupabase())
  })

  describe('Basic Rendering', () => {
    it('should render with initial count', () => {
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

    it('should render heart icon', () => {
      useSession.mockReturnValue({ session: null })
      
      render(
        <LikeButton 
          prayerId="prayer-1" 
          initialCount={0} 
          initiallyLiked={false} 
        />
      )
      
      const button = screen.getByRole('button')
      const svgElement = button.querySelector('svg')
      expect(svgElement).toBeInTheDocument()
    })

    it('should show liked state when initially liked', () => {
      useSession.mockReturnValue({ session: null })
      
      render(
        <LikeButton 
          prayerId="prayer-1" 
          initialCount={1} 
          initiallyLiked={true} 
        />
      )
      
      const button = screen.getByRole('button')
      const filledHeart = button.querySelector('svg.fill-pink-500')
      expect(filledHeart).toBeInTheDocument()
    })

    it('should show unliked state when not initially liked', () => {
      useSession.mockReturnValue({ session: null })
      
      render(
        <LikeButton 
          prayerId="prayer-1" 
          initialCount={0} 
          initiallyLiked={false} 
        />
      )
      
      const button = screen.getByRole('button')
      const outlineHeart = button.querySelector('svg.stroke-gray-400')
      expect(outlineHeart).toBeInTheDocument()
    })
  })

  describe('Authentication Handling', () => {
    it('should show error when clicking without session', () => {
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
      
      expect(toast.error).toHaveBeenCalledWith('请先登录')
    })

    it('should be interactive when user is logged in', () => {
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
      expect(button).not.toBeDisabled()
      
      // Should not show error toast immediately
      expect(toast.error).not.toHaveBeenCalled()
    })
  })

  describe('Props Validation', () => {
    it('should handle different prayer IDs', () => {
      useSession.mockReturnValue({ session: null })
      
      render(
        <LikeButton 
          prayerId="prayer-1" 
          initialCount={5} 
          initiallyLiked={false} 
        />
      )
      
      expect(screen.getByText('5')).toBeInTheDocument()
    })
    
    it('should handle different initial counts', () => {
      useSession.mockReturnValue({ session: null })
      
      render(
        <LikeButton 
          prayerId="prayer-2" 
          initialCount={10} 
          initiallyLiked={true} 
        />
      )
      
      expect(screen.getByText('10')).toBeInTheDocument()
    })

    it('should handle zero initial count', () => {
      useSession.mockReturnValue({ session: null })
      
      render(
        <LikeButton 
          prayerId="prayer-1" 
          initialCount={0} 
          initiallyLiked={false} 
        />
      )
      
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle large initial counts', () => {
      useSession.mockReturnValue({ session: null })
      
      render(
        <LikeButton 
          prayerId="prayer-1" 
          initialCount={999} 
          initiallyLiked={false} 
        />
      )
      
      expect(screen.getByText('999')).toBeInTheDocument()
    })
  })

  describe('UI States', () => {
    it('should apply correct CSS classes', () => {
      useSession.mockReturnValue({ session: null })
      
      render(
        <LikeButton 
          prayerId="prayer-1" 
          initialCount={5} 
          initiallyLiked={false} 
        />
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('flex', 'items-center', 'gap-1')
    })

    it('should have proper accessibility', () => {
      useSession.mockReturnValue({ session: null })
      
      render(
        <LikeButton 
          prayerId="prayer-1" 
          initialCount={5} 
          initiallyLiked={false} 
        />
      )
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('BUTTON')
    })
  })
})
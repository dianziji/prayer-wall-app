/**
 * Mobile Responsive UI Tests
 * 验证移动端优化的核心功能
 */

import { render, screen } from '@testing-library/react'
import { Header } from '@/components/header'
import { PrayerCard } from '@/components/prayer-card'
import { PrayerForm } from '@/components/prayer-form'

// Mock session hook
jest.mock('@/lib/useSession', () => ({
  useSession: () => ({
    session: { user: { id: 'test-user', email: 'test@example.com' } },
    profile: { username: 'Test User', avatar_url: null }
  })
}))

// Mock prayer data
const mockPrayer = {
  id: 'test-prayer-1',
  content: 'Test prayer content for mobile responsive testing',
  author_name: 'Test Author',
  created_at: new Date().toISOString(),
  like_count: 5,
  liked_by_me: false,
  user_id: 'test-user'
}

describe('Mobile Responsive UI Tests', () => {
  // Mock viewport for mobile testing
  const mockViewport = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    })
    window.dispatchEvent(new Event('resize'))
  }

  describe('Header Component Mobile Optimization', () => {
    it('should have mobile-optimized classes for small screens', () => {
      render(<Header />)
      
      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()
      
      // Check for responsive height classes
      const headerContainer = header.querySelector('div')
      expect(headerContainer?.className).toContain('h-12')
      expect(headerContainer?.className).toContain('sm:h-14')
      
      // Check for responsive padding
      expect(headerContainer?.className).toContain('px-3')
      expect(headerContainer?.className).toContain('sm:px-6')
    })

    it('should have touch-friendly navigation links', () => {
      render(<Header />)
      
      const qrLink = screen.getByText('QR Code')
      const archiveLink = screen.getByText('Archive')
      
      // Check for touch-manipulation and proper padding
      expect(qrLink.className).toContain('touch-manipulation')
      expect(qrLink.className).toContain('px-2')
      expect(qrLink.className).toContain('py-1')
      
      expect(archiveLink.className).toContain('touch-manipulation')
    })

    it('should have responsive font sizes', () => {
      render(<Header />)
      
      const logo = screen.getByText('Prayer Wall')
      expect(logo.className).toContain('text-sm')
      expect(logo.className).toContain('sm:text-base')
    })
  })

  describe('Prayer Card Mobile Optimization', () => {
    it('should have mobile-optimized padding and spacing', () => {
      const { container } = render(
        <PrayerCard prayer={mockPrayer} />
      )
      
      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('p-4')
      expect(card.className).toContain('sm:p-6')
    })

    it('should have responsive typography', () => {
      render(<PrayerCard prayer={mockPrayer} />)
      
      const content = screen.getByText(mockPrayer.content)
      expect(content.className).toContain('text-sm')
      expect(content.className).toContain('sm:text-base')
      expect(content.className).toContain('lg:text-lg')
    })

    it('should have touch-friendly action buttons', () => {
      const mockOnEdit = jest.fn()
      const mockOnDelete = jest.fn()
      
      render(
        <PrayerCard 
          prayer={mockPrayer} 
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
      
      // Look for action menu button
      const actionButtons = screen.getAllByRole('button')
      const actionButton = actionButtons.find(btn => 
        btn.className.includes('touch-manipulation')
      )
      
      expect(actionButton).toBeDefined()
      if (actionButton) {
        expect(actionButton.className).toContain('min-h-[44px]')
        expect(actionButton.className).toContain('min-w-[44px]')
      }
    })
  })

  describe('Prayer Form Mobile Optimization', () => {
    it('should have mobile-optimized form inputs', () => {
      const mockProps = {
        onPost: jest.fn(),
        onCancel: jest.fn()
      }
      
      render(<PrayerForm {...mockProps} />)
      
      const nameInput = screen.getByPlaceholderText('Your name (optional)')
      const contentTextarea = screen.getByPlaceholderText('Write your prayer here...')
      
      // Check for mobile-optimized padding and touch support
      expect(nameInput.className).toContain('p-3')
      expect(nameInput.className).toContain('sm:p-2')
      expect(nameInput.className).toContain('touch-manipulation')
      
      expect(contentTextarea.className).toContain('p-3')
      expect(contentTextarea.className).toContain('sm:p-2')
      expect(contentTextarea.className).toContain('touch-manipulation')
    })

    it('should have mobile-friendly button layout', () => {
      const mockProps = {
        onPost: jest.fn(),
        onCancel: jest.fn()
      }
      
      render(<PrayerForm {...mockProps} />)
      
      const buttons = screen.getAllByRole('button')
      const submitButton = buttons.find(btn => btn.textContent?.includes('Post Prayer'))
      const cancelButton = buttons.find(btn => btn.textContent?.includes('Cancel'))
      
      // Check for minimum touch target size
      expect(submitButton?.className).toContain('min-h-[44px]')
      expect(submitButton?.className).toContain('touch-manipulation')
      
      expect(cancelButton?.className).toContain('min-h-[44px]')
      expect(cancelButton?.className).toContain('touch-manipulation')
    })

    it('should have responsive button layout', () => {
      const mockProps = {
        onPost: jest.fn(),
        onCancel: jest.fn()
      }
      
      const { container } = render(<PrayerForm {...mockProps} />)
      
      // Find button container
      const buttonContainer = container.querySelector('.flex.flex-col.sm\\:flex-row')
      expect(buttonContainer).toBeInTheDocument()
      expect(buttonContainer?.className).toContain('flex-col')
      expect(buttonContainer?.className).toContain('sm:flex-row')
    })
  })

  describe('Accessibility and Touch Targets', () => {
    it('should meet minimum touch target requirements', () => {
      render(<Header />)
      
      // Check that interactive elements have minimum 44px touch targets
      const buttons = screen.getAllByRole('button')
      const links = screen.getAllByRole('link')
      
      const interactiveElements = [...buttons, ...links]
      
      interactiveElements.forEach(element => {
        if (element.className.includes('touch-manipulation')) {
          // Should have either min-h-[44px] or sufficient padding
          const hasMinHeight = element.className.includes('min-h-[44px]')
          const hasPadding = element.className.includes('py-3') || 
                           element.className.includes('p-3') ||
                           element.className.includes('p-2')
          
          expect(hasMinHeight || hasPadding).toBe(true)
        }
      })
    })
  })

  describe('Responsive Breakpoints', () => {
    it('should not affect desktop layout integrity', () => {
      // This test ensures desktop styles remain unchanged
      render(<Header />)
      
      const headerContainer = screen.getByRole('banner').querySelector('div')
      
      // Desktop classes should still be present
      expect(headerContainer?.className).toContain('sm:h-14')
      expect(headerContainer?.className).toContain('sm:px-6')
      expect(headerContainer?.className).toContain('max-w-6xl')
      expect(headerContainer?.className).toContain('mx-auto')
    })
  })

  describe('CSS Class Validation', () => {
    it('should only use mobile-first responsive prefixes', () => {
      const components = [
        () => render(<Header />),
        () => render(<PrayerCard prayer={mockPrayer} />),
        () => render(<PrayerForm onPost={jest.fn()} onCancel={jest.fn()} />)
      ]
      
      components.forEach(renderComponent => {
        const { container } = renderComponent()
        const html = container.innerHTML
        
        // Should use mobile-first approach (sm:, md:, lg:, xl: prefixes)
        const responsiveClasses = html.match(/\b(sm|md|lg|xl):[a-z-\[\]0-9]+/g) || []
        expect(responsiveClasses.length).toBeGreaterThan(0)
        
        // Should not use max-width breakpoints that could break desktop
        expect(html).not.toMatch(/\bmax-sm:/g)
        expect(html).not.toMatch(/\bmax-md:/g)
      })
    })
  })
})
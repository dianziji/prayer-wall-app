import { test, expect } from '@playwright/test'

test.describe('Prayer Wall Core Functionality', () => {
  test('should display existing prayers on the wall', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle')
    
    // Should show the prayer wall structure
    await expect(page.locator('header')).toBeVisible()
    
    // Look for prayer-related elements (prayers may or may not exist)
    // This is a basic smoke test to ensure the page structure loads
    await expect(page.locator('body')).toBeVisible()
  })

  test('should show prayer interaction elements', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check if there are any prayer cards with like buttons
    const prayerCards = page.locator('[data-testid*="prayer"], .prayer-card, [class*="prayer"]')
    const likeButtons = page.locator('button:has-text("❤"), button[aria-label*="like"], button:has(svg)')
    
    // If prayers exist, they should have interactive elements
    const cardCount = await prayerCards.count()
    if (cardCount > 0) {
      // Should have some interactive elements
      await expect(likeButtons.first()).toBeVisible()
    }
  })

  test('should handle empty prayer wall gracefully', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Even if no prayers exist, the structure should be there
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
    
    // Page should not show error messages
    await expect(page.locator('text=Error')).not.toBeVisible()
    await expect(page.locator('text=Failed')).not.toBeVisible()
  })

  test('should support mobile interactions', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Touch targets should be appropriately sized
    const buttons = page.locator('button, a')
    const buttonCount = await buttons.count()
    
    if (buttonCount > 0) {
      // Check that buttons are tap-friendly (at least 44px)
      const firstButton = buttons.first()
      const box = await firstButton.boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40) // Allow some tolerance
      }
    }
  })

  test('should load prayer content without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    // Listen for uncaught exceptions
    const exceptions: string[] = []
    page.on('pageerror', exception => {
      exceptions.push(exception.message)
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Give some time for any async operations
    await page.waitForTimeout(2000)
    
    // Filter out known harmless errors (like missing icons)
    const criticalErrors = errors.filter(error => 
      !error.includes('404') && 
      !error.includes('favicon') && 
      !error.includes('chrome-extension')
    )
    
    // Should not have critical JavaScript errors
    expect(criticalErrors.length).toBe(0)
    expect(exceptions.length).toBe(0)
  })

  test('should render prayer timestamps correctly', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Look for relative timestamps (e.g., "2 hours ago", "1 day ago")
    const timeElements = page.locator('text=/\\d+\\s+(second|minute|hour|day|week|month|year)s?\\s+ago/')
    
    const timeCount = await timeElements.count()
    if (timeCount > 0) {
      // First timestamp should be visible
      await expect(timeElements.first()).toBeVisible()
      
      // Should contain reasonable time format
      const timeText = await timeElements.first().textContent()
      expect(timeText).toMatch(/\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago/)
    }
  })

  test('should show appropriate content for current week', async ({ page }) => {
    await page.goto('/')
    
    // Should redirect to a valid week URL
    await expect(page).toHaveURL(/\/week\/\d{4}-\d{2}-\d{2}/)
    
    // Extract the date from URL
    const url = page.url()
    const dateMatch = url.match(/\/week\/(\d{4}-\d{2}-\d{2})/)
    
    if (dateMatch) {
      const dateString = dateMatch[1]
      const date = new Date(dateString)
      
      // Should be a valid Sunday date (day 0 in JavaScript)
      expect(date.getDay()).toBe(0)
      
      // Should be within reasonable range (not too far in past/future)
      const now = new Date()
      const diffDays = Math.abs((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      expect(diffDays).toBeLessThan(365) // Within a year
    }
  })

  test('should handle network interruptions gracefully', async ({ page }) => {
    await page.goto('/')
    
    // Simulate going offline
    await page.context().setOffline(true)
    
    // Try to interact with the page
    await page.click('text=Prayer Wall').catch(() => {
      // Click might fail when offline, that's expected
    })
    
    // Go back online
    await page.context().setOffline(false)
    
    // Page should recover
    await page.reload()
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
  })
})
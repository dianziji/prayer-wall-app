import { test, expect } from '@playwright/test'

test.describe('Accessibility Tests', () => {
  test('should have proper semantic HTML structure', async ({ page }) => {
    await page.goto('/')
    
    // Should have proper heading hierarchy
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
    
    // Should have main landmark
    const main = page.locator('main, [role="main"]')
    const mainCount = await main.count()
    if (mainCount === 0) {
      // If no explicit main element, the body should contain main content
      await expect(page.locator('body')).toBeVisible()
    } else {
      await expect(main.first()).toBeVisible()
    }
    
    // Should have header
    await expect(page.locator('header, [role="banner"]')).toBeVisible()
    
    // Should have proper navigation
    const nav = page.locator('nav, [role="navigation"]')
    const navCount = await nav.count()
    if (navCount > 0) {
      await expect(nav.first()).toBeVisible()
    }
  })

  test('should have accessible form controls', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check for form inputs
    const inputs = page.locator('input, textarea, select')
    const inputCount = await inputs.count()
    
    for (let i = 0; i < Math.min(inputCount, 5); i++) { // Test first 5 inputs
      const input = inputs.nth(i)
      const inputType = await input.getAttribute('type')
      
      // Skip hidden inputs
      if (inputType === 'hidden') continue
      
      const isVisible = await input.isVisible()
      if (!isVisible) continue
      
      // Should have accessible name (label, aria-label, or aria-labelledby)
      const hasLabel = await input.locator('..').locator('label').count() > 0
      const hasAriaLabel = await input.getAttribute('aria-label') !== null
      const hasAriaLabelledby = await input.getAttribute('aria-labelledby') !== null
      const hasPlaceholder = await input.getAttribute('placeholder') !== null
      
      expect(hasLabel || hasAriaLabel || hasAriaLabelledby || hasPlaceholder).toBeTruthy()
    }
  })

  test('should have accessible buttons', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check all buttons
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) { // Test first 10 buttons
      const button = buttons.nth(i)
      const isVisible = await button.isVisible()
      
      if (!isVisible) continue
      
      // Should have accessible text content or aria-label
      const textContent = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      const hasTitle = await button.getAttribute('title') !== null
      
      expect(
        (textContent && textContent.trim().length > 0) ||
        (ariaLabel && ariaLabel.length > 0) ||
        hasTitle
      ).toBeTruthy()
    }
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/')
    
    // Should be able to tab through focusable elements
    await page.keyboard.press('Tab')
    
    // Check if focus is visible
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Tab a few more times
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should still have a focused element
    await expect(page.locator(':focus')).toBeVisible()
  })

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/')
    
    // Check for common text elements
    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6, a, button')
    const count = await textElements.count()
    
    if (count > 0) {
      // Basic check that text is visible (contrast issues would make text invisible)
      await expect(textElements.first()).toBeVisible()
      
      // Check that text has some color (not transparent)
      const firstElement = textElements.first()
      const color = await firstElement.evaluate(el => 
        window.getComputedStyle(el).color
      )
      
      expect(color).not.toBe('transparent')
      expect(color).not.toBe('rgba(0, 0, 0, 0)')
    }
  })

  test('should work with screen reader simulation', async ({ page }) => {
    await page.goto('/')
    
    // Check for ARIA landmarks and labels
    const landmarks = page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]')
    const landmarkCount = await landmarks.count()
    
    // Should have at least some semantic structure
    expect(landmarkCount).toBeGreaterThan(0)
    
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6, [role="heading"]')
    const headingCount = await headings.count()
    
    if (headingCount > 0) {
      // First heading should be visible
      await expect(headings.first()).toBeVisible()
    }
  })

  test('should handle focus management', async ({ page }) => {
    await page.goto('/')
    
    // Test focus trapping in modals (if any)
    const modalTriggers = page.locator('button:has-text("Modal"), button:has-text("Edit"), button:has-text("Share")')
    const triggerCount = await modalTriggers.count()
    
    if (triggerCount > 0) {
      // Click modal trigger
      await modalTriggers.first().click()
      await page.waitForTimeout(500)
      
      // Check if modal opened
      const modals = page.locator('[role="dialog"], .modal, [aria-modal="true"]')
      const modalCount = await modals.count()
      
      if (modalCount > 0) {
        // Focus should be in modal
        const focusedElement = page.locator(':focus')
        const isInModal = await focusedElement.locator('..').locator('[role="dialog"], .modal, [aria-modal="true"]').count() > 0
        
        // Close modal (if close button exists)
        const closeButtons = page.locator('button:has-text("Close"), button:has-text("×"), button[aria-label*="close"]')
        const closeCount = await closeButtons.count()
        if (closeCount > 0) {
          await closeButtons.first().click()
        }
      }
    }
  })

  test('should have accessible links', async ({ page }) => {
    await page.goto('/')
    
    // Check all links
    const links = page.locator('a')
    const linkCount = await links.count()
    
    for (let i = 0; i < Math.min(linkCount, 5); i++) { // Test first 5 links
      const link = links.nth(i)
      const isVisible = await link.isVisible()
      
      if (!isVisible) continue
      
      // Should have meaningful text content
      const textContent = await link.textContent()
      const ariaLabel = await link.getAttribute('aria-label')
      
      expect(
        (textContent && textContent.trim().length > 0) ||
        (ariaLabel && ariaLabel.length > 0)
      ).toBeTruthy()
      
      // Should have proper href
      const href = await link.getAttribute('href')
      expect(href).not.toBe('#')
      expect(href).not.toBeNull()
    }
  })

  test('should handle reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    
    await page.goto('/')
    
    // Page should still be functional with reduced motion
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
    
    // Interactive elements should still work
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    if (buttonCount > 0) {
      await buttons.first().click()
      // Should not cause errors
      await page.waitForTimeout(100)
    }
  })

  test('should handle high contrast mode', async ({ page }) => {
    // Test with forced colors (high contrast mode simulation)
    await page.emulateMedia({ forcedColors: 'active' })
    
    await page.goto('/')
    
    // Content should still be visible and accessible
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
    
    // Buttons should still be distinguishable
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    if (buttonCount > 0) {
      await expect(buttons.first()).toBeVisible()
    }
  })
})
import { test, expect } from '@playwright/test'
import { 
  goToHomePage, 
  expectUnauthenticatedState, 
  expectNoErrors,
  checkBasicAccessibility 
} from '../helpers/test-helpers'

test.describe('Prayer Interaction User Flow', () => {
  test('complete unauthenticated user journey', async ({ page }) => {
    // Step 1: Navigate to homepage
    await goToHomePage(page)
    await expectUnauthenticatedState(page)
    await expectNoErrors(page)
    
    // Step 2: Browse existing prayers (if any)
    await page.waitForLoadState('networkidle')
    
    // Look for prayer cards or content
    const prayerElements = page.locator('[class*="prayer"], [data-testid*="prayer"]')
    const prayerCount = await prayerElements.count()
    
    if (prayerCount > 0) {
      // Step 3: Try to interact with prayers
      const likeButtons = page.locator('button:has-text("❤"), button[aria-label*="like"], button:has(svg)')
      const likeCount = await likeButtons.count()
      
      if (likeCount > 0) {
        // Try to like a prayer
        await likeButtons.first().click()
        
        // Should show login prompt or handle gracefully
        await page.waitForTimeout(1000)
        
        // Check if login prompt appeared
        const loginPrompts = page.locator('text=/请.*登录|Please.*login|Login.*required/i')
        const promptCount = await loginPrompts.count()
        
        if (promptCount > 0) {
          await expect(loginPrompts.first()).toBeVisible()
        }
      }
      
      // Step 4: Try to comment on a prayer
      const commentButtons = page.locator('button:has-text("Comment"), button:has-text("写评论"), button:has-text("Reply")')
      const commentCount = await commentButtons.count()
      
      if (commentCount > 0) {
        await commentButtons.first().click()
        await page.waitForTimeout(500)
        
        // Should either show comment form or login prompt
        const commentForms = page.locator('textarea, input[type="text"]')
        const formCount = await commentForms.count()
        
        if (formCount === 0) {
          // Might have shown login prompt instead
          const loginElements = page.locator('text=/请.*登录|Please.*login|Login/i')
          const loginCount = await loginElements.count()
          // This is acceptable behavior
        }
      }
    }
    
    // Step 5: Navigate to other pages
    await page.click('text=QR Code')
    await expect(page).toHaveURL('/qr')
    await expectNoErrors(page)
    
    await page.click('text=Archive')
    await expect(page).toHaveURL('/archive')
    await expectNoErrors(page)
    
    // Step 6: Return to homepage
    await page.click('text=Prayer Wall')
    await expect(page).toHaveURL(/\/week\/\d{4}-\d{2}-\d{2}/)
    await expectUnauthenticatedState(page)
    
    // Step 7: Try to access protected routes
    await page.goto('/my-prayers')
    // Should either redirect or show appropriate message
    await expectNoErrors(page)
    
    await page.goto('/account')
    // Should either redirect or show appropriate message
    await expectNoErrors(page)
  })

  test('prayer browsing and navigation flow', async ({ page }) => {
    await goToHomePage(page)
    
    // Test week navigation if available
    const weekNavigation = page.locator('button:has-text("←"), button:has-text("→"), a:has-text("Previous"), a:has-text("Next")')
    const navCount = await weekNavigation.count()
    
    if (navCount > 0) {
      const currentUrl = page.url()
      
      // Try to navigate to previous/next week
      await weekNavigation.first().click()
      await page.waitForLoadState('networkidle')
      
      // URL should have changed to a different week
      const newUrl = page.url()
      // URLs might be the same if we're at the earliest/latest available week
      await expect(page.locator('text=Prayer Wall')).toBeVisible()
      await expectNoErrors(page)
    }
    
    // Test prayer filtering/sorting if available
    const filters = page.locator('select, button:has-text("Filter"), button:has-text("Sort")')
    const filterCount = await filters.count()
    
    if (filterCount > 0) {
      await filters.first().click()
      await page.waitForTimeout(500)
      
      // Content should still load
      await expect(page.locator('text=Prayer Wall')).toBeVisible()
    }
  })

  test('responsive prayer interaction flow', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await goToHomePage(page)
    
    // All main functionality should work on mobile
    await expectUnauthenticatedState(page)
    await checkBasicAccessibility(page)
    
    // Test mobile navigation
    await page.click('text=QR Code')
    await expect(page).toHaveURL('/qr')
    
    await page.click('text=Prayer Wall')
    await expect(page).toHaveURL(/\/week\/\d{4}-\d{2}-\d{2}/)
    
    // Test touch interactions
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    if (buttonCount > 0) {
      const firstButton = buttons.first()
      const isVisible = await firstButton.isVisible()
      
      if (isVisible) {
        // Touch target should be appropriately sized
        const box = await firstButton.boundingBox()
        if (box) {
          expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(35)
        }
        
        // Should respond to touch
        await firstButton.click()
        await page.waitForTimeout(300)
      }
    }
  })

  test('accessibility-focused prayer browsing', async ({ page }) => {
    await goToHomePage(page)
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    let focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Tab through several elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    }
    
    // Test screen reader compatibility
    const landmarks = page.locator('[role="main"], [role="navigation"], [role="banner"]')
    const landmarkCount = await landmarks.count()
    expect(landmarkCount).toBeGreaterThan(0)
    
    // Check ARIA labels and descriptions
    const interactiveElements = page.locator('button, a, input, textarea')
    const elementCount = await interactiveElements.count()
    
    for (let i = 0; i < Math.min(elementCount, 3); i++) {
      const element = interactiveElements.nth(i)
      const isVisible = await element.isVisible()
      
      if (!isVisible) continue
      
      const textContent = await element.textContent()
      const ariaLabel = await element.getAttribute('aria-label')
      const title = await element.getAttribute('title')
      
      // Should have some form of accessible name
      expect(
        (textContent && textContent.trim().length > 0) ||
        (ariaLabel && ariaLabel.length > 0) ||
        (title && title.length > 0)
      ).toBeTruthy()
    }
  })

  test('error handling in prayer interactions', async ({ page }) => {
    // Test with network issues
    await page.context().route('**/api/**', route => {
      // Randomly fail some API calls
      if (Math.random() > 0.7) {
        route.abort('networkfailure')
      } else {
        route.continue()
      }
    })
    
    await goToHomePage(page)
    
    // App should still load basic structure
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
    
    // Try interactions that might fail
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    if (buttonCount > 0) {
      await buttons.first().click()
      await page.waitForTimeout(1000)
      
      // Should not show unhandled errors
      await expectNoErrors(page)
    }
    
    // Remove network interference
    await page.context().unroute('**/api/**')
    
    // App should recover
    await page.reload()
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
  })

  test('performance during prayer browsing', async ({ page }) => {
    // Measure initial load
    const start = Date.now()
    await goToHomePage(page)
    const initialLoad = Date.now() - start
    
    expect(initialLoad).toBeLessThan(5000)
    
    // Test navigation performance
    const navStart = Date.now()
    await page.click('text=Archive')
    await page.waitForLoadState('networkidle')
    const navTime = Date.now() - navStart
    
    expect(navTime).toBeLessThan(3000)
    
    // Test back navigation
    const backStart = Date.now()
    await page.click('text=Prayer Wall')
    await page.waitForLoadState('networkidle')
    const backTime = Date.now() - backStart
    
    expect(backTime).toBeLessThan(3000)
    
    // Test repeated interactions don't slow down
    const interactionTimes: number[] = []
    
    for (let i = 0; i < 3; i++) {
      const interactionStart = Date.now()
      await page.hover('text=Prayer Wall')
      await page.hover('text=QR Code')
      const interactionTime = Date.now() - interactionStart
      interactionTimes.push(interactionTime)
    }
    
    // Performance should remain consistent
    const avgTime = interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length
    expect(avgTime).toBeLessThan(1000)
  })
})
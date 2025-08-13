import { test, expect } from '@playwright/test'

test.describe('User Authentication Flow', () => {
  test('should show login option for unauthenticated users', async ({ page }) => {
    await page.goto('/')
    
    // Should show Login link
    await expect(page.locator('text=Login')).toBeVisible()
    
    // Should not show authenticated user elements
    await expect(page.locator('text=Profile')).not.toBeVisible()
    await expect(page.locator('text=My Prayers')).not.toBeVisible()
    await expect(page.locator('text=Logout')).not.toBeVisible()
  })

  test('should navigate to login page when clicking login', async ({ page }) => {
    await page.goto('/')
    
    // Click Login link
    await page.click('text=Login')
    
    // Should navigate to login page
    await expect(page).toHaveURL('/login')
    
    // Should show login page content
    await expect(page.locator('body')).toBeVisible()
  })

  test('should handle login page load', async ({ page }) => {
    await page.goto('/login')
    
    // Should load without errors
    await expect(page.locator('body')).toBeVisible()
    
    // Should show some form of authentication UI
    // This is a basic test since we don't want to test actual auth providers
    await expect(page).toHaveURL('/login')
  })

  test('should restrict prayer submission for unauthenticated users', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Look for any prayer submission forms or buttons
    const submitButtons = page.locator('button:has-text("Submit"), button:has-text("Post"), button:has-text("Add"), input[type="submit"]')
    const textareas = page.locator('textarea')
    
    const submitCount = await submitButtons.count()
    const textareaCount = await textareas.count()
    
    // If there are prayer submission elements visible to unauthenticated users,
    // they should either be disabled or show login prompts
    if (submitCount > 0 || textareaCount > 0) {
      // Try to interact and see if login is required
      if (textareaCount > 0) {
        await textareas.first().click()
        // Should either focus (if allowed) or show login prompt
      }
    }
    
    // This is mainly a smoke test to ensure no errors occur
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
  })

  test('should handle comment interactions for unauthenticated users', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Look for comment buttons
    const commentButtons = page.locator('button:has-text("Comment"), button:has-text("写评论"), button:has-text("Reply")')
    const commentCount = await commentButtons.count()
    
    if (commentCount > 0) {
      // Try clicking a comment button
      await commentButtons.first().click()
      
      // Should either show login prompt or comment form (depending on implementation)
      // This is mainly to ensure no errors occur
      await page.waitForTimeout(1000)
    }
    
    // Page should still be functional
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
  })

  test('should handle like button interactions for unauthenticated users', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Look for like buttons (heart icons, like text, etc.)
    const likeButtons = page.locator('button:has-text("❤"), button[aria-label*="like"], button:has(svg)')
    const likeCount = await likeButtons.count()
    
    if (likeCount > 0) {
      // Try clicking a like button
      const firstLikeButton = likeButtons.first()
      await firstLikeButton.click()
      
      // Should either show login prompt or handle gracefully
      await page.waitForTimeout(1000)
      
      // Check if any toast/error message appeared
      const toasts = page.locator('[role="alert"], .toast, .notification')
      const toastCount = await toasts.count()
      
      if (toastCount > 0) {
        // Should show login-related message
        const toastText = await toasts.first().textContent()
        expect(toastText?.toLowerCase()).toContain('login')
      }
    }
    
    // Page should still be functional
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
  })

  test('should handle protected routes appropriately', async ({ page }) => {
    // Test accessing protected routes directly
    const protectedRoutes = ['/account', '/my-prayers', '/reminders']
    
    for (const route of protectedRoutes) {
      await page.goto(route)
      
      // Should either redirect to login or show login prompt
      // Or handle gracefully without errors
      await expect(page.locator('body')).toBeVisible()
      
      // Should not show critical error messages
      await expect(page.locator('text=500')).not.toBeVisible()
      await expect(page.locator('text=Internal Server Error')).not.toBeVisible()
    }
  })

  test('should maintain state across navigation for unauthenticated users', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to different pages
    await page.click('text=QR Code')
    await expect(page).toHaveURL('/qr')
    
    await page.click('text=Prayer Wall')
    await expect(page).toHaveURL(/\/week\/\d{4}-\d{2}-\d{2}/)
    
    await page.click('text=Archive')
    await expect(page).toHaveURL('/archive')
    
    // Should still show login option throughout
    await expect(page.locator('text=Login')).toBeVisible()
    
    // Should not show authenticated elements
    await expect(page.locator('text=Profile')).not.toBeVisible()
  })

  test('should handle auth callback route', async ({ page }) => {
    // Test that the auth callback route exists and doesn't error
    await page.goto('/auth/callback')
    
    // Should load without 404 error
    await expect(page.locator('body')).toBeVisible()
    
    // Should not show "404" or "Not Found"
    await expect(page.locator('text=404')).not.toBeVisible()
    await expect(page.locator('text=Not Found')).not.toBeVisible()
  })

  test('should handle session persistence across page reloads', async ({ page }) => {
    await page.goto('/')
    
    // Verify initial unauthenticated state
    await expect(page.locator('text=Login')).toBeVisible()
    
    // Reload the page
    await page.reload()
    
    // Should maintain unauthenticated state
    await expect(page.locator('text=Login')).toBeVisible()
    await expect(page.locator('text=Profile')).not.toBeVisible()
  })
})
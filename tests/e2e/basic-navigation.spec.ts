import { test, expect } from '@playwright/test'

test.describe('Basic Navigation and Page Loading', () => {
  test('should load the homepage and display prayer wall', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')
    
    // Should redirect to current week
    await expect(page).toHaveURL(/\/week\/\d{4}-\d{2}-\d{2}/)
    
    // Should show the main header
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
    
    // Should show navigation links
    await expect(page.locator('text=QR Code')).toBeVisible()
    await expect(page.locator('text=Archive')).toBeVisible()
  })

  test('should navigate to QR code page', async ({ page }) => {
    await page.goto('/')
    
    // Click QR Code link
    await page.click('text=QR Code')
    
    // Should be on QR page
    await expect(page).toHaveURL('/qr')
    
    // Should show QR code content (basic check)
    await expect(page.locator('body')).toContainText('QR')
  })

  test('should navigate to Archive page', async ({ page }) => {
    await page.goto('/')
    
    // Click Archive link
    await page.click('text=Archive')
    
    // Should be on Archive page
    await expect(page).toHaveURL('/archive')
    
    // Should show some archive-related content
    await expect(page.locator('body')).toBeVisible()
  })

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Header should still be visible on mobile
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
    await expect(page.locator('text=QR Code')).toBeVisible()
    await expect(page.locator('text=Archive')).toBeVisible()
  })

  test('should load page within reasonable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    
    // Should load within 5 seconds
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(5000)
    
    // Should show main content
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
  })

  test('should handle different week URLs', async ({ page }) => {
    // Test with a specific week URL
    const testDate = '2024-01-07' // A Sunday
    await page.goto(`/week/${testDate}`)
    
    // Should load the page successfully
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
    await expect(page).toHaveURL(`/week/${testDate}`)
  })

  test('should show login option when not authenticated', async ({ page }) => {
    await page.goto('/')
    
    // Should show Login link when not authenticated
    await expect(page.locator('text=Login')).toBeVisible()
    
    // Should not show user menu
    await expect(page.locator('text=Profile')).not.toBeVisible()
    await expect(page.locator('text=My Prayers')).not.toBeVisible()
  })
})
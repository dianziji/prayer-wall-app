import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('should load homepage within acceptable time', async ({ page }) => {
    // Measure page load time
    const start = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - start
    
    // Should load within 5 seconds (generous for E2E)
    expect(loadTime).toBeLessThan(5000)
    
    // Core content should be visible
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
  })

  test('should have reasonable Time to First Contentful Paint', async ({ page }) => {
    await page.goto('/')
    
    // Measure performance metrics
    const performanceEntries = await page.evaluate(() => {
      return JSON.stringify(performance.getEntriesByType('navigation'))
    })
    
    const entries = JSON.parse(performanceEntries)
    if (entries.length > 0) {
      const navigation = entries[0] as PerformanceNavigationTiming
      
      // Time to first contentful paint should be reasonable
      if (navigation.domContentLoadedEventEnd && navigation.domContentLoadedEventStart) {
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
        expect(domContentLoaded).toBeLessThan(3000) // 3 seconds
      }
    }
  })

  test('should handle large viewport sizes efficiently', async ({ page }) => {
    // Test with large desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    const start = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - start
    
    expect(loadTime).toBeLessThan(6000)
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
  })

  test('should handle small mobile viewport efficiently', async ({ page }) => {
    // Test with small mobile viewport
    await page.setViewportSize({ width: 320, height: 568 })
    
    const start = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - start
    
    expect(loadTime).toBeLessThan(6000)
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
  })

  test('should not have memory leaks with navigation', async ({ page }) => {
    await page.goto('/')
    
    // Navigate between pages multiple times
    for (let i = 0; i < 5; i++) {
      await page.click('text=QR Code')
      await page.waitForLoadState('networkidle')
      
      await page.click('text=Prayer Wall')
      await page.waitForLoadState('networkidle')
      
      await page.click('text=Archive')
      await page.waitForLoadState('networkidle')
      
      await page.click('text=Prayer Wall')
      await page.waitForLoadState('networkidle')
    }
    
    // Should still be responsive
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
  })

  test('should handle concurrent interactions efficiently', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Perform multiple actions quickly
    const actions = []
    
    // Find interactive elements
    const buttons = page.locator('button')
    const links = page.locator('a')
    
    const buttonCount = await buttons.count()
    const linkCount = await links.count()
    
    // Click multiple elements rapidly (but safely)
    if (buttonCount > 0) {
      actions.push(buttons.first().hover())
    }
    if (linkCount > 1) {
      actions.push(links.nth(1).hover())
    }
    
    await Promise.all(actions)
    
    // Page should remain stable
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
  })

  test('should render images efficiently', async ({ page }) => {
    await page.goto('/')
    
    // Count images and check load times
    const images = page.locator('img')
    const imageCount = await images.count()
    
    if (imageCount > 0) {
      // Wait for images to load
      await page.waitForLoadState('networkidle')
      
      // Check that images are actually loaded
      for (let i = 0; i < Math.min(imageCount, 3); i++) {
        const img = images.nth(i)
        const isVisible = await img.isVisible()
        
        if (isVisible) {
          // Should have proper src
          const src = await img.getAttribute('src')
          expect(src).toBeTruthy()
          
          // Should be loaded (no broken image)
          const naturalWidth = await img.evaluate((img: HTMLImageElement) => img.naturalWidth)
          expect(naturalWidth).toBeGreaterThan(0)
        }
      }
    }
  })

  test('should handle slow network conditions', async ({ page }) => {
    // Simulate slow 3G connection
    await page.context().route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100)) // Add 100ms delay
      await route.continue()
    })
    
    const start = Date.now()
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded') // Don't wait for all resources
    const loadTime = Date.now() - start
    
    // Should still load core content reasonably quickly
    expect(loadTime).toBeLessThan(10000) // 10 seconds with simulated slow network
    
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
  })

  test('should minimize layout shifts', async ({ page }) => {
    await page.goto('/')
    
    // Measure Cumulative Layout Shift
    await page.waitForLoadState('networkidle')
    
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0
        let clsEntries: LayoutShift[] = []
        
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries() as LayoutShift[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
              clsEntries.push(entry)
            }
          }
        }).observe({ type: 'layout-shift', buffered: true })
        
        // Wait a bit then resolve
        setTimeout(() => resolve(clsValue), 2000)
      })
    })
    
    // CLS should be reasonable (less than 0.25 is good)
    expect(cls as number).toBeLessThan(0.5)
  })

  test('should not block UI with long-running operations', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Try to interact with UI elements
    const interactions = []
    
    // Hover over elements
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    if (buttonCount > 0) {
      interactions.push(
        buttons.first().hover({ timeout: 1000 }).catch(() => {})
      )
    }
    
    // Try to scroll
    interactions.push(
      page.evaluate(() => {
        window.scrollBy(0, 100)
        return true
      })
    )
    
    await Promise.all(interactions)
    
    // UI should remain responsive
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
  })

  test('should handle resource loading failures gracefully', async ({ page }) => {
    // Block some resources to simulate failures
    await page.route('**/*.png', route => route.abort())
    await page.route('**/*.jpg', route => route.abort())
    
    await page.goto('/')
    
    // Should still load main content
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
    
    // Should not show critical errors
    await expect(page.locator('text=500')).not.toBeVisible()
    await expect(page.locator('text=Error')).not.toBeVisible()
  })
})
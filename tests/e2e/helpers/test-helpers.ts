import { Page, expect } from '@playwright/test'

/**
 * Common helper functions for E2E tests
 */

/**
 * Wait for the application to be fully loaded
 */
export async function waitForAppReady(page: Page) {
  await page.waitForLoadState('networkidle')
  await expect(page.locator('text=Prayer Wall')).toBeVisible()
}

/**
 * Navigate to home page and ensure it's loaded
 */
export async function goToHomePage(page: Page) {
  await page.goto('/')
  await waitForAppReady(page)
}

/**
 * Check if current page shows login state (unauthenticated)
 */
export async function expectUnauthenticatedState(page: Page) {
  await expect(page.locator('text=Login')).toBeVisible()
  await expect(page.locator('text=Profile')).not.toBeVisible()
  await expect(page.locator('text=My Prayers')).not.toBeVisible()
}

/**
 * Check for common error indicators
 */
export async function expectNoErrors(page: Page) {
  await expect(page.locator('text=500')).not.toBeVisible()
  await expect(page.locator('text=Internal Server Error')).not.toBeVisible()
  await expect(page.locator('text=404')).not.toBeVisible()
  await expect(page.locator('text=Not Found')).not.toBeVisible()
}

/**
 * Test basic page accessibility
 */
export async function checkBasicAccessibility(page: Page) {
  // Check for basic semantic structure
  await expect(page.locator('header, [role="banner"]')).toBeVisible()
  
  // Check for proper heading structure
  const headings = page.locator('h1, h2, h3, h4, h5, h6')
  const headingCount = await headings.count()
  if (headingCount > 0) {
    await expect(headings.first()).toBeVisible()
  }
  
  // Check that buttons have accessible names
  const buttons = page.locator('button')
  const buttonCount = await buttons.count()
  
  for (let i = 0; i < Math.min(buttonCount, 3); i++) {
    const button = buttons.nth(i)
    const isVisible = await button.isVisible()
    if (!isVisible) continue
    
    const textContent = await button.textContent()
    const ariaLabel = await button.getAttribute('aria-label')
    const title = await button.getAttribute('title')
    
    expect(
      (textContent && textContent.trim().length > 0) ||
      (ariaLabel && ariaLabel.length > 0) ||
      (title && title.length > 0)
    ).toBeTruthy()
  }
}

/**
 * Check responsive design at different viewport sizes
 */
export async function testResponsiveDesign(page: Page, url: string = '/') {
  const viewports = [
    { width: 320, height: 568, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1920, height: 1080, name: 'Desktop' }
  ]
  
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto(url)
    await waitForAppReady(page)
    
    // Check that content is still visible and accessible
    await expect(page.locator('text=Prayer Wall')).toBeVisible()
    
    // Check that interactive elements are appropriately sized for touch
    if (viewport.width <= 768) { // Mobile/tablet
      const buttons = page.locator('button')
      const buttonCount = await buttons.count()
      
      if (buttonCount > 0) {
        const firstButton = buttons.first()
        const isVisible = await firstButton.isVisible()
        
        if (isVisible) {
          const box = await firstButton.boundingBox()
          if (box) {
            // Touch targets should be at least 40px (with some tolerance)
            expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(35)
          }
        }
      }
    }
  }
}

/**
 * Simulate slow network conditions
 */
export async function simulateSlowNetwork(page: Page, delayMs: number = 100) {
  await page.context().route('**/*', async route => {
    await new Promise(resolve => setTimeout(resolve, delayMs))
    await route.continue()
  })
}

/**
 * Check for performance issues
 */
export async function checkPerformance(page: Page, url: string = '/', maxLoadTime: number = 5000) {
  const start = Date.now()
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  const loadTime = Date.now() - start
  
  expect(loadTime).toBeLessThan(maxLoadTime)
  return loadTime
}

/**
 * Test keyboard navigation
 */
export async function testKeyboardNavigation(page: Page) {
  // Tab through focusable elements
  await page.keyboard.press('Tab')
  await expect(page.locator(':focus')).toBeVisible()
  
  await page.keyboard.press('Tab')
  await expect(page.locator(':focus')).toBeVisible()
  
  // Shift+Tab should work too
  await page.keyboard.press('Shift+Tab')
  await expect(page.locator(':focus')).toBeVisible()
}

/**
 * Check for console errors
 */
export async function captureConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = []
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  
  page.on('pageerror', exception => {
    errors.push(exception.message)
  })
  
  return errors
}

/**
 * Filter out harmless console errors
 */
export function filterCriticalErrors(errors: string[]): string[] {
  return errors.filter(error => 
    !error.includes('404') &&
    !error.includes('favicon') &&
    !error.includes('chrome-extension') &&
    !error.includes('ResizeObserver loop limit exceeded') // Common harmless error
  )
}

/**
 * Wait for element to be stable (not moving)
 */
export async function waitForStableElement(page: Page, selector: string, timeoutMs: number = 5000) {
  const element = page.locator(selector)
  await element.waitFor({ state: 'visible' })
  
  // Wait for element position to stabilize
  let previousBox = await element.boundingBox()
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    await page.waitForTimeout(100)
    const currentBox = await element.boundingBox()
    
    if (previousBox && currentBox &&
        Math.abs(previousBox.x - currentBox.x) < 1 &&
        Math.abs(previousBox.y - currentBox.y) < 1) {
      break
    }
    
    previousBox = currentBox
    attempts++
  }
}

/**
 * Mock API responses for testing
 */
export async function mockApiResponse(page: Page, pattern: string, response: any) {
  await page.route(pattern, route => 
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    })
  )
}
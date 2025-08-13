import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  // Setup for E2E tests
  console.log('🚀 Starting E2E test setup...')
  
  // Launch browser for setup
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // Verify the application is running
    await page.goto('http://localhost:3000', { timeout: 30000 })
    console.log('✅ Application is accessible')
    
    // Setup test data if needed
    // await setupTestDatabase()
    
    // Create test user session if needed
    // await createTestUserSession(page)
    
    console.log('✅ E2E test setup completed')
  } catch (error) {
    console.error('❌ E2E setup failed:', error)
    throw error
  } finally {
    await context.close()
    await browser.close()
  }
}

export default globalSetup
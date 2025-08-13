# E2E Testing with Playwright

This directory contains end-to-end (E2E) tests for the Prayer Wall application using Playwright.

## Test Structure

### Test Files

- **`basic-navigation.spec.ts`** - Basic page navigation and loading tests
- **`prayer-wall.spec.ts`** - Core prayer wall functionality tests  
- **`user-auth.spec.ts`** - User authentication flow tests
- **`accessibility.spec.ts`** - Accessibility and WCAG compliance tests
- **`performance.spec.ts`** - Performance and loading time tests
- **`user-flows/prayer-interaction.spec.ts`** - Complete user journey tests

### Helper Files

- **`helpers/test-helpers.ts`** - Common utility functions for E2E tests
- **`global-setup.ts`** - Setup executed before all tests
- **`global-teardown.ts`** - Cleanup executed after all tests

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

### Running Tests

#### Run all E2E tests
```bash
npm run test:e2e
```

#### Run with UI mode (interactive)
```bash
npm run test:e2e:ui
```

#### Run in headed mode (see browser)
```bash
npm run test:e2e:headed
```

#### Run in debug mode
```bash
npm run test:e2e:debug
```

#### Run specific test file
```bash
npx playwright test basic-navigation.spec.ts
```

#### Run specific browser
```bash
npx playwright test --project chromium
```

#### Run specific test
```bash
npx playwright test -g "should load homepage"
```

## Browser Configuration

Tests run on multiple browsers and devices:

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Mobile Chrome, Mobile Safari

## Test Categories

### 1. Basic Navigation (7 tests)
- Homepage loading and redirects
- Navigation between pages (QR, Archive)
- Responsive design
- Performance checks
- Week URL handling
- Login state verification

### 2. Prayer Wall Core (8 tests)  
- Prayer display and interactions
- Empty state handling
- Mobile functionality
- Error handling
- Timestamp rendering
- Week content validation
- Network interruption recovery

### 3. User Authentication (10 tests)
- Unauthenticated user experience
- Login navigation
- Protected route access
- Comment/like restrictions
- State persistence
- Auth callback handling

### 4. Accessibility (10 tests)
- Semantic HTML structure
- Form accessibility
- Button accessibility  
- Keyboard navigation
- Screen reader compatibility
- Focus management
- Color contrast
- Reduced motion support
- High contrast mode

### 5. Performance (11 tests)
- Page load times
- Time to First Contentful Paint
- Responsive viewport performance
- Memory leak prevention
- Concurrent interaction handling
- Image loading efficiency
- Slow network simulation
- Layout shift minimization
- UI responsiveness
- Resource failure handling

### 6. User Flow Integration (6 tests)
- Complete user journeys
- Prayer browsing flows
- Responsive interactions
- Accessibility workflows
- Error handling scenarios
- Performance during usage

## Writing New Tests

### Test Structure
```typescript
import { test, expect } from '@playwright/test'
import { goToHomePage, expectNoErrors } from '../helpers/test-helpers'

test.describe('Your Test Suite', () => {
  test('should do something', async ({ page }) => {
    await goToHomePage(page)
    
    // Your test logic here
    await expect(page.locator('text=Something')).toBeVisible()
    
    await expectNoErrors(page)
  })
})
```

### Best Practices

1. **Use helper functions** from `test-helpers.ts` for common operations
2. **Test user workflows** rather than isolated functionality
3. **Include error handling** and edge cases
4. **Test multiple viewports** for responsive design
5. **Verify accessibility** in all tests
6. **Check performance** where applicable
7. **Use meaningful test descriptions** that describe user behavior
8. **Clean up state** after tests if needed

### Common Patterns

```typescript
// Wait for app to be ready
await waitForAppReady(page)

// Check authentication state
await expectUnauthenticatedState(page)

// Verify no errors occurred
await expectNoErrors(page)

// Test responsive design
await testResponsiveDesign(page, '/your-page')

// Check basic accessibility
await checkBasicAccessibility(page)

// Test keyboard navigation
await testKeyboardNavigation(page)

// Capture console errors
const errors = await captureConsoleErrors(page)
```

## Configuration

See `playwright.config.ts` in the root directory for:

- Browser configurations
- Test timeouts
- Retry policies
- Video/screenshot settings
- Web server setup

## Debugging Tests

1. **Use UI mode**: `npm run test:e2e:ui`
2. **Debug mode**: `npm run test:e2e:debug`
3. **Headed mode**: `npm run test:e2e:headed`
4. **Screenshots**: Automatically taken on failure
5. **Videos**: Recorded on retry/failure
6. **Traces**: Available for failed tests

## CI/CD Integration

Tests are configured to run in CI with:
- Retry on failure (2 retries)
- Sequential execution in CI
- HTML and JUnit reports
- Artifact collection for debugging

## Maintenance

1. **Update test data** as features change
2. **Add new tests** for new features
3. **Review flaky tests** and improve stability
4. **Keep selectors up to date** with UI changes
5. **Update browser versions** regularly
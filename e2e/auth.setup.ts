import { test as setup, expect } from '@playwright/test'
import { TEST_USER, ROUTES } from './fixtures/test-data'

const authFile = 'e2e/.auth/user.json'

/**
 * Authentication Setup
 * Runs before all tests to establish authenticated session
 */
setup('authenticate', async ({ page }) => {
  // Increase timeout for this setup
  setup.setTimeout(60000)

  // Navigate to login
  await page.goto(ROUTES.login)

  // Wait for login form to be visible
  await expect(page.locator('form')).toBeVisible({ timeout: 10000 })

  // Fill credentials
  const emailInput = page.locator('input[type="email"]')
  const passwordInput = page.locator('input[type="password"]')

  await emailInput.fill(TEST_USER.email)
  await passwordInput.fill(TEST_USER.password)

  // Submit form
  await page.locator('button[type="submit"]').click()

  // Wait for navigation away from login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 })

  // Wait for page to stabilize
  await page.waitForLoadState('networkidle')

  // Verify we're logged in - should see sidebar or dashboard content
  await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 })

  // Save authentication state
  await page.context().storageState({ path: authFile })
})

/**
 * Unauthenticated setup for login/register tests
 */
setup.describe('unauthenticated', () => {
  setup.use({ storageState: { cookies: [], origins: [] } })

  setup('verify login page accessible', async ({ page }) => {
    await page.goto(ROUTES.login)
    await expect(page.locator('form')).toBeVisible()
  })

  setup('verify register page accessible', async ({ page }) => {
    await page.goto(ROUTES.register)
    await expect(page.locator('form')).toBeVisible()
  })
})

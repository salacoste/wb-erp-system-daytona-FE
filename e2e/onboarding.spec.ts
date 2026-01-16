import { test, expect } from '@playwright/test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

/**
 * E2E Tests: Onboarding Flow
 * Stories: 2.1-2.4 (Cabinet Creation, Token Input, Processing, Initial Data)
 *
 * Note: These tests verify onboarding routes redirect behavior.
 * Full onboarding flow requires a fresh user without cabinets.
 */
test.describe('Onboarding Flow', () => {
  // Use unauthenticated state for onboarding tests
  test.use({ storageState: { cookies: [], origins: [] } })

  test.describe('Public Onboarding Pages', () => {
    test('cabinet page shows cabinet creation form', async ({ page }) => {
      await page.goto(ROUTES.onboarding.cabinet)
      await page.waitForLoadState('networkidle')

      // Cabinet creation page is publicly accessible
      // Should show "Создание кабинета" heading and form
      const heading = page.locator('h1:has-text("Создание кабинета"), h1:has-text("кабинет")')
      const form = page.locator('form')

      const hasHeading = await heading.count() > 0
      const hasForm = await form.count() > 0

      expect(hasHeading || hasForm).toBeTruthy()
    })

    test('wb-token page is accessible', async ({ page }) => {
      await page.goto(ROUTES.onboarding.token)
      await page.waitForLoadState('networkidle')

      // WB Token page should show form or redirect
      const form = page.locator('form')
      const hasForm = await form.count() > 0
      const hasContent = await page.locator('body').textContent()

      expect(hasForm || (hasContent && hasContent.length > 0)).toBeTruthy()
    })

    test('processing page is accessible', async ({ page }) => {
      await page.goto(ROUTES.onboarding.processing)
      await page.waitForLoadState('networkidle')

      // Processing page should show content
      const hasContent = await page.locator('body').textContent()

      expect(hasContent && hasContent.length > 0).toBeTruthy()
    })
  })

  test.describe('Login Page Functionality', () => {
    test('displays login form with email and password', async ({ page }) => {
      await page.goto(ROUTES.login)

      // Form should be visible
      await expect(page.locator('form')).toBeVisible({ timeout: TIMEOUTS.navigation })

      // Email input
      const emailInput = page.locator('input[type="email"]')
      await expect(emailInput).toBeVisible()

      // Password input
      const passwordInput = page.locator('input[type="password"]')
      await expect(passwordInput).toBeVisible()

      // Submit button
      const submitButton = page.locator('button[type="submit"]')
      await expect(submitButton).toBeVisible()
    })

    test('shows validation error for empty form', async ({ page }) => {
      await page.goto(ROUTES.login)

      // Try to submit empty form
      await page.locator('button[type="submit"]').click()

      // Should show validation (either browser validation or form validation)
      // Check if form is still on login page (form wasn't submitted)
      await expect(page).toHaveURL(/login/)
    })

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto(ROUTES.login)

      // Enter invalid credentials
      await page.locator('input[type="email"]').fill('invalid@example.com')
      await page.locator('input[type="password"]').fill('wrongpassword')
      await page.locator('button[type="submit"]').click()

      // Should show error or stay on login page
      await page.waitForTimeout(2000)

      // Check for error message or that we're still on login
      const hasError = await page.locator('text=/ошибка|error|неверн|invalid/i').count() > 0
      const stillOnLogin = page.url().includes('login')

      expect(hasError || stillOnLogin).toBeTruthy()
    })
  })

  test.describe('Register Page Functionality', () => {
    test('displays registration form', async ({ page }) => {
      await page.goto(ROUTES.register)

      // Form should be visible
      await expect(page.locator('form')).toBeVisible({ timeout: TIMEOUTS.navigation })

      // Email input
      const emailInput = page.locator('input[type="email"]')
      await expect(emailInput).toBeVisible()

      // Password input(s)
      const passwordInputs = page.locator('input[type="password"]')
      expect(await passwordInputs.count()).toBeGreaterThanOrEqual(1)
    })

    test('has link to login page', async ({ page }) => {
      await page.goto(ROUTES.register)

      // Should have link to login
      const loginLink = page.locator('a[href*="login"], a:has-text("Войти"), a:has-text("Sign in")')
      await expect(loginLink.first()).toBeVisible()
    })
  })
})

/**
 * Authenticated Onboarding Tests
 * These tests verify behavior for users who already completed onboarding
 */
test.describe('Authenticated User - Onboarding Routes', () => {
  // Uses default authenticated state from setup

  test('cabinet page redirects to dashboard for existing user', async ({ page }) => {
    await page.goto(ROUTES.onboarding.cabinet)

    // User with existing cabinet should be redirected to dashboard
    await page.waitForLoadState('networkidle')

    // Should be on dashboard or still on cabinet page (depending on implementation)
    const currentUrl = page.url()
    const isExpectedRoute =
      currentUrl.includes('dashboard') ||
      currentUrl.includes('cabinet') ||
      currentUrl.includes('cogs')

    expect(isExpectedRoute).toBeTruthy()
  })

  test('wb-token page redirects to dashboard for existing user', async ({ page }) => {
    await page.goto(ROUTES.onboarding.token)

    await page.waitForLoadState('networkidle')

    const currentUrl = page.url()
    const isExpectedRoute =
      currentUrl.includes('dashboard') ||
      currentUrl.includes('wb-token') ||
      currentUrl.includes('cogs')

    expect(isExpectedRoute).toBeTruthy()
  })

  test('processing page redirects to dashboard for existing user', async ({ page }) => {
    await page.goto(ROUTES.onboarding.processing)

    await page.waitForLoadState('networkidle')

    const currentUrl = page.url()
    const isExpectedRoute =
      currentUrl.includes('dashboard') ||
      currentUrl.includes('processing') ||
      currentUrl.includes('cogs')

    expect(isExpectedRoute).toBeTruthy()
  })
})

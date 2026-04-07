/**
 * Manager (non-Owner) Authentication Setup
 * Story 86.2 — AC #2 verification
 *
 * Logs in as a Manager-role test user and saves the storage state to
 * `e2e/.auth/manager.json`. The non-Owner E2E tests in
 * `e2e/orders-client-info.spec.ts` consume this storage state to verify
 * that the Клиент column is hidden and no client-info API requests fire
 * for users without the Owner role.
 *
 * Gracefully skips when E2E_MANAGER_EMAIL / E2E_MANAGER_PASSWORD are not
 * set in `.env.e2e` — the dependent tests will then also skip via their
 * own `test.skip(!HAS_MANAGER_CREDS, ...)` guards. This keeps the main
 * Owner test suite running even when the Manager fixture is not provisioned.
 */

import { test as setup, expect } from '@playwright/test'
import { TEST_MANAGER, HAS_MANAGER_CREDS, ROUTES } from './fixtures/test-data'

const managerAuthFile = 'e2e/.auth/manager.json'

setup('authenticate as manager (non-Owner)', async ({ page }) => {
  // Skip gracefully if Manager credentials are not configured.
  // Visible as yellow "skipped" in Playwright report — not a silent green pass.
  setup.skip(
    !HAS_MANAGER_CREDS,
    'E2E_MANAGER_EMAIL / E2E_MANAGER_PASSWORD not set in .env.e2e — non-Owner tests will skip'
  )

  // Both fields are guaranteed defined here (HAS_MANAGER_CREDS gate above).
  // Capture to non-null locals for the type checker.
  const email = TEST_MANAGER.email
  const password = TEST_MANAGER.password
  if (!email || !password) {
    throw new Error('Manager credentials disappeared after HAS_MANAGER_CREDS check')
  }

  setup.setTimeout(60_000)

  await page.goto(ROUTES.login)
  await expect(page.locator('form')).toBeVisible({ timeout: 10_000 })

  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.locator('button[type="submit"]').click()

  // Wait for navigation away from login page
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 30_000 })
  await page.waitForLoadState('networkidle')

  // Sanity check: dashboard shell should be visible (Manager has read access to most pages)
  await expect(page.locator('main').first()).toBeVisible({ timeout: 10_000 })

  // Save authentication state for downstream tests
  await page.context().storageState({ path: managerAuthFile })
})

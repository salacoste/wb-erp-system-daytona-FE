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

import { test as setup, expect } from './fixtures/network-test'
import { atomicWriteStorageState } from './fixtures/atomic-storage-state'
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

  // Story 162.8: no `setup.setTimeout` — the manager login flow is fully
  // bounded by `waitForURL({timeout})` + `expect(main).toBeVisible({timeout})`
  // below (anti-pattern #7).
  await page.goto(ROUTES.login)
  await expect(page.locator('form')).toBeVisible({ timeout: 10_000 })

  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.locator('button[type="submit"]').click()

  // Wait for navigation away from login page
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 30_000 })

  // Stabilize by waiting for the dashboard shell to render. NOT networkidle — the dashboard
  // background-polls (TanStack Query), so networkidle never settles and the setup times out
  // (anti-pattern #9 applied to the setup file itself; validation F-4 fixed the same bug in
  // auth.setup.ts but this Manager setup, added later for Story 86.2, reintroduced it → it
  // failed every run and BLOCKED the whole chromium project via the setup dependency).
  await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

  // Save authentication state atomically (temp + rename). The default
  // `storageState({ path })` writes in-place, which races concurrent readers
  // under --repeat-each and can surface as ENOENT / partial JSON. See
  // e2e/fixtures/atomic-storage-state.ts.
  await atomicWriteStorageState(page.context(), managerAuthFile)
})

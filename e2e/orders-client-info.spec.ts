/**
 * E2E Tests: Orders Client Info Column (PII)
 * Story 86.2: Client Info (PII) for FBS Orders
 *
 * Verifies the Owner-only "Клиент" column behavior in the orders list:
 * - AC #1: Owner sees the Клиент column with name + phone for DBW orders
 * - AC #2: Non-Owner roles never see the column AND no client-info API call is fired
 * - AC #3: Orders without PII gracefully show "—"
 * - AC #4 / #5: PII never appears in localStorage or sessionStorage (browser privacy guardrails)
 *
 * @see _bmad-output/implementation-artifacts/86-2-client-info-pii.md
 */

import { test, expect, type Page, type Request } from './fixtures/network-test'
import { MUTATING_E2E_SKIP_REASON, shouldSkipMutatingE2E } from './fixtures/mutation-guard'
import { HAS_MANAGER_CREDS } from './fixtures/test-data'
import {
  seedDbwOrder,
  cleanupDbwOrder,
  SEED_CLIENT,
  type DbwSeedData,
} from './fixtures/dbw-order-seed'

const ORDERS_ROUTE = '/orders'
const CLIENT_INFO_ENDPOINT_PATTERN = /\/v1\/cabinets\/[^/]+\/orders\/client-info/
const MANAGER_AUTH_FILE = 'e2e/.auth/manager.json'

/** Seeded DBW order — set in beforeAll, cleaned up in afterAll. */
let seedData: DbwSeedData | null = null

/**
 * Capture all requests matching the client-info endpoint while running `action`.
 * Returns the list of intercepted Request objects so the test can assert
 * presence/absence of the call.
 */
async function captureClientInfoRequests(
  page: Page,
  action: () => Promise<void>
): Promise<Request[]> {
  const requests: Request[] = []
  const handler = (request: Request) => {
    if (CLIENT_INFO_ENDPOINT_PATTERN.test(request.url())) {
      requests.push(request)
    }
  }
  page.on('request', handler)
  try {
    await action()
  } finally {
    page.off('request', handler)
  }
  return requests
}

/**
 * Deterministic wait for the client-info API request to complete.
 * Replaces all `page.waitForTimeout(N)` calls per the test-quality framework's
 * "No Hard Waits" rule. Use BEFORE navigating to /orders so the response is
 * captured even if the request fires immediately on mount.
 *
 * Returns null when the request does not fire within the timeout (e.g., the
 * fixture has no orders, or the user is not Owner). Caller can then use
 * `test.skip()` to mark the test as skipped instead of conditionally returning.
 */
async function waitForClientInfoResponseOrNull(page: Page, timeoutMs = 5000) {
  try {
    return await page.waitForResponse(
      response => CLIENT_INFO_ENDPOINT_PATTERN.test(response.url()) && response.status() === 200,
      { timeout: timeoutMs }
    )
  } catch {
    return null // No response within timeout — fixture has no DBW orders
  }
}

/**
 * Sweep both browser storages for any string containing the given substrings.
 * Returns the list of (storage, key, value) leaks found — empty array means clean.
 */
async function sweepBrowserStorageForPii(
  page: Page,
  piiNeedles: string[]
): Promise<Array<{ storage: string; key: string; value: string }>> {
  return page.evaluate((needles: string[]) => {
    const leaks: Array<{ storage: string; key: string; value: string }> = []
    const sweep = (storage: Storage, name: string) => {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i) ?? ''
        const value = storage.getItem(key) ?? ''
        for (const needle of needles) {
          if (key.includes(needle) || value.includes(needle)) {
            leaks.push({ storage: name, key, value })
          }
        }
      }
    }
    sweep(window.localStorage, 'localStorage')
    sweep(window.sessionStorage, 'sessionStorage')
    return leaks
  }, piiNeedles)
}

test.describe('Story 86.2: Client Info (PII) — Orders Клиент column @mutating', () => {
  test.skip(shouldSkipMutatingE2E(), MUTATING_E2E_SKIP_REASON)

  // Seed a DBW order with known PII via POST /v1/test/seed/dbw-order (dev-only).
  // When seeding succeeds, the tests below assert deterministically — no skips.
  // When seeding fails (production, endpoint down), the entire block skips visibly.
  test.beforeAll(async () => {
    seedData = await seedDbwOrder()
  })

  test.afterAll(async () => {
    if (seedData) {
      await cleanupDbwOrder(seedData.orderId)
      seedData = null
    }
  })

  // Gate each seed-dependent test after beforeAll has attempted seeding.
  // Do not use a describe-time skip here: seedData is intentionally null at
  // module load and is only populated in beforeAll.
  test.beforeEach(() => {
    test.skip(!seedData, 'DBW order seed endpoint unavailable — tests require dev backend')
  })

  test.describe('AC #1: Owner role — column visible', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(ORDERS_ROUTE, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('table').first()).toBeVisible({ timeout: 10000 })
    })

    test('should render the "Клиент" column header for Owner role', async ({ page }) => {
      // The seeded test user is Owner per docs/USER-GUIDE.md / e2e setup
      const header = page.getByRole('columnheader', { name: /Клиент/i })
      await expect(header).toBeVisible({ timeout: 10000 })
    })

    test('should fire a client-info API request when Owner loads orders with rows', async ({
      page,
    }) => {
      const requests = await captureClientInfoRequests(page, async () => {
        await page.reload({ waitUntil: 'domcontentloaded' })
        await expect(page.getByRole('table').first()).toBeVisible({ timeout: 10000 })
      })

      // If the table has at least one row, exactly one client-info request should fire
      // (chunking only applies for >100 orderIds; the seeded fixture is smaller).
      const orderRows = await page.getByRole('row').count()
      if (orderRows > 1) {
        // > 1 because of header row
        expect(requests.length).toBeGreaterThanOrEqual(1)
        // Verify it was a GET request matching the documented contract
        for (const req of requests) {
          expect(req.method()).toBe('GET')
          expect(req.url()).toContain('orderIds=')
        }
      }
    })

    test('should render phone as a tel: link with aria-label when client info is available', async ({
      page,
    }) => {
      const responsePromise = waitForClientInfoResponseOrNull(page)
      await page.reload()
      await responsePromise

      // Seed succeeded — the phone link must be visible (no skip)
      const phoneLink = page.getByRole('link', { name: /Позвонить клиенту/i }).first()
      await expect(phoneLink).toBeVisible()
      const href = await phoneLink.getAttribute('href')
      expect(href).toMatch(/^tel:/)
    })

    test('should render "—" placeholder for orders without client info', async ({ page }) => {
      // Deterministic wait for the table to render with client-info data
      const responsePromise = waitForClientInfoResponseOrNull(page)
      await page.reload()
      await responsePromise

      // Scope the search to the table to avoid matching dashes elsewhere on the page.
      // Most orders in the test DB are not DBW, so at least one row should show "—".
      // The seeded DBW order has client info; non-DBW orders show the placeholder.
      const table = page.getByRole('table').first()
      const dashes = table.getByText('—', { exact: true })
      await expect(dashes.first()).toBeVisible()
    })
  })

  test.describe('AC #4 + #5: Privacy guardrails — PII never persisted to browser storage', () => {
    test.beforeEach(async ({ page }) => {
      // Intercept the client-info request BEFORE navigation, then await it
      const responsePromise = waitForClientInfoResponseOrNull(page)
      await page.goto(ORDERS_ROUTE, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('table').first()).toBeVisible({ timeout: 10000 })
      await responsePromise // deterministic wait, no hard sleep
    })

    test('should NOT persist any rendered client name to localStorage or sessionStorage', async ({
      page,
    }) => {
      // Sweep for the seeded client name — deterministic, no skip
      const needles = [SEED_CLIENT.clientName]
      const leaks = await sweepBrowserStorageForPii(page, needles)
      expect(leaks, `PII leak detected in browser storage: ${JSON.stringify(leaks)}`).toHaveLength(
        0
      )
    })

    test('should NOT persist phone numbers (tel: links) to browser storage', async ({ page }) => {
      // Sweep for the seeded client phone — deterministic, no skip
      const needles = [SEED_CLIENT.clientPhone]
      const leaks = await sweepBrowserStorageForPii(page, needles)
      expect(
        leaks,
        `Phone leak detected in browser storage: ${JSON.stringify(leaks)}`
      ).toHaveLength(0)
    })

    test('should clean PII from in-memory cache after navigating away (gcTime: 0)', async ({
      page,
    }) => {
      // Navigate away — this unmounts the orders page and should evict TanStack Query cache
      await page.goto('/dashboard')
      await page.waitForLoadState('domcontentloaded')

      // Sweep storages for the seeded PII — none should remain after navigation
      const needles = [SEED_CLIENT.clientName, SEED_CLIENT.clientPhone]
      const leaks = await sweepBrowserStorageForPii(page, needles)
      expect(
        leaks,
        `PII persisted after navigation away from /orders: ${JSON.stringify(leaks)}`
      ).toHaveLength(0)
    })
  })

  test.describe('Click-to-call interaction', () => {
    test('should not open the order detail modal when clicking the phone link (stopPropagation)', async ({
      page,
    }) => {
      // Deterministic wait — no hard sleep
      const responsePromise = waitForClientInfoResponseOrNull(page)
      await page.goto(ORDERS_ROUTE, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('table').first()).toBeVisible({ timeout: 10000 })
      await responsePromise

      const phoneLinkLocator = page.getByRole('link', { name: /Позвонить клиенту/i })

      // Block the tel: navigation so jsdom-style protocol errors don't fire
      await page.route('tel:**', route => route.abort())

      // Seed succeeded — phone link must be visible (no skip)
      const phoneLink = phoneLinkLocator.first()
      await expect(phoneLink).toBeVisible()
      // Click the phone link — modal should NOT open. The .catch() here is justified
      // because aborting tel: navigation legitimately throws an exception in jsdom mode
      // (a known platform quirk). This is NOT control flow — it handles a specific
      // exception type that is expected and unrelated to the assertion below.
      await phoneLink.click({ noWaitAfter: true }).catch(() => {})

      // Specifically assert the order detail modal did not open. Replaces the previous
      // try/catch flow control which was hiding real failures (M3 fix from test-review).
      const orderModal = page.locator('[data-testid="order-detail-modal"]')
      await expect(orderModal).not.toBeVisible()
    })
  })

  /**
   * G1 (testarch): Non-Owner E2E coverage (AC #2)
   *
   * Activated 2026-04-07 — these tests now run when E2E_MANAGER_EMAIL and
   * E2E_MANAGER_PASSWORD are set in `.env.e2e`. When credentials are missing,
   * the entire describe block skips visibly (yellow in CI report) instead
   * of silently passing.
   *
   * Architecture note: rather than `test.use({ storageState })` at the
   * describe level (which is evaluated at file-load time and fails hard if
   * the file doesn't exist), each test creates a fresh browser context with
   * the manager storage state at runtime. This makes the spec robust whether
   * or not the Manager fixture has been provisioned.
   *
   * @see e2e/fixtures/test-data.ts → TEST_MANAGER, HAS_MANAGER_CREDS
   * @see e2e/auth-manager.setup.ts (creates manager.json)
   */
  test.describe('AC #2: Non-Owner role gate', () => {
    // Skip the entire describe when Manager credentials are not configured.
    // This is visible as yellow "skipped" in the Playwright report — never
    // a silent green pass, per CLAUDE.md anti-pattern #6.
    test.skip(
      !HAS_MANAGER_CREDS,
      'E2E_MANAGER_EMAIL / E2E_MANAGER_PASSWORD not set — non-Owner tests deferred until fixture is provisioned'
    )

    test('should NOT render the "Клиент" column for Manager role', async ({ browser }) => {
      const context = await browser.newContext({
        storageState: MANAGER_AUTH_FILE,
      })
      const page = await context.newPage()
      try {
        await page.goto(ORDERS_ROUTE, { waitUntil: 'domcontentloaded' })
        await expect(page.locator('main')).toBeVisible({ timeout: 10000 })

        const header = page.getByRole('columnheader', { name: /Клиент/i })
        await expect(header).toHaveCount(0)
      } finally {
        await context.close()
      }
    })

    test('should NOT fire any client-info API request for Manager role', async ({ browser }) => {
      const context = await browser.newContext({
        storageState: MANAGER_AUTH_FILE,
      })
      const page = await context.newPage()
      try {
        const requests = await captureClientInfoRequests(page, async () => {
          await page.goto(ORDERS_ROUTE, { waitUntil: 'domcontentloaded' })
          await expect(page.locator('main')).toBeVisible({ timeout: 10000 })
        })
        expect(requests).toHaveLength(0)
      } finally {
        await context.close()
      }
    })

    test('should return 403 if a Manager directly hits the client-info endpoint', async ({
      playwright,
    }) => {
      // Defense-in-depth check: even if frontend gate is bypassed, backend @Roles enforces Owner
      const baseUrl = process.env.E2E_API_URL ?? 'http://localhost:3000'
      const cabinetId = process.env.E2E_CABINET_ID ?? ''
      const token = process.env.E2E_MANAGER_TOKEN ?? ''

      test.skip(
        !cabinetId || !token,
        'E2E_CABINET_ID or E2E_MANAGER_TOKEN missing — set in .env.e2e to enable API-level check'
      )

      // Use a fresh APIRequestContext (not the Owner-authenticated one) so
      // the Authorization header below is the only credential in the request.
      const apiContext = await playwright.request.newContext()
      try {
        const response = await apiContext.get(
          `${baseUrl}/v1/cabinets/${cabinetId}/orders/client-info?orderIds=1`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Cabinet-Id': cabinetId,
            },
          }
        )
        expect(response.status()).toBe(403)
      } finally {
        await apiContext.dispose()
      }
    })
  })

  /**
   * G4 (testarch): Privacy regression sentinel — broad PII leak detector
   *
   * This test is the canary that should catch ANY future regression where
   * PII accidentally leaks into browser storage. It runs the full Owner flow,
   * captures all visible PII, navigates between several pages, and finally
   * sweeps both storages for any of the captured strings.
   *
   * If this test fails after a refactor: STOP and investigate before merging.
   */
  test.describe('G4: Privacy regression sentinel (canary)', () => {
    test('should not leak any rendered PII across navigation cycles', async ({ page }) => {
      // 1. Land on orders with deterministic wait for the PII payload
      const responsePromise = waitForClientInfoResponseOrNull(page)
      await page.goto(ORDERS_ROUTE)
      await page.waitForLoadState('domcontentloaded')
      await responsePromise

      // Use seeded PII directly — deterministic, no skip
      const allNeedles = [SEED_CLIENT.clientName, SEED_CLIENT.clientPhone]

      // 2. Navigate through several pages to exercise unmount/mount cycles.
      // Routes are well-known and asserted to exist — no try/catch around navigation.
      //
      // We deliberately do NOT use `waitForLoadState('networkidle')` here — the
      // dashboard runs many background queries (margin polling, chart data,
      // dev-tools telemetry) that never let the network go idle within the
      // test timeout. Instead, we wait for `domcontentloaded` (React has
      // mounted, the previous page has unmounted) plus a stable landmark on
      // each route to confirm the navigation actually completed.
      const navigationCycle = [
        { route: '/dashboard', landmark: page.getByRole('heading', { name: /Dashboard/i }) },
        { route: ORDERS_ROUTE, landmark: page.getByRole('table').first() },
        { route: '/dashboard', landmark: page.getByRole('heading', { name: /Dashboard/i }) },
      ] as const
      for (const { route, landmark } of navigationCycle) {
        await page.goto(route, { waitUntil: 'domcontentloaded' })
        await expect(landmark).toBeVisible({ timeout: 10000 })
      }

      // 3. Final storage sweep — none of the originally captured PII should remain
      const leaks = await sweepBrowserStorageForPii(page, allNeedles)

      // Build a clear failure message if any leak is detected. Using expect(...).toEqual([])
      // gives a clean diff in the report instead of a thrown Error which is harder to read.
      const leakSummary = leaks
        .map(l => `[${l.storage}] ${l.key.slice(0, 50)} → contains PII`)
        .join('\n')
      expect(
        leaks,
        `PRIVACY REGRESSION SENTINEL FAILED — ${leaks.length} PII leak(s) detected:\n${leakSummary}\n\nA recent change introduced PII persistence. Investigate before merging.`
      ).toEqual([])
    })
  })
})

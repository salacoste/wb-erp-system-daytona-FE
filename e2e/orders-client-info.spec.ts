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

import { existsSync } from 'node:fs'
import { test, expect, type Page, type Request } from '@playwright/test'
import { HAS_MANAGER_CREDS } from './fixtures/test-data'

const ORDERS_ROUTE = '/orders'
const CLIENT_INFO_ENDPOINT_PATTERN = /\/v1\/cabinets\/[^/]+\/orders\/client-info/
const MANAGER_AUTH_FILE = 'e2e/.auth/manager.json'

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

test.describe('Story 86.2: Client Info (PII) — Orders Клиент column', () => {
  test.describe('AC #1: Owner role — column visible', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(ORDERS_ROUTE)
      await page.waitForLoadState('networkidle')
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
        await page.reload()
        await page.waitForLoadState('networkidle')
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
      // Deterministic wait for client-info response (no hard waits)
      const responsePromise = waitForClientInfoResponseOrNull(page)
      await page.reload()
      await responsePromise

      // Use Playwright's auto-waiting locator-based count check
      const phoneLinkLocator = page.getByRole('link', { name: /Позвонить клиенту/i })
      const linkCount = await phoneLinkLocator.count()

      // Visible-fixture skip — appears in CI report as "skipped" instead of silently passing
      test.skip(
        linkCount === 0,
        'No DBW orders with client info in test fixture — needs API seeding (M2 backlog)'
      )

      const phoneLink = phoneLinkLocator.first()
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
      const table = page.getByRole('table').first()
      const dashes = table.getByText('—', { exact: true })
      // The dash placeholder must render for at least one row in the seeded fixture
      // (most orders are not DBW). If the entire fixture has client info for every
      // order, this test would skip — surface that as visible skip rather than pass.
      const dashCount = await dashes.count()
      test.skip(
        dashCount === 0,
        'All orders in fixture have client info — cannot verify "—" placeholder'
      )
      expect(dashCount).toBeGreaterThan(0)
    })
  })

  test.describe('AC #4 + #5: Privacy guardrails — PII never persisted to browser storage', () => {
    test.beforeEach(async ({ page }) => {
      // Intercept the client-info request BEFORE navigation, then await it
      const responsePromise = waitForClientInfoResponseOrNull(page)
      await page.goto(ORDERS_ROUTE)
      await page.waitForLoadState('networkidle')
      await responsePromise // deterministic wait, no hard sleep
    })

    test('should NOT persist any rendered client name to localStorage or sessionStorage', async ({
      page,
    }) => {
      // Read all visible client names from the table
      const visibleNames = await page.evaluate(() => {
        const cells = document.querySelectorAll('td')
        const names: string[] = []
        cells.forEach(cell => {
          // Heuristic: client names are short non-empty strings in cells with no children except span
          const text = cell.textContent?.trim() ?? ''
          if (text && text.length > 0 && text.length < 50 && !text.includes('₽')) {
            names.push(text)
          }
        })
        return names
      })

      // Visible-skip if no client info in fixture
      test.skip(
        visibleNames.length === 0,
        'No client names visible in fixture — needs API seeding (M2 backlog)'
      )

      // For each visible name, sweep both storages
      const leaks = await sweepBrowserStorageForPii(page, visibleNames)
      expect(leaks, `PII leak detected in browser storage: ${JSON.stringify(leaks)}`).toHaveLength(
        0
      )
    })

    test('should NOT persist phone numbers (tel: links) to browser storage', async ({ page }) => {
      // Extract all phone numbers from tel: links
      const phones = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href^="tel:"]')
        return Array.from(links).map(a => (a.getAttribute('href') ?? '').replace(/^tel:/, ''))
      })

      test.skip(
        phones.length === 0,
        'No phone links visible in fixture — needs API seeding (M2 backlog)'
      )

      const leaks = await sweepBrowserStorageForPii(page, phones)
      expect(
        leaks,
        `Phone leak detected in browser storage: ${JSON.stringify(leaks)}`
      ).toHaveLength(0)
    })

    test('should clean PII from in-memory cache after navigating away (gcTime: 0)', async ({
      page,
    }) => {
      // Capture visible PII before navigating away
      const visibleNames = await page.evaluate(() => {
        const cells = document.querySelectorAll('td')
        return Array.from(cells)
          .map(c => c.textContent?.trim() ?? '')
          .filter(t => t.length > 0 && t.length < 50 && !t.includes('₽'))
      })

      test.skip(
        visibleNames.length === 0,
        'No PII to verify eviction — needs API seeding (M2 backlog)'
      )

      // Navigate away — this unmounts the orders page and should evict TanStack Query cache
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Sweep storages — none of the previously visible PII should remain
      const leaks = await sweepBrowserStorageForPii(page, visibleNames)
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
      await page.goto(ORDERS_ROUTE)
      await page.waitForLoadState('networkidle')
      await responsePromise

      const phoneLinkLocator = page.getByRole('link', { name: /Позвонить клиенту/i })
      const linkCount = await phoneLinkLocator.count()
      test.skip(linkCount === 0, 'No phone links in fixture — needs API seeding (M2 backlog)')

      // Block the tel: navigation so jsdom-style protocol errors don't fire
      await page.route('tel:**', route => route.abort())

      const phoneLink = phoneLinkLocator.first()
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

    // Belt-and-suspenders: also skip if the auth-manager.setup.ts didn't
    // produce manager.json (e.g., login failed). Without this guard, every
    // test would fail with "ENOENT" when newContext tries to load the file.
    test.skip(
      !existsSync(MANAGER_AUTH_FILE),
      `${MANAGER_AUTH_FILE} not generated — check that auth-manager.setup.ts ran successfully`
    )

    test('should NOT render the "Клиент" column for Manager role', async ({ browser }) => {
      const context = await browser.newContext({ storageState: MANAGER_AUTH_FILE })
      const page = await context.newPage()
      try {
        await page.goto(ORDERS_ROUTE)
        await page.waitForLoadState('networkidle')

        const header = page.getByRole('columnheader', { name: /Клиент/i })
        await expect(header).toHaveCount(0)
      } finally {
        await context.close()
      }
    })

    test('should NOT fire any client-info API request for Manager role', async ({ browser }) => {
      const context = await browser.newContext({ storageState: MANAGER_AUTH_FILE })
      const page = await context.newPage()
      try {
        const requests = await captureClientInfoRequests(page, async () => {
          await page.goto(ORDERS_ROUTE)
          await page.waitForLoadState('networkidle')
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
      await page.waitForLoadState('networkidle')
      await responsePromise

      const visiblePii = await page.evaluate(() => {
        const cells = Array.from(document.querySelectorAll('td'))
        const phoneLinks = Array.from(document.querySelectorAll('a[href^="tel:"]'))
        const phones = phoneLinks.map(a => (a.getAttribute('href') ?? '').replace(/^tel:/, ''))
        const names = cells
          .map(c => c.textContent?.trim() ?? '')
          .filter(t => t.length > 1 && t.length < 50 && !t.includes('₽') && !/^\d+$/.test(t))
        return { phones, names }
      })

      const allNeedles = [...visiblePii.phones, ...visiblePii.names]
      // Visible-skip when fixture has no PII to verify (no silent pass)
      test.skip(
        allNeedles.length === 0,
        'No PII visible in fixture — sentinel needs API seeding (M2 backlog)'
      )

      // 2. Navigate through several pages to exercise unmount/mount cycles.
      // Routes are well-known and asserted to exist — no try/catch around navigation.
      const navigationCycle = ['/dashboard', ORDERS_ROUTE, '/dashboard'] as const
      for (const route of navigationCycle) {
        await page.goto(route)
        await page.waitForLoadState('networkidle') // deterministic wait, no sleep
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

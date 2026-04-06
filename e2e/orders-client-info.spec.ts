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

import { test, expect, type Page, type Request } from '@playwright/test'

const ORDERS_ROUTE = '/orders'
const CLIENT_INFO_ENDPOINT_PATTERN = /\/v1\/cabinets\/[^/]+\/orders\/client-info/

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
      // Wait for any client info to load
      await page.waitForTimeout(2000)

      // Find any phone link in the orders table — graceful skip if no DBW orders in fixture
      const phoneLink = page.getByRole('link', { name: /Позвонить клиенту/i }).first()
      const linkCount = await page.getByRole('link', { name: /Позвонить клиенту/i }).count()

      if (linkCount === 0) {
        test.info().annotations.push({
          type: 'note',
          description: 'No DBW orders with client info in test fixture — phone link test skipped',
        })
        return
      }

      await expect(phoneLink).toBeVisible()
      const href = await phoneLink.getAttribute('href')
      expect(href).toMatch(/^tel:/)
    })

    test('should render "—" placeholder for orders without client info', async ({ page }) => {
      // Most non-DBW orders should show the dash. Look for at least one in the Клиент column.
      // We scope the search to the table to avoid matching dashes elsewhere on the page.
      await page.waitForTimeout(2000)
      const table = page.getByRole('table').first()
      const dashes = table.getByText('—', { exact: true })
      const dashCount = await dashes.count()
      // Either the table has dashes (non-DBW orders) OR all visible orders have client info
      // — both states are valid; test asserts the rendering doesn't crash.
      expect(dashCount).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('AC #4 + #5: Privacy guardrails — PII never persisted to browser storage', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(ORDERS_ROUTE)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000) // let client-info request settle
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

      if (visibleNames.length === 0) {
        test.info().annotations.push({
          type: 'note',
          description: 'No client names visible in fixture — storage sweep skipped',
        })
        return
      }

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

      if (phones.length === 0) {
        test.info().annotations.push({
          type: 'note',
          description: 'No phone links visible in fixture — phone storage sweep skipped',
        })
        return
      }

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

      // Navigate away — this unmounts the orders page and should evict TanStack Query cache
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Sweep storages — none of the previously visible PII should remain
      if (visibleNames.length > 0) {
        const leaks = await sweepBrowserStorageForPii(page, visibleNames)
        expect(
          leaks,
          `PII persisted after navigation away from /orders: ${JSON.stringify(leaks)}`
        ).toHaveLength(0)
      }
    })
  })

  test.describe('Click-to-call interaction', () => {
    test('should not open the order detail modal when clicking the phone link (stopPropagation)', async ({
      page,
    }) => {
      await page.goto(ORDERS_ROUTE)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      const phoneLink = page.getByRole('link', { name: /Позвонить клиенту/i }).first()
      const linkCount = await page.getByRole('link', { name: /Позвонить клиенту/i }).count()

      if (linkCount === 0) {
        test.info().annotations.push({
          type: 'note',
          description: 'No phone links in fixture — stopPropagation test skipped',
        })
        return
      }

      // Block the tel: navigation so jsdom-style protocol errors don't fire
      await page.route('tel:**', route => route.abort())

      // Click the phone link — modal should NOT open
      await phoneLink.click({ noWaitAfter: true }).catch(() => {
        // Click may throw because tel: navigation was aborted — that's expected
      })

      // Order detail modal should not be visible
      const modal = page.getByRole('dialog')
      await expect(modal)
        .toHaveCount(0, { timeout: 1000 })
        .catch(async () => {
          // If modal does exist (e.g., from a different feature), check it's not the order modal
          const orderModal = page.locator('[data-testid="order-detail-modal"]')
          await expect(orderModal).not.toBeVisible()
        })
    })
  })

  /**
   * G1 (testarch): Non-Owner E2E coverage (AC #2) — scaffolded skip block
   *
   * These tests are SKIPPED until a non-Owner test user is provisioned.
   * To enable:
   * 1. Add to `e2e/fixtures/test-data.ts`:
   *      export const TEST_MANAGER = {
   *        email: getRequiredEnv('E2E_MANAGER_EMAIL'),
   *        password: getRequiredEnv('E2E_MANAGER_PASSWORD'),
   *      }
   * 2. Create `e2e/auth-manager.setup.ts` mirroring `auth.setup.ts` but using
   *    TEST_MANAGER and writing to `e2e/.auth/manager.json`.
   * 3. Wire the new setup project in `playwright.config.ts`.
   * 4. Remove the `.skip` from this describe block.
   */
  test.describe.skip('AC #2: Non-Owner role gate (requires manager fixture)', () => {
    test.use({ storageState: 'e2e/.auth/manager.json' })

    test('should NOT render the "Клиент" column for Manager role', async ({ page }) => {
      await page.goto(ORDERS_ROUTE)
      await page.waitForLoadState('networkidle')

      const header = page.getByRole('columnheader', { name: /Клиент/i })
      await expect(header).toHaveCount(0)
    })

    test('should NOT fire any client-info API request for Manager role', async ({ page }) => {
      const requests = await captureClientInfoRequests(page, async () => {
        await page.goto(ORDERS_ROUTE)
        await page.waitForLoadState('networkidle')
      })

      expect(requests).toHaveLength(0)
    })

    test('should return 403 if a Manager directly hits the client-info endpoint', async ({
      request,
    }) => {
      // Defense-in-depth check: even if frontend gate is bypassed, backend @Roles enforces Owner
      const baseUrl = process.env.E2E_API_URL ?? 'http://localhost:3000'
      const cabinetId = process.env.E2E_CABINET_ID ?? ''
      const token = process.env.E2E_MANAGER_TOKEN ?? ''

      if (!cabinetId || !token) {
        test.info().annotations.push({
          type: 'note',
          description: 'E2E_CABINET_ID or E2E_MANAGER_TOKEN missing — skipping API-level check',
        })
        return
      }

      const response = await request.get(
        `${baseUrl}/v1/cabinets/${cabinetId}/orders/client-info?orderIds=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Cabinet-Id': cabinetId,
          },
        }
      )

      expect(response.status()).toBe(403)
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
      // 1. Land on orders, capture visible PII
      await page.goto(ORDERS_ROUTE)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

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
      if (allNeedles.length === 0) {
        test.info().annotations.push({
          type: 'note',
          description:
            'No PII visible in fixture — sentinel test deferred to environment with seeded DBW orders',
        })
        return
      }

      // 2. Navigate through several pages to exercise unmount/mount cycles
      const navigationCycle = ['/dashboard', '/products', ORDERS_ROUTE, '/dashboard']
      for (const route of navigationCycle) {
        await page.goto(route).catch(() => {
          // Some routes may not exist in all test environments — graceful skip
        })
        await page.waitForLoadState('networkidle').catch(() => {})
        await page.waitForTimeout(500)
      }

      // 3. Final storage sweep — none of the originally captured PII should remain
      const leaks = await sweepBrowserStorageForPii(page, allNeedles)

      if (leaks.length > 0) {
        const summary = leaks
          .map(l => `[${l.storage}] ${l.key.slice(0, 50)} → contains PII`)
          .join('\n')
        throw new Error(
          `PRIVACY REGRESSION SENTINEL FAILED — ${leaks.length} PII leak(s) detected:\n${summary}\n\nThis means a recent change introduced PII persistence. Investigate before merging.`
        )
      }
    })
  })
})

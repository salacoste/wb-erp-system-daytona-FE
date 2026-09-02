import { test, expect } from './fixtures/network-test'
import { ROUTES } from './fixtures/test-data'

/**
 * D-1 (PB-1) defect-pinned spec: silent cabinet-create on a legacy session.
 *
 * Seeds the auth state WITHOUT a `sessionNonce` key entirely (a real user
 * persisted before Story 167.9, no fresh login). Before D-1, submitting the
 * cabinet-create form on such a session settled `indeterminate` and SILENTLY
 * swallowed the server-side-created cabinet (no toast, no navigation, no
 * recovery alert). The initiation mint (authStore.ensureSessionNonce, called
 * mint-before-capture in handleCreateCabinet) must settle the create `applied`
 * so the user reaches the WB-token step. Mirrors the Story 167.5 synthetic
 * seeding family (see e2e/onboarding.spec.ts beforeEach for the canon).
 */
test.describe('Onboarding cabinet create — legacy nonce-less session (D-1/PB-1)', () => {
  const CABINET_FAMILY_ENDPOINT = '**/v1/cabinets**'
  const CABINET_COLLECTION_PATH = '/v1/cabinets'
  const SYNTHETIC_CABINET_ID = 'd1-pb1-cabinet.invalid'
  const CABINET_RESOURCE_PATH = `/v1/cabinets/${SYNTHETIC_CABINET_ID}`
  const SYNTHETIC_CABINET_NAME = 'D-1 legacy session cabinet'
  // D-1 e2e lesson: the payload MUST be real base64url of the JSON — a
  // hand-assembled string that fails atob/JSON.parse makes isTokenExpired()
  // fail-safe to true, the proactive useAuth refresh fires, and (with the BE
  // having no /v1/auth/refresh route) the session logs out mid-test.
  const SYNTHETIC_ORIGINAL_TOKEN = [
    'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0',
    'eyJleHAiOjQxMDI0NDQ4MDAsInN1YiI6ImQxLXBiMS1vd25lci5pbnZhbGlkIn0',
    'd1-pb1',
  ].join('.')
  const SYNTHETIC_REFRESHED_TOKEN = [
    'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0',
    'eyJleHAiOjQxMDI0NDQ4MDAsInN1YiI6ImQxLXBiMS1yZWZyZXNoZWQuaW52YWxpZCJ9',
    'd1-pb1-refreshed',
  ].join('.')
  const SYNTHETIC_APP_ORIGIN = 'http://localhost:3100'

  test.use({ storageState: { cookies: [], origins: [] } })

  test.beforeEach(async ({ page }) => {
    await page
      .context()
      .addCookies([
        { name: 'auth-token', value: SYNTHETIC_ORIGINAL_TOKEN, url: SYNTHETIC_APP_ORIGIN },
      ])
    await page.addInitScript(originalToken => {
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: {
              id: 'd1-pb1-owner.invalid',
              email: 'd1-pb1-owner@example.invalid',
              role: 'Owner',
              cabinet_ids: [],
            },
            token: originalToken,
            cabinetId: null,
            // D-1 (PB-1) defect scenario: the persisted session predates
            // sessionNonce — the key is absent entirely, like a real user
            // without a fresh login. The initiation mint must cover this.
          },
          version: 0,
        })
      )
    }, SYNTHETIC_ORIGINAL_TOKEN)
  })

  test('[P0] legacy nonce-less session still settles the create and reaches the WB-token step', async ({
    page,
  }) => {
    let postAttempts = 0
    let putAttempts = 0

    await page.route(CABINET_FAMILY_ENDPOINT, async route => {
      const request = route.request()
      const method = request.method()
      const pathname = new URL(request.url()).pathname

      if (pathname === CABINET_COLLECTION_PATH && method === 'POST') {
        postAttempts += 1
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: SYNTHETIC_CABINET_ID,
            name: SYNTHETIC_CABINET_NAME,
            isActive: true,
            createdAt: '2026-09-02T00:00:00.000Z',
            updatedAt: '2026-09-02T00:00:00.000Z',
            newToken: SYNTHETIC_REFRESHED_TOKEN,
            operationId: '11111111-1111-4111-8111-111111111111',
            status: 'succeeded',
          }),
        })
        return
      }

      if (pathname === CABINET_RESOURCE_PATH && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: SYNTHETIC_CABINET_ID,
            name: SYNTHETIC_CABINET_NAME,
            isActive: true,
            createdAt: '2026-09-02T00:00:00.000Z',
            updatedAt: '2026-09-02T00:00:00.000Z',
            taxSystem: null,
            taxRate: null,
            vatPayer: false,
            vatRate: null,
            targetMarginPct: null,
          }),
        })
        return
      }

      if (pathname === CABINET_RESOURCE_PATH && method === 'PUT') {
        putAttempts += 1
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: SYNTHETIC_CABINET_ID,
            name: SYNTHETIC_CABINET_NAME,
            isActive: true,
            createdAt: '2026-09-02T00:00:00.000Z',
            updatedAt: '2026-09-02T00:00:00.000Z',
            taxSystem: null,
            taxRate: null,
            vatPayer: false,
            vatRate: null,
            targetMarginPct: 37,
          }),
        })
        return
      }

      await route.fulfill({
        status: 405,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'unexpected synthetic cabinet-family request' }),
      })
    })

    await page.goto(ROUTES.onboarding.cabinet, { waitUntil: 'domcontentloaded' })
    const nameInput = page.getByLabel(/^Название кабинета/)
    const marginInput = page.getByLabel(/^Целевая маржа/)
    const submit = page.getByRole('button', { name: 'Создать кабинет', exact: true })
    await expect(submit).toBeEnabled()
    await nameInput.fill(SYNTHETIC_CABINET_NAME)
    await marginInput.fill('37')

    // Success affordance of the create flow: navigation to the WB-token step.
    // Before D-1 this never happened for a nonce-less session — the create
    // silently settled indeterminate and the user stayed on /cabinet.
    const wbTokenNavigation = page.waitForURL(/\/wb-token(?:\?|$)/)
    await submit.click()
    await wbTokenNavigation
    await expect.poll(() => postAttempts).toBe(1)
    await expect.poll(() => putAttempts).toBe(1)
  })

  test('[P1] legacy nonce-less session renders a usable form with no recovery alert before submission', async ({
    page,
  }) => {
    await page.route(CABINET_FAMILY_ENDPOINT, async route => {
      await route.fulfill({
        status: 405,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'unexpected synthetic cabinet-family request' }),
      })
    })

    await page.goto(ROUTES.onboarding.cabinet, { waitUntil: 'domcontentloaded' })

    // No recovery-blocking alert: the legacy session must not be treated as an
    // unrecoverable in-flight operation before the user does anything.
    await expect(page.locator('#cabinet-creation-recovery-error')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Создать кабинет', exact: true })).toBeEnabled()
    await expect(page.getByLabel(/^Название кабинета/)).toBeEditable()
    await expect(page.getByLabel(/^Целевая маржа/)).toBeEditable()
  })
})

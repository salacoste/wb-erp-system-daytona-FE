import { test, expect, type Page } from './fixtures/network-test'
import { ROUTES } from './fixtures/test-data'

/**
 * D-1 (PB-1) — nonce-less-session coverage for cabinet create.
 *
 * [P0] is the TRUE defect pin for D-1's initiation mint: seed a NORMAL nonce
 * (Story 167.5 canonical family), then null the LIVE store's nonce AFTER
 * rehydration via the only supported path — a cross-tab `storage` event from
 * a second page in the same context (a same-tab setItem does NOT fire it).
 * With D-1, the initiation mint (authStore.ensureSessionNonce,
 * mint-before-capture in handleCreateCabinet) settles the create `applied`
 * and the user reaches the WB-token step. Without D-1 the captured nonce is
 * null → `indeterminate` → the create is silently swallowed and this spec
 * FAILS (stays on /cabinet).
 *
 * [P1] is a composite regression check of the nonce-less-session CLASS
 * (rehydrate mint + form usability), NOT a D-1 defect pin: the user-visible
 * PB-1 fix for legacy sessions was predominantly delivered by the Story 167.9
 * rehydrate mint (already on main — it fires on this page load). D-1's
 * initiation mint closes the residual identity gaps (a nonce-less live store
 * that rehydration no longer repairs, e.g. a cross-tab sync that bypassed
 * rehydrate) and is defect-pinned by the [P0] two-tab test plus the unit test
 * src/services/cabinets.service.settlement.test.ts ('legacy nonce-less
 * session mints a nonce at initiation and settles applied').
 *
 * JWT payload lesson: the synthetic token payloads below are REAL base64url
 * of the JSON — a corrupted payload makes isTokenExpired() fail-safe to true,
 * the proactive refresh fires, and (the BE having no /v1/auth/refresh route)
 * the session logs out mid-test.
 *
 * Mirrors the Story 167.5 synthetic seeding family (see
 * e2e/onboarding.spec.ts beforeEach for the canon).
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
  const SYNTHETIC_SESSION_NONCE = 'd1-pb1-session-nonce.invalid'
  const SYNTHETIC_APP_ORIGIN = 'http://localhost:3100'

  test.use({ storageState: { cookies: [], origins: [] } })

  /**
   * Seeds auth-storage before any app script runs. An OMITTED nonce means the
   * key is absent entirely (a session persisted before Story 167.9); a string
   * means a normal post-167.9 session. Note: Playwright serializes init-script
   * args to JSON, so an `undefined` nonce arrives as `null` — hence the
   * truthiness check, not `!== undefined`.
   */
  const seedAuthStorage = (page: Page, originalToken: string, sessionNonce?: string) => {
    const initArgs: [string, string | null] = [originalToken, sessionNonce ?? null]
    return page.addInitScript(([token, nonce]) => {
      const state: Record<string, unknown> = {
        user: {
          id: 'd1-pb1-owner.invalid',
          email: 'd1-pb1-owner@example.invalid',
          role: 'Owner',
          cabinet_ids: [],
        },
        token,
        cabinetId: null,
      }
      if (nonce) state.sessionNonce = nonce
      window.localStorage.setItem('auth-storage', JSON.stringify({ state, version: 0 }))
    }, initArgs)
  }

  test.beforeEach(async ({ page }) => {
    await page
      .context()
      .addCookies([
        { name: 'auth-token', value: SYNTHETIC_ORIGINAL_TOKEN, url: SYNTHETIC_APP_ORIGIN },
      ])
  })

  test('[P0] initiation mint settles the create when the live nonce is nulled after rehydration', async ({
    page,
  }) => {
    let postAttempts = 0
    let putAttempts = 0

    // Canonical-family seeding: a NORMAL post-167.9 session (nonce present),
    // so main's rehydrate mint does NOT fire on page load — the ONLY mint
    // left to save this create is D-1's initiation mint.
    await seedAuthStorage(page, SYNTHETIC_ORIGINAL_TOKEN, SYNTHETIC_SESSION_NONCE)

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

    // Null the LIVE store's nonce via the only supported path: a cross-tab
    // `storage` event (a same-tab setItem does NOT fire it). The second page
    // in the SAME context rewrites the FULL auth-storage blob with an explicit
    // `sessionNonce: null` (same user/token/cabinetId as the seed); authStore's
    // storage-sync handler (registered in onRehydrateStorage) setState-merges
    // the explicit null into the FIRST tab's live store — zustand's shallow
    // merge replaces every key present in the payload, so the nonce is nulled.
    // The sync page is closed immediately so its still-non-null in-memory copy
    // cannot write the nonce back.
    const syncPage = await page.context().newPage()
    await syncPage.goto(ROUTES.onboarding.cabinet, { waitUntil: 'domcontentloaded' })
    await syncPage.evaluate(originalToken => {
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
            sessionNonce: null,
          },
          version: 0,
        })
      )
    }, SYNTHETIC_ORIGINAL_TOKEN)
    await syncPage.close()
    // Pass-3 review: pin the precondition the defect-pin depends on — the
    // cross-tab storage event merged sessionNonce: null into tab 1's persisted
    // state (the sync handler is the only writer of this key from the sync page).
    // Without this, a dropped storage event would let the seeded nonce survive
    // and the create would settle applied even on main (vacuous green).
    await page.waitForFunction(() => {
      const raw = window.localStorage.getItem('auth-storage')
      if (!raw) return false
      try {
        return JSON.parse(raw).state?.sessionNonce === null
      } catch {
        return false
      }
    })

    const nameInput = page.getByLabel(/^Название кабинета/)
    const marginInput = page.getByLabel(/^Целевая маржа/)
    const submit = page.getByRole('button', { name: 'Создать кабинет', exact: true })
    await expect(submit).toBeEnabled()
    await nameInput.fill(SYNTHETIC_CABINET_NAME)
    await marginInput.fill('37')

    // Success affordance of the create flow: navigation to the WB-token step.
    // WITH D-1: initiation mint → settlement `applied` → navigation fires.
    // WITHOUT D-1 (main): the captured nonce is null → `indeterminate` → the
    // create is silently swallowed, the user stays on /cabinet, and this
    // waitForURL times out — the TRUE defect pin.
    const wbTokenNavigation = page.waitForURL(/\/wb-token(?:\?|$)/)
    await submit.click()
    await wbTokenNavigation
    await expect.poll(() => postAttempts).toBe(1)
    await expect.poll(() => putAttempts).toBe(1)
  })

  test('[P1] nonce-less-session class: seeded-without-nonce session renders a usable form with no recovery alert (composite regression)', async ({
    page,
  }) => {
    // Composite regression check of the nonce-less-session CLASS, not a D-1
    // defect pin: the user-visible PB-1 fix for legacy sessions was
    // predominantly delivered by the Story 167.9 rehydrate mint (on main —
    // it fires on this page load). D-1's initiation mint closes the residual
    // identity gaps and is defect-pinned by the [P0] two-tab test plus the
    // unit test src/services/cabinets.service.settlement.test.ts ('legacy
    // nonce-less session mints a nonce at initiation and settles applied').
    await seedAuthStorage(page, SYNTHETIC_ORIGINAL_TOKEN)

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

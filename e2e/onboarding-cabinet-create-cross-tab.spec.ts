import { test, expect, type Page } from './fixtures/network-test'
import { ROUTES } from './fixtures/test-data'

/**
 * FE-D5 — cross-tab cabinet-create duplicate prevention (Web Locks + claim).
 *
 * Two tabs of the SAME context (shared localStorage + navigator.locks) submit
 * the cabinet-create form simultaneously. Exactly ONE POST /v1/cabinets may
 * reach the wire; the second tab must end blocked with RU copy instead of
 * creating a duplicate multi-tenant cabinet.
 *
 * Negative control: on unfixed code tab B mints its own Idempotency-Key and
 * POSTs → this spec fails on the POST-count assertion.
 *
 * Determinism: tab A's POST is held open by a deferred route gate, so tab A
 * genuinely holds the create lock when tab B submits. Tab A's auth-write lands
 * in the persisted auth-storage blob BEFORE the lock release (synchronous
 * persist), so tab B's in-lock shared re-check needs no storage-event timing.
 *
 * Style rules honored: no waitForTimeout/networkidle; domcontentloaded
 * navigation; POST intercepted at the CONTEXT level (both tabs — no real
 * cabinet creation); count assertions via expect.poll, never wall-clock
 * durations.
 */
test.describe('Onboarding cabinet create — cross-tab duplicate prevention (FE-D5)', () => {
  const CABINET_FAMILY_ENDPOINT = '**/v1/cabinets**'
  const CABINET_COLLECTION_PATH = '/v1/cabinets'
  const SYNTHETIC_CABINET_ID = 'fe-d5-cabinet.invalid'
  const CABINET_RESOURCE_PATH = `/v1/cabinets/${SYNTHETIC_CABINET_ID}`
  const SYNTHETIC_CABINET_NAME = 'FE-D5 cross-tab cabinet'
  const SYNTHETIC_ORIGINAL_TOKEN = [
    'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0',
    'eyJleHAiOjQxMDI0NDQ4MDAsInN1YiI6ImZlLWQ1LW93bmVyLmludmFsaWQifQ',
    'fe-d5',
  ].join('.')
  const SYNTHETIC_REFRESHED_TOKEN = [
    'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0',
    'eyJleHAiOjQxMDI0NDQ4MDAsInN1YiI6ImZlLWQ1LXJlZnJlc2hlZC5pbnZhbGlkIn0',
    'fe-d5-refreshed',
  ].join('.')
  const SYNTHETIC_SESSION_NONCE = 'fe-d5-session-nonce.invalid'
  const SYNTHETIC_APP_ORIGIN = 'http://localhost:3100'

  test.use({ storageState: { cookies: [], origins: [] } })

  /** Seeds a normal post-167.9 session (nonce present) before app scripts run. */
  const seedAuthStorage = (page: Page, originalToken: string, sessionNonce?: string) => {
    const initArgs: [string, string | null] = [originalToken, sessionNonce ?? null]
    return page.addInitScript(([token, nonce]) => {
      const state: Record<string, unknown> = {
        user: {
          id: 'fe-d5-owner.invalid',
          email: 'fe-d5-owner@example.invalid',
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

  test('two simultaneous tab submits produce exactly one POST and block the second tab', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    let postAttempts = 0
    let releaseTabACreate!: () => void
    const tabACreateGate = new Promise<void>(resolve => {
      releaseTabACreate = resolve
    })

    await seedAuthStorage(page, SYNTHETIC_ORIGINAL_TOKEN, SYNTHETIC_SESSION_NONCE)
    await page
      .context()
      .addCookies([
        { name: 'auth-token', value: SYNTHETIC_ORIGINAL_TOKEN, url: SYNTHETIC_APP_ORIGIN },
      ])

    // Context-level (not page-level) so tab B's POSTs are intercepted and
    // counted too — page.route() never sees another page's requests (pass-4 F1).
    await page.context().route(CABINET_FAMILY_ENDPOINT, async route => {
      const request = route.request()
      const method = request.method()
      const pathname = new URL(request.url()).pathname

      if (pathname === CABINET_COLLECTION_PATH && method === 'POST') {
        postAttempts += 1
        // Hold tab A's create in flight (lock held) until the test releases it.
        await tabACreateGate
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: SYNTHETIC_CABINET_ID,
            name: SYNTHETIC_CABINET_NAME,
            isActive: true,
            createdAt: '2026-09-06T00:00:00.000Z',
            updatedAt: '2026-09-06T00:00:00.000Z',
            newToken: SYNTHETIC_REFRESHED_TOKEN,
            operationId: '11111111-1111-4111-8111-111111111111',
            status: 'succeeded',
          }),
        })
        return
      }

      if (pathname === CABINET_RESOURCE_PATH && method === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: SYNTHETIC_CABINET_ID,
            name: SYNTHETIC_CABINET_NAME,
            isActive: true,
            createdAt: '2026-09-06T00:00:00.000Z',
            updatedAt: '2026-09-06T00:00:00.000Z',
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

    // Tab B: same context → shared localStorage + navigator.locks.
    const tabB = await page.context().newPage()
    await seedAuthStorage(tabB, SYNTHETIC_ORIGINAL_TOKEN, SYNTHETIC_SESSION_NONCE)
    await tabB.goto(ROUTES.onboarding.cabinet, { waitUntil: 'domcontentloaded' })

    const fillAndSubmit = async (target: Page) => {
      const submit = target.getByRole('button', { name: 'Создать кабинет', exact: true })
      await expect(submit).toBeEnabled()
      await target.getByLabel(/^Название кабинета/).fill(SYNTHETIC_CABINET_NAME)
      await target.getByLabel(/^Целевая маржа/).fill('37')
      await submit.click()
    }

    // Tab A starts the create; its POST reaches the wire and hangs on the gate.
    await fillAndSubmit(page)
    await expect.poll(() => postAttempts, { timeout: 10_000 }).toBe(1)

    // Tab B submits while tab A holds the create lock.
    await fillAndSubmit(tabB)

    // Release tab A: it settles (auth-write persists cabinetId synchronously
    // BEFORE the lock release), navigates on, and cleans the claim.
    releaseTabACreate()
    const tabAWbToken = page.waitForURL(/\/wb-token(?:\?|$)/)
    await tabAWbToken

    // THE FE-D5 PIN: still exactly one POST. On unfixed code tab B's own POST
    // fired here (count 2) and tab B navigated away instead of showing the block.
    await expect.poll(() => postAttempts, { timeout: 10_000 }).toBe(1)
    await expect(
      tabB.locator('#cabinet-creation-recovery-error'),
      'tab B must show the RU block copy instead of creating a duplicate cabinet'
    ).toHaveText(/уже создан в другой вкладке|уже выполняется в другой вкладке/, {
      timeout: 10_000,
    })
    // R1 + WAVE-4 (FAILURE 2 root cause): the blocked branch CLEARS tab B's
    // admission marker (reconcile=true), so its form RE-ENABLES. But once tab
    // A settles, tab B's auth sync surfaces the cabinet — the submission gate
    // then CORRECTLY routes B's resubmit down the margin-UPDATE flow (button
    // label swaps), which must complete with still exactly ONE POST and no
    // duplicate cabinet. The prior "second block alert" expectation here was
    // wrong: with the cabinet visible, the resubmit is not a create attempt.
    const tabBUpdateSubmit = tabB.getByRole('button', {
      name: 'Сохранить и продолжить',
      exact: true,
    })
    await expect(tabBUpdateSubmit).toBeVisible({ timeout: 10_000 })
    await expect(tabB.locator('#cabinet-creation-recovery-error')).toHaveText(
      /уже создан в другой вкладке|уже выполняется в другой вкладке/,
      { timeout: 10_000 }
    )
    await tabBUpdateSubmit.click()
    await tabB.waitForURL(/\/wb-token(?:\?|$)/, { timeout: 15_000 })
    await expect.poll(() => postAttempts, { timeout: 10_000 }).toBe(1)
  })
})

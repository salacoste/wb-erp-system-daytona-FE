/**
 * D-2 (PB-3) — defect-pinned SYNTHETIC spec for the reactive 401-refresh
 * interceptor (src/lib/api-client-refresh.ts + the 401 gate in api-client.ts).
 *
 * SYNTHETIC by design (deterministic wire control): both tests route-fulfill
 * every /v1 call locally. The LIVE contract chain was verified separately
 * (2026-09-03T02:02Z: refresh 200 + single-use revocation 401 TOKEN_REVOKED
 * + health healthy — see docs/request-backend/230-auth-refresh-endpoint-
 * missing.md § ФИНАЛЬНАЯ live-верификация).
 *
 * Page under test: /analytics/alerts — the lightest data-bearing dashboard
 * route (3 page-level protected GETs on load + the fixed dashboard-shell
 * surface). The summary KPI «Всего за 7 дней» renders unambiguous
 * data-dependent content on success and the em-dash placeholder once the query
 * is terminal-failed, so the 401 → refresh → replay outcome is directly
 * observable.
 *
 * Interception map (single wildcard page.route dispatcher on all /v1 calls):
 * - POST /v1/auth/refresh → 200 { data: { token: <refreshed> } } (test 1) | 401 (test 2)
 * - GET  /v1/alerts/summary?days=7 → 1st call 401, replay 200 (test 1) | always 401 (test 2)
 * - GET  /v1/alerts/rules · /v1/alerts/history → 200 { items: [], total: 0, nextCursor: null }
 * - Dashboard shell: GET /v1/cabinets/{id} (+ /seller-info, /jam-status,
 *   /token-status) and /v1/analytics/supply-planning → benign 200 fixtures
 * - Catch-all → 200 {} (a non-enumerated local call must not break the shell)
 *
 * apiClient data-unwrap semantics: the refresh response is consumed via
 * `rawData.data ?? rawData` (api-client.ts request()), so BOTH the annex flat
 * form `{ "token": ... }` and the `{ data: { token } }` envelope unwrap to
 * RefreshTokenResponse — this spec serves the envelope.
 *
 * Session seeding mirrors the D-1 canon
 * (e2e/onboarding-cabinet-create-nonce-mint.spec.ts): empty storageState +
 * init-script auth-storage + auth-token cookie. The JWT payloads are REAL
 * base64url of the JSON by construction (a corrupted payload makes
 * isTokenExpired() fail-safe to true and logs the session out mid-test).
 */

import type { Page, Route } from '@playwright/test'
import { expect, test } from './fixtures/network-test'

const APP_ORIGIN = 'http://localhost:3100'
const ALERTS_ROUTE = '/analytics/alerts'
const CABINET_ID = 'd2-pb3-cabinet'
const SYNTHETIC_SESSION_NONCE = 'd2-pb3-session-nonce.invalid'
const SUMMARY_PATH = '/v1/alerts/summary'

/** 2100-01-01T00:00:00Z — far beyond isTokenExpired's 5-minute refresh buffer. */
const TOKEN_EXP = 4102444800

const toBase64Url = (json: string): string =>
  Buffer.from(json, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

/** Real base64url JWT (alg:none header is the D-1 canon family signature). */
const makeSyntheticJwt = (sub: string): string =>
  [
    'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0',
    toBase64Url(JSON.stringify({ exp: TOKEN_EXP, sub })),
    `sig-${sub}`,
  ].join('.')

const ORIGINAL_TOKEN = makeSyntheticJwt('d2-pb3-e2e.invalid')
const REFRESHED_TOKEN = makeSyntheticJwt('d2-pb3-refreshed.invalid')

/** Flat summary shape — getAlertSummary uses skipDataUnwrap (normalizer reads it raw). */
const SYNTHETIC_SUMMARY = {
  period: '7d',
  totalAlerts: 42,
  byType: [],
  bySeverity: { critical: 5, warning: 7, info: 30 },
}

type RefreshScenario = 'refresh-recovers' | 'refresh-fails'

type ApiProbe = {
  summaryAttempts: number
  summaryBearers: string[]
  refreshCalls: number
  refreshBearers: string[]
}

const createProbe = (): ApiProbe => ({
  summaryAttempts: 0,
  summaryBearers: [],
  refreshCalls: 0,
  refreshBearers: [],
})

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
}

/** Canonical synthetic seeding: auth-token cookie + init-script auth-storage. */
async function installSyntheticSession(page: Page, token: string): Promise<void> {
  await page.context().addCookies([{ name: 'auth-token', value: token, url: APP_ORIGIN }])
  // Init scripts are serialized — every closure value must arrive via the arg.
  await page.addInitScript(
    ({ storedToken, nonce, cabinetId }) => {
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: {
              id: 'd2-pb3-user.invalid',
              email: 'd2-pb3@example.invalid',
              role: 'Owner',
              cabinet_ids: [cabinetId],
            },
            token: storedToken,
            cabinetId,
            sessionNonce: nonce,
          },
          version: 0,
        })
      )
    },
    { storedToken: token, nonce: SYNTHETIC_SESSION_NONCE, cabinetId: CABINET_ID }
  )
}

async function installSyntheticApi(page: Page, probe: ApiProbe, scenario: RefreshScenario) {
  await page.route('**/v1/**', async route => {
    const request = route.request()
    const { pathname } = new URL(request.url())

    if (pathname === '/v1/auth/refresh') {
      probe.refreshCalls += 1
      probe.refreshBearers.push((await request.headerValue('authorization')) ?? '')
      if (scenario === 'refresh-recovers') {
        return fulfillJson(route, { data: { token: REFRESHED_TOKEN } })
      }
      return fulfillJson(route, { message: 'refresh rejected' }, 401)
    }

    if (pathname === SUMMARY_PATH) {
      probe.summaryAttempts += 1
      probe.summaryBearers.push((await request.headerValue('authorization')) ?? '')
      // 'refresh-recovers': the FIRST call 401s and the interceptor's single
      // replay (2nd attempt, riding the rotated store token) gets 200.
      // 'refresh-fails': recovery is impossible, so every attempt stays 401
      // (there is no replay — the original ApiError surfaces instead).
      if (probe.summaryAttempts === 1 || scenario === 'refresh-fails') {
        return fulfillJson(route, { message: 'Token expired' }, 401)
      }
      return fulfillJson(route, SYNTHETIC_SUMMARY)
    }

    if (pathname === '/v1/alerts/rules' || pathname === '/v1/alerts/history') {
      return fulfillJson(route, { items: [], total: 0, nextCursor: null })
    }

    if (pathname === `/v1/cabinets/${CABINET_ID}`) {
      return fulfillJson(route, {
        id: CABINET_ID,
        name: 'D-2 synthetic cabinet',
        isActive: true,
        cabinetKeys: [{ keyName: 'wb_api_token', updatedAt: '2026-09-02T00:00:00Z' }],
      })
    }
    if (pathname === `/v1/cabinets/${CABINET_ID}/seller-info`) {
      return fulfillJson(route, {
        name: 'D-2 продавец',
        sid: 'd2-pb3-seller',
        tradeMark: 'D-2',
        available: true,
      })
    }
    if (pathname === `/v1/cabinets/${CABINET_ID}/jam-status`) {
      return fulfillJson(route, {
        tier: 'none',
        available: true,
        searchTextsLimit: 0,
        checkedAt: '2026-09-02T00:00:00Z',
        probeCallsMade: 0,
      })
    }
    if (pathname === `/v1/cabinets/${CABINET_ID}/token-status`) {
      return fulfillJson(route, { healthy: true, errorCount: 0 })
    }
    if (pathname === '/v1/analytics/supply-planning') {
      return fulfillJson(route, { meta: {}, summary: {}, data: [] })
    }

    return fulfillJson(route, {})
  })
}

/** The summary KPI value node: label parent wraps label + formatted value. */
const totalAlertsCard = (page: Page) => page.getByText('Всего за 7 дней').locator('..')

test.describe('D-2 (PB-3) reactive 401 refresh (synthetic)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('[P0] reactive refresh recovers a mid-session 401 (synthetic)', async ({ page }) => {
    const probe = createProbe()
    await installSyntheticSession(page, ORIGINAL_TOKEN)
    await installSyntheticApi(page, probe, 'refresh-recovers')

    await page.goto(ALERTS_ROUTE, { waitUntil: 'domcontentloaded' })

    // Data survived the 401 → refresh → replay transparently: the KPI shows
    // the REPLAYED fixture total (42 — an empty summary would render 0).
    await expect(totalAlertsCard(page)).toContainText(/42/)

    // No redirect to /login — the session survived the mid-page 401.
    await expect(page).toHaveURL(/\/analytics\/alerts/)

    // Exactly ONE refresh POST happened (single-flight core).
    await expect.poll(() => probe.refreshCalls).toBe(1)
    // The protected endpoint fired exactly twice: initial 401 + the one replay.
    await expect.poll(() => probe.summaryAttempts).toBe(2)

    // The refresh authenticated with the still-valid store Bearer (annex
    // contract), and the replay rode the ROTATED token — not the revoked one.
    expect(probe.refreshBearers[0]).toBe(`Bearer ${ORIGINAL_TOKEN}`)
    expect(probe.summaryBearers[0]).toBe(`Bearer ${ORIGINAL_TOKEN}`)
    expect(probe.summaryBearers[1]).toBe(`Bearer ${REFRESHED_TOKEN}`)
  })

  test('[P1] refresh failure stays on the error path (no loop)', async ({ page }) => {
    const probe = createProbe()
    await installSyntheticSession(page, ORIGINAL_TOKEN)
    await installSyntheticApi(page, probe, 'refresh-fails')

    await page.goto(ALERTS_ROUTE, { waitUntil: 'domcontentloaded' })

    // Terminal error rendering: with the query failed, the KPI value falls
    // back to the em-dash placeholder (data is undefined, loading is over).
    await expect(totalAlertsCard(page)).toContainText(/—/)

    // Bounded, not looped: the app QueryClient retries once (retry:1 in
    // providers.tsx), so the always-401 endpoint yields 2 attempts, each
    // single-flight-refreshed once → exactly 2 refresh POSTs, then terminal.
    await expect.poll(() => probe.refreshCalls).toBe(2)
    await expect.poll(() => probe.summaryAttempts).toBe(2)

    // Nothing rotated (refresh never succeeded) — every attempt still carried
    // the original token.
    expect(probe.summaryBearers.every(bearer => bearer === `Bearer ${ORIGINAL_TOKEN}`)).toBe(true)

    // Stays put — no redirect to /login on a failed refresh.
    await expect(page).toHaveURL(/\/analytics\/alerts/)

    // The spec's single bounded settle (1200ms ≤ 1500ms): the TanStack retry
    // delay is 1000ms, so the retry chain has fully settled by now.
    // Re-asserting the exact counts proves the failure path is TERMINAL —
    // a refresh loop would keep growing both counters past the retry budget.
    await page.waitForTimeout(1200)
    expect(probe.refreshCalls).toBe(2)
    expect(probe.summaryAttempts).toBe(2)
  })
})

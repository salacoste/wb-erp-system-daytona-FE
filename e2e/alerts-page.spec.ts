/**
 * E2E Tests: Alerts Dashboard Page
 * Alerts Dashboard — notification rules management, history, and summary KPIs
 *
 * Conventions (from CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - domcontentloaded + element-presence waits only (anti-pattern #9 — no networkidle on dashboards)
 * - No hard waits (anti-pattern #7); use waitForResponse or element assertions with TIMEOUTS.api
 * - test.skip(condition, reason) for graceful conditional skips (anti-pattern #6)
 * - Locale assertions use regex /\d+/, /₽/ — not exact formatted strings
 *
 * Run: npx playwright test e2e/alerts-page.spec.ts
 */

import { test, expect } from './fixtures/network-test'
import { TIMEOUTS } from './fixtures/test-data'

const ALERTS_URL = '/analytics/alerts'
const ALERTS_RULES_API = '**/v1/alerts/rules'
const ALERTS_HISTORY_API = '**/v1/alerts/history**'
const ALERTS_SUMMARY_API = '**/v1/alerts/summary**'

const TEST_TIMEOUT = 60_000

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function makeMockRule(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rule-1',
    cabinetId: 'cab-1',
    alertType: 'margin_drop',
    enabled: true,
    thresholds: { pct: 10 },
    cooldownMinutes: 30,
    severity: 'critical',
    channels: { telegram: true },
    label: 'Падение маржи',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
    ...overrides,
  }
}

function makeMockHistoryItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'hist-1',
    cabinetId: 'cab-1',
    channel: 'telegram',
    eventType: 'margin_drop',
    messageText: 'Маржа упала на 15%',
    status: 'sent',
    createdAt: '2026-06-01T12:00:00Z',
    sentAt: '2026-06-01T12:00:01Z',
    ...overrides,
  }
}

function makeMockSummary(overrides: Record<string, unknown> = {}) {
  return {
    period: '7d',
    totalAlerts: 12,
    byType: [
      {
        alertType: 'margin_drop',
        severity: 'critical',
        count: 5,
        lastTriggered: '2026-06-01T12:00:00Z',
      },
      {
        alertType: 'stockout',
        severity: 'warning',
        count: 7,
        lastTriggered: '2026-06-02T08:00:00Z',
      },
    ],
    bySeverity: { critical: 5, warning: 7, info: 0 },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to alerts page and wait for the heading to confirm hydration */
async function gotoAlerts(page: import('@playwright/test').Page) {
  await page.goto(ALERTS_URL, { waitUntil: 'domcontentloaded' })
  await page
    .getByRole('heading', { name: 'Центр уведомлений' })
    .waitFor({ state: 'visible', timeout: TIMEOUTS.api })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Alerts Dashboard page', () => {
  // -------------------------------------------------------------------------
  // 1. Page renders with heading and tabs
  // -------------------------------------------------------------------------
  test('page loads with Центр уведомлений heading and tab navigation', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await gotoAlerts(page)

    await expect(page.getByRole('heading', { name: 'Центр уведомлений' })).toBeVisible()

    // Three tabs must be present
    await expect(page.getByRole('tab', { name: 'Обзор' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Активные правила' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'История' })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // 2. Summary tab: 4 metric cards render with labels
  // -------------------------------------------------------------------------
  test('summary tab displays 4 metric cards with labels', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    const mockSummary = makeMockSummary()
    await page.route(ALERTS_SUMMARY_API, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSummary),
      })
    )
    await page.route(ALERTS_RULES_API, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    )
    await page.route(ALERTS_HISTORY_API, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    )

    await gotoAlerts(page)

    // Summary tab is active by default — check for card labels
    const expectedLabels = ['Всего за 7 дней', 'Критические', 'Предупреждения', 'Информационные']
    for (const label of expectedLabels) {
      await expect(page.getByText(label).first()).toBeVisible({ timeout: TIMEOUTS.api })
    }
  })

  // -------------------------------------------------------------------------
  // 3. Rules tab: alert rules list with toggle switches
  // -------------------------------------------------------------------------
  test('rules tab displays alert rules with toggle switches', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    const mockRules = [
      makeMockRule({ id: 'r1', label: 'Падение маржи', severity: 'critical', enabled: true }),
      makeMockRule({
        id: 'r2',
        label: 'Обнуление склада',
        alertType: 'stockout',
        severity: 'warning',
        enabled: false,
      }),
    ]

    await page.route(ALERTS_RULES_API, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRules),
      })
    )
    await page.route(ALERTS_SUMMARY_API, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeMockSummary()),
      })
    )
    await page.route(ALERTS_HISTORY_API, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    )

    await gotoAlerts(page)

    // Switch to rules tab
    await page.getByRole('tab', { name: 'Активные правила' }).click()

    // Card title must show rule count
    await expect(page.getByText('Правила оповещений (2)')).toBeVisible({ timeout: TIMEOUTS.api })

    // Rule labels must be visible
    await expect(page.getByText('Падение маржи').first()).toBeVisible()
    await expect(page.getByText('Обнуление склада').first()).toBeVisible()

    // Severity badges
    await expect(page.getByText('Критический').first()).toBeVisible()
    await expect(page.getByText('Внимание').first()).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // 4. History tab: history table renders with data
  // -------------------------------------------------------------------------
  test('history tab displays notification history table', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    const mockHistory = [
      makeMockHistoryItem({
        id: 'h1',
        eventType: 'margin_drop',
        messageText: 'Маржа упала на 15%',
        status: 'sent',
      }),
      makeMockHistoryItem({
        id: 'h2',
        eventType: 'stockout',
        messageText: 'Склад обнулился',
        status: 'pending',
      }),
    ]

    await page.route(ALERTS_HISTORY_API, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockHistory),
      })
    )
    await page.route(ALERTS_RULES_API, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    )
    await page.route(ALERTS_SUMMARY_API, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeMockSummary()),
      })
    )

    await gotoAlerts(page)

    // Switch to history tab
    await page.getByRole('tab', { name: 'История' }).click()

    // Table header must include column names
    await expect(page.getByText('История уведомлений (2)')).toBeVisible({ timeout: TIMEOUTS.api })

    // Table column headers
    await expect(page.getByRole('columnheader', { name: 'Тип' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Статус' })).toBeVisible()

    // Status badges
    await expect(page.getByText('Отправлено').first()).toBeVisible()
    await expect(page.getByText('В очереди').first()).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // 5. Toggle alert rule enabled state
  // -------------------------------------------------------------------------
  test('toggle switch on alert rule fires PATCH request', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    const mockRules = [makeMockRule({ id: 'r1', label: 'Падение маржи', enabled: true })]

    await page.route(ALERTS_RULES_API, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRules),
      })
    )
    await page.route(ALERTS_SUMMARY_API, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeMockSummary()),
      })
    )
    await page.route(ALERTS_HISTORY_API, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    )

    // Intercept PATCH to capture the request
    let patchBody: unknown = null
    await page.route('**/v1/alerts/rules/r1', (route, request) => {
      if (request.method() === 'PATCH') {
        patchBody = JSON.parse(request.postData() ?? '{}')
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...mockRules[0], enabled: false }),
      })
    })

    await gotoAlerts(page)

    // Switch to rules tab
    await page.getByRole('tab', { name: 'Активные правила' }).click()
    await expect(page.getByText('Падение маржи').first()).toBeVisible({ timeout: TIMEOUTS.api })

    // Click the toggle switch
    const toggle = page.getByRole('switch', { name: /Переключить правило Падение маржи/ })
    await expect(toggle).toBeVisible()
    await toggle.click()

    // Wait for PATCH to fire
    await page
      .waitForResponse(
        resp => resp.url().includes('/v1/alerts/rules/r1') && resp.request().method() === 'PATCH',
        { timeout: TIMEOUTS.api }
      )
      .catch(() => {
        /* request may have already completed */
      })

    // Verify the PATCH body has enabled: false
    expect(patchBody).toEqual({ enabled: false })
  })

  // -------------------------------------------------------------------------
  // 6. Empty state: no rules shows informational message
  // -------------------------------------------------------------------------
  test('empty rules list shows no-rules message', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    await page.route(ALERTS_RULES_API, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    )
    await page.route(ALERTS_SUMMARY_API, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeMockSummary()),
      })
    )
    await page.route(ALERTS_HISTORY_API, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    )

    await gotoAlerts(page)

    // Switch to rules tab
    await page.getByRole('tab', { name: 'Активные правила' }).click()

    await expect(page.getByText('Нет правил')).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(page.getByText('Создайте первое правило оповещения')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // 7. Error state: 500 from rules endpoint
  // -------------------------------------------------------------------------
  test('API error on rules shows graceful state without crashing page', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    await page.route(ALERTS_RULES_API, route =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    )
    await page.route(ALERTS_SUMMARY_API, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeMockSummary()),
      })
    )
    await page.route(ALERTS_HISTORY_API, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    )

    await gotoAlerts(page)

    // Page heading must still be visible (graceful degradation)
    await expect(page.getByRole('heading', { name: 'Центр уведомлений' })).toBeVisible()

    // Tabs must still be present
    await expect(page.getByRole('tab', { name: 'Активные правила' })).toBeVisible()
  })
})

/**
 * E2E Tests: Backfill Admin Page
 * Story 51.12-FE: E2E Tests for FBS Analytics + Backfill
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Story 162.4 keeps the Owner shell and every status assertion deterministic.
 */

import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/network-test'
import { MUTATING_E2E_SKIP_REASON, shouldSkipMutatingE2E } from '../fixtures/mutation-guard'

const BACKFILL_ADMIN_ROUTE = '/settings/backfill'
const BACKFILL_STATUS_ROUTE = '**/v1/admin/backfill/status'

type BackfillFixture = {
  cabinetId: string
  cabinetName: string
  reportsStatus: string
  analyticsStatus: string
  overallProgress: number
  progress: {
    percentage: number
    estimated_remaining_seconds: number | null
    total_days: number
    completed_days: number
    current_date: string | null
  }
  lastError: string | null
  updatedAt: string
}

const runningCabinet: BackfillFixture = {
  cabinetId: 'cabinet-running',
  cabinetName: 'Рабочий кабинет',
  reportsStatus: 'in_progress',
  analyticsStatus: 'pending',
  overallProgress: 42,
  progress: {
    percentage: 42,
    estimated_remaining_seconds: 600,
    total_days: 365,
    completed_days: 153,
    current_date: '2026-03-01',
  },
  lastError: null,
  updatedAt: '2026-08-05T09:00:00Z',
}

const pausedCabinet: BackfillFixture = {
  ...runningCabinet,
  cabinetId: 'cabinet-paused',
  cabinetName: 'Кабинет на паузе',
  reportsStatus: 'paused',
  analyticsStatus: 'paused',
  overallProgress: 30,
  progress: { ...runningCabinet.progress, percentage: 30, completed_days: 110 },
}

const failedCabinet: BackfillFixture = {
  ...runningCabinet,
  cabinetId: 'cabinet-failed',
  cabinetName: 'Кабинет с ошибкой',
  reportsStatus: 'failed',
  analyticsStatus: 'failed',
  overallProgress: 17,
  progress: {
    ...runningCabinet.progress,
    percentage: 17,
    completed_days: 62,
    estimated_remaining_seconds: null,
  },
  lastError: 'WB API timeout after 5 retries',
}

const idleCabinet: BackfillFixture = {
  ...runningCabinet,
  cabinetId: 'cabinet-idle',
  cabinetName: 'Новый кабинет',
  reportsStatus: 'not_started',
  analyticsStatus: 'not_started',
  overallProgress: 0,
  progress: { ...runningCabinet.progress, percentage: 0, completed_days: 0 },
}

const statusFixtures = [runningCabinet, pausedCabinet, failedCabinet, idleCabinet]

async function mockBackfillStatus(page: Page, cabinets: BackfillFixture[]): Promise<void> {
  await page.route(BACKFILL_STATUS_ROUTE, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(cabinets),
    })
  )
}

async function expectOwnerShell(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/settings\/backfill(?:[/?#]|$)/)
  await expect(page.getByRole('heading', { name: 'Управление бэкфиллом' })).toBeVisible()
  await expect(page.getByText('Загрузка исторических данных FBS за 365 дней')).toBeVisible()
  // `exact: true` — Story 165.5 added a per-row "Перезапустить бэкфилл с нуля
  // для <name>" button whose accessible name contains "Запустить бэкфилл" as a
  // substring; without exact matching the toolbar button locator resolves to
  // 2 elements and trips Playwright strict mode. The toolbar CTA is the exact
  // match; the per-row restart has its own distinct aria-label.
  await expect(page.getByRole('button', { name: 'Запустить бэкфилл', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Обновить', exact: true })).toBeVisible()
}

async function gotoOwnerBackfill(page: Page, cabinets: BackfillFixture[]): Promise<void> {
  await mockBackfillStatus(page, cabinets)
  await page.goto(BACKFILL_ADMIN_ROUTE, { waitUntil: 'domcontentloaded' })
  await expectOwnerShell(page)

  if (cabinets.length === 0) {
    await expect(page.getByText('Нет кабинетов для бэкфилла')).toBeVisible()
  } else {
    await expect(page.getByRole('table')).toBeVisible()
  }
}

test.describe('Epic 51-FE: Backfill Admin Page', () => {
  test.describe('Access Control (Owner Only)', () => {
    test('should display page for authenticated Owner user', async ({ page }) => {
      await gotoOwnerBackfill(page, [])
    })

    test('should redirect non-Owner users to dashboard', async ({ page }) => {
      await mockBackfillStatus(page, [])
      await page.goto(BACKFILL_ADMIN_ROUTE, { waitUntil: 'domcontentloaded' })

      const redirected = await page
        .waitForURL(url => !url.pathname.startsWith(BACKFILL_ADMIN_ROUTE), { timeout: 3_000 })
        .then(() => true)
        .catch(() => false)

      if (redirected) {
        await expect(page).toHaveURL(/\/(dashboard|login)(?:[/?#]|$)/)
        await expect(page.getByRole('heading', { name: 'Управление бэкфиллом' })).toHaveCount(0)
        return
      }

      await expectOwnerShell(page)
      test.skip(
        true,
        'Configured E2E storage state authenticates an Owner; a non-Owner auth fixture is unavailable'
      )
    })

    test('should show loading skeleton while checking permissions', async ({ page }) => {
      let releaseStatus: (() => void) | undefined
      const statusGate = new Promise<void>(resolve => {
        releaseStatus = resolve
      })

      await page.route(BACKFILL_STATUS_ROUTE, async route => {
        await statusGate
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '[]',
        })
      })

      await page.goto(BACKFILL_ADMIN_ROUTE, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: 'Управление бэкфиллом' })).toBeVisible()

      const loadingRows = page.locator('main div.space-y-3 > div.flex.items-center.gap-4')
      await expect(loadingRows).toHaveCount(3)
      await expect(loadingRows.first().locator('.animate-pulse')).toHaveCount(5)

      releaseStatus?.()
      await expect(page.getByText('Нет кабинетов для бэкфилла')).toBeVisible()
    })
  })

  test.describe('Page Layout & Header', () => {
    test.beforeEach(async ({ page }) => {
      await gotoOwnerBackfill(page, [])
    })

    test('should display page title "Управление бэкфиллом"', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Управление бэкфиллом' })).toBeVisible()
    })

    test('should display page subtitle with description', async ({ page }) => {
      await expect(page.getByText('Загрузка исторических данных FBS за 365 дней')).toBeVisible()
    })

    test('should display refresh button', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Обновить', exact: true })).toBeEnabled()
    })
  })

  test.describe('Status Table Display', () => {
    test.beforeEach(async ({ page }) => {
      await gotoOwnerBackfill(page, statusFixtures)
    })

    test('should display status table or empty state', async ({ page }) => {
      await expect(page.getByRole('table')).toBeVisible()
      await expect(page.getByText('Нет кабинетов для бэкфилла')).toHaveCount(0)
    })

    test('should display table columns: Кабинет, Статус, Прогресс, ETA, Действия', async ({
      page,
    }) => {
      const headers = page.getByRole('columnheader')
      await expect(headers).toHaveText([
        'Кабинет',
        'Статус',
        'Прогресс',
        'ETA',
        'Ошибки',
        'Действия',
      ])
    })

    test('should display cabinet rows with data', async ({ page }) => {
      const rows = page.getByRole('row')
      await expect(rows).toHaveCount(statusFixtures.length + 1)
      await expect(page.getByRole('row', { name: /Рабочий кабинет/ })).toContainText('Выполняется')
      await expect(page.getByRole('row', { name: /Кабинет на паузе/ })).toContainText(
        'Приостановлено'
      )
      await expect(page.getByRole('row', { name: /Кабинет с ошибкой/ })).toContainText('Ошибка')
    })

    test('should display status badges with correct colors', async ({ page }) => {
      const runningRow = page.getByRole('row', { name: /Рабочий кабинет/ })
      await expect(runningRow.getByText('Выполняется', { exact: true })).toBeVisible()
      await expect(runningRow.getByText('В очереди', { exact: true })).toBeVisible()
    })

    test('should display progress bars for in-progress cabinets', async ({ page }) => {
      const runningRow = page.getByRole('row', { name: /Рабочий кабинет/ })
      const progress = runningRow.getByRole('progressbar', { name: 'Прогресс: 42%' })
      await expect(progress).toBeVisible()
      await expect(progress).toHaveAttribute('aria-valuenow', '42')
    })
  })

  test.describe('Start Backfill Action @mutating', () => {
    test.skip(shouldSkipMutatingE2E(), MUTATING_E2E_SKIP_REASON)

    test.beforeEach(async ({ page }) => {
      await gotoOwnerBackfill(page, [idleCabinet])
    })

    test('should display "Запустить бэкфилл" button', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Запустить бэкфилл' })).toBeEnabled()
    })

    test('should open confirmation dialog on start button click', async ({ page }) => {
      await page.getByRole('button', { name: 'Запустить бэкфилл' }).click()
      const dialog = page.getByRole('dialog', { name: 'Запуск бэкфилла' })
      await expect(dialog).toBeVisible()
      await expect(
        dialog.getByText('Выберите кабинет для загрузки исторических данных')
      ).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
    })

    test('should show cabinet selector in start dialog', async ({ page }) => {
      await page.getByRole('button', { name: 'Запустить бэкфилл' }).click()
      const dialog = page.getByRole('dialog', { name: 'Запуск бэкфилла' })
      await expect(dialog.getByRole('combobox', { name: 'Кабинет' })).toBeVisible()
      await page.keyboard.press('Escape')
    })

    test('should close dialog on cancel', async ({ page }) => {
      await page.getByRole('button', { name: 'Запустить бэкфилл' }).click()
      const dialog = page.getByRole('dialog', { name: 'Запуск бэкфилла' })
      await dialog.getByRole('button', { name: 'Отмена' }).click()
      await expect(dialog).not.toBeVisible()
    })
  })

  test.describe('Pause/Resume Actions @mutating', () => {
    test.skip(shouldSkipMutatingE2E(), MUTATING_E2E_SKIP_REASON)

    test('should display Pause button for in-progress cabinets', async ({ page }) => {
      await gotoOwnerBackfill(page, [runningCabinet])
      const row = page.getByRole('row', { name: /Рабочий кабинет/ })
      await expect(
        row.getByRole('button', { name: 'Приостановить бэкфилл для Рабочий кабинет' })
      ).toBeVisible()
    })

    test('should display Resume button for paused cabinets', async ({ page }) => {
      await gotoOwnerBackfill(page, [pausedCabinet])
      const row = page.getByRole('row', { name: /Кабинет на паузе/ })
      await expect(
        row.getByRole('button', { name: 'Возобновить бэкфилл для Кабинет на паузе' })
      ).toBeVisible()
    })

    test('should toggle between Pause and Resume states', async ({ page }) => {
      let currentCabinet = runningCabinet
      await page.route(BACKFILL_STATUS_ROUTE, route =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([currentCabinet]),
        })
      )
      await page.route('**/v1/admin/backfill/pause', async route => {
        currentCabinet = pausedCabinet
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            cabinet_id: runningCabinet.cabinetId,
            status: 'paused',
            message: 'Backfill paused successfully',
          }),
        })
      })

      await page.goto(BACKFILL_ADMIN_ROUTE, { waitUntil: 'domcontentloaded' })
      await expectOwnerShell(page)
      await page.getByRole('button', { name: 'Приостановить бэкфилл для Рабочий кабинет' }).click()
      await expect(
        page.getByRole('button', { name: 'Возобновить бэкфилл для Кабинет на паузе' })
      ).toBeVisible()
    })
  })

  test.describe('Progress Display', () => {
    test.beforeEach(async ({ page }) => {
      await gotoOwnerBackfill(page, [runningCabinet])
    })

    test('should display progress percentage', async ({ page }) => {
      const progress = page.getByRole('progressbar', { name: 'Прогресс: 42%' })
      await expect(progress).toHaveAttribute('aria-valuemin', '0')
      await expect(progress).toHaveAttribute('aria-valuemax', '100')
      await expect(progress).toHaveAttribute('aria-valuenow', '42')
    })

    test('should display ETA when available', async ({ page }) => {
      await expect(page.getByRole('row', { name: /Рабочий кабинет/ })).toContainText('~10 мин')
    })
  })

  test.describe('Error Log Display', () => {
    test.beforeEach(async ({ page }) => {
      await gotoOwnerBackfill(page, [failedCabinet])
    })

    test('should display error badge for failed cabinets', async ({ page }) => {
      const row = page.getByRole('row', { name: /Кабинет с ошибкой/ })
      await expect(row.getByText('Ошибка', { exact: true })).toHaveCount(3)
    })

    test('should display retry button for failed cabinets', async ({ page }) => {
      // Story 165.5: the per-source retry controls render one button per FAILED
      // source. `failedCabinet` has BOTH reports + analytics failed, so the row
      // shows two retry buttons (reports + analytics), each with its own
      // source-scoped aria-label. The old single "Повторить бэкфилл для <name>"
      // button was replaced by these per-source controls.
      const row = page.getByRole('row', { name: /Кабинет с ошибкой/ })
      await expect(
        row.getByRole('button', {
          name: 'Повторить загрузку «Повторить отчёты» для Кабинет с ошибкой',
        })
      ).toBeVisible()
      await expect(
        row.getByRole('button', {
          name: 'Повторить загрузку «Повторить аналитику» для Кабинет с ошибкой',
        })
      ).toBeVisible()
    })

    test('should show error details on click', async ({ page }) => {
      await page.getByRole('button', { name: 'Показать ошибку для Кабинет с ошибкой' }).click()
      const dialog = page.getByRole('dialog', { name: 'Ошибка бэкфилла: Кабинет с ошибкой' })
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText('WB API timeout after 5 retries')).toBeVisible()
    })
  })

  test.describe('Loading & Empty States', () => {
    test('should show loading skeleton while fetching', async ({ page }) => {
      let releaseStatus: (() => void) | undefined
      const statusGate = new Promise<void>(resolve => {
        releaseStatus = resolve
      })
      await page.route(BACKFILL_STATUS_ROUTE, async route => {
        await statusGate
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      })

      await page.goto(BACKFILL_ADMIN_ROUTE, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: 'Управление бэкфиллом' })).toBeVisible()
      const loadingRows = page.locator('main div.space-y-3 > div.flex.items-center.gap-4')
      await expect(loadingRows).toHaveCount(3)

      releaseStatus?.()
      await expect(page.getByText('Нет кабинетов для бэкфилла')).toBeVisible()
    })

    test('should show empty state when no cabinets', async ({ page }) => {
      await gotoOwnerBackfill(page, [])
      await expect(page.getByText('Нет кабинетов для бэкфилла')).toBeVisible()
      await expect(
        page.getByText('Создайте кабинет для начала загрузки исторических данных')
      ).toBeVisible()
      await expect(page.getByRole('table')).toHaveCount(0)
    })
  })

  test.describe('Polling & Real-time Updates', () => {
    test('should show last update timestamp', async ({ page }) => {
      await gotoOwnerBackfill(page, [])
      await expect(page.getByText(/^Обновлено: \d{2}:\d{2}:\d{2}$/)).toBeVisible()
    })

    test('should update on manual refresh', async ({ page }) => {
      let statusRequests = 0
      await page.route(BACKFILL_STATUS_ROUTE, route => {
        statusRequests += 1
        return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      })
      await page.goto(BACKFILL_ADMIN_ROUTE, { waitUntil: 'domcontentloaded' })
      await expectOwnerShell(page)
      await expect(page.getByText('Нет кабинетов для бэкфилла')).toBeVisible()

      const beforeRefresh = statusRequests
      await page.getByRole('button', { name: 'Обновить', exact: true }).click()
      await expect.poll(() => statusRequests).toBeGreaterThan(beforeRefresh)
      await expect(page.getByText(/^Обновлено: \d{2}:\d{2}:\d{2}$/)).toBeVisible()
    })
  })

  test.describe('Responsive Layout', () => {
    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await gotoOwnerBackfill(page, [])
      await expect(page.getByRole('heading', { name: 'Управление бэкфиллом' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Запустить бэкфилл' })).toBeVisible()
    })

    test('should display properly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await gotoOwnerBackfill(page, [])
      await expect(page.getByRole('heading', { name: 'Управление бэкфиллом' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Обновить', exact: true })).toBeVisible()
    })
  })
})

// ============================================================================
// Story 165.5: Per-Status Backfill Retry
// ============================================================================
// Live, the Test Cabinet's backfill status is NOT `failed`, so the FE never
// renders the per-source retry controls (BackfillRetryControls shows a button
// ONLY when THAT source's status is `failed`). We intercept the status + retry
// endpoints with page.route() (observable-wait pattern) — never waitForTimeout.
//
// The backend returns camelCase (reportsStatus / analyticsStatus); the FE
// normalizer maps reportsStatus→status, analyticsStatus→analytics_status. So
// the mocked status payload uses camelCase keys (matching getBackfillStatus).
//
// Fail-closed: each test records unexpected retry-endpoint calls and asserts
// ZERO at teardown (mirrors the sibling pause/resume specs' route-glob style).

const BACKFILL_REPORT_RETRY_ROUTE = '**/v1/admin/backfill/report/retry'
const BACKFILL_ANALYTICS_RETRY_ROUTE = '**/v1/admin/backfill/analytics/retry'

// camelCase status payload — what the backend returns + the normalizer reads.
type RetryStatusFixture = {
  cabinetId: string
  cabinetName: string
  reportsStatus: string
  analyticsStatus: string
  overallProgress: number
  progress: {
    percentage: number
    estimated_remaining_seconds: number | null
    total_days: number
    completed_days: number
    current_date: string | null
  }
  lastError: string | null
  updatedAt: string
}

const reportsFailedOnly: RetryStatusFixture = {
  cabinetId: 'cabinet-reports-failed',
  cabinetName: 'Отчёты упали',
  reportsStatus: 'failed',
  analyticsStatus: 'completed',
  overallProgress: 17,
  progress: {
    percentage: 17,
    estimated_remaining_seconds: null,
    total_days: 90,
    completed_days: 15,
    current_date: '2026-03-01',
  },
  lastError: 'WB reports API timeout after 5 retries',
  updatedAt: '2026-08-05T09:00:00Z',
}

const analyticsFailedOnly: RetryStatusFixture = {
  ...reportsFailedOnly,
  cabinetId: 'cabinet-analytics-failed',
  cabinetName: 'Аналитика упала',
  reportsStatus: 'completed',
  analyticsStatus: 'failed',
  lastError: 'WB analytics API 502',
}

async function mockRetryStatus(page: Page, cabinets: RetryStatusFixture[]): Promise<void> {
  await page.route(BACKFILL_STATUS_ROUTE, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(cabinets),
    })
  )
}

test.describe('Story 165.5 — per-source backfill retry', () => {
  test.describe('Per-source visibility + correct endpoint (AC2/AC3/AC4)', () => {
    test('shows REPORTS retry only when reports failed; hits report/retry, never analytics', async ({
      page,
    }) => {
      await mockRetryStatus(page, [reportsFailedOnly])

      let analyticsRetryCalls = 0
      await page.route(BACKFILL_ANALYTICS_RETRY_ROUTE, route => {
        analyticsRetryCalls += 1
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
      })

      await page.goto(BACKFILL_ADMIN_ROUTE, { waitUntil: 'domcontentloaded' })
      await expectOwnerShell(page)

      const reportsRow = page.getByRole('row', { name: /Отчёты упали/ })
      // AC3/AC4: REPORTS button visible, ANALYTICS button NOT (analytics is completed).
      const reportsRetryBtn = reportsRow.getByRole('button', {
        name: 'Повторить загрузку «Повторить отчёты» для Отчёты упали',
      })
      await expect(reportsRetryBtn).toBeVisible()
      await expect(
        reportsRow.getByRole('button', {
          name: 'Повторить загрузку «Повторить аналитику» для Отчёты упали',
        })
      ).toHaveCount(0)

      // Pre-register the report/retry response waiter BEFORE the click (AC2).
      const reportRetryResponse = page.waitForResponse(
        r =>
          r.request().method() === 'POST' &&
          new URL(r.url()).pathname === '/v1/admin/backfill/report/retry',
        { timeout: 10_000 }
      )
      await page.route(BACKFILL_REPORT_RETRY_ROUTE, route =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Reports retry started (attempt 2)' }),
        })
      )

      await reportsRetryBtn.click()
      const response = await reportRetryResponse
      expect(response.ok()).toBe(true)

      // Success indication — sonner toast surfaces the backend message verbatim
      // (sibling specs assert toast text directly; sonner renders it in a
      // `[data-sonner-toast]` / `[class*="toast"]` node, not role="status").
      await expect(page.getByText(/Reports retry started/i)).toBeVisible({ timeout: 10_000 })

      // Fail-closed: the analytics retry endpoint was NEVER called.
      await expect.poll(() => analyticsRetryCalls).toBe(0)
    })
  })

  test.describe('409 conflict (AC5/AC6)', () => {
    test('shows actionable error feedback and re-fetches status on 409', async ({ page }) => {
      let statusCalls = 0
      await page.route(BACKFILL_STATUS_ROUTE, route => {
        statusCalls += 1
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([reportsFailedOnly]),
        })
      })

      const reportRetryResponse = page.waitForResponse(
        r =>
          r.request().method() === 'POST' &&
          new URL(r.url()).pathname === '/v1/admin/backfill/report/retry',
        { timeout: 10_000 }
      )
      await page.route(BACKFILL_REPORT_RETRY_ROUTE, route =>
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'BACKFILL_IN_PROGRESS',
            message: 'Backfill already running',
          }),
        })
      )

      await page.goto(BACKFILL_ADMIN_ROUTE, { waitUntil: 'domcontentloaded' })
      await expectOwnerShell(page)

      const reportsRetryBtn = page.getByRole('button', {
        name: 'Повторить загрузку «Повторить отчёты» для Отчёты упали',
      })
      await expect(reportsRetryBtn).toBeVisible()

      const statusBefore = statusCalls
      await reportsRetryBtn.click()
      await reportRetryResponse

      // AC5: actionable error feedback is shown (sonner toast text).
      await expect(page.getByText(/Ошибка повтора бэкфилла/i)).toBeVisible({ timeout: 10_000 })

      // AC6: the hook invalidates on error → status query is re-fetched.
      await expect.poll(() => statusCalls, { timeout: 10_000 }).toBeGreaterThan(statusBefore)
    })
  })

  test.describe('Analytics-only failure mirror (AC3/AC4)', () => {
    test('shows ANALYTICS retry only when analytics failed; never hits report/retry', async ({
      page,
    }) => {
      await mockRetryStatus(page, [analyticsFailedOnly])

      let reportRetryCalls = 0
      await page.route(BACKFILL_REPORT_RETRY_ROUTE, route => {
        reportRetryCalls += 1
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
      })

      await page.goto(BACKFILL_ADMIN_ROUTE, { waitUntil: 'domcontentloaded' })
      await expectOwnerShell(page)

      const analyticsRow = page.getByRole('row', { name: /Аналитика упала/ })
      const analyticsRetryBtn = analyticsRow.getByRole('button', {
        name: 'Повторить загрузку «Повторить аналитику» для Аналитика упала',
      })
      await expect(analyticsRetryBtn).toBeVisible()
      await expect(
        analyticsRow.getByRole('button', {
          name: 'Повторить загрузку «Повторить отчёты» для Аналитика упала',
        })
      ).toHaveCount(0)

      const analyticsRetryResponse = page.waitForResponse(
        r =>
          r.request().method() === 'POST' &&
          new URL(r.url()).pathname === '/v1/admin/backfill/analytics/retry',
        { timeout: 10_000 }
      )
      await page.route(BACKFILL_ANALYTICS_RETRY_ROUTE, route =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Analytics retry started (attempt 2)' }),
        })
      )

      await analyticsRetryBtn.click()
      const response = await analyticsRetryResponse
      expect(response.ok()).toBe(true)

      await expect(page.getByText(/Analytics retry started/i)).toBeVisible({ timeout: 10_000 })

      // Fail-closed: the reports retry endpoint was NEVER called.
      await expect.poll(() => reportRetryCalls).toBe(0)
    })
  })
})

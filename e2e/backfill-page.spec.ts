/**
 * E2E Tests: Backfill Admin Page (Owner-only)
 * Route: /settings/backfill
 * Page: src/app/(dashboard)/settings/backfill/page.tsx
 *
 * Covers heading, subtitle, role-based redirect, sidebar, content structure.
 * This page requires Owner role — non-Owners are redirected to /dashboard.
 *
 * Conventions (CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - domcontentloaded + element-presence waits only (anti-pattern #9 — no networkidle)
 * - No hard waits (anti-pattern #7)
 * - Russian text assertions (locale is ru)
 *
 * Run: npx playwright test e2e/backfill-page.spec.ts
 */

import type { Page } from '@playwright/test'

import { test, expect } from './fixtures/network-test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

const BACKFILL_STATUS_ROUTE = '**/v1/admin/backfill/status'
const BACKFILL_START_ROUTE = '**/v1/admin/backfill/start'

const retainedCabinet = {
  cabinetId: 'cabinet-retained-query-state',
  cabinetName: 'Сохранённый кабинет',
  reportsStatus: 'completed',
  analyticsStatus: 'in_progress',
  overallProgress: 64,
  progress: {
    percentage: 64,
    estimated_remaining_seconds: 900,
    total_days: 365,
    completed_days: 234,
    current_date: '2026-04-21',
  },
  lastError: null,
  updatedAt: '2026-08-29T09:00:00Z',
}

const recoveredCabinet = {
  ...retainedCabinet,
  cabinetId: 'cabinet-recovered-query-state',
  cabinetName: 'Актуальный кабинет',
  reportsStatus: 'completed',
  analyticsStatus: 'completed',
  overallProgress: 100,
  progress: {
    ...retainedCabinet.progress,
    percentage: 100,
    estimated_remaining_seconds: null,
    completed_days: 365,
    current_date: '2026-08-29',
  },
  updatedAt: '2026-08-29T09:05:00Z',
}

async function expectOwnerShellOrRedirect(page: Page): Promise<boolean> {
  const heading = page.getByRole('heading', { name: 'Управление бэкфиллом' })
  const ownerShellVisible = await heading
    .waitFor({ state: 'visible', timeout: TIMEOUTS.api })
    .then(() => true)
    .catch(() => false)

  if (ownerShellVisible) {
    await expect(page).toHaveURL(/\/settings\/backfill(?:[/?#]|$)/)
    await expect(heading).toBeVisible()
    await expect(page.getByText('Загрузка исторических данных FBS за 365 дней')).toBeVisible()
    return true
  }

  await expect(page).toHaveURL(/\/(dashboard|login)(?:[/?#]|$)/)
  await expect(heading).toHaveCount(0)
  return false
}

test.describe('Backfill Admin Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.settings.backfill, { waitUntil: 'domcontentloaded' })
  })

  test('renders heading "Управление бэкфиллом" for Owner or redirects non-Owner', async ({
    page,
  }) => {
    await expectOwnerShellOrRedirect(page)
  })

  test('shows subtitle about historical data when visible', async ({ page }) => {
    const isOwner = await expectOwnerShellOrRedirect(page)

    if (isOwner) {
      await expect(page.getByText('Загрузка исторических данных FBS')).toBeVisible()
    }
  })

  test('shows table or refresh button when page is visible', async ({ page }) => {
    const isOwner = await expectOwnerShellOrRedirect(page)

    if (isOwner) {
      await expect(page.getByRole('button', { name: 'Обновить' })).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Запустить бэкфилл', exact: true })
      ).toBeVisible()

      const table = page.getByRole('table', {
        name: 'Состояние загрузки исторических данных по кабинетам',
      })
      const emptyState = page.getByText('Нет кабинетов для бэкфилла')
      await expect(table.or(emptyState)).toBeVisible({ timeout: TIMEOUTS.api })
    }
  })

  test('sidebar navigation present', async ({ page }) => {
    await expectOwnerShellOrRedirect(page)
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
  })
})

test.describe('Backfill query-state recovery', () => {
  test('shows an explicit initial failure and replaces it with successful retry data', async ({
    page,
  }) => {
    let responseMode: 'failure' | 'success' = 'failure'
    let statusRequests = 0

    await page.route(BACKFILL_STATUS_ROUTE, route => {
      statusRequests += 1
      if (responseMode === 'failure') {
        return route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Backfill status is temporarily unavailable' }),
        })
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([recoveredCabinet]),
      })
    })

    await page.goto(ROUTES.settings.backfill, { waitUntil: 'domcontentloaded' })

    const initialFailure = page.getByRole('alert', {
      name: 'Не удалось загрузить состояние бэкфилла',
    })
    await expect(initialFailure).toBeAttached({ timeout: TIMEOUTS.api })
    await expect(initialFailure).toContainText('Сервер не вернул статусы кабинетов')
    await expect(page.getByText('Нет кабинетов для бэкфилла')).toHaveCount(0)
    await expect(page.getByText(recoveredCabinet.cabinetName, { exact: true })).toHaveCount(0)
    await expect(page.getByText('Завершено источников')).toHaveCount(0)

    responseMode = 'success'
    const requestsBeforeRetry = statusRequests
    await page.getByRole('button', { name: 'Повторить загрузку' }).click()

    await expect.poll(() => statusRequests).toBeGreaterThan(requestsBeforeRetry)
    await expect(
      page.getByText(recoveredCabinet.cabinetName, { exact: true }).filter({ visible: true })
    ).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(initialFailure).toHaveCount(0)
    await expect(page.getByText('Нет кабинетов для бэкфилла')).toHaveCount(0)
  })

  test('retains stale data after refresh failure and replaces it after retry at 390px dark', async ({
    page,
  }) => {
    let responseMode: 'initial' | 'failure' | 'recovered' = 'initial'
    let statusRequests = 0

    await page.setViewportSize({ width: 390, height: 844 })
    await page.route(BACKFILL_STATUS_ROUTE, route => {
      statusRequests += 1
      if (responseMode === 'failure') {
        return route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Backfill refresh failed' }),
        })
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([responseMode === 'initial' ? retainedCabinet : recoveredCabinet]),
      })
    })

    await page.goto(ROUTES.settings.backfill, { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
    })
    await expect
      .poll(() =>
        page.evaluate(() => ({
          dark: document.documentElement.classList.contains('dark'),
          colorScheme: document.documentElement.style.colorScheme,
        }))
      )
      .toEqual({ dark: true, colorScheme: 'dark' })
    await expect(
      page.getByText(retainedCabinet.cabinetName, { exact: true }).filter({ visible: true })
    ).toBeVisible({ timeout: TIMEOUTS.api })

    responseMode = 'failure'
    const requestsBeforeRefresh = statusRequests
    await page.getByRole('button', { name: 'Обновить', exact: true }).click()

    await expect.poll(() => statusRequests).toBeGreaterThan(requestsBeforeRefresh)
    const staleState = page.getByRole('region', { name: 'Показаны ранее полученные данные' })
    await expect(staleState).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(staleState).toContainText('Текущие статусы могли измениться')
    await expect(staleState).toContainText(/Последнее успешное обновление: .* \(МСК\)/)
    await expect(
      page.getByText(retainedCabinet.cabinetName, { exact: true }).filter({ visible: true })
    ).toBeVisible()
    await expect(page.getByText('Нет кабинетов для бэкфилла')).toHaveCount(0)

    responseMode = 'recovered'
    const requestsBeforeRetry = statusRequests
    await page.getByRole('button', { name: 'Повторить обновление' }).click()

    await expect.poll(() => statusRequests).toBeGreaterThan(requestsBeforeRetry)
    await expect(
      page.getByText(recoveredCabinet.cabinetName, { exact: true }).filter({ visible: true })
    ).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(staleState).toHaveCount(0)
    await expect(page.getByText(retainedCabinet.cabinetName, { exact: true })).toHaveCount(0)
  })

  test('closes the unresolved start dialog safely and guards its focusable trigger', async ({
    page,
  }) => {
    let releaseStart!: () => void
    const pendingStart = new Promise<void>(resolve => (releaseStart = resolve))
    await page.route(BACKFILL_STATUS_ROUTE, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([recoveredCabinet]),
      })
    )
    await page.route(BACKFILL_START_ROUTE, async route => {
      await pendingStart
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cabinet_id: recoveredCabinet.cabinetId,
          status: 'pending',
          message: 'started',
        }),
      })
    })
    await page.goto(ROUTES.settings.backfill, { waitUntil: 'domcontentloaded' })

    const trigger = page.getByRole('button', { name: 'Запустить бэкфилл', exact: true })
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'Запуск бэкфилла' })
    await dialog.getByRole('combobox', { name: 'Кабинет' }).click()
    await page.getByRole('option', { name: recoveredCabinet.cabinetName }).click()
    await dialog.getByRole('button', { name: 'Запустить', exact: true }).click()
    await expect(dialog.getByRole('button', { name: 'Запуск...' })).toBeDisabled()

    try {
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
      await expect(trigger).toBeFocused()
      await expect(trigger).toHaveAttribute('aria-disabled', 'true')
      await trigger.press('Enter')
      await expect(dialog).not.toBeVisible()
    } finally {
      releaseStart()
    }

    await expect(trigger).not.toHaveAttribute('aria-disabled', 'true', { timeout: TIMEOUTS.api })
  })
})

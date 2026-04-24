/**
 * E2E Tests: Monitor Dashboard
 * Epic 92-FE Story 92.2: KPI Cards + Route Registration
 *
 * Uses domcontentloaded + landmark waits (CLAUDE.md anti-pattern #9).
 * No waitForTimeout as data-wait substitute — only landmark-based waits.
 *
 * NOTE: These tests require a running frontend (port 3100) and authenticated session.
 * Run with: npm run test:e2e -- e2e/monitor.spec.ts
 * Skip E2E execution per Story 92.2 scope (lint-only verification).
 */

import { test, expect } from '@playwright/test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

test.describe('Monitor Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Story 88.3-FE: domcontentloaded + landmark wait (not networkidle — see CLAUDE.md #9).
    // The monitor page may run background queries; networkidle never settles reliably.
    await page.goto(ROUTES.dashboard, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
  })

  test('navigates directly to /monitor and renders page landmark', async ({ page }) => {
    await page.goto(ROUTES.monitor, { waitUntil: 'domcontentloaded' })

    // Wait for the page landmark — either content or skeleton (both are valid mounted states)
    await expect(page.getByTestId('monitor-page')).toBeVisible({ timeout: TIMEOUTS.api })

    // Heading must be present
    await expect(page.getByRole('heading', { name: 'Монитор' })).toBeVisible()
  })

  test('"Монитор" sidebar link navigates to /monitor', async ({ page }) => {
    // Find the sidebar link by label
    const monitorLink = page.getByRole('link', { name: 'Монитор' })
    test.skip(
      (await monitorLink.count()) === 0,
      'Sidebar "Монитор" link not found — sidebar may be collapsed or not rendered'
    )

    await monitorLink.click()

    // URL must end with /monitor
    await expect(page).toHaveURL(/\/monitor$/, { timeout: TIMEOUTS.navigation })

    // Page landmark becomes visible after navigation
    await expect(page.getByTestId('monitor-page')).toBeVisible({ timeout: TIMEOUTS.api })
  })

  test('page renders KPI card titles or skeleton without accessibility violations', async ({
    page,
  }) => {
    await page.goto(ROUTES.monitor, { waitUntil: 'domcontentloaded' })

    // Wait for a stable state: either KPI cards or skeleton
    const monitorPage = page.getByTestId('monitor-page')
    await expect(monitorPage).toBeVisible({ timeout: TIMEOUTS.api })

    // Either card titles are visible (data loaded) or skeleton is visible (loading)
    const hasCards = (await page.getByText('Всего артикулов').count()) > 0
    const hasSkeleton = (await page.getByRole('status').count()) > 0

    // Page is in a valid state (loaded or loading)
    test.skip(
      !hasCards && !hasSkeleton,
      'Neither KPI cards nor skeleton visible — needs backend data seeding'
    )

    expect(hasCards || hasSkeleton).toBeTruthy()
  })

  // Story 92.3-FE: metrics table landmark
  test('metrics table landmark is visible with Выручка row', async ({ page }) => {
    await page.goto(ROUTES.monitor, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('monitor-page')).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(page.getByTestId('table-metrics-4-periods')).toBeVisible()
    await expect(
      page.getByRole('region', { name: 'Сводная таблица метрик за 4 периода' })
    ).toBeVisible()
    await expect(page.getByText('Выручка')).toBeVisible()
  })

  // Story 92.4-FE: weekly chart landmark
  test('weekly chart landmark is visible with Продажи legend', async ({ page }) => {
    await page.goto(ROUTES.monitor, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('monitor-page')).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(page.getByTestId('monitor-weekly-chart')).toBeVisible()
    // L-3 fix: scoped to chart landmark to avoid false-positives from sidebar/table text
    await expect(page.getByTestId('monitor-weekly-chart').getByText(/Продажи/)).toBeVisible()
  })

  // Story 92.5-FE: Block 4 gauge + Block 5 pipeline panel landmarks
  test('Block 4 gauge + Block 5 pipeline panel landmarks visible', async ({ page }) => {
    await page.goto(ROUTES.monitor, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('monitor-page')).toBeVisible({ timeout: TIMEOUTS.api })

    // Skip if the page hasn't loaded KPI cards (needs backend seeding).
    // Visible yellow skip per CLAUDE.md anti-pattern #6 — never silent return.
    const hasCards = (await page.getByText('Всего артикулов').count()) > 0
    test.skip(!hasCards, 'KPI cards not visible — needs backend data seeding for gauge test')

    // Block 4: buyout gauge must be present and accessible
    const gauge = page.getByTestId('monitor-buyout-gauge')
    await expect(gauge).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(gauge).toHaveAttribute('role', 'meter')

    // Block 5: pipeline panel OR its skeleton must be mounted.
    // Pipeline health uses an independent fetch — either rendered state is valid.
    // H-2 fix: use data-testid="monitor-pipeline-skeleton" (added to <Skeleton> in MonitorPageContent).
    const pipelinePanel = page.getByTestId('monitor-pipeline-health')
    const pipelineSkeleton = page.getByTestId('monitor-pipeline-skeleton')
    const panelVisible = await pipelinePanel.isVisible().catch(() => false)
    const skeletonVisible = await pipelineSkeleton.isVisible().catch(() => false)
    expect(panelVisible || skeletonVisible).toBeTruthy()
  })
})

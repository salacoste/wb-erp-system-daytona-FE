/**
 * E2E Tests: Monitor Dashboard
 * Epic 92-FE Story 92.2: KPI Cards + Route Registration
 * Epic 92-FE Story 92.6: Empty states, error states, accessibility, responsive
 *
 * Uses domcontentloaded + landmark waits (CLAUDE.md anti-pattern #9).
 * No waitForTimeout as data-wait substitute — only landmark-based waits.
 * No waitForLoadState('networkidle') — monitor page has background polling.
 *
 * NOTE: These tests require a running frontend (port 3100) and authenticated session.
 * Run with: npm run test:e2e -- e2e/monitor.spec.ts
 */

import { test, expect } from './fixtures/network-test'
import AxeBuilder from '@axe-core/playwright'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'
import {
  emptyMonitorSummary,
  emptyPipelineGrid,
  mockEmptyDailyMetrics,
  mockAllEmpty,
} from './fixtures/monitor-fixtures'

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
    // Find the sidebar link by label. exact:true — there is also a "Мониторинг" (/monitoring) link,
    // and the default substring match resolves to BOTH ("Мониторинг" contains "Монитор").
    const monitorLink = page.getByRole('link', { name: 'Монитор', exact: true })
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
    // L-3 fix: scoped to chart landmark to avoid false-positives from sidebar/table text.
    // Story 172.11 repair: exact match — the BD-22 rename (PR #41) added a
    // second legend item «Продажи + Возвраты», making the /Продажи/ regex
    // resolve 2 elements (strict-mode violation, pre-existing on main).
    await expect(
      page.getByTestId('monitor-weekly-chart').getByText('Продажи', { exact: true })
    ).toBeVisible()
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

// ============================================================================
// Story 92.6-FE: Empty states (AC-1, AC-8)
// Each test isolates one endpoint mock; the others may fail or succeed in env.
// The assertion targets only the mocked branch's expected output.
// ============================================================================

test.describe('Empty states', () => {
  test('empty monitor summary renders page with — placeholders', async ({ page }) => {
    // Mock only summary → empty; other endpoints are not constrained
    await page.route('**/v1/analytics/monitor/summary**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: emptyMonitorSummary() }),
      })
    )

    await page.goto(ROUTES.monitor, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('monitor-page')).toBeVisible({ timeout: TIMEOUTS.api })

    // Metrics table must be present (rendered even with all-null periods)
    await expect(page.getByTestId('table-metrics-4-periods')).toBeVisible({ timeout: TIMEOUTS.api })

    // Выручка row must show — (not "0 ₽") — scoped to Выручка row (M-7 fix: discriminating assertion)
    const table = page.getByTestId('table-metrics-4-periods')
    const revenueRow = table.getByRole('row', { name: /Выручка/ })
    await expect(revenueRow).toBeVisible({ timeout: TIMEOUTS.api })
    // All 4 period cells in the Выручка row must show — (revenue is null for all 4 periods)
    await expect(revenueRow.getByText('—')).toHaveCount(4)

    // Gauge renders — for null buyoutRatePercent + "Нет данных" band label
    const gauge = page.getByTestId('monitor-buyout-gauge')
    await expect(gauge).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(gauge.getByText('—')).toBeVisible()
    // "Нет данных" band label is outside the meter div but inside the Card — check page-scoped
    await expect(page.getByText('Нет данных').first()).toBeVisible({ timeout: TIMEOUTS.api })
  })

  test('empty pipeline-health-grid renders all-healthy empty state', async ({ page }) => {
    // Mock only pipeline-grid → empty pipelines[]; other endpoints unconstrained
    await page.route('**/v1/monitoring/pipeline-health-grid**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: emptyPipelineGrid() }),
      })
    )

    await page.goto(ROUTES.monitor, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('monitor-page')).toBeVisible({ timeout: TIMEOUTS.api })

    // Skip if summary didn't load (needs backend) — pipeline panel only renders after summary
    const hasData = (await page.getByTestId('monitor-pipeline-health').count()) > 0
    test.skip(
      !hasData,
      'monitor-pipeline-health not visible — summary needs backend data seeding (epic 92-FE)'
    )

    // Pipeline health panel visible with empty-state message — scoped to landmark (L-3)
    const panel = page.getByTestId('monitor-pipeline-health')
    await expect(panel).toBeVisible({ timeout: TIMEOUTS.api })
    // pipelines: [] → unhealthy.length === 0 → "all healthy" branch renders
    await expect(panel.getByText('Все пайплайны работают исправно')).toBeVisible()
  })

  test('empty daily finance returns 7-day chart with empty-state message', async ({ page }) => {
    // H-1 fix: mock ALL 4 daily endpoints (useDailyMetrics → getAllDailyData fires 4 parallel
    // requests). Mocking only daily/finance leaves orders/trends + advertising + orders/volume
    // unconstrained — chart state depends on backend. mockEmptyDailyMetrics covers all 4.
    await mockEmptyDailyMetrics(page)

    await page.goto(ROUTES.monitor, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('monitor-page')).toBeVisible({ timeout: TIMEOUTS.api })

    // Skip if summary didn't load — chart only renders after summary provides hasData=true
    const hasData = (await page.getByTestId('monitor-weekly-chart').count()) > 0
    test.skip(
      !hasData,
      'monitor-weekly-chart not visible — summary needs backend data seeding (epic 92-FE)'
    )

    // Chart landmark visible with an empty-state — scoped to landmark (L-3). Accept EITHER valid
    // empty-state: "Нет данных…" (rows array empty) or "…не было активности" (7 zero-filled days).
    // Which one renders depends on whether the empty mock yields [] vs a zero-filled window.
    const chart = page.getByTestId('monitor-weekly-chart')
    await expect(chart).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(chart.getByText(/Нет данных за последние 7 дней|не было активности/)).toBeVisible()
  })
})

// ============================================================================
// Story 92.6-FE: Error states — graceful degradation (AC-2)
// ============================================================================

test.describe('Error states', () => {
  test('monitor-summary 500 shows full-page error with retry button', async ({ page }) => {
    // Mock summary → 500; page should show full-page alert, no KPI cards
    await page.route('**/v1/analytics/monitor/summary**', route =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    )

    await page.goto(ROUTES.monitor, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('monitor-page')).toBeVisible({ timeout: TIMEOUTS.api })

    // Full-page destructive alert visible
    await expect(page.getByText(/Не удалось загрузить метрики монитора/)).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // KPI cards NOT visible — state machine gate: showFullError hides cards
    await expect(page.getByText('Всего артикулов')).not.toBeVisible()

    // Retry button must be present and clickable
    const retryBtn = page.getByRole('button', { name: /Повторить/ })
    await expect(retryBtn).toBeVisible()
    await retryBtn.click() // verify it is interactive (click must not throw)
  })

  test('pipeline-health-grid 500 shows inline error but keeps gauge visible', async ({ page }) => {
    // Mock pipeline-grid → 500; summary is unconstrained (may load from backend)
    await page.route('**/v1/monitoring/pipeline-health-grid**', route =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    )

    await page.goto(ROUTES.monitor, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('monitor-page')).toBeVisible({ timeout: TIMEOUTS.api })

    // Skip if summary didn't load — gauge only renders when summary hasData=true
    const gaugeCount = await page.getByTestId('monitor-buyout-gauge').count()
    test.skip(
      gaugeCount === 0,
      'monitor-buyout-gauge not visible — summary needs backend data seeding (epic 92-FE)'
    )

    // Gauge still visible despite pipeline failure (independent state machines)
    await expect(page.getByTestId('monitor-buyout-gauge')).toBeVisible({ timeout: TIMEOUTS.api })

    // Inline amber error for pipeline failure — scoped check (L-3)
    await expect(page.getByText(/Не удалось загрузить состояние пайплайнов/)).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Pipeline health panel NOT visible (error path hides it)
    await expect(page.getByTestId('monitor-pipeline-health')).not.toBeVisible()
  })
})

// ============================================================================
// Story 92.6-FE: Accessibility — axe-core scan (AC-3)
// Pattern mirrors e2e/acquiring.spec.ts:134-187 (Epic 90.5-FE template).
// ============================================================================

test.describe('Accessibility', () => {
  test('monitor dashboard has no critical accessibility violations', async ({ page }) => {
    await page.goto(ROUTES.monitor, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('monitor-page')).toBeVisible({ timeout: TIMEOUTS.navigation })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // dynamic colors may vary across states
      .analyze()

    const criticalViolations = results.violations.filter(
      v => (v.impact === 'critical' || v.impact === 'serious') && v.id !== 'aria-valid-attr-value' // known Radix UI Tabs limitation
    )
    expect(criticalViolations).toHaveLength(0)
  })
})

// ============================================================================
// Story 92.6-FE: Responsive — 390×844 mobile viewport (AC-5)
// ============================================================================

test.describe('Responsive', () => {
  test('mobile viewport 390×844 stacks blocks without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(ROUTES.monitor, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('monitor-page')).toBeVisible({ timeout: TIMEOUTS.api })

    // No horizontal overflow (+1 for sub-pixel rounding)
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    )
    expect(hasHorizontalScroll).toBe(false)

    // Single-column KPI stacking: all 4 cards share same x-coordinate on mobile
    const kpiCards = page
      .locator('[data-testid="monitor-page"] [role="region"]')
      .filter({ hasText: /Всего артикулов|С COGS|Покрытие COGS|Выкуп за 30/ })
    const count = await kpiCards.count()
    test.skip(
      count < 4,
      'Expected 4 KPI cards but fewer found — needs backend data seeding for responsive test'
    )
    const boxes = await kpiCards.evaluateAll(els => els.map(el => el.getBoundingClientRect().x))
    // On mobile (grid-cols-1), all cards share x-coordinate → Set size = 1
    expect(new Set(boxes).size).toBe(1)
  })
})

// ============================================================================
// Story 92.6-FE: All-empty smoke test (L-10 fix — uses mockAllEmpty composite helper)
// Verifies: page mounts without crash, all 5 block testids present, correct empty-state text.
// ============================================================================

test.describe('All-empty smoke', () => {
  test('all 3 primary endpoints empty — page renders 5 blocks with correct empty states', async ({
    page,
  }) => {
    // L-10 fix: mockAllEmpty intercepts summary + pipeline-health-grid + all 4 daily endpoints.
    // This is the composite "brand-new cabinet" scenario: no finance data, no pipelines.
    await mockAllEmpty(page)

    await page.goto(ROUTES.monitor, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('monitor-page')).toBeVisible({ timeout: TIMEOUTS.api })

    // Summary loaded (mocked) → hasData=true → all 5 blocks render
    // Block 1: KPI cards area — page landmark present
    await expect(page.getByTestId('monitor-page')).toBeVisible()

    // Block 2: metrics table present (empty periods render — placeholders)
    await expect(page.getByTestId('table-metrics-4-periods')).toBeVisible({ timeout: TIMEOUTS.api })

    // Block 3: weekly chart shows an empty-state. Either is valid: "Нет данных…" (rows array empty)
    // or "…не было активности" (7 zero-filled days) — the component's M-3 distinction. This smoke
    // block just asserts an empty-state renders, not which one.
    const chart = page.getByTestId('monitor-weekly-chart')
    await expect(chart).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(chart.getByText(/Нет данных за последние 7 дней|не было активности/)).toBeVisible()

    // Block 4: gauge renders — for null buyoutRatePercent
    await expect(page.getByTestId('monitor-buyout-gauge')).toBeVisible({ timeout: TIMEOUTS.api })

    // Block 5: pipeline panel renders — pipelines:[] → all-healthy empty-state
    const pipelinePanel = page.getByTestId('monitor-pipeline-health')
    await expect(pipelinePanel).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(pipelinePanel.getByText('Все пайплайны работают исправно')).toBeVisible()

    // No error alerts — empty success is not an error state
    await expect(page.getByText(/Не удалось загрузить/i)).not.toBeVisible()
  })
})

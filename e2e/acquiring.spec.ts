/**
 * E2E Tests: Acquiring Analytics
 * Story 90.2-FE: Acquiring Reports List Page
 * Story 90.5-FE: Accessibility scans for all 3 Acquiring pages (AC-2)
 *
 * Uses domcontentloaded + landmark waits (CLAUDE.md anti-pattern #9 — not networkidle).
 * Auth state loaded from e2e/.auth/user.json via playwright.config.ts.
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { TIMEOUTS } from './fixtures/test-data'

const ACQUIRING_URL = '/analytics/acquiring'
const PAGE_LANDMARK = '[data-testid="acquiring-page"]'
const SIDEBAR_LINK_TEXT = 'Эквайринг'

test.describe('Acquiring Analytics Page (Story 90.2-FE)', () => {
  test.beforeEach(async ({ page }) => {
    // Story 88.3-FE pattern: domcontentloaded, not networkidle (CLAUDE.md #9)
    await page.goto(ACQUIRING_URL, { waitUntil: 'domcontentloaded' })
  })

  test('navigates to /analytics/acquiring and shows page landmark + header', async ({ page }) => {
    // Wait for the page landmark (data-testid set on root container)
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })

    // Header text present
    await expect(page.getByRole('heading', { name: 'Аналитика эквайринга' })).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
  })

  test('sidebar contains Эквайринг link pointing to /analytics/acquiring', async ({ page }) => {
    // Navigate to a different page first so we can find the sidebar link
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

    const sidebarLink = page.getByRole('link', { name: SIDEBAR_LINK_TEXT })
    await expect(sidebarLink).toBeVisible({ timeout: TIMEOUTS.navigation })

    // Click it and verify navigation
    await sidebarLink.click()
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })
  })

  test('date picker opens when clicked', async ({ page }) => {
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })

    // Find the date picker trigger by its id (set in AcquiringPageContent)
    const trigger = page.locator('#acquiring-date-range, [id*="date-range"]').first()
    await expect(trigger).toBeVisible()
    await trigger.click()

    // Calendar popover should open as a dialog or with role="grid" (Radix DayPicker)
    const popoverOrCalendar = page.locator('[role="dialog"], [role="grid"]').first()
    await expect(popoverOrCalendar).toBeVisible({ timeout: 3000 })

    // Close the picker
    await page.keyboard.press('Escape')
  })

  test('empty state message visible when API returns no data', async ({ page }) => {
    // Mock the API to return empty data
    await page.route('**/v1/analytics/acquiring/reports**', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], cachedAt: '' }),
      })
    })

    await page.goto(ACQUIRING_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })

    // Empty state text should appear
    await expect(page.getByText(/Отчёты за выбранный период не найдены/)).toBeVisible({
      timeout: TIMEOUTS.api,
    })
  })
})

test.describe('Acquiring Report Detail Page (Story 90.3-FE)', () => {
  test('navigates directly to report detail page and shows landmark + header', async ({ page }) => {
    await page.goto('/analytics/acquiring/reports/12345', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('acquiring-report-detail')).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
    await expect(page.getByText('Отчёт #12345')).toBeVisible({ timeout: TIMEOUTS.navigation })
  })

  test('back button from detail page returns to acquiring list', async ({ page }) => {
    await page.goto('/analytics/acquiring/reports/12345', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('acquiring-report-detail')).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
    await page.getByText('Назад к отчётам').click()
    await expect(page).toHaveURL(/\/analytics\/acquiring$/)
    await expect(page.getByTestId('acquiring-page')).toBeVisible({ timeout: TIMEOUTS.navigation })
  })
})

test.describe('Acquiring Period Detail Page (Story 90.4-FE)', () => {
  test('navigates directly to period detail page and shows landmark + header', async ({ page }) => {
    // domcontentloaded — not networkidle (CLAUDE.md anti-pattern #9)
    await page.goto('/analytics/acquiring/period', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('acquiring-period-detail')).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
    await expect(page.getByText('Эквайринг за период')).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
  })

  test('"Детализация за период" link from list navigates to period view', async ({ page }) => {
    await page.goto('/analytics/acquiring', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('acquiring-page')).toBeVisible({ timeout: TIMEOUTS.navigation })

    await page.getByRole('link', { name: 'Детализация за период' }).click()

    await expect(page).toHaveURL(/\/analytics\/acquiring\/period$/)
    await expect(page.getByTestId('acquiring-period-detail')).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
  })
})

// ============================================================================
// Rate-limit resilience: Story 96.9-FE AC-4
// Mocks GET /v1/analytics/acquiring/reports to return 503 + Retry-After: 30
// and asserts the amber rate-limit banner is rendered with Russian copy.
// Uses domcontentloaded + toBeVisible (not networkidle / waitForTimeout).
// ============================================================================

test.describe('Acquiring rate-limit (Story 96.9-FE)', () => {
  test('list page shows rate-limit banner when API returns 503 + Retry-After', async ({ page }) => {
    // Route must be registered BEFORE navigation (anti-pattern #7 — no waitForTimeout)
    await page.route('**/v1/analytics/acquiring/reports**', route =>
      route.fulfill({
        status: 503,
        headers: { 'Retry-After': '30' },
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'WB rate-limited' } }),
      })
    )

    // domcontentloaded — not networkidle (CLAUDE.md anti-pattern #9)
    await page.goto(ACQUIRING_URL, { waitUntil: 'domcontentloaded' })

    // Banner must appear (deterministic wait via toBeVisible timeout)
    await expect(page.getByTestId('acquiring-rate-limit-banner')).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Russian copy check — regex not exact string (CLAUDE.md anti-pattern #6)
    await expect(page.getByTestId('acquiring-rate-limit-banner')).toContainText(
      /WB временно недоступна/
    )
    await expect(page.getByTestId('acquiring-rate-limit-banner')).toContainText(/30/)

    // Generic destructive error must NOT appear alongside the rate-limit banner
    await expect(page.getByText(/Не удалось загрузить отчёты/)).not.toBeVisible()
  })

  test('report detail page shows rate-limit banner when API returns 503 + Retry-After', async ({
    page,
  }) => {
    await page.route('**/v1/analytics/acquiring/reports/*/detail**', route =>
      route.fulfill({
        status: 503,
        headers: { 'Retry-After': '45' },
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'WB rate-limited' } }),
      })
    )
    await page.goto('/analytics/acquiring/reports/12345', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('acquiring-rate-limit-banner')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    await expect(page.getByTestId('acquiring-rate-limit-banner')).toContainText(
      /WB временно недоступна/
    )
    await expect(page.getByTestId('acquiring-rate-limit-banner')).toContainText(/45/)
  })

  test('period detail page shows rate-limit banner when API returns 503 + Retry-After', async ({
    page,
  }) => {
    await page.route('**/v1/analytics/acquiring/detail**', route =>
      route.fulfill({
        status: 503,
        headers: { 'Retry-After': '60' },
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'WB rate-limited' } }),
      })
    )
    await page.goto('/analytics/acquiring/period', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('acquiring-rate-limit-banner')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    await expect(page.getByTestId('acquiring-rate-limit-banner')).toContainText(
      /WB временно недоступна/
    )
    await expect(page.getByTestId('acquiring-rate-limit-banner')).toContainText(/60/)
  })
})

// ============================================================================
// Accessibility: Story 90.5-FE AC-2
// axe-core scans for all 3 Acquiring pages.
// Pattern mirrors dashboard-metrics.spec.ts: filter critical/serious violations,
// exclude known Radix UI aria-valid-attr-value limitation (Tabs).
// ============================================================================

test.describe('Accessibility — Acquiring pages (Story 90.5-FE)', () => {
  test('acquiring list page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/analytics/acquiring', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('acquiring-page')).toBeVisible({ timeout: TIMEOUTS.navigation })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // dynamic colors may vary
      .analyze()

    const criticalViolations = results.violations.filter(
      v => (v.impact === 'critical' || v.impact === 'serious') && v.id !== 'aria-valid-attr-value' // known Radix UI Tabs limitation
    )
    expect(criticalViolations).toHaveLength(0)
  })

  test('acquiring report detail page has no critical accessibility violations', async ({
    page,
  }) => {
    await page.goto('/analytics/acquiring/reports/12345', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('acquiring-report-detail')).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze()

    const criticalViolations = results.violations.filter(
      v => (v.impact === 'critical' || v.impact === 'serious') && v.id !== 'aria-valid-attr-value' // known Radix UI Tabs limitation
    )
    expect(criticalViolations).toHaveLength(0)
  })

  test('acquiring period detail page has no critical accessibility violations', async ({
    page,
  }) => {
    await page.goto('/analytics/acquiring/period', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('acquiring-period-detail')).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze()

    const criticalViolations = results.violations.filter(
      v => (v.impact === 'critical' || v.impact === 'serious') && v.id !== 'aria-valid-attr-value' // known Radix UI Tabs limitation
    )
    expect(criticalViolations).toHaveLength(0)
  })
})

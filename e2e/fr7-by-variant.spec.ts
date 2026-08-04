import { test, expect } from './fixtures/network-test'

/**
 * E2E: FR-7 «По цветомоделям» (variant analytics) — backend request #221.
 *
 * Validates the by-variant feature end-to-end in a real browser against live
 * data (frontend :3100 ↔ backend :3000):
 *  1. SKU page «По цветомоделям» toggle → VariantTable renders with the FBS footnote
 *  2. The ⚠️ allocated (approximate) markers render on the Прибыль/Маржа columns
 *  3. Single-week enforcement: range + group_by=variant falls back to sku (400 guard)
 *  4. Product detail «Варианты» tab → variant view + the single-week note
 *
 * Auth: uses the project's saved storageState (e2e/.auth/user.json) wired via the
 * `chromium` project in playwright.config.ts. Run with `--no-deps` to skip the
 * setup re-login (avoids the 5/hr login throttle):
 *   npx playwright test e2e/fr7-by-variant.spec.ts --project=chromium --no-deps
 *
 * No `networkidle` (anti-pattern #9 — dashboard/background polling never settles);
 * uses `waitUntil: 'domcontentloaded'` + element-presence assertions, matching the
 * repo's existing analytics specs (e.g. brand-analytics.spec.ts).
 */

const SKU = '/analytics/sku'
// nmId 202867769 has FBS variants in W26 (chrt 326996478, …).
const PRODUCT = '/analytics/product/202867769'
// W26 is verified to carry 14 variant rows (single-week; the by-variant endpoint
// 400s on a range). Used to force a single data-bearing week for happy-path tests.
const SINGLE_WEEK = '?group_by=variant&weekStart=2026-W26&weekEnd=2026-W26'
const RANGE_WEEKS = '?group_by=variant&weekStart=2026-W25&weekEnd=2026-W26'

const T = 20_000

// The ⚠️ AllocatedMarker / AllocatedHeaderMarker expose stable aria-labels (the
// test hook used by the unit suite too). Attribute selectors are robust on SVG.
const CELL_MARKER = '[aria-label="Приблизительное значение"]'
const HEADER_MARKER = '[aria-label="Столбец содержит приблизительные значения"]'

test.describe('FR-7 «По цветомоделям» variant analytics', () => {
  test('SKU page: «По цветомоделям» toggle switches to the variant table', async ({ page }) => {
    await page.goto(`${SKU}${SINGLE_WEEK}`, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: T })

    const variantBtn = page.getByRole('button', { name: 'По цветомоделям' })
    await expect(variantBtn).toBeVisible({ timeout: T })
    await variantBtn.click()

    // VariantTable footnote (only rendered when rows are present — confirms real data).
    await expect(page.getByText(/Выручка по вариантам — из FBS/)).toBeVisible({ timeout: T })
    await expect(page.locator('table').first()).toBeVisible({ timeout: T })
  })

  test('SKU page variant mode: ⚠️ allocated markers render on cells and headers', async ({
    page,
  }) => {
    await page.goto(`${SKU}${SINGLE_WEEK}`, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: T })

    await page.getByRole('button', { name: 'По цветомоделям' }).click()
    await expect(page.locator('table').first()).toBeVisible({ timeout: T })

    // Header markers (Прибыль + Маржа columns) — the load-bearing Defensive-FE
    // indicator that allocated values are approximate, never exact.
    const headerMarkers = page.locator(HEADER_MARKER)
    await expect(headerMarkers.first()).toBeVisible({ timeout: T })
    expect(await headerMarkers.count()).toBe(2)
    // At least one cell marker once rows render.
    await expect(page.locator(CELL_MARKER).first()).toBeVisible({ timeout: T })
  })

  test('SKU page: range + group_by=variant falls back to sku (single-week 400 guard)', async ({
    page,
  }) => {
    await page.goto(`${SKU}${RANGE_WEEKS}`, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: T })

    // VariantTable must NOT mount (effectiveGroupBy fell back to sku) → no footnote.
    await expect(page.getByText(/Выручка по вариантам — из FBS/)).toHaveCount(0)
    // The variant button is disabled in range mode (no path to the 400-ing endpoint).
    await expect(page.getByRole('button', { name: 'По цветомоделям' })).toBeDisabled({ timeout: T })
  })

  test('Product detail: «Варианты» tab renders the variant view + single-week note', async ({
    page,
  }) => {
    await page.goto(PRODUCT, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: T })

    const variantsTab = page.getByRole('tab', { name: 'Варианты' })
    await expect(variantsTab).toBeVisible({ timeout: T })
    await variantsTab.click()

    // VariantsTab always renders the single-week note (independent of data).
    await expect(
      page.getByText(/Данные по вариантам — за последнюю завершённую неделю/)
    ).toBeVisible({
      timeout: T,
    })
    // And either the table (this product has variants) or the graceful empty state.
    const tableOrEmpty = page.locator('table, :text("Нет вариантов FBS за эту неделю")')
    await expect(tableOrEmpty.first()).toBeVisible({ timeout: T })
  })
})

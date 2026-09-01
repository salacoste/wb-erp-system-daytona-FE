import { test, expect } from './fixtures/network-test'
import { installStory1625AnalyticsRoutes } from './fixtures/story-162-5-analytics'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

/**
 * E2E: Unit Economics waterfall Y-axis domain (validation F-44)
 *
 * F-44 replaced the hardcoded recharts `<YAxis domain={[0,100]}/>` with a dynamic
 * `computeWaterfallYDomain`, because live data (week 2026-W22) had 14/32 SKUs with
 * cogs_pct > 100% (COGS exceeds revenue). Those bars extend below 0% and were CLIPPED
 * by the fixed domain — visually understating the loss.
 *
 * This spec validates the fix end-to-end against a deterministic fixture: it finds a SKU whose
 * COGS% > 100, selects it (driving the waterfall to that SKU's breakdown), and asserts the
 * Y-axis renders at least one NEGATIVE tick. With the old `domain={[0,100]}` a negative tick
 * could never appear, so this is a true regression guard. The fixture deterministically includes
 * COGS above 100%, so the regression condition is required rather than optional.
 *
 * Uses element-presence waits + expect.poll, NOT networkidle (anti-pattern #9 — the page
 * background-polls) and no hard waitForTimeout (anti-pattern #7).
 */
test.describe('Unit Economics waterfall — F-44 Y-axis clipping', () => {
  test('a COGS>100% SKU renders a negative Y-axis tick (not clipped at 0)', async ({ page }) => {
    const controller = await installStory1625AnalyticsRoutes(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const initialResponse = page.waitForResponse(response => {
      const url = new URL(response.url())
      return (
        response.request().method() === 'GET' &&
        url.pathname === '/v1/analytics/unit-economics' &&
        url.searchParams.get('view_by') === 'sku' &&
        url.searchParams.get('sort_by') === 'revenue' &&
        url.searchParams.get('sort_order') === 'desc' &&
        response.status() === 200
      )
    })
    await page.goto(ROUTES.analytics.unitEconomics, { waitUntil: 'domcontentloaded' })
    const initial = await initialResponse
    const week = new URL(initial.url()).searchParams.get('week')
    if (!week) throw new Error('Unit Economics fixture request omitted the selected week')

    // Wait for the deterministic data table to populate (rows present).
    // 174.4: scope to the named SKU table — Story 174.3 (a9b4e82d) added an
    // sr-only chart-alternative table (UnitEconomicsWaterfallSummary, percent
    // cells) inside the waterfall section ABOVE the data table, so the
    // page-wide 'tbody tr' resolved to its "100,0 %" row instead of the
    // revenue-desc top SKU.
    const rows = page.getByRole('table', { name: 'Юнит-экономика по товарам' }).locator('tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(rows.first().locator('td').first()).toHaveText('700052')

    // The table is paginated + defaults to revenue-desc, so cogs>100% (loss-making) SKUs may sit
    // below the first page. COGS% itself isn't sortable, but Маржа % (net_margin_pct) is — and
    // cogs>100% ⟹ negative margin, so sorting margin ASCENDING surfaces the loss-makers onto the
    // first page deterministically (independent of which week the page defaults to).
    const marginHeader = page.locator('th', { hasText: 'Маржа' }).first()
    const marginDescending = page.waitForResponse(response => {
      const url = new URL(response.url())
      return (
        url.pathname === '/v1/analytics/unit-economics' &&
        url.searchParams.get('week') === week &&
        url.searchParams.get('sort_by') === 'net_margin_pct' &&
        url.searchParams.get('sort_order') === 'desc' &&
        response.status() === 200
      )
    })
    await marginHeader.click() // → sort net_margin_pct desc (profitable first)
    await marginDescending
    await expect(rows.first().locator('td').first()).toHaveText('700037')
    const marginAscending = page.waitForResponse(response => {
      const url = new URL(response.url())
      return (
        url.pathname === '/v1/analytics/unit-economics' &&
        url.searchParams.get('week') === week &&
        url.searchParams.get('sort_by') === 'net_margin_pct' &&
        url.searchParams.get('sort_order') === 'asc' &&
        response.status() === 200
      )
    })
    await marginHeader.click() // → toggle to asc (most negative / loss first)
    await marginAscending
    await expect(rows.first().locator('td').first()).toHaveText('700001')

    // COGS% is the 4th column (0-based td index 3): sku_id | name | revenue | COGS% | ...
    // Scan visible rows for the HIGHEST COGS% > 100 (deepest negative domain = clearest tick).
    // Russian-locale percentage ("133,3 %") → 133.3.
    const findMaxCogsRow = async (): Promise<{ idx: number; cogs: number }> => {
      const rowCount = await rows.count()
      let idx = -1
      let cogs = 100
      for (let i = 0; i < rowCount; i++) {
        const text = await rows.nth(i).locator('td').nth(3).innerText()
        const num = parseFloat(
          text
            .replace(/\s/g, '')
            .replace(/[^\d,.-]/g, '')
            .replace(',', '.')
        )
        if (Number.isFinite(num) && num > cogs) {
          idx = i
          cogs = num
        }
      }
      return { idx, cogs }
    }

    // Poll while the margin-sort re-fetch lands. The fixture contract requires this condition.
    let target = { idx: -1, cogs: 100 }
    await expect
      .poll(
        async () => {
          target = await findMaxCogsRow()
          return target.idx !== -1
        },
        {
          timeout: 8_000,
          message: 'expected the deterministic Story 162.5 fixture to include COGS above 100%',
        }
      )
      .toBe(true)
    const targetCogs = target.cogs

    // Select that SKU → the "Структура затрат" waterfall re-renders for its breakdown.
    await rows.nth(target.idx).click()

    // The Y-axis must now include a negative tick (dynamic domain extends below 0%).
    // expect.poll retries while recharts re-renders the axis — no hard wait.
    // recharts 3.x: the y-axis tick <text> nodes live under an element whose class CONTAINS
    // "yAxis" (the exact `.recharts-yAxis text` selector matches nothing in v3). Use
    // allTextContents() — NOT allInnerTexts(): innerText is empty for SVG <text> elements, so
    // allInnerTexts() returns []; textContent reads the rendered tick label. A negative tick
    // (e.g. "-45%") proves the domain extends below 0 — impossible under the old domain={[0,100]}.
    // Parse numerically (normalizing Unicode minus/dashes → ASCII) rather than string-matching.
    await expect
      .poll(
        async () => {
          const texts = await page.locator('[class*="yAxis"] text').allTextContents()
          return texts.some(t => {
            const n = parseFloat(
              t
                .replace(/[−–—]/g, '-')
                .replace(/\s/g, '')
                .replace(/[^\d.-]/g, '')
            )
            return Number.isFinite(n) && n < 0
          })
        },
        {
          timeout: 8_000,
          message: `expected a negative Y-axis tick for a ${targetCogs}% COGS SKU (F-44 dynamic domain)`,
        }
      )
      .toBe(true)
    controller.assertNoUnexpectedRequests()
  })
})

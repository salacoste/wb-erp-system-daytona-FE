import { test, expect } from '@playwright/test'
import { ROUTES } from './fixtures/test-data'

/**
 * E2E: Unit Economics waterfall Y-axis domain (validation F-44)
 *
 * F-44 replaced the hardcoded recharts `<YAxis domain={[0,100]}/>` with a dynamic
 * `computeWaterfallYDomain`, because live data (week 2026-W22) had 14/32 SKUs with
 * cogs_pct > 100% (COGS exceeds revenue). Those bars extend below 0% and were CLIPPED
 * by the fixed domain — visually understating the loss.
 *
 * This spec validates the fix end-to-end against the LIVE backend: it finds a SKU whose
 * COGS% > 100, selects it (driving the waterfall to that SKU's breakdown), and asserts the
 * Y-axis renders at least one NEGATIVE tick. With the old `domain={[0,100]}` a negative tick
 * could never appear, so this is a true regression guard. Skips cleanly (visible yellow, not a
 * silent green) when no cogs>100% row exists on the loaded week — no false positive.
 *
 * Uses element-presence waits + expect.poll, NOT networkidle (anti-pattern #9 — the page
 * background-polls) and no hard waitForTimeout (anti-pattern #7).
 */
test.describe('Unit Economics waterfall — F-44 Y-axis clipping', () => {
  test('a COGS>100% SKU renders a negative Y-axis tick (not clipped at 0)', async ({ page }) => {
    await page.goto(ROUTES.analytics.unitEconomics, { waitUntil: 'domcontentloaded' })

    // Wait for the live data table to populate (rows present).
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 20_000 })

    // COGS% is the 4th column (0-based td index 3): sku_id | name | revenue | COGS% | ...
    // Parse the Russian-locale percentage ("133,3 %") → 133.3 and pick the row with the HIGHEST
    // COGS% > 100 — the deepest negative domain gives the most unambiguous negative tick.
    const rowCount = await rows.count()
    let targetIdx = -1
    let targetCogs = 100
    for (let i = 0; i < rowCount; i++) {
      const cogsText = await rows.nth(i).locator('td').nth(3).innerText()
      const num = parseFloat(
        cogsText
          .replace(/\s/g, '')
          .replace(/[^\d,.-]/g, '')
          .replace(',', '.')
      )
      if (Number.isFinite(num) && num > targetCogs) {
        targetIdx = i
        targetCogs = num
      }
    }

    test.skip(
      targetIdx === -1,
      'No SKU with cogs_pct>100% on the loaded week — F-44 condition not reproducible with current live data'
    )

    // Select that SKU → the "Структура затрат" waterfall re-renders for its breakdown.
    await rows.nth(targetIdx).click()

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
  })
})

import { test, expect, type Page } from './fixtures/network-test'
import AxeBuilder from '@axe-core/playwright'
import { mockPriceCalculatorTariffReferences } from './fixtures/story-172-8-price-calculator'

/**
 * Epic 44-FE / Story 172.8: Price Calculator presentation E2E tests
 *
 * Story 44.21-FE: Card Elevation System & Shadow Hierarchy
 * Story 44.22-FE: Hero Price Display Enhancement
 *
 * Coverage is expressed through user-visible hierarchy, semantic state, responsive
 * layout, and accessible chart evidence rather than Tailwind implementation classes.
 */

test.describe('Epic 44-FE: Visual Enhancement Tests', () => {
  // ============================================================================
  // Setup & Helpers
  // ============================================================================

  test.beforeEach(async ({ page }) => {
    await mockPriceCalculatorTariffReferences(page)
    await page.goto('/cogs/price-calculator', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('[data-testid="price-calculator-form"]')).toBeVisible({
      timeout: 10000,
    })
  })

  async function fillInput(page: Page, id: string, value: string) {
    const input = page.locator(`#${id}`)
    await expect(input).toBeVisible()
    await input.fill(value)
    await expect(input).toHaveValue(value, { timeout: 5000 })
  }

  async function setTheme(page: Page, theme: 'light' | 'dark') {
    const root = page.locator('html')
    const themeButton = page
      .getByRole('button', { name: 'Переключить тему' })
      .filter({ visible: true })
    const hasDarkTheme = await root.evaluate(node => node.classList.contains('dark'))
    if (hasDarkTheme !== (theme === 'dark')) await themeButton.click()
    await expect
      .poll(() => root.evaluate(node => node.classList.contains('dark')))
      .toBe(theme === 'dark')
  }

  async function expectPageAxeClean(page: Page, context: string) {
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()
    expect(accessibility.violations, context).toEqual([])
  }

  async function expectMainHasNoHorizontalOverflow(page: Page) {
    const main = page.locator('main')
    await expect(main).toHaveCount(1)
    const dimensions = await main.evaluate(node => ({
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
    }))
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
  }

  async function tabTo(page: Page, target: ReturnType<Page['locator']>) {
    for (let step = 0; step < 60; step += 1) {
      if (await target.evaluate(node => document.activeElement === node)) break
      await page.keyboard.press('Tab')
    }
    await expect(target).toBeFocused()
  }

  /**
   * Helper: Mock API with specific margin scenario
   */
  async function mockCalculation(page: Page, marginPct: number, recommendedPrice = 2500) {
    const gap = marginPct > 20 ? 25 : marginPct > 10 ? 15 : 5
    await page.route('**/v1/products/price-calculator', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            recommended_price: recommendedPrice,
            minimum_price: recommendedPrice * (1 - gap / 100),
            customer_price: recommendedPrice * 0.9,
          },
          percentage_breakdown: {
            commission_wb: 375,
            acquiring: 45,
            advertising: 125,
            vat: recommendedPrice * 0.1,
            margin: recommendedPrice * (marginPct / 100),
          },
          warnings: [],
        }),
      })
    })
  }

  async function fillAndCalculate(page: Page, marginPct = 20) {
    await fillInput(page, 'cogs_rub', '1500')
    await fillInput(page, 'logistics_forward_rub', '150')
    await fillInput(page, 'logistics_reverse_rub', '200')
    await page.getByLabel('Маржа').fill(String(marginPct))
    await expect(page.getByLabel('Маржа')).toHaveValue(String(marginPct))

    const responsePromise = page.waitForResponse(
      response =>
        response.request().method() === 'POST' &&
        response.url().includes('/v1/products/price-calculator'),
      { timeout: 10000 }
    )
    await page.getByRole('button', { name: 'Рассчитать цену' }).click()
    expect((await responsePromise).status()).toBe(200)
  }

  async function expectSingleResults(page: Page) {
    const results = page.getByTestId('price-calculator-results')
    await expect(results).toHaveCount(1)
    await expect(results).toBeVisible({ timeout: 5000 })
    await expect(
      results.getByRole('heading', { name: 'Результат расчёта', level: 2, exact: true })
    ).toHaveCount(1)
    await expect(results.getByTestId('two-level-pricing-display')).toHaveCount(1)
    await expect(results.getByTestId('two-level-pricing-display')).toBeVisible()
    return results
  }

  // ============================================================================
  // User-visible surface hierarchy
  // ============================================================================

  test.describe('Story 172.8: Surface hierarchy', () => {
    test('TC-VIS-001: Form surface exposes its title and purpose', async ({ page }) => {
      const form = page.getByTestId('price-calculator-form')
      await expect(form).toBeVisible()
      await expect(form.getByText('Калькулятор цены', { exact: true })).toBeVisible()
      await expect(form.getByText(/Рассчитайте оптимальную цену/)).toBeVisible()
    })

    test('TC-VIS-002: Primary form actions are discoverable', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Рассчитать цену' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Сбросить', exact: true })).toBeVisible()
    })

    test('TC-VIS-003: Required cost fields have visible labels', async ({ page }) => {
      const form = page.getByTestId('price-calculator-form')
      await expect(form.getByLabel('Себестоимость (COGS)', { exact: true })).toBeVisible()
      await expect(form.getByLabel('Логистика к клиенту', { exact: true })).toBeVisible()
      await expect(form.getByLabel('Логистика возврата', { exact: true })).toBeVisible()
    })

    test('TC-VIS-004: Completed calculation has one result surface', async ({ page }) => {
      await mockCalculation(page, 20)
      await fillAndCalculate(page)
      await expectSingleResults(page)
    })

    test('TC-VIS-005: Completed calculation requires accessible chart evidence', async ({
      page,
    }) => {
      await mockCalculation(page, 20)
      await fillAndCalculate(page)
      const results = await expectSingleResults(page)
      await expect(results.getByText('Структура цены', { exact: true })).toBeVisible()
      await expect(results.getByRole('img', { name: /^Структура цены:/ })).toBeVisible()
    })

    test('TC-VIS-006: Result hierarchy preserves prices before chart detail', async ({ page }) => {
      await mockCalculation(page, 20)
      await fillAndCalculate(page)
      const results = await expectSingleResults(page)
      await expect(results.getByText('Минимальная цена', { exact: true })).toBeVisible()
      await expect(results.getByText('Рекомендуемая цена', { exact: true })).toBeVisible()
      await expect(results.getByText('Структура цены', { exact: true })).toBeVisible()
    })
  })

  // ============================================================================
  // Story 44.22-FE: Hero Price Display Enhancement
  // ============================================================================

  test.describe('Story 44.22-FE: Hero Price Display', () => {
    test('TC-VIS-007: Recommended price is the named target value', async ({ page }) => {
      await mockCalculation(page, 20)
      await fillAndCalculate(page)
      const results = await expectSingleResults(page)
      await expect(results.getByText('Рекомендуемая цена', { exact: true })).toBeVisible()
      await expect(results.getByText('Целевая', { exact: true })).toBeVisible()
      await expect(results.getByTestId('recommended-price')).toBeVisible()
    })

    test('TC-VIS-008: Price summary exposes minimum and recommended values', async ({ page }) => {
      await mockCalculation(page, 20)
      await fillAndCalculate(page)
      const results = await expectSingleResults(page)
      await expect(results.getByTestId('minimum-price')).toBeVisible()
      await expect(results.getByTestId('recommended-price')).toBeVisible()
    })

    test('TC-VIS-009: Price gap exposes a single semantic summary', async ({ page }) => {
      await mockCalculation(page, 30)
      await fillAndCalculate(page, 30)
      const results = await expectSingleResults(page)
      const gap = results.getByTestId('price-gap-indicator')
      await expect(gap).toHaveCount(1)
      await expect(gap).toContainText('Запас прибыльности:')
      await expect(gap).toContainText(/[+][\d\s,.]+\s*₽/)
    })

    test('TC-VIS-010: Healthy price gap does not show a loss warning', async ({ page }) => {
      await mockCalculation(page, 15)
      await fillAndCalculate(page, 15)
      const results = await expectSingleResults(page)
      await expect(results.getByTestId('price-gap-indicator')).toContainText('Запас прибыльности:')
      await expect(results.getByText(/низкий запас прибыльности/i)).toHaveCount(0)
    })

    test('TC-VIS-011: Tight margin exposes an explicit risk warning', async ({ page }) => {
      await mockCalculation(page, 5)
      await fillAndCalculate(page, 5)
      const results = await expectSingleResults(page)
      await expect(results.getByTestId('price-gap-indicator')).toContainText(
        'Низкий запас прибыльности — есть риск убытков'
      )
    })

    test('TC-VIS-012: Low margin shows warning text', async ({ page }) => {
      await mockCalculation(page, 5)
      await fillAndCalculate(page, 5)

      const results = await expectSingleResults(page)
      const warningText = results.getByText(/низкий запас прибыльности/i)
      await expect(warningText).toHaveCount(1)
      await expect(warningText).toBeVisible({ timeout: 5000 })
    })
  })

  // ============================================================================
  // Responsive Behavior Tests
  // ============================================================================

  test.describe('Responsive Behavior', () => {
    for (const theme of ['light', 'dark'] as const) {
      for (const width of [320, 390, 768, 1024, 1280, 1440]) {
        test(`TC-VIS-013-${theme}-${width}: ${theme} ${width}px keeps one readable result without overflow`, async ({
          page,
        }) => {
          await page.setViewportSize({ width, height: width < 768 ? 844 : 900 })
          await setTheme(page, theme)
          await mockCalculation(page, 20)
          await fillAndCalculate(page)

          const results = await expectSingleResults(page)
          await expect(results.getByTestId('recommended-price')).toBeVisible()
          await expect(results.getByRole('img', { name: /^Структура цены:/ })).toBeVisible()
          await expectMainHasNoHorizontalOverflow(page)
          await expectPageAxeClean(page, `${theme} ${width}px calculator page accessibility`)

          if (width === 320) {
            for (const label of ['Длина, см', 'Ширина, см', 'Высота, см']) {
              await expect(page.getByLabel(label)).toBeVisible()
            }

            await page.getByRole('combobox', { name: 'Выберите склад' }).click()
            const warehouseSearch = page.getByPlaceholder('Поиск склада...')
            await expect(warehouseSearch).toBeVisible()
            const searchBox = await warehouseSearch.boundingBox()
            expect(searchBox).not.toBeNull()
            expect(searchBox?.x).toBeGreaterThanOrEqual(0)
            expect((searchBox?.x ?? 0) + (searchBox?.width ?? 0)).toBeLessThanOrEqual(width)
            await expectPageAxeClean(
              page,
              `${theme} ${width}px open warehouse popover accessibility`
            )
          }
        })
      }
    }

    for (const theme of ['light', 'dark'] as const) {
      test(`TC-VIS-014-${theme}: ${theme} 200% zoom preserves long Russian values and reflow`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: 640, height: 900 })
        await setTheme(page, theme)
        await page.evaluate(() => {
          document.documentElement.style.zoom = '200%'
        })
        await mockCalculation(page, 20, 123_456_789.99)
        await fillAndCalculate(page)

        const results = await expectSingleResults(page)
        await expect(results.getByText('Рекомендуемая цена', { exact: true })).toBeVisible()
        await expect(results.getByTestId('recommended-price')).toHaveText(/[\d\s,.]+/)
        await expectMainHasNoHorizontalOverflow(page)
        await expectPageAxeClean(page, `${theme} 200% zoom calculator accessibility`)
      })
    }
  })

  // ============================================================================
  // Accessibility Tests for Visual Enhancements
  // ============================================================================

  test.describe('Accessibility', () => {
    test('TC-A11Y-001: VAT and margin chart evidence stays distinguishable across themes', async ({
      page,
    }) => {
      await mockCalculation(page, 20)
      await fillAndCalculate(page)

      const results = await expectSingleResults(page)
      const priceValue = results.getByTestId('recommended-price')

      for (const theme of ['light', 'dark'] as const) {
        await setTheme(page, theme)
        await expect(priceValue, `recommended price in ${theme} theme`).toBeVisible()
        await expect(priceValue, `recommended price value in ${theme} theme`).toHaveText(
          /[\d\s,.]+/
        )

        const vatSwatch = results.getByText(/^НДС/).locator('..').locator('[aria-hidden="true"]')
        const marginSwatch = results
          .getByText('Маржа', { exact: true })
          .locator('..')
          .locator('[aria-hidden="true"]')
        await expect(vatSwatch).toHaveCount(1)
        await expect(marginSwatch).toHaveCount(1)
        const vatColor = await vatSwatch.evaluate(node => getComputedStyle(node).backgroundColor)
        const marginColor = await marginSwatch.evaluate(
          node => getComputedStyle(node).backgroundColor
        )
        expect(vatColor, `${theme} VAT and margin swatches must differ`).not.toBe(marginColor)
        await expectPageAxeClean(page, `${theme} completed calculator accessibility`)
      }
    })

    test('TC-A11Y-002: Field errors and warehouse popover remain page-wide axe clean', async ({
      page,
    }) => {
      const length = page.getByLabel('Длина, см')
      await length.fill('-1')
      await expect(length).toHaveAttribute('aria-invalid', 'true')
      await expectPageAxeClean(page, 'calculator field-error accessibility')

      await page.getByRole('combobox', { name: 'Выберите склад' }).click()
      await expect(page.getByPlaceholder('Поиск склада...')).toBeVisible()
      await expectPageAxeClean(page, 'calculator warehouse popover accessibility')
    })

    test('TC-A11Y-003: Keyboard-only calculation reaches one announced result and keeps focus', async ({
      page,
    }) => {
      await mockCalculation(page, 20)
      const cogs = page.getByLabel('Себестоимость (COGS)', { exact: true })
      const forward = page.getByLabel('Логистика к клиенту', { exact: true })
      const reverse = page.getByLabel('Логистика возврата', { exact: true })
      const submit = page.getByRole('button', { name: 'Рассчитать цену' })

      await tabTo(page, cogs)
      await page.keyboard.type('1500')
      await tabTo(page, forward)
      await page.keyboard.type('150')
      await tabTo(page, reverse)
      await page.keyboard.type('200')
      await tabTo(page, submit)
      await page.keyboard.press('Enter')

      await expectSingleResults(page)
      await expect(page.getByRole('status').filter({ hasText: 'Расчёт завершён' })).toHaveCount(1)
      await expect(submit).toBeFocused()
      await expectPageAxeClean(page, 'keyboard-only completed calculator accessibility')
    })

    test('TC-A11Y-004: Decorative icons are hidden from screen readers', async ({ page }) => {
      await mockCalculation(page, 20)
      await fillAndCalculate(page)

      const results = await expectSingleResults(page)
      const hiddenIcons = results.locator('[aria-hidden="true"]')
      const count = await hiddenIcons.count()
      expect(count).toBeGreaterThan(0)
    })

    test('TC-A11Y-005: Price gap indicator has descriptive text', async ({ page }) => {
      await mockCalculation(page, 20)
      await fillAndCalculate(page)

      const results = await expectSingleResults(page)
      const gap = results.getByTestId('price-gap-indicator')
      await expect(gap).toHaveCount(1)
      await expect(gap).toContainText(/запас прибыльности/i)
    })
  })
})

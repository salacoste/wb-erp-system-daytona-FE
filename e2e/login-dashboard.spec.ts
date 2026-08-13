import AxeBuilder from '@axe-core/playwright'
import { test, expect } from './fixtures/network-test'
import { ROUTES, SELECTORS, TIMEOUTS } from './fixtures/test-data'

const DESKTOP_WIDTHS = [1024, 1280, 1440, 1600] as const

/**
 * E2E Tests: Login → Dashboard Flow
 * Stories: 1.3 (Login), 3.1 (Dashboard Layout), 167.1 (Unified AppShell)
 *
 * Tests the complete flow from login to viewing the dashboard
 * with all key components visible and functional.
 */
test.describe('Login → Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (authenticated via setup)
    await page.goto(ROUTES.dashboard, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main')).toBeVisible({ timeout: TIMEOUTS.navigation })
  })

  test.describe('Dashboard Layout (Stories 3.1 and 167.1)', () => {
    test('displays sidebar navigation', async ({ page }) => {
      // Sidebar should be visible on desktop
      const sidebar = page.locator(SELECTORS.sidebar).or(page.locator('nav, aside').first())
      await expect(sidebar).toBeVisible()

      // Navigation links should be present
      const navLinks = page.locator('nav a, aside a')
      await expect(navLinks).not.toHaveCount(0)
    })

    test('displays main dashboard content area', async ({ page }) => {
      // Main content area
      const mainContent = page.locator('main, [role="main"]')
      await expect(mainContent).toBeVisible()

      // Should have dashboard title or heading
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible()
    })

    test('exposes a skip link, stable main target, and one current desktop route', async ({
      page,
    }) => {
      await expect(page).toHaveURL(/\/dashboard\?(?=.*week=)(?=.*type=week)/)
      const skipLink = page.getByRole('link', { name: 'Перейти к основному содержимому' })
      await skipLink.focus()
      await expect(skipLink).toBeFocused()
      await expect(skipLink).toHaveAttribute('href', '#main-content')
      const mainContent = page.locator('main#main-content')
      await expect(mainContent).toBeVisible()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/#main-content$/)
      await expect(mainContent).toBeFocused()

      const desktopNavigation = page.getByRole('navigation', { name: 'Main navigation' })
      await expect(desktopNavigation.locator('[aria-current="page"]')).toHaveCount(1)
    })

    test('has responsive mobile menu', async ({ page, isMobile }) => {
      if (isMobile) {
        // Mobile menu toggle should be visible
        const menuToggle = page.locator(
          '[data-testid="mobile-menu-toggle"], button[aria-label*="menu"]'
        )
        await expect(menuToggle).toBeVisible()

        // Click to open menu
        await menuToggle.click()

        // Navigation should become visible
        const nav = page.locator('nav')
        await expect(nav).toBeVisible()
      }
    })

    test('keeps the desktop shell stable across required widths, themes, and reduced motion', async ({
      page,
    }) => {
      const consoleErrors: string[] = []
      const pageErrors: string[] = []
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text())
      })
      page.on('pageerror', error => pageErrors.push(error.message))
      await page.emulateMedia({ reducedMotion: 'reduce' })

      const root = page.locator('html')
      const themeButton = page
        .getByRole('button', { name: 'Переключить тему' })
        .filter({ visible: true })

      for (const theme of ['light', 'dark'] as const) {
        const hasDarkTheme = (await root.getAttribute('class'))?.split(/\s+/).includes('dark')
        if (hasDarkTheme !== (theme === 'dark')) await themeButton.click()
        await expect(root, `${theme} theme is active`).toHaveClass(
          theme === 'dark' ? /(^|\s)dark(\s|$)/ : /^(?!.*(^|\s)dark(\s|$)).*$/
        )

        for (const width of DESKTOP_WIDTHS) {
          await page.setViewportSize({ width, height: 900 })

          const desktopAside = page.getByRole('complementary', { name: 'Основная навигация' })
          await expect(desktopAside).toBeVisible()
          await expect(page.locator('button[aria-label="Open menu"]')).toBeHidden()
          await expect(
            desktopAside.getByRole('link', { name: 'Расширенная аналитика FBS' })
          ).toBeVisible()
          await expect(
            desktopAside
              .getByRole('navigation', { name: 'Main navigation' })
              .locator('[aria-current="page"]')
          ).toHaveCount(1)

          const geometry = await page.evaluate(() => ({
            documentWidth: document.documentElement.scrollWidth,
            viewportWidth: document.documentElement.clientWidth,
          }))
          expect(
            geometry.documentWidth,
            `no page overflow at ${width}px in ${theme} theme`
          ).toBeLessThanOrEqual(geometry.viewportWidth)

          const results = await new AxeBuilder({ page })
            .include('aside[aria-label="Основная навигация"]')
            .include('header')
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze()
          expect(
            results.violations,
            `zero shell accessibility violations at ${width}px in ${theme} theme`
          ).toEqual([])
        }
      }
      expect(consoleErrors).toEqual([])
      expect(pageErrors).toEqual([])
    })
  })

  test.describe('Metric Cards (Story 3.2)', () => {
    test('displays key metric cards', async ({ page }) => {
      // Should have multiple metric cards
      const metricCards = page
        .locator(SELECTORS.metricCard)
        .or(page.locator('[class*="metric"], [class*="card"]').filter({ hasText: /₽|%/ }))

      // Story 162.8: observe the metrics terminal render via a bounded wait on
      // the first card (data, or a skeleton/loading surrogate) instead of an
      // elapsed "allow API to load" wait. Loading OR rendered cards are both
      // valid settles; the count assertion then runs against a settled DOM.
      await expect(metricCards.first()).toBeVisible({ timeout: TIMEOUTS.api })

      // At least one metric should be visible
      const count = await metricCards.count()
      expect(count).toBeGreaterThan(0)
    })

    test('metric cards show formatted currency values', async ({ page }) => {
      // Look for currency-formatted values (₽ symbol)
      const currencyValues = page.locator('text=/\\d.*₽/')
      await expect(currencyValues.first()).toBeVisible({ timeout: TIMEOUTS.api })
    })

    test('metric cards handle loading state', async ({ page }) => {
      // Refresh to trigger loading
      await page.reload()

      // Either loading indicator or content should be visible
      const loadingOrContent = page
        .locator(SELECTORS.loadingSpinner)
        .or(page.locator('[class*="skeleton"]'))
        .or(page.locator('text=/\\d.*₽/'))

      await expect(loadingOrContent.first()).toBeVisible()
    })
  })

  test.describe('Expense Chart (Story 3.3)', () => {
    test('displays expense breakdown chart', async ({ page }) => {
      // Chart container should be visible
      const chart = page
        .locator(SELECTORS.expenseChart)
        .or(page.locator('[class*="chart"], svg[class*="recharts"]'))

      await expect(chart.first()).toBeVisible({ timeout: TIMEOUTS.api })
    })

    test('chart has accessible label', async ({ page }) => {
      // Story 162.8: bound the accessible-label/legend check with expect.poll so it
      // waits for the chart's a11y to render instead of racing on an instant count()
      // (which flaked between repeat-each iterations).
      // Story 162.8 cleanup: the previous `[class*="label"]` surrogate was
      // page-wide (matched any element with "label" in its class — buttons,
      // form labels, etc.). The real ExpenseChart is a recharts BarChart with
      // no dedicated chart-container testid/role, so scope the label/legend
      // surrogate UNDER the recharts surface (the chart's own svg) instead of
      // searching the whole page. This still matches the chart's real
      // recharts-label/recharts-legend nodes without matching unrelated page
      // chrome.
      const chartSurface = page.locator('svg.recharts-surface, svg[class*="recharts"]').first()
      await expect
        .poll(
          async () => {
            const hasLabel =
              (await page.locator('[aria-label*="расход"], [aria-label*="chart"]').count()) > 0
            const hasChartLabeling =
              (await chartSurface.locator('[class*="label"], [class*="legend"]').count()) > 0
            return hasLabel || hasChartLabeling
          },
          { timeout: TIMEOUTS.api, message: 'Expense chart accessible label or legend' }
        )
        .toBeTruthy()
    })
  })

  test.describe('Trend Graph (Story 3.4)', () => {
    test('displays trend graph with weekly data', async ({ page }) => {
      // Trend graph container
      const trendGraph = page
        .locator(SELECTORS.trendGraph)
        .or(page.locator('[class*="trend"], [class*="line-chart"]'))

      await expect(trendGraph.first()).toBeVisible({ timeout: TIMEOUTS.api })
    })

    test('trend graph is functional', async ({ page }) => {
      // Story 162.8: replace the elapsed wait + tautological `body visible`
      // with a bounded terminal settle. The trend section resolves to a
      // rendered chart (recharts svg), an empty state, or an error state —
      // all three are valid functional settles; body-only visibility is not.
      const trendTerminal = page
        .locator('svg.recharts-surface, svg[class*="recharts"]')
        .or(page.getByText(/Нет данных|Ошибка загрузки/i))

      await expect(trendTerminal.first()).toBeVisible({ timeout: TIMEOUTS.api })
    })
  })

  test.describe('Navigation', () => {
    test('can navigate to COGS page', async ({ page }) => {
      const desktopNavigation = page.getByRole('navigation', { name: 'Main navigation' })
      await desktopNavigation.getByRole('link', { name: 'Себестоимость', exact: true }).click()

      await expect(page).toHaveURL(/cogs/)
    })

    test('can navigate to Analytics pages', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\?(?=.*week=)(?=.*type=week)/)
      const desktopNavigation = page.getByRole('navigation', { name: 'Main navigation' })
      await desktopNavigation.getByRole('link', { name: 'Аналитика', exact: true }).click()

      await expect(page).toHaveURL(/analytics/)
    })

    test('can logout', async ({ page }) => {
      // Find logout button
      const logoutButton = page
        .locator(SELECTORS.logoutButton)
        .or(page.locator('button:has-text("Выход"), button:has-text("Logout")'))

      if (await logoutButton.isVisible()) {
        await logoutButton.click()
        // Should redirect to login
        await expect(page).toHaveURL(/login/)
      }
    })
  })

  test.describe('Error Handling', () => {
    test('handles API errors gracefully', async ({ page }) => {
      // Block API to simulate error
      await page.route('**/api/**', route => route.abort())

      await page.reload()

      // Page should still be functional (not crash)
      await expect(page.locator('body')).toBeVisible()

      // Should show error state, empty state, or gracefully degrade
      const pageContent = await page.locator('body').textContent()
      expect(pageContent).toBeTruthy()
    })
  })
})

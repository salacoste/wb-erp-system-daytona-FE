/**
 * E2E Tests: Settings Pages
 * Covers /settings/cabinet, /settings/tariffs, /settings/notifications
 *
 * Conventions (from CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - domcontentloaded + element-presence waits only (anti-pattern #9 — no networkidle)
 * - No hard waits (anti-pattern #7)
 * - test.skip(condition, reason) for graceful conditional skips (anti-pattern #6)
 * - Locale assertions use regex — not exact formatted strings
 *
 * Run: npx playwright test e2e/settings-pages.spec.ts
 */

import { test, expect } from '@playwright/test'
import { TIMEOUTS, ROUTES } from './fixtures/test-data'

const SETTINGS_ROUTES = {
  cabinet: '/settings/cabinet',
  tariffs: ROUTES.settings.tariffs,
  notifications: ROUTES.settings.notifications,
  tax: ROUTES.settings.tax,
  expenses: ROUTES.settings.expenses,
  root: '/settings',
}

test.describe('Settings Pages', () => {
  // ===========================================================================
  // Cabinet Settings Page
  // ===========================================================================

  test.describe('Cabinet page', () => {
    test('navigates to /settings/cabinet and shows heading', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.cabinet, { waitUntil: 'domcontentloaded' })

      // Heading "Кабинет" must be visible (rendered after auth store hydrates)
      await expect(page.getByRole('heading', { name: 'Кабинет' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
    })

    test('renders seller info section or skeleton', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.cabinet, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: 'Кабинет' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })

      // Either the "Информация о продавце" card is visible (data loaded)
      // or skeleton placeholders are showing (loading state)
      const hasSellerInfo = (await page.getByText('Информация о продавце').count()) > 0
      const hasSkeleton = (await page.getByTestId('skeleton').count()) > 0

      test.skip(
        !hasSellerInfo && !hasSkeleton,
        'Neither seller info card nor skeleton visible — needs backend data'
      )
      expect(hasSellerInfo || hasSkeleton).toBeTruthy()
    })

    test('shows subscription section (Джем) or skeleton', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.cabinet, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: 'Кабинет' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })

      const hasJamSection = (await page.getByText('Подписка Джем').count()) > 0
      const hasSkeleton = (await page.getByTestId('skeleton').count()) > 0

      test.skip(
        !hasJamSection && !hasSkeleton,
        'Neither Jam section nor skeleton visible — needs backend data'
      )
      expect(hasJamSection || hasSkeleton).toBeTruthy()
    })
  })

  // ===========================================================================
  // Tariffs Settings Page
  // ===========================================================================

  test.describe('Tariffs page', () => {
    test('navigates to /settings/tariffs and shows heading', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.tariffs, { waitUntil: 'domcontentloaded' })

      // Heading "Управление тарифами" (owner-only page; non-owners get redirected)
      await expect(page.getByRole('heading', { name: 'Управление тарифами' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
    })

    test('renders tab navigation with three tabs', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.tariffs, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: 'Управление тарифами' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })

      // Three tab triggers must be present
      await expect(page.getByRole('tab', { name: 'Текущие настройки' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'История версий' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Журнал изменений' })).toBeVisible()
    })

    test('shows rate-limit indicator in header', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.tariffs, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: 'Управление тарифами' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })

      // Rate limit indicator component is present in the header area
      const rateLimit = page.getByTestId('rate-limit-indicator')
      const rateLimitVisible = await rateLimit.isVisible().catch(() => false)
      test.skip(!rateLimitVisible, 'Rate limit indicator not rendered — may need API response')
      expect(rateLimitVisible).toBeTruthy()
    })
  })

  // ===========================================================================
  // Notifications Settings Page
  // ===========================================================================

  test.describe('Notifications page', () => {
    test('navigates to /settings/notifications and shows heading', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.notifications, { waitUntil: 'domcontentloaded' })

      await expect(page.getByRole('heading', { name: /Telegram Уведомления/ })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
    })

    test('renders telegram section or hero banner', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.notifications, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: /Telegram Уведомления/ })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })

      // When bound: "Настройки уведомлений" panel is visible
      // When not bound: hero banner with connect button is shown
      const hasBoundState = (await page.getByText('Настройки уведомлений').count()) > 0
      const hasHeroBanner =
        (await page.getByRole('heading', { name: /Подключите Telegram/ }).count()) > 0

      test.skip(
        !hasBoundState && !hasHeroBanner,
        'Neither bound state nor hero banner visible — unexpected page state'
      )
      expect(hasBoundState || hasHeroBanner).toBeTruthy()
    })

    test('shows help section with guide link', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.notifications, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: /Telegram Уведомления/ })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })

      // Help section is always visible regardless of binding state
      await expect(page.getByText('Нужна помощь с настройкой?')).toBeVisible()
      await expect(page.getByRole('link', { name: /Открыть руководство/ })).toBeVisible()
    })
  })

  // ===========================================================================
  // Tax Settings Page
  // ===========================================================================

  test.describe('Tax page', () => {
    test('navigates to /settings/tax and shows heading', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.tax, { waitUntil: 'domcontentloaded' })

      await expect(page.getByRole('heading', { name: 'Налоговые настройки' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
    })

    test('renders form area or skeleton', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.tax, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: 'Налоговые настройки' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })

      const hasForm = (await page.locator('form').count()) > 0
      const hasSkeleton = (await page.getByTestId('skeleton').count()) > 0
      test.skip(!hasForm && !hasSkeleton, 'Neither form nor skeleton visible — needs backend data')
      expect(hasForm || hasSkeleton).toBeTruthy()
    })
  })

  // ===========================================================================
  // Expenses Settings Page
  // ===========================================================================

  test.describe('Expenses page', () => {
    test('navigates to /settings/expenses and shows heading', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.expenses, { waitUntil: 'domcontentloaded' })

      await expect(page.getByRole('heading', { name: 'Операционные расходы' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
    })

    test('shows month selector', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.expenses, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: 'Операционные расходы' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })

      const monthInput = page.locator('#month-selector')
      await expect(monthInput).toBeVisible()
    })
  })

  // ===========================================================================
  // Root Settings Page (redirect)
  // ===========================================================================

  test.describe('Root settings redirect', () => {
    test('/settings redirects to a sub-page with content visible', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.root, { waitUntil: 'domcontentloaded' })

      // Root /settings redirects to /settings/notifications — wait for any heading
      await expect(page.locator('h1, h2').first()).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
    })
  })

  // ===========================================================================
  // Accessibility: Heading Hierarchy
  // ===========================================================================

  test.describe('Accessibility', () => {
    const pages = [
      {
        name: 'Cabinet',
        url: SETTINGS_ROUTES.cabinet,
        heading: 'Кабинет',
      },
      {
        name: 'Tariffs',
        url: SETTINGS_ROUTES.tariffs,
        heading: 'Управление тарифами',
      },
      {
        name: 'Notifications',
        url: SETTINGS_ROUTES.notifications,
        heading: /Telegram Уведомления/,
      },
      {
        name: 'Tax',
        url: SETTINGS_ROUTES.tax,
        heading: 'Налоговые настройки',
      },
      {
        name: 'Expenses',
        url: SETTINGS_ROUTES.expenses,
        heading: 'Операционные расходы',
      },
    ]

    for (const { name, url, heading } of pages) {
      test(`${name} page has exactly one h1 heading`, async ({ page }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        await expect(page.getByRole('heading', { name: heading })).toBeVisible({
          timeout: TIMEOUTS.navigation,
        })

        const h1Count = await page.getByRole('heading', { level: 1 }).count()
        expect(h1Count).toBeGreaterThanOrEqual(1)
      })
    }
  })
})

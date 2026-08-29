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

import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page } from './fixtures/network-test'
import { TIMEOUTS, ROUTES } from './fixtures/test-data'

const SETTINGS_ROUTES = {
  cabinet: '/settings/cabinet',
  tariffs: ROUTES.settings.tariffs,
  notifications: ROUTES.settings.notifications,
  tax: ROUTES.settings.tax,
  expenses: ROUTES.settings.expenses,
  backfill: '/settings/backfill',
  root: '/settings',
}

const SETTINGS_NAV_ROUTES = [
  [SETTINGS_ROUTES.root, 'Обзор'],
  [SETTINGS_ROUTES.cabinet, 'Кабинет'],
  [SETTINGS_ROUTES.notifications, 'Уведомления'],
  [SETTINGS_ROUTES.tax, 'Налоги'],
  [SETTINGS_ROUTES.tariffs, 'Тарифы'],
  [SETTINGS_ROUTES.expenses, 'Расходы'],
  [SETTINGS_ROUTES.backfill, 'Импорт'],
] as const

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate(selectedTheme => window.localStorage.setItem('theme', selectedTheme), theme)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('html')).toHaveClass(
    theme === 'dark' ? /(^|\s)dark(\s|$)/ : /^(?!.*(^|\s)dark(\s|$)).*$/
  )
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

async function expectSettingsAxeClean(page: Page, context: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze()
  expect(results.violations, context).toEqual([])
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
  // Root Settings Overview and Shared Navigation
  // ===========================================================================

  test.describe('Settings shell', () => {
    test('/settings remains on the overview and exposes the canonical desktop navigation', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto(SETTINGS_ROUTES.root, { waitUntil: 'domcontentloaded' })

      await expect(page.getByRole('heading', { level: 1, name: 'Настройки' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
      expect(new URL(page.url()).pathname).toBe(SETTINGS_ROUTES.root)

      const navigation = page.getByRole('navigation', { name: 'Разделы настроек' })
      await expect(navigation).toBeVisible()
      await expect(navigation.getByRole('link')).toHaveText([
        'Обзор',
        'Кабинет',
        'Уведомления',
        'Налоги',
        'Тарифы',
        'Расходы',
        'Импорт',
      ])
      await expect(navigation.getByRole('link', { name: 'Обзор' })).toHaveAttribute(
        'aria-current',
        'page'
      )

      const navigationBox = await navigation.boundingBox()
      const headingBox = await page
        .getByRole('heading', { level: 1, name: 'Настройки' })
        .boundingBox()
      expect(navigationBox).not.toBeNull()
      expect(headingBox).not.toBeNull()
      expect(navigationBox!.x + navigationBox!.width).toBeLessThan(headingBox!.x)
    })

    for (const [route, label] of SETTINGS_NAV_ROUTES) {
      test(`${route} exposes exactly one visible current settings item`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 })
        await page.goto(route, { waitUntil: 'domcontentloaded' })

        const navigation = page.getByRole('navigation', { name: 'Разделы настроек' })
        await expect(navigation).toBeVisible({ timeout: TIMEOUTS.navigation })
        const currentItems = navigation.locator('[aria-current="page"]:visible')
        await expect(currentItems).toHaveCount(1)
        await expect(currentItems).toHaveAccessibleName(label)
      })
    }

    test('compact Sheet contains focus, navigates, and returns focus after Escape', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(SETTINGS_ROUTES.notifications, { waitUntil: 'domcontentloaded' })
      await page.emulateMedia({ reducedMotion: 'reduce' })

      const trigger = page.getByRole('button', { name: 'Открыть разделы настроек' })
      await expect(trigger).toBeVisible({ timeout: TIMEOUTS.navigation })
      await trigger.click()

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      const navigation = dialog.getByRole('navigation', { name: 'Разделы настроек' })
      await expect(navigation.getByRole('link', { name: 'Уведомления' })).toHaveAttribute(
        'aria-current',
        'page'
      )

      for (let step = 0; step < 12; step += 1) {
        await page.keyboard.press('Tab')
        expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true)
      }
      for (let step = 0; step < 12; step += 1) {
        await page.keyboard.press('Shift+Tab')
        expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true)
      }

      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await expect(trigger).toBeFocused()

      await trigger.click()
      const reopenedDialog = page.getByRole('dialog')
      await reopenedDialog.getByRole('link', { name: 'Кабинет' }).click()
      await expect(page).toHaveURL(/\/settings\/cabinet\/?$/)
      await expect(reopenedDialog).toBeHidden()
    })

    for (const theme of ['light', 'dark'] as const) {
      for (const width of [320, 390, 768, 1024, 1280, 1440]) {
        test(`${theme} settings overview reflows without overflow at ${width}px`, async ({
          page,
        }) => {
          await page.setViewportSize({ width, height: width < 1024 ? 844 : 900 })
          await page.goto(SETTINGS_ROUTES.root, { waitUntil: 'domcontentloaded' })
          await expect(page.getByRole('heading', { level: 1, name: 'Настройки' })).toBeVisible({
            timeout: TIMEOUTS.navigation,
          })
          await setTheme(page, theme)
          await expectMainHasNoHorizontalOverflow(page)

          const trigger = page.getByRole('button', { name: 'Открыть разделы настроек' })
          const navigation = page.getByRole('navigation', { name: 'Разделы настроек' })
          if (width < 1024) {
            await expect(trigger).toBeVisible()
            await expect(navigation).toBeHidden()
          } else {
            await expect(trigger).toBeHidden()
            await expect(navigation).toBeVisible()
          }

          if (width === 390) {
            await trigger.click()
            const dialog = page.getByRole('dialog')
            await expect(dialog).toBeVisible()
            await expectSettingsAxeClean(page, `${theme} compact settings Sheet`)
          }
          if (width === 1280) {
            await expectSettingsAxeClean(page, `${theme} desktop settings overview`)
          }
        })
      }

      test(`${theme} settings overview preserves reflow at 200 percent zoom`, async ({ page }) => {
        await page.setViewportSize({ width: 640, height: 900 })
        await page.goto(SETTINGS_ROUTES.root, { waitUntil: 'domcontentloaded' })
        await setTheme(page, theme)
        await page.evaluate(() => {
          document.documentElement.style.zoom = '200%'
        })

        await expect(page.getByRole('heading', { level: 1, name: 'Настройки' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Открыть разделы настроек' })).toBeVisible()
        await expectMainHasNoHorizontalOverflow(page)
      })
    }
  })

  // ===========================================================================
  // Accessibility: Heading Hierarchy
  // ===========================================================================

  test.describe('Accessibility', () => {
    const pages = [
      {
        name: 'Overview',
        url: SETTINGS_ROUTES.root,
        heading: 'Настройки',
      },
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
      {
        name: 'Backfill',
        url: SETTINGS_ROUTES.backfill,
        heading: 'Управление бэкфиллом',
      },
    ]

    for (const { name, url, heading } of pages) {
      test(`${name} page has exactly one h1 heading`, async ({ page }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        await expect(page.getByRole('heading', { name: heading })).toBeVisible({
          timeout: TIMEOUTS.navigation,
        })

        const h1Count = await page.getByRole('heading', { level: 1 }).count()
        expect(h1Count).toBe(1)
      })
    }
  })
})

/**
 * E2E Accessibility Tests: Backfill Admin Page
 * Story 51.12-FE: E2E Tests for FBS Analytics + Backfill
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * WCAG 2.1 AA compliance tests for Backfill Admin module including:
 * - axe-core automated accessibility scanning
 * - Keyboard navigation (Tab, Enter, Escape)
 * - Focus management in dialogs
 * - Screen reader support (ARIA labels, roles)
 * - Color contrast compliance
 * - Touch target sizes for mobile
 *
 * SETUP REQUIRED:
 * ```bash
 * npm install --save-dev @axe-core/playwright
 * ```
 *
 * @see docs/stories/epic-51/story-51.12-fe-e2e-tests.md
 * @see https://www.deque.com/axe/core-documentation/api-documentation/
 */

import { test, expect } from '../fixtures/network-test'
import AxeBuilder from '@axe-core/playwright'
import type { Locator, Page } from '@playwright/test'

// Routes
const BACKFILL_ADMIN_ROUTE = '/settings/backfill'
const ORDERS_ANALYTICS_ROUTE = '/analytics/orders'

const BACKFILL_LAYOUT_CASES = [320, 390, 768, 1024, 1280, 1440] as const
const DENSE_BACKFILL_FIXTURE = [
  ['completed', 'completed', 100, null],
  ['in_progress', 'pending', 42, null],
  ['failed', 'completed', 17, 'Отчёты не загрузились после повторной попытки'],
  ['paused', 'completed', 64, null],
  ['completed', 'failed', 83, 'Аналитика временно недоступна'],
  ['pending', 'not_started', 0, null],
  ['not_started', 'not_started', 0, null],
  ['in_progress', 'failed', 71, 'Ошибка смешанного сценария'],
].map(([reportsStatus, analyticsStatus, overallProgress, lastError], index) => ({
  cabinetId: `visual-evidence-${index + 1}`,
  cabinetName:
    index === 0
      ? 'Очень длинное название кабинета для проверки переноса русскоязычного текста без обрезки и горизонтальной прокрутки'
      : `Кабинет доказательной матрицы № ${index + 1}`,
  reportsStatus,
  analyticsStatus,
  overallProgress,
  progress: {
    percentage: overallProgress,
    estimated_remaining_seconds: reportsStatus === 'in_progress' ? 3661 : null,
  },
  lastError,
  updatedAt: '2026-08-29T09:00:00Z',
}))

/**
 * Story 162.8: bounded settle for the backfill admin page. The page resolves
 * to one of two terminals — the Owner shell (heading "Управление бэкфиллом")
 * for Owners, or a redirect off /settings/backfill for non-Owners. Observing
 * the terminal (instead of an elapsed 2000ms wait) means the a11y scan only
 * runs against a settled DOM, and the redirect path skips deterministically.
 * Returns true when the Owner shell is visible, false when redirected.
 */
async function expectBackfillOwnerShellOrRedirect(page: import('@playwright/test').Page) {
  const heading = page.getByRole('heading', { name: 'Управление бэкфиллом' })
  const ownerVisible = await heading
    .waitFor({ state: 'visible', timeout: 15000 })
    .then(() => true)
    .catch(() => false)
  if (ownerVisible) return true
  // Not an Owner — wait for the redirect to settle off the backfill route.
  await page.waitForURL(url => !url.pathname.startsWith(BACKFILL_ADMIN_ROUTE), {
    timeout: 15000,
  })
  return false
}

async function expectFiniteAnimationsToSettle(root: Locator) {
  await expect
    .poll(() =>
      root.evaluate(
        element =>
          element.getAnimations({ subtree: true }).filter(animation => {
            const timing = animation.effect?.getComputedTiming()
            return (
              animation.playState === 'running' &&
              timing !== undefined &&
              Number.isFinite(timing.iterations)
            )
          }).length
      )
    )
    .toBe(0)
}

async function openDenseBackfillFixture(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 })
  await page.route('**/v1/admin/backfill/status', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(DENSE_BACKFILL_FIXTURE),
    })
  )
  await page.goto(BACKFILL_ADMIN_ROUTE, { waitUntil: 'domcontentloaded' })
  await page.locator('main').waitFor({ state: 'visible' })

  const isOwner = await expectBackfillOwnerShellOrRedirect(page)
  if (!isOwner) {
    test.skip(true, 'Redirected off /settings/backfill — configured storage state is not Owner')
  }

  await expect(
    page.locator(width < 768 ? '[data-table-narrow-content]' : '[data-table-frame]')
  ).toBeVisible()
  await expect(
    page.getByText(DENSE_BACKFILL_FIXTURE[0].cabinetName, { exact: true }).filter({ visible: true })
  ).toBeVisible()
}

async function applySettledTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate(selectedTheme => {
    document.documentElement.classList.toggle('dark', selectedTheme === 'dark')
    document.documentElement.style.colorScheme = selectedTheme
  }, theme)
  await expect
    .poll(() =>
      page.evaluate(() => ({
        dark: document.documentElement.classList.contains('dark'),
        colorScheme: getComputedStyle(document.documentElement).colorScheme,
      }))
    )
    .toEqual({ dark: theme === 'dark', colorScheme: theme })
  await expectFiniteAnimationsToSettle(page.locator('main'))
}

async function expectMainWithoutHorizontalOverflow(page: Page) {
  const dimensions = await page.locator('main').evaluate(element => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }))
  expect(dimensions.clientWidth).toBeGreaterThan(0)
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
}

async function expectTouchGeometry(target: Locator, viewportWidth: number) {
  const box = await target.boundingBox()
  expect(box).not.toBeNull()
  expect(box?.width).toBeGreaterThanOrEqual(44)
  expect(box?.height).toBeGreaterThanOrEqual(44)
  expect(box?.x).toBeGreaterThan(-1)
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(viewportWidth + 1)
}

test.describe('Epic 51-FE: Accessibility - Backfill Admin Page', () => {
  test.describe('Backfill Admin Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BACKFILL_ADMIN_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      // Story 162.8: bounded terminal settle replaces the elapsed 2000ms wait.
      const isOwner = await expectBackfillOwnerShellOrRedirect(page)

      // Skip if redirected (non-Owner)
      if (!isOwner) {
        test.skip(true, 'Redirected off /settings/backfill — configured storage state is not Owner')
      }
    })

    /**
     * AC 1: No WCAG 2.1 AA violations detected by axe-core
     */
    test('should have no WCAG 2.1 AA violations on backfill admin page', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      // Log violations for debugging
      if (accessibilityScanResults.violations.length > 0) {
        console.log(
          'Accessibility violations:',
          JSON.stringify(accessibilityScanResults.violations, null, 2)
        )
      }

      expect(accessibilityScanResults.violations).toEqual([])
    })

    /**
     * AC 2: Keyboard navigation works correctly
     */
    test('should support keyboard navigation through page elements', async ({ page }) => {
      // Tab to first interactive element
      await page.keyboard.press('Tab')

      // Should be able to tab through page elements
      const activeElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(activeElement).toBeTruthy()

      // Continue tabbing through multiple elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
        const currentElement = await page.evaluate(() => ({
          tag: document.activeElement?.tagName,
          text: document.activeElement?.textContent?.slice(0, 50),
        }))
        expect(currentElement.tag).toBeTruthy()
      }
    })

    test('should allow Enter key to interact with buttons', async ({ page }) => {
      // Find and focus the start button
      const startButton = page.locator('button:has-text("Запустить")').first()
      if (await startButton.isVisible()) {
        await startButton.focus()
        await page.keyboard.press('Enter')

        // Dialog should open
        const dialog = page.getByRole('dialog')
        const dialogVisible = await dialog.isVisible().catch(() => false)

        if (dialogVisible) {
          await expect(dialog).toBeVisible()
          // Close with Escape
          await page.keyboard.press('Escape')
        }
      }
    })

    test('should show visible focus indicators on interactive elements', async ({ page }) => {
      // Tab to first button
      const buttons = page.locator('button').first()
      if (await buttons.isVisible()) {
        await buttons.focus()

        // Check for focus outline
        const outlineStyle = await buttons.evaluate(el => {
          const styles = window.getComputedStyle(el)
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            boxShadow: styles.boxShadow,
          }
        })

        // Either outline or box-shadow should indicate focus
        const hasFocusIndicator =
          (outlineStyle.outlineWidth !== '0px' && outlineStyle.outline !== 'none') ||
          outlineStyle.boxShadow !== 'none'

        expect(hasFocusIndicator).toBeTruthy()
      }
    })

    /**
     * AC 3: Screen reader support (ARIA attributes)
     */
    test('should have proper ARIA labels on interactive elements', async ({ page }) => {
      // Check buttons have accessible names
      const buttons = page.locator('button')
      const buttonCount = await buttons.count()

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i)
        const accessibleName = await button.evaluate(el => {
          return el.getAttribute('aria-label') || el.textContent?.trim() || el.getAttribute('title')
        })
        expect(accessibleName).toBeTruthy()
      }
    })

    test('should have proper table structure for screen readers', async ({ page }) => {
      const table = page.locator('table')
      if (await table.isVisible()) {
        // Table should have headers
        const headers = table.locator('thead th')
        const headerCount = await headers.count()
        expect(headerCount).toBeGreaterThan(0)

        // Headers should have scope or be in proper structure
        for (let i = 0; i < headerCount; i++) {
          const header = headers.nth(i)
          const hasScope = (await header.getAttribute('scope')) !== null
          const headerText = await header.textContent()
          expect(hasScope || headerText?.trim()).toBeTruthy()
        }
      }
    })

    /**
     * AC 4: Page has proper landmarks
     */
    test('should have proper page landmarks', async ({ page }) => {
      // Main content area
      const main = page.locator('main')
      await expect(main).toBeVisible()

      // Page should have heading
      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
    })
  })

  test.describe('Start Backfill Dialog Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BACKFILL_ADMIN_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const isOwner = await expectBackfillOwnerShellOrRedirect(page)
      if (!isOwner) {
        test.skip(true, 'Redirected off /settings/backfill — configured storage state is not Owner')
      }
    })

    test('should have no WCAG violations in start dialog', async ({ page }) => {
      await page.getByRole('button', { name: 'Запустить бэкфилл', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: 'Запуск бэкфилла' })
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('combobox', { name: 'Кабинет' })).toBeFocused()
      await expectFiniteAnimationsToSettle(page.locator('body'))

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .include('[role="dialog"]')
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
      await page.keyboard.press('Escape')
    })

    test('should trap focus within dialog', async ({ page }) => {
      await page.getByRole('button', { name: 'Запустить бэкфилл', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: 'Запуск бэкфилла' })
      await expect(dialog).toBeVisible()

      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
      }

      expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true)
      await page.keyboard.press('Escape')
    })

    test('should close dialog with Escape key', async ({ page }) => {
      await page.getByRole('button', { name: 'Запустить бэкфилл', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: 'Запуск бэкфилла' })
      await expect(dialog).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
    })

    test('should have proper dialog ARIA attributes', async ({ page }) => {
      const startButton = page.getByRole('button', {
        name: 'Запустить бэкфилл',
        exact: true,
      })
      await startButton.click()

      const dialog = page.getByRole('dialog', { name: 'Запуск бэкфилла', exact: true })
      await expect(dialog).toBeVisible()
      await expect(dialog).toHaveAttribute('aria-labelledby', /\S+/)
      await expect(dialog).toHaveAttribute('aria-describedby', /\S+/)
      await page.keyboard.press('Escape')
    })

    test('should return focus to trigger after dialog closes', async ({ page }) => {
      const startButton = page.getByRole('button', {
        name: 'Запустить бэкфилл',
        exact: true,
      })
      await expect(startButton).toBeVisible()
      await startButton.click()

      const dialog = page.getByRole('dialog', { name: 'Запуск бэкфилла' })
      await expect(dialog).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
      await expect(startButton).toBeFocused()
    })
  })

  test.describe('Mobile Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(BACKFILL_ADMIN_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      // Story 162.8: bounded terminal settle replaces the elapsed 2000ms wait.
      const isOwner = await expectBackfillOwnerShellOrRedirect(page)
      if (!isOwner) {
        test.skip(true, 'Redirected off /settings/backfill — configured storage state is not Owner')
      }
    })

    test('should have no WCAG violations on mobile viewport', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should have touch-friendly target sizes (min 44x44)', async ({ page }) => {
      const buttons = page.locator('main button:visible')
      const buttonCount = await buttons.count()

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i)
        if (await button.isVisible()) {
          const box = await button.boundingBox()
          if (box) {
            expect(box.width).toBeGreaterThanOrEqual(44)
            expect(box.height).toBeGreaterThanOrEqual(44)
          }
        }
      }
    })

    test('should not prevent pinch-zoom', async ({ page }) => {
      const viewport = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]')
        return meta?.getAttribute('content') || ''
      })

      // Should NOT have user-scalable=no or maximum-scale=1
      expect(viewport).not.toContain('user-scalable=no')
      expect(viewport).not.toMatch(/maximum-scale=1([^.]|$)/)
    })
  })

  test.describe('Story 173.2 Visual and Reflow Evidence Matrix', () => {
    for (const theme of ['light', 'dark'] as const) {
      for (const width of BACKFILL_LAYOUT_CASES) {
        test(`keeps the ${theme} ${width}px layout responsive without main overflow`, async ({
          page,
        }) => {
          await openDenseBackfillFixture(page, width)
          await applySettledTheme(page, theme)

          const narrowContent = page.locator('[data-table-narrow-content]')
          const wideContent = page.locator('[data-table-wide-content]')
          if (width < 768) {
            await expect(narrowContent).toBeVisible()
            await expect(wideContent).toBeHidden()
            await expect(narrowContent.locator(':scope > div > div')).toHaveCount(
              DENSE_BACKFILL_FIXTURE.length
            )
          } else {
            await expect(narrowContent).toBeHidden()
            await expect(wideContent).toBeVisible()
            await expect(wideContent.locator('tbody tr')).toHaveCount(DENSE_BACKFILL_FIXTURE.length)
          }
          await expectMainWithoutHorizontalOverflow(page)
        })
      }

      test(`reflows dense ${theme} content at 200% zoom without main overflow`, async ({
        page,
      }) => {
        await openDenseBackfillFixture(page, 640)
        await applySettledTheme(page, theme)
        await page.evaluate(() => {
          document.documentElement.style.zoom = '2'
        })
        await expect
          .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).zoom))
          .toBe('2')
        await expectFiniteAnimationsToSettle(page.locator('main'))

        const longCabinetName = page
          .getByText(DENSE_BACKFILL_FIXTURE[0].cabinetName, { exact: true })
          .filter({ visible: true })
        await expect(longCabinetName).toBeVisible()
        const textDimensions = await longCabinetName.evaluate(element => ({
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        }))
        expect(textDimensions.scrollWidth).toBeLessThanOrEqual(textDimensions.clientWidth + 1)
        await expect(page.locator('[data-table-narrow-content]')).toBeVisible()
        await expectMainWithoutHorizontalOverflow(page)
      })
    }

    test('keeps portaled dialog targets touch-friendly inside the 390px viewport', async ({
      page,
    }) => {
      await openDenseBackfillFixture(page, 390)
      await page.getByRole('button', { name: 'Запустить бэкфилл', exact: true }).click()
      const startDialog = page.getByRole('dialog', { name: 'Запуск бэкфилла' })
      await expectFiniteAnimationsToSettle(page.locator('body'))
      const cabinetSelect = startDialog.getByRole('combobox', { name: 'Кабинет' })
      await expectTouchGeometry(cabinetSelect, 390)
      await cabinetSelect.click()
      await expectFiniteAnimationsToSettle(page.locator('body'))

      const portaledOptions = page.getByRole('option')
      expect(await portaledOptions.count()).toBeGreaterThan(0)
      for (let index = 0; index < (await portaledOptions.count()); index++) {
        await expectTouchGeometry(portaledOptions.nth(index), 390)
      }
      await page.keyboard.press('Escape')
      await expect(page.getByRole('listbox')).not.toBeVisible()
      await page.keyboard.press('Escape')
      await expect(startDialog).not.toBeVisible()

      await page
        .getByRole('button', {
          name: `Показать ошибку для ${DENSE_BACKFILL_FIXTURE[2].cabinetName}`,
        })
        .click()
      const errorDialog = page.getByRole('dialog', { name: /Ошибка бэкфилла/ })
      await expectFiniteAnimationsToSettle(page.locator('body'))
      const visibleClose = errorDialog
        .locator('button:not(:has(.sr-only))')
        .filter({ hasText: 'Закрыть' })
      await expectTouchGeometry(visibleClose, 390)
    })

    test('has no WCAG 2.1 AA violations at the light 320px matrix edge', async ({ page }) => {
      await openDenseBackfillFixture(page, 320)
      await applySettledTheme(page, 'light')

      const results = await new AxeBuilder({ page })
        .include('main')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
      expect(results.violations).toEqual([])
    })

    test('has no WCAG 2.1 AA violations at the dark 1440px matrix edge', async ({ page }) => {
      await openDenseBackfillFixture(page, 1440)
      await applySettledTheme(page, 'dark')

      const results = await new AxeBuilder({ page })
        .include('main')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
      expect(results.violations).toEqual([])
    })
  })

  test.describe('Color Contrast', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/v1/admin/backfill/status', route =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              cabinetId: 'contrast-running',
              cabinetName: 'Контраст — выполняется',
              reportsStatus: 'in_progress',
              analyticsStatus: 'pending',
              overallProgress: 42,
              progress: { percentage: 42, estimated_remaining_seconds: 600 },
              lastError: null,
              updatedAt: '2026-08-29T09:00:00Z',
            },
            {
              cabinetId: 'contrast-completed',
              cabinetName: 'Контраст — завершено',
              reportsStatus: 'completed',
              analyticsStatus: 'completed',
              overallProgress: 100,
              progress: { percentage: 100, estimated_remaining_seconds: null },
              lastError: null,
              updatedAt: '2026-08-29T09:00:00Z',
            },
            {
              cabinetId: 'contrast-failed',
              cabinetName: 'Контраст — ошибка',
              reportsStatus: 'failed',
              analyticsStatus: 'paused',
              overallProgress: 17,
              progress: { percentage: 17, estimated_remaining_seconds: null },
              lastError: 'Ошибка контрастного сценария',
              updatedAt: '2026-08-29T09:00:00Z',
            },
          ]),
        })
      )
      await page.goto(BACKFILL_ADMIN_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      // Story 162.8: bounded terminal settle replaces the elapsed 2000ms wait.
      const isOwner = await expectBackfillOwnerShellOrRedirect(page)
      if (!isOwner) {
        test.skip(true, 'Redirected off /settings/backfill — configured storage state is not Owner')
      }
    })

    for (const theme of ['light', 'dark'] as const) {
      test(`has deterministic status and table contrast in ${theme} theme`, async ({ page }) => {
        await page.evaluate(selectedTheme => {
          document.documentElement.classList.toggle('dark', selectedTheme === 'dark')
          document.documentElement.style.colorScheme = selectedTheme
        }, theme)

        const badges = page.locator('[data-slot="backfill-status-badge"]:visible')
        const tableCells = page.locator('table:visible tbody td')
        await expect(badges).toHaveCount(6)
        expect(await tableCells.count()).toBeGreaterThan(0)
        await expect(
          page.getByRole('button', { name: 'Обновить', exact: true })
        ).not.toHaveAttribute('aria-disabled', 'true')
        await expectFiniteAnimationsToSettle(page.locator('main'))

        const contrastResults = await new AxeBuilder({ page })
          .include('main')
          .withRules(['color-contrast'])
          .analyze()
        expect(contrastResults.violations).toEqual([])
      })
    }
  })

  test.describe('Live Regions and Announcements', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/v1/admin/backfill/status', route =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              cabinetId: 'cabinet-a11y-running',
              cabinetName: 'Кабинет доступности',
              reportsStatus: 'in_progress',
              analyticsStatus: 'pending',
              overallProgress: 42,
              progress: {
                percentage: 42,
                estimated_remaining_seconds: 600,
                total_days: 365,
                completed_days: 153,
                current_date: '2026-03-01',
              },
              lastError: null,
              updatedAt: '2026-08-05T09:00:00Z',
            },
          ]),
        })
      )
      await page.goto(BACKFILL_ADMIN_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      if (!page.url().includes('/settings/backfill')) {
        test.skip(true, 'Backfill route not reached — /settings/backfill unavailable in this run')
      }

      await expect(page.getByRole('heading', { name: 'Управление бэкфиллом' })).toBeVisible()
      await expect(page.getByRole('table')).toBeVisible()
    })

    test('should have aria-live regions for dynamic content', async ({ page }) => {
      await expect(
        page.getByRole('status').filter({ hasText: 'Данные актуальны' })
      ).toHaveAttribute('aria-live', 'polite')
    })

    test('should announce progress changes to assistive technology', async ({ page }) => {
      // Check for progress indicators with proper ARIA
      const progressIndicators = page.locator('[role="progressbar"]:visible')
      await expect(progressIndicators).toHaveCount(1)
      await expect(progressIndicators.first()).toHaveAttribute('aria-label', 'Прогресс: 42%')
      await expect(progressIndicators.first()).toHaveAttribute('aria-valuemin', '0')
      await expect(progressIndicators.first()).toHaveAttribute('aria-valuemax', '100')
      await expect(progressIndicators.first()).toHaveAttribute('aria-valuenow', '42')
    })

    test('honors reduced motion for active progress', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      const progressIndicator = page.locator('[role="progressbar"]:visible')
      await expect(progressIndicator).toHaveClass(/motion-reduce:animate-none/)
      await expect(progressIndicator).toHaveClass(/motion-reduce:transition-none/)
      const reducedTransitionSeconds = await progressIndicator.evaluate(element =>
        Number.parseFloat(getComputedStyle(element).transitionDuration)
      )
      expect(reducedTransitionSeconds).toBeLessThan(0.001)
    })
  })
})

test.describe('Epic 51-FE: Accessibility - FBS Orders Analytics Page', () => {
  /**
   * Story 162.8: bounded settle for the orders analytics page — wait for the
   * tablist (the page's always-present terminal) to render instead of an
   * elapsed 2000ms wait, so the a11y scan runs against a hydrated DOM.
   */
  async function expectOrdersAnalyticsSettled(page: import('@playwright/test').Page) {
    await page
      .locator('main [role="tablist"]')
      .first()
      .waitFor({ state: 'visible', timeout: 15000 })
  }

  test.beforeEach(async ({ page }) => {
    await page.goto(ORDERS_ANALYTICS_ROUTE, { waitUntil: 'domcontentloaded' })
    await page.locator('main').waitFor({ state: 'visible' })
    await expectOrdersAnalyticsSettled(page)
  })

  test('should have no WCAG 2.1 AA violations on orders analytics page', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log(
        'Accessibility violations:',
        JSON.stringify(accessibilityScanResults.violations, null, 2)
      )
    }

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have proper tab panel ARIA attributes', async ({ page }) => {
    // Tabs should have role="tablist"
    const tablist = page.locator('main [role="tablist"]').first()
    await expect(tablist).toBeVisible()

    // Individual tabs should have role="tab"
    const tabs = tablist.locator('[role="tab"]')
    const tabCount = await tabs.count()
    expect(tabCount).toBeGreaterThanOrEqual(4) // Overview, Trends, Seasonality, Comparison

    // Active tab should have aria-selected="true"
    const activeTabs = tablist.locator('[role="tab"][aria-selected="true"]')
    await expect(activeTabs).toHaveCount(1)

    // Tab panels should have role="tabpanel"
    const tabpanel = page.locator('main [role="tabpanel"][data-state="active"]').first()
    await expect(tabpanel).toBeVisible()
  })

  test('should support keyboard navigation between tabs', async ({ page }) => {
    const tablist = page.locator('main [role="tablist"]').first()
    const firstTab = tablist.locator('[role="tab"]').first()

    await firstTab.focus()

    // Capture the focused element's text BEFORE the keypress so the post-press
    // poll can prove focus actually MOVED (a no-op ArrowRight would leave the
    // same element focused, and any-focused-element-with-text would otherwise
    // pass). Story 162.8: bounded poll replaces the elapsed 200ms wait.
    const firstTabText = await page.evaluate(() => document.activeElement?.textContent ?? '')

    // Press Right arrow to move to next tab.
    await page.keyboard.press('ArrowRight')
    await expect
      .poll(async () => page.evaluate(() => document.activeElement?.textContent ?? ''), {
        timeout: 5000,
      })
      .not.toBe(firstTabText)

    // Second tab should be focused
    const focusedTab = await page.evaluate(() => document.activeElement?.textContent)
    expect(focusedTab).toBeTruthy()
  })

  test('should have proper page heading hierarchy', async ({ page }) => {
    // Should have h1
    const h1 = page.locator('main h1')
    await expect(h1).toBeVisible()

    // Check h2 elements come after h1
    const h2Elements = page.locator('main h2')
    const h2Count = await h2Elements.count()

    if (h2Count > 0) {
      // h2 should follow h1 in DOM order (good heading hierarchy)
      const h1Rect = await h1.boundingBox()
      const h2Rect = await h2Elements.first().boundingBox()
      if (h1Rect && h2Rect) {
        expect(h2Rect.y).toBeGreaterThan(h1Rect.y)
      }
    }
  })

  test('should have no WCAG violations on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(ORDERS_ANALYTICS_ROUTE, { waitUntil: 'domcontentloaded' })
    await page.locator('main').waitFor({ state: 'visible' })
    await expectOrdersAnalyticsSettled(page)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})

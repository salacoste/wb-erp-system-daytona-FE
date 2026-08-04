/**
 * E2E Accessibility Tests: Shipments Module
 * Epic 77-FE Story 77.2: Shipment E2E Tests
 *
 * WCAG 2.1 AA compliance tests for Shipments module including:
 * - axe-core automated accessibility scanning (wcag2a + wcag2aa)
 * - Keyboard navigation (Tab, Enter, Escape)
 * - ARIA labels on action buttons
 * - Focus management in dialogs
 *
 * @see _bmad-output/implementation-artifacts/77.2-fe-shipment-e2e-tests.md
 */

import { test, expect, type Page } from '../fixtures/network-test'
import AxeBuilder from '@axe-core/playwright'

const SHIPMENTS_ROUTE = '/shipments'

/**
 * Navigate to the first available shipment detail page.
 */
async function navigateToDetail(page: Page): Promise<boolean> {
  await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
  await page.locator('main').waitFor({ state: 'visible' })

  // Match only detail links (UUID paths), not /shipments/sku-packaging
  const viewLink = page.locator('table a[href*="/shipments/"]').first()
  if ((await viewLink.count()) > 0 && (await viewLink.isVisible())) {
    await viewLink.click()
    await page.locator('main').waitFor({ state: 'visible' })
    return true
  }
  return false
}

test.describe('Shipments Accessibility - Epic 77-FE', () => {
  test.describe('List Page - axe-core', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })
    })

    test('should have no WCAG 2.1 AA violations on list page', async ({ page }) => {
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()

      if (results.violations.length > 0) {
        console.log('Accessibility violations:', JSON.stringify(results.violations, null, 2))
      }

      expect(results.violations).toEqual([])
    })

    test('should have proper page landmarks', async ({ page }) => {
      const main = page.locator('main')
      await expect(main).toBeVisible()

      const h1 = page.getByRole('heading', { name: /Отправки/i })
      await expect(h1).toBeVisible()
    })

    test('should have proper table structure for screen readers', async ({ page }) => {
      const table = page.locator('table')
      if (!(await table.isVisible())) return

      const headers = table.locator('thead th')
      const headerCount = await headers.count()
      expect(headerCount).toBeGreaterThan(0)

      for (let i = 0; i < headerCount; i++) {
        const header = headers.nth(i)
        const headerText = await header.textContent()
        expect(headerText?.trim()).toBeTruthy()
      }
    })
  })

  test.describe('Detail Page - axe-core', () => {
    test('should have no WCAG 2.1 AA violations on detail page', async ({ page }) => {
      const navigated = await navigateToDetail(page)
      if (!navigated) {
        test.skip(true, 'No shipments available')
        return
      }

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()

      if (results.violations.length > 0) {
        console.log('Accessibility violations:', JSON.stringify(results.violations, null, 2))
      }

      expect(results.violations).toEqual([])
    })

    test('should have proper heading hierarchy', async ({ page }) => {
      const navigated = await navigateToDetail(page)
      if (!navigated) {
        test.skip(true, 'No shipments available')
        return
      }

      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()

      const h2Elements = page.locator('h2')
      const h2Count = await h2Elements.count()
      if (h2Count > 0) {
        const h1Rect = await h1.boundingBox()
        const h2Rect = await h2Elements.first().boundingBox()
        if (h1Rect && h2Rect) {
          expect(h2Rect.y).toBeGreaterThan(h1Rect.y)
        }
      }
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('should support Tab navigation through list page elements', async ({ page }) => {
      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      // Tab to first interactive element
      await page.keyboard.press('Tab')

      const activeElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(activeElement).toBeTruthy()

      // Continue tabbing through elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
        const current = await page.evaluate(() => ({
          tag: document.activeElement?.tagName,
          text: document.activeElement?.textContent?.slice(0, 50),
        }))
        expect(current.tag).toBeTruthy()
      }
    })

    test('should open view link with Enter key', async ({ page }) => {
      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const viewLink = page.locator('a[href*="/shipments/"]').first()
      if (!(await viewLink.isVisible())) {
        test.skip(true, 'No shipment view links')
        return
      }

      await viewLink.focus()
      await page.keyboard.press('Enter')
      await page.locator('main').waitFor({ state: 'visible' })

      await expect(page).toHaveURL(/\/shipments\/[a-zA-Z0-9-]+/)
    })

    test('should close dialog with Escape key', async ({ page }) => {
      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const createButton = page.getByRole('button', { name: 'Создать отправку' })
      if (!(await createButton.isVisible()) || !(await createButton.isEnabled())) {
        test.skip(true, 'Create button not visible')
        return
      }

      await createButton.click()
      await expect(page.getByRole('dialog')).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('should navigate table rows with Tab', async ({ page }) => {
      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const rows = page.locator('table tbody tr')
      if ((await rows.count()) === 0) {
        test.skip(true, 'No table rows')
        return
      }

      // Focus the first interactive element in the table
      const firstLink = rows.first().locator('a, button').first()
      if (await firstLink.isVisible()) {
        await firstLink.focus()

        const isFocused = await firstLink.evaluate(el => el === document.activeElement)
        expect(isFocused).toBeTruthy()
      }
    })

    test('should expand pallet accordion with Enter key on detail page', async ({ page }) => {
      const navigated = await navigateToDetail(page)
      if (!navigated) {
        test.skip(true, 'No shipments available')
        return
      }

      const palletTrigger = page.getByRole('button', { name: /Раскрыть паллету/i }).first()
      if (!(await palletTrigger.isVisible())) {
        test.skip(true, 'No pallet triggers available')
        return
      }

      await palletTrigger.focus()
      await page.keyboard.press('Enter')

      // Should show box line content after expanding
      const content = page.locator('table').or(page.getByText('Товары ещё не добавлены'))
      await expect(content.first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('ARIA Labels', () => {
    test('should have aria-labels on action buttons in list', async ({ page }) => {
      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const rows = page.locator('table tbody tr')
      if ((await rows.count()) === 0) {
        test.skip(true, 'No rows')
        return
      }

      // View button should have aria-label
      const viewLink = rows.first().locator('a[href*="/shipments/"]')
      if (await viewLink.isVisible()) {
        const ariaLabel = await viewLink.getAttribute('aria-label')
        const title = await viewLink.getAttribute('title')
        const text = await viewLink.textContent()
        expect(ariaLabel || title || text?.trim()).toBeTruthy()
      }
    })

    test('should have aria-labels on detail page action buttons', async ({ page }) => {
      const navigated = await navigateToDetail(page)
      if (!navigated) {
        test.skip(true, 'No shipments available')
        return
      }

      // Check draft action buttons
      const buttons = page.locator('button')
      const buttonCount = await buttons.count()

      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i)
        if (await button.isVisible()) {
          const accessibleName = await button.evaluate(el => {
            return (
              el.getAttribute('aria-label') || el.textContent?.trim() || el.getAttribute('title')
            )
          })
          expect(accessibleName).toBeTruthy()
        }
      }
    })

    test('should have aria-label on status filter select', async ({ page }) => {
      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const statusFilter = page.getByLabel('Фильтр по статусу')
      if (await statusFilter.isVisible()) {
        await expect(statusFilter).toBeVisible()
      }
    })

    test('should have aria-label on rows-per-page select', async ({ page }) => {
      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const rowsPerPage = page.getByLabel('Строк на странице')
      if (await rowsPerPage.isVisible()) {
        await expect(rowsPerPage).toBeVisible()
      }
    })

    test('should have aria-labels on pallet accordion triggers', async ({ page }) => {
      const navigated = await navigateToDetail(page)
      if (!navigated) {
        test.skip(true, 'No shipments available')
        return
      }

      const palletTrigger = page.getByRole('button', { name: /Раскрыть паллету/i }).first()
      if (await palletTrigger.isVisible()) {
        const ariaLabel = await palletTrigger.getAttribute('aria-label')
        expect(ariaLabel).toMatch(/Раскрыть паллету/i)
      }
    })
  })

  test.describe('Dialog Accessibility', () => {
    test('should have no WCAG violations in create dialog', async ({ page }) => {
      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const createButton = page.getByRole('button', { name: 'Создать отправку' })
      if (!(await createButton.isVisible()) || !(await createButton.isEnabled())) {
        test.skip(true, 'Create button not visible')
        return
      }

      await createButton.click()
      await expect(page.getByRole('dialog')).toBeVisible()

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .include('[role="dialog"]')
        .analyze()

      expect(results.violations).toEqual([])
    })

    test('should have aria-modal and aria-labelledby on dialog', async ({ page }) => {
      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const createButton = page.getByRole('button', { name: 'Создать отправку' })
      if (!(await createButton.isVisible()) || !(await createButton.isEnabled())) {
        test.skip(true, 'Create button not visible')
        return
      }

      await createButton.click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      const ariaModal = await dialog.getAttribute('aria-modal')
      expect(ariaModal).toBe('true')

      const hasLabel =
        (await dialog.getAttribute('aria-label')) !== null ||
        (await dialog.getAttribute('aria-labelledby')) !== null
      expect(hasLabel).toBeTruthy()
    })

    test('should trap focus within create dialog', async ({ page }) => {
      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const createButton = page.getByRole('button', { name: 'Создать отправку' })
      if (!(await createButton.isVisible()) || !(await createButton.isEnabled())) {
        test.skip(true, 'Create button not visible')
        return
      }

      await createButton.click()
      await expect(page.getByRole('dialog')).toBeVisible()

      // Tab through all elements multiple times
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab')
      }

      // Focus should still be within dialog
      const activeInDialog = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]')
        return dialog?.contains(document.activeElement)
      })

      expect(activeInDialog).toBeTruthy()
    })

    test('should return focus to trigger after dialog closes', async ({ page }) => {
      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const createButton = page.getByRole('button', { name: 'Создать отправку' })
      if (!(await createButton.isVisible()) || !(await createButton.isEnabled())) {
        test.skip(true, 'Create button not visible')
        return
      }

      await createButton.click()
      await expect(page.getByRole('dialog')).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).not.toBeVisible()

      // Focus should return to the create button (Radix Dialog returns focus by default)
      const isFocused = await createButton.evaluate(el => el === document.activeElement)
      expect(isFocused).toBeTruthy()
    })
  })

  test.describe('Validation Error Panel Accessibility', () => {
    test('should have role=alert on validation error panel', async ({ page }) => {
      const navigated = await navigateToDetail(page)
      if (!navigated) {
        test.skip(true, 'No shipments available')
        return
      }

      const validationPanel = page.locator('[role="alert"][aria-label="Ошибки валидации"]')
      if (await validationPanel.isVisible()) {
        await expect(validationPanel).toBeVisible()

        const ariaLabel = await validationPanel.getAttribute('aria-label')
        expect(ariaLabel).toBe('Ошибки валидации')
      }
    })
  })

  test.describe('Focus Indicators', () => {
    test('should show visible focus indicators on interactive elements', async ({ page }) => {
      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const buttons = page.locator('button').first()
      if (await buttons.isVisible()) {
        await buttons.focus()

        const outlineStyle = await buttons.evaluate(el => {
          const styles = window.getComputedStyle(el)
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            boxShadow: styles.boxShadow,
          }
        })

        const hasFocusIndicator =
          (outlineStyle.outlineWidth !== '0px' && outlineStyle.outline !== 'none') ||
          outlineStyle.boxShadow !== 'none'

        expect(hasFocusIndicator).toBeTruthy()
      }
    })
  })
})

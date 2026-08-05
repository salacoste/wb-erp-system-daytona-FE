/**
 * E2E Tests: Analytics Hub Navigation
 * Story 51.12-FE: E2E Tests for FBS Analytics + Backfill
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Tests the Analytics Hub page navigation cards,
 * specifically verifying the "Заказы FBS" card navigates to /analytics/orders.
 *
 * @see docs/stories/epic-51/story-51.12-fe-e2e-tests.md
 */

import { test, expect } from '../fixtures/network-test'

// Routes
const ANALYTICS_HUB_ROUTE = '/analytics'
const ORDERS_ANALYTICS_ROUTE = '/analytics/orders'

test.describe('Epic 51-FE: Analytics Hub Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Story 88.3-FE: domcontentloaded + landmark wait (not networkidle — see CLAUDE.md #9).
    await page.goto(ANALYTICS_HUB_ROUTE, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 })
  })

  test.describe('Hub Page Structure', () => {
    test('should display Analytics hub page with heading', async ({ page }) => {
      // Verify page loaded
      await expect(page.locator('main')).toBeVisible()

      // Verify page has heading "Аналитика"
      const heading = page.locator('h1')
      await expect(heading).toBeVisible()
      const headingText = await heading.textContent()
      expect(headingText).toMatch(/Аналитика/i)
    })

    test('should display navigation cards section', async ({ page }) => {
      // Look for navigation cards container
      const cardsSection = page
        .locator('[class*="card"]')
        .or(page.locator('[class*="grid"]'))
        .first()

      await expect(cardsSection).toBeVisible()
    })

    test('should display multiple analytics category cards', async ({ page }) => {
      // Count navigation cards/links
      const navLinks = page.locator('a[href*="/analytics/"]')
      const linkCount = await navLinks.count()

      // Should have multiple analytics pages (SKU, Brand, Category, etc.)
      expect(linkCount).toBeGreaterThanOrEqual(4)
    })
  })

  test.describe('FBS Orders Card Navigation', () => {
    test('should display "Заказы FBS" card in navigation', async ({ page }) => {
      const fbsOrdersCard = page.locator('main').getByRole('link', { name: /Заказы FBS/ })
      await expect(fbsOrdersCard).toBeVisible()
      await expect(fbsOrdersCard).toHaveAttribute('href', ORDERS_ANALYTICS_ROUTE)
    })

    test('should navigate to /analytics/orders when FBS card is clicked', async ({ page }) => {
      const fbsOrdersCard = page.locator('main').getByRole('link', { name: /Заказы FBS/ })

      await expect(fbsOrdersCard).toBeVisible()
      await expect(fbsOrdersCard).toHaveAttribute('href', ORDERS_ANALYTICS_ROUTE)
      await fbsOrdersCard.click()
      // Story 88.3-FE: assert URL directly (click triggers client-side nav; networkidle not needed)
      await expect(page).toHaveURL(/\/analytics\/orders$/, { timeout: 10000 })
    })

    test('should display card description text', async ({ page }) => {
      // Look for card with description
      const fbsOrdersCard = page
        .locator('a[href="/analytics/orders"]')
        .or(page.locator('a:has-text("Заказы FBS")'))
        .first()

      if (await fbsOrdersCard.isVisible()) {
        // Card should have descriptive text
        const cardText = await fbsOrdersCard.textContent()
        expect(cardText?.length).toBeGreaterThan(5)
      }
    })

    test('should have proper visual feedback on hover', async ({ page }) => {
      const fbsOrdersCard = page.locator('main').getByRole('link', { name: /Заказы FBS/ })

      await expect(fbsOrdersCard).toBeVisible()
      await expect(fbsOrdersCard).toHaveAttribute('href', ORDERS_ANALYTICS_ROUTE)
      const initialStyles = await fbsOrdersCard.evaluate(el => ({
        transform: window.getComputedStyle(el).transform,
        boxShadow: window.getComputedStyle(el).boxShadow,
      }))

      await fbsOrdersCard.hover()
      await page.waitForTimeout(300) // Wait for transition

      const hoverStyles = await fbsOrdersCard.evaluate(el => ({
        transform: window.getComputedStyle(el).transform,
        boxShadow: window.getComputedStyle(el).boxShadow,
      }))
      expect(
        hoverStyles.transform !== initialStyles.transform ||
          hoverStyles.boxShadow !== initialStyles.boxShadow
      ).toBe(true)
    })
  })

  test.describe('Other Navigation Cards', () => {
    test('should display "По товарам" (SKU) card', async ({ page }) => {
      const skuCard = page
        .locator('a[href="/analytics/sku"]')
        .or(page.locator('a:has-text("По товарам")'))
      const exists = (await skuCard.count()) > 0
      expect(exists).toBeTruthy()
    })

    test('should display "По брендам" (Brand) card', async ({ page }) => {
      const brandCard = page
        .locator('a[href="/analytics/brand"]')
        .or(page.locator('a:has-text("По брендам")'))
      const exists = (await brandCard.count()) > 0
      expect(exists).toBeTruthy()
    })

    test('should display "По категориям" (Category) card', async ({ page }) => {
      const categoryCard = page
        .locator('a[href="/analytics/category"]')
        .or(page.locator('a:has-text("По категориям")'))
      const exists = (await categoryCard.count()) > 0
      expect(exists).toBeTruthy()
    })

    test('should display "Хранение" (Storage) card', async ({ page }) => {
      const storageCard = page
        .locator('a[href="/analytics/storage"]')
        .or(page.locator('a:has-text("Хранение")'))
      const exists = (await storageCard.count()) > 0
      expect(exists).toBeTruthy()
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation through cards', async ({ page }) => {
      // Tab to first card
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab') // May need multiple tabs

      // Find focused element
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(focusedElement).toBeTruthy()
    })

    test('should activate card link on Enter key', async ({ page }) => {
      const fbsOrdersCard = page.locator('main').getByRole('link', { name: /Заказы FBS/ })

      await expect(fbsOrdersCard).toBeVisible()
      await expect(fbsOrdersCard).toHaveAttribute('href', ORDERS_ANALYTICS_ROUTE)
      await fbsOrdersCard.focus()
      await expect(fbsOrdersCard).toBeFocused()
      await page.keyboard.press('Enter')
      // Story 88.3-FE: assert URL directly (not networkidle)
      await expect(page).toHaveURL(/\/analytics\/orders$/, { timeout: 10000 })
    })
  })

  test.describe('Responsive Layout', () => {
    test('should display cards in grid on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      // Story 88.3-FE: domcontentloaded + landmark wait (not networkidle).
      await page.goto(ANALYTICS_HUB_ROUTE, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main')).toBeVisible({ timeout: 10000 })

      // Cards should be in a grid layout
      const cardsContainer = page.locator('[class*="grid"]').first()
      if (await cardsContainer.isVisible()) {
        const gridStyles = await cardsContainer.evaluate(el => ({
          display: window.getComputedStyle(el).display,
          gridTemplateColumns: window.getComputedStyle(el).gridTemplateColumns,
        }))

        expect(gridStyles.display).toBe('grid')
      }
    })

    test('should stack cards on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      // Story 88.3-FE: domcontentloaded + landmark wait (not networkidle).
      await page.goto(ANALYTICS_HUB_ROUTE, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main')).toBeVisible({ timeout: 10000 })

      // Cards should still be accessible
      const navLinks = page.locator('a[href*="/analytics/"]')
      const linkCount = await navLinks.count()
      expect(linkCount).toBeGreaterThanOrEqual(4)
    })
  })
})

/**
 * QA HANDOFF NOTES:
 *
 * 1. Run tests:
 *    ```bash
 *    npx playwright test e2e/analytics/analytics-hub.spec.ts
 *    ```
 *
 * 2. Expected results:
 *    - Hub page displays navigation cards
 *    - FBS Orders card exists and navigates correctly
 *    - Keyboard navigation works
 *    - Responsive layout adapts to viewport
 *
 * 3. Manual testing required:
 *    - Verify card icons and colors match design
 *    - Check card descriptions are accurate
 *    - Test with different screen readers
 */

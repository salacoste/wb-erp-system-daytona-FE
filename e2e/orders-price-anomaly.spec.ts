/**
 * E2E Tests: Orders Page — Price Anomaly Indicator
 * Story 87.3-FE: Defensive warning icon when salePrice > price * 1.2
 *
 * Uses Playwright route interception to mock an anomalous order in the
 * backend response, verifies the AlertTriangle indicator renders with
 * the expected aria-label and tooltip.
 *
 * Why E2E: Unit tests cover the render logic in isolation. This spec
 * validates the full stack (route → hook → component) produces a visible
 * warning icon when real-world bad data arrives.
 */

import { test, expect } from '@playwright/test'

const ORDERS_ROUTE = '/orders'
const ORDERS_API_PATTERN = /\/v1\/orders(\?|$)/

/**
 * Mock orders response with one normal + one anomalous row.
 * Anomaly: order 9999999999 has price=56, salePrice=1510 (27x inversion).
 */
const MOCK_ORDERS_RESPONSE = {
  items: [
    {
      orderId: '8888888888',
      orderUid: 'mock-normal',
      nmId: 100000001,
      vendorCode: 'NORMAL-1',
      productName: 'Normal Product',
      price: 1500,
      salePrice: 1200,
      supplierStatus: 'new',
      wbStatus: 'waiting',
      warehouseId: 507,
      deliveryType: 'fbs',
      isB2B: false,
      cargoType: 'MGT',
      createdAt: '2026-04-14T10:00:00.000Z',
      statusUpdatedAt: '2026-04-14T10:05:00.000Z',
    },
    {
      orderId: '9999999999',
      orderUid: 'mock-anomaly',
      nmId: 100000002,
      vendorCode: 'ANOMALY-1',
      productName: 'Anomalous Product',
      price: 56,
      salePrice: 1510,
      supplierStatus: 'new',
      wbStatus: 'waiting',
      warehouseId: 507,
      deliveryType: 'fbs',
      isB2B: false,
      cargoType: 'MGT',
      createdAt: '2026-04-14T11:00:00.000Z',
      statusUpdatedAt: '2026-04-14T11:05:00.000Z',
    },
  ],
  pagination: { total: 2, page: 1, limit: 20, total_pages: 1 },
}

test.describe('Orders Price Anomaly Indicator (Story 87.3-FE)', () => {
  test('renders AlertTriangle warning for order with inverted prices', async ({ page }) => {
    // Intercept BEFORE navigation so the mock catches the first request
    await page.route(ORDERS_API_PATTERN, async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ORDERS_RESPONSE),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto(ORDERS_ROUTE)

    // Wait for orders table to render
    const table = page.getByRole('table').first()
    await expect(table).toBeVisible({ timeout: 10000 })

    // The anomalous order should render with the warning icon
    // aria-label starts with "Аномалия" per the component implementation
    const warningButton = page.getByRole('button', { name: /Аномалия/i })
    await expect(warningButton).toBeVisible()

    // Label should include the computed ratio (27.0 for 1510/56)
    const label = await warningButton.getAttribute('aria-label')
    expect(label).toMatch(/в 27\.0 раз/)

    // Normal order should NOT have the indicator
    const allWarnings = page.getByRole('button', { name: /Аномалия/i })
    await expect(allWarnings).toHaveCount(1)
  })

  test('tooltip appears on hover over anomaly indicator', async ({ page }) => {
    await page.route(ORDERS_API_PATTERN, async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ORDERS_RESPONSE),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto(ORDERS_ROUTE)

    const warningButton = page.getByRole('button', { name: /Аномалия/i })
    await expect(warningButton).toBeVisible({ timeout: 10000 })

    // Hover to show tooltip (shadcn tooltip uses radix-ui under the hood)
    await warningButton.hover()

    // Tooltip content appears in a portal with role="tooltip"
    const tooltip = page.getByRole('tooltip', { name: /Возможна ошибка данных на стороне WB/i })
    await expect(tooltip).toBeVisible({ timeout: 3000 })
  })

  test('clicking anomaly indicator does NOT open the order detail modal (stopPropagation)', async ({
    page,
  }) => {
    await page.route(ORDERS_API_PATTERN, async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ORDERS_RESPONSE),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto(ORDERS_ROUTE)

    const warningButton = page.getByRole('button', { name: /Аномалия/i })
    await expect(warningButton).toBeVisible({ timeout: 10000 })
    await warningButton.click()

    // Order detail modal must NOT appear
    const modal = page.locator('[data-testid="order-detail-modal"]')
    await expect(modal).not.toBeVisible({ timeout: 1000 })
  })
})

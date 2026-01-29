# Story 51.12-FE: E2E Tests for FBS Analytics

## Story Info

- **Epic**: 51-FE - FBS Historical Analytics UI (365 Days)
- **Sprint**: 6
- **Priority**: P2 (Quality Assurance)
- **Points**: 3 SP
- **Status**: Ready for Dev
- **Dependencies**: Stories 51.8, 51.9, 51.11 (all UI components)

---

## User Story

**As a** QA engineer ensuring product quality,
**I want** comprehensive E2E tests for FBS analytics features,
**So that** we can confidently deploy and maintain the feature.

---

## Background

This story implements Playwright end-to-end tests covering:
- FBS Analytics page navigation and interactions
- Analytics Hub card integration
- Backfill admin page (owner role)
- Cross-browser compatibility
- Accessibility compliance

**Test Framework**: Playwright
**Location**: `e2e/` directory

---

## Acceptance Criteria

### AC1: Analytics Page Tests

- [ ] Page loads successfully
- [ ] Tab navigation works (Trends, Seasonal, Comparison)
- [ ] Date range picker updates charts
- [ ] URL reflects active tab
- [ ] Loading states appear correctly
- [ ] Error states handled gracefully

### AC2: Hub Integration Tests

- [ ] FBS Orders card visible in Analytics Hub
- [ ] Card click navigates to /analytics/orders
- [ ] Card displays correct content

### AC3: Backfill Admin Tests

- [ ] Page accessible to owner role
- [ ] Page blocked for non-owner roles
- [ ] Cabinet status cards render
- [ ] Start backfill flow works
- [ ] Pause/resume buttons work
- [ ] Progress updates display

### AC4: Accessibility Tests

- [ ] Keyboard navigation works throughout
- [ ] ARIA labels present and correct
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Focus indicators visible
- [ ] Screen reader compatible

### AC5: Cross-Browser Tests

- [ ] Tests pass on Chromium
- [ ] Tests pass on Firefox
- [ ] Tests pass on WebKit (Safari)

### AC6: Responsive Tests

- [ ] Mobile viewport layout correct
- [ ] Tablet viewport layout correct
- [ ] Desktop viewport layout correct

---

## Technical Details

### Test Files to Create

```
e2e/
  fbs-analytics/
    analytics-page.spec.ts       # Main analytics page tests
    hub-integration.spec.ts      # Analytics Hub tests
    backfill-admin.spec.ts       # Backfill admin tests
    accessibility.spec.ts        # A11y tests
  fixtures/
    fbs-analytics.ts             # Test data fixtures
  utils/
    fbs-test-helpers.ts          # Helper functions
```

### Analytics Page Tests

```typescript
// e2e/fbs-analytics/analytics-page.spec.ts

import { test, expect } from '@playwright/test'
import { loginAsUser, navigateToAnalytics } from '../utils/auth-helpers'

test.describe('FBS Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, 'test@test.com', 'Russia23!')
    await page.goto('/analytics/orders')
  })

  test('displays page with correct title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Аналитика заказов FBS' }))
      .toBeVisible()
  })

  test('shows three tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Тренды' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Сезонность' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Сравнение' })).toBeVisible()
  })

  test('trends tab is active by default', async ({ page }) => {
    const trendsTab = page.getByRole('tab', { name: 'Тренды' })
    await expect(trendsTab).toHaveAttribute('aria-selected', 'true')
  })

  test('clicking tab changes active content', async ({ page }) => {
    await page.getByRole('tab', { name: 'Сезонность' }).click()

    await expect(page.getByRole('tab', { name: 'Сезонность' }))
      .toHaveAttribute('aria-selected', 'true')
    await expect(page).toHaveURL(/tab=seasonal/)
  })

  test('URL reflects active tab', async ({ page }) => {
    await page.goto('/analytics/orders?tab=comparison')

    await expect(page.getByRole('tab', { name: 'Сравнение' }))
      .toHaveAttribute('aria-selected', 'true')
  })

  test('date range picker updates trends data', async ({ page }) => {
    // Open date picker
    await page.getByRole('button', { name: /период/i }).click()

    // Select preset
    await page.getByRole('option', { name: '7 дней' }).click()

    // Verify chart updated (check for loading or new data)
    await expect(page.locator('[data-testid="trends-chart"]')).toBeVisible()
  })

  test('handles loading state', async ({ page }) => {
    // Slow down network
    await page.route('**/analytics/orders/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.continue()
    })

    await page.reload()
    await expect(page.locator('[data-testid="loading-skeleton"]')).toBeVisible()
  })

  test('handles error state', async ({ page }) => {
    // Mock error response
    await page.route('**/analytics/orders/trends**', (route) =>
      route.fulfill({ status: 500 })
    )

    await page.reload()
    await expect(page.getByText(/ошибка/i)).toBeVisible()
  })
})
```

### Hub Integration Tests

```typescript
// e2e/fbs-analytics/hub-integration.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Analytics Hub - FBS Card', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, 'test@test.com', 'Russia23!')
    await page.goto('/analytics')
  })

  test('displays FBS Orders card', async ({ page }) => {
    const card = page.locator('[data-testid="analytics-card-fbs-orders"]')
    await expect(card).toBeVisible()
    await expect(card.getByText('Заказы FBS')).toBeVisible()
  })

  test('card has correct description', async ({ page }) => {
    const card = page.locator('[data-testid="analytics-card-fbs-orders"]')
    await expect(card.getByText(/365 дней/)).toBeVisible()
  })

  test('clicking card navigates to FBS analytics', async ({ page }) => {
    await page.locator('[data-testid="analytics-card-fbs-orders"]').click()

    await expect(page).toHaveURL('/analytics/orders')
  })

  test('card is keyboard accessible', async ({ page }) => {
    // Tab to card
    await page.keyboard.press('Tab')
    const card = page.locator('[data-testid="analytics-card-fbs-orders"]')

    // Focus should be on or within card
    await card.focus()

    // Press Enter to activate
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL('/analytics/orders')
  })
})
```

### Backfill Admin Tests

```typescript
// e2e/fbs-analytics/backfill-admin.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Backfill Admin Page', () => {
  test.describe('Owner Access', () => {
    test.beforeEach(async ({ page }) => {
      // Login as owner
      await loginAsUser(page, 'owner@test.com', 'OwnerPass123!')
    })

    test('page is accessible to owner', async ({ page }) => {
      await page.goto('/settings/backfill')

      await expect(page.getByRole('heading', { name: 'Загрузка исторических данных' }))
        .toBeVisible()
    })

    test('displays cabinet status cards', async ({ page }) => {
      await page.goto('/settings/backfill')

      // At least one cabinet card should exist
      await expect(page.locator('[data-testid="backfill-status-card"]').first())
        .toBeVisible()
    })

    test('start backfill button opens dialog', async ({ page }) => {
      await page.goto('/settings/backfill')

      // Find idle cabinet and click start
      await page.getByRole('button', { name: 'Начать загрузку' }).first().click()

      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByText('Выберите период')).toBeVisible()
    })

    test('confirm starts backfill', async ({ page }) => {
      await page.goto('/settings/backfill')

      await page.getByRole('button', { name: 'Начать загрузку' }).first().click()
      await page.getByRole('button', { name: 'Начать загрузку' }).click()

      // Should see progress or success message
      await expect(page.getByText(/запущена|Выполняется/)).toBeVisible({
        timeout: 10000
      })
    })

    test('pause button pauses running backfill', async ({ page }) => {
      // This test assumes a backfill is running
      await page.goto('/settings/backfill')

      const pauseButton = page.getByRole('button', { name: 'Приостановить' })

      if (await pauseButton.isVisible()) {
        await pauseButton.click()

        // Confirm dialog
        await page.getByRole('button', { name: 'Подтвердить' }).click()

        await expect(page.getByText('Приостановлено')).toBeVisible()
      }
    })
  })

  test.describe('Non-Owner Access', () => {
    test('page is blocked for manager role', async ({ page }) => {
      await loginAsUser(page, 'manager@test.com', 'ManagerPass123!')
      await page.goto('/settings/backfill')

      // Should be redirected or see access denied
      await expect(page).not.toHaveURL('/settings/backfill')
    })

    test('page is blocked for analyst role', async ({ page }) => {
      await loginAsUser(page, 'analyst@test.com', 'AnalystPass123!')
      await page.goto('/settings/backfill')

      await expect(page).not.toHaveURL('/settings/backfill')
    })
  })
})
```

### Accessibility Tests

```typescript
// e2e/fbs-analytics/accessibility.spec.ts

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('FBS Analytics Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, 'test@test.com', 'Russia23!')
  })

  test('analytics page has no accessibility violations', async ({ page }) => {
    await page.goto('/analytics/orders')

    const results = await new AxeBuilder({ page })
      .include('#main-content')
      .analyze()

    expect(results.violations).toHaveLength(0)
  })

  test('analytics hub has no accessibility violations', async ({ page }) => {
    await page.goto('/analytics')

    const results = await new AxeBuilder({ page }).analyze()

    expect(results.violations).toHaveLength(0)
  })

  test('backfill admin page has no accessibility violations', async ({ page }) => {
    await loginAsUser(page, 'owner@test.com', 'OwnerPass123!')
    await page.goto('/settings/backfill')

    const results = await new AxeBuilder({ page }).analyze()

    expect(results.violations).toHaveLength(0)
  })

  test('tabs are keyboard navigable', async ({ page }) => {
    await page.goto('/analytics/orders')

    // Focus first tab
    await page.getByRole('tab', { name: 'Тренды' }).focus()

    // Arrow right to next tab
    await page.keyboard.press('ArrowRight')

    await expect(page.getByRole('tab', { name: 'Сезонность' })).toBeFocused()
  })

  test('start dialog is keyboard accessible', async ({ page }) => {
    await loginAsUser(page, 'owner@test.com', 'OwnerPass123!')
    await page.goto('/settings/backfill')

    await page.getByRole('button', { name: 'Начать загрузку' }).first().click()

    // Dialog should trap focus
    await page.keyboard.press('Tab')

    // Focus should be within dialog
    const dialog = page.getByRole('dialog')
    const focusedElement = page.locator(':focus')

    await expect(dialog).toContainElement(await focusedElement.elementHandle())
  })
})
```

### Test Fixtures

```typescript
// e2e/fixtures/fbs-analytics.ts

export const mockTrendsResponse = {
  period: {
    from: '2024-01-01',
    to: '2024-01-31',
  },
  aggregation: 'day',
  data: [
    { date: '2024-01-01', orders_count: 150, total_amount: 450000 },
    { date: '2024-01-02', orders_count: 175, total_amount: 525000 },
    // ... more data points
  ],
  summary: {
    total_orders: 5250,
    total_amount: 15750000,
    avg_daily_orders: 169.4,
    avg_order_value: 3000,
  },
}

export const mockBackfillStatus = [
  {
    cabinet_id: 'cab-001',
    cabinet_name: 'ООО "Тест"',
    status: 'idle',
    data_source: 'api',
    oldest_available_date: '2024-01-01',
    newest_available_date: '2025-01-29',
    progress: null,
    last_error: null,
    started_at: null,
    completed_at: null,
    updated_at: '2025-01-29T10:00:00Z',
  },
  {
    cabinet_id: 'cab-002',
    cabinet_name: 'ИП Иванов',
    status: 'in_progress',
    data_source: 'api',
    oldest_available_date: '2024-03-15',
    newest_available_date: '2025-01-29',
    progress: {
      total_days: 320,
      completed_days: 240,
      current_date: '2024-11-15',
      percentage: 75,
      estimated_remaining_seconds: 1800,
    },
    last_error: null,
    started_at: '2025-01-29T08:00:00Z',
    completed_at: null,
    updated_at: '2025-01-29T10:30:00Z',
  },
]
```

### Helper Functions

```typescript
// e2e/utils/fbs-test-helpers.ts

import { Page } from '@playwright/test'

export async function loginAsUser(
  page: Page,
  email: string,
  password: string
) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Пароль').fill(password)
  await page.getByRole('button', { name: 'Войти' }).click()
  await page.waitForURL('/dashboard')
}

export async function selectDateRange(
  page: Page,
  from: string,
  to: string
) {
  await page.getByRole('button', { name: /период/i }).click()
  await page.getByLabel('От').fill(from)
  await page.getByLabel('До').fill(to)
  await page.getByRole('button', { name: 'Применить' }).click()
}

export async function waitForChartLoad(page: Page) {
  await page.waitForSelector('[data-testid="chart-loaded"]', {
    state: 'visible',
    timeout: 10000,
  })
}

export async function mockFbsApi(page: Page) {
  await page.route('**/analytics/orders/trends**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockTrendsResponse),
    })
  )
}
```

### Playwright Config Updates

```typescript
// playwright.config.ts additions

projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
  {
    name: 'mobile-chrome',
    use: { ...devices['Pixel 5'] },
  },
  {
    name: 'mobile-safari',
    use: { ...devices['iPhone 12'] },
  },
],
```

---

## Testing Matrix

### Test Coverage

| Feature | Unit | Integration | E2E | A11y |
|---------|------|-------------|-----|------|
| Analytics Page | Story 51.8 | Story 51.8 | This story | This story |
| Trends Tab | Story 51.4 | Story 51.8 | This story | This story |
| Seasonal Tab | Story 51.6 | Story 51.8 | This story | This story |
| Comparison Tab | Story 51.7 | Story 51.8 | This story | This story |
| Hub Card | Story 51.9 | Story 51.9 | This story | This story |
| Backfill Admin | Story 51.11 | Story 51.11 | This story | This story |

### Browser Matrix

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chromium | Yes | Yes (Pixel 5) |
| Firefox | Yes | - |
| WebKit | Yes | Yes (iPhone 12) |

---

## Definition of Done

- [ ] All E2E tests written and passing
- [ ] Tests cover all 3 browsers
- [ ] Accessibility tests passing
- [ ] Mobile responsiveness verified
- [ ] Test fixtures documented
- [ ] CI/CD integration configured
- [ ] Code reviewed and approved

---

## Related Stories

- Story 51.8: FBS Analytics Page
- Story 51.9: Hub Integration
- Story 51.11: Backfill Admin Page

---

## Notes

- Use mock data for most tests to ensure consistency
- One or two smoke tests should hit real API
- Consider visual regression tests for charts
- CI should run tests on every PR

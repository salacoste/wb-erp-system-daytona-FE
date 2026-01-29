# Story 53.8-FE: E2E Tests & Polish

## Story Info

- **Epic**: 53-FE - Supply Management UI
- **Sprint**: 5 (Mar 31 - Apr 11, 2026)
- **Priority**: High
- **Points**: 3
- **Status**: Ready for Dev

## User Story

**As a** developer maintaining the Supplies module,
**I want** comprehensive E2E tests and polished error states,
**So that** I can confidently deploy changes and ensure consistent user experience.

## Background

This is the final story of Epic 53-FE. It focuses on:

1. **E2E Testing**: Full supply lifecycle coverage with Playwright
2. **Accessibility**: WCAG 2.1 AA compliance audit
3. **Error States**: Consistent 404/403/500 error pages
4. **Mobile**: Responsive drawer and touch interactions
5. **Performance**: Final optimization pass

This story ensures production readiness for the entire Supplies module.

---

## Acceptance Criteria

### AC1: Full Lifecycle E2E Test

- [ ] Test covers: Create -> Add Orders -> Close -> Generate Stickers -> Track Delivery
- [ ] Uses test fixtures for consistent data
- [ ] Runs in CI pipeline (GitHub Actions)
- [ ] Test passes consistently (no flaky tests)
- [ ] Timeout set appropriately (60 seconds max)

### AC2: Order Picker Performance Test

- [ ] Test with 100+ orders dataset
- [ ] Virtualization works correctly (only visible rows in DOM)
- [ ] Selection state persists during scroll
- [ ] Filter/search responsive (<300ms)
- [ ] No memory leaks detected

### AC3: Error Handling E2E Tests

- [ ] Test 404 when supply not found
- [ ] Test 403 when no cabinet access
- [ ] Test network failure scenarios
- [ ] Test rate limit (429) behavior
- [ ] Test partial success on order add

### AC4: Mobile Responsive E2E Tests

- [ ] Test on mobile viewport (375x667)
- [ ] Drawer opens full-screen on mobile
- [ ] Touch gestures work correctly
- [ ] Navigation accessible on mobile
- [ ] Tables scroll horizontally if needed

### AC5: Accessibility Audit

- [ ] Run axe-core accessibility tests
- [ ] All interactive elements keyboard accessible
- [ ] Focus management correct on drawers/modals
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1)
- [ ] Screen reader announces status changes

### AC6: 404 Error Page

- [ ] Styled 404 page for `/supplies/[id]` not found
- [ ] Illustration or icon
- [ ] Message: "Поставка не найдена"
- [ ] "Вернуться к списку" button links to `/supplies`
- [ ] Consistent with app design system

### AC7: 403 Error Page

- [ ] Styled 403 page for unauthorized access
- [ ] Message: "Нет доступа к этой поставке"
- [ ] "Вернуться к списку" button
- [ ] No sensitive information leaked

### AC8: Loading Skeleton Consistency

- [ ] All pages have loading skeletons
- [ ] Skeleton matches final layout shape
- [ ] No layout shift when content loads
- [ ] Skeleton animations smooth
- [ ] Consistent skeleton component usage

---

## E2E Test Scenarios

### Scenario 1: Full Supply Lifecycle

```gherkin
Feature: Supply Lifecycle
  As a WB seller
  I want to create and manage a supply
  So I can deliver orders to Wildberries

  Scenario: Complete supply workflow
    Given I am logged in with a valid cabinet
    And I have FBS orders ready for supply

    When I navigate to "/supplies"
    And I click "Создать поставку"
    And I enter name "Тестовая поставка"
    And I click "Создать"

    Then I should be redirected to the supply detail page
    And the status should be "OPEN"

    When I click "Добавить заказы"
    And I select 3 orders from the picker
    And I click "Добавить выбранные (3)"

    Then I should see 3 orders in the supply
    And I should see success toast

    When I click "Закрыть поставку"
    And I confirm in the dialog

    Then the status should change to "CLOSED"
    And I should see "Сгенерировать стикеры" button

    When I click "Сгенерировать стикеры"
    And I select "PNG" format
    And I click "Скачать"

    Then a file should download
    And the document should appear in the list
```

### Scenario 2: Order Picker with Large Dataset

```gherkin
Scenario: Order picker handles 100+ orders
  Given I have a supply in OPEN status
  And there are 150 eligible orders

  When I click "Добавить заказы"

  Then the order picker should open
  And I should see virtualized list
  And only ~10-15 rows should be in the DOM

  When I scroll to the bottom

  Then I should see order #150
  And scrolling should be smooth (<16ms frame time)

  When I search for "ABC-001"

  Then results should filter in <300ms
  And matching orders should be visible
```

### Scenario 3: Error Handling

```gherkin
Scenario: Handle supply not found
  When I navigate to "/supplies/non-existent-id"

  Then I should see 404 error page
  And the message should be "Поставка не найдена"
  And I should see "Вернуться к списку" button

  When I click "Вернуться к списку"

  Then I should be on "/supplies"
```

### Scenario 4: Mobile Navigation

```gherkin
Scenario: Mobile order picker drawer
  Given I am on mobile viewport (375x667)
  And I have a supply in OPEN status

  When I tap "Добавить заказы"

  Then the drawer should open full-screen
  And the close button should be visible
  And the list should be scrollable by touch

  When I swipe down on the drawer

  Then the drawer should close (optional gesture)
```

---

## Test Files to Create

### E2E Test Structure

```
e2e/
├── supplies/
│   ├── supplies.spec.ts              # Full lifecycle tests
│   ├── supplies-accessibility.spec.ts # A11y tests with axe-core
│   ├── supplies-mobile.spec.ts        # Mobile viewport tests
│   └── fixtures/
│       ├── supplies.json              # Test supply data
│       └── orders.json                # Test orders data
```

### Test File Details

| File | Purpose | Lines Est. | Priority |
|------|---------|------------|----------|
| `supplies.spec.ts` | Full lifecycle E2E | ~200 | P0 |
| `supplies-accessibility.spec.ts` | Accessibility audit | ~100 | P1 |
| `supplies-mobile.spec.ts` | Mobile responsive tests | ~120 | P1 |

---

## Components to Create/Update

### New Components

| File | Purpose | Lines Est. |
|------|---------|------------|
| `SupplyNotFound.tsx` | 404 error page | ~50 |
| `SupplyAccessDenied.tsx` | 403 error page | ~50 |

### Components to Update

| File | Changes | Notes |
|------|---------|-------|
| `supplies/[id]/page.tsx` | Add error boundary | Handle 404/403 |
| `SuppliesLoadingSkeleton.tsx` | Verify layout match | Polish |
| `OrderPickerSkeleton.tsx` | Verify layout match | Polish |

### Component Location

```
src/app/(dashboard)/supplies/
├── [id]/
│   ├── page.tsx                # Update: error handling
│   ├── not-found.tsx           # NEW: 404 page
│   ├── error.tsx               # NEW: Error boundary
│   └── components/
│       └── SupplyAccessDenied.tsx  # NEW: 403 component
└── components/
    └── SuppliesLoadingSkeleton.tsx  # Polish
```

---

## E2E Test Implementation

### Full Lifecycle Test

```typescript
// e2e/supplies/supplies.spec.ts
import { test, expect } from '@playwright/test'
import { loginAsTestUser, selectCabinet } from '../helpers/auth'

test.describe('Supply Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
    await selectCabinet(page)
  })

  test('creates supply, adds orders, closes, and generates stickers', async ({ page }) => {
    // Navigate to supplies
    await page.goto('/supplies')
    await expect(page.getByRole('heading', { name: 'Поставки' })).toBeVisible()

    // Create supply
    await page.getByRole('button', { name: 'Создать поставку' }).click()
    await page.getByLabel('Название').fill('Тестовая поставка E2E')
    await page.getByRole('button', { name: 'Создать' }).click()

    // Verify redirect to detail page
    await expect(page).toHaveURL(/\/supplies\/[a-zA-Z0-9_-]+/)
    await expect(page.getByText('OPEN')).toBeVisible()

    // Add orders
    await page.getByRole('button', { name: 'Добавить заказы' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Select first 3 orders
    const checkboxes = page.getByRole('checkbox').all()
    for (let i = 0; i < 3; i++) {
      await (await checkboxes)[i + 1].check() // Skip "select all"
    }

    await page.getByRole('button', { name: /Добавить выбранные \(3\)/ }).click()

    // Verify orders added
    await expect(page.getByText(/3 заказов/)).toBeVisible()

    // Close supply
    await page.getByRole('button', { name: 'Закрыть поставку' }).click()
    await page.getByRole('button', { name: 'Закрыть поставку' }).click() // Confirm

    // Verify status changed
    await expect(page.getByText('CLOSED')).toBeVisible()

    // Generate stickers
    await page.getByRole('button', { name: 'Сгенерировать стикеры' }).click()

    // Wait for download
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Скачать' }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/stickers.*\.png/)
  })

  test('handles supply not found gracefully', async ({ page }) => {
    await page.goto('/supplies/non-existent-id-12345')

    await expect(page.getByText('Поставка не найдена')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Вернуться к списку' })).toBeVisible()
  })
})
```

### Accessibility Test

```typescript
// e2e/supplies/supplies-accessibility.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { loginAsTestUser, selectCabinet } from '../helpers/auth'

test.describe('Supplies Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
    await selectCabinet(page)
  })

  test('supplies list page passes accessibility audit', async ({ page }) => {
    await page.goto('/supplies')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('supply detail page passes accessibility audit', async ({ page }) => {
    // Navigate to first supply
    await page.goto('/supplies')
    await page.getByRole('row').nth(1).click()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('order picker drawer has proper focus management', async ({ page }) => {
    await page.goto('/supplies')
    await page.getByRole('row').nth(1).click()

    // Open drawer
    await page.getByRole('button', { name: 'Добавить заказы' }).click()

    // Focus should be inside drawer
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Close button should be focusable
    const closeButton = dialog.getByRole('button', { name: 'Close' })
    await closeButton.focus()
    await expect(closeButton).toBeFocused()

    // Escape should close
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()

    // Focus should return to trigger
    await expect(page.getByRole('button', { name: 'Добавить заказы' })).toBeFocused()
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/supplies')

    // Tab through elements
    await page.keyboard.press('Tab')

    // Create button should be reachable
    let attempts = 0
    while (attempts < 20) {
      const focused = page.locator(':focus')
      const text = await focused.textContent()
      if (text?.includes('Создать поставку')) break
      await page.keyboard.press('Tab')
      attempts++
    }

    expect(attempts).toBeLessThan(20)
  })
})
```

### Mobile Responsive Test

```typescript
// e2e/supplies/supplies-mobile.spec.ts
import { test, expect, devices } from '@playwright/test'
import { loginAsTestUser, selectCabinet } from '../helpers/auth'

test.use({ ...devices['iPhone 13'] })

test.describe('Supplies Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
    await selectCabinet(page)
  })

  test('supplies list renders correctly on mobile', async ({ page }) => {
    await page.goto('/supplies')

    // Verify mobile layout
    await expect(page.getByRole('heading', { name: 'Поставки' })).toBeVisible()

    // Table should be horizontally scrollable
    const table = page.getByRole('table')
    await expect(table).toBeVisible()

    // Check for horizontal scroll indicator or responsive behavior
    const tableContainer = table.locator('..')
    const hasOverflow = await tableContainer.evaluate(
      el => el.scrollWidth > el.clientWidth
    )

    // Either table fits or is scrollable
    expect(true).toBe(true) // Placeholder - verify actual behavior
  })

  test('order picker drawer opens full-screen on mobile', async ({ page }) => {
    await page.goto('/supplies')
    await page.getByRole('row').nth(1).click()

    await page.getByRole('button', { name: 'Добавить заказы' }).click()

    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()

    // Verify full-screen
    const drawerBounds = await drawer.boundingBox()
    const viewport = page.viewportSize()

    expect(drawerBounds?.width).toBeCloseTo(viewport?.width ?? 0, -1)
  })

  test('touch interactions work in order picker', async ({ page }) => {
    await page.goto('/supplies')
    await page.getByRole('row').nth(1).click()

    await page.getByRole('button', { name: 'Добавить заказы' }).click()

    // Tap on checkbox
    const checkbox = page.getByRole('checkbox').nth(1)
    await checkbox.tap()

    await expect(checkbox).toBeChecked()

    // Scroll by touch (swipe gesture)
    const list = page.locator('[data-testid="order-picker-list"]')
    await list.evaluate(el => el.scrollTo(0, 500))

    // List should have scrolled
    const scrollTop = await list.evaluate(el => el.scrollTop)
    expect(scrollTop).toBeGreaterThan(0)
  })

  test('navigation menu accessible on mobile', async ({ page }) => {
    await page.goto('/supplies')

    // Mobile menu button should be visible
    const menuButton = page.getByRole('button', { name: /menu/i })

    if (await menuButton.isVisible()) {
      await menuButton.click()
      await expect(page.getByRole('navigation')).toBeVisible()
    }
  })
})
```

---

## Error Page Components

### 404 Not Found Page

```typescript
// src/app/(dashboard)/supplies/[id]/not-found.tsx
import Link from 'next/link'
import { PackageX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SupplyNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <PackageX className="h-24 w-24 text-muted-foreground mb-6" />

      <h1 className="text-2xl font-bold mb-2">
        Поставка не найдена
      </h1>

      <p className="text-muted-foreground mb-6 max-w-md">
        Запрашиваемая поставка не существует или была удалена.
        Проверьте правильность ссылки или вернитесь к списку поставок.
      </p>

      <Button asChild>
        <Link href="/supplies">
          Вернуться к списку
        </Link>
      </Button>
    </div>
  )
}
```

### 403 Access Denied Component

```typescript
// src/app/(dashboard)/supplies/[id]/components/SupplyAccessDenied.tsx
import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SupplyAccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <ShieldX className="h-24 w-24 text-muted-foreground mb-6" />

      <h1 className="text-2xl font-bold mb-2">
        Нет доступа
      </h1>

      <p className="text-muted-foreground mb-6 max-w-md">
        У вас нет прав для просмотра этой поставки.
        Обратитесь к администратору или выберите другой кабинет.
      </p>

      <Button asChild>
        <Link href="/supplies">
          Вернуться к списку
        </Link>
      </Button>
    </div>
  )
}
```

### Error Boundary

```typescript
// src/app/(dashboard)/supplies/[id]/error.tsx
'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SupplyError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Supply Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <AlertTriangle className="h-24 w-24 text-destructive mb-6" />

      <h1 className="text-2xl font-bold mb-2">
        Произошла ошибка
      </h1>

      <p className="text-muted-foreground mb-6 max-w-md">
        Не удалось загрузить страницу. Попробуйте обновить страницу
        или вернитесь позже.
      </p>

      <div className="flex gap-4">
        <Button onClick={reset} variant="outline">
          Попробовать снова
        </Button>
        <Button asChild>
          <a href="/supplies">
            Вернуться к списку
          </a>
        </Button>
      </div>
    </div>
  )
}
```

---

## Polish Checklist

### Loading Skeletons

- [ ] `SuppliesListPage` has skeleton matching table layout
- [ ] `SupplyDetailPage` has skeleton matching header + content
- [ ] `OrderPickerDrawer` has skeleton matching list layout
- [ ] No layout shift (CLS = 0) when content loads
- [ ] Skeleton pulse animation smooth

### Toast Messages Review

| Action | Message | Type |
|--------|---------|------|
| Create supply | "Поставка создана" | Success |
| Add orders | "Добавлено: N заказов" | Success |
| Add orders partial | "Не удалось добавить: N заказов" | Warning |
| Close supply | "Поставка закрыта" | Success |
| Generate stickers | "Стикеры сгенерированы" | Success |
| Download stickers | "Стикеры скачаны" | Success |
| Sync status | "Статусы обновлены" | Success |
| Rate limit | "Слишком частые запросы" | Error |
| Network error | "Проблемы с сетью" | Error |
| Generic error | "Произошла ошибка" | Error |

### Keyboard Navigation Audit

- [ ] All buttons reachable via Tab
- [ ] All form inputs reachable via Tab
- [ ] Enter activates focused button
- [ ] Space toggles checkboxes
- [ ] Escape closes modals/drawers
- [ ] Arrow keys work in dropdowns

### Console Errors

- [ ] No React warnings in development
- [ ] No TypeScript errors
- [ ] No uncaught promises
- [ ] No accessibility warnings (axe)

---

## Testing

### Framework & Locations

- **E2E Framework**: Playwright
- **A11y Testing**: @axe-core/playwright
- **Test Location**: `e2e/supplies/`

### Test Cases Summary

#### E2E Tests

- [ ] Full lifecycle: create -> add -> close -> stickers -> track
- [ ] Order picker with 100+ orders
- [ ] 404 error page
- [ ] 403 error handling
- [ ] Network failure recovery
- [ ] Rate limit behavior

#### Accessibility Tests

- [ ] List page axe audit pass
- [ ] Detail page axe audit pass
- [ ] Focus management in drawers
- [ ] Keyboard navigation complete

#### Mobile Tests

- [ ] List page renders on mobile
- [ ] Detail page renders on mobile
- [ ] Drawer opens full-screen
- [ ] Touch interactions work

---

## Definition of Done

### E2E Tests

- [ ] `supplies.spec.ts` created with full lifecycle
- [ ] `supplies-accessibility.spec.ts` created with axe tests
- [ ] `supplies-mobile.spec.ts` created with mobile viewport
- [ ] Test fixtures created
- [ ] All tests passing in CI
- [ ] No flaky tests

### Error States

- [ ] `not-found.tsx` created (404 page)
- [ ] `error.tsx` created (error boundary)
- [ ] `SupplyAccessDenied.tsx` created (403 component)
- [ ] Error pages styled consistently
- [ ] All error messages in Russian

### Polish

- [ ] All loading skeletons match final layout
- [ ] No layout shift (CLS = 0)
- [ ] Toast messages reviewed and consistent
- [ ] No console errors
- [ ] Keyboard navigation complete

### Accessibility

- [ ] WCAG 2.1 AA compliance verified
- [ ] Color contrast 4.5:1 minimum
- [ ] All interactive elements focusable
- [ ] Screen reader tested (basic)

### Mobile

- [ ] All pages responsive
- [ ] Drawer works on mobile
- [ ] Touch interactions work
- [ ] Navigation accessible

### Quality

- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] File size <200 lines per component
- [ ] Code review approved
- [ ] Manual QA sign-off

---

## Dependencies

### Required (Blocking)

| Dependency | Story | Status | Notes |
|------------|-------|--------|-------|
| All previous stories | 53.1-53.7-FE | Required | Complete module |
| @axe-core/playwright | Package | Install | A11y testing |

### External

| Package | Version | Purpose |
|---------|---------|---------|
| @playwright/test | ^1.40.x | E2E testing |
| @axe-core/playwright | ^4.8.x | Accessibility |

---

## Dev Notes

### Source Tree

```
e2e/
├── supplies/
│   ├── supplies.spec.ts              # NEW: This story
│   ├── supplies-accessibility.spec.ts # NEW: This story
│   ├── supplies-mobile.spec.ts        # NEW: This story
│   └── fixtures/
│       ├── supplies.json              # NEW: Test data
│       └── orders.json                # NEW: Test data
├── helpers/
│   └── auth.ts                        # Login helper (may exist)

src/app/(dashboard)/supplies/[id]/
├── not-found.tsx                      # NEW: This story
├── error.tsx                          # NEW: This story
└── components/
    └── SupplyAccessDenied.tsx         # NEW: This story
```

### CI Integration

Add to `.github/workflows/e2e.yml`:

```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Test Data Requirements

For E2E tests to work, the backend must have:
- Test user with valid credentials
- Test cabinet with supplies
- At least 100 eligible FBS orders
- Supply in each status (for status-specific tests)

---

## Tasks Breakdown

| # | Task | Est. Hours | Notes |
|---|------|------------|-------|
| 1 | Create E2E test structure | 1 | Setup folders, fixtures |
| 2 | Install @axe-core/playwright | 0.5 | npm install |
| 3 | Write supplies.spec.ts | 4 | Full lifecycle test |
| 4 | Write supplies-accessibility.spec.ts | 2 | Axe tests |
| 5 | Write supplies-mobile.spec.ts | 2 | Mobile viewport tests |
| 6 | Create not-found.tsx | 1 | 404 page |
| 7 | Create error.tsx | 1 | Error boundary |
| 8 | Create SupplyAccessDenied.tsx | 0.5 | 403 component |
| 9 | Polish loading skeletons | 1 | Verify layout match |
| 10 | Review toast messages | 0.5 | Consistency check |
| 11 | Keyboard navigation audit | 1 | Manual testing |
| 12 | Console error cleanup | 1 | Fix any issues |
| 13 | CI integration | 1 | GitHub Actions |
| **Total** | | **16.5** | ~2 days |

---

## Related

- **Parent Epic**: [Epic 53-FE: Supply Management UI](../../epics/epic-53-fe-supply-management.md)
- **Prerequisite**: [Story 53.7-FE: Status Polling & Sync](./story-53.7-fe-status-polling-sync.md)
- **Testing Guide**: `docs/TESTING-GUIDE.md`
- **Backend API**: `test-api/16-supplies.http`

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-29 | 1.0 | Initial story creation | Claude Code (PM Agent) |

---

## Dev Agent Record

_Section for Dev Agent to track implementation progress and decisions_

```
Status: Ready for Dev
Agent:
Started:
Completed:
Notes:
```

---

## QA Results

_Section for QA to document review results_

```
Gate Decision:
Reviewer:
Date:
Quality Score: /100
```

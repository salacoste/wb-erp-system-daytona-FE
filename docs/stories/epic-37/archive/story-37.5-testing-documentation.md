# Story 37.5: Testing & Documentation

**Epic**: Epic 37 - Merged Group Table Display (Склейки)
**Status**: 📋 Draft - Awaiting PO Validation
**Effort**: 1-2 hours
**Priority**: Medium (Requires Stories 37.1-37.4 completion)
**Assignee**: [TO BE ASSIGNED - Frontend Dev]

---

## 🎯 User Story

**As a** QA engineer and future developer
**I want** comprehensive tests and documentation for the MergedGroupTable feature
**So that** the component is maintainable, regressions are caught early, and users understand how to interpret склейка analytics

---

## 📋 Acceptance Criteria

### Unit Tests (Jest + React Testing Library)
- [ ] `MergedGroupTable.test.tsx` created with ≥90% code coverage
- [ ] Tests for rowspan rendering (correct `rowspan` attribute values)
- [ ] Tests for aggregate metric calculations (6 formulas from Story 37.3)
- [ ] Tests for crown icon display (main product vs children)
- [ ] Tests for formatting functions (currency, percentage, ROAS)
- [ ] Tests for edge cases (zero spend, negative revenue, single-product groups)

### Integration Tests (Playwright)
- [ ] E2E test: Navigate to analytics page, switch to "По склейкам" mode
- [ ] E2E test: Verify table structure (rowspan cell, aggregate row, detail rows)
- [ ] E2E test: Click on product row, verify navigation/interaction
- [ ] E2E test: Sort by ROAS column, verify group order changes
- [ ] E2E test: Responsive behavior (desktop → tablet → mobile)

### Accessibility Tests (axe-core)
- [ ] No WCAG 2.1 AA violations detected
- [ ] Screen reader announces rowspan cell content correctly
- [ ] Keyboard navigation works (Tab to focus, Enter to activate)
- [ ] Crown icon has proper `aria-label` or text alternative
- [ ] Sortable columns indicate sort state with `aria-sort`

### Documentation
- [ ] User guide section added to frontend README
- [ ] Screenshot documentation in `docs/stories/epic-37/screenshots/`
- [ ] API response examples in `docs/stories/epic-37/api-response-sample.json`
- [ ] Component usage example in Storybook (optional, per PO)
- [ ] [PO TO FILL] Help tooltip content for "Склейка" column?

### [PO TO FILL] Additional Requirements
- [ ] [PO TO SPECIFY] Performance test: Table render time with 100 groups?
- [ ] [PO TO SPECIFY] Visual regression test: Percy/Chromatic screenshots?
- [ ] [PO TO SPECIFY] User acceptance testing: 3-5 beta users?
- [ ] [PO TO SPECIFY] Analytics tracking: Mixpanel/GA events for group clicks?

---

## 🧪 Unit Test Suite

### Test File Structure
```typescript
// File: frontend/src/app/(dashboard)/analytics/advertising/components/MergedGroupTable.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MergedGroupTable } from './MergedGroupTable';

describe('MergedGroupTable', () => {
  describe('Rowspan Rendering', () => {
    it('renders rowspan cell spanning aggregate + detail rows', () => {
      // Test implementation
    });

    it('displays main product name and product count', () => {
      // Test implementation
    });
  });

  describe('Aggregate Metrics', () => {
    it('calculates totalSales as sum of products', () => {
      // Test implementation
    });

    it('calculates ROAS as revenue / spend', () => {
      // Test implementation
    });

    it('handles zero spend edge case (ROAS = N/A)', () => {
      // Test implementation
    });
  });

  describe('Crown Icon', () => {
    it('displays crown icon for main product', () => {
      // Test implementation
    });

    it('does not display crown for child products', () => {
      // Test implementation
    });
  });

  describe('Formatting', () => {
    it('formats currency with Russian locale', () => {
      // Test implementation
    });

    it('formats percentages with 1 decimal place', () => {
      // Test implementation
    });
  });

  describe('Edge Cases', () => {
    it('handles single-product group', () => {
      // Test implementation
    });

    it('handles negative revenue', () => {
      // Test implementation
    });
  });
});
```

### Key Test Examples

**Test 1: Rowspan Attribute**
```typescript
it('renders rowspan cell spanning aggregate + detail rows', () => {
  const mockGroup = createMockGroup({ productCount: 6 }); // 1 aggregate + 6 details
  render(<MergedGroupTable groups={[mockGroup]} />);

  const rowspanCell = screen.getByText(/ter-09/i).closest('td');
  expect(rowspanCell).toHaveAttribute('rowspan', '7'); // 1 + 6
});
```

**Test 2: Aggregate Calculation**
```typescript
it('calculates totalSales as sum of products', () => {
  const products = [
    { totalSales: 15000 },
    { totalSales: 1489 },
    { totalSales: 8500 },
  ];
  const expectedTotal = 24989;

  const aggregate = calculateAggregateMetrics(products);
  expect(aggregate.totalSales).toBe(expectedTotal);
});
```

**Test 3: Crown Icon**
```typescript
it('displays crown icon for main product', () => {
  const mockGroup = createMockGroup({ mainProductId: 'ter-09' });
  render(<MergedGroupTable groups={[mockGroup]} />);

  const crownIcons = screen.getAllByLabelText('Главный товар'); // Crown aria-label
  expect(crownIcons).toHaveLength(1);
});
```

---

## 🎭 Integration Test Suite (Playwright)

### Test File
```typescript
// File: frontend/e2e/advertising-analytics-merged-groups.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Advertising Analytics - Склейки Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics/advertising');
  });

  test('switches to merged groups view', async ({ page }) => {
    // Click "По склейкам" toggle
    await page.click('button:has-text("По склейкам")');

    // Verify URL parameter
    await expect(page).toHaveURL(/group_by=imtId/);

    // Verify table structure
    const rowspanCells = page.locator('td[rowspan]');
    await expect(rowspanCells).toHaveCount(3); // 3 groups
  });

  test('displays aggregate row with correct styling', async ({ page }) => {
    await page.click('button:has-text("По склейкам")');

    // Verify aggregate row background color
    const aggregateRow = page.locator('tr.aggregate-row').first();
    await expect(aggregateRow).toHaveCSS('background-color', 'rgb(243, 244, 246)'); // #F3F4F6
  });

  test('shows crown icon for main products', async ({ page }) => {
    await page.click('button:has-text("По склейкам")');

    // Count crown icons
    const crownIcons = page.locator('[data-lucide="crown"]');
    await expect(crownIcons).toHaveCount(3); // 3 groups, 1 main product each
  });

  test('sorts by ROAS column', async ({ page }) => {
    await page.click('button:has-text("По склейкам")');

    // Click ROAS column header
    await page.click('th:has-text("ROAS")');

    // Verify first group has highest ROAS
    const firstROAS = await page.locator('tr.aggregate-row td:last-child').first().textContent();
    expect(parseFloat(firstROAS || '0')).toBeGreaterThan(2.0);
  });

  test('responsive behavior on tablet', async ({ page }) => {
    // Set viewport to tablet size
    await page.setViewportSize({ width: 800, height: 600 });

    await page.click('button:has-text("По склейкам")');

    // Verify horizontal scroll enabled
    const tableContainer = page.locator('.overflow-x-auto');
    await expect(tableContainer).toBeVisible();
  });
});
```

---

## ♿ Accessibility Test Suite

### Axe-Core Integration
```typescript
// File: frontend/src/app/(dashboard)/analytics/advertising/components/MergedGroupTable.test.tsx

import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('MergedGroupTable Accessibility', () => {
  it('has no WCAG 2.1 AA violations', async () => {
    const { container } = render(
      <MergedGroupTable groups={mockGroups} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('announces rowspan cell content to screen readers', () => {
    render(<MergedGroupTable groups={mockGroups} />);

    const rowspanCell = screen.getByText(/ter-09/i).closest('td');
    expect(rowspanCell).toHaveAttribute('role', 'rowheader'); // If applicable
  });

  it('crown icon has text alternative', () => {
    render(<MergedGroupTable groups={mockGroups} />);

    const crownIcon = screen.getByLabelText('Главный товар');
    expect(crownIcon).toBeInTheDocument();
  });
});
```

### Manual Screen Reader Testing
- [ ] NVDA (Windows): Navigate through table, verify group boundaries announced
- [ ] VoiceOver (macOS): Tab through rows, confirm crown icon description
- [ ] Keyboard-only: Tab to focus rows, Enter to activate clicks
- [ ] High contrast mode: Verify visual hierarchy maintained

---

## 📚 Documentation

### User Guide Section (Frontend README)
````markdown
### Склейки (Merged Product Cards) Analytics

**What are склейки?**
Wildberries groups related products into "склейки" (merged cards) that share the same `imtId`. Advertising spend goes to the **main product** (marked with 👑), but sales distribute across **all products** in the group.

**How to view склейки analytics:**
1. Navigate to Analytics → Advertising
2. Click "По склейкам" toggle (top right)
3. Table displays:
   - **Tier 1**: Group indicator (left column, rowspan)
   - **Tier 2**: Aggregate metrics (first row, gray background)
   - **Tier 3**: Individual product metrics (detail rows, white background)

**Reading the table:**
- **Всего продаж**: Total revenue (organic + advertising)
- **Из рекламы**: Revenue attributed to ads (percentage shown inline)
- **Органика**: Revenue from non-ad sources
- **Расход**: Total ad spend for group
- **ROAS**: Return on ad spend (revenue / spend)

**Main vs Child products:**
- 👑 **Main product**: Has ad spend > 0, receives budget
- **Child products**: Have ad spend = 0, benefit from main product's ads

**Example:**
```
┌─────────────┬────────────┬──────────┬───────────┬─────────┬────────┐
│ ter-09      │ ГРУППА     │ 35,570₽  │ 10,234₽   │ 11,337₽ │ 0.90   │ ← Aggregate
│ + 5 товаров │ #328632    │          │ (29%)     │         │        │
│             ├────────────┼──────────┼───────────┼─────────┼────────┤
│ (Rowspan)   │ 👑 ter-09  │ 15,000₽  │ 4,000₽    │ 6,000₽  │ 0.67   │ ← Main
│             │ ter-10     │ 1,489₽   │ 400₽      │ 0₽      │ N/A    │ ← Child
│             │ ter-11     │ 8,500₽   │ 2,300₽    │ 0₽      │ N/A    │ ← Child
│             │ ...        │ ...      │ ...       │ ...     │ ...    │
└─────────────┴────────────┴──────────┴───────────┴─────────┴────────┘
```
````

### API Response Example
```json
// File: docs/stories/epic-37/api-response-sample.json
{
  "data": [
    {
      "imtId": 328632,
      "mainProduct": {
        "nmId": "ter-09",
        "name": "Product Name"
      },
      "productCount": 6,
      "aggregateMetrics": {
        "totalSales": 35570,
        "revenue": 10234,
        "organicSales": 25336,
        "organicContribution": 71.2,
        "spend": 11337,
        "roas": 0.90
      },
      "products": [
        {
          "nmId": "ter-09",
          "imtId": 328632,
          "isMainProduct": true,
          "totalSales": 15000,
          "revenue": 4000,
          "organicSales": 11000,
          "organicContribution": 73.3,
          "spend": 6000,
          "roas": 0.67
        }
        // ... 5 more products
      ]
    }
  ]
}
```

---

## 📸 Screenshot Documentation

### Required Screenshots
- [ ] **Desktop view (1400px)**: Full table with 3 groups
- [ ] **Tablet view (800px)**: Horizontal scroll enabled
- [ ] **Mobile view (400px)**: [PO TO FILL] Card layout or scroll?
- [ ] **Hover state**: Detail row hovered (gray-50 background)
- [ ] **Crown icon closeup**: Main product with yellow crown
- [ ] **Aggregate row closeup**: Bold text, gray background
- [ ] **Comparison**: "По склейкам" vs "По артикулам" modes

### Screenshot Naming Convention
```
docs/stories/epic-37/screenshots/
├── 01-desktop-full-table.png
├── 02-tablet-horizontal-scroll.png
├── 03-mobile-view.png
├── 04-hover-state.png
├── 05-crown-icon-closeup.png
├── 06-aggregate-row-closeup.png
└── 07-mode-comparison.png
```

---

## ✅ Definition of Done

- [ ] Unit tests created with ≥90% code coverage
- [ ] Integration tests created (≥5 scenarios)
- [ ] Accessibility tests pass (axe-core + manual screen reader)
- [ ] User guide section added to frontend README
- [ ] API response example saved in `docs/stories/epic-37/`
- [ ] Screenshots captured and organized (7 images minimum)
- [ ] [PO TO FILL] Storybook story created (optional)?
- [ ] [PO TO FILL] Performance test: Render time <200ms for 50 groups?
- [ ] [PO TO FILL] User acceptance testing: 3 beta users approve?
- [ ] All tests passing in CI/CD pipeline
- [ ] Epic 37 marked as complete, deployed to production

---

## 📎 References

- **Story 37.2**: `docs/stories/epic-37/story-37.2-merged-group-table-component.md` - Component to test
- **Story 37.3**: `docs/stories/epic-37/story-37.3-aggregate-metrics-display.md` - Calculations to verify
- **Jest Docs**: https://jestjs.io/docs/getting-started - Unit testing framework
- **Playwright Docs**: https://playwright.dev/ - E2E testing framework
- **axe-core**: https://github.com/dequelabs/axe-core - Accessibility testing library
- **React Testing Library**: https://testing-library.com/react - Component testing utilities

---

## 🎯 Next Steps

1. **Frontend dev**: Write unit tests for MergedGroupTable component
2. **QA engineer**: Create Playwright E2E tests
3. **Accessibility audit**: Run axe-core, fix violations
4. **Documentation**: Write user guide section
5. **Screenshots**: Capture all required images
6. **PO review**: Demo tests, documentation, get final approval
7. **Deploy**: Merge to main, deploy to production
8. **Monitor**: Track analytics events, gather user feedback

---

**Story Owner**: [TO BE ASSIGNED]
**Created**: 2025-12-29
**Last Updated**: 2025-12-29

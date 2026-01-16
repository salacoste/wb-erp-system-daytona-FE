# Story 44.6: Testing & Documentation

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: Draft
**Priority**: P1 - HIGH
**Effort**: 2 SP
**Depends On**: Stories 44.1, 44.2, 44.3, 44.4, 44.5 ✅

---

## User Story

**As a** Development Team,
**I want** comprehensive tests and documentation,
**So that** the Price Calculator feature is reliable and maintainable.

**Non-goals**:
- New features
- Backend changes

---

## Acceptance Criteria

### AC1: Unit Tests
- [ ] `PriceCalculatorForm` component tests (validation, sliders, toggle)
- [ ] `PriceCalculatorResults` component tests (rendering, formatting)
- [ ] `CostBreakdownChart` component tests (data rendering)
- [ ] `usePriceCalculator` hook tests (API call, error handling)
- [ ] `calculatePrice` API client tests (request formatting)
- [ ] Test coverage ≥ 80%

### AC2: Integration Tests
- [ ] Full calculation flow test (form → API → results)
- [ ] Error handling integration test
- [ ] Warning display test with mock backend response

### AC3: E2E Tests
- [ ] User navigates to Price Calculator page
- [ ] User inputs values and sees results
- [ ] User resets form
- [ ] User sees error on invalid input
- [ ] User sees warning from backend

### AC4: Documentation
- [ ] Update `docs/API-PATHS-REFERENCE.md` with frontend usage
- [ ] Create user guide for Price Calculator in `docs/user-guide/`
- [ ] Add component comments with examples
- [ ] Update CHANGELOG.md with Epic 44 completion

### AC5: Accessibility Audit
- [ ] Run axe-core or similar linter
- [ ] Manual keyboard navigation test
- [ ] Screen reader compatibility test
- [ ] Fix all A11y issues found

---

## Context & References

- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **All Stories**: `docs/stories/epic-44/*.md`
- **Testing Guide**: `docs/TESTING-GUIDE.md` (if exists)

---

## Implementation Notes

### Test File Structure

```
src/
├── components/
│   └── custom/
│       └── price-calculator/
│           ├── __tests__/
│           │   ├── PriceCalculatorForm.test.tsx
│           │   ├── PriceCalculatorResults.test.tsx
│           │   ├── CostBreakdownChart.test.tsx
│           │   └── WarningsBanner.test.tsx
├── hooks/
│   └── __tests__/
│       └── usePriceCalculator.test.ts
└── api/
    └── __tests__/
        └── price-calculator.test.ts
```

### Unit Test Examples

```typescript
// src/components/custom/price-calculator/__tests__/PriceCalculatorForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PriceCalculatorForm } from '../PriceCalculatorForm';

describe('PriceCalculatorForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders all required input fields', () => {
    render(<PriceCalculatorForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/target margin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cogs/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/logistics forward/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/logistics reverse/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/buyback/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/advertising/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/storage/i)).toBeInTheDocument();
  });

  it('validates negative values', async () => {
    render(<PriceCalculatorForm onSubmit={mockOnSubmit} />);

    const cogsInput = screen.getByLabelText(/cogs/i);
    fireEvent.change(cogsInput, { target: { value: '-100' } });

    await waitFor(() => {
      expect(screen.getByText(/must be positive/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(<PriceCalculatorForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText(/target margin/i), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText(/cogs/i), { target: { value: '1500' } });
    fireEvent.change(screen.getByLabelText(/logistics forward/i), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText(/logistics reverse/i), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText(/buyback/i), { target: { value: '98' } });
    fireEvent.change(screen.getByLabelText(/advertising/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/storage/i), { target: { value: '50' } });

    fireEvent.click(screen.getByRole('button', { name: /calculate/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          target_margin_pct: 20,
          cogs_rub: 1500,
        })
      );
    });
  });

  it('syncs slider with number input for margin', async () => {
    render(<PriceCalculatorForm onSubmit={mockOnSubmit} />);

    const slider = screen.getByRole('slider', { name: /target margin/i });
    const input = screen.getByLabelText(/target margin/i);

    fireEvent.change(input, { target: { value: '35' } });

    await waitFor(() => {
      expect(slider).toHaveValue('35');
    });
  });
});
```

### Integration Test Example

```typescript
// src/components/custom/price-calculator/__tests__/PriceCalculator.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PriceCalculatorPage } from '@/app/(dashboard)/tools/price-calculator/page';
import { mockPriceCalculatorResponse } from '@/test/mocks/api';

// Mock API
jest.mock('@/api/price-calculator', () => ({
  calculatePrice: jest.fn(),
}));

describe('Price Calculator Integration', () => {
  it('calculates price from form input to results display', async () => {
    const { calculatePrice } = require('@/api/price-calculator');
    calculatePrice.mockResolvedValue(mockPriceCalculatorResponse);

    render(<PriceCalculatorPage />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/cogs/i), { target: { value: '1500' } });
    // ... other fields

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /calculate/i }));

    // Verify results
    await waitFor(() => {
      expect(screen.getByText('4 057,87 ₽')).toBeInTheDocument();
      expect(screen.getByText(/20,0%/)).toBeInTheDocument();
    });
  });
});
```

### E2E Test Example (Playwright)

```typescript
// e2e/price-calculator.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Price Calculator E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/price-calculator');
    // Assume user is already logged in
  });

  test('calculates price and shows results', async ({ page }) => {
    // Fill in the form
    await page.fill('[name="target_margin_pct"]', '20');
    await page.fill('[name="cogs_rub"]', '1500');
    await page.fill('[name="logistics_forward_rub"]', '200');
    await page.fill('[name="logistics_reverse_rub"]', '150');
    await page.fill('[name="buyback_pct"]', '98');
    await page.fill('[name="advertising_pct"]', '5');
    await page.fill('[name="storage_rub"]', '50');

    // Click calculate
    await page.click('button:has-text("Calculate")');

    // Wait for results
    await expect(page.locator('text=/4 057/')).toBeVisible();
    await expect(page.locator('text=/811,57/')).toBeVisible();
    await expect(page.locator('text=/20,0%/')).toBeVisible();
  });

  test('shows error on invalid input', async ({ page }) => {
    await page.fill('[name="cogs_rub"]', '-100');

    const error = page.locator('text=/must be positive/i');
    await expect(error).toBeVisible();
  });
});
```

### Documentation Updates

#### User Guide: `docs/user-guide/price-calculator.md`

```markdown
# Price Calculator User Guide

## Overview
The Price Calculator helps you determine the optimal selling price for your Wildberries products based on your target profit margin.

## How to Use

1. Navigate to **Tools > Price Calculator**
2. Enter your costs:
   - **COGS**: What you paid to produce/acquire the product
   - **Logistics**: Shipping costs to/from WB warehouse
   - **Buyback %**: What percentage of products sell (not returned)
   - **Advertising**: Planned ad spend as % of price
   - **Storage**: Warehousing cost (may be 0)
3. Set your **Target Margin %**
4. Click **Calculate** or wait for auto-calculation
5. Review the recommended price and cost breakdown

## Understanding the Results

- **Recommended Price**: The price you should set to achieve your target margin
- **Margin**: Your profit in both ₽ and %
- **Cost Breakdown**: See exactly where each ruble goes
```

### Accessibility Checklist

| Check | Tool | Status |
|-------|------|--------|
| axe-core scan | DevTools/CLI | ⏳ |
| Keyboard navigation | Manual | ⏳ |
| Screen reader (NVDA/VoiceOver) | Manual | ⏳ |
| Color contrast | Wave/axe | ⏳ |
| Touch targets | Manual | ⏳ |

---

## Observability

- **Coverage**: Report test coverage percentage
- **CI**: Ensure tests pass in pipeline

---

## Dev Agent Record

### File List
| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/custom/price-calculator/__tests__/*.test.tsx` | CREATE | Component tests |
| `src/hooks/__tests__/usePriceCalculator.test.ts` | CREATE | Hook tests |
| `src/api/__tests__/price-calculator.test.ts` | CREATE | API client tests |
| `e2e/price-calculator.spec.ts` | CREATE | E2E tests |
| `docs/user-guide/price-calculator.md` | CREATE | User documentation |
| `docs/CHANGELOG.md` | UPDATE | Epic 44 entry |

### Change Log
1. Created comprehensive test suite
2. Wrote user documentation
3. Completed accessibility audit
4. Updated CHANGELOG

---

## QA Results

**Reviewer**: TBD
**Date**: TBD
**Gate Decision**: ⏳ PENDING

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Unit tests | ⏳ |  |
| AC2 | Integration tests | ⏳ |  |
| AC3 | E2E tests | ⏳ |  |
| AC4 | Documentation | ⏳ |  |
| AC5 | Accessibility audit | ⏳ |  |

### Test Coverage Report
| Component | Lines % | Branches % | Functions % |
|-----------|---------|------------|-------------|
| PriceCalculatorForm | ⏳ | ⏳ | ⏳ |
| PriceCalculatorResults | ⏳ | ⏳ | ⏳ |
| usePriceCalculator | ⏳ | ⏳ | ⏳ |
| calculatePrice | ⏳ | ⏳ | ⏳ |
| **Total** | ⏳ | ⏳ | ⏳ |

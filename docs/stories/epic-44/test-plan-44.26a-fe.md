# Test Plan: Story 44.26a-FE - Product Search & Delivery Date Selection

## Overview

| Attribute | Value |
|-----------|-------|
| **Story** | 44.26a-FE |
| **Title** | Product Search & Delivery Date Selection |
| **Type** | Feature Development |
| **Priority** | P0 - CRITICAL |
| **Effort** | 5 SP |
| **QA Owner** | TBD |
| **Created** | 2026-01-21 |
| **Depends On** | Story 44.7 (Dimensions), Story 44.12 (Warehouse), Story 44.13 (Coefficients) |

## Test Scope

This test plan covers:
- ProductSearchSelect component (searchable dropdown)
- DeliveryDatePicker component (date selection with coefficient display)
- CoefficientCalendar enhancement (click-to-select dates)
- Form state management for product selection and delivery date
- Integration with PriceCalculatorForm

### Out of Scope
- Auto-fill dimensions (Story 44.26b-FE)
- Auto-fill category (Story 44.26b-FE)
- AutoFillBadge component (Story 44.26b-FE)

---

## Test Environment

| Environment | Configuration |
|-------------|---------------|
| **Development** | `npm run dev` on localhost:3000 |
| **Test** | Vitest + Testing Library + MSW |
| **E2E** | Playwright on localhost:3100 |
| **API Mock** | MSW handlers for `/v1/products` |

## Test Data Requirements

### Product Data (from Backend Epic 45)

```typescript
// CRITICAL: nm_id is STRING, not number!
interface MockProduct {
  nm_id: string           // "147205694"
  sa_name: string         // Product name (NOT "title")
  vendor_code: string
  brand?: string
  photo_url?: string
  dimensions?: ProductDimensions | null
  category_hierarchy?: CategoryHierarchy | null
}
```

### Coefficient Data

```typescript
interface MockCoefficient {
  date: string            // ISO date "2026-01-22"
  coefficient: number     // 100 (base), 125, 150, 200, -1 (unavailable)
  warehouse_id: string
}
```

---

## Unit Tests

### Component: ProductSearchSelect

| Test ID | Description | Expected Result | Priority |
|---------|-------------|-----------------|----------|
| PSS-001 | Renders search input with placeholder | Input visible with "Поиск по SKU, артикулу или названию..." | High |
| PSS-002 | Shows "(опционально)" hint | Optional hint displayed | Medium |
| PSS-003 | Debounces search input (300ms) | API not called until 300ms after typing stops | High |
| PSS-004 | Does not trigger API for <2 chars | No API call for single character | High |
| PSS-005 | Shows loading skeleton during search | Skeleton visible while loading | Medium |
| PSS-006 | Displays product list with correct fields | Shows thumbnail, nmId, vendor_code, sa_name, brand | High |
| PSS-007 | Shows "Товары не найдены" for empty results | Empty state message displayed | High |
| PSS-008 | Calls onProductSelect on item click | Callback invoked with product data | High |
| PSS-009 | Shows selected product card | Card displays product info after selection | High |
| PSS-010 | "Очистить" button clears selection | Selection reset to null on click | High |
| PSS-011 | Shows error state on API failure | Error message with retry button | Medium |
| PSS-012 | Keyboard navigation works (ArrowDown/Up) | Can navigate dropdown with arrows | High |
| PSS-013 | Enter selects highlighted item | Product selected on Enter key | High |
| PSS-014 | Escape closes dropdown | Dropdown closes on Escape | Medium |
| PSS-015 | Shows placeholder icon for missing photo | Default icon when photo_url is null | Low |
| PSS-016 | Truncates long product names | Ellipsis for names >50 chars | Low |

### Component: DeliveryDatePicker

| Test ID | Description | Expected Result | Priority |
|---------|-------------|-----------------|----------|
| DDP-001 | Renders date input with label | "Дата сдачи товара" label visible | High |
| DDP-002 | Defaults to tomorrow's date | Tomorrow selected by default | High |
| DDP-003 | Shows coefficient next to date | "Коэффициент: ×1.25" displayed | High |
| DDP-004 | Formats date in Russian locale | "21 января 2026" format | High |
| DDP-005 | Disables unavailable dates (coefficient=-1) | Dates with -1 not selectable | High |
| DDP-006 | Updates coefficient on date change | New coefficient shown after selection | High |
| DDP-007 | Shows "Нет доступных дат" when all unavailable | Error message displayed | High |
| DDP-008 | Calls onDateSelect with date and coefficient | Callback invoked with both values | High |

### Component: CoefficientCalendar (Enhancement)

| Test ID | Description | Expected Result | Priority |
|---------|-------------|-----------------|----------|
| CC-001 | Renders 14-day calendar grid | Two weeks of dates displayed | High |
| CC-002 | Shows correct color coding | Green/Yellow/Orange/Red/Gray zones | High |
| CC-003 | Green for coefficient ≤100 | Base rate shows green | High |
| CC-004 | Yellow for 100 < coefficient ≤150 | Elevated shows yellow | High |
| CC-005 | Orange for 150 < coefficient ≤200 | High shows orange | High |
| CC-006 | Red for coefficient >200 | Peak shows red | High |
| CC-007 | Gray for coefficient=-1 | Unavailable shows gray | High |
| CC-008 | Click selects date and calls callback | onDateSelect called with date, coefficient | High |
| CC-009 | Gray dates are not clickable | No selection on unavailable dates | High |
| CC-010 | Highlights selected date | Selected date has distinct styling | High |
| CC-011 | Shows tooltip on hover | Date and coefficient in tooltip | Medium |
| CC-012 | Legend displays all zone labels | Base/Elevated/High/Peak visible | Medium |
| CC-013 | Keyboard navigation with arrows | Can navigate calendar with keyboard | High |
| CC-014 | Enter/Space selects date | Keyboard selection works | High |

### Hook: useProductSearch

| Test ID | Description | Expected Result | Priority |
|---------|-------------|-----------------|----------|
| UPS-001 | Returns loading state initially | isLoading=true before data | High |
| UPS-002 | Returns products on success | data.products contains results | High |
| UPS-003 | Returns error on API failure | error object populated | High |
| UPS-004 | Respects enabled condition (>=2 chars) | No query for short search | High |
| UPS-005 | Uses correct query parameters | `q=search`, `limit=50` in URL | High |
| UPS-006 | Has 60s stale time | Cache used within 60s | Medium |

---

## Integration Tests

### Form Integration

| Test ID | Description | Components | Expected Result |
|---------|-------------|------------|-----------------|
| INT-001 | Product selection updates form state | ProductSearchSelect → Form | `selected_product_nm_id` set in state |
| INT-002 | Product selection stores nm_id as STRING | ProductSearchSelect → Form | typeof nm_id === 'string' |
| INT-003 | Product selection stores sa_name | ProductSearchSelect → Form | `selected_product_name` from sa_name |
| INT-004 | Clear product resets form state | ProductSearchSelect → Form | Both fields reset to null |
| INT-005 | Delivery date updates form state | DatePicker → Form | `delivery_date` and `delivery_coefficient` set |
| INT-006 | Warehouse change resets date | WarehouseSection → DatePicker | Date reset to first available |
| INT-007 | Warehouse change reloads coefficients | WarehouseSection → Calendar | New coefficients loaded |
| INT-008 | Form reset clears product and date | Form → All | All selection state cleared |
| INT-009 | Form works without product selection | Form | Manual mode functional |
| INT-010 | Product emits onProductSelect callback | ProductSearchSelect → Parent | Full product data passed |

### Calendar Integration

| Test ID | Description | Components | Expected Result |
|---------|-------------|------------|-----------------|
| CAL-001 | Calendar click updates date picker | Calendar → DatePicker | Date synced between components |
| CAL-002 | Date picker change syncs with calendar | DatePicker → Calendar | Selection highlight moves |
| CAL-003 | Coefficient synced between components | Calendar ↔ DatePicker | Same coefficient shown |

---

## E2E Tests

### User Flow: Product Search and Selection

| Test ID | User Flow | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-001 | Search product by SKU | 1. Navigate to price calculator<br>2. Type SKU in search<br>3. Wait for results | Product dropdown appears |
| E2E-002 | Search product by name | 1. Type partial product name<br>2. Wait for results | Matching products shown |
| E2E-003 | Select product from dropdown | 1. Search for product<br>2. Click on result | Product card displayed |
| E2E-004 | Clear product selection | 1. Select a product<br>2. Click "Очистить" | Selection cleared, search input returns |
| E2E-005 | Empty search results | 1. Search for non-existent product | "Товары не найдены" message |
| E2E-006 | Search API error | 1. Simulate API failure<br>2. Trigger search | Error message with retry button |
| E2E-007 | Keyboard navigation | 1. Type search<br>2. Use arrow keys<br>3. Press Enter | Product selected via keyboard |

### User Flow: Delivery Date Selection

| Test ID | User Flow | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-008 | Default date is tomorrow | 1. Load page with warehouse selected | Tomorrow's date shown |
| E2E-009 | Select date from calendar | 1. Click on available date in calendar | Date and coefficient update |
| E2E-010 | Cannot select unavailable date | 1. Click on gray (unavailable) date | No selection change |
| E2E-011 | Change warehouse resets date | 1. Select warehouse<br>2. Select date<br>3. Change warehouse | Date resets to first available |
| E2E-012 | Coefficient displayed correctly | 1. Select date with known coefficient | Coefficient matches expected |
| E2E-013 | Date picker manual entry | 1. Enter date in picker input | Calendar syncs, coefficient updates |

### User Flow: Complete Integration

| Test ID | User Flow | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-014 | Full flow without product | 1. Select warehouse<br>2. Select date<br>3. Enter dimensions manually<br>4. Calculate | Price calculated successfully |
| E2E-015 | Form reset behavior | 1. Select product<br>2. Select date<br>3. Reset form | All selections cleared |
| E2E-016 | Persist through re-render | 1. Select product<br>2. Navigate away and back | Selection preserved |

---

## Edge Cases

| Test ID | Scenario | Expected Behavior |
|---------|----------|-------------------|
| EDGE-001 | Search with exactly 2 characters | API call triggered |
| EDGE-002 | Search with 1 character | No API call |
| EDGE-003 | Product with no photo | Placeholder icon displayed |
| EDGE-004 | Product with very long name (100+ chars) | Truncated with ellipsis |
| EDGE-005 | All dates unavailable for warehouse | Error message shown |
| EDGE-006 | Product search while already selected | Dropdown replaces selection |
| EDGE-007 | Rapid typing (debounce) | Only final search executed |
| EDGE-008 | Date in past | Not shown in calendar |
| EDGE-009 | Product search API timeout | Loading state, then error |
| EDGE-010 | Coefficient exactly at boundary (100, 150, 200) | Correct color zone applied |

---

## Accessibility Tests (WCAG 2.1 AA)

| Test ID | Check | Expected Result | Priority |
|---------|-------|-----------------|----------|
| A11Y-001 | Search input has label | aria-label or visible label | High |
| A11Y-002 | Dropdown announced to screen reader | role="listbox" with aria attributes | High |
| A11Y-003 | Product items have accessible names | aria-label with product info | High |
| A11Y-004 | Calendar cells have aria-label | Full date and coefficient announced | High |
| A11Y-005 | Selected state announced | aria-selected or aria-pressed | High |
| A11Y-006 | Unavailable dates announced | aria-disabled on gray dates | High |
| A11Y-007 | Focus visible on all interactive | Focus ring visible | High |
| A11Y-008 | Keyboard navigation complete | Tab/Arrow/Enter/Escape work | High |
| A11Y-009 | Color not only indicator | Text labels accompany colors | High |
| A11Y-010 | Focus trap in dropdown | Focus contained while open | Medium |

---

## Performance Tests

| Test ID | Metric | Threshold | Priority |
|---------|--------|-----------|----------|
| PERF-001 | Product search response | <500ms cached, <1s uncached | High |
| PERF-002 | Dropdown render time | <100ms for 50 products | High |
| PERF-003 | Date selection response | <50ms UI update | High |
| PERF-004 | Calendar render time | <50ms for 14 days | Medium |
| PERF-005 | Debounce effectiveness | No redundant API calls | High |

---

## Test Automation Files

### Unit Tests Location
```
src/components/custom/price-calculator/__tests__/
├── ProductSearchSelect.test.tsx
├── DeliveryDatePicker.test.tsx
└── CoefficientCalendar.test.tsx

src/hooks/__tests__/
└── useProductSearch.test.ts
```

### E2E Tests Location
```
e2e/price-calculator-product-search.spec.ts
```

### Fixtures Location
```
src/test/fixtures/products-dimensions.ts
```

---

## MSW Handlers Required

```typescript
// src/mocks/handlers/products-dimensions.ts
rest.get('/v1/products', (req, res, ctx) => {
  const q = req.url.searchParams.get('q')
  const includeDimensions = req.url.searchParams.get('include_dimensions')

  if (includeDimensions === 'true') {
    return res(ctx.json({
      products: mockProductsWithDimensions.filter(p =>
        p.sa_name.includes(q) || p.vendor_code.includes(q)
      ),
      pagination: { next_cursor: null, has_more: false, count: X, total: X }
    }))
  }
})
```

---

## Pre-conditions

1. User is authenticated
2. Cabinet has WB API token configured
3. At least one warehouse available
4. Acceptance coefficients API working
5. Products exist in cabinet (for search tests)

---

## Definition of Done Checklist

- [ ] All unit tests passing (PSS-001 to PSS-016)
- [ ] All hook tests passing (UPS-001 to UPS-006)
- [ ] DeliveryDatePicker tests passing (DDP-001 to DDP-008)
- [ ] CoefficientCalendar tests passing (CC-001 to CC-014)
- [ ] Integration tests passing (INT-001 to INT-010)
- [ ] E2E tests passing (E2E-001 to E2E-016)
- [ ] Edge cases handled (EDGE-001 to EDGE-010)
- [ ] Accessibility tests passing (A11Y-001 to A11Y-010)
- [ ] Performance thresholds met (PERF-001 to PERF-005)
- [ ] Test coverage >80% for new components
- [ ] No ESLint errors in test files

---

## Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| QA Engineer | | | Pending |
| Developer | | | Pending |
| Product Owner | | | Pending |

---

**Last Updated**: 2026-01-21

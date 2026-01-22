# Test Plan: Story 44.26b-FE - Auto-fill Dimensions & Category from Product

## Overview

| Attribute | Value |
|-----------|-------|
| **Story** | 44.26b-FE |
| **Title** | Auto-fill Dimensions & Category from Product |
| **Type** | Feature Development |
| **Priority** | P0 - CRITICAL |
| **Effort** | 5 SP |
| **QA Owner** | TBD |
| **Created** | 2026-01-21 |
| **Depends On** | Story 44.26a-FE (Product Search & Date Picker) |
| **Backend** | Request #99 ✅ IMPLEMENTED (Epic 45) |

## Test Scope

This test plan covers:
- Auto-fill dimensions from product (mm → cm conversion)
- Auto-fill category from product (with commission lookup)
- AutoFillBadge component ("Автозаполнено", "Изменено")
- Restore functionality for edited auto-filled values
- Category lock/unlock logic based on selection mode
- Product dimensions display in search dropdown

### Prerequisites from 44.26a
- ProductSearchSelect component (completed)
- Product selection state management (completed)
- Form integration for product selection (completed)

---

## Test Environment

| Environment | Configuration |
|-------------|---------------|
| **Development** | `npm run dev` on localhost:3000 |
| **Test** | Vitest + Testing Library + MSW |
| **E2E** | Playwright on localhost:3100 |
| **API Mock** | MSW handlers for `/v1/products?include_dimensions=true` |

## Test Data Requirements

### Backend API Response Format (Epic 45)

```typescript
// CRITICAL: Actual field names and types from Epic 45 Backend!
interface ProductWithDimensions {
  nm_id: string                    // STRING, not number!
  sa_name: string                  // NOT "title"!
  vendor_code: string
  brand?: string
  photo_url?: string
  dimensions?: {
    length_mm: number              // mm, needs /10 for cm
    width_mm: number
    height_mm: number
    volume_liters: number          // Pre-calculated by backend!
  } | null
  category_hierarchy?: {           // NOT "category"!
    subject_id: number
    subject_name: string
    parent_id: number | null       // null for top-level
    parent_name: string | null
  } | null
}
```

### Test Scenarios

| Scenario | Product Data |
|----------|--------------|
| Full data | dimensions + category_hierarchy present |
| No dimensions | dimensions: null |
| No category | category_hierarchy: null |
| Partial dimensions | Some dimension fields |
| Top-level category | parent_id: null, parent_name: null |
| Zero dimensions | length_mm: 0, width_mm: 0, height_mm: 0 |

---

## Unit Tests

### Component: AutoFillBadge

| Test ID | Description | Expected Result | Priority |
|---------|-------------|-----------------|----------|
| AFB-001 | Renders "Автозаполнено" for status='auto' | Green badge with text | High |
| AFB-002 | Renders "Изменено" for status='modified' | Yellow badge with text | High |
| AFB-003 | Renders nothing for status='none' | No output | High |
| AFB-004 | Shows restore button when modified | "Восстановить" button visible | High |
| AFB-005 | Calls onRestore on button click | Callback invoked | High |
| AFB-006 | Badge has correct accessibility | aria-label present | Medium |
| AFB-007 | Smooth transition between states | CSS transition applied | Low |
| AFB-008 | Custom className applied | className prop merged | Low |

### Auto-fill Dimensions Logic

| Test ID | Description | Expected Result | Priority |
|---------|-------------|-----------------|----------|
| AFD-001 | Converts length_mm to cm | 400mm → 40cm | High |
| AFD-002 | Converts width_mm to cm | 300mm → 30cm | High |
| AFD-003 | Converts height_mm to cm | 50mm → 5cm | High |
| AFD-004 | Uses backend volume_liters directly | volume_liters not recalculated | High |
| AFD-005 | Sets dimension fields in form | setValue called for all 4 fields | High |
| AFD-006 | Sets autoFill state to 'auto' | dimensionsAutoFill.status === 'auto' | High |
| AFD-007 | Stores original values | originalValues populated correctly | High |
| AFD-008 | Handles null dimensions | No auto-fill, warning shown | High |
| AFD-009 | Handles zero dimensions | 0mm → 0cm, valid auto-fill | Medium |
| AFD-010 | Decimal precision preserved | 405mm → 40.5cm | Medium |

### Auto-fill Category Logic

| Test ID | Description | Expected Result | Priority |
|---------|-------------|-----------------|----------|
| AFC-001 | Maps subject_id to selectedCategory | subjectID set correctly | High |
| AFC-002 | Maps subject_name to selectedCategory | subjectName set correctly | High |
| AFC-003 | Maps parent_id to selectedCategory | parentID set (or null) | High |
| AFC-004 | Maps parent_name to selectedCategory | parentName set (or null) | High |
| AFC-005 | Locks CategorySelector | isLocked === true after auto-fill | High |
| AFC-006 | Sets autoFill state to 'auto' | categoryAutoFill.source === 'auto' | High |
| AFC-007 | Triggers commission lookup | useCommissions hook called | High |
| AFC-008 | Handles null category_hierarchy | No auto-fill, CategorySelector unlocked | High |
| AFC-009 | Handles null parent_id (top-level) | Only subject displayed, no error | Medium |
| AFC-010 | Shows commission percentage | Commission % displayed after lookup | Medium |

### Dimension Edit Detection

| Test ID | Description | Expected Result | Priority |
|---------|-------------|-----------------|----------|
| DED-001 | Edit length changes status to 'modified' | status === 'modified' | High |
| DED-002 | Edit width changes status to 'modified' | status === 'modified' | High |
| DED-003 | Edit height changes status to 'modified' | status === 'modified' | High |
| DED-004 | Manual mode edit doesn't show modified | status remains 'none' | High |
| DED-005 | Same value edit doesn't trigger change | status unchanged | Low |

### Restore Functionality

| Test ID | Description | Expected Result | Priority |
|---------|-------------|-----------------|----------|
| RST-001 | Restore resets length to original | Original value restored | High |
| RST-002 | Restore resets width to original | Original value restored | High |
| RST-003 | Restore resets height to original | Original value restored | High |
| RST-004 | Restore resets volume to original | Backend volume restored | High |
| RST-005 | Restore changes status to 'auto' | status === 'auto' after restore | High |
| RST-006 | Restore with null originalValues | No action (guard check) | Medium |

### Product Clear Logic

| Test ID | Description | Expected Result | Priority |
|---------|-------------|-----------------|----------|
| PCL-001 | Clear resets dimensionsAutoFill | source='manual', status='none' | High |
| PCL-002 | Clear resets categoryAutoFill | source='manual', isLocked=false | High |
| PCL-003 | Clear unlocks CategorySelector | CategorySelector interactive | High |
| PCL-004 | Clear clears dimension fields | All 4 fields reset | High |
| PCL-005 | Clear clears selectedCategory | Category selection reset | High |

### Product Selection with Auto-fill (handleProductSelect)

| Test ID | Description | Expected Result | Priority |
|---------|-------------|-----------------|----------|
| HPS-001 | Product with all data auto-fills both | Dimensions + category filled | High |
| HPS-002 | Product without dimensions shows warning | Warning message displayed | High |
| HPS-003 | Product without category shows warning | Warning message displayed | High |
| HPS-004 | New product replaces previous auto-fill | Old values replaced | High |
| HPS-005 | Null product clears auto-fill | All state reset | High |

---

## Integration Tests

### Dimensions Section Integration

| Test ID | Description | Components | Expected Result |
|---------|-------------|------------|-----------------|
| DIM-INT-001 | Auto-fill populates dimension inputs | ProductSearch → DimensionsSection | All 4 inputs filled |
| DIM-INT-002 | AutoFillBadge appears on auto-fill | DimensionsSection | "Автозаполнено" visible |
| DIM-INT-003 | Badge changes on edit | DimensionsSection + Input | "Изменено" visible |
| DIM-INT-004 | Restore button restores values | DimensionsSection | Original values in inputs |
| DIM-INT-005 | Volume recalculates on edit | DimensionsSection | New volume displayed |
| DIM-INT-006 | Volume restores to backend value | DimensionsSection | Original backend volume |

### Category Section Integration

| Test ID | Description | Components | Expected Result |
|---------|-------------|------------|-----------------|
| CAT-INT-001 | Auto-fill populates CategorySelector | ProductSearch → CategorySection | Category selected |
| CAT-INT-002 | Lock icon displayed | CategorySection | 🔒 visible next to selector |
| CAT-INT-003 | CategorySelector disabled | CategorySection | Cannot change category |
| CAT-INT-004 | Commission shown | CategorySection | X% commission displayed |
| CAT-INT-005 | Clear product unlocks selector | ProductSearch → CategorySection | CategorySelector enabled |
| CAT-INT-006 | AutoFillBadge on category | CategorySection | "Автозаполнено" visible |

### Product Search Dropdown Enhancement

| Test ID | Description | Components | Expected Result |
|---------|-------------|------------|-----------------|
| PSD-INT-001 | Dimensions shown in dropdown | ProductSearchSelect | "📐 40×30×5 см (6.0 л)" |
| PSD-INT-002 | Category shown in dropdown | ProductSearchSelect | "Женская одежда → Платья" |
| PSD-INT-003 | Missing dimensions shows message | ProductSearchSelect | "Габариты не указаны" |
| PSD-INT-004 | Missing category shows message | ProductSearchSelect | "Категория не указана" |
| PSD-INT-005 | Top-level category (no parent) | ProductSearchSelect | Only subject_name shown |

### Warning State Integration

| Test ID | Description | Components | Expected Result |
|---------|-------------|------------|-----------------|
| WARN-INT-001 | Dimension warning dismissible | DimensionsSection | Warning closeable |
| WARN-INT-002 | Category warning dismissible | CategorySection | Warning closeable |
| WARN-INT-003 | Warning clears on valid product | All | Warning removed |

### Form State Integration

| Test ID | Description | Components | Expected Result |
|---------|-------------|------------|-----------------|
| FORM-INT-001 | Auto-filled dimensions in form state | Form | All values in form.getValues() |
| FORM-INT-002 | Auto-filled category in form state | Form | Category in form state |
| FORM-INT-003 | Form submission includes auto-fill | Form | Values sent to API |
| FORM-INT-004 | Form reset clears auto-fill | Form | All auto-fill state reset |

---

## E2E Tests

### User Flow: Auto-fill Complete Product

| Test ID | User Flow | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-AF-001 | Select product with full data | 1. Search product<br>2. Click product | Dimensions + Category auto-filled |
| E2E-AF-002 | Verify dimensions populated | After E2E-AF-001 | All 4 dimension fields have values |
| E2E-AF-003 | Verify category locked | After E2E-AF-001 | CategorySelector shows lock icon |
| E2E-AF-004 | Verify badges displayed | After E2E-AF-001 | "Автозаполнено" on both sections |
| E2E-AF-005 | Verify commission shown | After E2E-AF-001 | Commission percentage displayed |

### User Flow: Edit Auto-filled Dimensions

| Test ID | User Flow | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-ED-001 | Edit dimension field | 1. Select product<br>2. Change length | Badge changes to "Изменено" |
| E2E-ED-002 | Restore button appears | After E2E-ED-001 | "Восстановить" button visible |
| E2E-ED-003 | Click restore | 1. After E2E-ED-002<br>2. Click restore | Original values restored, badge "Автозаполнено" |
| E2E-ED-004 | Volume updates on edit | 1. Edit dimension | Volume recalculated |
| E2E-ED-005 | Volume restores correctly | After E2E-ED-003 | Original backend volume |

### User Flow: Product Without Dimensions

| Test ID | User Flow | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-ND-001 | Select product without dimensions | 1. Search<br>2. Select product with null dimensions | Warning shown |
| E2E-ND-002 | Dimensions in manual mode | After E2E-ND-001 | Inputs empty, editable |
| E2E-ND-003 | No AutoFillBadge | After E2E-ND-001 | No badge on dimensions section |
| E2E-ND-004 | Warning dismissible | After E2E-ND-001<br>Click X | Warning closes |

### User Flow: Product Without Category

| Test ID | User Flow | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-NC-001 | Select product without category | 1. Search<br>2. Select product with null category | Warning shown |
| E2E-NC-002 | CategorySelector unlocked | After E2E-NC-001 | User can select category |
| E2E-NC-003 | No lock icon | After E2E-NC-001 | No 🔒 displayed |

### User Flow: Clear Product

| Test ID | User Flow | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-CLR-001 | Clear selected product | 1. Select product<br>2. Click "Очистить" | Auto-fill cleared |
| E2E-CLR-002 | Dimensions cleared | After E2E-CLR-001 | Fields empty or default |
| E2E-CLR-003 | Category unlocked | After E2E-CLR-001 | CategorySelector enabled |
| E2E-CLR-004 | Badges removed | After E2E-CLR-001 | No AutoFillBadges visible |

### User Flow: Change Product

| Test ID | User Flow | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| E2E-CHG-001 | Select different product | 1. Select product A<br>2. Select product B | Product B data replaces A |
| E2E-CHG-002 | Dimensions updated | After E2E-CHG-001 | New product dimensions shown |
| E2E-CHG-003 | Category updated | After E2E-CHG-001 | New product category shown |
| E2E-CHG-004 | Restore values updated | After E2E-CHG-001<br>Edit, Restore | Product B original restored |

---

## Edge Cases

| Test ID | Scenario | Expected Behavior |
|---------|----------|-------------------|
| EDGE-B-001 | Product with 0×0×0 dimensions | Auto-fill with zeros, valid |
| EDGE-B-002 | Product with very large dimensions (5000mm) | 500cm displayed correctly |
| EDGE-B-003 | Product with decimal dimensions | 405mm → 40.5cm |
| EDGE-B-004 | Top-level category (parent_id: null) | Display only subject_name |
| EDGE-B-005 | Commission lookup fails | Show "N/A" for commission |
| EDGE-B-006 | Rapid product change | No race conditions |
| EDGE-B-007 | Edit then restore then edit again | Status toggles correctly |
| EDGE-B-008 | Multiple dimension edits before restore | Single restore resets all |
| EDGE-B-009 | nm_id type verification | String type maintained throughout |
| EDGE-B-010 | Cache miss (skip_cache=true) | Loading state, then data |

---

## Accessibility Tests (WCAG 2.1 AA)

| Test ID | Check | Expected Result | Priority |
|---------|-------|-----------------|----------|
| A11Y-B-001 | AutoFillBadge announced | aria-live region for status change | High |
| A11Y-B-002 | Restore button accessible | aria-label describes action | High |
| A11Y-B-003 | Lock icon explained | aria-label on lock icon | High |
| A11Y-B-004 | Warning alerts announced | role="alert" on warnings | High |
| A11Y-B-005 | Color not only indicator | Text + icon, not just color | High |
| A11Y-B-006 | Focus visible on restore button | Focus ring visible | High |
| A11Y-B-007 | Screen reader for dimension in dropdown | Dimensions announced | Medium |
| A11Y-B-008 | Locked CategorySelector announced | aria-disabled on selector | Medium |

---

## Performance Tests

| Test ID | Metric | Threshold | Priority |
|---------|--------|-----------|----------|
| PERF-B-001 | Auto-fill execution time | <50ms | High |
| PERF-B-002 | Restore execution time | <50ms | High |
| PERF-B-003 | Commission lookup | <200ms cached | Medium |
| PERF-B-004 | Product dropdown with dimensions | <100ms render | Medium |
| PERF-B-005 | No unnecessary re-renders | Max 2 re-renders on select | Medium |

---

## Test Automation Files

### Unit Tests Location
```
src/components/custom/price-calculator/__tests__/
├── AutoFillBadge.test.tsx
├── auto-fill.test.ts                    # Main auto-fill logic tests
├── DimensionsSectionAutoFill.test.tsx
└── CategorySectionAutoFill.test.tsx
```

### E2E Tests Location
```
e2e/price-calculator-auto-fill.spec.ts
```

### Fixtures Location
```
src/test/fixtures/products-dimensions.ts
```

---

## MSW Handler Updates

```typescript
// src/mocks/handlers/products-dimensions.ts
rest.get('/v1/products', (req, res, ctx) => {
  const includeDimensions = req.url.searchParams.get('include_dimensions')

  if (includeDimensions === 'true') {
    return res(ctx.json({
      products: [
        {
          nm_id: '147205694',
          sa_name: 'Платье летнее',
          vendor_code: 'DRESS-001',
          brand: 'Artisan',
          dimensions: {
            length_mm: 400,
            width_mm: 300,
            height_mm: 50,
            volume_liters: 6.0
          },
          category_hierarchy: {
            subject_id: 105,
            subject_name: 'Платья',
            parent_id: 8,
            parent_name: 'Женская одежда'
          }
        },
        // Product without dimensions
        {
          nm_id: '147205695',
          sa_name: 'Товар без габаритов',
          vendor_code: 'NO-DIM-001',
          dimensions: null,
          category_hierarchy: { subject_id: 100, subject_name: 'Другое', parent_id: null, parent_name: null }
        },
        // Product without category
        {
          nm_id: '147205696',
          sa_name: 'Товар без категории',
          vendor_code: 'NO-CAT-001',
          dimensions: { length_mm: 100, width_mm: 100, height_mm: 100, volume_liters: 1.0 },
          category_hierarchy: null
        }
      ],
      pagination: { next_cursor: null, has_more: false, count: 3, total: 3 }
    }))
  }
})
```

---

## Pre-conditions

1. Story 44.26a-FE completed (Product Search)
2. User is authenticated with cabinet
3. Products with dimensions exist (from WB sync)
4. Commission data available for categories
5. Backend Epic 45 API available (or mocked)

---

## Definition of Done Checklist

- [ ] All AutoFillBadge unit tests passing (AFB-001 to AFB-008)
- [ ] All dimension auto-fill tests passing (AFD-001 to AFD-010)
- [ ] All category auto-fill tests passing (AFC-001 to AFC-010)
- [ ] All edit detection tests passing (DED-001 to DED-005)
- [ ] All restore tests passing (RST-001 to RST-006)
- [ ] All clear tests passing (PCL-001 to PCL-005)
- [ ] All integration tests passing (DIM-INT, CAT-INT, PSD-INT, WARN-INT, FORM-INT)
- [ ] All E2E tests passing (E2E-AF, E2E-ED, E2E-ND, E2E-NC, E2E-CLR, E2E-CHG)
- [ ] Edge cases handled (EDGE-B-001 to EDGE-B-010)
- [ ] Accessibility tests passing (A11Y-B-001 to A11Y-B-008)
- [ ] Performance thresholds met (PERF-B-001 to PERF-B-005)
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

# Story 44.26a-FE: Product Search & Delivery Date Selection

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 📋 Ready for Dev
**Priority**: P0 - CRITICAL (Next Major Feature)
**Effort**: 5 SP
**Parent Story**: 44.26-FE (split for independent delivery)
**Depends On**:
- Story 44.7 ✅ (Dimension Volume Calculation)
- Story 44.12 ✅ (Warehouse Selection)
- Story 44.13 ✅ (Auto-fill Coefficients)

---

## User Story

**As a** Seller,
**I want** to search and select a product from my catalog, and choose a delivery date with coefficient visualization,
**So that** I can prepare for automated logistics calculation with proper warehouse timing.

---

## Scope Clarification

**This story covers:**
- ProductSearchSelect component (searchable dropdown)
- DeliveryDatePicker component (date selection with coefficient)
- CoefficientCalendar enhancement (click-to-select dates)
- Form state management for product selection and delivery date
- Integration with existing PriceCalculatorForm

**This story does NOT cover:**
- Auto-fill dimensions from product (see Story 44.26b-FE)
- Auto-fill category from product (see Story 44.26b-FE)
- AutoFillBadge + Restore functionality (see Story 44.26b-FE)

---

## Acceptance Criteria

### AC1: Product Search Select Component
- [ ] Create ProductSearchSelect component with searchable dropdown
- [ ] Implement search by SKU, vendor code (артикул), and product title
- [ ] Debounce search input (300ms) to prevent API spam
- [ ] Show product list with thumbnail, nmId, vendor code, title, brand
- [ ] Show "(опционально)" hint indicating product selection is optional
- [ ] Show helper text "Или введите данные вручную ниже" when no product selected
- [ ] Implement "Очистить" (Clear) button when product is selected
- [ ] Handle empty search results with appropriate message
- [ ] Support keyboard navigation in dropdown

### AC2: Product Selection State
- [ ] Add `selected_product_nm_id: string | null` to form state (STRING from backend!)
- [ ] Add `selected_product_name: string` to form state for display (from `sa_name`)
- [ ] On product select: store product info in state (nmId as string, sa_name, brand)
- [ ] On clear: reset selection state to null
- [ ] Emit `onProductSelect` callback with full product data for parent use
- [ ] Persist selection through form re-renders

### AC3: Delivery Date Picker Component
- [ ] Create DeliveryDatePicker component with date input and coefficient display
- [ ] Default to tomorrow's date (or first available date)
- [ ] Show current coefficient next to date: "Коэффициент: ×1.25"
- [ ] Disable unavailable dates (coefficient = -1)
- [ ] Integrate with acceptance coefficients API (Story 44.13)
- [ ] Update coefficient display on date change
- [ ] Format date in Russian locale: "21 января 2026"

### AC4: Coefficient Calendar Enhancement
- [ ] Update existing CoefficientCalendar to support click-to-select
- [ ] Add `onDateSelect(date: string, coefficient: number)` callback
- [ ] Highlight currently selected date with distinct styling
- [ ] Maintain existing color coding:
  - Green: coefficient ≤ 100 (×1.0) - базовый
  - Yellow: 100 < coefficient ≤ 150 (×1.0-1.5) - повышенный
  - Orange: 150 < coefficient ≤ 200 (×1.5-2.0) - высокий
  - Red: coefficient > 200 (×2.0+) - пиковый
  - Gray: coefficient = -1 - недоступно
- [ ] Show tooltip on hover with date and exact coefficient
- [ ] Prevent selection of unavailable dates (gray)

### AC5: Form Integration
- [ ] Add ProductSearchSelect to form before dimensions section
- [ ] Add DeliveryDatePicker to WarehouseSection (after warehouse select)
- [ ] Connect delivery date to coefficient calculation
- [ ] On warehouse change: reset date to first available, reload coefficients
- [ ] On form reset: clear product selection and delivery date
- [ ] Ensure form remains functional without product selection (manual mode)

### AC6: Loading & Error States
- [ ] Show skeleton while loading product search results
- [ ] Show spinner while loading coefficients
- [ ] Show error message if product search fails (with retry)
- [ ] Show error message if no available dates: "Нет доступных дат для выбранного склада"
- [ ] Graceful degradation: form works even if product search API fails

---

## Backend API Reference

**Endpoint**: `GET /v1/products?include_dimensions=true`
**Test File**: `../test-api/45-products-dimensions.http`
**Documentation**: `../test-api/README.md` (Epic 45 section)
**Backend Epic**: Epic 45 - Products Dimensions & Category API

**Key Implementation Details**:
- `nm_id` is returned as **STRING** (not number)
- Product name field is `sa_name` (not `title`)
- Category field is `category_hierarchy` (not `category`)
- `volume_liters` is pre-calculated by backend
- Redis caching: 24h TTL, cache-first strategy
- Performance: <500ms for 100 products, <50ms cached

---

## Technical Requirements

### New Types

```typescript
// src/types/product.ts - Extend existing types

/** Product for Price Calculator selection (Epic 45 Backend) */
export interface ProductForSelection {
  nm_id: string           // STRING from backend (not number!)
  vendor_code: string
  sa_name: string         // Product name (WB uses sa_name, not title)
  brand?: string
  photo_url?: string
}

// src/types/price-calculator.ts - Add delivery date types

/** Delivery date selection state */
export interface DeliveryDateState {
  date: string | null // ISO date
  coefficient: number
  formattedDate: string
  status: 'base' | 'elevated' | 'high' | 'peak' | 'unavailable'
}

/** Coefficient calendar day (enhanced) */
export interface CoefficientDay {
  date: string
  coefficient: number
  isAvailable: boolean
  isSelected: boolean
  status: 'base' | 'elevated' | 'high' | 'peak' | 'unavailable'
}
```

### New Components

```
src/components/custom/price-calculator/
├── ProductSearchSelect.tsx      # CREATE - Searchable product dropdown
├── DeliveryDatePicker.tsx       # CREATE - Date picker with coefficient display
└── CoefficientCalendar.tsx      # UPDATE - Add click-to-select functionality
```

### New Hooks

```typescript
// src/hooks/useProductSearch.ts
export function useProductSearch(search: string) {
  return useQuery({
    queryKey: ['products', 'search', search],
    queryFn: () => searchProducts({ q: search, limit: 50 }),
    enabled: search.length >= 2,
    staleTime: 60 * 1000, // 1 minute
  })
}
```

### Form State Extension

```typescript
// Update FormData in usePriceCalculatorForm.ts
interface FormData {
  // ... existing fields ...

  // Product selection (NEW in 44.26a)
  // NOTE: nm_id is STRING from backend Epic 45 API!
  selected_product_nm_id: string | null
  selected_product_name: string  // from sa_name field

  // Delivery date (NEW in 44.26a)
  delivery_date: string | null
  delivery_coefficient: number
}
```

---

## UI/UX Requirements

### Product Search Section (Empty State)
```
┌─────────────────────────────────────────────────────────────┐
│ Товар (опционально)                                      [?] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔍 Поиск по SKU, артикулу или названию...               │ │
│ └─────────────────────────────────────────────────────────┘ │
│ 💡 Или введите данные вручную ниже                          │
└─────────────────────────────────────────────────────────────┘
```

### Product Search Dropdown (Active Search)
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 плат                                                     │
├─────────────────────────────────────────────────────────────┤
│ [IMG] 147205694 • DRESS-001                                 │
│       Платье летнее - Artisan                  (sa_name)    │
├─────────────────────────────────────────────────────────────┤
│ [IMG] 147205695 • DRESS-002                                 │
│       Платье вечернее - Artisan                             │
└─────────────────────────────────────────────────────────────┘
```

**Note**: Product name comes from `sa_name` field (not `title`).

### Product Selected State
```
┌─────────────────────────────────────────────────────────────┐
│ Товар                                              [× Очистить] │
├─────────────────────────────────────────────────────────────┤
│ [IMG] Платье летнее (DRESS-001)                 (sa_name)   │
│       Artisan • nmId: "147205694"               (string!)   │
└─────────────────────────────────────────────────────────────┘
```

**Note**: `nm_id` is a STRING from backend API.

### Delivery Date Picker (inside Warehouse Section)
```
┌─────────────────────────────────────────────────────────────┐
│ Дата сдачи товара                                          [?] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📅 21 января 2026                    Коэффициент: ×1.25 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ▸ Календарь коэффициентов (14 дней)                         │
│   ┌────┬────┬────┬────┬────┬────┬────┐                      │
│   │ Пн │ Вт │ Ср │ Чт │ Пт │ Сб │ Вс │                      │
│   ├────┼────┼────┼────┼────┼────┼────┤                      │
│   │🟢  │🟡  │🟡✓ │🟢  │🟠  │🔴  │⬜  │  ← ✓ = selected      │
│   │1.0 │1.25│1.25│1.0 │1.5 │2.0 │ -- │                      │
│   └────┴────┴────┴────┴────┴────┴────┘                      │
│                                                             │
│ Легенда: 🟢 базовый 🟡 повышенный 🟠 высокий 🔴 пиковый     │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Notes

### File Structure

```
src/
├── components/
│   └── custom/
│       └── price-calculator/
│           ├── ProductSearchSelect.tsx          # CREATE ~150 lines
│           ├── DeliveryDatePicker.tsx           # CREATE ~100 lines
│           ├── CoefficientCalendar.tsx          # UPDATE +40 lines
│           ├── WarehouseSection.tsx             # UPDATE +30 lines
│           └── PriceCalculatorForm.tsx          # UPDATE +40 lines
├── hooks/
│   └── useProductSearch.ts                      # CREATE ~35 lines
└── types/
    ├── product.ts                               # UPDATE +10 lines
    └── price-calculator.ts                      # UPDATE +15 lines
```

### Data Flow

```
┌─────────────────┐
│  ProductSearch  │────▶ selectedProduct (nmId, name)
│  (optional)     │      │
└─────────────────┘      ▼ (passed to 44.26b for auto-fill)
                   ┌─────────────────┐
                   │  Parent Form    │
                   │  State          │
                   └────────┬────────┘
                            │
┌─────────────────┐         │
│ WarehouseSelect │────────┼────▶ warehouseId
└─────────────────┘         │
        │                   │
        ▼ (triggers)        │
┌─────────────────┐         │
│ DatePicker +    │────────┼────▶ deliveryDate, coefficient
│ Calendar        │         │
└─────────────────┘         │
                            ▼
                   ┌─────────────────┐
                   │ Logistics Calc  │
                   │ (uses coeff)    │
                   └─────────────────┘
```

---

## Invariants & Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Search less than 2 chars | Don't trigger API call |
| No search results | Show "Товары не найдены" message |
| Product search API error | Show error with retry, form remains usable |
| All dates unavailable | Show error, suggest changing warehouse |
| Warehouse changed | Reset date to first available |
| Form reset | Clear product selection and date |
| Product has no photo | Show placeholder icon |
| Very long product name | Truncate with ellipsis |
| Date in past | Should not appear in calendar |

---

## Out of Scope

- ❌ Auto-fill dimensions from product (Story 44.26b-FE)
- ❌ Auto-fill category from product (Story 44.26b-FE)
- ❌ AutoFillBadge component (Story 44.26b-FE)
- ❌ Restore functionality for edited values (Story 44.26b-FE)
- ❌ Category lock/unlock logic (Story 44.26b-FE)
- ❌ Product dimensions display in dropdown (Story 44.26b-FE)

---

## Definition of Done

- [ ] ProductSearchSelect component implemented with search
- [ ] DeliveryDatePicker component implemented with coefficient display
- [ ] CoefficientCalendar enhanced with click-to-select
- [ ] Form state management for product and date
- [ ] Integration with PriceCalculatorForm complete
- [ ] Loading and error states implemented
- [ ] Unit tests for useProductSearch hook
- [ ] Component tests for ProductSearchSelect, DeliveryDatePicker
- [ ] No ESLint errors
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Code review completed

---

## Accessibility (WCAG 2.1 AA)

- [ ] Product dropdown keyboard navigable (arrow keys, enter, escape)
- [ ] Date picker keyboard navigable
- [ ] Calendar cells have aria-label with full date and coefficient
- [ ] Focus management on dropdown open/close
- [ ] Search input has proper label and aria-describedby

---

## QA Checklist

### Functional Verification
| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Search product by SKU | Shows matching products | [ ] |
| Search product by name | Shows matching products | [ ] |
| Select product from dropdown | Shows selected product card | [ ] |
| Click "Очистить" | Clears product selection | [ ] |
| Select delivery date | Shows coefficient | [ ] |
| Click calendar date | Selects that date, updates picker | [ ] |
| Unavailable date | Cannot be selected (gray, no click) | [ ] |
| Change warehouse | Resets date, reloads coefficients | [ ] |
| Form reset | Clears product and date | [ ] |
| Empty search results | Shows "Товары не найдены" | [ ] |

### Accessibility Verification
| Check | Status |
|-------|--------|
| Keyboard navigation (dropdown) | [ ] |
| Keyboard navigation (calendar) | [ ] |
| Screen reader labels | [ ] |
| Focus management | [ ] |

---

**Created**: 2026-01-21
**Last Updated**: 2026-01-21
**Author**: PM (Story Split from 44.26-FE)

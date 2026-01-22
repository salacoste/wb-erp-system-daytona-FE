# Story 44.26b-FE: Auto-fill Dimensions & Category from Product

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 📋 Ready for Dev
**Priority**: P0 - CRITICAL (Next Major Feature)
**Effort**: 5 SP
**Parent Story**: 44.26-FE (split for independent delivery)
**Depends On**:
- Story 44.26a-FE ⏳ (Product Search & Date Picker - must complete first)
- Story 44.7 ✅ (Dimension Volume Calculation)
- **Backend Request #99** ✅ IMPLEMENTED (Epic 45 Backend)

---

## User Story

**As a** Seller,
**I want** dimensions and category to be automatically filled when I select a product from my catalog,
**So that** I don't have to manually enter data that already exists in my WB product cards.

---

## Scope Clarification

**This story covers:**
- Auto-fill dimensions from product (mm → cm conversion)
- Auto-fill category from product (with commission lookup)
- AutoFillBadge component ("Автозаполнено", "Изменено")
- Restore functionality for edited auto-filled values
- Category lock/unlock logic based on selection mode
- Product dimensions display in search dropdown

**Prerequisites from 44.26a:**
- ProductSearchSelect component ✅
- Product selection state management ✅
- Form integration for product selection ✅

---

## Backend API Reference

**Endpoint**: `GET /v1/products?include_dimensions=true`
**Test File**: `../test-api/45-products-dimensions.http`
**Documentation**: `../test-api/README.md` (Epic 45 section)
**Backend Epic**: Epic 45 - Products Dimensions & Category API
**Request #99**: `docs/request-backend/99-products-dimensions-category-api.md`

---

### Request #99: Product Dimensions & Category in API ✅ IMPLEMENTED

**API Endpoint:**
```http
GET /v1/products?include_dimensions=true&limit=100
Authorization: Bearer {token}
X-Cabinet-Id: {cabinet_id}
```

**Actual Response (Epic 45 Backend):**
```json
{
  "products": [
    {
      "nm_id": "147205694",
      "sa_name": "Платье летнее",
      "brand": "BrandName",
      "vendor_code": "ART-001",
      "dimensions": {
        "length_mm": 400,
        "width_mm": 300,
        "height_mm": 50,
        "volume_liters": 6.0
      },
      "category_hierarchy": {
        "subject_id": 105,
        "subject_name": "Платья",
        "parent_id": 8,
        "parent_name": "Женская одежда"
      }
    }
  ],
  "pagination": {
    "next_cursor": "...",
    "has_more": true,
    "count": 25,
    "total": 150
  }
}
```

**Status**: ✅ IMPLEMENTED (Epic 45 Backend)

**CRITICAL Implementation Differences from Original Request #99:**

| Field | Original Request | Actual Implementation | Notes |
|-------|------------------|----------------------|-------|
| `nm_id` | `number` | `string` | Backend returns STRING! |
| Product name | `title` | `sa_name` | WB uses sa_name |
| Category | `category` | `category_hierarchy` | Different field name |
| Volume | calculated | `volume_liters` | Pre-calculated by backend |

**Implementation Notes:**
- **`nm_id` is STRING** - Must use `string` type, not `number`
- Field name is `category_hierarchy` (not `category`)
- `volume_liters` is pre-calculated by backend (no frontend calculation needed!)
- Redis caching with 24h TTL, cache-first strategy
- Performance: <500ms for 100 products, <50ms cached
- Additional params: `skip_cache=true` to bypass Redis cache

---

## Acceptance Criteria

### AC1: Auto-fill Dimensions from Product
- [ ] When product selected: auto-fill dimensions from `product.dimensions`
  - `length_cm` ← `product.dimensions.length_mm / 10`
  - `width_cm` ← `product.dimensions.width_mm / 10`
  - `height_cm` ← `product.dimensions.height_mm / 10`
- [ ] Show "Автозаполнено" badge next to dimensions section header
- [ ] Allow manual editing of auto-filled dimensions
- [ ] Track dimensions source: `'auto' | 'manual'`
- [ ] When any dimension edited manually: show "Изменено" badge
- [ ] Show "Восстановить" button when dimensions edited
- [ ] Restore button resets to original auto-filled values

### AC2: Auto-fill Category from Product
- [ ] When product selected: auto-fill category from `product.category_hierarchy`
  - Set `selectedCategory.parentID` ← `product.category_hierarchy.parent_id`
  - Set `selectedCategory.subjectID` ← `product.category_hierarchy.subject_id`
  - Set `selectedCategory.parentName` ← `product.category_hierarchy.parent_name`
  - Set `selectedCategory.subjectName` ← `product.category_hierarchy.subject_name`
  - Lookup commission from useCommissions hook
- [ ] Show "Автозаполнено" badge next to category selector
- [ ] Lock CategorySelector when category auto-filled (show 🔒 icon)
- [ ] Show commission percentage from auto-filled category
- [ ] Track category source: `'auto' | 'manual'`

**Note**: Backend field is `category_hierarchy`, NOT `category`!

### AC3: Mode Switching (Product Selected vs Manual)
- [ ] **Mode A (Product Selected)**:
  - Dimensions: auto-filled, editable with restore
  - Category: auto-filled, locked (user sees selected category but cannot change)
  - Show badges: "Автозаполнено"
- [ ] **Mode B (No Product / Cleared)**:
  - Dimensions: empty, manual input required
  - Category: CategorySelector active, user can select
  - No badges shown
- [ ] On "Очистить товар": switch from Mode A → Mode B
  - Clear auto-filled dimensions
  - Unlock CategorySelector
  - Reset dimension/category sources to 'manual'

### AC4: AutoFillBadge Component
- [ ] Create reusable AutoFillBadge component
- [ ] Badge variants:
  - "Автозаполнено" (green) - values from product
  - "Изменено" (yellow) - user edited auto-filled value
- [ ] Show restore button when status is "Изменено"
- [ ] Restore button onClick → reset to original values
- [ ] Smooth transition animations between states

### AC5: Product Dimensions in Search Dropdown (Enhancement to 44.26a)
- [ ] Show dimensions in product search results: "📐 40×30×5 см (6.0 л)"
  - Dimensions: `dimensions.length_mm/10 × dimensions.width_mm/10 × dimensions.height_mm/10 см`
  - Volume: `dimensions.volume_liters` (pre-calculated by backend!)
- [ ] Show category path from `category_hierarchy`: "Женская одежда → Платья"
  - Format: `category_hierarchy.parent_name → category_hierarchy.subject_name`
- [ ] Handle missing dimensions (`dimensions === null`): show "Габариты не указаны"
- [ ] Handle missing category (`category_hierarchy === null`): show "Категория не указана"

### AC6: Error Handling for Missing Data
- [ ] If product has no dimensions:
  - Show warning: "Габариты не указаны в карточке WB"
  - Keep dimensions in manual mode (user must enter)
  - Do not show "Автозаполнено" badge
- [ ] If product has no category:
  - Show warning: "Категория не указана в карточке WB"
  - Keep CategorySelector unlocked
  - Do not show "Автозаполнено" badge
- [ ] Warnings should be dismissible

---

## Technical Requirements

### Extended Types

```typescript
// src/types/product.ts - From Backend Epic 45 API
// IMPORTANT: Field names and types match ACTUAL backend implementation!

/** Product dimensions from WB catalog (in mm) - Epic 45 Backend */
export interface ProductDimensions {
  length_mm: number
  width_mm: number
  height_mm: number
  volume_liters: number  // Pre-calculated by backend (L×W×H/1000000)
}

/** Category hierarchy from WB catalog - Epic 45 Backend */
// NOTE: Field name is "category_hierarchy", NOT "category"!
export interface CategoryHierarchy {
  subject_id: number
  subject_name: string
  parent_id: number | null    // May be null for top-level categories
  parent_name: string | null  // May be null for top-level categories
}

/** Product with dimensions and category for Price Calculator - Epic 45 Backend */
export interface ProductWithDimensions {
  nm_id: string                        // STRING from backend (NOT number!)
  vendor_code: string
  sa_name: string                      // Product name (WB uses "sa_name", NOT "title")
  brand?: string
  photo_url?: string
  has_cogs?: boolean
  cogs?: {
    unit_cost_rub: number
    valid_from: string
  }
  dimensions?: ProductDimensions | null      // null if not set in WB
  category_hierarchy?: CategoryHierarchy | null  // null if not set in WB
}

// src/types/price-calculator.ts - Auto-fill state

/** Auto-fill source tracking */
export type AutoFillSource = 'auto' | 'manual'

/** Auto-fill badge status */
export type AutoFillStatus = 'auto' | 'modified' | 'none'

/** Dimension auto-fill state */
export interface DimensionAutoFillState {
  source: AutoFillSource
  originalValues: {
    length_cm: number
    width_cm: number
    height_cm: number
    volume_liters: number  // Pre-calculated by backend!
  } | null
  status: AutoFillStatus
}

/** Category auto-fill state */
export interface CategoryAutoFillState {
  source: AutoFillSource
  isLocked: boolean
  originalCategory: CategoryHierarchy | null  // Uses CategoryHierarchy, not ProductCategory
}
```

### New Components

```
src/components/custom/price-calculator/
├── AutoFillBadge.tsx            # CREATE - Reusable badge with restore
├── ProductSearchSelect.tsx      # UPDATE - Add dimensions/category display
├── DimensionsSection.tsx        # UPDATE - Add auto-fill integration
└── CategorySection.tsx          # UPDATE - Add lock/unlock logic
```

### State Management Extension

```typescript
// Update PriceCalculatorForm state
const [dimensionsAutoFill, setDimensionsAutoFill] = useState<DimensionAutoFillState>({
  source: 'manual',
  originalValues: null,
  status: 'none',
})

const [categoryAutoFill, setCategoryAutoFill] = useState<CategoryAutoFillState>({
  source: 'manual',
  isLocked: false,
  originalCategory: null,
})

// Handle product selection (from 44.26a) with auto-fill
// UPDATED for Epic 45 Backend API (sa_name, category_hierarchy, volume_liters)
const handleProductSelect = useCallback((product: ProductWithDimensions | null) => {
  if (product) {
    // Auto-fill dimensions
    // NOTE: Backend provides volume_liters pre-calculated!
    if (product.dimensions) {
      const lengthCm = product.dimensions.length_mm / 10
      const widthCm = product.dimensions.width_mm / 10
      const heightCm = product.dimensions.height_mm / 10
      const volumeLiters = product.dimensions.volume_liters // Pre-calculated!

      setValue('length_cm', lengthCm)
      setValue('width_cm', widthCm)
      setValue('height_cm', heightCm)
      setValue('volume_liters', volumeLiters) // Use backend value directly

      setDimensionsAutoFill({
        source: 'auto',
        originalValues: {
          length_cm: lengthCm,
          width_cm: widthCm,
          height_cm: heightCm,
          volume_liters: volumeLiters, // Store original from backend
        },
        status: 'auto',
      })
    }

    // Auto-fill category
    // NOTE: Field is "category_hierarchy", NOT "category"!
    if (product.category_hierarchy) {
      setSelectedCategory({
        parentID: product.category_hierarchy.parent_id,
        parentName: product.category_hierarchy.parent_name,
        subjectID: product.category_hierarchy.subject_id,
        subjectName: product.category_hierarchy.subject_name,
        kgvpMarketplace: 0, // Looked up from commissions
        paidStorageKgvp: 0,
      })

      setCategoryAutoFill({
        source: 'auto',
        isLocked: true,
        originalCategory: product.category_hierarchy,
      })
    }
  } else {
    // Clear auto-fill on product clear
    setDimensionsAutoFill({ source: 'manual', originalValues: null, status: 'none' })
    setCategoryAutoFill({ source: 'manual', isLocked: false, originalCategory: null })
  }
}, [setValue, setSelectedCategory])

// Handle dimension manual edit
const handleDimensionChange = useCallback((field: string, value: number) => {
  setValue(field, value)

  if (dimensionsAutoFill.source === 'auto') {
    setDimensionsAutoFill(prev => ({ ...prev, status: 'modified' }))
  }
}, [setValue, dimensionsAutoFill.source])

// Handle restore
const handleRestoreDimensions = useCallback(() => {
  if (dimensionsAutoFill.originalValues) {
    setValue('length_cm', dimensionsAutoFill.originalValues.length_cm)
    setValue('width_cm', dimensionsAutoFill.originalValues.width_cm)
    setValue('height_cm', dimensionsAutoFill.originalValues.height_cm)
    setValue('volume_liters', dimensionsAutoFill.originalValues.volume_liters) // Restore backend value
    setDimensionsAutoFill(prev => ({ ...prev, status: 'auto' }))
  }
}, [dimensionsAutoFill.originalValues, setValue])
```

---

## UI/UX Requirements

### Mode A: Product Selected (Auto-fill Active)

**Product Card (enhanced from 44.26a)**
```
┌─────────────────────────────────────────────────────────────┐
│ Товар                                              [× Очистить] │
├─────────────────────────────────────────────────────────────┤
│ [IMG] Платье летнее (DRESS-001)           [Автозаполнено]   │
│       (sa_name)                                             │
│       Artisan • nmId: "147205694" (string!)                 │
│       📐 40×30×5 см (6.0 л) • Женская одежда → Платья       │
│       (dimensions)              (category_hierarchy)        │
└─────────────────────────────────────────────────────────────┘
```

**Note**: Volume (6.0 л) comes from backend `dimensions.volume_liters`, NOT calculated on frontend.

**Category (Locked)**
```
┌─────────────────────────────────────────────────────────────┐
│ Категория товара                           [Автозаполнено]  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Женская одежда → Платья                    [15%] 🔒     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ 💡 Категория из карточки товара WB                          │
└─────────────────────────────────────────────────────────────┘
```

**Dimensions (Auto-filled, Not Edited)**
```
┌─────────────────────────────────────────────────────────────┐
│ Габариты товара                            [Автозаполнено]  │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐                   │
│ │ Длина, см │ │ Ширина, см│ │ Высота, см│                   │
│ │   [40.0]  │ │   [30.0]  │ │   [5.0]   │                   │
│ └───────────┘ └───────────┘ └───────────┘                   │
│ Объём: 6,000 л                                              │
└─────────────────────────────────────────────────────────────┘
```

**Dimensions (Auto-filled, User Edited)**
```
┌─────────────────────────────────────────────────────────────┐
│ Габариты товара                    [Изменено] [🔁 Восстановить] │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐                   │
│ │ Длина, см │ │ Ширина, см│ │ Высота, см│                   │
│ │   [45.0]  │ │   [30.0]  │ │   [5.0]   │  ← User changed  │
│ └───────────┘ └───────────┘ └───────────┘                   │
│ Объём: 6,750 л                                              │
└─────────────────────────────────────────────────────────────┘
```

### Mode B: Manual Entry (No Product)

**Category (Unlocked)**
```
┌─────────────────────────────────────────────────────────────┐
│ Категория товара                                         [?] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Выберите категорию...                              [▼]  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Warning States

**Product Without Dimensions**
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Габариты не указаны в карточке WB                     [×] │
│    Введите габариты вручную ниже                            │
└─────────────────────────────────────────────────────────────┘
```

**Product Without Category**
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Категория не указана в карточке WB                    [×] │
│    Выберите категорию вручную                               │
└─────────────────────────────────────────────────────────────┘
```

### AutoFillBadge Component

```typescript
// Props
interface AutoFillBadgeProps {
  status: 'auto' | 'modified' | 'none'
  onRestore?: () => void
  className?: string
}

// Render
<AutoFillBadge status="auto" />        // "Автозаполнено" (green)
<AutoFillBadge
  status="modified"
  onRestore={handleRestore}
/>                                      // "Изменено" (yellow) + "Восстановить"
<AutoFillBadge status="none" />         // Nothing rendered
```

---

## Implementation Notes

### File Structure

```
src/
├── components/
│   └── custom/
│       └── price-calculator/
│           ├── AutoFillBadge.tsx                # CREATE ~60 lines
│           ├── ProductSearchSelect.tsx          # UPDATE +40 lines (dimensions display)
│           ├── DimensionsSection.tsx            # UPDATE +50 lines (auto-fill logic)
│           ├── CategorySection.tsx              # CREATE or UPDATE ~80 lines
│           └── PriceCalculatorForm.tsx          # UPDATE +60 lines (state management)
├── hooks/
│   └── useProductsWithDimensions.ts             # CREATE ~40 lines
├── lib/
│   └── api/
│       └── products.ts                          # UPDATE +20 lines (include_dimensions)
└── types/
    ├── product.ts                               # UPDATE +25 lines
    └── price-calculator.ts                      # UPDATE +20 lines
```

### API Integration (Epic 45 Backend - IMPLEMENTED)

```typescript
// src/lib/api/products.ts
// UPDATED for Epic 45 Backend API

export interface GetProductsWithDimensionsParams {
  search?: string
  include_dimensions?: boolean
  include_cogs?: boolean      // Can combine with dimensions
  include_storage?: boolean   // Can combine with dimensions
  limit?: number
  cursor?: string
  skip_cache?: boolean        // Bypass Redis cache (default: false)
}

export interface ProductsWithDimensionsResponse {
  products: ProductWithDimensions[]
  pagination: {
    next_cursor: string | null
    has_more: boolean
    count: number
    total: number
  }
}

export async function getProductsWithDimensions(
  params: GetProductsWithDimensionsParams
): Promise<ProductsWithDimensionsResponse> {
  const searchParams = new URLSearchParams()
  if (params.search) searchParams.set('q', params.search)
  if (params.include_dimensions) searchParams.set('include_dimensions', 'true')
  if (params.include_cogs) searchParams.set('include_cogs', 'true')
  if (params.include_storage) searchParams.set('include_storage', 'true')
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.cursor) searchParams.set('cursor', params.cursor)
  if (params.skip_cache) searchParams.set('skip_cache', 'true')

  return apiClient.get(`/v1/products?${searchParams.toString()}`)
}

// src/hooks/useProductsWithDimensions.ts
export function useProductsWithDimensions(search: string) {
  return useQuery({
    queryKey: ['products', 'dimensions', search],
    queryFn: () => getProductsWithDimensions({
      search,
      include_dimensions: true,
      limit: 50
    }),
    enabled: search.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes (backend caches for 24h)
  })
}
```

**Performance Notes (from Epic 45)**:
- Cache miss: ~350-550ms (WB API call)
- Cache hit: ~150ms (Redis, 24h TTL)
- Combined with include_cogs: +150ms
- Combined with include_storage: +50ms

---

## Invariants & Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Product without dimensions (`dimensions === null`) | Show warning, manual input mode for dimensions |
| Product without category (`category_hierarchy === null`) | Show warning, CategorySelector unlocked |
| Product has partial dimensions | Show warning, fill what's available, manual for rest |
| User edits one dimension | Show "Изменено" badge, enable restore for all (including volume) |
| User clicks restore | All dimensions + volume reset to original auto-filled values from backend |
| User clears product | All auto-fill cleared, manual mode activated |
| Product changed to another | New product's data auto-fills, replaces previous |
| API returns dimensions as 0 | Treat as valid (0mm is possible), calculate volume |
| Commission lookup fails | Show commission as "N/A", allow form submission |
| `nm_id` type handling | Always treat as STRING (backend returns "147205694", not 147205694) |
| `parent_id` is null | Top-level category, display only subject_name |
| Cache miss (skip_cache=true) | API call takes ~350-550ms, show loading state |

---

## Out of Scope

- ❌ Editing product dimensions in WB catalog
- ❌ Multi-product selection
- ❌ Commission override (always from category)
- ❌ Saving preferred dimensions per product
- ❌ Dimensions history

---

## Definition of Done

- [ ] Auto-fill dimensions working with mm→cm conversion
- [ ] Auto-fill category working with commission lookup
- [ ] AutoFillBadge component implemented with all variants
- [ ] Restore functionality working for dimensions
- [ ] Category lock/unlock working based on mode
- [ ] Dimensions shown in product search dropdown
- [ ] Warning states for missing dimensions/category
- [ ] Unit tests for auto-fill logic
- [ ] Component tests for AutoFillBadge
- [ ] E2E test for full auto-fill flow
- [ ] No ESLint errors
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Code review completed
- [ ] Backend API integrated (or mocked if not ready)

---

## Accessibility (WCAG 2.1 AA)

- [ ] Auto-fill announcements via aria-live region
- [ ] Restore buttons have descriptive aria-label
- [ ] Lock icon has aria-label explaining locked state
- [ ] Warning alerts are announced to screen readers
- [ ] Badge color not only indicator (text + icon)

---

## QA Checklist

### Functional Verification
| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Select product with dimensions | Dimensions auto-filled in cm | [ ] |
| Select product with category | Category auto-filled, locked | [ ] |
| Edit auto-filled dimension | Badge changes to "Изменено" | [ ] |
| Click "Восстановить" | Original values restored | [ ] |
| Clear product | Mode B activated, fields unlocked | [ ] |
| Product without dimensions | Warning shown, manual mode | [ ] |
| Product without category | Warning shown, selector unlocked | [ ] |
| Select new product | Previous auto-fill replaced | [ ] |
| Form reset | All auto-fill cleared | [ ] |

### Accessibility Verification
| Check | Status |
|-------|--------|
| Screen reader announcements for auto-fill | [ ] |
| Restore button accessible | [ ] |
| Lock icon explained | [ ] |
| Warning alerts announced | [ ] |

---

**Created**: 2026-01-21
**Last Updated**: 2026-01-21
**Author**: PM (Story Split from 44.26-FE)
**Backend Dependency**: Request #99 - ✅ IMPLEMENTED (Epic 45 Backend)
**Backend Test File**: `../test-api/45-products-dimensions.http`
**Backend Documentation**: `../test-api/README.md` (Epic 45 section)

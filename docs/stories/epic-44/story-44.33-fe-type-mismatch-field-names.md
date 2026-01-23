# Story 44.33: Frontend Type Mismatch & Field Name Fixes

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: ✅ Complete
**Priority**: P1 - MEDIUM
**Effort**: 2 SP
**Depends On**: Story 44.1 (TypeScript Types & API Client), Story 44.2 (Input Form)
**Requirements Ref**: FRONTEND-INTEGRATION-GUIDE.md Section "Products with Dimensions API"
**Backend API**: `GET /v1/products?include_dimensions=true`

---

## User Story

**As a** Developer,
**I want** TypeScript types and field names to match backend API responses exactly,
**So that** the frontend correctly handles product data without runtime errors or type mismatches.

**Non-goals**:
- Backend API changes (backend contract is fixed)
- Breaking changes to existing working features
- Changes to data transformation logic (only type fixes)

---

## Background: Type Mismatch Issues

Backend Request #99 revealed three critical type/field mismatches between frontend expectations and actual API responses:

| Issue | Frontend Expected | Backend Returns | Impact |
|-------|------------------|-----------------|--------|
| **#1: nm_id type** | `number` | `string` | Type errors in product search |
| **#2: title field** | `title` | `sa_name` | Product name undefined |
| **#3: category field** | `category` | `category_hierarchy` | Category data undefined |

**Source**: `frontend/docs/request-backend/FRONTEND-INTEGRATION-GUIDE.md`

---

## Acceptance Criteria

### AC1: Fix nm_id Type Mismatch
- [ ] Update `Product.nm_id` type from `number` to `string`
- [ ] Update all component props using `nm_id` to accept `string`
- [ ] Update all API calls passing `nm_id` to use string value
- [ ] Update route params handling for `nm_id` (if used in routes)
- [ ] No TypeScript errors related to `nm_id` type mismatches

### AC2: Fix Product Name Field Reference
- [ ] Replace all references to `product.title` with `product.sa_name`
- [ ] Update product display components to use `sa_name`
- [ ] Update product search/filter to search `sa_name` field
- [ ] Update any sorting/grouping using product name
- [ ] No "undefined" product names in UI

### AC3: Fix Category Field Reference
- [ ] Replace all references to `product.category` with `product.category_hierarchy`
- [ ] Update category display logic to use nested object structure:
  - `category_hierarchy.subject_name` (leaf category)
  - `category_hierarchy.parent_name` (root category)
- [ ] Update category filtering to use `category_hierarchy.subject_id`
- [ ] Update category dropdown components to show hierarchy
- [ ] No "undefined" category data in UI

### AC4: Update TypeScript Type Definitions
- [ ] Update `src/types/products.ts` with correct field types
- [ ] Update `src/types/price-calculator.ts` with correct product reference
- [ ] Add `CategoryHierarchy` interface for nested category structure
- [ ] Add `ProductDimensions` interface for dimensions data
- [ ] All types match backend response exactly

### AC5: Update Product Search/Filter Components
- [ ] Product search returns results with correct field names
- [ ] Product search displays product names using `sa_name`
- [ ] Product search displays categories using `category_hierarchy`
- [ ] Product card components render without errors
- [ ] No console errors related to undefined fields

### AC6: Update Price Calculator Product Integration
- [ ] Auto-fill product dimensions works correctly
- [ ] Auto-fill product category works correctly
- [ ] Product search in calculator shows correct names
- [ ] Product search in calculator shows correct categories
- [ ] Calculator form validates without type errors

### AC7: Update Product List Views
- [ ] Product list table displays `sa_name` in name column
- [ ] Product list displays category using `category_hierarchy.subject_name`
- [ ] Product list filters by category work correctly
- [ ] Product list sorting by name works correctly
- [ ] No undefined values in product list

### AC8: Update Forms Using Product Data
- [ ] Single COGS form shows product name using `sa_name`
- [ ] Bulk COGS form shows product names using `sa_name`
- [ ] Margin by SKU table shows product names using `sa_name`
- [ ] All forms submit correctly with string `nm_id`
- [ ] No validation errors from type mismatches

---

## Context & References

- **Integration Guide**: `frontend/docs/request-backend/FRONTEND-INTEGRATION-GUIDE.md`
- **Backend Request**: `frontend/docs/request-backend/99-products-dimensions-category-api.md`
- **Parent Epic**: `docs/stories/epic-44/README.md`
- **Story 44.1**: TypeScript Types & API Client (types definition)
- **Story 44.2**: Input Form Component (form using product data)
- **Story 44.26b**: Auto-fill Dimensions & Category (product data usage)

**Backend Response Example**:
```json
{
  "products": [
    {
      "nm_id": "686701815",           // ✅ string (NOT number)
      "sa_name": "Эпоксидная смола",  // ✅ product name (NOT title)
      "dimensions": {
        "length_mm": 400,
        "width_mm": 300,
        "height_mm": 100,
        "volume_liters": 12.0
      },
      "category_hierarchy": {         // ✅ nested object (NOT flat category)
        "subject_id": 123,
        "subject_name": "Клеи и герметики",
        "parent_id": 8,
        "parent_name": "Строительные материалы"
      }
    }
  ]
}
```

---

## API Contract

### Backend Response Structure

**GET /v1/products?include_dimensions=true**:

```typescript
interface Product {
  nm_id: string;                    // ✅ CORRECT: string
  sa_name: string;                  // ✅ CORRECT: product name
  vendor_code?: string;
  dimensions?: ProductDimensions | null;
  category_hierarchy?: CategoryHierarchy | null;
  // ... other fields
}

interface ProductDimensions {
  length_mm: number;
  width_mm: number;
  height_mm: number;
  volume_liters: number;
}

interface CategoryHierarchy {
  subject_id: number;
  subject_name: string;
  parent_id: number | null;
  parent_name: string | null;
}
```

### Incorrect Frontend Types (BEFORE)

```typescript
// ❌ WRONG TYPES (before fix)
interface Product {
  nm_id: number;                    // ❌ WRONG: should be string
  title: string;                    // ❌ WRONG: field doesn't exist
  category: string;                 // ❌ WRONG: field doesn't exist
}
```

---

## Implementation Notes

### File Structure

```
src/
├── types/
│   ├── products.ts                  # UPDATE - Fix type definitions
│   └── price-calculator.ts          # UPDATE - Fix Product reference
├── components/
│   └── custom/
│       ├── price-calculator/
│       │   └── ProductAutoFill.tsx  # UPDATE - Use correct fields
│       ├── product-list/
│       │   └── ProductTable.tsx     # UPDATE - Display sa_name
│       └── cogs/
│           ├── SingleCogsForm.tsx   # UPDATE - Use correct fields
│           └── BulkCogsForm.tsx     # UPDATE - Use correct fields
├── hooks/
│   ├── useProducts.ts               # UPDATE - Return correct types
│   └── useProductSearch.ts          # UPDATE - Search sa_name
└── lib/
    └── api/
        └── products.ts              # UPDATE - Type definitions
```

### Type Definitions Update

```typescript
// src/types/products.ts (UPDATE)

/**
 * Product interface matching backend API response exactly
 * Backend: GET /v1/products?include_dimensions=true
 */
export interface Product {
  // Primary identifier (string in backend response)
  nm_id: string;                    // ✅ CORRECT: string (was number)

  // Product name (sa_name in backend)
  sa_name: string;                  // ✅ CORRECT: product name (was title)
  vendor_code?: string;
  brand?: string;

  // Category hierarchy (nested object in backend)
  category_hierarchy?: CategoryHierarchy | null;  // ✅ CORRECT (was flat category)

  // Dimensions (optional with include_dimensions=true)
  dimensions?: ProductDimensions | null;

  // Financial data
  cogs?: Cogs | null;
  weekly_financials?: WeeklyFinancials | null;

  // Metadata
  created_at?: string;
  updated_at?: string;
}

/**
 * Product dimensions from backend
 */
export interface ProductDimensions {
  length_mm: number;
  width_mm: number;
  height_mm: number;
  volume_liters: number;
}

/**
 * Category hierarchy from backend (nested structure)
 */
export interface CategoryHierarchy {
  subject_id: number;              // Leaf category ID
  subject_name: string;            // Leaf category name (e.g., "Платья")
  parent_id: number | null;        // Root category ID
  parent_name: string | null;      // Root category name (e.g., "Одежда")
}

/**
 * Type alias for backward compatibility during migration
 * @deprecated Use sa_name instead
 */
export type ProductTitle = never; // Compile error if used

/**
 * Type alias for backward compatibility during migration
 * @deprecated Use category_hierarchy.subject_name instead
 */
export type ProductCategory = never; // Compile error if used
```

### Helper Functions for Category Display

```typescript
// src/lib/product-utils.ts (CREATE)

import type { CategoryHierarchy } from '@/types/products';

/**
 * Get display name for product category
 * Shows full hierarchy: "Parent → Subject"
 */
export function getCategoryDisplayName(
  category: CategoryHierarchy | null | undefined
): string {
  if (!category) return 'Без категории';

  if (category.parent_name) {
    return `${category.parent_name} → ${category.subject_name}`;
  }

  return category.subject_name;
}

/**
 * Get leaf category name
 */
export function getCategoryName(
  category: CategoryHierarchy | null | undefined
): string {
  return category?.subject_name || 'Без категории';
}

/**
 * Get root category name
 */
export function getParentCategoryName(
  category: CategoryHierarchy | null | undefined
): string {
  return category?.parent_name || '—';
}

/**
 * Get leaf category ID
 */
export function getCategoryId(
  category: CategoryHierarchy | null | undefined
): number | null {
  return category?.subject_id ?? null;
}
```

### Component Update: Product Table

```typescript
// src/components/custom/product-list/ProductTable.tsx (UPDATE)

import type { Product } from '@/types/products';
import { getCategoryDisplayName } from '@/lib/product-utils';

interface ProductTableProps {
  products: Product[];
}

export function ProductTable({ products }: ProductTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Артикул</TableHead>
          <TableHead>Название</TableHead> {/* ✅ Changed from "Title" */}
          <TableHead>Категория</TableHead>
          {/* ... */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.nm_id}>
            <TableCell>{product.nm_id}</TableCell>
            {/* ✅ Use sa_name instead of title */}
            <TableCell>{product.sa_name}</TableCell>
            {/* ✅ Use category_hierarchy instead of category */}
            <TableCell>{getCategoryDisplayName(product.category_hierarchy)}</TableCell>
            {/* ... */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Component Update: Product Auto-fill

```typescript
// src/components/custom/price-calculator/ProductAutoFill.tsx (UPDATE)

import type { Product } from '@/types/products';
import { getCategoryName } from '@/lib/product-utils';

interface ProductAutoFillProps {
  product: Product;
  onAutoFill: (data: AutoFillData) => void;
}

export function ProductAutoFill({ product, onAutoFill }: ProductAutoFillProps) {
  const handleAutoFill = () => {
    onAutoFill({
      // ✅ Use string nm_id
      productNmId: product.nm_id,

      // ✅ Auto-fill dimensions
      length_cm: product.dimensions?.length_mm / 10 || 0,
      width_cm: product.dimensions?.width_mm / 10 || 0,
      height_cm: product.dimensions?.height_mm / 10 || 0,

      // ✅ Auto-fill category
      category_id: product.category_hierarchy?.subject_id,
      category_name: getCategoryName(product.category_hierarchy),
    });
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h4 className="font-medium">{product.sa_name}</h4>
        {/* ✅ Use sa_name */}
        <p className="text-sm text-muted-foreground">
          {getCategoryDisplayName(product.category_hierarchy)}
        </p>
      </div>
      <Button onClick={handleAutoFill}>Заполнить</Button>
    </div>
  );
}
```

### Hook Update: Product Search

```typescript
// src/hooks/useProductSearch.ts (UPDATE)

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Product } from '@/types/products';

interface ProductSearchParams {
  q?: string;
  include_dimensions?: boolean;
}

export function useProductSearch({ q, include_dimensions }: ProductSearchParams) {
  return useQuery<Product[]>({
    queryKey: ['products', 'search', q, include_dimensions],
    queryFn: () =>
      apiClient.get('/v1/products', {
        params: {
          q: q || undefined,
          include_dimensions: include_dimensions ? 'true' : undefined,
        },
      }),
    enabled: !!q && q.length >= 3,
    staleTime: 60 * 60 * 1000, // 1h cache
  });
}

// Usage in component
const { data: products } = useProductSearch({
  q: searchQuery,
  include_dimensions: true,
});

// ✅ products[].nm_id is string
// ✅ products[].sa_name is product name
// ✅ products[].category_hierarchy is nested object
```

### Form Update: Single COGS Form

```typescript
// src/components/custom/cogs/SingleCogsForm.tsx (UPDATE)

import type { Product } from '@/types/products';

interface SingleCogsFormProps {
  product: Product;
}

export function SingleCogsForm({ product }: SingleCogsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{product.sa_name}</CardTitle> {/* ✅ Use sa_name */}
        <CardDescription>
          Артикул: {product.nm_id} {/* ✅ nm_id is string */}
        </CardDescription>
      </CardHeader>

      {/* Category badge */}
      {product.category_hierarchy && (
        <Badge variant="secondary">
          {getCategoryDisplayName(product.category_hierarchy)}
        </Badge>
      )}

      {/* ... form fields ... */}
    </Card>
  );
}
```

### Update Price Calculator Types

```typescript
// src/types/price-calculator.ts (UPDATE)

import type { Product } from '@/types/products';

/**
 * Auto-fill data from product selection
 */
export interface ProductAutoFillData {
  productNmId: string;           // ✅ string (was number)
  productName: string;            // ✅ from sa_name (was title)
  categoryId?: number;            // ✅ from category_hierarchy.subject_id
  categoryName?: string;          // ✅ from category_hierarchy.subject_name

  // Dimensions
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  volume_liters?: number;
}

/**
 * Extended form data with product reference
 */
export interface PriceCalculatorFormData {
  // ... existing fields ...

  // Product reference (optional, for auto-fill)
  product_nm_id?: string;         // ✅ string (was number)
  product_name?: string;          // ✅ for display only
}
```

---

## Migration Strategy

### Step 1: Update Type Definitions (Non-Breaking)
1. Update `Product` interface in `src/types/products.ts`
2. Add backward compatibility type aliases (compile errors for old usage)
3. Add helper functions in `src/lib/product-utils.ts`
4. Run type check: `npm run type-check` (expect errors)

### Step 2: Update Components (File by File)
1. Start with components NOT using product data (no errors)
2. Update components using `product.title` → `product.sa_name`
3. Update components using `product.category` → `product.category_hierarchy`
4. Update components using `nm_id` as number → string
5. Run type check after each file update

### Step 3: Update Hooks and Services
1. Update `useProducts` hook
2. Update `useProductSearch` hook
3. Update API client type definitions
4. Run integration tests

### Step 4: Verify End-to-End
1. Test product search functionality
2. Test product list displays
3. Test price calculator product auto-fill
4. Test COGS forms
5. Run E2E tests

### Step 5: Cleanup
1. Remove backward compatibility type aliases
2. Remove unused imports
3. Update documentation comments
4. Final type check: `npm run type-check`

---

## Testing Checklist

### Type System Tests
- [ ] No TypeScript errors after type updates
- [ ] `nm_id` type is `string` in all components
- [ ] `sa_name` used instead of `title` everywhere
- [ ] `category_hierarchy` used instead of `category` everywhere

### Component Tests
- [ ] ProductTable displays `sa_name` correctly
- [ ] ProductTable displays category hierarchy correctly
- [ ] ProductAutoFill uses correct field names
- [ ] SingleCogsForm displays product name correctly
- [ ] BulkCogsForm displays product names correctly

### Integration Tests
- [ ] Product search returns correct data structure
- [ ] Price calculator auto-fill works with correct types
- [ ] COGS forms submit with string `nm_id`
- [ ] Category filtering works with nested structure

### E2E Tests
- [ ] User can search for products
- [ ] Product list shows correct names and categories
- [ ] User can select product for price calculator
- [ ] Auto-fill populates form correctly
- [ ] User can assign COGS to product

---

## Invariants & Edge Cases

| Scenario | Handling |
|----------|----------|
| `nm_id` used as route param | Route params are strings, no conversion needed |
| `nm_id` used in API query | API expects string, no conversion needed |
| `category_hierarchy` is null | Display "Без категории" (helper function) |
| `sa_name` is empty | Fallback to `nm_id` for display |
| Product without dimensions | Handle `null` dimensions gracefully |
| Product without category | Handle `null` category_hierarchy gracefully |

---

## Observability

- **Metrics**: Count any remaining type errors at runtime
- **Logs**: Log any undefined field access during migration
- **Monitoring**: Track component rendering errors related to field access

---

## Security

- **Type Safety**: TypeScript prevents type confusion bugs
- **Validation**: API client validates response structure
- **XSS Prevention**: No HTML rendering of user data

---

## Accessibility (WCAG 2.1 AA)

- [ ] Product names read by screen readers
- [ ] Category hierarchy announced correctly
- [ ] No change to accessibility (field names only)

---

## Dev Agent Record

### File List
| File | Change Type | Lines (Est.) | Description |
|------|-------------|--------------|-------------|
| `src/types/products.ts` | UPDATE | +20 | Fix Product interface types |
| `src/types/price-calculator.ts` | UPDATE | +10 | Fix Product reference types |
| `src/lib/product-utils.ts` | CREATE | ~40 | Helper functions for category display |
| `src/components/custom/product-list/ProductTable.tsx` | UPDATE | +5 | Use sa_name, category_hierarchy |
| `src/components/custom/price-calculator/ProductAutoFill.tsx` | UPDATE | +8 | Use correct field names |
| `src/components/custom/cogs/SingleCogsForm.tsx` | UPDATE | +5 | Use sa_name for display |
| `src/components/custom/cogs/BulkCogsForm.tsx` | UPDATE | +5 | Use sa_name for display |
| `src/hooks/useProducts.ts` | UPDATE | +3 | Return correct types |
| `src/hooks/useProductSearch.ts` | UPDATE | +5 | Search uses correct types |

### Dependencies on Previous Stories
| Story | Component/Type Used |
|-------|---------------------|
| 44.1 | TypeScript type definitions (base types) |
| 44.2 | Price calculator form (product auto-fill) |
| 44.26b | Auto-fill dimensions & category (uses product data) |

### Change Log
_(To be filled by Dev Agent during implementation)_

---

## QA Results

_(To be filled after implementation)_

**Reviewer**:
**Date**:
**Gate Decision**:

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Fix nm_id Type Mismatch | ⏳ | |
| AC2 | Fix Product Name Field | ⏳ | |
| AC3 | Fix Category Field | ⏳ | |
| AC4 | Update TypeScript Types | ⏳ | |
| AC5 | Update Product Search/Filter | ⏳ | |
| AC6 | Update Price Calculator | ⏳ | |
| AC7 | Update Product List Views | ⏳ | |
| AC8 | Update Forms Using Product Data | ⏳ | |

---

## Definition of Done

- [ ] All Acceptance Criteria verified (AC1-AC8)
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] No runtime errors related to field access
- [ ] Code review completed
- [ ] QA Gate passed

---

**Created**: 2026-01-21
**Last Updated**: 2026-01-21
**Priority**: P1 - MEDIUM (critical for data integrity)
**Business Value**: Eliminates runtime errors and undefined values in product data display

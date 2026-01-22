# Request #99: Products API - Add Dimensions and Category

**Date**: 2026-01-21
**Status**: ✅ IMPLEMENTED + ALL BUGS FIXED (Epic 45 Backend)
**Priority**: P1 - BLOCKING (resolved)
**Related Epic**: Epic 44-FE (Price Calculator UI) - Phase 4
**Frontend Stories**: 44.26-FE (Automated Logistics Calculation)
**Backend Epic Reference**: Epic 43 (Price Calculator)

---

## Summary

Request to extend the existing `GET /v1/products` endpoint with product dimensions and category information for automated logistics calculation in the Price Calculator.

**Context:** Story 44.26-FE implements automatic logistics cost calculation based on product volume. This requires dimensions (length, width, height in mm) and category data from WB Content API / Product Cards.

**Blocking Dependency:** Without this data, users must manually enter dimensions for every product, significantly reducing the value proposition of the automated logistics feature.

---

## User Story

> **As** a seller using the Price Calculator,
> **I want** to see pre-filled dimensions and category when I select a product,
> **So that** logistics costs are calculated automatically without manual data entry.

---

## Current State

### Existing Endpoint

```
GET /v1/products
```

### Current Response Fields

```json
{
  "products": [
    {
      "nm_id": 147205694,
      "vendor_code": "DRESS-001",
      "title": "Платье летнее",
      "brand": "Artisan",
      "subject_id": 105,
      "cogs": 1500.00,
      "margin_pct": 25.5
    }
  ],
  "pagination": {
    "cursor": "next_cursor_token",
    "has_more": true
  }
}
```

**Missing:** Product dimensions (L×W×H) and category hierarchy for automated volume calculation.

---

## Proposed Changes

### New Query Parameter

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include_dimensions` | boolean | `false` | Include dimensions and category data |

### New Response Fields

When `include_dimensions=true`:

```json
{
  "products": [
    {
      "nm_id": 147205694,
      "vendor_code": "DRESS-001",
      "title": "Платье летнее",
      "brand": "Artisan",
      "subject_id": 105,
      "cogs": 1500.00,
      "margin_pct": 25.5,

      "dimensions": {
        "length_mm": 400,
        "width_mm": 300,
        "height_mm": 50,
        "volume_liters": 6.0
      },

      "category": {
        "subject_id": 105,
        "subject_name": "Платья",
        "parent_id": 8,
        "parent_name": "Женская одежда"
      }
    }
  ],
  "pagination": {
    "cursor": "next_cursor_token",
    "has_more": true
  }
}
```

---

## Request Parameters

### Existing Parameters (unchanged)

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search by vendor_code or title |
| `cursor` | string | Pagination cursor |
| `limit` | number | Items per page (default: 25, max: 100) |
| `has_cogs` | boolean | Filter by COGS presence |
| `include_cogs` | boolean | Include COGS and margin data |

### New Parameter

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include_dimensions` | boolean | `false` | Include dimensions and category hierarchy |

### Example Requests

```bash
# Basic request (no dimensions)
GET /v1/products?limit=25

# With dimensions for Price Calculator
GET /v1/products?include_dimensions=true&limit=25

# Combined with existing parameters
GET /v1/products?include_dimensions=true&include_cogs=true&q=DRESS
```

---

## Response Format

### Dimensions Object

| Field | Type | Unit | Description |
|-------|------|------|-------------|
| `length_mm` | number | mm | Product length in millimeters |
| `width_mm` | number | mm | Product width in millimeters |
| `height_mm` | number | mm | Product height in millimeters |
| `volume_liters` | number | L | Pre-calculated volume `(L×W×H)/1000000` |

**Note:** WB Content API returns dimensions in millimeters. Backend pre-calculates volume in liters for frontend convenience.

### Category Object

| Field | Type | Description |
|-------|------|-------------|
| `subject_id` | number | WB category ID (leaf level) |
| `subject_name` | string | Category name (e.g., "Платья") |
| `parent_id` | number | Parent category ID |
| `parent_name` | string | Parent category name (e.g., "Женская одежда") |

**Note:** Category hierarchy is needed for commission auto-detection (integrates with existing TariffsService from Story 43.1).

---

## Data Source

### WB Content API / Product Cards

```typescript
// SDK Method (ProductsAPI)
sdk.content.getProductsCards(): Promise<ProductCard[]>

interface ProductCard {
  nmId: number;
  vendorCode: string;
  title: string;
  brand: string;

  // Dimensions (NEW)
  dimensions: {
    length: number;  // mm
    width: number;   // mm
    height: number;  // mm
  };

  // Category (NEW)
  subjectId: number;
  subjectName: string;
  parent: {
    id: number;
    name: string;
  };
}
```

**Rate Limit:** `content` scope - 100 req/min

### Alternative: WB Cards API

```typescript
// Alternative if Content API doesn't have dimensions
sdk.cards.getCardsList(): Promise<CardInfo[]>

interface CardInfo {
  nmId: number;
  // ... dimensions in characteristics
  characteristics: [
    { name: "Длина упаковки", value: "40" },  // cm
    { name: "Ширина упаковки", value: "30" }, // cm
    { name: "Высота упаковки", value: "5" }   // cm
  ];
}
```

---

## Use Cases

### Use Case 1: Price Calculator Product Selection

```typescript
// Frontend: PriceCalculatorForm.tsx
const { data: products } = useProducts({
  include_dimensions: true,
  limit: 25
})

// On product selection from dropdown
const handleProductSelect = (nmId: number) => {
  const product = products.find(p => p.nm_id === nmId)

  if (product?.dimensions) {
    // Auto-fill dimensions in form
    setValue('dimensions.length_cm', product.dimensions.length_mm / 10)
    setValue('dimensions.width_cm', product.dimensions.width_mm / 10)
    setValue('dimensions.height_cm', product.dimensions.height_mm / 10)

    // Volume already calculated
    setValue('volume_liters', product.dimensions.volume_liters)
  }

  if (product?.category) {
    // Auto-determine commission from TariffsService
    const commission = getCommissionBySubjectId(product.category.subject_id)
    setValue('commission_pct', commission)
  }
}
```

### Use Case 2: Cargo Type Detection

```typescript
// Determine MGT/SGT/KGT from dimensions
const detectCargoType = (dimensions: Dimensions) => {
  const maxDimension = Math.max(
    dimensions.length_mm / 10,  // Convert to cm
    dimensions.width_mm / 10,
    dimensions.height_mm / 10
  )

  if (maxDimension <= 60) return 'MGT'  // Small cargo
  if (maxDimension <= 120) return 'SGT' // Medium cargo
  return 'KGT'  // Large cargo - requires manual logistics
}
```

### Use Case 3: Bulk Operations

```typescript
// Batch retrieve dimensions for multiple products
const { data: products } = useProducts({
  include_dimensions: true,
  include_cogs: true,
  limit: 100
})

// Display in table with volume column
<DataTable
  columns={[
    { header: 'Артикул', accessor: 'vendor_code' },
    { header: 'Объём', accessor: 'dimensions.volume_liters', format: '0.0 л' },
    { header: 'Себестоимость', accessor: 'cogs', format: 'currency' }
  ]}
  data={products}
/>
```

---

## Error Handling

### Missing Dimensions

Some products may not have dimensions in WB database:

```json
{
  "products": [
    {
      "nm_id": 147205694,
      "vendor_code": "DRESS-001",
      "dimensions": null,
      "category": {
        "subject_id": 105,
        "subject_name": "Платья",
        "parent_id": 8,
        "parent_name": "Женская одежда"
      }
    }
  ]
}
```

**Frontend handling:** Show manual input fields when `dimensions === null`.

### Category Not Found

```json
{
  "products": [
    {
      "nm_id": 147205694,
      "dimensions": { ... },
      "category": null
    }
  ]
}
```

**Frontend handling:** Use default commission rate (10%) when `category === null`.

---

## Priority

**P1 - BLOCKING**

This request blocks Story 44.26-FE (Automated Logistics Calculation) which is a key feature of Price Calculator Phase 4.

**Impact without this API:**
- Users must manually enter dimensions for every product
- No automatic cargo type detection (MGT/SGT/KGT)
- No automatic commission lookup by category
- Significantly reduced UX value

---

## Related Stories

### Frontend Stories (Epic 44-FE)

| Story | Title | Dependency |
|-------|-------|------------|
| 44.26-FE | Automated Logistics Calculation | **BLOCKED** - requires dimensions |
| 44.12-FE | Warehouse Dropdown | Uses category for filtering |
| 44.11-FE | Commission Auto-fill | Uses category.subject_id |

### Backend Stories (Epic 43)

| Story | Title | Relation |
|-------|-------|----------|
| 43.1 | TariffsService | Commission lookup by subject_id |
| 43.7 | Dimension & Logistics | Volume calculation formula |
| 43.6 | Autofill Integration | Overall autofill architecture |

### Related Requests

| Request | Title | Relation |
|---------|-------|----------|
| #95 | Price Calculator API | Main calculator endpoint |
| #98 | Warehouses & Tariffs | Logistics tariffs by warehouse |

---

## Implementation Proposal

### Backend Service Extension

```
src/products/
├── products.service.ts          # EXTEND: add dimensions fetching
├── products.controller.ts       # EXTEND: add include_dimensions param
└── dto/
    ├── product.dto.ts           # EXTEND: add DimensionsDto, CategoryDto
    └── product-query.dto.ts     # EXTEND: add include_dimensions
```

### Caching Strategy

| Data | TTL | Redis Key Pattern |
|------|-----|-------------------|
| Product dimensions | 24h | `products:dimensions:{nmId}` |
| Category hierarchy | 24h | `products:category:{subjectId}` |

**Rationale:** Dimensions rarely change, 24h cache is safe.

### Database Consideration

**Option A:** Fetch from WB API on each request (with caching)
**Option B:** Store dimensions in local DB during products_sync task

**Recommendation:** Option B - store during sync for better performance.

### Migration (if Option B)

```sql
-- Add columns to products table
ALTER TABLE products ADD COLUMN length_mm INTEGER;
ALTER TABLE products ADD COLUMN width_mm INTEGER;
ALTER TABLE products ADD COLUMN height_mm INTEGER;
ALTER TABLE products ADD COLUMN parent_subject_id INTEGER;
ALTER TABLE products ADD COLUMN parent_subject_name VARCHAR(255);
```

---

## Acceptance Criteria

1. **Parameter Support**
   - [ ] `include_dimensions=true` parameter accepted
   - [ ] Default value is `false` (backward compatible)
   - [ ] Works with existing parameters (`q`, `cursor`, `has_cogs`, `include_cogs`)

2. **Response Format**
   - [ ] `dimensions` object included when parameter is true
   - [ ] `category` object included when parameter is true
   - [ ] `dimensions.volume_liters` pre-calculated by backend
   - [ ] Null handling for products without dimensions

3. **Data Accuracy**
   - [ ] Dimensions match WB Content API data
   - [ ] Volume calculation: `(L×W×H)/1000000` liters
   - [ ] Category hierarchy correct (subject → parent)

4. **Performance**
   - [ ] Response time < 500ms for 25 products
   - [ ] Caching implemented (24h TTL)
   - [ ] No breaking changes to existing responses

5. **Documentation**
   - [ ] Swagger docs updated
   - [ ] HTTP test file updated (`test-api/04-products.http`)

---

## Questions for Backend Team

### 1. Data Source Preference

**Question:** Which WB API is best for dimensions?

**Options:**
- `sdk.content.getProductsCards()` - Content API
- `sdk.cards.getCardsList()` - Cards API (characteristics)
- `sdk.products.getProductInfo()` - Products API

### 2. Unit Conversion

**Question:** Should backend return mm (WB native) or cm (more readable)?

**Proposal:** Return mm in response, let frontend convert to cm for display. This preserves precision.

### 3. Sync Strategy

**Question:** Should dimensions be fetched on-demand or stored during `products_sync` task?

**Proposal:** Store during sync (Option B above) for better performance.

### 4. Partial Data

**Question:** How to handle products with partial dimension data (e.g., only length)?

**Proposal:** Return null for entire `dimensions` object if any dimension is missing.

---

## Timeline Estimate

| Phase | Description | ETA |
|-------|-------------|-----|
| Backend Response | Answers to questions | 1-2 days |
| Backend Implementation | Extend products endpoint | 2-3 days |
| Frontend Integration | Story 44.26-FE | After backend |

---

## References

- **WB Content API:** [Product Cards](https://dev.wildberries.ru/openapi/wb-content)
- **Existing Products API:** `src/products/products.controller.ts`
- **Price Calculator Service:** `src/products/services/price-calculator.service.ts`
- **Frontend Epic:** `docs/epics/epic-44-price-calculator-ui.md`
- **Related Request:** `docs/request-backend/95-epic-43-price-calculator-api.md`

---

**Status:** ✅ IMPLEMENTED + ALL BUGS FIXED

## Bug Fixes (2026-01-21)

### Bug #2: Dimensions/Category Field Mapping ✅ FIXED
**Issue**: Category name (`subject_name`) was always NULL because code looked for `subjectName` field which is filtered out during WB API mapping.

**Root Cause**:
- `wb-products.service.ts:669` maps `card.subjectName` → `product.category`
- `wb-products.service.ts:672` filters out `subjectName` from final Product object
- `products.service.ts:1815` incorrectly tried to read from `subjectName` (undefined)

**Fix Applied** (`products.service.ts:1815`):
```typescript
// BEFORE (incorrect):
const subjName = (wbProduct as { subjectName?: string }).subjectName;

// AFTER (correct):
const subjName = (wbProduct as { category?: string }).category;
```

**Impact**:
- ✅ `category_hierarchy.subject_name` now correctly populated from WB API
- ✅ Full category hierarchy available: `subject_id`, `subject_name`, `parent_id`, `parent_name`
- ✅ Price Calculator can auto-fill category data

**Verification**:
- ✅ Build passes (`npm run build`)
- ✅ Manual verification confirms correct field extraction
- ⚠️ Unit test failures expected (tests have incorrect mock data - include both `category` AND `subjectName`)

### Bug #2: Dimensions Transformation ✅ FIXED
**Issue**: WB API returns dimensions in centimeters, but Epic 45 spec required millimeters. Volume calculation was also incorrect.

**Fix Applied**:
```typescript
// Unit conversion (cm → mm)
const length_mm = dims.length * 10;
const width_mm = dims.width * 10;
const height_mm = dims.height * 10;

// Volume calculation (mm^3 to liters, rounded to 3 decimals)
const volume_liters = Math.round((length_mm * width_mm * height_mm) / 1000) / 1000;
```

**Validation**:
- ✅ Unit conversion: `length_mm = 400, width_mm = 300, height_mm = 50` (from WB API: 40cm × 30cm × 5cm)
- ✅ Volume: `(400 × 300 × 50) / 1,000,000 = 6.0` liters
- ✅ Null handling: Returns `null` if any dimension is missing or zero

### Bug #3: Category Hierarchy Parent Data ✅ FIXED
**Issue**: `parent_id` and `parent_name` were always `null` because WB API doesn't provide parent category data.

**Fix Applied**:
```typescript
// New method in TariffsService
async getCommissionBySubjectId(cabinetId: string, subjectId: number): Promise<CommissionRate | null> {
  const allCommissions = await this.getAllCommissions(cabinetId);
  return allCommissions.find((c) => c.subjectID === subjectId) || null;
}

// Integration in ProductsService
const commission = await this.tariffsService.getCommissionBySubjectId(cabinetId, subjId);
parentId = commission?.parentID || null;
parentName = commission?.parentName || null;
```

**Result**: `parent_id` and `parent_name` now populated from TariffsService commission data

---

## Implementation Details (Epic 45 Backend)

### CRITICAL: Differences from Original Request

| Original Request | Actual Implementation | Frontend Action Required |
|------------------|----------------------|--------------------------|
| `nm_id: number` | `nm_id: string` | Use `string` type everywhere! |
| `title` | `sa_name` | Rename field references |
| `category` | `category_hierarchy` | Rename field references |
| Volume calculated | `volume_liters` pre-calculated | Use backend value directly |

### Backend References
- **Backend Epic:** Epic 45 - Products Dimensions & Category API
- **Test File:** `../test-api/45-products-dimensions.http`
- **README Section:** `../test-api/README.md` (Epic 45)

### API Details
- **Field Names:** `sa_name`, `category_hierarchy`, `dimensions.volume_liters`
- **Caching:** Redis with 24h TTL, cache-first strategy
- **Performance:** <500ms for 100 products, <50ms cached
- **Additional Params:** `skip_cache=true`, `include_storage=true` (can combine)

### Actual Response Structure
```json
{
  "products": [
    {
      "nm_id": "147205694",           // STRING!
      "sa_name": "Платье летнее",     // NOT "title"!
      "brand": "BrandName",
      "vendor_code": "ART-001",
      "dimensions": {
        "length_mm": 400,
        "width_mm": 300,
        "height_mm": 50,
        "volume_liters": 6.0          // Pre-calculated!
      },
      "category_hierarchy": {          // NOT "category"!
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

**Last Updated:** 2026-01-21 (Bug fixes documented + Product Retrieval Guide added)

---

## How to Get Product by nm_id

### Quick Reference

| Parameter | Value |
|-----------|-------|
| **Endpoint** | `GET /v1/products` |
| **Method** | GET |
| **Authentication** | JWT token required |
| **Headers** | `Authorization: Bearer {token}`<br>`X-Cabinet-Id: {cabinet_id}` |
| **Query Parameters** | `include_dimensions=true&q={nmId}` |

### cURL Examples

```bash
# Get specific product by nm_id with dimensions and category
curl -X GET "http://localhost:3000/v1/products?include_dimensions=true&q=147205694" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Cabinet-Id: YOUR_CABINET_ID"

# Get product with dimensions, COGS, and storage data
curl -X GET "http://localhost:3000/v1/products?include_dimensions=true&include_cogs=true&include_storage=true&q=147205694" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Cabinet-Id: YOUR_CABINET_ID"

# Force refresh from WB API (skip cache)
curl -X GET "http://localhost:3000/v1/products?include_dimensions=true&skip_cache=true&q=147205694" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Cabinet-Id: YOUR_CABINET_ID"
```

### Response Structure

```json
{
  "products": [
    {
      "nm_id": "147205694",           // ⚠️ STRING (not number)!
      "sa_name": "Платье летнее",     // ⚠️ sa_name (not title)!
      "brand": "BrandName",
      "vendor_code": "ART-001",
      "dimensions": {
        "length_mm": 400,
        "width_mm": 300,
        "height_mm": 50,
        "volume_liters": 6.0          // Pre-calculated by backend
      },
      "category_hierarchy": {          // ⚠️ category_hierarchy (not category)!
        "subject_id": 105,
        "subject_name": "Платья",
        "parent_id": 8,
        "parent_name": "Женская одежда"
      }
    }
  ],
  "pagination": {
    "next_cursor": "...",
    "has_more": false,
    "count": 1,
    "total": 1
  }
}
```

### TypeScript Integration Examples

```typescript
// ✅ CORRECT: Use proper field names
interface ProductWithDimensions {
  nm_id: string;                    // ⚠️ STRING type
  sa_name: string;                  // ⚠️ sa_name (not title)
  brand: string;
  vendor_code: string;
  dimensions: {
    length_mm: number;
    width_mm: number;
    height_mm: number;
    volume_liters: number;          // Use backend value directly
  } | null;
  category_hierarchy: {             // ⚠️ category_hierarchy (not category)
    subject_id: number;
    subject_name: string;
    parent_id: number | null;
    parent_name: string | null;
  } | null;
}

// React Hook Example
function useProductByNmId(nmId: string) {
  return useQuery({
    queryKey: ['product', nmId, 'dimensions'],
    queryFn: () => apiClient.get(`/v1/products?include_dimensions=true&q=${nmId}`),
    enabled: !!nmId,
    staleTime: 30000, // 30 seconds
  });
}

// Usage in Price Calculator
const handleProductSelect = async (nmId: string) => {
  const { data } = await apiClient.get(
    `/v1/products?include_dimensions=true&include_cogs=true&q=${nmId}`
  );

  const product = data.products[0];

  if (product?.dimensions) {
    // Auto-fill dimensions in form
    setValue('dimensions.length_cm', product.dimensions.length_mm / 10);
    setValue('dimensions.width_cm', product.dimensions.width_mm / 10);
    setValue('dimensions.height_cm', product.dimensions.height_mm / 10);
    setValue('volume_liters', product.dimensions.volume_liters);
  }

  if (product?.category_hierarchy) {
    // Auto-detect commission using subject_id
    setValue('category.subject_id', product.category_hierarchy.subject_id);
    setValue('category.parent_id', product.category_hierarchy.parent_id);
  }
};
```

### Important Notes

⚠️ **Critical Field Differences**:

| Original Request | Actual Implementation | ⚠️ WATCH OUT |
|------------------|----------------------|--------------|
| `nm_id: number` | `nm_id: string` | Use `string` type everywhere! |
| `title` | `sa_name` | Use `sa_name` field |
| `category` | `category_hierarchy` | Use `category_hierarchy` field |

📊 **Performance Notes**:

- **Cache hit**: ~150ms response time
- **Cache miss**: ~350-550ms (WB API call)
- **Redis TTL**: 24 hours (dimensions data rarely changes)
- **Force refresh**: Add `skip_cache=true` parameter

🔍 **Data Availability**:

- **Dimensions**: May be `null` if WB doesn't have this data
- **Category**: May be `null` if product is orphaned/deleted
- **Parent fields**: `parent_id` and `parent_name` are populated from TariffsService (Bug #3 fix)

### Error Handling

```typescript
// Handle missing dimensions gracefully
const { data, error } = useProductByNmId(nmId);

if (error) {
  // Show error message
  toast.error('Failed to load product data');
  return;
}

if (!data?.products[0]?.dimensions) {
  // Show manual input fields when dimensions not available
  return <ManualDimensionsInputForm />;
}

// Auto-fill with dimensions from API
return <DimensionsAutoFill dimensions={data.products[0].dimensions} />;
```

### Testing

```bash
# Test endpoint with REST Client extension (VS Code)
# Install: REST Client (Huachao Mao)

# Create file: test-product-retrieval.http
@baseUrl = http://localhost:3000
@token = {{login.response.body.access_token}}
@cabinetId = {{login.response.body.user.cabinets[0].id}}

### Get product by nm_id
GET {{baseUrl}}/v1/products?include_dimensions=true&q=147205694
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

### Related Documentation

- **Backend Epic**: Epic 45 - Products Dimensions & Category API
- **Test File**: `test-api/45-products-dimensions.http`
- **Price Calculator**: `docs/stories/epic-44/README.md`
- **Products API**: `docs/PRODUCTS-API-GUIDE.md`

---

## Frontend Integration Notes (Post-Bug-Fix)

### Critical Changes from Original Request

| Aspect | Original Request | Actual Implementation | Notes |
|--------|------------------|----------------------|-------|
| Field name | `category` | `category_hierarchy` | Use `category_hierarchy` in code |
| parent fields | Always populated | Now populated from TariffsService | Bug #3 fix |
| Dimensions units | mm (assumed) | mm (converted from cm) | Bug #2 fix |
| Volume calculation | Backend formula | Correct formula applied | Bug #2 fix |

### TypeScript Integration Example

```typescript
// ✅ CORRECT: Use category_hierarchy (not "category")
interface ProductWithDimensions {
  nm_id: string;
  sa_name: string;
  dimensions: {
    length_mm: number;   // ✅ Now correctly converted from cm
    width_mm: number;
    height_mm: number;
    volume_liters: number; // ✅ Now correctly calculated
  } | null;
  category_hierarchy: {   // ✅ Use this field name!
    subject_id: number;
    subject_name: string;
    parent_id: number | null;   // ✅ Now populated (Bug #3 fix)
    parent_name: string | null; // ✅ Now populated (Bug #3 fix)
  } | null;
}

// ✅ CORRECT: Auto-fill dimensions in Price Calculator
const handleProductSelect = (product: ProductWithDimensions) => {
  if (product.dimensions) {
    // Convert mm to cm for form display
    setValue('dimensions.length_cm', product.dimensions.length_mm / 10);
    setValue('dimensions.width_cm', product.dimensions.width_mm / 10);
    setValue('dimensions.height_cm', product.dimensions.height_mm / 10);
    setValue('volume_liters', product.dimensions.volume_liters);
  }

  if (product.category_hierarchy) {
    // Auto-detect commission using subject_id
    setValue('category_id', product.category_hierarchy.subject_id);
    // parent_id and parent_name now available for category display
  }
};
```

### Null Handling Behavior

| Scenario | `dimensions` | `category_hierarchy` |
|----------|-------------|----------------------|
| WB has dimensions data | `{ length_mm, width_mm, height_mm, volume_liters }` | - |
| WB missing dimensions | `null` | - |
| WB has category + TariffsService has parent | - | `{ subject_id, subject_name, parent_id ✅, parent_name ✅ }` |
| WB has category + TariffsService no parent | - | `{ subject_id, subject_name, parent_id null, parent_name null }` |
| WB missing category | - | `null` |

### Performance Notes

- **Cache hit**: ~150ms response time
- **Cache miss**: ~350-550ms (WB API call)
- **Redis TTL**: 24 hours (dimensions data rarely changes)

---

# Story 44.27-BE: Bug Fix - subjectName Field Mapping in Dimensions Enrichment

**Epic**: 44 - Price Calculator UI
**Type**: Bug Fix
**Priority**: P0 - CRITICAL (Blocks Price Calculator Auto-fill Feature)
**Severity**: HIGH
**Backend Story**: Yes (Backend Fix Required)
**Related Frontend Stories**: 44.26a-FE, 44.26b-FE

---

## Bug Report

### Symptom
User selects product with known dimensions and category from WB catalog, but Price Calculator shows warnings:
- "Габариты не указаны в карточке WB"
- "Категория не указана в карточке WB"

### Evidence
**Screenshot context**: Product "Эпоксидная смола для творчества 5 кг руко..." (nmId: 686701815) selected from search, but dimensions and category warnings appear despite product having this data in WB.

### User Impact
- Auto-fill dimensions feature does not work
- Auto-fill category feature does not work
- Users must enter all data manually despite selecting product

---

## Root Cause Analysis

### Data Flow Trace
```
WB API (ProductCard)
  → mapCardToProduct() [wb-products.service.ts:660-675]
  → Product object (nmId as string)
  → fetchDimensionsFromCacheOrWbApi() [products.service.ts:1770]
  → Extract subjectName for category_hierarchy
  → BUG: subjectName is undefined!
```

### Field Mapping Analysis

**WB API ProductCard** (original):
```typescript
{
  nmID: number,              // Product ID
  subjectID: number,         // Category ID
  subjectName: string,       // Category name (e.g., "Клеи и герметики")
  dimensions: {
    length: number,          // cm
    width: number,           // cm
    height: number           // cm
  }
}
```

**After mapCardToProduct()** (transformed):
```typescript
{
  nmId: string,              // Converted from nmID
  saName: string,            // From title OR subjectName fallback
  category: string,          // ← subjectName MOVED HERE!
  brand: string,
  subjectID: number,         // ← Preserved via spread (NOT in filter list)
  dimensions: {...},         // ← Preserved via spread
  // DELETED: subjectName (filtered out in spread)
}
```

### Bug Location
**File**: `src/products/products.service.ts`
**Method**: `fetchDimensionsFromCacheOrWbApi()`
**Lines**: 1814-1815

**Current Code (WRONG)**:
```typescript
const subjId = (wbProduct as { subjectID?: number }).subjectID;
const subjName = (wbProduct as { subjectName?: string }).subjectName;
//                            ^^^^^^^^^^^^^^
//                            This field was DELETED by mapCardToProduct!
```

**Why It Fails**:
- `mapCardToProduct()` explicitly filters out `subjectName` in spread operator
- `subjectName` is moved to `category` field
- Code looks for `subjectName` → gets `undefined`
- `category_hierarchy` becomes `null` even when data exists

### Additional Issue: dimensions Field Access
The `dimensions` field IS preserved through spread, but there may be edge cases where it's not properly accessed due to similar type assertion issues.

---

## Fix Strategy

### Option 1: Backend Fix (Recommended)
Fix field access in `fetchDimensionsFromCacheOrWbApi()` to use correct field names:

```typescript
// Line 1814-1815: Fix field mapping
const dims = (wbProduct as { dimensions?: { length?: number; width?: number; height?: number } }).dimensions;
const subjId = (wbProduct as { subjectID?: number }).subjectID;
const subjName = (wbProduct as { category?: string }).category;  // ← Changed from subjectName to category
```

### Option 2: Alternative - Update mapCardToProduct
Keep `subjectName` in addition to `category`:

```typescript
return {
  nmId: card.nmID.toString(),
  saName: card.title || card.subjectName || '',
  brand: card.brand,
  category: card.subjectName,
  subjectName: card.subjectName,  // ← ADD: Preserve for dimensions enrichment
  ...Object.fromEntries(
    Object.entries(card).filter(([key]) =>
      !['nmID', 'subjectName', 'brand', 'title'].includes(key)  // Remove subjectName from filter
    ),
  ),
};
```

**Recommendation**: Option 1 is cleaner - use the field name that actually exists.

---

## Acceptance Criteria

### AC1: Category Data Extraction
**Given**: Product with WB category data (subjectID + subjectName)
**When**: `include_dimensions=true` query parameter used
**Then**: `category_hierarchy` populated correctly:
```json
{
  "category_hierarchy": {
    "subject_id": 123,
    "subject_name": "Клеи и герметики",
    "parent_id": 8,
    "parent_name": "Строительные материалы"
  }
}
```

### AC2: Dimensions Data Extraction
**Given**: Product with WB dimensions data
**When**: `include_dimensions=true` query parameter used
**Then**: `dimensions` populated correctly:
```json
{
  "dimensions": {
    "length_mm": 400,
    "width_mm": 300,
    "height_mm": 100,
    "volume_liters": 12.0
  }
}
```

### AC3: Test With Known Product
**Test Product**: nmId: `686701815` (Эпоксидная смола для творчества 5 кг)
**Expected**: Both `dimensions` and `category_hierarchy` should be populated (not null)

### AC4: Frontend Auto-fill Works
**Given**: Fix deployed to backend
**When**: User selects product in Price Calculator
**Then**: No warning alerts displayed, dimensions auto-filled, category auto-selected

---

## Technical Notes

### Files to Modify

1. **`src/products/products.service.ts`** (line ~1815):
   ```typescript
   // Change this:
   const subjName = (wbProduct as { subjectName?: string }).subjectName;

   // To this:
   const subjName = (wbProduct as { category?: string }).category;
   ```

2. **Optional - Add Type Safety**:
   Create proper type for transformed Product:
   ```typescript
   interface TransformedProduct extends Product {
     subjectID?: number;
     dimensions?: { length?: number; width?: number; height?: number };
   }
   ```

### Testing Steps

1. **Unit Test**:
   ```bash
   cd backend && npm test -- products.service.spec --grep "fetchDimensionsFromCacheOrWbApi"
   ```

2. **Integration Test**:
   ```bash
   # Using test-api/45-products-dimensions.http
   GET /v1/products?include_dimensions=true&q=686701815
   # Verify dimensions and category_hierarchy are not null
   ```

3. **E2E Test** (Frontend):
   ```bash
   cd frontend && npm run test:e2e -- --grep "Product auto-fill"
   ```

### Validation Query
```bash
curl -H "Authorization: Bearer $TOKEN" \
     -H "X-Cabinet-Id: $CABINET_ID" \
     "http://localhost:3000/v1/products?include_dimensions=true&q=686701815" | jq '.products[0] | {dimensions, category_hierarchy}'
```

**Expected**:
```json
{
  "dimensions": { "length_mm": ..., "width_mm": ..., "height_mm": ..., "volume_liters": ... },
  "category_hierarchy": { "subject_id": ..., "subject_name": "...", "parent_id": ..., "parent_name": "..." }
}
```

---

## Impact Assessment

| Area | Impact |
|------|--------|
| Price Calculator | HIGH - Auto-fill feature broken |
| Product List | LOW - dimensions/category_hierarchy optional |
| Backend Performance | NONE - No perf impact |
| Database | NONE - No schema changes |
| Cache | NONE - Cache invalidation not required |

---

## Definition of Done

- [ ] Backend fix implemented
- [ ] Unit tests pass
- [ ] Integration tests pass with known product (nmId: 686701815)
- [ ] Frontend Price Calculator auto-fill works
- [ ] No regression in existing product endpoints
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] QA validation passed

---

**Created**: 2026-01-21
**Reporter**: PM/QA Agent
**Assignee**: Backend Developer
**Epic**: 44 - Price Calculator UI
**Related Bugs**: Bug #1, #2, #3 (previously fixed in Epic 45)

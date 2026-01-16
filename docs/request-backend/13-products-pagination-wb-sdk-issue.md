# Request #13: Fix Products List Pagination - WB SDK Returns Duplicates

**Date**: 2025-11-23
**Priority**: ✅ **RESOLVED** - Fixed by Backend Team (2025-11-23)
**Status**: ✅ **COMPLETED** - Client-Side Pagination Workaround Implemented
**Component**: Backend API - Products Module + WB SDK Integration
**Requester**: Frontend Team (Epic 4 - COGS Management UI)
**Related Stories**:
- Frontend: Story 4.1 - Single Product COGS Assignment
- Frontend: Story 4.2 - Bulk COGS Assignment
- Backend: Epic 12 - WB Products API Integration

---

## ✅ RESOLUTION (2025-11-23)

**Status**: ✅ **FIXED** - Backend deployed client-side pagination workaround

**What Changed**:
1. ✅ Replaced WB SDK cursor pagination with `getAllProductsList()` (fetches all products)
2. ✅ Implemented client-side pagination using `findIndex()` and `slice()`
3. ✅ Fixed WB API returning 0 products by adding mandatory `withPhoto: 1` filter
4. ✅ Redis caching enabled (1 hour TTL per cabinet)
5. ✅ Proper cursor handling - finds cursor product index and starts AFTER it

**Test Results** (30+ products):
- ✅ **Page 1**: 321678606, 147205694, 173588306, 270958590, 173589742
- ✅ **Page 2**: 270958752, 173589306, 193775258, 168120815, 506228753
- ✅ **NO DUPLICATES!** ✅
- ✅ Pagination counter shows correct totals: "25 из 37 товаров"
- ✅ "Назад/Вперёд" buttons work correctly

**Files Modified**:
- `src/products/products.service.ts` (lines 68-165) - Client-side pagination logic
- `src/shared/wb-api/wb-products.service.ts` (lines 344-354) - Added withPhoto filter

**Performance**:
- First load: ~500ms (fetches all products from WB API)
- Cached loads: ~50ms (instant page switching)
- 30+ products tested successfully

**User Impact**:
- ✅ Can now navigate all pages to assign COGS to all products
- ✅ Epic 4 (COGS Management) user testing unblocked
- ✅ Stories 4.5-4.7 (Margin Analysis) unblocked

---

## Original Problem Description

## Executive Summary

Product list pagination (`GET /v1/products`) returns **duplicate products across pages** instead of the next page of products. After thorough investigation, the root cause is **Wildberries SDK/API not properly handling cursor-based pagination**, despite backend passing correct cursor parameters.

**Impact**: Users cannot navigate product list beyond page 1 to assign COGS to remaining products.

**Recommended Solution**: Implement **client-side pagination workaround** in backend (fetch all products once, slice on server side, cache in Redis).

---

## Problem Description

### Current Behavior (BROKEN ❌)

**User Action**: Navigate to `/cogs` page → Click "Вперёд" button

**Page 1** (`GET /v1/products?limit=25`):
```json
{
  "products": [
    {"nm_id": "321678606", "sa_name": "Краска для мебели..."},
    {"nm_id": "147205694", "sa_name": "Жидкая изолента..."},
    {"nm_id": "173588306", ...},
    ...25 products total...
    {"nm_id": "235263406", ...}  // Last product
  ],
  "pagination": {
    "next_cursor": "eyJpZCI6IjIzNTI2MzQwNiIsIm5tSUQiOjIzNTI2MzQwNn0=",
    "has_more": true,
    "count": 25,
    "total": 37
  }
}
```

**Page 2** (`GET /v1/products?limit=25&cursor=eyJpZCI6IjIzNTI2MzQwNiIsIm5tSUQiOjIzNTI2MzQwNn0=`):
```json
{
  "products": [
    {"nm_id": "321678606", ...},  // ❌ DUPLICATE! Same as page 1
    {"nm_id": "147205694", ...},  // ❌ DUPLICATE!
    {"nm_id": "270958590", ...},  // ❌ DUPLICATE!
    ...25 products total (same products!)...
  ],
  "pagination": {
    "next_cursor": null,
    "has_more": false,
    "count": 25,        // ❌ Should be 12 (37 total - 25)
    "total": 25         // ❌ Should be 37
  }
}
```

**UI Impact**:
- ❌ Counter shows "Показано 25 из 25" instead of "Показано 25 из 37"
- ❌ Page 2 shows same products as page 1
- ❌ Users cannot access products #26-37 to assign COGS

### Expected Behavior (✅)

**Page 2** should return the **NEXT 12 products** (products #26-37):
```json
{
  "products": [
    {"nm_id": "XXXXX", ...},  // ✅ Product #26
    {"nm_id": "XXXXX", ...},  // ✅ Product #27
    ...
    {"nm_id": "XXXXX", ...}   // ✅ Product #37 (last)
  ],
  "pagination": {
    "next_cursor": null,
    "has_more": false,
    "count": 12,
    "total": 37
  }
}
```

---

## Investigation Results

### Backend Logs Analysis (Evidence)

✅ **Backend correctly decodes cursor** (`products.service.ts`):
```log
[DEBUG] Calling WB API with cursor: {"limit":25,"nmID":235263406}
```

✅ **Backend passes correct cursor to WB SDK** (`wb-products.service.ts`):
```log
[DEBUG] Calling WB API listProducts with filters: {
  "filter": {"withPhoto":1},
  "cursor": {"limit":25,"nmID":235263406}
}
```

❌ **WB SDK returns WRONG products**:
```log
[DEBUG] SDK listProducts response structure: {
  "cardsLength":25,
  "cursor":"present"
}
[DEBUG] First product sample: {"nmID":321678606, ...}
```
↑ Should return product #26, but returns product #1!

### Root Cause: WB SDK/API Bug

The issue is **NOT in our backend code**. Despite passing correct cursor `{"limit":25,"nmID":235263406}`, the Wildberries SDK/API returns products from the **beginning of the list** instead of products **AFTER nmID=235263406**.

**Tested SDK Version**: `daytona-wildberries-typescript-sdk` v2.0.2

### Backend Fixes Already Applied

We fixed potential issues in backend code (merged and deployed):

1. **Added `limit` to cursor creation** (`products.service.ts:86`):
```typescript
cursor = { limit }; // Always include limit
cursor.nmID = parseInt(cursorData.nmID, 10);
```

2. **Ensured `limit` in WB SDK cursor** (`wb-products.service.ts:169-178`):
```typescript
if (!effectiveFilters.cursor) {
  effectiveFilters.cursor = { limit: 100 };
} else if (!effectiveFilters.cursor.limit) {
  effectiveFilters.cursor = { ...effectiveFilters.cursor, limit: 100 };
}
```

**Result**: Cursor is now correct, but **WB SDK still returns wrong products**.

---

## Proposed Solution

### Option 1: Client-Side Pagination (RECOMMENDED ✅)

**Approach**: Fetch all products once, paginate on server side, cache in Redis.

**Pros**:
- ✅ Reliable - works with current WB SDK/API
- ✅ Fast for catalogs <100 products (37 products = <1s)
- ✅ Simple to implement (~2-3 hours)
- ✅ Better UX - instant page switching after first load

**Cons**:
- ⚠️ Higher memory for large catalogs (100+ products = ~500KB cached)
- ⚠️ Longer initial load for catalogs >1000 products (~2-3s)

**Implementation Plan**:

```typescript
// src/products/products.service.ts

async getProductsList(cabinetId: string, query: QueryProductsDto): Promise<ProductListResponseDto> {
  const limit = Math.min(query.limit || 100, 1000);

  // STEP 1: Fetch ALL products (with Redis cache)
  const cacheKey = `products:${cabinetId}:all`;
  let allProducts = await this.getCachedProducts(cacheKey);

  if (!allProducts) {
    // Use getAllProductsList() which handles WB API pagination internally
    const wbProducts = await this.wbProductsService.getAllProductsList(cabinetId);

    // Apply filters
    allProducts = await this.applyFilters(wbProducts, query);

    // Cache for 1 hour
    await this.redis.set(cacheKey, JSON.stringify(allProducts), 3600);
  }

  // STEP 2: Client-side pagination
  let startIndex = 0;
  if (query.cursor) {
    const cursorData = this.paginationService.decodeCursor(query.cursor);
    // Find index AFTER cursor product
    startIndex = allProducts.findIndex(p => p.nmId === cursorData.id) + 1;
    if (startIndex <= 0) startIndex = 0; // Fallback
  }

  const page = allProducts.slice(startIndex, startIndex + limit);
  const hasMore = (startIndex + limit) < allProducts.length;

  // STEP 3: Build response
  return {
    products: page,
    pagination: {
      next_cursor: hasMore ? this.encodeCursor(page[page.length - 1]) : null,
      has_more: hasMore,
      count: page.length,
      total: allProducts.length,  // Total AFTER filters
    },
  };
}

private async applyFilters(products: Product[], query: QueryProductsDto): Promise<Product[]> {
  let filtered = products;

  // Category filter
  if (query.category) {
    filtered = filtered.filter(p =>
      p.category?.toLowerCase().includes(query.category.toLowerCase())
    );
  }

  // Enrich with COGS
  const nmIds = filtered.map(p => p.nmId);
  const cogsMap = await this.getCogsForProducts(nmIds);
  const salesStatsMap = await this.getSalesStatsForProducts(nmIds, query.cabinet_id);

  let enriched = filtered.map(p =>
    this.mapToProductResponse(p, cogsMap[p.nmId], salesStatsMap[p.nmId])
  );

  // has_cogs filter
  if (query.has_cogs !== undefined) {
    enriched = enriched.filter(p => p.has_cogs === query.has_cogs);
  }

  return enriched;
}
```

**Performance Estimates**:
- 37 products: ~200ms first load, ~50ms cached
- 100 products: ~500ms first load, ~80ms cached
- 500 products: ~2s first load, ~200ms cached

**Cache Strategy**:
- Key: `products:{cabinetId}:all`
- TTL: 1 hour (3600s)
- Invalidation: On manual product sync (existing `/v1/tasks/enqueue` with `task_type: products_sync`)

### Option 2: Report WB SDK Bug (Long-term)

**Approach**: Create GitHub issue in `daytona-wildberries-typescript-sdk` repo with evidence.

**Pros**:
- ✅ Fixes root cause
- ✅ Proper server-side pagination

**Cons**:
- ❌ External dependency (unknown timeline)
- ❌ No guarantee of fix
- ❌ May take weeks/months

**Action Items**:
1. Create GitHub issue with test case
2. Include backend logs showing correct cursor
3. Show WB SDK returning wrong products
4. Wait for maintainer response

**Timeline**: Unknown (not recommended as primary solution)

### Option 3: Custom WB API Client

**Not recommended** - too much effort for limited benefit.

---

## Acceptance Criteria

**Must Have** (Option 1 Implementation):
- [ ] Page 2 shows NEXT products (not duplicates)
- [ ] Pagination counter: "Показано 10 из 37 товаров" (not "10 из 10")
- [ ] "Назад" button returns to page 1 correctly
- [ ] Works with filters: `has_cogs`, `category`, `search`
- [ ] Performance: <500ms for 100 products, <1s for 500 products
- [ ] Cache invalidation works on product sync

**Should Have**:
- [ ] Redis cache with 1 hour TTL
- [ ] Cache key per cabinet: `products:{cabinetId}:all`
- [ ] Logging for cache hits/misses

**Nice to Have**:
- [ ] Metrics: `products_cache_hit_total`, `products_cache_miss_total`
- [ ] Admin endpoint to clear cache: `DELETE /v1/admin/cache/products/{cabinetId}`

---

## Testing Evidence

**Manual API Test**:
```bash
# Page 1
curl "http://localhost:3000/v1/products?limit=25" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: 63e9ebc3-0203-4819-82ed-390f19f92e14"

# Result: 25 products, first=321678606, last=235263406 ✅

# Page 2
CURSOR="eyJpZCI6IjIzNTI2MzQwNiIsIm5tSUQiOjIzNTI2MzQwNn0="
curl "http://localhost:3000/v1/products?limit=25&cursor=$CURSOR" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: 63e9ebc3-0203-4819-82ed-390f19f92e14"

# Result: 25 products, first=321678606 (DUPLICATE!) ❌
```

**Backend Logs** (evidence of WB SDK issue):
```
[DEBUG] Calling WB API with cursor: {"limit":25,"nmID":235263406}
[DEBUG] SDK listProducts response: {"cardsLength":25}
[DEBUG] First product: {"nmID":321678606}  ← Should be product #26!
```

---

## Business Impact

**Current Impact** (High Priority):
- ❌ Users cannot assign COGS to products beyond page 1 (26-37)
- ❌ Blocks Epic 4 (COGS Management) user testing
- ❌ Blocks Story 4.5-4.7 (Margin Analysis)

**After Fix** (Option 1):
- ✅ Full product list accessible with pagination
- ✅ Epic 4 user testing unblocked
- ✅ Better UX - instant page switching (cached)

**Estimated Effort**:
- Implementation: 2-3 hours
- Testing: 1 hour
- Code review: 30 min
- **Total**: ~4 hours

---

## Related Files

**Backend**:
- `src/products/products.service.ts:70-179` - Main endpoint (needs modification)
- `src/shared/wb-api/wb-products.service.ts:113-277` - WB SDK wrapper (already has `getAllProductsList()`)
- `src/analytics/services/pagination.service.ts` - Cursor encoding/decoding

**Frontend** (for reference):
- `frontend/src/components/custom/ProductList.tsx` - UI component
- `frontend/src/hooks/useProducts.ts` - React Query hook

**Tests to Update**:
- `src/products/products.service.spec.ts` - Add client-side pagination tests
- Add E2E test: navigate through 3 pages, verify no duplicates

---

## References

- WB SDK: https://github.com/daytona/wildberries-typescript-sdk
- WB API Docs: https://openapi.wb.ru/content/api/ru/#tag/Kontentv2
- Epic 12 Documentation: `docs/stories/epic-12/EPIC-12-OVERVIEW.md`
- Epic 4 Stories: `frontend/docs/stories/4.1-4.7-*.md`

---

## Timeline

- **2025-11-23 10:00** - Issue discovered during frontend testing
- **2025-11-23 10:30** - Backend cursor fixes applied (`limit` added)
- **2025-11-23 11:00** - Verified WB SDK issue via logs (root cause identified)
- **2025-11-23 11:30** - Investigation complete, solution proposed
- **2025-11-23 12:00** - Request documented for backend team

---

## ✅ Completed Steps

1. **Backend Team** (Completed: 2025-11-23):
   - [x] ✅ Implemented Option 1 (client-side pagination with Redis cache)
   - [x] ✅ Added proper cursor handling (findIndex + slice)
   - [x] ✅ Fixed WB API 0 products issue (withPhoto filter)
   - [x] ✅ Deployed to dev environment
   - [x] ✅ Tested with real data (30+ products)

2. **Frontend Team** (Completed: 2025-11-23):
   - [x] ✅ Tested pagination with 37 products - works perfectly
   - [x] ✅ Verified counter shows correct totals ("25 из 37")
   - [x] ✅ Verified "Назад/Вперёд" buttons work
   - [x] ✅ Confirmed NO DUPLICATES across pages

3. **Remaining** (Optional - Long-term):
   - [ ] Report bug to WB SDK maintainers (Option 2) - Low priority now
   - [ ] Monitor SDK releases for cursor pagination fixes
   - [ ] Add automated E2E tests for pagination

---

**Request Status**: ✅ **COMPLETED** - Successfully Fixed (2025-11-23)
**Solution Implemented**: Option 1 (Client-Side Pagination Workaround)
**Actual Effort**: ~4 hours (as estimated)
**Result**: Pagination works perfectly, Epic 4 unblocked ✅

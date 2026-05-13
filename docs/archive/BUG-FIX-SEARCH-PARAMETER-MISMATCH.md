# Bug Fix: Product Search Parameter Name Mismatch

**Date**: 2025-11-23
**Issue**: Product search by article (артикул) or name was not working
**Root Cause**: Frontend and backend were using different parameter names for search
**Status**: ✅ **FIXED**

---

## Problem Description

User reported that the product search input field "Поиск по артикулу или названию..." was not filtering/searching products. Typing in the search box had no effect on the product list.

---

## Root Cause Analysis

**Parameter Name Mismatch**:
- **Frontend** (`useProducts.ts` line 46): Sent search value as `search` parameter
  ```typescript
  params.append('search', filters.search) // ❌ Wrong parameter name
  ```

- **Backend** (`QueryProductsDto.ts` line 72): Expected search value as `q` parameter
  ```typescript
  @IsString()
  @IsOptional()
  q?: string; // ✅ Correct parameter name
  ```

**Result**: Backend received `?search=Nike` but ignored it because it was looking for `?q=Nike`

---

## The Fix

**Modified File**: `frontend/src/hooks/useProducts.ts`

**Before** (line 46):
```typescript
if (filters.search) {
  params.append('search', filters.search)
}
```

**After** (lines 46-48):
```typescript
if (filters.search) {
  // Backend expects 'q' parameter for search (see QueryProductsDto line 72)
  params.append('q', filters.search)
}
```

**Documentation Update** (line 13):
```typescript
export interface ProductFilters {
  has_cogs?: boolean  // Filter: true = with COGS, false = without COGS, undefined = all
  search?: string     // Search by nm_id or sa_name (partial match) - sent as 'q' parameter to backend
  cursor?: string     // Cursor for pagination (cursor-based, not page-based)
  limit?: number      // Items per page (default: 50, max: 200)
}
```

---

## Backend API Specification

**Endpoint**: `GET /v1/products`

**Search Parameter**:
```yaml
Name: q
Type: string
Required: false
Description: Search query (searches in sa_name, brand, nm_id)
Example: "куртка"
```

**Controller Documentation** (`products.controller.ts` lines 210-214):
```typescript
@ApiQuery({
  name: 'q',
  required: false,
  description: 'Search query (searches in sa_name, brand, nm_id)',
  example: 'куртка',
})
```

---

## How Search Works (After Fix)

1. **User Input**: Types "321678606" in search box
2. **Frontend State**: `search` state updates to "321678606"
3. **API Request**: `GET /v1/products?q=321678606&limit=25`
4. **Backend Processing**:
   - Extracts `q` parameter from query
   - Searches products where `nm_id`, `sa_name`, or `brand` contains "321678606"
   - Returns matching products
5. **UI Update**: Product list shows filtered results

---

## Search Capabilities

The search is **case-insensitive partial match** on three fields:
- **nm_id** (article number) - e.g., "321678606"
- **sa_name** (product name) - e.g., "Куртка зимняя"
- **brand** (brand name) - e.g., "Nike"

**Examples**:
- Search "321678606" → Finds products with article containing "321678606"
- Search "куртка" → Finds products with name containing "куртка"
- Search "Nike" → Finds products from Nike brand

---

## Testing Verification

**Before Fix**:
```
GET /v1/products?search=Nike&limit=25
↓
Backend receives: search=Nike (ignored, no 'q' parameter)
↓
Returns: All products (no filtering applied)
```

**After Fix**:
```
GET /v1/products?q=Nike&limit=25
↓
Backend receives: q=Nike (processed correctly)
↓
Returns: Only products matching "Nike"
```

---

## Related Files

**Frontend**:
- `frontend/src/hooks/useProducts.ts` - Fixed parameter name (line 47)
- `frontend/src/components/custom/ProductList.tsx` - Search UI (lines 204-210)

**Backend**:
- `src/products/products.controller.ts` - API endpoint (lines 167-229)
- `src/products/dto/query-products.dto.ts` - Parameter definition (lines 66-72)
- `src/products/products.service.ts` - Search implementation

---

## Lessons Learned

1. **API Contract Consistency**: Frontend and backend must agree on parameter names
2. **TypeScript Interfaces**: Document parameter mappings when names differ between layers
3. **API Testing**: Test API endpoints with actual parameters to catch mismatches early
4. **Code Comments**: Add comments explaining parameter mappings for future maintainers

---

## Prevention for Future

**Recommendations**:
1. Use shared TypeScript types between frontend and backend (e.g., tRPC, GraphQL schema)
2. Add integration tests that verify API parameter names
3. Document API contracts in OpenAPI/Swagger and generate TypeScript clients
4. Use consistent naming conventions across the stack

---

## Status

✅ **FIXED** - Product search now works correctly
🧪 **Ready for Testing** - User can verify search functionality
📝 **Documented** - Bug fix and API contract documented

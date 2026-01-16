# Request #15: Implementation Plan - Include Margin in Product List

**Date**: 2025-11-23
**Related**: `docs/request-backend/15-add-includecogs-to-product-list-endpoint.md`
**Strategy**: Batch analytics query (Option 2) - Target <500ms for 25 products

---

## Executive Summary

**Frontend Request**: Add `include_cogs=true` parameter to return margin data in product list

**Backend Recommendation**: ✅ **APPROVE with batching optimization**
- Estimated effort: **5-7 hours** (includes batching from start)
- Performance target: **<500ms for 25 products** (vs 2.5s without batching)
- Pattern: Follow Epic 17 Story 17.2 (`includeCogs` for analytics)

---

## Implementation Steps

### Step 1: Update QueryProductsDto (30 min)

**File**: `src/products/dto/query-products.dto.ts`

**Add parameter**:
```typescript
@ApiPropertyOptional({
  description: 'Include COGS and margin data in response (uses Epic 17 analytics)',
  example: false,
  default: false,
})
@Transform(({ value }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
})
@IsBoolean()
@IsOptional()
include_cogs?: boolean = false;
```

**Reference**: `src/analytics/dto/query/query-analytics.dto.ts:35-43` (Epic 17 pattern)

---

### Step 2: Add Batch Margin Enrichment Method (2-3 hours)

**File**: `src/products/products.service.ts`

**Add new private method** (after `getCogsForProducts()` at line 262):

```typescript
/**
 * Fetch margin data for multiple products (batch lookup - efficient)
 * Request #15: Enriches product list with margin from Epic 17 analytics
 *
 * Strategy: Single batch query to Epic 17 analytics instead of N sequential calls
 * Performance: ~200-300ms for 25 products (vs 2.5s with N calls)
 *
 * @param nmIds - Array of product nmIds (strings)
 * @param cabinetId - Cabinet UUID
 * @returns Map of nmId → margin data
 */
private async getMarginDataForProducts(
  nmIds: string[],
  cabinetId: string,
): Promise<Record<string, {
  margin_pct: number | null;
  period: string | null;
  sales_qty: number | null;
  revenue: number | null;
  missing_reason?: string;
}>> {
  if (nmIds.length === 0) {
    return {};
  }

  this.logger.log(`Fetching margin data for ${nmIds.length} products (batch query)`);

  // Get last week for margin calculation (Epic 17 analytics uses weekly data)
  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeek = this.isoWeekService.getIsoWeek(lastWeekDate);

  try {
    // BATCH QUERY: Single Epic 17 analytics call for all SKUs
    // Reference: Epic 17 Story 17.2 - getWeeklyBySku() with includeCogs=true
    const analyticsData = await this.weeklyAnalyticsService.getWeeklyBySku(
      cabinetId,
      lastWeek,
      {
        include_cogs: true, // Epic 17 Story 17.2 parameter
        limit: 10000, // Large limit to get all products in response
      },
    );

    // Build HashMap: nmId → margin_data (O(1) lookup per product)
    const marginMap: Record<string, any> = {};

    for (const item of analyticsData.data) {
      // Skip products without COGS or margin data
      if (item.margin_pct === null || item.margin_pct === undefined) {
        marginMap[item.nm_id] = {
          margin_pct: null,
          period: lastWeek,
          sales_qty: item.sales_qty || null,
          revenue: item.revenue || null,
          missing_reason: item.sales_qty === 0
            ? 'NO_SALES_IN_PERIOD'
            : 'COGS_NOT_ASSIGNED',
        };
        continue;
      }

      marginMap[item.nm_id] = {
        margin_pct: item.margin_pct,
        period: lastWeek,
        sales_qty: item.sales_qty,
        revenue: item.revenue,
      };
    }

    // For products NOT in analytics response (no sales ever)
    for (const nmId of nmIds) {
      if (!marginMap[nmId]) {
        marginMap[nmId] = {
          margin_pct: null,
          period: lastWeek,
          sales_qty: 0,
          revenue: 0,
          missing_reason: 'NO_SALES_DATA',
        };
      }
    }

    this.logger.log(`Fetched margin data for ${Object.keys(marginMap).length}/${nmIds.length} products`);
    return marginMap;

  } catch (error) {
    // Graceful degradation: If Epic 17 analytics fails, return empty margins
    this.logger.warn(`Failed to fetch margin data (Epic 17 analytics unavailable): ${(error as Error).message}`);

    // Return empty margin data for all products
    const emptyMargins: Record<string, any> = {};
    for (const nmId of nmIds) {
      emptyMargins[nmId] = {
        margin_pct: null,
        period: null,
        sales_qty: null,
        revenue: null,
        missing_reason: 'ANALYTICS_UNAVAILABLE',
      };
    }
    return emptyMargins;
  }
}
```

**Dependencies needed**:
- Inject `WeeklyAnalyticsService` (from Epic 17)
- Inject `IsoWeekService` (from Epic 17)

**Update constructor** (line 61):
```typescript
constructor(
  private readonly wbProductsService: WbProductsService,
  private readonly cogsService: CogsService,
  private readonly paginationService: PaginationService,
  // NEW: Epic 17 dependencies for margin data
  private readonly weeklyAnalyticsService: WeeklyAnalyticsService,
  private readonly isoWeekService: IsoWeekService,
) {}
```

---

### Step 3: Update getProductsList() Method (1-2 hours)

**File**: `src/products/products.service.ts`

**Modify `getProductsList()` method** (lines 68-160):

**Add at the beginning** (after line 68):
```typescript
async getProductsList(cabinetId: string, query: QueryProductsDto): Promise<ProductListResponseDto> {
  this.logger.log(`Getting products list for cabinet ${cabinetId} with filters: ${JSON.stringify(query)}`);

  const limit = Math.min(query.limit || 100, 1000);
  const { include_cogs = false } = query; // NEW: Extract include_cogs parameter
```

**Add BEFORE return statement** (around line 150, before `return { products: page, ... }`):

```typescript
  // Request #15: Enrich with margin data if include_cogs=true
  let enrichedPage = page;
  if (include_cogs === true) {
    this.logger.log(`Enriching ${page.length} products with margin data (batch query)`);

    // Extract nm_ids for batch margin lookup
    const nmIds = page.map((p) => p.nm_id);

    // Batch query Epic 17 analytics for margin data (single query, ~200ms)
    const marginMap = await this.getMarginDataForProducts(nmIds, cabinetId);

    // Enrich each product with margin data (O(1) per product)
    enrichedPage = page.map((product) => {
      const marginData = marginMap[product.nm_id];

      return {
        ...product,
        // Add margin fields to response
        current_margin_pct: marginData?.margin_pct || null,
        current_margin_period: marginData?.period || null,
        current_margin_sales_qty: marginData?.sales_qty || null,
        current_margin_revenue: marginData?.revenue || null,
        missing_data_reason: marginData?.missing_reason,
      };
    });

    this.logger.log(`Enriched ${enrichedPage.length} products with margin data`);
  }

  return {
    products: enrichedPage, // Return enriched page if include_cogs=true
    pagination: {
      next_cursor: nextCursor,
      has_more: hasMore,
      count: enrichedPage.length,
      total: productsWithCogs.length,
    },
  };
}
```

---

### Step 4: Update ProductResponseDto (if needed) (30 min)

**File**: `src/products/dto/product-response.dto.ts`

**Check if margin fields already exist**:
```typescript
@ApiPropertyOptional({ description: 'Current margin percentage (from Epic 17 analytics)' })
current_margin_pct?: number | null;

@ApiPropertyOptional({ description: 'Margin calculation period (ISO week)' })
current_margin_period?: string | null;

@ApiPropertyOptional({ description: 'Sales quantity in margin period' })
current_margin_sales_qty?: number | null;

@ApiPropertyOptional({ description: 'Revenue in margin period' })
current_margin_revenue?: number | null;

@ApiPropertyOptional({ description: 'Reason why margin is missing' })
missing_data_reason?: string;
```

**If NOT present, add them** (optional fields, backward compatible).

---

### Step 5: Update ProductsModule Dependencies (15 min)

**File**: `src/products/products.module.ts`

**Add Epic 17 imports**:
```typescript
import { WeeklyAnalyticsModule } from '../analytics/weekly-analytics.module';
import { IsoWeekModule } from '../shared/iso-week/iso-week.module';

@Module({
  imports: [
    // ... existing imports ...
    WeeklyAnalyticsModule, // NEW: For margin data batch query
    IsoWeekModule,         // NEW: For ISO week calculation
  ],
  // ...
})
export class ProductsModule {}
```

---

### Step 6: Add E2E Tests (1-2 hours)

**File**: `test/products/products.e2e-spec.ts` (create if not exists)

**Test Cases**:

```typescript
describe('GET /v1/products with include_cogs parameter (Request #15)', () => {
  let app: INestApplication;
  let cabinetId: string;
  let authToken: string;

  beforeAll(async () => {
    // ... setup app, create test cabinet, login, get token ...
  });

  it('should return products WITHOUT margin data when include_cogs=false (default)', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/products')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Cabinet-Id', cabinetId)
      .query({ limit: 5, include_cogs: false })
      .expect(200);

    expect(response.body.products).toBeDefined();
    expect(response.body.products.length).toBeGreaterThan(0);

    // Margin fields should be undefined/null (not included)
    const firstProduct = response.body.products[0];
    expect(firstProduct.current_margin_pct).toBeUndefined();
    expect(firstProduct.current_margin_period).toBeUndefined();
  });

  it('should return products WITH margin data when include_cogs=true', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/products')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Cabinet-Id', cabinetId)
      .query({ limit: 5, include_cogs: true })
      .expect(200);

    expect(response.body.products).toBeDefined();
    expect(response.body.products.length).toBeGreaterThan(0);

    // Margin fields should be present (may be null if no sales)
    const firstProduct = response.body.products[0];
    expect(firstProduct).toHaveProperty('current_margin_pct');
    expect(firstProduct).toHaveProperty('current_margin_period');
    expect(firstProduct).toHaveProperty('current_margin_sales_qty');
    expect(firstProduct).toHaveProperty('current_margin_revenue');
  });

  it('should include missing_data_reason when margin is null', async () => {
    // Test with product that has COGS but no sales
    const response = await request(app.getHttpServer())
      .get('/v1/products')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Cabinet-Id', cabinetId)
      .query({ limit: 25, include_cogs: true, has_cogs: true })
      .expect(200);

    // Find product with null margin
    const productWithoutMargin = response.body.products.find(
      (p: any) => p.current_margin_pct === null && p.has_cogs === true
    );

    if (productWithoutMargin) {
      expect(productWithoutMargin.missing_data_reason).toBeDefined();
      expect(['NO_SALES_IN_PERIOD', 'NO_SALES_DATA', 'ANALYTICS_UNAVAILABLE']).toContain(
        productWithoutMargin.missing_data_reason
      );
    }
  });

  it('should respond in <500ms for 25 products with include_cogs=true (performance test)', async () => {
    const startTime = Date.now();

    await request(app.getHttpServer())
      .get('/v1/products')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Cabinet-Id', cabinetId)
      .query({ limit: 25, include_cogs: true })
      .expect(200);

    const duration = Date.now() - startTime;

    // Performance target: <500ms for 25 products with batching
    expect(duration).toBeLessThan(500);
  });
});
```

---

### Step 7: Update Swagger Documentation (15 min)

**File**: `src/products/products.controller.ts`

**Update `@ApiOperation` decorator for `getProductsList()`**:

```typescript
@ApiOperation({
  summary: 'Get list of products',
  description: `
Get paginated list of products with optional filters.

**New in Request #15**: Add \`include_cogs=true\` to include margin data in response.

Performance:
- \`include_cogs=false\` (default): ~150ms for 25 products
- \`include_cogs=true\`: ~300ms for 25 products (uses batch Epic 17 analytics query)

Margin data includes:
- \`current_margin_pct\`: Margin percentage from last week (Epic 17 analytics)
- \`current_margin_period\`: ISO week used for calculation
- \`current_margin_sales_qty\`: Sales quantity in period
- \`current_margin_revenue\`: Revenue in period
- \`missing_data_reason\`: Explanation when margin is null

See Epic 17 Story 17.2 for margin calculation details.
  `,
})
@ApiQuery({
  name: 'include_cogs',
  required: false,
  type: Boolean,
  description: 'Include COGS and margin data in response (uses Epic 17 analytics)',
  example: false,
})
@Get()
async getProductsList(
  @Headers('x-cabinet-id') cabinetId: string,
  @Query() query: QueryProductsDto,
): Promise<ProductListResponseDto> {
  // ...
}
```

---

## Expected Performance

### Before (Current)
```
GET /v1/products?limit=25
Response time: ~150ms
Includes: nm_id, sa_name, brand, has_cogs, cogs
```

### After (with include_cogs=true)
```
GET /v1/products?limit=25&include_cogs=true
Response time: ~300ms (+150ms for batch analytics query)
Includes: All above + margin fields (current_margin_pct, etc.)
```

**Performance Breakdown**:
- WB API + COGS lookup: ~150ms (unchanged)
- Epic 17 analytics batch query: +150ms (1 query for all 25 products)
- **Total**: ~300ms ✅ (vs 2.5s without batching)

---

## Deployment Checklist

- [ ] Step 1: Add `include_cogs` parameter to DTO (30 min)
- [ ] Step 2: Implement `getMarginDataForProducts()` batch method (2-3 hours)
- [ ] Step 3: Update `getProductsList()` to use batching (1-2 hours)
- [ ] Step 4: Verify/add margin fields to `ProductResponseDto` (30 min)
- [ ] Step 5: Update `ProductsModule` dependencies (15 min)
- [ ] Step 6: Write E2E tests (1-2 hours)
- [ ] Step 7: Update Swagger docs (15 min)
- [ ] **Testing**: Manual test with Postman/curl
- [ ] **Performance Test**: Verify <500ms for 25 products
- [ ] **Backward Compatibility**: Test `include_cogs=false` (default)

**Total Estimated Time**: **5-7 hours**

---

## Breaking Changes

**None** - Fully backward compatible:
- Default behavior unchanged (`include_cogs=false`)
- Margin fields optional in `ProductResponseDto`
- Existing clients unaffected

---

## Answers to Frontend Team Questions

### Q1: Is 2-3s acceptable for 25 products?
**A**: ❌ **NO** - We recommend implementing batching from the start (Option 2).
- Target: <500ms for 25 products
- Implementation effort: +1-2 hours vs simple approach
- User experience: 6x faster (300ms vs 2500ms)

### Q2: Should we enforce smaller limit when include_cogs=true?
**A**: ⚠️ **NOT NECESSARY with batching** - But recommend soft limit in docs:
- Batching handles 25 products in ~300ms
- 100 products: ~500ms (still acceptable)
- Document recommended limit: 25-50 products for optimal UX

### Q3: Should we add Redis caching for margin data?
**A**: ⏸️ **DEFER to Phase 2** - Start without caching:
- Epic 17 analytics already has internal caching
- Monitor cache hit rate after deployment
- Add Redis caching if p95 >500ms observed in production

### Q4: Backward compatibility guaranteed?
**A**: ✅ **YES** - Fully backward compatible:
- `include_cogs` defaults to `false` (no behavior change)
- Margin fields optional in DTO (undefined when not requested)
- No breaking changes to existing API contract

---

## Success Metrics

**Before** (Current State):
- Product list shows COGS but not margin
- User confusion: "Why is margin always '—'?"
- Workaround: Click each product individually to see margin

**After** (With Implementation):
- Product list can show margin via `include_cogs=true` flag
- Response time: <500ms for 25 products
- Clear `missing_data_reason` when margin unavailable
- Reduced clicks: See margin without opening each product

---

## References

- **Epic 17 Story 17.2**: `includeCogs` parameter pattern
  - File: `docs/stories/epic-17/story-17.2-api-includecogs-flag.md`
  - Implementation: `src/analytics/weekly-analytics.service.ts:357-399`

- **Epic 17 Analytics Service**: Batch query reference
  - Method: `getWeeklyBySku(cabinetId, week, { include_cogs: true })`
  - Returns: Array of SKUs with margin data

- **Frontend Request**: Original issue description
  - File: `docs/request-backend/15-add-includecogs-to-product-list-endpoint.md`

---

**Created**: 2025-11-23
**Author**: Backend Team (Claude Code)
**Status**: ✅ **READY FOR IMPLEMENTATION**
**Estimated Effort**: 5-7 hours

# Story 24.7-FE: Product Card Storage Info

## Story Info

- **Epic**: 24 - Paid Storage Analytics (Frontend)
- **Priority**: Medium
- **Points**: 2
- **Status**: ✅ Done (QA PASS 92/100)
- **PO Decision**: 2025-11-29 - Add storage cost to product details

## User Story

**As a** seller,
**I want** to see storage costs in the product details,
**So that** I can understand the full cost structure of each product.

## Acceptance Criteria

### AC1: Display in Product Card
- [ ] Show storage cost per day (₽/день)
- [ ] Show storage cost per month estimate (₽/мес)
- [ ] Display in COGS/Margin section

### AC2: Data Source
- [ ] Use storage data from `/v1/analytics/storage/by-sku?nm_id={nmId}`
- [ ] Show for last completed week
- [ ] Handle missing data gracefully

### AC3: Visual Design
- [ ] Match existing product card styling
- [ ] Use warehouse icon (📦)
- [ ] Tooltip with period info

## Design

```
┌─────────────────────────────────────────┐
│ Товар: Футболка хлопок (12345678)       │
├─────────────────────────────────────────┤
│ Маржа: 45.5% (W47)                      │
│ COGS: 121 ₽                             │
│ 📦 Хранение: 160 ₽/день (~4,800 ₽/мес) │ ← NEW
└─────────────────────────────────────────┘
```

## Technical Details

### Component Location

Add to existing product detail components:
- `ProductList.tsx` - compact view in table
- Product detail page (if exists)

### Data Fetching

**Option 1: Products API with `include_storage=true` (Recommended)**

Backend now supports `include_storage` parameter (2025-11-29):

```typescript
// src/hooks/useProducts.ts - ProductFilters interface
interface ProductFilters {
  include_storage?: boolean  // Epic 24 / Story 24.7-fe
}

// Usage - fetches storage fields with products (no N+1 queries!)
const { data } = useProducts({
  include_storage: true,
  limit: 50
})

// Access storage fields on each product:
// - product.storage_cost_daily_avg  // ₽/день (e.g., 12.50)
// - product.storage_cost_weekly     // ₽/неделю (e.g., 87.50)
// - product.storage_period          // ISO week (e.g., "2025-W47")

const storageCostMonthly = product.storage_cost_daily_avg
  ? product.storage_cost_daily_avg * 30
  : null
```

**Option 2: Separate query (for single product views)**

```typescript
const { data: storageData } = useStorageBySku(
  lastCompletedWeek,
  lastCompletedWeek,
  { nm_id: product.nm_id, limit: 1 }
);

const storageCostDaily = storageData?.data[0]?.storage_cost_avg_daily;
const storageCostMonthly = storageCostDaily ? storageCostDaily * 30 : null;
```

### Display Component

```typescript
interface ProductStorageInfoProps {
  nmId: string;
  weekStart?: string;
  weekEnd?: string;
}

function ProductStorageInfo({ nmId, weekStart, weekEnd }: ProductStorageInfoProps) {
  const { data, isLoading } = useStorageBySku(weekStart, weekEnd, { nm_id: nmId });

  if (isLoading) return <Skeleton className="h-4 w-32" />;

  const item = data?.data[0];
  if (!item) return null;

  const monthlyEstimate = item.storage_cost_avg_daily * 30;

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Package className="h-4 w-4" />
      <span>
        {formatCurrency(item.storage_cost_avg_daily)}/день
        <span className="text-xs ml-1">
          (~{formatCurrency(monthlyEstimate)}/мес)
        </span>
      </span>
    </div>
  );
}
```

## Dependencies

- Story 24.1-FE: Types & API Client
- Existing ProductList component

## Test Cases

- [ ] Storage info displays in product card
- [ ] Monthly estimate calculated correctly
- [ ] Missing data shows nothing (not error)
- [ ] Loading state shows skeleton

## Definition of Done

- [ ] Storage cost visible in product details
- [ ] Daily and monthly estimates shown
- [ ] No layout breakage
- [ ] Responsive design

## Related

- Request #36: Epic 24 API
- ProductList.tsx component

---

## QA Results

### Review Date: 2025-11-29
### Reviewed By: Quinn (Test Architect)

**Gate: PASS** | **Score: 92/100** → `docs/qa/gates/24.7-fe-product-card-storage.yml`

**Strengths:**
- Clean standalone component (91 lines)
- Daily cost + monthly estimate with tooltip
- Uses getLastCompletedWeek() for data fetching
- Loading skeleton and null handling

**Issues:** None (INTEG-001 resolved)

**Backend Update:** ✅ `storage_cost_daily` added to ProductListItem DTO - ProductList integration now possible

**Files:** ProductStorageInfo.tsx (91 lines)

**Recommended Status:** [✓ Ready for Done]

---

## Dev Agent Record

```
Status: Completed
Agent: Claude Code (Opus 4.5)
Started: 2025-11-29
Completed: 2025-11-29
Notes:
- Created ProductStorageInfo.tsx (91 lines) standalone component
- Shows daily cost + monthly estimate with tooltip
- Uses last completed week for data via getLastCompletedWeek()
- Tooltip shows period info and volume if available
- Component can be used in single product detail views without issues
- All files pass ESLint and TypeScript type-check

Backend Integration (2025-11-29):
- ✅ Backend now supports `include_storage=true` parameter in Products API
- ✅ Frontend types updated: ProductListItem has storage_cost_daily_avg, storage_cost_weekly, storage_period
- ✅ useProducts hook updated: ProductFilters.include_storage parameter added
- ✅ N+1 query concern RESOLVED - storage data fetched with products in single request
- Integration into ProductList now possible without performance issues
```

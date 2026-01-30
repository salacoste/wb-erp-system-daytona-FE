# Margin Integration Analysis

**Date**: 2026-01-30
**Role**: Backend Integration Analyst (Margin Focus)
**Purpose**: Analytical summary for frontend development team

---

## Executive Summary

This document provides a comprehensive analysis of how the backend calculates, stores, and serves margin data, along with specific recommendations for frontend integration.

**Key Findings:**
- ✅ Automatic margin recalculation works (Epic 20)
- ✅ Margin calculation status endpoint is available (Epic 22)
- ⚠️ `weekly_margin_fact` table may be empty - requires dedicated data aggregation pipeline
- ✅ Frontend has all necessary tools for proper margin display

**Critical Integration Points:**
1. Use `GET /v1/products/:nmId/margin-status` for efficient polling
2. Handle all `missing_data_reason` values correctly
3. Display empty states when margin data is unavailable
4. Implement proper polling strategy after COGS assignment

---

## Backend Behavior Summary

### How Margin Calculation Works

**Data Flow:**
```
COGS Assignment (POST /v1/products/:nmId/cogs)
    ↓
Automatic Task Enqueue (Epic 20)
    ↓
BullMQ Queue Processing (Background Worker)
    ↓
weekly_margin_fact Table Population
    ↓
Margin Data Available via API
```

**Key Components:**

| Component | Purpose | Status |
|-----------|---------|--------|
| `cogs` table | Stores versioned COGS data | ✅ Working |
| `weekly_margin_fact` table | Aggregated margin by SKU/week | ⚠️ May be empty |
| `wb_finance_raw` table | Raw WB finance data | ✅ Populated |
| BullMQ Queue | Async margin calculation | ✅ Implemented (Epic 20) |

### Margin Calculation Formula

```typescript
gross_profit = revenue_net_rub - (cogs_rub × quantity)
margin_percent = (gross_profit / revenue_net_rub) × 100%
```

**Temporal COGS Lookup (Critical):**
- Uses **week midpoint strategy** (≈ Thursday 12:00)
- Finds COGS valid at midpoint date
- Applied via SQL query: `valid_from <= midpoint AND (valid_to > midpoint OR valid_to IS NULL)`

### What Returns When `cogs_total === null`

**Scenario 1: No Margin Data Available (Most Common)**
```json
{
  "cogs_total": null,
  "gross_profit": null,
  "margin_pct": null,
  "cogs_coverage_pct": 0
}
```
**Cause**: `weekly_margin_fact` table is empty
**Reason**: Data aggregation pipeline not implemented yet
**Action**: Display empty state with CTA to assign COGS

**Scenario 2: Partial COGS Coverage**
```json
{
  "cogs_total": 26813.0,
  "gross_profit": 51019.38,
  "margin_pct": 16.7,
  "cogs_coverage_pct": 50
}
```
**Action**: Display warning about partial coverage

### Automatic Margin Recalculation (Epic 20)

**Trigger Events:**
| Event | Trigger | Affected Weeks |
|-------|---------|----------------|
| COGS assigned | `POST /v1/products/:nmId/cogs` | From `valid_from` to last completed week |
| COGS updated | `POST /v1/products/:nmId/cogs` (same date) | From `valid_from` to last completed week |
| Bulk assignment | `POST /v1/products/cogs/bulk` | Aggregated weeks for all products |

**Processing Times:**
- Single product (1 week): 5-10 seconds
- Historical COGS (7 weeks): 20-30 seconds
- Bulk assignment (500 products): 45-60 seconds

**Expected Response After COGS Assignment:**
```json
{
  "nm_id": "173589742",
  "has_cogs": true,
  "cogs": {
    "unit_cost_rub": "11.00",
    "valid_from": "2025-11-23T00:00:00.000Z"
  },
  "current_margin_pct": null,  // ⚠️ Not yet calculated
  "current_margin_period": null,
  "missing_data_reason": null  // Will be null until calculation completes
}
```

---

## Frontend Integration Gaps

### Gap 1: Inefficient Polling Strategy

**Problem**: Frontend may be polling full product endpoint instead of lightweight status endpoint.

**Current Approach (Inefficient):**
```typescript
// ❌ Fetches full product data every poll
GET /v1/products/:nmId?include_cogs=true
```

**Solution: Use Status Endpoint**
```typescript
// ✅ Lightweight status check only
GET /v1/products/:nmId/margin-status
```

**Implementation Steps:**
1. Replace product endpoint polling with status endpoint polling
2. Poll every 2-3 seconds
3. Stop when `status === 'completed'` or `status === 'failed'`
4. Then refresh product data to get updated margin values

**Code Example:**
```typescript
// hooks/useMarginStatusPolling.ts
export function useMarginStatusPolling(nmId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['margin-status', nmId],
    queryFn: async () => {
      const response = await apiClient.get(`/v1/products/${nmId}/margin-status`);
      return response.data;
    },
    refetchInterval: enabled ? 2500 : false, // Poll every 2.5s
    enabled,
  });
}
```

### Gap 2: Missing Empty State Handling

**Problem**: When `weekly_margin_fact` is empty, margin fields return `null`. Frontend may not display appropriate empty state.

**Solution: Implement Empty State Component**

**Detection Logic:**
```typescript
const hasMarginData = data?.cogs_total !== null && data?.gross_profit !== null;
const coveragePercentage = data?.cogs_coverage_pct ?? 0;
```

**Component Usage:**
```typescript
{!hasMarginData ? (
  <CogsMissingState
    coveragePercentage={coveragePercentage}
    onAssignCogs={() => router.push('/products')}
  />
) : (
  <MarginDisplay data={data} />
)}
```

**Empty State Messages:**
- 0% coverage: "Назначьте себестоимость товарам для расчёта маржи"
- 1-99% coverage: "Покрытие COGS: X%. Назначьте себестоимость всем товарам."
- 100% coverage but null margin: "Расчёт маржи..." (should resolve quickly)

### Gap 3: COGS Update Conflict (409 Error) - RESOLVED

**Status**: ✅ **FIXED** - Backend deployed idempotent UPDATE logic (2025-11-23)

**Previous Issue**: Backend returned HTTP 409 when updating COGS with same `valid_from` date.

**Current Behavior**:
- Same `valid_from` → UPDATE existing record (version++)
- Different `valid_from` → CREATE new version (temporal versioning)

**Frontend Action**: None required - backend now handles correctly.

### Gap 4: Missing Data Reason Handling

**Problem**: Frontend may not handle all `missing_data_reason` values correctly.

**Solution: Comprehensive Missing Data Handling**

| missing_data_reason | Display | Action |
|---------------------|---------|--------|
| `null` | Show margin % | None (success case) |
| `"NO_SALES_DATA"` | "Нет продаж за {period}" | Offer to view other weeks |
| `"COGS_NOT_ASSIGNED"` | "Назначьте себестоимость" | CTA to COGS assignment |
| `"CALCULATION_PENDING"` | Spinner + "(расчёт маржи...)" | Start polling |
| `"INCOMPLETE_WEEK"` | "Данные за {period} ещё не готовы" | Wait or select completed week |

**Implementation:**
```typescript
function getMarginDisplay(product: Product) {
  if (product.current_margin_pct !== null) {
    return { type: 'success', value: `${product.current_margin_pct}%` };
  }

  switch (product.missing_data_reason) {
    case 'NO_SALES_DATA':
      return { type: 'info', message: 'Нет продаж за выбранный период' };
    case 'COGS_NOT_ASSIGNED':
      return { type: 'warning', message: 'Назначьте себестоимость', action: 'assign' };
    case 'CALCULATION_PENDING':
      return { type: 'loading', message: 'Расчёт маржи...' };
    default:
      return { type: 'error', message: 'Нет данных' };
  }
}
```

### Gap 5: Polling Hook Not Restarting

**Problem**: `useMarginPolling` hook doesn't restart after COGS assignment state changes.

**Solution: Fix Hook Dependencies**

**Root Cause**: Options object memoization prevents `useEffect` from detecting state changes.

**Fix:**
```typescript
// Don't memoize options - let useEffect detect changes directly
const polling = useMarginPolling({
  nmId: pollingNmId ?? '',
  enabled: pollingEnabled,
  strategy: pollingStrategy,
  onSuccess: handlePollingSuccess,
  onTimeout: handlePollingTimeout,
  onError: handlePollingError,
});
```

---

## Data Sources

### Primary Endpoints

| Endpoint | Purpose | Response Time |
|----------|---------|---------------|
| `GET /v1/products?include_cogs=true` | Product list with margin | < 500ms p95 |
| `GET /v1/products/:nmId?include_cogs=true` | Single product with margin | < 200ms p95 |
| `GET /v1/products/:nmId/margin-status` | Margin calculation status | < 100ms p95 ✅ |
| `GET /v1/analytics/weekly/finance-summary` | Finance summary with margin | < 500ms p95 |
| `POST /v1/products/:nmId/cogs` | Assign COGS (triggers recalculation) | < 300ms p95 |

### Key Response Fields

**Product Response (`include_cogs=true`):**
```typescript
interface ProductResponse {
  nm_id: string;
  sa_name: string;
  has_cogs: boolean;
  cogs: Cogs | null;
  current_margin_pct: number | null;
  current_margin_period: string | null;  // "2025-W47"
  current_margin_sales_qty: number | null;
  current_margin_revenue: number | null;
  missing_data_reason: string | null;
}
```

**Margin Status Response:**
```typescript
interface MarginStatusResponse {
  status: 'pending' | 'in_progress' | 'completed' | 'not_found' | 'failed';
  estimated_completion?: string;  // ISO timestamp
  weeks?: string[];  // ["2025-W47", "2025-W48"]
  enqueued_at?: string;
  started_at?: string;
  error?: string;  // Only when status === 'failed'
}
```

**Finance Summary Response:**
```typescript
interface FinanceSummaryResponse {
  week: string;
  sale_gross_total: number;
  cogs_total: number | null;  // ⚠️ May be null
  gross_profit: number | null;  // ⚠️ May be null
  margin_pct: number | null;  // ⚠️ May be null
  cogs_coverage_pct: number;  // 0-100
}
```

---

## Recommendations

### Step 1: Implement Efficient Polling (High Priority)

**Action**: Replace current polling with status endpoint approach.

**Files to Modify:**
- `src/hooks/useMarginPolling.ts` - Add status endpoint polling
- `src/hooks/useSingleCogsAssignmentWithPolling.ts` - Use status endpoint
- `src/hooks/usePendingMarginProducts.ts` - Fix infinite loop issue

**Implementation:**
```typescript
// hooks/useMarginStatusPolling.ts (NEW)
export function useMarginStatusPolling(
  nmId: string,
  options: {
    enabled?: boolean;
    interval?: number;  // milliseconds
    maxAttempts?: number;
    onSuccess?: () => void;
    onTimeout?: () => void;
    onError?: (error: string) => void;
  }
) {
  const [attempts, setAttempts] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['margin-status', nmId],
    queryFn: async () => {
      const response = await apiClient.get(`/v1/products/${nmId}/margin-status`);
      return response.data;
    },
    refetchInterval: () => {
      if (!options.enabled) return false;
      if (attempts >= (options.maxAttempts ?? 20)) return false;
      return options.interval ?? 2500;
    },
    onSuccess: (data) => {
      if (data.status === 'completed') {
        options.onSuccess?.();
      } else if (data.status === 'failed') {
        options.onError?.(data.error ?? 'Unknown error');
      } else if (++attempts >= (options.maxAttempts ?? 20)) {
        options.onTimeout?.();
      }
    },
  });

  return { status: data?.status, isLoading, error };
}
```

### Step 2: Add Empty State Handling (High Priority)

**Action**: Create and implement empty state component.

**Files to Create:**
- `src/components/custom/CogsMissingState.tsx`

**Files to Modify:**
- `src/app/(dashboard)/dashboard/page.tsx` - Use empty state in dashboard
- `src/components/custom/FinancialSummaryTable.tsx` - Handle null margin fields

**Implementation:**
```typescript
// components/custom/CogsMissingState.tsx
interface CogsMissingStateProps {
  coveragePercentage: number;
  onAssignCogs: () => void;
  week?: string;
}

export function CogsMissingState({
  coveragePercentage,
  onAssignCogs,
  week
}: CogsMissingStateProps) {
  return (
    <Alert variant="warning">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Недостаточно данных для расчёта маржи</AlertTitle>
      <AlertDescription>
        {coveragePercentage === 0 ? (
          <>Назначьте себестоимость товарам для расчёта маржи</>
        ) : (
          <>Покрытие COGS: {coveragePercentage}%. Назначьте себестоимость всем товарам.</>
        )}
      </AlertDescription>
      <Button onClick={onAssignCogs} className="mt-2">
        Назначить себестоимость
      </Button>
    </Alert>
  );
}
```

### Step 3: Fix Infinite Loop in usePendingMarginProducts (Medium Priority)

**Action**: Fix `useEffect` dependency issue.

**File to Modify:**
- `src/hooks/usePendingMarginProducts.ts`

**Fix:**
```typescript
// Use deep comparison instead of reference comparison
const prevProductsRef = useRef<Product[]>([]);

useEffect(() => {
  if (!enabled) return;

  // Deep compare to prevent infinite loop
  const hasChanged = !deepEqual(prevProductsRef.current, products);
  if (!hasChanged) return;

  prevProductsRef.current = products;

  const newPending = new Map<string, PendingProduct>();
  products.forEach((product) => {
    const isPending =
      product.current_margin_pct === null &&
      product.missing_data_reason === null &&
      product.has_cogs === true;

    if (isPending) {
      newPending.set(product.nm_id, {
        nm_id: product.nm_id,
        sa_name: product.sa_name,
        enqueuedAt: new Date(),
      });
    }
  });

  setPendingProducts(newPending);
}, [products, enabled]);
```

### Step 4: Add Comprehensive Missing Data Handling (Medium Priority)

**Action**: Create utility function for margin display logic.

**File to Create:**
- `src/lib/margin-display-utils.ts`

**Implementation:**
```typescript
// lib/margin-display-utils.ts
export type MarginDisplayState =
  | { type: 'success'; value: string }
  | { type: 'info'; message: string }
  | { type: 'warning'; message: string; action?: string }
  | { type: 'loading'; message: string }
  | { type: 'error'; message: string };

export function getMarginDisplay(
  product: Pick<Product, 'current_margin_pct' | 'missing_data_reason' | 'has_cogs'>
): MarginDisplayState {
  // Success case
  if (product.current_margin_pct !== null) {
    return {
      type: 'success',
      value: `${product.current_margin_pct.toFixed(2)}%`
    };
  }

  // Handle missing data reasons
  switch (product.missing_data_reason) {
    case 'NO_SALES_DATA':
      return {
        type: 'info',
        message: 'Нет продаж за выбранный период'
      };

    case 'COGS_NOT_ASSIGNED':
      return {
        type: 'warning',
        message: 'Назначьте себестоимость',
        action: 'assign-cogs'
      };

    case 'CALCULATION_PENDING':
      return {
        type: 'loading',
        message: 'Расчёт маржи...'
      };

    case 'INCOMPLETE_WEEK':
      return {
        type: 'info',
        message: 'Данные за период ещё не готовы'
      };

    default:
      // Fallback: Check has_cogs
      if (!product.has_cogs) {
        return {
          type: 'warning',
          message: 'Назначьте себестоимость',
          action: 'assign-cogs'
        };
      }

      return { type: 'error', message: 'Нет данных' };
  }
}
```

### Step 5: Update Dashboard with Margin Empty States (Low Priority)

**Action**: Handle null margin fields in dashboard components.

**Files to Modify:**
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/components/custom/InitialDataSummary.tsx`
- `src/components/custom/MetricCardEnhanced.tsx`

**Implementation Pattern:**
```typescript
// dashboard/page.tsx
const { data } = useFinanceSummary({ week });

const hasMarginData = data?.cogs_total !== null && data?.gross_profit !== null;

return (
  <div>
    {/* Revenue - Always available */}
    <MetricCard label="Выручка" value={formatCurrency(data?.sale_gross_total || 0)} />

    {/* Margin metrics - Handle null values */}
    {hasMarginData ? (
      <>
        <MetricCard label="Себестоимость" value={formatCurrency(data.cogs_total!)} />
        <MetricCard label="Валовая прибыль" value={formatCurrency(data.gross_profit!)} />
        <MetricCard label="Маржинальность" value={formatPercentage(data.margin_pct!)} />
      </>
    ) : (
      <CogsMissingState
        coveragePercentage={data?.cogs_coverage_pct || 0}
        onAssignCogs={() => router.push('/products')}
        week={week}
      />
    )}
  </div>
);
```

---

## Blockers and Limitations

### Blocker 1: Empty `weekly_margin_fact` Table

**Status**: ⚠️ **KNOWN ISSUE** - Not a bug, expected behavior

**Description**: The `weekly_margin_fact` table may be empty because the data aggregation pipeline has not been implemented yet. Epic 56 (completed 2026-01-29) implemented COGS import from WB API but does NOT populate `weekly_margin_fact`.

**Impact**:
- All margin fields return `null`
- `cogs_total`, `gross_profit`, `margin_pct` are null
- `cogs_coverage_pct` returns 0

**Workaround**:
1. Display empty state component
2. Show warning: "Недостаточно данных для расчёта маржи"
3. Provide CTA: "Назначить себестоимость"

**Long-term Solution**:
- Requires new Epic for margin data aggregation pipeline
- Should aggregate `cogs` → `weekly_margin_fact`
- Trigger points: COGS assignment, historical import, weekly scheduled task
- See Request #113 for complete documentation

### Blocker 2: Margin Calculation Timing

**Status**: ⚠️ **DESIGN CONSTRAINT** - Asynchronous processing

**Description**: Margin calculation runs asynchronously in background queue. Frontend must poll for updates.

**Impact**:
- Immediate response after COGS assignment shows `current_margin_pct: null`
- User must wait 5-60 seconds for margin to appear
- No WebSocket notifications (not implemented)

**Workaround**:
1. Implement polling using status endpoint
2. Show progress indicator during calculation
3. Refresh data when status is `completed`

**Recommended Polling Strategy**:
- Single product: Poll every 3 seconds, max 10 attempts (30 seconds)
- Historical (7 weeks): Poll every 5 seconds, max 12 attempts (60 seconds)
- Bulk (500 products): Poll every 10 seconds, max 18 attempts (180 seconds)

### Limitation 1: Temporal COGS Complexity

**Status**: ℹ️ **DESIGN FEATURE** - Week midpoint strategy

**Description**: COGS selection uses week midpoint (≈ Thursday 12:00) to determine which version applies.

**Edge Cases**:
- COGS assigned Monday-Wednesday → Applies to current week
- COGS assigned Thursday before 12:00 → Applies to current week
- COGS assigned Thursday after 12:00 → Applies to next week
- COGS assigned Friday-Sunday → Applies to next week

**User Confusion**: Users may assign COGS on Friday and expect it to apply to current week, but it applies to next week.

**Mitigation**:
1. Show warning in UI when COGS is assigned after Thursday
2. Display effective week when COGS will apply
3. Consider adding "effective week" field in COGS response

### Limitation 2: No Real-Time Updates

**Status**: ℹ️ **ARCHITECTURE LIMITATION** - No WebSocket implemented

**Description**: Frontend must poll to check margin calculation status. No push notifications.

**Impact**:
- Increased network traffic
- Delayed UI updates
- Potential for stale data

**Workaround**: Efficient polling with status endpoint (p95 < 100ms)

**Future Enhancement**: WebSocket notifications when margin calculation completes (not in current roadmap)

---

## Testing Checklist

### Unit Tests

- [ ] Test `getMarginDisplay()` utility function with all `missing_data_reason` values
- [ ] Test `CogsMissingState` component with different coverage percentages
- [ ] Test `useMarginStatusPolling` hook with mock status endpoint responses
- [ ] Test margin display logic with null/undefined values

### Integration Tests

- [ ] Test COGS assignment → status polling → margin completion flow
- [ ] Test bulk COGS assignment → batch status checking
- [ ] Test empty state display when `weekly_margin_fact` is empty
- [ ] Test margin recalculation after COGS update

### E2E Tests

- [ ] Test complete user flow: Assign COGS → See calculation → View margin
- [ ] Test error handling: Failed margin calculation → Retry button
- [ ] Test timeout handling: Long-running calculation → Timeout message
- [ ] Test concurrent operations: Multiple COGS assignments → Multiple polling instances

---

## Related Documentation

### Backend Documentation
- **Request #113**: Margin calculation empty state behavior
- **Request #114**: Frontend quick reference guide
- **Request #14**: Automatic margin recalculation on COGS update
- **Request #21**: Margin calculation status endpoint
- **Request #24**: Margin & COGS integration guide
- **Request #29**: COGS temporal versioning and margin calculation

### Epic Documentation
- **Epic 20**: Automatic margin recalculation
- **Epic 22**: Margin calculation status endpoint
- **Epic 56**: Historical inventory import (COGS data)

### Frontend Documentation
- **CLAUDE.md**: Project overview and development guidelines
- **docs/api-integration-guide.md**: Complete API endpoint catalog
- **docs/front-end-spec.md**: UI/UX specification and design system

---

## Summary

**What Works:**
- ✅ Automatic margin recalculation after COGS assignment
- ✅ Lightweight status endpoint for efficient polling
- ✅ Temporal COGS versioning with week midpoint strategy
- ✅ Comprehensive `missing_data_reason` values

**What Needs Frontend Work:**
- ⚠️ Implement status endpoint polling (replace full product polling)
- ⚠️ Add empty state handling for null margin fields
- ⚠️ Fix infinite loop in `usePendingMarginProducts` hook
- ⚠️ Add comprehensive missing data reason handling

**What's a Backend Limitation:**
- ⚠️ `weekly_margin_fact` table may be empty (requires new Epic for data aggregation)
- ℹ️ Asynchronous processing requires polling (no WebSocket)
- ℹ️ Week midpoint COGS selection may confuse users (needs UX clarification)

**Next Steps:**
1. Implement status endpoint polling (Step 1)
2. Add empty state components (Step 2)
3. Fix polling hook issues (Step 3)
4. Add comprehensive missing data handling (Step 4)
5. Update dashboard with empty states (Step 5)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-30
**Maintained By**: Frontend Team
**Related**: Request #113, #114, #14, #21, #24, #29

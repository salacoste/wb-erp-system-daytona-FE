# Request #20: Frontend Polling Implementation Issues - Backend Guidance Needed

**Date**: 2025-01-27  
**Priority**: 🟡 Medium - Implementation Question  
**Status**: 🔴 **AWAITING BACKEND RESPONSE**  
**Component**: Frontend - Polling Implementation for Margin Calculation  
**Related**: Request #14 (Epic 20), Request #18 (Missing Margin Scenarios)

---

## Executive Summary

Frontend team is implementing polling mechanism for margin calculation status updates (as recommended in Request #14 backend response). We're encountering two critical issues:

1. **Polling hook not restarting** after COGS assignment - `useMarginPolling` doesn't detect state changes
2. **Infinite re-render loop** in `usePendingMarginProducts` hook - `useEffect` dependency issue

We need backend team guidance on:
- **Best polling strategy** given your architecture (BullMQ queue, task processing times)
- **API endpoints** for checking margin calculation status
- **Expected timing** for different scenarios (single product, historical, bulk)
- **Error detection** - how to know if calculation failed vs in progress

---

## Problem 1: Polling Hook Not Restarting After COGS Assignment

### Current Implementation

**Hook**: `src/hooks/useMarginPolling.ts`  
**Usage**: `src/hooks/useSingleCogsAssignmentWithPolling.ts`

**Flow:**
1. User assigns COGS → `POST /v1/products/:nmId/cogs`
2. Backend returns `201 Created` with `current_margin_pct: null`, `missing_data_reason: null`
3. Frontend sets `pollingNmId` and `pollingConfig` state
4. `useMarginPolling` hook should start polling `GET /v1/products/:nmId?include_cogs=true`
5. **Problem**: Hook doesn't restart/start polling after state is set

### Observed Behavior

**Console Logs:**
```
✅ [Polling Hook] Polling state set, useMarginPolling should restart
🔍 [Polling Store] Adding product 173588306 to polling
⚠️ [Margin Polling] Polling disabled, not starting
Enabled: false
nmId:  (empty)
```

**What's happening:**
- `useMarginPolling` is created **BEFORE** `setPollingNmId` and `setPollingConfig` are called
- When state is set, `useEffect` in `useMarginPolling` doesn't restart
- `enabled` and `nmId` remain `false` and empty string

### Code Structure

```typescript
// useSingleCogsAssignmentWithPolling.ts
const [pollingNmId, setPollingNmId] = useState<string | null>(null)
const [pollingConfig, setPollingConfig] = useState<PollingConfig | null>(null)

// Memoized enabled flag
const pollingEnabled = useMemo(() => {
  return pollingConfig !== null && pollingNmId !== null
}, [pollingConfig, pollingNmId])

// Memoized options object
const pollingOptions = useMemo(() => ({
  nmId: pollingNmId ?? '',
  enabled: pollingEnabled,
  strategy: pollingStrategy,
  onSuccess: handlePollingSuccess,
  onTimeout: handlePollingTimeout,
  onError: handlePollingError,
}), [pollingNmId, pollingEnabled, pollingStrategy, ...callbacks])

// Hook called with memoized options
const polling = useMarginPolling(pollingOptions)

// In onSuccess callback after COGS assignment:
setPollingNmId(params.nmId)
setPollingConfig(strategy)
// Expected: useMarginPolling should restart with new enabled=true, nmId="173588306"
// Actual: useMarginPolling doesn't restart
```

### Questions for Backend Team

**Q1.1**: Is there a better way to detect when margin calculation task is queued/processing?

**Q1.2**: Should we poll `GET /v1/products/:nmId?include_cogs=true` or is there a dedicated status endpoint?

**Q1.3**: What's the recommended polling interval based on your task processing times?
- Single product: 5-10 seconds (from Request #14)
- Historical (7 weeks): 20-30 seconds
- Bulk (500 products): 45-60 seconds

**Q1.4**: Is there a way to check if a margin calculation task is actually queued/processing for a specific product?
- Endpoint like `GET /v1/tasks/status?nm_id=173588306`?
- Or should we rely on polling product data?

---

## Problem 2: Infinite Re-render Loop in usePendingMarginProducts

### Current Implementation

**Hook**: `src/hooks/usePendingMarginProducts.ts`  
**Usage**: Detects products with `current_margin_pct: null` + `missing_data_reason: null` + `has_cogs: true` (Request #18 Scenario 1)

**Error:**
```
Maximum update depth exceeded. This can happen when a component calls setState 
inside useEffect, but useEffect either doesn't have a dependency array, or one 
of the dependencies changes on every render.
```

**Location**: `src/hooks/usePendingMarginProducts.ts:92` - `setPendingProducts(newPending)`

### Code Structure

```typescript
useEffect(() => {
  if (!enabled) return

  const newPending = new Map<string, PendingProduct>()
  
  products.forEach((product) => {
    const isPending = 
      product.current_margin_pct === null &&
      product.missing_data_reason === null &&
      product.has_cogs === true
    
    if (isPending) {
      // Add to newPending map
    }
  })

  setPendingProducts(newPending)  // ⚠️ This causes infinite loop
}, [products, enabled])  // ⚠️ 'products' array recreated on every render
```

### Root Cause

The `products` array is recreated on every render (even if contents are the same), causing `useEffect` to run on every render, which calls `setPendingProducts`, which triggers a re-render, creating a new `products` array, and so on.

### Questions for Backend Team

**Q2.1**: Should we track pending products on frontend, or is there a backend endpoint that returns products with pending margin calculation?

**Q2.2**: What's the recommended approach for detecting "calculation in progress" state?
- Option A: Frontend polling individual products (current approach)
- Option B: Backend endpoint `GET /v1/products/pending-margin?cabinet_id=xxx`
- Option C: WebSocket notifications when calculation completes (future)

**Q2.3**: Based on Request #18 backend response, should we:
- Poll every 5-10 seconds for first 30 seconds
- Then every 30 seconds
- Stop after 5 minutes (assume task failed)

Is this strategy aligned with your task processing architecture?

---

## Backend Architecture Context (From Request #14)

### Current Backend Implementation

**Queue**: BullMQ `margin-calculation`  
**Job Type**: `recalculate_weekly_margin`  
**Processing**: Background worker processes tasks asynchronously

**Task Payload:**
```typescript
{
  cabinetId: string,
  weeks: string[],  // ["2025-W47"]
  nmIds?: string[],  // Optional: ["173588306"]
  enqueuedAt: string
}
```

**Processing Times:**
- Single product (1 week): 5-10 seconds
- Historical (7 weeks): 20-30 seconds
- Bulk (500 products, 7 weeks): 45-60 seconds

### What We Know

1. ✅ Epic 20 is implemented - automatic margin recalculation works
2. ✅ Tasks are enqueued automatically after `POST /v1/products/:nmId/cogs`
3. ✅ `missing_data_reason: null` when COGS assigned but margin not calculated yet (Request #18)
4. ⚠️ No WebSocket notifications (not in Epic 20)
5. ⚠️ No dedicated status endpoint for checking task status

---

## Proposed Solutions (Need Backend Validation)

### Solution 1: Fix useMarginPolling Hook

**Approach**: Ensure `useEffect` in `useMarginPolling` properly reacts to `enabled` and `nmId` changes.

**Current Issue**: Options object is memoized, but `useEffect` dependencies might not be detecting changes correctly.

**Question**: Is this a frontend-only issue, or should we change our polling approach?

### Solution 2: Fix usePendingMarginProducts Hook

**Approach A**: Deep comparison of `products` array before calling `setPendingProducts`
```typescript
const prevProductsRef = useRef(products)
if (deepEqual(prevProductsRef.current, products)) {
  return // Skip update
}
prevProductsRef.current = products
setPendingProducts(newPending)
```

**Approach B**: Use `useMemo` to create stable `products` reference
```typescript
const stableProducts = useMemo(() => products, [
  products.map(p => p.nm_id).join(','),
  products.map(p => p.current_margin_pct).join(',')
])
```

**Approach C**: Backend provides endpoint for pending products
```typescript
// Instead of frontend detecting, backend tells us
const { pendingProducts } = await apiClient.get('/v1/products/pending-margin')
```

**Question**: Which approach aligns better with your architecture?

### Solution 3: Alternative Polling Strategy

**Current**: Poll individual products after COGS assignment  
**Alternative**: Poll product list with `include_cogs=true` and check for margin updates

**Question**: Is polling `GET /v1/products?include_cogs=true` more efficient than polling individual products?

---

## Specific Questions for Backend Team

### 1. Polling Strategy

**Q1**: What's the recommended polling approach given your BullMQ architecture?
- Poll individual products: `GET /v1/products/:nmId?include_cogs=true`
- Poll product list: `GET /v1/products?include_cogs=true&limit=25`
- Dedicated status endpoint: `GET /v1/tasks/margin-status?nm_id=xxx` (if exists)

**Q2**: What polling intervals do you recommend?
- Single product: 3 seconds? 5 seconds?
- Historical (7 weeks): 5 seconds? 10 seconds?
- Bulk (500 products): 10 seconds? 30 seconds?

**Q3**: How long should frontend poll before assuming task failed?
- Single product: 30 seconds? 60 seconds?
- Historical: 60 seconds? 120 seconds?
- Bulk: 120 seconds? 180 seconds?

### 2. Task Status Detection

**Q4**: Is there a way to check if a margin calculation task is queued/processing for a specific product?
- Endpoint: `GET /v1/tasks/status?nm_id=173588306&task_type=recalculate_weekly_margin`?
- Or should we rely on polling product data?

**Q5**: When a task fails, how should frontend detect this?
- Does `missing_data_reason` change to an error value?
- Or does it remain `null` indefinitely?

### 3. Pending Products Detection

**Q6**: Should frontend detect pending products (Request #18 Scenario 1), or is there a backend endpoint?
- Option A: Frontend detects from product list (current approach)
- Option B: Backend endpoint `GET /v1/products/pending-margin?cabinet_id=xxx`
- Option C: Backend always sets `missing_data_reason` (even if calculation in progress)

**Q7**: For Request #18 Scenario 1 (calculation in progress), what's the expected resolution time?
- Should we poll for 5 minutes as suggested in Request #18 backend response?
- Or is there a faster way to detect completion?

### 4. Error Handling

**Q8**: How should frontend handle failed margin calculations?
- Show error message after timeout?
- Provide manual retry button calling `POST /v1/tasks/enqueue`?
- Both?

**Q9**: Is there a way to distinguish between:
- Task queued but not started (should poll)
- Task processing (should poll)
- Task failed (should show error)
- Task completed but margin still null (different `missing_data_reason`?)

### 5. Performance Considerations

**Q10**: If we poll `GET /v1/products?include_cogs=true` every 3-5 seconds for multiple products, is this acceptable?
- Will this cause performance issues on backend?
- Should we limit concurrent polling requests?

**Q11**: For bulk operations (500 products), should we:
- Poll all 500 products individually (500 requests)?
- Poll product list and check sample (1 request)?
- Use a different strategy?

---

## Current Frontend Implementation Details

### useMarginPolling Hook

**Purpose**: Poll a single product for margin calculation completion  
**Trigger**: After COGS assignment  
**Strategy**: 
- Interval: 3 seconds
- Max attempts: 10 (30 seconds total)
- Stops when `current_margin_pct !== null`

**Issue**: Hook doesn't restart when `enabled` changes from `false` to `true`

### usePendingMarginProducts Hook

**Purpose**: Detect products with pending margin calculation from product list  
**Trigger**: When product list is fetched with `include_cogs=true`  
**Strategy**:
- Detects products where `current_margin_pct === null` + `missing_data_reason === null` + `has_cogs === true`
- Polls these products every 5-10 seconds for first 30 seconds, then every 30 seconds
- Stops after 5 minutes

**Issue**: Infinite re-render loop due to `products` array dependency

---

## Recommended Next Steps (Awaiting Backend Input)

1. **Backend Team**: Review questions and provide guidance on:
   - Best polling strategy
   - Recommended intervals and timeouts
   - API endpoints for status checking
   - Error detection approach

2. **Frontend Team**: Based on backend response:
   - Fix `useMarginPolling` hook restart issue
   - Fix `usePendingMarginProducts` infinite loop
   - Implement recommended polling strategy
   - Add proper error handling

3. **Testing**: Validate polling works correctly for:
   - Single product assignment
   - Historical COGS assignment (7 weeks)
   - Bulk COGS assignment (500 products)

---

## Related Documentation

- **Request #14**: Automatic Margin Recalculation on COGS Update
  - Backend Response: `14-automatic-margin-recalculation-on-cogs-update-backend.md`
  - Documents Epic 20 implementation and polling recommendations

- **Request #18**: Missing Margin and Missing Data Reason Scenarios
  - Backend Response: `18-missing-margin-and-missing-data-reason-scenarios-backend.md`
  - Documents when `missing_data_reason: null` is expected

- **Request #17**: COGS Assigned After Completed Week
  - Documents manual recalculation via `POST /v1/tasks/enqueue`

---

## Frontend Code References

- `src/hooks/useMarginPolling.ts` - Single product polling hook
- `src/hooks/useSingleCogsAssignmentWithPolling.ts` - COGS assignment with polling
- `src/hooks/usePendingMarginProducts.ts` - Pending products detection (infinite loop issue)
- `src/components/custom/ProductList.tsx` - Product list with margin display

---

**Date Created**: 2025-01-27  
**Status**: 🔴 **AWAITING BACKEND RESPONSE**  
**Priority**: Medium - Blocking proper polling implementation  
**Next Steps**: Backend team review and guidance on polling strategy


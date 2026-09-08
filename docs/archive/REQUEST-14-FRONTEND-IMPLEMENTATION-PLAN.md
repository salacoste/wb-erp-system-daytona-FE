# Request #14: Frontend Implementation Plan - Margin Recalculation Polling

**Date:** 2025-01-26  
**Status:** ✅ **COMPLETE** - Story 4.8 Done + Request #17 Integrated  
**Story:** `docs/stories/4.8.margin-recalculation-polling.md`  
**Backend Status:** ✅ **COMPLETE** (Epic 20 - 2025-01-26)  
**Request #17:** ✅ **RESOLVED** - Manual recalculation implemented (2025-01-27)

---

## 📋 Executive Summary

**Problem:** After COGS assignment, backend automatically calculates margin in background (5-60 seconds), but frontend doesn't provide user feedback or automatically refresh when margin becomes available.

**Solution:** Implement polling mechanism with progress feedback, automatic UI updates, and graceful timeout handling.

**Story Created:** Story 4.8 - Margin Recalculation Polling & Real-time Updates (Epic 4)

---

## 🎯 Implementation Overview

### Current State

**What Works:**

- ✅ COGS assignment via `POST /v1/products/:nmId/cogs`
- ✅ Backend automatically triggers margin calculation (Epic 20)
- ✅ Query invalidation refreshes product data
- ✅ Margin display components (MarginDisplay, MarginBadge)

**What's Missing:**

- ❌ No feedback about calculation progress
- ❌ No automatic polling to check margin availability
- ❌ User must manually refresh to see calculated margin
- ❌ No timeout handling for failed calculations

### Target State

**After Implementation:**

- ✅ User sees "Расчёт маржи начат..." notification
- ✅ Frontend polls backend every 3-5 seconds
- ✅ UI automatically updates when margin appears
- ✅ Success notification with margin percentage
- ✅ Graceful timeout handling with manual refresh option
- ✅ **Request #17 (2025-01-27)**: Warning alert when COGS assigned with future date
- ✅ **Request #17 (2025-01-27)**: Manual recalculation button for historical weeks

---

## 📐 Architecture Design

### Component Structure

```
src/
├── hooks/
│   ├── useMarginPolling.ts          # NEW: Core polling logic
│   ├── useSingleCogsAssignment.ts   # UPDATE: Trigger polling
│   └── useBulkCogsAssignment.ts      # UPDATE: Trigger polling
├── lib/
│   └── margin-helpers.ts            # NEW: Helper functions
└── components/
    └── custom/
        ├── MarginCalculationStatus.tsx  # NEW: Status indicator
        ├── SingleCogsForm.tsx           # UPDATE: Show polling state
        └── ProductList.tsx              # UPDATE: Show polling status
```

### Data Flow

```
User assigns COGS
    ↓
POST /v1/products/:nmId/cogs
    ↓
Backend: COGS created + task enqueued
    ↓
Frontend: Show "Расчёт маржи начат..." toast
    ↓
Start polling: GET /v1/products/:nmId?include_cogs=true
    ↓
Poll every 3-5 seconds
    ↓
Check: current_margin_pct !== null?
    ↓
YES → Stop polling → Show success toast → Invalidate queries
NO → Continue polling (max 10-20 attempts)
    ↓
Timeout → Show warning → Offer manual refresh
```

---

## 🔧 Implementation Steps

### Phase 1: Core Polling Infrastructure

#### Step 1.1: Create Margin Helpers

**File:** `src/lib/margin-helpers.ts`

**Functions:**

1. `calculateAffectedWeeks(validFrom: string): string[]`
   - Calculate weeks from `valid_from` to current week
   - Return ISO week strings: ["2025-W41", "2025-W42", ...]
   - Handle future dates (return empty array)

2. `estimateCalculationTime(weeks: string[]): number`
   - Estimate: `weeks.length * 5` seconds
   - Min: 5s, Max: 60s

3. `getPollingStrategy(validFrom: string, isBulk: boolean): PollingConfig`
   - Single (current): 3s interval, 10 attempts (30s)
   - Single (historical): 5s interval, 10 attempts (50s)
   - Bulk: 5s interval, 20 attempts (100s)

**Implementation:**

```typescript
// src/lib/margin-helpers.ts
export interface PollingConfig {
  interval: number      // Polling interval in milliseconds
  maxAttempts: number   // Maximum polling attempts
  estimatedTime: number // Estimated calculation time in milliseconds
}

export function calculateAffectedWeeks(validFrom: string): string[] {
  // Implementation: Calculate weeks from validFrom to today
  // Use Europe/Moscow timezone
  // Return ISO week strings
}

export function estimateCalculationTime(weeks: string[]): number {
  // Implementation: weeks.length * 5000 (5 seconds per week)
  // Clamp between 5000 and 60000
}

export function getPollingStrategy(
  validFrom: string,
  isBulk: boolean
): PollingConfig {
  // Implementation: Determine strategy based on date and operation type
}
```

#### Step 1.2: Create Polling Hook

**File:** `src/hooks/useMarginPolling.ts`

**Interface:**

```typescript
interface UseMarginPollingOptions {
  nmId: string
  enabled: boolean
  strategy: PollingConfig
  onSuccess?: (margin: number) => void
  onTimeout?: () => void
}

interface UseMarginPollingResult {
  isPolling: boolean
  attempts: number
  timeout: boolean
  margin: number | null
}
```

**Implementation:**

- Use `setInterval` for polling
- Fetch `GET /v1/products/:nmId?include_cogs=true`
- Check `current_margin_pct !== null`
- Cleanup on unmount or when margin appears
- Handle timeout scenarios

**Key Features:**

- Automatic cleanup
- Configurable interval and max attempts
- Success/timeout callbacks
- State tracking (isPolling, attempts, timeout)

### Phase 2: Integration with COGS Assignment

#### Step 2.1: Update Single COGS Assignment Hook

**File:** `src/hooks/useSingleCogsAssignment.ts`

**Changes:**

1. After successful COGS assignment, calculate affected weeks
2. Determine polling strategy based on `valid_from` date
3. Start polling with appropriate configuration
4. Show "Расчёт маржи начат..." toast
5. On success: Show margin percentage toast
6. On timeout: Show warning with manual refresh option

**Integration Point:**

```typescript
onSuccess: (data, variables) => {
  // Existing: Invalidate queries
  queryClient.invalidateQueries({ queryKey: ['products'] })

  // NEW: Start polling if margin not available
  if (data.current_margin_pct === null && data.has_cogs) {
    const weeks = calculateAffectedWeeks(variables.cogs.valid_from)
    const strategy = getPollingStrategy(variables.cogs.valid_from, false)

    toast.info('Расчёт маржи начат...', {
      description: `Ожидаемое время: ~${strategy.estimatedTime / 1000}с`
    })

    startPolling({
      nmId: variables.nmId,
      strategy,
      onSuccess: (margin) => {
        toast.success(`Маржа рассчитана: ${margin.toFixed(2)}%`)
        queryClient.invalidateQueries({ queryKey: ['products'] })
      },
      onTimeout: () => {
        toast.warning('Расчёт маржи занимает больше времени. Обновите страницу через минуту.')
      }
    })
  }
}
```

#### Step 2.2: Update Bulk COGS Assignment Hook

**File:** `src/hooks/useBulkCogsAssignment.ts`

**Changes:**

1. After successful bulk assignment, use bulk polling strategy
2. Poll sample products (first 10 from bulk upload)
3. Show progress indicator for bulk operations
4. Handle timeout with appropriate message

**Integration Point:**

```typescript
onSuccess: (data, variables) => {
  // Existing: Invalidate queries

  // NEW: Start bulk polling
  if (data.data.succeeded > 0) {
    const strategy = getPollingStrategy(new Date().toISOString(), true)

    toast.info(`Расчёт маржи для ${data.data.succeeded} товаров начат...`, {
      description: `Ожидаемое время: ~${strategy.estimatedTime / 1000}с`
    })

    startBulkPolling({
      sampleNmIds: variables.items.slice(0, 10).map(i => i.nm_id),
      strategy,
      onSuccess: () => {
        toast.success('Маржа рассчитана для всех товаров')
        queryClient.invalidateQueries({ queryKey: ['products'] })
      },
      onTimeout: () => {
        toast.warning('Расчёт маржи занимает больше времени. Обновите страницу через минуту.')
      }
    })
  }
}
```

### Phase 3: UI Components

#### Step 3.1: Create Margin Calculation Status Component

**File:** `src/components/custom/MarginCalculationStatus.tsx`

**Props:**

```typescript
interface MarginCalculationStatusProps {
  isPolling: boolean
  attempts: number
  maxAttempts: number
  estimatedTime: number
  isBulk?: boolean
  bulkCount?: number
}
```

**Features:**

- Show "Расчёт..." indicator with spinner
- Display progress for bulk operations
- Use shadcn/ui Progress or Skeleton component
- Accessible: ARIA labels

#### Step 3.2: Update SingleCogsForm

**File:** `src/components/custom/SingleCogsForm.tsx`

**Changes:**

1. Show polling state during margin calculation
2. Disable form inputs during polling
3. Display "Ожидание расчёта маржи..." message
4. Show MarginCalculationStatus component

#### Step 3.3: Update ProductList

**File:** `src/components/custom/ProductList.tsx`

**Changes:**

1. Show "Расчёт..." badge for products being calculated
2. Update margin display when polling completes
3. Use optimistic UI pattern

---

## 📊 Polling Strategies

### Strategy 1: Single Product (Current Date)

**Configuration:**

- Interval: 3 seconds
- Max Attempts: 10
- Total Time: 30 seconds
- Estimated Backend Time: 5-10 seconds

**Use Case:** User assigns COGS with today's date

### Strategy 2: Single Product (Historical Date)

**Configuration:**

- Interval: 5 seconds
- Max Attempts: 10
- Total Time: 50 seconds
- Estimated Backend Time: 20-30 seconds

**Use Case:** User assigns COGS with date 6 weeks ago

### Strategy 3: Bulk Assignment

**Configuration:**

- Interval: 5 seconds
- Max Attempts: 20
- Total Time: 100 seconds
- Estimated Backend Time: 45-60 seconds

**Use Case:** User uploads 500 products via bulk assignment

---

## 🧪 Testing Strategy

### Unit Tests

**File:** `src/hooks/useMarginPolling.test.ts`

- Test polling with different strategies
- Test cleanup on unmount
- Test timeout handling
- Test success/timeout callbacks

**File:** `src/lib/margin-helpers.test.ts`

- Test `calculateAffectedWeeks()` with various dates
- Test `estimateCalculationTime()` with different week counts
- Test `getPollingStrategy()` for all scenarios

### Integration Tests

**File:** `src/hooks/useSingleCogsAssignment.test.ts` (update)

- Test polling integration after COGS assignment
- Test toast notifications
- Test query invalidation after polling success

**File:** `src/hooks/useBulkCogsAssignment.test.ts` (update)

- Test bulk polling integration
- Test progress indicators
- Test timeout handling for bulk operations

### E2E Tests

**File:** `e2e/margin-recalculation-polling.spec.ts` (new)

- Test single product polling flow
- Test historical date polling flow
- Test bulk assignment polling flow
- Test timeout scenarios

---

## 📝 Implementation Checklist

### Phase 1: Core Infrastructure

- [ ] Create `src/lib/margin-helpers.ts` with helper functions
- [ ] Create `src/hooks/useMarginPolling.ts` with polling logic
- [ ] Add unit tests for helpers and polling hook
- [ ] Test polling with different strategies

### Phase 2: Integration

- [ ] Update `useSingleCogsAssignment.ts` to trigger polling
- [ ] Update `useBulkCogsAssignment.ts` to trigger polling
- [ ] Add toast notifications for status updates
- [ ] Test integration with COGS assignment flows

### Phase 3: UI Components

- [ ] Create `MarginCalculationStatus.tsx` component
- [ ] Update `SingleCogsForm.tsx` to show polling state
- [ ] Update `ProductList.tsx` to show polling status
- [ ] Test UI updates during polling

### Phase 4: Testing & Polish

- [ ] Add integration tests
- [ ] Add E2E tests
- [ ] Test timeout scenarios
- [ ] Test error handling
- [ ] Accessibility audit (WCAG AA)
- [ ] Performance testing (polling efficiency)

---

## 🎨 User Experience Flow

### Flow 1: Single Product (Current Date)

```
1. User assigns COGS (valid_from = today)
   ↓
2. Toast: "Себестоимость назначена успешно"
   ↓
3. Toast: "Расчёт маржи начат... Ожидаемое время: ~10с"
   ↓
4. Form shows: "Ожидание расчёта маржи..." (disabled)
   ↓
5. Polling every 3 seconds (max 10 attempts)
   ↓
6. After 5-10 seconds: Margin appears
   ↓
7. Toast: "Маржа рассчитана: 12.5%"
   ↓
8. Form enabled, margin displayed in product list
```

### Flow 2: Historical Date (6 Weeks Back)

```
1. User assigns COGS (valid_from = 6 weeks ago)
   ↓
2. Toast: "Себестоимость назначена успешно"
   ↓
3. Toast: "Расчёт маржи для 7 недель начат... Ожидаемое время: ~30с"
   ↓
4. Polling every 5 seconds (max 10 attempts)
   ↓
5. After 20-30 seconds: Margin appears
   ↓
6. Toast: "Маржа рассчитана: 12.5%"
   ↓
7. UI updated with margin data
```

### Flow 3: Bulk Assignment (500 Products)

```
1. User uploads 500 products
   ↓
2. Toast: "Загружено 500 товаров. Расчёт маржи начат... Ожидаемое время: ~60с"
   ↓
3. Progress indicator: "Расчёт для 500 товаров..."
   ↓
4. Polling every 5 seconds (max 20 attempts)
   ↓
5. After 45-60 seconds: Margin appears for sample products
   ↓
6. Toast: "Маржа рассчитана для всех товаров"
   ↓
7. Product list refreshed with margin data
```

### Flow 4: Timeout Scenario

```
1. User assigns COGS
   ↓
2. Polling starts (max 10 attempts = 30 seconds)
   ↓
3. After 30 seconds: Margin still not available
   ↓
4. Toast: "Расчёт маржи занимает больше времени. Обновите страницу через минуту."
   ↓
5. Polling stops
   ↓
6. User can manually refresh page
```

---

## 🔍 Technical Details

### Polling Implementation

**Hook Structure:**

```typescript
export function useMarginPolling(options: UseMarginPollingOptions) {
  const [isPolling, setIsPolling] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [timeout, setTimeout] = useState(false)
  const [margin, setMargin] = useState<number | null>(null)

  useEffect(() => {
    if (!options.enabled) return

    setIsPolling(true)
    let attemptCount = 0

    const interval = setInterval(async () => {
      attemptCount++
      setAttempts(attemptCount)

      // Fetch product data
      const product = await apiClient.get(`/v1/products/${options.nmId}?include_cogs=true`)

      if (product.current_margin_pct !== null) {
        // Success: Margin available
        clearInterval(interval)
        setIsPolling(false)
        setMargin(product.current_margin_pct)
        options.onSuccess?.(product.current_margin_pct)
      } else if (attemptCount >= options.strategy.maxAttempts) {
        // Timeout: Max attempts reached
        clearInterval(interval)
        setIsPolling(false)
        setTimeout(true)
        options.onTimeout?.()
      }
    }, options.strategy.interval)

    // Cleanup on unmount
    return () => clearInterval(interval)
  }, [options.enabled, options.nmId, options.strategy])

  return { isPolling, attempts, timeout, margin }
}
```

### Error Handling

**Scenarios:**

1. **Network Error:** Retry with exponential backoff
2. **API Error (500):** Show error toast, stop polling
3. **Timeout:** Show warning, offer manual refresh
4. **Component Unmount:** Cleanup polling interval

### Performance Considerations

**Optimizations:**

- Polling interval: 3-5 seconds (not too frequent)
- Max attempts: 10-20 (prevent infinite polling)
- Cleanup on unmount (prevent memory leaks)
- Single API call per poll (efficient)

**Backend Load:**

- Polling frequency: 1 request per 3-5 seconds
- Max duration: 30-100 seconds
- Total requests: 10-20 per COGS assignment
- Acceptable for MVP (can optimize later with WebSocket)

---

## ✅ Acceptance Criteria Mapping

| AC                                               | Implementation                       | File                                                     |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------- |
| 1. Notification "Расчёт маржи начат..."          | Toast in COGS hooks                  | `useSingleCogsAssignment.ts`, `useBulkCogsAssignment.ts` |
| 2. Polling every 3-5 seconds                     | `useMarginPolling` hook              | `useMarginPolling.ts`                                    |
| 3. Auto-update UI when margin ready              | Query invalidation + polling success | `useMarginPolling.ts`                                    |
| 4. Success notification with margin              | Toast in polling success callback    | `useMarginPolling.ts`                                    |
| 5. Polling stops after margin or timeout         | Cleanup logic in hook                | `useMarginPolling.ts`                                    |
| 6. Different strategies (single/historical/bulk) | `getPollingStrategy()` helper        | `margin-helpers.ts`                                      |
| 7. Error handling with timeout warning           | Timeout callback + toast             | `useMarginPolling.ts`                                    |
| 8. Optimistic UI "Расчёт..." indicator           | `MarginCalculationStatus` component  | `MarginCalculationStatus.tsx`                            |
| 9. Disable form during polling                   | Form state management                | `SingleCogsForm.tsx`                                     |
| 10. Query invalidation after success             | Invalidate in polling success        | `useMarginPolling.ts`                                    |

---

## 📚 Related Documentation

**Backend:**

- Request #14: `docs/request-backend/14-automatic-margin-recalculation-on-cogs-update.md`
- Backend Response: `docs/request-backend/REQUEST-14-BACKEND-RESPONSE.md`
- Epic 20 Completion: Backend Epic 20 (2025-01-26)

**Frontend:**

- Story 4.1: `docs/stories/4.1.single-product-cogs-assignment.md`
- Story 4.2: `docs/stories/4.2.bulk-cogs-assignment.md`
- Story 4.4: `docs/stories/4.4.automatic-margin-calculation-display.md`
- Story 4.8: `docs/stories/4.8.margin-recalculation-polling.md` (this story)

**Architecture:**

- Frontend Architecture: `docs/front-end-architecture.md`
- API Integration Guide: `docs/api-integration-guide.md`

---

## 🚀 Next Steps

1. **Review Story 4.8** with Product Owner
2. **Approve Story 4.8** for development
3. **Assign to Dev Agent** for implementation
4. **Implement Phase 1** (Core Infrastructure)
5. **Implement Phase 2** (Integration)
6. **Implement Phase 3** (UI Components)
7. **Testing & QA Review**
8. **Deploy to Production**

---

## 📝 Notes

- **Backend Ready:** Epic 20 complete, APIs available
- **Story Created:** Story 4.8 in Epic 4
- **Estimated Time:** 4-6 hours implementation
- **Priority:** High (improves UX significantly)
- **Dependencies:** Story 4.1, Story 4.2, Story 4.4 (all complete)

---

**Plan Created:** 2025-01-26  
**Status:** ✅ **READY FOR IMPLEMENTATION**  
**Story:** 4.8.margin-recalculation-polling.md

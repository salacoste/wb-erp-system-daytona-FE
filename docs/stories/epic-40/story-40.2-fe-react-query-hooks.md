# Story 40.2-FE: React Query Hooks for Orders Module

## Story Info

- **Epic**: 40-FE - Orders UI & WB Native Status History
- **Sprint**: 1 (Feb 3-14)
- **Priority**: P0 (Foundation)
- **Points**: 3 SP
- **Status**: ✅ Complete
- **Depends On**: Story 40.1-FE (Types & API Client)

---

## User Story

**As a** frontend developer,
**I want** React Query hooks for the Orders module endpoints,
**So that** I can efficiently fetch, cache, and manage orders data with proper loading and error states.

**Non-goals**:
- UI components (stories 40.3-40.6)
- Custom pagination logic (handled by useOrders hook)

---

## Acceptance Criteria

### AC1: Query Keys Factory (src/hooks/useOrders.ts)

- [ ] Create `ordersQueryKeys` factory following TanStack Query v5 patterns
- [ ] Keys for: `all`, `list`, `detail`, `localHistory`, `wbHistory`, `fullHistory`
- [ ] Keys for: `syncStatus`
- [ ] Support parameterized keys for filtering/sorting

### AC2: Orders List Hook

- [ ] `useOrders(params, options)` returns paginated list with `{ data, isLoading, error, isFetching }`
- [ ] Support filtering by date range, status, nmId
- [ ] Support sorting by column
- [ ] `enabled` prop handling for conditional fetching
- [ ] Proper cache configuration (staleTime, gcTime)

### AC3: Order Detail Hook

- [ ] `useOrderDetails(orderId, options)` returns single order with extended info
- [ ] `enabled` prop requires valid orderId
- [ ] Returns `OrderFbsDetails` type

### AC4: History Hooks (src/hooks/useOrderHistory.ts)

- [ ] `useLocalHistory(orderId, options)` - Local status history
- [ ] `useWbHistory(orderId, options)` - WB native history (40+ codes)
- [ ] `useFullHistory(orderId, options)` - Merged timeline
- [ ] On-demand fetching: `enabled` should be controlled by caller (e.g., tab visibility)

### AC5: Analytics Hooks (src/hooks/useOrdersAnalytics.ts)

- [ ] `useVelocityMetrics(from, to, options)` - Processing velocity
- [ ] `useSlaMetrics(options)` - SLA compliance with at-risk orders
- [ ] `useVolumeMetrics(from, to, options)` - Order volume trends
- [ ] Proper refetch intervals for real-time SLA data (1 minute)

### AC6: Mutation Hooks

- [ ] `useOrdersSync()` - Trigger manual sync, returns `{ mutate, isPending }`
- [ ] `useInvalidateOrdersQueries()` - Helper to invalidate all orders queries

### AC7: Cache Configuration

- [ ] Orders list: staleTime 30s, gcTime 5min
- [ ] Order details: staleTime 30s, gcTime 5min
- [ ] History data: staleTime 30s, gcTime 5min, refetchOnWindowFocus: false
- [ ] SLA metrics: staleTime 0 (real-time), refetchInterval 60000ms
- [ ] Velocity/Volume: staleTime 300s (5 min), gcTime 10min

---

## Technical Details

### Files to Create

| File | Lines (Est.) | Description |
|------|--------------|-------------|
| `src/hooks/useOrders.ts` | ~150 | Orders list, details, sync hooks |
| `src/hooks/useOrderHistory.ts` | ~120 | History hooks (local, WB, full) |
| `src/hooks/useOrdersAnalytics.ts` | ~130 | Analytics hooks (velocity, SLA, volume) |

### Hook Signatures

#### Orders Hooks (src/hooks/useOrders.ts)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getOrders,
  getOrderById,
  triggerOrdersSync,
  getOrdersSyncStatus,
} from '@/lib/api/orders'
import type {
  OrdersListParams,
  OrdersListResponse,
  OrderFbsDetails,
  TriggerSyncResponse,
  SyncStatusResponse,
} from '@/types/orders'

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Query keys for orders module
 * Follows TanStack Query v5 patterns with factory functions
 */
export const ordersQueryKeys = {
  /** Base key for all orders queries */
  all: ['orders'] as const,

  /** Key for orders list with params */
  list: (params: OrdersListParams) =>
    [...ordersQueryKeys.all, 'list', params] as const,

  /** Key for single order details */
  detail: (orderId: string) =>
    [...ordersQueryKeys.all, 'detail', orderId] as const,

  /** Key for local history */
  localHistory: (orderId: string) =>
    [...ordersQueryKeys.all, 'local-history', orderId] as const,

  /** Key for WB native history */
  wbHistory: (orderId: string) =>
    [...ordersQueryKeys.all, 'wb-history', orderId] as const,

  /** Key for full merged history */
  fullHistory: (orderId: string) =>
    [...ordersQueryKeys.all, 'full-history', orderId] as const,

  /** Key for sync status */
  syncStatus: () =>
    [...ordersQueryKeys.all, 'sync-status'] as const,
}

// ============================================================================
// Orders List Hook
// ============================================================================

export interface UseOrdersOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Refetch interval in ms */
  refetchInterval?: number
}

/**
 * Hook to fetch orders list with filters and pagination
 *
 * @param params - Filter and pagination parameters
 * @param options - Hook options
 * @returns Query result with paginated orders
 *
 * @example
 * const { data, isLoading } = useOrders({
 *   from: '2026-01-01',
 *   to: '2026-01-07',
 *   supplier_status: 'new',
 *   sort_by: 'created_at',
 *   sort_order: 'desc',
 *   limit: 50,
 *   offset: 0,
 * });
 */
export function useOrders(
  params: OrdersListParams = {},
  options: UseOrdersOptions = {},
) {
  const { enabled = true, refetchInterval } = options

  return useQuery<OrdersListResponse, Error>({
    queryKey: ordersQueryKeys.list(params),
    queryFn: () => getOrders(params),
    enabled,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval,
    retry: 1,
  })
}

// ============================================================================
// Order Details Hook
// ============================================================================

export interface UseOrderDetailsOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Hook to fetch single order details
 *
 * @param orderId - WB Order ID
 * @param options - Hook options
 * @returns Query result with extended order details
 *
 * @example
 * const { data: order } = useOrderDetails('1234567890', {
 *   enabled: !!selectedOrderId,
 * });
 */
export function useOrderDetails(
  orderId: string | null,
  options: UseOrderDetailsOptions = {},
) {
  const { enabled = true } = options

  return useQuery<OrderFbsDetails, Error>({
    queryKey: ordersQueryKeys.detail(orderId ?? ''),
    queryFn: () => {
      if (!orderId) throw new Error('Order ID is required')
      return getOrderById(orderId)
    },
    enabled: enabled && !!orderId,
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

// ============================================================================
// Sync Hooks
// ============================================================================

/**
 * Hook to get orders sync status
 *
 * @returns Query result with sync status info
 *
 * @example
 * const { data: syncStatus } = useOrdersSyncStatus();
 * console.log(syncStatus?.lastSyncAt);
 */
export function useOrdersSyncStatus() {
  return useQuery<SyncStatusResponse, Error>({
    queryKey: ordersQueryKeys.syncStatus(),
    queryFn: getOrdersSyncStatus,
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

export interface UseOrdersSyncOptions {
  /** Callback on successful sync trigger */
  onSuccess?: (data: TriggerSyncResponse) => void
  /** Callback on error */
  onError?: (error: Error) => void
}

/**
 * Hook to trigger manual orders sync
 *
 * @param options - Mutation callbacks
 * @returns Mutation object with mutate function
 *
 * @example
 * const { mutate: triggerSync, isPending } = useOrdersSync({
 *   onSuccess: (data) => toast.success(`Sync job started: ${data.jobId}`),
 * });
 */
export function useOrdersSync(options: UseOrdersSyncOptions = {}) {
  const queryClient = useQueryClient()

  return useMutation<TriggerSyncResponse, Error, void>({
    mutationFn: triggerOrdersSync,
    onSuccess: (data) => {
      console.info('[Orders] Sync triggered:', data.jobId)
      // Invalidate sync status to show pending job
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.syncStatus(),
      })
      options.onSuccess?.(data)
    },
    onError: (error) => {
      console.error('[Orders] Sync failed:', error)
      options.onError?.(error)
    },
  })
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Hook to invalidate all orders queries
 * Use after sync completion or data changes
 *
 * @returns Function to invalidate all orders queries
 *
 * @example
 * const invalidateOrders = useInvalidateOrdersQueries();
 * // After some action
 * invalidateOrders();
 */
export function useInvalidateOrdersQueries() {
  const queryClient = useQueryClient()

  return () => {
    console.info('[Orders] Invalidating all orders queries')
    queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all })
  }
}
```

#### History Hooks (src/hooks/useOrderHistory.ts)

```typescript
import { useQuery } from '@tanstack/react-query'
import {
  getOrderHistory,
  getWbHistory,
  getFullHistory,
} from '@/lib/api/orders'
import type {
  LocalHistoryResponse,
  WbHistoryResponse,
  FullHistoryResponse,
} from '@/types/orders-history'
import { ordersQueryKeys } from './useOrders'

// ============================================================================
// History Cache Configuration
// ============================================================================

const HISTORY_CACHE_CONFIG = {
  staleTime: 30000, // 30 seconds
  gcTime: 300000, // 5 minutes
  refetchOnWindowFocus: false, // History data doesn't change frequently
  retry: 1,
}

// ============================================================================
// Local History Hook
// ============================================================================

export interface UseLocalHistoryOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Hook to fetch local status history for an order
 *
 * @param orderId - WB Order ID
 * @param options - Hook options
 * @returns Query result with local status history
 *
 * @example
 * const { data: history } = useLocalHistory(orderId, {
 *   enabled: activeTab === 'local',
 * });
 */
export function useLocalHistory(
  orderId: string | null,
  options: UseLocalHistoryOptions = {},
) {
  const { enabled = true } = options

  return useQuery<LocalHistoryResponse, Error>({
    queryKey: ordersQueryKeys.localHistory(orderId ?? ''),
    queryFn: () => {
      if (!orderId) throw new Error('Order ID is required')
      return getOrderHistory(orderId)
    },
    enabled: enabled && !!orderId,
    ...HISTORY_CACHE_CONFIG,
  })
}

// ============================================================================
// WB Native History Hook
// ============================================================================

export interface UseWbHistoryOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Hook to fetch WB native status history for an order
 * Returns 40+ detailed WB status codes with timestamps
 *
 * @param orderId - WB Order ID
 * @param options - Hook options
 * @returns Query result with WB native status history
 *
 * @example
 * // Fetch only when WB tab is active
 * const { data: wbHistory } = useWbHistory(orderId, {
 *   enabled: activeTab === 'wb',
 * });
 */
export function useWbHistory(
  orderId: string | null,
  options: UseWbHistoryOptions = {},
) {
  const { enabled = true } = options

  return useQuery<WbHistoryResponse, Error>({
    queryKey: ordersQueryKeys.wbHistory(orderId ?? ''),
    queryFn: () => {
      if (!orderId) throw new Error('Order ID is required')
      return getWbHistory(orderId)
    },
    enabled: enabled && !!orderId,
    ...HISTORY_CACHE_CONFIG,
  })
}

// ============================================================================
// Full History Hook (Merged Timeline)
// ============================================================================

export interface UseFullHistoryOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Hook to fetch merged full history (local + WB native)
 * Sorted chronologically by timestamp
 *
 * @param orderId - WB Order ID
 * @param options - Hook options
 * @returns Query result with merged history timeline
 *
 * @example
 * // Fetch when full history tab is active
 * const { data: fullHistory } = useFullHistory(orderId, {
 *   enabled: activeTab === 'full',
 * });
 *
 * // Render timeline
 * fullHistory?.fullHistory.map((entry) => {
 *   if (entry.source === 'local') {
 *     // Render local entry
 *   } else {
 *     // Render WB native entry with getWbStatusLabel(entry.wbStatusCode)
 *   }
 * });
 */
export function useFullHistory(
  orderId: string | null,
  options: UseFullHistoryOptions = {},
) {
  const { enabled = true } = options

  return useQuery<FullHistoryResponse, Error>({
    queryKey: ordersQueryKeys.fullHistory(orderId ?? ''),
    queryFn: () => {
      if (!orderId) throw new Error('Order ID is required')
      return getFullHistory(orderId)
    },
    enabled: enabled && !!orderId,
    ...HISTORY_CACHE_CONFIG,
  })
}
```

#### Analytics Hooks (src/hooks/useOrdersAnalytics.ts)

```typescript
import { useQuery } from '@tanstack/react-query'
import {
  getVelocityMetrics,
  getSlaMetrics,
  getVolumeMetrics,
} from '@/lib/api/orders-analytics'
import type {
  VelocityMetricsParams,
  VelocityMetricsResponse,
  SlaMetricsParams,
  SlaMetricsResponse,
  VolumeMetricsParams,
  VolumeMetricsResponse,
} from '@/types/orders-analytics'

// ============================================================================
// Analytics Query Keys
// ============================================================================

export const ordersAnalyticsQueryKeys = {
  /** Base key for all orders analytics queries */
  all: ['orders-analytics'] as const,

  /** Key for velocity metrics */
  velocity: (params: VelocityMetricsParams) =>
    [...ordersAnalyticsQueryKeys.all, 'velocity', params] as const,

  /** Key for SLA metrics */
  sla: (params: SlaMetricsParams) =>
    [...ordersAnalyticsQueryKeys.all, 'sla', params] as const,

  /** Key for volume metrics */
  volume: (params: VolumeMetricsParams) =>
    [...ordersAnalyticsQueryKeys.all, 'volume', params] as const,
}

// ============================================================================
// Velocity Metrics Hook
// ============================================================================

export interface UseVelocityMetricsOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Hook to fetch order processing velocity metrics
 * Returns average times, percentiles, and breakdowns
 *
 * @param from - Start date (ISO string)
 * @param to - End date (ISO string)
 * @param options - Hook options
 * @returns Query result with velocity metrics
 *
 * @example
 * const { data: velocity } = useVelocityMetrics(
 *   '2026-01-01',
 *   '2026-01-31',
 * );
 * console.log(velocity?.avgConfirmationTimeMinutes);
 */
export function useVelocityMetrics(
  from: string,
  to: string,
  options: UseVelocityMetricsOptions = {},
) {
  const { enabled = true } = options
  const params: VelocityMetricsParams = { from, to }

  return useQuery<VelocityMetricsResponse, Error>({
    queryKey: ordersAnalyticsQueryKeys.velocity(params),
    queryFn: () => getVelocityMetrics(params),
    enabled: enabled && !!from && !!to,
    staleTime: 300000, // 5 minutes (not real-time)
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

// ============================================================================
// SLA Metrics Hook
// ============================================================================

export interface UseSlaMetricsOptions extends Partial<SlaMetricsParams> {
  /** Enable/disable the query */
  enabled?: boolean
  /** Refetch interval in ms (default: 60000 for real-time) */
  refetchInterval?: number
}

/**
 * Hook to fetch SLA compliance metrics
 * Returns compliance percentages and at-risk orders list
 *
 * Real-time polling enabled by default (1 minute interval)
 *
 * @param options - SLA thresholds and hook options
 * @returns Query result with SLA metrics
 *
 * @example
 * const { data: sla } = useSlaMetrics({
 *   confirmationSlaHours: 2,
 *   completionSlaHours: 24,
 *   atRiskLimit: 20,
 * });
 * console.log(`At risk: ${sla?.atRiskTotal}`);
 */
export function useSlaMetrics(options: UseSlaMetricsOptions = {}) {
  const {
    enabled = true,
    refetchInterval = 60000, // 1 minute default
    confirmationSlaHours,
    completionSlaHours,
    atRiskLimit,
    atRiskOffset,
  } = options

  const params: SlaMetricsParams = {
    confirmationSlaHours,
    completionSlaHours,
    atRiskLimit,
    atRiskOffset,
  }

  return useQuery<SlaMetricsResponse, Error>({
    queryKey: ordersAnalyticsQueryKeys.sla(params),
    queryFn: () => getSlaMetrics(params),
    enabled,
    staleTime: 0, // Always fetch fresh for real-time SLA
    gcTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
    refetchInterval,
    retry: 1,
  })
}

// ============================================================================
// Volume Metrics Hook
// ============================================================================

export interface UseVolumeMetricsOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Hook to fetch order volume metrics
 * Returns hourly/daily trends, peak hours, cancellation rate
 *
 * @param from - Start date (ISO string)
 * @param to - End date (ISO string)
 * @param options - Hook options
 * @returns Query result with volume metrics
 *
 * @example
 * const { data: volume } = useVolumeMetrics(
 *   '2026-01-01',
 *   '2026-01-31',
 * );
 * console.log(`Peak hours: ${volume?.peakHours.join(', ')}`);
 */
export function useVolumeMetrics(
  from: string,
  to: string,
  options: UseVolumeMetricsOptions = {},
) {
  const { enabled = true } = options
  const params: VolumeMetricsParams = { from, to }

  return useQuery<VolumeMetricsResponse, Error>({
    queryKey: ordersAnalyticsQueryKeys.volume(params),
    queryFn: () => getVolumeMetrics(params),
    enabled: enabled && !!from && !!to,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: true,
    retry: 1,
  })
}
```

---

## Tasks / Subtasks

### Phase 1: Query Keys & Orders Hooks (1.5 SP)

- [ ] Create `src/hooks/useOrders.ts`
- [ ] Define `ordersQueryKeys` factory
- [ ] Implement `useOrders()` hook with pagination
- [ ] Implement `useOrderDetails()` hook
- [ ] Implement `useOrdersSyncStatus()` hook
- [ ] Implement `useOrdersSync()` mutation hook
- [ ] Implement `useInvalidateOrdersQueries()` helper

### Phase 2: History Hooks (0.75 SP)

- [ ] Create `src/hooks/useOrderHistory.ts`
- [ ] Implement `useLocalHistory()` hook
- [ ] Implement `useWbHistory()` hook
- [ ] Implement `useFullHistory()` hook
- [ ] Configure on-demand fetching with `enabled` prop
- [ ] Set appropriate cache config (refetchOnWindowFocus: false)

### Phase 3: Analytics Hooks (0.75 SP)

- [ ] Create `src/hooks/useOrdersAnalytics.ts`
- [ ] Define `ordersAnalyticsQueryKeys` factory
- [ ] Implement `useVelocityMetrics()` hook
- [ ] Implement `useSlaMetrics()` hook with real-time polling
- [ ] Implement `useVolumeMetrics()` hook

### Phase 4: Validation

- [ ] Run `npm run type-check` - no errors
- [ ] Run `npm run lint` - no errors
- [ ] Verify all files under 200 lines
- [ ] Test hooks compile with correct types

---

## Dev Notes

### Cache Strategy by Data Type

| Data Type | staleTime | gcTime | refetchInterval | Rationale |
|-----------|-----------|--------|-----------------|-----------|
| Orders list | 30s | 5min | - | Semi-realtime, may change |
| Order details | 30s | 5min | - | May be viewed repeatedly |
| History | 30s | 5min | - | Doesn't change after fetch |
| SLA metrics | 0 | 1min | 60s | Real-time monitoring |
| Velocity/Volume | 5min | 10min | - | Historical aggregates |

### On-Demand History Fetching

History hooks should only fetch when the user needs the data:

```typescript
// In OrderDetailsModal component
const [activeTab, setActiveTab] = useState<'full' | 'wb' | 'local'>('full')

const { data: fullHistory } = useFullHistory(orderId, {
  enabled: activeTab === 'full',
})

const { data: wbHistory } = useWbHistory(orderId, {
  enabled: activeTab === 'wb',
})

const { data: localHistory } = useLocalHistory(orderId, {
  enabled: activeTab === 'local',
})
```

### Integration with WB Status Mapping

Use existing utilities from `src/lib/wb-status-mapping.ts`:

```typescript
import { getWbStatusLabel, getWbStatusConfig } from '@/lib/wb-status-mapping'

// In component
{wbHistory?.wbHistory.map((entry) => (
  <div key={entry.id}>
    <span className={getWbStatusConfig(entry.wbStatusCode).color}>
      {getWbStatusLabel(entry.wbStatusCode)}
    </span>
  </div>
))}
```

### Similar Implementations Reference

- `src/hooks/useStorageAnalytics.ts` - Query structure pattern
- `src/hooks/usePriceCalculator.ts` - Mutation pattern
- `src/hooks/useNotificationPreferences.ts` - Cache config pattern

---

## Definition of Done

- [ ] Hooks created and exported from:
  - `src/hooks/useOrders.ts`
  - `src/hooks/useOrderHistory.ts`
  - `src/hooks/useOrdersAnalytics.ts`
- [ ] Query keys factory defined for cache management
- [ ] All hooks follow TanStack Query v5 patterns
- [ ] No TypeScript errors (`npm run type-check` passes)
- [ ] ESLint passes (`npm run lint`)
- [ ] All files under 200 lines
- [ ] Proper `enabled` prop handling in all hooks
- [ ] Cache configuration appropriate per data type

---

## Dependencies

### Required (Blocking)

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 40.1-FE | Pending | Types & API Client (provides types and API functions) |
| TanStack Query v5 | ✅ Installed | React Query library |
| `src/lib/api-client.ts` | ✅ Exists | Centralized API client |

### Non-Blocking

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 40.3-FE | Pending | Orders List Page (consumes useOrders) |
| Story 40.4-FE | Pending | Order Details Modal (consumes useOrderDetails, history hooks) |
| Story 40.5-FE | Pending | History Timeline (consumes history hooks) |
| Story 40.6-FE | Pending | Analytics Dashboard (consumes analytics hooks) |

---

## Related

- **Types Story**: Story 40.1-FE (provides TypeScript interfaces)
- **Backend API**: `test-api/14-orders.http` - HTTP request examples
- **Similar impl**: `src/hooks/useStorageAnalytics.ts`
- **Epic spec**: `docs/epics/epic-40-fe-orders-wb-history.md`
- **WB Status Mapping**: `src/lib/wb-status-mapping.ts`

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-29 | Claude Code (PM Agent) | Initial draft |

---

## Dev Agent Record

_Section for Dev Agent to track implementation progress and decisions_

```
Status: Complete
Agent: Claude Code (Dev2)
Started: 2026-01-29
Completed: 2026-01-29
Notes:
- Created useOrders.ts (156 lines) with hooks for list, details, sync status, sync mutation
- Created useOrderHistory.ts (124 lines) with hooks for local, WB, and full history
- Created useOrdersAnalytics.ts (136 lines) with hooks for velocity, SLA, and volume metrics
- Re-exported query keys from API client for external use
- All files under 200 lines (ESLint requirement)
- Cache configurations per AC7: list 30s, history 30s, SLA 0 (real-time), velocity/volume 5min
- On-demand fetching via enabled prop for tab-based history UI
- Type-check passes, no lint errors
```

---

## QA Results

_Section for QA review_

```
Reviewer:
Date:
Gate Decision:
Quality Score:
```

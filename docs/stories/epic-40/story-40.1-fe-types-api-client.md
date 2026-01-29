# Story 40.1-FE: TypeScript Types & API Client Foundation

## Story Info

- **Epic**: 40-FE - Orders UI & WB Native Status History
- **Sprint**: 1 (Feb 3-14)
- **Priority**: P0 (Foundation)
- **Points**: 3 SP
- **Status**: ✅ Complete
- **Backend Dependency**: Epic 40, Story 40.9 (Complete)

---

## User Story

**As a** frontend developer,
**I want** TypeScript types and API client functions for the Orders module,
**So that** I can safely integrate with the backend Orders API endpoints.

**Non-goals**:
- React Query hooks (separate story 40.2-FE)
- UI components (stories 40.3-40.6)

---

## Acceptance Criteria

### AC1: Order Types (src/types/orders.ts)

- [ ] Create `OrderFbsItem` interface matching backend response
- [ ] Create `OrderFbsDetails` interface (extends Item with address, statusHistory)
- [ ] Create `OrdersListResponse` interface with items, pagination, query
- [ ] Create `OrderAddress` interface for delivery info
- [ ] Create `OrderPagination` interface (offset-based pagination)
- [ ] Create `SupplierStatus` type union: `'new' | 'confirm' | 'complete' | 'cancel'`
- [ ] Create `WbStatus` type union: `'waiting' | 'sorted' | 'sold' | 'canceled' | 'canceled_by_client' | 'defect'`
- [ ] Proper nullability handling where applicable

### AC2: Order History Types (src/types/orders-history.ts)

- [ ] Create `LocalHistoryEntry` interface for local status changes
- [ ] Create `WbHistoryEntry` interface for WB native status history
- [ ] Create `FullHistoryEntry` discriminated union (`source: 'local' | 'wb_native'`)
- [ ] Create `LocalHistoryResponse` interface with orderId, currentStatus, history, summary
- [ ] Create `WbHistoryResponse` interface with orderId, wbHistory, summary
- [ ] Create `FullHistoryResponse` interface with orderId, fullHistory, summary
- [ ] Create `HistorySummary` interfaces for local, WB, and combined histories
- [ ] Export re-usable from existing `src/lib/wb-status-mapping.ts`

### AC3: Orders Analytics Types (src/types/orders-analytics.ts)

- [ ] Create `VelocityMetrics` interface with avg times, percentiles, breakdowns
- [ ] Create `SlaMetrics` interface with compliance percentages, at-risk orders
- [ ] Create `AtRiskOrder` interface with orderId, createdAt, minutesRemaining, riskType
- [ ] Create `VolumeMetrics` interface with hourly/daily trends, cancellation rate

### AC4: Query Parameter Types

- [ ] Create `OrdersListParams` interface with filters (from, to, status, nmId, sort)
- [ ] Create `VelocityMetricsParams` interface with date range
- [ ] Create `SlaMetricsParams` interface with SLA thresholds, atRisk pagination
- [ ] Create `VolumeMetricsParams` interface with date range

### AC5: API Client Functions (src/lib/api/orders.ts)

- [ ] `getOrders(params)` - GET /v1/orders
- [ ] `getOrderById(orderId)` - GET /v1/orders/:orderId
- [ ] `getOrderHistory(orderId)` - GET /v1/orders/:orderId/history
- [ ] `getWbHistory(orderId)` - GET /v1/orders/:orderId/wb-history
- [ ] `getFullHistory(orderId)` - GET /v1/orders/:orderId/full-history
- [ ] `triggerOrdersSync()` - POST /v1/orders/sync
- [ ] `getOrdersSyncStatus()` - GET /v1/orders/sync-status

### AC6: Analytics API Functions (src/lib/api/orders-analytics.ts)

- [ ] `getVelocityMetrics(params)` - GET /v1/analytics/orders/velocity
- [ ] `getSlaMetrics(params)` - GET /v1/analytics/orders/sla
- [ ] `getVolumeMetrics(params)` - GET /v1/analytics/orders/volume

### AC7: Error Handling

- [ ] All functions use centralized `apiClient` with automatic auth headers
- [ ] Console logging for observability (development mode)
- [ ] Create `OrdersErrorResponse` interface with code, message, details

---

## Technical Details

### Files to Create

| File | Lines (Est.) | Description |
|------|--------------|-------------|
| `src/types/orders.ts` | ~120 | Order list & details types |
| `src/types/orders-history.ts` | ~150 | History types (local, WB, full) |
| `src/types/orders-analytics.ts` | ~100 | Analytics metrics types |
| `src/lib/api/orders.ts` | ~120 | Orders API client |
| `src/lib/api/orders-analytics.ts` | ~80 | Analytics API client |

### TypeScript Interfaces

#### Order Types (src/types/orders.ts)

```typescript
// Supplier status from our tracking
export type SupplierStatus = 'new' | 'confirm' | 'complete' | 'cancel'

// WB status from WB API
export type WbStatus =
  | 'waiting'
  | 'sorted'
  | 'sold'
  | 'canceled'
  | 'canceled_by_client'
  | 'defect'

/**
 * Order item in list view
 */
export interface OrderFbsItem {
  /** WB Order ID (string for BigInt compatibility) */
  orderId: string
  /** Order grouping UID */
  orderUid: string
  /** WB Article (SKU) */
  nmId: number
  /** Supplier article code */
  vendorCode: string
  /** Product name (enriched from products table) */
  productName: string | null
  /** Original price (RUB) */
  price: number
  /** Sale price after discount (RUB) */
  salePrice: number
  /** Seller-side status */
  supplierStatus: SupplierStatus
  /** WB-side status */
  wbStatus: WbStatus
  /** WB warehouse ID */
  warehouseId: number
  /** Delivery type (e.g., "fbs") */
  deliveryType: string
  /** B2B order flag */
  isB2B: boolean
  /** Cargo type (MGT/SGT/KGT+) */
  cargoType: string | null
  /** Order creation timestamp */
  createdAt: string
  /** Last status change timestamp */
  statusUpdatedAt: string
}

/**
 * Delivery address info
 */
export interface OrderAddress {
  /** Full address string */
  fullAddress: string | null
  /** Longitude coordinate */
  longitude: number | null
  /** Latitude coordinate */
  latitude: number | null
}

/**
 * Brief status history entry (in order details)
 */
export interface StatusHistoryBrief {
  supplierStatus: SupplierStatus
  wbStatus: WbStatus
  changedAt: string
}

/**
 * Extended order details (single order view)
 */
export interface OrderFbsDetails extends OrderFbsItem {
  /** Size/variant ID */
  chrtId: number
  /** Delivery address (optional) */
  address: OrderAddress | null
  /** Brief status history (newest first) */
  statusHistory: StatusHistoryBrief[]
  /** Processing time since creation (seconds) */
  processingTimeSeconds: number
  /** Last sync timestamp */
  syncedAt: string
}

/**
 * Offset-based pagination for orders
 */
export interface OrdersPagination {
  /** Total number of items */
  total: number
  /** Items per page */
  limit: number
  /** Current offset */
  offset: number
}

/**
 * Query info in response
 */
export interface OrdersQueryInfo {
  /** Filter start date */
  from: string | null
  /** Filter end date */
  to: string | null
}

/**
 * Response from GET /v1/orders
 */
export interface OrdersListResponse {
  items: OrderFbsItem[]
  pagination: OrdersPagination
  query: OrdersQueryInfo
}

/**
 * Response from POST /v1/orders/sync
 */
export interface TriggerSyncResponse {
  jobId: string
  message: string
}

/**
 * Response from GET /v1/orders/sync-status
 */
export interface SyncStatusResponse {
  enabled: boolean
  lastSyncAt: string | null
  nextSyncAt: string | null
  schedule: string
  timezone: string
}

/**
 * Query parameters for GET /v1/orders
 */
export interface OrdersListParams {
  /** Start date (ISO string) */
  from?: string
  /** End date (ISO string) */
  to?: string
  /** Filter by supplier status */
  supplier_status?: SupplierStatus
  /** Filter by WB status */
  wb_status?: WbStatus
  /** Filter by nm_id */
  nm_id?: number
  /** Sort field */
  sort_by?: 'created_at' | 'status_updated_at' | 'price' | 'sale_price'
  /** Sort direction */
  sort_order?: 'asc' | 'desc'
  /** Items per page (1-1000, default 100) */
  limit?: number
  /** Pagination offset */
  offset?: number
}
```

#### History Types (src/types/orders-history.ts)

```typescript
import type { SupplierStatus, WbStatus } from './orders'

/**
 * Local status history entry (from OrderStatusHistory table)
 */
export interface LocalHistoryEntry {
  /** Entry UUID */
  id: string
  /** Previous supplier status */
  oldSupplierStatus: SupplierStatus | null
  /** New supplier status */
  newSupplierStatus: SupplierStatus
  /** Previous WB status */
  oldWbStatus: WbStatus | null
  /** New WB status */
  newWbStatus: WbStatus
  /** Status change timestamp (ISO 8601) */
  changedAt: string
  /** Duration in this status (minutes, null for first entry) */
  durationMinutes: number | null
}

/**
 * WB native status history entry (from OrderWbStatusHistory table)
 * Uses 40+ detailed WB status codes
 */
export interface WbHistoryEntry {
  /** Entry UUID */
  id: string
  /** WB native status code (40+ possible values) */
  wbStatusCode: string
  /** Timestamp from WB API (ISO 8601) */
  wbStatusChangedAt: string
  /** Duration in this status (minutes, null for first entry) */
  durationMinutes: number | null
}

/**
 * Current order status info
 */
export interface CurrentOrderStatus {
  supplierStatus: SupplierStatus
  wbStatus: WbStatus
  /** True if order is in final state */
  isFinal: boolean
}

/**
 * Local history summary
 */
export interface LocalHistorySummary {
  /** Total number of status transitions */
  totalTransitions: number
  /** Total duration from first to last (minutes) */
  totalDurationMinutes: number | null
  /** Order creation timestamp */
  createdAt: string
  /** Completion timestamp (null if not completed) */
  completedAt: string | null
}

/**
 * Response from GET /v1/orders/:orderId/history
 */
export interface LocalHistoryResponse {
  orderId: string
  orderUid: string
  currentStatus: CurrentOrderStatus
  history: LocalHistoryEntry[]
  summary: LocalHistorySummary
}

/**
 * WB history summary
 */
export interface WbHistorySummary {
  /** Total number of status transitions */
  totalTransitions: number
  /** Total duration from first to last (minutes) */
  totalDurationMinutes: number | null
  /** Current WB status code */
  currentWbStatus: string
  /** First status timestamp */
  createdAt: string
  /** Last status change timestamp */
  lastUpdatedAt: string
}

/**
 * Response from GET /v1/orders/:orderId/wb-history
 */
export interface WbHistoryResponse {
  orderId: string
  orderUid: string
  wbHistory: WbHistoryEntry[]
  summary: WbHistorySummary
}

/**
 * Full history entry - discriminated union of local and WB native
 */
export type FullHistoryEntry =
  | {
      source: 'local'
      oldSupplierStatus: SupplierStatus | null
      newSupplierStatus: SupplierStatus
      oldWbStatus: WbStatus | null
      newWbStatus: WbStatus
      timestamp: string
    }
  | {
      source: 'wb_native'
      wbStatusCode: string
      timestamp: string
    }

/**
 * Full history summary
 */
export interface FullHistorySummary {
  localEntriesCount: number
  wbNativeEntriesCount: number
  totalEntriesCount: number
}

/**
 * Response from GET /v1/orders/:orderId/full-history
 */
export interface FullHistoryResponse {
  orderId: string
  orderUid: string
  fullHistory: FullHistoryEntry[]
  summary: FullHistorySummary
}
```

#### Analytics Types (src/types/orders-analytics.ts)

```typescript
/**
 * Velocity breakdown by dimension
 */
export interface VelocityBreakdown {
  avgConfirmation: number
  avgCompletion: number
}

/**
 * Response from GET /v1/analytics/orders/velocity
 */
export interface VelocityMetricsResponse {
  /** Average confirmation time (minutes) */
  avgConfirmationTimeMinutes: number
  /** Average completion time (minutes) */
  avgCompletionTimeMinutes: number
  /** 50th percentile confirmation (minutes) */
  p50ConfirmationMinutes: number
  /** 95th percentile confirmation (minutes) */
  p95ConfirmationMinutes: number
  /** 99th percentile confirmation (minutes) */
  p99ConfirmationMinutes: number
  /** 50th percentile completion (minutes) */
  p50CompletionMinutes: number
  /** 95th percentile completion (minutes) */
  p95CompletionMinutes: number
  /** 99th percentile completion (minutes) */
  p99CompletionMinutes: number
  /** Breakdown by warehouse ID */
  byWarehouse: Record<string, VelocityBreakdown>
  /** Breakdown by delivery type */
  byDeliveryType: Record<string, VelocityBreakdown>
  /** Total orders in period */
  totalOrders: number
  /** Query period info */
  period: {
    from: string
    to: string
  }
}

/**
 * At-risk order info
 */
export interface AtRiskOrder {
  orderId: string
  createdAt: string
  currentStatus: string
  /** Minutes remaining before SLA breach */
  minutesRemaining: number
  /** Type of risk: confirmation or completion */
  riskType: 'confirmation' | 'completion'
  /** True if SLA already breached */
  isBreached: boolean
}

/**
 * Response from GET /v1/analytics/orders/sla
 */
export interface SlaMetricsResponse {
  /** Confirmation SLA threshold (hours) */
  confirmationSlaHours: number
  /** Completion SLA threshold (hours) */
  completionSlaHours: number
  /** Confirmation compliance percentage */
  confirmationCompliancePercent: number
  /** Completion compliance percentage */
  completionCompliancePercent: number
  /** Number of pending orders */
  pendingOrdersCount: number
  /** Total at-risk orders (before pagination) */
  atRiskTotal: number
  /** At-risk orders list (paginated) */
  atRiskOrders: AtRiskOrder[]
  /** Number of breached orders */
  breachedCount: number
}

/**
 * Hourly trend point
 */
export interface HourlyTrend {
  hour: number
  count: number
}

/**
 * Daily trend point
 */
export interface DailyTrend {
  date: string
  count: number
}

/**
 * Status breakdown item
 */
export interface StatusBreakdown {
  status: string
  count: number
  percentage: number
}

/**
 * Response from GET /v1/analytics/orders/volume
 */
export interface VolumeMetricsResponse {
  /** Hourly order distribution */
  hourlyTrend: HourlyTrend[]
  /** Daily order volumes */
  dailyTrend: DailyTrend[]
  /** Top 3 peak hours */
  peakHours: number[]
  /** Cancellation rate percentage */
  cancellationRate: number
  /** B2B orders percentage */
  b2bPercentage: number
  /** Total orders in period */
  totalOrders: number
  /** Status breakdown */
  statusBreakdown: StatusBreakdown[]
  /** Query period info */
  period: {
    from: string
    to: string
  }
}

/**
 * Parameters for GET /v1/analytics/orders/velocity
 */
export interface VelocityMetricsParams {
  from: string
  to: string
}

/**
 * Parameters for GET /v1/analytics/orders/sla
 */
export interface SlaMetricsParams {
  /** SLA threshold for confirmation (hours, default 2) */
  confirmationSlaHours?: number
  /** SLA threshold for completion (hours, default 24) */
  completionSlaHours?: number
  /** Max at-risk orders to return (default 20, max 100) */
  atRiskLimit?: number
  /** Offset for at-risk pagination */
  atRiskOffset?: number
}

/**
 * Parameters for GET /v1/analytics/orders/volume
 */
export interface VolumeMetricsParams {
  from: string
  to: string
}
```

### API Client Implementation Pattern

```typescript
// src/lib/api/orders.ts
import { apiClient } from '../api-client'
import type {
  OrdersListParams,
  OrdersListResponse,
  OrderFbsDetails,
  TriggerSyncResponse,
  SyncStatusResponse,
} from '@/types/orders'
import type {
  LocalHistoryResponse,
  WbHistoryResponse,
  FullHistoryResponse,
} from '@/types/orders-history'

/**
 * Build query string from params object
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  }
  return searchParams.toString()
}

/**
 * Get orders list with filters
 * GET /v1/orders
 */
export async function getOrders(
  params: OrdersListParams = {},
): Promise<OrdersListResponse> {
  const queryString = buildQueryString(params)
  const url = queryString ? `/v1/orders?${queryString}` : '/v1/orders'

  console.info('[Orders API] Fetching orders:', params)

  const response = await apiClient.get<OrdersListResponse>(url, {
    skipDataUnwrap: true,
  })

  console.info('[Orders API] Orders response:', {
    count: response.items?.length ?? 0,
    total: response.pagination?.total ?? 0,
  })

  return response
}

/**
 * Get single order by ID
 * GET /v1/orders/:orderId
 */
export async function getOrderById(
  orderId: string,
): Promise<OrderFbsDetails> {
  console.info('[Orders API] Fetching order:', orderId)

  return apiClient.get<OrderFbsDetails>(`/v1/orders/${orderId}`)
}

/**
 * Get local status history for order
 * GET /v1/orders/:orderId/history
 */
export async function getOrderHistory(
  orderId: string,
): Promise<LocalHistoryResponse> {
  console.info('[Orders API] Fetching local history:', orderId)

  return apiClient.get<LocalHistoryResponse>(
    `/v1/orders/${orderId}/history`,
    { skipDataUnwrap: true },
  )
}

/**
 * Get WB native status history for order
 * GET /v1/orders/:orderId/wb-history
 */
export async function getWbHistory(
  orderId: string,
): Promise<WbHistoryResponse> {
  console.info('[Orders API] Fetching WB history:', orderId)

  return apiClient.get<WbHistoryResponse>(
    `/v1/orders/${orderId}/wb-history`,
    { skipDataUnwrap: true },
  )
}

/**
 * Get merged full history (local + WB native)
 * GET /v1/orders/:orderId/full-history
 */
export async function getFullHistory(
  orderId: string,
): Promise<FullHistoryResponse> {
  console.info('[Orders API] Fetching full history:', orderId)

  return apiClient.get<FullHistoryResponse>(
    `/v1/orders/${orderId}/full-history`,
    { skipDataUnwrap: true },
  )
}

/**
 * Trigger manual orders sync
 * POST /v1/orders/sync
 */
export async function triggerOrdersSync(): Promise<TriggerSyncResponse> {
  console.info('[Orders API] Triggering sync')

  return apiClient.post<TriggerSyncResponse>('/v1/orders/sync', {})
}

/**
 * Get orders sync status
 * GET /v1/orders/sync-status
 */
export async function getOrdersSyncStatus(): Promise<SyncStatusResponse> {
  return apiClient.get<SyncStatusResponse>('/v1/orders/sync-status')
}
```

---

## Tasks / Subtasks

### Phase 1: Order Types Definition (1 SP)

- [ ] Create `src/types/orders.ts`
- [ ] Define `SupplierStatus` and `WbStatus` type unions
- [ ] Define `OrderFbsItem` interface
- [ ] Define `OrderFbsDetails` interface (extends Item)
- [ ] Define `OrderAddress` interface
- [ ] Define `StatusHistoryBrief` interface
- [ ] Define pagination and query types
- [ ] Define `OrdersListResponse` interface
- [ ] Define `TriggerSyncResponse` interface
- [ ] Define `SyncStatusResponse` interface
- [ ] Define `OrdersListParams` interface

### Phase 2: History Types Definition (0.5 SP)

- [ ] Create `src/types/orders-history.ts`
- [ ] Define `LocalHistoryEntry` interface
- [ ] Define `WbHistoryEntry` interface
- [ ] Define `FullHistoryEntry` discriminated union
- [ ] Define `LocalHistoryResponse` interface
- [ ] Define `WbHistoryResponse` interface
- [ ] Define `FullHistoryResponse` interface
- [ ] Define summary interfaces for each history type

### Phase 3: Analytics Types Definition (0.5 SP)

- [ ] Create `src/types/orders-analytics.ts`
- [ ] Define `VelocityMetricsResponse` interface
- [ ] Define `SlaMetricsResponse` interface
- [ ] Define `VolumeMetricsResponse` interface
- [ ] Define `AtRiskOrder` interface
- [ ] Define params interfaces for each endpoint

### Phase 4: Orders API Client (0.5 SP)

- [ ] Create `src/lib/api/orders.ts`
- [ ] Implement `getOrders()` function
- [ ] Implement `getOrderById()` function
- [ ] Implement `getOrderHistory()` function
- [ ] Implement `getWbHistory()` function
- [ ] Implement `getFullHistory()` function
- [ ] Implement `triggerOrdersSync()` function
- [ ] Implement `getOrdersSyncStatus()` function

### Phase 5: Analytics API Client (0.5 SP)

- [ ] Create `src/lib/api/orders-analytics.ts`
- [ ] Implement `getVelocityMetrics()` function
- [ ] Implement `getSlaMetrics()` function
- [ ] Implement `getVolumeMetrics()` function

### Phase 6: Validation

- [ ] Run `npm run type-check` - no errors
- [ ] Run `npm run lint` - no errors
- [ ] Verify all files under 200 lines

---

## Dev Notes

### Existing WB Status Mapping

The file `src/lib/wb-status-mapping.ts` already contains:
- `WbStatusConfig` interface with label, color, category
- `WB_STATUS_CONFIG` with 40+ status codes
- Helper functions: `getWbStatusConfig()`, `getWbStatusLabel()`, `isWbStatusFinal()`

Reuse these utilities in history components (Story 40.5-FE).

### Backend API Reference

- **HTTP Test File**: `test-api/14-orders.http`
- **Backend Story**: `docs/stories/epic-40/story-40.9-wb-native-status-history.md`

### Similar Implementations

- **Types pattern**: `src/types/storage-analytics.ts`
- **API client pattern**: `src/lib/api/storage-analytics.ts`
- **Hook pattern**: `src/hooks/useStorageAnalytics.ts`

---

## Definition of Done

- [ ] Types created and exported from:
  - `src/types/orders.ts`
  - `src/types/orders-history.ts`
  - `src/types/orders-analytics.ts`
- [ ] API client functions implemented in:
  - `src/lib/api/orders.ts`
  - `src/lib/api/orders-analytics.ts`
- [ ] No TypeScript errors (`npm run type-check` passes)
- [ ] ESLint passes (`npm run lint`)
- [ ] All files under 200 lines
- [ ] Console logging added for observability
- [ ] Types match backend API response structure (14-orders.http)

---

## Dependencies

### Required (Blocking)

| Dependency | Status | Notes |
|------------|--------|-------|
| Backend Story 40.9 | ✅ Complete | WB Native Status History API |
| `src/lib/api-client.ts` | ✅ Exists | Centralized API client |
| `src/lib/wb-status-mapping.ts` | ✅ Exists | WB status code utilities |

### Non-Blocking

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 40.2-FE | Pending | React Query hooks (uses these types) |
| Story 40.3-FE | Pending | Orders List Page (uses these types) |

---

## Related

- **Backend API**: `test-api/14-orders.http` - HTTP request examples
- **Backend Story**: `docs/stories/epic-40/story-40.9-wb-native-status-history.md`
- **Similar impl**: `src/types/storage-analytics.ts`, `src/lib/api/storage-analytics.ts`
- **Epic spec**: `docs/epics/epic-40-fe-orders-wb-history.md`

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-29 | Claude Code (PM Agent) | Initial draft |

---

## Dev Agent Record

_Section for Dev Agent to track implementation progress and decisions_

```
Status: Ready for Dev
Agent:
Started:
Completed:
Notes:
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

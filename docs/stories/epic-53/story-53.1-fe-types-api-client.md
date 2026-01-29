# Story 53.1-FE: TypeScript Types & API Client for Supplies

## Story Info

- **Epic**: 53-FE - Supply Management UI
- **Sprint**: 3 (Mar 3-14)
- **Priority**: P0 (Foundation)
- **Points**: 2 SP
- **Status**: Ready for Dev
- **Backend Dependency**: Epic 53 (Complete)

---

## User Story

**As a** frontend developer,
**I want** TypeScript types and API client functions for the Supplies module,
**So that** I can safely integrate with the backend Supplies API endpoints.

**Non-goals**:
- React Query hooks (separate story)
- UI components (stories 53.2-53.8)

---

## Acceptance Criteria

### AC1: Supply Types (src/types/supplies.ts)

- [ ] Create `SupplyStatus` enum: `'OPEN' | 'CLOSED' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED'`
- [ ] Create `StickerFormat` enum: `'png' | 'svg' | 'zpl'`
- [ ] Create `DocumentType` type: `'sticker' | 'barcode' | 'acceptance_act'`
- [ ] Create `Supply` interface matching backend response
- [ ] Create `SupplyListItem` interface for list view (condensed)
- [ ] Create `SupplyOrder` interface for orders within supply
- [ ] Create `SupplyDocument` interface for generated documents
- [ ] Create `SuppliesPagination` interface (offset-based)
- [ ] Create `SuppliesListResponse` interface with items, pagination, filters
- [ ] Create `SupplyDetailResponse` interface with orders, documents
- [ ] Proper nullability handling where applicable

### AC2: Request/Response Types

- [ ] Create `CreateSupplyRequest` interface (name optional)
- [ ] Create `CreateSupplyResponse` interface with supply_id, wb_supply_id
- [ ] Create `AddOrdersRequest` interface (array of order_ids, max 1000)
- [ ] Create `AddOrdersResponse` interface with added count, partial failures
- [ ] Create `RemoveOrdersRequest` interface (array of order_ids)
- [ ] Create `RemoveOrdersResponse` interface with removed count
- [ ] Create `CloseSupplyResponse` interface with status, closed_at
- [ ] Create `GenerateStickersRequest` interface (format: StickerFormat)
- [ ] Create `GenerateStickersResponse` interface with sticker data/URL
- [ ] Create `SyncSuppliesResponse` interface with synced count, errors

### AC3: Query Parameter Types

- [ ] Create `SuppliesListParams` interface with filters (status, from, to, sort)
- [ ] Create `SuppliesSortField` type: `'created_at' | 'closed_at' | 'orders_count'`
- [ ] Create `SortOrder` type: `'asc' | 'desc'`

### AC4: Status Configuration Types

- [ ] Create `SupplyStatusConfig` interface with label, color, bgColor, icon
- [ ] Create `SUPPLY_STATUS_CONFIG` constant object
- [ ] Create `getSupplyStatusConfig()` helper function
- [ ] Create `getSupplyStatusLabel()` helper function
- [ ] Create `isSupplyFinal()` helper function (DELIVERED, CANCELLED)
- [ ] Create `canModifySupply()` helper function (OPEN only)

### AC5: API Client Functions (src/lib/api/supplies.ts)

- [ ] `getSupplies(params)` - GET /v1/supplies
- [ ] `getSupply(supplyId)` - GET /v1/supplies/:id
- [ ] `createSupply(data)` - POST /v1/supplies
- [ ] `addOrders(supplyId, orderIds)` - POST /v1/supplies/:id/orders
- [ ] `removeOrders(supplyId, orderIds)` - DELETE /v1/supplies/:id/orders
- [ ] `closeSupply(supplyId)` - POST /v1/supplies/:id/close
- [ ] `generateStickers(supplyId, format)` - POST /v1/supplies/:id/stickers
- [ ] `downloadDocument(supplyId, docType)` - GET /v1/supplies/:id/documents/:type
- [ ] `syncSupplies()` - POST /v1/supplies/sync

### AC6: Query Keys Factory

- [ ] Create `suppliesQueryKeys` object following project pattern
- [ ] Keys: `all`, `list(params)`, `detail(id)`, `documents(id)`

### AC7: Error Handling

- [ ] All functions use centralized `apiClient` with automatic auth headers
- [ ] Console logging for observability (development mode)
- [ ] Create `SuppliesErrorResponse` interface with code, message, details
- [ ] Handle 409 Conflict for concurrent modifications
- [ ] Handle 429 Rate Limit for sync operations

---

## Technical Details

### Files to Create

| File | Lines (Est.) | Description |
|------|--------------|-------------|
| `src/types/supplies.ts` | ~180 | Supply types, status config |
| `src/lib/api/supplies.ts` | ~150 | Supplies API client |

### TypeScript Interfaces

#### Supply Types (src/types/supplies.ts)

```typescript
// ============================================================================
// Enums & Constants
// ============================================================================

/**
 * Supply lifecycle status
 * State machine: OPEN → CLOSED → DELIVERING → DELIVERED
 */
export type SupplyStatus =
  | 'OPEN'       // Can add/remove orders
  | 'CLOSED'     // Ready for shipment, can generate stickers
  | 'DELIVERING' // In transit to WB warehouse
  | 'DELIVERED'  // Received by WB (final)
  | 'CANCELLED'  // Cancelled (final)

/**
 * Sticker output format
 */
export type StickerFormat = 'png' | 'svg' | 'zpl'

/**
 * Document types available for download
 */
export type DocumentType = 'sticker' | 'barcode' | 'acceptance_act'

/**
 * Sort fields for supplies list
 */
export type SuppliesSortField = 'created_at' | 'closed_at' | 'orders_count'

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc'

// ============================================================================
// Core Types
// ============================================================================

/**
 * Order within a supply
 */
export interface SupplyOrder {
  /** Order ID (string for BigInt compatibility) */
  orderId: string
  /** Order grouping UID */
  orderUid: string
  /** WB Article (SKU) */
  nmId: number
  /** Vendor code */
  vendorCode: string
  /** Product name */
  productName: string | null
  /** Sale price (RUB) */
  salePrice: number
  /** Supplier status */
  supplierStatus: string
  /** Added to supply timestamp */
  addedAt: string
}

/**
 * Generated document info
 */
export interface SupplyDocument {
  /** Document type */
  type: DocumentType
  /** File format (extension) */
  format: string
  /** Generation timestamp */
  generatedAt: string
  /** Download URL (relative) */
  downloadUrl: string
  /** File size in bytes */
  sizeBytes: number | null
}

/**
 * Supply item in list view (condensed)
 */
export interface SupplyListItem {
  /** Internal supply ID */
  id: string
  /** WB supply ID (from WB API) */
  wbSupplyId: string
  /** Supply name (user-defined) */
  name: string | null
  /** Current status */
  status: SupplyStatus
  /** Number of orders in supply */
  ordersCount: number
  /** Total value of orders (RUB) */
  totalValue: number
  /** Creation timestamp */
  createdAt: string
  /** Close timestamp (null if OPEN) */
  closedAt: string | null
  /** Last sync timestamp */
  syncedAt: string | null
}

/**
 * Full supply details
 */
export interface Supply extends SupplyListItem {
  /** WB warehouse ID */
  warehouseId: number | null
  /** WB warehouse name */
  warehouseName: string | null
  /** Orders in this supply */
  orders: SupplyOrder[]
  /** Generated documents */
  documents: SupplyDocument[]
}

// ============================================================================
// Pagination & Query Types
// ============================================================================

/**
 * Offset-based pagination for supplies
 */
export interface SuppliesPagination {
  /** Total number of items */
  total: number
  /** Items per page */
  limit: number
  /** Current offset */
  offset: number
}

/**
 * Query parameters for GET /v1/supplies
 */
export interface SuppliesListParams {
  /** Filter by status */
  status?: SupplyStatus
  /** Start date (ISO string) */
  from?: string
  /** End date (ISO string) */
  to?: string
  /** Sort field */
  sort_by?: SuppliesSortField
  /** Sort direction */
  sort_order?: SortOrder
  /** Items per page (default 20, max 100) */
  limit?: number
  /** Pagination offset */
  offset?: number
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Response from GET /v1/supplies
 */
export interface SuppliesListResponse {
  items: SupplyListItem[]
  pagination: SuppliesPagination
  /** Applied filters echoed back */
  filters: {
    status: SupplyStatus | null
    from: string | null
    to: string | null
  }
}

/**
 * Response from GET /v1/supplies/:id
 */
export interface SupplyDetailResponse extends Supply {
  /** Rate limit info for sync */
  syncRateLimit?: {
    remaining: number
    resetAt: string
  }
}

// ============================================================================
// Request/Response Types for Mutations
// ============================================================================

/**
 * Request for POST /v1/supplies
 */
export interface CreateSupplyRequest {
  /** Optional supply name */
  name?: string
}

/**
 * Response from POST /v1/supplies
 */
export interface CreateSupplyResponse {
  /** Internal supply ID */
  id: string
  /** WB supply ID */
  wbSupplyId: string
  /** Supply name */
  name: string | null
  /** Initial status (always OPEN) */
  status: SupplyStatus
  /** Creation timestamp */
  createdAt: string
}

/**
 * Request for POST /v1/supplies/:id/orders
 */
export interface AddOrdersRequest {
  /** Array of order IDs to add (max 1000) */
  orderIds: string[]
}

/**
 * Response from POST /v1/supplies/:id/orders
 */
export interface AddOrdersResponse {
  /** Number of orders successfully added */
  addedCount: number
  /** Orders that failed to add (e.g., already in another supply) */
  failures: Array<{
    orderId: string
    reason: string
  }>
  /** Updated orders count in supply */
  totalOrdersCount: number
}

/**
 * Request for DELETE /v1/supplies/:id/orders
 */
export interface RemoveOrdersRequest {
  /** Array of order IDs to remove */
  orderIds: string[]
}

/**
 * Response from DELETE /v1/supplies/:id/orders
 */
export interface RemoveOrdersResponse {
  /** Number of orders successfully removed */
  removedCount: number
  /** Updated orders count in supply */
  totalOrdersCount: number
}

/**
 * Response from POST /v1/supplies/:id/close
 */
export interface CloseSupplyResponse {
  /** Updated status (CLOSED) */
  status: SupplyStatus
  /** Close timestamp */
  closedAt: string
  /** Message */
  message: string
}

/**
 * Request for POST /v1/supplies/:id/stickers
 */
export interface GenerateStickersRequest {
  /** Output format */
  format: StickerFormat
}

/**
 * Response from POST /v1/supplies/:id/stickers
 */
export interface GenerateStickersResponse {
  /** Document info */
  document: SupplyDocument
  /** Base64 encoded data (for PNG/SVG preview) */
  data?: string
  /** Message */
  message: string
}

/**
 * Response from POST /v1/supplies/sync
 */
export interface SyncSuppliesResponse {
  /** Number of supplies synced */
  syncedCount: number
  /** Supplies with status changes */
  statusChanges: Array<{
    supplyId: string
    oldStatus: SupplyStatus
    newStatus: SupplyStatus
  }>
  /** Sync errors */
  errors: Array<{
    supplyId: string
    error: string
  }>
  /** Next allowed sync time */
  nextSyncAt: string
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Supplies API error response
 */
export interface SuppliesErrorResponse {
  /** Error code */
  code: string
  /** Human-readable message */
  message: string
  /** Additional details */
  details?: Record<string, unknown>
}

// ============================================================================
// Status Configuration
// ============================================================================

/**
 * Status display configuration
 */
export interface SupplyStatusConfig {
  /** Russian label */
  label: string
  /** Text color class */
  color: string
  /** Background color class */
  bgColor: string
  /** Lucide icon name */
  icon: string
}

/**
 * Status configuration map
 */
export const SUPPLY_STATUS_CONFIG: Record<SupplyStatus, SupplyStatusConfig> = {
  OPEN: {
    label: 'Открыта',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: 'PackageOpen',
  },
  CLOSED: {
    label: 'Закрыта',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    icon: 'PackageCheck',
  },
  DELIVERING: {
    label: 'В пути',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    icon: 'Truck',
  },
  DELIVERED: {
    label: 'Доставлена',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    icon: 'CheckCircle',
  },
  CANCELLED: {
    label: 'Отменена',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    icon: 'XCircle',
  },
}

/**
 * Get status configuration by status
 */
export function getSupplyStatusConfig(status: SupplyStatus): SupplyStatusConfig {
  return SUPPLY_STATUS_CONFIG[status] ?? SUPPLY_STATUS_CONFIG.OPEN
}

/**
 * Get status label in Russian
 */
export function getSupplyStatusLabel(status: SupplyStatus): string {
  return getSupplyStatusConfig(status).label
}

/**
 * Check if supply is in final state
 */
export function isSupplyFinal(status: SupplyStatus): boolean {
  return status === 'DELIVERED' || status === 'CANCELLED'
}

/**
 * Check if supply can be modified (add/remove orders)
 */
export function canModifySupply(status: SupplyStatus): boolean {
  return status === 'OPEN'
}

/**
 * Check if supply can generate stickers
 */
export function canGenerateStickers(status: SupplyStatus): boolean {
  return status === 'CLOSED'
}
```

### API Client Implementation (src/lib/api/supplies.ts)

```typescript
/**
 * Supplies API Client
 * Story 53.1-FE: TypeScript Types & API Client
 * Epic 53: Supply Management UI
 */

import { apiClient } from '../api-client'
import type {
  SuppliesListParams,
  SuppliesListResponse,
  SupplyDetailResponse,
  CreateSupplyRequest,
  CreateSupplyResponse,
  AddOrdersRequest,
  AddOrdersResponse,
  RemoveOrdersRequest,
  RemoveOrdersResponse,
  CloseSupplyResponse,
  GenerateStickersRequest,
  GenerateStickersResponse,
  SyncSuppliesResponse,
  StickerFormat,
  DocumentType,
} from '@/types/supplies'

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Query keys for supplies (React Query caching)
 */
export const suppliesQueryKeys = {
  all: ['supplies'] as const,
  list: (params: SuppliesListParams) =>
    [...suppliesQueryKeys.all, 'list', params] as const,
  detail: (id: string) =>
    [...suppliesQueryKeys.all, 'detail', id] as const,
  documents: (id: string) =>
    [...suppliesQueryKeys.all, 'documents', id] as const,
}

// ============================================================================
// Helper Functions
// ============================================================================

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

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get supplies list with filters
 * GET /v1/supplies
 */
export async function getSupplies(
  params: SuppliesListParams = {},
): Promise<SuppliesListResponse> {
  const queryString = buildQueryString(params)
  const url = queryString ? `/v1/supplies?${queryString}` : '/v1/supplies'

  console.info('[Supplies API] Fetching supplies:', params)

  const response = await apiClient.get<SuppliesListResponse>(url, {
    skipDataUnwrap: true,
  })

  console.info('[Supplies API] Supplies response:', {
    count: response.items?.length ?? 0,
    total: response.pagination?.total ?? 0,
  })

  return response
}

/**
 * Get single supply by ID
 * GET /v1/supplies/:id
 */
export async function getSupply(supplyId: string): Promise<SupplyDetailResponse> {
  console.info('[Supplies API] Fetching supply:', supplyId)

  return apiClient.get<SupplyDetailResponse>(`/v1/supplies/${supplyId}`, {
    skipDataUnwrap: true,
  })
}

/**
 * Create new supply
 * POST /v1/supplies
 */
export async function createSupply(
  data: CreateSupplyRequest = {},
): Promise<CreateSupplyResponse> {
  console.info('[Supplies API] Creating supply:', data)

  const response = await apiClient.post<CreateSupplyResponse>(
    '/v1/supplies',
    data,
  )

  console.info('[Supplies API] Supply created:', response.id)

  return response
}

/**
 * Add orders to supply (batch, max 1000)
 * POST /v1/supplies/:id/orders
 */
export async function addOrders(
  supplyId: string,
  orderIds: string[],
): Promise<AddOrdersResponse> {
  console.info('[Supplies API] Adding orders:', {
    supplyId,
    orderCount: orderIds.length,
  })

  const response = await apiClient.post<AddOrdersResponse>(
    `/v1/supplies/${supplyId}/orders`,
    { orderIds } as AddOrdersRequest,
  )

  console.info('[Supplies API] Orders added:', {
    addedCount: response.addedCount,
    failures: response.failures?.length ?? 0,
  })

  return response
}

/**
 * Remove orders from supply
 * DELETE /v1/supplies/:id/orders
 */
export async function removeOrders(
  supplyId: string,
  orderIds: string[],
): Promise<RemoveOrdersResponse> {
  console.info('[Supplies API] Removing orders:', {
    supplyId,
    orderCount: orderIds.length,
  })

  // DELETE with body requires special handling
  const response = await apiClient.delete<RemoveOrdersResponse>(
    `/v1/supplies/${supplyId}/orders`,
    { orderIds } as RemoveOrdersRequest,
  )

  console.info('[Supplies API] Orders removed:', response.removedCount)

  return response
}

/**
 * Close supply (transition OPEN → CLOSED)
 * POST /v1/supplies/:id/close
 */
export async function closeSupply(supplyId: string): Promise<CloseSupplyResponse> {
  console.info('[Supplies API] Closing supply:', supplyId)

  const response = await apiClient.post<CloseSupplyResponse>(
    `/v1/supplies/${supplyId}/close`,
    {},
  )

  console.info('[Supplies API] Supply closed:', response.closedAt)

  return response
}

/**
 * Generate stickers for supply
 * POST /v1/supplies/:id/stickers
 */
export async function generateStickers(
  supplyId: string,
  format: StickerFormat = 'png',
): Promise<GenerateStickersResponse> {
  console.info('[Supplies API] Generating stickers:', { supplyId, format })

  const response = await apiClient.post<GenerateStickersResponse>(
    `/v1/supplies/${supplyId}/stickers`,
    { format } as GenerateStickersRequest,
  )

  console.info('[Supplies API] Stickers generated:', response.document?.type)

  return response
}

/**
 * Download document (returns blob)
 * GET /v1/supplies/:id/documents/:type
 */
export async function downloadDocument(
  supplyId: string,
  docType: DocumentType,
): Promise<Blob> {
  console.info('[Supplies API] Downloading document:', { supplyId, docType })

  const response = await apiClient.get<Blob>(
    `/v1/supplies/${supplyId}/documents/${docType}`,
    {
      responseType: 'blob',
      skipDataUnwrap: true,
    },
  )

  console.info('[Supplies API] Document downloaded')

  return response
}

/**
 * Trigger manual sync with WB
 * POST /v1/supplies/sync
 * Rate limited: 1 request per 5 minutes
 */
export async function syncSupplies(): Promise<SyncSuppliesResponse> {
  console.info('[Supplies API] Syncing supplies with WB')

  const response = await apiClient.post<SyncSuppliesResponse>(
    '/v1/supplies/sync',
    {},
  )

  console.info('[Supplies API] Sync completed:', {
    syncedCount: response.syncedCount,
    statusChanges: response.statusChanges?.length ?? 0,
  })

  return response
}
```

---

## Tasks / Subtasks

### Phase 1: Types Definition (1 SP)

- [ ] Create `src/types/supplies.ts`
- [ ] Define `SupplyStatus` and `StickerFormat` types
- [ ] Define `SupplyOrder` interface
- [ ] Define `SupplyDocument` interface
- [ ] Define `SupplyListItem` interface
- [ ] Define `Supply` interface (extends SupplyListItem)
- [ ] Define pagination types
- [ ] Define request/response interfaces
- [ ] Define status configuration with helpers
- [ ] Define error types

### Phase 2: API Client (0.5 SP)

- [ ] Create `src/lib/api/supplies.ts`
- [ ] Implement `suppliesQueryKeys` factory
- [ ] Implement `getSupplies()` function
- [ ] Implement `getSupply()` function
- [ ] Implement `createSupply()` function
- [ ] Implement `addOrders()` function
- [ ] Implement `removeOrders()` function
- [ ] Implement `closeSupply()` function
- [ ] Implement `generateStickers()` function
- [ ] Implement `downloadDocument()` function
- [ ] Implement `syncSupplies()` function

### Phase 3: Validation (0.5 SP)

- [ ] Run `npm run type-check` - no errors
- [ ] Run `npm run lint` - no errors
- [ ] Verify all files under 200 lines
- [ ] Verify types match backend API (test-api/*.http)

---

## Dev Notes

### Backend API Reference

- **HTTP Test File**: `test-api/16-supplies.http` (if exists) or backend docs
- **Backend Epic**: `docs/request-backend/111-epic-53-supply-management-api.md`

### Similar Implementations

- **Types pattern**: `src/types/storage-analytics.ts`, `src/types/orders.ts`
- **API client pattern**: `src/lib/api/storage-analytics.ts`, `src/lib/api/orders.ts`
- **Status config pattern**: `src/lib/wb-status-mapping.ts`

### Key Differences from Orders

- Supplies use POST for DELETE with body (remove orders)
- Supplies have document download (blob responses)
- Supplies have rate-limited sync endpoint
- Status configuration uses Lucide icons

### Download Document Pattern

```typescript
// Usage in component
const handleDownload = async (docType: DocumentType) => {
  const blob = await downloadDocument(supplyId, docType)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `supply-${supplyId}-${docType}.${getExtension(docType)}`
  link.click()
  URL.revokeObjectURL(url)
}
```

---

## Definition of Done

- [ ] Types created and exported from `src/types/supplies.ts`
- [ ] API client functions implemented in `src/lib/api/supplies.ts`
- [ ] Query keys factory exported for React Query
- [ ] Status configuration with helper functions
- [ ] No TypeScript errors (`npm run type-check` passes)
- [ ] ESLint passes (`npm run lint`)
- [ ] All files under 200 lines
- [ ] Console logging added for observability
- [ ] Types match backend API response structure

---

## Dependencies

### Required (Blocking)

| Dependency | Status | Notes |
|------------|--------|-------|
| Backend Epic 53 | ✅ Complete | Supply Management API |
| `src/lib/api-client.ts` | ✅ Exists | Centralized API client |

### Non-Blocking

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 53.2-FE | Pending | Supplies List Page (uses these types) |
| Story 53.4-FE | Pending | Supply Detail Page (uses these types) |

---

## Related

- **Backend Epic**: `docs/request-backend/111-epic-53-supply-management-api.md`
- **Similar impl**: `src/types/orders.ts`, `src/lib/api/orders.ts`
- **Epic spec**: `docs/epics/epic-53-fe-supply-management.md`
- **Status mapping**: `src/lib/wb-status-mapping.ts`

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

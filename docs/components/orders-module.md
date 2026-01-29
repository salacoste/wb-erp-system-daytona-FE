# Orders Module Documentation

## Overview

The Orders module provides UI for viewing and managing FBS (Fulfillment by Seller) orders with WB native status history integration.

**Epic**: 40-FE - Orders UI & WB Native Status History
**Stories**: 40.1-FE through 40.7-FE

## Component Hierarchy

```
/orders (page)
├── OrdersErrorBoundary (error handling wrapper)
├── OrdersPageHeader (title + sync status)
├── OrdersFilters (date range, status, search)
├── OrdersTable
│   └── OrdersTableRow (clickable rows)
├── OrdersPagination
└── OrderDetailsModal (lazy loaded)
    ├── OrderModalHeader (order info)
    └── OrderHistoryTabs
        ├── FullHistoryTab (merged timeline)
        ├── WbHistoryTab (WB native statuses)
        └── LocalHistoryTab (supplier statuses)
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Orders Page                             │
├─────────────────────────────────────────────────────────────┤
│  URL Params (filters, sort, page)                           │
│       ↓                                                      │
│  useOrders(params) → React Query → GET /v1/orders           │
│       ↓                                                      │
│  OrdersTable (renders rows)                                  │
│       │                                                      │
│       │ onClick(order)                                       │
│       ↓                                                      │
│  selectedOrderId state                                       │
│       ↓                                                      │
│  OrderDetailsModal (lazy loaded)                             │
│       ↓                                                      │
│  useOrderDetails(orderId) → GET /v1/orders/:id              │
│       ↓                                                      │
│  OrderHistoryTabs (on-demand tab fetching)                   │
│       ├── useFullHistory → GET /v1/orders/:id/full-history  │
│       ├── useWbHistory → GET /v1/orders/:id/wb-history      │
│       └── useLocalHistory → GET /v1/orders/:id/history      │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/orders` | GET | List orders with filters |
| `/v1/orders/:id` | GET | Order details |
| `/v1/orders/:id/history` | GET | Local status history |
| `/v1/orders/:id/wb-history` | GET | WB native history (40+ statuses) |
| `/v1/orders/:id/full-history` | GET | Merged timeline |
| `/v1/analytics/orders/velocity` | GET | Processing metrics |
| `/v1/analytics/orders/sla` | GET | SLA compliance |
| `/v1/orders/sync` | POST | Manual sync trigger |

## State Management

### URL State (Filter Persistence)
- `from`, `to` - Date range
- `supplier_status` - Supplier status filter
- `wb_status` - WB status filter
- `nm_id` - Search by product ID
- `sort_by`, `sort_order` - Sorting
- `page` - Pagination

### Component State
- `selectedOrderId` - Modal control (open/close)
- `searchInput` - Debounced search input

### Server State (React Query)
- `ordersQueryKeys.list(params)` - Orders list
- `ordersQueryKeys.detail(id)` - Order details
- `ordersQueryKeys.fullHistory(id)` - Merged timeline
- `ordersQueryKeys.wbHistory(id)` - WB native history
- `ordersQueryKeys.localHistory(id)` - Local history

## Hooks Catalog

| Hook | Purpose | Location |
|------|---------|----------|
| `useOrders` | Fetch orders list | `src/hooks/useOrders.ts` |
| `useOrderDetails` | Fetch single order | `src/hooks/useOrders.ts` |
| `useFullHistory` | Fetch merged timeline | `src/hooks/useOrderHistory.ts` |
| `useWbHistory` | Fetch WB native history | `src/hooks/useOrderHistory.ts` |
| `useLocalHistory` | Fetch local history | `src/hooks/useOrderHistory.ts` |
| `useOrdersSyncStatus` | Get sync status | `src/hooks/useOrders.ts` |
| `useOrdersSync` | Trigger manual sync | `src/hooks/useOrders.ts` |

## Components

### OrdersErrorBoundary
Catches rendering errors and displays fallback UI with retry button.

```tsx
<OrdersErrorBoundary>
  <OrdersPageContent />
</OrdersErrorBoundary>
```

### OrdersPageHeader
Displays page title, last sync time, and manual sync button.

```tsx
<OrdersPageHeader
  lastSyncAt={syncStatus?.lastSyncAt ?? null}
  isSyncing={isSyncing}
  onSync={() => triggerSync()}
/>
```

### OrdersFilters
Date range picker, status dropdowns, and search input.

```tsx
<OrdersFilters
  dateFrom={dateFrom}
  dateTo={dateTo}
  supplierStatus={supplierStatus}
  wbStatus={wbStatus}
  searchValue={searchInput}
  onDateFromChange={setDateFrom}
  onDateToChange={setDateTo}
  onSupplierStatusChange={setSupplierStatus}
  onWbStatusChange={setWbStatus}
  onSearchChange={setSearchInput}
  onClearFilters={handleClearFilters}
  hasActiveFilters={hasActiveFilters}
/>
```

### OrderDetailsModal
Lazy-loaded modal with order details and history tabs.

```tsx
<Suspense fallback={<OrdersSuspenseFallback />}>
  <OrderDetailsModal orderId={selectedOrderId} onClose={handleCloseModal} />
</Suspense>
```

## Performance Optimizations

1. **Lazy Loading**: OrderDetailsModal is lazy-loaded to reduce initial bundle
2. **Error Boundaries**: Graceful error handling with retry capability
3. **Debounced Search**: 500ms debounce on search input
4. **URL State Sync**: Filter state persisted in URL for shareability
5. **On-Demand Tab Fetching**: History tabs fetch data only when selected

## Testing

### Unit Tests
- `src/components/custom/orders/__tests__/*.test.tsx`

### Integration Tests
- `src/app/(dashboard)/orders/__tests__/integration.test.tsx`
- `src/app/(dashboard)/orders/__tests__/lazy-loading.test.tsx`

### E2E Tests
- `e2e/orders.spec.ts`
- `e2e/orders-accessibility.spec.ts`

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- ARIA labels on interactive elements
- Focus trap in modal
- Screen reader announcements

## Related Documentation

- Story specs: `docs/stories/epic-40/`
- Epic spec: `docs/epics/epic-40-fe-orders-wb-history.md`
- API reference: `test-api/orders.http`

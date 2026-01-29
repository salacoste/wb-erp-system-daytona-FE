# Epic 40-FE: Orders UI & WB Native Status History

**Status**: ✅ Complete
**Priority**: P0 (Foundation)
**Backend Epic**: Epic 40, Story 40.9
**Story Points**: 26 SP
**Stories**: 7 (all complete)

---

## Overview

Implement Orders UI module with WB Native Status History integration. This epic establishes the foundational Orders infrastructure required by Epic 53-FE (Supply Management).

### Problem Statement

- No orders UI exists in frontend
- Local order history contains only ~10 statuses
- WB API provides 40+ detailed status codes
- Users need complete order visibility for FBS operations

### Solution

- New `/orders` route with orders list and filtering
- Order detail modal with tabbed history views
- Merged timeline (local + WB native) with source indicators
- SLA/velocity analytics dashboard widgets

---

## Dependencies

| Type | Dependency | Status |
|------|------------|--------|
| Backend | Epic 40 Stories 40.1-40.9 | ✅ Complete |
| Backend | `GET /v1/orders` endpoint | ⚠️ To verify |
| Backend | `GET /v1/orders/:id/wb-history` | ✅ Complete |
| Backend | `GET /v1/orders/:id/full-history` | ✅ Complete |
| Frontend | None | - |

---

## API Endpoints

### New Endpoints (Story 40.9)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/v1/orders` | List orders with filters |
| GET | `/v1/orders/:orderId` | Order details |
| GET | `/v1/orders/:orderId/history` | Local status history |
| GET | `/v1/orders/:orderId/wb-history` | WB native history (40+ statuses) |
| GET | `/v1/orders/:orderId/full-history` | Merged timeline |
| GET | `/v1/analytics/orders/velocity` | Processing metrics |
| GET | `/v1/analytics/orders/sla` | SLA compliance |
| POST | `/v1/orders/sync` | Manual sync trigger |

### Key Response Types

```typescript
interface WbStatusHistoryEntry {
  id: string
  wbStatusCode: string        // 40+ WB native codes
  wbStatusChangedAt: string   // ISO 8601
  durationMinutes: number | null
}

interface FullHistoryEntry {
  source: 'local' | 'wb_native'
  timestamp: string
  // ... status details
}
```

---

## New Routes

| Route | Page | Description |
|-------|------|-------------|
| `/orders` | `OrdersPage` | Orders hub with analytics + list |
| `/orders/list` | `OrdersListPage` | Full orders table (optional) |

---

## Components

### Pages (2)
- `app/(dashboard)/orders/page.tsx`
- `app/(dashboard)/orders/list/page.tsx` (optional)

### Containers (6)
- `OrdersListContainer` - Data fetching for orders list
- `OrderDetailsModal` - Modal with tabbed history
- `OrderHistoryTimeline` - Full merged history
- `WbHistoryTimeline` - WB-only view
- `LocalHistoryTimeline` - Local-only view
- `OrdersAnalyticsDashboard` - SLA/velocity widgets

### Presentational (12)
- `OrdersTable` - Data table with sorting
- `OrdersTableRow` - Single row
- `OrdersFilters` - Filter controls
- `OrdersPagination` - Offset pagination
- `OrderStatusBadge` - Color-coded status
- `HistorySourceBadge` - "WB" vs "Local"
- `HistoryEntryCard` - Timeline entry
- `DurationDisplay` - Human-readable duration
- `SlaComplianceWidget` - SLA % widget
- `VelocityMetricsWidget` - Avg times
- `AtRiskOrdersCard` - At-risk list
- `OrderSyncStatus` - Sync indicator

---

## Stories

### Story 40.1-FE: Types & API Client Foundation
**Estimate**: 3 SP

**Scope**:
- Create `src/types/orders.ts`
- Create `src/types/orders-history.ts`
- Create `src/lib/api/orders.ts`
- Error messages (Russian)

**Acceptance Criteria**:
- [ ] TypeScript interfaces match backend spec
- [ ] API client functions for 8+ endpoints
- [ ] Type guards for discriminated unions
- [ ] Localized error messages

---

### Story 40.2-FE: React Query Hooks
**Estimate**: 3 SP

**Scope**:
- Create `src/hooks/useOrders.ts`
- Create `src/hooks/useOrderHistory.ts`
- Create `src/hooks/useOrdersAnalytics.ts`
- Query keys factory

**Acceptance Criteria**:
- [ ] `useOrders()` - paginated list
- [ ] `useOrderDetails()` - single order
- [ ] `useLocalHistory()` / `useWbHistory()` / `useFullHistory()`
- [ ] `useSlaMetrics()` / `useVelocityMetrics()`
- [ ] Proper `enabled` prop handling

---

### Story 40.3-FE: Orders List Page
**Estimate**: 5 SP

**Scope**:
- Create `/orders` route
- `OrdersListContainer`, `OrdersTable`, `OrdersFilters`
- `OrdersPagination`, `OrderStatusBadge`
- Sidebar navigation

**Acceptance Criteria**:
- [ ] Route `/orders` in sidebar
- [ ] Table: Order ID, Product, Price, Status, Dates
- [ ] Filters: date range, status, search
- [ ] Sorting by columns
- [ ] Click row → open modal
- [ ] Mobile responsive

---

### Story 40.4-FE: Order Details Modal
**Estimate**: 3 SP

**Scope**:
- `OrderDetailsModal` with tabs
- Header with order info
- Tab navigation

**Acceptance Criteria**:
- [ ] Modal opens from table row
- [ ] Header: product, order ID, price, status
- [ ] Tabs: Полная история | WB История | Локальная
- [ ] Loading/error states
- [ ] Accessible (focus trap, aria)

---

### Story 40.5-FE: History Timeline Components
**Estimate**: 5 SP

**Scope**:
- `OrderHistoryTimeline` (merged)
- `WbHistoryTimeline` (WB-only)
- `LocalHistoryTimeline` (local-only)
- `HistoryEntryCard`, `HistorySourceBadge`, `DurationDisplay`

**Acceptance Criteria**:
- [ ] Merged view sorted by timestamp
- [ ] Source badges (WB vs Local)
- [ ] Duration formatting: "30 мин", "2 ч 15 мин"
- [ ] Unknown WB codes → show raw code
- [ ] Summary section
- [ ] Empty state

---

### Story 40.6-FE: Orders Analytics Dashboard
**Estimate**: 5 SP

**Scope**:
- `OrdersAnalyticsDashboard`
- `SlaComplianceWidget`, `VelocityMetricsWidget`
- `AtRiskOrdersCard`, `OrderSyncStatus`

**Acceptance Criteria**:
- [ ] SLA % with color coding
- [ ] Velocity: avg confirmation/completion times
- [ ] At-risk orders with pagination
- [ ] Sync status + "Обновить" button
- [ ] 1-minute refetch interval

---

### Story 40.7-FE: Integration & Polish
**Estimate**: 2 SP

**Scope**:
- Integration testing
- Error boundary
- Lazy loading
- Documentation update

**Acceptance Criteria**:
- [ ] All endpoints integrated
- [ ] Error boundary
- [ ] Lazy load timeline components
- [ ] CLAUDE.md updated

---

## Technical Notes

### Caching Strategy
```typescript
const HISTORY_CACHE_CONFIG = {
  staleTime: 30_000,      // 30 seconds
  gcTime: 300_000,        // 5 minutes
  refetchOnWindowFocus: false,
  retry: 1,
}
```

### On-Demand Fetching
WB history fetched only when user opens order detail:
```typescript
const { data } = useWbHistory(orderId, {
  enabled: activeTab === 'wb',
})
```

### Unknown Status Codes
```typescript
function getWbStatusLabel(code: string): string {
  return WB_STATUS_CONFIG[code]?.label ?? code // Fallback to raw
}
```

---

## Open Questions

1. **WB Status Translations**: Backend endpoint or frontend mapping?
2. **Cache TTL**: What's the WB history cache duration?
3. **Sync Queue Indicator**: Show when background sync is processing?

---

## File Structure

```
src/
├── types/
│   ├── orders.ts
│   └── orders-history.ts
├── lib/api/
│   └── orders.ts
├── hooks/
│   ├── useOrders.ts
│   ├── useOrderHistory.ts
│   └── useOrdersAnalytics.ts
└── app/(dashboard)/orders/
    ├── page.tsx
    ├── loading.tsx
    └── components/
        ├── OrdersListContainer.tsx
        ├── OrdersTable.tsx
        ├── OrderDetailsModal.tsx
        ├── OrderHistoryTimeline.tsx
        └── ...
```

---

---

## Completion Summary

**Completed**: 2026-01-29

### Sprint 1 (Feb 3-14) - Foundation
- Story 40.1-FE: Types & API Client Foundation (3 SP) - ✅
- Story 40.2-FE: React Query Hooks (3 SP) - ✅
- Story 40.3-FE: Orders List Page (5 SP) - ✅
- Story 40.4-FE: Order Details Modal (3 SP) - ✅

### Sprint 2 (Feb 17-28) - History & Analytics
- Story 40.5-FE: History Timeline Components (5 SP) - ✅
- Story 40.6-FE: Orders Analytics Dashboard (5 SP) - ✅
- Story 40.7-FE: Integration & Polish (2 SP) - ✅

### Key Achievements
- Complete Orders module with `/orders` route
- 40+ WB native status codes mapped with Russian translations
- Three timeline views: Full, WB-only, Local-only
- SLA compliance and velocity metrics widgets
- At-risk orders tracking with pagination
- Order sync status indicator
- E2E tests with Playwright
- Lazy loading for timeline components
- Error boundary implementation

### Files Created
- `src/types/orders.ts`, `src/types/orders-history.ts`
- `src/lib/api/orders.ts`
- `src/hooks/useOrders.ts`, `src/hooks/useOrderHistory.ts`, `src/hooks/useOrdersAnalytics.ts`
- `src/lib/wb-status-mapping.ts`
- `src/lib/duration-utils.ts`, `src/lib/history-utils.ts`
- 16 components in `src/app/(dashboard)/orders/components/`
- E2E tests in `e2e/orders.spec.ts`

---

**Created**: 2026-01-29
**Last Updated**: 2026-01-29
**Completed**: 2026-01-29

# Story 40.6-FE: Orders Analytics Dashboard

## Story Info

- **Epic**: 40-FE - Orders UI & WB Native Status History
- **Sprint**: 2 (Feb 17-28)
- **Priority**: P1 (Enhancement)
- **Points**: 5 SP
- **Status**: ✅ Complete
- **Backend Dependency**: Epic 40, Story 40.6 (Analytics Service - Complete)

---

## User Story

**As a** FBS seller,
**I want** to see SLA compliance, processing velocity, and at-risk orders at a glance,
**So that** I can proactively manage order fulfillment and avoid SLA breaches.

**Non-goals**:

- Volume trends chart (optional mini-chart, defer to polish)
- Historical SLA comparison (future epic)
- Export functionality (future story)

---

## Acceptance Criteria

### AC1: SLA Compliance Widget

- [ ] Display confirmation SLA compliance percentage (% of orders confirmed within 2h)
- [ ] Display completion SLA compliance percentage (% of orders completed within 24h)
- [ ] Color-coded thresholds:
  - Green: >= 95%
  - Yellow: 85-94%
  - Red: < 85%
- [ ] Show pending orders count
- [ ] Show breached orders count with red badge
- [ ] Tooltip explains SLA thresholds (2h confirm, 24h complete)

### AC2: Velocity Metrics Widget

- [ ] Display average confirmation time in human-readable format (e.g., "35 мин")
- [ ] Display average completion time (e.g., "4 ч 30 мин")
- [ ] Show P50/P95 percentiles in collapsible section
- [ ] Color coding for avg times:
  - Green: confirmation < 30min, completion < 3h
  - Yellow: confirmation 30-60min, completion 3-6h
  - Red: confirmation > 60min, completion > 6h

### AC3: At-Risk Orders Card

- [ ] List orders approaching SLA breach (minutesRemaining > 0, isBreached = false)
- [ ] Show order ID, current status, time remaining, risk type (confirmation/completion)
- [ ] Pagination (10 items per page, offset-based)
- [ ] Total count badge in header (e.g., "12 заказов")
- [ ] Click on order opens OrderDetailsModal
- [ ] Empty state when no at-risk orders: "Нет заказов под угрозой"
- [ ] Sort by minutesRemaining ascending (most urgent first)

### AC4: Order Sync Status Indicator

- [ ] Show last sync timestamp in relative time (e.g., "2 мин назад")
- [ ] Health status dot: green (healthy), yellow (degraded), orange (stale), red (unhealthy)
- [ ] "Обновить" button triggers manual sync (POST /v1/orders/sync)
- [ ] Tooltip with next scheduled sync time
- [ ] Button disabled during sync operation with spinner

### AC5: Real-time Polling

- [ ] SLA metrics refresh every 60 seconds (refetchInterval: 60000)
- [ ] Velocity metrics refresh every 5 minutes (refetchInterval: 300000)
- [ ] Polling pauses when browser tab is hidden
- [ ] Manual refresh button resets interval

### AC6: Loading & Error States

- [ ] Skeleton loaders for each widget during initial load
- [ ] Error state with retry button per widget (graceful degradation)
- [ ] Toast notification on sync trigger (success/error)

### AC7: Responsive Layout

- [ ] Desktop: 2x2 grid (SLA | Velocity / At-Risk | Sync Status)
- [ ] Tablet: 2x2 grid with reduced padding
- [ ] Mobile: Single column stack

### AC8: Accessibility

- [ ] Color + icon for status (not color alone)
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation for at-risk orders list
- [ ] Focus management when opening modal from list

---

## UI Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Заказы FBS                                                   [Обновить ▼] │
│  ● Синхронизировано 2 мин назад                              ─────────────  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐        │
│  │  📊 SLA Соответствие         │  │  ⏱️ Скорость обработки        │        │
│  │                              │  │                              │        │
│  │  Подтверждение   Выполнение  │  │  Подтверждение  Выполнение   │        │
│  │  ┌─────────┐    ┌─────────┐  │  │  ┌─────────┐   ┌─────────┐   │        │
│  │  │ 95.5%   │    │ 92.3%   │  │  │  │ 35 мин  │   │ 4 ч 30м │   │        │
│  │  │ 🟢      │    │ 🟡      │  │  │  │ 🟢      │   │ 🟡      │   │        │
│  │  └─────────┘    └─────────┘  │  │  └─────────┘   └─────────┘   │        │
│  │                              │  │                              │        │
│  │  В ожидании: 12    Нарушено: 2│  │  [▼ P50/P95 детали]          │        │
│  │  (?) SLA: 2ч / 24ч           │  │     P50: 28м / 3ч 20м        │        │
│  └──────────────────────────────┘  │     P95: 90м / 8ч            │        │
│                                    └──────────────────────────────┘        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  ⚠️ Заказы под угрозой SLA                                  12 заказов ││
│  │  ───────────────────────────────────────────────────────────────────── ││
│  │                                                                        ││
│  │  #1234567890  │ SKU-ABC-001  │ new → confirm │ 25 мин │ Подтверждение ││
│  │  #1234567891  │ SKU-DEF-002  │ confirm      │ 1 ч 45м │ Выполнение    ││
│  │  #1234567892  │ SKU-GHI-003  │ new          │ 15 мин │ Подтверждение ││
│  │  ...                                                                   ││
│  │                                                                        ││
│  │  [← Предыдущая]                        Стр. 1 из 2        [Следующая →]││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Widget Layout (Mobile)

```
┌───────────────────────┐
│ Заказы FBS            │
│ ● 2 мин назад         │
├───────────────────────┤
│ 📊 SLA Соответствие   │
│ Подтв: 95.5% 🟢       │
│ Выполн: 92.3% 🟡      │
├───────────────────────┤
│ ⏱️ Скорость           │
│ Подтв: 35 мин 🟢      │
│ Выполн: 4ч 30м 🟡     │
├───────────────────────┤
│ ⚠️ Под угрозой (12)   │
│ [At-risk list...]     │
└───────────────────────┘
```

---

## Components to Create

### Container Component

| Component                      | Location                                 | Lines | Description                               |
| ------------------------------ | ---------------------------------------- | ----- | ----------------------------------------- |
| `OrdersAnalyticsDashboard.tsx` | `src/app/(dashboard)/orders/components/` | ~150  | Main container with polling orchestration |

### Widget Components

| Component                   | Location                                 | Lines | Description                        |
| --------------------------- | ---------------------------------------- | ----- | ---------------------------------- |
| `SlaComplianceWidget.tsx`   | `src/app/(dashboard)/orders/components/` | ~120  | SLA % cards with color coding      |
| `VelocityMetricsWidget.tsx` | `src/app/(dashboard)/orders/components/` | ~100  | Avg times with percentiles         |
| `AtRiskOrdersCard.tsx`      | `src/app/(dashboard)/orders/components/` | ~150  | Paginated at-risk orders list      |
| `OrderSyncStatus.tsx`       | `src/app/(dashboard)/orders/components/` | ~100  | Sync indicator with refresh button |

### Supporting Components

| Component                  | Location                                 | Lines | Description                       |
| -------------------------- | ---------------------------------------- | ----- | --------------------------------- |
| `SlaPercentageDisplay.tsx` | `src/app/(dashboard)/orders/components/` | ~50   | Reusable SLA % with color         |
| `DurationDisplay.tsx`      | `src/app/(dashboard)/orders/components/` | ~40   | Human-readable duration formatter |
| `AtRiskOrderRow.tsx`       | `src/app/(dashboard)/orders/components/` | ~60   | Single at-risk order row          |

---

## API Endpoints

### SLA Metrics

```http
GET /v1/analytics/orders/sla
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
Query:
  - confirmationSlaHours: 2 (default)
  - completionSlaHours: 24 (default)
  - atRiskLimit: 10 (default 20, max 100)
  - atRiskOffset: 0 (default)
```

**Response**:

```typescript
interface SlaMetricsResponse {
  confirmationSlaHours: number
  completionSlaHours: number
  confirmationCompliancePercent: number  // 0-100
  completionCompliancePercent: number    // 0-100
  pendingOrdersCount: number
  atRiskTotal: number                    // Total before pagination
  atRiskOrders: AtRiskOrder[]            // Paginated list
  breachedCount: number
}

interface AtRiskOrder {
  orderId: string
  createdAt: string        // ISO 8601
  currentStatus: string    // supplier_status
  minutesRemaining: number // Time until breach
  riskType: 'confirmation' | 'completion'
  isBreached: boolean      // true if already breached
}
```

### Velocity Metrics

```http
GET /v1/analytics/orders/velocity
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
Query:
  - from: ISO date (required)
  - to: ISO date (required)
```

**Response**:

```typescript
interface VelocityMetricsResponse {
  avgConfirmationTimeMinutes: number
  avgCompletionTimeMinutes: number
  p50ConfirmationMinutes: number
  p95ConfirmationMinutes: number
  p99ConfirmationMinutes: number
  p50CompletionMinutes: number
  p95CompletionMinutes: number
  p99CompletionMinutes: number
  byWarehouse: Record<string, WarehouseVelocity>
  byDeliveryType: Record<string, DeliveryVelocity>
  totalOrders: number
  period: { from: string; to: string }
}
```

### Sync Trigger

```http
POST /v1/orders/sync
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

**Response**:

```typescript
interface TriggerSyncResponse {
  jobId: string
  message: string
}
```

### Sync Status

```http
GET /v1/orders/sync-status
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

**Response**:

```typescript
interface SyncStatusResponse {
  enabled: boolean
  lastSyncAt: string | null  // ISO 8601
  nextSyncAt: string | null  // ISO 8601
  schedule: string           // e.g., "Every 5 minutes"
  timezone: string           // e.g., "Europe/Moscow"
}
```

---

## Technical Implementation

### Color Coding Rules

```typescript
// SLA Compliance Color Thresholds
function getSlaComplianceColor(percent: number): string {
  if (percent >= 95) return 'text-green-600'  // Excellent
  if (percent >= 85) return 'text-yellow-600' // Warning
  return 'text-red-600'                       // Critical
}

// Velocity Color Thresholds
function getConfirmationTimeColor(minutes: number): string {
  if (minutes < 30) return 'text-green-600'   // Fast
  if (minutes < 60) return 'text-yellow-600'  // Acceptable
  return 'text-red-600'                       // Slow
}

function getCompletionTimeColor(minutes: number): string {
  if (minutes < 180) return 'text-green-600'  // Fast (< 3h)
  if (minutes < 360) return 'text-yellow-600' // Acceptable (3-6h)
  return 'text-red-600'                       // Slow (> 6h)
}
```

### Polling Configuration

```typescript
// src/hooks/useOrdersAnalytics.ts

// SLA metrics - real-time (1 min)
export const SLA_REFETCH_INTERVAL = 60_000

// Velocity metrics - less frequent (5 min)
export const VELOCITY_REFETCH_INTERVAL = 300_000

// Cache configuration
export const ANALYTICS_CACHE_CONFIG = {
  staleTime: 30_000,      // 30 seconds
  gcTime: 300_000,        // 5 minutes
  refetchOnWindowFocus: false,
  retry: 1,
}
```

### Duration Formatting

```typescript
/**
 * Format minutes into human-readable Russian duration
 * Examples: "35 мин", "2 ч 15 мин", "1 д 4 ч"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} мин`
  }

  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)

  if (hours < 24) {
    return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`
  }

  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return `${days} д ${remainingHours} ч`
}
```

### Component Structure

```tsx
// OrdersAnalyticsDashboard.tsx
export function OrdersAnalyticsDashboard() {
  // Hooks for data fetching with polling
  const slaQuery = useSlaMetrics({
    atRiskLimit: 10,
    atRiskOffset: currentPage * 10
  })
  const velocityQuery = useVelocityMetrics({ from, to })
  const syncStatus = useOrdersSyncStatus()

  // Manual sync mutation
  const syncMutation = useTriggerOrdersSync()

  return (
    <div className="space-y-6">
      <OrderSyncStatus
        status={syncStatus.data}
        onSync={() => syncMutation.mutate()}
        isSyncing={syncMutation.isPending}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <SlaComplianceWidget data={slaQuery.data} isLoading={slaQuery.isLoading} />
        <VelocityMetricsWidget data={velocityQuery.data} isLoading={velocityQuery.isLoading} />
      </div>

      <AtRiskOrdersCard
        orders={slaQuery.data?.atRiskOrders}
        total={slaQuery.data?.atRiskTotal}
        isLoading={slaQuery.isLoading}
        onOrderClick={handleOrderClick}
        page={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
```

---

## Test Scenarios

### Unit Tests

| Test                      | File                             | Description                       |
| ------------------------- | -------------------------------- | --------------------------------- |
| SLA color thresholds      | `SlaComplianceWidget.test.tsx`   | Verify color at 95%, 85%, 50%     |
| Velocity color thresholds | `VelocityMetricsWidget.test.tsx` | Verify colors for different times |
| Duration formatting       | `DurationDisplay.test.tsx`       | Test edge cases (0, 59, 60, 1440) |
| At-risk pagination        | `AtRiskOrdersCard.test.tsx`      | Test page changes, empty state    |
| Sync trigger button       | `OrderSyncStatus.test.tsx`       | Test disabled state, spinner      |

### Integration Tests

| Scenario         | Description                            |
| ---------------- | -------------------------------------- |
| Dashboard loads  | All widgets render with loading states |
| SLA polling      | Verify 60s interval, pause on tab hide |
| Manual sync      | Button triggers sync, shows toast      |
| Modal navigation | Click at-risk order opens detail modal |

---

## Dependencies

### Required from Story 40.1-FE (Types)

- `SlaMetrics` interface
- `VelocityMetrics` interface
- `AtRiskOrder` interface
- `SyncStatusResponse` interface

### Required from Story 40.2-FE (Hooks)

- `useSlaMetrics()` - SLA compliance data
- `useVelocityMetrics()` - Processing times
- `useOrdersSyncStatus()` - Sync health
- `useTriggerOrdersSync()` - Manual sync mutation

### Required from Story 40.4-FE (Modal)

- `OrderDetailsModal` - For at-risk order click

---

## Definition of Done

- [ ] All acceptance criteria verified
- [ ] SlaComplianceWidget shows both metrics with correct colors
- [ ] VelocityMetricsWidget shows avg times and percentiles
- [ ] AtRiskOrdersCard displays paginated list with click-to-modal
- [ ] OrderSyncStatus shows relative time and sync button
- [ ] 60-second polling for SLA, 5-minute for velocity
- [ ] Polling pauses when tab is hidden
- [ ] Loading skeletons for all widgets
- [ ] Error states with retry buttons
- [ ] Mobile responsive (single column)
- [ ] Accessibility: colors + icons, ARIA labels
- [ ] Unit tests pass (>80% coverage)
- [ ] TypeScript strict mode, no `any` types
- [ ] Code review approved
- [ ] CLAUDE.md updated (if needed)

---

## Open Questions

1. **Volume Trends Chart**: Defer mini-chart to Story 40.7 polish phase?
2. **Historical Comparison**: Show week-over-week SLA change?
3. **Threshold Customization**: Allow users to adjust SLA thresholds?

---

## References

- Backend Epic 40: Story 40.6 Analytics Service
- Backend API: `test-api/14-orders.http` (getSlaMetrics, getVelocityMetrics)
- Design patterns: `AdvertisingSummaryCards.tsx`, `SyncStatusIndicator.tsx`
- Existing polling: `useAdvertisingAnalytics.ts` refetchInterval pattern

---

**Created**: 2026-01-29
**Author**: Product Manager
**Last Updated**: 2026-01-29

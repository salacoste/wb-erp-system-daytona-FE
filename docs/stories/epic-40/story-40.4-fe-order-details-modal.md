# Story 40.4-FE: Order Details Modal

## Story Info

- **Epic**: 40-FE - Orders UI & WB Native Status History
- **Sprint**: 1 (Feb 3-14, 2026)
- **Priority**: High
- **Points**: 3
- **Status**: ✅ Complete

## User Story

**As a** seller operations manager,
**I want** to view detailed order information in a modal with tabbed history views,
**So that** I can analyze the complete order lifecycle from both our local tracking and WB native systems without leaving the orders list.

## Background

The Order Details Modal is the central component for order inspection. It displays order header information (product, price, status) and provides three tabbed views for different history perspectives:

1. **Полная история** (Full History) - Merged timeline from both sources
2. **WB История** (WB History) - WB native 40+ status codes only
3. **Локальная** (Local History) - Our local tracking only

Each tab fetches data on-demand to optimize performance and API usage.

---

## Acceptance Criteria

### AC1: Modal Trigger & Display

- [ ] Modal opens when clicking any row in OrdersTable
- [ ] Modal uses shadcn/ui Dialog component with max-width 700px
- [ ] Modal has proper z-index for overlay (z-50)
- [ ] Clicking outside modal or X button closes it
- [ ] Escape key closes modal

### AC2: Modal Header

- [ ] Display product image thumbnail (from WB CDN if available, fallback placeholder)
- [ ] Display product name with truncation (max 2 lines)
- [ ] Display order ID prominently (e.g., "Заказ #1234567890")
- [ ] Display vendor code (артикул продавца)
- [ ] Display current status badge using `OrderStatusBadge` component
- [ ] Display price info: sale price and original price (strikethrough if different)
- [ ] Display order creation date formatted as "DD.MM.YYYY HH:mm"

### AC3: Tab Navigation

- [ ] Three tabs: "Полная история", "WB История", "Локальная"
- [ ] Default active tab: "Полная история"
- [ ] Tab navigation using shadcn/ui Tabs component
- [ ] Active tab visually distinct (primary color underline)
- [ ] Tabs keyboard navigable (arrow keys, Enter/Space to select)

### AC4: On-Demand Data Fetching

- [ ] "Полная история" tab calls `GET /v1/orders/:orderId/full-history`
- [ ] "WB История" tab calls `GET /v1/orders/:orderId/wb-history`
- [ ] "Локальная" tab calls `GET /v1/orders/:orderId/history`
- [ ] Data fetched only when tab becomes active (`enabled: activeTab === 'X'`)
- [ ] Cache TTL: 30 seconds (staleTime), 5 minutes (gcTime)
- [ ] Show skeleton loader while fetching

### AC5: Tab Content - Full History

- [ ] Renders `OrderHistoryTimeline` component (Story 40.5-FE)
- [ ] Displays source badge for each entry ("WB" or "Локальная")
- [ ] Entries sorted chronologically (oldest first)
- [ ] Summary section: total entries count, local/WB breakdown

### AC6: Tab Content - WB History

- [ ] Renders `WbHistoryTimeline` component (Story 40.5-FE)
- [ ] Uses `wb-status-mapping.ts` for status labels and colors
- [ ] Shows duration between status transitions
- [ ] Summary: total transitions, total duration, current WB status

### AC7: Tab Content - Local History

- [ ] Renders `LocalHistoryTimeline` component (Story 40.5-FE)
- [ ] Shows supplier_status and wb_status transitions
- [ ] Shows duration between transitions
- [ ] Summary: total transitions, created_at, completed_at (if final)

### AC8: Loading States

- [ ] Show skeleton loader inside modal body while header data loads
- [ ] Show skeleton loader per tab content while history loads
- [ ] Skeleton matches timeline entry structure
- [ ] Loading state accessible (aria-busy="true")

### AC9: Error States

- [ ] Show error message with retry button if order fetch fails
- [ ] Show error message with retry button per tab if history fetch fails
- [ ] Error message in Russian: "Не удалось загрузить данные. Попробуйте снова."
- [ ] 404 error: "Заказ не найден" with close button

### AC10: Empty States

- [ ] If no history entries: "История статусов пока пуста"
- [ ] If WB history not synced yet: "WB история ещё не загружена. Синхронизация происходит каждые 15 минут."

### AC11: Accessibility (WCAG 2.1 AA)

- [ ] Focus trapped inside modal when open
- [ ] Initial focus on close button or first tab
- [ ] Focus returns to trigger element on close
- [ ] All interactive elements keyboard accessible
- [ ] ARIA labels: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- [ ] Tab content regions have `role="tabpanel"` and `aria-labelledby`
- [ ] Screen reader announces modal open/close

---

## UI Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [X]                                                                     │
│ ┌──────┐                                                                │
│ │ IMG  │  Название товара (макс 2 строки с троеточием...)              │
│ │      │  Артикул: SKU-ABC-001                                         │
│ └──────┘  Заказ #1234567890                                            │
│                                                                         │
│           1 200,00 ₽  ̶1̶ ̶5̶0̶0̶,̶0̶0̶ ̶₽̶      [В обработке]                  │
│           Создан: 04.01.2026 10:30                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  [Полная история]    [WB История]    [Локальная]                        │
│  ═══════════════                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Итого: 5 записей  |  WB: 3  |  Локальная: 2                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ● 04.01.2026 10:00                                          [WB]       │
│    created → Создан                                                     │
│    ─ 5 мин ─                                                            │
│                                                                         │
│  ● 04.01.2026 10:05                                      [Локальная]    │
│    new → waiting                                                        │
│    Статус продавца: null → new                                          │
│    WB статус: null → waiting                                            │
│    ─ 25 мин ─                                                           │
│                                                                         │
│  ● 04.01.2026 10:30                                          [WB]       │
│    assembling → На сборке                                               │
│    ...                                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Components to Create

### New Components

| Component | File Path | Lines Est. | Purpose |
|-----------|-----------|------------|---------|
| `OrderDetailsModal` | `src/app/(dashboard)/orders/components/OrderDetailsModal.tsx` | ~150 | Main modal container with tabs |
| `OrderModalHeader` | `src/app/(dashboard)/orders/components/OrderModalHeader.tsx` | ~80 | Order info header section |
| `OrderHistoryTabs` | `src/app/(dashboard)/orders/components/OrderHistoryTabs.tsx` | ~100 | Tab navigation + content wrapper |
| `ModalLoadingSkeleton` | `src/app/(dashboard)/orders/components/ModalLoadingSkeleton.tsx` | ~50 | Skeleton for modal content |

### Reused Components (from Story 40.5-FE)

- `OrderHistoryTimeline` - Full merged history view
- `WbHistoryTimeline` - WB-only history view
- `LocalHistoryTimeline` - Local-only history view
- `OrderStatusBadge` - Status badge (Story 40.3-FE)

### Hooks (from Story 40.2-FE)

- `useOrderDetails(orderId)` - Fetches single order
- `useFullHistory(orderId, options)` - Full merged history
- `useWbHistory(orderId, options)` - WB native history
- `useLocalHistory(orderId, options)` - Local history

---

## API Calls

### Modal Header Data

```typescript
// Fetched when modal opens
GET /v1/orders/:orderId
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

### Tab Content (On-Demand)

```typescript
// Tab 1: Полная история
GET /v1/orders/:orderId/full-history

// Tab 2: WB История
GET /v1/orders/:orderId/wb-history

// Tab 3: Локальная
GET /v1/orders/:orderId/history
```

### Caching Strategy

```typescript
const HISTORY_CACHE_CONFIG = {
  staleTime: 30_000,       // 30 seconds
  gcTime: 300_000,         // 5 minutes
  refetchOnWindowFocus: false,
  retry: 1,
}
```

---

## Technical Implementation

### Modal State Management

```typescript
// In OrdersListContainer or page
const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
const isModalOpen = selectedOrderId !== null

// Open modal
const handleRowClick = (orderId: string) => setSelectedOrderId(orderId)

// Close modal
const handleCloseModal = () => setSelectedOrderId(null)
```

### On-Demand Fetching Pattern

```typescript
// Inside OrderHistoryTabs
const [activeTab, setActiveTab] = useState<'full' | 'wb' | 'local'>('full')

const fullHistory = useFullHistory(orderId, {
  enabled: activeTab === 'full',
  ...HISTORY_CACHE_CONFIG,
})

const wbHistory = useWbHistory(orderId, {
  enabled: activeTab === 'wb',
  ...HISTORY_CACHE_CONFIG,
})

const localHistory = useLocalHistory(orderId, {
  enabled: activeTab === 'local',
  ...HISTORY_CACHE_CONFIG,
})
```

### Focus Management

```typescript
// Using Radix Dialog (via shadcn/ui)
// Focus trap is automatic
// Return focus is automatic via onOpenChange
```

---

## Error Handling

| HTTP Status | Error Message (Russian) | Action |
|-------------|-------------------------|--------|
| 400 | "Неверный формат ID заказа" | Show inline error |
| 401 | "Сессия истекла. Войдите снова." | Redirect to login |
| 403 | "Нет доступа к этому заказу" | Show error, close modal |
| 404 | "Заказ не найден" | Show error with close button |
| 500 | "Ошибка сервера. Попробуйте позже." | Show retry button |
| Network | "Не удалось загрузить данные. Проверьте соединение." | Show retry button |

---

## Testing

### Framework & Location

- **Framework**: Vitest + React Testing Library
- **Test Location**: `src/app/(dashboard)/orders/components/__tests__/OrderDetailsModal.test.tsx`

### Test Cases

#### Modal Behavior
- [ ] Modal opens when trigger clicked
- [ ] Modal closes on X button click
- [ ] Modal closes on overlay click
- [ ] Modal closes on Escape key
- [ ] Focus trapped inside modal
- [ ] Focus returns to trigger on close

#### Header Display
- [ ] Order ID displayed correctly
- [ ] Product name truncated at 2 lines
- [ ] Price formatting with currency
- [ ] Status badge renders correctly
- [ ] Creation date formatted as DD.MM.YYYY HH:mm

#### Tab Navigation
- [ ] Default tab is "Полная история"
- [ ] Clicking tab switches content
- [ ] Arrow keys navigate between tabs
- [ ] Active tab visually highlighted

#### Data Fetching
- [ ] Full history fetched when tab active
- [ ] WB history fetched only when tab selected
- [ ] Local history fetched only when tab selected
- [ ] Loading skeleton shown during fetch
- [ ] Error state shown on API failure
- [ ] Retry button triggers refetch

#### Accessibility
- [ ] Modal has role="dialog"
- [ ] Modal has aria-modal="true"
- [ ] Tabs have proper ARIA roles
- [ ] Screen reader announces modal state

---

## Definition of Done

- [ ] All acceptance criteria (AC1-AC11) implemented
- [ ] Components created: `OrderDetailsModal`, `OrderModalHeader`, `OrderHistoryTabs`, `ModalLoadingSkeleton`
- [ ] Uses hooks from Story 40.2-FE (`useOrderDetails`, `useFullHistory`, `useWbHistory`, `useLocalHistory`)
- [ ] Integrates with timeline components from Story 40.5-FE
- [ ] On-demand fetching pattern implemented with proper `enabled` conditions
- [ ] Loading skeletons for modal body and tab content
- [ ] Error states with retry functionality
- [ ] Empty states with appropriate messages
- [ ] All text in Russian
- [ ] Keyboard navigation working (tabs, close)
- [ ] Focus trap and focus management working
- [ ] ARIA labels and roles implemented
- [ ] Unit tests passing (modal behavior, tab switching)
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] File size <200 lines per component
- [ ] Code review approved

---

## Dependencies

### Required (Blocking)

| Dependency | Story | Status | Notes |
|------------|-------|--------|-------|
| Types & API Client | 40.1-FE | Required | TypeScript interfaces, API functions |
| React Query Hooks | 40.2-FE | Required | `useOrderDetails`, `useFullHistory`, etc. |
| Orders List Page | 40.3-FE | Required | Provides modal trigger (row click) |

### Parallel (Non-Blocking)

| Dependency | Story | Status | Notes |
|------------|-------|--------|-------|
| History Timeline Components | 40.5-FE | Can develop in parallel | Use placeholder while developing |

### Backend

| Dependency | Story | Status |
|------------|-------|--------|
| `GET /v1/orders/:orderId` | 40.5 | Complete |
| `GET /v1/orders/:orderId/history` | 40.8 | Complete |
| `GET /v1/orders/:orderId/wb-history` | 40.9 | Complete |
| `GET /v1/orders/:orderId/full-history` | 40.9 | Complete |

---

## Dev Notes

### Relevant Source Tree

```
src/
├── app/(dashboard)/orders/
│   ├── page.tsx                    # Orders page (Story 40.3-FE)
│   └── components/
│       ├── OrdersTable.tsx         # Table with row click handler
│       ├── OrderDetailsModal.tsx   # NEW: This story
│       ├── OrderModalHeader.tsx    # NEW: This story
│       ├── OrderHistoryTabs.tsx    # NEW: This story
│       └── ModalLoadingSkeleton.tsx # NEW: This story
├── components/ui/
│   ├── dialog.tsx                  # shadcn/ui Dialog
│   └── tabs.tsx                    # shadcn/ui Tabs
├── lib/
│   └── wb-status-mapping.ts        # WB status code translations
├── hooks/
│   ├── useOrders.ts                # Story 40.2-FE
│   └── useOrderHistory.ts          # Story 40.2-FE
└── types/
    ├── orders.ts                   # Story 40.1-FE
    └── orders-history.ts           # Story 40.1-FE
```

### Design System Adherence

Per Design Kit and README:
- **Modal**: Use shadcn/ui Dialog component
- **Tabs**: Use shadcn/ui Tabs component
- **Icons**: Use Lucide icons only (X for close, Package for product fallback)
- **Colors**: Primary Red (#E53935) for active tab indicator
- **Typography**: 14px body, 16px headings

### Important Patterns

1. **On-demand fetching**: Critical for performance - don't fetch all history upfront
2. **Focus management**: Radix Dialog handles this automatically
3. **Status mapping**: Use `getWbStatusConfig()` from `wb-status-mapping.ts`
4. **Russian locale**: All user-facing text must be in Russian

---

## Related

- **Parent Epic**: [Epic 40-FE: Orders UI & WB Native Status History](../../epics/epic-40-fe-orders-wb-history.md)
- **Backend Story**: [Story 40.9: WB Native Status History](../../../../docs/stories/epic-40/story-40.9-wb-native-status-history.md)
- **API Reference**: `test-api/14-orders.http`
- **Timeline Components**: [Story 40.5-FE: History Timeline Components](./story-40.5-fe-history-timeline-components.md)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-29 | 1.0 | Initial story creation | Claude Code (PM Agent) |

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

_Section for QA to document review results_

```
Gate Decision:
Reviewer:
Date:
Quality Score: /100
```

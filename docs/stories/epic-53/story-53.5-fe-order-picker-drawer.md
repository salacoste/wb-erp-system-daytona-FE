# Story 53.5-FE: Order Picker Drawer

## Story Info

- **Epic**: 53-FE - Supply Management UI
- **Sprint**: 4 (Mar 17-28, 2026)
- **Priority**: High
- **Points**: 8 (Most Complex in Epic)
- **Status**: Ready for Dev

## User Story

**As a** WB seller managing FBS supplies,
**I want** to select multiple FBS orders to add to my supply using a full-screen drawer,
**So that** I can efficiently batch orders for delivery to Wildberries warehouse.

## Background

The Order Picker Drawer is the most complex component in Epic 53-FE. It must:

1. Handle 1000+ orders efficiently using virtualization
2. Support multi-select with "select all visible" functionality
3. Filter orders by status, search term
4. Show only eligible orders (not already in a supply)
5. Handle partial success when adding orders (some may fail)

**Critical Dependency**: Uses `useOrders` hook from Epic 40-FE (Story 40.2-FE).

---

## Acceptance Criteria

### AC1: Full-Screen Drawer

- [ ] Opens from Supply Detail page "Добавить заказы" button
- [ ] Full-screen overlay with slide-in animation
- [ ] Close button (X) in top-right corner
- [ ] Close on Escape key press
- [ ] Prevent body scroll when open
- [ ] Header shows "Добавить заказы в поставку"

### AC2: Virtualized Order List

- [ ] Uses `react-window` FixedSizeList component
- [ ] Row height: 48px
- [ ] Renders smoothly with 1000+ orders
- [ ] No lag when scrolling
- [ ] Shows loading skeleton while fetching
- [ ] Empty state: "Нет доступных заказов для добавления"

### AC3: Order Row Display

- [ ] Checkbox for selection (left side)
- [ ] Order ID (orderId)
- [ ] Product info: nmId, vendorCode (article)
- [ ] Sale price formatted as currency
- [ ] Supplier status badge
- [ ] Row highlights on hover

### AC4: Multi-Select Functionality

- [ ] Individual checkbox per row
- [ ] Checkbox state persists during scroll (virtualization)
- [ ] "Выбрать все" checkbox in header
- [ ] "Выбрать все" selects all VISIBLE (filtered) orders
- [ ] Indeterminate state when partially selected
- [ ] Clear selection button when items selected

### AC5: Selection Counter

- [ ] Counter shows "Выбрано: N заказов"
- [ ] Updates in real-time as selection changes
- [ ] Shows 0 when nothing selected
- [ ] Maximum 1000 orders per batch (UI enforced)
- [ ] Warning when approaching limit (>900)

### AC6: Search & Filters

- [ ] Search input filters by orderId or vendorCode (article)
- [ ] Debounced search (300ms delay)
- [ ] Status filter dropdown (defaults to eligible statuses)
- [ ] Filters: supplier_status IN ('confirm', 'complete')
- [ ] Only shows orders with supplyId: null
- [ ] Clear filters button

### AC7: Add Orders Button

- [ ] "Добавить выбранные (N)" primary button
- [ ] Disabled when N = 0
- [ ] Shows loading state during mutation
- [ ] Button in sticky footer area
- [ ] Keyboard accessible (Enter to submit)

### AC8: Partial Success Handling

- [ ] Some orders may fail to add (already in another supply)
- [ ] Show success toast with count: "Добавлено: X заказов"
- [ ] Show warning if some failed: "Не удалось добавить: Y заказов"
- [ ] Failed orders remain in list (re-selectable)
- [ ] Refresh supply detail on success

### AC9: Loading & Error States

- [ ] Skeleton loader while fetching orders
- [ ] Error state with retry button
- [ ] Empty state when no eligible orders
- [ ] Network error: "Не удалось загрузить заказы"

### AC10: Accessibility (WCAG 2.1 AA)

- [ ] Drawer has `role="dialog"` and `aria-modal="true"`
- [ ] Focus trapped inside drawer when open
- [ ] Focus moves to first focusable element on open
- [ ] Focus returns to trigger button on close
- [ ] All checkboxes have labels
- [ ] Keyboard navigation works (Tab, Space, Enter)

---

## UI Wireframe

### Desktop View (Full-Screen Drawer)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                    [X Close]│
│                                                                             │
│   Добавить заказы в поставку                                                │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [🔍 Поиск по ID или артикулу...        ]    [Статус: Все ▼]              │
│                                                                             │
│   Выбрано: 15 заказов                                      [Очистить выбор]│
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [☑] Выбрать все (250)                                                    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│   │                                                                         │
│   │  [☑] #12345678  │  nmId: 456789   │  ABC-001     │  1 500 ₽  │ ● Готов │
│   │  [☐] #12345679  │  nmId: 456790   │  DEF-002     │  2 300 ₽  │ ● Готов │
│   │  [☑] #12345680  │  nmId: 456791   │  GHI-003     │    890 ₽  │ ● Готов │
│   │  [☐] #12345681  │  nmId: 456792   │  JKL-004     │  3 200 ₽  │ ● Новый │
│   │  [☑] #12345682  │  nmId: 456793   │  MNO-005     │  1 100 ₽  │ ● Готов │
│   │                                                                         │
│   │  ... (virtualized scroll, 1000+ rows)                                  │
│   │                                                                         │
│   │                                                                         │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              [Добавить выбранные (15)]                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mobile View (Full-Screen)

```
┌───────────────────────────────────┐
│ Добавить заказы            [X]   │
├───────────────────────────────────┤
│ [🔍 Поиск...              ]      │
│ [Статус: Все ▼            ]      │
│ Выбрано: 5         [Очистить]    │
├───────────────────────────────────┤
│ [☑] Выбрать все (50)             │
├───────────────────────────────────┤
│ [☑] #12345678                    │
│     nmId: 456789  ABC-001        │
│     1 500 ₽  ● Готов             │
├───────────────────────────────────┤
│ [☐] #12345679                    │
│     nmId: 456790  DEF-002        │
│     2 300 ₽  ● Готов             │
├───────────────────────────────────┤
│ ... (virtualized)                │
├───────────────────────────────────┤
│   [Добавить выбранные (5)]       │
└───────────────────────────────────┘
```

---

## Components to Create

### Pages/Containers

| File | Purpose | Lines Est. |
|------|---------|------------|
| `OrderPickerDrawer.tsx` | Full-screen drawer container | ~150 |

### Components

| File | Purpose | Lines Est. |
|------|---------|------------|
| `OrderPickerHeader.tsx` | Header with title and close button | ~60 |
| `OrderPickerFilters.tsx` | Search input and status filter | ~80 |
| `OrderPickerTable.tsx` | Virtualized list with react-window | ~120 |
| `OrderPickerRow.tsx` | Single row for virtualization | ~50 |
| `OrderPickerFooter.tsx` | Sticky footer with add button | ~40 |
| `OrderPickerEmptyState.tsx` | Empty state component | ~30 |
| `OrderPickerSkeleton.tsx` | Loading skeleton | ~40 |

### Hooks

| Hook | File Path | Purpose |
|------|-----------|---------|
| `useOrdersForSupply` | `src/hooks/useOrdersForSupply.ts` | Fetch eligible orders |
| `useAddOrdersToSupply` | `src/hooks/useAddOrdersToSupply.ts` | Batch add mutation |
| `useOrderSelection` | `src/hooks/useOrderSelection.ts` | Selection state management |

---

## API Integration

### Fetch Eligible Orders

Uses existing `useOrders` hook from Epic 40-FE with specific filters:

```typescript
// Filter for eligible orders (not in any supply)
const params: OrdersListParams = {
  supplier_status: 'confirm', // or 'complete'
  limit: 1000,
  offset: 0,
  sort_by: 'created_at',
  sort_order: 'desc',
}

// Note: Backend filters out orders already in supplies
// Frontend adds: supply_id IS NULL filter via backend
```

### Add Orders to Supply

```typescript
POST /v1/supplies/{supplyId}/orders
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
Content-Type: application/json

Request:
{
  "orderIds": ["12345678", "12345679", "12345680"]
}

Response (200 - Partial Success):
{
  "data": {
    "added": ["12345678", "12345679"],
    "failed": [
      {
        "orderId": "12345680",
        "reason": "Order already in supply sup_abc123"
      }
    ],
    "supply": {
      "id": "sup_xyz",
      "ordersCount": 7
    }
  }
}
```

---

## Technical Implementation

### Package Installation

```bash
npm install react-window @types/react-window
```

### OrderPickerDrawer Component

```typescript
// src/app/(dashboard)/supplies/[id]/components/OrderPickerDrawer.tsx
'use client'

import { useCallback, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OrderPickerHeader } from './OrderPickerHeader'
import { OrderPickerFilters } from './OrderPickerFilters'
import { OrderPickerTable } from './OrderPickerTable'
import { OrderPickerFooter } from './OrderPickerFooter'
import { useOrdersForSupply } from '@/hooks/useOrdersForSupply'
import { useAddOrdersToSupply } from '@/hooks/useAddOrdersToSupply'
import { useOrderSelection } from '@/hooks/useOrderSelection'
import { cn } from '@/lib/utils'

interface OrderPickerDrawerProps {
  supplyId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function OrderPickerDrawer({
  supplyId,
  isOpen,
  onClose,
  onSuccess,
}: OrderPickerDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  // Store trigger element on open
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement
      closeButtonRef.current?.focus()
    }
  }, [isOpen])

  // Return focus on close
  const handleClose = useCallback(() => {
    onClose()
    triggerRef.current?.focus()
  }, [onClose])

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, handleClose])

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-picker-title"
      className="fixed inset-0 z-50 bg-background"
    >
      <OrderPickerContent
        supplyId={supplyId}
        onClose={handleClose}
        onSuccess={onSuccess}
        closeButtonRef={closeButtonRef}
      />
    </div>
  )
}
```

### OrderPickerTable with Virtualization

```typescript
// src/app/(dashboard)/supplies/[id]/components/OrderPickerTable.tsx
'use client'

import { FixedSizeList as List } from 'react-window'
import { useRef, useCallback } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { OrderPickerRow } from './OrderPickerRow'
import type { OrderFbsItem } from '@/types/orders'

const ROW_HEIGHT = 48
const HEADER_HEIGHT = 40

interface OrderPickerTableProps {
  orders: OrderFbsItem[]
  selectedIds: Set<string>
  onToggleOrder: (orderId: string) => void
  onToggleAll: () => void
  isAllSelected: boolean
  isIndeterminate: boolean
  height: number
}

export function OrderPickerTable({
  orders,
  selectedIds,
  onToggleOrder,
  onToggleAll,
  isAllSelected,
  isIndeterminate,
  height,
}: OrderPickerTableProps) {
  const listRef = useRef<List>(null)

  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => (
      <OrderPickerRow
        order={orders[index]}
        isSelected={selectedIds.has(orders[index].orderId)}
        onToggle={() => onToggleOrder(orders[index].orderId)}
        style={style}
      />
    ),
    [orders, selectedIds, onToggleOrder]
  )

  return (
    <div className="flex flex-col">
      {/* Header with Select All */}
      <div
        className="flex items-center gap-3 px-4 py-2 border-b bg-muted/50"
        style={{ height: HEADER_HEIGHT }}
      >
        <Checkbox
          checked={isAllSelected}
          indeterminate={isIndeterminate}
          onCheckedChange={onToggleAll}
          aria-label="Выбрать все заказы"
        />
        <span className="text-sm font-medium">
          Выбрать все ({orders.length})
        </span>
      </div>

      {/* Virtualized List */}
      <List
        ref={listRef}
        height={height - HEADER_HEIGHT}
        itemCount={orders.length}
        itemSize={ROW_HEIGHT}
        width="100%"
        overscanCount={5}
      >
        {Row}
      </List>
    </div>
  )
}
```

### OrderPickerRow Component

```typescript
// src/app/(dashboard)/supplies/[id]/components/OrderPickerRow.tsx
import { memo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { getSupplierStatusConfig } from '@/lib/order-status-config'
import type { OrderFbsItem } from '@/types/orders'

interface OrderPickerRowProps {
  order: OrderFbsItem
  isSelected: boolean
  onToggle: () => void
  style: React.CSSProperties
}

export const OrderPickerRow = memo(function OrderPickerRow({
  order,
  isSelected,
  onToggle,
  style,
}: OrderPickerRowProps) {
  const statusConfig = getSupplierStatusConfig(order.supplierStatus)

  return (
    <div
      style={style}
      className="flex items-center gap-4 px-4 hover:bg-muted/50 border-b"
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        aria-label={`Выбрать заказ ${order.orderId}`}
      />
      <span className="w-24 font-mono text-sm">#{order.orderId}</span>
      <span className="w-24 text-sm text-muted-foreground">
        nmId: {order.nmId}
      </span>
      <span className="flex-1 text-sm truncate">{order.vendorCode}</span>
      <span className="w-24 text-right font-medium">
        {formatCurrency(order.salePrice)}
      </span>
      <Badge
        variant="outline"
        className={statusConfig.className}
      >
        {statusConfig.label}
      </Badge>
    </div>
  )
})
```

### useOrderSelection Hook

```typescript
// src/hooks/useOrderSelection.ts
import { useState, useCallback, useMemo } from 'react'

const MAX_SELECTION = 1000

export function useOrderSelection(orderIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleOrder = useCallback((orderId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else if (next.size < MAX_SELECTION) {
        next.add(orderId)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size === orderIds.length) {
        return new Set()
      }
      const toSelect = orderIds.slice(0, MAX_SELECTION)
      return new Set(toSelect)
    })
  }, [orderIds])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isAllSelected = selectedIds.size === orderIds.length && orderIds.length > 0
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < orderIds.length
  const isNearLimit = selectedIds.size > 900

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    toggleOrder,
    toggleAll,
    clearSelection,
    isAllSelected,
    isIndeterminate,
    isNearLimit,
  }
}
```

### useAddOrdersToSupply Hook

```typescript
// src/hooks/useAddOrdersToSupply.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addOrdersToSupply } from '@/lib/api/supplies'
import { suppliesQueryKeys } from '@/lib/api/supplies'
import { toast } from 'sonner'

interface AddOrdersResult {
  added: string[]
  failed: Array<{ orderId: string; reason: string }>
}

export function useAddOrdersToSupply(supplyId: string) {
  const queryClient = useQueryClient()

  return useMutation<AddOrdersResult, Error, string[]>({
    mutationFn: (orderIds) => addOrdersToSupply(supplyId, orderIds),
    onSuccess: (data) => {
      const addedCount = data.added.length
      const failedCount = data.failed.length

      if (addedCount > 0) {
        toast.success(`Добавлено: ${addedCount} заказов`)
      }
      if (failedCount > 0) {
        toast.warning(`Не удалось добавить: ${failedCount} заказов`)
      }

      // Invalidate supply detail to refresh orders list
      queryClient.invalidateQueries({
        queryKey: suppliesQueryKeys.detail(supplyId)
      })
    },
    onError: (error) => {
      toast.error('Не удалось добавить заказы')
      console.error('[Supply] Add orders failed:', error)
    },
  })
}
```

---

## Error Handling

| HTTP Status | Error Message (Russian) | Action |
|-------------|-------------------------|--------|
| 400 | "Неверный запрос" | Show inline error |
| 401 | "Сессия истекла" | Redirect to login |
| 403 | "Нет доступа" | Show error, close drawer |
| 404 | "Поставка не найдена" | Show error, close drawer |
| 409 | "Заказ уже в другой поставке" | Show in failed list |
| 422 | "Превышен лимит заказов" | Show toast warning |
| 500 | "Ошибка сервера" | Show retry button |

---

## Testing

### Framework & Location

- **Framework**: Vitest + React Testing Library
- **Test Location**: `src/app/(dashboard)/supplies/[id]/components/__tests__/`

### Test Cases

#### OrderPickerDrawer

- [ ] Drawer opens when isOpen=true
- [ ] Drawer closes on X button click
- [ ] Drawer closes on Escape key
- [ ] Focus trapped inside drawer
- [ ] Body scroll prevented when open

#### OrderPickerTable (Virtualization)

- [ ] Renders without lag with 1000 items
- [ ] Scrolling is smooth
- [ ] Only visible rows rendered (check DOM)
- [ ] Row height consistent at 48px

#### Selection Logic

- [ ] Individual checkbox toggles selection
- [ ] Select all selects visible orders
- [ ] Select all with partial selection shows indeterminate
- [ ] Selection persists during scroll
- [ ] Max 1000 orders enforced

#### Filters

- [ ] Search filters by orderId
- [ ] Search filters by vendorCode
- [ ] Search debounced (300ms)
- [ ] Clear filters button works
- [ ] Empty state shown when no matches

#### Add Orders

- [ ] Button disabled when nothing selected
- [ ] Button shows count: "Добавить выбранные (N)"
- [ ] Loading state during mutation
- [ ] Success toast on completion
- [ ] Warning toast on partial failure
- [ ] Drawer closes on success

#### Accessibility

- [ ] Dialog has correct ARIA attributes
- [ ] All checkboxes have labels
- [ ] Keyboard navigation works
- [ ] Focus management correct

---

## Definition of Done

- [ ] `react-window` package installed
- [ ] `OrderPickerDrawer` component created
- [ ] `OrderPickerHeader` component created
- [ ] `OrderPickerFilters` component created
- [ ] `OrderPickerTable` component created (virtualized)
- [ ] `OrderPickerRow` component created
- [ ] `OrderPickerFooter` component created
- [ ] `OrderPickerEmptyState` component created
- [ ] `OrderPickerSkeleton` component created
- [ ] `useOrdersForSupply` hook created
- [ ] `useAddOrdersToSupply` hook created
- [ ] `useOrderSelection` hook created
- [ ] Virtualization handles 1000+ orders smoothly
- [ ] Multi-select with "select all visible"
- [ ] Selection counter updates in real-time
- [ ] Search and filter functionality
- [ ] Partial success handling
- [ ] Loading and error states
- [ ] All text in Russian
- [ ] Mobile responsive layout
- [ ] WCAG 2.1 AA compliant
- [ ] Unit tests passing
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] File size <200 lines per component
- [ ] Performance: <16ms frame time while scrolling
- [ ] Code review approved

---

## Dependencies

### Required (Blocking)

| Dependency | Story | Status | Notes |
|------------|-------|--------|-------|
| Types & API Client | 53.1-FE | Required | Supply types |
| Supply Detail Page | 53.4-FE | Required | Opens drawer |
| useOrders hook | 40.2-FE | Required | Fetch orders |

### External

| Dependency | Package | Version |
|------------|---------|---------|
| react-window | `react-window` | ^1.8.x |
| @types/react-window | `@types/react-window` | ^1.8.x |

### Backend

| Endpoint | Method | Status |
|----------|--------|--------|
| `/v1/orders` | GET | Complete (Epic 40) |
| `/v1/supplies/:id/orders` | POST | Complete (Epic 53) |

---

## Dev Notes

### Source Tree

```
src/
├── app/(dashboard)/supplies/[id]/
│   └── components/
│       ├── OrderPickerDrawer.tsx       # NEW: This story
│       ├── OrderPickerHeader.tsx       # NEW: This story
│       ├── OrderPickerFilters.tsx      # NEW: This story
│       ├── OrderPickerTable.tsx        # NEW: This story
│       ├── OrderPickerRow.tsx          # NEW: This story
│       ├── OrderPickerFooter.tsx       # NEW: This story
│       ├── OrderPickerEmptyState.tsx   # NEW: This story
│       ├── OrderPickerSkeleton.tsx     # NEW: This story
│       └── __tests__/
│           ├── OrderPickerDrawer.test.tsx
│           └── OrderPickerTable.test.tsx
├── hooks/
│   ├── useOrdersForSupply.ts           # NEW: This story
│   ├── useAddOrdersToSupply.ts         # NEW: This story
│   └── useOrderSelection.ts            # NEW: This story
└── types/
    └── supplies.ts                     # Story 53.1-FE
```

### Performance Optimization Tips

1. **Memoize Row Component**: Use `React.memo` to prevent re-renders
2. **Stable Callbacks**: Use `useCallback` for all handlers
3. **Overscan**: Set `overscanCount={5}` for smoother scrolling
4. **Selection State**: Use `Set<string>` for O(1) lookup
5. **Debounce Search**: 300ms delay prevents excessive re-renders

### Design System Adherence

- **Colors**: Use status colors from `order-status-config.ts`
- **Icons**: Lucide only (X, Search, Filter)
- **Checkbox**: Use shadcn/ui Checkbox
- **Badge**: Use shadcn/ui Badge with custom colors
- **Typography**: Standard body text sizes

---

## Tasks Breakdown

| # | Task | Est. Hours | Notes |
|---|------|------------|-------|
| 1 | Install react-window package | 0.5 | npm install |
| 2 | Create useOrderSelection hook | 2 | Selection state logic |
| 3 | Create useOrdersForSupply hook | 1 | Wraps useOrders with filters |
| 4 | Create useAddOrdersToSupply hook | 2 | Mutation with partial success |
| 5 | Create OrderPickerRow component | 1 | Memoized row |
| 6 | Create OrderPickerTable component | 4 | Virtualization core |
| 7 | Create OrderPickerFilters component | 2 | Search + status filter |
| 8 | Create OrderPickerHeader component | 1 | Title + close |
| 9 | Create OrderPickerFooter component | 1 | Add button |
| 10 | Create OrderPickerDrawer container | 3 | Full integration |
| 11 | Create empty/loading states | 1 | UX polish |
| 12 | Accessibility audit | 2 | WCAG compliance |
| 13 | Unit tests | 4 | All components |
| 14 | Performance testing | 2 | 1000+ orders |
| **Total** | | **25.5** | ~3 days |

---

## Related

- **Parent Epic**: [Epic 53-FE: Supply Management UI](../../epics/epic-53-fe-supply-management.md)
- **Dependency**: [Story 53.4-FE: Supply Detail Page](./story-53.4-fe-supply-detail-page.md)
- **Dependency**: [Epic 40-FE: Orders UI](../../epics/epic-40-fe-orders-ui.md)
- **Next Story**: [Story 53.6-FE: Close Supply & Stickers](./story-53.6-fe-close-supply-stickers.md)
- **Backend API**: `test-api/16-supplies.http`

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

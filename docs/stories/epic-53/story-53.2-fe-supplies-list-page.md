# Story 53.2-FE: Supplies List Page

## Story Info

- **Epic**: 53-FE - Supply Management UI
- **Sprint**: 3 (Mar 3-14)
- **Priority**: High
- **Points**: 5 SP
- **Status**: Ready for Dev
- **Dependencies**: Story 53.1-FE (Types & API Client)

---

## User Story

**As a** WB seller managing FBS supplies,
**I want** a dedicated supplies list page with filtering, sorting, and pagination,
**So that** I can quickly find and manage my supplies, and navigate to detailed supply information.

---

## Acceptance Criteria

### AC1: Route & Navigation

- [ ] New route: `/supplies`
- [ ] Add link in sidebar under main navigation section
- [ ] Sidebar item: icon `Package` (Lucide), label "Поставки"
- [ ] Page title: "Поставки FBS"
- [ ] Add to `routes.ts`: `SUPPLIES: '/supplies'`
- [ ] Add to protected routes list

### AC2: Page Header

- [ ] Title: "Поставки FBS" with `Package` icon
- [ ] Subtitle: "Управление поставками и отслеживание статусов"
- [ ] "Создать поставку" button (primary, opens create modal)
- [ ] "Обновить статусы" button (secondary, triggers sync)
- [ ] Sync status indicator: last sync time, rate limit countdown

### AC3: Filters Section

- [ ] Status filter dropdown:
  - Options: Все | Открыта (OPEN) | Закрыта (CLOSED) | В пути (DELIVERING) | Доставлена (DELIVERED) | Отменена (CANCELLED)
- [ ] Date range filter: `from` / `to` (ISO date)
- [ ] Default range: last 30 days
- [ ] Filters sync to URL query params for shareability
- [ ] Clear filters button

### AC4: Supplies Table Columns

- [ ] WB Supply ID (`wbSupplyId`) - monospace font
- [ ] Name (`name`) - truncated 40 chars + tooltip, or "—" if null
- [ ] Status (`status`) - badge with color and icon
- [ ] Orders Count (`ordersCount`) - right-aligned number
- [ ] Total Value (`totalValue`) - formatted as currency (₽)
- [ ] Created (`createdAt`) - formatted "dd.MM.yyyy HH:mm"
- [ ] Closed (`closedAt`) - formatted "dd.MM.yyyy HH:mm" or "—"

### AC5: Table Sorting

- [ ] Sort by: `created_at`, `closed_at`, `orders_count`
- [ ] Default: `created_at` desc (newest first)
- [ ] Visual indicator on sorted column (chevron up/down)
- [ ] Click column header to toggle sort

### AC6: Pagination

- [ ] **Offset-based pagination** (per backend API)
- [ ] Default limit: 20 rows per page
- [ ] Page navigation: "Назад" / "Вперёд" buttons
- [ ] Page indicator: "Стр. X из Y"
- [ ] Total count display: "Всего: N поставок"

### AC7: Table Row Interaction

- [ ] Hover state: subtle background highlight
- [ ] Click row: navigates to `/supplies/[id]` (detail page)
- [ ] Keyboard navigation: Enter/Space to navigate

### AC8: Status Badges

- [ ] `SupplyStatusBadge` component using `SUPPLY_STATUS_CONFIG` from types
- [ ] Display status label in Russian
- [ ] Color-coded background and text
- [ ] Icon prefix (from Lucide)

### AC9: Loading & Error States

- [ ] Loading skeleton: 8 rows with shimmer animation
- [ ] Error state with retry button
- [ ] Empty state: "Нет поставок за выбранный период"
- [ ] Empty state includes "Создать поставку" button

### AC10: Mobile Responsive

- [ ] Horizontal scroll for table on mobile
- [ ] Sticky first column (WB Supply ID) on scroll
- [ ] Min-width per column to prevent squishing
- [ ] Filters collapse to single row with dropdowns

---

## UI Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Поставки FBS                                                   │
│            │                                                                 │
│ Главная    │  <Package/> Поставки FBS     [Обновить статусы]  [+ Создать]   │
│ Заказы     │  Управление поставками и отслеживание статусов                  │
│ Поставки ◀ ├─────────────────────────────────────────────────────────────────┤
│ COGS       │  Статус: [Все ▼]    Период: [01.02.2026] - [02.03.2026]        │
│ Аналитика  │                                                                 │
│ Настройки  │                                       [Очистить фильтры]        │
│            ├─────────────────────────────────────────────────────────────────┤
│            │  ┌────────────┬──────────┬─────────┬────────┬─────────┬────────┐│
│            │  │ WB ID      │ Название │ Статус  │ Заказы │ Сумма   │ Создана││
│            │  ├────────────┼──────────┼─────────┼────────┼─────────┼────────┤│
│            │  │ WB-1234567 │ Партия 1 │●Открыта │     15 │ 45 000₽ │ 01.03  ││
│            │  │ WB-1234566 │ Партия 2 │●Закрыта │     32 │ 98 500₽ │ 28.02  ││
│            │  │ WB-1234565 │ —        │●В пути  │     28 │ 72 300₽ │ 27.02  ││
│            │  │ WB-1234564 │ Партия 3 │●Доставл │     45 │125 000₽ │ 25.02  ││
│            │  └────────────┴──────────┴─────────┴────────┴─────────┴────────┘│
│            │                                                                 │
│            │  Всего: 24 поставки       [← Назад] Стр. 1 из 2 [Вперёд →]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Components to Create

### Pages

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/supplies/page.tsx` | Main supplies page |
| `src/app/(dashboard)/supplies/loading.tsx` | Loading skeleton |

### Components

| File | Purpose | Lines (Est.) |
|------|---------|--------------|
| `src/app/(dashboard)/supplies/components/SuppliesPageHeader.tsx` | Title + action buttons | ~70 |
| `src/app/(dashboard)/supplies/components/SuppliesFilters.tsx` | Status + date filters | ~100 |
| `src/app/(dashboard)/supplies/components/SuppliesTable.tsx` | Data table component | ~120 |
| `src/app/(dashboard)/supplies/components/SuppliesTableRow.tsx` | Single row component | ~80 |
| `src/app/(dashboard)/supplies/components/SuppliesPagination.tsx` | Pagination controls | ~60 |
| `src/app/(dashboard)/supplies/components/SupplyStatusBadge.tsx` | Status badge with icon | ~50 |
| `src/app/(dashboard)/supplies/components/SuppliesEmptyState.tsx` | Empty state display | ~50 |
| `src/app/(dashboard)/supplies/components/SuppliesLoadingSkeleton.tsx` | Loading skeleton | ~40 |
| `src/app/(dashboard)/supplies/components/SyncStatusIndicator.tsx` | Sync status + countdown | ~60 |

### Hooks (Story 53.1-FE provides API, hooks created here)

| File | Purpose | Lines (Est.) |
|------|---------|--------------|
| `src/hooks/useSupplies.ts` | List supplies hook | ~60 |
| `src/hooks/useSyncSupplies.ts` | Sync mutation hook | ~50 |

---

## Page Structure

```
SuppliesPage
├── SuppliesPageHeader
│   ├── Title with Package icon
│   ├── CreateSupplyButton (opens modal - Story 53.3)
│   ├── SyncButton (triggers POST /v1/supplies/sync)
│   └── SyncStatusIndicator
├── SuppliesFilters
│   ├── StatusSelect
│   ├── DateRangePicker (from/to)
│   └── ClearFiltersButton
├── SuppliesTable
│   ├── TableHeader (sortable columns)
│   └── SuppliesTableRow[] (mapped from data)
│       └── SupplyStatusBadge
├── SuppliesPagination
│   ├── TotalCount
│   ├── PageIndicator
│   └── NavButtons
└── SuppliesEmptyState (conditional)
```

---

## Technical Details

### Filter URL Params

```
/supplies?status=OPEN&from=2026-02-01&to=2026-03-02&sort_by=created_at&sort_order=desc&limit=20&offset=0
```

### API Endpoint Used

```
GET /v1/supplies?status={status}&from={date}&to={date}&sort_by={field}&sort_order={asc|desc}&limit={n}&offset={n}
```

**Response structure** (from Story 53.1-FE):
```typescript
{
  items: SupplyListItem[]
  pagination: { total: number; limit: number; offset: number }
  filters: { status: SupplyStatus | null; from: string | null; to: string | null }
}
```

### State Management Pattern

```typescript
// page.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSupplies } from '@/hooks/useSupplies'
import type { SupplyStatus, SuppliesSortField, SortOrder } from '@/types/supplies'

const PAGE_SIZE = 20

export default function SuppliesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Parse URL params
  const status = (searchParams.get('status') as SupplyStatus) || undefined
  const from = searchParams.get('from') || getDefaultFrom()
  const to = searchParams.get('to') || getDefaultTo()
  const sortBy = (searchParams.get('sort_by') as SuppliesSortField) || 'created_at'
  const sortOrder = (searchParams.get('sort_order') as SortOrder) || 'desc'
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const { data, isLoading, error, refetch } = useSupplies({
    status,
    from,
    to,
    sort_by: sortBy,
    sort_order: sortOrder,
    limit: PAGE_SIZE,
    offset,
  })

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    router.push(`/supplies?${params.toString()}`)
  }

  // ... render
}
```

### Column Definitions

```typescript
const columns = [
  { key: 'wbSupplyId', label: 'WB ID', sortable: false, width: '130px' },
  { key: 'name', label: 'Название', sortable: false, width: '180px' },
  { key: 'status', label: 'Статус', sortable: false, width: '120px' },
  { key: 'ordersCount', label: 'Заказы', sortable: true, width: '90px', align: 'right' },
  { key: 'totalValue', label: 'Сумма', sortable: false, width: '110px', align: 'right' },
  { key: 'createdAt', label: 'Создана', sortable: true, width: '120px' },
  { key: 'closedAt', label: 'Закрыта', sortable: true, width: '120px' },
]
```

### useSupplies Hook

```typescript
// src/hooks/useSupplies.ts
import { useQuery } from '@tanstack/react-query'
import { getSupplies, suppliesQueryKeys } from '@/lib/api/supplies'
import type { SuppliesListParams } from '@/types/supplies'

export function useSupplies(params: SuppliesListParams) {
  return useQuery({
    queryKey: suppliesQueryKeys.list(params),
    queryFn: () => getSupplies(params),
    staleTime: 30000, // 30s
  })
}
```

### useSyncSupplies Hook

```typescript
// src/hooks/useSyncSupplies.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { syncSupplies, suppliesQueryKeys } from '@/lib/api/supplies'
import { toast } from 'sonner'

export function useSyncSupplies() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: syncSupplies,
    onSuccess: (data) => {
      // Invalidate supplies list to refresh statuses
      queryClient.invalidateQueries({ queryKey: suppliesQueryKeys.all })

      if (data.statusChanges.length > 0) {
        toast.success(`Синхронизировано ${data.syncedCount} поставок, ${data.statusChanges.length} изменений статуса`)
      } else {
        toast.info('Статусы поставок актуальны')
      }
    },
    onError: (error) => {
      if (error.message.includes('429')) {
        toast.error('Слишком частые запросы. Подождите 5 минут.')
      } else {
        toast.error('Ошибка синхронизации')
      }
    },
  })
}
```

### Status Badge Component

```typescript
// SupplyStatusBadge.tsx
import { Badge } from '@/components/ui/badge'
import {
  PackageOpen,
  PackageCheck,
  Truck,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSupplyStatusConfig, type SupplyStatus } from '@/types/supplies'

const ICONS = {
  PackageOpen,
  PackageCheck,
  Truck,
  CheckCircle,
  XCircle,
}

interface SupplyStatusBadgeProps {
  status: SupplyStatus
  className?: string
}

export function SupplyStatusBadge({ status, className }: SupplyStatusBadgeProps) {
  const config = getSupplyStatusConfig(status)
  const Icon = ICONS[config.icon as keyof typeof ICONS]

  return (
    <Badge
      variant="outline"
      className={cn(config.bgColor, config.color, 'gap-1.5', className)}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </Badge>
  )
}
```

### Sync Status Indicator

```typescript
// SyncStatusIndicator.tsx
import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface SyncStatusIndicatorProps {
  lastSyncAt: string | null
  nextSyncAt: string | null
  isLoading: boolean
}

export function SyncStatusIndicator({
  lastSyncAt,
  nextSyncAt,
  isLoading,
}: SyncStatusIndicatorProps) {
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    if (!nextSyncAt) return

    const updateCountdown = () => {
      const remaining = new Date(nextSyncAt).getTime() - Date.now()
      if (remaining <= 0) {
        setCountdown('')
        return
      }
      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [nextSyncAt])

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
      {lastSyncAt ? (
        <span>
          Синхр: {formatDistanceToNow(new Date(lastSyncAt), { locale: ru, addSuffix: true })}
        </span>
      ) : (
        <span>Не синхронизировано</span>
      )}
      {countdown && (
        <span className="text-xs text-muted-foreground">
          (след. через {countdown})
        </span>
      )}
    </div>
  )
}
```

---

## Dev Notes

### Sidebar Integration

Update `src/components/layout/` or sidebar config:

```tsx
{
  title: 'Поставки',
  href: '/supplies',
  icon: Package,
}
```

Place after "Заказы" (Orders) and before "COGS" section.

### Routes.ts Update

```typescript
// src/lib/routes.ts
export const ROUTES = {
  // ... existing
  SUPPLIES: {
    LIST: '/supplies',
    DETAIL: (id: string) => `/supplies/${id}`,
  },
}
```

### Date Range Default (30 days)

```typescript
import { subDays, format } from 'date-fns'

const getDefaultFrom = () => format(subDays(new Date(), 30), 'yyyy-MM-dd')
const getDefaultTo = () => format(new Date(), 'yyyy-MM-dd')
```

### Row Click Navigation

```typescript
const router = useRouter()

const handleRowClick = (supplyId: string) => {
  router.push(`/supplies/${supplyId}`)
}
```

---

## Testing

### Test Cases

- [ ] Page renders without errors
- [ ] Route `/supplies` is accessible
- [ ] Sidebar link navigates correctly
- [ ] Status filter updates query params and refetches
- [ ] Date range filter works
- [ ] Sorting works for sortable columns
- [ ] Pagination buttons work correctly
- [ ] Row click navigates to detail page
- [ ] "Создать поставку" button exists (opens modal in 53.3)
- [ ] "Обновить статусы" button triggers sync mutation
- [ ] Loading skeleton displays during fetch
- [ ] Error state shows with retry button
- [ ] Empty state displays when no data
- [ ] Filters persist in URL on page refresh
- [ ] Mobile horizontal scroll works
- [ ] Keyboard navigation (Enter navigates to detail)

### Accessibility Tests

- [ ] All filters have proper labels
- [ ] Sort buttons have aria-label
- [ ] Table has proper semantic structure (`<th scope="col">`)
- [ ] Focus management for row navigation
- [ ] Screen reader announces sort changes
- [ ] Status badges have proper color contrast (WCAG 2.1 AA)

---

## Definition of Done

- [ ] Route accessible at `/supplies`
- [ ] Sidebar link added with Package icon
- [ ] Page header with title and action buttons
- [ ] Status filter functional
- [ ] Date range filter functional
- [ ] Filters sync to URL query params
- [ ] Table displays all required columns
- [ ] Sorting works for sortable columns
- [ ] Pagination works with offset-based navigation
- [ ] Row click navigates to `/supplies/[id]`
- [ ] Status badges render with correct colors and icons
- [ ] Sync button triggers mutation with toast feedback
- [ ] Rate limit handling for sync (429 error)
- [ ] Loading skeleton displays
- [ ] Error state with retry button
- [ ] Empty state with helpful message
- [ ] Mobile responsive with horizontal scroll
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] All files <200 lines
- [ ] Routes.ts updated
- [ ] Sidebar updated

---

## Dependencies

### Required (Blocking)

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 53.1-FE | 📋 Ready | Types & API Client |
| `src/lib/api-client.ts` | ✅ Exists | Centralized API client |
| shadcn/ui components | ✅ Exists | Table, Select, Button, Badge |

### Non-Blocking

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 53.3-FE | Pending | Create Supply Modal (button prepared) |
| Story 53.4-FE | Pending | Supply Detail Page (row click navigates) |

---

## Related Files

- `src/lib/routes.ts` - Add SUPPLIES routes
- `src/lib/utils.ts` - formatCurrency, formatDate utilities
- `src/types/supplies.ts` - Supply types (from 53.1-FE)
- `src/lib/api/supplies.ts` - API client (from 53.1-FE)
- `src/components/ui/*` - shadcn/ui base components
- `src/app/(dashboard)/orders/` - Similar list page pattern

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-29 | Claude Code (PM Agent) | Initial story creation from Epic 53-FE spec |

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

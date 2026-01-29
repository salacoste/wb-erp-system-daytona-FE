# Story 40.3-FE: Orders List Page

## Story Info

- **Epic**: 40-FE - Orders UI & WB Native Status History
- **Priority**: High
- **Points**: 5
- **Status**: ✅ Complete
- **Sprint**: 1 (Feb 3-14, 2026)

## User Story

**As a** WB seller with FBS orders,
**I want** a dedicated orders list page with filtering, sorting, and pagination,
**So that** I can quickly find and review orders, and navigate to detailed order information.

## Acceptance Criteria

### AC1: Route & Navigation
- [ ] New route: `/orders`
- [ ] Add link in sidebar under main navigation section
- [ ] Sidebar item: icon `Package` (Lucide), label "Заказы"
- [ ] Page title: "Заказы FBS"
- [ ] Add to `routes.ts`: `ORDERS: '/orders'`
- [ ] Add to protected routes list

### AC2: Page Header
- [ ] Title: "Заказы FBS" with `Package` icon
- [ ] Subtitle: "Управление заказами и отслеживание статусов"
- [ ] "Обновить" button (triggers manual sync via `POST /v1/orders/sync`)
- [ ] Sync status indicator (shows last sync time from `GET /v1/orders/sync-status`)

### AC3: Filters Section
- [ ] Date range filter: `from` / `to` (ISO date)
- [ ] Default range: last 7 days
- [ ] Supplier status filter dropdown:
  - Options: Все | Новый (new) | Подтверждён (confirm) | Выполнен (complete) | Отменён (cancel)
- [ ] WB status filter dropdown:
  - Options: Все | Ожидает (waiting) | Отсортирован (sorted) | Продан (sold) | Отменён (canceled)
- [ ] Search by SKU (nmId): text input with debounce (500ms)
- [ ] Filters sync to URL query params for shareability
- [ ] Clear filters button

### AC4: Orders Table Columns
- [ ] Order ID (`orderId`) - clickable, opens detail modal
- [ ] Product Info:
  - nm_id (SKU) as link to `/cogs?search={nmId}`
  - vendorCode (Артикул поставщика)
  - productName (truncated 40 chars + tooltip)
- [ ] Price columns:
  - Цена (`price`) - original price, ₽
  - Цена продажи (`salePrice`) - after discount, ₽
- [ ] Status columns:
  - Статус продавца (`supplierStatus`) - badge
  - Статус WB (`wbStatus`) - badge
- [ ] Dates:
  - Создан (`createdAt`) - formatted "dd.MM.yyyy HH:mm"
  - Обновлён (`statusUpdatedAt`) - formatted "dd.MM.yyyy HH:mm"
- [ ] Warehouse (`warehouseId`) - optional, show if space

### AC5: Table Sorting
- [ ] Sort by: `created_at`, `status_updated_at`, `price`, `sale_price`
- [ ] Default: `created_at` desc (newest first)
- [ ] Visual indicator on sorted column (chevron up/down)
- [ ] Click column header to toggle sort

### AC6: Pagination
- [ ] **Offset-based pagination** (per backend API)
- [ ] Default limit: 25 rows per page
- [ ] Page navigation: "Назад" / "Вперёд" buttons
- [ ] Page indicator: "Стр. X из Y"
- [ ] Total count display: "Всего: N заказов"

### AC7: Table Row Interaction
- [ ] Hover state: subtle background highlight
- [ ] Click row: opens `OrderDetailsModal` (Story 40.4-FE)
- [ ] Keyboard navigation: Enter/Space to open modal

### AC8: Status Badges
- [ ] `OrderStatusBadge` component for supplier status:
  - `new` → yellow "Новый"
  - `confirm` → blue "Подтверждён"
  - `complete` → green "Выполнен"
  - `cancel` → red "Отменён"
- [ ] Reuse `getWbStatusConfig()` from `wb-status-mapping.ts` for WB status badge

### AC9: Loading & Error States
- [ ] Loading skeleton: 10 rows with shimmer animation
- [ ] Error state with retry button
- [ ] Empty state: "Нет заказов за выбранный период"
- [ ] Empty state includes suggestion to change filters

### AC10: Mobile Responsive
- [ ] Horizontal scroll for table on mobile
- [ ] Sticky first column (Order ID) on scroll
- [ ] Min-width per column to prevent squishing
- [ ] Filters collapse to single row with dropdowns

## UI Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Заказы FBS                                                    │
│            │                                                                 │
│ Главная    │  <Package/> Заказы FBS              [Обновить]  Синхр: 10:30  │
│ Заказы ◀   │  Управление заказами и отслеживание статусов                   │
│ COGS       ├─────────────────────────────────────────────────────────────────┤
│ Аналитика  │  Период: [01.02.2026] - [08.02.2026]    [Очистить фильтры]     │
│ Настройки  │                                                                 │
│            │  Статус продавца: [Все ▼]    Статус WB: [Все ▼]                │
│            │                                                                 │
│            │  Поиск по SKU: [________________]                               │
│            ├─────────────────────────────────────────────────────────────────┤
│            │  ┌────────┬──────────────────────┬────────┬─────────┬─────────┐│
│            │  │ ID ▼   │ Товар                │ Цена   │ Статус  │ Дата    ││
│            │  ├────────┼──────────────────────┼────────┼─────────┼─────────┤│
│            │  │ 123456 │ SKU-001              │ 1 500₽ │ ● Новый │ 08.02   ││
│            │  │        │ Артикул: ABC-123     │ 1 200₽ │ Ожидает │ 10:30   ││
│            │  │        │ Название товара...   │        │         │         ││
│            │  ├────────┼──────────────────────┼────────┼─────────┼─────────┤│
│            │  │ 123457 │ SKU-002              │ 2 000₽ │ ● Готов │ 07.02   ││
│            │  │        │ Артикул: DEF-456     │ 1 800₽ │ Продан  │ 15:45   ││
│            │  │        │ Другой товар назв... │        │         │         ││
│            │  └────────┴──────────────────────┴────────┴─────────┴─────────┘│
│            │                                                                 │
│            │  Всего: 150 заказов        [← Назад] Стр. 1 из 6 [Вперёд →]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components to Create

### Pages
| File | Purpose |
|------|---------|
| `src/app/(dashboard)/orders/page.tsx` | Main orders page |
| `src/app/(dashboard)/orders/loading.tsx` | Loading skeleton |

### Components
| File | Purpose | Lines |
|------|---------|-------|
| `src/app/(dashboard)/orders/components/OrdersPageHeader.tsx` | Title + sync button | ~60 |
| `src/app/(dashboard)/orders/components/OrdersFilters.tsx` | Date range + status filters | ~120 |
| `src/app/(dashboard)/orders/components/OrdersTable.tsx` | Data table component | ~150 |
| `src/app/(dashboard)/orders/components/OrdersTableRow.tsx` | Single row component | ~80 |
| `src/app/(dashboard)/orders/components/OrdersPagination.tsx` | Pagination controls | ~60 |
| `src/app/(dashboard)/orders/components/OrderStatusBadge.tsx` | Supplier status badge | ~50 |
| `src/app/(dashboard)/orders/components/OrdersEmptyState.tsx` | Empty state display | ~40 |

## Page Structure

```
OrdersPage
├── OrdersPageHeader
│   ├── Title with Package icon
│   ├── SyncButton (triggers POST /v1/orders/sync)
│   └── SyncStatusIndicator
├── OrdersFilters
│   ├── DateRangePicker (from/to)
│   ├── SupplierStatusSelect
│   ├── WbStatusSelect
│   ├── SearchInput (nmId)
│   └── ClearFiltersButton
├── OrdersTable
│   ├── TableHeader (sortable columns)
│   └── OrdersTableRow[] (mapped from data)
│       ├── OrderStatusBadge (supplier)
│       └── WbStatusBadge (from wb-status-mapping.ts)
├── OrdersPagination
│   ├── TotalCount
│   ├── PageIndicator
│   └── NavButtons
└── OrdersEmptyState (conditional)
```

## Technical Details

### Filter URL Params
```
/orders?from=2026-02-01&to=2026-02-08&supplier_status=new&wb_status=waiting&nm_id=12345&sort_by=created_at&sort_order=desc&limit=25&offset=0
```

### API Endpoint Used
```
GET /v1/orders?from={date}&to={date}&supplier_status={status}&wb_status={status}&nm_id={number}&sort_by={field}&sort_order={asc|desc}&limit={n}&offset={n}
```

**Response structure** (from `14-orders.http`):
```typescript
{
  items: OrderItem[]
  pagination: { total: number; limit: number; offset: number }
  query: { from: string | null; to: string | null }
}
```

### State Management Pattern
```typescript
// page.tsx
const [dateRange, setDateRange] = useState({ from, to })
const [supplierStatus, setSupplierStatus] = useState<SupplierStatus | null>(null)
const [wbStatus, setWbStatus] = useState<WbStatus | null>(null)
const [searchNmId, setSearchNmId] = useState('')
const [sortBy, setSortBy] = useState<SortField>('created_at')
const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
const [page, setPage] = useState(1)

// Use hook from Story 40.2-FE
const { data, isLoading, error, refetch } = useOrders({
  from: dateRange.from,
  to: dateRange.to,
  supplier_status: supplierStatus,
  wb_status: wbStatus,
  nm_id: searchNmId ? parseInt(searchNmId) : undefined,
  sort_by: sortBy,
  sort_order: sortOrder,
  limit: PAGE_SIZE,
  offset: (page - 1) * PAGE_SIZE,
})
```

### Column Definitions
```typescript
const columns = [
  { key: 'orderId', label: 'ID заказа', sortable: false, width: '100px' },
  { key: 'product', label: 'Товар', sortable: false, width: '280px' },
  { key: 'price', label: 'Цена', sortable: true, width: '90px' },
  { key: 'salePrice', label: 'Цена продажи', sortable: true, width: '100px' },
  { key: 'supplierStatus', label: 'Статус', sortable: false, width: '120px' },
  { key: 'wbStatus', label: 'Статус WB', sortable: false, width: '130px' },
  { key: 'createdAt', label: 'Создан', sortable: true, width: '120px' },
  { key: 'statusUpdatedAt', label: 'Обновлён', sortable: true, width: '120px' },
]
```

### Supplier Status Badge Config
```typescript
const SUPPLIER_STATUS_CONFIG = {
  new: { label: 'Новый', color: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  confirm: { label: 'Подтверждён', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  complete: { label: 'Выполнен', color: 'text-green-700', bgColor: 'bg-green-50' },
  cancel: { label: 'Отменён', color: 'text-red-700', bgColor: 'bg-red-50' },
}
```

## Dev Notes

### Sidebar Integration
Update `src/components/layout/` or sidebar config:
```tsx
{
  title: 'Заказы',
  href: '/orders',
  icon: Package,
}
```

Place after "Главная" (Dashboard) and before "COGS" section.

### Date Range Default
```typescript
import { subDays, format } from 'date-fns'

const defaultFrom = format(subDays(new Date(), 7), 'yyyy-MM-dd')
const defaultTo = format(new Date(), 'yyyy-MM-dd')
```

### Search Debounce Pattern
```typescript
const [searchInput, setSearchInput] = useState('')
const [search, setSearch] = useState('')

useEffect(() => {
  const delay = setTimeout(() => setSearch(searchInput), 500)
  return () => clearTimeout(delay)
}, [searchInput])
```

### Click Row Handler
```typescript
const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

const handleRowClick = (orderId: string) => {
  setSelectedOrderId(orderId)
}

// Modal opens when selectedOrderId is set
// (OrderDetailsModal from Story 40.4-FE)
```

## Testing

### Test Cases
- [ ] Page renders without errors
- [ ] Route `/orders` is accessible
- [ ] Sidebar link navigates correctly
- [ ] Date range filter updates query params
- [ ] Supplier status filter works
- [ ] WB status filter works
- [ ] Search by nmId works with debounce
- [ ] Sorting works for sortable columns
- [ ] Pagination buttons work correctly
- [ ] Row click triggers modal open callback
- [ ] Loading skeleton displays during fetch
- [ ] Error state shows with retry button
- [ ] Empty state displays when no data
- [ ] Filters persist in URL on page refresh
- [ ] Mobile horizontal scroll works
- [ ] Keyboard navigation (Enter/Space opens modal)

### Accessibility Tests
- [ ] All filters have proper labels
- [ ] Sort buttons have aria-label
- [ ] Table has proper semantic structure (`<th scope="col">`)
- [ ] Focus management for modal trigger
- [ ] Screen reader announces sort changes

## Definition of Done

- [ ] Route accessible at `/orders`
- [ ] Sidebar link added with Package icon
- [ ] Page header with title and sync button
- [ ] All filters functional (date, supplier status, WB status, search)
- [ ] Filters sync to URL query params
- [ ] Table displays all required columns
- [ ] Sorting works for sortable columns
- [ ] Pagination works with offset-based navigation
- [ ] Row click ready for modal integration (Story 40.4-FE)
- [ ] Status badges render with correct colors
- [ ] Loading skeleton displays
- [ ] Error state with retry button
- [ ] Empty state with helpful message
- [ ] Mobile responsive with horizontal scroll
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] All files <200 lines
- [ ] Routes.ts updated
- [ ] Sidebar updated

## Dependencies

- **Story 40.1-FE**: Types & API Client (provides `Order`, `OrderItem` types)
- **Story 40.2-FE**: React Query Hooks (provides `useOrders`, `useTriggerOrdersSync`)
- **Existing**: `wb-status-mapping.ts` (for WB status badges)
- **Existing**: shadcn/ui components (Table, Select, Input, Button, Badge)

## Related Files

- `src/lib/wb-status-mapping.ts` - WB status configuration (reuse for badges)
- `src/lib/routes.ts` - Add ORDERS route
- `src/lib/utils.ts` - formatCurrency, formatDate utilities
- `src/components/ui/*` - shadcn/ui base components

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-29 | PM (Claude) | Initial story creation from Epic 40-FE spec |

---

## Dev Agent Record

```
Status: Ready for Dev
Agent:
Started:
Completed:
Notes:
```

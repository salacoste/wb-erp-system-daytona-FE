# Story 53.4-FE: Supply Detail Page

## Story Info

- **Epic**: 53-FE - Supply Management UI
- **Sprint**: 3 (Mar 3-14, 2026)
- **Priority**: High
- **Points**: 5
- **Status**: Ready for Dev

## User Story

**As a** WB seller managing FBS supplies,
**I want** a detailed view of my supply showing status, orders, and available actions,
**So that** I can manage the supply lifecycle from creation through delivery.

## Background

The Supply Detail Page is the central hub for managing a single supply. It shows:

1. **Header**: Supply name, status badge, creation date, orders count
2. **Status Stepper**: Visual progress through lifecycle (OPEN -> CLOSED -> DELIVERING -> DELIVERED)
3. **Orders Table**: List of orders in the supply with remove capability (OPEN only)
4. **Documents List**: Generated stickers and documents with download links (CLOSED+)
5. **Actions**: Context-aware buttons based on current status

The page dynamically adjusts its UI based on the supply status, enabling or disabling actions accordingly.

---

## Acceptance Criteria

### AC1: Dynamic Route

- [ ] Route: `/supplies/[id]` (Next.js dynamic route)
- [ ] Page file: `src/app/(dashboard)/supplies/[id]/page.tsx`
- [ ] Extract `id` from route params
- [ ] Fetch supply details using `useSupplyDetail(id)` hook
- [ ] Show loading skeleton while fetching
- [ ] Handle 404: "Поставка не найдена"

### AC2: Back Navigation

- [ ] "Назад к списку" link at top of page
- [ ] Link navigates to `/supplies`
- [ ] Uses `ArrowLeft` icon from Lucide
- [ ] Browser back button also works

### AC3: SupplyHeader Component

- [ ] Display supply name prominently (h1)
- [ ] Display status badge using `SupplyStatusBadge` (Story 53.2-FE)
- [ ] Display creation date: "Создана: DD.MM.YYYY HH:mm"
- [ ] Display orders count: "Заказов: N"
- [ ] Display last updated: "Обновлена: DD.MM.YYYY HH:mm"
- [ ] Action buttons section (right side, desktop) or below (mobile)

### AC4: SupplyStatusStepper Component

- [ ] Visual horizontal stepper showing lifecycle states
- [ ] Steps: OPEN -> CLOSED -> DELIVERING -> DELIVERED
- [ ] Current status highlighted
- [ ] Completed steps shown with checkmark
- [ ] Future steps shown as outlined/gray
- [ ] CANCELLED shows special state (red, crossed out)
- [ ] Step labels in Russian:
  - OPEN: "Открыта"
  - CLOSED: "Закрыта"
  - DELIVERING: "В пути"
  - DELIVERED: "Доставлена"
  - CANCELLED: "Отменена"

### AC5: Status-Based UI Configuration

| Status | Color | Icon | Badge Style | Available Actions |
|--------|-------|------|-------------|-------------------|
| OPEN | Blue `#3B82F6` | `PackageOpen` | Blue bg/text | Add orders, Remove orders, Close supply |
| CLOSED | Orange `#F59E0B` | `PackageCheck` | Orange bg/text | Generate stickers, Download docs |
| DELIVERING | Purple `#7C4DFF` | `Truck` | Purple bg/text | View only |
| DELIVERED | Green `#22C55E` | `CheckCircle` | Green bg/text | View only |
| CANCELLED | Red `#EF4444` | `XCircle` | Red bg/text | View only |

### AC6: SupplyOrdersTable Component

- [ ] Table showing orders currently in the supply
- [ ] Columns:
  - Order ID (`orderId`) - clickable, navigates to `/orders?search={orderId}`
  - Product (nm_id, vendorCode, truncated name)
  - Price (`salePrice`)
  - Supplier Status (badge)
  - Added At (when added to supply)
- [ ] If OPEN status: show "Удалить" action per row
- [ ] Remove action triggers confirmation dialog
- [ ] After remove: optimistic update, toast notification
- [ ] If no orders: empty state "В поставке пока нет заказов"
- [ ] Pagination if >25 orders

### AC7: SupplyDocumentsList Component

- [ ] List of available documents for download
- [ ] Only shown when status is CLOSED, DELIVERING, or DELIVERED
- [ ] Document types:
  - Stickers (PNG/SVG/ZPL based on what was generated)
  - Supply acceptance act (if available)
  - Barcode list (if available)
- [ ] Each document row shows:
  - Document name
  - Format
  - File size (if available)
  - Download button
- [ ] Download triggers file download via `GET /v1/supplies/{id}/documents/{type}`
- [ ] If no documents: "Документы ещё не сгенерированы"

### AC8: Action Buttons (OPEN Status)

- [ ] "Добавить заказы" button (primary)
  - Opens OrderPickerDrawer (Story 53.5-FE)
- [ ] "Закрыть поставку" button (secondary/warning)
  - Opens CloseSupplyDialog (Story 53.6-FE)
  - Disabled if supply has 0 orders
  - Tooltip on disabled: "Добавьте хотя бы один заказ"

### AC9: Action Buttons (CLOSED Status)

- [ ] "Сгенерировать стикеры" button (primary)
  - Opens StickerFormatSelector (Story 53.6-FE)
- [ ] Download buttons for each generated document
- [ ] "Обновить статус" button (secondary)
  - Triggers manual sync

### AC10: Action Buttons (DELIVERING/DELIVERED/CANCELLED)

- [ ] No action buttons (view-only mode)
- [ ] Show informational message based on status:
  - DELIVERING: "Поставка в пути к складу WB"
  - DELIVERED: "Поставка успешно доставлена"
  - CANCELLED: "Поставка была отменена"

### AC11: Loading States

- [ ] Page skeleton while supply loads
- [ ] Orders table skeleton while orders load
- [ ] Documents list skeleton while loading
- [ ] Skeleton matches final layout structure

### AC12: Error States

- [ ] 404: Full page error "Поставка не найдена" with back link
- [ ] 403: "Нет доступа к этой поставке"
- [ ] Network error: Retry button
- [ ] Error loading orders: Inline error with retry

### AC13: Mobile Responsive

- [ ] Stepper becomes vertical on mobile (<640px)
- [ ] Header stacks vertically on mobile
- [ ] Orders table horizontally scrollable
- [ ] Action buttons full-width on mobile
- [ ] Touch-friendly tap targets (44px min)

### AC14: Accessibility (WCAG 2.1 AA)

- [ ] Page has proper heading hierarchy (h1 > h2)
- [ ] Status stepper has `role="navigation"` with aria-label
- [ ] Current step announced via aria-current
- [ ] All buttons have accessible labels
- [ ] Table has proper semantic structure
- [ ] Color contrast meets 4.5:1 ratio

---

## UI Wireframe

### Desktop View

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar] │  ← Назад к списку                                                   │
│           │                                                                      │
│ Главная   │  Поставка на Коледино                            [Добавить заказы]  │
│ Заказы    │  ● ОТКРЫТА   Заказов: 5   Создана: 05.03.2026 10:30               │
│ Поставки◀ │                                                 [Закрыть поставку]  │
│ COGS      ├──────────────────────────────────────────────────────────────────────┤
│ Аналитика │                                                                      │
│           │  ┌──────────────────────────────────────────────────────────────┐   │
│           │  │  ●────────────○────────────○────────────○                    │   │
│           │  │ Открыта    Закрыта     В пути      Доставлена               │   │
│           │  └──────────────────────────────────────────────────────────────┘   │
│           │                                                                      │
│           │  Заказы в поставке (5)                                              │
│           │  ┌──────────┬────────────────────────┬────────┬──────────┬───────┐ │
│           │  │ ID       │ Товар                  │ Цена   │ Статус   │       │ │
│           │  ├──────────┼────────────────────────┼────────┼──────────┼───────┤ │
│           │  │ 12345678 │ SKU-001 Артикул: ABC   │ 1 500₽ │ ● Готов  │ [X]   │ │
│           │  │          │ Название товара...     │        │          │       │ │
│           │  ├──────────┼────────────────────────┼────────┼──────────┼───────┤ │
│           │  │ 12345679 │ SKU-002 Артикул: DEF   │ 2 000₽ │ ● Готов  │ [X]   │ │
│           │  │          │ Другой товар...        │        │          │       │ │
│           │  └──────────┴────────────────────────┴────────┴──────────┴───────┘ │
│           │                                                                      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Status Stepper Visual States

```
OPEN status:
●────────────○────────────○────────────○
Открыта    Закрыта     В пути      Доставлена
(blue)     (gray)      (gray)      (gray)

CLOSED status:
✓────────────●────────────○────────────○
Открыта    Закрыта     В пути      Доставлена
(green)    (orange)    (gray)      (gray)

DELIVERING status:
✓────────────✓────────────●────────────○
Открыта    Закрыта     В пути      Доставлена
(green)    (green)     (purple)    (gray)

DELIVERED status:
✓────────────✓────────────✓────────────●
Открыта    Закрыта     В пути      Доставлена
(green)    (green)     (green)     (green)

CANCELLED status:
✗ Отменена
(red, special display - not in stepper)
```

### Documents List (CLOSED+)

```
┌─────────────────────────────────────────────────────────────────┐
│  Документы                                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 📄 Стикеры (PNG)           1.2 MB          [Скачать]      │  │
│  │ 📄 Стикеры (SVG)           856 KB          [Скачать]      │  │
│  │ 📄 Акт приёмки             124 KB          [Скачать]      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components to Create

### Pages

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/supplies/[id]/page.tsx` | Main detail page |
| `src/app/(dashboard)/supplies/[id]/loading.tsx` | Loading skeleton |
| `src/app/(dashboard)/supplies/[id]/not-found.tsx` | 404 page |

### Components

| File | Purpose | Lines Est. |
|------|---------|------------|
| `src/app/(dashboard)/supplies/[id]/components/SupplyHeader.tsx` | Header with name, status, actions | ~100 |
| `src/app/(dashboard)/supplies/[id]/components/SupplyStatusStepper.tsx` | Visual lifecycle progress | ~120 |
| `src/app/(dashboard)/supplies/[id]/components/SupplyOrdersTable.tsx` | Orders list with remove action | ~150 |
| `src/app/(dashboard)/supplies/[id]/components/SupplyOrderRow.tsx` | Single order row | ~60 |
| `src/app/(dashboard)/supplies/[id]/components/SupplyDocumentsList.tsx` | Documents download list | ~80 |
| `src/app/(dashboard)/supplies/[id]/components/RemoveOrderDialog.tsx` | Confirmation for remove | ~50 |
| `src/app/(dashboard)/supplies/[id]/components/SupplyDetailSkeleton.tsx` | Loading skeleton | ~60 |

### Hooks

| Hook | File Path | Purpose |
|------|-----------|---------|
| `useSupplyDetail` | `src/hooks/useSupplyDetail.ts` | Fetch single supply |
| `useRemoveOrders` | `src/hooks/useRemoveOrders.ts` | Remove orders mutation |
| `useDownloadDocument` | `src/hooks/useDownloadDocument.ts` | Download document |

---

## API Integration

### Get Supply Detail

```typescript
GET /v1/supplies/{id}
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}

Response:
{
  "data": {
    "id": "sup_123abc",
    "name": "Поставка на Коледино",
    "status": "OPEN",
    "ordersCount": 5,
    "createdAt": "2026-03-05T10:30:00Z",
    "updatedAt": "2026-03-05T10:35:00Z",
    "closedAt": null,
    "deliveredAt": null,
    "orders": [
      {
        "orderId": "12345678",
        "nmId": 123456,
        "vendorCode": "ABC-001",
        "productName": "Товар номер один",
        "salePrice": 1500,
        "supplierStatus": "complete",
        "addedAt": "2026-03-05T10:32:00Z"
      }
    ],
    "documents": []
  }
}
```

### Remove Orders from Supply

```typescript
DELETE /v1/supplies/{id}/orders
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
Content-Type: application/json

Request:
{
  "orderIds": ["12345678", "12345679"]
}

Response (200):
{
  "data": {
    "removed": ["12345678", "12345679"],
    "failed": []
  }
}
```

### Download Document

```typescript
GET /v1/supplies/{id}/documents/{type}
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}

Response: Binary file (application/octet-stream or appropriate MIME type)
```

---

## Technical Implementation

### Page Component

```typescript
// src/app/(dashboard)/supplies/[id]/page.tsx
import { notFound } from 'next/navigation'
import { SupplyHeader } from './components/SupplyHeader'
import { SupplyStatusStepper } from './components/SupplyStatusStepper'
import { SupplyOrdersTable } from './components/SupplyOrdersTable'
import { SupplyDocumentsList } from './components/SupplyDocumentsList'

interface PageProps {
  params: { id: string }
}

export default function SupplyDetailPage({ params }: PageProps) {
  return (
    <SupplyDetailContent supplyId={params.id} />
  )
}

// Client component for data fetching
'use client'
function SupplyDetailContent({ supplyId }: { supplyId: string }) {
  const { data: supply, isLoading, error } = useSupplyDetail(supplyId)

  if (isLoading) return <SupplyDetailSkeleton />
  if (error?.status === 404) return notFound()
  if (error) return <SupplyDetailError error={error} />
  if (!supply) return notFound()

  return (
    <div className="space-y-6">
      <BackLink />
      <SupplyHeader supply={supply} />
      <SupplyStatusStepper status={supply.status} />
      <SupplyOrdersTable
        orders={supply.orders}
        supplyId={supply.id}
        status={supply.status}
      />
      {['CLOSED', 'DELIVERING', 'DELIVERED'].includes(supply.status) && (
        <SupplyDocumentsList
          supplyId={supply.id}
          documents={supply.documents}
        />
      )}
    </div>
  )
}
```

### Status Stepper Implementation

```typescript
// src/app/(dashboard)/supplies/[id]/components/SupplyStatusStepper.tsx
import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SupplyStatus } from '@/types/supplies'

const STEPS = [
  { status: 'OPEN', label: 'Открыта' },
  { status: 'CLOSED', label: 'Закрыта' },
  { status: 'DELIVERING', label: 'В пути' },
  { status: 'DELIVERED', label: 'Доставлена' },
] as const

const STATUS_ORDER: Record<SupplyStatus, number> = {
  OPEN: 0,
  CLOSED: 1,
  DELIVERING: 2,
  DELIVERED: 3,
  CANCELLED: -1,
}

interface SupplyStatusStepperProps {
  status: SupplyStatus
}

export function SupplyStatusStepper({ status }: SupplyStatusStepperProps) {
  if (status === 'CANCELLED') {
    return <CancelledStatus />
  }

  const currentIndex = STATUS_ORDER[status]

  return (
    <nav aria-label="Статус поставки" className="...">
      <ol className="flex items-center">
        {STEPS.map((step, index) => {
          const isComplete = index < currentIndex
          const isCurrent = index === currentIndex
          const isFuture = index > currentIndex

          return (
            <li key={step.status} className="...">
              <StepIndicator
                isComplete={isComplete}
                isCurrent={isCurrent}
                isFuture={isFuture}
              />
              <span
                className={cn(
                  'text-sm',
                  isComplete && 'text-green-600',
                  isCurrent && getStatusColor(step.status),
                  isFuture && 'text-gray-400'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
```

### useRemoveOrders Hook

```typescript
// src/hooks/useRemoveOrders.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeOrdersFromSupply } from '@/lib/api/supplies'
import { suppliesQueryKeys } from '@/lib/api/supplies'
import { toast } from 'sonner'

export function useRemoveOrders(supplyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderIds: string[]) =>
      removeOrdersFromSupply(supplyId, orderIds),
    onMutate: async (orderIds) => {
      await queryClient.cancelQueries({
        queryKey: suppliesQueryKeys.detail(supplyId)
      })

      const previous = queryClient.getQueryData(
        suppliesQueryKeys.detail(supplyId)
      )

      // Optimistic update
      queryClient.setQueryData(
        suppliesQueryKeys.detail(supplyId),
        (old: any) => ({
          ...old,
          ordersCount: old.ordersCount - orderIds.length,
          orders: old.orders.filter(
            (o: any) => !orderIds.includes(o.orderId)
          ),
        })
      )

      return { previous }
    },
    onSuccess: (data) => {
      const count = data.removed.length
      toast.success(`Удалено заказов: ${count}`)
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          suppliesQueryKeys.detail(supplyId),
          context.previous
        )
      }
      toast.error('Не удалось удалить заказы')
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: suppliesQueryKeys.detail(supplyId)
      })
    },
  })
}
```

### useDownloadDocument Hook

```typescript
// src/hooks/useDownloadDocument.ts
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

export function useDownloadDocument() {
  return useMutation({
    mutationFn: async ({
      supplyId,
      docType,
      filename,
    }: {
      supplyId: string
      docType: string
      filename: string
    }) => {
      const response = await apiClient.get(
        `/v1/supplies/${supplyId}/documents/${docType}`,
        { responseType: 'blob', skipDataUnwrap: true }
      )

      const blob = new Blob([response])
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    onError: () => {
      toast.error('Не удалось скачать документ')
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
| 403 | "Нет доступа к этой поставке" | Show error page |
| 404 | "Поставка не найдена" | Show 404 page |
| 409 | "Невозможно удалить заказ из закрытой поставки" | Show toast |
| 500 | "Ошибка сервера" | Show retry button |
| Network | "Проверьте соединение" | Show retry button |

---

## Testing

### Framework & Location

- **Framework**: Vitest + React Testing Library
- **Test Location**: `src/app/(dashboard)/supplies/[id]/components/__tests__/`

### Test Cases

#### Page Rendering
- [ ] Page renders with supply data
- [ ] Loading skeleton shown while fetching
- [ ] 404 page shown for missing supply
- [ ] Error state with retry button

#### SupplyHeader
- [ ] Name displayed correctly
- [ ] Status badge renders with correct color
- [ ] Creation date formatted correctly
- [ ] Orders count displayed
- [ ] Action buttons based on status

#### SupplyStatusStepper
- [ ] Correct step highlighted for OPEN
- [ ] Correct step highlighted for CLOSED
- [ ] Correct step highlighted for DELIVERING
- [ ] Correct step highlighted for DELIVERED
- [ ] CANCELLED shows special state
- [ ] Completed steps show checkmark
- [ ] Future steps shown as gray

#### SupplyOrdersTable
- [ ] Orders displayed in table
- [ ] Remove button shown for OPEN status
- [ ] Remove button hidden for other statuses
- [ ] Empty state when no orders
- [ ] Confirmation dialog on remove click
- [ ] Optimistic update on remove

#### SupplyDocumentsList
- [ ] Documents shown for CLOSED status
- [ ] Documents shown for DELIVERING/DELIVERED
- [ ] Download button triggers download
- [ ] Empty state when no documents

#### Accessibility
- [ ] Proper heading hierarchy
- [ ] Stepper has navigation role
- [ ] Current step announced
- [ ] All buttons accessible

---

## Definition of Done

- [ ] Dynamic route `/supplies/[id]` functional
- [ ] `SupplyHeader` component created
- [ ] `SupplyStatusStepper` component created
- [ ] `SupplyOrdersTable` component created
- [ ] `SupplyDocumentsList` component created
- [ ] `RemoveOrderDialog` component created
- [ ] `useSupplyDetail` hook implemented
- [ ] `useRemoveOrders` hook implemented
- [ ] `useDownloadDocument` hook implemented
- [ ] Status-based UI configuration working
- [ ] Remove order functionality (OPEN only)
- [ ] Document download functionality
- [ ] Loading skeletons for all sections
- [ ] Error states with retry
- [ ] 404 page for missing supply
- [ ] All text in Russian
- [ ] Mobile responsive layout
- [ ] WCAG 2.1 AA compliant
- [ ] Unit tests passing
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] File size <200 lines per component
- [ ] Code review approved

---

## Dependencies

### Required (Blocking)

| Dependency | Story | Status | Notes |
|------------|-------|--------|-------|
| Types & API Client | 53.1-FE | Required | Types, API functions |
| Supplies List Page | 53.2-FE | Required | Navigation context |
| Create Supply Flow | 53.3-FE | Required | Redirects here on create |

### Parallel (Non-Blocking)

| Dependency | Story | Notes |
|------------|-------|-------|
| Order Picker Drawer | 53.5-FE | Button opens drawer |
| Close Supply & Stickers | 53.6-FE | Button opens dialogs |

### Backend

| Dependency | Endpoint | Status |
|------------|----------|--------|
| Get Supply | `GET /v1/supplies/:id` | Complete |
| Remove Orders | `DELETE /v1/supplies/:id/orders` | Complete |
| Download Document | `GET /v1/supplies/:id/documents/:type` | Complete |

---

## Dev Notes

### Source Tree

```
src/
├── app/(dashboard)/supplies/
│   ├── page.tsx                              # List page (Story 53.2-FE)
│   └── [id]/
│       ├── page.tsx                          # NEW: This story
│       ├── loading.tsx                       # NEW: This story
│       ├── not-found.tsx                     # NEW: This story
│       └── components/
│           ├── SupplyHeader.tsx              # NEW: This story
│           ├── SupplyStatusStepper.tsx       # NEW: This story
│           ├── SupplyOrdersTable.tsx         # NEW: This story
│           ├── SupplyOrderRow.tsx            # NEW: This story
│           ├── SupplyDocumentsList.tsx       # NEW: This story
│           ├── RemoveOrderDialog.tsx         # NEW: This story
│           └── SupplyDetailSkeleton.tsx      # NEW: This story
├── hooks/
│   ├── useSupplyDetail.ts                    # NEW: This story
│   ├── useRemoveOrders.ts                    # NEW: This story
│   └── useDownloadDocument.ts                # NEW: This story
└── types/
    └── supplies.ts                           # Story 53.1-FE
```

### Design System Adherence

Per Design Kit and README:
- **Colors**: Status colors per AC5 table
- **Icons**: Lucide only (PackageOpen, PackageCheck, Truck, CheckCircle, XCircle)
- **Badges**: Use `Badge` from shadcn/ui with custom colors
- **Table**: Use `Table` from shadcn/ui
- **Typography**: h1 for supply name, h2 for section headers

### Status Color Constants

```typescript
// src/lib/supply-status-config.ts
export const SUPPLY_STATUS_CONFIG = {
  OPEN: {
    label: 'Открыта',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: PackageOpen,
  },
  CLOSED: {
    label: 'Закрыта',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: PackageCheck,
  },
  DELIVERING: {
    label: 'В пути',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: Truck,
  },
  DELIVERED: {
    label: 'Доставлена',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Отменена',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle,
  },
} as const
```

---

## Related

- **Parent Epic**: [Epic 53-FE: Supply Management UI](../../epics/epic-53-fe-supply-management.md)
- **Create Supply**: [Story 53.3-FE](./story-53.3-fe-create-supply-flow.md)
- **Order Picker**: [Story 53.5-FE](./story-53.5-fe-order-picker-drawer.md)
- **Close & Stickers**: [Story 53.6-FE](./story-53.6-fe-close-supply-stickers.md)
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

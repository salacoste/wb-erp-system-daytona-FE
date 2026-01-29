# Epic 53-FE: Supply Management UI

**Status**: 📋 Ready for Dev
**Priority**: P1 (High Business Value)
**Backend Epic**: Epic 53
**Story Points**: 34 SP
**Stories**: 8

---

## Overview

Implement complete FBS Supply Management functionality with full lifecycle support. This is a high-priority feature for daily seller operations.

### Problem Statement

- No UI for FBS supply management
- Sellers manage supplies manually outside the system
- No sticker generation/preview capability
- No batch order operations

### Solution

- New `/supplies` module with list and detail views
- Full lifecycle: CREATE → OPEN → CLOSED → DELIVERING → DELIVERED
- Batch operations (add up to 1000 orders)
- Sticker generation in PNG/SVG/ZPL formats
- Automatic status sync with WB

---

## Dependencies

| Type | Dependency | Status |
|------|------------|--------|
| Backend | Epic 53 (6 stories, 26 SP) | ✅ Complete |
| Backend | 9 supply endpoints | ✅ Complete |
| Frontend | **Epic 40.9-FE** (useOrders hook) | ⚠️ Required |

**Critical**: Epic 53-FE requires `useOrders` hook from Epic 40.9-FE for Order Picker functionality.

---

## API Endpoints

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | `/v1/supplies` | List supplies |
| 2 | POST | `/v1/supplies` | Create supply |
| 3 | GET | `/v1/supplies/:id` | Get details |
| 4 | POST | `/v1/supplies/:id/orders` | Add orders (batch) |
| 5 | DELETE | `/v1/supplies/:id/orders` | Remove orders |
| 6 | POST | `/v1/supplies/:id/close` | Close supply |
| 7 | POST | `/v1/supplies/:id/stickers` | Generate stickers |
| 8 | GET | `/v1/supplies/:id/documents/:type` | Download document |
| 9 | POST | `/v1/supplies/sync` | Manual sync |

### Key Types

```typescript
enum SupplyStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  DELIVERING = 'DELIVERING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

enum StickerFormat {
  PNG = 'png',   // Standard printers
  SVG = 'svg',   // High quality
  ZPL = 'zpl'    // Zebra thermal
}
```

---

## State Machine

```
   ┌─────────┐
   │  OPEN   │ ← Add/remove orders
   └────┬────┘
        │ close()
        ▼
   ┌─────────┐
   │ CLOSED  │ ← Generate stickers
   └────┬────┘
        │ WB sync (auto)
        ▼
┌───────────────┐
│  DELIVERING   │ ← In transit
└───────┬───────┘
        │ WB sync (auto)
        ▼
   ┌──────────┐
   │ DELIVERED │ ← Final
   └──────────┘
```

### Status UI Configuration

| Status | Color | Icon | Actions |
|--------|-------|------|---------|
| OPEN | Blue `#3B82F6` | `PackageOpen` | Add/remove, Close |
| CLOSED | Orange `#F59E0B` | `PackageCheck` | Stickers, Download |
| DELIVERING | Purple `#7C4DFF` | `Truck` | View only |
| DELIVERED | Green `#22C55E` | `CheckCircle` | View only |
| CANCELLED | Red `#EF4444` | `XCircle` | View only |

---

## New Routes

| Route | Page | Description |
|-------|------|-------------|
| `/supplies` | `SuppliesListPage` | List with filters |
| `/supplies/[id]` | `SupplyDetailPage` | Detail with orders |

---

## Components

### List Components (7)
- `SuppliesTable` - Main table
- `SupplyStatusBadge` - Status indicator
- `SupplyFilters` - Filter controls
- `SupplyRow` - Table row
- `SuppliesEmptyState` - Empty prompt
- `SuppliesLoadingSkeleton` - Loading state
- `CreateSupplyModal` - Create dialog

### Detail Components (10)
- `SupplyHeader` - Info + status
- `SupplyStatusStepper` - Lifecycle progress
- `SupplyOrdersTable` - Orders in supply
- `SupplyDocumentsList` - Generated docs
- `OrderPickerDrawer` - Select orders
- `OrderPickerTable` - Virtualized list
- `OrderPickerFilters` - Search/filter
- `CloseSupplyDialog` - Confirmation
- `StickerFormatSelector` - PNG/SVG/ZPL
- `StickerPreview` - Preview image
- `SyncStatusIndicator` - Sync status

---

## Stories

### Story 53.1-FE: Types & API Client
**Estimate**: 2 SP

**Scope**:
- `src/types/supplies.ts`
- `src/lib/api/supplies.ts`
- Query keys factory

**Acceptance Criteria**:
- [ ] All TypeScript interfaces
- [ ] API functions for 9 endpoints
- [ ] Error handling

---

### Story 53.2-FE: Supplies List Page
**Estimate**: 5 SP

**Scope**:
- `/supplies` route
- Sidebar navigation
- `SuppliesTable`, `SupplyFilters`
- Pagination, empty state

**Acceptance Criteria**:
- [ ] Route in sidebar ("Поставки")
- [ ] Table with status badges
- [ ] Filters: status, date
- [ ] Sorting by columns
- [ ] Click row → detail page

---

### Story 53.3-FE: Create Supply Flow
**Estimate**: 3 SP

**Scope**:
- `CreateSupplyModal`
- `useCreateSupply` mutation
- Redirect to detail

**Acceptance Criteria**:
- [ ] "Создать поставку" button
- [ ] Optional name input
- [ ] Optimistic update
- [ ] Redirect on success

---

### Story 53.4-FE: Supply Detail Page
**Estimate**: 5 SP

**Scope**:
- `/supplies/[id]` page
- `SupplyHeader`, `SupplyStatusStepper`
- `SupplyOrdersTable`, `SupplyDocumentsList`

**Acceptance Criteria**:
- [ ] Dynamic route
- [ ] Header with status badge
- [ ] Stepper showing lifecycle
- [ ] Orders table with remove action
- [ ] Documents list with download

---

### Story 53.5-FE: Order Picker Drawer
**Estimate**: 8 SP ⚡ **Most Complex**

**Scope**:
- `OrderPickerDrawer` (full-screen)
- `OrderPickerTable` (virtualized, 1000+ rows)
- `OrderPickerFilters`
- Multi-select with batch add

**Acceptance Criteria**:
- [ ] Full-screen drawer
- [ ] Virtualized list (`react-window`)
- [ ] Multi-select checkboxes
- [ ] "Select all visible"
- [ ] Selection counter
- [ ] Search/filter
- [ ] "Добавить выбранные (N)" button
- [ ] Partial success handling

**Technical Notes**:
- Requires `useOrders` hook from Epic 40.9-FE
- Filter: `supplier_status=confirm,complete`
- Max 1000 orders per batch

---

### Story 53.6-FE: Close Supply & Stickers
**Estimate**: 5 SP

**Scope**:
- `CloseSupplyDialog`
- `StickerFormatSelector`
- `StickerPreview`
- Download functionality

**Acceptance Criteria**:
- [ ] Close button (OPEN only)
- [ ] Confirmation dialog
- [ ] Cannot close empty supply
- [ ] Format selector (PNG/SVG/ZPL)
- [ ] Preview for PNG/SVG
- [ ] Download all formats
- [ ] ZPL: download only (no preview)

---

### Story 53.7-FE: Status Polling & Sync
**Estimate**: 3 SP

**Scope**:
- Auto-polling for CLOSED/DELIVERING
- `SyncStatusIndicator`
- Manual sync button
- Rate limit handling

**Acceptance Criteria**:
- [ ] Poll every 30s while CLOSED/DELIVERING
- [ ] Stop polling on DELIVERED/CANCELLED
- [ ] "Обновить статусы" button
- [ ] Rate limit display (1 per 5 min)
- [ ] Countdown timer

---

### Story 53.8-FE: E2E Tests & Polish
**Estimate**: 3 SP

**Scope**:
- Playwright E2E tests
- Accessibility audit
- Error states
- Mobile responsive

**Acceptance Criteria**:
- [ ] Full lifecycle test
- [ ] WCAG 2.1 AA
- [ ] 404/403 error states
- [ ] Mobile drawer

---

## Technical Notes

### Virtualization for Order Picker

```typescript
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={400}
  itemCount={orders.length}
  itemSize={48}
>
  {({ index, style }) => (
    <OrderRow order={orders[index]} style={style} />
  )}
</FixedSizeList>
```

### Optimistic Updates

```typescript
// Add orders optimistically
queryClient.setQueryData(['supply', id], (old) => ({
  ...old,
  ordersCount: old.ordersCount + newOrders.length,
  orders: [...old.orders, ...newOrders],
}))
```

### Polling Configuration

```typescript
const { data } = useSupplyDetail(id, {
  refetchInterval: (data) => {
    if (data?.status === 'CLOSED') return 30000
    if (data?.status === 'DELIVERING') return 30000
    return false // Stop polling
  },
})
```

### Document Download

```typescript
async function downloadDocument(supplyId: string, docType: string) {
  const response = await apiClient.get(
    `/v1/supplies/${supplyId}/documents/${docType}`,
    { responseType: 'blob', skipDataUnwrap: true }
  )

  const blob = new Blob([response])
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${docType}.${getExtension(docType)}`
  link.click()
  URL.revokeObjectURL(url)
}
```

---

## User Flow

```
1. /supplies → List page
2. Click "Создать поставку" → Modal
3. Enter name (optional) → Create
4. Redirect to /supplies/:id → Detail page
5. Click "Добавить заказы" → Drawer
6. Select orders (checkbox) → "Добавить (N)"
7. Click "Закрыть поставку" → Confirm
8. Status: CLOSED
9. Click "Сгенерировать стикеры" → Select format
10. Download/Preview sticker
11. WB syncs → Status: DELIVERING → DELIVERED
```

---

## File Structure

```
src/
├── types/
│   └── supplies.ts
├── lib/api/
│   └── supplies.ts
├── hooks/
│   ├── useSupplies.ts
│   ├── useSupplyDetail.ts
│   ├── useCreateSupply.ts
│   ├── useAddOrders.ts
│   ├── useRemoveOrders.ts
│   ├── useCloseSupply.ts
│   ├── useGenerateStickers.ts
│   ├── useDownloadDocument.ts
│   └── useSyncSupplies.ts
├── app/(dashboard)/supplies/
│   ├── page.tsx
│   ├── loading.tsx
│   ├── components/
│   │   ├── SuppliesTable.tsx
│   │   ├── SupplyStatusBadge.tsx
│   │   └── CreateSupplyModal.tsx
│   └── [id]/
│       ├── page.tsx
│       └── components/
│           ├── SupplyHeader.tsx
│           ├── SupplyStatusStepper.tsx
│           ├── OrderPickerDrawer.tsx
│           └── ...
```

---

## New Package Required

```bash
npm install react-window @types/react-window
```

---

**Created**: 2026-01-29
**Last Updated**: 2026-01-29

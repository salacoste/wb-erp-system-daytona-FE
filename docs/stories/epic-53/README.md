# Epic 53-FE: Supply Management UI - Stories

**Epic Location**: `docs/epics/epic-53-fe-supply-management.md`
**Sprint**: 3-5 (Mar 3 - Apr 11, 2026)
**Total Story Points**: 34 SP

---

## Story Index

| Story | Title | SP | Status | Sprint |
|-------|-------|---:|--------|--------|
| 53.1-FE | Types & API Client | 2 | 📋 Ready | 3 |
| 53.2-FE | Supplies List Page | 5 | 📋 Ready | 3 |
| 53.3-FE | Create Supply Flow | 3 | 📋 Ready | 3 |
| 53.4-FE | Supply Detail Page | 5 | 📋 Ready | 3 |
| 53.5-FE | Order Picker Drawer | 8 | 📋 Ready | 4 |
| 53.6-FE | Close Supply & Stickers | 5 | 📋 Ready | 4 |
| 53.7-FE | Status Polling & Sync | 3 | 📋 Ready | 5 |
| 53.8-FE | E2E Tests & Polish | 3 | 📋 Ready | 5 |

---

## Story Files

### Sprint 3 (Foundation)
- [Story 53.1-FE: Types & API Client](./story-53.1-fe-types-api-client.md)
- [Story 53.2-FE: Supplies List Page](./story-53.2-fe-supplies-list-page.md)
- [Story 53.3-FE: Create Supply Flow](./story-53.3-fe-create-supply-flow.md)
- Story 53.4-FE: Supply Detail Page (pending)

### Sprint 4 (Order Picker & Stickers)
- [Story 53.5-FE: Order Picker Drawer](./story-53.5-fe-order-picker-drawer.md)
- [Story 53.6-FE: Close Supply & Stickers](./story-53.6-fe-close-supply-stickers.md)

### Sprint 5 (Polling & Polish)
- [Story 53.7-FE: Status Polling & Sync](./story-53.7-fe-status-polling-sync.md)
- [Story 53.8-FE: E2E Tests & Polish](./story-53.8-fe-e2e-tests-polish.md)

---

## Dependencies

```
53.1-FE (Types)
    ↓
53.2-FE (List) ──→ 53.3-FE (Create)
    ↓                    ↓
53.4-FE (Detail) ←──────┘
    ↓
53.5-FE (Order Picker) ──→ 53.6-FE (Close & Stickers)
                                ↓
                         53.7-FE (Polling)
                                ↓
                         53.8-FE (E2E)
```

**External Dependency**: Epic 40-FE (Orders) provides `useOrders` hook required for Story 53.5-FE Order Picker.

---

## Routes

| Route | Page | Story |
|-------|------|-------|
| `/supplies` | Supplies List | 53.2-FE |
| `/supplies/[id]` | Supply Detail | 53.4-FE |

---

## Components by Story

### 53.1-FE: Types & API
- `src/types/supplies.ts`
- `src/lib/api/supplies.ts`

### 53.2-FE: List Page
- `SuppliesPageHeader`
- `SuppliesFilters`
- `SuppliesTable`
- `SuppliesTableRow`
- `SuppliesPagination`
- `SupplyStatusBadge`
- `SuppliesEmptyState`
- `SuppliesLoadingSkeleton`
- `SyncStatusIndicator`

### 53.3-FE: Create Flow
- `CreateSupplyModal`

### 53.4-FE: Detail Page
- `SupplyHeader`
- `SupplyStatusStepper`
- `SupplyOrdersTable`
- `SupplyDocumentsList`

### 53.5-FE: Order Picker
- `OrderPickerDrawer`
- `OrderPickerTable`
- `OrderPickerFilters`

### 53.6-FE: Close & Stickers
- `CloseSupplyDialog`
- `StickerFormatSelector`
- `StickerPreview`

### 53.7-FE: Polling
- Status polling hooks
- `SyncStatusIndicator` enhancements

### 53.8-FE: E2E
- Playwright test files

---

## Change Log

| Date | Change |
|------|--------|
| 2026-01-29 | Created 53.1-FE, 53.2-FE, 53.3-FE story files |
| 2026-01-29 | Created 53.4-FE, 53.6-FE story files |
| 2026-01-29 | Created 53.5-FE story file (Order Picker Drawer) |

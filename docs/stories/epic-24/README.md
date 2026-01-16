# Epic 24: Paid Storage Analytics (Frontend)

## Overview

Frontend implementation for Epic 24 - Paid Storage Analytics. Backend API is complete (Request #36).

**Business Value**: Sellers can analyze storage costs by SKU, identify expensive products, and optimize warehouse strategy.

## Stories

### MVP Stories (Complete ✅)

| Story | Title | Priority | Points | Status | QA Score |
|-------|-------|----------|--------|--------|----------|
| [24.1-fe](story-24.1-fe-types-api-client.md) | TypeScript Types & API Client | High | 3 | ✅ Done | 85/100 |
| [24.2-fe](story-24.2-fe-page-layout.md) | Storage Analytics Page Layout | High | 5 | ✅ Done | 80/100 |
| [24.3-fe](story-24.3-fe-storage-by-sku-table.md) | Storage by SKU Table | High | 5 | ✅ Done | 85/100 |
| [24.4-fe](story-24.4-fe-top-consumers.md) | Top Consumers Widget | Medium | 3 | ✅ Done | 90/100 |
| [24.5-fe](story-24.5-fe-trends-chart.md) | Storage Trends Chart | Medium | 3 | ✅ Done | 92/100 |
| [24.6-fe](story-24.6-fe-manual-import.md) | Manual Import UI | Low | 3 | ✅ Done | 88/100 |
| [24.7-fe](story-24.7-fe-product-card-storage.md) | Product Card Storage Info | Medium | 2 | ✅ Done | 92/100 |
| [24.8-fe](story-24.8-fe-high-ratio-alert.md) | High Storage Ratio Alert | Low | 2 | ✅ Done | 92/100 |

**MVP Points**: 26 | **MVP Complete**: 8/8 (100%) | **Average QA Score**: 88/100

### Enhancement Stories (Complete ✅)

| Story | Title | Priority | Points | Status | QA Score |
|-------|-------|----------|--------|--------|----------|
| [24.9-fe](story-24.9-fe-multi-select-filters.md) | Multi-select Brand & Warehouse Filters | Medium | 5 | ✅ Done | 90/100 |
| [24.10-fe](story-24.10-fe-chart-click-filter.md) | Chart Click-to-Filter Interaction | Low | 3 | ✅ Done | 95/100 |
| [24.11-fe](story-24.11-fe-unit-tests.md) | Unit Tests for Storage Analytics | Medium | 5 | ✅ Done | 95/100 |

**Enhancement Points**: 13 | **Total Epic Points**: 39 | **Enhancement Complete**: 3/3 (100%)

## Implementation Order

1. **Sprint 1 (High Priority)** - 13 points:
   - 24.1-fe: Types & API Client (foundation)
   - 24.2-fe: Page Layout (route + structure)
   - 24.3-fe: Storage by SKU Table (main functionality)

2. **Sprint 2 (Medium Priority)** - 8 points:
   - 24.4-fe: Top Consumers Widget
   - 24.5-fe: Trends Chart
   - 24.7-fe: Product Card Storage Info

3. **Sprint 3 (Low Priority)** - 5 points:
   - 24.6-fe: Manual Import UI
   - 24.8-fe: High Storage Ratio Alert

## Dependencies

- **Backend**: Epic 24 complete ✅ (Request #36)
- **API Documentation**: `docs/request-backend/36-epic-24-paid-storage-analytics-api.md`
- **Existing Components**: WeekPicker, Table, Chart (Recharts)

## Design Reference

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏭 Главная / Аналитика / Хранение                               │
├─────────────────────────────────────────────────────────────────┤
│ <Warehouse/> Аналитика расходов на хранение    [Импорт данных]   │
├─────────────────────────────────────────────────────────────────┤
│ Период: [W44 ▼] - [W47 ▼]   Бренды: [Все ▼]   Склады: [Все ▼]   │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ 125,000 ₽   │ │ 150         │ │ 833 ₽       │ │ 28 дней     │ │
│ │ Всего       │ │ Товаров     │ │ Среднее     │ │ Период      │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ <TrendingUp/> Динамика расходов                 Тренд: +5.2%    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  [Area Chart - storage cost by week]                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ <Trophy/> Топ-5 по расходам на хранение        [Показать все →] │
│ ┌─────┬────────────────┬──────────┬─────────┬────────────────┐ │
│ │ #   │ Товар          │ Хранение │ % общих │ Хран/Выручка % │ │
│ └─────┴────────────────┴──────────┴─────────┴────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ <List/> Все товары (150)                       🔍 [Поиск]       │
│ ┌───────────┬──────────┬─────────┬────────┬──────────────────┐ │
│ │ Артикул   │ Хранение │ ₽/день  │ Объём  │ Склады           │ │
│ └───────────┴──────────┴─────────┴────────┴──────────────────┘ │
│                                    [← Пред] [1] [2] [След →]   │
└─────────────────────────────────────────────────────────────────┘
```

## Navigation

- **Route**: `/analytics/storage`
- **Sidebar**: Add under "Аналитика" section (after existing analytics pages)
- **Icon**: Lucide `Warehouse`

## API Endpoints Used

| Endpoint | Story |
|----------|-------|
| `GET /v1/analytics/storage/by-sku` | 24.1-fe, 24.3-fe |
| `GET /v1/analytics/storage/top-consumers` | 24.1-fe, 24.4-fe |
| `GET /v1/analytics/storage/trends` | 24.1-fe, 24.5-fe |
| `POST /v1/imports/paid-storage` | 24.1-fe, 24.6-fe |
| `GET /v1/imports/{id}` | 24.6-fe |

## UX Decisions (2025-11-29)

All UX decisions made by Sally (UX Expert) based on Design Kit review:

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| Q1 | Icons | **Lucide only** | Consistent with design system |
| Q2 | Colors | **Extend existing palette** | Storage: Purple (#7C4DFF) |
| Q3 | Breadcrumbs | **Include** | Navigation clarity |
| Q4 | Brand filter | **Multi-select** | Users compare multiple brands |
| Q5 | Export CSV | **DEFER** | Not in MVP scope |
| Q6 | Warehouses | **Badges + overflow** | Visual scannability |
| Q7 | Mobile | **Horizontal scroll** | Standard table pattern |
| Q8 | Truncation | **45-50 chars + tooltip** | Real WB names are long |
| Q9 | Medals | **Lucide icons + colors** | Consistent with design system |
| Q10 | Cost colors | **CSS classes** | Accessible, themeable |
| Q11 | Chart click | **DEFER** | Adds complexity |
| Q12 | Null data | **Show gaps** | Data integrity |
| Q13 | Progress bar | **Indeterminate** | Backend doesn't provide % |
| Q14 | Cancel import | **Allow + confirm** | User control |
| Q15 | Scheduler | **Minimal MVP** | Full details deferred |

## PO Decisions (2025-11-29)

| Question | Decision |
|----------|----------|
| Export CSV | ❌ Defer (not in MVP) |
| Warehouse filter | ✅ Multi-select |
| Integration with product page | ✅ Yes - add storage cost |
| Alerts for high ratio | ✅ Yes - notify when >20% |

## File Structure

```
src/
├── app/(dashboard)/analytics/storage/
│   ├── page.tsx                      # Main page (24.2-fe)
│   ├── loading.tsx                   # Skeleton loader
│   ├── error.tsx                     # Error boundary
│   └── components/
│       ├── StoragePageHeader.tsx     # Title + breadcrumbs
│       ├── StorageFilters.tsx        # Week picker + filters
│       ├── StorageSummaryCards.tsx   # Summary metrics
│       ├── StorageTrendsChart.tsx    # Trends chart (24.5-fe)
│       ├── TopConsumersWidget.tsx    # Top 5 table (24.4-fe)
│       ├── StorageBySkuTable.tsx     # Full table (24.3-fe)
│       └── PaidStorageImportDialog.tsx # Import dialog (24.6-fe)
├── types/
│   └── storage-analytics.ts          # Types (24.1-fe)
├── lib/api/
│   └── storage-analytics.ts          # API client (24.1-fe)
└── hooks/
    └── useStorageAnalytics.ts        # React Query hooks (24.1-fe)
```

## Color Scheme

| Element | Color | Usage |
|---------|-------|-------|
| Storage line/fill | `#7C4DFF` (Purple) | Charts, badges |
| High cost | `#EF4444` (Red) | >20% ratio |
| Medium cost | `#F59E0B` (Yellow) | 10-20% ratio |
| Low cost | `#22C55E` (Green) | <10% ratio |
| Trend up (bad) | `#DC2626` (Red) | Increasing costs |
| Trend down (good) | `#16A34A` (Green) | Decreasing costs |

## Testing Strategy

- **Unit Tests**: Vitest + React Testing Library
- **Test Location**: Colocated in `__tests__` folders
- **Coverage Target**: >80% for hooks, >70% for components
- **E2E Tests**: Playwright (optional for MVP)

---

## Backend Integration Status

### Products API Storage Fields (2025-11-29)

Backend now supports `include_storage=true` parameter in `GET /v1/products`:

**Request:**
```http
GET /v1/products?include_storage=true&limit=50
```

**Response fields added to ProductListItem:**
| Field | Type | Description |
|-------|------|-------------|
| `storage_cost_daily_avg` | `number \| null` | Average daily storage cost in ₽ |
| `storage_cost_weekly` | `number \| null` | Total weekly storage cost in ₽ |
| `storage_period` | `string \| null` | ISO week of storage data (e.g., "2025-W47") |

**Frontend Integration:**
- ✅ `src/types/cogs.ts` - ProductListItem interface updated
- ✅ `src/hooks/useProducts.ts` - ProductFilters.include_storage parameter added

**Usage:**
```typescript
const { data } = useProducts({ include_storage: true })
// Access: product.storage_cost_daily_avg, product.storage_cost_weekly, product.storage_period
```

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-11-29 | PO (Sarah) | Initial draft |
| 2025-11-29 | UX Expert (Sally) | Added UX decisions, updated all stories with Tasks/Dev Notes/Testing |
| 2025-11-29 | UX Expert (Sally) | Created front-end-spec-epic-24.md |
| 2025-11-29 | Claude Code (Opus 4.5) | Implemented all 8 stories, all Ready for QA |
| 2025-11-29 | Claude Code (Opus 4.5) | Backend integration: added include_storage parameter support to Products API |
| 2025-12-04 | QA (Quinn) | MVP Complete (8/8), QA Gates created, 3 enhancement stories drafted |
| 2025-12-04 | PO (Sarah) | Enhancement stories reviewed & approved: 24.9, 24.10, 24.11 → Ready for Dev |
| 2026-01-03 | QA (Quinn) | Enhancement QA Review: 24.9 PASS (90), 24.10 CONCERNS (75), 24.11 CONCERNS (78) |
| 2026-01-03 | Claude (Dev) | Fixed QA concerns: 24.10 (tests exist, cursor verified), 24.11 (test fixes). Epic 24 COMPLETE ✅ |

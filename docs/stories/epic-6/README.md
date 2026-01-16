# Epic 6: Advanced Analytics (Frontend)

## Overview

**Epic ID**: 6-FE
**Status**: ✅ Complete (100%)
**Priority**: Medium
**Total Points**: 21
**Completed Points**: 21
**Remaining Points**: 0
**Risk Level**: Low
**Created**: 2025-11-29
**Last Updated**: 2025-12-05
**Backend Dependency**: Epic 6B Complete ✅

---

## Business Value

**As a** Wildberries seller analyzing business performance,
**I want** advanced analytics UI with date ranges, comparisons, and exports,
**So that** I can make data-driven decisions about pricing, inventory, and product strategy.

**Key Capabilities**:
- 📅 Analyze trends across custom date ranges (not just single weeks)
- 📊 Compare periods to see growth/decline with visual indicators
- 💰 View ROI and profit-per-unit metrics for investment decisions
- 📈 Dashboard with cabinet-level KPIs and top performers
- 📥 Export data to CSV/Excel for external analysis

---

## Solution Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                 EPIC 6 FE: ANALYTICS UI LAYERS                   │
├─────────────────────────────────────────────────────────────────┤
│  Layer 5: EXPORT (Story 6.5-fe)                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ExportDialog → POST /v1/exports/analytics → Download        │ │
│  │ Formats: CSV, Excel | Status polling | Auto-download        │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4: DASHBOARD (Story 6.4-fe)                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ /analytics/dashboard → Cabinet Summary KPIs                  │ │
│  │ KPICards, TopProductsTable, TopBrandsTable                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: METRICS (Story 6.3-fe)                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ROI & Profit/Unit columns in analytics tables               │ │
│  │ Color-coded ROI, Column visibility toggle, Sorting          │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: COMPARISON (Story 6.2-fe)                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Period comparison with delta visualization                   │
│  │ DeltaIndicator (↑↓—), Green/Red color coding                │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: DATE RANGE (Story 6.1-fe) - FOUNDATION                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ DateRangePicker → weekStart/weekEnd params                  │ │
│  │ Updates: useMarginAnalytics, SKU/Brand/Category pages       │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stories

| Story | Title | Priority | Points | Status | Dependency |
|-------|-------|----------|--------|--------|------------|
| [6.1-fe](story-6.1-fe-date-range-support.md) | Date Range Support | High | 5 | ✅ Done | None |
| [6.2-fe](story-6.2-fe-period-comparison.md) | Period Comparison | Medium | 3 | ✅ Done | 6.1-fe ✅ |
| [6.3-fe](story-6.3-fe-roi-profit-metrics.md) | ROI & Profit Metrics | Medium | 3 | ✅ Done | None |
| [6.4-fe](story-6.4-fe-cabinet-summary.md) | Cabinet Summary Dashboard | High | 5 | ✅ Done | None |
| [6.5-fe](story-6.5-fe-export-analytics.md) | Export Analytics UI | Medium | 5 | ✅ Done | 6.1-fe ✅ |

**Total**: 21 points | **Completed**: 5/5 (100%) | **Done**: 21 pts | **Remaining**: 0 pts

---

## Implementation Order

### Sprint 1: Foundation + High Value (10 pts)

```
Week 1:
├── Story 6.1-fe: Date Range Support (5 pts) ⭐ FOUNDATION
│   ├── Create DateRangePicker component
│   ├── Update useMarginAnalytics hook
│   ├── Update SKU/Brand/Category pages
│   └── Display aggregated data with period label
│
└── Story 6.4-fe: Cabinet Summary Dashboard (5 pts) ⭐ HIGH VALUE
    ├── Create /analytics/dashboard page
    ├── Create KPICard, TopProductsTable, TopBrandsTable
    ├── Create useCabinetSummary hook
    └── Add sidebar navigation
```

### Sprint 2: Enhancements (11 pts)

```
Week 2:
├── Story 6.2-fe: Period Comparison (3 pts)
│   ├── Create DeltaIndicator component
│   ├── Add compare_to param support
│   └── Side-by-side comparison tables
│
├── Story 6.3-fe: ROI & Profit Metrics (3 pts)
│   ├── Add ROI/Profit-per-unit columns
│   ├── Create useColumnVisibility hook
│   └── Implement column toggle UI
│
└── Story 6.5-fe: Export Analytics UI (5 pts)
    ├── Create ExportDialog component
    ├── Create useExportAnalytics hook
    ├── Status polling with auto-download
    └── Add export buttons to analytics pages
```

---

## Dependency Graph

```
Story 6.1-fe ─────────────────────────────────────────┐
Date Range Support                                    │
(Provides: DateRangePicker, weekStart/weekEnd)        │
                │                                     │
                ├──────────────┐                      │
                │              │                      │
                ▼              ▼                      │
         Story 6.2-fe    Story 6.5-fe                 │
         Period          Export UI                    │
         Comparison      (Uses DateRangePicker)       │
                                                      │
Story 6.3-fe ─────────────────────────────────────────┤
ROI & Profit Metrics (Independent)                    │
                                                      │
Story 6.4-fe ─────────────────────────────────────────┘
Cabinet Summary Dashboard (Independent)
```

---

## New Components

| Component | Story | Description |
|-----------|-------|-------------|
| `DateRangePicker` | 6.1-fe | Week range selector with validation |
| `DeltaIndicator` | 6.2-fe | ↑↓— with green/red color coding |
| `ColumnVisibilityToggle` | 6.3-fe | Show/hide columns dropdown |
| `KPICard` | 6.4-fe | Metric card with trend indicator |
| `TopProductsTable` | 6.4-fe | Top 10 products by revenue |
| `TopBrandsTable` | 6.4-fe | Top 5 brands by revenue |
| `ExportDialog` | 6.5-fe | Export configuration modal |
| `ExportStatusDisplay` | 6.5-fe | Progress/download UI |

---

## New Hooks

| Hook | Story | Description |
|------|-------|-------------|
| `useMarginAnalytics` | 6.1-fe | UPDATE: Add weekStart/weekEnd support |
| `useColumnVisibility` | 6.3-fe | NEW: localStorage-persisted visibility |
| `useCabinetSummary` | 6.4-fe | NEW: Cabinet summary API hook |
| `useExportAnalytics` | 6.5-fe | NEW: Export mutation + polling |

---

## Backend API Endpoints

All endpoints are **ready** (Backend Epic 6B complete):

| Endpoint | Story | Purpose |
|----------|-------|---------|
| `GET /v1/analytics/weekly/by-sku?weekStart=&weekEnd=` | 6.1-fe | SKU analytics with date range |
| `GET /v1/analytics/weekly/by-brand?weekStart=&weekEnd=` | 6.1-fe | Brand analytics with date range |
| `GET /v1/analytics/weekly/by-category?weekStart=&weekEnd=` | 6.1-fe | Category analytics with date range |
| `GET /v1/analytics/weekly/by-sku?compare_to=` | 6.2-fe | Period comparison with deltas |
| `GET /v1/analytics/cabinet-summary?weeks=` | 6.4-fe | Cabinet-level KPIs |
| `POST /v1/exports/analytics` | 6.5-fe | Create export job |
| `GET /v1/exports/:exportId` | 6.5-fe | Get export status/download |

---

## New Response Fields

### Analytics Response (6.1, 6.3)

```typescript
interface AnalyticsItem {
  // ... existing fields
  profit_per_unit: number | null  // NEW: profit / qty
  roi: number | null              // NEW: (profit / cogs) * 100
  weeks_with_sales: number        // NEW: count of weeks with sales
  weeks_with_cogs: number         // NEW: count of weeks with COGS
}
```

### Comparison Response (6.2)

```typescript
interface ComparisonItem {
  // Current period values
  revenue_net: number
  profit: number
  margin_pct: number

  // Comparison period values
  compare_revenue_net: number
  compare_profit: number
  compare_margin_pct: number

  // Delta calculations (NEW)
  revenue_delta: number
  revenue_delta_pct: number
  profit_delta: number
  profit_delta_pct: number
  margin_delta_pct: number
}
```

### Cabinet Summary Response (6.4)

```typescript
interface CabinetSummaryResponse {
  summary: {
    totals: { revenue_net, cogs_total, profit, margin_pct, qty, profit_per_unit, roi }
    products: { total, with_cogs, without_cogs, coverage_pct }
    trends: { revenue_trend, profit_trend, margin_trend, week_over_week_growth }
  }
  top_products: Array<{ nm_id, sa_name, revenue_net, profit, margin_pct, contribution_pct }>
  top_brands: Array<{ brand, revenue_net, profit, margin_pct }>
  meta: { cabinet_id, period, generated_at }
}
```

---

## File Structure

```
src/
├── app/(dashboard)/analytics/
│   ├── page.tsx                    # UPDATE: Add date range picker (6.1-fe)
│   ├── sku/page.tsx               # UPDATE: Add date range, export (6.1, 6.5)
│   ├── brand/page.tsx             # UPDATE: Add date range, export (6.1, 6.5)
│   ├── category/page.tsx          # UPDATE: Add date range, export (6.1, 6.5)
│   └── dashboard/                  # NEW: Cabinet summary (6.4-fe)
│       ├── page.tsx
│       └── loading.tsx
├── components/custom/
│   ├── DateRangePicker.tsx        # NEW (6.1-fe)
│   ├── DeltaIndicator.tsx         # NEW (6.2-fe)
│   ├── ColumnVisibilityToggle.tsx # NEW (6.3-fe)
│   ├── KPICard.tsx                # NEW (6.4-fe)
│   ├── TopProductsTable.tsx       # NEW (6.4-fe)
│   ├── TopBrandsTable.tsx         # NEW (6.4-fe)
│   ├── ExportDialog.tsx           # NEW (6.5-fe)
│   └── ExportStatusDisplay.tsx    # NEW (6.5-fe)
├── hooks/
│   ├── useMarginAnalytics.ts      # UPDATE (6.1-fe)
│   ├── useColumnVisibility.ts     # NEW (6.3-fe)
│   ├── useCabinetSummary.ts       # NEW (6.4-fe)
│   └── useExportAnalytics.ts      # NEW (6.5-fe)
└── types/
    └── analytics.ts               # UPDATE: Extended types
```

---

## Design Reference

### Date Range Picker (6.1-fe)

```
┌─────────────────────────────────────────────────────────────┐
│ Период: [W44 ▼] — [W47 ▼]   или   Последние [4 ▼] недель   │
└─────────────────────────────────────────────────────────────┘
```

### Cabinet Summary Dashboard (6.4-fe)

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Сводка по кабинету                    Период: 4 недели   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │ 1.2M ₽     │ │ 45.5%       │ │ 89%         │ │ +12.3%  │ │
│ │ Выручка ↑  │ │ Маржа →     │ │ COGS покрыт.│ │ Рост WoW│ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 🏆 Топ-10 товаров          │ 🏷️ Топ-5 брендов             │
│ ┌───────────────────────┐  │ ┌───────────────────────────┐ │
│ │ 1. Product A  │ 15.2% │  │ │ 1. Brand X    │ 35.5% M │ │
│ │ 2. Product B  │ 12.1% │  │ │ 2. Brand Y    │ 28.3% M │ │
│ └───────────────────────┘  │ └───────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Export Dialog (6.5-fe)

```
┌─────────────────────────────────────────────────────────────┐
│ 📥 Экспорт аналитики                                    [X] │
├─────────────────────────────────────────────────────────────┤
│ Тип данных:   [По товарам (SKU) ▼]                          │
│ Период:       [W44] — [W47]                                 │
│ Формат:       ○ CSV   ● Excel (.xlsx)                       │
│ Включить COGS: [✓]                                          │
├─────────────────────────────────────────────────────────────┤
│                              [Отмена]  [Экспортировать]     │
└─────────────────────────────────────────────────────────────┘
```

### Delta Indicator (6.2-fe)

```
Positive: ↑ +15.2%  (green-600)
Negative: ↓ -5.6%   (red-600)
Neutral:  — 0%      (gray-400)
```

### ROI Color Thresholds (6.3-fe)

| ROI Range | Color | Meaning |
|-----------|-------|---------|
| ≥100% | green-600 | Excellent |
| 50-99% | green-500 | Good |
| 20-49% | yellow-600 | Average |
| 0-19% | orange-500 | Low |
| <0% | red-600 | Negative |

---

## Success Criteria

**Epic is complete when**:

- ✅ Date range selection works across all analytics pages
- ✅ Period comparison shows delta values with visual indicators
- ✅ ROI and Profit/Unit columns visible and sortable
- ✅ Cabinet summary dashboard displays KPIs and top performers
- ✅ Export to CSV/Excel works with progress indication

**Performance Targets**:

| Metric | Target |
|--------|--------|
| Date range query response | < 500ms (p95) |
| Dashboard load time | < 1s |
| Export poll interval | 2 seconds |
| Component render time | < 100ms |

---

## Risk Assessment

| Story | Risk | Primary Concern | Mitigation |
|-------|------|-----------------|------------|
| 6.1-fe | Low | Hook changes may break existing code | Backward compatibility via optional params |
| 6.2-fe | Low | Delta calculation edge cases | Handle null, zero, division by zero |
| 6.3-fe | Low | localStorage not available in SSR | useEffect for hydration |
| 6.4-fe | Low | New page routing | Follow existing dashboard patterns |
| 6.5-fe | Low | Popup blocker for downloads | Manual download button fallback |

---

## Testing Strategy

| Type | Framework | Coverage Target |
|------|-----------|-----------------|
| Unit Tests | Vitest + RTL | >80% hooks, >70% components |
| Integration | Vitest | API mocking with MSW |
| E2E | Playwright | Critical user flows |

**Test Location**: Colocated in `__tests__` folders

---

## Dependencies

### Backend (Complete ✅)

- Epic 6B: Stories 6.1-6.6 (all API endpoints ready)

### Existing Frontend Components

- `WeekSelector` - Reuse for individual week selection
- `FinancialSummaryTable` - Extend for comparison mode
- `MarginTrendChart` - Existing trend visualization

### Existing Hooks

- `useAvailableWeeks` - Week list for selectors
- `useTrends` - Existing trends hook (reference)

---

## Related Documentation

- **Backend Epic 6**: `docs/stories/epic-6/README.md`
- **API Reference**: `docs/API-PATHS-REFERENCE.md`
- **Frontend Architecture**: `frontend/docs/front-end-architecture.md`
- **Design System**: `frontend/docs/design-system.md`

---

## Sidebar Navigation Update

```
📊 Аналитика
├── 📈 Сводка (NEW - /analytics/dashboard)  ← Story 6.4-fe
├── 🏷️ По товарам (/analytics/sku)
├── 🏢 По брендам (/analytics/brand)
└── 📦 По категориям (/analytics/category)
```

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-11-29 | Claude Code (Opus 4.5) | Initial draft - 5 frontend stories created |
| 2025-11-29 | Sarah (PO Agent) | PO Validation: Added Tasks/Subtasks, Dev Notes, Change Logs. All stories Ready for Dev |
| 2025-12-05 | Sarah (PO Agent) | Enhanced README with solution overview, dependency graph, success criteria, risk assessment |
| 2025-12-05 | Claude Code (Opus 4.5) | Stories 6.1, 6.2, 6.4 completed (13 pts) |
| 2025-12-05 | Claude Code (Opus 4.5) | Story 6.3-fe completed: ROI & Profit Metrics Display (3 pts). Epic at 76% (16/21 pts) |
| 2025-12-05 | Claude Code (Opus 4.5) | Story 6.5-fe completed: Export Analytics UI (5 pts). **Epic 6-FE Complete at 100% (21/21 pts)** |

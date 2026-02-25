# Epic 69-FE: Аналитика выкупов (Buyout Rate Analytics)

| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| Priority | P2 |
| Story Points | 28 |
| Sprint | Sprint 10 (2026-02-23) |
| Route | `/analytics/buyout` |
| Backend Deps | Request #151 (Complete), Request #154 (Open — data source mismatch) |

## Overview

Buyout Rate Analytics page providing per-SKU buyout/return rate analysis with trend tracking, confidence scoring, and FBS return reason breakdown. Supports three data sources (weekly report, realtime FBS, blended) with 365-day date range.

## Target Personas

### Primary: Business Owner / Entrepreneur
- Needs: Quick visibility into which SKUs have declining buyout rates to take corrective action
- Pain: Cannot identify problem products without manual spreadsheet analysis

### Secondary: Financial Director / CFO
- Needs: Accurate buyout/return metrics for profitability analysis
- Pain: Multiple data sources with different timing create confusion

## Backend API

| Endpoint | Purpose | Cache | Auth |
|----------|---------|-------|------|
| `GET /v1/analytics/buyout/by-sku` | Per-SKU buyout rates with sorting/pagination | 30 min | X-Cabinet-Id |
| `GET /v1/analytics/buyout/summary` | Cabinet-level buyout overview + top decliners | 30 min | X-Cabinet-Id |
| `GET /v1/fulfillment/summary` | FBS return reason breakdown (supplementary) | 30 min | X-Cabinet-Id |

### Key Parameters (by-sku)
- `from`, `to` (required) — date range in YYYY-MM-DD
- `source` — `weekly` | `realtime` | `blended` (default: `blended`)
- `trend` — boolean, enables previous period comparison
- `sort` — `buyoutRate` | `salesCount` | `returnRate` | `trend`
- `sortOrder` — `asc` | `desc`
- `limit`, `offset` — pagination (default: 50, 0)
- `minSales` — filter minimum sales count
- `nmId` — filter to single SKU

### Business Formulas
```
buyoutRate = (salesCount - returnsCount) / salesCount × 100
returnRate = 100 - buyoutRate
confidence: ≥50 sales → high, 10-49 → medium, <10 → low
```

## File Structure

```
src/
├── app/(dashboard)/analytics/buyout/
│   ├── page.tsx                          (10 lines)
│   └── components/
│       ├── BuyoutPageContent.tsx          (89 lines)
│       ├── BuyoutSummaryWidget.tsx        (147 lines)
│       └── BuyoutTable.tsx               (281 lines ⚠️ exceeds 200)
├── hooks/
│   └── use-buyout-analytics.ts           (49 lines)
├── lib/api/
│   └── buyout-analytics.ts              (91 lines)
└── types/
    └── analytics-epics-68-71.ts          (218 lines ⚠️ shared, exceeds 200)
```

## Stories

| Story | Title | SP | Status |
|-------|-------|----|--------|
| 69.1-FE | Types & API Layer | 3 | ✅ Complete |
| 69.2-FE | TanStack Query Hooks | 3 | ✅ Complete |
| 69.3-FE | Buyout Summary Widget | 5 | ✅ Complete |
| 69.4-FE | Per-SKU Buyout Table | 8 | ✅ Complete |
| 69.5-FE | Page Scaffold & Routing | 3 | ✅ Complete |
| 69.6-FE | Data Source UX & Edge Cases | 3 | ✅ Complete |
| 69.7-FE | Unit & Integration Tests | 3 | 📋 Planned |

## Known Issues

### 1. File Size Violations
- `BuyoutTable.tsx` (281 lines) exceeds the 200-line ESLint limit
- `analytics-epics-68-71.ts` (218 lines) exceeds the 200-line limit (shared types file)

### 2. Design System Inconsistency
- `BuyoutPageContent.tsx` uses native `<select>` instead of shadcn `Select` component

### 3. Product Enrichment Cap
- `useProducts({ limit: 200 })` in BuyoutTable silently fails for catalogs with >200 products
- Missing vendorCode/brand for products beyond the first 200

### 4. Type Inconsistency
- `BuyoutSummaryResponse.source` and `.confidence` typed as `string` instead of `BuyoutSource` and `BuyoutConfidence` union types

### 5. Data Source Mismatch (Request #154)
- `buyoutRatePct` from `wb_finance_raw` (1-2 day delay) and `returnBreakdown` from FBS statuses (near-realtime) can show contradictory values
- UI displays both correctly with separate labels; backend reconciliation pending

### 6. Minor UX Issues
- Sort order toggle doesn't reset pagination offset
- No CSV/Excel export capability

## Design System

### Colors
| Element | Color | Usage |
|---------|-------|-------|
| Buyout rate bar | green-500 | Progress bar fill |
| Return rate | red-500 | Progress bar remainder |
| Cancel before shipment | blue-500 | Return reason segment |
| PVZ refusal | orange-500 | Return reason segment |
| Return after receipt | red-500 | Return reason segment |

### Russian Labels
- Page title: "Аналитика выкупов"
- Subtitle: "Процент выкупа и тренды по SKU"
- Source options: Комбинированный | Еженедельный отчёт | Реалтайм
- Confidence: "Мало данных" (medium), "Недостаточно данных" (low)
- Empty state: "Нет данных за выбранный период"
- Error state: "Не удалось загрузить данные выкупов"

## Links

- Backend API spec: `docs/request-backend/151-epics-68-71-analytics-api.md`
- Data source mismatch: `docs/request-backend/154-buyout-rate-vs-return-breakdown.md`
- Test API file: `../test-api/32-buyout-analytics.http`
- Route constant: `src/lib/routes.ts:42`

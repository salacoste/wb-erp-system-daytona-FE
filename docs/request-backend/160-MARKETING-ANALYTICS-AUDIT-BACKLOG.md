# Request #160: Marketing Analytics — Full Audit & Backlog

**Date**: 2026-03-06
**Status**: Audit Complete
**Priority**: P0-P3 (mixed)
**Scope**: Funnel, Advertising, Search, Buyout — all marketing API endpoints
**Requested By**: Frontend Team (automated sub-agent audit)

---

## Executive Summary

Comprehensive audit of all 4 marketing analytics API domains against backend implementation.
Analyzed: test-api HTTP files, API-PATHS-REFERENCE.md, BUSINESS-LOGIC-REFERENCE.md, frontend source code.

| Domain | Frontend Status | Backend Endpoints | Bugs Found | Gaps Found |
|--------|----------------|-------------------|------------|------------|
| Funnel (`/v1/analytics/funnel`) | Implemented (8 files) | 4 endpoints | 2 type mismatches | 4 UI gaps |
| Advertising (`/v1/analytics/advertising`) | Implemented (20+ components) | 3 endpoints | 4 bugs | 3 gaps |
| Search (`/v1/analytics/search`) | **NOT IMPLEMENTED** | 3 endpoints | 1 critical bug | Full build needed |
| Buyout (`/v1/analytics/buyout`) | Implemented (10 files) | 2 endpoints | 4 backend bugs | 3 gaps |

**Critical items**: 1 naming bug (Jam tier), 4 backend param bugs (buyout), 1 missing feature domain (search).

---

## SECTION A: CRITICAL BUGS (P0)

### BUG-1: Jam Tier Naming Mismatch (CRITICAL)

---

## Backend Team Response

**Status**: PARTIALLY RESOLVED (audit complete, some bugs fixed)
**Resolution date**: 2026-03-06
**Summary**: Comprehensive marketing analytics audit completed. Found 11 bugs across 4 domains (funnel, advertising, search, buyout). Critical items: Jam tier naming fixed, buyout parameter bugs addressed, funnel type mismatches corrected. Search analytics domain remains unimplemented on frontend.
**Remaining frontend action**: Build search analytics domain. Verify individual bug fixes listed in audit against current backend.
**Problem**: Backend returns `'advanced'`, frontend type expects `'extended'`.

| Source | Value |
|--------|-------|
| Backend DTO (`jam-status-response.dto.ts`) | `'none' \| 'standard' \| 'advanced'` |
| Frontend type (`src/types/cabinet.ts:112`) | `'none' \| 'standard' \| 'extended'` |
| Backend map (cabinets.controller.ts:322) | `{ none: 0, standard: 30, advanced: 100 }` |

**Impact**: `JAM_TIER_LABELS['advanced']` returns `undefined`. Components `SidebarCabinetInfo` and `CabinetInfoCard` show "undefined" or crash for `advanced` tier users.

**Fix scope**: Frontend only — change `'extended'` to `'advanced'` in:
- `src/types/cabinet.ts` — `JamTier` type, `JAM_TIER_LABELS`, `JAM_TIER_STYLES` (in CabinetInfoCard)
- `src/components/custom/SidebarCabinetInfo.tsx`
- `src/components/custom/settings/CabinetInfoCard.tsx`
- `docs/MARKETING-ANALYTICS-ARCHITECTURE.md` — all references

**OR** backend aligns to frontend (`'advanced'` → `'extended'`). Need team decision.

**Action**: Resolve with backend team — who changes?

---

### BUG-2: Advertising Profit Multiplication (Request #77)

**Problem**: SKUs advertised in multiple campaigns show doubled/tripled profit values. Backend fix pending.

**Impact**: Users see inflated profit numbers for multi-campaign products.

**Frontend mitigation**: Add warning badge/tooltip on affected rows until backend fix deployed.

**Action**: Track backend fix; add frontend disclaimer.

---

## SECTION B: BACKEND BUGS TO REPORT (P1)

### BACKEND-BUG-1: Buyout `sortOrder` / `sortDir` Mismatch

**Endpoint**: `GET /v1/analytics/buyout/by-sku`

**Problem**: Controller passes `sortOrder` but service reads `sortDir`. Sort direction is silently ignored — always defaults to `desc`.

**Evidence**: Controller maps `serviceOptions.sortOrder` but `PerSkuBuyoutService` reads `options.sortDir`.

**Fix scope**: Backend — align controller output key to service input key.

---

### BACKEND-BUG-2: Buyout `minSales` Parameter Not Consumed

**Endpoint**: `GET /v1/analytics/buyout/by-sku`

**Problem**: `minSales` is declared in controller query params but NOT consumed by `PerSkuBuyoutService`. Silently ignored — all SKUs returned regardless of sales count.

**Impact**: Users cannot filter out noise (low-confidence SKUs with <10 sales).

**Fix scope**: Backend — wire `minSales` through to query WHERE clause.

---

### BACKEND-BUG-3: Buyout Sort by `returnRate` / `trend` Not Implemented

**Endpoint**: `GET /v1/analytics/buyout/by-sku`

**Problem**: Only `buyoutRate`, `salesCount`, `nmId` sorting implemented in `PerSkuBuyoutService.sortData()`. `returnRate` and `trend` sort silently no-op (fall through to default).

**Frontend impact**: UI shows sort options that don't actually work.

**Fix scope**: Backend — add sort logic for `returnRate` and `trend` fields.

---

### BACKEND-BUG-4: Search `totalRevenue` Always Zero

**Endpoint**: `GET /v1/analytics/search/by-product`, `/by-query`

**Problem**: Sync processor at line 169 hard-codes `revenue: 0` with comment "search-texts endpoint doesn't return revenue". The `totalRevenue` field in responses will always be 0.

**Impact**: Revenue column in future search analytics UI will show all zeros.

**Fix scope**: Backend — either populate revenue from orders data or remove field from response schema.

**Action**: Clarify with backend: should revenue come from search/orders endpoint join, or is the field placeholder for future WB API support?

---

## SECTION C: FRONTEND TYPE MISMATCHES (P1)

### TYPE-1: Funnel `FunnelProductItem` Missing Sum Fields

**File**: `src/types/analytics-funnel.ts`

**Missing fields** returned by backend:
- `ordersSumRub: number` — orders value in RUB
- `buyoutSumRub: number` — buyout value in RUB
- `cancelSumRub: number` — cancel value in RUB

**Fix**: Add fields to `FunnelProductItem` interface.

---

### TYPE-2: Funnel `FunnelDayItem` Missing Conversion Fields

**File**: `src/types/analytics-funnel.ts`

**Missing fields** returned by backend (day-level rows):
- `cartConversion: number`
- `orderConversion: number`
- `buyoutConversion: number`
- `cancelRate: number`

Currently only has `totalConversion`. Backend reference (test-api line 248-260) shows "same metric fields".

**Fix**: Add conversion fields to `FunnelDayItem` interface.

---

### TYPE-3: Buyout Missing `trendPeriod` Field

**File**: `src/types/analytics-buyout.ts`

**Missing**: `trendPeriod: 'week-1' | 'week-2' | 'week-3' | 'week-4' | null`

Backend returns this field indicating which comparison week was used for trend calculation.

**Fix**: Add `trendPeriod` to `BySkuBuyoutItem` interface.

---

### TYPE-4: Advertising Missing `include_daily` Parameter

**File**: `src/types/advertising-analytics.ts`

**Missing**: `include_daily?: boolean` in `AdvertisingAnalyticsParams`.

Backend supports `include_daily=true` which returns `daily[]` array with per-date breakdown (spend, views, clicks, ctr, cpc, orders, revenueAttributed). Not wired through API client.

**Fix**: Add param to type + API client. Wire daily response type.

---

### TYPE-5: Advertising Missing `profit_after_ads` Sort Option

**File**: `src/types/advertising-analytics.ts`

**Missing**: `'profit_after_ads'` not in `SortField` union type.

Backend supports sorting by `profit_after_ads` but frontend omits it.

**Fix**: Add to `SortField` type.

---

### TYPE-6: Advertising `campaign_count` / `active_campaigns` Always 0

**File**: `src/types/advertising-analytics.ts`

**Problem**: `AdvertisingSummary` interface has `campaign_count` and `active_campaigns` fields but backend summary object does NOT return them — they silently default to 0.

**Fix**: Either remove from frontend type or request backend to populate.

---

## SECTION D: FRONTEND GAPS — SEARCH ANALYTICS (P0, New Build)

### SEARCH-1: Full Search Analytics Implementation (0% → 100%)

**Backend ready** (Task-139 Complete): 3 endpoints, zero frontend code.

| Endpoint | Purpose | Params |
|----------|---------|--------|
| `GET /v1/analytics/search/by-product` | Queries driving traffic to a product | `nmId` (required), `from`, `to`, `orderBy`, `limit` |
| `GET /v1/analytics/search/by-query` | Products ranking for a search term | `query` (required, ILIKE), `from`, `to`, `limit` |
| `GET /v1/analytics/search/orders` | Orders attributed to search | `from`, `to`, `groupBy` (query/product/day), `limit` |

**Files needed** (from Architecture doc — validated as accurate):
- `src/types/search-analytics.ts` — types for all 3 endpoints
- `src/lib/api/search-analytics.ts` — API client functions
- `src/hooks/use-search-analytics.ts` — 3 TanStack Query hooks
- `src/components/custom/RequireJam.tsx` — Jam tier gating wrapper
- `src/app/(dashboard)/analytics/search/page.tsx` — page + 3-tab layout
- 5+ component files for tabs (ByProductTab, ByQueryTab, OrdersTab)
- Test files for hooks and API client

**Jam gating**: Frontend-only (backend returns empty data for non-Jam users, no 403). `RequireJam` component checks `useJamStatus().data.tier` and shows upgrade prompt if insufficient.

**Note on BUG-1**: Must fix Jam tier naming (`advanced` vs `extended`) before implementing RequireJam.

---

## SECTION E: FRONTEND GAPS — EXISTING PAGES (P1-P2)

### FUNNEL-GAP-1: brandName Column Not Shown (P2)

**File**: `src/app/(dashboard)/analytics/funnel/components/FunnelTable.tsx`

Backend returns `brandName` per product item but table doesn't display it. Users see `nmId + vendorCode` without brand context.

**Fix**: Add `brandName` column between `vendorCode` and `openCardCount`.

---

### FUNNEL-GAP-2: Summary Cards Underutilized (P2)

**File**: `src/app/(dashboard)/analytics/funnel/components/FunnelSummaryCards.tsx`

Shows only 4 metrics (views, orders, buyouts, totalConversion) out of 13 available in summary response.

**Opportunity**: Add cards for: `addToCartCount`, `cancelCount`, `buyoutSumRub`, `cartConversion`, `orderConversion`.

---

### FUNNEL-GAP-3: No Period Comparison (P2)

No WoW/MoM comparison. Users cannot see funnel performance trends across time periods.

**Fix**: Add `useFunnelComparison` hook fetching 2 periods in parallel, show delta arrows on summary cards.

---

### FUNNEL-GAP-4: nmIds Filter Not Exposed (P2)

Backend accepts `nmIds` param for product filtering but UI has no product search/filter input.

**Fix**: Add product search combobox above table.

---

### BUYOUT-GAP-1: BuyoutTable.tsx Exceeds 200-Line Limit (P2)

**File**: `src/app/(dashboard)/analytics/buyout/components/BuyoutTable.tsx` (216 lines)

Exceeds ESLint 200-line rule.

**Fix**: Extract column definitions or cell renderers to separate file.

---

### BUYOUT-GAP-2: Hook in Wrong Directory (P3)

**File**: `src/hooks-v1/use-buyout-analytics.ts`

Should be in `src/hooks/` per project conventions. Other epic hooks use `hooks/` or `hooks-v1/` inconsistently.

---

### BUYOUT-GAP-3: Product Enrichment 200-Cap (P2)

`useProducts({ limit: 200 })` in BuyoutTable caps product name/brand resolution. Catalogs with 200+ SKUs show incomplete data.

**Fix**: Use dedicated products-by-nmIds API or remove cap.

---

### ADV-GAP-1: `include_daily` Not Wired (P1)

Backend supports `include_daily=true` returning per-date advertising breakdown. Enables inline daily trend charts on advertising page.

**Fix**: Wire param through API client, add daily chart component.

---

### ADV-GAP-2: `dataGaps` in Sync Status Not Visualized (P2)

Backend returns `Array<{ from, to, missingDays }>` but no UI renders gaps.

**Fix**: Add timeline visualization showing sync coverage.

---

### ADV-GAP-3: Negative `organicSales` Unhandled (P2)

WB over-attribution can make `organicSales` negative. Frontend shows tooltip but no filtering.

**Fix**: Add summary-level count of over-attributed items, option to filter.

---

## SECTION F: NEW CAPABILITIES NOT IN PLAN (P2-P3)

### NEW-1: Three-Layer Ad Cost Discrepancy (P3)

Backend has 3 layers of ad cost data:
1. `adv_daily_stats.spend` — what platform reports
2. `adv_daily_costs.upd_sum` — corrected daily costs
3. `wb_finance_raw.corrections` — what WB actually deducted

Could show comparison: "Расход по рекламному кабинету" vs "Фактическое удержание WB".

---

### NEW-2: Search + Advertising Cross-Reference (P2)

Combine `search/by-product` + `advertising/by-sku` for same nmId:
- Which keywords are organic vs paid
- Search position vs ad spend correlation
- Organic traffic share: `organic_views = funnel.openCardCount - adv.views`

No additional backend needed.

---

### NEW-3: Funnel + Advertising Overlay (P2)

Overlay daily ad spend on funnel chart as secondary axis. Shows correlation between ad spending and funnel metric changes.

---

### NEW-4: Advertising Daily Trend Charts (P1)

`include_daily=true` enables per-date spend/clicks/orders/ROAS charts. Currently blocked only by missing frontend param wiring (ADV-GAP-1).

---

## SECTION G: CONSOLIDATED BACKLOG

### P0 — Critical (Fix Before New Features)

| ID | Task | Type | Effort |
|----|------|------|--------|
| BUG-1 | Fix Jam tier `extended` → `advanced` naming | Bug fix | 1 SP |
| SEARCH-1 | Implement Search Analytics page (types + API + hooks + components) | New feature | 13 SP |

### P1 — High Priority

| ID | Task | Type | Effort |
|----|------|------|--------|
| BACKEND-BUG-1 | Report: Buyout `sortOrder`/`sortDir` mismatch | Backend request | — |
| BACKEND-BUG-2 | Report: Buyout `minSales` not consumed | Backend request | — |
| BACKEND-BUG-3 | Report: Buyout `returnRate`/`trend` sort no-op | Backend request | — |
| BACKEND-BUG-4 | Clarify: Search `totalRevenue` always 0 | Backend request | — |
| TYPE-1 | Add sum fields to `FunnelProductItem` | Type fix | 0.5 SP |
| TYPE-2 | Add conversion fields to `FunnelDayItem` | Type fix | 0.5 SP |
| TYPE-3 | Add `trendPeriod` to `BySkuBuyoutItem` | Type fix | 0.5 SP |
| TYPE-4 | Add `include_daily` to advertising params | Type fix + wiring | 2 SP |
| TYPE-5 | Add `profit_after_ads` to advertising sort | Type fix | 0.5 SP |
| ADV-GAP-1 | Wire `include_daily` + daily trend charts | Enhancement | 3 SP |
| BUG-2 | Add profit multiplication disclaimer | UX fix | 1 SP |

### P2 — Medium Priority

| ID | Task | Type | Effort |
|----|------|------|--------|
| FUNNEL-GAP-1 | Add brandName column to FunnelTable | Enhancement | 1 SP |
| FUNNEL-GAP-2 | Expand summary cards (4 → 8 metrics) | Enhancement | 2 SP |
| FUNNEL-GAP-3 | Add period comparison (WoW) | Feature | 3 SP |
| FUNNEL-GAP-4 | Add nmIds product filter | Enhancement | 2 SP |
| BUYOUT-GAP-1 | Split BuyoutTable.tsx (>200 lines) | Refactor | 1 SP |
| BUYOUT-GAP-3 | Fix product enrichment 200-cap | Bug fix | 1 SP |
| ADV-GAP-2 | Visualize sync data gaps | Enhancement | 2 SP |
| ADV-GAP-3 | Handle negative organicSales | Enhancement | 1 SP |
| NEW-2 | Search + Advertising cross-reference | Feature | 5 SP |
| NEW-3 | Funnel + Advertising chart overlay | Enhancement | 3 SP |
| TYPE-6 | Remove or populate campaign_count fields | Cleanup | 0.5 SP |

### P3 — Low Priority

| ID | Task | Type | Effort |
|----|------|------|--------|
| BUYOUT-GAP-2 | Move hook from hooks-v1/ to hooks/ | Refactor | 0.5 SP |
| NEW-1 | Three-layer ad cost discrepancy view | Feature | 5 SP |

---

## Reference: Existing Frontend Files by Domain

### Funnel Analytics (Complete)
- `src/types/analytics-funnel.ts` (79 lines)
- `src/lib/api/funnel-analytics.ts` (65 lines)
- `src/hooks/use-funnel-analytics.ts` (59 lines)
- `src/app/(dashboard)/analytics/funnel/page.tsx`
- `src/app/(dashboard)/analytics/funnel/components/FunnelPageContent.tsx` (108 lines)
- `src/app/(dashboard)/analytics/funnel/components/FunnelSummaryCards.tsx` (94 lines)
- `src/app/(dashboard)/analytics/funnel/components/FunnelTable.tsx` (199 lines)
- `src/app/(dashboard)/analytics/funnel/components/FunnelChart.tsx` (109 lines)

### Advertising Analytics (Complete)
- `src/types/advertising-analytics.ts` (539 lines)
- `src/types/advertising-sync-status.ts`
- `src/types/efficiency-filter.ts`
- `src/lib/api/advertising-analytics.ts`
- `src/lib/transformers/advertising-transformers.ts`
- `src/lib/efficiency-utils.ts`, `campaign-utils.ts`, `sync-status-config.ts`
- `src/hooks-v1/advertising/hooks.ts`, `helpers.ts`, + 4 specialized hooks
- `src/app/(dashboard)/analytics/advertising/` — 20+ component files

### Search Analytics (NOT IMPLEMENTED)
- Zero frontend files
- Backend: 3 endpoints fully functional (Task-139)
- Jam gating: frontend-only (backend returns empty data, no 403)

### Buyout Analytics (6/7 Stories Complete)
- `src/types/analytics-buyout.ts` (77 lines)
- `src/lib/api/buyout-analytics.ts` (91 lines)
- `src/lib/api/__tests__/buyout-analytics.test.ts` (253 lines)
- `src/hooks-v1/use-buyout-analytics.ts` (49 lines)
- `src/app/(dashboard)/analytics/buyout/page.tsx`
- `src/app/(dashboard)/analytics/buyout/components/` — 4 component files
- `src/components/custom/dashboard/BuyoutRateCard.tsx` (171 lines)
- Missing: Story 69.7-FE component tests

---

## Related Documents

- `docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md` — PM feature roadmap
- `docs/MARKETING-ANALYTICS-ARCHITECTURE.md` — Technical implementation plan
- `docs/DATA-SOURCES-REFERENCE.md` — ROAS/storage data source documentation
- Backend: `test-api/29-funnel-analytics.http`, `test-api/34-search-analytics.http`
- Backend: `docs/API-PATHS-REFERENCE.md` (lines 6296-6408 funnel, search, advertising, buyout)

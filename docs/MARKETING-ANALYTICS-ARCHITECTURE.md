# Marketing Analytics Architecture Plan

Technical architecture for search analytics, unified product analytics, and marketing feature expansion in the WB Repricer frontend.

**Author**: Winston (System Architect)
**Date**: 2026-03-06
**Status**: Audit Complete — Updated with Backend API Deep-Dive (2026-03-06)
**Audit Reference**: `docs/request-backend/160-MARKETING-ANALYTICS-AUDIT-BACKLOG.md`

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Backend API Coverage Gap Analysis](#2-backend-api-coverage-gap-analysis)
3. [Search Analytics Architecture](#3-search-analytics-architecture)
4. [Jam Subscription Gating Architecture](#4-jam-subscription-gating-architecture)
5. [File Structure Plan](#5-file-structure-plan)
6. [Data Flow Diagrams](#6-data-flow-diagrams)
7. [Component Hierarchy](#7-component-hierarchy)
8. [Implementation Phases](#8-implementation-phases)
9. [Dependencies & Risks](#9-dependencies--risks)

---

## 1. Current State Assessment

### 1.1 Implemented Marketing Analytics Pages

| Page | Route | Epic | API Connected | Status |
|------|-------|------|---------------|--------|
| Funnel | `/analytics/funnel` | Epic 68 | `/v1/analytics/funnel` | Fully functional |
| Buyout | `/analytics/buyout` | Epic 69 | `/v1/analytics/buyout/by-sku`, `/summary` | Fully functional |
| Returns | `/analytics/returns` | Epic 71 | `/v1/analytics/returns/reasons`, `/by-sku` | Fully functional |
| Advertising | `/analytics/advertising` | Epic 33/35/36 | `/v1/analytics/advertising`, `/campaigns`, `/sync-status` | Fully functional |

### 1.2 Existing Frontend Layer Inventory

**Types** (all in `src/types/`):
- `analytics-funnel.ts` -- FunnelProductItem, FunnelDayItem, FunnelSummary, FunnelParams, FunnelResponse
- `analytics-buyout.ts` -- BySkuBuyoutItem, BuyoutSummaryResponse, BuyoutBySkuParams
- `analytics-returns.ts` -- ReturnCategoryItem, ReturnReasonsResponse, BySkuReturnItem
- `advertising-analytics.ts` -- AdvertisingAnalyticsParams/Response, CampaignsParams/Response
- `advertising-sync-status.ts` -- SyncStatusResponse
- `efficiency-filter.ts` -- EfficiencyFilter type
- `cabinet.ts` -- JamTier, JamStatusResponse, SellerInfoResponse

**API modules** (all in `src/lib/api/`):
- `funnel-analytics.ts` -- getFunnelData, getFunnelSyncStatus, funnelQueryKeys
- `buyout-analytics.ts` -- getBuyoutBySku, getBuyoutSummary, buyoutQueryKeys
- `return-analytics.ts` -- getReturnReasons, getReturnsBySku, returnQueryKeys
- `advertising-analytics.ts` -- getAdvertisingAnalytics, getAdvertisingCampaigns, getAdvertisingSyncStatus
- `cabinet.ts` -- getJamStatus, getSellerInfo

**Hooks** (all in `src/hooks/`):
- `use-funnel-analytics.ts` -- useFunnelData, useFunnelTimeSeries, useFunnelSyncStatus
- `use-buyout-analytics.ts` -- useBuyoutBySku, useBuyoutSummary
- `use-return-analytics.ts` -- useReturnReasons, useReturnsBySku
- `advertising/hooks.ts` -- useAdvertisingAnalytics, useAdvertisingCampaigns, useAdvertisingSyncStatus, useAdvertisingMergedGroups
- `useJamStatus.ts` -- useJamStatus (returns tier, searchTextsLimit)
- `useSellerInfo.ts` -- useSellerInfo (returns name, sid, trademark)

**Utility files** (in `src/lib/`):
- `campaign-utils.ts` -- Campaign status helpers
- `efficiency-utils.ts` -- ROAS/efficiency categorization
- `efficiency-filter-config.ts` -- Filter configuration

### 1.3 Jam Subscription Status

The `useJamStatus` hook and `SidebarCabinetInfo` component are already wired:
- `SidebarCabinetInfo.tsx` shows the Jam badge (none/standard/extended) in the sidebar
- `JamTier` type and `JAM_TIER_LABELS` are defined in `src/types/cabinet.ts`
- Settings page at `/settings/cabinet` shows full cabinet info

**Key data point**: `JamStatusResponse.searchTextsLimit` -- indicates the number of search text queries allowed, which directly gates search analytics features.

### 1.4 Navigation State

The sidebar (`src/components/custom/Sidebar.tsx`) and analytics hub (`src/app/(dashboard)/analytics/page.tsx`) have entries for funnel, buyout, and returns but **no entry for search analytics** yet.

The routes file (`src/lib/routes.ts`) has `ANALYTICS.FUNNEL`, `ANALYTICS.BUYOUT`, `ANALYTICS.RETURNS` but **no `ANALYTICS.SEARCH`** constant.

---

## 2. Backend API Coverage Gap Analysis

### 2.1 Endpoints WITH Frontend Integration

| Endpoint | Frontend Module | Hook |
|----------|----------------|------|
| `GET /v1/analytics/funnel` | `funnel-analytics.ts` | `useFunnelData` |
| `GET /v1/analytics/funnel/sync-status` | `funnel-analytics.ts` | `useFunnelSyncStatus` |
| `GET /v1/analytics/buyout/by-sku` | `buyout-analytics.ts` | `useBuyoutBySku` |
| `GET /v1/analytics/buyout/summary` | `buyout-analytics.ts` | `useBuyoutSummary` |
| `GET /v1/analytics/returns/reasons` | `return-analytics.ts` | `useReturnReasons` |
| `GET /v1/analytics/returns/reasons/by-sku` | `return-analytics.ts` | `useReturnsBySku` |
| `GET /v1/analytics/advertising` | `advertising-analytics.ts` | `useAdvertisingAnalytics` |
| `GET /v1/analytics/advertising/campaigns` | `advertising-analytics.ts` | `useAdvertisingCampaigns` |
| `GET /v1/analytics/advertising/sync-status` | `advertising-analytics.ts` | `useAdvertisingSyncStatus` |
| `GET /v1/cabinets/:id/jam-status` | `cabinet.ts` | `useJamStatus` |
| `GET /v1/cabinets/:id/seller-info` | `cabinet.ts` | `useSellerInfo` |

### 2.2 Endpoints WITHOUT Frontend Integration (Gaps)

| Endpoint | Backend Status | Priority | Jam Gated? |
|----------|---------------|----------|------------|
| `GET /v1/analytics/search/by-product` | Task-139 COMPLETE | **P0** | Yes (extended tier) |
| `GET /v1/analytics/search/by-query` | Task-139 COMPLETE | **P0** | Yes (extended tier) |
| `GET /v1/analytics/search/orders` | Task-139 COMPLETE | **P0** | Yes (extended tier) |
| `GET /v1/analytics/funnel/summary` | Fix #4 alias COMPLETE | P2 | No |
| `GET /v1/analytics/funnel/by-sku` | Fix #4 alias COMPLETE | P2 | No |
| `GET /v1/analytics/returns/summary` | Fix #3 alias COMPLETE | P2 | No |
| `GET /v1/analytics/returns/by-sku` | Fix #3 alias COMPLETE | P2 | No |
| `GET /v1/analytics/product/:nmId/unified` | **NOT registered** in module | P1 | Yes (requires funnel data) |
| `GET /v1/analytics/product/:nmId/organic-share` | **NOT registered** in module | P1 | Yes (requires funnel data) |

**Key finding**: The three search analytics endpoints (`/v1/analytics/search/*`) are fully implemented on the backend (Task-139 COMPLETE) but have **zero frontend integration**. No types, no API module, no hooks, no page, no route.

The unified product analytics and organic-share endpoints are backend services that exist but are NOT yet wired to routes in the backend's `analytics.module.ts`.

---

## 3. Search Analytics Architecture

### 3.1 Type Definitions

File: `src/types/search-analytics.ts`

```typescript
/** GET /v1/analytics/search/by-product response */
export interface SearchByProductResponse {
  nmId: number
  period: { from: string; to: string }
  queries: SearchQueryItem[]
  totalQueries: number
}

export interface SearchQueryItem {
  searchQuery: string
  avgPosition: number
  totalImpressions: number
  totalClicks: number
  avgCtr: number
  totalOrders: number
  totalRevenue: number
}

/** GET /v1/analytics/search/by-query response */
export interface SearchByQueryResponse {
  query: string
  period: { from: string; to: string }
  products: SearchProductItem[]
  totalProducts: number
}

export interface SearchProductItem {
  nmId: number
  vendorCode: string | null
  avgPosition: number
  totalImpressions: number
  totalClicks: number
  avgCtr: number
  totalOrders: number
  totalRevenue: number
}

/** GET /v1/analytics/search/orders response */
export interface SearchOrdersResponse {
  period: { from: string; to: string }
  groupBy: SearchOrdersGroupBy
  items: SearchOrdersItem[]
  summary: SearchOrdersSummary
}

export type SearchOrdersGroupBy = 'query' | 'product' | 'day'

export interface SearchOrdersItem {
  key: string | number    // query text, nmId, or date depending on groupBy
  vendorCode?: string     // only for groupBy=product
  totalOrders: number
  totalRevenue: number
  uniqueProducts?: number // for groupBy=query and groupBy=day
  uniqueQueries?: number  // for groupBy=product and groupBy=day
}

export interface SearchOrdersSummary {
  totalSearchOrders: number
  totalSearchRevenue: number
  searchOrderShare: number  // percentage of all orders from search
}

/** Query params */
export interface SearchByProductParams {
  nmId: number
  from: string
  to: string
  orderBy?: 'totalImpressions' | 'totalClicks' | 'avgPosition' | 'avgCtr' | 'totalOrders' | 'totalRevenue'
  limit?: number  // 1-100, default 50
}

export interface SearchByQueryParams {
  query: string
  from: string
  to: string
  limit?: number  // 1-100, default 50
}

export interface SearchOrdersParams {
  from: string
  to: string
  groupBy?: SearchOrdersGroupBy
  limit?: number  // 1-100, default 50
}
```

### 3.2 API Client

File: `src/lib/api/search-analytics.ts`

Three functions:
- `getSearchByProduct(params: SearchByProductParams): Promise<SearchByProductResponse>`
- `getSearchByQuery(params: SearchByQueryParams): Promise<SearchByQueryResponse>`
- `getSearchOrders(params: SearchOrdersParams): Promise<SearchOrdersResponse>`

Plus `searchQueryKeys` factory and `SEARCH_CACHE` config (staleTime: 4 min, gcTime: 30 min -- matching backend 5-min Redis TTL).

All use `apiClient.get()` with `skipDataUnwrap: true` (consistent with funnel/buyout/return patterns).

### 3.3 Hooks

File: `src/hooks/use-search-analytics.ts`

```
useSearchByProduct(nmId, from, to, params?)  -- enabled when nmId && from && to
useSearchByQuery(query, from, to, params?)   -- enabled when query && from && to
useSearchOrders(from, to, params?)           -- enabled when from && to
```

### 3.4 Page Structure

Route: `/analytics/search`

```
src/app/(dashboard)/analytics/search/
  page.tsx                              -- Server component wrapper
  components/
    SearchPageContent.tsx               -- Client orchestrator (date picker, tab selection)
    SearchOrdersSummaryCards.tsx         -- Summary cards (total search orders, revenue, share)
    SearchByQueryTab.tsx                -- Tab: "top queries -> products" table
    SearchByProductTab.tsx              -- Tab: "select product -> queries driving traffic"
    SearchOrdersTab.tsx                 -- Tab: "search orders" (groupBy toggle: query/product/day)
    SearchOrdersChart.tsx               -- Time series chart (groupBy=day)
    JamGateBanner.tsx                   -- Shared: paywall/upgrade prompt for non-Jam users
```

---

## 4. Jam Subscription Gating Architecture

### 4.1 Gating Strategy

Search analytics endpoints require Jam subscription (standard or extended tier). The frontend must:

1. **Check Jam tier** via existing `useJamStatus(cabinetId)` hook
2. **Conditionally render** either the full page or an upgrade prompt
3. **Disable navigation items** for users without subscription

### 4.2 Shared Gating Component

File: `src/components/custom/JamGateBanner.tsx`

```typescript
interface JamGateBannerProps {
  requiredTier: 'standard' | 'extended'
  featureName: string          // "Поисковая аналитика"
  featureDescription: string   // What they'd get
}
```

This component:
- Uses `useJamStatus()` internally
- Shows loading skeleton while checking
- If tier sufficient: renders `children` (slot pattern)
- If tier insufficient: shows a branded card explaining the feature, Jam tier required, and a link to `/settings/cabinet`

### 4.3 Gating Wrapper Component

File: `src/components/custom/RequireJam.tsx`

```typescript
interface RequireJamProps {
  tier: 'standard' | 'extended'
  children: React.ReactNode
  featureName: string
  featureDescription?: string
}

export function RequireJam({ tier, children, featureName, featureDescription }: RequireJamProps) {
  const cabinetId = useAuthStore(state => state.cabinetId)
  const { data: jamStatus, isLoading } = useJamStatus(cabinetId ?? '')

  if (isLoading) return <Skeleton />
  if (!jamStatus || tierLevel(jamStatus.tier) < tierLevel(tier)) {
    return <JamGateBanner requiredTier={tier} featureName={featureName} ... />
  }
  return <>{children}</>
}

function tierLevel(tier: JamTier): number {
  return tier === 'extended' ? 2 : tier === 'standard' ? 1 : 0
}
```

### 4.4 Sidebar Gating

In `Sidebar.tsx`, search analytics nav item should:
- Always be visible (to create awareness)
- Show a small lock icon or "Джем" badge when user lacks subscription
- Link normally regardless -- the page itself handles the gate

---

## 5. File Structure Plan

### 5.1 New Files to Create

```
src/types/search-analytics.ts                              -- Type definitions

src/lib/api/search-analytics.ts                            -- API client + query keys

src/hooks/use-search-analytics.ts                          -- React Query hooks

src/components/custom/RequireJam.tsx                        -- Jam tier gate wrapper
src/components/custom/JamGateBanner.tsx                     -- Upgrade prompt UI

src/app/(dashboard)/analytics/search/
  page.tsx                                                 -- Page entry point
  loading.tsx                                              -- Loading skeleton
  components/
    SearchPageContent.tsx                                   -- Orchestrator
    SearchOrdersSummaryCards.tsx                            -- KPI cards
    SearchByQueryTab.tsx                                    -- Query analysis table
    SearchByProductTab.tsx                                  -- Product query analysis
    SearchOrdersTab.tsx                                     -- Orders breakdown
    SearchOrdersChart.tsx                                   -- Daily time series chart
```

### 5.2 Existing Files to Modify

| File | Change |
|------|--------|
| `src/lib/routes.ts` | Add `SEARCH: '/analytics/search'` to `ANALYTICS` object; add to `isProtectedRoute` |
| `src/components/custom/Sidebar.tsx` | Add search analytics nav item with `Search` lucide icon |
| `src/app/(dashboard)/analytics/page.tsx` | Add search analytics card to `analyticsNavigation.operational` or new `marketing` group |
| `src/components/custom/Sidebar.test.tsx` | Add test for new nav item |

### 5.3 Test Files to Create

```
src/types/__tests__/search-analytics.test.ts               -- Type guard tests
src/lib/api/__tests__/search-analytics.test.ts             -- API module tests
src/hooks/__tests__/use-search-analytics.test.ts           -- Hook tests
src/app/(dashboard)/analytics/search/__tests__/page.test.tsx
src/components/custom/__tests__/RequireJam.test.tsx
```

---

## 6. Data Flow Diagrams

### 6.1 Search By Product Flow

```
SearchByProductTab
  |-- useSearchByProduct(selectedNmId, from, to)
  |     |-- searchQueryKeys.byProduct({nmId, from, to})
  |     |-- getSearchByProduct(params)
  |           |-- apiClient.get('/v1/analytics/search/by-product?...')
  |                 |-- Auto-injects Authorization + X-Cabinet-Id headers
  |
  |-- Product selector (from useProducts hook)
  |-- Sortable table: searchQuery, avgPosition, impressions, clicks, CTR, orders, revenue
```

### 6.2 Search By Query Flow

```
SearchByQueryTab
  |-- useSearchByQuery(searchInput, from, to)
  |     |-- searchQueryKeys.byQuery({query, from, to})
  |     |-- getSearchByQuery(params)
  |           |-- apiClient.get('/v1/analytics/search/by-query?...')
  |
  |-- Text input with debounce (300ms)
  |-- Sortable table: nmId, vendorCode, avgPosition, impressions, clicks, CTR, orders, revenue
```

### 6.3 Search Orders Flow

```
SearchOrdersTab
  |-- useSearchOrders(from, to, { groupBy })
  |     |-- searchQueryKeys.orders({from, to, groupBy})
  |     |-- getSearchOrders(params)
  |           |-- apiClient.get('/v1/analytics/search/orders?...')
  |
  |-- GroupBy toggle: query | product | day
  |-- Summary cards: totalSearchOrders, totalSearchRevenue, searchOrderShare%
  |-- Table or chart depending on groupBy mode
  |     |-- groupBy=day -> SearchOrdersChart (line chart)
  |     |-- groupBy=query -> Table with key(query), orders, revenue, uniqueProducts
  |     |-- groupBy=product -> Table with key(nmId), vendorCode, orders, revenue, uniqueQueries
```

### 6.4 Jam Gate Flow

```
SearchPage
  |-- RequireJam tier="standard"
  |     |-- useJamStatus(cabinetId)
  |     |     |-- jamStatusKeys.byId(cabinetId)
  |     |     |-- getJamStatus(cabinetId)
  |     |           |-- apiClient.get('/v1/cabinets/:id/jam-status')
  |     |
  |     |-- tier >= standard? -> render SearchPageContent
  |     |-- tier < standard?  -> render JamGateBanner
  |           |-- "Для доступа к поисковой аналитике необходима подписка Джем"
  |           |-- Link to /settings/cabinet
```

---

## 7. Component Hierarchy

### 7.1 Search Analytics Page

```
SearchPage (server component)
  RequireJam tier="standard" featureName="Поисковая аналитика"
    SearchPageContent (client component)
      |-- Page header + description
      |-- DateRangePickerExtended (reuse existing)
      |-- Tabs component (shadcn/ui)
      |     |-- Tab "Поиск по запросам" -> SearchByQueryTab
      |     |-- Tab "Запросы товара"    -> SearchByProductTab
      |     |-- Tab "Заказы из поиска"  -> SearchOrdersTab
      |
      SearchByQueryTab
        |-- Input (debounced search text)
        |-- Table (sortable columns)
        |-- Empty state when no query entered

      SearchByProductTab
        |-- Product selector (Combobox from existing useProducts)
        |-- Table (sortable, paginated - limit 50, max 100)
        |-- Empty state when no product selected

      SearchOrdersTab
        |-- SearchOrdersSummaryCards (3 KPI cards)
        |-- GroupByToggle (query | product | day)
        |-- Conditional: table or chart
        |-- SearchOrdersChart (when groupBy=day)
```

### 7.2 Component Sizing (200-line limit)

Each component is designed to stay under the project's 200-line ESLint limit:

| Component | Est. Lines | Notes |
|-----------|-----------|-------|
| `SearchPageContent.tsx` | ~80 | Tab orchestrator + date state |
| `SearchOrdersSummaryCards.tsx` | ~90 | 3 metric cards (pattern from FunnelSummaryCards) |
| `SearchByQueryTab.tsx` | ~120 | Input + debounce + table |
| `SearchByProductTab.tsx` | ~130 | Product selector + table |
| `SearchOrdersTab.tsx` | ~100 | GroupBy toggle + summary + table/chart switch |
| `SearchOrdersChart.tsx` | ~80 | Recharts line chart (same pattern as FunnelChart) |
| `RequireJam.tsx` | ~50 | Gate wrapper |
| `JamGateBanner.tsx` | ~70 | Upgrade prompt card |

---

## 8. Implementation Phases

### Phase 1: Types + API + Hooks (Foundation)

**Sprint points**: 5
**Files**: 3 new files
**Dependencies**: None (backend ready)

1. Create `src/types/search-analytics.ts` -- all type definitions
2. Create `src/lib/api/search-analytics.ts` -- API client, query keys, cache config
3. Create `src/hooks/use-search-analytics.ts` -- 3 hooks

**Validation**: Unit tests for types, API mock tests, hook tests.

### Phase 2: Jam Gating Components

**Sprint points**: 3
**Files**: 2 new, 0 modified
**Dependencies**: Phase 1 (uses useJamStatus)

1. Create `src/components/custom/JamGateBanner.tsx`
2. Create `src/components/custom/RequireJam.tsx`

**Validation**: Unit tests with mocked Jam status (none/standard/extended scenarios).

### Phase 3: Search Analytics Page

**Sprint points**: 13
**Files**: 8 new, 3 modified
**Dependencies**: Phase 1 + Phase 2

1. Create page structure (`page.tsx`, `loading.tsx`, all 6 components)
2. Modify `src/lib/routes.ts` -- add `ANALYTICS.SEARCH`
3. Modify `src/components/custom/Sidebar.tsx` -- add nav item
4. Modify `src/app/(dashboard)/analytics/page.tsx` -- add navigation card

**Validation**: E2E test with Playwright (requires backend running + Jam-enabled cabinet).

### Phase 4: Polish & Edge Cases

**Sprint points**: 5
**Files**: Tests + minor fixes
**Dependencies**: Phase 3

1. Empty state handling (no search data, no Jam subscription)
2. Error boundaries for API failures
3. Loading skeletons for each tab
4. Keyboard navigation (tab switching, table sorting)
5. WCAG 2.1 AA compliance (contrast, ARIA labels, focus indicators)

### Total: 26 SP across 4 phases

---

## 9. Dependencies & Risks

### 9.1 Hard Dependencies

| Dependency | Status | Risk |
|-----------|--------|------|
| Backend search endpoints (Task-139) | COMPLETE | None |
| `useJamStatus` hook | COMPLETE | None |
| `useSellerInfo` hook | COMPLETE | None |
| `apiClient` with auto auth headers | COMPLETE | None |
| `DateRangePickerExtended` component | COMPLETE | None |
| shadcn/ui Tabs component | Available | None |

### 9.2 Future Dependencies (Phase 2+ of marketing analytics)

| Feature | Backend Status | Notes |
|---------|---------------|-------|
| Unified Product Analytics (`/v1/analytics/product/:nmId/unified`) | Service exists, route NOT registered | Blocked on backend route wiring |
| Organic Share Widget (`/v1/analytics/product/:nmId/organic-share`) | Service exists, route NOT registered | Blocked on backend route wiring |
| Search data enrichment in funnel (`topSearchQueries`) | Mentioned in API docs | Would enhance existing funnel page |

### 9.3 Risks

1. **Jam tier detection latency**: The probe calls are expensive (noted in hook comments). The 5-min staleTime means first page load may show a brief loading state. Mitigation: Jam status is fetched in `SidebarCabinetInfo` on every dashboard load, so it's likely already cached by the time user navigates to search analytics.

2. **Search data availability**: The `search_analytics_sync` pipeline must have run for the cabinet. If no data exists, all three endpoints return empty results. The page must handle empty states gracefully with a "Данные ещё не загружены" message + sync trigger option.

3. **200-line file limit**: The `SearchByProductTab` with product selector + sortable table + pagination may push close to the limit. If necessary, extract the product selector into a separate `ProductSearchSelector.tsx` component.

4. **Backend unified/organic-share endpoints not registered**: These are NOT available for frontend integration yet. Do not build frontend for them until backend confirms route registration. File a backend request if needed.

---

## Appendix A: Backend Response Shape Reference

### Search By Product

```json
{
  "nmId": 148190182,
  "period": { "from": "2026-02-01", "to": "2026-03-05" },
  "queries": [
    {
      "searchQuery": "some search text",
      "avgPosition": 12.5,
      "totalImpressions": 5000,
      "totalClicks": 250,
      "avgCtr": 5.0,
      "totalOrders": 15,
      "totalRevenue": 75000.0
    }
  ],
  "totalQueries": 42
}
```

### Search By Query

```json
{
  "query": "search text",
  "period": { "from": "2026-02-01", "to": "2026-03-05" },
  "products": [
    {
      "nmId": 123456,
      "vendorCode": "ABC-123",
      "avgPosition": 12.3,
      "totalImpressions": 5000,
      "totalClicks": 250,
      "avgCtr": 5.0,
      "totalOrders": 30,
      "totalRevenue": 15000.5
    }
  ],
  "totalProducts": 120
}
```

### Search Orders (groupBy=query)

```json
{
  "period": { "from": "2026-02-01", "to": "2026-03-05" },
  "groupBy": "query",
  "items": [
    {
      "key": "search text",
      "totalOrders": 25,
      "totalRevenue": 125000.0,
      "uniqueProducts": 5
    }
  ],
  "summary": {
    "totalSearchOrders": 150,
    "totalSearchRevenue": 750000.0,
    "searchOrderShare": 45.5
  }
}
```

### Search Orders (groupBy=product)

Items shape: `{ "key": 12345, "vendorCode": "ART-001", "totalOrders": 30, "totalRevenue": 150000.0, "uniqueQueries": 8 }`

### Search Orders (groupBy=day)

Items shape: `{ "key": "2026-03-01", "totalOrders": 50, "totalRevenue": 250000.0, "uniqueQueries": 20, "uniqueProducts": 10 }`

---

## Appendix B: Existing Pattern References

When implementing, follow the exact patterns established in:

| Pattern | Reference File |
|---------|---------------|
| API client structure | `src/lib/api/funnel-analytics.ts` |
| Hook structure | `src/hooks/use-funnel-analytics.ts` |
| Page orchestrator | `src/app/(dashboard)/analytics/funnel/components/FunnelPageContent.tsx` |
| Summary cards | `src/app/(dashboard)/analytics/funnel/components/FunnelSummaryCards.tsx` |
| Data table with sorting | `src/app/(dashboard)/analytics/funnel/components/FunnelTable.tsx` |
| Time series chart | `src/app/(dashboard)/analytics/funnel/components/FunnelChart.tsx` |
| Date range picker usage | All marketing analytics pages use `DateRangePickerExtended` with 30-day default |
| Sidebar nav item | `src/components/custom/Sidebar.tsx` (follow existing icon + label pattern) |
| Route constant | `src/lib/routes.ts` ANALYTICS section |
| Analytics hub card | `src/app/(dashboard)/analytics/page.tsx` NavigationCard pattern |

---

## Appendix C: Backend API Audit Findings (2026-03-06)

Full audit results in `docs/request-backend/160-MARKETING-ANALYTICS-AUDIT-BACKLOG.md`.

### Critical: Jam Tier Naming Mismatch

Backend returns `'advanced'`, this doc and frontend types use `'extended'`. All `RequireJam` tier checks must use `'advanced'`. Fix `JamTier` type before implementing search analytics.

### Type Corrections Required Before Implementation

| File | Issue |
|------|-------|
| `src/types/cabinet.ts` | `JamTier`: rename `'extended'` to `'advanced'` |
| `src/types/analytics-funnel.ts` | `FunnelProductItem`: add `ordersSumRub`, `buyoutSumRub`, `cancelSumRub` |
| `src/types/analytics-funnel.ts` | `FunnelDayItem`: add `cartConversion`, `orderConversion`, `buyoutConversion`, `cancelRate` |
| `src/types/analytics-buyout.ts` | `BySkuBuyoutItem`: add `trendPeriod` field |
| `src/types/advertising-analytics.ts` | Add `include_daily` param, `profit_after_ads` sort |

### Search Analytics: Plan vs Backend Validation

All 3 endpoint schemas in this doc are **100% accurate** vs backend DTOs. No corrections needed for search types.

### Backend Bugs Blocking Full Accuracy

4 buyout endpoint bugs reported (sort direction ignored, minSales not consumed, some sort fields are no-ops). See Request #160 Section B.

### New Capabilities Discovered (Not in Original Plan)

1. `include_daily=true` on advertising endpoint — enables daily trend charts
2. Three-layer ad cost discrepancy analysis (3 different spend data sources)
3. Search + advertising cross-reference for organic vs paid keyword analysis
4. Funnel `openCardCount - adv.views` for organic traffic share (no new backend needed)

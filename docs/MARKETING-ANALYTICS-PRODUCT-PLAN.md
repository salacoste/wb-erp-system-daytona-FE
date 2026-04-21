# Marketing Analytics Product Plan

**Author**: John (Product Manager)
**Date**: 2026-03-06
**Status**: Audit Complete — Updated with Backend API Deep-Dive (2026-03-06)
**Audit Reference**: `docs/request-backend/160-MARKETING-ANALYTICS-AUDIT-BACKLOG.md`

---

## Executive Summary

The WB Repricer frontend has a strong foundation of marketing analytics features already implemented (funnel, advertising, buyout, returns). The recent integration of Jam subscription detection (`jam-status`) and seller identity (`seller-info`) endpoints unlocks a new category of features: **Search Analytics** — keyword position tracking, search query performance, and organic vs. paid traffic analysis. This plan maps what exists, what's ready to build, and what delivers the highest user value.

---

## 1. Current State Inventory

### 1.1 Existing Marketing Analytics Pages (IMPLEMENTED)

| Page | Route | Epic | Status | Backend API | Key Features |
|------|-------|------|--------|-------------|--------------|
| **Advertising ROAS** | `/analytics/advertising` | Epic 33-FE | Complete | `GET /v1/analytics/advertising/*` | Performance table, ROAS/ROI metrics, campaign selector, efficiency filter, merged groups (Epic 37) |
| **Marketing Funnel** | `/analytics/funnel` | Epic 68-FE | Complete — spec: [`epic-68-fe-funnel-analytics.md`](epics/epic-68-fe-funnel-analytics.md) | `GET /v1/analytics/funnel`, `/funnel/sync-status`, `/funnel/summary`, `/funnel/by-sku` | Funnel chart (views->cart->orders->buyouts->cancels), per-SKU table, time series, sync status |
| **Buyout Analytics** | `/analytics/buyout` | Epic 69-FE | Complete (7/7 stories) — spec: [`epic-69-fe-buyout-rate-analytics.md`](epics/epic-69-fe-buyout-rate-analytics.md) | `GET /v1/analytics/buyout/by-sku`, `/buyout/summary` | Per-SKU buyout rates, trend tracking, confidence scoring, return breakdown, top decliners |
| **Return Analytics** | `/analytics/returns` | Epic 70-FE | Complete — spec: [`epic-70-fe-returns-analytics.md`](epics/epic-70-fe-returns-analytics.md) (BE #151 labels as "Epic 71"; frontend canonicalized to Epic 70-FE per Story 88.5) | `GET /v1/analytics/returns/reasons`, `/returns/reasons/by-sku` | Return reasons pie chart, per-SKU anomaly detection, category breakdown (cancel/refusal/return) |

### 1.2 Existing Frontend Infrastructure (IMPLEMENTED)

| Layer | Files | Status |
|-------|-------|--------|
| **Hooks** | `use-funnel-analytics.ts`, `use-buyout-analytics.ts`, `use-return-analytics.ts`, `useAdvertisingAnalytics.ts`, `useJamStatus.ts`, `useSellerInfo.ts` | All functional |
| **API Modules** | `funnel-analytics.ts`, `buyout-analytics.ts`, `return-analytics.ts`, `advertising-analytics.ts`, `cabinet.ts` (jam + seller) | All functional |
| **Types** | `analytics-funnel.ts`, `analytics-buyout.ts`, `analytics-returns.ts`, `advertising-analytics.ts`, `cabinet.ts` (JamStatusResponse, SellerInfoResponse) | All defined |
| **Routes** | `FUNNEL`, `BUYOUT`, `RETURNS`, `ADVERTISING` registered in `routes.ts` | All registered |

### 1.3 Jam & Seller Info Integration (RECENTLY IMPLEMENTED)

| Endpoint | Hook | Type | Status |
|----------|------|------|--------|
| `GET /v1/cabinets/:id/jam-status` | `useJamStatus()` | `JamStatusResponse { tier, searchTextsLimit, checkedAt, probeCallsMade }` | API client + hook + types DONE |
| `GET /v1/cabinets/:id/seller-info` | `useSellerInfo()` | `SellerInfoResponse { name, sid, tradeMark }` | API client + hook + types DONE |

**Jam Tiers**: `none` (no subscription) / `standard` (searchTextsLimit=30) / `advanced` (searchTextsLimit=100)

> **CRITICAL BUG (BUG-1)**: Backend returns `'advanced'` but frontend type has `'extended'`. Must fix `src/types/cabinet.ts` before implementing RequireJam. See Request #160.

### 1.4 Backend APIs Ready But NO Frontend Yet

| Backend API | Task | Status | Frontend Status |
|-------------|------|--------|-----------------|
| `GET /v1/analytics/search/by-product` | Task-139.4 | Backend COMPLETE | **NO FRONTEND** |
| `GET /v1/analytics/search/by-query` | Task-139.5 | Backend COMPLETE | **NO FRONTEND** |
| `GET /v1/analytics/search/orders` | Task-139.6 | Backend COMPLETE | **NO FRONTEND** |
| `GET /v1/analytics/product/:nmId/unified` | Story 70.2 | Backend service exists, **not registered in module** | **NO FRONTEND** |
| `GET /v1/analytics/product/:nmId/organic-share` | Story 70.5 | Backend service exists, **not registered in module** | **NO FRONTEND** |

---

## 2. User Personas & Jobs-to-Be-Done

### Primary Persona: Business Owner / Entrepreneur

| Job-to-Be-Done | Current Pain | Feature Solution |
|-----------------|-------------|-----------------|
| "Which search queries bring me the most orders?" | No visibility into organic search performance | **Search Analytics: By Query** — see top converting keywords |
| "Where do my products rank for key search terms?" | Manual WB search checking, no historical data | **Search Analytics: By Product** — position tracking over time |
| "Are my ad campaigns driving real incremental sales?" | Can see ad ROAS, but not organic vs paid split | **Organic Share Widget** — organic/ad traffic split per product |
| "Is my Jam subscription worth paying for?" | No data to evaluate Jam ROI | **Jam ROI Dashboard** — search visibility improvement with Jam tier |
| "Which products need marketing attention?" | Must check each analytics page separately | **Unified Product View** — funnel + ads + organic on one screen |

### Secondary Persona: Financial Director / CFO

| Job-to-Be-Done | Current Pain | Feature Solution |
|-----------------|-------------|-----------------|
| "What percentage of revenue comes from organic search?" | No attribution data | **Search Revenue Attribution** — search orders as % of total |
| "How much search-driven revenue do we lose without Jam?" | Cannot quantify opportunity cost | **Jam Subscription Value Calculator** |
| "Which brands/categories have the best organic performance?" | No organic performance breakdown | **Organic Performance by Brand/Category** |

---

## 3. Feature Proposals (Prioritized)

### P0 — High Value, Backend Ready, Immediate Build

#### Feature 3.1: Search Analytics Page (`/analytics/search`)

**Why P0**: Backend endpoints are COMPLETE (Task-139). Jam subscription hooks already integrated. This is the primary Jam value proposition. Zero backend work required.

**Backend APIs (all COMPLETE)**:
- `GET /v1/analytics/search/by-product?nmId=X&from=&to=` — Top search queries for a specific product (position, impressions, clicks, CTR, orders, revenue)
- `GET /v1/analytics/search/by-query?query=X&from=&to=` — Products ranking for a search term (position, impressions, clicks, CTR, orders, revenue)
- `GET /v1/analytics/search/orders?from=&to=&groupBy=query|product|day` — Search-attributed orders with revenue summary

**Proposed Sub-Features**:

| Sub-Feature | Description | Complexity | Jam Dependency |
|-------------|-------------|------------|----------------|
| **Search Orders Overview** | Summary cards: total search orders, search revenue, search order share (% of all orders), top keywords by revenue. Uses `search/orders?groupBy=query` | Medium | No (works for all, Jam adds depth) |
| **By-Product Keyword Explorer** | Select a product (nmId), see all search queries driving traffic: avg position, impressions, clicks, CTR, orders, revenue. Sortable table. | Medium | Yes (Jam enables search text tracking) |
| **By-Query Product Ranking** | Enter a search query, see which of your products rank for it: position, impressions, clicks, orders. Discover keywords you compete on. | Medium | Yes (Jam enables search text tracking) |
| **Search Orders Time Series** | Daily chart of search-attributed orders/revenue using `search/orders?groupBy=day`. Shows trend of organic search performance. | Low | No |
| **Jam Subscription Gate** | For non-Jam users: show teaser cards with blurred data and CTA "Activate Jam subscription to unlock search analytics". Uses `useJamStatus()`. | Low | Gate logic only |

**Estimated Effort**: 7-8 stories, ~30 SP
**Route**: `/analytics/search`

---

#### Feature 3.2: Jam Subscription Awareness & Gating

**Why P0**: Drives Jam adoption, prevents user confusion when they lack access. Hook `useJamStatus()` already exists.

**Proposed Sub-Features**:

| Sub-Feature | Description | Complexity |
|-------------|-------------|------------|
| **Jam Status Badge** | Show subscription tier (none/standard/extended) in sidebar or settings. Uses `useJamStatus()`. | Low |
| **Search Analytics Gate** | On `/analytics/search`, check `jamStatus.tier`. If `none`: show paywall/teaser. If `standard/extended`: show full data. | Low |
| **Seller Profile Card** | Show seller name + trademark from `useSellerInfo()` in settings or sidebar header. Personalizes the experience. | Low |
| **Jam Upgrade CTA** | When tier=standard, show "Upgrade to Extended for 100 search texts (you have 30)". Link to WB Jam settings. | Low |

**Estimated Effort**: 3-4 stories, ~10 SP

---

### P1 — High Value, Requires Backend Route Registration

#### Feature 3.3: Unified Product Analytics (`/analytics/product/:nmId`)

**Why P1**: Backend services exist (`UnifiedProductAnalyticsService`, `AdOrganicCorrelatorService`, `IncrementalRoasService`) but are **NOT yet registered** in the NestJS module. Requires backend Request to register routes.

**What It Delivers**: A single page per product combining:
- Funnel data (views, cart adds, orders, buyouts)
- Advertising data (spend, clicks, ad orders, ROAS)
- Organic data (organic views, organic orders, organic share)
- Summary (organic traffic share %, ad traffic share %, blended conversion)

**Proposed Implementation**:

| Sub-Feature | Description | Complexity | Backend Needed |
|-------------|-------------|------------|----------------|
| **Product Analytics Page** | Route `/analytics/product/:nmId` with tab layout: Overview / Funnel / Advertising / Organic | High | Yes (register 2 endpoints) |
| **Organic vs Paid Split** | Pie chart showing organic/ad views and orders split. Uses `organic-share` endpoint. | Medium | Yes (register endpoint) |
| **Incremental ROAS** | Shows true incremental value of ads: "Removing ads would reduce orders by X%". Uses `IncrementalRoasService`. | High | Yes (register endpoint) |

**Backend Request Required**: Register `/v1/analytics/product/:nmId/unified` and `/v1/analytics/product/:nmId/organic-share` in `analytics.module.ts`.

**Estimated Effort**: 6-7 stories, ~35 SP (frontend) + backend registration

---

#### Feature 3.4: Enhanced Funnel with Search Attribution

**Why P1**: The funnel page exists but lacks search query attribution. Backend already enriches funnel with `topSearchQueries` per the API docs.

| Sub-Feature | Description | Complexity |
|-------------|-------------|------------|
| **Top Search Queries in Funnel** | For each SKU in the funnel table, show top 3 search queries that drove views. Links to Search Analytics. | Medium |
| **Search-to-Cart Conversion** | New metric: what % of search impressions convert to cart adds? Combines search + funnel data. | Medium |

**Estimated Effort**: 3 stories, ~12 SP

---

### P2 — Medium Value, Enhancement

#### Feature 3.5: Marketing Analytics Hub Redesign

**Why P2**: The current Analytics Hub (`/analytics`) groups pages into Financial / Operational / Strategic. Marketing analytics (funnel, advertising, buyout, returns, search) spans multiple groups. A dedicated "Marketing" section improves discoverability.

| Sub-Feature | Description | Complexity |
|-------------|-------------|------------|
| **Marketing Nav Group** | Add "Marketing & SEO" group to analytics hub with: Funnel, Advertising, Search, Buyout, Returns. | Low |
| **Marketing Summary Card** | Quick KPI card on dashboard: "Organic search orders: X (Y% of total), Top keyword: Z". Requires search/orders summary. | Medium |
| **Search Performance Widget on Dashboard** | Mini widget showing search orders trend (sparkline) and top 3 keywords. | Medium |

**Estimated Effort**: 4 stories, ~15 SP

---

#### Feature 3.6: Advertising + Search Cross-Analysis

**Why P2**: Combines existing advertising data with new search data for richer insights.

| Sub-Feature | Description | Complexity |
|-------------|-------------|------------|
| **Ad Keyword vs Organic Keyword Overlap** | Show which keywords you pay for that also drive organic traffic (potential savings). | High |
| **Search Position vs Ad Spend Correlation** | Does higher ad spend improve organic position? Scatter plot per keyword. | High |
| **Advertising Cannibalization Analysis** | Products where ad spend is high but organic share is also high — potential over-spending. | Medium |

**Estimated Effort**: 4-5 stories, ~25 SP

---

### P3 — Lower Priority, Future

#### Feature 3.7: Competitive Keyword Intelligence

Requires WB API capabilities beyond current scope. Would track competitor keyword rankings.

#### Feature 3.8: Automated Marketing Recommendations

AI-driven suggestions: "Increase ad spend on keyword X (position 15, high CTR)" or "Reduce ads on keyword Y (already organic position 3)".

---

## 4. What's Missing in Existing Marketing Pages

### 4.1 Funnel Page (`/analytics/funnel`) — Gaps

| Gap | Impact | Fix Complexity |
|-----|--------|---------------|
| No search query attribution in funnel rows | Cannot see which searches drive views | Medium (new column + API enrichment) |
| No ad spend overlay on funnel chart | Cannot correlate ad spend with funnel metrics | Low (add ad data to time series) |
| Missing formal epic spec (Epic 68-FE) | Technical debt in documentation | Low (doc only) |
| No comparison period (WoW/MoM) | Cannot track funnel trend improvement | Medium |

### 4.2 Advertising Page (`/analytics/advertising`) — Gaps

| Gap | Impact | Fix Complexity |
|-----|--------|---------------|
| No organic share per product | Cannot assess true ad incrementality | High (needs organic-share endpoint registration) |
| No search keyword attribution per ad | Cannot see which keywords ads trigger | Medium |
| No time series chart (daily trends) | Can only see table, no visual trend | Low (add chart component) |

### 4.3 Buyout Page (`/analytics/buyout`) — Gaps

| Gap | Impact | Fix Complexity |
|-----|--------|---------------|
| Story 69.7 tests not yet written | Test coverage gap | Low (test writing) |
| No correlation with search position | Cannot see if low buyout SKUs have poor search positioning | Medium |
| No link to return details per SKU | Must navigate to returns page separately | Low (add link) |

### 4.4 Returns Page (`/analytics/returns`) — Gaps

| Gap | Impact | Fix Complexity |
|-----|--------|---------------|
| Missing formal epic spec (Epic 71-FE) | Technical debt in documentation | Low (doc only) |
| No time series chart for return trends | Cannot visualize return rate over time | Medium |
| No correlation with product reviews/ratings | Cannot connect returns to quality perception | High (new data source needed) |

---

## 5. Implementation Roadmap

### Phase 1: Search Analytics Foundation (4-6 weeks)

**Goal**: Ship the search analytics page and Jam gating.

| Week | Stories | Deliverable |
|------|---------|-------------|
| 1 | Types + API client + hooks for search analytics | Foundation layer |
| 2 | Search Orders overview + time series chart | `/analytics/search` — tab 1 |
| 3 | By-Product keyword explorer | `/analytics/search` — tab 2 |
| 4 | By-Query product ranking | `/analytics/search` — tab 3 |
| 5 | Jam gating + seller profile + upgrade CTA | Subscription awareness |
| 6 | Analytics hub update + E2E tests | Polish and integration |

### Phase 2: Unified Product View (3-4 weeks)

**Prerequisite**: Backend registers unified + organic-share endpoints.

| Week | Stories | Deliverable |
|------|---------|-------------|
| 7-8 | Unified product page scaffold + funnel/ad tabs | `/analytics/product/:nmId` |
| 9-10 | Organic share tab + incremental ROAS | Complete product analytics |

### Phase 3: Cross-Analysis & Enhancements (2-3 weeks)

| Week | Stories | Deliverable |
|------|---------|-------------|
| 11 | Marketing hub nav group + dashboard widget | Improved discoverability |
| 12 | Funnel search attribution + ad overlap analysis | Cross-feature insights |
| 13 | Gap fixes (tests, time series charts, comparisons) | Quality improvements |

---

## 6. Technical Considerations

### Jam Gating Architecture

```typescript
// Recommended pattern for Jam-gated features
function SearchAnalyticsPage() {
  const { cabinetId } = useAuthStore()
  const { data: jamStatus, isLoading } = useJamStatus(cabinetId)

  if (isLoading) return <SearchAnalyticsSkeleton />

  if (!jamStatus || jamStatus.tier === 'none') {
    return <JamSubscriptionTeaser feature="search-analytics" />
  }

  // Full search analytics for standard/extended tiers
  return <SearchAnalyticsContent searchTextsLimit={jamStatus.searchTextsLimit} />
}
```

### Search Analytics API Client Pattern

```typescript
// New file: src/lib/api/search-analytics.ts
// Follows established patterns from funnel-analytics.ts, buyout-analytics.ts

export async function getSearchByProduct(params: SearchByProductParams): Promise<SearchByProductResponse>
export async function getSearchByQuery(params: SearchByQueryParams): Promise<SearchByQueryResponse>
export async function getSearchOrders(params: SearchOrdersParams): Promise<SearchOrdersResponse>
```

### Data Flow

```
useJamStatus() → gate check → useSearchByProduct() / useSearchByQuery() / useSearchOrders()
                                              ↓
                              SearchAnalyticsPage (3 tabs + overview)
```

### Dependencies

| Feature | Depends On |
|---------|------------|
| Search Analytics Page | Jam status hook (DONE), backend Task-139 (DONE) |
| Unified Product View | Backend endpoint registration (NOT DONE) |
| Organic Share | Backend endpoint registration (NOT DONE) |
| Search + Funnel Attribution | Both search and funnel data (DONE) |

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Search Analytics page adoption | 60% of Jam subscribers use it weekly | Page view analytics |
| Jam subscription upgrade rate | 15% of non-Jam users upgrade after seeing teaser | Conversion tracking |
| Time to find keyword insights | < 30 seconds from page load | User session timing |
| Search revenue attribution awareness | 80% of active users see search order % | Dashboard widget impressions |
| Net Promoter Score for marketing features | +20 vs current | User survey |

---

## 8. Open Questions

1. **Backend endpoint registration**: Who should file the backend request to register `unified` and `organic-share` endpoints in `analytics.module.ts`? (Blocks Phase 2)

2. **Jam paywall design**: Should non-Jam users see ANY search data (e.g., top 3 keywords with blur), or completely block access? (UX decision)

3. **Search data freshness**: The `search_analytics_sync` pipeline — how often does it run? Is there a sync status endpoint like funnel has? (Backend question)

4. **Seller info usage**: Beyond sidebar display, should seller name/trademark appear in exported reports or PDF analytics? (Product scope question)

5. **Cross-page linking**: When a user sees a product in the funnel page, clicking it should open the unified product view. Should this be a modal or a separate page? (UX decision)

---

## Appendix A: Backend API Response Shapes

### Search By Product Response
```json
{
  "nmId": 148190182,
  "period": { "from": "2026-02-01", "to": "2026-03-05" },
  "queries": [
    {
      "searchQuery": "string (keyword)",
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

### Search By Query Response
```json
{
  "query": "keyword",
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

### Search Orders Response (groupBy=query)
```json
{
  "period": { "from": "2026-02-01", "to": "2026-03-05" },
  "groupBy": "query",
  "items": [
    {
      "key": "keyword",
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

### Jam Status Response
```json
{
  "tier": "standard",
  "searchTextsLimit": 30,
  "checkedAt": "2026-03-05T12:00:00.000Z",
  "probeCallsMade": 2
}
```

### Seller Info Response
```json
{
  "name": "Seller Legal Name",
  "sid": "uuid",
  "tradeMark": "BrandName"
}
```

---

## Appendix B: Existing File Locations

| What | Path |
|------|------|
| Jam Status Hook | `src/hooks/useJamStatus.ts` |
| Seller Info Hook | `src/hooks/useSellerInfo.ts` |
| Cabinet API (jam + seller) | `src/lib/api/cabinet.ts` |
| Jam/Seller Types | `src/types/cabinet.ts` (lines 106-126) |
| Funnel Page | `src/app/(dashboard)/analytics/funnel/` |
| Buyout Page | `src/app/(dashboard)/analytics/buyout/` |
| Returns Page | `src/app/(dashboard)/analytics/returns/` |
| Advertising Page | `src/app/(dashboard)/analytics/advertising/` |
| Analytics Hub | `src/app/(dashboard)/analytics/page.tsx` |
| Routes | `src/lib/routes.ts` (lines 39-43) |
| Funnel API | `src/lib/api/funnel-analytics.ts` |
| Buyout API | `src/lib/api/buyout-analytics.ts` |
| Return API | `src/lib/api/return-analytics.ts` |
| Funnel Hook | `src/hooks/use-funnel-analytics.ts` |
| Buyout Hook | `src/hooks/use-buyout-analytics.ts` |
| Return Hook | `src/hooks/use-return-analytics.ts` |
| Backend Search API Test | `../test-api/34-search-analytics.http` |
| Backend Funnel API Test | `../test-api/29-funnel-analytics.http` |
| Backend Buyout API Test | `../test-api/32-buyout-analytics.http` |
| Backend Return API Test | `../test-api/33-return-analytics.http` |
| Backend Organic Share Test | `../test-api/31-organic-share.http` |
| Backend Unified Product Test | `../test-api/30-unified-product-analytics.http` |

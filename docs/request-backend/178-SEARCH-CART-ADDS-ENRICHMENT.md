# Request #178 — Search Analytics: per-item `searchCartAdds` enrichment for Search-to-Cart Conversion metric

**Discovered**: Story 119.3-FE — Search-to-Cart Conversion metric (Marketing Plan §3.4 row 2)
**Filed by**: Story 119.3-FE Task 2 Branch C (predicted-and-confirmed: field absent in backend)
**Severity**: P2 — non-blocking; FE has Defensive Frontend Principle in place for "field absent" (renders nothing; no `0%` for unknown data). Worth shipping to unlock Marketing Plan §3.4 row 2 ("Search-to-Cart Conversion") which is currently a conceptual-only feature.
**Status**: RESOLVED (2026-06-02, option 1): additive `searchCartAdds` field added to by-query + by-product items (= WB addToCart, sourced from existing total_clicks; non-breaking, totalClicks retained). Live 200, searchCartAdds==totalClicks verified. Breaking rename (option 2) remains a future cleanup (a-i-33).
**Related**: Request #176 (Story 119.1-FE F-9; canonical template for this ticket — search-analytics contract-clarity ticket), Marketing Plan §3.4 row 2 (now banner-flagged absent), Story 117.2-FE Branch A precedent (aspirational-docs-vs-live-reality discovery), Story 119.2-FE Branch C precedent (predicted-A/B-actual-C inversion for funnel enrichment).

---

## Problem

Marketing Plan §3.4 row 2 proposes a "Search-to-Cart Conversion" metric: **what % of search impressions convert to cart adds**, displayed per-query or per-product on Search Analytics tabs. The denominator (`totalImpressions`) is already shipped per-query (`SearchQueryItem.totalImpressions`) and per-product (`SearchProductItem.totalImpressions`) — see `src/types/search-analytics.ts:41-76`. The **numerator (`searchCartAdds`-or-similar) does not exist anywhere in the search analytics pipeline**.

### Pre-flight evidence (Story 105.2-FE source-trace verification, Story 119.3-FE 2026-05-30)

**Backend source-of-truth grep** (`src/`, `test-api/`, `docs/`):

- `src/analytics/dto/search-by-query.dto.ts` — `SearchProductItem` declares only `totalImpressions`, `totalClicks`, `avgPosition`, `avgCtr`, `totalOrders`. Zero cart-related fields.
- `src/analytics/dto/search-analytics.dto.ts` — `SearchQueryItem` declares the same five fields. Zero cart-related fields.
- `src/analytics/services/search-analytics-query.service.ts` — SQL `SUM(impressions)`, `SUM(clicks)`, `SUM(orders)`, derived `ctr`/`avgPosition`. Zero `cart_adds` aggregation.
- Backend grep for `cartAdds|cart_adds|addToCarts|searchCarts` across `src/`, `test-api/`, `docs/`: **single hit**, and it's `docs/architecture/04-data-models.md:633` describing `ProductFunnelDaily.cart_adds` — a **per-product per-day funnel** column (Epic 68 domain), NOT per-search-query.

**Frontend grep** (`src/types/`, `src/lib/api/`, `src/hooks/`): zero hits for any cart-adds spelling.

### Live verification attempt (blocked, but not dispositive)

Live `GET /v1/analytics/search/by-product` + `GET /v1/analytics/search/by-query` calls were blocked by an unrelated backend DB-credentials defect: `POST /v1/auth/login` returns `INTERNAL_SERVER_ERROR` 500 across 4 retries (trace_ids `e046b919-7a28-42b3-90ef-780ee670722f`, `31f00394-be79-408c-b438-4f0ef76ffd83`, `180a3c3f-2700-4868-9be0-6377642f6f76`, `1ff48345-1eea-4112-afd0-5b6977abba71` captured 2026-05-30 11:21-11:22 UTC). PM2 backend logs (`/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/logs/pm2-api-error.log`) show repeated:

```
Authentication failed against database server at `localhost`,
the provided database credentials for `wb_user` are not valid.
```

This DB-credentials issue is outside Story 119.3-FE scope. Per Pass-1 F-5, this defect is now filed as `docs/request-backend/179-WB-USER-DB-CREDENTIALS-AUTH-FAILURE.md` (P0 severity; affects all auth-gated endpoints; 5 likely root causes documented; 5 backend ACs). For Story 119.3-FE's branch determination, **the backend-source inspection above is conclusive on its own**: the search analytics SQL aggregations don't compute cart adds, so a live call cannot produce a `searchCartAdds` field that the source code doesn't write. (Live verification would, at best, confirm the static evidence; it cannot invent a field that the service doesn't aggregate.)

### Branch determination

**Branch C** (field ABSENT in backend response — predicted and confirmed by static evidence). FE makes no source/test changes; this ticket + Marketing Plan §3.4 row 2 banner are the deliverables.

---

## Fix request

### Field shape (proposed)

Add a nullable `number` field to per-item search analytics shapes:

```typescript
// On SearchQueryItem (driven by GET /v1/analytics/search/by-product)
searchCartAdds: number | null   // null when no cart-adds data; AP#8 rule (FE: docs/CLAUDE-ANTI-PATTERNS.md#8)

// On SearchProductItem (driven by GET /v1/analytics/search/by-query)
searchCartAdds: number | null
```

**Why nullable, not zero-default**: Anti-Pattern #8 (`?? 0` on nullable money/ratio fields lies about the data). If WB or the upstream pipeline can't attribute cart adds for a given (query, product) pair, the value is **unknown** — not zero. Returning `0` would surface a "0% conversion rate" to sellers when the truthful answer is "we don't know."

### Unit-of-analysis clarification (REQUIRED before FE can choose display location)

Marketing Plan §3.4 row 2 says "Combines search + funnel data" but the JOIN semantics are structurally unclear. There are three plausible units of analysis; **please clarify which the backend will ship**:

| Option | Field lives on | Denominator | Means |
|---|---|---|---|
| **A — per-query aggregate** | `SearchQueryItem` only | query's `totalImpressions` (sum across all products ranking for that query) | "Of all impressions on query Q, X% led to cart adds (regardless of which product)" |
| **B — per-product aggregate** | `SearchProductItem` only | product's `totalImpressions` (sum across all queries driving traffic to product P) | "Of all search impressions on product P, X% led to cart adds (regardless of query)" |
| **C — per-(query,product) pair** | Both, indexed by counterpart key | matched (query,product) impression count | "Of all impressions of product P shown for query Q, X% led to cart adds" |

Option C is the most analytically rich (lets sellers identify query-product mismatches), but requires joinable per-pair aggregation in WB's funnel data — which may not exist upstream.

**Open question for backend**: which of A/B/C is feasible against WB's source data, and which best matches the Marketing Plan §3.4 row 2 intent?

### Sample expected response (Option C, illustrative)

```json
// GET /v1/analytics/search/by-product?nmId=270937054&from=2026-03-29&to=2026-05-28&limit=2
{
  "nmId": 270937054,
  "period": { "from": "2026-03-29", "to": "2026-05-28" },
  "queries": [
    {
      "searchQuery": "пример запроса",
      "avgPosition": 12.4,
      "totalImpressions": 5234,
      "totalClicks": 312,
      "avgCtr": 5.96,
      "totalOrders": 18,
      "searchCartAdds": 47          // NEW; nullable
    },
    {
      "searchQuery": "редкий запрос",
      "avgPosition": 38.1,
      "totalImpressions": 12,
      "totalClicks": 0,
      "avgCtr": 0,
      "totalOrders": 0,
      "searchCartAdds": null         // NEW; unknown for this (query,product) pair
    }
  ],
  "totalQueries": 2
}
```

### Acceptance criteria (backend)

1. New `searchCartAdds: number | null` field on `SearchQueryItem` (response shape of `GET /v1/analytics/search/by-product`).
2. New `searchCartAdds: number | null` field on `SearchProductItem` (response shape of `GET /v1/analytics/search/by-query`).
3. Aggregation logic clearly documented (which of Option A/B/C above is shipped; SQL source visible in `search-analytics-query.service.ts`).
4. `null` semantics: emit `null` when no data is attributable for a given row, NOT `0`. Bounds: `searchCartAdds >= 0` when not null.
5. Optional ordering: add `searchCartAdds` to the `SearchOrderBy` union (frontend type at `src/types/search-analytics.ts:15-21`) IF the field is on `SearchQueryItem`.
6. Swagger docstring + OpenAPI spec updated to document the new field + unit-of-analysis choice.
7. (Optional, deferred) `summary.searchCartAdds` aggregate on `SearchOrdersResponse` for a page-level KPI card — not required for v1 of this metric.

### Test data expectation

For the Test Cabinet (`f75836f7-c0bc-4b2c-823c-a1f3508cce8e`), at least 30% of items in a 60-day-window query should have non-null `searchCartAdds` so the FE can validate end-to-end rendering. If the WB upstream rarely supplies this data, the metric is not viable at FE level and this ticket can be closed as "WB-source-not-available" — please flag if so.

---

## Frontend posture (current)

Per Story 119.3-FE Branch C decision:

- No types change (would have added `searchCartAdds?: number | null` to `SearchQueryItem` + `SearchProductItem` if Branch A).
- No normalizer change (would have extended `normalizeSearchQueryItem` + `normalizeSearchProductItem` with `searchCartAdds: toNullableNumber(r.searchCartAdds)` per AP#8 + Boundary Normalizer Pattern if Branch A).
- No new column/card (would have lived in `SearchByQueryTab` / `SearchByProductTab` / `SearchOrdersOverview` depending on unit-of-analysis decision).
- No `computeSearchToCartRatio` helper (pure-function extraction deferred until field arrives).
- Marketing Plan §3.4 row 2 carries an `⚠️ Backend field absent` banner cross-linking this ticket.

When this ticket lands, the Boundary Normalizer Pattern + Defensive Frontend Principle conventions established by Story 119.1-FE make the FE swap-in trivial: ~15 lines of normalizer + types changes + ~50 lines of column/card + tests. A follow-up Story 119.5+ or Story 120.x should swap in once backend confirms the unit-of-analysis choice.

---

## Cross-references

- **Marketing Plan §3.4 row 2** (`docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md`) — now banner-flagged with `⚠️ Backend field absent` per this ticket.
- **Story 119.3-FE** — `_bmad-output/implementation-artifacts/119-3-fe-search-to-cart-conversion-metric.md` (Branch C decision + this ticket as deliverable).
- **Story 117.2-FE Branch A precedent** — `_bmad-output/implementation-artifacts/117-2-fe-search-revenue-metrics.md` (aspirational-docs-vs-live-reality discovery — backend docs claimed `totalRevenue`, live verification showed it absent; same verify-first template applied here).
- **Story 119.2-FE Branch C inversion precedent** — `_bmad-output/implementation-artifacts/119-2-fe-funnel-top-search-queries-column.md` (predicted A/B; live evidence inverted to Branch C — field PRESENT and RICHER than predicted; counterpoint to Story 119.3-FE where the prediction held). **Branch-label disambiguation** (Pass-1 F-1): Stories 117.2 + 119.2 use convention `A=ABSENT / B=PRESENT-but-empty / C=PRESENT-with-real-data` (so 119.2's "Branch C" = field present with real data = FULL-IMPL path). Story 119.3 inverted to `A=PRESENT-with-real-data / B=PRESENT-empty / C=ABSENT` (so 119.3's "Branch C" = field absent = DOC-ONLY path). **Cross-story readers**: when comparing "Branch C" across stories, the label semantic is per-story; the FE-action mapping (Full-impl vs Doc-only deferral) is consistent if you trace the matrix definition rather than the letter. Future verify-first stories should adopt Stories 117.2/119.2's `A=ABSENT` convention to eliminate this inversion.
- **Story 119.1-FE F-9 / Request #176** — `docs/request-backend/176-SEARCH-ANALYTICS-KEY-SHAPE-AND-ORDERSHARE-ANOMALIES.md` (canonical template for search-analytics backend tickets).
- **Anti-Pattern #8** — `CLAUDE-ANTI-PATTERNS.md` (null money/ratio rule justifying the `number | null` shape).
- **Boundary Normalizer Pattern** — `CLAUDE-PATTERNS.md` (`toNullableNumber` is the AP#8-compliant normalizer FE will use when field arrives).
- **Backend `ProductFunnelDaily.cart_adds`** — `docs/architecture/04-data-models.md:633` (Epic 68; per-SKU per-day; NOT per-search-query — distinct domain).
- **Backend search analytics aggregations** — `src/analytics/services/search-analytics-query.service.ts` (the SQL that would need a new `SUM(cart_adds)`-or-similar derived column to feed `searchCartAdds`).
- **Side-context: DB-credentials defect** — `POST /v1/auth/login` returning 500 with "Authentication failed against database server at `localhost`" (PM2 error log captured 2026-05-30 11:22 UTC). Separate ticket scope; NOT this ticket's fix scope.
- **Request #179** — `docs/request-backend/179-WB-USER-DB-CREDENTIALS-AUTH-FAILURE.md` (Story 119.3-FE Pass-1 F-5 cross-discovery; the `wb_user` DB-credentials defect that blocked live verification for this story).

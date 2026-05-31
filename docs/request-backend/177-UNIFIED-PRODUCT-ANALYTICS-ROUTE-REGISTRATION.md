# Request #177 — Unified Product Analytics: register `/v1/analytics/product/:nmId/*` routes in `analytics.module.ts`

**Originated by**: Marketing Plan §3.3 + Epic 70-FE Stories 70.3/70.4/70.6 (services implemented but routes never registered; Pass-1 F-2 disambiguation: this Request didn't DISCOVER the gap — Marketing Plan §3.3 already documented it; this Request FILES the explicit fulfillment of that documented need)
**Filed by**: Story 119.4-FE Task 1 — `_bmad-output/implementation-artifacts/119-4-fe-file-backend-request-177-unified-product-analytics.md` (OPTIONAL doc-only micro per Epic 119-FE spec; 1-pass review floor)
**Severity**: P1 — non-blocking for current Epic 119 close, but BLOCKS Marketing Plan §3.3 (estimated 6-7 FE stories, ~35 SP across "Product Analytics Page" + "Organic vs Paid Split" + "Incremental ROAS" sub-features) until resolved. Should be implemented before any Epic 120/121 stories that consume §3.3 features.
**Status**: PENDING BACKEND
**Related**: Marketing Plan §3.3 (`docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md` Feature 3.3), Epic 70-FE Stories 70.3 / 70.4 / 70.6 (where the underlying services were implemented but not route-exposed), Request #176 (Story 119.1-FE F-9; canonical template — this Request mirrors its shape), Request #178 (Story 119.3-FE; canonical content-depth template), Story 119.1-FE F-9 (the repurposing of original Request #176 for search-analytics anomalies that left the #177 slot empty until this story occupies it).

---

## Problem

Marketing Plan §3.3 documents 3 sub-features for the Unified Product Analytics page:

1. **Product Analytics Page** — route `/analytics/product/:nmId` with a tab layout (Overview / Funnel / Advertising / Organic)
2. **Organic vs Paid Split** — pie chart showing organic/ad views and orders split (uses the `organic-share` endpoint)
3. **Incremental ROAS** — shows true incremental value of ads via `IncrementalRoasService`

Per Marketing Plan §3.3's explicit statement: *"Backend services exist (`UnifiedProductAnalyticsService`, `AdOrganicCorrelatorService`, `IncrementalRoasService`) but are **NOT yet registered** in the NestJS module. Requires backend Request to register routes."*

### Backend evidence (service implementations exist per Epic 70-FE)

- `../docs/architecture/SERVICE-LAYER-REFERENCE.md` — service-layer registry (likely lists the 3 services)
- `../docs/BUSINESS-LOGIC-REFERENCE.md` — business-logic documentation for the 3 services
- `../docs/stories/epic-70/story-70.3-correlate-addtocart-with-advertising.md` — Epic 70-FE story shipping `AdOrganicCorrelatorService`
- `../docs/stories/epic-70/story-70.4-incremental-roas.md` — Epic 70-FE story shipping `IncrementalRoasService`
- `../docs/stories/epic-70/story-70.6-tests-and-validation.md` — Epic 70-FE story shipping tests for both

### Frontend posture (current)

Zero references to these endpoints anywhere in the frontend codebase:

- `grep -rln "analytics/product\|unified\|organic-share\|incremental-roas" src/types/ src/lib/api/ src/hooks/` → zero hits
- No types, no API client modules, no hooks for §3.3 — consistent with "routes not registered → FE can't consume" status

The frontend is fully blocked on §3.3 until backend exposes the services via HTTP routes.

---

## Fix request

### Routes to register (3)

Register the following 3 GET routes in `analytics.module.ts` (or whichever controller-bearing module groups analytics routes), each backed by the corresponding existing service:

| Route | Service | Purpose |
|---|---|---|
| `GET /v1/analytics/product/:nmId/unified` | `UnifiedProductAnalyticsService` | Combined funnel + advertising + organic + summary data for a product |
| `GET /v1/analytics/product/:nmId/organic-share` | `AdOrganicCorrelatorService` | Organic/paid views and orders split (powers the §3.3 pie chart) |
| `GET /v1/analytics/product/:nmId/incremental-roas` | `IncrementalRoasService` | True incremental value of ads (powers §3.3 "Removing ads would reduce orders by X%" insight) |

### Standard contract

- **URL params**: `:nmId` (Wildberries product ID; numeric string)
- **Query params**: `from` (ISO date string, inclusive), `to` (ISO date string, inclusive)
- **Headers**: `Authorization: Bearer <JWT>` (standard auth), `X-Cabinet-Id: <cabinet>` (standard cabinet scoping)
- **Controller**: NEW `UnifiedProductAnalyticsController` (recommended) that delegates to the 3 services; OR add 3 routes to an existing controller if architectural convention prefers it. Defer business logic to the services (controller is thin pass-through per backend convention).

### Sample expected response shapes (illustrative — backend to confirm final shape)

#### `GET /v1/analytics/product/:nmId/unified`

Per Marketing Plan §3.3 "What It Delivers" bullet list — combined data block:

```jsonc
{
  "nmId": 270937054,
  "period": { "from": "2026-03-29", "to": "2026-05-28" },
  "funnel": {
    "views": 12500,
    "cartAdds": 380,
    "orders": 78,
    "buyouts": 65
  },
  "advertising": {
    "spend": 4200.50,
    "clicks": 920,
    "adOrders": 22,
    "roas": 3.4    // number | null per AP#8 (null when ad spend is 0)
  },
  "organic": {
    "organicViews": 9800,
    "organicOrders": 56,
    "organicShare": 71.8  // % per AP#8 nullable
  },
  "summary": {
    "organicTrafficSharePct": 78.4,  // number | null
    "paidTrafficSharePct": 21.6,     // number | null
    "blendedConversion": 0.624        // number | null (orders/views ratio)
  }
}
```

#### `GET /v1/analytics/product/:nmId/organic-share`

```jsonc
{
  "nmId": 270937054,
  "period": { "from": "2026-03-29", "to": "2026-05-28" },
  "organicViews": 9800,
  "paidViews": 2700,
  "organicOrders": 56,
  "paidOrders": 22,
  "organicSharePct": 78.4,  // number | null per AP#8
  "paidSharePct": 21.6       // number | null
}
```

#### `GET /v1/analytics/product/:nmId/incremental-roas`

```jsonc
{
  "nmId": 270937054,
  "period": { "from": "2026-03-29", "to": "2026-05-28" },
  "totalOrders": 78,
  "attributedOrders": 22,        // orders attributed to ads
  "incrementalOrders": 14,       // orders the ads CAUSED (not just attributed)
  "incrementalRatio": 0.636      // number | null per AP#8 (incrementalOrders / attributedOrders)
}
```

### Acceptance criteria (backend)

1. `analytics.module.ts` imports a controller (NEW `UnifiedProductAnalyticsController` recommended; or extension of existing) that registers the 3 routes above.
2. Each route delegates to the corresponding service (no business logic in controller — defer to the existing service implementations per backend convention).
3. **AP#8 compliance for ratio/percentage fields**: `roas`, `organicShare`, `organicSharePct`, `paidSharePct`, `blendedConversion`, `incrementalRatio` returned as `number | null`, NOT `?? 0`. Per Story 119.1-FE F-2 codification (`toNullableNumber` Boundary Normalizer pattern) + Story 117.2-FE Defensive Frontend Principle (null means "unknown", 0 means "known-zero"; FE must distinguish them via `—` em-dash vs `0%` rendering). Count/integer fields (`views`, `clicks`, `orders`, etc.) may use `?? 0` per AP#8 counts exception.
4. Swagger / OpenAPI docs updated for all 3 routes documenting params + response shapes (matches Request #176/#178 pattern).
5. JWT + `X-Cabinet-Id` enforcement (standard analytics auth — refuse 401/403 if missing).
6. Smoke tests demonstrating live response shape against the Test Cabinet (`f75836f7-c0bc-4b2c-823c-a1f3508cce8e`) — enables FE Story 105.2-FE pre-flight verification when §3.3 stories begin.

---

## Frontend posture (current — and after Request #177 lands)

### Current

- Zero §3.3 references in FE (no types, no API clients, no hooks, no components)
- Marketing Plan §3.3 is documented but unactionable until routes register
- The empty Request #177 slot (from Story 119.1-FE F-9 repurposing #176) is now occupied by this Request

### After Request #177 lands

Future Epic (Epic 120-FE or Epic 121-FE) can scope §3.3 frontend per Marketing Plan estimate:

- 6-7 stories
- ~35 SP frontend
- Standard Boundary Normalizer pattern applied per Story 119.1-FE precedent (3 normalizers — one per route — with `toNullableNumber` for ratio fields per AP#8)
- Defensive Frontend rendering (`—` em-dash for null ratios; `0%` only when backend explicitly returns 0)
- 2-pass review discipline per Story 94.3-FE (full-feature stories, not doc-only micro)
- Verify-first pre-flight per Epic 117 retro A-1 (live call against Test Cabinet to confirm response shape matches the proposed shapes above)

---

## Cross-references

- **Marketing Plan §3.3** — `docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md` (Feature 3.3: Unified Product Analytics — the explicit "Backend Request Required" call this Request fulfills)
- **Epic 70-FE Stories** (where the services were built):
  - `../docs/stories/epic-70/story-70.3-correlate-addtocart-with-advertising.md` — `AdOrganicCorrelatorService`
  - `../docs/stories/epic-70/story-70.4-incremental-roas.md` — `IncrementalRoasService`
  - `../docs/stories/epic-70/story-70.6-tests-and-validation.md` — service tests
- **Backend service-layer registry** — `../docs/architecture/SERVICE-LAYER-REFERENCE.md` (where `UnifiedProductAnalyticsService` is documented)
- **Backend business logic** — `../docs/BUSINESS-LOGIC-REFERENCE.md` (business-rule documentation for the 3 services)
- **Request #176 (canonical template)** — `docs/request-backend/176-SEARCH-ANALYTICS-KEY-SHAPE-AND-ORDERSHARE-ANOMALIES.md` (Story 119.1-FE F-9; shape mirrored by this Request)
- **Request #178 (canonical content-depth template)** — `docs/request-backend/178-SEARCH-CART-ADDS-ENRICHMENT.md` (Story 119.3-FE; content-depth conventions mirrored by this Request)
- **Story 119.1-FE F-9** — `_bmad-output/implementation-artifacts/119-1-fe-search-analytics-boundary-normalizer.md` (where Request #176 was repurposed for search-analytics, leaving the #177 slot empty until this story finally occupies it — Pass-1 F-4 corrected: slot was open 3 days, not 2 — Story 119.1 closed 2026-05-29; Request #177 filed 2026-05-31; 1-pass review 2026-06-01)
- **Anti-Pattern #8** — `CLAUDE-ANTI-PATTERNS.md` (null money/ratio rule applied to AC-3 above)
- **Story 119.1-FE F-2** — `_bmad-output/implementation-artifacts/119-1-fe-search-analytics-boundary-normalizer.md` (`toNullableNumber` canonical normalizer for ratio fields; future §3.3 FE work will reuse this pattern)
- **Defensive Frontend Principle** — `CLAUDE-PATTERNS.md` (em-dash rendering for null ratios; foundational pattern for §3.3 FE work)

# Request #176 — Search Analytics: `SearchOrderItem.key` type contract + `searchOrderShare > 100` anomaly

**Discovered**: Story 117.1-FE F-1 (key drift) + Story 117.2-FE Side-observation (`searchOrderShare: 394.23`)
**Filed by**: Story 119.1-FE 1st-pass F-9 (formalizing the previously-informal tracking)
**Severity**: P2 — non-blocking; FE has Boundary Normalizer absorption (Story 119.1-FE) and Defensive Frontend preservation in place. Worth fixing for data correctness + contract clarity.
**Status**: RESOLVED (backend, Story 111.7 — 2026-06-01)

> **Resolution summary (Story 111.7):**
> - **Problem A (key contract)** — FIXED. `groupBy=product` now serializes `key` as a string (`String(nmId)`); null/empty query keys and `nm_id = 0` rows are dropped server-side; `groupBy=day` already emitted ISO `YYYY-MM-DD`. The `key` field is now a string in every mode. Verified live (cabinet `f75836f7…`, all 3 modes HTTP 200, all keys `str`). OpenAPI + Swagger docstrings updated (`SearchOrdersByProductItemDto.key: string`, response `items` contract verbalized).
> - **Problem B (`searchOrderShare > 100`)** — already resolved in Story 111.6 AC8: a machine-readable `searchOrderShareInflated` boolean accompanies `searchOrderShare`, and both the field docstring and service comment document that WB Search Analytics multi-attributes a single order across queries (same precedent as funnel `buyoutConversion > 100%`). The value is best read as a "search query interaction rate". Order-level true-attribution is tracked as Story 111.8. No bounds-clamp/rename applied — kept raw + flagged, by design.
**Related**: Request #175 (the `by-product` / `by-query` 500s — explicitly disclaims this ticket's scope per its line 40).

---

## Problem A — `SearchOrderItem.key` type contract drift

`GET /v1/analytics/search/orders` returns `items[].key` values whose runtime type is inconsistent across `groupBy` modes:

- `groupBy=query` → `key: string` (the search-query text — e.g. `"жидкая изолента"`)
- `groupBy=product` → `key: number` (the `nmId` as a JSON number — e.g. `321678606`)
- `groupBy=day` → `key: string` (ISO date `YYYY-MM-DD`) — but occasionally a numeric `YYYYMMDD` integer surfaces (observed in Story 117.1-FE 2nd-pass F-1)
- Edge case (Story 117.4-FE): `null` / `undefined` values have been observed in the items array; the frontend must defensively filter them

The Frontend types declare `key: string | number` (`src/types/search-analytics.ts:96`), but real backend behavior fluctuates between `string`, `number`, `null`, and (theoretically) `undefined`. The instability has produced 3+ separate frontend defects:

- Story 117.1-FE F-1: numeric `key` not coerced → axis label `null`
- Story 117.1-FE 2nd-pass F-1: 8-digit numeric `YYYYMMDD` keys mis-rendered
- Story 117.4-FE: null-keyed items poisoned `pickTopByOrders`

Frontend has absorbed all three at the Boundary Normalizer layer (Story 119.1-FE, `src/lib/api/search-analytics-normalizer.ts`), but the underlying contract is unclear.

### Fix request (Problem A)

Pick ONE canonical shape per `groupBy` mode and enforce it serverside:

- `groupBy=query` → always `string`
- `groupBy=product` → always `string` (recommend: serialize `nmId` as string for symmetry with `query` / `day`)
- `groupBy=day` → always ISO `YYYY-MM-DD` string
- Drop items with missing/null keys at the backend rather than emitting them

Then update the OpenAPI spec + verbalize the contract in the Swagger docstring.

---

## Problem B — `summary.searchOrderShare > 100` anomaly

Observed value: `searchOrderShare: 394.23` for cabinet `f75836f7-c0bc-4b2c-823c-a1f3508cce8e` (Story 117.2-FE live verification, 2026-05-28).

A "share" exceeding 100% is mathematically suspect. Suggests either:

- Numerator/denominator mix-up (orders attributed to search counted multiple times; or a ratio of search-orders to a smaller subset rather than total orders)
- Unit confusion (perhaps a multiplier was applied; e.g. raw fraction `3.9423` rendered as a percentage that should have been `0.039423 * 100 = 3.94%`)
- Stale aggregation (one period's numerator + a different period's denominator)

### Fix request (Problem B)

Investigate the `searchOrderShare` calculation in the orders aggregation service. Validate that:

```
searchOrderShare = (orders_attributed_to_organic_search / total_orders_in_period) * 100
```

…and bounds-check `[0, 100]` before serializing (or, if `>100` is legitimate for some reason, document why and rename the field — e.g. `searchOrdersIndex` — so consumers don't mis-render it as a percentage).

---

## Frontend posture (current)

Per Story 119.1-FE Boundary Normalizer:

- `key` drift → `normalizeSearchOrderItem` coerces numeric → string, drops null/undefined/boolean/object/array. Behavior already preserves both Story 117.1-FE (coerce) and Story 117.4-FE (filter) stances.
- `searchOrderShare` anomaly → field widened to `number | null` (Story 119.1-FE 1st-pass F-2) and preserved as-is per Defensive Frontend Principle. UI may eventually surface a warning indicator for `> 100` values.
- Defense-in-depth retained at component layer (`toChartRows`, `pickTopByOrders`, `cross-reference-utils.ts mergeSearchAndAdData`) per Story 119.1-FE convention.

No frontend change is required when this ticket lands — the normalizer absorbs whatever shape arrives. But the underlying contract clarity (Problem A) + calculation correctness (Problem B) belong in the backend.

---

## Cross-references

- Request #175 — `by-product` / `by-query` 500 errors (different scope; line 40 of #175 explicitly disclaims this ticket's content)
- Story 117.1-FE — origin of the key-drift defects
- Story 117.2-FE Side-observation — origin of the `394.23` data point
- Story 117.4-FE — pickTopByOrders null-filter stance
- Story 119.1-FE — Boundary Normalizer (FE absorption layer)

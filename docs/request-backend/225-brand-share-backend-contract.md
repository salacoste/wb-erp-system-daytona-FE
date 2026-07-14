# Backend Contract — Brand-Share Competitive Analytics (PR4b)

**Status:** ✅ Backend LIVE (`GET /v1/analytics/brand-share*` — 3 endpoints).
**Date:** 2026-07-04
**Implements:** PR4b — SelSup-parity competitive intelligence via the WB "Доля бренда" API.
**For:** Frontend — build a brand competitive-positioning view (rating + share over time per category).

> Competitor **prices** are NOT exposed by the WB API (scraping-gated, ToS-risky — see gap-08 PR4
> SPIKE). This is the WB-sanctioned competitive signal: **brand rating + share by price/quantity**
> within a category, as a daily time series.
>
> Auth/isolation unchanged: `Authorization: Bearer <jwt>` + `X-Cabinet-Id: <uuid>` + ownership verified.

---

## Endpoints (3-method chain, all read-only)

### 1. Brands

```
GET /v1/analytics/brand-share/brands
```
`200` → `string[]` — brand names available for brand-share analysis in the cabinet
(e.g. `["DURABOND", "Acme"]`). Start here; pick a brand for steps 2–3.

### 2. Parent subjects (categories the brand competes in)

```
GET /v1/analytics/brand-share/parent-subjects?brand=DURABOND&dateFrom=2026-06-27&dateTo=2026-07-04
```
`200` →
```ts
[{ parentId: number, parentName: string }]   // e.g. [{ parentId: 8555, parentName: "Отделочные материалы" }]
```
`dateFrom` / `dateTo` are optional (`YYYY-MM-DD`); default = trailing 7 days. Pick a `parentId` for step 3.

### 3. Brand-share time series

```
GET /v1/analytics/brand-share?brand=DURABOND&parentId=8555&dateFrom=2026-06-27&dateTo=2026-07-04
```
`200` →
```ts
{
  report: [
    { applyDate: string, brandRating: number | null, pricePercent: number | null, qtyPercent: number | null },
    …
  ]
}
```
| Field | Meaning |
|---|---|
| `applyDate` | WB apply date (MSK ISO). One row per day in the window. |
| `brandRating` | Brand rating/position for the day (WB score). |
| `pricePercent` | Brand's share of the category by PRICE (%). `0` / `null` when WB has no data for the day. |
| `qtyPercent` | Brand's share of the category by QUANTITY sold (%). |

**Errors:** `503 ServiceUnavailableException` with the WB status/message if the upstream call fails.

---

## FE integration

- **Brand dropdown** — `/brand-share/brands` → `<Select>`.
- **Category dropdown** — `/brand-share/parent-subjects?brand=…` → `<Select>` (pick `parentId`).
- **Trend chart** — `/brand-share?brand=…&parentId=…&dateFrom=…&dateTo=…` → line chart of
  `brandRating` (invert axis if lower-is-better) + `pricePercent` / `qtyPercent` (share growth).
- Reasonable default window: last 7–30 days (WB accepts longer; this cabinet had data for the test).

## v1 boundaries

1. **Not competitor prices** — this is brand rating + share, not per-SKU competitor price tracking
   (WB doesn't expose that; scraping is out of scope).
2. **`pricePercent`/`qtyPercent` may be 0** for low-volume brands/days — render `—`, not `0 %` (anti-pattern #8).
3. **Category is WB "parent subject"** — a WB category grouping, not our `Product.subject` axis.
4. **Per-cabinet** — the WB token resolves per cabinet; each cabinet sees only its own brands.

## Verification

- Backend: `npm run rebuild` GREEN; `src/analytics` brand-share spec GREEN (6 tests: brands mapping,
  empty-payload tolerance, parent-subjects mapping + date forwarding, default 7-day window,
  brand-share report mapping, error → ServiceUnavailableException). docs:generate 346 endpoints.
- The 3 SDK methods were confirmed working live in the PR4 SPIKE (2026-07-04).

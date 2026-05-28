# Request #175 — Search Analytics `by-product` + `by-query` return 500

**Discovered**: Story 117.2-FE live verification (2026-05-28)
**Severity**: Medium (two of three search-analytics endpoints non-functional)
**Status**: PENDING BACKEND

## Problem

`GET /v1/analytics/search/by-product` and `GET /v1/analytics/search/by-query` return `INTERNAL_SERVER_ERROR` (HTTP 500) for the seeded Test Cabinet (`f75836f7-c0bc-4b2c-823c-a1f3508cce8e`).

## Reproduction

Auth as `test@test.com`, cabinet `f75836f7-c0bc-4b2c-823c-a1f3508cce8e`:

```
GET /v1/analytics/search/by-product?nmId=321678606&from=2026-01-01&to=2026-05-28&limit=5
→ {"error":{"code":"INTERNAL_SERVER_ERROR","message":"Internal server error", ...}}

GET /v1/analytics/search/by-query?query=краска&from=2026-01-01&to=2026-05-28&limit=5
→ {"error":{"code":"INTERNAL_SERVER_ERROR", ...}}
```

`nmId=321678606` is a real product in the cabinet (`/v1/products`). `nmId=1` (invalid) also 500s rather than returning empty/404.

## Working endpoint (for contrast)

`GET /v1/analytics/search/orders?from=...&to=...&groupBy=query` works and returns data (e.g. `totalSearchOrders: 25601`). So the search-analytics module is partially functional — only `by-product` and `by-query` fail.

## Impact

- Epic 71-FE shipped the By-Product + By-Query tabs against these endpoints; they will show error states for this cabinet until fixed.
- Story 117.2-FE could only revenue-verify the `/orders` endpoint (which confirmed revenue fields are absent — see Story 117.2-FE Branch A). The by-product/by-query revenue shape could not be data-verified due to this 500.

## Fix scope

Investigate the 500 in the `by-product` / `by-query` service path (likely a query/aggregation error or missing-data guard). Distinct from the revenue question (Request context: revenue is correctly absent per Story 117.2-FE; this is a separate availability defect).

## Notes

- `searchOrderShare: 394.23` in the `/orders` summary also looks anomalous (a share >100%) — possibly a separate calculation issue worth checking while in this code path. Not the focus of this ticket.

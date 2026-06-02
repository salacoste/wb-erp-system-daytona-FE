# Request #181 — FBS Stock: response contract mismatch (FE renders empty/wrong)

**Originated by**: Frontend validation campaign (validation finding F-18), 2026-06-02
**Severity**: P1 — the FBS Stock page (`/analytics/fbs-stock`) groups + sizes tables render EMPTY against the live backend; the FE normalizer + types were built for a different contract than the backend serves.
**Status**: PENDING BACKEND (needs contract reconciliation — FE cannot fix unilaterally)

---

## Problem

The FE `fbs-stock-normalizer.ts` and `FbsStockGroupItem`/`FbsStockSizeItem` types expect a different envelope AND different fields than `GET /v1/analytics/fbs/stock/{groups,sizes}` actually returns.

### Envelope mismatch
- **FE expects**: `{ data: { groups: [...] }, period, generatedAt }` (normalizer reads `r.data.groups`)
- **Backend sends** (live, cabinet `f75836f7…`, `?from=2026-05-01&to=2026-06-02`): `{ items: [...], summary, period }` (top-level `items`, no `data` wrapper)
- Result: `Array.isArray(data.groups)` is false → `groupsRaw = []` → **table always empty** (despite 45 live groups).

### Field mismatch (the deeper issue)
| FE `FbsStockGroupItem` expects | Backend group item provides |
|---|---|
| `groupName` | `groupName` ✅ (only match) |
| `skuCount` | — (absent) |
| `stockUnits` | — (absent) |
| `stockValue` | — (absent) |
| `averageDailyOutgoing` | — (absent) |
| `daysOfCover` | — (absent) |
| — | `groupId`, `totalQuantity`, `quantityInOrders`, `quantityAvailable`, `warehouses` |

So even after fixing the envelope, every FE column except `groupName` would render `0`/`—` — the backend serves a **quantity-breakdown** shape (total / in-orders / available) while the FE was designed for a **stock-summary** shape (SKU count / stock value / days-of-cover).

### Also: regions endpoint 500
`GET /v1/analytics/fbs/stock/regions` reportedly returns HTTP 500 (to re-confirm).

## Requested resolution (needs a decision)

Reconcile the contract — pick one:
1. **Backend adds the FE-designed fields** (`skuCount`, `stockUnits`, `stockValue`, `averageDailyOutgoing`, `daysOfCover`) under `data.groups` / `data.sizes`, matching the original spec the FE was built to.
2. **FE adopts the backend's actual fields** (`totalQuantity`, `quantityInOrders`, `quantityAvailable`, `warehouses`) — requires redesigning the FbsStock types + table columns + normalizer (a FE feature change, needs product sign-off on which metrics to show).

Option 2 is likely correct if the backend's quantity-breakdown is the intended analytic, but the choice is a product decision. Please confirm the canonical FBS-stock contract + fix the regions 500.

## Evidence
- Live groups item keys: `['groupId','groupName','totalQuantity','quantityInOrders','quantityAvailable','warehouses']`
- FE: `frontend/src/lib/api/fbs-stock-normalizer.ts` (`normalizeFbsStockGroupsResponse` reads `r.data.groups`; `normalizeGroupItem` expects skuCount/stockValue/daysOfCover).

# 207 — Liquidity sort: enum rejects FE columns; no `velocity_per_day` sort

**Status**: RESOLVED (2026-06-06) — Backend added velocity_per_day to LiquiditySortByEnum. Sort implemented by avgDailySales.
**Severity**: was CRITICAL on FE (page-blanking 400) — now mitigated client-side; this ticket is the backend half
**Discovered**: 2026-06-04 via a liquidity-page data-correctness audit
**Area**: `GET /v1/analytics/liquidity` — `LiquiditySortByEnum`

---

## Problem

The liquidity table offers three sortable columns — **turnover_days**, **stock_value**, **velocity_per_day**. The backend `LiquiditySortByEnum` (`src/analytics/dto/query/liquidity-query.dto.ts:25-30`) accepts only:

```
frozen_capital | turnover_days | current_stock | product_name
```

with `@IsEnum` validation (`:76`). So when the user sorted by **stock_value** or **velocity_per_day**, the FE sent `?sort_by=stock_value`, the validator returned **HTTP 400**, and the whole liquidity page fell into its error state (blank). Verified against backend source (enum + `@IsEnum`).

## FE mitigation already shipped (this commit)

- `stock_value` → mapped to **`frozen_capital`** for the request. These are the **same metric** — backend `frozen_capital = current_stock × unit_cost` (`turnover-calculator.ts`), which the FE renames to `stock_value` in its item mapper. So this mapping is exact and needs no backend change.
- `velocity_per_day` → there is **no backend velocity sort**, so the FE requests a `turnover_days`-ordered page and sorts velocity **client-side** over the returned ≤200 rows.
- `LiquidityQueryParams.sort_by` (FE type) tightened to the backend enum so an invalid value is now a compile-time error.

The page no longer 400s. No backend change is strictly required for correctness.

## Requested backend enhancement (optional but recommended)

Add **`velocity_per_day`** (sort by `avg_daily_sales`) to `LiquiditySortByEnum` and `applySort`.

**Why**: the page caps results at `limit: 200` (not paginated). For sellers with **>200 SKUs**, client-side velocity sort only orders the 200 items the backend selected by *turnover* — the globally highest-velocity SKUs may not be in that page at all. A backend `velocity_per_day` sort would let the backend select the top-200 *by velocity*, eliminating the truncation gap. The FE would then drop its client-side velocity special-case and send `sort_by=velocity_per_day` directly.

**Scope**: one enum member + one `ORDER BY avg_daily_sales` branch in the liquidity sort. Low effort.

## Not requested
- `stock_value` does NOT need adding — it equals `frozen_capital`, already supported.
- `current_stock` / `product_name` are already in the enum (the FE could expose them as columns later).

## Affected files (FE, for reference)
- `frontend/src/lib/liquidity-sort.ts` (mapping + client sort)
- `frontend/src/types/liquidity.ts` (tightened `sort_by`)
- `frontend/src/app/(dashboard)/analytics/liquidity/page.tsx`

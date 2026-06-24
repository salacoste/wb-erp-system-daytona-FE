# Backend Findings — handoff from FE UX validation (2026-06-24)

> Consolidated backend-owned findings from the `/loop` UX/UI + data-correctness validation (8 iters). **Hand to the backend team.** FE-owned findings are in `frontend/.omc/ux-validation/findings-frontend.md`. Full ticket detail for the top 2 is in `#212` and `#213` (same dir).

Test cabinet: `f75836f7-c0bc-4b2c-823c-a1f3508cce8e` (`<test-user-email>`). All reproduced live against `:3000` on 2026-06-24.

## Inventory

| ID | Finding | Severity | Endpoint | Ticket |
|----|---------|----------|----------|--------|
| **BE-1** | `net_profit_after_tax` / `net_profit_after_all_tax` violate accounting invariants (dashboard shows +445 588 profit on a −11 585 operating loss) | **CRITICAL** | `/v1/analytics/weekly/finance-summary` | **#213** |
| **BE-2** | `/v1/analytics/fbs/enhanced` → 500 (whole `/analytics/fbs-enhanced` page dead) | HIGH | `/v1/analytics/fbs/enhanced` | ✅ DONE (#212) |
| **BE-3** | `/analytics/liquidity`: frozen capital = **0 ₽** across stocked SKUs + misleading «0,0 %» category headlines | HIGH | `/v1/analytics/liquidity` (+ stock source) | ✅ DONE |
| **BE-4** | finance-summary figures **drift across captures minutes apart** (non-idempotent re-processing?) | MED | `/v1/analytics/weekly/finance-summary` | ✅ not a defect |
| **BE-5** | `/settings/cabinet`: seller-rating & subscription return WB-API upstream errors (token health) | MED | `/v1/cabinets/{id}/seller-rating`, `/seller-info`, `/jam-status` | ✅ cascade fixed |
| **BE-6** | Liquidity/SKU rows show `Unknown · Unknown` brand/category (product metadata gap) | LOW | product/analytics aggregation | NEW |
| **BE-7** | forecast-accuracy: consider surfacing a MAPE-validity flag / canonical lead metric (MAPE explodes near zero) | LOW | `/v1/ai/forecast-accuracy` | ✅ DONE |
| **BE-8** | No month-aggregation endpoint — FE fetches finance-summary per-week (×N weeks) for month view, causing the dashboard's ~15-request burst on Неделя→Месяц toggle (FE-15). A `?month=YYYY-MM` (or date-range) variant would collapse N → 1 | MED | `/v1/analytics/weekly/finance-summary` (new month/range variant) | NEW |

---

### BE-1 (CRITICAL) — net-profit invariant violation — **ticket #213**
`summary_total.tax.net_profit_after_all_tax` (445 588,51) and `net_profit_after_tax` (303 878,81) both **exceed** `operating_profit_analytical` (−11 584,91), and `net_after_all_tax` > `net_after_tax` (backwards). Net profit cannot exceed operating profit. The dashboard hero «Чистая прибыль» faithfully displays `net_profit_after_all_tax`, telling the owner they earned +445 588 while the business lost ~11 585. Fix: recompute both from `operating_profit_analytical` (`net_after_tax = operating − УСН`; `net_after_all_tax = operating − УСН − НДС`) + invariant regression test. Full detail + repro in **`213-FINANCE-SUMMARY-NET-PROFIT-INVARIANT-VIOLATION.md`**.

### BE-2 (HIGH) — fbs-enhanced 500 — **ticket #212**
`GET /v1/analytics/fbs/enhanced?from=2026-05-26&to=2026-06-24` → 500 `INTERNAL_SERVER_ERROR` (trace `9a7db6a6-90ea-4795-afdf-f4c6f44e26eb`). Sibling endpoints 200. Likely a regression from the #202 FE-compat alias code path or a separate failure. Full detail + repro in **`212-FBS-ENHANCED-500-INTERNAL-SERVER-ERROR.md`**.

### BE-3 (HIGH) — liquidity frozen capital = 0 ₽ (✅ RESOLVED 2026-06-24)
`/analytics/liquidity` categorizes **48 real SKUs** (13 высоколиквидных / 12 средних / 4 низких / 19 неликвид) with real stock (e.g. 76 шт, 4 шт) but every category hero showed **«0 ₽» замороженного капитала**. Frozen capital = `stock × cogs` — returning 0 across stocked SKUs was a **data-join gap, not a calc bug**.
- **Root cause:** schema/DB type drift — DB `nm_id` columns are `bigint` but Prisma declares them `Int`. `getLatestStocks` (Prisma `findMany`) returned a number key while `getCogsBySku`/`getProductsInfo` (`$queryRaw`) returned a string key (bigint→string) → `cogsMap.get(nmId)`/`productsMap.get(nmId)` missed every entry → `unit_cost` null → frozen capital 0 (and product names fell back to «SKU {nmId}», categories «Unknown»).
- **Fix:** `Number()`-coerce both the map keys and the lookups in `liquidity-analysis.service.ts` (matching the existing `velocity.get(String(nmId))` pattern) + NULL guard on the cogs query. Verified live: `total_frozen_capital` 0 → **2 000 063 ₽**, 35/43 stocked SKUs joined. **Also resolves BE-6** («Unknown · Unknown») for the liquidity page (same product-join fix).
- **Repro (historical):** login test user → `/analytics/liquidity` → was «0 ₽» per category while table showed stocked SKUs.

### BE-4 (MED) — finance-summary value drift (✅ INVESTIGATED 2026-06-25 — not a defect)
Across captures minutes apart (2026-06-24, same week W25), `operating_profit_analytical` moved 7 000,8 → −11 584,91 and `net_profit_after_all_tax` 189 651,45 → 445 588,51. Suspected non-idempotent re-processing.
- **Finding: not a defect.** The aggregation is **idempotent per-input** — `weeklyMarginFact.upsert` (`margin-calculation.service.ts:399`) and `weekly_payout_total/summary` all upsert by the unique key *(week, cabinet, reportType)*. Re-running with identical source data yields identical results.
- The observed drift was **mid-import data accumulation** during the active `/loop` validation session (a background import / COGS reassignment was mutating the source rows, so the aggregate correctly converged as data flowed in). Verified stable post-import: W25 and W20 are byte-identical across reads 10s apart (`operating`/`net_after_all_tax`/`cogs_total` unchanged). The #213 query-time recompute also makes `net_profit_after_tax*` fresh per request.
- **Caveat (by design, not a bug):** past weeks are **re-statable** — a re-import or COGS reassignment for a finalized week will legitimately change its aggregate. If business wants finalized weeks immutable, that's a separate locking requirement, not a code fix.

### BE-5 (MED) — cabinet WB-API upstream errors (✅ FIXED cascade 2026-06-25; 1 follow-up)
`/settings/cabinet` showed «Рейтинг недоступен: Ошибка WB API» / «Проблема с WB API токеном». Investigated live:
- **Token is healthy** (`/token-status` → `healthy: true`, lastSuccess recent); `/seller-info` returns valid data. So the "token problem" framing was wrong.
- **Real bug (FIXED):** `/seller-rating` calls WB `/api/common/v1/rating` which returns **HTTP 404** (stale endpoint). `WbGeneralService` then called `TokenHealthService.markUnhealthy` on **any** error (no status-code guard), so a 404 endpoint cascaded into a **false "token invalid" state** that could disable syncs. Same defect in the `seller-info` path.
- **Fix:** applied the existing **Story 87.4 pattern** (`if (errorStatus === 401) markUnhealthy`) to `getSellerRating` + `getSellerInfo` in `src/shared/wb-api/wb-general.service.ts` (the Jam path already had it). Only 401 marks unhealthy; 404/5xx are WB API/contract issues. Live-verified: after the rating 404, `token-status` stays `healthy: true`.
- **Follow-up (open):** the `/common/v1/rating` **404 itself** — WB likely moved/removed the endpoint. `/seller-rating` still returns `available: false, reason: wb_api_error` (graceful) until the SDK/endpoint URL is updated against current WB docs. Needs WB-API verification.

### BE-6 (LOW) — `Unknown · Unknown` product metadata (NEW)
Liquidity (and some SKU) rows render `Unknown · Unknown` for brand/category — product dimension metadata missing in the aggregation. Enrich/require brand+category on product records.

### BE-7 (LOW) — forecast-accuracy MAPE (✅ DONE 2026-06-25)
MAPE exploded to thousands of % (e.g. 4845%) when some SKUs had small non-zero actuals — the page warned the user with an alarming headline.
- **Fix:** `/v1/ai/forecast-accuracy` now exposes a top-level **`mapeValid: boolean`** — `false` when any individual evaluation was clamped to `MAX_PERSISTABLE_MAPE` (9999.99), i.e. MAPE is contaminated by small-actual SKUs. `avgMAE` (the non-exploding lead metric) was already exposed. The FE (FE-9) can now lead with `avgMAE` and suppress/flag MAPE when `mapeValid=false`.
- **Live-verified:** `totalValidated=199, avgMAPE=4845.04 → mapeValid=false, avgMAE=351.4`. New pure helper `computeMapeValid()` + 4 unit tests; tsc/ESLint clean.

---

### BE-8 (MED) — no month-aggregation endpoint (FE-15 over-fetch) (NEW)
`/v1/analytics/weekly/finance-summary` is **week-only**. For month view, the FE (`useFinancialSummary(period,'month')`) has no month endpoint, so it fetches **every week in the month** in parallel (raw per-week `apiClient.get`) and aggregates client-side — the source of the dashboard's ~15-request burst on the Неделя→Месяц toggle (FE-15). The week view IS correctly deduped (single queryKey `['financial','summary',period,'week']`). A `?month=YYYY-MM` (or `?from=&to=` date-range) variant returning the same aggregated shape would collapse N per-week requests → 1, removing the burst. FE can't safely eliminate these requests without it (month aggregation needs RAW responses; reusing the margin-processed week cache causes double-processing).

## Recommended backend order
1. **BE-1 (#213)** — money-level correctness on the #1 dashboard metric.
2. **BE-3** — hidden frozen-capital gap (Ops-fatal, looks fine when it isn't).
3. **BE-2 (#212)** — dead analytics route.
4. **BE-4 / BE-5 / BE-6 / BE-7** — stability + data-quality hardening.

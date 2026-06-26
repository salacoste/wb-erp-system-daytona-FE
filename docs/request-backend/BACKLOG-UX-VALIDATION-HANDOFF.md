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
| **BE-6** | Liquidity/SKU rows show `Unknown · Unknown` brand/category (product metadata gap) | LOW | product/analytics aggregation | ✅ RESOLVED — 0 enrichable gap (verified live 2026-06-26; residual «Unknown» = 4 WB-source brand-less products, not a defect) |
| **BE-7** | forecast-accuracy: consider surfacing a MAPE-validity flag / canonical lead metric (MAPE explodes near zero) | LOW | `/v1/ai/forecast-accuracy` | ✅ DONE |
| **BE-8** | No month-aggregation endpoint — FE fetches finance-summary per-week (×N weeks) for month view, causing the dashboard's ~15-request burst on Неделя→Месяц toggle (FE-15). A `?month=YYYY-MM` (or date-range) variant would collapse N → 1 | MED | `/v1/analytics/weekly/finance-summary` (new month/range variant) | ✅ DONE |

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
- **Follow-up (investigated 2026-06-25 — token-type limitation, not a stale endpoint):** WB release notes confirm `/api/common/v1/rating` is the **correct path** but is **"available by Service token"**. The test cabinet uses a **personal** token → 404 (can't access a service-token endpoint). So the URL is NOT stale; rating is genuinely unavailable for personal-token cabinets. In production, cabinets with a service token get the rating. `/seller-rating` correctly degrades to `available: false, reason: wb_api_error`.
  - **Consistency fix applied:** `getSellerRating`/`getSellerInfo` now pass `errorStatus` to `classifyWbApiErrorReason` (they previously ignored it, so a 401 would misclassify via fragile msg-matching). Mirrors the Jam path. +1 unit test (status-bearing 401 → `insufficient_permissions`).

### BE-6 (LOW) — `Unknown · Unknown` product metadata (✅ RESOLVED 2026-06-26 — code-drift fixed 2025-06-25 + data-gap re-verified as NON-ISSUE)
Liquidity (and some SKU) rows rendered `Unknown · Unknown` for brand/category. Two distinct mechanisms produce the same symptom:
- **Join drift (FIXED):** `SkuFinancialsDataService.getStorageOnlySkus` (`src/analytics/services/sku-financials-data.service.ts:191`) built its `productInfoMap` from a `$queryRaw` (bigint `nm_id` → **string** at runtime, despite the `number` annotation) and looked it up with a **number** `nmId` (from `findMany`-typed `storageMap`) → missed every entry → `brand`/`category` fell back to `null`. Same defect class as BE-3 (liquidity). **Fix:** `Number()`-coerce both the map key and the lookup (mirrors BE-3). +2 unit tests (drift-fixed join; null fallback for genuine data gap). All other brand/category surfaces (by-brand, by-category, sku-financials main query, comparison) resolve brand/category in **SQL** (`GROUP BY brand`/`MAX(subject)` with `COALESCE(…,'Unknown')`) — no JS nm_id join, so the drift doesn't apply there.
- **Data gap (re-verified 2026-06-26 → NOT the blocker originally thought):** the original note flagged `wb_finance_raw.brand` NULL in ~all rows and concluded a separate ingest-enrichment epic was needed. **That conclusion was a misdiagnosis** — analytics resolve brand/category from the **`products` table** (populated via WB Content API `getCardsList`), NOT from `wb_finance_raw`. Live verification (playwright-cli, 2026-06-26): `/analytics/brand` renders **5 real brands** (Trekka, Space Chemical, Protape, DURABOND, О,ДЕНЬ) + **1 «Unknown»**; `/analytics/category` renders **13 real categories** + **1 «Unknown»**. So there is **no widespread «Unknown» problem and 0 enrichable gap** — the residual «Unknown» is the ~4 products whose `products.brand` is NULL at the **WB Content API source** (genuinely brand-less on WB's side), not a backend defect. The ingest-time enrich-on-write epic would be plumbing for a non-existent gap and is **cancelled**. Backend resolution + evidence: `BE-TRACK-OPEN-ITEMS-RESOLVED-2026-06-25.md` §2. (Note: the exact `wb_finance_raw` NULL percentage — 100% here vs backend's ~23% `nm_id=0` — is moot, since brand is never read from that table for analytics.)

### BE-7 (LOW) — forecast-accuracy MAPE (✅ DONE 2026-06-25)
MAPE exploded to thousands of % (e.g. 4845%) when some SKUs had small non-zero actuals — the page warned the user with an alarming headline.
- **Fix:** `/v1/ai/forecast-accuracy` now exposes a top-level **`mapeValid: boolean`** — `false` when any individual evaluation was clamped to `MAX_PERSISTABLE_MAPE` (9999.99), i.e. MAPE is contaminated by small-actual SKUs. `avgMAE` (the non-exploding lead metric) was already exposed. The FE (FE-9) can now lead with `avgMAE` and suppress/flag MAPE when `mapeValid=false`.
- **Live-verified:** `totalValidated=199, avgMAPE=4845.04 → mapeValid=false, avgMAE=351.4`. New pure helper `computeMapeValid()` + 4 unit tests; tsc/ESLint clean.

---

### BE-8 (MED) — no month-aggregation endpoint (FE-15 over-fetch) (✅ DONE 2026-06-25)
`/v1/analytics/weekly/finance-summary` was **week-only**. For month view, the FE (`useFinancialSummary(period,'month')`) had no month endpoint, so it fetched **every week in the month** in parallel (raw per-week `apiClient.get`) and aggregated client-side — the source of the dashboard's ~15-request burst on the Неделя→Месяц toggle (FE-15).
- **Fix:** the endpoint now accepts EITHER `?week=YYYY-Www` (unchanged) OR `?month=YYYY-MM` (new). The month variant expands the month → ISO weeks using the **FE's Thursday-midpoint rule** (`monthFromWeek`: a week belongs to the month its Thursday falls in — not calendar overlap, which mis-attributes boundary weeks and spills into the next ISO year at year-end), filters to ≤ last-completed week, fetches each week in **parallel** via the existing cached `getWeeklySummary`, and aggregates `summary_total` server-side via a faithful port of the FE `aggregateFinanceSummaries` (`src/analytics/services/finance-summary-aggregation.ts`). Returns the same `FinanceSummaryResponseDto` shape with `summary_total` = Σ weeks (`summary_rus`/`summary_eaeu` null — the month total is authoritative). XOR validation (`week` XOR `month`, else `AMBIGUOUS_PERIOD`); future-month → `FUTURE_MONTH`.
- **Robustness vs FE:** weeks with no data (404) are **skipped** (the FE's `Promise.all` fails the whole month if any week 404s); tax-block fields are synced from the aggregated `tax` block so top-level never diverges from `tax.*` even when some weeks lack a tax snapshot.
- **Verification:** 85 unit tests (week-set Thursday rule incl. ISO-year boundary, additive sums, ratio recompute, tax sync, 404-skip, summary_rus-only exclusion); tsc/ESLint clean; analytics+aggregation+tax sweep **2983 tests green**; 3-pass adversarial review (Pass-1/2 caught a CRITICAL week-set divergence from the FE oracle — fixed & re-verified in Pass-3: MERGE-READY). **Live-verified** on test cabinet: `?month=2026-05` → W19–W22 (FE rule), `month == Σ weeks`, `net_profit_after_all_tax` top-level == tax block, guards (AMBIGUOUS_PERIOD/FUTURE_MONTH/backward-compat) all correct.
- **FE adoption (separate task):** `useFinancialSummary(period,'month')` can now replace its `Promise.all` of N per-week fetches with a single `apiClient.get('/v1/analytics/weekly/finance-summary?month='+period)` — collapsing the FE-15 burst to 1 request. FE computes `margin_pct` client-side (as today); the month `meta.week` is a comma-joined week list.

## Recommended backend order
1. **BE-1 (#213)** — money-level correctness on the #1 dashboard metric.
2. **BE-3** — hidden frozen-capital gap (Ops-fatal, looks fine when it isn't).
3. **BE-2 (#212)** — dead analytics route.
4. **BE-4 / BE-5 / BE-6 / BE-7** — stability + data-quality hardening.

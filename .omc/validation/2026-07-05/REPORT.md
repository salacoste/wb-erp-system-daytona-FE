# Runtime Data-Validation Report — P0 Financial Pages

**Date:** 2026-07-05 · **BE** live `:3000` · **FE** dev `:3100` · **Cabinet** `f75836f7-…-a1f3508cce8e`
**Primary week:** 2026-W26 (Mon 06-22 → Sun 06-28); W25 for period deltas.
**Method:** raw API (test JWT) + rendered via Playwright; reconciled against `docs/VALIDATION-PLAN.md` §7.2.
**Evidence:** per-page logs (`page-*.md`) + 21 raw payloads (`*.raw.json`) in this dir.

> **📍 2026-07-11 full live re-val:** all BE-owned findings (clusters A–F) re-checked against live BE — **all green, no blockers** (the original "BE bugs" were mostly validator test-param errors: camelCase vs snake_case, missing required `brand`/`dateFrom`/`dateTo`; the few genuine BE issues are since fixed). Full per-item table + live curl evidence in **[`RESOLUTIONS-2026-07-11.md`](./RESOLUTIONS-2026-07-11.md)**. FE-side: BE-A-1 fixed (PR #39), financial-gaps `cabinet_id` redundancy removed, FE contract-compliance verified (liquidity snake_case, brand-share params, supply-planning `999`→∞).

## TL;DR
- **Identity core is correct.** `Продажи(розница)`, `К перечислению`, `Заказы шт`, every WoW delta, and Σ advertising-by-day==summary all reconcile to the kopeck (A1, A2, A6, A7, B3 ✅).
- **The Feb-2026 «Валовая прибыль = sale_gross − cogs» misleading headline is FIXED** — dashboard now leads with **Чистая прибыль = `net_profit_after_all_tax`** (278 145,47 ₽, tax-aware).
- **🔴 BLOCKING data condition:** `cogs_total = 0` for W26 **and** W25. Until COGS is assigned, every COGS-dependent metric is structurally misleading: brand/category/period-card **Маржа → 100 %**, **Прибыль → Выручка**, `profitable_sku_count = sku_count` (100 % "profitable"). The FE shows «Без COGS» / «Не назначена» indicators but at secondary visual weight vs the degenerate headline numbers.
- **AP#8 correct at runtime** (SKU/UE render «—» for null money/ratio); the dashboard `Себестоимость: 0 ₽` hard-zero (BD-2) is **fixed** (`ec9105d0`: `cogs===0` → «—»).
- **Meaning/label cluster (C1/C2):** the same label «Маржа»/«Чистая прибыль» is used for genuinely different numbers across pages — needs distinct labels or tooltips.
- Two executor-flagged Highs **corrected on spot-verify**: BD-10 (`/by-category` "broken") is **not broken** (real categories + one «Unknown» bucket); BD-9 (card reads wrong field) needs field-level confirmation (the cited `47 281` source wasn't located in live `finance-summary`).

## A — Identity invariants
- **A1 Продажи (розница)** ✅ `620 333,59 ₽` == `sale_gross_total` == cabinet-summary `totals.sale_gross`.
- **A2 К перечислению** ✅ `311 545,26 ₽` == `payout_total` == cabinet-summary.
- **A3 Себестоимость** ⚠️ `0 ₽` == `cogs_total=0` (exact, but blocking — see C4).
- **A4 Логистика/Хранение** ✅ Логистика `74 634,81` == `logistics_cost_total`; Хранение `5 749,55` (= 4 309,55 + 1 440). **«Прочие удержания (WB сервисы)» — needs field confirmation (BD-9-pending).**
- **A5 Реклама** ⚠️ dashboard card `47 281 ₽` (WB-report `wb_promotion`) vs advertising-page `totalSpend 16 779,19 ₽` (PromotionAPI ad-cabinet) — different sources, same plain label «Реклама/Расход». Re-label dashboard → «Продвижение WB». (BD-12, Low)
- **A6 Заказы, шт** ✅ `186` == `fulfillment.summary.total.ordersCount` (FBO 49 + FBS 137) for ISO week 06-22→06-28.
- **A7 Period deltas (W26 vs W25)** ✅ all rendered deltas match `(W26−W25)/W25`: К перечислению −8,3 % · Продажи −1,1 % · Логистика +13,6 % · Хранение +21,2 % · Заказы +173,5 %.

## B — Aggregation invariants (W26)
- **B1** ⚠️ documented scope gap (NOT a bug): `Σ SKU revenue_gross 389 860,60 == wb_sales_gross_total 389 860,60` ✅ (exact); `Σ brand 387 152,60 == Σ SKU − wb_returns_gross_total 2 708,00` ✅ (exact). The 388 K vs `sale_gross_total` 620 K gap = **EAEU scope** (EAEU `sale_gross=42 840,59`) + the rus/eaeu report split. Needs an on-page EAEU flag.
- **B2** ⚠️ three legitimate SKU counts (by-sku distinct nm_id=44 active · Σ brand.total_skus=48 catalog · finance.products_total=37) — add explanatory tooltip.
- **B3** ✅ Σ advertising-by-day `spend` == `summary.totalSpend` exact, both weeks (W26 16 779,19 · W25 10 303,27).

## C — Meaning / label invariants
- **C1 «Маржинальность»** ❌ four values, same label: dashboard header **71,66 %** (`operating_margin_pct`) · dashboard period-card **100,0 %** (`gross_margin_pct`, cogs=0⇒100) · unit-economics **72,0 %** (`avg_net_margin_pct`) · SKU chart **−0,3 %** (avg per-SKU) · brand rows all **100,00 %** (cogs=0).
- **C2 «Чистая прибыль»** ❌ same label, different numbers: dashboard **278 145,47 ₽** (`net_profit_after_all_tax`) vs SKU page **311 545,16 ₽** (`payout_total`). (BD-11, Low)
- **C3 FBS/EAEU scope** ⚠️ under-flagged: `orders/trends.totalRevenue=74 577,07` is FBS-only; brand/SKU aggregation is WB-only (excludes EAEU 42 840,59). Dashboard correctly separates Выкупы (WB) from Продажи (combined) but only an expert would infer it.
- **C4 AP#8 at runtime** clean: SKU (`—` profit, «Не назначена» COGS) ✅ + UE (`avg_cogs_pct` null → `—`) ✅; the dashboard `Себестоимость: 0 ₽` hard-zero (BD-2) is **fixed** (`ec9105d0`: `cogs_total===0` → «—»/«не заполнена»).

## Findings
| ID | Sev | Owner | Finding | Status |
|----|-----|-------|---------|--------|
| **COGS-0** | 🔴 | **Data** | `cogs_total=0` W26+W25 → all COGS-dependent metrics misleading (Маржа→100 %, Прибыль→Выручка). Assign COGS for these weeks. | blocking |
| **BD-5** | 🟠 | FE | Brand/category/period cards show 100 % margin + profit==revenue at full weight when `cogs_coverage_pct==0`. Suppress/grey + CTA «Назначьте COGS». | **fixed + 2-pass reviewed (2026-07-08)**: suppress half already shipped (`MarginAggregatedTableRow` `hasCogs=(cogs??0)>0` gate → «—» cells; `periodComparisonFinancialHelpers` `cogs_total===0`→null; existing BD-5 tests). CTA half this session: new shared `MarginMissingCogsBanner` (reuses `MissingCogsAlert` → `/cogs?has_cogs=false`) wired into `/analytics/brand` + `/analytics/category`; count prefers `missing_cogs_count`, falls back to `cogs===0→total_skus` for stale payloads. 2-pass APPROVE, 0 CRITICAL/HIGH. (Note: line-85 "BD-5 latent" = a different supply-planning `avg_daily_sales ?? 0` item, still latent pending BE-C-1.) |
| **BD-2** | 🟠 | FE | Dashboard `Себестоимость: 0 ₽` hard zero (upstream `gross_profit=null`) → should be `—`+hint. | **fixed + no-op verified (2026-07-08)**: `ec9105d0` (in main) — `CostsCard` `hasNoCogs = cogsTotal == null \|\| cogsTotal === 0` → renders «—»/«не заполнена». Source-trace confirmed present, not reverted. |
| **BD-11** | 🟡 | FE | «Чистая прибыль» label for 278 145 (net_profit_after_tax) on dashboard vs 311 545 (payout_total) on SKU. | **fixed + no-op verified (2026-07-08)**: `97aa4162` (in main) — SKU `NetProfitRow label="ПРИБЫЛЬ ДО НАЛОГА"` + disambiguating note («…больше «Чистой прибыли» на дашборде на сумму налога»). |
| **BD-12** | 🟡 | FE | Dashboard «Реклама» (wb_promotion) vs advertising-page «Расход» (ad-cabinet) — same plain label. Re-label. | **fixed + no-op verified (2026-07-08)**: `02a1800a` (in main) — `AdvertisingCard cardLabel = useFinanceSrc ? 'Продвижение WB' : 'Реклама'` (source-tracked label). |
| **BD-9-pending** | ❓ | FE | «Прочие удержания (WB сервисы)» shows 0 ₽ — **field binding needs confirmation** (the cited `wb_services_cost_total=47 281` wasn't in live `finance-summary`; verify which field the card reads + whether it's absent upstream). | **verified — not a bug** (2026-07-07): field binding correct — card reads jam+other-services only; promotion (47 281) shown in its own card to avoid double-counting; 0 ₽ is genuine (jam=0, other=0). See RESOLUTIONS-2026-07-07.md. |
| **BD-10-corrected** | 🟡 | BE/FE | `/by-category` is **NOT broken** — returns 15 real categories (Автохимия 512, Восстановители кожи 15 845…); one leading «Unknown»/0 bucket. Minor data-quality, not a hard failure. | corrected down from High |
| **BE-1** | 🟡 | BE | `/v1/analytics/liquidity/trends` → 404; FE has `getLiquidityTrends` hook+normalizer (dead code or unshipped endpoint). | **verified — not dead code** (2026-07-07): endpoint returns HTTP 200 with empty `trends` series + info insight; FE hook is live-scaffolding pending backend Story 29.4. See RESOLUTIONS-2026-07-07.md. |
| **BE-2** | ℹ️ | BE | `/analytics/unit-economics` `view_by` validation emits an empty enum ("must be one of: "). `view_by=sku` works. | confirmed |
| **info** | ℹ️ | FE | SKU per-row «Маржа %» (`plb20` 4,9 %) ≠ `(revenue_net − expenses)/revenue_net` (74,6 %) — likely the known margin-aggregated ROI mapper gap (see project memory). Backend-contract check before fixing. | **BE-pending (2026-07-10)**: per-row «Маржа %» field semantics need a backend-contract decision (which field = «Маржа %»: `drr_pct` / `margin_pct` / `operating_margin_pct`). Extensive existing margin BE docs (`#189` ROI formula, `#214` per-SKU ad-attribution drr, `#215` net-profit tax-allocation). Not FE-fixable without BE contract — left pending per the original "Backend-contract check before fixing" note. |

## Resolved (non-findings)
- ✅ Feb-2026 ISSUE #2/#3 (Валовая прибыль = sale_gross − cogs misleading headline) — **fixed**: headline is now `net_profit_after_all_tax`.
- ✅ AP#8 implemented on SKU + UE pages (`—` for null money/ratio).
- ✅ All WoW period deltas (A7) match recomputed values.
- ✅ Advertising by-day spend sums to summary exactly (B3).

## Next (scope expansion)
P0 financial core done. Next batches (per VALIDATION-PLAN §7.4): new features shipped this week (orders confirm/cancel/meta actions, /automation canned-rules, /analytics/brand-share, /supplies acceptance-act) — interactive-element + contract validation; then the remaining analytics pages.

---

## Cluster C — Analytics inventory/ops (2026-07-06)

**Pages:** `/analytics/storage`, `/analytics/supply-planning`, `/analytics/reorder`, `/analytics/fbs-stock`, `/analytics/fbs-enhanced`.
**Evidence:** `pages/analytics-{storage,supply-planning,reorder,fbs-stock,fbs-enhanced}.md` + raw payloads (`storage-*`, `supply-planning-*`, `reorder-*`, `fbs-*`) · BE bugs in `BE-BUGS-C.md`.

**TL;DR — all 5 pages LOAD and render correctly on live data; data-correctness is strong (every shown number reconciles to its API field); the findings are labeling/AP#8-sentinel class, not broken pages.**

### Load verdict
- ✅ storage (3 endpoints 200), ✅ supply-planning (200), ✅ reorder (200, empty-data graceful), ✅ fbs-stock (3 endpoints 200), ✅ **fbs-enhanced 200 — the matrix D1 BE-500 is FIXED**.

### Data-correctness verdict (✅ exact across the board)
- Storage W24-W26: 11 746 ₽ / 42 SKU / 280 ₽ avg / 22 days — all match `summary.*` to the kopeck/unit; top-consumer + per-SKU rows match (`storage_cost_total`, `percent_of_total`, `storage_to_revenue_ratio`, `storage_cost_avg_daily`, `days_stored`).
- Supply-planning: 5 risk buckets (7/9/1/0/33), «Требуется капитал 547 870 ₽» == `total_reorder_value` exact; per-row stock/quantity/value map; no-cogs rows render «—» for Сумма/Цена.
- Fbs-stock: groups + regions tables match (`stockUnits`, `shareOfTotalPct`, `stockValue=null→—`).
- Fbs-enhanced: order-stats + stock-analytics cards match (`totalStock 3870`, `productCount 51`, etc.); funnel nulls → «—».

### Findings
| ID | Sev | Owner | Finding | Status |
|----|-----|-------|---------|--------|
| **BE-C-1** | 🟠 | BE | `/v1/analytics/supply-planning` returns identical ML velocity `14.39/day` for 12 distinct SKUs (all `forecast_source=ml`, conf ~0.47); reorder quantities + «Требуется капитал» derived from it. Likely ML fallback constant. (see `BE-BUGS-C.md`) | **✅ resolved (2026-07-11 live re-val)**: `avg_daily_sales` now distinct per-SKU (8.82/26.59/38.31/10.07 ML, 0.01 velocity); no longer uniform. See `RESOLUTIONS-2026-07-11.md`. |
| **BD-43** | 🟡 | FE | `/analytics/fbs-enhanced` «Дней покрытия остатков **999,0**» renders the backend's 999 "never sells" sentinel as a literal number. `FbsCalculatedMetricsSection.tsx:71-73` null-guard misses it. Same class as BD-4. | **fixed + no-op verified (2026-07-08)**: `ec9105d0` (in main) — guard now `stockCoverageDays == null \|\| >= 999 ? '—'` + regression test (`FbsCalculatedMetricsSection.test.tsx:47` «BD-43: renders «—» for stockCoverageDays >= 999»). Source-trace confirmed present. |
| **BD-17** | 🟡 | FE | `/analytics/supply-planning` detail drawer «Горизонт планирования: 8 дней» actually = `safety_stock_units / avg_daily_sales` (safety-stock coverage), not a planning horizon. Confirmed live. | fixed + 2-pass reviewed (2026-07-07): label → «Покрытие страхового запаса:»; `formatPlanningHorizon` renamed `formatSafetyStockCoverage`; all src/test refs migrated (closed-story ASCII mockup excluded, APPEND-ONLY); render test locks the visible label (Pass-2 gap-closer). |
| **BD-16** | 🟡 latent | FE | `/analytics/storage` money fields use `toCount` (null→0) at normalizer + `formatCurrency(value:number)` no null guard → would show "0 ₽" for null storage cost. Not active on current data (all SKUs have costs). | fixed + 2-pass reviewed (2026-07-07): swapped `toCount`→`toNullableNumber` on 8 money fields (storage-queries + storage-trends normalizers); widened types to `number \| null`; null guards across 4 consumer files render «—» (3 `formatCurrency` wrappers + inline guards in `StorageTopConsumersWidget`); null-cost fixtures + unit/render tests added. |
| **BD-44** | 🟢 latent | FE | `/analytics/storage` trends `MetricSummary.min/max/avg` (`storage-trends-normalizer.ts`) used `toCount` on a **polymorphic** type shared between `storage_cost` (money) and `volume` (count) — AP#8 lie on the money metric. Fed `SummaryStats` → `formatCurrency` (active code path; latent only because current data is non-null). Pre-existing (2026-06-06), outside BD-16's named 8-field scope. Surfaced in BD-16 1st-pass review. | fixed + 2-pass reviewed (2026-07-07): split into `MoneyMetricSummary` (nullable money) + count `MetricSummary` (volume); both `SummaryStats` consumers null-guard «—» (analytics-page `StorageTrendsChartParts` + dashboard widget via `StorageTrendsWidget`). |
| **BD-5** | 🟡 latent | FE | `/analytics/supply-planning` `avg_daily_sales ?? 0` normalizer clamp (latent — backend currently returns 0/0.46/14.39, never null). | latent (BE-C-1 is the active one) |
| **BD-40** | 🟢 | FE | `/analytics/storage` deep-link `?week=YYYY-Www` does not apply the chart week-filter on direct navigation (`selectedWeek` seeded at `useState` init only). Minor UX gap. | **verified working (2026-07-10, Playwright)**: direct nav to `/analytics/storage?week=2026-W26` applies the filter — `WeekFilterBadge` renders «Фильтр: W26». `useStoragePageState.ts:42-44` reads `searchParams.get('week')` into `selectedWeek` (→ `effectiveWeek` → data fetches + badge). Stale finding; SPA-nav re-sync is the only residual gap (narrower than "direct navigation"), optional low-sev enhancement. |
| **BD-42** | 🟢 | FE | `/analytics/supply-planning` per-row «Потенциальные потери (₽)» inherits BE-C-1's uniform-velocity unreliability. Advisory (no fabricated null). | **✅ resolved (2026-07-11)**: BE-C-1 fixed (velocity now distinct per-SKU) → per-row loss projections no longer inherit a uniform-velocity lie. FE renders `days_until_stockout=999` (sparse SKUs) as **∞** via `formatDaysUntilStockout`. |
| **info** | ℹ️ | FE | `/analytics/reorder` empty-cabinet metric cards show «0 / 0 ч / 0 %» (could be «—») — contextualized by the empty table row, borderline. Same class as BD-35/37. | **verified — not a bug (2026-07-10)**: the «0» values are genuine counts (0 pending/ordered/received) — correctly classified SEMANTIC-ZERO (anti-pattern #8 exception) with explicit `eslint-disable` comments in `ReorderSummaryCards.tsx`. Showing «—» would lie; only the coverage-% card (a ratio) correctly renders «—» when null. No change. |

### Resolved (non-findings)
- ✅ **Matrix D1 `/analytics/fbs-enhanced` BE-500 — FIXED** (200, full payload, all sections render).
- ✅ `/analytics/storage` data-correctness is exact (every summary + table + top-consumer value reconciles).
- ✅ `/analytics/fbs-stock` AP#8-clean (stockValue/daysOfCover null → «—»).
- ✅ `/analytics/reorder` graceful empty-state («Нет рекомендаций по пополнению»).
- ✅ `/analytics/supply-planning` AP#8 for no-cogs rows (Сумма/Цена → «—», «Себестоимость не указана»).

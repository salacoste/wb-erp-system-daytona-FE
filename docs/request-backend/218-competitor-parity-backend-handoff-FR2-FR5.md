# Request #218: Backend Handoff — Competitor Financial-Report Parity (FR-2…FR-5)

**Date**: 2026-06-28
**Priority**: High (program)
**Status**: 🔵 Ready for backend pickup
**Component**: Backend — Analytics (by-SKU / by-brand / by-category) + Tax + Stock + Ads
**Requester**: Frontend Team
**Related**:
- Per-FR specs: `214-per-sku-ad-attribution-drr.md` (FR-2), `215-per-sku-net-profit-tax-allocation.md` (FR-3), `216-stock-at-purchase-price-and-share.md` (FR-4), `217-spp-cancellations-extra-costs.md` (FR-5)
- Competitor parity spec: `docs/competitor-analysis/competitor-financial-report-parity.md`

> Paths below are **backend** (`src/...` from repo root `wb-repricer-system-new/`, NOT `frontend/`). Line numbers are approximate — verify in current source.

---

## 0. TL;DR

- **One integration point for all 4 FRs:** the `by-sku` / `by-brand` / `by-category` weekly analytics endpoint. Extend 4 files (controller → query DTO → service → mapper).
- **FR-2, FR-3, FR-5 are mostly WIRING — the data already exists in tables.** Much cheaper than the raw "new backend contract" framing in #214–217 suggests.
- **FR-4 is the only one with a hard blocker** (no FBO stock table — async CSV only).
- **Mirror the existing `include_cogs` flag pattern** for any new optional fields (`include_ads`, `include_stock`, etc.).
- **Two pre-existing gaps** to decide on (§2) — they affect how new flags propagate.

---

## 1. The single integration point (extend these)

| Layer | Backend file | Note |
|---|---|---|
| Controller | `src/analytics/controllers/weekly/weekly-breakdown.controller.ts` | `@Get('by-sku')` ~L65, `by-brand` ~L111, `by-category` ~L155 |
| Query DTO (flag pattern) | `src/analytics/dto/query/weekly-by-sku-query.dto.ts` ~L114-123 | `include_cogs` — copy for `include_ads`/`include_stock` (also in brand/category query DTOs) |
| Response DTO (add fields) | `src/analytics/dto/response/sku-analytics.dto.ts` | `SkuAnalyticsDto` — already has placeholder `advertising_cost?` (~L260), `net_profit?` (~L272), `net_margin_pct?` (~L285) |
| Builder + flag merge | `src/analytics/services/sku-analytics.service.ts` | `getWeeklyBySku()` L54; `if (options.includeCogs)` merge block ~L148 |
| Mapper (populate) | `src/analytics/services/sku-analytics.mapper.ts` | `mapWeeklyBySkuRow` ~L138 (sets `advertising_cost: null` today); `mergeMarginData` ~L277 |
| by-brand/category (single-week) | `src/analytics/services/breakdown-analytics-query.service.ts` | supports `includeCogs` (L154, L352) |
| by-brand/category (range) | `src/analytics/services/breakdown-analytics-range.service.ts` | ⚠️ does NOT support `includeCogs` yet |

**`include_cogs` pattern to mirror** (from `weekly-by-sku-query.dto.ts`):
```ts
@IsOptional()
@Transform(({ value }) => value === 'true' || value === true)
@IsBoolean()
include_ads?: boolean = false;
```
Gating: `if (options.includeAds === true) { ... fetch + merge ... }`. When false, optional fields stay `null`.

---

## 2. Cross-cutting requirements (apply to all 4)

1. **Cabinet isolation** — the by-sku/brand/category controller uses the **older manual pattern**: `@Headers('x-cabinet-id')` + `cabinetOwnershipService.verifyOwnership(user.cabinet_ids, cabinetId)`. The FBS/stock controllers use the newer `@CurrentCabinet()` + `CabinetGuard`. **Both enforce `X-Cabinet-Id` + ownership.** Pick one convention for the new fields (recommend `@CurrentCabinet()` for consistency, but it's a controller-level choice).
2. **Nullability** — return `null` (not `0`) when a field is N/A. The FE renders `—` and never a misleading `0,0 %` (this is a hard FE rule — anti-pattern #8, ESLint-enforced).
3. **Flag-gate optional/heavy fields** behind `include_*` so cabinets without ads/stock aren't penalized.
4. **ISO-week cadence** — Mon–Sun, `Europe/Moscow`, aligned to the existing analytics week.
5. **Range-mode gap (pre-existing)** — `aggregateBySkuForRange` / `aggregateByBrandForRange` / `aggregateByCategoryForRange` don't accept `includeCogs`. Any new flag inherits this split unless range-mode is upgraded. Decide: upgrade range-mode too, or document single-week-only.

---

## 3. Per-FR detail

### FR-2 — per-SKU advertising attribution + ДРР %  *(mostly WIRING)*
- **Goal**: per-SKU `ad_spend` + `drr_pct` (+ optional `ad_attributed_revenue`, `ad_cost_per_unit`).
- **Data (already per-nmId!)**: `adv_daily_stats` table — `model AdvDailyStats` (`prisma/schema.prisma:792`), unique on `[cabinetId, advertId, date, nmId]`, has `spend`/`orders`/`orderSum`/`views`/`clicks`/`canceled`. Campaign→nmId map: `model AdvCampaign.nmIds Int[]` (`schema.prisma:771`); campaign type (auto vs manual) in `AdvCampaign.type`.
- **Compute (exists)**: `AdvQueryService.getBaseAdStats()` + `AdvMergeMetricsService` (ROAS/ROI/efficiency) — per-SKU attribution logic already lives in the advertising-analytics module (`src/analytics/services/adv-*.service.ts`). Cabinet-level `ad_spend` for tax is aggregated in `weekly-payout-persistence.service.ts:292`.
- **`wb_promotion` (the weekly-finance deduction)** is cabinet-level only: `WeeklyPayoutSummary.wbPromotionCost` / `WeeklyPayoutTotal.wbPromotionCostTotal`. (The FE already ships a "Доля продвижения WB" column from this — FR-1. The new ДРР is the **ad-attributed** metric, a different source. Keep both.)
- **Gap**: `SkuAnalyticsDto.advertising_cost` is hardcoded `null` (`sku-analytics.mapper.ts:138, :186`). No `include_ads` flag. The data + attribution service exist — **they're just not wired into the by-sku response.**
- **Backend work**: add `include_ads` flag → in `getWeeklyBySku`, when set, SUM `adv_daily_stats.spend` per nmId for the week (reuse `AdvQueryService`) → merge into the row → populate `advertising_cost`/`drr_pct`. Surface on by-brand/by-category (aggregate).
- **Blocking question (PM)**: attribution method for **auto-campaigns** (which aren't nmId-targeted): manual-only / proportional split by attributed revenue / WB-native? See #214 §"Open questions".
- **Effort**: **Low–Medium** (wiring + one product decision). The hard part (attribution service) exists.

### FR-3 — per-SKU net profit after tax + tax/VAT allocation  *(mostly WIRING if Epic 72 columns are populated)*
- **Goal**: per-SKU `tax_allocated`, `vat_allocated`, `net_profit_after_tax`.
- **Data (per-SKU tax columns ALREADY EXIST — Epic 72)**: `model WeeklyMarginFact` (`schema.prisma:456`) has `taxAmountRub` (L489), `netProfitAfterTaxRub` (L490), `netMarginAfterTaxPct` (L491). **⚠️ Backend must confirm these are actually populated** (the columns exist; verify the write path).
- **Compute (cabinet)**: `src/tax/tax-calculation.service.ts` (`calculate()` L32; USN6/USN15+1%min/Manual; VAT). Cabinet tax persisted to `WeeklyPayoutTotal` via `weekly-payout-persistence.service.ts:307`.
- **Per-SKU profit (exists)**: `margin-calculation.service.ts` — `grossProfitRub` (L348), `operatingProfitRub` (L381); per-SKU tax hook `buildPerSkuTaxMetrics(...)` at L240.
- **Gap**: the `WeeklyMarginFact` tax columns are NOT selected/merged into `SkuAnalyticsDto` — `mergeMarginData`'s select list (`sku-analytics.service.ts:155-174`) omits them. Also `net_profit` in the mapper (`:166`) is `revenueNet − cogs − logistics − storage − penalties` — **excludes tax & advertising**.
- **Backend work**: (a) confirm `WeeklyMarginFact.taxAmountRub`/`netProfitAfterTaxRub` are populated; if not, populate via the existing per-SKU tax hook. (b) Add them to the select + merge (behind `include_cogs` or a new `include_tax`). (c) Optionally expose a marketing-adjusted `net_profit` (after ad) — coordinate with FR-2.
- **Blocking question (PM)**: tax **allocation method** (proportional to operating-profit / revenue / COGS). FE recommends proportional-to-operating-profit. **Invariant**: `net_profit_after_tax ≤ operating_profit` per row (ties to Request #213). See #215.
- **Effort**: **Low–Medium** (mostly wiring, IF Epic 72 columns are populated; Medium if they need population).

### FR-4 — stock at purchase price + stock-share  *(HARD BLOCKER: FBO source)*
- **Goal**: per-SKU `stock_fbs`, `stock_fbo`, `stock_total`, `stock_value_rub` (stock × COGS/unit), `stock_value_share_pct`.
- **Data (FBS, exists)**: `inventory_snapshots` — `model InventorySnapshot` (`schema.prisma:722`): `totalStock`, `inWayToClient`, `inWayFromClient`, per `[cabinetId, date, nmId]`. Served by `regional-stock-db.service.ts` / `fbs-stock-analytics.controller.ts` (which hardcodes `stockValue: null` at L151).
- **Data (FBO — THE BLOCKER)**: **no normalized table.** Source is async CSV export only: `warehouse-remains.service.ts` (WB SDK `createWarehouseRemainsTask()` → poll → CSV). `InTransitShipment` (`schema.prisma:742`) tracks in-transit supply per nmId.
- **COGS/unit (exists)**: `model Cogs.unitCostRub` (`schema.prisma:435`), temporal lookup `idx_cogs_temporal_lookup`.
- **Gap**: stock × COGS valuation computed **nowhere**; `stockValue: null` hardcoded; stock not joined into by-sku analytics.
- **Backend work**: (a) compute `stock_value_rub = stock_total × Cogs.unitCostRub`; (b) join FBS stock into by-sku (behind `include_stock`); (c) **decide FBO**: persist warehouse-remains CSV into a table (new materialization) or compute on demand. (c) is the real work.
- **Blocking question (PM/backend)**: **FBO stock source** — materialize the CSV into a `warehouse_remains` table (recommended, enables history) or on-demand query? See #216.
- **Effort**: **Medium–High** (FBO materialization is the cost; FBS + valuation is Low).

### FR-5 — СПП + cancellations + extra costs  *(mostly WIRING)*
- **Goal**: per-SKU `spp_rub`/`spp_pct`, `cancellations_qty`, `extra_costs_rub`.
- **СПП (per-row EXISTS)**: `WbFinanceRaw.sppDiscountPercent` (`schema.prisma:292`). Today only cabinet-averaged: `WeeklyPayoutSummary.avgSppDiscountPercent` (`weekly-payout-aggregation-query.service.ts:298` — `AVG(spp_discount_percent)`). Per-SKU aggregation not surfaced.
- **Cancellations (EXIST in orders)**: `orders_fbs` — `model OrderFbs.wbStatus` (`schema.prisma:1151`) with `'canceled'`/`'canceled_by_client'`/`'declined_by_client'`/`'defect'`. Counted in funnel/fulfillment/FBS DTOs (`cancelCount`/`cancelRate`) but NOT joined into by-sku margin analytics.
- **Extra costs (ALREADY wired per-SKU — copy this)**: `WeeklyMarginFact` has `otherAdjustmentsRub` (L479), `loyaltyCompensationRub` (L478), `loyaltyFeeRub` (L477), `penaltiesRub` (L475) — **already surfaced when `include_cogs=true`** (`sku-analytics.service.ts:164-168`). This is the exact model to copy for the FR-5 fields.
- **Backend work**: (a) aggregate `spp_discount_percent` per-SKU (it's per-row on `wb_finance_raw`); (b) COUNT cancellations per-SKU from `orders_fbs` for the week; (c) confirm extra-costs mapping (already present). All behind `include_cogs` or a new flag.
- **Blocking questions (PM)**: СПП sign convention; cancellations scope (cancelled-in-period vs placed-then-cancelled); "extra costs" definition to avoid double-count. See #217.
- **Effort**: **Low** (pure wiring — data exists in adjacent tables; the extra-costs path is already done).

---

## 4. Revised priority + sequencing (informed by the data map)

| Order | FR | Why | Effort |
|---|---|---|---|
| 1 | **FR-5** | Cheapest (pure wiring; extra-costs path already exists). Quick parity win. | Low |
| 2 | **FR-2** | Highest user value (true unit margin after marketing); data + attribution service exist. One product decision. | Low–Med |
| 3 | **FR-3** | High value; Low if Epic 72 tax columns are populated (verify first), Medium if not. | Low–Med |
| 4 | **FR-4** | Blocked on FBO stock materialization decision. Defer until PM commits to the FBO source. | Med–High |

Suggested first step: **verify `WeeklyMarginFact.taxAmountRub`/`netProfitAfterTaxRub` population** (FR-3 precondition) and **decide the FR-2 auto-campaign attribution method** — these unblock the two highest-value items.

---

## 5. Consolidated open product questions (for PM)

1. **FR-2 attribution** — how to attribute auto-campaign (non-nmId-targeted) ad spend? (manual-only / proportional by attributed revenue / WB-native)
2. **FR-2 source** — PromotionAPI `ad_spend` (real ROAS) vs `wb_promotion` (deduction)? FE recommends PromotionAPI for ДРР.
3. **FR-3 tax allocation** — proportional to operating-profit / revenue / COGS? FE recommends operating-profit. Invariant: net ≤ operating per row.
4. **FR-4 FBO source** — materialize warehouse-remains CSV to a table (recommended) or on-demand?
5. **FR-4 COGS basis** — current COGS/unit (simple) vs period-average (accurate for old stock)?
6. **FR-5 СПП sign** — positive discount (₽) vs negative revenue adjustment?
7. **FR-5 cancellations scope** — cancelled-in-period vs placed-then-cancelled?
8. **FR-5 "extra costs"** — which line items, to avoid double-count with existing deductions?

---

## 6. FE-side acceptance (what the FE will do once each lands)

For each FR, once the backend returns the new fields: the FE adds the columns to `SkuFinancialsTable` (+ by-brand/category) via the FR-1 `sharePercentage` helper / `formatPercentage`, null-rendered as `—`. This is mechanical (~1 small PR each), gated on the backend contract landing. No FE work is blocked today except by the absence of the data.

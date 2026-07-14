# UI Deep Validation Report

## Validation Date: 2026-02-21
## Scope: All pages, business logic, data correctness, filter behavior

---

## Part 1: Page Load Validation (30 pages)

### 1. Public Pages
- [x] `/`, `/login`, `/register` — redirect to dashboard when authenticated ✅

### 2. Dashboard
- [x] `/dashboard` (week & month modes) — all APIs 200, no console errors ✅

### 3. Analytics (15 pages)
- [x] `/analytics`, `/analytics/sku`, `/analytics/brand`, `/analytics/category` ✅
- [x] `/analytics/unit-economics`, `/analytics/advertising`, `/analytics/orders` ✅
- [x] `/analytics/funnel`, `/analytics/buyout`, `/analytics/returns` ✅
- [x] `/analytics/storage`, `/analytics/supply-planning`, `/analytics/dashboard` ✅
- [x] `/analytics/liquidity` ❌ API 400: `include_liquidation_scenarios should not exist`
- [x] `/analytics/time-period` ❌ API 400: `includeCogs should not exist`

### 4. Management
- [x] `/orders`, `/cogs`, `/cogs/price-calculator` ✅
- [x] `/supplies` ❌ API 400: `sort_by, sort_order should not exist`

### 5. Settings & Monitoring
- [x] `/settings/notifications`, `/monitoring` ✅
- [x] `/settings` → 404 (no landing page)
- [x] `/settings/tariffs`, `/settings/backfill` → redirect to dashboard (admin-only)

**Page load score: 25/30 (83%)**

---

## Part 2: Business Logic Deep Validation

### Method
- Fetched raw API responses via `curl` for W07 and W06
- Compared every dashboard metric against raw API values
- Cross-validated totals between Dashboard, SKU analytics, Fulfillment, and Advertising

### 2.1 Dashboard Metrics vs API Data (Week W07)

| Metric | Dashboard | API Field | Source | Match |
|--------|-----------|-----------|--------|-------|
| Заказы, шт | 301 | fulfillment.total.ordersCount | fulfillment/summary | ✅ |
| Заказы (РРЦ), ₽ | 646 426,87 | fulfillment.total.ordersRevenue | fulfillment/summary | ✅ |
| Заказы (со скидкой), ₽ | 225 878,24 | fulfillment.total.ordersRevenueDiscounted | fulfillment/summary | ✅ |
| Выкупы, ₽ | 112 677,88 | summary_total.wb_sales_gross_total | finance-summary | ✅ |
| Выкупы, шт | 167 | fulfillment.fbo.salesCount | fulfillment/summary | ⚠️ see #1 |
| Возвраты, ₽ | 0 | summary_total.returns_gross_total | finance-summary | ✅ |
| Продажи (розница) | 180 771,02 | summary_total.sale_gross_total | finance-summary | ✅ |
| Удержания WB | 34 867,93 | commission_sales + acquiring + wb_promotion | finance-summary | ✅ |
| Логистика | 23 608,53 | summary_total.logistics_cost_total | finance-summary | ✅ |
| Хранение и приёмка | 1 787,07 | storage_cost (1487.07) + paid_acceptance (300) | finance-summary | ✅ |
| К перечислению | 78 890,39 | summary_total.payout_total | finance-summary | ✅ |
| Себестоимость | 54 020 | summary_total.cogs_total | finance-summary | ✅ |
| Реклама | 6 314,22 | advertising.totalSpend | advertising API | ✅ |
| Валовая прибыль | 126 751,02 | sale_gross - cogs | calculated | ⚠️ see #2 |
| Маржинальность | 70.1% | (sale_gross - cogs) / sale_gross | calculated | ⚠️ see #3 |

### 2.2 Period Comparison (W07 vs W06)

| Metric | W07→W06 % | Dashboard shows | Match |
|--------|-----------|-----------------|-------|
| Выкупы, ₽ | -9.4% | -9,4% | ✅ |
| К перечислению | +60.0% | +60,0% | ✅ |
| Логистика | -13.3% | -13,3% | ✅ |
| Удержания WB | -51.7% | -51,7% | ✅ |
| Логистика % выручки | 13.06% | 13,06% | ✅ |

### 2.3 W06 Validation (with returns)

| Metric | Dashboard | API | Match |
|--------|-----------|-----|-------|
| Продажи (розница) | 194 039,30 | sale_gross_total = 194 039,30 | ✅ |
| Note | | sales_gross (198 935) - returns (4 896) = sale_gross (194 039) | Correctly uses net sales |
| Возвраты, ₽ | 3 365 | | ✅ (displayed separately) |

### 2.4 Filter Behavior

| Test | Result |
|------|--------|
| Dashboard: switch Week → Month | ✅ URL updates, data reloads |
| Dashboard: switch W07 → W06 via URL | ✅ All metrics change correctly |
| Dashboard: month view sums multiple weeks | ✅ APIs called for each week in month |
| SKU page: defaults to latest week | ✅ Shows W07 with week selector |
| Advertising: date range applied | ✅ from/to params sent correctly |

---

## Part 3: Business Logic Issues

### ISSUE #1 (Medium): Выкупы шт — FBO-only count on Dashboard

| | Dashboard | SKU page | API finance-summary |
|--|-----------|----------|---------------------|
| Count | **167** | **187** | product_transactions = **187** |
| Source | fulfillment.fbo.salesCount | sku-financials SUM(quantity) | summary_total |

**Problem**: Dashboard shows 167 buyouts (FBO only from fulfillment API), but the actual number of products sold from the finance report is 187. The 20 missing items are EAEU + FBS sales.

**Impact**: Medium — seller sees fewer sales than actually occurred.

**Root cause**: Dashboard uses `fulfillment/summary` for buyout count, which only has FBO data. FBS `salesCount` = 0 in the API response.

**Fix**: Use `product_transactions` from `finance-summary` instead of `fulfillment.fbo.salesCount` for the "Выкупы, шт" metric.

---

### ISSUE #2 (Critical): Валовая прибыль — misleading calculation

**Dashboard formula**: `Валовая прибыль = Продажи(розница) - Себестоимость`

| Week | Dashboard shows | Actual profit (payout - COGS) | Overstatement |
|------|-----------------|-------------------------------|---------------|
| W07 | **+126 751 ₽** | **+24 870 ₽** | 5.1x |
| W06 | **+137 515 ₽** | **-7 231 ₽** (LOSS!) | ∞ (wrong sign!) |

**Problem**: "Валовая прибыль" = `sale_gross - cogs` counts the **retail price** minus COGS, but does NOT subtract:
- WB commission (~68K)
- Logistics (~24K)
- Storage (~1.5K)
- WB Promotion (~19K)
- Acquiring (~2.7K)

The seller sees "Валовая прибыль +137К" but their actual payout after all deductions is **negative** (-7.2K).

**Impact**: Critical — seller may make business decisions based on fictitious profit.

**Note**: The `PnLWaterfall` component (`PnLWaterfall.tsx:267`) correctly uses `payout - COGS`. The problem is in the dashboard metric card which uses `sale_gross - COGS`.

**Recommendation**:
1. Rename to "Валовая прибыль (до удержаний)" to clarify it's before WB deductions
2. OR change formula to `payout_total - cogs_total` (actual profit after all deductions)
3. Add a prominent "Чистая прибыль" card showing `payout - cogs`

---

### ISSUE #3 (Critical): Маржинальность — inflated by same formula

**Dashboard formula**: `Маржинальность = (sale_gross - cogs) / sale_gross × 100`

| Week | Dashboard margin | SKU operating margin | Reality |
|------|------------------|----------------------|---------|
| W07 | **70.1%** | **20.0%** | 3.5x overstatement |
| W06 | **70.9%** | N/A | Actual: **-3.7%** (loss) |

**Problem**: Same root cause as Issue #2 — uses retail price, not seller payout.

**Impact**: Critical — seller thinks margins are excellent (70%+) when actual operating margin is ~20% or even negative.

**Note**: SKU analytics page correctly shows operating margin (20.0%) based on `revenue_net - cogs - expenses`. The dashboard metric tells a completely different story.

---

### ISSUE #4 (Low): Удержания WB — partial deductions shown

| | Shown on Dashboard | Actual total deductions |
|--|--------------------|-----------------------|
| Amount | 34 868 ₽ (19.3%) | 101 881 ₽ (56.4%) |
| Components | commission_sales + acquiring + wb_promotion | All deductions (sale_gross - payout) |

**Problem**: "Удержания WB" only includes `commission_sales` (13 368) + `acquiring_fee` (2 762) + `wb_promotion` (18 738) = 34 868₽. This is ~34% of actual total deductions. The rest appears in "Логистика" and "Хранение" cards separately, but the total WB commission (68 093₽) is much larger.

**Impact**: Low-medium — the breakdown is there in separate cards, but the "Удержания WB" label implies this is ALL WB deductions.

**Recommendation**: Add tooltip or subtitle clarifying "без логистики, хранения и комиссии маркетплейса" or rename to "Прочие удержания WB".

---

## Part 4: API Integration Bugs (3 broken pages)

### BUG #1: `/analytics/liquidity` — API 400

```
include_liquidation_scenarios should not exist
```
- Frontend: `src/lib/api/liquidity.ts:45-46`
- Fix: remove `include_liquidation_scenarios` param or add to backend DTO

### BUG #2: `/analytics/time-period` — API 400

```
includeCogs should not exist
```
- Frontend: `src/hooks-v1/useMarginTrends.ts:70`
- Fix: remove `includeCogs` param or add to backend DTO

### BUG #3: `/supplies` — API 400

```
sort_by should not exist, sort_order should not exist
```
- Frontend: `src/lib/api/supplies.ts:47-54`
- Fix: remove sort params or add to backend DTO

---

## Part 5: Advertising Data Validation

| Metric | API | Dashboard | Match |
|--------|-----|-----------|-------|
| Spend | 6 314,22 ₽ | 6 314,22 ₽ | ✅ |
| ROAS | 6.64x | 6.6x | ✅ (rounded) |
| ДРР | 3.49% | 3,49% | ✅ (spend/sale_gross) |
| Organic % | 70.02% | 70% | ✅ |
| Ad-attributed | 41 941 ₽ | — | (not shown directly) |
| Total sales (ad) | 139 874 ₽ | ~140К | ✅ |

**Note**: ДРР uses `sale_gross` as denominator (industry standard for WB), not ad-attributed revenue.

---

## Part 6: Data Source Discrepancies (Validated 2026-02-23)

See **[DATA-SOURCES-REFERENCE.md](DATA-SOURCES-REFERENCE.md)** for full documentation.

### ROAS Discrepancy (6.6x vs 6.01x) — NOT A BUG
- Dashboard ROAS uses Advertising API (`ad_attributed_revenue / ad_spend`)
- Finance-derived ROAS uses `sale_gross / wb_promotion`
- Different data sources, different business questions
- Backend confirmed: Request #75 guarantees revenue source isolation

### Storage Discrepancy (~1.8%) — NOT A BUG
- Paid Storage API: daily per-SKU (`paid_storage_daily.warehouse_price`)
- Weekly Report: aggregate (`wb_finance_raw.storage`)
- <3% difference is expected due to rounding, corrections, tariff recalculations
- Backend confirmed: `cabinet-expenses` endpoint provides both values for comparison

### Brand Table "Товаров (SKU)" — BUG FIXED
- Column showed `total_units` (sold quantity) instead of `total_skus` (unique SKU count)
- Fix: Added `total_skus` field to type + updated hooks and tables (2026-02-23)

---

## Summary

### Severity Distribution

| Severity | Count | Issues |
|----------|-------|--------|
| 🔴 Critical | 2 | Валовая прибыль formula, Маржинальность formula |
| 🟡 Medium | 1 | Выкупы шт (FBO-only count) |
| 🟠 API Bugs | 3 | liquidity, time-period, supplies — broken pages |
| ℹ️ Low | 2 | Удержания WB partial, /settings 404 |

### Priority Recommendations

1. **Fix API bugs** (3 pages completely broken) — remove unsupported query params
2. **Fix Валовая прибыль/Маржинальность** on dashboard — either rename or change formula to use `payout_total`
3. **Fix Выкупы шт** — use finance-summary `product_transactions` instead of `fulfillment.fbo.salesCount`
4. **Clarify Удержания WB** label — add subtitle or tooltip

---

## Test Credentials
- Email: test@test.com
- Password: LocalTest123!

---

## Part 7 — Runtime Data-Validation Methodology (2026-07-05)

**Goal.** Prior passes covered (a) dashboard formula audit (Parts 1–6 above),
(b) load-health of 56 routes ([`.omc/ux-validation/matrix.md`](../.omc/ux-validation/matrix.md)),
(c) **code-level** business-data audit ([`business-data-audit-2026-07-02.md`](../.omc/ux-validation/business-data-audit-2026-07-02.md), `BD-*`).
This pass is **runtime data-level**: with the backend fully ready, drive the live
app, **log the actual rendered numbers** per page (with filters), then
**reconcile meanings between pages** to prove the data is computed correctly and
is consistent everywhere it appears. It validates the *output*, on real data.

**Stack.** FE dev server `:3100`, backend `:3000` (both PM2-managed, live).
Drive via Playwright (canonical browser tool). Raw API data captured via direct
calls with the test JWT + `X-Cabinet-Id` (the same payloads the hooks consume).
Test creds: `test@test.com` / `LocalTest123!`.

### 7.1 Per-page data log (artifact)

For every page under test, write `.omc/validation/<YYYY-MM-DD>/<page>.md` (+
`<page>.raw.json` for the verbatim API payloads) capturing:

1. **URL + active filters** (week, period, brand, category, tab, sort, search —
   every input that changes the numbers).
2. **Raw API calls** — method, path, query, HTTP status, and the salient numeric
   fields of the response (the exact values the hook reads).
3. **Rendered values** — the number as shown in the UI (text + the formatter
   used), with the component/`data-testid`.
4. **Page-local checks** — does each rendered value equal its API source
   (post-format, post-currency/percent rounding)? Pass/fail + delta.

### 7.2 Cross-page consistency invariants (the «смыслы»)

The core of this pass. Each invariant ties the **same business quantity** across
the pages that show it, so a divergence is a real bug (formula, data-source, or
label). Verified on the same week/period unless noted.

**A. Identity (must match exactly, modulo ₽-rounding):**
- A1 `Выкупы/Продажи (розница), ₽` — dashboard == finance-summary `sale_gross_total`
  == Σ over SKU/brand/category aggregation of the same week.
- A2 `К перечислению, ₽` — dashboard == finance-summary `payout_total` == PnL-waterfall endpoint.
- A3 `Себестоимость, ₽` — dashboard == finance-summary `cogs_total`.
- A4 `Логистика / Хранение / Удержания WB` — dashboard cards == the matching
  `finance-summary` totals (commission+acquiring+promotion for Удержания).
- A5 `Реклама (Spend), ₽` — dashboard == advertising page `totalSpend` == advertising API.
- A6 `Заказы, шт` — dashboard == fulfillment `/summary` ordersCount == orders page total.
- A7 Period deltas — dashboard W07→W06 % tiles == deltas recomputed from the
  underlying totals for both weeks.

**B. Aggregation (different groupings of the same underlying must reconcile):**
- B1 Σ SKU `sale_gross` ≈ Σ brand `sale_gross` ≈ Σ category `sale_gross` ≈
  finance-summary total (same week; ≤ rounding).
- B2 Unique-SKU count: dashboard == distinct nmIds in SKU page == brand/category totals.
- B3 Σ advertising-by-day `spend` == advertising summary `totalSpend` (date range match).

**C. Meaning / label (no silent contradictions):**
- C1 `Маржинальность` — dashboard vs SKU operating-margin vs unit-economics: each
  must either share a formula or be labelled with its distinct meaning
  (e.g. «до удержаний» vs «операционная»). No two pages show different numbers
  under the same label.
- C2 `Валовая прибыль` vs `Чистая прибыль` — gross (sale_gross − cogs) vs net
  (payout − cogs) must be distinguishable; never both presented as "profit".
- C3 FBS-vs-FBO scope — any page showing FBS-only revenue/count under a plain
  label flagged (BD-6/BD-7 family).
- C4 AP#8 at runtime — any money/ratio that is `null` upstream renders «—», not
  `0`/`0 %` (the BD-2/BD-3/BD-5 findings, verified on live data, not just code).

### 7.3 Execution + verdict

- Capture order per page: filters → API payloads → rendered values → page-local
  checks → then fold into the cross-page matrix (§7.2).
- Each invariant gets a verdict: **✅ consistent** / **⚠️ delta** (with amount) /
  **❌ contradictory** (with the two values + pages) / **⬜ blocked** (data absent).
- Findings feed `docs/request-backend/*.md` (BE-owned) or FE tickets, reusing the
  `BD-*` namespace continuation.
- Summary lands in `.omc/validation/<date>/REPORT.md`; per-page logs are the
  evidence trail.

### 7.4 Scope of this pass

Starts with the **P0 financial clusters** (where a wrong number misleads a
business decision): `/dashboard`, `/analytics/sku|brand|category`,
`/analytics/advertising`, `/analytics/orders`, `/analytics/unit-economics`,
`/analytics/liquidity`, `/orders` (+ the new `/orders` actions + `/automation`
+ `/analytics/brand-share` shipped this week). Expands to the remaining pages
once the financial core is reconciled.

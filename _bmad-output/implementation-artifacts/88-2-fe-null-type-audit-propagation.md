# Story 88.2-FE: Null-Type Audit & Propagation

Status: done

## Story

**As a** business owner reviewing analytics across SKU, daily, and advertising views,
**I want** "unknown" values to render as `—` (em dash) instead of a misleading `0 ₽`, `0x`, or `0%`,
**so that** I don't mistake a missing data point for a real zero and make the wrong pricing, advertising, or inventory decision.

**Epic**: 88-FE Tech Debt Cleanup & Process Hardening
**Priority**: P2 (follow-up to Epic 87-FE retrospective Action Item #4)
**Estimate**: 5 story points

---

## Problem Statement

Story 87.3-FE fixed a misleading "0 ₽" display in SKU analytics that was caused by the transform layer collapsing backend `null` values into `0`:

```ts
// Before (src/hooks/sku-financials-transform.ts:47-51)
profit: {
  gross: item.gross_profit ?? 0,         // null → 0 (lies about data)
  operating: item.operating_profit ?? 0, // null → 0 (lies about data)
  operatingMarginPct: item.operating_margin_pct ?? 0,
}

// After Story 87.3 (current state)
profit: {
  gross: item.gross_profit ?? null,         // null preserved
  operating: item.operating_profit ?? null, // null preserved
  operatingMarginPct: item.operating_margin_pct ?? null,
}
```

The Epic 87-FE retrospective elevated this from a point fix to a systemic concern (see Action Item #4, lines 129-133):

> **Audit `number` types that should be `number | null` (MEDIUM).** Systematic sweep of types where backend can return `null` but frontend type claims `number`. A misleading "0" there would be the same bug as Story 87.3's "0 ₽".

A project-wide grep for `?? 0` returns **370 occurrences across 118 files** — clearly we cannot (and should not) fix all of them in a single sprint. Most are legitimate (aggregation callsites, log statements, pagination counts). **This story enumerates the suspicious ones, fixes the highest-impact offenders, and documents the null-vs-zero invariant in CLAUDE.md so the next time a dev adds `?? 0` on a nullable field, the anti-pattern is caught at review time.**

### Audit Summary (conducted during story creation)

Three categories emerge from the 370 hits:

| Category | Count (est.) | Action |
|---|---|---|
| **A. Legitimate zero** (counts, pagination, console logs, aggregation sums) | ~300 | Keep. Add a one-line comment at the callsite when ambiguous: `// aggregation — null treated as zero, intentional` |
| **B. Suspicious null→0** (backend can legitimately return `null` meaning "unknown"; "0" reads as "zero value") | **~20 high-impact + ~30 borderline** | **Widen type to `number \| null`, preserve null in transform, render `—` at display site.** This story fixes the high-impact subset. |
| **C. Latent crashes** (type says `number`, transform preserves null, consumer calls `.toFixed()` without guard) | 2 known | **Fix immediately** — these are real TypeErrors waiting to happen. |

### The Latent Crash Found During Research (urgent)

`src/lib/api/advertising-analytics-api.ts:104` already preserves null for `overall_roas`:

```ts
overall_roas: backendResponse.summary?.avgRoas ?? null,  // transform returns null
```

But `src/types/advertising-analytics/analytics.ts:44` declares `overall_roas: number` (not nullable), and `src/app/(dashboard)/analytics/advertising/components/AdvertisingSummaryCards.tsx:113` calls `.toFixed(1)` on it unconditionally:

```ts
value: `${summary.overall_roas.toFixed(1)}x`,  // TypeError: Cannot read properties of null
```

This **will** crash when backend returns null for a cabinet with no advertising activity. Fixing the type definition and display is AC-1.

### High-Impact Transform Sites to Widen

These are the **Category B** sites where null carries meaningful "unknown" semantics that currently get collapsed:

| # | File | Line(s) | Field | Why it matters |
|---|---|---|---|---|
| 1 | `src/types/advertising-analytics.ts` | 115 | `AdvertisingSummary.overall_roas: number` | Backend returns null when `totalSpend == 0`; api already maps to null; type and consumer lie |
| 2 | `src/lib/api/advertising-analytics-api.ts` | 142 | `AdvertisingItem.roas: item.roas ?? 0` | Per-SKU ROAS for rows with no spend should be `—`, not `0x` |
| 3 | `src/lib/api/advertising-analytics-api.ts` | 143 | `AdvertisingItem.roi: item.roi ?? 0` | Same reasoning; `roi: 0` means "broke even", but null means "no data" |
| 4 | `src/types/advertising-analytics.ts` | 187, 188 | `AdvertisingItem.roas: number`, `roi: number` | Matching type widening for #2, #3 |
| 5 | `src/lib/api/advertising-analytics-api.ts` | 138 | `profit: item.profit ?? 0` | A SKU with null profit (COGS missing at ad-layer) should show `—`, not `0 ₽` — same bug as Story 87.3 |
| 6 | `src/lib/api/advertising-analytics-api.ts` | 137 | `revenue: item.revenue ?? 0` | Ad-attributed revenue null = "no data yet" ≠ "zero sales" |
| 7 | `src/lib/api/daily-analytics/api.ts` | 80 | `cogs_total: item.cogsTotal ?? 0` | Daily COGS null on a day with sales = "COGS not yet assigned for this day's SKUs" — showing `0 ₽` collapses the same null-vs-zero distinction as Story 87.3 at daily granularity |
| 8 | `src/lib/api/daily-analytics/api.ts` | 159 | `cogs: d.cogs ?? 0` (orders-COGS daily) | Same reasoning for orders side |
| 9 | `src/hooks/orders-cogs-helpers.ts` | 43, 44 | `cogs_total: (d.cogs) ?? 0`, `profit: (d.profit) ?? 0` | Daily orders COGS/profit; null = "order on day where no COGS known" |

**Deferred (Category B borderline, not in this sprint):**
- `src/lib/api/liquidity-item-mapper.ts` — `unit_cost`, `new_price`, `expected_profit` fields: defer until we have a page audit showing users hit rows with null
- `src/lib/api/advertising-analytics-api.ts:140-147` — `organic_sales`, `organic_contribution`, `ctr`, `cpc`, `conversion_rate`, `profit_after_ads`: defer (same file as #2-#6 but lower bug impact because already rendered via null-aware formatters in the performance table)
- `src/hooks/useExpenses-utils.ts` — 14 `?? 0` in expense aggregation. These are legitimately summing fields; keep but comment the intent.
- `src/lib/api/fbs-analytics.ts` — all 4 hits are in `console.info()` log statements, no semantic impact.

**Decision boundary:** Include a site in this story iff (a) the field represents a monetary value or ratio, (b) the backend contract allows `null`, AND (c) the consumer displays it directly without a null check. Sites that pipe through a formatter with built-in null handling (e.g., `formatCurrency(null) → "—"`) are not urgent.

---

## Acceptance Criteria

### AC-1: Fix the latent `overall_roas` crash
- [ ] `src/types/advertising-analytics/analytics.ts:44` — change `overall_roas: number` to `overall_roas: number | null`. Add JSDoc: `/** Null when totalSpend = 0 (division undefined) */`.
- [ ] `src/app/(dashboard)/analytics/advertising/components/AdvertisingSummaryCards.tsx:113,115` — gate both `.toFixed(1)` and `getRoasColor(...)` on non-null; render `—` and neutral color when null. Match the pattern already used in `src/components/custom/advertising-widget/AdvertisingMetricsGrid.tsx:91-93` (the widget version already does this correctly).
- [ ] No other consumer of `overall_roas` exists — verified via grep during story creation. If a new consumer surfaces during implementation, apply the same null guard.

### AC-2: Widen advertising item-level ROAS, ROI, revenue, profit
- [ ] `src/types/advertising-analytics.ts:187,188` — widen `AdvertisingItem.roas: number` → `number | null` and `roi: number` → `number | null`. JSDoc: `/** Null when spend = 0 or backend has no data for this SKU */`.
- [ ] `src/types/advertising-analytics.ts:175,177` — widen `AdvertisingItem.revenue: number` → `number | null` and `profit: number` → `number | null`. JSDoc: `/** Null when ad-attributed revenue/profit cannot be computed (no data) */`.
- [ ] `src/lib/api/advertising-analytics-api.ts:137,138,142,143` — change `?? 0` to `?? null` for `revenue`, `profit`, `roas`, `roi`.
- [ ] `src/app/(dashboard)/analytics/advertising/components/performance-table/performance-table-columns.tsx` — `renderROAS` already handles null (lines 152-158, verified). Re-verify `renderROI`, profit cells, and revenue cells pass the same null guard. Any raw `.toFixed()` call on these fields must be guarded with `item.roas != null ? ... : '—'`.
- [ ] `src/app/(dashboard)/analytics/advertising/utils/over-attribution-utils.ts` — this util computes `overall_roas` locally (line 25, divisor-guarded). No change needed here; the bug is only in the API-transform path.

### AC-3: Preserve null in daily COGS aggregation layer
- [ ] `src/types/daily-metrics.ts:86` — widen `FinanceDailyData.cogs_total: number` → `number | null`. JSDoc: `/** Null when no COGS data for this day (e.g., backend hasn't computed yet). 0 means zero cost. */`.
- [ ] `src/types/daily-metrics.ts:125` — widen `OrdersCogsDailyData.cogs: number` → `number | null` with matching JSDoc.
- [ ] `src/types/daily-metrics.ts` line 35 (`ordersCogs`) and line 39 (`salesCogs`) in `DailyMetrics` — widen both to `number | null`. These are the aggregate fields consumed by the daily table.
- [ ] `src/lib/api/daily-analytics/api.ts:80` — change `cogs_total: item.cogsTotal ?? 0` → `cogs_total: item.cogsTotal ?? null`. Keep the other `?? 0` coercions in this block intact (sales counts, logistics, storage — these are either legitimate zeros or have their own nullability story).
- [ ] `src/lib/api/daily-analytics/api.ts:159` — change `cogs: d.cogs ?? 0` → `cogs: d.cogs ?? null`.
- [ ] `src/lib/daily/aggregation.ts:95,96` — when `finance?.cogs_total` is null AND sales > 0, treat the row's `salesCogs` as null (not 0). Same for `ordersCogs` (line 87: `cogsMap.get(date) ?? ordersCogs` — this fallback is OK for legacy single-value COGS but fire a console.warn if both are null when orders > 0, to aid debugging).
- [ ] **Aggregation callsite pattern (critical):** `calculateDailyTheoreticalProfit` in `aggregation.ts:30-43` takes `salesCogs: number` in `TheoreticalProfitInput` — widen the param to `number | null` AND coerce internally with `input.salesCogs ?? 0` PLUS add a comment `// null means COGS unknown; treat as 0 for profit estimate (best-effort). Consumer must not misinterpret the result as P&L-accurate for days missing COGS.` This is the canonical aggregation-callsite pattern.

### AC-4: Daily table renders "—" for null COGS cells
- [ ] `src/components/custom/dashboard/DailyBreakdownTooltip.tsx` — cells reading `ordersCogs` or `salesCogs` already need to handle null (since `DashboardMetricsGridTypes.ts:43,45` already declares them `number | null`). Verify tooltip rendering goes through `formatCurrency()` which returns `—` for null. If any cell uses `.toLocaleString()` directly on the field, add the null guard.
- [ ] `src/components/custom/dashboard/table-columns.ts:155,157` — aggregation totals (`ordersCogs: 0`, `salesCogs: 0`) are correct as accumulator seeds. Change the reducer (lines 172, 174) to `acc.ordersCogs + (day.ordersCogs ?? 0)` to handle null days, and add comment: `// null days are skipped in the sum — the totals row shows the "known" total only`.
- [ ] Add a footnote-style disclosure below the daily table if any day has `ordersCogs === null` OR `salesCogs === null`: `* COGS неизвестна для {N} дн. — теор. прибыль за эти дни рассчитана без учёта себестоимости.` Use the same styling pattern as Story 87.3's `SummaryFooter` footnote for consistency.

### AC-5: Tests
- [ ] `src/lib/api/__tests__/advertising-analytics-epic-36.test.ts` (or sibling) — add test: when backend response has `summary.avgRoas: null`, transform returns `overall_roas: null`. When item has `roas: null`, transform returns `roas: null` (NOT 0).
- [ ] `src/app/(dashboard)/analytics/advertising/components/__tests__/AdvertisingSummaryCards.test.tsx` (create if missing) — 3 tests:
  - `summary.overall_roas === null` → renders `—`, NOT "0.0x", no TypeError.
  - `summary.overall_roas === 0` → renders "0.0x" (legitimate zero, distinct from null).
  - `summary.overall_roas === 2.5` → renders "2.5x" (baseline).
- [ ] `src/lib/api/daily-analytics/__tests__/api.test.ts` (create under `src/lib/api/daily-analytics/__tests__/` if missing) — tests for `getFinanceDailyData`:
  - Backend `cogsTotal: null` → transformed `cogs_total: null` (NOT 0).
  - Backend `cogsTotal: 0` → transformed `cogs_total: 0` (preserved).
  - Backend omits field → transformed `cogs_total: null`.
- [ ] `src/lib/__tests__/daily-aggregation.test.ts` (extend existing — it already has coverage for Story 61.9) — add 3 tests:
  - Day with `finance: null` → `metrics.salesCogs === null`.
  - Day with `finance: { cogs_total: null }` → `metrics.salesCogs === null`.
  - `calculateDailyTheoreticalProfit({ salesCogs: null, ... })` treats null as 0 internally, returns a number (not NaN).
- [ ] Component test for daily table footnote: when any day has null COGS, footnote renders; when all days have numeric COGS, footnote is absent.
- [ ] `npm run lint && npm run type-check && npm test -- --run` pass. Existing 6746+ unit tests remain green (zero regressions).

### AC-6: Document the invariant in CLAUDE.md
- [ ] Add a new subsection to `frontend/CLAUDE.md` under "Known Anti-Patterns" titled **"8. `?? 0` on nullable money/ratio fields lies about the data"**. Content:

  > When a backend field can legitimately be `null` (meaning "unknown" — e.g., ROAS when no ad spend, COGS when not yet assigned, profit when cost unknown), do NOT collapse it to `0` in the transform layer. "Zero" and "unknown" have different user-facing meanings.
  >
  > **Bad** (Story 87.3 pattern — silently misleads the user):
  > ```ts
  > profit: { operating: item.operating_profit ?? 0 }  // type lies: number
  > ```
  >
  > **Good** (null preserved through types; display layer renders `—`):
  > ```ts
  > profit: { operating: item.operating_profit ?? null }  // type: number | null
  > // Downstream aggregator:
  > const total = items.reduce((sum, i) => sum + (i.profit.operating ?? 0), 0)
  > //                                                                    ^^^^^
  > // aggregation callsite — null treated as 0, intentional. Display sites must show "—".
  > ```
  >
  > **Scope rule:** Money values (`revenue`, `cogs`, `profit`, `spend`), ratios (`roas`, `roi`, `margin_pct`), and per-unit metrics are always "null means unknown." Counts (`orderCount`, `salesCount`), pagination (`total`, `limit`, `offset`), and aggregated sums (accumulator seeds) are legitimately zero by default.
  >
  > See Story 87.3-FE (SKU profit) and Story 88.2-FE (ROAS, daily COGS) for the canonical fix pattern.

---

## Tasks / Subtasks

### Task 1: Audit report + scope confirmation
- [ ] 1.1: Re-run `grep -rn "?? 0" src/ --include="*.ts" --include="*.tsx" | wc -l` — confirm still 370 (±10 from new changes). Record in Dev Agent Record.
- [ ] 1.2: Re-verify the 9 high-impact sites listed in the Problem Statement table are still at the referenced line numbers (grep changes invalidate line refs if any other story landed first).
- [ ] 1.3: No new audit needed beyond what's already in this story. Proceed to Task 2.

### Task 2: AC-1 — Fix `overall_roas` crash
**Files (3):** `src/types/advertising-analytics.ts`, `src/app/(dashboard)/analytics/advertising/components/AdvertisingSummaryCards.tsx`, `src/components/custom/advertising-widget/AdvertisingMetricsGrid.tsx` (no-op verification — already correct).

- [ ] 2.1: Edit `src/types/advertising-analytics/analytics.ts:44` — widen `overall_roas: number` → `overall_roas: number | null`. Add JSDoc per AC-1.
- [ ] 2.2: Edit `AdvertisingSummaryCards.tsx:110-117` — replace the card's `value` and `colorClass` with null-guarded versions. Reference pattern: `AdvertisingMetricsGrid.tsx:91-93` (2 lines).
- [ ] 2.3: `npm run type-check` — should surface any other `overall_roas` consumers that lose type safety. Expected: 0 errors after edits to AdvertisingSummaryCards (mocks and tests tolerate wider type).

### Task 3: AC-2 — Widen advertising item-level ROAS/ROI/revenue/profit
**Files (3):** `src/types/advertising-analytics.ts`, `src/lib/api/advertising-analytics-api.ts`, possibly `src/app/(dashboard)/analytics/advertising/components/performance-table/performance-table-columns.tsx`.

- [ ] 3.1: Edit `src/types/advertising-analytics.ts:175,177,187,188` — widen the 4 `AdvertisingItem` fields to `number | null`.
- [ ] 3.2: Edit `src/lib/api/advertising-analytics-api.ts:137,138,142,143` — `?? 0` → `?? null` for `revenue`, `profit`, `roas`, `roi`. Keep `views: item.views ?? 0`, `clicks: item.clicks ?? 0`, `orders: item.orders ?? 0`, `spend: item.spend ?? 0` unchanged (these are counts/amounts where 0 is a legitimate zero).
- [ ] 3.3: Run `npm run type-check` — any display site that calls `.toFixed()`, `formatCurrency(item.revenue)`, etc., without null guards will surface. Fix each by:
  - Preferred: route through the existing `formatCurrency` / `formatMultiplier` / `formatROI` helpers (they accept nullable inputs and render `—`).
  - Fallback: add explicit `item.field != null ? fn(item.field) : '—'` guards.
- [ ] 3.4: Verify `performance-table-columns.tsx:152-158` (`renderROAS`) still compiles. If the typechecker is happy, this cell is fine.

### Task 4: AC-3 — Daily data transform preserves null COGS
**Files (3):** `src/types/daily-metrics.ts`, `src/lib/api/daily-analytics/api.ts`, `src/lib/daily/aggregation.ts`.

- [ ] 4.1: Edit `src/types/daily-metrics.ts:35,39,86,125` — widen the 4 COGS fields to `number | null` per AC-3.
- [ ] 4.2: Edit `src/lib/api/daily-analytics/api.ts:80` and `:159` — `?? 0` → `?? null` for COGS fields only.
- [ ] 4.3: Edit `src/lib/daily/aggregation.ts:95,96` — the null from finance/ordersCogs maps now propagates. Handle appropriately: when `finance?.cogs_total == null`, set `metrics.salesCogs = null`; when `cogsMap.get(date) == null`, set `metrics.ordersCogs = null` (unless legacy single-value `ordersCogs` param is provided, in which case use that as fallback).
- [ ] 4.4: Edit `calculateDailyTheoreticalProfit` (aggregation.ts:30-43) — the function MUST continue to return a `number` (theoretical profit is an estimate; the consumer uses it for chart lines and can't show `—`). Widen the input type `TheoreticalProfitInput.salesCogs` to `number | null` and coerce internally with `const salesCogs = input.salesCogs ?? 0` + a comment explaining the aggregation-callsite pattern. Emit a `console.warn` if BOTH `salesCogs` and `ordersCogs` are null AND sales > 0 (suggests a data gap worth investigating).
- [ ] 4.5: `TheoreticalProfitInput` interface in `src/types/daily-metrics.ts` — update `salesCogs: number` to `salesCogs: number | null`. Same for `ordersCogs`, `cogs`, and any other nullable field.

### Task 5: AC-4 — Daily table rendering + footnote
**Files (2):** `src/components/custom/dashboard/DailyBreakdownTooltip.tsx`, `src/components/custom/dashboard/table-columns.ts`, and the parent daily breakdown container (find via grep — likely `DailyBreakdownSection.tsx`).

- [ ] 5.1: `grep -rn "DailyBreakdown" src/components/custom/dashboard/` to find the parent daily table container. Add footnote rendering per AC-4 (same pattern as `SummaryFooter.tsx` from Story 87.3 — use lightweight `<p className="text-xs text-amber-700 mt-2">` styled exactly like Story 87.3's).
- [ ] 5.2: Edit `table-columns.ts:172,174` — reducer coerces null with `?? 0` + comment.
- [ ] 5.3: Verify `DailyBreakdownTooltip.tsx` cell rendering uses `formatCurrency(day.salesCogs)` etc. If it does, no change needed (formatter already returns `—` for null). If any cell uses `.toLocaleString()` directly, add the null guard.

### Task 6: Tests (AC-5)
**Files (3-4 new/extended):**
- `src/lib/api/__tests__/advertising-analytics-epic-36.test.ts` — extend with null-preservation cases (AC-5 bullet 1).
- `src/app/(dashboard)/analytics/advertising/components/__tests__/AdvertisingSummaryCards.test.tsx` — CREATE if missing.
- `src/lib/api/daily-analytics/__tests__/api.test.ts` — CREATE if missing. (Directory `daily-analytics/__tests__/` doesn't exist today — add it.)
- `src/lib/__tests__/daily-aggregation.test.ts` — verify path; create if missing, extend if exists.

- [ ] 6.1: Write the 3 AdvertisingSummaryCards tests.
- [ ] 6.2: Write the 3 daily-analytics/api.ts tests.
- [ ] 6.3: Write the 3 daily-aggregation.ts tests.
- [ ] 6.4: Write the daily table footnote component test.
- [ ] 6.5: Run full suite — `npm test -- --run`. Target: all new tests pass, zero regressions in existing 6746+ tests.

### Task 7: AC-6 — CLAUDE.md anti-pattern entry
**File:** `frontend/CLAUDE.md`.

- [ ] 7.1: Find the numbered "Known Anti-Patterns" section (lines with headings like `#### 1. ...` through `#### 7. Hard waits (...)`).
- [ ] 7.2: Add `#### 8. `?? 0` on nullable money/ratio fields lies about the data` after the "Hard waits" entry.
- [ ] 7.3: Content per AC-6. Link both Story 87.3-FE and this story (88.2-FE) as references.

### Task 8: Manual verification
- [ ] 8.1: `npm run dev` — open `/analytics/advertising`. If cabinet has no ad spend, overall ROAS card shows `—` (not "0.0x"), no console error.
- [ ] 8.2: `/dashboard` — select a date range where one or more days have missing COGS; verify those cells show `—` in the daily breakdown table AND the footnote appears. Screenshot.
- [ ] 8.3: `/analytics/sku` — regression check: Story 87.3's `—` rendering still works for missing-COGS rows, footnote still shows "COGS назначен для X из Y".

---

## Dev Notes

### The null-vs-zero invariant

"Unknown" and "zero" are distinct data states and the user interprets them differently:

- `revenue: 0` → "этот товар ничего не продал на этой неделе" (legitimate zero — the SKU had listings but no conversions).
- `revenue: null` → "бэкенд не получил данные или не смог посчитать" (no information).

The same data value with the same visual rendering ("0 ₽") hides an important distinction. A user looking at `revenue: 0` might close out a listing or drop the SKU; the same user looking at `revenue: null` rendered as `—` understands they need to wait for more data or investigate a sync issue.

### The aggregation-callsite pattern (canonical)

Most `?? 0` occurrences in the codebase are in aggregation sums — e.g., "total revenue across 20 SKUs, some of which may have null for the period." For these:

1. The input type must honor nullability (`revenue: number | null`).
2. The sum must coerce with `?? 0` **at the callsite**, with a short comment.
3. The aggregate result itself is a legitimate number (you're summing known rows; unknown rows contribute 0 to the partial sum but the result is still a valid number).
4. Optionally: expose a secondary field like `rowsWithNullRevenue` so the UI can disclose the gap (Story 87.3's footnote pattern).

Example from `sku-page-stats.ts:39` (already correct):
```ts
// withCogsItems is explicitly filtered to exclude null-profit rows, so the `?? 0`
// here is a defensive belt-and-suspenders; legitimate because we already KNOW
// these rows have COGS (missingCogs filter above).
const totalProfit = withCogsItems.reduce((sum, item) => sum + (item.profit.operating ?? 0), 0)
```

### What's in scope vs deferred

**In scope (this sprint):**
- 1 latent TypeError crash (`overall_roas`).
- 4 advertising-item-level fields (revenue, profit, roas, roi).
- 4 daily-analytics COGS fields (2 types, 2 transform sites).
- 1 aggregation function (`calculateDailyTheoreticalProfit` input).
- 1 CLAUDE.md section.
- ~12 new tests.

**Deferred (future stories or as needed):**

- `src/lib/api/liquidity-item-mapper.ts` — `unit_cost`, `new_price`, `expected_revenue`, `expected_profit` (Category B borderline; wait for user-reported confusion).
- `src/lib/api/advertising-analytics-api.ts` lines 131-147 — other per-item fields (`organic_sales`, `organic_contribution`, `ctr`, `cpc`, `conversion_rate`, `profit_after_ads`): lower impact because they're rendered via null-safe formatters, but will be consistent-worthy cleanup later.
- `src/hooks/useExpenses-utils.ts` — 14 aggregation sites. All currently legitimate but should gain the `// aggregation — null → 0 intentional` comment as drive-by cleanup. Skip for this sprint.
- `src/hooks/useTrends.ts` — `revenue`, `payout`, `cogs` coerced at line 128-130 as scalars per-week. These already treat null as 0 for chart plotting (acceptable because chart must have a number). Could add a data-gap visual, but out of scope here.
- `src/hooks/orders-cogs-helpers.ts:43-44` — orders daily COGS transforms. Fix is similar to AC-3 but applies to the legacy orders-cogs hook rather than the current daily-analytics flow. Separate story if we revive that path.
- Storage / Supply-planning / Tariff / Price-calculator `?? 0` sites — each has ≤4 hits; all are either divisor-protected or render via null-safe formatters already. Low priority.

### File-size budget pre-flight (Epic 87 retro Action #2)

| File | Current | After change | Status |
|---|---|---|---|
| `src/types/advertising-analytics.ts` | ~580 (from Epic 36/37 growth) | +8 JSDoc lines | ⚠ already large — acceptable (type file, not component) |
| `src/types/daily-metrics.ts` | ~180 | +5 JSDoc lines | ✅ |
| `src/lib/api/daily-analytics/api.ts` | 187 | ≈188 | ✅ |
| `src/lib/api/advertising-analytics-api.ts` | 179 | ≈180 | ✅ |
| `src/lib/daily/aggregation.ts` | 124 | ≈140 (adding null handling + warn) | ✅ |
| `src/app/(dashboard)/analytics/advertising/components/AdvertisingSummaryCards.tsx` | check during dev | +~5 lines for null guard | likely ✅ |
| `frontend/CLAUDE.md` | ~350 | +~25 lines for anti-pattern #8 | ✅ (not source file) |

### Backend contract verification (Epic 86 retro Action #3)

- Advertising `overall_roas` / per-item `roas` nullability: confirmed in `test-api/09-advertising.http` (check during dev) and live backend response — when `totalSpend === 0`, backend sends `null` (matches what the transform already expects).
- Daily finance `cogsTotal` nullability: not yet documented in test-api/ files; Task 1.1 should spot-check by calling `/v1/analytics/daily/finance?from=...&to=...` for a cabinet with a week of missing COGS assignments and confirm the response shape. If backend sends `0` instead of `null`, the `?? null` change is harmless but the semantic gain is lost; in that case file a backend-request doc (reference Story 87.3's request #165 as precedent) asking backend to distinguish the two cases.

### Anti-patterns to avoid (from CLAUDE.md)

- ❌ `as number` or `!` on nullable fields when TypeScript flags them. Always widen the type or add a runtime guard.
- ❌ `const x = field as number ?? 0` — this is actually a double lie (cast away null, then pretend null gets coerced).
- ❌ Using `Object.assign(new Error(), ...)` for mocks — use real `ApiError` instances per CLAUDE.md anti-pattern #3.
- ❌ Silent E2E skips (not relevant here — no E2E in this story).
- ✅ For the callsite-coerce pattern: always add the comment `// aggregation — null treated as 0, intentional` so the next dev doesn't "fix" the `?? 0` back into the transform.

---

## References

### Modified types
- `src/types/advertising-analytics/analytics.ts:44` — `AdvertisingSummary.overall_roas`
- `src/types/advertising-analytics.ts:175,177,187,188` — `AdvertisingItem.{revenue, profit, roas, roi}`
- `src/types/daily-metrics.ts:35,39` — `DailyMetrics.{ordersCogs, salesCogs}`
- `src/types/daily-metrics.ts:86` — `FinanceDailyData.cogs_total`
- `src/types/daily-metrics.ts:125` — `OrdersCogsDailyData.cogs`
- `src/types/daily-metrics.ts` — `TheoreticalProfitInput.salesCogs` (and peers)

### Modified transforms
- `src/lib/api/advertising-analytics-api.ts:104` — already correct (`?? null`), referenced for precedent
- `src/lib/api/advertising-analytics-api.ts:137,138,142,143` — widen 4 fields
- `src/lib/api/daily-analytics/api.ts:80` — COGS null preservation
- `src/lib/api/daily-analytics/api.ts:159` — orders-COGS null preservation
- `src/lib/daily/aggregation.ts:30-43,95-102` — null propagation through aggregator

### Modified display sites
- `src/app/(dashboard)/analytics/advertising/components/AdvertisingSummaryCards.tsx:113,115` — null guard for ROAS card
- `src/app/(dashboard)/analytics/advertising/components/performance-table/performance-table-columns.tsx:152-158` — verify `renderROAS` still compiles; similar render helpers for ROI/revenue/profit re-verify
- Daily breakdown table parent (location: `grep -rn "DailyBreakdown" src/components/custom/dashboard/`) — add footnote
- `src/components/custom/dashboard/table-columns.ts:172,174` — reducer null-coercion + comment

### Reference patterns (unchanged, used as templates)
- `src/components/custom/advertising-widget/AdvertisingMetricsGrid.tsx:91-93` — canonical null-guarded ROAS display
- `src/app/(dashboard)/analytics/advertising/components/performance-table/performance-table-columns.tsx:152-158` — canonical null guard in table cell
- `src/hooks/sku-financials-transform.ts:47-54` (Story 87.3) — canonical null-preserving transform
- `src/app/(dashboard)/analytics/sku/components/sku-page-stats.ts:39,53` — canonical aggregation-callsite pattern
- `src/components/custom/sku-financials/SummaryFooter.tsx` (Story 87.3 footer footnote) — canonical "N of Y rows had data" disclosure

### Docs
- `frontend/CLAUDE.md` — new anti-pattern #8 (this story)
- `frontend/_bmad-output/implementation-artifacts/87-3-fe-data-quality-polish.md` — precedent story
- `frontend/_bmad-output/implementation-artifacts/epic-87-fe-retro-2026-04-14.md` — retrospective Action Item #4 that scoped this story
- Backend contract refs (Task 1.2): `test-api/09-advertising.http`, `test-api/16-daily-analytics.http` (if exists; else spot-check via live API)

### Related technical debt (deferred, captured for future sprints)
- Liquidity item fields (`unit_cost`, `new_price`, `expected_revenue`, `expected_profit`)
- Other advertising item fields (`organic_sales`, `organic_contribution`, `ctr`, `cpc`, `conversion_rate`, `profit_after_ads`)
- Legacy orders-cogs-helpers.ts path
- Trends hook chart-plot coercion
- Storage/supply-planning/tariff/price-calculator occurrences

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- **AC-1 (latent crash fix)**: Widened `AdvertisingSummary.overall_roas` / `overall_roi` to `number | null`. Gated `.toFixed()` and `getRoasColor/getRoiColor` calls in `AdvertisingSummaryCards.tsx` on non-null, rendering `—` + neutral gray color when null. No other consumers of these fields exist (verified by type-check).
- **AC-2 (advertising item-level)**: Widened `AdvertisingItem.{revenue, profit, roas, roi}` to `number | null`. Changed `?? 0` → `?? null` in the API transform. `renderROAS` already null-guarded (no change). Surfaced 7 downstream type errors: 1 fixed in `performance-table-columns.tsx` (defensive `?? 0` in the over-attribution tooltip — revenue is non-null in that branch), 2 fixed in `over-attribution-utils.ts` (aggregation callsite pattern, plus changing `overall_roas`/`overall_roi` from `0` to `null` when `total_spend == 0`), 3 fixed in `useAdvertisingAnalytics.test.ts` (formula verifications updated with `?? 0` and comment).
- **AC-3 (daily COGS null propagation)**: Widened types (`DailyMetrics.{salesCogs, ordersCogs}`, `FinanceDailyData.cogs_total`, `OrdersCogsDailyData.cogs`, `TheoreticalProfitInput.salesCogs`) all to `number | null`. API transform (`daily-analytics/api.ts`) changed `?? 0` → `?? null` for the two COGS fields (other fields unchanged — they are legitimate zero-defaults). Aggregator (`aggregation.ts`) now propagates null from both sources and emits `console.warn` when both COGS values are null AND there is activity (orders>0 or sales>0) — aids debugging of backend data gaps. `calculateDailyTheoreticalProfit` coerces null→0 internally (aggregation-callsite pattern) with a comment explaining why display layer must still render `—`.
- **AC-4 (daily table rendering)**: `DailyBreakdownTooltip` now returns `number | null` from `getMetricValue` and renders `—` for null. `table-columns.ts` `formatCellValue` handles null explicitly before numeric format. Totals-row reducer coerces null-per-day with comment ("null days skipped in the sum"). Added `DailyCogsGapFootnote.tsx` component — counts days with null sales/orders COGS and renders the amber disclosure line below the section (pattern from Story 87.3's `SummaryFooter`).
- **AC-5 (tests)**: +17 new tests across 4 test files. All pass:
  - `src/lib/api/daily-analytics/__tests__/api.test.ts` (NEW, 4 tests): null preservation for `cogsTotal` and per-day `cogs`.
  - `src/lib/daily/__tests__/aggregation.test.ts` (NEW, 6 tests): null propagation, legitimate-zero preservation, console.warn data-gap, theoretical-profit null-coercion.
  - `src/app/(dashboard)/analytics/advertising/components/__tests__/AdvertisingSummaryCards.test.tsx` (NEW, 4 tests): null ROAS/ROI → `—`, vs. 0 → `0.0x`, vs. 2.5 → `2.5x`.
  - `src/components/custom/dashboard/__tests__/DailyCogsGapFootnote.test.tsx` (NEW, 3 tests): zero days → no footnote, one null → count=1, mixed → correct count.
  - Existing `over-attribution-utils.test.ts` (2 tests updated): expectations flipped from `.toBe(0)` to `.toBeNull()` for zero-spend / empty-items cases (divisor-undefined is now null, not 0).
- **AC-6 (CLAUDE.md)**: Added anti-pattern #8 "`?? 0` on nullable money/ratio fields lies about the data" to the numbered list. Includes bad/good examples, scope rule (money/ratios = null matters, counts/pagination = zero OK), and the footnote disclosure pattern. Links to Story 87.3-FE and 88.2-FE as references.
- **Regression verification**: Full unit suite — 6763 pass / 3 pre-existing DashboardPeriodSelector failures (unrelated, flagged in Story 88.1). +17 new passing tests. Type-check clean. Lint clean.
- **Backend contract note**: The `FinanceDailyResponseItem` interface now types `cogsTotal` / `grossProfit` / `marginPct` as `number | null` to match the null-capable contract. If backend currently sends `0` instead of `null` for "no COGS assigned" days, the `?? null` change is harmless but the semantic gain is lost — spot-check recommended during first production review (backend request doc template: see Story 87.3's request #165).

### Code Review Fixes (2026-04-14)

Adversarial self-review surfaced 7 findings across three severity levels; all fixed:

- **H-1 (fixed)**: `advertising-analytics-api.ts:105` — `overall_roi: ... ?? 0` was inconsistent with the widened `number | null` type and the matching `overall_roas: ... ?? null` above it. Changed to `?? null`. This was the exact class of bug the story was meant to eliminate; having it survive the first pass validated why adversarial review matters.
- **M-1 (fixed)**: `aggregation.ts:98` — truthy `||` collapsed legacy `ordersCogs: 0` silently to null. Rewrote as `ordersCogs > 0 ? ordersCogs : null` with a comment explaining that the destructuring default hides "unset vs explicit-0" at this call site; callers needing true zero must use `ordersCogsByDay` (per-day map).
- **M-2 (fixed)**: `DailyCogsGapFootnote.tsx` — counted ALL days with null COGS, including idle days with no activity. Added activity gate (`sales > 0 || orders > 0`) matching the aggregator's `console.warn` condition, plus a new test verifying idle days are excluded.
- **M-3 (fixed)**: `DailyCogsGapFootnote.tsx` — switched `=== null` to `== null` for defense-in-depth (catches both null and undefined, in case consumers pass partial objects).
- **L-1 (fixed)**: `AdvertisingSummaryCards.test.tsx` — replaced brittle `closest('div[class*="pt-6"]')` with a helper function that walks up to the nearest element containing an `aria-label` (stable, the card's value div carries the tooltip text as aria-label).
- **L-2 (fixed)**: Story file list said "Modified display (4):" but enumerated 6 items. Relabeled as "(6)".
- **L-3 (fixed)**: Test helper `makeFinance` used the `'cogs_total' in partial` narrowing idiom. Rewrote with `{ ...base, ...partial }` spread (standard pattern — partial's explicit null wins over the default 0).

**Post-fix verification**: npm run type-check / npm run lint clean. 6764 unit tests pass (+1 new footnote test from M-2). 3 pre-existing DashboardPeriodSelector failures unrelated to this story (flagged in Story 88.1 completion notes).

### Change Log

| Date | Change |
|---|---|
| 2026-04-14 | Story created via create-story workflow — enumerated ~370 `?? 0` occurrences, scoped to 9 high-impact sites + 1 latent crash + CLAUDE.md entry. |
| 2026-04-14 | Implementation complete. All 6 AC satisfied. +17 tests. Type-check clean. Lint clean. No regressions. |
| 2026-04-14 | Code review: 1 HIGH + 3 MEDIUM + 3 LOW findings; all 7 fixed. +1 new test for activity-gated footnote (6764 pass total, zero new regressions). Status → done. |

### File List

**Modified types (2):**
- `src/types/advertising-analytics.ts` — widened `AdvertisingSummary.{overall_roas, overall_roi}` and `AdvertisingItem.{revenue, profit, roas, roi}` to `number | null`
- `src/types/daily-metrics.ts` — widened `DailyMetrics.{ordersCogs, salesCogs}`, `FinanceDailyData.cogs_total`, `OrdersCogsDailyData.cogs`, `TheoreticalProfitInput.salesCogs` to `number | null`

**Modified transforms (2):**
- `src/lib/api/advertising-analytics-api.ts` — `?? 0` → `?? null` for 4 item fields
- `src/lib/api/daily-analytics/api.ts` — `?? 0` → `?? null` for 2 COGS fields; widened `FinanceDailyResponseItem` backend contract

**Modified aggregator (2):**
- `src/lib/daily/aggregation.ts` — null propagation for per-day COGS; data-gap console.warn; aggregation-callsite coercion in `calculateDailyTheoreticalProfit` with comment
- `src/app/(dashboard)/analytics/advertising/utils/over-attribution-utils.ts` — aggregation-callsite `?? 0` for `revenue`/`profit`; zero-spend returns `null` for ROAS/ROI

**Modified display (6):**
- `src/app/(dashboard)/analytics/advertising/components/AdvertisingSummaryCards.tsx` — null guards for ROAS/ROI cards
- `src/app/(dashboard)/analytics/advertising/components/performance-table/performance-table-columns.tsx` — over-attribution tooltip defensive `?? 0`
- `src/components/custom/dashboard/DailyBreakdownTooltip.tsx` — null returns `—`
- `src/components/custom/dashboard/table-columns.ts` — `formatCellValue` null → `—`; totals reducer coerces null
- `src/components/custom/dashboard/DashboardMetricsGridTypes.ts` — `advertisingRoas: number | null | undefined`
- `src/components/custom/dashboard/DailyBreakdownSection.tsx` — wire up `DailyCogsGapFootnote`

**Created (5):**
- `src/components/custom/dashboard/DailyCogsGapFootnote.tsx` — disclosure footnote component
- `src/components/custom/dashboard/__tests__/DailyCogsGapFootnote.test.tsx` — 3 tests
- `src/lib/api/daily-analytics/__tests__/api.test.ts` — 4 tests
- `src/lib/daily/__tests__/aggregation.test.ts` — 6 tests
- `src/app/(dashboard)/analytics/advertising/components/__tests__/AdvertisingSummaryCards.test.tsx` — 4 tests

**Modified tests (2):**
- `src/app/(dashboard)/analytics/advertising/utils/__tests__/over-attribution-utils.test.ts` — 2 expectations flipped from `.toBe(0)` to `.toBeNull()` (zero-spend / empty-items cases)
- `src/hooks/__tests__/useAdvertisingAnalytics.test.ts` — 3 formula verifications use `?? 0` coercion with type-narrowing comment

**Modified docs (1):**
- `frontend/CLAUDE.md` — added anti-pattern #8 under Known Anti-Patterns section

**Deleted:** None

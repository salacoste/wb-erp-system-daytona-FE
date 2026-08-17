# Story 87.1-FE: Dashboard Profit Hierarchy & Funnel Limit

Status: ready-for-dev

## Story

As a seller viewing the dashboard,
I want profit metrics displayed in correct accounting order (Gross > Operating > Net) and the funnel product filter to load without errors,
so that I can trust the financial data and use all analytics features without console errors.

## Bug Analysis

### Bug 1: Profit Hierarchy Inverted

**Observed**: Чистая прибыль (172,813) > Валовая прибыль (118,213) > Операционная прибыль (65,673)

**Expected (standard accounting)**: Валовая прибыль > Операционная прибыль > Чистая прибыль

**Root Cause**: The NetProfitCard falls back to `payout_total` when tax settings are not configured (see `getNetProfit()` in `src/lib/tax-display-helpers.ts:33-47`). The cascade is:

1. `net_profit_after_all_tax` (VAT+income) -- null if no tax config
2. `net_profit_after_tax` (income only) -- null if no tax config
3. **Fallback: `payoutTotal`** (= `payout_total` from backend)

The problem: `payout_total` = "К перечислению" = sale revenue minus ALL WB deductions (commissions, logistics, storage) but **COGS is NOT subtracted**. Meanwhile:
- `gross_profit_analytical` = `revenue_net - COGS` (COGS subtracted, but before WB deductions)
- `operating_profit_analytical` = `revenue_net - COGS - expenses` (both subtracted)

So when tax is not configured: `payout_total` (172K, no COGS deducted) > `gross_profit_analytical` (118K, COGS deducted from net revenue) > `operating_profit_analytical` (65K, COGS + expenses deducted). The "Чистая прибыль" card shows a number that is actually NOT net profit -- it's just the WB transfer amount.

**The label is misleading**: When falling back to `payout_total`, the label shows "К перечислению (до налога)" which is correct, BUT the card is visually styled as the #1 highlighted profit card (first in the grid, green border, gradient background), leading users to interpret it as their actual net profit. The visual hierarchy contradicts accounting hierarchy.

**Two sub-issues**:
1. **Formula issue**: When tax is not configured, the NetProfitCard should show `operating_profit_analytical - 0` (i.e., operating profit with zero tax), NOT `payout_total`. The `payout_total` fallback bypasses COGS entirely.
2. **Visual ordering**: Even when values are correct, the three profit cards are scattered across positions 1, 11, and 12 in the grid, making P&L flow impossible to follow.

### Bug 2: Funnel API limit=1000 vs Backend Max 500

**Observed**: Console shows 400 error on `/v1/analytics/funnel?limit=1000`

**Root Cause**: `FunnelProductFilter.tsx:36` passes `{ limit: 1000 }` to `useFunnelData()`. The backend caps limit at 500 and returns HTTP 400 for values exceeding the cap.

**Location**: `src/app/(dashboard)/analytics/funnel/components/FunnelProductFilter.tsx` line 36

## Acceptance Criteria

### Bug 1: Profit Hierarchy
1. When tax is NOT configured, the "Чистая прибыль" card shows `operating_profit_analytical` (or `gross_profit` fallback) minus zero tax, NOT raw `payout_total`
2. The card label for the no-tax fallback is "Операционная прибыль (до налога)" to accurately describe the metric
3. Profit hierarchy is always Валовая >= Операционная >= Чистая when all three are available
4. The tooltip explains the cascade and fallback logic clearly
5. Existing tests updated; no regressions in `tax-display-helpers.test.ts`

### Bug 2: Funnel Limit
6. FunnelProductFilter requests `limit=500` (matching backend max)
7. No 400 errors in console when opening the funnel product filter
8. `npm run lint && npm run type-check` passes

## Tasks / Subtasks

### Task 1: Fix NetProfitCard fallback formula (AC: #1, #2, #3)

- [ ] 1.1: Update `getNetProfit()` in `src/lib/tax-display-helpers.ts` to accept `operatingProfit` parameter
  - File: `src/lib/tax-display-helpers.ts` lines 33-47
  - Add optional `operatingProfit?: number | null` parameter
  - When tax is null AND `operatingProfit` is available, return `{ value: operatingProfit, label: 'Операционная прибыль', isPreTax: true }` instead of `payoutTotal`
  - Final fallback chain: `net_profit_after_all_tax` -> `net_profit_after_tax` -> `operatingProfit` (pre-tax) -> `payoutTotal` (last resort)

- [ ] 1.2: Update NetProfitCard props to accept `operatingProfit`
  - File: `src/components/custom/dashboard/NetProfitCard.tsx` lines 25-33
  - Add `operatingProfit: number | null` to `NetProfitCardProps`
  - Pass through to `getNetProfit()` at line 57

- [ ] 1.3: Pass `operatingProfitAnalytical` to NetProfitCard from grid
  - File: `src/components/custom/dashboard/DashboardMetricsGridCards.tsx` lines 63-70
  - Add prop: `operatingProfit={operatingProfitAnalytical ?? grossProfit ?? null}`

### Task 2: Update tooltip for pre-tax fallback (AC: #4)

- [ ] 2.1: Update NetProfitCard tooltip to explain the new cascade
  - File: `src/components/custom/dashboard/NetProfitCard.tsx` lines 119-123
  - Clarify that without tax config, the card shows operating profit before tax, not payout_total
  - Update cascade description: "3. Операционная прибыль (если налоги не настроены)"

### Task 3: Fix funnel limit (AC: #6, #7)

- [ ] 3.1: Change `limit: 1000` to `limit: 500` in FunnelProductFilter
  - File: `src/app/(dashboard)/analytics/funnel/components/FunnelProductFilter.tsx` line 36
  - Change: `useFunnelData(from, to, { limit: 1000 })` -> `useFunnelData(from, to, { limit: 500 })`

### Task 4: Update tests (AC: #5)

- [ ] 4.1: Update `tax-display-helpers.test.ts` for new `operatingProfit` parameter
  - File: `src/lib/__tests__/tax-display-helpers.test.ts`
  - Add test: when tax=null and operatingProfit provided, returns operatingProfit with pre-tax label
  - Add test: when tax=null and operatingProfit=null, falls back to payoutTotal (backward compat)
  - Update existing tests to pass `undefined` for operatingProfit (no breaking changes)

- [ ] 4.2: Add/update NetProfitCard test for operating profit fallback
  - Verify card renders operatingProfit value when tax is null
  - Verify label shows "Операционная прибыль (до налога)"

### Task 5: Lint + type-check (AC: #8)

- [ ] 5.1: Run `npm run lint && npm run type-check` -- all pass

## Dev Notes

### Architecture Context

The dashboard P&L cards use a data-driven pattern: `DashboardContent.tsx` fetches data via hooks, passes raw backend fields to `DashboardMetricsGrid`, which delegates rendering to `DashboardMetricsGridCards.tsx` and individual card components.

**Data flow for profit cards**:
```
Backend finance-summary API
  -> useFinancialSummaryWithPeriodComparison hook
  -> DashboardContent.tsx (lines 90, 177-181)
  -> DashboardMetricsGrid props (grossProfitAnalytical, operatingProfitAnalytical, payoutTotal)
  -> DashboardMetricsGridCards.tsx (lines 63-70, 151-169)
  -> Individual card components (NetProfitCard, GrossProfitCard, OperatingProfitCard)
```

**Backend fields (from `src/types/finance-summary.ts:121-126`)**:
- `gross_profit_analytical` = `revenue_net - COGS` (before WB deductions)
- `operating_profit_analytical` = `revenue_net - COGS - expenses` (after WB deductions)
- `payout_total` = WB transfer amount (sale_gross minus all WB deductions, COGS NOT subtracted)

### Key Insight: Why payout_total > gross_profit_analytical

`payout_total` does NOT subtract COGS. It is `sale_gross - commissions - logistics - storage - penalties`. Meanwhile `gross_profit_analytical` = `revenue_net - COGS` where COGS is deducted. So `payout_total` can easily exceed `gross_profit_analytical` when COGS is significant.

This is the fundamental accounting error: "К перечислению" is a cash flow metric (what WB pays you), NOT a profit metric. Using it as a "net profit" fallback is conceptually wrong.

### Fix Strategy

The minimal fix is to update the `getNetProfit()` cascade to prefer `operatingProfitAnalytical` (which is an actual profit metric with COGS subtracted) over `payoutTotal` when tax is not configured. This preserves the accounting hierarchy: Gross > Operating > "Net" (= Operating with 0 tax).

`payoutTotal` remains as the last-resort fallback when neither tax nor COGS-based metrics are available (e.g., user has not assigned any COGS).

### Funnel Fix

Simple one-liner: the backend enforces `limit <= 500` (likely via a DTO validation pipe). The `FunnelProductFilter` component was written with `limit: 1000` to try to fetch all products for the combobox dropdown, but this exceeds the backend cap. Changing to 500 fixes the 400 error. If more than 500 products exist, the component already handles pagination display (line 125-129: "Показано N из M").

### References

- `src/lib/tax-display-helpers.ts` -- getNetProfit() cascade logic (lines 33-47)
- `src/lib/__tests__/tax-display-helpers.test.ts` -- existing test coverage
- `src/components/custom/dashboard/NetProfitCard.tsx` -- net profit display card (lines 42-160)
- `src/components/custom/dashboard/GrossProfitCard.tsx` -- gross profit display card
- `src/components/custom/dashboard/OperatingProfitCard.tsx` -- operating profit display card
- `src/components/custom/dashboard/DashboardMetricsGridCards.tsx` -- card composition (lines 62-196)
- `src/app/(dashboard)/dashboard/components/DashboardContent.tsx` -- data flow (lines 149-189)
- `src/types/finance-summary.ts` -- field definitions (lines 107-126)
- `src/app/(dashboard)/analytics/funnel/components/FunnelProductFilter.tsx` -- limit=1000 (line 36)
- `src/hooks/use-funnel-analytics.ts` -- funnel hook with default limit=50 (line 21)
- `src/lib/api/funnel-analytics.ts` -- API client for funnel endpoint

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

### Change Log

### File List

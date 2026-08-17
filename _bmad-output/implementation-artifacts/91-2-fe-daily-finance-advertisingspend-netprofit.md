# Story 91.2-FE: Integrate Daily Finance — advertisingSpend + netProfit

Status: done

## Story

**As a** business owner viewing the daily breakdown on the dashboard,
**I want** backend-computed `netProfit` (with advertising) and `advertisingSpend` to replace the client-side theoretical profit calculation,
**so that** the profit number is authoritative (server-computed, not a frontend approximation) and advertising appears as a separate expense line.

**Epic**: 91-FE Backend Contract Updates (Epics 89-93 Integration)
**Priority**: P2
**Estimate**: 5 story points

---

## Problem Statement

Backend Epics 89-93 added 4 new fields to `GET /v1/analytics/daily/finance`:

**Per-day (data[]):**
- `advertisingSpend: number` — ad spend from `adv_daily_stats`
- `netProfit: number` — `operatingProfit - advertisingSpend`

**Summary:**
- `totalAdvertisingSpend: number`
- `totalNetProfit: number`

**Key insight (resolved via backlog task-13):** Backend's `netProfit` formula:
```
netProfit = revenueNet - cogsTotal - logistics - storage - penalties - paidAcceptance - commission - advertisingSpend
```
This is EXACTLY what the frontend computes client-side in `calculateDailyTheoreticalProfit()` (`src/lib/daily/aggregation.ts:35-48`). The client-side calc can be retired — use the server value instead.

Additionally, the `advertising` field in `DailyMetrics` currently comes from a SEPARATE advertising API call (`GET /v1/analytics/daily/advertising`). With `advertisingSpend` now in the finance response, the daily breakdown gets its advertising data from the SAME endpoint, eliminating a data-source discrepancy.

---

## Acceptance Criteria

### AC-1: Add new fields to types + API transform

- [ ] `src/lib/api/daily-analytics/api.ts` — add `advertisingSpend: number`, `netProfit: number` to `FinanceDailyResponseItem`. Also add `operatingProfit: number` (already sent by backend since Epics 89-91 but not yet consumed).
- [ ] `src/types/daily-metrics.ts` — add `advertisingSpend: number` and `netProfit: number | null` to `FinanceDailyData`. `netProfit` is nullable because when `cogsTotal` is null (COGS unknown), backend may send null for netProfit too (per CLAUDE.md anti-pattern #8).
- [ ] Transform in `getFinanceDailyData()` maps `advertisingSpend: item.advertisingSpend ?? 0` (legitimate zero if no ads) and `netProfit: item.netProfit ?? null` (null-preserving).

### AC-2: Replace client-side `calculateDailyTheoreticalProfit` with server `netProfit`

- [ ] `src/lib/daily/aggregation.ts` — in `aggregateDailyMetrics()`, replace:
  ```typescript
  // OLD: metrics.theoreticalProfit = calculateDailyTheoreticalProfit({ sales, salesCogs, advertising, ... })
  // NEW: metrics.theoreticalProfit = finance?.netProfit ?? calculateDailyTheoreticalProfit(...)
  ```
  Use server value when available; fall back to client-side calc only when `netProfit` is null (backward compat for cached responses during rollout).
- [ ] Keep `calculateDailyTheoreticalProfit()` function as a **fallback** (don't delete yet) with a deprecation comment: `@deprecated Use server netProfit. Kept as fallback during transition.`
- [ ] `DailyMetrics.advertising` field now prefers `finance.advertisingSpend` over the separate advertising API response. Update the aggregator to use `finance.advertisingSpend ?? advertisingApiValue` (finance data is authoritative when present).

### AC-3: Add "Реклама" to daily breakdown table

- [ ] `src/components/custom/dashboard/table-columns.ts` — the `advertising` column already exists in the table (as part of `DailyMetrics`). Verify it displays the finance-sourced `advertisingSpend` value correctly. If the column was previously hidden or labeled differently, make it visible with label "Реклама".
- [ ] `src/components/custom/dashboard/DailyBreakdownTooltip.tsx` — verify the tooltip shows `advertising` line item. Already present via `METRIC_ORDER` in the tooltip.

### AC-4: Null handling for netProfit

- [ ] When `finance.netProfit` is null (COGS unknown), the daily table should show `—` for the profit column (same pattern as Story 88.2-FE).
- [ ] The `DailyCogsGapFootnote` component (Story 88.2-FE) already handles null COGS disclosure — verify it still works correctly with server-computed netProfit.
- [ ] Summary `totalNetProfit` follows the same null pattern.

### AC-5: Tests

- [ ] Update `src/lib/daily/__tests__/aggregation.test.ts` — add tests for:
  - When `finance.netProfit` is provided, it's used instead of client-side calc
  - When `finance.netProfit` is null, fallback to `calculateDailyTheoreticalProfit`
  - When `finance.advertisingSpend` is provided, it's used for `metrics.advertising`
- [ ] Update `src/lib/api/daily-analytics/__tests__/api.test.ts` — verify new fields are mapped.
- [ ] `npm run type-check && npm run lint && npm test -- --run` — all 6789+ tests pass, zero regressions.

---

## Tasks / Subtasks

### Task 1: Types + API transform (AC-1)
- [ ] 1.1: Add fields to `FinanceDailyResponseItem` in `daily-analytics/api.ts`.
- [ ] 1.2: Add fields to `FinanceDailyData` in `daily-metrics.ts`.
- [ ] 1.3: Map new fields in `getFinanceDailyData()` transform.
- [ ] 1.4: Run `npm run type-check` — fix any downstream consumers.

### Task 2: Replace client-side calc (AC-2)
- [ ] 2.1: In `aggregateDailyMetrics()`, use `finance?.netProfit` for `theoreticalProfit` when non-null.
- [ ] 2.2: Use `finance?.advertisingSpend` for `advertising` when available (fallback to separate API value).
- [ ] 2.3: Add `@deprecated` JSDoc to `calculateDailyTheoreticalProfit`.

### Task 3: Verify table + tooltip display (AC-3)
- [ ] 3.1: Verify "Реклама" column renders in daily table.
- [ ] 3.2: Verify tooltip shows advertising line item.

### Task 4: Null handling (AC-4)
- [ ] 4.1: Verify `netProfit: null` renders as `—` in the table.
- [ ] 4.2: Verify `DailyCogsGapFootnote` still triggers correctly.

### Task 5: Tests (AC-5)
- [ ] 5.1: Update aggregation tests.
- [ ] 5.2: Update API transform tests.
- [ ] 5.3: Full regression — 6789+ tests pass.

---

## Dev Notes

### The transition strategy: server-first, client-fallback

```typescript
// In aggregateDailyMetrics():
const serverNetProfit = finance?.netProfit  // NEW field from backend
const serverAdvertising = finance?.advertisingSpend  // NEW field from backend

const metrics: DailyMetrics = {
  ...
  // Prefer finance-sourced advertising over separate API (eliminates data-source discrepancy)
  advertising: serverAdvertising ?? advertisingApiValue ?? 0,
  ...
  theoreticalProfit: 0, // computed below
}

// Server-first: use backend's authoritative netProfit when available
if (serverNetProfit != null) {
  metrics.theoreticalProfit = serverNetProfit
} else {
  // Fallback: client-side calc for null netProfit or cached pre-rollout responses
  metrics.theoreticalProfit = calculateDailyTheoreticalProfit({ ... })
}
```

### Why keep the client-side calc (for now)

1. **Backward compat**: cached responses from before the backend rollout won't have `netProfit`.
2. **Null COGS**: when backend can't compute netProfit (COGS unknown), frontend falls back gracefully.
3. **Verification**: during initial rollout, we can log `serverNetProfit !== clientCalcResult` discrepancies to validate backend accuracy.

The deprecation path: once we're confident the server value is correct for all production data, remove the fallback in a future story.

### File-size budget

| File | Current | After change |
|---|---|---|
| `daily-analytics/api.ts` | 191 | ~195 (+4 lines: 2 interface fields + 2 transform lines) |
| `daily-metrics.ts` | 198 | ~200 (**at limit** — may need to extract TheoreticalProfitInput to a separate file) |
| `aggregation.ts` | 150 | ~160 (+10 lines: server-first logic) |
| `table-columns.ts` | ~190 | ~190 (no change expected — advertising column already exists) |

### Backlog ref

Backlog task-11 tracks this work. Mark as Done when story completes.

---

## References

- Backlog doc-2 (Backend Epics 89-93 changelog) — section 1: daily finance +4 fields
- Backlog task-11 — original tracking task
- Backlog task-13 (RESOLVED) — confirmed netProfit formula matches client-side calc
- `src/lib/daily/aggregation.ts:35-48` — current `calculateDailyTheoreticalProfit()` to deprecate
- `src/types/daily-metrics.ts` — DailyMetrics + FinanceDailyData types
- `src/lib/api/daily-analytics/api.ts` — API transform
- Story 88.2-FE — null-vs-zero invariant (CLAUDE.md anti-pattern #8) applies to netProfit

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

### File List

### Change Log

| Date | Change |
|---|---|
| 2026-04-20 | Story created. Scope: add 4 new fields from backend, replace client-side profit calc with server netProfit (fallback kept), verify advertising in daily table. Backlog task-11 + task-13 (resolved). |

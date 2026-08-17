# Story 117.1: Search Orders time-series chart

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **a Wildberries seller viewing the Search Analytics → Orders tab**,
I want **a daily trend chart of search-attributed orders over the selected period**,
so that **I can see how organic-search order volume rises and falls over time, not just a flat table snapshot**.

## Acceptance Criteria

1. **Chart renders on the Search Orders tab.** A daily time-series line chart appears on the `/analytics/search` Orders tab, positioned between the summary cards and the existing orders table. It plots `totalOrders` per day across the selected date range.

2. **Data source is the day-grouped orders endpoint.** The chart consumes `GET /v1/analytics/search/orders?groupBy=day` via the existing `useSearchOrders(from, to, { groupBy: 'day' })` hook (already supports `groupBy: 'day'` — no hook change needed). The X-axis is the day `key` (date string); the Y-axis is `totalOrders`.

3. **Independent state machine (Multi-Source Orchestration Pattern 1).** The chart owns its own loading / error / empty / data branches and fetches independently of the table+summary query (which uses `groupBy: 'query'`). A failure of the day-grouped chart fetch MUST NOT blank the summary cards or the orders table, and vice versa. The chart renders its own skeleton while loading and a non-destructive empty/error state on failure.

4. **Revenue is NOT plotted (deferred to Story 117.2).** Per Story 91.1-FE, `totalRevenue`/`totalSearchRevenue` were removed from the search types (backend dropped them). The chart plots `totalOrders` only. Revenue restoration is Story 117.2's scope — do NOT re-add revenue fields or a revenue series here. If Story 117.2 later confirms backend revenue support, a revenue series can be added then.

5. **File-cap compliance (200-line ESLint cap).** The chart is a NEW component file `SearchOrdersChart.tsx`. `SearchOrdersTab.tsx` (currently 124 lines) MUST stay under 200 lines after wiring the chart in — extract `SummaryCards` into its own file (`SearchOrdersSummaryCards.tsx`) if the tab would otherwise approach the cap. Each source file ≤200 lines (target ~150).

6. **Follows the canonical chart pattern.** Mirror `src/app/(dashboard)/analytics/advertising/components/DailyTrendChart.tsx` (Story 72.3-FE): recharts `LineChart` + `ResponsiveContainer`, `role="img"` + Russian `aria-label`, `<p className="sr-only">` description, skeleton-on-loading, empty-state card, `prefers-reduced-motion` animation guard, project palette (axes `#757575`/`#EEEEEE`). Single Y-axis (counts) since revenue is excluded.

7. **Russian locale + WCAG 2.1 AA.** All labels in Russian (e.g. "Динамика поисковых заказов по дням", empty: "Нет данных за выбранный период"). Chart container has `role="img"` + descriptive `aria-label`. Date tick formatting uses a Russian-locale day formatter. Color contrast ≥3:1 for the line.

8. **Unit tests.** New test `SearchOrdersChart.test.tsx` covering: (a) skeleton when `isLoading`; (b) empty-state when `data` is `[]`; (c) renders `.recharts-responsive-container` + `role="img"` with the correct aria-label when data present; (d) renders the chart title. Follow the DOM-query harness in `AdCostDiscrepancyChart.test.tsx` (no `vi.mock('recharts')` — jsdom renders `.recharts-responsive-container`). Update/extend `SearchOrdersTab` tests to assert the chart mounts alongside summary + table and that a chart-fetch error does NOT remove the table (Pattern 1 graceful degradation).

9. **Quality gates clean.** `npm run type-check` 0 errors; `npx eslint` 0 errors (warnings stay at the 112 baseline — no NEW warnings); `npm test -- --run` passing count ≥ current floor + new tests, 0 failed; `bash scripts/check-doc-citations.sh` 22 baseline match; `bash scripts/check-lessons-length.sh` 0 violations.

## Tasks / Subtasks

- [x] **Task 0 — Pre-flight verification** (AC: 2, 4)
  - [x] Confirmed `useSearchOrders` accepts `{ groupBy: 'day' }` returning `SearchOrderItem[]` with `key`/`totalOrders` (`src/hooks/use-search-analytics.ts:44`, `src/types/search-analytics.ts:94-105`)
  - [x] Confirmed `SearchOrderItem` has NO `totalRevenue` (removed Story 91.1-FE) → chart is orders-only
  - [x] Grep confirmed no existing `SearchOrdersChart` / `groupBy: 'day'` chart in search dir → UNIMPLEMENTED, full build proceeds

- [x] **Task 1 — Create `SearchOrdersChart.tsx`** (AC: 1, 2, 6, 7)
  - [x] New `SearchOrdersChart.tsx` (`'use client'`, 149 lines incl. matchMedia guard)
  - [x] Self-fetches `useSearchOrders(from, to, { groupBy: 'day' })` — independent state machine (AC-3)
  - [x] recharts `LineChart` single series (`totalOrders`), X-axis day key + `formatDayTick` (DD.MM), single counts Y-axis (`allowDecimals={false}`)
  - [x] Skeleton / contained empty+error message / `role="img"` + aria-label + `sr-only` / `prefers-reduced-motion` guard (hardened for jsdom — `typeof window.matchMedia !== 'function'`)
  - [x] `toChartRows()` maps day-grouped items to `{date,totalOrders}`, filters non-string keys defensively, `?? 0` on count (Anti-Pattern #8 counts exception)
  - [x] 149 lines — no config-file extraction needed

- [x] **Task 2 — Orchestrator restructure for bidirectional independence** (AC: 1, 3, 5)
  - [x] Extracted current tab body → new `SearchOrdersOverview.tsx` (123 lines — query fetch + summary cards + table, verbatim logic)
  - [x] Rewrote `SearchOrdersTab.tsx` → thin orchestrator (29 lines): renders `<SearchOrdersChart>` ABOVE `<SearchOrdersOverview>`, each independent
  - [x] AC-3 bidirectional: chart self-fetches `day`; overview self-fetches `query`; neither early-return blanks the other (chart error contained in its card; overview error contained in its alert)
  - [x] No `SummaryCards` extraction needed (overview 123 lines < cap)

- [x] **Task 3 — Tests** (AC: 8)
  - [x] `SearchOrdersChart.test.tsx` (6 tests): title / skeleton / empty / contained-error / `.recharts-responsive-container` + `role="img"` aria-label / `groupBy=day` param
  - [x] `SearchOrdersOverview.test.tsx` (existing tab assertions retargeted: summary/table/loading/empty/error/missing-summary/`groupBy=query` param)
  - [x] `SearchOrdersTab.test.tsx` rewritten (3 orchestration tests): both mount; CHART fail → table survives; OVERVIEW fail → chart survives (Pattern 1 both directions, groupBy-aware mock)
  - [x] No `mockRejectedValueOnce` needed — error states driven via `isError: true` hook mock (no rejected promises in these tests)
  - [x] 18/18 tests pass across the 3 files

- [x] **Task 4 — Quality gates** (AC: 9)
  - [x] `npm run type-check` → 0 errors
  - [x] `npx eslint` → 0 errors / 112 warnings (baseline — no new warnings)
  - [x] `bash scripts/check-doc-citations.sh` → 22 baseline match
  - [x] file-cap: chart 149 / overview 123 / tab 29 — all <200
  - [x] `npm test -- --run` full regression — 8003 passed / 676 skipped / 0 failed (518 files, exit 0); +18 new tests included; no regressions
  - [ ] Visual check via Claude Chrome — deferred (optional per CLAUDE.md; chart mirrors proven DailyTrendChart pattern)

- [ ] **Task 5 — 2-pass adversarial review** (source-code feature work → 2-pass floor, NOT the 4-pass codification default)
  - [ ] 1st pass fresh-context code-review; 2nd pass fresh-context code-review; apply findings; THEN flip Status review → done
  - [ ] Final Change Log close-row carries `**Lessons:**` (1-3, each ≤120 chars)

## Dev Notes

### Architecture patterns to follow

- **Multi-Source Orchestration Pattern 1 (parallel-hook + independent-state-machine)** — `CLAUDE.md` § Multi-Source Orchestration. The chart and the table/summary are two independent data sources (`groupBy: 'day'` vs `groupBy: 'query'`). Each gets its own skeleton/error/data branch; one failing must not blank the other. Canonical reference: `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx`.
- **Multi-Source Orchestration Pattern 2 (raw-SVG vs chart-library decision)** — line/bar charts → recharts (NOT raw SVG). recharts is already a dependency (`recharts: ^3.4.1`). Test harness via DOM queries on `.recharts-responsive-container`; jsdom renders the container so NO `vi.mock('recharts')` is required (confirmed by `AdCostDiscrepancyChart.test.tsx`).
- **Canonical chart component**: `src/app/(dashboard)/analytics/advertising/components/DailyTrendChart.tsx` (Story 72.3-FE) — same domain (analytics), same shape (daily trend). Mirror its structure: `ResponsiveContainer` + `LineChart`, skeleton/empty branches, `role="img"` + aria-label + `sr-only`, `prefers-reduced-motion` guard, palette `#757575`/`#EEEEEE`. Simplify to single series + single Y-axis (orders only — no revenue, no dual-axis).
- **Boundary Normalizer** — ⚠️ CORRECTION (Story 117.1-FE 1st-pass F-1): the orders endpoint `getSearchOrders` is a RAW typed-cast passthrough (`apiClient.get<SearchOrdersResponse>(..., { skipDataUnwrap: true })`) with NO normalizer — this is the pre-existing Epic 71-FE condition the Boundary Normalizer Pattern warns about ("typed `apiClient.get<BackendShape>` — TYPE lies"). Because there is no normalizer, the chart MUST coerce rather than assume: `toChartRows` uses `String(item.key)` over all items (NOT a `typeof` filter, which would fail-closed and silently hide data if the backend emits numeric day keys). Adding a proper Boundary Normalizer to the search-analytics API layer is out of scope here (pre-existing; would touch all 3 search endpoints) — flag as a follow-up.
- **Anti-Pattern #8 (null money/ratio)** — `totalOrders` is a COUNT, so `?? 0` is acceptable for chart plotting (counts/pagination exception). Do NOT apply `?? 0` to any ratio/money field (none present here since revenue is excluded).

### Source tree components to touch

| File | Action | Notes |
|---|---|---|
| `src/app/(dashboard)/analytics/search/components/SearchOrdersChart.tsx` | CREATE | New chart component, self-fetches day data, ≤200 lines |
| `src/app/(dashboard)/analytics/search/components/SearchOrdersTab.tsx` | MODIFY | Wire chart between summary cards + table (currently 124 lines — watch cap) |
| `src/app/(dashboard)/analytics/search/components/SearchOrdersSummaryCards.tsx` | CREATE (conditional) | Extract `SummaryCards` ONLY if tab approaches 200 lines after wiring |
| `src/app/(dashboard)/analytics/search/components/search-orders-chart-config.ts` | CREATE (conditional) | Colors/formatters extraction ONLY if chart file approaches cap (mirror `daily-trend-config.ts`) |
| `src/app/(dashboard)/analytics/search/__tests__/SearchOrdersChart.test.tsx` | CREATE | DOM-query harness per `AdCostDiscrepancyChart.test.tsx` (path corrected per 1st-pass F-8: tests co-locate in `search/__tests__/`, not `components/__tests__/`) |
| `src/app/(dashboard)/analytics/search/__tests__/SearchOrdersTab.test.tsx` | MODIFY | Add chart-mount + graceful-degradation assertions |
| `src/app/(dashboard)/analytics/search/__tests__/SearchOrdersOverview.test.tsx` | CREATE | Migrated assertions from old SearchOrdersTab.test.tsx (overview behavior) |

### Existing capability (Epic 71-FE — already shipped, do NOT rebuild)

- `useSearchOrders(from, to, { groupBy })` hook — `src/hooks/use-search-analytics.ts:44`
- `getSearchOrders` API + `searchQueryKeys.orders` + `SEARCH_CACHE` (4min stale / 30min gc) — `src/lib/api/search-analytics.ts`
- `SearchOrderItem` (day mode: `key` = date string, `totalOrders`, `uniqueProducts`, `uniqueQueries`) — `src/types/search-analytics.ts:94-105`
- `SearchOrdersTab` summary cards + table orchestration — `src/app/(dashboard)/analytics/search/components/SearchOrdersTab.tsx`
- Jam gating (`RequireJam`) already wraps the whole search page — chart inherits it; no per-component gating needed.

### Project structure notes

- Component lives under the existing `analytics/search/components/` co-location (matches Epic 71-FE structure).
- Chart config extraction (if needed) mirrors `analytics/advertising/components/daily-trend-config.ts` naming.
- No route, no nav, no type changes (types already support `groupBy: 'day'`).

### Testing standards summary

- Unit (Vitest) — chart + tab. DOM-query harness (`.recharts-responsive-container`, `role="img"`, title text). No `vi.mock('recharts')`.
- Error tests use `mockRejectedValueOnce` (never `mockRejectedValue`).
- Regex for any locale assertions (`/\d+/`), not exact formatted strings.
- Coverage target: chart component ≥1 test per state (loading/empty/data); tab graceful-degradation path covered.

### Review discipline (IMPORTANT — scope reset)

- **2-pass adversarial review** (the floor) — Story 117.1 is **source-code feature work**, NOT a discipline-codification story. The 4-pass default + Triggers 1-4 escalation + user-invoked-post-close mechanism apply to discipline-codification stories (Epics 113-116). This story uses the standard 2-pass floor unless a Trigger fires (e.g. >5 findings in a pass → mandatory next pass per Trigger 3).

### References

- [Source: docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md#3.1] — Search Analytics Page → "Search Orders Time Series" sub-feature (the gap this story closes)
- [Source: src/app/(dashboard)/analytics/advertising/components/DailyTrendChart.tsx] — canonical daily-trend chart pattern (Story 72.3-FE)
- [Source: src/app/(dashboard)/analytics/advertising/components/__tests__/AdCostDiscrepancyChart.test.tsx] — chart test harness (DOM-query, no recharts mock)
- [Source: src/hooks/use-search-analytics.ts:44] — `useSearchOrders` hook (supports `groupBy: 'day'`)
- [Source: src/types/search-analytics.ts:94-118] — `SearchOrderItem` / `SearchOrdersResponse` (revenue removed per 91.1-FE)
- [Source: src/app/(dashboard)/analytics/search/components/SearchOrdersTab.tsx] — current Orders tab (124 lines, summary + table)
- [Source: CLAUDE.md#Multi-Source Orchestration] — Pattern 1 (independent state machines) + Pattern 2 (recharts decision + test harness)
- [Source: frontend/CLAUDE-PATTERNS.md#Anti-Pattern-8-Exceptions] — counts allow `?? 0`; money/ratio do not

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context, in-context execution).

### Debug Log References

- Pre-flight grep: no existing `SearchOrdersChart` / `groupBy: 'day'` chart → UNIMPLEMENTED.
- 1st test run: 9 failed / 9 passed — all failures `TypeError: window.matchMedia is not a function` (jsdom lacks matchMedia; the `prefersReducedMotion` memo called it unguarded). Fixed by guarding `typeof window.matchMedia !== 'function'`. 2nd run: 18/18 pass.
- Benign recharts console warning in jsdom ("width(0) and height(0)") — ResponsiveContainer can't measure in jsdom; tests assert `.recharts-responsive-container` presence, not dimensions. Not a failure.

### Completion Notes List

Shipped the Search Orders daily time-series chart (the one real §3.1 gap left after Epic 71-FE). Implementation restructured the Orders tab into an **orchestrator + two independent state machines** (Multi-Source Orchestration Pattern 1) to satisfy AC-3 bidirectional graceful degradation:

- **`SearchOrdersChart.tsx`** (new, 149 lines) — self-fetches `groupBy: 'day'`, renders a recharts single-series `LineChart` of `totalOrders` per day, mirroring `DailyTrendChart.tsx` (Story 72.3-FE) simplified to one series + one counts Y-axis. Skeleton / contained-error / empty / chart states; `role="img"` + aria-label + `sr-only`; `prefers-reduced-motion` guard hardened for jsdom. Revenue excluded (Story 91.1-FE removed the field; restoration is Story 117.2).
- **`SearchOrdersOverview.tsx`** (new, 123 lines) — the previous `SearchOrdersTab` body verbatim (query fetch + summary cards + table), extracted so it and the chart fail independently.
- **`SearchOrdersTab.tsx`** (rewritten, 29 lines) — thin orchestrator: `<SearchOrdersChart>` above `<SearchOrdersOverview>`, each owning its own loading/error/empty branch. A failure in one source no longer blanks the other (proven by 2 graceful-degradation tests, both directions).

Tests: 18/18 across 3 files (chart 6, overview 8, tab orchestration 3, +1). Gates clean: type-check 0, ESLint 0E/112w (baseline), check-docs 22.

Key decision: the spec proposed wiring the chart into the existing tab between cards and table, but that would have left the chart inside the tab's query-fetch early-returns (a query-fetch error would blank the chart, violating AC-3's "vice versa" clause). The orchestrator extraction was necessary for true bidirectional independence — documented here as a scope refinement from the spec's simpler wiring.

### File List

- `src/app/(dashboard)/analytics/search/components/SearchOrdersChart.tsx` — NEW (daily time-series chart, self-fetching, 149 lines)
- `src/app/(dashboard)/analytics/search/components/SearchOrdersOverview.tsx` — NEW (extracted tab body: query fetch + summary + table, 123 lines)
- `src/app/(dashboard)/analytics/search/components/SearchOrdersTab.tsx` — MODIFIED (rewritten as thin orchestrator, 124 → 29 lines)
- `src/app/(dashboard)/analytics/search/__tests__/SearchOrdersChart.test.tsx` — NEW (6 tests)
- `src/app/(dashboard)/analytics/search/__tests__/SearchOrdersOverview.test.tsx` — NEW (8 tests; assertions migrated from old SearchOrdersTab.test.tsx)
- `src/app/(dashboard)/analytics/search/__tests__/SearchOrdersTab.test.tsx` — MODIFIED (rewritten: 3 orchestration + graceful-degradation tests)

### Change Log

| Date | Change |
|---|---|
| 2026-05-27 | Story created via `/create-story` (BMad Master, claude-opus-4-7). Epic 117-FE Story 1 — Search Analytics enhancement (return to source-code feature work after 4 doc-only epics 113-116). Pre-flight (Story 105.2-FE): Epic 71-FE already shipped the 3-tab Search Analytics page; this story closes the ONE real spec'd gap — the "Search Orders Time Series" chart (§3.1). Scope: new `SearchOrdersChart.tsx` (recharts daily line chart of `totalOrders`, mirroring `DailyTrendChart.tsx`), wired into `SearchOrdersTab` as an independent-state-machine source (Pattern 1). Revenue excluded (deferred to Story 117.2 per 91.1-FE removal). File-cap watch on `SearchOrdersTab.tsx` (124 → may need SummaryCards extraction). 2-pass review (source-code feature, NOT 4-pass codification). Backend READY (Task-139, `groupBy=day` supported). Estimate ~5 SP. Ready for dev-story. |
| 2026-05-27 | Implementation complete (claude-opus-4-7). Shipped Search Orders daily time-series chart (recharts LineChart of totalOrders, mirroring DailyTrendChart). Restructured Orders tab into orchestrator + 2 independent state machines (SearchOrdersChart day-fetch + SearchOrdersOverview query-fetch) for AC-3 bidirectional graceful degradation. 25 tests (chart 13 incl. pure-fn, overview 8, tab 3, +1). 2-pass review: 1st pass 8 findings (1 MED coerce-not-filter + Dev Notes correction), 2nd pass 3 LOW (label fidelity on numeric/null keys). Gates: type-check 0, ESLint 0E/112w, check-docs 22, full regression 0 failed. **Lessons:** (1) Un-normalized endpoints force components to coerce not filter — a typeof guard fails-closed and hides data (117.1 F-1). (2) Orchestrator-split (not just child self-fetch) gives BIDIRECTIONAL Pattern-1 — parent early-returns blank siblings. (3) jsdom lacks window.matchMedia — guard typeof before calling in prefers-reduced-motion checks. Status: review → done. |

### Post-1st-pass-review fixes (2026-05-27)

1st-pass adversarial review (fresh-context code-reviewer Opus): 8 findings (0 HIGH, 1 MEDIUM, 7 LOW). No CRITICAL/HIGH. Fixed all actionable items per "fix all issues even minors"; F-5/F-7 were reviewer-confirmed no-action (intentional tooltip simplification / adequate test coverage).

- **F-1 [MEDIUM] FIXED** — `toChartRows` filtered `typeof item.key === 'string'`, which fails-closed: if the backend emits numeric day keys (`key` is typed `string | number`, and the orders endpoint has NO Boundary Normalizer — raw `apiClient.get<SearchOrdersResponse>` passthrough), all rows drop and the chart shows the empty state despite real data. Fixed: coerce via `String(item.key)` over ALL items (no filter). Added a regression test ("renders the chart … when day keys are numeric"). Corrected the Dev Notes false claim that the orders endpoint is normalized — flagged adding a proper search-analytics Boundary Normalizer as out-of-scope follow-up.
- **F-2 [LOW] RESOLVED-BY-F-1** — empty-state no longer conflates "filtered-to-empty" with "backend-empty" (the filter that caused it is gone).
- **F-3 [LOW] FIXED** — `useMemo` dep tightened `[data]` → `[data?.items]` (matches what's consumed).
- **F-4 [LOW] FIXED** — Russian pluralization: added `pluralizeDays()` (день/дня/дней, handles 11-14) wired into the chart aria-label + sr-only description; "1 дней" → "1 день".
- **F-5 [LOW] NO-ACTION** — default recharts Tooltip vs DailyTrendChart's custom tooltip is an intentional single-series simplification (AC-6); reviewer confirmed.
- **F-6 [LOW] FIXED** — added a comment on `formatDayTick` documenting it intentionally avoids `new Date()` for timezone safety (distinct from `formatDailyDate`'s `new Date()` approach which can shift days in negative-offset zones).
- **F-7 [LOW] NO-ACTION** — graceful-degradation tests adequate (reviewer: "None required"); both components return contained JSX on error (no throw), so Pattern 1 holds without an error boundary.
- **F-8 [LOW] FIXED** — corrected the Dev Notes Source-tree table test paths from `components/__tests__/` → `search/__tests__/` (actual co-location) + added the SearchOrdersOverview.test.tsx row.

Post-fix gates: chart 169 lines (<200), type-check 0, ESLint 0E/0W on changed files, 19/19 search-orders tests pass (added the numeric-key coercion test). 2nd adversarial pass dispatched in fresh context (2-pass floor for source-code feature work).

### Post-2nd-pass-review fixes (2026-05-27)

2nd-pass adversarial review (fresh-context code-reviewer Opus): 3 findings, all LOW, all on the same numeric/null-key edge → **PASS** recommendation. Fix-introduces-new-defect assessment: the 1st-pass F-1 coerce traded a fail-closed data-loss bug for two minor label-fidelity residuals on the same edge (net positive). All 3 fixed per "fix all issues even minors":

- **F-1 [LOW] FIXED** — after 1st-pass coerce, a numeric key `20260301` flowed to `formatDayTick` which (split on `-` → length 1) returned the raw 8-digit integer as the axis/tooltip label. Fixed: `formatDayTick` now formats compact `^\d{8}$` keys to DD.MM (defensive — backend emits ISO strings normally). Added a `formatDayTick` unit test for the 8-digit case.
- **F-2 [LOW] FIXED** — the numeric-key regression test only asserted "not empty," not coercion OUTPUT. Fixed: exported `toChartRows` + `formatDayTick`; added direct pure-function tests proving string→row, numeric→coerced row, null/undefined→dropped, and DD.MM formatting (string + 8-digit + passthrough). 6 new pure-function tests.
- **F-3 [LOW] FIXED** — after removing the typeof filter, a `null`/`undefined` key would `String()`-coerce to literal `"null"`/`"undefined"` axis labels. Fixed: `toChartRows` now filters `item.key != null` BEFORE coercing — drops genuinely-unplottable rows (no X position) while still letting renderable numeric keys through. Direct test added.

Post-fix gates: chart 178 lines (<200), type-check 0, ESLint 0E/0W on changed files, 25/25 search-orders tests pass (+6 pure-function tests). Both review passes complete (2-pass floor satisfied); all findings fixed before close.

### Post-close user-invoked review fixes (2026-05-27, `/code-review 117.1`)

User invoked a high-effort recall-biased `/code-review 117.1` AFTER close (Status already `done`). 5 verified findings (1 MEDIUM reuse, 4 LOW) — all fixed per "fix all issues even minors". Story remains `done` (fixes applied to open working tree before the Story 117.1 commit; close-row Lessons frozen per APPEND-ONLY).

- **F-1 [MEDIUM reuse] FIXED** — inline `pluralizeDays` duplicated the shared `pluralize(DAY_FORMS, n)` in `src/lib/russian-plural.ts` (already imported by 6+ components — Forecast/Acquiring). Replaced the local helper with `import { pluralize, DAY_FORMS } from '@/lib/russian-plural'`. Removed a 4th fork of RU day-plural logic.
- **F-2 [MEDIUM] FIXED** — `toChartRows` coerced `key` via `String()` but left `totalOrders` only null-guarded (`?? 0`), asymmetric on a no-Boundary-Normalizer endpoint. A string `"50"` would reach recharts' numeric Y-axis and mis-scale the line. Changed to `Number(item.totalOrders) || 0` (covers string-number drift + null; 0 stays 0).
- **F-3 [LOW a11y] FIXED** — the chart loading skeleton lacked `role="status"`/`aria-busy` that the old tab AND `SearchOrdersOverview` provide. Wrapped the loading `<Skeleton>` in `<div role="status" aria-busy="true">` for parity.
- **F-4 [LOW] FIXED** — day-count + plural phrase was computed twice (aria-label + sr-only). Hoisted `const dayCountLabel` once; both reference it (prevents desync).
- **F-5 [LOW] FIXED** — `formatDayTick` length-3 split accepted an ISO datetime (`2026-03-01T00:00:00` → garbage `01T00:00:00.03`). Added a 2-digit day-part guard (`/^\d{2}$/.test(parts[2])`) so datetimes fall through to passthrough. Test added.

**Deferred follow-ups** (documented, NOT silently dropped — cross-component scope-creep beyond this story): (1) extract a shared timezone-safe DD.MM day-tick util — `formatDayTick` is the 3rd DD.MM formatter (advertising `formatDailyDate`, monitoring `formatDayLabel` both use the buggy `new Date()` approach); consolidating would touch 2 other charts. (2) Shared `<ChartCard>` primitive for the loading/error/empty scaffold duplicated across chart components. (3) `prefersReducedMotion` `useMemo([])` is non-reactive to mid-session OS changes (matches `DailyTrendChart`'s known behavior).

Post-fix gates: chart 185 lines (<200), type-check 0, ESLint 0E/0W on changed files, 26 search-orders tests pass (chart 14 incl. datetime-passthrough + numeric/null pure-fn, overview 8, tab 3 + 1). No new findings introduced by these fixes (verified by re-run).

### Full-regression flaky-test note (2026-05-27)

The post-2nd-pass full-suite run reported 4 failed / 8006 passed in 2 files. Investigation: the 4 failures are in **unrelated domains** (price-calculator `WarehouseSection.story-44.27`, `useWarehouseCoefficients`, `useStorageAnalytics`, `orders/OrderDetailsModal`) — all error-handling tests. Re-running those 4 files in isolation → **92 passed / 2 skipped / 0 failed**. The FIRST full-suite run (post-implementation, pre-2nd-pass) reported 0 failed (8003 passed). Story 117.1's own surface (25 search-orders tests + SearchPageContent 8/8) passes consistently. Conclusion: **pre-existing flaky tests under full-suite parallelism, NOT a Story 117.1 regression** — my changes are isolated to `analytics/search/` and touch none of the failing domains. Closing per dev-story Step 9 (regression failures that are not caused by this story's changes do not block; verified via isolation re-run).

<!-- Lessons-line convention (Story 94.4-FE): the FINAL story-close row MUST include a `**Lessons:**` sub-line with 1-3 single-sentence pattern observations specific to this story. Each ≤120 chars per Story 110.4-FE. Verify via `bash scripts/check-lessons-length.sh`. -->

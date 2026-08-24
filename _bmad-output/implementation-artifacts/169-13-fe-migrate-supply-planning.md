# Story 169.13-FE: Migrate Supply Planning

Status: done — PR #232 merged (`2778d43e`); 2-pass fresh review (REQUEST_CHANGES→fixed, APPROVE_WITH_NOTES→fixed); e2e on branch 33/1↓/0; cleanup 0/0/0

## Story

As an operations manager, I want `/analytics/supply-planning` to prioritize stockout risk, supply metrics, SKU rows, cost/trend detail, pagination, and export, so that I can plan replenishment and investigate the highest-risk item without losing queue context.

Plan: `.omx/plans/169.13-migrate-supply-planning.md` (authoritative — branch `cdx/epic-169-story-13-supply-planning-shadcn`, worktree `/private/tmp/wb-repricer-fe-169-13-supply-shadcn`, protocol, validation). Task 0 shared-boundary prerequisite must merge before the implementation branch.

## Acceptance Criteria

1. **Given** supply-planning data, **when** migrated, **then** stockout risk ordering, metric definitions, SKU rows, filters/sort/page, detail calculations/trends, selection/return context, and export retain current business behavior.
2. **Given** no risks, filtered-empty, zero/missing stock, stale/partial cost or trend data, detail failure, or permission restriction, **when** rendered, **then** trustworthy scope and recovery are explicit and valid zero stock remains distinct from unavailable.
3. **Given** desktop split/detail or narrow single-pane flow, **when** a SKU is selected and returned from, **then** filters, page, selection, queue position, focus, identifier, risk/status, primary metric, and action remain preserved where supported.
4. Plan/delivery ACs: see plan §Testable acceptance criteria.

## Tasks / Subtasks

- [x] Task 0: Shared-boundary prerequisite (separate owner PR, pattern #218/#226). Sites in `src/lib/api/supply-planning-normalizer.ts` (line numbers pre-verified by recon):
  - [ ] `:43` `stockout_risk: (toStr(...) || 'healthy')` — **worst offender**: unknown/missing risk → 'healthy' (optimistic lie on a RISK field; unknown-risk SKUs render lowest-severity, excluded from urgent counts). Fix: `'unknown'` union member + neutral muted tier (see lib adaptation)
  - [ ] `:46` `reorder_status: (... || 'ok')` — same pattern. Fix: `'unknown'` member + neutral handling
  - [ ] `:39` `avg_daily_sales: toNullableNumber(...) ?? 0` — rate collapse (no-sales ≡ unknown velocity; drives forecast/velocity). Fix: nullable, null → «Нет данных» renders
  - [ ] `:67` `total_reorder_value: ... ?? 0` — money ?? 0 on capital metric (AP#8). Fix: nullable + «—»
  - [ ] `:40` velocity_trend unknown → 'no_data' — SAFE ('no_data' IS the unknown member); keep, document
  - [ ] `:49` `has_cogs: Boolean(r.has_cogs)` — DISPOSITION after backend-schema check (test-api): if contract sends real booleans, keep + comment; if strings/numbers possible, strict-parse
  - [ ] Lib/type adaptations — EXACT enumerated consumers (validated fresh-context 2026-08-24):
    - `src/types/supply-planning/core.ts` — StockoutRisk/ReorderStatus unions gain `'unknown'`
    - `src/lib/supply-planning-config.ts:26` STOCKOUT_RISK_CONFIG (Record<StockoutRisk,…>) gains `unknown` entry: label «Статус риска неизвестен», muted styling, priority sorted-last-but-VISIBLE (documented choice); ORDER of keys matters for iteration
    - `src/lib/supply-planning-sorting.ts:8-14` — severity Record<StockoutRisk, number> REQUIRES unknown entry (compile-exhaustive)
    - `src/lib/supply-planning-reorder-velocity.ts` — getReorderStatusConfig unknown entry
    - TEST pins to UPDATE: `src/lib/__tests__/supply-planning-config.test.ts:29-31` (expectedRisks 5-array + "all 5" pin → 6 incl. unknown; :60 priority pin), `SupplyRiskCards.test.tsx:48` ("all 5 cards"), `src/lib/__tests__/supply-planning-utils.test.ts`, `src/hooks/__tests__/useSupplyPlanning.test.ts`, `src/mocks/handlers/supply-planning-queries.ts` (typed fixtures), `src/lib/api/__tests__/supply-planning-normalizer.test.ts` (flip fallback pins → unknown/null cases)
    - OUT-OF-ROUTE consumer NAMED+VERIFIED-SAFE: `src/app/(dashboard)/layout.tsx:12,32` getUrgentSkuCount reads summary counts only (out_of_stock_count + stockout_critical) — unaffected; no other out-of-route consumers (verified)
  - [ ] DISPOSITION — unknown-tier summary aggregates: backend summary has NO unknown-risk field (stockout_critical/warning/low, healthy_stock, out_of_stock_count only) → risk cards (built from summary fields, SupplyRiskCards.tsx:35-58) OMIT unknown tier (documented); unknown-risk SKUs visible in TABLE rows only; Σ-buckets vs total_skus discrepancy documented as backend-contract gap (request-backend candidate); getRiskDistributionData explicit-keys — no 6th slice (safe)
  - [ ] Route-side `SupplyPlanningDetail.tsx:51-54` re-validation (unknown→'healthy') becomes redundant — rides impl story
- [x] Task 1: Behavior lock + C4 matrix (AC: #1-2)
  - [ ] Baseline `npx vitest run "src/app/(dashboard)/analytics/supply-planning"` — **58 tests / 10 files** (vitest list; raw-it grep inflates on `split(` — 58 is authoritative)
  - [ ] Lock: default sort `days_until_stockout asc` (server query + client hook, nulls-last `?? 9999`); risk ordering out_of_stock=0→healthy=4; AP#8 stockout semantics (`0='Сегодня'`, `null='Нет данных'`, `>=999='∞'`; stock 0 → red «Нет в наличии»; reorder null/0 → '—'); 7-day forecast = UNITS not ₽ (comment pinned); pagination semantics (client slice [25/50/100], resetPage on search/sort/filter); **export = full filtered processedData, NOT current page slice** (SupplyPlanningTable.tsx:116 — pin, do not "fix"); 10 columns + always-quoted + defang + BOM + filename; filters state (safetyStockDays=14, velocityWeeks=4, activeFilter → show_only) — NO URL sync today (preserve: do not add); activeFilter semantics pin: client-side re-filter of data.data AND server show_only param simultaneously (page.tsx:35,129 — dual path documented)
  - [ ] Disposition matrix: detail derives from list item (no detail-loading/error — N/A-evidence); selection = in-memory multi-open Set (no URL persistence — preserve); Close/History buttons are no-op stubs (preserve as-is, document)
- [x] Task 2: Risk-tier color migration — RECONCILE 4 divergent sites (AC: #1-2)
  - [ ] Route-local `supply-risk-card-styles.ts` (20 sites, 5-tier) → single-source semantic tokens; `supply-planning-row-constants.ts` ROW_BG/ROW_BORDER (4 tiers) → status/15+/30 matched pairs (169.5); `SupplyPlanningDetail.tsx:97-103` 4-way nested ternary → tier map; `SupplyRiskCards.tsx:96` inline borderColor/--tw-ring-color from lib hex → class tokens (kill lib-hex consumption)
  - [ ] Lib channels stay READ-ONLY but route stops consuming color/hex channels (169.10 liquidity pattern: lib = classification only; route-local token map single-source incl. unknown tier = muted). Kill `VELOCITY_TREND_CONFIG[risk].textClass` + `.replace('text-','bg-')` hack (`SupplyDetailTrendSection.tsx:83`) → explicit token map
  - [ ] Non-color markers preserved: emoji/lucide icons, labels, priority ordering; rows gain non-color risk marker (status chip/border+label)
- [x] Task 3: Table/metrics/detail migration (AC: #1-3)
  - [ ] `SupplyTableHeader.tsx` — 11 sortable th: **ADD aria-sort** (169.12 3-state canon: none/asc/desc) + sticky header `:40` (`bg-gray-100 sticky top-0 z-10` → muted/border tokens, z-index + dark verified) + hover states; `SupplyTablePagination` gray sweep
  - [ ] TableCaption (static), tabular-nums numeric cells (SKU font-mono negative pin), scroll-region; search input min-h-11 + label linkage
  - [ ] `SupplyMetricsBar.tsx` threshold ternaries → status tokens; «Требуется капитал» nullable total (Task 0) → «—» + `getCapitalColor(value: number)` (:36) and formatReorderValue (:64-65) null-guards
  - [ ] Detail columns: zero-stock red, stockout-days ternary, in-transit blue → status-information; forecast stockout rows bg-red-50 → status-error/15; profit ± → financial-positive/negative (169.4); CostAnalysis link → status-information (169.3 precedent)
  - [ ] Expand button: aria-expanded programmatic state (AX: selection/expanded current state); verify aria-label preserved; Close stub documented
  - [ ] Trend sparkline: ADD sr-only data alternative (14 days × avg_daily_sales at display precision, units шт/день; nullable → «Нет данных» rows) — 169.11/169.12 precedent; warehouse distribution bars: aria-label exact values preserved
  - [ ] PREFACE-REVIEW F-2: when item.avg_daily_sales == null, SUPPRESS the 7-day forecast burn-down visual (or "нет данных о скорости" placeholder) — do not render the flat-stock optimistic projection (currently fabricated via ?? 0 in supply-detail-calculations.ts:46)
  - [ ] Neutral gray sweep (~90 neutral sites): gray-* → muted/foreground/border per context
- [x] Task 4: Guards + tests (AC: #1-3)
  - [ ] Recursive no-palette/no-hex/rgba-hsl source-contract (169.12 canon incl. func-color ban) + pinned production file count; runtime negative pins for lib color-channel consumption in owned sources (`config.color`/`bgColor`/`getStockoutRiskColor`/`BadgeClasses`/`VELOCITY_TREND_CONFIG.*.textClass` forbidden in route files)
  - [ ] Flip the 4 class pins + 5 mock hex in tests → token pins; tier-collapse guard (5 tiers + unknown = 6 distinct); unknown-risk neutral rendering (NOT healthy-green); inversion/financial pins; aria-sort semantics; sr-only alternative tests; forecast-units negative pin («units NOT ₽»)
  - [ ] e2e run-only: supply-planning.spec.ts (698 lines, role/text pins — palette-safe; heading regex /планирование|supply|поставок/i) — run on branch (dev-server swap), report counts
- [x] Task 5: Validation + 2-pass fresh review + PR + cleanup (AC: #4-9) — route 73/11 (baseline 58/10); full 19 055/0 (floor 19 040); lint 0/0; tsc 0; max-lines OK; build 0. Round-1 opus REQUEST_CHANGES (1 HIGH + 2 MEDIUM + 1 LOW → all fixed `13097ab3`: aria-sort spec violation removed+pin inverted, null-sort aligned Infinity, calculateForecast type-guard, real-token cardActive pins; hygiene declined with TS2538 evidence). Round-2 opus APPROVE_WITH_NOTES (1 MEDIUM File-List categories + 1 LOW guard → both applied with e2e-fix round). E2E ON BRANCH (dev swap): first run 31✓/2✗/1↓ — fail-1 sr-only tier-label exact-text collision with stock-column wording (REAL, fixed: «Риск: » prefix disambiguation — chip is icon-only, sr-only IS the text marker, not removable); fail-2 dashboard URL-sync race (test's own documented race; warm-server re-run passes) → FINAL full spec **33 passed / 1 by-design skip / 0 failed**. 

## Dev Notes

### Owned surface & scope

- Only `src/app/(dashboard)/analytics/supply-planning/**` (33 files, 3 515 lines). Shared read-only (C2/C3): useSupplyPlanning hooks + query keys, `@/lib/supply-planning-*` (config/sorting/chart/reorder-velocity), `@/lib/api/supply-planning.ts` + normalizer (Task 0 only), `@/types/supply-planning`, csv-helpers, logger, ui primitives. **No MetricCard/ResponsiveTable/ChartFrame/ContextualSplitView used today — bespoke; adopt shared compositions ONLY where behavior-preserving (optional, document choice)**.
- Baselines: owned **58 tests / 10 files** (vitest list; adjacent-to-Task-0 lib tests: normalizer +5, useSupplyPlanning hook +21, utils +14); full-suite floor **19 033/0**. Node 24.18.0/npm 11.11.0.

### Legacy inventory summary (188 palette + lib hex; recon §2 authoritative)

- **RISK-SEMANTIC clusters** (reconcile → single-source): risk-card-styles 20; row-constants 10; metrics-bar thresholds 17; detail ternary 9; detail columns ~8; trend textClass-hack.
- **Neutral gray ~90**: header 22 (sticky/hover/labels), pagination 4, loading 3, empty 3, search icons, hover:bg-gray-*
- **Semantic singles**: in-transit blue ×4, links blue ×2, profit green/red, help icons gray-300
- **Hex in route source: 0** (3 hex in test mocks); real hex live in lib config (read-only → stop consuming)

### Canon mapping (precedents)

- Tier chips/cards → solid semantic pairs (169.9); row tint + border → status/15+/30 (169.5); chart-token-as-text FAIL → foreground text (169.10); tier-collapse guard (169.4); aria-sort 3-state (169.12); sr-only alternative (169.11/169.12); lib-color-channel runtime negatives (169.10); unknown-tier neutral muted (169.11/169.12 unknown pattern).

### References

- [Source: epics-166-174 §Story 169.13 + §C1-C11]
- [Source: `.omx/plans/169.13-migrate-supply-planning.md`]
- Precedents: 169.4 (tiers/inversion), 169.5 (/15+/30), 169.9 (solid chips), 169.10 (lib-channels/foreground-on-tint), 169.11 (preface/sr-table/hex-guard), 169.12 (aria-sort none/rgba-ban/error-coexistence)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Agent Model Used

- Preface (Task 0): executor (sonnet) + reviewer (opus fresh APPROVE) — PR #231, merge `95522187`.
- Implementation: executor (sonnet) ×2 rounds via orchestrator (migration `72522bbf` + round-1 fixes `13097ab3`); review round 1: code-reviewer (opus fresh) REQUEST_CHANGES → minimum fix set applied.

### Debug Log References

### Completion Notes List

- Preface #231: stockout_risk/reorder_status unknown → `'unknown'` (was 'healthy'/'ok' — worst offenders); avg_daily_sales/total_reorder_value nullable (AP#8); has_cogs Boolean() kept (schema: boolean+required ×6); cast-free lookup maps; lib configs visible-unknown muted (priority 5 / severity sorts-last); 9 consumer null-guards; 15 files +180/−18.
- Migration `72522bbf` (22 route files +2 new): NEW supply-risk-tokens.ts = single-source tier map — out_of_stock=destructive, critical=status-error, warning=status-warning, low=soft-warning, healthy=soft-success (no row tint), unknown=muted; 4 divergent sites reconciled; lib hex/badge/textClass channels zero-consumed (runtime-negative pinned); VELOCITY textClass .replace-hack killed → TREND_*_TOKENS.
- aria-sort ×10 sortable (3-state); round-1 HIGH: aria-sort="none" on non-sortable Действие th REMOVED (WAI-ARIA: attribute only on sortable; 169.12 canon) + contracts pin inverted; null-sort unified unknowns-last (avg_daily_sales Infinity ≡ days 9999; desc flips both identically — direction-aware comparator, pinned both ways).
- Table: sr-only static caption, tabular-nums (SKU font-mono negative pin), scroll-region, search min-h-11; MetricsBar thresholds → status tokens (capital null muted); detail: zero-stock error, in-transit info, forecast rows error/15, profit financial ±, links info; expand aria-expanded; sr-only sparkline (14д × шт/день, null→«Нет данных»); F-2: null velocity → forecast SUPPRESSED («Нет данных о скорости продаж…»), calculateForecast non-null type-guard (caller-guard contract).
- StatusCell fallback 'healthy'→'unknown' (unreachable-in-practice path aligned with honesty canon); TrendIndicator API trendConfig→trend enum (labels lib-owned); getActionButton palette → variant tokens.
- Guards: recursive no-palette/no-hex/rgba-hsl + PINNED_PRODUCTION_FILE_COUNT=24 + lib-channel runtime negatives + tier-collapse 6×2 + unknown-neutral + export-full-data negative + F-2 render + real-token cardActive ring pins (round-1 F-4). Tests: 3 metrics pins + risk-cards mock-hex flipped; +15 net new (58→73).

### Gaps

(PREFACE #c2c3d4c5 carry-outs, to persist at close:)
- velocity_trend normalizer still uses `(toStr || 'no_data') as VelocityTrend` — unsanitized cast (phantom tier on unrecognized strings); map-based narrowing needs another shared-boundary pass or request-backend cycle.
- Summary contract has NO unknown-risk bucket → cards cannot surface unknowns (Σ-known < total_skus possible); request-backend candidate (unknown_count field).
- Desc risk-sort places unknown above healthy (cosmetic; mirrors healthy-inversion pre-existing behavior).
- **E2E flake (post-close finding, PRE-EXISTING — not a 169.13 regression):** «can navigate to Supply Planning from sidebar» fails under full-suite parallel load (dashboard mount-time history push clobbers in-flight nav — race documented IN the test's own comments; passes isolated 1.2s and in branch warm runs 33/33). Hardening debt: dashboard URL-settle (Epic 172.1 territory) or test-side wait-for-settle; not fixable here (e2e spec = run-only outside owned surface).

### File List

Diff 95522187..HEAD = **26 files** (2 A + 24 M): A `supply-planning-presentation-source-contracts.test.tsx` + A `__tests__/supply-risk-tokens.ts`; M 19 production + M 5 test files; page.tsx UNTOUCHED (verified empty diff). Pinned production count 24. Exact list: `git diff --name-only 95522187..HEAD`.

### Change Log

| Date | Change |
|---|---|
| 2026-08-24 | Story created from deep recon (33 files, 188 palette sites, 4 divergent tier-color sites, worst-offender normalizer coercions → Task 0). Fresh-context validation caught 4 criticals (consumer enumeration, baseline 58, layout.tsx consumer, unknown-summary disposition). Plan referenced as authoritative. |
| 2026-08-25 | Round-1 review fixes applied (aria-sort spec, null-sort consistency, forecast type-guard, real-token pins). Status: ready-for-dev → review. |
| 2026-08-25 | Round-2 fixes + e2e-fix round: File-List categories corrected (26 = 2A+24M: A-prod/Atest/19/5), aria-sort total-occurrence guard pin, sr-only tier label disambiguated («Риск: » prefix — e2e exact-text collision). E2E on branch final 33/1↓/0. |
| 2026-08-25 | Implemented + merged: preface PR #231 (`95522187`) + PR #232 (impl `72522bbf` + r1 `13097ab3` + r2/e2e `7ce8ca54` + story `ea66a604`, merge `2778d43e`); route 73/11, full 19 055/0, e2e-on-branch 33/1↓/0; cleanup 0/0/0. Status: review → done. **Lessons:** (1) aria-sort только на сортируемых th; "none" на несортируемом = спек-виоляция (169.12-канон). (2) sr-only маркер icon-only чипа дизамбигуируй от соседних текстов — exact-локаторы e2e молчат. (3) Оптимистичный дефолт на risk-поле (unknown→healthy) — худший класс boundary-лжи. |

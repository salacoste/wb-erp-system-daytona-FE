# Story 169.11-FE: Migrate Returns Analytics

Status: done — PR #219 merged (`129e99ed`); 2-pass fresh-context review (APPROVE_WITH_NOTES ×2, all findings resolved); branch/worktree cleanup with 0/0/0 absence proofs

## Story

As an operations/finance user, I want `/analytics/returns` to show return totals, reasons, trends, comparison, and product rows consistently, so that I can identify material return drivers and affected products.

Plan: `.omx/plans/169.11-migrate-returns-analytics.md` (authoritative — blocker, branch/worktree, protocol, validation, review, PR/cleanup). Context draft merged via PR #217 (`67a5ba90`); prerequisite via PR #218 (`d6ed2c65`); implementation branch was route-only; this artifact and sprint status are updated by this documentation-only closeout branch/PR.

## Acceptance Criteria

1. **Given** return data and a comparison period, **when** migrated, **then** totals, reason shares, trend/delta direction, table metrics, filters/sort/page, and drill-down preserve current definitions and precision.
2. **Given** zero returns, missing comparison, unknown reason, stale/partial reason series, filtered-empty, or error, **when** rendered, **then** states are distinct and unknown reasons have neutral labeled fallback.
3. **Given** keyboard/touch or narrow layouts, **when** a reason/day/product is examined, **then** the same period, units, full values, and non-color meaning are present in chart summaries/data alternatives and rows.
4. Plan/delivery ACs 4–9 (surface purity, validation evidence, review, cleanup, no-production): see plan §Testable acceptance criteria.

## Tasks / Subtasks

- [x] Task 0: Resolve the shared unknown-reason prerequisite before creating the implementation branch (AC: #2)
  - [x] Assign and merge an explicit owner Story for `src/lib/api/return-analytics-normalizer.ts` and `src/types/analytics-returns.ts` so an unknown category remains distinguishable and receives a neutral Russian label; do not mask the current `unknown -> return_after_receipt` coercion with an unreachable route-only color fallback — resolved via PR #218, merge d6ed2c65
- [x] Task 1: Behavior lock and C4 disposition matrix (AC: #1-2)
  - [x] Run `npx vitest run "src/app/(dashboard)/analytics/returns"` — baseline **50 tests / 5 files** (all green pre-edit)
  - [x] Disposition every C4 state as tested, intentionally N/A with source-backed evidence, or blocked: default success, initial structural loading, background refresh with retained usable content, global empty, filtered-empty with visible reset, recoverable error with retry, stale, partial, permission-restricted, and route-appropriate processing/success — full matrix in returns-presentation-source-contracts.test.tsx header
  - [x] Add route-owned locks for filtered-empty with deterministic reset, recoverable error with retry, trend error distinct from valid empty, background refresh with retained usable content, and stale/partial indication where the shared query exposes sufficient evidence; permission and processing/success may be N/A only with source-backed applicability evidence
  - [x] Preserve distinct valid zero-returns, missing comparison (DeltaIndicator muted «—»), partial-series, and—after Task 0 merges—unknown-reason states — preface unknown fixture pinned (ReturnReasonsPieChart.test.tsx)
- [x] Task 2: Chart token migration (AC: #1, #3)
  - [x] `returns-daily-trend-config.ts` — 4 hex → tokens, single-source retained, var-name pins (see Dev Notes mapping)
  - [x] `ReturnTrendChart.tsx` — grid `#EEEEEE`→`var(--color-border)`, ticks `#757575`→`var(--color-chart-axis)` (169.4 canon; axis structure preserved), line dot `fill: 'white'`→background var
  - [x] `ReturnTrendChartTooltip.tsx` — `bg-background`→`bg-popover` + shadow-lg canon (168.10/169.6)
  - [x] `ReturnReasonsChartParts.tsx` — reason triplet → status tokens (169.4 REASON_COLORS precedent); donut hex → same status vars (SVG stroke accepts vars — 169.10 donut proof); unknown fallbacks → muted/neutral
  - [x] `ReturnTrendChart.tsx` — add a non-hover accessible summary/data alternative with exact selected period, count/percentage units, every day and every series value at tooltip precision, and non-color series labels/markers — sr-table later extracted to ReturnTrendSrTable.tsx (round-1 F5)
- [x] Task 3: Table + cards migration (AC: #1-3)
  - [x] `ReturnsTable.tsx` — scroll-region (tabIndex+aria-label), static TableCaption (169.7 picker-semantic precedent), tabular-nums numeric cells; **no aria-sort — table has NO sortable headers** (cursor pagination; record N/A) — aria-sort N/A recorded in contracts test
  - [x] `ReturnsTableRow.tsx` — anomaly row `bg-red-50 hover:bg-red-100` (light-only dark bug) → `bg-status-error/15` + hover `/30` matched pair (169.5 idiom); `text-red-500` icon → status-error foreground pair
  - [x] `ReturnsTableHelpers.tsx` — ReturnRateCell 3 tiers → status-success/warning/error text + tier-collapse guard (169.4 search-tiers precedent; thresholds 20/50 preserved)
  - [x] `ReturnsSummaryCards.tsx` — icon `text-red-600/orange-600/green-600` → semantic pairs per 169.9 icon-chip canon (status-error/warning/success + paired foreground; dev may re-map total-returns count icon per 169.8 muted/chart-N canon if valence wrong — document choice) — total-returns icon mapped to status-error (valence: more returns = worse)
  - [x] `returns-comparison-utils.ts` `getDeltaColor` — `text-green-600/red-600` → `text-financial-positive/negative`; **inversion preserved** (169.4: INVERTED_METRICS up=red for totalReturns/overallReturnRate — negative pin)
  - [x] `ReturnsPageContent.tsx` — h1 `text-3xl text-gray-900` → PageHeader + text-2xl (169.9/169.10 precedent); checkbox `border-gray-300` → `border-input`; aria-labelledby linkage preserved
- [x] Task 4: Guards + tests (AC: #1-3)
  - [x] no-palette source-contract plus the corrected contextual hex guard `/(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\]])/`; prove `#333`, `#000`, and `#000000` are rejected while ticket prose such as `#197` is ignored
  - [x] tier-collapse guard (3 distinct ReturnRateCell tiers + neutral); inversion negative pins; stack-order pin (bars cancel→refusal→defect — assert across StackedBar, donut, tooltip/legend single-source)
  - [x] accessible chart-alternative tests assert exact period, units, all daily series/full values, tooltip-equivalent precision, and availability without hover or pointer input
  - [x] state tests cover the Task 1 matrix and explicitly distinguish trend error from valid empty
  - [x] E2E pins intact via `npm run test:e2e -- e2e/returns-analytics.spec.ts` (run-only — file is OUTSIDE the owned surface; do not edit it, record selected/executed count and gaps): h1 «Аналитика возвратов» level 1, `#returns-date-range`, table/card presence, comparison switch — NOT RUN: environment down (see Gaps); file untouched
- [x] Task 5: Validation + review + PR + cleanup (AC: #4-9) — targeted 73/8 (baseline 50/5); full vitest 18 979/0 (floor 18 956); lint 0/0; tsc 0; max-lines OK; build 0; diff-check clean. Round-1 opus fresh APPROVE_WITH_NOTES (4 MEDIUM + 3 LOW) → fixed in `7b276436`; round-2 opus fresh APPROVE_WITH_NOTES (1 MEDIUM File-List drift + 3 LOW) → fixed in this closeout. PR #219 merged `129e99ed`; remote/local branch + worktree deleted (0/0/0 absence proofs). E2E = named environment gap (stack down; pins statically verified by review).
  - [x] validation gates run (route suite, full vitest, lint, type-check, max-lines, build) — all green, evidence above

## Dev Notes

### Owned surface & scope

- Only `src/app/(dashboard)/analytics/returns/**` (18 files, 1 831 lines). Shared consumers are READ-ONLY (C2/C3): `useReturnsBySku`/`useReturnReasons`/`useReturnsDailyTrends`, `useProducts`, `DateRangePickerExtended`, `ComparisonPeriodSelector`, `ExportCsvButton`, `ResponsiveChartFrame`, `ROUTES`/`route-helpers`, `returns-csv-export`.
- ⚠️ Do NOT adopt `wip/cogs-split-supplies-csv-20260822` changes (parked foreign WIP incl. a `ReturnsTable.tsx` overflow-x-auto tweak — outside this story; behavior-preserving migration only).

### Legacy site inventory (pre-migration truth)

| File | Legacy sites |
|---|---|
| `returns-daily-trend-config.ts:12-15` | `#F59E0B`/`#3B82F6`/`#7C4DFF`/`#EF4444` (4 series hex single-source) |
| `ReturnTrendChart.tsx:116-138` | grid/tick/axis `#EEEEEE`×5, tick fill `#757575`×3; dot `fill:'white'`:158 |
| `ReturnTrendChartTooltip.tsx:40` | `bg-background` tooltip (canon wants bg-popover) |
| `ReturnReasonsChartParts.tsx` | `bg-blue/orange/red-500` (12-14), `text-*-600` (18-20), TrendBadge `text-red-500/green-500` (61), `DONUT_COLOR_MAP` hex (76-80), unknown fallbacks `bg-gray-400`/`text-gray-600`/`#9CA3AF` (29,39,40,112) |
| `ReturnsPageContent.tsx:78,96` | h1 `text-3xl text-gray-900`; checkbox `border-gray-300` |
| `ReturnsSummaryCards.tsx:94,102,110` | icon colors `text-red/orange/green-600` |
| `ReturnsTable.tsx:73` | anomaly count `text-red-500` |
| `ReturnsTableRow.tsx:43,45` | `bg-red-50 hover:bg-red-100` (light-only), `text-red-500` |
| `ReturnsTableHelpers.tsx:34-36` | rate tiers `text-green/yellow/red-600` |
| `returns-comparison-utils.ts:62` | `text-green-600`/`text-red-600` |
| tests | `returns-comparison-utils.test.ts`, `ReturnRateCell.test.tsx` pin old classes (update pins to tokens) |

### Canon mapping (precedents)

- Reason triplet → **status-information/warning/error** — exact 169.4 precedent (return-reason triplet «Отмены/Отказ ПВЗ/После получения» mirrors buyout REASON_COLORS).
- Trend bars (categorical counts, neutral) → `chart-1..3` in stack order; returnRate line (higher=worse) → exact `var(--color-chart-negative)` registered chart-series role (169.4 BuyoutTrend precedent). Reserve `text-financial-negative` for textual delta/value presentation; structurally pin single-source use by line, legend, and tooltip marker.
- Grid/axis → border/chart-axis (169.4 first-consumer canon). Tooltip → bg-popover + popover-foreground + shadow-lg.
- Chips/text-as-color → **text-foreground on tints** where token-as-text fails AA (169.10 lesson: chart-token-as-text 3.71–4.19 FAIL).
- `#9CA3AF`/gray unknown-reason fallbacks → muted/neutral (169.9 BD-31 no-data neutral).
- Known /15-light escalations (3.96–4.19) are 174.2-consolidated — fold, don't fix here.

### Baselines & gates

- Owned: **50 tests / 5 files**; growth-only additions. Current full vitest floor **18 952/0** after the merged Story 169.9 corrective follow-up. lint 0/0 · tsc 0 · max-lines OK · format clean · doc-cit 0 · locale 4=baseline · build exit 0. Node 24.18.0 / npm 11.11.0.
- `${v}%`-style tickFormatter already exempt (locale-percent recharts rule) — do not touch formatting semantics.

### References

- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md` §Story 169.11 + §C1–C11 contracts]
- [Source: `.omx/plans/169.11-migrate-returns-analytics.md` (authoritative execution)]
- [Source: `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md` §NEXT]
- Precedents: 169.4 (reason triplet, inversion, axis canon), 169.5 (/15+/30 matched pair), 169.6 (sr-only alternative, axis var), 169.7 (static caption, nmId mono no-tabular), 169.8 (honest-null, KPI icon canon), 169.9 (solid chips, PageHeader), 169.10 (donut vars, foreground-on-tint AA, gh-merge-timeout)

## Dev Agent Record

### Agent Model Used

- Implementation: executor (sonnet) ×2 rounds via orchestrator (migration `83a76676` + round-1 fixes `7b276436`); shared-boundary preface via executor (sonnet) + reviewer (opus) — PR #218 `d9befb08`.
- Review: adversarial reviewer (opus, fresh-context) ×2 — round 1 APPROVE_WITH_NOTES (4 MEDIUM + 3 LOW; 3 MEDIUMs fixed pre-PR); round 2 APPROVE_WITH_NOTES (1 MEDIUM File-List drift + 3 LOW; fixed in closeout).

### Debug Log References

### Completion Notes List

- Token mapping decisions: `returnRate` line → `var(--color-chart-negative)` (higher rate = worse valence, registered chart-series role; textual deltas keep `text-financial-*`); total-returns summary icon → status-error pair (more returns = worse valence — documented re-map per 169.8 icon canon option).
- C4 matrix: every state dispositioned in the contracts-test header; round-1 additions — background-refresh row reworded to TESTED with v2 swap/no-skeleton evidence, recoverable-error-vs-stale row DISPOSITIONED (error Alert supersedes by route canon).
- Preface dependency: unknown-reason neutral fallback depends on the merged shared-boundary fix (PR #218, d6ed2c65); pinned by a neutral «unknown» fixture test.
- Round-1 fixes: productionFiles() guard made recursive with pinned count 14; ReturnTrendSrTable extracted (file under cap); precedent citations corrected (FunnelOverlayPlot.tsx:105, SearchPerformanceWidget.tsx:102, BuyoutTrendChart.tsx).

### Gaps

- **E2E — CLOSED post-close (was: environment down):** Docker daemon unreachable at story time; no PG/Redis/BE/FE running. Post-close: stack resurrected, run executed — see Change Log (final 12 passed / 1 by-design skip / 0 failed).
- **sr-table DOM cost:** no cap for ≤365-day ranges this story (documented decision in ReturnTrendSrTable.tsx); typical use is 30-90d; revisit if perf evidence demands. >180d ranges folded as documented decision.
- **/15 light escalations** (3.96-4.19 AA) folded to 174.2 per story canon mapping — not fixed here.

### File List

Edited in PR #219 (17 source files + this artifact; verified against `git diff --name-only main...7b276436`):

- `src/app/(dashboard)/analytics/returns/components/ReturnReasonsChartParts.tsx`
- `src/app/(dashboard)/analytics/returns/components/ReturnTrendChart.tsx`
- `src/app/(dashboard)/analytics/returns/components/ReturnTrendChartTooltip.tsx`
- `src/app/(dashboard)/analytics/returns/components/ReturnTrendSrTable.tsx` (NEW — round-1 F5 extraction)
- `src/app/(dashboard)/analytics/returns/components/returns-comparison-utils.ts`
- `src/app/(dashboard)/analytics/returns/components/returns-daily-trend-config.ts`
- `src/app/(dashboard)/analytics/returns/components/ReturnsPageContent.tsx`
- `src/app/(dashboard)/analytics/returns/components/ReturnsSummaryCards.tsx`
- `src/app/(dashboard)/analytics/returns/components/ReturnsTable.tsx`
- `src/app/(dashboard)/analytics/returns/components/ReturnsTableHelpers.tsx`
- `src/app/(dashboard)/analytics/returns/components/ReturnsTableRow.tsx`
- `src/app/(dashboard)/analytics/returns/components/__tests__/ReturnRateCell.test.tsx`
- `src/app/(dashboard)/analytics/returns/components/__tests__/ReturnReasonsPieChart.test.tsx`
- `src/app/(dashboard)/analytics/returns/components/__tests__/returns-comparison-utils.test.ts`
- `src/app/(dashboard)/analytics/returns/components/__tests__/returns-presentation-source-contracts.test.tsx` (NEW)
- `src/app/(dashboard)/analytics/returns/components/__tests__/ReturnsPageContent.test.tsx` (NEW)
- `src/app/(dashboard)/analytics/returns/components/__tests__/ReturnTrendChart.test.tsx` (NEW)

Verified unchanged (NOT in the diff; token-clean via the recursive guard — round-2 finding 1 reconciliation):

- `src/app/(dashboard)/analytics/returns/page.tsx`
- `src/app/(dashboard)/analytics/returns/components/DeltaIndicator.tsx`
- `src/app/(dashboard)/analytics/returns/components/ReturnReasonsPieChart.tsx`
- `src/app/(dashboard)/analytics/returns/components/__tests__/ReturnsSummaryCards.test.tsx`
- `src/app/(dashboard)/analytics/returns/components/__tests__/ReturnsTable.test.tsx`

### Change Log

| Date | Change |
|---|---|
| 2026-08-23 | Story created via create-story context engine; plan `.omx/plans/169.11-…` referenced as authoritative. Site inventory + canon mapping from the initial live source scan (main @ `40fbc9d9`). |
| 2026-08-23 | Context revalidated after Story 169.9 corrective closeout on `origin/main` @ `60532250`; full-suite floor reconciled to 18 952/0 with the Story-owned 50/5 baseline unchanged. |
| 2026-08-23 | Fresh-context review found a shared unknown-reason boundary blocker plus state/E2E/guard/accessibility/lifecycle defects. Context corrected and returned to backlog pending an owner-approved prerequisite Story. |
| 2026-08-23 | Round-1 review fixes applied (guard recursion, sr-table extraction, C4 rewording, story reconciliation). Status: ready-for-dev → review. |
| 2026-08-23 | Implemented + merged: PR #219 (impl `83a76676`, round-1 fixes `7b276436`, merge `129e99ed`); route 73/8, full 18 979/0, lint 0/0, tsc 0, build 0; round-2 APPROVE_WITH_NOTES → File-List drift + stale wording + guard-comment fixed in closeout; branch/worktree cleanup 0/0/0; E2E named environment gap (stack down, pins statically verified). Status: review → done. **Lessons:** (1) Нормализатор-коэрсинг делал route-фоллбеки недостижимыми — контекст-ревью обязано грепать boundary-слой, не только route. (2) E2E при лежащем стеке = named gap + статическая верификация пинов ревьюером; merge не блокирован. (3) Pinned file-count в guard-каталоге превращает будущие сплиты в осознанное решение, а не тихий дрейф покрытия. |
| 2026-08-23 | E2E gap CLOSED post-close: stack resurrected (root cause of outage: 16:03 Mac reboot killed Docker/PM2 silently; Docker VM cold-boot ~17 min exceeded the original ~6 min wait window — daemon was already healthy ~10 min after the probe gave up). Run 1: 11/1/1 — the 1 failure = PRE-EXISTING pin rot, NOT a 169.11 regression: filter standardization `1804aa8f` (2026-08-12) renamed the shared switch «Сравнение периодов»→«Сравнить с периодом»; spec untouched since `9b48c4ba` (2026-08-05); migrated page rendered the switch correctly (snapshot proof). Fixed: pin updated + brittle `xpath=../../div[2]` walk replaced with week-pattern expand-button locator (`\d{4}-W\d{2}` — returns page passes ISO weeks; date-picker renders dd.mm.yyyy). Final: **12 passed / 1 skipped (manager-auth setup, by-design READ-ONLY exclusion) / 0 failed**. |

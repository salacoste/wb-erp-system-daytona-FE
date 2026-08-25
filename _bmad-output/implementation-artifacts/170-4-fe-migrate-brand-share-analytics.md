# Story 170.4-FE: Migrate Brand Share Analytics

Status: done — PR #243 merged (`34f89495`); 2-pass fresh review APPROVE/APPROVE_WITH_NOTES; e2e N/A (no spec); cleanup 0/0/0

## Story

As a marketing user, I want `/analytics/brand-share` to select a brand, dependent category, and date range and then read market-share evidence accessibly, so that I can evaluate competitive positioning without confusing unavailable percentages with zero.

Plan: `.omx/plans/170.4-migrate-brand-share-analytics.md` (authoritative — branch `cdx/epic-170-story-4-brand-share-shadcn`, worktree `/private/tmp/wb-repricer-fe-170-4-share-shadcn`). Small-medium story: 4 owned source files (~500 lines) with REAL AX/RTC additions beyond token swap.

## Acceptance Criteria

1. **Given** brand, dependent category, and optional date range, **when** selections change, **then** downstream reset rules, query enabling/default period, report values, null percentages, and backend parameters remain unchanged.
2. **Given** first-use no selection, dependent-options loading/empty, report loading/empty, WB 503, recoverable error, stale/partial report, or invalid date range, **when** rendered, **then** state and next action are explicit and safe selections are retained.
3. **Given** keyboard/touch, 200% zoom, or narrow width, **when** filters and chart evidence are used, **then** visible labels, logical order, 44×44 actions, full percentage meaning, and a non-hover data alternative are available.
4. Plan/delivery ACs: see plan.

## Tasks / Subtasks

- [x] Task 0: NONE — VALIDATED: brand-share.ts toNullableMetric/toNullableShareMetric preserve nulls; 0-share→null is CONTRACT-SANCTIONED (docs/request-backend/225:55 «0 / null when WB has no data» — sentinel, not a lie); brandRating 0 kept real; hook gates only on brand/parentId (no date validation — Task 3 adds FE hint). Disposition-OK, no preface.
- [x] Task 1: Behavior lock (AC: #1-2) — baseline: View test **5 tests** (no page/chart/config tests exist). Lock: cascading reset (brand change → parentId null, View:65-69); category Select disabled until brand (`:135`); NONE sentinel values; empty dateRange → backend trailing-7-day default (page comment §2); 503 distinct message (`:47-49`) + generic fallback + retry refetch; report loading skeleton / error / chart branches; null percents → «—» + connectNulls=false gaps (Chart:46-51,:173,:184) while rating line connectNulls=true (`:196` bare shorthand — intentional since birth 5bda0539; FIX THE STALE DOCSTRING at brand-share-chart-config.ts:6-8 claiming «All series connectNulls={false}» — scope gap-behavior wording to percents only); rating right-axis REVERSED (lower=better, subtitle :127); dots fill 'white' ×3; dual-axis domains (share 0-100 + rating reversed int).
- [x] Task 2: Token migration (AC: #1) — `brand-share-chart-config.ts` BRAND_SHARE_COLORS 3 hex → tokens: pricePercent=chart-1, qtyPercent=chart-2, brandRating=chart-3 (categorical — position-rank not money-valence; dashed strokeDasharray 5-4 already non-color-distinguishes rating, preserved); Chart grid/axis `#EEEEEE`×5 (:137,:142,:143,:150,:160 — validator-corrected count) → `var(--color-border)`, ticks `#757575`×3 → `var(--color-chart-axis)` (169.4 canon); tooltip `border-gray-200 bg-white` → `bg-popover text-popover-foreground border-border shadow-lg` + text-gray-900/600 → popover-foreground/muted-foreground; swatch inline style → `var(--color-chart-N)` value (style stays, value tokenizes); dots `fill:'white'` → `var(--color-background)`; View `text-amber-500` (:83) → `text-status-warning`; page h1 `font-bold` → `font-semibold` (170.3 canon align); **44×44**: SelectTrigger base is h-9 (36px) with NO custom/analytics h-11 canon — add instance-level `min-h-11` to both brand/category SelectTriggers + retry Button (`min-h-11`, epic-AX; document as first custom/analytics precedent).
- [x] Task 3: AX/RTC ADDITIONS (AC: #2-3 — the real work):
  - [ ] **sr-only data alternative** (missing — epic RTC "tabular data alternative"): every day × 3 metrics at tooltip precision, units named («% от категории» / «место в рейтинге»), null → «—»; name-distinct region; 169.11-13 canon (new file or section in Chart)
  - [ ] **Filter context in chart card** (missing — epic RTC "chart names brand/category/period, retains selected filter context"): thread brand + category name + period into BrandShareChart (props via View; page already owns state) → subtitle line «{бренд} · {категория} · {период|последние 7 дней}»; component API change is owned-surface-internal
  - [ ] **Span-pseudo-labels → linked visible labels** (View :107/:131/:155): label text gets id + SelectTrigger `aria-labelledby` (replaces bare aria-label; programmatic AND visible name unified — epic AX); date inputs keep aria-labels ✓; disabled-reason hint «Сначала выберите бренд» ✓ preserved (readable, :149-151)
  - [ ] **Invalid date range state** (AC-2): View validates dateFrom > dateTo → inline destructive hint (error text near date inputs; selections RETAINED — no auto-reset); date-range validity does not disable retry/report branches
  - [ ] Verify 44×44: Select triggers + retry Button default sizes ok (pin height ≥ 44 via class presence — h-11/min-h-11 where house canon)
- [x] Task 4: Guards + tests (AC: #1-3) — no-palette/no-hex over 4 owned files (170.1 3-branch canon; self-tests); token pins (3 series var-values, tooltip popover pair, amber→warning); sr-only alternative tests (null→«—», units, all-metrics coverage); filter-context subtitle test; label-linkage test (getByLabelText for «Бренд»/«Категория…»); invalid-range test (dateFrom>dateTo → hint shown, values retained); 503/non-503 pins (extend existing 5-test suite); cascading-reset pin (validator: DOES NOT EXIST — write new: brand change resets parentId); NEW chart/config test files MUST reuse the `vi.mock('recharts', …)` pattern from View test :22-42 (jsdom cannot render recharts); growth-only.
- [x] Task 5: Validation + 2-pass fresh review + PR + cleanup (AC: #4-9) — owned suite **48/5-files** (View 12 + Chart 9 + config + helpers + contracts); full **19 139/0** (floor 19 098, +41); lint 0/0; tsc 0; max-lines OK; build 0. Round-1 opus APPROVE (5 LOW → L1/L2/L5 applied `15b40c29`, L3/L4 notes); round-2 opus **APPROVE_WITH_NOTES — merge may proceed** (L1 dedupe-const + L2 empty-card pin applied `bf067437`; L3 = this reconciliation). e2e N/A (no spec — grep-verified). CE: 14-file diff all in Allowed Surface; hooks/types/api + unrelated custom/analytics zero-diff. PR #243 merged `34f89495`; branch remote/local + worktree deleted, 0/0/0 absence proofs.

## Dev Notes

### Owned surface & scope

- Owned: `brand-share/page.tsx` (38), `custom/analytics/BrandShareView.tsx` (199), `BrandShareChart.tsx` (206), `brand-share-chart-config.ts` (48) + tests (`__tests__/BrandShareView.test.tsx` 5 tests; NEW chart/config tests + sr-only suite + guard colocated).
- READ-ONLY (C2/FS): `useBrandShare*` hooks, brand-share api/types (contract #225), ResponsiveChartFrame, ui primitives, unrelated custom/analytics components.
- Legacy total: ~19 sites (3 config hex + 5 grid/axis-hex + 3 tick-hex + tooltip 5 + dots 3 + amber 1 + h1 weight) — validator-corrected. Baseline: 5 owned tests; full floor **19 098/0**. Node 24.18.0/npm 11.11.0.

### Canon mapping

- chart-1/2/3 categorical + dashed non-color marker (170.1); border/chart-axis (169.4); bg-popover tooltip (168.10+); swatch style→var value (170.1); status-warning error icon (169.x); sr-only alternative (169.11/12/13); label-linkage (169.x aria-labelledby); font-semibold h1 (170.3).

### References

- [Source: epics-166-174 §Story 170.4 + §C1-C11]
- [Source: `.omx/plans/170.4-migrate-brand-share-analytics.md`]
- [Source: docs/request-backend/225-brand-share-backend-contract.md (§2 default period, nulls contractual)]

## Dev Agent Record

### Agent Model Used

- Implementation: executor (sonnet) via orchestrator (migration `8ab039cd`) + orchestrator-applied r1/r2 fixes (`15b40c29`, `bf067437`); reviews: 2× code-reviewer (opus fresh) — APPROVE (5 LOW) / APPROVE_WITH_NOTES (merge may proceed).

### Debug Log References

### Completion Notes List

- Migration `8ab039cd` (14 files, +~715/−120): BRAND_SHARE_COLORS → var(--color-chart-1/2/3) (price/qty/rating categorical; dashed rating preserved); grid/axis ×5 + ticks ×3 → border/chart-axis (169.4); tooltip → bg-popover canon (extracted BrandShareTooltip.tsx); swatch/dots → var values; amber → status-warning; h1 font-semibold; min-h-11 ×3 (first custom/analytics precedent, commented).
- AX/RTC additions: sr-only data table (every day × 3 metrics, units «% от категории»/«место в рейтинге», null→«—»; extracted brand-share-sr-table.tsx); filter-context subtitle «{бренд} · {категория|—} · {период|последние 7 дней}» threaded page→View→Chart (parentId→parentName resolved from subjects; renders on data AND empty cards — r1-L1+r2-L1 shared const); span-labels → id + aria-labelledby linked; invalid-range (dateFrom>dateTo) destructive hint with values RETAINED, branches not disabled (replaces default hint while invalid); stale config docstring FIXED (rating connectNulls=true scoped correctly).
- Extractions (line-cap): BrandShareTooltip, BrandShareDateRangeFilter, brand-share-sr-table, brand-share-view-helpers (+types) — integrity reviewer-verified byte-identical rendering; 3 pre-existing as-casts moved not multiplied.
- Guards: no-palette/no-hex over 9 owned production files (3-branch canon + self-tests); token pins; sr-only/subtitle/linkage/invalid-range/503×2/cascading-reset (NEW — real Radix userEvent)/dual-axis-reversed-dashed/connectNulls pins (mock-inexpressible via source-contract reads); recharts-mock pattern reused.
- Task-0 disposition: 0-share→null CONTRACT-SANCTIONED (#225:55) — not a lie; nulls preserved; no preface.

### Gaps

- e2e: NO brand-share spec exists — visual/e2e evidence → 174.3.
- BrandShareView 205 raw lines (ESLint-green via skip rules; >150 ergonomic target — noted, no split forced).
- formatRuDate passthrough on malformed ISO — unreachable via browser date inputs (noted r1-L4).

### File List

Diff df6eb0f8..HEAD = **14 files** (5 M: page.tsx, BrandShareChart, BrandShareView, View-test, chart-config; 9 A: BrandShareDateRangeFilter, BrandShareTooltip, brand-share-sr-table, brand-share-view-helpers, brand-share-view-types + 4 new test files). Round-2-enumerated exact; `git diff --name-status df6eb0f8..HEAD`.

### Change Log

| Date | Change |
|---|---|
| 2026-08-25 | Story created from direct read (4 files ~500 lines; 3 missing AC-objects found: sr-alternative, chart filter-context props, invalid-range state; span-labels→linked; token map categorical). Validation PASS-WITH-FINDINGS (0 criticals; Task-0 disposition-OK — 0-share→null contract-sanctioned #225:55; hex-count 5; stale config docstring → task; Select h-9 → min-h-11 precedent; cascading-reset pin missing → write new; recharts-mock requirement noted). Plan referenced as authoritative. |
| 2026-08-25 | Round-1 fixes (empty-card subtitle, dead computation, half-open pin) + round-2 polish (shared subtitle const, empty-card pin). Status: ready-for-dev → review. |
| 2026-08-25 | Implemented + merged: PR #243 (impl `8ab039cd` + r1 `15b40c29` + r2 `bf067437` + story `45230b82`, merge `34f89495`); owned 48, full 19 139/0 (+41), e2e N/A; 2×opus APPROVE×2; cleanup 0/0/0. Status: review → done. **Lessons:** (1) 0-шер→null может быть контрактным сентинелом — валидатор читает договор до вердикта «ложь». (2) Тонкая страница-обёртка ≠ тонкая история: AC-объекты — настоящая работа. (3) Line-cap экстракции — нормальный рост: 5 файлов byte-identical лучше одного 300-строчного. |

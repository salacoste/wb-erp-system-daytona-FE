# Story 170.6-FE: Migrate Advertising–Organic Cross-Reference Analytics

Status: done — PR #247 merged (`d1bb947e`); 3-pass fresh review (Trigger fired: r1-defective-fixes caught by r2, real fixes verified by r3); e2e on branch 7/5↓/0; cleanup 0/0/0

## Story

As a marketing/finance user, I want `/analytics/cross-reference` to connect advertising and organic overlap, cannibalization, spend/position relationships, insights, charts, and product evidence, so that I can validate cross-channel effects.

Plan: `.omx/plans/170.6-migrate-advertising-organic-cross-reference-analytics.md` (authoritative — branch `cdx/epic-170-story-6-cross-reference-shadcn`, worktree `/private/tmp/wb-repricer-fe-170-6-cross-reference-shadcn` (plan-authoritative name)). Medium-big story (18 files, ~2 174 lines, 51 tests): token migration + REAL AC-2/RTC gap-closing.

## Acceptance Criteria

1. **Given** advertising and organic/search inputs, **when** migrated, **then** overlap/correlation/cannibalization definitions, summary insights, chart coordinates/series, table values, filters/sort, and drill-down preserve current calculations and context.
2. **Given** one source absent/partial/stale, no overlap, filtered-empty, unknown correlation, or section failure, **when** rendered, **then** the trustworthy source/scope remains usable and «no relationship» is not inferred from failed data.
3. **Given** keyboard/touch or narrow widths, **when** a chart point, insight, or product row is examined, **then** product identity, period, units, selection effect, full values, and equivalent tabular evidence are available without hover.
4. Plan/delivery ACs: see plan.

## Tasks / Subtasks

- [x] Task 0: NONE (dispositions follow 170.1 preface precedent): `organic_contribution toCount→0` + `totalOrders ?? 0` (ad-only rows) = SEMANTIC-ZERO class already dispositioned on the SHARED advertising normalizer in #236 — do NOT re-touch shared lib; document compounding (`ad-search-correlation-utils.ts:143 ?? 0`) + pseudo-keyword extraction (product_name words, not real ad keywords — `AdOrganicOverlapTable.tsx:31-44`) + dead numeric-key branch (utils :42-50) as FROZEN contracts in Gaps; request-backend candidates (real ad keywords API).
- [x] Task 1: Behavior lock (AC: #1) — baseline `npx vitest run "src/app/(dashboard)/analytics/cross-reference"` **51/5-files** (22+17+4+6+2; ZERO legacy pins — recon-verified). LOCK (recon §4-5 authoritative): join nmId + `^sku:(\d+)$` regex; defaults (14d range hydration-safe, ad sort_by=spend desc limit=500, merged default adSpend DESC); channel enum both/organic/ad (:79); Jaccard pseudo-keywords ≥3 chars + top-20 overlapPct DESC; Pearson (n≥3, zero-variance null, clamp); cannibalization thresholds 70/40 + P75/median (both-channel only); scatter axes (X=totalOrders, Y=adSpend ₽, Z=adClicks 40-400); nulls-last sort ×6 columns; AP#8 adRevenue null→«—» while organic→0; export filename+gating; RequireJam standard gate.
- [x] Task 2: Token migration (AC: #1) — channel triplets: CrossReferenceTable chips (green/blue/purple-100/800/300 :31-35; SortButton import :18) + OverlapSummaryCards (:45-60) + OrganicVsAdScatter hex (:25-27) → single-source route channel map (organic=status-success, ad=status-information, both=muted/violet→chart-N? decide: categorical chart-1/2/3 for scatter + status chips for tables — document); overlap chips (red/amber/green-100/800/300 :134-149, thresholds 75/40) → status-error/warning/success /15+/30; CannibalizationAnalysis RISK_STYLES (:33-43 red/amber/green + 🔴🟡🟢 emoji risk icons — REPLACE emoji with lucide icons per canon, text labels stay) + risk cards (:61,64 light-only pairs) + ShieldAlert amber → status triplets /15+/30; CorrelationBadge (PositionSpendChart :87-92 gray/amber/red; NOTE badge has TWO band sets — labels 20/40/60/80 AND colors 30/60 — both diverge from util; unify on util) → muted/status-warning/status-error; InsightsCards amber → status-warning; 3 CustomTooltip `bg-white` (:61/:75/:73 — one lives in the doomed orphan) → bg-popover canon; PageContent h1 text-3xl text-gray-900 (:131) → text-2xl font-semibold text-foreground (170.3 canon); grid/axis #9CA3AF → chart-axis/border.
- [x] Task 3: AC-2/RTC gap-closing (the real work):
  - [ ] **One-source partial** (AC-2 FAIL today, :63-65 || merge): split isLoading/isError per source; one source failed → destructive banner names the failed source + the working source's data REMAINS rendered (169.12 coexistence pattern); «no relationship» never inferred from failed side (banner wording explicit). ⚠️ E2E-RUN-ONLY CONSTRAINT (validator C1): both-fail case MUST keep the FULL ErrorState path with EXACT texts «Не удалось загрузить данные» + «Повторить» (CrossReferenceStates :31,33; e2e spec :162-181 pins them) — one-source banners are ADDITIVE, never replacing both-fail
  - [ ] **THIRD query disposition** (validator C2): `searchByQueryQuery` (:53, groupBy=query) is OUTSIDE the current error model (:63-65 check only 2 queries) — its failure silently hides AdOrganicOverlapTable (:107 guard). Disposition: section-level non-destructive banner on the overlap card when query-level fails while product-level works (same coexistence idiom); both-fail still full ErrorState
  - [ ] **Selected chart point** (RTC unimplemented): OrganicVsAdScatter + PositionSpendChart onClick → selected point detail (nmId/product, X/Y/Z values at tooltip precision) rendered as text line under chart + clearable; keyboard equivalent = existing tabular evidence (pin the path)
  - [ ] **Correlation taxonomy unified**: PositionSpendChart local labels (:66-73, thresholds 20/40/60/80 «Заметная» etc.) DIVERGE from util interpretCorrelation (0.2/0.4/0.6/0.8 «Умеренная») — lock to UTIL as single source (chart consumes it); document choice
  - [ ] **SortButton extraction** (CrossReferenceTable :14 imports from FORBIDDEN search tree): copy into route-owned `components/SortButton.tsx` with attribution comment; search tree untouched
  - [ ] **Orphan ProductScatterChart DELETE** (159 lines, 0 production consumers — recon grep; holds 3 hex + emoji legend; ProductNameCell precedent 169.12) + delete its patterns from any doc comments
  - [ ] Per-section empty texts («Недостаточно данных») preserved + distinct from no-overlap EmptyState
- [x] Task 4: Guards + tests (AC: #1-3) — recursive no-palette/no-hex (170.1 3-branch canon) + pinned file count + runtime negatives (no bg-white tooltips; SortButton NOT imported from search tree — absence pin); POST-DELETION ACCOUNTING (validator E2): orphan deletion removes ~8 legacy sites (~2 #9CA3AF + 3 hex + bg-white + emoji legend) — guard pins BOTH deleted-file absence AND remaining-tree cleanliness (no double-count credit); token pins (channel map single-source, overlap/risk chips); one-source-partial tests (search ok + ad fail → banner + table present; vice versa); selected-point tests (click → detail line + values + clear; approach per validator E3: NO chart tests exist today — mock ResponsiveContainer or stub container width for jsdom, declare in test header); taxonomy-unification pin (PositionSpendChart consumes interpretCorrelation — source-contract); cannibalization threshold pins exist in utils tests (preserve); sr-only/tabular evidence path pin; e2e cross-reference.spec.ts palette-safe (pins headings/sm:grid-cols-3/recharts-scatter-chart — PRESERVE those layout classes!) — run on branch.
- [x] Task 5: Validation + multi-pass fresh review + PR + cleanup (AC: #4-9) — scoped **78/8** (51 baseline + 27 growth); full **19 180/0** (floor 19 154, +26); lint 0/0; tsc 0; max-lines OK; build 0; **e2e ON BRANCH 7✓/5↓(Jam-gate)/0✗**. Reviews (3-pass — Trigger fired): r1 opus APPROVE (1 MEDIUM + 3 LOW → r1-fixes applied but DEFECTIVE); r2 opus **REQUEST_CHANGES** (r1-F1 cosmetic — contradiction moved + comment laundered it; r1-F3 vacuous regex — double-escaped dots never matched) → REAL fixes `2a140803` (conditional banner wording hasRows-ternary + EmptyState composite + composite test; single-escaped RELATIVE_BYPASS + positive self-test); r3 opus verification **APPROVE** (both fixes PASS all sub-checks). CE: 17-file diff; search/advertising trees + hooks/lib zero-diff. PR #247 merged `d1bb947e`; branch remote/local + worktree deleted, 0/0/0 absence proofs.

## Dev Notes

### Owned surface & scope

- Owned: cross-reference/** (18 files). READ-ONLY (C2/FS): useSearchOrders + useAdvertisingAnalytics hooks, advertising/search normalizers + types, `@/lib/csv/cross-reference-csv-export` (lib-resident, route-named — treat read-only; if palette-free, no touch), DateRangePickerExtended, ExportCsvButton, RequireJam, ui primitives. **FORBIDDEN: advertising + search route trees (incl. their SortButton — hence extraction).**
- Legacy total: ~40 sites across 9 files (3 chart-hex constants, 3 tooltip bg-white, 12 chip-triplets, 6 channel configs, 2 risk cards, amber ×2, gray-900 ×1, #9CA3AF ×5). Baselines: owned 51/5; full floor **19 154/0**. Node 24.18.0/npm 11.11.0.

### Canon mapping

- status /15+/30 chips (169.5); categorical chart-1/2/3 scatter + valence where semantics demand (170.1); bg-popover tooltips (168.10+); chart-axis/border (169.4); one-source coexistence (169.12 error-retention); orphan deletion (169.12 ProductNameCell); h1 text-2xl foreground (170.3); taxonomy single-source (170.1 lib-classification lesson); guard canon 170.1-170.5.

### References

- [Source: epics-166-174 §Story 170.6 + §C1-C11]
- [Source: `.omx/plans/170.6-migrate-advertising-organic-cross-reference-analytics.md`]
- Recon §8 red flags → Gaps/request-backend (pseudo-keywords, organic_contribution semantics)

## Dev Agent Record

### Agent Model Used

- Implementation: executor (sonnet) via orchestrator (migration `fb3f3364`); orchestrator-applied fix rounds: r1 `9bfad1ac` (DEFECTIVE — caught by r2), r2 `2a140803` (real fixes). Reviews: 3× code-reviewer (opus fresh) — APPROVE / REQUEST_CHANGES / APPROVE-verify.

### Debug Log References

### Completion Notes List

- Migration `fb3f3364` (17 files: +5 A, −1 D, M11; +880/−277): NEW channel-styling.ts (single-source: organic=status-success, ad=status-information, both=neutral-muted chips + categorical chart-1/2/3 scatter fills — decision documented in header); NEW SortButton.tsx (byte-identical copy from forbidden search tree + attribution; search untouched — r1-verified); orphan ProductScatterChart DELETED (159 lines, 0 refs — absence-pinned both ways).
- AC-2 closed: per-source error split (full OUTER join renders surviving source's rows as real organic/ad rows — r1-verified); SourceErrorBanner names failed source + explicit «no relationship inferred» clause; third-query section banner (page intact); BOTH-fail ErrorState byte-preserved (e2e run-only).
- Round-2 F1 (the story of this story): banner wording CONDITIONAL (hasRows ? «и отображены ниже» : «но данных за выбранный период нет») + EmptyState composite for oneFailed+empty; r1's !oneFailed exclusion was cosmetic — banner alone falsely promised data below; comment laundered it (r2 caught both).
- Round-2 F3: RELATIVE_BYPASS single-escaped (r1 double-escaped = literal-backslash vacuous guard); positive self-test (hex-guard pattern) proves the guard catches real bypasses; attribution-comment false-positive safe (withoutComments strips).
- Taxonomy unified: interpretCorrelation exported {label, badgeClassName} — util single-source (local «Заметная» ladder deleted; label thresholds were numerically identical, WORDS diverged); new tint bands |r|<0.4 muted / 0.4-<0.8 warning /15+/30 / ≥0.8 error /15+/30.
- Selected point: both scatters onClick → detail line (nmId/vendorCode/X/Y/Z tooltip precision) + «Сбросить»; scatter tests mock ONLY ResponsiveContainer (cloneElement width stub), click REAL recharts SVG symbols — approach declared in header.
- Guards (18): recursive real-tree walk file-count 14 (self-verifying); orphan absence; SortButton alias+relative absence; bg-white negative; channel-map single-source consumption; taxonomy source-contract; sm:grid-cols-3 e2e-pin preserved.
- Emoji 🔴🟡🟢 risk icons → lucide; h1 → text-2xl font-semibold; 2 tooltips → bg-popover canon.

### Gaps

- e2e substring-collision risk (SourceErrorBanner starts with pinned ErrorState substring «Не удалось загрузить данные») — future one-source e2e must use exact-string or full ErrorState text (r1-L2; e2e run-only — note for next spec touch).
- Task-0 frozen contracts: pseudo-keyword extraction (product_name words ≠ real ad keywords — request-backend candidate for real ad-keywords API); organic_contribution/totalOrders SEMANTIC-ZERO (170.1 #236 disposition); dead numeric-key branch (119.1 defense).
- Visual/dark-mode pass → 174.3.
- CHANNEL_LABELS local long-form duplication (r1-L4 — documented, acceptable).

### File List

Diff 9ec8f783..HEAD = **17 files** (5 A: channel-styling.ts, SortButton.tsx, contracts-guard, partial-source.test, scatter-selected-point.test; 1 D: ProductScatterChart.tsx; 11 M). Exact: `git diff --name-status 9ec8f783..HEAD`.

### Change Log

| Date | Change |
|---|---|
| 2026-08-26 | Story created from deep recon (18 files; AC-2 one-source FAIL found; selected-point unimplemented; SortButton forbidden-import; orphan chart; taxonomy divergence; ~40 legacy sites). Plan referenced as authoritative. |
| 2026-08-26 | Validation PASS-WITH-FINDINGS → 2 CRITICAL applied (e2e both-fail texts run-only constraint; THIRD query searchByQueryQuery outside error model → section-banner disposition) + 4 ENHANCEMENTS (line-drift corrections; post-deletion guard accounting; selected-point jsdom approach; emoji→lucide) + worktree-name aligned to plan. Task-0 disposition SOUND (totalOrders=TRUE-zero — merge gated on search success). |
| 2026-08-26 | Post-Nth-pass reviews ×3: r1 APPROVE → fixes applied (DEFECTIVE); r2 REQUEST_CHANGES (r1-F1 cosmetic-laundered, r1-F3 vacuous regex) → REAL fixes `2a140803`; r3 verification APPROVE. Status: ready-for-dev → review. |
| 2026-08-26 | Implemented + merged: PR #247 (impl `fb3f3364` + r1-defective `9bfad1ac` + r2-real `2a140803` + story `ca62e94d`, merge `d1bb947e`); scoped 78/8, full 19 180/0 (+26), e2e-on-branch 7/5↓/0; 3×opus trail; cleanup 0/0/0. Status: review → done. **Lessons:** (1) Фикс без изменения текста-обещания = косметика: противоречие переехало, комментарий «отмыл» — r2 поймал. (2) Двойной эскейп точки в regex = бэкслэш: вакуум-гард; позитивный self-test обязателен. (3) Комментарий о несуществующем поведении хуже его отсутствия. |

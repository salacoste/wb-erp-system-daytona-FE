# Story 170.3-FE: Migrate Brand Margin Analytics

Status: review — implementation + round-1 hardening on branch; PR/merge/cleanup pending

## Story

As an owner/finance user, I want `/analytics/brand` to compare margin by brand with filters, summaries, storage context, missing-COGS disclosure, and export, so that I can identify brand-level profitability drivers.

Plan: `.omx/plans/170.3-migrate-brand-margin-analytics.md` (authoritative — branch `cdx/epic-170-story-3-brand-margin-shadcn`, worktree `/private/tmp/wb-repricer-fe-170-3-brand-shadcn`). Small story (3 owned source files, ~343 lines) — page is a composition of read-only shared pieces + owned table/help.

## Acceptance Criteria

1. **Given** brand margin data, cabinet expenses, and current filters, **when** migrated, **then** brand grouping, margin/revenue/cost definitions, storage comparison, COGS coverage, totals, sort/page, export scope, and navigation preserve current behavior.
2. **Given** missing COGS, valid zero, negative margin, filtered-empty, stale/partial expenses, unavailable storage comparison, or export failure, **when** rendered, **then** limitations and full-precision financial meaning remain explicit.
3. **Given** keyboard/touch or narrow layout, **when** a brand row, filter, help section, or export is used, **then** brand identity, primary margin metric, units, action, selection/filter scope, and feedback remain reachable.
4. Plan/delivery ACs: see plan.

## Tasks / Subtasks

- [x] Task 0: NONE — VALIDATED: normalization = useMarginAnalyticsByBrand → mapBrandItem (src/hooks/useMarginAnalyticsByBrand.ts:149-193); FR-2..5 `?? null` preserved with comment, roi/profit_per_unit null with documented FE-recompute, no enum lies, qty vs total_skus distinct (2026-02-23 fix intact). Disposition-OK, no preface.
- [x] Task 1: Behavior lock (AC: #1-2) — baselines: route vitest **26 = page 20 + BrandHelpSection 6** + colocated `src/components/custom/MarginByBrandTable.test.tsx` **24** (total 50; ZERO legacy pins in all 3 owned test files — validator-enumerated empty, record zero-pins instead of hunting). Lock: drill-down `/analytics/sku?brand=` (page.tsx:32-33 handleDrillDown); single-week `{week}` vs range `{weekStart,weekEnd}` params (Contract #219 comment:37-39 — range-mode v1 may null FR-2..5); comparison params pass-through; includeCogs/includeAds/includeStock flags; `calculateMarginStats(data.data, cabinetExpenses)` read-only; sort via SHARED MarginAggregatedTableHeader (preserve — NOT owned); ExportDialog defaultType="by-brand" + week defaults; empty-data branches (page:154-160 AND table:73-79 — distinct from each other? verify both exist intentionally). C4 owned-matrix is THIN: missing-COGS banner / storage-comparison / export-failure / stale-expenses / negative-margin-badge ALL live in read-only shared compositions → disposition N/A-owned with pointers (banner: shared; StorageComparisonCard: shared; MarginBadge in shared Row: shared; ExportDialog: shared) — record evidence.
- [x] Task 2: Token migration (AC: #1) — page.tsx:74 h1 `text-3xl font-bold tracking-tight` → `text-2xl font-semibold` (169.9/169.10 canon); BrandHelpSection 8 blue class-sites on 7 lines (`:11 border-blue-200 bg-blue-50`, `:13/:15 text-blue-900`, `:18/:25/:32/:39 text-blue-800`) → info-panel: `border-status-information/30 bg-status-information/15` + `text-foreground` body / strong lead (169.10 foreground-on-tint AA lesson; heading-strength via font, not blue-900); MarginByBrandTable:73-79 empty-state `border-gray-200 bg-gray-50` + `text-gray-600` → `border-border bg-muted` + `text-muted-foreground` (mirror page.tsx:157-158 exactly).
- [x] Task 3: RTC/AX (AC: #3) — owned table gains static `<TableCaption>` («Таблица маржинальности по брендам» — names the analysis per epic RTC WITHOUT verbatim-duplicating adjacent CardTitle/h1 — validator E-3; picker-semantic 169.7); `tabular-nums` on owned Table wrapper (font-variant INHERITS into shared Row cells — verify no shared-cell override); scroll-region (tabIndex+aria-label); verify shared Header sort UI untouched; help section reachable without tooltip ✓ (static text — pin).
- [x] Task 4: Guards + tests (AC: #1-3) — no-palette/no-hex source-contract over the 3 owned files (170.1 3-branch canon; «#219» contract-ref in comment = prose-exempt — self-test); token pins (help panel classes, table empty-state); caption/tabular pins; empty-state ×2 distinct pins; drill-down URL pin; h1 text-2xl pin. Legacy pins: ZERO (validator-enumerated) — record; do NOT change empty-state wording «Нет данных за выбранную неделю» (double-suite pin: table test + e2e BRAND_EMPTY_TEXT).
- [x] Task 5: Validation + 2-pass fresh review + PR + cleanup (AC: #4-9) — owned 62/0 (26+24+guard 12); full **19 098/0** (floor 19 086, +12 exact); lint 0/0; tsc 0; max-lines OK; build 0; **e2e ON BRANCH 12✓/1↓/0✗** (clean first run). Round-1 opus APPROVE (3 LOW guard-hardening → all applied `11e4a618`: cwd-safe import.meta.url paths — transient ENOENT path bug caught+fixed in-commit, trailing-comment strip, weak-pin dropped); round-2 opus **APPROVE — merge gate PASSED** (3 cosmetic LOWs, non-blocking). CE: 4-file diff, shared/** + ExportDialog + Aggregated* + CategoryTable zero-diff.

## Dev Notes

### Owned surface & scope

- Owned: `brand/page.tsx` (167), `brand/components/BrandHelpSection.tsx` (47), `src/components/custom/MarginByBrandTable.tsx` (129) + their tests (page.test 305 lines, BrandHelpSection.test, colocated MarginByBrandTable.test — NOT in __tests__/). MarginByBrandTable exclusive to brand route ✓ (Aggregated* mention it in COMMENTS only; they're shared with category route = 170.5 surface).
- READ-ONLY (C2/FS): `analytics/shared/**` (useMarginPageState, MarginFilterSection, MarginSummaryCards, StorageComparisonCard, MarginMissingCogsBanner, MarginPageStates, calculate-margin-stats), ExportDialog, MarginAggregatedTableHeader/Row, margin-aggregated-table-sorting, SummaryComparison, MarginRowCells, MarginDisplay, useMarginAnalytics hooks, margin-trends-normalizer, @/types/api.
- Legacy total: 12 sites in 3 files (h1 size + 8 blue + 3 gray). Baselines: owned tests ~50 (26 route + 24 table — validator reconciles exact); full floor **19 086/0**. Node 24.18.0/npm 11.11.0.

### Canon mapping

- h1→text-2xl (169.9/169.10); info-panel status-information/15+/30 + foreground text (169.10 AA, 169.3 link precedent); empty-state muted mirror (page's own :157); static TableCaption picker-semantic (169.7); tabular-nums inherited (169.x); guard canon 170.1-170.2.

### References

- [Source: epics-166-174 §Story 170.3 + §C1-C11]
- [Source: `.omx/plans/170.3-migrate-brand-margin-analytics.md`]
- Memory: qty-vs-total_skus semantics (fixed 2026-02-23); Contract #219 range-mode nullability

## Dev Agent Record

### Agent Model Used

- Implementation: executor (sonnet) via orchestrator (migration `5891b462`) + orchestrator-applied round-1 hardening (`11e4a618`); reviews: 2× code-reviewer (opus fresh) — APPROVE / APPROVE (merge gate PASSED).

### Debug Log References

### Completion Notes List

- Migration `5891b462` (4 files, +206/−14): h1 text-3xl→text-2xl font-semibold; BrandHelpSection 8 blue sites → border-status-information/30 bg-status-information/15 + text-foreground body (heading-strength via font, 169.10 AA); table empty-state → border-border bg-muted text-muted-foreground (mirror page:157; wording «Нет данных за выбранную неделю» FROZEN — double-suite pin table-test+e2e).
- Owned table: static TableCaption «Таблица маржинальности по брендам» (epic RTC wording, NOT verbatim-duplicating CardTitle); tabular-nums on owned Table wrapper (inheritance verified — zero font-variant overrides in shared cells); scroll-region via REAL ui/table props (scrollContainerTabIndex/AriaLabel — reviewer-verified, not invented).
- Guard (12 tests, colocated with table): no-palette/no-hex 3-branch canon + #219 prose-exemption self-test; token/caption/tabular/empty-state×2-distinct/drill-down/h1 pins; composition pins for shared pieces (banner/card exact JSX + negative no-restyle). Round-1 hardening: import.meta.url-anchored cwd-safe paths; trailing-comment strip; weak blue-\d00 pin dropped (LEGACY_PALETTE covers 950).
- Task-0 disposition VALIDATED: mapBrandItem (hooks/useMarginAnalyticsByBrand:149-193) — FR-2..5 ?? null preserved, no enum lies, qty vs total_skus distinct (2026-02-23 fix intact). No preface.
- C4 thin-matrix honestly dispositioned in guard header: missing-COGS banner / StorageComparisonCard / MarginBadge / ExportDialog / stale-expenses — all shared read-only, N/A-owned with pointers.

### Gaps

- withoutComments trailing-strip is tokenizer-unaware — a future string containing " // " in an owned source would be mis-stripped (round-2 LOW; not triggerable today, boundary documented).
- Dark-mode visual pass → 174.3 (e2e text/role pins only; no palette assertions possible headless).

### File List

Diff e8220456..HEAD = **4 files** (M page.tsx +5/−3; M BrandHelpSection +16/−7; M MarginByBrandTable +18/−4; A MarginByBrandTable.source-contracts.test.tsx). Exact: `git diff --name-status e8220456..HEAD`.

### Change Log

| Date | Change |
|---|---|
| 2026-08-25 | Story created from direct source read (3 owned files; exclusivity verified — Aggregated* are shared-with-category via comments only; thin owned C4 matrix documented honestly). Validation PASS-WITH-FINDINGS (0 criticals; Task-0 disposition-OK — no preface; counts 20+6+24; zero legacy pins). Plan referenced as authoritative. |
| 2026-08-25 | Round-1 guard hardening applied (cwd-safe paths, trailing comments, weak-pin drop). Status: ready-for-dev → review. |

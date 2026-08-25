# Story 170.5-FE: Migrate Category Margin Analytics

Status: done — PR #245 merged (`19009e3d`); 2-pass fresh review APPROVE/COMMENT-merge-clean; e2e on branch 6/1↓/0; cleanup 0/0/0

## Story

As an owner/finance user, I want `/analytics/category` to compare margin by category with filters, summaries, storage context, missing-COGS disclosure, and export, so that I can identify category-level profitability drivers.

Plan: `.omx/plans/170.5-migrate-category-margin-analytics.md` (authoritative — branch `cdx/epic-170-story-5-category-margin-shadcn`, worktree `/private/tmp/wb-repricer-fe-170-5-category-shadcn`). **Direct mirror of 170.3** (brand) — same diff shape, same shared compositions; brand table already carries the 170.3 additions, category table does NOT.

## Acceptance Criteria

1. **Given** category margin data and active context, **when** migrated, **then** category grouping, totals, margin/revenue/cost definitions, storage comparison, COGS coverage, filter/sort/page, export, and navigation semantics remain unchanged.
2. **Given** missing COGS, negative/zero values, filtered-empty, stale/partial expenses, unavailable comparison, unknown category, or export failure, **when** rendered, **then** each condition has truthful labels and full precision.
3. **Given** narrow, touch, keyboard, or zoom use, **when** a category row/filter/help/export action is used, **then** category identity, primary margin metric, units, current sort/filter scope, and feedback remain reachable.
4. Plan/delivery ACs: see plan.

## Tasks / Subtasks

- [x] Task 0: NONE — VALIDATED with ASYMMETRY NOTE: mapCategoryItem (:149-203) differs from mapBrandItem by design — string `_rub` fields parsed via parseFloat, `revenue_net: parseFloat(item.revenue_net_rub || '0')` (missing→0 coercion — CATEGORY API shape), `qty: total_units ?? sku_count` fallback, `total_skus ← sku_count` (2026-02-23 memory confirmed), `category ← subject_name`; FR-2..5 mirror-clean ?? null. ALL FROZEN read-only — do NOT "normalize" toward brand's numeric shape (behavior change).
- [x] Task 1: Behavior lock (AC: #1-2) — baselines: route vitest **30** (page + CategoryHelpSection) + colocated `src/components/custom/MarginByCategoryTable.test.tsx` **22** (total 52). Lock (mirror 170.3): drill-down `/analytics/sku?category=` (page drillDownParam); #219 single-week/range params; `entityField="category"` + **`entityFallback="(Без категории)"` — the epic-AX unknown-category NEUTRAL fallback EXISTS (table :99) — PIN IT**; sort via shared MarginAggregatedTableHeader (compareAggregatedItems entity 'category'); ExportDialog defaultType="by-category" (:94, validator-confirmed); entity declensions «категориям»/«категорий» (:140-141) untouched; empty-state ×2 (page null + table []); shared C4 pieces (banner/storage/badge/export) dispositioned N/A-owned with pointers.
- [x] Task 2: Token migration (AC: #1) — EXACT mirror of 170.3: page h1 `text-3xl font-bold tracking-tight` → `text-2xl font-semibold` (brand page.tsx:74 post-170.3 = the literal target); CategoryHelpSection 9 blue sites (:11 border-blue-200 bg-blue-50; :13/:15 blue-900; :18/:25/:32/:39/:46 blue-800 — one MORE than brand, at :46) → `border-status-information/30 bg-status-information/15` + `text-foreground` (heading-strength via font); table empty-state :75-76 → `border-border bg-muted` + `text-muted-foreground` (mirror brand's post-170.3 :75-77, wording «Нет данных за выбранную неделю» FROZEN).
- [x] Task 3: Table additions (AC: #3 — the 170.3 delta this table LACKS): `<TableCaption>Таблица маржинальности по категориям</TableCaption>`; `tabular-nums` on Table className; scroll-region `scrollContainerTabIndex={0}` + `scrollContainerAriaLabel="Таблица маржинальности по категориям"` — mirror brand Table element verbatim (sticky-first-column preserved).
- [x] Task 4: Guards + tests (AC: #1-3) — MIRROR `MarginByBrandTable.source-contracts.test.tsx` (170.3, import.meta.url-anchored cwd-safe paths + r1-hardened): no-palette/no-hex over 3 owned files (#219 prose-exempt self-test; CategoryHelpSection.test.tsx:7 doc-comment «blue color scheme» goes STALE post-migration — update it); token pins (help pair, empty-state, h1); caption/tabular/scroll pins; entityFallback pin (AX); drill-down URL pin; empty ×2 distinct. Mirror-guard baseline CORRECTED (r1-L1): brand guard = 12 tests actual (not ≈18 as planned); shipped category mirror = 13 (12 + story-mandated entityFallback AX pin).
- [x] Task 5: Validation + 2-pass fresh review + PR + cleanup (AC: #4-9) — owned **65/0** (route 30 + table 22 + guard 13); full **19 154/0** (floor 19 139, +15); lint 0/0; tsc 0; max-lines OK; build 0; **e2e ON BRANCH 6✓/1↓/0✗** (category-analytics.spec 162.6 — clean first run; margin-analytics.spec N/A — zero category coverage). Round-1 opus APPROVE (1 MEDIUM honest-comment + 2 LOW story-corrections → applied `37e6dc20`); round-2 opus **COMMENT — merge-clean** (header-Status flip + optional guard-header note → applied at reconciliation). CE: 5-file diff; brand/shared/hooks/ExportDialog zero-diff (r2-verified). PR #245 merged `19009e3d`; branch remote/local + worktree deleted, 0/0/0 absence proofs.

## Dev Notes

### Owned surface & scope

- Owned: `category/page.tsx` (~168), `category/components/CategoryHelpSection.tsx` (~50), `src/components/custom/MarginByCategoryTable.tsx` (129) + their tests (page.test, CategoryHelpSection.test, colocated MarginByCategoryTable.test — NOT in __tests__/). Table exclusive to category route ✓ (shared Header/Row mention it in comments only — 170.3-validated pattern).
- READ-ONLY (C2/FS): `analytics/shared/**`, ExportDialog, MarginAggregatedTableHeader/Row, margin-aggregated-table-sorting, SummaryComparison, MarginRowCells, MarginDisplay, useMarginAnalyticsByCategory hook (Task 0 read-only), @/types/api, **brand route + MarginByBrandTable (170.3 surface)**.
- Legacy total: 13 sites in 3 files (h1 size + 9 blue + 3 gray). Baselines: 52 owned tests; full floor **19 139/0**. Node 24.18.0/npm 11.11.0.

### Canon mapping

- ALL from 170.3 (this story IS its mirror): h1→text-2xl; status-information/15+/30+foreground help panel; muted empty-state mirror; TableCaption picker-semantic; tabular-nums inherited; scroll-region REAL ui/table props; guard canon 170.1-170.3 (import.meta.url cwd-safe + trailing-comment strip + contract-based pins).

### References

- [Source: epics-166-174 §Story 170.5 + §C1-C11]
- [Source: `.omx/plans/170.5-migrate-category-margin-analytics.md`]
- [Source: 170.3 implementation — `_bmad-output/implementation-artifacts/170-3-fe-migrate-brand-margin-analytics.md` + merged files (PR #241)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Gaps

- e2e empty-text pin for category (category-analytics.spec has none; e2e outside owned surface) — carry-out, dedicated test PR (#222 precedent).
- LEGACY-PIN-COUNT header paragraph intentionally NOT mirrored from brand guard (was an unaudited meta-claim; omission safer — r1-L2).

### File List

### Change Log

| Date | Change |
|---|---|
| 2026-08-26 | Story created from direct read + brand-diff (perfect 170.3 mirror + the Caption/tabular/scroll delta the category table lacks; entityFallback unknown-category AX already exists — to pin). Plan referenced as authoritative. |
| 2026-08-26 | Round-1 fixes: guard empty-freeze comment made honest (source-pinned only — e2e empty-pin carry-out, #222 precedent); guard-count attestation corrected 13-actual vs ≈18-planned; LEGACY-PIN-COUNT paragraph omission (vs brand header) documented as intentional. Status: ready-for-dev → review. |
| 2026-08-26 | Implemented + merged: PR #245 (impl `aab00630` + r1 `37e6dc20` + r2-note `cea7c7dc` + story `e1c29bbd`, merge `19009e3d`); owned 65/0, full 19 154/0 (+15), e2e-on-branch 6/1↓/0; 2×opus APPROVE/COMMENT-merge-clean; cleanup 0/0/0. Status: review → done. **Lessons:** (1) Mirror-стори обязана сверять ЧИСЛА зеркала (guard 12, не ≈18) — аттестация до ревью, не после. (2) Header-Status и Change-Log строка должны флипаться одним действием — r2 поймал рассинхрон. (3) Существующий фолбэк («Без категории») = готовый AX-объект: запинь, не изобретай. |

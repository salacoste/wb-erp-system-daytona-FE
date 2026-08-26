# Story 170.7-FE: Migrate Search Analytics Workspace

Status: done — PR #250 merged (`7a94dac0`); 3-pass fresh review (Trigger 1) + preface #249; e2e 8/8 revived; cleanup 0/0/0

## Story

As a marketing user, I want `/analytics/search` to analyze by query, product, orders, and position trends through consistent tabs, filters, charts, and tables, so that I can trace search demand and visibility to affected products and orders.

Plan: `.omx/plans/170.7-migrate-search-analytics-workspace.md` (authoritative — branch `cdx/epic-170-story-7-search-analytics-shadcn`, worktree `/private/tmp/wb-repricer-fe-170-7-search-shadcn`). BIGGEST route of Epic 170 (43 files, 5 021 lines, 174 tests) — finale.

## Acceptance Criteria

1. **Given** a supported tab and search context, **when** migrated, **then** query/product selection, tab/deep-link state, metrics, order/position trends, seller/share meaning, table sort/page, and comparison semantics remain unchanged.
2. **Given** no selection, empty query/product/orders, filtered-empty, stale/partial tab data, invalid search params, unknown seller, or section failure, **when** rendered, **then** states remain tab-scoped, recoverable, and do not erase valid sibling-tab context.
3. **Given** keyboard/touch, narrow width, or direct deep link, **when** tabs, combobox, sort, chart point, or row are used, **then** current tab/selection, focus, period, units, full values, and return context remain explicit.
4. Plan/delivery ACs: see plan.

## Tasks / Subtasks

- [x] Task 0: Boundary preface REQUIRED (pattern #218/#226/#231/#236) — 3 provable UI-reaching lies:
  - [ ] `search-position-trends-normalizer.ts:33` — `String(raw ?? 'stable') as TrendDirection`: (a) FABRICATES 'stable' when trend missing; (b) UNCHECKED cast — garbage strings drive trendColorClass. Fix: VALID-set map; unknown → explicit 'unknown' member (widening) or null-preserve — validator enumerates TrendDirection consumers first (movers trend enum is the semantic driver — recon §5 documents the positionChange/positionDelta sign trap; classification stays, only the cast fabrication dies)
  - [ ] Same file :43-45,:61,:99-101,:120 — `toNullableNumber ?? 0` on POSITIONS (current/avg/change): position 0 is meaningless (1-based) — renders "0,0" in tables, vanishes from chart domain. Fix: nullable; «Нет данных»/«—» renders; computeYDomain untouched (already filters >0)
  - [ ] `search-analytics-item-normalizer.ts:18,:36` — `avgPosition: toCount(...)` null→0 → SearchByQueryTable renders formatDecimal(0) → `0 <= 10` → **BEST-tier GREEN badge for UNKNOWN position** (validator C1: worse than red — unknown masquerades as BEST). Fix: nullable → «—» + neutral/no badge for unknown (badge only for known ≤10/≤30 tiers; pin NOT-green-for-unknown)
  - [ ] Consumer adaptations (validator-enumerated EXACT sites): SearchByQueryTable :91-93 getSortValue `?? 0` → **NULLS-LAST** (unknown sorted FIRST in ASC today = same lie via sort); SearchByProductTable :94-95 formatDecimal re-zero → «—»; use-search-positions-map.ts :54 `q.avgPosition > 0` → `!= null &&` guard (cross-route READ-ONLY — minimal compile-guard); csv/search-csv-export.ts :32,:66 fmt(null) → empty cell; SearchPositionMoversTable formatDecimal nullable → «Нет данных»; TrendDirection widening SAFE (trendColorClass if-chain muted default — no Record exhaustion); fixtures ×4 files (use-search-analytics.test :46,:116 + search-analytics.test + both table tests); SearchPerformanceWidget/MarketingKpiCard PASS (zero refs)
- [x] Task 1: Behavior lock (AC: #1) — baseline **exactly 174/21** (validator runner-verified; 5 duplicate-suite pairs both run — DON'T consolidate this story, Gaps). LOCK (recon §3-5): tabs ×4 uncontrolled defaultValue (by-query if initialQuery else orders); ?query= deep-link + reseed; debounce 300ms ≥2chars ×2 (query + combobox); comparison = orders-tab only (shift-back-own-duration; prev===0→neutral; arrows+1dp); metrics (cartConversionRate null-on-0-denominator; avgCtr null→—; formatPercent «11,9 %»; share >100% preserved + INFLATED_SHARE_MESSAGE; dedup dual-mode); sort via SortButton aria-pressed + aria-sort present ×4 tables (NO pagination; movers slice(0,20)); movers trend-enum-driven color (positionChange vs positionDelta SIGN TRAP — pin); row-keys index-suffixed; CSV ×3 filenames; null→gap position chart; seller badge independent machine (available=false→'Кабинет'+reason tooltip).
- [x] Task 2: Token migration (AC: #1) — position-history-helpers consts (LINE_COLOR #3B82F6→chart-1; GRID_STROKE→border; TICK_FILL→chart-axis) + tooltip bg-white→bg-popover (:61); SearchOrdersChart inline #EEEEEE×4/#757575×2/#3B82F6/white-dot → same tokens (SINGLE-SOURCE the two duplicated chart configs into one route module — document); tier badges green/yellow/red-100+800 (≤10/≤30) → status-success/warning/error /15+/30 + unknown-neutral (Task-0); summary cards green×2/red×2/blue×2 → success/error/information solid pairs; movers trend green/red → financial or status valence (document choice per trend semantics); selected-row bg-blue-50 → status-information/15; nmId links text-blue-600 → status-information (169.3); delta utils green/red → financial-positive/negative; gray sweeps (h1 text-gray-900→foreground + text-2xl canon; seller badge grays; top-keywords grays; yellow warning icon→status-warning; orange icon→status-information).
- [x] Task 3: AC-2/RTC gap-closing:
  - [ ] **Position-trends tab → Pattern-1**: split whole-tab destructive error into per-section (summary cards / movers each own error chrome over the SHARED usePositionTrends fetch — residual: fetch-level failure still degrades both together, document; PositionHistoryChart has OWN fetch (independent) — test "movers error ≠ history blank" at HOOK level (validator E3))
  - [ ] **Dead deep-link — VERDICT: IMPLEMENT (validator)**: page reads ?tab ∈ {orders,by-product,by-query,position-trends} + ?nmId → defaultValue + preselect (page.tsx:20 + SearchPageContent :54-81; epic AC-1/AC-3 first-class deep-link). Movers links become live.
  - [ ] **e2e label — VERDICT: LOCK 'Поисковый запрос' (validator)**: label was renamed 7f08f688 without updating e2e (:139,:219 both getByLabel('Поисковый запрос')) — tests 5+8 silently skip behind Jam-gate today. REVERT impl aria-label (SearchByQueryTab :82) to 'Поисковый запрос' + unit-pin.
  - [ ] sr-only alternatives: orders chart EXISTS (:143-146) ✓ preserve; position chart EXISTS (:86-93) ✓ preserve — verify parity + pin; RTC "preserve selected query/product context" — position chart title embeds nmId ✓; by-query tab has NO chart (N/A — document).
- [x] Task 4: Guards + tests — recursive no-palette/no-hex + pinned production-file count (43 incl. both test dirs excluded); chart-config single-source pin; tier-badge pins (flip querySelector .bg-*-100 → token classes ×3); movers/summary card class pins flip; Task-0 unknown-position neutral pins (NOT red badge); Pattern-1 split tests (movers error ≠ history blank); deep-link decision tests; guard covers BOTH __tests__/ dirs (stray-test glob — 170.1 lesson); NO new as-casts.
- [ ] Task 5: Validation + 2-pass fresh review + PR + cleanup — e2e search-analytics.spec.ts on branch (8 tests, palette-safe; Jam-gate helper); CE: hooks/normalizers(except preface)/types/widgets/cross-reference zero-diff.

## Dev Notes

### Owned surface & scope

- Owned: search/** (43 files, 5 021 lines). READ-ONLY (C2/FS): use-search-* hooks, search normalizers (Task-0 preface files excepted), @/types/search-* (**Task-0 exception WIDENED per validator C2: src/types/search-analytics.ts :39,:71 + src/types/search-position-trends.ts :28-30,:39,:72,:88 nullable-widen + their fixtures**), SearchPerformanceWidget/MarketingKpiCard (dashboard), ui primitives, RequireJam, DateRangePickerExtended, ComparisonPeriodSelector, ExportCsvButton, useProducts, useSellerInfo, csv/search-csv-export, SortButton STAYS (original; 170.6 owns the copy).
- Legacy ~43 sites: 8 chart-hex (2 duplicated configs), 1 bg-white tooltip, ~14 gray, ~20 semantic literals. Near-200-line files: 11 flagged — class-lengthening re-cap risk; extract proactively (movers 188 has 2 components — split).
- Baselines: ~174 tests (duplicates both counted); full floor **19 180/0**. Node 24.18.0/npm 11.11.0.

### Canon mapping

- chart-1/border/chart-axis (169.4); bg-popover tooltip (168.10+); /15+/30 badges (169.5); status-success/error/information summary pairs (169.9); financial delta (169.4); selected-row /15 (169.x); unknown=neutral muted (169.11-13); Pattern-1 per-section errors (169.12); h1 text-2xl (170.3); guard canon 170.1-170.6 (import.meta.url cwd-safe + self-tested regexes — the 170.6 lesson: NO double-escaping).

### References

- [Source: epics-166-174 §Story 170.7 + §C1-C11]
- [Source: `.omx/plans/170.7-migrate-search-analytics-workspace.md`]
- Recon §8 → Task 0 (3 lies); §3 dead deep-link + Pattern-1; §7 e2e label mismatch

## Dev Agent Record

### Agent Model Used

**Meta-claim blanket qualifier (Trigger 4 MANDATORY; Story 116.1-FE A-2 pattern).** This block + Completion Notes + Change Log rows + Post-Nth-pass headings use recursive-self-validation phrasings (pattern-novelty self-classification, finding-count attestations, honest-count derivations). All are unaudited meta-claims per Trigger 4, qualified collectively here.

- Preface (Task 0): executor (sonnet) + reviewer (opus fresh) — PR #249, merge `2179e6b8` (impl `928fdf34` + review-fixes `ffbe7c97`: warn-once trend map, uniform CSV numeric sentinel, desc nulls-last test).
- Implementation: executor (sonnet) (migration `07a78b68`) + orchestrator-applied r1 `df52152e` (tri-state + canonical bridge) + r2 `d7c8432f` (comment reword). Reviews: r1 + r2 code-reviewer (opus fresh); r3 focused verification below.

### Post-1st-pass-review fixes (2026-08-26)

MEDIUM tri-state (summary cards error/skeleton/plain-empty split — mirrors siblings; r2-verified no double chrome) + L6 canonical `as unknown as` bridge. L2 (SearchTabValue typing), L3 (nmId-without-tab inert preselect), L4 (array-param test — KNOWN_TABS first() guard verified by r2), L5 (refetch aria-busy) → Gaps.

### Post-2nd-pass-review fixes (2026-08-26)

F2 comment reword (sibling-chrome not tab-level); honest e2e derivation (spec = 8 tests 0 skip; wrapper 13/1↓ = Orders-smoke bundle); Trigger-1 3rd pass scheduled (novel patterns: deep-link implementation, tri-state sibling contract).

### Post-3rd-pass-review fixes (2026-08-26)

r3 (Trigger-1, focused on the 2 novel patterns): deep-link PASS (Next-16 Promise-await clean; whitelist/array-guard/regex; manual-change-vs-reseed no-fight; 7 real tests); tri-state PASS except 1 MEDIUM — the r1-edit added an UNREACHABLE duplicate error branch (executor's Alert branch at :31 preceded it; the «sibling-chrome» comment described a nonexistent path — an r1-artifact, same class as 170.6's laundered comment) → dead branch REMOVED + accurate comment `d3cdc9f1`; attestation spot-checks PASS (195/25 re-run; spec=8; clean tree). r3 verdict: no re-review required after removal.

### Debug Log References

### Completion Notes List

- Preface #249: TrendDirection VALID-map 'unknown' (warn-ONCE per distinct value); 6 position fields nullable (1-based); avgPosition null-preserve — unknown avgPosition masqueraded as BEST-tier GREEN badge (0≤10) → now «—» NO badge + NULLS-LAST sort both directions (desc pinned).
- Migration `07a78b68` (26 files: 5 A, 21 M; +754/−202): NEW search-chart-config.ts (single-source tokens consumed by BOTH charts — helpers re-export legacy consts API-compat); NEW SearchPositionOpportunitiesTable (movers 188-line split); tier badges /15+/30 + unknown-no-badge; summary cards status pairs; movers trend status valence; selected-row /15; nmId links status-information; financial delta; h1 text-2xl font-semibold; 2 tooltips bg-popover; dot var(--color-background).
- **Deep-link IMPLEMENTED** (dead contract → live): page reads ?tab ∈ KNOWN_TABS + ?nmId (numeric regex; garbage→undefined) — precedence ?tab > ?query > orders; movers links LIVE; 7 unit tests (tab/nmId/garbage/precedence).
- **Label REVERTED** to e2e-locked «Поисковый запрос» (renamed 7f08f688 without e2e update — tests 5+8 silently skipped behind Jam-gate; now LIVE and passing).
- Pattern-1 position-trends split: summary/movers/opportunities own chrome over SHARED fetch (residual documented in code); history chart OWN fetch — hook-level independence test (independent mocks).
- Guards: recursive catalog pinned 24 (both __tests__ dirs excluded); self-tested regexes (no double-escape — 170.6 lesson); chart single-source pin reads files; label + sr-only pins.

### Gaps

- L2: initialTab prop typed `string` (validation in page — SearchTabValue type deferred); L3: ?nmId without ?tab=by-product = inert preselect until manual tab switch; L5: no aria-busy on retained-data refetch (movers/opportunities cards). All r1-LOW, non-blocking.
- Duplicate test suites (5 components × both __tests__ dirs) — consolidation deferred (both run; count both).
- Dead render path: PositionMoverItem.currentPosition/positionDelta typed+normalized but no UI consumer (preface review L5) — debt registry.
- Visual/dark-mode → 174.3; live browser matrix 174.3.

### File List

Diff 2179e6b8..HEAD = **26 files** (5 A: search-chart-config.ts, SearchPositionOpportunitiesTable.tsx, __tests__/search-deep-link.test.tsx, components/__tests__/SearchPositionTrendsTab.test.tsx, components/__tests__/search-presentation-source-contracts.test.tsx; 21 M). Exact: `git diff --name-status 2179e6b8..HEAD`.

### Change Log

| Date | Change |
|---|---|
| 2026-08-26 | Story created from deep recon (BIGGEST epic-170 route: 43 files; Task-0 preface REQUIRED — 3 boundary lies; Pattern-1 gap; dead deep-link; e2e label mismatch; duplicate test suites noted). Plan referenced as authoritative. |
| 2026-08-26 | Validation PASS-WITH-FINDINGS → 3 CRITICAL applied (badge fact GREEN-not-RED; type-file exception scope widened; consumer sites enumerated incl. nulls-LAST sort) + verdicts: deep-link IMPLEMENT, label LOCK «Поисковый запрос» (revert; e2e silently skipping today) + Pattern-1 hook-level test note + exact 174/21. |
| 2026-08-26 | r1 fixes (tri-state, canonical bridge) applied `df52152e`; r2 fixes (comment reword) `d7c8432f`; honest e2e 8/8 derived; r3 (Trigger-1) — deep-link/tri-state verified, r1-artifact dead branch removed `d3cdc9f1`. Status: ready-for-dev → review. |
| 2026-08-26 | Implemented + merged: preface PR #249 (`2179e6b8`) + PR #250 (impl `07a78b68` + r1 `df52152e` + r2 `d7c8432f` + r3 `d3cdc9f1` + story `dd2c7db1`, merge `7a94dac0`); route 195/25, full 19 204/0, e2e 8/8 revived; 3×opus trail; cleanup 0/0/0. **EPIC 170 COMPLETE (7/7).** Status: review → done. **Lessons:** (1) Мой r1-фикс добавил недостижимую дубль-ветку под существующей — правь ПОСЛЕ чтения полной функции, не по диффу. (2) Честный e2e-счёт = счёт спеки, не wrapper-бандла (13 = 8 search + 5 orders-smoke). (3) С silently-skipping e2e (Jam-gate) ревёрс лейбла = воскресить 2 теста — проверяй skip-статус спеки до «все зелёные». |

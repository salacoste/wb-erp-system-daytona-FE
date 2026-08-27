# Story 169.12-FE: Migrate Storage Analytics and Paid-Storage Import

Status: review — route presentation merged in PR #227; paid-storage contract closeout implementation ready for independent review and universal validation

## Story

As a finance/operations user, I want `/analytics/storage` to connect storage cost summaries, alerts, trends, SKU consumers, filters, and paid-storage import status, so that I can trace storage cost and recover safely from import issues.

Plan: `.omx/plans/169.12-migrate-storage-analytics-and-paid-storage-import.md` (authoritative remaining contract-closeout branch/worktree, validation, review, PR, and cleanup; status `blocked-on-prerequisites`). PR #227 merged the route presentation before the approved 169.14 → 169.15 prerequisite chain integrated; preserve that work, but do not mark this Story `done` until the merged contract is validated and final closeout evidence is recorded.

## Acceptance Criteria

1. **Given** storage data and applied week/warehouse/SKU filters, **when** migrated, **then** cost definitions, alert thresholds, trend/table/top-consumer values, URL sync, sorting/pagination, import validation/submission/status, and refresh behavior remain unchanged.
2. **Given** no data, filtered-empty, stale/partial sections, import idle/processing/success/failure (uploading/partial = backend-absent, disposition N/A-evidence), or background refresh, **when** rendered, **then** current trustworthy data remains visible and import outcome/safe retry scope is explicit.
3. **Given** keyboard, zoom, or narrow-width use, **when** filters/table/import dialog are operated, **then** focus lifecycle, retained safe input, primary SKU/cost/status/action, and long Russian/large RUB values remain usable.
4. Plan/delivery ACs (surface purity, validation evidence, review, cleanup, no-production): see plan §Testable acceptance criteria.

## Tasks / Subtasks

The nested checkboxes below are the original implementation ledger and are retained as historical detail. Top-level Tasks 0–4 and the PR #227 route-delivery portion of Task 5 were completed by preface PR #226 plus implementation PR #227. They are not evidence that the newly approved backend/shared-boundary prerequisites are complete.

- [x] Task 0: Shared-boundary prerequisite (AC: #2) — separate owner PR before implementation branch. EXACT file scope (validated fresh-context; line numbers verified 2026-08-24):
  - [ ] `src/lib/api/storage-queries-normalizer.ts` — TWO coercion sites `has_warehouse_stock: !!d.has_warehouse_stock` at **:52** (StorageBySkuItem) and **:73** (TopConsumerItem): absent/null → false renders «Нет на складе» for UNKNOWN. Fix: preserve tri-state (`d.has_warehouse_stock === undefined ? null : !!d.has_warehouse_stock`)
  - [ ] Shared type widening REQUIRED: `src/types/storage-analytics/by-sku.ts:60` + `top-consumers.ts:46` `has_warehouse_stock?: boolean` → `?: boolean | null`; `top-consumers.ts:34` `percent_of_total: number` → `number | null`; ImportStatus `status` union gains `'unknown'` (or passthrough string) in its type file
  - [ ] `storage-queries-normalizer.ts:66` — `percent_of_total ?? 0` (AP#8: unknown ratio → 0%). Fix: `toNullableNumber` → null
  - [ ] OUT-OF-ROUTE consumer audit REQUIRED (compile-safety): `src/components/custom/dashboard/StorageTopConsumersWidget.tsx:198` consumes percent_of_total via non-null `formatPercentage` — null-guard it (`value == null ? '—' : …`) in the SAME preface PR (grep ALL consumers of each widened field before merge; rendering sites using `=== false` survive tri-state unchanged)
  - [ ] `src/lib/api/storage-import-normalizer.ts:20-24` — unknown `status` → `'failed'` (169.11 unknown-category pattern). Fix: distinguishable unknown + neutral handling; `useStorageImport.ts:59-65` fall-through dispositioned in impl story
  - [ ] DISPOSITION-NOT-FIX (needs backend-contract verification via test-api → request-backend if wrong): `has_data` overrides at **:112** (`items.length > 0`) and **:126** (`!!r.has_data || consumers.length > 0`); `pagination.total` fallback at **:103**
- [x] Task 1: Behavior lock + C4 matrix (AC: #1-2)
  - [ ] Baseline `npx vitest run "src/app/(dashboard)/analytics/storage"` — **119 tests / 12 files**
  - [ ] Lock: sort semantics (4 fields, default storage_cost_total desc, toggle same-field desc→asc), 300ms debounce search + «Найдено: X из Y», filtered-empty vs global-empty distinction, week-filter toggle/clear-on-range-change, TrendBadge manual `'+'` sign (do NOT enable signDisplay), AP#8 null→'—' money, alert threshold 20 + null-ratio-as-0 DISPLAY-GUARD, import 4-state machine + 2s poll + close-during-processing confirm, URL-sync params (weekStart/weekEnd/brands csv/warehouses csv/week)
  - [ ] ADD per-section error branches: trends/topConsumers hooks currently SILENTLY IGNORE errors (page.tsx only handles bySkuError) — add recoverable per-section error surface while retaining other sections' data (AC-2; SC "per-section error states")
- [x] Task 2: Chart migration (AC: #1, #3)
  - [ ] `storage-trends-config.ts` — local CHART_COLORS hex (`#7C4DFF` storage / `#C62828` selected / rgba gradients) → chart tokens (storage series → `var(--color-chart-N)` single-source; selected/emphasis per 169.x dot-precedent); delete unused gradientStart/End
  - [ ] `StorageTrendsChart.tsx` — axis/grid already `hsl(var(--border))` (verify + normalize to `var(--color-border)` if differing); tooltip bg-background→bg-popover+shadow-lg canon; activeDot/CustomDot token
  - [ ] `StorageTrendsChartParts.tsx` — TrendBadge `text-red-600 bg-red-50` etc. light-only pairs → financial-positive/negative + /15 tint matched pairs; `:96` inline `style={{ color: CHART_COLORS.storage }}` → class-based token (kill hex-channel inline); CustomDot cursor preserved
  - [ ] ADD sr-only data alternative for the area chart (exact weeks, units ₽/шт, all series values at tooltip precision — 169.11 ReturnTrendSrTable precedent; place alongside the EXISTING sr-only h2 «Детализация по хранению» (StoragePageTableSection.tsx:48) — distinct region naming, no duplicate)
- [x] Task 3: Table/cards/badges/import migration (AC: #1-3)
  - [ ] `StorageBySkuTable.tsx` + `StorageSkuTableHeader.tsx` — **ADD aria-sort** (4 sortable headers exist! 169.1 Button+aria-sort precedent), TableCaption (static, picker-semantic), tabular-nums numeric cells (nmId font-mono negative pin), search input min-h-11 + label linkage, scroll-region
  - [ ] `TopConsumersHelpers.tsx` — ABSORB parked dedupe: local `getCostSeverity` → `getStorageRatioSeverity` from StorageRatioIndicator (identical >20/>10 thresholds); severity dots `bg-red/yellow/green-500` → status-error/warning/success + /15 text pairs; `text-gray-400`→muted
  - [ ] `TopConsumersWidget.tsx` — `text-amber-600` → status-warning; rank icons aria-labels preserved
  - [ ] `StorageAlertBanner.tsx` — `bg-red-50 border-red-200 text-red-600/800` light-only → status-error/15+/30 matched pair + foreground; legend severity dots (green/yellow/red-500) → status tokens; threshold-20 semantics untouched
  - [ ] `StorageSummaryCards.tsx` + `WeekFilterBadge` + `WarehouseBadges` + `StorageFilters` + `StoragePageHeader` — token pass (mostly token-clean already); PageHeader adoption check (h1 semantics per 169.9/169.10); filter inputs min-h-11
  - [ ] `PaidStorageImportStatus.tsx` — `text-green-500`/`text-red-500` → status-success/error foreground pairs; import result = focusable summary; bounded live announcements (AX contract)
  - [ ] `loading.tsx` — token/parity check (epic names it in Owned Surface; recon says already token-clean — verify + pin)
  - [ ] DEDUPES (cleanup discipline): local `formatCurrency` ×4 (trends-config:17, SummaryCards:31, TopConsumersWidget:44, storage-sku-table-utils:43) → single route module; `formatWeekShort` ×2 → one; DELETE dead `ProductNameCell.tsx` + its test (route-unused, only self-test consumer; supply-planning has its own separate copy — do not touch)
- [x] Task 4: Guards + tests (AC: #1-3)
  - [ ] Recursive no-palette/no-hex source-contract (letter-lookahead #197-exempt; 169.11 regex canon) + pinned production-file count
  - [ ] FLIP hard palette pins `TopConsumersWidget.test.tsx:98,106,115,123` (bg-red/yellow/green-500) → token pins; Tier/severity collapse guard (3 distinct + neutral)
  - [ ] aria-sort semantics tests; import 4-state distinct tests (incl. unknown-status from Task 0 — neutral, not error-red); per-section error tests; sr-only alternative tests; tri-state has_warehouse_stock rendering (null→«—», false→«Нет на складе», true→nothing/badge)
  - [ ] e2e run-only: storage-analytics.spec.ts pins h1/«Товар хранения Story 162.6»/«Динамика…»/recharts-wrapper + exact API params — verify intact, run when stack up
- [x] Task 5: Route-delivery validation + review + PR #227 merge (AC: #4-9) — gates green (route 147/13, full 19 033/0, lint 0/0, tsc 0, max-lines OK, build 0, e2e-on-branch 6/1↓/0); round-1 findings fixed in `71b1105b`; round-2 record reconciliation committed as `ebfcf015`; merge `52f7f506`; local route branch/worktree absent.
- [ ] Task 6: Correct Course contract closeout — merge/clean backend Story 169.14; merge/clean frontend Story 169.15; create only `cdx/epic-169-story-12-contract-closeout` from refreshed `main`; validate PR #227 route behavior against the authoritative request/start/status/result/error contract; apply only proven route-owned corrections; rerun targeted/full/E2E evidence; reconcile this artifact and sprint lifecycle to `done`; merge and clean the closeout branch/worktree.

## Dev Notes

### Owned surface & scope

- Only `src/app/(dashboard)/analytics/storage/**` (38 files, 4 046 lines — BIGGEST route of the epic; 169.10 was 22). Shared read-only (C2/C3): `useStorage*` hooks, `@/types/storage-analytics*`, analytics-utils/margin-helpers, MultiSelectDropdown, ui primitives. `@/lib/chart-colors` NOT imported (local CHART_COLORS — keep local single-source, tokenize values).
- Baselines: owned **119 tests / 12 files**; full-suite floor: establish at first full run on the implementation branch (main moved via #223/#225; last known 18 988/0 pre-#225). Node 24.18.0 / npm 11.11.0. VC commands per plan.

### Legacy site inventory (pre-migration truth)

| File                                 | Legacy sites                                                                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `storage-trends-config.ts:10-13`     | `#7C4DFF` storage, `#C62828` selected, rgba gradients (unused — delete)                                                                                            |
| `StorageTrendsChartParts.tsx`        | `:23/25/26` TrendBadge light-only `bg-red-50`/`bg-green-50`/`bg-gray-50` + `text-*-600`; `:96` inline hex color; `:93` tooltip bg-background                       |
| `TopConsumersHelpers.tsx`            | `:26 text-yellow-500`, `:33 text-gray-400`, `:40 text-amber-600`, `:54-57 bg-red/yellow/green-500 + bg-gray-300`, `:73 text-red-600`; `:13-18` dup getCostSeverity |
| `TopConsumersWidget.tsx:147`         | `text-amber-600`                                                                                                                                                   |
| `StorageAlertBanner.tsx`             | `:50-52 bg-red-50 border-red-200 text-red-600/800`, `:66/70/74 bg-green/yellow/red-500` legend dots                                                                |
| `StorageBySkuTable.tsx:134`          | `text-amber-600`                                                                                                                                                   |
| `PaidStorageImportStatus.tsx:98,120` | `text-green-500`, `text-red-500`                                                                                                                                   |
| `StorageTrendsChart.tsx:123-130`     | axis/grid `hsl(var(--border))` — var-based, verify/canonicalize                                                                                                    |

### Canon mapping (precedents)

- Severity/rank dots → status-success/warning/error solid pairs (169.9); text-as-color on tints → foreground (169.10 AA lesson). Alert banner → status-error/15+/30 matched pair (169.5).
- Chart series → chart-N single-source var pins (169.10/169.11); hex-channels via config = invisible to class-guards → runtime negative pin `CHART_COLORS.storage !== '#…'` style or var-value pin.
- Sortable headers → Button ghost + aria-sort + ArrowUpDown (169.1 precedent — first aria-sort consumer here needs it since headers ARE sortable, unlike 169.11 N/A).
- /15 light escalations 3.96-4.19 → folded 174.2.

### C4 / import state matrix (disposition targets)

Tested: route loading, per-section loading, page error (bySku), global empty, filtered-empty, chart empty, week-filter mismatch (W-labels), alert threshold, import idle/processing/success/error + close-confirm. ADD: per-section trends/topConsumers error (currently silent — gap), background-refresh retention. N/A-evidence: uploading/partial import states (backend absent — verify via test-api; unknown-status handling comes from Task 0; AC-2 wording deviation from epic's literal uploading/partial list → FLAGGED in Gaps for reviewer sign-off), stale (no staleness signal in hooks — read-only disposition). Import contract pins (read-only): 2s poll `useStorageImport.ts:51-65`, invalidation via `useInvalidateStorageQueries` + storage-analytics-query-keys.

### References

- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md` §Story 169.12 + §C1-C11]
- [Source: `.omx/plans/169.12-migrate-storage-analytics-and-paid-storage-import.md`]
- Precedents: 169.1 (aria-sort), 169.5 (/15+/30), 169.9 (solid chips, PageHeader), 169.10 (chart tokens, donut vars, foreground-on-tint), 169.11 (sr-table, hex-guard regex, unknown-category preface #218, recursive guard + pinned count)

## Dev Agent Record

### Agent Model Used

- Preface (Task 0): executor (sonnet) + reviewer (opus fresh) — PR #226, merge `2c7a3c59`.
- Implementation: executor (sonnet) ×2 rounds via orchestrator (migration `4377cd99` + round-1 fixes `71b1105b`); review round 1: code-reviewer (opus fresh) APPROVE_WITH_NOTES; round-2 record reconciliation `ebfcf015`; PR #227 merge `52f7f506`.
- Contract closeout: native executor `implement_16912_closeout`; independent reviewer `review_16912_closeout` round 1 REQUEST CHANGES, round 2 PASS; independent verifier `verify_16912_closeout` PASS before commit/PR.

### Debug Log References

- 2026-08-27 contract-closeout baseline (before Story-owned edits): pinned Node 24.18.0/npm 11.11.0, `npx vitest run "src/app/(dashboard)/analytics/storage"` → exit 0; 13 files passed, 147 tests passed, 0 failed.
- 2026-08-27 honest RED (tests written before production edits): pinned Node 24.18.0/npm 11.11.0, `npx vitest run 'src/app/(dashboard)/analytics/storage/components/__tests__/useStorageImport.test.tsx' 'src/app/(dashboard)/analytics/storage/components/__tests__/PaidStorageImportStatus.test.tsx'` → exit 1; 2 files failed; 5 failed / 10 passed. Failures proved the intended route gaps: absent completed `rows_imported` became fabricated `0`; nested `error.message`/`error.code` collapsed to the compatibility message; retry replaced the selected date range with defaults; `ImportSuccess` threw on an absent count instead of rendering unavailable; `ImportError` omitted the stable code and whole-range retry guidance.
- Frozen before the first production edit:

```text
STORY_169_12_FROZEN_REVIEWED_MANIFEST
_bmad-output/implementation-artifacts/169-12-fe-migrate-storage-analytics-and-paid-storage-import.md
src/app/(dashboard)/analytics/storage/components/PaidStorageImportDialog.tsx
src/app/(dashboard)/analytics/storage/components/PaidStorageImportStatus.tsx
src/app/(dashboard)/analytics/storage/components/__tests__/PaidStorageImportDialog.test.tsx
src/app/(dashboard)/analytics/storage/components/__tests__/PaidStorageImportStatus.test.tsx
src/app/(dashboard)/analytics/storage/components/__tests__/useStorageImport.test.tsx
src/app/(dashboard)/analytics/storage/components/storage-import-utils.ts
src/app/(dashboard)/analytics/storage/components/useStorageImport.ts

STORY_169_12_REQUIRED_MANIFEST
_bmad-output/implementation-artifacts/169-12-fe-migrate-storage-analytics-and-paid-storage-import.md
src/app/(dashboard)/analytics/storage/components/PaidStorageImportDialog.tsx
src/app/(dashboard)/analytics/storage/components/PaidStorageImportStatus.tsx
src/app/(dashboard)/analytics/storage/components/__tests__/PaidStorageImportDialog.test.tsx
src/app/(dashboard)/analytics/storage/components/__tests__/PaidStorageImportStatus.test.tsx
src/app/(dashboard)/analytics/storage/components/__tests__/useStorageImport.test.tsx
src/app/(dashboard)/analytics/storage/components/storage-import-utils.ts
src/app/(dashboard)/analytics/storage/components/useStorageImport.ts
```

- 2026-08-27 post-review manifest expansion: the independent reviewer proved a route-glue coverage gap in the already Allowed `src/app/(dashboard)/analytics/storage/**` surface. Before editing it, `PaidStorageImportDialog.test.tsx` was added to both frozen manifests. The added path is colocated, route-owned, has no shared/E2E/package/backend overlap, and is required to prove that `PaidStorageImportDialog` forwards authoritative `error.code` and binds whole-range recovery to `handleReset`. The affected regression guard is mutation-RED verified before final GREEN.
- 2026-08-27 independent review round 1 (`review_16912_closeout`) requested two changes: MEDIUM route-glue coverage for `error.code`/whole-range recovery and LOW removal of a new prohibited `as` assertion. Both were accepted. Mutation RED removed only `code={importState.code}` after the new dialog test existed and produced exit 1, 1 failed / 7 passed, proving the guard detects the broken wiring; the line was immediately restored. Final focused GREEN passed 3 files / 23 tests and the expanded route target passed 14 files / 158 tests. The hoisted mock holder is now explicitly typed without `as`.
- 2026-08-27 independent review round 2 (`review_16912_closeout`) reviewed the exact expanded eight-path manifest and returned PASS / APPROVE with 0 CRITICAL, HIGH, MEDIUM, or LOW findings. It independently confirmed closure of both round-1 findings, exact request/lifecycle/result/error/recovery behavior, absence of arbitrary `error.details` disclosure or fabricated partial success, and exact manifest/scope purity. Fresh reviewer validation passed 3 focused files / 23 tests, 14 route files / 158 tests, TypeScript, changed-path ESLint, exact-manifest Prettier, and `git diff --check` on pinned Node 24.18.0/npm 11.11.0.
- 2026-08-27 independent verifier (`verify_16912_closeout`) returned PASS with 0 CRITICAL, HIGH, MEDIUM, or LOW findings and no file edits. It confirmed reviewer independence/closure, exact equality of the actual eight-path manifest with both frozen manifests, absence of every forbidden/shared path class, and commit/PR readiness. Fresh verifier evidence on pinned Node 24.18.0/npm 11.11.0: route Vitest 14 files / 158 tests, full ESLint with 0 warnings, TypeScript, exact-manifest Prettier, `git diff --check`, max-lines, lessons 275/85/0, markers 275/0, and docs with the exact 97-entry historical baseline all passed; it also authenticated the recorded full-suite, E2E, webpack-build, and Turbopack environment-gap evidence.
- 2026-08-27 universal validation after review fixes, pinned Node 24.18.0/npm 11.11.0: the sandboxed full Vitest run reached 19,365 passes but could not open the historical ephemeral listener (`listen EPERM 0.0.0.0`), so it was not counted as a pass. The unsandboxed rerun passed 1,213 files / 19,367 tests. ESLint, TypeScript, max-lines, Story-owned Prettier, `check:docs` (unchanged 97-entry baseline), `check:lessons` (85 lines, 0 violations), `check:markers` (0 violations), exact scope audit, and `git diff --check` passed.
- 2026-08-27 production build: exact `npm run build` reached a Turbopack worktree limitation before compilation because the ignored `node_modules` symlink points outside Turbopack's filesystem root. The same production build with the repository-used webpack fallback, `npm run build -- --webpack`, compiled, type-checked, and generated all 70 static pages successfully. This tooling limitation is a named environment gap, not represented as a Turbopack pass.
- 2026-08-27 read-only E2E ran on the actual Story worktree at `http://localhost:3100` against the existing local backend health endpoint. `TEST_PASSWORD` was read from backend `.env` only into the child process environment; it was neither printed nor written. Preflight passed, mutation mode remained disabled, Chromium storage analytics passed, and the result was 4 passed / 1 optional Manager-coverage skip / 0 failed. The temporary Story frontend process and temporary `.env.e2e` symlink were removed; the original frontend PM2 process was restored and both frontend/backend health probes returned 200.

### Completion Notes List

- Preface #226: `has_warehouse_stock` tri-state (backend schema `required: false` — load-bearing), `percent_of_total` nullable (AP#8), import status unknown→`'unknown'` distinguishable; consumer adaptations dashboard + route widget; fixture aligned (`9f0c4eb9`).
- Migration `4377cd99` (27 files, +987/−270): charts — hex `#7C4DFF/#C62828` → `var(--color-chart-1/-negative)` single-source (unused rgba gradients deleted); axis/grid → `var(--color-border)`; tooltip → bg-popover canon; TrendBadge → financial /15 matched pairs (manual `'+'` preserved, no signDisplay); NEW `StorageTrendSrTable` (every week, ₽ at tooltip precision, gap rows, name-distinct from sr-only h2).
- Tables: aria-sort on 4 sortable headers (round-1: inactive = `'none'`, not omitted); static TableCaption + scroll-region + tabular-nums (nmId font-mono negative pin); search min-h-11 + aria-label; sort semantics locked (default storage_cost_total desc, same-field toggle).
- TopConsumers: parked dedupe absorbed (`getCostSeverity` → shared `getStorageRatioSeverity`); severity dots → status tokens + muted neutral; amber → status-warning.
- AlertBanner → status-error/15+/30 + foreground; legend dots → status tokens; threshold-20 + null-ratio DISPLAY-GUARD untouched.
- Import: status pairs + focusable role=status/alert summaries + NEW neutral «Статус импорта неизвестен» hint (status 'unknown' only — never fires for processing); tri-state renders null/undefined→«—», false→«Нет на складе» (status-warning), true→nothing.
- NEW per-section error branches (trends/topConsumers — were SILENT): round-1 fix — Alert ALONGSIDE retained data when non-empty (AC-2 coexistence), Alert-only when empty; no retry Button (recovery via existing refetch paths, comment-dispositioned).
- Dedupes: formatCurrency ×4 + formatWeekShort ×2 → `storage-format.ts` (re-export API kept); dead `ProductNameCell.tsx` + test deleted.
- Guards: recursive no-palette/no-hex + NEW rgba/hsl func-color ban + route-wide `hsl(var(` ban; PINNED_PRODUCTION_FILE_COUNT=27; tier-collapse Set-4; tri-state/aria-sort/sr-only/retention/unknown-neutral suites.
- Mapping decisions: selected-week emphasis → chart-negative (169.4 precedent); tooltip value → text-chart-1 class.

### Gaps

- **Correct Course closeout:** Stories 169.14 and 169.15 are merged and their route-owned consumption has been revalidated/corrected. Story lifecycle remains `review`, not `done`, until independent review, universal/E2E validation, merge, cleanup, and final canonical reconciliation complete.

- **AC-2 wording deviation (reviewer sign-off requested):** epic lists uploading/partial import states — backend import contract has no such lifecycle (verified test-api); dispositioned N/A-backend-absent; unknown-status handling added instead.
- **e2e evidence:** run ON THE BRANCH (worktree dev :3100 swap): 6 passed / 1 skipped (role-gated setup, by-design) / 0 failed — pins h1/«Товар хранения Story 162.6»/«Динамика…»/recharts-wrapper/exact API params.
- **Stale:** N/A — hooks expose no staleness signal (read-only disposition).
- **Near-cap files (150-target):** StorageBySkuTable 185, page.tsx 183, useStoragePageState 159 — under 200 cap; natural next split = search-input block.
- **ImportSuccess/Error** use role+tabIndex focusable div (acceptable AX pattern; aria-live wrapper noted as future polish).
- **DISPOSITION-NOT-FIX (carried):** normalizer `has_data` overrides (:112/:126) + pagination.total fallback (:103) — need backend-contract verification → request-backend if wrong.
- **CustomDot `stroke="var(--color-background)"`** — repo-wide recharts canon since 168.11 (presentation-attribute var() resolution); if selected-dot rings ever render unstyled, check here first.

- Contract closeout GREEN: the route now preserves authoritative completed `rows_imported: 0`, keeps a missing/non-authoritative count unavailable as `—`, prioritizes nested `error.message`, carries and displays stable `error.code`, and deliberately does not carry/render arbitrary `error.details`.
- Whole-range recovery is explicit: the selected date range is retained when returning to the form and the error action/guidance names retry of the entire selected period; no partial-success state or retry subset is synthesized.
- Terminal polling transitions now run in an effect instead of issuing state updates during render. `pending`, `processing`, and the frontend-only `unknown` sentinel remain nonterminal; `completed` invalidates storage queries and `failed` remains a terminal error.
- Contract closeout targeted GREEN (pinned Node 24.18.0/npm 11.11.0): smallest affected target 2 files / 15 tests passed; full route target 14 files / 157 tests passed; Story-owned Prettier, repository lint, repository type-check, max-lines, docs-baseline (97 pre-existing broken citations unchanged), lessons, markers, and `git diff --check` passed.
- Review-fix closure expanded the route-owned manifest by one dialog integration test, removed all new TypeScript assertions, and proved the `error.code` glue with mutation RED. Final focused/route evidence is 23/23 and 158/158; universal regression is 19,367/19,367; read-only Chromium E2E is 4 passed / 1 optional skip / 0 failed; webpack production build generated 70/70 pages.

### File List

Edited/deleted/new in PR (27 route files; preface files were PR #226): see `git diff --name-status 2c7a3c59..HEAD` — 17 M non-test + 4 M test (StoragePage, StorageBySkuTable, StorageTrendsChart, TopConsumersWidget) + 4 A (`storage-format.ts`, `StorageTrendSrTable.tsx`, `storage-presentation-source-contracts.test.tsx`, `__tests__/PaidStorageImportStatus.test.tsx`) + 2 D (`ProductNameCell.tsx`, `ProductNameCell.test.tsx`) = 27 files. Verified unchanged: loading.tsx (token-clean, pinned), WarehouseBadges.tsx, StoragePageContent.tsx, useStorageUrlSync.ts, useStorageBySkuTable.ts, useStorageImport.ts (comment-only in preface), StoragePageHeader.tsx.

Contract closeout changed/reviewed manifest:

- `_bmad-output/implementation-artifacts/169-12-fe-migrate-storage-analytics-and-paid-storage-import.md`
- `src/app/(dashboard)/analytics/storage/components/PaidStorageImportDialog.tsx`
- `src/app/(dashboard)/analytics/storage/components/PaidStorageImportStatus.tsx`
- `src/app/(dashboard)/analytics/storage/components/__tests__/PaidStorageImportDialog.test.tsx`
- `src/app/(dashboard)/analytics/storage/components/__tests__/PaidStorageImportStatus.test.tsx`
- `src/app/(dashboard)/analytics/storage/components/__tests__/useStorageImport.test.tsx`
- `src/app/(dashboard)/analytics/storage/components/storage-import-utils.ts`
- `src/app/(dashboard)/analytics/storage/components/useStorageImport.ts`

### Change Log

| Date       | Change                                                                                                                                                                                                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-24 | Story created via create-story context engine from deep recon (38-file route, 119-test baseline, boundary red flags → Task 0 preface scope). Plan referenced as authoritative. Fresh-context validation caught 3 context blockers (line numbers, type-safety scope, consumer enumeration) — fixed pre-preface. |
| 2026-08-24 | Round-1 review fixes applied (error retention coexistence, aria-sort none, rgba/hsl guard blindspots, story reconciliation). Status: ready-for-dev → review.                                                                                                                                                   |
| 2026-08-24 | PR #227 merged route presentation (`4377cd99`, `71b1105b`, `ebfcf015`; merge `52f7f506`). Correct Course reconciliation keeps Status at review and adds Task 6 for post-169.14/169.15 contract closeout.                                                                                                       |
| 2026-08-27 | Story 169.12 contract-closeout implementation: RED locked route-level merged-contract gaps; GREEN preserved zero versus unavailable counts, nested failure code/message, retained whole-range retry input/guidance, and effect-based terminal transitions. Task 6 remains open pending independent review, universal/E2E gates, merge, cleanup, and final reconciliation. |

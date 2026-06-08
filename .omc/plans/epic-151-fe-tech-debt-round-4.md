# Epic 151-FE: Technical Debt Round 4

## Context

All 131 frontend epics are DONE. Recent Epics 148-150 added ~140 test files and fixed a FunnelOverlayChart bug, but introduced citation drift by splitting monolithic type files into subdirectories. 16,101 tests passing, 954 test files total. This epic addresses 5 debt areas identified post-Epic 150.

---

## Epic Specification

### Title
Technical Debt Round 4: Citation Baseline, Mock Handler Splits, Proactive File Splits, Test Gaps, Comment Cleanup

### Priority
P1 (quality gate integrity + maintainability)

### Scope
- 5 stories, 13 story points
- ~20-25 files modified/created across stories

---

## Stories

### Story 151.1: Fix Doc Citation Baseline Drift (40 new, 8 resolved)
**Priority**: P1 | **Points**: 3

**Problem**: The doc-citation validator baseline accepts 45 broken citations, but current state has 77 broken (40 NEW + 8 RESOLVED vs baseline). Root cause: Epics 148-150 split 4 monolithic type files into subdirectories:
- `src/types/cabinet.ts` -> `src/types/cabinet/` (core.ts, external-services.ts, index.ts)
- `src/types/daily-metrics.ts` -> `src/types/daily-metrics/` (api-types.ts, core.ts, index.ts)
- `src/types/sku-financials.ts` -> `src/types/sku-financials/` (core.ts, helpers.ts, index.ts)
- `src/types/unit-economics.ts` -> `src/types/unit-economics/` (core.ts, responses.ts, unit-economics-cost-categories.ts, index.ts)

This produced 21 `file not found` citations and 57 `line exceeds file length` citations. The validator FAILs on every CI run.

**Acceptance Criteria**:
1. ALL citations in `docs/`, `CLAUDE.md`, `CLAUDE-PATTERNS.md`, `CLAUDE-ANTI-PATTERNS.md`, `_bmad-output/`, `backlog/` that reference old monolithic type paths are updated to point to the correct new subdirectory files with accurate line numbers
2. `bash scripts/check-doc-citations.sh` exits 0 (baseline matches current broken set)
3. `scripts/.check-docs-baseline.txt` updated to reflect new reality via `--update-baseline`
4. CLAUDE.md "Accepted Baselines" table updated with new citation count
5. No new broken citations introduced

**Key Files**:
- `scripts/.check-docs-baseline.txt` (baseline update)
- `CLAUDE.md` (baseline table)
- `docs/EPICS-AND-STORIES-TRACKER.md` (citations to fix)
- `docs/stories/` (citations referencing old type paths)
- `_bmad-output/` (citations referencing old type paths)
- `backlog/docs/`, `backlog/tasks/` (citations referencing old type paths)

**Approach**:
1. Run validator, capture full output
2. For each NEW broken citation: grep for the citation text across all doc files, update path/line to point to the correct new file
3. For RESOLVED citations: remove from baseline
4. Run `--update-baseline` to accept new state
5. Update CLAUDE.md baseline table

---

### Story 151.2: Split Mock Handler Files (4 files, 1690 total lines)
**Priority**: P2 | **Points**: 3

**Problem**: 4 MSW mock handler files exceed the 375-line maintainability threshold (test/mock cap is 800, but readability suffers). Each has clear section dividers separating mock data generators from HTTP handlers.

**Acceptance Criteria**:
1. Each mock handler split into 2 files:
   - `src/mocks/handlers/<domain>-data.ts` -- mock data generators, fixtures, type imports (no MSW imports)
   - `src/mocks/handlers/<domain>.ts` -- HTTP handlers only (imports from `-data` file)
2. Original file stays under 200 lines; data file stays under 400 lines
3. `src/mocks/handlers/index.ts` barrel export updated if needed
4. All existing tests referencing these handlers continue passing (no test changes needed -- MSW handler imports are via barrel)
5. `npm test -- --run` passes with 0 failures

**Key Files**:
- `src/mocks/handlers/liquidity.ts` (477 lines -> ~180 handler + ~350 data)
- `src/mocks/handlers/advertising.ts` (457 lines -> ~200 handler + ~300 data)
- `src/mocks/handlers/unit-economics.ts` (379 lines -> ~160 handler + ~250 data)
- `src/mocks/handlers/supply-planning.ts` (377 lines -> ~170 handler + ~240 data)
- `src/mocks/handlers/index.ts` (barrel update)

---

### Story 151.3: Proactive Source File Splits (30 files in 185-199 danger zone)
**Priority**: P2 | **Points**: 3

**Problem**: 50+ source files sit between 185-210 lines. The 200-line ESLint cap is a hard ceiling; proactive extraction at ~150 lines is the ergonomic target per CLAUDE.md. Focus on the highest-risk files (193-205 lines).

**Acceptance Criteria**:
1. Top 10-15 highest-risk files (193+ lines) are proactively split:
   - Extract types to adjacent `-types.ts` or co-located type files
   - Extract helper/utility functions to separate files
   - Extract sub-components where applicable
2. Each resulting file is under 170 lines (target ~150)
3. All imports updated; no circular dependencies introduced
4. `npm run lint && npm run type-check` passes with 0 errors
5. `npm test -- --run` passes with 0 failures
6. `src/components/ui/dropdown-menu.tsx` (205 lines) is NOT edited (shadcn/ui managed file)

**Key Files** (top priority by line count):
- `src/types/finance-summary.ts` (193)
- `src/components/custom/orders/timeline/WbTimelineEntry.tsx` (193)
- `src/components/custom/MarginDisplay.tsx` (193)
- `src/app/(dashboard)/analytics/buyout/components/BuyoutTrendChart.tsx` (192)
- `src/components/custom/shipments/ShipmentsTable.tsx` (191)
- `src/app/(dashboard)/analytics/funnel/components/funnel-table-columns.tsx` (191)
- `src/types/fulfillment.ts` (190)
- `src/lib/week-report-utils.ts` (190)
- `src/hooks/supply-tariffs-helpers.ts` (190)
- `src/app/(dashboard)/analytics/time-period/page.tsx` (190)
- `src/app/(dashboard)/analytics/page.tsx` (190)
- `src/app/(dashboard)/analytics/buyout-reconciliation/components/BuyoutReconciliationPageContent.tsx` (190)

---

### Story 151.4: Test Coverage for High-Value Untested Files
**Priority**: P2 | **Points**: 3

**Problem**: Several high-value lib files and hooks have zero test coverage despite being core business logic or API boundary layers. Priority targets are files over 150 lines with no corresponding test file.

**Acceptance Criteria**:
1. New test files created for these untested lib files (priority order):
   - `src/lib/__tests__/analytics.service.test.ts` (186 lines, core analytics)
   - `src/lib/__tests__/liquidity-formatters.test.ts` (168 lines, formatting logic)
   - `src/lib/__tests__/api-client.test.ts` (151 lines, HTTP client -- extract pure functions per CLAUDE.md pattern)
2. New test files created for these untested hooks (pure-function extraction pattern):
   - `src/hooks/__tests__/useDashboardMetricsWithPeriod-utils.test.ts` (111 lines, pure utils)
   - `src/hooks/__tests__/usePendingMarginPolling.test.ts` (124 lines, polling strategy)
3. Each test file covers: happy path, edge cases (null/undefined inputs), error handling
4. Pure functions extracted and exported from hooks where applicable (per CLAUDE.md "pure functions over hook mocking")
5. `npm test -- --run` passes with 0 failures
6. Test count increases by 50+ from these new files

**Key Files**:
- `src/lib/analytics/analytics.service.ts` (source)
- `src/lib/liquidity-formatters.ts` (source)
- `src/lib/api-client.ts` (source)
- `src/hooks/useDashboardMetricsWithPeriod-utils.ts` (source)
- `src/hooks/usePendingMarginPolling.ts` (source)
- New test files in `src/lib/__tests__/` and `src/hooks/__tests__/`

---

### Story 151.5: PENDING BACKEND / FUTURE Comment Audit
**Priority**: P3 | **Points**: 1

**Problem**: 1 PENDING BACKEND comment and 1 FUTURE comment remain in source. Both are valid but should be verified against current backend state.

**Acceptance Criteria**:
1. `BackfillStatusTable.tsx:118` PENDING BACKEND: verify whether per-status retry endpoint exists. If yes, update comment/remove marker. If no, confirm comment is accurate and add a `docs/request-backend/*.md` reference if missing
2. `unit-economics-formatters.ts:7` FUTURE: confirm comment is still accurate (informational, no action needed unless formatCurrency behavior changed)
3. Grep confirms 0 bare `TODO` or `FIXME` in production source (per CLAUDE.md rule: `grep src/ --include="*.ts" --include="*.tsx" | grep -v test` returns zero lines for `TODO|FIXME`)
4. `npm run lint && npm run type-check` passes

**Key Files**:
- `src/app/(dashboard)/settings/backfill/components/BackfillStatusTable.tsx`
- `src/lib/unit-economics-formatters.ts`

---

## Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Doc citation gate passes | `bash scripts/check-doc-citations.sh` exits 0 |
| No files over 200 lines (source) | `npm run lint` passes |
| Mock handlers maintainable | Each handler file < 200 lines |
| Test count increases | 50+ new tests, 0 failures |
| No TODO/FFIXME in source | Grep returns 0 lines |
| All quality gates green | lint + type-check + tests all pass |

## Guardrails

**Must Have**:
- All quality gates pass (lint, type-check, tests, citation check)
- CLAUDE.md "Accepted Baselines" table updated if citation count changes
- shadcn/ui files (`src/components/ui/`) never edited
- Pure-function extraction pattern for hook tests

**Must NOT Have**:
- Behavior changes (refactor only, no new features)
- No new dependencies
- No changes to test infrastructure config (vitest, playwright configs)

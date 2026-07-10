---
id: task-55
title: Resolve deferred low-priority FE validation and navigation cleanup
status: Done
assignee:
  - codex
created_date: '2026-07-10 20:53'
updated_date: '2026-07-10 21:29'
labels:
  - frontend
  - autopilot
  - cleanup
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Address the safe, unblocked frontend cleanup items from the remaining-task summary: harden bulk COGS nmId numeric handling, remove or consolidate the dead cogs-bulk type duplicate, evaluate request/response converter placement, and fix BD-40 SPA deep-link week resynchronization if locally reproducible. BE-blocked FE-5/FE-6 are explicitly out of scope until backend contracts are available.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Bulk COGS assignment cannot serialize non-numeric nmId values as JSON null/NaN; invalid nmId input is rejected before request serialization or guarded by converter validation.
- [x] #2 Dead duplicate src/types/cogs/cogs-bulk.ts is removed or consolidated without breaking exported type imports.
- [x] #3 Request/response bulk COGS conversion code placement is made consistent where it improves maintainability without introducing new dependencies or broad churn.
- [x] #4 BD-40 in-app SPA navigation to a different ?week= value updates selectedWeek when the page remains mounted, covered by a targeted regression test where feasible.
- [x] #5 FE-5 and FE-6 remain documented as backend-blocked and no frontend-only semantic guesses are introduced.
- [x] #6 Targeted tests and type/lint checks relevant to changed files pass, or any validation gap is explicitly recorded.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect bulk COGS validation/conversion and tests; add one shared strict nm_id parser/validator used by both validation and wire conversion. Reject empty, non-digit, decimal, scientific notation, non-finite, non-integer, and unsafe-integer values before request serialization.
2. Verify src/types/cogs/cogs-bulk.ts import/export reachability; remove the dead duplicate if no live imports rely on it.
3. Evaluate moving bulk COGS wire conversion from hooks to lib/api for request/response boundary symmetry; preserve existing public hook re-exports if moved, and leave validation/create helpers in hook utils unless moving is truly low-churn. Otherwise record the no-op rationale.
4. Fix BD-40 by treating valid URL params as source-of-truth on SPA navigation: URL→state reconciliation must run before/gate state→URL canonicalization so stale local state cannot replace a newly supplied ?week=. Add a regression test that changes mocked search params and proves selectedWeek updates and stale replace does not happen.
5. Keep FE-5 and FE-6 unchanged as backend-blocked; do not infer missing backend semantics.
6. Run targeted Vitest suites for changed files, then type-check/lint or the smallest relevant static check available.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Completed via Autopilot.

Changed task-owned files:
- Added `src/lib/api/bulk-cogs-wire.ts` for strict Bulk COGS nm_id parsing and API-boundary wire conversion.
- Updated `src/hooks/useBulkCogsAssignment-utils.ts` to reuse the shared parser and preserve public re-exports.
- Updated COGS utility/hook tests for invalid nm_id rejection before POST and valid integer conversion.
- Deleted dead duplicate `src/types/cogs/cogs-bulk.ts` after repo-wide/source import checks.
- Updated `src/contexts/dashboard-period-state.ts` so valid URL params reconcile into local period state before/gating state→URL canonicalization.
- Added dashboard period SPA rerender tests for week and month/type URL source-of-truth behavior.

Verification:
- `npm test -- --run src/hooks/__tests__/useBulkCogsAssignment-utils.test.ts src/hooks/__tests__/useBulkCogsAssignment.test.ts src/contexts/__tests__/dashboard-period-context.test.tsx` → 3 files / 96 tests passed.
- `npm run type-check -- --pretty false` → passed.
- Targeted ESLint on task-owned files → passed.
- `git diff --check` on task-owned paths → passed.
- `rg -n "cogs-bulk" src` → no imports.
- Code-review gate: APPROVE/CLEAR.
- Architecture invariant gate: APPROVE/CLEAR after scope-isolation evidence.
- UltraQA: PASS/clean.

FE-5 and FE-6 remain backend-blocked; no frontend semantic guesses were introduced.

Note: unrelated pre-existing dirty/untracked OpenWiki/docs/.omc worktree changes were preserved and excluded from this task scope.
<!-- SECTION:NOTES:END -->

# OMX Story Plan 163.1: Make Advertising Sort Headers Keyboard Accessible

## Requirements Summary

As an analytics operator,
I want every sortable advertising table header to be keyboard operable and expose its current state,
So that I can inspect advertising data without relying on a pointer device.

- **Story ID:** 163.1
- **Epic:** 163-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.1
- **Immutable `initial_status`:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> `initial_status` is plan-generation metadata only. Read and update current lifecycle state in `_bmad-output/implementation-artifacts/sprint-status.yaml` and the durable orchestration manifest; never mutate this field during story closeout.

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `src/app/(dashboard)/analytics/advertising/components/performance-table/SortableHeader.tsx`
- `src/app/(dashboard)/analytics/advertising/components/performance-table/PerformanceTableHeader.tsx`
- `src/app/(dashboard)/analytics/advertising/components/performance-table/performance-table-columns.tsx`
- `src/app/(dashboard)/analytics/advertising/components/performance-table/*test*`

## Acceptance Criteria (canonical)

**Given** an advertising table column is sortable
**When** its header renders
**Then** the interactive target is a semantic button inside the column header
**And** it has an accessible Russian name describing the sort action and column.

**Given** keyboard focus is on a sortable header button
**When** the operator presses Enter or Space
**Then** the same sort transition occurs as with pointer activation
**And** the updated order is reflected in the visible table rows.

**Given** a column is unsorted, ascending, or descending
**When** its state changes
**Then** the containing column header exposes the correct `aria-sort` value
**And** only the actively sorted column reports an ascending or descending state.

**Given** a keyboard user navigates through the table headers
**When** a sortable control receives focus
**Then** a visible focus indicator is present
**And** the visual sort indicator does not rely on color alone.

**Given** the affected advertising analytics components are audited
**When** remediation is complete
**Then** no sortable advertising header uses click-only interaction on `<th>`
**And** obsolete accessibility suppressions related to mouse-only sorting are removed.

**Given** the sorting components are tested
**When** targeted component and localhost browser tests run
**Then** they verify accessible names, Enter/Space activation, `aria-sort` transitions, and visible row ordering
**And** typecheck, zero-warning lint, formatting, and relevant static checks pass.

## Implementation Steps

1. Verify canonical dependency/immutable `initial_status` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean `origin/main` base SHA.
2. Lock current pointer sorting and table state with component tests.
3. Move activation to semantic buttons with Russian accessible names, focus styles, keyboard operation, and `aria-sort` on the owning header.
4. Add component accessibility coverage and a localhost keyboard smoke.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Sorting callbacks must fire exactly once and retain current direction/order behavior.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `npm test -- --run src/app/\(dashboard\)/analytics/advertising/components/performance-table`
- `npx playwright test e2e/advertising-analytics-epic-36.spec.ts`
- `npm run type-check`
- `npm run lint`
- `npm run format:check`
- `git diff --check`
- Browser-facing acceptance criteria require a fresh localhost result; if credentials/services are unavailable, record the gap and do not claim those criteria passed.

## Completion Evidence

- Dependency gate and base SHA.
- Changed-file list limited to this story's scope.
- Targeted test output plus required typecheck/lint/format/build evidence.
- Independent `code-reviewer` findings and `verifier` verdict.
- Commit SHA, PR URL, merge SHA, and proof that the feature SHA is an ancestor of `origin/main`.
- Proof that the story worktree path is absent, the merged local branch is deleted, remote branch cleanup is reconciled, and `git worktree prune` completed.

## Stop Condition

Stop only when every canonical acceptance criterion is evidenced, the PR is merged, and cleanup is verified; otherwise preserve the worktree and report the precise blocker.

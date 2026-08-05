# OMX Story Plan 163.6: Replace Dashboard Period Tabs with a Single-Choice Toggle

## Requirements Summary

As a dashboard operator,
I want week/month selection announced and operated as a single-choice toggle,
So that the control's accessibility semantics match its actual behavior.

- **Story ID:** 163.6
- **Epic:** 163-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.1
- **Immutable `initial_status`:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> `initial_status` is plan-generation metadata only. Read and update current lifecycle state in `_bmad-output/implementation-artifacts/sprint-status.yaml` and the durable orchestration manifest; never mutate this field during story closeout.

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `src/components/custom/DashboardPeriodSelector.tsx`
- `src/components/custom/__tests__/DashboardPeriodSelector.test.tsx`
- `src/components/ui/radio-group.tsx`
- `src/contexts/dashboard-period-context.tsx`
- `e2e/dashboard-period.spec.ts`
- `e2e/period-selection-month-test.spec.ts`

## Acceptance Criteria (canonical)

**Given** `DashboardPeriodSelector` uses Tabs only to choose between week and month
**When** the control is migrated
**Then** it uses the project's existing `RadioGroup` and `RadioGroupItem` pattern
**And** the hidden, force-mounted tab panels and their workaround comments are removed.

**Given** "Неделя" is selected
**When** the operator activates "Месяц" by pointer or keyboard
**Then** `periodType` changes to `month` exactly once
**And** the month selector and existing dashboard data flow become active without resetting unrelated state.

**Given** "Месяц" is selected
**When** the operator activates "Неделя"
**Then** `periodType` changes to `week` exactly once
**And** the previously selected week remains available according to existing context behavior.

**Given** the RadioGroup is a required controlled single-choice selection
**When** the selected option is activated again or focus moves between options
**Then** the controlled value remains `week` or `month`
**And** the dashboard never enters an undefined period type.

**Given** a keyboard user focuses the period toggle
**When** Enter, Space, or supported arrow-key navigation is used
**Then** week/month selection is operable with visible focus
**And** assistive technology can determine the group label and selected option without tab-panel semantics.

**Given** the selector is disabled, compact, loading, or displayed on mobile
**When** it renders
**Then** existing disabled, responsive, selector, refresh, and skeleton behavior is preserved
**And** no new dependency is introduced.

**Given** the migration is tested
**When** targeted component, context-integration, accessibility, and localhost browser tests run
**Then** they verify selection, keyboard behavior, non-clearable state, callbacks, disabled state, and absence of hidden tab panels
**And** typecheck, zero-warning lint, formatting, and relevant static checks pass.

## Implementation Steps

1. Verify canonical dependency/immutable `initial_status` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean `origin/main` base SHA.
2. Lock period context callbacks, retained selections, disabled/loading, and responsive behavior.
3. Replace Tabs and hidden panels with the existing controlled RadioGroup and RadioGroupItem pattern; add no dependency.
4. Verify pointer, arrow-key, accessible radio-group state, and absence of tab-panel semantics.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Keep RadioGroup controlled by the existing valid period type and preserve accessible labels while styling it as the compact week/month selector.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `npm test -- --run src/components/custom/__tests__/DashboardPeriodSelector.test.tsx`
- `npm run test:e2e:full -- e2e/dashboard-period.spec.ts e2e/period-selection-month-test.spec.ts`
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

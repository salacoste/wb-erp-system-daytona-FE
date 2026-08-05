# OMX Story Plan 162.6: Remove Fixed Waits from Dashboard and Analytics E2E

## Requirements Summary

As a frontend developer,
I want dashboard and analytics tests synchronized to meaningful UI and network events,
So that period changes, charts, metrics, and navigation are validated without timing guesses.

- **Story ID:** 162.6
- **Epic:** 162-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.2, 162.3
- **Immutable `initial_status`:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> `initial_status` is plan-generation metadata only. Read and update current lifecycle state in `_bmad-output/implementation-artifacts/sprint-status.yaml` and the durable orchestration manifest; never mutate this field during story closeout.

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `e2e/dashboard-*.spec.ts`
- `e2e/analytics/*.spec.ts`
- `e2e/margin-analytics.spec.ts`
- `e2e/financial-summary.spec.ts`
- `e2e/storage-analytics.spec.ts`
- `e2e/category-analytics.spec.ts`
- `e2e/brand-analytics.spec.ts`
- `e2e/forecast*.spec.ts`
- `e2e/merged-group-table-epic-37.spec.ts`
- `e2e/accessibility-merged-groups-epic-37.spec.ts`
- `e2e/period-selection-month-test.spec.ts`

## Acceptance Criteria (canonical)

**Given** the owned dashboard and analytics specs contain 67 fixed waits
**When** synchronization is remediated
**Then** their `page.waitForTimeout()` count becomes zero
**And** no arbitrary replacement sleep is introduced.

**Given** a period, filter, grouping, or route selection triggers data loading
**When** the test changes that selection
**Then** it waits for the expected request and visible state transition
**And** verifies the rendered period or result belongs to the new selection.

**Given** dashboard cards and analytics charts load independently
**When** one request is delayed or fails
**Then** tests assert the intended independent loading, success, empty, or error state
**And** do not wait for unrelated network idleness.

**Given** merged-group, FBS, margin, financial-summary, storage, category, brand, forecast, and analytics-hub coverage runs
**When** each interaction completes
**Then** assertions use stable roles, labels, test IDs, or response predicates
**And** failures identify the missing state rather than timing out after a sleep.

**Given** the remediation is complete
**When** the targeted dashboard/analytics set runs repeatedly against prepared localhost fixtures
**Then** it passes without retry-only success
**And** the owned-scope before/after wait count and runtime are recorded.

## Implementation Steps

1. Verify canonical dependency/immutable `initial_status` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean `origin/main` base SHA.
2. Inventory the 67 owned waits by trigger and expected visible result.
3. Replace them with request/route/locator state transitions without waiting for unrelated requests.
4. Repeat the targeted suite and record `67 → 0`, runtime, and zero retry-only passes.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Chart animation and independent dashboard requests need purpose-specific readiness signals.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `rg -n "page\.waitForTimeout\(" e2e/dashboard-*.spec.ts e2e/analytics e2e/margin-analytics.spec.ts e2e/financial-summary.spec.ts e2e/storage-analytics.spec.ts e2e/category-analytics.spec.ts e2e/brand-analytics.spec.ts e2e/forecast*.spec.ts e2e/merged-group-table-epic-37.spec.ts e2e/accessibility-merged-groups-epic-37.spec.ts e2e/period-selection-month-test.spec.ts`
- `npm run test:e2e:full -- e2e/dashboard-*.spec.ts e2e/analytics e2e/margin-analytics.spec.ts e2e/financial-summary.spec.ts e2e/storage-analytics.spec.ts e2e/category-analytics.spec.ts e2e/brand-analytics.spec.ts e2e/forecast*.spec.ts e2e/merged-group-table-epic-37.spec.ts e2e/accessibility-merged-groups-epic-37.spec.ts e2e/period-selection-month-test.spec.ts --repeat-each=2`
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

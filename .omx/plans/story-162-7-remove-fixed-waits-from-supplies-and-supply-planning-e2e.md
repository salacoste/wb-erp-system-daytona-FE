# OMX Story Plan 162.7: Remove Fixed Waits from Supplies and Supply Planning E2E

## Requirements Summary

As a frontend developer,
I want supply lifecycle tests synchronized to real backend and UI state transitions,
So that create, update, calculate, confirm, document, and accessibility flows are reliable.

- **Story ID:** 162.7
- **Epic:** 162-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.2, 162.4
- **Immutable `initial_status`:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> `initial_status` is plan-generation metadata only. Read and update current lifecycle state in `_bmad-output/implementation-artifacts/sprint-status.yaml` and the durable orchestration manifest; never mutate this field during story closeout.

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `e2e/supply-planning.spec.ts`
- `e2e/supplies/supplies-list.spec.ts`
- `e2e/supplies/supply-detail.spec.ts`
- `e2e/supplies/supply-lifecycle.spec.ts`
- `e2e/supplies/supplies-a11y.spec.ts`
- `e2e/fixtures/mutation-guard.ts`

## Acceptance Criteria (canonical)

**Given** supply-planning and supplies specs contain 76 fixed waits
**When** synchronization is remediated
**Then** the owned-scope `page.waitForTimeout()` count becomes zero
**And** no polling loop without a bounded stop condition is introduced.

**Given** a supply mutation is permitted by the sandbox guard
**When** create, add-order, calculate, confirm, close, or document actions run
**Then** tests wait for the corresponding response and visible terminal state
**And** reconcile the displayed entity before proceeding.

**Given** mutating E2E is disabled
**When** read-only supplies coverage runs
**Then** it validates list, detail, navigation, expansion, sorting, pagination, and accessibility states
**And** never performs a write as a synchronization shortcut.

**Given** data is eventually consistent
**When** a lifecycle state is not immediately visible
**Then** the test uses bounded condition polling tied to the expected entity and state
**And** reports the last observed state on failure.

**Given** the remediation is complete
**When** supply-planning, supplies-list, supply-detail, supply-lifecycle, and supplies-a11y specs run repeatedly
**Then** they pass without fixed sleeps or retry-only success
**And** created sandbox data is reconciled or cleaned through supported product/API operations.

## Implementation Steps

1. Verify canonical dependency/immutable `initial_status` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean `origin/main` base SHA.
2. Classify the 76 waits as read-only, mutation-response, or eventual-consistency synchronization.
3. Replace them with bounded entity/state reconciliation and preserve the mutation guard.
4. Repeat the five owned specs and record `76 → 0`, cleanup evidence, and last-observed state diagnostics.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Eventual consistency requires bounded polling keyed to the created entity, never an unbounded loop.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `rg -n "page\.waitForTimeout\(" e2e/supply-planning.spec.ts e2e/supplies`
- `npx playwright test e2e/supply-planning.spec.ts e2e/supplies --repeat-each=2`
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

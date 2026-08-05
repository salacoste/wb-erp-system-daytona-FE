# OMX Story Plan 165.5: Add Per-Status Backfill Retry Only After Separate Contracts Exist

## Requirements Summary

As an operations administrator,
I want to retry failed report and analytics backfills independently,
So that recovering one pipeline does not unnecessarily restart the other.

- **Story ID:** 165.5
- **Epic:** 165-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** Backend per-status retry contracts
- **Immutable `initial_status`:** deferred
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> `initial_status` is plan-generation metadata only. Read and update current lifecycle state in `_bmad-output/implementation-artifacts/sprint-status.yaml` and the durable orchestration manifest; never mutate this field during story closeout.

> Backend gate: do not create a feature branch/worktree until the dependency evidence in the acceptance criteria exists.

## Concrete Scope

- `src/lib/api/backfill.ts`
- `src/hooks/useBackfillAdmin.ts`
- `src/app/(dashboard)/settings/backfill/components/BackfillControlButtons.tsx`
- `src/app/(dashboard)/settings/backfill/use-backfill-handlers.ts`
- `src/app/(dashboard)/settings/backfill/__tests__/page.test.tsx`
- `e2e/settings/backfill-admin.spec.ts`

## Acceptance Criteria (canonical)

**Given** the current frontend exposes only a cabinet-wide retry operation
**When** this story enters implementation
**Then** the backend dependency is considered satisfied only after separate report and analytics retry endpoints are documented and live
**And** their authorization, idempotency, response, conflict, and failure contracts are verified.

**Given** separate retry contracts are unavailable
**When** one of the two statuses fails
**Then** the story remains deferred and the UI continues to show both failure states accurately
**And** it does not simulate partial retry through the cabinet-wide endpoint.

**Given** only the report backfill has failed
**When** the operator activates its retry control
**Then** only the report retry endpoint is called and its loading/result state is updated
**And** the analytics status and controls remain unchanged.

**Given** only the analytics backfill has failed
**When** the operator activates its retry control
**Then** only the analytics retry endpoint is called and its loading/result state is updated
**And** the report status and controls remain unchanged.

**Given** either retry succeeds or fails
**When** the mutation settles
**Then** the relevant status query is refreshed and success or actionable error feedback is shown
**And** concurrent actions are disabled only where required to prevent duplicate requests.

**Given** per-status retry is tested after activation
**When** API, hook, component, accessibility, and localhost E2E coverage runs
**Then** it proves endpoint separation, independent loading states, success, conflict, authorization, and failure behavior
**And** typecheck, zero-warning lint, formatting, and relevant static checks pass.

## Implementation Steps

1. Verify canonical dependency/immutable `initial_status` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean `origin/main` base SHA. Stop before branch creation when the backend gate is absent.
2. Before creating an implementation worktree, verify separate live report/analytics retry endpoints and their auth, idempotency, conflict, response, and failure contracts.
3. If the gate passes, lock API/hook separation and independent loading/error/cache invalidation behavior.
4. Add per-status controls and accessibility/E2E coverage without routing either action through the cabinet-wide retry endpoint.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** This plan is deferred; a single cabinet-wide retry endpoint cannot satisfy the contract.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `npm test -- --run src/app/\(dashboard\)/settings/backfill src/lib/api/backfill src/hooks/useBackfill.ts src/hooks/useBackfillAdmin.ts`
- `npm run test:e2e:full -- e2e/settings/backfill-admin.spec.ts`
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

Remain `deferred` until the backend contract evidence is real. After activation, stop only when every canonical acceptance criterion and cleanup invariant is proven.

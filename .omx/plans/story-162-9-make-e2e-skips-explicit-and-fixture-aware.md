# OMX Story Plan 162.9: Make E2E Skips Explicit and Fixture-Aware

## Requirements Summary

As a frontend developer,
I want every skipped browser test to have an explicit, reviewable reason,
So that missing fixtures and regressions cannot disappear silently from local results.

- **Story ID:** 162.9
- **Epic:** 162-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.8
- **Immutable `initial_status`:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> `initial_status` is plan-generation metadata only. Read and update current lifecycle state in `_bmad-output/implementation-artifacts/sprint-status.yaml` and the durable orchestration manifest; never mutate this field during story closeout.

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `e2e/**/*.spec.ts`
- `e2e/fixtures/`
- `scripts/`
- `package.json`

## Acceptance Criteria (canonical)

**Given** the E2E suite contains 30 bare `test.skip()` calls
**When** skip handling is remediated
**Then** the bare-skip count becomes zero
**And** every remaining skip provides a condition and concrete reason.

**Given** a critical smoke route requires authentication or deterministic seed data
**When** that prerequisite is missing
**Then** preflight or setup fails the run
**And** the critical test is not silently skipped.

**Given** a scenario is optional because of role, viewport, backend capability, or mutation policy
**When** the condition is unmet
**Then** the Playwright report states the exact missing capability
**And** the reason identifies how to enable the scenario locally.

**Given** data-dependent coverage can validate a documented empty state
**When** no records exist
**Then** the test asserts that empty state
**And** does not skip merely because the data table is absent.

**Given** the remediation is complete
**When** a skip inventory is generated
**Then** it reports skip sites grouped by reason and criticality
**And** an automated static check prevents new bare skips.

**Given** the read-only suite runs locally
**When** all mandatory fixtures are available
**Then** the critical smoke group completes with zero skips
**And** optional skips remain visible and justified.

## Implementation Steps

1. Verify canonical dependency/immutable `initial_status` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean `origin/main` base SHA.
2. Generate a classified inventory of the 30 bare skips and identify critical-fixture failures.
3. Replace every bare skip with condition plus reason, or with an asserted empty state; fail critical preflight prerequisites.
4. Add a static regression check and prove mandatory smoke runs with zero unexplained skips.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** A reason string is insufficient when the scenario is critical; required fixtures must fail the run.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `rg -n "test\.skip\(\s*\)" e2e`
- `npx playwright test --list`
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

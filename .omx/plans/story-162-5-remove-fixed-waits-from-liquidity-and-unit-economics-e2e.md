# OMX Story Plan 162.5: Remove Fixed Waits from Liquidity and Unit Economics E2E

## Requirements Summary

As a frontend developer,
I want liquidity and unit-economics tests synchronized to observable application state,
So that the two largest analytics specs are faster and deterministic.

- **Story ID:** 162.5
- **Epic:** 162-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.2, 162.3
- **Immutable `initial_status`:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> `initial_status` is plan-generation metadata only. Read and update current lifecycle state in `_bmad-output/implementation-artifacts/sprint-status.yaml` and the durable orchestration manifest; never mutate this field during story closeout.

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `.omx/plans/story-162-5-remove-fixed-waits-from-liquidity-and-unit-economics-e2e.md`
- `_bmad-output/implementation-artifacts/162-5-fe-liquidity-unit-economics-state-waits.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- `e2e/fixtures/story-162-5-analytics.ts`
- `e2e/liquidity.spec.ts`
- `e2e/unit-economics.spec.ts`
- `e2e/unit-economics-waterfall.spec.ts`
- `package.json`
- `scripts/check-e2e-fixed-waits.mjs`
- `scripts/manage-omx-story-plans.mjs`
- `src/test/e2e-fixed-waits.test.ts`

## Acceptance Criteria (canonical)

**Given** liquidity and unit-economics specs contain 58 `page.waitForTimeout()` calls
**When** synchronization is remediated
**Then** the owned-scope fixed-wait count becomes zero
**And** no equivalent arbitrary sleep helper is introduced.

**Given** a request drives loading, data, empty, or error UI
**When** the test performs the triggering action
**Then** it waits for the relevant response, loading-state transition, or stable locator
**And** uses a bounded timeout with an actionable failure message.

**Given** charts or animated components are under test
**When** visual data becomes available
**Then** tests wait for semantic chart containers, labels, or stable rendered values
**And** reduced-motion configuration is used where animation would otherwise create nondeterminism.

**Given** an interaction changes filters, pagination, or selected products
**When** the UI updates
**Then** a request-driven interaction verifies its exact method, path, query, and visible result
**And** a client-only interaction proves its visible or browser-state transition without inventing an API request
**And** does not assume completion after elapsed time.

**Given** the remediation is complete
**When** liquidity and unit-economics specs run repeatedly against prepared localhost fixtures
**Then** both complete without fixed sleeps or retry-only passes
**And** their runtime and failure evidence are recorded for comparison with the previous version.

## Implementation Steps

1. Verify canonical dependency/immutable `initial_status` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean `origin/main` base SHA.
2. Reconcile the historical 58-call baseline with the current 55 browser waits plus two timer-delayed route fixtures, and prove the static guard is RED before implementation.
3. Install exact-path deterministic GET fixtures, then use response predicates, visible/browser-state transitions, `page.emulateMedia({ reducedMotion: "reduce" })`, and bounded diagnostics; remove obsolete Liquidity tests for nonexistent search, pagination, and sticky-header behavior.
4. Add a fail-closed fixed-wait scanner with Vitest regression coverage, then run repeated targeted localhost executions and record historical/current-to-zero counts, runtime, and retry behavior.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Broad route globs can intercept page documents, live fallback can make retry tests self-heal, and network-idle can couple independent requests; fixtures must match exact GET API paths, fail closed, and wait only for the state under test.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `rg -n "page\.waitForTimeout\(|new Promise\([^\n]*setTimeout" e2e/liquidity.spec.ts e2e/unit-economics.spec.ts e2e/unit-economics-waterfall.spec.ts`
- `npm run check:e2e-waits`
- `npx vitest run src/test/e2e-fixed-waits.test.ts`
- `npm run test:e2e:full -- e2e/liquidity.spec.ts e2e/unit-economics.spec.ts e2e/unit-economics-waterfall.spec.ts --project=chromium --workers=1 --repeat-each=2 --retries=0`
- `npx eslint e2e/fixtures/story-162-5-analytics.ts e2e/liquidity.spec.ts e2e/unit-economics.spec.ts e2e/unit-economics-waterfall.spec.ts scripts/check-e2e-fixed-waits.mjs scripts/manage-omx-story-plans.mjs src/test/e2e-fixed-waits.test.ts --max-warnings=0`
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

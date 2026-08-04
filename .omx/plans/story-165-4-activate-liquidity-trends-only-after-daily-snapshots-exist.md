# OMX Story Plan 165.4: Activate Liquidity Trends Only After Daily Snapshots Exist

## Requirements Summary

As an inventory operator,
I want historical liquidity trends based on persisted daily snapshots,
So that I can see real movement between liquidity categories over time without synthetic history.

- **Story ID:** 165.4
- **Epic:** 165-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** Backend daily snapshots contract
- **Immutable `initial_status`:** deferred
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> `initial_status` is plan-generation metadata only. Read and update current lifecycle state in `_bmad-output/implementation-artifacts/sprint-status.yaml` and the durable orchestration manifest; never mutate this field during story closeout.

> Backend gate: do not create a feature branch/worktree until the dependency evidence in the acceptance criteria exists.

## Concrete Scope

- `src/lib/api/liquidity.ts`
- `src/hooks/useLiquidity.ts`
- `src/types/liquidity/distribution.ts`
- `src/app/(dashboard)/analytics/liquidity/`
- `src/mocks/handlers/liquidity-queries.ts`
- `e2e/liquidity.spec.ts`

## Acceptance Criteria (canonical)

**Given** the frontend trends client and hook are scaffolded but the live endpoint may return an empty series
**When** this story enters implementation
**Then** the backend dependency is considered satisfied only after a documented live response contains non-empty, dated daily snapshots across multiple dates
**And** the evidence identifies the persistence source and snapshot cadence.

**Given** the activation evidence is absent or the endpoint still returns only an empty series
**When** the story is evaluated
**Then** it remains deferred and the existing scaffolded/disabled state is preserved
**And** the frontend does not synthesize historical points from the current liquidity response.

**Given** valid daily snapshot history is available
**When** the operator opens liquidity analytics
**Then** a historical trends section renders the supported backend series and period controls
**And** labels, units, and dates match the documented response contract.

**Given** the optional trends request is loading, empty, malformed, or fails
**When** the rest of the liquidity page has current data
**Then** trends show an independent loading, unavailable, empty, or retry state
**And** existing liquidity summaries and tables remain usable.

**Given** activated trends are tested
**When** normalizer, hook, component, and localhost E2E coverage runs
**Then** it covers populated snapshots, gaps, empty history, malformed data, and request failure without fabricated values
**And** typecheck, zero-warning lint, formatting, and relevant static checks pass.

## Implementation Steps

1. Verify canonical dependency/immutable `initial_status` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean `origin/main` base SHA. Stop before branch creation when the backend gate is absent.
2. Before creating an implementation worktree, capture a live non-empty multi-date daily-snapshot response and backend persistence/cadence evidence.
3. If the gate passes, lock normalizer/hook/component behavior for populated, gaps, empty, malformed, and error states.
4. Activate the independent trends section without synthesizing history or blanking current liquidity content.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** This plan is deferred; an empty endpoint or undocumented persistence is a hard stop, not permission to fabricate data.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `npm test -- --run src/lib/api/liquidity src/app/\(dashboard\)/analytics/liquidity`
- `npx playwright test e2e/liquidity.spec.ts`
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

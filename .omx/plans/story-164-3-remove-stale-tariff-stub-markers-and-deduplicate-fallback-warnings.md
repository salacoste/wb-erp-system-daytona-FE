# OMX Story Plan 164.3: Remove Stale Tariff Stub Markers and Deduplicate Fallback Warnings

## Requirements Summary

As a frontend developer,
I want tariff extraction documentation and fallback logging to reflect the shipped implementation,
So that maintainers receive accurate guidance and actionable diagnostics without repeated noise.

- **Story ID:** 164.3
- **Epic:** 164-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.1
- **Immutable `initial_status`:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> `initial_status` is plan-generation metadata only. Read and update current lifecycle state in `_bmad-output/implementation-artifacts/sprint-status.yaml` and the durable orchestration manifest; never mutate this field during story closeout.

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `src/lib/tariff-extraction-utils.ts`
- `src/lib/tariff-system-utils.ts`
- `src/lib/logistics-tariff-helpers.ts`
- `src/hooks/supply-tariffs-helpers.ts`
- `src/hooks/supply-tariffs-lookup.ts`
- `src/hooks/__tests__/supply-tariffs-helpers.test.ts`
- `src/hooks/__tests__/supply-tariffs-lookup.test.ts`

## Acceptance Criteria (canonical)

**Given** storage-tariff extraction is already implemented and covered by tests
**When** its source documentation is cleaned up
**Then** stale "STUB FILE", "TDD Red Phase", and "to be implemented" markers are removed
**And** current fallback rules and data-source semantics are documented accurately.

**Given** multiple warehouse rows use the same fallback condition during one calculation
**When** supply tariffs are normalized
**Then** per-row warnings remain suppressed and one aggregate diagnostic is emitted
**And** the diagnostic includes the fallback count and a bounded, non-sensitive sample.

**Given** React renders or equivalent calculations repeat with the same logical tariff snapshot
**When** fallback diagnostics are evaluated again
**Then** identical warning noise is deduplicated through a bounded, testable mechanism
**And** a materially changed fallback snapshot can produce a new diagnostic.

**Given** tariff extraction is used outside the aggregate supply lookup
**When** invalid or zero-base data triggers a fallback
**Then** callers can retain the existing direct warning behavior unless they explicitly suppress it
**And** numeric fallback, coefficient preservation, and pallet zero-additional-rate behavior do not change.

**Given** the cleanup is tested
**When** tariff extraction and supply-lookup tests run
**Then** they lock warning counts, reset behavior, changed-signature behavior, and existing tariff results
**And** typecheck, zero-warning lint, formatting, and relevant static checks pass.

## Implementation Steps

1. Verify canonical dependency/immutable `initial_status` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean `origin/main` base SHA.
2. Lock tariff outputs and warning behavior with regression tests before removing stale markers.
3. Replace obsolete stub commentary with current semantics and aggregate repeated fallback warnings.
4. Add bounded signature-based deduplication tests while preserving direct-call warning behavior.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Deduplication must be bounded and resettable so materially changed fallback snapshots remain observable.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `rg -n "STUB FILE|TDD Red Phase|to be implemented" src`
- `npm test -- --run src/hooks/__tests__/supply-tariffs-helpers.test.ts src/hooks/__tests__/supply-tariffs-lookup.test.ts src/lib/__tests__/tariff-extraction-utils.test.ts`
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

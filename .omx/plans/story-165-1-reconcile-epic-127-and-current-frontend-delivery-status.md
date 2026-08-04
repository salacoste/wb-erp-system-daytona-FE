# OMX Story Plan 165.1: Reconcile Epic 127 and Current Frontend Delivery Status

## Requirements Summary

As a frontend maintainer,
I want active planning and status artifacts to match the implemented source,
So that completed work is not repeatedly treated as blocked or deferred.

- **Story ID:** 165.1
- **Epic:** 165-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.1
- **Immutable `initial_status`:** review — documentation prepared; merge and cleanup evidence pending
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> `initial_status` is plan-generation metadata only. Read and update current lifecycle state in `_bmad-output/implementation-artifacts/sprint-status.yaml` and the durable orchestration manifest; never mutate this field during story closeout.

> The documentation changes are prepared for review, but this story is not complete until its normal PR merge and cleanup evidence are recorded.

## Concrete Scope

- `_bmad-output/planning-artifacts/epics-127-fe.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `docs/EPICS-AND-STORIES-TRACKER.md`
- `docs/FRONTEND-WORK-SUMMARY.md`
- `src/lib/api/buyout-daily.ts`
- `src/hooks/use-buyout-daily.ts`
- `src/lib/api/returns-daily.ts`
- `src/hooks/use-returns-daily.ts`

## Acceptance Criteria (canonical)

**Given** buyout and returns daily API clients, normalizers, hooks, charts, page integration, and tests exist in source
**When** Epic 127 status is reconciled
**Then** Stories 127.1 and 127.2 are marked implemented or done rather than deferred
**And** the evidence references the delivered `GET /v1/analytics/buyout/daily` and `GET /v1/analytics/returns/daily` integrations.

**Given** Epic 127 contains six delivered stories
**When** its planning artifact, sprint status, tracker, and work summary are updated
**Then** each artifact reports six completed stories with no obsolete Requests #210/#211 blocker
**And** the epic's overall status remains internally consistent.

**Given** Epics 162-FE through 165-FE are the current approved debt-closure program
**When** active tracking is updated
**Then** all four epics and their story IDs are registered with accurate planned, deferred, or completed states
**And** no deferred backend-dependent story is presented as active implementation work.

**Given** status documentation changes are complete
**When** story-ID, status, and source-reference searches run
**Then** no active document retains the contradicted Epic 127 deferral claim
**And** documentation checks pass without rewriting historical archived records unnecessarily.

## Implementation Steps

1. Verify canonical dependency/immutable `initial_status` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean `origin/main` base SHA.
2. From the merged documentation-bootstrap base, independently verify the shipped buyout/returns clients, hooks, charts, integration, tests, and prepared status corrections; do not recreate the bootstrap edits.
3. Create a non-empty story-owned closeout diff that records Story 165.1 as done with its PR evidence in the mutable sprint registry, tracker, and work summary without editing historical archives or immutable plan-generation metadata.
4. Search for contradicted deferral claims and validate story/status consistency.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Status changes must cite source reality and preserve historical records that are explicitly archival.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `rg -n "127\.(1|2)|#210|#211|162\.|163\.|164\.|165\." _bmad-output/implementation-artifacts/sprint-status.yaml docs/EPICS-AND-STORIES-TRACKER.md docs/FRONTEND-WORK-SUMMARY.md`
- `npm run check:docs`
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

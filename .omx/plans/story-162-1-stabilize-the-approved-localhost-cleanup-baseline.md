# OMX Story Plan 162.1: Stabilize the Approved Localhost Cleanup Baseline

## Requirements Summary

As a frontend developer,
I want the validated localhost cleanup preserved as a clean, reviewable repository baseline,
So that later feature worktrees start from known-good code without mixing unrelated changes.

- **Story ID:** 162.1
- **Epic:** 162-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** None
- **Initial status:** done — merged by PR #86 at `4a24544d`
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> This story is complete. The plan records merge evidence and must not recreate the already merged cleanup.

## Concrete Scope

- `git commit 4a24544d`
- `PR #86`
- `_bmad-output/planning-artifacts/epics-162-165-fe.md`

## Acceptance Criteria (canonical)

**Given** the current primary worktree contains the approved 87-file localhost cleanup
**When** the cleanup diff and prior validation evidence are reviewed
**Then** only the approved cleanup files are included in its commit
**And** unrelated user changes are not staged, reverted, stashed, or deleted.

**Given** the cleanup commit is ready
**When** validation is rerun
**Then** typecheck, zero-warning lint, formatting, Vitest, privacy checks, and production build pass
**And** any unavailable live E2E prerequisite is recorded explicitly.

**Given** validation passes
**When** the cleanup branch is committed, pushed, and merged
**Then** the primary `main` worktree fast-forwards to `origin/main`
**And** the repository is clean before Epic 162 feature worktrees are created.

**Given** the cleanup merge is proven
**When** temporary branches or worktrees owned by that cleanup are inspected
**Then** they are removed without force
**And** `git worktree list --porcelain` shows only the canonical primary worktree.

## Implementation Steps

1. Verify the canonical dependency/status metadata above and record the exact clean `origin/main` base SHA.
2. Treat the merged localhost cleanup as immutable baseline evidence; do not recreate or amend it.
3. Confirm `main`, `origin/main`, the clean primary worktree, and the absence of leftover feature worktrees.
4. Record the merge SHA and validation evidence in active planning/status artifacts.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository. For this completed story, verify that cleanup already occurred.

## Risks and Mitigations

- **Story-specific risk:** Do not rewrite, recommit, or force-clean the already merged baseline.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `git status --short --branch`
- `git merge-base --is-ancestor 4a24544d origin/main`
- `git worktree list --porcelain`
- `git show --stat --oneline 4a24544d`
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

Stop after the existing merge and cleanup evidence is reconfirmed and all active status artifacts agree that Story 162.1 is done.

# OMX Story Plan 165.2: Align Local Development and Validation Guidance with Repository Reality

## Requirements Summary

As a frontend developer,
I want active setup, progress, and validation documentation to describe the current localhost project accurately,
So that I can run and assess the frontend without obsolete production or version assumptions.

- **Story ID:** 165.2
- **Epic:** 165-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.1, 165.1
- **Immutable `initial_status`:** review — documentation prepared; merge and cleanup evidence pending
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> `initial_status` is plan-generation metadata only. Read and update current lifecycle state in `_bmad-output/implementation-artifacts/sprint-status.yaml` and the durable orchestration manifest; never mutate this field during story closeout.

> The documentation changes are prepared for review, but this story is not complete until its normal PR merge and cleanup evidence are recorded.

## Concrete Scope

- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `docs/EPICS-AND-STORIES-TRACKER.md`
- `docs/FRONTEND-WORK-SUMMARY.md`
- `.cursorrules`
- `CLAUDE.md`
- `SETUP.md`
- `BMAD-QUICK-START.md`
- `README.md`
- `TROUBLESHOOTING.md`
- `docs/VALIDATION-PLAN.md`
- `docs/ux/IMPLEMENTATION-TZ.md`
- `e2e/README.md`
- `scripts/.check-docs-baseline.txt`
- `scripts/check-doc-citations.sh`

## Acceptance Criteria (canonical)

**Given** the current application uses Next.js 16, frontend port 3100, and backend port 3000
**When** active guidance including `.cursorrules` is corrected
**Then** obsolete Next.js 14 and backend port 3001 instructions are removed
**And** commands and URLs match the actual package scripts and localhost architecture.

**Given** the project is pre-production and tested locally
**When** setup and validation guidance is synchronized
**Then** localhost prerequisites, non-mutating defaults, and the approved local validation gates are prominent
**And** removed PM2, Tier-0, production certification, or CI-governance requirements are not reintroduced.

**Given** the current validated baseline is documented
**When** the frontend work summary and active guidance are updated
**Then** they record the verified unit-test, build, lint, typecheck, privacy, audit, and coverage evidence with its observation date
**And** unavailable live E2E prerequisites are stated explicitly rather than reported as a pass.

**Given** citation validation uses `scripts/.check-docs-baseline.txt` as its source of truth
**When** the validator documentation is reconciled
**Then** stale hard-coded baseline counts are corrected or replaced with instructions to derive the current count
**And** the exit code remains the authoritative pass/fail signal.

**Given** all active documentation edits are complete
**When** link, citation, framework-version, port, and prohibited-guidance searches run
**Then** the active guidance agrees with source and package metadata
**And** `npm run check:docs` and relevant documentation checks pass.

## Implementation Steps

1. Verify canonical dependency/immutable `initial_status` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean `origin/main` base SHA.
2. From the merged Story 165.1 base, independently verify the prepared framework-version, port, local-only, validation-baseline, and pre-production corrections; do not recreate the bootstrap edits.
3. Create a non-empty story-owned closeout diff that records Story 165.2 as done with its PR evidence in the mutable sprint registry, tracker, and work summary without changing immutable plan-generation metadata.
4. Confirm obsolete PM2, Tier-0, production-certification, and CI-governance instructions remain absent without touching generated OpenWiki pages.
5. Run citation/link validation and focused searches for stale versions, ports, and release assumptions.
6. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
7. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Generated OpenWiki content is intentionally handled by 165.3 and must not be hand-edited here.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `npm run check:docs`
- `rg -n "Next\.js 14|localhost:3001|PM2|Tier-0|production certification" .cursorrules CLAUDE.md README.md TROUBLESHOOTING.md docs/VALIDATION-PLAN.md e2e/README.md`
- `node -p "require('./package.json').dependencies.next"`
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

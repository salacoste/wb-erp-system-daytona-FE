# OMX Story Plan 164.4: Normalize Package Metadata and Enforce Zero-Warning Lint

## Requirements Summary

As a frontend developer,
I want package metadata and lint scripts to express one consistent dependency and warning policy,
So that local validation cannot hide metadata drift or accepted warnings.

- **Story ID:** 164.4
- **Epic:** 164-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.1, 164.1, 164.2, 164.3
- **Initial status:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `package.json`
- `package-lock.json`
- `eslint.config.js`

## Acceptance Criteria (canonical)

**Given** React and React DOM package metadata is audited
**When** the root manifest and lockfile are normalized
**Then** `react-dom` has exactly one required root runtime declaration and `@types/react-dom` has exactly one development declaration
**And** transitive peer references in the lockfile are not misclassified as duplicate root dependencies.

**Given** package metadata needs regeneration
**When** the lockfile is updated
**Then** it is produced by the repository's pinned npm version rather than edited manually
**And** `npm install --package-lock-only` or the equivalent reproducible command produces no unrelated dependency churn.

**Given** a fresh repository-wide ESLint run reports zero warnings
**When** the package scripts are updated
**Then** the obsolete `--max-warnings 112` allowance is replaced with a zero-warning policy for both `lint` and `lint:fix`
**And** the existing lint-staged zero-warning policy remains aligned.

**Given** the metadata cleanup is complete
**When** `npm ls react react-dom`, lockfile validation, npm audit, typecheck, lint, formatting, tests, and build run
**Then** the dependency tree is valid and all gates pass
**And** no runtime dependency or product behavior is removed merely to satisfy metadata checks.

## Implementation Steps

1. Verify the canonical dependency/status metadata above and record the exact clean `origin/main` base SHA.
2. Audit root React/React DOM declarations and record a clean zero-warning ESLint run.
3. Regenerate package metadata with the pinned npm version and replace the 112-warning allowance with zero.
4. Validate dependency tree, audit, lint, typecheck, tests, formatting, and build with no unrelated lockfile churn.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Lockfile regeneration can introduce unrelated churn; reject changes beyond the root metadata correction.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `npm ls react react-dom`
- `npm install --package-lock-only`
- `npm audit`
- `npm run lint`
- `npm run type-check`
- `npm run format:check`
- `npm test -- --run`
- `npm run build`
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

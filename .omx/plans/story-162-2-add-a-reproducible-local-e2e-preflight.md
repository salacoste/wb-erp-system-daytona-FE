# OMX Story Plan 162.2: Add a Reproducible Local E2E Preflight

## Requirements Summary

As a frontend developer,
I want one localhost E2E preflight command,
So that missing services, credentials, authentication, or fixtures fail early with actionable guidance.

- **Story ID:** 162.2
- **Epic:** 162-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.1
- **Immutable `initial_status`:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> `initial_status` is plan-generation metadata only. Read and update current lifecycle state in `_bmad-output/implementation-artifacts/sprint-status.yaml` and the durable orchestration manifest; never mutate this field during story closeout.

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `playwright.config.ts`
- `e2e/auth.setup.ts`
- `e2e/auth-manager.setup.ts`
- `e2e/orders-client-info.spec.ts`
- `e2e/fixtures/mutation-guard.ts`
- `e2e/README.md`
- `docs/qa/BROWSER-TESTING-WORKFLOW.md`
- `.omx/plans/story-162-*.md`
- `.env.e2e.example`
- `README.md`
- `package.json`
- `vitest.config.ts`
- `scripts/`
- `_bmad-output/implementation-artifacts/162-2-fe-add-a-reproducible-local-e2e-preflight.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Acceptance Criteria (canonical)

**Given** frontend `:3100` or backend `:3000` is unavailable
**When** the preflight runs
**Then** it exits non-zero before Playwright starts
**And** identifies the unavailable service without printing secrets.

**Given** `.env.e2e` is absent or required variables are empty
**When** the preflight runs
**Then** it lists the missing variable names
**And** links to corrected local setup instructions based on `.env.e2e.example`.

**Given** credentials are configured
**When** authentication setup runs
**Then** it creates fresh Playwright storage state through the live login flow
**And** does not rely on expired committed or ignored auth artifacts.

**Given** mutation variables are not explicitly acknowledged
**When** the default E2E command runs
**Then** mutating tests remain excluded
**And** the preflight reports that the run is read-only.

**Given** every prerequisite is available
**When** the preflight completes
**Then** it launches the bounded smoke command or prints the exact next command
**And** its own success and failure branches have automated tests.

**Given** a developer follows the E2E documentation from a fresh local checkout
**When** they configure the backend-seeded test user
**Then** all commands reference the correct repository and ports
**And** no frontend-local `npm run seed` command is documented unless that script exists.

## Implementation Steps

1. Verify canonical dependency/immutable `initial_status` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean `origin/main` base SHA.
2. Specify the localhost service, credential, auth-state, fixture, and mutation-policy preflight contract in executable tests.
3. Implement one effective environment, one explicit CI truth contract, and a fresh, random, cwd-bound local handshake; reject raw marker spoofing and `--no-deps` at the Playwright configuration boundary.
4. Wire active repository-owned Playwright commands through the preflight, remove collection-time Manager auth-file checks, fail closed on symlinked auth cleanup, and surface redacted temporary-handshake cleanup failures.
5. Exercise every success/failure branch and prove the default run remains read-only.
6. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
7. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** A preflight must fail closed without turning missing live services into a false test pass; validate and probe the same effective environment passed to the child while requiring every `.env.e2e` value, treat non-true CI values as local, and prevent accidental bypass with a short-lived random handshake plus configuration-level `--no-deps` rejection and surfaced cleanup failures.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `node --test scripts/e2e-preflight.test.mjs`
- `node scripts/e2e-preflight.mjs --help`
- `npm run test:e2e -- --list`
- `npm run type-check`
- `npx eslint 'src/**/*.{ts,tsx}' --max-warnings=0`
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

# OMX Story Plan 162.4: Replace Vacuous Operations and Settings E2E Assertions

## Requirements Summary

As a frontend developer,
I want operations and settings browser tests to verify concrete workflow states,
So that broken backfill, supply, COGS, and pricing behavior cannot appear green.

- **Story ID:** 162.4
- **Epic:** 162-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.2
- **Initial status:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `e2e/settings/backfill-admin.spec.ts`
- `e2e/backfill-page.spec.ts`
- `e2e/supply-planning.spec.ts`
- `e2e/supplies/`
- `e2e/cogs-assignment.spec.ts`
- `e2e/cogs-pages.spec.ts`
- `e2e/price-calculator.spec.ts`

## Acceptance Criteria (canonical)

**Given** the operations/settings E2E scope contains 36 tautological assertion sites
**When** the affected specs are remediated
**Then** all unconditional truth fallbacks are removed
**And** the owned-scope count becomes zero.

**Given** backfill administration has loading, empty, running, paused, failed, and permission-gated states
**When** its tests run
**Then** each test asserts its intended state explicitly
**And** a missing required control or status causes failure.

**Given** supplies and supply-planning flows depend on backend records
**When** deterministic seed data exists
**Then** lifecycle, detail, list, and accessibility tests assert the expected records and actions
**And** missing required seed data fails preflight rather than passing an empty assertion.

**Given** COGS assignment or price-calculator behavior is under test
**When** the UI submits or calculates data
**Then** the test verifies the visible result and relevant request/response outcome
**And** does not accept element absence as success.

**Given** a scenario is legitimately unavailable for the configured local fixture
**When** it cannot execute
**Then** it uses a conditional skip with a concrete reason
**And** remains visible in the Playwright report.

**Given** the remediation is complete
**When** targeted backfill, supplies, supply-planning, COGS, and price-calculator specs run
**Then** they pass against prepared localhost fixtures
**And** the global prohibited-assertion static check remains at zero findings.

## Implementation Steps

1. Verify the canonical dependency/status metadata above and record the exact clean `origin/main` base SHA.
2. Lock the owned 36-site inventory with a static regression check.
3. Replace each operations/settings truth fallback with explicit fixture, visible-state, and request/response assertions.
4. Run backfill, supplies, supply-planning, COGS, and calculator coverage and record `36 → 0`.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Mutating paths remain behind the sandbox acknowledgement guard and require deterministic fixtures.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `rg -n "expect\([^\n]*(\|\| true|>= 0)" e2e/settings e2e/backfill-page.spec.ts e2e/supply-planning.spec.ts e2e/supplies e2e/cogs-assignment.spec.ts e2e/cogs-pages.spec.ts e2e/price-calculator.spec.ts`
- `npx playwright test e2e/settings/backfill-admin.spec.ts e2e/backfill-page.spec.ts e2e/supply-planning.spec.ts e2e/supplies e2e/cogs-assignment.spec.ts e2e/cogs-pages.spec.ts e2e/price-calculator.spec.ts`
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

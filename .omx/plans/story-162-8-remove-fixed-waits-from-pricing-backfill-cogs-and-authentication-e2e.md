# OMX Story Plan 162.8: Remove Fixed Waits from Pricing, Backfill, COGS, and Authentication E2E

## Requirements Summary

As a frontend developer,
I want the remaining business-flow tests synchronized to explicit application events,
So that calculations, administrative states, assignments, login, and onboarding are deterministic.

- **Story ID:** 162.8
- **Epic:** 162-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.2, 162.4, 162.5, 162.6, 162.7
- **Initial status:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `e2e/pricing-page.spec.ts`
- `e2e/price-calculator*.spec.ts`
- `e2e/settings/backfill-admin.spec.ts`
- `e2e/backfill-page.spec.ts`
- `e2e/cogs-assignment.spec.ts`
- `e2e/login-dashboard.spec.ts`
- `e2e/onboarding.spec.ts`
- `e2e/orders-client-info.spec.ts`

## Acceptance Criteria (canonical)

**Given** the owned specs contain 46 fixed waits
**When** synchronization is remediated
**Then** their `page.waitForTimeout()` count becomes zero
**And** the repository-wide E2E fixed-wait count becomes zero.

**Given** price-calculator or pricing-page inputs trigger tariff and calculation requests
**When** values are submitted or changed
**Then** tests wait for the relevant request and visible calculation state
**And** verify outputs belong to the submitted inputs.

**Given** backfill controls trigger pause, resume, or retry behavior
**When** a permitted action completes
**Then** tests wait for the response and resulting status
**And** distinguish report and analytics states without assuming immediate completion.

**Given** COGS assignment, login, onboarding, order-client, or session behavior is under test
**When** navigation or submission occurs
**Then** tests wait for URL, authenticated storage, response, or rendered state
**And** do not use elapsed time as proof of completion.

**Given** all four synchronization stories are complete
**When** the E2E tree is statically scanned
**Then** no active `page.waitForTimeout()` remains
**And** any narrowly justified timing exception requires an inline rationale and explicit review approval.

**Given** the targeted specs run repeatedly against prepared localhost fixtures
**When** results are compared
**Then** no pass depends solely on Playwright retry
**And** the final before/after count records `247 → 0`.

## Implementation Steps

1. Verify the canonical dependency/status metadata above and record the exact clean `origin/main` base SHA.
2. Classify the remaining 46 waits by request, URL, auth storage, calculation, or visible terminal state.
3. Replace each wait with the corresponding bounded application event.
4. Run repeated targeted coverage and prove both owned `46 → 0` and repository-wide `247 → 0`.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Authentication and mutation tests must use fresh storage state and the existing explicit safety gate.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `rg -n "page\.waitForTimeout\(" e2e`
- `npx playwright test e2e/pricing-page.spec.ts e2e/price-calculator.spec.ts e2e/settings/backfill-admin.spec.ts e2e/backfill-page.spec.ts e2e/cogs-assignment.spec.ts e2e/login-dashboard.spec.ts e2e/onboarding.spec.ts e2e/orders-client-info.spec.ts --repeat-each=2`
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

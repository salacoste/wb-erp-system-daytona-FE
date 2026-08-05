# OMX Story Plan 162.3: Replace Vacuous Analytics and Finance E2E Assertions

## Requirements Summary

As a frontend developer,
I want analytics and finance browser tests to assert real user-visible outcomes,
So that a green result proves those workflows actually render and behave correctly.

- **Story ID:** 162.3
- **Epic:** 162-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.2
- **Immutable `initial_status`:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> `initial_status` is plan-generation metadata only. Read and update current lifecycle state in `_bmad-output/implementation-artifacts/sprint-status.yaml` and the durable orchestration manifest; never mutate this field during story closeout.

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `e2e/liquidity.spec.ts`
- `e2e/analytics/fbs-orders-analytics.spec.ts`
- `e2e/margin-analytics.spec.ts`
- `e2e/dashboard-metrics.spec.ts`
- `e2e/financial-summary.spec.ts`
- `e2e/unit-economics.spec.ts`
- `e2e/analytics/analytics-hub.spec.ts`
- `e2e/returns-analytics.spec.ts`
- `scripts/check-e2e-vacuous-assertions.mjs`
- `src/test/e2e-vacuous-assertions.test.ts`
- `package.json`
- `eslint.config.js`
- `scripts/manage-omx-story-plans.mjs`
- `.omx/plans/story-162-3-replace-vacuous-analytics-and-finance-e2e-assertions.md`

## Acceptance Criteria (canonical)

**Given** the analytics/finance E2E scope contains 52 tautological assertion sites
**When** the affected specs are remediated
**Then** every `expect(value || true)` and unconditional `expect(count >= 0)` pattern is removed
**And** the owned-scope count becomes zero.

**Given** a page can legitimately show data, empty, loading, or error states
**When** its test evaluates the result
**Then** it asserts one explicitly allowed state
**And** fails when none of those states is present.

**Given** a test claims that a required metric, chart, table, navigation link, or interaction exists
**When** that behavior is absent
**Then** the test fails with an actionable locator or assertion message
**And** does not convert the failure into a passing fallback.

**Given** backend data is optional for a non-critical scenario
**When** the expected fixture is unavailable
**Then** the test records a reasoned conditional skip or asserts the documented empty state
**And** critical smoke coverage does not silently pass.

**Given** the remediation is complete
**When** targeted Playwright specs for liquidity, FBS orders analytics, margin analytics, dashboard metrics, financial summary, unit economics, analytics hub, and returns analytics run
**Then** they pass against the prepared localhost fixtures
**And** an automated static check prevents reintroduction of the prohibited assertion patterns.

## Implementation Steps

1. Verify canonical dependency/immutable `initial_status` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean `origin/main` base SHA.
2. Lock the owned 52-site inventory with a static regression check.
3. Replace each vacuous assertion with an explicit data, empty, loading, error, navigation, or interaction expectation.
4. Run the owned specs against prepared localhost fixtures and record the `52 → 0` evidence.
5. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
6. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Optional data states must be asserted or explicitly skipped; absence must never be converted to success.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `rg -n "expect\([^\n]*(\|\| true|>= 0)" e2e/liquidity.spec.ts e2e/analytics e2e/margin-analytics.spec.ts e2e/dashboard-metrics.spec.ts e2e/financial-summary.spec.ts e2e/unit-economics.spec.ts e2e/returns-analytics.spec.ts`
- `npm run check:e2e-assertions`
- `npx vitest run src/test/e2e-vacuous-assertions.test.ts`
- `npm run test:e2e:full -- e2e/liquidity.spec.ts e2e/analytics/fbs-orders-analytics.spec.ts e2e/margin-analytics.spec.ts e2e/dashboard-metrics.spec.ts e2e/financial-summary.spec.ts e2e/unit-economics.spec.ts e2e/analytics/analytics-hub.spec.ts e2e/returns-analytics.spec.ts`
- `npx eslint e2e/liquidity.spec.ts e2e/analytics/fbs-orders-analytics.spec.ts e2e/margin-analytics.spec.ts e2e/dashboard-metrics.spec.ts e2e/financial-summary.spec.ts e2e/unit-economics.spec.ts e2e/analytics/analytics-hub.spec.ts e2e/returns-analytics.spec.ts src/test/e2e-vacuous-assertions.test.ts scripts/check-e2e-vacuous-assertions.mjs --max-warnings=0`
- `npx prettier --check e2e/liquidity.spec.ts e2e/analytics/fbs-orders-analytics.spec.ts e2e/margin-analytics.spec.ts e2e/dashboard-metrics.spec.ts e2e/financial-summary.spec.ts e2e/unit-economics.spec.ts e2e/analytics/analytics-hub.spec.ts e2e/returns-analytics.spec.ts src/test/e2e-vacuous-assertions.test.ts scripts/check-e2e-vacuous-assertions.mjs package.json eslint.config.js scripts/manage-omx-story-plans.mjs`
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

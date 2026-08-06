# OMX Story Plan 162.6: Remove Fixed Waits from Dashboard and Analytics E2E

## Requirements Summary

As a frontend developer,
I want dashboard and analytics tests synchronized to meaningful UI and network events,
So that period changes, charts, metrics, and navigation are validated without timing guesses.

- **Story ID:** 162.6
- **Epic:** 162-FE
- **Canonical source:** `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- **Dependencies:** 162.2, 162.3
- **Immutable `initial_status`:** backlog
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> `initial_status` is plan-generation metadata only. Read and update current lifecycle state in `_bmad-output/implementation-artifacts/sprint-status.yaml` and the durable orchestration manifest; never mutate this field during story closeout.

> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.

## Concrete Scope

- `.omx/plans/story-162-6-remove-fixed-waits-from-dashboard-and-analytics-e2e.md`
- `_bmad-output/implementation-artifacts/162-6-fe-dashboard-analytics-state-waits.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/planning-artifacts/epics-162-165-fe.md`
- `e2e/accessibility-merged-groups-epic-37.spec.ts`
- `e2e/analytics/ai-models.spec.ts`
- `e2e/analytics/analytics-hub.spec.ts`
- `e2e/analytics/analytics-pages-smoke.spec.ts`
- `e2e/analytics/fbs-orders-analytics.spec.ts`
- `e2e/analytics/forecast.spec.ts`
- `e2e/analytics/product-analytics.spec.ts`
- `e2e/analytics/search-analytics.spec.ts`
- `e2e/brand-analytics.spec.ts`
- `e2e/category-analytics.spec.ts`
- `e2e/dashboard-metrics.spec.ts`
- `e2e/dashboard-period.spec.ts`
- `e2e/dashboard-session-fixes.spec.ts`
- `e2e/financial-summary.spec.ts`
- `e2e/forecast-accuracy.spec.ts`
- `e2e/forecast-page.spec.ts`
- `e2e/margin-analytics.spec.ts`
- `e2e/merged-group-table-epic-37.spec.ts`
- `e2e/period-selection-month-test.spec.ts`
- `e2e/storage-analytics.spec.ts`
- `e2e/fixtures/dashboard-metrics-test-data.ts`
- `e2e/fixtures/period-test-data.ts`
- `e2e/fixtures/story-162-6-route-controller.ts`
- `e2e/fixtures/story-162-6-dashboard.ts`
- `e2e/fixtures/story-162-6-analytics.ts`
- `package.json`
- `scripts/check-e2e-fixed-waits.mjs`
- `scripts/manage-omx-story-plans.mjs`
- `src/test/e2e-fixed-waits.test.ts`

## Acceptance Criteria (canonical)

**Given** the immutable Story 162.6 planning baseline contains 67 fixed waits
**When** the current branch is inventoried after Story 162.3
**Then** the historical-to-current drift is recorded (`67` canonical, `65` current `page.waitForTimeout()` calls plus four timer-backed route fixtures)
**And** all 69 current fixed-wait findings become zero without introducing an arbitrary replacement sleep.

**Given** a period, filter, grouping, or route selection triggers data loading
**When** the test changes that selection
**Then** request-driven interactions wait for the exact method, path, query, status, and visible result
**And** client-only interactions prove their visible or browser-state transition without inventing a request
**And** dashboard order volume uses `GET /v1/analytics/orders/volume` with required `from`/`to` and applicable `aggregation`/`include_cogs` parameters rather than the obsolete `/analytics/orders-volume` fixture route
**And** period changes prove URL/local-storage selection plus query-specific rendered data.

**Given** dashboard cards and analytics charts load independently
**When** one request is delayed or fails
**Then** tests assert the intended independent loading, success, empty, or error state
**And** loading/error coverage proves the intercepted request plus a named terminal UI state
**And** timer-free deferred fixtures release in `finally`, fail every retry until explicitly allowed, and never wait for unrelated network idleness.

**Given** merged-group, FBS, margin, financial-summary, storage, category, brand, forecast, and analytics-hub coverage runs
**When** each interaction completes
**Then** assertions use stable roles, labels, test IDs, or response predicates
**And** obsolete FBS selectors and false-green optional/body-only fallbacks are deleted or replaced with source-backed observable behavior
**And** failures identify the missing state rather than timing out after a sleep.

**Given** the remediation is complete
**When** the exact 20-spec dashboard/analytics set runs twice with one worker and retries disabled against prepared localhost fixtures
**Then** it passes without retry-only success
**And** the union scanner preserves Story 162.5 coverage while reporting zero findings across both stories
**And** two fresh code-reviewer passes approve before the architect and verifier gates run
**And** historical/current/final counts plus runtime are recorded.

## Implementation Steps

1. Verify canonical dependency/immutable `initial_status` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean `origin/main` base SHA.
2. Lock immutable canonical `67`, reconcile it with `65` current browser waits plus four timer-backed route fixtures at base SHA `aee43c154e0b3ff494a6dc6ee3cacb34043765d9`, and prove the union fixed-wait scanner is RED with exactly `69` Story 162.6 findings while preserving Story 162.5 coverage.
3. Add modular fail-closed dashboard/analytics fixtures with exact GET/path/query validation, request attempt logs, deferred release gates, retry-success gates, and rejected-request reporting; replace request-driven waits with pre-registered response predicates and client-only waits with visible/browser-state transitions.
4. Use only `GET /v1/analytics/orders/volume` for order volume, require `from`/`to` plus applicable `aggregation`/`include_cogs`, and correct or delete the obsolete `DASHBOARD_API_ROUTES.ordersVolume` value `/analytics/orders-volume`; loading/error cases must prove the intercepted request plus named terminal UI state.
5. Use reduced motion for animated charts, prove period URL/localStorage plus selected-period data, delete obsolete FBS selector coverage and false-green optional/body-only fallbacks, and never use network-idle or Playwright clock as a substitute for observable UI state.
6. Run the exact 20-spec target twice with `--workers=1 --repeat-each=2 --retries=0`, record historical/current/final `67 / 65+4 / 0` evidence, runtime, skips, and zero retry-only success, then require two fresh code-reviewer approvals before fresh architect/verifier, PR, ancestry, and cleanup gates.
7. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
8. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.

## Risks and Mitigations

- **Story-specific risk:** Broad routes, the obsolete `/analytics/orders-volume` alias, missing order-volume query parameters, retry fallthrough, body-only assertions, obsolete selectors, and unrelated network-idle can all create false greens; fixtures must be exact, fail closed, retry-aware, independently releasable, and coupled to intercepted requests plus named terminal UI results.
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is `cleanup_blocked`, not complete.
- **Local-only scope:** validate against frontend `localhost:3100` and backend `localhost:3000`; do not deploy or add production/CI certification scope.

## Verification Steps

- `npm run check:e2e-waits`
- `npx vitest run src/test/e2e-fixed-waits.test.ts`
- `npm run check:e2e-assertions`
- `npm run test:e2e:full -- e2e/accessibility-merged-groups-epic-37.spec.ts e2e/analytics/ai-models.spec.ts e2e/analytics/analytics-hub.spec.ts e2e/analytics/analytics-pages-smoke.spec.ts e2e/analytics/fbs-orders-analytics.spec.ts e2e/analytics/forecast.spec.ts e2e/analytics/product-analytics.spec.ts e2e/analytics/search-analytics.spec.ts e2e/brand-analytics.spec.ts e2e/category-analytics.spec.ts e2e/dashboard-metrics.spec.ts e2e/dashboard-period.spec.ts e2e/dashboard-session-fixes.spec.ts e2e/financial-summary.spec.ts e2e/forecast-accuracy.spec.ts e2e/forecast-page.spec.ts e2e/margin-analytics.spec.ts e2e/merged-group-table-epic-37.spec.ts e2e/period-selection-month-test.spec.ts e2e/storage-analytics.spec.ts --project=chromium --workers=1 --repeat-each=2 --retries=0`
- `npm run type-check`
- `npx vitest run`
- `npx eslint e2e/accessibility-merged-groups-epic-37.spec.ts e2e/analytics/*.spec.ts e2e/brand-analytics.spec.ts e2e/category-analytics.spec.ts e2e/dashboard-*.spec.ts e2e/financial-summary.spec.ts e2e/forecast-accuracy.spec.ts e2e/forecast-page.spec.ts e2e/margin-analytics.spec.ts e2e/merged-group-table-epic-37.spec.ts e2e/period-selection-month-test.spec.ts e2e/storage-analytics.spec.ts e2e/fixtures/story-162-6-*.ts scripts/check-e2e-fixed-waits.mjs scripts/manage-omx-story-plans.mjs src/test/e2e-fixed-waits.test.ts --max-warnings=0`
- `npm run check:privacy`
- `npm run build -- --webpack`
- `node scripts/manage-omx-story-plans.mjs --check`
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

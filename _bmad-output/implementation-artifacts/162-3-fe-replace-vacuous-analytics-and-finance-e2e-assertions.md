# Story 162.3: Replace Vacuous Analytics and Finance E2E Assertions

Status: done

<!-- Note: This artifact is intentionally ignored by the repository-wide _bmad-output rule. Force-add this exact file when committing the story. -->

## Story

As a frontend developer,
I want analytics and finance browser tests to assert real user-visible outcomes,
so that a green result proves those workflows actually render and behave correctly.

## Acceptance Criteria

1. **Canonical assertion inventory reaches zero (AC1)**
   - **Given** the analytics/finance E2E scope contains 52 canonical tautological assertion sites
   - **When** the affected specs are remediated
   - **Then** every `expect(value || true)` and unconditional `expect(count >= 0)` pattern is removed
   - **And** the canonical owned-scope count becomes zero.

2. **Every legitimate UI state is explicit (AC2)**
   - **Given** a page can legitimately show data, empty, loading, or error states
   - **When** its test evaluates the result
   - **Then** it asserts one explicitly allowed state
   - **And** fails when none of those states is present.

3. **Required behavior fails closed (AC3)**
   - **Given** a test claims that a required metric, chart, table, navigation link, or interaction exists
   - **When** that behavior is absent
   - **Then** the test fails with an actionable locator or assertion message
   - **And** does not convert the failure into a passing fallback.

4. **Optional fixtures never create silent passes (AC4)**
   - **Given** backend data is optional for a non-critical scenario
   - **When** the expected fixture is unavailable
   - **Then** the test records a reasoned conditional skip or asserts the documented empty state
   - **And** critical smoke coverage does not silently pass.

5. **The remediation runs locally and stays enforced (AC5)**
   - **Given** the remediation is complete
   - **When** targeted Playwright specs for liquidity, FBS orders analytics, margin analytics, dashboard metrics, financial summary, unit economics, analytics hub, and returns analytics run
   - **Then** they pass against the prepared localhost fixtures
   - **And** an automated static check prevents reintroduction of the prohibited assertion patterns.

## Tasks / Subtasks

- [x] Task 1: Lock the complete vacuous-assertion contract before editing behavior (AC: #1, #5)
  - [x] Add a dependency-free `scripts/check-e2e-vacuous-assertions.mjs` scanner with an explicit allowlist of the eight owned specs and actionable `file:line` findings.
  - [x] Add `src/test/e2e-vacuous-assertions.test.ts` to prove the scanner catches `|| true`, direct `expect(true)`, `>= 0`, and `.toBeGreaterThanOrEqual(0)` variants, accepts meaningful assertions, ignores comments/strings, and fails closed for a missing configured file.
  - [x] Include the exact indirect regression `const flag = locator.count() >= 0; expect(flag).toBeTruthy()` and a meaningful `count > 0` negative control so the FBS variant cannot evade the guard.
  - [x] Wire `npm run check:e2e-assertions` in `package.json`; do not add a dependency or hide the check behind live credentials.
  - [x] Record both inventories: canonical `52 -> 0`, plus the full semantic baseline `57 -> 0` found in the same eight specs (49 `|| true`, 2 direct `expect(true)`, and 6 nonnegative-count assertion sites).
  - [x] Prove the guard fails against the baseline before remediation and passes only after every owned violation is removed.

- [x] Task 2: Replace liquidity and FBS false-green assertions (AC: #1-#4)
  - [x] In `e2e/liquidity.spec.ts`, replace all 14 semantic vacuities with exact page-shell, named metric/table, data, empty, loading, or error assertions.
  - [x] Keep `Ликвидность товаров` and the page shell non-skippable. Fixture-dependent benchmark, distribution, health, or liquidation-detail checks may skip only with a specific reason after the shell is proven.
  - [x] When a liquidation planner trigger exists, require the `Сценарии ликвидации` dialog and scope scenario, discount, and ROI expectations to it; if no qualifying row exists, use a reasoned conditional skip instead of a no-op branch.
  - [x] In `e2e/analytics/fbs-orders-analytics.spec.ts`, replace all 12 semantic vacuities with exact heading/tab/date-control and named section, chart, table, empty, loading, or error assertions.
  - [x] Require `Аналитика заказов FBS`, the named tabs, and `#orders-date-range`; a date-picker interaction must reveal a visible calendar/dialog and a tab interaction must prove its named destination state.

- [x] Task 3: Replace margin, financial-summary, and unit-economics false greens (AC: #1-#4)
  - [x] In `e2e/margin-analytics.spec.ts`, replace all 9 semantic vacuities, including the direct `expect(true)`, with exact view headings, selectors, named tables/charts, and documented terminal states.
  - [x] Require `Анализ маржинальности по времени`, its labeled selector, and `Динамика маржинальности` where claimed; data-only summary/detail assertions may skip only after their required page shell is proven.
  - [x] In `e2e/financial-summary.spec.ts`, replace all 8 semantic vacuities, including the direct `expect(true)`, and scope data assertions to named sections such as `Доходы`, `Расходы WB`, `Компенсации`, and `Итого к оплате`.
  - [x] Keep `/analytics`, `Аналитика`, and `Финансовая сводка за период` fail-closed. Navigation tests must click exact product/SKU links; they must not fall back to direct navigation.
  - [x] In `e2e/unit-economics.spec.ts`, replace all 3 fallback assertions. Require the `Юнит-экономика` shell, explicit data/empty/loading/error state, `Структура затрат` chart state where claimed, and a visible enabled CSV action where claimed.

- [x] Task 4: Replace dashboard, analytics-hub, and returns false greens (AC: #1-#4)
  - [x] In `e2e/dashboard-metrics.spec.ts`, replace all 8 semantic vacuities and reuse `waitForMetricsLoad` plus selectors from `e2e/fixtures/dashboard-metrics-test-data.ts` rather than adding broad body/card fallbacks.
  - [x] Comparison colors may skip only when the prepared data has no positive/negative fixture; otherwise require the exact class. Tooltip checks require a real chart point and visible Recharts tooltip. Focus checks must prove a nonzero outline or box shadow.
  - [x] In `e2e/analytics/analytics-hub.spec.ts`, require the exact `Заказы FBS` link, click it, and assert the destination URL; remove direct-`goto` recovery. Prove hover changes computed transform or box shadow.
  - [x] In `e2e/returns-analytics.spec.ts`, require the named `Сравнение периодов` switch, toggle it, assert checked state, and require the revealed comparison controls.

- [x] Task 5: Preserve adjacent story boundaries and safety contracts (AC: #2-#5)
  - [x] Do not sweep fixed `waitForTimeout()` calls owned by Stories 162.5 and 162.6 unless a targeted assertion cannot be made deterministic without a minimal local change.
  - [x] Do not perform the global conditional-skip cleanup owned by Story 162.9; only convert branches directly associated with these remediated assertions, and record remaining unrelated conditional branches for that story.
  - [x] Do not introduce `networkidle`, broad `body`/`main` existence checks, generic card/class counts, or catch-and-pass fallbacks.
  - [x] Preserve Story 162.2 preflight, setup-project dependencies, fresh auth handshake, read-only mutation policy, localhost-only URL guard, and privacy/redaction boundaries.
  - [x] Extend the existing flat ESLint TypeScript parser contract to the changed `e2e/**/*.ts` files without applying the 200-line source cap to legacy E2E specs; keep the story-local command at zero warnings.
  - [x] Add no dependency, application UI change, backend change, CI requirement, deployment behavior, production scope, or direct-main delivery.

- [x] Task 6: Validate, review, and deliver through a normal PR (AC: #1-#5)
  - [x] Run the scanner self-tests, the real static command, and a zero-match audit over the exact eight-file allowlist.
  - [x] Run Playwright discovery through `npm run test:e2e:full -- ... --list`, then run the eight owned specs against prepared frontend `localhost:3100` and backend `localhost:3000` fixtures through the same preflight-gated command. Final post-rebase live result: `191 passed`, `5` explicit fixture-aware skips, `0 failed`.
  - [x] Re-evaluate `.env.e2e`, seeded credentials, and localhost services instead of inheriting Story 162.2's prerequisite gap. All required Owner credentials and services were available for this story's live AC5 run; no `NOT_RUN_PREREQUISITES_UNMET` claim remains.
  - [x] Run targeted scanner/Vitest tests, typecheck, explicit zero-warning ESLint over every changed TS/JS/MJS file, formatting, relevant privacy/static checks, production build, and `git diff --check` using the pinned Node.js/npm versions.
  - [x] Obtain independent code-reviewer, architecture, and verifier verdicts; force-add this ignored story artifact, then deliver only through the current normal PR flow. Final verdicts: code review `APPROVE` with 0 blocking issues, architecture `CLEAR`, verifier `VERIFIED` for AC1-AC5.
  - [x] Assign post-merge ancestry, local-main fast-forward, local/remote branch removal, disposable-worktree removal, `git worktree prune`, and closure evidence to the leader-owned durable orchestration manifest so the feature commit does not preclaim post-merge facts.

## Dev Notes

### Implementation Readiness

- Story 162.2 is complete through PR #92. Story 162.3 branches from clean `origin/main` SHA `cc733289b03cb16d30dcdc54325e5b5b0b966d4f` in `codex/story-162-3-meaningful-analytics-e2e` at `/private/tmp/wb-repricer-story-162-3-frontend`.
- Immutable OMX plan metadata remains `initial_status: backlog`; current lifecycle state is `ready-for-dev` in `sprint-status.yaml` and must advance independently.
- The durable `.omx/orchestration/story-delivery-manifest.json` is leader-owned state in the primary repository only. It is not created, staged, or committed from this disposable worktree.
- The implementation scope is the eight owned E2E specs plus the minimum reusable static guard and workflow surfaces: `scripts/check-e2e-vacuous-assertions.mjs`, `src/test/e2e-vacuous-assertions.test.ts`, `package.json`, `eslint.config.js`, `scripts/manage-omx-story-plans.mjs`, and the regenerated Story 162.3 OMX plan.

### Inventory and Regression Contract

- Canonical plan inventory: 52 sites matched by the narrow `expect(... || true | >= 0)` contract.
- Full semantic inventory discovered before implementation: 57 assertion sites across the same scope. Per file: liquidity 14, FBS orders analytics 12, margin analytics 9, dashboard metrics 8, financial summary 8, unit economics 3, analytics hub 2, returns analytics 1.
- The extra five sites are two direct `expect(true)` assertions plus three additional nonnegative-count assertions expressed through a matcher or intermediate boolean. The completed guard must reject all families, not only reproduce the narrow canonical regex.
- A standalone scanner is preferred over embedding source inspection in a browser spec. It must parse or lex source sufficiently to avoid comment/string false positives, fail on a missing allowlisted file, and emit actionable file/line evidence.

### Required-State and Optional-Fixture Policy

- Required shell, route, heading, navigation, control, or claimed feature behavior is P0 and never skips. Missing required behavior must fail on a named role/text/test-id/URL assertion.
- Optional backend data may affect a detail assertion, not the required page shell. First prove the shell, then either assert an explicit data/empty/loading/error state or call `test.skip(condition, 'specific fixture reason')`.
- Do not accept `body`, generic `main`, arbitrary cards, or nonnegative DOM counts as evidence. Prefer named UI copy and roles already rendered by source.
- Reuse explicit valid-state patterns from `e2e/sku-analytics.spec.ts`, `e2e/storage-analytics.spec.ts`, `e2e/analytics/analytics-pages-smoke.spec.ts`, `e2e/funnel.spec.ts`, and `e2e/monitoring.spec.ts`.

### Scope Boundaries and Previous-Story Intelligence

- Story 162.2 made every normal Playwright command preflight-gated, preserves setup-project authentication dependencies, removes stale allowlisted auth state only after checks pass, rejects `--no-deps`, and keeps mutation tests excluded by default. Do not bypass or weaken these contracts.
- The default command is a bounded orders smoke; Story 162.3 must use `npm run test:e2e:full -- <owned specs>` for its targeted suite.
- Story 162.2 live AC3/live AC5 remained `NOT_RUN_PREREQUISITES_UNMET` because `.env.e2e`, frontend `localhost:3100/login`, and backend `localhost:3000/v1/health` were unavailable. Re-evaluate fresh runtime state; do not inherit or erase that evidence.
- Fixed waits remain later-story debt. This story must not become a broad synchronization, skip-policy, fixture-generation, or UI refactor.

### Testing Requirements

Minimum targeted evidence:

```bash
npm run check:e2e-assertions
npx vitest run src/test/e2e-vacuous-assertions.test.ts
rg -n "expect\\([^\\n]*(\\|\\| true|>= 0)|expect\\(true\\)|toBeGreaterThanOrEqual\\(0\\)" \
  e2e/liquidity.spec.ts \
  e2e/analytics/fbs-orders-analytics.spec.ts \
  e2e/margin-analytics.spec.ts \
  e2e/dashboard-metrics.spec.ts \
  e2e/financial-summary.spec.ts \
  e2e/unit-economics.spec.ts \
  e2e/analytics/analytics-hub.spec.ts \
  e2e/returns-analytics.spec.ts
npm run test:e2e:full -- \
  e2e/liquidity.spec.ts \
  e2e/analytics/fbs-orders-analytics.spec.ts \
  e2e/margin-analytics.spec.ts \
  e2e/dashboard-metrics.spec.ts \
  e2e/financial-summary.spec.ts \
  e2e/unit-economics.spec.ts \
  e2e/analytics/analytics-hub.spec.ts \
  e2e/returns-analytics.spec.ts
npm run type-check
npx eslint e2e/liquidity.spec.ts e2e/analytics/fbs-orders-analytics.spec.ts e2e/margin-analytics.spec.ts e2e/dashboard-metrics.spec.ts e2e/financial-summary.spec.ts e2e/unit-economics.spec.ts e2e/analytics/analytics-hub.spec.ts e2e/returns-analytics.spec.ts src/test/e2e-vacuous-assertions.test.ts scripts/check-e2e-vacuous-assertions.mjs --max-warnings=0
npm run format:check
npx prettier --check e2e/liquidity.spec.ts e2e/analytics/fbs-orders-analytics.spec.ts e2e/margin-analytics.spec.ts e2e/dashboard-metrics.spec.ts e2e/financial-summary.spec.ts e2e/unit-economics.spec.ts e2e/analytics/analytics-hub.spec.ts e2e/returns-analytics.spec.ts src/test/e2e-vacuous-assertions.test.ts scripts/check-e2e-vacuous-assertions.mjs package.json eslint.config.js scripts/manage-omx-story-plans.mjs
npm run check:privacy
npm run build
git diff --check
```

Playwright discovery is useful collection evidence but does not satisfy live AC5. If the local services/credentials remain unavailable, keep the exact gap explicit and do not claim the browser-facing criterion passed.

### Project Structure Notes

- Expected modifications: the eight owned E2E specs, `package.json`, `eslint.config.js`, `scripts/manage-omx-story-plans.mjs`, and `.omx/plans/story-162-3-replace-vacuous-analytics-and-finance-e2e-assertions.md`.
- Expected additions: `scripts/check-e2e-vacuous-assertions.mjs`, `src/test/e2e-vacuous-assertions.test.ts`, and this story artifact.
- Expected lifecycle modification: `_bmad-output/implementation-artifacts/sprint-status.yaml`.
- External leader-only update: the primary durable manifest records branch/worktree/review/merge/cleanup evidence and is never part of the PR.
- Keep source files within the enforced cap and test files within their configured cap. Prefer local helpers only where they reduce repeated state assertions without hiding which state passed.

### References

- [Source: `_bmad-output/planning-artifacts/epics-162-165-fe.md` - FR2, NFR2-NFR3, NFR8-NFR12, Epic 162, Story 162.3]
- [Source: `.omx/plans/story-162-3-replace-vacuous-analytics-and-finance-e2e-assertions.md` - dependency, scope, verification, risk, and stop condition]
- [Source: `_bmad-output/implementation-artifacts/162-2-fe-add-a-reproducible-local-e2e-preflight.md` - preflight, auth, mutation, validation, and delivery learnings]
- [Source: `e2e/sku-analytics.spec.ts`, `e2e/storage-analytics.spec.ts`, `e2e/analytics/analytics-pages-smoke.spec.ts`, `e2e/funnel.spec.ts`, and `e2e/monitoring.spec.ts` - explicit state and reasoned-skip precedents]
- [Source: `e2e/fixtures/dashboard-metrics-test-data.ts` and `e2e/dashboard-metrics.spec.ts` - dashboard selectors and existing helpers]
- [Source: `package.json`, `playwright.config.ts`, and `e2e/README.md` - preflight-gated commands and localhost contract]
- [Source: `CLAUDE.md` - no silent skips, no hard waits, graceful-degradation coverage, and live E2E expectation]

## Dev Agent Record

### Agent Model Used

- Context creation: Codex leader with delegated `explore`, `test-engineer`, and `architect` read-only analysis lanes.
- Implementation: Codex executor with bounded finance and dashboard E2E implementation lanes; leader retains independent review and delivery ownership.

### Debug Log References

- 2026-08-05: Story 162.3 context created from clean base `cc733289`; Story 162.2 dependency proven merged through PR #92.
- 2026-08-05: Canonical static inventory reproduced at 52 sites; independent semantic audit found 57 vacuous assertion sites in the same eight specs.
- 2026-08-05: Scanner TDD RED proved the unimplemented guard failed; GREEN finished with 4/4 focused Vitest cases and a baseline 57-site semantic inventory.
- 2026-08-05: Final pinned-runtime static evidence: Node `v24.18.0`, npm `11.11.0`; scanner `57 -> 0`, canonical audit `52 -> 0`, exact `rg` audit 0 matches, ESLint 0 warnings, typecheck/privacy/formatting/OMX parity/diff checks passed.
- 2026-08-05: Prepared local Owner credentials, frontend `localhost:3100`, backend `localhost:3000`, PostgreSQL, and Redis became available. The exact eight-spec preflight-gated run passed `193/3/0` before integration; after a conflict-free rebase onto PR #93, the fresh final run passed `191/5/0` in 1.9 minutes, with all five skips explicit and fixture-aware.
- 2026-08-05: Default Turbopack build was blocked by the disposable worktree's external `node_modules` symlink; the pinned-runtime production build passed with the supported `next build --webpack` path, including TypeScript and all 67 static pages.
- 2026-08-05: Review fixes completed: liquidity now waits for loading to disappear and skips only its stable documented empty state; seasonality/comparison include their exact error alerts; dashboard comparison skips wait for stable metric cards; scanner assignment tracking uses the latest complete RHS and supports explicit CLI paths.
- 2026-08-05: Post-review evidence: semantic baseline reproduced exactly at 57 (`14/12/9/8/8/3/2/1`) from base `cc733289`; current default allowlist reports 0; focused Vitest is 9/9, including multiline/type-annotated assignments, locator-count disjunctions, count-derived variables, latest reassignment, exact baseline ratchet, and false-positive controls.
- 2026-08-05: Final pinned gates passed on Node `v24.18.0` and npm `11.11.0`: scanner, Vitest, typecheck, zero-warning ESLint, source and story-scope Prettier, privacy, canonical zero-match audit, 25/25 OMX/BMad parity, `git diff --check`, and webpack production build with all 67 static pages.
- 2026-08-05: Independent final verdicts: code review `APPROVE` with 0 blocking issues, architecture `CLEAR`, and verifier `VERIFIED` for AC1-AC5.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Dedicated implementation context created with exact scope, full semantic ratchet, reusable state patterns, explicit adjacent-story boundaries, and local validation requirements.
- Added a dependency-free, fail-closed assertion scanner and regression suite covering direct, matcher, and indirect vacuity variants while ignoring comments and strings, honoring the latest complete assignment RHS, scanning the real default allowlist during Vitest, and accepting explicit CLI paths.
- Replaced all 57 semantic vacuities across the eight owned specs with exact page-shell, interaction, explicit terminal-state, and reasoned fixture-skip assertions.
- Hardened optional-fixture decisions so transient loading cannot become a skip: liquidity and dashboard wait for bounded stable states, while FBS seasonality/comparison recognize their exact documented error alerts.
- Preserved the Story 162.2 preflight/auth/mutation/privacy contracts and the later-story fixed-wait/conditional-skip boundaries; no dependency or application behavior changed.
- Local static, type, privacy, formatting, generator, diff, and webpack production-build gates pass. Live browser AC5 passes on the integrated base with `191 passed`, `5` explicit fixture-aware skips, and `0 failed`; no silent pass or prerequisite gap remains.

### File List

- `_bmad-output/implementation-artifacts/162-3-fe-replace-vacuous-analytics-and-finance-e2e-assertions.md` (added)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
- `.omx/plans/story-162-3-replace-vacuous-analytics-and-finance-e2e-assertions.md` (modified)
- `e2e/analytics/analytics-hub.spec.ts` (modified)
- `e2e/analytics/fbs-orders-analytics.spec.ts` (modified)
- `e2e/dashboard-metrics.spec.ts` (modified)
- `e2e/financial-summary.spec.ts` (modified)
- `e2e/liquidity.spec.ts` (modified)
- `e2e/margin-analytics.spec.ts` (modified)
- `e2e/returns-analytics.spec.ts` (modified)
- `e2e/unit-economics.spec.ts` (modified)
- `eslint.config.js` (modified)
- `package.json` (modified)
- `scripts/check-e2e-vacuous-assertions.mjs` (added)
- `scripts/manage-omx-story-plans.mjs` (modified)
- `src/test/e2e-vacuous-assertions.test.ts` (added)

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-05 | Created implementation-ready Story 162.3 context from the merged Story 162.2 baseline; canonical 52-site and full 57-site semantic inventories recorded. |
| 2026-08-05 | Replaced all 57 semantic false greens across eight analytics/finance E2E specs, added the zero-vacuity ratchet and parser coverage, and moved the story to review with the live prerequisite gap explicit. Lesson: exact named shells plus explicit terminal states make optional-fixture coverage honest without weakening required behavior. |
| 2026-08-05 | Addressed code and architecture review findings for stable terminal-state waits, exact FBS error states, latest-RHS scanner precision, normal-suite allowlist enforcement, and reusable CLI paths. Lesson: conditional skips are trustworthy only after transient loaders disappear, and source guards need both positive regressions and realistic false-positive controls. |
| 2026-08-05 | Closed Story 162.3 with an exact 57-site scanner ratchet, final post-rebase localhost result of 191 passed / 5 explicit skips / 0 failed, green pinned static and webpack-build gates, code review APPROVE, architecture CLEAR, and verifier VERIFIED; post-merge ancestry and cleanup evidence remains leader-owned in the durable manifest. |

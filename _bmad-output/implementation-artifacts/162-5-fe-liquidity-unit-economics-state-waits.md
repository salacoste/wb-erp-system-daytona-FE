# Story 162.5: Remove Fixed Waits from Liquidity and Unit Economics E2E

Status: done

<!-- Note: This artifact is intentionally ignored by the repository-wide _bmad-output rule. Force-add this exact file when committing the story. -->

## Story

As a frontend developer,
I want liquidity and unit-economics tests synchronized to observable application state,
so that the two largest analytics specs are faster and deterministic.

## Acceptance Criteria

1. **Given** the canonical Story 162.5 baseline contains 58 `page.waitForTimeout()` calls across the owned liquidity and unit-economics specs, **when** the current branch is inventoried after Story 162.3, **then** the historical-to-current drift is recorded (`58` canonical, `55` currently present after predecessor edits) and every remaining owned `page.waitForTimeout()` becomes observable synchronization, with a final owned count of zero and no arbitrary sleep helper introduced.
2. **Given** a request drives loading, data, empty, or error UI, **when** the test performs the triggering action, **then** it waits for the relevant response, loading-state transition, or stable locator using a bounded timeout and an actionable failure message.
3. **Given** charts or animated components are under test, **when** visual data becomes available, **then** tests use reduced motion and wait for semantic chart containers, labels, stable SVG content, or other observable rendered values rather than elapsed time.
4. **Given** an interaction changes filters, sorting, pagination, refresh state, or a selected product, **when** the UI updates, **then** a request-driven interaction verifies its exact method/path/query and visible result, while a client-only interaction proves its visible or browser-state transition without inventing an API request.
5. **Given** route interception is used to exercise loading behavior, **when** a response is released, **then** the test controls that release through an observed loading state or request handshake rather than a timer-based `setTimeout()` delay.
6. **Given** the remediation is complete, **when** the three owned specs run repeatedly against the prepared localhost fixtures, **then** they complete without fixed sleeps, retry-only passes, or silent false-green fallbacks, and before/after counts plus runtime and retry evidence are recorded.

## Tasks / Subtasks

- [x] Task 1: Establish the regression baseline and deterministic state map (AC: 1, 5)
  - [x] Record clean base SHA, dependency status, canonical `58` baseline, current `55` `page.waitForTimeout()` count, and the two existing timer-delayed route handlers.
  - [x] Classify every wait by initial load, request refresh, filter/sort/pagination, dialog/selection, animation/render, navigation, or controlled loading-fixture behavior.
  - [x] Add a fail-closed scanner and Vitest regression suite that mask comments/strings, reject browser waits, timer-backed Promises, and sleep helpers, and fail when any configured target is missing.
  - [x] Prove the scanner is RED against the pre-change owned specs before implementation and GREEN only after all arbitrary timers are removed.
- [x] Task 2: Replace Liquidity fixed waits (AC: 1, 2, 4, 5)
  - [x] Add immutable exact-GET fixtures and small spec-local helpers for shell plus explicit data/empty/error terminal states; reuse `TIMEOUTS` and current semantic locators.
  - [x] Treat category selection and every sort as request-driven/hybrid: verify exact `category_filter`, `sort_by`, and `sort_order` queries plus deterministic row/badge results.
  - [x] Synchronize row expansion and liquidation-dialog actions through concrete table/dialog changes.
  - [x] Delete obsolete conditional tests for nonexistent Liquidity search, pagination, vertical scrolling, and sticky-header behavior; do not implement those product features.
  - [x] Exercise loading, error, empty, and retry states with fail-closed exact-path route handlers, corrected direct response envelopes, retry-aware behavior, and timer-free controlled release.
- [x] Task 3: Replace Unit Economics fixed waits (AC: 1, 2, 3, 4, 5)
  - [x] Add exact-GET fixtures, spec-local shell/terminal-state helpers, and guard-compatible reduced motion via `page.emulateMedia({ reducedMotion: 'reduce' })` before navigation.
  - [x] Synchronize week/view changes, revenue/margin sort, refresh, and navigation with exact `/v1/analytics/unit-economics` query predicates plus deterministic visible markers.
  - [x] Treat delivery sort, status filtering, row/waterfall selection, CSV, and pagination as client-only or hybrid as implemented; prove visible/browser state without inventing requests.
  - [x] Synchronize waterfall rendering, sticky header, error, empty, retry, and responsive behavior with semantic locators or stable browser state.
  - [x] Reuse the deterministic COGS-over-100 fixture in the waterfall negative-domain regression, preserve bounded `expect.poll()`, and remove its live-data conditional skip.
- [x] Task 4: Remove false-green timing fallbacks only where required by synchronization (AC: 2, 4, 6)
  - [x] Replace optional `if (isVisible/count)` branches that would let a claimed interaction pass without executing with explicit fixture-aware skip or required-state assertions.
  - [x] Do not broaden into the repository-wide skip-policy work owned by Story 162.9 or unrelated application/backend refactors.
- [x] Task 5: Validate repeatability and close the story (AC: 1-6)
  - [x] Prove `npm run check:e2e-waits` and its Vitest suite pass with zero browser waits, timer-backed Promises, or arbitrary sleep helpers in owned specs.
  - [x] Run both main specs and the waterfall regression repeatedly with Playwright retries disabled; record pass/skip/fail totals, runtime, and absence of retry-only success.
  - [x] Run typecheck, zero-warning scoped ESLint, Prettier, privacy, production build, OMX/BMad parity, and `git diff --check`.
  - [x] Complete fresh code-reviewer, architect, and verifier gates; resolve every blocking finding.
  - [x] Hand off normal PR merge, ancestry proof, local-main fast-forward, and branch/worktree cleanup to the orchestrator-owned delivery manifest; do not claim those external delivery actions in this feature artifact.

## Dev Notes

### Baseline and Scope

- Canonical planning captured `58` `page.waitForTimeout()` calls before Story 162.3. Current `origin/main` has `55`: `33` in `e2e/liquidity.spec.ts`, `22` in `e2e/unit-economics.spec.ts`, and `0` in `e2e/unit-economics-waterfall.spec.ts`. Story 162.3 removed three Liquidity waits while replacing false-green assertions; this is expected predecessor drift, not a reason to rewrite the immutable epic baseline.
- The two main specs also contain one timer-delayed `page.route()` handler each. They are intentional loading-state fixtures, but acceptance requires timer-free control rather than replacing browser sleeps with Node sleeps.
- Owned scope includes the three E2E specs, one deterministic analytics fixture, the fixed-wait scanner and its Vitest coverage, the package script, the correlated OMX generator/plan, and lifecycle/canonical artifacts. Product UI, shared runtime fixtures, backend code, and unrelated E2E specs remain out of scope.

### Deterministic Synchronization Rules

- Use `Promise.all([page.waitForResponse(predicate), action])` only for requests the action actually triggers. Predicates must validate exact localhost API pathname, `GET`, relevant query parameters, and status; broad `**/liquidity**` or `**/unit-economics**` routes are prohibited because they can intercept page documents. Never use `networkidle` because both pages background-poll.
- For client-side-only interactions, snapshot a meaningful value (selected card state, row order/identity, dialog visibility, pagination label, selected SKU/chart content) and assert the intended transition. A visible `<body>` is not completion evidence.
- Loading/data/empty/error branches must converge on explicitly documented terminal locators after transient `.animate-pulse` elements disappear. Unexpected error states fail; fixture absence uses a reasoned report-visible skip only where the story does not require that fixture.
- Prefer Playwright auto-waiting assertions and `expect.poll()` with bounded messages over manual polling loops. Do not introduce `waitForLoadState('networkidle')`, generic sleep helpers, or timeout increases that merely hide races.
- Call `await page.emulateMedia({ reducedMotion: 'reduce' })` before navigation in chart-bearing specs. Do not use guarded `test.use({ reducedMotion: ... })`, which the shared network fixture rejects. Verify chart semantics through accessible names, labels, or stable SVG text/content.
- Deterministic fixture routes accept only the intended `GET` API path/query, return direct `{ meta, summary, data }` envelopes compatible with `skipDataUnwrap`, stub `/v1/shipment-cost/by-sku` deterministically, and fail immediately on unexpected traffic. Error fixtures must fulfill every TanStack retry until a handler-local success gate is flipped immediately before the Retry click; they never fall through to live data.
- Loading fixtures use a deferred Promise gate: observe the API request, assert the skeleton, release the response in `finally`, then assert skeleton disappearance and an explicit terminal state. No delay is based on elapsed time.
- Preserve the guarded localhost transport, authentication setup, and mutation defaults established by Story 162.2. This story is read-only E2E work.

### Previous-Story Intelligence

- Story 162.2 requires the local E2E preflight/auth handshake and blocks direct dependency bypass. Validation commands must run through the approved scripts or an explicitly proven equivalent environment.
- Story 162.3 established `expectLiquidityFixture()`-style terminal-state checks and removed three historical waits while repairing analytics false-greens. Reuse those semantics, but do not weaken its 57-site prohibited-assertion scanner baseline.
- Story 162.4 showed that route fixtures must fail closed; unexpected method/path/query combinations must not `fallback()` into localhost. Its scope-lock and two-fresh-review discipline remains mandatory.
- `e2e/unit-economics-waterfall.spec.ts` is already the reference pattern: element-presence waits, `expect.poll()`, explicit conditional skip, and no hard wait.

### Testing Requirements

Minimum targeted evidence:

```bash
rg -n "page\\.waitForTimeout\\(|setTimeout\\(" \
  e2e/liquidity.spec.ts e2e/unit-economics.spec.ts e2e/unit-economics-waterfall.spec.ts
npm run test:e2e:full -- \
  e2e/liquidity.spec.ts e2e/unit-economics.spec.ts e2e/unit-economics-waterfall.spec.ts \
  --project=chromium --workers=1 --retries=0
npm run type-check
npm run check:e2e-waits
npx vitest run src/test/e2e-fixed-waits.test.ts
npx eslint e2e/liquidity.spec.ts e2e/unit-economics.spec.ts \
  e2e/unit-economics-waterfall.spec.ts e2e/fixtures/story-162-5-analytics.ts \
  scripts/check-e2e-fixed-waits.mjs scripts/manage-omx-story-plans.mjs \
  src/test/e2e-fixed-waits.test.ts --max-warnings=0
npm run format:check
npm run check:privacy
npm run build -- --webpack
node scripts/manage-omx-story-plans.mjs --check
git diff --check
```

Run the owned Playwright set at least twice from a prepared localhost environment. `--list` proves collection only and cannot satisfy browser acceptance. Capture unpiped Playwright exit status and report explicit skips separately from passes.

### Project Structure Notes

- Expected test modifications: `e2e/liquidity.spec.ts`, `e2e/unit-economics.spec.ts`, `e2e/unit-economics-waterfall.spec.ts`, and `e2e/fixtures/story-162-5-analytics.ts`.
- Expected guard modifications: `scripts/check-e2e-fixed-waits.mjs`, `src/test/e2e-fixed-waits.test.ts`, and `package.json`.
- Expected parity/canonical modifications: `scripts/manage-omx-story-plans.mjs`, the generated Story 162.5 OMX plan, and `_bmad-output/planning-artifacts/epics-162-165-fe.md`.
- Expected lifecycle modifications: this story artifact and `_bmad-output/implementation-artifacts/sprint-status.yaml`.
- External leader-only modification: `.omx/orchestration/story-delivery-manifest.json` records branch, worktree, review, merge, ancestry, and cleanup evidence and must never enter the feature PR.
- No dependency, production configuration, generated OpenWiki, backend, or product-UI change is authorized by this story.

### References

- [Source: `_bmad-output/planning-artifacts/epics-162-165-fe.md` - Epic 162, Story 162.5 and execution metadata]
- [Source: `.omx/plans/story-162-5-remove-fixed-waits-from-liquidity-and-unit-economics-e2e.md` - scope, validation, risks, and stop condition]
- [Source: `_bmad-output/implementation-artifacts/162-3-fe-replace-vacuous-analytics-and-finance-e2e-assertions.md` - analytics terminal-state and predecessor drift patterns]
- [Source: `_bmad-output/implementation-artifacts/162-4-fe-replace-vacuous-operations-and-settings-e2e-assertions.md` - fail-closed fixture, review, and delivery lessons]
- [Source: `e2e/fixtures/network-test.ts`, `e2e/fixtures/test-data.ts`, and `playwright.config.ts` - transport guard, route/timeouts, auth, retries, and localhost configuration]
- [Source: `e2e/liquidity.spec.ts`, `e2e/unit-economics.spec.ts`, and `e2e/unit-economics-waterfall.spec.ts` - current owned waits and reference polling pattern]
- [Source: `src/app/(dashboard)/analytics/liquidity/page.tsx`, `src/hooks/useLiquidity.ts`, and `src/lib/api/liquidity.ts` - Liquidity state and request semantics]
- [Source: `src/app/(dashboard)/analytics/unit-economics/page.tsx`, `useUnitEconomicsPageState.ts`, and `src/hooks/useUnitEconomics.ts` - Unit Economics state, interactions, and request semantics]

## Dev Agent Record

### Agent Model Used

- Story context: Codex leader with delegated OMX `explore` and `test-engineer` read-only analysis lanes.
- Implementation and delivery: Codex leader orchestrating bounded `executor`, `code-reviewer`, `architect`, and `verifier` lanes.

### Debug Log References

- 2026-08-05: Story context created from clean `origin/main` base `5c88e307`; dependencies 162.2 and 162.3 are complete.
- 2026-08-05: Canonical `58` wait baseline reconciled with current `55` browser sleeps after Story 162.3 plus two timer-delayed loading route fixtures.
- 2026-08-05: Static RED audit exited `1` and listed all `55` `page.waitForTimeout()` calls plus both timer-backed route delays.
- 2026-08-05: The implementation-readiness architecture review initially blocked narrow scope and ambiguous interaction contracts; all required context, scope, fixture, scanner, reduced-motion, and obsolete-test corrections were applied, then the pre-implementation context was cleared with OMX/BMad parity `25/25`. This preceded the separately completed final architecture gate.
- 2026-08-05: The final fail-closed scanner covered all four configured targets and reported zero findings; its Vitest suite passed `27/27`, including missing-target, template, alias, lexical-scope, call-form, and assigned/returned/property deferred-closure propagation cases.
- 2026-08-05: Pre-review repeated Playwright passed `49`, reported `1` optional Manager-fixture skip, failed `0`, and completed in `1.2m` with retries disabled.
- 2026-08-05: Review exposed visible sort-result, route-family, scanner data-flow, and exact Unit Economics retry-query gaps; bounded regressions were added before the implementation was revalidated.
- 2026-08-05: Post-review repeated Playwright with `--workers=1 --retries=0` passed `53`, reported `1` optional Manager-fixture skip, failed `0`, and completed in `5.4m`; the focused exact-week retry aggregate passed `17`, reported `1` optional skip, and included `14` owned cases.
- 2026-08-05: Repository validation passed full Vitest (`1,058` files, `17,454` tests), typecheck, zero-warning scoped ESLint, scoped Prettier, the 19-file vacuous-assertion guard, privacy over `3,243` files, webpack production build with `67` pages, OMX/BMad parity `25/25`, and `git diff --check`.
- 2026-08-05: Two independent final code-reviewer passes returned `APPROVE`; the story advanced to `review`, not `done`, while final architecture and verifier checks continued.
- 2026-08-06: Final architecture review returned `BLOCK` because the Liquidity descending velocity sort asserted its marker without synchronizing the hybrid request. The fix added an exact `GET /v1/analytics/liquidity` waiter with `sort_by=turnover_days` and `sort_order=desc`, then proved the deterministic marker and `LQ-001` first row.
- 2026-08-06: Fresh Liquidity verification passed all `20/20` owned cases; the aggregate passed `23`, reported `1` optional skip, and failed `0`. Architecture re-review returned `CLEAR`, and the independent verifier returned `VERIFIED`.
- 2026-08-06: Approval lifecycle closed after two code-reviewer `APPROVE` verdicts, architecture `CLEAR`, and verifier `VERIFIED`; lifecycle advanced `review -> done` before feature commit. Normal PR delivery, ancestry, and cleanup remain external orchestrator evidence.

### Implementation Plan

- Add fail-closed exact-path analytics fixtures and a comment/string-aware fixed-wait scanner with RED/GREEN regression coverage.
- Rewrite Liquidity and Unit Economics E2E around explicit terminal states, exact request predicates, deterministic client-state transitions, and timer-free deferred loading gates.
- Use the deterministic COGS-over-100 fixture for waterfall coverage, then prove repeatability with retries disabled before fresh adversarial reviews.

### Completion Notes List

- Dedicated implementation-ready context records historical drift, exact scope, observable synchronization rules, regression-first evidence, local validation, review, PR, and cleanup requirements.
- Removed all `55` remaining browser waits and both timer-backed route delays from the owned scope; the final scanner reports zero findings across all four configured targets without introducing an arbitrary sleep helper.
- Replaced Liquidity and Unit Economics elapsed-time synchronization with exact GET/query/status predicates, visible deterministic results, client-state transitions, reduced motion, semantic rendering evidence, and deferred loading gates.
- Deleted obsolete Liquidity search, pagination, scrolling, and sticky-header tests instead of emulating nonexistent product behavior; the waterfall regression now uses deterministic COGS-over-100 data without a live-data conditional skip.
- Hardened route fixtures to fail closed on bounded path families, made error fixtures retry-aware, and added negative route cases so unexpected method/path/query traffic cannot leak into localhost.
- Hardened the wait scanner through target, template, alias, AST call-form, lexical scope/order, and assigned/returned/property deferred-closure regressions; `27/27` scanner tests pass and all `4/4` targets remain at zero.
- Repeated localhost Playwright is green without retries: pre-review `49` pass / `1` optional skip / `0` fail; post-review `53` pass / `1` optional skip / `0` fail; focused exact-week retry aggregate `17` pass / `1` optional skip with `14` owned cases.
- Full local gates passed: Vitest `1,058` files / `17,454` tests; typecheck; zero-warning scoped ESLint; scoped Prettier; 19-file vacuous-assertion guard; privacy `3,243`; webpack build `67` pages; OMX/BMad parity `25/25`; clean diff check.
- Final review verdicts are code-reviewer `APPROVE`, architecture `CLEAR`, and verifier `VERIFIED`; all blocking findings are resolved.
- The post-architecture Liquidity rerun passed `20/20` owned cases, and its aggregate passed `23` with `1` optional skip and `0` failures.
- Approval lifecycle is complete and the story is `done`. Normal PR merge, ancestry proof, local-main fast-forward, and branch/worktree cleanup are tracked only in the external leader-owned manifest and are not claimed here.

### Post-1st-pass-review fixes (2026-08-05)

- Made Liquidity sort assertions prove the expected first-row identity and velocity instead of relying on control state alone.
- Replaced permissive route matching with bounded fail-closed Liquidity and Unit Economics route families and added negative method/path/query coverage.
- Extended the scanner from target/template/alias masking through AST call-form detection and scope/order-aware deferred-closure propagation.
- Tightened the Unit Economics retry assertion to the exact requested week query and clarified the deterministic waterfall regression comment.

### Post-2nd-pass-review fixes (2026-08-05)

- Added assigned, returned, and property-carried deferred-closure scanner propagation regressions and kept all lexical/template/alias cases green.
- Re-ran the exact-week retry coverage and the complete repeated owned Playwright set with one worker and retries disabled.
- Updated this BMAD artifact with the complete local validation, two independent `APPROVE` verdicts, final-gate boundary, and exact 12-file implementation inventory.
- Resolved the final architect `BLOCK` by coupling the descending velocity interaction to the exact `GET /v1/analytics/liquidity?sort_by=turnover_days&sort_order=desc` waiter, deterministic sort marker, and `LQ-001` first-row result.
- Re-ran Liquidity successfully (`20/20` owned; aggregate `23` pass / `1` optional skip / `0` fail) before architecture re-review and independent verification.

### Senior Developer Review (AI)

- Outcome: APPROVE.
- Two independent final code-reviewer passes approved the implementation after the sort-result, fail-closed route-family, scanner data-flow, retry-query, waterfall-comment, and artifact-evidence findings were resolved.
- Final verdicts: code-reviewer `APPROVE`, architecture `CLEAR`, verifier `VERIFIED`.
- No PR merge, ancestry proof, local-main fast-forward, branch cleanup, or worktree cleanup is claimed.

### File List

- `.omx/plans/story-162-5-remove-fixed-waits-from-liquidity-and-unit-economics-e2e.md` (modified)
- `_bmad-output/implementation-artifacts/162-5-fe-liquidity-unit-economics-state-waits.md` (added)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
- `_bmad-output/planning-artifacts/epics-162-165-fe.md` (modified)
- `e2e/fixtures/story-162-5-analytics.ts` (added)
- `e2e/liquidity.spec.ts` (modified)
- `e2e/unit-economics.spec.ts` (modified)
- `e2e/unit-economics-waterfall.spec.ts` (modified)
- `package.json` (modified)
- `scripts/check-e2e-fixed-waits.mjs` (added)
- `scripts/manage-omx-story-plans.mjs` (modified)
- `src/test/e2e-fixed-waits.test.ts` (added)

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-05 | Created implementation-ready Story 162.5 context from clean `origin/main`; reconciled canonical 58-site baseline with the current 55 browser waits and two timer-controlled loading fixtures. |
| 2026-08-05 | Replaced all owned fixed waits and timer-backed route delays with observable state synchronization, deterministic analytics fixtures, and a fail-closed four-target scanner. |
| 2026-08-05 | Addressed first-pass review findings covering visible sort results, bounded route families, scanner call/scope handling, exact retry queries, and waterfall documentation. |
| 2026-08-05 | Addressed second-pass review findings covering deferred-closure propagation regressions, repeated exact-week/browser validation, and complete BMAD evidence. |
| 2026-08-05 | Implementation and two independent code-reviewer passes complete. Local scanner, browser, unit, type, lint, format, privacy, build, parity, and diff gates passed. Status: in-progress -> review. |
| 2026-08-06 | Resolved the architect-blocking Liquidity descending-velocity hybrid synchronization gap with an exact `GET /v1/analytics/liquidity?sort_by=turnover_days&sort_order=desc` waiter, deterministic marker, and `LQ-001` result; fresh Liquidity passed `20/20` owned and aggregate `23` pass / `1` optional skip / `0` fail. Final verdicts: code-reviewer `APPROVE`, architecture `CLEAR`, verifier `VERIFIED`. |
| 2026-08-06 | Approval lifecycle complete after all local validation and independent review gates passed. Status: review -> done. Normal PR merge, ancestry, local-main fast-forward, and branch/worktree cleanup are external orchestrator delivery evidence and are not claimed in this feature artifact. |

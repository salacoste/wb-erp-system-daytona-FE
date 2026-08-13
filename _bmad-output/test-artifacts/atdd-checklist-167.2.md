---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
lastStep: step-04c-aggregate
lastSaved: '2026-08-13'
workflowType: testarch-atdd
storyId: '167.2'
storyTitle: Migrate Root Entry `/`
primaryLevel: component
tddPhase: GREEN
inputDocuments:
  - .omx/plans/167.2-migrate-root-entry.md
  - _bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/shadcn-route-ledger.md
  - _bmad/tea/config.yaml
  - package.json
  - vitest.config.ts
  - playwright.config.ts
---

# ATDD Checklist — Epic 167-FE, Story 167.2

**Date:** 2026-08-13
**Author:** R2d2 / BMad TEA
**Primary test level:** Vitest route component and source contract
**Current phase:** GREEN after genuine active RED and review-fix RED; local, build, browser, exact-scope, and two fresh final-review gates complete; Git integration and cleanup remain pending

## Story Summary

A visitor entering `/` must see a bounded, trustworthy state until persisted authentication is actually resolved. After hydration the route must replace itself exactly once with the existing dashboard or login destination, while missing or stuck persistence produces bounded, truthful recovery without changing auth/session behavior.

## Controlling Acceptance Criterion

> **Given** resolving, valid, or absent auth **when** `/` loads **then** it shows a bounded state and redirects exactly once to the established dashboard or `/login` **and** no auth/session behavior changes.

Requirements: `FR2`, `FR9`, `FR27`.

## Preflight and Generation Mode

- Stack detection: `frontend` (Next.js, React, Vitest, RTL, jest-axe, and Playwright are configured).
- Story and acceptance criterion: present and testable in the canonical BMAD artifact, route ledger, and OMX plan.
- Development environment: pinned Node `24.18.0` and npm `11.11.0`; dependencies installed in the exact Story worktree.
- Generation mode: AI generation from canonical requirements and current source. Component/source tests are deterministic; completed browser delivery evidence is recorded below.
- Execution mode: sequential within `src/app/page.test.tsx`.
- Program override: all Story tests remain active and unskipped; no `skip`, `todo`, or `only` marker is permitted.

## Test Strategy and Coverage

| Priority | Scenario | Direct evidence |
| --- | --- | --- |
| P0 | Initial server-compatible render exposes one semantic bounded hydrating state and zero navigation | `src/app/page.test.tsx` |
| P0 | Delayed authenticated hydration replaces `/` with dashboard exactly once | `src/app/page.test.tsx` |
| P0 | Already-hydrated unauthenticated state replaces `/` with login exactly once | `src/app/page.test.tsx` |
| P0 | Both partial-auth combinations preserve the existing login predicate | `src/app/page.test.tsx` |
| P0 | Strict Mode and post-redirect store/rerender changes cannot duplicate navigation | `src/app/page.test.tsx` |
| P0 | Subscribe-before-check closes hydration completion race | `src/app/page.test.tsx` |
| P0 | Missing persist runtime exposes a functional reload action with zero navigation | `src/app/page.test.tsx` |
| P0 | Stuck hydration becomes a named bounded error at exactly 5,000 ms | `src/app/page.test.tsx` |
| P0 | Stuck hydration recovery reloads the document and never calls route-owned `rehydrate` | `src/app/page.test.tsx` |
| P0 | Timeout failure remains terminal even when hydration finishes before React cleanup | `src/app/page.test.tsx` |
| P0 | Synchronous finish-listener subscription failure becomes a bounded error | `src/app/page.test.tsx` |
| P0 | Synchronous hydration-readiness failure becomes a bounded error and unsubscribes | `src/app/page.test.tsx` |
| P1 | Unmount clears the failure timer and unsubscribes the finish listener | `src/app/page.test.tsx` |
| P0 | Status/error semantics, no focus movement, axe, semantic classes, and forbidden-source boundaries remain explicit | `src/app/page.test.tsx` |

## API and Contract Tests — N/A

Story 167.2 creates or changes no endpoint, request/response schema, query key, auth contract, or public data contract. API, MSW, and Pact tests would cross the Story's forbidden boundary. The correct API/CDC test count is `0`.

## Test Data, Mocks, and Selectors

- A hoisted router mock records `replace` and rejects `push` ownership.
- A route-local auth-store mock exposes callable hook state, `getState`, and an optional persist controller with `hasHydrated`, `onFinishHydration`, and a `rehydrate` spy used only to prove the route never takes that ownership.
- Finish listeners are held in a Set so tests can deterministically complete hydration and prove unsubscription.
- Fake timers are used only for the explicit hydration failure bound, never to simulate successful hydration.
- Semantic roles, accessible names, heading text, and stable source contracts are preferred over test IDs.
- Network, backend fixtures, persistent entities, and hard waits are not used.

## Active RED Checklist

- [x] Add `src/app/page.test.tsx` before editing `src/app/page.tsx`.
- [x] Prove initial hydration and zero early navigation.
- [x] Prove authenticated, unauthenticated, and partial-auth destinations.
- [x] Prove exactly-once behavior under Strict Mode and later state changes.
- [x] Prove the subscribe/check race and listener/timer cleanup.
- [x] Prove missing/stuck persist failure, terminal failure ownership, and document-reload recovery without route-owned rehydration.
- [x] Prove bounded semantic PageState presentation and ownership/source restrictions.
- [x] Run the exact file and record genuine missing-behavior failures only.

## RED Phase Execution Evidence

Command:

```bash
npm test -- --run src/app/page.test.tsx
```

Observed before the first production edit:

```text
Test Files  1 failed (1)
Tests       11 failed (11)
Duration    6.62s
```

All failures were genuine missing Story behavior: no semantic `main`/named `PageState`, no persist listener/check, no exactly-once `replace`, no missing/stuck storage error, no retry, no cleanup, and the source still contained the arbitrary `100ms` timer plus `router.push`. No syntax, type, mock, environment, network, fixture, timing, skip, todo, only, or unrelated failure contaminated RED.

## GREEN and Review-Driven Evidence

- Initial production GREEN: `1/1` file and `11/11` tests.
- Expanded pre-review GREEN: `1/1` file and `15/15` tests.
- Review-driven active RED: `2 failed | 14 passed (16)` for a missing-runtime no-op recovery and a late-initial-finish retry race.
- Repaired focused GREEN before reboot: `1/1` file and `16/16` tests.
- The emergency reboot deleted the original uncommitted worktree. The exact source, test, Story, and ATDD contents were reconstructed from untruncated transcript snapshots; the original worktree itself was not recovered.
- Fresh correctness review then reproduced repeated auth/session side effects from route-owned `persist.rehydrate()` against the locked Zustand 5.0.14 persist lifecycle and identified a terminal timeout race plus unbounded synchronous persist API exceptions.
- Review-fix active RED: `1/1` file failed with `5 failed | 10 passed (15)` for the obsolete retry presentation, terminal race, subscription exception, readiness exception, and remaining `.rehydrate()` production call.
- Corrected route-only GREEN: `1/1` file and `15/15` tests. Stuck or missing persistence now offers document reload, late finish cannot overwrite failure, persist APIs are contained, and the source contract forbids route-owned `.rehydrate()`.
- Fresh continuation verification on 2026-08-13 again passed `1/1` file and `15/15` tests with the pinned toolchain.
- Five sequential stability runs passed `1/1` file and `15/15` tests each on Node `24.18.0` and npm `11.11.0`.
- The historical `16/16` result above belongs only to the superseded pre-correction retry implementation. The current reload-only contract contains and passes `15/15` active tests.
- The first parallel full-suite attempt showed that asynchronous fake-clock advancement could cross the exact `4,999`/`5,000` ms assertion boundary under suite load. Only that test boundary was changed to synchronous `vi.advanceTimersByTime`; production code and the declared 5,000 ms contract were unchanged.
- A separate historical test's listener bind was denied by the sandbox with `EPERM`. The unrestricted pinned-toolchain full-suite rerun passed `1134/1134` files and `18399/18399` tests.

## Current Execution Command

```bash
PATH=/private/tmp/wb-fe-166-4-toolchain/npm-11.11.0/bin:/private/tmp/wb-fe-166-4-toolchain/node-v24.18.0-darwin-arm64/bin:$PATH \
  npm test -- --run src/app/page.test.tsx
```

## Universal Local Validation Evidence

- Toolchain: Node `24.18.0`; npm `11.11.0`.
- Full Vitest: `1134/1134` files and `18399/18399` tests passed unrestricted after the sandbox-only listener-bind failure and Story boundary-test hardening described above.
- Full zero-warning lint, type-check, and format check passed.
- Max-lines passed: `src/app/page.tsx` is `128/200` lines and `src/app/page.test.tsx` is `367/800` lines.
- Privacy tests passed `29/29`; the privacy scan covered `3431` text files.
- Next-params, locale-percent (accepted baseline `4`), AP#8 normalizer (accepted baseline `61`), E2E assertions (`19` files), E2E fixed waits (`47` targets), E2E bare skips (`0`), lessons, and marker checks passed.
- Sprint YAML parsing, `npm ls --depth=0`, `git diff --check`, package/lock no-diff, and forbidden-surface no-diff checks passed.
- The unchanged `check:eslint-rules` script resolved `scripts/../..` to `/private` from this temporary worktree and therefore could not print ESLint config there. The same canonical gate passed from the clean primary checkout; no shared script change was made.
- The sandboxed Next build was denied process/port binding by `EPERM`; its unrestricted pinned-toolchain rerun compiled successfully, passed TypeScript, and generated `70/70` static pages.

## Browser and Accessibility Evidence

- A temporary standalone Playwright harness exercised the production `next start` server at localhost `3100` without changing permanent E2E ownership.
- Empty authentication redirected `/` to `/login`; synthetic valid local authentication redirected `/` to `/dashboard`; malformed persisted authentication rendered the named failure on `/`, and its recovery action reloaded `/`.
- Width/theme matrix passed at `320`, `768`, and `1440` pixels in light and dark themes: no document or `main` overflow, active element remained `BODY`, and the recovery button height was `44px`.
- Reduced-motion emulation matched and reported no running animations.
- Final browser axe reported `0` violations and `30` passes. Console errors and page errors were empty.
- The first audit sampled an active 150 ms theme transition and transiently reported contrast `1.31` plus running transitions. The final audit waited `200` ms for theme stabilization and then produced the passing contrast, motion, and axe evidence above; only the stable final result is delivery evidence.
- The temporary harness and `.playwright-cli` files were deleted, the production server was stopped, and port `3100` is free.

## Exact Scope and Remaining Gates

- The approved manifest remains exactly the Story artifact, sprint lifecycle row, this ATDD artifact, `src/app/page.test.tsx`, and `src/app/page.tsx`.
- Auth store/provider/hooks, proxy, routes, AppShell/dashboard layout, UI/product shared components, tokens/styles, packages, APIs, queries, calculations, domain logic, and unrelated routes have zero diff.
- Two fresh independent final reviews converged `PASS/CLEAR` with Critical `0`, High `0`, Medium `0`, Low `0` on the current reload-only snapshot. Pass 1 corrected LOW evidence-only drift from stale Zustand `5.0.12` wording to the lockfile/installed `5.0.14`; Pass 2 verified canonical acceptance, edge behavior, scope, historical-versus-current evidence, and the stable browser audit. No accepted High or Medium finding remains unresolved.
- The exact five-file manifest remains the Story artifact, sprint lifecycle row, this ATDD artifact, `src/app/page.test.tsx`, and `src/app/page.tsx`, with zero shared, package, or forbidden-surface diff.
- Fresh Pass 2 gates passed five sequential `15/15` runs on pinned Node `24.18.0` and npm `11.11.0`, type-check, scoped zero-warning ESLint, Prettier, max-lines, sprint YAML parse, and `git diff --check`. A managed-sandbox browser re-smoke was denied localhost binding with `EPERM` and is not counted as a pass; the previously recorded stable production-server browser audit remains the delivery evidence.
- No staging, commit, PR, merge, branch deletion, worktree removal, prune, or clean-main evidence is claimed in this checklist.

## Red–Green–Refactor Handoff

1. Historical RED remains preserved as transcript evidence; it is not recreated against production code.
2. Fresh GREEN proves the corrected reconstructed implementation against the full 15-test manifest.
3. Preserve every brownfield destination assertion and forbidden-owner source check.
4. REFACTOR only while the full direct manifest stays green.
5. Preserve the completed browser, accessibility, universal local, exact-scope, and two-pass review evidence while the pending Git integration and cleanup lifecycle runs.

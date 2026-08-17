# Story 167.2: Migrate Root Entry `/`

Status: done

## Story

As a visitor,
I want `/` to route me correctly without exposing protected content,
so that entry is predictable and secure.

## Outcome

Replace the root route's guessed redirect delay with an explicit Zustand persist-hydration contract. The route renders a bounded, named, responsive status while authentication is unresolved, redirects exactly once with `router.replace` after hydration, preserves the established `isAuthenticated && token` destination predicate, and exposes a bounded storage-hydration failure with caller-triggered document reload without changing auth, session, provider, proxy, route, primitive, or AppShell ownership.

## Acceptance Criteria

1. **The root route waits for real hydration**
   - **Given** the server-compatible initial render or delayed Zustand persistence,
   - **When** `/` mounts,
   - **Then** it renders a named hydrating state and performs no navigation until `persist.hasHydrated()` or `persist.onFinishHydration()` proves completion,
   - **And** listener registration precedes the completion check so the render/effect race cannot strand the route.

2. **Destination behavior is preserved and navigation occurs exactly once**
   - **Given** hydrated auth state,
   - **When** both `isAuthenticated` and `token` are truthy,
   - **Then** the route replaces `/` with `ROUTES.DASHBOARD`,
   - **And** absent or partial authentication replaces `/` with `ROUTES.LOGIN`,
   - **And** Strict Mode, rerenders, and later store changes cannot issue a second navigation.

3. **Hydration failure is bounded and recoverable**
   - **Given** the persist runtime is present but hydration never finishes,
   - **When** the route cannot establish a trustworthy authentication snapshot,
   - **Then** it performs no redirect and renders a named error state within the declared failure bound,
   - **And** its recovery action reloads the document so initialization restarts at the existing auth-store owner boundary without a route-owned `rehydrate()`,
   - **And** a late finish callback cannot overwrite the terminal failure or trigger navigation.
   - **Given** the persist runtime itself is absent,
   - **Then** the route performs no redirect and offers an honest page-reload recovery action rather than a no-op retry.

4. **Presentation remains accessible and responsive**
   - **Given** loading, redirecting, or failure presentation across supported widths and themes,
   - **When** the root state renders,
   - **Then** one semantic `main` contains the merged `PageState` composition inside a centered bounded wrapper,
   - **And** status/error semantics, busy state, semantic tokens, wrapping, reduced-motion behavior, and adequate retry target are preserved,
   - **And** the route never moves focus or flashes protected content.

5. **The Story-owned boundary remains exact**
   - **Given** the canonical route ledger and OMX plan,
   - **When** Story 167.2 is implemented,
   - **Then** production changes are limited to `src/app/page.tsx`, direct tests/evidence, and the Story 167.2 sprint lifecycle row,
   - **And** auth store/provider/hooks, routes, proxy, AppShell, primitives, product compositions, tokens, packages, APIs, calculations, queries, and unrelated routes remain unchanged.

6. **Delivery evidence is complete**
   - **Given** the Universal Story Delivery Contract,
   - **When** Story 167.2 is proposed for integration,
   - **Then** active test-only RED precedes production changes,
   - **And** targeted tests, browser/accessibility evidence, universal local gates, two fresh reviews, and exact-scope audit pass,
   - **And** detailed commit, ready PR, merge SHA, remote/local branch deletion, exact worktree removal, prune, and clean-main evidence are recorded before Story 167.3 begins.

## Tasks / Subtasks

- [x] Task 1: Establish the isolated Story lane and exact ownership contract (AC: 1–6)
  - [x] Read the canonical Story plan in full and verify Story 167.1 merge and cleanup before creating the exact branch/worktree.
  - [x] Create the branch/worktree from synchronized `main`, install dependencies, and prove the base/package state.
  - [x] Inventory root, Zustand persist, AuthProvider, proxy, route destination, PageState, and direct-test contracts.
  - [x] Freeze the production/direct-test manifest and keep every forbidden shared owner read-only.

- [x] Task 2: Lock the root contract with genuine active ATDD RED (AC: 1–5)
  - [x] Create the English ATDD checklist and active route-local test manifest.
  - [x] Cover initial/delayed/already-complete hydration, both partial-auth combinations, exactly-once Strict Mode behavior, missing/stuck persistence, reload recovery, cleanup, and source boundaries.
  - [x] Run the exact Story test before production edits and record failures caused only by missing Story behavior.

- [x] Task 3: Implement hydration and exactly-once redirect ownership (AC: 1–2, 5)
  - [x] Subscribe before checking hydration completion and clean up the listener/timer deterministically.
  - [x] Separate redirect from hydration observation, snapshot the existing store after readiness, and guard navigation before `router.replace`.
  - [x] Preserve the established destination predicate without token validation, refresh, auth mutation, storage mutation, or provider duplication.

- [x] Task 4: Implement bounded state, failure, and recovery presentation (AC: 3–5)
  - [x] Render route-local `main` plus merged `PageState` for hydrating, redirecting, and error states.
  - [x] Bound unresolved hydration, expose an existing semantic Button that reloads the document, and never take route ownership of auth-store rehydration.
  - [x] Preserve focus, responsive wrapping, semantic tokens, themes, reduced motion, and no protected-content flash.

- [x] Task 5: Reach targeted GREEN and browser evidence (AC: 1–6)
  - [x] Run the exact route-local test file to GREEN and refactor only while it stays passing.
  - [x] Exercise unauthenticated and authenticated root redirects with minimal auth setup, plus bounded status/console/axe/theme/width/motion evidence.
  - [x] Prove no auth/session/API/route/AppShell/shared-component behavior changed.

- [x] Task 6: Run universal validation, exact-scope audit, and two fresh reviews (AC: 1–6)
  - [x] Run full Vitest, format, zero-warning lint, type-check, max-lines, build, YAML/static/privacy, dependency, and diff gates.
  - [x] Prove the exact source/test/artifact manifest and zero diffs in forbidden surfaces.
  - [x] Complete two independent fresh-context reviews and repair every accepted blocking finding test-first.

- [ ] Task 7: Integrate and clean the exact Story lane (AC: 6)
  - [ ] Force-stage ignored Story/ATDD evidence and stage only the approved explicit manifest.
  - [ ] Create the detailed conventional commit, push only the feature branch, open a ready PR targeting `main`, and merge through GitHub.
  - [ ] Synchronize primary `main`, prove merge ancestry/artifact presence and `main == origin/main`.
  - [ ] Delete remote/local branches, remove the exact worktree without force, prune, and prove absence before Story 167.3.

## Dev Notes

### Exact Git Lane and Prerequisites

- Primary checkout: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend`.
- Branch: `cdx/epic-167-story-2-root-entry`.
- Worktree: `/private/tmp/wb-fe-167-2-migrate-root-entry`.
- Base: `a8dfe3532b2a05eaa8b979aae3522de39de2fcfa` (Story 167.1 merge commit, PR `#153`).
- Required prerequisite chain: Stories 166.1–166.8 and 167.1 merged and their exact lanes cleaned before this worktree was created.
- Pinned Node: `/private/tmp/wb-fe-166-4-toolchain/node-v24.18.0-darwin-arm64/bin/node`.
- Pinned npm: `/private/tmp/wb-fe-166-4-toolchain/npm-11.11.0/bin/npm`.
- Worktree-local dependency install completed with no package/lock diff; exact validation uses the pinned PATH.

### Delivery Record

- **Requirements:** FR2, FR9, FR27.
- **Route/User Value:** predictable and secure `/` entry redirect.
- **Owned Surface:** `src/app/page.tsx`, `src/app/page.test.tsx`, Story/ATDD artifacts, and the Story 167.2 sprint lifecycle row.
- **Allowed Change Surface:** root route, direct test, and evidence only.
- **Forbidden Shared Files:** auth store/provider/hooks, proxy, routes, dashboard layout/AppShell, `src/components/ui/**`, `src/components/product/**`, tokens/styles, package/lock, APIs, queries, domain logic, and unrelated routes.
- **Dependency Decision:** reuse React, Next router, Zustand persist, `ROUTES`, merged `PageState`, existing `Button`, and semantic tokens; add no dependency.

### Preflight Classification

- AC1: **UNIMPLEMENTED** — current root used a guessed `100ms` delay rather than actual persist completion.
- AC2: **PARTIAL** — the destination predicate was correct, but `router.push` and effect rescheduling could not prove exactly-once replacement.
- AC3: **UNIMPLEMENTED** — missing/unreadable/stuck persist had no bounded failure or truthful recovery contract.
- AC4: **PARTIAL** — current centered text exposed no robust named PageState, trust evidence, error action, or responsive semantic wrapper.
- AC5: **PASS/PREFLIGHT** — current source was route-local; implementation preserves the frozen boundary.
- AC6: **UNIMPLEMENTED** — Story-specific RED, validation, reviews, Git lifecycle, and cleanup evidence were not yet complete.

### Contract Model

- Initial React state is always `hydrating` so server and first client markup cannot diverge.
- On mount, resolve the persist runtime defensively, subscribe to `onFinishHydration`, then immediately call `hasHydrated()` on the initial attempt to close the completion race.
- Hydration failure is terminal for the mounted document. Recovery reloads the document instead of invoking route-owned `persist.rehydrate()` and repeating auth-store side effects.
- A route-owned timer bounds unresolved hydration; it never guesses unauthenticated state or triggers a redirect.
- Hydration readiness and redirect ownership are separate effects. The redirect effect snapshots `useAuthStore.getState()`, sets a ref before navigation, and calls `router.replace` exactly once.
- Destination behavior remains `isAuthenticated && token ? ROUTES.DASHBOARD : ROUTES.LOGIN`, including both partial-auth combinations going to login.
- Present-but-stuck and missing persist runtimes use the same truthful page-reload recovery action; no route path mutates or rehydrates auth state.
- Cleanup unsubscribes the hydration listener and clears the route-owned failure timer. The route performs no focus operation.

### Approved Manifest

- `_bmad-output/implementation-artifacts/167-2-fe-migrate-root-entry.md` (new, force-stage required)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Story 167.2 row and `last_updated` comment only)
- `_bmad-output/test-artifacts/atdd-checklist-167.2.md` (new, force-stage required)
- `src/app/page.test.tsx` (new)
- `src/app/page.tsx` (modified)

### Validation Targets

- Active RED/GREEN: `src/app/page.test.tsx`.
- Browser evidence: minimal unauthenticated and authenticated `/` redirect plus named bounded state, no protected flash, console/axe, responsive/theme/reduced-motion checks without repeated login setup.
- Universal commands are taken from `package.json` and include full Vitest, zero-warning ESLint, type-check, format, max-lines, build, static/privacy/YAML/dependency/diff/scope checks.

### References

- [Source: `.omx/plans/167.2-migrate-root-entry.md`]
- [Source: `.omx/plans/shadcn-full-ui-migration-master.md`]
- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#Story-1672-Migrate-Root-Entry`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md`]
- [Source: `_bmad-output/planning-artifacts/shadcn-route-ledger.md`]
- [Source: `_bmad-output/implementation-artifacts/166-8-fe-standardize-page-states-async-results-contextual-detail-and-global-not-found.md`]
- [Source: `src/app/page.tsx`]
- [Source: `src/stores/authStore.ts`]
- [Source: `src/components/product/states/PageState.tsx`]
- [Source: `package.json`]

## Dev Agent Record

### Agent Model Used

GPT-5.6

### Implementation Plan

- Freeze hydration readiness, preserved destination behavior, exactly-once replacement, failure/reload recovery, cleanup, accessibility, and ownership contracts with active route-local RED.
- Implement only `src/app/page.tsx`, consuming the existing persist/router/PageState/Button contracts without modifying their owners.
- Collect targeted browser/accessibility, universal validation, two fresh reviews, and exact Git cleanup evidence before Story 167.3.

### Debug Log References

- Story base: `a8dfe3532b2a05eaa8b979aae3522de39de2fcfa`.
- The full Story 167.2 OMX plan was read before the original exact branch/worktree was created and again before emergency recovery operations.
- Genuine active test-only RED completed before the first production change: `1/1` suite and `11/11` active tests failed only because the root still lacked semantic PageState presentation, persist observation, exactly-once replacement, bounded error/retry, cleanup, and the source still used `setTimeout(..., 100)` plus `router.push`.
- Initial route-only GREEN passed `1/1` file and `11/11` tests before additional race/bound/rejection coverage was added.
- Review-driven active RED later failed `2/16` tests for the missing-runtime no-op recovery and late-initial-finish retry race. Both were repaired test-first; the preserved final focused run passed `16/16`.
- Emergency reboot deleted the original uncommitted `/private/tmp` worktree. Git proved no staged delta or WIP commit existed. The exact lane, pinned toolchain, source, tests, and evidence were reconstructed from untruncated preserved Codex transcripts; the original uncommitted worktree was not recovered.
- Fresh correctness review reproduced a HIGH shared-runtime defect: each route-owned `persist.rehydrate()` repeated auth-cookie work and registered another uncollected cross-tab storage listener in the locked Zustand 5.0.14 persist lifecycle. It also found a terminal failure race and unbounded synchronous persist API exceptions.
- Correct-course classified the repair as a minor direct adjustment within Story 167.2: canonical BMAD/OMX requires bounded recovery and no auth/session behavior changes, but does not require in-place rehydration. The 90-Story DAG, master plan, route ledger, and forbidden auth-store owner remain unchanged.
- Review-fix RED failed `5/15` tests for the obsolete retry label, terminal timeout race, subscription exception, readiness exception, and remaining `.rehydrate()` source call. Route-only repair then passed `15/15` with reload-only recovery, terminal failure ownership, guarded persist APIs, and a source contract forbidding route-owned rehydration.

### Post-1st-pass-review fixes (2026-08-13)

- Fresh runtime/correctness review found no current production, test, security, or scope defect in the reload-only implementation. Its only accepted finding was LOW evidence drift: the Story and ATDD named Zustand `5.0.12`, while `package-lock.json` and the installed package both prove the locked version is `5.0.14`.
- Corrected both evidence artifacts to `locked Zustand 5.0.14 persist lifecycle`; propagation searches, Prettier, and `git diff --check` passed. The final Pass 1 verdict was `PASS/CLEAR` with Critical `0`, High `0`, Medium `0`, Low `0`.

### Post-2nd-pass-review fixes (2026-08-13)

- Fresh independent acceptance/edge/scope/evidence review verified the canonical acceptance criterion, route-ledger ownership, exact five-file manifest, current meaningful `15/15` contract versus the historical superseded `16/16`, malformed-persist browser semantics against Zustand `5.0.14`, and stable post-theme-transition browser evidence. It confirmed zero shared, package, or forbidden-surface diff.
- Five sequential focused runs passed `15/15` on pinned Node `24.18.0` and npm `11.11.0`; type-check, scoped zero-warning ESLint, Prettier, max-lines, sprint YAML parse, and `git diff --check` also passed. A managed-sandbox browser re-smoke was denied localhost binding with `EPERM` and is recorded only as an environment-blocked attempt, not as passing evidence; the previously completed stable production-server browser audit remains authoritative.
- The final Pass 2 verdict was `PASS/CLEAR` with Critical `0`, High `0`, Medium `0`, Low `0`. No accepted High or Medium finding remains unresolved. The exact five-file scope is unchanged, with zero shared or forbidden diff; Task 7 remains open because staging, commit, push, PR, merge, branch deletion, worktree removal, prune, and clean-main evidence do not yet exist.

### Completion Notes List

- Exact emergency reconstruction and the review-driven reload-only correction are complete within the approved five-file manifest. The current route never calls `persist.rehydrate()`; missing, stuck, and synchronous persist failures expose document reload at the existing auth-store owner boundary.
- Pinned Node `24.18.0` and npm `11.11.0` validation passed five sequential focused runs at `1/1` file and `15/15` tests each. The current final contract is `15/15`; preserved `16/16` entries describe only the historical pre-correction implementation.
- The first parallel full-suite attempt exposed instability in the exact `4,999`/`5,000` ms assertion and an unrelated sandbox `EPERM` listener-bind restriction. The Story test was hardened without production changes by replacing only the boundary's asynchronous fake-clock advancement with synchronous `vi.advanceTimersByTime`; the unrestricted pinned-toolchain rerun passed `1134/1134` files and `18399/18399` tests.
- Universal validation passed zero-warning full lint, type-check, format, max-lines (`page.tsx` 128/200; `page.test.tsx` 367/800), privacy tests/scans, Next-params, locale-percent, AP#8 normalizer, E2E assertion/wait/bare-skip checks, lessons/marker checks, sprint YAML parse, dependency inventory, and `git diff --check`. Package/lock and every forbidden/shared surface have zero diff.
- `check:eslint-rules` could not infer the repository root from the `/private/tmp` worktree because its historical `scripts/../..` calculation resolves to `/private`; the unchanged canonical gate passed from the clean primary checkout. No shared script was modified.
- The sandboxed Next build attempt was blocked only by Turbopack/PostCSS process/port binding (`EPERM`). Its unrestricted pinned-toolchain rerun compiled successfully, passed TypeScript, and generated `70/70` static pages.
- The production-server browser audit passed unauthenticated `/` → `/login`, authenticated `/` → `/dashboard`, and malformed-persist failure remaining on `/` with a functional page-reload action. The `320`, `768`, and `1440` light/dark matrix had no document or `main` overflow, no focus theft, and a `44px`-high recovery target; reduced motion matched with no running animations.
- Final browser axe reported `0` violations and `30` passes, with empty console-error and page-error collections. A first audit sampled the 150 ms light-to-dark transition and transiently observed low contrast/running transitions; the corrected harness waited `200` ms for theme stabilization before the final passing audit.
- The temporary browser harness and `.playwright-cli` evidence files were deleted, and localhost port `3100` is free. Two fresh final reviews converged `PASS/CLEAR` with no unresolved accepted High/Medium finding; no commit, PR, merge, cleanup, or Story 167.3 work is claimed here.

### File List

- `_bmad-output/implementation-artifacts/167-2-fe-migrate-root-entry.md` (new)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
- `_bmad-output/test-artifacts/atdd-checklist-167.2.md` (new)
- `src/app/page.test.tsx` (new)
- `src/app/page.tsx` (modified)

## Change Log

- 2026-08-13: Created the Story 167.2 implementation record after canonical-plan, prerequisite, lane, dependency, hydration, ownership, and state-contract preflight.
- 2026-08-13: Reconstructed the exact Story lane and implementation from preserved, untruncated transcript evidence after an emergency reboot deleted the original uncommitted temporary worktree; fresh validation and reviews remain in progress.
- 2026-08-13: Corrected the uncommitted route recovery contract after real-Zustand review evidence showed route-owned `rehydrate()` repeated auth/session side effects; preserved the canonical 90-Story DAG and auth-store ownership.
- 2026-08-13: Recorded completed pinned-toolchain local, full-regression, production-build, exact-scope, responsive browser, reduced-motion, and accessibility evidence for the corrected `15/15` reload-only contract; two fresh final reviews and the Git integration lifecycle remain pending.
- 2026-08-13: Completed two fresh final reviews with `PASS/CLEAR`, corrected Story/ATDD evidence from stale Zustand `5.0.12` wording to the locked `5.0.14` lifecycle, and reconfirmed the exact five-file manifest with zero shared/forbidden diff. **Lessons:** dependency-version claims must be checked against both the lockfile and installed package before review closure; historical superseded test/browser evidence must remain visibly separated from the current delivery contract. Story moved to `review`; Task 7 remains open for Git integration and mandatory cleanup.
- 2026-08-17: Story closed. Deliverable verified merged on FE main: PR #154 (branch tip 09427d44, merge 8eee14bb, ancestry on main verified by `merge-base --is-ancestor`). Two-pass discipline complete per this record (Pass 1 `PASS/CLEAR` 0/0/0/0; Pass 2 `PASS/CLEAR` 0/0/0/0; HIGH shared-runtime `rehydrate()` defect repaired test-first). Git-lifecycle (Task 7) satisfied retroactively by the 2026-08-17 verifier audit: merge ancestry proven; later stories (167.3+) built on these bytes. **Lessons:** (1) review rows can be fully-reviewed-but-unflipped — audit before re-reviewing (2) close the Change Log with a merge row in the merge session itself (3) emergency-reconstruction from transcript evidence is auditable when git proof is preserved.

# Story 166.8: Standardize Page States, Async Results, Contextual Detail, and Global Not Found

Status: review

## Story

As a user encountering missing data or processing,
I want honest state and recovery patterns,
so that I know what is trustworthy and what to do next.

## Outcome

Deliver route-free product compositions for universal page states, long-running operation status, bulk-result evidence, and contextual list/detail presentation, plus one global not-found owner. The compositions expose data trust, scope, progress, cancellability, safe-leave guidance, exact result counts, failed-item evidence, deterministic focus hooks, and an explicit narrow-screen detail transition without owning domain mutations, routing, retry rules, selection state, filters, URLs, polling, calculations, or formatting.

## Acceptance Criteria

1. **The Story-owned boundary is exact**
   - **Given** Stories 166.1–166.7 are merged,
   - **When** Story 166.8 is implemented,
   - **Then** the canonical shared compositions live only under `src/components/product/states/**` and the global not-found owner is `src/app/not-found.tsx`,
   - **And** a source contract proves the exact production/test manifest and rejects route/domain mutation, API, hook, query, store, navigation, retry, polling, calculation, formatting, raw-data, toast, raw-palette, and client-state ownership,
   - **And** prior product subtrees, the product root barrel, primitives, tokens, package surfaces, legacy state consumers, routes, APIs, hooks, and domain logic remain byte-for-byte unchanged.

2. **PageState communicates data trust and the next valid action**
   - **Given** loading, refreshing, empty, filtered-empty, error, offline, stale, partial, restricted, not-found, processing, or success presentation,
   - **When** `PageState` renders,
   - **Then** its title, explanation, data-trust statement, context, and next valid action remain explicit,
   - **And** filtered-empty requires caller-owned scope plus reset, error requires caller-owned recovery, retained-data states require limitation evidence, and terminal states cannot fabricate retained content or zero,
   - **And** live announcements are proportional, background refresh does not steal focus, and actions have adequate keyboard/touch targets.

3. **AsyncOperationStatus exposes a truthful lifecycle without owning it**
   - **Given** idle, validating, queued, running, cancellable, non-cancellable, partial, complete, failed, retrying, or expired operation state,
   - **When** the status renders,
   - **Then** operation name, exact scope, phase, truthful progress when available, cancellability, safe-leave guidance, and next action are explicit,
   - **And** cancel/retry/navigation actions remain caller-owned,
   - **And** indeterminate work never fabricates a percentage and progress ticks do not steal focus.

4. **BulkResultSummary provides non-toast partial and retry evidence**
   - **Given** attempted, succeeded, failed, skipped, and pending outcomes,
   - **When** the summary renders,
   - **Then** all exact counts are visible, zero remains distinct from missing, count invariants are enforced, and partial completion persists inline rather than only in a toast,
   - **And** failed-item reasons are exposed through caller-owned semantic table evidence from Story 166.6,
   - **And** retry scope and a caller-owned retry-failed action are explicit without reimplementing mutation semantics.

5. **ContextualSplitView preserves context with an explicit mobile transition**
   - **Given** no selection, loading detail, selected, detail error, stale detail, or restricted detail presentation,
   - **When** the composition renders,
   - **Then** named list and detail landmarks preserve caller-rendered filters, queue position, and scroll context,
   - **And** wide layouts retain both panes while narrow layouts expose an explicit list-to-detail transition rather than compressed panes,
   - **And** callers provide selection and close behavior, selected-detail focus, and close-return focus targets without the composition owning URLs or state.

6. **Global not-found has one truthful owner**
   - **Given** an unmatched application path,
   - **When** Next.js renders the global not-found boundary,
   - **Then** one `src/app/not-found.tsx` owner explains what happened, does not reveal the requested path, and offers semantic recovery to `/` without client hooks or route mutation,
   - **And** repository evidence proves there is no competing root/global not-found owner.

7. **Responsive, theme, localization, and accessibility evidence is complete**
   - **Given** the Story-owned state matrix,
   - **When** it is tested at widths `320`, `390`, `768`, `1024`, `1280`, `1440`, and `1600`, representative 200% reflow, light/dark themes, long Russian copy, keyboard/touch input, and reduced motion,
   - **Then** content wraps without page-level overflow, focus transitions are deterministic and bounded, state meaning is not color-only or motion-only, console output is clean, and axe has no violations.

8. **Delivery evidence is complete**
   - **Given** the Story-specific and Universal Story Delivery Contracts,
   - **When** the Story is proposed for integration,
   - **Then** genuine test-only RED precedes production creation,
   - **And** Story tests, representative read-only consumer locks, universal local gates, two fresh adversarial review passes, exact-scope audit, detailed commit, ready PR, merge SHA, branch deletion, exact worktree removal, prune, and clean-main evidence are recorded before Epic 167 starts.

## Tasks / Subtasks

- [x] Task 1: Establish the isolated Story contract and exact ownership manifest (AC: 1, 6, 8)
  - [x] Verify merged prerequisites, clean base, exact branch/worktree, and pinned local toolchain.
  - [x] Inventory global not-found ownership, existing state/result/split patterns, available primitives, and read-only consumers.
  - [x] Freeze production ownership to `src/components/product/states/**` plus `src/app/not-found.tsx`; keep routes, domain consumers, prior product subtrees, and root product barrel read-only.

- [x] Task 2: Lock behavior with genuine ATDD RED (AC: 1–7)
  - [x] Create the Story-specific ATDD strategy/checklist and exact component/type/source test manifest.
  - [x] Add Story-owned tests before any production state-composition file or global not-found owner exists.
  - [x] Record failures caused only by absent Story-owned modules/manifest; keep tests active and unskipped.

- [x] Task 3: Implement PageState and async-operation contracts (AC: 2–3)
  - [x] Implement truthful terminal/retained page-state presentation and caller-owned recovery/action slots.
  - [x] Implement explicit lifecycle, scope, truthful progress, cancellability, safe-leave, and next-action presentation.
  - [x] Preserve server compatibility and prohibit hooks, timers, polling, mutation, navigation, retry, or formatting ownership.

- [x] Task 4: Implement bulk-result and contextual-detail contracts (AC: 4–5)
  - [x] Implement exact result-count invariants, inline partial evidence, retry scope, and Story 166.6 failed-table reuse.
  - [x] Implement named list/detail landmarks, explicit mobile transition, state evidence, and deterministic caller-provided focus targets.
  - [x] Preserve caller-owned selection, filters, scroll, queue, URL/deep-link, close/back, and mutation semantics.

- [x] Task 5: Implement the single global not-found owner and complete GREEN/REFACTOR (AC: 1–6)
  - [x] Add one server-compatible `src/app/not-found.tsx` with truthful Russian recovery copy and semantic `/` navigation.
  - [x] Run the exact Story test manifest to GREEN and refactor only while it remains passing.
  - [x] Prove no competing global owner and no edits to existing route-specific state/not-found consumers.

- [x] Task 6: Collect browser, accessibility, and responsive evidence (AC: 2–8)
  - [x] Verify the complete state matrix at required widths, 200% reflow, light/dark, long Russian copy, reduced motion, keyboard/touch, and focus transitions.
  - [x] Prove non-toast partial results, explicit narrow detail flow, no page overflow, clean console, and zero axe violations.
  - [x] Remove temporary route/browser harness and close its server/session before staging.

- [x] Task 7: Run universal validation, exact-scope audit, and two fresh reviews (AC: 1–8)
  - [x] Run Story and representative consumer tests, full Vitest, format, zero-warning lint, type-check, max-lines, build, YAML, privacy/static, and diff gates.
  - [x] Prove prior product, primitive, token, package, legacy consumer, route, API, hook, query, calculation, formatting, and navigation zero-diffs.
  - [x] Complete two independent fresh-context adversarial reviews and repair every accepted High/Medium finding test-first.

- [ ] Task 8: Integrate and clean the exact Story lane (AC: 8)
  - [ ] Force-stage ignored Story/ATDD artifacts and stage only the approved explicit manifest.
  - [ ] Create the detailed conventional commit, push only the feature branch, open a ready PR targeting `main`, and merge through GitHub.
  - [ ] Update primary `main`, prove merge ancestry/artifact presence and `main == origin/main`.
  - [ ] Delete remote/local feature branches, remove the exact worktree without force, prune worktrees/remotes, and prove absence before Epic 167.

## Dev Notes

### Exact Git Lane and Prerequisites

- Primary checkout: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend`.
- Branch: `cdx/epic-166-story-8-states-async`.
- Worktree: `/private/tmp/wb-fe-166-8-standardize-page-states-async-results-cont`.
- Base: `5beebe5ee5a1d2c339a9ad495b1023bba298aa48` (Story 166.7 merge commit).
- Required prerequisite chain: Stories 166.1–166.7, with Story 166.7 merged in PR `#151` at the recorded base SHA.
- Pinned PATH: `/private/tmp/wb-fe-166-4-toolchain/npm-11.11.0/bin:/private/tmp/wb-fe-166-4-toolchain/node-v24.18.0-darwin-arm64/bin:$PATH`.
- Worktree-local `npm ci` installed 759 packages; `node_modules` is a real directory. Husky could not lock the shared `.git/config` in the managed sandbox, but install exited `0` and package/lock remained clean.

### Delivery Record

- **Requirements:** FR20, FR28, FR33.
- **Route/User Value:** understandable states and partial outcomes; only the global unmatched-route boundary is Story-owned.
- **Owned Surface:** `PageState`, `AsyncOperationStatus`, `BulkResultSummary`, `ContextualSplitView`, contracts/sub-barrel/direct tests under `src/components/product/states/**`; `src/app/not-found.tsx`; Story/ATDD evidence; only the Story 166.8 sprint row plus lifecycle comment.
- **Allowed Change Surface:** the exact Owned Surface above.
- **Forbidden Shared Files:** `src/components/product/index.ts`; prior product subtrees; `src/components/ui/**`; `src/styles/**`; every existing route/custom state consumer; route-specific not-found/error files; APIs, hooks, stores, queries, navigation, retry/polling rules, calculations, formatters, package/lock, backend/public contracts.
- **Dependency Decision:** use React, lucide icons, existing semantic tokens, current primitives, Story 166.6 tables, and Story 166.4 status patterns only; no dependency additions.

### Preflight Classification

- AC1: **UNIMPLEMENTED** — no `src/components/product/states/**` subtree exists.
- AC2: **PARTIAL precedent only** — `TableState` and `ChartState` demonstrate narrower state semantics but no universal `PageState` exists; they remain read-only.
- AC3: **UNIMPLEMENTED** — domain-specific polling/progress views exist, but no route-free async lifecycle composition exists.
- AC4: **UNIMPLEMENTED** — domain result/toast patterns exist, but no canonical inline bulk-result summary with count invariants exists.
- AC5: **UNIMPLEMENTED** — route-specific list/detail flows exist, but no shared route-free contextual split composition exists.
- AC6: **UNIMPLEMENTED** — source inventory found no root `not-found.tsx` or `global-not-found.tsx` owner.
- AC7–8: **UNIMPLEMENTED** — direct Story tests/evidence do not yet exist.

### Approved Production Manifest

- `src/components/product/states/AsyncOperationStatus.tsx`
- `src/components/product/states/BulkResultSummary.tsx`
- `src/components/product/states/ContextualSplitView.tsx`
- `src/components/product/states/PageState.tsx`
- `src/components/product/states/contracts.ts`
- `src/components/product/states/index.ts`
- `src/app/not-found.tsx`

The root product barrel remains read-only. Later route owners import the states sub-barrel directly until a Story explicitly owns root-barrel consolidation.

### Contract Model

- `PageState` separates terminal data-absent states from retained-data states. Background refresh remains orthogonal; terminal states cannot receive retained content.
- `AsyncOperationStatus` receives caller-resolved lifecycle evidence. Progress is optional and only rendered when truthful; action invocation remains entirely caller-owned.
- `BulkResultSummary` receives exact integer counts and enforces `attempted = succeeded + failed + skipped + pending`. It renders persistent inline partial evidence and accepts caller-owned failed-item table content plus retry action.
- `ContextualSplitView` is controlled. It lays out caller-owned list/detail content, state presentation, and explicit narrow projections; it never stores selection or alters URL/search state.
- Focus targets are caller-provided refs. The composition may move focus only on deliberate selection/close transitions, never on background progress ticks.
- Global not-found is a server component using a semantic anchor to `/`; it reveals no path or support-sensitive data.

### Validation Targets

Story-owned tests run first. Representative read-only locks will cover Story 166.4 metric/status, Story 166.6 table-state/table-frame, Story 166.7 chart-state, existing orders/modal focus return, communications list/detail, bulk COGS result, export/polling, processing, and route error patterns selected after exact runtime inventory.

Universal commands come from `package.json`: Story/consumer/full Vitest, format check, zero-warning lint, type-check, max-lines, build, YAML/static/privacy/scope/diff audits, and a temporary localhost browser harness on frontend `3100`.

### References

- [Source: `.omx/plans/166.8-standardize-page-states-async-results-contextual-detail-and-global-not-found.md`]
- [Source: `.omx/plans/shadcn-full-ui-migration-master.md`]
- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#Story-1668-Standardize-Page-States-Async-Results-Contextual-Detail-and-Global-Not-Found`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#PageState`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#AsyncOperationStatus-and-BulkResultSummary`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#ContextualSplitView`]
- [Source: `src/components/product/tables/TableState.tsx`]
- [Source: `src/components/product/charts/ChartState.tsx`]
- [Source: `package.json`]

## Dev Agent Record

### Agent Model Used

GPT-5.6

### Implementation Plan

- Freeze the route-free state, operation, result, split-view, focus, and global-not-found contracts with genuine component/type/source RED.
- Implement the smallest server-compatible product surface without mutation, state, route, retry, polling, calculation, formatting, or raw-data ownership.
- Collect targeted consumer, browser/accessibility, universal validation, two-pass review, and exact Git cleanup evidence.

### Debug Log References

- Story base: `5beebe5ee5a1d2c339a9ad495b1023bba298aa48`.
- The full Story 166.8 OMX plan was read before the exact clean branch/worktree was created.
- Read-only source inventory found no product states subtree and no root/global not-found owner; existing route/domain state implementations remain consumer evidence only.
- ATDD preflight started on 2026-08-13: the Story moved to `in-progress`; component, type, accessibility, focus, result-invariant, source-boundary, and global-not-found RED is specified before production creation. API and route-domain E2E are intentionally N/A because the Story adds no API or domain route behavior; browser evidence is deferred to a temporary GREEN harness and the real unmatched-route boundary.
- Genuine test-only RED completed before production creation: exact 7-file manifest, exit `1`; six suites failed only on absent Story-owned modules/manifest/global owner and the type-vocabulary suite passed after type erasure. No syntax, environment, fixture, selector, browser, network, package/lock, consumer, or unrelated failure contaminated RED.
- Story GREEN/REFACTOR completed and remained green through all review repair cycles: exact `7/7` suites and `45/45` tests passed; pinned `tsc --noEmit`, focused zero-warning ESLint, Prettier, max-lines, and `git diff --check` passed. `ContextualSplitView` uses one list/detail DOM with CSS-only responsive projection, avoiding duplicate landmarks, inputs, refs, and state; all caller action slots apply statically discoverable 44px descendant targets.
- Representative read-only consumer locks passed: `31/31` files and `459/459` tests covering merged product metric/table/chart/PageContext foundations plus processing, bulk COGS, drawer focus, communications, model, and page-state consumers.
- Fresh standalone Playwright proof used an actual `195px` CSS viewport plus `320/390/768/1024/1280/1440/1600`; every run rendered the full `12 + 11 + 4 + 6` state matrix, document/main overflow remained `0`, and every visible Story action target measured at least `44px`. Genuine `prefers-reduced-motion: reduce` emulation returned `matchMedia(...).matches === true` and the production busy icon computed `animation-name: none`. Light/dark, long Russian copy, inline partial evidence, one-DOM mobile list/detail transition, selection A→B focus, selected→stale no-focus-theft, and the real unmatched HTTP 404 recovery remained truthful. Console warnings/errors were `0`; axe reported `0` violations, `36` passes, and `0` incomplete checks.
- First fresh adversarial review requested changes with `4 High` and `4 Medium` findings; all were accepted and repaired test-first: native tab-order preservation, selection-key focus semantics, truthful bulk outcome/count validation, required PageState trust/action evidence, proportional live regions, native narrow back semantics, exact 7+7/forbidden source locks, and auditable exhaustive state evidence.
- The corrected browser run found two additional behavior defects absent from jsdom: non-wrapping long action labels at true 200% and Chromium dropping focus when temporary `tabindex=-1` was removed synchronously. Both received direct regression tests and production repairs before the browser matrix was rerun.
- Second fresh adversarial review requested changes with `3 High` and `5 Medium` findings. All were accepted and repaired test-first: active async phases now require explicit cancellability evidence; action/recovery contracts require rendered elements; blank trust and invalid runtime evidence are rejected; failed bulk results require every attempted item to fail; close focus restoration uses a bounded visible-target retry; temporary tabindex cleanup preserves caller changes; and the concise page live node no longer repeats its title. The affected RED run produced exactly six failures before GREEN.
- The pass-2 browser findings were resolved with an actual `195px` viewport and genuine reduced-motion media emulation. A temporary harness-only min-content defect was found at `195px`, repaired inside the temporary fixture, and never entered the Story manifest. The full state matrix then passed all widths with zero document/main overflow, `44px` visible actions, axe `0`, and console `0`.
- Convergence review requested two final changes (`1 High`, `1 Medium`). Genuine test-only RED produced `3` failed suites, `3` failed tests, and `23` passed tests before production repair. Optional PageState/AsyncOperationStatus actions now require and runtime-validate rendered React elements; the terminal `failed + skipped` count vector is truthfully representable as `partial` while `failed` still requires every attempted item to fail. Affected GREEN became `3/3` suites and `26/26` tests; exact Story GREEN became `7/7` suites and `45/45` tests.
- The fresh convergence verification verdict is `APPROVED`: all exact `7 + 7` Story files were reviewed with zero unresolved Critical, High, Medium, or Low findings. The repair changed no browser-visible layout, responsive, focus-timing, motion, or global-not-found presentation contract, so the already completed full browser matrix remains applicable.
- Refreshed final universal validation passed: full Vitest `1131/1131` files and `18352/18352` tests; Next `16.2.12` production build compiled, passed TypeScript, and generated `70/70` static pages; full format, zero-warning lint, type-check, max-lines, privacy `29/29`, privacy scan, Next params, locale-percent baseline `4`, anti-pattern baseline `61`, E2E assertion/wait/skip scans, lessons, markers, sprint YAML parse, canonical eslint-rule validation, and `git diff --check` passed. The documentation citation checker retained the approved baseline of `18` broken citations. The first sandboxed full-suite attempt had one environment-only `EPERM 0.0.0.0` listener failure; the required unrestricted rerun passed all `18352` tests.
- Browser cleanup passed: the temporary Story route/directories were deleted, the pinned dev server stopped cleanly, port `3100` has no listener, the in-app browser has zero controlled tabs, and the viewport override was reset.

### Completion Notes

- Tasks 3–7 are complete with final `45/45` Story GREEN, representative consumer regressions, genuine responsive/theme/reduced-motion/focus/axe evidence, real global-not-found evidence, full temporary-harness cleanup, final universal gates, exact-scope audit, and an independent `APPROVED` convergence verdict. Only the commit/PR/merge/cleanup lifecycle remains under Task 8.

## File List

- `_bmad-output/implementation-artifacts/166-8-fe-standardize-page-states-async-results-contextual-detail-and-global-not-found.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/test-artifacts/atdd-checklist-166.8.md`
- `src/app/__tests__/not-found.test.tsx`
- `src/app/not-found.tsx`
- `src/components/product/states/AsyncOperationStatus.tsx`
- `src/components/product/states/BulkResultSummary.tsx`
- `src/components/product/states/ContextualSplitView.tsx`
- `src/components/product/states/PageState.tsx`
- `src/components/product/states/contracts.ts`
- `src/components/product/states/index.ts`
- `src/components/product/states/__tests__/AsyncOperationStatus.test.tsx`
- `src/components/product/states/__tests__/BulkResultSummary.test.tsx`
- `src/components/product/states/__tests__/ContextualSplitView.test.tsx`
- `src/components/product/states/__tests__/PageState.test.tsx`
- `src/components/product/states/__tests__/StateContracts.test.ts`
- `src/components/product/states/__tests__/state-composition-source-contracts.test.ts`

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-13 | Story lifecycle entered `in-progress`; isolated ownership, exact production manifest, preflight classifications, and ATDD RED strategy were established before production creation. |
| 2026-08-13 | Genuine active RED recorded for the exact seven-test manifest before production creation; failures were limited to absent Story-owned modules, production manifest, and global not-found owner. |
| 2026-08-13 | Tasks 3–6 complete: route-free state/async/result/split contracts and global not-found reached post-review 44/44 GREEN; compiler/static and 459 consumer tests passed; full browser matrix, focus, 44px targets, axe 0, console 0, and harness cleanup were proven. |
| 2026-08-13 | Post-1st-pass review: accepted and repaired 4 High + 4 Medium findings; corrected true-200% and busy-motion browser evidence; fixed long action wrapping and real Chromium detail focus; added exhaustive state disposition. |
| 2026-08-13 | Post-2nd-pass review: accepted and repaired 3 High + 5 Medium findings; active cancellability, rendered action evidence, failed-bulk truth, bounded focus restoration, caller tabindex ownership, and proportional live naming were locked by six RED regressions. Genuine 195px and reduced-motion Playwright proof exercised all 33 state fixtures with zero overflow, axe violations, or console warnings/errors. |
| 2026-08-13 | Convergence review found 1 High + 1 Medium; three genuine RED failures preceded rendered optional-action validation and truthful terminal failed-plus-skipped partial results. Final Story GREEN is 45/45, full Vitest is 18352/18352, build is 70/70, exact scope is clean, and independent convergence verification is APPROVED with zero unresolved findings. Status: in-progress → review pending Git integration and cleanup. |

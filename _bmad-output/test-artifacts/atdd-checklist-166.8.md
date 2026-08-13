---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: 2026-08-13
inputDocuments:
  - .omx/plans/166.8-standardize-page-states-async-results-contextual-detail-and-global-not-found.md
  - _bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/shadcn-route-ledger.md
  - _bmad-output/implementation-artifacts/166-7-fe-deliver-chartframe-and-accessible-analytical-evidence.md
  - package.json
  - playwright.config.ts
  - vitest.config.ts
  - _bmad/tea/config.yaml
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/data-factories.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/component-tdd.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/test-quality.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/test-healing-patterns.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/selector-resilience.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/timing-debugging.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/playwright-cli.md
---

# ATDD Checklist: Story 166.8

## Preflight and Context

- Detected stack: frontend (`Next.js`, React, Vitest, and Playwright are configured).
- Approved Story: `166.8 — Standardize Page States, Async Results, Contextual Detail, and Global Not Found`.
- Acceptance criteria: canonical BMAD criterion plus eight executable Story criteria in the implementation artifact.
- Test frameworks: Vitest/jsdom for component, type, source, and boundary RED; in-app browser/Playwright evidence after GREEN.
- Development environment: isolated worktree on `5beebe5ee5a1d2c339a9ad495b1023bba298aa48`, pinned Node `24.18.0`, npm `11.11.0`, worktree-local dependencies installed.
- Existing patterns inspected: Story 166.4 status compositions, Story 166.6 `ResponsiveTable`/`TableState`, Story 166.7 `ChartState`, existing route-specific state and list/detail consumers.
- TEA configuration: `test_stack_type=auto` resolved to frontend; Playwright Utils enabled; browser automation `auto`; execution mode `auto`; Pact disabled.

## Generation Mode

AI generation is selected. The shared components and global boundary do not exist yet, so live selector recording would only observe absent surfaces. Browser selector and interaction verification is deferred to the GREEN temporary harness and real unmatched route. API generation is N/A because Story 166.8 owns no endpoint, request, response, authentication, polling, or mutation contract.

## Exact Ownership Manifests

### Production

1. `src/components/product/states/AsyncOperationStatus.tsx`
2. `src/components/product/states/BulkResultSummary.tsx`
3. `src/components/product/states/ContextualSplitView.tsx`
4. `src/components/product/states/PageState.tsx`
5. `src/components/product/states/contracts.ts`
6. `src/components/product/states/index.ts`
7. `src/app/not-found.tsx`

### Direct Tests

1. `src/components/product/states/__tests__/AsyncOperationStatus.test.tsx`
2. `src/components/product/states/__tests__/BulkResultSummary.test.tsx`
3. `src/components/product/states/__tests__/ContextualSplitView.test.tsx`
4. `src/components/product/states/__tests__/PageState.test.tsx`
5. `src/components/product/states/__tests__/StateContracts.test.ts`
6. `src/components/product/states/__tests__/state-composition-source-contracts.test.ts`
7. `src/app/__tests__/not-found.test.tsx`

The product root barrel, prior product subtrees, primitives, tokens, route/domain consumers, APIs, hooks, stores, package/lock, and every route-specific error/not-found surface are read-only.

## Test Strategy

| Priority | Level | Scenario | Acceptance evidence |
| --- | --- | --- | --- |
| P0 | Component/type | Page terminal versus retained states, trust copy, proportional live semantics, caller-owned recovery, no fabricated retained evidence | AC2 |
| P0 | Component/type | Async lifecycle state, exact scope, optional truthful progress, cancellability, safe-leave, caller-owned actions | AC3 |
| P0 | Component/type | Exact bulk counts, arithmetic invariant, zero preservation, persistent partial evidence, failed table, retry scope/action | AC4 |
| P0 | Component/type | Controlled list/detail composition, named landmarks, explicit narrow transition, selected/close focus behavior | AC5 |
| P0 | Boundary/source | One root not-found owner with semantic `/` recovery and no path/client-state disclosure | AC1, AC6 |
| P1 | Source contract | Exact 7+7 manifest; no forbidden ownership/imports/patterns; prior files remain outside manifest | AC1, AC8 |
| P1 | Component/a11y | Long Russian copy, target sizing, no color-only meaning, axe, no focus theft on background updates | AC2–5, AC7 |
| P1 | Browser | Width/theme/zoom/reduced-motion/state matrix, explicit mobile flow, focus return, overflow, console, axe | AC7–8 |
| P1 | Regression | Story 166.4/166.6/166.7 and representative route/domain consumer locks stay green read-only | AC1, AC8 |

## RED Qualification

- All seven direct test files are created before any approved production path exists.
- Tests remain active and unskipped. `test.skip` is not used because the project contract requires executable genuine RED, stronger than the generic TEA skip convention.
- RED qualifies only if failures are caused by absent Story-owned modules or the missing approved production manifest/global owner.
- Syntax, environment, fixture, selector, network, browser, consumer, package/lock, or unrelated failures invalidate RED and must be corrected before production creation.
- Type-only negative assertions may erase at runtime but remain enforced by the pinned `tsc --noEmit` gate after production creation.

## Component and Contract Assertions

### PageState

- Every state exposes a stable `data-state` and visible Russian title/explanation/trust/next-action evidence.
- Error is an alert; routine states are polite statuses; background refresh is restrained and does not autofocus.
- Terminal states prohibit retained content; stale/partial/refreshing retain caller content and name limitations.
- Filtered-empty requires scope plus reset; error requires recovery; restricted/not-found expose a next valid action.

### AsyncOperationStatus

- Exact operation name and scope are programmatically associated with the status.
- Phase covers idle/validating/queued/running/cancellable/non-cancellable/partial/complete/failed/retrying/expired.
- Progress is absent when unknown; `0` and `100` remain truthful when supplied.
- Cancellable requires a cancel action; non-cancellable explicitly explains why; safe-leave and next-action text are visible.
- Re-rendered progress does not move focus.

### BulkResultSummary

- Attempted/succeeded/failed/skipped/pending render as exact tabular counts, including zeros.
- Invalid negative/non-integer or non-reconciling totals are rejected by the contract.
- Partial results persist inline as a named section and never rely on a toast.
- Failed-item reasons arrive as caller-owned semantic table content from Story 166.6; retry scope and action are explicit only when failures exist.

### ContextualSplitView

- Named list and detail landmarks preserve caller-rendered filters/list/detail content.
- No-selection, loading-detail, selected, detail-error, stale-detail, and restricted-detail are explicit.
- Wide and narrow projections are deliberate CSS/layout surfaces; narrow selected detail has a semantic back/close action.
- Selection focus moves to the provided detail heading on deliberate selection; close invokes the caller and restores focus to the provided selected item.
- The composition contains no state, URL, router, query, filter, scroll, queue, or mutation ownership.

### Global not-found

- `src/app/not-found.tsx` renders Russian explanation and one semantic link to `/`.
- It is server-compatible, contains no client hooks, does not echo a path, and has no competing root/global owner.

## GREEN Browser Evidence

- Temporary harness: `src/app/(story-166-8-page-states-harness)/page-states-harness/**`; created only after Story GREEN and removed before universal validation.
- Actual CSS viewports `195/320/390/768/1024/1280/1440/1600` were set through standalone Playwright; `window.innerWidth` matched each requested width and document/main horizontal overflow remained `0` at every width after a temporary harness-only min-content repair. The physical `195px` viewport is the representative 200% reflow proof; no CSS zoom was used for the accepted evidence.
- Every viewport rendered the complete matrix: `12` PageState states, `11` async phases, `4` bulk outcomes, and `6` contextual states. Long Russian copy wrapped and all visible Story action targets measured at least `44px` high.
- Light and dark theme switches retained zero overflow and non-color text/icon status meaning. The final dark/reduced-motion run recorded axe `0` violations / `36` passes / `0` incomplete checks and no browser warnings or errors.
- All exercised Story action targets measured at least `44px` high. Narrow selection hid only the list projection, showed the single detail landmark, and wide selection A then B moved focus to `Поставка А-104` and `Поставка Б-208` respectively.
- Live Chromium exposed that removing a composition-added `tabindex=-1` immediately after `focus()` returned focus to `body`. The repair retains the temporary attribute only while the heading owns focus and removes it once on blur. Post-repair browser evidence recorded active `H3` focus with `tabindex=-1` for A and B; selected-to-stale for the same key preserved focus on the internal action instead of stealing it.
- Exact attempted/succeeded/failed/skipped/pending counts, zero/missing/negative-RUB distinctions, non-toast inline partial evidence, failed-item table, retry scope, cancellable/non-cancellable guidance, and safe-leave copy remained visible without hover.
- The busy reduced-motion fixture rendered the real production `PageState state=loading`. Playwright applied `page.emulateMedia({ reducedMotion: 'reduce' })`; `matchMedia('(prefers-reduced-motion: reduce)').matches` returned `true` and the production icon computed `animation-name: none`. Document/main overflow remained `0`.
- Axe in the repaired live harness: `0` violations, `36` passes, `0` incomplete. Browser console: `0` warnings/errors.
- Real unmatched URL `/story-166-8-unmatched-proof`: HTTP `404`; Russian `Страница не найдена`, trust explanation, and semantic `Вернуться на главную` link to `/`; the requested path was not disclosed.
- Cleanup: temporary files and empty directories removed; dev server stopped with clean `Ctrl-C`; port `3100` no longer listening; the named `story1668proof` browser was closed and `playwright-cli list --json` returned an empty browser list; generated `.next` removed.

## State-by-State Disposition

| Contract | State | Component/type evidence | Browser evidence or explicit N/A |
| --- | --- | --- | --- |
| PageState | `loading` | Polite busy semantics and required trust | Full 195–1600 matrix; genuine reduced-motion busy fixture |
| PageState | `refreshing` | Exhaustive vocabulary; retained-state type contract | Full 195–1600 matrix; retained content visible |
| PageState | `empty` | Exhaustive vocabulary; terminal children rejected | Full 195–1600 matrix |
| PageState | `filtered-empty` | Required scope/reset compile-time and render assertions | Full 195–1600 matrix; reset action visible |
| PageState | `error` | Required caller recovery; alert and keyboard interaction | Full 195–1600 matrix; recovery visible |
| PageState | `offline` | Exhaustive vocabulary and shared terminal contract | Full 195–1600 matrix |
| PageState | `stale` | Retained limitation/children contract; axe fixture | Full 195–1600 matrix; retained content visible |
| PageState | `partial` | Retained data, limitation, context, live-boundary tests | Full 195–1600 long-Russian matrix |
| PageState | `restricted` | Required next action and trust | Full 195–1600 matrix; required action visible |
| PageState | `not-found` | Required action/trust; global boundary tests | Full matrix plus real unmatched HTTP 404 recovery |
| PageState | `processing` | Exhaustive vocabulary and busy implementation | Full 195–1600 matrix |
| PageState | `success` | Exhaustive vocabulary and terminal contract | Full 195–1600 matrix |
| AsyncOperationStatus | `idle` | Exhaustive vocabulary and presentation record | Full 195–1600 matrix |
| AsyncOperationStatus | `validating` | Explicit active cancellability contract | Full 195–1600 matrix; cancel action visible |
| AsyncOperationStatus | `queued` | Explicit active cancellability contract | Full 195–1600 matrix; non-cancellable reason visible |
| AsyncOperationStatus | `running` | Scope/progress/safe-leave/focus tests | Full 195–1600 matrix with truthful progress/cancel evidence |
| AsyncOperationStatus | `cancellable` | Required caller cancel evidence | Full 195–1600 matrix; caller cancel action visible |
| AsyncOperationStatus | `non-cancellable` | Required reason evidence | Full 195–1600 matrix; reason visible |
| AsyncOperationStatus | `partial` | Exhaustive vocabulary and presentation record | Full 195–1600 matrix |
| AsyncOperationStatus | `complete` | Exhaustive vocabulary and presentation record | Full 195–1600 matrix |
| AsyncOperationStatus | `failed` | Assertive concise live semantics | Full 195–1600 matrix |
| AsyncOperationStatus | `retrying` | Explicit active cancellability contract | Full 195–1600 matrix; non-cancellable reason visible |
| AsyncOperationStatus | `expired` | Exhaustive vocabulary and presentation record | Full 195–1600 matrix |
| BulkResultSummary | `pending` | Positive-pending invariant; contradictions rejected | Full 195–1600 matrix with exact counts/evidence |
| BulkResultSummary | `partial` | Mixed limited/retained invariant; retry evidence | Full 195–1600 inline partial fixture |
| BulkResultSummary | `complete` | Failure/pending contradictions rejected | Full 195–1600 matrix with exact counts |
| BulkResultSummary | `failed` | Every attempted item fails; retry evidence required | Full 195–1600 matrix with failed-item/retry evidence |
| ContextualSplitView | `no-selection` | Named list/detail projections and message | Full 195–1600 matrix; narrow list and wide dual-pane projection |
| ContextualSplitView | `loading-detail` | Exhaustive vocabulary and busy detail semantics | Full 195–1600 matrix |
| ContextualSplitView | `selected` | Selection-key focus and native back contracts | Full matrix plus A→B focus and narrow detail transition |
| ContextualSplitView | `detail-error` | Required rendered recovery and alert semantics | Full 195–1600 matrix; recovery visible |
| ContextualSplitView | `stale-detail` | Stable subtree and no-focus-theft test | Full matrix plus selected→stale focus preservation |
| ContextualSplitView | `restricted-detail` | Stable retained detail and message contract | Full 195–1600 matrix |

## Post-1st-pass-review fixes (2026-08-13)

- Accepted all eight pass-1 findings (`4 High`, `4 Medium`) and repaired them test-first.
- Native focus-return controls remain in sequential tab order; temporary tabindex is limited to non-focusable programmatic targets and removed on blur.
- Detail focus follows caller-owned `selectionKey`, so same-state entity reselection focuses while background stale/restricted presentation changes do not.
- Bulk outcomes reject contradictory count combinations and mismatched failure/retry evidence.
- Every page state requires trust; `restricted` and `not-found` require a next valid action.
- Page and async live regions announce only concise atomic transitions; retained content, progress, guidance, and actions stay outside.
- Narrow return is a composition-owned native button with direct Enter/Space coverage.
- The exact 7+7 source manifest includes the app test owner and stronger formatter/calculation/raw-data/store prohibitions.
- State vocabularies use exhaustive `satisfies Record<...>` objects; the table above dispositions all `12 + 11 + 4 + 6` states.
- Corrected browser repair RED additionally locked long action-label wrapping and real browser focus retention.

## Post-2nd-pass-review fixes (2026-08-13)

- Accepted all eight pass-2 findings (`3 High`, `5 Medium`) and repaired them test-first. The affected four-suite RED produced exactly `6` failures before production changes.
- Active `validating`, `queued`, `running`, and `retrying` phases now require visible cancellable or non-cancellable evidence; passive phases alone may use `not-applicable`.
- Page, async cancel, bulk retry, and contextual recovery actions require rendered React elements; blank trust and invalid runtime evidence throw explicit errors.
- A failed bulk outcome requires `failed === attempted`, preventing skipped items from contradicting the outcome.
- Close-focus restoration retries for at most three animation frames until the caller target is connected and visible; caller-updated tabindex values survive composition cleanup.
- The concise PageState live node is named by the visible title and contains only the explanation, avoiding duplicate title speech.
- The temporary GREEN harness rendered all `12 + 11 + 4 + 6` states at every actual viewport. Genuine reduced-motion media emulation and the true `195px` viewport replaced the rejected CSS override/zoom evidence.
- The named browser, dev server, harness directories, and generated `.next` were removed after evidence collection.

## Convergence-review fixes (2026-08-13)

- The independent convergence review requested two final changes (`1 High`, `1 Medium`), both accepted and repaired test-first.
- Genuine convergence RED produced `3` failed suites, `3` failed tests, and `23` passed tests: optional PageState and AsyncOperationStatus string actions rendered without rejection, and a valid terminal `failed + skipped` bulk vector could not render as any outcome.
- Optional page/async follow-up actions now use `ReactElement` contracts and every supplied optional action is runtime-validated with `isValidElement`; compile-time and runtime string regressions remain active.
- `outcome="partial"` now accepts the truthful terminal vector `attempted=2, succeeded=0, failed=1, skipped=1, pending=0` with caller-owned failed-item and retry evidence. The same vector remains invalid for `outcome="failed"`, which still requires `failed === attempted`.
- Affected GREEN passed `3/3` suites and `26/26` tests; the exact Story suite passed `7/7` files and `45/45` tests.
- Fresh convergence verification returned `APPROVED` after reviewing all exact `7 + 7` Story files, with zero unresolved Critical, High, Medium, or Low findings.

## Genuine RED Evidence

The exact seven-test manifest was created before any approved production path existed and run with:

```text
PATH=/private/tmp/wb-fe-166-4-toolchain/npm-11.11.0/bin:/private/tmp/wb-fe-166-4-toolchain/node-v24.18.0-darwin-arm64/bin:$PATH \
  npx vitest run \
  src/components/product/states/__tests__/PageState.test.tsx \
  src/components/product/states/__tests__/AsyncOperationStatus.test.tsx \
  src/components/product/states/__tests__/BulkResultSummary.test.tsx \
  src/components/product/states/__tests__/ContextualSplitView.test.tsx \
  src/components/product/states/__tests__/StateContracts.test.ts \
  src/components/product/states/__tests__/state-composition-source-contracts.test.ts \
  src/app/__tests__/not-found.test.tsx
```

Result: exit `1`; `6/7` suites failed and `1/7` passed. Five component/boundary suites failed only because `PageState`, `AsyncOperationStatus`, `BulkResultSummary`, `ContextualSplitView`, and `src/app/not-found.tsx` did not exist. The source-contract suite failed only because the six-file product production manifest and root not-found owner were absent. `StateContracts.test.ts` passed because its type-only vocabulary imports erase at runtime; the same contracts remain enforced by the later TypeScript gate. No syntax, environment, fixture, selector, browser, network, package/lock, consumer, or unrelated failure contaminated RED.

One test-only path expression in the source reader was normalized from `../../app` to the correct `../../../app` after RED inspection and before production creation. This does not weaken or change any expected product behavior.

## Validation and Completion

- Prerequisites satisfied: yes.
- Exact active test manifest created: yes, seven files, no skips.
- Checklist mapped to all Story criteria: yes.
- Genuine RED caused only by absent Story-owned implementation: yes.
- API tests: N/A; no API ownership.
- Route-domain E2E tests: N/A during RED; browser evidence follows GREEN through a temporary Story harness and the real global boundary.
- Browser sessions created during ATDD RED: none; no orphaned session exists.
- Persistent artifacts are stored under `_bmad-output/test-artifacts`; no random temp artifact is required.

Current final GREEN evidence: exact Story suite `7/7` files and `45/45` tests; full Vitest `1131/1131` files and `18352/18352` tests; Next production build compiled, passed TypeScript, and generated `70/70` static pages. Pinned full format, zero-warning lint, type-check, max-lines, privacy/static/YAML/diff gates passed; documentation citations retained the approved `18`-entry baseline. Representative read-only consumer locks previously passed `31/31` files and `459/459` tests. All accepted findings are repaired, and fresh independent convergence verification is `APPROVED` with zero unresolved findings.

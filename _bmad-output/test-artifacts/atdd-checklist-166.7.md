---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-08-12'
inputDocuments:
  - .agents/skills/bmad-testarch-atdd/SKILL.md
  - .agents/skills/bmad-testarch-atdd/workflow.md
  - .agents/skills/bmad-testarch-atdd/steps-c/step-01-preflight-and-context.md
  - .agents/skills/bmad-testarch-atdd/steps-c/step-02-generation-mode.md
  - .agents/skills/bmad-testarch-atdd/steps-c/step-03-test-strategy.md
  - .agents/skills/bmad-testarch-atdd/steps-c/step-04c-aggregate.md
  - .agents/skills/bmad-testarch-atdd/steps-c/step-05-validate-and-complete.md
  - .omx/plans/166.7-deliver-chartframe-and-accessible-analytical-evidence.md
  - _bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/shadcn-route-ledger.md
  - _bmad-output/implementation-artifacts/166-7-fe-deliver-chartframe-and-accessible-analytical-evidence.md
  - _bmad-output/test-artifacts/atdd-checklist-166.6.md
  - src/components/custom/analytics/ResponsiveChartFrame.tsx
  - package.json
---

# ATDD Checklist: Story 166.7 — ChartFrame and Accessible Analytical Evidence

## Step 1 — Preflight and Context

### Story lane and prerequisites

- Story: `166.7 — Deliver ChartFrame and Accessible Analytical Evidence`.
- Status at ATDD start: `in-progress`.
- Detected stack: `frontend`.
- Test frameworks: Vitest + React Testing Library for Story-owned component/type/source contracts; Playwright is available for later browser and accessibility evidence.
- Runtime: Node `24.18.0`, npm `11.11.0`.
- Branch: `cdx/epic-166-story-7-chart-evidence`.
- Worktree: `/private/tmp/wb-fe-166-7-deliver-chartframe-and-accessible-analytic`.
- Base: `1cfd3daad69845f0bd56c075fafd89ddb947a62b`.
- Merged prerequisites: Stories 166.1–166.6 are ancestors of the Story base.
- Worktree-local dependencies: installed with the pinned runtime; `node_modules` is a real directory and package/lock files remain unchanged.
- Pre-edit behavior lock: 11 representative existing chart files and 388 tests passed before Story-owned test generation.

### Exact Story scope

The Story creates a route-free product chart composition under `src/components/product/charts/**`. It standardizes chart identity, data-trust framing, positive-size containment, accessible evidence, non-color legend semantics, and presentation of caller-formatted tooltip values. It does not adopt the composition into existing charts.

Owned production manifest:

- `src/components/product/charts/ChartEvidence.tsx`
- `src/components/product/charts/ChartFrame.tsx`
- `src/components/product/charts/ChartLegend.tsx`
- `src/components/product/charts/ChartState.tsx`
- `src/components/product/charts/ChartTooltipContent.tsx`
- `src/components/product/charts/contracts.ts`
- `src/components/product/charts/index.ts`

Direct Story test manifest:

- `src/components/product/charts/__tests__/ChartEvidence.test.tsx`
- `src/components/product/charts/__tests__/ChartFrame.test.tsx`
- `src/components/product/charts/__tests__/ChartLegend.test.tsx`
- `src/components/product/charts/__tests__/ChartState.test.tsx`
- `src/components/product/charts/__tests__/ChartTooltipContent.test.tsx`
- `src/components/product/charts/__tests__/ChartContracts.test.ts`
- `src/components/product/charts/__tests__/chart-composition-source-contracts.test.ts`

Read-only boundaries include `src/components/product/index.ts`, all earlier product subtrees, UI primitives, tokens/styles, `src/lib/chart-colors.ts`, the legacy `src/components/custom/analytics/ResponsiveChartFrame.tsx` and its tests, every existing route/custom chart consumer, APIs, hooks, stores, queries, routers, calculations, series builders, formatters, package surfaces, and backend/public contracts.

### Existing behavior and ownership evidence

- The legacy shared frame has eight direct production consumers across multiple route/domain owners. Story 166.7 inventories and regression-tests it read-only; adoption and retirement belong to later route Stories.
- Existing consumers retain Recharts component trees, responsive mounting, series/axis construction, lazy behavior, formatting, visibility state, selection, drill-down, queries, URLs, and navigation.
- The new product contract must remain Recharts-independent and server-compatible: no `use client`, chart-library, router, query, API, store, hook, raw-data, calculation, or formatter ownership.
- The new frame uses a semantic `figure` or labelled group with a separately named plot group. It must not place `role="img"` around evidence or interactive descendants.

### TEA configuration and profile

- `tea_use_playwright_utils: true`
- `tea_use_pactjs_utils: false`
- `tea_pact_mcp: none`
- `tea_browser_automation: auto`
- `tea_execution_mode: auto`
- `tea_capability_probe: true`
- `test_stack_type: auto`

The repository contains frontend browser tests using Playwright. Full UI guidance therefore informs the later browser-evidence phase. This Story owns no API, request, mutation, route, or navigation journey, so API tests, network fixtures, auth fixtures, and permanent route E2E files are intentionally not generated.

## Step 2 — Generation Mode

Mode: **AI generation with active component, type, accessibility, and source-contract tests**.

Reasoning:

- Acceptance criteria and the product-only ownership boundary are explicit.
- The owned surface is a composition library, not a user route or backend endpoint.
- A live recording cannot discover components that do not exist yet without inventing a permanent route.
- Tests must be active and unskipped so the first run demonstrates genuine failure caused by absent Story-owned modules and manifest.
- Browser recording is deferred until GREEN, when a localhost-only temporary harness can exercise responsive, theme, zoom, keyboard, touch, reduced-motion, console, and axe behavior. The harness and browser session must be removed before staging.

## Step 3 — Test Strategy

### State and type taxonomy

Tests must keep independent concepts on separate axes:

- Terminal data-trust states: `loading | empty | unavailable | error`.
- Retained-data states: `rendered | partial | stale`.
- Orthogonal background activity: `updating`.
- Caller-owned interaction/context: `selected` and `comparison`.
- Semantic series roles: `categorical | positive | negative | reference | target | forecast | confidence | selection`.
- Non-color marker vocabulary: caller-visible shapes/patterns such as `solid`, `dashed`, `dotted`, `point`, `bar`, `area`, and `band`.

Terminal states prohibit plot and evidence. Retained-data states require caller-rendered plot plus `ChartEvidence`. Partial and stale keep valid evidence visible while naming their limitation. Updating never replaces retained evidence.

### Acceptance-criteria coverage matrix

| Priority | Level | Acceptance behavior | Expected genuine RED cause |
|---|---|---|---|
| P0 | Static/source | Exact seven-file production and seven-file direct-test manifests; route-free subtree; no root-barrel change | production subtree is absent or incomplete |
| P0 | Static/source | Reject Recharts/chart-library, router/navigation, API/query/store/hook, raw-data, calculation, formatter, raw-palette, client-state, and `use client` ownership | owned production modules are absent |
| P0 | Type/component | Discriminated terminal versus retained frame props; terminal states cannot receive plot/evidence and retained states require both | `contracts` and `ChartFrame` modules are absent |
| P0 | Component | Loading/empty/unavailable/error remain truthful and never fabricate plot, evidence, alternative, or zero | `ChartState`/`ChartFrame` modules are absent |
| P0 | Component | Rendered/partial/stale retain caller plot and evidence; partial/stale visibly name limitations; updating remains orthogonal | `ChartFrame`/`ChartState` modules are absent |
| P0 | Accessibility/component | Visible and associated title, period, units, optional description/context; semantic figure and named positive-size plot group | `ChartFrame` module is absent |
| P0 | Accessibility/component | Summary and named keyboard-reachable data alternative are both required; neither is hidden by an image role | `ChartEvidence`/`ChartFrame` modules are absent |
| P0 | Component/source | Caller plot is rendered unchanged without clone, inspection, series construction, or Recharts ownership | `ChartFrame` module is absent |
| P1 | Component | Legend exposes text, semantic role labels, non-color markers, and textual/programmatic visibility without owning visibility state | `ChartLegend` module is absent |
| P1 | Component | Target, forecast, confidence, selection, categorical, positive, negative, and reference meanings remain distinct without color-only evidence | `ChartLegend`/contract modules are absent |
| P1 | Component | Tooltip renders caller-formatted strings exactly, preserving negative sign, full precision, unit, role, marker, label, and detail | `ChartTooltipContent` module is absent |
| P1 | Component | Selection evidence and resulting actions stay caller-controlled, keyboard reachable, touch-sized, and not hover-only | `ChartEvidence`/legend modules are absent |
| P1 | Accessibility | Story-owned component fixtures pass axe checks and expose accessible names/relationships without `role="img"` flattening | Story-owned modules are absent |
| P1 | Source/type | Reduced-motion adoption is expressible without the generic layer importing animation libraries, observing media queries, or mutating consumer animation | contract modules are absent |
| P2 | Browser | 320/390/768/1024/1280/1440/1600 widths, 200% reflow, long Russian content, dense legend, signed RUB precision, zero/missing states, light/dark, focus/touch, reduced motion, console and axe | deferred until GREEN temporary harness exists |
| P2 | Regression | Legacy frame and representative route/custom chart suites remain green with byte-for-byte production consumers | run read-only after GREEN |

### Required component and accessibility assertions

#### `ChartFrame.test.tsx`

- Shows title, period, units, optional description, freshness, comparison, annotation, and caller actions in semantic reading order.
- Associates the title and descriptive context with the frame and plot.
- Gives the plot a programmatic name, `role="group"` or equivalent non-flattening semantics, positive minimum dimensions, and bounded overflow.
- Never uses `role="img"` around evidence or interactive descendants.
- Renders the caller-supplied plot node without cloning, inspecting, or transforming it.
- Retains plot and evidence while updating, partial, or stale and visibly names the retained-data limitation.
- Excludes plot/evidence for loading, empty, unavailable, and error presentations.
- Preserves caller-owned actions as keyboard/touch reachable elements.
- Passes component axe checks for terminal and retained fixtures.

#### `ChartState.test.tsx`

- Distinguishes loading, empty, unavailable, and error rather than mapping absence to zero.
- Provides visible non-color state text and permits a caller-owned recovery action only where supplied.
- Names partial/stale limitations and orthogonal updating without replacing valid retained content.
- Does not own requests, retry logic, timers, polling, or state transitions.

#### `ChartEvidence.test.tsx`

- Requires a decision-supporting textual summary and a separately named data alternative.
- Makes the named alternative keyboard reachable while preserving caller-supplied semantic table/list content.
- Preserves caller-rendered zero, negative, missing, unavailable, full-precision, signed, unit, period, comparison, and limitation text verbatim.
- Presents optional selection evidence and caller-owned export/download/detail actions without hover-only access.
- Does not accept, sort, aggregate, calculate, interpret, or format raw rows.
- Passes axe checks with interactive evidence descendants.

#### `ChartLegend.test.tsx`

- Renders every series with visible text, semantic role text, and a non-color marker/pattern.
- Keeps `target`, `forecast`, `confidence`, and `selection` visually/programmatically distinct from categorical, sign, and reference roles.
- Exposes hidden/visible meaning textually and programmatically when the caller supplies controlled visibility actions.
- Never derives role, color, visibility, ordering, or action state from values or names.
- Preserves caller order and keeps caller-owned actions keyboard/touch operable.

#### `ChartTooltipContent.test.tsx`

- Displays already formatted values without number parsing or reformatting.
- Preserves a large negative RUB value, explicit plus/minus sign, full precision, unit, missing/unavailable strings, role, marker meaning, and detail text exactly.
- Uses non-color series evidence and never requires hover as the only access path to essential chart meaning.
- Does not accept raw numeric domain rows or own locale/precision calculations.

#### `ChartContracts.test.ts`

- Proves the terminal/retained discriminated union and orthogonal activity model.
- Proves retained frames require both plot and evidence while terminal frames prohibit both.
- Freezes the eight semantic series roles and non-color marker vocabulary.
- Keeps selection evidence, comparison context, state, activity, tooltip entries, and series evidence as distinct types.
- Uses type-level negative assertions for contradictory props and raw-data/formatter ownership where applicable.

#### `chart-composition-source-contracts.test.ts`

- Enforces the exact production and direct-test manifests.
- Rejects files outside `src/components/product/charts/**` from the Story-owned production surface.
- Rejects `use client`, Recharts/other chart-library imports, router/navigation, API/query/store/hook, route/domain types, raw data, calculations, formatters, raw hex/palette logic, storage, timers, media-query hooks, and child-cloning/inspection ownership.
- Proves `src/components/product/index.ts`, the legacy frame, prior product subtrees, packages/lock, primitives/tokens/styles, routes, and custom consumers remain unchanged through exact scope audits.
- Allows semantic chart token class names but rejects generic-layer value-to-color or name-to-role inference.

## Genuine Test-Only RED Contract

### Preconditions

- All seven direct Story test files exist and remain active/unskipped.
- No Story-owned production file listed above exists when the first RED command begins.
- The product chart subtree contains only `__tests__/**` at RED time.
- No API, route E2E, fixture infrastructure, temporary harness, or dependency is created for RED.
- Package/lock, product root barrel, legacy frame, routes, consumers, hooks, APIs, query state, calculations, and formatters have zero diff.

### Expected RED command

Run with the pinned runtime:

```bash
PATH=/private/tmp/wb-fe-166-4-toolchain/npm-11.11.0/bin:/private/tmp/wb-fe-166-4-toolchain/node-v24.18.0-darwin-arm64/bin:$PATH \
npm test -- --run \
  src/components/product/charts/__tests__/ChartEvidence.test.tsx \
  src/components/product/charts/__tests__/ChartFrame.test.tsx \
  src/components/product/charts/__tests__/ChartLegend.test.tsx \
  src/components/product/charts/__tests__/ChartState.test.tsx \
  src/components/product/charts/__tests__/ChartTooltipContent.test.tsx \
  src/components/product/charts/__tests__/ChartContracts.test.ts \
  src/components/product/charts/__tests__/chart-composition-source-contracts.test.ts
```

Expected result: non-zero exit caused only by unresolved Story-owned modules and the absent exact production manifest. Syntax, transform, environment, fixture, selector, browser, network, or unrelated regression failures do not qualify as genuine RED and must be repaired before implementation begins.

### RED evidence recording template

- Command started: `2026-08-12 23:53:33 Europe/Moscow` with the pinned Node `24.18.0` / npm `11.11.0` PATH.
- Production-absence proof: pass; `find src/components/product/charts -maxdepth 1 -type f` returned zero files and the subtree contained exactly the seven `__tests__/**` files.
- Exit code: `1`.
- Test files collected: `7 / 7`.
- Test files failed as expected: `6 / 7`; the five component suites failed import analysis on their absent Story modules and the source-contract suite failed the absent production manifest/semantic-token assertions.
- Type-only runtime suite: `ChartContracts.test.ts` passed because its type imports and guarded negative fixtures are erased at Vitest runtime; the same file remains part of the later TypeScript gate, where the public types must resolve and the `@ts-expect-error` assertions must be consumed.
- Runtime assertions: source suite collected 5 assertions, with 2 absent-production failures and 3 boundary/test-manifest assertions already passing.
- Unexpected environment/syntax/fixture/network failures: none.
- Package/lock zero diff: pass.
- Legacy frame and route/custom consumer zero diff: pass.
- Genuine RED disposition: pass. The failures were caused only by the deliberately absent Story-owned API/manifest, not by syntax, environment, selector, fixture, browser, network, or unrelated regression defects.

The implementation agent must replace these placeholders with exact command evidence and mirror the result in the Story Debug Log/Evidence Matrix before creating any production chart file.

## Deferred GREEN Browser and Accessibility Evidence

No browser is opened and no browser test or harness is created during ATDD RED. After Story-owned tests reach GREEN, use a temporary localhost-only harness and remove it before staging.

Recording template:

- Harness path and purpose: temporary `src/app/(story-166-7-chart-harness)/chart-harness/**` plus its private fixture; exercised the route-free product composition only.
- Harness creation/removal proof: pass; both temporary directories and all files were removed before universal validation and are absent from `git status`.
- Frontend server: pinned `npm run dev` on localhost `3100`; clean `Ctrl-C` shutdown after evidence capture.
- Browser session: in-app Chromium session finalized with no kept tabs; final clean tab was used after repairing a temporary harness-only Strict Mode axe double-run.
- Widths: `320`, `390`, `768`, `1024`, `1280`, `1440`, `1600` — pass. Plot widths were `288`, `358`, `704`, `960`, `1088`, `1088`, `1088`; plot height remained `240` at 100%.
- 200% CSS zoom/reflow at 390 px — pass; heading/evidence remained visible, deliberate plot height became `480`, and document overflow remained zero.
- Document-level horizontal overflow at every width — `0`; main overflow also `0`.
- Long Russian title/period/units and dense legend — visible; semantic order remained exactly `identity -> context -> plot -> evidence` at every width; no visual reordering utility is present.
- Light theme: `rgb(255, 255, 255)` / `rgb(33, 33, 33)`; dark theme: `rgb(10, 10, 10)` / `rgb(250, 250, 250)`; both passed with zero document overflow.
- Large negative RUB/full precision, zero, missing, and unavailable evidence — visible in the keyboard-reachable alternative and tooltip fixture.
- Target/forecast/confidence/selection non-color distinctions — visible text plus point/dashed/band/area markers.
- Keyboard/touch/no-hover: named data alternative has `tabIndex=0`; two critical caller actions measured `44px` high (`334x44`, `249x44`); summary/table/legend expose essential meaning without hover.
- Reduced-motion adoption: environment reported the media-query state and the generic production layer remained hook/animation-library free; caller-owned adoption contract preserved.
- Console: final clean browser tab contained zero warnings/errors. An earlier temporary-harness-only Strict Mode duplicate axe invocation was repaired before final evidence and the harness was deleted.
- Axe WCAG scan: `0` violations, `23` passes, `0` incomplete on the final clean harness.
- Post-pass-1 browser recheck: at 390 px all eight legend/tooltip markers measured `16x12`; all six caller link actions measured `44px` high; numeric zero context and tooltip label remained visible; document/main overflow stayed `0`; console warnings/errors remained `0`; temporary route, server, viewport override, and tab were removed/reset.
- Post-pass-2 browser recheck: at 390 px the frame, legend, evidence, and error-recovery inline role-buttons each measured `44px` high and accepted Enter (`4/4` activations); the legend exposed the description `Прогноз. Пунктирная линия. Скрыта.`; raw English role/marker enum copy was absent; document/main overflow stayed `0`; console warnings/errors remained `0`. The temporary route, server, browser tabs, viewport override, and stale generated validator were removed/reset.

## Read-Only Regression Evidence After GREEN

At minimum rerun the 11-file / 388-test pre-edit baseline covering:

- `src/components/custom/ExpenseChart.test.tsx`
- `src/components/custom/MarginTrendChart.test.tsx`
- `src/components/custom/TrendGraph.test.tsx`
- `src/components/custom/analytics/ResponsiveChartFrame.test.tsx`
- `src/components/custom/analytics/__tests__/FbsTrendsChart.test.tsx`
- `src/components/custom/analytics/__tests__/SeasonalPatternsChart.test.tsx`
- `src/components/custom/analytics/__tests__/TrendsLegend.test.tsx`
- `src/components/custom/analytics/__tests__/TrendsTooltip.test.tsx`
- `src/components/custom/dashboard/__tests__/ExpenseStructurePieChart.test.tsx`
- `src/components/custom/dashboard/__tests__/HistoricalTrendsSection.test.tsx`
- `src/app/(dashboard)/monitor/components/__tests__/MonitorWeeklyChart.test.tsx`

Add available high-value forecast, confidence, controlled selection, drill-down, and negative/waterfall chart tests without editing their source. Passing regression suites prove preservation, not adoption of the new product contract.

## ATDD Preflight Completion State

- Prerequisites and exact isolated lane: pass.
- Acceptance criteria and ownership boundaries: pass.
- AI generation mode selection: pass.
- Component/type/accessibility/source test strategy: complete.
- API tests: N/A; no endpoint or request contract is owned.
- Route E2E tests: N/A; no route or navigation journey is owned.
- Browser recording: deferred until GREEN temporary harness.
- Test files created: pass; exact seven-file direct manifest present and active/unskipped.
- Genuine RED executed: pass; 7 files collected, exit `1`, expected absent-module/manifest failures only.
- Production implementation: now authorized after the recorded genuine RED.
- Temporary artifacts/browser sessions: none created during this documentation preflight.

Final post-pass-2 evidence: six focused RED failures preceded production repair; Story-owned suite is `7/7` files and `45/45` tests. The same independent pass-2 reviewer confirmed all three repairs, reran 45/45 Story tests and 388/388 representative consumer tests, and approved with zero unresolved Critical/High/Medium/Low findings. Final post-review validation passed full Vitest `1124/1124` files and `18307/18307` tests, production build `70/70`, and every pinned universal static/privacy/repository gate. The broader read-only consumer regression remains `18/18` files and `472/472` tests. Next workflow step: exact Story integration and cleanup.

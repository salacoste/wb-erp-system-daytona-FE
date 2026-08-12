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
  - .agents/skills/bmad-testarch-atdd/resources/tea-index.csv
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/data-factories.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/component-tdd.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/test-quality.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/test-healing-patterns.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/selector-resilience.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/timing-debugging.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/overview.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/api-request.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/network-recorder.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/auth-session.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/intercept-network-call.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/recurse.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/log.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/file-utils.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/network-error-monitor.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/fixtures-composition.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/playwright-cli.md
  - _bmad/tea/config.yaml
  - .omx/plans/166.6-deliver-responsivetable-and-data-table-contracts.md
  - _bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/shadcn-route-ledger.md
  - _bmad-output/implementation-artifacts/166-6-fe-deliver-responsivetable-and-data-table-contracts.md
  - src/components/ui/table.tsx
  - package.json
---

# ATDD Checklist: Story 166.6 — ResponsiveTable and Data-Table Contracts

## Step 1 — Preflight and Context

### Stack and prerequisites

- Detected stack: `frontend`.
- Test frameworks: Vitest + React Testing Library for Story-owned component/type/source contracts; Playwright is configured for later visual/browser evidence.
- Development environment: available in the isolated Story worktree.
- Runtime: Node `24.18.0`, npm `11.11.0`.
- Story acceptance criterion and ownership: clear in the canonical BMAD artifact and fully expanded in the Story implementation artifact.
- Merged prerequisites: Stories 166.1–166.5 are ancestors of base `95681d01862414ba65aea5746953870739915c9a`.
- Worktree-local dependencies: installed with pinned `npm ci`; `node_modules` is not a symlink.

### TEA configuration

- `tea_use_playwright_utils: true`
- `tea_use_pactjs_utils: false`
- `tea_pact_mcp: none`
- `tea_browser_automation: auto`
- `tea_execution_mode: auto`
- `tea_capability_probe: true`
- `test_stack_type: auto`

Frontend browser tests containing `page.goto`/`page.locator` exist, so the full UI+API Playwright Utils profile and Playwright CLI guidance were loaded. The Story itself owns no API or route; API, auth, network, file, and polling fragments therefore inform later browser evidence only and do not justify new test infrastructure or dependencies.

### Existing framework and behavior patterns

- The existing hardened `Table` primitive already provides native semantics, a single overflow wrapper, caption support, default column scopes, and optional named focusable overflow.
- Existing server/static table consumers retain route/domain sorting, selection, pagination, formatting, row actions, and state ownership.
- Existing controlled pagination patterns guard first/last/loading boundaries and expose accessible previous/next labels.
- The only specialized virtualized production consumer is `OrderPickerTable` using the already pinned `react-window` package.
- No TanStack Table/Virtual dependency exists; Story 166.6 forbids adding one.

## Step 2 — Generation Mode

Mode: **AI generation with component/static contracts**.

Reasoning:

- Acceptance criteria and the owned surface are explicit.
- The Story creates a route-free presentation contract rather than a user route or API endpoint.
- Live recording cannot discover an absent route-free component and would require a temporary harness before the Story contract is frozen.
- Selector and browser recording are deferred to the GREEN browser-evidence phase, where any temporary harness must be removed before staging.

## Step 3 — Test Strategy

### Coverage matrix

| Priority | Level | Scenario | Expected RED cause |
|---|---|---|---|
| P0 | Component | Native table/caption/header/row/cell semantics, primary column, explicit horizontal-scroll strategy, named keyboard-reachable overflow | `ResponsiveTable` module is absent |
| P0 | Component | Loading vs empty vs filtered-empty vs error/recovery; stale/partial/updating retain caller-rendered rows | `TableState`/frame modules are absent |
| P0 | Component | Controlled pagination first/middle/last/single/zero boundaries, loading/disabled actions, exact callback count | `TablePagination` module is absent |
| P0 | Static/type | Exact production manifest and absence of TanStack, route/API/query/router/storage/domain/client-data ownership | owned subtree is absent |
| P1 | Component/type | Numeric unit/precision/alignment, sort direction, selection scope, row action labels, disabled and expanded metadata are explicit | contract types/modules are absent |
| P1 | Component | Selected-count presentation distinguishes current page from all filtered results and owns no selection state | selection summary module is absent |
| P1 | Static/type | Virtualization contract preserves caller semantics/row height/viewport/overscan/identity without importing or wrapping `react-window` | virtualization contract is absent |
| P1 | Accessibility | Component axe scans, semantic region/table naming, non-color state meaning, keyboard actions | owned modules are absent |
| P2 | Browser | 320/390/768/1024/1280/1440+, long Russian content, 200% zoom, light/dark, keyboard overflow/pagination/action evidence | deferred until GREEN harness exists |
| P2 | Regression | Existing primitive, table, pagination, sort, and OrderPicker suites remain green and byte-for-byte production consumers remain unchanged | runs after Story-owned RED/GREEN |

### Red-phase rules

- Tests are colocated under `src/components/product/tables/__tests__/**`, within the Story-owned surface.
- Tests assert expected production behavior and type contracts; no placeholder assertion is permitted.
- Tests run unskipped in the isolated Story branch so genuine module/manifest failures are captured.
- Production source must remain absent when the first Story-owned test command runs.
- Browser E2E files are not generated because Story 166.6 owns no route. Responsive browser evidence will use a temporary harness after GREEN and remove it before staging.
- API tests and fixtures are not generated because the Story owns no endpoint, request, query, or mutation contract.
- No hard waits, route sleeps, arbitrary selectors, external data, or new dependencies are permitted.

## Generated RED Test Manifest

- `src/components/product/tables/__tests__/ResponsiveTable.test.tsx`
- `src/components/product/tables/__tests__/TableState.test.tsx`
- `src/components/product/tables/__tests__/TablePagination.test.tsx`
- `src/components/product/tables/__tests__/VirtualizedTableFrame.test.tsx`
- `src/components/product/tables/__tests__/table-composition-source-contracts.test.ts`

API and route E2E outputs are intentionally N/A: the acceptance criteria define no endpoint, request, mutation, route, or navigation contract. The adaptive worker lanes were mapped to component/type/source acceptance tests instead, preserving the workflow's RED purpose without inventing external integration coverage. Tests remain unskipped in the isolated Story implementation lane.

## TDD Red Phase — Complete

Command:

```bash
npm exec vitest -- run \
  src/components/product/tables/__tests__/ResponsiveTable.test.tsx \
  src/components/product/tables/__tests__/TableState.test.tsx \
  src/components/product/tables/__tests__/TablePagination.test.tsx \
  src/components/product/tables/__tests__/VirtualizedTableFrame.test.tsx \
  src/components/product/tables/__tests__/table-composition-source-contracts.test.ts
```

Result: exit `1`, 5/5 files failed as expected.

- `ResponsiveTable.test.tsx`: unresolved `../ResponsiveTable`.
- `TableState.test.tsx`: unresolved `../TableState`.
- `TablePagination.test.tsx`: unresolved `../TablePagination`.
- `VirtualizedTableFrame.test.tsx`: unresolved `../VirtualizedTableFrame`.
- Source contract: exact six-file production manifest absent.
- Production subtree contained only `__tests__/**` when the command ran.
- Package/lock, primitives, product barrel, routes, custom tables, hooks, APIs, query state, calculations, and formatters had zero diff.

This is genuine RED caused by the absent Story implementation, not by a test syntax, environment, selector, fixture, or network failure.

## Validation and Completion Review

- Prerequisites: pass.
- Story-owned test files: created within allowed scope.
- Acceptance-criteria mapping: complete for semantic/state/pagination/selection metadata/virtualization/dependency boundaries.
- Tests designed and proven to fail before implementation: pass.
- Browser sessions: N/A; none opened during RED.
- Temporary artifacts: none outside the canonical Story/ATDD artifacts and Story-owned tests.
- Final exact production manifest: `ResponsiveTable.tsx`, `ResponsiveTableHeader.tsx`, `TablePagination.tsx`, `TableState.tsx`, `VirtualizedTableFrame.tsx`, `contracts.ts`, and `index.ts`.
- Final exact direct test manifest: `ResponsiveTable.test.tsx`, `ResponsiveTableHeader.test.tsx`, `TableContracts.test.ts`, `TablePagination.test.tsx`, `TableState.test.tsx`, `VirtualizedTableFrame.test.tsx`, and `table-composition-source-contracts.test.ts`.
- Final Story GREEN: 7/7 files and 66/66 tests passed.
- Story plus read-only consumer regression: 16/16 files and 479/479 tests passed.
- Full regression outside the managed port sandbox: 1117/1117 files and 18,262/18,262 tests passed.
- Production build: passed; 70/70 static pages generated.
- Static gates: type-check, zero-warning lint, format, max-lines, YAML parse, diff check, privacy, markers, Next async params, locale-percent baseline, Anti-Pattern #8 baseline, E2E assertion/wait/skip checks, lessons, and accepted 18-entry documentation baseline passed.
- `check:eslint-rules` has a pre-existing checkout-location defect: from a `/private/tmp` worktree its `SCRIPT_DIR/../..` root is `/private/tmp`, so it cannot load the repository dependency registry. Full lint and direct `eslint --print-config` succeeded; the shared script and package surfaces remained read-only.

## Final Browser and Accessibility Evidence

- Temporary route harness was used only after GREEN and removed with its directory before staging; the dev server and all browser sessions were closed.
- Widths verified: 320, 390, 768, 1024, 1280, 1440, and 1600 px.
- Document-level horizontal overflow was 0 at every width.
- The deliberate horizontal strategy remained one named focusable local region (`tabIndex=0`), with local overflow at narrow widths and no document overflow.
- The non-scroll priority strategy showed only the caller-owned narrow projection at 320/390 and only the semantic wide table at 768+; its primitive wrapper computed `overflow-x: visible` with zero scroll delta.
- Long Russian entity identity, a large negative RUB value, status meaning, and entity-named critical actions remained visible/reachable.
- At 390px with 200% CSS zoom, document overflow remained 0 and the narrow projection/action remained visible.
- Light theme measured `rgb(255, 255, 255)` / `rgb(33, 33, 33)`; dark theme measured `rgb(10, 10, 10)` / `rgb(250, 250, 250)`.
- Keyboard traversal reached the named horizontal region, the entity-named table action, and the entity-named narrow action. Reduced-motion emulation matched `true`.
- Final browser console contained 0 errors and 0 warnings. Early harness 500/HMR attempts were repaired and excluded from final evidence.
- Final browser axe WCAG scan: 0 violations, 22 passes, 0 incomplete. A prior manual-review item for `aria-label` on a generic element was repaired by giving the labeled narrow projection `role="group"` and rerun to clean.

## Review Evidence

- Pass 1: REQUEST CHANGES (1 High, 7 Medium, 1 Low); all accepted findings repaired and affected gates rerun.
- Pass 2: REQUEST CHANGES (1 High, 4 Medium); responsive breakpoint behavior, public runtime export, terminal virtualized feedback, and evidence drift were repaired.
- Pass 2 confirmation: APPROVE, 0 Critical, 0 High, 0 Medium, 0 Low; Story-owned and consumer tests, type-check, lint, format, max-lines, exact manifest, scope, and security/ownership scans confirmed.

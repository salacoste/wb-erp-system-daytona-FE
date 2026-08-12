---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: 2026-08-12
storyId: "166.5"
detectedStack: frontend
primaryLevel: component
generationMode: AI
executionMode: sequential
inputDocuments:
  - _bmad-output/implementation-artifacts/166-5-fe-standardize-filters-and-period-controls.md
  - _bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/shadcn-route-ledger.md
  - .omx/plans/166.5-standardize-filters-and-period-controls.md
  - playwright.config.ts
  - package.json
  - _bmad/tea/agents/bmad-tea/resources/knowledge/data-factories.md
  - _bmad/tea/agents/bmad-tea/resources/knowledge/component-tdd.md
  - _bmad/tea/agents/bmad-tea/resources/knowledge/test-quality.md
  - _bmad/tea/agents/bmad-tea/resources/knowledge/test-healing-patterns.md
  - _bmad/tea/agents/bmad-tea/resources/knowledge/selector-resilience.md
  - _bmad/tea/agents/bmad-tea/resources/knowledge/timing-debugging.md
  - _bmad/tea/agents/bmad-tea/resources/knowledge/playwright-cli.md
---

# ATDD Checklist — Story 166.5: Standardize Filters and Period Controls

## Story Summary

Story 166.5 introduces a route-free `FilterToolbar` product composition and repairs only presentation defects in explicitly inventoried multi-route date/week/period/comparison selectors. URL/search parameters, debounce, persistence, query keys, fetching, calculations, stores/contexts, and route behavior remain caller/domain-owned.

## Preflight and Context

- Story artifact exists with seven testable acceptance criteria and exact Allowed/Forbidden surfaces.
- Frontend stack detected from Next/React/Vitest/Playwright configuration.
- `playwright.config.ts`, test setup, colocated Vitest patterns, and worktree-local dependencies are present.
- Pinned toolchain verified: Node `v24.18.0`, npm `11.11.0`.
- `node_modules` is local to the Story worktree and is not a symlink.
- No API/contract tests are appropriate: the Story forbids API/query/backend ownership.
- No permanent route E2E file is created during RED: Story 166.5 owns no route. Browser evidence will use a temporary route-free harness removed before staging.
- AI generation/sequential mode is selected because acceptance criteria are explicit and a component-level RED cleanly isolates the absent product composition. Independent implementation/review agents remain available later.

## Existing Baseline

The clean base was verified before new production source existed:

```text
Command: npm test -- --run <11 inventoried selector test files>
Result: 11/11 files passed; 263/263 tests passed.
```

This baseline locks current quick-select, date/range, comparison, week/month, refresh, loading/error, formatting, disabled, and callback behavior. Existing route/domain consumers remain read-only.

## Acceptance Criteria to Test Strategy

| Priority | Acceptance scope | Primary proof | RED intent |
|---|---|---|---|
| P0 | Exact route-free product ownership | source-contract component test | missing `FilterToolbar.tsx`, `filters/index.ts`, and product export fail |
| P0 | Visible current/applied scope, result count, updating/dependency/invalid/empty/disabled states | React Testing Library component tests | missing composition import fails |
| P0 | Explicit reset scope, one callback, deterministic caller-designated focus | user-event component tests | missing composition import fails |
| P1 | Progressive secondary controls without applying/resetting caller state | controlled/uncontrolled component tests | missing composition import fails |
| P1 | Narrow, long Russian, block-safe caller slots and reachable reset | component assertions plus later browser evidence | missing composition import fails |
| P1 | Selector callback/value preservation | existing 263-test baseline plus targeted strengthened tests | new presentation assertions will fail only on demonstrated defects |
| P1 | Keyboard/popover/calendar/focus/viewport behavior | targeted selector tests plus temporary browser matrix | tests precede each production repair |
| P2 | Themes, 200% reflow, reduced motion, axe | temporary browser harness | harness is evidence-only and removed before staging |

No duplicate API or route-level behavior tests are generated. The component boundary is the narrowest level that can prove Story-owned semantics; existing consumer suites cover established data behavior.

## Failing Tests Created

### `src/components/product/filters/__tests__/FilterToolbar.test.tsx`

Behavior scenarios:

- visible text and machine-identifiable state for default/applied/dependency-loading/updating/invalid/empty/disabled;
- current/applied scope, explicit zero result count, reset scope, and reset action shown together;
- uncontrolled progressive disclosure without reset/application callbacks;
- controlled disclosure reports intent without owning caller state;
- reset callback fires exactly once and focus moves to a caller ref;
- updating/dependency states retain trustworthy current scope/results;
- arbitrary block nodes and long Russian content remain valid/reachable;
- fallback reset scope is always visible when reset exists.

### `src/components/product/filters/__tests__/filter-toolbar-source-contracts.test.ts`

Static scenarios:

- exact recursive three-file production manifest (`FilterToolbar.tsx`, `FilterToolbar.types.ts`, `index.ts`);
- presentation-safe import allowlist only;
- no raw palette, route/persistence/query/calculation ownership, or CSS/DOM reordering;
- intentional additive product barrel export.

## Genuine RED Evidence

Production source was still untouched when RED ran.

```text
Command:
npm test -- --run src/components/product/filters/__tests__

Exit: 1
Test files: 2 failed
Executed source-contract cases: 4 failed
Behavior suite: failed to import absent ../FilterToolbar before collection

Expected failures:
- FilterToolbar.tsx absent;
- filters/index.ts absent;
- production manifest empty;
- product barrel does not export ./filters.
```

The failures are caused exclusively by the missing Story-owned implementation. They are not test bugs and do not depend on route data, network timing, CSS selectors, or shared mutable state.

## Data, Fixtures, Mocks, and Selectors

- New factories: none. Story-owned component inputs are explicit immutable React props; randomized domain fixtures would reduce clarity and incorrectly introduce a missing `faker` dependency.
- New persistent fixtures: none. No API/database state exists in the product composition.
- Mocks: callbacks only (`vi.fn()`); no network/backend mocks.
- Stable selectors: accessible roles/names and Story-owned `data-state`/`data-slot` semantics. No CSS selector is used for user behavior.
- Browser harness requirements: realistic long Russian labels, current/applied scope, result counts including zero/large values, every Story state, reset destination, secondary disclosure, shared selectors, and light/dark/reduced-motion modes.

## Implementation Checklist

- [x] Add `src/components/product/filters/FilterToolbar.tsx` and `FilterToolbar.types.ts` with a presentation-only discriminated API.
- [x] Add `src/components/product/filters/index.ts` and the minimal `src/components/product/index.ts` export.
- [x] Render visible toolbar label, primary controls, applied summary, result count, state, reset scope/action, and optional actions.
- [x] Add controlled/uncontrolled secondary disclosure that owns only visual expanded state.
- [x] Invoke caller reset exactly once and focus a connected caller target or the stable toolbar entry after the callback.
- [x] Preserve block-safe `ReactNode` slots, semantic order, 44px actions, long-content wrapping, and semantic tokens.
- [x] Run the two-file focused suite to GREEN: 21/21 tests.
- [x] Add selector-specific RED tests before each accepted presentation repair; do not edit behavior hooks/helpers/routes.
- [x] Rerun the complete focused product/selector suite after shared-selector changes and review repairs: 14/14 files, 317/317 tests including state-scope, callback, dialog-name/axe, unique-ID, touch-target, and final Comparison disclosure assertions.
- [x] Run browser responsive/theme/keyboard/focus/reduced-motion/axe evidence and remove its temporary harness.
- [x] Run full local gates and exact scope audit, and reconcile Story evidence.
- [x] Complete two independent adversarial review passes and a complete-snapshot confirmation review; all accepted High/Medium findings are repaired and the final 21-file snapshot is review-clean.
- [ ] Complete exact staging/integration and cleanup.

## Red–Green–Refactor Workflow

### RED — complete

- Existing selector baseline: GREEN 263/263.
- New product behavior/source tests: genuine RED on absent implementation.

### GREEN — complete

The Story-owned product suite reached GREEN after implementing one failing behavior group at a time:

```bash
npm test -- --run src/components/product/filters/__tests__
```

No route consumer or forbidden dependency was edited to make the suite pass. MultiWeek RED then exposed the visible-label and duplicate-checkbox-callback defects; DateRangeExtended RED exposed the nested interactive clear and fixed-width popover defects. Their direct suites passed after the presentation-only repairs. Comparison disclosure/label semantics now have direct pointer and Enter regression locks.

### REFACTOR — after GREEN

- remove duplication while preserving the public API and exact manifest;
- rerun focused product and selector suites after each refactor;
- keep all source files below repository max-line thresholds;
- validate server/presentation ownership and semantic token use before browser evidence.

## Execution Commands

```bash
# Story-owned product RED/GREEN
npm test -- --run src/components/product/filters/__tests__

# Existing selector behavior lock
npm test -- --run \
  src/components/custom/__tests__/DateRangePicker.test.tsx \
  src/components/custom/__tests__/DateRangePickerExtended.test.tsx \
  src/components/custom/date-range-picker/__tests__ \
  src/components/custom/__tests__/ComparisonPeriodSelector.test.tsx \
  src/components/custom/comparison-period/__tests__ \
  src/components/custom/__tests__/DashboardPeriodSelector.test.tsx \
  src/components/custom/__tests__/PeriodContextLabel.test.tsx \
  src/components/custom/period-selector/__tests__ \
  src/components/custom/WeekSelector.test.tsx

# Universal local gates after GREEN/review fixes
npm run format:check
npm run lint
npm run type-check
npm run check:max-lines
npm run build
npm test -- --run
git diff --check
```

## Knowledge References Applied

- `component-tdd.md`: component-first RED at the public prop/behavior boundary.
- `test-quality.md`: deterministic isolated behavior, clear failure reasons, no hard waits.
- `selector-resilience.md`: accessible role/name queries before implementation details.
- `timing-debugging.md`: no network or arbitrary sleep; focus/reset is synchronous user intent.
- `test-healing-patterns.md`: source contract protects intended ownership rather than patching symptoms.
- `data-factories.md`: assessed but no factory is justified for pure presentation props.
- Playwright utility/CLI fragments: reserved for temporary browser evidence; no permanent route test in RED.

## Browser Evidence

- Chromium covered `320`, `390`, `768`, intermediate `900`, `1024`, `1280`, and `1440` CSS pixels with `scrollWidth == clientWidth`, plus 200% reflow, light/dark, reduced motion, Enter/Space disclosure/reset, exactly-once reset, caller focus restoration, and zero scoped axe WCAG 2.2 AA violations.
- Firefox covered the required width loop and final expanded/reset/focus/no-overflow state with zero axe violations; the combined multi-width CLI returned no printed aggregate, so strict per-width captured output remains an honest evidence limitation.
- WebKit covered 320px no-overflow, keyboard disclosure/reset, caller focus return, and zero axe violations.
- Primary disclosure/reset and repaired selector actions measure at least 44 CSS pixels at narrow evidence widths. Normal text targets `4.5:1`; applicable large/non-text UI targets `3:1`.
- Final post-review Chromium recheck at 320/390px proved DateRange dialog/calendar containment, 44px DateRange actions, a 44×44 comparison switch named by its visible label, and viewport-contained 44px MultiWeek controls/labels. The named open DateRange dialog passed a fresh component-level axe scan. The earlier Firefox/WebKit matrix predates the final label/state repairs and is retained as supplementary evidence rather than misreported as a fresh final matrix.
- Initial state/count live regions render with `aria-live="off"`; later meaningful changes enable polite announcements. Visible scope/state remains persistent. Real Safari/VoiceOver, Edge/NVDA, and manual screen-reader timing were unavailable and are not reported as passes.
- Temporary `src/app/story-166-5-browser-harness/page.tsx`, its empty directories, local server, and all three browser sessions were removed before staging.

## Validation Summary

- Prerequisites: pass.
- Story/AC extraction: pass.
- Appropriate test level: component/static, pass.
- Genuine RED: pass.
- Network/API/factory/fixture requirements: not applicable with rationale.
- Implementation checklist and commands: complete.
- Product/selector GREEN, presentation RED/GREEN, browser matrix, and harness cleanup: complete.
- Applicable read-only consumer smoke: 22/22 files and 273/273 tests passed; all 25 production consumers/importers have exact zero base-relative diff. Existing route suites do not universally observe selector callback timing, so that limitation is explicit rather than promoted to a false pass.
- Universal gates and exact scope audit before review: complete (build 70/70; full Vitest 1110/1110 files and 18173/18173 tests; format/lint/type/max-lines/static/YAML/dependency/diff checks passed).
- Fresh post-review gate: focused 317/317; consumer smoke 273/273; production build 70/70; full Vitest 1110/1110 files and 18196/18196 tests; format, zero-warning lint, type-check, max-lines, YAML, diff, package/lock, forbidden-surface, dependency-location, and harness-cleanup checks passed. The sandbox-only `listen EPERM` was proven environmental by an 11/11 targeted rerun and the complete green suite outside the sandbox.
- Review evidence: Pass A findings repaired; Pass B's incomplete-snapshot defect identified and its genuine findings repaired; complete temporary-index snapshot SHA-256 `6590cc0269a959decfdd113b11ef4b9f9a0becfec54ec31016e83ed081ccbd1f`; independent confirmation review 0 Critical/High/Medium/Low.
- Remaining work: exact staging/integration and cleanup.

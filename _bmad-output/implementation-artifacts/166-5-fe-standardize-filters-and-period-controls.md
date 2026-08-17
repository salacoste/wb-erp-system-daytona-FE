# Story 166.5: Standardize Filters and Period Controls

Status: done

## Story

As a user filtering data,
I want visible scope and predictable reset behavior,
so that context never changes silently.

## Outcome

Deliver a route-free `FilterToolbar` product composition and standardize the presentation of the existing multi-route date-range, comparison, week, and dashboard-period selectors. Current values, applied scope, update state, result count, dependency state, and reset scope remain explicit while every route/domain owner retains its existing URL, search-param, debounce, persistence, query-key, fetching, calculation, and navigation behavior.

## Acceptance Criteria

1. **The Story-owned product boundary is explicit and route-free**
   - **Given** Stories 166.1–166.4 are merged and `src/components/product/**` is the canonical cross-domain composition path,
   - **When** Story 166.5 is implemented,
   - **Then** `FilterToolbar` lives only under `src/components/product/filters/**`,
   - **And** `src/components/product/index.ts` receives only the minimal additive public export,
   - **And** a Story-owned source contract proves the exact production manifest and forbids route, API, hook, store, query, navigation, calculation, raw-palette, and client-data ownership in the new product subtree,
   - **And** no existing Story 166.3 or 166.4 source-contract manifest is expanded, bypassed, or edited.

2. **Filter scope and result meaning remain visible**
   - **Given** default, expanded, applied, dependency-loading, updating, invalid, empty-result, disabled, and narrow states,
   - **When** `FilterToolbar` renders caller-owned controls,
   - **Then** its visible title/label, primary controls, progressive secondary controls, applied summary or chips, result count, update/dependency/validation/result state, and reset action remain understandable where applicable,
   - **And** an empty filtered result is distinguishable from globally absent data,
   - **And** disabled or loading controls preserve readable current/applied scope rather than replacing it with an unexplained skeleton,
   - **And** long Russian labels and applied values wrap without clipping, semantic reordering, or page-level overflow.

3. **Reset is explicit, caller-owned, and focus-deterministic**
   - **Given** active filters and a caller-supplied reset action,
   - **When** the user invokes reset by pointer or keyboard,
   - **Then** the caller callback fires exactly once,
   - **And** the composition does not invent, clear, persist, or navigate any route/domain state,
   - **And** reset scope is visible before activation,
   - **And** focus moves to the caller-designated reset destination or a stable Story-owned toolbar entry point after the synchronous reset callback,
   - **And** reset remains available in the narrow applied presentation.

4. **Existing selectors preserve their public and behavioral contracts**
   - **Given** the inventoried shared `DateRangePicker*`, comparison, week, multi-week, and dashboard-period controls,
   - **When** their presentation is standardized,
   - **Then** exported props/types, callback values, callback counts, quick-select logic, auto-swap rules, preset/range calculations, maximum-selection behavior, week/month selection, refresh behavior, current labels, and Russian date/week formatting remain unchanged,
   - **And** valid zero/empty selection, unavailable dependencies, invalid ranges, disabled state, and current/applied values remain distinct,
   - **And** calculation helpers, data hooks, stores/contexts, query keys, APIs, and route consumers remain byte-for-byte unchanged.

5. **Selector accessibility and responsive disclosure are complete**
   - **Given** keyboard-only, touch, 200% reflow, light/dark theme, and reduced-motion use,
   - **When** a select, popover, calendar, disclosure, clear, apply, or refresh action is used,
   - **Then** every control has a visible label and matching accessible name,
   - **And** open/close, Escape, focus containment/return, selection, and disabled behavior follow the existing hardened shadcn/Radix primitive contracts,
   - **And** icon-only actions name their purpose,
   - **And** no essential current value, validation, result, dependency, or reset information is hover-only or color-only,
   - **And** popovers fit the available viewport instead of imposing an inaccessible fixed desktop width.

6. **The visual migration does not change route/domain behavior**
   - **Given** existing route consumers of the shared selectors,
   - **When** Story 166.5 is complete,
   - **Then** all `src/app/**` consumers and their URL/search-param, debounce, persistence, query, pagination, selection, export, and navigation semantics have zero diff,
   - **And** consumer behavior-lock tests prove the same callback identity, order, arguments, and update timing where the shared selector boundary can observe them,
   - **And** package/lock, tokens, primitives, AppShell, APIs, hooks, stores, contexts, formatters, calculations, and unrelated custom controls have zero base-relative diff.

7. **Delivery evidence is complete**
   - **Given** the Story-specific and Universal Story Delivery Contracts,
   - **When** the Story is proposed for integration,
   - **Then** genuine RED precedes production edits, targeted selector/component tests and all applicable universal local gates pass with Node `24.18.0` and npm `11.11.0`,
   - **And** responsive/theme/keyboard/focus/reduced-motion/axe evidence is recorded with environment gaps named honestly,
   - **And** two fresh adversarial review passes have no unresolved accepted High or Medium findings,
   - **And** the detailed commit, ready PR, merge SHA, branch deletion, exact worktree removal, prune, and clean-main evidence are recorded before the next prerequisite Story starts.

## Tasks / Subtasks

- [x] Task 1: Establish the isolated Story contract and exact ownership manifest (AC: 1, 6, 7)
  - [x] Verify `main`, `origin/main`, prerequisites 166.1–166.4, base SHA, exact branch, and exact worktree.
  - [x] Prove no route is owned by Story 166.5 and inventory every proposed shared selector consumer.
  - [x] Classify production/test files as Story-owned, read-only consumer lock, or forbidden dependency.
  - [x] Preserve zero diff for package/lock, tokens, primitives, existing product source contracts, routes, hooks, APIs, stores, contexts, calculations, formatters, and unrelated consumers.

- [x] Task 2: Lock behavior with genuine ATDD RED (AC: 1–6)
  - [x] Run the existing focused shared-selector suite on the clean base and record the baseline.
  - [x] Add Story-owned tests for `FilterToolbar` states, scope/result/update semantics, reset focus/callback behavior, narrow layout, and source ownership.
  - [x] Strengthen selector regressions only where current tests cannot prove visible labels, keyboard disclosure, viewport-safe popovers, disabled/loading/current-value behavior, or callback preservation.
  - [x] Run the test-only lane before production edits and record failures caused by the absent/non-compliant Story-owned implementation rather than test bugs.

- [x] Task 3: Implement `FilterToolbar` without route/domain ownership (AC: 1–3, 5–6)
  - [x] Add an intentional route-free client composition used only for local disclosure, reset, focus, and announcements; it owns no route/data/query/persistence state and remains safely composable beneath Server Components.
  - [x] Keep default/applied scope and result count visible; disclose secondary controls progressively without DOM-order inversion.
  - [x] Implement caller-visible reset scope and deterministic focus without changing route state internally.
  - [x] Export only the intentional public API and add an exact Story-owned source contract.

- [x] Task 4: Standardize only inventoried shared selector presentation (AC: 4–6)
  - [x] Replace raw palette/light-only styling with merged semantic tokens in the approved selector presentation files.
  - [x] Repair visible-label/accessibility and fixed-width/narrow-overflow defects without changing public values or callback semantics.
  - [x] Preserve all read-only hooks, contexts, calculations, formatters, types, utilities, and route consumers.
  - [x] Keep specialized/domain-local selectors out of this Story.

- [x] Task 5: Complete GREEN/REFACTOR and browser evidence (AC: 2–7)
  - [x] Run focused tests after each behavior slice and refactor only after GREEN.
  - [x] Verify widths `320`, `390`, `768`, `1024`, `1280`, and `1440+`, plus representative 200% reflow.
  - [x] Verify light/dark, keyboard, focus, Escape, visible labels, long Russian content, reduced motion, and automated axe scans in available engines.
  - [x] Remove every temporary route/harness/session before staging and record unavailable real-browser/assistive-technology gaps.

- [x] Task 6: Run universal local validation and exact-scope audit (AC: 6–7)
  - [x] Run format, zero-warning lint, type-check, max-lines, build, complete Vitest, `git diff --check`, YAML parse, and repository-specific static gates.
  - [x] Prove the exact changed-file manifest is within the Allowed Change Surface and all Forbidden Shared Files have zero diff.
  - [x] Reconcile Story/ATDD evidence, lifecycle status, completion notes, and File List with actual results only.

- [x] Task 7: Complete two fresh adversarial reviews (AC: 1–7)
  - [x] Review pass 1 used a context that did not author the implementation; every finding was dispositioned and affected checks were rerun.
  - [x] Review pass 2 and the post-fix confirmation review independently rechecked behavior preservation, ownership, accessibility, responsive states, package/lock zero-diff, and exact evidence.
  - [x] All accepted High and Medium findings were resolved; the complete post-fix snapshot received zero Critical/High/Medium/Low findings.

- [ ] Task 8: Integrate and clean the exact Story lane (AC: 7)
  - [ ] Force-stage the ignored Story and ATDD artifacts and stage only the approved explicit manifest.
  - [ ] Create the detailed conventional commit, push only the feature branch, open a ready PR targeting `main`, verify base/head/manifest, and merge through GitHub.
  - [ ] Update primary `main` with `pull --ff-only`; prove the merge SHA and Story artifacts are present.
  - [ ] Delete the remote/local branch, remove the exact temporary worktree without force, prune worktrees/remotes, and prove clean `main == origin/main` before Story 166.6.

## Dev Notes

### Exact Git Lane and Prerequisites

- Primary checkout: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend`.
- Branch: `cdx/epic-166-story-5-filters-periods`.
- Worktree: `/private/tmp/wb-fe-166-5-standardize-filters-and-period-controls`.
- Base: `071dc08a5eff6f0d8289ca5e5f3b3a97ff13e90f` (Story 166.4 merge commit).
- Required ancestors already verified: 166.1 `5425914b79faf05e5f567cffe9cc2a8437b49f7b`; 166.2 `0d3e0879964f2d4792c5a03a0928f1f57d68eff1`; 166.3 `c73b6002ae32a3b458c114d9ec14c7d6ee72fc1d`; 166.4 implementation `73a6429e6e2d199ad8f44472eccf08ec7c7d4af1`; 166.4 merge/base `071dc08a5eff6f0d8289ca5e5f3b3a97ff13e90f`.
- Pinned PATH: `/private/tmp/wb-fe-166-4-toolchain/npm-11.11.0/bin:/private/tmp/wb-fe-166-4-toolchain/node-v24.18.0-darwin-arm64/bin:$PATH`.
- Use worktree-local `node_modules`; never create an external dependency symlink.

### Delivery Record

- **Requirements:** FR17, FR24, FR28, FR33.
- **Route/User Value:** consistent, visible search/filter/date/week/comparison scope and predictable reset behavior across later route migrations; Story 166.5 owns no route.
- **Owned Surface:** `FilterToolbar` and its exact product-filter subtree; evidence-driven presentation repairs to the explicitly approved multi-route date-range, comparison, dashboard-period, and multi-week selectors; direct tests and Story evidence.
- **Shared Dependencies:** merged Stories 166.1–166.4, existing hardened primitives, read-only selector behavior hooks/helpers, and read-only route consumers.
- **Allowed Change Surface:** `src/components/product/filters/**`; the minimal additive product barrel export; explicitly listed shared-selector presentation files and their direct regression tests; this Story/ATDD artifact; only the Story 166.5 sprint-status row.
- **Forbidden Shared Files:** `src/app/**`; route/domain filters; URLs/search/debounce/persistence/query/pagination/export/navigation behavior; hooks, APIs, stores, contexts, calculations and formatters; tokens, primitives, Story 166.3/166.4 source contracts; package/lock and deployment/production surfaces.
- **State Coverage:** default, expanded, applied, dependency-loading, updating, invalid, filtered-empty, disabled, and narrow, with current/applied scope retained where meaningful.
- **Responsive/Table/Chart Contract:** applied scope, count, state, reset scope/action, and primary controls stay visible/reachable without page overflow; no table/chart or route data behavior is owned here.
- **Accessibility Contract:** visible/matching labels, semantic disclosure, keyboard-complete hardened overlays, deterministic reset focus, non-color state meaning, restrained announcements, `4.5:1` normal-text and applicable `3:1` large/non-text contrast, and `44×44` primary mobile targets.
- **Test and Visual Evidence:** genuine absent-composition RED; direct toolbar state/type/source tests; direct MultiWeek, DateRangeExtended, and ComparisonPeriod behavior locks; focused selector regression; Chromium/Firefox/WebKit responsive/theme/keyboard/focus/reduced-motion/axe evidence; explicit unavailable real-AT gaps.
- **Local Validation:** targeted product/selector and applicable consumer tests followed by format, zero-warning lint, type-check, max-lines, build, complete Vitest, repository static checks, YAML parse, package/lock zero-diff, exact manifest, forbidden-surface, and diff audits with pinned Node/npm.
- **Branch/Worktree Lifecycle:** `cdx/epic-166-story-5-filters-periods` in `/private/tmp/wb-fe-166-5-standardize-filters-and-period-controls`, based exactly on `071dc08a5eff6f0d8289ca5e5f3b3a97ff13e90f`; it is the exclusive shared-selector writer.
- **Cleanup Evidence:** ready PR merge SHA on updated `main`; Story/ATDD artifacts present; remote/local branch and exact worktree absent; worktree/fetch prune complete; clean `main == origin/main`; Story 166.6 not started before that proof.

Tracking note: the historical Story 166.4 artifact/sprint row still says `review` even though PR #148 is merged and its branch/worktree were removed. Story 166.5 recovered the prerequisite from Git ancestry and clean-lane evidence; it does not mutate the prior Story's artifact outside this lane's ownership.

### Approved Production Manifest

New product composition files:

- `src/components/product/filters/FilterToolbar.tsx`
- `src/components/product/filters/FilterToolbar.types.ts`
- `src/components/product/filters/index.ts`
- `src/components/product/index.ts` — additive filter export only

Existing multi-route selector presentation files eligible for evidence-driven edits:

- `src/components/custom/DateRangePicker.tsx`
- `src/components/custom/DateRangePickerExtended.tsx`
- `src/components/custom/DateRangePickerPopoverContent.tsx`
- `src/components/custom/date-range-picker/DateRangeSelectors.tsx`
- `src/components/custom/date-range-picker/DateRangeStates.tsx`
- `src/components/custom/ComparisonPeriodSelector.tsx`
- `src/components/custom/DashboardPeriodSelector.tsx`
- `src/components/custom/PeriodContextLabel.tsx`
- `src/components/custom/PeriodSelectorRefreshButton.tsx`
- `src/components/custom/period-selector/DashboardPeriodSelectorSkeleton.tsx`
- `src/components/custom/WeekSelector.tsx`
- `src/components/custom/MultiWeekSelector.tsx`
- `src/components/custom/MultiWeekSelectorContent.tsx`

Eligibility is not an instruction to edit every file. A file changes only to satisfy an explicit failing Story test or accepted review finding. Pure helpers and behavior owners remain read-only.

Final selector audit disposition before universal gates:

| Approved selector file | Disposition | Direct evidence or rationale |
|---|---|---|
| `DateRangePicker.tsx` | changed | semantic muted text; existing picker suite locks values, auto-swap, loading/error, quick selection, and callback contract. |
| `DateRangePickerExtended.tsx` | changed | real separate clear button and viewport-safe popover; strengthened direct tests lock one `onChange(undefined)` call and no trigger toggle. |
| `DateRangePickerPopoverContent.tsx` | changed | review-driven viewport containment and dialog presentation repair; the final 320/390px browser measurements prove no horizontal overflow. |
| `date-range-picker/DateRangeSelectors.tsx` | changed | visible `htmlFor`/`id` associations and semantic muted text; direct date-range suite locks selection behavior. |
| `date-range-picker/DateRangeStates.tsx` | changed | review-driven loading/error/empty state repair preserves the caller's current date scope; direct state tests lock the visible range and distinct dependency status. |
| `ComparisonPeriodSelector.tsx` | changed | explicit button disclosure, associated visible Select label, semantic tokens, responsive width; direct pointer/Enter tests prove no domain callback on disclosure. |
| `DashboardPeriodSelector.tsx` | changed | equivalent Tailwind scale width only; full direct context/callback/keyboard suite remains the behavior lock. |
| `PeriodContextLabel.tsx` | no change | direct suite passed and no Story-owned presentation defect was exposed. |
| `PeriodSelectorRefreshButton.tsx` | no change | direct dashboard selector suite already covers refresh/disabled behavior; no defect exposed. |
| `period-selector/DashboardPeriodSelectorSkeleton.tsx` | changed | equivalent responsive width classes aligned to the selector; no state ownership change. |
| `WeekSelector.tsx` | no change | direct week suite passed; no failing presentation evidence justified change. |
| `MultiWeekSelector.tsx` | changed | associated visible label, viewport-safe popover, semantic tokens; direct test locks label, presets, cap, clear/apply/close, tag removal, and keyboard behavior. |
| `MultiWeekSelectorContent.tsx` | changed | semantic tokens, 44px primary actions, non-bubbling checkbox activation, named tag removal; direct tests lock exactly-once callbacks and ordering. |

### Direct Test and Evidence Manifest

- New `src/components/product/filters/__tests__/FilterToolbar.test.tsx`.
- New `src/components/product/filters/__tests__/filter-toolbar-source-contracts.test.ts`.
- Existing direct selector tests under:
  - `src/components/custom/__tests__/DateRangePicker.test.tsx`
  - `src/components/custom/__tests__/DateRangePickerExtended.test.tsx`
  - `src/components/custom/date-range-picker/__tests__/DateRangeSelectors.test.tsx`
  - `src/components/custom/date-range-picker/__tests__/date-range-utils.test.ts`
  - `src/components/custom/__tests__/ComparisonPeriodSelector.test.tsx`
  - `src/components/custom/comparison-period/__tests__/comparison-period-utils.test.ts`
  - `src/components/custom/__tests__/DashboardPeriodSelector.test.tsx`
  - `src/components/custom/__tests__/PeriodContextLabel.test.tsx`
  - `src/components/custom/period-selector/__tests__/period-selector-utils.test.ts`
  - `src/components/custom/period-selector/__tests__/useGeneratedWeeks.test.ts`
  - `src/components/custom/WeekSelector.test.tsx`
- New or strengthened tests remain colocated with the owned presentation file. Route-owned tests are read-only regression evidence unless their owner explicitly requires a behavior-lock update that changes no route production source.

### Read-Only Consumer Inventory

The route ledger assigns all consumers to later route Stories. Story 166.5 must not edit them:

- `DateRangePicker`: analytics shared margin, analytics SKU, and export-dialog consumers.
- `DateRangePickerExtended`: acquiring, acquiring-period, buyout reconciliation, buyout, advertising-organic cross-reference, FBS enhanced/stock, funnel, orders, product analytics, returns, search, and orders-integrity consumers.
- `ComparisonPeriodSelector`: advertising, buyout, funnel, returns, search, and analytics-shared margin consumers.
- `DashboardPeriodSelector`: analytics dashboard and primary dashboard consumers.
- `PeriodContextLabel`: primary dashboard consumer.
- `WeekSelector` / `MultiWeekSelector`: route-local `AnalyticsWeekSelector` composition.

Representative future owners include 168.1/168.3/168.9, 169.1/169.2/169.4–169.8/169.11, 170.1/170.6/170.7, 172.1, and 172.16. Consumer tests may be executed for regression evidence; consumer production files remain unchanged.

The repository import inventory contains exactly these 25 production consumers/importers:

- `src/app/(dashboard)/analytics/acquiring/components/AcquiringPageContent.tsx`
- `src/app/(dashboard)/analytics/acquiring/period/components/AcquiringPeriodDetailPage.tsx`
- `src/app/(dashboard)/analytics/advertising/page.tsx`
- `src/app/(dashboard)/analytics/buyout-reconciliation/components/ReconciliationControls.tsx`
- `src/app/(dashboard)/analytics/buyout/components/BuyoutPageContent.tsx`
- `src/app/(dashboard)/analytics/components/AnalyticsWeekSelector.tsx`
- `src/app/(dashboard)/analytics/cross-reference/components/CrossReferencePageContent.tsx`
- `src/app/(dashboard)/analytics/dashboard/page.tsx`
- `src/app/(dashboard)/analytics/fbs-enhanced/components/FbsEnhancedPageContent.tsx`
- `src/app/(dashboard)/analytics/fbs-stock/components/FbsStockGroupsSection.tsx`
- `src/app/(dashboard)/analytics/fbs-stock/components/FbsStockSizesSection.tsx`
- `src/app/(dashboard)/analytics/funnel/components/FunnelPageContent.tsx`
- `src/app/(dashboard)/analytics/orders/page.tsx`
- `src/app/(dashboard)/analytics/product/[nmId]/components/ProductAnalyticsContent.tsx`
- `src/app/(dashboard)/analytics/returns/components/ReturnsPageContent.tsx`
- `src/app/(dashboard)/analytics/search/components/SearchPageContent.tsx`
- `src/app/(dashboard)/analytics/shared/MarginFilterSection.tsx`
- `src/app/(dashboard)/analytics/shared/MarginPageStates.tsx`
- `src/app/(dashboard)/analytics/shared/useMarginPageState.ts`
- `src/app/(dashboard)/analytics/sku/components/SkuFilterSection.tsx`
- `src/app/(dashboard)/analytics/sku/components/SkuPageAlerts.tsx`
- `src/app/(dashboard)/dashboard/components/DashboardContent.tsx`
- `src/app/(dashboard)/orders/integrity/components/ReconciliationSection.tsx`
- `src/components/custom/export-dialog/ExportConfigForm.tsx`
- `src/components/custom/export-dialog/ExportDialogForm.tsx`

For AC6, callback arguments/counts and disclosure non-effects are observable and locked at the unchanged shared-selector public boundaries; route suites often mock that boundary and therefore cannot honestly prove runtime order/timing for every consumer. Every importer and caller JSX/prop expression is byte-for-byte unchanged relative to base, which structurally preserves caller callback identity, while 22 applicable consumer-smoke files (273 tests) pass read-only and the direct 14-file selector/product suite passes 294 tests. Universal consumer-level runtime timing remains unobservable in the current suite and is not reported as a separate pass; the final full Vitest run covers every existing regression. This is the strongest exact evidence available without modifying later route-owner tests or weakening the canonical acceptance claim.

### Forbidden Files and Behaviors

- All `src/app/**` route production files, including `analytics/components/AnalyticsWeekSelector.tsx`.
- All `src/components/ui/**` primitives and Story 166.1 token/compiler files.
- `src/components/product/ContextBar.tsx`, PageHeader files, metrics files, and their Story-specific source contracts.
- Hooks and contexts: `src/hooks/useFinancialSummary.ts`, `src/hooks/financial/**`, `src/hooks/useDashboardPeriod.ts`, and `src/contexts/dashboard-period-types.ts`.
- Pure/domain behavior: `src/lib/date-range-utils.ts`, `src/lib/period-helpers.ts`, `src/types/date-range.ts`, `src/components/custom/date-range-picker/date-range-utils.ts`, `src/components/custom/comparison-period/**`, `src/components/custom/period-selector/useGeneratedWeeks.ts`, `src/components/custom/period-selector/period-selector-utils.ts`, and `src/components/custom/period-selector-week-helpers.ts`.
- Domain-local analytics comparison components/helpers and all route/domain filter components.
- Package/lock, backend/public contracts, APIs, stores, query keys, URL/search handling, debounce, persistence, calculations, auth/cabinet context, deployment, and production operations.

### Product Composition Contract

- `FilterToolbar` is an intentional route-free client composition used only for local disclosure, reset, focus, and restrained announcements. It owns no route/data/query/persistence state and remains safely composable beneath Server Components.
- `FilterToolbar` is presentation-only and accepts caller-rendered `ReactNode` slots. It does not fetch, calculate, parse URL/search params, persist state, own query keys, or import route/domain modules.
- The caller supplies current/applied summaries, result count, state, reset scope, reset callback, optional reset focus target, primary controls, secondary controls, and optional saved-view/actions.
- Progressive disclosure may own only local visual expanded/collapsed state; it never changes applied filter state. Primary controls and visible applied summary remain in DOM/task order.
- Result announcements use a restrained live region only when caller data changes; initial render must not produce disruptive noise. Updating and dependency loading retain trustworthy current scope.
- Initial count/state DOM uses `aria-live="off"`; after mount, later count changes and active busy-state changes use polite announcements. Visible state/scope text stays persistent, while manual screen-reader announcement timing remains an explicit unavailable-environment gap.
- Reset focus is implemented from the activation event/ref after the caller callback; ref access is outside render. React `useId` may associate labels/descriptions when caller IDs are absent.
- Native elements and the merged shadcn/Radix primitives are reused; no dependency is added.

### Selector Preservation Contract

- Preserve `DateRangePicker` start/end auto-swap, quick options, `maxWeeks`, available-week ordering, error/loading behavior, and one `onRangeChange` call per user selection.
- Preserve `DateRangePickerExtended` preset/calendar values, clear callback, max-day validation, aggregation suggestion, and controlled Popover state. Replace the nested clickable clear icon with valid button semantics only if direct tests prove the same one-call `onChange(undefined)` behavior and no trigger double-toggle.
- Preserve `ComparisonPeriodSelector` enable/preset/custom-range callbacks and current calculation helpers; only presentation/layout/accessibility may change.
- Preserve dashboard week/month values, `onPeriodChange`, refresh, relative-time behavior, and context ownership.
- Preserve week/multi-week selected values, maximum selection, quick actions, apply/clear semantics, and existing hook use. Presentation edits must not reorder or reinterpret weeks.

### State Matrix

| State | Required visible evidence | Forbidden inference |
|---|---|---|
| default | named toolbar and primary controls; optional default scope | no fabricated applied filter |
| expanded | secondary controls disclosed; trigger state exposed | no filter application on expand |
| applied | applied values/summary, result count, reset scope/action | no hidden reset or scope |
| dependency-loading | current scope retained plus readable dependency progress | no global empty inference |
| updating | typed/current input and prior trustworthy results/scope retained | no clearing caller data |
| invalid | readable validation tied to toolbar/control context | no callback or URL mutation |
| empty | filtered-empty wording, active scope, result count `0`, reset | no claim that all data is absent |
| disabled | readable current value/scope plus disabled semantics | no disappearing context |
| narrow | applied state/count/reset and primary action remain reachable | no CSS/DOM reordering or clipping |

### Browser and Accessibility Matrix

- Widths: `320`, `390`, `768`, `1024`, `1280`, `1440+`; no page-level overflow and no lost current/applied/reset meaning.
- Reflow: representative desktop at 200%; long Russian labels/chips, current period, result count, reset scope, and actions remain reachable.
- Themes: light/dark semantic tokens; zero new raw palette or hardcoded light-only surfaces in changed scope.
- Keyboard/focus: Tab/Shift+Tab, Enter/Space, Escape, select/popover/calendar operation, disclosure state, deterministic reset focus, and focus return.
- Screen reader semantics: visible labels match accessible names; current values, expanded state, result/update/validation state, and reset scope are textually available.
- Motion: reduced motion removes non-essential transitions/spinners without removing updating meaning.
- Engines: Chromium and Firefox required where available; WebKit is supplementary evidence. Real Safari/VoiceOver and Edge/NVDA are pass or explicit environment gaps, never inferred.
- Axe supplements manual reading-order, focus, keyboard, zoom, and data-meaning checks.
- WCAG AA targets are numeric: normal text at least `4.5:1`; applicable large text, non-text controls, focus indicators, and meaningful graphical objects at least `3:1` against adjacent colors. Primary mobile actions have at least a `44×44` CSS-pixel target; the Story-owned disclosure/reset and repaired selector primary actions meet this at the 320/390 evidence widths.
- Any temporary browser harness lives outside the final manifest or is deleted before staging; Story 166.5 owns no route and adds no permanent route for screenshots.

### Validation Contract

Use the pinned toolchain and run focused tests before universal gates:

```bash
PATH=/private/tmp/wb-fe-166-4-toolchain/npm-11.11.0/bin:/private/tmp/wb-fe-166-4-toolchain/node-v24.18.0-darwin-arm64/bin:$PATH
npm test -- --run \
  src/components/product/filters/__tests__ \
  src/components/custom/__tests__/DateRangePicker.test.tsx \
  src/components/custom/__tests__/DateRangePickerExtended.test.tsx \
  src/components/custom/date-range-picker/__tests__ \
  src/components/custom/__tests__/ComparisonPeriodSelector.test.tsx \
  src/components/custom/comparison-period/__tests__ \
  src/components/custom/__tests__/DashboardPeriodSelector.test.tsx \
  src/components/custom/__tests__/PeriodContextLabel.test.tsx \
  src/components/custom/period-selector/__tests__ \
  src/components/custom/WeekSelector.test.tsx
npm run format:check
npm run lint
npm run type-check
npm run check:max-lines
npm run build
npm test -- --run
git diff --check
```

Also record Node/npm versions, YAML parse, repository-specific static gates, exact changed/staged manifest, package/lock zero-diff, all forbidden-surface zero-diffs, browser harness cleanup, and ignored Story/ATDD artifact tracking.

### Exact Git Lifecycle and Cleanup

Before staging, compare the base-relative manifest with the approved surface. Force-stage both ignored evidence artifacts:

```bash
git add -f _bmad-output/implementation-artifacts/166-5-fe-standardize-filters-and-period-controls.md
git add -f _bmad-output/test-artifacts/atdd-checklist-166.5.md
git add -- _bmad-output/implementation-artifacts/sprint-status.yaml \
  src/components/product/index.ts src/components/product/filters \
  src/components/custom/DateRangePicker.tsx \
  src/components/custom/DateRangePickerExtended.tsx \
  src/components/custom/DateRangePickerPopoverContent.tsx \
  src/components/custom/date-range-picker/DateRangeSelectors.tsx \
  src/components/custom/date-range-picker/DateRangeStates.tsx \
  src/components/custom/ComparisonPeriodSelector.tsx \
  src/components/custom/DashboardPeriodSelector.tsx \
  src/components/custom/PeriodContextLabel.tsx \
  src/components/custom/PeriodSelectorRefreshButton.tsx \
  src/components/custom/period-selector/DashboardPeriodSelectorSkeleton.tsx \
  src/components/custom/WeekSelector.tsx \
  src/components/custom/MultiWeekSelector.tsx \
  src/components/custom/MultiWeekSelectorContent.tsx
git diff --cached --check
git diff --cached --name-status
git ls-files --error-unmatch _bmad-output/implementation-artifacts/166-5-fe-standardize-filters-and-period-controls.md
git ls-files --error-unmatch _bmad-output/test-artifacts/atdd-checklist-166.5.md
```

Only paths that actually changed are staged; any extra path is a blocker. Use the checkout-independent commit/push/ready-PR/merge sequence from the OMX Story plan. After merge, update primary `main`, prove ancestry and artifact presence, delete `origin/cdx/epic-166-story-5-filters-periods`, remove `/private/tmp/wb-fe-166-5-standardize-filters-and-period-controls` without force, delete the local branch, prune/fetch-prune, and prove the exact lane is absent before reading/starting Story 166.6.

### Previous Story Intelligence

- Story 166.1 provides semantic tokens; consume them without editing or duplicating palette roles.
- Story 166.2 provides hardened shadcn/Radix primitives; preserve their keyboard/focus compatibility and add no dependency.
- Story 166.3 established the canonical product boundary and a deliberately explicit Story-owned source manifest. Do not widen its source-contract test to future directories.
- Story 166.4 established route-free product composition patterns, exact production manifests, typed public APIs, semantic state text, block-safe arbitrary `ReactNode` slots, genuine absent-module RED, browser/axe matrices, two review passes, and force-staged Story/ATDD evidence.
- Story 166.4 also proved that fixed desktop widths, invalid HTML wrappers, missing state labels, and seemingly harmless inferred presentation semantics must be caught by direct and browser evidence.
- Worktree-local dependencies are mandatory because external `node_modules` symlinks violate Next/Turbopack root checks.

### Latest Technical Notes

- React 19 guidance supports `useId` for unique accessible associations and refs for imperative focus only in event handlers/effects, never during render. Reset focus therefore remains explicit and post-activation.
- Radix Popover supports controlled `open`/`onOpenChange`, Escape/dismissal, collision-aware placement, and explicit open/close autofocus hooks; reuse the hardened local primitives rather than recreating overlay behavior.
- Radix Select requires an explicit visible label associated through `htmlFor`/trigger `id` or equivalent accessible naming. Placeholder text is not a label.
- Dependency versions remain those pinned in `package.json`/lockfile; Story 166.5 performs no upgrade.

### Project Structure Notes

- Cross-domain product compositions belong under `src/components/product/<family>/**`; shared brownfield selectors remain at their stable import paths under `src/components/custom/**` to avoid consumer churn.
- Tests stay colocated with the owned component families. Story source-contract tests enumerate exact manifests and do not scan unrelated future product families.
- Source code and tests override stale architecture examples. The repository currently uses Next `16.2.12`, React `19`, Tailwind `4`, Vitest `4.1.10`, and the pinned Node/npm engines from `package.json`.
- No `project-context.md` exists; `AGENTS.md`, `docs/AGENTS/index.md`, the canonical migration artifacts, current source/tests, and `package.json` are the active contracts.

### References

- [Source: `.omx/plans/166.5-standardize-filters-and-period-controls.md`]
- [Source: `.omx/plans/shadcn-full-ui-migration-master.md`]
- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#Universal-Story-Delivery-Contract`]
- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#Story-1665-Standardize-Filters-and-Period-Controls`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#FilterToolbar`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Search-Filtering-Sorting-and-Pagination-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Responsive-Design--Accessibility`]
- [Source: `_bmad-output/planning-artifacts/shadcn-route-ledger.md`]
- [Source: `_bmad-output/implementation-artifacts/166-4-fe-standardize-metrics-financial-values-availability-and-status.md`]
- [Source: `docs/front-end-architecture.md`]
- [Source: `package.json`]

## Dev Agent Record

### Agent Model Used

GPT-5.6

### Implementation Plan

- Establish the exact route-free/shared-selector ownership contract and run existing focused baselines.
- Add failing component/source/consumer assertions before any production edit.
- Implement `FilterToolbar`, then repair only selector presentation defects exposed by the RED suite.
- Collect targeted/full local, browser/accessibility, exact-scope, two-pass review, Git, merge, and cleanup evidence.

### Debug Log References

- Story base: `071dc08a5eff6f0d8289ca5e5f3b3a97ff13e90f`.
- Branch: `cdx/epic-166-story-5-filters-periods`.
- Worktree: `/private/tmp/wb-fe-166-5-standardize-filters-and-period-controls`.
- Story 166.4 lane cleanup passed before this worktree was created.
- Story artifact created and lifecycle status transitioned to `ready-for-dev` on 2026-08-12.
- Story implementation started on 2026-08-12; lifecycle status transitioned to `in-progress` before the test-only RED lane.
- Existing selector baseline: 11/11 files and 263/263 tests passed on the clean base before production edits.
- Genuine FilterToolbar RED: the two-file Story-owned suite exited `1`; the behavior suite could not resolve the absent `FilterToolbar`, and all four source-contract cases failed on the absent exact manifest/barrel export. Production source remained untouched.
- MultiWeek RED first exposed an unassociated visible label and duplicate checkbox callback; after correcting one test API, both production defects were fixed. DateRangeExtended RED exposed a nested interactive clear control and fixed `min-w-[580px]` popover; both were repaired without route/domain changes.
- Final focused product/selector regression after review repairs: 14/14 files and 317/317 tests passed. Applicable read-only consumer smoke: 22/22 files and 273/273 tests passed; all 25 production consumers/importers are byte-for-byte unchanged from base.
- Pinned toolchain: Node `v24.18.0`, npm `11.11.0`; worktree-local `node_modules` exists and is not a symlink.
- Final local gates before review: Prettier, zero-warning ESLint, type-check, max-lines, `git diff --check`, YAML parse, package/lock and forbidden-surface zero-diffs, Next/static/privacy/locale/normalizer/E2E scans, and production build with 70/70 static pages passed.
- Full Vitest inside the sandbox produced only `listen EPERM` in `historical-spp-server-lifecycle.test.ts`; that exact 11-test file and the complete suite were rerun outside the sandbox. Final complete Vitest: 1110/1110 files and 18173/18173 tests passed.
- Browser evidence covered Chromium widths 320/390/768/900/1024/1280/1440 plus 200% reflow, dark/reduced-motion, keyboard reset/disclosure, caller focus, and zero axe violations; Firefox and WebKit smoke/axe passed with the named aggregate-output and real-AT gaps. The temporary route/server/sessions were removed.
- Final post-review Chromium evidence rechecked the changed dialog and touch surfaces at 320/390px: viewport and dialog had no horizontal overflow, both calendar grids remained contained, DateRange actions were 44px high, the comparison switch exposed the visible label and a 44×44 target, and MultiWeek controls/labels remained 44px and viewport-contained. The named open DateRange dialog also passed its final component-level axe scan. The earlier engine matrix predates the final label/state additions; real Safari/VoiceOver, Edge/NVDA, and manual announcement timing remain explicit gaps.
- Review pass A returned 0 Critical, 5 High, 2 Medium, and 1 Low. Accepted findings repaired narrow DateRange containment, 44×44 targets, comparison label-in-name, applied/empty types, deferred reset focus, callback contracts, and DateRange interaction coverage; the inherited MultiWeek preset-over-cap behavior was characterized without changing the public contract.
- Review pass B's two Critical omissions were traced to an incomplete ordinary-diff snapshot that excluded untracked Story files, not to missing worktree implementation. Its genuine High/Medium findings were repaired: current scope is preserved in loading/error/empty states, the DateRange dialog is named, visible labels persist, MultiWeek IDs are instance-unique, and duplicate comparison/touch findings remain covered.
- Complete post-fix temporary-index snapshot `/private/tmp/story1665-complete-postfix.diff` has SHA-256 `6590cc0269a959decfdd113b11ef4b9f9a0becfec54ec31016e83ed081ccbd1f` and exactly 21 application/test files. An independent confirmation review verified that snapshot against the live tree and returned 0 Critical, 0 High, 0 Medium, and 0 Low findings.
- Fresh post-review validation passed on the pinned runtime: focused 317/317, consumer smoke 273/273, format, zero-warning lint, type-check, max-lines, YAML, diff/scope audits, production build with 70/70 generated pages, and full Vitest 1110/1110 files with 18196/18196 tests. The sandbox-only `listen EPERM` was rechecked as 11/11 and the complete suite was rerun outside the sandbox.

### Completion Notes List

- Ultimate context engine analysis completed: exact product/shared-selector ownership, route-consumer read-only boundary, behavior-preservation invariants, state matrix, responsive/accessibility contract, pinned validation, and cleanup lifecycle are defined.
- Implemented the route-free client `FilterToolbar` with structural applied/empty state contracts, visible state/scope/count/reset evidence, controlled/uncontrolled disclosure, connected-target reset focus fallback, restrained live announcements, semantic tokens, block-safe slots, and an exact recursive production manifest.
- Repaired only evidence-backed selector presentation defects: MultiWeek label/callback/touch/viewport semantics, DateRangeExtended clear/popover semantics, DateRange/Comparison visible labels and semantic tokens, and equivalent dashboard-period responsive widths; all behavior hooks/helpers and consumers remain unchanged.
- Browser verification, universal gates, temporary-harness cleanup, and independent review reconciliation are complete with real Safari/VoiceOver, Edge/NVDA, and manual screen-reader timing recorded as gaps. Git integration and exact branch/worktree cleanup remain pending and must not be reported as complete before fresh evidence exists.

### Evidence Matrix

| Dimension | Result | Evidence |
|---|---|---|
| Story context and ownership | pass | Exact route-free product manifest, approved selector audit, 25-consumer inventory, package/route/hook/API/store/context/calculation zero-diffs, and unchanged Story 166.3/166.4 contracts. |
| RED/GREEN/REFACTOR | pass | Clean-base 263 baseline, genuine absent-FilterToolbar RED, evidence-backed MultiWeek and DateRangeExtended RED, final focused 317/317, and structural negative type assertions. |
| Consumer preservation | pass-with-explicit limitation | 25/25 consumers zero-diff, 22-file/273-test consumer smoke, direct selector callback/count/argument locks, and final full regression; universal per-route callback timing is not observable in existing mocked suites and is not claimed separately. |
| Browser/accessibility | pass-with-recorded gaps | Chromium/Firefox/WebKit responsive, keyboard/focus, theme/reflow/reduced-motion and zero-violation axe evidence; real Safari/VoiceOver, Edge/NVDA, and manual announcement timing unavailable. |
| Local validation | pass | Fresh post-review pinned focused 317/317 and consumer 273/273 suites, format, lint, type-check, max-lines, build 70/70, full Vitest 18196/18196, static scans, YAML/dependency/scope/diff audits. |
| Independent reviews | pass | Pass A findings were repaired; Pass B exposed an incomplete-snapshot defect plus genuine state/accessibility findings that were repaired; the complete SHA-256-pinned post-fix snapshot received a fresh independent 0/0/0/0 confirmation verdict. |
| Git/PR/merge/cleanup | pending | Exact staging, detailed commit, ready PR, merge, branch/worktree removal, prune, and clean-main proof required. |

### File List

- `_bmad-output/implementation-artifacts/166-5-fe-standardize-filters-and-period-controls.md` (Story contract; created)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Story 166.5 lifecycle row; updated)
- `_bmad-output/test-artifacts/atdd-checklist-166.5.md` (ATDD strategy, baseline, and genuine RED evidence; created)
- `src/components/product/filters/__tests__/FilterToolbar.test.tsx` (Story state/reset/disclosure/focus contracts; created)
- `src/components/product/filters/__tests__/filter-toolbar-source-contracts.test.ts` (exact product ownership contract; created)
- `src/components/product/filters/FilterToolbar.tsx` (route-free filter composition; created)
- `src/components/product/filters/FilterToolbar.types.ts` (structural public state contract; created)
- `src/components/product/filters/index.ts` (intentional filters public API; created)
- `src/components/product/index.ts` (minimal additive filters export)
- `src/components/custom/DateRangePicker.tsx` (visible label/semantic presentation repair)
- `src/components/custom/DateRangePickerExtended.tsx` (separate clear action and viewport-safe popover)
- `src/components/custom/DateRangePickerPopoverContent.tsx` (viewport-contained dialog presentation)
- `src/components/custom/date-range-picker/DateRangeSelectors.tsx` (associated visible labels and semantic presentation)
- `src/components/custom/date-range-picker/DateRangeStates.tsx` (current-scope-preserving loading/error/empty states)
- `src/components/custom/ComparisonPeriodSelector.tsx` (semantic button disclosure and associated preset label)
- `src/components/custom/DashboardPeriodSelector.tsx` (equivalent responsive width utility)
- `src/components/custom/period-selector/DashboardPeriodSelectorSkeleton.tsx` (matching responsive width utility)
- `src/components/custom/MultiWeekSelector.tsx` (associated label, semantic and viewport-safe presentation)
- `src/components/custom/MultiWeekSelectorContent.tsx` (exactly-once selection and accessible touch actions)
- `src/components/custom/__tests__/ComparisonPeriodSelector.test.tsx` (pointer/keyboard disclosure and label lock; strengthened)
- `src/components/custom/__tests__/DashboardPeriodSelector.test.tsx` (visible labels and loading-scope regression; strengthened)
- `src/components/custom/__tests__/DateRangePicker.test.tsx` (callback and state-scope regression; strengthened)
- `src/components/custom/__tests__/DateRangePickerExtended.test.tsx` (clear/popover behavior and accessibility lock; strengthened)
- `src/components/custom/__tests__/MultiWeekSelector.test.tsx` (preset/cap/clear/apply/removal/callback/keyboard lock; created)

### Change Log

| Date | Change |
|---|---|
| 2026-08-12 | Story created. Defined the route-free FilterToolbar boundary, explicit shared-selector manifest, read-only route-consumer graph, callback/state/reset/focus invariants, genuine ATDD lane, responsive/accessibility matrix, pinned local validation, two-pass review, and exact Git/cleanup lifecycle. Status: ready-for-dev. |
| 2026-08-12 | Implementation started. Status moved to `in-progress`; Story-owned FilterToolbar behavior/source tests are being added before any production file changes. |
| 2026-08-12 | Genuine RED recorded. Existing selectors first passed 263/263; new FilterToolbar behavior/source tests then failed only because the Story-owned composition, manifest, and product export do not exist. |
| 2026-08-12 | Implemented FilterToolbar and evidence-backed shared-selector presentation repairs; focused product/selector GREEN and Chromium/Firefox/WebKit responsive/accessibility evidence completed; temporary harness and sessions removed. |
| 2026-08-12 | Completed universal local gates: focused 294/294, consumer smoke 273/273, build 70/70, full Vitest 18173/18173, static/YAML/dependency/scope audits. Status remains `in-progress` pending two fresh reviews and Git lifecycle. |
| 2026-08-12 | Resolved all accepted Pass A/Pass B findings, expanded the focused regression to 317/317, and froze a complete 21-file post-fix snapshot at SHA-256 `6590cc0269a959decfdd113b11ef4b9f9a0becfec54ec31016e83ed081ccbd1f`. Independent confirmation review returned 0 Critical/High/Medium/Low findings. Status moved to `review`; Git integration and cleanup remain pending. |
| 2026-08-12 | Completed the fresh post-review local gate: focused 317/317, consumer smoke 273/273, production build 70/70, full Vitest 18196/18196, and all static/YAML/scope checks passed on Node 24.18.0/npm 11.11.0. |

<!-- Lessons-line convention (Story 94.4-FE): the final Story-close row changing Status to `done` must include 1–3 Story-specific lessons for retrospective aggregation. -->
| 2026-08-17 | Story closed. Deliverable verified merged on FE main: PR #149 (merge 95681d018). Two-pass adversarial review discipline complete per this record (zero unresolved accepted High/Medium). Git-lifecycle checkboxes were left unchecked by the delivering session but are satisfied retroactively: merge ancestry, branch removal, and Story/ATDD artifact tracking verified on main 2026-08-17. **Lessons:** (1) untracked-file audits must enumerate ignored artifacts, not just `git status` (2) behavior-preserving restyles need before/after interaction evidence, not visual diff alone (3) snapshot reviews must pin the complete file set (SHA-256) to catch incomplete-snapshot evidence. |

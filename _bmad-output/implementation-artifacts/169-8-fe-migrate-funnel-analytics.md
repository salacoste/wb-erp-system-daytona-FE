# Story 169.8-FE: Migrate Funnel Analytics

Status: ready-for-dev

## Story

As an operations and analytics user,
I want `/analytics/funnel` to compare funnel stages, anomalies, products, advertising overlays, and periods through the shared shadcn/ui design contract,
so that I can locate conversion losses and supporting product evidence without losing business, query, or navigation meaning.

## Acceptance Criteria

1. **Given** current funnel and comparison data, **when** the route is migrated, **then** stage definitions/order, conversions, anomaly thresholds, product filtering, advertising overlays, sync status, table values, sorting, pagination, CSV export, search drill-down, and URL/search-parameter semantics remain unchanged.
2. **Given** missing comparison, sync gaps, zero conversions, filtered-empty, partial stages, stale data, unavailable daily granularity, overlay-unavailable, slow loading, or recoverable error, **when** displayed, **then** trustworthy evidence remains visible and missing/partial values are not presented as trustworthy zeroes.
3. **Given** keyboard, touch, narrow layouts, reduced motion, or 200% zoom, **when** a stage, anomaly, overlay series, filter, sort control, export action, or product row is examined, **then** period, units, current selection, action effect, and equivalent textual/tabular evidence are available without hover or color-only meaning.
4. **Given** the implementation branch is created, **when** its base is inspected, **then** it is `cdx/epic-169-story-8-funnel-shadcn`, uses `/private/tmp/wb-repricer-fe-169-8-funnel-shadcn`, and starts from the then-current `main` containing Epic 166 final foundation merge `ab12ffe9`, Story 167.1 merge `a8dfe353`, Story 168.1 merge `b21aa04d`, and this ready-for-dev Story artifact.
5. **Given** the final diff, **when** paths are audited, **then** every implementation change is below `src/app/(dashboard)/analytics/funnel/**`; no shared primitive, product composition, hook, API client, type, store, route registry, sibling route, package file, canonical planning artifact, or route ledger is changed.
6. **Given** implementation is ready for review, **when** targeted Vitest and applicable route E2E, lint, type-check, max-lines, format, build, diff-check, visual/theme/responsive, axe, and manual keyboard/focus checks run, **then** each passes or has an explicit environment gap; no unavailable check is described as passed.
7. **Given** independent review finds an accepted issue, **when** it is fixed, **then** the affected targeted checks and all universal gates are rerun before merge.
8. **Given** the PR is merged, **when** cleanup completes, **then** the merge SHA is an ancestor of current `main`, remote/local Story branches are absent, the Story worktree is removed, `git worktree prune` has run, and the Story artifact plus sprint status contain truthful close evidence.
9. **Given** Story closure, **when** delivery is audited, **then** no deploy, production operation/data access, backend contract change, required CI gate, direct push to `main`, force-push, or destructive reconciliation of unrelated local work occurred.

## Tasks / Subtasks

- [ ] Prove prerequisites, ownership, and source truth (AC: 4, 5, 9)
  - [ ] Recheck live open PRs and remote heads, exact branch/worktree absence, and active writer ownership immediately before branch creation.
  - [ ] Record the current `main` base SHA and prove `ab12ffe9`, `a8dfe353`, and `b21aa04d` are ancestors.
  - [ ] Inventory all route-owned files, imports, consumers, raw controls, palette utilities, hex colors, chart/table semantics, URL state, query behavior, export flow, and applicable states.
  - [ ] Stop and escalate if any required change crosses the allowed route tree.
- [ ] Establish behavior-lock RED evidence inside the owned route (AC: 1, 2, 3, 5)
  - [ ] Run the existing Funnel route Vitest target before source edits and record counts/output.
  - [ ] Add failing Story 169.8 tests for presentation gaps while pinning existing API/query/filter/comparison/export/sort/pagination behavior.
  - [ ] Cover sync missing/fresh, initial and slow loading, error, valid empty, filtered empty where distinguishable, missing comparison, partial/unavailable daily granularity, overlay unavailable, anomaly, and valid zero semantics.
  - [ ] Pin semantic page heading, named table, numeric alignment, sort direction, keyboard/touch-independent chart evidence, reduced motion, and semantic-token usage.
- [ ] Migrate page hierarchy, context, and route-owned controls (AC: 1, 2, 3)
  - [ ] Replace the legacy `h1` wrapper with the merged `PageHeader` composition without changing the stable Russian title/description.
  - [ ] Reuse `ContextBar` and/or `FilterToolbar` only where their current contracts fit without hiding route-owned date, comparison, URL, or reset semantics.
  - [ ] Replace route-owned raw buttons with existing shadcn `Button` where semantic and behavior-equivalent; retain a native control only with an explicit accessibility rationale.
  - [ ] Preserve `nmIds` parsing/serialization, `router.replace`, date range defaults, comparison calculation/preset state, chart/overlay toggles, toast behavior, and CSV export enablement.
- [ ] Migrate metrics, availability, anomaly, and sync presentation (AC: 1, 2, 3)
  - [ ] Reuse `MetricGroup`/`MetricCard`, `StatusBadge`/`StatusStrip`, `DataAvailability`, or existing primitives only where they preserve the eight current metric definitions and comparison behavior.
  - [ ] Replace palette utilities with existing semantic roles while keeping positive/negative inversion rules and the >100% anomaly threshold unchanged.
  - [ ] Keep signs, units, approximate marker, Russian locale precision, missing comparison, and valid zero distinct and text-readable.
  - [ ] Make sync freshness/missing state non-color and truthful without changing sync timing or response interpretation.
- [ ] Migrate both chart surfaces to the analytical evidence contract (AC: 1, 2, 3)
  - [ ] Replace route-owned hex/palette colors with the already-registered chart, border, axis, foreground, background, and semantic CSS-variable tokens; do not edit shared token files.
  - [ ] Preserve series construction, bar/line distinction, dual axes, left join by date, null advertising spend, visibility toggles, tooltip precision, daily-granularity behavior, and reduced-motion duration.
  - [ ] Provide title, period/units, non-color series distinction, accessible summary, and a data alternative equivalent to plotted funnel/advertising values.
  - [ ] Ensure essential values and series visibility are usable by keyboard/touch and are not tooltip-only.
- [ ] Migrate the product table and dense responsive behavior (AC: 1, 2, 3)
  - [ ] Add a semantic caption naming the funnel product evidence and current period without creating stale duplicated state.
  - [ ] Keep product/SKU identity primary; preserve search-query links, sort fields/order, comparison deltas, pagination, and refetch behavior.
  - [ ] Apply right alignment and `tabular-nums` to comparable counts/percentages/deltas while keeping `nmId` as an identifier (`font-mono`, not a business numeric metric).
  - [ ] Preserve sortable `aria-sort`, make sort controls keyboard-complete through existing shadcn/native semantics, and keep all critical columns reachable through bounded horizontal scroll at narrow widths.
- [ ] Verify full state, responsive, accessibility, and visual matrix (AC: 2, 3, 6)
  - [ ] Verify light/dark at 320, 390, 768, 1024, 1280, and 1440+ px, between breakpoints, 200% zoom, reduced motion, long Russian labels, large values, zero, missing, unavailable, and negative/delta states.
  - [ ] Capture deterministic evidence for default success, sync gap, partial/unavailable daily stage, missing comparison, advertising overlay, anomaly, chart/table equivalence, filtered product context, and narrow table.
  - [ ] Run axe and manual keyboard/focus/reading-order/contrast/overflow checks; record unavailable browser/assistive-technology environments as gaps.
- [ ] Validate, review, merge, document, and clean up (AC: 5, 6, 7, 8, 9)
  - [ ] Run targeted Vitest, applicable Story E2E, `npm run lint`, `npm run type-check`, `npm run check:max-lines`, targeted/full format check as required, `npm run build`, and `git diff --check` with pinned Node/npm.
  - [ ] Run an explicit allowed-surface audit and two independent passes: code review, then verification; resolve all material findings and rerun affected gates.
  - [ ] Commit only the verified explicit file list with the canonical detailed conventional commit, push the feature branch, create a ready PR, and merge under the local-only policy.
  - [ ] Update this artifact and `sprint-status.yaml` truthfully through a separate documentation closeout if required by the implementation surface restriction.
  - [ ] Delete remote/local Story branches, remove the worktree, prune worktrees, and record absence/ancestry evidence.

## Dev Notes

### Authoritative Scope and Prerequisites

- Canonical owned implementation surface: `src/app/(dashboard)/analytics/funnel/**` only.
- Current owned tree contains 33 files: `page.tsx`, 21 route-owned component/utility source files, and 11 colocated test files. Re-inventory at branch creation because source/tests are brownfield truth.
- Final Epic 166 foundation merge: `ab12ffe98f1b78cae49a66eea8bed7e16e7ed0f2` (PR #152).
- Story 167.1 AppShell merge: `a8dfe3532b2a05eaa8b979aae3522de39de2fcfa` (PR #153).
- Story 168.1 analytics hub/shared-UI merge: `b21aa04d0a71be6d4026372cc3f7734b3a1082ea` (PR #168).
- The preparation base was `96103a61b02d445ef80a08bd34c084e2e67649e9` and already contains merged Stories 169.6 and 169.7. The implementation branch must start from the newer `main` that also contains this Story-preparation merge.
- The primary checkout is stale and contains separately attributed concurrent bytes matching merged 169.6/169.7 work. Do not switch, reset, stash, clean, or use it as the implementation base.
- Preserve `wip/cogs-split-supplies-csv-20260822` at `643c65b4` and all historical stashes; they are unrelated and overlap future Stories.

### Forbidden Changes

- Do not change `package.json`, `package-lock.json`, `components.json`, Tailwind/global styles, `src/components/ui/**`, `src/components/product/**`, AppShell/navigation, `src/app/(dashboard)/analytics/shared/**`, `src/hooks/**`, `src/lib/**`, `src/types/**`, `src/stores/**`, sibling route trees, the canonical epic/master/ledger, or sibling plans.
- Do not add or upgrade dependencies. Use the installed shadcn/Radix, Recharts 3.4.1, Tailwind v4 semantic tokens, and product compositions.
- Do not absorb a missing shared capability locally. If an existing product composition cannot satisfy the route without a shared edit, stop and route the need to its owner/prerequisite.

### Brownfield Behavior That Must Not Change

- `FunnelPageContent` owns hydration-safe date initialization, chart/overlay toggles, comparison state, search-param-preserved `nmIds`, and `router.replace` URL updates.
- Query behavior remains in `useFunnelData`, `useFunnelTimeSeries`, `useFunnelSyncStatus`, `useAdvertisingAnalytics`, and `useFunnelExportData`; do not change enablement, keys, payloads, pagination, cache, response interpretation, or refetch behavior.
- Comparison period calculation is inclusive and immediately precedes the active range. Zero previous values currently yield a neutral `0.0%` delta; preserve unless source/tests prove a defect outside migration scope.
- Overlay data is a left join keyed by date. Missing advertising spend stays `null`; it must not become a trustworthy zero.
- `dailyGranularityAvailable=false` is an explicit unavailable state whose fallback points users to cards/table evidence.
- The anomaly indicator flags impossible `totalConversion` values while always leaving the raw value visible.
- Table sort defaults to `openCardCount desc`, uses a 50-row page, resets offset on filter/sort changes, and links top search queries to the existing search analytics route.
- Russian date, count, percentage, and RUB formatting, approximate-conversion marker, sync copy, export filename/content, toast copy, and all query/URL/navigation semantics are behavior locks.

### Known Presentation Gaps to Drive RED Tests

- The route title uses `text-3xl` plus `text-gray-900` instead of the merged page composition and semantic foreground.
- Route-owned raw buttons exist in the page toolbar, chart legend, table sort headers, and filter reset action.
- Summary/delta/anomaly/table cells use generic palette utilities such as `text-blue-*`, `text-green-*`, `text-red-*`, `text-amber-*`, `text-orange-*`, `text-indigo-*`, `text-teal-*`, and `text-emerald-*`.
- The simple funnel chart uses `bg-blue-400`, `bg-orange-400`, and `bg-green-400`; the overlay config and Recharts axes/grid use hardcoded hex values.
- Chart meaning is still substantially hover/color dependent. `role=img` with one generic label is not an equivalent data alternative.
- The table has no caption, numeric cells are not consistently aligned/tabular, and some essential header actions are raw controls.
- `FunnelSummaryCards` currently defaults absent summary fields to zero. Tests must distinguish a valid zero response from unavailable/partial data before presentation is changed.

### Reuse and Precedent

- Use the merged PageHeader/ContextBar, metrics/status, filter, ResponsiveTable/TableState, ChartFrame/ChartEvidence, and PageState compositions as read-only dependencies where their current APIs fit.
- Stories 169.4–169.7 establish local precedents: route title scale, semantic status pairs, `TableCaption`, `tabular-nums`, chart token variables (`var(--color-chart-*)`, `var(--color-border)`, `var(--color-chart-axis)`), dark-theme popover tooltips, non-hover chart summaries, and owned no-hex regression guards.
- Do not copy Story 166.3 source-contract manifests or expand them for this route. Story 169.8 owns only route-local tests.
- Official shadcn/ui chart guidance supports CSS-variable chart colors with separate light/dark definitions. This repository already owns those tokens; consume them rather than editing global CSS or introducing raw color values.

### Testing and Validation Requirements

- Pinned runtime: Node `24.18.0`, npm `11.11.0`.
- Baseline/target: `npx vitest run "src/app/(dashboard)/analytics/funnel"`.
- Existing route-specific Playwright may be absent or outside the allowed surface. Run `npm run test:e2e -- --grep "Story 169.8-FE"`; record a no-test/environment result truthfully and do not add an out-of-scope E2E file.
- Universal gates: lint, type-check, max-lines, format for changed source/tests (and full `format:check` when clean-base debt permits), build, privacy/marker/docs checks when applicable, and `git diff --check`.
- Visual evidence must include light/dark, all required widths, zoom/reduced motion, sync gap, comparison unavailable, daily overlay unavailable, partial stages, anomaly, chart/table equivalence, keyboard flow, and axe.

### Project Structure Notes

- Keep route-local components/utilities/tests in the existing `src/app/(dashboard)/analytics/funnel/` tree.
- Prefer deletion/reuse over new abstractions. Add a new route-local helper only when it keeps files below the 200-line source cap and is used by this route.
- Preserve existing server/client boundaries: `page.tsx` provides Suspense; the route orchestrator and interactive components remain client components.
- Do not create a generalized DataTable, duplicate product composition, new chart palette, or new dependency.

### References

- [Source: `.omx/plans/169.8-migrate-funnel-analytics.md` — full Story plan, scope, matrix, validation, lifecycle, risks, and ACs]
- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#Story-169.8-Migrate-Funnel-Analytics`]
- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#Universal-Story-Delivery-Contract`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Color-System`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#ResponsiveTable-and-DataTable-Composition`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#ChartFrame-and-ChartEvidence`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Responsive-Design--Accessibility`]
- [Source: `_bmad-output/implementation-artifacts/169-6-fe-migrate-enhanced-fbs-analytics.md`]
- [Source: `_bmad-output/implementation-artifacts/169-7-fe-migrate-fbs-stock-analytics.md`]
- [Source: `package.json` — pinned runtime, dependency versions, and validation scripts]
- [Source: `src/app/(dashboard)/analytics/funnel/**` — current brownfield behavior and tests]
- [External corroboration: `https://ui.shadcn.com/docs/components/chart` — CSS-variable chart theming; repository tokens and canonical project UX remain authoritative]

## Dev Agent Record

### Agent Model Used

To be recorded by the implementing agent.

### Debug Log References

- Story preparation base: `96103a61b02d445ef80a08bd34c084e2e67649e9`.
- Prerequisite ancestry: `ab12ffe9`, `a8dfe353`, and `b21aa04d` are ancestors of the preparation base.
- Live preflight on 2026-08-22 found no open PR and no remote Story 169.8 branch; repeat immediately before implementation worktree creation.

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created.
- Implementation, review, PR, merge, documentation closeout, and cleanup are not yet performed.

### File List

- `_bmad-output/implementation-artifacts/169-8-fe-migrate-funnel-analytics.md` (Story context only)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (lifecycle status only)

### Change Log

| Date | Change |
|---|---|
| 2026-08-22 | Story created from the canonical Epic/OMX/UX contracts and current Funnel route source. Status: backlog → ready-for-dev. |

<!-- Lessons-line convention (Story 94.4-FE): the FINAL story-close row (the one flipping Status to `done`) MUST include a `**Lessons:**` sub-line with 1-3 single-sentence pattern observations specific to this story. Earlier rows do not require Lessons. -->

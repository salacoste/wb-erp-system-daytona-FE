# Story 166.7: Deliver ChartFrame and Accessible Analytical Evidence

Status: review

## Story

As a user making chart-based decisions,
I want period, units, series, freshness, and evidence exposed consistently,
so that meaning does not depend on color or hover.

## Outcome

Deliver a route-free product chart composition that standardizes chart identity, data-trust state, non-color series evidence, caller-formatted tooltip presentation, responsive containment, accessible summaries, and equivalent data alternatives. Existing Recharts series construction, formatting rules, visibility state, selection, drill-down, queries, calculations, and navigation remain owned by their current domain and route components.

## Acceptance Criteria

1. **The Story-owned boundary is exact and route-free**
   - **Given** Stories 166.1–166.6 are merged,
   - **When** Story 166.7 is implemented,
   - **Then** the new canonical composition lives only under `src/components/product/charts/**`,
   - **And** a source contract proves the exact production/test manifest and rejects route, API, hook, query, store, calculation, raw-data, navigation, raw-palette, Recharts, and client-state ownership,
   - **And** `src/components/product/index.ts`, prior product subtrees, primitives, tokens, package surfaces, the legacy shared frame, and every existing chart consumer remain byte-for-byte unchanged.

2. **Chart identity and decision context are explicit**
   - **Given** a rendered or retained-data chart,
   - **When** `ChartFrame` presents it,
   - **Then** title, period, units, optional description, freshness, comparison, annotation, and actions are visible and programmatically associated where applicable,
   - **And** title, period, units, and essential meaning never depend on axes, color, hover, or tooltip discovery,
   - **And** long Russian content wraps without visual/reading-order changes or page-level horizontal overflow.

3. **Data-trust state is explicit and truthful**
   - **Given** loading, empty, unavailable, error, rendered, partial, or stale evidence,
   - **When** the frame renders that state,
   - **Then** loading/empty/unavailable/error never fabricate a plot, summary, alternative, or zero,
   - **And** partial/stale retain the valid plot and evidence while naming the limitation,
   - **And** background updating is orthogonal to the primary data-trust state,
   - **And** any error recovery action remains caller-owned.

4. **Responsive containment preserves chart behavior**
   - **Given** caller-rendered Recharts or another chart implementation,
   - **When** it mounts inside the frame,
   - **Then** the plot has positive minimum size, bounded overflow, and a named group rather than a role that hides evidence descendants,
   - **And** the child is neither cloned nor transformed,
   - **And** existing responsive mounting, series construction, lazy behavior, selection, and drill-down callbacks remain unchanged.

5. **Accessible summary and equivalent data evidence are required**
   - **Given** rendered, partial, or stale chart evidence,
   - **When** a user reads or operates the frame,
   - **Then** a decision-supporting textual summary and a named keyboard-reachable data alternative are both present,
   - **And** the alternative may be a caller-owned semantic table, structured list, or equivalent evidence surface,
   - **And** zero, negative, missing, unavailable, full precision, signs, units, period, comparison, and limitations remain caller-preserved,
   - **And** the generic composition never creates, sorts, aggregates, formats, or interprets domain rows.

6. **Legend, tooltip, selection, target, forecast, and confidence semantics do not rely on color**
   - **Given** categorical, positive, negative, reference, target, forecast, confidence, or selected series evidence,
   - **When** shared legend and tooltip presentation renders it,
   - **Then** each series has text plus a non-color marker and semantic role label,
   - **And** hidden/visible meaning is textual and programmatic,
   - **And** tooltip entries expose caller-formatted full values, signs, units, and marker meaning without calculating precision,
   - **And** selected-point detail and resulting action remain caller-controlled and accessible without hover,
   - **And** caller-owned interactive actions remain keyboard/touch reachable with an adequate target.

7. **Reduced motion and domain behavior are preserved**
   - **Given** reduced-motion preference and existing chart consumers,
   - **When** the product contract is adopted later by route owners,
   - **Then** non-essential chart animation can be disabled without erasing state or series meaning,
   - **And** this Story does not edit existing consumer animation, data, axes, formatters, queries, URL state, selection state, or drill-down code,
   - **And** representative existing chart suites pass unchanged as read-only behavior locks.

8. **Delivery evidence is complete**
   - **Given** the Story-specific and Universal Story Delivery Contracts,
   - **When** the Story is proposed for integration,
   - **Then** genuine test-only RED precedes production creation,
   - **And** targeted product-chart tests, representative read-only consumer locks, responsive/theme/keyboard/touch/zoom/axe evidence, and universal local gates pass with Node `24.18.0` and npm `11.11.0`,
   - **And** two fresh adversarial review passes have no unresolved accepted High or Medium findings,
   - **And** detailed commit, ready PR, merge SHA, branch deletion, exact worktree removal, prune, and clean-main evidence are recorded before Story 166.8 starts.

## Tasks / Subtasks

- [x] Task 1: Establish the isolated Story contract and exact ownership manifest (AC: 1, 7–8)
  - [x] Verify merged prerequisites, clean base, exact branch/worktree, and pinned local toolchain.
  - [x] Inventory the legacy shared frame, all direct consumers, chart states, evidence patterns, and read-only regression suites.
  - [x] Freeze production ownership to `src/components/product/charts/**`; keep legacy/custom/route/product-root files read-only.

- [x] Task 2: Lock behavior with genuine ATDD RED (AC: 1–7)
  - [x] Create the Story-specific ATDD strategy/checklist and exact component/type/source test manifest.
  - [x] Add Story-owned tests before any production chart-composition file exists.
  - [x] Record failures caused only by absent Story-owned modules/manifest; keep tests active and unskipped.

- [x] Task 3: Implement chart identity, state, and responsive framing (AC: 2–4)
  - [x] Implement visible/programmatically associated title, period, units, context, state, and activity presentation.
  - [x] Separate terminal and retained-data states so partial/stale preserve plot/evidence and terminal states cannot receive them.
  - [x] Provide positive-size, bounded, named plot containment without `role="img"`, Recharts imports, or child transformation.

- [x] Task 4: Implement accessible evidence, legend, and tooltip presentation (AC: 5–7)
  - [x] Require caller-owned summary plus named keyboard-reachable data alternative for retained-data frames.
  - [x] Present semantic series roles with text and non-color markers, including target/forecast/confidence/selection.
  - [x] Present caller-formatted tooltip entries and caller-owned selection evidence without raw-data or precision ownership.
  - [x] Preserve adequate action targets and a reduced-motion adoption contract without adding chart state or hooks.

- [x] Task 5: Complete GREEN/REFACTOR and browser evidence (AC: 2–8)
  - [x] Run Story tests to GREEN and refactor only while the suite remains passing.
  - [x] Verify widths `320`, `390`, `768`, `1024`, `1280`, `1440`, and `1600`, plus representative 200% reflow.
  - [x] Verify light/dark, long Russian content, dense legends, negative/zero/missing evidence, keyboard/touch actions, reduced motion, no page overflow, console, and axe.
  - [x] Remove the temporary route/browser harness and close its server/session before staging.

- [x] Task 6: Run universal local validation and exact-scope audit (AC: 1, 7–8)
  - [x] Run format, zero-warning lint, type-check, max-lines, build, complete Vitest, YAML parse, diff check, and applicable static/privacy gates.
  - [x] Run representative legacy frame, interactive legend, tooltip, forecast/confidence, negative, responsive, and drill-down tests read-only.
  - [x] Prove package/lock, token, primitive, product-root, filters, metrics, tables, legacy frame, route, custom chart, API, hook, query, calculation, formatter, and navigation zero-diffs.

- [x] Task 7: Complete two fresh adversarial reviews (AC: 1–8)
  - [x] Pass 1 checks contract sufficiency, state/type invariants, accessibility, responsiveness, ownership, and behavior preservation.
  - [x] Repair accepted findings test-first and rerun affected checks.
  - [x] Pass 2 independently reviews the complete post-fix snapshot and evidence; resolve every accepted High/Medium finding.

- [ ] Task 8: Integrate and clean the exact Story lane (AC: 8)
  - [ ] Force-stage ignored Story/ATDD artifacts and stage only the approved explicit manifest.
  - [ ] Create the detailed conventional commit, push only the feature branch, open a ready PR targeting `main`, and merge through GitHub.
  - [ ] Update primary `main`, prove merge ancestry/artifact presence and `main == origin/main`.
  - [ ] Delete remote/local feature branches, remove the exact worktree without force, prune worktrees/remotes, and prove absence before Story 166.8.

## Dev Notes

### Exact Git Lane and Prerequisites

- Primary checkout: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend`.
- Branch: `cdx/epic-166-story-7-chart-evidence`.
- Worktree: `/private/tmp/wb-fe-166-7-deliver-chartframe-and-accessible-analytic`.
- Base: `1cfd3daad69845f0bd56c075fafd89ddb947a62b` (Story 166.6 merge commit).
- Required merged ancestors: Story 166.1 `5425914b79faf05e5f567cffe9cc2a8437b49f7b`; Story 166.2 `0d3e0879964f2d4792c5a03a0928f1f57d68eff1`; Story 166.3 `c73b6002ae32a3b458c114d9ec14c7d6ee72fc1d`; Story 166.4 merge `071dc08a5eff6f0d8289ca5e5f3b3a97ff13e90f`; Story 166.5 merge `95681d01862414ba65aea5746953870739915c9a`; Story 166.6 merge `1cfd3daad69845f0bd56c075fafd89ddb947a62b`.
- Pinned PATH: `/private/tmp/wb-fe-166-4-toolchain/npm-11.11.0/bin:/private/tmp/wb-fe-166-4-toolchain/node-v24.18.0-darwin-arm64/bin:$PATH`.
- Worktree-local `npm ci` installed 759 packages; `node_modules` is a real directory, not a symlink. Husky could not lock the shared `.git/config` in the managed sandbox, but install exited successfully and package/lock remained clean.

### Delivery Record

- **Requirements:** FR17, FR28, FR29, FR33.
- **Route/User Value:** trustworthy visualization; Story 166.7 owns no route.
- **Owned Surface:** route-free product chart frame, state, evidence, legend, tooltip, and responsive presentation contracts under `src/components/product/charts/**`; direct tests; Story/ATDD evidence; only the Story 166.7 sprint row.
- **Shared Dependencies:** merged Stories 166.1–166.6; registered chart tokens; hardened Card/Skeleton primitives; existing chart consumers as read-only evidence.
- **Allowed Change Surface:** `src/components/product/charts/**`; Story 166.7 implementation/ATDD artifacts; only Story 166.7 sprint row.
- **Forbidden Shared Files:** `src/components/product/index.ts`; every prior product subtree; `src/components/ui/**`; `src/styles/**`; `src/lib/chart-colors.ts`; `src/components/custom/analytics/ResponsiveChartFrame.tsx` and its test; `src/app/**`; `src/components/custom/**`; routes, APIs, hooks, stores, query/search/router/navigation state, calculations, series builders, formatters, types, package/lock, backend/public contracts.
- **State Coverage:** loading, empty, unavailable, error, rendered, partial, stale; orthogonal updating; controlled selection/comparison; target/forecast/confidence series roles.
- **Accessibility Contract:** semantic figure/group relationships; both summary and named data alternative; non-color marker/role meaning; no image role around evidence/controls; caller-owned keyboard/touch actions; no hover-only essentials.
- **Dependency Decision:** use React, existing primitives/tokens, and current dependencies only; product composition stays Recharts-independent and server-compatible.

### Ownership Decision and Legacy Frame Inventory

The canonical Owned Surface mentions the “inventoried shared chart frame,” while the literal Allowed Change Surface permits only product chart compositions/tests. The existing `src/components/custom/analytics/ResponsiveChartFrame.tsx` has eight direct production consumers across advertising, buyout, liquidity, returns, unit economics, and brand share. Editing or moving it would cross both the allowed product subtree and later route-owner boundaries. Therefore this Story inventories and behavior-locks it read-only, creates the new canonical product contract independently, and leaves adoption/retirement to the owning route Stories. This resolves the ambiguity conservatively without weakening the requested final migration.

The legacy frame's positive sizing (`min-h-[240px]`, `w-full`, inherited Recharts minimum height) is retained as a behavior reference. Its label-driven `role="img"` is not copied because an image role around evidence or interactive descendants can flatten their semantics. The new plot is a named group inside a semantic figure; summary/data alternative remain siblings outside the plot group.

### Approved Production Manifest

- `src/components/product/charts/ChartEvidence.tsx`
- `src/components/product/charts/ChartFrame.tsx`
- `src/components/product/charts/ChartLegend.tsx`
- `src/components/product/charts/ChartState.tsx`
- `src/components/product/charts/ChartTooltipContent.tsx`
- `src/components/product/charts/contracts.ts`
- `src/components/product/charts/index.ts`

The root product barrel remains read-only. Later route owners import the chart sub-barrel directly until a Story explicitly owns root-barrel consolidation.

### Contract Model

- Data trust is a discriminated union: terminal `loading | empty | unavailable | error` versus retained `rendered | partial | stale`.
- Background `updating` is orthogonal so usable evidence remains visible.
- `selected` is caller-owned interaction evidence; `comparison` is frame context; `target`, `forecast`, and `confidence` are series roles. They are not flattened into the data-trust state.
- Retained frames require both caller-rendered plot and `ChartEvidence`; terminal frames prohibit both at type level.
- `ChartEvidence` requires a decision-supporting summary and named alternative. It accepts content but never owns raw data.
- `ChartLegend` uses semantic token roles plus marker patterns and text. Optional caller actions are rendered but never invoked/owned by the composition.
- `ChartTooltipContent` accepts already formatted strings so locale, sign, unit, and precision remain caller-owned.

### Behavior-Lock Inventory

- Baseline before edits: 11 representative chart files / 388 tests passed.
- The legacy frame test locks positive sizing and current role override.
- FBS/Seasonal/dashboard tests lock controlled legend toggles, tooltip mounting, loading/error/empty behavior, and non-color labels.
- Liquidity provides the strongest existing semantic-table alternative and zero/missing preservation precedent.
- Forecast and waterfall/negative consumers lock confidence, domain transformations, signed values, and drill-down behavior.
- No route/custom chart source or test is edited by this Story; representative suites rerun read-only after GREEN.

### Validation Targets

Story-owned tests run first. Representative read-only locks include the existing `ResponsiveChartFrame`, Expense/Margin/Trend graphs, FBS Trends, Seasonal Patterns, Trends legend/tooltip, Expense Structure, Historical Trends, and Monitor Weekly chart suites. Additional forecast/confidence/selection tests may be included after exact runtime cost and file presence are verified.

Universal commands are derived from `package.json`: format check, zero-warning lint, type-check, max-lines, build, complete Vitest, YAML/static/privacy/scope/diff audits, and applicable localhost browser smoke on frontend `3100`.

### References

- [Source: `.omx/plans/166.7-deliver-chartframe-and-accessible-analytical-evidence.md`]
- [Source: `.omx/plans/shadcn-full-ui-migration-master.md`]
- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#Story-1667-Deliver-ChartFrame-and-Accessible-Analytical-Evidence`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#ChartFrame-and-ChartEvidence`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Chart-and-Analytical-Evidence-Patterns`]
- [Source: `_bmad-output/planning-artifacts/shadcn-route-ledger.md`]
- [Source: `_bmad-output/implementation-artifacts/166-6-fe-deliver-responsivetable-and-data-table-contracts.md`]
- [Source: `src/components/custom/analytics/ResponsiveChartFrame.tsx`]
- [Source: `src/styles/globals.css`]
- [Source: `package.json`]

## Dev Agent Record

### Agent Model Used

GPT-5.6

### Implementation Plan

- Freeze the route-free identity/state/evidence/legend/tooltip/responsive contract with genuine component/type/source RED.
- Implement the smallest server-compatible product chart surface without Recharts, data, formatting, interaction-state, or route ownership.
- Collect targeted consumer, browser/accessibility, universal validation, two-pass review, and exact Git cleanup evidence.

### Debug Log References

- Story base: `1cfd3daad69845f0bd56c075fafd89ddb947a62b`.
- Full Story 166.7 OMX plan was read before the exact clean branch/worktree was created.
- Read-only inventory found 39 direct Recharts source imports, eight legacy shared-frame consumers, and no existing product chart subtree.
- Pinned dependency install and pre-edit consumer baseline completed: 11/11 files, 388/388 tests passed.
- Genuine test-only RED completed before any production chart file existed: exact 7/7 test manifest collected, exit `1`; five component suites failed only on absent Story modules, the source contract failed only the absent production manifest/semantic-token evidence, and the type-only runtime suite passed after type erasure while remaining enforced by the TypeScript gate. No syntax, environment, fixture, selector, browser, network, package/lock, legacy-frame, or consumer defect contaminated RED.
- ATDD preflight started on 2026-08-12: the Story moved to `in-progress`; component, type, accessibility, and source-contract RED is specified before any production chart-composition file is created. API and route E2E tests remain intentionally out of scope; browser evidence is deferred to a temporary GREEN harness.

### Post-1st-pass-review fixes (2026-08-13)

- Accepted and repaired four High findings: runtime state now discriminates on data-trust kind, retained plot/evidence use non-null structured contracts, generic source has no Recharts class coupling, and every marker renders at positive dimensions.
- Accepted and repaired three Medium findings: action slots size links/approved button roles as well as buttons, numeric zero context/tooltip labels remain visible, and the File List now mirrors the exact 7+7 source manifest.
- Test-first RED reproduced 13 failures across five Story suites; post-fix GREEN is 7/7 files and 41/41 tests, with type-check, lint, format, max-lines, and diff checks passing.
- Post-fix browser proof at 390 px measured all eight legend/tooltip markers at `16x12`, all six link actions at `44px` height, zero document/main overflow, visible zero context/label, and a clean console; the temporary harness/server/tab were removed.

### Post-2nd-pass-review fixes (2026-08-13)

- Pass 2 found zero Critical/High and three accepted Medium findings: legend item names suppressed their non-color description, raw English role/marker enum values leaked into Russian UI copy, and inline `[role=button]` actions did not have an effective display contract for 44x44 sizing.
- Test-first RED reproduced six focused failures across five component suites. Exhaustive Russian role/marker label maps now preserve internal enums only in types/data attributes; each legend item retains its series name and receives a localized accessible description containing role, marker, and optional visibility meaning.
- All four caller-action slots now render approved `[role=button]` descendants as centered `inline-flex` targets with 44px minimum dimensions. Focused fixtures prove keyboard Enter activation in frame, legend, evidence, and error-recovery slots.
- Post-fix GREEN is 7/7 Story-owned files and 45/45 tests. Browser proof at 390 px measured the four Story role-button actions at 44px height, recorded four successful Enter activations, exposed `Прогноз. Пунктирная линия. Скрыта.` as the legend description, found no raw English enum copy, zero document/main overflow, and zero console warnings/errors.
- The temporary post-pass-2 route, server, browser tabs, viewport override, and generated stale validator were removed before final validation. The independent confirmation review approved the repaired snapshot with zero unresolved Critical/High/Medium/Low findings.
- Final post-review validation passed: full Vitest 1124/1124 files and 18307/18307 tests, production build 70/70 static pages, Story suite 45/45, pinned type-check, zero-warning lint, format, max-lines, YAML, diff, privacy, markers, Next async params, locale-percent, AP8, E2E policy, lessons, documentation baseline, and ESLint-rule gates. The initial parallel lint collision with AP8's temporary fixture was environmental; the required sequential lint rerun passed.

### Completion Notes List

- Ultimate context engine analysis completed: ownership ambiguity, state taxonomy, evidence invariants, legacy-frame collision, exact manifest, read-only locks, validation, review, and cleanup lifecycle are resolved.

### Evidence Matrix

| Dimension | Result | Evidence |
|---|---|---|
| Prerequisites/lane | pass | Clean worktree at `1cfd3daa`; merged ancestry for Stories 166.1–166.6; pinned worktree-local dependencies. |
| Ownership/inventory | pass | Exact product chart surface; eight legacy-frame consumers and 39 Recharts imports inventoried read-only. |
| Pre-edit behavior lock | pass | 11 representative files / 388 tests passed. |
| ATDD RED/GREEN | pass | Genuine absent-implementation RED preceded production; post-pass-2 GREEN is 7/7 files and 45/45 tests. |
| Browser/accessibility | pass | Initial matrix: 320–1600 px, 200% reflow, light/dark, axe 0/23/0, clean console. Pass-1 recheck: markers 16x12 and links 44px. Pass-2 recheck: four role-buttons 44px, four Enter activations, localized accessible description, no raw enums, zero overflow/console issues. All harnesses removed. |
| Universal validation | pass | Final full Vitest 1124/1124 files and 18307/18307 tests; pinned type-check/lint/format/max-lines/build 70/70; YAML/diff/privacy/markers/Next/locale/AP8/E2E/lessons/docs-baseline/ESLint-rule gates passed. |
| Independent reviews | pass | Pass 1 accepted 4 High + 3 Medium; all repaired. Pass 2 accepted 3 Medium; all repaired test-first. Independent confirmation found zero unresolved Critical/High/Medium/Low defects. |
| Git/PR/merge/cleanup | pending | Commit, ready PR, merge, branch/worktree removal, prune, clean-main proof required. |

### File List

- `_bmad-output/implementation-artifacts/166-7-fe-deliver-chartframe-and-accessible-analytical-evidence.md` (Story contract; created)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Story 166.7 lifecycle row; updated)
- `_bmad-output/test-artifacts/atdd-checklist-166.7.md` (ATDD preflight, test-only RED strategy, and recording template; created)
- `src/components/product/charts/ChartEvidence.tsx` (created)
- `src/components/product/charts/ChartFrame.tsx` (created)
- `src/components/product/charts/ChartLegend.tsx` (created)
- `src/components/product/charts/ChartState.tsx` (created)
- `src/components/product/charts/ChartTooltipContent.tsx` (created)
- `src/components/product/charts/contracts.ts` (created)
- `src/components/product/charts/index.ts` (created)
- `src/components/product/charts/__tests__/ChartContracts.test.ts` (created)
- `src/components/product/charts/__tests__/ChartEvidence.test.tsx` (created)
- `src/components/product/charts/__tests__/ChartFrame.test.tsx` (created)
- `src/components/product/charts/__tests__/ChartLegend.test.tsx` (created)
- `src/components/product/charts/__tests__/ChartState.test.tsx` (created)
- `src/components/product/charts/__tests__/ChartTooltipContent.test.tsx` (created)
- `src/components/product/charts/__tests__/chart-composition-source-contracts.test.ts` (created)

### Change Log

| Date | Change |
|---|---|
| 2026-08-12 | Story created. Defined the route-free chart identity/state/evidence contract, exact product-owned and forbidden surfaces, legacy-frame consumer inventory, genuine ATDD lane, responsive/accessibility matrix, pinned validation, two-pass review, and exact Git cleanup lifecycle. Status: ready-for-dev. |
| 2026-08-12 | Implementation lifecycle started. Status changed to `in-progress`; ATDD preflight froze the exact component/type/source test manifest, genuine test-only RED command, accessibility and ownership assertions, and deferred GREEN browser-evidence matrix. |
| 2026-08-12 | Genuine RED recorded before production creation: 7/7 Story test files collected, exit `1`, expected absent-module/manifest failures only; GREEN implementation authorized. |
| 2026-08-13 | Story-owned GREEN reached: 7/7 files and 36/36 tests passed; type-check/max-lines passed; temporary browser harness verified 320–1600 px, 200% reflow, light/dark, keyboard/touch/no-hover evidence, zero overflow, clean console, and axe 0 violations, then was removed. |
| 2026-08-13 | Universal validation passed: 1124/1124 files and 18298/18298 tests, build 70/70, pinned static/privacy/repository gates, exact-scope audit, and read-only consumer locks. Pass 1 found 4 High + 3 Medium; all were repaired test-first, final Story GREEN became 41/41, and post-fix browser geometry/target evidence passed. |
| 2026-08-13 | Pass 2 found 3 Medium accessibility/localization/target findings. Six focused RED failures preceded localized role/marker descriptions and effective inline role-button sizing; Story GREEN became 45/45 and browser proof confirmed 44px keyboard targets, accessible Russian meaning, zero raw enums/overflow/console issues. Independent confirmation approved with zero unresolved findings. |
| 2026-08-13 | Two fresh review passes and confirmation are complete with zero unresolved findings. Final full Vitest passed 1124/1124 files and 18307/18307 tests; build generated 70/70 static pages; all universal local gates and exact-scope audit passed. Status: in-progress → review pending Git integration and cleanup. |

<!-- Lessons-line convention: the final Story-close row changing Status to `done` must include 1–3 Story-specific lessons for retrospective aggregation. -->

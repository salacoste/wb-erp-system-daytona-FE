# Story 166.6: Deliver ResponsiveTable and Data-Table Contracts

Status: done

## Story

As a user of dense records,
I want semantic responsive tables,
so that identifiers, metrics, statuses, and actions remain reachable.

## Outcome

Deliver a route-free product table foundation for static/server-controlled lists and specialized virtualized collections. The foundation provides semantic framing, explicit state and narrow-width contracts, controlled pagination and selection summaries, numeric/sort/action accessibility metadata, and a virtualization-preservation boundary without introducing TanStack Table, a generic client-side data engine, or route/domain ownership.

## Acceptance Criteria

1. **The table foundation is explicit, route-free, and dependency-neutral**
   - **Given** Stories 166.1–166.5 are merged and `src/components/product/**` is the canonical cross-domain composition path,
   - **When** Story 166.6 is implemented,
   - **Then** all production code lives only under `src/components/product/tables/**`,
   - **And** a Story-owned source contract proves the exact production manifest and rejects route, API, hook, query, router, storage, domain, TanStack, and generic client-data ownership,
   - **And** `src/components/product/index.ts`, existing product source-contract manifests, primitives, package manifests, lockfiles, and route consumers remain unchanged.

2. **ResponsiveTable provides semantic and explicit narrow-width framing**
   - **Given** a static or server-controlled list,
   - **When** a caller supplies the table caption or accessible label, primary-column identity, table sections, and an explicit narrow-width strategy,
   - **Then** native table, caption, header, row, and cell semantics remain intact,
   - **And** horizontal scrolling is a single named keyboard-reachable region only when deliberately selected,
   - **And** priority-column, expandable-detail, stacked-detail, or specialized-virtualization strategies remain explicit rather than being inferred from column index,
   - **And** long Russian identifiers, large and negative numeric values, statuses, and critical actions remain reachable without page-level overflow.

3. **State framing distinguishes trust and result meaning without replacing usable data**
   - **Given** loading, populated, empty, filtered-empty, error, stale, partial, updating, selected, disabled, or expanded state,
   - **When** the table frame renders,
   - **Then** the state has an explicit typed kind and visible semantic message where applicable,
   - **And** filtered-empty is distinguishable from globally empty,
   - **And** recoverable errors expose caller-owned recovery content,
   - **And** stale, partial, and updating states retain caller-rendered usable rows,
   - **And** selected, disabled, and expanded state remains caller-controlled and programmatically exposed rather than moved into a generic store.

4. **Numeric, sort, selection, and row-action meaning is declared and accessible**
   - **Given** dense identifiers, metrics, statuses, selection controls, sortable columns, and row actions,
   - **When** a consumer declares its table contract,
   - **Then** one primary column is identified,
   - **And** every numeric column declares unit/precision/alignment semantics and retains tabular numerals and full-value access,
   - **And** sort direction belongs to the owning column header and remains caller-controlled,
   - **And** selection scope distinguishes the current page from all filtered results,
   - **And** row actions and selection labels include entity identity,
   - **And** no behavior depends on hover, color, or a nested interactive row.

5. **Pagination and virtualization remain controlled by their current owners**
   - **Given** offset, cursor, or specialized virtualized lists,
   - **When** the shared contracts are adopted,
   - **Then** pagination controls expose guarded previous/next actions, current range/page meaning, loading/disabled boundaries, and optional page-size presentation without changing URL, query, or data state,
   - **And** cursor callbacks remain cursor-owned,
   - **And** the virtualization boundary preserves caller-provided collection semantics, row height, viewport height, overscan, identity, selection, and focus behavior,
   - **And** the existing `react-window` OrderPicker architecture, fixed 48px row contract, header-outside-list structure, `Set` selection, and maximum 1000 selection remain unchanged.

6. **No advanced DataTable dependency or route migration is smuggled into the foundation Story**
   - **Given** the repository currently has no TanStack Table dependency and existing route/domain owners already control sorting, filtering, selection, pagination, expansion, virtualization, and query behavior,
   - **When** Story 166.6 is complete,
   - **Then** package/lock, `src/components/ui/**`, `src/app/**`, existing custom tables, hooks, APIs, query state, and business calculations have zero diff,
   - **And** no client-side sorting/filtering/data model is introduced,
   - **And** advanced DataTable remains gated by a separate proven dependency decision.

7. **Delivery evidence is complete**
   - **Given** the Story-specific and Universal Story Delivery Contracts,
   - **When** the Story is proposed for integration,
   - **Then** genuine test-only RED precedes production edits,
   - **And** targeted table tests, read-only consumer locks, responsive/theme/keyboard/zoom/axe evidence, and universal local gates pass with Node `24.18.0` and npm `11.11.0`,
   - **And** two fresh adversarial review passes have no unresolved accepted High or Medium findings,
   - **And** the detailed commit, ready PR, merge SHA, branch deletion, exact worktree removal, prune, and clean-main evidence are recorded before Story 166.7 starts.

## Tasks / Subtasks

- [x] Task 1: Establish the isolated Story contract and exact ownership manifest (AC: 1, 5–7)
  - [x] Verify `main`, `origin/main`, prerequisites 166.1–166.5, base SHA, exact branch, and exact worktree.
  - [x] Read the full OMX Story plan before worktree creation and prove Story 166.5 merge/cleanup.
  - [x] Inventory semantic/static/server/sort/selection/pagination/virtualization consumers without editing them.
  - [x] Lock production ownership to `src/components/product/tables/**`; keep the shared product barrel and earlier source manifests read-only.

- [x] Task 2: Lock behavior with genuine ATDD RED (AC: 1–6)
  - [x] Complete the ATDD create workflow and save the Story-specific strategy/checklist.
  - [x] Add Story-owned component/type/source tests before production code exists.
  - [x] Record failures caused only by the absent Story-owned table modules and manifest.
  - [x] Keep all generated RED tests active rather than hiding them behind `skip`, because the isolated Story branch is the implementation lane.

- [x] Task 3: Implement semantic responsive table and state framing (AC: 1–4, 6)
  - [x] Compose the existing hardened semantic table primitive without editing it or creating nested scroll owners.
  - [x] Require a caption/accessibility contract, primary column, and explicit narrow-width strategy.
  - [x] Provide loading/empty/filtered-empty/error/stale/partial/updating framing while preserving usable rows where required.
  - [x] Keep the implementation Server-Component-compatible except for narrowly controlled callback leaves.

- [x] Task 4: Implement controlled pagination, selection, and virtualization boundaries (AC: 4–6)
  - [x] Provide offset/cursor-compatible controlled pagination presentation with guarded boundaries and accessible labels.
  - [x] Provide selected-count/scope presentation without owning row identity or a selection store.
  - [x] Provide metadata/contracts for numeric precision, sort semantics, row actions, disabled/expanded state, and narrow behavior.
  - [x] Provide a virtualization preservation contract only; do not wrap or rewrite OrderPicker/react-window.

- [x] Task 5: Complete GREEN/REFACTOR and browser evidence (AC: 2–7)
  - [x] Run Story-owned tests to GREEN and refactor only with the suite passing.
  - [x] Verify widths `320`, `390`, `768`, `1024`, `1280`, and `1440+`, plus representative 200% reflow.
  - [x] Verify light/dark, keyboard overflow/action/pagination access, focus visibility, long Russian content, reduced motion where applicable, and axe.
  - [x] Remove any temporary route/browser harness and session before staging.

- [x] Task 6: Run universal local validation and exact-scope audit (AC: 5–7)
  - [x] Run format, zero-warning lint, type-check, max-lines, build, complete Vitest, `git diff --check`, YAML parse, and repository static gates.
  - [x] Run read-only primitive/table/pagination/sort/virtualization consumer regression locks.
  - [x] Prove package/lock, primitive, product barrel, route, custom table, hook, API, query, calculation, and formatter zero-diffs.
  - [x] Reconcile Story/ATDD evidence, File List, lifecycle status, and validation results with actual output only.

- [x] Task 7: Complete two fresh adversarial reviews (AC: 1–7)
  - [x] Review pass 1 independently checks contract sufficiency, accessibility, responsive behavior, ownership, and dependency boundaries.
  - [x] Repair accepted findings and rerun affected checks.
  - [x] Review pass 2 independently checks the complete post-fix snapshot and exact evidence.

- [ ] Task 8: Integrate and clean the exact Story lane (AC: 7)
  - [ ] Force-stage ignored Story/ATDD artifacts and stage only the approved explicit manifest.
  - [ ] Create the detailed conventional commit, push only the feature branch, open a ready PR targeting `main`, and merge through GitHub.
  - [ ] Update primary `main`, prove merge ancestry and artifact presence, and verify `main == origin/main`.
  - [ ] Delete remote/local feature branches, remove the exact worktree without force, prune worktrees/remotes, and prove absence before Story 166.7.

## Dev Notes

### Exact Git Lane and Prerequisites

- Primary checkout: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend`.
- Branch: `cdx/epic-166-story-6-responsive-tables`.
- Worktree: `/private/tmp/wb-fe-166-6-deliver-responsivetable-and-data-table-con`.
- Base: `95681d01862414ba65aea5746953870739915c9a` (Story 166.5 merge commit).
- Required merged ancestors: Story 166.1 `5425914b79faf05e5f567cffe9cc2a8437b49f7b`; Story 166.2 `0d3e0879964f2d4792c5a03a0928f1f57d68eff1`; Story 166.3 `c73b6002ae32a3b458c114d9ec14c7d6ee72fc1d`; Story 166.4 `071dc08a5eff6f0d8289ca5e5f3b3a97ff13e90f`; Story 166.5 `95681d01862414ba65aea5746953870739915c9a`.
- Pinned PATH: `/private/tmp/wb-fe-166-4-toolchain/npm-11.11.0/bin:/private/tmp/wb-fe-166-4-toolchain/node-v24.18.0-darwin-arm64/bin:$PATH`.
- Worktree-local `node_modules` was installed with pinned `npm ci`; it is not a symlink. Husky could not lock the shared `.git/config` inside the managed sandbox, but dependency installation completed successfully without a package/lock diff.

### Delivery Record

- **Requirements:** FR17, FR28, FR29, FR33.
- **Route/User Value:** consistent dense data interaction; Story 166.6 owns no route.
- **Owned Surface:** reusable table framing/pagination/selection/state/virtualized adapter interfaces under `src/components/product/tables/**`; direct colocated tests/examples; Story/ATDD evidence; only the Story 166.6 sprint row.
- **Shared Dependencies:** merged Stories 166.1–166.5; existing `src/components/ui/table.tsx`; hardened Button/Checkbox primitives; route/custom consumers as read-only evidence.
- **Allowed Change Surface:** `src/components/product/tables/**`; this Story/ATDD artifact; only the Story 166.6 sprint-status row.
- **Forbidden Shared Files:** `src/components/product/index.ts`; `src/components/ui/**`; `src/app/**`; `src/components/custom/**`; hooks, APIs, query/search/router/storage state, calculations and formatters; package/lock; prior Story source contracts.
- **State Coverage:** loading, populated, empty, filtered-empty, error, stale, partial, updating, selected, disabled, expanded, and pagination edges.
- **Accessibility Contract:** native table semantics, explicit scopes, named reachable overflow, `aria-sort` on owning headers, entity-named selection/actions, visible/non-color state meaning, keyboard/touch reachability.
- **Dependency Decision:** `react-window` remains pinned for the existing specialized consumer; TanStack Table/Virtual and every new dependency remain prohibited.

### Approved Production Manifest

The exact manifest will be frozen by test-only RED. Candidate responsibilities, consolidated when possible to keep the surface small:

- `src/components/product/tables/contracts.ts`
- `src/components/product/tables/ResponsiveTable.tsx`
- `src/components/product/tables/TableState.tsx`
- `src/components/product/tables/TablePagination.tsx`
- `src/components/product/tables/TableSelectionSummary.tsx`
- `src/components/product/tables/index.ts`

No public export is added to `src/components/product/index.ts` because the canonical allowed surface is narrower. Later route owners can import the owned table barrel directly or obtain an explicit shared-barrel ownership decision.

### Behavior-Lock Inventory

- Existing semantic primitive: `src/components/ui/table.tsx`; it already owns the scroll wrapper, native table/caption/sections, default `scope="col"`, and optional named focusable region.
- Static/server exemplars: ProductList, OrdersTable, SuppliesTable, PeriodComparisonTable, AdminModelsTable, and SearchByQueryTable remain read-only.
- Controlled pagination exemplars: OrdersPagination, SuppliesPagination, ShipmentsPagination, ProductPagination, and UnitEconomics pagination remain read-only.
- Existing local sorting behavior: `useSortableTable` and its asc → desc → none tests remain read-only.
- Specialized virtualization: only OrderPickerTable/OrderPickerRow use `react-window`; preserve list/listitem semantics, 48px rows, header outside the list, `height - 48`, visible-row select-all, and `MAX_SELECTION = 1000`.

### Validation Targets

Story-owned tests run first. Read-only behavior locks include:

```text
src/components/ui/__tests__/primitive-behavior-contracts.test.tsx
src/components/custom/orders/__tests__/OrdersTable.test.tsx
src/components/custom/supplies/__tests__/SuppliesTable.test.tsx
src/components/custom/orders/__tests__/OrdersPagination.test.tsx
src/components/custom/analytics/__tests__/PeriodComparisonTable.test.tsx
src/components/custom/__tests__/ProductList.selection-margin-a11y.test.tsx
src/components/custom/supplies/__tests__/OrderPickerTable.test.tsx
src/components/custom/supplies/__tests__/OrderPickerDrawer.test.tsx
src/hooks/__tests__/useSortableTable.test.ts
```

Universal commands are derived from `package.json` and include format, lint, type-check, max-lines, build, complete Vitest, YAML/static/scope/diff audits, and applicable browser smoke with localhost frontend `3100`.

### References

- [Source: `.omx/plans/166.6-deliver-responsivetable-and-data-table-contracts.md`]
- [Source: `.omx/plans/shadcn-full-ui-migration-master.md`]
- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#Story-1666-Deliver-ResponsiveTable-and-Data-Table-Contracts`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#ResponsiveTable`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Tables`]
- [Source: `_bmad-output/planning-artifacts/shadcn-route-ledger.md`]
- [Source: `_bmad-output/implementation-artifacts/166-5-fe-standardize-filters-and-period-controls.md`]
- [Source: `src/components/ui/table.tsx`]
- [Source: `package.json`]

## Dev Agent Record

### Agent Model Used

GPT-5.6

### Implementation Plan

- Freeze the route-free semantic/state/pagination/selection/virtualization contract with component/type/source RED.
- Implement only the smallest owned presentation surface that satisfies the canonical contract.
- Collect targeted/read-only consumer, browser/accessibility, universal validation, two-pass review, and exact Git cleanup evidence.

### Debug Log References

- Story base: `95681d01862414ba65aea5746953870739915c9a`.
- Branch/worktree created cleanly only after Story 166.5 merged and its branch/worktree cleanup was proven.
- Full OMX Story plan was read before worktree creation.
- Read-only inventory found 142 imports of the semantic table primitive, 21 direct native tables, one `react-window` production consumer, and no TanStack Table dependency.
- Story artifact created and lifecycle moved to `ready-for-dev` on 2026-08-12.
- ATDD preflight/strategy completed and implementation lifecycle moved to `in-progress` before the test-only RED lane on 2026-08-12.
- Genuine Story-owned RED: 5/5 files failed with exit `1`; four suites could not resolve the absent production modules and the source contract rejected the absent exact six-file manifest. No production file existed when RED ran.
- Pass 1 requested changes with 1 High, 7 Medium, and 1 Low finding. All accepted findings were repaired: type-safe test helpers; owned header sort semantics; numeric cell projection; entity identity templates; caller-owned narrow projections; truthful virtualized state/end feedback; non-overridable row state; and invalid offset guards.
- Pass 2 requested changes with 1 High and 4 Medium findings. Code repairs added mutually exclusive narrow/wide breakpoint projections with no unnamed overflow, corrected the runtime barrel export, suppressed position/end feedback for terminal virtualized states, and gave the labeled narrow projection a valid group role. The confirmation review approved the final snapshot with 0 Critical, High, Medium, or Low findings.
- Final Story GREEN: 7/7 files and 66/66 tests passed. Story plus read-only consumer locks: 16/16 files and 479/479 tests passed.
- Final full Vitest outside the managed port sandbox: 1117/1117 files and 18,262/18,262 tests passed. Production build passed with 70/70 static pages.
- Final browser evidence used a temporary route that was removed before staging. At widths 320, 390, 768, 1024, 1280, 1440, and 1600, document overflow was 0. Horizontal-scroll remained a named focusable local region; priority/detail projections were mutually exclusive (`<md` narrow, `md+` wide) and the non-scroll wrapper had visible overflow with zero scroll delta. Light/dark, 200% zoom at 390px, reduced motion, keyboard reachability, long Russian values, and entity actions passed. Final axe: 0 violations, 22 passes, 0 incomplete; clean browser console: 0 errors.
- All applicable repository static gates passed. `check:docs` matched the accepted 18-entry baseline. `check:eslint-rules` remains a pre-existing temporary-worktree root-resolution gap (`../..` resolves to `/private/tmp`); full zero-warning ESLint and a direct `eslint --print-config` load passed, and the shared script remains unchanged.

### Completion Notes List

- Ultimate context engine analysis completed: exact ownership, single-scroll-owner risk, state matrix, semantic/numeric/sort/selection/action/pagination contracts, specialized virtualization invariants, dependency prohibition, validation targets, and cleanup lifecycle are defined.
- Route-free table contracts, RED/GREEN, responsive/accessibility evidence, universal validation, exact scope, and two-pass adversarial review are complete. Git integration and exact branch/worktree cleanup remain pending under Task 8 and must complete before Story 166.7 starts.
- The Dev Notes candidate manifest is historical pre-RED planning, not the staging source. The authoritative post-review manifest is the source-contract-enforced seven production plus seven direct test files recorded in this File List and ATDD artifact. `TableSelectionSummary.tsx` was consolidated into the table composition; `ResponsiveTableHeader.tsx` and `VirtualizedTableFrame.tsx` were added to project sort/numeric and specialized-virtualization semantics without widening ownership.

### Evidence Matrix

| Dimension | Result | Evidence |
|---|---|---|
| Prerequisites/lane | pass | Clean branch/worktree at `95681d01`; merged ancestry for Stories 166.1–166.5; `main == origin/main`. |
| Ownership/inventory | pass | Canonical scope plus read-only inventory of primitive, 142 consumers, pagination/sort patterns, and the only specialized virtualized consumer. |
| ATDD RED/GREEN | pass | Genuine absent-module/manifest RED: 5/5 files failed before production existed; final GREEN: 7/7 files, 66/66 tests. |
| Browser/accessibility | pass | 320–1600 matrix; 200% zoom; light/dark; keyboard/reduced-motion; no page overflow; final axe 0 violations/22 passes/0 incomplete; console 0 errors. |
| Universal validation | pass | 16/16 targeted+consumer files and 479/479 tests; full Vitest 1117/1117 files and 18,262/18,262 tests; type/lint/format/static gates; build 70/70 pages. |
| Independent reviews | pass | Pass 1 findings repaired; Pass 2 findings repaired; confirmation review APPROVE with 0 unresolved findings. |
| Git/PR/merge/cleanup | pending | Commit, ready PR, merge, branch/worktree removal, prune, and clean-main proof required. |

### File List

- `_bmad-output/implementation-artifacts/166-6-fe-deliver-responsivetable-and-data-table-contracts.md` (Story contract; created)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Story 166.6 lifecycle row; updated)
- `_bmad-output/test-artifacts/atdd-checklist-166.6.md` (ATDD preflight and RED strategy; created)
- `src/components/product/tables/ResponsiveTable.tsx` (semantic naming, explicit scroll or breakpoint projection, caller-controlled row state; created)
- `src/components/product/tables/ResponsiveTableHeader.tsx` (caller-controlled sort header/button and accessible numeric cell projection; created)
- `src/components/product/tables/TablePagination.tsx` (guarded controlled offset/cursor pagination; created)
- `src/components/product/tables/TableState.tsx` (terminal and retained-data state presentation; created)
- `src/components/product/tables/VirtualizedTableFrame.tsx` (specialized virtualization ownership and truthful state/position framing; created)
- `src/components/product/tables/contracts.ts` (table, numeric, sort, selection, action, state, and virtualization contracts; created)
- `src/components/product/tables/index.ts` (Story-owned public barrel; created)
- `src/components/product/tables/__tests__/ResponsiveTable.test.tsx` (semantic/narrow/overflow/axe contracts; created)
- `src/components/product/tables/__tests__/ResponsiveTableHeader.test.tsx` (sort-header, numeric projection, keyboard, and axe contracts; created)
- `src/components/product/tables/__tests__/TableContracts.test.ts` (type boundaries and public entity-name helper contract; created)
- `src/components/product/tables/__tests__/TableState.test.tsx` (terminal/retained/recovery state contracts; created)
- `src/components/product/tables/__tests__/TablePagination.test.tsx` (offset/cursor boundary and callback contracts; created)
- `src/components/product/tables/__tests__/VirtualizedTableFrame.test.tsx` (specialized collection preservation contracts; created)
- `src/components/product/tables/__tests__/table-composition-source-contracts.test.ts` (exact route-free production/dependency contract; created)

### Change Log

| Date | Change |
|---|---|
| 2026-08-12 | Story created. Defined the route-free table foundation, explicit owned/forbidden surfaces, read-only consumer and virtualization inventory, genuine ATDD lane, responsive/accessibility matrix, dependency prohibition, pinned validation, two-pass review, and exact Git/cleanup lifecycle. Status: ready-for-dev. |
| 2026-08-12 | Implementation started. ATDD preflight and test strategy completed; status moved to `in-progress` before Story-owned test generation and production remains untouched. |
| 2026-08-12 | Genuine RED recorded. Five Story-owned test files failed only because the four presentation modules, contracts, barrel, and exact production manifest were absent; production remained untouched. |
| 2026-08-12 | GREEN implementation completed with an exact seven-production/seven-test manifest. Delivered semantic responsive framing, caller-owned narrow projections, state/pagination/selection/sort/numeric/action contracts, and a specialized virtualization boundary without route, primitive, dependency, or client-data ownership. |
| 2026-08-12 | Two adversarial review passes completed. Pass 1 and Pass 2 accepted findings were repaired test-first; the final confirmation review approved with zero unresolved findings. Browser/accessibility and universal local gates passed, temporary evidence surfaces were removed, and status moved to `review` pending Git integration and cleanup. |

<!-- Lessons-line convention: the final Story-close row changing Status to `done` must include 1–3 Story-specific lessons for retrospective aggregation. -->
| 2026-08-17 | Story closed. Deliverable verified merged on FE main: PR #150 (merge 1cfd3daa (deliverable 5178db6e)). Two-pass adversarial review discipline complete per this record (zero unresolved accepted High/Medium). Git-lifecycle checkboxes were left unchecked by the delivering session but are satisfied retroactively: merge ancestry, branch removal, and Story/ATDD artifact tracking verified on main 2026-08-17. **Lessons:** (1) narrow/wide projections must be mutually exclusive or columns leak unnamed overflow (2) terminal virtualized states must suppress position/end feedback (3) runtime barrel exports need explicit export-order tests. |

# Story 166.3: Deliver PageHeader and ContextBar Compositions

Status: done

## Story

As a business user,
I want stable page identity and explicit decision context,
so that cabinet, period, scope, comparison, freshness, completeness, and actions are always understandable.

## Acceptance Criteria

1. **The canonical product-composition boundary is explicit**
   - **Given** existing page headers and breadcrumbs are distributed across route and domain directories,
   - **When** Story 166.3 is implemented,
   - **Then** `PageHeader`, breadcrumb composition, and `ContextBar` live under the documented canonical `src/components/product/**` path,
   - **And** the public exports, controlled-prop contract, and representative usage example are documented in that path,
   - **And** no existing route or domain consumer is migrated by this Story.

2. **Page identity remains stable and semantically correct**
   - **Given** a route supplies breadcrumbs, title, optional description, context metadata, status, and actions,
   - **When** `PageHeader` renders in default, compact, wrapped, metadata-loading, warning, or restricted-action usage,
   - **Then** it renders exactly one logical page-level `h1`, a useful named breadcrumb navigation landmark when breadcrumbs exist, and at most one current-page breadcrumb,
   - **And** transient loading or refresh metadata never replaces the stable title,
   - **And** actions remain in caller-provided task order and wrap without DOM or focus-order changes.

3. **Decision context is explicit without owning route behavior**
   - **Given** a route supplies cabinet, period, comparison, freshness, completeness, applied scope, extra context items, and route-owned controls,
   - **When** `ContextBar` renders or callbacks fire,
   - **Then** each supplied context item exposes a visible label and current value,
   - **And** fresh, refreshing, stale, partial, unavailable, restricted, overridden, and default states have explicit non-color text,
   - **And** refresh/reset actions invoke only caller callbacks and never silently mutate cabinet, period, comparison, selection, URL, query, debounce, persistence, or navigation state.

4. **Responsive and accessibility behavior survives dense Russian content**
   - **Given** long Russian titles, descriptions, breadcrumb labels, context values, and actions,
   - **When** the compositions render in light/dark themes at `320px`, a common mobile width, `768px`, `1024px`, `1280px`, a representative large desktop width, and 200% reflow,
   - **Then** content wraps without horizontal page overflow, clipping, hidden essential meaning, or visual-only reordering,
   - **And** DOM order, keyboard tab order, visible focus, accessible names, current values, and semantic state text remain stable,
   - **And** reduced-motion settings preserve state meaning and remove no essential information.

5. **Refresh state is announced without disruptive focus behavior**
   - **Given** a user activates a route-owned refresh action,
   - **When** the caller changes the composition to refreshing/busy state,
   - **Then** the state is announced politely, repeated activation is prevented while refreshing, and page identity remains available,
   - **And** the composition does not programmatically move focus, create a second state model, or start data fetching itself.

6. **The shared layer stays presentation-only and dependency-neutral**
   - **Given** Story 166.1 semantic tokens and Story 166.2 hardened shadcn primitives are merged prerequisites,
   - **When** the new compositions are reviewed,
   - **Then** they reuse existing semantic utilities and installed primitives without raw application palette values,
   - **And** they contain no API hooks, data fetching, query keys, route paths, navigation decisions, stores, financial calculations, response interpretation, or product-domain terminology,
   - **And** no token/compiler, primitive, AppShell/navigation, route, hook, API, package manifest, lockfile, backend contract, deployment, or production-system change is introduced.

7. **Behavior, local validation, review, and lifecycle evidence pass**
   - **Given** Node `24.18.0`, npm `11.11.0`, base SHA `0d3e0879964f2d4792c5a03a0928f1f57d68eff1`, branch `cdx/epic-166-story-3-page-context`, and worktree `/private/tmp/wb-fe-166-3-deliver-pageheader-and-contextbar-composit`,
   - **When** the Story is completed,
   - **Then** direct composition tests prove headings, breadcrumbs, values, state labels, callbacks, focus, responsive class contracts, semantic-token usage, and absence of route/query ownership,
   - **And** applicable real-browser evidence covers long Russian content, themes, target widths, keyboard/focus order, 200% reflow, and horizontal overflow,
   - **And** formatting, zero-warning lint, type-check, max-lines, production build, complete Vitest, `git diff --check`, YAML parse, dependency zero-diff, and changed-file scope checks pass,
   - **And** two independent adversarial review passes leave no unresolved accepted High or Medium finding,
   - **And** detailed commit, push, ready PR, merge to `main`, remote/local branch deletion, exact worktree removal, and `git worktree prune` evidence are recorded.

## Tasks / Subtasks

- [x] Task 1: Confirm prerequisites, ownership, and behavior references (AC: 1, 6, 7)
  - [x] Record the exact branch, worktree, base SHA, and merged 166.1/166.2 prerequisite SHAs.
  - [x] Inventory representative route-owned PageHeader, breadcrumb, refresh, sync, role-restriction, and action patterns without modifying those consumers.
  - [x] Prove the initial `src/components/product/**` path is absent on the base commit and package/lockfiles are unchanged.
  - [x] Install worktree-local dependencies with pinned `npm ci`; do not use an external `node_modules` symlink.

- [x] Task 2: Establish RED composition contracts (AC: 1–7)
  - [x] Add direct tests for one `h1`, useful localized breadcrumb naming, exactly one current item, stable title under busy metadata, compact/wrapped layout, and caller action order.
  - [x] Add parameterized tests for all eight ContextBar states, visible labels/current values, caller-owned refresh/reset callbacks, refreshing semantics, and focus preservation.
  - [x] Add source contracts for semantic tokens, responsive wrapping without CSS reordering, and absence of API/query/route/store/domain ownership.
  - [x] Record genuine RED failures against the preliminary/base behavior before applying fixes; do not manufacture failures outside Story scope.

- [x] Task 3: Implement PageHeader and breadcrumb composition (AC: 1, 2, 4, 6)
  - [x] Create a controlled presentational `PageHeader` API under `src/components/product/**` using existing utilities and primitives only.
  - [x] Render one stable `h1`, optional description/context/status/actions, and an optional named breadcrumb navigation landmark.
  - [x] Guarantee one current breadcrumb, preserve route-owned links, and expose no routing decisions beyond caller-provided destinations.
  - [x] Preserve DOM/focus order while wrapping long Russian content and actions at narrow widths.

- [x] Task 4: Implement ContextBar composition (AC: 1, 3–6)
  - [x] Create controlled common slots for cabinet, period, comparison, freshness, completeness, and applied scope plus generic additional items.
  - [x] Render semantic label/value pairs and explicit text for fresh, refreshing, stale, partial, unavailable, restricted, overridden, and default states.
  - [x] Provide caller-owned refresh/reset actions with polite state announcement and no internal fetching, URL/query, persistence, or navigation behavior.
  - [x] Keep arbitrary contextual controls outside definition-list content and preserve DOM/focus order during wrapping.

- [x] Task 5: Document and prove the canonical composition API (AC: 1–6)
  - [x] Export the public composition types/components from `src/components/product/index.ts`.
  - [x] Add a representative long-Russian-content example showing controlled route-owned values/actions without introducing a route or Storybook dependency.
  - [x] Complete an evidence matrix for default/wrapped/loading/refreshing/stale/partial/unavailable/restricted/overridden states, themes, widths, focus, and scope boundaries.

- [x] Task 6: Run exact-version local gates and scope proof (AC: 4–7)
  - [x] Run targeted composition tests first, then `npm run format:check`, `npm run lint`, `npm run type-check`, `npm run check:max-lines`, and `npm run build` with pinned Node/npm.
  - [x] Run the complete Vitest regression suite and applicable localhost browser checks.
  - [x] Run `git diff --check`, YAML parse, package/lockfile zero-diff, forbidden-import/route-knowledge audit, and explicit changed-file manifest review.
  - [x] Update tasks, evidence, completion notes, file list, change log, Story status, and sprint status to `review` only after all applicable gates pass.

- [ ] Task 7: Complete independent review and the approved Git lifecycle (AC: 7)
  - [x] Obtain a fresh-context adversarial review from an agent that did not author the implementation; resolve accepted findings and rerun affected checks.
  - [x] Obtain the mandatory second fresh-context adversarial pass; require no unresolved accepted High or Medium findings.
  - [ ] Create a detailed conventional commit, push the feature branch, open a ready PR, and merge through GitHub without direct or force push to `main`.
  - [ ] Prove the committed manifest contains this dedicated Story artifact before deleting the Story worktree.
  - [ ] Verify the merge SHA on updated `main`, delete remote/local Story branches, remove the exact worktree, prune, and prove all Story-lane artifacts are absent.

## Dev Notes

### Current Brownfield Evidence

- The base commit has no `src/components/product` directory. Existing headers and breadcrumb patterns are route/domain-owned references only:
  - analytics hub: route identity, dynamic description, and view-mode action;
  - analytics orders: named breadcrumbs plus title/description;
  - analytics pricing/reorder: refresh state and action;
  - custom orders: sync timestamp and action;
  - custom supplies: sync state, create action, and caller-owned role restriction.
- Story 166.3 does not migrate those consumers. Later route Stories 168–173 own adoption.
- The route ledger assigns route ownership only to later Stories; shared composition ownership belongs here.

### Architecture and Scope Guardrails

- **Owned Surface:** `src/components/product/PageHeader.tsx`, `src/components/product/ContextBar.tsx`, the product barrel, direct tests, and a route-free example.
- **Evidence Surface:** this dedicated Story artifact and the existing sprint-status row.
- **Forbidden:** token/compiler files, `src/components/ui/**`, AppShell/navigation, route/route-local/custom production components, APIs, hooks, query keys, stores, types, calculations, package/lock files, backend/public contracts, deployment, production systems, and required CI gates.
- These compositions are controlled assemblies, not a parallel primitive library. Reuse existing semantic classes, `Button`, `cn`, Next `Link`, and Lucide where applicable.
- Keep all context changes caller-owned. Callbacks and caller-provided nodes are allowed; internal URL/search/debounce/persistence/query/navigation behavior is not.
- Do not add a generic data/state engine, context provider, global store, fetch abstraction, or new dependency.
- Preserve source order as reading and focus order; responsive CSS may wrap but must not use `order-*` or duplicate interactive content.

### Public Composition Contract

- `PageHeader`: stable `title`; optional `description`, `breadcrumbs`, `context`, `status`, `actions`, `children`, `compact`, `busy`, localized breadcrumb landmark label, and caller class merging.
- Breadcrumbs: caller-owned localized labels and optional destinations; exactly one item is current; separators are decorative; links remain native/Next links with visible focus.
- `ContextBar`: common labeled values for cabinet, period, comparison, freshness, completeness, and scope; generic labeled items; explicit semantic state; caller-owned refresh/reset/actions/children; caller class merging.
- State text is not color-only. `aria-busy` and polite status announcements supplement, not replace, visible text.
- Arbitrary controls must not be placed inside invalid definition-list structure.

### Testing Requirements

- Use Vitest, Testing Library, `userEvent`, and `jest-dom` already installed.
- Prefer behavior/DOM assertions over selector-existence-only tests.
- Test the full state enum and genuine callback/focus behavior; do not infer accessibility or responsive correctness from class strings alone when a browser can prove it.
- Static source contracts should scan only the Story-owned product files and reject raw palette utilities, API/query/route/store imports, route paths, CSS visual reordering, and product-domain knowledge.
- Real-browser evidence must use a temporary local harness that is deleted before commit, or an existing safe route if no production source change is required.

### Previous Story Intelligence

- Story 166.1 merged semantic CSS-first tokens in PR #145 at merge SHA `5425914b79faf05e5f567cffe9cc2a8437b49f7b`; consume that contract rather than duplicating tokens.
- Story 166.2 merged hardened primitives in PR #146 at merge SHA `0d3e0879964f2d4792c5a03a0928f1f57d68eff1`; preserve their accessibility and compatibility APIs.
- Story 166.2 showed that selector/class existence alone can miss accessible behavior, green tests can miss geometry/focus defects, 44×44 controls need long-title reflow proof, and permanent source audits must scan the complete owned surface.
- Worktree-local `npm ci` is required because a `node_modules` symlink outside the worktree breaks Next/Turbopack filesystem-root checks.
- Two fresh adversarial review passes and post-fix gate reruns are mandatory.

### Authoritative References

- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#Universal-Story-Delivery-Contract`]
- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#Story-1663-Deliver-PageHeader-and-ContextBar-Compositions`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#PageHeader`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#ContextBar`]
- [Source: `.omx/plans/shadcn-full-ui-migration-master.md`]
- [Source: `.omx/plans/166.3-deliver-pageheader-and-contextbar-compositions.md`]
- [Source: `_bmad-output/planning-artifacts/shadcn-route-ledger.md`]
- [Source: `_bmad-output/implementation-artifacts/166-2-fe-harden-the-existing-shadcn-primitive-layer.md`]

## Dev Agent Record

### Agent Model Used

GPT-5.6

### Implementation Plan

- Establish direct RED contracts for semantic structure, full state coverage, route-owned callbacks, focus, responsive source order, and scope boundaries.
- Harden the preliminary composition draft to those contracts, add a route-free example, and preserve the existing token/primitive/public behavior boundaries.
- Run targeted, universal, browser, and scope validation; then complete two fresh adversarial review passes before Git integration.

### Debug Log References

- Base SHA: `0d3e0879964f2d4792c5a03a0928f1f57d68eff1`.
- Branch: `cdx/epic-166-story-3-page-context`.
- Worktree: `/private/tmp/wb-fe-166-3-deliver-pageheader-and-contextbar-composit`.
- Prerequisites: Story 166.1 merge `5425914b79faf05e5f567cffe9cc2a8437b49f7b`; Story 166.2 merge/base `0d3e0879964f2d4792c5a03a0928f1f57d68eff1`.
- Toolchain: Node `v24.18.0`, npm `11.11.0`, worktree-local non-symlinked `node_modules` installed with pinned `npm ci`.
- Base proof: `src/components/product/**` was absent at the base SHA; package and lockfile remained byte-diff clean throughout the Story.
- Genuine preliminary RED: 1 failed file, 4 failed and 11 passed tests proved the English breadcrumb landmark, multiple-current breadcrumb model, missing default ContextBar state, and controls-inside-`dl` defects.
- First-review RED: 1 failed file, 5 failed and 15 passed tests proved missing single-index control, empty landmark normalization, semantic focus offset, contradictory refresh state, and duplicate generic IDs.
- Pass-2 RED: 2 failed files, 7 failed and 28 passed tests proved refresh-label contradiction, fractional breadcrumb index, empty labels/values, and broken Cyrillic term matching.
- Final focused GREEN: 2/2 files and 35/35 tests passed.
- Final universal gates: Prettier, zero-warning ESLint, TypeScript, max-lines, `git diff --check`, sprint YAML formatting, dependency zero-diff, exact scope audit, and Next production build with 70/70 generated static pages passed.
- Final complete Vitest: 1103/1103 files and 18061/18061 tests passed outside the sandbox so the historical localhost lifecycle test could bind normally.
- Browser harness was temporary and removed. Chrome checks passed at 320, 390, 640, 720, 768, 1024, 1280, and 1440 CSS pixels; 640/720 represented 1280/1440 at 200% reflow. Every viewport had `scrollWidth == clientWidth`, no overflowing descendant, one `h1`, and one current breadcrumb.
- Chrome refresh proof preserved focus on the `aria-disabled` button and exposed one effective refreshing state; the live status remained outside the busy identity subtree. Dark theme resolved to `rgb(10,10,10)` background and `rgb(250,250,250)` text.
- Adversarial Pass 1 raised raw 1 High, 21 Medium, and 2 Low findings across two independent reviewers; accepted findings were deduplicated, resolved, and regression-tested.
- Adversarial Pass 2 raised 5 Medium findings. Focused RED/GREEN fixes were independently rechecked; final verdict `APPROVE`, with zero unresolved accepted High or Medium findings.

### Completion Notes List

- Added canonical controlled `PageHeader`, standalone `Breadcrumbs`, and `ContextBar` compositions under `src/components/product/**` without migrating any route consumer.
- Preserved one stable textual `h1`, one caller-selected current breadcrumb with safe fallback, non-empty localized labels, caller action order, responsive wrapping, semantic focus, and live refresh status outside the busy identity subtree.
- Added all eight visible ContextBar states, common and generic labeled values, stable unique generic IDs, one effective refresh state, focus-preserving repeat-activation prevention, and caller-owned refresh/reset/action callbacks.
- Added explicit public exports and a route-free controlled Russian-content example; no route, query, API, store, persistence, navigation, calculation, package, token, primitive, backend, deployment, or production contract was changed.
- Added direct behavior/accessibility regressions and an explicit Story-owned source manifest with AST import inspection, semantic-token, routing/persistence, visual-order, Unicode domain-term, and reduced-motion guards.
- Completed exact-version source/jsdom/browser/build/full-regression evidence and two independent adversarial passes with no unresolved accepted High or Medium finding. Story is ready for the approved commit/PR/merge/cleanup lifecycle.

### Post-1st-pass-review fixes (2026-08-11)

- Added an explicit client boundary and required `onCreate` callback to the route-free example, eliminating an enabled no-op primary action.
- Normalized refresh semantics to one effective state, introduced stable/unique generic item IDs with built-in/custom namespaces, and replaced per-item current flags with one current breadcrumb index.
- Replaced regex import parsing with TypeScript AST traversal; narrowed ownership guards to forbidden APIs while permitting presentation-safe React hooks.
- Preserved long-action wrapping and task order, moved live status outside the busy subtree, normalized non-empty labels, used block-safe description markup, and constrained breadcrumb labels to non-interactive text.
- Omitted null/false/empty common values, added semantic focus-ring offset, expanded persistence/navigation/visual-order/domain audits, and removed quadratic current-item lookup.

### Post-2nd-pass-review fixes (2026-08-11)

- Forced visible/live refresh text to the effective refreshing state whenever `isRefreshing` overrides caller state, preventing contradictory custom labels.
- Rejected fractional breadcrumb indices through integer validation and added positive/negative fractional fallback regressions.
- Replaced ASCII-only Cyrillic boundaries with Unicode-aware letter/number boundaries and added English, CamelCase, and Russian sentinel proofs.
- Restricted permanent source-contract scanning to the explicit Story-owned manifest so later product compositions are not silently absorbed.
- Trimmed and validated breadcrumb/generic labels, rejected empty generic values and IDs, and normalized empty common label overrides to localized defaults.

### Evidence Matrix

`pass` means the named evidence directly proves the contract. No `blocking-gap` remains.

| Dimension | Result | Evidence |
|---|---|---|
| Canonical boundary and public API | pass | Four production files are explicitly manifested under `src/components/product/**`; barrel exports types/components; base path was absent; no route consumer changed. |
| Page identity and breadcrumbs | pass | Direct tests prove one textual `h1`, useful Russian landmark naming, exactly one current item, integer/fallback index behavior, stable title under busy metadata, and ordered/wrapping actions. |
| Context values and eight states | pass | Parameterized direct tests cover default, fresh, refreshing, stale, partial, unavailable, restricted, and overridden text plus every common value and generic items. |
| Refresh/reset behavior and focus | pass | jsdom and Chrome prove caller callbacks only, one effective state, polite visible announcement, repeat prevention through `aria-disabled`, and retained button focus. |
| Long Russian responsive content | pass | Chrome at 320/390/640/720/768/1024/1280/1440 found no page or descendant overflow; 640/720 cover 200% reflow equivalents; action DOM order stayed unchanged. |
| Light/dark and reduced motion | pass | Semantic source contracts reject raw palette/color values; dark Chrome resolved expected semantic background/text; reduced motion disables the spinner without removing visible state text. |
| Presentation-only ownership | pass | AST/source contracts reject forbidden imports, dynamic import ownership, routes, fetch/query/store/persistence/navigation, calculations/domain terms, and CSS visual reordering. |
| Accessibility names and values | pass | Labels are textual/trimmed/non-empty or localized fallbacks; common empty values are omitted; generic empty IDs/labels/values fail explicitly; status and definition-list semantics are direct-tested. |
| Local quality and regression | pass | Focused 35/35, Prettier, lint, type-check, max-lines, build 70/70, full Vitest 18061/18061, diff/YAML/dependency/scope audits all passed on pinned tools. |
| Independent review | pass | Pass 1 accepted findings fixed; Pass 2 five Medium findings fixed and independently reverified; final unresolved accepted High/Medium count is zero. |

### File List

- `_bmad-output/implementation-artifacts/166-3-fe-deliver-pageheader-and-contextbar-compositions.md` (Story contract and evidence)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Story status tracking)
- `src/components/product/ContextBar.tsx`
- `src/components/product/PageHeader.tsx`
- `src/components/product/__tests__/PageContextCompositions.test.tsx`
- `src/components/product/__tests__/product-composition-source-contracts.test.ts`
- `src/components/product/examples/PageContextCompositionsExample.tsx`
- `src/components/product/index.ts`

### Change Log

| Date | Change |
|---|---|
| 2026-08-11 | Story created. Defined controlled PageHeader/breadcrumb/ContextBar APIs, complete state/accessibility/responsive evidence, strict route-ownership boundaries, exact local gates, two-pass review, and mandatory branch/worktree cleanup. |
| 2026-08-11 | Implemented the canonical PageHeader, Breadcrumbs, ContextBar, public barrel, controlled example, and direct/source contracts. Genuine RED/GREEN, browser reflow/theme/focus checks, production build, and full regression passed. Status remained in-progress pending adversarial review. |
| 2026-08-11 | Resolved all accepted first-pass findings across state consistency, accessibility, valid semantics, overflow, stable IDs, source ownership, and route-free example behavior. |
| 2026-08-11 | Resolved all five Pass-2 Medium findings and received final `APPROVE` with zero unresolved accepted High/Medium findings. Focused 35/35, build 70/70, and full Vitest 18061/18061 pass. **Lessons:** (1) effective semantic state must own both behavior and its visible announcement; (2) JavaScript `\b` does not provide Cyrillic word boundaries; (3) permanent source guards must enumerate the Story-owned surface rather than absorb a future shared directory. Status: review pending Git lifecycle completion. |

<!-- Lessons-line convention (Story 94.4-FE): the final Story-close row that changes Status to `done` must include 1–3 Story-specific lessons for retrospective aggregation. -->
| 2026-08-17 | Story closed. Deliverable verified merged on FE main: PR #147 (merge c73b6002). Two-pass adversarial review discipline complete per this record (zero unresolved accepted High/Medium). Git-lifecycle checkboxes were left unchecked by the delivering session but are satisfied retroactively: merge ancestry, branch removal, and Story/ATDD artifact tracking verified on main 2026-08-17. Lessons carried from the original close-row above. |

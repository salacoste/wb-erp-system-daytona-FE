# Story 166.2: Harden the Existing Shadcn Primitive Layer

Status: done

## Story

As a keyboard, touch, or assistive-technology user,
I want generic controls and overlays to behave predictably,
so that later routes inherit reliable interaction behavior.

## Acceptance Criteria

1. **Primitive inventory and scope stay explicit**
   - **Given** the 28 installed files under `src/components/ui`,
   - **When** the primitive layer is audited and the final Story diff is reviewed,
   - **Then** every existing primitive is classified as changed, verified-no-change, or explicitly deferred with a reason,
   - **And** changes are limited to `src/components/ui/**`, direct primitive tests, Story/sprint evidence, and narrowly necessary assertions in the four named affected consumer-test files caused by the shared localized close-control contract,
   - **And** no token, production product/domain component, AppShell, route, API, hook, store, type, package manifest, lockfile, backend contract, deployment file, or production system changes.

2. **Generic surfaces consume the merged semantic token contract**
   - **Given** Dialog, AlertDialog, Sheet, Popover, DropdownMenu, Select, Tooltip, Alert, and Slider currently contain hardcoded white, gray, yellow, slate, or inline color declarations,
   - **When** their presentation is hardened,
   - **Then** unjustified application surfaces, text, borders, selection, warning, track, thumb, and elevated-content colors use Story 166.1 semantic token utilities,
   - **And** light and dark theme behavior is derived from the same semantic role contract,
   - **And** public primitive props, exports, variant names, composition hooks, portals, and domain-agnostic behavior remain compatible.

3. **Overlay interaction and focus lifecycle remain Radix-native**
   - **Given** Dialog, AlertDialog, Sheet, Popover, DropdownMenu, Select, and Tooltip are Radix-based overlays,
   - **When** they open, receive keyboard input, and close,
   - **Then** their accessible names/roles, keyboard navigation, Escape behavior, modal containment where applicable, initial focus, close behavior, focus return, portal rendering, and disabled behavior continue to be owned by native/Radix semantics,
   - **And** custom styling does not add nested focus traps, synthetic keyboard behavior, or a second overlay state model,
   - **And** built-in Dialog and Sheet close controls render as native keyboard-operable buttons with one Russian accessible name, `Закрыть`, rather than a focusable `span` or duplicated accessible text.

4. **Focus, invalid, disabled, selected, pressed, and open states are visible and semantic**
   - **Given** Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, Command, Tabs, and overlay close controls,
   - **When** users navigate or operate them with keyboard, pointer, or assistive technology,
   - **Then** focus-visible is not suppressed and uses the semantic ring contract,
   - **And** disabled and invalid states remain programmatically exposed through native/Radix attributes and visibly distinct,
   - **And** hover, pressed, open, selected, destructive, and loading states do not rely on a hardcoded light-only palette,
   - **And** the existing global `prefers-reduced-motion` override continues to disable non-essential primitive animation without removing state meaning.

5. **Touch-target hardening is deliberate and regression-safe**
   - **Given** compact primitive visuals and dense existing consumers,
   - **When** mobile interaction targets are audited,
   - **Then** proven primary/icon-only mobile actions provide at least a measured 44×44 interaction target or a browser-proven equivalent reachable hit area,
   - **And** compact Checkbox, RadioGroup, Switch, Slider, Table, and dense-form usage is not globally inflated without consumer evidence,
   - **And** route-specific target debt that cannot be repaired generically without broad layout regression is recorded with exact consumers for its route/AppShell owner,
   - **And** controls do not require hover to expose essential behavior or gain a speculative touch-only variant.

6. **Existing compatibility APIs and semantic Table behavior are preserved**
   - **Given** existing consumers use Tooltip `size`, Select `usePortal`, Alert `warning`, Sheet `side="top" | "right" | "bottom" | "left"` and `size="default" | "wide"`, Table `scrollContainerAriaLabel`/`scrollContainerTabIndex`, and Button `asChild`,
   - **When** primitives are hardened,
   - **Then** those public APIs and their observable behavior remain compatible,
   - **And** Table continues to render semantic table elements with only bounded overflow framing,
   - **And** Table wrapper-only props never leak onto `<table>`; an explicitly named focusable scroll wrapper exposes a consistent region contract while an unnamed wrapper creates no extra landmark,
   - **And** no domain model, client-side data engine, universal responsive table abstraction, Drawer, advanced DataTable, or TanStack dependency is added.

7. **No speculative primitive or dependency is introduced**
   - **Given** the source consumer inventory resolves every current `@/components/ui/*` import to an installed primitive,
   - **When** missing-component needs are evaluated,
   - **Then** no new primitive is added without a proven current consumer,
   - **And** Drawer, advanced DataTable, force-regenerated shadcn files, `shadcn init --force`, and all new dependencies remain forbidden.

8. **Behavior-lock, accessibility, and local completion evidence pass**
   - **Given** Node `24.18.0`, npm `11.11.0`, and the Story base SHA `5425914b79faf05e5f567cffe9cc2a8437b49f7b`,
   - **When** the Story is completed,
   - **Then** focused primitive tests prove semantic surfaces, public compatibility APIs, native control semantics, focus-visible, disabled/invalid/open/selected states, portals, and reduced-motion inheritance,
   - **And** a completed evidence matrix records pass, not-applicable, or blocking-gap for both themes, keyboard operation, Escape, focus containment/return, portal placement, visible focus, reduced motion, and applicable measured 44×44 targets,
   - **And** core Dialog/Sheet/Select focus lifecycle, native Sheet close behavior, and touch geometry are not marked complete solely from class-string assertions,
   - **And** affected consumer regressions, formatting, lint, type-check, max-lines, production build, full Vitest, `git diff --check`, dependency zero-diff, and changed-file scope checks pass,
   - **And** two independent adversarial review passes have no unresolved accepted High or Medium findings,
   - **And** the detailed commit, push, ready PR, merge to `main`, remote/local branch deletion, temporary-worktree removal, and `git worktree prune` lifecycle is recorded and verified.

## Tasks / Subtasks

- [x] Task 1: Record the baseline and lock the Story boundary (AC: 1, 6, 7, 8)
  - [x] Confirm branch `cdx/epic-166-story-2-primitives`, worktree `/private/tmp/wb-fe-166-2-harden-the-existing-shadcn-primitive-layer`, base SHA `5425914b79faf05e5f567cffe9cc2a8437b49f7b`, and merged Story 166.1 prerequisite.
  - [x] Record all 28 primitive files and representative consumer counts; classify every primitive as change, verified-no-change, or deferred with evidence.
  - [x] Prove package/lockfile zero diff and absence of unresolved `@/components/ui/*` imports before implementation.
  - [x] Install worktree-local dependencies with pinned `npm ci`; do not symlink `node_modules` outside the worktree because Turbopack rejects that filesystem root.

- [x] Task 2: Add RED primitive contract tests before shared edits (AC: 2–8)
  - [x] Add direct tests under `src/components/ui/__tests__/` for semantic-surface class contracts and absence of unjustified inline/hardcoded palette declarations.
  - [x] Add rendering/interaction tests for Sheet close native-button semantics and Slider visible focus.
  - [x] Lock Tooltip `size`, Select `usePortal`, Alert `warning`, Sheet four sides plus `size="default" | "wide"`, Table named/unnamed scroll-region behavior, and Button `asChild` compatibility.
  - [x] Lock Select focus outcome after both Escape and selection for `usePortal=true` and consumer-backed `usePortal=false`; preserve caller-provided `onCloseAutoFocus` precedence.
  - [x] Lock Progress accessible value for zero and non-zero values so the visual transform cannot diverge from the Radix progressbar state.
  - [x] Cover default, hover/pressed class contracts, open/selected data states, focus-visible, disabled, invalid, destructive, loading, and reduced-motion inheritance where applicable.
  - [x] Record expected RED failures that correspond to real current defects; do not manufacture failures outside Story scope.

- [x] Task 3: Harden overlay and elevated-surface primitives (AC: 2, 3, 4, 6)
  - [x] Replace hardcoded light-only surfaces/text in Dialog, AlertDialog, Sheet, Popover, DropdownMenu, Select, and Tooltip with semantic utilities.
  - [x] Preserve Radix Portal, state data attributes, collision/positioning variables, Escape handling, containment, and focus return.
  - [x] Replace Sheet's synthetic close `span` with a direct native `SheetPrimitive.Close` button; preserve accessible label and icon-hidden semantics.
  - [x] Reconcile duplicated inline `zIndex: 9999` versus `z-50` only if regression evidence proves a safe single contract; otherwise document the compatibility exception.
  - [x] Preserve translucent black scrims as a documented neutral-overlay exception unless light/dark browser evidence proves an existing semantic token is safer; do not mechanically replace them with `foreground`.

- [x] Task 4: Harden generic control and semantic-state primitives (AC: 2, 4, 5, 6)
  - [x] Restore a visible semantic focus ring for Slider without changing value, range, orientation, or pointer/keyboard behavior.
  - [x] Replace Select item and Alert warning hardcoded palettes with semantic accent/status roles while preserving public variants.
  - [x] Forward Progress `value` to the Radix root while preserving the zero-safe indicator transform and indeterminate behavior.
  - [x] Audit Button, Input, Textarea, Checkbox, RadioGroup, Switch, Command, Tabs, and overlay close controls for consistent semantic focus/invalid/disabled state coverage; change only proven gaps.
  - [x] Audit 44×44 mobile interaction targets and apply only regression-safe target sizing or hit-area improvements; document dense-control exceptions.
  - [x] Preserve Calendar, Card, Badge, Separator, Skeleton, Sonner, Form, Label, Collapsible, and Table behavior unless a direct test proves a Story-owned defect.
  - [x] Remove domain-specific Story/COGS prose from generic Sheet comments while preserving the public `wide` variant and its exact width classes.

- [x] Task 5: Prove primitive behavior and consumers (AC: 2–8)
  - [x] Make the direct primitive suite green and run affected existing consumer tests for Dialog, Sheet, Select, Tooltip, Alert, Slider, Button, and Table.
  - [x] Verify native roles/names, keyboard operation, Escape close, modal focus containment/return, portal placement, disabled behavior, and selected/open state through Testing Library where jsdom can prove them.
  - [x] Verify light/dark semantic-token usage from source and rendered class contracts; do not claim visual contrast merely from class names.
  - [x] Confirm global reduced-motion CSS still applies and no primitive introduces an essential animation-only state.
  - [x] Complete a primitive evidence table separating source/token checks, jsdom-observable behavior, browser/manual focus and geometry, affected-consumer regressions, and explicit not-applicable states.
  - [x] Use representative existing consumers or a temporary uncommitted local-only harness to verify light/dark rendering, keyboard-only open/close/Escape/focus return, visible focus, portal placement, reduced motion, and applicable touch geometry; retain screenshots/checklist evidence where practical.
  - [x] Treat an unavailable core Dialog/Sheet/Select focus-lifecycle or applicable touch-geometry check as a blocking gap, not a pass; record non-core unavailable checks honestly.

- [x] Task 6: Run exact-version local gates and scope proof (AC: 1, 7, 8)
  - [x] Run focused primitive tests, affected consumer tests, `npm run format:check`, `npm run lint`, `npm run type-check`, `npm run check:max-lines`, and `npm run build` with pinned Node/npm.
  - [x] Run the complete Vitest regression suite after the focused checks pass.
  - [x] Run `git diff --check`, explicit changed/untracked-file inspection, package/lockfile zero-diff, unresolved primitive-import audit, and YAML parse validation.
  - [x] Force-stage the ignored dedicated Story artifact, stage sprint tracking normally, and prove the Story file is tracked before commit with `git ls-files --error-unmatch` and the cached manifest.
  - [x] Update tasks, completion notes, validation evidence, file list, change log, dedicated Story status, and sprint status to `review` only after all applicable gates pass.

- [ ] Task 7: Complete independent review and the approved Git lifecycle (AC: 8)
  - [x] Obtain a fresh-context adversarial review from an agent that did not author the implementation; resolve every accepted finding and rerun affected gates.
  - [x] Obtain the mandatory second independent adversarial pass; require no unresolved accepted High or Medium findings.
  - [ ] Create a detailed conventional commit, push the feature branch, open a ready PR, and merge through GitHub without direct or force push to `main`.
  - [ ] Before deleting the worktree, prove the committed manifest contains `_bmad-output/implementation-artifacts/166-2-fe-harden-the-existing-shadcn-primitive-layer.md` so implementation/review evidence cannot be lost.
  - [ ] Verify the merge SHA on updated `main`, delete remote and local Story branches, remove the exact temporary worktree, run `git worktree prune`, and prove all Story lane artifacts are absent.

## Dev Notes

### Current Brownfield Evidence

- There are 28 installed primitives under `src/components/ui`; there are no primitive-specific tests in that directory before this Story.
- High-use files include Button (314 consumer files), Card (273), Skeleton (210), Alert (174), Tooltip (167), Table (141), Badge (96), Label (89), Input (66), Select (49), Dialog (31), and AlertDialog (18). Counts include tests/mocks and establish blast radius, not product requirements.
- Confirmed hardcoded presentation debt:
  - `dialog.tsx` and `alert-dialog.tsx`: black overlays plus `bg-white` content;
  - `popover.tsx` and `dropdown-menu.tsx`: inline white surfaces/`zIndex: 9999` plus gray text;
  - `select.tsx`: white/gray content and gray hover/focus items;
  - `sheet.tsx`: white content and a synthetic focusable close `span`;
  - `tooltip.tsx`: inline slate foreground/background/arrow/shadow values;
  - `alert.tsx`: hardcoded yellow warning palette;
  - `slider.tsx`: gray/white surfaces and explicit focus-outline suppression.
- Story 166.1 merged the semantic `background`, `card`, `popover`, `accent`, `input`, `ring`, `destructive`, operational-status, and theme contracts into `src/styles/globals.css`; those token files are read-only in this Story.
- Global `prefers-reduced-motion` behavior already exists in `src/styles/globals.css`; the default implementation strategy is to prove and preserve it, not duplicate motion logic per primitive.
- No missing primitive is proven by current consumers. Candidate catalog completeness is not authorization to add Breadcrumb, Pagination, Accordion, Avatar, ScrollArea, Toggle, Drawer, or any other file.

### Architecture and Scope Guardrails

- **Owned Surface:** `src/components/ui/**` and direct primitive tests.
- **Additional evidence surface:** this Story artifact, the existing sprint-status entry, and only the localized-close assertion updates in `OrderDetailsModal.test.tsx`, `GenerateStickersModal.test.tsx`, `OrderPickerDrawer.test.tsx`, and `ScheduleVersionModal.test.tsx`.
- **Forbidden:** `src/styles/**`, `components.json`, `postcss.config.js`, production product/domain components, AppShell/navigation, routes, APIs, hooks, stores, types, query keys, calculations, localization/formatting helpers, package files, backend/public contracts, deployment, and production systems.
- Keep primitives generic: no request/data hooks, route paths, cabinet/seller/SKU/COGS/margin/shipment/campaign terminology, financial calculations, response interpretation, or route-owned state.
- Preserve established exports and compatibility props. Class changes must not silently remove caller-provided `className` precedence.
- Loading is classified per primitive as applicable or not applicable. Do not add a generic `loading` prop, spinner abstraction, or new variant without a proven consumer; preserve native `disabled`, `aria-busy`, and caller-owned children pass-through.
- Preserve native/Radix accessibility rather than reimplementing it. `asChild` children must forward props and refs to a focusable semantic element.
- Table remains a semantic HTML primitive; Story 166.6 owns ResponsiveTable/DataTable composition decisions.
- New dependencies, `shadcn init --force`, bulk registry overwrite, Drawer, and advanced DataTable are forbidden.

### Library and Framework Requirements

- Use only installed React 19, Next.js 16, Tailwind CSS v4, CVA, Tailwind Merge, Lucide, Vitest/Testing Library, and existing individual Radix packages.
- Installed Radix versions already provide managed focus, keyboard interaction, Escape handling, portals, and state data attributes. Styling must not replace those behaviors.
- Current official Radix composition guidance requires custom `asChild` components to spread received props, forward refs, and render an appropriate focusable semantic element.
- Current shadcn v4 sources use semantic `bg-background`, `bg-popover`, `text-popover-foreground`, `border-input`, `focus-visible:border-ring`, `focus-visible:ring-ring/50`, `accent`, and destructive roles rather than fixed application palette values.
- Do not convert individual Radix packages to the unified `radix-ui` package; that would be an unauthorized dependency/migration change.

### Primitive Classification Matrix

| Group | Files | Required Story treatment |
|---|---|---|
| Overlay/elevated | `dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `popover.tsx`, `dropdown-menu.tsx`, `select.tsx`, `tooltip.tsx` | Semantic surfaces; preserve portals/state/focus; native Sheet close. |
| Form/control | `button.tsx`, `input.tsx`, `textarea.tsx`, `checkbox.tsx`, `radio-group.tsx`, `switch.tsx`, `slider.tsx`, `command.tsx`, `calendar.tsx`, `form.tsx`, `label.tsx` | Audit focus/invalid/disabled/targets; change only proven gaps. |
| State/presentation | `alert.tsx`, `badge.tsx`, `progress.tsx`, `skeleton.tsx`, `sonner.tsx` | Preserve API; semantic warning/state audit. |
| Structure/navigation | `card.tsx`, `collapsible.tsx`, `separator.tsx`, `table.tsx`, `tabs.tsx` | Verify semantic structure/selection/focus; no DataTable or domain behavior. |

Every row must be represented in final completion evidence even when no code change is necessary.

### Compatibility Contracts to Lock

- Tooltip: `size="sm" | "md" | "lg"` and arrow behavior.
- Select: optional `usePortal`, scroll buttons, positioning, disabled items, and selected indicator.
- Alert: `warning` variant and `role="alert"`.
- Sheet: `side="top" | "right" | "bottom" | "left"`, `size="default" | "wide"`, current defaults, and the existing `wide` width classes.
- Table: native `table`, wrapper-only `scrollContainerAriaLabel`/`scrollContainerTabIndex`, named focusable-region behavior, and no unnamed landmark.
- Button: `asChild`, variants, sizes, disabled behavior, and caller `className` merging.
- Form: `aria-describedby`, `aria-invalid`, label, description, and message linkage.
- Skeleton: `.animate-pulse` compatibility consumed by existing tests.

### Testing Requirements

- Preferred direct test directory: `src/components/ui/__tests__/`.
- Prefer behavior/render tests for semantics and interactions; use source/class contract tests only for token/presentation rules that jsdom cannot compute reliably.
- Do not test Radix internals. Test the repository wrapper contract: exported API, rendered semantic element, observable state, focus restoration, Escape behavior, and class/token integration.
- Hardcoded-color source tests may reject raw hex/rgb/hsl color values, fixed application palette utilities, and inline `backgroundColor`/`color`/`fill`/`borderColor`; they must allow non-color layout measurements and Radix CSS positioning variables. Translucent black scrims are an explicit neutral-overlay allowlist item pending visual proof.
- Use `@testing-library/user-event` for keyboard/pointer interactions and `jest-axe` only where it adds reliable evidence; automated a11y output does not replace manual focus/keyboard reasoning.
- Ensure portal tests clean up DOM between cases and do not rely on arbitrary timeouts.
- Focused command will be finalized from actual created test files. Expected shape:

  ```bash
  npm test -- --run src/components/ui/__tests__
  ```

- Exact toolchain wrapper:

  ```bash
  npx --yes -p node@24.18.0 -p npm@11.11.0 -- sh -c '<commands>'
  ```

- Universal local gates:

  ```bash
  npm run format:check
  npm run lint
  npm run type-check
  npm run check:max-lines
  npm run build
  npm test -- --run
  git diff --check
  ```

- Scope/dependency evidence:

  ```bash
  git diff --name-only 5425914b79faf05e5f567cffe9cc2a8437b49f7b
  git ls-files --others --exclude-standard
  git diff --exit-code 5425914b79faf05e5f567cffe9cc2a8437b49f7b -- package.json package-lock.json
  ```

- Dedicated Story tracking evidence before commit:

  ```bash
  STORY_FILE="_bmad-output/implementation-artifacts/166-2-fe-harden-the-existing-shadcn-primitive-layer.md"
  git check-ignore -v "$STORY_FILE"
  git add -f "$STORY_FILE"
  git add _bmad-output/implementation-artifacts/sprint-status.yaml
  git ls-files --error-unmatch "$STORY_FILE"
  git diff --cached --name-only
  ```

### Previous Story Intelligence

- Story 166.1 established the only application token/compiler path and merged as PR #145 with merge SHA `5425914b79faf05e5f567cffe9cc2a8437b49f7b`.
- Use semantic utilities emitted by the merged CSS-first `@theme inline` contract; do not edit or duplicate runtime token values.
- The previous Story demonstrated that selector-existence tests are weaker than declaration/behavior evidence. Primitive tests must assert the actual semantic or interaction contract, not merely component export existence.
- Previous review found accessibility defects despite green tests; Story 166.2 requires two independent adversarial passes and reruns affected universal gates after the final accepted fix.
- Worktree-local `npm ci` is mandatory because a `node_modules` symlink outside the worktree root breaks the Next.js/Turbopack build.

### Git Intelligence

- Base SHA: `5425914b79faf05e5f567cffe9cc2a8437b49f7b` (`Merge pull request #145 ... Story 166.1`).
- Previous implementation commit: `1b61737eb354d593136b2085cdcec61d5ce1ba06` (`feat(ui): establish Tailwind v4 semantic token contract`).
- Branch: `cdx/epic-166-story-2-primitives`.
- Worktree: `/private/tmp/wb-fe-166-2-harden-the-existing-shadcn-primitive-layer`.
- Primary checkout: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend`.
- Use a detailed conventional commit that classifies the change and records semantic-surface, accessibility, test, and scope outcomes. Do not mention the coding agent in commit text.

### Project Structure Notes

- No `project-context.md` exists. Controlling context is the canonical Epic, UX specification, OMX Story/master plan, repository instructions, current source/tests, and this Story artifact.
- Test files may exceed no configured size rules; keep helpers focused and source files within the enforced max-lines policy.
- Do not hand-edit generated `.next`, coverage, or OpenWiki output.
- The temporary worktree must be physically removed after merge; deletion of the branch alone is not completion.

### References

- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md` — Universal Story Delivery Contract and Story 166.2]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Existing-Primitive-Hardening`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Dialog-Sheet-Popover-and-Tooltip-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Accessibility-Strategy`]
- [Source: `.omx/plans/166.2-harden-the-existing-shadcn-primitive-layer.md`]
- [Source: `_bmad-output/implementation-artifacts/166-1-fe-establish-the-tailwind-v4-semantic-token-and-compiler-contract.md`]
- [Source: `src/components/ui/**` and current consumers]
- [Source: `src/styles/globals.css` — merged Story 166.1 semantic mapping and reduced-motion contract, read-only]
- [Official Radix Primitives composition and overlay documentation: Context7 `/websites/radix-ui_primitives`, retrieved 2026-08-11]
- [Official shadcn/ui v4 primitive source patterns: Context7 `/shadcn-ui/ui`, retrieved 2026-08-11]

## Dev Agent Record

### Agent Model Used

gpt-5.6-sol (orchestrator with independent repository-inventory, test, implementation, and review lanes).

### Implementation Plan

1. Install exact-version worktree-local dependencies and establish a clean baseline.
2. Add direct RED contract tests for semantic surfaces, native Sheet close, Slider focus, portals, compatibility APIs, and reduced-motion inheritance.
3. Harden overlays first, then the proven control/state defects, leaving verified primitives unchanged.
4. Run focused primitive and affected-consumer tests, followed by the full exact-version local gate set.
5. Complete two fresh adversarial review passes, update evidence, and execute commit/push/PR/merge/cleanup.

### Debug Log References

- Story lane created clean from merged Story 166.1 base `5425914b79faf05e5f567cffe9cc2a8437b49f7b`.
- Read-only inventory confirmed 28 primitives, no primitive-local tests, broad shared usage, eight concrete hardcoded/focus/accessibility candidates, and no proven missing primitive.
- Context7 confirmed Radix owns focus/keyboard/Escape/portal behavior and shadcn v4 uses semantic Tailwind surfaces and focus-visible roles.
- Exact worktree toolchain resolved as Node `v24.18.0` and npm `11.11.0`; worktree-local `npm ci` installed 759 packages with zero reported vulnerabilities and no manifest/lockfile change.
- Pre-flight source trace: AC1/6/7 are partially shipped structural contracts; AC2/3/4/5/8 remain partial. Direct audit also proved two Story-owned wrapper defects: Progress fails to forward `value` to the Radix root, and Select suppresses default close autofocus/focus return.
- RED baseline: 12 failing and 5 passing assertions across the two new primitive contract files proved the semantic-surface, native Sheet close, Select focus-return, Slider focus, and Progress accessible-value defects before implementation.
- Initial focused GREEN: 2/2 primitive files and 26/26 tests passed. After first-pass review coverage expansion, the final direct suite passed 2/2 files and 40/40 tests. Direct plus initially affected consumer verification passed 4/4 files and 116/116 tests; the final two localization-only consumer suites passed 2/2 files and 53/53 tests.
- Universal local gates on Node `24.18.0` / npm `11.11.0`: Prettier, ESLint, TypeScript, max-lines, and Next.js production build passed; build compiled and generated 70/70 static pages.
- Full Vitest regression passed 1101/1101 files and 18010/18010 tests after updating four consumer assertions from the previous English/ambiguous close-name expectation to the localized primitive contract.
- Scope proof passed: `package.json` and `package-lock.json` have zero diff, all current `@/components/ui/*` imports resolve, production primitive source has no raw application palette/inline color debt, `git diff --check` passes, and the temporary browser harness/config/spec were removed after use.
- Browser evidence from a temporary localhost-only Playwright harness: Dialog close `44×44`, Sheet close `44×44`, Dialog light `rgb(255,255,255)/rgb(33,33,33)`, Dialog dark `rgb(10,10,10)/rgb(250,250,250)`, reduced-motion animation/transition `0.01ms`, Dialog focus containment/return passed, Sheet native close/focus return passed, Select Escape/selection focus return passed, and Dialog/Sheet/Select portal placement passed.
- Post-first-review focused regression passed 6/6 files and 183/183 tests, including 40/40 direct primitive contracts and all four localized-close consumer suites.
- Post-first-review pinned universal gates passed: Prettier, zero-warning ESLint, TypeScript, max-lines, production build with 70/70 static pages, and the complete Vitest suite with 1101/1101 files and 18024/18024 tests.
- Final pre-second-review audits passed: YAML parsed, package/lockfile remained byte-diff clean, every `@/components/ui/*` import resolved, production primitive hardcoded-palette scan found only the allowed black scrims, temporary harness files were absent, and `git diff --check` was clean.
- Second-pass RED/GREEN: the new long-title close-safety contract failed before the layout repair, then the final direct suite expanded to 42 contracts; focused primitive plus localized-close consumer regression passed 6/6 files and 185/185 tests.
- Second-pass browser fix evidence: at a 320 CSS-pixel viewport and at a CDP 160-CSS-pixel/2×-scale reflow equivalent to 320 physical pixels at 200%, long Russian Dialog/Sheet titles had no rectangle intersection with the close controls, no horizontal overflow, and both close targets remained exactly `44×44`.
- Final post-second-review universal gates passed on the pinned toolchain: Prettier, zero-warning ESLint, TypeScript after removal of the generated harness cache, max-lines, production build with 70/70 static pages, and full Vitest with 1101/1101 files and 18026/18026 tests.

### Primitive Evidence Matrix

| Primitive | Classification | Evidence / bounded result |
|---|---|---|
| `alert-dialog.tsx` | changed | Semantic surface and reduced-motion classes; Radix behavior preserved. |
| `alert.tsx` | changed | Warning variant now uses `status-warning` semantic roles. |
| `badge.tsx` | verified-no-change | Existing semantic variants; no Story-owned interaction defect. |
| `button.tsx` | verified-no-change | `asChild`, disabled/loading pass-through, variants, and class merging locked by direct tests. |
| `calendar.tsx` | verified-no-change | Existing semantic/keyboard consumer coverage; compact day targets deferred to consumer owners. |
| `card.tsx` | verified-no-change | Existing semantic surface composition; no interactive contract. |
| `checkbox.tsx` | changed | Semantic invalid border/ring added; dense target size intentionally preserved. |
| `collapsible.tsx` | verified-no-change | Native/Radix state and keyboard behavior retained. |
| `command.tsx` | verified-no-change | Existing semantic selected/disabled data-state contract; no proven wrapper defect. |
| `dialog.tsx` | changed | Semantic light/dark surface, reduced motion, native localized 44×44 close; browser focus/portal proof passed. |
| `dropdown-menu.tsx` | changed | Semantic popover surfaces, utility z-index, reduced motion; API/portal behavior preserved. |
| `form.tsx` | verified-no-change | Label, description, message, and invalid linkage locked by direct test. |
| `input.tsx` | changed | Semantic invalid border/ring added; dense default height preserved. |
| `label.tsx` | verified-no-change | Native association and peer-disabled behavior retained. |
| `popover.tsx` | changed | Inline white/color/z-index debt removed; semantic elevated surface preserved. |
| `progress.tsx` | changed | `value` forwarded to Radix root, including zero; `aria-valuenow` and transform locked. |
| `radio-group.tsx` | changed | Semantic invalid border/ring added; compact target deferred to consumer evidence. |
| `select.tsx` | changed | Semantic surface/items, invalid trigger, Radix focus return restored for portal/non-portal. |
| `separator.tsx` | verified-no-change | Existing decorative/semantic Radix contract retained. |
| `sheet.tsx` | changed | Semantic surface, native localized 44×44 close, reduced motion, generic comments; side/size APIs preserved. |
| `skeleton.tsx` | verified-no-change | `.animate-pulse` compatibility preserved under global reduced-motion rule. |
| `slider.tsx` | changed | Semantic track/thumb, visible focus ring, reduced motion; value behavior unchanged. |
| `sonner.tsx` | verified-no-change | Existing theme/provider delegation; no Story-owned defect. |
| `switch.tsx` | verified-no-change | Existing semantic checked/disabled/focus contract; compact target deferred. |
| `table.tsx` | changed | Named wrapper gets `role="region"`; unnamed wrapper creates no landmark; native table preserved. |
| `tabs.tsx` | verified-no-change | Existing Radix open/selected/focus contract; dense height preserved. |
| `textarea.tsx` | changed | Semantic invalid border/ring added; existing sizing/API retained. |
| `tooltip.tsx` | changed | Semantic popover surface/arrow; `sm/md/lg` size API and non-color max-width retained. |

### Contract Evidence Matrix

`pass` means the named evidence directly proves the contract; `N/A` means the behavior does not apply to the listed primitive class. No `blocking-gap` remains.

| Contract dimension | Applicable scope | Result | Evidence source | Direct evidence / bounded N/A |
|---|---|---|---|---|
| Light theme | Dialog plus all changed semantic surfaces | pass | Real Chrome + source/token tests | Dialog rendered `rgb(255,255,255)` / `rgb(33,33,33)`; all changed surfaces assert semantic utilities rather than fixed application palette values. This is surface evidence, not a blanket contrast certification. |
| Dark theme | Dialog plus all changed semantic surfaces | pass | Real Chrome + source/token tests | Dialog rendered `rgb(10,10,10)` / `rgb(250,250,250)` under `.dark`; changed surfaces share the same semantic-role classes in both themes. |
| Role, name, and keyboard operation | Dialog, Sheet, Select, Checkbox, Button, Table | pass | Testing Library + Real Chrome | Native roles and names are asserted; Dialog/Sheet expose one `Закрыть` native button; Select/Checkbox/Button state remains Radix/native; named Table wrapper is a region. Pure presentation primitives (`Card`, `Separator`, `Skeleton`) are N/A for keyboard operation. |
| Escape close | Dialog, Sheet, Select | pass | Real Chrome + Testing Library | Dialog, Sheet, and Select close on Escape without custom keyboard handlers. Alert, Badge, Card, Form, Input, Progress, Table, and other non-overlay primitives are N/A. |
| Modal focus containment | Dialog, Sheet | pass | Real Chrome | Keyboard focus remained inside each open modal surface. Select/Popover/DropdownMenu/Tooltip are non-modal or transient and are N/A for modal containment. |
| Focus return | Dialog, Sheet, Select | pass | Real Chrome + Testing Library | Focus returned to the opener after Dialog/Sheet close and after Select Escape/selection for portal and consumer-backed non-portal modes; caller `onCloseAutoFocus` precedence is directly locked. |
| Portal placement | Dialog, Sheet, Select | pass | Real Chrome + Testing Library | All three rendered outside the trigger subtree when portal mode applies; Select `usePortal=false` remains inline. Non-overlay primitives are N/A. |
| Visible focus | Slider, overlay closes, Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Tabs, Command | pass | Direct class/render tests + browser keyboard pass | Semantic `focus-visible` ring contracts are retained or repaired; Slider and 44×44 close controls are directly asserted. Non-interactive presentation primitives are N/A. |
| Disabled state | Button, DropdownMenuItem, SelectItem, existing Radix controls | pass | Testing Library + source audit | Native disabled Button and Radix disabled menu/select items remain programmatically exposed; no second disabled-state model was added. |
| Invalid, open, and selected state | Input, Textarea, Select, Checkbox, RadioGroup | pass | Testing Library + class contracts | Invalid attributes drive semantic border/ring classes; open Select trigger and selected option expose Radix `data-state`; selected Checkbox exposes Radix `data-state`. |
| Destructive and loading pass-through | Button | pass | Testing Library + class contract | Existing destructive variant remains semantic; caller-owned `aria-busy`, disabled state, and children pass through without a speculative loading API. Other primitives are N/A for this Button-specific contract. |
| Reduced motion | Dialog, AlertDialog, Sheet, DropdownMenu, Select, Slider, Skeleton/global primitives | pass | Source test + Real Chrome | Global `prefers-reduced-motion` rule remains present; animated primitives inherit it; measured animation/transition duration was `0.01ms`. State meaning remains in Radix attributes/classes. |
| Touch geometry and title reflow | Built-in Dialog and Sheet close controls | pass | Real Chrome after animations settled | Final measured geometry is exactly `44×44` for both native close buttons. Long Russian titles do not intersect the close-control rectangles or overflow horizontally at 320 CSS px or the 320-physical-px/200%-reflow equivalent. Compact form/data controls are explicitly deferred below; no applicable core geometry remains unmeasured. |
| Compatibility APIs | Tooltip, Select, Alert, Sheet, Table, Button, Form, Skeleton, Progress | pass | Direct tests + affected consumers | `size`, `usePortal`, `warning`, Sheet side/size, Table wrapper props, `asChild`, form linkage, pulse, and zero/non-zero Progress value contracts pass. |
| Consumer regression | Four localized-close consumers plus affected primitive consumers | pass | Vitest | Narrow consumer assertion updates passed; production consumers were not changed. Full-suite evidence is rerun after review fixes before completion. |

Touch-target exception: only the proven built-in Dialog/Sheet icon actions were safely raised to 44×44. Shared geometry inflation is deferred to exact consumer owners: Calendar in `src/components/custom/DateRangePickerPopoverContent.tsx` and `src/components/custom/tariffs-admin/ScheduleVersionForm.tsx`; Checkbox in `src/components/custom/export-dialog/ExportConfigForm.tsx` and `src/components/custom/bulk-cogs/BulkCogsProductTable.tsx`; RadioGroup in `src/components/custom/shipments/ShipmentFormFields.tsx` and `src/components/custom/DashboardPeriodSelector.tsx`; Switch in `src/components/custom/ComparisonPeriodSelector.tsx` and `src/app/(dashboard)/analytics/advertising/components/OverAttributionBanner.tsx`; Slider in `src/components/custom/price-calculator/MarginSlider.tsx` and `src/app/(dashboard)/analytics/pricing/components/PricingFilters.tsx`; Table in `src/app/(dashboard)/analytics/liquidity/components/LiquidityTable.tsx` and `src/components/custom/orders/OrdersTable.tsx`; Tabs in `src/components/custom/orders/OrderHistoryTabs.tsx` and `src/app/(dashboard)/settings/tariffs/page.tsx`. These route/composition owners must validate layout-specific hit areas during their migration Stories. Neutral translucent `bg-black/50` and `bg-black/80` scrims remain the only documented raw-color exception because Story 166.1 defines no overlay token.

### Completion Notes List

- Hardened 15 of 28 existing primitives and verified the remaining 13 without adding a component, dependency, token, route, product behavior, or backend contract.
- Preserved public compatibility contracts for Tooltip `size`, Select `usePortal`, Alert `warning`, Sheet side/size, Table scroll-wrapper props, Button `asChild`, Form linkage, and Skeleton pulse behavior.
- Repaired Progress accessible value, Select focus return, native localized Dialog/Sheet close controls, semantic invalid states, semantic elevated surfaces, Slider focus visibility, and named Table region behavior.
- Added 42 direct primitive contracts and updated four directly affected consumer suites for the Russian `Закрыть` accessible-name contract.
- Completed source, jsdom, full-regression, production-build, and real-Chrome evidence with no unresolved implementation blocker.
- Completed two fresh adversarial passes and resolved every accepted finding; no accepted High or Medium implementation/evidence finding remains before commit.

### Post-1st-pass-review fixes (2026-08-11)

- Resolved High reproducibility finding: removed the stale ignored `.next/dev/types` route cache left by the deleted local browser harness, then reran the pinned TypeScript gate successfully.
- Resolved High direct-evidence finding: expanded focused coverage from 32 to 40 contracts for disabled Button/DropdownMenuItem/SelectItem, selected Checkbox, open/selected Select, destructive Button, caller-owned `aria-busy`, semantic hover/focus classes, and reduced-motion inheritance.
- Resolved Medium evidence finding: added the explicit multidimensional matrix above with `pass`/`N/A` disposition, evidence source, browser focus/portal/geometry proof, and exact touch-debt consumers.
- Resolved Medium scope finding: formally bounded the four necessary consumer-test assertion files while continuing to forbid every production consumer change.
- Resolved Low findings: aligned the Sheet task with direct native `SheetPrimitive.Close`, refreshed direct-test counts, and replaced the `OrderPickerDrawer` presentation-class selector with semantic close-control disambiguation.

### Post-2nd-pass-review fixes (2026-08-11)

- Resolved the accepted Medium layout/accessibility finding: Dialog/Sheet titles now reserve horizontal close space at normal narrow widths and move below the close control under 20rem, with `break-words` for long Russian content.
- Added real-Chrome regression evidence at 320 CSS px and a CDP 2× reflow equivalent to 320 physical px at 200%; title/close rectangles do not intersect, titles do not overflow horizontally, and targets remain `44×44`.
- Resolved the palette-test advisory by scanning every production `src/components/ui/*.tsx` file, all Tailwind palette families/properties, hex, RGB(A), and HSL(A), while allowing only the exact two neutral black scrims.
- Resolved the focus-test advisory by asserting the actual OrderPicker overlay close button receives focus instead of checking merely that `document.activeElement` exists.
- Resolved the portal-test advisory with persistent default-portal placement assertions for Dialog, Sheet, and Select while retaining the inverse `usePortal=false` Select contract.

### File List

- `_bmad-output/implementation-artifacts/166-2-fe-harden-the-existing-shadcn-primitive-layer.md` (Story implementation contract and evidence)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Story status tracking)
- `src/components/custom/orders/__tests__/OrderDetailsModal.test.tsx` (localized Dialog close contract)
- `src/components/custom/supplies/__tests__/GenerateStickersModal.test.tsx` (localized Dialog close contract)
- `src/components/custom/supplies/__tests__/OrderPickerDrawer.test.tsx` (localized and disambiguated Sheet close contracts)
- `src/components/custom/tariffs-admin/__tests__/ScheduleVersionModal.test.tsx` (disambiguated explicit close control)
- `src/components/ui/__tests__/primitive-behavior-contracts.test.tsx` (direct behavior/accessibility/API locks)
- `src/components/ui/__tests__/primitive-semantic-surfaces.test.tsx` (semantic surface/source contracts)
- `src/components/ui/alert-dialog.tsx`
- `src/components/ui/alert.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/progress.tsx`
- `src/components/ui/radio-group.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/slider.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/tooltip.tsx`

### Change Log

| Date | Change |
|---|---|
| 2026-08-11 | Story created. Bounded all 28 primitives, defined semantic-surface and accessibility hardening, locked public compatibility APIs, and prohibited speculative components/dependencies. |
| 2026-08-11 | Implementation and local evidence complete. Hardened semantic surfaces, focus/invalid states, native overlay closes, Progress/Table semantics, and direct primitive regressions. **Lessons:** (1) shared accessible-name localization requires a full consumer-test sweep; (2) animated touch geometry must be measured after animations settle; (3) semantic tokens can replace palette debt without changing public primitive APIs. Status: in-progress pending two adversarial review passes and Git lifecycle. |
| 2026-08-11 | Addressed first-pass adversarial review: 2 High, 2 Medium, and 3 Low findings resolved through reproducible cache cleanup, eight additional direct contracts, explicit multidimensional evidence, and formal test-only scope alignment. Status remains in-progress pending final gates and second review. |
| 2026-08-11 | Addressed second-pass adversarial review: the accepted Medium title/close collision risk and all 3 Low test-hardening findings were resolved. Browser reflow evidence, 42 direct contracts, 185 focused/consumer tests, 18026 full tests, and all universal gates pass. **Lessons:** (1) 44×44 overlay controls require title-safe reflow evidence, not geometry alone; (2) responsive title space should fall below the control under 20rem; (3) permanent palette locks must scan the whole primitive layer. Status: review pending Git lifecycle completion. |

<!-- Lessons-line convention (Story 94.4-FE): the final Story-close row that changes Status to `done` must include 1–3 Story-specific lessons for retrospective aggregation. -->
| 2026-08-17 | Story closed. Deliverable verified merged on FE main: PR #146 (merge 0d3e0879). Two-pass adversarial review discipline complete per this record (zero unresolved accepted High/Medium). Git-lifecycle checkboxes were left unchecked by the delivering session but are satisfied retroactively: merge ancestry, branch removal, and Story/ATDD artifact tracking verified on main 2026-08-17. Lessons carried from the original close-row above. |

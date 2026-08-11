# Story 166.1: Establish the Tailwind v4 Semantic Token and Compiler Contract

Status: ready-for-dev

## Story

As a user,
I want every theme, control, status, and chart to derive from one accessible semantic token system,
so that the same visual role always has the same meaning.

## Acceptance Criteria

1. **Single compiler and palette path**
   - **Given** the current Tailwind v4 application and its legacy JavaScript configuration,
   - **When** `src/styles/globals.css` is compiled through the repository's actual `@tailwindcss/postcss` pipeline,
   - **Then** one `@theme inline` contract maps application `--color-*` utilities to runtime semantic CSS variables,
   - **And** no second application color palette remains in `tailwind.config.ts`, `components.json`, or another config source.

2. **Approved red identity remains role-correct**
   - **Given** the light-theme semantic identity tokens,
   - **When** their resolved values and foreground pairings are tested,
   - **Then** brand is `#E53935`, interactive primary is `#C62828`, pressed/hover is `#A31515`, and subtle primary surface is `#FFCDD2`,
   - **And** brand red is not the normal-text white-on-red filled-control token.

3. **Semantic families stay independent**
   - **Given** financial, operational, availability, destructive, external-brand, focus, neutral, and chart meanings,
   - **When** the token manifest is inspected in light and dark themes,
   - **Then** each required role has an explicit semantic variable and Tailwind mapping,
   - **And** brand, interactive primary, destructive action, negative financial direction, operational error, and unavailable/unknown data are not collapsed into one semantic role.

4. **Existing semantic consumers begin compiling without route edits**
   - **Given** existing consumers such as `bg-primary`, `text-muted-foreground`, `bg-card`, `border-border`, `text-destructive`, `primary-dark`, `telegram-blue`, `shadow-card`, and `animate-slide-down`,
   - **When** a representative Story-owned fixture is compiled,
   - **Then** the expected selectors and semantic declarations are emitted,
   - **And** consumed non-color configuration currently held in `tailwind.config.ts` is migrated to the CSS-first contract or is proven unnecessary before the legacy config is removed.

5. **Light/dark contrast and focus evidence are computed**
   - **Given** the registered foreground/background pairs in both themes,
   - **When** tests calculate relative luminance and contrast from actual source token values,
   - **Then** normal-text pairs meet at least `4.5:1`, focus/non-text indicators meet at least `3:1`, and primary/pressed controls with white text meet the intended WCAG AA thresholds,
   - **And** the known `#E53935` versus white limitation is explicitly guarded.

6. **Shadcn and PostCSS configuration matches Tailwind v4**
   - **Given** `components.json` and `postcss.config.js`,
   - **When** their contract tests run,
   - **Then** `tailwind.css` remains `src/styles/globals.css`, `cssVariables` remains `true`, aliases/style/RSC/prefix remain unchanged, Tailwind v4 config is blank in `components.json`, and `@tailwindcss/postcss` remains enabled.

7. **Story scope and dependency policy are preserved**
   - **Given** the Story base SHA,
   - **When** the final diff is reviewed,
   - **Then** only the declared CSS/config files, direct token/compiler/config/contrast tests, and Story evidence changed,
   - **And** no primitives, product compositions, AppShell, routes, APIs, hooks, package manifest, lockfile, backend contract, deployment configuration, or production system changed,
   - **And** neither `shadcn init --force` nor a new UI dependency was used.

8. **Local completion evidence passes**
   - **Given** Node `24.18.0` and npm `11.11.0`,
   - **When** targeted tests and universal local checks run,
   - **Then** token/compiler/contrast tests, formatting, lint, type-check, max-lines, build, diff checks, scope checks, and dependency-diff checks pass,
   - **And** an independent reviewer has no unresolved accepted finding before PR merge.

## Tasks / Subtasks

- [ ] Task 1: Record the behavior lock and exact Story boundary (AC: 1, 4, 7)
  - [ ] Record base SHA, clean status, branch/worktree identity, and pinned Node/npm versions.
  - [ ] Capture the failing baseline: the current production compiler emits no representative semantic selectors even though the source contains many semantic-class consumers.
  - [ ] Inventory all consumed custom values in `tailwind.config.ts`; explicitly cover color roles, `text-h1`/`text-body`, custom spacing/radius, `shadow-card`, `animate-slide-down`, and the `tailwindcss-animate` plugin before removing or neutralizing the legacy config.
  - [ ] Confirm the final changed-file manifest excludes primitives, routes, product components, data layers, packages, and lockfiles.

- [ ] Task 2: Add direct Story-owned contract tests first (AC: 1–8)
  - [ ] Add `src/styles/__tests__/globals-token-contract.test.ts` or an equivalently direct Story-owned test.
  - [ ] Assert exactly one application `@theme inline` block and require every application `--color-*` mapping to reference a semantic runtime variable rather than restating a raw palette.
  - [ ] Parse `components.json`, `postcss.config.js`, and `tailwind.config.ts` presence/content as applicable; assert the Tailwind v4/shadcn contract and absence of a parallel application palette.
  - [ ] Define a test-owned required-role manifest for both themes.
  - [ ] Add `src/styles/__tests__/globals-compiled-contrast.test.ts` or equivalent and compile the real stylesheet/representative source through installed PostCSS/Tailwind packages.
  - [ ] Calculate contrast from actual resolved token values; do not use fixed placeholder ratios or class-string-only assertions.
  - [ ] Run the focused suite in RED and retain the expected failure reasons before implementation.

- [ ] Task 3: Establish the CSS-first semantic token manifest (AC: 1–3, 5)
  - [ ] Preserve the current HSL-triplet compatibility required by existing `hsl(var(--...))` consumers while exposing Tailwind utilities through `@theme inline` values such as `hsl(var(--semantic-role))`.
  - [ ] Define light and dark neutral roles: background, foreground, card, popover, muted, secondary, accent, border, input, disabled, focus/ring, and their required foregrounds/surfaces.
  - [ ] Define approved red identity roles: brand, primary, primary-pressed, primary-subtle, and corresponding foregrounds.
  - [ ] Define separate destructive, financial-positive/negative/neutral, status-success/warning/error/information/pending, and availability-available/unavailable/stale/partial/restricted/unknown roles.
  - [ ] Define external Telegram brand and chart categorical, positive/negative divergence, reference, target, forecast, confidence-band, grid, axis/tick, tooltip, and selection roles.
  - [ ] Give every theme-dependent role a deliberate `.dark` value; document any intentionally stable identity token.

- [ ] Task 4: Consolidate compiler/configuration ownership (AC: 1, 4, 6, 7)
  - [ ] Add the single `@theme inline` mapping in `src/styles/globals.css`.
  - [ ] Migrate consumed non-color theme values and required legacy plugin behavior into CSS-first Tailwind v4 directives/tokens, proving representative utilities compile.
  - [ ] Remove `tailwind.config.ts` if all consumed behavior is represented by the CSS-first path; otherwise retain only a narrowly justified, explicitly loaded, palette-free compatibility surface and prove it is not a competing compiler source.
  - [ ] Set `components.json` Tailwind config to the Tailwind v4 blank value while preserving its canonical stylesheet, CSS-variable mode, aliases, style, RSC, icon library, and prefix.
  - [ ] Keep `postcss.config.js` on `@tailwindcss/postcss`; change it only when compiler evidence requires a bounded correction.
  - [ ] Preserve existing body/scroll ownership, sidebar animation, reduced-motion, and sticky-first-column rules.

- [ ] Task 5: Prove the semantic compiler and accessibility contract (AC: 2–6)
  - [ ] Compile the real CSS and an in-memory representative class source; assert emitted selectors/declarations for every semantic family.
  - [ ] Verify `#C62828` and `#A31515` with white meet normal-text contrast, and explicitly verify `#E53935` with white does not become the filled-control mapping.
  - [ ] Verify normal-text semantic pairs in light/dark themes and focus-ring contrast against adjacent surfaces.
  - [ ] Verify chart categorical tokens do not collapse to duplicate resolved colors in either theme.
  - [ ] Record the limitation that automated color tests do not replace later visual review for chart comprehension, color-vision distinction, or alarm fatigue.

- [ ] Task 6: Run local gates and independent review (AC: 7, 8)
  - [ ] Run the focused token/compiler/contrast suite and `npm run format:check`.
  - [ ] Run `npm run lint`, `npm run type-check`, `npm run check:max-lines`, and `npm run build` with the pinned toolchain.
  - [ ] Run `git diff --check`, changed-file scope validation, and a zero-diff check for `package.json` and `package-lock.json` against the Story base SHA.
  - [ ] Inspect fresh compiled output for representative semantic utilities; do not rely on stale `.next` files.
  - [ ] Obtain an independent adversarial review and resolve every accepted finding, rerunning affected checks.
  - [ ] Update this Story record to `review`, record files/commands/results, and complete the approved commit/push/PR/merge/cleanup lifecycle.

## Dev Notes

### Current Brownfield Evidence

- `src/styles/globals.css` imports Tailwind v4 and defines `:root`/`.dark` CSS variables, but it has no `@theme inline`; current semantic class consumers therefore have no Tailwind v4 application mapping.
- Fresh compiled-output inspection before this Story found no representative `.bg-primary`, `.text-muted-foreground`, `.bg-card`, `.border-border`, `.text-destructive`, or `--color-primary` application output.
- The source already contains extensive semantic-class usage, including hundreds of `text-muted-foreground` consumers and dozens of primary/card/background/border/ring consumers. The foundation must make these existing classes compile without editing their route/primitive owners.
- `tailwind.config.ts` defines a conflicting legacy palette: `primary.DEFAULT` is brand `#E53935`, `primary.dark` is `#D32F2F`, and application neutral/semantic colors are duplicated there. Tailwind v4 does not auto-load this file.
- `components.json` points at `tailwind.config.ts`; official shadcn/ui 3.5 guidance says the Tailwind config field is blank for v4.
- `postcss.config.js` already uses `@tailwindcss/postcss`; no new compiler dependency is required.
- Existing route code uses raw `hsl(var(--border))`, so changing established HSL-triplet variables to full-color strings would break forbidden consumers. Preserve compatibility or prove an equally safe owned-surface solution.

### Required Semantic Families

- Identity: `brand`, `primary`, `primary-pressed`, `primary-subtle`.
- Neutral: page/background, foreground, card/surface/elevated, popover, muted, secondary, accent, border, input, disabled, ring/focus.
- Action/direction: destructive, financial-positive, financial-negative, financial-neutral.
- Operational status: success, warning, error, information, pending.
- Availability: available, unavailable, stale, partial, restricted, unknown.
- External brand: Telegram.
- Charts: categorical series, positive/negative divergence, reference, target, forecast, confidence band, grid, axis/tick, tooltip, and selection.

Token names may be normalized for clarity, but each role above must remain machine-testable and map to a predictable Tailwind utility family. Two roles may share a resolved reference color only when they remain separate semantic variables and the pairing is intentional.

### Architecture and Scope Guardrails

- This is a Tailwind/shadcn foundation Story, not a primitive or route migration.
- Allowed production surface is exactly `src/styles/globals.css`, `components.json`, `tailwind.config.ts`, and `postcss.config.js`; a file may be deleted when the CSS-first contract proves it obsolete.
- Additional allowed files are direct token/compiler/config/contrast tests and Story evidence only.
- `src/components/ui/**`, `src/components/product/**`, AppShell/navigation, route trees, APIs, hooks, stores, types, calculations, `package.json`, and lockfiles are forbidden.
- “No parallel palette remains” means no competing **application token/compiler source** remains. Existing raw palette utilities in later route-owned surfaces are inventoried debt and must not be rewritten here.
- Do not run `shadcn init --force`, regenerate primitives, add a DataTable dependency, or add any package.
- Frontend/backend contracts, URLs, query keys, auth/cabinet state, localization, calculations, and formatting must remain unchanged.

### Library and Framework Requirements

- Use installed `tailwindcss` v4, `@tailwindcss/postcss`, PostCSS, Vitest, and current shadcn/Radix dependencies only.
- Tailwind v4 official guidance: application tokens live in CSS; use `@theme inline` when Tailwind theme variables reference ordinary runtime CSS variables. Legacy JavaScript config is loaded only through explicit `@config`, and a legacy plugin through explicit `@plugin`.
- shadcn/ui 3.5 official guidance: `components.json` uses a blank `tailwind.config` for Tailwind v4, keeps the canonical CSS path, and retains `cssVariables: true`.
- Preserve `tailwindcss-animate` behavior only through a proven existing-dependency compatibility path; do not replace it with another package in this Story.

### File Structure Requirements

- Prefer colocated direct tests under `src/styles/__tests__/`.
- Keep test-only parsing/contrast helpers small and local to the Story tests; do not create a production token abstraction layer.
- Do not hand-edit generated `.next` output or commit build artifacts.
- Keep application CSS organized as: Tailwind import/directives, semantic runtime variables, one `@theme inline` mapping, base behavior, preserved animations/utilities.

### Testing Requirements

- Focused command:

  ```bash
  npm test -- --run \
    src/styles/__tests__/globals-token-contract.test.ts \
    src/styles/__tests__/globals-compiled-contrast.test.ts
  ```

- The compiler test must invoke the installed PostCSS/Tailwind pipeline against the real source and a representative class fixture.
- Contrast tests must calculate WCAG relative luminance from resolved colors; class-string assertions or fixed `const contrastRatio = 4.5` tests are insufficient.
- Record resolved `node --version` and `npm --version`; expected values are `v24.18.0` and `11.11.0`. The interactive shell currently exposes Node `v25.8.1`, so run Story commands through the repository's established package-scoped invocation: `npx --yes -p node@24.18.0 -p npm@11.11.0 -- sh -c '<commands>'`. Use an isolated temporary npm cache if the package-scoped runtime must be resolved again, and treat inability to resolve the exact versions after the allowed retry as a validation blocker rather than silently using Node 25.
- Universal gates: `npm run format:check`, an explicit Prettier check for every surviving owned root file, `npm run lint`, `npm run type-check`, `npm run check:max-lines`, `npm run build`, and `git diff --check`.
- `npm run format:check` covers `src/**` only. Build the root-file argument list from the owned files that still exist after implementation, then run Prettier directly; a legitimately deleted `tailwind.config.ts` must not be passed as a missing path:

  ```bash
  STORY_ROOT_FORMAT_FILES=""
  for file in components.json tailwind.config.ts postcss.config.js; do
    if [ -e "$file" ]; then
      STORY_ROOT_FORMAT_FILES="$STORY_ROOT_FORMAT_FILES $file"
    fi
  done
  if [ -n "$STORY_ROOT_FORMAT_FILES" ]; then
    npx prettier --check $STORY_ROOT_FORMAT_FILES
  fi
  ```
- Scope gates:

  ```bash
  git diff --name-only "$STORY_BASE_SHA"
  git ls-files --others --exclude-standard
  git diff --exit-code "$STORY_BASE_SHA" -- package.json package-lock.json
  ```

  These pre-commit commands intentionally compare the base against the index and working tree and list untracked files. Do not use `"$STORY_BASE_SHA"..HEAD` before the Story commit; while `HEAD` still equals the base, that range would vacuously hide staged, unstaged, and untracked changes.

- A permanent Playwright route is not required for this foundation Story. The real compiler probe plus production build is the authoritative automated evidence; later route Stories own full visual matrices.

### Project Structure Notes

- Canonical stylesheet: `src/styles/globals.css`.
- Shadcn registry/compiler metadata: `components.json`.
- Current legacy configuration: `tailwind.config.ts`; remove or strictly neutralize it only after non-color/plugin consumers are behavior-locked.
- Current PostCSS compiler: `postcss.config.js`.
- Current tests use Vitest 4 with jsdom and repository setup files; direct CSS tests should avoid backend/network dependence.
- No `project-context.md` exists. The controlling context is the canonical Epic, UX specification, OMX Story/master plans, repository documentation, source, tests, and this implementation artifact.

### References

- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md` — Story 166.1 and Universal Story Delivery Contract]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Visual-Design-Foundation`]
- [Source: `.omx/plans/166.1-establish-the-tailwind-v4-semantic-token-and-compiler-contract.md`]
- [Source: `.omx/plans/shadcn-full-ui-migration-master.md`]
- [Source: `src/styles/globals.css`]
- [Source: `tailwind.config.ts`]
- [Source: `components.json`]
- [Source: `postcss.config.js`]
- [Source: `package.json`]
- [Official Tailwind CSS v4 theme variables: `@theme inline`; Context7 `/tailwindlabs/tailwindcss.com`, retrieved 2026-08-11; canonical page `https://tailwindcss.com/docs/theme#referencing-other-variables`; source `https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/theme.mdx`]
- [Official Tailwind CSS v4 compatibility directives: `@config` and `@plugin`; Context7 `/tailwindlabs/tailwindcss.com`, retrieved 2026-08-11; canonical page `https://tailwindcss.com/docs/functions-and-directives#compatibility`; source `https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/functions-and-directives.mdx`]
- [Official shadcn/ui 3.5 `components.json`: Tailwind v4 leaves `tailwind.config` blank and retains `tailwind.css` plus `tailwind.cssVariables`; Context7 `/shadcn-ui/ui/shadcn_3.5.0`, retrieved 2026-08-11; canonical page `https://ui.shadcn.com/docs/components-json`; versioned source `https://github.com/shadcn-ui/ui/blob/shadcn@3.5.0/apps/v4/content/docs/(root)/components-json.mdx`]

## Dev Agent Record

### Agent Model Used

TBD by implementation agent.

### Debug Log References

- Baseline readiness review: existing production build passes, but semantic application utilities are absent from compiled CSS.
- Story scope ambiguity was corrected before implementation: the complete Owned Surface is explicitly editable and package/lockfile changes are forbidden.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story is ready for implementation after preparation artifacts merge into current `main`.

### File List

- `_bmad-output/implementation-artifacts/166-1-fe-establish-the-tailwind-v4-semantic-token-and-compiler-contract.md` (Story context)

### Change Log

| Date | Change |
|---|---|
| 2026-08-11 | Story created. Defined the single Tailwind v4 compiler path, exact semantic-role/contrast tests, bounded editable surface, pinned toolchain, and local Git lifecycle. |

<!-- Lessons-line convention (Story 94.4-FE): the final Story-close row that changes Status to `done` must include 1–3 Story-specific lessons for retrospective aggregation. -->

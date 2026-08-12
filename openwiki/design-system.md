---
type: "Design System"
title: "Design System — Tailwind v4, shadcn primitives, product compositions"
description: "The layered semantic design system: CSS-first Tailwind v4 token contract in src/styles/globals.css, hardened domain-agnostic shadcn/ui primitives in src/components/ui, presentational product compositions (PageHeader, Breadcrumbs, ContextBar) in src/components/product, and the Epics 166-174 full UI migration program."
tags: [design-system, tailwind, shadcn, accessibility, tokens]
openwiki:
  roles: [architecture, domain, testing]
  change_kinds: [public-api, lifecycle, design-tokens]
  source_paths:
    - src/styles/globals.css
    - postcss.config.js
    - components.json
    - src/components/ui
    - src/components/product/PageHeader.tsx
    - src/components/product/ContextBar.tsx
    - src/components/product/index.ts
  symbols:
    - PageHeader
    - Breadcrumbs
    - ContextBar
    - ContextBarState
    - ContextItem
    - PageHeaderProps
  test_paths:
    - src/styles/__tests__/globals-token-contract.test.ts
    - src/styles/__tests__/globals-compiled-contrast.test.ts
    - src/components/ui/__tests__/primitive-behavior-contracts.test.tsx
    - src/components/ui/__tests__/primitive-semantic-surfaces.test.tsx
    - src/components/product/__tests__/PageContextCompositions.test.tsx
    - src/components/product/__tests__/product-composition-source-contracts.test.ts
  invariants:
    - Primitives in src/components/ui are domain-agnostic and consume semantic tokens only — no hardcoded or light-only palette values.
    - Product compositions in src/components/product are presentational; breadcrumbs, actions, context, and state are route-supplied and own no URL/search/debounce/persistence.
    - Semantic state in ContextBar is shown as text and never conveyed by color alone.
    - PageHeader renders exactly one logical h1 regardless of visual size.
    - tailwind.config.ts is removed; Tailwind v4 config is CSS-first in src/styles/globals.css.
  validation_commands:
    - npx vitest run src/styles/__tests__ src/components/ui/__tests__ src/components/product/__tests__
---

# Design System

The frontend presentation layer is migrating to a layered, semantic design system built on **Tailwind v4** and **shadcn/ui (Radix)**. The layers are built in order and consumed strictly downward. This page documents the foundation delivered by Epic 166 (stories 166.1–166.3) and the Epics 166–174 migration program that consumes it.

<!-- openwiki: mermaid parse failed and this diagram was converted to a text fence so it does not break rendering. Fix the diagram source and restore the mermaid fence. Parser error: Heuristic: an unescaped angle bracket inside a label breaks rendering; rephrase the label. -->
```text
flowchart TD
  TOKENS["1. Semantic tokens<br/>src/styles/globals.css"] --> PRIM["2. Generic shadcn primitives<br/>src/components/ui/**"]
  PRIM --> COMP["3. Product compositions<br/>src/components/product/**"]
  COMP --> DOMAIN["4. Domain-shared / route-owned UI<br/>Epics 167-173 (76 routes)"]
  DOMAIN --> AUDIT["5. Parity, a11y, regression, cleanup<br/>Epic 174"]
```

## Why this exists

Before Epic 166, primitives carried hardcoded and light-only palette values (`bg-white`, fixed hex colors) and the theme lived in a JavaScript `tailwind.config.ts`. The migration establishes one semantic token vocabulary, hardens the shared primitives for accessibility and themes, and adds presentational compositions so route migrations can swap presentation without touching URL/search/state logic. It is delivered as part of the full shadcn/UI migration program defined in `.omx/plans/shadcn-full-ui-migration-master.md`.

## Layer 1 — Semantic tokens

`src/styles/globals.css` is the single source of truth for the theme. It uses Tailwind v4 CSS-first configuration:

- `@import 'tailwindcss'` + `@plugin 'tailwindcss-animate'` + a `@custom-variant dark` for class-based dark mode (matching `next-themes`).
- An `@theme inline` block maps every utility color to an HSL CSS variable: background/foreground, card, popover, muted, secondary, accent, border, input, disabled, ring/ring-offset, brand, primary (+ `primary-pressed`, `primary-subtle`), destructive, **financial** (positive/negative/neutral), **status** (success/warning/error/information/pending, each with foreground), **availability** (available/unavailable/stale/partial/restricted/unknown), telegram, and the full **chart** role set (series 1–6, positive/negative/reference/target/forecast/confidence-band/grid/axis/tooltip/selection).
- Typography (`--text-h1` …), spacing, radius, shadow, and animation scales are also defined in `@theme`.
- Light (`:root`) and dark (`.dark`) blocks assign concrete HSL values to each variable.

The JavaScript config was removed: `tailwind.config.ts` is deleted, `postcss.config.js` runs `@tailwindcss/postcss` + autoprefixer, and `components.json` is aligned (`config: ""`, `css: "src/styles/globals.css"`, `cssVariables: true`).

### Token regression tests

| File | Asserts |
|------|---------|
| `src/styles/__tests__/globals-token-contract.test.ts` | Every required semantic role is declared in `@theme`; utility-to-variable mapping is complete and consistent. |
| `src/styles/__tests__/globals-compiled-contrast.test.ts` | Real PostCSS-compiled output resolves to concrete colors; foreground/background pairs meet WCAG contrast for light and dark themes. |
| `src/styles/__tests__/token-test-utils.ts` | Shared `parseGlobals`, `themeInlineRules`, `declarationsFor`, `hslTripletToHex` helpers. |

## Layer 2 — Generic shadcn primitives

`src/components/ui/**` are domain-agnostic wrappers around Radix UI. Story 166.2 migrated fifteen primitives from fixed palette values to semantic tokens and hardened their accessibility contracts:

- **Semantic surfaces**: `bg-background`/`text-foreground`/`border-border`/`bg-accent` etc. replace `bg-white` and hardcoded colors across `dialog`, `alert-dialog`, `sheet`, `popover`, `tooltip`, `dropdown-menu`, `select`, `input`, `textarea`, `checkbox`, `radio-group`, `slider`, `progress`, `table`, `alert`.
- **Accessibility hardening**: Radix-owned Select focus return is restored; `Progress` forwards values including zero; synthetic overlay closes were replaced with native, localized, ≥44×44 (size-11) controls; responsive title space is reserved for narrow and 200%-reflow layouts (`min-[20rem]` guards); semantic invalid states are exposed; named table scrollers get a region contract; `motion-reduce:` variants disable animation/transition.
- **Compatibility preserved**: existing exports, variants, portals, and compatibility props are unchanged — only presentation and a11y behavior moved.

Four consumer test files (`OrderDetailsModal`, `GenerateStickersModal`, `OrderPickerDrawer`, `ScheduleVersionModal`) were updated for the shared Russian close label (`Закрыть`).

### Primitive regression tests

| File | Asserts |
|------|---------|
| `src/components/ui/__tests__/primitive-behavior-contracts.test.tsx` | Direct behavior, palette, portal, focus, reduced-motion, and compatibility contracts for the hardened primitives (uses `react-hook-form`, Testing Library, `userEvent`). |
| `src/components/ui/__tests__/primitive-semantic-surfaces.test.tsx` | Primitives render semantic-token surface/border/focus classes, not hardcoded or light-only values. |

## Layer 3 — Product compositions

`src/components/product/` are presentational, route-supplied layouts. They intentionally own **no** URL/search/debounce/persistence semantics — those stay with their route owners. Barrel: `src/components/product/index.ts`.

### `PageHeader` — `src/components/product/PageHeader.tsx`

Shared route identity. Renders **exactly one** logical `h1` regardless of visual size.

| Prop | Purpose |
|------|---------|
| `title` | Stable route identity; always the page's single `h1`. Must be non-empty (throws otherwise). |
| `description?` | Optional business-purpose explanation. |
| `breadcrumbs?` / `currentBreadcrumbIndex?` | Route-owned `BreadcrumbItem[]`; final item is current by default; invalid indices safely fall back to the last item. |
| `context?` | Route-supplied context metadata/controls. |
| `status?` | Route-supplied status/availability content. |
| `actions?` | Primary and secondary actions in task order. |
| `children?` | Additional slot below the identity row. |
| `compact?` | Compact layout for contextual detail views. |
| `busy?` | Indicates metadata refresh without replacing the title (`aria-busy`). |
| `breadcrumbLabel?` | Accessible label for the breadcrumb landmark (default `Навигация по странице`). |

### `Breadcrumbs` (exported from `PageHeader.tsx`)

Standalone breadcrumb composition for routes that do not need the full header. `BreadcrumbItem` carries already-localized `label` and optional `href`; the current/terminal item renders `aria-current="page"`, link items render visible focus rings.

### `ContextBar` — `src/components/product/ContextBar.tsx`

Decision-scope metadata bar. Semantic `state` (`fresh` | `refreshing` | `stale` | `partial` | `unavailable` | `restricted` | `overridden` | `default`) is rendered as localized text and **never conveyed by color alone**. `onRefresh`/`onReset` are route-owned callbacks — the composition changes no context implicitly. Common fields (`cabinet`, `period`, `comparison`, `freshness`, `completeness`, `scope`) plus generic `items: ContextItem[]` and `actions`/`children` slots.

### Product-composition regression tests

| File | Asserts |
|------|---------|
| `src/components/product/__tests__/PageContextCompositions.test.tsx` | `PageHeader`/`Breadcrumbs`/`ContextBar` rendering, single-`h1`, current-page marking, state text, busy/compact behavior. |
| `src/components/product/__tests__/product-composition-source-contracts.test.ts` | Structural source contracts: barrel exports, prop types, presentational invariants. |

## Migration program (Epics 166–174)

The foundation above is the first phase of a 90-story, 76-route migration defined in:

- `.omx/plans/shadcn-full-ui-migration-master.md` — approved master plan, delivery DAG, standard per-story protocol, non-negotiable principles.
- `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md` — story scope, acceptance criteria, ownership, forbidden shared files.
- `_bmad-output/planning-artifacts/shadcn-route-ledger.md` — exact route-to-story ownership for all 76 `page.tsx` routes.
- `_bmad-output/planning-artifacts/ux-design-specification.md` — visual/interaction/responsive/table/chart/state/theme/accessibility contracts.

**Non-negotiable principles**: preserve behavior before changing presentation; keep `src/components/ui/**` generic and domain-agnostic; build in layers; one shared file = one upstream owner Story; never run `shadcn init --force`; do not hide financial/operational/chart/table/availability/error meaning behind color, hover, truncation, or viewport width; local validation is the merge gate; production/deployment work is forbidden (see [Architecture — Configuration](architecture.md#configuration) and [Testing & Operations](testing-and-ops.md)).

Story 166.1 (tokens) → 166.2 (primitives) → 166.3 (compositions) must land in order; later epics (167 protected AppShell, 168 analytics-shared, 169–173 routes) depend on merged prerequisites.

## When to consult this page

- Changing any color, spacing, radius, shadow, or typography value → edit `src/styles/globals.css` and re-run the token + contrast tests.
- Adding or modifying a `src/components/ui/**` primitive → keep it semantic-token-only and domain-agnostic; extend the primitive-behavior/semantic-surface tests.
- Adding a new shared presentational layout → place it in `src/components/product/`; keep it presentational and route-supplied; extend the composition tests.
- Migrating a route → confirm prerequisite Stories are merged, then follow the master plan's per-story protocol.

## Change safety and validation

Design-system changes are guarded by focused regression suites; do not run the full suite to confirm a token or primitive change:

```bash
npx vitest run src/styles/__tests__ src/components/ui/__tests__ src/components/product/__tests__
```

Token edits additionally require `npm run build` because the compiled CSS is what the contrast test parses. Primitive hardening must preserve every existing export, variant, portal, and compatibility prop — check the four updated consumer modal tests when changing close-control or focus behavior.

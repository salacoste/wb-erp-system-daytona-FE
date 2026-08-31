---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - docs/brief.md
  - docs/prd.md
  - docs/front-end-architecture.md
  - docs/front-end-spec.md
  - docs/ux/persona-dashboard-rework-spec.md
  - docs/ux/readability-audit-spec.md
  - docs/ux/IMPLEMENTATION-TZ.md
  - docs/pages/general-reference.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/ux-design-directions.html
  - components.json
  - package.json
  - src/styles/globals.css
  - tailwind.config.ts
workflowType: create-epics-and-stories
initiative: shadcn-full-ui-migration
project_name: frontend
user_name: R2d2
date: 2026-08-11
lastStep: 4
---

# Frontend Shadcn Design System and Full UI Migration — Epic Breakdown

## Overview

This document defines the complete BMAD Epic and Story breakdown for consolidating the existing partial shadcn/ui adoption into one semantic, accessible, responsive design system and migrating every frontend route and its complete owned UI surface.

The initiative is a brownfield presentation and interaction migration. Existing backend contracts, queries, mutations, calculations, route behavior, Russian localization, formatting semantics, authentication behavior, cabinet context, and valid domain workflows remain unchanged unless a Story explicitly states otherwise. Stories 167.8 and 169.14 are the only approved cross-repository exceptions: Story 167.8 owns the backend reconciliation/idempotency contract required by the corrected onboarding DAG, and Story 169.14 owns the paid-storage import lifecycle/result reconciliation required before Story 169.12. Ordinary frontend migration Stories continue to forbid backend changes.

Development and validation are local-only. The standard environment is the frontend on `localhost:3100` and the backend on `localhost:3000`. Production deployment, production infrastructure, force pushes, and direct pushes to `main` are outside scope.

## Requirements Inventory

### Functional Requirements

FR1: Preserve user registration and login with the existing JWT-based authentication behavior.

FR2: Preserve session management, expiration handling, redirect behavior, and safe restoration of intended navigation context where currently supported.

FR3: Preserve the complete onboarding flow through cabinet creation, WB token entry, initial processing, first useful data, COGS assignment, and calculated margin.

FR4: Preserve WB token validation and actionable validation feedback.

FR5: Preserve visible progress and recoverable failure handling for initial and background data processing.

FR6: Preserve dashboard financial and operational metrics, their definitions, periods, units, availability, and drill-down behavior.

FR7: Preserve expense and other analytical visualizations without changing source data or interpretation.

FR8: Preserve trend visualizations and their time-period, comparison, tooltip, legend, and formatting semantics.

FR9: Preserve navigation from summary surfaces to detailed analytics and corrective workflows.

FR10: Preserve single-product COGS assignment, editing, validation, confirmation, and result behavior.

FR11: Preserve bulk COGS selection, entry, preview, submission, partial-result, and retry behavior.

FR12: Preserve numeric and business-rule validation while presenting clear Russian error and warning messages.

FR13: Preserve explicit save confirmation and affected-entity refresh after successful mutations.

FR14: Preserve backend-triggered margin calculation and distinguish saved COGS from pending or failed calculation.

FR15: Preserve margin analysis across SKU, brand, category, product, and time dimensions implemented by current routes.

FR16: Preserve financial summary, reconciliation, acquiring, buyout, returns, storage, liquidity, and other implemented analytical workflows.

FR17: Preserve filters, search, sort, pagination, selection, comparison, date/week, and export behavior implemented by each route.

FR18: Preserve compatibility with all backend endpoints currently used by the frontend; no UI Story may silently change request or response contracts.

FR19: Preserve authentication and cabinet headers, query keys, cache invalidation, polling, and request lifecycle behavior.

FR20: Preserve route and section loading, refresh, empty, error, stale, partial, permission, processing, and success behavior while standardizing presentation.

FR21: Preserve Russian user-facing localization and existing navigation terminology.

FR22: Preserve RUB currency formatting, signs, compact/full precision, zero-versus-missing semantics, and locale behavior.

FR23: Preserve percentage formatting, comparison direction, and business meaning.

FR24: Preserve standard dates, date ranges, ISO weeks, timezone assumptions, and period labels.

FR25: Preserve operational status, financial direction, availability, and analytical-series meaning while replacing arbitrary colors with semantic tokens.

FR26: Consolidate the existing partial shadcn/ui integration instead of introducing a competing UI library or force-overwriting local primitives.

FR27: Migrate all 76 `page.tsx` routes and their complete owned render trees to the approved design-system contract.

FR28: Migrate shared UI dependencies before dependent routes and record one explicit owner for every component used by two or more routes.

FR29: Preserve specialized domain components, virtualization, charts, and advanced tables when they satisfy the semantic, accessibility, responsive, and theme contracts.

FR30: Remove obsolete legacy styling, duplicated UI variants, unregistered colors, and unjustified raw controls only after all consumers migrate.

FR31: Maintain a machine-checkable route ledger mapping every route to exactly one owner Story, its shared dependencies, state coverage, and verification evidence.

FR32: Provide a consistent AppShell and one desktop/mobile navigation model without regressing authentication, hydration, scrolling, cabinet context, badges, route activity, or theme behavior.

FR33: Provide reusable product compositions for repeated page-header, context, metric, filter, table, chart, status, state, asynchronous-result, and contextual-detail patterns.

FR34: Support light and dark themes through semantic tokens without hardcoded light-only surfaces in migrated scope.

FR35: Validate every migrated route locally before merge and record branch, worktree, test, review, merge, push, branch-deletion, and mandatory worktree-removal evidence.

### NonFunctional Requirements

NFR1: Support the project's current modern-browser contract for Chrome, Firefox, Safari, and Edge.

NFR2: Preserve functional responsive behavior across desktop and tablet primary targets and mobile secondary targets.

NFR3: Avoid material regression to existing initial-load, interaction, and route-data performance; specialized virtualization and lazy-loading behavior must be preserved.

NFR4: Avoid duplicate or unnecessary requests caused by presentation refactoring.

NFR5: Preserve the existing security boundary: no protected-content flash, no token exposure, and no weakening of authentication or authorization checks.

NFR6: Validate and safely retain user input through recoverable errors; presentation migration must not introduce silent coercion or unsafe submission behavior.

NFR7: Keep source files within the repository's enforced size and complexity rules, including the configured maximum-lines policy where applicable.

NFR8: Use strict TypeScript; do not introduce `any` where `unknown` or a concrete type is appropriate.

NFR9: Keep code comments, logs, technical documentation, types, and implementation identifiers in English; keep user-facing UI in Russian.

NFR10: Preserve the established separation between API clients, hooks/services, domain behavior, product compositions, and generic primitives.

NFR11: Target WCAG 2.2 Level AA for migrated surfaces, with WCAG 2.1 AA as the existing minimum contract.

NFR12: Normal text contrast must be at least `4.5:1`; applicable large text and non-text UI must meet at least `3:1`.

NFR13: All user functionality must be keyboard-operable with visible focus, logical focus order, and correct overlay focus lifecycle.

NFR14: Critical workflows must remain usable at 200% zoom and at supported narrow widths, except bounded scrolling for inherently two-dimensional data regions.

NFR15: Primary mobile targets must be at least 44×44 pixels and must not depend on hover.

NFR16: Reduced-motion preferences must disable non-essential animation without removing state meaning.

NFR17: Tables and charts must expose semantic or textual alternatives sufficient to understand their business meaning.

NFR18: Local validation must include targeted tests plus relevant lint, type-check, production build, accessibility, responsive, theme, and visual verification.

NFR19: Every Story must keep its diff reviewable, reversible, and limited to its Allowed Change Surface.

NFR20: Each feature branch must be created from the current merged prerequisite base; dependent Stories must not start from stale pre-foundation branches.

NFR21: No Story in this initiative includes deployment, production operations, required CI gates, direct pushes to `main`, or force pushes.

NFR22: After successful merge, temporary local and remote feature branches and temporary worktrees must be removed, with the worktree removal treated as mandatory completion evidence.

### Additional Requirements

AR1: Use the existing Next.js App Router, TypeScript, Tailwind CSS v4, shadcn/Radix, CVA, Tailwind Merge, Lucide, React Hook Form, cmdk, Sonner, and next-themes stack.

AR2: Establish one Tailwind v4 CSS-first compiler and token path using semantic CSS variables plus `@theme inline`; do not retain `tailwind.config.ts` as a parallel application palette source.

AR3: Align `components.json` with the selected Tailwind v4 model; do not run `shadcn init --force`.

AR4: Prove representative semantic utilities through compiled CSS in light and dark themes rather than checking source variables only.

AR5: Keep `src/components/ui` generic and domain-agnostic. It may own low-level visual, interaction, and accessibility behavior but no API hooks, route knowledge, seller terminology, or financial calculations.

AR6: Reusable product compositions may combine primitives and encode cross-domain UX behavior but may not fetch backend data or interpret domain responses.

AR7: Domain-shared and route-owned components retain queries, mutations, calculations, navigation, response interpretation, and business rules.

AR8: Do not bulk-reorganize `src/components/custom` solely for directory purity; logical ownership and safe incremental migration take precedence.

AR9: Execute the dependency sequence: token/compiler contract → primitive hardening → AppShell/navigation → product compositions → domain-shared components → independent route slices → legacy removal → final verification.

AR10: Only one active writer may own token files, `src/components/ui`, AppShell, or any specific shared composition at a time.

AR11: Route Stories may run in parallel only when their owned-file sets do not overlap and all shared prerequisites are merged.

AR12: Every Story lists Allowed Change Surface and Forbidden Shared Files. A newly discovered shared-file need must be escalated to the orchestrator and resolved through an owner/prerequisite Story.

AR13: Preserve AppShell runtime invariants: authentication redirect, pre-hydration protection, exactly one scroll owner, fixed navigation/header behavior, role filtering, dynamic badges, active route, mobile close/Escape/focus return, cabinet context, and theme.

AR14: Use the shadcn `Table` primitive for semantic markup; use a simple responsive composition for static or server-controlled lists.

AR15: Introduce an advanced DataTable only for proven client-side sorting, filtering, selection, or column-visibility needs. TanStack Table requires a separate dependency decision.

AR16: Preserve specialized virtualization strategies rather than forcing them into a generic wrapper.

AR17: Treat the absence of route-level `loading.tsx` or `error.tsx` as a review signal, not an automatic defect; applicable states may be owned inside route components.

AR18: Decide global not-found behavior in a dedicated foundation/shared Story rather than silently adding it to every route.

AR19: Preserve current backend request parameters, query keys, URL/search parameters, response interpretation, formatting helpers, and cache invalidation unless explicitly approved.

AR20: Use the project's pinned Node.js and npm versions and package scripts for local validation.

AR21: Follow local-only merge policy: validate locally, commit, push feature branch, review, merge PR into `main`, delete completed remote/local feature branch, and remove temporary worktree.

AR22: Keep source-code migration out of the planning branch. This document, UX artifacts, route ledger, and OMX plans are planning-only deliverables.

### UX Design Requirements

UX-DR1: Implement brand red `#E53935` as a brand/decorative token, not the default filled-control background for normal white text.

UX-DR2: Implement interactive primary `#C62828` with white foreground and hover/pressed `#A31515`; verify actual contrast in both themes.

UX-DR3: Implement a subtle primary surface based on `#FFCDD2` or an accessible theme-equivalent pair.

UX-DR4: Separate semantic roles for brand, interactive primary, destructive action, negative financial direction, operational error, warning, information, data availability, external brands, and chart series.

UX-DR5: Replace legacy gray-index assumptions with semantic page, surface, foreground, muted, border, input, disabled, and focus-ring roles.

UX-DR6: Register categorical, sequential, diverging, target, forecast, confidence-band, axis, grid, tooltip, and selection chart tokens.

UX-DR7: Use the existing system sans-serif stack and the documented readable type scale; ordinary information must not fall below `12px`.

UX-DR8: Use tabular numerals where they improve monetary and tabular comparison.

UX-DR9: Apply the `4px` spacing scale and comfortable, standard, and dense modes without shrinking targets or text below accessibility floors.

UX-DR10: Implement the Adaptive Calm Command Center direction: shared calm AppShell plus task-appropriate financial, operational, executive, modular-analytics, and contextual-split variants.

UX-DR11: Implement a unified AppShell and navigation composition that preserves existing runtime invariants.

UX-DR12: Implement a reusable PageHeader with logical heading, description, breadcrumbs where useful, context/status, and actions.

UX-DR13: Implement a ContextBar for cabinet, period, comparison, freshness, completeness, applied scope, and refresh/reset behavior.

UX-DR14: Consolidate MetricGroup and MetricCard variants with explicit definition, period, units, trend, availability, and drill-down.

UX-DR15: Implement a reusable FilterToolbar while leaving query, URL, debounce, and persistence semantics with route/domain owners.

UX-DR16: Implement responsive table framing, state, sorting, selection, pagination, row-action, and primary-column contracts.

UX-DR17: Implement ChartFrame/ChartEvidence for common title, units, legend, state, tooltip, accessible summary, and data-alternative behavior.

UX-DR18: Implement PageState variants for loading, refresh, empty, filtered-empty, error, stale, partial, permission, processing, success, and not-found use cases.

UX-DR19: Implement AsyncOperationStatus and BulkResultSummary with attempted, succeeded, failed, skipped, pending, safe-leave, and retry-failed behavior.

UX-DR20: Implement StatusBadge and StatusStrip mappings with readable labels, icons where useful, semantic token pairs, and neutral unknown fallback.

UX-DR21: Implement ContextualSplitView for suitable entity-heavy routes with preserved selection, filters, queue position, focus, and mobile detail transitions.

UX-DR22: Implement centralized FinancialValue and DataAvailability presentation for signs, units, compact/full precision, zero, missing, stale, partial, estimated, and unavailable states.

UX-DR23: Use explicit action hierarchy: routine primary, secondary, tertiary/ghost, link navigation, and separately styled destructive actions.

UX-DR24: Use inline feedback for fields, surface feedback for affected sections, durable feedback for background jobs, and toasts only for lightweight acknowledgements.

UX-DR25: Preserve valid form input after recoverable errors and provide a focusable error summary for complex or multi-row forms.

UX-DR26: Use Dialog, AlertDialog, Sheet/Drawer, Popover, and Tooltip according to their documented semantic and focus behavior; avoid nested overlays.

UX-DR27: Distinguish first-use empty, valid zero-result, filtered empty, configuration-required, restricted, and error states.

UX-DR28: Keep search scope, applied filters, result count, reset behavior, active sort, pagination, and update state visible and predictable.

UX-DR29: Require every table Story to document caption/name, primary column, numeric formatting, sorting, selection, row actions, state, and narrow-width strategy.

UX-DR30: Require every chart Story to document title, period, units, series meaning, legend/labels, accessible summary, data alternative, responsive behavior, and drill-down context.

UX-DR31: Require bulk operations to preview exact scope, prevent duplicates, distinguish partial outcomes, and retry only failed items by default.

UX-DR32: Preserve cabinet, period, comparison, filters, sort, pagination, selection, and intended destination across navigation where applicable.

UX-DR33: Ensure all interactive functionality is keyboard-complete with visible focus and correct focus return.

UX-DR34: Implement semantic landmarks, a skip link, logical headings, accessible control names, and programmatic current/selected/expanded/sort/progress state.

UX-DR35: Test normal text at `4.5:1`, applicable large text and non-text UI at `3:1`, and focus rings in default, hover, pressed, selected, disabled, destructive, and semantic states.

UX-DR36: Verify critical routes at `320px`, common mobile width, `768px`, `1024px`, `1280px`, and large desktop behavior, including between-breakpoint transitions.

UX-DR37: Preserve semantic reading and focus order across responsive layout changes; do not use visual reordering that contradicts DOM order.

UX-DR38: Require route-level evidence for default, loading, refresh, empty, filtered-empty, error, stale/partial, permission, long-Russian-content, and large/negative-value states as applicable.

UX-DR39: Require light/dark screenshots or approved visual evidence for every route Story and expanded breakpoint/state evidence for high-risk surfaces.

UX-DR40: Require automated accessibility checks plus manual keyboard, focus, reading-order, data-meaning, and responsive review; zero automated violations alone is insufficient.

### FR Coverage Map

| Requirement | Primary Epic | Coverage intent                                                                 |
| ----------- | ------------ | ------------------------------------------------------------------------------- |
| FR1         | 167-FE       | Preserve registration and login during auth migration.                          |
| FR2         | 167-FE       | Preserve session, redirect, and restoration behavior.                           |
| FR3         | 167-FE       | Preserve first-time onboarding-to-margin journey.                               |
| FR4         | 167-FE       | Preserve WB token validation.                                                   |
| FR5         | 167-FE       | Preserve processing progress and recovery.                                      |
| FR6         | 168-FE       | Preserve dashboard and analytical metric meaning.                               |
| FR7         | 168-FE       | Preserve expense and analytical visualization behavior.                         |
| FR8         | 168-FE       | Preserve trend visualization semantics.                                         |
| FR9         | 167-FE       | Preserve AppShell and summary-to-detail navigation.                             |
| FR10        | 172-FE       | Preserve single-product COGS behavior.                                          |
| FR11        | 172-FE       | Preserve bulk COGS behavior and partial recovery.                               |
| FR12        | 172-FE       | Preserve COGS and domain validation semantics.                                  |
| FR13        | 172-FE       | Preserve mutation confirmation and refresh.                                     |
| FR14        | 172-FE       | Preserve COGS-triggered margin calculation states.                              |
| FR15        | 168-FE       | Preserve multi-dimensional margin analysis.                                     |
| FR16        | 169-FE       | Preserve operational and reconciliation analytics.                              |
| FR17        | 166-FE       | Establish shared interaction contracts used by every route owner.               |
| FR18        | 174-FE       | Verify backend endpoint compatibility across the completed migration.           |
| FR19        | 174-FE       | Verify headers, query keys, cache, polling, and request lifecycle preservation. |
| FR20        | 166-FE       | Establish reusable and semantically distinct route/section states.              |
| FR21        | 174-FE       | Verify Russian localization across all routes.                                  |
| FR22        | 166-FE       | Establish shared financial-value and availability presentation.                 |
| FR23        | 166-FE       | Establish shared percentage and comparison presentation.                        |
| FR24        | 166-FE       | Establish shared date/week/period presentation contracts.                       |
| FR25        | 166-FE       | Establish semantic financial, operational, availability, and chart color roles. |
| FR26        | 166-FE       | Consolidate the partial shadcn/ui foundation.                                   |
| FR27        | 167–173-FE   | Migrate all 76 complete route slices by domain.                                 |
| FR28        | 166-FE       | Assign and migrate upstream shared dependencies before routes.                  |
| FR29        | 166-FE       | Define preservation contract for specialized components.                        |
| FR30        | 174-FE       | Remove obsolete legacy UI only after consumer migration.                        |
| FR31        | 174-FE       | Maintain and validate the one-owner route ledger.                               |
| FR32        | 167-FE       | Deliver consistent AppShell and unified navigation.                             |
| FR33        | 166-FE       | Deliver reusable product compositions.                                          |
| FR34        | 166-FE       | Deliver semantic light/dark theme behavior.                                     |
| FR35        | 174-FE       | Enforce local validation and branch/worktree completion evidence.               |

## Epic List

### Epic 166-FE: Trustworthy Shadcn Design-System Foundation

Users receive one recognizable, accessible, theme-consistent interaction language across the product, while future route migrations gain stable semantic tokens, hardened primitives, and reusable compositions without changing business behavior.

**FRs covered:** FR17, FR20, FR22, FR23, FR24, FR25, FR26, FR28, FR29, FR33, FR34

**UX coverage:** UX-DR1–UX-DR40 foundations and shared contracts

**Dependencies:** None

**Standalone outcome:** Foundation showcase and shared components can be verified independently against representative existing surfaces before any route is declared migrated.

### Epic 167-FE: Consistent AppShell, Authentication, and First-Time Value

Users can enter the product, authenticate, complete onboarding, understand processing state, and navigate the protected workspace through one consistent desktop/mobile shell without losing security, cabinet, theme, route, or focus behavior.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR9, FR27, FR32

**Route scope:** `/`, `/login`, `/register`, `/cabinet`, `/processing`, `/wb-token`

**Dependencies:** Epic 166-FE. Corrected onboarding execution order: 167.8 → 167.9 → 167.5 → 167.6 and 167.7.

**Standalone outcome:** A new user can reach first useful data and the existing next-value workflow; a returning user can navigate the protected application shell safely.

### Epic 168-FE: Trustworthy Analytics Core and Financial Decisions

Owners and finance users can orient on analytical summaries, inspect profitability and financial history, compare periods, review alerts, analyze products and orders, and reach supporting evidence through the shared design language.

**FRs covered:** FR6, FR7, FR8, FR15, FR27

**Route scope:** `/analytics`, `/analytics/alerts`, `/analytics/dashboard`, `/analytics/finance-history`, `/analytics/orders`, `/analytics/pricing`, `/analytics/product/[nmId]`, `/analytics/reorder`, `/analytics/sku`, `/analytics/time-period`, `/analytics/unit-economics`

**Dependencies:** Epic 166-FE and Epic 167-FE AppShell

**Standalone outcome:** The primary analytical and financial decision loop is complete and trustworthy, independent of later operational, marketing, or AI route migrations.

### Epic 169-FE: Accessible Operational Analytics and Exception Triage

Operations and finance users can review acquiring reports, buyout and reconciliation, fulfillment stock, funnels, gaps, liquidity, returns, storage, and supply planning with consistent exception hierarchy, dense tables, charts, state recovery, and responsive behavior.

**FRs covered:** FR16, FR27

**Route scope:** `/analytics/acquiring`, `/analytics/acquiring/period`, `/analytics/acquiring/reports/[id]`, `/analytics/buyout`, `/analytics/buyout-reconciliation`, `/analytics/fbs-enhanced`, `/analytics/fbs-stock`, `/analytics/funnel`, `/analytics/gaps`, `/analytics/liquidity`, `/analytics/returns`, `/analytics/storage`, `/analytics/supply-planning`

**Dependencies:** Epic 166-FE and Epic 167-FE AppShell. The paid-storage prerequisite chain 169.14 → 169.15 → 169.12 contract closeout is complete; Story 169.13 completed independently.

**Standalone outcome:** Operational exception detection, investigation, action handoff, and verification work consistently across all operational analytics routes.

### Epic 170-FE: Coherent Marketing and Marketplace Analytics

Users can analyze advertising, campaigns, brands, categories, search, market share, and cross-channel relationships through consistent filters, comparisons, charts, tables, detail context, and trustworthy states.

**FRs covered:** FR27

**Route scope:** `/analytics/advertising`, `/analytics/advertising/campaigns/[advertId]`, `/analytics/brand`, `/analytics/brand-share`, `/analytics/category`, `/analytics/cross-reference`, `/analytics/search`

**Dependencies:** Epic 166-FE and Epic 167-FE AppShell

**Standalone outcome:** The complete marketing-analysis journey is visually and behaviorally consistent without requiring the AI/forecast migration.

### Epic 171-FE: Clear AI, Forecast, and Model Governance

Authorized users can inspect anomalies, configure AI preferences, compare forecasts, and govern model evaluation and performance through accessible, explainable, status-rich interfaces.

**FRs covered:** FR27

**Route scope:** `/analytics/ai-admin/anomalies`, `/analytics/ai-admin/models`, `/analytics/ai-admin/preferences`, `/analytics/forecast`, `/analytics/forecast-accuracy`, `/analytics/models`, `/analytics/models/[id]/evaluations`, `/analytics/models/[id]/evaluations/sku-accuracy`, `/analytics/models/[id]/performance`

**Dependencies:** Epic 166-FE and Epic 167-FE AppShell

**Standalone outcome:** AI and forecast routes form a complete, explainable administrative and analytical workspace.

### Epic 172-FE: Consistent Core Business Operations

Users can manage dashboard priorities, automation rules, COGS, communications, finances, monitoring, MoySklad, orders, and products through consistent forms, tables, statuses, writeback feedback, and recovery behavior.

**FRs covered:** FR10, FR11, FR12, FR13, FR14, FR27

**Route scope:** `/dashboard`, `/automation/canned-rules`, `/automation/installed-rules`, `/automation/installed-rules/[id]`, `/cogs`, `/cogs/bulk`, `/cogs/history`, `/cogs/price-calculator`, `/communications`, `/finances`, `/monitor`, `/monitoring`, `/moysklad`, `/orders`, `/orders/fbo`, `/orders/integrity`, `/products`

**Dependencies:** Epic 166-FE and Epic 167-FE AppShell

**Standalone outcome:** The principal daily business-management workflows are migrated end-to-end, including safe single and bulk writeback behavior.

### Epic 173-FE: Predictable Settings, Shipments, and Supplies

Users can configure the service, manage expenses and notifications, and work with shipments and supplies through consistent layouts, forms, entity details, dialogs, documents, and lifecycle status flows.

**FRs covered:** FR27

**Route scope:** `/settings`, `/settings/backfill`, `/settings/cabinet`, `/settings/expenses`, `/settings/notifications`, `/settings/tariffs`, `/settings/tax`, `/shipments`, `/shipments/[id]`, `/shipments/box-types`, `/shipments/sku-packaging`, `/supplies`, `/supplies/[id]`

**Dependencies:** Epic 166-FE and Epic 167-FE AppShell

**Standalone outcome:** All administrative, shipment, and supply workflows share the approved design system and remain complete across list, detail, form, document, and lifecycle states.

### Epic 174-FE: Complete Migration Assurance and Legacy Removal

Users receive a fully consistent frontend with every route accounted for, no known legacy UI gaps, preserved backend and business semantics, verified accessibility/responsiveness/themes, and no abandoned branches or temporary worktrees.

**FRs covered:** FR18, FR19, FR21, FR30, FR31, FR35

**Dependencies:** Epics 166–173-FE

**Standalone outcome:** The entire migration is proven complete through route-ledger parity, source audits, local validation, visual/accessibility evidence, and repository cleanup.

## Stories

### Universal Story Delivery Contract

Every Story below inherits this contract and supplements it with a Story-specific Delivery Record. A Story is not complete until both its specific acceptance criteria and this universal contract are satisfied.

#### Migration Unit

- A route Story owns the route entry, route-local components, exclusive custom components, applicable overlays, forms, tables, charts, state surfaces, and tests identified in its Delivery Record.
- Editing `page.tsx` alone never completes a route migration.
- A shared component with two or more route consumers is modified only by its named owner Story or an approved prerequisite Story.
- Existing API hooks, requests, query keys, response interpretation, mutations, calculations, navigation semantics, URL/search parameters, cache invalidation, formatting meaning, and authorization behavior remain unchanged.

#### Required State Coverage

Each Story verifies the applicable subset of:

- initial loading;
- background refresh;
- success with realistic data;
- valid zero;
- first-use empty;
- filtered empty;
- stale data;
- partial data;
- recoverable error;
- permission restriction;
- processing/pending;
- partial mutation success;
- session expiration;
- not-found or unavailable entity.

The state may be implemented at a Next.js route boundary or inside the owning component according to recovery and data ownership. New route-level files are not required mechanically.

#### Responsive and Data-Density Contract

- Verify behavior at `320px`, a common mobile width, `768px`, `1024px`, `1280px`, and a representative large desktop width where applicable.
- Preserve one intentional AppShell scroll owner; local two-dimensional scrolling is bounded to tables/charts that require it.
- Every dense table identifies its primary column, secondary disclosure behavior, numeric alignment/precision, row actions, and narrow-width strategy.
- Static/server-controlled lists use the semantic Table plus responsive composition; advanced client-side DataTable behavior requires proven need and a separate TanStack dependency decision.
- Existing virtualization is preserved.
- Charts retain correct period, units, sign, series meaning, tooltip precision, legend, accessible summary, and data alternative.

#### Accessibility and Theme Contract

- Meet WCAG 2.2 AA target: semantic structure, logical headings, accessible names, keyboard completeness, visible focus, correct Dialog/Sheet/Popover/Menu focus lifecycle, and meaningful announcements.
- Normal text contrast is at least `4.5:1`; applicable large text and non-text UI are at least `3:1`.
- Status, direction, availability, and selection never rely on color alone.
- Verify light and dark themes, 200% zoom for critical workflows, reduced motion where applicable, Russian labels, long values, negative values, dates, percentages, and ISO weeks.
- Automated accessibility scans supplement manual keyboard, focus, reading-order, data-meaning, and responsive review.

#### Allowed and Forbidden Change Rules

- Changes are limited to the Story's Allowed Change Surface plus tests and Story documentation directly proving the change.
- Token/compiler files, `src/components/ui`, AppShell/navigation, shared product compositions, unrelated domain components, API clients, hooks, types, query keys, and backend contracts are forbidden unless explicitly included in the Story's Allowed Change Surface.
- A newly discovered shared requirement is escalated to the orchestrator and resolved through the named owner or a prerequisite Story; it is not absorbed silently.
- Numeric Story order identifies canonical records; it is not a universal execution order. An approved higher-numbered correct-course prerequisite may execute before a lower-numbered route Story when the explicit canonical DAG requires it.
- Exactly Stories 167.8 and 169.14 may change the backend repository, each only within its separately declared bounded backend surface. Story 167.8 owns only the authoritative cabinet session reconciliation/create-idempotency contract; Story 169.14 owns only the authoritative paid-storage import request/lifecycle/result/error contract. Neither Story has a route-ledger row, and no other Story inherits either exception.
- Backend completion evidence is repository-specific for each exception. A frontend coordination artifact may not claim Story 167.8 or Story 169.14 `review`, `done`, backend completion, or cleanup without the exact backend merge SHA, proof that SHA is an ancestor of refreshed backend `origin/main`, proof that the Story's local and remote backend branches are absent, and backend worktree removal/prune evidence. Story 169.14 additionally requires its direct single-parent artifact-only final handoff to be merged into trusted frontend history, all three retained backend records and both retained frontend final-handoff records to be authenticated, and all five cross-bound source records to be retired through the exact committed 48-line transaction before status reconciliation. Clean local-main equality/ancestry remains preferred; Story 169.14 may defer it only under its durable exact foreign-WIP reservation with recorded local/origin/base SHAs, exact blocking paths, and fresh no-overlap proof while leaving foreign WIP and the local `main` ref untouched.
- No production, deployment, force-push, direct-`main` push, or required CI-gate work is authorized.

#### Local Validation Contract

Use the pinned Node `24.18.0` and npm `11.11.0`. Run the smallest targeted proof first, then all relevant project checks:

1. Targeted Vitest component/hook tests for the changed surface.
2. Targeted Playwright route or journey test where behavior is integration-sensitive.
3. `npm run lint`
4. `npm run type-check`
5. `npm run check:max-lines`
6. `npm run build`
7. Applicable local route smoke, keyboard, axe, theme, responsive, and screenshot verification with frontend `localhost:3100` and backend `localhost:3000`.

If an environment-specific check cannot run, the Story records the exact gap and next-best evidence; it must not claim the check passed.

#### Branch, Review, Merge, and Cleanup Contract

- Branch: `cdx/epic-{epic}-story-{story}-{slug}`.
- Temporary worktree: a Story-specific path outside the primary checkout, created from current `main` only after prerequisite Stories merge.
- One implementation Story per branch and temporary worktree.
- After local validation: detailed conventional commit → push feature branch → adversarial review → resolve findings → merge PR to `main` under local-only merge policy.
- After successful merge: delete remote feature branch, delete local feature branch, and remove the temporary worktree.
- Completion evidence records branch name, worktree path, base SHA, commit SHA, local validation commands/results, review disposition, PR/merge reference, branch deletion, `git worktree list` cleanup result, and confirmation that no Story-owned worktree remains.

#### Standard Story Delivery Record Fields

Every Story contains:

- **Route/User Value**
- **Owned Surface**
- **Shared Dependencies**
- **Allowed Change Surface**
- **Forbidden Shared Files**
- **State Coverage**
- **Responsive/Table/Chart Contract**
- **Accessibility Contract**
- **Test and Visual Evidence**
- **Local Validation**
- **Branch/Worktree Lifecycle**
- **Cleanup Evidence**

## Epic 166-FE: Trustworthy Shadcn Design-System Foundation

### Story 166.1: Establish the Tailwind v4 Semantic Token and Compiler Contract

**Requirements:** FR25, FR26, FR34

As a user, I want every theme, control, status, and chart to derive from one accessible semantic token system, so that the same visual role always has the same meaning.

**Delivery Record:** **Route/User Value:** cross-product semantic consistency. **Owned Surface:** `src/styles/globals.css`, `components.json`, `tailwind.config.ts`, `postcss.config.js`, compiled-style/contrast probes. **Shared Dependencies:** none. **Allowed Change Surface:** the complete Owned Surface plus direct token/compiler/config/contrast tests and Story evidence only. **Forbidden Shared Files:** primitives, compositions, AppShell, routes, APIs/hooks, `package.json`, and lockfiles. **State Coverage:** all interactive, semantic, availability, chart, and light/dark states. **Responsive/Table/Chart Contract:** tokens preserve type, spacing, focus, chart distinction, and density at all target widths. **Accessibility Contract:** computed contrast and focus-token proof. **Test and Visual Evidence:** compiled CSS, contrast matrix, token showcase. **Local Validation:** token probes plus universal commands using pinned Node `24.18.0` and npm `11.11.0`. **Branch/Worktree Lifecycle:** `cdx/epic-166-story-1-token-compiler`, exclusive token writer. **Cleanup Evidence:** proof no parallel application token/compiler source remains plus universal cleanup; raw palette utilities in later route-owned migration surfaces are inventoried for their owning Stories and are not rewritten here.

**Acceptance Criteria:** **Given** the current CSS/config drift **when** the foundation compiles **then** CSS variables plus `@theme inline` are the single palette/compiler path; brand `#E53935`, primary `#C62828`, pressed `#A31515`, destructive, financial, status, availability, and chart roles remain distinct **and** `shadcn init --force` and new UI dependencies are not used.

### Story 166.2: Harden the Existing Shadcn Primitive Layer

**Requirements:** FR26, FR28, FR29

As a keyboard, touch, or assistive-technology user, I want generic controls and overlays to behave predictably, so that later routes inherit reliable interaction behavior.

**Delivery Record:** **Route/User Value:** reliable generic controls. **Owned Surface:** `src/components/ui/**` and primitive tests. **Shared Dependencies:** 166.1. **Allowed Change Surface:** primitives/tests and proven missing primitives only. **Forbidden Shared Files:** tokens, product/domain components, AppShell, routes, data layers. **State Coverage:** default/hover/pressed/open/selected/focus/disabled/invalid/loading/destructive/reduced-motion. **Responsive/Table/Chart Contract:** Table stays semantic; no domain model or universal responsiveness. **Accessibility Contract:** Radix/native names, keyboard, Escape, containment/return, targets, themes. **Test and Visual Evidence:** primitive state/focus/portal matrix. **Local Validation:** targeted primitive tests plus universal commands. **Branch/Worktree Lifecycle:** `cdx/epic-166-story-2-primitives`, exclusive primitive writer. **Cleanup Evidence:** primitive inventory/exceptions plus universal cleanup.

**Acceptance Criteria:** **Given** the installed primitives **when** they are audited and hardened **then** unjustified hardcoded surfaces are replaced by semantic tokens and existing behavior remains domain-agnostic **and** missing primitives are added only for proven consumers without automatically adding Drawer, advanced DataTable, or dependencies.

### Story 166.3: Deliver PageHeader and ContextBar Compositions

**Requirements:** FR28, FR33

As a business user, I want stable page identity and decision context, so that cabinet, period, scope, comparison, freshness, and actions are always understandable.

**Delivery Record:** **Route/User Value:** cross-route orientation. **Owned Surface:** canonical product-composition directory for `PageHeader`, breadcrumbs, and `ContextBar` plus tests/examples. **Shared Dependencies:** 166.1–166.2. **Allowed Change Surface:** these compositions only. **Forbidden Shared Files:** tokens/primitives/AppShell/routes/hooks. **State Coverage:** default/wrapped/loading/refreshing/stale/partial/unavailable/restricted. **Responsive/Table/Chart Contract:** context wraps/discloses without DOM/focus reordering. **Accessibility Contract:** one `h1`, named useful breadcrumbs, current values and refresh state. **Test and Visual Evidence:** long Russian titles/actions across themes/widths. **Local Validation:** targeted composition tests plus universal checks. **Branch/Worktree Lifecycle:** `cdx/epic-166-story-3-page-context`. **Cleanup Evidence:** no route/query knowledge plus universal cleanup.

**Acceptance Criteria:** **Given** a route adopts these compositions **when** it renders or changes context **then** page identity and current decision scope are explicit while URL, query, debounce, persistence, and navigation behavior remain route-owned **and** `src/components/product/**` becomes the documented canonical product-composition path.

### Story 166.4: Standardize Metrics, Financial Values, Availability, and Status

**Requirements:** FR20, FR22, FR23, FR25, FR33

As an owner, CFO, or operations manager, I want values and statuses to carry consistent business meaning, so that I can distinguish direction, availability, and required action.

**Delivery Record:** **Route/User Value:** trustworthy metrics/status. **Owned Surface:** product metric, FinancialValue, DataAvailability, StatusBadge/Strip compositions and presentation helpers. **Shared Dependencies:** 166.1–166.3. **Allowed Change Surface:** those compositions/tests. **Forbidden Shared Files:** tokens/primitives/routes/calculations/APIs. **State Coverage:** loading/positive/negative/neutral/zero/missing/unavailable/not-calculated/stale/partial/estimated/warning/error/pending/success/unknown. **Responsive/Table/Chart Contract:** hero/standard/dense remain readable; table cells integrate later. **Accessibility Contract:** signs/units/full precision and non-color meaning. **Test and Visual Evidence:** RUB/percent/date/week/large-negative matrix. **Local Validation:** targeted tests plus locale/static/universal checks. **Branch/Worktree Lifecycle:** `cdx/epic-166-story-4-financial-status`. **Cleanup Evidence:** zero-vs-missing and unknown fallback proof.

**Acceptance Criteria:** **Given** financial and operational values **when** shared presentation renders them **then** Russian locale, units, signs, tabular precision, comparison direction, and distinct availability states remain correct **and** brand, destructive, negative-financial, operational-error, and unknown roles never collapse into one color meaning.

### Story 166.5: Standardize Filters and Period Controls

**Requirements:** FR17, FR24, FR28, FR33

As a user filtering data, I want visible scope and predictable reset behavior, so that context never changes silently.

**Delivery Record:** **Route/User Value:** consistent search/filter/date/week/comparison mechanics. **Owned Surface:** FilterToolbar and inventoried multi-route selectors (`DateRangePicker*`, comparison/week/period controls) plus tests. **Shared Dependencies:** 166.1–166.4. **Allowed Change Surface:** presentation and explicit consumer-owned selector files. **Forbidden Shared Files:** tokens/primitives/routes/query hooks/APIs/stores. **State Coverage:** default/expanded/applied/dependency-loading/updating/invalid/empty/disabled/narrow. **Responsive/Table/Chart Contract:** applied state/reset remain visible; data behavior stays route-owned. **Accessibility Contract:** visible labels, keyboard popovers/calendars, deterministic reset focus. **Test and Visual Evidence:** callback/consumer regressions and responsive themes. **Local Validation:** targeted selector tests plus universal checks. **Branch/Worktree Lifecycle:** `cdx/epic-166-story-5-filters-periods`, exclusive shared-selector writer. **Cleanup Evidence:** consumer inventory plus universal cleanup.

**Acceptance Criteria:** **Given** existing URL/query/debounce/persistence semantics **when** controls migrate **then** current values, applied scope, update state, result count, and reset scope are visible **and** presentation reuse does not change route/domain behavior.

### Story 166.6: Deliver ResponsiveTable and Data-Table Contracts

**Requirements:** FR17, FR28, FR29, FR33

As a user of dense records, I want semantic responsive tables, so that identifiers, metrics, statuses, and actions remain reachable.

**Delivery Record:** **Route/User Value:** consistent dense data interaction. **Owned Surface:** reusable table framing/pagination/selection/state/virtualized adapter interfaces. **Shared Dependencies:** 166.1–166.5. **Allowed Change Surface:** `src/components/product/tables/**` and tests/examples. **Forbidden Shared Files:** primitives, route tables, APIs/query state. **State Coverage:** loading/populated/empty/filtered/error/stale/partial/updating/selected/disabled/expanded/pagination edges. **Responsive/Table/Chart Contract:** each consumer supplies caption, primary column, numeric/sort/selection/actions/state/narrow strategy; preserve virtualization. **Accessibility Contract:** scopes, sort, entity actions/selection, reachable overflow. **Test and Visual Evidence:** dense/overflow/action/sort/selection/pagination/theme/zoom fixtures. **Local Validation:** targeted tests plus universal checks. **Branch/Worktree Lifecycle:** `cdx/epic-166-story-6-responsive-tables`. **Cleanup Evidence:** no new table dependency or generic client state model.

**Acceptance Criteria:** **Given** static/server lists or specialized virtualized tables **when** they adopt the contract **then** semantics, state framing, numeric precision, and explicit width behavior are provided **and** TanStack/advanced DataTable is introduced only by a separate proven dependency decision.

### Story 166.7: Deliver ChartFrame and Accessible Analytical Evidence

**Requirements:** FR17, FR28, FR29, FR33

As a user making chart-based decisions, I want period, units, series, freshness, and evidence exposed consistently, so that meaning does not depend on color or hover.

**Delivery Record:** **Route/User Value:** trustworthy visualization. **Owned Surface:** shared chart frame/evidence/responsive adapters and inventoried shared chart frame. **Shared Dependencies:** 166.1–166.6. **Allowed Change Surface:** product chart compositions/tests. **Forbidden Shared Files:** route calculations/charts, filters/tables, APIs. **State Coverage:** loading/empty/unavailable/partial/stale/error/rendered/selected/comparison/target/forecast/confidence. **Responsive/Table/Chart Contract:** measured chart plus summary/data alternative; preserve Recharts/lazy behavior. **Accessibility Contract:** non-color series, reduced motion, no hover-only essentials. **Test and Visual Evidence:** dense legends/negative/touch/narrow/theme fixtures. **Local Validation:** targeted chart/shared-consumer tests plus universal checks. **Branch/Worktree Lifecycle:** `cdx/epic-166-story-7-chart-evidence`. **Cleanup Evidence:** consumer inventory and unchanged-calculation proof.

**Acceptance Criteria:** **Given** existing charts **when** they adopt ChartFrame/Evidence **then** title, period, units, legend, tooltip precision, state, accessible summary, and data alternative are consistent **and** domain series construction and drill-down behavior remain unchanged.

### Story 166.8: Standardize Page States, Async Results, Contextual Detail, and Global Not Found

**Requirements:** FR20, FR28, FR33

As a user encountering missing data or processing, I want honest state and recovery patterns, so that I know what is trustworthy and what to do next.

**Delivery Record:** **Route/User Value:** understandable states and partial outcomes. **Owned Surface:** PageState, AsyncOperationStatus, BulkResultSummary, ContextualSplitView, global `not-found.tsx`, tests/examples. **Shared Dependencies:** 166.1–166.7. **Allowed Change Surface:** these compositions/global not-found only. **Forbidden Shared Files:** route mutations/retry rules/APIs/AppShell. **State Coverage:** universal states plus queued/cancellable/non-cancellable/partial/retrying/expired/no-selection/detail-error. **Responsive/Table/Chart Contract:** split list/detail becomes explicit mobile flow; failed tables use 166.6. **Accessibility Contract:** proportional announcements, bounded focus, deterministic open/close/recovery. **Test and Visual Evidence:** state/partial/retry/focus/not-found/split-view matrix. **Local Validation:** targeted tests plus universal checks. **Branch/Worktree Lifecycle:** `cdx/epic-166-story-8-states-async`. **Cleanup Evidence:** single not-found owner and non-toast partial proof.

**Acceptance Criteria:** **Given** route/section and long-running-operation states **when** the shared patterns render **then** data trust, scope, cancellability, safe-leave, attempted/succeeded/failed/skipped/pending results, retry scope, and next action are explicit **and** route/domain owners retain mutation semantics.

## Epic 167-FE: Consistent AppShell, Authentication, and First-Time Value

### Story 167.1: Unify Protected AppShell and Desktop/Mobile Navigation

**Requirements:** FR2, FR9, FR32

As an authenticated user, I want one stable shell and navigation model, so that security, cabinet, route, theme, and focus context persist.

**Delivery Record:** **Route/User Value:** all protected routes. **Owned Surface:** dashboard layout, Sidebar/Navbar/mobile Sheet, shared navigation model, cabinet/badge/theme/token-gate shell components/tests. **Shared Dependencies:** Epic 166-FE. **Allowed Change Surface:** AppShell/navigation files only. **Forbidden Shared Files:** tokens/primitives/product compositions/route content/auth contracts. **State Coverage:** hydration/auth/redirect/session expiry/navigation/badge/cabinet/theme. **Responsive/Table/Chart Contract:** desktop persistent, mobile Sheet, exactly one scroll owner. **Accessibility Contract:** skip link/landmarks/current route/Sheet focus and return. **Test and Visual Evidence:** shell tests plus login-dashboard/mobile e2e and theme/width screenshots. **Local Validation:** targeted shell tests/e2e plus universal checks. **Branch/Worktree Lifecycle:** `cdx/epic-167-story-1-appshell`, exclusive shell writer. **Cleanup Evidence:** consolidated navigation proof plus universal cleanup.

**Acceptance Criteria:** **Given** auth and responsive navigation states **when** the shell resolves **then** protected content never flashes, redirects remain correct, desktop/mobile consume one model, role/badges/active route/cabinet/theme remain intact, one scroll owner remains **and** mobile close/Escape/focus return work.

### Story 167.2: Migrate Root Entry `/`

**Requirements:** FR2, FR9, FR27

As a visitor, I want `/` to route me correctly without exposing protected content, so that entry is predictable and secure.

**Delivery Record:** **Route/User Value:** `/` redirect. **Owned Surface:** `src/app/page.tsx` and tests. **Shared Dependencies:** 166-FE, 167.1, auth store/routes. **Allowed Change Surface:** route/test only. **Forbidden Shared Files:** auth store/provider/middleware/AppShell/primitives. **State Coverage:** hydrating/authenticated redirect/unauthenticated redirect/failure. **Responsive/Table/Chart Contract:** centered status reflows without scroll conflict. **Accessibility Contract:** restrained named status, no focus theft. **Test and Visual Evidence:** exactly-once redirect tests/e2e/theme. **Local Validation:** targeted tests plus universal. **Branch/Worktree Lifecycle:** `cdx/epic-167-story-2-root-entry`. **Cleanup Evidence:** redirect assertions and universal cleanup.

**Acceptance Criteria:** **Given** resolving, valid, or absent auth **when** `/` loads **then** it shows a bounded state and redirects exactly once to the established dashboard or `/login` **and** no auth/session behavior changes.

### Story 167.3: Migrate Login `/login`

**Requirements:** FR1, FR2, FR27

As a registered user, I want clear sign-in validation and recovery, so that I safely return to my intended destination.

**Delivery Record:** **Route/User Value:** `/login`. **Owned Surface:** login route, `LoginForm`, tests. **Shared Dependencies:** 166-FE and auth contracts. **Allowed Change Surface:** route/form/tests. **Forbidden Shared Files:** auth API/store/provider/middleware/routes/primitives/registration. **State Coverage:** default/invalid/credential/network/submitting/success/session-expired. **Responsive/Table/Chart Contract:** constrained form/full-width mobile action. **Accessibility Contract:** labels/errors/password/focus/logical order. **Test and Visual Evidence:** login tests and login-dashboard e2e across themes/widths. **Local Validation:** targeted tests plus universal. **Branch/Worktree Lifecycle:** `cdx/epic-167-story-3-login`. **Cleanup Evidence:** retained-input/redirect/privacy proof.

**Acceptance Criteria:** **Given** valid or invalid credentials and recoverable failures **when** the route is migrated **then** JWT/session and destination behavior remain unchanged, safe input is retained, feedback is associated, duplicate submission is prevented **and** keyboard/touch completion works.

### Story 167.4: Migrate Registration `/register`

**Requirements:** FR1, FR27

As a new seller, I want understandable account creation, so that I can begin onboarding without losing valid input.

**Delivery Record:** **Route/User Value:** `/register`. **Owned Surface:** register route, `RegistrationForm`, tests. **Shared Dependencies:** 166-FE and registration contracts. **Allowed Change Surface:** route/form/tests. **Forbidden Shared Files:** auth API/store/schema/primitives/login/onboarding. **State Coverage:** default/invalid/duplicate/network/submitting/success. **Responsive/Table/Chart Contract:** comfortable responsive form. **Accessibility Contract:** visible labels/errors/focus/submitting/login link. **Test and Visual Evidence:** register tests/onboarding e2e/themes. **Local Validation:** targeted tests plus universal. **Branch/Worktree Lifecycle:** `cdx/epic-167-story-4-register`. **Cleanup Evidence:** retained-input and duplicate-submit proof.

**Acceptance Criteria:** **Given** valid, duplicate, invalid, or network cases **when** registration is migrated **then** account creation and next navigation remain unchanged, feedback is actionable, input persists, duplicates are prevented **and** login navigation remains semantic.

### Story 167.5: Migrate Cabinet Onboarding `/cabinet`

**Requirements:** FR3, FR27

As a new seller, I want clear first-cabinet creation, so that I can proceed to WB token setup confidently.

**Delivery Record:** **Route/User Value:** `/cabinet`. **Owned Surface:** route, `CabinetCreationForm` presentation/validation/recovery outside 167.9's exact typed-result consumer hunk, shared onboarding-guard presentation/tests. **Shared Dependencies:** 166-FE; merged Stories 167.8 and 167.9. **Allowed Change Surface:** route/form and behavior-locked guard integration while preserving 167.9's `applied | stale | indeterminate` consumer seam from `main`. **Forbidden Shared Files:** cabinet APIs/stores/schema/primitives/other onboarding routes; shared conditional settlement and its exact form consumer hunk remain owned by 167.9. **State Coverage:** guard/default/invalid/submitting/server/network/success. **Responsive/Table/Chart Contract:** focused form/visible step. **Accessibility Contract:** labels/errors/redirect status/focus. **Test and Visual Evidence:** cabinet/guard/onboarding tests/themes, including integrated A/B late-settlement proof. **Local Validation:** targeted tests plus universal. **Branch/Worktree Lifecycle:** `cdx/epic-167-story-5-cabinet`, preserved active worktree aligned safely after 167.8/167.9 merge; no destructive reset/rebase. **Cleanup Evidence:** guard consumer inventory and transition proof.

**Acceptance Criteria:** **Given** valid, invalid, existing, or failed cabinet states **when** migrated **then** creation contract, safe input retention, current-step recovery, and next transition remain unchanged **and** `/wb-token` consumes the guard without editing it.

### Story 167.6: Migrate Processing `/processing`

**Requirements:** FR3, FR5, FR27

As a seller waiting for data, I want truthful progress and safe-leave recovery, so that I know when useful data is ready.

**Delivery Record:** **Route/User Value:** `/processing`. **Owned Surface:** route, `ProcessingStatus` tree/tests. **Shared Dependencies:** merged Story 167.5, which transitively requires 167.8 and 167.9. **Allowed Change Surface:** presentation/tests. **Forbidden Shared Files:** polling/API/store/primitives/other onboarding. **State Coverage:** queued/running/progress/refresh/stale/safe-leave/failure/network/retry/complete. **Responsive/Table/Chart Contract:** readable motion-independent progress. **Accessibility Contract:** progress values, restrained live regions, reduced motion. **Test and Visual Evidence:** polling/exactly-once transition and onboarding e2e/screenshots. **Local Validation:** targeted tests plus universal. **Branch/Worktree Lifecycle:** `cdx/epic-167-story-6-processing`. **Cleanup Evidence:** no duplicate requests and transition proof.

**Acceptance Criteria:** **Given** running, failed, uncertain, or complete processing **when** the route is migrated **then** polling cadence, stage/progress, safe-leave, recovery, and next navigation remain correct without misleading zeros or duplicate requests **and** completed onboarding state is retained.

### Story 167.7: Migrate WB Token `/wb-token`

**Requirements:** FR3, FR4, FR27

As a seller, I want precise token validation and recovery, so that I connect my cabinet without exposing credentials.

**Delivery Record:** **Route/User Value:** `/wb-token`. **Owned Surface:** route, `WbTokenForm`/helpers/tests. **Shared Dependencies:** merged guard owner Story 167.5, which transitively requires 167.8 and 167.9. **Allowed Change Surface:** route/form presentation/tests. **Forbidden Shared Files:** token API/store/security/guard/primitives/other onboarding. **State Coverage:** guard/default/malformed/rejected/permission/network/submitting/success. **Responsive/Table/Chart Contract:** safe readable mobile form. **Accessibility Contract:** labels/instructions/error/focus/secret semantics. **Test and Visual Evidence:** synthetic token tests/onboarding e2e/privacy scan/themes. **Local Validation:** targeted tests plus universal. **Branch/Worktree Lifecycle:** `cdx/epic-167-story-7-wb-token`. **Cleanup Evidence:** privacy and transition proof.

**Acceptance Criteria:** **Given** valid, malformed, rejected, permission, network, or expired-session cases **when** migrated **then** validation/storage/transition semantics remain unchanged, input is handled safely, duplicates are prevented, no token leaks **and** the shared guard is consumed without modification.

### Story 167.8: Establish Authoritative Cabinet Session Reconciliation and Create-Idempotency Contracts

**Requirements:** FR1, FR2, FR3, FR18, FR19

As a seller creating a cabinet, I want repeated or uncertain submissions to reconcile to one account-bound operation, so that transport ambiguity cannot create duplicate cabinets or expose another account's state.

**Delivery Record:** **Route/User Value:** non-route prerequisite for safe cabinet onboarding. **Owned Surface:** backend cabinet/auth domain contract, DTOs, controller/service/module wiring, Prisma schema and migration, OpenAPI/API-path documentation, and direct unit/integration/e2e contract tests. **Shared Dependencies:** current backend `main`; no frontend Story prerequisite. **Allowed Change Surface:** backend cabinet/auth/domain files required to freeze and implement durable account-scoped idempotent create and authoritative operation lookup, plus database constraints, tests, and API documentation. **Forbidden Shared Files:** frontend repository, unrelated pricing/reporting domains, production/deploy configuration, unrelated package changes. **State Coverage:** unknown/in-progress/succeeded/failed, repeat-same-payload, same-key-different-payload, late/repeated transport outcome, unauthorized and cross-account lookup. **Responsive/Table/Chart Contract:** not applicable; non-route contract Story with no route-ledger row. **Accessibility Contract:** not applicable to backend UI; error/state semantics must remain explicit for consumers. **Test and Visual Evidence:** RED-first unit/integration/e2e/OpenAPI assertions; database uniqueness/account-binding/audit proof. **Local Validation:** backend format-check, lint-check, type-check, unit/e2e, build, endpoint-drift, and docs validation. **Branch/Worktree Lifecycle:** backend repository branch `cdx/epic-167-story-8-cabinet-reconciliation-contract`, worktree `/private/tmp/wb-be-167-8-cabinet-reconciliation-contract`; hard-stop on true overlap or record a freshly rechecked non-overlapping hunk reservation. **Cleanup Evidence:** exact backend merge SHA, ancestry on current backend `main`, local/remote branch absence, worktree removal/prune proof; frontend coordination artifacts may not infer these states.

**Acceptance Criteria:** **Given** an authenticated account starts or repeats cabinet creation with an operation/idempotency key **when** requests are retried, delayed, or reconciled **then** authentication and account binding come only from the JWT; the same account, key, and payload resolve to one canonical operation/cabinet; a different payload for the same key fails deterministically; unknown, in-progress, succeeded, and failed states are explicit; another account cannot discover the operation **and** repeated or late transport outcomes cannot create another cabinet. The executable API path and schema are frozen in RED tests and OpenAPI before production code rather than guessed in planning prose.

### Story 167.9: Enforce Account-Scoped Conditional Cabinet Settlement

**Requirements:** FR1, FR2, FR3, FR19, NFR5, NFR6

As a user who may switch accounts while cabinet creation is pending, I want late results settled only into their initiating session, so that stale work from account A cannot alter live account B or drive B's UI.

**Delivery Record:** **Route/User Value:** non-route shared frontend prerequisite for safe `/cabinet` onboarding. **Owned Surface:** shared cabinet service, API helper/client immutable request-context plumbing, auth/session conditional-settlement helpers, login/session/guard coordination, typed `applied | stale | indeterminate` result, and the smallest reviewed `CabinetCreationForm` consumer seam/direct test. **Shared Dependencies:** merged Story 167.8 real backend contract. **Allowed Change Surface:** inventoried shared cabinet/auth/API/session files, direct contract/privacy tests, and only the exact consumer seam that permits existing success effects for `applied` while suppressing stale/indeterminate effects. **Forbidden Shared Files:** Story 167.5 route, form presentation/validation, recovery-marker implementation, unrelated form behavior, other route UI, tokens/primitives/AppShell, backend repository, unrelated stores/services. **State Coverage:** A pending, A→B, A→B→A, logout/login, stale success/failure, authoritative unknown/in-progress/succeeded/failed reconciliation, same/different operation, missing live session. **Responsive/Table/Chart Contract:** not applicable; non-route shared behavior Story. **Accessibility Contract:** stale/indeterminate results produce no toast, navigation, reset, marker clear, or error UI for another live account. **Test and Visual Evidence:** honest RED-first shared service/API/auth/consumer tests, real merged 167.8 contract integration proof, and recovery-marker privacy scans. **Local Validation:** targeted Vitest, format-check, lint, type-check, max-lines, build, and `git diff --check`. **Branch/Worktree Lifecycle:** frontend branch `cdx/epic-167-story-9-account-scoped-cabinet-settlement`, worktree `/private/tmp/wb-fe-167-9-account-scoped-cabinet-settlement`; this seam is a known overlap with the preserved Story 167.5 refactor, so 167.9 merges first and Story 167.5 alignment must port/preserve the behavior into `useCabinetCreateMutation`, rerun targeted stale/indeterminate tests, and obtain fresh independent review. **Cleanup Evidence:** merge SHA plus local/remote branch and worktree absence.

**Acceptance Criteria:** **Given** account A initiates cabinet creation and the live account/session changes before settlement **when** success, failure, or reconciliation arrives **then** the immutable initiating request context reaches transport; auth/cabinet state changes only if the expected live account/session/operation still matches; the shared boundary returns `applied | stale | indeterminate`; only `applied` may continue existing success effects in the minimal form consumer hunk; stale/indeterminate cannot mutate B or produce toast/navigation/reset/marker-clear/error effects; recovery markers contain no password, token, cabinet payload, or email; route/presentation/validation/recovery implementation remains Story 167.5-owned **and** GREEN evidence consumes the real merged Story 167.8 contract rather than a mock-only reconciliation endpoint.

## Epic 168-FE: Trustworthy Analytics Core and Financial Decisions

### Story 168.1: Migrate Analytics Hub `/analytics` and Own Analytics-Shared UI

**Requirements:** FR6, FR7, FR8, FR15, FR27

As an owner or finance user, I want a trustworthy analytics hub, so that I can select workflows and inspect summaries consistently.

**Delivery Record:** **Route/User Value:** `/analytics` and analytics-shared ownership. **Owned Surface:** root analytics components/shared directory, financial summary, multi-route VariantTable/ExportDialog only after consumer inventory, tests. **Shared Dependencies:** 166-FE/167.1. **Allowed Change Surface:** inventoried root/shared analytics UI. **Forbidden Shared Files:** foundation/AppShell/child routes/APIs/calculations. **State Coverage:** token-required/loading/refresh/empty/widget-degraded/error/stale/partial/period modes. **Responsive/Table/Chart Contract:** grouped hub; financial table metric primary and bounded comparisons; chart evidence. **Accessibility Contract:** heading/group navigation/table/chart. **Test and Visual Evidence:** hub/financial-summary tests/e2e/themes/widths. **Local Validation:** targeted plus universal. **Branch/Worktree Lifecycle:** `cdx/epic-168-story-1-analytics-hub`, exclusive analytics-shared writer. **Cleanup Evidence:** machine-readable consumer/owner inventory.

**Acceptance Criteria:** **Given** hub, financial, marketing, period, availability, and error states **when** migrated **then** data/query/formatting/navigation behavior remains unchanged **and** every ≥2-route analytics component has this or another already-merged explicit owner.

### Story 168.2: Migrate Analytics Alerts `/analytics/alerts`

**Requirements:** FR6, FR7, FR8, FR15, FR27

As an authorized user, I want consistent alert history and rules, so that I can understand exceptions and maintain thresholds safely.

**Delivery Record:** **Route/User Value:** alerts summary/rules/history/CRUD. **Owned Surface:** alerts route/components/tests. **Shared Dependencies:** 166-FE/167.1/168.1. **Allowed Change Surface:** route tree only. **Forbidden Shared Files:** foundation/shared/APIs/roles. **State Coverage:** loading/refresh/empty/filtered/error/permission/dialog validation/writeback/unknown. **Responsive/Table/Chart Contract:** title/message and rule name/status/action primary columns. **Accessibility Contract:** tabs/role messaging/dialog/errors/entity actions. **Test and Visual Evidence:** AlertsPage and alerts e2e/screenshots. **Local Validation:** targeted plus universal. **Branch/Worktree Lifecycle:** `cdx/epic-168-story-2-alerts`. **Cleanup Evidence:** role/dialog proof.

**Acceptance Criteria:** **Given** alert and rule states **when** migrated **then** queries, roles, statuses, threshold validation, confirmation, invalidation, and recovery remain correct **and** narrow tables preserve identity, severity/date, and actions.

### Story 168.3: Migrate Analytical Dashboard `/analytics/dashboard`

**Requirements:** FR6, FR7, FR8, FR15, FR27

As an owner or CFO, I want a trustworthy cabinet dashboard, so that headline, product, brand, and P&L evidence remain traceable.

**Delivery Record:** **Route/User Value:** summary/top products/top brands/P&L. **Owned Surface:** dashboard analytics route plus exclusive top-table/waterfall trees/tests. **Shared Dependencies:** foundation/AppShell/hub and shared periods/states. **Allowed Change Surface:** owned route/exclusive components. **Forbidden Shared Files:** shared selectors, `/dashboard`, APIs/calculations. **State Coverage:** load/refresh/no cabinet/token/empty/incomplete/pending/error/stale/partial. **Responsive/Table/Chart Contract:** product/brand/financial-line primary columns and waterfall evidence. **Accessibility Contract:** named tables/actions/status/chart alternative. **Test and Visual Evidence:** dashboard tests/e2e and high-risk states. **Local Validation:** targeted plus universal. **Branch/Worktree Lifecycle:** `cdx/epic-168-story-3-analytics-dashboard`. **Cleanup Evidence:** metric/table/chart parity.

**Acceptance Criteria:** **Given** complete, partial, pending, or failed sections **when** migrated **then** metrics, periods, availability, top rankings, P&L, navigation, and recovery remain correct **and** one failed section does not hide valid evidence.

### Story 168.4: Migrate Finance History `/analytics/finance-history`

**Requirements:** FR6, FR7, FR8, FR15, FR27

As a CFO, I want clear weekly history, so that financial changes retain period, units, and precision.

**Delivery Record:** **Route/User Value:** multi-week finance table. **Owned Surface:** finance-history route and exclusive table/tests. **Shared Dependencies:** foundation/AppShell/hub. **Allowed Change Surface:** owned route/tree. **Forbidden Shared Files:** shared selectors/formatters/APIs. **State Coverage:** load/success/no weeks/empty/error/partial/large/negative/zero/missing. **Responsive/Table/Chart Contract:** metric primary/sticky; chronological week columns in named bounded scroll. **Accessibility Contract:** headers/scroll name/back semantics. **Test and Visual Evidence:** finance-history tests/e2e/dense themes. **Local Validation:** targeted plus universal. **Branch/Worktree Lifecycle:** `cdx/epic-168-story-4-finance-history`. **Cleanup Evidence:** chronology/precision proof.

**Acceptance Criteria:** **Given** historical ranges **when** migrated **then** selection limits, ordering, grouping, units, signs, zero/missing, and recovery remain unchanged **and** dense horizontal comparison preserves metric identity.

### Story 168.5: Migrate Orders Analytics `/analytics/orders`

**Requirements:** FR6, FR7, FR8, FR15, FR27

As an owner, I want preserved overview/trend/seasonality/comparison context, so that order behavior remains understandable.

**Delivery Record:** **Route/User Value:** four analytical tabs/date context. **Owned Surface:** orders analytics route and confirmed exclusive charts/tables/tests. **Shared Dependencies:** foundation/AppShell/hub/date controls. **Allowed Change Surface:** owned route/exclusive components. **Forbidden Shared Files:** shared controls/frame/APIs/URL contract. **State Coverage:** suspense/update/tab-specific empty/error/partial/invalid URL/comparison unavailable. **Responsive/Table/Chart Contract:** metric/current/previous/change primary evidence; accessible charts. **Accessibility Contract:** tabs/date/sort/chart alternatives. **Test and Visual Evidence:** route and FBS-orders analytics e2e. **Local Validation:** targeted plus universal. **Branch/Worktree Lifecycle:** `cdx/epic-168-story-5-orders-analytics`. **Cleanup Evidence:** URL/tab/date parity.

**Acceptance Criteria:** **Given** valid/invalid tab and date parameters plus route states **when** migrated **then** defaults, browser history, queries, units, COGS meaning, comparisons, charts, and recovery remain unchanged **and** essential values do not require hover.

### Story 168.6: Migrate Pricing Analytics `/analytics/pricing`

**Requirements:** FR6, FR7, FR8, FR15, FR27

As a seller, I want clear current/break-even/recommended pricing evidence, so that I identify opportunities without changing pricing logic.

**Delivery Record:** **Route/User Value:** pricing summary/filters/table/history/elasticity Sheet. **Owned Surface:** pricing route tree/tests. **Shared Dependencies:** foundation/AppShell/hub. **Allowed Change Surface:** owned route. **Forbidden Shared Files:** shared/APIs/recommendation calculations. **State Coverage:** load/refresh/empty/filtered/error/partial/Sheet states/large-negative. **Responsive/Table/Chart Contract:** product primary; price/gap/margin/action reachable; Sheet/chart evidence. **Accessibility Contract:** filters/row action/Sheet focus/chart alternative. **Test and Visual Evidence:** pricing tests/e2e/themes. **Local Validation:** targeted plus universal. **Branch/Worktree Lifecycle:** `cdx/epic-168-story-6-pricing`. **Cleanup Evidence:** price/margin/Sheet parity.

**Acceptance Criteria:** **Given** pricing rows and detail states **when** migrated **then** filters, recommendation/break-even values, units, zero/missing, selected SKU, focus/return, and recovery remain correct **and** algorithms are untouched.

### Story 168.7: Migrate Product Analytics `/analytics/product/[nmId]`

**Requirements:** FR6, FR7, FR8, FR15, FR27

As an analyst, I want stable product overview/advertising/organic/funnel/variant context, so that drivers remain traceable.

**Delivery Record:** **Route/User Value:** dynamic product analytics tabs. **Owned Surface:** product dynamic route/tests. **Shared Dependencies:** foundation/AppShell/hub-owned VariantTable/date/chart. **Allowed Change Surface:** owned route only. **Forbidden Shared Files:** shared tables/controls/frames/APIs/types. **State Coverage:** parameter load/invalid/not-found/tab load/empty/error/partial/date update/long product. **Responsive/Table/Chart Contract:** variant identity/metrics/actions and chart evidence. **Accessibility Contract:** dynamic heading/tabs/table/chart/focus. **Test and Visual Evidence:** product analytics e2e all tabs. **Local Validation:** targeted plus universal. **Branch/Worktree Lifecycle:** `cdx/epic-168-story-7-product-detail`. **Cleanup Evidence:** nmId/tab/date parity.

**Acceptance Criteria:** **Given** valid or invalid nmId and all tabs **when** migrated **then** parameter, product/date/tab/query, not-found, chart, variant, and recovery behavior remain unchanged **and** shared owned files are only consumed.

### Story 168.8: Migrate Reorder Analytics `/analytics/reorder`

**Requirements:** FR6, FR7, FR8, FR15, FR27

As an operations user, I want clear reorder quantities, deadlines, value, and status, so that replenishment remains trustworthy.

**Delivery Record:** **Route/User Value:** filters/summary/recommendation table/actions. **Owned Surface:** reorder route/tests. **Shared Dependencies:** foundation/AppShell/hub. **Allowed Change Surface:** owned route. **Forbidden Shared Files:** shared/APIs/recommendation logic. **State Coverage:** load/refresh/empty/filtered/error/partial/status variants/large amount. **Responsive/Table/Chart Contract:** article primary; quantity/stock/deadlines/amount/status/action reachable. **Accessibility Contract:** filters/status/date/amount/entity actions. **Test and Visual Evidence:** reorder tests/e2e. **Local Validation:** targeted plus universal. **Branch/Worktree Lifecycle:** `cdx/epic-168-story-8-reorder`. **Cleanup Evidence:** recommendation/status parity.

**Acceptance Criteria:** **Given** recommendation and route states **when** migrated **then** query/filter/count/total/quantity/stock/source/dates/amount/status/actions remain unchanged **and** filtered/empty/narrow scope stays explicit.

### Story 168.9: Migrate SKU Analytics `/analytics/sku`

**Requirements:** FR6, FR7, FR8, FR15, FR27

As a CFO, I want precise SKU margin/cash-flow/contribution/variant evidence, so that profitable and loss-making products are accurate.

**Delivery Record:** **Route/User Value:** URL filters/grouping/dense financial tables/export. **Owned Surface:** SKU route plus exclusive `SkuFinancialsTable` tree/tests. **Shared Dependencies:** foundation/AppShell/hub-owned VariantTable/ExportDialog and shared selectors. **Allowed Change Surface:** owned route/exclusive table. **Forbidden Shared Files:** shared/APIs/calculations/formatting. **State Coverage:** suspense/weeks/data/refresh/empty/filtered/missing COGS/stale/partial/group/export. **Responsive/Table/Chart Contract:** article identity; financial core/status/variant/actions; explicit dense overflow/detail. **Accessibility Contract:** sorting/definitions/totals/group/export focus. **Test and Visual Evidence:** SKU unit and multiple e2e specs/high-risk screenshots. **Local Validation:** targeted plus universal. **Branch/Worktree Lifecycle:** `cdx/epic-168-story-9-sku`. **Cleanup Evidence:** totals/sort/export parity.

**Acceptance Criteria:** **Given** current URL, periods, grouping, tables, variants, and export **when** migrated **then** queries, calculations, totals, precision, zero/missing, historical state, and export scope remain correct **and** shared hub-owned components are not edited.

### Story 168.10: Migrate Time-Period Analytics `/analytics/time-period`

**Requirements:** FR6, FR7, FR8, FR15, FR27

As a finance user, I want clear margin trends across periods, so that profitability change retains correct meaning.

**Delivery Record:** **Route/User Value:** period selector and margin trend. **Owned Surface:** route plus exclusive MarginTrendChart/tests. **Shared Dependencies:** foundation/AppShell/hub/chart contract. **Allowed Change Surface:** owned route/chart. **Forbidden Shared Files:** shared controls/frame/APIs/series calculations. **State Coverage:** periods/load/refresh/empty/error/partial/stale/positive-negative-zero. **Responsive/Table/Chart Contract:** measured chart and textual/data evidence. **Accessibility Contract:** named selector/non-color/no-hover chart. **Test and Visual Evidence:** page/chart tests/time-period e2e. **Local Validation:** targeted plus universal. **Branch/Worktree Lifecycle:** `cdx/epic-168-story-10-time-period`. **Cleanup Evidence:** period/tooltip parity.

**Acceptance Criteria:** **Given** all supported periods and route states **when** migrated **then** selection/query/labels/series/legend/tooltip/precision/recovery remain unchanged **and** the chart is usable without hover or color alone.

### Story 168.11: Migrate Unit Economics `/analytics/unit-economics`

**Requirements:** FR6, FR7, FR8, FR15, FR27

As an owner or CFO, I want precise per-SKU economics and waterfall evidence, so that margin drivers remain trustworthy.

**Delivery Record:** **Route/User Value:** filters/pagination/sort/table/export/waterfall. **Owned Surface:** complete unit-economics route/tests. **Shared Dependencies:** foundation/AppShell/hub/shared profitability/chart. **Allowed Change Surface:** owned route only. **Forbidden Shared Files:** shared/APIs/types/calculations. **State Coverage:** load/refresh/empty/filtered/error/partial/pagination/sort/filter/waterfall/export/large-negative. **Responsive/Table/Chart Contract:** article primary, profitability/status/actions; explicit dense table; waterfall evidence. **Accessibility Contract:** sorting/pagination/full units/status/chart. **Test and Visual Evidence:** unit-economics and waterfall e2e/high-risk matrix. **Local Validation:** targeted plus universal. **Branch/Worktree Lifecycle:** `cdx/epic-168-story-11-unit-economics`. **Cleanup Evidence:** calculation/delivery-cost/pagination/waterfall parity.

**Acceptance Criteria:** **Given** all filters, rows, pagination, export, and waterfall states **when** migrated **then** queries, calculations, delivery-cost merge, units, signs, percentages, zero/missing, sorting, and export remain correct **and** dense responsive/accessibility contracts are proven.

## Detailed Normative Contract Aliases for Stories 169–171

Every Story below incorporates these contracts in full. A route-specific clause narrows or adds requirements; it never weakens these common contracts.

### C1 — Migration and behavior preservation

Migrate the route entry and its complete owned render tree to the merged Epic 166-FE semantic-token/shadcn product compositions and the merged Epic 167-FE AppShell. Preserve current backend endpoints, headers, request/response interpretation, query keys, cache invalidation, polling, calculations, URL/search parameters, deep links, cabinet/period/comparison context, Russian terminology, RUB/percentage/date/ISO-week formatting, permissions, export and mutation behavior. Do not introduce a UI dependency, generic DataTable, backend change, or product redesign.

### C2 — Shared dependencies and ownership boundary

Shared dependencies are read-only consumers: Epic 166-FE tokens, primitives, `PageHeader`, `ContextBar`, `FilterToolbar`, `MetricGroup`/`MetricCard`, `ResponsiveTable`, `ChartFrame`/`ChartEvidence`, `PageState`, `StatusBadge`/`StatusStrip`, `FinancialValue`/`DataAvailability`, `AsyncOperationStatus`, `BulkResultSummary`, and `ContextualSplitView`; Epic 167-FE AppShell/navigation; existing route hooks, API clients, formatters, types, and stores. A component with two or more route consumers is not silently edited: stop that edit, record the need, and route it to its explicit shared owner/prerequisite Story.

### C3 — Forbidden Shared Files (FS)

Unless a Story explicitly lists an exception, forbidden files are: `package.json`, `package-lock.json`, `components.json`, `tailwind.config.ts`, `src/styles/globals.css`, `src/components/ui/**`, AppShell/sidebar/navbar/navigation files, cross-route product compositions, `src/app/(dashboard)/analytics/shared/**`, `src/hooks/**`, `src/lib/api/**`, `src/lib/api-client.ts`, `src/lib/routes.ts`, `src/types/**`, `src/stores/**`, canonical BMAD planning artifacts, route ledger, and every other Story's owned route tree. Shared-file needs require orchestration; they are not absorbed into the route diff.

### C4 — State coverage (SC)

Verify default success, initial structural loading, background refresh with usable content retained, global empty, filtered-empty with visible reset, recoverable error and retry, stale, partial, permission-restricted, and route-appropriate processing/success states. Verify realistic long Russian labels, zero versus missing/not-calculated/unavailable, large and negative values, and unknown backend status fallback. Only applicable states need production fixtures, but every listed state must be dispositioned as tested, intentionally not applicable with evidence, or blocked by an explicit validation gap.

### C5 — Responsive, table, and chart baseline (RTC)

Verify at `320`, `390`, `768`, `1024`, `1280`, and `1440+` px and between breakpoints, in light and dark themes and at 200% zoom. Preserve one AppShell scroll owner, semantic DOM/reading order, 44×44 primary mobile targets, no required hover, and no accidental clipping. Each table has an accessible name/caption, primary identifier, numeric alignment/precision, sortable-header semantics, selection scope, named row actions, state rows, pagination/virtualization behavior, and deliberate narrow-width strategy. Each chart has title, period, units, series/legend meaning, registered tokens, consistent tooltip precision, freshness/state, accessible summary and data alternative, responsive containment, reduced motion, and context-preserving drill-down.

### C6 — Accessibility contract (AX)

Meet WCAG 2.2 AA target: one meaningful `h1`, logical headings and landmarks, skip-link compatibility, complete keyboard path, visible focus in both themes, accessible names/roles/values, programmatic sort/selection/expanded/current/progress states, non-color status/series meaning, contrast of 4.5:1 normal text and 3:1 applicable large/non-text UI, restrained live-region announcements, and correct overlay initial focus, containment, Escape, dismissal, and focus return. Automated axe results supplement manual keyboard, focus, reading-order, data-meaning, zoom, and responsive review; zero automated violations alone is insufficient.

### C7 — Local validation commands (VC)

Use Node `24.18.0` and npm `11.11.0`. Run, capture exit codes, and retain complete failure output:

```bash
npx vitest run "$STORY_TEST_TARGET"
npm run lint
npm run type-check
npm run check:max-lines
npm run build
npm run test:e2e -- --grep "Story $STORY_ID-FE"
```

Add or update route-focused Vitest and Playwright coverage inside the Allowed Change Surface before relying on the targeted commands. Any unavailable browser/backend environment is recorded as a gap, never claimed as passed.

### C8 — Visual and test evidence (VE)

Attach before/after or approved-baseline evidence for default success in both themes, plus route-risk screenshots for loading/refresh, empty/filtered-empty, error/recovery, stale/partial/permission, long Russian content, and large/negative values. Include viewport labels, deterministic fixture/cabinet/period, axe output, keyboard/focus checklist, table/chart semantic alternative evidence, targeted test output, lint/type-check/max-lines/build output, and a diff review confirming no business-data or formatting change.

### C9 — Branch/worktree lifecycle (BLC)

Create the named `cdx/epic-{epic}-story-{story}-{slug}` branch in a dedicated temporary worktree from the current merged Epic 166-FE + 167-FE prerequisite base. Validate locally; commit; push the feature branch; open/review/merge its PR into `main` without direct or force push; delete remote and local feature branches; remove the temporary worktree; run `git worktree prune`. Dependent Stories start only from the newly merged prerequisite base, never a stale sibling branch.

### C10 — Mandatory cleanup evidence (CE)

Before close, provide: `git diff --check`; final `git status --short`; an Allowed Change Surface file list; scoped audits for raw interactive controls, hardcoded palette/hex/light-only styling, duplicated legacy wrappers, and obsolete route-only variants; a list of removed items and justified retained specialized components; no orphaned tests/snapshots; PR merge SHA; remote/local branch deletion proof; and post-removal `git worktree list` proof showing the temporary worktree is absent. Report route-ledger evidence to the Epic 174-FE owner; do not edit the shared ledger from this Story.

### C11 — No production scope (NP)

No deployment, production infrastructure/configuration, production data operations, required CI gate, direct push to `main`, force push, or backend contract change is authorized. Local frontend `localhost:3100` and backend `localhost:3000` validation only.

---

## Epic 169-FE: Accessible Operational Analytics and Exception Triage

### Story 169.1: Migrate Acquiring Report Index

**Requirements:** FR16, FR27

**Route/User Value:** As a finance/operations user, I want `/analytics/acquiring` to present acquiring totals, VAT anomalies, rate limits, and report rows consistently, so that I can identify the report and period needing investigation.

**Owned Surface:** `/analytics/acquiring`; `src/app/(dashboard)/analytics/acquiring/page.tsx`, root `components/AcquiringPageContent.tsx`, `AcquiringSummaryCards.tsx`, `AcquiringReportsTable.tsx`, `components/shared/AcquiringRateLimitBanner.tsx`, `components/shared/AnomalyVatIndicator.tsx`, and colocated tests. Nested `period/**` and `reports/**` are excluded. This Story owns the two acquiring-shared presentation components for Stories 169.2–169.3.

**Shared Dependencies:** C2; existing acquiring queries/contracts; Stories 169.2–169.3 consume the shared banner/indicator only after this Story merges.

**Allowed Change Surface:** Only the owned files above and new route-focused tests/evidence fixtures colocated under the acquiring root.

**Forbidden Shared Files:** FS, plus nested `acquiring/period/**` and `acquiring/reports/**`.

**Acceptance criteria:**

1. **Given** the existing report data and cabinet context, **when** the route is migrated, **then** summary definitions, report periods/IDs, totals, VAT anomaly meaning, rate-limit recovery, navigation targets, sorting/pagination/export behavior, and zero/missing semantics are unchanged under the shared design contract.
2. **Given** loading, refresh, no reports, filtered no-results, rate-limited/error, stale/partial, and permission scenarios, **when** each is rendered, **then** it is distinct, recoverable where possible, and existing rows remain visible during background refresh.
3. **Given** a user opens a report or period from keyboard or narrow viewport, **when** navigation occurs, **then** the row's identity, period, cabinet context, and invoking focus/return context remain understandable and evidence is captured under VE.

**State Coverage:** SC plus rate-limited, VAT-anomaly, report-processing, and invalid/unknown report-status states.

**Responsive/Table/Chart Contract:** RTC; reports table caption names acquiring reports, primary column is report period/identifier, financial totals use tabular RUB precision, anomaly and action columns stay reachable through bounded horizontal scroll or row detail. No chart is introduced.

**Accessibility Contract:** AX; anomaly and rate-limit meaning uses text/icon, report links name their target, and sortable headers expose direction.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/acquiring` and `STORY_ID=169.1`.

**Test and Visual Evidence:** VE plus rate-limit banner, VAT anomaly, and reports-table narrow-width evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-169-story-1-acquiring-shadcn`.

**Cleanup Evidence:** CE, including proof that nested acquiring detail routes were untouched.

**Out of Scope:** NP.

---

### Story 169.2: Migrate Acquiring Period Detail

**Requirements:** FR16, FR27

**Route/User Value:** As a finance user, I want `/analytics/acquiring/period` to explain one acquiring period and its reconciliation summary clearly, so that I can validate the period without losing report context.

**Owned Surface:** `/analytics/acquiring/period`; `src/app/(dashboard)/analytics/acquiring/period/page.tsx`, `components/AcquiringPeriodDetailPage.tsx`, `components/AcquiringPeriodSummary.tsx`, and colocated tests.

**Shared Dependencies:** C2 and merged Story 169.1 acquiring-shared banner/anomaly presentation; existing search-param and query contracts.

**Allowed Change Surface:** Only the period route tree and its tests.

**Forbidden Shared Files:** FS plus the acquiring index and `reports/[id]/**` trees.

**Acceptance criteria:**

1. **Given** a supported period deep link, **when** data loads, **then** period identity, cabinet, totals, VAT/anomaly semantics, calculation precision, and back/navigation behavior match the current route.
2. **Given** missing/invalid period context, empty, rate-limited, stale/partial, or recoverable failure, **when** rendered, **then** the page never presents unavailable values as zero and supplies the bounded next action.
3. **Given** any supported width/theme or keyboard-only use, **when** the summary is inspected, **then** reading order, full-value access, focus visibility, and 200% zoom remain usable.

**State Coverage:** SC plus invalid/missing period, rate-limit, and period-not-calculated states.

**Responsive/Table/Chart Contract:** RTC; summary evidence keeps period, units, definition, and full precision visible; any detail collection uses period/item as primary identifier. No chart is added unless already owned by the route.

**Accessibility Contract:** AX; breadcrumbs/back action are named, period context is not tooltip-only, and anomalies are non-color.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/acquiring/period` and `STORY_ID=169.2`.

**Test and Visual Evidence:** VE plus valid/invalid period and full-precision summary evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-169-story-2-acquiring-period-shadcn` after 169.1 merges.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 169.3: Migrate Acquiring Report Transaction Detail

**Requirements:** FR16, FR27

**Route/User Value:** As a finance user, I want `/analytics/acquiring/reports/[id]` to expose report totals and transaction evidence accessibly, so that I can trace reconciliation differences to exact transactions.

**Owned Surface:** Dynamic route `/analytics/acquiring/reports/[id]`; its `page.tsx`, `components/AcquiringReportDetailPage.tsx`, `AcquiringReportDetailSummary.tsx`, `AcquiringTransactionsTable.tsx`, and colocated tests.

**Shared Dependencies:** C2 and merged Story 169.1 shared acquiring presentation; existing report-ID parsing and not-found behavior.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/acquiring/reports/[id]/**`.

**Forbidden Shared Files:** FS plus acquiring index/period trees and global not-found handling.

**Acceptance criteria:**

1. **Given** a valid report ID, **when** the route loads, **then** report identity, summary totals, transaction fields, formatting, sort/page behavior, anomaly meaning, and reconciliation traceability are preserved.
2. **Given** invalid, unknown, unauthorized, empty, partial, stale, rate-limited, or failed report data, **when** rendered, **then** the route distinguishes not-found/restricted/error/empty and does not turn a failed transaction section into a false empty report.
3. **Given** keyboard, touch, or narrow-width inspection, **when** a transaction is traversed, **then** report context and the transaction identifier, amount, status, and row action remain reachable and correctly named.

**State Coverage:** SC plus invalid ID, `notFound`, report-level success with transaction-section failure, and rate-limit states.

**Responsive/Table/Chart Contract:** RTC; transactions table caption includes report identity, primary column is transaction/operation identifier, dates and RUB columns remain aligned/full precision, row details/actions remain reachable. No chart is introduced.

**Accessibility Contract:** AX; dynamic route title names the report, not-found is semantically distinct, and transaction row actions include entity identity.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/acquiring/reports/[id]` and `STORY_ID=169.3`.

**Test and Visual Evidence:** VE plus valid/invalid ID, partial transaction section, and dense-table evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-169-story-3-acquiring-report-detail-shadcn` after 169.1 merges.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 169.4: Migrate Buyout Analytics

**Requirements:** FR16, FR27

**Route/User Value:** As an operations user, I want `/analytics/buyout` to show buyout performance, decliners, trends, and product evidence consistently, so that I can identify and investigate declining buyout behavior.

**Owned Surface:** `/analytics/buyout`; its `page.tsx`, full `components/**` tree (summary widget/subcomponents, decliners list, trend chart/legend/tooltip/config, table/cells/columns, comparison utilities), and colocated tests.

**Shared Dependencies:** C2; existing buyout query, comparison, formatting, and navigation contracts.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/buyout/**`.

**Forbidden Shared Files:** FS and `/analytics/buyout-reconciliation/**`.

**Acceptance criteria:**

1. **Given** current and comparison buyout data, **when** migrated, **then** summary metrics, delta direction, decliner ranking, trend series, table calculations, filters/sort/page/export, and drill-down meaning remain unchanged.
2. **Given** loading/refresh, zero-result, filtered-empty, error, stale/partial, and comparison-unavailable states, **when** displayed, **then** they remain distinct and usable evidence stays visible during refresh.
3. **Given** chart/table use at any supported width or without a pointer, **when** a product or day is examined, **then** the same period, unit, precision, series meaning, and product identity are available through chart summary/data alternative and table.

**State Coverage:** SC plus missing comparison, anomalous negative delta, and zero-buyout (valid zero) states.

**Responsive/Table/Chart Contract:** RTC; table primary column is product/SKU, buyout and order values use aligned percentages/counts; decliner action stays reachable. Trend chart distinguishes current/comparison and provides daily data alternative; tooltip and table use identical precision.

**Accessibility Contract:** AX; delta/decliner severity is non-color and chart evidence is keyboard/touch independent.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/buyout` and `STORY_ID=169.4`.

**Test and Visual Evidence:** VE plus decliner, missing-comparison, chart alternative, and mobile table evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-169-story-4-buyout-shadcn`.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 169.5: Migrate Buyout Reconciliation

**Requirements:** FR16, FR27

**Route/User Value:** As a finance/operations user, I want `/analytics/buyout-reconciliation` to expose reconciliation controls, anomalies, and row outcomes clearly, so that I can distinguish matched, mismatched, pending, and failed reconciliation evidence.

**Owned Surface:** `/analytics/buyout-reconciliation`; its `page.tsx`, `components/BuyoutReconciliationPageContent.tsx`, `ReconciliationControls.tsx`, `ReconciliationStateMachine.tsx`, `ReconciliationTable.tsx`, `AnomalyIndicator.tsx`, and colocated tests.

**Shared Dependencies:** C2; existing reconciliation state machine and query/URL semantics are preserved, not redesigned.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/buyout-reconciliation/**`.

**Forbidden Shared Files:** FS and `/analytics/buyout/**`.

**Acceptance criteria:**

1. **Given** a reconciliation period and current backend statuses, **when** the page is migrated, **then** control semantics, state transitions, anomaly rules, totals, row interpretation, filters/sort/page, and action handoffs remain unchanged.
2. **Given** processing, matched-zero, mismatches, partial source data, stale data, permission restriction, or section failure, **when** rendered, **then** status and trustworthy scope are explicit and a failed source is never labeled “no discrepancies.”
3. **Given** dense or narrow layouts, **when** a mismatch is reviewed, **then** primary entity, both compared values, delta, reason/status, and action remain reachable in logical focus/reading order.

**State Coverage:** SC plus not-started, processing, matched, mismatched, partial-source, and state-machine failure states.

**Responsive/Table/Chart Contract:** RTC; reconciliation table caption names the period, primary column is SKU/entity, compared values and delta are aligned with full precision, anomaly and action columns remain reachable; no new chart.

**Accessibility Contract:** AX; state machine transitions use measured live announcements, anomalies are text/icon based, and controls expose current value.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/buyout-reconciliation` and `STORY_ID=169.5`.

**Test and Visual Evidence:** VE plus matched/mismatched/processing/partial-source evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-169-story-5-buyout-reconciliation-shadcn`.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 169.6: Migrate Enhanced FBS Analytics

**Requirements:** FR16, FR27

**Route/User Value:** As an operations manager, I want `/analytics/fbs-enhanced` to present FBS orders, funnel, calculated metrics, regional evidence, and stock risk coherently, so that I can triage fulfillment issues without losing operational context.

**Owned Surface:** `/analytics/fbs-enhanced`; its `page.tsx`, full `components/**` tree (page content, calculated metrics, order stats, funnel section/chart, regional section/tooltip, stock section), and colocated tests.

**Shared Dependencies:** C2; existing FBS hooks/contracts and specialized chart logic remain read-only dependencies.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/fbs-enhanced/**`.

**Forbidden Shared Files:** FS and `/analytics/fbs-stock/**`.

**Acceptance criteria:**

1. **Given** FBS order, funnel, region, and stock data, **when** migrated, **then** metric definitions, funnel stages, regional grouping, stock calculations, filters/periods, and action/navigation behavior remain unchanged.
2. **Given** one section fails or is partial while others are valid, **when** rendered, **then** valid sections remain usable and the unavailable scope, retry, freshness, and data limits are explicit.
3. **Given** touch, keyboard, or narrow layouts, **when** the user moves from exception summary to region/stock evidence, **then** primary status, entity, metric, and next action remain reachable without hover.

**State Coverage:** SC plus per-section partial/error, funnel not-calculated, no regional data, and stock-risk states.

**Responsive/Table/Chart Contract:** RTC; FBS funnel chart names stages/counts/conversion and exposes a data alternative; regional/stock collections prioritize region or SKU, operational status, primary count, and action.

**Accessibility Contract:** AX; funnel stage meaning and stock severity are non-color, tooltip content has non-hover access, and section failures have named regions.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/fbs-enhanced` and `STORY_ID=169.6`.

**Test and Visual Evidence:** VE plus mixed partial-section, funnel alternative, and tablet operational-priority evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-169-story-6-fbs-enhanced-shadcn`.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 169.7: Migrate FBS Stock Analytics

**Requirements:** FR16, FR27

**Route/User Value:** As an operations manager, I want `/analytics/fbs-stock` to compare stock by group, region, and size with a trustworthy export, so that I can find availability gaps and hand off corrective work.

**Owned Surface:** `/analytics/fbs-stock`; its `page.tsx`, full `components/**` tree (`FbsStockPageContent`, groups/regions/sizes sections, export button), and colocated tests.

**Shared Dependencies:** C2; existing FBS stock query/grouping/export contracts.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/fbs-stock/**`.

**Forbidden Shared Files:** FS and `/analytics/fbs-enhanced/**`.

**Acceptance criteria:**

1. **Given** grouped stock data, **when** migrated, **then** group/region/size dimensions, quantities, availability semantics, filters, expansion, sorting, and export scope/format remain unchanged.
2. **Given** zero stock, missing stock, filtered-empty, stale/partial, export generating/ready/failed, or permission restriction, **when** displayed, **then** each state is explicit and zero is not collapsed into unavailable.
3. **Given** a narrow or keyboard-only session, **when** groups and rows are traversed or exported, **then** selection/expansion state, entity identity, status, primary quantity, and export feedback remain operable.

**State Coverage:** SC plus valid zero-stock, missing availability, expanded group, and export queued/ready/failed states.

**Responsive/Table/Chart Contract:** RTC; each collection has an accessible name and primary identifier (group/region/size), quantities align with units, expansion is programmatic, and narrow widths use deliberate disclosure or bounded scroll. No chart is introduced.

**Accessibility Contract:** AX; group expansion exposes state, export lifecycle is announced once, and availability is non-color.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/fbs-stock` and `STORY_ID=169.7`.

**Test and Visual Evidence:** VE plus zero/missing stock, expanded group, and export lifecycle evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-169-story-7-fbs-stock-shadcn`.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 169.8: Migrate Funnel Analytics

**Requirements:** FR16, FR27

**Route/User Value:** As an operations/analytics user, I want `/analytics/funnel` to compare funnel stages, anomalies, products, and periods consistently, so that I can locate conversion losses and supporting product evidence.

**Owned Surface:** `/analytics/funnel`; its `page.tsx`, full `components/**` tree (summary, product filter, funnel and overlay charts/tooltips/config, anomaly/delta indicators, alerts/sync banner, table/cells/columns/rows, export hook/utilities), and colocated tests.

**Shared Dependencies:** C2; existing funnel queries, anomaly thresholds, comparison, sync, and export semantics.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/funnel/**`.

**Forbidden Shared Files:** FS.

**Acceptance criteria:**

1. **Given** funnel and comparison data, **when** migrated, **then** stage definitions/order, conversions, anomaly thresholds, product filtering, overlays, sync status, table values, sort/export, and drill-down semantics are unchanged.
2. **Given** missing comparison, sync gaps, zero conversions, filtered-empty, partial stages, stale data, or error, **when** displayed, **then** usable evidence remains and unavailable or partial stages are not rendered as trustworthy zeros.
3. **Given** keyboard/touch or narrow layouts, **when** a stage, anomaly, overlay series, or product row is examined, **then** period, units, selection effect, and equivalent textual/tabular evidence are available without hover.

**State Coverage:** SC plus sync-gap, overlay unavailable, missing comparison, stage-level partial, and anomaly states.

**Responsive/Table/Chart Contract:** RTC; product table primary column is product/SKU with stage metrics aligned; funnel and overlay charts name stage/series/period, use non-color distinctions, expose data alternatives, and preserve selected product/filter context.

**Accessibility Contract:** AX; anomaly/delta and sync meaning use text/icons; chart selection, filter, sort, and export are keyboard complete.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/funnel` and `STORY_ID=169.8`.

**Test and Visual Evidence:** VE plus sync-gap, partial-stage, overlay comparison, and chart/table equivalence evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-169-story-8-funnel-shadcn`.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 169.9: Migrate Analytics Gaps Triage

**Requirements:** FR16, FR27

**Route/User Value:** As an operations user, I want `/analytics/gaps` to prioritize data/operational gaps and explain each affected entity, so that I can investigate and hand off the correct recovery action.

**Owned Surface:** `/analytics/gaps`; its `page.tsx`, `components/GapsPageContent.tsx`, `GapsSummaryCards.tsx`, `GapsTable.tsx`, `GapAnalysisDialog.tsx`, `useGapsPageState.ts`, and colocated tests.

**Shared Dependencies:** C2; existing gap classification, query, filters, and recovery/navigation semantics.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/gaps/**`.

**Forbidden Shared Files:** FS.

**Acceptance criteria:**

1. **Given** classified gaps, **when** migrated, **then** counts, severity/priority, entity identity, reasons, filters/sort/page, dialog evidence, and recovery handoff remain unchanged.
2. **Given** no gaps, filtered no-results, stale/partial classification, unknown status, permission restriction, or failure, **when** rendered, **then** valid “no gaps” is distinct from failed/unavailable analysis.
3. **Given** keyboard, mobile, or zoom use, **when** a gap dialog opens/closes, **then** it has correct title/focus/Escape/return and the queue's filters, row, and position remain understandable.

**State Coverage:** SC plus valid no-gaps, unknown classification, analyzed/pending, and dialog detail-error states.

**Responsive/Table/Chart Contract:** RTC; gaps table primary column is affected entity, priority/status/reason/action remain reachable; narrow detail may use the owned dialog/Sheet behavior without losing queue context. No chart.

**Accessibility Contract:** AX; severity is label/icon/order based, repeated detail actions name the entity, and dialog focus lifecycle is verified.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/gaps` and `STORY_ID=169.9`.

**Test and Visual Evidence:** VE plus no-gaps versus failed-analysis and dialog lifecycle evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-169-story-9-gaps-shadcn`.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 169.10: Migrate Liquidity Analytics and Liquidation Planning

**Requirements:** FR16, FR27

**Route/User Value:** As an owner/operations user, I want `/analytics/liquidity` to connect inventory liquidity distribution, benchmarks, trends, SKU detail, and liquidation scenarios, so that I can identify tied-up capital and evaluate an action safely.

**Owned Surface:** `/analytics/liquidity`; its `page.tsx`, full `components/**` tree (header, cards, distribution/trend charts, summary/benchmarks, table/header/rows/expanded row, loading/empty, planner modal and scenario cards), and colocated tests.

**Shared Dependencies:** C2; existing liquidity hook, sort mapping, types, calculations, and scenario semantics remain read-only.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/liquidity/**`.

**Forbidden Shared Files:** FS.

**Acceptance criteria:**

1. **Given** liquidity data and current filters/sort, **when** migrated, **then** category definitions, distribution, benchmarks, trends, table/expanded detail, scenario calculations, validation, and action/export behavior preserve current business meaning.
2. **Given** empty inventory, zero/negative financial values, stale/partial trends, one-section error, planner validation error, or recoverable submission failure, **when** rendered, **then** trustworthy sections remain visible and safe planner input is retained.
3. **Given** any supported width or keyboard-only operation, **when** the user expands a SKU or opens/closes the liquidation planner, **then** entity/queue context, focus, scenario scope, units, and result state remain explicit.

**State Coverage:** SC plus benchmark unavailable, expanded-row loading/error, planner validating/preview/submitting/success/failure, and partial trend states.

**Responsive/Table/Chart Contract:** RTC; liquidity table primary column is product/SKU with category/status, capital/stock metrics, expansion and action reachable; distribution/trend charts expose units, category/period series, summaries/data alternatives; planner uses focused responsive form/dialog, not a clipped desktop fragment.

**Accessibility Contract:** AX; scenario form has persistent labels/error summary, overlays restore focus, and liquidity status/direction is non-color.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/liquidity` and `STORY_ID=169.10`.

**Test and Visual Evidence:** VE plus expanded row, partial chart, planner validation/preview/result, and large-negative-value evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-169-story-10-liquidity-shadcn`.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 169.11: Migrate Returns Analytics

**Requirements:** FR16, FR27

**Route/User Value:** As an operations/finance user, I want `/analytics/returns` to show return totals, reasons, trends, comparison, and product rows consistently, so that I can identify material return drivers and affected products.

**Owned Surface:** `/analytics/returns`; its `page.tsx`, full `components/**` tree (summary, trend chart/tooltip/config, reasons pie parts, delta/comparison utilities, table/helpers/rows), and colocated tests.

**Shared Dependencies:** C2; existing returns query, reason mapping, comparison, and formatting semantics.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/returns/**`.

**Forbidden Shared Files:** FS.

**Acceptance criteria:**

1. **Given** return data and a comparison period, **when** migrated, **then** totals, reason shares, trend/delta direction, table metrics, filters/sort/page, and drill-down preserve current definitions and precision.
2. **Given** zero returns, missing comparison, unknown reason, stale/partial reason series, filtered-empty, or error, **when** rendered, **then** states are distinct and unknown reasons have neutral labeled fallback.
3. **Given** keyboard/touch or narrow layouts, **when** a reason/day/product is examined, **then** the same period, units, full values, and non-color meaning are present in chart summaries/data alternatives and rows.

**State Coverage:** SC plus valid zero-returns, unknown reason, missing comparison, and partial-series states.

**Responsive/Table/Chart Contract:** RTC; returns table primary column is product/SKU, return count/rate/amount align with units; trend and reasons charts expose period, units, reason/series meaning, data alternatives, and identical tooltip/table precision.

**Accessibility Contract:** AX; pie segments are not the only access to reason values, delta meaning includes sign/text, and unknown reasons are announced neutrally.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/returns` and `STORY_ID=169.11`.

**Test and Visual Evidence:** VE plus zero-return, unknown-reason, partial-series, and chart alternative evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-169-story-11-returns-shadcn`.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 169.12: Migrate Storage Analytics and Paid-Storage Import

**Requirements:** FR16, FR27

**Route/User Value:** As a finance/operations user, I want `/analytics/storage` to connect storage cost summaries, alerts, trends, SKU consumers, filters, and paid-storage import status, so that I can trace storage cost and recover safely from import issues.

**Owned Surface:** `/analytics/storage`; `page.tsx`, `loading.tsx`, full `components/**` tree (header/filters/badges, summary/alerts, trend chart/parts/config, SKU table/header/cells/hooks, top consumers, paid-storage import dialog/status/hooks/utils, URL sync), and colocated tests.

**Shared Dependencies:** C2; merged Story 169.14 authoritative backend paid-storage import contract; merged Story 169.15 shared frontend paid-storage import boundary; existing storage analytics hooks/contracts, URL filters, and financial formatting.

**Current Delivery State:** `done`. PR #227 merged the 27-file route presentation at `52f7f5061d73f5633fbc0fe575ff35f2055be194`. After Stories 169.14 and 169.15 merged and cleaned, exact eight-path feature commit `6ac5dcb5e1bee32b9fb80bc2d20c1473bbdf3bc3` validated and minimally corrected route-owned consumption of the authoritative request/start/status/result/error contract. Independent review round 2 and the independent verifier returned PASS with zero findings; 158/158 route tests, 19,367/19,367 full tests, read-only Chromium E2E 4 passed / 1 optional skip / 0 failed, and the 70-page webpack production build passed. PR #299 merged as `3ff35bf69be3630e279111076968976d7726152c`.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/storage/**` plus the exact existing Story implementation artifact for contract-closeout evidence and lifecycle reconciliation.

**Forbidden Shared Files:** FS.

**Acceptance criteria:**

1. **Given** storage data and applied week/warehouse/SKU filters, **when** migrated, **then** cost definitions, alert thresholds, trend/table/top-consumer values, URL sync, sorting/pagination, import validation/submission/status, and refresh behavior remain unchanged.
2. **Given** no data, filtered-empty, stale/partial analytical sections, import idle, validation/submission, pending, processing, success, or failure, or background refresh, **when** rendered, **then** current trustworthy data remains visible and the authoritative import outcome plus safe whole-range retry guidance is explicit. Paid-storage import partial success is not applicable unless a future approved backend contract exposes partial counts and a safe retry subset; the route must not synthesize it.
3. **Given** keyboard, zoom, or narrow-width use, **when** filters/table/import dialog are operated, **then** focus lifecycle, retained safe input, primary SKU/cost/status/action, and long Russian/large RUB values remain usable.

**State Coverage:** SC plus week-filter mismatch, alert, import idle, validation/submission, pending, processing, success, failure, and per-section error states. Paid-storage import partial success is N/A under the merged 169.14 contract; route-level partial analytical sections remain required.

**Responsive/Table/Chart Contract:** RTC; SKU table primary column is product/SKU, storage cost/volume/days align with full precision, warehouse badges/actions stay reachable; trend chart exposes week/units/series and data alternative; import dialog uses focusable error/result summary.

**Accessibility Contract:** AX; import progress/result uses bounded live announcements, badges/alerts are non-color, dialog focus returns to import trigger.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/storage` and `STORY_ID=169.12`.

**Test and Visual Evidence:** VE plus alert, filtered-empty, partial analytical section, and the complete authoritative import lifecycle from idle through success/failure, including request/status/result contract evidence. No import partial-success screenshot is required while that state is contractually N/A.

**Branch/Worktree Lifecycle:** route presentation merged through PR #227 from `cdx/epic-169-story-12-storage-shadcn`; contract closeout merged through PR #299 from `cdx/epic-169-story-12-contract-closeout`, created from refreshed prerequisite-complete frontend `main`.

**Cleanup Evidence:** PR #227 route cleanup remained intact. After PR #299 merge ancestry was proven on primary `main`, the contract-closeout remote branch, local branch, `/private/tmp/wb-repricer-fe-169-12-contract-closeout`, and Story-specific lifecycle records were proven absent; `git worktree prune` ran and primary `main` was clean.

**Out of Scope:** NP.

### Story 169.13: Migrate Supply Planning

**Requirements:** FR16, FR27

**Route/User Value:** As an operations manager, I want `/analytics/supply-planning` to prioritize stockout risk, supply metrics, SKU rows, cost/trend detail, pagination, and export, so that I can plan replenishment and investigate the highest-risk item without losing queue context.

**Owned Surface:** `/analytics/supply-planning`; its `page.tsx`, full `components/**` tree (header, risk cards, metrics, loading/empty, table/header/row/cells/pagination/export/filter hooks, detail left/right/cost/trend sections and calculations), and colocated tests.

**Shared Dependencies:** C2; existing supply-planning hook, types, calculations, filters/query params, and navigation/export contracts.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/supply-planning/**`.

**Forbidden Shared Files:** FS.

**Acceptance criteria:**

1. **Given** supply-planning data, **when** migrated, **then** stockout risk ordering, metric definitions, SKU rows, filters/sort/page, detail calculations/trends, selection/return context, and export retain current business behavior.
2. **Given** no risks, filtered-empty, zero/missing stock, stale/partial cost or trend data, detail failure, or permission restriction, **when** rendered, **then** trustworthy scope and recovery are explicit and valid zero stock remains distinct from unavailable.
3. **Given** desktop split/detail or narrow single-pane flow, **when** a SKU is selected and returned from, **then** filters, page, selection, queue position, focus, identifier, risk/status, primary metric, and action remain preserved where supported.

**State Coverage:** SC plus no-risk, detail-loading/error, selected/stale entity, export lifecycle, and cost/trend partial states.

**Responsive/Table/Chart Contract:** RTC; table primary column is product/SKU with stockout status/risk, stock/sales/recommended supply, selection/detail action; mobile uses explicit list-to-detail return. Detail trend chart names period/units/series and provides data alternative; pagination and export preserve filters.

**Accessibility Contract:** AX; risk uses label/icon/order, selection/expanded/current state is programmatic, detail transition has deliberate focus/return.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/supply-planning` and `STORY_ID=169.13`.

**Test and Visual Evidence:** VE plus no-risk versus failure, list/detail context preservation, partial trend, and export evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-169-story-13-supply-planning-shadcn`.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 169.14: Establish the Authoritative Paid-Storage Import Lifecycle and Result Contract

**Requirements:** FR16, FR18, FR19, FR20, FR35

As a user importing paid-storage data, I want the trigger and status endpoints to expose one authoritative lifecycle and result contract, so that the frontend can report progress, imported rows, failure details, and safe whole-range recovery truthfully.

**Current Delivery State:** `done`. Backend PR #229 and frontend final-handoff PR #292 are merged. The exact backend and frontend Story branches/worktrees are cleaned, and the five cross-bound lifecycle records, retirement transaction, and review bootstraps are authenticated absent. This merged prerequisite enabled and was independently reauthenticated by Story 169.15.

**Canonical Lifecycle Gate:** Before every network mutation, assert exactly one fetch URL and one push URL for both repositories and resolve each to the expected identity. One global exact-order marker state machine rejects duplicate/cross-nested/mismatched/reordered blocks before every nonempty retained payload is extracted with delimiter exclusion and one LF per complete line, including trailing blanks; RED/reviewer hashes are recomputed from files. Evidence-preflight must authorize the extracted canonical nonempty manifest as a subset of the Story 169.14 allowed manifest containing every required path; delivery and publish recovery retain the same gate. The synthetic/sanitized RED and reviewer bytes pass a non-echoing scan that rejects credential-bearing headers, Bearer/Basic values, supported plain/compound credential assignments, private keys, and credential-bearing URI userinfo. The committed and hashed reviewer payload contains exactly one complete `STORY_169_14_PRIVACY_REVIEW_ATTESTATION: PASS_NO_SECRET_OR_CUSTOMER_PII` line; missing or duplicate attestations fail closed. Before the final commit, atomically publish mode-600 `story-169-14-review-bootstrap-v1` binding exact reviewed parent/tree/frozen-manifest/evidence/reviewer truth; a commit-before-reviewed-head crash may recover only from that byte-identical bootstrap and must reauthenticate the direct parent, tree, manifest, reviewers, and remote absence. Cross-check the resulting reviewed-head record, delete the bootstrap, and prove it absent before first push. Missing, foreign, malformed, wrong-mode, or symlinked bootstrap state fails closed. GitHub REST all-state rows combine lowercase `state` with `merged_at`, normalize only `OPEN | MERGED | CLOSED_UNMERGED`, re-read after PR creation, reject closed-unmerged/invalid state, and skip re-merge for an already merged exact PR. Create the absent remote ref with an absence-expecting lease, use the verified push endpoint for remote-tip authority, --match-head-commit for merge, and an exact-old-SHA lease for deletion. The absence lease is a create-only compare-and-swap guard, not permission to rewrite an existing remote ref; any existing non-identical value fails closed. Story 169.14's separate three-line PR record is adjacent-temp create-or-byte-identical. Preserve collision, pagination/count, foreign-WIP, evidence, and CabinetGuard contracts.

**Frontend Final-Handoff Gate:** After exact backend merge and restartable backend branch/worktree cleanup, retain the backend reviewed-head, three-line PR, and strict nine-line cleanup-authority records and execute the dedicated frontend `create | delivery | publish-recovery | cleanup` lifecycle on branch `cdx/epic-169-story-14-final-handoff` and worktree `/private/tmp/wb-repricer-fe-169-14-final-handoff`. The artifact-only handoff contains exactly one ordered 30-line version-3 record plus the adjacent cleanup-authenticated foreign-WIP payload; it binds the exact frontend base/repository/static branch-and-artifact topology, two distinct PASS reviewers, all three backend record hashes, and `RETAINED_UNTIL_CROSS_BOUND_VERIFIED` without self-referencing its future commit/tree/PR/merge. A dedicated mode-600 `story-169-14-final-handoff-review-bootstrap-v1` closes the final-commit-before-reviewed-head crash window and is consumed before the first push. Separate mode-600 `story-169-14-final-handoff-reviewed-head-v1` and `story-169-14-final-handoff-pr-record-v1` records bind the exact handoff commit/direct-parent/tree/artifact hash and exact frontend PR repository/number/URL/main base/head branch/`headRefOid`/merge SHA. First publication uses an absence-expecting lease; ambiguous PR creation recovers only an exact count-checked zero-or-one normalized REST identity; merge uses `--match-head-commit` only for `OPEN`, while exact `MERGED` skips re-merge; cleanup proves handoff commit → exact frontend merge → refreshed frontend `origin/main` and exact branch/worktree absence. Backend `record-retirement` publishes the strict self-contained 48-line mode-600 transaction before deleting any source. It binds both repositories, bases/evidence/commits/trees/manifests/artifact/reviewer pairs, both exact PR topologies/merges, recorded-main ancestry, all five source paths/hashes, deletion set, and cleanup proof. Recovery re-runs live topology and accepts each of the five sources only as exact-present or already absent under the authenticated transaction; malformed/reordered/extra/missing fields, wrong mode/type, symlink, foreign hash, or topology drift fails before further deletion. The transaction is removed only after the complete deletion set is proven absent. The suffix-aware non-echoing credential scanner covers the full credential-family set under exactly `=`, `:=`, `+=`, `-=`, `?=`, `&&=`, and `||=`; the seven mandatory prefixed synthetics (`DATABASE_PASSWORD=`, `OPENAI_API_KEY:=`, `GH_TOKEN+=`, `JWT_SECRET-=`, `AWS_ACCESS_KEY_ID?=`, `X_AUTH_TOKEN&&=`, `service-refresh-token||=`) fail independently, while benign `OPENAI_API_KEY field omitted` prose remains allowed.

**Delivery Record:** **Route/User Value:** non-route backend prerequisite for the `/analytics/storage` paid-storage import workflow. **Owned Surface:** backend paid-storage request/response DTO, the shared import-status DTO's optional paid-storage result field, manual and smart start boundaries, the necessary top-of-file `CabinetGuard` import plus method-level `CabinetGuard` and directly related Swagger decorators on the shared Excel/paid-storage `GET /v1/imports/:id` status boundary, paid-storage status-result projection, direct unit/integration/e2e contract tests, and authoritative API documentation. **Shared Dependencies:** refreshed backend `origin/main`; clean local-main fast-forward preferred or the exact durable foreign-WIP fallback; the canonical linked-worktree/unattached-branch/non-truncated-paginated-PR collision gate above; shared-consumer inventory for `ImportStatusDto`. **Allowed Change Surface:** `src/imports/controllers/paid-storage-import.controller.ts`; only the necessary top-of-file `CabinetGuard` import and the shared status method's `CabinetGuard`, `@ApiParam`, `@ApiOperation`, `@ApiHeader`, and `@ApiResponse` decorator hunks in `src/imports/imports.controller.ts`; `src/imports/dto/paid-storage-import.dto.ts`; `src/imports/dto/import-status.dto.ts` only for an optional paid-storage result field; the paid-storage-specific path in `src/imports/services/import-status-builder.service.ts`; `src/imports/controllers/__tests__/paid-storage-import.controller.spec.ts`; `src/imports/controllers/__tests__/imports-paid-storage-status.controller.spec.ts` for shared Excel/paid-storage authorization and OpenAPI regression; `src/imports/services/import-status-builder.service.spec.ts`; `test/imports/paid-storage.e2e-spec.ts`; and `docs/API-PATHS-REFERENCE.md`. **Forbidden Shared Files:** frontend runtime source, processor/orchestration/storage semantics except read-only contract evidence, the shared polling handler body, unrelated methods or class-wide generic `ImportsController` behavior, production changes to `src/imports/imports.service.ts` without a second honest-RED-driven scope correction, unrelated import queues/domains, unrelated `ImportStatusDto` fields or consumer response shapes, Prisma schema/migrations, package/dependency files, deployment/production configuration. **State Coverage:** manual and smart accepted starts as `pending`; known BullMQ waiting/delayed/prioritized/waiting-children as `pending`; active as `processing`; completed with authoritative imported-row result; failed with actionable detail; explicit BullMQ `unknown` fails closed as sanitized `failed`/`UNKNOWN_QUEUE_STATE`; invalid request, unknown import, authorized same-cabinet Excel polling, and unauthorized/cross-cabinet access. **Responsive/Table/Chart Contract:** not applicable; non-route contract Story with no route-ledger row. **Accessibility Contract:** not applicable to backend UI; lifecycle and error semantics must be explicit for consumers. **Test and Visual Evidence:** RED-first DTO/OpenAPI/start-controller/shared-method guard/status-builder/unit/integration/e2e/API-doc assertions proving request keys, both accepted starts use `pending`, lifecycle values, optional paid-storage result projection, error detail, JWT-claim cabinet isolation, authorized same-cabinet Excel runtime compatibility, and unchanged unrelated import-status consumers. **Local Validation:** targeted backend tests followed by format-check, lint-check, type-check, unit/e2e, build, endpoint-drift, docs validation, and `git diff --check`. **Branch/Worktree Lifecycle:** backend branch `cdx/epic-169-story-14-paid-storage-import-contract`, worktree `/private/tmp/wb-repricer-be-169-14-paid-storage-import-contract`, based on a clean fast-forwarded local `main` or verified refreshed `origin/main` under the recorded foreign-WIP fallback; two independent review passes; pre-merge proof that the exact PR is `OPEN`, targets `main`, has the expected head branch, and has `headRefOid == reviewed local HEAD`. **Cleanup Evidence:** exact mode-600 reviewed-head plus three-line PR records; exact feature → merge → refreshed backend `origin/main`; local-main equality or authenticated still-valid deferral; restartable branch/worktree cleanup with records retained; direct single-parent artifact-only frontend final-handoff commit/merge; then record retirement bound back to the exact PR and committed record. A present remote branch may be deleted only when its exact ref equals the reviewed feature SHA; an already-absent remote is acceptable only after exact merged-PR identity and ancestry proof. **Lifecycle Fence:** global retained-evidence validation, reviewed-head-only recovery, absence-leased first publication, exact zero-or-one PR recovery, adjacent-temp create-or-byte-identical three-line PR publication, atomic reviewed-head merge, two-phase record-driven cleanup, exact-old-SHA remote/local deletion, and authenticated final-handoff record retirement are mandatory.

**Acceptance Criteria:** **Given** an authenticated cabinet submits a valid manual or smart paid-storage import **when** the import is accepted and polled **then** documented request keys are enforced; both accepted starts return `pending` and never fabricate completion results; polling exposes only `pending | processing | completed | failed`; known BullMQ nonterminal states map explicitly while an actual BullMQ `unknown` fails closed with stable sanitized `UNKNOWN_QUEUE_STATE` detail; completed status exposes the authoritative imported-row result through an optional paid-storage result field on `ImportStatusDto`; failed status exposes actionable error detail; JWT-claim cabinet isolation is enforced at start and method-level on the shared Excel/paid-storage `GET /v1/imports/:id` boundary through the necessary import, guard, and directly related Swagger hunks; authorized same-cabinet Excel polling remains runtime-compatible; the shared handler body, unrelated controller methods, retry behavior, current all-or-failure processing semantics, and unrelated import-status consumers remain unchanged; no class-wide guard, `ImportsService` edit, cast, unrelated response-shape broadening, or partial-success status is introduced **and** the exact DTO/OpenAPI/guard contract is frozen in RED tests and authoritative API documentation before GREEN implementation.

### Story 169.15: Align the Shared Frontend Paid-Storage Import Boundary

**Requirements:** FR16, FR18, FR19, FR20, FR35

As a user importing paid-storage data, I want the shared frontend boundary to consume the merged backend contract exactly, so that route presentation receives truthful lifecycle, result, and failure evidence without duplicating contract logic.

**Current Delivery State:** `done`. Evidence commit `aac4dd01036e2e9e8cb3054e04e4647818170210` and feature commit `08cf13037f06f5c417f274a1815e0c7c5899ca23` produced reviewed tree `1c048606f1785cd9170276b39b3c8a2b26642610`. Reviewer `native-edge-16915-final-r1-20260827` reported four accepted correctness/privacy/typing findings plus one warning-rate advisory; all accepted correctness findings were fixed. Final verifier `native-verifier-16915-final-r2-20260827` returned PASS with zero findings. Targeted Vitest passed 70/70; Story-owned Prettier, ESLint, TypeScript, max-lines, the 70-page production build, and `git diff --check` passed, while the global format baseline remained exactly 38 historical warnings. PR #296 merged as `2d99f7f3302a23d393b5a756f5c006b90af52666`; the local and remote Story branch, temporary worktree, review bootstrap, reviewed-head, lifecycle record, and cleanup transaction are absent after canonical cleanup. Story 169.12 contract closeout is now eligible from refreshed frontend `main`.

**Delivery Record:** **Route/User Value:** non-route shared frontend prerequisite for `/analytics/storage`. **Owned Surface:** paid-storage request serialization, shared import types/exports, import-status normalizer, polling boundary, and direct API/normalizer/hook contract tests. **Shared Dependencies:** exact committed Story 169.14 final handoff, exact backend PR/feature/merge topology, refreshed-backend-`origin/main` ancestry, absent backend Story branch/worktree/ephemeral records, and either clean local-main equality or the authenticated still-valid foreign-WIP payload. **Allowed Change Surface:** `src/lib/api/storage-analytics.ts`, `src/lib/api/storage-import-normalizer.ts`, `src/types/storage-analytics-trends.ts`, `src/types/storage-analytics/index.ts` only if its export surface must change, `src/hooks/useImportStatus.ts`, and direct tests in `src/lib/api/__tests__/**` and `src/hooks/__tests__/useStorageAnalytics.test.ts`. **Forbidden Shared Files:** `src/app/(dashboard)/analytics/storage/**`, every route presentation tree, generic UI/product primitives, unrelated APIs/hooks/types/stores, backend repository, package/dependency files, and E2E route specs. **State Coverage:** request serialization, pending/processing continuation, completed/failed termination, imported-row preservation, actionable error preservation, a frontend-only `unknown` sentinel with diagnostics for an unrecognized backend wire value, missing import ID, disabled polling, and network failure. The sentinel does not represent BullMQ `unknown`, which Story 169.14 maps to wire `failed` with `UNKNOWN_QUEUE_STATE`. **Responsive/Table/Chart Contract:** not applicable; non-route shared behavior Story with no route-ledger row. **Accessibility Contract:** route presentation remains Story 169.12-owned; this boundary must preserve explicit status/error data for accessible consumers. **Test and Visual Evidence:** honest RED-first request, response, normalizer, polling, terminal result, and failure contract tests against the merged Story 169.14 schema; retained RED/reviewer/manifest payloads are committed, globally validated, byte-recomputed, and privacy-scanned. **Local Validation:** targeted Vitest, format-check, lint, type-check, max-lines, build, and `git diff --check`. **Branch/Worktree Lifecycle:** frontend branch `cdx/epic-169-story-15-storage-import-boundary`, worktree `/private/tmp/wb-repricer-fe-169-15-storage-import-boundary`; two independent review passes before PR/merge. **Cleanup Evidence:** exact reviewed-head plus ten-line lifecycle records, exact feature → frontend merge → refreshed-origin ancestry, exact merged PR identity, record removal, absence/exact-old remote/local deletion, and restartable local/remote branch plus worktree absence before Story 169.12 contract closeout starts. **Lifecycle Fence:** authenticated predecessor record, global retained-evidence validation, direct evidence-parent equality, reviewed-head-only recovery, absence-leased publication, exact zero-or-one PR recovery, create-or-identical PENDING publication, exact-PENDING atomic finalization, finalized-to-cleanup routing, and restartable lease-protected deletion are mandatory.

**Acceptance Criteria:** **Given** the merged Story 169.14 request/status/result/error contract **when** the shared frontend triggers and polls a paid-storage import **then** request serialization matches the backend DTO; shared types and normalizers accept exactly the authoritative lifecycle; polling continues through pending/processing and stops at completed/failed; imported rows and actionable failure details are preserved; an unrecognized backend wire value produces only the frontend `unknown` sentinel with diagnostics, while BullMQ `unknown` arrives through the authoritative backend `failed`/`UNKNOWN_QUEUE_STATE` mapping; direct contract tests lock the boundary; no route presentation changes occur **and** no paid-storage partial-success state is synthesized.

---

## Epic 170-FE: Coherent Marketing and Marketplace Analytics

### Story 170.1: Migrate Advertising Analytics Workspace

**Requirements:** FR27

**Current Delivery State:** done. Preface PR #236 merged at `3eda5d6623277176dbdfee35a0d387965cbb2689`; implementation PR #237 merged at `44a6eb7dc33d8f434df466a94f4962408710d333`; closeout PR #238 merged at `376ecadfcd6e07bc3f4813d29445142eaf4d8fb6`. Delivery changed 41 Story-owned files, increased the owned contract count from 417 to 447, passed the full Vitest floor at 19,076/0, passed branch E2E at 10 passed / 1 by-design skip / 0 failed, completed two fresh review passes, and proved branch/worktree cleanup.

**Route/User Value:** As a marketing/finance user, I want `/analytics/advertising` to connect campaign selection, efficiency, attribution, spend discrepancies, trends, product performance, and sync gaps consistently, so that I can compare advertising outcomes and reach trustworthy evidence.

**Owned Surface:** `/analytics/advertising`; root `page.tsx`, `loading.tsx`, `error.tsx`, complete root `components/**` and `utils/**` trees (header/filters/selectors, sync/efficiency/attribution banners, summary/campaign list, daily trend, discrepancy/cannibalization sections, merged/performance tables and helpers), and colocated tests. The nested `campaigns/[advertId]/**` route is excluded.

**Shared Dependencies:** C2; existing comparison selector, advertising queries, campaign/product grouping, attribution, sync, metrics, URL/filter, sort, and export contracts.

**Allowed Change Surface:** Only the advertising root route files/components/utils/tests; no nested campaign-detail files.

**Forbidden Shared Files:** FS plus `advertising/campaigns/**` and shared custom components not exclusively owned here.

**Acceptance criteria:**

1. **Given** advertising and comparison data, **when** migrated, **then** campaign/product grouping, efficiency definitions, spend discrepancy, organic/advertising attribution, cannibalization, sync status, daily trends, table metrics, filters/sort/page, and drill-down URLs preserve current meaning and behavior.
2. **Given** initial load, background refresh, no campaigns, filtered-empty, sync gaps, over-attribution, partial daily/finance data, stale data, or section error, **when** rendered, **then** usable evidence remains visible and each limitation has explicit scope and recovery.
3. **Given** keyboard/touch or narrow layouts, **when** a campaign, product, series, warning, or sort is examined, **then** applied context, full precision, selection effect, non-color meaning, and equivalent chart/table evidence remain operable.

**State Coverage:** SC plus sync-gap, over-attribution, multi-campaign warning, discrepancy, partial comparison/daily-series, and route-boundary error states.

**Responsive/Table/Chart Contract:** RTC; performance/merged tables use campaign or product/SKU as primary column, expose selection/grouping/sort and aligned spend/revenue/ratio metrics. Daily/discrepancy charts name period, units, actual/comparison series and provide data alternatives; chart/table values reconcile.

**Accessibility Contract:** AX; filter/toggle/campaign selectors expose current state; warnings and efficiency are non-color; charts and dense tables are keyboard/touch complete.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/advertising` and `STORY_ID=170.1`, excluding nested campaign tests from ownership assertions.

**Test and Visual Evidence:** VE plus sync-gap, over-attribution, grouped table, discrepancy, daily comparison, and mixed-partial evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-170-story-1-advertising-shadcn`.

**Cleanup Evidence:** CE, including proof the nested campaign route and its exclusive custom card were untouched.

**Out of Scope:** NP.

### Story 170.2: Migrate Advertising Campaign Bid-Recommendation Detail

**Requirements:** FR27

**Current Delivery State:** done. Implementation PR #239 merged at `5bb0dcc31285a20a444083a44cef4b09756ee0b7`; closeout PR #240 merged at `e822045691200dd0b504e42ccb403775aa949b3d`. Delivery changed five Story-owned files, increased the route test count from 10 to 11 and the exclusive card/contract count from 17 to 26, passed the full Vitest floor at 19,086/0, completed two fresh APPROVE review passes, and proved branch/worktree cleanup. Dedicated route E2E was not applicable because no Story-owned spec exists; visual coverage remains an explicit Story 174.3 carry-out.

**Route/User Value:** As a marketing user, I want `/analytics/advertising/campaigns/[advertId]` to show campaign identity and bid recommendations with clear context and recovery, so that I can review recommendations without losing the originating campaign/product selection.

**Owned Surface:** `/analytics/advertising/campaigns/[advertId]`; dynamic route `src/app/(dashboard)/analytics/advertising/campaigns/[advertId]/**`, plus exclusively consumed `src/components/custom/advertising/BidRecommendationsCard.tsx` and its tests. Its API hook/client/type contracts remain forbidden dependencies.

**Shared Dependencies:** C2 and merged Story 170.1 advertising index; existing `advertId`, optional `nmId`, cabinet, back-route, and recommendation semantics.

**Allowed Change Surface:** Dynamic route page/tests and the exclusive `BidRecommendationsCard`/tests only.

**Forbidden Shared Files:** FS plus advertising root route, recommendation hooks/API/types, and global route/not-found definitions.

**Acceptance criteria:**

1. **Given** a valid campaign ID and optional product query parameter, **when** data loads, **then** campaign/product identity, cabinet context, recommendation values/rationale/status, and back navigation preserve current behavior and URL semantics.
2. **Given** invalid ID, missing cabinet hydration, not-found/unauthorized, empty recommendations, stale/partial recommendation data, or recoverable failure, **when** rendered, **then** each state is distinct and retry never duplicates a consequential bid action.
3. **Given** keyboard/touch or narrow layout, **when** recommendations and any owned actions are reviewed, **then** headings, full values, rationale, scope, focus, and return context are understandable without hover.

**State Coverage:** SC plus invalid `advertId`, absent/invalid `nmId`, cabinet hydration, no recommendation, and recommendation partial/error states.

**Responsive/Table/Chart Contract:** RTC; recommendation evidence prioritizes recommendation/entity, current/recommended bid, rationale/status, and action. Any tabular list has accessible name and bounded narrow strategy; no chart is added unless already inside the exclusive card.

**Accessibility Contract:** AX; back link is a semantic link without nested interactive semantics, campaign title is the `h1`, repeated actions name campaign/product, and any confirmation overlay restores focus.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/advertising/campaigns/[advertId]` and `STORY_ID=170.2`; also run `npx vitest run "src/components/custom/advertising/__tests__/BidRecommendationsCard.test.tsx"`.

**Test and Visual Evidence:** VE plus invalid ID, missing cabinet, empty/partial recommendation, and deep-link/back-context evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-170-story-2-advertising-campaign-detail-shadcn` after 170.1 merges.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 170.3: Migrate Brand Margin Analytics

**Requirements:** FR27

**Route/User Value:** As an owner/finance user, I want `/analytics/brand` to compare margin by brand with filters, summaries, storage context, missing-COGS disclosure, and export, so that I can identify brand-level profitability drivers.

**Owned Surface:** `/analytics/brand`; its `page.tsx`, `components/BrandHelpSection.tsx`, exclusively consumed `src/components/custom/MarginByBrandTable.tsx` and route-specific tests. Cross-route margin compositions and `ExportDialog` are read-only shared dependencies.

**Shared Dependencies:** C2; existing `analytics/shared` margin filter/state/summary/storage/COGS compositions, margin hooks/calculations, formatters, and ExportDialog.

**Allowed Change Surface:** Brand route files/tests and exclusive `MarginByBrandTable`/tests only.

**Forbidden Shared Files:** FS, especially `analytics/shared/**`, ExportDialog, hooks/types/calculation helpers, and category route.

**Acceptance criteria:**

1. **Given** brand margin data, cabinet expenses, and current filters, **when** migrated, **then** brand grouping, margin/revenue/cost definitions, storage comparison, COGS coverage, totals, sort/page, export scope, and navigation preserve current behavior.
2. **Given** missing COGS, valid zero, negative margin, filtered-empty, stale/partial expenses, unavailable storage comparison, or export failure, **when** rendered, **then** limitations and full-precision financial meaning remain explicit.
3. **Given** keyboard/touch or narrow layout, **when** a brand row, filter, help section, or export is used, **then** brand identity, primary margin metric, units, action, selection/filter scope, and feedback remain reachable.

**State Coverage:** SC plus missing-COGS, negative-margin, storage-comparison unavailable, and export lifecycle states.

**Responsive/Table/Chart Contract:** RTC; table caption names brand margin analysis, primary column is brand, financial columns use tabular RUB/percent precision, active sort and export scope are visible; no chart is introduced.

**Accessibility Contract:** AX; negative/positive direction is sign/text based, help content is reachable without tooltip dependence, and export result is durably discoverable.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/brand` and `STORY_ID=170.3`; include targeted `MarginByBrandTable` tests.

**Test and Visual Evidence:** VE plus missing-COGS, negative margin, unavailable comparison, and dense brand-table evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-170-story-3-brand-margin-shadcn`.

**Cleanup Evidence:** CE, including proof shared margin compositions were not edited.

**Out of Scope:** NP.

### Story 170.4: Migrate Brand Share Analytics

**Requirements:** FR27

**Route/User Value:** As a marketing user, I want `/analytics/brand-share` to select a brand, dependent category, and date range and then read market-share evidence accessibly, so that I can evaluate competitive positioning without confusing unavailable percentages with zero.

**Owned Surface:** `/analytics/brand-share`; its `page.tsx`, exclusive `src/components/custom/analytics/BrandShareView.tsx`, `BrandShareChart.tsx`, their helpers and tests. Brand-share hooks/API/types are read-only dependencies.

**Shared Dependencies:** C2; existing cascading brand → parent-subject filter behavior, date-range defaults, report query, backend 503 interpretation, and null percentage semantics.

**Allowed Change Surface:** Brand-share route page/tests and exclusive BrandShare view/chart files/tests under `src/components/custom/analytics`.

**Forbidden Shared Files:** FS plus brand-share hooks/API/types and unrelated custom analytics components.

**Acceptance criteria:**

1. **Given** brand, dependent category, and optional date range, **when** selections change, **then** downstream reset rules, query enabling/default period, report values, null percentages, and backend parameters remain unchanged.
2. **Given** first-use no selection, dependent-options loading/empty, report loading/empty, WB 503, recoverable error, stale/partial report, or invalid date range, **when** rendered, **then** state and next action are explicit and safe selections are retained.
3. **Given** keyboard/touch, 200% zoom, or narrow width, **when** filters and chart evidence are used, **then** visible labels, logical order, 44×44 actions, full percentage meaning, and a non-hover data alternative are available.

**State Coverage:** SC plus first-use no-selection, cascading dependency loading/empty, invalid date range, upstream WB 503, and null-share states.

**Responsive/Table/Chart Contract:** RTC; chart names brand/category/period, percentage units and series, distinguishes null from 0%, provides accessible summary and tabular data alternative, and retains selected filter context. Date inputs use approved accessible control composition without changing value format.

**Accessibility Contract:** AX; visible labels replace span-only pseudo-labels, dependent disabled reason is readable, chart series are non-color, and errors/retry are announced without stealing focus.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/brand-share` and `STORY_ID=170.4`; also run BrandShare view/chart tests.

**Test and Visual Evidence:** VE plus cascading filter, null-versus-zero, WB 503, and chart data-alternative evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-170-story-4-brand-share-shadcn`.

**Cleanup Evidence:** CE, including scoped raw-date-input audit and resolution/justified exception.

**Out of Scope:** NP.

### Story 170.5: Migrate Category Margin Analytics

**Requirements:** FR27

**Route/User Value:** As an owner/finance user, I want `/analytics/category` to compare margin by category with filters, summaries, storage context, missing-COGS disclosure, and export, so that I can identify category-level profitability drivers.

**Owned Surface:** `/analytics/category`; its `page.tsx`, `components/CategoryHelpSection.tsx`, exclusively consumed `src/components/custom/MarginByCategoryTable.tsx` and route-specific tests. Cross-route margin compositions and `ExportDialog` remain shared dependencies.

**Shared Dependencies:** C2; existing analytics-shared margin state/filter/summary/storage/COGS components, margin hooks/calculations, formatters, and export dialog.

**Allowed Change Surface:** Category route files/tests and exclusive `MarginByCategoryTable`/tests only.

**Forbidden Shared Files:** FS, especially `analytics/shared/**`, ExportDialog, hooks/types/calculations, and brand route.

**Acceptance criteria:**

1. **Given** category margin data and active context, **when** migrated, **then** category grouping, totals, margin/revenue/cost definitions, storage comparison, COGS coverage, filter/sort/page, export, and navigation semantics remain unchanged.
2. **Given** missing COGS, negative/zero values, filtered-empty, stale/partial expenses, unavailable comparison, unknown category, or export failure, **when** rendered, **then** each condition has truthful labels and full precision.
3. **Given** narrow, touch, keyboard, or zoom use, **when** a category row/filter/help/export action is used, **then** category identity, primary margin metric, units, current sort/filter scope, and feedback remain reachable.

**State Coverage:** SC plus unknown category, missing-COGS, negative margin, storage-comparison unavailable, and export lifecycle.

**Responsive/Table/Chart Contract:** RTC; table caption names category margin analysis, primary column is category, numeric columns align with full RUB/percent precision, row actions/export scope remain reachable. No chart is introduced.

**Accessibility Contract:** AX; unknown categories use neutral labeled fallback, financial direction is non-color, and help/export are keyboard complete.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/category` and `STORY_ID=170.5`; include targeted `MarginByCategoryTable` tests.

**Test and Visual Evidence:** VE plus unknown category, missing COGS, negative value, and dense category-table evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-170-story-5-category-margin-shadcn`.

**Cleanup Evidence:** CE, including proof shared margin compositions were untouched.

**Out of Scope:** NP.

### Story 170.6: Migrate Advertising–Organic Cross-Reference Analytics

**Requirements:** FR27

**Route/User Value:** As a marketing/finance user, I want `/analytics/cross-reference` to connect advertising and organic overlap, cannibalization, spend/position relationships, insights, charts, and product evidence, so that I can validate cross-channel effects.

**Owned Surface:** `/analytics/cross-reference`; its `page.tsx`, complete `components/**` and `utils/**` trees (state surfaces, summaries/insights, overlap/cross-reference tables, cannibalization, scatter and position/spend charts), and colocated tests.

**Shared Dependencies:** C2; existing ad/search correlation inputs, calculations, filters, comparison, and drill-down contracts.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/cross-reference/**`.

**Forbidden Shared Files:** FS and source advertising/search route trees.

**Acceptance criteria:**

1. **Given** advertising and organic/search inputs, **when** migrated, **then** overlap/correlation/cannibalization definitions, summary insights, chart coordinates/series, table values, filters/sort, and drill-down preserve current calculations and context.
2. **Given** one source absent/partial/stale, no overlap, filtered-empty, unknown correlation, or section failure, **when** rendered, **then** the trustworthy source/scope remains usable and “no relationship” is not inferred from failed data.
3. **Given** keyboard/touch or narrow widths, **when** a chart point, insight, or product row is examined, **then** product identity, period, units, selection effect, full values, and equivalent tabular evidence are available without hover.

**State Coverage:** SC plus one-source partial, valid no-overlap, indeterminate correlation, selected chart point, and section-level error states.

**Responsive/Table/Chart Contract:** RTC; overlap/cross-reference tables prioritize product/SKU with organic/ad metrics and relation status. Scatter and position/spend charts name axes/units/series, expose selected point and data alternatives, and reconcile with table values.

**Accessibility Contract:** AX; correlation/cannibalization is described in text, chart point interaction has keyboard/touch equivalent, and partial-source warnings are non-color.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/cross-reference` and `STORY_ID=170.6`.

**Test and Visual Evidence:** VE plus one-source partial, no-overlap, selected scatter point, and chart/table reconciliation evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-170-story-6-cross-reference-shadcn`.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 170.7: Migrate Search Analytics Workspace

**Requirements:** FR27

**Route/User Value:** As a marketing user, I want `/analytics/search` to analyze by query, product, orders, and position trends through consistent tabs, filters, charts, and tables, so that I can trace search demand and visibility to affected products and orders.

**Owned Surface:** `/analytics/search`; its `page.tsx`, complete `components/**` tree (page content, product combobox, query/product/orders/trends tabs, summary/share/cards, order/position charts, query/product/orders/movers tables, seller badge, sort button, chart shell/helpers), and colocated tests.

**Shared Dependencies:** C2; existing search params, tabs, query/product/order hooks/contracts, comparison/formatting, deep-link, sort/page behavior.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/search/**`.

**Forbidden Shared Files:** FS.

**Acceptance criteria:**

1. **Given** a supported tab and search context, **when** migrated, **then** query/product selection, tab/deep-link state, metrics, order/position trends, seller/share meaning, table sort/page, and comparison semantics remain unchanged.
2. **Given** no selection, empty query/product/orders, filtered-empty, stale/partial tab data, invalid search params, unknown seller, or section failure, **when** rendered, **then** states remain tab-scoped, recoverable, and do not erase valid sibling-tab context.
3. **Given** keyboard/touch, narrow width, or direct deep link, **when** tabs, combobox, sort, chart point, or row are used, **then** current tab/selection, focus, period, units, full values, and return context remain explicit.

**State Coverage:** SC plus no-selection, invalid/deep-linked tab, per-tab partial/error, unknown seller, and results-updating states.

**Responsive/Table/Chart Contract:** RTC; each table has a route-specific caption and primary identifier (query, product/SKU, order, or mover), aligned metrics and active sort. Position/order charts name axes/period/series, provide summaries/data alternatives, and preserve selected query/product context.

**Accessibility Contract:** AX; tabs expose selected state, combobox follows its keyboard pattern, sort buttons announce direction, and chart meaning is not hover/color only.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/search` and `STORY_ID=170.7`.

**Test and Visual Evidence:** VE plus each tab, no-selection, partial sibling tab, combobox keyboard, and chart/table equivalence evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-170-story-7-search-analytics-shadcn`.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

---

## Epic 171-FE: Clear AI, Forecast, and Model Governance

### Story 171.1: Migrate AI Anomaly Triage

**Requirements:** FR27

**Route/User Value:** As an authorized AI administrator, I want `/analytics/ai-admin/anomalies` to present anomaly identity, severity, evidence, status, and resolution safely, so that I can triage and resolve anomalies with an auditable outcome.

**Owned Surface:** `/analytics/ai-admin/anomalies`; its `page.tsx`, `components/AnomaliesList.tsx`, `ResolveAnomalyDialog.tsx`, `anomalies-helpers.ts`, and colocated tests.

**Shared Dependencies:** C2; existing anomaly query/mutation, authorization, status values, resolution payload, invalidation, and audit semantics.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/ai-admin/anomalies/**`.

**Forbidden Shared Files:** FS and sibling `ai-admin/models`/`preferences` trees.

**Acceptance criteria:**

1. **Given** authorized anomaly data, **when** migrated, **then** anomaly classification/severity, evidence, timestamps, filters/sort/page, resolve validation/confirmation, mutation payload, invalidation, and final status preserve current behavior.
2. **Given** no anomalies, filtered-empty, unknown anomaly/status, stale/partial evidence, restricted access, resolve pending/success/failure, or conflict/already-resolved state, **when** rendered, **then** state and safe next action are explicit and input is retained after recoverable failure.
3. **Given** keyboard/touch or narrow layouts, **when** an anomaly is selected and the resolution dialog opens/closes, **then** entity identity, queue context, focus lifecycle, exact scope, and outcome announcement remain usable.

**State Coverage:** SC plus unknown anomaly type, already-resolved/conflict, resolve validating/submitting/success/failure, and restricted administrator states.

**Responsive/Table/Chart Contract:** RTC; anomaly list/table caption names AI anomalies, primary column is anomaly/entity identifier, severity/status/timestamp/action remain reachable; mobile may use explicit detail/resolve transition. No chart is introduced.

**Accessibility Contract:** AX; severity/status use text/icon/order, repeated resolve controls name the anomaly, dialog has error summary and correct focus return, progress is announced once.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/ai-admin/anomalies` and `STORY_ID=171.1`.

**Test and Visual Evidence:** VE plus restricted, unknown-status, already-resolved, and full resolve lifecycle evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-171-story-1-ai-anomalies-shadcn`.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 171.2: Migrate AI Admin Model Governance

**Requirements:** FR27

**Route/User Value:** As an authorized AI administrator, I want `/analytics/ai-admin/models` to list governed model versions and expose rollback status safely, so that I can inspect model lifecycle and perform an authorized rollback with exact scope.

**Owned Surface:** `/analytics/ai-admin/models`; its `page.tsx`, complete `components/**` tree (`AdminModelsList`, content, table, pagination, rollback dialog, helpers), and colocated tests.

**Shared Dependencies:** C2; existing admin model query/mutation, authorization, pagination, version/status interpretation, rollback payload/invalidation, and audit behavior.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/ai-admin/models/**`.

**Forbidden Shared Files:** FS, `/analytics/models/**`, and sibling AI-admin routes.

**Acceptance criteria:**

1. **Given** authorized model-version data, **when** migrated, **then** version/model identity, status, dates/metrics, sort/page, rollback eligibility/confirmation, request, invalidation, and final outcome preserve current behavior.
2. **Given** empty list, stale/partial metadata, unknown status, restricted access, rollback unavailable, pending, success, failure, or conflict, **when** rendered, **then** destructive scope, server truth, and bounded recovery are explicit without offering duplicate rollback.
3. **Given** keyboard/touch or narrow width, **when** a row or rollback dialog is operated, **then** model/version identity, status, action, focus, confirmation consequence, and return context remain usable.

**State Coverage:** SC plus unknown model status, rollback ineligible/conflict/pending/success/failure, and restricted administrator states.

**Responsive/Table/Chart Contract:** RTC; models table caption names governed versions, primary column is model/version identity, lifecycle/status/date/primary metric/rollback stay reachable; pagination preserves state. No chart.

**Accessibility Contract:** AX; rollback uses destructive AlertDialog semantics, repeated controls name model/version, status is non-color, and focus returns to the invoking row.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/ai-admin/models` and `STORY_ID=171.2`.

**Test and Visual Evidence:** VE plus restricted, rollback-ineligible, unknown status, pagination, and rollback lifecycle evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-171-story-2-ai-admin-models-shadcn`.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 171.3: Migrate AI Preferences

**Requirements:** FR27

**Route/User Value:** As an authorized user, I want `/analytics/ai-admin/preferences` to explain and save AI preferences accessibly, so that I can configure allowed AI behavior and understand whether my changes were saved.

**Owned Surface:** `/analytics/ai-admin/preferences`; its `page.tsx`, `components/AiPreferencesForm.tsx`, and colocated tests.

**Shared Dependencies:** C2; existing preferences query/mutation, authorization, field defaults/validation, payload, cache invalidation, and server-error semantics.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/ai-admin/preferences/**`.

**Forbidden Shared Files:** FS and sibling AI-admin routes.

**Acceptance criteria:**

1. **Given** loaded preferences, **when** fields are changed and saved, **then** visible labels/help, values, validation, payload, duplicate-submit prevention, invalidation, dirty/reset behavior, and save confirmation preserve current semantics.
2. **Given** initial load, restricted access, invalid values, stale server values, recoverable save failure, conflict, success, or unsaved navigation, **when** handled, **then** safe input is retained and saved/current/pending state is unambiguous.
3. **Given** keyboard/touch, 200% zoom, or narrow width, **when** the form is completed or errors occur, **then** labels, descriptions, groups, error summary, focus destination, action order, and 44×44 primary controls remain usable.

**State Coverage:** SC plus pristine/dirty, validation error, submitting, save success/failure/conflict, and unsaved-change states.

**Responsive/Table/Chart Contract:** RTC form clauses; focused form uses constrained readable width and full-width mobile actions where appropriate. No table/chart is introduced.

**Accessibility Contract:** AX; all controls have persistent visible labels/descriptions, grouped choices use native/appropriate semantics, errors are associated and summarized, success is announced without focus theft.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/ai-admin/preferences` and `STORY_ID=171.3`.

**Test and Visual Evidence:** VE plus dirty, validation, restricted, conflict, save-failure-retained-input, and success evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-171-story-3-ai-preferences-shadcn`.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 171.4: Migrate Forecast Workspace

**Requirements:** FR27

**Route/User Value:** As an owner/operations user, I want `/analytics/forecast` to explain readiness, AI engine status, parameters, forecast metrics, series, SKU evidence, and collection progress, so that I can understand forecasts and their limitations before planning inventory.

**Owned Surface:** `/analytics/forecast`; its `page.tsx`, complete `components/**` tree (page/header, engine status, preferences/model selectors, readiness/collecting states, parameters/metrics, forecast chart/helpers, forecast/top-SKU tables, query/readiness helpers), and colocated tests.

**Shared Dependencies:** C2; existing forecast/readiness queries, preferences, model selection, parameters, collection/polling, calculations, URL/query, and navigation behavior.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/forecast/**`.

**Forbidden Shared Files:** FS and `/analytics/forecast-accuracy/**` or model route trees.

**Acceptance criteria:**

1. **Given** a ready forecast, **when** migrated, **then** model/parameter selection, metrics, actual/forecast/confidence meaning, horizon/period, SKU values, filters/sort, and drill-down preserve existing calculations and contracts.
2. **Given** preferences required, collecting/not ready, engine unavailable, empty, stale/partial forecast, missing confidence data, permission restriction, or polling failure, **when** rendered, **then** readiness, safe-leave/return, trustworthy scope, retry, and next valid action are explicit.
3. **Given** keyboard/touch or narrow width, **when** selectors, progress, chart, or SKU rows are used, **then** current model/parameters, period/units, series meaning, full values, and equivalent data evidence remain available without hover.

**State Coverage:** SC plus preference-required, collecting/progress, engine degraded/unavailable, forecast ready, missing confidence band, and polling failure states.

**Responsive/Table/Chart Contract:** RTC; forecast and top-SKU tables prioritize SKU/date/horizon with actual/forecast/delta and status. Forecast chart names actual/forecast/target/confidence series, horizon and units, provides accessible summary/data alternative, and retains selection/drill-down context.

**Accessibility Contract:** AX; progress and engine status have measured announcements/non-color labels; selectors expose current value; confidence and forecast distinctions are not color-only.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/forecast` and `STORY_ID=171.4`.

**Test and Visual Evidence:** VE plus collecting, engine unavailable, missing confidence band, ready forecast, and chart/table equivalence evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-171-story-4-forecast-shadcn`.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 171.5: Migrate Forecast Accuracy Analytics

**Requirements:** FR27

**Route/User Value:** As an analytics/model user, I want `/analytics/forecast-accuracy` to compare accuracy metrics by horizon and SKU consistently, so that I can identify where forecast quality is acceptable or requires investigation.

**Owned Surface:** `/analytics/forecast-accuracy`; its `page.tsx`, complete `components/**` tree (`ForecastAccuracyPageContent`, metric cards, horizon breakdown table, SKU breakdown table), and colocated tests.

**Shared Dependencies:** C2; existing accuracy query, metric formulas/thresholds, horizon/SKU grouping, filters/sort/page, and navigation semantics.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/forecast-accuracy/**`.

**Forbidden Shared Files:** FS and forecast/model route trees.

**Acceptance criteria:**

1. **Given** forecast accuracy data, **when** migrated, **then** accuracy/error metric definitions, units/direction, horizons, SKU grouping, totals, filters/sort/page, and drill-down preserve current meaning.
2. **Given** insufficient observations, valid zero error, missing/undefined metric, filtered-empty, stale/partial horizon or SKU data, permission restriction, or error, **when** rendered, **then** confidence/availability is explicit and missing is not rendered as 0% accuracy/error.
3. **Given** keyboard/touch or dense/narrow layouts, **when** metrics and tables are inspected, **then** metric definition, sample scope, SKU/horizon identity, full precision, active sort, and row actions remain reachable.

**State Coverage:** SC plus insufficient sample, undefined metric, valid zero error, and one-breakdown partial states.

**Responsive/Table/Chart Contract:** RTC; horizon table primary column is horizon, SKU table primary column is SKU/product; accuracy/error/sample columns align with explicit percent/count units, sort and row action semantics. No chart is introduced.

**Accessibility Contract:** AX; good/bad direction includes text/sign, metric definitions and sample limitations are not tooltip-only, and both tables have distinct names.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/forecast-accuracy` and `STORY_ID=171.5`.

**Test and Visual Evidence:** VE plus insufficient sample, undefined versus zero metric, and dual-table narrow-width evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-171-story-5-forecast-accuracy-shadcn`.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 171.6: Migrate Model Registry and Training Entry

**Requirements:** FR27

**Route/User Value:** As an authorized model user, I want `/analytics/models` to list model identity/status and expose training entry safely, so that I can find a model, inspect its lifecycle, and start only a valid training operation.

**Owned Surface:** `/analytics/models`; its `page.tsx`, `components/ModelListSection.tsx`, `TrainModelButton.tsx`, `model-list-helpers.ts`, and colocated tests.

**Shared Dependencies:** C2; existing model registry query, statuses, authorization, train mutation/payload, invalidation, and detail-route builders.

**Allowed Change Surface:** Only `src/app/(dashboard)/analytics/models/page.tsx` and root `components/**`/tests; dynamic `[id]/**` routes are excluded.

**Forbidden Shared Files:** FS, `ai-admin/models/**`, and `analytics/models/[id]/**`.

**Acceptance criteria:**

1. **Given** model registry data, **when** migrated, **then** identity, type/version/status, dates/metrics, sort/filter/navigation, training eligibility/confirmation, mutation, and refresh preserve current behavior.
2. **Given** no models, filtered-empty, unknown status, stale/partial metadata, restricted training, already-training/conflict, training pending/success/failure, or list error, **when** rendered, **then** server truth and next action are explicit and duplicate training is prevented.
3. **Given** keyboard/touch or narrow width, **when** a model row or training action is used, **then** model identity, status, detail destinations, exact training scope, focus, and result remain usable.

**State Coverage:** SC plus unknown status, training unavailable/already-running/pending/success/failure, and restricted action states.

**Responsive/Table/Chart Contract:** RTC; model list/table primary column is model identity, type/version/status/date/primary metric/action remain reachable; detail links preserve model ID. No chart.

**Accessibility Contract:** AX; training control names the model, status is non-color, confirmation/result focus is deliberate, and repeated detail actions are distinguishable.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/models/components` and `STORY_ID=171.6`; include the models root page test.

**Test and Visual Evidence:** VE plus empty registry, unknown status, training conflict/pending/failure/success, and narrow list evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-171-story-6-model-registry-shadcn`.

**Cleanup Evidence:** CE, including proof all dynamic model routes were untouched.

**Out of Scope:** NP.

### Story 171.7: Migrate Model Evaluations List

**Requirements:** FR27

**Route/User Value:** As a model analyst, I want `/analytics/models/[id]/evaluations` to identify the model and list evaluation runs with comparable metrics and destinations, so that I can select the correct evaluation evidence.

**Owned Surface:** `/analytics/models/[id]/evaluations`; dynamic route `src/app/(dashboard)/analytics/models/[id]/evaluations/**`, excluding nested `sku-accuracy/**`; owned files are its `page.tsx`, `EvaluationsList.tsx`, `EvaluationsHeaderCard.tsx`, `EvaluationsTable.tsx`, helpers, and colocated tests.

**Shared Dependencies:** C2 and merged Story 171.6 registry; existing model-ID parsing, evaluation query/status/metrics, pagination, route builders, and not-found/authorization behavior.

**Allowed Change Surface:** Evaluations route root files/components/tests only.

**Forbidden Shared Files:** FS, models registry/performance routes, and nested `evaluations/sku-accuracy/**`.

**Acceptance criteria:**

1. **Given** a valid model ID and evaluation history, **when** migrated, **then** model identity/context, evaluation run IDs/status/timestamps/metrics, sort/page, and destinations preserve existing semantics.
2. **Given** invalid/unknown model, no evaluations, filtered-empty, unknown evaluation status, stale/partial metrics, restricted access, or query failure, **when** rendered, **then** not-found/restricted/empty/error are distinct and missing metrics are not fabricated.
3. **Given** keyboard/touch, direct deep link, or narrow width, **when** an evaluation row/destination is used, **then** model and evaluation identity, status, metric units, current page, focus, and return context remain understandable.

**State Coverage:** SC plus invalid model ID, model not found, no evaluations, unknown run status, and partial metric states.

**Responsive/Table/Chart Contract:** RTC; evaluations table caption names the model, primary column is evaluation/run ID or timestamp, status/metric/sample/destination remain reachable; pagination preserves model context. No chart.

**Accessibility Contract:** AX; dynamic `h1` names model evaluations, statuses are non-color, and each destination names its evaluation/model.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/models/[id]/evaluations/components` and `STORY_ID=171.7`; include the evaluations route page test and exclude nested SKU-accuracy ownership.

**Test and Visual Evidence:** VE plus invalid/not-found model, no evaluations, partial metrics, and dense evaluations-table evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-171-story-7-model-evaluations-shadcn` after 171.6 merges.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 171.8: Migrate Evaluation SKU Accuracy Detail

**Requirements:** FR27

**Route/User Value:** As a model analyst, I want `/analytics/models/[id]/evaluations/sku-accuracy` to show SKU accuracy overview and row-level evidence for the selected evaluation, so that I can identify the SKUs driving model error and return without losing evaluation context.

**Owned Surface:** `/analytics/models/[id]/evaluations/sku-accuracy`; dynamic route `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/**`; its `page.tsx`, `SkuAccuracyOverview.tsx`, `SkuAccuracyDetail.tsx`, `SkuAccuracyTable.tsx`, helpers, and colocated tests.

**Shared Dependencies:** C2 and merged Story 171.7; existing `modelId`/evaluation search params, SKU-accuracy query, metrics/formulas, sort/page, and evaluations return-route builder.

**Allowed Change Surface:** Only the nested SKU-accuracy route tree.

**Forbidden Shared Files:** FS and parent evaluations/model performance/registry trees.

**Acceptance criteria:**

1. **Given** valid model and evaluation context, **when** data loads, **then** overview totals, SKU identity, actual/forecast/error/accuracy values, sample semantics, filters/sort/page, and back-link search params preserve current behavior.
2. **Given** invalid/missing model or evaluation context, no SKU observations, valid zero error, undefined metric, stale/partial rows, restricted access, or failure, **when** rendered, **then** context/error/empty states are distinct and missing accuracy is not shown as zero.
3. **Given** keyboard/touch or narrow width, **when** overview/detail/table and return navigation are used, **then** model/evaluation/SKU identity, units, full precision, current sort/page, focus, and origin context remain reachable.

**State Coverage:** SC plus missing/invalid evaluation parameter, no observations, undefined versus zero metric, and row-level partial states.

**Responsive/Table/Chart Contract:** RTC; SKU accuracy table caption names model/evaluation, primary column is SKU/product, actual/forecast/error/accuracy/sample columns align with explicit units, active sort and pagination remain visible. No chart.

**Accessibility Contract:** AX; back link is semantic and context-rich, metric direction is sign/text based, table actions name SKU, and overview does not replace the single `h1` hierarchy.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy` and `STORY_ID=171.8`.

**Test and Visual Evidence:** VE plus invalid context, no observations, undefined versus zero, partial row, and back-context evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-171-story-8-model-sku-accuracy-shadcn` after 171.7 merges.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

### Story 171.9: Migrate Model Performance Detail

**Requirements:** FR27

**Route/User Value:** As a model analyst, I want `/analytics/models/[id]/performance` to connect model identity, performance metrics, MAPE trend, and evaluation history, so that I can judge model quality and trace changes to evaluation runs.

**Owned Surface:** `/analytics/models/[id]/performance`; dynamic route `src/app/(dashboard)/analytics/models/[id]/performance/**`; its `page.tsx`, `ModelPerformanceDetail.tsx`, `MapeTrendChart.tsx`, `EvaluationHistoryTable.tsx`, helpers, and colocated tests.

**Shared Dependencies:** C2 and merged Story 171.6 registry; existing model-ID parsing, performance query, MAPE/metric definitions, evaluation history, navigation, authorization, and not-found behavior.

**Allowed Change Surface:** Only the model performance route tree.

**Forbidden Shared Files:** FS and model registry/evaluations/AI-admin trees.

**Acceptance criteria:**

1. **Given** a valid model and performance history, **when** migrated, **then** model identity/status, performance definitions, MAPE trend period/precision, evaluation history values, sort/navigation, and drill-down preserve current behavior.
2. **Given** invalid/unknown model, no history, insufficient sample, valid zero error, undefined metric, stale/partial trend/history, restricted access, or section failure, **when** rendered, **then** state and trustworthy scope are explicit and a failed history section does not erase valid summary metrics.
3. **Given** keyboard/touch or narrow width, **when** chart points or evaluation rows are examined, **then** model/evaluation identity, period, units, full precision, selection effect, and equivalent data evidence remain available without hover.

**State Coverage:** SC plus invalid/not-found model, no history, insufficient sample, undefined versus zero metric, and mixed summary/chart/table partial states.

**Responsive/Table/Chart Contract:** RTC; evaluation history table caption names the model, primary column is evaluation/run timestamp or ID with metric/sample/destination. MAPE chart names period/percentage units/series, provides summary/data alternative, and reconciles with history rows.

**Accessibility Contract:** AX; metric quality/direction is non-color, chart point access has keyboard/touch equivalent, and dynamic route title names the model.

**Local Validation:** VC with `STORY_TEST_TARGET=src/app/(dashboard)/analytics/models/[id]/performance` and `STORY_ID=171.9`.

**Test and Visual Evidence:** VE plus invalid model, insufficient sample, mixed partial section, undefined versus zero, and chart/table reconciliation evidence.

**Branch/Worktree Lifecycle:** BLC on `cdx/epic-171-story-9-model-performance-shadcn` after 171.6 merges.

**Cleanup Evidence:** CE.

**Out of Scope:** NP.

---

## Epic 172-FE: Consistent Core Business Operations

Users can manage dashboard priorities, automation rules, COGS, communications, finances, monitoring, MoySklad, orders, and products through consistent forms, tables, statuses, writeback feedback, and recovery behavior.

### Story 172.1: Migrate the Business Dashboard

**Requirements:** FR13, FR27

As a business owner,
I want `/dashboard` to use the approved executive and analytical compositions,
So that I can understand the most material business signal and drill into trustworthy evidence without scanning an inconsistent card wall.

**Delivery Record:**

- **Route/User Value:** `/dashboard`; prioritized owner orientation, period context, metrics, trends, cost/profit evidence, and next actions.
- **Owned Surface:** `src/app/(dashboard)/dashboard/**`, exclusive `src/components/custom/dashboard/**`, and directly corresponding tests.
- **Shared Dependencies:** Epics 166-FE and Story 167.1 merged; this Story owns dashboard-exclusive compositions only. **Carry-in from 168.3 (2026-08-18):** this Story owns the migration of shared `src/components/custom/top-table-utils.ts` `getMarginColor` (still legacy-palette; consumed by `dashboard/MarginCard`/`GrossMarginCard`) AND the dedupe of the two local semantic 4-tier copies introduced by 168.3 in `top-products/TopProductsTableRow.tsx` / `top-brands/TopBrandsTableRow.tsx` (see `TODO(172.1)` cross-refs; pin style: ≥30→`text-financial-positive`, ≥15→`text-status-warning`, ≥0→`text-status-warning/80`, <0→`text-financial-negative`, null→`text-muted-foreground`).
- **Allowed Change Surface:** Owned Surface plus dashboard-specific visual fixtures and E2E coverage.
- **Forbidden Shared Files:** token/compiler files, `src/components/ui/**`, AppShell/navigation, generic compositions, API clients/hooks/types.
- **State Coverage:** loading, refresh, empty, partial, stale, error, missing COGS, incomplete period, success.
- **Responsive/Table/Chart Contract:** executive restraint for hero, metric-family grouping, primary-column rules for daily/unit-economics tables, complete accessible chart evidence.
- **Accessibility Contract:** logical dashboard outline, keyboard drill-down, readable full precision, non-color delta/status meaning, both themes.
- **Test and Visual Evidence:** targeted dashboard tests plus owner-orientation screenshots at mobile, tablet, desktop, light, and dark.
- **Local Validation:** targeted Vitest/Playwright followed by the Universal Local Validation Contract.
- **Branch/Worktree Lifecycle:** `cdx/epic-172-story-1-dashboard`, dedicated temporary worktree from current merged prerequisites.
- **Cleanup Evidence:** commit/merge record, deleted local/remote branch, and removed Story worktree.

**Acceptance Criteria:**

**Given** the existing dashboard data and business rules
**When** the complete dashboard render tree is migrated
**Then** every metric, period, comparison, chart, table, alert, and navigation outcome preserves its established meaning and behavior
**And** the route satisfies the Universal Story Delivery Contract without unrelated shared-file changes.

### Story 172.2: Migrate the Canned Automation Rules Gallery

**Requirements:** FR12, FR13, FR27

As an operations user,
I want `/automation/canned-rules` to present rule discovery and installation consistently,
So that I can understand rule purpose, prerequisites, risk, and next steps before enabling automation.

**Delivery Record:**

- **Route/User Value:** `/automation/canned-rules`; discover, inspect, and initiate installation of supported canned rules.
- **Owned Surface:** `src/app/(dashboard)/automation/canned-rules/**`, `src/components/custom/automation/CannedRulesGallery.tsx`, exclusive automation gallery components/tests.
- **Shared Dependencies:** Epics 166-FE and Story 167.1.
- **Allowed Change Surface:** Owned Surface and route-specific fixtures/tests.
- **Forbidden Shared Files:** tokens, primitives, AppShell, shared navigation, automation API/hooks/types, installed-rule components.
- **State Coverage:** loading, no rules, restricted/unavailable rule, install pending, success, error.
- **Responsive/Table/Chart Contract:** responsive gallery with preserved readable rule summaries and 44×44 touch actions; no table/chart requirement.
- **Accessibility Contract:** semantic list/cards, explicit install action labels, keyboard flow, warnings not color-only, Dialog focus lifecycle.
- **Test and Visual Evidence:** rule-gallery interaction tests and responsive/theme screenshots.
- **Local Validation:** targeted automation tests plus Universal Local Validation Contract.
- **Branch/Worktree Lifecycle:** `cdx/epic-172-story-2-canned-rules`, dedicated temporary worktree.
- **Cleanup Evidence:** merged SHA, branch deletion, and absent worktree entry.

**Acceptance Criteria:**

**Given** available, unavailable, and installable rule fixtures
**When** the gallery is migrated
**Then** discovery, status, warning, and installation-entry behavior remain complete and accessible
**And** no automation contract or safety rule changes.

### Story 172.3: Migrate the Installed Automation Rules List

**Requirements:** FR12, FR13, FR27

As an operations user,
I want `/automation/installed-rules` to show installed automation state consistently,
So that I can identify active, paused, failed, or attention-required rules and open the correct detail workflow.

**Delivery Record:**

- **Route/User Value:** `/automation/installed-rules`; review installed rules, lifecycle status, and detail navigation.
- **Owned Surface:** route directory, `InstalledRulesList.tsx`, `InstalledRuleRow.tsx`, `PostInstallBanner.tsx`, exclusive tests.
- **Shared Dependencies:** 172.2 for shared automation presentation if reused; Epics 166-FE and 167.1.
- **Allowed Change Surface:** Owned Surface and automation-list tests/fixtures.
- **Forbidden Shared Files:** foundation, AppShell, API/hooks/types, dynamic editor owned by 172.4.
- **State Coverage:** loading, empty, populated, stale status, pending update, error, restricted action.
- **Responsive/Table/Chart Contract:** primary rule name/status/action retained on narrow width; secondary metadata progressively disclosed.
- **Accessibility Contract:** named row actions, status text/icons, keyboard detail navigation, focus preservation.
- **Test and Visual Evidence:** installed-list tests and state/responsive/theme screenshots.
- **Local Validation:** targeted tests plus Universal Local Validation Contract.
- **Branch/Worktree Lifecycle:** `cdx/epic-172-story-3-installed-rules`, dedicated temporary worktree.
- **Cleanup Evidence:** completed branch and worktree cleanup record.

**Acceptance Criteria:**

**Given** representative installed-rule lifecycle states
**When** the list is migrated
**Then** users can distinguish status and reach the correct detail route without changed query or navigation behavior
**And** applicable empty/error/update states satisfy the shared contracts.

### Story 172.4: Migrate the Installed Rule Detail and Editor

**Requirements:** FR12, FR13, FR27

As an authorized operations user,
I want `/automation/installed-rules/[id]` to provide a clear and safe rule editor,
So that I can review configuration, understand consequences, and save valid changes without losing input.

**Delivery Record:**

- **Route/User Value:** dynamic installed-rule detail/editor; inspect, validate, acknowledge, save, and verify rule configuration.
- **Owned Surface:** `src/app/(dashboard)/automation/installed-rules/[id]/**` and exclusive editor components/tests.
- **Shared Dependencies:** Story 172.3 and foundation/AppShell prerequisites.
- **Allowed Change Surface:** Owned Surface and editor E2E/visual fixtures.
- **Forbidden Shared Files:** tokens/primitives/AppShell, automation service/API/types, canned/list ownership.
- **State Coverage:** loading entity, not found, permission, pristine/dirty form, validation error, warning acknowledgement, save pending/success/failure, conflict where supported.
- **Responsive/Table/Chart Contract:** focused form layout, clear mobile action order; no table/chart requirement unless already rendered.
- **Accessibility Contract:** labels/descriptions/errors, error summary, unsaved-change focus behavior, Dialog/AlertDialog lifecycle, status announcement.
- **Test and Visual Evidence:** editor validation/writeback tests plus narrow/desktop/theme screenshots.
- **Local Validation:** targeted dynamic-route and form tests plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-172-story-4-installed-rule-detail`, dedicated temporary worktree.
- **Cleanup Evidence:** merge, branch deletion, and worktree-removal evidence.

**Acceptance Criteria:**

**Given** an authorized user and an existing installed rule
**When** the complete editor experience is migrated
**Then** configuration, acknowledgement, validation, saving, failure recovery, and post-save verification preserve existing business behavior
**And** missing or unauthorized entities never expose a broken editor.

### Story 172.5: Migrate Single-Product COGS Management

**Requirements:** FR10, FR12, FR13, FR14, FR27

As a finance or business user,
I want `/cogs` to provide fast and trustworthy product-cost assignment,
So that I can establish the cost basis and verify calculated margin for individual products.

**Delivery Record:**

- **Route/User Value:** `/cogs`; product discovery, single COGS add/edit/delete, coverage state, and margin feedback.
- **Owned Surface:** route directory; `ProductList*`, `SingleCogsForm`, `CogsEditDialog`, `CogsDeleteDialog`, COGS/margin cells and exclusive tests.
- **Shared Dependencies:** foundation/AppShell; this Story is owner for shared single-COGS presentation used by 172.6–172.8 where applicable.
- **Allowed Change Surface:** Owned Surface, exclusive COGS custom components, tests and fixtures.
- **Forbidden Shared Files:** tokens/primitives/AppShell, COGS API/hooks/types/calculations, bulk-only components.
- **State Coverage:** loading, empty, filtered empty, missing COGS, valid zero, edit/delete pending, save failure, saved-margin-pending, margin ready/error.
- **Responsive/Table/Chart Contract:** product identity/status/cost/margin/action primary columns; explicit narrow row-detail strategy and pagination preservation.
- **Accessibility Contract:** product-specific action names, currency/unit labels, numeric validation, warning confirmation, focus return, non-color margin direction.
- **Test and Visual Evidence:** single-COGS regression tests, keyboard flow, and state/responsive/theme screenshots.
- **Local Validation:** targeted COGS tests and Universal Local Validation Contract.
- **Branch/Worktree Lifecycle:** `cdx/epic-172-story-5-cogs`, dedicated temporary worktree.
- **Cleanup Evidence:** detailed merge and mandatory cleanup evidence.

**Acceptance Criteria:**

**Given** products with missing, existing, zero, unusual, and invalid COGS cases
**When** the route and owned dialogs/forms/table are migrated
**Then** users can save valid costs, recover from failure, and distinguish saved cost from margin-calculation state
**And** formatting and backend calculation semantics remain unchanged.

### Story 172.6: Migrate Bulk COGS Assignment

**Requirements:** FR11, FR12, FR13, FR14, FR27

As a finance user,
I want `/cogs/bulk` to make batch scope, validation, preview, and partial results explicit,
So that I can update many products safely and retry only failures.

**Delivery Record:**

- **Route/User Value:** `/cogs/bulk`; select, enter, validate, preview, submit, inspect, and retry bulk costs.
- **Owned Surface:** route directory; `src/components/custom/bulk-cogs/**`, `BulkCogsForm.tsx`, and exclusive tests.
- **Shared Dependencies:** Story 172.5 plus foundation/AppShell.
- **Allowed Change Surface:** Owned Surface, bulk COGS fixtures/tests.
- **Forbidden Shared Files:** tokens/primitives/AppShell, API/hooks/types, single-COGS owner components except through approved interfaces.
- **State Coverage:** no selection, validation errors, preview, submitting, all success, partial success, all failed, stale/conflicting row where supported.
- **Responsive/Table/Chart Contract:** persistent selected count; product/value/error/actions retained; focused mobile workflow; no chart.
- **Accessibility Contract:** labeled selection, focusable multi-row error summary, row errors, confirmation focus, polite progress, explicit partial-result headings.
- **Test and Visual Evidence:** selection/preview/partial-retry tests and multi-state responsive/theme screenshots.
- **Local Validation:** targeted bulk tests plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-172-story-6-cogs-bulk`, dedicated temporary worktree.
- **Cleanup Evidence:** branch/worktree removal and partial-result verification recorded.

**Acceptance Criteria:**

**Given** a mixed-validity product batch
**When** the bulk workflow is migrated and executed
**Then** exact scope and per-row validation are reviewable before submission and attempted/succeeded/failed results are explicit afterward
**And** retry defaults to failed items without resubmitting successful items.

### Story 172.7: Migrate COGS History

**Requirements:** FR12, FR27

As a finance user,
I want `/cogs/history` to present cost changes with clear context and traceability,
So that I can review what changed without ambiguity.

**Delivery Record:**

- **Route/User Value:** COGS history search, metadata, table, and pagination.
- **Owned Surface:** route directory; `CogsHistoryMeta*`, `CogsHistoryTable*`, `CogsHistoryPagination`, exclusive tests.
- **Shared Dependencies:** Story 172.5 plus foundation/AppShell.
- **Allowed Change Surface:** Owned Surface and history tests/fixtures.
- **Forbidden Shared Files:** tokens/primitives/AppShell, history API/hooks/types, other COGS routes.
- **State Coverage:** loading, empty, filtered empty, populated, stale/partial, error.
- **Responsive/Table/Chart Contract:** product/change/date/actor context, numeric precision, semantic headers, server pagination and narrow-width row detail.
- **Accessibility Contract:** accessible table name, announced sort/pagination where present, full currency precision and change direction text.
- **Test and Visual Evidence:** table/pagination regression plus responsive/theme screenshots.
- **Local Validation:** targeted history tests plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-172-story-7-cogs-history`, dedicated temporary worktree.
- **Cleanup Evidence:** merge and repository cleanup record.

**Acceptance Criteria:**

**Given** historical cost changes and empty/error fixtures
**When** the route is migrated
**Then** chronology, product identity, old/new values, actor metadata, filtering, and pagination remain traceable
**And** no history interpretation or query behavior changes.

### Story 172.8: Migrate the COGS Price Calculator

**Requirements:** FR12, FR27

As a business user,
I want `/cogs/price-calculator` to provide a clear input-to-result calculation flow,
So that I can evaluate pricing outcomes without misunderstanding units or assumptions.

**Delivery Record:**

- **Route/User Value:** price-calculator form, validation, assumptions, result, and reset/recalculation.
- **Owned Surface:** route directory and exclusive price-calculator components/tests.
- **Shared Dependencies:** Story 172.5 formatting/presentation plus foundation/AppShell.
- **Current Delivery State:** `done`. Feature commit `9adf7d331002ba35be9f571af264a0cca43d134d` migrated the live calculator presentation while all 24 read-only formula/business files and all 20 unreachable calculator files remained unchanged. Two fresh-context adversarial passes were completed and every accepted finding was fixed. The calculator suite passed at 70 files / 1,759 tests; the full corpus is covered at 19,383 passing tests by the four-worker run plus exact isolated environmental reruns; lint, TypeScript, max-lines, production build, and static E2E guards passed. Dynamic Playwright remained explicitly unavailable because Story 172.8 had no authorized `.env.e2e`; it was not reported as a pass. Feature PR #301 merged as `08191dae387b9f130ac291ba48e48b2047d63a34`; canonical reconciliation PR #303 merged as `0b4c9deb05725ceb5eda148f180c0b59432024a1`; both exact branch/worktree cleanups passed.
- **Allowed Change Surface:** Owned Surface and calculator tests/fixtures.
- **Forbidden Shared Files:** tokens/primitives/AppShell, calculation helpers/business formulas/API contracts unless explicitly proven presentation-only.
- **State Coverage:** pristine, valid input, field error, unusual warning, calculating, result, zero/negative result, failure.
- **Responsive/Table/Chart Contract:** readable focused form and result on mobile/desktop; preserve any existing breakdown table contract.
- **Accessibility Contract:** visible units, associated errors, logical result heading, announced completion, non-color profit direction.
- **Test and Visual Evidence:** formula-boundary regression fixtures plus authored form/result screenshot scenarios; dynamic browser execution remains an explicit environment gap.
- **Local Validation:** targeted calculator tests plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-172-story-8-price-calculator` was created from `35503067e7b49e8f2970437d17211c9a36913a65`; PR #301 merged the feature as `08191dae387b9f130ac291ba48e48b2047d63a34`.
- **Cleanup Evidence:** feature and reconciliation merge ancestry were proven on clean primary `main`; both remote/local Story branches, `/private/tmp/wb-repricer-fe-172-8-price-calculator`, `/private/tmp/wb-repricer-fe-172-8-reconciliation`, and their lifecycle records were removed, and worktrees were pruned.

**Acceptance Criteria:**

**Given** representative valid, zero, negative, and invalid inputs
**When** the calculator UI is migrated
**Then** inputs, units, assumptions, formulas, formatting, warnings, and results preserve current meaning
**And** visual refactoring does not alter calculations.

### Story 172.9: Migrate Communications Workspace

**Requirements:** FR12, FR13, FR27

As a customer-operations user,
I want `/communications` to provide consistent tabs, queues, conversations, and writeback feedback,
So that I can triage and respond without losing drafts or context.

**Delivery Record:**

- **Route/User Value:** feedback, questions, chats, claims, pinned reviews, reply/composer workflows and unread states.
- **Owned Surface:** route directory and communications-exclusive components/tests under the current domain paths.
- **Shared Dependencies:** foundation/AppShell.
- **Current Delivery State:** `done`. Commit `2ec7c7c5` migrated the communications presentation through PR #305, merged as `feb35cfd`. The Story closed as MINOR-GAP across eight production files plus a source-contract guard and dedicated E2E fixture/spec; 15 palette usages moved to semantic status/destructive/primary/warning tokens and the row action moved to the shared ghost Button without changing communication hooks, API/types, writeback semantics, selection, drafts, retry, or session behavior. Targeted proof passed at 84/84; the full Vitest floor passed at 19,394/0 across 1,218 files; lint, TypeScript, max-lines, and the 70-page webpack build passed. Dedicated E2E passed 11 with one intentional skip in two post-fix runs; light/dark visual review passed. Closeout PR #306 merged as `8036da81`.
- **Allowed Change Surface:** Owned Surface plus communications E2E/visual fixtures.
- **Forbidden Shared Files:** tokens/primitives/AppShell, communication hooks/API/types/writeback semantics.
- **State Coverage:** loading per section, empty, unread, draft, sending, success, partial/retryable writeback, session/network uncertainty, error.
- **Responsive/Table/Chart Contract:** tabs and queue/detail behavior preserve selection; mobile uses explicit list/detail transition; no chart requirement.
- **Accessibility Contract:** tab semantics, named conversation actions, composer labels, retained focus/draft, live-region moderation, Dialog/Sheet lifecycle.
- **Test and Visual Evidence:** existing writeback/retry regression tests, an 11-assertion source guard, dedicated six-scenario communications E2E, and light/dark visual review.
- **Local Validation:** targeted communications tests and integration-sensitive E2E plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-172-story-9-communications` merged through PR #305 as `feb35cfd`; docs closeout merged through PR #306 as `8036da81`.
- **Cleanup Evidence:** feature and closeout remote/local branches and temporary worktrees are absent; worktree pruning completed and primary `main` is clean and synchronized.

**Acceptance Criteria:**

**Given** representative conversations, unread states, drafts, and retryable failures
**When** the workspace is migrated
**Then** section navigation, selection, reply, retry, and status behavior remain complete without draft loss
**And** the route uses consistent responsive and accessible compositions.

### Story 172.10: Migrate Finances and Documents

**Requirements:** FR27

As a finance user,
I want `/finances` to present balances and documents consistently,
So that I can locate, filter, and download the correct financial evidence.

**Delivery Record:**

- **Route/User Value:** balance summary, document filters, table, pagination, and downloads.
- **Owned Surface:** route directory and finance-exclusive components/tests.
- **Shared Dependencies:** foundation/AppShell.
- **Current Delivery State:** `done`. Epic 166 merge `ab12ffe98f1b78cae49a66eea8bed7e16e7ed0f2` and Story 167.1 merge `a8dfe353` were reachable before execution; the final Story base was `50d49e7f72962d23952c76b69b2415a7fe9980a3`. Feature commit `e1406cd231017fa27af22c88a36550504b564bcf` migrated the exact ten-file Story-owned finance surface through PR #308, merged as `eb09f73525b189de0bc30ef7419050364cde624b`. The born-clean route gained the RTC table caption contract, named/focusable table overflow, explicit loading/empty/filtered-empty/partial-category/route-error states, download pending/success/visible-failure semantics, and stale-feedback reset when the file format changes, while finance hooks, API/types, query keys, pagination/filter parameters, download contracts, cabinet gating, and shared primitives remained unchanged. Targeted proof passed at 46/46; the full Vitest floor passed at 19,414/0 across 1,220 files; lint, TypeScript, max-lines, Prettier, `git diff --check`, and `npm run build -- --webpack` with 70/70 static pages passed. The standard Turbopack build was an explicit temporary-worktree infrastructure gap because the external `node_modules` symlink resolved outside its filesystem root and was not reported as a pass. The dedicated E2E wrapper passed 12 with one intentional manager-setup skip (3 setup + 2 orders + 7 finances passed), including deterministic query-bearing request interception and filtered-empty reset coverage. Three fresh review passes completed with every accepted finding fixed; route/component tests and E2E assertions prove the recorded DOM semantics, while live axe, light/dark, width-matrix, 200% zoom, reduced-motion, keyboard, and real-screen-reader proof remains an explicit Story 174.3 carry-out rather than a claimed pass. No backend, dependency, production, direct-main, force-push, shared-token, AppShell, or shared-primitive change occurred. The feature branch and exact temporary worktree are absent after cleanup. Because all previously shipped ledger rows also remain globally `planned`, the `/finances` row is intentionally left for the complete 76-route status/evidence reconciliation in Story 174.1 rather than creating a one-row exception.
- **Allowed Change Surface:** Owned Surface and download/filter tests.
- **Forbidden Shared Files:** tokens/primitives/AppShell, finance API/hooks/types/download contracts.
- **State Coverage:** loading, no documents, filtered empty, balance unavailable/partial, download pending/ready/failed, route error.
- **Responsive/Table/Chart Contract:** document identity/type/period/action primary columns; server filter/pagination preserved; full balance precision.
- **Accessibility Contract:** accessible table, named downloads, pending status announcement, non-color document/status meaning.
- **Test and Visual Evidence:** filter/pagination/download/state regressions, source-contract guards, dedicated E2E, and route/component DOM semantics passed; live axe, responsive/theme/zoom/reduced-motion/keyboard/real-SR screenshots remain explicitly assigned to Story 174.3.
- **Local Validation:** finance target 46/46; full Vitest 19,414/0/1,220; lint 0/0; TypeScript 0; max-lines PASS; Prettier PASS; webpack build 70/70; dedicated E2E wrapper 12 passed / 1 intentional skip; `git diff --check` PASS. Standard Turbopack build: explicit worktree-symlink infrastructure gap before Story compilation.
- **Branch/Worktree Lifecycle:** `cdx/epic-172-story-10-finances` at `e1406cd2` merged through PR #308 as `eb09f735`; documentation closeout commit `de5519db` merged through PR #309 as `e6d05de4`; the dedicated `/private/tmp/wb-repricer-fe-172-10-finances` worktree was removed.
- **Cleanup Evidence:** the feature and closeout local branches, remote branches, and remote-tracking refs are absent; the exact Story 172.10 temporary worktree is absent; `git worktree prune` completed without touching the active Story 172.11 lane; `origin/main` contains both merge commits before this canonical reconciliation.

**Acceptance Criteria:**

**Given** populated, empty, partial, and failed document states
**When** the finance route is migrated
**Then** balances, periods, filters, pagination, and downloads preserve current business and request behavior
**And** users can understand every asynchronous result.

### Story 172.11: Migrate the Monitor Route

**Requirements:** FR27

As an operations user,
I want `/monitor` to present key monitoring signals consistently,
So that I can identify current health and act on meaningful exceptions.

**Delivery Record:**

- **Route/User Value:** monitor KPIs, trends, status surfaces, tables, and actions.
- **Owned Surface:** `src/app/(dashboard)/monitor/**` and exclusive custom components/tests.
- **Shared Dependencies:** foundation/AppShell; no implicit ownership of `/monitoring` components.
- **Current Delivery State:** `done`. Story 172.11 started from the Story 172.10 closeout merge `e6d05de4`. Feature commit `d39ad37c` migrated the exact fourteen-file monitor surface through PR #311, merged as `8b172445`; closeout commit `8602fdbd` then merged through PR #312 as `73174259`. Eighteen legacy palette classes and nine hexadecimal color literals moved to semantic status/chart/foreground tokens without changing monitoring APIs, hooks, types, query behavior, state semantics, or the `/monitoring` surface. The nine-test source guard pins the fourteen-file BFS import closure and was mutation-checked by the independent reviewer. Targeted proof passed across 21 files and 155 tests; the full Vitest floor passed at 19,423/0 across 1,221 files; lint, TypeScript, max-lines, `git diff --check`, and the webpack production build passed. The repaired strict monitor E2E legend assertion passed, its pre-existing ambiguity was confirmed on clean `main`, and a warm monitor retry passed 4/0; a final credentialed full-suite rerun was not claimed after the backend login throttle was exhausted. One independent review completed as APPROVE-WITH-NOTES with the accepted LOW wording fix applied. Shared `STATUS_COLORS` remains explicitly owned by Story 172.12. Live axe, light/dark, width-matrix, 200% zoom, reduced-motion, keyboard, and real-screen-reader proof remains an explicit Story 174.3 carry-out. The feature and closeout branches and Story 172.11 temporary worktree are absent after cleanup; the active Story 172.12 worktree remains protected. Because shipped route-ledger rows remain globally `planned`, `/monitor` is intentionally left for the complete 76-route status/evidence reconciliation in Story 174.1.
- **Allowed Change Surface:** Owned Surface and route-specific tests/visuals.
- **Forbidden Shared Files:** tokens/primitives/AppShell, monitoring APIs/hooks/types, `/monitoring` owned files.
- **State Coverage:** loading, empty, stale, partial, degraded, healthy, error, action pending where applicable.
- **Responsive/Table/Chart Contract:** exception-first hierarchy; metric/table/chart contracts with units, periods, primary columns, and accessible summaries.
- **Accessibility Contract:** severity by text/icon/order, keyboard actions, chart alternative, theme contrast.
- **Test and Visual Evidence:** route/component regressions, exact source-contract guard, strict E2E assertion repair, and warm monitor retry passed; representative live theme/width/zoom/assistive-technology evidence remains assigned to Story 174.3.
- **Local Validation:** monitor target 21 files / 155 tests; full Vitest 19,423/0/1,221; lint 0/0; TypeScript 0; max-lines PASS; webpack build PASS; `git diff --check` PASS; strict E2E repair plus warm retry 4/0 PASS, with the final credentialed full-suite rerun explicitly not claimed after login throttling.
- **Branch/Worktree Lifecycle:** `cdx/epic-172-story-11-monitor` at `d39ad37c` merged through PR #311 as `8b172445`; documentation closeout commit `8602fdbd` merged through PR #312 as `73174259`; the dedicated `/private/tmp/wb-repricer-fe-172-11-monitor` worktree was removed.
- **Cleanup Evidence:** feature and closeout local branches, remote branches, remote-tracking refs, and the exact Story 172.11 temporary worktree are absent; pruning completed without touching the active Story 172.12 lane.

**Acceptance Criteria:**

**Given** healthy, degraded, partial, and unavailable monitoring data
**When** the route is migrated
**Then** operational meaning, period, freshness, table/chart evidence, and actions remain correct
**And** severity is not communicated by color alone.

### Story 172.12: Migrate the Monitoring Operations Console

**Requirements:** FR27

As an operations user,
I want `/monitoring` to provide an accessible health console,
So that I can inspect pipeline, heatmap, Telegram, and operational status without inconsistent controls.

**Delivery Record:**

- **Route/User Value:** monitoring KPIs, pipeline grid, heatmap, charts, metrics tables, Telegram status, tabs/sheets/dialogs.
- **Owned Surface:** `src/app/(dashboard)/monitoring/**` and exclusive monitoring components/tests.
- **Shared Dependencies:** foundation/AppShell; Story 172.11 hands off the exact shared `src/lib/monitoring-constants.ts` `STATUS_COLORS` migration because both `/monitor` and `/monitoring` consume it.
- **Allowed Change Surface:** Owned Surface and route E2E/visual fixtures; exact shared-owner exception `src/lib/monitoring-constants.ts` limited to `STATUS_COLORS` semantic-token values, plus direct `/monitor` consumer tests only when required to prove unchanged keys, labels, types, exports, and status meaning.
- **Forbidden Shared Files:** tokens/primitives/AppShell, monitoring API/hooks/types, every other shared file, `STATUS_LABELS`/type/export changes in the exact exception, and all `/monitor` production files.
- **State Coverage:** healthy/degraded/offline, loading, refresh, partial, stale, empty, Telegram disconnected/error, route error.
- **Responsive/Table/Chart Contract:** operations triage hierarchy; pipeline/heatmap alternatives; table primary columns; Sheet behavior on narrow screens.
- **Accessibility Contract:** grid/heatmap textual evidence, status labels, keyboard tabs/overlays, focus restoration, both themes.
- **Test and Visual Evidence:** route tests plus health matrix screenshots at key widths/themes.
- **Local Validation:** targeted monitoring tests/E2E plus universal checks and direct `/monitor` shared-constant consumer regressions.
- **Branch/Worktree Lifecycle:** `cdx/epic-172-story-12-monitoring`, dedicated temporary worktree.
- **Cleanup Evidence:** review, merge, branch deletion, and worktree removal.

**Acceptance Criteria:**

**Given** representative pipeline, heatmap, and Telegram health states
**When** the operations console is migrated
**Then** status, freshness, evidence, responsive overlays, and recovery remain understandable and operable
**And** specialized visualizations retain textual alternatives.

### Story 172.13: Migrate the MoySklad Integration Workspace

**Requirements:** FR12, FR13, FR27

As an integration manager,
I want `/moysklad` to present integration health, mappings, stock, products, and variants consistently,
So that I can diagnose and maintain mappings safely.

**Delivery Record:**

- **Route/User Value:** tabs, integration health, mappings/stock/products/variants tables, link-mapping dialog.
- **Owned Surface:** route directory and MoySklad-exclusive components/tests.
- **Shared Dependencies:** foundation/AppShell.
- **Allowed Change Surface:** Owned Surface and integration visual/E2E fixtures.
- **Forbidden Shared Files:** tokens/primitives/AppShell, MoySklad API/hooks/types/mapping semantics.
- **State Coverage:** disconnected/degraded/healthy, loading per tab, empty, filtered empty, mapping pending/success/error, stale/partial.
- **Responsive/Table/Chart Contract:** tab context retained; entity/status/action primary columns; large tables use deliberate scroll/detail strategy.
- **Accessibility Contract:** tab semantics, integration health text, mapping-dialog focus/errors, entity-specific actions.
- **Test and Visual Evidence:** tab/table/mapping regression tests and state/responsive/theme screenshots.
- **Local Validation:** targeted MoySklad tests plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-172-story-13-moysklad`, dedicated temporary worktree.
- **Cleanup Evidence:** integration behavior proof and mandatory cleanup record.

**Acceptance Criteria:**

**Given** connected, degraded, unmapped, and error fixtures
**When** the workspace is migrated
**Then** health, tab state, tables, mapping workflow, and recovery preserve existing integration behavior
**And** no mapping or synchronization contract changes.

### Story 172.14: Migrate the Orders Overview

**Requirements:** FR27

As an operations user,
I want `/orders` to present order status and aggregates consistently,
So that I can find affected orders and understand operational state quickly.

**Delivery Record:**

- **Route/User Value:** order filters, aggregate cards, orders table, statuses, pagination, and actions.
- **Owned Surface:** `src/app/(dashboard)/orders/page.tsx`, route-local overview components, order-shared components explicitly assigned to this Story, tests.
- **Shared Dependencies:** foundation/AppShell; this Story owns order-shared presentation used by 172.15–172.16 where documented.
- **Allowed Change Surface:** Owned Surface and shared order UI explicitly inventoried in the Story worktree.
- **Forbidden Shared Files:** tokens/primitives/AppShell, order API/hooks/types, FBO/integrity exclusive components.
- **State Coverage:** loading, empty, filtered empty, stale/partial, error, action pending/success/failure.
- **Responsive/Table/Chart Contract:** order identifier/status/amount/action primary columns; filters/pagination preserved; no unintended mobile clipping.
- **Accessibility Contract:** accessible table/sort/actions, status text/icons, full values and dates, keyboard filters.
- **Test and Visual Evidence:** orders overview tests and responsive/theme/state screenshots.
- **Local Validation:** targeted orders tests plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-172-story-14-orders`, dedicated temporary worktree.
- **Cleanup Evidence:** shared-owner inventory plus branch/worktree cleanup.

**Acceptance Criteria:**

**Given** representative order states and filters
**When** the overview route is migrated
**Then** aggregates, identifiers, statuses, filters, pagination, and actions preserve current behavior
**And** downstream order routes can consume the approved shared presentation without editing this Story's files.

### Story 172.15: Migrate FBO Orders

**Requirements:** FR27

As an operations user,
I want `/orders/fbo` to present FBO sales and statuses consistently,
So that I can review fulfillment-specific order evidence efficiently.

**Delivery Record:**

- **Route/User Value:** FBO aggregates, filters, sales/orders table, statuses and actions.
- **Owned Surface:** `src/app/(dashboard)/orders/fbo/**`, FBO-exclusive components/tests.
- **Shared Dependencies:** Story 172.14 plus foundation/AppShell.
- **Allowed Change Surface:** Owned Surface and FBO fixtures/tests.
- **Forbidden Shared Files:** foundation/AppShell, order shared owner files, API/hooks/types, integrity route.
- **State Coverage:** loading, empty, filtered empty, stale/partial, error, populated.
- **Responsive/Table/Chart Contract:** fulfillment identifier/status/amount/date/action primary columns; server controls preserved.
- **Accessibility Contract:** semantic table, sort/filter names, status text, dates and currency precision.
- **Test and Visual Evidence:** FBO table/filter tests and responsive/theme screenshots.
- **Local Validation:** targeted FBO tests plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-172-story-15-orders-fbo`, dedicated temporary worktree.
- **Cleanup Evidence:** completed lifecycle record.

**Acceptance Criteria:**

**Given** representative FBO records and route states
**When** the route is migrated
**Then** fulfillment-specific metrics, filters, table semantics, and navigation remain unchanged
**And** responsive/accessibility contracts are verified.

### Story 172.16: Migrate Order Integrity Analysis

**Requirements:** FR27

As an operations user,
I want `/orders/integrity` to show integrity checks and anomalies consistently,
So that I can understand data quality and reach the correct recovery action.

**Delivery Record:**

- **Route/User Value:** integrity summary/status cards, anomaly detail, filters, tables, actions/dialogs.
- **Owned Surface:** `src/app/(dashboard)/orders/integrity/**` and integrity-exclusive components/tests.
- **Shared Dependencies:** Story 172.14 plus foundation/AppShell.
- **Allowed Change Surface:** Owned Surface and integrity fixtures/tests.
- **Forbidden Shared Files:** tokens/primitives/AppShell, order shared owner files, integrity API/hooks/types.
- **State Coverage:** checking, healthy, warning, failed, partial, empty, stale, route error, corrective action lifecycle.
- **Responsive/Table/Chart Contract:** exception-first hierarchy; anomaly identifier/severity/evidence/action primary columns.
- **Accessibility Contract:** severity label/icon/order, Dialog focus, keyboard recovery actions, live status updates moderated.
- **Test and Visual Evidence:** integrity-state/action tests and health matrix screenshots.
- **Local Validation:** targeted integrity tests plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-172-story-16-order-integrity`, dedicated temporary worktree.
- **Cleanup Evidence:** review/merge and worktree cleanup.

**Acceptance Criteria:**

**Given** healthy, warning, failed, and partial integrity fixtures
**When** the route is migrated
**Then** anomaly meaning, evidence, severity, and recovery behavior remain correct and accessible
**And** no integrity calculation or backend contract changes.

### Story 172.17: Migrate Product Management

**Requirements:** FR10, FR12, FR13, FR14, FR27

As a catalog manager,
I want `/products` to present product lifecycle, list actions, and state consistently,
So that I can manage the catalog without ambiguous status or destructive actions.

**Delivery Record:**

- **Route/User Value:** product list/lifecycle, statuses, actions, confirmation dialogs, loading/empty/error behavior.
- **Owned Surface:** `src/app/(dashboard)/products/**`, product-exclusive custom components/tests.
- **Shared Dependencies:** foundation/AppShell.
- **Allowed Change Surface:** Owned Surface and product fixtures/tests.
- **Forbidden Shared Files:** tokens/primitives/AppShell, product API/hooks/types/business lifecycle.
- **State Coverage:** loading, empty, filtered empty where supported, active/inactive/status states, action pending/success/failure, destructive confirmation.
- **Responsive/Table/Chart Contract:** product identity/status/primary metric/action retained; explicit list/table narrow strategy.
- **Accessibility Contract:** product-specific action names, status text/icons, AlertDialog lifecycle, restored focus and announced result.
- **Test and Visual Evidence:** product lifecycle tests plus responsive/theme/state screenshots.
- **Local Validation:** targeted product tests plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-172-story-17-products`, dedicated temporary worktree.
- **Cleanup Evidence:** final Epic 172 route cleanup record and no remaining Story worktree.

**Acceptance Criteria:**

**Given** representative product lifecycle and failure states
**When** the complete products route is migrated
**Then** status, actions, confirmations, list behavior, and recovery preserve existing domain behavior
**And** the route satisfies all shared design-system contracts.

## Epic 173-FE: Predictable Settings, Shipments, and Supplies

Users can configure the service and manage shipments and supplies through consistent layouts, forms, entity details, dialogs, documents, and lifecycle status flows.

### Story 173.1: Migrate Settings Shell and Overview

**Requirements:** FR27

As an administrator,
I want `/settings` and its shared settings navigation to use the approved design system,
So that all configuration routes have a predictable responsive structure and active context.

**Delivery Record:**

- **Route/User Value:** `/settings`; settings overview plus shared two-column/navigation layout for seven settings routes.
- **Owned Surface:** `src/app/(dashboard)/settings/page.tsx`, `src/app/(dashboard)/settings/layout.tsx`, settings navigation components, exclusive tests.
- **Shared Dependencies:** Epics 166-FE and Story 167.1; this Story owns the settings layout consumed by 173.2–173.7.
- **Allowed Change Surface:** Owned Surface and settings-shell tests/fixtures.
- **Forbidden Shared Files:** tokens/primitives/AppShell, settings APIs/hooks/types, child-route exclusive components.
- **State Coverage:** overview loading/empty/error where applicable, active navigation, restricted item, compact/mobile navigation.
- **Responsive/Table/Chart Contract:** two-column desktop, intentional stacked/Sheet navigation on narrow widths; no table/chart requirement.
- **Accessibility Contract:** named settings navigation, visible current item, logical heading/focus order, mobile Sheet close/Escape/focus return.
- **Test and Visual Evidence:** layout/navigation tests and responsive/theme screenshots for all navigation states.
- **Local Validation:** targeted settings-shell tests plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-173-story-1-settings-shell`, dedicated temporary worktree from merged prerequisites.
- **Cleanup Evidence:** shared-owner inventory, merge SHA, branch deletion, and removed worktree.

**Acceptance Criteria:**

**Given** desktop and mobile settings navigation
**When** the settings shell and overview are migrated
**Then** all seven settings routes receive one accessible layout and active-route model without changed authorization or navigation semantics
**And** later settings Stories do not edit the shared shell silently.

### Story 173.2: Migrate Backfill Settings

**Requirements:** FR27

As an administrator,
I want `/settings/backfill` to present backfill status and actions consistently,
So that I can understand scope, start work safely, and verify long-running results.

**Delivery Record:**

- **Route/User Value:** backfill table, dialog, status, progress, and recovery.
- **Owned Surface:** route directory and backfill-exclusive components/tests.
- **Shared Dependencies:** Story 173.1 plus foundation/AppShell.
- **Allowed Change Surface:** Owned Surface and backfill fixtures/tests.
- **Forbidden Shared Files:** foundation, settings shell, backfill API/hooks/types/job semantics.
- **State Coverage:** loading, empty, queued/running, safe-to-leave, success, partial/failure, retry.
- **Responsive/Table/Chart Contract:** backfill item/status/time/action primary columns; explicit mobile detail.
- **Accessibility Contract:** named actions, progress announcement, Dialog focus, durable result summary.
- **Test and Visual Evidence:** job/dialog regression and responsive/theme/state screenshots.
- **Local Validation:** targeted backfill tests/E2E plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-173-story-2-settings-backfill`, dedicated worktree.
- **Cleanup Evidence:** job verification and branch/worktree cleanup.

**Acceptance Criteria:**

**Given** idle, running, completed, and failed backfill fixtures
**When** the route is migrated
**Then** exact scope, status, safe-leave guidance, result, and retry behavior remain correct
**And** duplicate submission is prevented.

### Story 173.3: Migrate Cabinet Settings

**Requirements:** FR27

As an administrator,
I want `/settings/cabinet` to show cabinet information and editable configuration clearly,
So that I can verify the active cabinet and change allowed values safely.

**Delivery Record:**

- **Route/User Value:** cabinet information, token/config status, permitted edits and confirmations.
- **Owned Surface:** route directory and cabinet-settings exclusive components/tests.
- **Shared Dependencies:** Story 173.1 plus foundation/AppShell.
- **Allowed Change Surface:** Owned Surface and cabinet-settings fixtures/tests.
- **Forbidden Shared Files:** foundation, settings shell, cabinet store/API/hooks/types/auth semantics.
- **State Coverage:** loading, unavailable/partial info, valid form, validation error, save pending/success/failure, restricted action.
- **Responsive/Table/Chart Contract:** focused readable form/info cards; no table/chart unless existing.
- **Accessibility Contract:** explicit cabinet context, labels/errors, confirmation focus, announced save outcome.
- **Test and Visual Evidence:** cabinet form regression plus responsive/theme screenshots.
- **Local Validation:** targeted cabinet tests plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-173-story-3-settings-cabinet`, dedicated worktree.
- **Cleanup Evidence:** behavior proof and mandatory cleanup.

**Acceptance Criteria:**

**Given** valid, invalid, restricted, and failed cabinet settings states
**When** the route is migrated
**Then** displayed identity, validation, save, and recovery behavior preserve existing cabinet semantics
**And** no active-cabinet or authentication state changes implicitly.

### Story 173.4: Migrate Expense Settings

**Requirements:** FR27

As a finance administrator,
I want `/settings/expenses` to present expense configuration and dialogs consistently,
So that I can understand and maintain cost assumptions safely.

**Delivery Record:**

- **Route/User Value:** expense cards/list, add/edit/delete dialogs, validation and result feedback.
- **Owned Surface:** route directory and expense-settings exclusive components/tests.
- **Shared Dependencies:** Story 173.1 plus foundation/AppShell.
- **Allowed Change Surface:** Owned Surface and expense fixtures/tests.
- **Forbidden Shared Files:** tokens/primitives/AppShell/settings shell, expense API/hooks/types/calculations.
- **State Coverage:** loading, empty, populated, validation error, save/delete pending/success/failure.
- **Responsive/Table/Chart Contract:** expense name/value/period/status/action retained; dialogs fit narrow viewports.
- **Accessibility Contract:** currency/period labels, entity-specific actions, error association, AlertDialog focus return.
- **Test and Visual Evidence:** CRUD regression plus responsive/theme/state screenshots.
- **Local Validation:** targeted expense tests plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-173-story-4-settings-expenses`, dedicated worktree.
- **Cleanup Evidence:** CRUD proof and branch/worktree cleanup.

**Acceptance Criteria:**

**Given** representative expense records and validation failures
**When** the route is migrated
**Then** add, edit, delete, period, value, and confirmation behavior remain unchanged
**And** destructive actions remain distinct from routine primary actions.

### Story 173.5: Migrate Notification Settings

**Requirements:** FR27

As an administrator,
I want `/settings/notifications` to provide a coherent notification and Telegram configuration experience,
So that I can control channels and quiet hours without ambiguous status or light-only styling.

**Delivery Record:**

- **Route/User Value:** notification panels, Telegram binding, quiet hours, tabs/settings, status and writeback.
- **Owned Surface:** route directory and notification-exclusive components/tests including binding modal.
- **Shared Dependencies:** Story 173.1, semantic external-brand token from 166-FE, AppShell.
- **Allowed Change Surface:** Owned Surface and notification visual/E2E fixtures.
- **Forbidden Shared Files:** tokens except consumed variables, primitives, settings shell, notification API/hooks/types.
- **State Coverage:** loading, bound/unbound, connecting, verification pending, save success/failure, unavailable Telegram, quiet-hours validation.
- **Responsive/Table/Chart Contract:** settings panels and modal reflow; no table/chart requirement.
- **Accessibility Contract:** switch labels/state, Telegram status text/icon, time-field errors, modal focus lifecycle, both themes.
- **Test and Visual Evidence:** binding/quiet-hours regression and light/dark responsive screenshots.
- **Local Validation:** targeted notification tests/E2E plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-173-story-5-settings-notifications`, dedicated worktree.
- **Cleanup Evidence:** external-brand/theme proof and cleanup record.

**Acceptance Criteria:**

**Given** bound, unbound, pending, invalid, and failed notification states
**When** the complete route is migrated
**Then** channel, Telegram, quiet-hours, validation, and save semantics remain intact
**And** all hardcoded white/gray/Telegram presentation is replaced by registered semantic tokens.

### Story 173.6: Migrate Tariff Settings

**Requirements:** FR27

As an administrator,
I want `/settings/tariffs` to present tariff configuration clearly,
So that I can understand current values, units, validation, and save outcomes.

**Delivery Record:**

- **Route/User Value:** tariff form, current values, units, validation, save/reset.
- **Owned Surface:** route directory and tariff-exclusive components/tests.
- **Shared Dependencies:** Story 173.1 plus foundation/AppShell.
- **Allowed Change Surface:** Owned Surface and tariff fixtures/tests.
- **Forbidden Shared Files:** foundation/settings shell, tariff API/hooks/types/calculations.
- **State Coverage:** loading, valid/pristine/dirty, validation error, pending, success, failure, partial/unavailable values.
- **Responsive/Table/Chart Contract:** readable focused form with stable action order.
- **Accessibility Contract:** units and descriptions associated, error summary where needed, save announcement.
- **Test and Visual Evidence:** form regression and responsive/theme screenshots.
- **Local Validation:** targeted tariff tests plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-173-story-6-settings-tariffs`, dedicated worktree.
- **Cleanup Evidence:** merge and worktree cleanup.

**Acceptance Criteria:**

**Given** valid, invalid, partial, and failed tariff states
**When** the route is migrated
**Then** values, units, validation, and saving preserve current business meaning
**And** valid input survives recoverable failure.

### Story 173.7: Migrate Tax Settings

**Requirements:** FR27

As a finance administrator,
I want `/settings/tax` to present tax configuration and consequences clearly,
So that I can save accurate settings without misunderstanding percent or period semantics.

**Delivery Record:**

- **Route/User Value:** tax form, rate/type context, validation, warning, save/reset.
- **Owned Surface:** route directory and tax-exclusive components/tests.
- **Shared Dependencies:** Story 173.1 and financial presentation foundation.
- **Allowed Change Surface:** Owned Surface and tax fixtures/tests.
- **Forbidden Shared Files:** foundation/settings shell, tax API/hooks/types/calculations.
- **State Coverage:** loading, pristine/dirty, valid, invalid, unusual warning, pending, success, failure.
- **Responsive/Table/Chart Contract:** focused form; percent/period units remain visible.
- **Accessibility Contract:** labeled rate/type, warning confirmation, errors, focus/announcement, non-color consequence.
- **Test and Visual Evidence:** tax form boundary tests and responsive/theme screenshots.
- **Local Validation:** targeted tax tests plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-173-story-7-settings-tax`, dedicated worktree.
- **Cleanup Evidence:** calculation-semantics proof and cleanup record.

**Acceptance Criteria:**

**Given** representative tax types, rates, invalid values, and save failures
**When** the route is migrated
**Then** percent formatting, validation, warnings, persistence, and resulting displayed state remain unchanged
**And** presentation changes do not alter tax calculation semantics.

### Story 173.8: Migrate the Shipments List

**Requirements:** FR27

As a fulfillment user,
I want `/shipments` to provide a clear shipment queue,
So that I can find, create, inspect, and act on shipments by lifecycle status.

**Delivery Record:**

- **Route/User Value:** shipment list, filters, lifecycle status, create/actions, empty/loading/error.
- **Owned Surface:** route entry, list-owned files in `src/components/custom/shipments/**`, and tests explicitly inventoried by this Story.
- **Shared Dependencies:** foundation/AppShell; this Story owns shipment-shared status/list compositions used by 173.9–173.11 where documented.
- **Allowed Change Surface:** owned shipment list/shared files and tests.
- **Forbidden Shared Files:** tokens/primitives/AppShell, shipment API/hooks/types/calculations, detail/box/packaging exclusive files.
- **State Coverage:** loading, empty, filtered empty, status variants, stale/partial, create pending/success/failure, route error.
- **Responsive/Table/Chart Contract:** shipment identifier/status/date/primary action retained; explicit narrow queue strategy.
- **Accessibility Contract:** named row/actions, lifecycle status text/icons, create Dialog focus and errors.
- **Test and Visual Evidence:** list/create/status tests and responsive/theme screenshots.
- **Local Validation:** targeted shipment tests plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-173-story-8-shipments`, dedicated worktree.
- **Cleanup Evidence:** shared shipment ownership manifest and cleanup evidence.

**Acceptance Criteria:**

**Given** representative shipment lifecycle and route states
**When** the list and its complete owned tree are migrated
**Then** filters, statuses, creation, actions, and detail navigation preserve existing behavior
**And** shared shipment files have one explicit owner.

### Story 173.9: Migrate Shipment Detail

**Requirements:** FR27

As a fulfillment user,
I want `/shipments/[id]` to present shipment calculation, pallets, validation, and lifecycle actions coherently,
So that I can complete shipment work without losing entity context.

**Delivery Record:**

- **Route/User Value:** dynamic detail header, results, pallet accordion, validation panels, actions and state.
- **Owned Surface:** route directory and detail-exclusive files under `src/components/custom/shipments/**`, plus tests.
- **Shared Dependencies:** Story 173.8 plus foundation/AppShell.
- **Allowed Change Surface:** detail-owned files and fixtures/tests.
- **Forbidden Shared Files:** shared list owner, tokens/primitives/AppShell, shipment API/hooks/types/calculations.
- **State Coverage:** loading, not found, partial calculation, validation warning/error, action pending/success/failure, completed lifecycle.
- **Responsive/Table/Chart Contract:** contextual detail; pallet accordion/table primary fields; mobile detail remains navigable.
- **Accessibility Contract:** entity heading, Accordion semantics, validation summary, action confirmation/focus, status announcement.
- **Test and Visual Evidence:** dynamic detail/calculation/lifecycle regressions and responsive/theme/state screenshots.
- **Local Validation:** targeted shipment detail tests/E2E plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-173-story-9-shipment-detail`, dedicated worktree.
- **Cleanup Evidence:** calculation preservation and cleanup record.

**Acceptance Criteria:**

**Given** valid, partial, invalid, missing, and completed shipments
**When** the detail experience is migrated
**Then** calculations, pallets, validations, documents/actions, and lifecycle state preserve existing meaning
**And** missing entities use an explicit recoverable not-found experience.

### Story 173.10: Migrate Shipment Box Types

**Requirements:** FR27

As a fulfillment administrator,
I want `/shipments/box-types` to provide consistent box-type CRUD,
So that I can maintain dimensions and activation state safely.

**Delivery Record:**

- **Route/User Value:** box-types table, empty state, dimension fields, create/edit/deactivate dialogs.
- **Owned Surface:** route entry and `src/components/custom/box-types/**` plus exclusive tests.
- **Shared Dependencies:** Story 173.8 plus foundation/AppShell.
- **Allowed Change Surface:** Owned Surface and CRUD fixtures/tests.
- **Forbidden Shared Files:** foundation/AppShell, shipment shared owner, API/hooks/types/dimension rules.
- **State Coverage:** loading, empty, populated, validation, create/edit pending/success/failure, deactivate confirmation.
- **Responsive/Table/Chart Contract:** type/name/dimensions/status/action primary data; responsive table and dialogs.
- **Accessibility Contract:** dimension units, field errors, named row actions, AlertDialog focus return.
- **Test and Visual Evidence:** box CRUD/dimension tests and responsive/theme screenshots.
- **Local Validation:** targeted box-type tests plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-173-story-10-box-types`, dedicated worktree.
- **Cleanup Evidence:** CRUD proof and cleanup record.

**Acceptance Criteria:**

**Given** valid, invalid, active, and inactive box-type fixtures
**When** the route is migrated
**Then** dimensions, validation, CRUD, activation state, and confirmations remain unchanged
**And** units and destructive actions are unambiguous.

### Story 173.11: Migrate SKU Packaging

**Requirements:** FR27

As a fulfillment user,
I want `/shipments/sku-packaging` to present packaging configuration consistently,
So that I can map SKUs to valid packaging without ambiguous validation.

**Delivery Record:**

- **Route/User Value:** SKU packaging list/form, validation, edit/save states.
- **Owned Surface:** route entry and packaging-exclusive shipment components/tests.
- **Shared Dependencies:** Stories 173.8 and 173.10 where box-type presentation is consumed.
- **Allowed Change Surface:** owned packaging files/tests.
- **Forbidden Shared Files:** foundation/AppShell, box-type owner, shipment API/hooks/types/packing rules.
- **State Coverage:** loading, empty, filtered empty, valid/invalid mapping, pending, success, failure.
- **Responsive/Table/Chart Contract:** SKU/package/status/action primary columns; narrow row detail.
- **Accessibility Contract:** entity-specific labels/actions, unit descriptions, validation summary, result announcement.
- **Test and Visual Evidence:** packaging validation/save tests and responsive/theme screenshots.
- **Local Validation:** targeted packaging tests plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-173-story-11-sku-packaging`, dedicated worktree.
- **Cleanup Evidence:** branch/worktree cleanup and no shared-owner drift.

**Acceptance Criteria:**

**Given** mapped, unmapped, invalid, and failed packaging fixtures
**When** the route is migrated
**Then** SKU identity, package selection, validation, saving, and status preserve current rules
**And** narrow-width use remains complete.

### Story 173.12: Migrate Supplies List

**Requirements:** FR27

As a supply-chain user,
I want `/supplies` to provide a clear lifecycle queue,
So that I can find, create, and open supplies by status.

**Delivery Record:**

- **Route/User Value:** supply list, filters/status, create/open actions, empty/loading/error.
- **Owned Surface:** route entry and list/shared files in `src/components/custom/supplies/**` explicitly inventoried by this Story, plus tests.
- **Shared Dependencies:** foundation/AppShell; owner for supply-shared list/status compositions used by 173.13.
- **Allowed Change Surface:** owned supply list/shared files and tests.
- **Forbidden Shared Files:** foundation/AppShell, supply API/hooks/types, detail-exclusive files.
- **State Coverage:** loading, empty, filtered empty, lifecycle statuses, stale/partial, create pending/success/failure, error.
- **Responsive/Table/Chart Contract:** supply identifier/status/date/action retained; explicit narrow queue strategy.
- **Accessibility Contract:** named actions, status label/icon, create overlay focus/errors, keyboard navigation.
- **Test and Visual Evidence:** list/status/create tests and responsive/theme screenshots.
- **Local Validation:** targeted supplies tests plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-173-story-12-supplies`, dedicated worktree.
- **Cleanup Evidence:** supply shared-owner manifest and cleanup record.

**Acceptance Criteria:**

**Given** representative supply lifecycle and route states
**When** the list is migrated
**Then** filters, status, creation, and detail navigation preserve current behavior
**And** all shared supply files have explicit ownership.

### Story 173.13: Migrate Supply Detail

**Requirements:** FR27

As a supply-chain user,
I want `/supplies/[id]` to present status, orders, documents, and lifecycle actions coherently,
So that I can progress or close a supply with clear consequences and verification.

**Delivery Record:**

- **Route/User Value:** dynamic supply detail, status stepper, orders table, documents, order-picker drawer, close dialog, sticker and acceptance-act flows.
- **Owned Surface:** route directory and detail-exclusive `src/components/custom/supplies/**` files/tests.
- **Shared Dependencies:** Story 173.12 plus foundation/AppShell.
- **Allowed Change Surface:** detail-owned files and route fixtures/tests.
- **Forbidden Shared Files:** supply shared owner, tokens/primitives/AppShell, API/hooks/types/lifecycle rules.
- **State Coverage:** loading, not found, partial, lifecycle states, document pending/error, picker states, close pending/success/failure.
- **Responsive/Table/Chart Contract:** status and primary action remain visible; orders table primary columns; Drawer/mobile detail contract.
- **Accessibility Contract:** stepper text/current state, table semantics, Drawer/Dialog focus return, named document/actions, announcements.
- **Test and Visual Evidence:** dynamic lifecycle/orders/documents/close regression and responsive/theme/state screenshots.
- **Local Validation:** targeted supply detail tests/E2E plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-173-story-13-supply-detail`, dedicated worktree.
- **Cleanup Evidence:** final Epic 173 branch/worktree cleanup and not-found proof.

**Acceptance Criteria:**

**Given** supplies across lifecycle, missing, partial, and failed document/action states
**When** the complete detail tree is migrated
**Then** status progression, orders, documents, picker, sticker, acceptance act, and close behavior preserve current domain rules
**And** every overlay and responsive transition has correct keyboard/focus behavior.

## Epic 174-FE: Complete Migration Assurance and Legacy Removal

Users receive a fully consistent frontend with every route accounted for, no known legacy UI gaps, preserved backend and business semantics, verified accessibility/responsiveness/themes, and no abandoned branches or temporary worktrees.

### Story 174.1: Prove BMAD, Route-Ledger, and OMX Plan Parity

**Requirements:** FR31, FR35

As the frontend owner,
I want every migration Story, route, and execution plan to have exact one-to-one traceability,
So that no surface is skipped, duplicated, or executed without clear ownership.

**Delivery Record:**

- **Route/User Value:** all 76 routes and 94 Stories; complete accountable migration scope.
- **Owned Surface:** route ledger, BMAD migration artifact, OMX master/per-Story plans, parity validators and planning documentation.
- **Shared Dependencies:** Epics 166–173-FE planning/implementation records available.
- **Allowed Change Surface:** planning, tracking, and non-product validation scripts only.
- **Forbidden Shared Files:** runtime UI, API/hooks/types, tokens/primitives, route implementation.
- **State Coverage:** every route has applicable-state ownership and evidence fields; no implementation state is changed here.
- **Responsive/Table/Chart Contract:** verify each route Story declares its specific contract.
- **Accessibility Contract:** verify each Story declares automated and manual evidence.
- **Test and Visual Evidence:** machine check: 76 source routes = 76 ledger routes = 76 route Stories; 94 BMAD Stories = 94 OMX plans; no duplicates.
- **Local Validation:** parity validator plus documentation checks and `git diff --check`.
- **Branch/Worktree Lifecycle:** `cdx/epic-174-story-1-plan-parity`, dedicated worktree.
- **Cleanup Evidence:** merged tracking artifacts, deleted branch, removed worktree.

**Acceptance Criteria:**

**Given** the current source routes, BMAD artifact, route ledger, and OMX plan directory
**When** parity validation runs
**Then** every route and Story maps exactly once with matching IDs, prerequisites, ownership, and evidence schema
**And** any missing, duplicate, orphaned, or title-mismatched item fails validation.

**Current Delivery State:** `done`. Story 174.1 started from base `9d611369` with an exact nine-file planning/validator manifest. Honest RED captured the missing validator. The dependency-free implementation proves 94 BMAD Stories = 94 OMX plans and 76 source routes = 76 route-ledger rows = 76 route Stories, resolves all 76 linked implementation artifacts, validates the two exact backend exceptions, exercises 33 deterministic positive/negative tests, and retains all 76 route-ledger rows as `planned`. Exact pinned local validation passed, including lint, type-check, policy checks, exact-scope privacy, webpack production build, and the canonical schema-v3 validator; repository-wide privacy still reports only the two unchanged historical raw-browser-capture findings and is not relabeled as a pass. Fresh repaired-base plus final-delta review convergence completed with zero actionable P0-P3 findings. Feature commit `4c930a9d` merged through PR #369 as `360c9cb9`; exact-five closeout commit `0492403d` merged through PR #370 as `fbdab2da`. Primary `main` was fast-forwarded after both merges, and exact feature plus initial-closeout local/remote branch, worktree, path, stale registration, and open-PR residue are absent. Runtime UI, backend product code, responsive/browser evidence, and route implementation remain unchanged. Story 174.2 is next.

### Story 174.2: Remove Legacy UI and Enforce the Design-System Boundary

**Requirements:** FR18, FR19, FR21, FR30, FR31, FR35

As a user and maintainer,
I want migrated scope to contain no obsolete styling or duplicate interaction system,
So that the interface remains consistent and future work does not recreate the previous fragmentation.

**Delivery Record:**

- **Route/User Value:** all migrated surfaces; consistent semantic presentation and interaction.
- **Owned Surface:** obsolete legacy UI variants, approved static checks, dependency cleanup, and migration exceptions register.
- **Shared Dependencies:** all route migrations merged and Story 174.1 parity passing.
- **Allowed Change Surface:** proven-unused legacy files/classes/dependencies and bounded enforcement scripts/config/docs.
- **Forbidden Shared Files:** business logic, APIs/hooks/types, active components without verified consumer migration; no broad mechanical deletion.
- **Wave additions (168.11):** the `ResponsiveChartFrame` shared component is owned by Story 174.2 (legacy-enforcement wave) — route stories consume it read-only.
- **State Coverage:** enforcement checks semantic tokens, raw controls, primitive boundaries, hardcoded colors, both theme surfaces.
- **Responsive/Table/Chart Contract:** no specialized table/chart/virtualization deletion without equivalent verified consumers.
- **Accessibility Contract:** exceptions require semantic/native justification; removal cannot regress accessible behavior.
- **Test and Visual Evidence:** zero unregistered production colors/raw controls within defined scope, zero orphaned migrated variants, full regression tests.
- **Local Validation:** static audits, targeted regressions, universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-174-story-2-legacy-enforcement`, dedicated worktree.
- **Cleanup Evidence:** deletion manifest, review proof, branch/worktree cleanup.

**Acceptance Criteria:**

**Given** all migrated consumers and the approved exceptions register
**When** legacy cleanup and enforcement are applied
**Then** obsolete variants, duplicated compositions, unregistered colors, and unjustified raw controls are removed or fail bounded checks
**And** no active specialized behavior or business logic is deleted.

### Story 174.3: Complete Accessibility, Responsive, Theme, and Visual Verification

**Requirements:** FR21, FR35

As a user across supported devices and access needs,
I want every migrated route to remain understandable and operable,
So that the design-system migration is genuinely inclusive rather than visually uniform only.

**Delivery Record:**

- **Route/User Value:** all 76 routes across critical states, widths, themes, keyboard, zoom, and assistive semantics.
- **Owned Surface:** route verification fixtures, Playwright/axe coverage, screenshots/baselines, accessibility and visual evidence reports.
- **Shared Dependencies:** all route Stories merged; Stories 174.1–174.2 passing.
- **Allowed Change Surface:** tests/evidence plus narrowly scoped defect fixes returned to or coordinated with the owning Story surface.
- **Forbidden Shared Files:** unreviewed cross-domain redesign or contract changes hidden inside verification.
- **State Coverage:** ledger-applicable default/loading/refresh/empty/filtered/error/stale/partial/permission/pending/partial-success/not-found states.
- **Responsive/Table/Chart Contract:** `320`, common mobile, `768`, `1024`, `1280`, large desktop; all declared table/chart strategies verified.
- **Accessibility Contract:** WCAG 2.2 AA target, keyboard/focus, 200% zoom, reduced motion, semantic data, both themes.
- **Test and Visual Evidence:** route matrix, axe results, manual keyboard/focus notes, light/dark screenshots, realistic Russian/financial fixtures.
- **Local Validation:** full visual/accessibility suite plus universal checks.
- **Branch/Worktree Lifecycle:** `cdx/epic-174-story-3-inclusive-visual-verification`, dedicated worktree.
- **Cleanup Evidence:** final evidence index, resolved findings, deleted branch, removed worktree.

**Acceptance Criteria:**

**Given** the complete route ledger and representative state fixtures
**When** the inclusive visual matrix is executed
**Then** every route has recorded responsive, theme, accessibility, keyboard, and visual evidence or an explicit unresolved blocker
**And** zero automated violations alone is never accepted as complete manual verification.

### Story 174.4: Complete Full Local Functional and Backend-Contract Regression

**Requirements:** FR18, FR19, FR35

As the frontend owner,
I want the entire migrated application validated against the local backend and existing test suite,
So that visual modernization does not change requests, calculations, domain behavior, or critical journeys.

**Delivery Record:**

- **Route/User Value:** all routes and critical journeys on `localhost:3100` with backend `localhost:3000`.
- **Owned Surface:** full regression configuration/evidence and narrowly scoped owner-coordinated fixes.
- **Shared Dependencies:** all route Stories and Story 174.3 merged.
- **Allowed Change Surface:** tests/evidence and reviewed fixes within explicit route ownership.
- **Forbidden Shared Files:** backend code, production/deployment config, contract changes, required CI gates.
- **State Coverage:** authentication/onboarding, COGS single/bulk, analytics, writeback, exports, long jobs, dynamic entities, session/error recovery.
- **Responsive/Table/Chart Contract:** verify no request duplication/performance regression caused by responsive/composition changes.
- **Accessibility Contract:** critical journey keyboard and status-announcement smoke remains part of functional verification.
- **Test and Visual Evidence:** full Vitest, relevant Playwright suites, request/contract probes, build, lint, type-check, max-lines.
- **Local Validation:** complete pinned-runtime local suite with preserved failure output.
- **Branch/Worktree Lifecycle:** `cdx/epic-174-story-4-full-local-regression`, dedicated worktree.
- **Cleanup Evidence:** regression report, resolved findings, branch/worktree cleanup.

**Acceptance Criteria:**

**Given** the pinned local frontend/backend environment
**When** the complete regression suite and critical journeys run
**Then** requests, headers, query behavior, calculations, formatting, authorization, route state, and mutation outcomes match established behavior
**And** all failures are resolved or explicitly block completion without production actions.

### Story 174.5: Finalize Documentation and Repository Cleanup

**Requirements:** FR30, FR31, FR35

As the frontend owner,
I want the completed migration documented and all temporary Git resources removed,
So that future agents inherit an accurate design-system contract and a clean repository.

**Delivery Record:**

- **Route/User Value:** complete product; reliable future maintenance and no stale implementation artifacts.
- **Owned Surface:** canonical frontend/design-system docs, route ledger final status, delivery manifest, retrospective, cleanup report.
- **Shared Dependencies:** Stories 174.1–174.4 complete with no unresolved migration blocker.
- **Allowed Change Surface:** documentation/tracking and safe Git cleanup for already merged migration resources.
- **Forbidden Shared Files:** runtime product behavior; unrelated branches/worktrees; production operations.
- **State Coverage:** all ledger rows `verified`; all exception records resolved or explicitly accepted by owner.
- **Responsive/Table/Chart Contract:** final documentation records reusable contracts and remaining justified exceptions.
- **Accessibility Contract:** final report records achieved evidence and any explicitly accepted environment gaps.
- **Test and Visual Evidence:** doc links resolve; Story/route/evidence parity passes; `git diff --check`; clean intended worktree state.
- **Local Validation:** documentation/parity checks plus final repository status/worktree/branch audit.
- **Branch/Worktree Lifecycle:** `cdx/epic-174-story-5-docs-cleanup`, final dedicated worktree.
- **Cleanup Evidence:** all completed migration remote/local branches deleted, all temporary migration worktrees removed, final `git worktree list` and branch audit attached.

**Acceptance Criteria:**

**Given** all migration Stories are merged and verified
**When** documentation and repository cleanup complete
**Then** canonical docs describe tokens, primitives, compositions, ownership, responsive/accessibility patterns, and Story delivery workflow accurately
**And** no completed migration branch or temporary worktree remains.

---

## Wave Contrast Ledger — 168.x migration wave (added by 168.11)

Known-accepted contrast decisions of the 168 wave (summary of ledger addendum cont.9-10):

- **/80-policy**: where a semantic tier needs reduced emphasis on a same-hue surface, the wave idiom is the Tailwind opacity modifier on the SEMANTIC token (e.g. `text-status-warning/80`, `bg-status-information/10`), never a raw palette shade. Pinned in 168.3 (`top-table-utils` 4-tier: ≥30 `text-financial-positive`, ≥15 `text-status-warning`, ≥0 `text-status-warning/80`, <0 `text-financial-negative`, null `text-muted-foreground`).
- **/15-chip idiom**: status chips/badges use `bg-<token>/15 text-<token>` (168.8 alerts/ReorderTable; 168.11 profitability badges + summary-chip set). Accepted: token-on-/15-of-itself contrast is the standard chip surface; dark-mode trust is in the token pair, not per-site math.
- **/15-chip warnings**: `/15` must be applied ONLY to a matched bg+text token pair; mixing a `/15` bg with an unrelated text token or a raw palette text fails the idiom (the cont.9-10 escalations were exactly such mismatches). `/10` informational info-boxes follow the same matched-pair rule (168.11 Empty-state precedent).
- Sign-tokens (`financial-positive|negative`) keep 3 visual states (pos/neg/zero→muted or `chart-reference` in SVG) — reducing to 2 is a forbidden tier-collapse (168.10/168.11 guards).

Owner of this ledger: the Epic 174-FE legacy-enforcement wave (174.2) consolidates it into the final exceptions register.

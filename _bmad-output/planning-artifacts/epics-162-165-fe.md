---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - docs/prd.md
  - docs/front-end-architecture.md
  - docs/front-end-spec.md
  - docs/polish/keyboard-sort-headers.md
  - docs/request-backend/224-automation-canned-rules-backend-contract.md
  - _bmad-output/planning-artifacts/epics-127-fe.md
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - docs/FRONTEND-WORK-SUMMARY.md
  - docs/EPICS-AND-STORIES-TRACKER.md
  - CLAUDE-ANTI-PATTERNS.md
---

# Frontend - Epic 162-FE Requirements Inventory

## Overview

This document defines the verified frontend debt-closure scope discovered after the localhost-only cleanup and validation pass on 2026-08-03. It covers local E2E reliability, accessibility, incomplete product flows, data-display semantics, API error-path tests, maintainability, and documentation synchronization. Production deployment and CI/CD infrastructure are explicitly outside this epic.

## Requirements Inventory

### Functional Requirements

FR1: Provide a reproducible localhost E2E preflight that verifies the frontend on port 3100, the backend on port 3000, required `.env.e2e` credentials, authentication setup, and non-mutating test defaults before browser tests start.

FR2: Replace all tautological E2E assertions such as `expect(value || true)` and `expect(count >= 0)` with assertions that fail when the required user-visible behavior is absent.

FR3: Replace fixed `page.waitForTimeout()` synchronization in active E2E coverage with locator, navigation, response, or application-state waits that have bounded timeouts and actionable failure messages.

FR4: Make every conditional E2E skip explicit and diagnosable by providing a condition and reason; critical smoke tests must fail on missing required fixtures instead of silently skipping.

FR5: Add a supported mobile Playwright project for the product's secondary mobile target, with mobile-specific navigation expectations and a bounded critical-route smoke set.

FR6: Make every sortable advertising table header keyboard operable through semantic buttons, accessible names, focus visibility, and correct `aria-sort` state.

FR7: Complete the automation-rule workflow by providing installed-rule navigation and an editor backed by `GET/PATCH /v1/automation/rules/:id`, including loading, error, validation, save, and safety states.

FR8: Distinguish a genuine monetary zero from missing data in unit economics and apply the approved `0 ₽`/empty-state semantics consistently to affected tables and summary cards.

FR9: Add direct regression tests for API interceptor error-message extraction, `Retry-After` parsing, WB-token classification, Telegram error tracking, expected-error suppression, and logger branches.

FR10: Display the already-normalized `naiveBaseline` units value in SKU accuracy history with an unambiguous label distinct from Naive MAPE and with null rendered as `—`.

FR11: Activate liquidity historical trends only after the backend supplies non-empty daily snapshots; until then, preserve the existing disabled/scaffolded state and document the dependency.

FR12: Add per-status backfill retry controls only after the backend exposes separate report and analytics retry contracts; do not simulate partial retry through the current cabinet-wide endpoint.

FR13: Replace the dashboard period type Tabs workaround with the existing ToggleGroup pattern so week/month selection uses correct toggle semantics without hidden tab panels.

FR14: Remove remaining bounded maintainability defects: stale tariff "TDD stub" comments, repeatable fallback-warning noise, the Recharts production `as any` tooltip boundary where a typed adapter is viable, duplicate package metadata, and the obsolete 112-warning ESLint allowance after a fresh zero-warning run.

FR15: Synchronize active status documentation with source reality, including marking Epic 127.1/127.2 implemented, registering Epic 162, correcting localhost/Next.js guidance, reconciling the doc-citation baseline description, and regenerating OpenWiki rather than hand-editing generated pages.

FR16: Preserve the already-validated localhost cleanup as a reviewable baseline before Epic 162 feature implementation, without mixing unrelated user changes into story branches.

### NonFunctional Requirements

NFR1: The epic is optimized for local development and localhost validation; it must not reintroduce production certification, PM2, Tier-0, or CI governance removed by the approved cleanup.

NFR2: All local E2E defaults must remain non-mutating. Mutating coverage requires the existing explicit sandbox target and acknowledgement guard.

NFR3: Critical E2E assertions must be deterministic and must not depend on unconditional truth fallbacks, arbitrary sleeps, or unexplained skips.

NFR4: All interactive changes must meet WCAG 2.1 AA, including keyboard operation, visible focus, accessible naming, and screen-reader state.

NFR5: Financial values must preserve the semantic distinction between zero, null, undefined, and unavailable backend data.

NFR6: API boundary code must treat backend payloads as untrusted and retain `unknown`-first normalization and defensive error handling.

NFR7: Source files must remain within the enforced 200-line cap; test files must remain within their configured cap.

NFR8: No new dependencies may be added unless a story demonstrates that existing React, Next.js, Radix/shadcn, TanStack Query, Recharts, Vitest, and Playwright capabilities are insufficient.

NFR9: Each implementation story must pass targeted tests first, then typecheck, zero-warning lint, formatting, relevant static checks, and a production build where route/type generation can be affected.

NFR10: Browser-facing stories must include a fresh localhost smoke result or explicitly document the missing runtime prerequisite; Playwright discovery alone is not completion evidence.

NFR11: Generated OpenWiki pages must not be hand-edited. Corrections must come from source/docs changes followed by the configured generator workflow.

NFR12: Story execution must use isolated feature branches/worktrees, preserve unrelated user changes, and remove successfully completed worktrees after merge and push.

### Additional Requirements

- Current validated baseline: 1,047 Vitest files and 17,313 tests passing; typecheck, ESLint, formatting, build (67/67 pages), privacy check, Orders Integrity, and npm audit passed.
- Current coverage observation is 74.56% lines and 73.41% statements; Epic 162 does not restore the deleted certification/governance layer.
- Playwright discovers 801 tests across 80 files, but a fresh live localhost run is absent because `.env.e2e` and listening services on ports 3000/3100 were unavailable during the audit.
- The E2E audit found 88 tautological assertion sites, 247 fixed timeout sites, and 30 bare `test.skip()` sites; each story must record before/after counts for its owned scope.
- Epic 127.1 and 127.2 are implemented in source through buyout/returns daily API clients, hooks, charts, and page integration; only status documentation remains stale.
- Backend Request #224 is delivered for canned rule listing/installation and rule CRUD contracts; the missing installed-rule editor is frontend work.
- Backfill per-status retry and liquidity daily snapshots remain backend-dependent and must stay deferred until live contract evidence exists.
- The approved localhost cleanup is merged through PR #86 at `4a24544d`; the primary worktree is clean and aligned with `origin/main`, so Story 162.1 is complete and later story worktrees may branch from that baseline.
- Existing `.omx` execution plans must use the same Epic 162 story IDs, dependencies, acceptance criteria, and verification gates as BMad artifacts.

### UX Design Requirements

UX-DR1: Sortable table headers must expose a real button target with an accessible Russian label, keyboard activation through Enter/Space, visible focus, and `aria-sort` on the column header.

UX-DR2: Mobile smoke coverage must validate sidebar/menu access, horizontal table handling, dialogs, and minimum usable touch targets on the chosen mobile viewport.

UX-DR3: Unit-economics currency output must visibly distinguish `0 ₽` from missing data (`—`) without relying on color alone.

UX-DR4: The automation rule editor must explain price-writeback safety, show enabled/disabled state, prevent ambiguous saves, and provide clear success/error feedback.

UX-DR5: Week/month period selection must behave and be announced as a single-choice toggle, not as tabs controlling invisible panels.

UX-DR6: SKU accuracy history must label the baseline as a units forecast and keep it visually distinct from percentage-based Naive MAPE.

UX-DR7: Loading, empty, degraded-backend, and retry states must remain independent so failure of an optional trend/editor request does not blank unrelated page content.

### FR Coverage Map

FR1: Epic 162-FE - Reproducible localhost E2E preflight and runtime readiness.

FR2: Epic 162-FE - Meaningful E2E assertions that fail on missing behavior.

FR3: Epic 162-FE - State-based synchronization instead of fixed sleeps.

FR4: Epic 162-FE - Explicit, diagnosable skip policy and fixture failures.

FR5: Epic 162-FE - Bounded mobile critical-route validation.

FR6: Epic 163-FE - Keyboard-accessible advertising sort headers.

FR7: Epic 163-FE - Installed automation rule navigation and editing.

FR8: Epic 163-FE - Correct monetary zero versus missing-data semantics.

FR9: Epic 164-FE - Direct API interceptor error-path regression coverage.

FR10: Epic 163-FE - Visible units-based naive baseline in SKU accuracy history.

FR11: Epic 165-FE - Contract-gated liquidity trend activation.

FR12: Epic 165-FE - Contract-gated per-status backfill retry.

FR13: Epic 163-FE - Correct single-choice period toggle semantics.

FR14: Epic 164-FE - Bounded maintainability and warning-noise cleanup.

FR15: Epic 165-FE - Active documentation, tracker, baseline, and generated-doc synchronization.

FR16: Epic 162-FE - Preserve the validated localhost cleanup as the implementation baseline.

## Epic List

### Epic 162-FE: Trustworthy Local Frontend Validation

Developers can run deterministic localhost validation and trust that a passing result proves critical frontend behavior against the local backend without production or CI infrastructure.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR16

**Implementation notes:** Establish the approved cleanup as the baseline first. Ratchet the observed E2E debt counts from 88 tautological assertions, 247 fixed waits, and 30 bare skips. Keep mutation coverage behind the existing sandbox acknowledgement guard.

### Epic 163-FE: Accessible and Complete Operator Workflows

Operators can complete analytics and automation tasks with keyboard-accessible controls, unambiguous financial values, complete rule editing, visible forecast baselines, and correct period-selection semantics.

**FRs covered:** FR6, FR7, FR8, FR10, FR13

**Implementation notes:** Each workflow remains independently releasable and must preserve page-level graceful degradation. No story may fabricate missing backend data.

### Epic 164-FE: Resilient Frontend Boundaries and Maintainability

Developers and operators receive predictable API error handling and a quieter, more strongly typed frontend without changing established product behavior.

**FRs covered:** FR9, FR14

**Implementation notes:** Lock existing behavior with targeted regression tests before cleanup. Prefer deletion, typed adapters, existing utilities, and warning deduplication over new abstractions.

### Epic 165-FE: Truthful Product Status and Backend-Ready Backlog

The project communicates its actual implementation state accurately, and backend-dependent enhancements remain precisely specified and ready to activate only when live contracts exist.

**FRs covered:** FR11, FR12, FR15

**Implementation notes:** Documentation synchronization is deliverable immediately. Liquidity trends and partial backfill retry remain deferred stories with explicit activation evidence; generated OpenWiki pages are regenerated, never hand-edited.

## Story Execution Metadata

This table is the canonical dependency and initial-status source for the one-story/one-plan OMX handoff. Every correlated plan under `.omx/plans/` must reproduce these values exactly.

| Story  | Dependencies                       | Initial status                                                      |
| ------ | ---------------------------------- | ------------------------------------------------------------------- |
| 162.1  | None                               | done — merged by PR #86 at `4a24544d`                               |
| 162.2  | 162.1                              | backlog                                                             |
| 162.3  | 162.2                              | backlog                                                             |
| 162.4  | 162.2                              | backlog                                                             |
| 162.5  | 162.2, 162.3                       | backlog                                                             |
| 162.6  | 162.2, 162.3                       | backlog                                                             |
| 162.7  | 162.2, 162.4                       | backlog                                                             |
| 162.8  | 162.2, 162.4, 162.5, 162.6, 162.7  | backlog                                                             |
| 162.9  | 162.8                              | backlog                                                             |
| 162.10 | 162.2, 162.9                       | backlog                                                             |
| 163.1  | 162.1                              | backlog                                                             |
| 163.2  | 162.1                              | backlog                                                             |
| 163.3  | 163.2                              | backlog                                                             |
| 163.4  | 162.1                              | backlog                                                             |
| 163.5  | 162.1                              | backlog                                                             |
| 163.6  | 162.1                              | backlog                                                             |
| 164.1  | 162.1                              | backlog                                                             |
| 164.2  | 162.1                              | backlog                                                             |
| 164.3  | 162.1                              | backlog                                                             |
| 164.4  | 162.1, 164.1, 164.2, 164.3         | backlog                                                             |
| 165.1  | 162.1                              | review — documentation prepared; merge and cleanup evidence pending |
| 165.2  | 162.1, 165.1                       | review — documentation prepared; merge and cleanup evidence pending |
| 165.3  | 165.1, 165.2                       | backlog                                                             |
| 165.4  | Backend daily snapshots contract   | deferred                                                            |
| 165.5  | Backend per-status retry contracts | deferred                                                            |

**Scope-collision rule:** dependencies are necessary but not sufficient for
parallel scheduling. The orchestrator must acquire exclusive locks for every
path or glob in each plan's `Concrete Scope`; stories whose scopes overlap, or
cannot be proven disjoint, are serialized. Story 162.9 intentionally follows
162.8 because its repository-wide E2E scope overlaps the earlier E2E debt
stories. After every merge, every still-open story branch must integrate the
new `origin/main` and repeat affected validation, review, and verification
before it can merge.

**Documentation bootstrap rule:** the documentation packaging change that
introduces this program may stage the source corrections for Stories 165.1 and
165.2, but it is not either story's execution PR and must leave both stories in
`review`. After that package merges, Story 165.1 and then Story 165.2 each use a
separate branch, worktree, verification-and-closeout diff, normal PR, merge,
and cleanup cycle. The closeout diff records the story's `done` status and PR
evidence in the canonical/status artifacts without recreating already merged
documentation. Story 165.3 remains blocked until both closeout cycles are
`complete` in the orchestration manifest.

## Epic 162-FE: Trustworthy Local Frontend Validation

Developers can run deterministic localhost validation and trust that a passing result proves critical frontend behavior against the local backend without production or CI infrastructure.

### Story 162.1: Stabilize the Approved Localhost Cleanup Baseline

As a frontend developer,
I want the validated localhost cleanup preserved as a clean, reviewable repository baseline,
So that later feature worktrees start from known-good code without mixing unrelated changes.

**Acceptance Criteria:**

**Given** the current primary worktree contains the approved 87-file localhost cleanup
**When** the cleanup diff and prior validation evidence are reviewed
**Then** only the approved cleanup files are included in its commit
**And** unrelated user changes are not staged, reverted, stashed, or deleted.

**Given** the cleanup commit is ready
**When** validation is rerun
**Then** typecheck, zero-warning lint, formatting, Vitest, privacy checks, and production build pass
**And** any unavailable live E2E prerequisite is recorded explicitly.

**Given** validation passes
**When** the cleanup branch is committed, pushed, and merged
**Then** the primary `main` worktree fast-forwards to `origin/main`
**And** the repository is clean before Epic 162 feature worktrees are created.

**Given** the cleanup merge is proven
**When** temporary branches or worktrees owned by that cleanup are inspected
**Then** they are removed without force
**And** `git worktree list --porcelain` shows only the canonical primary worktree.

### Story 162.2: Add a Reproducible Local E2E Preflight

As a frontend developer,
I want one localhost E2E preflight command,
So that missing services, credentials, authentication, or fixtures fail early with actionable guidance.

**Acceptance Criteria:**

**Given** frontend `:3100` or backend `:3000` is unavailable
**When** the preflight runs
**Then** it exits non-zero before Playwright starts
**And** identifies the unavailable service without printing secrets.

**Given** `.env.e2e` is absent or required variables are empty
**When** the preflight runs
**Then** it lists the missing variable names
**And** links to corrected local setup instructions based on `.env.e2e.example`.

**Given** credentials are configured
**When** authentication setup runs
**Then** it creates fresh Playwright storage state through the live login flow
**And** does not rely on expired committed or ignored auth artifacts.

**Given** mutation variables are not explicitly acknowledged
**When** the default E2E command runs
**Then** mutating tests remain excluded
**And** the preflight reports that the run is read-only.

**Given** every prerequisite is available
**When** the preflight completes
**Then** it launches the bounded smoke command or prints the exact next command
**And** its own success and failure branches have automated tests.

**Given** a developer follows the E2E documentation from a fresh local checkout
**When** they configure the backend-seeded test user
**Then** all commands reference the correct repository and ports
**And** no frontend-local `npm run seed` command is documented unless that script exists.

### Story 162.3: Replace Vacuous Analytics and Finance E2E Assertions

As a frontend developer,
I want analytics and finance browser tests to assert real user-visible outcomes,
So that a green result proves those workflows actually render and behave correctly.

**Acceptance Criteria:**

**Given** the analytics/finance E2E scope contains 52 tautological assertion sites
**When** the affected specs are remediated
**Then** every `expect(value || true)` and unconditional `expect(count >= 0)` pattern is removed
**And** the owned-scope count becomes zero.

**Given** a page can legitimately show data, empty, loading, or error states
**When** its test evaluates the result
**Then** it asserts one explicitly allowed state
**And** fails when none of those states is present.

**Given** a test claims that a required metric, chart, table, navigation link, or interaction exists
**When** that behavior is absent
**Then** the test fails with an actionable locator or assertion message
**And** does not convert the failure into a passing fallback.

**Given** backend data is optional for a non-critical scenario
**When** the expected fixture is unavailable
**Then** the test records a reasoned conditional skip or asserts the documented empty state
**And** critical smoke coverage does not silently pass.

**Given** the remediation is complete
**When** targeted Playwright specs for liquidity, FBS orders analytics, margin analytics, dashboard metrics, financial summary, unit economics, analytics hub, and returns analytics run
**Then** they pass against the prepared localhost fixtures
**And** an automated static check prevents reintroduction of the prohibited assertion patterns.

### Story 162.4: Replace Vacuous Operations and Settings E2E Assertions

As a frontend developer,
I want operations and settings browser tests to verify concrete workflow states,
So that broken backfill, supply, COGS, and pricing behavior cannot appear green.

**Acceptance Criteria:**

**Given** the operations/settings E2E scope contains 36 tautological assertion sites
**When** the affected specs are remediated
**Then** all unconditional truth fallbacks are removed
**And** the owned-scope count becomes zero.

**Given** backfill administration has loading, empty, running, paused, failed, and permission-gated states
**When** its tests run
**Then** each test asserts its intended state explicitly
**And** a missing required control or status causes failure.

**Given** supplies and supply-planning flows depend on backend records
**When** deterministic seed data exists
**Then** lifecycle, detail, list, and accessibility tests assert the expected records and actions
**And** missing required seed data fails preflight rather than passing an empty assertion.

**Given** COGS assignment or price-calculator behavior is under test
**When** the UI submits or calculates data
**Then** the test verifies the visible result and relevant request/response outcome
**And** does not accept element absence as success.

**Given** a scenario is legitimately unavailable for the configured local fixture
**When** it cannot execute
**Then** it uses a conditional skip with a concrete reason
**And** remains visible in the Playwright report.

**Given** the remediation is complete
**When** targeted backfill, supplies, supply-planning, COGS, and price-calculator specs run
**Then** they pass against prepared localhost fixtures
**And** the global prohibited-assertion static check remains at zero findings.

### Story 162.5: Remove Fixed Waits from Liquidity and Unit Economics E2E

As a frontend developer,
I want liquidity and unit-economics tests synchronized to observable application state,
So that the two largest analytics specs are faster and deterministic.

**Acceptance Criteria:**

**Given** liquidity and unit-economics specs contain 58 `page.waitForTimeout()` calls
**When** synchronization is remediated
**Then** the owned-scope fixed-wait count becomes zero
**And** no equivalent arbitrary sleep helper is introduced.

**Given** a request drives loading, data, empty, or error UI
**When** the test performs the triggering action
**Then** it waits for the relevant response, loading-state transition, or stable locator
**And** uses a bounded timeout with an actionable failure message.

**Given** charts or animated components are under test
**When** visual data becomes available
**Then** tests wait for semantic chart containers, labels, or stable rendered values
**And** reduced-motion configuration is used where animation would otherwise create nondeterminism.

**Given** an interaction changes filters, pagination, or selected products
**When** the UI updates
**Then** the test verifies both the request parameters and the visible result
**And** does not assume completion after elapsed time.

**Given** the remediation is complete
**When** liquidity and unit-economics specs run repeatedly against prepared localhost fixtures
**Then** both complete without fixed sleeps or retry-only passes
**And** their runtime and failure evidence are recorded for comparison with the previous version.

### Story 162.6: Remove Fixed Waits from Dashboard and Analytics E2E

As a frontend developer,
I want dashboard and analytics tests synchronized to meaningful UI and network events,
So that period changes, charts, metrics, and navigation are validated without timing guesses.

**Acceptance Criteria:**

**Given** the owned dashboard and analytics specs contain 67 fixed waits
**When** synchronization is remediated
**Then** their `page.waitForTimeout()` count becomes zero
**And** no arbitrary replacement sleep is introduced.

**Given** a period, filter, grouping, or route selection triggers data loading
**When** the test changes that selection
**Then** it waits for the expected request and visible state transition
**And** verifies the rendered period or result belongs to the new selection.

**Given** dashboard cards and analytics charts load independently
**When** one request is delayed or fails
**Then** tests assert the intended independent loading, success, empty, or error state
**And** do not wait for unrelated network idleness.

**Given** merged-group, FBS, margin, financial-summary, storage, category, brand, forecast, and analytics-hub coverage runs
**When** each interaction completes
**Then** assertions use stable roles, labels, test IDs, or response predicates
**And** failures identify the missing state rather than timing out after a sleep.

**Given** the remediation is complete
**When** the targeted dashboard/analytics set runs repeatedly against prepared localhost fixtures
**Then** it passes without retry-only success
**And** the owned-scope before/after wait count and runtime are recorded.

### Story 162.7: Remove Fixed Waits from Supplies and Supply Planning E2E

As a frontend developer,
I want supply lifecycle tests synchronized to real backend and UI state transitions,
So that create, update, calculate, confirm, document, and accessibility flows are reliable.

**Acceptance Criteria:**

**Given** supply-planning and supplies specs contain 76 fixed waits
**When** synchronization is remediated
**Then** the owned-scope `page.waitForTimeout()` count becomes zero
**And** no polling loop without a bounded stop condition is introduced.

**Given** a supply mutation is permitted by the sandbox guard
**When** create, add-order, calculate, confirm, close, or document actions run
**Then** tests wait for the corresponding response and visible terminal state
**And** reconcile the displayed entity before proceeding.

**Given** mutating E2E is disabled
**When** read-only supplies coverage runs
**Then** it validates list, detail, navigation, expansion, sorting, pagination, and accessibility states
**And** never performs a write as a synchronization shortcut.

**Given** data is eventually consistent
**When** a lifecycle state is not immediately visible
**Then** the test uses bounded condition polling tied to the expected entity and state
**And** reports the last observed state on failure.

**Given** the remediation is complete
**When** supply-planning, supplies-list, supply-detail, supply-lifecycle, and supplies-a11y specs run repeatedly
**Then** they pass without fixed sleeps or retry-only success
**And** created sandbox data is reconciled or cleaned through supported product/API operations.

### Story 162.8: Remove Fixed Waits from Pricing, Backfill, COGS, and Authentication E2E

As a frontend developer,
I want the remaining business-flow tests synchronized to explicit application events,
So that calculations, administrative states, assignments, login, and onboarding are deterministic.

**Acceptance Criteria:**

**Given** the owned specs contain 46 fixed waits
**When** synchronization is remediated
**Then** their `page.waitForTimeout()` count becomes zero
**And** the repository-wide E2E fixed-wait count becomes zero.

**Given** price-calculator or pricing-page inputs trigger tariff and calculation requests
**When** values are submitted or changed
**Then** tests wait for the relevant request and visible calculation state
**And** verify outputs belong to the submitted inputs.

**Given** backfill controls trigger pause, resume, or retry behavior
**When** a permitted action completes
**Then** tests wait for the response and resulting status
**And** distinguish report and analytics states without assuming immediate completion.

**Given** COGS assignment, login, onboarding, order-client, or session behavior is under test
**When** navigation or submission occurs
**Then** tests wait for URL, authenticated storage, response, or rendered state
**And** do not use elapsed time as proof of completion.

**Given** all four synchronization stories are complete
**When** the E2E tree is statically scanned
**Then** no active `page.waitForTimeout()` remains
**And** any narrowly justified timing exception requires an inline rationale and explicit review approval.

**Given** the targeted specs run repeatedly against prepared localhost fixtures
**When** results are compared
**Then** no pass depends solely on Playwright retry
**And** the final before/after count records `247 → 0`.

### Story 162.9: Make E2E Skips Explicit and Fixture-Aware

As a frontend developer,
I want every skipped browser test to have an explicit, reviewable reason,
So that missing fixtures and regressions cannot disappear silently from local results.

**Acceptance Criteria:**

**Given** the E2E suite contains 30 bare `test.skip()` calls
**When** skip handling is remediated
**Then** the bare-skip count becomes zero
**And** every remaining skip provides a condition and concrete reason.

**Given** a critical smoke route requires authentication or deterministic seed data
**When** that prerequisite is missing
**Then** preflight or setup fails the run
**And** the critical test is not silently skipped.

**Given** a scenario is optional because of role, viewport, backend capability, or mutation policy
**When** the condition is unmet
**Then** the Playwright report states the exact missing capability
**And** the reason identifies how to enable the scenario locally.

**Given** data-dependent coverage can validate a documented empty state
**When** no records exist
**Then** the test asserts that empty state
**And** does not skip merely because the data table is absent.

**Given** the remediation is complete
**When** a skip inventory is generated
**Then** it reports skip sites grouped by reason and criticality
**And** an automated static check prevents new bare skips.

**Given** the read-only suite runs locally
**When** all mandatory fixtures are available
**Then** the critical smoke group completes with zero skips
**And** optional skips remain visible and justified.

### Story 162.10: Restore Bounded Mobile Critical-Route E2E Coverage

As a frontend developer,
I want a supported mobile Playwright smoke project,
So that critical user journeys remain usable on the product's secondary mobile target.

**Acceptance Criteria:**

**Given** the Playwright configuration currently lacks an active mobile project
**When** mobile smoke coverage is restored
**Then** it uses one documented device profile, such as iPhone 14
**And** it runs through the same reproducible localhost preflight as the desktop projects.

**Given** the full desktop suite is already the primary coverage surface
**When** the mobile project is defined
**Then** it contains a bounded critical-route subset rather than duplicating the full desktop suite
**And** its scope includes login or onboarding, dashboard navigation, one analytics table, and settings or dialog behavior.

**Given** the application uses a collapsible sidebar and responsive navigation
**When** the mobile smoke route navigates between critical pages
**Then** it verifies the collapsed navigation can be opened, used, and dismissed with visible state assertions
**And** no required destination is reachable only through a desktop-only control.

**Given** analytics tables may exceed the mobile viewport width
**When** the selected analytics table renders on the configured device
**Then** the test verifies intentional horizontal scrolling or an equivalent responsive presentation
**And** required data and controls are not trapped in inaccessible overflow.

**Given** a critical dialog or interactive control is exercised on mobile
**When** the user opens, operates, and closes it
**Then** focus, viewport placement, and dismissal behavior remain usable
**And** critical touch controls provide an effective target of at least 44 by 44 CSS pixels.

**Given** desktop and mobile layouts legitimately differ
**When** the mobile tests assert behavior
**Then** they use mobile-specific locators and expectations for the supported layout
**And** they are not disabled solely because desktop selectors or geometry differ.

**Given** the mobile smoke project runs against prepared localhost fixtures
**When** the critical-route suite completes
**Then** it has zero unexplained skips
**And** the report records the device profile, viewport, localhost endpoints, and fresh pass evidence.

## Epic 163-FE: Accessible and Complete Operator Workflows

Operators can complete analytics and automation tasks with keyboard-accessible controls, unambiguous financial values, complete rule editing, visible forecast baselines, and correct period-selection semantics.

### Story 163.1: Make Advertising Sort Headers Keyboard Accessible

As an analytics operator,
I want every sortable advertising table header to be keyboard operable and expose its current state,
So that I can inspect advertising data without relying on a pointer device.

**Acceptance Criteria:**

**Given** an advertising table column is sortable
**When** its header renders
**Then** the interactive target is a semantic button inside the column header
**And** it has an accessible Russian name describing the sort action and column.

**Given** keyboard focus is on a sortable header button
**When** the operator presses Enter or Space
**Then** the same sort transition occurs as with pointer activation
**And** the updated order is reflected in the visible table rows.

**Given** a column is unsorted, ascending, or descending
**When** its state changes
**Then** the containing column header exposes the correct `aria-sort` value
**And** only the actively sorted column reports an ascending or descending state.

**Given** a keyboard user navigates through the table headers
**When** a sortable control receives focus
**Then** a visible focus indicator is present
**And** the visual sort indicator does not rely on color alone.

**Given** the affected advertising analytics components are audited
**When** remediation is complete
**Then** no sortable advertising header uses click-only interaction on `<th>`
**And** obsolete accessibility suppressions related to mouse-only sorting are removed.

**Given** the sorting components are tested
**When** targeted component and localhost browser tests run
**Then** they verify accessible names, Enter/Space activation, `aria-sort` transitions, and visible row ordering
**And** typecheck, zero-warning lint, formatting, and relevant static checks pass.

### Story 163.2: Add Installed Automation Rules Navigation and List

As an operator,
I want to open and inspect the automation rules installed for my cabinet,
So that I can distinguish active rules from available templates and manage my automation workflow.

**Acceptance Criteria:**

**Given** the sidebar currently opens the canned-rules gallery
**When** the automation section is updated
**Then** the operator can navigate clearly between "Шаблоны" and "Установленные правила"
**And** both destinations expose an unambiguous active navigation state.

**Given** the operator opens the installed-rules destination
**When** the rules request is loading, succeeds, returns no items, or fails
**Then** the page renders distinct loading, populated, empty, and error states
**And** a list failure does not blank or corrupt the templates gallery.

**Given** installed rules are returned by the backend
**When** the list renders
**Then** each item identifies the rule name, enabled or disabled state, trigger, action, and available safety classification
**And** unknown backend fields or enum values are normalized defensively rather than trusted directly.

**Given** no rules are installed
**When** the empty state renders
**Then** it explains that the cabinet has no installed automation rules
**And** provides a keyboard-accessible action leading to the templates gallery.

**Given** a canned rule is installed successfully
**When** the backend returns the created rule ID
**Then** the installed-rules query is invalidated
**And** the UI provides a direct action to open the installed-rules list with the new rule identifiable.

**Given** a price-writeback rule appears in the list
**When** its safety state is displayed
**Then** the UI explains that writeback requires the separate cabinet safety gate
**And** it never implies that installing a disabled or unarmed rule immediately changes prices.

**Given** the list and navigation are tested
**When** targeted component, API-boundary, hook, and localhost browser tests run
**Then** they cover navigation, loading, populated, empty, error, post-install, and safety states
**And** typecheck, zero-warning lint, formatting, and relevant static checks pass.

### Story 163.3: Add the Installed Automation Rule Editor

As an operator,
I want to open and safely update an installed automation rule,
So that its thresholds, scope, cooldown, enabled state, and actions match my cabinet's operating policy.

**Acceptance Criteria:**

**Given** an installed rule ID is opened from the rules list or post-install action
**When** the editor route loads
**Then** it requests `GET /v1/automation/rules/:id`
**And** renders independent loading, not-found, authorization, malformed-response, and retryable error states.

**Given** a valid installed rule is returned
**When** the editor renders
**Then** supported fields are populated from normalized backend data
**And** unknown or unsupported parameters remain safe and are not silently overwritten.

**Given** the operator changes editable values
**When** client validation runs
**Then** required names, numeric thresholds, cooldowns, and action-specific values are validated with clear Russian messages
**And** invalid or ambiguous values cannot be submitted.

**Given** the rule uses `WRITEBACK_PRICE`
**When** its editor is displayed or enabled
**Then** the UI explains the separate `PRICE_WRITEBACK_ENABLED` safety gate and the effect of enabling the rule
**And** saving requires an explicit acknowledgement when the change could activate price writeback.

**Given** the operator submits valid changes
**When** `PATCH /v1/automation/rules/:id` succeeds
**Then** only supported editable fields are sent
**And** the detail and installed-rules caches are refreshed with visible success feedback.

**Given** the update request fails
**When** the backend returns validation, authorization, conflict, or service errors
**Then** the editor preserves unsaved input and shows an actionable error
**And** it does not claim that the rule was updated.

**Given** the operator attempts to leave with unsaved changes
**When** navigation or dismissal occurs
**Then** the UI warns about losing those changes
**And** allows the operator to remain in the editor.

**Given** the editor is operated by keyboard or assistive technology
**When** focus moves through fields, safety acknowledgement, save, cancel, and retry controls
**Then** every control has an accessible name, visible focus, and logical order
**And** status feedback is announced without moving focus unexpectedly.

**Given** editor coverage runs
**When** targeted API, normalizer, hook, component, and localhost E2E tests execute
**Then** they cover load, edit, validation, safe writeback, success, failure, and unsaved-change behavior
**And** typecheck, zero-warning lint, formatting, and relevant static checks pass.

### Story 163.4: Distinguish Monetary Zero from Missing Unit-Economics Data

As an operator,
I want genuine zero monetary values displayed differently from unavailable data,
So that I can interpret unit-economics tables and summaries without mistaking no activity for missing information.

**Acceptance Criteria:**

**Given** a unit-economics monetary field contains the numeric value `0`
**When** it is rendered in a table, summary card, tooltip, or supporting label
**Then** it displays as `0 ₽` using the page's established whole-ruble formatting
**And** it is not replaced by `—`.

**Given** a monetary value is `null`, `undefined`, or non-finite
**When** the formatter or component renders it
**Then** it displays as `—`
**And** it is not coerced into a fabricated zero.

**Given** positive or negative finite monetary values are rendered
**When** the shared unit-economics formatter is used
**Then** Russian locale grouping, sign, rounding, and ruble notation remain unchanged
**And** existing percentage formatting is unaffected.

**Given** unit-economics rows and summary cards consume revenue, price, delivery-cost, and related monetary fields
**When** the affected call sites are remediated
**Then** they consistently use the approved `0 ₽` versus `—` semantics
**And** redundant component-level guards do not contradict the shared formatter.

**Given** backend data crosses the unit-economics boundary
**When** zero and missing monetary values are normalized
**Then** numeric zero is preserved as zero and missing data remains nullable
**And** no `|| 0`, unconditional `?? 0`, or equivalent fallback erases that distinction.

**Given** the semantic change is tested
**When** formatter, table-row, summary-card, tooltip, and localhost browser coverage runs
**Then** it explicitly verifies zero, null, undefined, non-finite, positive, and negative cases
**And** typecheck, zero-warning lint, formatting, and relevant static checks pass.

### Story 163.5: Display the Units-Based Naive Baseline in SKU Accuracy History

As an operator evaluating forecast quality,
I want to see the naive baseline's predicted units beside the AI forecast and actual result,
So that I can compare forecast approaches without confusing unit values with percentage error metrics.

**Acceptance Criteria:**

**Given** SKU accuracy history already contains normalized `naiveBaseline` values
**When** the history table renders
**Then** it includes a column labeled unambiguously as a baseline forecast in units, such as "Базовый прогноз (ед.)"
**And** the label is visually and semantically distinct from "Naive MAPE".

**Given** a history row has a finite `naiveBaseline` value
**When** the baseline column renders
**Then** the value is formatted as a unit count using the existing number formatter
**And** zero is displayed as `0`, not as missing data.

**Given** `naiveBaseline` is `null` or unavailable
**When** the history row renders
**Then** the baseline cell displays `—`
**And** it is not coerced into zero.

**Given** AI prediction, naive baseline, actual units, AI MAPE, and Naive MAPE appear together
**When** the operator reads the table
**Then** unit-based columns identify `(ед.)` and percentage-based columns retain MAPE labeling
**And** the values remain understandable without relying on color.

**Given** the history table is viewed on a narrow viewport
**When** all comparison columns are present
**Then** intentional horizontal scrolling or an equivalent responsive presentation remains usable
**And** the new column does not make existing data or controls inaccessible.

**Given** the display change is tested
**When** targeted component and localhost browser tests run
**Then** they verify positive, zero, null, ordering, labeling, and responsive behavior
**And** existing normalizer tests continue proving that `naiveBaseline` is preserved without calculation changes.

### Story 163.6: Replace Dashboard Period Tabs with a Single-Choice Toggle

As a dashboard operator,
I want week/month selection announced and operated as a single-choice toggle,
So that the control's accessibility semantics match its actual behavior.

**Acceptance Criteria:**

**Given** `DashboardPeriodSelector` uses Tabs only to choose between week and month
**When** the control is migrated
**Then** it uses the project's existing single-choice toggle/radio-group pattern
**And** the hidden, force-mounted tab panels and their workaround comments are removed.

**Given** "Неделя" is selected
**When** the operator activates "Месяц" by pointer or keyboard
**Then** `periodType` changes to `month` exactly once
**And** the month selector and existing dashboard data flow become active without resetting unrelated state.

**Given** "Месяц" is selected
**When** the operator activates "Неделя"
**Then** `periodType` changes to `week` exactly once
**And** the previously selected week remains available according to existing context behavior.

**Given** the control is a required single-choice selection
**When** the selected option is activated again or an empty value is emitted
**Then** one valid option remains selected
**And** the dashboard never enters an undefined period type.

**Given** a keyboard user focuses the period toggle
**When** Enter, Space, or supported arrow-key navigation is used
**Then** week/month selection is operable with visible focus
**And** assistive technology can determine the group label and selected option without tab-panel semantics.

**Given** the selector is disabled, compact, loading, or displayed on mobile
**When** it renders
**Then** existing disabled, responsive, selector, refresh, and skeleton behavior is preserved
**And** no new dependency is introduced.

**Given** the migration is tested
**When** targeted component, context-integration, accessibility, and localhost browser tests run
**Then** they verify selection, keyboard behavior, non-clearable state, callbacks, disabled state, and absence of hidden tab panels
**And** typecheck, zero-warning lint, formatting, and relevant static checks pass.

## Epic 164-FE: Resilient Frontend Boundaries and Maintainability

Developers and operators receive predictable API error handling and a quieter, more strongly typed frontend without changing established product behavior.

### Story 164.1: Add Direct API Interceptor Error-Path Regression Tests

As a frontend developer,
I want direct tests for every API interceptor branch,
So that error handling and observability can be maintained without accidental behavior changes.

**Acceptance Criteria:**

**Given** JSON, nested JSON, flat JSON, text, empty, and malformed error bodies
**When** `extractErrorMessage` is tested directly
**Then** it selects the documented message or fallback for each shape
**And** never throws while inspecting untrusted payloads.

**Given** `Retry-After` may be supplied through a header or JSON body
**When** parsing is tested for `429` and `503` responses
**Then** valid integers from 1 through 600 are accepted, with the header taking precedence
**And** zero, negatives, decimals, whitespace-only values, HTTP dates, non-finite values, and out-of-range values are rejected.

**Given** an API error is classified as an expected missing-WB-token response
**When** its status and message are evaluated
**Then** only the documented `401` WB-token condition is suppressed from error logging
**And** near matches, other statuses, and unrelated authentication errors remain observable.

**Given** an endpoint belongs or does not belong to the Telegram notification API
**When** HTTP and network tracking helpers run
**Then** Telegram metrics receive the correct endpoint, status, and message only for matching notification endpoints
**And** unrelated API traffic produces no Telegram metric.

**Given** the API logger receives JSON or non-JSON error data
**When** an unexpected error is logged
**Then** the correct serialized or raw payload branch is used
**And** expected-error suppression is verified independently from logging format.

**Given** `ApiClient` receives an HTTP `ApiError`, a network exception, or a request using `suppressNetworkErrorLog`
**When** integration-level tests execute
**Then** existing `ApiError` instances are rethrown without being reclassified as network failures
**And** network logging/tracking is suppressed only when explicitly requested.

**Given** the interceptor test suite is complete
**When** targeted coverage is collected
**Then** all exported interceptor helpers and their decision branches are exercised directly
**And** the full test suite, typecheck, zero-warning lint, and formatting checks pass without changing established product behavior.

### Story 164.2: Replace the Recharts Tooltip `as any` Boundary

As a frontend developer,
I want the FBS regional tooltip connected through a typed Recharts adapter,
So that third-party chart payload changes are caught without weakening application type safety.

**Acceptance Criteria:**

**Given** the installed Recharts version defines the tooltip content contract
**When** the regional tooltip boundary is refactored
**Then** the implementation uses verified exported Recharts types or a narrow local adapter derived from them
**And** the production `RegionalTooltip as any` cast and its lint suppression are removed.

**Given** Recharts supplies an inactive, empty, malformed, or populated tooltip payload
**When** the adapter normalizes it
**Then** the custom tooltip receives only the label, name, color, and value fields it supports
**And** unsupported payload members do not leak into the application component.

**Given** the chart maps a missing percentage to a numeric plotting fallback
**When** the tooltip displays that point
**Then** it continues to use the preserved raw value and renders missing data as `—`
**And** a genuine zero remains distinguishable from missing data.

**Given** the regional chart renders populated data
**When** a tooltip is opened
**Then** existing Russian percentage formatting, series naming, color, and label behavior remain unchanged
**And** the chart's independent empty state is preserved.

**Given** the typed boundary is tested
**When** adapter, tooltip, and chart smoke tests run
**Then** they cover inactive, empty, null, zero, and populated payloads without `any`
**And** typecheck, zero-warning lint, formatting, and relevant static checks pass.

### Story 164.3: Remove Stale Tariff Stub Markers and Deduplicate Fallback Warnings

As a frontend developer,
I want tariff extraction documentation and fallback logging to reflect the shipped implementation,
So that maintainers receive accurate guidance and actionable diagnostics without repeated noise.

**Acceptance Criteria:**

**Given** storage-tariff extraction is already implemented and covered by tests
**When** its source documentation is cleaned up
**Then** stale "STUB FILE", "TDD Red Phase", and "to be implemented" markers are removed
**And** current fallback rules and data-source semantics are documented accurately.

**Given** multiple warehouse rows use the same fallback condition during one calculation
**When** supply tariffs are normalized
**Then** per-row warnings remain suppressed and one aggregate diagnostic is emitted
**And** the diagnostic includes the fallback count and a bounded, non-sensitive sample.

**Given** React renders or equivalent calculations repeat with the same logical tariff snapshot
**When** fallback diagnostics are evaluated again
**Then** identical warning noise is deduplicated through a bounded, testable mechanism
**And** a materially changed fallback snapshot can produce a new diagnostic.

**Given** tariff extraction is used outside the aggregate supply lookup
**When** invalid or zero-base data triggers a fallback
**Then** callers can retain the existing direct warning behavior unless they explicitly suppress it
**And** numeric fallback, coefficient preservation, and pallet zero-additional-rate behavior do not change.

**Given** the cleanup is tested
**When** tariff extraction and supply-lookup tests run
**Then** they lock warning counts, reset behavior, changed-signature behavior, and existing tariff results
**And** typecheck, zero-warning lint, formatting, and relevant static checks pass.

### Story 164.4: Normalize Package Metadata and Enforce Zero-Warning Lint

As a frontend developer,
I want package metadata and lint scripts to express one consistent dependency and warning policy,
So that local validation cannot hide metadata drift or accepted warnings.

**Acceptance Criteria:**

**Given** React and React DOM package metadata is audited
**When** the root manifest and lockfile are normalized
**Then** `react-dom` has exactly one required root runtime declaration and `@types/react-dom` has exactly one development declaration
**And** transitive peer references in the lockfile are not misclassified as duplicate root dependencies.

**Given** package metadata needs regeneration
**When** the lockfile is updated
**Then** it is produced by the repository's pinned npm version rather than edited manually
**And** `npm install --package-lock-only` or the equivalent reproducible command produces no unrelated dependency churn.

**Given** a fresh repository-wide ESLint run reports zero warnings
**When** the package scripts are updated
**Then** the obsolete `--max-warnings 112` allowance is replaced with a zero-warning policy for both `lint` and `lint:fix`
**And** the existing lint-staged zero-warning policy remains aligned.

**Given** the metadata cleanup is complete
**When** `npm ls react react-dom`, lockfile validation, npm audit, typecheck, lint, formatting, tests, and build run
**Then** the dependency tree is valid and all gates pass
**And** no runtime dependency or product behavior is removed merely to satisfy metadata checks.

## Epic 165-FE: Truthful Product Status and Backend-Ready Backlog

The project communicates its actual implementation state accurately, and backend-dependent enhancements remain precisely specified and ready to activate only when live contracts exist.

### Story 165.1: Reconcile Epic 127 and Current Frontend Delivery Status

As a frontend maintainer,
I want active planning and status artifacts to match the implemented source,
So that completed work is not repeatedly treated as blocked or deferred.

**Acceptance Criteria:**

**Given** buyout and returns daily API clients, normalizers, hooks, charts, page integration, and tests exist in source
**When** Epic 127 status is reconciled
**Then** Stories 127.1 and 127.2 are marked implemented or done rather than deferred
**And** the evidence references the delivered `GET /v1/analytics/buyout/daily` and `GET /v1/analytics/returns/daily` integrations.

**Given** Epic 127 contains six delivered stories
**When** its planning artifact, sprint status, tracker, and work summary are updated
**Then** each artifact reports six completed stories with no obsolete Requests #210/#211 blocker
**And** the epic's overall status remains internally consistent.

**Given** Epics 162-FE through 165-FE are the current approved debt-closure program
**When** active tracking is updated
**Then** all four epics and their story IDs are registered with accurate planned, deferred, or completed states
**And** no deferred backend-dependent story is presented as active implementation work.

**Given** status documentation changes are complete
**When** story-ID, status, and source-reference searches run
**Then** no active document retains the contradicted Epic 127 deferral claim
**And** documentation checks pass without rewriting historical archived records unnecessarily.

### Story 165.2: Align Local Development and Validation Guidance with Repository Reality

As a frontend developer,
I want active setup, progress, and validation documentation to describe the current localhost project accurately,
So that I can run and assess the frontend without obsolete production or version assumptions.

**Acceptance Criteria:**

**Given** the current application uses Next.js 16, frontend port 3100, and backend port 3000
**When** active guidance including `.cursorrules` is corrected
**Then** obsolete Next.js 14 and backend port 3001 instructions are removed
**And** commands and URLs match the actual package scripts and localhost architecture.

**Given** the project is pre-production and tested locally
**When** setup and validation guidance is synchronized
**Then** localhost prerequisites, non-mutating defaults, and the approved local validation gates are prominent
**And** removed PM2, Tier-0, production certification, or CI-governance requirements are not reintroduced.

**Given** the current validated baseline is documented
**When** the frontend work summary and active guidance are updated
**Then** they record the verified unit-test, build, lint, typecheck, privacy, audit, and coverage evidence with its observation date
**And** unavailable live E2E prerequisites are stated explicitly rather than reported as a pass.

**Given** citation validation uses `scripts/.check-docs-baseline.txt` as its source of truth
**When** the validator documentation is reconciled
**Then** stale hard-coded baseline counts are corrected or replaced with instructions to derive the current count
**And** the exit code remains the authoritative pass/fail signal.

**Given** all active documentation edits are complete
**When** link, citation, framework-version, port, and prohibited-guidance searches run
**Then** the active guidance agrees with source and package metadata
**And** `npm run check:docs` and relevant documentation checks pass.

### Story 165.3: Regenerate OpenWiki from Corrected Sources

As a project maintainer,
I want OpenWiki regenerated after source documentation is corrected,
So that recurring project documentation reflects the same current architecture and workflow state.

**Acceptance Criteria:**

**Given** Stories 165.1 and 165.2 source-document corrections are complete
**When** OpenWiki refresh begins
**Then** the configured generator workflow is used from a clean isolated worktree
**And** generated `openwiki/**` pages are not hand-edited.

**Given** the generator requires a provider credential or external service
**When** that prerequisite is unavailable
**Then** the run stops with a documented credential/runtime blocker
**And** no fabricated generated output or manual substitute is committed.

**Given** OpenWiki may propose changes outside generated pages
**When** the generated diff is reviewed
**Then** BMad/OMX control files and the workflow definition are preserved according to repository policy
**And** only intended generated documentation and approved source-document updates remain.

**Given** regenerated pages are available
**When** their content is validated
**Then** quickstart, architecture, workflows, integrations, testing, and source-map links resolve
**And** current Next.js, localhost port, Epic status, and validation guidance no longer contradict source documents.

**Given** the refresh is complete
**When** documentation checks and a final generated-diff review run
**Then** links, frontmatter, citations, and generated-file boundaries pass
**And** the refresh evidence records the generator version and command used.

### Story 165.4: Activate Liquidity Trends Only After Daily Snapshots Exist

As an inventory operator,
I want historical liquidity trends based on persisted daily snapshots,
So that I can see real movement between liquidity categories over time without synthetic history.

**Acceptance Criteria:**

**Given** the frontend trends client and hook are scaffolded but the live endpoint may return an empty series
**When** this story enters implementation
**Then** the backend dependency is considered satisfied only after a documented live response contains non-empty, dated daily snapshots across multiple dates
**And** the evidence identifies the persistence source and snapshot cadence.

**Given** the activation evidence is absent or the endpoint still returns only an empty series
**When** the story is evaluated
**Then** it remains deferred and the existing scaffolded/disabled state is preserved
**And** the frontend does not synthesize historical points from the current liquidity response.

**Given** valid daily snapshot history is available
**When** the operator opens liquidity analytics
**Then** a historical trends section renders the supported backend series and period controls
**And** labels, units, and dates match the documented response contract.

**Given** the optional trends request is loading, empty, malformed, or fails
**When** the rest of the liquidity page has current data
**Then** trends show an independent loading, unavailable, empty, or retry state
**And** existing liquidity summaries and tables remain usable.

**Given** activated trends are tested
**When** normalizer, hook, component, and localhost E2E coverage runs
**Then** it covers populated snapshots, gaps, empty history, malformed data, and request failure without fabricated values
**And** typecheck, zero-warning lint, formatting, and relevant static checks pass.

### Story 165.5: Add Per-Status Backfill Retry Only After Separate Contracts Exist

As an operations administrator,
I want to retry failed report and analytics backfills independently,
So that recovering one pipeline does not unnecessarily restart the other.

**Acceptance Criteria:**

**Given** the current frontend exposes only a cabinet-wide retry operation
**When** this story enters implementation
**Then** the backend dependency is considered satisfied only after separate report and analytics retry endpoints are documented and live
**And** their authorization, idempotency, response, conflict, and failure contracts are verified.

**Given** separate retry contracts are unavailable
**When** one of the two statuses fails
**Then** the story remains deferred and the UI continues to show both failure states accurately
**And** it does not simulate partial retry through the cabinet-wide endpoint.

**Given** only the report backfill has failed
**When** the operator activates its retry control
**Then** only the report retry endpoint is called and its loading/result state is updated
**And** the analytics status and controls remain unchanged.

**Given** only the analytics backfill has failed
**When** the operator activates its retry control
**Then** only the analytics retry endpoint is called and its loading/result state is updated
**And** the report status and controls remain unchanged.

**Given** either retry succeeds or fails
**When** the mutation settles
**Then** the relevant status query is refreshed and success or actionable error feedback is shown
**And** concurrent actions are disabled only where required to prevent duplicate requests.

**Given** per-status retry is tested after activation
**When** API, hook, component, accessibility, and localhost E2E coverage runs
**Then** it proves endpoint separation, independent loading states, success, conflict, authorization, and failure behavior
**And** typecheck, zero-warning lint, formatting, and relevant static checks pass.

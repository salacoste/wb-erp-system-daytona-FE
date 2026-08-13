---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-08-13'
workflowType: testarch-atdd
storyId: '167.1'
storyTitle: Unify Protected AppShell and Desktop/Mobile Navigation
primaryLevel: component
tddPhase: GREEN
inputDocuments:
  - .omx/plans/167.1-unify-protected-appshell-and-desktop-mobile-navigation.md
  - _bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad/tea/config.yaml
  - package.json
  - vitest.config.ts
  - playwright.config.ts
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/data-factories.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/component-tdd.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/test-quality.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/test-healing-patterns.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/selector-resilience.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/timing-debugging.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/overview.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/api-request.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/network-recorder.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/auth-session.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/intercept-network-call.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/recurse.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/log.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/file-utils.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/network-error-monitor.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/fixtures-composition.md
  - .agents/skills/bmad-testarch-atdd/resources/knowledge/playwright-cli.md
---

# ATDD Checklist — Epic 167-FE, Story 167.1

**Date:** 2026-08-13
**Author:** R2d2 / BMad TEA
**Primary test level:** Vitest component and pure unit contracts
**Current phase:** GREEN, active and unskipped

## Story Summary

An authenticated user needs one protected application shell and one canonical navigation model across desktop and mobile. Hydration and redirect handling must prevent protected-content flash, while route, role, badge, cabinet, theme, scroll, and focus context remain correct across responsive navigation states.

## Controlling Acceptance Criterion

> **Given** auth and responsive navigation states **when** the shell resolves **then** protected content never flashes, redirects remain correct, desktop/mobile consume one model, role/badges/active route/cabinet/theme remain intact, one scroll owner remains **and** mobile close/Escape/focus return work.

Requirements: `FR2`, `FR9`, `FR32`.

## Preflight and Generation Mode

- Stack detection: `frontend` (Next.js, React, Vitest, RTL, and Playwright are configured).
- Story and acceptance criterion: present and testable in the canonical BMAD artifact and OMX plan.
- Development environment: pinned Node `24.18.0` and npm `11.11.0`; dependencies installed in the exact Story worktree.
- Generation mode: AI generation from canonical requirements and current source. Browser recording was not needed for deterministic component contracts; browser/E2E evidence remains a later Story delivery gate.
- Execution mode: sequential within the explicitly assigned direct-test slice.
- Program override: the migration Universal Story Delivery Contract requires executable failing tests, so all generated tests are active and unskipped. Generic workflow examples using `test.skip()` were not followed.

## Test Strategy and Coverage

| Priority | Scenario | Level | Direct evidence |
| --- | --- | --- | --- |
| P0 | Initial hydration withholds protected children | Component | `layout.test.tsx` |
| P0 | Missing auth clears stale cookie and redirects exactly once with pathname; same-tab expiry avoids a duplicate redirect; cross-tab logout uses the canonical storage event | Component | `layout.test.tsx` |
| P0 | Authenticated shell exposes skip link, stable main target, and landmarks | Component | `layout.test.tsx` |
| P1 | Fixed shell and main content retain one page-content scroll owner | Component | `layout.test.tsx` |
| P0 | Owner desktop/mobile navigation uses the full canonical order | Component | `Sidebar.test.tsx`, `MobileSidebarSheet.test.tsx` |
| P0 | Non-Owner roles cannot see Owner-only items | Unit/component | `sidebar-navigation.test.ts`, `MobileSidebarSheet.test.tsx` |
| P0 | Positive supply urgency is represented on both navigation surfaces | Unit/component | `sidebar-navigation.test.ts`, Sidebar/mobile tests |
| P0 | Deepest segment-aware route is the only current page | Unit/component | matcher, Sidebar, and mobile tests |
| P0 | Mobile preserves named cabinet context, theme, and logout; shell targets remain at least 44×44 | Component/E2E | `MobileSidebarSheet.test.tsx`, Navbar/shared-navigation tests, mobile E2E |
| P1 | Activating a mobile link closes the Sheet | Component | `MobileSidebarSheet.test.tsx` |
| P0 | Escape closes the Sheet and focus returns to its trigger | Component | controlled Radix interaction test |
| P1 | Sheet content does not compete with its bounded navigation scroller | Component | mobile scroll-owner class contract |

Duplicate coverage is deliberate only at integration boundaries: pure resolver/matcher tests define the shared model, while desktop/mobile component tests prove both consumers render that model and expose the required semantics.

## API Tests — N/A

Story 167.1 creates or changes no API endpoint, request/response schema, provider contract, query key, auth contract, or backend behavior. API and Pact tests would cross the Story's forbidden public/backend contract boundary, so the correct API test count is `0` and `provider scrutiny` is `N/A`.

## E2E Tests — Deferred to Story Delivery Evidence

No E2E file is authored in this direct-test ATDD slice. The canonical plan separately requires targeted `login-dashboard` and mobile critical-route Playwright evidence after the component-level RED becomes GREEN. That later evidence must cover the integrated login-to-dashboard journey, responsive Sheet behavior, theme/width matrix, keyboard/focus behavior, and browser console/accessibility checks.

## Direct Test Files

- `src/app/(dashboard)/layout.test.tsx` — new shell hydration, redirect, landmark, skip-target, and page-scroll-owner contracts.
- `src/app/(dashboard)/layout/MobileSidebarSheet.test.tsx` — expanded canonical model, role, badge, current route, continuity, close, Escape/focus-return, and mobile scroll-owner contracts.
- `src/components/custom/Sidebar.test.tsx` — expanded canonical desktop order, badge, nested route, and `aria-current` contracts.
- `src/components/custom/sidebar-navigation.test.ts` — new pure resolver and segment-aware matcher contracts.

`src/components/custom/Navbar.test.tsx` joined the direct manifest after genuine browser/review RED proved semantic contrast, narrow-identity containment, and a `44×44` mobile header logout composition were required.

## RED Phase Execution Evidence

Command:

```bash
PATH=/private/tmp/wb-fe-166-4-toolchain/node-v24.18.0-darwin-arm64/bin:/private/tmp/wb-fe-166-4-toolchain/npm-11.11.0/bin:$PATH \
  npm test -- --run \
  'src/app/(dashboard)/layout.test.tsx' \
  'src/app/(dashboard)/layout/MobileSidebarSheet.test.tsx' \
  src/components/custom/Sidebar.test.tsx \
  src/components/custom/sidebar-navigation.test.ts
```

Observed result before production implementation:

```text
Test Files  4 failed (4)
Tests       15 failed | 24 passed (39)
Duration    1.52s
```

The failures are genuine missing-behavior RED, not syntax, environment, network, fixture, or timing failures:

- shared `resolveNavigationItems` and `isNavigationItemActive` exports do not exist: 7 failures;
- authenticated layout has no skip link/stable `#main-content` target: 1 failure;
- desktop links omit `aria-current` and nested route selection: 2 failures;
- mobile still renders an independent 11-item model rather than the canonical model;
- mobile has no urgent badge or cabinet/theme continuity;
- broad `startsWith` marks both `/analytics` and `/analytics/dashboard` current;
- Sheet content and inner nav both own vertical scrolling.

The existing hydration, redirect, authenticated shell, fixed-shell/main-scroll, trigger-open, non-Owner absence under the old limited model, link-close, Escape/focus return, desktop canonical order/badge, and historical Sidebar behavior assertions remain passing. This mixed run is intentional: the direct manifest includes brownfield behavior locks alongside the new failing contracts.

## Data, Fixtures, Mocks, and Selectors

- New data factories: `0`; no persistent or backend data is created by this Story.
- New shared fixtures: `0`; each RTL test creates isolated component state and existing QueryClient helpers remain local.
- External network mocks: none; hooks and shell children are isolated at module boundaries.
- Required `data-testid` attributes: none. Tests use semantic roles, names, `href`, `aria-current`, stable target ID, and explicit scroll-owner class contracts.
- Hard waits/sleeps: none.
- Test skips/fixmes/todos: none.

## GREEN Implementation Checklist

- [x] Add a pure `resolveNavigationItems({ role, urgentCount })` without mutating `NAVIGATION_ITEMS`.
- [x] Add one segment-aware `isNavigationItemActive(pathname, href, items)` that selects the deepest matching route and rejects shared string prefixes.
- [x] Make desktop and mobile consume the same resolved canonical order.
- [x] Preserve Owner-only filtering and supply-planning badge values on both surfaces.
- [x] Expose exactly one `aria-current="page"` on nested routes.
- [x] Add a visible-on-focus skip link and stable `main#main-content` target.
- [x] Preserve the fixed shell and main page-content scroll owner.
- [x] Reuse `SidebarCabinetInfo`, `ThemeToggle`, and `LogoutButton` in mobile navigation.
- [x] Keep link-close plus Radix Escape/focus-return behavior intact.
- [x] Override Sheet content overflow so only the bounded mobile navigation region scrolls.
- [x] Run the direct Story manifest to `55/55` GREEN after review-driven auth, landmark, touch-target, and Navbar regressions joined the manifest.
- [x] Add and pass the targeted login-dashboard/mobile E2E and browser evidence without weakening these tests.

## GREEN and Browser Evidence

- Direct Story/component command: `5/5` files and `55/55` tests passed.
- Full frontend regression: `1133/1133` files and `18384/18384` tests passed with the required local ephemeral-listener authority.
- Official combined Playwright wrapper: `32 passed`, `1` optional Manager skip; no raw Playwright or `--no-deps` bypass was used.
- Desktop matrix: `1024/1280/1440/1600` in both light and dark themes, reduced motion, long Russian navigation, one current route, no document overflow, zero axe violations, clean console/page errors, and working skip-link focus transfer.
- Mobile matrix: `195/320/390/768` plus `512/640/720/800` 200%-equivalent reflow, light/dark token toggling, reduced-motion Sheet, long Russian navigation, one current route, bounded Sheet/scroller, zero axe violations, `44×44` menu/navigation/cabinet/theme/Sheet-logout/header-logout targets, cabinet/link/breakpoint/Escape close, focus return, and forward/reverse keyboard focus wrapping.
- Browser/review RED repairs: dark Navbar contrast, 195px Sheet width, reduced-motion animation, close/action overlap, Next dev-indicator action overlap, cabinet/breakpoint close, duplicate shell auth-refresh ownership, long identity containment, named cabinet landmarks, loading-safe cabinet and header targets, canonical cross-tab logout, and early dashboard-period URL races were each repaired inside the Story-owned shell/test surface.

## Red–Green–Refactor Handoff

1. GREEN: implement the smallest owned AppShell/navigation changes that satisfy one failing contract at a time.
2. Re-run the exact four-file command after each cohesive change.
3. Preserve the already-passing brownfield behavior locks.
4. REFACTOR only after the full direct manifest is green; keep resolver/matcher pure and keep domain queries out of shared primitives.
5. Run Story-targeted E2E, accessibility/browser evidence, and universal validation before review.

## Workflow Validation

- [x] Approved canonical Story and testable acceptance criterion loaded.
- [x] Frontend framework and test configuration detected.
- [x] Existing source, tests, and relevant TEA knowledge fragments reviewed.
- [x] Acceptance criterion mapped to deterministic levels and priorities.
- [x] Direct component/unit tests created in the exact owned manifest.
- [x] Tests are active, unskipped, deterministic, isolated, and behavior-focused.
- [x] RED run completed with actionable missing-feature failures only.
- [x] API, fixture, factory, network, and selector requirements explicitly resolved as N/A/none.
- [x] Implementation checklist and exact execution command recorded.
- [x] No browser session was opened; CLI session cleanup is N/A.
- [x] Persistent evidence is stored under `_bmad-output/test-artifacts/`.

Static validation after test generation also passed: full `npm run type-check`, zero-warning ESLint for the four direct test files, Prettier for tests/checklist, `npm run check:max-lines`, and `git diff --check`.

The checklist path is intentionally covered by the repository's `_bmad-output/` ignore rule; Story integration must force-stage this exact evidence file after scope review, following the established Epic 166 artifact precedent.

## Knowledge Applied

The design applies component TDD, semantic selector resilience, deterministic timing, isolated module mocks, test quality, and healing guidance. Playwright Utils fragments were loaded because TEA configuration enables the full UI profile; they informed the later E2E handoff but were not imported into Vitest component tests. Data factories and API-first setup are not applicable because this Story does not create test entities or endpoints.

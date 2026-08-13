# Story 167.1: Unify Protected AppShell and Desktop/Mobile Navigation

Status: review

## Story

As an authenticated user,
I want one stable shell and navigation model,
so that security, cabinet, route, theme, and focus context persist.

## Outcome

Unify the existing protected dashboard shell so desktop Sidebar and mobile Sheet consume one canonical, caller-resolved navigation model while preserving authentication redirects, hydration protection, cabinet context, role filtering, dynamic badges, theme controls, active-route meaning, fixed shell regions, and intentional scroll ownership. Add the missing skip-link and landmark contract and prove mobile close, Escape, focus trap, and focus return without changing auth, route, primitive, token, API, hook, store, query, or domain contracts.

## Acceptance Criteria

1. **Protected content and redirects remain truthful**
   - **Given** auth hydration, authenticated, unauthenticated, and redirecting states,
   - **When** the protected layout resolves,
   - **Then** protected children never flash before auth resolution,
   - **And** unauthenticated navigation preserves the established login destination and cookie-clearing behavior without duplicate redirects,
   - **And** Story 167.1 consumes existing auth state/contracts rather than changing them.

2. **Desktop and mobile consume one canonical navigation model**
   - **Given** the protected shell renders at desktop or mobile width,
   - **When** navigation items are resolved,
   - **Then** Sidebar and mobile Sheet receive the same ordered navigation entries,
   - **And** labels, hrefs, icons, role visibility, and dynamic badge evidence do not drift between renderers,
   - **And** no second hardcoded mobile route list remains.

3. **Role, badge, route, cabinet, and theme continuity is preserved**
   - **Given** Owner and non-Owner users, zero or non-zero urgent supply counts, nested routes, cabinet context, and supported themes,
   - **When** either navigation surface renders,
   - **Then** admin-only items remain restricted, the supply-planning badge remains truthful, and exactly one segment-aware item exposes `aria-current="page"`,
   - **And** cabinet information, logout, and theme controls remain available in both shell variants.

4. **The shell owns one intentional page scroll region**
   - **Given** protected content and long desktop/mobile navigation,
   - **When** the shell renders across supported widths,
   - **Then** the document does not become a competing page scroll owner,
   - **And** the content region remains the single page scroll owner while navigation uses only its bounded internal scroller,
   - **And** the mobile Sheet does not create nested competing navigation scrollers.

5. **Landmarks and skip navigation are complete**
   - **Given** keyboard or assistive-technology navigation,
   - **When** the protected shell mounts,
   - **Then** a visible-on-focus skip link targets one stable main-content identifier,
   - **And** header, desktop navigation, mobile navigation, complementary cabinet context, and main content have useful accessible names and logical order,
   - **And** route content retains its existing heading ownership.

6. **Mobile Sheet lifecycle is keyboard-complete**
   - **Given** the mobile navigation trigger opens the Sheet,
   - **When** a user activates a route, presses Escape, traverses focus, or closes the Sheet,
   - **Then** link activation closes the Sheet, Escape closes it, focus remains trapped while open, and focus returns to the trigger after close,
   - **And** interactive mobile targets remain at least 44 by 44 CSS pixels.

7. **Responsive, theme, localization, and accessibility evidence is complete**
   - **Given** widths `195`, `320`, `390`, `768`, `1024`, `1280`, `1440`, and `1600`, light/dark themes, long Russian navigation labels, keyboard/touch input, and reduced motion,
   - **When** the shell and both navigation variants are exercised,
   - **Then** content wraps without page-level overflow, desktop persistence and mobile Sheet behavior remain intentional, active/role/badge/cabinet/theme evidence remains consistent, console output is clean, and axe has no violations.

8. **Delivery evidence is complete**
   - **Given** the Story-specific and Universal Story Delivery Contracts,
   - **When** Story 167.1 is proposed for integration,
   - **Then** genuine active test-only RED precedes production changes,
   - **And** targeted shell tests, login-dashboard/mobile E2E, universal local gates, two fresh adversarial reviews, and exact-scope audit pass,
   - **And** detailed commit, ready PR, merge SHA, branch deletion, exact worktree removal, prune, and clean-main evidence are recorded before Story 167.2 starts.

## Tasks / Subtasks

- [x] Task 1: Establish the isolated Story lane and exact ownership contract (AC: 1–8)
  - [x] Read the canonical Story plan in full before worktree creation and verify Story 166.8 is merged.
  - [x] Create the exact branch/worktree from synchronized `main`, install the pinned toolchain dependencies, and prove a clean package/lock state.
  - [x] Inventory shell, navigation, auth-consumption, badge, cabinet, theme, active-route, landmark, Sheet, focus, and scroll behavior.
  - [x] Freeze the production and direct-test manifests; keep auth, primitives, tokens, routes, APIs, hooks, stores, and domain logic read-only.

- [x] Task 2: Lock missing behavior with genuine active ATDD RED (AC: 1–7)
  - [x] Create the English ATDD checklist and exact component/pure-contract test manifest.
  - [x] Add active, unskipped tests before any production file changes.
  - [x] Run the exact Story manifest and record failures caused only by missing Story 167.1 behavior.

- [x] Task 3: Unify navigation resolution and route semantics (AC: 2–3)
  - [x] Implement one pure role/badge navigation resolver and one segment-aware active-route matcher.
  - [x] Pass the same resolved runtime model to desktop Sidebar and mobile Sheet.
  - [x] Preserve order, labels, hrefs, icons, role restrictions, zero/value badge semantics, and exactly one current item.

- [x] Task 4: Complete protected AppShell, landmarks, scroll, and mobile parity (AC: 1, 3–6)
  - [x] Preserve hydration/auth/redirect behavior without crossing the auth-contract boundary.
  - [x] Add the skip link, stable main target, named landmarks, and intentional single page-scroll structure.
  - [x] Reuse cabinet, theme, and logout components in mobile navigation and eliminate the nested mobile navigation scroller.
  - [x] Prove link close, Escape, focus trap, focus return, and adequate touch targets using the existing Sheet primitive unchanged.

- [x] Task 5: Reach targeted GREEN and complete shell E2E (AC: 1–6, 8)
  - [x] Run the exact Story unit/component manifest to GREEN and refactor only while it remains passing.
  - [x] Update only the narrow login-dashboard and mobile-critical-routes E2E evidence required by the Story.
  - [x] Run existing shell/navigation behavior locks and prove no auth, primitive, token, route, API, hook, store, or domain regression.

- [x] Task 6: Collect browser, accessibility, responsive, theme, and motion evidence (AC: 3–8)
  - [x] Exercise widths `195/320/390/768/1024/1280/1440/1600`, long Russian labels, light/dark, and reduced motion.
  - [x] Verify desktop persistence, mobile Sheet lifecycle, one current route, role/badge/cabinet/theme parity, one scroll owner, and no overflow.
  - [x] Record clean console, zero axe violations, keyboard/touch behavior, and remove temporary browser artifacts/sessions.

- [x] Task 7: Run universal validation, exact-scope audit, and two fresh reviews (AC: 1–8)
  - [x] Run targeted and full Vitest, E2E, format, zero-warning lint, type-check, max-lines, build, YAML/static/privacy, and diff gates.
  - [x] Prove the exact production/test/artifact manifest and zero diffs outside allowed ownership.
  - [x] Complete two independent fresh-context adversarial reviews and repair every accepted High/Medium finding test-first.

- [ ] Task 8: Integrate and clean the exact Story lane (AC: 8)
  - [ ] Force-stage ignored Story/ATDD artifacts and stage only the approved explicit manifest.
  - [ ] Create the detailed conventional commit, push only the feature branch, open a ready PR targeting `main`, and merge through GitHub.
  - [ ] Update primary `main`, prove merge ancestry/artifact presence and `main == origin/main`.
  - [ ] Delete remote/local feature branches, remove the exact worktree without force, prune worktrees/remotes, and prove absence before Story 167.2.

## Dev Notes

### Exact Git Lane and Prerequisites

- Primary checkout: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend`.
- Branch: `cdx/epic-167-story-1-appshell`.
- Worktree: `/private/tmp/wb-fe-167-1-unify-protected-appshell-and-desktop-mobil`.
- Base: `ab12ffe98f1b78cae49a66eea8bed7e16e7ed0f2` (Story 166.8 merge commit, PR `#152`).
- Required prerequisite chain: Stories 166.1–166.8 merged before this worktree was created.
- Pinned PATH: `/private/tmp/wb-fe-166-4-toolchain/npm-11.11.0/bin:/private/tmp/wb-fe-166-4-toolchain/node-v24.18.0-darwin-arm64/bin:$PATH`.
- Worktree-local `npm ci --ignore-scripts` installed 759 packages and left `package.json` and `package-lock.json` clean.

### Delivery Record

- **Requirements:** FR2, FR9, FR32.
- **Route/User Value:** one stable protected shell across all authenticated routes.
- **Owned Surface:** dashboard layout, desktop Sidebar, Navbar, mobile Sheet, shared navigation model, existing cabinet/theme/logout shell compositions when necessary, exact direct tests, narrow shell E2E, Story/ATDD artifacts, and Story 167.1 sprint lifecycle rows.
- **Allowed Change Surface:** AppShell/navigation files and their exclusive tests/evidence only.
- **Forbidden Shared Files:** `src/components/ui/sheet.tsx`; `src/styles/globals.css`; `src/stores/authStore.ts`; `src/hooks/useAuth.ts`; `src/proxy.ts`; `src/lib/routes*.ts`; route content; APIs/hooks/domain logic; Epic 166 tokens, primitives, and product compositions; package/lock; backend/public contracts.
- **Dependency Decision:** reuse React, Next, Radix-backed existing Sheet, lucide icons, semantic tokens, and existing shell components; add no dependency.

### Preflight Classification

- AC1: **PARTIAL** — the layout withholds children until its local hydration check and redirects unauthenticated users, but current correctness depends on existing auth contracts that remain forbidden; Story work is limited to truthful shell consumption and direct regression evidence.
- AC2: **UNIMPLEMENTED** — desktop consumes the canonical `NAVIGATION_ITEMS` model while mobile owns a separate 11-item array.
- AC3: **PARTIAL** — desktop has role filtering, urgent badge, cabinet, theme, and logout; mobile lacks canonical role/badge/cabinet/theme parity, while active matching differs between variants and neither provides the complete single-current-item contract.
- AC4: **PARTIAL** — document scrolling is disabled and main owns page scroll, but the mobile Sheet plus inner navigation can form nested scroll owners when the full canonical menu is rendered.
- AC5: **PARTIAL** — header/main/nav/aside semantics exist, but there is no skip link, stable main skip target, or complete landmark naming.
- AC6: **PARTIAL** — Radix Sheet and existing link close behavior provide foundations, but direct Escape, trap, return-focus, and touch-target evidence is incomplete.
- AC7–8: **UNIMPLEMENTED** — Story-specific responsive/theme/accessibility evidence, genuine RED, universal validation, reviews, and Git lifecycle do not yet exist.

### Approved Production Manifest

- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/layout/MobileSidebarSheet.tsx`
- `src/components/custom/Sidebar.tsx`
- `src/components/custom/Navbar.tsx`
- `src/components/custom/sidebar-navigation.ts`

Owned components that remain read-only unless genuine RED proves a necessary shell-only change:

- `src/components/custom/SidebarCabinetInfo.tsx`
- `src/components/custom/theme-toggle.tsx`
- `src/components/custom/dashboard/TokenHealthBanner.tsx`
- `src/components/custom/LogoutButton.tsx`

### Approved Direct-Test Manifest

- `src/app/(dashboard)/layout.test.tsx`
- `src/app/(dashboard)/layout/MobileSidebarSheet.test.tsx`
- `src/components/custom/Sidebar.test.tsx`
- `src/components/custom/sidebar-navigation.test.ts`

`src/components/custom/Navbar.test.tsx` may change only if a genuine RED requires a corresponding Navbar production change. Narrow E2E ownership is limited to `e2e/login-dashboard.spec.ts` and `e2e/mobile-critical-routes.spec.ts` after targeted component GREEN.

### Contract Model

- `resolveNavigationItems` is a pure resolver over the canonical static definitions, caller role, and caller-provided urgent count. It does not fetch, store, mutate, navigate, or interpret domain results.
- `isNavigationItemActive` is segment-aware and resolves overlapping parent/child hrefs so exactly one visible entry is current.
- The protected shell resolves one runtime item array and supplies it to both desktop and mobile renderers.
- Sidebar and mobile Sheet remain presentation surfaces; auth, cabinet, badge query, theme state, and routing lifecycles stay with existing owners.
- Main remains the page scroll owner. Navigation may use one bounded internal scroller per visible variant; the mobile Sheet container must not compete with its navigation scroller.
- Existing Radix Sheet remains the focus-trap/Escape/return primitive. Story code composes it and proves behavior rather than reimplementing focus management.

### Validation Targets

- Pre-edit behavior lock: `MobileSidebarSheet.test.tsx`, `Sidebar.test.tsx`, and `Navbar.test.tsx` passed `23/23`.
- Story tests run first, followed by the narrow shell E2E and representative auth/navigation locks.
- Universal commands come from `package.json` and include full Vitest, format, zero-warning lint, type-check, max-lines, build, YAML/static/privacy/scope/diff checks, and required local Playwright evidence.

### References

- [Source: `.omx/plans/167.1-unify-protected-appshell-and-desktop-mobile-navigation.md`]
- [Source: `.omx/plans/shadcn-full-ui-migration-master.md`]
- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#Story-1671-Unify-Protected-AppShell-and-DesktopMobile-Navigation`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#AppShell-and-Unified-Navigation-Model`]
- [Source: `_bmad-output/planning-artifacts/shadcn-route-ledger.md`]
- [Source: `_bmad-output/implementation-artifacts/166-8-fe-standardize-page-states-async-results-contextual-detail-and-global-not-found.md`]
- [Source: `src/app/(dashboard)/layout.tsx`]
- [Source: `src/app/(dashboard)/layout/MobileSidebarSheet.tsx`]
- [Source: `src/components/custom/Sidebar.tsx`]
- [Source: `src/components/custom/sidebar-navigation.ts`]
- [Source: `package.json`]

## Dev Agent Record

### Agent Model Used

GPT-5.6

### Implementation Plan

- Freeze the unified resolver, active-route, auth-shell, landmark, scroll, and mobile lifecycle behavior with genuine active component/pure-contract RED.
- Implement only the exact AppShell/navigation manifest, reusing existing auth, Sheet, cabinet, badge-query, theme, and logout owners.
- Collect targeted E2E, browser/accessibility, universal validation, two-pass review, and exact Git cleanup evidence before starting Story 167.2.

### Debug Log References

- Story base: `ab12ffe98f1b78cae49a66eea8bed7e16e7ed0f2`.
- The full Story 167.1 OMX plan was read before the exact branch/worktree was created.
- Read-only inventory proved desktop/mobile model drift, desktop-only role/badge behavior, inconsistent active-route matching, missing mobile cabinet/theme parity, missing skip-link target, and nested mobile scroll risk.
- ATDD preflight selected frontend/component-first AI generation. No API tests are applicable because the Story owns no endpoint or public data contract. The project-specific Universal Story Contract overrides the generic skipped-test ATDD examples: Story RED tests remain active and unskipped.
- Genuine active test-only RED completed before any production change: exact `4/4` suites failed with `15` missing-behavior failures and `24` brownfield passes across `39` active tests. Failures are limited to absent pure resolver/matcher exports, skip-link/main target, desktop current-route semantics, mobile canonical order/badge/current-route/cabinet-theme continuity, and single mobile navigation scroller. No syntax, type, environment, network, fixture, timing, skip, todo, only, or unrelated failure contaminated RED.
- Targeted GREEN now passes `5/5` files and `55/55` tests. Review-driven RED added direct guards for header/cabinet `44×44` targets, real cabinet-context landmarks, canonical AppShell auth ownership, same-tab session expiry without a second redirect, and cross-tab logout through the existing `STORAGE_EVENT_KEY` contract.
- The official combined `test:e2e:full` run passes `32` tests with one optional Manager skip. It covers desktop widths `1024/1280/1440/1600` in both themes; mobile widths `195/320/390/768`; 200%-equivalent reflow widths `512/640/720/800`; reduced motion; long Russian labels; axe; clean console/page errors; skip-link activation/focus; cabinet, route, breakpoint, and Escape close; forward/reverse focus wrapping; bounded Sheet/scroller geometry; and `44×44` menu, navigation, cabinet, theme, Sheet logout, and header logout targets.
- Browser-driven RED repaired dark Navbar contrast, 195px Sheet width, reduced-motion animation, close/action overlap, Next development-indicator overlap, and early dashboard-period URL races in the owned E2E evidence. Review-driven repairs also closed cabinet navigation, breakpoint lifecycle, duplicate AppShell auth-refresh ownership, long identity containment, exact dark-token assertions, reverse focus wrapping, named cabinet landmarks, touch targets, and same-tab/cross-tab redirect semantics.
- Universal validation evidence: full Vitest `1133/1133` files and `18384/18384` tests; production build compiled and generated all `70/70` static pages; type-check, zero-warning lint, max-lines, full formatting, privacy `3430` files, privacy tests `29/29`, locale-percent baseline `4`, AP#8 baseline `61`, E2E assertion/wait/bare-skip scans, Story marker/lesson/Next params checks, YAML parse, and `git diff --check` pass. Documentation citations remain at the accepted baseline of `18` broken references.
- An initial non-escalated full Vitest run and build were correctly classified as environment failures because sandbox socket binding returned `EPERM`; both passed unchanged when rerun with the required localhost/ephemeral-listener authority.
- Local backend login throttling was exhausted after ten separate E2E setup invocations. Backend logs proved the exact `10/hour/IP` in-memory limiter; one controlled local PM2 API restart cleared it without source, data, or contract changes, after which official auth setup passed. Remaining E2E was consolidated to minimize setup logins.
- Final independent acceptance audit checked AC1–AC8 requirement by requirement against the canonical Story, OMX plan, UX contract, current source/tests, exact scope, and recorded validation. Verdict: `PASS/CLEAR`; unresolved Critical, High, and Medium findings are all zero.

### Completion Notes List

- Unified desktop/mobile navigation through one pure canonical resolver and one deepest segment-aware current-route matcher without mutating static definitions or moving domain queries into shared navigation code.
- Completed the protected shell landmark, skip-focus, scroll-owner, mobile cabinet/theme/logout, touch-target, responsive Sheet, theme, reduced-motion, and keyboard lifecycle contracts while leaving auth/store/proxy/route/primitive/token/API/hook/domain owners unchanged.
- Completed test-first RED→GREEN, full browser/accessibility matrices, universal local validation, and independent adversarial repair convergence. No accepted High/Medium finding remains; Task 8 remains open until commit/PR/merge and exact cleanup evidence exist.

### File List

- `_bmad-output/implementation-artifacts/167-1-fe-unify-protected-appshell-and-desktop-mobile-navigation.md` (new)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
- `_bmad-output/test-artifacts/atdd-checklist-167.1.md` (new)
- `src/app/(dashboard)/layout.test.tsx` (new)
- `src/app/(dashboard)/layout.tsx` (modified)
- `src/app/(dashboard)/layout/MobileSidebarSheet.test.tsx` (modified)
- `src/app/(dashboard)/layout/MobileSidebarSheet.tsx` (modified)
- `src/components/custom/Navbar.test.tsx` (modified)
- `src/components/custom/Navbar.tsx` (modified)
- `src/components/custom/Sidebar.test.tsx` (modified)
- `src/components/custom/Sidebar.tsx` (modified)
- `src/components/custom/SidebarCabinetInfo.tsx` (modified; genuine review RED required mobile cabinet close and a loading-safe `44px` minimum target)
- `src/components/custom/sidebar-navigation.test.ts` (new)
- `src/components/custom/sidebar-navigation.ts` (modified)
- `e2e/login-dashboard.spec.ts` (modified)
- `e2e/mobile-critical-routes.spec.ts` (modified)

## Change Log

- 2026-08-13: Created the Story 167.1 implementation record after canonical-plan, prerequisite, lane, baseline, and ownership preflight; implementation remains test-first and in progress.
- 2026-08-13: Completed unified AppShell/navigation implementation, targeted and full GREEN, browser/accessibility matrices, universal local validation, and accepted first-pass review repairs; integration remains gated on the second fresh review and exact Git lifecycle.
- 2026-08-13: Completed final review remediation, canonical cross-tab logout handling, `55/55` focused and `18384/18384` full Vitest, `32`-pass browser matrix, exact-scope audit, and independent review convergence; Story is ready for Git integration and cleanup.
- 2026-08-13: Final AC1–AC8 acceptance audit returned `PASS/CLEAR` with zero unresolved Critical, High, or Medium findings; Story status moved from `in-progress` to `review` while Task 8 remains open for commit, PR merge, and mandatory lane cleanup evidence.

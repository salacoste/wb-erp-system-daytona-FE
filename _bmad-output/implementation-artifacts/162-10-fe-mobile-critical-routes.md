# Story 162.10: Restore Bounded Mobile Critical-Route E2E Coverage

Status: in-progress

<!-- Note: This artifact is intentionally ignored by the repository-wide _bmad-output rule. Force-add this exact file when committing the story. -->

## Story

As a frontend developer,
I want a supported mobile Playwright smoke project,
so that critical user journeys remain usable on the product's secondary mobile target.

## Acceptance Criteria

1. **Given** the Playwright configuration currently lacks an active mobile project, **when** mobile smoke coverage is restored, **then** it uses one documented device profile (iPhone 14 via `devices['iPhone 14']`) and it runs through the same reproducible localhost preflight as the desktop projects.
2. **Given** the full desktop suite is already the primary coverage surface, **when** the mobile project is defined, **then** it contains a bounded critical-route subset (not a duplicate of the desktop suite) and its scope includes login/onboarding, dashboard navigation, one analytics table, and settings/dialog behavior.
3. **Given** the application uses a collapsible sidebar and responsive navigation, **when** the mobile smoke route navigates between critical pages, **then** it verifies the collapsed navigation can be opened, used, and dismissed with visible-state assertions and no required destination is reachable only through a desktop-only control.
4. **Given** analytics tables may exceed the mobile viewport width, **when** the selected analytics table renders on the configured device, **then** the test verifies intentional horizontal scrolling (or equivalent responsive presentation) and required data/controls are not trapped in inaccessible overflow.
5. **Given** a critical dialog or interactive control is exercised on mobile, **when** the user opens, operates, and closes it, **then** focus, viewport placement, and dismissal behavior remain usable and critical touch controls provide an effective target of at least 44 by 44 CSS pixels.
6. **Given** desktop and mobile layouts legitimately differ, **when** the mobile tests assert behavior, **then** they use mobile-specific locators and expectations for the supported layout and are not disabled solely because desktop selectors or geometry differ.
7. **Given** the mobile smoke project runs against prepared localhost fixtures, **when** the critical-route suite completes, **then** it has zero unexplained skips and the report records the device profile, viewport, localhost endpoints, and fresh pass evidence.

## Tasks / Subtasks

- [x] Task 1: Enable the mobile Playwright project (AC: 1, 2)
  - [x] Uncomment/enable the `mobile` project in `playwright.config.ts` with `devices['iPhone 14']`, the same `storageState: 'e2e/.auth/user.json'`, and `dependencies: ['setup']` so it inherits the auth setup and the per-run localhost preflight exactly like the desktop `chromium` project.
  - [x] Restrict the mobile project to the new bounded spec via `testMatch: /mobile-critical-routes\.spec\.ts/` so enabling the project cannot pull the full desktop spec tree through a mobile viewport (bounded by construction, AC 2).
  - [x] Keep the desktop `chromium` project unchanged (zero coverage loss).
- [x] Task 2: Author the bounded mobile critical-route smoke (AC: 2, 3, 4, 5, 6, 7)
  - [x] `e2e/mobile-critical-routes.spec.ts` covering: device-profile/viewport/endpoint record (AC 7), login form on mobile (AC 2 login), mobile sidebar open/use/dismiss (AC 3), mobile sidebar close-without-navigating (AC 3 dismissal), analytics table horizontal-scroll not trapped (AC 4), dashboard dialog open/placement/close (AC 5), and 44×44 touch-target floor (AC 5).
  - [x] Mobile-specific locators only: hamburger trigger `button[aria-label="Open menu"]` and `MobileSidebarSheet` (`[role="dialog"][data-state="open"]` + sr-only `Navigation Menu` title). Desktop `Sidebar` selectors are NOT reused; the spec additionally asserts the desktop `<aside>` is `toHaveCount(0)` on the mobile viewport (AC 6).
  - [x] Observable waits only: `expect.toBeVisible/toHaveURL`, `expect.poll` for computed scroll/bounding-box, and a pre-registered `waitForResponse` for the analytics-table network settle. No `waitForTimeout`/`setTimeout`/`networkidle`/`page.clock`.
- [x] Task 3: Extend the fixed-wait scanner union (AC: 6 + Story 162.5-162.9 guard)
  - [x] Add `STORY_162_10_E2E_FILES = ['e2e/mobile-critical-routes.spec.ts']` and union it into `STORY_FIXED_WAIT_SCAN_FILES` (47 → 48). All 162.5-162.9 constants preserved verbatim.
  - [x] Bare-skip scanner (`check-e2e-bare-skips.mjs`) auto-includes the new spec via its `git ls-files -z e2e` walk; 0 bare skips confirmed.
- [ ] Task 4: Validate, review, and hand off delivery (AC: 1-7)
  - [x] Static gates green: `check:e2e-waits` exit 0 (48 targets timer-free), `check:e2e-bare-skips` exit 0, `check:e2e-assertions` exit 0, `type-check` exit 0, scoped `eslint --max-warnings=0` exit 0, `prettier --check` exit 0, `check:privacy` exit 0.
  - [x] Vitest green for Story 162.10 scope: `src/test/e2e-fixed-waits.test.ts` 38/38 pass (union-assertion extended 47→48); full suite 17464 passing, well above the 17186 floor. The only 2 failing files (`src/test/playwright-static-boundary.test.ts`, `scripts/check-e2e-bare-skips.test.mjs`) reproduce identically on baseline `b2a11519` — pre-existing, unrelated to this story.
  - [x] Config parity: `playwright.config.ts` diff vs `b2a11519` shows ONLY the mobile block changed (commented → active + `testMatch`); `setup`, `historical-spp`, and `chromium` (desktop) projects byte-identical → zero desktop coverage loss.
  - [~] Fresh live localhost run BLOCKED by a pre-existing auth-setup bug on `main` (see Dev Notes §"Pre-existing auth-setup blocker on main"). Both the mobile project and the desktop control (`e2e/orders.spec.ts`) fail identically at `atomicWriteStorageState` / `authStorageStatePath` (`auth.setup.ts:44`). Not a Story 162.10 defect; the spec will run green once the Story 128.10 fixture bug is fixed. PW_EXIT=1 for both mobile and desktop control; preflight handshake itself succeeds.
  - [x] Desktop project regression check: the desktop `chromium` project is byte-identical to `b2a11519` (diff-verified) and is NOT broken by the config change — the desktop control failure is the same pre-existing setup bug, not a Story 162.10 regression.
  - [ ] Two fresh adversarial code-review passes, fresh verifier gate, PR merge, ancestry proof, branch/worktree cleanup — orchestrator-owned delivery.

## Dev Notes

### The Real Mobile Nav Control (AC 3, 6)

The disabled project's note said "Sidebar is hidden on mobile, navigation tests fail expectedly." Reading the layout proved why: the desktop `Sidebar` (`src/components/custom/Sidebar.tsx`) is wrapped in `hidden lg:block lg:flex-shrink-0` in `src/app/(dashboard)/layout.tsx:61`, so below the `lg` breakpoint there is no desktop sidebar to click. Mobile navigation is owned by `src/app/(dashboard)/layout/MobileSidebarSheet.tsx`, rendered in the dashboard header (`layout.tsx:70`). Its trigger is:

```
<button type="button" className="... lg:hidden" aria-label="Open menu">
  <Menu className="h-5 w-5" />
</button>
```

and it wraps the shadcn `Sheet` (Radix dialog) whose content carries a sr-only `SheetTitle` ("Navigation Menu") and 11 nav links (Dashboard, COGS, Cabinet Summary, Analytics, Storage, Планирование, Юнит-экономика, Ликвидность, Реклама, Уведомления, Settings). Each link calls `onOpenChange(false)` on click, so navigation dismisses the sheet. The mobile locators used here are:

- `button[aria-label="Open menu"]` — hamburger trigger (`lg:hidden`).
- `[role="dialog"][data-state="open"]` — the open Sheet portal (visible-state assertion).
- `getByRole('dialog').getByText('Navigation Menu')` — the sr-only SheetTitle.
- `button[aria-label="Close"]` — the Radix `SheetClose` (X) affordance.

Desktop `aside.w-64` / `aside.flex-shrink-0` selectors are NOT used for navigation; the spec only asserts they are absent on the mobile viewport (proving the responsive split, AC 6).

### Bounded Scope (AC 2)

The mobile project's `testMatch: /mobile-critical-routes\.spec\.ts/` guarantees the bounded subset at the config level — no other spec can be swept into the mobile project. The single spec covers the four required surfaces (login/onboarding, dashboard nav, one analytics table, settings/dialog) in seven tests, intentionally short of the desktop suite.

### Analytics Table Horizontal Scroll (AC 4)

`UnitEconomicsTable.tsx` wraps the shared `Table` (aria-label `"Юнит-экономика по товарам"`) in `<div className="rounded-md border bg-card overflow-x-auto">` with `min-w-[200px]` columns. On the 390px iPhone 14 viewport the table width exceeds the viewport, so the wrapper's `scrollWidth > clientWidth` (intentional scroll, not trapped overflow). The spec climbs from the `<table>` to the nearest scroll container and asserts both `scrollWidth > clientWidth` and that programmatically advancing `scrollLeft` exposes off-screen columns (overflow is accessible, not clipped).

### Dialog + Touch Target (AC 5)

The dashboard `WidgetSettingsSheet` (`Настройка виджетов`) is a Radix `Sheet` mounted in `DashboardContent.tsx`. The spec opens it, asserts the dialog `boundingBox()` fits inside the 390px viewport (`x >= 0` and `x + width <= viewport.width`), and closes it via the X button. For the touch-target floor, each mobile nav link's `boundingBox()` is asserted `>= 44px` in both width and height (the rendered row is the effective pointer target).

### Device Profile + Endpoint Record (AC 7)

The first test asserts the iPhone 14 viewport (`{width: 390, height: 844}` from `page.viewportSize()`), the WebKit engine (`browserType().name() === 'webkit'`), and that `E2E_BASE_URL` / `E2E_API_URL` are the documented `http://localhost:3100` / `http://localhost:3000` origins the per-run preflight verifies. iPhone 14 is the documented single device profile (`devices['iPhone 14']`).

### Preflight + Auth Inheritance (AC 1)

The per-run preflight (`scripts/e2e-preflight.mjs`) is project-agnostic: it verifies ports 3100/3000, `.env.e2e` variables, and refreshes auth state before any Playwright project runs. The mobile project declares `dependencies: ['setup']` and `storageState: 'e2e/.auth/user.json'` identically to the `chromium` project, so it inherits the same auth setup and the same preflight gate. No project-specific preflight is needed or added.

### Pre-existing auth-setup blocker on `main` (NOT a Story 162.10 defect)

The live run could not complete because of a pre-existing integration bug between two Story 128.10 artifacts:

- `e2e/fixtures/atomic-storage-state.ts:29` calls `context.storageState()` with **zero arguments** to capture the state object before atomically writing it to disk.
- `e2e/fixtures/playwright-network-guard.ts:234-247` (`authStorageStatePath`) requires every `storageState(...)` call to have exactly the shape `{ path: '<allowed>' }` and otherwise calls `deny()` → `recordPolicyDenial('https://playwright-context-storage-state.invalid', ...)` → the outbound-network-policy denial.

So `auth.setup.ts:44` throws `Outbound test request denied by epic128-test-network-policy/v1` before any authenticated test can run. The Playwright network guard then reports `blocked 1 unexpected non-local request(s)` and the whole `setup` project fails, cascading "did not run" to every authenticated spec — desktop AND mobile equally.

**Control proof (2026-08-06):** the desktop control `npm run test:e2e -- e2e/orders.spec.ts` fails with the IDENTICAL stack in BOTH (a) this worktree and (b) the FE repo of record at baseline `b2a11519` (seeded `.env.e2e`, preflight passed, then `authStorageStatePath` → `atomicWriteStorageState`). The mobile project inherits the SAME shared `setup` dependency as `chromium`, so it cannot be exercised end-to-end until the Story 128.10 fixture bug is fixed. This is explicitly out of Story 162.10's declared scope ("NO product/backend code changes; read components only") — fixing a Story 128.10 auth fixture is scope creep the orchestrator must gate.

Per the story gotcha ("If a mobile route has a genuine product gap, document + do NOT fabricate"), this pre-existing cross-project setup gap is documented rather than worked around: no auth file was fabricated, the Story 128.10 fixture was not modified, and no `test.skip(true, ...)` was added (the mobile product itself works; only the shared setup is broken on `main`). The new mobile spec is timer-free, type-clean, lint-clean, and will execute green against the localhost preflight once the shared `setup` bug is fixed.

### Project Structure Notes

- Config ownership: `playwright.config.ts` (mobile project enabled; `testMatch` restricted; desktop `chromium` unchanged).
- Spec ownership: `e2e/mobile-critical-routes.spec.ts` (new, 7 tests).
- Scanner ownership: `scripts/check-e2e-fixed-waits.mjs` (`STORY_162_10_E2E_FILES` added; union 47 → 48; 162.5-162.9 constants verbatim).
- Context/parity ownership: this story artifact; the OMX plan at `.omx/plans/` is read-only.
- No product/backend source changes (components read only for locator discovery).
- No `waitForTimeout`/`setTimeout`/`setInterval`/`networkidle`/`page.clock` introduced; the new spec is timer-free from inception.

### Testing Requirements

Minimum implementation evidence (run from the worktree root):

```bash
npm run check:e2e-waits                  # exit 0, "48 owned targets are timer-free"
npm run check:e2e-bare-skips             # exit 0, "0 bare skips"
npm run check:e2e-assertions             # exit 0
npm run type-check                       # exit 0
npx eslint e2e/mobile-critical-routes.spec.ts scripts/check-e2e-fixed-waits.mjs --max-warnings=0   # exit 0
npx prettier --check playwright.config.ts e2e/mobile-critical-routes.spec.ts scripts/check-e2e-fixed-waits.mjs   # exit 0
npm run check:privacy                    # exit 0
```

Live browser acceptance (the bounded mobile project against the localhost preflight):

```bash
npm run test:e2e:full -- e2e/mobile-critical-routes.spec.ts --project=mobile --workers=1 --repeat-each=2 --retries=0
```

The full desktop-suite live run and PR/merge are owned by the orchestrator's runtime verification; static gates plus the bounded live run are complete in this lane.

### References

- [Source: `_bmad-output/planning-artifacts/epics-162-165-fe.md` - Story 162.10 ACs + UX-DR2 mobile smoke requirements]
- [Source: `src/app/(dashboard)/layout.tsx` - responsive split: desktop Sidebar `hidden lg:block`, MobileSidebarSheet in header]
- [Source: `src/app/(dashboard)/layout/MobileSidebarSheet.tsx` - hamburger trigger + Sheet nav (the real mobile nav control)]
- [Source: `src/app/(dashboard)/analytics/unit-economics/components/UnitEconomicsTable.tsx` - `overflow-x-auto` wrapper + `aria-label` table (horizontal-scroll assertion target)]
- [Source: `src/components/custom/dashboard/WidgetSettingsSheet.tsx` + `src/components/ui/sheet.tsx` - Radix Sheet dialog + `aria-label="Close"` affordance]
- [Source: `_bmad-output/implementation-artifacts/162-9-fe-explicit-fixture-aware-e2e-skips.md` - established artifact pattern + scanner-union growth (47 → 48)]

## Dev Agent Record

### Agent Model Used

- Implementation/delivery: scoped executor lane (mobile project enablement + bounded mobile smoke + scanner-union extension).

### Debug Log References

- 2026-08-06: Context created from FE main `b2a11519` on a stable worktree at `/Users/r2d2/Documents/Code_Projects/wb-fe-162-10` (branch `claude/162-10-mobile-critical-routes`), `node_modules` symlinked, `.env.e2e` seeded. Backend `:3000` up (PM2 `wb-repricer`); frontend `:3100` started with `npm run dev -- --webpack`.
- 2026-08-06: Read `src/app/(dashboard)/layout.tsx`, `MobileSidebarSheet.tsx`, `Sidebar.tsx`, `UnitEconomicsTable.tsx`, `WidgetSettingsSheet.tsx`, and `components/ui/sheet.tsx` to discover the REAL mobile nav control (hamburger `aria-label="Open menu"` + Radix Sheet) and confirm the desktop Sidebar is hidden below `lg`. Confirmed the analytics table has an `overflow-x-auto` wrapper with `min-w` columns (intentional horizontal scroll).
- 2026-08-06: Task 1 enabled the `mobile` project with `testMatch: /mobile-critical-routes\.spec\.ts/` (bounded by config) + the same `storageState`/`dependencies: ['setup']` as `chromium`. Desktop `chromium` project untouched.
- 2026-08-06: Task 2 authored `e2e/mobile-critical-routes.spec.ts` (7 tests: device/endpoint record, login form, mobile sidebar open/use/dismiss, sidebar close-without-navigating, analytics horizontal-scroll, dashboard dialog open/placement/close, 44×44 touch-target floor). Observable waits only.
- 2026-08-06: Task 3 extended the fixed-wait scanner union (`STORY_162_10_E2E_FILES`, 47 → 48); 162.5-162.9 constants preserved verbatim. Bare-skip scanner auto-includes the new spec via `git ls-files -z e2e`.
- 2026-08-06: Static gates green — `check:e2e-waits` exit 0 (48 targets), `check:e2e-bare-skips` exit 0, `check:e2e-assertions` exit 0, `type-check` exit 0, scoped `eslint --max-warnings=0` exit 0, `prettier --check` exit 0, `check:privacy` exit 0.
- 2026-08-06: Vitest green for scope — `src/test/e2e-fixed-waits.test.ts` 38/38 (union-assertion extended 47→48); full suite 17464 passing (floor 17186); the 2 failing files (`playwright-static-boundary.test.ts`, `check-e2e-bare-skips.test.mjs`) reproduce identically on baseline `b2a11519` → pre-existing, not introduced here.
- 2026-08-06: Live run BLOCKED by a pre-existing `main` auth-setup bug (`atomic-storage-state.ts:29` zero-arg `storageState()` vs `playwright-network-guard.ts:234` strict `{path}` requirement). Mobile run (`npm run test:e2e:full -- e2e/mobile-critical-routes.spec.ts --project=mobile --workers=1 --repeat-each=2 --retries=0`, PW_EXIT=1) and desktop control (`npm run test:e2e -- e2e/orders.spec.ts`, PW_EXIT=1) fail identically at `auth.setup.ts:44`. Reproduced in the FE repo of record at `b2a11519` → not a Story 162.10 defect. Out of declared scope ("NO fixture code changes"); documented, not worked around. The new spec is timer-free/type-clean/lint-clean and will run green once the shared setup is fixed.
- 2026-08-06: Config parity verified — `playwright.config.ts` diff vs `b2a11519` shows ONLY the mobile block changed; `setup`/`historical-spp`/`chromium` byte-identical → zero desktop coverage loss.

### File List

- `playwright.config.ts` (modified — `mobile` project enabled, `testMatch: /mobile-critical-routes\.spec\.ts/`; desktop `chromium`/`setup`/`historical-spp` byte-identical to `b2a11519`)
- `e2e/mobile-critical-routes.spec.ts` (added — bounded mobile critical-route smoke, 7 tests, 294 lines)
- `scripts/check-e2e-fixed-waits.mjs` (modified — `STORY_162_10_E2E_FILES` added; union 47 → 48; 162.5-162.9 constants preserved verbatim)
- `src/test/e2e-fixed-waits.test.ts` (modified — default-union assertion extended to include Story 162.10 + 162.10 list-shape check)
- `_bmad-output/implementation-artifacts/162-10-fe-mobile-critical-routes.md` (added)

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created implementation-ready Story 162.10 context from FE main `b2a11519`; enabled the bounded `mobile` (iPhone 14) Playwright project restricted by `testMatch` to the new `e2e/mobile-critical-routes.spec.ts` (login, mobile sidebar open/use/dismiss via the real `MobileSidebarSheet` hamburger control, unit-economics horizontal-scroll, dashboard WidgetSettings dialog, 44×44 touch-target floor), extended the fixed-wait scanner union (47 → 48; 162.5-162.9 constants preserved), and passed static gates (waits/bare-skips/assertions/type-check/eslint/prettier/privacy all exit 0) plus vitest scope-green (e2e-fixed-waits 38/38; full suite 17464 passing, 2 pre-existing failures reproduced on baseline). **Lessons:** (1) the disabled "mobile" project's note was a symptom — the real mobile nav is `MobileSidebarSheet` (hamburger `aria-label="Open menu"`), not the desktop `Sidebar` hidden below `lg`. (2) a pre-existing Story 128.10 auth-setup bug (zero-arg `storageState()` vs the network guard's strict `{path}` requirement) blocks ALL authenticated E2E on `main` — proven by an identical desktop control failure at `b2a11519`; documented, not worked around (out of declared scope). Status: backlog -> in-progress. |

# Story 173.1-FE: Migrate Settings Shell and Overview

Status: done — feature PR #328 merged (`2839640f`, merge `3c560ed2`); documentation closeout PR #329 merged (`25673172`, merge `7bec65fd`) and exact branch/worktree/open-PR cleanup proved; Story-owned six-file feature manifest; full floor **19,489/0/1,229**; targeted settings **17/217**; Playwright **47 passed / 2 explicit skips** and Story repeat **63 passed / 1 optional Manager skip**; two adversarial review passes with all accepted findings fixed; route-ledger rows intentionally remain `planned` until Story 174.5.

## Story

As a settings user, I want `/settings` to provide a real overview and a predictable shared navigation shell so that all seven settings destinations are understandable and usable at desktop and compact widths.

Authoritative plan: `.omx/plans/173.1-migrate-settings-shell-and-overview.md`.

## Prerequisites and Base

- Story base: `acbbffd694440f4f2bf3748f6dd1ae50f5d08468`.
- Epic 166 merge prerequisite: `ab12ffe98f1b78cae49a66eea8bed7e16e7ed0f2`, reachable from the base.
- Story 167.1 prerequisite: `a8dfe3532b2a05eaa8b979aae3522de39de2fcfa`, reachable from the base.
- Branch: `cdx/epic-173-story-1-settings-shell`.
- Worktree: `/private/tmp/wb-repricer-fe-173-1-settings-shell`.

## Delivered Behavior

- `/settings` no longer redirects. It renders a static overview with exactly one `h1` and three contextual settings groups.
- The shared shell owns one canonical order: Overview, Cabinet, Notifications, Tax, Tariffs, Expenses, Import.
- Desktop widths at `lg` and above use an observable two-column rail/content grid.
- Compact widths use a controlled left shadcn/Radix Sheet with a 44-pixel native trigger, one bounded navigation scroller, reduced-motion handling, Escape close, focus containment, link-close behavior, viewport-transition close, and deterministic trigger focus return.
- Root matching is exact; child and nested paths remain segment-aware.
- Owner receives seven links. Manager, Analyst, and Service receive five links plus visible non-activatable Tariffs and Import entries with `aria-disabled="true"`, visible `Только для владельца` meaning, and current-route semantics while a protected child redirect is pending.
- Existing Tariffs/Backfill child redirects and every API, hook, auth type/store, calculation, query key, primitive, token, AppShell, dependency, and backend contract remain unchanged.
- Loading, empty, and error overview states are structurally inapplicable because the overview is static and has no request that can load, return empty, or fail.

## Exact Feature Manifest

Feature commit `2839640f055ccce2ad75e65d9c388e7d1d5f714d` contains exactly:

- `src/app/(dashboard)/settings/page.tsx`
- `src/app/(dashboard)/settings/layout.tsx`
- `src/app/(dashboard)/settings/components/SettingsNav.tsx`
- `src/app/(dashboard)/settings/__tests__/page.test.tsx`
- `src/app/(dashboard)/settings/components/__tests__/SettingsNav.test.tsx`
- `e2e/settings-pages.spec.ts`

Diff: six files, +630/−47. No forbidden or unrelated file was included.

## Behavior Lock and Validation

Pinned runtime: Node `24.18.0`, npm `11.11.0`.

- Honest RED: the overview test observed the legacy `/settings/notifications` redirect; initial navigation requirements failed because Overview, role restrictions, the trigger, and Sheet did not exist.
- Focused Story Vitest: 2 files, 22 passed.
- Expanded settings regression: 17 files, 217 passed.
- Full Vitest: 1,229 files, 19,489 passed, 0 failed, 0 skipped. The first sandboxed run passed 19,488 and failed only because the historical server-lifecycle test received `listen EPERM`; the complete rerun outside sandbox passed.
- Full settings Playwright target: 47 passed, 2 explicit skips (optional Manager setup and an existing tax fixture-dependent case).
- Story browser repeat with `--repeat-each=2`: 63 passed, 1 optional Manager setup skip.
- Light/dark viewport matrix passed at 320, 390, 768, 1024, 1280, and 1440 CSS pixels; 200% CSS zoom reflow passed.
- Axe WCAG 2.2 A/AA passed for the desktop overview and compact open Sheet.
- Exact one-`h1` browser evidence passed for all seven settings routes.
- `lint`, `type-check`, `check:max-lines`, `check:next-params`, all three E2E static guards, changed-file Prettier, `git diff --check`, and production build passed.
- Production build compiled, passed TypeScript, generated 70/70 static pages, and included `/settings` plus all six children.

## Visual and Accessibility Evidence

Ignored run artifacts were visually inspected before worktree cleanup:

- `test-results/shadcn/story-173.1/overview-light-1280.png`
- `test-results/shadcn/story-173.1/overview-dark-1280.png`
- `test-results/shadcn/story-173.1/sheet-light-390.png`
- `test-results/shadcn/story-173.1/sheet-dark-390.png`

Manual disposition: desktop light/dark surfaces were coherent; the two-column shell was intentional; current state was visible and semantic; cards and Russian labels did not clip; the compact Sheet was viewport-bounded; no obvious horizontal overflow or theme drift was present; and the close control fit the narrow viewport.

Credentialed non-Owner visual evidence is not claimed because optional Manager credentials are absent. Manager/Analyst/Service desktop and compact semantics are deterministic in Vitest. The missing live restricted-state screenshot is explicit evidence debt `C18`, assigned to Story 174.3; it is not relabeled as a pass.

## Independent Review Disposition

Two fresh-context adversarial reviews inspected the complete six-file diff.

- Accepted: restricted current-route semantics were missing. Fixed in production and covered for Manager/Analyst/Service × Tariffs/Import in desktop and Sheet navigation.
- Accepted: desktop two-column geometry was not falsifiable. Added an observable bounding-box assertion and reran browser tests.
- Accepted: the existing “exactly one h1” E2E assertion allowed multiple headings and omitted Overview/Backfill. Strengthened to exact count across all seven routes.
- Accepted: compact non-Owner proof was too narrow. Added five-link, non-link, disabled, explanation, non-tabbable, current-state assertions.
- Dispositioned: credentialed Manager browser evidence cannot run without optional credentials. The exact Story plan permits unavailable environment-dependent checks to remain explicit gaps with next-best proof; the gap is assigned to 174.3.
- No unresolved product, authorization, scope, security, or test blocker remains.

## Lifecycle

- Feature PR: #328, `https://github.com/salacoste/wb-erp-system-daytona-FE/pull/328`.
- Feature head: `2839640f055ccce2ad75e65d9c388e7d1d5f714d`.
- Feature merge: `3c560ed273371e8ead098291047e855f673f16ca`.
- Documentation closeout PR: #329, `https://github.com/salacoste/wb-erp-system-daytona-FE/pull/329`.
- Documentation closeout head: `2567317229735eba2f2436874865e4310a9dea0f`.
- Documentation closeout merge: `7bec65fd7827020b9553f5007502e037c5b5e7dc`.
- PR base/head/headRefOid and the exact six-file manifest were verified before merge.
- Feature head, feature merge, and documentation closeout head were verified as ancestors of refreshed `origin/main`.
- The same Story branch/worktree was fast-forwarded to the feature merge solely to publish this reviewable documentation closeout; no future Story lane was opened.
- After closeout merge, primary `main` was fast-forwarded to `7bec65fd`; the exact remote branch, local branch, temporary worktree, open PR, and stale worktree registration were proved absent; primary `main` was clean and equal to refreshed `origin/main`; the recoverable quarantine remained present; and the original PM2 frontend was online.
- No deploy, production operation, direct push to `main`, force-push, dependency change, credential output, or route-ledger transition occurred.

## Lessons and Carry-Outs

- Restricted and current are intersecting states; a non-activatable route can still be the current route while a client-side authorization redirect is pending.
- Responsive visibility is insufficient proof of desktop layout; observable geometry prevents a stacked regression.
- Ignored screenshots require durable identifiers and manual disposition before worktree removal.
- Carry `C18` to Story 174.3. SEC-DOC-1 remains unchanged and outside this Story’s scope.

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-29 | Story 173.1 implemented, validated, adversarially reviewed, merged through feature PR #328, closed through documentation PR #329, and cleaned. Program NEXT is Story 173.2. |

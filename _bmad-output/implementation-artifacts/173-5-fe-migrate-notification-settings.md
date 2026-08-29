# Story 173.5-FE: Migrate Notification Settings

Status: done — feature PR #341 merged (`12798d9f`, merge `41d686de`); documentation closeout PR #342 merged (`6aab9d8a`, merge `45c35498`); exact product and initial documentation branch/worktree/open-PR cleanup proved; Story-owned 28-file feature manifest; fresh merged-main full floor **19,647/0/1,242**; focused Story **10 files / 68 tests**; Playwright **40 tests discovered** with browser execution explicitly unavailable because the required frontend/backend services were not running; product and documentation reviews have zero unresolved P0–P2 findings; route-ledger rows intentionally remain `planned` until Story 174.5.

## Story

As an Owner, I want `/settings/notifications` to expose Telegram binding, notification preferences, order-notification settings, and quiet-hours state truthfully and accessibly so that I can configure notifications without fabricated availability, invalid writeback, accidental card toggles, dismissible pending operations, or unstable focus.

Authoritative plan: `.omx/plans/173.5-migrate-notification-settings.md`.

## Prerequisites and Base

- Story base: `0ee003d8bb15b9f21c0da9d6efa94273bdbaf444`.
- Story 173.1 settings-shell prerequisite, semantic Telegram/status tokens from the foundation, and the separate ContextBar accessibility hotfix PR #331 are reachable from the base.
- Branch: `cdx/epic-173-story-5-settings-notifications`.
- Worktree: `/private/tmp/wb-repricer-fe-173-5-settings-notifications`.
- Shared settings shell, PageHeader, ContextBar, PageState, notification APIs, query/writeback hooks, types, routes, generic UI primitives, authentication, and authorization were reused without contract changes.

## Delivered Behavior

- The route composes PageHeader, ContextBar, and PageState with one route `h1` and logical route-level `h2` sections in loading and settled states.
- Telegram status remains truthful across loading, unavailable, confirmed-unbound, and confirmed-bound states. An unavailable status offers retry through the existing `checkStatus()` path and does not block independent FBS order-notification settings.
- Telegram, status, surface, and theme styling uses semantic tokens instead of raw brand/gray/white palette classes in the owned presentation surface.
- Event switches are the sole keyboard toggle controls. Their labels and descriptions are explicitly associated, and clicks in nested digest-time controls cannot bubble into the card toggle.
- Language radios expose a visible keyboard focus ring while retaining native radio semantics and deterministic selection.
- Quiet-hours validation evaluates the complete local candidate before any start-time, end-time, timezone, or enabled write. Invalid drafts stay local, expose visible associated `role="alert"` feedback with `aria-invalid`, and never reach the mutation boundary.
- Overnight detection is minute-accurate rather than hour-only, including equal-hour values with different minutes.
- Telegram binding and unbinding overlays keep pending operations open, block Escape/outside/cancel/confirm dismissal as applicable, close only on success, retain retryable state on failure, and restore focus deterministically.
- Cancel/Escape returns focus to the invoking action; successful unbind returns focus to a persistent route fallback that survives the bound-card removal.
- The unbind confirmation content remains contained at narrow width and 200% reflow through responsive max-height and vertical scrolling, with reduced-motion-safe transitions and valid AlertDialog description semantics.
- Canonical Telegram Playwright discovery covers loading/unavailable/bound/unbound state, binding and verification pending state, preference save success/failure, exact quiet-hours writes and invalid suppression, digest-time interaction, unbind pending/success/failure, deterministic focus, responsive/theme/reflow/reduced-motion behavior, and scoped WCAG A/AA/2.2 AA axe scans.

## Exact Feature Manifest

Feature commit `12798d9fca553d7eb8f05408b40a06c765e6996b` contains exactly:

- `e2e/telegram-notifications.spec.ts`
- `src/app/(dashboard)/settings/notifications/NotificationsDisabledPanel.tsx`
- `src/app/(dashboard)/settings/notifications/NotificationsHeroBanner.tsx`
- `src/app/(dashboard)/settings/notifications/__tests__/notifications-presentation-source-contracts.test.ts`
- `src/app/(dashboard)/settings/notifications/__tests__/page.test.tsx`
- `src/app/(dashboard)/settings/notifications/page.tsx`
- `src/components/custom/settings/OrderNotifInputs.tsx`
- `src/components/notifications/BindingCodeStep.tsx`
- `src/components/notifications/EventTypeCard.tsx`
- `src/components/notifications/LanguageRadio.tsx`
- `src/components/notifications/NotificationPreferencesPanel.tsx`
- `src/components/notifications/PreferencesActionBar.tsx`
- `src/components/notifications/QuietHoursPanel.tsx`
- `src/components/notifications/QuietHoursScheduleDisplay.tsx`
- `src/components/notifications/QuietHoursTimePickers.tsx`
- `src/components/notifications/TelegramBindingCard.tsx`
- `src/components/notifications/TelegramBindingModal.tsx`
- `src/components/notifications/TimezoneSelect.tsx`
- `src/components/notifications/UnbindConfirmationDialog.tsx`
- `src/components/notifications/__tests__/EventTypeCard.test.tsx`
- `src/components/notifications/__tests__/LanguageRadio.test.tsx`
- `src/components/notifications/__tests__/NotificationPreferencesPanel.test.tsx`
- `src/components/notifications/__tests__/QuietHoursPanel.test.tsx`
- `src/components/notifications/__tests__/TelegramBindingModal.test.tsx`
- `src/components/notifications/__tests__/UnbindConfirmationDialog.test.tsx`
- `src/components/notifications/useQuietHoursPanel.ts`
- `src/components/notifications/useTelegramBindingModal.helpers.ts`
- `tests/e2e/telegram-notifications.spec.ts` (removed after canonical relocation to `e2e/`)

Diff: 28 files, +1,806/−944. No notification hook/API/normalizer/type/query/writeback contract, settings shell/navigation/layout, shared route registry, generic UI primitive, dependency, lockfile, backend file, route-ledger row, or ContextBar implementation was included.

## Behavior Lock and Validation

Pinned runtime: Node `24.18.0`, npm `11.11.0`.

- Initial component RED: 3 files failed, 7 failed and 1 passed; initial GREEN: 3 files and 8/8 tests passed.
- Review-regression RED: 5 files failed, 10 failed and 12 passed; repaired GREEN: 5 files and 22/22 tests passed.
- Loading-heading edge was locked test-first: RED 1 failed/9 passed, then GREEN 10/10 passed.
- Final focused Story plus staged-index boundary: 10 files, 68/68 tests passed.
- Fresh unrestricted full Vitest on merged `main`: 1,242 files, 19,647 passed, 0 failed. The known jsdom `Not implemented: navigation (except hash changes)` diagnostic from `ProcessingStatus.tsx` remained non-failing and outside Story scope.
- Production build on the repaired product snapshot compiled successfully, passed TypeScript, generated 70/70 static pages, and included `/settings/notifications`. The only later product delta was the loading heading level plus its unit assertion; final TypeScript, ESLint, Prettier, focused tests, and diff checks passed after that delta.
- Telegram Playwright discovery found 40 tests in one canonical file: 36 Story cases plus 4 setup cases. Browser execution was not run because the required frontend on `localhost:3100` and backend on `localhost:3000` were unavailable; no browser-pass claim is made.
- Discovery coverage names light and dark themes at 320, 390, 768, 1024, 1280, and 1440 CSS pixels; 200% reflow; binding/unbind modal containment; focus lifecycle; reduced motion; and scoped axe scans.
- Source and focused E2E ESLint, TypeScript, exact-manifest Prettier, `check:max-lines`, `check:next-params`, `check:locale-percent`, all three E2E static guards, Playwright staged-index boundary, production build, and `git diff --check` passed.
- `.env.e2e`, auth state, cookies, tokens, screenshots, traces, videos, reports, and test-result artifacts were not created or retained. Added-line credential and URL-userinfo scans found zero matches.

## Independent Review Disposition

- Two independent product reviewers found the async-unbind premature close, invalid quiet-hours candidate leakage, digest-time click bubbling, missing visible radio focus, heading hierarchy, deterministic post-unbind focus, and narrow/reflow evidence gaps.
- The repaired snapshot closed every P1. Product re-review identified one residual P2—the loading branch used `h3` instead of the route-level `h2`—which was then fixed test-first.
- The final product diff SHA-256 is `b5b13a9b5ba5b5b9bfc356e9b7bce52913b6500ed55dbee3b2517f4aa2fe922a`. The final delta after the last product re-review was limited to `h3` → `h2` plus one loading-state unit assertion; focused tests, TypeScript, ESLint, Prettier, and diff checks passed afterward.
- The independent closeout review covered the exact 28-file product commit and all five closeout files. It confirmed P0 = 0 and P1 = 0, found one P2 stale master snapshot date, and otherwise approved the product/spec/lifecycle evidence.
- The sole P2 was corrected exactly from 2026-08-29 to 2026-08-30. Exact-five Prettier, YAML, arithmetic, plan/route/ledger, stale-marker, marker, lessons, relative-link, privacy, and diff checks were rerun; no unresolved P0–P2 finding remains.
- Repo-wide `check:docs` retains one inherited current-main citation-baseline mismatch caused by the merged product line-count change in a historical archive citation; the same mismatch exists on clean product `main`, and this five-file closeout adds no source-line citation. The archive/baseline repair remains outside this lifecycle manifest.

## Lifecycle

- Feature PR: #341, `https://github.com/salacoste/wb-erp-system-daytona-FE/pull/341`.
- Feature head: `12798d9fca553d7eb8f05408b40a06c765e6996b`.
- Feature merge: `41d686de886442d579a19aabb8331bf3995f12e3`.
- PR base/head, one-commit history, mergeability, exact head OID, and exact 28-file manifest were verified before merge with `--match-head-commit` protection.
- Documentation closeout PR: #342, `https://github.com/salacoste/wb-erp-system-daytona-FE/pull/342`.
- Documentation closeout head: `6aab9d8acb151dc73bcc8fd795e8c6d7558132da`.
- Documentation closeout merge: `45c3549882beea86b9c589f79c12a4673d6cb0bb`.
- After PR #342 merged, primary `main` was fast-forwarded to `45c35498` and proved equal to refreshed `origin/main`; the feature and closeout heads and merges are ancestors of that tip.
- The exact product and initial documentation remote branches, local branches, worktrees, paths, open PRs, and stale registrations were proved absent before this auxiliary lane was created.
- The auxiliary lifecycle-record branch/worktree exists only to publish these already-proved facts and is cleaned after its own merge; no recursive self-merge or self-cleanup claim is made.
- No deploy, production operation, direct push to `main`, force-push, dependency change, credential output, route-ledger transition, ContextBar implementation change, or unrelated debt fix occurred.

## Lessons and Carry-Outs

- A status request failure is an unavailable state, not evidence that Telegram is unbound; independent settings must remain usable when their own data is available.
- Validating only the field that fired an event is insufficient when one mutation writes a composite schedule; validate the complete candidate before every sibling write path.
- Controlled async overlays require one complete dismissal and focus-ownership contract across pending, failure, cancel/Escape, and successful entity removal.
- Nested interactive controls must not inherit parent-card toggle behavior, and custom radio presentation must preserve a visible keyboard focus indicator.
- Browser discovery is useful scope evidence but is not browser execution. The service-dependent run remains an explicit gap rather than a claimed pass.
- Real screen-reader and real browser-UI zoom evidence remain Story 174.3 carry-outs. SEC-DOC-1, route-ledger transitions, and notification API/query/writeback contracts remain unchanged and outside this Story's scope.

## Change Log

| Date       | Change |
| ---------- | ------ |
| 2026-08-30 | Story 173.5 implemented, validated, independently reviewed, merged through feature PR #341, and closed through documentation PR #342, with product and initial-documentation residue cleaned; auxiliary lifecycle evidence prepared for reviewed publication. **Lessons:** (1) Keep unavailable distinct from unbound. (2) Validate composite drafts before every write. (3) Treat pending dismissal and focus restoration as one lifecycle. |

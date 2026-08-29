# Story 173.2-FE: Migrate Backfill Settings

Status: done — feature PR #332 merged (`a2a7033a`, merge `7c85b804`); Story-owned 17-file feature manifest; frozen content fingerprint `f02bb5fbc638358b8d699514d31d7ced3160325002a46241eee2276b8d68665f`; full floor **19,565/0/1,232**; focused Story **6 files / 106 tests**; Playwright **77 passed / 2 documented conditional skips**; Claude and independent architecture reviews approved with zero blockers; documentation closeout and exact product/docs cleanup will be recorded through the reviewable follow-up lifecycle; route-ledger rows intentionally remain `planned` until Story 174.5.

## Story

As an administrator, I want `/settings/backfill` to present truthful import-job state and safe controls so that I can start, monitor, refresh, and recover backfill work without fabricated progress, duplicate submission, or inaccessible interaction.

Authoritative plan: `.omx/plans/173.2-migrate-backfill-settings.md`.

## Prerequisites and Base

- Story base: `4c0e7a5c769e52bc3ee58aededa666d711692fc8`.
- Story 173.1 settings-shell prerequisite is reachable from the base.
- Branch: `cdx/epic-173-story-2-settings-backfill`.
- Worktree: `/private/tmp/wb-repricer-fe-173-2-settings-backfill`.
- Shared settings shell, primitives, APIs, hooks, types, dependencies, tokens, and backend contracts were reused without modification.

## Delivered Behavior

- The route distinguishes unresolved, transport-paused, successful empty, initial-error, quiet polling, explicit-refresh, retained-stale, retrying, and recovered query states without fabricating empty data or zero summaries.
- Explicit refresh owns one route-local promise lifecycle, rejects duplicate requests, locks related controls, announces once, and unlocks only after settlement; automatic polling does not masquerade as a user refresh.
- Background refresh failure retains the last successful cabinets, shows a limitation disclosure and Moscow timestamp, and permits deterministic retry.
- Start eligibility evaluates both pipelines across all 16 products of `idle`, `not_started`, `completed`, and `failed`; combined status precedence is failed, in-progress, pending, paused, both completed, both not-started, then idle.
- Active jobs expose a safe-to-leave disclosure; progress and ETA are numeric, end-aligned, tabular, localized, and represented with semantic tokens plus text.
- Mobile uses dedicated cards while desktop uses a keyboard-focusable horizontal table projection. Long Russian content wraps, Select portals remain viewport-bounded, and dialog/select/error controls meet the 44×44 target.
- The start dialog remains dismissible while submission is pending. The external start trigger remains focusable with `aria-disabled="true"`, rejects click/Enter reopening, receives focus after Escape dismissal, and unlocks after the request settles.
- Existing API/job semantics, shared settings shell, AppShell, cabinet-session behavior, dependencies, and backend contracts remain unchanged.

## Exact Feature Manifest

Feature commit `a2a7033a09cd79081a5e0a0f7e9984cf42cc9c12` contains exactly:

- `e2e/backfill-page.spec.ts`
- `e2e/settings/backfill-a11y.spec.ts`
- `e2e/settings/backfill-admin.spec.ts`
- `src/app/(dashboard)/settings/backfill/__tests__/page.test.tsx`
- `src/app/(dashboard)/settings/backfill/__tests__/backfill-presentation-source-contracts.test.ts`
- `src/app/(dashboard)/settings/backfill/components/BackfillControlButtons.tsx`
- `src/app/(dashboard)/settings/backfill/components/BackfillErrorLog.tsx`
- `src/app/(dashboard)/settings/backfill/components/BackfillProgressBar.tsx`
- `src/app/(dashboard)/settings/backfill/components/BackfillRetryControls.tsx`
- `src/app/(dashboard)/settings/backfill/components/BackfillStatusTable.tsx`
- `src/app/(dashboard)/settings/backfill/components/StartBackfillDialog.tsx`
- `src/app/(dashboard)/settings/backfill/components/__tests__/BackfillProgressBar.test.tsx`
- `src/app/(dashboard)/settings/backfill/components/__tests__/BackfillStatusTable.test.tsx`
- `src/app/(dashboard)/settings/backfill/components/__tests__/StartBackfillDialog.test.tsx`
- `src/app/(dashboard)/settings/backfill/components/backfill-presentation.tsx`
- `src/app/(dashboard)/settings/backfill/loading.tsx`
- `src/app/(dashboard)/settings/backfill/page.tsx`

Diff: 17 files, +2,108/−598. Frozen exact-content fingerprint: `f02bb5fbc638358b8d699514d31d7ced3160325002a46241eee2276b8d68665f`. No shared primitive, foundation, AppShell, API, hook, type, dependency, lockfile, token, or backend file was included.

## Behavior Lock and Validation

Pinned runtime: Node `24.18.0`, npm `11.11.0`.

- Focused Story Vitest: 6 files, 106 passed.
- Full Vitest: 1,232 files, 19,565 passed, 0 failed, 0 skipped. The sandboxed attempt passed 19,564 and failed only because the historical SPP server-lifecycle test received `listen EPERM 0.0.0.0`; the complete outside-sandbox rerun passed.
- Exact three-file Story Playwright: 77 passed, 2 documented conditional skips, 0 failed.
- Browser regressions cover initial 503 and successful retry, retained stale data and recovery at 390px dark, and pending start POST → Escape → guarded-trigger focus restoration → Enter rejection → settlement unlock.
- Light/dark responsive and reflow proof passed at 320, 390, 768, 1024, 1280, and 1440 CSS pixels plus a 200% CSS-zoom proxy.
- Axe checks passed in real Chromium for light and dark themes; reduced-motion browser proof passed.
- Full source ESLint, exact Story E2E ESLint, TypeScript, exact-manifest Prettier, `check:max-lines`, `check:next-params`, all three E2E static guards, `check:locale-percent`, `check:anti-pattern-8-normalizer`, `test:privacy`, and `git diff --check` passed.
- Turbopack and webpack production builds both generated 70/70 pages. The sandboxed Turbopack attempt failed only because its helper could not bind a port; the required outside-sandbox retry passed.
- After E2E, the Story `.env.e2e` and `e2e/.auth/user.json` were absent and the original PM2 frontend remained online. Their contents were never read or printed.

## Visual and Accessibility Evidence

- Initial-error, retained-stale, successful recovery, responsive, theme, Axe, keyboard/focus, portal width, and reduced-motion behaviors are locked by deterministic browser tests.
- The pending-dialog focus regression is specifically covered with real Chromium rather than inferred from unit behavior.
- No retained screenshots, traces, or videos are claimed.
- CSS zoom is an explicit reflow proxy, not real browser-UI zoom evidence.
- Real VoiceOver, NVDA, JAWS, and TalkBack evidence remains an explicit Story 174.3 carry-out.

## Independent Review Disposition

- External Claude CLI: `APPROVE` with zero blocking findings on the frozen fingerprint.
- Independent architecture review: `APPROVE` with zero blocking findings on the frozen fingerprint.
- An earlier architecture pass found unsafe focus restoration to a natively disabled trigger during a pending start request. The accepted repair keeps the trigger focusable, uses guarded `aria-disabled`, preserves normal Escape/X/Cancel dismissal, and proves settlement unlock.
- Gemini CLI required an interactive OAuth flow. No credential flow was initiated and no Gemini product verdict is claimed; the independent architecture review supplied the second fresh-context verdict.
- The final Claude raw response referenced three minor notes without emitting them. The reviewed manifest and fingerprint remained unchanged, so no undocumented product change was inferred.
- No unresolved product, authorization, scope, security, or test blocker remains.

## Lifecycle

- Feature PR: #332, `https://github.com/salacoste/wb-erp-system-daytona-FE/pull/332`.
- Feature head: `a2a7033a09cd79081a5e0a0f7e9984cf42cc9c12`.
- Feature merge: `7c85b804c5da65245987b514e13afd811f91d64e`.
- PR base/head/headRefOid and the exact 17-file manifest were verified before merge.
- The product merge is present on refreshed `origin/main`.
- Documentation closeout uses a separate reviewable documentation-only PR. Its exact head, merge, and final cleanup proof are recorded only after they exist; this artifact does not pre-claim them.
- Product and documentation branch/worktree cleanup remains sequenced after documentation merge so the final absence proof can be canonicalized without reopening product scope.
- No deploy, production operation, direct push to `main`, force-push, dependency change, credential output, route-ledger transition, or unrelated debt fix occurred.

## Lessons and Carry-Outs

- Native disabled state can break overlay focus restoration; a guarded focusable trigger preserves both safety and Radix focus semantics.
- Query-library transport flags do not replace route-owned user-intent state for explicit refresh announcements and locking.
- Retained stale data must remain visibly limited and timestamped instead of becoming a fabricated success state.
- Unknown backend-status coercion in `src/lib/api/backfill.ts` remains Epic 174 debt; no contract change was smuggled into presentation scope.
- Real screen-reader evidence, real browser-UI zoom, and retained visual artifacts remain explicit Story 174.3 carry-outs. SEC-DOC-1 remains unchanged and outside this Story’s scope.

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-29 | Story 173.2 implemented, validated, independently reviewed, and merged through feature PR #332; reviewable documentation closeout started. **Lessons:** (1) Guarded focusable triggers preserve focus restoration. (2) Explicit refresh needs route-owned intent state. (3) Stale data needs visible limits. |

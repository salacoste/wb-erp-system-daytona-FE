# Story 173.6-FE: Migrate Tariff Settings

Status: done — feature PR #344 merged (`9266ead5`, merge `80427f28`); exact product branch/worktree/open-PR cleanup proved; documentation closeout lane `cdx/docs-story-173-6-closeout` is active from the product merge and will be followed by a narrow auxiliary lifecycle record; Story-owned 29-file feature manifest; fresh full floor **19,663/0/1,244**; focused Story **10 files / 162 tests**; Playwright **81 tests discovered** in the settings-pages file, including **20 tariff scenarios**, with browser execution explicitly unavailable because the required services and credentialed preflight were absent; production build **70/70**; final independent product review has zero unresolved P0–P2 findings; route-ledger rows intentionally remain `planned` until Story 174.5.

## Story

As an Owner, I want `/settings/tariffs` to expose the current tariff configuration, units, validation, save lifecycle, and availability state truthfully and accessibly so that I can review and update tariffs without silent partial data, accidental dismissal during a pending write, lost valid input after a recoverable failure, or ambiguous save results.

Requirement: FR27. Authoritative plan: `.omx/plans/173.6-migrate-tariff-settings.md`.

## Prerequisites and Base

- Product base: `e3d5a05950d16d31af7cb3c1b1024e3480cffda6`.
- Story 173.1 settings-shell prerequisite, merged foundation/AppShell, and the separate ContextBar accessibility hotfix PR #331 were reachable from the base.
- Product branch: `cdx/epic-173-story-6-settings-tariffs`.
- Product worktree: `/private/tmp/wb-repricer-fe-173-6-settings-tariffs`.
- Documentation closeout branch: `cdx/docs-story-173-6-closeout`.
- Documentation closeout worktree: `/private/tmp/wb-repricer-fe-docs-173-6-closeout`.
- Documentation closeout base: product merge `80427f28d6d36a2ec182fd13abb493c97293f37a`.
- Shared settings shell, PageHeader, ContextBar, tariff APIs, hooks, normalizers, types, calculations, query keys/cache behavior, authorization, and navigation were reused without contract changes.

## Delivered Behavior

- `/settings/tariffs` composes the shared `PageHeader` and `ContextBar` with one route heading and responsive one-to-three-column tabs.
- A route-owned coordinator reads the existing `useTariffSettings` query. TanStack Query shares and deduplicates the observer while preserving the existing query key, request, cache, and invalidation contracts.
- `ContextBar` maps the real query state: loading/refetch is `refreshing`, fetch failure is `unavailable`, omitted tariff values are `partial`, and a complete successful response is `fresh`.
- The loading branch exposes an accessible route skeleton instead of a visual-only placeholder.
- Partial tariff responses expose a form-level notice; validation failures expose an error summary.
- Scalar fields associate units, help text, and errors through `aria-describedby`; logistics tiers associate each nested error with the exact row field.
- Notes, logistics tiers, and FBS controls participate in controlled dirty tracking, so Save/Cancel state follows every supported edit rather than only scalar inputs.
- Save result is announced through a persistent DOM live region.
- A successful save rebases React Hook Form to the server-backed values and returns the form to pristine state.
- Recoverable save failure preserves the valid draft, keeps the confirmation surface open, and offers a retry with the same exact payload.
- The Radix AlertDialog prevents its default auto-close while the async save starts. Pending state blocks Cancel, Escape, outside interaction, and controlled dismissal; success is the only async close path.
- Focus returns to Save when it remains usable and otherwise to the persistent focusable form card.
- Narrow action order remains Cancel → Save. Dialog content is viewport-bounded and vertically scrollable at narrow width and 200% reflow.
- Introduced spinners and transitions include reduced-motion behavior, and route-reachable legacy palette utilities were replaced with semantic tokens.
- `TariffFormStatus.tsx` holds route-exclusive status/validation presentation so every source file remains within the repository's 200-line cap.

## Exact Feature Manifest

Feature commit `9266ead5f0dbb8aae4d58002b50a7f4734c1d7d1` contains exactly:

- `e2e/settings-pages.spec.ts`
- `src/app/(dashboard)/settings/tariffs/__tests__/page.test.tsx`
- `src/app/(dashboard)/settings/tariffs/__tests__/tariffs-presentation-source-contracts.test.ts`
- `src/app/(dashboard)/settings/tariffs/page.tsx`
- `src/components/custom/tariffs-admin/AuditActionBadge.tsx`
- `src/components/custom/tariffs-admin/AuditLogTableParts.tsx`
- `src/components/custom/tariffs-admin/DeleteVersionDialog.tsx`
- `src/components/custom/tariffs-admin/FbsSettingsSection.tsx`
- `src/components/custom/tariffs-admin/LogisticsRatesSection.tsx`
- `src/components/custom/tariffs-admin/LogisticsTierRow.tsx`
- `src/components/custom/tariffs-admin/LogisticsTiersEditor.tsx`
- `src/components/custom/tariffs-admin/RateLimitIndicator.tsx`
- `src/components/custom/tariffs-admin/SaveConfirmDialog.tsx`
- `src/components/custom/tariffs-admin/TariffFieldInput.tsx`
- `src/components/custom/tariffs-admin/TariffFormActions.tsx`
- `src/components/custom/tariffs-admin/TariffFormSkeleton.tsx`
- `src/components/custom/tariffs-admin/TariffFormStatus.tsx`
- `src/components/custom/tariffs-admin/TariffSectionWrapper.tsx`
- `src/components/custom/tariffs-admin/TariffSettingsForm.tsx`
- `src/components/custom/tariffs-admin/VersionHistoryTable.tsx`
- `src/components/custom/tariffs-admin/VersionHistoryTableStates.tsx`
- `src/components/custom/tariffs-admin/VersionStatusBadge.tsx`
- `src/components/custom/tariffs-admin/__tests__/AuditLogTable.test.tsx`
- `src/components/custom/tariffs-admin/__tests__/RateLimitIndicator.test.tsx`
- `src/components/custom/tariffs-admin/__tests__/TariffSettingsForm.story-173-6.test.tsx`
- `src/components/custom/tariffs-admin/__tests__/TariffSettingsForm.test.tsx`
- `src/components/custom/tariffs-admin/__tests__/VersionHistoryTable.test.tsx`
- `src/components/custom/tariffs-admin/tariffSettingsSchema.ts`
- `src/components/custom/tariffs-admin/useTariffSettingsForm.ts`

Diff: 29 files, +1,125/−121. No tariff hook/API/normalizer/type/query-key/cache/calculation/rate-limit-store contract, schedule-only tariff module, settings shell/navigation/AppShell, shared UI primitive, product-composition implementation, dependency, lockfile, backend file, or route-ledger row was included.

Schedule-only modules explicitly remained untouched:

- `ScheduleVersionModal.tsx`
- `ScheduleVersionForm.tsx`
- `ScheduleVersionFormFields.tsx`
- `useScheduleTariffVersion.ts`
- `ScheduleVersionModal.test.tsx`

## Behavior Lock and Validation

Pinned runtime: Node `24.18.0`, npm `11.11.0`.

- Baseline focused floor before Story-specific tests: 8 files, 146/146 tests passed.
- Genuine initial RED: 2 files failed, 10 failed and 1 passed. The failures locked the missing loading label, partial notice, descriptions, validation summary, controlled dirty state, pending-safe dialog, recoverable retry, DOM announcement, and route presentation contracts.
- Final focused Story validation: 10 files, 162/162 tests passed.
- The first sandboxed full-suite run produced 1,243 passing files / 19,662 passing tests plus one environment-only `listen EPERM` failure in `src/test/historical-spp-server-lifecycle.test.ts`.
- The required unrestricted rerun passed completely: 1,244 files, 19,663 passed, 0 failed. The known non-failing jsdom `Not implemented: navigation (except hash changes)` diagnostic from `ProcessingStatus.tsx` remained outside Story scope.
- Pinned-runtime lint, TypeScript, `check:max-lines`, exact-manifest Prettier, `git diff --check`, and all three E2E static guards passed.
- The final canonical Turbopack production build compiled, passed TypeScript, generated 70/70 static pages, and included `/settings/tariffs`. The temporary physical `node_modules` clone used to avoid the external-symlink build restriction was deleted and the ignored symlink restored; no dependency or lockfile changed.
- Direct Playwright discovery with safe placeholder environment and `CI=1` found 81 tests in `e2e/settings-pages.spec.ts`, including 20 tariff scenarios.
- Tariff discovery covers exact keyboard PATCH success, pending containment and dismissal blocking, recoverable same-payload retry, focus recovery, light/dark widths 320/390/768/1024/1280/1440, 200% reflow, reduced motion, overflow, and axe tags `wcag2a`, `wcag2aa`, and `wcag22aa`.
- Real browser execution was unavailable because `localhost:3100` and `localhost:3000` were not running and the credentialed E2E preflight values were absent. Discovery is not reported as browser execution.
- `.env.e2e`, authentication state, cookies, tokens, screenshots, traces, videos, reports, and test-result artifacts were not created or retained.
- Repository-wide `check:docs` reports the inherited 95-citation baseline mismatch. The drift exists outside this Story and includes older moved/deleted archive citations; this closeout does not modify the archive citation baseline or route ledger.

## Independent Review Disposition

- The first exact-snapshot product review found one P2: `ContextBar` claimed data availability during tariff loading, failure, and partial states.
- The P2 was corrected through the route-owned query coordinator and four regression cases without changing hook/API/query/cache contracts.
- Independent final re-review covered exact product diff SHA-256 `64586c8dd3f8e228823b01a157c3ab0baaa74e8f3804dd98629037dd714a284c`.
- Final disposition: P0 = 0, P1 = 0, P2 = 0; scope PASS; recommendation APPROVE.
- No unresolved correctness, security, accessibility, responsive, async-lifecycle, API-contract, or test-quality finding remains.

## Lifecycle

- Feature PR: #344, `https://github.com/salacoste/wb-erp-system-daytona-FE/pull/344`.
- Feature head: `9266ead5f0dbb8aae4d58002b50a7f4734c1d7d1`.
- Feature merge: `80427f28d6d36a2ec182fd13abb493c97293f37a`.
- Base/head, mergeability, clean merge state, exact 29-file manifest, and GitGuardian pass were verified before merge; merge used exact-head protection against `9266ead5f0dbb8aae4d58002b50a7f4734c1d7d1`.
- After merge, primary `main` and refreshed `origin/main` were equal at `80427f28`; the product remote branch, local branch, worktree/path, open PR, and temporary dependency artifacts were absent.
- The initial documentation closeout lane is active from exact product merge `80427f28`. It changes only the five program tracking files and does not claim its own future PR number, head, merge, or cleanup.
- After the initial documentation PR merges and is cleaned, a separate narrow auxiliary lifecycle record publishes its exact PR/head/merge and cleanup proof. That later record must not recursively claim its own future merge or cleanup.
- No deploy, production operation, direct push to `main`, force-push, dependency change, credential output, route-ledger transition, ContextBar implementation change, archive citation remediation, or unrelated debt fix occurred.

## Lessons and Carry-Outs

- A summary status component must derive availability from the same authoritative query state as the form; a visually complete shell must not imply that loading, failed, or partial data is fresh.
- Async AlertDialog ownership requires prevention of default close plus explicit handling of every dismissal path while pending.
- Controlled composite edits need explicit dirty-state integration and exact nested error association; scalar-only form wiring is insufficient.
- Successful mutation means rebasing the form to authoritative values, while recoverable failure means preserving the valid draft and retry payload.
- Browser discovery is useful scope evidence but is not browser execution. Service- and credential-dependent execution remains an explicit gap.
- Real screen-reader and real browser-UI zoom evidence remain Story 174.3 carry-outs. SEC-DOC-1, route-ledger transitions, and tariff API/query/calculation contracts remain unchanged and outside this Story's scope.

## Change Log

| Date       | Change                                                                                                                                                                                                                                                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 | Story 173.6 implemented, validated, independently reviewed, merged through feature PR #344, and prepared for exact-five-file documentation closeout. **Lessons:** (1) Derive summary availability from the real query. (2) Own the complete pending-dismissal contract. (3) Rebase on success and preserve valid drafts on recoverable failure. |

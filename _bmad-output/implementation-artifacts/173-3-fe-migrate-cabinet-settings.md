# Story 173.3-FE: Migrate Cabinet Settings

Status: done — feature PR #335 merged (`a3d23221`, merge `5ce9935e`); documentation closeout PR #336 merged (`8a551173`, merge `3e04ccd2`); exact product and initial documentation branch/worktree/open-PR cleanup proved; Story-owned 12-file feature manifest; full floor **19,589/0/1,234**; focused Story **6 files / 49 tests**; Playwright **24 passed / 1 optional Manager setup skip**; product and documentation reviews approved with zero unresolved findings; route-ledger rows intentionally remain `planned` until Story 174.5.

## Story

As a cabinet administrator, I want `/settings/cabinet` to present the active cabinet, seller evidence, Jam subscription state, rating, and target-margin controls truthfully and accessibly so that I can understand the current scope and update the margin without an implicit cabinet, authentication, authorization, API, or cache-contract change.

Authoritative plan: `.omx/plans/173.3-migrate-cabinet-settings.md`.

## Prerequisites and Base

- Story base: `61dac9d52a828494c3861fdefd8ca6292a62ae6b`.
- Story 173.1 settings-shell prerequisite is reachable from the base.
- Branch: `cdx/epic-173-story-3-settings-cabinet`.
- Worktree: `/private/tmp/wb-repricer-fe-173-3-settings-cabinet`.
- Shared settings shell, PageHeader, ContextBar, cabinet APIs, hooks, query keys, cache invalidation, types, stores, role permissions, primitives, tokens, authentication, and active-cabinet reconciliation were reused without modification.

## Delivered Behavior

- The route keeps one stable `h1` while active-cabinet hydration is unresolved, exposes an accessible busy status, and then identifies the active cabinet and scope through the existing PageHeader and ContextBar compositions.
- Cabinet, seller, Jam, and rating cards distinguish immediate loading, delayed loading, unavailable, absent, partial, and available evidence without fabricating data or hiding retained partial evidence.
- Long Russian cabinet and seller values wrap without truncating meaning or forcing horizontal page overflow.
- Seller-rating stars are decorative while a textual accessible rating remains; explicit absent and unavailable messages do not depend on color.
- Jam presentation uses semantic theme-safe tiers. Upgrade is offered only for explicitly available `none` and `standard` tiers; unknown or unavailable tiers fail closed. The external Jam link retains `_blank` with `noopener noreferrer`.
- Target-margin input has associated label, description, unit, and validation feedback. Invalid input issues no PUT request.
- Saving exposes busy, pending, success, and failure semantics through a persistent polite live region while preserving Sonner behavior and the entered value after failure.
- Save feedback is cleared after field editing or invalid submission, and keyed form ownership prevents state or mutation-observer leakage across cabinet switches.
- Analyst access remains read-only. No route-owned modal or confirmation overlay exists, so confirmation-focus lifecycle is not applicable.
- Shared request payload, query, cache invalidation, cabinet selection, authentication, and authorization behavior remain unchanged.

## Exact Feature Manifest

Feature commit `a3d232215fba2aa801200ed32a427b2631f5e950` contains exactly:

- `e2e/settings-pages.spec.ts`
- `src/app/(dashboard)/settings/cabinet/page.tsx`
- `src/app/(dashboard)/settings/cabinet/__tests__/page.test.tsx`
- `src/app/(dashboard)/settings/cabinet/__tests__/presentation-source-contracts.test.ts`
- `src/components/custom/settings/CabinetInfoCard.tsx`
- `src/components/custom/settings/JamStatusBadge.tsx`
- `src/components/custom/settings/SellerRatingCard.tsx`
- `src/components/custom/settings/TargetMarginSettingsCard.tsx`
- `src/components/custom/settings/__tests__/CabinetInfoCard.test.tsx`
- `src/components/custom/settings/__tests__/JamStatusBadge.test.tsx`
- `src/components/custom/settings/__tests__/SellerRatingCard.test.tsx`
- `src/components/custom/settings/__tests__/TargetMarginSettingsCard.test.tsx`

Diff: 12 files, +852/−153. No shared primitive, foundation token, PageHeader/ContextBar implementation, AppShell, settings shell, navigation, API, hook, type, store, role-permission, dependency, lockfile, or backend file was included.

## Behavior Lock and Validation

Pinned runtime: Node `24.18.0`, npm `11.11.0`.

- Focused Story Vitest: 6 files, 49 passed.
- Full Vitest: 1,234 files, 19,589 passed, 0 failed, 0 skipped. An earlier sandboxed run exposed only a prohibited listener bind and one load-sensitive polling flake; both passed separately, and the final unrestricted full corpus passed in one run.
- Cabinet Playwright block: 24 passed and 1 optional Manager authentication-setup skip, 0 failed.
- Browser coverage includes both themes at 320, 390, 768, 1024, 1280, and 1440 CSS pixels; loaded long Russian seller evidence; axe at 390 and 1280; keyboard-only editing; reduced motion; a 200% CSS-zoom reflow proxy; successful save; invalid input with zero PUTs; and exactly one cabinet `h1`.
- The E2E fixture matches exact cabinet paths, permits only GET on recognized nested endpoints, rejects unknown paths and methods, and accepts only the exact PUT body `{ target_margin_pct: 35 }`.
- Loaded-state barriers wait for the seller heading, target-margin input, and deterministic long seller value after every theme reload before responsive, zoom, or axe assertions can run.
- Full source ESLint, targeted E2E ESLint, TypeScript, exact-manifest Prettier, `check:max-lines`, `check:next-params`, all three E2E static guards, `check:locale-percent`, and `git diff --check` passed.
- Turbopack and webpack production builds both generated 70/70 pages.
- Repository-wide `format:check` remains red on 38 unchanged baseline files; no Story 173.3 file is affected.
- `check:privacy` remains red on two unchanged lines in `e2e/price-calculator-visual.spec.ts`; Story 173.3 does not touch that file or expand the privacy baseline.
- After E2E, the Story `.env.e2e`, `e2e/.auth/user.json`, `test-results`, `playwright-report`, screenshots, traces, and videos were absent. Credential or auth-state contents were never read or printed.

## Visual and Accessibility Evidence

- Deterministic browser assertions prove loaded-content reflow, light/dark rendering, main-region axe results, keyboard save interaction, reduced-motion behavior, validation association, and the zoom proxy.
- Stable route identity, semantic heading hierarchy, decorative icons, non-color status text, busy state, input descriptions/errors, and polite save announcements are locked by route/component tests and source-contract guards.
- No retained screenshot, trace, or video is claimed.
- CSS zoom is an explicit reflow proxy, not real browser-UI zoom evidence.
- Real VoiceOver, NVDA, JAWS, and TalkBack evidence remains an explicit Story 174.3 carry-out.

## Independent Review Disposition

- Independent behavior/code review: `APPROVE`, zero unresolved findings after the stale save-feedback lifecycle defect was repaired and regression-locked.
- Independent evidence review initially requested changes because responsive/axe assertions could run on the loading skeleton and the cabinet fixture was too broad.
- The accepted repair added a non-vacuous loaded-state barrier, exact full-path routing, GET-only nested endpoints, fail-closed unknown requests, and exact single-key PUT validation.
- Independent final verification of that repair: `APPROVE`, zero findings. Fresh targeted E2E ESLint and `git diff --check` passed.
- No unresolved product, accessibility, authorization, security, scope, or test blocker remains.

## Lifecycle

- Feature PR: #335, `https://github.com/salacoste/wb-erp-system-daytona-FE/pull/335`.
- Feature head: `a3d232215fba2aa801200ed32a427b2631f5e950`.
- Feature merge: `5ce9935ef4abf90b2ec6db8cde7bdd3cc8e54d44`.
- PR base/head, one-commit history, mergeability, and the exact 12-file manifest were verified before normal merge.
- The product merge is present on refreshed `origin/main`.
- Documentation closeout PR: #336, `https://github.com/salacoste/wb-erp-system-daytona-FE/pull/336`.
- Documentation closeout head: `8a55117382d7662f44124e7eea5687f62153119c`.
- Documentation closeout merge: `3e04ccd23148b997f7bb335e3ac38585f06ba151`.
- After PR #336 merged, primary `main` was fast-forwarded to `3e04ccd2` and proved equal to refreshed `origin/main` with 0/0 divergence.
- The exact product and initial documentation remote branches, local branches, worktrees, paths, and stale registrations were proved absent. No Story PR remained open before the auxiliary lifecycle-record PR was published.
- The auxiliary lifecycle-record branch/worktree exists only to publish these already-proved facts and is cleaned after its own merge; no recursive self-merge claim is made.
- No deploy, production operation, direct push to `main`, force-push, dependency change, credential output, route-ledger transition, or unrelated debt fix occurred.

## Lessons and Carry-Outs

- A stable page heading is not a loaded-content barrier; responsive and axe evidence must wait for Story-owned loaded markers after reload.
- E2E API fixtures must fail closed on full path, method, and canonical mutation-body shape or they can conceal contract drift.
- A persistent live region needs an explicit lifecycle: clear stale success/failure feedback on edit, invalid submit, and cabinet ownership change.
- Unknown Jam tiers remain non-actionable until the shared contract recognizes them; presentation must not infer upgrade eligibility.
- Real screen-reader evidence, real browser-UI zoom, and retained visual artifacts remain explicit Story 174.3 carry-outs. SEC-DOC-1 and unknown backfill-status coercion remain unchanged and outside this Story's scope.

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-29 | Story 173.3 implemented, validated, independently reviewed, merged through feature PR #335, closed through documentation PR #336, and cleaned; auxiliary lifecycle evidence published. **Lessons:** (1) Wait for loaded content after reload. (2) Fail closed in API fixtures. (3) Reset live feedback across edits and cabinet ownership changes. |

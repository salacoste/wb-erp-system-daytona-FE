# Story 173.11-FE: Migrate SKU Packaging

Status: done — feature PR #359 merged (`b1772e48` + review-fix `e484c30f`, merge `137e2ee5`); exact product branch/worktree/path/open-PR cleanup proved; documentation closeout active; Story-owned 24-file feature manifest; focused Story **10 files / 112 tests** plus immutable hook/API contracts **3 files / 23 tests**; seven deterministic Story Playwright scenarios statically discovered; production build **70/70**; the recorded full-suite floor remains **19,733/0/1,249** from Story 173.9 because Story 173.11 did not run a fresh full-suite snapshot; credential-dependent browser execution was unavailable because `.env.e2e` was absent; final exact-head product review has zero unresolved material findings; route-ledger rows intentionally remain `planned` until Story 174.5.

Program snapshot: **87/94** canonical Stories complete; Epic 173 is **11/13**; NEXT is Story 173.12 only after this Story 173.11 documentation lifecycle merges and cleans.

## Story

As a fulfillment administrator, I want `/shipments/sku-packaging` to expose truthful packaging mappings and safe single/bulk maintenance so that SKU-to-box relationships remain understandable and recoverable across wide, narrow, keyboard, and assistive-technology workflows.

Requirement: FR27. Authoritative plan: `.omx/plans/173.11-migrate-sku-packaging.md`.

## Prerequisites and Base

- Product base: `7ee1f51ec07bdeb70253714e1b11a8182f06f59b`, the Story 173.10 auxiliary lifecycle merge.
- Epic 166 foundation, Story 167.1 AppShell, Story 173.8 shipment-list/status owner, Story 173.10 box-type owner, and the separate ContextBar accessibility hotfix PR #331 were reachable from the base.
- Product branch: `cdx/epic-173-story-11-sku-packaging`.
- Product worktree: `/private/tmp/wb-repricer-fe-173-11-sku-packaging`.
- Documentation closeout branch: `cdx/docs-story-173-11-closeout`.
- Documentation closeout worktree: `/private/tmp/wb-repricer-docs-story-173-11-closeout`.
- Documentation closeout base: product merge `137e2ee5794a534632b5fb9a6e277318b368677c`.
- Shipment APIs, hooks, query/cache keys, request contracts, authorization, shared shipment owners, generic primitives, package metadata, and route-ledger rows were reused without contract changes.

## Delivered Behavior

- The route uses `PageHeader` and semantic `PageState` loading, dependency failure/retry, empty, local filtered-empty/reset, and populated branches while retaining stable route identity.
- `useSkuPackaging()` remains unparameterized and `useBoxTypes()` retains default active-only semantics; URLs, query keys, invalidation, APIs, types, and normalizers are unchanged.
- Product and box-type dependency failures are explicit and retryable. Failed data is never relabeled as an empty search result, inactive mapping, or successful state.
- The named `ResponsiveTable` wide projection and deliberate stacked-detail narrow cards preserve SKU, package, units, status, and actions. Narrow layouts at 320px and 390px are locked by deterministic browser scenarios without page overflow.
- Mapping status remains non-color-only and distinguishes active, inactive, incomplete, and embedded product-identity mismatch states. Explicit `шт.` units remain visible in tables, cards, previews, and results.
- Create/edit/delete actions retain visible Russian labels, entity-specific accessible names, and 44px minimum targets. Dialogs and popovers are viewport-bounded.
- Single upsert remains `{ nmId, boxTypeId, unitsPerBox }`; bulk remains `{ items: [{ nmId, boxTypeId, unitsPerBox }] }`; delete remains numeric `nmId`.
- Full-string positive-integer validation, an error summary, field associations, persistent help, and first-invalid-control focus prevent partial or misleading input acceptance.
- Synchronous in-flight guards suppress rapid duplicate single, bulk, and delete mutation activation before React can render pending state.
- Cancellation returns focus to the exact invoking trigger; successful mutations move focus to a stable route target when the original trigger disappears.
- Persistent route-level announcements survive dialog teardown for create, edit, delete, and bulk completion. Bulk terminal counts derive from the reconciled result model, including locally rejected rows.
- HTTP 409 copy truthfully covers both documented causes—an existing binding or an inactive box type—without exposing raw backend text. Transport and per-row failures use bounded Russian messages.
- The explicit cancel action remains available during box-type loading or failure and is disabled only while a mutation is actually pending.
- `SkuPackagingFormFields` separates the form field group from mutation/focus orchestration; all production files pass the 200-line source cap without a lint waiver.

## Exact Feature Manifest

Feature commits `b1772e48e0d743ce1254d9b474c73bd5672fd454` and `e484c30f980f2378467b9325140bcf6b9cebc8c2` contain exactly:

- `e2e/sku-packaging-page.spec.ts`
- `src/app/(dashboard)/shipments/sku-packaging/__tests__/page.test.tsx`
- `src/app/(dashboard)/shipments/sku-packaging/__tests__/sku-packaging-presentation-source-contracts.test.ts`
- `src/app/(dashboard)/shipments/sku-packaging/__tests__/useSkuPackagingPageState.test.tsx`
- `src/app/(dashboard)/shipments/sku-packaging/page.tsx`
- `src/app/(dashboard)/shipments/sku-packaging/useSkuPackagingPageState.ts`
- `src/components/custom/sku-packaging/BoxTypeSelect.tsx`
- `src/components/custom/sku-packaging/BulkAddDialog.tsx`
- `src/components/custom/sku-packaging/BulkPreviewTable.tsx`
- `src/components/custom/sku-packaging/SkuPackagingDeleteDialog.tsx`
- `src/components/custom/sku-packaging/SkuPackagingEmptyState.tsx`
- `src/components/custom/sku-packaging/SkuPackagingFilterToolbar.tsx`
- `src/components/custom/sku-packaging/SkuPackagingFormDialog.tsx`
- `src/components/custom/sku-packaging/SkuPackagingFormFields.tsx`
- `src/components/custom/sku-packaging/SkuPackagingProductCombobox.tsx`
- `src/components/custom/sku-packaging/SkuPackagingTable.tsx`
- `src/components/custom/sku-packaging/__tests__/BulkAddDialog.test.tsx`
- `src/components/custom/sku-packaging/__tests__/SkuPackagingDeleteDialog.test.tsx`
- `src/components/custom/sku-packaging/__tests__/SkuPackagingFormDialog.test.tsx`
- `src/components/custom/sku-packaging/__tests__/SkuPackagingTable.test.tsx`
- `src/components/custom/sku-packaging/index.ts`
- `src/components/custom/sku-packaging/sku-packaging-bulk-utils.ts`
- `src/components/custom/sku-packaging/sku-packaging-columns.ts`
- `src/components/custom/sku-packaging/useSkuPackagingDialogFocus.ts`

Diff: 24 files, +2,528/−567. No package/lockfile, shared `ProductCombobox`, shipment API/hook/type/query, shared owner, product/UI foundation, route registry, route-ledger, backend, deploy, or production-operation change was included.

## Behavior Lock and Validation

Pinned runtime: Node `24.18.0`, npm `11.11.0`.

- Final focused Story validation passed: 10 files, 112/112 tests.
- Immutable hook/API contract validation passed separately: 3 files, 23/23 tests.
- Full ESLint passed with zero warnings; TypeScript, `check:max-lines`, E2E assertion/fixed-wait/bare-skip guards, Prettier, staged/working diff checks, and exact manifest checks passed.
- Playwright static discovery found 11 total tests: four setup/auth dependencies and seven Story scenarios covering populated/filtered-empty state, exact upsert/bulk/delete transport, keyboard validation/focus, and 320px/390px narrow layouts.
- The final production build passed outside the restricted sandbox: compilation and TypeScript succeeded, 70/70 static pages were generated, and `/shipments/sku-packaging` was present.
- The sandboxed build attempt failed only because the restricted environment denied Turbopack process creation and local port binding; the authorized local rerun passed.
- Credentialed Playwright execution did not run because `.env.e2e` and the required local auth capability were absent. The configuration was not created or inspected, preflight was not bypassed, and no runtime browser/theme/contrast/axe PASS is claimed.
- Screenshots, traces, videos, reports, credentials, auth state, cookies, tokens, and test-result artifacts were not created or retained.
- The recorded full Vitest floor remains the fresh Story 173.9 snapshot: 1,249 files, 19,733 passed, 0 failed. Focused Story 173.11 counts are not added arithmetically to that floor.
- Repository-wide `check:docs` retains the inherited citation-baseline mismatch. This closeout does not modify the citation baseline or historical archive citations.

## Independent Review Disposition

- Two independent passes initially requested changes for product-identity mismatch truth, persistent announcements, bulk success focus, dependency failure handling, label associations, retained unit help, bounded backend copy, named bulk tables/scroll regions, delete conflict/fallback copy, filtered-reset focus, coherent bulk counts, deterministic E2E scope, bulk terminal error totals, 409 classification, cancel availability, and the form max-lines waiver.
- Every accepted finding was corrected with direct regressions. Shared API/hooks/types/query keys and generic UI remained unchanged.
- The exact-head reviewer rechecked the full `7ee1f51e..e484c30f` range: 24 Story-owned files, two commits, zero blocking or material correctness/accessibility/security/contract/regression findings, exact scope PASS, recommendation APPROVE.
- Browser/theme/axe/real-screen-reader execution remains an explicit Story 174.3/174.4 carry-out because credentialed local browser capability was unavailable and raw visual artifacts are prohibited.
- Final disposition: no unresolved product P0/P1/P2 finding; exact 24-file manifest PASS; forbidden files unchanged PASS; query/mutation contracts PASS; final recommendation APPROVE.

## Lifecycle

- Feature PR: #359, `https://github.com/salacoste/wb-erp-system-daytona-FE/pull/359`.
- Feature heads: `b1772e48e0d743ce1254d9b474c73bd5672fd454`, then review-fix `e484c30f980f2378467b9325140bcf6b9cebc8c2`.
- Feature merge: `137e2ee5794a534632b5fb9a6e277318b368677c`.
- PR #359 base `main`, exact head branch and `headRefOid`, two-commit/24-file identity, title, state, and `MERGEABLE/CLEAN` status were verified before merge. Merge was protected against exact head `e484c30f` and produced a merge commit.
- After merge, the feature head was proved reachable from refreshed `origin/main`; primary `main` was fast-forwarded and proved equal to `origin/main` at `137e2ee5` with 0/0 divergence.
- The product remote branch, local branch, worktree, path, stale registration, and open PR residue were removed; the recoverable audit quarantine remained present.
- This initial documentation lane records the merged product and already-proved product cleanup. Its own future PR number, head, merge, primary fast-forward, and cleanup are unknown until they happen and are not recursively preclaimed.
- No deploy, production operation, direct push to `main`, force-push, dependency change, credential output, route-ledger transition, citation-baseline update, or unrelated debt fix occurred.

## Lessons and Carry-Outs

- Persistent announcements and visible summaries must derive from one terminal result model; backend-only counts can hide locally rejected work.
- HTTP status alone may encode multiple documented causes. When no stable structured reason exists, bounded copy must remain broad enough to be truthful.
- Dependency loading/failure blocks submit, not cancellation. Recovery controls must not trap the user in an overlay.
- Accessibility responsibilities do not justify bypassing architecture gates; extracting a cohesive field group preserved behavior while restoring the source cap.
- Static Playwright discovery is not browser execution. Deterministic transport/focus/responsive/theme/axe coverage remains an explicit 174.3/174.4 carry-out when credentialed capability becomes available.
- Story 173.12 retains supplies-list/shared-status ownership; Story 173.13 must remain detail-only and consume that owner after merge.

## Change Log

| Date       | Change                                                                                                                                                                                                                                                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 | Story 173.11 implemented, corrected through independent review, validated, merged through feature PR #359, product residue cleaned, and prepared for exact-five documentation closeout. **Lessons:** unify terminal truth; keep cancellation recoverable; use bounded conflict copy; do not waive architecture gates. |

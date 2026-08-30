# Story 173.8-FE: Migrate the Shipments List

Status: done — feature PR #350 merged (`66b9b6b6`, merge `65f73fed`); documentation closeout PR #351 merged (`a9cd76b7`, merge `4bda841f`); exact product and initial documentation branch/worktree/path/open-PR cleanup proved; only the auxiliary lifecycle-record lane remains; Story-owned 18-file feature manifest; fresh full floor **19,703/0/1,248**; focused Story **6 files / 50 tests**; Playwright static boundary **4/4**; credentialed browser execution explicitly unavailable because the required `.env.e2e` configuration was absent; webpack production build **70/70**; final independent product and initial documentation reviews have zero unresolved P0–P2 findings; route-ledger rows intentionally remain `planned` until Story 174.5.

## Story

As an operations user, I want `/shipments` to present shipment identity, lifecycle status, dates, actions, filters, pagination, empty/error/loading states, and creation controls through the shared shadcn/ui foundations so that the queue remains usable and truthful on desktop and narrow screens without changing shipment contracts.

Requirement: FR27. Authoritative plan: `.omx/plans/173.8-migrate-the-shipments-list.md`.

## Prerequisites and Base

- Product base: `34b2bedcdfa99a75c64f1394e13164d4799535d2`.
- Epic 166 foundation, Story 167.1 AppShell, Story 173.7 lifecycle closeout, and the separate ContextBar accessibility hotfix PR #331 were reachable from the base.
- Product branch: `cdx/epic-173-story-8-shipments`.
- Product worktree: `/private/tmp/wb-repricer-fe-173-8-shipments`.
- Documentation closeout branch: `cdx/docs-story-173-8-closeout`.
- Documentation closeout worktree: `/private/tmp/wb-repricer-fe-173-8-docs`.
- Documentation closeout base: product merge `65f73fed8438aed5bf2058a4ecad491622433a5c`.
- Shipment APIs, shared hooks, types, calculations, authorization, routes, detail/box-type/packaging surfaces, generic primitives, and route-ledger rows were reused without contract changes.

## Delivered Behavior

- `/shipments` composes the shared `PageHeader` and `PageState`, retaining route identity during initial loading, terminal error/retry, and background refresh.
- A background refresh failure keeps previously loaded rows visible, marks the retained data stale, and keeps the header busy state truthful.
- The list uses shared `FilterToolbar`, responsive table/header/sort/numeric-cell foundations, `TableState`, and `TablePagination` with accessible names and an explicit stacked-detail narrow strategy.
- Mobile queue cards retain shipment identity, lifecycle status, creation date, and the named detail action instead of dropping table meaning at narrow widths.
- Lifecycle status uses the shared `StatusBadge`: `DRAFT` maps to pending, `CONFIRMED` maps to success, and an unrecognized runtime value is surfaced as unknown with its raw source value.
- Null shipment names fall back to the shipment ID, pallet quantities preserve numeric precision, row actions are named, and the action column has an explicit heading.
- The filtered-empty state offers a direct reset while the unfiltered empty state preserves packaging prerequisites and Analyst read-only behavior.
- The create dialog preserves the established payload contract: fixed-vehicle mode sends `totalDeliveryCost`, per-pallet mode sends `palletRate`, the alternate field is omitted, and `createdBy` remains `user?.email ?? ''`.
- Successful creation resets, closes, navigates to `/shipments/:id`, and restores focus to the exact invoking action; pending state blocks cancel/close.
- The create form now has a named delivery-mode radiogroup, first-invalid-field focus, an announced submit failure, a live pending status, and a contained scrollable viewport.

## Exact Feature Manifest

Feature commit `66b9b6b68a18028acb5d0ff8360f0e96c7536a99` contains exactly:

- `e2e/shipments/shipments-list.spec.ts`
- `src/app/(dashboard)/shipments/__tests__/page.test.tsx`
- `src/app/(dashboard)/shipments/__tests__/shipments-presentation-source-contracts.test.ts`
- `src/app/(dashboard)/shipments/__tests__/useShipmentsPageState.test.ts`
- `src/app/(dashboard)/shipments/page.tsx`
- `src/app/(dashboard)/shipments/useShipmentsPageState.ts`
- `src/components/custom/shipments/CreateShipmentDialog.tsx`
- `src/components/custom/shipments/ShipmentFormFields.tsx`
- `src/components/custom/shipments/ShipmentQueueCards.tsx`
- `src/components/custom/shipments/ShipmentStatusBadge.tsx`
- `src/components/custom/shipments/ShipmentsEmptyState.tsx`
- `src/components/custom/shipments/ShipmentsFilterToolbar.tsx`
- `src/components/custom/shipments/ShipmentsPagination.tsx`
- `src/components/custom/shipments/ShipmentsTable.tsx`
- `src/components/custom/shipments/__tests__/CreateShipmentDialog.test.tsx`
- `src/components/custom/shipments/__tests__/ShipmentsEmptyState.test.tsx`
- `src/components/custom/shipments/__tests__/ShipmentsTable.test.tsx`
- `src/components/custom/shipments/shipments-columns.ts`

Diff: 18 files, +1,214/−386. No package/lockfile, shipment API/shared hook/type/calculation, authorization, generic primitive, product-composition implementation, route registry, route-ledger, shipment-detail, box-type, SKU-packaging-exclusive, backend, deploy, or production-operation change was included.

## Behavior Lock and Validation

Pinned runtime: Node `24.18.0`, npm `11.11.0` for the authoritative leader validation.

- Final focused Story validation: 6 files, 50/50 tests passed.
- Playwright static-boundary validation: 1 file, 4/4 tests passed.
- The first sandboxed full-suite attempt hit an environment-only local-listener `EPERM`; the unrestricted rerun then exposed four forbidden `unroute` calls in the new deterministic fixture. Those calls were removed, the static boundary was rerun green, and the final unrestricted suite passed completely: 1,248 files, 19,703 passed, 0 failed.
- The known non-failing jsdom `Not implemented: navigation (except hash changes)` diagnostic remained outside Story scope.
- Pinned-runtime lint, shipment-list ESLint with zero warnings, TypeScript, `check:max-lines`, and `git diff --check` passed.
- The authoritative webpack production build compiled, type-checked sequentially, generated 70/70 pages, and included `/shipments`.
- The default Turbopack build was unavailable only because the temporary worktree's ignored `node_modules` symlink resolves outside Turbopack's filesystem root. A concurrent build/type-check attempt also observed transient `.next/types` regeneration; the sequential post-build type-check passed.
- Browser E2E preflight could not list or execute the shipments list/a11y specs because `.env.e2e` lacked `E2E_BASE_URL`, `E2E_API_URL`, `E2E_TEST_EMAIL`, and `E2E_TEST_PASSWORD`. This is an explicit validation gap, not a pass.
- `.env.e2e`, authentication state, cookies, tokens, screenshots, traces, videos, reports, and test-result artifacts were not created or retained.
- Repository-wide `check:docs` reproduces the inherited citation-baseline gap: exit 1, 95 broken citations, one classified as new relative to the committed baseline, three classified as resolved, and 94 accepted baseline matches. This closeout does not modify the citation baseline or historical archive citations.

## Independent Review Disposition

- The first exact-snapshot review found one P1 and one P2: stale/false-green Playwright selectors and conditional no-op assertions, plus a self-filtering source-catalog guard. Both were repaired.
- The final deterministic Playwright fixture is installed before the first navigation, uses semantic status/loading/pagination locators, asserts exact non-zero counts, and avoids `unroute`, route fallback/continue/fetch, network-idle waits, and fixed waits.
- The final source-contract guard independently enumerates the Story-owned production candidates and retains a classification self-test proving a hypothetical `LegacyShipmentQueue.tsx` cannot bypass catalog equality.
- Independent final re-review covered exact product diff SHA-256 `6dddfb7210c3ea0d944625c951de89dd688d8b248731efb8b4b04d6702c70878`.
- Final disposition: P0 = 0, P1 = 0, P2 = 0; scope PASS; exact 18-file manifest PASS; forbidden files unchanged PASS; creation payload semantics PASS; static Playwright boundary PASS; recommendation APPROVE.
- Independent documentation review covered exact staged diff SHA-256 `d345f2a74f82d4bc2cdad0a563581211fda61ea6065203f1c2604db7fe88deb7` and approved P0 = 0, P1 = 0, P2 = 0; exact-five scope PASS; exact-hash stability PASS; 76-route parity PASS; premature-lifecycle-claims PASS.

## Lifecycle

- Feature PR: #350, `https://github.com/salacoste/wb-erp-system-daytona-FE/pull/350`.
- Feature head: `66b9b6b68a18028acb5d0ff8360f0e96c7536a99`.
- Feature merge: `65f73fed8438aed5bf2058a4ecad491622433a5c`.
- Base/head, one-commit topology, exact 18-file manifest, mergeability, clean merge state, and GitGuardian success were verified before merge; merge used exact-head protection against `66b9b6b68a18028acb5d0ff8360f0e96c7536a99`.
- Documentation closeout PR: #351, `https://github.com/salacoste/wb-erp-system-daytona-FE/pull/351`.
- Documentation closeout head: `a9cd76b78f65d70f1737b9fe932b55cdd0bcb9a1`.
- Documentation closeout merge: `4bda841f5a9bcaff55ac8541b1ebca2d4c6494dd`.
- PR #351 was verified at base `main`, exact head OID, one commit, five files, `MERGEABLE/CLEAN`, and GitGuardian success before exact-head-protected merge.
- After PR #351 merged, primary `main` was fast-forwarded and proved equal to refreshed `origin/main` at `4bda841f` with 0/0 divergence.
- The product and initial documentation remote branches, local branches, worktrees, paths, stale registrations, and open PRs were proved absent before the auxiliary lane began; only the primary worktree remained.
- The auxiliary lifecycle-record branch/worktree exists only to publish these already-proved facts. It makes no recursive claim about its own future PR, merge, primary fast-forward, or cleanup.
- No deploy, production operation, direct push to `main`, force-push, dependency change, credential output, route-ledger transition, ContextBar implementation change, citation-baseline update, or unrelated debt fix occurred.

## Lessons and Carry-Outs

- Deterministic E2E routing must be installed before the first navigation, and assertions must require exact non-zero observable outcomes.
- Static source catalogs must discover owned candidates independently; a list cannot validate itself.
- Responsive shipment presentation must retain identity, lifecycle, date, and action meaning rather than merely hide table columns.
- Status fallbacks must preserve unknown source provenance, and nullable business labels need stable identity fallbacks.
- Worktree filesystem constraints and generated `.next/types` concurrency must be separated from source regressions through the supported sequential webpack/type-check path.
- Browser preflight/discovery is not browser execution. Credential-dependent browser evidence remains an explicit gap.
- Shipment detail, box-type, and SKU-packaging presentation remain owned by Stories 173.9–173.11. Real screen-reader and real browser-UI zoom evidence remain Story 174.3 carry-outs.

## Change Log

| Date       | Change                                                                                                                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 | Story 173.8 implemented, validated, independently reviewed, merged through feature PR #350, and prepared for exact-five-file documentation closeout. **Lessons:** (1) Install E2E fixtures before navigation. (2) Make catalog guards independently discoverable. (3) Preserve complete mobile queue meaning.                            |
| 2026-08-30 | Documentation closeout PR #351 merged and exact product/initial-docs cleanup was proved; final docs review approved the frozen five-file snapshot. **Lessons:** (1) Freeze continuation routing only after stale-state repair. (2) Separate static-boundary evidence from browser execution. (3) Publish cleanup facts only after proof. |

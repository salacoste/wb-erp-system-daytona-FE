# Story 173.10-FE: Migrate Shipment Box Types

Status: done — feature PR #356 merged (`cece1693`, merge `9e4f6254`) and exact-five documentation PR #357 merged (`40934bda`, merge `ebba17a5`); exact product and initial documentation branch/worktree/path/open-PR cleanup proved; only the auxiliary lifecycle record remains; Story-owned 17-file feature manifest; focused Story **7 files / 89 tests** plus Playwright static boundary **4/4**; production build **70/70**; the recorded full-suite floor remains **19,733/0/1,249** from Story 173.9 because Story 173.10 did not run a fresh full-suite snapshot; credential-dependent browser execution was unavailable because `.env.e2e` was absent; final product and documentation reviews have zero unresolved P0–P2 findings; route-ledger rows intentionally remain `planned` until Story 174.5.

## Story

As a fulfillment administrator, I want `/shipments/box-types` to provide consistent box-type CRUD so that I can maintain dimensions and activation state safely through the shared shadcn/ui foundations without changing shipment contracts.

Requirement: FR27. Authoritative plan: `.omx/plans/173.10-migrate-shipment-box-types.md`.

## Prerequisites and Base

- Product base: `6cfa782dc2acad2ad89e7515c410ed4729319cae`, the Story 173.9 auxiliary lifecycle merge.
- Epic 166 foundation, Story 167.1 AppShell, Story 173.8 shipment-list/status owner, Story 173.9 detail route, and the separate ContextBar accessibility hotfix PR #331 were reachable from the base.
- Product branch: `cdx/epic-173-story-10-box-types`.
- Product worktree: `/private/tmp/wb-repricer-fe-173-10-box-types`.
- Documentation closeout branch: `cdx/docs-story-173-10-closeout`.
- Documentation closeout worktree: `/private/tmp/wb-repricer-docs-story-173-10-closeout`.
- Documentation closeout base: product merge `9e4f62542d0c2e83eb7b70d93a3795e3c1d1688a`.
- Auxiliary lifecycle branch: `cdx/docs-story-173-10-final-lifecycle-record`.
- Auxiliary lifecycle worktree: `/private/tmp/wb-repricer-docs-story-173-10-final-lifecycle-record`.
- Auxiliary lifecycle base: documentation merge `ebba17a580f071d47e1df5b5fd179e2ce22fcd78`.
- Shipment APIs, hooks, types, query/cache keys, mutation payloads, authorization, shared shipment-owner components, generic primitives, and route-ledger rows were reused without contract changes.

## Delivered Behavior

- The route uses `PageHeader` and semantic `PageState` loading, error/retry, empty, and populated branches while retaining a stable route identity.
- The header create action is absent from terminal loading/error states. Retry calls `refetch()` once, disables during fetching, and announces `Повторяем...`; raw backend terminal messages are not echoed.
- `useBoxTypes()` remains active-only (`includeInactive=false`), preserving the Story 75.2 behavior in which a deactivated item disappears after invalidation/refetch.
- The `ResponsiveTable` wide projection and deliberate stacked-detail narrow cards preserve box name, dimensions, volume, activation state, and actions with visible `см` and `см³` units and tabular numerals.
- Status remains non-color-only through `Активен` / `Неактивен`. The inactive fixture is a defensive presentation lock and exposes edit only; deactivation is absent.
- Edit and deactivate actions retain visible Russian labels, entity-specific accessible names, and `min-h-11` touch targets. Both projections use vertical `w-full min-w-0` stacks, proven against production CSS at 320px and 768px without card/cell overflow or status overlap.
- Create/edit/deactivate dialogs return focus to the exact visible trigger after cancellation and to a stable route target after successful creation/deactivation removes the original trigger. CSS-hidden duplicate triggers are rejected after breakpoint changes.
- Forms focus the first invalid field, preserve duplicate-name feedback, announce pending work with `role=status`, announce failures with `role=alert`, keep generic failures recoverable in-place, and prevent pending cancellation.
- Synchronous in-flight guards suppress rapid duplicate form and deactivation submissions before React can render mutation pending state.
- Deactivation preserves the binding-conflict message, isolates errors by entity, clears a prior error when the same entity is closed and reopened, and calls the AlertDialog close callback exactly once.
- Dialogs are viewport-bounded and scrollable; dimension fields reflow without changing established validation, payload, or unit semantics.

## Exact Feature Manifest

Feature commit `cece1693df92be3e1dffe5fc85d000983e945501` contains exactly:

- `src/app/(dashboard)/shipments/box-types/__tests__/box-types-presentation-source-contracts.test.ts`
- `src/app/(dashboard)/shipments/box-types/__tests__/page.test.tsx`
- `src/app/(dashboard)/shipments/box-types/__tests__/useBoxTypesPageState.test.tsx`
- `src/app/(dashboard)/shipments/box-types/page.tsx`
- `src/app/(dashboard)/shipments/box-types/useBoxTypesPageState.ts`
- `src/components/custom/box-types/BoxTypeDeactivateDialog.tsx`
- `src/components/custom/box-types/BoxTypeFormDialog.tsx`
- `src/components/custom/box-types/BoxTypesEmptyState.tsx`
- `src/components/custom/box-types/BoxTypesTable.tsx`
- `src/components/custom/box-types/DimensionField.tsx`
- `src/components/custom/box-types/__tests__/BoxTypeDeactivateDialog.test.tsx`
- `src/components/custom/box-types/__tests__/BoxTypeFormDialog.test.tsx`
- `src/components/custom/box-types/__tests__/BoxTypesEmptyState.test.tsx`
- `src/components/custom/box-types/__tests__/BoxTypesTable.test.tsx`
- `src/components/custom/box-types/box-types-columns.ts`
- `src/components/custom/box-types/boxTypeFormValidation.ts`
- `src/components/custom/box-types/useBoxTypeDialogFocus.ts`

Diff: 17 files, +1,370/−141. The final staged patch hash before commit was `e571f7c7fa4d3e84ced26a8e3b511699d4d134bd`. No package/lockfile, E2E specification, shipment API/hook/type/query, shared owner, product/UI foundation, route registry, route-ledger, backend, deploy, or production-operation change was included.

## Behavior Lock and Validation

Pinned runtime: Node `24.18.0`, npm `11.11.0`.

- Final focused Story validation passed: 7 files, 89/89 tests.
- Playwright static transport boundary passed separately: 1 file, 4/4 tests. This proves guarded transport rules, not runtime route behavior.
- Full ESLint passed with zero warnings; TypeScript, `check:max-lines`, `check:next-params`, staged/working diff checks, and exact manifest checks passed.
- The final production build passed outside the restricted sandbox: compilation and TypeScript succeeded, 70/70 static pages were generated, and `/shipments/box-types` was present.
- The sandboxed build attempt had previously failed only because the restricted environment denied process creation and local port binding; the authorized local rerun passed, including after the final responsive repair.
- The required route E2E wrapper exited before Playwright because `.env.e2e` and its required configuration were absent. The configuration was not created, preflight was not bypassed, and no runtime browser/theme/contrast/reflow PASS is claimed.
- Screenshots, traces, videos, reports, credentials, auth state, cookies, tokens, and test-result artifacts were not created or retained.
- The recorded full Vitest floor remains the fresh Story 173.9 snapshot: 1,249 files, 19,733 passed, 0 failed. Focused Story 173.10 counts are not added arithmetically to that floor.
- Repository-wide `check:docs` retains the inherited citation-baseline mismatch. This closeout does not modify the citation baseline or historical archive citations.

## Independent Review Disposition

- Fresh blind and edge passes found and closed focus fallback for the disappearing empty-state trigger and deactivated row, CSS-hidden duplicate trigger selection, stale cross-entity deactivation feedback, rapid double mutation activation, terminal-error header actions, retry fetching state, and projection-specific assertions.
- The acceptance audit found a P2 mobile action defect: 36×36 icon-only controls lacked visible discovery. Both projections now retain visible Russian action labels and 44px minimum targets; the focused closure audit returned PASS.
- The stabilized-diff reviewer found a same-entity stale 409 on reopen and a responsive overlap caused by the two long actions sharing one row. The dialog now clears the error on entity/null transitions, and both action projections use a vertical full-width stack.
- The reviewer measured the final production CSS: at 320px both buttons remained inside the 252px card action region; at 768px both remained inside the action cell with no overlap into the status cell and no internal text overflow.
- The browser reviewer also noted that the existing E2E target can pass a broad terminal state and does not prove CRUD/focus/responsive integration. Because the mandatory credentialed environment was unavailable and E2E was outside the frozen product manifest, this remains an explicit Story 174.3/174.4 evidence carry-out rather than an invented PASS or an out-of-scope test rewrite.
- Findings that required recursive source catalogs, active-including shared-hook behavior, declarative-contract rejection, or terminal backend error taxonomy changes were dispositioned as out of scope or contrary to established contracts.
- Final disposition: no unresolved product P0/P1/P2 finding; exact 17-file manifest PASS; forbidden files unchanged PASS; active-only/query/mutation contracts PASS; final recommendation APPROVE.

## Lifecycle

- Feature PR: #356, `https://github.com/salacoste/wb-erp-system-daytona-FE/pull/356`.
- Feature head: `cece1693df92be3e1dffe5fc85d000983e945501`.
- Feature merge: `9e4f62542d0c2e83eb7b70d93a3795e3c1d1688a`.
- PR #356 base `main`, exact head branch and `headRefOid`, title, state, and `MERGEABLE/CLEAN` identity were verified before merge. Merge used the exact reviewed head and produced a merge commit.
- After merge, the feature head was proved reachable from refreshed `origin/main`; primary `main` was fast-forwarded and proved equal to `origin/main` at `9e4f6254` with 0/0 divergence.
- The product remote branch, local branch, worktree, path, stale registration, and open PR residue were proved absent. The recoverable audit quarantine remained present.
- Initial documentation PR: #357, `https://github.com/salacoste/wb-erp-system-daytona-FE/pull/357`.
- Initial documentation head: `40934bdab93b808e415ce9d1369a10ec18181625`.
- Initial documentation merge: `ebba17a580f071d47e1df5b5fd179e2ce22fcd78`.
- PR #357 had exact base/head identity, one commit, exactly the five canonical tracking files, and `MERGEABLE/CLEAN`; merge was protected against the exact reviewed head. Its frozen staged SHA-256 `5352b2e3e52f29d77e84bf9cc80ee475f733e8f79308328fd3af0e41217c3d94` received independent APPROVE with no actionable finding and zero secret-bearing added lines.
- After PR #357 merged, the documentation head was proved reachable from refreshed `origin/main`; primary `main` was fast-forwarded and proved equal to `origin/main` at `ebba17a5` with 0/0 divergence.
- The product and initial-documentation remote branches, local branches, worktrees, paths, stale registrations, and open PR residue were proved absent before this auxiliary lane began; the recoverable audit quarantine remained present.
- This auxiliary lifecycle record publishes those already-proved facts. Its own future PR number, head, merge, primary fast-forward, and cleanup are unknown until they happen and are not recursively preclaimed.
- No deploy, production operation, direct push to `main`, force-push, dependency change, credential output, route-ledger transition, citation-baseline update, or unrelated debt fix occurred.

## Lessons and Carry-Outs

- Responsive duplication needs projection-specific behavior locks and real production-CSS containment evidence; shared action markup can still require layout-aware constraints.
- A 44px target does not make an action discoverable by itself. Visible labels or an established tooltip remain necessary for sighted users.
- Controlled dialog feedback must clear across close/reopen even when the entity identity is unchanged.
- Focus return must reject connected elements that are hidden only by responsive ancestors.
- Active-only query semantics are intentional here. The inactive fixture is defensive presentation coverage, not authority to change a shared hook contract.
- Static Playwright boundary tests are not browser execution. Deterministic CRUD/focus/responsive/theme/axe coverage remains an explicit 174.3/174.4 carry-out when the credentialed environment becomes available.
- Story 173.11 may consume the merged box-type presentation contract but must preserve its own packaging ownership boundary. Stories 173.12–173.13 retain supplies ownership.

## Change Log

| Date       | Change                                                                                                                                                                                                                                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 | Story 173.10 implemented, validated, independently reviewed, merged through feature PR #356, and prepared for exact-five documentation closeout. **Lessons:** (1) Measure both responsive projections. (2) Clear same-entity dialog errors. (3) Preserve active-only semantics unless shared-hook ownership authorizes a change. |
| 2026-08-30 | Initial exact-five documentation closeout merged through PR #357 and exact product plus initial-docs cleanup was proved; only the auxiliary lifecycle record remains.                                                                                                                                                            |

# Story 173.9-FE: Migrate Shipment Detail

Status: done — feature PR #353 merged (`5f6bb615`, merge `069c9645`); exact product branch/worktree/path/open-PR cleanup proved; only the exact-five-file initial documentation closeout and its auxiliary lifecycle record remain; Story-owned 24-file feature manifest; fresh full floor **19,733/0/1,249**; focused Story **19 files / 192 tests** plus Playwright static boundary **4/4**; webpack production build **70/70**; credentialed browser execution explicitly unavailable because the required `.env.e2e` and auth state were absent; final independent review has zero unresolved P0–P2 findings; route-ledger rows intentionally remain `planned` until Story 174.5.

## Story

As an operations user, I want `/shipments/[id]` to present shipment identity, lifecycle context, pallets, product rows, calculation evidence, validation and actions through the shared shadcn/ui foundations so that detail work remains truthful and keyboard-usable on desktop and narrow screens without changing shipment contracts.

Requirement: FR27. Authoritative plan: `.omx/plans/173.9-migrate-shipment-detail.md`.

## Prerequisites and Base

- Product base: `55e2149881c6a96e1bdb1d85f89f75cefeee356e`.
- Epic 166 foundation, Story 167.1 AppShell, Story 173.8 shipment-list/status owner, and the separate ContextBar accessibility hotfix PR #331 were reachable from the base.
- Product branch: `cdx/epic-173-story-9-shipment-detail`.
- Product worktree: `/private/tmp/wb-repricer-fe-173-9-shipment-detail`.
- Documentation closeout branch: `cdx/docs-story-173-9-closeout`.
- Documentation closeout worktree: `/private/tmp/wb-repricer-fe-173-9-docs-closeout`.
- Documentation closeout base: product merge `069c96458d3c2d708e91a9d1f57aa90ae6227b44`.
- Shipment APIs, hooks, types, calculations, query/cache keys, authorization, list-owned shipment components, generic primitives, and route-ledger rows were reused without contract changes.

## Delivered Behavior

- Loading, explicit 404, safe terminal error/retry, validation and retained partial-calculation states preserve route identity through `PageHeader` and `PageState`.
- The loaded header composes `PageHeader`, `ContextBar`, and the Story 173.8-owned `ShipmentStatusBadge`, including a stable `Отправка <id>` fallback when the optional name is absent.
- Pallet product rows and calculation results use named, focusable `ResponsiveTable` horizontal-scroll regions with tabular numeric presentation and contracts aligned to calculated/uncalculated and DRAFT/CONFIRMED DOM schemas.
- Calculation completeness is checked against expected product `nmId` coverage. Missing, empty, or subset results retain available evidence and expose a partial limitation; full coverage clears it.
- Persisted mixed calculated/uncalculated rows remain explicitly partial instead of presenting silent completion.
- Validation failure moves focus to the named validation summary; warning and success presentation use semantic status tokens.
- Shipment calculate/confirm/recalculate/delete, pallet add/remove, and box-line add/update/remove expose pending, success, and failure announcements without changing mutation payloads or navigation.
- Shipment and box-line dialogs focus the first invalid field, expose submit failure as an alert, expose pending save as a status, and return focus to the exact invoking trigger after Cancel, Escape, or success.
- Deterministic Playwright specifications cover loaded, loading, 404, partial, 320px containment, named wide-table focusability, and WCAG 2.2 AA axe intent without adding credential or artifact bypasses.

## Exact Feature Manifest

Feature commit `5f6bb615f69c8695330ba63e6731118be0eb3018` contains exactly:

- `e2e/shipments/shipments-detail.spec.ts`
- `src/app/(dashboard)/shipments/[id]/__tests__/page.test.tsx`
- `src/app/(dashboard)/shipments/[id]/__tests__/shipment-detail-presentation-source-contracts.test.ts`
- `src/app/(dashboard)/shipments/[id]/page.tsx`
- `src/components/custom/shipments/BoxLineForm.tsx`
- `src/components/custom/shipments/BoxLineFormFields.tsx`
- `src/components/custom/shipments/BoxLineTable.tsx`
- `src/components/custom/shipments/BoxLineTableRow.tsx`
- `src/components/custom/shipments/CalculationResults.tsx`
- `src/components/custom/shipments/PalletAccordion.tsx`
- `src/components/custom/shipments/ShipmentActions.tsx`
- `src/components/custom/shipments/ShipmentDetailHeader.tsx`
- `src/components/custom/shipments/ShipmentEditDialog.tsx`
- `src/components/custom/shipments/ValidationErrorItem.tsx`
- `src/components/custom/shipments/__tests__/BoxLineForm.test.tsx`
- `src/components/custom/shipments/__tests__/BoxLineTable.test.tsx`
- `src/components/custom/shipments/__tests__/CalculationResults.test.tsx`
- `src/components/custom/shipments/__tests__/PalletAccordion.test.tsx`
- `src/components/custom/shipments/__tests__/ShipmentActions-errors.test.tsx`
- `src/components/custom/shipments/__tests__/ShipmentActions.test.tsx`
- `src/components/custom/shipments/__tests__/ShipmentDetailHeader.test.tsx`
- `src/components/custom/shipments/__tests__/ShipmentEditDialog.test.tsx`
- `src/components/custom/shipments/__tests__/ValidationErrorItem.test.tsx`
- `src/components/custom/shipments/shipment-action-handlers.ts`

Diff: 24 files, +1,324/−171. No package/lockfile, shipment API/hook/type/calculation/query/auth, shared product/UI foundation, list-owned implementation, route registry, route-ledger, backend, deploy, or production-operation change was included.

## Behavior Lock and Validation

Pinned runtime: Node `24.18.0`, npm `11.11.0` for the authoritative leader validation.

- Final canonical focused Story validation: 19 files, 192/192 tests passed.
- Focused Story plus Playwright static boundary: 20 files, 196/196 tests passed.
- Final unrestricted full-suite rerun passed in one command: 1,249 files, 19,733 passed, 0 failed.
- The known non-failing jsdom `Not implemented: navigation (except hash changes)` diagnostic remained outside Story scope.
- Pinned-runtime ESLint with zero warnings, TypeScript, `check:max-lines`, and `git diff --check` passed; `BoxLineTable.tsx` remained within the source cap at 197/200 lines.
- The authoritative webpack production build compiled, type-checked, generated 70/70 pages, and included dynamic `/shipments/[id]`.
- Default Turbopack remained unavailable only because the temporary worktree's ignored `node_modules` symlink resolves outside Turbopack's filesystem root; the supported webpack fallback passed twice, including after the final review repair.
- Browser Playwright execution was not run because the standard project requires `E2E_BASE_URL`, a fresh preflight handshake, and credentialed `e2e/.auth/user.json` storage state. `--no-deps`, temporary configs, fake credentials, and setup bypasses were not used.
- `.env.e2e`, authentication state, cookies, tokens, screenshots, traces, videos, reports, and test-result artifacts were not created or retained.
- Repository-wide `check:docs` retains the inherited citation-baseline mismatch. This closeout does not modify the citation baseline or historical archive citations.

## Independent Review Disposition

- The first exact-snapshot review found two HIGH and two MEDIUM issues: incomplete pallet/box-line mutation feedback and focus lifecycle, empty/subset calculation results treated as complete, and table metadata order/conditional-schema drift.
- RED regressions were added for missing, empty, subset and full calculation coverage; pallet and box-line lifecycle announcements; first-invalid focus; failure alerts; pending statuses; and exact add/edit trigger focus return.
- The second review confirmed the three behavioral findings closed and found one remaining P2: `rowActions` metadata was still unconditional while the Actions DOM was DRAFT-only.
- The final repair made `boxLineTableContract(hasCalculated, isDraft)` align calculated columns and row actions with the actual DOM and added direct DRAFT/CONFIRMED contract regression.
- Independent final review covered exact product fingerprint `41d945d20b7a22ab9c24811c69525bdf4120f161cf2585b6c44e41c0d8a51553` with start/end equality and no reviewer mutations.
- Final disposition: P0 = 0, P1 = 0, P2 = 0; scope PASS; exact 24-file manifest PASS; forbidden files unchanged PASS; mutation/query/navigation contracts PASS; recommendation APPROVE.

## Lifecycle

- Feature PR: #353, `https://github.com/salacoste/wb-erp-system-daytona-FE/pull/353`.
- Feature head: `5f6bb615f69c8695330ba63e6731118be0eb3018`.
- Feature merge: `069c96458d3c2d708e91a9d1f57aa90ae6227b44`.
- Base/head, one-commit topology, exact 24-file manifest, `MERGEABLE/CLEAN`, and GitGuardian success were verified before merge; merge used exact-head protection against `5f6bb615f69c8695330ba63e6731118be0eb3018`.
- After merge, primary `main` was fast-forwarded and proved equal to refreshed `origin/main` at `069c9645` with 0/0 divergence.
- The product remote branch, local branch, worktree, path, stale registration, and open PR residue were proved absent before this documentation lane began; only the primary and active documentation worktrees remained.
- The initial documentation closeout branch/worktree exists only to publish the already-proved product lifecycle. Its future PR number, head, merge, primary fast-forward, and cleanup are unknown until they happen and are not preclaimed here.
- No deploy, production operation, direct push to `main`, force-push, dependency change, credential output, route-ledger transition, citation-baseline update, or unrelated debt fix occurred.

## Lessons and Carry-Outs

- Typed success envelopes still require completeness checks against expected entities; an array can be empty or partial while remaining structurally valid.
- Accessibility lifecycle ownership includes nested detail mutations, not only top-level route actions.
- Controlled dialogs must retain the exact invoking element and explicitly focus the first invalid control.
- Declarative table metadata must describe the actual conditional DOM schema for every lifecycle state.
- Route-local compatibility handling may preserve partial evidence, but the unused shipment calculation normalizer remains an API-boundary follow-up rather than Story 173.9 scope.
- Browser preflight/static-boundary evidence is not browser execution. Credential-dependent responsive/axe/browser evidence remains an explicit Story 174.3/174.4 carry-out.
- Shipment box types and SKU packaging remain owned by Stories 173.10 and 173.11; supplies remain owned by Stories 173.12 and 173.13.

## Change Log

| Date       | Change                                                                                                                                                                                                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 | Story 173.9 implemented, validated, independently reviewed, merged through feature PR #353, and prepared for exact-five-file documentation closeout. **Lessons:** (1) Prove calculation coverage, not array shape. (2) Cover nested mutation/focus lifecycles. (3) Keep conditional table contracts truthful. |

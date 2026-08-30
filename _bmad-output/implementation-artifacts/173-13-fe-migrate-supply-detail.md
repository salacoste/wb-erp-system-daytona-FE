# Story 173.13-FE: Migrate Supply Detail

Status: done — feature PR #365 merged as `2dfe56c1` from reviewed feature commit `8a9c074c`; exact product branch, remote ref, and worktree cleanup proved. This artifact records the product lifecycle and the exact-five documentation closeout candidate without preclaiming the documentation PR's own future merge or cleanup.

## Story

As a seller, I want the dynamic Supply Detail route to retain its business, API, navigation, document, picker, and mutation behavior while using the shared shadcn presentation system with truthful states, responsive evidence, accessible overlays, deterministic focus, and reliable announcements.

Authoritative plan: `.omx/plans/173.13-migrate-supply-detail.md`.

Product lane:

- branch: `cdx/epic-173-story-13-supply-detail`;
- worktree: `/private/tmp/wb-repricer-fe-173-13-supply-detail`;
- product base: `73ebb5f0`;
- feature commit: `8a9c074c5307e6b68c773b73e73419b710e88438`;
- feature PR: #365;
- merge: `2dfe56c1e159451eb048d8057f13ba6e0880c547`;
- merged atop `main` after supplemental documentation PR #364, with the reviewed feature head preserved as the second merge parent.

## Acceptance result

All Story-owned acceptance criteria are satisfied within the frozen 22-file production manifest:

- the route retains `PageHeader` identity and truthful loading, 404, 403, generic-error, missing-success-data, and partial-orders states;
- dynamic `useSupplyDetail(supplyId)`, `/supplies` recovery, `/orders?search=${order.orderId}` navigation, query keys, APIs, mutations, document visibility, picker limits, virtualization, and acceptance-act behavior are preserved;
- lifecycle meaning uses semantic tokens plus textual/non-color evidence;
- the orders table has a caption, semantic headers, a named action column, horizontal containment, row keyboard activation, and descendant-action isolation;
- order removal and supply closing remain mounted through pending and failure, close only after mutation success, and prevent Radix `AlertDialogAction` same-click auto-close;
- focus returns to the exact connected trigger, or to a connected table fallback when optimistic removal disconnects that trigger;
- route announcements alternate between two persistent live channels so repeated messages remain observable;
- refresh success/failure is announced only after `refetch()` settles;
- acceptance-act upload/download pending states and document-download results are announced;
- document download owns the API call, blob URL, temporary anchor, filename, click, cleanup, toast, and announcement, with link removal and `URL.revokeObjectURL` in `finally`.

## Scope and source contracts

The reviewed feature delta is exactly 30 files, `+1,156/−420`:

- 17 production files inside the frozen 22-file Story production manifest;
- 12 existing test files;
- 1 new source-contract test: `src/app/(dashboard)/supplies/[id]/__tests__/supply-detail-presentation-source-contracts.test.ts`.

The source-contract guard pins:

- the exact four route-owned plus eighteen detail-exclusive production files;
- immutability of Story 173.12 shared surfaces;
- absence of legacy palette classes and contextual hex colors;
- route identity, dynamic-ID, API, navigation, mutation, semantic-state, table, picker, virtualization, overlay-name, focus-return, and announcement contracts.

Story 173.12 shared-surface fingerprints remained unchanged:

- `SupplyStatusBadge.tsx`: `dad90d3de45a9f903fa99378391e78ac55cb703ccf14360a2436ec93939b5705`;
- `supplies/index.ts`: `41ca3c6affc652b3b5446fbf94f17f45976f1619397efa7690492c2da4fc9d14`;
- `supplies-list-presentation-source-contracts.test.ts`: `6feddfbaf67c9ac906977ef9f4b091facbebbc4a121bd4a5202a12ca1064a73a`.

## Validation evidence

Pinned runtime:

- Node.js `24.18.0`;
- npm `11.11.0`.

Fresh final evidence on the reviewed product head:

- focused Story floor: 22/22 files, 975/975 tests, 0 failed;
- full Vitest outside the listener-restricted sandbox: 1,255/1,255 files, 19,874/19,874 tests, 0 failed;
- TypeScript: pass;
- full ESLint with zero warnings: pass;
- `check:max-lines`: pass, source cap 200 and test cap 800;
- `check:next-params`, `check:e2e-assertions`, `check:e2e-waits`, and `check:e2e-bare-skips`: pass;
- targeted Prettier and `git diff --check`: pass;
- changed-file privacy scan: 30 files, 0 violations, 0 errors;
- webpack production build: pass, 70 static pages generated and `/supplies/[id]` remained dynamic.

The first sandboxed full run encountered only the known local-listener restriction in `historical-spp-server-lifecycle.test.ts` (`listen EPERM` on `0.0.0.0`). The approved out-of-sandbox rerun passed all 19,874 tests.

Credentialed Playwright execution did not start because `.env.e2e` was absent. No credential, token, cookie, browser storage state, screenshot, trace, video, or report was inspected or created.

## Independent review

Adversarial review found and drove repairs for:

- descendant Enter/Space navigation leakage;
- remove-order premature unmount and incomplete pending/focus lifecycle;
- refresh success announced before settlement;
- untested document-download ownership and cleanup;
- missing acceptance-act pending announcements;
- repeated live messages that did not guarantee a DOM update;
- stale route mock coverage;
- `CloseSupplyDialog` same-click Radix auto-close before the pending render.

After the accepted findings were repaired and affected gates rerun, the final independent general review returned `APPROVE` with zero actionable findings across all 30 files. The final accessibility review returned `APPROVE` with zero actionable findings; the final general exact-diff review also covered and approved the later close-dialog accessibility/focus delta.

## Lessons

1. Radix `AlertDialogAction` auto-closes in the confirmation click unless the user handler calls `event.preventDefault()`; a later pending render is too late.
2. Controlled mutation dialogs close from mutation success, remain open and retryable on failure, and preserve deterministic focus.
3. Optimistic removal can disconnect the exact trigger, so focus restoration needs a connected fallback.
4. Repeated live-region messages need alternating persistent channels or another deterministic DOM-update mechanism.
5. Blob URL and temporary-link cleanup belongs in `finally`.
6. Descendant keyboard events must not bubble into implicit row activation.

## Carry-outs

- Story 174.1: reconstruct parity and evidence for all 76 route-owning Stories; do not change route implementation state or mark ledger rows verified.
- Story 174.2: remove or migrate the dead legacy twin `SUPPLY_STATUS_CONFIG` in `src/types/supplies/helpers.ts`, which was outside Story 173.13 ownership.
- Story 174.3: obtain credentialed real-browser axe, light/dark theme, reflow, zoom, keyboard/focus, and real-screen-reader proof without retaining prohibited raw artifacts.
- Story 174.4: complete credentialed functional and backend-contract regression.
- Story 174.5: perform final route-ledger transitions to `verified` only after 174.2–174.4 evidence, then complete repository/documentation cleanup.

## Cleanup proof

After PR #365 merged:

- the feature head was proved merged into refreshed `origin/main`;
- primary `main` was fast-forwarded to `2dfe56c1` and matched `origin/main`;
- the product worktree was removed;
- the exact local product branch was deleted;
- the exact remote product branch was deleted;
- no product PR, branch, worktree, or remote-ref residue remained.

The route ledger is intentionally unchanged: all 76 rows remain `planned` until Story 174.5.

## Change log

| Date | Change |
| --- | --- |
| 2026-08-30 | Feature PR #365 merged reviewed commit `8a9c074c` as `2dfe56c1`; focused 975/975, full 19,874/19,874 across 1,255 files, production build 70 pages, and final reviews approved with zero actionable findings. Product branch, remote ref, and worktree cleanup proved. Epic 173 product implementation reached 13/13 and 76/76 route-owning Stories implemented; route-ledger rows remain `planned`. |
| 2026-08-31 | Exact-five documentation closeout candidate created, advancing current documentation truth to 89/94 complete and Program NEXT Story 174.1 without preclaiming this documentation lane's own future PR merge or cleanup. |

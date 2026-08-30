# Story 173.7-FE: Migrate Tax Settings

Status: done — feature PR #347 merged (`f0d1fa2e`, merge `7f9f046f`); documentation closeout PR #348 merged (`14edf30e`, merge `27577ca2`); exact product and initial documentation branch/worktree/path/open-PR cleanup proved; only the auxiliary lifecycle-record lane remains; Story-owned 11-file feature manifest; fresh full floor **19,688/0/1,246**; focused Story **5 files / 64 tests**; Playwright **99 tests discovered** in the settings-pages file, including **20 tax scenarios**, with browser execution explicitly unavailable because real `.env.e2e` configuration and credentials were absent; production build **70/70**; final independent product and documentation reviews have zero unresolved P0–P2 findings; route-ledger rows intentionally remain `planned` until Story 174.5.

## Story

As an Owner, I want `/settings/tax` to expose the saved tax system and VAT configuration truthfully and accessibly so that I can validate, save, retry, cancel, and review the financial consequence of leaving tax unconfigured without losing a draft or applying one cabinet's values to another cabinet.

Requirement: FR27. Authoritative plan: `.omx/plans/173.7-migrate-tax-settings.md`.

## Prerequisites and Base

- Product base: `6bad4f7492ed9264234870aeb51459fb6901c160`.
- Story 173.1 settings-shell prerequisite, merged foundation/AppShell, financial presentation foundation, and the separate ContextBar accessibility hotfix PR #331 were reachable from the base.
- Product branch: `cdx/epic-173-story-7-settings-tax`.
- Product worktree: `/private/tmp/wb-repricer-fe-173-7-settings-tax`.
- Documentation closeout branch: `cdx/docs-story-173-7-closeout`.
- Documentation closeout worktree: `/private/tmp/wb-repricer-fe-docs-173-7-closeout`.
- Documentation closeout base: product merge `7f9f046f608c411386c1d8a395fe167db317e3e0`.
- Shared settings shell, PageHeader, ContextBar, tax APIs, hooks, normalizers, cabinet types, calculations, query keys/cache behavior, authorization, and navigation were reused without contract changes.

## Delivered Behavior

- `/settings/tax` composes the shared `PageHeader` and `ContextBar` with one persistent route heading, breadcrumbs, a semantic description, a responsive `max-w-3xl` form container, and an accessible cabinet-resolution loading state.
- `ContextBar` maps real loading, refreshing, error, fresh, and partial query states without claiming unavailable data is current.
- A named native form exposes semantic validation, pending, success, failure, retry, cancel, and Analyst read-only states.
- Manual tax-rate validation accepts the inclusive `0–100` range and focuses the first invalid control deterministically.
- VAT payers must select one supported shared `VAT_RATES` value. Unsupported persisted numeric values such as `10` remain visible and truthful but cannot be sent until replaced.
- The exact existing payload contract remains: manual tax uses `Number(taxRate)`, non-manual tax uses `taxRate: null`, and non-VAT payers use `vatRate: 0` under backend contract BD-FE-004.
- Selecting no tax system opens a warning that explains profit will remain displayed before tax. Pending state blocks dismissal; failure preserves the exact payload for retry; success closes and restores focus.
- Same-cabinet query replacement preserves dirty, failed, and warning-aligned drafts while updating the server-backed Cancel baseline.
- The route keys the form by `cabinetId`, so dirty drafts, retries, warning state, validation, and focus cannot cross cabinet boundaries. Late callbacks from an unmounted cabinet stop before toast, state, or focus work.
- Every editable control and action is disabled while saving. Spinners honor reduced motion, status meaning uses semantic tokens, targets are at least 44px, and long labels/percentage controls reflow at narrow widths.

## Exact Feature Manifest

Feature commit `f0d1fa2eac87c2e452d445be84c8596c091b0510` contains exactly:

- `e2e/settings-pages.spec.ts`
- `src/app/(dashboard)/settings/tax/__tests__/page.test.tsx`
- `src/app/(dashboard)/settings/tax/__tests__/tax-presentation-source-contracts.test.ts`
- `src/app/(dashboard)/settings/tax/page.tsx`
- `src/components/custom/settings/TaxSettingsForm.tsx`
- `src/components/custom/settings/TaxSettingsFormStates.tsx`
- `src/components/custom/settings/TaxSettingsWarningDialog.tsx`
- `src/components/custom/settings/__tests__/TaxSettingsForm.story-173-7.test.tsx`
- `src/components/custom/settings/__tests__/TaxSettingsForm.test.tsx`
- `src/components/custom/settings/tax-settings-form-model.ts`
- `src/components/custom/settings/tax-settings-sections.tsx`

Diff: 11 files, +1,545/−244. No tax hook/API/normalizer/type/query-key/cache/calculation contract, settings shell/navigation/AppShell, shared UI primitive, product-composition implementation, dependency, lockfile, backend file, route registry, or route-ledger row was included.

## Behavior Lock and Validation

Pinned runtime: Node `24.18.0`, npm `11.11.0` for the authoritative leader validation.

- Final focused Story validation: 5 files, 64/64 tests passed.
- The first sandboxed full-suite run produced 1,245 passing files / 19,687 passing tests plus one environment-only `listen EPERM` failure in `src/test/historical-spp-server-lifecycle.test.ts`.
- The required unrestricted rerun passed completely: 1,246 files, 19,688 passed, 0 failed. The known non-failing jsdom `Not implemented: navigation (except hash changes)` diagnostic from `ProcessingStatus.tsx` remained outside Story scope.
- Pinned-runtime lint, TypeScript, `check:max-lines`, exact-manifest Prettier, `git diff --check`, and E2E bare-skip/fixed-wait guards passed.
- The final Turbopack production build compiled, passed TypeScript, generated 70/70 static pages, and included `/settings/tax`.
- Direct Playwright discovery with safe inert placeholder environment and `CI=1` found 99 tests in `e2e/settings-pages.spec.ts`, including 20 tax scenarios.
- Tax discovery covers exact keyboard PUT success, invalid-rate suppression and focus, no-tax confirmation, pending duplicate prevention and reduced motion, recoverable same-payload retry, light/dark widths 320/390/768/1024/1280/1440, 200% reflow, overflow, and axe evidence.
- Real browser execution was unavailable because the required local services and credentialed `.env.e2e` preflight values were absent. Discovery is not reported as browser execution.
- `.env.e2e`, authentication state, cookies, tokens, screenshots, traces, videos, reports, and test-result artifacts were not created or retained.
- Repository-wide `check:docs` reports the inherited 95-citation baseline mismatch: exit 1, 95 broken, one classified as new relative to the committed baseline, three resolved, and 94 accepted baseline matches. This closeout does not modify the archive citation baseline or historical archive citations.

## Independent Review Disposition

- The first exact-snapshot review found one P1 and three P2 findings: manual `7.5` draft loss on a reversible tax-system round trip, two new vacuous E2E sites, incomplete warning pending/failure/retry/focus evidence, and a false TDD-header claim. All were fixed.
- A later strict review found query-data replacement could overwrite dirty/failed drafts, unsupported numeric VAT could crash presentation or permit an invalid PUT, and the owned catalog guard was self-referential. All were fixed with direct regression evidence.
- The final strict external review found one P1 cabinet A→B isolation defect and one P2 route-catalog discovery bypass. The route now keys the form by cabinet, stale callbacks are mount-guarded, four direct cabinet-transition regressions pass, and owned route/component discovery is recursive.
- Independent final re-review covered exact product diff SHA-256 `3ef5d0b72c4b15d8078e68158a2a6b48fbdb207a30a7d360b332ddd4fdb154a3`.
- Final disposition: P0 = 0, P1 = 0, P2 = 0; scope PASS; exact 11-file manifest PASS; forbidden files unchanged PASS; payload semantics PASS; E2E static contract PASS; recommendation APPROVE.
- Before the initial docs snapshot was frozen, its stale next-Story checklist was corrected from Story 173.7 product bootstrap to the Story 173.8 shipments owner boundary.
- Independent documentation review covered exact staged diff SHA-256 `d48aaed2ea0908596ba5e363daf3b431ff6073c99b19beb0fafb9cff94313df8` and approved P0 = 0, P1 = 0, P2 = 0; exact-five scope PASS; 76-route parity PASS; premature-lifecycle-claims PASS.

## Lifecycle

- Feature PR: #347, `https://github.com/salacoste/wb-erp-system-daytona-FE/pull/347`.
- Feature head: `f0d1fa2eac87c2e452d445be84c8596c091b0510`.
- Feature merge: `7f9f046f608c411386c1d8a395fe167db317e3e0`.
- Base/head, mergeability, clean merge state, exact 11-file manifest, and GitGuardian pass were verified before merge; merge used exact-head protection against `f0d1fa2eac87c2e452d445be84c8596c091b0510`.
- Documentation closeout PR: #348, `https://github.com/salacoste/wb-erp-system-daytona-FE/pull/348`.
- Documentation closeout head: `14edf30ef952837803af505ddf0845d6ee4ddc17`.
- Documentation closeout merge: `27577ca21d3c308f806a6bf5888e6b5d044e5eff`.
- PR #348 was verified at base `main`, exact head OID, one commit, five files, `MERGEABLE/CLEAN`, and GitGuardian success before exact-head-protected merge.
- After PR #348 merged, primary `main` was fast-forwarded and proved equal to refreshed `origin/main` at `27577ca2` with 0/0 divergence.
- The product and initial documentation remote branches, local branches, worktrees, paths, stale registrations, and open PRs were proved absent before the auxiliary lane began; only the primary worktree remained.
- The auxiliary lifecycle-record branch/worktree exists only to publish these already-proved facts. It makes no recursive claim about its own future PR, merge, primary fast-forward, or cleanup.
- No deploy, production operation, direct push to `main`, force-push, dependency change, credential output, route-ledger transition, ContextBar implementation change, citation-baseline update, or unrelated debt fix occurred.

## Lessons and Carry-Outs

- Draft preservation must be scoped by entity identity: preserve same-cabinet refreshes, but reset all state when the active cabinet changes.
- In-flight callback guards must stop global announcements and focus work as well as component-local state after unmount.
- Persisted enum-like numeric values need runtime membership validation even when TypeScript narrows the write contract.
- Source-contract catalogs must discover their owned trees rather than validate only a manually maintained list.
- Browser discovery is useful scope evidence but is not browser execution. Service- and credential-dependent execution remains an explicit gap.
- Real screen-reader and real browser-UI zoom evidence remain Story 174.3 carry-outs. SEC-DOC-1, route-ledger transitions, and tax API/query/calculation contracts remain unchanged and outside this Story's scope.

## Change Log

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 | Story 173.7 implemented, validated, independently reviewed, merged through feature PR #347, and prepared for exact-five-file documentation closeout. **Lessons:** (1) Scope drafts by cabinet identity. (2) Validate persisted numeric catalogs at runtime. (3) Discover exact source catalogs recursively. |
| 2026-08-30 | Documentation closeout PR #348 merged and exact product/initial-docs cleanup was proved; final docs review approved the frozen five-file snapshot. **Lessons:** (1) Freeze continuation routing only after stale-state repair. (2) Separate discovery evidence from browser execution. (3) Publish cleanup facts only after proof. |

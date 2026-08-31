# Story 174.1-FE: Prove BMAD, Route-Ledger, and OMX Plan Parity

Status: done — feature commit `4c930a9d` merged through PR #369 as `360c9cb9`; primary `main` was fast-forwarded and the exact feature local/remote branch, worktree, path, stale registration, and open-PR residue are absent. Runtime UI and backend product code are unchanged; all 76 route-ledger rows remain `planned` until Story 174.5.

## Story

As the frontend owner, I want every migration Story, route, execution plan, lifecycle identity, and implementation record to have exact one-to-one traceability so that no surface is skipped, duplicated, orphaned, or assigned to the wrong repository.

Authoritative plan: `.omx/plans/174.1-prove-bmad-route-ledger-and-omx-plan-parity.md`.

## Prerequisites and Base

- Story 173.13 auxiliary lifecycle PR #367 merged as `3cc30b66bce748c56c5286054fe1707c0bb3617c`; that merge is reachable from this Story base and its exact auxiliary local/remote branch, worktree, path, stale registration, and open-PR residue were absent before Story 174.1 started.
- Unrelated documentation-only PR #368 then advanced `main` to the exact Story base `9d611369085a1e88783322a50f3c3a043cd25257` without changing migration planning or runtime source.
- Branch: `cdx/epic-174-story-1-plan-parity`.
- Worktree: `/private/tmp/wb-repricer-fe-174-1-plan-parity`.
- Story 174.1 owns no route and has no route-ledger row.

## Frozen Reviewed Manifest

The predeclared reviewed manifest was frozen before the first edit as exactly nine paths:

1. `.omx/plans/174.1-prove-bmad-route-ledger-and-omx-plan-parity.md`
2. `.omx/plans/shadcn-full-ui-migration-master.md`
3. `_bmad-output/implementation-artifacts/174-1-fe-prove-bmad-route-ledger-and-omx-plan-parity.md`
4. `_bmad-output/implementation-artifacts/sprint-status.yaml`
5. `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md`
6. `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`
7. `_bmad-output/planning-artifacts/shadcn-route-ledger.md`
8. `scripts/check-shadcn-migration-parity.mjs`
9. `scripts/__tests__/check-shadcn-migration-parity.test.mjs`

No runtime source, route implementation, package/dependency file, backend product file, browser artifact, or generated report file is allowed.

## Acceptance Criteria and Tasks

- [x] Preserve the missing-validator RED before implementation.
- [x] Parse all 94 canonical BMAD Story identities, titles, and twelve required delivery/evidence fields.
- [x] Parse all 94 numeric OMX plans without silently dropping malformed frontmatter.
- [x] Validate required plan fields, title parity, unique branch/worktree identities, repository contracts, and exact backend exceptions 167.8 and 169.14.
- [x] Validate missing, extra, duplicate, orphan, title, evidence, status, repository, prerequisite, route-entry, effective-route, artifact-link, and route-status defects with actionable identities.
- [x] Prove 76 source routes = 76 route-ledger rows = 76 unique route Stories, including App Router route-group normalization.
- [x] Resolve exactly one implementation artifact for every route-ledger Story.
- [x] Keep every route-ledger status `planned`; no partial implementation-state transition is allowed.
- [x] Emit one machine-readable report and one concise human summary from the same run and verified base SHA.
- [x] Complete universal local validation and all fresh-context adversarial review passes; record every accepted finding and rerun.
- [x] Freeze the final diff/cached manifest, commit, push, open/verify/merge the PR, and complete exact branch/worktree/ref cleanup without preclaiming future facts.

## RED and GREEN Evidence

Pinned runtime: Node.js `24.18.0`; npm `11.11.0`.

Honest RED before validator creation:

```text
$ /opt/homebrew/opt/node@24/bin/node scripts/check-shadcn-migration-parity.mjs
MODULE_NOT_FOUND
scripts/check-shadcn-migration-parity.mjs did not exist
exit 1
Node.js v24.18.0
```

Current canonical GREEN:

```text
94 BMAD Stories = 94 OMX plans
76 source routes = 76 route-ledger rows = 76 route Stories
Epic counts = 166:8, 167:9, 168:11, 169:15, 170:7, 171:9, 172:17, 173:13, 174:5
backend exceptions = 167.8:PASS(historical+local+cached), 169.14:PASS(historical+local+cached)
live remote branch proof = unavailable; no fresh GitHub absence claim
duplicates/orphans/mismatches = 0
errors = 0
base SHA = 9d611369085a1e88783322a50f3c3a043cd25257
```

The exact command runs the deterministic `node:test` mutation suite before validating and reporting the canonical corpus. Any lost defect assertion or canonical parity error makes the command exit non-zero.

## Deterministic Failure Taxonomy

The 33-test mutation suite deep-clones one real-corpus collection and asserts exact `{ code, identity }` records for clean parity plus missing Story/plan, orphan plan, duplicate Story/plan/status/route owner/entry/effective URL/branch/worktree/evidence, title mismatch with actual/expected/path, malformed or missing plan fields, missing/extra/nonexistent routes, route-path mismatch, missing artifact, changed ledger status, invalid/orphan status, exact frontend repository assignment, invalid/third backend assignment, exact backend branch/planned-worktree/delivered-cleanup-worktree/handoff identities, exact historical backend and frontend-handoff remote/local branch cleanup statements, cached-remote-tracking versus unavailable-live-remote proof boundaries, raw master/fingerprint and mandatory-plan-section mutations, frozen-base mismatch, narrow legacy prerequisite/ownership exceptions, unresolved/self/future/cyclic prerequisites, and missing evidence.

## Route-to-Implementation-Artifact Linkage

Every route-ledger owner resolves to exactly one existing implementation artifact:

- `167.2` — `/` — `_bmad-output/implementation-artifacts/167-2-fe-migrate-root-entry.md`
- `167.3` — `/login` — `_bmad-output/implementation-artifacts/167-3-fe-migrate-login-login.md`
- `167.4` — `/register` — `_bmad-output/implementation-artifacts/167-4-fe-migrate-registration-register.md`
- `167.5` — `/cabinet` — `_bmad-output/implementation-artifacts/167-5-fe-migrate-cabinet-onboarding.md`
- `167.6` — `/processing` — `_bmad-output/implementation-artifacts/167-6-fe-migrate-processing.md`
- `167.7` — `/wb-token` — `_bmad-output/implementation-artifacts/167-7-fe-migrate-wb-token.md`
- `168.1` — `/analytics` — `_bmad-output/implementation-artifacts/168-1-fe-migrate-analytics-hub.md`
- `168.2` — `/analytics/alerts` — `_bmad-output/implementation-artifacts/168-2-fe-migrate-analytics-alerts.md`
- `168.3` — `/analytics/dashboard` — `_bmad-output/implementation-artifacts/168-3-fe-migrate-analytical-dashboard.md`
- `168.4` — `/analytics/finance-history` — `_bmad-output/implementation-artifacts/168-4-fe-migrate-finance-history.md`
- `168.5` — `/analytics/orders` — `_bmad-output/implementation-artifacts/168-5-fe-migrate-orders-analytics.md`
- `168.6` — `/analytics/pricing` — `_bmad-output/implementation-artifacts/168-6-fe-migrate-pricing-analytics.md`
- `168.7` — `/analytics/product/[nmId]` — `_bmad-output/implementation-artifacts/168-7-fe-migrate-product-analytics.md`
- `168.8` — `/analytics/reorder` — `_bmad-output/implementation-artifacts/168-8-fe-migrate-reorder-analytics.md`
- `168.9` — `/analytics/sku` — `_bmad-output/implementation-artifacts/168-9-fe-migrate-sku-analytics.md`
- `168.10` — `/analytics/time-period` — `_bmad-output/implementation-artifacts/168-10-fe-migrate-time-period-analytics.md`
- `168.11` — `/analytics/unit-economics` — `_bmad-output/implementation-artifacts/168-11-fe-migrate-unit-economics.md`
- `169.1` — `/analytics/acquiring` — `_bmad-output/implementation-artifacts/169-1-fe-migrate-acquiring-report-index.md`
- `169.2` — `/analytics/acquiring/period` — `_bmad-output/implementation-artifacts/169-2-fe-migrate-acquiring-period-detail.md`
- `169.3` — `/analytics/acquiring/reports/[id]` — `_bmad-output/implementation-artifacts/169-3-fe-migrate-acquiring-report-transaction-detail.md`
- `169.4` — `/analytics/buyout` — `_bmad-output/implementation-artifacts/169-4-fe-migrate-buyout-analytics.md`
- `169.5` — `/analytics/buyout-reconciliation` — `_bmad-output/implementation-artifacts/169-5-fe-migrate-buyout-reconciliation.md`
- `169.6` — `/analytics/fbs-enhanced` — `_bmad-output/implementation-artifacts/169-6-fe-migrate-enhanced-fbs-analytics.md`
- `169.7` — `/analytics/fbs-stock` — `_bmad-output/implementation-artifacts/169-7-fe-migrate-fbs-stock-analytics.md`
- `169.8` — `/analytics/funnel` — `_bmad-output/implementation-artifacts/169-8-fe-migrate-funnel-analytics.md`
- `169.9` — `/analytics/gaps` — `_bmad-output/implementation-artifacts/169-9-fe-migrate-analytics-gaps-triage.md`
- `169.10` — `/analytics/liquidity` — `_bmad-output/implementation-artifacts/169-10-fe-migrate-liquidity-analytics-and-liquidation-planning.md`
- `169.11` — `/analytics/returns` — `_bmad-output/implementation-artifacts/169-11-fe-migrate-returns-analytics.md`
- `169.12` — `/analytics/storage` — `_bmad-output/implementation-artifacts/169-12-fe-migrate-storage-analytics-and-paid-storage-import.md`
- `169.13` — `/analytics/supply-planning` — `_bmad-output/implementation-artifacts/169-13-fe-migrate-supply-planning.md`
- `170.1` — `/analytics/advertising` — `_bmad-output/implementation-artifacts/170-1-fe-migrate-advertising-analytics-workspace.md`
- `170.2` — `/analytics/advertising/campaigns/[advertId]` — `_bmad-output/implementation-artifacts/170-2-fe-migrate-advertising-campaign-bid-recommendation-detail.md`
- `170.3` — `/analytics/brand` — `_bmad-output/implementation-artifacts/170-3-fe-migrate-brand-margin-analytics.md`
- `170.4` — `/analytics/brand-share` — `_bmad-output/implementation-artifacts/170-4-fe-migrate-brand-share-analytics.md`
- `170.5` — `/analytics/category` — `_bmad-output/implementation-artifacts/170-5-fe-migrate-category-margin-analytics.md`
- `170.6` — `/analytics/cross-reference` — `_bmad-output/implementation-artifacts/170-6-fe-migrate-advertising-organic-cross-reference-analytics.md`
- `170.7` — `/analytics/search` — `_bmad-output/implementation-artifacts/170-7-fe-migrate-search-analytics-workspace.md`
- `171.1` — `/analytics/ai-admin/anomalies` — `_bmad-output/implementation-artifacts/171-1-fe-migrate-ai-anomaly-triage.md`
- `171.2` — `/analytics/ai-admin/models` — `_bmad-output/implementation-artifacts/171-2-fe-migrate-ai-admin-model-governance.md`
- `171.3` — `/analytics/ai-admin/preferences` — `_bmad-output/implementation-artifacts/171-3-fe-migrate-ai-preferences.md`
- `171.4` — `/analytics/forecast` — `_bmad-output/implementation-artifacts/171-4-fe-migrate-forecast-workspace.md`
- `171.5` — `/analytics/forecast-accuracy` — `_bmad-output/implementation-artifacts/171-5-fe-migrate-forecast-accuracy-analytics.md`
- `171.6` — `/analytics/models` — `_bmad-output/implementation-artifacts/171-6-fe-migrate-model-registry-and-training-entry.md`
- `171.7` — `/analytics/models/[id]/evaluations` — `_bmad-output/implementation-artifacts/171-7-fe-migrate-model-evaluations-list.md`
- `171.8` — `/analytics/models/[id]/evaluations/sku-accuracy` — `_bmad-output/implementation-artifacts/171-8-fe-migrate-evaluation-sku-accuracy-detail.md`
- `171.9` — `/analytics/models/[id]/performance` — `_bmad-output/implementation-artifacts/171-9-fe-migrate-model-performance-detail.md`
- `172.1` — `/dashboard` — `_bmad-output/implementation-artifacts/172-1-fe-migrate-the-business-dashboard.md`
- `172.2` — `/automation/canned-rules` — `_bmad-output/implementation-artifacts/172-2-fe-migrate-the-canned-automation-rules-gallery.md`
- `172.3` — `/automation/installed-rules` — `_bmad-output/implementation-artifacts/172-3-fe-migrate-the-installed-automation-rules-list.md`
- `172.4` — `/automation/installed-rules/[id]` — `_bmad-output/implementation-artifacts/172-4-fe-migrate-the-installed-rule-detail-and-editor.md`
- `172.5` — `/cogs` — `_bmad-output/implementation-artifacts/172-5-fe-migrate-single-product-cogs-management.md`
- `172.6` — `/cogs/bulk` — `_bmad-output/implementation-artifacts/172-6-fe-migrate-bulk-cogs-assignment.md`
- `172.7` — `/cogs/history` — `_bmad-output/implementation-artifacts/172-7-fe-migrate-cogs-history.md`
- `172.8` — `/cogs/price-calculator` — `_bmad-output/implementation-artifacts/172-8-fe-migrate-the-cogs-price-calculator.md`
- `172.9` — `/communications` — `_bmad-output/implementation-artifacts/172-9-fe-migrate-communications-workspace.md`
- `172.10` — `/finances` — `_bmad-output/implementation-artifacts/172-10-fe-migrate-finances-and-documents.md`
- `172.11` — `/monitor` — `_bmad-output/implementation-artifacts/172-11-fe-migrate-the-monitor-route.md`
- `172.12` — `/monitoring` — `_bmad-output/implementation-artifacts/172-12-fe-migrate-the-monitoring-operations-console.md`
- `172.13` — `/moysklad` — `_bmad-output/implementation-artifacts/172-13-fe-migrate-the-moysklad-integration-workspace.md`
- `172.14` — `/orders` — `_bmad-output/implementation-artifacts/172-14-fe-migrate-the-orders-overview.md`
- `172.15` — `/orders/fbo` — `_bmad-output/implementation-artifacts/172-15-fe-migrate-fbo-orders.md`
- `172.16` — `/orders/integrity` — `_bmad-output/implementation-artifacts/172-16-fe-migrate-order-integrity-analysis.md`
- `172.17` — `/products` — `_bmad-output/implementation-artifacts/172-17-fe-migrate-product-management.md`
- `173.1` — `/settings` — `_bmad-output/implementation-artifacts/173-1-fe-migrate-settings-shell-and-overview.md`
- `173.2` — `/settings/backfill` — `_bmad-output/implementation-artifacts/173-2-fe-migrate-backfill-settings.md`
- `173.3` — `/settings/cabinet` — `_bmad-output/implementation-artifacts/173-3-fe-migrate-cabinet-settings.md`
- `173.4` — `/settings/expenses` — `_bmad-output/implementation-artifacts/173-4-fe-migrate-expense-settings.md`
- `173.5` — `/settings/notifications` — `_bmad-output/implementation-artifacts/173-5-fe-migrate-notification-settings.md`
- `173.6` — `/settings/tariffs` — `_bmad-output/implementation-artifacts/173-6-fe-migrate-tariff-settings.md`
- `173.7` — `/settings/tax` — `_bmad-output/implementation-artifacts/173-7-fe-migrate-tax-settings.md`
- `173.8` — `/shipments` — `_bmad-output/implementation-artifacts/173-8-fe-migrate-the-shipments-list.md`
- `173.9` — `/shipments/[id]` — `_bmad-output/implementation-artifacts/173-9-fe-migrate-shipment-detail.md`
- `173.10` — `/shipments/box-types` — `_bmad-output/implementation-artifacts/173-10-fe-migrate-shipment-box-types.md`
- `173.11` — `/shipments/sku-packaging` — `_bmad-output/implementation-artifacts/173-11-fe-migrate-sku-packaging.md`
- `173.12` — `/supplies` — `_bmad-output/implementation-artifacts/173-12-fe-migrate-supplies-list.md`
- `173.13` — `/supplies/[id]` — `_bmad-output/implementation-artifacts/173-13-fe-migrate-supply-detail.md`

## Non-Product Evidence Applicability

Responsive, theme, viewport, screenshot, axe, keyboard, focus, contrast, table, chart, and real-screen-reader execution are N/A for Story 174.1 because it changes no runtime UI. The validator proves that each canonical BMAD Story declares the applicable responsive/table/chart, accessibility, and test/visual evidence fields; it does not reperform route evidence owned by Story 174.3.

No frontend server, backend service, credential, `.env.e2e`, token, cookie, browser storage, screenshot, trace, video, Playwright report, deploy, or production operation is used.

## Independent Review

### Accepted request-changes findings and repairs (2026-08-31)

- Initial semantic review findings were accepted for deterministic CLI self-tests, malformed/duplicate frontmatter, exact plan/status/artifact identity, effective-route bijection, prerequisite semantics, report completeness, and base-SHA failure propagation. The validator now retains raw parser identity, executes its deterministic suite before the canonical run, supports a defective CLI fixture with exit 1, and fails closed on every accepted mutation.
- Independent correctness and narrative reviews both rejected the former keyword-only backend `PASS` and ownership/prerequisite false-green. The repair adds exact master lifecycle rows, exact BMAD ownership/dependency fingerprints, exact master-index prerequisite comparison, plan linkage/identity validation, guarded backend/frontend Git ancestry and cleanup facts, Story 169.14 handoff/retirement proof, and source-level negative fixtures.
- The same reviews rejected stale privacy arithmetic and an unreproducible npm claim. Final validation therefore uses the exact npm `11.11.0` executable, scans all nine frozen files in full, and records the repository-wide two-finding historical baseline separately.

### Fresh convergence reviews (2026-08-31)

- The first fresh-context correctness and parser passes requested changes for exact frozen-base enforcement, cached-versus-live remote proof separation, exact delivered backend/handoff identities, broad prerequisite/ownership bypasses, master-bound repository assignment, mandatory plan-section parsing, and missing source-boundary mutations. The narrative pass requested factual test-count and validation-state reconciliation.
- All accepted findings were repaired inside the frozen nine-file scope. A fresh narrative/evidence pass approved the repaired 32-test base candidate with zero actionable findings. The subsequent fresh parser/verifier pass found one remaining historical remote-cleanup false-green; after exact backend and frontend-handoff cleanup statements plus raw artifact removals were added, that reviewer approved the complete 33-test candidate with zero actionable P0-P3 findings. This base-plus-delta review sequence covers the current candidate; the earlier rejected reviews do not count toward convergence.

## Validation Evidence

- Pinned runtime reproduced exactly: `/opt/homebrew/opt/node@24/bin/node --version` → `v24.18.0`; `/opt/homebrew/opt/node@24/bin/node /private/tmp/wb-repricer-node24-npm11.11.0/node_modules/npm/bin/npm-cli.js --version` → `11.11.0`.
- Exact validator command: `/opt/homebrew/opt/node@24/bin/node scripts/check-shadcn-migration-parity.mjs`; 33/33 deterministic tests passed, canonical schema-v3 machine report and concise human summary were emitted from the same model/base, and exit code was 0.
- Canonical parity: 94 Stories, 94 plans, 76 source routes, 76 ledger rows, 76 unique route owners, 76 unique linked implementation artifacts, zero validation errors, and both backend exceptions PASS.
- Backend Git corroboration uses exact locally available commit objects, guarded ancestry against cached `refs/remotes/origin/main`, local/cached-remote-tracking branch absence, and exact planned plus delivered-cleanup worktree absence. The machine and human reports label this `PASS(historical+local+cached)` and expose live remote branch proof as `unavailable`; a fresh GitHub absence assertion is not claimed because DNS was unavailable during the backend evidence probe. Exact committed implementation artifacts supply the historical remote-cleanup record.
- Exact npm `11.11.0` `run lint`: pass; direct ESLint on both new `.mjs` files: pass with zero warnings.
- Exact npm `11.11.0` `run type-check`: pass.
- Exact npm `11.11.0` `run check:max-lines`: pass, zero source/test violations.
- Exact npm `11.11.0` `run check:docs`: pass with 427 citations and the exact committed 95-entry historical broken-citation baseline unchanged.
- Exact npm `11.11.0` `run check:markers`: 299 files scanned, zero marker violations; legacy pre-94 review-pass notices remain informational.
- Exact npm `11.11.0` `run check:lessons`: 299 files and 96 lesson lines checked, zero violations.
- Prettier project-policy check: pass for both plan files and both scripts; explicit unignored check: pass for the new Story artifact, sprint YAML, and canonical BMAD epics file. The existing registry/ledger table layout was preserved deliberately instead of accepting unrelated whole-table alignment churn.
- `sprint-status.yaml` parse: pass.
- `git diff --check`: pass.
- Exact actual-manifest equality: pass for all nine frozen paths, including the intentionally ignored new Story artifact.
- Full-content frozen-scope privacy scan: 9 files scanned, 0 binary files, 0 missing files, 0 violations, and 0 scanner errors.
- Repository-wide `npm run check:privacy` remains a named pre-existing baseline gap: two `raw-browser-capture` findings in unchanged `e2e/price-calculator-visual.spec.ts` at lines 280 and 306. Story 174.1 did not edit that file and does not relabel this gate as a pass.
- Story-worktree exact npm `11.11.0` webpack production build: pass, compilation and TypeScript pass, 70/70 static pages generated, and dynamic routes retained.
- Standard Turbopack build on the exact clean primary base `9d611369`: the sandbox attempt failed only on process/port `EPERM`; the approved out-of-sandbox rerun passed compilation, TypeScript, and 70/70 pages under the same pinned Node/npm pair.

Fresh independent review convergence is complete. The exact reviewed feature lifecycle then completed without widening the Story scope.

## Lifecycle

- Feature commit: `4c930a9d69dc69e6e561994256a504e754f99a39`.
- PR number/URL: [#369](https://github.com/salacoste/wb-erp-system-daytona-FE/pull/369), exact base `main@9d611369`, exact head `cdx/epic-174-story-1-plan-parity@4c930a9d`, verified non-draft and mergeable before merge.
- Merge SHA: `360c9cb93a2caa53084f4a34460abecc3217e5e9`, with exact parents `9d611369085a1e88783322a50f3c3a043cd25257` and `4c930a9d69dc69e6e561994256a504e754f99a39`.
- Local/remote branch and worktree cleanup: pass. The local branch, remote branch/ref, temporary worktree path, stale worktree registration, and open PR for the feature head are absent; `/private/tmp/wb-repricer-cleanup-quarantine-20260828.H6K0jw` remains preserved.

## Dev Agent Record

### Implementation Plan

1. Lock the live corpus once and mutate deep clones for deterministic failure semantics.
2. Keep the validator filesystem-only and dependency-free.
3. Emit complete machine evidence plus a concise human summary from the same validated model/base.
4. Preserve the nine-file scope and all 76 ledger statuses.

### Completion Notes

- The dependency-free parity validator, exact backend lifecycle corroboration, canonical ownership/dependency fingerprints, strict identity and mandatory-section checks, and 33-test mutation suite are implemented, locally validated, independently reviewed, merged, and cleaned. Story 174.1 is `done`; Story 174.2 is the next program Story. This closeout record reports only the already-completed feature lifecycle and does not preclaim its own future PR merge or cleanup.

### File List

- `.omx/plans/174.1-prove-bmad-route-ledger-and-omx-plan-parity.md`
- `.omx/plans/shadcn-full-ui-migration-master.md`
- `_bmad-output/implementation-artifacts/174-1-fe-prove-bmad-route-ledger-and-omx-plan-parity.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md`
- `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`
- `_bmad-output/planning-artifacts/shadcn-route-ledger.md`
- `scripts/check-shadcn-migration-parity.mjs`
- `scripts/__tests__/check-shadcn-migration-parity.test.mjs`

## Change Log

| Date       | Change                                                                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-31 | Story 174.1 started from base `9d611369`; missing-validator RED captured; exact nine-file manifest frozen; parity validator and deterministic mutation suite implemented. Status: backlog → in-progress.                                                                     |
| 2026-08-31 | Accepted correctness/narrative request-changes findings repaired: exact ownership/dependency parity, backend merge/ancestry/cleanup and 169.14 handoff/retirement proof, strict identity/CLI/base failure checks, exact pinned runtime, and full nine-file privacy evidence. |
| 2026-08-31 | Feature commit `4c930a9d` merged through PR #369 as `360c9cb9`; primary `main` fast-forwarded and exact feature branch/ref/worktree/path/stale-registration/open-PR cleanup proved. Status: review → done; NEXT: Story 174.2.                                                |

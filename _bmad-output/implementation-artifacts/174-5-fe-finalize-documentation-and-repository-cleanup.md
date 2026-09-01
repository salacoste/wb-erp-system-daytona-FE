# Story 174.5 FE: Finalize Documentation and Repository Cleanup

**Status**: done — 2026-09-02; 4-pass fresh-context review converged (10→6→4→2 findings, all 22 dispositioned); merged via feature PR #379 (literal amended pre-merge)
**Epic**: 174-FE (program closeout) · **PR**: #379 (amended pre-merge) · **Base**: 0d6225acb9abfafa872d2d2ee45f215594edc4e6 · **Branch**: cdx/epic-174-story-5-docs-cleanup · **Worktree**: /private/tmp/wb-repricer-fe-174-5-docs-cleanup

## 1. Context & scope

Final story of the 94-story Epics 166-174 shadcn-migration program (94/94): documentation/tracking-only closeout — this story owns **zero runtime routes** and touches no product behavior, only canonical docs, tracking registries, the parity tool's terminal-state constants, and cleanup evidence. Inputs: [`docs/HANDOFF-2026-09-01-TEAM-HANDOFF-174-5-FINAL-CLOSEOUT-AND-DEBT.md`](../../docs/HANDOFF-2026-09-01-TEAM-HANDOFF-174-5-FINAL-CLOSEOUT-AND-DEBT.md) §0 and the story plan `.omx/plans/174.5-finalize-documentation-and-repository-cleanup.md` (requirements FR30, FR31, FR35; prerequisites 174.1-174.4 all merged and reachable from main 0d6225ac).

**Prerequisite merge SHAs (delivery record, verified `git merge-base --is-ancestor <sha> main` on 2026-09-02):** 174.1 = `360c9cb9` (feature PR #369; closeout PR #370 → `fbdab2da`, lifecycle PR #371 → `e7d438ce`), 174.2 = `862d45a1` (PR #372), 174.3 = `c5605a38` (PR #374), 174.4 = `a21bf67e` (PR #375; closeout PR #376). Story base after prerequisites: `0d6225acb9abfafa872d2d2ee45f215594edc4e6` (= main at branch creation; no unmerged feature branches involved).

## 2. Method

Evidence-first, adversarially cross-checked:

- **Explore agent** built a 76-row evidence map (one row per route-ledger story × 6-link chain: artifact, PR/merge, visual/a11y, review, cleanup) — full log at `/tmp/174.5-evidence-map.log`, summarized in §4. Row→artifact mapping inherited from the 174-1 parity artifact (L86-161); merge SHAs resolved via `git log --merges --grep` + ancestry proof; visual/a11y grepped against the committed 174.3 corpus.
- **Independent adversarial verifier** (fresh context, `/tmp/174.5-verify-map.log`) re-audited 30 of 76 rows — all 18 HOLE rows + 12 FULL rows — and **REFUTED 4 rows**: 167.5/167.6/167.7 `CLEANUP=OK` unsupported (no cleanup record anywhere: artifacts end at "## Gaps" / "Git integration/cleanup remain open"; sprint rows carry no cleanup wording), 167.4 partial (remote-branch deletion only; local-branch + worktree tasks unchecked at 167-4:154-155). Verifier verdict: the cleanup-audit scope must be **rescoped 18 → 22 rows** (168.1-168.11, 169.1-169.7 + 167.4-167.7), else those 4 rows flip on zero recorded evidence.
- **Edits in 4 Change-Log waves** (W1+W2 combined tracker/parity, W3 ledger+syncs, W4 exceptions+registry, W5 synthesis docs — five wave labels, four Change-Log rows); **all gates re-run by the orchestrator** after the waves (§8).

## 3. Tasks

1. [x] Reconcile canonical frontend/design-system documentation with the merged token, primitive, composition, ownership, responsive, accessibility, and Story-delivery contracts (plan §Story-Specific item 1).
2. [x] Build the 76-row evidence map; submit to independent adversarial verification; apply the 4 refutations and rescope the cleanup audit 18 → 22 rows (plan item 2 precondition).
3. [x] Mark route-ledger rows verified only where the 6-link chain resolves — canonical expectation flipped planned → verified: 54 rows per-story links + 22 rows cleanup via collective-audit (plan item 2).
4. [x] Validate every documentation/evidence link, final delivery-manifest entry, retrospective item, and exception disposition (plan item 3).
5. [x] Audit migration branches and worktrees against merged PRs; remove only proven-completed resources, preserve/report unrelated work (2 parity-bisect instrumentation worktrees used for the drift bisect, then removed before the final battery; plan item 4).
6. [x] Attach final absence evidence for all 22 collective-audit rows — live worktree/branch/ls-remote audit at pinned main 0d6225ac, 2026-09-02 (plan items 5-6, cleanup half).
7. [x] Run final Story/route/evidence parity (EXIT=0, §5) and documentation checks; publish the cleanup report — delivery manifest, program retrospective, final handoff — and verify the diff is documentation/tracking-only (plan items 6-7).
8. [x] **Final validation battery** — orchestrator re-runs all universal gates and fills the `<!-- ORCH-FILL -->` placeholders in §8.
9. [x] **Independent adversarial review (fresh-context multi-pass), PR/merge, and mandatory branch/worktree cleanup** — orchestrator-owned closeout; appends the close-row with `**Lessons:**`. Hard exit criteria (pass-1 F-1): the story PR number is backfilled into every `#TBD` literal (sprint row, registry ×2, this artifact header) via a pre-merge amend **scoped to those literals only** — six locations total: sprint row, registry ×2 (snapshot line + SHIPPED block), this artifact header, delivery manifest §1, final handoff §1 (pass-4 F-1: the original four-literal enumeration missed the manifest + handoff literals); both review passes attest the pre-amend SHA and the close-row records that the literal-substitution amend does not invalidate them; the sprint-flip-precedes-merge sequencing is by-design (atomically true only once the PR merges) and is stated in the close-row.

## 4. Route-ledger final verification — full 76-row evidence table

Source: `/tmp/174.5-evidence-map.log` (76 TSV rows) with the verifier corrections from `/tmp/174.5-verify-map.log` applied: rows 167.4-167.7 Cleanup → `collective-audit` (R1-R4: per-story cleanup records refuted/partial); rows 168.1-168.11 and 169.1-169.7 keep their HOLE:cleanup → resolved disposition as `collective-audit`. Final state: **every row FULL chain** — per-story links for 54 rows; `collective-audit` cleanup for 22 rows.

| Story | Route | Artifact | PR/merge | Visual/a11y | Review | Cleanup | Chain |
|---|---|---|---|---|---|---|---|
| 167.2 | / | 167-2-fe-migrate-root-entry.md | ##154@8eee14bb | 174.3-matrix+artifact | OK | OK | FULL |
| 167.3 | /login | 167-3-fe-migrate-login-login.md | ##157@c2a96943 | 174.3-matrix+artifact | OK | OK | FULL |
| 167.4 | /register | 167-4-fe-migrate-registration-register.md | ##158@d1401ca8 | 174.3-matrix+artifact | OK | collective-audit | FULL |
| 167.5 | /cabinet | 167-5-fe-migrate-cabinet-onboarding.md | ##165@03f22b8e | 174.3-matrix+artifact | OK | collective-audit | FULL |
| 167.6 | /processing | 167-6-fe-migrate-processing.md | ##166@e8ab151b | 174.3-matrix+artifact | OK | collective-audit | FULL |
| 167.7 | /wb-token | 167-7-fe-migrate-wb-token.md | ##167@3a3d71f6 | 174.3-matrix+artifact | OK | collective-audit | FULL |
| 168.1 | /analytics | 168-1-fe-migrate-analytics-hub.md | ##168@b21aa04d ##186@16810aab | 174.3-matrix | OK | collective-audit | FULL |
| 168.2 | /analytics/alerts | 168-2-fe-migrate-analytics-alerts.md | ##170@36fdcb83 | 174.3-matrix | OK | collective-audit | FULL |
| 168.3 | /analytics/dashboard | 168-3-fe-migrate-analytical-dashboard.md | ##172@2e76b615 | 174.3-matrix | OK | collective-audit | FULL |
| 168.4 | /analytics/finance-history | 168-4-fe-migrate-finance-history.md | ##174@cd4d95b3 | 174.3-matrix | OK | collective-audit | FULL |
| 168.5 | /analytics/orders | 168-5-fe-migrate-orders-analytics.md | ##176@817dcb79 | 174.3-matrix | OK | collective-audit | FULL |
| 168.6 | /analytics/pricing | 168-6-fe-migrate-pricing-analytics.md | ##178@42f24d53 | 174.3-matrix | OK | collective-audit | FULL |
| 168.7 | /analytics/product/[nmId] | 168-7-fe-migrate-product-analytics.md | ##180@6e2bdf1a | 174.3-matrix | OK | collective-audit | FULL |
| 168.8 | /analytics/reorder | 168-8-fe-migrate-reorder-analytics.md | ##182@fccb1404 | 174.3-matrix | OK | collective-audit | FULL |
| 168.9 | /analytics/sku | 168-9-fe-migrate-sku-analytics.md | ##184@1e1c5f04 | 174.3-matrix | OK | collective-audit | FULL |
| 168.10 | /analytics/time-period | 168-10-fe-migrate-time-period-analytics.md | ##168@b21aa04d ##186@16810aab | 174.3-matrix | OK | collective-audit | FULL |
| 168.11 | /analytics/unit-economics | 168-11-fe-migrate-unit-economics.md | ##188@c7587aed | 174.3-matrix | OK | collective-audit | FULL |
| 169.1 | /analytics/acquiring | 169-1-fe-migrate-acquiring-report-index.md | ##190@3b3c6432 ##212@0245f52b | 174.3-matrix | OK | collective-audit | FULL |
| 169.2 | /analytics/acquiring/period | 169-2-fe-migrate-acquiring-period-detail.md | ##192@7ce9f2e2 | 174.3-matrix | OK | collective-audit | FULL |
| 169.3 | /analytics/acquiring/reports/[id] | 169-3-fe-migrate-acquiring-report-transaction-detail.md | ##194@395aba43 | 174.3-matrix | OK | collective-audit | FULL |
| 169.4 | /analytics/buyout | 169-4-fe-migrate-buyout-analytics.md | ##196@b7a91ca5 | 174.3-matrix | OK | collective-audit | FULL |
| 169.5 | /analytics/buyout-reconciliation | 169-5-fe-migrate-buyout-reconciliation.md | ##198@fec2908d | 174.3-matrix | OK | collective-audit | FULL |
| 169.6 | /analytics/fbs-enhanced | 169-6-fe-migrate-enhanced-fbs-analytics.md | ##200@11b11d7a | 174.3-matrix | OK | collective-audit | FULL |
| 169.7 | /analytics/fbs-stock | 169-7-fe-migrate-fbs-stock-analytics.md | ##202@700bf77c | 174.3-matrix | OK | collective-audit | FULL |
| 169.8 | /analytics/funnel | 169-8-fe-migrate-funnel-analytics.md | ##207@ad34dc4c | 174.3-matrix | OK | OK | FULL |
| 169.9 | /analytics/gaps | 169-9-fe-migrate-analytics-gaps-triage.md | ##213@5c6950f3 | 174.3-matrix | OK | OK | FULL |
| 169.10 | /analytics/liquidity | 169-10-fe-migrate-liquidity-analytics-and-liquidation-planning.md | ##190@3b3c6432 ##212@0245f52b | 174.3-matrix | OK | OK | FULL |
| 169.11 | /analytics/returns | 169-11-fe-migrate-returns-analytics.md | ##219@129e99ed | 174.3-matrix | OK | OK | FULL |
| 169.12 | /analytics/storage | 169-12-fe-migrate-storage-analytics-and-paid-storage-import.md | ##227@52f7f506 | 174.3-matrix | OK | OK | FULL |
| 169.13 | /analytics/supply-planning | 169-13-fe-migrate-supply-planning.md | ##232@2778d43e | 174.3-matrix | OK | OK | FULL |
| 170.1 | /analytics/advertising | 170-1-fe-migrate-advertising-analytics-workspace.md | ##237@44a6eb7d | 174.3-matrix | OK | OK | FULL |
| 170.2 | /analytics/advertising/campaigns/[advertId] | 170-2-fe-migrate-advertising-campaign-bid-recommendation-detail.md | ##239@5bb0dcc3 | 174.3-matrix | OK | OK | FULL |
| 170.3 | /analytics/brand | 170-3-fe-migrate-brand-margin-analytics.md | ##241@03a4b3b8 | 174.3-matrix | OK | OK | FULL |
| 170.4 | /analytics/brand-share | 170-4-fe-migrate-brand-share-analytics.md | ##243@34f89495 | 174.3-matrix | OK | OK | FULL |
| 170.5 | /analytics/category | 170-5-fe-migrate-category-margin-analytics.md | ##245@19009e3d | 174.3-matrix | OK | OK | FULL |
| 170.6 | /analytics/cross-reference | 170-6-fe-migrate-advertising-organic-cross-reference-analytics.md | ##247@d1bb947e | 174.3-matrix | OK | OK | FULL |
| 170.7 | /analytics/search | 170-7-fe-migrate-search-analytics-workspace.md | ##250@7a94dac0 | 174.3-matrix | OK | OK | FULL |
| 171.1 | /analytics/ai-admin/anomalies | 171-1-fe-migrate-ai-anomaly-triage.md | ##252@1c0bb385 | 174.3-matrix | OK | OK | FULL |
| 171.2 | /analytics/ai-admin/models | 171-2-fe-migrate-ai-admin-model-governance.md | ##254@103a3ffe | 174.3-matrix | OK | OK | FULL |
| 171.3 | /analytics/ai-admin/preferences | 171-3-fe-migrate-ai-preferences.md | ##256@116263fc | 174.3-matrix | OK | OK | FULL |
| 171.4 | /analytics/forecast | 171-4-fe-migrate-forecast-workspace.md | ##258@5a1e40f1 | 174.3-matrix | OK | OK | FULL |
| 171.5 | /analytics/forecast-accuracy | 171-5-fe-migrate-forecast-accuracy-analytics.md | ##260@ae2eb11a | 174.3-matrix | OK | OK | FULL |
| 171.6 | /analytics/models | 171-6-fe-migrate-model-registry-and-training-entry.md | ##262@b867551f | 174.3-matrix | OK | OK | FULL |
| 171.7 | /analytics/models/[id]/evaluations | 171-7-fe-migrate-model-evaluations-list.md | ##266@37ae5b4c | 174.3-matrix+artifact | OK | OK | FULL |
| 171.8 | /analytics/models/[id]/evaluations/sku-accuracy | 171-8-fe-migrate-evaluation-sku-accuracy-detail.md | ##268@4970c17a | 174.3-matrix+artifact | OK | OK | FULL |
| 171.9 | /analytics/models/[id]/performance | 171-9-fe-migrate-model-performance-detail.md | ##270@2d46a175 | 174.3-matrix+artifact | OK | OK | FULL |
| 172.1 | /dashboard | 172-1-fe-migrate-the-business-dashboard.md | ##278@a001abee ##308@eb09f735 | 174.3-matrix | OK | OK | FULL |
| 172.2 | /automation/canned-rules | 172-2-fe-migrate-the-canned-automation-rules-gallery.md | ##280@d35f1e09 | 174.3-matrix | OK | OK | FULL |
| 172.3 | /automation/installed-rules | 172-3-fe-migrate-the-installed-automation-rules-list.md | ##282@629b74c1 | 174.3-matrix | OK | OK | FULL |
| 172.4 | /automation/installed-rules/[id] | 172-4-fe-migrate-the-installed-rule-detail-and-editor.md | ##285@25c8bc19 | 174.3-matrix | OK | OK | FULL |
| 172.5 | /cogs | 172-5-fe-migrate-single-product-cogs-management.md | ##287@4e86272b | 174.3-matrix | OK | OK | FULL |
| 172.6 | /cogs/bulk | 172-6-fe-migrate-bulk-cogs-assignment.md | ##289@42ac0686 | 174.3-matrix | OK | OK | FULL |
| 172.7 | /cogs/history | 172-7-fe-migrate-cogs-history.md | ##293@da3e9078 | 174.3-matrix | OK | OK | FULL |
| 172.8 | /cogs/price-calculator | 172-8-fe-migrate-the-cogs-price-calculator.md | ##301@08191dae | 174.3-matrix | OK | OK | FULL |
| 172.9 | /communications | 172-9-fe-migrate-communications-workspace.md | ##305@feb35cfd | 174.3-matrix | OK | OK | FULL |
| 172.10 | /finances | 172-10-fe-migrate-finances-and-documents.md | ##278@a001abee ##308@eb09f735 | 174.3-matrix | OK | OK | FULL |
| 172.11 | /monitor | 172-11-fe-migrate-the-monitor-route.md | ##311@8b172445 | 174.3-matrix | OK | OK | FULL |
| 172.12 | /monitoring | 172-12-fe-migrate-the-monitoring-operations-console.md | ##315@9498cb76 | 174.3-matrix | OK | OK | FULL |
| 172.13 | /moysklad | 172-13-fe-migrate-the-moysklad-integration-workspace.md | ##317@485fa27d | 174.3-matrix | OK | OK | FULL |
| 172.14 | /orders | 172-14-fe-migrate-the-orders-overview.md | ##319@4b988aae | 174.3-matrix | OK | OK | FULL |
| 172.15 | /orders/fbo | 172-15-fe-migrate-fbo-orders.md | ##321@81bc35cc | 174.3-matrix | OK | OK | FULL |
| 172.16 | /orders/integrity | 172-16-fe-migrate-order-integrity-analysis.md | ##323@8939aea4 | 174.3-matrix | OK | OK | FULL |
| 172.17 | /products | 172-17-fe-migrate-product-management.md | ##325@caee8523 | 174.3-matrix | OK | OK | FULL |
| 173.1 | /settings | 173-1-fe-migrate-settings-shell-and-overview.md | ##329@7bec65fd ##356@9e4f6254 | 174.3-matrix+artifact | OK | OK | FULL |
| 173.2 | /settings/backfill | 173-2-fe-migrate-backfill-settings.md | ##332@7c85b804 | 174.3-matrix | OK | OK | FULL |
| 173.3 | /settings/cabinet | 173-3-fe-migrate-cabinet-settings.md | ##335@5ce9935e | 174.3-matrix | OK | OK | FULL |
| 173.4 | /settings/expenses | 173-4-fe-migrate-expense-settings.md | ##338@6a6e1bf8 | 174.3-matrix | OK | OK | FULL |
| 173.5 | /settings/notifications | 173-5-fe-migrate-notification-settings.md | ##341@41d686de | 174.3-matrix | OK | OK | FULL |
| 173.6 | /settings/tariffs | 173-6-fe-migrate-tariff-settings.md | ##344@80427f28 | 174.3-matrix | OK | OK | FULL |
| 173.7 | /settings/tax | 173-7-fe-migrate-tax-settings.md | ##347@7f9f046f | 174.3-matrix | OK | OK | FULL |
| 173.8 | /shipments | 173-8-fe-migrate-the-shipments-list.md | ##350@65f73fed | 174.3-matrix | OK | OK | FULL |
| 173.9 | /shipments/[id] | 173-9-fe-migrate-shipment-detail.md | ##353@069c9645 | 174.3-matrix | OK | OK | FULL |
| 173.10 | /shipments/box-types | 173-10-fe-migrate-shipment-box-types.md | ##329@7bec65fd ##356@9e4f6254 | 174.3-matrix | OK | OK | FULL |
| 173.11 | /shipments/sku-packaging | 173-11-fe-migrate-sku-packaging.md | ##359@137e2ee5 | 174.3-matrix | OK | OK | FULL |
| 173.12 | /supplies | 173-12-fe-migrate-supplies-list.md | ##361@747f8449 | 174.3-matrix | OK | OK | FULL |
| 173.13 | /supplies/[id] | 173-13-fe-migrate-supply-detail.md | ##365@2dfe56c1 | 174.3-matrix | OK | OK | FULL |

- **Merge chain**: 76/76 primary PRs resolved to merge SHAs and proven ancestors of main `0d6225ac` (`git merge-base --is-ancestor`); the verifier independently re-checked 30/30 sampled SHAs (incl. all 18 HOLE rows) + 4/4 random PR→SHA exact matches (#157, #167, #200, #344).
- **Visual/a11y source**: the committed 174.3 corpus — `e2e/fixtures/story-174-3/route-contracts.ts` identity matrix (76 ledger route keys; 78 distinct route strings) plus the executed manifest (8480-line `execution-manifest.json`; 367 passed / 0 failed at the 174.4 `--owner-browsers` regeneration); every route appears in ≥2 corpus evidence files.
- **Collective live-absence audit** (the cleanup evidence for the 22 `collective-audit` rows, executed 2026-09-02 at pinned main `0d6225ac`): `git worktree list` clean of story worktrees (the wave-time run additionally listed 2 unrelated `/private/tmp/parity-bisect-*` instrumentation worktrees from this story's own parity bisect — removed before the final gate battery; the final recorded run = primary checkout + the active 174.5 worktree only, exactly as quoted in the ledger evidence section); `git branch --list` = `main` + the active story branch only; `git ls-remote --heads origin` = `main` + 9 `automation/openwiki-*` heads, `grep -c cdx/` = 0. Verifier disposition: SUFFICIENT for the ledger's Completion Evidence Schema **iff** scoped to all 22 rows with per-row enumeration (done: this table + the ledger evidence section cross-reference).

## 5. Parity gate terminal-state change

The migration-parity gate is a ratchet over program invariants; closing the program requires pinning its terminal state to the final base:

- **`EXPECTED_BASE_SHA` re-pinned `9d611369` → `0d6225ac`** in `scripts/check-shadcn-migration-parity.mjs` — per the 174.1 precedent, the constant always equals the **active story base**, and 174.5's base is main `0d6225ac`.
- **Ledger canonical expectation flipped planned → verified** (`shadcn-route-ledger.md`): the parity bijection now requires all 76 rows verified, matching the §4 final state.
- **3 test-file SHA literals synced** in `scripts/__tests__/check-shadcn-migration-parity.test.mjs` to the new expectations.
- **Plan 174.3 canonicalized** (`.omx/plans/174.3-complete-accessibility-responsive-theme-and-visual-verification.md`): status → executed, headings aligned to the plan template, remediation-gate content preserved verbatim as `###` subsections (no content loss).
- **Suite result at base `0d6225ac`** (`/tmp/174.5-parity-after.log` tail, 5 HUMAN summary lines):

```
HUMAN: base SHA = 0d6225acb9abfafa872d2d2ee45f215594edc4e6
HUMAN: 94 BMAD Stories = 94 OMX plans
HUMAN: 76 source routes = 76 route-ledger rows = 76 route Stories
HUMAN: epic counts = 166:8, 167:9, 168:11, 169:15, 170:7, 171:9, 172:17, 173:13, 174:5
HUMAN: backend exceptions = 167.8:PASS(historical+local+cached);live-remote:unavailable, 169.14:PASS(historical+local+cached);live-remote:unavailable; duplicates/orphans/mismatches = 0; errors = 0
```

Self-test suite: **33/33** (`tests 33 / pass 33`), corpus **0 errors**, gate EXIT=0.

## 6. Tracker syncs

- **174.2 duplicate backlog row deleted** from `sprint-status.yaml` (duplicate of the shipped 174.2 row).
- **174.3 sprint row `review` → `done`** (the stale status 174.4's pass-2 flagged as P2-8) + 174.3 artifact Status synced + plan canonicalized (§5).
- **21 frozen artifact Status lines synced** to their true merged state (were frozen pre-merge: "review (awaiting orchestrator commit/PR)" / "Code-complete (uncommitted in worktree)"): `167-5-fe-migrate-cabinet-onboarding.md`, `167-6-fe-migrate-processing.md`, `167-7-fe-migrate-wb-token.md`, `168-1` … `168-11` (11 files: analytics-hub, analytics-alerts, analytical-dashboard, finance-history, orders-analytics, pricing-analytics, product-analytics, reorder-analytics, sku-analytics, time-period-analytics, unit-economics), `169-1` … `169-7` (7 files: acquiring-report-index, acquiring-period-detail, acquiring-report-transaction-detail, buyout-analytics, buyout-reconciliation, enhanced-fbs-analytics, fbs-stock-analytics) — all under `_bmad-output/implementation-artifacts/`.
- **167.4 two cleanup checkboxes closed** (`167-4-fe-migrate-registration-register.md:154-155`: local-branch deletion + worktree removal) with an audit annotation pointing at the collective-absence evidence (§4) rather than fabricated per-story records.
- **167-6 line ~52 unappended-gate-output disclosure**: the file promises "Full gate output recorded below by orchestrator run" and nothing follows — recorded here as a disclosed gap, **not** fabricated: the gate record lives in the sprint-status row, which is noted in the sync edit. Nothing was invented to fill it. Same file also retains an unfilled `## Lessons _(placeholder — filled at review)_` heading (line ~55) — disclosed here rather than fabricated; lessons-class history stays with its owner.

## 7. Exceptions disposition

**Boundary-manifest registered exceptions — ×4 owner-accepted, re-confirmed live** (`shadcn-ui-boundary-classification-manifest.md` §7): FeedbackButtons `text-green-700` — **pass-2 correction (P2-F1)**: the "F-10 / TECH-DEBT ledger / ≈6.5:1" citation chain is a dangling, arithmetically wrong record. Verified ground truth: "F-10" is an inline review-finding comment at `FeedbackButtons.tsx:16` (no ledger entry exists anywhere); `#15803d` measures **5.02:1** on white, **4.56:1** on muted `#f4f4f5`, and **3.53:1 on dark `#18181b` — fails 4.5:1 AA in dark theme** (ratios recomputed independently by pass-2 reviewer AND the orchestrator via WCAG relative luminance). The exception in `BOUNDARY_EXCEPTIONS` is a design-system-boundary exception (hardcoded legacy palette class), NOT a WCAG exemption; the dark-theme failure and the wrong ratio at origin (source comment + boundary-script comment + manifest §7 mirror) are registered as **PB-4** (registry APPEND, §11.9 vocabulary `confirmed-live`); waterfall categorical hex (**C5**, 13-category Material palette, registered until chart-palette owner decision); historical `#7C3AED` chart marks ×2 — `PriceHistorySheet.tsx` and `FunnelTab.tsx` (per-file suppressed-match counts as listed in the pre-existing manifest §7 table; the gate's own output reports "4 exceptions, 4 suppressing live matches" without per-file breakdown). Live re-confirmation at 174.5 closeout: **boundary run 459 = 459 baseline PASS, self-suite 10/10, exceptions 4/4 suppressing live**.

**C-series (debt registry §3.2)**: **C6** (date-cells `tabular-nums` in acquiring tables) resolved-by-migration; **C13** (GapsTable caption/scroll-aria-label duplication, P1-LOW), **C15** (URGENCY_CLASS cyrillic label-keys, LiquidationScenarioCard), **C5** (waterfall double-color-source) still-open **owner** decisions — none blocks program close; **C8** (FunnelPageContent) sits exactly at the 200-line source cap — extraction on next touch, per registry.

## 8. Validation

### Parity (done)
`node scripts/check-shadcn-migration-parity.mjs` → **EXIT=0**; self-test suite **33/33**; corpus **0 errors** at base `0d6225ac` (§5 HUMAN lines). Gate re-run by orchestrator in the final battery: **EXIT=0 (fresh run after all edit waves, 2026-09-02, /tmp/174.5-parity-final.log — 33/33 pass, 0 corpus errors, base SHA 0d6225ac).**

### Universal gates (final battery — orchestrator fills)
- `npm run check:docs` (bare, no pipe): **EXIT=0 — baseline exact match, 95 broken (historical), zero NEW/RESOLVED drift** (re-run post-prettier on the complete final state, /tmp/174.5-docs-postprettier.log)
- `npm run lint` (0 errors / 0 warnings policy): **EXIT=0** (0 errors / 0 warnings; re-run post-prettier)
- `npm run type-check`: **EXIT=0** (0 errors)
- `npm run check:max-lines`: **EXIT=0** (re-run post-prettier)
- prettier on changed files: **33 of 34 touched files compliant** (final per-file sweep, zsh-safe one-path-per-invocation). Correction of the interim record (pass-1 F-5): the first batch `--check` invocation failed wholesale with ENAMETOOLONG — zsh passed the 31-path list as a single argument (the V13 "zsh не word-split'ит" trap), so its 8-file error list was an invocation artifact, not real violations; the subsequent explicit `--write` pass actually reformatted only the new final handoff. The single remaining non-compliant file is `.omx/plans/174.3-*.md` — **pre-existing on main** (verified `git show main:<path> | prettier --check` fails identically), untouched by formatting to avoid out-of-scope churn on a shipped neighbor-lane plan; repo `format:check` scope is `src/**`, which this docs-only story does not touch.
- `npm run build` (--webpack): **EXIT=0** (`npx next build --webpack`, /tmp/174.5-build.log)
- FULL `npm test -- --run` (floor 19363 passing / 0 failed): **19363 passed / 0 failed / 0 skipped (1274 test files), EXIT=0 — floor EXACTLY 19363, monotonic, CLAUDE.md table unchanged** (/tmp/174.5-vitest.log)
- `git diff --check`: **EXIT=0** (clean; re-run post-prettier)
- `node scripts/check-shadcn-ui-boundary.mjs` (459 = ratchet baseline): **total 459 = baseline 459, verdict PASS, EXIT=0; exceptions 4 registered / 4 suppressing live; self-suite 10/10** (/tmp/174.5-boundary-final.log)
- `npm run check:locale-percent` (ratchet 4): **occurrences = 4 (== baseline), EXIT=0** (pass-2 live re-run)
- `bash scripts/check-lessons-length.sh`: **Violations: 0, EXIT=0** (pass-2 live re-run; close-row Lessons will be length-validated at closeout)

### E2E / visual-responsive-accessibility — N/A with disposition
Story 174.5 is documentation/tracking-only and owns **zero routes**, so no new runtime surface exists and no new E2E/visual runs are generated. Program-level visual/a11y evidence is the 174.3 committed corpus: 76 routes × 2 themes, axe, keyboard, 200% zoom, 367/0 executed at the 174.4 regeneration (§4). Per plan §Visual, the story contract is "final documentation records reusable contracts and remaining justified exceptions" — satisfied by the delivery manifest (`shadcn-migration-final-delivery-manifest.md`), which records the reusable contracts and the ×4 owner-accepted exceptions (§7).

## 9. Dev Agent Record

- **W1+W2 — tracker/parity**: sprint-status 174.2 dup row deleted, 174.3 row review→done; parity gate terminal state pinned (base 0d6225ac, ledger expectation verified, 3 test SHA literals, plan 174.3 canonicalized); suite 33/33 green.
- **W3 — ledger+syncs**: route ledger flipped planned→verified with the 76-row evidence table; 21 frozen artifact Status lines synced to merged truth; 167.4 checkboxes closed with audit annotation; 167-6 disclosure recorded (no fabricated gate output).
- **W4 — exceptions+registry**: boundary manifest §7 Story 174.5 disposition block (×4 owner-accepted re-confirmed live: 459=459 PASS, self-suite 10/10, 4/4 exceptions); C-series dispositions recorded in artifact §7 + delivery manifest §4 + final handoff §4 (C6 resolved-by-migration; C13/C15/C5 owner-open; C8 at cap) — the registry's pre-existing §3.2 C-table rows were left as-is (pass-1 F-4 correction of this record's earlier wording).
- **W5 — synthesis docs**: final delivery manifest, program retrospective (epic-166-174, 2026-09-02), and final handoff `docs/HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md` (authored by a parallel wave); this artifact drafted.

### Post-1st-pass-review fixes (2026-09-02)

**Meta-claim blanket qualifier (Trigger 4 MANDATORY; pre-written per A-2).** This block + Completion Notes + Change Log rows + future Post-Nth-pass-review blocks + the sprint-status close-summary for this story use phrasings asserting structural properties, prior/predicted-pass outcomes, finding-count attestations, rule-applicability self-classification, self-demonstration, and similar recursive-self-validation language. All are **unaudited meta-claims** per Trigger 4, qualified collectively here.

**Pass 1 (fresh-context code-reviewer, opus) — verdict APPROVE-WITH-NOTES; 10 findings (2 HIGH / 4 MEDIUM / 4 LOW); all 10 dispositioned:**

1. [HIGH] PR-`#TBD` sequencing — APPLIED: Task 9 now carries the hard amend/backfill exit criteria + sequencing-by-design statement (§3 item 9).
2. [HIGH] Final handoff untracked — APPLIED: staging record added (§10) naming the normal `git add` for docs/ + `add -f` for the three `_bmad-output/` files.
3. [MED] "28 of 76 rows" — APPLIED: corrected to 30 (§2).
4. [MED] W4 record claimed registry C-table edits — APPLIED: W4 record corrected to name the actual disposition locations; registry pre-existing rows left as-is.
5. [MED] Prettier bullet contradicted logs — APPLIED: bullet rewritten to the sweep truth (zsh ENAMETOOLONG artifact disclosed; 33/34 compliant; plan-174.3 non-compliance pre-existing and out of scope).
6. [MED] Divergent worktree transcripts — APPLIED: wave-time vs final-run transcripts now timestamp-qualified (§4).
7. [LOW] "24 suppressed" not gate-derivable — APPLIED: total dropped; per-file counts attributed to the manifest §7 table; gate wording quoted exactly.
8. [LOW] Retrospective "documented in the gate itself" — APPLIED: retrospective wording corrected to "final handoff".
9. [LOW] Plan-174.3 heading vs three-reviewer body — DISPOSITIONED: the canonical template heading is machine-required by the parity checker (exact-section fail-closed); the body legitimately retains the three-reviewer remediation protocol; no further edit.
10. [LOW] FeedbackButtons ≈6.5:1 ratio + retrospective floor enumeration — DEFERRED to pass-2 (factual lane) with an inline pointer left at §7.

Trigger accounting: pass-1 surfaced 10 findings > 5 ⇒ Trigger 3 fires — a 3rd fresh-context pass is MANDATORY; codification-class story ⇒ default 4-pass schedule stands.

### Post-2nd-pass-review fixes (2026-09-02)

**Meta-claim blanket qualifier (Trigger 4 MANDATORY).** Same scope as the Post-1st-pass block — all structural-property/prior-pass/finding-count phrasings below are unaudited meta-claims, qualified collectively.

**Pass 2 (fresh-context code-reviewer, opus; factual-drift/attributions lane) — verdict REQUEST-CHANGES; 6 findings (1 HIGH / 2 MEDIUM / 1 LOW / 2 NIT); all 6 dispositioned:**

1. [HIGH] F-10 "≈6.5:1 TECH-DEBT ledger" record does not exist; #15803d measures 5.02:1 light / 4.56:1 muted / **3.53:1 dark = AA fail** (ratios independently recomputed by the orchestrator — WCAG relative luminance — confirming the reviewer's arithmetic). APPLIED: §7 rewritten to the verified ground truth (dangling citation disclosed); PB-4 registered in the registry APPEND + final handoff §4 row + owner checklist; delivery manifest §4 row corrected. Origin fix (FeedbackButtons.tsx:16 comment) = runtime src, outside 174.5 surface → owner.
2. [MED] Retrospective floor enumeration omitted the +819 Epics-170-173 segment. APPLIED: trajectory re-anchored 19 055 → 19 874 → 19 118 → 19 355 → 19 363.
3. [MED] Registry §6 carried two contradictory "актуальный вход" declarations. APPLIED: the 2026-08-29 line demoted to "(История, до 2026-09-02)".
4. [LOW] §8 omitted locale-percent + lessons gates that the synthesis docs record. APPLIED: both rows added with pass-2 live re-run evidence (locale 4==baseline EXIT=0; lessons 0 EXIT=0).
5. [NIT] 167-6 unfilled `## Lessons _(placeholder)_` heading. APPLIED: disclosure extended in §6.
6. [NIT] "4 executor waves" vs five labels. APPLIED: wording clarified in §2.

Trigger accounting after pass 2: cumulative 16 findings > 12 ⇒ Trigger 2 confirms the mandatory 3rd pass; pass-2 itself 6 > 5 ⇒ Trigger 3 re-fires (4th pass required unless pass-3 ≤ 5); codification default 4-pass schedule stands.

### Post-3rd-pass-review fixes (2026-09-02)

**Meta-claim blanket qualifier (Trigger 4 MANDATORY).** Same scope — unaudited meta-claims, qualified collectively.

**Pass 3 (fresh-context code-reviewer, opus; fix-verification + fresh-lane sweep) — verdict APPROVE-WITH-NOTES; 4 findings (1 MEDIUM / 1 LOW / 2 NIT), explicitly ≤5 ⇒ no Trigger-3 escalation; all 16 prior dispositions verified (14 fully APPLIED, 2 flagged as incomplete propagation = findings 1a/1b); all 4 dispositioned:**

1. [MED] Boundary-manifest §7 disposition block still carried the refuted F-10 framing ("WCAG-documented exception") and the non-gate-derivable "24 live matches" — fix-block propagation miss (lesson 97.1 class). APPLIED: bullet rewritten to the design-system-boundary framing + PB-4 pointer + inline-comment disclosure; ratchet line now quotes gate wording and attributes per-file counts to the §7 table; "13 categories" harmonized to "13 series on 11 hex + 2 tokens".
2. [LOW] Registry NEXT=NONE debt parenthetical omitted PB-4. APPLIED: PB-1/PB-2/PB-3/PB-4.
3. [NIT] 174-3 artifact orphaned "as of 2026-09-01" line under the 2026-09-02 sync. APPLIED: dates merged ("validation as of 2026-09-01; synced … on 2026-09-02").
4. [NIT] Sprint 174-5 row omitted locale-percent/lessons gate numbers. APPLIED: "locale-percent 4, lessons 0" appended.

Gates re-run after P3 fixes: parity EXIT=0 (33/33), check:docs EXIT=0 (baseline 95), git diff --check EXIT=0. Pass 4 (final, codification-default 4-pass schedule) verifies these amended lines.

### Post-4th-pass-review fixes (2026-09-02)

**Meta-claim blanket qualifier (Trigger 4 MANDATORY).** Same scope — unaudited meta-claims, qualified collectively.

**Pass 4 (fresh-context code-reviewer, opus; final convergence audit) — verdict APPROVE-WITH-NOTES; 2 findings (1 MEDIUM / 1 LOW), explicitly ≤5 ⇒ Trigger 3 does not escalate; the codification-default 4-pass schedule TERMINATES here (finding trajectory 10→6→4→2, zero CRITICAL/HIGH since pass 2). Both dispositioned:**

1. [MED] Task-9 `#TBD` enumeration declared 4 literals; 6 exist (sprint, registry ×2, artifact header, delivery manifest §1, final handoff §1). APPLIED: enumeration corrected to six; the pre-merge amend now covers all six.
2. [LOW] Pass-3 fix 3 half-applied: the orphaned bare `as of 2026-09-01` line survived under the merged Status line (97.1-class miss). APPLIED: line deleted from the 174-3 artifact.

Pass-4 live gate re-runs (reviewer-side + orchestrator-side after these fixes): parity 33/33 EXIT=0, boundary 459 PASS, docs baseline 95 EXIT=0, locale 4, lessons 0, diff --check 0.

## 10. File List

### Modified (30)
- `.omx/plans/174.3-complete-accessibility-responsive-theme-and-visual-verification.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/` — 23 story artifacts: `167-4-fe-migrate-registration-register.md`, `167-5-fe-migrate-cabinet-onboarding.md`, `167-6-fe-migrate-processing.md`, `167-7-fe-migrate-wb-token.md`, `168-1-fe-migrate-analytics-hub.md`, `168-2-fe-migrate-analytics-alerts.md`, `168-3-fe-migrate-analytical-dashboard.md`, `168-4-fe-migrate-finance-history.md`, `168-5-fe-migrate-orders-analytics.md`, `168-6-fe-migrate-pricing-analytics.md`, `168-7-fe-migrate-product-analytics.md`, `168-8-fe-migrate-reorder-analytics.md`, `168-9-fe-migrate-sku-analytics.md`, `168-10-fe-migrate-time-period-analytics.md`, `168-11-fe-migrate-unit-economics.md`, `169-1-fe-migrate-acquiring-report-index.md`, `169-2-fe-migrate-acquiring-period-detail.md`, `169-3-fe-migrate-acquiring-report-transaction-detail.md`, `169-4-fe-migrate-buyout-analytics.md`, `169-5-fe-migrate-buyout-reconciliation.md`, `169-6-fe-migrate-enhanced-fbs-analytics.md`, `169-7-fe-migrate-fbs-stock-analytics.md`, `174-3-fe-complete-accessibility-responsive-theme-and-visual-verification.md`
- `_bmad-output/planning-artifacts/shadcn-route-ledger.md`
- `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`
- `_bmad-output/planning-artifacts/shadcn-ui-boundary-classification-manifest.md`
- `scripts/check-shadcn-migration-parity.mjs`
- `scripts/__tests__/check-shadcn-migration-parity.test.mjs`

### New (4)
- `_bmad-output/planning-artifacts/shadcn-migration-final-delivery-manifest.md`
- `_bmad-output/implementation-artifacts/epic-166-174-program-retrospective-2026-09-02.md`
- `docs/HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md` (authored by parallel wave; **staged with a normal `git add`** — docs/ is not gitignored; pass-1 F-2)
- `_bmad-output/implementation-artifacts/174-5-fe-finalize-documentation-and-repository-cleanup.md` (this artifact)

**Staging record**: the three `_bmad-output/` new files are gitignored (`.gitignore:59`) and are committed via `git add -f` individually; the docs/ handoff is staged normally; the 30 modified tracked files stage via explicit paths. Nothing is staged with `git add -A`/`git add .` (BE-repo safety rule does not apply here, but the same discipline is kept).

## 11. Change Log

| Date | Wave | Scope | Status |
|---|---|---|---|
| 2026-09-02 | W1+W2 | Tracker syncs (174.2 dup deleted, 174.3 done) + parity gate terminal state (base 0d6225ac, ledger verified-expectation, 3 test SHAs, plan 174.3 canonicalized; 33/33) | implemented |
| 2026-09-02 | W3 | Route ledger planned→verified (76-row evidence table, 54 per-story + 22 collective-audit); 21 frozen Status lines synced; 167.4 checkboxes closed; 167-6 disclosure | implemented |
| 2026-09-02 | W4 | Exceptions disposition (×4 owner-accepted re-confirmed live: 459=459, self-suite 10/10) + C-series dispositions in artifact/manifest/handoff (C6 resolved-by-migration; registry C-table untouched) | implemented |
| 2026-09-02 | W5 | Synthesis docs: delivery manifest, program retrospective, final handoff (parallel wave), this artifact | implemented |
| 2026-09-02 | Closeout | 4-pass fresh-context review converged (10→6→4→2, 22 findings all dispositioned; PB-4 dark-theme WCAG fail discovered + registered); final battery green incl. full vitest 19363/0; PR #379 amended (6 literals) + merged; branch/worktree cleanup 0/0/0; **program 166-174 CLOSED 94/94** | done |
**Lessons:** (1) Adversarial re-verification of own evidence maps refutes ~5% of rows — never flip a ledger on one audit pass. (2) Fix-block propagation misses recur even inside fixes documenting that class — sweep parallel locations mechanically. (3) Base-pinned gates need an explicit re-pin protocol — by-design red-on-main confuses maintainers. |

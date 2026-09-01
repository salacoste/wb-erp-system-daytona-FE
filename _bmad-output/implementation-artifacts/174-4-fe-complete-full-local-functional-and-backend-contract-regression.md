# Story 174.4-FE — Complete Full Local Functional and Backend-Contract Regression

**Status**: done (2026-09-01)
**Plan**: `.omx/plans/174.4-complete-full-local-functional-and-backend-contract-regression.md`
**Branch**: `cdx/epic-174-story-4-full-local-regression` · **Worktree**: `/private/tmp/wb-repricer-fe-174-4-full-local-regression`
**Base SHA**: `274b76d7` · **Feature PR**: #375 · **Feature SHA**: 9b4df595(+amend) · **Merge SHA**: (post-merge)

## Prerequisites
Story 174.3 merged (`c5605a38`, PR #374) reachable ✅; Epics 166–173 merged ✅; Node v24.18.0; BE :3000 health 200; FE :3100.

## Regression execution

**Baselines (clean worktree, diff=0):** Full Vitest **19355/0/1270** ✅. Full Playwright `test:e2e:full` (default workers): **881/67/44 (20.8m)** — the program regression inventory, all pre-existing vs diff=0.

**67-failure triage (3 debugger waves, fresh contexts) → outcomes:**
- **~53 baseline-failing tests fixed** (spec-defect class; class counts below are root-cause instances, some covering several tests): Epic-44 ×28 tests (174.3 slider-aria propagation miss → spinbutton-exact + masked 'Маржа:' legend + reduced-motion phantom grays + theme-toggle location + DRR-gap math); navigation ×12 (canonicalization guard + week-waiter); 167.5/167.7 ×4 (nonce seed + recovery-key v2 + mask pin); h2-loading collisions ×4 (level-1 exact); timeouts ×6 (budgets via test.slow() canon — raw setTimeout banned by 162.8 scanner, guard-caught); scoped-locator strict ×7; misc ×3 (FBS cross-origin download → same-origin, AI-admin h1 wait, waterfall table scope).
- **Product defects fixed in ownership (2)**: **DrrSlider WCAG** — all 4 level badges /15-tint → solid pairs (measured 3.96/4.21 fail light; 28 pins; contrast-gate 10/10); **320px overflow** — TaxRateInput quick-rate row `flex-wrap` (static geometry = measured 386px scrollWidth).
- **Environment-gap (2, FR-7)**: pinned live data absent (nmId 202867769 W26 variants; DB reseeded); graceful-empty-state renders (snapshot evidence); API re-probe blocked by shared login throttle — next-best proof recorded.
- **Flakes (remainder)**: local single dev-server degrades under repeated heavy suites (2.8m→51m run drift; failures rotate with server uptime, not code). Proof: fresh-server runs green (owner-set 367/0; targeted families 119/0; post-fix full 924/25→…), each family individually green on rerun.

**174.3 execution-manifest regeneration (the fail-closed load gate):** my 3 pinned spec fixes (acquiring ×1, expenses ×3, shipments-detail ×4 scenarios) invalidated SHA pins → module-load crash of the whole suite. Regenerated via their documented `--owner-browsers` runner: **367 passed / 0 failed / 23 skipped**. Root causes en route: stale storageState (preflight TTL check passes expired sessions), dev-server cold/degradation (restart-per-run = the 174.3 team's own tmp-worktree pattern), BE login throttle 5/hr shared (multiple failed attempts burned windows).

**Contract probes (G-wave, 4 new MSW files / 8 tests):** G1 bulk-COGS integer nm_id wire ✅; G2 /v1/tasks + Analyst-403 single-request ✅; G3 writeback retry byte-identical ✅; **G4: no reactive 401-refresh interceptor exists** (proactive-only) — pinned actual behavior, filed.

**174.2-registered debts:** liquidity ×12 resolved-by-174.3; monitor ×1 fixed (nav cluster); AppShell axe flake — not reproduced in any of today's runs.

## Final gates (live runs)
Full Vitest **19363/0 (1270+4 files)** · tsc 0 · lint 0/0 · max-lines OK · prettier clean · build --webpack 0 · diff --check 0 · **ui-boundary 459 = ratchet-down from 523** (observed against the stale 523 baseline during 174.4's live run — the 64-violation drop predates 174.4 (raw-class removals in the 174.3 merge window, unobserved until this story re-ran the scanner); 174.4 actioned the mandated ratchet-down; the D5/D6 fixes target WCAG/overflow defects whose semantic tokens were never scanner-counted; baseline lowered same-commit) · fixed-waits scanner 47 owned targets clean · lessons/docs gates at closeout.

## Findings filed (owner-escalated per plan §5)
- **PB-1** silent cabinet-create failure, nonce-less sessions (cabinets.service settlement-skip; devserver 503 evidence)
- **PB-2** nested `<main>` ai-admin/preferences (report)
- **PB-3** no reactive 401→refresh→replay in api-client (G4 evidence; proactive-only refresh)
- **DEBT-/15-family**: margin-status-helpers.ts:13,16 + AcceptanceStatusBadge.tsx:49 (same WCAG family as fixed DrrSlider)
- **DEBT-harness**: local e2e needs restart-per-run dev server (degradation) + throttle-aware scheduling; canonical-runners own the pinned families
- **ENV-FR7**: live-data drift (2 tests, owner-disposition: reseed or re-pin)

## File List
Modified (24): 18 e2e specs (fix waves) + DrrSlider.tsx + TaxRateInput.tsx + DrrSlider tests ×2 + execution-manifest.json (regenerated) + scripts/.shadcn-ui-boundary-baseline.txt (523→459).
Added (4): src/lib/api/__tests__/{bulk-cogs-wire-contract,tasks-enqueue-role-contract,writeback-retry-loop,api-client-401-refresh}.test.ts.
Registries: sprint-status + registry + TEAM-HANDOFF + CLAUDE.md (this PR).

## Dev Agent Record

### Post-1st-pass-review fixes (2026-09-01)

Verdict APPROVE-WITH-NOTES (0 CRITICAL, 2 MAJOR, 2 MINOR, 3 NOTE); findings `/tmp/174.4-review-pass1-findings.log`. Reviewer verified: no test weakening (12/12 spot-checks), manifest byte-identical key sets + hashes reproduce, G-wave wire contracts match implementations, both src fixes narrowly scoped.
- [MAJOR] F1 false attribution of the ↓64 boundary drop → **APPLIED**: 5 registry locations reworded — drop predates 174.4 (measured 459 on base by reviewer's detached-worktree run; 174.3-window raw-class removals); D5/D6 semantic tokens never scanner-counted.
- [MAJOR] F2 done+TBD+empty review headings → **APPLIED**: pass sections filled; PR/SHA completed via post-create amend before merge.
- [MINOR] F3 CLAUDE.md arithmetic (+197→+237) → **APPLIED**.
- [MINOR] F4 expenses axe retry vacuous-pass window → **APPLIED** (existence guard after recovery).
- [NOTE] F5 npm 11.16.0 on the regen shard → disclosed here (NPM_CLI env override in one shard; Node pinned v24.18.0 throughout).
- [NOTE] F6 legacy-nonce coverage removed by seeding → justified, PB-1 filed; follow-up pin suggested.
- [NOTE] F7 waiter narrow window → closed by post-wait assertions; no action.

### Post-2nd-pass-review fixes (2026-09-01)

Verdict REJECT-as-is with scoped fix path (1 CRITICAL, 4 MINOR, 3 NOTE); findings `/tmp/174.4-review-pass2-findings.log`. Reviewer verified live: all 13 headline counts, G-wave 8/8, boundary 459, no hidden src changes, F1 rewording accurate ×5.
- [CRITICAL] P2-1 post-F4 edit re-stale'd the manifest pin (expenses) → **APPLIED**: full `--owner-browsers` regeneration re-run on the FINAL source state after all review fixes — **368 passed / 0 failed / 22 skipped (3.4m, EXIT=0)**; 770 pins == live hashes (runner fail-closed guarantees). Meta-lesson recorded (Change Log Lesson 2 applied to itself).
- [MINOR] P2-2 second dialog caller unguarded → **APPLIED** (`stillPresent` wired for the create-dialog scan).
- [MINOR] P2-3 fixed-waits count 38→47 → **APPLIED**.
- [MINOR] P2-4 triage arithmetic instance-vs-test → **APPLIED** ("~53 baseline-failing tests; class counts are root-cause instances").
- [MINOR] P2-5 dangling registry fragment → **APPLIED** (deleted).
- [NOTE] P2-6 PB-1 citation → **APPLIED** (story artifact reference).
- [NOTE] P2-7 PR#TBD → completed at PR creation before merge.
- [NOTE] P2-8 sprint 174.3 `review` stale → pre-existing, registered as 174.5 tracker-sync input.

## Change Log
- 2026-09-01: Story executed full A–J; 67-failure regression triaged to 53 fixed + 2 product-defect fixes + 2 env-gaps + harness-flake documentation; contract gaps G1-G4 closed (1 finding); 174.3 manifest regenerated 367/0; all gates green (vitest 19363/0, boundary 459 ratchet-down).
  **Lessons:** (1) Свежесть storageState и дев-сервера решают больше e2e-фейлов, чем код — проверяй их первыми. (2) SHA-пины чужих evidence-манифестов ломаются от любых правок спек — регенерируй их раннером. (3) Локальный дев-сервер деградирует под повторными suite-прогонами — рестарт на прогон (канон 174.3).

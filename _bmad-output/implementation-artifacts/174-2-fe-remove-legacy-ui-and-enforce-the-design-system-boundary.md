# Story 174.2-FE — Remove Legacy UI and Enforce the Design-System Boundary

**Status**: done (2026-08-31)
**Plan**: `.omx/plans/174.2-remove-legacy-ui-and-enforce-the-design-system-boundary.md`
**Branch**: `cdx/epic-174-story-2-legacy-enforcement` · **Worktree**: `/private/tmp/wb-repricer-fe-174-2-legacy-enforcement`
**Base SHA**: `fbdab2da` (Story 174.1 closeout merge, PR #370)
**Feature PR**: #372 · **Feature SHA**: (recorded post-commit) · **Merge SHA**: (recorded post-merge)

## Prerequisites

- Story 174.1 merged: `360c9cb9` (PR #369) — reachable from base ✅
- All route migrations (Epics 166–173) merged; Epic 173 closed 13/13 ✅
- Prerequisite SHAs reachable from local `main` at base ✅

## Outcome Summary

Executed the debt-cleaning mandate of TEAM-HANDOFF §3 in six executor waves + orchestrator validation:

| Wave | Scope | Agent/model |
|---|---|---|
| W1 | 30 dead files deleted + 6 dead functions + 10 barrel edits + monitoring guard catalog 32→29 | executor/sonnet |
| W1b | 31 unlock-chain deletions (seasonal/trends/period-comparison/price-calc tail) + tsc fix + /80 + stale comments | executor/sonnet |
| W2A | monitoring-constants STATUS_COLORS, getMarginColor dedupe (canonical 168.3 tiers), advertising-widget-helpers, supply-planning configs | executor/sonnet |
| W2B | orders-analytics-utils ×5 helpers, getDiscrepancyColor, liquidity-action-benchmark + 48 pins | executor/sonnet |
| W2C | wb-status-data trio 35 entries → solid status pairs + 33 pin rewrites | executor/opus |
| W3 | 171.9 carry-outs (STATUS_BADGE_CONFIG.className → MODEL_LIST_BADGE_CLASS + 2 stale comments + guard pins + anchor-hardening ×2), C2/PriceBasisBadge/ExportStatusDisplay, C10 KPI-icon canon (4 FBS sections), C16 double-cast + chart-token-as-text | executor/sonnet |
| W4 | `scripts/check-shadcn-ui-boundary.mjs` + node:test self-suite + ratchet baseline 523 + classification manifest + 174.1 carry-in config fixes | executor/opus |

**Totals**: 65 files deleted (−13 022 lines), ~74 modified, 4 added (scanner, self-suite, baseline, classification manifest). Diff: +627/−13 022.

**Design decisions (documented at each site)**: indigo→`status-information` (6 delivery statuses — conservative, avoids overloading pending); orange→`status-warning` collapse (incl. organic 0–20 band, post-review); lime→`status-success`; yellow-400→warning valence; stale/no_data→`muted`; WbStatusBadge = SOLID `bg-status-X text-status-X-foreground` pairs (mixed text-xs/text-sm sizes, 173.12 WCAG canon); purple→`status-pending` (hue 277, 172.14 canon).

**Carry-ins executed**: (a) 174.1 main-RED fix — `vitest.config.ts` exclude + `playwright-static-boundary.ts` SELF_TEST_MODULES for the parity node:test suite (their plan required no full vitest run; the omission shipped main at 19873/1); (b) 171.9 carry-outs ×5; (c) `SUPPLY_STATUS_CONFIG` whole-file delete (production-dead, live badge has own STATUS_CONFIG); (d) lib-wave §3.1 complete; (e) C3/C4 (`getProfitabilityColor`/`BgClass`, `getHealthScoreInfo` — barrel-only), C16, C10, C2, `PriceBasisBadge`, `ExportStatusDisplay`, `getMarginColor` dedupe, `getFrozenCapitalStatusClass`, `PROFITABILITY_HEX`; (f) /80-on-text reconciliation in MarginCard/GrossMarginCard.

**Raw-palette classification manifest** (§11.10 contract): `_bmad-output/planning-artifacts/shadcn-ui-boundary-classification-manifest.md` — fresh post-wave scan, 6 categories, arithmetic-closed 514(cat1)+1(cat2)+8(cat6-counted) = 523 = ratchet baseline; 65 cat-4 deletions listed; 11 cat-3 resolved; 4 cat-5 exceptions == `BOUNDARY_EXCEPTIONS` exactly. Pre-wave recon baseline: 94 candidates (not ~139 — methodology delta recorded). Cat-1 residue (59 files) is ratchet-registered for owner-sweep (C14 pattern); "registered" = baseline-grandfathered.

## Validation Evidence

| Gate | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | 0 errors |
| Lint | `npm run lint` | 0 errors / 0 warnings |
| Max-lines | `npm run check:max-lines` | OK (200/800 caps) |
| Prettier | `--check` on all changed files | clean |
| Build | `npx next build --webpack` | exit 0 |
| **Full Vitest** | `npm test -- --run` | **19118 passed / 0 failed / 1234 files** |
| Boundary | `node scripts/check-shadcn-ui-boundary.mjs` | exit 0, 523 = baseline 523 |
| Boundary self-suite | `node --test scripts/__tests__/check-shadcn-ui-boundary.test.mjs` | 10/10 |
| diff --check | `git diff --check` | clean |

**Floor movement** (legitimate, exact): 19874/1256 → **19118/1234** = −756 tests / −22 files, all from proven-dead test files deleted with their production owners (import-closure proved per file, reviewer-verified pass 1). No live test deleted.

**E2E** (npm wrapper, worktree dev `--webpack -p 3100`, pm2 dance): affected routes orders×3 (incl. axe PASS), monitoring×6, supply-planning×15, fbs-enhanced, dashboard-metrics, monitor partial — **69 passed / 2 skipped / 14 failed, 0 attributable to this diff**: 13 failures bisect-proven pre-existing on clean base `fbdab2da` (liquidity 162.5×8 + liquidity-trends×4 + monitor weekly-chart×1 — clean-main run `/tmp/174.2-bisect-e2e.log`: same 13 fail) + 1 axe flake (`scrollable-region-focusable` on AppShell `<main>`, untouched by diff; passes on clean run). Pre-existing liquidity/monitor e2e failures registered as debt (owner 174.4). Visual/theme/zoom evidence N/A-wide per §11.6 — consolidated matrix owned by 174.3; this story's rendered changes are class-string swaps pinned by unit suites + orders-axe green.

## Independent Review

Two adversarial passes, separate fresh contexts (code-reviewer/opus), reviewer ≠ author:

### Post-1st-pass-review fixes (2026-08-31)

Verdict APPROVE-WITH-NOTES (0 CRITICAL/MAJOR, 2 MINOR, 3 NOTE); findings `/tmp/174.2-review-pass1-findings.log`.
- [MINOR] manifest justification trail unshippable → **APPLIED**: manifest + baseline committed via `git add -f` (same pattern as sprint-status/registry).
- [MINOR] "/80 banned" claim unenforced → **APPLIED**: comment rescoped + follow-up registered.
- [NOTE] ratchet semantics → PR body: "registered = baseline-grandfathered" (locale-percent precedent).
- [NOTE] carry-in scope + WB shade consolidation → disclosed here + PR body.

### Post-2nd-pass-review fixes (2026-08-31)

Verdict APPROVE-WITH-NOTES (1 MAJOR, 1 MINOR, 6 NOTE — all intentional beyond-class-string changes disclosed); findings `/tmp/174.2-review-pass2-findings.log`.
- [MAJOR] manifest count chain 524≠523 (my post-W4 advertising-residue fix wasn't reflected) → **APPLIED**: manifest corrected (524→523 ×3, cat1 60→59 files / 515→514, components 282→281, row reclassified to cat-3; derivation "adds 4→3"); scanner/baseline/script were already mutually consistent at 523.
- [MINOR] /80 comment undercounted repo-wide sites → **APPLIED**: rescoped to repo-wide framing.
- Post-fix re-verification: boundary 523=523 PASS, prettier clean, margin-family suites 24/24.

## New Debt Registered (this story → registry APPEND)

1. **Liquidity + monitor-chart e2e failures pre-existing on main** (13 tests; bisect evidence) — owner **174.4** regression lane.
2. **Repo-wide text-/80 sweep** (pricing/automation/cashflow/popover families + hover variants) — contrast §11.3 follow-up; scanner extension candidate.
3. **Boundary ratchet cat-1 residue 59 files / 514 violations** — owner-sweep via ratchet (C14 pattern); per-route counts in manifest.

## File List

Deleted (65): Telegram trio+test, WbTokenBanner, ExportConfigForm, Seasonal family ×5+tests, TrendsSummary pair, SummaryCard/DeltaIndicator/delta-helpers, period-comparison trio+helpers, price-calculator legacy tail ×10+tests, margin-sku ×5, KPICard pair, MetricCard+test, supplies helpers+barrel+tests, unit-economics/sku-financials dead fns (in-place edits), liquidity-formatters fn, period-presets+test.
Modified (~74): lib color maps ×10, monitoring guard, models route ×6, orders components/pins ×8, liquidity ×6, supply-planning consumers, dashboard cards, advertising, FBS ×4, financial trio, vitest.config.ts, playwright-static-boundary.ts, 12 test/pin files.
Added (4): `scripts/check-shadcn-ui-boundary.mjs`, `scripts/__tests__/check-shadcn-ui-boundary.test.mjs`, `scripts/.shadcn-ui-boundary-baseline.txt` (523), `_bmad-output/planning-artifacts/shadcn-ui-boundary-classification-manifest.md`.

## Change Log

- 2026-08-31: Story executed full A–J; all gates green; 2-pass review APPROVE-WITH-NOTES both, all findings APPLIED; floor moved 19874/1256→19118/1234 exact (dead-test deletion); e2e 0 diff-attributable failures with clean-base bisect proof; carry-ins (174.1 main-RED fix, 171.9 ×5, lib-wave, C-series) complete; boundary enforcement shipped with ratchet 523 + self-suite 10/10.
  **Lessons:** (1) Волны executor'ов правят без tsc/vitest — вся валидация соло, ноль гонок на 137-файловом диффе. (2) Pre-existing e2e-фейлы доказывай бисект-прогоном на чистом main ДО поиска причины. (3) Манифест-подсчёты устаревают при пост-ревью фиксах — обновляй счётчики тем же коммитом.

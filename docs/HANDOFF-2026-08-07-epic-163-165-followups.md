# Handoff — Epic 163–165 FE: Remaining Debt + Deferred Items

**Date:** 2026-08-07
**FE `main`:** `cf154baf`
**Scope:** follow-ups after the Epic 163–165 FE actionable scope was completed.
**Audience:** OMC subagents (executor / verifier) — each item is a self-contained task with **What / Unblock / Steps / Validation**.

## Current state (what's done)

Epics 163 + 164 are **complete**; 165.1–165.3 were already done by a prior (codex) session (PRs #87/#89/#90 + OpenWiki regen). This session shipped:

| Story | PR | Notes |
|---|---|---|
| 163.3 automation editor | #118/#119 | 2-pass review + verifier + live E2E 11/0 |
| 163.4 0 ₽ vs — | #120 | resolves iter-58; live E2E 18/0 |
| 163.5 naive-baseline units | #121 | mutation-verified zero-test |
| 163.6 period Tabs→RadioGroup | #122/#123 | done by concurrent orchestrator (pid 30574); independently verified |
| 164.1 interceptor tests | #124 | 87 tests, zero prod change |
| 164.2 Recharts typed tooltip | #125 | removes `as any`; AC#3 mutation-verified |
| 164.3 tariff stubs + dedup | #126 | bounded fallback-warning dedup; calc results byte-identical |
| 164.4 react-dom meta + zero-warning lint | #127 | `--max-warnings 112`→0; build green |
| CLAUDE.md Playwright policy | #128 | visual-verification Chrome→Playwright |

Sole active orchestrator; worktree tree clean; vitest floor 17721.

---

## Section 1 — Actionable debt (can do now)

### D1. BE `frontend/` mirror sync — HIGH priority, DELICATE (recommend explicit owner authorization)
**What:** the BE repo (`wb-repricer-system-new`) tracks a full `frontend/` mirror that is now ~111 files behind FE `main` (all 162.x–164.x work since mirror-sync PR #117 @ `5c88e307`).
**Unblock:** none (purely operational) — but the pre-commit hook blocks bulk `frontend/` staging >25 files without `FRONTEND_MIRROR_OK=1`, and a bad sync can **delete files**.
**Steps:**
1. `cd` BE repo; ensure on a fresh branch off `main`.
2. `FRONTEND_MIRROR_OK=1 git add frontend/`
3. **Verify no unexpected deletions**: `git diff --cached --stat frontend/ | grep -E '^ delete'` — every deletion must correspond to a real FE-removal, never drift.
4. `git commit -m "chore(frontend): sync mirror to FE cf154baf (Epics 162-164)"`.
5. PR `chore(frontend): sync mirror …` → merge.
**Never** `git add -A` in the BE repo (sweeps the shared FE tree). Stage `frontend/` explicitly only.
**Validation:** BE `main` builds; `git -C frontend log -1` == `cf154baf` family; mirror has no spurious deletions.

### D2. npm audit — fix the 3 pre-existing transitive advisories
**What:** `npm audit --audit-level=high` reports 3 transitives NOT introduced by 164.4 (not fixed there to avoid lockfile churn): `brace-expansion` + `js-yaml` (high), `postcss` (moderate, nested copy — root already pinned to 8.5.23 via `next.postcss` override).
**Unblock:** none.
**Steps:** `npm audit fix` in a fresh FE branch; review `package-lock.json` churn (should be only the 3 transitives); `npm run rebuild`-equivalent gates (tsc/lint/test/build) green.
**Validation:** `npm audit --audit-level=high` → 0; vitest/build still green.

### D3. OpenWiki regeneration (reflect 163.3–164.4)
**What:** `openwiki/.last-update.json` is at 2026-08-06 (`gitHead d70cfd1f`) — predates this session's 163.3–164.4. The scheduled GitHub Actions workflow auto-refreshes, but a manual regen gives a current snapshot.
**Unblock:** none.
**Steps:** run the configured OpenWiki generator (e.g. `npm run openwiki:update` or trigger the workflow) using the **`/api/anthropic` endpoint** — NOT coding-paas (404s; see memory `openwiki-coding-paas-incompatible`).
**Validation:** `openwiki/.last-update.json.gitHead` == current FE `main`; pages mention the new automation editor / tariff dedup / typed tooltip.

### D4. `recon/story-163.3-parallel-11351` branch disposition
**What:** local-only branch preserving the alternate `rules/`-route automation editor from the stopped orchestrator pid 11351. Superseded by the merged `installed-rules/` version (PR #118).
**Unblock:** none.
**Steps:** default — `git branch -D recon/story-163.3-parallel-11351` (superseded). If the alternate naming/route is wanted for reference, `git push origin recon/...` first.
**Validation:** none.

---

## Section 2 — Deferred (backend-gated; NOT actionable until backend ships)

### 165.4 — Liquidity Trends (FR11)
**Unblock:** backend daily-snapshot contract — non-empty daily liquidity snapshots exposed via API. Currently no live contract → parked.
**When unblocked:** FE adds a daily liquidity-trend view (chart + table) consuming the snapshots; boundary-normalizer + hook + tests + E2E.

### 165.5 — Per-Status Backfill Retry (FR12)
**Unblock:** backend per-status retry contracts. Currently no live contract → parked.
**When unblocked:** FE adds per-status backfill-retry controls consuming the contracts.

---

## Section 3 — Lessons (context for subagents)

- **Dual-orchestrator collisions** recurred (stale pid 11351 on 163.3; pid 30574 on 163.6 which *merged ahead* while the owner deliberated). Detection + reconciliation recipe in memory `concurrent-claude-sessions-shared-worktree`. Always re-scan `ps`/`lsof` for racers before starting a story; verify merged parallel output rather than blindly redoing.
- **Stale brief:** the orchestrator brief listed 165.1–165.3 as remaining, but `sprint-status.yaml` showed them done (PRs #87/#89/#90). Always `grep sprint-status.yaml` for a story row before implementing (Story 105.2 no-op pre-flight applies to whole epics).
- **Falsifiable-test discipline:** three stories (163.4, 163.5, 164.2) shipped with initially non-falsifiable zero-vs-null assertions; each was hardened + mutation-verified before merge. Apply the same to any zero/null/missing-data test.

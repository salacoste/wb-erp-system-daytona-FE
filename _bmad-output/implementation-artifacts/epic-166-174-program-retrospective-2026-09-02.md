---
initiative: shadcn-full-ui-migration
artifact: program-retrospective
scope: epics 166-FE..174-FE
date: 2026-09-02
base: 0d6225acb9abfafa872d2d2ee45f215594edc4e6
---

# Program Retrospective — Epics 166-174 (shadcn full-UI migration)

> Subsumes the epic-173/174 retro stubs. Written at Story 174.5 closeout (program 94/94).
> Companion documents: final delivery manifest (`_bmad-output/planning-artifacts/shadcn-migration-final-delivery-manifest.md`),
> final handoff (`docs/HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md`).

## What we set out to do

Migrate the entire frontend UI (76 routes, ~100 table-related and ~50 chart-related component surfaces) to
shadcn/ui primitives plus a semantic token system, under BMAD story discipline: one story / one branch / one
worktree / one PR each, route-ledger ownership, a per-story evidence schema, WCAG 2.2 AA as the accessibility
target, and zero change to established behavior, API contracts, and calculations. Epics 166-173 carried the
foundation → AppShell/auth → analytics core → operational analytics → marketing analytics → supply/settings →
consolidation; Epic 174 was reserved for final audit (parity, boundary, visual/a11y, regression, docs cleanup).

## What actually happened

- **94/94 stories shipped across 9 epics, 2026-08-11 → 2026-09-02**; all epics CLOSED; final main base `0d6225acb9abfafa872d2d2ee45f215594edc4e6`. PR numbers ran into the #370s (the final audit window alone was #369–#376; feature + closeout PRs per story were the norm).
- The route ledger reached **76/76 `verified`** only at Story 174.5, after a full per-row evidence audit: 54 rows with complete per-story chains, 22 early-wave rows whose cleanup link was satisfied by a collective live-absence audit.
- Test floor grew to **19 363 / 0 failed** (1 270 + 4 files). Full trajectory: 19 055/0 at Story 169.13 (2026-08-25) → 19 874/0 at 173.13 (+819 across Epics 170-173) → 19 118 after 174.2's deliberate −756 dead-test deletion → 19 355 (+237, 174.3 window) → 19 363 (+8 contracts, 174.4).
- The design-system boundary went from unenforced → ratchet 523 (174.2 created the gate) → **459** (174.4 lowered it); 4 exceptions are registered with owner/debt IDs. The locale-percent precedent (108→4, iter-67) supplied the ratchet semantics.
- Epic 174 did more than audit: it deleted 65 proven-dead legacy files (−13 022 lines), fixed 53 spec defects plus 2 real product WCAG/layout defects (174.4), built the committed visual/a11y corpus, and exposed 3 live product defects (PB-1/2/3) plus the harness realities below.

## What worked

1. **Immutable-SHA evidence + fail-closed gates.** 174.1 parity (94 stories = 94 plans = 76 routes = 76 ledger rows = 76 owners, SHA-pinned) and the 174.3 execution manifest made "done" machine-checkable instead of narrative. Corollary learned the hard way: any edit to a pinned spec breaks e2e module-load — regeneration only via the dedicated runner.
2. **Ratchet semantics beat day-0-zero.** The boundary gate (523→459) and locale-percent (108→4) both converged via "registered = baseline-grandfathered; exit 1 only on increase" — migration-sized change became committable without a fictional zero-state.
3. **Two-pass fresh-context review catches false attributions.** 174.4 pass-1 initially mis-attributed the ↓64 boundary drop; the second pass corrected the record (the drop predates the story, 174.3-window). Confirms the standing repo rule (Stories 94.3/97.4).
4. **Baseline live re-run.** A recorded floor in CLAUDE.md had lagged reality; re-running gates live instead of trusting recorded numbers corrected it.
5. **Automation ≥ heroism.** Deterministic regeneration runners (174.3 manifest, 174.4 regen) beat manual chasing of flakes; the parity suite turned a documentation claim into 33 deterministic tests.
6. **Adversarial verification of evidence maps pays immediately.** The independent verifier refuted 4 of 76 rows the builder had marked FULL (167.5/167.6/167.7 CLEANUP, 167.4 partial), forcing the cleanup-audit rescope 18→22 and correcting the full-chain tally 58→54 — before merge, not after.

## What hurt

1. **Fix-block propagation misses.** The 174.3 propagate-miss produced 28 avoidable e2e failures — re-confirming lesson 97.1: after any fix, grep the exact modified phrase across all related files; author intuition underestimates the parallel-locations search space.
2. **Environment ≠ code.** storageState TTL (~1h), shared dev-server degradation, and the BE 5/hr login throttle together generated ~150 phantom test failures that looked like regressions. Diagnosis discipline (fresh server, `rm e2e/.auth/user.json`, throttle budgeting) is now canon.
3. **Dev-server degradation.** One shared `next dev` drifts 2.8m → 51m and flake-waves grow with uptime; restart-per-run (tmp-worktree + dedicated server inside runners) became the standard.
4. **Parallel lanes freeze artifacts mid-flight.** 21 early-wave artifacts carried stale pre-merge Status prose while their sprint rows and PRs recorded full delivery; tracker drift accumulated silently until 174.5 synced it (with historical text preserved in parens). Cross-lane sync needs an explicit disclosure step, not goodwill.

## Structural lessons for future programs

- **Base-pinned gates need an explicit re-pin protocol.** A suite green only in its story worktree (parity `EXPECTED_BASE_SHA`) confuses maintainers when run on main post-merge. Document the pin, the by-design mismatch, and the re-pin procedure in the final handoff — done for 174.5 (final handoff §3; the gate itself received only the two terminal-state literal changes, per its frozen fail-closed design).
- **Adversarial verification of evidence maps is a distinct deliverable**, not an optional courtesy: budget a fresh-context verifier pass over every "N-of-N complete" claim before close.
- **Parallel-lane artifact sync needs disclosure discipline**: when lanes freeze an artifact at pre-merge state, the sync (and its disclosure row) must be part of the closing story's contract.
- **Register exceptions with owner/debt IDs at creation time** (BOUNDARY_EXCEPTIONS pattern) — every accepted deviation stayed auditable through three epics of churn.

## Explicitly not covered

Everything owner-scoped and still open — product defects PB-1/2/3, WCAG `/15`-family and `/80` sweeps, the 459-violation boundary residue (~59 files, owner-sweep), FE-D/SEC-DOC security lane, FR-7 data reseed, real-screen-reader matrix, and the process leftovers (format warnings, docs-95 baseline split, route-guard unification, pm2 registration) — is enumerated with statuses, fix-canons, and evidence in `docs/HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md` § Debt escalation. It is deliberately outside this program's closeout.

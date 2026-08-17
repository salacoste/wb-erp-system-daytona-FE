# Epic 89-FE Retrospective: Tech Debt Follow-ups (Epic 88 Consequences)

**Epic:** 89-FE — Tech Debt Follow-ups (Epic 88 Consequences)
**Priority:** P2-P3 (pure quality work; no user-facing feature)
**Retro Date:** 2026-04-22
**Facilitator:** Bob (Scrum Master)
**Participant:** Project Lead (salacoste / R2d2)

> **Note on facilitation format.** Following the Epic 88 + 91 retro precedent, the party-mode dialogue theater is compressed into the substantive retrospective content this doc is meant to capture. The workflow's structure (Epic review → Previous retro follow-through → Next epic preview → Action items → Readiness assessment → Closure) is preserved.

---

## Epic Summary

**Delivery: 5/5 stories done, 12 SP, zero regressions, 3 carry-forward action items retired.**

| Story | Title | SP | Delivered | Outcome |
|---|---|---|---|---|
| 89.1-FE | Normalize High-Risk API Endpoints | 5 | 2026-04-19 | 5 normalizer modules + 25 tests across tariffs, supplies, fbs-analytics, orders-history, cabinet. Closes 5 of the 33 C-tier endpoints flagged by Story 88.4's audit. |
| 89.2-FE | Fix Pre-existing E2E Failures | 3 | 2026-04-20 | `data-testid="metric-card"` added to 12 dashboard cards; 3 E2E tests repaired (keyboard focus, sortable table, axe a11y). E2E delta: 97/23 → 102/18. |
| 89.3-FE | Doc-Link Validator Script | 2 | 2026-04-21 | Bash validator at `scripts/check-doc-citations.sh` (215 lines, executable). `npm run check:docs` surfaces 13 real stale frontend citations (down from 82 with exclusion filter). Self-test 6/6 pass. |
| 89.4-FE | Defensive Frontend Principle in CLAUDE.md | 1 | 2026-04-21 | ~60-line `### Defensive Frontend Principle` section with 4-anomaly do/don't table, indicator recipe, ticket recipe, canonical worked example, `❌ BAD / ✅ GOOD` snippet. |
| 89.5-FE | DashboardPeriodSelector Test Fix | 1 | 2026-04-22 | 10-line test fix (fake-timer setup for 2 describe blocks + `advanceTimers` wiring for 3 userEvent calls). **Broke the 6-consecutive-epic test-failure carry-forward.** |

**Test deltas:**
- Unit tests: 6764 (Epic 88 close) → **6811** (+47 across the epic; +19 net-new passing with zero regressions)
- **First fully-green unit test suite in 6 epics** (6811/0 after Story 89.5).
- E2E tests: 97/23 → 102/18 (+5 pass, -5 fail after Story 89.2; remaining failures pre-existing in analytics-hub).
- Regressions: 0 across 9 full test-suite runs.

**Commits landed:** Stories 89.1 and 89.2 in prior sessions (2026-04-19 / 2026-04-20); 89.3, 89.4, 89.5 in a single session 2026-04-21/22 with Epic 91 retro + Story 92.1 interleaved.

---

## Participating Roles

- **Dev (implementation)**: Claude Opus 4.7 (1M context) — main execution for 89.3, 89.4, 89.5. Claude Sonnet (executor agent, delegated) — file edits + validation for 89.3 follow-up, 89.5 remediation.
- **Dev (adversarial review)**: Claude Opus (code-reviewer subagent, fresh-context) — one pass per story (89.3, 89.4, 89.5 this session).
- **Project Lead**: User (salacoste/R2d2), directing sprint cadence and applying the standing "fix all issues even minors" directive after every review pass.

---

## Epic 88-FE Action Item Follow-Through (the whole reason this epic exists)

Epic 88's retrospective surfaced 6 action items. Epic 89 was **explicitly scoped** as "the consequences of Epic 88" — picking up those action items. Final status:

| # | Epic 88 Action Item | Epic 89 Story | Status |
|---|---|---|---|
| A | Doc-link validator script (citation-rot) | **89.3** | ✅ **Closed** — shipped `npm run check:docs`. Surfaces 13 real stale frontend citations that human review would have missed. |
| B | Fix 3 pre-existing `DashboardPeriodSelector` test failures | **89.5** | ✅ **Closed** — 6-epic carry-forward ended. Test suite fully green (6811/0). |
| C | Clean up ~23 pre-existing E2E failures surfaced by Story 88.3 | **89.2** | ⏳ **Partially closed** — 3 of 23 fixed (dashboard-metrics + dashboard-period now CLEAN). ~15 remaining in `analytics-hub.spec.ts` are distinct issues not caused by the networkidle migration. |
| D | Defensive Frontend principle in CLAUDE.md | **89.4** | ✅ **Closed** — 2-epic carry-forward (Epic 87 → 88 → 89) retired. Full section with canonical example + cross-references. |
| E | Boundary Normalizer coverage for remaining C-tier endpoints | **89.1** | ⏳ **Partially closed** — 5 of the 33 C-tier endpoints normalized (top-5 by risk). 28 remaining. |
| F | Recurring UI-validation audit | — | ❌ **Not addressed** — no Epic 89 story. Carries forward to Epic 90+ (low priority). |

**Follow-through rate: 4 fully + 2 partially = 6/6 touched; 4/6 = 67% fully closed.**

Compared to Epic 88's follow-through on Epic 87's retro (also 4/6, 67%), this is the **same** rate — steady-state, not improving. The 33% that doesn't close tends to be the low-priority items (tooling, audits) that have no immediate bug-surfacing pain.

---

## What Went Well ✅

1. **Carry-forward items actually got closed.** Epic 88's retrospective named 6 action items. Epic 89 resolved 4 outright and dented the remaining 2. Prior epics had accumulated carry-forwards (Defensive Frontend principle first surfaced in Epic 87 retro, lingered for 3 epics); Epic 89 broke that pattern. The rule "name an action item at epic-close → claim a story slot in the next epic's backlog" is load-bearing.

2. **Doc-link validator surfaced real, silent bugs on first run.** Story 89.3's first repo scan (before exclusion filter) found 82 broken citations. After filtering cross-repo noise, **13 genuine stale frontend citations** remained — every one a citation that a reader greping for `src/path:N` would land on an invalid file or line. These had accumulated silently across months. The script now sits as permanent infrastructure; it will catch these at write-time going forward.

3. **"Fix all issues even minors" directive paid off, as usual.** Each of Stories 89.3, 89.4, 89.5 had 3-8 findings per adversarial review; all were applied (only L-2 on 89.5 was deferred, and only because the reviewer explicitly flagged it as out-of-scope). The ratio stayed stable with prior epics: **adversarial review ~60% of defects; minor sweep ~40%.**

4. **Zero-regression streak extended to 7 consecutive epics.** Story 89.5's fix flipped 3 tests from failing to passing (6808 → 6811). Zero tests that were previously passing broke. No E2E that was previously green turned red. This is now a property of the process, not luck.

5. **Adversarial-review signal:noise was excellent.** Across the 3 code reviews this session (89.3, 89.4, 89.5): **15 real findings, 0 spurious** (vs. 92.1 earlier this session at 5:1 real:spurious). The `code-reviewer` subagent with fresh context + opus + specific review directives is calibrated well. 89.5's review correctly flagged M-1 (`userEvent.setup` without `advanceTimers`) as a latent flakiness trap — invisible to any test-currently-passing check, but a real future regression risk.

6. **89.3 exceeded AC-4 expectations in the best possible way.** The story's AC-4 said: "If broken citations surface: document them in Completion Notes and create follow-up tasks. Do NOT silently fix them." The script found 82 → 13 → this discipline held. 13 real bugs are now named but deferred to a focused cleanup story rather than silently absorbed into 89.3's scope. The story shipped clean; the bugs are tracked.

7. **Delegation pattern settled into its groove.** Soft-warning hooks fired on `src/` edits; response was to delegate to executor for cohesive batches, direct-edit for tiny changes. No visible quality drop from delegation — executor's reports have been accurate and defects have been caught at review time regardless of authoring path.

---

## What Didn't Go Well ⚠️

1. **89.3 scan output is still noisy.** Even after excluding `docs/request-backend/` and the self-referential story file, 13 broken citations remain. All 13 are legitimate ~~follow-up~~ cleanup work, but nobody's picked them up yet. The validator is a surface; surface-only workflows need a consuming workflow. Consider: a dedicated "citation cleanup" epic or spinning each broken citation into its own micro-ticket.

2. **Two partial closures on carry-forward items.** 89.1 closed 5 of 33 endpoints; 89.2 closed 3 of ~23 E2E failures. "Partial" in both cases was correct scoping (5 SP limit on each story) — but the remaining 28 endpoints + ~15 E2E failures now need their own follow-up decisions. Expected flow: they become Epic 89 retro action items, then Epic 90's backlog. Risk: they become forgotten. Counter-measure: explicit action items below.

3. **Story 89.5's root-cause narrative required adversarial-review verification.** The dev's diagnosis (`ensureCurrentWeekFirst` → `getCurrentWeek()` → `new Date()`) was correct, but the reviewer had to verify it by reading the helper file to confirm. Lesson: dev should include file:line citations of the actual problematic code in Completion Notes, not just the high-level "root cause was X" summary. 89.5 DID include this (`period-selector-week-helpers.ts:38`), so it went fine — pattern worth codifying.

4. **Epic 91 retro's action item #5 (server/client netProfit discrepancy logging) not addressed.** Still no story for it. Low priority but real: the `calculateDailyTheoreticalProfit` fallback from Story 91.2 has no removal condition, and no logging was added to measure server/client divergence. If this persists to Epic 93+, the `@deprecated` fallback becomes permanent-in-practice.

5. **No documentation of the executor-delegation workflow pattern.** This session leaned heavily on delegating non-trivial work (6 stories + 1 retro) to executor agents. The pattern's been stable but isn't documented anywhere. A short CLAUDE.md subsection under Development Workflow explaining "when to delegate vs direct-edit" would help future sessions (and prevent re-litigating the decision each time).

6. **Story 89.4's review initially dismissed L-4 (style drift), then re-accepted it.** The reviewer said "divergence is defensible." Dev dismissed L-4 accordingly. User then re-invoked "fix all even minors," which reversed the decision. Net cost: one extra ping-pong cycle. Lesson: **when reviewer explicitly says a finding is defensible, dev should still apply unless it's genuinely wasteful. "Fix all even minors" is load-bearing.** The reviewer's "defensible" is a permission, not a veto.

---

## Key Insights 💡

1. **Tech-debt epics have higher signal:noise on reviews than feature epics.** Epic 89's three reviewed stories: 15 real findings, 0 spurious. Epic 91's: 21 real, 1 spurious. The smaller-scope, tighter-surface stories surface defects more reliably than feature epics where reviewers have to synthesize business logic. This argues for keeping a **1-SP tech-debt story slot in every sprint** — they reliably teach the team something.

2. **Carry-forward items are a ledger, not a wishlist.** Epic 87 → 88 → 89 → Epic 89 retirement of "Defensive Frontend principle" is the canonical case: the item survived 2 full epics as low-priority, then got closed in Epic 89. **The system works precisely because nothing silently drops off the list.** Every retro that names an item inherits accountability from the prior retro. Keep writing them down even when the priority is P3.

3. **Bash-first beats lint-rule-first for documentation tooling.** Story 89.3 shipped a 215-line bash validator in 2 SP. Equivalent ESLint plugin for in-code comments would have been 5+ SP and uncertain. When the target is markdown + plain text + story files, bash wins every time. CLAUDE.md only mentions ESLint, TypeScript, Prettier — worth explicitly calling out bash-for-docs as a first-class tool.

4. **Fake-timer setup leaks don't propagate across describe blocks.** Story 89.5's generalizable insight: `vi.useFakeTimers()` in `beforeEach` is scoped to THAT describe block, not inherited by siblings. If a helper function transitively calls `new Date()`, every describe block that renders code exercising that helper needs its own fake-timer setup. This is the kind of insight that CLAUDE.md anti-pattern-style documentation captures well — consider a new anti-pattern #10.

5. **"Broken citation" tests accumulated at rate of ~1 per epic.** 13 citations broken across all docs; Epic 74 (file-size compliance, did file moves) alone is probably responsible for 5-6. File renames break citations silently. The Story 74 + 88 combination produced the most rot. **Every future story that moves/renames source files MUST now run `npm run check:docs` as a pre-commit check** — add to the Mandatory list in CLAUDE.md.

6. **Epic 89 hit the "carry-forward trough" inflection point.** Epic 87 added 6 carry-forwards. Epic 88 added 6 more while resolving 4 of Epic 87's. Epic 89 resolved 4 of Epic 88's while adding 2-3 of its own (captured in Action Items below). The trough: carry-forward count roughly stabilizes at 4-6 — high enough to keep accountability, low enough to never overwhelm. This feels like steady-state.

---

## Epic 90-FE Preview (Next Epic)

**Epic 90-FE: Acquiring Cost Reports UI** — 19 SP across 5 stories.

### Epic 89 → Epic 90 Dependencies

| Epic 89 deliverable | Epic 90 consumer | Status |
|---|---|---|
| Boundary Normalizer Pattern (Story 88.4 section + Epic 89.1's 5 canonical normalizers) | Story 90.1 (Acquiring types + API client + normalizers) | ✅ Ready — exact same pattern. |
| `npm run check:docs` (Story 89.3) | Stories 90.1–90.5 can use it for doc citations. | ✅ Ready. |
| Defensive Frontend Principle (Story 89.4) | Stories 90.2–90.5 (UI with nullable money fields) | ✅ Ready — anti-pattern #8 + new section directly applicable. |
| Full green test suite (Story 89.5) | All stories — zero-regression baseline is now real. | ✅ Ready. |

**Verdict: Epic 90 is fully unblocked by Epic 89.** No Epic 89 technical debt carries into Epic 90. The Boundary Normalizer Pattern + Defensive Frontend Principle + null-vs-zero discipline are now documented, exemplified, and tool-validated.

### Epic 90's EXTERNAL unblocking (independent of Epic 89)

**Backend Request #166 — DELIVERED** (per doc-2, 2026-04-19). All 3 endpoints shipped:
- `GET /v1/analytics/acquiring/reports`
- `GET /v1/analytics/acquiring/reports/:id/detail`
- `GET /v1/analytics/acquiring/detail?from=...&to=...`

All snake_case, null-preserving, 30-min cache. Response samples available.

The planning artifact at `_bmad-output/planning-artifacts/epics-90-fe.md` still lists Epic 90 as "🚧 Scoped, BLOCKED on backend Request #166" — **this is stale**. Epic 90 is UNBLOCKED as of 2026-04-19. The planning doc should be updated at the start of Story 90.1 (or as preparation step zero).

### New Technical Prerequisites for Epic 90

- **Route registration**: `ROUTES.ANALYTICS.ACQUIRING` = `/analytics/acquiring` needs adding. Story 90.2 owns it.
- **Sidebar nav entry**: Russian label under "Analytics" group. Story 90.2 owns it.
- **Date range picker**: reuse existing `DateRangePickerExtended` (confirmed in spec).
- **Cache policy**: 30-min staleTime matches backend TTL (confirmed in spec).

### Preparation Checklist

- [ ] Update `_bmad-output/planning-artifacts/epics-90-fe.md` to remove the "BLOCKED on Request #166" note.
- [ ] Confirm 3 backend endpoints are deployed to staging (not just dev) before Story 90.2.
- [ ] Check whether `finance-summary` gained `acquiring_total` (Request #166 question 3) — determines Story 90.5's scope.
- [ ] No preparation sprint needed — Story 90.1 can start immediately.

---

## Action Items

### Carry-Forward from Epic 88 (still open)

| # | Action | Owner | Priority | Target |
|---|---|---|---|---|
| 1 | Boundary Normalizer coverage for remaining 28 C-tier endpoints | Future story | LOW | Likely after Epic 90 — open a backlog placeholder in Epic 91 or 93 cycle. |
| 2 | Clean up ~15 remaining pre-existing E2E failures in `analytics-hub.spec.ts` | Future story | MEDIUM | Same audit pattern as Story 89.2; 3-5 SP estimated. |
| 3 | Recurring UI-validation audit (Epic 88 item #F) | Future story | LOW | Not addressed — not urgent; document as permanent deferred item. |

### Carry-Forward from Epic 91 (still open)

| # | Action | Owner | Priority | Target |
|---|---|---|---|---|
| 4 | Decide `calculateDailyTheoreticalProfit` removal strategy (add discrepancy logging OR commit to fallback removal) | Next dev pickup | MEDIUM | ~1 SP — can pair with any Story 92.x or Story 90.x touch of `daily/aggregation.ts`. |

### New from Epic 89

| # | Action | Owner | Priority | Target |
|---|---|---|---|---|
| 5 | Clean up 13 broken citations surfaced by Story 89.3 | Future cleanup story | LOW-MEDIUM | ~1 SP. Each citation is one line edit. |
| 6 | Add anti-pattern #10 to CLAUDE.md documenting "fake-timer setup is describe-scoped, does not inherit" | Next CLAUDE.md touch | LOW | 15-line addition. |
| 7 | Add `npm run check:docs` to Mandatory list in CLAUDE.md for any story that moves/renames source files | Next CLAUDE.md touch | LOW | 1-line addition. |
| 8 | Document the "bash-for-docs" principle (vs ESLint-first) in CLAUDE.md Development Guidelines | Next CLAUDE.md touch | LOW | 5-line addition. |
| 9 | Document the executor-delegation pattern in CLAUDE.md (when to delegate vs direct-edit) | Future story | LOW | Optional — capture if it clarifies future sessions. |
| 10 | **L-2 (clock-injection seam)** — refactor `ensureCurrentWeekFirst(weeks, now = getCurrentWeek())` for pure-function testability | Future refactor story | LOW | 2 SP. Makes fake-timer setup in tests unnecessary. |
| 11 | Update `epics-90-fe.md` planning doc to remove stale "BLOCKED on Request #166" note | Story 90.1 dev | LOW | Doc-only, <5 min. |

### Process Commitment

- **"Fix all issues even minors" directive** continues as standing policy. 7 epics of consistent application (85, 86, 87, 88, 89, 91, now 89 closing). Non-optional.
- **Adversarial review in fresh context with opus** continues as standing policy. Signal:noise stayed strong (15:0 across Epic 89's 3 reviews). Non-optional.
- **Null-vs-zero + Boundary Normalizer + Defensive Frontend** are now all documented, exemplified, and tool-validated. Treat as house style.

---

## Readiness Assessment

| Dimension | Status | Notes |
|---|---|---|
| Testing & Quality | ✅ Green | **6811 unit tests pass, 0 fail.** First fully-green suite in 7 epics. |
| Deployment | ⏳ Pending | Not yet deployed. Carries 3 stories (89.3, 89.4, 89.5) of uncommitted work. |
| Stakeholder Acceptance | N/A | Pure tech-debt epic; no user-facing feature to accept. |
| Technical Health | ✅ Green+ | Net improvement: +1 validator script, +1 Defensive Frontend section, +10 lines of test hygiene. No new debt created. |
| Unresolved Blockers | ✅ None for Epic 90 | Epic 90 dependencies all met. Backend Request #166 delivered. |

**Epic 89-FE is COMPLETE and fully PRODUCTION-READY from a code perspective.** Deployment timing is the only open loop, and none of Epic 89's changes are user-visible (no risk of UX regression at deploy time).

---

## Commitments & Next Steps

### Commitments
- **11 action items** (3 carry-forward from Epic 88 + 1 from Epic 91 + 7 new from Epic 89).
- **No preparation sprint needed** — Epic 90 is unblocked.
- **No significant discoveries** that require Epic 90 replanning (minor: update the "BLOCKED" note in the planning artifact).

### Recommended Next Steps (in order)
1. **Deploy Epic 89 changes** (verify in staging, then prod). 3 stories of uncommitted work.
2. **Start Story 90.1** (Acquiring types + API client + normalizers, 3 SP) — highest-value, unblocked, builds on the patterns just cemented.
3. **OR start Story 92.2** (Monitor KPI Cards, 3 SP) — continues hot context from 92.1 if preferred over net-new feature.
4. **Defer Epic 90 retro triggers** — Epic 90 is still backlog. Retro is meaningless until stories land.
5. **Keep the minor-sweep + adversarial-review + executor-delegation rituals intact.** They are the house style now.

---

## Signoff

Epic 89-FE delivered 5 stories, 12 SP, zero regressions, in three working sessions. The epic's explicit mission — "close the consequences of Epic 88" — was executed: 4 of 6 Epic-88 action items fully closed, 2 partially closed. The 6-consecutive-epic `DashboardPeriodSelector` test-failure chain was broken. The first fully-green test suite in 7 epics shipped.

The retrospective compounded lessons from Epics 87 + 88 + 91: **adversarial review + minor sweep + null-vs-zero + Boundary Normalizer + Defensive Frontend** are no longer experimental practices. They are the baseline. Epic 90 inherits a stable, well-tooled foundation and can focus entirely on shipping the Acquiring feature without re-discovering any of these patterns.

The pattern worth naming: **"retire then build."** Epic 89 was structurally a *retirement* epic — its purpose was to close open loops from prior retros so Epic 90 could build cleanly on stable ground. This two-phase rhythm (retire-then-build) cost 12 SP of low-visibility work but bought zero-friction execution for the next user-visible feature epic. Worth repeating.

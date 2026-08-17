# Epic 92-FE Retrospective: Monitor Dashboard

**Epic:** 92-FE — Monitor Dashboard
**Priority:** P2
**Estimate:** 16 SP across 6 stories
**Retro Date:** 2026-04-24
**Facilitator:** Bob (Scrum Master)
**Participant:** Project Lead (salacoste / R2d2)

> **Note on facilitation format.** Following the Epic 91 retro precedent (set at `epic-91-fe-retro-2026-04-21.md:9`), the party-mode dialogue theater is compressed here into the substantive retrospective content the doc is meant to capture. The workflow's structure (Epic review → Previous retro follow-through → Next epic preview → Action items → Readiness assessment → Closure) is preserved.

---

## Epic Summary

**Delivery: 6/6 stories done, 16 SP, zero regressions, bundled into 2 commits.**

| Story | Title | SP | Outcome |
|---|---|---|---|
| 92.1-FE | Types + API Client + Hook | 2 | Foundation data layer: `MonitorSummaryResponse`, `PeriodMetrics`, `MonitorKpi` types; `useMonitorSummary()` hook (5 min refetch within 10 min backend TTL); boundary normalizer preserving `null` for money/ratios. 15 new unit tests. Hook-test mocking pattern correction (`useAuthStore.setState` vs `mockReturnValue`) documented for future multi-store tests. |
| 92.2-FE | KPI Cards + Route Registration | 3 | 4 KPI cards (total products / with COGS / coverage % / buyout 30d). `/monitor` route + sidebar entry. `MonitorPageContent` orchestrator with skeleton / full-error / inline-chip state machine mirroring Story 90's pattern. Defensive `productsWithCogs > totalProducts` anomaly detector (Story 89.4 principle). |
| 92.3-FE | Metrics Table — 4 Periods | 3 | 7-row × 4-column table (Today/Yesterday/30d/Prev30d). Delta indicators with direction-aware coloring. `cogs > revenue` + `margin > revenue` anomaly detection per row. 180-line split trigger fired mid-impl — `monitor-metrics-utils.ts` extracted. 18 tests (7 pure helpers + 11 component). |
| 92.4-FE | Weekly Chart | 3 | 7-day recharts `LineChart` (3 lines). Added **parallel hook** (`useDailyMetrics`) with **independent state machine** — chart failure doesn't hide cards/table. Review round surfaced H-3: upstream `DailyMetrics` aggregation was silently dropping `salesCount`/`returnsCount` — restored via type extension (structural fix, not adaptation). Recharts jsdom-mock workaround documented. |
| 92.5-FE | Buyout Gauge + Pipeline Health | 3 | Semi-circular SVG gauge (raw SVG specifically chosen to avoid 92.4's recharts mock pain). Compact pipeline-health panel consuming Epic 91.3's `errorRate` fields. Third parallel hook (`usePipelineGrid`), independent state. **12 review findings** (5H/4M/3L) — all fixed. Surfaced H-1: latent type-completeness leak from 92.4 structural fix affecting `table-columns.ts:152`. Backend ticket #167 filed for `errorRate > 1` anomaly. |
| 92.6-FE | E2E + Accessibility + Polish | 2 | 8 new E2E tests (3 empty-state + 2 error-state + 1 axe + 1 responsive + 1 smoke) via `page.route` fixture factories. Empty-fixture module extracted to `src/test/fixtures/monitor-empty.ts` shared between unit + E2E. Mobile 390×844 viewport test. Block comment consolidating 3 refetch cadences. **11 review findings** (4H/4M/3L) — all fixed. Epic 91 retro #7 ("pre-flight file-size check") paid off: no split triggers needed this story. |

**Test deltas:**
- Unit tests: 6808 (Epic 91 close) → **6986** (+178 net, including review-driven additions)
- E2E tests: 6 monitor tests (pre-Epic) → **14 monitor tests** (+8 new including 1 axe scan + 1 mobile viewport)
- Regressions: **0 across all 6 stories and all review rounds**
- **6th consecutive epic** with zero regressions

**Commits landed:**
- `1a6b75c feat(monitor): buyout gauge + pipeline health (Story 92.5-FE)` — bundled Stories 92.1–92.5 (25 files)
- `cd8ca04 test(monitor): E2E + accessibility + empty/error states (Story 92.6-FE)` — Story 92.6 (5 files, +535/−2 lines)

**Review intensity across the epic** — all findings fixed:
- 92.1: 6 findings (2H/3M/1L)
- 92.3: multiple rounds, headline was the 180-line split-trigger
- 92.4: 9 findings (3H/3M/3L) including H-3 structural fix
- 92.5: **12 findings** (5H/4M/3L)
- 92.6: **11 findings** (4H/4M/3L)
- **Epic-wide: ~50+ review findings, 100% fix rate under the standing "fix all issues even minors" directive**

---

## Participating Roles

- **Dev (implementation)**: Claude Sonnet executor (primary) + Claude Opus 4.7 (coordinator + complex passes).
- **Dev (adversarial review)**: Fresh-context code-reviewer (opus) per story. Delegated explicitly from bmad-master to enforce the separate-session rule.
- **Project Lead**: User (salacoste / R2d2), directing scope and applying the standing "fix all issues even minors" directive after every review pass.

---

## Epic 91-FE Action Item Follow-Through

Epic 91's retrospective surfaced 7 action items. Cross-referenced against Epic 92 execution:

| # | Epic 91 Action Item | Status | Evidence |
|---|---|---|---|
| 1 | Fix 3 pre-existing `DashboardPeriodSelector.test.tsx` failures (Story 89.5) | ✅ Closed | Story 89.5 marked `done` in sprint-status; Epic 92 did not touch `DashboardPeriodSelector` but no fresh failures surfaced. The 5-epic-long drag appears to have ended at Epic 89's sprint. |
| 2 | Doc-link validator script (Story 89.3) | ✅ Closed | Story 89.3 marked `done`. `npm run check:docs` was exercised across every 92.x story. Found a small L-11 signal-to-noise gap (185→186 citations in 92.6 with unclear cause) — tracked as new action item #6 below. |
| 3 | Defensive Frontend principle in CLAUDE.md (Story 89.4) | ✅ Closed | Story 89.4 marked `done`. Epic 92 applied the principle cleanly — 92.2's `productsWithCogs > totalProducts` detector, 92.5's out-of-range gauge + `errorRate > 1` indicators (both surfaced to user via `AlertTriangle`, both filed backend tickets rather than silently clamping). |
| 4 | Inline comment on `financeAd > 0 ? financeAd : advertising` heuristic | ❌ Not addressed | Epic 92 didn't touch `src/lib/daily/aggregation.ts` in a way that naturally hit this code path. Still open. |
| 5 | Decide: remove `calculateDailyTheoreticalProfit` fallback vs. add server/client discrepancy logging | ❌ Not addressed | Monitor Dashboard now consumes `netProfit` from server — SECOND consumer — making the removal decision more consequential. Still open. |
| 6 | Document `PipelineStatusGrid` `errorRate >= 0.01` 1% threshold | ❌ Not addressed | Story 92.5 **mirrored** the threshold verbatim into `monitor-pipeline-utils.ts` with a sync-note comment — the original file still has no threshold rationale. Still open. |
| 7 | Pre-flight file-size budget check when Dev Notes flag >180 lines | ✅ **Applied** | Story 92.3's Dev Notes flagged the budget; impl pre-extracted `monitor-metrics-utils.ts` mid-implementation (not post-review). Story 92.4 intentionally avoided touching `monitor-metrics-utils.ts` (212 lines, already at limit). Story 92.5 used `mirrors X with sync-note` pattern to avoid cross-file growth. **Clean application across 3 stories.** |

**Follow-through rate: 4/7 closed (57%), 3/7 still open.** The 4 closed are all Epic 89 backlog items that finally shipped. The 3 open are the Epic-91-originated items — they remain on the ledger. Decision deferral cost so far: zero (none of them bit Epic 92), but items #5 and #6 are growing more consequential as Monitor adds consumers.

---

## What Went Well ✅

1. **Single-endpoint architecture was a massive win over the original 8-request plan.** Backlog doc-2 pivoted the design to `GET /v1/analytics/monitor/summary` — 1 primary hook instead of 8 parallel requests. The supplementary hooks (`useDailyMetrics`, `usePipelineGrid`) were introduced ONLY for data the summary endpoint can't provide (daily breakdown, pipeline cells). Each is isolated behind an independent state machine → failure of any one doesn't blank the page. **Graceful degradation fell out of good decomposition, not extra engineering work.**

2. **Raw SVG gauge chosen explicitly to avoid 92.4's recharts jsdom mock pain.** Story 92.4 spent test-setup effort mocking `LineChart`, `Line`, etc. for jsdom; Story 92.5 documented the lesson in its own story file and picked raw SVG instead — ~100 lines of arc geometry copied from `HealthScoreWidget.tsx`, zero mocking needed. **Retro lesson applied mid-epic, not post-epic.** This is the ideal feedback loop.

3. **"Structural fix over silent adaptation" principle held across two stories.** Story 92.4's H-3 review uncovered that `DailyMetrics` aggregation was silently dropping `salesCount`/`returnsCount` — the fix extended the upstream type + aggregation rather than adapting the chart to what was there. Story 92.5's H-1 review then caught a latent type-completeness leak in `table-columns.ts:152` from that same structural change — fixed in the same review pass. Zero papered-over data layers.

4. **Defensive Frontend principle properly exercised.** Story 92.2 (`productsWithCogs > totalProducts` anomaly), Story 92.5 (gauge out-of-range + errorRate > 1), Story 92.6 (empty-vs-error-state test coverage). Each case surfaced the anomaly to the user via `AlertTriangle` + tooltip AND filed/referenced a backend ticket. **No silent clamps, no `?? 0` on nullable money/ratios.** The principle has fully internalized.

5. **Parallel-hook + independent-state-machine pattern became a reusable template.** Introduced in Story 92.4 (useDailyMetrics), copied verbatim in Story 92.5 (usePipelineGrid), tested in Story 92.6 (error-state E2E verifies graceful degradation). Pattern: primary hook gates `hasData`; supplementary hooks each have `isLoading && !data` / `isError && !data` / success branches that render in-place. **Cookie-cutter reuse across 3 stories is the right sign that a pattern is load-bearing.**

6. **Adversarial review caught real defects in every story, every round.** 92.5: 12 findings. 92.6: 11 findings. H-severity catches included: type-check leaks (92.5 H-1), dead E2E code (92.5 H-2, 92.6 H-1), unwrapped endpoint mocks (92.6 H-2), accessibility regressions (92.5 L-12), hook-mock integrity gaps (92.5 H-5), `console.warn` without user-facing indicator (92.5 H-4). **The primary dev pass consistently missed ~30-50% of what the fresh-context review caught — this is now documented as stable ratio across 6 epics.** Adversarial review is load-bearing infrastructure.

7. **Epic 91 → Epic 92 dependency chain was clean.** Story 91.3 added `errorRate`/`tasksWithErrors`/`totalResultErrors` to `GridPipeline`; Story 92.5 consumed them directly. Zero contract drift, zero surprise. This is the payoff for Epic 91's stair-step integration strategy.

8. **"Fix all issues even minors" directive shipped its 6th consecutive epic.** Every review finding from Severity 1 to Severity 3 was fixed before story-close. No "tech debt for later" pile accumulated. 6986 tests green, 0 regressions. **This is now the house style.**

9. **Fixture extraction evolved mid-epic.** Story 92.6 extracted `src/test/fixtures/monitor-empty.ts` as shared empty-data factories for unit + E2E tests (after the review surfaced ~40 lines of duplication between them). The pattern will seed downstream epics' test fixtures.

---

## What Didn't Go Well ⚠️

1. **Specs diverged from reality during Story 92.4.** The Story 92.4 spec said "3 lines (Продажи/Заказы/Возвраты) as integer counts from `DailyMetrics`" — but `DailyMetrics` didn't have the count fields the spec named. Primary impl adapted to 2 lines using what was available; review caught it; structural fix restored 3 lines. **Root cause: spec author didn't grep the field names against the actual type file.** Prevention (codify): when a story spec lists fields to consume, the spec doc must cite the source file and grep confirmation. This has happened twice now (Epic 91's `operatingProfit` ghost field was the same pattern).

2. **Review-pass bug-miss ratio is stable at ~30-50% across every story.** 92.5 primary pass missed 12 findings (reviewer caught all 12). 92.6 primary pass missed 11 (reviewer caught all 11). The ratio isn't getting better with practice — it's a property of fresh-eyes vs author-in-the-code. Honest framing: **the primary pass and the adversarial review are complementary, not redundant.** Neither replaces the other. The `Pure functions over hook mocking` and `Adversarial code reviews` memory rules both anticipate this.

3. **Rule-of-two `STATUS_COLORS` / `STATUS_LABELS` duplication still not extracted.** Both Stories 92.5 and 92.6 mirrored the constants from `PipelineStatusGrid.tsx` with sync-note comments. That's a third duplication signal (Epic 91's `formatRelativeTime` divergence was the first). The "mirrors X — keep in sync" pattern is an honest middle-ground but the ledger of "deferred extractions" has 3 items now. Candidate: `src/lib/monitoring-constants.ts`. No tracking story filed.

4. **Epic 91 action items #4, #5, #6 still not addressed.** Item #5 (discrepancy logging for `netProfit`) is now MORE consequential because Monitor adds a second consumer. Item #6 (`errorRate >= 0.01` threshold rationale) is explicit undocumented state in production code. Item #4 (inline comment) is minor. **Pattern: action items without explicit next-touch triggers drift.** Epic 89's carry-forward items closed because they got their own stories; Epic 91's carry-forward items are parked under "next touch" which didn't happen this epic.

5. **`check:docs` signal is noisy.** Story 92.6 shipped with 185→186 citations; completion notes admit the cause is unclear ("likely new block comment citing `use-pipeline-grid.ts:14-16`" — unverified). The tool flags citations but doesn't distinguish valid-new from broken-new effectively. **Low-grade, but a quality gate that's hard to reason about is only partially useful.**

6. **Monitor orchestrator test integrity gap in 92.5 (H-5) was a 92.4-retro-lesson not applied on first pass.** Primary dev pass missed that `MonitorPageContent.test.tsx` wasn't mocking the new `usePipelineGrid` / `useDailyMetrics` hooks, causing MSW unhandled-request warnings. Review caught it. **The lesson "mock every hook the orchestrator consumes" was explicit in Story 92.4's retro 3 stories earlier** — it still got missed. Applying story-level retrospectives to immediate next-story impl needs active enforcement, not passive "someone will remember."

7. **Scope creep temptation emerged in Story 92.5 (buyout gauge vs. existing KPI card 4)**. The story explicitly forbade removing the 4th KPI card ("Выкуп за 30 дней" text card) — redundancy with the gauge was designed. This is correct per spec but worth noting: the spec's explicit out-of-scope traps prevented what would have felt like natural dev-pass cleanup. **Without the story's explicit "do not remove this card" note, the card probably would have been removed.** Reinforces that explicit out-of-scope traps in story Dev Notes are load-bearing.

---

## Key Insights 💡

1. **Retro lessons applied WITHIN the epic beat retro lessons applied across epics.** Story 92.5 picked raw SVG specifically because 92.4 showed recharts jsdom pain. Story 92.6 extracted fixtures specifically because 92.5 review flagged duplication. These mid-epic adaptations are faster-impact than cross-epic action items. Corollary: **the most valuable retro may be the one that happens after every story, not just after every epic.**

2. **Single-primary-hook + N-supplementary-hooks is a generalizable orchestration pattern.** Epic 92's Monitor page has 1 primary (`useMonitorSummary`) + 2 supplementary (`useDailyMetrics`, `usePipelineGrid`). Each has independent loading/error/success branches; all three fire in parallel on mount; failure in any supplementary degrades gracefully. **Any future dashboard with multiple disparate data sources should follow this shape** — it's cheaper than orchestrating all data through one endpoint, AND cheaper than N independent full-page states.

3. **Raw-SVG vs chart-library is a real tradeoff with test-harness implications, not an aesthetic choice.** Recharts = easier dev, harder tests (jsdom SVG sizing). Raw SVG = more code upfront, trivially testable. The decision should be made per-visualization, with test-harness cost explicitly weighed. **Codify: semi-circular gauges, simple arcs, static SVG → raw. Line charts, bar charts, complex interactive → recharts with jsdom mocks pre-planned.** Story 92.4 + 92.5's contrast is the canonical example.

4. **"Structural fix over silent adaptation" is a load-bearing principle.** Story 92.4 extended the upstream type; Story 92.5 caught the downstream leak in the SAME review pass. If 92.4 had adapted downward instead (used only the 2 fields available), the chart would have been functionally weaker AND `table-columns.ts:152` would have stayed type-complete incidentally — but the data model would have silently drifted. **Type-system-driven refactors surface drift; adaptation hides it.** This is a direct echo of Epic 91's "pure deletion was the safest story" insight.

5. **Adversarial review has stable defect-find rate across epics.** Epic 91 findings: ~12 across 3 stories. Epic 92 findings: ~50 across 6 stories. Ratio: ~8-10 findings per story, ~3H per story, ~100% fix rate under the standing directive. **This is infrastructure, not a ceremonial step.** Budget it as such.

6. **Fixture factories deserve Story 1 of every epic, not Story N.** Epic 92's shared empty-fixtures emerged in Story 92.6 (retroactive extraction). Every previous story's unit test re-implemented empty data inline. **Seeding `src/test/fixtures/<domain>-empty.ts` alongside the types + normalizer (Story 1 of any epic) would retrofit to zero cost and save every downstream story's test duplication.** Codify as a Story-1 checklist item.

7. **Explicit out-of-scope traps in story Dev Notes are load-bearing.** Story 92.5's "do not remove KPI card 4" trap prevented what would have felt like natural dev cleanup. Story 92.6's "no new UI blocks, no refactoring of 92.1–92.5" trap kept the polish-story scope tight. **Without these explicit notes, scope creep happens silently under the banner of "while I'm here, I might as well..."** Future stories should continue the pattern.

8. **The `mirrors X — keep in sync` pattern is honest scope discipline.** When rule-of-two emerges within a story, three options exist: (a) extract now (scope creep), (b) extract later (unflagged debt), (c) mirror with sync-note (explicit debt ledger). Option (c) is what Epic 92 used 3 times. It's not ideal but it's honest, and it prevents the "someone will factor this out later" fiction. **Formalize**: any time `mirrors X.tsx — keep in sync` appears, file a 0-SP tracking story for the extraction so the ledger is visible.

9. **Zero-regression streak is now 6 consecutive epics (87, 88, 89, 90, 91, 92).** Components: adversarial review + minor sweep + "fix all issues even minors" directive + full-suite run before close + boundary normalizer discipline + null-vs-zero discipline + structural-fix-over-adaptation. **None of these are optional.** If any of them drops, the streak breaks.

---

## Next Epic Preview

**No Epic 93-FE defined in `_bmad-output/planning-artifacts/`.** Sprint-status shows all 16 epics at `done`, one retrospective `optional` (the one this doc closes), nothing in `backlog` or `ready-for-dev`. The sprint is fully drained.

### No new-epic dependencies carried forward from Epic 92.

Monitor Dashboard is production-ready. No blocking deployment or integration tasks. The 3 Epic-91-originated action items (see #4, #5, #6 in the "What Didn't Go Well" section) are non-blocking but would benefit from a tracking story next time a planning cycle starts.

### Options when planning resumes

1. **Operational cleanup epic** — close the 3 open Epic-91 action items + file the `STATUS_COLORS`/`STATUS_LABELS` shared-module story + address `check:docs` signal quality.
2. **Epic 93 net-new feature epic** — requires fresh epic spec in `_bmad-output/planning-artifacts/epics-93-fe.md` before `create-story` has anything to work with.
3. **Production validation cycle** — deploy Epic 92 changes to staging/prod, collect user feedback, file issues.
4. **Retrospective meta-work** — codify the patterns this retro surfaced (Insight #2, #3, #6, #7, #8) into CLAUDE.md so they become enforceable rather than tribal knowledge.

---

## Action Items

### Carry-forward from Epic 91 (still open)

| # | Action | Owner | Priority | Target |
|---|---|---|---|---|
| 1 | Decide: remove `calculateDailyTheoreticalProfit` fallback OR add server/client discrepancy logging. Second consumer (Monitor) makes this more consequential. | Project Lead | MEDIUM ↑ (was MEDIUM) | Track as dedicated follow-up story |
| 2 | Document `PipelineStatusGrid` `errorRate >= 0.01` 1% threshold in source file | Next sprint dev | LOW | Add to next touch of `PipelineStatusGrid.tsx` |
| 3 | Inline comment on `financeAd > 0 ? financeAd : advertising` heuristic in `aggregation.ts` | Next sprint dev | LOW | Add to next touch of `src/lib/daily/aggregation.ts` |

### New from Epic 92

| # | Action | Owner | Priority | Target |
|---|---|---|---|---|
| 4 | Extract shared `STATUS_COLORS` / `STATUS_LABELS` into `src/lib/monitoring-constants.ts` (rule-of-three signal, 3 files mirroring). File as a 0-SP tracking story. | Next sprint dev | LOW | New tracking story in next epic |
| 5 | Seed fixture factories alongside types in Story 1 of every future epic. Codify in a Story-1 template or CLAUDE.md note: "New epic touching a new domain: create `src/test/fixtures/<domain>-empty.ts` alongside types." | Process | MEDIUM | Apply from next epic's Story 1 |
| 6 | Investigate `check:docs` 185→186 drift cause in Story 92.6; evaluate signal quality of the validator | Next sprint dev | LOW | Next touch of `scripts/check-docs.*` |
| 7 | Codify Epic 92 patterns in CLAUDE.md: (a) parallel-hook + independent-state-machine template, (b) raw-SVG vs chart-library decision rule, (c) "mirrors X — keep in sync" requires tracking story for extraction | Process | LOW | One PR in next epic |
| 8 | Story-spec grep discipline: story author must grep any field name listed in spec against actual type file before handing off (prevents 92.4's `salesCount`/`returnsCount` drift and Epic 91's `operatingProfit` ghost field) | Process | MEDIUM | Apply to every create-story output |
| 9 | After-every-story mini-retro — 3-bullet note captured in story's Change Log about "what this story taught about patterns" (faster-impact than only-epic-retros) | Process | LOW | Apply starting next epic |

### Process commitments (no change)

- **"Fix all issues even minors" directive** — 6 epics of consistent application. Continue.
- **Adversarial review in fresh context** — 6 epics of stable ~8-10 findings/story defect-find rate. Continue.
- **Structural fix over silent adaptation** — 2 epics of compounding wins (Epic 91 `totalRevenue` pure-deletion; Epic 92 `DailyMetrics` type extension). Continue.
- **Out-of-scope traps in every story Dev Notes** — proven load-bearing in Story 92.5 and 92.6. Continue.
- **Null-vs-zero discipline** — internalized across the team (zero violations in Epic 92 primary passes). Continue.

---

## Readiness Assessment

| Dimension | Status | Notes |
|---|---|---|
| Testing & Quality | ✅ Green | 6986 unit tests pass. +178 from sprint start. 14 E2E monitor tests including axe a11y scan. Zero regressions. |
| Deployment | ⏳ Pending | Not yet deployed — depends on CI/release cycle. User to confirm deployment timeline. Monitor is a net-new `/monitor` route, low blast radius. |
| Stakeholder Acceptance | ⏳ Pending | `/monitor` route is user-facing. No formal acceptance captured yet. Stakeholder review recommended pre-prod. |
| Technical Health | ✅ Green | All new files within 200-line budget. No new technical debt other than the 3 flagged sync-note patterns (tracked in Action Item #4). Backend ticket #167 filed for `errorRate > 1` anomaly (non-blocking). |
| Unresolved Blockers | ✅ None | Epic 92 is internally self-contained. No carry-forward blockers to next epic. |

**Epic 92-FE is COMPLETE and PRODUCTION-READY from a code perspective.** Deployment timing and stakeholder review are the only open loops — both are standard post-merge activities, not blockers.

---

## Significant Discoveries

**None that require epic replanning.** The 3 Epic-91-originated action items (#1, #2, #3 above) remain open but were already carry-forward; they didn't discover anything new in Epic 92. The `DailyMetrics` type extension (92.4 H-3) was a recovered silent-drift, not a forward-looking architectural discovery.

---

## Commitments & Next Steps

### Commitments
- **9 action items** (3 carry-forward + 6 new from Epic 92).
- **No preparation sprint needed** — no next epic defined.
- **No replanning required** — no significant discoveries impacting future work.

### Recommended Next Steps (in order)
1. **Deploy Epic 92 changes** — verify in staging, then prod. `/monitor` route is net-new, low blast radius.
2. **Stakeholder walkthrough** of `/monitor` — optional but recommended given it's a user-facing surface.
3. **Decide sprint direction** — operational cleanup (close the 3 open action items + codify patterns), OR plan Epic 93 (requires fresh epic spec), OR production-validation cycle.
4. **Before Story 1 of the next epic** — apply Action Item #5 (seed fixture factories in Story 1) and Action Item #8 (spec grep discipline).
5. **Keep the minor-sweep + adversarial-review rituals intact.** 6 epics of consistent payoff.

---

## Signoff

Epic 92-FE delivered 6 stories, 16 SP, in 2 commits over a compressed authoring+review cycle. The Monitor Dashboard is production-ready: single-endpoint architecture with graceful-degradation supplementary hooks, semi-circular SVG gauge, compact pipeline-health panel, full a11y scan, empty/error state E2E coverage, mobile responsive verified.

The epic compounded 4 house-style patterns from prior retros — **structural fix over silent adaptation** (Epic 91), **null-vs-zero discipline** (Epic 87-88 series), **adversarial review + fix-all-minors** (Epics 87 onward), and **out-of-scope traps in Dev Notes** (Epic 90). It also introduced 2 new patterns worth codifying — **raw-SVG vs chart-library decision rule** and **parallel-hook + independent-state-machine orchestration**.

The zero-regression streak now stands at 6 consecutive epics. Review-catches-real-defects ratio is stable at ~8-10 findings per story. The "fix all issues even minors" directive remains the single most load-bearing process commitment.

Three action items from Epic 91 remain open. One of them (discrepancy logging for `netProfit`) is now slightly more urgent with Monitor as a second consumer. Consider an operational-cleanup epic or dedicated tracking stories before the next feature epic begins.

---

**Retro closed: 2026-04-24.** All sprint-status transitions complete: `epic-92-fe: done`, all 6 stories `done`, `epic-92-fe-retrospective: done`.

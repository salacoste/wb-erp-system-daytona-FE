# Epic 96-FE Retrospective: Backend Epics 101-109 Frontend Integration

**Date**: 2026-05-09
**Epic**: 96-FE
**Status**: Partial (16/17 stories `done`; Story 96.17 conditionally deferred to 2026-06-15 per E5 trigger)
**Source**: Backend Epics 101-109 coordination thread (commit `d1378cc`, 2026-05-06)
**Coordinator**: R2d2 (solo, with adversarial Opus subagent reviews)
**Mode**: Partial retrospective — Story 96.17 dependency-blocked on backend Story 107.3 (CabinetGuard verification)

---

## Epic Summary

Epic 96-FE was a **17-story (16 shipped + 1 conditionally deferred)** integration epic absorbing the contract surface delivered by Backend Epics 101-109 between 2026-04-21 and 2026-05-06. Spans 7 clusters: A (P&L Waterfall fixes — 96.5/96.8), B (Acquiring + Funnel UX — 96.6/96.7/96.9), C (Unit-Economics 10-category — 96.2/96.3/96.4/96.10), D (FBS New Surfaces — 96.11/96.12/96.13), E (Buyout/Returns Reconciliation — 96.14/96.15), F (Cleanup — 96.16), G (Deferred — 96.17). One residual fix (96.1 — `usePreliminaryTax` response-shape enum) shipped as well.

The epic operationalized Backend Epic 106's three biggest contract changes:
- **Source migration**: `commission_other` (Story 96.5) and `dop_servisy_wb` (Story 96.8) moved from heuristic to deterministic backend sources, requiring frontend to consume the new fields and restore P&L waterfall accuracy.
- **Schema unification**: `delivery_to_warehouse` collapsed to a single nested `location` object (Story 96.4) and surfaced as the 10th cost category (Story 96.10) with FCU/DCU disclosure semantics.
- **New surfaces**: 5 net-new pages/components (FBS stock breakdown, FBS export polling, FBS enhanced analytics, buyout reconciliation page, SDK-reconciliation source overlay) built from boundary normalizers, Pattern 3 fixtures, and Pattern 1 independent-state-machine orchestration.

**6 distinct work classes shipped**, one main pattern per cluster:

| Cluster | Story count | Dominant work class | Average net delta per story |
|---|---|---|---|
| A — P&L source migration | 2 | Type widening + waterfall row restoration | ~150 lines incl. tests |
| B — Acquiring + funnel UX | 4 | Net-new types + API client + components + Pattern 3 fixtures | ~400 lines incl. tests |
| C — Unit-economics 10-cat | 4 | Schema migration + meta-driven ordering + UI surfacing | ~250 lines incl. tests |
| D — FBS new surfaces | 3 | Net-new routes + boundary normalizers + 3 hooks + Pattern 3 fixtures + E2E | ~600 lines incl. tests |
| E — Buyout/Returns reconciliation | 2 | Type widening + indicator components + page orchestrator | ~350 lines incl. tests |
| F — Cleanup | 1 | Comment-only swap + regression tests | ~40 lines |
| G — Deferred | 1 (deferred) | E2E setup utility (pending backend Story 107.3) | N/A |

**Aggregate impact**: Vitest passing count grew from 7000 (Epic 95 close) → 7244 (Epic 96 close, post-2nd-pass-review on Story 96.16). **+244 tests across 16 stories** = **+15.25 tests per story average**, the highest velocity of test-asset accretion in any single epic to date.

---

## Delivery Metrics

| Metric | Value |
|---|---|
| Stories completed | 16 / 17 (94.1%) — 1 conditionally deferred per E5 trigger |
| Story points delivered | ~22 SP (from epic spec range [17, 28]; landed mid-band) |
| Files touched | 100+ across all stories (sampled from File Lists) |
| Net test additions | +244 tests (7000 → 7244) |
| Net Vitest baseline floor advances | +244 (Story 96.10/96.11/96.12/96.13 each ratcheted floor explicitly; 96.16 final +5) |
| Quality-gate regressions | 0 |
| Production incidents | 0 |
| `src/` regressions | 0 |
| Adversarial review passes per story | 2-3 (most stories ran 1st + 2nd; Story 96.9 ran 3 due to 3rd-pass surfacing additional review fixes) |
| Total review findings addressed (across 1st + 2nd passes) | ~150+ across 16 stories (single-story densities ranged from 5 to 19) |

---

## Quality Gates (final state)

All 4 gates green at baselines, verified empirically at every story close + at epic close:

| Gate | Baseline (Epic 95 close) | Final (Story 96.16 close) | Net |
|---|---|---|---|
| `bash scripts/check-doc-citations.sh` | 13 broken (per `scripts/.check-docs-baseline.txt`) | OK 13/13 ✓ | unchanged |
| `npm run type-check` | 20 errors, all in `src/lib/api/advertising-analytics-api.ts` | 20 errors, scope unchanged ✓ | unchanged |
| `npm run lint` | 0 / 0 | 0 / 0 ✓ | unchanged |
| `npm test -- --run` | ≥ 7000 passing, 0 failed, 676 skipped | **7244 / 0 / 676 ✓** | **+244** |

The cumulative **+244** Vitest delta across 16 stories ratcheted the formal floor 7000 → 7244 across multiple steps (each net-new story bumped the floor explicitly with annotations in CLAUDE.md `### Accepted Baselines`).

---

## Successes

### S-1: 2-pass discipline validated 9/9 → 16/16 in Epic 96-FE

The 2-pass adversarial review discipline (Story 94.3-FE) ran on every Epic 96-FE story. Across 16 stories:
- **0% defect-class overlap** between 1st and 2nd passes — each pass found different defect classes per Story 94.3-FE thesis
- **2nd-pass found 12-19 NEW defects** on substantial-surface stories (96.11, 96.12, 96.13)
- **5x density** of reframes/reductions when fresh-context Opus reviews replaced same-context reviews (Story 96.12 explicitly noted)

Story 96.10 explicitly logged: *"2-pass discipline validated 9/9 in Epic 96"* — and that streak extended through 96.11/96.12/96.13/96.14/96.15/96.16. **The 2-pass discipline is now empirically the single strongest intervention in the workflow** (8-consecutive-story validation in Epic 95 → 16-consecutive-story validation in Epic 96 = **24 consecutive stories validating the thesis**).

### S-2: Pattern 4 spec-grep at create-story handoff scoped 6+ stories down to actual residual

Pattern 4 spec-grep at story-author handoff time caught:
- **Story 96.1**: Already shipped — 2nd reframe in Epic 96
- **Story 96.10**: 3 of 4 ACs already shipped; residual = FCU/DCU UX exposure + 10-cat test gap
- **Story 96.16**: Mandated marker `// PENDING BACKEND: request #165` did not exist literally — actual surface was a single doc-reference comment
- **Story 96.7**: UX gate per E7 caught design ambiguity before code was written

Each Pattern 4 spec-grep saved a full-story rework that would otherwise have been discovered mid-implementation. The convention is now **structurally embedded** in story creation (every story file now has a "Spec-grep at handoff" matrix near the top).

### S-3: Multi-tenant cabinet-isolation defect class systematically caught

Cabinet-switching cache leaks emerged as a **recurring multi-tenant defect class** across new-surface stories — each catch was via 2nd-pass adversarial review, never by author intuition:

| Story | Severity | Manifestation | Fix |
|---|---|---|---|
| 96.11 | H2-1 | `cabinetId` missing from `fbsStockQueryKeys` | Added cabinetId to query keys + 6-test isolation suite |
| 96.12 | M2-2 | Cabinet-switch race during export polling | `useEffect` reset on cabinetId change |
| 96.13 | M2-5 | `useFbsEnhanced` hook cabinet-isolation gap | 4 isolation tests added |
| 96.14 | M-2 / H2-1 | Buyout-reconciliation hook cabinet-switch | Real `renderHook` + QueryClient wrapper tests |

**4 instances in 16 stories** (25% incidence rate on new-surface stories). The pattern is now well-documented enough that future new-surface stories can preemptively add cabinet-isolation tests as a default — possible candidate for Pattern 4 checklist refinement.

### S-4: Pattern 3 fixture-seeding convention now baseline for net-new domains

Every new-domain story (96.6/96.9/96.11/96.12/96.13/96.14/96.15) created or extended a `src/test/fixtures/<domain>-empty.ts` Pattern 3 fixture as **part of Story 1**, not retroactively. This is the Story 92.6-FE retro lesson empirically validated 7-for-7 in Epic 96. The retroactive-extraction tax (Story 92.6-FE estimated 3-4× cost) was **avoided in every Epic 96 story**.

### S-5: Defensive Frontend Principle (Story 89.4-FE) "show an indicator" recipe locked in

Story 96.14 introduced anomaly indicators on the buyout reconciliation page; Story 96.15 H2-1 corrected the "icon alone" pattern to require icon **+** footnote (the full Story 89.4-FE recipe). Story 96.16 then exercised the **closure half** of the recipe (defensive guards stay; only ticket-tracking comments update on closure).

The recipe is now empirically validated in three modes within Epic 96:
- **Detection** (96.14): `AlertTriangle` per anomaly column
- **Full disclosure** (96.15 H2-1): icon + footnote on `unknown` source
- **Closure** (96.16): defensive guard retained, ticket-tracking comment updated to cite Story 103.1

### S-6: Floor ratcheting convention now operational across all process-discipline epics

CLAUDE.md `### Accepted Baselines` Vitest floor moved 7000 → 7244 across the epic. Each story that added tests explicitly bumped the floor in the same PR. Story 96.16 surfaced the floor-bumping ambiguity (1st-pass H-2 finding) and resolved it: **floor follows passing count** (was previously: floor stays at original baseline; now: floor moves up with ratchets to tighten regression boundary).

---

## Challenges

### C-1: Story 96.17 dependency-blocked on backend coordination

Story 96.17 (test-only seed endpoint integration) was filed with explicit E5 dependency gate: backend Story 107.3 must verify `CabinetGuard` status on `/v1/test/seed/*` endpoints before frontend story can be `ready-for-dev`. **The E5 contract specifies a hard drop-trigger**: if backend Story 107.3 is not closed by **2026-06-15**, Story 96.17 is dropped from Epic 96-FE and refiled as Epic 97-FE candidate.

**Status as of epic close**: backend Story 107.3 is not yet closed; Story 96.17 remains backlog with the conditional-deferral trigger pending.

### C-2: 1 story (96.9) required a 3rd-pass review

Most Epic 96 stories closed with 2 review passes. Story 96.9 (acquiring reports list/detail pages) required a 3rd pass that surfaced **16 additional fixes** (`+16 by Story 96.9-FE 3rd-pass review fixes` per CLAUDE.md baseline ratchet). The fixes were:
- 12 api-client Retry-After validation tests
- 4 fixture-consumer wiring tests

**Root cause**: substantial new-surface story with multiple integration points; even fresh-context 2nd-pass missed the api-client Retry-After validation gap. This is the only Epic 96 story to require a 3rd pass — but it surfaces the question of when 2 passes are insufficient (Story 96.12 had similar density at 12 defects but was caught in 2 passes).

**Tentative pattern**: 3rd pass triggered when 2nd-pass surfaces find a **new defect class** (e.g., api-client coverage gap) that was completely missed by 1st-pass. Future high-surface stories could preemptively run 3 passes. Filed for future consideration (Action Item A-1).

### C-3: Same-context vs fresh-context review density gap

Story 96.12's Lessons explicitly noted: *"fresh-context 2-pass found 12 defects (2H/6M/4L) on 35-test surface — **5x density of reframes**"*. Same-context reviews (where the dev who implemented runs the review) systematically miss defects that fresh-context Opus subagent reviews catch.

**Implication**: the fresh-context constraint (different conversation than the implementer) is **structurally important**, not just a polite recommendation. Same-context 2nd-passes should be flagged as insufficient.

### C-4: ESLint `max-lines-per-file` typo silently disabling 200-line cap

Story 96.16 discovered (via 1st-pass review M-1 follow-up) that `.eslintrc.json:9` declares `"max-lines-per-file": ["error", 200]` — but `max-lines-per-file` is **not a real ESLint rule** (the real rule is `max-lines`). ESLint silently ignores unknown rule names, so the documented 200-line cap is **non-functional** across the entire codebase.

**Impact**: every source file has been silently exempt from the 200-line cap for an unknown duration. CLAUDE.md `### Critical Development Rules` line currently states "ESLint enforced" — which is **factually wrong**.

Filed `docs/process/eslint-max-lines-typo.md` for follow-up. Out of scope for cleanup-only Story 96.16; targeted as Epic 97-FE candidate.

### C-5: Story 96.16 1st-pass H-1 surfaced a story-authoring grep error

When authoring Story 96.16, I used `grep ... | head -20` and miscounted truncated output, claiming 20 hits when actual was 128. The 1st-pass adversarial review caught this and surfaced 4 `?? 0` count handlers I had missed. All 4 turned out to be benign per CLAUDE.md anti-pattern #8 exception ("Counts/pagination still allow `?? 0`"), so the story conclusion (Task 2 N/A) was preserved — but the **evidence had to be corrected and propagated to 3 separate prose blocks** (a 2nd-pass L2-1 finding).

**Lesson** (also captured in Story 96.16's Lessons-line): `| head -N` pipes silently truncate `wc -l` style counts; always run `| wc -l` standalone OR review the full output. **Pattern**: another instance of the **fix-block propagation drift** chain established in Epics 94-95 (now extended through Epic 96 — chain length is now 16+ stories).

### C-6: 5-of-5 fix-block propagation drift recurrence (Epic 95 retro pattern) extended in Epic 96

Story 95-FE retro identified 5-consecutive-story 2nd-pass M-NEW-1 fix-block propagation drift. Epic 96 continued the chain:

| Story | 2nd-pass fix-block propagation finding |
|---|---|
| 96.10 | M2-3 story file test count drift between Tasks/Subtasks and CLAUDE.md baseline |
| 96.11 | M2-1 timezone-related test brittleness across multiple test files |
| 96.13 | M2-3 dash-assertion drift across 5 section tests + L2-3 premature Lessons-line at wrong row |
| 96.14 | M-4 header full-form drift |
| 96.15 | L2-1 Change Log timeline drift across multiple rows |
| 96.16 | L2-1 "20 hits" prose drift across 3 sections (only Debug Log corrected, 2 missed) |

**6 more recurrences in Epic 96** = chain length **16+ stories across Epics 94-96**. The pattern is now **structurally permanent** — author intuition cannot prevent it, only multi-pass review reliably catches it.

This validates Epic 95 retro action item A-1 (Pattern 4 § Fix-block propagation discipline) as **mandatory for next process-discipline epic**.

---

## Key Insights

### I-1: 2-pass fresh-context review is the highest-ROI single intervention

24-consecutive-story validation across Epics 94-96. The 2-pass discipline (1st pass = structural/correctness, 2nd pass = narrative/factual/style drift, **0% overlap**) reliably catches what author discipline misses. Combined with Story 96.12's "5x density" data point, the case is now overwhelming:

- **Author discipline alone**: catches some defects, misses many.
- **1st-pass adversarial review**: catches structural/correctness; misses narrative drift.
- **2nd-pass adversarial review (fresh context)**: catches what 1st-pass missed (different defect classes).

The 2-pass discipline is now structurally embedded in dev-story Step 9 and code-review workflow Step 0. It is the **load-bearing process intervention**.

### I-2: Multi-tenant cabinet-isolation tests are now baseline for new-surface stories

4-of-7 new-surface stories (96.11/96.12/96.13/96.14) had cabinet-isolation defects caught in 2nd-pass review. The defect class is **predictable** (cabinet switch leaks query state) and **catchable** (write a 6-test isolation suite per hook). Future new-surface stories should preemptively add cabinet-isolation tests as part of Story 1 of any new domain (analogous to Pattern 3 fixture-seeding).

**Generalization candidate**: Pattern 4 checklist new item 10 — *"For any new query-key construction in a multi-tenant context, scope the key by `cabinetId`. Add a 6-test isolation suite (4 cabinets × 1.5 cache-key-collision scenarios) as part of the Story 1 surface."*

### I-3: Backend coordination signal → small-N integration epic structure validated

Epic 95-FE proved coordination-cleanup epics have outsized ROI (3 stories, ~133 lines, 0 regressions). Epic 96-FE extends this to integration epics: **17 stories** (16 shipped) absorbing **8 backend epics worth of contract change** in a single coordinated cycle. The structure works because:
- Backend signal is consolidated upfront (epic spec at `epics-96-fe.md` cites `commit d1378cc`)
- Stories are decomposed by cluster (A through G)
- Spec-grep at handoff verifies each story's actual residual surface
- Quality gates are baseline-verified at every story close

**Strong recommendation**: when backend delivers a multi-epic contract change, file a single integration epic (10-25 stories) and decompose by cluster. Avoids context loss across multiple smaller epics and gives full visibility into the contract migration.

### I-4: Floor-ratcheting-with-passing-count is the right convention

Story 96.16's 1st-pass H-2 surfaced the question: should the Vitest floor follow the passing count, or stay at the original baseline? Empirical resolution: **floor follows passing count**. Rationale:
- Floor stays static → silent regressions to baseline are allowed (anti-pattern).
- Floor moves up with ratchets → regression boundary tightens; current stability is the floor.

This is now the convention. CLAUDE.md `### Accepted Baselines` Vitest row was bumped 7239 → 7244 across Story 96.16 with annotations.

### I-5: Defensive Frontend Principle full recipe = detect + render + cite + (optional) closure

Stories 96.14 + 96.15 + 96.16 collectively exercised the full recipe:
- **Detect**: anomaly indicator (e.g., `AlertTriangle`) on data violations.
- **Render**: `icon + footnote` (Story 96.15 H2-1 — icon alone is insufficient).
- **Cite**: `// PENDING BACKEND: request #N` ticket-tracking comment + `docs/request-backend/N-...md` doc.
- **Closure**: when backend resolves the ticket, defensive guard stays (defense-in-depth); only ticket-tracking comment updates to cite the closure (Story 96.16 model).

CLAUDE.md `### Defensive Frontend Principle` should be expanded to include the closure half (currently focuses on detection half). Filed for future Pattern 4 refinement.

### I-6: 3rd-pass review is the escape valve for new-defect-class surface gaps

Story 96.9 was the only Epic 96 story to require a 3rd pass. The 16 additional fixes were all in a single defect class (api-client Retry-After validation) that 1st and 2nd passes had completely missed. **Tentative pattern**: when 2nd-pass surface includes a "new defect class" (one neither 1st nor 2nd pass covered), schedule a targeted 3rd pass on that class.

This is candidate material for Pattern 4 refinement. Filed as A-2.

---

## Previous Retrospective Follow-Through Analysis (Epic 95-FE retro, 2026-05-01)

Epic 95-FE retro filed 5 action items (A-1 through A-5). Status:

| AI | Description | Status in Epic 96-FE |
|---|---|---|
| A-1 | Implement Pattern 4 § Fix-block propagation discipline | **NOT addressed** in Epic 96 (this was an integration epic, not process-discipline). Trigger reinforced: chain extended through Epic 96 (6 more recurrences). Now 16-story-chain. Stronger candidate. |
| A-2 | Pattern 4 § Authoritative-source-citation discipline | **NOT addressed.** No new defect sub-class instances in Epic 96 (no diff-stat-misread, no mtime-vs-git citations). Filed remains. |
| A-3 | Investigate HALT-based vs prose-guidance compliance | **Indirect evidence in Epic 96**: Story 96.16 1st-pass H-1 (head -20 truncation grep error) is exactly the kind of error a HALT-based post-fix grep would catch. Filed remains stronger. |
| A-4 | Document attestation drift chain in CLAUDE.md as meta-pattern | **NOT done in Epic 96.** Chain extended to ~24+ recurrences across 16+ stories of Epics 94-96. Now structurally well-documented enough to warrant a CLAUDE.md meta-paragraph. |
| A-5 | Folder organization for inverse-coordination artifacts | Trigger-based (no new inverse-coordination artifacts in Epic 96). Filed remains. |

**Follow-through rate**: 0 / 5 directly closed in Epic 96 — but A-1, A-3, and A-4 received reinforcing evidence; trigger thresholds for all 3 are now well past mandatory. **A-1 is now structurally impossible to defer further** without continuing the recurrence pattern.

**Honest assessment**: Epic 96-FE was scoped as an integration epic (consuming backend contracts), NOT a process-discipline epic. The 5 retro action items are still process-discipline items waiting for the next process-discipline epic. **Epic 97-FE is a strong candidate to BE that process-discipline epic** (see I-7 below).

---

## Significant Discoveries

### D-1: ESLint 200-line cap silent disablement (entire codebase scope)

`.eslintrc.json:9` `"max-lines-per-file"` is a typo for `max-lines`. Discovered in Story 96.16. ESLint silently ignored the rule for an unknown duration. **Every source file has been silently exempt from the documented 200-line cap.** CLAUDE.md `### Critical Development Rules` claim "ESLint enforced" is **factually wrong**.

**Impact**: unknown — many source files may exceed 200 lines (`OrdersTableRow.tsx` at 215 was confirmed). Renaming the rule and re-running lint will surface the actual scope.

**Recommended next epic**: filed `docs/process/eslint-max-lines-typo.md` with proposed Sprint Epic 97-FE-candidate scope (rename rule + audit violations + reconcile CLAUDE.md prose with reality OR raise the cap).

### D-2: Backend Story 107.3 dependency gate for Story 96.17

Story 96.17 cannot proceed without backend Story 107.3 (CabinetGuard verification on `/v1/test/seed/*` endpoints). E5 hard drop-trigger: if not closed by **2026-06-15**, Story 96.17 dropped from Epic 96 and refiled as Epic 97-FE candidate.

**Implication**: epic-96-fe cannot flip from `in-progress` to `done` until 96.17 is either delivered or formally dropped per E5. The trigger date is a workflow gate.

### D-3: Story 96.9 3rd-pass review surfaced an api-client coverage gap

Beyond the 16-defect 3rd-pass density mentioned in C-2, the underlying issue is more general: **api-client.ts retry-after handling was 503-only** (extension to 429 was deferred work). Epic 96 surface (Stories 96.11 + 96.12) introduced 429 flows, requiring api-client extension as a prerequisite. The pattern is **rate-limit status code coverage**: every story that introduces a new rate-limit status code in HTTP responses must verify api-client retryAfter handling for that code.

This is candidate material for Pattern 4 refinement (Action Item A-3 below).

### D-4: 16-story 2-pass discipline run = strongest empirical case yet

Across Epics 94-96, the 2-pass discipline has now been validated in **24 consecutive stories**. **0% defect-class overlap** between 1st and 2nd passes. The case for the discipline is now overwhelming. Should be promoted from "convention" to "structurally non-negotiable" in CLAUDE.md.

### D-5: Epic 97-FE will likely emerge as process-discipline epic

Given:
- A-1 (fix-block propagation) is structurally mandatory after 16-story recurrence chain
- A-2 (authoritative-source-citation) is filed and trigger-reinforced
- A-3 (HALT vs prose) has indirect evidence in Epic 96
- A-4 (CLAUDE.md meta-pattern documentation) is now well past trigger threshold
- D-1 (ESLint typo) needs follow-up
- D-3 (api-client rate-limit coverage) needs follow-up

**Epic 97-FE candidate scope**: 6-8 stories implementing all of A-1 through A-4 + D-1 + D-3 = a process-discipline epic that codifies all the patterns established in Epics 94-96. Recommended trigger: **after Story 96.17 disposition** (either delivered post-2026-06-15 or dropped per E5).

### D-6: Backend Epics 101-109 contract migration is COMPLETE on the frontend

All 16 closed stories synchronize the frontend to backend's contract delivery from 2026-04-21 → 2026-05-06. This is the **largest single-epic contract migration in project history** (8 backend epics → 1 frontend epic).

---

## Action Items

(Filed for future planning consideration. None block Epic 96-FE close.)

### A-1 (carried + escalated from Epic 95-FE retro): Implement Pattern 4 § Fix-block propagation discipline

**Owner**: Future process-discipline epic spec author (Epic 97-FE candidate per D-5).
**Trigger**: 16-story recurrence chain across Epics 94-96 (now structurally permanent).
**Description**: Add CLAUDE.md `### Multi-Source Orchestration` § Pattern 4 a new sub-section "Fix-block propagation discipline" + new checklist item: *"After applying any fix, perform a TARGETED grep for the EXACT phrase(s) modified across ALL story-related files. Author intuition about 'parallel locations' systematically underestimates the search space."* Consider HALT-based enforcement: a script that, after a story-spec edit, greps for the original phrase and warns if matches remain (per Story 95-FE retro D-1 implication).
**Severity**: Now empirically mandatory — defer at the cost of continued recurrence.

### A-2 (carried from Epic 95-FE retro): Pattern 4 § Authoritative-source-citation discipline

**Owner**: Future process-discipline epic.
**Trigger**: Carried from Epic 95-FE retro. No NEW instances in Epic 96 but filed remains relevant.
**Description**: Add CLAUDE.md Pattern 4 sub-section + checklist item: *"When claiming numerical/date/state facts about the codebase, prefer git-canonical sources (git log, git blame, git diff body) over filesystem metadata (mtime, atime, file size) over author memory. Cite the source method inline."*

### A-3 (NEW): API-client rate-limit status-code coverage discipline

**Owner**: Future process-discipline epic OR Story 96.X-FE if surfaced again.
**Trigger**: Story 96.9 3rd-pass review found 503-only retryAfter coverage when 429 was needed.
**Description**: Add CLAUDE.md `### Boundary Normalizer Pattern` (or Pattern 4 § new sub-section): *"When introducing a new HTTP rate-limit status code (429, 503, etc.) in a story, verify api-client.ts retryAfter handling covers that code BEFORE consuming. Add the code to the canonical test suite."*

### A-4 (carried + strengthened from Epic 95-FE retro): Document attestation drift chain as CLAUDE.md meta-pattern

**Owner**: Future stylistic edit.
**Trigger**: Chain extended from 18 (Epic 95 close) to 24+ (Epic 96 close); pattern now structurally robust enough for documentation.
**Description**: Add a meta-paragraph in CLAUDE.md Pattern 4 (or a new `### Attestation Discipline` section): *"The attestation drift chain (now 24+ recurrences across 16+ stories of Epics 94-96) is empirical evidence that author discipline alone is insufficient. The rule catches the rule's own violation on first attempt; this is by design, not failure. Multi-pass review is the structural countermeasure."*

### A-5 (NEW): Cabinet-isolation test suite as Pattern 4 default for new-surface stories

**Owner**: Future process-discipline epic OR next new-surface story (whichever is sooner).
**Trigger**: 4-of-7 new-surface stories in Epic 96 had cabinet-isolation defects caught in 2nd-pass.
**Description**: Add CLAUDE.md Pattern 4 § new sub-section "Multi-tenant cabinet-isolation discipline" + checklist item: *"For any new query-key construction in multi-tenant context, scope the key by `cabinetId`. Add a 6-test isolation suite (4 cabinets × 1.5 cache-key-collision scenarios) as part of the Story 1 surface."*

### A-6 (NEW): Fix `.eslintrc.json` `max-lines-per-file` typo (D-1)

**Owner**: Future process-discipline epic spec OR standalone story.
**Trigger**: Story 96.16 1st-pass review M-1 + memo at `docs/process/eslint-max-lines-typo.md`.
**Description**: Rename `.eslintrc.json:9` rule from `max-lines-per-file` to `max-lines` (real ESLint rule name). Run `npm run lint` to enumerate all violators. Triage: refactor or add per-file disables. Update CLAUDE.md `### Critical Development Rules` § "File size limit" to reflect actual enforcement state.

### A-7 (carried from Epic 95-FE retro A-3): Investigate HALT-based vs prose-guidance compliance

**Owner**: Future process-discipline epic.
**Trigger**: Indirect evidence in Story 96.16 H-1 (truncated grep would have been caught by HALT-based post-fix grep).
**Description**: Carried forward. The 16-story fix-block propagation chain strengthens the case.

### A-8 (NEW): Story 96.17 disposition by 2026-06-15

**Owner**: R2d2 (project lead).
**Trigger**: E5 hard drop-trigger.
**Description**: By **2026-06-15**, verify backend Story 107.3 (CabinetGuard verification on `/v1/test/seed/*`) is closed. If yes → flip Story 96.17 to `ready-for-dev` and ship under Epic 96-FE. If no → drop Story 96.17 from Epic 96-FE and refile as Epic 97-FE candidate (per E5 contract). Then flip epic-96-fe to `done` either way.

---

## Critical Path

**1 outstanding item, time-bound:**

1. **Story 96.17 disposition by 2026-06-15** (Action Item A-8). Either ship under Epic 96-FE (if backend Story 107.3 closes) or drop per E5 contract. After disposition, flip epic-96-fe to `done`.

**No other outstanding work**:
- All 16 shipped stories have 2 (or 3) `### Post-Nth-pass-review fixes` sub-headings → 2-pass discipline structural marker present
- All 16 shipped stories have Lessons-line on final review→done Change Log row → Story 94.4-FE convention satisfied
- Quality gates green at all baselines
- Sprint-status accurate: 16 done + 1 backlog

---

## Readiness Assessment

| Dimension | Status |
|---|---|
| Stories `done` | ✓ 16 / 17 (94.1%) — 1 conditionally deferred per E5 trigger |
| Quality gates green at baselines | ✓ check:docs OK 13/13, type-check 20/scoped, lint 0/0, tests 7244/0/676 |
| 2-pass review per shipped story | ✓ All 16 shipped stories have 2+ `### Post-Nth-pass-review fixes` sub-headings (Story 96.9 has 3) |
| Lessons-lines on every done-flip Change Log row | ✓ Verified across 16 shipped stories |
| Sprint-status accurate | ✓ epic-96-fe: in-progress (pending 96.17), 16 stories done, 1 backlog |
| Production deployment | N/A — 16 shipped stories include both new-surface UI and refactors; deployment cadence is per repo (no per-story deploys) |
| Stakeholder acceptance | Implicit (backend's coordination thread `commit d1378cc` is the spec; this epic synchronized to it) |
| Technical debt incurred | 0 (defensive guards retained per CLAUDE.md § Defensive Frontend Principle; no shortcuts) |
| Carry-forward blockers | 1 conditional (Story 96.17 + backend Story 107.3 dependency, hard trigger 2026-06-15) |
| Backend coordination outstanding | 0 — all 8 backend epics' contract changes consumed by Epic 96-FE |

**Epic 96-FE is partially ready** — 16/17 stories shipped at production quality. Final 1/17 disposition gated on backend coordination per E5 contract. **Epic flip to `done`** awaits Story 96.17 disposition by 2026-06-15.

---

## Next Steps

1. **Monitor backend Story 107.3 closure** (target by **2026-06-15**).
2. **On 2026-06-15** (or earlier upon backend closure): execute Action Item A-8.
3. **Post-disposition**: flip `epic-96-fe` from `in-progress` → `done` in sprint-status.yaml (per Story 94.6-FE epic-close cleanliness check).
4. **Epic 97-FE planning** (recommended): file process-discipline epic implementing A-1 through A-7 (with D-1 + D-3 included). Trigger after Story 96.17 disposition.

---

**Retrospective filed**: 2026-05-09
**Author**: R2d2 (solo, with adversarial Opus subagent reviews per Story 94.3-FE 2-pass discipline)
**Next retro trigger**: Epic 96-FE close (after Story 96.17 disposition) OR Epic 97-FE close (whichever comes first)

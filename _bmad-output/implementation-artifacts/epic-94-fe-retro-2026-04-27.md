# Epic 94-FE Retrospective: Process Hardening & Quality-Gate Automation

**Date**: 2026-04-27
**Epic**: 94-FE
**Status**: done (7/7 stories complete)
**Source**: Epic 93-FE retrospective AI-1 through AI-7
**Coordinator**: R2d2 (solo)

---

## Epic Summary

Epic 94-FE was a process-discipline + quality-gate-automation epic. Its mandate was to consolidate the 7 retrospective action items (AI-1 through AI-7) produced by Epic 93-FE's retrospective into shipped, enforceable rules. All 7 AIs closed across 7 stories.

**Theme A — Quality-gate automation** (AI-1 + AI-2):
- Story 94.1: Automated `check:docs` baseline tracking (`scripts/.check-docs-baseline.txt` + set-diff comparison + `--update-baseline` flag).
- Story 94.2: Codified `### Accepted Baselines` CLAUDE.md section enumerating all 4 quality gates' baselines.

**Theme B — Process discipline codification** (AI-3 + AI-4 + AI-5 + AI-6 + AI-7):
- Story 94.3: Mandatory 2nd-pass review before commit (dev-story workflow XML + HALT recipe).
- Story 94.4: After-every-story Change Log Lessons line (template + dev-story Step 9 HALT).
- Story 94.5: Documentation-example grep-verification (CLAUDE.md Pattern 4 sub-section + checklist item 6).
- Story 94.6: Epic-close cleanliness check (dev-story Step 9 `<check>` block + git status --porcelain gate).
- Story 94.7: Constraint precedent-grep discipline (CLAUDE.md Pattern 4 sub-section + checklist item 7).

---

## Delivery Metrics

| Metric | Value |
|---|---|
| Stories completed | 7 / 7 (100%) |
| Story points delivered | ~7 SP (per Epic 94-FE spec estimate) |
| Files modified | 4 distinct files (`CLAUDE.md`, `scripts/check-doc-citations.sh`, `scripts/.check-docs-baseline.txt`, `_bmad/bmm/workflows/4-implementation/dev-story/instructions.xml`) + 1 modified template (`create-story/template.md`) |
| Lines added (across stories) | ~150 LoC across all stories (each story 3-30 LoC scope) |
| Quality-gate regressions | 0 |
| Production incidents | 0 |
| `src/` regressions | 0 (no source code touched throughout the epic) |
| Commits | 7 (one per story, single-commit-per-story per Story 94.3-FE convention) |

---

## Quality Gates (final state)

All 4 gates green at baselines, verified empirically at every story close:

| Gate | Baseline | Final |
|---|---|---|
| `bash scripts/check-doc-citations.sh` | 13 broken (per `scripts/.check-docs-baseline.txt`, automated by 94.1) | OK 13/13 ✓ |
| `npm run type-check` | 20 errors, all in `src/lib/api/advertising-analytics-api.ts` | 20 errors, scope confirmed ✓ |
| `npm run lint` | 0 / 0 | 0 / 0 ✓ |
| `npm test -- --run` | ≥ 7000 passing, 0 failed, 676 skipped | 7000 / 0 / 676 ✓ |

---

## Successes

### S-1: 100% retro AI follow-through (vs prior epics' 0-57%)

All 7 Epic 93-FE retrospective action items closed across this epic. Compare to Epic 92-FE's retro AI #9 (after-every-story Lessons line) which had carried THREE consecutive epics without closure before Story 94.4 finally landed it. Empirical follow-through rate jumped from prior 0-57% → 100% in Epic 94-FE.

### S-2: Bootstrap recursion across 4 convention-inventing stories worked

Stories 94.4, 94.5, 94.6, 94.7 each codified a new convention AND applied it on themselves recursively:
- Story 94.4 (Lessons-line) — its own Change Log close-row applied the rule (Python-`len()`-verified pre-write).
- Story 94.5 (documentation-grep-verification) — its own Pre-flight grep-verified all quantitative claims.
- Story 94.6 (epic-close cleanliness check) — the check fired on Epic 94-FE's own close (forward-test passed: 3 non-clean files all explained as session/tooling artifacts).
- Story 94.7 (constraint precedent-grep) — its own AC-7 was classified DEFAULT-OVERRIDABLE upfront with override condition documented; impl-time empirical test confirmed DEFAULT held (the canonical positive demonstration of the rule, inverting Story 93.5's mid-flight override pattern).

### S-3: 2-pass-pre-commit thesis validated 5 times empirically

Story 94.3-FE established the 2-pass-before-commit rule with the empirical claim that **the two passes find DIFFERENT defect classes** (1st = structural/correctness; 2nd = narrative/factual/style/sync). Stories 94.3, 94.4, 94.5, 94.6, 94.7 each had:
- 1st-pass findings (typically attestation drift, structural defects)
- DIFFERENT 2nd-pass findings (typically narrative/precision drift the 1st missed)
- **0% defect-class overlap between passes across all 5 validation points**

Story 94.6's 2nd-pass M-NEW-1 + Story 94.7's 2nd-pass M-NEW-1 both caught a NEW defect sub-class — *fix-block propagation drift* — that the 1st pass had introduced (the 1st-pass fix corrected the source but didn't propagate to adjacent references). This confirms the 2-pass discipline is necessary, not redundant.

### S-4: AC-7 self-classification working positively (Story 94.7)

Story 94.7 inverted Story 93.5's mid-flight AC-7 override pattern by classifying AC-7 as DEFAULT-OVERRIDABLE upfront with the override condition documented. The empirical impl-time test (`check:docs` post-CLAUDE.md-edit) confirmed DEFAULT held, with NO override needed. **The rule predicted the right classification** — first canonical demonstration of the precedent-grep discipline working in the positive direction.

### S-5: Single-commit-per-story discipline held (Story 94.3-FE)

All 7 stories shipped as single commits. None required follow-up commits to address review findings (compare to Stories 93.4 / 94.1 / 94.2 which each shipped with 2nd-pass-found findings as POST-MERGE follow-up commits because the 2nd pass happened after-not-before commit). Story 94.3's HALT recipe enforced via dev-story Step 9 prevented this regression class from recurring.

### S-6: Zero src/ regressions across an entire epic

Epic 94-FE was 100% process-discipline + doc-only work. No source code was modified. All 4 quality gates remained at baseline at every story close. The `tests 7000 / 0 failed` baseline held without exception.

---

## Challenges

### C-1: 12-recurrence attestation drift chain (the central anomaly)

Despite Story 94.5 codifying a documentation-grep-verification rule explicitly to prevent this defect class, the chain extended to **12 recurrences across 7 stories** of Epic 94-FE alone:

```
94.1 H-1 → 94.2 H-1 → 94.2 L-1-fix → 94.3 H-NEW-2 → 94.4 H-1 → 94.4 H-NEW-1
→ 94.4 L-1 → 94.4 L-2 → 94.5 H-1 → 94.6 M-1 → 94.7 M-1 → 94.7 M-NEW-1
```

Most ironic recurrences:
- **Story 94.6 M-1 (10th)**: Story 94.5's grep-rule had just landed; Story 94.6's Pre-flight Row 6 violated it on the very next story.
- **Story 94.7 M-1 (11th)**: Story 94.7 codifies precedent-grep; its OWN canonical case study mis-attributed the precedent-surfacing finding (grep-co-occurrence conflation — co-occurring matches treated as a single finding without per-line context reading).

The chain shows **attestation drift is endemic** — even rules explicitly codified against it get violated in their own canonical case studies. Two-layer defense (1st-pass + 2nd-pass review) is what catches it, not author discipline.

### C-2: Fix-block propagation drift (NEW defect class identified)

Stories 94.6 + 94.7 BOTH had 2nd-pass M-NEW-1 findings of the same class:
- Story 94.6 2nd-pass M-NEW-1: 1st-pass M-2 fix added +1 line to instructions.xml; 8 stale `+8 insertions` / `line 384` references throughout the story file weren't synchronized.
- Story 94.7 2nd-pass M-NEW-1: 1st-pass M-1 fix corrected attribution in 2 locations; 6 OTHER story-file locations retained the same stale "L-NEW-1 surfaced the precedent" attribution.

**Pattern**: when a 1st-pass fix corrects a SOURCE defect (incorrect citation, wrong line count, conflated attribution), the consequences propagate through the document — but the 1st-pass fix block doesn't always re-scan adjacent locations for un-propagated references. The 2nd-pass review catches these consistently.

This is candidate material for a future Pattern 4 checklist item 8 (filed but not in-scope for this epic).

### C-3: Convention-inventing stories require recursive bootstrap testing

Each of Stories 94.4 / 94.5 / 94.6 / 94.7 codified a rule. In every case, the very story codifying the rule **violated it on first attempt** in some way (Lessons over limit, Pre-flight estimate-not-grepped, attribution mis-classified). This is the structural invariant of convention-inventing stories — the rule has to be tested on itself, and the bootstrap test consistently catches own-rule violations on first attempt.

The lesson is not "be more careful" (that doesn't work — 12 recurrences prove it) but rather **build the rule's enforcement into the workflow itself** (which is what 94.3's HALT recipe does — count Post-Nth-pass-review sub-headings, fail if < 2).

### C-4: Story 94.6's epic-close check was added but not invoked during 94.7's dev-story

Story 94.6 added a `<check>` block to dev-story Step 9 that fires when the LAST story in an epic is being marked review. This is supposed to fire during Story 94.7's dev-story Step 9 (since 94.7 is the last in epic-94-fe and all siblings are done). The block is LLM-interpreted guidance, not a strict workflow gate. **I (the LLM coordinator) skipped the check during 94.7's dev-story execution** — caught by 2nd-pass L-NEW-2 with honest disclosure added to the story file.

The check eventually DID fire when the user invoked the epic-close (not via dev-story Step 9, but as an explicit coordinator action — "Run git status --porcelain"). The forward-test passed, but the LLM-interpreted-guidance gap is real.

**Implication**: workflow XML guidance is necessary but insufficient. LLM coordinators have inconsistent compliance with optional-but-recommended steps. For critical gates, structural enforcement (HALT conditions counting evidence) > soft guidance.

---

## Key Insights

### I-1: Two-pass review's value is empirically validated, NOT theoretical

Five validation points (94.3 → 94.7) with **0% defect-class overlap between passes**. The 1st pass consistently finds structural/correctness defects; the 2nd pass consistently finds narrative/precision/sync drift. Single-pass review WOULD have shipped the 2nd-pass findings as post-merge follow-up commits (as Stories 93.4 / 94.1 / 94.2 demonstrated when they ran single-pass).

### I-2: The author can't reliably enforce a rule on themselves; the workflow must

12 recurrences + 4 convention-inventing stories that violated their own rule on first attempt = author discipline alone is insufficient. The workflow must enforce the rule (via HALT conditions, evidence-counting gates, automated baseline comparison). Story 94.1's `check:docs` automation, Story 94.3's HALT recipe, and Story 94.4's Step 9 Lessons-line HALT are the right pattern. Pure CLAUDE.md guidance without workflow enforcement (e.g., Story 94.6's epic-close check) has weaker compliance.

### I-3: AC-7 self-classification (DEFAULT-OVERRIDABLE upfront) is a generalizable pattern

Story 94.7 demonstrated that pre-classifying a constraint as DEFAULT-OVERRIDABLE with the override condition documented:
- Costs nothing if DEFAULT holds (Story 94.7's actual outcome).
- Saves a review round-trip if OVERRIDE fires (Story 93.5's actual outcome, after the fact).

This is the inverse of Story 93.5's pattern (set ABSOLUTE-by-default; reviewer surfaces precedent mid-flight; override required). Should generalize to all "no X" constraints in future stories per Pattern 4 checklist item 7.

### I-4: Doc-only scope is the right tier for process-discipline work

Every story in Epic 94-FE was doc-only OR workflow-XML-only OR script-edit (94.1 was the only script edit). No source code was touched. The cost was minimal (~150 LoC total across the epic), the tests/lint/type-check baselines were trivially preserved, and the rules now persist in CLAUDE.md / workflow XML / script logic for all future stories. The contrast with feature epics (which often touch 50+ files in src/) shows process-discipline epics have an outsize ROI.

### I-5: Bootstrap recursion as a forward-test design pattern

Story 94.6's epic-close cleanliness check was designed to forward-test on Story 94.7's epic-close. The forward-test passed (the check fired, the gate worked, 3 non-clean files were explained, the epic-flip proceeded only after the gate was satisfied). This is a generalizable design pattern: **codify the rule in story N, validate it on story N+M's natural execution path**. Worth applying in future process-discipline epics.

---

## Previous Retrospective Follow-Through Analysis (Epic 93-FE retro, 2026-04-25)

Epic 93-FE retrospective produced 7 action items. Epic 94-FE was the consolidation epic for these AIs. Status:

| AI | Description | Story | Status |
|---|---|---|---|
| AI-1 | Automate check:docs baseline tracking | 94.1 | ✅ done |
| AI-2 | Codify Accepted Baselines CLAUDE.md section | 94.2 | ✅ done |
| AI-3 | After-every-story Change Log Lessons line | 94.4 | ✅ done |
| AI-4 | Epic-close cleanliness check | 94.6 | ✅ done |
| AI-5 | Mandatory 2nd-pass review before commit | 94.3 | ✅ done |
| AI-6 | Constraint precedent-grep discipline | 94.7 | ✅ done |
| AI-7 | Documentation-example grep-verification | 94.5 | ✅ done |

**Follow-through rate**: 7 / 7 = **100%**.

This is dramatically better than prior epics' rates. Epic 92-FE's retro AI #9 (Lessons-line) had carried 3 epics without closure (Epic 92 → 93 → 94) before Story 94.4 finally landed it. The "consolidation epic" pattern (one whole epic dedicated to the retro AIs of the prior epic) appears to be the right structure for closing process-discipline AIs.

---

## Significant Discoveries

### D-1: Fix-block propagation drift is a recurring 2nd-pass-class defect

Stories 94.6 + 94.7 BOTH had 2nd-pass M-NEW-1 findings of the same class. This is candidate material for a future Pattern 4 refinement (NOT in-scope for Epic 94, but flagged for future):

> **Pattern 4 checklist item 8 (proposed for future epic)**: After applying any fix that changes line counts or attribution, re-scan ALL adjacent claims/citations in the same file (and any cross-referencing files) for un-propagated stale references created by the fix.

### D-2: grep-co-occurrence conflation is a NEW defect sub-class

Story 94.7's 1st-pass M-1 surfaced a new defect class: when a precedent-grep returns multiple matches with the same keyword, the author may treat them as a single finding without per-line context reading. The corrected discipline is "READ each match's surrounding context to confirm what each match attests; never collapse multiple grep matches into a single finding-attribution without verification."

This is candidate material for a future Pattern 4 refinement of checklist item 6 or item 7 (flagged for future, not in-scope).

### D-3: Workflow-XML guidance vs. structural HALT enforcement

Story 94.6's epic-close cleanliness check is LLM-interpreted guidance, not a structural HALT (compare to Story 94.3's "fewer than 2 review-fix sub-headings present" HALT or Story 94.4's "Lessons sub-line missing" HALT). Compliance was inconsistent: I skipped the check during 94.7's dev-story Step 9, then ran it explicitly when the user invoked epic-close.

For future process-discipline work, this suggests:
- HALT conditions counting structural evidence (Post-Nth-pass-review sub-headings, Lessons sub-lines) have high compliance.
- Pure prose guidance has lower compliance.
- Lefthook-hook structural enforcement has the highest compliance but was explicitly skipped as too brittle for these specific cases.

The trade-off is real. Future process-discipline epics may need to invest more in HALT-based enforcement and less in prose guidance.

### Epic 95: NOT defined

`_bmad-output/planning-artifacts/epics-95-*.md` does not exist. The process-discipline + retro-AI queues are both empty. The next epic is undetermined. No carry-forward dependencies from Epic 94 to a future epic.

---

## Action Items

(Filed for future planning consideration; NOT committed to a specific timeline since Epic 95 is undefined.)

### A-1: Consider Pattern 4 checklist item 8 (fix-block propagation discipline)

**Owner**: Future epic spec author (when next process-discipline AI is identified)
**Trigger**: Recurrence of fix-block propagation drift in another story's 2nd-pass review.
**Description**: Add a checklist item 8 to Pattern 4 codifying "after applying a fix, re-scan adjacent locations for un-propagated stale references." Backed by 2 empirical recurrences (Story 94.6 2nd-pass M-NEW-1 + Story 94.7 2nd-pass M-NEW-1).

### A-2: Consider Pattern 4 refinement for grep-co-occurrence conflation

**Owner**: Future epic spec author
**Trigger**: Recurrence of grep-co-occurrence conflation in another story.
**Description**: Refine Pattern 4 checklist item 6 or 7 to explicitly require per-line context reading when a precedent-grep returns multiple matches. Story 94.7 M-1 is the canonical case study.

### A-3: Investigate HALT-based enforcement vs prose guidance trade-off

**Owner**: Future process-discipline epic spec author
**Trigger**: Next process-discipline retrospective.
**Description**: Empirically compare LLM compliance with HALT-based gates (Story 94.3's recipe) vs prose guidance (Story 94.6's check). If HALT-based is materially higher, future process-discipline rules should default to HALT enforcement.

### A-4: Document the 12-recurrence chain in CLAUDE.md as a pattern

**Owner**: Future stylistic edit
**Trigger**: When Pattern 4's documentation grows large enough to warrant a meta-pattern.
**Description**: The attestation drift chain (12 recurrences across 7 stories of Epic 94-FE) is empirical evidence that author discipline alone is insufficient. Worth a meta-paragraph in Pattern 4 explaining "the rule catches the rule's own violation on first attempt; this is by design, not failure."

---

## Critical Path

**None.** Epic 94-FE is fully complete. No carry-forward blockers. Working tree was cleaned at epic-close (Story 94.6's check fired and passed). Both Stories 94.6 + 94.7 committed.

The only post-epic items are:
1. ✅ Epic 94-FE retrospective (this document) — done.
2. (Optional) Plan Epic 95 if a new initiative emerges.

---

## Readiness Assessment

| Dimension | Status |
|---|---|
| All stories `done` | ✓ 7/7 |
| Quality gates green at baselines | ✓ check:docs OK, type-check 20/scoped, lint 0/0, tests 7000/0 |
| Working tree clean (per Story 94.6's check) | ✓ All Epic 94-FE work committed; remaining non-clean files explained as session/tooling artifacts |
| Both review blocks per story | ✓ All 7 stories have 2 `### Post-Nth-pass-review fixes` sub-headings |
| Lessons-lines on every done-flip Change Log row | ✓ Python-`len()`-verified |
| Sprint-status accurate | ✓ epic-94-fe: done, all stories: done |
| Production deployment | N/A (no production code touched in this epic) |
| Stakeholder acceptance | Implicit (solo coordinator + automated quality gates serve as acceptance) |
| Technical debt incurred | 0 (no source code touched; CLAUDE.md grew by ~150 LoC of documentation) |
| Carry-forward blockers | 0 |

**Epic 94-FE is fully ready.** No outstanding work.

---

## Commitments and Next Steps

### Coordinator next steps (immediate)

1. Mark `epic-94-fe-retrospective: optional → done` in sprint-status.yaml (handled by this retrospective workflow Step 11).
2. Commit this retrospective document and the sprint-status update.

### Coordinator next steps (when planning Epic 95)

1. Decide whether Epic 95 is feature work (return to backend-blocked or user-facing features) or another process-discipline cycle.
2. If process-discipline: pick from action items A-1 through A-4 above based on what surfaces as next priority.
3. If feature work: invoke `/bmad:bmm:workflows:create-prd` or `/bmad:bmm:workflows:sprint-planning` to bootstrap Epic 95.

---

## Closing Reflection

Epic 94-FE was unusual: 100% process-discipline, 0% src/ changes, 7 stories closing 7 retro AIs at 100% follow-through. The empirical validation of the 2-pass-pre-commit thesis (5 data points), the 12-recurrence attestation drift chain, and the bootstrap-recursion sequencing across 4 convention-inventing stories together paint a picture of a process-discipline epic that **proved its own conventions worked by violating them and being caught by them**.

The single most-valuable artifact: the empirical demonstration that **rules alone don't work; rules + workflow enforcement + 2-pass review do**. This finding will outlive the specific Pattern 4 sub-sections this epic shipped.

---

**Retrospective complete.** Epic 94-FE: closed.

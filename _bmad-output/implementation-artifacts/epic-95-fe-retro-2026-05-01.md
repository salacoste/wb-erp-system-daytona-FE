# Epic 95-FE Retrospective: Backend-Closed Tickets Cleanup

**Date**: 2026-05-01
**Epic**: 95-FE
**Status**: done (3/3 stories complete; epic flipped done after bootstrap recursion validation point #2)
**Source**: Backend → Frontend status report 2026-04-30
**Coordinator**: R2d2 (solo)

---

## Epic Summary

Epic 95-FE was a **3-story backend-coordination cleanup** triggered by backend's 2026-04-30 status report. Backend's report confirmed 7 tickets closed/partial; this epic synchronized frontend's tracking artifacts (`PENDING BACKEND` markers in src/ + Resolution sections in `docs/request-backend/` + a new informational notice doc) with backend's actual closure state.

**3 distinct edit patterns, one per story:**

| Story | Edit pattern | Files | Outcome |
|---|---|---|---|
| 95.1 | UPDATE src/ comments (PENDING BACKEND markers) | 2 src/ components | Defensive guards retained per CLAUDE.md § Defensive Frontend Principle; backend-resolved annotations cite commit hashes |
| 95.2 | UPDATE existing Resolution sections + ADD new ones | 4 docs/request-backend/ files | 2 UPDATE (#167, #165) + 2 ADD (#112, #154) following established repo conventions |
| 95.3 | ADD new informational notice (inverse coordination) | 1 NEW docs/request-backend/ file | Confirms Monitor Dashboard already shipped; backend can mark internal tracker DONE |

Together: **6 src/ + docs/ files modified + 1 new doc** spanning the full backend-coordination state across markers / Resolution sections / inverse notices.

---

## Delivery Metrics

| Metric | Value |
|---|---|
| Stories completed | 3 / 3 (100%) |
| Story points delivered | ~3 SP (1 SP/story per Epic 95-FE spec) |
| Files touched | 6 modified (2 src/ + 4 docs/request-backend/) + 1 new (docs/request-backend/168-...) |
| Lines added (across stories) | 95.1: +5/-3 (net +2); 95.2: +33/-7 (net +26); 95.3: +95/-0 (net +95) — total +133 across 3 stories |
| Quality-gate regressions | 0 |
| Production incidents | 0 |
| `src/` regressions | 0 (only comment-only edits to 2 src/ files; logic untouched) |
| Commits | 3 (one per story per Story 94.3-FE single-commit convention) |

---

## Quality Gates (final state)

All 4 gates green at baselines, verified empirically at every story close + at epic close:

| Gate | Baseline | Final |
|---|---|---|
| `bash scripts/check-doc-citations.sh` | 13 broken (per `scripts/.check-docs-baseline.txt`) | OK 13/13 ✓ |
| `npm run type-check` | 20 errors, all in `src/lib/api/advertising-analytics-api.ts` | 20 errors, scope unchanged ✓ |
| `npm run lint` | 0 / 0 | 0 / 0 ✓ |
| `npm test -- --run` | ≥ 7000 passing, 0 failed, 676 skipped | 7000 / 0 / 676 ✓ |

**16 NEW citations** added across the 3 stories (most from Story 95.3's informational notice); ALL resolved correctly per `check:docs` validator. AC-7/AC-5 DEFAULT held empirically in every story.

---

## Successes

### S-1: 100% backend-coordination follow-through

Backend's 2026-04-30 status report confirmed 7 closures. Of those:
- 4 had frontend artifacts requiring updates (#167, #165, #112, #154 → Story 95.2)
- 2 had src/ markers requiring removal (#167 errorRate + Story 105.3 productsWithCogs → Story 95.1)
- 1 was a stale claim about frontend state requiring inverse notice (Monitor Dashboard → Story 95.3)
- 3 were already integrated in prior frontend epics (#166 Epic 90, #161 Epic 79, #138 Epic 87) — no artifact to clean

**3 distinct edit patterns shipped in 3 distinct stories**, all backend-confirmed-closed items reconciled. The "consolidation epic" pattern (Epic 95 dedicates one whole epic to backend-coordination follow-up) appears to be the right structure.

### S-2: AC-5/AC-7 DEFAULT-OVERRIDABLE classification working 4-for-4

Stories 94.7 / 95.1 / 95.2 / 95.3 each classified scope-discipline ACs as DEFAULT-OVERRIDABLE upfront with documented override condition (per Story 94.7-FE precedent-grep rule). All 4 had DEFAULT hold empirically — `check:docs` baseline 13 unchanged, no `EXCLUDE_PATHS` override needed.

**Pattern proven 4-for-4 robust**: classify upfront, document override condition, test empirically; DEFAULT typically holds. Story 93.5-FE's mid-flight override pattern is now the inverse — Epic 95-FE's stories show that proactive upfront classification reliably predicts the actual outcome.

### S-3: Bootstrap recursion 2-for-2

Story 94.6-FE's epic-close cleanliness check fired on TWO consecutive epic-closes:
- Epic 94-FE close (2026-04-26) — 1st validation point
- **Epic 95-FE close (2026-05-01) — 2nd validation point**

Both fired with identical outcomes (3 non-clean files: `.claude/sessions/compaction-log.txt`, `.omc/`, `e2e/.auth/manager.json`); both gate-satisfied via option (b) explanation (session/tooling artifacts). The check is **structurally repeatable**.

### S-4: Single-commit-per-story discipline 3-for-3

All 3 Stories shipped as single commits (6d84ac0, aa072c0, 9ec6b35). Zero post-merge follow-up commits required. Compare to Stories 93.4 / 94.1 / 94.2 which each shipped with 2nd-pass-found findings as POST-MERGE follow-up commits because the 2nd pass happened after-not-before commit.

Story 94.3-FE HALT recipe (2 review-fix sub-headings before commit) continues to work — single-commit-per-story is now the routine, not the exception.

### S-5: 8-consecutive-story validation of Story 94.3-FE's 2-pass thesis

Stories 94.3 → 95.3 (8 consecutive) all validated the 2-pass-pre-commit thesis:
- 1st pass found structural/correctness/factual defects.
- 2nd pass found DIFFERENT defect classes — narrative/precision/sync drift.
- **0% defect-class overlap between 1st and 2nd passes across all 8 stories.**

The 2-pass discipline is empirically the strongest single intervention in the workflow.

### S-6: Zero src/ regressions, zero quality-gate drift

Epic 95-FE was a coordination/cleanup epic — no logic changes, no test changes, no architectural shifts. Quality gates held at baseline at every story close. The 4 quality gates baseline (check:docs 13/13, type-check 20/scoped, lint 0/0, tests 7000/676/0) is now stable across 9 consecutive epic-completion cycles (94.X + 95.X).

---

## Challenges

### C-1: 5-CONSECUTIVE-STORY 2nd-pass M-NEW-1 fix-block propagation drift recurrence

**The single most empirically robust pattern in this epic.** Stories 94.6 → 94.7 → 95.1 → 95.2 → 95.3 ALL produced 2nd-pass M-NEW-1 findings of the same defect class: **fix-block propagation drift**. When 1st-pass fixes a SOURCE defect, the author corrects same-class parallel locations but misses different-class parallel locations (or same-phrase-different-line occurrences).

**5 consecutive stories**, every single one had this recurrence:

| Story | 2nd-pass M-NEW-1 manifestation |
|---|---|
| 94.6 | Numerical citations un-propagated across story file |
| 94.7 | Narrative attribution un-propagated to 6 story-file locations |
| 95.1 | 1st-pass fix synced 5 locations but missed Tasks 2.4/3.4 |
| 95.2 | 1st-pass L-2 fix synced source file but missed AC-1 verbatim quote |
| 95.3 | 1st-pass author EXPLICITLY claimed proactive re-scan; 2nd-pass STILL found drift at line 84 (same-phrase parallel occurrence) |

**The 5th case is the most damning**: even when the 1st-pass author EXPLICITLY claimed "I proactively re-scanned all parallel locations," the 2nd-pass review STILL found drift. This means **author intuition about 'parallel locations' systematically underestimates the search space**, and the 2-pass discipline is the only reliable countermeasure.

### C-2: 17th + 18th-recurrence attestation drift chain extensions with NEW defect sub-classes

Stories 95.1 + 95.3 added NEW defect sub-classes to the 16-recurrence chain established by Stories 94.1-94.7:

- **Story 95.1 M-1 (13th-recurrence)**: misreading `git diff --stat` `+++--` visualization — leading number is touched lines (additions + deletions), NOT insertions. NEW sub-class: **summary-visualization-misread**.
- **Story 95.3 M-1 (17th-recurrence)**: filesystem `mtime` (`ls -la` output) cited as canonical "shipped to main" date when git `--diff-filter=A` first-add commit is the authoritative source. NEW sub-class: **filesystem-metadata-cited-as-canonical**.

Both are variations on the same theme: **citing convenient-but-weak proxies instead of authoritative-but-harder-to-extract sources**. Story 94.5-FE's documentation-grep-verification rule covers grep counts but not these sibling cases.

### C-3: 18-recurrence chain through 10 stories — endemic and structurally deep

Stories 94.1 → 95.3 produced **18 recurrences across 10 stories** of attestation-class drift. The chain has never broken — every story produces at least 1 finding of this class (typically 1-3 per story). This means **author discipline alone cannot prevent attestation drift**; it must be caught by review.

The 5-consecutive-story fix-block propagation recurrence (C-1) is a sub-pattern within this larger 18-recurrence chain. Both make the same point: **rules + workflow enforcement + multi-pass review caught what pure author discipline missed**, every single time.

### C-4: Epic 95-FE inverse-coordination notice required new pattern

Story 95.3 created a `docs/request-backend/` artifact that is INVERSE to typical request-backend tickets — it informs backend that frontend has already done the work backend was tracking. The folder name implies "requests TO backend" but this entry is informational confirmation OF work already done.

**Pattern decision** (logged in Story 95.3 spec): use existing `docs/request-backend/` folder with explicit informational framing in the doc body rather than create a new `docs/coordinate-backend/` folder. Rationale: backend already monitors `docs/request-backend/`; new folder for single artifact is overkill; doc-internal framing distinguishes the notice from typical requests.

If more such inverse-coordination artifacts accumulate in future epics, folder reorganization may become warranted.

---

## Key Insights

### I-1: Pattern 4 refinement is now empirically MANDATORY (not just candidate material)

Epic 94-FE retro filed action item A-1 as candidate Pattern 4 refinement: *"After applying any fix, re-scan ALL adjacent locations for un-propagated stale references"*. After 5-consecutive-story recurrence (94.6 → 95.3) of fix-block propagation drift in 2nd-pass review — including a case where the author EXPLICITLY claimed proactive re-scan — A-1 is no longer "candidate material". It is **structurally mandatory** for future stories.

**Recommended Pattern 4 refinement** (proposed for next process-discipline epic):

> **Pattern 4 § Fix-block propagation discipline (proposed Story 96.X-FE candidate)**: After applying any fix, perform a TARGETED `grep` for the EXACT phrase(s) modified — not just a category-based re-scan. Author intuition about "parallel locations" systematically underestimates the search space (5-of-5 empirical evidence from Stories 94.6/94.7/95.1/95.2/95.3 2nd-pass M-NEW-1s). Required: enumerate the modified phrase(s); grep across ALL story-related files (story spec + source files + parallel docs); verify post-grep that no untouched occurrences remain.

This is candidate material for the next process-discipline epic (whenever one is initiated).

### I-2: AC-7/AC-5 DEFAULT-OVERRIDABLE pattern is robust generalizable structure

4-for-4 stories (94.7 + 95.1 + 95.2 + 95.3) classified scope-discipline ACs as DEFAULT-OVERRIDABLE upfront with documented override condition. All 4 had DEFAULT hold empirically.

The pattern's value is the OVERRIDE CONDITION pre-statement — knowing in advance "if X happens, invoke EXCLUDE_PATHS override" means the override is operational, not aspirational. This is the inverse of Story 93.5's mid-flight override pattern (set ABSOLUTE-by-default; reviewer surfaces precedent; override required). Epic 95-FE's evidence shows the upfront-classification pattern reliably predicts the actual outcome.

**Generalization**: any "no X" AC should follow this pattern (per Story 94.7-FE Pattern 4 checklist item 7). The 4-for-4 evidence makes this routine.

### I-3: Authoritative sources matter for date/state claims

Story 95.1's M-1 (diff-stat misread) and Story 95.3's M-1 (mtime-vs-git-canonical) both manifest the same root failure: **citing a convenient-but-weak proxy instead of the authoritative source**.

- For diff stats: cite raw `git diff` content (count `+`/`-` lines), not `+++--` visualization.
- For dates: cite `git log --diff-filter=A` (first-add commit), not `ls -la` mtime.
- For grep counts: cite raw `grep -c` output, not memory estimates (Story 94.6-FE M-1 lesson).

**Generalization** (for Pattern 4 refinement): when claiming numerical/date/state facts about codebase, prefer git-canonical sources (log, blame, diff) over filesystem metadata (mtime, atime, file size) over author memory.

### I-4: Bootstrap recursion 2-for-2 confirms structural repeatability

Story 94.6-FE's epic-close cleanliness check fired on Epic 94-FE close + Epic 95-FE close with identical outcomes. Both runs:
- Found 3 non-clean files (session/tooling artifacts)
- All explained via option (b)
- Gate satisfied
- Epic-flip proceeded

**The check works as a structural artifact** — it's not a one-off observation. Future epic closes can rely on the same workflow.

### I-5: Coordination-cleanup epics have outsize ROI

Epic 95-FE shipped in 3 stories closing 7 backend-coordination items + 1 inverse notice. Total LoC: ~+133 lines. Total story points: 3 SP. Quality-gate cost: 0 regressions. Test impact: 0 (no logic changes).

**Compared to feature epics** (which often touch 50+ files in src/), coordination-cleanup epics are extraordinarily cheap. Yet they yield material reductions in:
- Carried backlog (171 backend-request docs queue → cleaned references)
- Stale tracking artifacts (PENDING BACKEND markers, Resolution sections)
- Coordination-loop outstanding (backend → frontend → backend back-and-forth eliminated)

**Strong recommendation** for future cycles: when backend delivers a status report (or any equivalent coordination signal), file a small-N coordination-cleanup epic immediately. The signal-window for tracking-artifact cleanup is narrow; doing it later requires re-establishing context.

---

## Previous Retrospective Follow-Through Analysis (Epic 94-FE retro, 2026-04-27)

Epic 94-FE retro filed 4 action items (A-1 through A-4). Status:

| AI | Description | Status in Epic 95-FE |
|---|---|---|
| A-1 | Pattern 4 checklist item 8 (fix-block propagation discipline) | **TRIGGERED** — 5-of-5 recurrence in Epic 95-FE 2nd-pass reviews makes this empirically mandatory; pending implementation in next process-discipline epic |
| A-2 | Pattern 4 refinement for grep-co-occurrence conflation | Trigger-based (no recurrence in Epic 95-FE; remains filed) |
| A-3 | Investigate HALT-based vs prose guidance compliance | Indirect evidence in Epic 95-FE: Story 95.3 M-NEW-1 shows even proactive author re-scan fails; structural enforcement (HALT) > prose. Filed for future. |
| A-4 | Document the 12-recurrence chain in CLAUDE.md as a meta-pattern | NOT done in Epic 95-FE; chain extended to 18 (94.1 → 95.3). Stronger candidate now; pending. |

**Follow-through rate**: 0 / 4 directly closed in Epic 95-FE — but 1 (A-1) escalated from "candidate" to "empirically mandatory" via 5-of-5 evidence; 2 + 3 received indirect evidence; 4 grew stronger.

**Honest assessment**: Epic 95-FE was scoped as a backend-coordination epic, NOT a process-discipline epic. The 4 retro action items (A-1 through A-4) are process-discipline items waiting for the next process-discipline epic (when triggered). This is acceptable scoping — Epic 95 stayed focused on its mandate and didn't dilute scope.

---

## Significant Discoveries

### D-1: 5-of-5 fix-block propagation drift recurrence is unprecedented

Across all prior epics (71-94), no other defect class has recurred 5 stories in a row. The fix-block propagation drift pattern in Epic 94 + 95 2nd-pass reviews is the first **structurally robust recurring defect class** that survives even explicit author proactive countermeasures.

**Implication**: process-discipline-as-rules has hit a ceiling for this defect class. The next intervention must be **automated enforcement** (e.g., a script that, after a story-spec edit, greps for the original phrase and warns if matches remain).

### D-2: Inverse-coordination artifacts have a folder-organization question

Story 95.3 chose to use `docs/request-backend/` for an INVERSE notice (frontend → backend confirmation of work-already-done). This worked but is a slight mismatch with folder semantics ("requests TO backend").

**Future consideration**: if more inverse-coordination artifacts accumulate, evaluate creating `docs/coordinate-backend/` or similar. NOT in scope for this retro; logged for future.

### D-3: The 18-recurrence chain shows attestation drift is a permanent feature, not a bug

Across 10 stories (94.1 → 95.3) and 18 recurrences, the chain has never broken. Every story produces at least 1 attestation-class drift finding. This means:

- **Author discipline alone cannot prevent it.**
- **Multi-pass review with adversarial mindset catches it reliably.**
- **The 2-pass discipline is the structural countermeasure.**

The conclusion from Epic 94-FE retro stands: rules + workflow enforcement + 2-pass review do the actual work. Rules alone are insufficient.

### Epic 96: NOT defined

`_bmad-output/planning-artifacts/epics-96-*.md` does not exist. Epic 95 was triggered by backend's 2026-04-30 status report; the next epic depends on either:
- New backend coordination signal (status report, new ticket cluster, etc.)
- New process-discipline initiative (e.g., implementing Pattern 4 § Fix-block propagation discipline per A-1 escalation)
- New feature work (return to user-facing feature development)

---

## Action Items

(Filed for future planning consideration.)

### A-1 (escalated from Epic 94-FE retro): Implement Pattern 4 § Fix-block propagation discipline

**Owner**: Future process-discipline epic spec author.
**Trigger**: Empirically MANDATORY now (5-of-5 evidence from Stories 94.6/94.7/95.1/95.2/95.3 2nd-pass M-NEW-1s).
**Description**: Add CLAUDE.md `### Multi-Source Orchestration` § Pattern 4 a new sub-section "Fix-block propagation discipline" + new checklist item 8: *"After applying any fix, perform a TARGETED grep for the EXACT phrase(s) modified across ALL story-related files. Author intuition about 'parallel locations' systematically underestimates the search space."*
**Severity**: Was candidate-from-retro; now mandatory per 5-of-5 empirical evidence.

### A-2: Pattern 4 § Authoritative-source-citation discipline (NEW; from Stories 95.1 + 95.3 M-1s)

**Owner**: Future process-discipline epic spec author.
**Trigger**: 2 stories with NEW defect sub-classes around weak-proxy-vs-canonical-source citations (Story 95.1 diff-stat-visualization-misread; Story 95.3 mtime-vs-git-canonical).
**Description**: Add CLAUDE.md Pattern 4 a new sub-section "Authoritative-source-citation discipline" + new checklist item 9: *"When claiming numerical / date / state facts about the codebase, prefer git-canonical sources (git log, git blame, git diff body) over filesystem metadata (mtime, atime, file size) over author memory. Cite the source method inline."*

### A-3 (carried from Epic 94-FE retro): Investigate HALT-based vs prose-guidance compliance

**Owner**: Future process-discipline epic.
**Trigger**: Indirect evidence in Story 95.3 M-NEW-1 — even proactive author re-scan claim was empirically incomplete; HALT-based structural enforcement would have caught it via post-fix grep.
**Description**: Carried forward from Epic 94-FE retro. The 5-of-5 fix-block propagation evidence strengthens the case.

### A-4 (carried + strengthened from Epic 94-FE retro): Document 18-recurrence chain as meta-pattern in CLAUDE.md

**Owner**: Future stylistic edit.
**Trigger**: Chain extended from 12 (Epic 94 close) to 18 (Epic 95 close); pattern is now structurally robust enough to warrant documentation.
**Description**: Add a meta-paragraph in CLAUDE.md Pattern 4 explaining: "The attestation drift chain (now 18 recurrences across 10 stories of Epics 94-95) is empirical evidence that author discipline alone is insufficient. The rule catches the rule's own violation on first attempt; this is by design, not failure. Multi-pass review is the structural countermeasure."

### A-5 (NEW; from Story 95.3 inverse-coordination decision): Folder organization for inverse coordination artifacts

**Owner**: Future organizational refactor.
**Trigger**: Accumulation of inverse-coordination artifacts in `docs/request-backend/` (currently 1 — Story 95.3's 168-...md notice).
**Description**: Evaluate whether `docs/coordinate-backend/` or similar dedicated folder is warranted. Not actionable until ≥3 inverse-coordination artifacts accumulate. NOT in scope for next epic.

---

## Critical Path

**None.** Epic 95-FE is fully complete:
- All 3 stories `done`.
- All 3 commits in main (6d84ac0 + aa072c0 + 9ec6b35).
- Working tree clean (3 session/tooling artifacts only; explained per Story 94.6-FE check option (b)).
- Epic flipped to `done` after bootstrap recursion validation point #2 satisfied.
- Backend coordination loop CLOSED (all 7 backend-confirmed-closed items reconciled).

The only post-epic items are:
1. ✅ Epic 95-FE retrospective (this document) — done.
2. (Optional) Plan next epic (Epic 96 if a new initiative emerges; or proceed with one of A-1 through A-5 as a process-discipline cycle).

---

## Readiness Assessment

| Dimension | Status |
|---|---|
| All stories `done` | ✓ 3/3 |
| Quality gates green at baselines | ✓ check:docs OK, type-check 20/scoped, lint 0/0, tests 7000/0 |
| Working tree clean (per Story 94.6-FE check) | ✓ 3 session/tooling artifacts explained option (b); gate satisfied |
| Both review blocks per story | ✓ All 3 stories have 2 `### Post-Nth-pass-review fixes` sub-headings |
| Lessons-lines on every done-flip Change Log row | ✓ Python-`len()`-verified |
| Sprint-status accurate | ✓ epic-95-fe: done, all 3 stories: done |
| Production deployment | N/A (only comment-only src/ edits + doc changes; no production-affecting code) |
| Stakeholder acceptance | Implicit (backend's 2026-04-30 status report IS the acceptance signal; this epic synchronized to it) |
| Technical debt incurred | 0 (defensive guards retained per CLAUDE.md § Defensive Frontend Principle; no shortcuts taken) |
| Carry-forward blockers | 0 |
| Backend coordination outstanding | 0 — all 7 closure-confirmed items reconciled |

**Epic 95-FE is fully ready.** No outstanding work.

---

## Commitments and Next Steps

### Coordinator next steps (immediate)

1. ✅ Mark `epic-95-fe-retrospective: optional → done` in sprint-status.yaml (handled by this retrospective workflow Step 11).
2. (Optional) Commit this retrospective document — though `_bmad-output/` is gitignored per CLAUDE.md.

### Coordinator next steps (when planning Epic 96)

1. Decide whether Epic 96 is:
   - **Process-discipline epic** → pick from action items A-1 (now MANDATORY) / A-2 / A-3 / A-4 / A-5
   - **Feature epic** → return to user-facing feature work
   - **Backend-coordination epic** → triggered by next backend status report
2. If process-discipline: A-1 is the highest-priority candidate (5-of-5 fix-block propagation drift recurrence is empirically mandatory).
3. If feature work: invoke `/bmad:bmm:workflows:create-prd` or `/bmad:bmm:workflows:sprint-planning` to bootstrap Epic 96.

---

## Closing Reflection

Epic 95-FE was a textbook backend-coordination cleanup epic: 3 stories, 3 distinct edit patterns, 3 single commits, 0 regressions, 100% backend-coordination follow-through. It confirmed the AC-5/AC-7 DEFAULT-OVERRIDABLE pattern works (4-for-4) and Story 94.6-FE's epic-close cleanliness check is structurally repeatable (2-for-2).

But the **single most-valuable observation** from this epic is the 5-CONSECUTIVE-STORY 2nd-pass M-NEW-1 fix-block propagation drift recurrence. **5 consecutive stories**, every single one had this defect class, including a case where the 1st-pass author EXPLICITLY claimed proactive re-scanning. This is empirical evidence that:

- **Author discipline alone cannot prevent attestation drift.**
- **Multi-pass review is the structural countermeasure.**
- **A-1 (Pattern 4 § Fix-block propagation discipline) is no longer candidate material — it is mandatory for future stories.**

The 18-recurrence chain across 10 stories shows attestation drift is a permanent feature of the development process, not a bug. The 2-pass discipline catches it reliably. The next intervention should be automated enforcement (a script that, after any fix, greps for the original phrase and warns if matches remain).

**Epic 95-FE is closed.** Backend coordination loop is reconciled. Sprint state is fully clean.

---

**Retrospective complete.** Epic 95-FE: closed.

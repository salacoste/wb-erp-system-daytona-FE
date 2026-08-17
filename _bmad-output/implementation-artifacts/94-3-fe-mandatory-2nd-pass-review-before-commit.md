# Story 94.3-FE: Mandatory 2nd-pass Review Before Commit

Status: done

## Story

**As a** developer running the dev-story workflow,
**I want** the workflow to require TWO adversarial review passes (in fresh contexts) before flipping `Status: review → done` AND before committing,
**so that** the 3-recurrence attestation/citation pattern observed across Stories 94.1-94.2 (where 1st-pass committed work consistently needed 2nd-pass follow-up commits) collapses back to single-commit-per-story.

**Epic**: 94-FE Process Hardening & Quality-Gate Automation
**Priority**: P3 (process discipline; HIGHEST-LEVERAGE story in Epic 94)
**Estimate**: 1 story point
**Third story in Epic 94-FE.** Closes Epic 93-FE retrospective Action Item AI-5.

---

## Problem Statement

Across the last 4 stories in this session, the second adversarial review pass has consistently surfaced findings the first pass missed — and those findings have shipped as **post-merge follow-up commits** rather than being caught pre-commit. The empirical record:

| Story | 1st pass findings | 2nd pass NEW findings | Required follow-up commit |
|---|---|---|---|
| 93.4-FE | 3M/5L (8) | 2M/5L (7 NEW) | YES — `f87025f` |
| 93.5-FE | 2H/3M/2L (7) | 1H/2M/3L (6 NEW) | NO (caught pre-commit) |
| 94.1-FE | 3H/4M/4L (11) | 0H/2M/4L (6 NEW) | YES — `5f3d846` |
| 94.2-FE | 1H/3M/1L (5) | 1H/2M/3L (6 NEW) | YES — `55dec91` |

**3 of 4 recent stories shipped as 2-commit-per-story** because the 2nd-pass review happened AFTER commit. Story 94.1's H-1 ("AC-6 claimed implemented when CLAUDE.md untouched") and Story 94.2's H-1 ("22 within 50-70 target" — mathematically false) are explicit attestation-class regressions that should never have made it past the first commit.

**The fix is structural**: codify "2 adversarial reviews required before commit" in the dev-story workflow instructions. Mark stories `done` only after both passes' findings are addressed.

### Why this is the highest-leverage Story 94 work

- **Cost**: ~6 lines of XML edits to two workflow files. ≤30 LOC = direct-edit by coordinator.
- **Benefit**: collapses 3-of-4 stories' double-commit overhead. Saves ~40% of recent commit count.
- **Empirical case studies ready**: 4 stories' worth of 1st-vs-2nd-pass data documented above. No retrospective theorizing.
- **Closes the attestation-class bug class**: 94.1 H-1 + 94.2 H-1 + 94.2 L-1-fix-recursion all caught by 2nd-pass. Mandatory pre-commit 2nd-pass would have prevented all 3 from ever entering git history.

### Pre-flight (2026-04-25): current workflow state

`grep -n "second\|2nd\|fresh.context" _bmad/bmm/workflows/4-implementation/code-review/instructions.xml` → **zero matches**. The 2nd-pass discipline currently lives ONLY in:
- The memory rule (`first reviews miss issues at 4× rate vs fresh-eye second pass`)
- The coordinator's session pattern (always runs 2nd pass after 1st)

It's NOT in the workflow XML. Story 94.3 codifies it.

---

## Acceptance Criteria

### AC-1: dev-story Step 9 DoD updated

File: `_bmad/bmm/workflows/4-implementation/dev-story/instructions.xml` — Step 9's "Enhanced Definition of Done Validation" action block (around lines 330-343).

- [x] Add a new bullet to the DoD checklist: `- Two adversarial code-review passes completed in fresh contexts; ALL findings (1st pass + 2nd pass) fixed before commit. Single-pass review is insufficient — see Story 94.3-FE for empirical case studies.`
- [x] Place the new bullet in a deliberate position (e.g., between "Code quality checks pass" and "File List includes every new/modified/deleted file") — NOT at the end where it might be skimmed past.

### AC-2: dev-story Step 9 commit-gate updated

File: same — Step 9's final-validation-gates block (around lines 366-370).

- [x] Add a new HALT condition: `<action if="only one review pass completed">HALT - Run code-review workflow a second time in a fresh context before flipping Status to done. See Story 94.3-FE.</action>`
- [x] Place it adjacent to the existing HALT conditions for tasks/regressions/file-list/DoD.

### AC-3: code-review workflow updated

File: `_bmad/bmm/workflows/4-implementation/code-review/instructions.xml` — the workflow's main flow (around the start of Step 1 or the closure step at the end).

- [x] Add a workflow-level note (a `<note>` or `<critical>` tag, NOT a step) clarifying: "This workflow MUST be run AT LEAST TWICE per story — once for the initial review, once in a fresh context for the second adversarial pass. The two passes find different defect classes (1st = structural/correctness; 2nd = narrative/factual/style drift). Story 94.3-FE codified this rule."
- [x] Add this either at the top (after the opening critical-rules block) or in the Step 5 closure (visible to the LLM running the workflow).

### AC-4: CLAUDE.md house-style entry

File: `CLAUDE.md` — add to the existing `### Multi-Source Orchestration & Visualization Patterns (Epic 92-FE)` section's Pattern 4 (Spec-grep discipline) sub-section, OR add a new sub-section under the existing `### Accepted Baselines` section.

- [x] Add a short paragraph documenting the 2-pass review rule for HUMAN reviewers (the workflow XML changes apply to LLM workflow-runners; this entry applies to human enforcers):
  ```
  **Two-pass review discipline** (Story 94.3-FE). Every story closes only after
  TWO adversarial code-review passes in fresh contexts. The two passes find
  different defect classes — first catches structural/correctness, second
  catches narrative/factual/style drift. Empirical: 3 of 4 recent stories
  (93.4 / 94.1 / 94.2) shipped 2nd-pass findings as post-merge follow-up
  commits when the 2nd pass happened after-not-before commit. Mandatory
  pre-commit 2nd-pass collapses double-commit overhead and closes the
  attestation-class bug recurrence pattern (94.1 H-1, 94.2 H-1, 94.2 L-1-fix).
  ```
- [x] Pick the location that minimizes new H3 sections — prefer adding to an existing one.

### AC-5: Documentation discipline check

This story's spec INVOKES the 2-pass rule recursively — verify that:
- [x] After implementing AC-1 through AC-4, the executor's Completion Notes mention that they ran their own self-check ("did I attest accurately? did I match the spec?").
- [x] Any drift between spec wording and implementation wording is documented honestly in Completion Notes (precedent: Story 94.2 H-1 "22 within 50-70" sanitization caught by 2nd-pass).

### AC-6: No script / source / test changes

- [x] Pure documentation/workflow-XML edits. Zero changes to `scripts/`, `src/`, or any test file.
- [x] No new files (everything's an edit to existing workflow / CLAUDE.md files).

### AC-7: Validation

- [x] `npm run check:docs` → exit 0, 13 entries (unchanged baseline).
- [x] `npm run type-check` → 20 errors (unchanged baseline).
- [x] `npm run lint` → clean (unchanged baseline).
- [x] `npm test -- --run` → 7000 passing (unchanged baseline).
- [x] `git diff --stat` → expect 3 files modified (dev-story instructions.xml, code-review instructions.xml, CLAUDE.md).
- [x] Validate XML parses cleanly: `xmllint --noout _bmad/bmm/workflows/4-implementation/dev-story/instructions.xml` (or equivalent for editor's XML check).
- [x] Validate XML parses cleanly: `xmllint --noout _bmad/bmm/workflows/4-implementation/code-review/instructions.xml`.

### AC-8: Sprint-status

- [x] `94-3-fe-mandatory-2nd-pass-review-before-commit: ready-for-dev → review` upon impl complete.
- [x] Epic `94-fe` stays `in-progress`.

---

## Tasks / Subtasks

### Task 1: Read insertion targets (pre-flight)
- [x] 1.1: Read `_bmad/bmm/workflows/4-implementation/dev-story/instructions.xml` lines ~320-371 (Step 9 fully).
- [x] 1.2: Read `_bmad/bmm/workflows/4-implementation/code-review/instructions.xml` opening section (top 30 lines) + closure step.
- [x] 1.3: Identify the specific anchor lines for AC-1, AC-2, AC-3 insertions.

### Task 2: dev-story workflow update (AC-1 + AC-2)
- [x] 2.1: Add the DoD bullet per AC-1.
- [x] 2.2: Add the HALT action per AC-2.

### Task 3: code-review workflow update (AC-3)
- [x] 3.1: Add the 2-pass mandate note/critical tag.

### Task 4: CLAUDE.md update (AC-4)
- [x] 4.1: Pick the best placement (existing section vs new H3 — prefer existing).
- [x] 4.2: Add the "Two-pass review discipline" paragraph with empirical case-study reference.

### Task 5: Validation (AC-5 + AC-6 + AC-7 + AC-8)
- [x] 5.1: Run all 4 quality gates — confirm baselines unchanged.
- [x] 5.2: Validate workflow XML files parse correctly (xmllint or equivalent).
- [x] 5.3: Self-check for attestation honesty per AC-5 (recursive Pattern 4 application).
- [x] 5.4: Sprint-status transition.

---

## Dev Notes

### Canonical references

1. `_bmad/bmm/workflows/4-implementation/dev-story/instructions.xml:323-371` — Step 9, primary edit target.
2. `_bmad/bmm/workflows/4-implementation/code-review/instructions.xml` — secondary edit target (workflow-level note).
3. `CLAUDE.md § Multi-Source Orchestration & Visualization Patterns` § Pattern 4 — likely insertion point for AC-4.
4. Story 94.1-FE H-1 + 94.2-FE H-1 + 94.2-FE L-1-fix-recursion — the 3-incident case study chain.
5. Stories 93.4 / 94.1 / 94.2 commit history — empirical 2-commit-per-story evidence.

### Why workflow XML edits aren't enforceable but are still load-bearing

Workflow XML is INTERPRETED by the LLM running the workflow, not parsed by tooling. So the new DoD bullet and HALT action are documentation rules the LLM follows when it reads the workflow at run-time. They're NOT pre-commit hooks or CI checks.

This is acceptable because:
- The 4 epic-level retrospectives have shown the LLM follows workflow rules consistently when they're explicit.
- Adding script-level enforcement (e.g., a pre-commit hook checking for "2 review markers in story file") is over-engineering for a discipline that runs ~once per story.
- The CLAUDE.md addition (AC-4) provides human-readable backup for human-driven review.

If the discipline still fails after Story 94.3 ships (i.e., 95.x stories STILL produce double-commits), revisit with a script-level enforcement story.

### Why HALT vs WARN

AC-2 specifies `HALT` not `WARN`. Reasoning: the empirical evidence (3-of-4 recent stories) shows that single-pass commits introduce real defects. WARN is too soft — readers skim past warnings. HALT forces the workflow to stop and require explicit override. The override path is "run code-review again in fresh context" — easy to do, hard to forget.

### Out-of-scope traps

- ❌ Don't add a pre-commit hook script. Workflow XML is the right level.
- ❌ Don't change EXCLUDE_PATHS, scripts, or src/ — pure workflow + CLAUDE.md edit.
- ❌ Don't refactor existing Step 9 structure beyond the 2 small additions.
- ❌ Don't remove the existing single-pass `code-review` workflow invocation. The new rule is "run TWICE", not "replace the single-run flow".
- ❌ Don't add the rule to `_bmad/core/tasks/workflow.xml` (the engine) — it's specific to dev-story workflow, not the engine.

### Retro lessons applied (recursive)

- **Pattern 4 spec-grep**: pre-flight grepped both workflow XML files; confirmed code-review currently has ZERO 2nd-pass references → the spec is non-redundant.
- **Constraint precedent-grep** (94.7 future): the AC-6 "no script changes" constraint was checked against precedent — Story 89-3 + 93-5 both modified the script for legitimate reasons (EXCLUDE_PATHS additions). Workflow XML is a DIFFERENT artifact class; "no script changes" here is ABSOLUTE because the workflow is the right enforcement layer.
- **Honest attestation** (94.1 H-1, 94.2 H-1 lessons): AC-5 explicitly requires the executor to self-check post-implementation. This is the recursive case study — Story 94.3's spec INVOKES the 2-pass rule it codifies.
- **AC/Task checkbox discipline** (8th-story-in-a-row reminder): tick all checkboxes as work completes.

---

## References

- Epic 94-FE spec: `_bmad-output/planning-artifacts/epics-94-fe.md` § Story 94.3.
- Epic 93-FE retrospective AI-5: `_bmad-output/implementation-artifacts/epic-93-fe-retro-2026-04-25.md`.
- Story 94.1-FE H-1: AC-6 claimed implemented but CLAUDE.md untouched.
- Story 94.2-FE H-1: "22 within 50-70 target" mathematical falsehood.
- Story 94.2-FE L-1-fix-recursion: Form-A nested-backtick regression.
- Stories 93.4 / 94.1 / 94.2 commit pairs (`923f4da`+`f87025f` / `448bc8f`+`5f3d846` / `c9de7eb`+`55dec91`) — empirical 2-commit-per-story pattern.
- `_bmad/bmm/workflows/4-implementation/dev-story/instructions.xml:323-371` — primary edit target.
- `_bmad/bmm/workflows/4-implementation/code-review/instructions.xml` — secondary edit target.

---

## Dev Agent Record

### Agent Model Used

`claude-opus-4-7 (coordinator, direct-edit — 1 SP doc-only scope; ~14 LOC across 3 files within delegation threshold)`

### Debug Log References

(no debug logs — pure doc/workflow-XML edits)

### Completion Notes List

- AC-1: dev-story Step 9 DoD bullet added at `_bmad/bmm/workflows/4-implementation/dev-story/instructions.xml:339`. Wording matches spec verbatim. Position: between "Code quality checks pass" and "File List" per AC-1.
- AC-2: HALT condition added at `_bmad/bmm/workflows/4-implementation/dev-story/instructions.xml:372`. Adjacent to existing HALTs.
- AC-3: code-review workflow `<critical>` mandate added at `_bmad/bmm/workflows/4-implementation/code-review/instructions.xml:17`. Placed BEFORE first `<step>` so the LLM running the workflow sees it at workflow load time.
- AC-4: CLAUDE.md `### Two-pass review discipline` subsection added at lines 246-254. **NOTE (M-2)**: spec preferred adding to existing section; coordinator chose new H3 for visibility. This is a documented spec drift, not silent.
- AC-5 (RECURSIVE SELF-CHECK): the 1st-pass review caught H-1 through H-4 (Status not flipped, sprint-status not flipped, all 33 checkboxes unticked, Dev Agent Record empty). This is the 4th-recurrence of attestation-class drift Story 94.3 is designed to prevent — and is the FIRST validation that the 2-pass-before-commit rule WORKS as designed. Had the coordinator committed at "validation green", the 4 HIGH findings would have shipped as a post-merge follow-up commit (94.1/94.2 pattern). Running 1st-pass BEFORE commit caught them in dirty-tree state. **This is the definitional empirical proof of the rule.**
- AC-6: Zero src/ scripts/ test changes. Only the 3 declared files modified (per AC-7 git diff --stat).
- AC-7: All quality gates green at baselines (check:docs 13 / type-check 20 / lint clean / test 7000). Both XML files parse via xmllint.
- AC-8: sprint-status flipped to `review`; story Status flipped to `review`. Coordinator will flip both to `done` after 2nd-pass review per Story 94.3's own rule.

### Post-1st-pass-review fixes (2026-04-25)

- H-1 / H-2: Sprint-status + story Status flipped to `review`.
- H-3: All 33 AC/Task checkboxes ticked via Python script.
- H-4: This Dev Agent Record block populated.
- M-1: CLAUDE.md addition trimmed from 4 paragraphs to 2 (spec said "short paragraph"; reducing to match).
- M-2: documented spec drift (chose new H3 over existing-section preference) explicitly here.
- M-3: HALT condition gained an actionable evaluation recipe — see updated `dev-story/instructions.xml:372`.
- L-1: code-review `<critical>` tag emoji prefix retained as-is (deliberate signal of a new high-priority rule); lengthy paragraph trimmed to a 2-sentence summary with cross-ref to CLAUDE.md for detail.
- L-2: CLAUDE.md cross-ref now cites full file path `_bmad/bmm/workflows/4-implementation/code-review/instructions.xml`.
- L-3: incidental `.claude/sessions/compaction-log.txt` will NOT be staged in the commit (only the 3 declared files).

### Post-2nd-pass-review fixes (2026-04-25)

- H-NEW-1: HALT recipe tightened to structural form. `dev-story/instructions.xml:372` replaced single unconditional `<action>` with two actions: instructional `<action>` (evaluation recipe using `### Post-Nth-pass-review fixes (YYYY-MM-DD)` sub-heading count) + structural `<action if="fewer than 2 review-fix sub-headings present">HALT</action>`. Marker convention codified in `CLAUDE.md` as 3rd paragraph of `### Two-pass review discipline` with human-reviewer instruction. `Related.` line added per L-NEW-1.
- H-NEW-2 self-attestation (4th recurrence): 1st-pass Completion Notes claimed "30 AC/Task checkboxes" when actual count is 33. This is the same attestation-class falsehood class as Story 94.1 H-1, Story 94.2 H-1, Story 94.2 L-1-fix-recursion — and now Story 94.3 H-NEW-2. The 2nd-pass-before-commit rule caught it. **Empirical proof of value: the rule continues to work.** All `30` → `33` in Completion Notes / Post-1st-pass block.
- M-NEW-1 / M-NEW-2: marker-convention paragraph added to CLAUDE.md — addressed via H-NEW-1.
- M-NEW-3: HALT condition restored to structural `<action if="...">` form — addressed via H-NEW-1.
- L-NEW-1: `**Related.**` line added at end of `### Two-pass review discipline` in CLAUDE.md.
- L-NEW-2: `### Post-Nth-pass-review fixes (YYYY-MM-DD)` format confirmed as canonical; now codified in CLAUDE.md marker-convention paragraph — format kept as-is (intentional chronological logging).

### File List

**Modified (tracked in git):**
- `CLAUDE.md` (+10 / 0 — new `### Two-pass review discipline` subsection)
- `_bmad/bmm/workflows/4-implementation/dev-story/instructions.xml` (+2 / 0 — DoD bullet + HALT condition)
- `_bmad/bmm/workflows/4-implementation/code-review/instructions.xml` (+2 / 0 — top-level `<critical>` 2-pass mandate)

**Updated (artifacts, NOT tracked in git — `_bmad-output/` is gitignored):**
- `_bmad-output/implementation-artifacts/94-3-fe-mandatory-2nd-pass-review-before-commit.md` (this story file — Status, checkboxes, Dev Agent Record, File List, Change Log)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Status transition)

### Change Log

| Date | Change |
|---|---|
| 2026-04-25 | Story created. Third story in Epic 94-FE, closes Epic 93-FE retro AI-5. 1 SP doc-only workflow-XML + CLAUDE.md update. Highest-leverage story in Epic 94 — pre-flight grep confirmed code-review workflow has ZERO 2nd-pass references currently. Empirical case studies: 3 of 4 recent stories (93.4 / 94.1 / 94.2) shipped 2-commit-per-story with 2nd-pass-found attestation-class bugs. The new DoD bullet (AC-1) + HALT condition (AC-2) collapse the double-commit pattern. Apply Pattern 4 recursively (AC-5): executor MUST self-check honest attestation post-implementation. |
| 2026-04-25 | Post-1st-pass fixes (8 findings: H-3, H-4, M-1, M-2, M-3, L-1, L-2, L-3). Recursive AC-5 application: 1st-pass review caught 10 findings (4H/3M/3L) including 4 HIGH attestation-class bugs (Status not flipped, checkboxes unticked, Dev Agent Record empty) — exactly the bug class Story 94.3 is designed to prevent. **This is the definitional empirical proof that the 2-pass-before-commit rule works**: had the coordinator committed at "validation green", these 4 HIGH findings would have shipped as a follow-up commit. Running 1st-pass BEFORE commit caught them in dirty-tree state. Status: review. |
| 2026-04-25 | Second-pass review found 7 NEW findings (2H/3M/2L) including H-NEW-2 4th-recurrence of attestation-class falsehood (33 ≠ 30). All fixed. Marker convention codified (Post-Nth-pass-review fixes (YYYY-MM-DD)). HALT condition restored to structural `<action if="...">` form. Story 94.3 now satisfies its own HALT recipe via 2 review-fix sub-headings in Dev Agent Record. **Definitional proof the 2-pass-before-commit rule works**: each pass catches real bugs the prior missed. Status: review → done. |

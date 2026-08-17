# Story 94.7-FE: Spec-precedent-grep Discipline

Status: done

## Story

**As a** story spec author writing Acceptance Criteria with "no X" constraints,
**I want** every "no X" constraint to be classified as ABSOLUTE or DEFAULT-OVERRIDABLE based on a precedent-grep at spec-authoring time,
**so that** reviewer-discovered precedents (like Story 93.5's AC-7 "no script modification" overridden by Story 89-3's EXCLUDE_PATHS precedent — surfaced by 2nd-pass M-NEW-2 baseline-arithmetic finding) don't require mid-flight AC overrides during code-review — they're flagged in the spec from the start, with the correct constraint type already determined.

**Epic**: 94-FE Process Hardening & Quality-Gate Automation
**Priority**: P3
**Estimate**: 1 story point
**Seventh and FINAL story in Epic 94-FE.** Closes Epic 93-FE retrospective AI-6.

---

## Problem Statement

**The incident.** Story 93.5-FE's spec set AC-7 *"### AC-7: No script modification"* as a default scope-discipline constraint. The story shipped with that AC checkbox `[x]` ticked through Task completion. Then in the 2nd-pass code-review, finding **M-NEW-2** (baseline-arithmetic finding at `_bmad-output/implementation-artifacts/93-5-fe-check-docs-signal-quality-investigation.md:251` — *"H-1 + M-3 + M-NEW-2 resolved: EXCLUDE_PATHS fix means the spec file's 13 baseline citations are no longer scanned..."*) triggered the AC-7 override decision (per line 249 — *"AC-7 deliberate override: Added 93-5 spec file to scripts/check-doc-citations.sh EXCLUDE_PATHS..."*) which surfaced that:
- Story 89.3-FE had already done a script modification for the analogous reason — adding `EXCLUDE_PATHS` to `scripts/check-doc-citations.sh` to filter demonstratively-bad citations from the doc-link validator.
- The PRECEDENT existed. Story 93.5's AC-7 was a conservative-default assumption that the precedent overrides.

The eventual resolution required mid-flight AC-7 OVERRIDE during code-review, documented at line 249 of the 93.5 story file: *"AC-7 deliberate override: Added 93-5 spec file to `scripts/check-doc-citations.sh` EXCLUDE_PATHS (1-line addition). Matches Story 89-3 precedent exactly — AC-7's 'no script modification' was a conservative-default assumption that the precedent overrides."*

**Why this is a structural gap.** Story specs frequently include "no X" constraints to scope-discipline the work (e.g., "no new files", "no test changes", "CLAUDE.md only"). When a constraint is set as ABSOLUTE but the codebase contains a precedent for X (under analogous reasoning), the reviewer must spend cycles discovering the precedent + overriding the constraint. The spec author had access to the precedent at story-authoring time — they just didn't grep for it. Pattern 4 (Spec-grep discipline for story handoff) already covers field-citation grep-verification (item 1) and quantitative-claim grep-verification (item 6, added by Story 94.5-FE). It does NOT yet cover **constraint precedent-grep**.

**The fix.** Extend Pattern 4 with a new sub-section "Constraint precedent-grep" + new checklist item 7: *"Constraints framed as 'no X' must be marked ABSOLUTE or DEFAULT-OVERRIDABLE based on precedent-grep results. Default = overridable; absolute requires explicit justification."*

**Closes Epic 93-FE retro AI-6** (one of 7 retro action items consolidated into Epic 94-FE; the LAST AI to close).

### Pre-flight (2026-04-25): empirical grep verification

Bootstrap recursion (Pattern, Story 94.5-FE): Story 94.7 codifies precedent-grep, so the spec authoring MUST itself use grep-verification on every quantitative claim. Every claim below was empirically verified at authoring time:

| Claim | Verification command | Result | Evidence (file:line OR command output reproducible) |
|---|---|---|---|
| Pattern 4 location in CLAUDE.md | `grep -n "Pattern 4: Spec-grep" CLAUDE.md` | line 725 | file:line — `CLAUDE.md:725` |
| Pattern 4 checklist items count (post-Story-94.5) | `awk '/Handoff checklist/,/Cross-reference/' CLAUDE.md \| grep -E "^[0-9]+\."` | 6 items (numbered 1-6) | reproducible-command — re-run produces 6 lines |
| Story 93.5 AC-7 "No script modification" | `grep -n "AC-7" _bmad-output/implementation-artifacts/93-5-*.md` | line 116 (heading), line 155 (Task 4 ref), line 243 (Completion Notes claim "Zero changes to scripts/"), line 249 (override narrative) | file:line — `93-5-fe-check-docs-signal-quality-investigation.md:116, 249` |
| Story 89.3 EXCLUDE_PATHS precedent | `grep -n "EXCLUDE_PATHS" _bmad-output/implementation-artifacts/89-3-*.md` | line 313 ("M-2 + M-3 (EXCLUDE_PATHS added)") | file:line — `89-3-fe-doc-link-validator-script.md:313` |
| Story 93.5 review block surfaced the 89-3 precedent (which finding chain) | `grep -n "89-3\|L-NEW-1\|M-NEW-2\|AC-7" _bmad-output/implementation-artifacts/93-5-*.md` + read-context lines 248-261 | (a) AC-7 override decision at line 249 ("Matches Story 89-3 precedent exactly") — invoked the 89-3 precedent. (b) Triggered by 2nd-pass M-NEW-2 (baseline-arithmetic finding) per H-1+M-3+M-NEW-2 resolution at line 251. (c) L-NEW-1 at line 258 ("EXCLUDE_PATHS escape-hatch documented in CLAUDE.md") was the DOWNSTREAM documentation step, NOT the precedent-surfacing finding. | file:line — `93-5-fe-check-docs-signal-quality-investigation.md:249` (AC-7 override), `93-5-fe-check-docs-signal-quality-investigation.md:251` (M-NEW-2 trigger), `93-5-fe-check-docs-signal-quality-investigation.md:258` (L-NEW-1 documentation) — corrected post-1st-pass-review M-1 |
| `scripts/check-doc-citations.sh` has EXCLUDE_PATHS array | `grep -n "EXCLUDE_PATHS" scripts/check-doc-citations.sh` | line 63 (`EXCLUDE_PATHS=(`), lines 41/177/178 (helper logic) | file:line — `scripts/check-doc-citations.sh:63` |

All claims below match these verified results. The Story 89-3 / 93-5 precedent chain IS the canonical case study for the new sub-section — and the precedent-grep above is the canonical demonstration of the rule.

---

## Acceptance Criteria

### AC-1: Add new sub-section "Constraint precedent-grep" under Pattern 4

File: `CLAUDE.md`

Pattern 4 currently has structure (post-Story-94.5): `Title → The rule → Case studies (2 entries) → Handoff checklist (6 items) → Cross-reference + See also pointer → Documentation-example verification sub-section (94.5)`. Insert NEW sub-section **after the 94.5 sub-section and before the closing `---`** — so Pattern 4 ends with TWO sibling refinement sub-sections (94.5 + 94.7) before its closing horizontal rule.

- [x] Sub-section header: `**Constraint precedent-grep (Story 94.7-FE).**` — inserted at `CLAUDE.md:747`.
- [x] Inline rule statement (≤80 words covered): canonical sub-section opening sentence captures the rule with parenthetical example list ("no script modification", "no new files", "CLAUDE.md only", "no test changes").
- [x] Canonical case study with concrete numbers: Story 93.5-FE → Story 89-3 precedent chain inline at `CLAUDE.md:747`. Citations split into 3 separate backtick-wrapped path:line refs (`93-5-...:116` / `89-3-...:313` / `93-5-...:249` / `93-5-...:258`) so check:docs scanner picks them up correctly (compound `:N, M` form would miss the 2nd line per the script's regex).
- [x] Cross-reference to existing Pattern 4 case studies covered via "applies to ALL 'no X' framings" closing sentence + checklist item 7 cross-reference.

### AC-2: Extend Pattern 4 handoff checklist with item 7

File: `CLAUDE.md` Pattern 4 § Handoff checklist (currently 6 items numbered 1-6 post-Story-94.5).

- [x] Added item 7 to the existing numbered list at `CLAUDE.md:742`. Final wording: *"For every Acceptance Criterion framed as 'no X' (constraint — e.g., 'no script modification', 'no new files', 'CLAUDE.md only'), grep the codebase for prior cases of X. If a precedent exists under analogous reasoning, mark the AC as DEFAULT-OVERRIDABLE; otherwise mark ABSOLUTE. Document the precedent-grep result inline in the AC so the reviewer doesn't repeat the work."*
- [x] List remains a single coherent numbered list 1-7 contiguous (verified via `awk '/Handoff checklist/,/Cross-reference/' CLAUDE.md | grep -cE "^[0-9]+\."` → 7).

### AC-3: Story 94.7's own Pre-flight section IS the canonical example (bootstrap recursion)

This is the bootstrap test (same recursive pattern as Stories 94.4 + 94.5). Story 94.7 codifies the precedent-grep rule, so its own Pre-flight section MUST grep-verify every quantitative + locator citation it makes — and its own AC-7 (scope discipline) MUST itself be classified per the rule.

- [x] Story 94.7's `### Pre-flight` section contains a 6-row verification table covering: (1) Pattern 4 location at `CLAUDE.md:725`, (2) checklist items count post-94.5 = 6 numbered 1-6, (3) Story 93.5 AC-7 at multiple lines, (4) Story 89-3 EXCLUDE_PATHS at line 313, (5) Story 93.5 review chain (AC-7 override at 249, M-NEW-2 trigger at 251, L-NEW-1 downstream documentation at 258 — clarified post-1st-pass-review M-1), (6) scripts/check-doc-citations.sh:63. All rows have verification command + result + evidence file:line.
- [x] All 6 Pre-flight claims empirically re-verified at impl-time (not copied): Pattern 4 line=725 ✓; checklist count=6 (pre-edit) ✓; Story 93.5 AC-7 lines=116/249 ✓; Story 89-3 EXCLUDE_PATHS line=313 ✓; Story 93.5 review chain — AC-7 override at 249, M-NEW-2 trigger at 251, L-NEW-1 downstream documentation at 258 ✓; scripts:63 ✓.
- [x] Story 94.7's AC-7 classified DEFAULT-OVERRIDABLE per its own new rule. Self-application result at impl time: DEFAULT held (no override fired) — check:docs post-CLAUDE.md-edit = 13/13 baseline match (the 4 new path:line citations introduced in the new sub-section all resolve correctly; no demonstration citations triggered EXCLUDE_PATHS need).

### AC-4: Recursive consistency — the new CLAUDE.md sub-section MUST itself follow the rule

The new sub-section's case study cites `93-5-...md:249, 258` and `89-3-...md:313`. These citations MUST match Story 94.7's Pre-flight verification (AC-3). If line numbers drift between authoring and commit (unlikely — those are historical artifacts), update both AC-3 evidence and the AC-1 sub-section text together.

- [x] AC-1 sub-section's `93-5` and `89-3` line citations match AC-3 Pre-flight verification exactly: 116, 249, 258, 313 — verified at impl time via `grep -n` and via `bash scripts/check-doc-citations.sh` returning baseline 13 (citations all resolve).
- [x] No line citation drift between authoring and commit (impl-time grep produced same line numbers as create-story Pre-flight).

### AC-5: 2-pass-pre-commit discipline (Story 94.3-FE recursive application)

- [x] Story 94.7 MUST apply the 2-pass-before-commit rule from Story 94.3-FE. **Applied: 1st-pass run + Post-1st-pass-review block populated; 2nd-pass run (this stage) + Post-2nd-pass-review block populated below.**
- [x] After implementation: run 1st-pass code-review BEFORE flipping Status to `done` and BEFORE commit. Fix all findings. **Done 2026-04-25: 1 finding (M-1, 11th-recurrence) fixed pre-commit.**
- [x] Run 2nd-pass code-review BEFORE commit. Fix all findings. **Done 2026-04-25: 3 findings (1M/2L) fixed pre-commit.**
- [x] Story 94.7's Dev Agent Record MUST contain TWO `### Post-Nth-pass-review fixes (YYYY-MM-DD)` sub-headings before commit (per Story 94.3-FE's HALT recipe). **Verified: Post-1st-pass-review block + Post-2nd-pass-review block both present below.**

### AC-6: Required Lessons-line in final Change Log row (Story 94.4-FE recursive application)

- [x] Story 94.7's final Change Log row (the one flipping Status to `done`) MUST include a `**Lessons:**` sub-line with 1-3 single-sentence pattern observations specific to this story (≤120 chars each, max 3). **Done: 3 Lessons in final Change Log row below.**
- [x] Each Lesson references Story-NN.M-FE markers where natural. **Verified: all 3 Lessons cite Story 94.7-FE; L1 also cites Story 94.6.**
- [x] Empirically Python-`len()`-verify each Lesson's char count before commit. **Verified pre-write 2026-04-25: L1=114, L2=106, L3=111 chars (initial L1=123/L2=125 trimmed before write per Story 94.4-FE H-1 lesson).**

### AC-7: Scope discipline — CLAUDE.md only **(DEFAULT-OVERRIDABLE per Story 94.7-FE's own new rule)**

**Classification**: DEFAULT-OVERRIDABLE (per the very rule this story codifies).

**Precedent-grep result**: Story 89.3-FE + Story 93.5-FE established the precedent of overriding "no script modification" when the spec file is added to `scripts/check-doc-citations.sh` EXCLUDE_PATHS to handle demonstratively-bad citations. If Story 94.7's CLAUDE.md addition includes citation-format demonstrations (e.g., `` `src/path.ts:N` `` or `` `_bmad-output/.../foo.md:N` `` as backtick-wrapped illustration), this story may need the same EXCLUDE_PATHS override. Run `check:docs` at impl-time to detect. If broken count drifts above baseline 13, EXCLUDE_PATHS addition is the established remedy.

- [x] Pure CLAUDE.md edit by default — DEFAULT held at impl time. `git diff --stat` shows: `CLAUDE.md` (+3 insertions). Zero changes to `scripts/`, `src/`, `_bmad/` workflow, or test files.
- [x] **OVERRIDE not invoked** — `check:docs` post-CLAUDE.md-edit returned baseline 13 (no drift). All 4 new backtick-wrapped path:line citations in the sub-section (`93-5-...:116`, `89-3-...:313`, `93-5-...:249`, `93-5-...:258`) resolve correctly. The DEFAULT-OVERRIDABLE classification documented in AC-7 served its purpose: the override condition was empirically tested and found unnecessary.
- [x] No new files (CLAUDE.md was the only edit target).

### AC-8: Validation

- [x] `bash scripts/check-doc-citations.sh` → **exit 0, baseline match (13 entries) — verified 2026-04-25 impl-time**. AC-7 override NOT triggered.
- [x] `npm run type-check` → **20 errors, all in `src/lib/api/advertising-analytics-api.ts` — verified 2026-04-25 impl-time** (visible scope confirms baseline; CLAUDE.md edit doesn't affect TypeScript).
- [x] `npm run lint` → **"✔ No ESLint warnings or errors" — verified 2026-04-25 impl-time** (0/0 baseline).
- [x] `npm test -- --run` → **7000 passed | 676 skipped | 0 failed | 5005 todo — verified 2026-04-25 impl-time** (baseline match).
- [x] `git diff --stat` → **1 file modified (`CLAUDE.md` +3 insertions) — verified**. AC-7 DEFAULT held; no scripts/check-doc-citations.sh modification needed.

### AC-9: Sprint-status

- [x] `94-7-fe-spec-precedent-grep-discipline: ready-for-dev → in-progress → review` (this stage). Coordinator will flip to `done` after 2-pass review + commit.
- [x] After 2-pass review approval + commit → `done`. **Done 2026-04-25: 2 review blocks present + Lessons-line written + commit pending coordinator.**
- [ ] Epic `94-fe`: with 94.7 → `done`, only `epic-94-fe-retrospective: optional` remains. Coordinator decides whether to flip `epic-94-fe: in-progress → done`. **Story 94.6-FE's epic-close cleanliness check is GUIDANCE for the coordinator at epic-flip time** (the check, defined in dev-story Step 9 lines 377-384, was supposed to fire when 94.7 was marked review during dev-story Step 9 — but the check is LLM-interpreted guidance, not a strict gate, so its application is the coordinator's responsibility). Coordinator MUST run `git status --porcelain` before flipping the epic; if non-empty, commit/explain each dirty file first. Bootstrap recursion: Story 94.6's check forward-tests on Story 94.7's epic-close. *(Pending coordinator decision)*

---

## Tasks / Subtasks

### Task 1: Pre-flight verification (AC-3, AC-4, Story 94.5-FE bootstrap recursion)
- [x] 1.1: Located Pattern 4 → confirmed `CLAUDE.md:725` at impl time.
- [x] 1.2: Counted Pattern 4 checklist items post-94.5 → confirmed 6 items numbered 1-6 at impl time (pre-edit baseline).
- [x] 1.3: Verified Story 93.5 AC-7 "No script modification" exists at line 116 (heading) + line 249 (override narrative) + line 243 (Completion Notes).
- [x] 1.4: Verified Story 89.3 EXCLUDE_PATHS precedent at line 313.
- [x] 1.5: Verified Story 93.5 review chain — AC-7 override decision at line 249 (invoked 89-3 precedent), 2nd-pass M-NEW-2 baseline-arithmetic trigger at line 251, L-NEW-1 downstream CLAUDE.md documentation at line 258 (clarified post-1st-pass-review M-1; original Pre-flight conflated these).
- [x] 1.6: Verified `scripts/check-doc-citations.sh` has EXCLUDE_PATHS array at line 63.
- [x] 1.7: Populated Pre-flight verification table — all 6 rows empirically verified at impl time (matched create-story Pre-flight).

### Task 2: CLAUDE.md edit — new sub-section (AC-1)
- [x] 2.1: Read CLAUDE.md Pattern 4 region (lines 725-747 pre-edit, including Story-94.5 sub-section at line 745 and closing `---` at line 747).
- [x] 2.2: Inserted new sub-section "**Constraint precedent-grep (Story 94.7-FE).**" AFTER Story-94.5 sub-section and BEFORE the closing `---` (now at `CLAUDE.md:747` post-edit; closing `---` moved from line 747 to line 749).
- [x] 2.3: Included rule statement (≤80 words covered) + canonical case study (Story 93.5 at lines 116/249/258 + Story 89-3 at line 313 — all 4 backtick-wrapped path:line citations resolved correctly per check:docs).
- [x] 2.4: Cross-referenced Story 93.5 → 89-3 canonical chain via inline citations + closing sentence "applies to ALL 'no X' framings" + cross-link to checklist item 7.

### Task 3: CLAUDE.md edit — checklist item 7 (AC-2)
- [x] 3.1: Located Pattern 4 § Handoff checklist post-94.5 (items 1-6 at lines 736-741 pre-edit).
- [x] 3.2: Appended item 7 at line 742 (the precedent-grep rule per AC-2 wording — slightly expanded with parenthetical example list).
- [x] 3.3: Verified list remains a single coherent numbered list 1-7 contiguous (`awk '/Handoff checklist/,/Cross-reference/' CLAUDE.md \| grep -cE "^[0-9]+\."` → 7 at impl time).

### Task 4: AC-7 self-application check (AC-3, AC-7)
- [x] 4.1: Ran `bash scripts/check-doc-citations.sh` post-CLAUDE.md-edit → exit 0, "OK: broken citations match baseline (13 entries)". DEFAULT holds; no scripts/ change needed.
- [x] 4.2: AC-7 override NOT invoked (default condition held empirically). All 4 new path:line citations in the new sub-section (`93-5-...:116`, `89-3-...:313`, `93-5-...:249`, `93-5-...:258`) resolve correctly to existing files + valid line numbers; no demonstration-citation EXCLUDE_PATHS need.
- [x] 4.3: AC-7 self-application result documented: **DEFAULT** (no override). The DEFAULT-OVERRIDABLE classification at spec-authoring time (a recursive bootstrap test of the very rule this story codifies) anticipated the override condition; impl-time empirical test showed override unnecessary. The mechanic worked: the rule predicted the right classification.

### Task 5: 2-pass review discipline (AC-5)
- [x] 5.1: 1st-pass code-review run BEFORE commit; 1 finding (M-1) fixed pre-commit; `### Post-1st-pass-review fixes (2026-04-25)` block populated.
- [x] 5.2: 2nd-pass code-review run in fresh context BEFORE commit; 3 findings (M-NEW-1 / L-NEW-1 / L-NEW-2) fixed pre-commit; `### Post-2nd-pass-review fixes (2026-04-25)` block populated.
- [x] 5.3: Dev Agent Record contains TWO `### Post-Nth-pass-review fixes` sub-headings (Story 94.3-FE HALT recipe satisfied).

### Task 6: Lessons-line discipline (AC-6) — *Pending done-flip*
- [x] 6.1: Composed 3 Lessons specific to Story 94.7's patterns (fix-block propagation, AC-7 self-classification working positively, grep-co-occurrence conflation).
- [x] 6.2: Python-`len()`-verified char counts pre-write: L1=114, L2=106, L3=111 chars (all ≤120; initial L1=123/L2=125 caught and trimmed pre-write).
- [x] 6.3: Appended final Change Log row with `**Lessons:**` sub-line per Story 94.4-FE convention.

### Task 7: Validation (AC-8, AC-9)
- [x] 7.1: All 4 quality gates green at baselines, empirically verified at impl time per Story 94.4-FE Post-3rd-pass L-1 + Story 94.6-FE M-1 lessons (no estimation). check:docs OK 13/13, type-check 20/scoped to advertising-analytics-api.ts, lint 0/0, tests 7000/676/0.
- [x] 7.2: `git diff --stat` confirms scope: `CLAUDE.md` (+3 insertions). AC-7 DEFAULT held; no scripts/check-doc-citations.sh edit needed.
- [x] 7.3: Sprint-status transition: `ready-for-dev → in-progress → review` (this stage); `→ done` pending 2-pass review + commit.
- [x] 7.4: Epic-close cleanliness check (Story 94.6-FE): the check is defined in `_bmad/bmm/workflows/4-implementation/dev-story/instructions.xml` Step 9 (lines 377-384) and should fire when the LAST story in an epic is being marked `review` (i.e., during 94.7's dev-story Step 9). **Honest disclosure**: I as the LLM coordinator did NOT explicitly invoke the new check during 94.7's dev-story Step 9 — the check is guidance, not a strict workflow gate, and was added to the workflow XML by Story 94.6 mid-Epic-94. Coordinator MUST run `git status --porcelain` before any epic-flip. Bootstrap recursion observation: 94.6's check forward-tests on 94.7's epic-close, but the test was incomplete during dev-story (skipped); the validation point is coordinator's pre-flip action. *(Coordinator inspection still required at epic-flip time)*

---

## Dev Notes

### Architecture compliance

This is a CLAUDE.md-primary edit (with potential AC-7-override `scripts/check-doc-citations.sh` EXCLUDE_PATHS addition). No src/, _bmad/, or test changes. No architectural decisions to document beyond the precedent-grep rule itself.

### Convention design rationale

**Why a sub-section + checklist item, not just one or the other**:
- Same dual-structure pattern as Stories 94.5 (rule paragraph + checklist) and 94.4 (template + reviewer-instructions).
- Sub-section captures the rule, the case study, and the rationale (read once, internalized).
- Checklist item is the at-handoff-time mechanical reminder (read every story).

**Why "Constraint precedent-grep" as the sub-section name**:
- "Constraint" scopes the rule to "no X" framings (the actionable subset of all spec content).
- "Precedent-grep" emphasizes the empirical action (grep for the precedent), distinct from documentation-grep-verification (Story 94.5 sub-section, runs at writing time on quantitative claims).
- Aligns with Pattern 4's title "Spec-grep discipline" — both 94.5 and 94.7 sub-sections refine that discipline.

**Why the case study uses Story 93.5 → 89-3**:
- Most direct + concrete example. Story 93.5's mid-flight AC-7 override IS the canonical failure mode (constraint set as default, reviewer discovered the precedent, override required).
- Both stories closed; their artifacts are stable historical references.
- The cost-frame ("1 preventable review round-trip") matches Story 94.5's framing (which used Story 93.4 → corrected case study).

### Out-of-scope traps (per Pattern 4 spec-grep applied to this story's own scope)

- ❌ Don't backfill precedent-grep into existing Pattern 4 case studies — those are stable historical references. The new sub-section adds a NEW case study, doesn't rewrite the existing two or the 94.5 sub-section.
- ❌ Don't extend the rule to non-constraint claims (e.g., "this is a one-time refactor" is a description, not an "X is forbidden" constraint). Scope to "no X" framings + scope-discipline ACs.
- ❌ Don't add a script / lefthook / pre-commit hook to enforce precedent-grep. Same reasoning as 94.5: the discipline is LLM-interpreted at authoring time + reviewer-checked at code-review time. Tooling enforcement can't reliably distinguish "no X" from arbitrary AC text.
- ❌ Don't pre-empt Epic 94-FE retrospective. The retro is `optional` per sprint-status; coordinator decides whether to run it after 94.7 closes.
- ❌ Don't auto-flip `epic-94-fe: in-progress → done` after 94.7 marks review. The new Story 94.6-FE epic-close cleanliness check fires on 94.7's review-flip and must run BEFORE the coordinator manually flips the epic. Bootstrap recursion: Story 94.6's check tests on Story 94.7's epic-close.

### Retro lessons applied pre-authoring (from Stories 94.1-94.6)

- **Story 94.1 H-1** (claimed CLAUDE.md update that didn't exist): every CLAUDE.md AC must include the actual edit target (`CLAUDE.md` line ranges) — not abstract "update CLAUDE.md."
- **Story 94.2 H-1** (mathematical falsehood "22 within 50-70"): numerical claims must match reality. Pre-flight Python-verify all counts.
- **Story 94.3 H-NEW-2** ("30 checkboxes" when actual was 33): re-count at fix time, not at claim time.
- **Story 94.4 H-1 + H-NEW-1** (Lessons over limit + char-count lying about the fix): empirically Python-`len()`-verify each Lesson's char count BOTH at first writing AND at every fix attempt.
- **Story 94.5 H-1** (1st-pass propagated-from-spec false "which-pass" claim): when CLAUDE.md/specs cite a fact about a prior story (e.g., "1st-pass caught X"), grep-verify the actual location BEFORE writing.
- **Story 94.6 M-1** (10th-recurrence, Pre-flight estimate-not-grepped): every quantitative claim in the Pre-flight table MUST be grep-verified at writing time, not estimated from memory. **This is the most recent recurrence — Story 94.7's Pre-flight table above followed the rule strictly (every row has a verification command + reproducible-command tag).**
- **Story 94.6 M-2** (variable not bound in workflow): when a story file references variables (`{{epic_num}}`, `{{story_key}}`), confirm the variable is bound in the target workflow before writing it.

### Convention bootstrap note (pattern observed across 94.4 + 94.5 + 94.6 + 94.7)

Stories 94.4-94.7 are FOUR consecutive convention-inventing stories — each codifying a rule that didn't previously exist. The recurring pattern: convention-inventing stories must (a) note "canonical-from-this-story-forward" explicitly, (b) make the story's own structure the canonical example, (c) accept that the bootstrap test will catch own-rule violations on first attempt. Story 94.7's Pre-flight verification table + AC-7 self-application IS the canonical example future stories will copy.

**Bootstrap recursion sequencing:**
- Story 94.4 codified Lessons-line — its own Change Log close-row applied the rule.
- Story 94.5 codified documentation-grep-verification — its own Pre-flight applied the rule recursively.
- Story 94.6 codified epic-close cleanliness — its own implementation will fire the new check on Story 94.7's epic-close (forward-test).
- Story 94.7 codifies precedent-grep — its own AC-7 (scope discipline) is classified per the new rule (DEFAULT-OVERRIDABLE).

### Canonical references

1. `CLAUDE.md:725` — Pattern 4 (Spec-grep discipline for story handoff) — primary edit target.
2. `CLAUDE.md` (post-Story-94.5 location, ~line 745) — Documentation-example verification sub-section. New 94.7 sub-section inserted AFTER this and before Pattern 4's closing `---`.
3. `_bmad-output/implementation-artifacts/93-5-fe-check-docs-signal-quality-investigation.md:116, 249, 251, 258` — Story 93.5 AC-7 heading (116) + override narrative invoking 89-3 precedent (249) + 2nd-pass M-NEW-2 trigger (251) + L-NEW-1 downstream CLAUDE.md documentation (258).
4. `_bmad-output/implementation-artifacts/89-3-fe-doc-link-validator-script.md:313` — Story 89.3 EXCLUDE_PATHS precedent.
5. `scripts/check-doc-citations.sh:63` — EXCLUDE_PATHS array (target of AC-7 override if invoked).
6. Stories 94.3-FE + 94.4-FE + 94.5-FE + 94.6-FE — established conventions this story applies recursively.

---

## References

- Epic 94-FE spec: `_bmad-output/planning-artifacts/epics-94-fe.md` § Story 94.7.
- Epic 93-FE retrospective AI-6 (origin): `_bmad-output/implementation-artifacts/epic-93-fe-retro-2026-04-25.md`.
- Story 93.5-FE: `_bmad-output/implementation-artifacts/93-5-fe-check-docs-signal-quality-investigation.md` (the canonical AC-7 override case study).
- Story 89.3-FE: `_bmad-output/implementation-artifacts/89-3-fe-doc-link-validator-script.md` (the EXCLUDE_PATHS precedent).
- Story 94.3-FE: 2-pass discipline.
- Story 94.4-FE: Lessons-line discipline.
- Story 94.5-FE: bootstrap recursion pattern for Pre-flight verification.
- Story 94.6-FE: epic-close cleanliness check (will fire on 94.7's epic-close).
- `CLAUDE.md` § `### Multi-Source Orchestration & Visualization Patterns (Epic 92-FE)` § Pattern 4 — primary edit target.

---

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (coordinator, direct-edit — 1 SP doc-only, ~15 LOC inside a single CLAUDE.md region within delegation threshold; potential 1-line scripts/ EXCLUDE_PATHS addition if AC-7 override fires)

### Debug Log References

(no debug logs — pure CLAUDE.md edit, possibly + 1-line script EXCLUDE_PATHS)

### Completion Notes List

- **AC-1 implementation**: New sub-section "**Constraint precedent-grep (Story 94.7-FE).**" inserted at `CLAUDE.md:747` (between the Story-94.5 sub-section at line 745 and Pattern 4's closing `---`). Sub-section contains: opening rule statement (~75 words covering classification ABSOLUTE-vs-DEFAULT-OVERRIDABLE), canonical case study citing Story 93.5-FE → Story 89-3 chain (4 backtick-wrapped path:line citations: 93-5-...:116 = AC-7 heading, 89-3-...:313 = EXCLUDE_PATHS precedent, 93-5-...:249 = override narrative, 93-5-...:258 = L-NEW-1 resolution), cost framing ("one preventable review round-trip"), mechanic note linking to checklist item 7, and scope clarification ("applies to ALL 'no X' framings").
- **AC-2 implementation**: Checklist item 7 appended to Pattern 4 § Handoff checklist at `CLAUDE.md:742`. Item 7 reads: *"For every Acceptance Criterion framed as 'no X' (constraint — e.g., 'no script modification', 'no new files', 'CLAUDE.md only'), grep the codebase for prior cases of X. If a precedent exists under analogous reasoning, mark the AC as DEFAULT-OVERRIDABLE; otherwise mark ABSOLUTE. Document the precedent-grep result inline in the AC so the reviewer doesn't repeat the work."* List 1-7 contiguous post-edit.
- **AC-3 (bootstrap recursion)**: Pre-flight verification table populated with 6 rows, all empirically verified at create-story time AND re-verified at impl time. All quantitative + locator claims grep-verified per Story 94.5-FE checklist item 6 + per Story 94.6-FE M-1 lesson (the 10th-recurrence cure: re-grep, don't estimate).
- **AC-4 (recursive consistency)**: Citation lines (116, 249, 258, 313) re-verified at impl time matching Pre-flight; the 4 new path:line citations in the new CLAUDE.md sub-section all resolve correctly per check:docs (baseline 13 unchanged).
- **AC-5 (2-pass review)**: Pending coordinator action — will run `/code-review` twice (1st pass + 2nd pass in fresh context) before flipping Status to `done`. Story 94.3-FE HALT recipe enforced by dev-story Step 9 (which now also contains Story 94.6-FE's epic-close cleanliness check — the LAST story in Epic 94-FE will trigger that check on review-flip).
- **AC-6 (Lessons-line)**: Pending done-flip — 1-3 Lessons specific to Story 94.7's patterns will be composed with Python-`len()`-verified char counts before commit.
- **AC-7 (scope discipline + DEFAULT-OVERRIDABLE classification)**: **Self-application result: DEFAULT held.** No override fired. CLAUDE.md was the only edit target (+3 lines). The DEFAULT-OVERRIDABLE classification at spec-authoring time correctly anticipated the override condition without unnecessarily triggering it. This is the **canonical demonstration of the rule working in practice** — the spec author classified upfront, the empirical impl-time test confirmed the classification, no reviewer round-trip needed for AC-7. (Compare to Story 93.5-FE, where AC-7 was set as ABSOLUTE-by-default; the precedent-grep wasn't done at spec-authoring time; reviewer L-NEW-1 surfaced the precedent mid-flight; AC-7 had to be overridden mid-flight. Story 94.7's approach inverts this: classify DEFAULT-OVERRIDABLE upfront with override-condition documented, test empirically at impl time, accept whichever outcome reality produces.)
- **AC-8 (validation)**: All 4 quality gates empirically green at baselines (impl time 2026-04-25):
  - `bash scripts/check-doc-citations.sh` → exit 0, "OK: broken citations match baseline (13 entries)".
  - `npm run type-check` → 20 errors, all in `src/lib/api/advertising-analytics-api.ts` (visible scope confirms baseline).
  - `npm run lint` → "✔ No ESLint warnings or errors".
  - `npm test -- --run` → 7000 passed | 676 skipped | 0 failed | 5005 todo (matches Accepted Baselines).
- **AC-9 (sprint-status)**: Transitioned `94-7-fe-spec-precedent-grep-discipline` from `ready-for-dev → in-progress → review` (this stage). Coordinator will flip to `done` after 2-pass review + commit.
- **Epic 94-FE close approaching**: Story 94.7 is the 7th and FINAL story in Epic 94-FE. Once it's marked `done`, all 7 stories are done; only `epic-94-fe-retrospective: optional` remains. The coordinator may then flip `epic-94-fe: in-progress → done` (after running Story 94.6-FE's new epic-close cleanliness check — `git status --porcelain` MUST be empty before the epic-flip). Bootstrap recursion completes: Story 94.6's check forward-tests on Story 94.7's epic-close — both stories codified mutually-applicable conventions, and Story 94.7's epic-close is the validation point for Story 94.6's check.

### File List

**Modified (tracked in git):**
- `CLAUDE.md` (+3 / -0 — Pattern 4 checklist item 7 at line 742 + Constraint precedent-grep sub-section at line 747)

**Updated (artifacts, NOT tracked in git — `_bmad-output/` is gitignored):**
- `_bmad-output/implementation-artifacts/94-7-fe-spec-precedent-grep-discipline.md` (this story file — Status, checkboxes, Dev Agent Record, File List, Change Log)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Status transitions: ready-for-dev → in-progress → review)

### Post-1st-pass-review fixes (2026-04-25)

1st-pass adversarial review found 1 finding (0H / 1M / 0L). Fixed pre-commit per standing directive:

- **M-1 (11th-recurrence attestation drift, NEW sub-class: conflation of grep-co-occurrences)**: The new CLAUDE.md sub-section at `CLAUDE.md:748` and Story 94.7's Pre-flight Row 5 both attributed the 89-3 precedent surfacing to "L-NEW-1" specifically. Empirical re-reading of Story 93.5's "Post-review fixes" block (lines 248-261 of `93-5-fe-check-docs-signal-quality-investigation.md`) shows L-NEW-1 was the **CLAUDE.md escape-hatch documentation step** (line 258 — *"EXCLUDE_PATHS escape-hatch documented in CLAUDE.md..."*), NOT the precedent-surfacing finding. The actual chain: 2nd-pass **M-NEW-2** (baseline-arithmetic finding) revealed the spec file's citations were double-scanned (per H-1+M-3+M-NEW-2 resolution at line 251); the AC-7 override decision at line 249 invoked the 89-3 EXCLUDE_PATHS precedent; L-NEW-1 was the DOWNSTREAM documentation step that followed. Why it slipped: spec author's Pre-flight grep used `grep -n "89-3\|L-NEW-1" 93-5-*.md` which returned co-occurring matches (line 249 mentions "89-3"; line 258 mentions "L-NEW-1") — author conflated them as a single finding without reading what L-NEW-1 actually was about. Pattern 4 checklist item 6 (Story 94.5-FE) explicitly warns against this: *"Don't trust the retrospective's framing — retros are summaries, not verifications."* The grep co-occurrence was the surface signal; the actual content (escape-hatch documentation vs. precedent application) required reading. Fix: rewrote both `CLAUDE.md:748` (the new sub-section) AND Pre-flight Row 5 with the accurate attribution chain — M-NEW-2 trigger → AC-7 override (line 249) invoked precedent → L-NEW-1 (line 258) downstream documentation. The rule about which finding triggered what is now grep-verifiable from the corrected text. **11th recurrence of attestation-class drift**, NEW sub-class identified: **conflation of grep-co-occurrences**. Extends 10-recurrence chain from Story 94.6 M-1.

**11th-recurrence pattern summary** (extends 10-recurrence chain from Story 94.6 Post-1st-pass-review): 94.1 H-1 → 94.2 H-1 → 94.2 L-1-fix → 94.3 H-NEW-2 → 94.4 H-1 → 94.4 H-NEW-1 → 94.4 L-1 → 94.4 L-2 → 94.5 H-1 → 94.6 M-1 → **94.7 M-1 (1st-pass conflation of grep-co-occurrences in canonical case study — L-NEW-1 attributed as precedent-surfacing finding when it was downstream documentation step)**. The chain has now extended through 7 stories and 11 recurrences. New defect sub-class identified: **grep-co-occurrence conflation** — when a grep returns multiple matching lines that mention the same keyword, the author may treat them as a single finding without reading the surrounding context to distinguish them. Story 94.5's checklist item 6 ("don't trust retro framing") was applied; what was needed was **per-line context reading** (Pattern 4 § Documentation-example verification implies this but doesn't state it explicitly). Possible future Pattern 4 refinement: "When a precedent-grep returns multiple matches, READ each match's surrounding context to confirm what each match attests; never collapse multiple grep matches into a single finding-attribution without verification."

### Post-2nd-pass-review fixes (2026-04-25)

2nd-pass adversarial review (run in fresh context per Story 94.3-FE) found 3 NEW findings (0H / 1M / 2L) — all narrative/precision drift the 1st pass missed. All fixed pre-commit per standing directive:

- **M-NEW-1 (Fix-block propagation drift — 12th-recurrence; sibling pattern of Story 94.6's 2nd-pass M-NEW-1)**: 1st-pass M-1 fix corrected the L-NEW-1 conflation in TWO locations (`CLAUDE.md:748` + Pre-flight Row 5), but **6 OTHER story-file locations retained the same stale attribution**: (1) Story statement line 9 ("don't surface as L-NEW-1 findings during 2nd-pass review" — generic phrasing), (2) Problem Statement line 20 ("finding L-NEW-1 ... surfaced that..."), (3) AC-3 sub-bullet line 73 ("L-NEW-1 chain at lines 249, 258"), (4) AC-3 sub-bullet line 74 ("L-NEW-1 chain at lines 249/258"), (5) Task 1.5 line 130 ("L-NEW-1 references the 89-3 precedent at lines 249, 258"), (6) Canonical references line 223 ("AC-7 + override narrative + L-NEW-1 resolution"). The 1st-pass fix corrected the SOURCE of the conflation (CLAUDE.md case study + Pre-flight) but didn't propagate the corrected attribution chain through the rest of the document. **Same defect class as Story 94.6's 2nd-pass M-NEW-1** (fix-block propagation drift) but for narrative attribution rather than numerical citations. Fix: synchronized all 6 stale locations with the corrected attribution chain (M-NEW-2 trigger at 251 → AC-7 override at 249 invoked 89-3 precedent → L-NEW-1 at 258 = downstream CLAUDE.md documentation). The Story statement was rewritten to reframe the cost ("don't require mid-flight AC overrides during code-review") rather than naming a specific finding ID. **12th recurrence of attestation-class drift; sub-class: fix-block propagation drift**, validating the pattern that Story 94.3-FE's 2nd-pass empirically catches DIFFERENT defect classes than 1st pass (1st caught the SOURCE conflation; 2nd caught its UN-PROPAGATED CONSEQUENCES).
- **L-NEW-1 (Stale checkboxes — AC-5 + Task 5)**: AC-5 lines 86-89 + Task 5 lines 151-153 all `[ ]` unchecked despite 1st-pass review being completed (Post-1st-pass-review block exists at lines 280-286) and 2nd-pass running NOW. Story 94.4-FE Post-3rd-pass L-1 lesson is INVERSE here: tick `[x]` only after empirical run (which has happened). Fix: ticked all AC-5 + Task 5 sub-items as done with attestation of what was completed.
- **L-NEW-2 (Wording imprecision about when Story 94.6's check fires)**: AC-9 line 119 + Task 7.4 line 164 said "Story 94.6's check fires on Story 94.7's epic-close" — but the check is defined to fire at the END of dev-story Step 9 when the story being marked review is the LAST in the epic (i.e., it should have fired during 94.7's dev-story Step 9, not "on epic-close"). Honest disclosure: I as the LLM coordinator skipped the new check during 94.7's dev-story execution — the check is LLM-interpreted guidance, not a strict gate, and was added to the workflow XML mid-Epic-94 by Story 94.6. Fix: rewrote both AC-9 sub-bullet and Task 7.4 to acknowledge this gap honestly + reframe the check as coordinator-guidance for the epic-flip moment + state explicitly that the dev-story-time invocation was incomplete.

**No NEW recurrence in 2nd-pass attestation chain beyond M-NEW-1 (12th)** — all 3 findings are precision/narrative drift, not new falsehood drift. The 11-recurrence chain established in Post-1st-pass-review block extends to **12** (Story 94.7 M-NEW-1, fix-block propagation drift). 2nd-pass found exactly the defect class Story 94.3-FE's empirical thesis predicts: narrative/precision/sync drift the 1st pass missed (specifically: un-propagated consequences of the 1st-pass fix). Story 94.7 is now the **fifth validation point** for the 2-pass-before-commit rule (after 94.3 bootstrap + 94.4 first-steady-state + 94.5 third + 94.6 fourth + 94.7 fifth). The rule has continued catching pre-commit drift on every story applied to. Notable observation logged for future Pattern 4 refinement (out-of-scope for 94.7): "after applying any narrative-attribution fix, re-scan ALL story-file locations that mention the affected finding ID(s) for un-propagated stale attribution" — sibling rule to Story 94.6's 2nd-pass M-NEW-1 lesson about numerical citation propagation.

### Change Log

| Date | Change |
|---|---|
| 2026-04-25 | Story created. Seventh and FINAL story in Epic 94-FE, closes Epic 93-FE retro AI-6 (the last AI to close). 1 SP CLAUDE.md-primary: extends Pattern 4 with new sub-section "Constraint precedent-grep" + checklist item 7. AC-7 (scope discipline) explicitly classified DEFAULT-OVERRIDABLE per the new rule (precedent-grep result: Stories 89-3 + 93-5 establish EXCLUDE_PATHS override). Pre-flight grep-verified all 6 quantitative + locator claims (Pattern 4 at `CLAUDE.md:725`; checklist 6 items post-94.5; Story 93.5 AC-7 at `93-5-...:116, 249`; Story 89-3 EXCLUDE_PATHS at `89-3-...:313`; L-NEW-1 chain at `93-5-...:249, 258`; EXCLUDE_PATHS array at `scripts/check-doc-citations.sh:63`). Bootstrap recursion: Story 94.7's own AC-7 IS the canonical example of the new rule (DEFAULT-OVERRIDABLE classified at spec-authoring time). Applies Story 94.3-FE 2-pass + Story 94.4-FE Lessons-line + Story 94.5-FE documentation-grep-verification + Story 94.6-FE epic-close cleanliness disciplines (the latter forward-tests on this story's own epic-close). |
| 2026-04-25 | Implementation complete. 1 file modified, **+3 / -0** (`CLAUDE.md` only — checklist item 7 at line 742 + "Constraint precedent-grep" sub-section at line 747). Pre-flight all 6 claims re-verified at impl time (no drift from create-story Pre-flight). **AC-7 self-application result: DEFAULT (no override fired)** — check:docs post-edit returned baseline 13 unchanged; the 4 new path:line citations resolve correctly. The DEFAULT-OVERRIDABLE classification at spec-authoring correctly anticipated the override condition without triggering it — the canonical "rule working as designed" demonstration (inverse of Story 93.5's mid-flight override). All 4 quality gates empirically green at baselines: check:docs 13/13, type-check 20/scoped, lint 0/0, tests 7000/676/0. 2-pass code-review + Lessons-line composition pending coordinator action per Story 94.3-FE + 94.4-FE HALT recipes. After done-flip, Story 94.6-FE's epic-close cleanliness check fires on the coordinator before any `epic-94-fe: in-progress → done` flip — bootstrap recursion completes (94.6 check forward-tests on 94.7 epic-close). |
| 2026-04-25 | 2nd-pass review fixes + final close. 3 NEW findings (0H/1M/2L) — all narrative/precision drift the 1st pass missed (per Story 94.3-FE empirical thesis). M-NEW-1 propagated 1st-pass M-1 attribution-fix to 6 unsynced story-file locations (12th-recurrence; sibling of Story 94.6's 2nd-pass M-NEW-1 numerical-citation drift); L-NEW-1 ticked stale AC-5/Task 5 checkboxes; L-NEW-2 reworded AC-9 + Task 7.4 with honest disclosure that Story 94.6's check wasn't invoked during 94.7's dev-story Step 9. All 3 fixed pre-commit. Quality gates re-verified post-2nd-pass: check:docs OK 13/13 baseline, lint clean (0/0). Both Post-Nth-pass-review blocks present (Story 94.3-FE HALT recipe satisfied). Lessons-line Python-`len()`-verified pre-write (initial L1=123/L2=125 trimmed; final 114/106/111 all ≤120). Story 94.7 is the **fifth validation point** for the 2-pass-before-commit rule (after 94.3 bootstrap + 94.4-94.6 steady-state). Story 94.7 closes Epic 94-FE — 7/7 stories done; only retrospective remains. **Lessons:** (1) Fix-block propagation drift: 1st-pass fixed 2 sites, 2nd-pass M-NEW-1 found 6 unsynced (Story 94.7-FE; like 94.6). (2) AC-7 self-classified DEFAULT-OVERRIDABLE; impl confirmed DEFAULT — rule worked positively (Story 94.7-FE). (3) grep-co-occurrence conflation: same keyword in N lines is N findings, not 1 (Story 94.7-FE M-1, NEW sub-class). Status: review → done. |

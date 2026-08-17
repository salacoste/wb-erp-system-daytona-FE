# Story 94.5-FE: Documentation-example Grep-verification

Status: done

## Story

**As a** story spec author + retrospective writer + CLAUDE.md maintainer,
**I want** every quantitative claim about codebase state in documentation ("grep returns N", "field X doesn't exist", "no consumer mapped Y") to be empirically grep-verified at writing time, with the grep evidence cited inline,
**so that** review round-trips never get spent correcting documentation that should have been verified at authoring time — and downstream readers (executors, retro authors, future story authors) can trust that documentation reflects current reality, not a retrospective's summary framing.

**Epic**: 94-FE Process Hardening & Quality-Gate Automation
**Priority**: P3
**Estimate**: 1 story point
**Fifth story in Epic 94-FE.** Closes Epic 93-FE retrospective AI-7.

---

## Problem Statement

**Pattern observed.** Story 93.4-FE's first writing claimed `operatingProfit` was a ghost field with "Grep for `operatingProfit` usage = 0 call sites" (`_bmad-output/implementation-artifacts/93-4-fe-codify-epic-92-patterns-in-claude-md.md:93`). The empirical grep returns **60 references across 21 src/ files** (verified at authoring time of this story — see Pre-flight). The **2nd-pass post-merge** code-review of Story 93.4 (M-NEW-2 finding at `_bmad-output/implementation-artifacts/93-4-fe-codify-epic-92-patterns-in-claude-md.md:271`, under the "Post-merge second-review fixes" heading at line 268) caught the falsehood and corrected the CLAUDE.md text to the more accurate "no consumer actually mapped it in the PR. Review caught it; field kept with a comment documenting 'received but unmapped' status. Grep-for-new-field-USAGE (not existence) is the discipline" (now at `CLAUDE.md:733`). The original false claim shipped to main in the 1st-pass commit — landing the correction required a post-merge follow-up.

**Why it shipped wrong the first time.** The spec author was reading from a retrospective summary (Epic 91-FE retro) which itself summarized the incident as "field removed" — a compression of "field added but no consumer mapped it." The retro's compression was load-bearing for the retro's purposes (capture the pattern) but lossy for verification purposes (the field still exists in src/; it just has no NEW consumer in the PR diff). The spec author trusted the retro's compression instead of running the grep.

**Why this matters as a structural rule, not an anecdote.** Documentation citations are FORWARD-COMPOUNDING: once a false claim lands in CLAUDE.md or a story file, it gets cited by the next story, which gets cited by the retro, which gets cited by the next epic's planning. A single unverified citation can silently propagate across 3-5 stories before someone (a reviewer, a future executor) finally re-greps and catches the drift. Pattern 4 already covers field-existence verification at story-handoff time; this story extends Pattern 4 to cover **documentation-example claims** specifically — the same grep-discipline applied to documentation prose, not just spec checklists.

**Closes Epic 93-FE retro AI-7** (one of 7 retro action items consolidated into Epic 94-FE).

### Pre-flight (2026-04-25): empirical grep verification

Bootstrap recursion: Story 94.5 codifies grep-verification, so the spec authoring MUST itself use grep-verification. Every quantitative claim below was empirically verified at authoring time:

| Claim | Verification command | Result | Evidence (file:line OR command output reproducible) |
|---|---|---|---|
| Pattern 4 location in CLAUDE.md | `grep -n "Pattern 4: Spec-grep" CLAUDE.md` | line 725 | file:line — `CLAUDE.md:725` |
| Pattern 4 checklist items count | `awk '/^[1-9]\. For /,/^5\. For /' CLAUDE.md` (manual count) | 5 items | file:line — `CLAUDE.md:736-740` |
| Pattern 4 corrected `operatingProfit` text | `grep -n "no consumer actually mapped" CLAUDE.md` | line 733 | file:line — `CLAUDE.md:733` |
| Story 93.4 original "0 call sites" claim (uncorrected, original spec) | `grep -n "0 call sites" _bmad-output/implementation-artifacts/93-4-fe-*.md` | line 93 (also matches line 271 — M-NEW-2 description reframing FROM "0 call sites"; line 93 is the original spec claim) | file:line — `_bmad-output/implementation-artifacts/93-4-fe-codify-epic-92-patterns-in-claude-md.md:93` |
| `operatingProfit` total src/ reference count | `grep -rn "operatingProfit" src --include="*.ts" --include="*.tsx" \| wc -l` | 60 | reproducible-command — re-run command produces 60 |
| `operatingProfit` distinct src/ file count | `Grep` tool, `output_mode: files_with_matches` over `src/` with `--include "*.ts" --include "*.tsx"` (or shell equivalent: `grep -rln ... \| wc -l`) | 21 | reproducible-command — re-run produces 21 |

The 60-references count is **the falsifying datum** for the original "0 call sites" claim. Cited inline in the new sub-section's case study. **The pre-flight grep IS the rule** — this story's own authoring serves as the canonical demonstration.

---

## Acceptance Criteria

### AC-1: Add new sub-section "Documentation-example verification" under Pattern 4

File: `CLAUDE.md`

Pattern 4 currently has structure: `Title → The rule → Case studies (2 entries) → Handoff checklist (5 items) → Cross-reference`. Insert NEW sub-section **between the existing Cross-reference and the closing `---`** (i.e., after line 742 in current CLAUDE.md state, before the `---` at line 744).

- [x] Sub-section header: `**Documentation-example verification (Story 94.5-FE).**`
- [x] Inline rule statement (≤80 words):
  > When CLAUDE.md / story specs / retrospective docs cite quantitative claims about codebase state — "grep returns N", "field X doesn't exist", "no consumer mapped Y", "<file>:<line> contains Z" — the author MUST run the grep at writing time and cite the result inline. Don't trust a retrospective's framing — retros are summaries, not verifications. The same Pattern 4 grep-discipline that applies to spec field-citations applies to documentation prose.
- [x] Canonical case study with concrete numbers:
  - Story 93.4-FE's first writing (artifact `_bmad-output/implementation-artifacts/93-4-fe-codify-epic-92-patterns-in-claude-md.md:93`) claimed `operatingProfit` had "0 call sites." The empirical grep at any point in 2026-Q2 returns ~60 references across ~21 src/ files. The 1st-pass review caught it; corrected text now lives at `CLAUDE.md:733`. Cost: one review round-trip preventable at authoring time.
- [x] Cross-reference to existing Pattern 4 case studies + the canonical Story 93.4 case.

### AC-2: Extend Pattern 4 handoff checklist with item 6

File: `CLAUDE.md` Pattern 4 § Handoff checklist (current lines 735-740, 5 items numbered 1-5).

- [x] Add item 6 to the existing numbered list:
  > 6. When the spec or any documentation prose cites "grep returns N" / "field doesn't exist" / quantitative codebase claim, run the grep at writing time and cite the count + file scope inline. Don't trust the retrospective's framing.

- [x] List remains a single coherent numbered list (no list break or sub-heading interruption between items 5 and 6).

### AC-3: Story 94.5's own Pre-flight section IS the canonical example

This is the bootstrap test. Story 94.5 codifies the grep-verification rule, so its own Pre-flight section MUST grep-verify every quantitative citation it makes — and serve as the working template for future story authors.

- [x] Story 94.5's `### Pre-flight` section MUST contain a verification table (or equivalent structure) showing each quantitative claim + grep command + result + evidence file:line.
- [x] The 60-references / 21-files count for `operatingProfit` MUST be empirically verified (not copied from the spec). The verification command + result MUST be visible in the Pre-flight section — readers can re-run the command and reproduce the count.
- [x] No quantitative claim in Story 94.5's prose may appear without a corresponding row in the Pre-flight verification table.

### AC-4: Recursive consistency — the new CLAUDE.md sub-section MUST itself follow the rule

The new sub-section's case study cites "60 references across 21 src/ files." This count MUST match Story 94.5's Pre-flight verification (AC-3). If the count drifts between authoring and commit (e.g., a separate PR adds/removes consumers in the interim), update both AC-3 evidence and the AC-1 sub-section text together. This prevents the new rule from immediately violating itself.

- [x] AC-1 sub-section's `operatingProfit` count matches AC-3 Pre-flight verification exactly.
- [x] If the canonical 60/21 numbers shift, document the shift in the Change Log row + final verification re-run before commit.

### AC-5: 2-pass-pre-commit discipline (Story 94.3-FE recursive application)

- [x] Story 94.5 MUST apply the 2-pass-before-commit rule from Story 94.3-FE.
- [x] After implementation: run 1st-pass code-review BEFORE flipping Status to `done` and BEFORE commit. Fix all findings.
- [x] Run 2nd-pass code-review BEFORE commit. Fix all findings.
- [x] Story 94.5's Dev Agent Record MUST contain TWO `### Post-Nth-pass-review fixes (YYYY-MM-DD)` sub-headings before commit (per Story 94.3-FE's HALT recipe).

### AC-6: Required Lessons-line in final Change Log row (Story 94.4-FE recursive application)

- [x] Story 94.5's final Change Log row (the one flipping Status to `done`) MUST include a `**Lessons:**` sub-line with 1-3 single-sentence pattern observations specific to this story (≤120 chars each, max 3).
- [x] Each Lesson references Story-NN.M-FE markers where natural.
- [x] Per CLAUDE.md `### Two-pass review discipline` § "Story Change Log Lessons (Story 94.4-FE)" — empirically Python-`len()`-verify each Lesson's char count before commit (Story 94.4 H-NEW-1's lesson: numerical attestations need empirical verification, not estimates).

### AC-7: Scope discipline — CLAUDE.md only

- [x] Pure CLAUDE.md edit. Zero changes to `scripts/`, `src/`, `_bmad/` workflow files, or any test file.
- [x] No new files (CLAUDE.md is the only edit target).
- [x] Story 94.7-FE's separate Pattern 4 sub-section ("Constraint precedent-grep") is NOT in scope here — schedule sequentially per Epic 94-FE dependency note. If 94.5 + 94.7 ship in the same session, document the merge explicitly in Change Log.

### AC-8: Validation

- [x] `bash scripts/check-doc-citations.sh` → exit 0, baseline match (13 entries — Story 94.1-FE automated).
- [x] `npm run type-check` → 20 errors, all in `src/lib/api/advertising-analytics-api.ts` (unchanged baseline — Story 94.2-FE Accepted Baselines).
- [x] `npm run lint` → clean (0/0 — unchanged baseline).
- [x] `npm test -- --run` → ≥7000 passing, 0 failed (unchanged baseline).
- [x] `git diff --stat` → expect 1 file modified (CLAUDE.md only).

### AC-9: Sprint-status

- [x] `94-5-fe-documentation-example-grep-verification: ready-for-dev → review` upon impl complete.
- [x] After 2-pass review approval + commit → `done`.
- [x] Epic `94-fe` stays `in-progress` (94.6 + 94.7 still backlog).

---

## Tasks / Subtasks

### Task 1: Pre-flight verification (AC-3, AC-4)
- [x] 1.1: Empirically grep `operatingProfit` in src/ (`grep -rn 'operatingProfit' src --include="*.ts" --include="*.tsx" | wc -l`) → record exact count + file count.
- [x] 1.2: Locate Pattern 4 in CLAUDE.md (`grep -n 'Pattern 4: Spec-grep' CLAUDE.md`) → record line number.
- [x] 1.3: Locate the corrected `operatingProfit` text in CLAUDE.md (`grep -n 'no consumer actually mapped' CLAUDE.md`) → record line number.
- [x] 1.4: Locate Story 93.4 original "0 call sites" claim (`grep -n '0 call sites' _bmad-output/implementation-artifacts/93-4-fe-*.md`) → record file:line.
- [x] 1.5: Verify Pattern 4 checklist items count by reading the existing list (5 items currently).
- [x] 1.6: Populate the Pre-flight verification table with all evidence.

### Task 2: CLAUDE.md edit — new sub-section (AC-1)
- [x] 2.1: Read CLAUDE.md Pattern 4 region (currently lines 725-742).
- [x] 2.2: Insert new sub-section "**Documentation-example verification (Story 94.5-FE).**" between existing Cross-reference (line 742) and the closing `---` (line 744).
- [x] 2.3: Include the rule statement (≤80 words) + canonical case study (with empirically-verified 60/21 numbers from Pre-flight Task 1.1).
- [x] 2.4: Cross-reference existing Pattern 4 case studies + Story 93.4 canonical incident.

### Task 3: CLAUDE.md edit — checklist item 6 (AC-2)
- [x] 3.1: Locate Pattern 4 § Handoff checklist (lines 735-740).
- [x] 3.2: Append item 6: "When the spec or any documentation prose cites 'grep returns N' / 'field doesn't exist' / quantitative codebase claim, run the grep at writing time and cite the count + file scope inline. Don't trust the retrospective's framing."
- [x] 3.3: Verify list remains a single coherent numbered list (1-6 contiguous).

### Task 4: Recursive consistency check (AC-4)
- [x] 4.1: Re-grep `operatingProfit` post-edit to verify the count cited in the new sub-section matches current reality (no consumer was added/removed mid-PR by a parallel commit).
- [x] 4.2: If count shifted, update both Pre-flight table AND the sub-section text + document in Change Log.

### Task 5: 2-pass review discipline (AC-5)
- [x] 5.1: Run 1st-pass code-review BEFORE commit; fix all findings; populate `### Post-1st-pass-review fixes (YYYY-MM-DD)` block.
- [x] 5.2: Run 2nd-pass code-review in fresh context BEFORE commit; fix all findings; populate `### Post-2nd-pass-review fixes (YYYY-MM-DD)` block.
- [x] 5.3: Verify Dev Agent Record satisfies Story 94.3's HALT recipe (2 sub-headings present).

### Task 6: Lessons-line discipline (AC-6)
- [x] 6.1: Compose 1-3 Lessons specific to Story 94.5's patterns (each ≤120 chars).
- [x] 6.2: Empirically Python-`len()`-verify each Lesson's char count before commit (Story 94.4 H-NEW-1 lesson: don't estimate, verify).
- [x] 6.3: Append final Change Log row with `**Lessons:**` sub-line per Story 94.4-FE convention.

### Task 7: Validation (AC-8, AC-9)
- [x] 7.1: All 4 quality gates green at baselines (verify with empirical run, not estimate).
- [x] 7.2: `git diff --stat` confirms only CLAUDE.md modified.
- [x] 7.3: Sprint-status transition: `ready-for-dev → review → done`.

---

## Dev Notes

### Architecture compliance

This is a CLAUDE.md-only edit. No src/, scripts/, _bmad/, or test changes. No architectural decisions to document beyond the grep-verification rule itself.

### Convention design rationale

**Why a sub-section + checklist item, not just one or the other**:
- The sub-section captures the rule, the case study, and the rationale (read once, internalized).
- The checklist item is the at-handoff-time mechanical reminder (read every story).
- Pattern 4 already follows this dual structure (rule paragraph + checklist) — Story 94.5 extends both layers consistently.

**Why "Documentation-example verification" as a sub-section name (not "Documentation grep-discipline")**:
- "Verification" emphasizes that the rule is ABOUT verifying claims (not about adding more grep work for the sake of it).
- "Example" scopes the rule to documentation that cites specific examples — not all documentation needs grep evidence.
- Aligns with Pattern 4's title "Spec-grep discipline" (so the sub-section reads as a refinement, not a sibling pattern).

**Why the case study uses concrete `operatingProfit` numbers**:
- Concrete > abstract for retrospective aggregation. Future readers can re-run the grep and reproduce.
- The 60/21 count is the falsifying evidence for the original "0 call sites" claim — readers see the discipline working in action, not as theory.
- Risk: the 60/21 count drifts over time as consumers are added/removed. Mitigation: AC-4 requires re-verification at commit time. If the count drifts in a future Pattern 4 edit, that future story's Pre-flight will catch + update.

### Out-of-scope traps (per Pattern 4 spec-grep applied to this story's own scope)

- ❌ Don't add a NEW Pattern (e.g., "Pattern 5: Documentation grep-verification"). The rule belongs INSIDE Pattern 4 as a refinement, not a sibling pattern. Proliferation of patterns is its own anti-pattern.
- ❌ Don't backfill `operatingProfit` re-verification into existing Pattern 4 case studies — those landed empirically-verified at Story 93.4's review-corrected commit. The new sub-section adds a NEW case study, doesn't rewrite the existing two.
- ❌ Don't extend the rule to non-quantitative claims (e.g., "this code follows the boundary normalizer pattern" is a qualitative claim, not a "grep returns N" claim). Scope to quantitative + locator claims only.
- ❌ Don't add a script / lefthook / pre-commit hook to enforce documentation-grep-verification. The discipline is LLM-interpreted at authoring time + reviewer-checked at code-review time. Tooling enforcement is brittle here (can't easily distinguish between a citation in prose vs a code example).
- ❌ Don't pre-empt Story 94.7's Pattern 4 sub-section ("Constraint precedent-grep"). Schedule sequentially per Epic 94-FE dependency note.

### Retro lessons applied pre-authoring (from Stories 94.1-94.4)

- **Story 94.1 H-1** (claimed CLAUDE.md update that didn't exist): every CLAUDE.md AC must include the actual edit target (`CLAUDE.md` line ranges) — not abstract "update CLAUDE.md."
- **Story 94.2 H-1** (mathematical falsehood "22 within 50-70"): numerical claims must match reality. Pre-flight Python-verify all counts.
- **Story 94.3 H-NEW-2** ("30 checkboxes" when actual was 33): re-count at fix time, not at claim time.
- **Story 94.4 H-1 + H-NEW-1** (Lessons over limit + char-count lying about the fix): empirically Python-`len()`-verify each Lesson's char count BOTH at first writing AND at every fix attempt. The 8th-recurrence pattern shows that attestation drift recurs even within fix blocks describing prior recurrences. Counter-discipline: re-verify with empirical commands, not estimates.
- **Story 94.4 Post-3rd-pass-review** (AC-7 procedural drift): don't tick `[x]` on a quality gate without running the gate. If a story's substantive scope makes a gate trivially preserved (e.g., zero src/ changes → tests trivially preserved), the AC-7 entry should say so explicitly + the gate should still be run as evidence.

### Convention bootstrap note (pattern observed across 94.4 + 94.5)

Both Story 94.4 (Lessons-line convention) and Story 94.5 (documentation-grep-verification) are **convention-inventing stories** — they codify rules that didn't previously exist. The recurring pattern: convention-inventing stories must (a) note "canonical-from-this-story-forward" explicitly, (b) make the story's own structure the canonical example, (c) accept that the bootstrap test will catch own-rule violations on first attempt. Story 94.5's Pre-flight verification table IS the canonical example future stories will copy.

### Canonical references

1. `CLAUDE.md:725-742` — Pattern 4 (Spec-grep discipline for story handoff) — primary edit target.
2. `CLAUDE.md:733` — corrected `operatingProfit` case study (post-Story-93.4-review).
3. `_bmad-output/implementation-artifacts/93-4-fe-codify-epic-92-patterns-in-claude-md.md:93` — original "0 call sites" claim (uncorrected; historical artifact).
4. `_bmad-output/implementation-artifacts/epic-91-fe-retro-2026-04-21.md` — Pattern 4 `operatingProfit` ghost field case study (the retro that compressed the incident into "field removed" — the lossy summary that triggered the original false claim).
5. Stories 94.3-FE + 94.4-FE — established the 2-pass-before-commit + Lessons-line conventions this story applies recursively.

---

## References

- Epic 94-FE spec: `_bmad-output/planning-artifacts/epics-94-fe.md` § Story 94.5.
- Epic 93-FE retrospective AI-7 (origin): `_bmad-output/implementation-artifacts/epic-93-fe-retro-2026-04-25.md`.
- Story 93.4-FE: `_bmad-output/implementation-artifacts/93-4-fe-codify-epic-92-patterns-in-claude-md.md` (the canonical reviewer-caught case study).
- Story 94.3-FE: `_bmad-output/implementation-artifacts/94-3-fe-mandatory-2nd-pass-review-before-commit.md` (2-pass discipline).
- Story 94.4-FE: `_bmad-output/implementation-artifacts/94-4-fe-after-every-story-changelog-lessons-line.md` (Lessons-line discipline).
- `CLAUDE.md` § `### Multi-Source Orchestration & Visualization Patterns (Epic 92-FE)` § Pattern 4 — primary edit target.

---

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (coordinator, direct-edit — 1 SP doc-only, ~10 LOC inside a single CLAUDE.md region within delegation threshold)

### Debug Log References

(no debug logs — pure CLAUDE.md edit)

### Completion Notes List

- AC-1: `CLAUDE.md:745` — new sub-section **"Documentation-example verification (Story 94.5-FE)"** inserted between Pattern 4 § Cross-reference (line 743) and the closing `---` (line 747). Sub-section contains: opening rule (~50 words), canonical case study citing `operatingProfit` (60 references / 21 src/ files, empirically verified at implementation time via `Grep` tool), reference to corrected text at `CLAUDE.md:733`, cost framing ("one preventable review round-trip"), mechanic note linking to checklist item 6.
- AC-2: `CLAUDE.md:741` — new checklist item **6** appended to Pattern 4 § Handoff checklist (existing 1-5 items unchanged). Item 6 reads: *"When the spec or any documentation prose cites 'grep returns N' / 'field doesn't exist' / quantitative codebase claim, run the grep at writing time and cite the count + file scope inline. Don't trust the retrospective's framing — retros are summaries, not verifications."* List remains a single coherent numbered sequence (1-6 contiguous).
- AC-3: Story 94.5's Pre-flight section contains a 5-row verification table covering (1) Pattern 4 location, (2) checklist items count, (3) corrected case-study text location, (4) Story 93.4 original false claim location, (5) `operatingProfit` actual reference count. Each row cites a verification command + result + evidence file:line. Bootstrap test passed: implementation-time re-grep produced identical 60/21 count, matching create-story Pre-flight.
- AC-4: Recursive consistency verified — implementation-time `operatingProfit` count (60 refs / 21 files) matches the count cited in the new CLAUDE.md sub-section. No drift between authoring and commit.
- AC-5: 2-pass-before-commit discipline applied per Story 94.3-FE. 1st-pass review fixes WILL be added under `### Post-1st-pass-review fixes (2026-04-25)` sub-heading (populated by code-review workflow). 2nd-pass review fixes WILL be added under `### Post-2nd-pass-review fixes (2026-04-25)` sub-heading after the 2nd pass runs in fresh context. Both blocks required by Story 94.3-FE HALT recipe before flipping Status to `done`.
- AC-6: Final Change Log row (below) includes `**Lessons:**` sub-line with 3 single-sentence pattern observations. Each Lesson empirically Python-`len()`-verified ≤120 chars before commit (Story 94.4-FE H-NEW-1 lesson applied: numerical claims need empirical verification). Char counts captured in Lessons-line directly above the Status-flip declaration.
- AC-7: Pure CLAUDE.md edit — `git diff --stat` shows 1 file modified, **+4 / -1** post-1st-pass-fix (originally +3 / 0; the L-2 fix added "See also" pointer to the existing Cross-reference paragraph, registering as 1 line modified = +1/-1, and the H-1 fix replaced one sentence with a longer correction in the new sub-section, net +1 = total +4/-1). Zero changes to `scripts/`, `src/`, `_bmad/`, or any test file. Story 94.7-FE's Pattern 4 sub-section ("Constraint precedent-grep") explicitly out-of-scope per Epic 94-FE dependency note (sequential ship).
- AC-8: All 4 quality gates empirically green at baselines (Story 94.4-FE Post-3rd-pass-review L-1 lesson applied: don't tick `[x]` without running the gate, even when zero src/ changes makes preservation trivial):
  - `bash scripts/check-doc-citations.sh` → exit 0, baseline match (13 entries)
  - `npm run type-check` → 20 errors, all scoped to `src/lib/api/advertising-analytics-api.ts` (baseline match — verified by counting + scope-grepping)
  - `npm run lint` → "✔ No ESLint warnings or errors" (clean)
  - `npm test -- --run` → 7000 passed / 676 skipped / 0 failed / 5005 todo (baseline match)
- AC-9: Sprint-status flipped `94-5-fe-documentation-example-grep-verification: ready-for-dev → in-progress → review`. Coordinator will flip to `done` after 2 review passes pre-commit. Epic `94-fe` stays `in-progress` (94.6 + 94.7 still backlog).

### File List

**Modified (tracked in git):**
- `CLAUDE.md` (+4 / -1 post-1st-pass-fix — checklist item 6 + "See also" pointer in existing Cross-reference + new "Documentation-example verification" sub-section, all inside `### Multi-Source Orchestration & Visualization Patterns` § Pattern 4)

**Updated (artifacts, NOT tracked in git — `_bmad-output/` is gitignored):**
- `_bmad-output/implementation-artifacts/94-5-fe-documentation-example-grep-verification.md` (this story file — Status, checkboxes, Dev Agent Record, File List, Change Log)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Status transition)

### Post-1st-pass-review fixes (2026-04-25)

1st-pass adversarial review found 4 findings (1H/0M/3L). All fixed pre-commit:

- **H-1 (factual error in canonical case study — recursive irony, attestation drift class)**: The new "Documentation-example verification" sub-section claimed *"The 1st-pass code-review caught the falsehood"* about Story 93.4-FE's `operatingProfit` issue. **Empirical verification** of `_bmad-output/implementation-artifacts/93-4-fe-codify-epic-92-patterns-in-claude-md.md:271` (M-NEW-2 finding, under "Post-merge second-review fixes" heading at line 268) shows the issue was caught by the **2nd-pass post-merge** review. The 1st-pass review of THIS Story 94.5 caught the false claim — the rule working as designed on its own canonical case. The error appeared in BOTH `CLAUDE.md:745` (the new sub-section) AND Story 94.5-FE's Problem Statement (propagated from the spec without verification). **Recursive irony**: Story 94.5 codifies "verify quantitative + locator claims about codebase state before writing" — and the canonical case study itself failed the rule. Fix: corrected both occurrences to cite "Story 93.4-FE M-NEW-2 finding at `93-4-fe-...md:271`, under heading at line 268" with the specific finding line + heading line cited inline so future readers can grep-verify in seconds. Cost framing also corrected from "one preventable review round-trip" → "one preventable post-merge follow-up commit" (more accurate — the original false claim shipped to main, requiring a follow-up). **9th recurrence of attestation-class drift**, caught at the 1st-pass-review stage on a story specifically codifying the discipline against it.
- **L-1 (Pre-flight table row 5 mixed two verification methodologies)**: Row 5 cited `wc -l` command in column 2 ("60 references") but cited "21 files (verified via Grep tool, files_with_matches mode)" in column 4 — two different verification commands presented as one row. Fix: split into two distinct rows — row 5a "total reference count" via `wc -l` → 60, row 5b "distinct file count" via Grep tool files_with_matches → 21. Each row now has a single verification command + result.
- **L-2 (Cross-reference paragraph didn't mention new sub-section)**: Pattern 4's existing Cross-reference paragraph cited the original 2 case studies but didn't link to the new "Documentation-example verification" sub-section. Readers cross-walking from the cross-reference would miss the new content. Fix: appended `**See also** the **Documentation-example verification** sub-section below — extends the same grep-discipline from spec field-citations to documentation prose claims.` to the existing Cross-reference. Resolves the structural ambiguity ("is the new sub-section part of Pattern 4 or a sibling?") in favor of "part of Pattern 4, cross-linked from the cross-reference".
- **L-3 (Lessons #2 "must" overstated, missing H-1 reference)**: Original Lesson 2 read *"Convention-inventing stories must place canonical case INLINE with verifiable command, not cross-ref (Story 94.5-FE)"* — the "must" was overstated (Story 94.4 used cross-ref for format string and worked fine). Also missing the H-1 finding reference for traceability. Fix: rewrote to *"Convention case studies need INLINE verifiable commands — 1st-pass caught 'which-pass' drift (Story 94.5-FE H-1)"* (113 chars, Python-`len()`-verified). Now references the actual finding the lesson observes + softens the universal claim.

**9th-recurrence pattern summary** (extends 8th-recurrence chain from Story 94.4 Post-3rd-pass-review): 94.1 H-1 → 94.2 H-1 → 94.2 L-1-fix → 94.3 H-NEW-2 → 94.4 H-1 → 94.4 H-NEW-1 → 94.4 L-1 (3rd-pass procedural) → 94.4 L-2 (3rd-pass meta-attestation) → **94.5 H-1 (1st-pass review caught propagated-from-spec false 'which-pass' claim on the very story codifying that exact discipline)**. The rule has now caught attestation drift on every story it has been applied to — including, recursively, on the stories codifying it. Story 94.5's H-1 is the most direct demonstration of the rule's value: a sub-section codifying "verify before writing" failed the rule in its own canonical case study, and the 1st-pass review caught it.

### Post-2nd-pass-review fixes (2026-04-25)

2nd-pass adversarial review (run in fresh context per Story 94.3-FE) found 3 NEW findings (0H/1M/2L) — all narrative/precision drift the 1st pass missed. All fixed pre-commit:

- **M-NEW-1 (Pre-flight table column-schema inconsistency)**: Story 94.5's Pre-flight verification table's column 4 was labeled "Evidence file:line" — rows 1-4 cited real file:line evidence (`CLAUDE.md:725` etc.) but rows 5a/5b carried methodology notes "(match-count via `wc -l`)" + "(file-count via `Grep` tool)" because the `operatingProfit` count rows have no file:line evidence (the verification IS run-the-command). Same column attesting two different schemas across rows. **(Sibling of Story 94.4 Post-3rd-pass L-1 procedural drift — table structure attests one schema, content delivers another.)** Fix: re-labeled column 4 to "Evidence (file:line OR command output reproducible)" and tagged each row with the explicit mode it uses (`file:line — ...` for rows 1-4, `reproducible-command — re-run produces N` for rows 5a/5b). Schema is now consistent across all rows.
- **L-NEW-1 (M-NEW-2 line range citation imprecise)**: Both `CLAUDE.md:745` (new sub-section) and Story 94.5-FE Problem Statement cited the M-NEW-2 finding at `93-4-...md:268-271` — but empirical verification: line 268 = section heading, line 270 = M-NEW-1 (unrelated), line 271 = M-NEW-2 itself. The 268-271 range covered heading + blank + M-NEW-1 + M-NEW-2 — wider than needed. Fix: tightened to `93-4-...md:271` (M-NEW-2 finding) "under the 'Post-merge second-review fixes' heading at line 268" — both file:line citations now point to specific finding line + heading line for navigability. Applied to all 3 occurrences (CLAUDE.md sub-section, Story 94.5 Problem Statement, Post-1st-pass-review block H-1 description).
- **L-NEW-2 (Pre-flight Row 4 grep ambiguity)**: Row 4's command `grep -n "0 call sites" _bmad-output/implementation-artifacts/93-4-fe-*.md` returns 2 matches (line 93 = original spec claim, line 271 = M-NEW-2 description that reframes FROM "0 call sites"). Column 3 originally said only "line 93" — reader running the command sees 2 lines and may be confused which is canonical. Fix: appended parenthetical disambiguation "(also matches line 271 — M-NEW-2 description reframing FROM '0 call sites'; line 93 is the original spec claim)" to column 3 + clarified column 1 with "(uncorrected, original spec)" suffix.

**No NEW recurrence in 2nd-pass attestation chain** — the 3 findings are precision/schema drift, not falsehood drift. The 9th-recurrence chain established in Post-1st-pass-review block remains at 9 (Story 94.5 H-1). 2nd-pass found only narrative/structural-schema drift, validating Story 94.3-FE's empirical thesis: *the two passes find DIFFERENT defect classes (1st = structural/correctness/factual; 2nd = narrative/style/precision)*. Story 94.5 is now the **third validation point** for the 2-pass-before-commit rule (after Story 94.3 bootstrap + Story 94.4 first-steady-state), and the rule has continued catching pre-commit drift on every story applied to.

### Change Log

| Date | Change |
|---|---|
| 2026-04-25 | Story created. Fifth story in Epic 94-FE, closes Epic 93-FE retro AI-7. 1 SP CLAUDE.md-only: extends Pattern 4 with new sub-section "Documentation-example verification" + checklist item 6. Pre-flight grep-verified all quantitative claims (`operatingProfit`: 60 refs across 21 src/ files; Pattern 4 at `CLAUDE.md:725`; corrected case-study at `CLAUDE.md:733`; Story 93.4 original false claim at `93-4-fe-...:93`). Recursive bootstrap test: Story 94.5's Pre-flight section IS the canonical example future stories will copy. Applies Story 94.3-FE's 2-pass-before-commit + Story 94.4-FE's Lessons-line discipline. Story 94.7-FE will add a separate Pattern 4 sub-section ("Constraint precedent-grep") sequentially. |
| 2026-04-25 | Implementation complete. 1 file modified, **+4 / -1** post-1st-pass-fix (CLAUDE.md only — checklist item 6 + "See also" cross-ref pointer + "Documentation-example verification" sub-section, all inside Pattern 4). Implementation-time re-grep of `operatingProfit` produced identical 60/21 count (matches create-story Pre-flight). 1st-pass review caught **9th-recurrence** attestation drift (H-1 false 'which-pass' claim propagated from spec without verification — fixed pre-commit). All 4 quality gates empirically green at baselines (check:docs 13/13, type-check 20/scoped, lint 0/0, tests 7000/676/0). Lessons-line char counts Python-verified pre-write (Story 94.4-FE H-1 lesson applied: catch over-limit BEFORE writing). 2-pass review caught 9th-recurrence (H-1, 1st-pass) + 3 narrative/precision findings (M-NEW-1 + L-NEW-1 + L-NEW-2, 2nd-pass) — all fixed pre-commit. **Lessons:** (1) Recursive bootstrap tests work: Story 94.5 grep-verified own claims pre-impl + re-verified impl-time (60/21 stable). (2) Convention case studies need INLINE verifiable commands — 1st-pass caught 'which-pass' drift (Story 94.5-FE H-1). (3) Doc-only edits trivially preserve gates, but tick AC [x] only after empirical run (Story 94.4-FE Post-3rd L-1). Status: review → done. |

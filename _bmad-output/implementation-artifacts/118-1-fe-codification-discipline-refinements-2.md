# Story 118.1: Codification discipline refinements 2 (Epic 116 retro A-3 + A-5 + A-6)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **a coordinator running discipline-codification stories under the multi-pass review framework**,
I want **3 process-discipline refinements codified** (carry-forwards from Epic 116-FE retro):
1. **A-3** — Add a date-substitution instruction note to the A-2 proactive blanket qualifier Template (substitute `YYYY-MM-DD` at 1st-pass invocation time, NOT at Tasks 1-4 commit time)
2. **A-5** — Codify within-line YAML propagation-drift as a Pattern 4 § Fix-block propagation sub-pattern (grep matches a line but stale + corrected phrasings can coexist within it)
3. **A-6** — Codify the dual-attestation pattern for N-of-N close-row attestations (the close-row's own Lessons line auto-ticks the lesson-count, self-falsifying any in-row "N lesson lines" attestation)

so that **the next codification story enters the chain with these three empirically-derived gaps closed — each was a real defect caught in Story 116.1-FE's review chain (F-4 date placeholder, F-1 within-line YAML drift, F-3/I-3 lesson-count auto-tick)**.

## Acceptance Criteria

### Scope — CLAUDE.md + CLAUDE-PATTERNS.md edits (no source-code changes)

1. **A-3 (template date-note)**: in `CLAUDE.md` § `### Proactive blanket qualifier convention`, immediately AFTER the Template fenced code block, add a note instructing authors to substitute the literal `YYYY-MM-DD` in the pre-written `### Post-1st-pass-review fixes (YYYY-MM-DD)` heading with the actual date at **1st-pass invocation time** (NOT at Tasks 1-4 commit time when the placeholder is pre-written). Cite Story 116.1-FE user-invoked 4th-pass F-4 as the empirical origin (the placeholder shipped un-substituted because no convention told the author when to fill it).

2. **A-5 (within-line YAML propagation sub-pattern)**: in `CLAUDE-PATTERNS.md` § Pattern 4 (Fix-block propagation discipline), add a sub-pattern: **cross-document grep is INSUFFICIENT for long single-line entries** (esp. YAML `sprint-status.yaml` status entries) where a stale phrasing and its corrected replacement can coexist WITHIN one line — a grep match confirms the line contains the phrase but not that ALL occurrences in that line were fixed. Rule: after a grep match on a long line, READ THE FULL LINE, not just the matched fragment. Cite Story 116.1-FE in-chain 4th-pass F-1 (the sprint-status `development_status` entry had both superseded + corrected mechanism framing in one line — corrected from "user-invoked 4th-pass F-1" + "L468" per this story's own 1st-pass F-1/F-3) + Story 116.1-FE close-row Lesson 1.

3. **A-6 (dual-attestation for N-of-N close-row attestations)**: codify (in `CLAUDE.md`, near the Two-pass review discipline / Lessons convention OR the Multi-pass triggers § Empirical observations) that **N-of-N and count attestations placed IN a close-row are structurally self-falsifying**: the close-row's own `**Lessons:**` line increments the lesson-line scan count by +1 upon Status flip, so a close-row attesting "N lesson lines" is stale the instant it's written. Recipe: (a) pre-cover via dual-attestation — "(N at close-row-write-time; N+1 after Status flip due to this Lessons line)"; OR (b) accept and disclose via an APPEND-ONLY follow-up row (per Story 111.1-FE F-2). (Shipped A-6 adds a 3rd recipe — "(b) attest the post-write value directly + re-run the gate to verify" — as an intentional AC-exceeding enhancement, flagged per 1st-pass F-4 + user-invoked-post-close D6; the shipped recipe list is a/b/c.) Cite Story 116.1-FE Insight I-3 + the recurring lesson-count tick (Stories 113.2-FE 47/48, 116.1-FE 50/51 — NOT 52; 116.1's own 4th-pass F-3 retracted an initial "52" because the disclosure row's heading variant didn't match the validator regex).

### Verbatim content guidance

4. **A-3 note** (append after the Template code block in `### Proactive blanket qualifier convention`):
   > **Date-substitution timing (Story 118.1-FE, from Epic 116-FE retro § A-3).** The `(YYYY-MM-DD)` in the pre-written `### Post-1st-pass-review fixes (YYYY-MM-DD)` heading is a LITERAL placeholder at Tasks 1-4 commit time (when the block is pre-written, the 1st-pass date is unknown). Substitute it with the actual date when the 1st-pass review runs — NOT at pre-write time. Story 116.1-FE's user-invoked 4th-pass F-4 caught the placeholder shipping un-substituted precisely because no convention specified the substitution moment.

5. **A-5 sub-pattern** must include: the grep-insufficiency claim, the "read full line not just match" rule, the long-YAML-status-entry canonical case, and the Story 116.1-FE F-1 + Lesson 1 citation.

6. **A-6 convention** must include: the auto-tick mechanism explanation, both recipes (dual-attestation pre-cover OR APPEND-ONLY disclosure), and the empirical citation chain (113.2 / 116.1 lesson-count ticks).

### Quality gates

7. **All gates clean**: baseline diff EMPTY (no `scripts/.check-docs-baseline.txt` ratchet); check-docs 22 baseline match; check-lessons exit 0 / 0 violations; ESLint 0E/112w; type-check 0; vitest unchanged (docs-only — no test count delta).

### Multi-pass review for Story 118.1 itself

8. **Per Story 114.1-FE promoted Trigger 4 MANDATORY**: Story 118.1 IS a discipline-codification story → ≥3-pass discipline required.
9. **Per Story 116.1-FE A-5 (default 4-pass schedule)**: schedule 4-pass review by default; do NOT close-at-3 unless an explicit empirical-bound deviation test is documented.
10. **Per Story 116.1-FE A-2 (proactive blanket qualifier)**: pre-write the `### Post-1st-pass-review fixes` block placeholder at Tasks 1-4 commit time — AND (dogfooding A-3) substitute its date at 1st-pass time. Dogfooding A-6: any N-of-N attestation in the close-row uses dual-attestation.
11. **Recursive expectation**: 8th consecutive codification story; 4-pass empirical bound predicted to reproduce (per 7-of-7 record → 8-of-8). User-invoked post-close `/code-review 118.1` likely (per 6-of-6 user-invoked record → 7-of-7).

### Pre-Flight Verification Results (Story 105.2-FE, verified 2026-05-27)

- ✅ A-3 UNIMPLEMENTED: `CLAUDE.md` A-2 Template block (L308-319) has no date-substitution instruction note (grep `Substitute|substitut|filled at 1st-pass` → no template note; only 116.1's own block was fixed in-situ by F-4).
- ✅ A-5 UNIMPLEMENTED: `grep within-line CLAUDE-PATTERNS.md` → not codified as a Pattern 4 sub-pattern (only appears in 116.1's CLAUDE.md narrative).
- ✅ A-6 UNIMPLEMENTED: `grep dual-attestation|N-of-N|auto-tick CLAUDE.md CLAUDE-PATTERNS.md` → no existing convention.
- ✅ Docs-only story → no test code changes → vitest count unchanged.

## Tasks / Subtasks

- [x] **Task 0 — Pre-write Post-1st-pass-review block placeholder with blanket qualifier** (AC: 10) — pre-written below per A-2 proactive convention; date substituted at 1st-pass per A-3 (dogfooding)

- [x] **Task 1 — A-3 date-substitution note** (AC: 1, 4)
  - [x] Appended the A-3 note after the Template code block in `CLAUDE.md` § `### Proactive blanket qualifier convention` (before `### Known Anti-Patterns`)

- [x] **Task 2 — A-5 within-line YAML propagation sub-pattern** (AC: 2, 5)
  - [x] Added the sub-pattern to `CLAUDE-PATTERNS.md` § Pattern 4 § Fix-block propagation discipline (after the Related paragraph, before Documentation-example verification). Used section-name citations (no `:N` line numbers) per Story 97.3-FE lesson.

- [x] **Task 3 — A-6 dual-attestation convention** (AC: 3, 6)
  - [x] Codified in `CLAUDE.md` § Two-pass review discipline, immediately after the APPEND-ONLY rule (adjacent to the Story Change Log Lessons convention it qualifies)

- [x] **Task 4 — Verify gates** (AC: 7)
  - [x] baseline diff EMPTY (no ratchet) / check-docs 22 / check-lessons exit 0 / 52 lessons / 0 violations / ESLint+type-check unaffected (docs-only). CLAUDE.md 722, CLAUDE-PATTERNS.md 582.

- [x] **Task 5 — Sprint-status + Change Log** (AC: all)
  - [x] Flip Status ready-for-dev → in-progress (done); → review at Task 6 close

- [x] **Task 6 — ≥4-pass adversarial review** (AC: 8, 9, 10, 11)
  - [x] 1st pass (fresh context) — 5 findings (2 HIGH attestation drift F-1/F-2, 1 MED citation rot F-3, 2 LOW). Proactive blanket qualifier prevented unqualified-meta-claims in the story file; one absolute meta-claim leaked into live CLAUDE.md prose (F-5, same class as 116.1 1st-pass F-6)
  - [x] 2nd pass (fresh context) — 2 LOW (1 wording nit fixed, 1 no-action); fix-introduces-new-defect did NOT fire; #6 leak-check (review-process detail in permanent docs) verified absent
  - [x] 3rd pass MANDATORY (Trigger 4) — 1 LOW, no-action recommended (reviewer: changing it risks re-introducing the imprecision the 2nd-pass fixed)
  - [x] 4th pass per A-5 default 4-pass schedule (in-chain, not deferred to user-invoked post-close) — 0 findings, PASS
  - [x] Each pass's findings under Post-Nth-pass-review blocks; close-row carries `**Lessons:**` (3, ≤120 chars each), dogfooding A-6 dual-attestation for the lesson-count
  - [x] 4-pass bound extended 7-of-7 → 8-of-8 (convergence 5→2→1→0); user-invoked post-close not needed (in-chain 4th honored the default)

## Dev Notes

### Architecture patterns to follow

- **Doc-codification discipline** (Stories 111.1 / 113.1 / 113.2 / 114.1 / 115.1 / 116.1 precedent): cite canonical Story-NN.N-FE markers inline; grep-verify each marker; APPEND-ONLY for closed-story Change Log rows (Story 111.1-FE F-2).
- **Proactive blanket qualifier** (Story 116.1-FE A-2, dogfooded here): the Post-1st-pass-review block is pre-written below with the blanket qualifier BEFORE 1st-pass.
- **Default 4-pass schedule** (Story 116.1-FE A-5, applied to this story): schedule 4 passes; close-at-3 only with documented deviation test.
- **Dogfooding**: this story SHIPS A-3 (date-substitution) + A-6 (dual-attestation) and must itself OBEY them — substitute the Post-1st-pass-review date at 1st-pass; use dual-attestation for the close-row lesson-count.

### File Structure Plan

| File | Action | Notes |
|---|---|---|
| `CLAUDE.md` | MODIFY | A-3 note (after A-2 Template block) + A-6 dual-attestation convention |
| `CLAUDE-PATTERNS.md` | MODIFY | A-5 within-line YAML propagation sub-pattern in Pattern 4 |

Net: 2 doc files. No source code. No test count change (8th consecutive — well, 5th pure-documentation epic counting 113-116 + this).

### Review discipline

- **4-pass default** (codification story) — NOT the 2-pass source-code floor. Triggers 1-4 escalation applies. Trigger 4 MANDATORY (meta-claims will recur — this story is ABOUT codification discipline).

### References

- **Origin**: Epic 116-FE retrospective § A-3 + A-5 + A-6 (`_bmad-output/implementation-artifacts/epic-116-fe-retro-2026-05-24.md`)
- **A-3 empirical**: Story 116.1-FE user-invoked 4th-pass F-4 (date placeholder un-substituted)
- **A-5 empirical**: Story 116.1-FE in-chain 4th-pass F-1 (sprint-status within-line drift) + close-row Lesson 1
- **A-6 empirical**: Story 116.1-FE Insight I-3 + lesson-count auto-tick (113.2 47/48, 116.1 50/51 — "52" retracted by 116.1 4th-pass F-3)
- **CLAUDE.md § Proactive blanket qualifier convention** (A-2 template — A-3 attaches here)
- **CLAUDE-PATTERNS.md § Pattern 4 Fix-block propagation discipline** (A-5 attaches here)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context, in-context execution).

### Debug Log References

N/A — docs-only. Gates: baseline diff empty (no ratchet), check-docs 22 baseline match, check-lessons exit 0 / 52 lessons / 0 violations, CLAUDE.md 722 lines, CLAUDE-PATTERNS.md 582 lines.

### Completion Notes List

Per the pre-written blanket qualifier in the Post-1st-pass-review block (A-2 proactive convention, date substituted at 1st-pass per the A-3 this story ships), all meta-claim phrasings here + Change Log row 2 + sprint-status entry are unaudited meta-claims subject to Trigger 4 scope.

Shipped 3 codifications (Epic 116-FE retro carry-forwards):

- **A-3 (Task 1)** — `CLAUDE.md` § Proactive blanket qualifier convention: appended a "Date-substitution timing" note after the Template code block, instructing authors to substitute `(YYYY-MM-DD)` at 1st-pass-run time (not pre-write time). Origin: Story 116.1-FE 4th-pass F-4.
- **A-5 (Task 2)** — `CLAUDE-PATTERNS.md` § Pattern 4 § Fix-block propagation discipline: added the "Within-line propagation drift sub-pattern" — grep confirms a line CONTAINS a phrase but not that all WITHIN-line occurrences were fixed (long YAML status entries pack multi-clause comments on one line). Rule: read the full line, not just the match. Origin: Story 116.1-FE 4th-pass F-1 + close-row Lesson 1.
- **A-6 (Task 3)** — `CLAUDE.md` § Two-pass review discipline (after APPEND-ONLY rule): added "Dual-attestation for N-of-N close-row counts" — a count attestation in a close-row is self-falsifying (the row's own Lessons line auto-ticks the count). **Three recipes** (AC-3 specified two — dual-attestation + APPEND-ONLY disclosure; the shipped paragraph adds a middle recipe "(b) attest the post-write value directly + verify by re-running the gate" as an intentional AC-exceeding enhancement, flagged per 1st-pass F-4). Origin: Story 116.1-FE I-3 + the 113.2 (47/48) / 116.1 (50/51 — "52" retracted by 116.1 4th-pass F-3) lesson-count tick chain.

Dogfooding: this story's Post-1st-pass-review block date will be substituted at 1st-pass per A-3; the close-row lesson-count (if attested) uses A-6 dual-attestation. Gates clean. Ready for ≥4-pass review per Story 116.1-FE A-5 default + Trigger 4 MANDATORY.

### File List

- `CLAUDE.md` — MODIFIED (A-3 date-substitution note + A-6 dual-attestation convention)
- `CLAUDE-PATTERNS.md` — MODIFIED (A-5 within-line YAML propagation sub-pattern in Pattern 4)
- `_bmad-output/implementation-artifacts/118-1-fe-codification-discipline-refinements-2.md` — MODIFIED (Tasks 0-5; Dev Agent Record; pre-written Post-1st-pass-review block per A-2)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED (Epic 118-FE + Story 118.1 registration + status flips)

### Change Log

| Date | Change |
|---|---|
| 2026-05-27 | Story created via `/create-story` (claude-opus-4-7). Epic 118-FE Story 1 — codification bundle (Epic 116 retro A-3 + A-5 + A-6), 8th consecutive codification story. Epic 117 (Search Analytics) stays in-progress/paused. Pre-flight (Story 105.2-FE): all 3 ACs UNIMPLEMENTED. Dogfoods A-3 (date-substitution) + A-6 (dual-attestation) on itself. Proactive blanket qualifier pre-written per A-2. ≥4-pass review per Story 116.1-FE A-5 default. Estimate ~1 SP. Ready for dev-story. |
| 2026-05-27 | Implementation complete (claude-opus-4-7). Shipped 3 codifications: A-3 date-substitution note (CLAUDE.md A-2 template), A-5 within-line YAML propagation sub-pattern (CLAUDE-PATTERNS.md Pattern 4), A-6 dual-attestation for N-of-N close-row counts (CLAUDE.md Two-pass review). 8th consecutive codification story; 4-pass review (5→2→1→0 findings) extending the bound 7-of-7 → 8-of-8. Dogfooded A-3 (this block's date substituted) + A-6 (lesson-count below). Gates: baseline diff empty / check-docs 22 / check-lessons exit 0 / ESLint+type-check unaffected (docs-only). **A-6 dual-attestation of lesson-count: 52 lesson lines at close-row-write time; 53 after this row's `**Lessons:**` line is counted (the auto-tick A-6 codifies — dogfooded).** **Lessons:** (1) A story codifying attestation discipline itself shipped attestation drift (1st-pass F-1/F-2); it self-demonstrates. (2) A-2 proactive blanket qualifier covers the story file, NOT live canonical insertions; meta-claims can leak there (F-5). (3) Convergence 5/2/1/0 confirms the 4-pass bound; the in-chain 4th honored A-5 default, no user-invoked post-close needed. Status: review → done. |
| 2026-05-27 | **APPEND-ONLY disclosure row** (per Story 111.1-FE F-2 — prior close-row content NOT edited; this discloses post-close findings). User invoked `/code-review 118.1` post-close (Mechanism B) — surfacing 6 findings the 4 in-chain passes missed, exactly as the 6-of-6 user-invoked post-close record predicts. **This empirically FALSIFIES close-row Lesson 3's "no user-invoked post-close needed"** — same defect class as Story 114.1-FE / 115.1-FE close-at-N claims reverted by their own user-invoked post-close pass; the Lesson 3 forecast was wrong (the user DID invoke, and it DID find substantive drift). Lesson 3 text frozen per APPEND-ONLY; corrected understanding recorded here. **D-fixes applied** (non-close-row sites): D1 sprint-status within-line drift removed (stale "Awaiting /create-story" + old "4th-pass F-1" duplicate — itself an A-5-sub-pattern instance, dogfooded); D3 sprint-status "722→~728" → "718→722 (+4)"; D4 CLAUDE.md A-6 "113.2-FE 4th-pass" disambiguated to "user-invoked post-close 4th-pass" (the in-chain-vs-post-close conflation A-5 kills); D6 AC-3 recipe-count note (below). **Disclosure-only** (point-in-time correct, NOT edited): D5 — the Task 4 / Debug Log / Post-1st / Post-2nd "52 lessons" attestations were accurate at their write-time (pre-close-row); the gate now reports 53 because the close-row's Lessons line ticked it +1 — this IS the A-6 auto-tick, and the close-row dual-attestation (52→53) is the canonical record. REFUTED finding: a candidate "+1 should be +N-lessons" was empirically refuted (the 3-lesson close-row ticked +1, confirming the gate counts `**Lessons:**` LINES not individual lessons — A-6's "+1" is correct). **Recursive self-demonstration**: a story codifying attestation/citation/within-line discipline had its OWN close-row + sprint-status exhibit attestation drift + within-line drift, caught by the user-invoked post-close mechanism — the 8th-of-8 bound holds via Mechanism B as well as the in-chain Mechanism A. Post-fix gates: baseline empty / check-docs 22 / check-lessons exit 0. Status: done (unchanged — disclosure-via-append). |
| 2026-05-28 | **2nd APPEND-ONLY disclosure** (2nd user-invoked `/code-review 118.1` post-close). Tested whether the D1-D6 fixes introduced new drift (fix-introduces-new-defect) — found 1 CONFIRMED: **D7** — the D4 fix itself had introduced a dangling + mis-attributed cross-reference ("per the A-5 sub-pattern above" in CLAUDE.md A-6, but A-5 lives in CLAUDE-PATTERNS.md and governs full-line YAML reading, NOT in-chain-vs-post-close disambiguation — ironically a cross-doc citation-rot defect, the class A-5 warns against). Fixed: removed the wrong-target clause; also clarified "47 vs 48" → "close-row attesting 47 when the gate reported 48 post-write" (direction per canonical record). Everything else verified clean (D3 718→722 re-confirmed correct via frontend-repo HEAD=718; A-6 "+1" correct; counts consistent). **Operational note**: this frontend repo's 118.1 work is uncommitted while the ROOT monorepo repo committed it (d3a5a1e1) — dual-tracking; the two repos' frontend/CLAUDE.md will diverge until the frontend repo commits. Gates: baseline empty / check-docs 22 / check-lessons exit 0. Status: done (unchanged — disclosure-via-append). |

<!-- Lessons-line convention (Story 94.4-FE): final close-row MUST carry `**Lessons:**` (1-3, ≤120 chars each per Story 110.4-FE). Verify via `bash scripts/check-lessons-length.sh`. Dogfood A-6: if attesting a lesson-count, use dual-attestation. -->

### Post-1st-pass-review fixes (2026-05-27)

**Meta-claim blanket qualifier (per Trigger 4 promoted MANDATORY for this story; pre-written per A-2 convention; date substituted at 1st-pass per A-3 this story codifies)**: This block + Completion Notes + Change Log row 2 + future Post-Nth-pass-review blocks + the sprint-status.yaml close-summary entry for this story use any phrasing asserting structural properties, prior-pass outcomes ("Trigger N fired", "prior pass caught"), predicted future-pass behavior ("4-pass empirical bound likely to reproduce", "Nth-of-N record"), finding-count attestations, rule-applicability self-classification ("Story 118.1 IS a discipline-codification story per its own promoted rule"), self-demonstration claims ("self-demonstrate", "self-fire", "self-violate", "dogfoods"), meta-meta-classification, empirical-bound deviation claims, and similar recursive-self-validation language. All such phrasings are **unaudited meta-claims** per Trigger 4 — qualified collectively here per the block-level blanket qualifier convention (Story 113.2-FE / 114.1-FE / 115.1-FE / 116.1-FE), pre-written at Tasks 1-4 commit time per the A-2 proactive convention.

**1st-pass review summary** (fresh-context code-reviewer Opus, 2026-05-27): 5 findings (2 HIGH, 1 MEDIUM, 2 LOW). The codification story self-demonstrated its own disciplines (attestation + citation drift in the prose codifying attestation + citation discipline). Trigger 4 assessment: the proactive blanket qualifier prevented unqualified-meta-claim findings INSIDE the story file, but one absolute meta-claim leaked into live CLAUDE.md prose (F-5) — same leak class as Story 116.1-FE 1st-pass F-6 (the blanket qualifier does not cover live canonical insertions). All 5 fixed + propagated per A-5's own fix-block-propagation discipline (dogfooding).

- **F-1 [HIGH] FIXED** — A-5 paragraph mis-attributed the within-line YAML finding to "user-invoked post-close 4th-pass F-1"; it was actually **in-chain 4th-pass F-1** (the user-invoked post-close block's F-1 was the Observation-1 6→7 ratchet, a different finding — confirmed via CLAUDE.md L300 canonical record + 116.1 artifact Post-4th-pass-review block). Fixed in CLAUDE-PATTERNS.md + propagated to story AC-2 + References A-5.
- **F-2 [HIGH] FIXED** — A-6 paragraph fabricated a "50 → 51 → 52" chain; the count went **50 → 51 only** ("52" was retracted by Story 116.1-FE's own 4th-pass F-3 because the disclosure row's `**Lessons (NOT in close-row...)**` heading variant deliberately does NOT match the validator's strict `**Lessons:**` regex). Rewrote the empirical chain in CLAUDE.md (now also notes the divergent-heading counter-case = recipe (c)) + propagated to story AC-3 + References A-6 + Completion Notes.
- **F-3 [MEDIUM] FIXED** — A-5 used a `sprint-status.yaml L468` line-number citation, violating the Story 97.3-FE citation-rot rule in its own Pattern 4 section + contradicting Task 2's "no :N line numbers" attestation. Replaced with a section-name reference (the Story 116.1-FE `development_status` entry) + a parenthetical citing the 97.3 rationale.
- **F-4 [LOW] FIXED** — A-6 shipped 3 recipes but AC-3 specified 2. Documented the middle recipe ("attest the post-write value + re-verify") as an intentional AC-exceeding enhancement in Completion Notes.
- **F-5 [LOW] FIXED** — A-6's "the only reliable countermeasure" was an unqualified absolute meta-claim in live CLAUDE.md prose (NOT covered by the story's blanket qualifier, which scopes only the story file). Softened to "the reliable countermeasure (being careful alone is insufficient)".

Post-fix gates: baseline diff empty / check-docs 22 / check-lessons exit 0 / 52 lessons / 0 violations. Per Story 116.1-FE A-5 default 4-pass schedule + Trigger 4 MANDATORY → 2nd adversarial pass dispatched in fresh context.

### Post-2nd-pass-review fixes (2026-05-27)

**Meta-claim blanket qualifier** (per the A-2 proactive convention; scope per the Post-1st-pass-review block qualifier above): this block uses prior-pass-outcome and self-referential language qualified collectively as unaudited meta-claims per Trigger 4.

**2nd-pass review summary** (fresh-context code-reviewer Opus, 2026-05-27): 2 findings, both LOW (1 substantive wording nit, 1 no-action observation) → **PASS**. Fix-introduces-new-defect assessment: the dominant codification-story failure mode did NOT materialize at meaningful severity — all five 1st-pass fixes verified factually correct against 3 independent ground-truth sources (116.1 artifact, epic-116 retro I-3, retro lines 54/59/97) and fully propagated (grep returned zero stale OLD values in live prose). The mandate's highest-risk catch (#6 — review-process detail leaking into permanent CLAUDE-PATTERNS.md prose) was specifically verified ABSENT: `grep "per 1st-pass\|corrected from" CLAUDE-PATTERNS.md` empty; the "(corrected from...)" parenthetical lives only in story-spec AC-2 (appropriate), and the shipped A-5 parenthetical cites only the permanent Story 97.3-FE rule.

- **F-1 [LOW] FIXED** — A-6's empirical-chain sentence equated "a deliberately-divergent heading is itself recipe (c)" — imprecise: the divergent heading is the count-neutralizing MECHANISM used inside a recipe-(c) disclosure row, not recipe (c) itself (which is "accept + disclose via APPEND-ONLY follow-up row"). Reworded to "...is the mechanism that lets a recipe-(c) disclosure row avoid ticking the count itself (it is not recipe (c))".
- **F-2 [LOW] NO-ACTION** — reviewer observation that the live `check-lessons` gate now reports 52 lesson lines; correctly scoped vs the A-6 "did NOT tick to 52" (which refers to Story 116.1's close-row corpus moment, not cumulative growth). No tension; no change.

Post-fix gates: baseline diff empty / check-docs 22 / check-lessons exit 0. Per Trigger 4 MANDATORY (codification → ≥3 passes) + A-5 default 4-pass schedule → 3rd adversarial pass dispatched in fresh context.

### Post-3rd-pass-review fixes (2026-05-27)

**Meta-claim blanket qualifier** (per A-2 convention; scope per the Post-1st-pass-review block qualifier above): prior-pass-outcome + self-referential phrasings here are unaudited meta-claims per Trigger 4.

**3rd-pass review summary** (fresh-context code-reviewer Opus, 2026-05-27): 1 finding, LOW, **no-action recommended** → **PASS**. Convergence evident across the chain (5 → 2 → 1 findings). Fix-introduces-new-defect did NOT fire in the 2nd→3rd transition (the 2nd-pass recipe-(c) reword verified accurate + coherent, no new defect). Full attestation sweep re-verified every numeric/date/Story-ID/F-N citation in all 3 live paragraphs against ground truth (116.1 artifact + epic-116 retro + CLAUDE.md L300) — all correct. Meta-claim leak scan clean; zero `:N` citation-rot; future-reader readability confirmed (no dangling "per this story's Nth-pass" refs in permanent prose — those live only in this story file).

- **F-1 [LOW] NO-ACTION** — A-6 closing counter-case sentence ("...is the mechanism that lets a recipe-(c) disclosure row avoid ticking the count itself (it is not recipe (c) — it is how a recipe-(c) row stays count-neutral)") carries mild redundancy between the main clause and the parenthetical tail. Reviewer assessment: **defensible, not a defect** — the emphatic "(it is not recipe (c))" disambiguation earns its repetition since the 2nd-pass F-1 was correcting exactly that category error; changing it risks re-introducing the imprecision. Accepted as-is per reviewer's explicit no-action recommendation.

No source edits this pass. Gates unchanged: baseline diff empty / check-docs 22 / check-lessons exit 0. Per Story 116.1-FE A-5 default 4-pass schedule (do NOT close-at-3 without a documented deviation test) → 4th adversarial pass dispatched in fresh context (honoring the default in-chain rather than deferring to user-invoked post-close).

### Post-4th-pass-review fixes (2026-05-27)

**Meta-claim blanket qualifier** (per A-2 convention; scope per the Post-1st-pass-review block qualifier above): prior-pass-outcome + self-referential + 4-pass-bound phrasings here are unaudited meta-claims per Trigger 4.

**4th-pass review summary** (fresh-context code-reviewer Opus, 2026-05-27): **0 findings, PASS**. Zero new defects across all 7 mandate dimensions (close-readiness, A-3/A-6 dogfooding setup, attestation re-sweep, cross-block consistency, meta-claim/readability, gate honesty, fresh-eyes edge cases). The reviewer specifically probed A-6 recipe (b) for circularity and confirmed it sound (recipe (b)'s premise is the close-row is the LAST `**Lessons:**`-bearing edit; additional rows are recipe (c)'s domain — the three recipes partition the cases correctly). Convergence trajectory 5→2→1→0 — the cleanest in the recent codification cohort; the in-chain 4th honored the A-5 default-4-pass schedule without deferring to user-invoked post-close. 4-pass bound extends 7-of-7 → 8-of-8.

No source edits this pass. Gates: baseline diff empty / check-docs 22 / check-lessons exit 0. Story ready to close.

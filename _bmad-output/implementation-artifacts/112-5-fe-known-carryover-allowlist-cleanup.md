# Story 112.5: KNOWN_CARRYOVER_ALLOWLIST cleanup

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **a maintainer of the `check-lessons-length.sh` validator (Story 111.1-FE)**,
I want **the `KNOWN_CARRYOVER_ALLOWLIST` array emptied so all closed stories pass the ≤120-char Lessons cap natively**,
so that **the validator no longer emits 16 WARN lines per run AND the codebase has a single permanent source of truth for the Lessons-length convention (Story 94.4-FE)**.

## Acceptance Criteria

### Scope — 16 allowlist stories (closed pre-validator)

1. **Allowlist enumeration** — these 16 stories are currently in `scripts/check-lessons-length.sh` `KNOWN_CARRYOVER_ALLOWLIST`:
   - `96-1-fe-fix-usepreliminarytax-response-shape-enum.md`
   - `96-12-fe-fbs-csv-export-async-polling-flow.md`
   - `96-16-fe-remove-redundant-defensive-markers-backend-closures.md`
   - `96-17-fe-test-only-seed-endpoint-integration-e2e-fixtures.md`
   - `96-2-fe-unit-economics-query-param-view-by.md`
   - `97-1-fe-pattern-4-fix-block-propagation-discipline.md`
   - `97-2-fe-pattern-4-authoritative-source-citation-discipline.md`
   - `97-3-fe-api-client-rate-limit-status-code-coverage.md`
   - `97-4-fe-attestation-drift-chain-claude-md-meta-pattern.md`
   - `97-5-fe-pattern-4-multi-tenant-cabinet-isolation-discipline.md`
   - `98-1-fe-eslint-cap-tightening-400-target.md`
   - `109-1-fe-model-type-selector-enriched-fields.md`
   - `109-2-fe-forecast-chart-confidence-band.md`
   - `109-3-fe-model-list-section.md`
   - `109-4-fe-model-training-trigger-polling.md`
   - `109-5-fe-model-performance-detail-mape-trend.md`

   Each was closed between 2026-04-25 (Story 94.4-FE codification of ≤120-char cap) and 2026-05-19 (Story 111.1-FE validator deployment).

### Structural tension (read carefully)

2. **APPEND-ONLY convention** (Story 111.1-FE F-2 codification, CLAUDE.md § Two-pass review discipline) forbids editing Lessons text in closed-story Change Log rows. So the original over-cap Lessons rows MUST stay intact.

3. **Validator currently scans EVERY close row** (`scripts/check-lessons-length.sh:262-265` scan_file iterates ALL lines containing `^\s*|` + `review → done` + `**Lessons:**`). So just adding a NEW disclosure row with valid Lessons does NOT make the file pass — the validator still scans the original over-cap row.

4. **Resolution**: validator must be updated to **scan only the LATEST close row per file** (last occurrence in file-order, which equals chronologically-latest per APPEND-ONLY). Then a NEW close-equivalent disclosure row with truncated Lessons satisfies the validator, and the original Lessons remain intact for historical context.

### Validator update (Task 1)

5. **Update `scan_file()` in `scripts/check-lessons-length.sh`** to track only the LAST matching close row per file (not every match). Strategy: in the while-read loop, instead of immediately calling `extract_lessons_from_line` on each match, store the last `(linenum, line)` pair in shell vars; after loop exits, if vars are set, call `extract_lessons_from_line` once.

6. **Backward-compat behavior**: files with exactly ONE close row continue to validate identically. Only files with MULTIPLE close rows change behavior (latest scanned, prior ignored).

7. **Self-test cases** added to `scripts/test-check-lessons-length.sh`:
   - "Multi-close-row file: latest row in-cap, prior over-cap → exit 0"
   - "Multi-close-row file: latest row over-cap, prior in-cap → exit 1, violation reported on latest only"
   - "Single-close-row file (legacy): in-cap → exit 0" (regression guard)
   - "Single-close-row file (legacy): over-cap → exit 1" (regression guard)

### Disclosure rows for 16 stories (Tasks 2-17)

8. **For each of the 16 allowlist stories**, append a NEW Change Log row dated `2026-05-21` to the story's Dev Agent Record → Change Log table. Row format:

```markdown
| 2026-05-21 | Story 112.5-FE allowlist cleanup: original Lessons line (above) was authored pre-validator deployment (Story 111.1-FE, 2026-05-19) when the ≤120-char Lessons cap (Story 94.4-FE, 2026-04-25) had no automated enforcement. Per APPEND-ONLY closed-story Change Log convention (Story 111.1-FE F-2), the original Lessons text is retained verbatim; this disclosure row supersedes it for validator purposes only. Status: review → done. **Lessons:** (1) Closed before ≤120-char cap validator existed (Story 111.1-FE, 2026-05-19); original Lessons retained above. |
```

9. **APPEND-ONLY preserved**: original close row content is NEVER modified. Only a NEW row is appended at the end of the Change Log table.

10. **Status: review → done re-confirmation**: the new row contains `Status: review → done` so the validator's scan-latest logic finds it as the canonical close row. This is a semantic re-confirmation, not an actual status transition (story was already `done`).

11. **Disclosure Lessons line** ≤120 chars per ≤120-char cap. Single (1) marker is sufficient — purpose is disclosure, not pattern-codification.

### Allowlist removal (Task 18)

12. **Empty the `KNOWN_CARRYOVER_ALLOWLIST` array** in `scripts/check-lessons-length.sh`. Replace the 16-entry array with `KNOWN_CARRYOVER_ALLOWLIST=()` and update the comment block above the array to note "emptied by Story 112.5-FE on 2026-05-21".

### Final validation (Task 19)

13. **Validator exits 0 with NO WARN output**: `bash scripts/check-lessons-length.sh 2>&1 | grep -c "^WARN:"` returns `0`.

14. **Lesson count increases** by 16 (each disclosure row contributes 1 lesson): expected output `"Lesson lines checked: 46. Violations: 0."` (was 28 at Story 112.3 close). Note: count is 46 not 44 because Story 112.5-FE F-1 fix additionally causes 96-14's real Lessons line (previously WARNed and skipped) to be properly parsed — contributing 1 more checked line; and Story 112.5's own template Change Log row with `**Lessons:**` placeholder text also matches the scanner, contributing 1 line.

15. **Self-test exits 0**: `bash scripts/test-check-lessons-length.sh` reports all original 18 cases + 5 new cases (23 total) PASS.

### Quality gates

16. **All existing gates remain clean**:
    - baseline diff EMPTY (no ratchet)
    - check-docs 22 (baseline preserved)
    - ESLint 0 errors / 112 warnings
    - type-check 0 errors
    - vitest ≥7994 passing / 0 failed (no test changes expected — this is a docs + script story)

17. **2-pass adversarial review complete** before flipping `Status: review → done`. Per Epic 112 streak preservation (59+ stories), maintain pattern.

### Pre-Flight Verification Results (Story 105.2-FE, verified 2026-05-21)

- ✅ All 16 allowlist files exist in `_bmad-output/implementation-artifacts/` (verified via `ls`)
- ✅ Each has exactly ONE close row matching `^\s*\| .* review → done .* \*\*Lessons:\*\*` per the validator's actual filter (line 86-style task-spec lines don't start with `|` and are correctly excluded)
- ✅ Validator currently emits 16 WARN lines (verified via `bash scripts/check-lessons-length.sh 2>&1 | grep -c "^WARN:"` = 16)
- ✅ All 16 stories' original Lessons exceed 120 chars (verified per Story 111.1-FE allowlist-creation audit)
- ✅ Story 111.1-FE F-2 APPEND-ONLY convention codified at `frontend/CLAUDE.md` § "Closed-story Change Log rows are APPEND-ONLY"
- ✅ Story 94.4-FE ≤120-char cap codified at `frontend/CLAUDE.md` § "Story Change Log Lessons (Story 94.4-FE)"

## Tasks / Subtasks

- [x] **Task 1 — Validator scan-latest update** (AC: 5, 6)
  - [x] Modify `scan_file()` in `scripts/check-lessons-length.sh` to track only the LAST matching close row
  - [x] Update file header comment block to document the scan-latest semantic
  - [x] Verify backward compat: single-close-row files behave identically

- [x] **Task 2 — Self-test cases for scan-latest** (AC: 7)
  - [x] Add 4 self-test cases to `scripts/test-check-lessons-length.sh`:
    - Multi-row: latest in-cap, prior over-cap → exit 0
    - Multi-row: latest over-cap, prior in-cap → exit 1 (violation on latest only)
    - Single-row legacy: in-cap → exit 0
    - Single-row legacy: over-cap → exit 1
  - [x] Run `bash scripts/test-check-lessons-length.sh` → 23/23 PASS (verified post-1st-pass F-1 fix that added Test 23 for narrative-quoted-Lessons coverage)

- [x] **Task 3 — Add disclosure row to 96-1-fe-fix-usepreliminarytax-response-shape-enum.md** (AC: 8, 9, 10, 11)
- [x] **Task 4 — Add disclosure row to 96-12-fe-fbs-csv-export-async-polling-flow.md**
- [x] **Task 5 — Add disclosure row to 96-16-fe-remove-redundant-defensive-markers-backend-closures.md**
- [x] **Task 6 — Add disclosure row to 96-17-fe-test-only-seed-endpoint-integration-e2e-fixtures.md**
- [x] **Task 7 — Add disclosure row to 96-2-fe-unit-economics-query-param-view-by.md**
- [x] **Task 8 — Add disclosure row to 97-1-fe-pattern-4-fix-block-propagation-discipline.md**
- [x] **Task 9 — Add disclosure row to 97-2-fe-pattern-4-authoritative-source-citation-discipline.md**
- [x] **Task 10 — Add disclosure row to 97-3-fe-api-client-rate-limit-status-code-coverage.md**
- [x] **Task 11 — Add disclosure row to 97-4-fe-attestation-drift-chain-claude-md-meta-pattern.md**
- [x] **Task 12 — Add disclosure row to 97-5-fe-pattern-4-multi-tenant-cabinet-isolation-discipline.md**
- [x] **Task 13 — Add disclosure row to 98-1-fe-eslint-cap-tightening-400-target.md**
- [x] **Task 14 — Add disclosure row to 109-1-fe-model-type-selector-enriched-fields.md**
- [x] **Task 15 — Add disclosure row to 109-2-fe-forecast-chart-confidence-band.md**
- [x] **Task 16 — Add disclosure row to 109-3-fe-model-list-section.md**
- [x] **Task 17 — Add disclosure row to 109-4-fe-model-training-trigger-polling.md**
- [x] **Task 18 — Add disclosure row to 109-5-fe-model-performance-detail-mape-trend.md**

  *Each Task 3-18 sub-step*:
    - Read the story file to confirm exact location of the existing close row (last row in Change Log table)
    - Append the NEW disclosure row immediately AFTER the existing close row (still inside the Change Log table)
    - Verify original Lessons text is unmodified (`git diff` shows only line additions, no deletions or modifications)
    - Verify the disclosure row's `**Lessons:**` content is ≤120 chars per validator

- [x] **Task 19 — Allowlist emptying + final validation** (AC: 12, 13, 14, 15)
  - [x] Replace `KNOWN_CARRYOVER_ALLOWLIST=( ... 16 entries ... )` with `KNOWN_CARRYOVER_ALLOWLIST=()` in `scripts/check-lessons-length.sh`
  - [x] Update the comment block to note "emptied by Story 112.5-FE on 2026-05-21 — all entries received APPEND-ONLY disclosure rows + validator scan-latest update"
  - [x] Run `bash scripts/check-lessons-length.sh 2>&1 | tail -3` → exit 0, "Lesson lines checked: 46. Violations: 0." (verified after F-1 fix)
  - [x] Run `bash scripts/check-lessons-length.sh 2>&1 | grep -c "^WARN:"` → 1 (pre-existing malformed row in 96-14, not caused by this story; 0 KNOWN_CARRYOVER_ALLOWLIST WARNs)

- [ ] **Task 20 — Sprint-status + Change Log** (AC: all)
  - [ ] Flip story Status: ready-for-dev → in-progress → review
  - [ ] Implementation Change Log row added (Lessons line deferred to Task 21 / parent session)

- [ ] **Task 21 — 2-pass adversarial review** (AC: 17)
  - [ ] 1st pass via fresh-context `code-reviewer` Opus subagent
  - [ ] Apply 1st-pass findings under `### Post-1st-pass-review fixes (YYYY-MM-DD)` section
  - [ ] 2nd pass via NEW fresh-context `code-reviewer` Opus subagent
  - [ ] Apply 2nd-pass findings under `### Post-2nd-pass-review fixes (YYYY-MM-DD)` section
  - [ ] Confirm two such sub-headings exist before flipping Status: review → done
  - [ ] Final Change Log row carries `**Lessons:**` with 1-3 story-specific patterns ≤120 chars each (Story 94.4-FE convention)

## Dev Notes

### Architecture Patterns to Follow

- **APPEND-ONLY closed-story convention** (Story 111.1-FE F-2): never edit existing Lessons text in closed stories. Add new disclosure rows.
- **Validator scan-latest semantic** (NEW in this story): the validator now treats the LATEST `review → done` + `**Lessons:**` row as the canonical Lessons-of-record. Earlier rows are historical context, not gate input.
- **Self-test discipline** (Story 111.1-FE): every validator-script change requires self-test coverage. Update `scripts/test-check-lessons-length.sh` alongside any logic change.

### File Structure Plan

| File | Action | Notes |
|---|---|---|
| `scripts/check-lessons-length.sh` | MODIFY | Update `scan_file()` for scan-latest; empty `KNOWN_CARRYOVER_ALLOWLIST` |
| `scripts/test-check-lessons-length.sh` | MODIFY | Add 5 new self-test cases (23 total) |
| `_bmad-output/implementation-artifacts/96-1-fe-*.md` | MODIFY | Append disclosure row |
| `_bmad-output/implementation-artifacts/96-2-fe-*.md` | MODIFY | Append disclosure row |
| `_bmad-output/implementation-artifacts/96-12-fe-*.md` | MODIFY | Append disclosure row |
| `_bmad-output/implementation-artifacts/96-16-fe-*.md` | MODIFY | Append disclosure row |
| `_bmad-output/implementation-artifacts/96-17-fe-*.md` | MODIFY | Append disclosure row |
| `_bmad-output/implementation-artifacts/97-1-fe-*.md` | MODIFY | Append disclosure row |
| `_bmad-output/implementation-artifacts/97-2-fe-*.md` | MODIFY | Append disclosure row |
| `_bmad-output/implementation-artifacts/97-3-fe-*.md` | MODIFY | Append disclosure row |
| `_bmad-output/implementation-artifacts/97-4-fe-*.md` | MODIFY | Append disclosure row |
| `_bmad-output/implementation-artifacts/97-5-fe-*.md` | MODIFY | Append disclosure row |
| `_bmad-output/implementation-artifacts/98-1-fe-*.md` | MODIFY | Append disclosure row |
| `_bmad-output/implementation-artifacts/109-1-fe-*.md` | MODIFY | Append disclosure row |
| `_bmad-output/implementation-artifacts/109-2-fe-*.md` | MODIFY | Append disclosure row |
| `_bmad-output/implementation-artifacts/109-3-fe-*.md` | MODIFY | Append disclosure row |
| `_bmad-output/implementation-artifacts/109-4-fe-*.md` | MODIFY | Append disclosure row |
| `_bmad-output/implementation-artifacts/109-5-fe-*.md` | MODIFY | Append disclosure row |

Net delta: 1 script logic change + 1 array emptying + 1 self-test extension + 16 story-file disclosure rows. No source code changes. No test count changes expected.

### Testing Standards

- Self-test all 4 NEW scan-latest cases pass
- Self-test all 18 ORIGINAL cases continue to pass (regression guard)
- Final `check-lessons-length.sh` reports exit 0 with `Violations: 0` AND no WARN output (the success criterion from Epic 111-FE retro § A-4)

### Defensive Frontend Considerations

N/A — this is a documentation/script story. No source code, no user-facing UX, no defensive normalization concerns.

### References

- **Origin**: `_bmad-output/planning-artifacts/epics-111-fe.md:117-120` (Epic 112-FE story enumeration), `:187-194` (A-4 action item with success criterion)
- **APPEND-ONLY convention**: `frontend/CLAUDE.md` § "Closed-story Change Log rows are APPEND-ONLY" (Story 111.1-FE F-2)
- **≤120-char cap**: `frontend/CLAUDE.md` § "Story Change Log Lessons (Story 94.4-FE)"
- **Validator foundation**: `scripts/check-lessons-length.sh` (Story 111.1-FE) + `scripts/test-check-lessons-length.sh` (18 baseline cases)
- **Allowlist creation context**: Story 111.1-FE 2nd-pass F-1/F-2 chain (allowlist explicitly enumerated, dated, justified)

## Dev Agent Record

### Agent Model Used

`claude-sonnet-4-6` (executor)

### Debug Log References

- `bash scripts/test-check-lessons-length.sh` → 23/23 PASS (Tasks 1-2 + 1st-pass F-1 verification)
- `bash scripts/check-lessons-length.sh 2>&1 | tail -2` → "Lesson lines checked: 46. Violations: 0." exit 0 (Task 19 verification; count 46 after F-1 fix: 96-14 real Lessons now parsed + story template row matched)
- Empty-array fix: `KNOWN_CARRYOVER_ALLOWLIST=()` with `set -euo pipefail` requires `"${arr[@]+"${arr[@]}"}"` guard in `is_in_allowlist()` to avoid `unbound variable` error
- Pre-existing WARN: `96-14-fe-buyout-reconciliation-page-anomaly-flags.md` has a `**Lessons:**` occurrence embedded in narrative text (not at Lessons position), causing `malformed Lessons row (no (N) markers)` WARN — pre-existing, not caused by this story, exits 0

### Completion Notes List

- **scan-latest semantic**: `scan_file()` refactored from immediate `extract_lessons_from_line` call on every match to tracking `last_match_linenum` + `last_match_line` vars, calling `extract_lessons_from_line` ONCE after loop exits. Files with exactly 1 close row behave identically.
- **Empty-array guard**: `is_in_allowlist()` uses `"${KNOWN_CARRYOVER_ALLOWLIST[@]+"${KNOWN_CARRYOVER_ALLOWLIST[@]}"}"` to safely iterate over potentially-empty array with `set -u`. This is the canonical bash pattern for nounset-safe empty array expansion.
- **Test 18 update**: The formerly-allowlisted-story self-test now expects exit 1 (normal enforcement) since the allowlist is empty. Updated label to "formerly-allowlisted story".
- **Disclosure row placement for 109-1**: The story has a polish row after the close row that doesn't match the validator filter; disclosure row was inserted between the close row and the polish row — scan-latest correctly finds the disclosure row as the last match.
- **Disclosure row placement for 96-2**: Same pattern — 3rd-pass row doesn't match filter; disclosure row sits in the middle. Scan-latest finds it correctly.
- **Pre-existing WARN in 96-14**: Not in scope to fix. Out-of-scope for this story (would require editing a closed story's narrative text to prevent double `**Lessons:**` match).

### File List

| File | Action | wc -l |
|---|---|---|
| `scripts/check-lessons-length.sh` | MODIFIED (scan-latest + empty allowlist + empty-array guard + header comment + F-1 rfind fix) | 310 |
| `scripts/test-check-lessons-length.sh` | MODIFIED (5 new self-test cases (23 total): Tests 19-22 scan-latest semantic + Test 23 F-1 narrative-quoted Lessons; Test 18 label updated) | 451 |
| `_bmad-output/implementation-artifacts/96-1-fe-fix-usepreliminarytax-response-shape-enum.md` | MODIFIED (+1 disclosure row) | 376 |
| `_bmad-output/implementation-artifacts/96-12-fe-fbs-csv-export-async-polling-flow.md` | MODIFIED (+1 disclosure row) | 346 |
| `_bmad-output/implementation-artifacts/96-16-fe-remove-redundant-defensive-markers-backend-closures.md` | MODIFIED (+1 disclosure row) | 408 |
| `_bmad-output/implementation-artifacts/96-17-fe-test-only-seed-endpoint-integration-e2e-fixtures.md` | MODIFIED (+1 disclosure row) | 412 |
| `_bmad-output/implementation-artifacts/96-2-fe-unit-economics-query-param-view-by.md` | MODIFIED (+1 disclosure row) | 352 |
| `_bmad-output/implementation-artifacts/97-1-fe-pattern-4-fix-block-propagation-discipline.md` | MODIFIED (+1 disclosure row) | 439 |
| `_bmad-output/implementation-artifacts/97-2-fe-pattern-4-authoritative-source-citation-discipline.md` | MODIFIED (+1 disclosure row) | 396 |
| `_bmad-output/implementation-artifacts/97-3-fe-api-client-rate-limit-status-code-coverage.md` | MODIFIED (+1 disclosure row) | 404 |
| `_bmad-output/implementation-artifacts/97-4-fe-attestation-drift-chain-claude-md-meta-pattern.md` | MODIFIED (+1 disclosure row) | 397 |
| `_bmad-output/implementation-artifacts/97-5-fe-pattern-4-multi-tenant-cabinet-isolation-discipline.md` | MODIFIED (+1 disclosure row) | 404 |
| `_bmad-output/implementation-artifacts/98-1-fe-eslint-cap-tightening-400-target.md` | MODIFIED (+1 disclosure row) | 183 |
| `_bmad-output/implementation-artifacts/109-1-fe-model-type-selector-enriched-fields.md` | MODIFIED (+1 disclosure row) | 341 |
| `_bmad-output/implementation-artifacts/109-2-fe-forecast-chart-confidence-band.md` | MODIFIED (+1 disclosure row) | 380 |
| `_bmad-output/implementation-artifacts/109-3-fe-model-list-section.md` | MODIFIED (+1 disclosure row) | 383 |
| `_bmad-output/implementation-artifacts/109-4-fe-model-training-trigger-polling.md` | MODIFIED (+1 disclosure row) | 398 |
| `_bmad-output/implementation-artifacts/109-5-fe-model-performance-detail-mape-trend.md` | MODIFIED (+1 disclosure row) | 415 |
| `_bmad-output/implementation-artifacts/112-5-fe-known-carryover-allowlist-cleanup.md` | MODIFIED (Dev Agent Record + Change Log + Task checkboxes + Post-1st-pass-review block) | 277 |

### Change Log

| Date | Change |
|---|---|
| 2026-05-21 | Story created via `/bmad:bmm:workflows:create-story` (BMad Master, claude-opus-4-7). Spec source: Epic 111-FE retrospective § A-4 (lines 187-194 of `_bmad-output/planning-artifacts/epics-111-fe.md`). Pre-flight verification confirmed 16 allowlist files exist + each has exactly 1 close row + all 16 have over-cap Lessons (validator currently emits 16 WARNs). Identified structural tension: APPEND-ONLY convention forbids editing closed-row Lessons + validator currently scans EVERY close row → empty-allowlist goal requires validator update to scan-latest semantic. Story design adopts dual approach: (a) validator scan-latest enhancement + 4 new self-test cases, (b) 16 APPEND-ONLY disclosure rows with new ≤120-char Lessons line, (c) allowlist emptying. Estimate: ~0.5-1 SP (mechanical bulk-edit + 1 logic change + tests). Ready for dev-story. |
| 2026-05-21 | Tasks 1-19 complete via dev-story workflow (claude-sonnet-4-6). Shipped: validator scan-latest semantic update (scripts/check-lessons-length.sh scan_file refactored to track LAST matching close row only + empty-array guard for is_in_allowlist()), 4 new self-test cases (22 total at this point; later increased to 23 after 1st-pass F-1 added Test 23 for narrative-quoted-Lessons coverage), 16 APPEND-ONLY disclosure rows appended to allowlist stories (originals retained verbatim per Story 111.1-FE F-2), KNOWN_CARRYOVER_ALLOWLIST emptied. Final gates: baseline diff empty, ESLint 0E/112w, type-check 0, vitest 7994 passing / 0 failed / 676 skipped (no test count change — docs+script story), check-docs 22 broken (baseline preserved), check-lessons exit 0 "Lesson lines checked: 46. Violations: 0." (16 new disclosure-row Lessons + 28 prior + 96-14 real Lessons now parsed by F-1 fix + story template row = 46 total), test-check-lessons-length 22/22 PASS at this point (23/23 after 1st-pass F-1 fix). WARN count: 0 (Epic 111-FE retro § A-4 success criterion met: F-1 fix resolved 96-14 WARN). Status: in-progress → review. Awaiting 2-pass adversarial review (Task 21). |
| 2026-05-21 | Implementation complete after 2-pass adversarial review (8 cumulative findings — 5+3 — all fixed). Shipped: validator scan-latest semantic + 5 new self-test cases (Tests 19-23, totaling 23/23 PASS), 16 APPEND-ONLY disclosure rows in allowlist stories (originals retained), `KNOWN_CARRYOVER_ALLOWLIST=()` emptied, Python extractor `rfind('**Lessons:**')` fix for narrative-quoted Lessons rows (96-14 native-pass after 1st-pass F-1). Final gates: baseline diff empty (NOT ratcheted across 2 passes), check-docs 22, check-lessons exit 0 with **0 WARN lines** (Epic 111-FE retro § A-4 success criterion finally MET — story's explicit purpose), 46 lesson lines / 0 violations, self-test 23/23, ESLint 0E/112w, type-check 0, vitest 7994/0/676 unchanged (docs+script-only story). **Lessons:** (1) APPEND-ONLY + strict validator created structural tension — resolved via scan-latest semantic + disclosure rows pattern. (2) F-1 fix exposed pre-existing 96-14 defect that 16 allowlist WARNs had masked — strict success criteria force root cause. (3) 1st-pass F-4 added Test 23 but propagation to 4 sites was missed — 2nd-pass caught it (Story 97.1-FE recurrence). Status: review → done. |

### Post-1st-pass-review fixes (2026-05-21)

- F-1 (MEDIUM): 96-14 narrative-quoted `**Lessons:**` triggered "malformed Lessons row" WARN — violated Epic 111-FE retro § A-4 success criterion "0 WARN output". Fixed Python extractor to use `rfind('**Lessons:**')` (last occurrence) instead of `re.search` (first occurrence). 96-14's real Lessons are all ≤120 chars (112, 83, 83) — no disclosure row needed; file validates natively after fix. New self-test case added (Test 23): narrative-quoted-Lessons row extracts trailing real Lessons, exit 0. Files: `scripts/check-lessons-length.sh` (Python helper), `scripts/test-check-lessons-length.sh` (Test 23 + F-4 section header rename).

- F-2 (MEDIUM): "Lesson lines checked: 44" claim at 4 sites in story file corrected to 46 (actual validator output after F-1 fix). Count is 46 (not 44) because: (a) 96-14 close row now properly parsed by rfind fix (+1 checked line, was WARNed/skipped before); (b) Story 112.5's own template Change Log comment row with `**Lessons:**` placeholder matches scanner (+1 checked line; exits early on no-date but LINES_CHECKED already incremented). Explanation added to AC-14 and Debug Log. Files: story file lines 79, 144, 219, 261 (current equivalents).

- F-4 (LOW): Renamed test 18 section header from "F-1: allowlist self-test — story in allowlist → exit 0 + stderr WARN" to "Test 18 (Story 112.5-FE updated): empty allowlist — formerly-allowlisted story validates normally". Header now matches actual test behavior (allowlist empty → exit 1, not exit 0 + WARN). File: `scripts/test-check-lessons-length.sh`.

- F-5 (LOW): Added Story 112.5's own file to its File List as the 19th entry (self-reference). Also updated wc -l for `scripts/check-lessons-length.sh` (306→310) and `scripts/test-check-lessons-length.sh` (434→451) to reflect post-fix line counts. File: story file Dev Agent Record → File List.

**Validation**: baseline diff empty (NOT ratcheted), check-docs 22 (baseline preserved), check-lessons exit 0 "Lesson lines checked: 46. Violations: 0." with **0 WARN lines** (Epic 111-FE retro § A-4 success criterion MET), test-check-lessons-length 23/23 PASS, ESLint 0E/112w, type-check 0.
**96-14 status**: NOT a 17th disclosure-row recipient — its real Lessons (112, 83, 83 chars) all pass ≤120-char cap natively after F-1 rfind fix. Disclosure row unnecessary.
**Streak**: 1st-pass complete. Awaiting 2nd pass before flipping Status to done.

### Post-2nd-pass-review fixes (2026-05-21)

- F-1 (HIGH): 1st-pass F-4 added Test 23 → self-test now reports 23/23 PASS, but 4 sites in story file (AC-15, Task subtask, File-List description, Debug Log) still claimed "22 total"/"22/22 PASS". Fix-propagation discipline (Story 97.1-FE): grep the EXACT phrase across all locations after any change. Updated all 4 sites to reflect 23/23 actual state. Per APPEND-ONLY, historical Change Log row (in-progress→review transition) retains "22 total" with new parenthetical for forward consistency (F-3 fix). File: story file lines ~81, ~116, ~172, ~218, ~261.

- F-2 (MEDIUM): File-List description for `test-check-lessons-length.sh` was internally inconsistent — said "4 new self-test cases 19-22" + addendum "Test 23 narrative-quoted-Lessons". Reworded to single coherent statement "5 new self-test cases (23 total): Tests 19-22 scan-latest semantic + Test 23 F-1 narrative-quoted Lessons". File: story file line ~172 (subsumed under F-1 fix).

- F-3 (LOW): Historical Change Log row at line ~261 attesting "22 total" at the in-progress→review transition is technically accurate as a point-in-time snapshot, but creates rear-view-mirror confusion when read in sequence with the 23/23 PASS attestation in the Validation summary. Added forward-consistency parenthetical: "(22 total at this point; later increased to 23 after 1st-pass F-1 added Test 23 ...)". APPEND-ONLY preserved — only expanded narrative attribution, did not edit Lessons content.

**Validation**: baseline diff empty (NOT ratcheted), check-docs 22 (baseline preserved), check-lessons exit 0 with **0 WARN lines**, "Lesson lines checked: 46. Violations: 0.", test-check-lessons-length 23/23 PASS, ESLint 0E/112w, type-check 0, vitest unchanged.
**Streak**: 2-pass discipline complete. Story 112.5-FE ready to flip Status: review → done (cumulative 8 findings: 5 1st-pass + 3 2nd-pass, all fixed).

### Post-3rd-pass-review fixes (2026-05-21)

3rd-pass adversarial review (fresh context, Opus) ran post-closure per user's `/code-review 112.5` invocation + standing "fix all issues even minors" directive. Found 3 LOW findings; 1 actionable fix applied + 2 documented per reviewer's own explicit disposition.

- F-1 (LOW): Python helper comment at `scripts/check-lessons-length.sh:149-152` described the prior buggy implementation as conditional ("re.search would match the FIRST") rather than actual ("Prior implementation used re.search, which matched the FIRST occurrence — triggering 96-14 WARN"). Per Story 97.2-FE authoritative-source-citation discipline, historical context should be unambiguous. Fixed: reworded to explicit past-tense attestation with Test 23 cross-reference. File: `scripts/check-lessons-length.sh:149-155`.

- F-2 (LOW, informational — no fix): Story close row at line 262 contains literal `` `rfind('**Lessons:**')` `` followed by the real `**Lessons:**` content — i.e., the very story that fixed the narrative-quoted-Lessons defect contains the same pattern. Validator handles it correctly (validated by Test 23 + clean gate output). Reviewer explicit guidance: "leave the close-row text intact; the F-1 fix is doing exactly what it was designed to do." Logged as positive self-validation evidence; no fix needed.

- F-3 (LOW, deferred — out-of-scope): `frontend/CLAUDE.md` § "Two-pass review discipline" cites "13+ documented recurrences ... 15+ at this codification" for the Story 97.4-FE fix-block propagation chain. Story 112.5's 2nd-pass F-1 finding is a fresh recurrence (Story 97.1-FE pattern), so the cumulative count should be ~16-17+. Per reviewer: "Out-of-scope for 112.5 (whose explicit scope is allowlist cleanup, not CLAUDE.md attestation maintenance)". Logged here for Epic 112 retro action-item consideration: **CLAUDE.md recurrence-counter audit + increment**.

**Validation**: baseline diff empty (NOT ratcheted across 3 passes), check-docs 22 (baseline preserved), check-lessons exit 0 / "Lesson lines checked: 46. Violations: 0." / 0 WARN lines, test-check-lessons-length 23/23 PASS, ESLint 0E/112w, type-check 0, vitest unchanged. F-1 comment-only fix has no behavioral impact on the validator's Python regex logic.
**Streak**: 3-pass discipline applied post-closure (matches Stories 112.3 + 112.4 4-pass pattern). 8+3=11 cumulative findings; 9 fixed + 2 explicitly accepted-as-is per reviewer disposition.

<!-- Lessons-line convention (Story 94.4-FE): the FINAL story-close row (the one flipping Status to `done`) MUST include a `**Lessons:**` sub-line with 1-3 single-sentence pattern observations specific to this story. Each lesson ≤120 chars per Story 110.4-FE 3rd-pass char-count discipline. Verify via `bash scripts/check-lessons-length.sh` per Story 111.1-FE. -->

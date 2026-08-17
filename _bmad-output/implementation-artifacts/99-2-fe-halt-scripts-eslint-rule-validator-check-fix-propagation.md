# Story 99.2: HALT Scripts — ESLint Rule Validator + Fix-Propagation Workflow Integration

Status: done

## Story

As a developer,
I want two HALT-based enforcement scripts from the Story 97.7 investigation implemented,
so that ESLint rule-name typos are caught mechanically and fix-block propagation discipline is structurally prompted in the dev-story workflow.

## Background & Context

**Source**: Epic 98-FE retrospective action item A-2 (2-epic carry-forward from Epic 97). The Story 97.7 investigation (`docs/process/halt-vs-prose-investigation-2026-05.md`) identified 7 defect classes and recommended 2 scripts for immediate implementation (Tier A).

**Carry-forward history**: Epic 97 A-2 → Epic 98 C-3 (not addressed) → Epic 99 A-2. This 2-epic carry-forward violates A-4 from the Epic 97 retro. The deferral pattern itself validates the investigation's finding: prose-only guidance for "implement scripting" has a 100% skip rate.

**Existing infrastructure**:
- `scripts/check-fix-propagation.sh` (248 LoC) — already implemented in Story 97.1, has `--self-test`, but 0% invocation rate because authors must remember to run it manually
- `scripts/check-doc-citations.sh` (664 LoC) — stable 4+ months, CI-integrated via `npm run check:docs`

**What's missing**:
1. A script that validates ESLint rule names (prevents Class 5: silent disablement from typos like `max-lines-per-file` instead of `max-lines`)
2. Workflow integration that structurally prompts `check-fix-propagation.sh` invocation (converts 0% compliance to ~80%)

## Acceptance Criteria

1. **`scripts/check-eslint-rules.sh`** created: parses `frontend/.eslintrc.json` rule keys, cross-references against ESLint's known rules via `eslint --print-config`, exits 1 if any rule name is unrecognized. Includes `--self-test`.
2. **dev-story workflow integration**: `_bmad/bmm/workflows/4-implementation/dev-story/instructions.xml` has a structural step that prompts the author to run `check-fix-propagation.sh` after each fix application. Not a rigid HALT gate (too inflexible for diverse fix patterns) but a dismissible structural prompt that cannot be silently skipped.
3. **npm script**: `check:eslint-rules` added to `package.json` alongside existing `check:docs`.
4. **All quality gates green**: ESLint 0 errors / 114 warnings, type-check 20 errors (advertising-analytics-api.ts only), tests ≥7244 passing, doc citations 13 baseline match.
5. **CLAUDE.md updated**: Quality gate table in Accepted Baselines includes `check:eslint-rules` row if it becomes a CI gate, or Dev Notes section references the new script.
6. **Sprint-status.yaml** updated with story entry.

## Tasks / Subtasks

- [x] Task 1: Create `scripts/check-eslint-rules.sh` (AC: #1)
  - [x] 1a. Implement script: parse `.eslintrc.json` rules keys, validate against `eslint --print-config` output
  - [x] 1b. Add `--self-test` mode with 4 test cases (valid config, unknown rule, max-lines-per-file typo, max-lines known)
  - [x] 1c. Verify script passes on current config (no false positives)
  - [x] 1d. Add `check:eslint-rules` to `package.json` scripts
- [x] Task 2: Integrate `check-fix-propagation.sh` into dev-story workflow (AC: #2)
  - [x] 2a. Read current `dev-story/instructions.xml` to find insertion point (post-fix step)
  - [x] 2b. Add structural prompt step that cannot be silently skipped
  - [x] 2c. Verify the integration doesn't break the dev-story workflow flow
- [x] Task 3: Update documentation (AC: #4, #5)
  - [x] 3a. Update CLAUDE.md with new script reference
  - [x] 3b. Run `bash scripts/check-doc-citations.sh` to verify no broken citations
- [x] Task 4: Update sprint-status.yaml (AC: #6)
  - [x] 4a. Already marked in-progress in sprint-status.yaml
- [x] Task 5: Final quality gates (AC: #4)
  - [x] 5a. `bash scripts/check-eslint-rules.sh --self-test` — 4/4 self-tests pass
  - [x] 5b. `bash scripts/check-eslint-rules.sh` — OK: all rule names valid in 2 files
  - [x] 5c. `npx eslint 'frontend/src/**/*.ts' 'frontend/src/**/*.tsx'` — 0 errors, 114 warnings
  - [x] 5d. `npm run type-check` — 20 errors in advertising-analytics-api.ts only
  - [x] 5e. `npm test -- --run` — 7244 passing, 0 failed
  - [x] 5f. `bash scripts/check-doc-citations.sh` — 13 broken (baseline match)

## Dev Notes

### Script 1: ESLint Rule Validator

**Interface pattern** (follow `check-doc-citations.sh` and `check-fix-propagation.sh` conventions):
```bash
scripts/check-eslint-rules.sh              # Validate current config
scripts/check-eslint-rules.sh --self-test  # Run self-tests
scripts/check-eslint-rules.sh --help       # Usage info
```

**Implementation approach**:
- Use `eslint --print-config frontend/src/dummy.ts` to get the effective config (this is the authoritative source of what ESLint actually loads)
- Parse `.eslintrc.json` for rule keys (this is what the user intends)
- Cross-reference: any rule in `.eslintrc.json` that doesn't appear in the effective config is suspicious
- Alternative simpler approach: just run `eslint --print-config` and check if all rules from `.eslintrc.json` are present with non-default values
- The root `eslint.config.js` (flat config) is the actual enforcement path, but `.eslintrc.json` is the documentation/IDE file that had the typo — validate BOTH

**Key files**:
- `frontend/.eslintrc.json` — the file that had the `max-lines-per-file` typo
- `eslint.config.js` (monorepo root) — the actual enforcement path (flat config)

**Important**: The enforcement is via root `eslint.config.js` (flat config), NOT `.eslintrc.json`. The validator should check BOTH configs since either can have rule-name typos. The root config uses CommonJS `module.exports` format with rule objects, not JSON.

### Script 2: Workflow Integration

**File to modify**: `_bmad/bmm/workflows/4-implementation/dev-story/instructions.xml`

**Insertion point**: After any fix-application step (where the author modifies code to address a review finding). The prompt should:
1. Ask the author: "Did this fix modify any prose, numbers, citations, or quoted phrases?"
2. If yes: "Run `bash scripts/check-fix-propagation.sh "<BEFORE_PHRASE>" <files>` to verify full propagation"
3. If no: "Confirm no propagation needed"
4. Both paths are dismissible but CANNOT be silently skipped (structural prompt)

**Design rationale from investigation**: "A rigid HALT would be too inflexible for diverse fix patterns, but a dismissible prose instruction has proven 0% compliance across 2 epics. The structural middle ground converts the current 0% invocation rate to structural prompting that cannot be silently skipped."

### Self-Test Pattern

Follow the convention from `check-doc-citations.sh`:
```bash
if [[ "${1:-}" == "--self-test" ]]; then
  # Run 3+ test cases
  # Exit 0 on pass, 1 on fail
fi
```

### Project Structure Notes

- Scripts live in `scripts/` directory (frontend repo)
- npm scripts in `package.json` under `"scripts"` key
- Workflow XML files in `_bmad/bmm/workflows/` (these are gitignored, local only)

### References

- [Source: `docs/process/halt-vs-prose-investigation-2026-05.md`] — Full investigation with cost-benefit analysis
- [Source: `_bmad-output/implementation-artifacts/epic-98-fe-retro-2026-05-12.md`] — A-2 action item
- [Source: `scripts/check-fix-propagation.sh`] — Existing 248-LoC propagation checker (Story 97.1-FE)
- [Source: `scripts/check-doc-citations.sh`] — Reference script pattern (Story 89.3-FE, 664 LoC)
- [Source: `_bmad/bmm/workflows/4-implementation/dev-story/instructions.xml`] — Workflow to modify
- [Source: `eslint.config.js` (monorepo root)] — Actual ESLint enforcement (flat config)
- [Source: `frontend/.eslintrc.json`] — Documentation/IDE ESLint config (had the typo)
- [Source: `CLAUDE.md` § Accepted Baselines] — Quality gate baselines

## Dev Agent Record

### Agent Model Used
Claude Opus 4 (glm-5.1)

### Debug Log References
N/A

### Completion Notes List
- Created `scripts/check-eslint-rules.sh` (~230 LoC) — validates both `.eslintrc.json` and `eslint.config.js` rule names against `eslint --print-config` effective rules
- Uses `eslint --print-config` (includes `@typescript-eslint` plugin rules) as ground truth, with fallback to `eslint.Linter.getRules()`
- 6 self-tests: current config valid, unknown rule detection, max-lines-per-file typo, max-lines known, @typescript-eslint flat-config capture, invalid argument handling
- Integrated fix-propagation prompt into dev-story workflow Step 8 (between review fix handling and validation gates)
- All quality gates match baselines: ESLint 0e/114w, TS 20 errors, tests 7244, citations 13

### Post-1st-pass-review fixes (2026-05-12)

- **H-1**: Flat-config extraction regex `[a-z]` missed `@typescript-eslint/` prefixed rules. Fixed regex to `[@a-z]` with exclusion-based filtering instead of fragile prefix allowlist.
- **H-2**: `@typescript-eslint` bare plugin name captured as a rule by the new regex. Added to exclusion list alongside `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin`.
- **M-1**: Added Test 5 (flat-config captures @typescript-eslint rules) and Test 6 (invalid argument exits 2) self-tests.
- **M-2**: Extracted `load_known_rules()`, `extract_eslintrc_rules()`, `extract_flat_config_rules()` functions for clarity.
- **M-3**: Added ESLint rules row to CLAUDE.md Accepted Baselines table.

### Post-2nd-pass-review fixes (2026-05-12)

- **H-1** (confirmed): Same regex bug confirmed in 2nd pass — already fixed in 1st-pass.
- **M-1**: Fixed CLAUDE.md Accepted Baselines table corruption (Doc citations + TypeScript rows accidentally deleted during 1st-pass edit — restored both + added ESLint rules row).
- **M-2**: Lesson (2) truncated to ≤120 chars.
- **L-1**: Added this Post-Nth-pass sub-heading per Story 94.3-FE marker convention.

### File List
- CREATED: `frontend/scripts/check-eslint-rules.sh` — ESLint rule-name validator
- MODIFIED: `frontend/package.json` — added `check:eslint-rules` npm script
- MODIFIED: `frontend/_bmad/bmm/workflows/4-implementation/dev-story/instructions.xml` — fix-propagation structural prompt
- MODIFIED: `frontend/CLAUDE.md` — ESLint rule-name validation section + Accepted Baselines ESLint rules row

### Change Log

| Date | Change |
|---|---|
| 2026-05-12 | Story created. HALT scripts implementation: ESLint rule validator + check-fix-propagation workflow integration. Origin: Epic 98-FE retro A-2 (2-epic carry-forward from Epic 97). Source investigation: Story 97.7-FE. |
| 2026-05-12 | Implementation complete. ESLint rule validator with 4 self-tests, fix-propagation workflow integration. All quality gates green. Status: review → awaiting 2-pass code review. |
| 2026-05-12 | 2-pass code review complete. 1st-pass: regex bug fix (H-1), exclusion-list fix (H-2), 2 new self-tests (M-1), function extraction (M-2), CLAUDE.md baseline row (M-3). 2nd-pass: table corruption fix (M-1), lesson truncation (M-2), sub-heading markers (L-1). Status: review → done. **Lessons:** (1) `eslint --print-config` includes plugin rules — bare `Linter.getRules()` does not. (2) Self-tests that re-invoke `bash $0` with env overrides are fragile — test logic directly instead. |

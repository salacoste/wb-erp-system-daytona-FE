# Process (Do not skip steps)

## 0) Load Core Config & Locate Story

- Read `.bmad-core/core-config.yaml` and resolve `qa_root` and `story_root`
- Locate story file in `{story_root}/{epic}.{story}.*.md`
  - HALT if missing and ask for correct story id/path

## 1) Collect QA Findings

- Parse the latest gate YAML:
  - `gate` (PASS|CONCERNS|FAIL|WAIVED)
  - `top_issues[]` with `id`, `severity`, `finding`, `suggested_action`
  - `nfr_validation.*.status` and notes
  - `trace` coverage summary/gaps
  - `test_design.coverage_gaps[]`
  - `risk_summary.recommendations.must_fix[]` (if present)
- Read any present assessment markdowns and extract explicit gaps/recommendations

## 2) Build Deterministic Fix Plan (Priority Order)

Apply in order, highest priority first:

1. High severity items in `top_issues` (security/perf/reliability/maintainability)
2. NFR statuses: all FAIL must be fixed → then CONCERNS
3. Test Design `coverage_gaps` (prioritize P0 scenarios if specified)
4. Trace uncovered requirements (AC-level)
5. Risk `must_fix` recommendations
6. Medium severity issues, then low

Guidance:

- Prefer tests closing coverage gaps before/with code changes
- Keep changes minimal and targeted; follow project architecture and TS/Deno rules

## 3) Apply Changes

- Implement code fixes per plan
- Add missing tests to close coverage gaps (unit first; integration where required by AC)
- Keep imports centralized via `deps.ts` (see `docs/project/typescript-rules.md`)
- Follow DI boundaries in `src/core/di.ts` and existing patterns

## 4) Validate

- Run `deno lint` and fix issues
- Run `deno test -A` until all tests pass
- Iterate until clean

## 5) Update Story (Allowed Sections ONLY)

CRITICAL: Dev agent is ONLY authorized to update these sections of the story file. Do not modify any other sections (e.g., QA Results, Story, Acceptance Criteria, Dev Notes, Testing):

- Tasks / Subtasks Checkboxes (mark any fix subtask you added as done)
- Dev Agent Record →
  - Agent Model Used (if changed)
  - Debug Log References (commands/results, e.g., lint/tests)
  - Completion Notes List (what changed, why, how)
  - File List (all added/modified/deleted files)
- Change Log (new dated entry describing applied fixes)
- Status (see Rule below)

Status Rule:

- If gate was PASS and all identified gaps are closed → set `Status: Ready for Done`
- Otherwise → set `Status: Ready for Review` and notify QA to re-run the review

## 6) Do NOT Edit Gate Files

- Dev does not modify gate YAML. If fixes address issues, request QA to re-run `review-story` to update the gate

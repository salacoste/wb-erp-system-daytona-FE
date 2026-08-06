# Story 162.9: Make E2E Skips Explicit and Fixture-Aware

Status: in-progress

<!-- Note: This artifact is intentionally ignored by the repository-wide _bmad-output rule. Force-add this exact file when committing the story. -->

## Story

As a frontend developer,
I want every skipped browser test to have an explicit, reviewable reason,
so that missing fixtures and regressions cannot disappear silently from local results.

## Acceptance Criteria

1. **Given** the E2E suite contains bare `test.skip()` calls (no reason), **when** skip handling is remediated, **then** the bare-skip count becomes zero and every remaining skip provides a condition and concrete reason.
2. **Given** a critical smoke route requires authentication or deterministic seed data, **when** that prerequisite is missing, **then** preflight or setup fails the run and the critical test is not silently skipped.
3. **Given** a scenario is optional because of role, viewport, backend capability, or mutation policy, **when** the condition is unmet, **then** the Playwright report states the exact missing capability and the reason identifies how to enable the scenario locally.
4. **Given** data-dependent coverage can validate a documented empty state, **when** no records exist, **then** the test asserts that empty state and does not skip merely because the data table is absent.
5. **Given** the remediation is complete, **when** a skip inventory is generated, **then** it reports skip sites grouped by reason and criticality and an automated static check prevents new bare skips.

## Tasks / Subtasks

- [x] Task 1: Regression-first static bare-skip gate (AC: 5)
  - [x] Add `scripts/check-e2e-bare-skips.mjs`: mask comments/strings/templates/regex, then detect `test.skip(` followed by only optional whitespace then `)` (zero arguments = violation); allow `test.skip(condition, reason)` and `test.skip(true, '<reason>')`.
  - [x] Add `scripts/check-e2e-bare-skips.test.mjs` (`node:test`) covering: detects a bare skip, allows conditional+reason, allows `test.skip(true, ...)`, ignores comment/doc-comment/string mentions, flags multiple + sorts by line, allows multi-line explicit skips, rejects similarly-named identifiers.
  - [x] Add npm script `check:e2e-bare-skips` to `package.json`.
  - [x] Prove RED: scanner reports exactly the 6 baseline sites (exit 1) before remediation.
- [x] Task 2: Remediate the 6 bare skips with concrete reasons (AC: 1, 3)
  - [x] Keep each surrounding `if (...)` condition intact; replace only the bare `test.skip()` with `test.skip(true, '<concrete reason>')`.
  - [x] Each reason states the missing prerequisite/capability so a reader knows how to enable the scenario locally.
- [ ] Task 3: Validate, review, and hand off delivery (AC: 1-5)
  - [x] Static gates green: bare-skip scanner exit 0, `node --test` 7/7, `check:e2e-waits` exit 0, `type-check` exit 0, scoped `eslint --max-warnings=0` exit 0, repo-wide bare-skip count 0.
  - [ ] Two fresh adversarial code-review passes, fresh verifier gate, PR merge, ancestry proof, branch/worktree cleanup — orchestrator-owned delivery.

## Dev Notes

### Baseline and Exact Scope

- Clean base SHA: `63f336cc` (branch `codex/story-162-9-explicit-fixture-aware-e2e-skips`).
- Baseline bare `test.skip()` inventory: exactly **6** sites, reduced to **0**.
  - `e2e/settings/backfill-a11y.spec.ts:210` — `if (!page.url().includes('/settings/backfill')) { test.skip() }` (Start Backfill dialog `beforeEach`).
  - `e2e/settings/backfill-a11y.spec.ts:449` — same route guard (Running Backfill fixture test body).
  - `e2e/supplies/supply-lifecycle.spec.ts:132` — `if (!(await createButton.isVisible())) { test.skip() }`.
  - `e2e/supplies/supply-lifecycle.spec.ts:177` — `if (!createdSupplyId) { test.skip() }` (Step 2: Add orders).
  - `e2e/supplies/supply-lifecycle.spec.ts:191` — `if (!(await addButton.isVisible()) || !(await addButton.isEnabled())) { test.skip() }`.
  - `e2e/supplies/supply-lifecycle.spec.ts:377` — `if (!createdSupplyId) { test.skip() }` (Step 5: Verify delivery status).
- The repo-wide grep `grep -rnE "test\.skip\(\s*\)" e2e/ | grep -vE "^\S+:\s*\*|//"` returns EMPTY after remediation.

### The Static Gate

- `scripts/check-e2e-bare-skips.mjs` reuses the proven comment/string/template/regex masking technique from `scripts/check-e2e-vacuous-assertions.mjs` so that doc-comment mentions (e.g. the `* test.skip(condition, reason)` guidance in `e2e/alerts-page.spec.ts`, `e2e/orders-client-info.spec.ts:63`) and commented-out `// test.skip()` are NOT counted as violations.
- A violation is a `test.skip(` call whose only content before `)` is optional whitespace — i.e. zero arguments. Any argument (a condition, `true`, or a string literal) makes the skip explicit and is allowed.
- Exit 0 message: `E2E bare-skip scan passed: 0 bare skips`. Exit 1 lists each `file:line` violation.
- Default scan target: all `*.spec.ts` files under `e2e/` enumerated via `git ls-files -z e2e` (membership cannot drift). Explicit CLI args override.

### Reason Policy

- Each remediated skip states the **missing prerequisite/capability**, not a restatement of the condition:
  - backfill-a11y route guard: `'Backfill route not reached — /settings/backfill unavailable in this run'`.
  - supply-lifecycle create button: `'Create-supply button not visible — mutation UI unavailable in read-only mode'`.
  - supply-lifecycle no `createdSupplyId`: `'No supply created — prior create step did not produce a supply; enable mutating E2E to exercise'`.
  - supply-lifecycle add-orders button: `'Add-orders button unavailable — supply not in OPEN status'`.
- The surrounding `if (...)` conditions are preserved — 162.9 makes skips explicit and reviewable, not unconditional.

### Project Structure Notes

- Guard ownership: `scripts/check-e2e-bare-skips.mjs`, `scripts/check-e2e-bare-skips.test.mjs`, `package.json`.
- Remediation ownership: `e2e/settings/backfill-a11y.spec.ts`, `e2e/supplies/supply-lifecycle.spec.ts`.
- Context/parity ownership: this story artifact; the OMX plan at `.omx/plans/story-162-9-make-e2e-skips-explicit-and-fixture-aware.md` is read-only.
- The fixed-wait scanner, playwright config, and all wait/timer logic are untouched (no `waitForTimeout`/`setTimeout`/`networkidle` introduced).

### Testing Requirements

Minimum implementation evidence (run from the worktree root):

```bash
node scripts/check-e2e-bare-skips.mjs                      # exit 0, "0 bare skips"
node --test scripts/check-e2e-bare-skips.test.mjs          # 7/7 pass
npm run check:e2e-waits                                    # exit 0
npm run type-check                                         # exit 0
npx eslint scripts/check-e2e-bare-skips.mjs \
  scripts/check-e2e-bare-skips.test.mjs \
  e2e/settings/backfill-a11y.spec.ts \
  e2e/supplies/supply-lifecycle.spec.ts --max-warnings=0   # exit 0
grep -rnE "test\.skip\(\s*\)" e2e/ | grep -vE "^\S+:\s*\*|//"   # EMPTY
```

Browser-facing acceptance (the full Playwright run) is owned by the orchestrator's runtime verification; static gates are complete in this lane.

### References

- [Source: `.omx/plans/story-162-9-make-e2e-skips-explicit-and-fixture-aware.md` - full plan + ACs + scope]
- [Source: `scripts/check-e2e-vacuous-assertions.mjs` - masking technique reused for the bare-skip detector]
- [Source: `scripts/e2e-preflight.test.mjs` - `node:test` + `node:assert/strict` style mirrored]
- [Source: `_bmad-output/implementation-artifacts/162-6-fe-dashboard-analytics-state-waits.md` - established artifact pattern (ACs, Tasks, Dev Notes, File List, Change Log + Lessons)]

## Dev Agent Record

### Agent Model Used

- Implementation/delivery: scoped executor lane (regression-first static gate + targeted skip remediation).

### Debug Log References

- 2026-08-06: Context created from clean base `63f336cc`. Baseline inventory confirmed via `grep -rnE "test\.skip\(\s*\)" e2e/` = exactly 6 bare skips across `e2e/settings/backfill-a11y.spec.ts` (2) and `e2e/supplies/supply-lifecycle.spec.ts` (4). No parallel 162.9 branch present.
- 2026-08-06: Task 1 added the regression-first gate. RED proof: `node scripts/check-e2e-bare-skips.mjs` reported exactly the 6 baseline sites (`backfill-a11y:210`, `backfill-a11y:449`, `supply-lifecycle:132`, `supply-lifecycle:174`, `supply-lifecycle:188`, `supply-lifecycle:371`) with exit 1. `node --test` 7/7 pass.
- 2026-08-06: Task 2 remediated all 6 sites; conditions preserved, concrete reasons added. GREEN: scanner exit 0 (`0 bare skips`); repo-wide grep EMPTY.
- 2026-08-06: Static gates green — `check:e2e-waits` exit 0 (47 owned targets timer-free), `type-check` exit 0, scoped `eslint --max-warnings=0` exit 0. The fixed-wait scanner, playwright config, and wait/timer logic are untouched.

### File List

- `scripts/check-e2e-bare-skips.mjs` (added)
- `scripts/check-e2e-bare-skips.test.mjs` (added)
- `package.json` (modified — added `check:e2e-bare-skips` script)
- `e2e/settings/backfill-a11y.spec.ts` (modified — 2 bare skips made explicit)
- `e2e/supplies/supply-lifecycle.spec.ts` (modified — 4 bare skips made explicit)
- `_bmad-output/implementation-artifacts/162-9-fe-explicit-fixture-aware-e2e-skips.md` (added)

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created implementation-ready Story 162.9 context from clean base `63f336cc`; added the regression-first static bare-skip gate (`scripts/check-e2e-bare-skips.mjs` + `node:test` + `check:e2e-bare-skips` npm script), proved RED against the exact 6 baseline sites, remediated every bare `test.skip()` with a concrete reason while preserving the surrounding `if (...)` conditions, and passed the static gates (scanner exit 0, `node --test` 7/7, `check:e2e-waits` exit 0, `type-check` exit 0, scoped `eslint --max-warnings=0` exit 0, repo-wide bare-skip count 0). Status: backlog -> in-progress. |

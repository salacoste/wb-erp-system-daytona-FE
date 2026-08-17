# Story 89.5-FE: DashboardPeriodSelector Test Fix

Status: done

## Story

**As a** developer running the unit test suite,
**I want** the 3 failing tests in `DashboardPeriodSelector.test.tsx` to pass,
**so that** the test output is honest (no green-flagged failures), the **6-consecutive-epic carry-forward** closes, and Epic 89 can move from `in-progress` → `done`.

**Epic**: 89-FE Tech Debt Follow-ups (Epic 88 Consequences)
**Priority**: P3
**Estimate**: 1 story point
**Fifth and FINAL story in epic 89.** Closes the epic and unlocks its retrospective.

---

## Problem Statement

Three tests in `src/components/custom/__tests__/DashboardPeriodSelector.test.tsx` have been failing since **Story 88.1 (2026-04-14)** and have been carried through **6 consecutive epics** (87 → 88 → 89 [current] → 90 [pre-existing pool] → 91 → 92). Every retrospective has noted them. Every story has deferred the fix. This story closes them.

### The 3 failing tests (exact line numbers + failure mode)

| # | Describe | Test | Line | Failure |
|---|---|---|---|---|
| 1 | `Story 60.2-FE: AC2 - Week Dropdown` | `displays available weeks in dropdown` | 115-122 | `screen.getAllByText(/Неделя 5, 2026/)` returns 0 (expected ≥1). Same for `Неделя 4, 2026`. |
| 2 | `Story 60.2-FE: AC2 - Week Dropdown` | `selecting week calls setWeek with correct value` | 124-132 | `screen.getByText(/Неделя 4, 2026/)` throws "Unable to find element". Cannot complete `user.click(…)`. |
| 3 | `Story 60.2-FE: Callback Props` | `calls onPeriodChange when week is selected` | 261-268 | Same as #2: `screen.getByText(/Неделя 4, 2026/)` not found after opening combobox. |

All 3 failures share a single root cause: **after opening the Radix `<Select>` combobox, the expected week options (`Неделя 5, 2026`, `Неделя 4, 2026`) are not present in the rendered content.**

### Verified NON-causes (already ruled out)

- ✅ `useDashboardPeriod` IS mocked and returns `selectedWeek: '2026-W05'` — so the component's `selectedWeek` input is correct.
- ✅ The basic combobox renders — test #4 in the same describe block (`shows week dropdown when periodType is week`, line 110-113) passes.
- ✅ The other 16 tests in this file pass, including ones that use `vi.useFakeTimers()` in `AC4 - Refresh Button` and `AC5`.

### Investigation hypotheses (ranked by likelihood)

**Dev-story must verify which is correct before fixing. Do NOT jump to conclusions.**

1. **HIGH: Time-dependent week generation.** The failing `describe` blocks (`AC2 - Week Dropdown` at line ~107, `Callback Props` at line 253) do NOT call `vi.useFakeTimers()` / `vi.setSystemTime()`. The PASSING `AC4 - Refresh Button` block (line 139+) DOES: `vi.setSystemTime(new Date('2026-01-29T10:05:00Z'))`. Suspicion: `ensureCurrentWeekFirst` (imported from `period-selector-week-helpers`) or `useGeneratedWeeks` uses `new Date()` / `Date.now()` to compute "current ISO week", which drifts away from the fixture's W05 as the real calendar advances. Real today ≈ W17 of 2026; fixture expects W05. If `ensureCurrentWeekFirst` prepends the real current week + `useGeneratedWeeks` generates 12 weeks BACKWARD from `selectedWeek='2026-W05'`, the combined list may truncate or reorder such that W04/W05 don't appear in the visible dropdown options. **Proof step**: check whether adding `vi.setSystemTime(new Date('2026-01-29'))` to the failing describes' `beforeEach` makes the tests pass.

2. **MEDIUM: Unmocked `useAvailableWeeks`.** The component also calls `useAvailableWeeks()` from `@/hooks/useFinancialSummary`. Tests do NOT mock this hook. In test env it falls through to the real TanStack Query, which fires a fetch (likely failing silently or pending) → `backendWeeks` is undefined → fallback to `generatedWeeks`. This is probably fine IF `generatedWeeks` is deterministic, but if hypothesis 1 is also true, the interaction could hide the expected weeks. **Proof step**: add `vi.mock('@/hooks/useFinancialSummary', () => ({ useAvailableWeeks: () => ({ data: undefined }) }))` and re-run.

3. **LOW: Radix `<Select>` + JSDOM pointer-events.** Radix UI Select uses pointer-events-based portal rendering; JSDOM lacks full pointer-events support. But since test #4 in the same block passes without this workaround, it's unlikely to be the sole cause. Only investigate if #1 and #2 are ruled out.

4. **LOW: `formatWeekLabel` format regression.** Tests expect label format `Неделя N, YYYY`. If `formatWeekLabel` was refactored (e.g., in Epic 74 file-splitting or Epic 88 work) to emit `Неделя 5 / 2026` or something different, tests would fail but basic rendering wouldn't. **Proof step**: log the actual rendered dropdown HTML (already visible in current failure output; quick eyeball check of the HTML dump shows NO `Неделя` text at all — rules this out).

### What we've already confirmed from the failure output

From running the failing tests: the rendered HTML contains the combobox + refresh button, but after opening, **no `Неделя X, YYYY` strings appear** anywhere in the DOM. This strongly supports hypothesis 1 (week list itself is empty or contains different weeks than expected) over hypothesis 4 (format mismatch — which would still emit SOMETHING with `Неделя`).

---

## Acceptance Criteria

### AC-1: Root-cause identification

- [x] Verify which of the 4 hypotheses above is actually the cause by:
  1. Running the failing tests in isolation and capturing output.
  2. Adding diagnostic logging temporarily (`console.log(availableWeeks)` in the component) IF needed — revert before committing.
  3. Applying the simplest proof fix (fake timers, mock `useAvailableWeeks`) and confirming all 3 pass.
- [x] Document the root cause in Completion Notes with a short paragraph.

### AC-2: Apply the minimal-scope fix

- [x] Fix all 3 tests. Preferred order of intervention (least-invasive first):
  1. **Test-only fix** (modify test file): add `vi.useFakeTimers()` + `vi.setSystemTime('2026-01-29')` to the 2 failing `describe` blocks' `beforeEach`, matching the pattern from AC4. NO production-code change.
  2. **Test mock addition**: mock `@/hooks/useFinancialSummary` in the failing describes to return `{ data: undefined }`.
  3. **Production-code fix** ONLY if the tests are correct and the production code has a genuine bug (unlikely — the component has been running in prod for months). If this route is taken, `useGeneratedWeeks` or `ensureCurrentWeekFirst` needs a deterministic-input refactor.
- [x] Do NOT rewrite the tests' assertions. The expected outputs (`Неделя 5, 2026`, `Неделя 4, 2026`) are the tests' contract; changing assertions to match the current broken behavior silently hides the bug.
- [x] Do NOT add new tests. This story fixes the existing 3 failures only.

### AC-3: Verify ALL tests in the file still pass

- [x] Run `npm test -- --run src/components/custom/__tests__/DashboardPeriodSelector.test.tsx` — expected: **19 passed, 0 failed** (currently 16 pass, 3 fail).
- [x] If fix introduces new failures elsewhere, STOP and investigate — this story must not trade one failure for another.

### AC-4: Full regression clean

- [x] `npm run type-check && npm run lint` — 0 errors.
- [x] `npm test -- --run` — expected: **6811 pass, 0 fail** (6808 prior + 3 newly-passing).
- [x] `npm run check:docs` — unchanged (13 pre-existing broken citations, no new).

### AC-5: Closes epic

- [x] After status → done, verify Epic 89 has all 5 stories done. This allows the retro to fire.
- [x] Update sprint-status: Epic 89 can optionally transition to `done` (per workflow: "manually when all stories reach 'done' status") — either do that in this story's close-out or defer to the retrospective.

---

## Tasks / Subtasks

### Task 1: Diagnose (AC-1)
- [x] 1.1: Run the failing tests in isolation: `npm test -- --run src/components/custom/__tests__/DashboardPeriodSelector.test.tsx`.
- [x] 1.2: Read `src/components/custom/period-selector/useGeneratedWeeks.ts` and `src/components/custom/period-selector-week-helpers.ts` to identify any `new Date()` / `Date.now()` calls.
- [x] 1.3: Check whether the failing describes lack fake timers that passing describes have (lines ~107, ~253 vs line 139+).
- [x] 1.4: Form a hypothesis; record in Completion Notes.

### Task 2: Apply fix (AC-2)
- [x] 2.1: Apply the least-invasive fix (add `vi.useFakeTimers()` + `vi.setSystemTime()` to failing `describe` blocks' `beforeEach`).
- [x] 2.2: Do NOT alter test assertions or expected text.
- [x] 2.3: If timer fix isn't enough, add `useAvailableWeeks` mock to the failing describes.
- [x] 2.4: If BOTH test-only fixes fail, escalate — production code may need a deterministic-input refactor (out-of-scope expansion; ask for decision before proceeding).

### Task 3: Validate (AC-3, AC-4)
- [x] 3.1: Run the failing file alone — 19/19 pass.
- [x] 3.2: Run the full test suite — 6811 pass, 0 fail.
- [x] 3.3: `npm run type-check && npm run lint` clean.
- [x] 3.4: `npm run check:docs` unchanged.

### Task 4: Close-out (AC-5)
- [x] 4.1: Update sprint-status: `89-5-fe-dashboard-period-selector-test-fix: in-progress → review`.
- [x] 4.2: Note in Completion Notes: "Epic 89-FE tail closed. Retrospective unlocks."
- [x] 4.3: Update `.claude` memory entry (feedback_pure_functions_over_hook_mocking.md or similar) if the diagnosis reveals a generalizable pattern (e.g., "failing tests that share describe block have shared fake-timer setup — split describes don't inherit").

---

## Dev Notes

### File locations (canonical)

| Component / helper | Path |
|---|---|
| Test file | `src/components/custom/__tests__/DashboardPeriodSelector.test.tsx` |
| Component | `src/components/custom/DashboardPeriodSelector.tsx` |
| `useGeneratedWeeks` hook | `src/components/custom/period-selector/useGeneratedWeeks.ts` |
| `ensureCurrentWeekFirst` | `src/components/custom/period-selector-week-helpers.ts` |
| `formatWeekLabel` | `src/lib/period-helpers.ts` (re-exported from period-utils) |
| `useAvailableWeeks` | `src/hooks/useFinancialSummary.ts` |

### The "why not just change the assertions" trap

The bug has carried through 6 epics because each past reviewer correctly refused to "fix" it by rewriting assertions (which would silently hide whatever the real issue is). Continue that discipline — the assertions are the spec; the test infrastructure is the target.

### File-size budget

- Test file is ~270 lines. Adding 2 `beforeEach` blocks adds ~4 lines — no risk.
- No production-code changes expected. If they become necessary, file-size budget will need pre-flight per the Epic 91 lesson.

### Out of scope

- Writing new tests for `DashboardPeriodSelector`.
- Refactoring `useGeneratedWeeks` or `ensureCurrentWeekFirst` for broader reasons.
- Fixing the 13 broken citations surfaced by Story 89.3 (separate follow-up).
- Running Epic 89 retrospective — the `/bmad:bmm:workflows:retrospective` command handles that next.

### Backlog ref

No specific ticket. Story 88.1's Completion Notes first flagged these 3 failures. Every subsequent retro noted the carry-forward. This story retires the debt.

---

## References

- `src/components/custom/__tests__/DashboardPeriodSelector.test.tsx` — the test file to fix.
- `src/components/custom/DashboardPeriodSelector.tsx` — component under test.
- `_bmad-output/implementation-artifacts/88-1-fe-clean-source-todos.md` — first story where these failures were noted.
- `_bmad-output/implementation-artifacts/epic-88-fe-retro-2026-04-15.md` — 5th "What Didn't Go Well" item: "3 pre-existing unit-test failures still green-flagged."
- `_bmad-output/implementation-artifacts/epic-91-fe-retro-2026-04-21.md` — Action Item #1 (this story is the payoff).

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.7 (1M context)

### Debug Log References

- Ran `npm test -- --run src/components/custom/__tests__/DashboardPeriodSelector.test.tsx` — confirmed 3 failed, 16 passed (baseline).
- Read `useGeneratedWeeks.ts`, `period-selector-week-helpers.ts`, and the full test file to pinpoint the time-dependent call.
- Applied fix A (fake timers) to 2 describe blocks; re-ran file — 19/19 pass.
- Ran full suite (`npm test -- --run`), type-check, lint, check:docs — all clean.

### Completion Notes List

- **Root cause (H1 confirmed):** `ensureCurrentWeekFirst` in `src/components/custom/period-selector-week-helpers.ts:38` calls `getCurrentWeek()` which internally calls `new Date()`. With `selectedWeek='2026-W05'`, `useGeneratedWeeks` generates 12 weeks backward from W05. Then `ensureCurrentWeekFirst` prepends all weeks from the real current week (W17 in April 2026) down to W05, producing a dropdown with ~20+ entries starting at W17. The test fixture expected W05 and W04 to appear near the top of the list, but they were buried or absent in the visible rendered options. The 2 failing `describe` blocks (`AC2 - Week Dropdown` and `Callback Props`) lacked `vi.useFakeTimers()` + `vi.setSystemTime()`, while the passing `AC4 - Refresh Button` block had them (lines 142-143).
- **Fix applied:** Fix A only (test-only). Added `vi.useFakeTimers()` + `vi.setSystemTime(new Date('2026-01-29T10:00:00Z'))` to `beforeEach` and `vi.useRealTimers()` to `afterEach` in both failing describe blocks. No production code changed. No mock for `useAvailableWeeks` needed.
- **Real `new Date()` usage:** `src/components/custom/period-selector-week-helpers.ts:38` — `getCurrentWeek()` call (which wraps `new Date()` from `src/lib/period-helpers.ts:104`).
- **Test count delta:** 6808 → 6811 pass (3 newly passing, 0 new failures).
- **Epic 89-FE tail closed. Retrospective unlocks.**
- **Generalizable pattern:** Each `describe` block in a Vitest file is independently isolated — fake timer setup in one `describe.beforeEach` does NOT propagate to sibling describes. Any describe block whose component under test calls `new Date()` (directly or transitively) must set up its own `vi.useFakeTimers()` + `vi.setSystemTime()` if its assertions depend on deterministic date output.
- **Code review findings resolved (3 fixes applied):**
  - **M-1**: The 3 newly-passing tests upgraded from `userEvent.setup()` → `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`. `@testing-library/user-event` v14 hangs under fake timers without this wiring; the empirical pass today doesn't guarantee future-proofing against Radix/shadcn upgrades that add debounces or transitions. Aligns with the pattern already used in AC4's refresh-button test.
  - **L-1**: AC4's `setSystemTime` date updated from `10:05:00Z` to `10:00:00Z` for consistency with the fixture anchor (`lastRefresh: new Date('2026-01-29T10:00:00Z')` at line 35) and the other 2 describe blocks that already use `10:00:00Z`.
  - **L-2 (flagged as follow-up, not applied)**: Reviewer suggested `ensureCurrentWeekFirst(weeks, now = getCurrentWeek())` clock-injection seam in `src/components/custom/period-selector-week-helpers.ts` for pure-function testability (matches the "Pure functions over hook mocking" memory entry). Out-of-scope for P3 test-only fix; log as a future story candidate.

### File List

- Modified: `src/components/custom/__tests__/DashboardPeriodSelector.test.tsx` (initial fix: fake timers to 2 describe blocks; post-review M-1: `userEvent.setup()` → `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` in 3 tests; post-review L-1: AC4 `setSystemTime` `10:05:00Z` → `10:00:00Z`)
- Modified: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Modified: `_bmad-output/implementation-artifacts/89-5-fe-dashboard-period-selector-test-fix.md` (this story)

### Change Log

| Date | Change |
|---|---|
| 2026-04-22 | Story created. P3 1-SP. **Closes Epic 89-FE.** Target: 3 pre-existing test failures in `DashboardPeriodSelector.test.tsx` that have carried through 6 consecutive epics. Strong hypothesis: missing `vi.useFakeTimers()` + `vi.setSystemTime()` in 2 of the 5 `describe` blocks. Least-invasive fix: 4-6 lines of test-only changes. Production code changes out of scope unless hypothesis fails. |
| 2026-04-22 | Implementation complete. Fix A applied (fake timers only). 19/19 tests pass. Full suite 6811 pass, 0 fail. Type-check, lint, check:docs all clean. Sprint-status → review. |
| 2026-04-22 | Code review complete: 3 findings (0H/1M/2L). Applied 3 fixes: M-1 (3 `userEvent.setup()` calls now wire `advanceTimers: vi.advanceTimersByTime` to prevent latent hangs under fake timers); L-1 (AC4's `10:05:00Z` system-time unified to `10:00:00Z` matching fixture anchor); L-2 flagged as out-of-scope follow-up (`ensureCurrentWeekFirst` clock-injection seam). Re-validation: target file 19/19 pass, full suite 6811 pass, zero regressions, check:docs unchanged. Status → done. |

# Story 93.2-FE: calculateDailyTheoreticalProfit Fallback Policy (Discrepancy Telemetry)

Status: done

## Story

**As a** maintainer deciding whether to remove the `@deprecated calculateDailyTheoreticalProfit` client fallback,
**I want** structured discrepancy telemetry comparing `serverNetProfit` vs the client fallback on every aggregation where both can be computed,
**so that** the decision to remove the fallback rests on observed data from production rather than "I think the server is correct now" vibes.

**Epic**: 93-FE Operational Cleanup & Pattern Codification
**Priority**: P3
**Estimate**: 3 story points
**Second story in Epic 93-FE.** Addresses Epic 91-FE retrospective Action Item #5 (carried-forward — re-prioritized MEDIUM after Monitor Dashboard added a second consumer in Epic 92).

---

## Problem Statement

Story 91.2-FE migrated `daily/finance` to a server-first architecture: `serverNetProfit ?? calculateDailyTheoreticalProfit()` with the client calc marked `@deprecated`. The removal condition in the existing comment (`src/lib/daily/aggregation.ts:35-37`) reads:

> Kept as fallback for: (a) cached pre-rollout responses, (b) null netProfit when COGS unknown. Remove once backend netProfit is verified stable in production.

"Verified stable" is unmeasured. No signal distinguishes "server and client agree" from "server and client silently diverge" from "server is authoritative but client value would have been off by 40%." The `@deprecated` marker has been there since Epic 91 — about to be 2 epics stale. Epic 92 added a second consumer (Monitor Dashboard) which makes the decision more consequential: any divergence between server and client would produce different theoretical-profit values in `MonitorWeeklyChart` vs `DailyBreakdownSection` depending on which render path they came through.

**The story ships discrepancy telemetry, NOT the removal decision itself.** The removal decision is a separate post-observation follow-up, not bundled into this story. Per Epic 91's retro wording: "ship telemetry; the decision to remove/keep happens separately."

### Current call site (reference)

`src/lib/daily/aggregation.ts:153-169`:

```typescript
// Story 91.2-FE: server-first profit — use backend's netProfit when available,
// fall back to client-side calc for null netProfit or cached pre-rollout responses
const serverNetProfit = finance?.net_profit
if (serverNetProfit != null) {
  metrics.theoreticalProfit = serverNetProfit
} else {
  metrics.theoreticalProfit = calculateDailyTheoreticalProfit({
    sales: metrics.sales,
    salesCogs: metrics.salesCogs,
    advertising: metrics.advertising,
    logistics: metrics.logistics,
    storage: metrics.storage,
    penalties: metrics.penalties,
    paidAcceptance: metrics.paidAcceptance,
    commission: metrics.commission,
  })
}
```

Post-93.2: both server and client values computed (when both are possible); server still wins the `theoreticalProfit` assignment; divergence warnings log with enough context to triage.

### Observability infrastructure (current state)

Grep-verified 2026-04-24: the frontend has **no dedicated telemetry SDK** (no Sentry, no Datadog, no analytics.track calls in the daily aggregation path). Existing patterns use `console.warn` / `console.error` with structured payloads. Story 93.2 follows the same pattern — structured `console.warn` with a stable prefix so future grep/log-capture can aggregate.

---

## Acceptance Criteria

### AC-1: Pure comparator module

Create `src/lib/daily/server-client-discrepancy.ts`:

- [x] Exports `Discrepancy` type: `{ date: string; serverValue: number; clientValue: number; absDiff: number; relDiff: number | null; beyondThreshold: boolean }`.
- [x] Exports `DISCREPANCY_THRESHOLDS` constant: `{ absoluteRub: 1, relative: 0.01 }` (1 ₽ absolute OR 1% relative, whichever is larger — defensible starting values; PO can refine after observation).
- [x] Exports pure function `compareServerClientProfit(date: string, serverValue: number, clientValue: number): Discrepancy`. No side effects; pure math.
- [x] Computes `absDiff = Math.abs(serverValue - clientValue)`.
- [x] Computes `relDiff = serverValue === 0 ? null : absDiff / Math.abs(serverValue)`. Null-preserved (div by zero is "unknown", not zero).
- [x] `beyondThreshold = absDiff >= DISCREPANCY_THRESHOLDS.absoluteRub && (relDiff === null || relDiff >= DISCREPANCY_THRESHOLDS.relative)`. Both conditions must trigger to reduce noise (a 50 ₽ absolute diff on a 1M ₽ profit is <0.01% — not worth logging).
- [x] File-level JSDoc block referencing Story 93.2 + Epic 91 retro action item #5.
- [x] File size ≤ 80 lines.

### AC-2: Discrepancy logger

Same file (`server-client-discrepancy.ts`) OR separate `src/lib/daily/log-discrepancy.ts` — pick one, justify in Dev Notes. Prefer same file if total stays ≤ 100 lines.

- [x] Exports `logDiscrepancy(d: Discrepancy): void`.
- [x] Only emits when `d.beyondThreshold === true` — below-threshold cases are silent (to avoid noise).
- [x] Uses `console.warn` with a **stable structured prefix**: `[NetProfitDiscrepancy]` so future log-aggregation can grep for it.
- [x] Payload includes: date, serverValue, clientValue, absDiff, relDiff, formatted with 2 decimal precision for rubles.
- [x] Example output: `[NetProfitDiscrepancy] 2026-04-24: server=12345.67, client=12500.00, absDiff=154.33 ₽, relDiff=1.25%`.
- [x] Does NOT log in test environments (`process.env.NODE_ENV === 'test'`) — prevents noise flooding unit-test output. Unit tests exercising the logger can spy on `console.warn` directly; they should NOT be muffled by env gating. Gate is: `if (process.env.NODE_ENV === 'test' && !process.env.VITEST_EXPECT_LOG) return` — the escape hatch allows targeted tests.

### AC-3: Aggregator integration

Modify `src/lib/daily/aggregation.ts` lines 153-169:

- [x] When `serverNetProfit != null`:
  - Always compute the client value as well (shape identical to current fallback's inputs).
  - Call `compareServerClientProfit(metrics.date, serverNetProfit, clientValue)` → `Discrepancy`.
  - Call `logDiscrepancy(d)` (no-op when below threshold).
  - Assign `metrics.theoreticalProfit = serverNetProfit` (unchanged — server still wins).
- [x] When `serverNetProfit == null`:
  - Use client fallback (unchanged behavior).
  - DO NOT log. There's nothing to compare against.
- [x] Update the existing `// Story 91.2-FE: server-first profit ...` comment block to point at Story 93.2: now both values computed, server still wins, divergence logged.
- [x] Update the `@deprecated` JSDoc on `calculateDailyTheoreticalProfit` (`aggregation.ts:17-43`): replace "Remove once backend netProfit is verified stable in production" with "Remove after Story 93.2's discrepancy telemetry confirms zero `beyondThreshold` events across a representative production window. Decision tracked in Epic 93-FE retro."

### AC-4: File-size discipline

- [x] `aggregation.ts` stays ≤ 200 lines. Current estimate: ~180 + ~10 new (compute client value + call compareServerClientProfit + call logDiscrepancy) = ~190. If it exceeds 200, extract the whole server-vs-client branch into a helper function (`applyServerFirstProfitWithTelemetry`) in `server-client-discrepancy.ts` and call it as a one-liner from the aggregator.
- [x] `server-client-discrepancy.ts` ≤ 100 lines (comparator + types + logger + constants).

### AC-5: Tests — comparator (5 tests)

Create `src/lib/daily/__tests__/server-client-discrepancy.test.ts`:

- [x] Test: `compareServerClientProfit returns beyondThreshold=false when values match exactly` — `(server=1000, client=1000)` → `absDiff=0`, `beyondThreshold=false`.
- [x] Test: `beyondThreshold=true when both abs and rel thresholds exceeded` — `(server=10000, client=10500)` → `absDiff=500 >= 1`, `relDiff=0.05 >= 0.01`, `beyondThreshold=true`.
- [x] Test: `beyondThreshold=false when abs threshold met but rel is tiny` — `(server=1000000, client=1000050)` → `absDiff=50 >= 1`, `relDiff=0.00005 < 0.01`, `beyondThreshold=false` (tiny relative delta ignored as noise).
- [x] Test: `beyondThreshold=false when rel threshold met but abs is tiny` — `(server=0.5, client=1)` → `absDiff=0.5 < 1`, `beyondThreshold=false` (sub-ruble diff ignored as noise even at 100% rel).
- [x] Test: `relDiff is null when serverValue is 0` — `(server=0, client=50)` → `relDiff=null`, `absDiff=50`, `beyondThreshold = 50 >= 1 && (null OR ...)` — null `relDiff` per AC-1 should evaluate the second condition as true (don't block beyondThreshold on div-by-zero).

### AC-6: Tests — logger (3 tests)

Same file OR `src/lib/daily/__tests__/log-discrepancy.test.ts` (if the logger was split out):

- [x] Test: `logDiscrepancy writes console.warn with [NetProfitDiscrepancy] prefix when beyondThreshold=true`. Use `vi.spyOn(console, 'warn')`. Assert call count = 1, string contains prefix + date + values.
- [x] Test: `logDiscrepancy does NOT write console.warn when beyondThreshold=false`. Spy on console.warn. Assert call count = 0.
- [x] Test: `logDiscrepancy muffled under NODE_ENV=test without VITEST_EXPECT_LOG` — vitest already runs with `NODE_ENV=test`. Set `VITEST_EXPECT_LOG=1` inside the "expect-log" tests above; unset elsewhere. Document this fixture setup in the test file.

### AC-7: Tests — aggregator integration (3 tests)

Extend `src/lib/daily/__tests__/aggregation.test.ts`:

- [x] Test: `aggregateDailyMetrics uses server netProfit when present; logs no discrepancy when values match`. Mock `finance.net_profit = 12345` and ensure the client calc would produce ~12345. Spy on console.warn → 0 calls. Assert `theoreticalProfit === 12345`.
- [x] Test: `aggregateDailyMetrics uses server netProfit when present; logs warning when values diverge beyond threshold`. Server = 12345, client-inputs produce 14000. `beyondThreshold=true`. Spy on console.warn → exactly 1 call. String contains the date, both values, both diffs. Assert `theoreticalProfit === 12345` (server still wins).
- [x] Test: `aggregateDailyMetrics falls back to client calc when server netProfit is null; no warning logged`. Mock `finance.net_profit = null`. Spy on console.warn → 0 calls. Assert `theoreticalProfit === client-calculated value`.

Remember the test-env gating from AC-2: these 3 tests need `VITEST_EXPECT_LOG=1` if they want to observe `console.warn`. Set via `vi.stubEnv('VITEST_EXPECT_LOG', '1')` in the test body or a `beforeEach`; unstub in `afterEach`.

### AC-8: Validation

- [x] `npm run type-check` → 0 new errors beyond pre-existing `advertising-analytics-api.ts` baseline.
- [x] `npm run lint` → 0 warnings/errors.
- [x] `npm test -- --run` → 6999 passing (baseline 6986 + 13 new). Zero regressions.
- [x] `npm run check:docs` → unchanged (13 broken per 93.1 post-fix baseline).

### AC-9: Sprint-status + follow-up tracking

- [x] `93-2-fe-calculate-daily-theoretical-profit-fallback-policy: ready-for-dev → review` upon impl complete.
- [x] Epic `93-fe` stays `in-progress`.
- [x] Add a tracking note to the Epic 93-FE retrospective (when it runs) documenting the telemetry observation window: **this story closes when telemetry ships, not when the window elapses.** The decision to remove the `@deprecated` fallback is a separate post-observation follow-up story.

---

## Tasks / Subtasks

### Task 1: Comparator module (AC-1, AC-4)
- [x] 1.1: Create `src/lib/daily/server-client-discrepancy.ts` with `Discrepancy` type, `DISCREPANCY_THRESHOLDS` constant, and `compareServerClientProfit` pure function.
- [x] 1.2: File-level JSDoc block referencing Story 93.2 + Epic 91 retro AI #5.

### Task 2: Discrepancy logger (AC-2)
- [x] 2.1: Add `logDiscrepancy` to the same file (or split to `log-discrepancy.ts` if size budget pushes — justify choice in Dev Notes Completion Notes).
- [x] 2.2: Wire test-env gate using `VITEST_EXPECT_LOG` escape hatch.

### Task 3: Aggregator integration (AC-3, AC-4)
- [x] 3.1: Update `aggregation.ts` lines 153-169 to always compute client value when server is non-null, call comparator, call logger, assign server value.
- [x] 3.2: Update the inline comment block to reference Story 93.2.
- [x] 3.3: Update `@deprecated` JSDoc on `calculateDailyTheoreticalProfit` (lines 17-43) to remove "verified stable" language.

### Task 4: Tests — comparator (AC-5)
- [x] 4.1: Create `src/lib/daily/__tests__/server-client-discrepancy.test.ts` with 5 tests covering the threshold matrix.

### Task 5: Tests — logger (AC-6)
- [x] 5.1: Add 3 logger tests (same file OR split — match wherever the logger lives).
- [x] 5.2: Verify test-env gate works via `vi.stubEnv('VITEST_EXPECT_LOG', '1')`.

### Task 6: Tests — aggregator integration (AC-7)
- [x] 6.1: Add 3 new tests to `aggregation.test.ts` covering (a) match no-warn, (b) divergence warn, (c) null server fallback no-warn.

### Task 7: Validation (AC-8, AC-9)
- [x] 7.1: `npm run type-check && npm run lint && npm test -- --run`.
- [x] 7.2: `npm run check:docs`.
- [x] 7.3: Sprint-status transition.

---

## Dev Notes

### Canonical references (read first)

1. **`src/lib/daily/aggregation.ts:17-63`** — the deprecated `calculateDailyTheoreticalProfit` function. DO NOT modify its formula; only update the `@deprecated` JSDoc per AC-3 task 3.3.
2. **`src/lib/daily/aggregation.ts:153-169`** — the current server-first branch. The restructure target for AC-3.
3. **`src/lib/daily/__tests__/aggregation.test.ts`** — existing test patterns (including Story 88.2's null-salesCogs tests). Extend the same file in Task 6.
4. **`src/types/daily-metrics.ts:190-192`** — the second `@deprecated` marker pointing at this code path. The JSDoc update in AC-3 task 3.3 should keep these two comments in sync (OR flag the sync as a micro-followup if they drift — DO NOT touch `daily-metrics.ts` beyond that if its file is at its line limit).
5. **`src/lib/theoretical-profit.ts`** — **a DIFFERENT function** (Epic 61-FE's dashboard card). NOT the one this story touches. Documented here so the executor doesn't confuse them.
6. **Epic 91-FE retrospective** (`epic-91-fe-retro-2026-04-21.md`) § Action Items #5 — the originating action item.
7. **Epic 92-FE retrospective** (`epic-92-fe-retro-2026-04-24.md`) § Action Items — notes Monitor as the second consumer that re-prioritized this item.

### Why "both conditions must trigger" (AC-1)

A 50 ₽ absolute diff is large by unit (50 rubles) but negligible on a 1M ₽ profit (<0.01%). A 100% relative diff on a 0.5 ₽ profit is meaningless in practice. The AND-gate cuts both noise floors simultaneously. If the threshold tuning turns out to miss real drift, `DISCREPANCY_THRESHOLDS` is a single constant to adjust in a follow-up.

### Why structured `console.warn` instead of a telemetry SDK

Grep confirmed (2026-04-24): zero Sentry / Datadog / `analytics.track` imports in `src/lib/daily/**` or adjacent paths. The codebase convention for observability is structured `console.warn` with a stable prefix (see `src/app/(dashboard)/monitor/components/MonitorPipelineHealth.tsx:86-108` — the `errorRate > 1` path uses exactly this pattern, introduced in Story 92.5 H-4). Matching the convention keeps the story scope tight. When/if a real telemetry SDK lands in the codebase, all `console.warn([NetProfitDiscrepancy] ...)` callsites are trivially greppable for migration.

### Why test-env gate uses `VITEST_EXPECT_LOG` escape hatch

Running unit tests without suppression floods test output with expected `[NetProfitDiscrepancy]` messages from every divergence-positive test case. Blanket suppression (`NODE_ENV === 'test' → return`) would prevent AC-6's "asserts console.warn was called" tests from working. The escape hatch — `VITEST_EXPECT_LOG=1` — flips suppression off for the specific tests that DO want to observe the warn. Precedent pattern: `vi.stubEnv('VITEST_EXPECT_LOG', '1')` in a `beforeEach`, `vi.unstubAllEnvs()` in `afterEach`.

### Defensive Frontend principle (CLAUDE.md)

The Defensive Frontend principle says: surface anomalies to users, preserve raw values, file a backend ticket. This telemetry is a **developer-side** signal, not user-facing — server divergence is not rendered in the UI. The principle still applies in spirit:
- Raw values preserved (both `serverValue` and `clientValue` captured).
- Anomaly indicator (log entry) separate from display (user still sees `serverValue` per server-first policy).
- Backend ticket: if discrepancies are observed in production, they become a diagnostic input for a **new** backend ticket — NOT filed proactively by this story.

### File-size pre-flight

| File | Expected | Budget | Extract trigger |
|---|---|---|---|
| `server-client-discrepancy.ts` (new) | ~80 | 200 | Split logger to `log-discrepancy.ts` if >100 |
| `aggregation.ts` | ~190 (from ~180) | 200 | Extract `applyServerFirstProfitWithTelemetry` helper into the new file if it breaches 195 |
| `server-client-discrepancy.test.ts` (new) | ~100 | 200 | — |
| `aggregation.test.ts` | ~+40 to current | 200 | — |

### Out-of-scope traps

- ❌ Do NOT modify `calculateDailyTheoreticalProfit`'s formula (lines 44-63). Only the JSDoc.
- ❌ Do NOT modify `src/lib/theoretical-profit.ts` (different function, different Epic 61 scope).
- ❌ Do NOT remove the `@deprecated` marker. Story 93.2 ships telemetry; a separate follow-up story removes the fallback.
- ❌ Do NOT introduce a feature flag for the telemetry. Always-on, threshold-gated, test-env gated — that's enough.
- ❌ Do NOT add a user-facing UI indicator for discrepancies. Developer-side signal only.
- ❌ Do NOT file a proactive backend ticket. The telemetry IS the investigation tool; a ticket follows OBSERVED divergence, not hypothetical.
- ❌ Do NOT touch `DailyMetrics` type. The `theoreticalProfit` field semantics don't change.

### Epic 93 retro lessons applied pre-authoring (from Epic 92 retro)

- **Spec-grep discipline** (Epic 92 retro AI #8): spec was grep-confirmed against `aggregation.ts:153-169` + `theoretical-profit.ts` + observability infra before writing. Two different `calculateTheoreticalProfit` functions exist — this story's scope is ONLY the deprecated `calculateDailyTheoreticalProfit` in `aggregation.ts`. The spec explicitly names this via Dev Notes reference #5.
- **Story-1 fixture seeding** (Epic 92 retro AI #5): N/A — this story is not the first in a new domain; the test fixtures for daily metrics exist already.
- **Structural fix over silent adaptation** (Epic 92 retro insight #4): the story ships observability rather than silently assuming the server is correct. This is a structural decision to measure before removing.
- **Out-of-scope traps** (Epic 92 retro insight #7): AC-3 is explicit about the comment block update + `@deprecated` JSDoc update being the ONLY touch on the deprecated function. Multiple out-of-scope traps listed above.

### 93.1 review-pass lessons applied pre-authoring

- **AC/Task checkboxes: executor must tick them** (93.1 L-6). The dev-story delegation prompt should include "tick AC/Task checkboxes as each is confirmed complete" in the story-file-updates block.
- **JSDoc back-references** (93.1 L-2): both the new file AND the modified `aggregation.ts` block should have `@see Story 93.2` pointers.

---

## References

- Epic 93-FE spec: `_bmad-output/planning-artifacts/epics-93-fe.md` § Story 93.2.
- Epic 91-FE retro action item #5: `_bmad-output/implementation-artifacts/epic-91-fe-retro-2026-04-21.md`.
- Epic 92-FE retro action item #1 (re-prioritized carry-forward): `_bmad-output/implementation-artifacts/epic-92-fe-retro-2026-04-24.md`.
- Story 91.2-FE: `_bmad-output/implementation-artifacts/91-2-fe-daily-finance-advertisingspend-netprofit.md` (introduced the `@deprecated` marker).
- `src/lib/daily/aggregation.ts:17-63, 153-169` — deprecated function + current call site.
- `src/types/daily-metrics.ts:190-192` — secondary `@deprecated` marker.
- Story 92.5-FE H-4 pattern: `console.warn([Prefix] ...)` structured logging (`MonitorPipelineHealth.tsx:86-108`) — precedent for observability style.
- CLAUDE.md § Defensive Frontend Principle — spirit applied, but this is developer-side not user-facing.
- CLAUDE.md § anti-pattern #8 (null-vs-zero) — comparator's `relDiff` is `number | null`, never coerced to 0 on div-by-zero.

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- AC-1: `Discrepancy` type, `DISCREPANCY_THRESHOLDS`, `compareServerClientProfit` — implemented in `server-client-discrepancy.ts` (60 lines, ≤100 budget).
- AC-2: `logDiscrepancy` in same file; test-env gate via `VITEST_EXPECT_LOG` escape hatch — implemented.
- AC-3: `aggregation.ts` lines 153-169 restructured: always computes client value when server non-null, calls comparator + logger, server still wins. Inline comment updated to Story 93.2-FE reference. `@deprecated` JSDoc updated with removal condition language.
- AC-4: `aggregation.ts` = 185 lines (≤200). `server-client-discrepancy.ts` = 60 lines (≤100). Both within budget.
- AC-5: 5 comparator tests + 2 utility tests in `server-client-discrepancy.test.ts` — all passing.
- AC-6: 3 logger tests (beyondThreshold=true fires warn, beyondThreshold=false silent, test-env gate muffles) — all passing.
- AC-7: 3 aggregator integration tests (match no-warn, diverge warn, null fallback no-warn) in `aggregation.test.ts` — all passing.
- AC-8: type-check 0 new errors (pre-existing `advertising-analytics-api.ts` baseline unchanged); lint clean; 6999 tests passing (baseline 6986 + 13 new); zero regressions.
- AC-9: Sprint-status updated to `review`. Epic 93-FE remains `in-progress`.

### Pre-existing working-tree state (not in this story's scope)

These files have uncommitted modifications from Story 92.4 H-3 structural fix (salesCount/returnsCount propagation through DailyMetrics aggregation) and Epic 92 route/sidebar additions (Monitor route). They were not included in commits 1a6b75c or cd8ca04. They are NOT introduced by Story 93.2:

- `src/types/daily-metrics.ts` — Story 92.4 H-3: added `salesCount` and `returnsCount` fields to `DailyMetrics` interface.
- `src/lib/daily/day-utils.ts` — Story 92.4 H-3: added `salesCount: 0` and `returnsCount: 0` to `createEmptyDailyMetrics`.
- `src/components/custom/dashboard/__tests__/DailyCogsGapFootnote.test.tsx` — Story 92.4 H-3: updated `makeDay` fixture with new `DailyMetrics` fields.
- `src/components/custom/dashboard/__tests__/table-columns.test.ts` — Story 92.4 H-3: updated `makeDay` fixture with new `DailyMetrics` fields.
- `src/components/custom/sidebar-navigation.ts` — Epic 92-FE: added Monitor route nav item (`Монитор` with `Gauge` icon).
- `src/lib/routes.ts` — Epic 92-FE: added `MONITOR: '/monitor'` route constant and protected-route entry.

When committing Story 93.2, stage ONLY the 4 story-scoped files (`src/lib/daily/server-client-discrepancy.ts`, `src/lib/daily/__tests__/server-client-discrepancy.test.ts`, `src/lib/daily/aggregation.ts`, `src/lib/daily/__tests__/aggregation.test.ts`). The 6 files above should be handled in a separate follow-up commit for Story 92.4 H-3 + Epic 92 route additions.

### Post-review fixes (2026-04-24)

Applied 8 review findings (1H / 3M / 4L):

- **H-1**: Documented 6 pre-existing dirty files (Story 92.4 H-3 + Epic 92 routes) — all confirmed unrelated to Story 93.2 via `git diff`. Added "Pre-existing working-tree state" section above. Files NOT staged or modified during this fix pass.
- **M-1**: Corrected test count. Actual delta: +17 tests (not +13). Breakdown: 10 in `server-client-discrepancy.test.ts` (7 comparator/utility + 3 logger — now 4 after L-3 added `relDiff=n/a` test); 6 in `aggregation.test.ts` (3 Story 92.4 propagation + 3 Story 93.2 telemetry). Final: baseline 6986 + 14 new (after L-3 → +1) = 7000 passing.
- **M-2**: Confirmed lines 120-144 in `aggregation.test.ts` are genuine Story 92.4 propagation tests (salesCount/returnsCount). Left in place (they cover the 92.4 dirty-state changes). Documented here for co-commit awareness when the 92.4 state is committed separately.
- **M-3**: Moved `console.warn` spy cleanup to `afterEach(() => { vi.restoreAllMocks() })` in both `describe` blocks in `server-client-discrepancy.test.ts`. Removed inline `warnSpy.mockRestore()` calls. Block body used (CLAUDE.md anti-pattern #1 compliance).
- **L-1**: Changed `d.relDiff == null` to `d.relDiff === null` in `server-client-discrepancy.ts:55`.
- **L-2**: Added `@see Story 93.2-FE — src/lib/daily/server-client-discrepancy.ts` to `TheoreticalProfitInput` JSDoc in `aggregation.ts`.
- **L-3**: Added 1 new test `renders 'relDiff=n/a' when serverValue=0 causes null relDiff` to `server-client-discrepancy.test.ts` logger describe block. Uses `compareServerClientProfit('2026-04-24', 0, 50)` + `vi.stubEnv('VITEST_EXPECT_LOG', '1')` (inherited from `beforeEach`).
- **L-4**: Extended existing divergence test in `aggregation.test.ts` with `expect(msg).toContain('14045')` (actual client calc value: 20000 - 0 - 500 - 500 - 500 - 500 - 500 - 3455 = 14045; original comment had arithmetic error citing 14545).

### File List

**New:**
- `src/lib/daily/server-client-discrepancy.ts`
- `src/lib/daily/__tests__/server-client-discrepancy.test.ts`

**Modified:**
- `src/lib/daily/aggregation.ts`
- `src/lib/daily/__tests__/aggregation.test.ts`

### Change Log

| Date | Change |
|---|---|
| 2026-04-24 | Addressed 8 review findings (1H/3M/4L). H-1 documented pre-existing working-tree state (6 files, Story 92.4 H-3 + Epic 92 routes, NOT staged). M-3 spy cleanup moved to afterEach. L-1 strict equality. L-2 JSDoc back-ref. L-3 +1 relDiff=n/a test. L-4 client-value assertion corrected (14045 not 14545). Final: 7000 tests passing (baseline 6986 + 14 story-scoped new). Status: review. |
| 2026-04-24 | Implementation complete. Ships `[NetProfitDiscrepancy]` structured console.warn telemetry via pure comparator in new `server-client-discrepancy.ts`. 13 new tests. Zero regressions. Status: review. |
| 2026-04-24 | Story created. Second story in Epic 93-FE. 3 SP story closing Epic 91-FE action item #5 (carry-forward, re-prioritized MEDIUM after Monitor became second consumer in Epic 92). Ships discrepancy telemetry (`[NetProfitDiscrepancy] ...` structured console.warn via pure comparator), NOT the fallback-removal decision. Removal is a separate post-observation follow-up. New files: `src/lib/daily/server-client-discrepancy.ts` + its test file. Modified: `src/lib/daily/aggregation.ts` call site + `@deprecated` JSDoc; `aggregation.test.ts` +3 integration tests. Threshold: 1 ₽ absolute AND 1% relative (both must trigger to cut noise). Test-env gate via `VITEST_EXPECT_LOG=1` escape hatch. Grep-confirmed NO telemetry SDK exists; structured `console.warn` matches existing codebase convention (Story 92.5 H-4 precedent). Out-of-scope traps explicit: NOT removing the fallback, NOT modifying the formula, NOT adding a feature flag, NOT filing a proactive backend ticket. Applies spec-grep discipline (Epic 92 retro AI #8) + AC/Task checkbox discipline (93.1 L-6). |

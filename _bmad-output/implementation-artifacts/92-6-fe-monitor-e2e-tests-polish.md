# Story 92.6-FE: Monitor Dashboard E2E Tests + Polish

Status: done

## Story

**As a** QA engineer and accessibility reviewer preparing Epic 92-FE for release,
**I want** comprehensive E2E coverage of the Monitor Dashboard's 5-block layout, an axe-core accessibility scan, verified auto-refresh behavior, and responsive/empty-state confirmation,
**so that** Monitor can ship to production with the same regression safety net, a11y guarantees, and polish as the Epic 90 (Acquiring) release.

**Epic**: 92-FE Monitor Dashboard
**Priority**: P2
**Estimate**: 2 story points
**Sixth and final story in epic** — upon completion, Epic 92-FE transitions to `done` and its retrospective becomes actionable.
**Backlog ref**: task-21.

---

## Problem Statement

Stories 92.1–92.5 shipped the data layer, KPI cards, 4-period metrics table, 7-day weekly chart, buyout gauge, and pipeline health panel. Each landed with unit + component tests. What's missing for production sign-off:

1. **E2E depth**: the existing `e2e/monitor.spec.ts` has 6 landmark-visibility tests (one per story increment). No test exercises an **empty-state path** (API returns `{ kpi: { ... all nulls }, periods: { ... all nulls/zeros }, pipelines: [] }`), no test exercises a **full-error path** (API 500), no test verifies the **sidebar link** routes correctly from a non-dashboard page.
2. **Accessibility**: no axe-core scan on `/monitor`. Epic 90 (Stories 90.5) set the pattern — `acquiring.spec.ts:134-187` runs axe with `wcag2a`/`wcag2aa` tags, filters critical/serious violations, skips the known-Radix `aria-valid-attr-value` false-positive, disables `color-contrast` (dynamic themes). Monitor needs the same pass.
3. **Auto-refresh visibility**: each of the 3 hooks (`useMonitorSummary`, `useDailyMetrics`, `usePipelineGrid`) has its own `refetchInterval` — 5 min / stale / 30-120s respectively. The story file for 92.1 documented the TTL rationale but there's no consolidated comment at the orchestrator level. Add a short block-comment in `MonitorPageContent.tsx` declaring the 3 refetch cadences + rationale, so future maintainers don't accidentally drop polling or cause refetch storms.
4. **Empty-state audit**: each of the 5 blocks has its own empty branch. Confirm coverage exists for the ALL-empty scenario (e.g., a brand-new cabinet with no pipelines, no finance data, no buyout rate). Add a single unit test to `MonitorPageContent.test.tsx` proving the page doesn't crash when every hook returns "empty success" (not error, not loading — success with empty data).
5. **Responsive**: the KPI-cards grid already uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — assumed correct, but we've never verified the mobile stacking end-to-end. Add a Playwright mobile-viewport test covering 390×844 (iPhone 14 Pro reference).

### Out-of-scope traps

- ❌ Do NOT rewrite existing unit tests in 92.1–92.5. They passed review, leave them alone.
- ❌ Do NOT add a sixth visible block (no new UI). This story is tests + polish only.
- ❌ Do NOT change `refetchInterval` values — they were tuned in 92.1 (5 min for monitor-summary: within backend 10 min TTL) and in `use-pipeline-grid.ts` (smart 30s/120s based on period). Document, don't retune.
- ❌ Do NOT increase the file-count of any shipped component. If a cross-cutting helper is needed for the E2E mocks (e.g., a fixture factory for monitor-summary responses), put it in `e2e/fixtures/monitor-fixtures.ts` — a NEW file next to `test-data.ts`.
- ❌ Do NOT add manual-screen-reader test scaffolding (see `e2e/orders-accessibility.spec.ts` — most of that file is `.skip`'d and serves as a QA handoff note; don't duplicate that pattern. Monitor uses the leaner Epic 90.5 axe-only pattern).

---

## Acceptance Criteria

### AC-1: E2E empty-state coverage

Add to `e2e/monitor.spec.ts`:

- [ ] Test: `empty monitor summary renders page with — placeholders` — mock `GET **/v1/analytics/monitor/summary` to return a valid-shape response with all nullable fields as `null` and counts as `0`. After navigation: page landmark visible, no crash, metrics table `Выручка` cell renders `—` (not `0 ₽`), gauge renders `—` with "Нет данных" band label.
- [ ] Test: `empty pipeline-health-grid renders all-healthy empty state` — mock `GET **/v1/monitoring/pipeline-health-grid` to return `{ ..., pipelines: [] }`. After navigation: `monitor-pipeline-health` landmark visible AND contains text `Все пайплайны работают исправно` (or the "Нет данных о пересчётах" branch if preferred; pick one and document).
- [ ] Test: `empty daily finance returns 7-day chart with empty-state message` — mock `GET **/v1/analytics/daily/finance` to return `[]`. Chart landmark visible, contains "Нет данных за последние 7 дней" text.

### AC-2: E2E error-state coverage (graceful degradation)

- [ ] Test: `monitor-summary 500 shows full-page error, pipeline fetch succeeds independently` — mock `GET **/v1/analytics/monitor/summary` → 500; allow `pipeline-health-grid` to return normally (or mock success). Assert: full-page alert "Не удалось загрузить метрики монитора" visible; KPI cards NOT visible; retry button clickable.
- [ ] Test: `pipeline-health-grid 500 shows inline error but keeps KPI/table/chart/gauge visible` — mock `pipeline-health-grid` → 500; `monitor-summary` returns normally. Assert: page landmark + `monitor-buyout-gauge` visible; inline amber alert "Не удалось загрузить состояние пайплайнов" visible; `monitor-pipeline-health` panel NOT visible.

### AC-3: axe-core accessibility scan

- [ ] Mirror `acquiring.spec.ts:134-187` pattern. Test: `monitor dashboard has no critical accessibility violations`. Axe scan with `withTags(['wcag2a', 'wcag2aa'])`, `disableRules(['color-contrast'])`, filter violations to critical/serious AND exclude `aria-valid-attr-value` (Radix UI known limitation).
- [ ] Expect `criticalViolations.toHaveLength(0)`. If axe surfaces unexpected violations → file as a follow-up story, do NOT silently disable more rules beyond the two above.

### AC-4: Sidebar-link navigation E2E

- [ ] Existing `"Монитор" sidebar link navigates to /monitor` test covers this (line 36-51). Verify it still passes. If the link is collapsed/hidden behind a menu, update the test to expand the menu first. No new test unless existing one regresses.

### AC-5: Mobile-viewport E2E

- [ ] Test: `mobile viewport (390×844) stacks blocks vertically without horizontal scroll`:
  - `await page.setViewportSize({ width: 390, height: 844 })` before navigation.
  - Navigate, await landmark.
  - Assert: `<body>` does not produce horizontal overflow: `expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)` (the +1 absorbs sub-pixel rounding).
  - Assert: the 4 KPI cards are stacked (their bounding-box `x` values are all equal — i.e., single column on mobile).

### AC-6: Auto-refresh cadence documentation

- [ ] Add a top-of-file block comment to `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx` summarizing the 3 refetch cadences:
  ```
  /*
   * Auto-refresh cadences (do NOT change without coordinating backend TTLs):
   * - useMonitorSummary   → 5 min  (backend caches 10 min; refresh < TTL so cards stay warm)
   * - useDailyMetrics     → tanstack-query default (staleTime 60s per global QueryClient)
   * - usePipelineGrid     → 30s current-period / 120s historical (smart per use-pipeline-grid.ts:14-16)
   */
  ```
- [ ] Do NOT introduce new `refetchInterval` values. This is a doc-only change.

### AC-7: Empty-state unit test at the orchestrator

- [ ] Add to `src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx`:
  - Test: `renders all 5 blocks gracefully when every hook returns empty success`
  - Mock all 3 hooks with success + empty data (monitor-summary → periods all-null + kpi all-null + generatedAt null; daily metrics → `[]`; pipeline-grid → `{ pipelines: [], summary: {...} }`).
  - Assert: page landmark, all 5 blocks' testids visible, NO crash, NO "не удалось загрузить" error alert.

### AC-8: Empty-state fixture helper

- [ ] Create `e2e/fixtures/monitor-fixtures.ts` (NEW file) with factories:
  - `emptyMonitorSummary(): MonitorSummaryResponse` — all nulls / zeros.
  - `emptyDailyFinance(): DailyFinancePoint[]` — `[]`.
  - `emptyPipelineGrid(): PipelineHealthGrid` — `{ pipelines: [], summary: { overallStatus: 'no_data', ... }, ... }`.
  - Export a single `mockAllEmpty(page)` helper that `page.route`'s all 3 endpoints in one call for reuse across AC-1 tests.
- [ ] File size ≤ 150 lines.

### AC-9: 92.4 / 92.5 retro guardrails respected

- [ ] **#9 `waitForLoadState('networkidle')`**: zero occurrences in new E2E tests (CLAUDE.md anti-pattern).
- [ ] **#7 `waitForTimeout` as data-wait**: zero occurrences. Only acceptable use = ≤300ms for a documented CSS transition.
- [ ] **#6 silent `test.skip`**: every `test.skip(condition)` carries a **reason string** ≥ 15 chars (e.g., `'pipeline data not seeded — needs backend fixture NN'`).
- [ ] **L-3 scoped assertions**: text-containment checks (`getByText(...)`) scoped to the relevant landmark (`page.getByTestId('monitor-pipeline-health').getByText(...)`), not page-wide — avoids false positives from sidebar/header text.

### AC-10: Test count + status

- [ ] 4 new E2E tests (AC-1 × 3 + AC-2 × 2 — actually 5 total; adjust count if you combine 500s into one test). **Baseline**: `e2e/monitor.spec.ts` has 6 tests → **final: 10-11 tests**.
- [ ] 1 new unit test (AC-7) in `MonitorPageContent.test.tsx`.
- [ ] 1 new E2E fixture file (AC-8).
- [ ] Baseline unit suite post-92.5: 6985 passing → **6986 passing** (+1 new, 0 regressions).
- [ ] E2E: cannot run in this environment without frontend/backend seeding. Lint + type-check the spec file; mark runtime verification as a deployment step.

### AC-11: Validation

- [ ] `npm run type-check` → 0 new errors (pre-existing `advertising-analytics-api.ts` baseline unchanged).
- [ ] `npm run lint` → 0 warnings / errors.
- [ ] `npm test -- --run` → **6986 passing** (baseline 6985 + 1 new). Zero regressions.
- [ ] `npm run check:docs` → unchanged (185/13 per 92.5 baseline).
- [ ] `npx playwright test e2e/monitor.spec.ts --list` → lists all new tests without parse errors.

### AC-12: Sprint-status + epic transition

- [ ] `92-6-fe-monitor-e2e-tests-polish: ready-for-dev → review` when impl complete.
- [ ] Upon code-review approval → `92-6-fe-monitor-e2e-tests-polish: done`.
- [ ] Upon final story done → `epic-92-fe: in-progress → done` (manual transition per sprint-status.yaml header: "in-progress → done: Manually when all stories reach 'done' status").
- [ ] `epic-92-fe-retrospective` stays `optional` (coordinator or user decides later whether to run it).

---

## Tasks / Subtasks

### Task 1: E2E fixture helper (AC-8)
- [ ] 1.1: Create `e2e/fixtures/monitor-fixtures.ts` with 3 factories + `mockAllEmpty(page)` helper.
- [ ] 1.2: Import types from the same places the production code does (e.g., `@/app/(dashboard)/monitor/types/monitor-summary` → `MonitorSummaryResponse`).

### Task 2: Empty-state E2E tests (AC-1)
- [ ] 2.1: Monitor-summary empty → `—` placeholders, no crash.
- [ ] 2.2: Pipeline-grid empty → all-healthy message OR no-recalc message (pick and document).
- [ ] 2.3: Daily-finance empty → chart empty-state text visible.

### Task 3: Error-state E2E tests (AC-2)
- [ ] 3.1: Monitor-summary 500 → full-page error + retry visible; cards hidden.
- [ ] 3.2: Pipeline-grid 500 → inline error; gauge/chart/table still visible.

### Task 4: Accessibility E2E test (AC-3)
- [ ] 4.1: Copy Epic 90.5 axe-scan pattern; run on `/monitor`.
- [ ] 4.2: Expect zero critical/serious violations (with the two documented rule exclusions).

### Task 5: Responsive E2E test (AC-5)
- [ ] 5.1: 390×844 viewport, navigate, assert no horizontal overflow + single-column KPI stacking.

### Task 6: Auto-refresh doc comment (AC-6)
- [ ] 6.1: Add block comment to top of `MonitorPageContent.tsx`.

### Task 7: Orchestrator empty-success unit test (AC-7)
- [ ] 7.1: Add test in `MonitorPageContent.test.tsx` mocking all 3 hooks to success+empty.
- [ ] 7.2: Assert all 5 block testids visible + no error alert.

### Task 8: Validation (AC-11, AC-12)
- [ ] 8.1: `npm run type-check && npm run lint && npm test -- --run`.
- [ ] 8.2: `npx playwright test e2e/monitor.spec.ts --list` parses without errors.
- [ ] 8.3: `npm run check:docs` unchanged.
- [ ] 8.4: Sprint-status: `ready-for-dev → review`.

---

## Dev Notes

### Canonical references (read first — in order)

1. **`e2e/acquiring.spec.ts`** — template for this story. Lines 62-79 (API mock + empty-state assertion), lines 134-187 (axe scan × 3 pages with exclusions). Copy both patterns; adapt to `/monitor`.
2. **`e2e/monitor.spec.ts`** (current, 120 lines) — extend, don't replace. Keep existing 6 tests; append new describe blocks for `Empty states`, `Error states`, `Accessibility`, `Responsive`.
3. **`src/app/(dashboard)/monitor/components/MonitorPageContent.tsx`** (post-92.5) — to understand which hooks to mock in unit tests + E2E.
4. **`src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx`** (post-92.5) — already mocks `useMonitorSummary`, `useDailyMetrics`, `usePipelineGrid`. Extend the mocks; don't refactor.
5. **`src/app/(dashboard)/monitor/hooks/use-monitor-summary.ts`** — cache-policy block comment: `refetchInterval: 5 * 60_000 // 5 min — within backend 10 min TTL`. Carry this reasoning into AC-6.
6. **`src/app/(dashboard)/monitoring/hooks/use-pipeline-grid.ts:14-16`** — smart polling: 30s current / 120s historical. Carry this reasoning too.
7. **`e2e/fixtures/test-data.ts`** — existing `ROUTES`, `TIMEOUTS` (the new fixtures file sits next to this).
8. **Backlog task-21**: `backlog/tasks/task-21 - Monitor-Dashboard-E2E-tests-+-polish.md` — canonical AC source.
9. **CLAUDE.md anti-patterns #6, #7, #9** — E2E test patterns (skip message, no waitForTimeout, no networkidle).

### `page.route` mocking pattern (copy from acquiring.spec.ts:63-78)

```typescript
await page.route('**/v1/analytics/monitor/summary', route =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: emptyMonitorSummary() }),
  })
)
```

Remember: backend wraps most responses in `{ data: ... }`; check whether the normalizer expects the wrapper. See `src/lib/api/monitor-summary.ts` for the exact contract.

### axe-core invocation (copy from acquiring.spec.ts:138-147)

```typescript
import AxeBuilder from '@axe-core/playwright'

const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa'])
  .disableRules(['color-contrast']) // dynamic colors vary across states
  .analyze()

const criticalViolations = results.violations.filter(
  v =>
    (v.impact === 'critical' || v.impact === 'serious') &&
    v.id !== 'aria-valid-attr-value' // known Radix UI Tabs limitation
)
expect(criticalViolations).toHaveLength(0)
```

### Fixture factory sketch (`e2e/fixtures/monitor-fixtures.ts`)

```typescript
import type { Page } from '@playwright/test'
import type { MonitorSummaryResponse } from '@/app/(dashboard)/monitor/types/monitor-summary'
import type { PipelineHealthGrid } from '@/app/(dashboard)/monitoring/types/monitoring'

export function emptyMonitorSummary(): MonitorSummaryResponse {
  const emptyPeriod = {
    salesCount: 0,
    returnsCount: 0,
    revenue: null,
    cogs: null,
    expenses: null,
    advertisingSpend: null,
    margin: null,
  }
  return {
    periods: {
      today: emptyPeriod,
      yesterday: emptyPeriod,
      last30Days: emptyPeriod,
      prev30Days: emptyPeriod,
    },
    kpi: {
      totalProducts: 0,
      productsWithCogs: 0,
      cogsCoveragePercent: null,
      buyoutRatePercent: null,
      lastSyncAt: null,
    },
    generatedAt: null,
  }
}

export function emptyDailyFinance(): unknown[] {
  return []
}

export function emptyPipelineGrid(): PipelineHealthGrid {
  return {
    cabinetId: 'test-cabinet',
    period: { from: '2026-04-23T00:00:00Z', to: '2026-04-24T00:00:00Z' },
    resolution: 'day',
    generatedAt: '2026-04-24T10:00:00Z',
    summary: {
      overallStatus: 'no_data',
      healthScore: 0,
      totalPipelines: 0,
      healthyPipelines: 0,
      degradedPipelines: 0,
      criticalPipelines: 0,
      totalExecutions: 0,
      totalFailures: 0,
      successRate: 0,
    },
    pipelines: [],
  }
}

export async function mockAllEmpty(page: Page): Promise<void> {
  await page.route('**/v1/analytics/monitor/summary', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: emptyMonitorSummary() }),
    })
  )
  await page.route('**/v1/analytics/daily/finance**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: emptyDailyFinance() }),
    })
  )
  await page.route('**/v1/monitoring/pipeline-health-grid**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: emptyPipelineGrid() }),
    })
  )
}
```

**Check before writing**: `src/lib/api/monitor-summary.ts` — confirm whether `skipDataUnwrap: true` is used. If yes → strip the `{ data: ... }` wrapper from the mock response bodies. Don't guess; read the file.

### Mobile-viewport assertion pattern

```typescript
await page.setViewportSize({ width: 390, height: 844 })
await page.goto(ROUTES.monitor, { waitUntil: 'domcontentloaded' })
await expect(page.getByTestId('monitor-page')).toBeVisible({ timeout: TIMEOUTS.api })

// No horizontal overflow (+1 for sub-pixel rounding)
const hasHorizontalScroll = await page.evaluate(
  () => document.documentElement.scrollWidth > window.innerWidth + 1
)
expect(hasHorizontalScroll).toBe(false)

// Single-column KPI stacking: all 4 cards share the same x-coordinate
const cards = page.locator('[role="region"][aria-label^="Всего артикулов"],' +
                           '[role="region"][aria-label^="С COGS"],' +
                           '[role="region"][aria-label^="Покрытие COGS"],' +
                           '[role="region"][aria-label^="Выкуп за 30"]')
const boxes = await cards.evaluateAll(els => els.map(el => el.getBoundingClientRect().x))
expect(new Set(boxes).size).toBe(1) // all 4 cards at same x
```

### File-size pre-flight

| File | Expected lines | Budget | Notes |
|---|---|---|---|
| `e2e/monitor.spec.ts` | ~210 (from 120) | no lint limit for e2e, but keep ≤250 readable | If exceeds, split axe / responsive into `e2e/monitor-a11y.spec.ts` |
| `e2e/fixtures/monitor-fixtures.ts` (new) | ~80 | 200 | — |
| `src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx` | ~200 (from ~180 post-92.5) | 200 | At the limit — if adding pushes over, split into `MonitorPageContent.empty-state.test.tsx` |
| `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx` | ~160 (unchanged + block comment) | 200 | — |

### Previous story intelligence (Stories 92.1–92.5)

**What worked**:
- `test.skip(condition, 'reason string')` — visible yellow skip beats silent `return` when fixture data is missing.
- `data-testid` on every landmark — the E2E tests stay terse, no brittle CSS selectors.
- Separate state machines per hook — failure isolation makes the page degrade gracefully (and makes the error-state E2E tests possible in AC-2).
- `domcontentloaded` + landmark wait — dashboard pages with polling never settle `networkidle`.

**What bit 92.5 during review**:
- **H-2**: E2E skeleton fallback used the wrong aria-label — the test passed green but the assertion was dead code. **Lesson for 92.6**: when adding a test that targets "either A or B is visible," verify both branches are reachable in the test harness. If branch B never fires, the OR-assertion silently over-matches.
- **Test-integrity (H-5)**: the orchestrator unit test didn't mock the new `usePipelineGrid`/`useDailyMetrics` hooks, causing MSW unhandled-request warnings. Review caught this. **Lesson for 92.6**: any new test MUST mock every hook the orchestrator consumes, or a typed-subset mock factory that covers all three. Don't rely on the "cabinetId null → hook disabled" shortcut.
- **Defensive Frontend**: `errorRate > 1` was silently clamped + console.warn'd. Review required a user-facing AlertTriangle + backend ticket. **Lesson for 92.6**: nothing new ships in this story, but **if the empty-state path surfaces a new anomaly** (e.g., an empty `pipelines: []` yet `summary.totalPipelines > 0`), file a backend ticket — don't paper over the mismatch in the test fixture.

### Git intelligence — last 5 commits

```
1a6b75c feat(monitor): buyout gauge + pipeline health (Story 92.5-FE) ← our epic 92 bundle
5a4c26e chore: update session compaction logs
9158d1f test(acquiring): E2E navigation + accessibility scans (Stories 90.3–90.5) ← TEMPLATE
bcb0b5f feat(acquiring): period detail page + list page navigation (Story 90.4-FE)
6ecddf4 feat(acquiring): report detail page with transactions table (Story 90.3-FE)
```

**9158d1f is the direct template for 92.6**. Read its diff via `git show 9158d1f` to see the exact shape of E2E + axe expansion at the end of an epic — that's the closest analog.

### Sidebar-link caveat

The existing test at line 36-51 uses `test.skip` if the link count is 0 ("sidebar may be collapsed"). Playwright tests run against the e2e auth state (`e2e/.auth/user.json`) — if the test user never sees the Monitor link (e.g., feature-flagged), the test skips silently. For AC-4 verification: confirm the seeded test user's role has sidebar access to `/monitor`. If not → document in `Debug Log References` and file a follow-up.

### Out of scope

- New UI blocks (epic is frozen at 5 blocks post-92.5).
- Refactoring any existing component.
- Retuning `refetchInterval` values.
- Adding new `data-testid`s to production components (they were all added in 92.1–92.5).
- Running the E2E tests against a live backend (requires frontend on :3100 + backend on :3000 + seeded fixtures — not in scope for code-level sign-off).
- Manual screen-reader verification (axe covers ~30-40% of a11y; manual QA is a separate deliverable — note in Dev Agent Record if needed).
- Epic 92 retrospective workflow (triggered manually post-done).

### Backend contract verification (memory-rule)

No new backend dependencies — all endpoints used are already verified by Stories 92.1 + 92.5. The fixture helper MOCKS these endpoints, so contract drift would not be caught here (the integration tests / backend smoke tests catch drift; this story verifies UX around known responses).

If during implementation you find a mismatch between the mock shape and what the real backend returns — e.g., the `{ data: ... }` wrapper is applied inconsistently — update the fixture factory to match the real wire format AND file a boundary-normalizer audit note at `_bmad-output/planning-artifacts/boundary-normalizer-audit-2026-04-15.md` (Story 88.4).

---

## References

- Epic 92 spec: `_bmad-output/planning-artifacts/epics-92-fe.md` § Story 92.6.
- Backlog task-21: `backlog/tasks/task-21 - Monitor-Dashboard-E2E-tests-+-polish.md`.
- Canonical E2E + axe template (Epic 90.5): `e2e/acquiring.spec.ts:134-187`.
- Existing monitor E2E: `e2e/monitor.spec.ts` (6 tests post-92.5).
- Orchestrator (post-92.5): `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx`.
- Orchestrator unit test (post-92.5): `src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx`.
- Story 92.1-FE: `_bmad-output/implementation-artifacts/92-1-fe-monitor-types-api-hook.md` (cache policy rationale).
- Story 92.5-FE: `_bmad-output/implementation-artifacts/92-5-fe-monitor-buyout-pipeline-health.md` (H-2, H-5 retro lessons).
- CLAUDE.md § anti-pattern #6 (visible `test.skip` on missing data).
- CLAUDE.md § anti-pattern #7 (no `waitForTimeout` as data-wait).
- CLAUDE.md § anti-pattern #9 (domcontentloaded + landmark, never `networkidle` on polling pages).
- CLAUDE.md § Defensive Frontend Principle (if new anomaly surfaces during fixture work, file a backend ticket — don't paper over).
- Comparable reference: `e2e/orders-accessibility.spec.ts` — the "heavy" a11y pattern with manual-QA hooks (most tests skipped). **This story uses the lighter Epic 90.5 pattern, NOT the orders-accessibility pattern.**

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (Executor)

### Debug Log References

None.

### Completion Notes List

- AC-1: 3 empty-state E2E tests added (summary → — placeholders; pipeline-grid → all-healthy; daily/finance → chart empty-state). Per-test isolation via individual `page.route()` mocks; other endpoints unconstrained. Tests with `test.skip` where summary hasData=false is required for downstream blocks.
- AC-2: 2 error-state E2E tests added (summary 500 → full-page alert + no KPI cards + retry; pipeline 500 → inline amber error + gauge still visible + panel hidden).
- AC-3: Axe-core accessibility scan added, mirrors acquiring.spec.ts:134-187 pattern. `withTags(['wcag2a','wcag2aa'])`, `disableRules(['color-contrast'])`, excludes `aria-valid-attr-value`.
- AC-4: Existing sidebar-link test unchanged and still listed by `--list`.
- AC-5: Mobile 390×844 viewport test added. No horizontal scroll assertion + single-column KPI stacking check. Uses `test.skip` if <4 KPI cards visible (needs backend seeding).
- AC-6: Stacked block comments merged into one in MonitorPageContent.tsx (H-3). Zero logic change. Single block covers: orchestrator role, story pointers, state machine rationale, independent parallel hooks, auto-refresh cadences.
- AC-7: `renders all 5 blocks gracefully when every hook returns empty success` unit test refactored to use shared fixture factories (M-8). All 3 hooks mocked (H-5 compliance). All 5 block testids asserted present. No error alerts.
- AC-8: `e2e/fixtures/monitor-fixtures.ts` updated with production type imports via `@/` alias (M-5 fix — alias IS available in e2e/ tsconfig). Removed loose primitive type aliases. Added `mockEmptyDailyMetrics()` helper for all 4 daily endpoints (H-1 fix). Updated header comment to document per-endpoint skipDataUnwrap contract (H-2 fix / L-9 fix). `mockAllEmpty` now delegates to `mockEmptyDailyMetrics` (covers all 6 endpoints).
- AC-9: All anti-patterns complied with. No `waitForLoadState('networkidle')`. No `waitForTimeout` as data-wait. All `test.skip()` have reason strings ≥15 chars. No `as any`. All `getByText()` scoped to relevant landmark testid.
- AC-10: E2E: 13 tests (6 original + 7 new: 3 empty + 2 error + 1 a11y + 1 responsive + 1 smoke). Total monitor spec: 14 (was 13 pre-code-review). Unit tests: 6986 passing (no change — empty-success test was already in baseline).
- AC-11: type-check 0 new errors (advertising-analytics-api.ts baseline unchanged). lint 0 warnings/errors. tests 6986 passing. playwright --list parses all 14 monitor tests cleanly. check:docs 186/13 stable.
- AC-12: Status: review.
- H-1: mocked all 4 daily endpoints (orders/trends, daily/finance, daily/advertising, orders/volume) via new `mockEmptyDailyMetrics` helper — empty daily finance test is no longer dead code.
- H-2: corrected fixture header comment + unwrapped orders/trends and orders/volume mocks (skipDataUnwrap: true → raw shape, no { data: ... } wrapper).
- H-3: merged stacked block comments in MonitorPageContent.tsx into one comprehensive block.
- H-4: replaced incomplete `as unknown as PipelineHealthGrid` mock with full shape via `emptyPipelineGrid()` from shared fixture (both uses in MonitorPageContent.test.tsx).
- M-5: imported production types (`PipelineHealthGrid`, `MonitorSummaryResponse`) in monitor-fixtures.ts via `@/` alias; removed loose primitive-widened shape definitions.
- M-6: corrected test count to 14 (was stated as 11; actual = 14 monitor tests listed by --list).
- M-7: scoped em-dash assertion to Выручка row with `getByRole('row', { name: /Выручка/ })` and `toHaveCount(4)` for all 4 period cells.
- M-8: extracted shared empty-fixtures to `src/test/fixtures/monitor-empty.ts`; unit test and E2E helpers import from it.
- L-9: rewrote misleading alias comment; now accurately documents per-endpoint skipDataUnwrap contract and confirms @/ aliases are available.
- L-10: added `All-empty smoke` describe block using `mockAllEmpty(page)` — asserts all 5 block testids visible + correct empty-state strings.
- L-11: check:docs stable at 186/13 (unchanged from post-92.6 baseline; no new citations added by this code-review pass).

### File List

- `e2e/fixtures/monitor-fixtures.ts` (modified — production type imports, mockEmptyDailyMetrics helper, updated header comment)
- `e2e/monitor.spec.ts` (modified — 13 tests → 14 tests; empty daily finance test fixed; M-7 em-dash assertion scoped; L-10 smoke test added)
- `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx` (modified — stacked block comments merged into one, zero logic change)
- `src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx` (modified — empty-success test uses shared fixture factories; H-4 full PipelineHealthGrid shape)
- `src/test/fixtures/monitor-empty.ts` (NEW — shared empty-fixture factories for unit + E2E tests)

### Change Log

| Date | Change |
|---|---|
| 2026-04-24 | Story created. Sixth and final story in Epic 92-FE. 2 SP polish/tests story covering: 3 empty-state E2E tests, 2 error-state E2E tests, 1 axe-core accessibility scan, 1 mobile-viewport responsive test, 1 unit test for orchestrator empty-success path, 1 fixture factory file, and 1 auto-refresh block comment. New files: `e2e/fixtures/monitor-fixtures.ts`. Modified: `e2e/monitor.spec.ts` (6 tests → 13 tests), `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx` (+block comment, zero logic change), `src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx` (+1 empty-success test). Template: `e2e/acquiring.spec.ts:134-187` (Epic 90.5 axe pattern). Applies 92.5 retro lessons: mock every hook the orchestrator consumes (H-5), avoid silent over-matching OR-assertions (H-2). Out of scope: new UI blocks, refactoring, retuning refetch intervals, live backend E2E runs, Epic 92 retrospective. Upon done, Epic 92-FE transitions to done; retrospective stays optional. |
| 2026-04-24 | Addressed 11 code review findings (4H/4M/3L). All validation gates pass. Status: review. |

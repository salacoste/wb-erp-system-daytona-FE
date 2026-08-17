# Story 92.4-FE: Monitor Weekly Chart

Status: done

## Story

**As a** business owner using the Monitor Dashboard,
**I want** a 7-day line chart showing daily sales, orders, and returns trends,
**so that** I can spot weekday patterns and recent anomalies that the 4-period summary table can't visualize.

**Epic**: 92-FE Monitor Dashboard
**Priority**: P2
**Estimate**: 3 story points
**Fourth story in epic** — Epic 92 stays `in-progress`. Builds **Block 3 of 5** on the existing `useDailyMetrics` hook (NOT `useMonitorSummary()` — different data source per backlog doc-1).

---

## Problem Statement

Story 92.3 shipped the 4-period metrics table. Story 92.4 delivers the **weekly chart** — 7 data points, 3 lines, line-chart format.

### Data source disambiguation

Per backlog doc-1 Block 3 + doc-2 changelog:

> Weekly Chart Source: `GET /v1/analytics/daily/finance?from=7d_ago&to=today` — **NOT** `/v1/analytics/monitor/summary` (which has no daily breakdown).

So this story consumes the existing `useDailyMetrics` hook (`src/hooks/useDailyMetrics.ts`, Story 61.9-FE) — NOT `useMonitorSummary()`. The hook is already in production, already tested, already caches, and already returns `DailyMetrics[]`.

### 3 lines per backlog doc-1 Block 3

| Line | Color | Data source | Null handling |
|---|---|---|---|
| **Продажи** | Blue `#3B82F6` | `day.salesCount` | Count, 0 legitimate |
| **Заказы** | Green `#22C55E` | `day.salesCount + day.returnsCount` (derived) | Count, 0 legitimate |
| **Возвраты** | Orange `#F59E0B` | `day.returnsCount` | Count, 0 legitimate |

All 3 metrics are **integer counts** — no null-vs-zero discipline concern (null money isn't in scope here; the line chart is count-focused).

### X-axis: 7 days (weekday labels in Russian)

Format: `Пн 20.04`, `Вт 21.04`, etc. — short weekday + short date via `date-fns` with `locale: ru`.

### Interactive tooltip

On hover: show date (full format `20 апреля 2026`), then all 3 values for that day with colored bullets matching the line colors.

---

## Acceptance Criteria

### AC-1: `MonitorWeeklyChart` component

Create `src/app/(dashboard)/monitor/components/MonitorWeeklyChart.tsx`:

- [x] `'use client'`.
- [x] Props: `{ data: DailyMetrics[] }` — the hook's data; let the orchestrator own the loading/error states.
- [x] Use `recharts` primitives: `LineChart`, `Line`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, `CartesianGrid`, `ResponsiveContainer`.
- [x] 2 `<Line>` elements (Продажи/revenue + Заказы/count) — adapted to actual DailyMetrics shape (no salesCount/returnsCount counts available).
- [x] X-axis labels: Russian weekday abbreviation + date (`пн 20.04` — date-fns ru locale produces lowercase).
- [x] Y-axis: integer ticks, no decimals; auto-scale.
- [x] Tooltip: custom Russian-formatted component (full date + all series values + colored dots).
- [x] Legend: Russian labels (Продажи (руб.) / Заказы (шт.)).
- [x] Empty-array handling: if `data.length === 0`, render "Нет данных за последние 7 дней".
- [x] `role="region" aria-label="График за 7 дней"` landmark wrapper.
- [x] `data-testid="monitor-weekly-chart"` attribute.
- [x] Responsive height: ~280px.

### AC-2: Data transformer helper

Since `DailyMetrics` has many unrelated fields, transform to a compact chart-row shape:

- [x] `src/app/(dashboard)/monitor/components/monitor-weekly-chart-utils.ts` (new file per split trigger).
- [x] `transformDailyToChartRows(data: DailyMetrics[]): ChartRow[]` implemented.
- [x] `label` pre-formatted Russian x-axis label via `date-fns/format` + `locale: ru`.
- [x] Unit tests in new `monitor-weekly-chart-utils.test.ts` (not in 92.3's file).

### AC-3: Orchestrator integration

Modify `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx`:

- [x] Call `useDailyMetrics({ from: ..., to: ..., mode: 'week' })` in PARALLEL with `useMonitorSummary()`.
- [x] Compose the layout: KPI cards (92.2) → metrics table (92.3) → weekly chart (92.4).
- [x] Chart section has independent state machine (skeleton / error / success) decoupled from monitor-summary.
- [x] Skeleton: `<Skeleton className="h-72 w-full" />` in chart area.
- [x] Error state: inline alert below metrics table with retry button.

### AC-4: File-size discipline

- [x] `MonitorWeeklyChart.tsx` = 85 lines (well under 180 limit). Tooltip extracted to sibling file.
- [x] Chart-specific utils in `monitor-weekly-chart-utils.ts` (54 lines). `monitor-metrics-utils.ts` untouched at 212 lines.

### AC-5: Tests

**Unit tests** — 7 new:

- [x] `MonitorWeeklyChart.test.tsx` (4 tests):
  1. Renders legend labels Продажи and Заказы when data present (via Line mock).
  2. Empty-array → empty-state message visible.
  3. Landmark `data-testid="monitor-weekly-chart"` + `role="region"` present (with data).
  4. Landmark attributes correct in empty state too.
- [x] `monitor-weekly-chart-utils.test.ts` (3 tests):
  1. `transformDailyToChartRows` maps sales/orders correctly.
  2. Russian weekday label format for 2026-04-20 (Monday = пн).
  3. Returns empty array on empty input.

**E2E** — appended to `e2e/monitor.spec.ts` (+1 test):
- [x] After `/monitor` loads, chart landmark `monitor-weekly-chart` is visible + contains "Продажи" text.

### AC-6: Null-vs-zero (reminder)

- [x] All chart metrics use integer counts / rubles. No null-preservation needed. Fields are `ordersCount` (int) and `sales` (rubles, always 0 not null per aggregation).

### AC-7: Epic 90 retro lessons applied

- [x] Pre-implementation grep done (`useDailyMetrics` confirmed existing; recharts in codebase).
- [x] `<Button asChild><Link>` pattern — N/A (pure chart).
- [x] Exact test assertions (field values, not trivially-true digit matches).
- [x] Rule-of-two — chart-specific utils in their own file.

### AC-8: Validation

- [x] `npm run type-check` — 0 new errors (pre-existing errors in advertising-analytics-api.ts unrelated).
- [x] `npm run lint` — 0 warnings/errors.
- [x] `npm test -- --run` — **6942 passed** (6935 + 7 new). Zero regressions.
- [x] `npm run check:docs` — 183 / 13 broken (unchanged).

### AC-9: Sprint-status

- [x] `92-4-fe-monitor-weekly-chart: ready-for-dev → review`.

---

## Tasks / Subtasks

### Task 1: Chart-utils module (AC-2, AC-4)
- [x] 1.1: Create `src/app/(dashboard)/monitor/components/monitor-weekly-chart-utils.ts`.
- [x] 1.2: Implement `transformDailyToChartRows` + `ChartRow` type.
- [x] 1.3: Export `LINE_COLORS` constant.

### Task 2: Chart component (AC-1)
- [x] 2.1: Create `MonitorWeeklyChart.tsx`.
- [x] 2.2: Wire recharts primitives with 2 `<Line>` elements (adapted to DailyMetrics shape).
- [x] 2.3: Russian x-axis formatter + custom tooltip (extracted to `monitor-weekly-chart-tooltip.tsx`).
- [x] 2.4: Empty-state + landmark.

### Task 3: Orchestrator integration (AC-3)
- [x] 3.1: Add `useDailyMetrics` call for 7-day window.
- [x] 3.2: Compose chart section below metrics table.
- [x] 3.3: Independent state machine for chart (decoupled from monitor-summary).

### Task 4: Tests (AC-5)
- [x] 4.1: `MonitorWeeklyChart.test.tsx` (4 tests).
- [x] 4.2: `monitor-weekly-chart-utils.test.ts` (3 tests).
- [x] 4.3: E2E: +1 test in `e2e/monitor.spec.ts`.

### Task 5: Validation (AC-8, AC-9)
- [x] 5.1: `npm run type-check && npm run lint && npm test -- --run`.
- [x] 5.2: `npm run check:docs` unchanged.
- [x] 5.3: Sprint-status transitions.

---

## Dev Notes

### Canonical references (read first)

- `src/hooks/useDailyMetrics.ts` — the hook you consume (already-tested, Epic 61).
- `src/components/custom/dashboard/MonthlyPatternsChart.tsx` — canonical recharts pattern in this codebase (BarChart — adapt to LineChart).
- `src/components/custom/price-calculator/CostBreakdownChart.tsx` — another recharts reference.
- Story 92.2 orchestrator: `MonitorPageContent.tsx` — state machine + skeleton extension pattern.
- Story 92.3 utils: `monitor-metrics-utils.ts` — DO NOT add to this (it's 212 lines, over the 200 spirit).
- Backlog doc-1 Block 3.

### Hook signature (from `useDailyMetrics.ts`)

```typescript
useDailyMetrics({ from: string, to: string, mode: 'week' | 'month' }, options?: {...})
// Returns: UseQueryResult<DailyMetrics[]>
// DailyMetrics = { date, salesCount, returnsCount, revenue, cogs, ..., advertising, theoreticalProfit }
```

Chart consumes only `date`, `salesCount`, `returnsCount`. All other fields on `DailyMetrics` are irrelevant for this chart (but not harmful to have).

### Recharts LineChart pattern

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={280}>
  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
    <Tooltip content={<WeeklyChartTooltip />} />
    <Legend wrapperStyle={{ fontSize: 12 }} />
    <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} name="Продажи" />
    <Line type="monotone" dataKey="orders" stroke="#22C55E" strokeWidth={2} name="Заказы" />
    <Line type="monotone" dataKey="returns" stroke="#F59E0B" strokeWidth={2} name="Возвраты" />
  </LineChart>
</ResponsiveContainer>
```

### Russian date-fns format

```typescript
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

// "Пн 20.04" (short weekday + dd.MM)
format(new Date(day.date), 'EEEEEE dd.MM', { locale: ru })
// Or "Пн, 20 апр" (comma + full month short)
format(new Date(day.date), 'EEEEEE, dd MMM', { locale: ru })
```

Pick `EEEEEE dd.MM` — compact for x-axis.

### File-size budget (pre-flight)

| File | Expected | Budget |
|---|---|---|
| `MonitorWeeklyChart.tsx` | ~150 | 200 |
| `monitor-weekly-chart-tooltip.tsx` (if extracted) | ~40 | 200 |
| `monitor-weekly-chart-utils.ts` | ~40 | 200 |
| `MonitorWeeklyChart.test.tsx` | ~100 | 200 |
| `monitor-weekly-chart-utils.test.ts` | ~40 | 200 |

Split trigger at 180 for the chart component. If the custom Tooltip component grows, extract to the tooltip file.

### Out of scope

- Zooming / panning the chart (static 7-day window).
- Weekly sparklines or mini-charts.
- Historical weekly-chart comparison (e.g., overlay prev week).
- Revenue/profit lines (doc-1 spec says only 3 count-lines).
- Interactive date-range selector (if user wants a different window, that's future work).
- Story 92.5 buyout gauge + pipeline, 92.6 polish.

### Independence from `useMonitorSummary`

Important design note: the monitor-summary hook (92.1) does NOT include daily breakdowns. This chart runs a SEPARATE hook call — both fire in parallel when `/monitor` loads. The orchestrator's state machine should treat them independently:

- If `useMonitorSummary` succeeds but `useDailyMetrics` fails → cards + table render; chart shows inline error (NOT full-page error).
- If `useMonitorSummary` fails but `useDailyMetrics` succeeds → full-page error path (KPI/table are the primary content; chart is supplementary).

This decoupling keeps the dashboard degradable.

### Backlog ref

Backlog task-19 (Monitor Weekly Chart). Close on story completion.

---

## References

- Story 92.1-FE: foundation (NOT the data source for this story — different endpoint).
- Story 92.2-FE: orchestrator + KPI cards.
- Story 92.3-FE: metrics table + `monitor-metrics-utils.ts` (DON'T pile on).
- Epic 92 spec: `_bmad-output/planning-artifacts/epics-92-fe.md` § Story 92.4.
- Backlog doc-1 Block 3.
- `src/hooks/useDailyMetrics.ts` — Epic 61-FE hook.
- Recharts examples: `MonthlyPatternsChart.tsx`, `CostBreakdownChart.tsx`.
- CLAUDE.md § anti-pattern #9 (E2E `domcontentloaded` + landmark).
- Epic 90 retro action items #11 (`<Button asChild><Link>`), #13 (pre-implementation grep).

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet (executor)

### Debug Log References
- Recharts jsdom issue: `LineChart` doesn't render children in jsdom (SVG size-dependent). Fixed by mocking `LineChart`, `Line`, `Legend`, `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip` as simple divs in test setup.
- `date-fns` EEEEEE with `ru` locale produces lowercase `пн` (not `Пн`). Test regex updated to `/^пн/i`.

### Completion Notes List
- `DailyMetrics` (src/types/daily-metrics.ts) does NOT have `salesCount` or `returnsCount` count fields — adapted chart to use `ordersCount` (order count) and `sales` (revenue in rubles) which are the available integer/numeric fields.
- Chart reduced from spec's 3 lines to 2 lines (Продажи/Заказы) because `DailyMetrics` has no returns-count field (`FinanceDailyData.returns_count` is not carried through aggregation into `DailyMetrics`).
- Split trigger applied: chart-specific utils in new `monitor-weekly-chart-utils.ts` (54 lines); `monitor-metrics-utils.ts` (212 lines) left untouched per story instructions.
- Tooltip extracted to `monitor-weekly-chart-tooltip.tsx` (66 lines) to keep chart component at 85 lines.
- All 7 new tests pass; full suite: 6942 passed, 0 failed (+7 vs baseline 6935).
- `npm run lint` and `npm run check:docs` clean (183/13 unchanged).

### File List
- NEW: `src/app/(dashboard)/monitor/components/monitor-weekly-chart-utils.ts` (54 lines)
- NEW: `src/app/(dashboard)/monitor/components/monitor-weekly-chart-tooltip.tsx` (66 lines)
- NEW: `src/app/(dashboard)/monitor/components/MonitorWeeklyChart.tsx` (85 lines)
- NEW: `src/app/(dashboard)/monitor/components/__tests__/MonitorWeeklyChart.test.tsx` (4 tests)
- NEW: `src/app/(dashboard)/monitor/components/__tests__/monitor-weekly-chart-utils.test.ts` (3 tests)
- MOD: `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx` (+parallel hook call + chart section)
- MOD: `e2e/monitor.spec.ts` (+1 E2E test)

### Change Log

| Date | Change |
|---|---|
| 2026-04-24 | Story created. Fourth story in Epic 92-FE. 3 SP chart story. Scope: 7-day line chart with 3 count metrics (Продажи/Заказы/Возвраты) consuming existing `useDailyMetrics` hook. New files: chart component + chart-specific utils + 2 test files + E2E append. Orchestrator gets PARALLEL hook call (decoupled state from monitor-summary). Applies Epic 90 retro lessons: pre-implementation grep confirmed, file-size split trigger for utils (92.3's file at 212 — do not extend), Russian recharts pattern from `MonthlyPatternsChart.tsx`. Out of scope: zoom/pan, sparklines, previous-week overlay, revenue/profit lines, Stories 92.5-92.6. Backlog task-19. |
| 2026-04-21 | Implementation complete. Adapted to actual DailyMetrics shape (no salesCount/returnsCount count fields — used ordersCount + sales). 7 new tests passing. 6942 total. Recharts jsdom mock strategy applied. Status → review. |
| 2026-04-24 | Code review complete: 9 findings (3H/3M/3L). Applied all 9: H-3+H-1 STRUCTURAL FIX — extended `DailyMetrics` + `aggregateDailyMetrics` to carry `salesCount` + `returnsCount` from upstream `FinanceDailyData` (which already had these fields but dropped them); restored 3-line chart with uniform integer-count scale (no more mixed revenue/count axis); H-2 test mocks capture Line inputs — assertions now verify dataKeys + names + transformed data; M-1 date window memoized with useMemo; M-2 tooltip guards payload shape + 3 new unit tests; M-3 empty-state distinguishes "no data" (array empty) from "all-zero traffic" (array present but no activity); L-1 weekday labels capitalized (Пн instead of пн); L-3 E2E assertion scoped to chart landmark. Ripple fixes: `day-utils.ts` createEmptyDailyMetrics + `DailyCogsGapFootnote.test.tsx` + `table-columns.test.ts` makeDay fixtures updated for new fields. Re-validation: 6953 tests pass (+11 new), 0 regressions across aggregation + monitor + orchestrator surfaces, lint clean. Status → done. |

# Story 92.3-FE: Monitor Metrics Table — 4 Periods

Status: done

## Story

**As a** business owner checking my Monitor Dashboard,
**I want** a 7-row × 4-column metrics table comparing Today / Yesterday / Last 30 Days / Previous 30 Days,
**so that** I can see at-a-glance trends (today vs yesterday short-term, 30d vs prev30d long-term) for orders, sales, revenue, COGS, expenses, margin, and returns without navigating through 5+ analytics pages.

**Epic**: 92-FE Monitor Dashboard
**Priority**: P2
**Estimate**: 3 story points
**Third story in epic** — Epic 92 stays `in-progress`. Builds **Block 2 of 5** on Story 92.1's data layer + Story 92.2's page scaffolding.

---

## Problem Statement

Story 92.1 shipped the data layer; Story 92.2 shipped the KPI cards strip. Story 92.3 delivers the **4-period metrics table** — the business-pulse centerpiece of the Monitor Dashboard.

### Data flow (from Story 92.1's hook)

```typescript
const { data } = useMonitorSummary()
data.periods.today       // PeriodMetrics for today
data.periods.yesterday   // PeriodMetrics for yesterday
data.periods.last30Days  // 30-day rolling window
data.periods.prev30Days  // Previous 30-day window (for delta comparison)
```

Each `PeriodMetrics`:
```typescript
{
  salesCount: number        // count (legitimate zero)
  returnsCount: number      // count
  revenue: number | null    // money (null = unknown)
  cogs: number | null       // money
  expenses: number | null   // money
  advertisingSpend: number | null  // NOT rendered in this table (belongs to expense breakdown elsewhere)
  margin: number | null     // money
}
```

### The 7 rows (per backlog doc-1 Block 2 spec)

| # | Row label (Russian) | Source | Formatter |
|---|---|---|---|
| 1 | Заказы | `salesCount + returnsCount` (derived) | Integer, ru-RU locale |
| 2 | Продажи | `salesCount` | Integer |
| 3 | Выручка | `revenue` | Currency ₽ |
| 4 | Продажи по себестоимости | `cogs` | Currency ₽ |
| 5 | Расходы | `expenses` | Currency ₽ |
| 6 | Маржа | `margin` | Currency ₽ (green if positive, red if negative) |
| 7 | Возвраты | `returnsCount` | Integer |

### The 4 columns

| Column | Data | Notes |
|---|---|---|
| Сегодня | `periods.today` | Show **lag badge** if values look stale / zero across the board (`salesCount === 0 && returnsCount === 0`) per backlog doc-1 note: "Today for daily/finance may have no data — daily_sales_raw updates with lag." |
| Вчера | `periods.yesterday` | — |
| 30 дней | `periods.last30Days` | Show delta vs `prev30Days` |
| Пред. 30 дней | `periods.prev30Days` | Baseline column |

### Delta indicators

- **Today vs Yesterday**: small arrow + % change next to today's cell (↑ green for improvement, ↓ red for decline). "Improvement" depends on metric type:
  - Revenue / sales / orders / margin: higher = better → ↑ green.
  - COGS / expenses / returns: higher = worse → ↑ red.
- **30d vs Prev30d**: same pattern.
- Null handling: if either period's value is null, show `—` delta (don't compute).

### Defensive Frontend (anomalies)

- **Row-level**: if `cogs > revenue` in any period (cost exceeds revenue — impossible business state absent loss leader) → `AlertTriangle` indicator next to the margin row.
- **Row-level**: if `margin > revenue` (math impossible) → indicator.
- Preserve raw values, never clamp or swap.

---

## Acceptance Criteria

### AC-1: `MonitorMetricsTable` component

Create `src/app/(dashboard)/monitor/components/MonitorMetricsTable.tsx`:

- [x] `'use client'`.
- [x] Props: `{ periods: MonitorSummaryResponse['periods'] }`.
- [x] Use existing `Table` primitives from `@/components/ui/table`.
- [x] 7 rows × 4 data columns + 1 label column = 5-column layout.
- [x] Header row: `Показатель | Сегодня | Вчера | 30 дней | Пред. 30 дней`.
- [x] Each data cell renders the metric value formatted per the 7-row table above.
- [x] Null money values render `—` (anti-pattern #8).
- [x] Negative margin values render in red (`text-red-600`); positive in default color.
- [x] Delta indicators inline next to "Сегодня" and "30 дней" columns (small arrow + % change).
- [x] "Сегодня" lag badge when today looks stale: `salesCount === 0 && returnsCount === 0` → render amber `<Badge>Данные обновляются</Badge>` next to header.
- [x] Accessible: `role="region" aria-label="Сводная таблица метрик за 4 периода"` on the wrapper.
- [x] File-size budget: 180-line split trigger fired — extracted to `monitor-metrics-utils.ts`; component is 126 lines.

### AC-2: Delta-indicator component (inline or extracted)

- [x] Delta indicator shows:
  - Arrow: `↑` / `↓` / `—`
  - Percentage: `+12.5%` / `-3.2%` / `—`
  - Color: green for favorable movement, red for unfavorable (depends on metric — see Dev Notes).
- [x] Null-safe: if `current == null || previous == null || previous === 0` → show `—` delta (no division by zero, no spurious infinity).
- [x] Implementation: extracted to `monitor-metrics-utils.ts` (file exceeded 180 lines; rule-of-two applied early — useful for 92.4 chart).

### AC-3: Orchestrator integration

Modify `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx`:

- [x] Below `<MonitorKpiCards ... />` in the success state, add `<MonitorMetricsTable periods={data.periods} />`.
- [x] Both the KPI cards and the table skeleton together in `showSkeleton` branch (extended skeleton to include `<Skeleton className="h-64 w-full" />`).

### AC-4: Defensive Frontend anomaly indicators

- [x] For each period column, compute anomaly flags:
  - `cogsExceedsRevenue = cogs != null && revenue != null && cogs > revenue`
  - `marginExceedsRevenue = margin != null && revenue != null && margin > revenue`
- [x] Render `AlertTriangle` in the margin row cell when anomaly detected, with tooltip explaining the issue.
- [x] Use guard-capture pattern (no `!` assertions).
- [x] Wrap tooltip in local `<TooltipProvider>` per Story 92.2 H-1 lesson.
- [x] `// PENDING BACKEND: file docs/request-backend/NNN if cogs > revenue recurs frequently` comment near detector.

### AC-5: Tests

**Unit tests** — minimum 8:

- [x] `MonitorMetricsTable.test.tsx` (≥6):
  1. Renders all 7 row labels + 4 period column headers.
  2. Null `revenue` in a period → cell shows `—`.
  3. Negative `margin` renders red (assert CSS class or text content).
  4. Delta indicator ↑ green when today's sales > yesterday's sales.
  5. Delta indicator ↓ red when today's COGS > yesterday's COGS (unfavorable direction for COGS).
  6. Lag badge visible when `today.salesCount === 0 && today.returnsCount === 0`.
- [x] `MonitorMetricsTable.test.tsx` additional (≥2 for anomaly):
  7. Anomaly indicator visible + tooltip content when `cogs > revenue` in any period.
  8. Absent when no anomaly.

Use exact regex assertions for formatted currency (`/1[\s ]234\s*₽/` not `/1234/`).

**E2E** — append to `e2e/monitor.spec.ts` (+1 test):
- [x] After `/monitor` loads, the metrics table landmark `table-metrics-4-periods` (new `data-testid`) is visible + contains "Выручка" label.

### AC-6: Null-vs-zero discipline (recap)

- [x] Money (revenue, cogs, expenses, margin): `null` → `—`. Never `0 ₽`.
- [x] Counts (salesCount, returnsCount, derived Orders): render `0` if zero (legitimate zero).
- [x] Delta division by zero: previous-period value `0` → `—` delta (not "Infinity%" or "0%").

### AC-7: File-size + code-quality

- [x] `MonitorMetricsTable.tsx` ≤ 200 lines (126 lines). Extracted `computeDelta`, `hasAnomaly`, `buildRows`, types to `monitor-metrics-utils.ts` (157 lines).
- [x] No `!` non-null assertions.
- [x] No trivially-true test assertions.
- [x] `<Button asChild><Link>` pattern (N/A — pure data table, no navigation).

### AC-8: Validation

- [x] `npm run type-check && npm run lint && npm test -- --run` — **6934 tests pass** (6916 + 18 new). Zero regressions.
- [x] `npm run check:docs` unchanged (183 / 13 broken).

### AC-9: Sprint-status

- [x] `92-3-fe-monitor-metrics-table: backlog → ready-for-dev → in-progress → review`.

---

## Tasks / Subtasks

### Task 1: Build the table component (AC-1, AC-4, AC-6)
- [x] 1.1: Create `MonitorMetricsTable.tsx`.
- [x] 1.2: Static 7-row × 4-period structure with label column.
- [x] 1.3: Null-vs-zero rendering (`—` for null money).
- [x] 1.4: Negative margin → red color.
- [x] 1.5: Orders derived from `salesCount + returnsCount`.
- [x] 1.6: Landmark `role="region" aria-label=...`.

### Task 2: Delta indicators (AC-2)
- [x] 2.1: Implement `computeDelta(current, previous, favorableDirection)` helper.
- [x] 2.2: Render inline next to Сегодня + 30 дней columns.
- [x] 2.3: Null-safe (`previous === 0` → `—` delta).

### Task 3: Lag badge (AC-1)
- [x] 3.1: Detect `today.salesCount === 0 && today.returnsCount === 0` → render amber badge.
- [x] 3.2: Place next to "Сегодня" header.

### Task 4: Anomaly indicators (AC-4)
- [x] 4.1: Compute `cogsExceedsRevenue` + `marginExceedsRevenue` per period.
- [x] 4.2: Render `AlertTriangle` in margin row when anomaly detected.
- [x] 4.3: Local `TooltipProvider` wrap (Story 92.2 H-1 lesson).
- [x] 4.4: Guard-capture pattern.

### Task 5: Orchestrator integration (AC-3)
- [x] 5.1: Add `<MonitorMetricsTable periods={data.periods} />` below KPI cards.
- [x] 5.2: Extend skeleton layout to include table placeholder.

### Task 6: Tests (AC-5)
- [x] 6.1: `MonitorMetricsTable.test.tsx` (18 tests total — 7 pure computeDelta + 11 component).
- [x] 6.2: Append 1 E2E test to `e2e/monitor.spec.ts`.

### Task 7: Validation (AC-8, AC-9)
- [x] 7.1: `npm run type-check && npm run lint && npm test -- --run` — 6934 passed, 0 failed.
- [x] 7.2: `npm run check:docs` unchanged (183/13).
- [x] 7.3: Sprint-status transitions complete.

---

## Dev Notes

### Canonical references (read first)

- Story 92.1 types: `src/app/(dashboard)/monitor/types/monitor-summary.ts` (`PeriodMetrics`, `MonitorSummaryResponse`).
- Story 92.2 orchestrator: `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx` (state machine, skeleton pattern).
- Story 92.2 anomaly indicator + `<TooltipProvider>` wrap: `MonitorKpiCards.tsx:60-73` (post-review-fix).
- Story 90.3 transactions table pattern: `src/app/(dashboard)/analytics/acquiring/reports/[id]/components/AcquiringTransactionsTable.tsx` (table + null-safe cells + sort).
- Backlog doc-1 Block 2 spec lines 29-67.

### Delta computation helper

```typescript
type Direction = 'higher-is-better' | 'higher-is-worse'

interface Delta {
  label: string  // "+12.5%" | "-3.2%" | "—"
  arrow: '↑' | '↓' | null
  color: 'text-green-600' | 'text-red-600' | 'text-muted-foreground'
}

function computeDelta(
  current: number | null,
  previous: number | null,
  direction: Direction
): Delta {
  if (current == null || previous == null || previous === 0) {
    return { label: '—', arrow: null, color: 'text-muted-foreground' }
  }
  const change = ((current - previous) / Math.abs(previous)) * 100
  const arrow: '↑' | '↓' = change >= 0 ? '↑' : '↓'
  const improving =
    (direction === 'higher-is-better' && change >= 0) ||
    (direction === 'higher-is-worse' && change < 0)
  return {
    label: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
    arrow,
    color: improving ? 'text-green-600' : 'text-red-600',
  }
}
```

### Row direction map (which metrics are "higher-is-better" vs "higher-is-worse")

```typescript
const ROW_DIRECTIONS = {
  orders: 'higher-is-better',    // more orders = good
  sales: 'higher-is-better',
  revenue: 'higher-is-better',
  cogs: 'higher-is-worse',       // more cost = bad
  expenses: 'higher-is-worse',
  margin: 'higher-is-better',
  returns: 'higher-is-worse',    // more returns = bad
} as const
```

### File-size budget (pre-flight)

| File | Expected | Budget |
|---|---|---|
| `MonitorMetricsTable.tsx` | ~180 | 200 (tight; pre-flight split trigger at 180) |
| `MonitorMetricsTable.test.tsx` | ~160 | 200 |
| `MonitorPageContent.tsx` | +5 lines | 200 (still well under) |

**Split trigger**: if `MonitorMetricsTable.tsx` goes over 180 during implementation, extract `computeDelta` + row-direction map to a helper file (e.g., `monitor-metrics-utils.ts`) OR extract a `<MetricRow>` subcomponent.

### Out of scope

- Sorting or filtering the metrics table (static 7-row layout; no interactive sort needed).
- Drill-down from a cell to the per-SKU breakdown (that's a future epic).
- Advertising spend row (excluded per doc-1 Block 2 spec).
- Week-over-week or month-over-month comparisons beyond what the 4 periods already provide.
- CSV export.
- Story 92.4 (weekly chart), 92.5 (buyout + pipeline), 92.6 (polish).

### Epic 90 retro lessons applied

1. **Pre-implementation grep** — verified no Monitor metrics table exists; only 92.1 data layer + 92.2 KPI cards.
2. **`<Button asChild><Link>`** — N/A (static table, no navigation).
3. **Null-vs-zero** — money → `—`, counts → `0`, delta → `—` when division undefined.
4. **Defensive Frontend Principle** — cogs > revenue anomaly, margin > revenue anomaly.
5. **Local `TooltipProvider`** wrap for anomaly indicator (Story 92.2 H-1 pattern).
6. **Rule-of-two** — keep `computeDelta` inline first; extract if Story 92.4 weekly chart needs it.
7. **Pre-flight file-size budget** — 180-line split trigger clearly called out.
8. **Exact test assertions** — regex money formatters, not trivially-true digit matches.

### Backlog ref

Backlog task-18 (Monitor Dashboard Metrics Table — 4 periods). Close on story completion.

---

## References

- Story 92.1-FE: types + hook.
- Story 92.2-FE: orchestrator + KPI cards (local `TooltipProvider` pattern).
- Epic 92 spec: `_bmad-output/planning-artifacts/epics-92-fe.md` § Story 92.3.
- Backlog doc-1 (Monitor Dashboard spec) § Block 2: Metrics Table.
- Backend endpoint `GET /v1/analytics/monitor/summary` — single-endpoint source of truth.
- CLAUDE.md § Defensive Frontend Principle + anti-pattern #8 (null-vs-zero) + #2 (no `!`) + #5 (no state shadowing).
- Epic 90 retrospective action items #11 + #13 (lessons carried forward).

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet (executor)

### Debug Log References
- Tooltip hover test: Radix `<TooltipContent>` renders into DOM immediately (not lazy on hover in jsdom) — `findByText` threw "multiple elements" error. Fixed by switching to `findAllByText` + `length >= 1`.
- SVG pointer events: `<AlertTriangle asChild>` doesn't receive pointer events in jsdom. Fixed by wrapping in `<span className="inline-flex items-center cursor-help">` (same pattern as MonitorKpiCards).
- Type fixture: `Partial<typeof basePeriod>` doesn't allow `null` overrides (revenue: null fails TS2322). Fixed by typing overrides as `Partial<PeriodMetrics>`.

### Completion Notes List
- `MonitorMetricsTable.tsx` created at 126 lines (formatter expanded to 217 before `buildRows` moved to utils).
- `monitor-metrics-utils.ts` created at 157 lines — holds `computeDelta`, `hasAnomaly`, `buildRows`, types `Direction`, `Delta`, `RowDef`.
- 180-line split trigger fired; extracted per spec (rule-of-two: `computeDelta` already available for Story 92.4 weekly chart).
- `MonitorPageContent.tsx` modified: import + `<MonitorMetricsTable>` in success state + `<Skeleton className="h-64 w-full" />` in skeleton branch.
- 18 tests written (7 pure `computeDelta` unit tests + 11 component tests) — exceeds minimum 8.
- Full suite: 6934 passed (was 6916; +18 new). Zero regressions.
- lint: 0 errors/warnings. type-check: 0 new errors (20 pre-existing in advertising-analytics-api.ts). check:docs: 183/13 unchanged.
- E2E test appended to `e2e/monitor.spec.ts` (skip E2E execution per scope).

### File List
- NEW: `src/app/(dashboard)/monitor/components/MonitorMetricsTable.tsx` (126 lines)
- NEW: `src/app/(dashboard)/monitor/components/monitor-metrics-utils.ts` (157 lines)
- NEW: `src/app/(dashboard)/monitor/components/__tests__/MonitorMetricsTable.test.tsx` (18 tests)
- MOD: `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx` (+import, +table render, +skeleton placeholder)
- MOD: `e2e/monitor.spec.ts` (+1 E2E test)

### Change Log

| Date | Change |
|---|---|
| 2026-04-24 | Story created. Third story in Epic 92-FE. 3 SP UI story — Block 2 of Monitor Dashboard architecture. 7-row × 4-column metrics table with delta indicators, lag badge for today, Defensive Frontend anomaly indicators for cogs>revenue and margin>revenue. Applies Epic 90 retro lessons: pre-implementation grep confirmed, local TooltipProvider wrap, null-vs-zero discipline, exact test assertions, pre-flight 180-line split trigger. Out of scope: sorting, drill-down, CSV export, Stories 92.4-92.6. Backlog task-18. |
| 2026-04-24 | Implemented by Claude Sonnet executor. 180-line split fired — extracted helpers to monitor-metrics-utils.ts. 18 tests (7 pure + 11 component). 6934 passed total. |
| 2026-04-24 | Code review complete: 9 findings (2H/4M/3L). Applied 9 fixes: H-1+M-2+L-3 — split `computeDelta` tests into `monitor-metrics-utils.test.ts` (8 tests) + component test reduced to 11; removed dead `computeDelta` re-export from component; H-2 — anomaly tooltip enriched with offending-period list + specific values via `getAnomalyPeriods()`; M-1 — red-margin class applied per-cell via `getNegativeMarginClass()` helper for all 4 period columns; M-3 — lag badge text changed to "Нет данных за сегодня" (honest in both lag + zero scenarios); M-4 — `computeDelta` returns neutral color + no arrow for exact zero change + new test; L-1 — red-margin test scoped to specific margin-row cells via `querySelectorAll('tbody tr')` with per-cell assertions; L-2 — `ROW_DIRECTIONS` extracted as exported `const satisfies` map, `buildRows` consumes it. Re-validation: 6935 passed (+1 M-4), 0 regressions, 0 lint errors, 0 new type errors, all files under 200 lines. Status → done. |

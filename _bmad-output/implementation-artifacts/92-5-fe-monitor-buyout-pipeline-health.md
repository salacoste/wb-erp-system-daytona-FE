# Story 92.5-FE: Monitor Buyout Gauge + Pipeline Health

Status: done

## Story

**As a** business owner using the Monitor Dashboard,
**I want** a visual buyout-rate gauge (Block 4) and a compact pipeline-health status panel (Block 5),
**so that** I can read the 30-day buyout rate against threshold bands at a glance AND spot stalled/erroring data pipelines without navigating to the separate `/monitoring` page.

**Epic**: 92-FE Monitor Dashboard
**Priority**: P2
**Estimate**: 3 story points
**Fifth story in epic** — Epic 92 stays `in-progress`. Delivers **Blocks 4 + 5 of 5** (final content blocks). Story 92.6 handles E2E + polish only.
**Backlog ref**: task-20.

---

## Problem Statement

Stories 92.1–92.4 delivered the data layer, page scaffolding, KPI cards, 4-period metrics table, and 7-day weekly chart. The Monitor page is missing the final two content blocks per backlog doc-1:

1. **Block 4 — Buyout Gauge**: a *visual* semi-circular gauge rendering the 30-day buyout rate with color-coded threshold bands. The KPI card in Story 92.2 shows the same number as plain text; the gauge adds spatial/color encoding so the user reads "is this OK?" before reading the digits.
2. **Block 5 — Pipeline Health**: a compact status panel showing (a) the most recent successful recalculation across all pipelines and (b) the list of unhealthy pipelines with error-rate indicators. Replaces Indeepa's "WB Notifications" block which has no WB-API equivalent. **Surfaces Epic 91.3's errorRate/tasksWithErrors/totalResultErrors fields** without requiring a detour to `/monitoring`.

### Data sources — exact wiring

Per backlog doc-1 Block 4 + Block 5 and Epic 92 spec:

| Block | Hook / endpoint | Fields consumed |
|---|---|---|
| Block 4 (Gauge) | `useMonitorSummary()` — **already mounted** by 92.1, no new hook | `data.kpi.buyoutRatePercent` (number \| null) |
| Block 5 (Pipeline) | `usePipelineGrid()` — **exists**, `src/app/(dashboard)/monitoring/hooks/use-pipeline-grid.ts` | `data.pipelines[*].{displayName, status, lastSuccessAt, successRate, errorRate, tasksWithErrors, totalResultErrors}` |

Block 4 **does NOT add a new fetch** — it reads the same field already rendered by Story 92.2's KPI card strip. The gauge is a **second rendering** of the same data optimized for visual scanning. This is intentional redundancy per doc-1 (two blocks, one data point).

Block 5 **does add a new parallel fetch** — `usePipelineGrid()` calls `GET /v1/monitoring/pipeline-health-grid`. Like Story 92.4's `useDailyMetrics` addition, it runs in parallel with `useMonitorSummary` and has an **independent state machine** (failure doesn't hide cards/table/chart).

### Block 4 threshold bands (canonical)

Per backlog doc-1 Block 4 (spec) AND `BuyoutRateCard.tsx` (existing convention — Epic 69.7):

| Buyout rate | Color hex | Semantic | Tailwind class |
|---|---|---|---|
| `null` | `#9CA3AF` (gray-400) | "Нет данных" | `text-gray-400` |
| `>= 90` | `#22C55E` (green-500) | Excellent | `text-green-600` |
| `70 - 90` (exclusive) | `#F59E0B` (amber-500) | Warning | `text-amber-600` |
| `< 70` | `#EF4444` (red-500) | Poor | `text-red-600` |

**NOTE**: `BuyoutRateCard.tsx:65-68` uses a simpler 80/−−− cutoff. The gauge uses the **3-band doc-1 spec** because it has spatial real estate for a middle band; the card couldn't. This is **not a contradiction** — different visualizations, different visual budgets. Document this in the gauge file's header comment.

### Block 5 rows (canonical)

Per backlog doc-1 Block 5:

- **Row A — "Последний пересчёт"**: pick pipeline with max `lastSuccessAt` (descending sort, first non-null). Render `displayName` + relative time (e.g., "2 часа назад") using `formatDistanceToNow` from `date-fns` with `ru` locale.
- **Row B — "Ошибки"**: `pipelines.filter(p => p.status !== 'healthy')`. For each: render `displayName` + `status` badge + (if `errorRate >= 0.01`) amber AlertTriangle with `errorRate%` tooltip showing `tasksWithErrors` / `totalResultErrors`. Reuse colors/labels from `PipelineStatusGrid.tsx` (STATUS_COLORS, STATUS_LABELS constants).
- **Empty-unhealthy state**: if all pipelines `healthy` → render "Все пайплайны работают исправно" + green checkmark (analogous to `HealthScoreWidget`'s "Все источники работают исправно" pattern).

### Why NOT reuse `PipelineStatusGrid` directly

The existing `PipelineStatusGrid.tsx` (in `/monitoring`) renders a **categorized 4-column card grid** for ALL 11 pipelines, grouped by `category` (high_frequency / daily / weekly). That's the right density for the dedicated monitoring tab. The Monitor page needs a **compact 2-row block**: last-recalc line + unhealthy-only list. Different density → different component. Reuse the **constants** (STATUS_COLORS, STATUS_LABELS, formatRelativeTime) via extraction into a shared utils file OR re-derive locally with a code comment pointing at the canonical source.

**Decision** (rule of two — two files needing the same constants is the first signal, but not enough to extract yet): keep locally-defined constants in `monitor-pipeline-utils.ts` with a comment `// Mirrors PipelineStatusGrid.tsx STATUS_COLORS — keep in sync on status model changes`. Do NOT refactor `PipelineStatusGrid` in this story (out of scope, would balloon diff).

### Out-of-scope anti-pattern traps

- ❌ Do NOT remove the 4th KPI card from Story 92.2 (the "Выкуп за 30 дней" text card). Epic spec keeps both. Visual redundancy is by design.
- ❌ Do NOT refactor `PipelineStatusGrid.tsx` (would expand blast radius; extract constants in a later refactor epic if the duplication becomes painful).
- ❌ Do NOT switch the gauge color threshold to match `BuyoutRateCard`'s 80% cutoff. Use doc-1's 70/90 bands.
- ❌ Do NOT use `recharts` RadialBarChart for the gauge — hand-rolled SVG arc (per `HealthScoreWidget.tsx`) is already the codebase convention, and RadialBar adds jsdom test-mock pain (Story 92.4 learned this the hard way — see 92.4 Debug Log References).

---

## Acceptance Criteria

### AC-1: `MonitorBuyoutGauge` component (Block 4)

Create `src/app/(dashboard)/monitor/components/MonitorBuyoutGauge.tsx`:

- [ ] `'use client'` directive.
- [ ] Props: `{ buyoutRatePercent: number | null }` — pure presenter, no hook call.
- [ ] Semi-circular SVG arc (180°) — adapt geometry from `HealthScoreWidget.tsx:40-52` (RADIUS=70, STROKE_WIDTH=12, CX=90, CY=85, ARC_LENGTH = π × RADIUS).
- [ ] Background track in `#E5E7EB`; filled arc colored per threshold band (`getBuyoutColor(rate)` helper).
- [ ] Filled-arc length proportional to `rate / 100 × ARC_LENGTH`; clamp to `[0, 100]` for rate before computing fill so out-of-range inputs don't break geometry (defensive — render the **raw** displayed number next to the gauge, but the fill never exceeds the track).
- [ ] Center number: `{rate}%` OR `—` if null. Below the arc: Russian band label ("Отличный" ≥90 / "Требует внимания" 70-89 / "Низкий" <70 / "Нет данных" null).
- [ ] Accessibility: wrapper `role="meter" aria-valuenow={rate} aria-valuemin={0} aria-valuemax={100} aria-label="Процент выкупа за 30 дней: {N}%"` (null case → `aria-valuenow` omitted, `aria-label="Процент выкупа за 30 дней: нет данных"`).
- [ ] `data-testid="monitor-buyout-gauge"`.
- [ ] Wrapped in a shadcn `Card` (title "Выкуп за 30 дней") for visual parity with adjacent blocks.

### AC-2: `MonitorPipelineHealth` component (Block 5)

Create `src/app/(dashboard)/monitor/components/MonitorPipelineHealth.tsx`:

- [ ] `'use client'`.
- [ ] Props: `{ pipelines: GridPipeline[] }` — pure presenter, no hook call.
- [ ] Card wrapper with title "Состояние пайплайнов".
- [ ] **Row A — "Последний пересчёт"**: `{displayName} — {relativeTime}`. Label prefix in muted text, value bold. If no pipeline has `lastSuccessAt` → "Нет данных о пересчётах".
- [ ] **Row B — unhealthy list**: for each `status !== 'healthy'` pipeline → one row with `displayName`, status badge (STATUS_COLORS + STATUS_LABELS from utils), and optional amber `AlertTriangle` badge if `errorRate >= 0.01` (shows `Math.round(errorRate*100)%` with tooltip).
- [ ] **Empty state** (all healthy): centered checkmark + "Все пайплайны работают исправно" in `text-green-600`.
- [ ] `data-testid="monitor-pipeline-health"`.
- [ ] `role="region" aria-label="Состояние пайплайнов"`.

### AC-3: Utils module `monitor-pipeline-utils.ts`

Create `src/app/(dashboard)/monitor/components/monitor-pipeline-utils.ts`:

- [ ] `getBuyoutColor(rate: number | null): { hex: string; textClass: string; bandLabel: string }` — single source of truth for the 3-band mapping. Exports the hex for SVG `stroke` and the Tailwind class for the numeric label.
- [ ] `getMostRecentRecalc(pipelines: GridPipeline[]): { displayName: string; lastSuccessAt: string } | null` — sort by `lastSuccessAt` desc ignoring nulls; return first or null.
- [ ] `getUnhealthyPipelines(pipelines: GridPipeline[]): GridPipeline[]` — filter `status !== 'healthy'`, preserve order.
- [ ] `formatRelativeTime(iso: string): string` — Russian relative using `formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ru })`. Mirrors `PipelineStatusGrid.tsx:54-63` but uses date-fns (consistent with MonitorKpiCards.tsx:120).
- [ ] Re-export `STATUS_COLORS` and `STATUS_LABELS` (PipelineStatus → string) — copy verbatim from `PipelineStatusGrid.tsx:30-44` with comment `// Mirrors PipelineStatusGrid.tsx — keep in sync; extract to shared module in a later refactor if this drifts`.

### AC-4: Orchestrator integration

Modify `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx`:

- [ ] Add `usePipelineGrid()` call in parallel with existing `useMonitorSummary()` and `useDailyMetrics()` (3 hooks total on mount).
- [ ] Pass `{ resolution: 'day', from: <24h ago>, to: <now> }` params to minimize heatmap-cell payload (we don't render cells here).
- [ ] Memoize the `from`/`to` window with `useMemo` mirroring the existing `weekFrom`/`weekTo` pattern (same fix as Story 92.4 M-1).
- [ ] Render layout order: KPI cards → metrics table → weekly chart → **buyout gauge** → **pipeline health**.
- [ ] Gauge renders whenever `hasData` (monitor-summary loaded) — no independent loading/error path needed (same data as KPI card 4; if cards show, gauge shows).
- [ ] Pipeline-health section has independent state machine, same pattern as chart (Story 92.4):
  - `isLoading && !data` → `<Skeleton className="h-32 w-full" />`
  - `isError && !data` → inline amber alert "Не удалось загрузить состояние пайплайнов" + retry button; does NOT hide cards/table/chart/gauge.
  - Success → render `<MonitorPipelineHealth pipelines={data.pipelines} />`.

### AC-5: File-size discipline

- [ ] `MonitorBuyoutGauge.tsx` ≤ 140 lines.
- [ ] `MonitorPipelineHealth.tsx` ≤ 160 lines (if the unhealthy row + tooltip combo grows, extract row to `MonitorPipelineRow.tsx`).
- [ ] `monitor-pipeline-utils.ts` ≤ 100 lines.
- [ ] `MonitorPageContent.tsx` stays ≤ 200 lines (currently 118 — adding pipeline section + gauge should land around 160; if it exceeds, extract the pipeline-section JSX to a helper component `MonitorPipelineSection.tsx` that bundles loading/error/success).
- [ ] DO NOT add anything to `monitor-metrics-utils.ts` (already at 212 — noted by Story 92.4).

### AC-6: Tests — unit

**7 new unit tests** (mirror Story 92.4's split):

- [ ] `MonitorBuyoutGauge.test.tsx` (3 tests):
  1. Renders numeric value "93%" + "Отличный" label when `buyoutRatePercent={93}`.
  2. Renders "—" + "Нет данных" label when `buyoutRatePercent={null}`.
  3. Renders with `role="meter"` + correct `aria-valuenow` + `data-testid="monitor-buyout-gauge"`.

- [ ] `MonitorPipelineHealth.test.tsx` (2 tests):
  1. Mixed-status fixture: renders "Последний пересчёт" row + unhealthy-pipelines list. Asserts `tasks-completeness-sync` (if critical in fixture) appears in unhealthy list with red badge.
  2. All-healthy fixture: renders "Все пайплайны работают исправно" empty state; no unhealthy rows present.

- [ ] `monitor-pipeline-utils.test.ts` (2 tests):
  1. `getBuyoutColor`: null → gray; 95 → green; 80 → amber; 50 → red (4 sub-assertions).
  2. `getMostRecentRecalc`: returns the pipeline with max `lastSuccessAt`; returns null when all entries have `lastSuccessAt: null`.

### AC-7: Tests — E2E

Append **1 new test** to `e2e/monitor.spec.ts`:

- [ ] `test('Block 4 gauge + Block 5 pipeline panel landmarks visible', async ({ page }) => { ... })`:
  - Navigate to `/monitor` with `{ waitUntil: 'domcontentloaded' }` (CLAUDE.md anti-pattern #9).
  - Wait for `page.getByTestId('monitor-page')` visible.
  - Assert `page.getByTestId('monitor-buyout-gauge')` visible with `role="meter"`.
  - Assert `page.getByTestId('monitor-pipeline-health')` visible OR skeleton present (either is a valid mounted state since pipeline-health uses an independent fetch).
  - `test.skip` if no cards rendered (needs backend seeding — visible yellow skip per CLAUDE.md anti-pattern #6).

### AC-8: Null-vs-zero discipline (CLAUDE.md #8)

- [ ] `buyoutRatePercent: null` → render "—" + "Нет данных" band label. **Do NOT `?? 0`** — would paint a red "0%" arc masking "no data yet" vs "catastrophic buyout rate".
- [ ] `pipelines[].errorRate === 0` → no AlertTriangle (0 is legitimate: pipeline has no errors). Gate on `>= 0.01` per `PipelineStatusGrid.tsx:108` precedent.
- [ ] `lastSuccessAt: null` across ALL pipelines → "Нет данных о пересчётах" (not "null ago", not "—").

### AC-9: Defensive Frontend (CLAUDE.md Defensive Principle)

- [ ] If any pipeline has `errorRate > 1` (impossible per backend — should be a proportion 0–1) → log a `console.warn` with the pipeline ID and clamp display to `100%`. File a `docs/request-backend/NNN-*.md` ticket if this warn ever fires in practice (don't file proactively).
- [ ] `buyoutRatePercent > 100` or `< 0` → clamp **arc fill** to `[0, 100]` but display the raw number + AlertTriangle tooltip "Аномалия: значение вне диапазона 0-100%".
- [ ] Preserve raw values at the boundary; normalize only in the utils, not in the component.

### AC-10: Epic 91.3 dependency contract

- [ ] Depends on `GridPipeline.errorRate`, `tasksWithErrors`, `totalResultErrors` fields (landed with Story 91.3-FE — see `src/app/(dashboard)/monitoring/types/monitoring-grid.ts:59-63`).
- [ ] Verify backend returns these fields by running `curl http://localhost:3000/v1/monitoring/pipeline-health-grid -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CID"` at start of implementation. If missing → halt, file backend request.

### AC-11: Validation

- [ ] `npm run type-check` → 0 new errors (pre-existing errors in `advertising-analytics-api.ts` unrelated — same baseline as 92.4).
- [ ] `npm run lint` → 0 warnings/errors.
- [ ] `npm test -- --run` → baseline 6953 + 7 new = **6960 passing**. Zero regressions.
- [ ] `npm run check:docs` → unchanged (183/13 per 92.4 baseline).

### AC-12: Sprint-status transition

- [ ] `92-5-fe-monitor-buyout-pipeline-health: ready-for-dev → review` when impl complete.
- [ ] Epic `92-fe` stays `in-progress` (Story 92.6 is the last).

---

## Tasks / Subtasks

### Task 1: Utils module (AC-3, AC-5)
- [ ] 1.1: Create `src/app/(dashboard)/monitor/components/monitor-pipeline-utils.ts`.
- [ ] 1.2: Implement `getBuyoutColor`, `getMostRecentRecalc`, `getUnhealthyPipelines`, `formatRelativeTime`.
- [ ] 1.3: Mirror `STATUS_COLORS` + `STATUS_LABELS` from `PipelineStatusGrid.tsx` with sync-note comment.

### Task 2: Buyout gauge component (AC-1, AC-5, AC-8, AC-9)
- [ ] 2.1: Create `MonitorBuyoutGauge.tsx` with SVG arc adapted from `HealthScoreWidget.tsx`.
- [ ] 2.2: Wire `getBuyoutColor` for stroke + band label + center class.
- [ ] 2.3: Null-handling + out-of-range clamp + AlertTriangle anomaly path.
- [ ] 2.4: `role="meter"` + aria-label + `data-testid`.

### Task 3: Pipeline health component (AC-2, AC-5, AC-8)
- [ ] 3.1: Create `MonitorPipelineHealth.tsx`.
- [ ] 3.2: Implement Row A (most-recent recalc) with `formatRelativeTime`.
- [ ] 3.3: Implement Row B (unhealthy list) with status badges + error-rate indicator.
- [ ] 3.4: Empty-state (all-healthy) path.
- [ ] 3.5: Landmark `role="region"` + `data-testid`.

### Task 4: Orchestrator integration (AC-4, AC-5)
- [ ] 4.1: Add `usePipelineGrid()` call + memoized date window in `MonitorPageContent.tsx`.
- [ ] 4.2: Render `<MonitorBuyoutGauge buyoutRatePercent={data.kpi.buyoutRatePercent} />` inside the `hasData` branch, after the chart.
- [ ] 4.3: Render pipeline-health section with independent skeleton/error/success — mirror the chart's pattern from 92.4.
- [ ] 4.4: If `MonitorPageContent.tsx` exceeds 200 lines after additions, extract to `MonitorPipelineSection.tsx` (loading/error/success wrapper) — see AC-5 fallback.

### Task 5: Tests (AC-6, AC-7)
- [ ] 5.1: `MonitorBuyoutGauge.test.tsx` — 3 tests.
- [ ] 5.2: `MonitorPipelineHealth.test.tsx` — 2 tests (use `getPipelineGrid` fixture below).
- [ ] 5.3: `monitor-pipeline-utils.test.ts` — 2 tests.
- [ ] 5.4: Append E2E test to `e2e/monitor.spec.ts`.

### Task 6: Validation (AC-11, AC-12)
- [ ] 6.1: Pre-impl — `curl /v1/monitoring/pipeline-health-grid` to verify errorRate fields present (AC-10).
- [ ] 6.2: `npm run type-check && npm run lint && npm test -- --run` green.
- [ ] 6.3: `npm run check:docs` unchanged.
- [ ] 6.4: Sprint-status `92-5-fe-monitor-buyout-pipeline-health: ready-for-dev → review`.

---

## Dev Notes

### Canonical references (read first — in order)

1. **`src/app/(dashboard)/monitoring/components/HealthScoreWidget.tsx`** — gauge geometry + `role="meter"` + threshold-color + animated arc. **Copy the SVG arc pattern**, not the semantics. Lines 40-52 are the geometric constants. Lines 82-100 are the arc path + filled overlay.
2. **`src/app/(dashboard)/monitoring/components/PipelineStatusGrid.tsx`** — status colors, status labels, error-rate indicator convention, pipeline-row pattern. **Mirror the STATUS_COLORS / STATUS_LABELS constants** (AC-3). Lines 30-44 are the maps; lines 108-134 are the error-rate indicator (amber AlertTriangle + tooltip).
3. **`src/app/(dashboard)/monitor/components/MonitorPageContent.tsx`** (current orchestrator, lines 30-117) — state machine, skeleton pattern, parallel-hook + independent-error pattern from Story 92.4.
4. **`src/app/(dashboard)/monitor/components/MonitorWeeklyChart.tsx`** (Story 92.4) — latest pattern: pure presenter + data-driven tests, extracted utils.
5. **`src/components/custom/dashboard/BuyoutRateCard.tsx`** — the OTHER rendering of the same data. Note different threshold cutoff (80% vs gauge's 70/90). Document the divergence in a comment.
6. **`src/app/(dashboard)/monitoring/types/monitoring-grid.ts:18-85`** — `GridPipeline`, `HeatmapCell`, `PipelineHealthGrid` shapes. `errorRate` / `tasksWithErrors` / `totalResultErrors` at lines 59-62.
7. **`src/app/(dashboard)/monitoring/hooks/use-pipeline-grid.ts`** — the hook you reuse (30s/120s smart polling, gcTime 5min).
8. **`backlog/docs/doc-1 - Monitor-Dashboard-—-Backend-Spec-&-Frontend-Implementation-Plan.md` § Block 4 + § Block 5** — canonical spec.

### Gauge geometry (copy from HealthScoreWidget)

```typescript
const RADIUS = 70
const STROKE_WIDTH = 12
const CX = 90
const CY = 85
const ARC_LENGTH = Math.PI * RADIUS // half-circumference ≈ 219.9

function arcPath(): string {
  const startX = CX - RADIUS
  const endX = CX + RADIUS
  return `M ${startX} ${CY} A ${RADIUS} ${RADIUS} 0 0 1 ${endX} ${CY}`
}

// In render:
const safeRate = rate == null ? 0 : Math.max(0, Math.min(100, rate))
const fillLength = (safeRate / 100) * ARC_LENGTH
// <svg width={180} height={100} viewBox="0 0 180 100">
//   <path d={arcPath()} stroke="#E5E7EB" strokeWidth={STROKE_WIDTH} strokeLinecap="round" fill="none" />
//   <path d={arcPath()} stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" fill="none"
//         strokeDasharray={`${fillLength} ${ARC_LENGTH}`} />
// </svg>
```

### `getBuyoutColor` reference implementation

```typescript
export function getBuyoutColor(rate: number | null): {
  hex: string
  textClass: string
  bandLabel: string
} {
  if (rate == null) return { hex: '#9CA3AF', textClass: 'text-gray-400', bandLabel: 'Нет данных' }
  if (rate >= 90) return { hex: '#22C55E', textClass: 'text-green-600', bandLabel: 'Отличный' }
  if (rate >= 70) return { hex: '#F59E0B', textClass: 'text-amber-600', bandLabel: 'Требует внимания' }
  return { hex: '#EF4444', textClass: 'text-red-600', bandLabel: 'Низкий' }
}
```

### `usePipelineGrid` params

```typescript
import { subHours, format } from 'date-fns'

const { pipelineFrom, pipelineTo } = useMemo(() => {
  const now = new Date()
  return {
    pipelineFrom: format(subHours(now, 24), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    pipelineTo: format(now, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  }
}, [])

const pipelineQuery = usePipelineGrid({
  from: pipelineFrom,
  to: pipelineTo,
  resolution: 'day',
})
```

`resolution: 'day'` over a 24h window → minimal `cells[]` payload. We don't render cells in this story; we only need summary fields.

### Test fixture for `MonitorPipelineHealth`

```typescript
// src/app/(dashboard)/monitor/components/__tests__/MonitorPipelineHealth.test.tsx
import type { GridPipeline } from '@/app/(dashboard)/monitoring/types/monitoring'

const healthy: GridPipeline = {
  pipelineId: 'products-sync',
  displayName: 'Синхронизация товаров',
  category: 'high_frequency',
  expectedFrequency: '5m',
  cronExpression: '*/5 * * * *',
  dataTable: 'products',
  status: 'healthy',
  healthScore: 98,
  lastSuccessAt: '2026-04-24T09:45:00Z',
  lastFailureAt: null,
  nextExpectedAt: '2026-04-24T09:50:00Z',
  dataLagMinutes: 2,
  successRate: 0.99,
  totalExecutions: 288,
  totalFailures: 3,
  avgDurationMs: 1200,
  totalRowsProcessed: 150000,
  errorRate: 0.01, // under the 0.01-gate (strict >=) → no badge
  tasksWithErrors: 3,
  totalResultErrors: 3,
  cells: [],
}

const critical: GridPipeline = {
  ...healthy,
  pipelineId: 'tasks-completeness-sync',
  displayName: 'Проверка полноты задач',
  status: 'critical',
  errorRate: 0.15,
  tasksWithErrors: 45,
  totalResultErrors: 52,
  lastSuccessAt: '2026-04-23T08:00:00Z',
}
```

### Orchestrator diff skeleton

```tsx
// Inside MonitorPageContent, after existing weekFrom/weekTo useMemo:
const { pipelineFrom, pipelineTo } = useMemo(() => { /* see above */ }, [])
const pipelineQuery = usePipelineGrid({ from: pipelineFrom, to: pipelineTo, resolution: 'day' })

// Inside the `hasData` branch, after <MonitorWeeklyChart ... />:
<MonitorBuyoutGauge buyoutRatePercent={data.kpi.buyoutRatePercent} />

{pipelineQuery.isLoading && !pipelineQuery.data && <Skeleton className="h-32 w-full" />}
{pipelineQuery.isError && !pipelineQuery.data && (
  <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-center justify-between">
    <span>Не удалось загрузить состояние пайплайнов.</span>
    <Button variant="ghost" size="sm" onClick={() => void pipelineQuery.refetch()}>
      Повторить
    </Button>
  </div>
)}
{pipelineQuery.data && <MonitorPipelineHealth pipelines={pipelineQuery.data.pipelines} />}
```

### Memory callout — SDK method signatures

The pipeline-health-grid endpoint is NOT a WB-SDK call; it's a backend-only endpoint. No SDK migration risk for this story. (Memory note re: WB SDK method rename patterns is irrelevant here — kept for awareness only.)

### File-size pre-flight

| File | Expected lines | Budget | Extract trigger |
|---|---|---|---|
| `MonitorBuyoutGauge.tsx` | ~110 | 200 | Extract band-label → utils if >140 |
| `MonitorPipelineHealth.tsx` | ~130 | 200 | Extract `<PipelineRow>` → sibling file if >160 |
| `monitor-pipeline-utils.ts` | ~80 | 200 | — |
| `MonitorPageContent.tsx` | ~160 (from 118) | 200 | Extract pipeline-section JSX → `MonitorPipelineSection.tsx` if >195 |
| `MonitorBuyoutGauge.test.tsx` | ~80 | 200 | — |
| `MonitorPipelineHealth.test.tsx` | ~110 | 200 | — |
| `monitor-pipeline-utils.test.ts` | ~60 | 200 | — |

### Previous story intelligence (Story 92.4)

**What worked in 92.4**:
- Pure-function extraction (chart utils) → testable without hook mocking.
- Parallel hook in orchestrator with independent state machine → chart failure didn't hide cards/table.
- Memoized date window (useMemo) → prevented refetch storm on every render (M-1 fix).
- `EEEEEE` date-fns format with `ru` locale for compact weekday labels.

**What bit 92.4 during review**:
- **H-3 structural fix**: the initial impl silently dropped `salesCount`/`returnsCount` from `DailyMetrics` aggregation. Reviewer caught it → restored 3-line chart with uniform integer-count scale. **Lesson for 92.5**: if you discover the hook's data is missing a field the spec wants, **surface it up** (extend the type + aggregation) rather than silently adapting to what's there. For 92.5 this means: if `GridPipeline` is missing `errorRate` (it's not — Story 91.3 added it), halt and file a backend request. Don't quietly ship a degraded indicator.
- **H-2 test mocks**: tests initially asserted trivially-true digit matches. Reviewer demanded asserting dataKeys + names + transformed data. **Lesson for 92.5**: unit-test assertions on the gauge should verify `aria-valuenow` (not just "number is rendered somewhere") and pipeline-health tests should verify specific `displayName` appears in the unhealthy row with the correct status badge — not just "some text is present".
- **M-2 tooltip guards**: the tooltip payload type wasn't guarded in 92.4. In 92.5, the gauge doesn't have a recharts tooltip but the pipeline-health indicator does — `<TooltipContent>` must guard against empty strings for `tasksWithErrors` / `totalResultErrors`.
- **L-1 label casing**: `пн` vs `Пн` caught by review. In 92.5, relative time labels come from `formatDistanceToNow` which handles casing correctly via `locale: ru`; no manual casing needed.
- **Recharts jsdom mock pain**: 92.4 had to mock recharts primitives because jsdom doesn't render SVG sizes. **92.5 uses raw SVG**, not recharts → NO jsdom mock needed. Win.

**Git intelligence — last 5 commits**:
```
5a4c26e chore: update session compaction logs
9158d1f test(acquiring): E2E navigation + accessibility scans (Stories 90.3–90.5)
bcb0b5f feat(acquiring): period detail page + list page navigation (Story 90.4-FE)
6ecddf4 feat(acquiring): report detail page with transactions table (Story 90.3-FE)
e2989fc refactor(acquiring): extract shared pluralize + AnomalyVatIndicator
```
Recent patterns: route-based `(dashboard)/*` co-location, E2E Playwright specs with landmark waits, Epic 90's shared-utility extraction pattern (`AnomalyVatIndicator`). None of the recent commits touched `/monitor`; no merge-conflict risk expected.

### Epic 90 retro action items — cross-applied

- **#11 `<Button asChild><Link>` pattern**: N/A (no navigation in this story).
- **#13 Pre-implementation grep**: done — `usePipelineGrid` confirmed existing (`src/app/(dashboard)/monitoring/hooks/use-pipeline-grid.ts`); `HealthScoreWidget` pattern located.
- **Exact test assertions** (not trivially-true): AC-6 mandates asserting `aria-valuenow` values + specific pipeline `displayName`, not just digit-presence.
- **Rule of two** (constants duplication): `STATUS_COLORS`/`STATUS_LABELS` duplicated between `PipelineStatusGrid.tsx` and `monitor-pipeline-utils.ts` — flagged with sync-note comment, DO NOT refactor into a shared module this story (scope creep).

### Out of scope

- Removing the 4th KPI card from Story 92.2 (keep the text card; gauge is additive).
- Refactoring `PipelineStatusGrid.tsx` to reuse shared constants (rule-of-two signal observed, but extract in a dedicated refactor epic).
- Rendering the full 11-pipeline grid in Monitor (Monitor is intentionally compact — unhealthy-only).
- Rendering `HeatmapCell` data (we consume `GridPipeline` summary only).
- Switching `BuyoutRateCard` thresholds to match gauge (different visualizations, different budgets — the divergence is **intentional**).
- Auto-refresh / polling UX (Story 92.6 handles polish).
- Stories 92.6 (E2E + polish — next and final story in epic).

### Backend contract verification (memory-rule)

Per `feedback_backend_contract_verification.md`: before writing the API client wiring, verify the backend contract:

```bash
# From repo root:
curl -s -H "Authorization: Bearer $TOKEN" \
     -H "X-Cabinet-Id: $CABINET_ID" \
     "http://localhost:3000/v1/monitoring/pipeline-health-grid?resolution=day&from=2026-04-23T10:00:00Z&to=2026-04-24T10:00:00Z" \
  | jq '.pipelines[0] | {errorRate, tasksWithErrors, totalResultErrors}'
```

If any of the three fields are missing → halt impl, file backend request at `docs/request-backend/NNN-PIPELINE-HEALTH-GRID-ERROR-RATE-FIELDS.md`. This should NOT happen (Epic 91.3 landed), but verify before assuming.

---

## References

- Story 92.1-FE (`_bmad-output/implementation-artifacts/92-1-fe-monitor-types-api-hook.md`) — foundation types + `useMonitorSummary` hook.
- Story 92.2-FE (`_bmad-output/implementation-artifacts/92-2-fe-monitor-kpi-cards-route.md`) — KPI cards + route scaffolding.
- Story 92.3-FE (`_bmad-output/implementation-artifacts/92-3-fe-monitor-metrics-table.md`) — metrics table + anomaly indicator patterns.
- Story 92.4-FE (`_bmad-output/implementation-artifacts/92-4-fe-monitor-weekly-chart.md`) — parallel-hook orchestrator pattern + independent error state.
- Story 91.3-FE — added `errorRate` / `tasksWithErrors` / `totalResultErrors` to `GridPipeline`.
- Epic 92 spec: `_bmad-output/planning-artifacts/epics-92-fe.md` § Story 92.5.
- Backlog doc-1 § Block 4 + § Block 5: `backlog/docs/doc-1 - Monitor-Dashboard-—-Backend-Spec-&-Frontend-Implementation-Plan.md:82-98`.
- Backlog task-20: `backlog/tasks/task-20 - Monitor-Dashboard-Buyout-Rate-+-Pipeline-Health-(Blocks-4-5-UI).md`.
- `HealthScoreWidget.tsx` — canonical semi-circular gauge reference (do NOT use recharts RadialBarChart).
- `PipelineStatusGrid.tsx:108-134` — error-rate indicator pattern.
- `BuyoutRateCard.tsx` — sibling rendering; note intentional threshold divergence (80% cutoff vs gauge's 70/90 bands).
- CLAUDE.md § anti-pattern #2 (guard-capture, no `!` assertions).
- CLAUDE.md § anti-pattern #6 (E2E visible `test.skip` on missing fixture data).
- CLAUDE.md § anti-pattern #8 (null-vs-zero — buyout `null` ≠ `0%`).
- CLAUDE.md § anti-pattern #9 (E2E `domcontentloaded` + landmark; no `networkidle`).
- CLAUDE.md § Defensive Frontend Principle (AlertTriangle for out-of-range values, file backend ticket).
- CLAUDE.md § Boundary Normalizer Pattern (pipeline-health-grid already normalized in `src/lib/api/monitoring/api.ts`; don't re-normalize in this story).

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No significant debug issues. All 21 tests passed on first run. The fixture in MonitorPipelineHealth.test.tsx used `errorRate: 0.009` (not 0.01) to correctly stay under the `>= 0.01` gate since the story fixture comment said "under the 0.01-gate (strict >=)".

### Completion Notes List

- AC-1: `MonitorBuyoutGauge.tsx` created (136 lines). Raw SVG arc adapted from HealthScoreWidget. role="meter", aria-valuenow, data-testid, null handling, out-of-range clamp + AlertTriangle. Card wrapper with title "Выкуп за 30 дней".
- AC-2: `MonitorPipelineHealth.tsx` created (126 lines). Card with Row A (most recent recalc) + Row B (unhealthy list with status badges + error-rate indicators) + all-healthy empty state with checkmark. role="region" + data-testid.
- AC-3: `monitor-pipeline-utils.ts` created (93 lines). getBuyoutColor, getMostRecentRecalc, getUnhealthyPipelines, formatRelativeTime, STATUS_COLORS, STATUS_LABELS (all with sync-note comment).
- AC-4: `MonitorPageContent.tsx` modified (150 lines, was 118). Third parallel hook usePipelineGrid with memoized 24h date window. Gauge renders in hasData branch after chart. Pipeline health has independent skeleton/error/success state.
- AC-5: All files within budget (utils 93, gauge 136, pipeline-health 126, orchestrator 150). No extraction needed.
- AC-6: 21 unit tests pass (5 gauge + 3 pipeline-health + 13 utils — exceeded spec minimums with boundary tests).
- AC-7: 1 E2E test appended to e2e/monitor.spec.ts with domcontentloaded + test.skip guard.
- AC-8: null → "—"/"Нет данных" (never ?? 0). errorRate gate >= 0.01. lastSuccessAt: null → "Нет данных о пересчётах".
- AC-9: out-of-range clamp on arc fill + AlertTriangle tooltip. errorRate > 1 console.warn guard in PipelineRow.
- AC-10: Backend contract not verified at runtime (backend not accessible in this environment). Types at monitoring-grid.ts:59-63 confirm errorRate/tasksWithErrors/totalResultErrors fields exist.
- AC-11: type-check → 0 new errors (pre-existing advertising-analytics-api.ts errors unchanged). lint → 0 errors. Tests: 6953 baseline → 6974 passing (+21), 0 regressions. check:docs → 185/13 unchanged.
- AC-12: Status set to review. Epic 92-fe stays in-progress.
- H-1: Fixed DailyMetrics initializer in `table-columns.ts:152` — added `salesCount: 0, returnsCount: 0`. No other initializer sites had the bug (`day-utils.ts`, `aggregation.ts`, test `makeDay` helpers all already correct).
- H-2: Added `data-testid="monitor-pipeline-skeleton"` to `<Skeleton>` in `MonitorPageContent.tsx`. Updated E2E assertion to `page.getByTestId('monitor-pipeline-skeleton')`.
- H-3: Added 2 gauge anomaly-path tests in `MonitorBuyoutGauge.test.tsx` — `buyoutRatePercent={150}` and `buyoutRatePercent={-5}` — asserting AlertTriangle visible + raw aria-valuenow preserved (not clamped).
- H-4: Replaced silent `console.warn`-only guard with amber AlertTriangle + tooltip ("Аномалия: показатель errorRate вне диапазона 0-1. Возможна ошибка данных.") in `MonitorPipelineHealth.tsx`. Filed `docs/request-backend/167-PIPELINE-HEALTH-ERROR-RATE-OUT-OF-RANGE.md`. Added unit test in `MonitorPipelineHealth.test.tsx` asserting clamped 100% badge for `errorRate: 1.5`.
- H-5: Added `vi.mock('@/app/(dashboard)/monitoring/hooks/use-pipeline-grid')` and `vi.mock('@/hooks/useDailyMetrics')` factory mocks in `MonitorPageContent.test.tsx`. Added assertion that gauge (`data-testid="monitor-buyout-gauge"`) and pipeline panel (`data-testid="monitor-pipeline-health"`) render when all hooks succeed.
- M-6: Added 2 tooltip-payload hover tests in `MonitorPipelineHealth.test.tsx` using `userEvent` — asserts "45 задач с ошибками (52 ошибок всего)" and "Ошибки выполнения" fallback. Used `findAllByText` (Radix renders two tooltip nodes).
- M-7: Unstaged files from other sessions (`sidebar-navigation.ts`, `routes.ts`, `daily-metrics.ts`, etc.) are pre-existing work unrelated to 92.5 — left alone. `table-columns.ts` (H-1 fix) and `e2e/fixtures/test-data.ts` (monitor route) added to File List.
- M-8: Replaced `formatDistanceToNow` (date-fns) with manual math verbatim from `PipelineStatusGrid.tsx:54-63`. Function signature widened to `string | null` (matching source). Removed `date-fns` imports from `monitor-pipeline-utils.ts`.
- M-9: Added 5 `formatRelativeTime` unit tests in `monitor-pipeline-utils.test.ts` with `vi.useFakeTimers()` / `vi.setSystemTime(new Date('2026-04-24T10:00:00Z'))` — covering null, 30s, 5min, 2h, 3d inputs.
- L-10: Rewrote self-contradictory fixture comment to "Use 0.009 (strictly below 0.01 gate) to assert no badge rendering." Fixture value confirmed as `0.009`.
- L-11: Created commit `1a6b75c` for Story 92.5 with 25 files (all monitor components + test files + e2e + backend ticket).
- L-12: Replaced `aria-label` on meter with `aria-labelledby="buyout-gauge-title"` + `aria-valuetext="{N}%"` (null case: `"нет данных"`). Added `id="buyout-gauge-title"` to `CardTitle`. Updated gauge tests to assert `aria-labelledby` / `aria-valuetext` instead of `aria-label`.

### File List

New files:
- `src/app/(dashboard)/monitor/components/monitor-pipeline-utils.ts`
- `src/app/(dashboard)/monitor/components/MonitorBuyoutGauge.tsx`
- `src/app/(dashboard)/monitor/components/MonitorPipelineHealth.tsx`
- `src/app/(dashboard)/monitor/components/__tests__/MonitorBuyoutGauge.test.tsx`
- `src/app/(dashboard)/monitor/components/__tests__/MonitorPipelineHealth.test.tsx`
- `src/app/(dashboard)/monitor/components/__tests__/monitor-pipeline-utils.test.ts`
- `src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx` — H-5 fix: added usePipelineGrid + useDailyMetrics mocks
- `docs/request-backend/167-PIPELINE-HEALTH-ERROR-RATE-OUT-OF-RANGE.md` — H-4 fix: backend ticket for errorRate > 1

Modified files:
- `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx` — added usePipelineGrid parallel hook + MonitorBuyoutGauge + MonitorPipelineHealth rendering; H-2: added data-testid="monitor-pipeline-skeleton"
- `e2e/monitor.spec.ts` — appended Block 4+5 landmark visibility test; H-2: updated pipeline skeleton selector
- `src/components/custom/dashboard/table-columns.ts` — H-1: added salesCount:0 + returnsCount:0 to DailyMetrics initializer

### Change Log

| Date | Change |
|---|---|
| 2026-04-24 | Story created. Fifth and penultimate story in Epic 92-FE. 3 SP story covering Blocks 4 + 5 of Monitor Dashboard. New files: `MonitorBuyoutGauge.tsx` (semi-circular SVG gauge adapted from `HealthScoreWidget`), `MonitorPipelineHealth.tsx` (compact last-recalc + unhealthy-list panel), `monitor-pipeline-utils.ts` (getBuyoutColor + pipeline filters + STATUS_COLORS/LABELS mirror). Orchestrator gets third parallel hook (`usePipelineGrid`) with independent error state mirroring Story 92.4's chart pattern. Data: gauge reuses `kpi.buyoutRatePercent` from already-loaded `useMonitorSummary()` (no new fetch); pipeline-health adds `GET /v1/monitoring/pipeline-health-grid` consuming Epic 91.3's errorRate fields. Out of scope: removing KPI card 4 (redundancy is intentional per spec), refactoring `PipelineStatusGrid` to share constants (rule-of-two signal noted, defer to later), heatmap-cell rendering, polling UX (92.6). Applies 92.4 retro lessons: structural fix over silent adaptation, exact test assertions (not digit-match), pre-impl backend contract verification. Applies Epic 90 retro: pre-impl grep done, rule-of-two constants duplication flagged with sync comment not extracted. Raw-SVG gauge chosen over recharts RadialBarChart specifically to avoid 92.4's jsdom mock pain. Backlog task-20 + doc-1 Block 4+5 as canonical sources. |
| 2026-04-24 | Implementation complete. Status: review. All 21 new unit tests pass. Total suite: 6974 (baseline 6953 + 21 new). Zero regressions. All files within 200-line budget. |
| 2026-04-24 | Addressed 12 code review findings (5H/4M/3L). All validation gates pass. Status: review. |

# Story 92.2-FE: Monitor KPI Cards + `/monitor` Route

Status: done

## Story

**As a** business owner who wants a daily "business pulse" at a glance,
**I want** a Monitor Dashboard page at `/monitor` with 4 KPI cards (total products, products with COGS, COGS coverage %, 30-day buyout rate) pulling from the single-endpoint Monitor Summary backend,
**so that** I can check cabinet health without navigating through 5+ separate analytics pages.

**Epic**: 92-FE Monitor Dashboard
**Priority**: P2
**Estimate**: 3 story points
**Second story in epic** — Epic 92 stays `in-progress`. Builds the first user-visible surface on Story 92.1's data layer.

---

## Problem Statement

Story 92.1 shipped the data layer: `MonitorSummaryResponse` types + `useMonitorSummary()` hook + Boundary Normalizer. Ready to render.

This story delivers **Block 1 of 5** (per backlog doc-1's Monitor Dashboard architecture): the KPI cards strip. Subsequent stories:
- 92.3 → 4-period metrics table (Block 2)
- 92.4 → weekly chart (Block 3)
- 92.5 → buyout gauge + pipeline health (Blocks 4-5)
- 92.6 → E2E + polish

### KPI fields consumed (from `useMonitorSummary().data.kpi`)

```typescript
kpi: {
  totalProducts: number              // count, legitimate zero
  productsWithCogs: number           // count, legitimate zero
  cogsCoveragePercent: number | null // ratio, null = division undefined
  buyoutRatePercent: number | null   // ratio, null = no orders in window
  lastSyncAt: string | null          // ISO datetime, null if never synced
}
```

### Disambiguation from existing `/monitoring`

The project already has `/monitoring` (Epic 68-FE) — **pipeline health dashboard** for ops (task queues, recovery, telegram). Monitor Dashboard (`/monitor`) is a **different** surface:

| `/monitoring` (existing) | `/monitor` (this epic) |
|---|---|
| Ops-focused (pipeline health, recovery, telegram) | Business-focused (KPI + periods + weekly chart + buyout + pipeline) |
| Sidebar label: "Мониторинг" | Sidebar label: "Монитор" |
| Icon: `Activity` | Icon: `Gauge` (proposed — matches "dashboard of metrics") |

Both coexist. The naming is close but semantically distinct (ops surface ≠ business surface).

---

## Acceptance Criteria

### AC-1: Route registration

- [x] Add `MONITOR: '/monitor'` to `ROUTES` in `src/lib/routes.ts` (top-level constant, NOT nested under `ANALYTICS` — Monitor is a cabinet-overview surface, not an analytics drill-down).
- [x] Position: near the existing `MONITORING` constant (around line 71) so both "monitor" and "monitoring" are grouped visually in the registry.
- [x] Add `ROUTES.MONITOR` to the authenticated-routes array (around line 125, mirror pattern of `MONITORING`, `ANALYTICS.BUYOUT`, etc.).

### AC-2: Sidebar entry

- [x] Add a new entry in `src/components/custom/sidebar-navigation.ts` — position near the existing "Мониторинг" entry to reinforce the grouping.
- [x] Label: `'Монитор'` (Russian).
- [x] Icon: `Gauge` from `lucide-react` (import if not already). Alternative: `LayoutDashboard`. Pick `Gauge` unless it collides with another sidebar entry's icon.
- [x] Path: `ROUTES.MONITOR`.

### AC-3: Page entry (Next.js App Router)

- [x] Create `src/app/(dashboard)/monitor/page.tsx` — Server Component thin wrapper (~10 lines) that renders `<MonitorPageContent />`.

### AC-4: `MonitorPageContent` orchestrator

Create `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx`:

- [x] Mark `'use client'` at top.
- [x] No props.
- [x] Call `useMonitorSummary()` from Story 92.1 (`src/app/(dashboard)/monitor/hooks/use-monitor-summary.ts`).
- [x] State machine (mirror Story 90.3/90.4's pattern):
  - **First-load skeleton**: `isLoading && !data` → render `<MonitorKpiCardsSkeleton />` (a lightweight skeleton with 4 placeholder cards, using `Skeleton` from `@/components/ui/skeleton`).
  - **Full error alert**: `isError && !data` → alert with refetch button calling `refetch()`.
  - **Success** (has data): render page header + `<MonitorKpiCards kpi={data.kpi} generatedAt={data.generatedAt} />`.
  - **Inline refetch-error chip**: when `isError && data` → amber chip above the cards (same pattern as Story 90.3/90.4).
- [x] Page header: `<h1>Монитор</h1>` + subtitle: `<p>Обзор состояния кабинета и ключевые метрики за периоды</p>`.
- [x] Optional: "Updated X ago" footer showing `kpi.lastSyncAt` as relative time using `formatDistanceToNow` from `date-fns` (Russian locale). Only render when `kpi.lastSyncAt != null`.
- [x] `data-testid="monitor-page"` landmark on the root container.
- [x] Russian locale throughout.

### AC-5: `MonitorKpiCards` component

Create `src/app/(dashboard)/monitor/components/MonitorKpiCards.tsx`:

- [x] `'use client'`.
- [x] Props: `{ kpi: MonitorKpi; generatedAt?: string | null }`.
- [x] Renders 4 cards in a grid (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`), using existing `Card` primitives from `@/components/ui/card`:

  | # | Title | Value | Subtitle / Hint | Null handling |
  |---|---|---|---|---|
  | 1 | **Всего артикулов** | `kpi.totalProducts` | — | Count → no null path |
  | 2 | **С COGS** | `kpi.productsWithCogs` | — | Count → no null path |
  | 3 | **Покрытие COGS** | `kpi.cogsCoveragePercent`% | "Отношение артикулов с известной себестоимостью к общему числу" | **Null → render `—`** (anti-pattern #8) |
  | 4 | **Выкуп за 30 дней** | `kpi.buyoutRatePercent`% | "Процент выкупленных заказов за последние 30 дней" | **Null → render `—`** |

- [x] For ratio cards, format via `formatPercentage` from the project's formatters (grep `formatPercentage` to find canonical helper; falls back to inline `${value.toFixed(1)}%` if none exists).
- [x] Accessible markup: each card uses `<article>` or `<section>` with `aria-label={title}` for screen readers.
- [x] Color accent: use existing semantic color tokens from CLAUDE.md design system (blue for neutral metrics, amber for warning-worthy values). Optional: if `cogsCoveragePercent < 50`, subtle amber tint to signal "coverage gap."

### AC-6: Null-vs-zero discipline (recap)

- [x] `cogsCoveragePercent: null` → render `—`, NOT `0 %`.
- [x] `buyoutRatePercent: null` → render `—`.
- [x] Counts (`totalProducts`, `productsWithCogs`) are never null per backend contract — render as `0` if somehow 0 (legitimate zero; empty cabinet).

### AC-7: Defensive Frontend consideration

- [x] If `productsWithCogs > totalProducts` (impossible anomaly), render an `AlertTriangle` indicator next to the "С COGS" card with tooltip "Аномалия: количество артикулов с COGS превышает общее. Возможна ошибка данных на стороне WB." — per Defensive Frontend Principle from Story 89.4.
- [x] Reuse `AnomalyVatIndicator`? NO — that's VAT-specific. Consider extracting a more generic `AnomalyIndicator` component if this is the second non-VAT use (currently first non-VAT use). **Rule-of-two**: keep inline for this story; extract when Story 92.3 or 92.5 adds a third anomaly type.

### AC-8: Tests

**Unit tests** — minimum 6 new:

- [x] `MonitorKpiCards.test.tsx` (≥5):
  1. Renders 4 cards with all titles when data fully populated.
  2. `cogsCoveragePercent: null` → card shows `—` (not `0%` or empty string).
  3. `buyoutRatePercent: null` → card shows `—`.
  4. Anomaly indicator visible when `productsWithCogs > totalProducts`.
  5. Count values (0, 1, 100) render correctly with no pluralization issues.
- [x] `MonitorPageContent.test.tsx` (≥3):
  1. Renders landmark + header when data resolves.
  2. Skeleton visible when first-load + no data.
  3. Empty/error state visible when hook errors without cached data.

Use canonical test patterns: `vi.mock` the hook, `useAuthStore.setState` if needed, exact regex assertions (NOT trivially-true digit matches — per Story 90.2 M-3 lesson).

**E2E** — new file `e2e/monitor.spec.ts` (≥3 tests):

- [x] Navigate directly to `/monitor` → landmark `monitor-page` visible + header "Монитор" present.
- [x] Click sidebar "Монитор" entry → lands on `/monitor`.
- [x] Empty-data state handled (may be conditional — skip if fixture doesn't allow).

Use `domcontentloaded` + landmark waits (anti-pattern #9).

### AC-9: `<Button asChild><Link>` pattern

- [x] Any link-based navigation in this story uses `<Button asChild><Link href={...}>...</Link></Button>`, not `<Link><Button>...</Button></Link>` (per Epic 90 retro Action Item #11 + Story 90.4/90.5's L-2 precedent). No nested interactive elements.

### AC-10: Validation

- [x] `npm run type-check && npm run lint` — clean (no new errors in story files; pre-existing TS errors in advertising-analytics-api.ts unrelated).
- [x] `npm test -- --run` — 6915 passed, 0 failed. Zero regressions.
- [x] `npm run check:docs` unchanged (183 / 13 — baseline was 183/13 before this story).

### AC-11: Sprint-status

- [x] `92-2-fe-monitor-kpi-cards-route: backlog → ready-for-dev → in-progress → review` through normal workflow.

---

## Tasks / Subtasks

### Task 1: Route + sidebar (AC-1, AC-2)
- [x] 1.1: Add `MONITOR: '/monitor'` to `ROUTES` + authenticated array.
- [x] 1.2: Add "Монитор" sidebar entry with `Gauge` icon.
- [x] 1.3: `npm run type-check` — verify route compiles.

### Task 2: Page entry (AC-3)
- [x] 2.1: Create `monitor/page.tsx` Server Component wrapper.

### Task 3: Orchestrator (AC-4)
- [x] 3.1: Create `MonitorPageContent.tsx` mirroring Story 90.3/90.4 state machine.
- [x] 3.2: Wire `useMonitorSummary` + state branches.
- [x] 3.3: Optional "Updated X ago" footer via `formatDistanceToNow`.

### Task 4: KPI cards (AC-5, AC-6, AC-7)
- [x] 4.1: Create `MonitorKpiCards.tsx`.
- [x] 4.2: 4-card grid with 3 count metrics + 1 ratio + 1 anomaly indicator.
- [x] 4.3: Null rendering (`—`) for nullable ratios.
- [x] 4.4: Anomaly detection when `productsWithCogs > totalProducts`.

### Task 5: Tests (AC-8)
- [x] 5.1: `MonitorKpiCards.test.tsx` (7 tests).
- [x] 5.2: `MonitorPageContent.test.tsx` (3 tests).
- [x] 5.3: `e2e/monitor.spec.ts` (3 tests — lint-only, no execution).

### Task 6: Validation (AC-10, AC-11)
- [x] 6.1: `npm run type-check && npm run lint && npm test -- --run`.
- [x] 6.2: `npm run check:docs` unchanged.
- [x] 6.3: Sprint-status transitions.

---

## Dev Notes

### Canonical references (read first)

- Story 92.1 data layer — confirms hook + types.
- Story 90.2's `AcquiringPageContent.tsx` — orchestrator + state machine pattern (the canonical version).
- Story 90.2's `AcquiringSummaryCards.tsx` — 4-card grid pattern.
- Story 89.4's Defensive Frontend Principle section in CLAUDE.md — anomaly indicator pattern.
- `src/components/custom/dashboard/BuyoutRateCard.tsx` OR `SimpleMetricCard.tsx` — existing KPI-card primitives; may be reusable if shape matches.

### KPI card styling decision

Two paths:
1. **Build new `MonitorKpiCard` subcomponent** — controllable, isolated from dashboard's `SimpleMetricCard` API.
2. **Reuse `SimpleMetricCard`** — consistent with `/dashboard` main page; potential constraint if `SimpleMetricCard`'s API doesn't fit ratio + anomaly needs.

**Recommendation**: Start with a fresh `<Card>` inside `MonitorKpiCards.tsx`. If duplication with `SimpleMetricCard` becomes uncomfortable AND Story 92.5 (buyout gauge) needs similar cards, consider refactoring to share. Not now — rule of two.

### Optional "Updated X ago" footer

```tsx
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

{kpi.lastSyncAt && (
  <p className="text-xs text-muted-foreground mt-2">
    Обновлено: {formatDistanceToNow(new Date(kpi.lastSyncAt), { addSuffix: true, locale: ru })}
  </p>
)}
```

Skip if `kpi.lastSyncAt` null. Graceful.

### File-size budget (pre-flight)

| File | Expected | Budget |
|---|---|---|
| `monitor/page.tsx` | ~10 | 200 |
| `MonitorPageContent.tsx` | ~110 | 200 |
| `MonitorKpiCards.tsx` | ~140 | 200 |
| `MonitorKpiCards.test.tsx` | ~130 | 200 |
| `MonitorPageContent.test.tsx` | ~90 | 200 |
| `e2e/monitor.spec.ts` | ~80 | 200 |

All comfortable. No split risk.

### Out of scope

- 4-period metrics table (Story 92.3).
- Weekly chart (Story 92.4).
- Buyout gauge + pipeline health embed (Story 92.5).
- E2E accessibility scans (Story 92.6).
- Extraction of a shared `MonitorMetricCard` base (rule-of-two; 92.5 may be the third site).
- Migrating any `<Link><Button>` patterns OUTSIDE this story's new code.

### Epic 90 retro lessons to apply

1. **Pre-implementation grep done** — verified only 92.1 data layer exists, no pre-existing Monitor UI. Scope is genuine.
2. **`<Button asChild><Link>`** used from the start, not `<Link><Button>`.
3. **No trivially-true test assertions** — use exact regex or semantic queries.
4. **Defensive Frontend Principle applied** — anomaly indicator for impossible COGS count.
5. **Rule-of-two held** — no premature shared-card extraction.

### Backlog ref

Backlog task-17 (Monitor Dashboard KPI Cards block). Close on story completion.

---

## References

- Story 92.1-FE — data layer foundation: `src/app/(dashboard)/monitor/types/monitor-summary.ts`, `src/hooks/use-monitor-summary.ts`.
- Epic 92 spec: `_bmad-output/planning-artifacts/epics-92-fe.md` § Story 92.2.
- Backlog doc-1 (Monitor Dashboard Backend Spec & Frontend Implementation Plan) § Block 1: KPI Cards.
- Backend endpoint: `GET /v1/analytics/monitor/summary` (single-endpoint architecture, backlog task-16 closed).
- Story 90.2's orchestrator + summary cards — canonical UI template.
- Story 89.4's Defensive Frontend Principle section in CLAUDE.md.
- CLAUDE.md anti-pattern #8 (null-vs-zero) + #9 (domcontentloaded).
- Epic 90 retro action items: #11 (`<Button asChild><Link>`), #14 (pre-implementation grep).

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet (executor)

### Debug Log References
None — no significant debugging required. ESLint hook caught `Gauge` imported-but-unused on first sidebar edit; fixed by adding the sidebar entry in the same pass.

### Completion Notes List
- `formatPercentage` found in `src/lib/utils.ts` — used directly (no inline fallback needed).
- `formatDistanceToNow` confirmed pattern from `DashboardPeriodSelector.tsx`: `import { formatDistanceToNow } from 'date-fns'` + `import { ru } from 'date-fns/locale'`.
- `Gauge` icon from lucide-react has no collision with existing sidebar icons — chosen as specified.
- Anomaly indicator implemented inline per rule-of-two (first non-VAT use); uses `AlertTriangle` + `Tooltip` with guard-capture pattern (no `!` assertion).
- Skeleton rendered in 4-card grid layout matching the success grid — smooth visual transition.
- `check:docs` baseline was already 183/13 before this story (not 181/13 as story spec stated); confirmed via `git stash` + re-run. No doc count change from this story.
- 7 unit tests in `MonitorKpiCards.test.tsx` (exceeded ≥5 requirement); 3 in `MonitorPageContent.test.tsx`. All 10 new tests pass.
- Pre-existing TS errors in `src/lib/api/advertising-analytics-api.ts` are not introduced by this story (confirmed via targeted grep on story files).
- Total suite: 6915 passed, 0 failed (was 6904 before this story → +11 net new tests from monitor components; 92.1 already counted 4 previously).

### File List
**New (3 source + 3 test):**
- `src/app/(dashboard)/monitor/page.tsx` (11 lines)
- `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx` (84 lines)
- `src/app/(dashboard)/monitor/components/MonitorKpiCards.tsx` (119 lines)
- `src/app/(dashboard)/monitor/components/__tests__/MonitorKpiCards.test.tsx` (107 lines)
- `src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx` (105 lines)
- `e2e/monitor.spec.ts` (62 lines)

**Modified (2):**
- `src/lib/routes.ts` — added `MONITOR: '/monitor'` constant + protected routes entry
- `src/components/custom/sidebar-navigation.ts` — added `Gauge` import + "Монитор" nav entry

### Change Log

| Date | Change |
|---|---|
| 2026-04-24 | Story created. Second story in Epic 92-FE. 3 SP UI story — first user-visible Monitor surface. Scope: new `/monitor` route + sidebar entry + page orchestrator + 4-card KPI grid + anomaly indicator + ~6 unit tests + 3 E2E smoke. Applies Epic 90 retro lessons: pre-implementation grep confirmed, `<Button asChild><Link>` pattern from the start, exact-regex test assertions, Defensive Frontend Principle for `productsWithCogs > totalProducts` anomaly. Out of scope: 92.3 metrics table, 92.4 chart, 92.5 buyout+pipeline, 92.6 polish. Backlog task-17. |
| 2026-04-21 | Implemented by Claude Sonnet (executor). All 6 deliverable files created/modified. 10 new unit tests + 3 E2E smoke tests. Lint clean, type-check clean for story files, 6915 total tests pass. Status → review. |
| 2026-04-24 | Code review complete: 7 findings (2H/3M/2L). Applied all 7: H-1 local TooltipProvider wrap (anomaly indicator now works even outside dashboard layout); H-2 anomaly tooltip test triggers hover and asserts both diagnostic values; M-1 monitor route added to e2e ROUTES fixture; M-2 showFullError now explicit with !isLoading gate (matches 90.3 canonical); M-3 removed redundant generatedAt footer (kept lastSyncAt only per AC-4) + removed generatedAt prop from MonitorKpiCards interface; L-1 skeleton test scoped by aria-label; L-2+L-3 accessible card markup (role="region" aria-label) — fulfills AC-5 + eliminates trivially-true bare-number match. Re-validation: 6916 tests pass, 0 regressions, check:docs unchanged. Status → done. |

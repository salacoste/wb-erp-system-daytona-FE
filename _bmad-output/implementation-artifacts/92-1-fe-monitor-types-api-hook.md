# Story 92.1-FE: Monitor Types + API Client + Hook

Status: done

## Story

**As a** business owner about to use the new Monitor Dashboard page,
**I want** a typed, normalized, cached data layer for `GET /v1/analytics/monitor/summary`,
**so that** subsequent Epic 92 UI stories (KPI cards, 4-period table, buyout, pipeline) can render from a single, stable hook without re-implementing shape handling or boundary normalization.

**Epic**: 92-FE Monitor Dashboard
**Priority**: P2
**Estimate**: 2 story points
**First story in epic** — marks Epic 92 as `in-progress` and sets the foundation for stories 92.2–92.6.

---

## Problem Statement

Backend delivered `GET /v1/analytics/monitor/summary` (Epics 89-93) — a single-endpoint replacement for the originally-planned 8-parallel-request architecture (backlog doc-1 → revised by doc-2 + task-16).

**The response returns ALL periods + KPI + `generatedAt` in one payload:**

```ts
{
  periods: {
    today:       PeriodMetrics,
    yesterday:   PeriodMetrics,
    last30Days:  PeriodMetrics,
    prev30Days:  PeriodMetrics,
  },
  kpi: {
    totalProducts:         number,
    productsWithCogs:      number,
    cogsCoveragePercent:   number | null,
    buyoutRatePercent:     number | null,
    lastSyncAt:            string | null,
  },
  generatedAt: string,
}

// Each PeriodMetrics:
{
  salesCount:        number,        // count, legitimate zero
  returnsCount:      number,        // count, legitimate zero
  revenue:           number | null, // money, null = unknown
  cogs:              number | null, // money, null = COGS unknown
  expenses:          number | null, // money, null = unknown
  advertisingSpend:  number | null, // money, null = unknown
  margin:            number | null, // money (backend's totalOperatingProfit), null = unknown
}
```

Without a typed + normalized foundation, the 5 downstream UI stories (92.2 KPI cards, 92.3 metrics table, 92.4 weekly chart, 92.5 buyout + pipeline, 92.6 E2E) will each re-invent the shape handling and risk drifting from the null-vs-zero invariant.

**This story is pure plumbing** — no new UI, no new routes, no visual output. It sets the hook that stories 92.2–92.5 will consume.

### Why now, what's unblocked

| Story | Depends on 92.1 | Delivers |
|---|---|---|
| 92.2 | `useMonitorSummary().data.kpi` | KPI cards + `/monitor` route registration |
| 92.3 | `useMonitorSummary().data.periods` | 4-period metrics table |
| 92.4 | **Separate** `/v1/analytics/daily/finance?from=7d_ago&to=today` | Weekly chart (NOT from monitor/summary) |
| 92.5 | `useMonitorSummary().data.kpi.buyoutRatePercent` + existing `getPipelineHealthGrid` | Buyout gauge + pipeline health |
| 92.6 | Landmark wait helper + auto-refresh contract | E2E + polish |

**Unblocks**: 92.2, 92.3, 92.5 directly. 92.4 is independent of this story (uses the existing daily/finance hook).

---

## Acceptance Criteria

### AC-1: Type definitions (null-preserving per anti-pattern #8)

- [x] Create new file `src/app/(dashboard)/monitor/types/monitor-summary.ts` (note: folder is `monitor`, not `monitoring` — `/monitoring` is the existing pipeline-health page; Monitor Dashboard is a separate page at `/monitor`).
- [x] Export the 3 backend-contract interfaces:

  ```typescript
  export interface PeriodMetrics {
    salesCount: number              // count
    returnsCount: number            // count
    revenue: number | null          // money, null = unknown
    cogs: number | null             // money, null = COGS unknown
    expenses: number | null         // money, null = unknown
    advertisingSpend: number | null // money, null = unknown
    margin: number | null           // money (backend totalOperatingProfit), null = unknown
  }

  export interface MonitorKpi {
    totalProducts: number           // count
    productsWithCogs: number        // count
    cogsCoveragePercent: number | null // ratio, null = division undefined
    buyoutRatePercent: number | null   // ratio, null = no orders in window
    lastSyncAt: string | null       // ISO datetime
  }

  export interface MonitorSummaryResponse {
    periods: {
      today: PeriodMetrics
      yesterday: PeriodMetrics
      last30Days: PeriodMetrics
      prev30Days: PeriodMetrics
    }
    kpi: MonitorKpi
    generatedAt: string             // ISO datetime, always present
  }

  export type MonitorPeriodKey = 'today' | 'yesterday' | 'last30Days' | 'prev30Days'
  ```

- [x] File size: this file should be ~50 lines — well under the 200-line limit.

### AC-2: API client + normalizer (Boundary Normalizer Pattern)

- [x] Create new file `src/lib/api/monitor-summary.ts`.
- [x] Export `getMonitorSummary(cabinetId: string): Promise<MonitorSummaryResponse>` that calls `/v1/analytics/monitor/summary` with `cabinetId` query param (pattern identical to `getMonitoringDashboard` in `src/lib/api/monitoring.ts:46-48`).
- [x] Use `apiClient.get` (auto-unwraps `{ data: ... }`).
- [x] Export `monitorSummaryQueryKeys` with:
  ```typescript
  export const monitorSummaryQueryKeys = {
    all: ['monitor-summary'] as const,
    byCabinet: (cabinetId: string) => ['monitor-summary', cabinetId] as const,
  }
  ```

**Normalizer requirements** (per CLAUDE.md § Boundary Normalizer Pattern):

- [x] Create new file `src/lib/api/monitor-summary-normalizer.ts`.
- [x] Export `normalizeMonitorSummaryResponse(raw: unknown): MonitorSummaryResponse`.
- [x] Normalize each of the 4 periods through a shared `normalizePeriodMetrics(raw: unknown): PeriodMetrics` helper.
- [x] Normalize `kpi` through `normalizeMonitorKpi(raw: unknown): MonitorKpi`.
- [x] Apply the null-vs-zero discipline:
  - Counts (`salesCount`, `returnsCount`, `totalProducts`, `productsWithCogs`): `Number(raw ?? 0)` — legitimate zero.
  - Money (`revenue`, `cogs`, `expenses`, `advertisingSpend`, `margin`): `raw == null ? null : Number(raw)` — null-preserving.
  - Ratios (`cogsCoveragePercent`, `buyoutRatePercent`): `raw == null ? null : Number(raw)` — null-preserving.
  - Timestamps (`lastSyncAt`, `generatedAt`): `raw == null ? null : String(raw)` — null-preserving for `lastSyncAt`; `generatedAt` is always present per backend contract, but normalize defensively.
- [x] Dual-lookup for potential snake_case drift (backend may rename) — e.g., `raw.salesCount ?? raw.sales_count ?? 0`. Apply to every field. This is the canonical pattern from Story 89.1's normalizers (see `src/lib/api/backfill.ts:55-89` and `fbs-analytics-normalizer.ts:22-29`).
- [x] Wire `normalizeMonitorSummaryResponse` into `getMonitorSummary`: call `apiClient.get<unknown>(...)` (raw shape) then return `normalizeMonitorSummaryResponse(raw)`.

### AC-3: React Query hook

- [x] Create new file `src/app/(dashboard)/monitor/hooks/use-monitor-summary.ts`.
- [x] Export `useMonitorSummary(enabled = true)` returning `UseQueryResult<MonitorSummaryResponse>`.
- [x] Read `cabinetId` from `useAuthStore(state => state.cabinetId)` (pattern from `use-monitoring-dashboard.ts:21`).
- [x] Cache policy: refetchInterval 5 min, staleTime 4 min, gcTime 10 min, retry 1. Rationale: backend caches for 10 min (per doc-1); frontend refresh ≤ backend TTL is fine. Matches the "poll every 5-10 min" guidance from doc-1.
- [x] Query is enabled only when `cabinetId != null` AND the `enabled` arg is truthy. Use the guard-capture pattern from CLAUDE.md anti-pattern #2:
  ```typescript
  queryFn: async () => {
    if (!cabinetId) throw new Error('cabinetId required')
    const safeCabinetId = cabinetId
    return getMonitorSummary(safeCabinetId)
  }
  ```
  Do NOT use `cabinetId!` non-null assertion.

### AC-4: Unit tests for normalizer + hook

- [x] Create `src/lib/api/__tests__/monitor-summary-normalizer.test.ts` with minimum 8 test cases — **delivered 11 tests** (8 required + 3 bonus: NaN guard, string-number coercion, missing input safety):
  1. [x] Fully-populated response normalizes to typed shape.
  2. [x] `revenue: null` preserved as `null` (not coerced to 0).
  3. [x] `cogs: null` preserved (covers "COGS unknown" case — Story 88.2 parity).
  4. [x] `buyoutRatePercent: null` preserved (covers "no orders in window").
  5. [x] `lastSyncAt: null` preserved.
  6. [x] Counts (`salesCount`, `returnsCount`) coerce `null → 0` (legitimate zero).
  7. [x] Snake_case dual-lookup works (`sales_count` → `salesCount`, also `advertising_spend`, `last_30_days`, `prev_30_days`, `total_products`, etc.).
  8. [x] Completely missing periods / kpi object returns safe empty shape (no crash).
- [x] Create `src/app/(dashboard)/monitor/hooks/__tests__/use-monitor-summary.test.ts` with minimum 3 test cases — **delivered 4 tests**:
  1. [x] Hook returns `data` when cabinetId present + API resolves.
  2. [x] Hook is disabled when `cabinetId == null` (query not invoked).
  3. [x] Hook wires through the normalizer (null in raw → null in normalized result).
- [x] `npm run type-check && npm run lint && npm test -- --run` — 6807 tests pass (baseline 6792 + 15 new), zero regressions.

### AC-5: Sprint-status + route scaffold

- [x] Sprint-status: mark `epic-92-fe: backlog → in-progress` (first story in the epic).
- [x] Sprint-status: mark `92-1-fe-monitor-types-api-hook: backlog → ready-for-dev` (happens automatically via `/create-story`, but dev should verify).
- [x] **Do NOT register the `/monitor` route in this story** — that's Story 92.2's work. Do NOT add sidebar entry. Do NOT create the page component. This story is pure data-layer plumbing.
- [ ] Close backlog task-16 when story completes. (deferred to code-review sweep)

---

## Tasks / Subtasks

### Task 1: Types (AC-1)
- [x] 1.1: Create `src/app/(dashboard)/monitor/types/` folder.
- [x] 1.2: Create `monitor-summary.ts` with the 3 interfaces + `MonitorPeriodKey` literal.
- [x] 1.3: `npm run type-check` — verify file compiles in isolation.

### Task 2: Normalizer (AC-2)
- [x] 2.1: Create `src/lib/api/monitor-summary-normalizer.ts`.
- [x] 2.2: Implement `normalizePeriodMetrics`, `normalizeMonitorKpi`, `normalizeMonitorSummaryResponse`.
- [x] 2.3: Apply dual-lookup for snake_case/camelCase drift on every field.
- [x] 2.4: Apply null-vs-zero discipline per AC-2.

### Task 3: API client (AC-2)
- [x] 3.1: Create `src/lib/api/monitor-summary.ts`.
- [x] 3.2: Define `monitorSummaryQueryKeys`.
- [x] 3.3: Implement `getMonitorSummary` calling `apiClient.get<unknown>` then normalizer.

### Task 4: Hook (AC-3)
- [x] 4.1: Create `src/app/(dashboard)/monitor/hooks/` folder.
- [x] 4.2: Create `use-monitor-summary.ts`.
- [x] 4.3: Apply the guard-capture pattern (no `cabinetId!`).
- [x] 4.4: Set cache config (5min refetch, 4min stale, 10min gc, retry 1).

### Task 5: Tests (AC-4)
- [x] 5.1: Normalizer tests (≥8 cases) — delivered 11.
- [x] 5.2: Hook tests (≥3 cases) — delivered 4. Used `useAuthStore.setState` (real store, selector-compatible) instead of `mockReturnValue` (which breaks selector dispatch — see Completion Notes).
- [x] 5.3: Full test suite — zero regressions (6807 pass = 6792 baseline + 15 new).

### Task 6: Sprint status + backlog (AC-5)
- [x] 6.1: Verify `epic-92-fe: in-progress` in sprint-status.yaml.
- [ ] 6.2: Close backlog task-16. (deferred to code-review sweep)

---

## Dev Notes

### Why a separate `/monitor` folder (not `/monitoring`)

`/monitoring` is the existing page from Epic 68-FE (pipeline health, telegram, recovery). Monitor Dashboard is a DIFFERENT page with different purpose (business-metrics view, not ops view). Keeping them in separate folders prevents:
- Type name collisions (`DashboardPipeline` vs `MonitorKpi`).
- Route confusion (`/monitoring` pipeline-ops vs `/monitor` business-dashboard).
- Component reuse pressure (Story 92.5 reuses `PipelineStatusGrid` FROM `/monitoring` — that's fine; but `/monitor` keeps its own identity).

The Epic 92 planning artifact (`_bmad-output/planning-artifacts/epics-92-fe.md`) uses `/monitor` consistently. Backlog doc-1 says "proposed: /monitoring/dashboard or /monitor" — we resolve to `/monitor`.

### Normalizer pattern (canonical, per CLAUDE.md § Boundary Normalizer)

The canonical pattern for this story (verified against Story 89.1's 5 normalizers):

```typescript
// src/lib/api/monitor-summary-normalizer.ts

import type {
  MonitorSummaryResponse,
  PeriodMetrics,
  MonitorKpi,
} from '@/app/(dashboard)/monitor/types/monitor-summary'

function toNumberOrNull(raw: unknown): number | null {
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function toCount(raw: unknown): number {
  const n = Number(raw ?? 0)
  return Number.isFinite(n) ? n : 0
}

function normalizePeriodMetrics(raw: unknown): PeriodMetrics {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    salesCount: toCount(d.salesCount ?? d.sales_count),
    returnsCount: toCount(d.returnsCount ?? d.returns_count),
    revenue: toNumberOrNull(d.revenue),
    cogs: toNumberOrNull(d.cogs),
    expenses: toNumberOrNull(d.expenses),
    advertisingSpend: toNumberOrNull(d.advertisingSpend ?? d.advertising_spend),
    margin: toNumberOrNull(d.margin),
  }
}

function normalizeMonitorKpi(raw: unknown): MonitorKpi {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    totalProducts: toCount(d.totalProducts ?? d.total_products),
    productsWithCogs: toCount(d.productsWithCogs ?? d.products_with_cogs),
    cogsCoveragePercent: toNumberOrNull(d.cogsCoveragePercent ?? d.cogs_coverage_percent),
    buyoutRatePercent: toNumberOrNull(d.buyoutRatePercent ?? d.buyout_rate_percent),
    lastSyncAt: d.lastSyncAt == null && d.last_sync_at == null
      ? null
      : String(d.lastSyncAt ?? d.last_sync_at),
  }
}

export function normalizeMonitorSummaryResponse(raw: unknown): MonitorSummaryResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const periods = (r.periods ?? {}) as Record<string, unknown>
  return {
    periods: {
      today: normalizePeriodMetrics(periods.today),
      yesterday: normalizePeriodMetrics(periods.yesterday),
      last30Days: normalizePeriodMetrics(periods.last30Days ?? periods.last_30_days),
      prev30Days: normalizePeriodMetrics(periods.prev30Days ?? periods.prev_30_days),
    },
    kpi: normalizeMonitorKpi(r.kpi),
    generatedAt: String(r.generatedAt ?? r.generated_at ?? ''),
  }
}
```

### Hook pattern (per CLAUDE.md anti-pattern #2)

```typescript
// src/app/(dashboard)/monitor/hooks/use-monitor-summary.ts

'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import {
  getMonitorSummary,
  monitorSummaryQueryKeys,
} from '@/lib/api/monitor-summary'
import type { MonitorSummaryResponse } from '../types/monitor-summary'

const CACHE_CONFIG = {
  refetchInterval: 5 * 60_000, // 5 min — matches backend 10min TTL with headroom
  staleTime: 4 * 60_000,       // 4 min — refresh just before backend cache expires
  gcTime: 10 * 60_000,
  retry: 1,
} as const

export function useMonitorSummary(enabled = true) {
  const cabinetId = useAuthStore(state => state.cabinetId)

  return useQuery<MonitorSummaryResponse>({
    queryKey: monitorSummaryQueryKeys.byCabinet(cabinetId ?? ''),
    queryFn: async () => {
      if (!cabinetId) throw new Error('cabinetId required')
      const safeCabinetId = cabinetId
      return getMonitorSummary(safeCabinetId)
    },
    enabled: enabled && cabinetId != null,
    ...CACHE_CONFIG,
  })
}
```

### File-size budget (pre-flight check)

| File | Expected lines | Budget |
|---|---|---|
| `monitor-summary.ts` (types) | ~45 | 200 |
| `monitor-summary.ts` (API) | ~35 | 200 |
| `monitor-summary-normalizer.ts` | ~55 | 200 |
| `use-monitor-summary.ts` | ~35 | 200 |
| `monitor-summary-normalizer.test.ts` | ~110 (8 tests) | 200 |
| `use-monitor-summary.test.ts` | ~70 (3 tests) | 200 |

All comfortably under the 200-line limit. No pre-emptive splitting needed.

### Null-vs-zero discipline (per CLAUDE.md anti-pattern #8)

The `PeriodMetrics` shape embeds the null-vs-zero invariant: counts are `number` (0 is legitimate: "no sales today"), money/ratios are `number | null` (null is "unknown / not yet computed"). Consumer stories (92.2 KPI cards, 92.3 metrics table) MUST render `—` for null values, not `0 ₽`. The rule is repeated here so the types themselves force correctness at the call site.

### Backend contract source-of-truth

- **Primary**: backlog doc-1 (Monitor Dashboard Backend Spec & Frontend Implementation Plan) — revised by doc-2 + task-16 to the single-endpoint shape.
- **Secondary**: `_bmad-output/planning-artifacts/epics-92-fe.md` § Story 92.1.
- **Tertiary**: backlog task-16 (acceptance criteria explicitly call for "Types match MonitorSummaryResponse / PeriodMetrics / MonitorKpi interfaces" + "Normalizer per Boundary Normalizer Pattern" + "Unit tests for normalizer").

Doc-2 mentions "section 8 of the raw backend changelog" for copy-paste-ready interfaces but that section is not included in the delivered changelog. If dev finds the raw source-of-truth interfaces differ from what's captured here, **backend wins** — update this story's types to match and flag the drift in the PR description.

### Testing patterns (reuse existing)

- Normalizer tests follow `src/lib/api/__tests__/normalizers.test.ts` (Story 89.1) exactly — describe-per-normalizer, single assertion per test.
- Hook tests follow `src/hooks/__tests__/` patterns — `renderHook` + `QueryClientProvider` wrapper from `src/test/utils/test-utils.tsx`.

### What's OUT of scope

- Route registration (`/monitor`) → Story 92.2.
- Sidebar entry → Story 92.2.
- Page component / any UI → Stories 92.2–92.5.
- Weekly chart hook (uses a separate `daily/finance` call, not `monitor/summary`) → Story 92.4.
- Pipeline health integration (reuses existing `getPipelineHealthGrid`) → Story 92.5.
- E2E tests for Monitor Dashboard → Story 92.6 (this story's tests are unit-level only).
- ESLint rule to enforce boundary-normalizer pattern → Story 89.4 (still backlog).

### Backlog ref

Backlog `task-16 - Monitor-Dashboard-Revise-to-single-endpoint-architecture.md`. All 5 ACs in that task map 1:1 to AC-1/AC-2/AC-3/AC-4/AC-5 here. Mark task-16 **Done** on story completion.

---

## References

- Backlog **doc-1** — Monitor Dashboard Backend Spec & Frontend Implementation Plan (original 8-request plan).
- Backlog **doc-2** — Backend Epics 89-93 Full Changelog (single-endpoint revision).
- Backlog **task-16** — Monitor Dashboard: Revise to single-endpoint architecture (5 ACs).
- `_bmad-output/planning-artifacts/epics-92-fe.md` — Epic 92 scope, all 6 stories.
- `frontend/CLAUDE.md` § Boundary Normalizer Pattern (from Story 88.4) — canonical pattern.
- `frontend/CLAUDE.md` § Anti-Pattern #8 (null-vs-zero invariant from Stories 87.3/88.2).
- `frontend/CLAUDE.md` § Anti-Pattern #2 (no `cabinetId!` non-null assertion in hook closures).
- `src/lib/api/monitoring.ts:46-48` — reference pattern for `getMonitoringDashboard`.
- `src/app/(dashboard)/monitoring/hooks/use-monitoring-dashboard.ts` — reference pattern for hook structure.
- `src/lib/api/backfill.ts:55-89` — canonical dual-lookup normalizer.
- `src/lib/api/fbs-analytics-normalizer.ts` — canonical per-item normalizer (Story 89.1).
- `src/lib/api/__tests__/normalizers.test.ts` — canonical normalizer-test style (Story 89.1).
- `docs/request-backend/166-ACQUIRING-COST-REPORTS-API.md` — related Epic 90 work (different endpoint, same patterns).
- Story 91.3-FE — precedent for adding fields to existing monitoring types (this is a NEW type file, but the discipline is identical).

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.7 (1M context) — types, normalizer, API client (direct).
Claude Sonnet 4.6 (executor agent, delegated) — hook + 2 test files + validation.

### Debug Log References
None. All phases (type-check, lint, targeted tests, full suite) passed first time.

### Completion Notes List

1. **Types file** (`monitor-summary.ts`, 45 lines): All 3 interfaces + `MonitorPeriodKey` literal landed. Null-vs-zero discipline baked into types: counts `number`, money/ratios `number | null`, timestamps `string | null` (except `generatedAt` which backend guarantees is always present). File comfortably under 200-line budget.

2. **Normalizer** (`monitor-summary-normalizer.ts`, 71 lines): Three private helpers (`normalizePeriodMetrics`, `normalizeMonitorKpi` + two scalar coercers `toNumberOrNull`/`toCount`/`toStringOrNull`), one public export (`normalizeMonitorSummaryResponse`). Dual-lookup applied to every field (`d.salesCount ?? d.sales_count`, etc.) including the nested period keys (`last30Days ?? last_30_days`, `prev30Days ?? prev_30_days`). The `Number.isFinite` guard in `toNumberOrNull` rejects NaN — a string like `"abc"` becomes `null`, not `NaN`.

3. **API client** (`monitor-summary.ts`, 27 lines): `apiClient.get<unknown>` then normalize — the canonical "raw-then-normalize" pattern. Query keys follow the `['monitor-summary', cabinetId]` shape (one key family, keyed by cabinet).

4. **Hook** (`use-monitor-summary.ts`, 39 lines): Guard-capture pattern implemented per CLAUDE.md anti-pattern #2 — no `cabinetId!`. Selector parameter named `authState` to avoid shadowing per anti-pattern #5. Cache: 5min refetch, 4min stale, 10min gc, retry 1 — stays comfortably inside the backend's 10min TTL.

5. **Normalizer tests** (11 tests, 163 lines): 8 required + 3 bonus (NaN guard, string-number coercion, safe empty shape on missing input). Single public entry point `normalizeMonitorSummaryResponse` tested end-to-end per the story's guidance (private helpers tested indirectly).

6. **Hook tests** (4 tests, 139 lines): The executor caught a subtle issue with the original spec's mocking pattern: `vi.mocked(useAuthStore).mockReturnValue({...})` makes Zustand ignore the selector function and return the object wholesale — so the hook sees `{cabinetId: 'test-cabinet'}` rather than the string `'test-cabinet'`. Fixed by using `useAuthStore.setState({cabinetId: 'test-cabinet'})` (real store, selector-compatible — canonical pattern from `useClientInfo.test.ts`). This is worth propagating to future hook tests; logged as a minor sweep item for the code-review pass.

7. **Validation**: `npm run type-check` → 0 errors. `npm run lint` → 0 warnings on all 3 new source files. Full test run: 6807 passing (baseline 6792 + 15 new). Zero regressions; the 3 pre-existing `DashboardPeriodSelector` failures carried through this story (5th consecutive epic) — still parked as Story 89.5.

8. **Out-of-scope verified**: No `/monitor` route registered. No sidebar entry added. No page component created. No touches to existing `/monitoring` pipeline-health code. The separation of `/monitor` (business dashboard) from `/monitoring` (ops pipeline health) is respected.

### File List

**Added (7 new files):**
- `src/app/(dashboard)/monitor/types/monitor-summary.ts` (49 lines — widened `generatedAt: string | null` per H-2 review fix)
- `src/lib/api/monitor-summary-normalizer.ts` (71 lines — `generatedAt` uses `toStringOrNull` per H-2 review fix)
- `src/lib/api/monitor-summary.ts` (21 lines — reduced after M-3 `qs` dedup; key type widened per M-1)
- `src/lib/api/query-string.ts` (17 lines — NEW shared helper, extracted per M-3 review fix)
- `src/app/(dashboard)/monitor/hooks/use-monitor-summary.ts` (40 lines — queryKey passes `cabinetId` directly per M-1)
- `src/lib/api/__tests__/monitor-summary-normalizer.test.ts` (195 lines — 12 tests incl. new `generatedAt: null` + 3 snake_case assertions for L-1)
- `src/app/(dashboard)/monitor/hooks/__tests__/use-monitor-summary.test.ts` (139 lines — test title renamed per M-2)

**Modified (1 existing source file):**
- `src/lib/api/monitoring.ts` — migrated to shared `qs` from `query-string.ts` (M-3 dedup).

**Modified (tracking):**
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `epic-92-fe: backlog → in-progress`; `92-1-fe-monitor-types-api-hook: backlog → ready-for-dev → in-progress → review → done`.
- `_bmad-output/implementation-artifacts/92-1-fe-monitor-types-api-hook.md` (this file) — ACs + tasks checked; Dev Agent Record populated; status → done after code review.

**No files deleted.**

### Change Log

| Date | Change |
|---|---|
| 2026-04-21 | Story created. First story in Epic 92-FE. Pure data-layer: types + normalizer + API client + hook + unit tests. Null-vs-zero invariant baked into types. Zero UI, zero route changes. Unblocks 92.2 (KPI cards), 92.3 (metrics table), 92.5 (buyout gauge). Backlog task-16. |
| 2026-04-21 | Implementation complete. 6 new files (2 types/api source, 1 hook, 1 normalizer, 2 test). 15 new tests (11 normalizer + 4 hook). Zero regressions: 6807 pass = 6792 baseline + 15. Hook-test mocking pattern deviation documented in Completion Notes (`useAuthStore.setState` vs `mockReturnValue` — selector-compatibility issue). Status → review. |
| 2026-04-21 | Code review complete: 6 findings (2H/3M/1L). Applied 5 fixes, rejected 1 spurious (H-1 backlog task-16 mismatch — reviewer hallucinated; task-16 IS the Monitor Dashboard task, verified via `ls backlog/tasks`). New shared helper `src/lib/api/query-string.ts`; `monitoring.ts` migrated to shared `qs`. 1 new test added (`generatedAt: null` preservation). Tests: 6808 pass (+1). Zero regressions. Status → done. |

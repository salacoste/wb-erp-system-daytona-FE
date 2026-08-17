# Story 90.1-FE: Acquiring Types + API Client + Hooks Foundation

Status: done

## Story

**As a** business owner about to see acquiring (payment-processing) costs in the frontend,
**I want** a typed, normalized, cached data layer for the 3 new `GET /v1/analytics/acquiring/*` endpoints,
**so that** subsequent Epic 90 UI stories (90.2 list page, 90.3 report detail, 90.4 period detail, 90.5 dashboard integration) can render from stable hooks without re-implementing snake_case → camelCase transforms or null-vs-zero handling.

**Epic**: 90-FE Acquiring Cost Reports UI
**Priority**: P2
**Estimate**: 3 story points
**First story in epic** — marks Epic 90 as `in-progress` and lays the foundation for Stories 90.2–90.5.

---

## Problem Statement

Wildberries released 3 new Finance API endpoints on 2026-04-15 for **acquiring cost reports** (payment-processing fees the seller pays on card transactions — a fifth material expense line currently invisible in our analytics). Backend delivered frontend-facing endpoints per Request #166 on 2026-04-19 (doc-2). **Epic 90 is now fully unblocked.**

This story ships the data layer only: types, API client with normalizers, and hooks. **No UI.** UI is Stories 90.2–90.5.

### The 3 backend endpoints (copy-paste ready from `test-api/34-acquiring-analytics.http`)

| Endpoint | Purpose | Response |
|---|---|---|
| `GET /v1/analytics/acquiring/reports?from=&to=` | List of acquiring reports for a period | `{ data: AcquiringReportListItem[], cached_at: string }` |
| `GET /v1/analytics/acquiring/reports/:id/detail` | Transaction detail for a specific report | `{ data: AcquiringReportDetailItem[], cached_at: string }` |
| `GET /v1/analytics/acquiring/detail?from=&to=` | Cross-report transaction detail for a period | `{ data: AcquiringReportDetailItem[], cached_at: string }` |

### Backend response shapes (snake_case, null-preserving for money fields)

**`AcquiringReportListItem`** (one entry = one report):
```
{
  "report_id": number
  "seller_finance_name": string
  "date_from": string            // ISO date, report period start
  "date_to": string              // ISO date, report period end
  "create_date": string          // ISO date, report generation date
  "currency": string             // e.g. "RUB"
  "acquiring_fee_sum": number | null       // money, nullable
  "acquiring_fee_vat_sum": number | null   // money, nullable
}
```

**`AcquiringReportDetailItem`** (one entry = one acquiring transaction):
```
{
  "rrd_id": number
  "report_id": number
  "acq_date": string             // ISO date, when fee was charged
  "acquiring_bank": string
  "sale_date": string            // ISO date, original sale
  "srid": string                 // WB's internal sale ID
  "doc_type_name": string        // e.g. "Продажа", "Возврат"
  "nm_id": number                // product SKU
  "retail_amount": number | null      // money, nullable
  "acquiring_fee": number | null      // money, nullable
  "acquiring_fee_vat": number | null  // money, nullable
  "currency": string
}
```

### Backend contract details (from Request #166 + doc-2)

- **Auth**: `X-Cabinet-Id` header (auto-injected by `apiClient`).
- **Cache**: Backend caches 30 min. Every response includes `cached_at` for freshness display.
- **Non-RF sellers**: Return `200` with empty `data: []` (not a 404 — distinct from "report ID doesn't exist" which ALSO returns 200 with empty data).
- **Rate limits**: WB Finance scope, likely 3-5 req/min. Backend handles the WB-side rate limit; frontend should stay within 1 req per user action.
- **Errors**: Missing `from`/`to` → 400. Invalid date format → 400. `from > to` → 400. Non-numeric `:id` → 400.

### Why this story's scope is "data layer only"

- Epic 90 has 5 stories totaling 19 SP. Splitting by layer gives each story a single responsibility:
  - **90.1 (this story)**: types + API client + normalizers + hooks + unit tests. ZERO UI.
  - **90.2**: list page `/analytics/acquiring` (consumes `useAcquiringReports`).
  - **90.3**: single-report detail view (consumes `useAcquiringReportDetail`).
  - **90.4**: cross-report period detail view (consumes `useAcquiringPeriodDetail`).
  - **90.5**: dashboard integration (consumes the hooks where appropriate).
- The split allows 90.2/90.3/90.4 to run in parallel after 90.1 lands.
- Matches the pattern established by Story 92.1 (Monitor foundation) — foundation story ships types + hook only.

---

## Acceptance Criteria

### AC-1: TypeScript types (null-preserving per anti-pattern #8)

- [x] Create new file `src/types/acquiring-analytics.ts` with the 4 core interfaces:

  ```typescript
  export interface AcquiringReportListItem {
    reportId: number
    sellerFinanceName: string
    dateFrom: string              // ISO date
    dateTo: string                // ISO date
    createDate: string            // ISO date
    currency: string
    acquiringFeeSum: number | null    // money — null = unknown
    acquiringFeeVatSum: number | null // money — null = unknown
  }

  export interface AcquiringReportDetailItem {
    rrdId: number
    reportId: number
    acqDate: string               // ISO date
    acquiringBank: string
    saleDate: string              // ISO date
    srid: string
    docTypeName: string
    nmId: number
    retailAmount: number | null       // money — null = unknown
    acquiringFee: number | null       // money — null = unknown
    acquiringFeeVat: number | null    // money — null = unknown
    currency: string
  }

  export interface AcquiringListResponse {
    data: AcquiringReportListItem[]
    cachedAt: string
  }

  export interface AcquiringDetailResponse {
    data: AcquiringReportDetailItem[]
    cachedAt: string
  }
  ```

- [x] Also export 3 param types:
  ```typescript
  export interface AcquiringReportsParams { from: string; to: string }
  export interface AcquiringReportDetailParams { reportId: number }
  export interface AcquiringPeriodDetailParams { from: string; to: string }
  ```

- [x] **camelCase is the frontend convention.** Match Story 92.1 + buyout-analytics patterns (not snake_case — the Boundary Normalizer bridges backend's snake_case to camelCase at the boundary).

- [x] File size: expected ~60 lines — well under the 200-line limit.

### AC-2: Boundary Normalizer (per CLAUDE.md § Boundary Normalizer Pattern)

- [x] Create new file `src/lib/api/acquiring-normalizer.ts`.
- [x] Export 2 normalizers:
  - `normalizeAcquiringListResponse(raw: unknown): AcquiringListResponse`
  - `normalizeAcquiringDetailResponse(raw: unknown): AcquiringDetailResponse`
- [x] Internal helpers (not exported):
  - `normalizeReportListItem(raw: unknown): AcquiringReportListItem`
  - `normalizeReportDetailItem(raw: unknown): AcquiringReportDetailItem`
  - `toNumberOrNull(raw: unknown): number | null` (rejects NaN via `Number.isFinite`)
  - `toStringOrNull(raw: unknown): string | null` (for defensive string coercion)

- [x] **Null-vs-zero discipline:**
  - Money fields (`acquiringFeeSum`, `acquiringFeeVatSum`, `retailAmount`, `acquiringFee`, `acquiringFeeVat`) → `number | null`, preserve null.
  - Counts / IDs (`reportId`, `rrdId`, `nmId`) → `number`, coerce to 0 on missing (but backend always sends these — defensive default).
  - Strings (`sellerFinanceName`, `dateFrom`, `dateTo`, `createDate`, `currency`, `acquiringBank`, `saleDate`, `srid`, `docTypeName`, `acqDate`) → `string`, coerce to `''` on missing. **Do NOT null-preserve strings unless backend contract says nullable** — backend sends these consistently per Request #166 response samples.
  - Timestamps (`cachedAt`): `string`, coerce to `''` on missing (not null — `cached_at` is contractually always present per backend).

- [x] **Dual-lookup for snake_case/camelCase drift** on every field (per Story 89.1 + 92.1 canonical pattern):
  ```typescript
  reportId: Number(d.reportId ?? d.report_id ?? 0)
  dateFrom: String(d.dateFrom ?? d.date_from ?? '')
  acquiringFeeSum: toNumberOrNull(d.acquiringFeeSum ?? d.acquiring_fee_sum)
  ```
  Apply to every field, every item.

- [x] Wire the normalizers into the API client (AC-3).

### AC-3: API client

- [x] Create new file `src/lib/api/acquiring-analytics.ts`.
- [x] Import `apiClient`, `qs` (from Story 92.1's shared helper at `src/lib/api/query-string.ts`), the 2 normalizers, and the types.
- [x] Export 3 async functions:

  ```typescript
  getAcquiringReports(params: AcquiringReportsParams): Promise<AcquiringListResponse>
  getAcquiringReportDetail(params: AcquiringReportDetailParams): Promise<AcquiringDetailResponse>
  getAcquiringPeriodDetail(params: AcquiringPeriodDetailParams): Promise<AcquiringDetailResponse>
  ```

  Each calls `apiClient.get<unknown>(endpoint, { skipDataUnwrap: true })` then routes raw through the appropriate normalizer. **Use `skipDataUnwrap: true`** — the response envelope is `{ data: [...], cached_at: "..." }`, where `data` is a meaningful field on the response object (not the auto-unwrapped payload). Auto-unwrap would lose `cachedAt`.

- [x] Export query-keys factory:

  ```typescript
  export const acquiringQueryKeys = {
    all: ['acquiring'] as const,
    reports: (params: AcquiringReportsParams) => ['acquiring', 'reports', params] as const,
    reportDetail: (reportId: number) => ['acquiring', 'report-detail', reportId] as const,
    periodDetail: (params: AcquiringPeriodDetailParams) => ['acquiring', 'period-detail', params] as const,
  }
  ```

### AC-4: Three React Query hooks

Create 3 new files, one per hook:

- [x] `src/hooks/use-acquiring-reports.ts` — `useAcquiringReports(from: string, to: string, enabled = true)`.
- [x] `src/hooks/use-acquiring-report-detail.ts` — `useAcquiringReportDetail(reportId: number | null, enabled = true)`.
- [x] `src/hooks/use-acquiring-period-detail.ts` — `useAcquiringPeriodDetail(from: string, to: string, enabled = true)`.

**All 3 hooks:**
- Use `useAuthStore(authState => authState.cabinetId)` for cabinet gating (via `apiClient` auto-header injection).
- Cache config: `staleTime: 30 * 60_000` (30 min — matches backend cache TTL), `gcTime: 60 * 60_000`, `retry: 1`. **Do NOT set `refetchInterval`** — acquiring data is slow-moving, user-triggered refresh only.
- `enabled` guard:
  - `useAcquiringReports`: `enabled && cabinetId != null && from !== '' && to !== ''`.
  - `useAcquiringReportDetail`: `enabled && cabinetId != null && reportId != null`.
  - `useAcquiringPeriodDetail`: `enabled && cabinetId != null && from !== '' && to !== ''`.
- Apply CLAUDE.md anti-pattern #2: capture `reportId`/`cabinetId` to a local inside the `queryFn` after an explicit guard. NO non-null assertions (`!`).
- Selector name: `authState` (avoid `state` shadowing per anti-pattern #5).

### AC-5: Unit tests

**Normalizer tests** — `src/lib/api/__tests__/acquiring-normalizer.test.ts`, minimum 12 tests:

- [x] (×2) Happy path: fully-populated list + detail responses normalize to typed shape.
- [x] (×3) Null preservation: `acquiringFeeSum: null`, `retailAmount: null`, `acquiringFee: null` all preserved as `null` (not `0`).
- [x] (×2) Snake_case dual-lookup: list response with snake_case fields (`report_id`, `date_from`, `acquiring_fee_sum`) normalizes correctly; detail response with snake_case (`rrd_id`, `nm_id`, `acquiring_fee_vat`) normalizes correctly.
- [x] (×1) NaN guard: `acquiringFee: NaN` → `null` (via `Number.isFinite`).
- [x] (×1) String-number coercion: `report_id: "12345"` → `12345` (number).
- [x] (×1) Missing `cached_at` in list response → `cachedAt: ''`.
- [x] (×1) Missing `cached_at` in detail response → `cachedAt: ''`.
- [x] (×1) Empty `data: []` normalizes to empty array without crash.

**Hook tests** — 3 files, minimum 3 tests per hook (9 total):

- [x] Hook returns normalized data when all guards pass.
- [x] Hook is disabled (`fetchStatus === 'idle'`) when `cabinetId == null`.
- [x] Hook is disabled when the required param is missing/null (varies per hook: empty `from`, null `reportId`, etc.).

Use `useAuthStore.setState({ cabinetId: 'test' })` + `afterEach` reset (per Story 92.1's corrected mocking pattern) — NOT `vi.mocked(useAuthStore).mockReturnValue({...})` which breaks selector dispatch.

- [x] `npm run type-check && npm run lint && npm test -- --run` — **6832+ tests pass** (6811 prior + 21 new). Zero regressions.

### AC-6: Planning-artifact update + sprint status

- [x] Update `_bmad-output/planning-artifacts/epics-90-fe.md` — remove the "BLOCKED on Request #166" note (Epic 89 retro action item #11). Change `**Status**: 🚧 Scoped, BLOCKED on backend Request #166` → `**Status**: In progress — Request #166 delivered 2026-04-19 (see backlog doc-2).`
- [x] Sprint-status: `epic-90-fe: backlog → in-progress` (first story in epic).
- [x] Sprint-status: `90-1-fe-acquiring-types-api-client-hooks: backlog → ready-for-dev → in-progress → review` through normal workflow.

### AC-7: What's OUT of scope

- [x] Do NOT create `/analytics/acquiring` route. That's Story 90.2.
- [x] Do NOT add sidebar entry. That's Story 90.2.
- [x] Do NOT touch any UI components.
- [x] Do NOT modify `finance-summary` response handling (Story 90.5 decides after confirming Request #166 Q3 — `acquiring_total` aggregate).
- [x] Do NOT normalize across the 2 response types (list and detail share nothing — separate normalizers).

---

## Tasks / Subtasks

### Task 1: Types (AC-1)
- [x] 1.1: Create `src/types/acquiring-analytics.ts`.
- [x] 1.2: Add 4 response types + 3 param types.
- [x] 1.3: `npm run type-check` — file compiles in isolation.

### Task 2: Normalizer (AC-2)
- [x] 2.1: Create `src/lib/api/acquiring-normalizer.ts`.
- [x] 2.2: Implement `toNumberOrNull`, `toStringOrNull` helpers (reuse pattern from `monitor-summary-normalizer.ts`).
- [x] 2.3: Implement `normalizeReportListItem`, `normalizeReportDetailItem`, `normalizeAcquiringListResponse`, `normalizeAcquiringDetailResponse`.
- [x] 2.4: Apply dual-lookup for snake_case/camelCase on every field.
- [x] 2.5: Apply null-vs-zero discipline per AC-2 table.

### Task 3: API client (AC-3)
- [x] 3.1: Create `src/lib/api/acquiring-analytics.ts`.
- [x] 3.2: Import the shared `qs` helper from `src/lib/api/query-string.ts` (DO NOT duplicate — anti-pattern per Epic 91 retro).
- [x] 3.3: Implement the 3 `get*` functions with `skipDataUnwrap: true` + normalizer routing.
- [x] 3.4: Define `acquiringQueryKeys` factory.

### Task 4: Hooks (AC-4)
- [x] 4.1: Create `src/hooks/use-acquiring-reports.ts`.
- [x] 4.2: Create `src/hooks/use-acquiring-report-detail.ts`.
- [x] 4.3: Create `src/hooks/use-acquiring-period-detail.ts`.
- [x] 4.4: Each hook applies guard-capture pattern (no `cabinetId!`), selector named `authState`.
- [x] 4.5: Set cache config (30 min stale, 60 min gc, retry 1, NO refetchInterval).

### Task 5: Tests (AC-5)
- [x] 5.1: Normalizer tests (≥12).
- [x] 5.2: Hook tests — 3 files × ≥3 tests each = ≥9 total.
- [x] 5.3: Full test suite — **6832+ passing**, zero regressions.

### Task 6: Planning-artifact + sprint status (AC-6)
- [x] 6.1: Update `epics-90-fe.md` to remove "BLOCKED" note.
- [x] 6.2: Sprint-status: `epic-90-fe: backlog → in-progress`.
- [x] 6.3: Sprint-status: `90-1: backlog → ready-for-dev` (auto on create-story), then through `in-progress → review → done`.

---

## Dev Notes

### Canonical normalizer pattern (reuse Story 89.1 + 92.1 code)

The same helper set (`toNumberOrNull`, `toCount`, `toStringOrNull`) appears in `src/lib/api/monitor-summary-normalizer.ts` (Story 92.1). **Do not duplicate the helpers** — either:
1. Extract them to a shared `src/lib/api/normalizer-helpers.ts` (preferred if this story touches monitor-summary anyway — it doesn't, so skip).
2. Re-implement inline with identical semantics (acceptable for a 3-helper set this small).

**Recommendation**: Re-implement inline. The cross-file coupling isn't worth 3 helper functions. If a 4th normalizer story appears, that's the trigger for extraction.

### Why `skipDataUnwrap: true`

The standard `apiClient.get` auto-unwraps `{ data: ... }` envelopes — so `apiClient.get<T[]>(endpoint)` returns the inner array directly.

Acquiring endpoints return `{ data: [...], cached_at: "..." }`. If we used the default unwrap, we'd get the array but lose `cached_at`. We need BOTH fields, so we use `skipDataUnwrap: true` and normalize the full envelope.

This matches the buyout-analytics pattern (see `src/lib/api/buyout-analytics.ts:41`).

### Query-key design

Query keys should include the params so the cache correctly differentiates requests:

```typescript
reports: (params) => ['acquiring', 'reports', params]  // params: {from, to}
reportDetail: (reportId) => ['acquiring', 'report-detail', reportId]
periodDetail: (params) => ['acquiring', 'period-detail', params]  // params: {from, to}
```

**Don't flatten** — passing the params object as a single key element is canonical TanStack Query style and matches `buyoutQueryKeys.bySku`.

### Hook `enabled` guard pattern (anti-pattern #2 compliance)

```typescript
export function useAcquiringReportDetail(reportId: number | null, enabled = true) {
  const cabinetId = useAuthStore(authState => authState.cabinetId)

  return useQuery<AcquiringDetailResponse>({
    queryKey: acquiringQueryKeys.reportDetail(reportId ?? -1),
    queryFn: async () => {
      if (reportId == null) throw new Error('reportId required')
      if (!cabinetId) throw new Error('cabinetId required')
      const safeReportId = reportId
      return getAcquiringReportDetail({ reportId: safeReportId })
    },
    enabled: enabled && cabinetId != null && reportId != null,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: 1,
  })
}
```

Note: `reportId ?? -1` in the queryKey is intentional — when `reportId` is null, `enabled` is false so the query never runs, but the key still needs to be deterministic. The `-1` sentinel is harmless and avoids Story 92.1's "empty string collides with real cabinet" concern because `reportId` is a number domain.

### File-size budget (pre-flight)

| File | Expected lines | Budget |
|---|---|---|
| `types/acquiring-analytics.ts` | ~60 | 200 |
| `lib/api/acquiring-analytics.ts` | ~75 | 200 |
| `lib/api/acquiring-normalizer.ts` | ~80 | 200 |
| `hooks/use-acquiring-reports.ts` | ~35 | 200 |
| `hooks/use-acquiring-report-detail.ts` | ~40 | 200 |
| `hooks/use-acquiring-period-detail.ts` | ~35 | 200 |
| `lib/api/__tests__/acquiring-normalizer.test.ts` | ~200 | 200 (tight — split if approaching) |
| `hooks/__tests__/use-acquiring-reports.test.ts` | ~100 | 200 |
| `hooks/__tests__/use-acquiring-report-detail.test.ts` | ~100 | 200 |
| `hooks/__tests__/use-acquiring-period-detail.test.ts` | ~100 | 200 |

Normalizer test file at ~200 is tight. **Split trigger**: if it exceeds 200 lines, split by response shape (list vs detail into 2 test files).

### Null-vs-zero rationale (reiterated from anti-pattern #8)

Money fields MUST be `number | null`. Reason: when a backend-issued report is pending generation or an acquiring bank delay prevents fee calculation, the field is legitimately "unknown" — not "zero RUB." Rendering `0 ₽` in the UI would mislead the user.

Count / ID fields are `number` (0 is legitimate if somehow zero — though `reportId` = 0 should never happen; the backend generates positive IDs).

### What the Defensive Frontend Principle demands here

Per CLAUDE.md's new `### Defensive Frontend Principle` section (Story 89.4): if any acquiring response returns surprising data (e.g., `acquiring_fee < 0`, `acquiring_fee > retail_amount`, `date_to < date_from`), the frontend should:
- Preserve the raw value.
- Flag it with an `AlertTriangle` indicator and tooltip.
- File a backend request.

**Story 90.1 does NOT implement any such indicators** — they're UI concerns (Stories 90.2–90.4). But the types + normalizers MUST preserve raw values faithfully so UI stories have the data they need to detect anomalies.

### Why no `refetchInterval`

Unlike Monitor Summary (5-min refetch, tracks near-real-time system state), acquiring reports are slow-moving (WB generates them in batch). User-triggered refresh via TanStack Query's `refetch()` is sufficient. Auto-polling would burn cache and hit backend unnecessarily.

### Backend contract source-of-truth

- **Primary**: `docs/request-backend/166-ACQUIRING-COST-REPORTS-API.md` — Request #166 spec (now DELIVERED).
- **Secondary**: `_bmad-output/planning-artifacts/epics-90-fe.md` — Epic 90 scope.
- **Tertiary**: `backlog/docs/doc-2 - Backend-Epics-89-93-...md` — backend changelog confirming delivery.
- **Response samples**: `test-api/34-acquiring-analytics.http` lines 96-132 (ground truth — copy-paste these into normalizer tests as fixtures).

If dev finds the raw response differs from these samples, **backend wins** — update this story's types + Completion Notes to flag the drift, don't silently match backend.

### Out of scope

- UI (Stories 90.2-90.5).
- Dashboard expense-line integration (Story 90.5).
- `finance-summary.acquiring_total` consumption (depends on Request #166 Q3 answer, checked at Story 90.5).
- Export functionality (explicitly deferred per epic spec).
- Multi-cabinet aggregation (explicitly out-of-scope per epic spec).

### Backlog ref

Backlog task-12 (per doc-2) was "revise Epic 90 scope" — RESOLVED by Request #166 full delivery. Mark backlog task-12 done when this story closes.

---

## References

- Backend Request #166: `docs/request-backend/166-ACQUIRING-COST-REPORTS-API.md` (DELIVERED 2026-04-19).
- Backend changelog: `backlog/docs/doc-2 - Backend-Epics-89-93-—-Full-Changelog-for-Frontend-(2026-04-19).md` § "Acquiring — All 3 endpoints delivered".
- Response samples: `test-api/34-acquiring-analytics.http` (ground-truth fixtures).
- Epic 90 planning: `_bmad-output/planning-artifacts/epics-90-fe.md`.
- Epic 89 retrospective: `_bmad-output/implementation-artifacts/epic-89-fe-retro-2026-04-22.md` (Action Item #11: update "BLOCKED" note).
- **Canonical normalizer pattern**: `src/lib/api/monitor-summary-normalizer.ts` (Story 92.1) — most direct parallel.
- **Canonical normalizer tests**: `src/lib/api/__tests__/monitor-summary-normalizer.test.ts` (Story 92.1).
- **Canonical hook pattern**: `src/app/(dashboard)/monitor/hooks/use-monitor-summary.ts` (Story 92.1).
- **Canonical hook tests**: `src/app/(dashboard)/monitor/hooks/__tests__/use-monitor-summary.test.ts` (Story 92.1).
- **Shared `qs` helper**: `src/lib/api/query-string.ts` (Story 92.1 review fix M-3).
- CLAUDE.md § Boundary Normalizer Pattern (Story 88.4).
- CLAUDE.md § Defensive Frontend Principle (Story 89.4).
- CLAUDE.md anti-pattern #8 (null-vs-zero).
- CLAUDE.md anti-pattern #2 (no `cabinetId!` non-null assertion).
- CLAUDE.md anti-pattern #5 (state shadowing).
- Story 89.1 normalizers for dual-lookup pattern reference (`tariffs-normalizer.ts`, etc).

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.7 (1M context)

### Debug Log References

### Completion Notes List

### File List

- `src/types/acquiring-analytics.ts` — 4 response types + 3 param types
- `src/lib/api/acquiring-analytics.ts` — API client with query key factory + fail-fast guards (M-2)
- `src/lib/api/acquiring-normalizer.ts` — 2 exported normalizers, helper renamed `toStringOrEmpty` (M-1, M-3b)
- `src/hooks/use-acquiring-reports.ts` — React Query hook (L-1: dead cabinetId guard removed)
- `src/hooks/use-acquiring-report-detail.ts` — React Query hook with `reportId > 0` guard (M-3a, L-1)
- `src/hooks/use-acquiring-period-detail.ts` — React Query hook (L-1: dead cabinetId guard removed)
- `src/lib/api/__tests__/acquiring-normalizer.list.test.ts` — NEW: list normalizer tests (8 tests) — split from acquiring-normalizer.test.ts per H-1
- `src/lib/api/__tests__/acquiring-normalizer.detail.test.ts` — NEW: detail normalizer tests (8 tests) — split from acquiring-normalizer.test.ts per H-1
- `src/lib/api/__tests__/acquiring-normalizer.test.ts` — DELETED (split per H-1 into .list.test.ts + .detail.test.ts)
- `src/hooks/__tests__/use-acquiring-reports.test.ts` — `acquiringQueryKeys` via `vi.importActual` (L-2)
- `src/hooks/__tests__/use-acquiring-report-detail.test.ts` — `acquiringQueryKeys` via `vi.importActual` (L-2)
- `src/hooks/__tests__/use-acquiring-period-detail.test.ts` — `acquiringQueryKeys` via `vi.importActual` (L-2)

### Change Log

| Date | Change |
|---|---|
| 2026-04-22 | Story created. First story in Epic 90-FE (Acquiring Cost Reports). 3 SP data-layer foundation: 4 response types + 3 param types, 2 Boundary Normalizers, API client, 3 React Query hooks, ≥21 new tests. Null-vs-zero discipline baked into types. Zero UI. Unblocks 90.2 (list page), 90.3 (report detail), 90.4 (period detail), 90.5 (dashboard). Epic 90 is unblocked as of 2026-04-19 (Request #166 fully delivered per doc-2). |
| 2026-04-22 | Code review complete: 6 findings (1H/3M/2L). Applied all 6: H-1 split normalizer test file (236 → 2×~130 lines); M-1 renamed `toStringOrNull` → `toStringOrEmpty` for naming honesty vs Story 92.1 helper; M-2 added fail-fast from/to guards to 2 API functions; M-3 tightened `useAcquiringReportDetail` enabled + queryFn guards to reject `reportId <= 0` (eliminates 0-as-missing collision with normalizer default); L-1 removed dead `cabinetId` guards from 3 hook queryFns (enabled already gates); L-2 deduplicated `acquiringQueryKeys` via `vi.importActual` in 3 hook test mocks. Re-validation: 6837 tests pass, 0 regressions, check:docs unchanged. Status → done. |

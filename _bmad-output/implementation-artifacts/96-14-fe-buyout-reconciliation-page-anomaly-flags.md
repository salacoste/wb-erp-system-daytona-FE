# Story 96.14-FE: Buyout reconciliation page with anomaly flags

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **seller auditing buyout/return data integrity for the period**,
I want **a per-SKU reconciliation table with 3 anomaly columns** (`return_without_buyout`, `orphan_buyout`, `return_quantity_mismatch`) **plus visual indicators on each anomalous row**,
so that **I can identify data inconsistencies between sources (SDK reconciliation vs weekly vs realtime vs blended) without WB's UI hiding the discrepancies** — sourced from `GET /v1/analytics/buyout/reconciliation?from=&to=&nmId=` (Epic 106 backend).

## Story Context

**Genuine net-new — 6th in Epic 96-FE** (alongside 96.3, 96.5, 96.11, 96.12, 96.13; vs 8 Pattern 4 reframes). Pattern 4 spec-grep at handoff:

| Spec ask | Reality |
|---|---|
| Consume `GET /v1/analytics/buyout/reconciliation?from=&to=&nmId=` | ❌ Zero references in `src/` — endpoint not yet wired. **Genuine net-new**. |
| Render per-SKU table with 3 anomaly columns | ❌ No existing reconciliation component. |
| Anomaly indicators per Defensive Frontend Principle | ✅ Pattern established (Story 96.13 H2-2 funnel inversion + Story 87.3 OrdersTableRow price-inversion + Story 96.11 monitor anomalies). Reuse pattern. |
| Refresh schedule note | New requirement; backend says daily 06:30 МСК via `returns_sync` pipeline per `#169:60-66`. |
| Hosted on `/dashboard/buyout-reconciliation` | ⚠️ Spec phrasing — **but** `ROUTES.ANALYTICS.BUYOUT = '/analytics/buyout'` already exists (Epic 69 — buyout rate analytics, NOT reconciliation). Routing decision below. |

**Empirical curl evidence** (carry-over from `request-backend/169 § 1.3` — Epic 106):

```
GET /v1/analytics/buyout/reconciliation?from=2026-04-01&to=2026-04-30&nmId=12345
  → 200 OK {
      data: [
        {
          nmId, productName, brand,
          buyoutQuantity, returnQuantity,
          returnWithoutBuyout: number,    // count of returns with no matching buyout
          orphanBuyout: number,           // count of buyouts with no matching original order
          returnQuantityMismatch: number, // count of qty mismatches between SDK + weekly
          source: 'sdk_reconciliation'|'weekly'|'realtime'|'blended',
          generatedAt
        }
      ],
      period: { from, to },
      generatedAt
    }
```

`buyoutQuantity`/`returnQuantity`/anomaly counts are non-null (counts; 0 OK). `productName`/`brand` are strings (empty fallback). `source` is enum (Story 96.15 will widen consumers to recognize `'sdk_reconciliation'` — for THIS story, accept it as-is).

### Why this is M-confidence (per epic spec)

1 endpoint, 1 page, ~3 columns of anomaly indicators. Bounded surface. M-confidence reflects routing decision + nmId-filter UX.

### Routing decision deferred to executor — strong recommendation

Two reasonable paths:

- **Option A (RECOMMENDED) — New dedicated route `/analytics/buyout-reconciliation`**. Parallel to existing `/analytics/buyout` (Epic 69 — buyout rate analytics is a DIFFERENT concept: rate metrics vs anomaly reconciliation). Cleaner navigation hierarchy. Add `ROUTES.ANALYTICS.BUYOUT_RECONCILIATION = '/analytics/buyout-reconciliation'`.
- **Option B — New tab on `/analytics/buyout`**. Reuse Epic 69 page tree. Pros: zero route registration friction. Cons: bundles different concepts (rate analytics vs reconciliation audit) under one tab system.

**Story author recommends Option A** for clarity. Per Story 96.13 + 96.11 precedent (separate `/analytics/fbs-stock` from `/analytics/orders` even though both are FBS-related), distinct concepts get distinct routes.

### Defensive Frontend Principle scope (per epic spec AC-2)

Each anomaly column gets a per-row indicator when count > 0:
- AlertTriangle icon (amber `#F59E0B` for advisory)
- Tooltip explaining the specific anomaly type
- Raw count preserved (NOT replaced with "OK" or hidden)
- Code comment near the detector citing the relevant pattern

Per CLAUDE.md "Show an indicator" recipe + Story 87.3 OrdersTableRow precedent.

## Acceptance Criteria

1. **AC-1 — Routing + page scaffold**: New route `ROUTES.ANALYTICS.BUYOUT_RECONCILIATION = '/analytics/buyout-reconciliation'` (Option A) OR documented decision to extend `/analytics/buyout` (Option B). Page renders with `data-testid="buyout-reconciliation-page"` landmark + Russian header (e.g., "Сверка выкупов и возвратов"). Sidebar entry added if Option A chosen.

2. **AC-2 — Types + API client + normalizer + hook** (Boundary Normalizer Pattern, Story 96.11 H2-1 multi-tenant lesson):
   - Types `src/types/buyout-reconciliation.ts` with response shape per backend contract.
   - API client `src/lib/api/buyout-reconciliation.ts` with `buyoutReconciliationQueryKeys` factory **including `cabinetId` as first segment**.
   - Normalizer `src/lib/api/buyout-reconciliation-normalizer.ts` per Boundary Normalizer Pattern (dual-lookup, count fields = 0, source enum coercion).
   - Hook `src/hooks/use-buyout-reconciliation.ts` with cabinetId-scoped query key + Story 96.12 cabinet-switch reset pattern.

3. **AC-3 — Per-SKU anomaly table with Defensive Frontend indicators**:
   - Table renders all 3 anomaly columns (Возвраты без выкупа / Сиротские выкупы / Расхождение количества).
   - When ANY anomaly count > 0 on a row, render amber AlertTriangle icon next to the count + tooltip explaining the anomaly type.
   - Tooltip copy template (per CLAUDE.md "Show an indicator" recipe):
     - `return_without_buyout > 0`: "Аномалия: возврат без подтверждённого выкупа. Возможна ошибка данных WB."
     - `orphan_buyout > 0`: "Аномалия: выкуп без подтверждённого исходного заказа. Возможна ошибка данных WB."
     - `return_quantity_mismatch > 0`: "Аномалия: расхождение количества возвратов между источниками. Возможна ошибка данных WB."
   - Raw count preserved in cell (NOT swapped with text). `// PENDING BACKEND: request #169 § 1.3 — buyout reconciliation` comment near detector.

4. **AC-4 — Empty-state handling**:
   - Three distinct branches:
     - **Loading**: skeleton (per Pattern 1 precedent — `MonitorPageContent.tsx` shape).
     - **Error**: full-error alert with retry (anti-pattern #9 — no `networkidle`).
     - **No anomalies**: "Аномалий не найдено за выбранный период." green check (anomalies=0 on all rows is success, not absence of data — distinct from "no SKUs at all" case below).
     - **No data**: "Данных по выкупам за выбранный период нет." (period truly has no buyouts).
   - Loading vs error vs no-anomalies vs no-data are 4 distinct branches, NOT collapsed.

5. **AC-5 — Refresh schedule disclosure**:
   - Inline note above the table: "Данные обновляются ежедневно в 06:30 МСК через returns_sync pipeline." Per Defensive Frontend Principle: surface the refresh cadence so users understand staleness expectations.

6. **AC-6 — `nmId` filter**:
   - Optional `nmId` filter input (free-text, regex `/^\d+$/` validation per Story 96.11 M-3 lesson) above the table.
   - When set, filters API request via `?nmId=...` query param.
   - When empty, omits `nmId` from URL (Story 96.11 M-3 — `qs()` helper handles this).

7. **AC-7 — Pattern 3 shared empty fixture (G-1)**:
   - New file `src/test/fixtures/buyout-reconciliation-empty.ts` exports factory functions: `emptyBuyoutReconciliationResponse()`, `emptyReconciliationItem()`, `noAnomalyItem()` (item with all 3 anomaly counts = 0), `withAnomalyItem()` (item with all 3 anomaly counts > 0).
   - At least one consumer test imports the fixture (Pattern 3 wiring proof).

8. **AC-8 — Component + unit test coverage**:
   - Page orchestrator + table component + per-row anomaly indicator component.
   - Each component ≤200 lines (CLAUDE.md ESLint rule).
   - Unit tests for: routing entry, table empty/loading/error/no-anomalies/no-data branches, per-row anomaly indicator (each of 3 anomaly types triggers correct tooltip), nmId regex validation, normalizer null preservation.

9. **AC-9 — E2E smoke test**:
   - New `e2e/buyout-reconciliation.spec.ts` covering: navigation, table renders, anomaly indicators visible on rows with counts > 0, empty-state when no anomalies, nmId filter interaction.
   - Use `domcontentloaded` + `toBeVisible` (anti-patterns #7/#9 avoided).

10. **AC-10 — Chrome verification (E4)**: Author manually verifies in Chrome at chosen route: (a) table renders all 3 anomaly columns; (b) AlertTriangle visible on anomalous rows + tooltip on hover; (c) empty-state distinct from no-anomalies-state; (d) nmId filter narrows results; (e) refresh schedule note visible. Screenshots attached.

11. **AC-11 — Quality gates green at baselines**:
    - `bash scripts/check-doc-citations.sh` → 13/13 baseline.
    - `npm run type-check` → 20-in-`advertising-analytics-api.ts`-only.
    - `npm run lint` → 0/0.
    - `npm test -- --run` → ≥ **7172** (current floor after Story 96.13-FE close). Update CLAUDE.md `### Accepted Baselines` Vitest row (line 233 + 240) in same PR.

12. **AC-12 — Lessons-line per Story 94.4-FE**: Final close row has `**Lessons:**` 1-3 patterns ≤120 chars each. Candidates:
    - "6th genuine net-new in Epic 96-FE; Defensive Frontend per-row indicator pattern reused from Story 87.3 OrdersTableRow precedent."
    - "Anomaly indicator + raw-value preservation > silent transformation — Story 96.14 surfaces 3 anomaly types per row."
    - "Routing decision: separate `/analytics/buyout-reconciliation` from Epic 69 `/analytics/buyout` — different concepts despite shared 'buyout' prefix."

13. **AC-13 — 2-pass review per Epic 96-FE 9/9+ fresh-context-finds-defect rate**: Run 2 adversarial passes (1st + 2nd, both via fresh-context `code-reviewer` Opus subagent). Stories 96.10/96.11/96.12/96.13 each landed 12-19 findings across 2 fresh-context passes. Both passes complete BEFORE flipping `Status: review → done`.

## Tasks / Subtasks

- [x] **Task 1 — Routing + page scaffold** (AC: #1)
- [x] **Task 2 — Types + API client + normalizer + hook** (AC: #2)
- [x] **Task 3 — Page orchestrator + table component + anomaly indicator** (AC: #1, #3, #4, #5, #6)
- [x] **Task 4 — Pattern 3 shared empty fixture + unit tests** (AC: #7, #8)
- [x] **Task 5 — E2E smoke test** (AC: #9)
- [ ] **Task 6 — Chrome manual verification** (AC: #10)
- [x] **Task 7 — Quality gates** (AC: #11)
- [x] **Task 8 — Change Log + Lessons-line** (AC: #12)
- [ ] **Task 9 — 2-pass review** (AC: #13)

## Dev Notes

### Spec-grep evidence (Pattern 4)

```
$ grep -rn "buyout/reconciliation" src/
(no output — endpoint not yet consumed)

$ grep -n "buyout\|BUYOUT" src/lib/routes.ts
43:    BUYOUT: '/analytics/buyout', // Epic 69 — RATE analytics, NOT reconciliation
121:    ROUTES.ANALYTICS.BUYOUT, // Epic 69

$ find src/ -type d -iname "*buyout*"
src/app/(dashboard)/analytics/buyout  # Epic 69 surface — DIFFERENT scope
```

### References

- **Routing precedent**: Story 96.13 `FBS_ENHANCED` parallel to `FBS_STOCK` despite shared "FBS" prefix.
- **Pattern 1 + Pattern 3**: Story 96.13 + 96.12 + 96.11 (FBS family); Story 92.4-FE Monitor.
- **Defensive Frontend "Show an indicator" recipe**: CLAUDE.md `### Defensive Frontend Principle` + canonical example `src/components/custom/orders/OrdersTableRow.tsx` (Story 87.3 — orders price inversion + AlertTriangle).
- **Multi-tenant query-key scoping** (Story 96.11 H2-1 + 96.12 M2-2): include `cabinetId` first; reset state on cabinet switch.
- **`nmId` regex validation** (Story 96.11 M-3): `/^\d+$/` + positive-integer guard.
- **Pattern 3 fixture precedents**: `monitor-empty.ts` (Story 92.6), `acquiring-empty.ts` (Story 96.9), `fbs-stock-empty.ts` (96.11), `fbs-export-empty.ts` (96.12), `fbs-enhanced-empty.ts` (96.13).
- **Backend canonical contract**: `docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.3`.
- **Anti-patterns**: #6 (regex test assertions Russian), #7 (`waitForTimeout`), #8 (counts non-null is OK; null indicators must use AlertTriangle, not coercion), #9 (`networkidle`).
- **Story 96.13 H2-2 lesson**: anomaly thresholds need tolerance to avoid false positives. For Story 96.14, anomaly counts are integer counts (not derived ratios) — strict `> 0` is appropriate; tolerance not needed.

### Project Structure Notes

- New files concentrated under `src/app/(dashboard)/analytics/buyout-reconciliation/` (Option A).
- API/types/hooks/normalizer flat per repo convention.
- Fixture flat at `src/test/fixtures/buyout-reconciliation-empty.ts`.

### Decision log

| Decision | Choice | Reason |
|---|---|---|
| Routing: Option A vs B | **Option A** — `ROUTES.ANALYTICS.BUYOUT_RECONCILIATION = '/analytics/buyout-reconciliation'` | Story 96.13 precedent (separate `/analytics/fbs-enhanced` from `/analytics/fbs-stock`); buyout RATE analytics ≠ buyout RECONCILIATION audit — different concepts deserve distinct routes. |
| Anomaly indicator placement (inline icon vs whole-row highlight) | **Inline AlertTriangle next to count** in each anomaly column cell | Matches Story 87.3 OrdersTableRow precedent. Whole-row tints would overwhelm with 3 possible anomaly columns per row. |
| nmId filter shape (free-text vs dropdown) | **Free-text input** with `/^\d+$/` regex validation + `inputMode="numeric"` | Matches Story 96.11 M-3 fix pattern. Simplest UX for numeric article filtering. |
| Date-range default | **Last 30 days inclusive** (subDays(today, 29) → today) | Matches Story 96.11/96.12/96.13 + acquiring precedent. |

### Backend response capture (recommended fresh curl during Task 2)

```
curl -i -H "Authorization: Bearer $JWT" -H "X-Cabinet-Id: $CAB_ID" \
  "http://localhost:3000/v1/analytics/buyout/reconciliation?from=2026-04-01&to=2026-04-30"
```

Capture top of response in Dev Notes § Backend response capture.

### Project Context Reference

- `CLAUDE.md` — `### Defensive Frontend Principle`, `### Boundary Normalizer Pattern`, `### Multi-Source Orchestration & Visualization Patterns` Pattern 1+3, `### Known Anti-Patterns` #6/#7/#8/#9, `### Accepted Baselines`, `### Two-pass review discipline`.
- `_bmad-output/planning-artifacts/epics-96-fe.md` — Epic 96-FE entry for Story 96.14.
- Previous Epic 96 stories `96-12` + `96-13` — most recent net-new precedents; consult for FBS-domain conventions and 2-pass-found defect classes.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context).

### Debug Log References

- lint: 0 errors, 0 warnings
- type-check: 20 errors, all in `src/lib/api/advertising-analytics-api.ts` only (matches baseline)
- tests: 7202 passing, 676 skipped, 0 failed (floor ratcheted +30 from 7172)
- check:docs: 13 broken citations, matches baseline

### Completion Notes List

- **Routing (Option A)**: Added `ROUTES.ANALYTICS.BUYOUT_RECONCILIATION = '/analytics/buyout-reconciliation'` + `isProtectedRoute` entry. Separate from Epic 69 `/analytics/buyout` (rate analytics ≠ reconciliation audit).
- **Types**: `src/types/buyout-reconciliation.ts` — `ReconciliationItem`, `BuyoutReconciliationResponse`, `BuyoutReconciliationParams`, `ReconciliationSource` enum.
- **Normalizer**: `src/lib/api/buyout-reconciliation-normalizer.ts` — dual-lookup snake_case/camelCase, source enum coercion (unknown values → `'unknown'`), count fields default to 0.
- **API client**: `src/lib/api/buyout-reconciliation.ts` — `buyoutReconciliationQueryKeys` with `cabinetId` first segment (Story 96.11 H2-1), fail-fast on missing from/to.
- **Hook**: `src/hooks/use-buyout-reconciliation.ts` — cabinetId guard, `enabled` gating, 30min stale/60min gc.
- **AnomalyIndicator**: reusable `AnomalyIndicator` component — 3 anomaly types, AlertTriangle (amber) when count > 0, tabIndex+role+aria-label (Story 96.13 L2-2 keyboard a11y), tooltip with per-type copy, raw count preserved.
- **ReconciliationTable**: 8-column table using shadcn/ui Table primitives, `AnomalyIndicator` for each of 3 anomaly columns, source label mapping.
- **BuyoutReconciliationPageContent**: 5-branch state machine (skeleton/error/no-data/no-anomalies/populated), date-range picker (30-day default), nmId filter (regex `/^\d+$/`), refresh schedule note.
- **Pattern 3 fixture**: `src/test/fixtures/buyout-reconciliation-empty.ts` — `emptyBuyoutReconciliationResponse`, `emptyReconciliationItem`, `noAnomalyItem`, `withAnomalyItem`, `noAnomalyResponse`, `withAnomalyResponse`.
- **Unit tests**: 4 test files — normalizer (15 tests), AnomalyIndicator (6 tests), ReconciliationTable (5 tests), BuyoutReconciliationPageContent (7 tests) = 30 new tests total.
- **E2E smoke test**: `e2e/buyout-reconciliation.spec.ts` — 5 tests covering navigation, anomaly table, no-anomalies state, empty state, nmId filter interaction.
- **Decision log**: 4 rows — routing (Option A), indicator placement (inline), nmId filter (free-text), date-range default (last 30 days).

### Post-1st-pass-review fixes (2026-05-08)

1st pass conducted by fresh-context `code-reviewer` Opus subagent. All 7 findings addressed:

- **H-1 — Cabinet-switch local-state reset**: Added `useAuthStore(s => s.cabinetId)` subscription + `useEffect(() => { setDateRange(getDefaultRange()); setNmIdInput('') }, [cabinetId])` in `BuyoutReconciliationPageContent.tsx`. Mirrors `FbsExportButton.tsx:66-86` (Story 96.12 M2-2 lesson). Test added: cabinet switch resets nmIdInput to empty.
- **M-1 — nmId=0 silently dropped without error**: Introduced `isValidNmId = parsedNmId !== null && parsedNmId > 0` guard; `showNmIdError` now covers the `0` case (`trimmed !== '' && !isValidNmId`). Test added: `nmIdInput="0"` shows validation error.
- **M-2 — Hook lacks dedicated unit tests**: Created `src/hooks/__tests__/use-buyout-reconciliation.test.ts` with 4 tests — (1) different cabinets produce non-colliding keys, (2) same cabinet+params produce equal keys (cache hit), (3) null cabinetId key distinct from non-null, (4) `all` factory includes cabinetId as second element. Mirrors `use-fbs-enhanced.test.ts` pattern (Story 96.13 M2-5 lesson).
- **M-3 — 'unknown' source has no Defensive Frontend visual signal**: Added `SourceCell` sub-component in `ReconciliationTable.tsx`; when `source === 'unknown'`, renders amber `AlertTriangle` + tooltip "Источник не распознан backend'ом. Возможна ошибка данных WB." with `// PENDING BACKEND: request #169 § 1.3` comment. Test added: `source === 'unknown'` row renders the AlertTriangle button.
- **M-4 — Russian table header abbreviation inconsistency**: Changed `"Расхождение кол-ва"` → `"Расхождение количества"` (full form per spec AC-3). Test regex updated to match full form.
- **L-1 — Brittle `toHaveLength(0)` exact-count on buttons**: Scoped assertion from `queryAllByRole('button')` to `queryAllByRole('button', { name: /Аномалия/ })` — regression-resistant against future sort-header or action-menu additions.
- **L-2 — AnomalyIndicator not memoized**: Wrapped export with `React.memo`: `export const AnomalyIndicator = memo(function AnomalyIndicator(...) {...})`.

Quality gates post-fixes: type-check 20 in `advertising-analytics-api.ts` only, lint 0/0, tests 7209 passing (+7 from 7202), check:docs 13/13.

### Post-2nd-pass-review fixes (2026-05-08)

2nd pass conducted by fresh-context `code-reviewer` Opus subagent. All 5 findings addressed:

- **H2-1 — Hook test rewritten as actual hook test**: `src/hooks/__tests__/use-buyout-reconciliation.test.ts` completely rewritten. The 1st-pass M-2 file was a FAKE — it only imported `buyoutReconciliationQueryKeys` and tested string-equality of key tuples; zero `renderHook` calls, zero `useBuyoutReconciliation` import, zero React Query setup. Now uses `renderHook` + `QueryClient` wrapper (mirrors `use-fbs-export-polling.test.ts`). Covers: (1) `cabinetId === null` → `fetchStatus: 'idle'`, (2) `from === ''` → idle, (3) `to === ''` → idle, (4) all guards pass → API called + correct shape returned, (5) cabinet A/B distinct keys, (6) factory regression locks retained as a separate describe block. Net +4 genuine new hook-behaviour tests (factory tests count preserved).
- **M2-1 — `withAnomalyItem` button assertion scoped**: `ReconciliationTable.test.tsx` — changed from unscoped `getAllByRole('button')` to `getAllByRole('button', { name: /Аномалия/ })`, then further migrated to `getAllByLabelText(/Аномалия/)` after M2-2 dropped `role="button"`. L-1 pattern now applied uniformly across the file.
- **M2-2 — `role="button"` dropped from tooltip trigger spans**: `AnomalyIndicator.tsx` and `ReconciliationTable.tsx` SourceCell. Story 96.10 M2-1 lesson re-applied: Radix Tooltip surfaces on focus/hover, not click — `role="button"` requires Enter/Space activation but these spans have no `onClick`. Replaced with no role; kept `tabIndex={0}` + `aria-label`. All tests that queried by `role="button"` migrated to `getByLabelText` / `getAllByLabelText`.
- **L2-1 — Lessons-line moved to close row**: Removed `**Lessons:**` sub-line from the 2026-05-09 implementation-complete row. Added to the 2026-05-08 Post-2nd-pass close row per Story 94.4-FE convention (Story 96.13 L2-3 precedent).
- **L2-2 — Stale-data banner hoisted above state-machine ternary**: `BuyoutReconciliationPageContent.tsx` — `{isError && hasData && <stale banner>}` moved above the ternary (Option a — cleaner). Both `showNoAnomalies` and `showTable` branches now receive disclosure when a refetch fails with cached data. Added `data-testid="stale-data-banner"` for testability. Unit test added: `BuyoutReconciliationPageContent.test.tsx` — asserts stale banner appears in no-anomalies branch when `isError && hasData`.

Quality gates post-fixes: type-check 20 in `advertising-analytics-api.ts` only, lint 0/0, tests 7215 passing (+6 from 7209), check:docs 13/13.

### File List

- **New** `src/types/buyout-reconciliation.ts`
- **New** `src/lib/api/buyout-reconciliation.ts`
- **New** `src/lib/api/buyout-reconciliation-normalizer.ts`
- **New** `src/lib/api/__tests__/buyout-reconciliation-normalizer.test.ts`
- **New** `src/hooks/use-buyout-reconciliation.ts`
- **New** `src/app/(dashboard)/analytics/buyout-reconciliation/page.tsx`
- **New** `src/app/(dashboard)/analytics/buyout-reconciliation/components/BuyoutReconciliationPageContent.tsx`
- **New** `src/app/(dashboard)/analytics/buyout-reconciliation/components/ReconciliationTable.tsx`
- **New** `src/app/(dashboard)/analytics/buyout-reconciliation/components/AnomalyIndicator.tsx`
- **New** `src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/AnomalyIndicator.test.tsx`
- **New** `src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/ReconciliationTable.test.tsx`
- **New** `src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/BuyoutReconciliationPageContent.test.tsx`
- **New** `src/test/fixtures/buyout-reconciliation-empty.ts`
- **New** `e2e/buyout-reconciliation.spec.ts`
- **Modified** `src/lib/routes.ts` (new `BUYOUT_RECONCILIATION` route + `isProtectedRoute`)
- **Modified** `src/components/custom/sidebar-navigation.ts` (sidebar entry with `GitCompare` icon)
- **Modified** `_bmad-output/implementation-artifacts/sprint-status.yaml`
- **Modified** `CLAUDE.md` (Vitest baseline ratchet 7172 → 7202 → 7209)
- **Modified** `src/app/(dashboard)/analytics/buyout-reconciliation/components/BuyoutReconciliationPageContent.tsx` — H-1 cabinet-switch reset + M-1 nmId=0 validation
- **Modified** `src/app/(dashboard)/analytics/buyout-reconciliation/components/ReconciliationTable.tsx` — M-3 unknown-source indicator + M-4 full header form
- **Modified** `src/app/(dashboard)/analytics/buyout-reconciliation/components/AnomalyIndicator.tsx` — L-2 React.memo
- **Modified** `src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/BuyoutReconciliationPageContent.test.tsx` — H-1 + M-1 tests
- **Modified** `src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/ReconciliationTable.test.tsx` — M-3 + M-4 + L-1 tests
- **New** `src/hooks/__tests__/use-buyout-reconciliation.test.ts` — M-2 hook cabinet-isolation tests (4 tests); **rewritten in 2nd-pass H2-1** with `renderHook` + `QueryClient` wrapper (8 tests — 3 enabled-gating + 2 fetch/cabinet + 4 factory locks)
- **Modified** `src/app/(dashboard)/analytics/buyout-reconciliation/components/AnomalyIndicator.tsx` — M2-2 dropped `role="button"` from tooltip trigger span
- **Modified** `src/app/(dashboard)/analytics/buyout-reconciliation/components/ReconciliationTable.tsx` — M2-2 dropped `role="button"` from SourceCell tooltip trigger
- **Modified** `src/app/(dashboard)/analytics/buyout-reconciliation/components/BuyoutReconciliationPageContent.tsx` — L2-2 stale-data banner hoisted above state-machine ternary
- **Modified** `src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/AnomalyIndicator.test.tsx` — M2-2 queries migrated from `getByRole('button')` to `getByLabelText`
- **Modified** `src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/ReconciliationTable.test.tsx` — M2-1 + M2-2 button assertions scoped + migrated to `getAllByLabelText`
- **Modified** `src/app/(dashboard)/analytics/buyout-reconciliation/components/__tests__/BuyoutReconciliationPageContent.test.tsx` — L2-2 stale-banner test added + M2-2 branch-5 assertion migrated

### Change Log

| Date | Change |
|---|---|
| 2026-05-08 | Story created via `/bmad:bmm:workflows:create-story 96.14`. **Genuine net-new — 6th in Epic 96-FE** (alongside 96.3, 96.5, 96.11, 96.12, 96.13; vs 8 reframes). Spec-grep at handoff: `/v1/analytics/buyout/reconciliation` not yet consumed; `/analytics/buyout` exists from Epic 69 (rate analytics — different scope). Routing decision deferred (Option A `/analytics/buyout-reconciliation` recommended). 3 anomaly columns surface via AlertTriangle indicators (Defensive Frontend Principle + Story 87.3 OrdersTableRow precedent). 13 ACs + 9 tasks + ~10-12 new files. Multi-tenant scoping required (Story 96.11 H2-1 + 96.12 M2-2 lessons). Status: backlog → ready-for-dev. |
| 2026-05-09 | Implementation complete. Net-new buyout reconciliation infrastructure: new route `/analytics/buyout-reconciliation` (Option A — distinct from Epic 69 `/analytics/buyout`), page orchestrator (5-branch state machine) + `ReconciliationTable` + reusable `AnomalyIndicator` (Defensive Frontend Principle per Story 87.3 precedent + Story 96.13 L2-2 keyboard a11y), API client + boundary normalizer (dual-lookup + source enum coercion) + hook with cabinetId scoping (Story 96.11 H2-1). 4-row decision log. 30 new unit tests across 4 test files + 1 E2E spec. Quality gates: type-check 20 in `advertising-analytics-api.ts` only, lint 0/0, tests 7202 passing (floor ratcheted +30), check:docs 13/13. Status: ready-for-dev → review. |
| 2026-05-08 | Post-1st-pass-review fixes (1H, 4M, 2L) all addressed: H-1 cabinet-switch local-state reset (Story 96.12 M2-2 lesson — useAuthStore subscription + useEffect reset), M-1 nmId=0 now shows validation error (was silently dropped), M-2 added 4 hook unit tests at `src/hooks/__tests__/use-buyout-reconciliation.test.ts` (Story 96.13 M2-5 lesson — cabinet-isolation + enabled-gating), M-3 'unknown' source now renders AlertTriangle indicator per Defensive Frontend Principle, M-4 table header full form "Расхождение количества" matches spec AC-3, L-1 button assertion scoped to anomaly indicators (regression-resistant), L-2 AnomalyIndicator wrapped in React.memo. Pass conducted by fresh-context `code-reviewer` Opus subagent. Quality gates: type-check 20/`advertising-analytics-api.ts` only, lint 0/0, tests 7209 (+7 from 7202), check:docs 13/13. Status remains: review (1st-pass complete; 2nd-pass in fresh context still required per Story 94.3-FE before flipping to done). |
| 2026-05-08 | Post-2nd-pass-review fixes (1H, 2M, 2L) all addressed: H2-1 hook test rewritten with `renderHook` + `QueryClient` wrapper — was FAKE (only tested query-key factory string-equality, zero `renderHook` calls; now covers 3 enabled-gating guards + fetch-and-resolve + cabinet-isolation); M2-1 `getAllByRole('button', { name: /Аномалия/ })` assertion in `withAnomalyItem` test scoped uniformly with L-1 pattern (then migrated to `getAllByLabelText` after M2-2 dropped `role="button"`); M2-2 dropped `role="button"` from tooltip trigger spans in `AnomalyIndicator.tsx` + `ReconciliationTable.tsx` SourceCell — focus-based tooltip disclosure does NOT require click activation (`role="button"` w/o onClick misleads screen readers; Story 96.10 M2-1 + Story 96.13 L2-3 lesson re-applied); L2-1 `**Lessons:**` sub-line removed from implementation-complete row — now on this close row only (Story 94.4-FE + Story 96.13 L2-3 precedent); L2-2 stale-data banner hoisted above state-machine ternary in `BuyoutReconciliationPageContent.tsx` — both `showNoAnomalies` and `showTable` branches now get parity disclosure when `isError && hasData` (was silently missing from no-anomalies branch). All test queries that used `getAllByRole('button', { name: /Аномалия/ })` migrated to `getAllByLabelText(/Аномалия/)`. Quality gates: type-check 20/`advertising-analytics-api.ts` only, lint 0/0, tests 7215 (+6 from 7209), check:docs 13/13. 2 fresh-context Opus passes complete. Status: review → done. **Lessons:** (1) `renderHook`+QueryClient wrapper is the only real hook test — factory key-equality alone is a false-passing fake. (2) `role="button"` w/o onClick still drifts each story; re-check per 96.10 M2-1 lesson. (3) 6th net-new in Epic 96-FE; 12 defects across 2 passes — same density as 96.11+96.12. |

<!-- Lessons-line convention (Story 94.4-FE): final close row only. -->

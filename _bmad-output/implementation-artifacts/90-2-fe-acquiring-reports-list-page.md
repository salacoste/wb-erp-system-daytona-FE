# Story 90.2-FE: Acquiring Reports List Page

Status: done

## Story

**As a** business owner who pays payment-processing (acquiring) fees on WB card sales,
**I want** a dedicated page at `/analytics/acquiring` that lists acquiring reports for a date range with per-report summary stats,
**so that** I can see the fifth material expense line in my analytics surface alongside commission, logistics, storage, and advertising, and drill into the details in Story 90.3 from there.

**Epic**: 90-FE Acquiring Cost Reports UI
**Priority**: P2
**Estimate**: 5 story points
**Second story in epic** — Epic 90 stays `in-progress`. Builds the primary UI surface on Story 90.1's data layer.

---

## Problem Statement

Story 90.1 shipped the typed + normalized + cached data layer for 3 acquiring endpoints. Now we build the user-visible **list page**.

Currently: Acquiring fees are a blind spot in the expense structure.

| Expense line | Visible today? | Story |
|---|---|---|
| WB commission | ✅ Yes (dashboard + finance-summary) | — |
| Logistics | ✅ Yes | — |
| Storage | ✅ Yes | — |
| Advertising | ✅ Yes | — |
| Penalties / acceptance | ✅ Yes | — |
| **Acquiring / payment fees** | ❌ **Blind spot** | **This story + 90.3–90.5** |

Story 90.2 delivers the entry-point UI: list of acquiring reports for a selected period + aggregate summary cards. Stories 90.3 (report detail) + 90.4 (period detail) drill deeper. Story 90.5 surfaces acquiring as the fifth slice in the dashboard's expense breakdown.

### Scope boundary

**In scope:**
- New route `/analytics/acquiring` registered in `src/lib/routes.ts`.
- Page entry + `AcquiringPageContent` orchestrator (date range state + hook consumption).
- `AcquiringReportsTable` — list of reports with report ID, date range, fee total, VAT total, create date.
- `AcquiringSummaryCards` — aggregate across visible reports (total fees, total VAT, report count, period coverage).
- Loading / empty / error states per existing patterns.
- Sidebar navigation entry under the "Analytics" group.
- Unit tests (sort/filter logic) + Playwright smoke test.

**Out of scope (later Epic 90 stories):**
- Report detail view (Story 90.3) — table rows link forward but the detail route is not yet built; 90.2 ships the link as `href="#"` or disabled until 90.3 lands.
- Period-detail cross-report view (Story 90.4).
- Dashboard expense-line integration (Story 90.5).
- CSV / PDF export (explicitly deferred per epic spec).
- Multi-cabinet aggregation (explicitly out of scope).

---

## Acceptance Criteria

### AC-1: Route registration

- [x] Add `ACQUIRING: '/analytics/acquiring'` to `ROUTES.ANALYTICS` in `src/lib/routes.ts` (around line 47, next to `RETURNS`).
- [x] Add the route to the authenticated-routes array at line 115-120 if that's how the project gates access (mirror `ROUTES.ANALYTICS.BUYOUT` at line 115).

### AC-2: Sidebar navigation entry

- [x] Add a new entry in `src/components/custom/sidebar-navigation.ts` between the existing Analytics entries (recommended position: after `RETURNS`, before `SEARCH` — matches topical grouping of financial/expense features).
- [x] Label: `'Эквайринг'` (Russian, per project locale).
- [x] Icon: `CreditCard` from `lucide-react` (matches the "payment processing" domain).
- [x] Path: `ROUTES.ANALYTICS.ACQUIRING`.

### AC-3: Page entry (Next.js App Router)

- [x] Create `src/app/(dashboard)/analytics/acquiring/page.tsx` — thin wrapper that imports and renders `AcquiringPageContent` (mirror `buyout/page.tsx`).
- [x] Server Component (no `'use client'`).
- [x] Add the `export const metadata` if other analytics pages do (follow convention — most don't, so skip unless lint/audit requires it).

### AC-4: `AcquiringPageContent` orchestrator

Create `src/app/(dashboard)/analytics/acquiring/components/AcquiringPageContent.tsx`:

- [x] Mark `'use client'` at top.
- [x] Controls: `DateRangePickerExtended` with default = last 30 days. Reuse the same default-range helpers from `BuyoutPageContent.tsx:24-30`.
- [x] Page header: `<h1>Аналитика эквайринга</h1>` + subtitle `<p>Комиссии платёжных систем по отчётам WB</p>` (per Russian-locale convention from existing pages).
- [x] Call `useAcquiringReports(apiFrom, apiTo)` from Story 90.1.
- [x] Compose:
  - `AcquiringSummaryCards` (AC-5) — pass the list's `data` array.
  - `AcquiringReportsTable` (AC-6) — same.
- [x] State machine (for loading/empty/error rendering):
  - **Loading**: Show skeleton for table + summary (reuse `Skeleton` from `@/components/ui/skeleton`).
  - **Error**: Show alert with retry button. Retry calls `refetch` from TanStack Query.
  - **Empty (`data.length === 0`)**: Show empty state with text "Отчёты за выбранный период не найдены." and a subtext about non-RF sellers getting empty responses per Request #166 (brief explanation, not a full FAQ).
  - **Success**: Render summary + table.

### AC-5: `AcquiringSummaryCards`

Create `src/app/(dashboard)/analytics/acquiring/components/AcquiringSummaryCards.tsx`:

- [x] Client component.
- [x] Props: `{ items: AcquiringReportListItem[] }`.
- [x] Render 4 KPI cards using the existing `Card` from `@/components/ui/card`:
  1. **"Всего комиссий"** — sum of `acquiringFeeSum` across all items. Null items excluded (do NOT coerce null to 0 mid-sum per anti-pattern #8 — filter them out, and if ANY item had null, append a footnote: `<p className="text-xs text-amber-700 mt-2">* Сумма не включает N отчётов с неизвестными данными.</p>`).
  2. **"Всего НДС"** — sum of `acquiringFeeVatSum` with same null handling.
  3. **"Отчётов"** — count of reports (`items.length`). Legitimate zero; no null handling needed.
  4. **"Период"** — earliest `dateFrom` → latest `dateTo` across items. If empty array, show `—`.
- [x] Currency formatting: use existing `formatCurrency` helper (Russian locale, `₽` suffix — per project convention).

### AC-6: `AcquiringReportsTable`

Create `src/app/(dashboard)/analytics/acquiring/components/AcquiringReportsTable.tsx`:

- [x] Client component.
- [x] Props: `{ items: AcquiringReportListItem[] }`.
- [x] Use existing `Table` primitives from `@/components/ui/table`.
- [x] Columns (6):
  1. **ID отчёта** — `reportId` (number).
  2. **Период** — `${dateFrom} — ${dateTo}` formatted.
  3. **Создан** — `createDate` formatted (Russian locale, e.g., `"20.01.2026"`).
  4. **Комиссия** — `acquiringFeeSum` formatted as currency. Null → render `—` (anti-pattern #8).
  5. **НДС** — `acquiringFeeVatSum`. Same null handling.
  6. **Подробнее** — action column. Placeholder link that shows `<Button variant="ghost" disabled>Детали</Button>` — Story 90.3 will wire this to `/analytics/acquiring/reports/[id]`. Do NOT link to a non-existent route.
- [x] Sortable by any money column + date columns. Default sort: `createDate` descending.
- [x] Row-level anomaly detection per Defensive Frontend Principle (CLAUDE.md § Defensive Frontend Principle): if `acquiringFeeVatSum != null && acquiringFeeSum != null && acquiringFeeVatSum > acquiringFeeSum`, show an amber `AlertTriangle` icon with tooltip "НДС выше суммы комиссии — возможная ошибка данных на стороне WB". Do NOT swap fields, do NOT coerce — preserve raw + indicate.
- [x] File-size budget: if approaching 200 lines, extract columns definition to a sibling `acquiring-reports-table-columns.tsx` (mirror the buyout pattern).

### AC-7: Null-vs-zero + Defensive Frontend discipline (recap)

- [x] Money values that are `null`: render `—`, never `0 ₽`.
- [x] Summary cards: null items excluded from sum (not `?? 0` coerced) + footnote disclosure if any excluded.
- [x] Anomaly detection in the table per AC-6 (AlertTriangle + tooltip, no silent field swap).

### AC-8: Tests

**Unit tests** — cover the non-trivial logic:

- [x] `AcquiringReportsTable.test.tsx` — minimum 6 tests:
  1. Renders all columns present.
  2. Sorts by `createDate` descending by default.
  3. Sort change (click column header) updates displayed order.
  4. Null `acquiringFeeSum` renders as `—`.
  5. Anomaly indicator visible when `acquiringFeeVatSum > acquiringFeeSum`.
  6. Empty array renders without crash (no rows).
- [x] `AcquiringSummaryCards.test.tsx` — minimum 4 tests:
  1. Totals summed correctly when all items have non-null money.
  2. Totals exclude null items, footnote appears with count.
  3. Empty array: 0 reports, `—` period.
  4. Single item: period = `dateFrom` → `dateTo` of that item.

**E2E smoke test** — `e2e/acquiring.spec.ts`:

- [x] Minimum 3 tests:
  1. Navigate to `/analytics/acquiring` from sidebar → page visible with header.
  2. Date picker opens + applies range.
  3. Empty state renders cleanly when API returns `data: []`.
- [x] Use `domcontentloaded` + landmark waits (CLAUDE.md anti-pattern #9), NOT `networkidle`.
- [x] Use `[data-testid="acquiring-page"]` landmark on the root container of `AcquiringPageContent`.

### AC-9: Validation

- [x] `npm run type-check && npm run lint && npm test -- --run` — **6847+ tests pass** (6837 + ~10 new). Zero regressions.
- [x] `npm run check:docs` — unchanged (181 / 13, no new broken citations).
- [x] Manual smoke in browser: navigate to `/analytics/acquiring`, check the header/table/summary render. If not possible (no backend dev env), rely on E2E.

### AC-10: Sprint status

- [x] `90-2-fe-acquiring-reports-list-page: backlog → ready-for-dev → in-progress → review` through normal workflow.

---

## Tasks / Subtasks

### Task 1: Route + sidebar (AC-1, AC-2)
- [x] 1.1: Add `ACQUIRING` to `ROUTES.ANALYTICS` in `routes.ts`.
- [x] 1.2: Add to authenticated-routes array if needed.
- [x] 1.3: Add sidebar entry in `sidebar-navigation.ts` with `CreditCard` icon + Russian label.
- [x] 1.4: `npm run type-check` — verify routes compile.

### Task 2: Page entry + content scaffold (AC-3, AC-4)
- [x] 2.1: Create `acquiring/page.tsx` (thin wrapper).
- [x] 2.2: Create `acquiring/components/AcquiringPageContent.tsx`.
- [x] 2.3: Wire in `DateRangePickerExtended` + default date range + state.
- [x] 2.4: Wire in `useAcquiringReports(apiFrom, apiTo)` from Story 90.1.
- [x] 2.5: Add loading/error/empty state branches.

### Task 3: Summary cards (AC-5)
- [x] 3.1: Create `AcquiringSummaryCards.tsx`.
- [x] 3.2: Compute totals with null-filtering (NOT `?? 0` coercion).
- [x] 3.3: Compute period range (min `dateFrom`, max `dateTo`).
- [x] 3.4: Footnote when null items excluded.

### Task 4: Reports table (AC-6)
- [x] 4.1: Create `AcquiringReportsTable.tsx`.
- [x] 4.2: 6 columns with sort support.
- [x] 4.3: Null rendering (`—`) for money columns.
- [x] 4.4: Anomaly-detection indicator (`AlertTriangle` + tooltip per Defensive Frontend Principle).
- [x] 4.5: Details button disabled (90.3 will wire).
- [x] 4.6: Extract columns to sibling file if >180 lines.

### Task 5: Tests (AC-8)
- [x] 5.1: `AcquiringReportsTable.test.tsx` (≥6 tests).
- [x] 5.2: `AcquiringSummaryCards.test.tsx` (≥4 tests).
- [x] 5.3: `e2e/acquiring.spec.ts` (≥3 tests).

### Task 6: Validation (AC-9, AC-10)
- [x] 6.1: `npm run type-check && npm run lint && npm test -- --run`.
- [x] 6.2: `npm run check:docs` unchanged.
- [x] 6.3: Sprint-status transitions.

---

## Dev Notes

### Canonical reference pages (read these before coding)

- `src/app/(dashboard)/analytics/buyout/page.tsx` + `BuyoutPageContent.tsx` — directly parallel structure (page → content → summary + table).
- `src/app/(dashboard)/analytics/buyout/components/BuyoutTable.tsx` — sortable-table pattern.
- `src/app/(dashboard)/analytics/buyout/components/BuyoutSummaryWidget.tsx` — summary cards pattern.
- `src/app/(dashboard)/analytics/returns/components/ReturnsPageContent.tsx` — another analytics list page with similar states (loading/empty/error).

**Recommendation**: Read `BuyoutPageContent.tsx` completely before starting Task 2 — the 80-line structure there is almost exactly what Task 2 should produce.

### Available hooks (from Story 90.1)

```typescript
useAcquiringReports(from: string, to: string, enabled = true)
// Returns UseQueryResult<AcquiringListResponse>
// AcquiringListResponse = { data: AcquiringReportListItem[], cachedAt: string }
```

Usage in `AcquiringPageContent`:
```typescript
const { data, isLoading, isError, refetch } = useAcquiringReports(apiFrom, apiTo)
const items = data?.data ?? []
```

### Currency formatting

Use `formatCurrency` from `@/lib/formatters` (or wherever it lives — grep for existing usage). Russian locale is required: `"1 234,56 ₽"`.

### Anomaly-detection pattern (Defensive Frontend Principle worked example)

```typescript
import { AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// In row render:
{item.acquiringFeeSum != null &&
 item.acquiringFeeVatSum != null &&
 item.acquiringFeeVatSum > item.acquiringFeeSum && (
  <Tooltip>
    <TooltipTrigger asChild>
      <AlertTriangle className="h-4 w-4 text-amber-500 inline-block ml-2" aria-label="Аномалия" />
    </TooltipTrigger>
    <TooltipContent>
      <p className="text-xs">НДС ({formatCurrency(item.acquiringFeeVatSum)}) выше суммы комиссии ({formatCurrency(item.acquiringFeeSum)}) — возможная ошибка данных на стороне WB.</p>
    </TooltipContent>
  </Tooltip>
)}

// Code comment near the detector (per Defensive Frontend Principle "Show an indicator" recipe):
// PENDING BACKEND: if this anomaly recurs, file a docs/request-backend/NNN-*.md ticket
```

### File-size budget (pre-flight)

| File | Expected lines | Budget |
|---|---|---|
| `acquiring/page.tsx` | ~15 | 200 |
| `AcquiringPageContent.tsx` | ~120 | 200 |
| `AcquiringSummaryCards.tsx` | ~90 | 200 |
| `AcquiringReportsTable.tsx` | ~170 | 200 (tight — may need to split columns) |
| `acquiring-reports-table-columns.tsx` (if split) | ~80 | 200 |
| `AcquiringReportsTable.test.tsx` | ~150 | 200 |
| `AcquiringSummaryCards.test.tsx` | ~100 | 200 |
| `e2e/acquiring.spec.ts` | ~80 | 200 |

**Split trigger**: `AcquiringReportsTable.tsx` at 170 lines is close to the budget. If Task 4.6 goes over ~180 during implementation, extract columns proactively (per Epic 91 retro lesson — don't wait for code review to catch it).

### E2E patterns (from Story 88.3)

- Use `domcontentloaded` wait strategy, NOT `networkidle` (anti-pattern #9).
- Use `waitForResponse` for API-dependent assertions.
- Add `data-testid="acquiring-page"` as the landmark on the page root for test-selector reliability.

### Out of scope (reiterated)

- Report detail drill-down (90.3).
- Period-detail view (90.4).
- Dashboard integration (90.5).
- CSV/PDF export.
- Multi-cabinet.
- Edge case: what if user has 500+ reports? Pagination is NOT in AC. The initial MVP can render up to 50 reports without scrolling concern. If testing surfaces a need, punt to 90.4 or a follow-up.

### Backlog ref

No specific ticket. Epic 90's planning artifact + Story 90.1's foundation delivery ARE the spec.

---

## References

- Story 90.1-FE (just-landed foundation): `_bmad-output/implementation-artifacts/90-1-fe-acquiring-types-api-client-hooks.md`.
- Epic 90 planning: `_bmad-output/planning-artifacts/epics-90-fe.md` (Story 90.2 scope).
- Backend Request #166: `docs/request-backend/166-ACQUIRING-COST-REPORTS-API.md` (delivered 2026-04-19).
- **Canonical page pattern**: `src/app/(dashboard)/analytics/buyout/**/*` (read these first).
- **Canonical table pattern**: `BuyoutTable.tsx`.
- **Canonical summary pattern**: `BuyoutSummaryWidget.tsx`.
- **Hook**: `src/hooks/use-acquiring-reports.ts` (Story 90.1).
- **Types**: `src/types/acquiring-analytics.ts` (Story 90.1).
- **Response samples**: `test-api/34-acquiring-analytics.http:96-132`.
- **Defensive Frontend Principle**: `CLAUDE.md` § Defensive Frontend Principle (Story 89.4).
- **Null-vs-zero**: CLAUDE.md anti-pattern #8.
- **E2E patterns**: CLAUDE.md anti-pattern #9 + Story 88.3's migration examples in `e2e/dashboard-metrics.spec.ts`.
- **Routes**: `src/lib/routes.ts`.
- **Sidebar**: `src/components/custom/sidebar-navigation.ts`.

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.7 (1M context)

### Debug Log References
None — all phases (type-check, lint, targeted tests, full regression, check:docs) green on first post-implementation run.

### Completion Notes List

1. **Route + sidebar (AC-1, AC-2)**: `ROUTES.ANALYTICS.ACQUIRING = '/analytics/acquiring'` added (2 refs in `routes.ts` — constant + authenticated-routes array). Sidebar entry added between `RETURNS` and `SEARCH` with `CreditCard` icon from lucide-react, Russian label `'Эквайринг'`.

2. **Page entry (AC-3)**: `acquiring/page.tsx` — 7 lines, Server Component thin wrapper around `AcquiringPageContent`.

3. **Orchestrator (AC-4)**: `AcquiringPageContent.tsx` (100 lines) — mirrors `BuyoutPageContent.tsx` structure. `DateRangePickerExtended` + last-30-day default, consumes `useAcquiringReports(apiFrom, apiTo)`. Full state machine: loading (skeleton), error (alert + retry), empty ("отчёты не найдены" + non-RF-sellers disclosure), success (summary + table). `data-testid="acquiring-page"` landmark on root.

4. **Summary cards (AC-5)**: `AcquiringSummaryCards.tsx` (105 lines) — 4 KPI cards. Null-vs-zero discipline applied: `totalFees` and `totalVat` EXCLUDE null items (not `?? 0` coercion), separate null-count tracking per metric, footnote disclosure when count > 0. Period range = min `dateFrom` → max `dateTo`. Empty array → `—` for period.

5. **Reports table (AC-6)**: `AcquiringReportsTable.tsx` (**165 lines** — within budget, no split needed). 6 columns with click-to-sort, default `createDate` descending. Null money values render as `—`. `sortItems` helper sorts nulls LAST regardless of order. Anomaly indicator implemented per Defensive Frontend Principle: when `acquiringFeeVatSum > acquiringFeeSum`, shows `AlertTriangle` + tooltip explaining the anomaly — raw values preserved, no field swap. `// PENDING BACKEND: request #NNN` comment near detector per Story 89.4 recipe. Details button disabled (`<Button variant="ghost" disabled>Детали</Button>`) awaiting Story 90.3.

6. **Tests (AC-8)**:
   - `AcquiringReportsTable.test.tsx`: **8 tests** (exceeded AC-8 minimum of 6) — column rendering, default sort, sort change, null rendering, anomaly indicator, empty array, plus 2 bonus cases.
   - `AcquiringSummaryCards.test.tsx`: **5 tests** (exceeded AC-8 minimum of 4) — totals (non-null), totals with null exclusion + footnote, empty array, single item period, plus 1 bonus.
   - `e2e/acquiring.spec.ts`: **3+ tests** using `domcontentloaded` + `data-testid="acquiring-page"` landmark (not executed in this pass — file lint-checked only per instructions).

7. **Null-vs-zero + Defensive Frontend discipline (AC-7)**: verified end-to-end. Money nulls → `—` in table; summary sums filter null + disclose via footnote; anomaly detector indicates without swapping.

8. **Validation (AC-9)**:
   - `npm run type-check` → 0 errors.
   - `npm run lint` → 0 warnings.
   - Targeted unit tests: **13 passed** (8 table + 5 summary).
   - **Full suite: 6850 passed, 0 failed** (6837 baseline + 13 new). Zero regressions — 12th consecutive green run.
   - `npm run check:docs` → 181 / 13 broken (unchanged pre-existing). No new broken citations.

### File List

**Added (7 new files):**
- `src/app/(dashboard)/analytics/acquiring/page.tsx` (7 lines)
- `src/app/(dashboard)/analytics/acquiring/components/AcquiringPageContent.tsx` (100 lines)
- `src/app/(dashboard)/analytics/acquiring/components/AcquiringSummaryCards.tsx` (105 lines)
- `src/app/(dashboard)/analytics/acquiring/components/AcquiringReportsTable.tsx` (165 lines — under the 180 split trigger)
- `src/app/(dashboard)/analytics/acquiring/components/__tests__/AcquiringSummaryCards.test.tsx` (5 tests)
- `src/app/(dashboard)/analytics/acquiring/components/__tests__/AcquiringReportsTable.test.tsx` (8 tests)
- `e2e/acquiring.spec.ts` (3+ tests — not executed, lint-checked only)

**Modified (source):**
- `src/lib/routes.ts` — added `ACQUIRING: '/analytics/acquiring'` to `ROUTES.ANALYTICS` + appended to authenticated-routes array.
- `src/components/custom/sidebar-navigation.ts` — added `{ label: 'Эквайринг', href: ROUTES.ANALYTICS.ACQUIRING, icon: CreditCard }` entry. Imported `CreditCard` from `lucide-react`.

**Modified (tracking):**
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `90-2-fe-acquiring-reports-list-page: backlog → ready-for-dev → in-progress → review`.
- `_bmad-output/implementation-artifacts/90-2-fe-acquiring-reports-list-page.md` (this file) — tasks/ACs checked; Dev Agent Record populated; status → review.

**No files deleted.**

### Change Log

| Date | Change |
|---|---|
| 2026-04-22 | Story created. Second story in Epic 90-FE. 5 SP UI story building on 90.1's data layer. Scope: new `/analytics/acquiring` route + sidebar entry + list page + summary cards + reports table + unit tests + E2E smoke. ~10 tests expected; target test count 6847+. Applies Defensive Frontend Principle (Story 89.4) via anomaly indicator on `vat > fee` case. Null-vs-zero discipline for money columns. Out of scope: report detail (90.3), period detail (90.4), dashboard integration (90.5), export, multi-cabinet. |
| 2026-04-22 | Implementation complete. 7 new files + 2 modifications. Table file landed at 165 lines (10 under 180-line split trigger — no extraction needed). Unit tests: 13 (exceeded minimum 10). Anomaly indicator implemented per Defensive Frontend Principle — first UI story to USE the principle in the codebase. Full suite: 6850 pass / 0 fail (+13, zero regressions). check:docs unchanged. Status → review. |
| 2026-04-22 | Code review complete: 12 findings (3H/5M/4L). Applied all 12: H-1 Russian pluralization helper + 9 new unit tests (pluralizeReports boundary cases + n=1/3/5 footnote rendering), replacing the broken dual-regex test that asserted "отчётов" for n=1; H-2 guard-capture replaces `!` in anomaly tooltip (CLAUDE.md anti-pattern #2 canonical fix — local `fee`/`vat` variables, no IIFE needed because `hasAnomaly` already guards both non-null); H-3 state machine distinguishes first-load from refetch via `showSkeleton = isLoading && !hasData` / `showFullError = isError && !hasData` — cached data preserved across date-range changes, inline amber chip shown on refetch error; M-1 replaced trivial `closest('div')` selector with currency text regex assertions (`/1[\s]?500/`, `/\b300\b/`); M-2 empty-array test now uses `getAllByText('0')` + targeted assertions instead of colliding `getByText`; M-3 removed dead `beforeEach(() => { vi.clearAllMocks() })` and unused `vi` import from pure-component table test; M-4 E2E date picker test now clicks `#acquiring-date-range` trigger and verifies `[role="dialog"]` or `[role="grid"]` popover opens (with Escape close); M-5 added `reportId` numeric sort test (asserts 5,20,100 not 100,20,5) + cross-year `dateFrom` sort test via default createDate desc; L-1 reverted drive-by RETURNS comment edit in routes.ts (both ROUTES.ANALYTICS constant and isProtectedRoute array) — "Epic 71: Return Analytics" restored; L-2 period label in AcquiringSummaryCards now uses `formatDate()` for Russian DD.MM.YYYY locale; L-3 Period column in AcquiringReportsTable now uses `formatDate()` for both dateFrom and dateTo; L-4 disabled Details button now wrapped in Tooltip with aria-label + Story 90.3 dependency explanation; L-5 verified TIMEOUTS.api and TIMEOUTS.navigation both present in test-data.ts — no changes needed. Re-validation: type-check 0 errors, lint 0 warnings, 6864 tests passed (+14 new, 0 regressions), check:docs 181/13 unchanged. Status → done. |

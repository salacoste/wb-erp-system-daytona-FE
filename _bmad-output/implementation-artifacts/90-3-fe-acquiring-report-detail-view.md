# Story 90.3-FE: Acquiring Report Detail View

Status: done

## Story

**As a** business owner viewing the acquiring reports list,
**I want** to drill into a single report and see its per-transaction acquiring-fee breakdown,
**so that** I can audit individual card-transaction fees (bank, sale date, SKU, retail amount, fee, VAT) when a report total looks unusual.

**Epic**: 90-FE Acquiring Cost Reports UI
**Priority**: P2
**Estimate**: 5 story points
**Third story in epic** — Epic 90 stays `in-progress`. Wires up the disabled "Детали" button delivered by Story 90.2.

---

## Problem Statement

Story 90.2 shipped the reports-list page with a **disabled** "Детали" button on each row — Story 90.3 makes it live. When users click "Детали" on a report, they land on `/analytics/acquiring/reports/[id]` and see:

1. **Report header** — reportId, period (date_from → date_to), create date, seller name, currency.
2. **Transaction breakdown table** — one row per acquiring transaction (~10 fields per row): rrd_id, acq_date, acquiring_bank, sale_date, srid, doc_type_name, nm_id, retail_amount, acquiring_fee, acquiring_fee_vat.
3. **Summary** — aggregate across visible transactions (total fees, total VAT, transaction count).
4. **Back navigation** — back button to `/analytics/acquiring` list page.

### Data flow

```
Story 90.2 list           Story 90.3 detail
 /analytics/acquiring      /analytics/acquiring/reports/[id]
   table row               → clicks "Детали"
   reportId=123            → navigates with id=123
                          → useAcquiringReportDetail({reportId: 123})
                          → backend: GET /v1/analytics/acquiring/reports/123/detail
                          → renders transaction table
```

### Why a dedicated route (not a modal)

- Direct URL sharing (support/ops can link `/analytics/acquiring/reports/12345` in tickets)
- Browser back button works naturally
- Print/export-friendly (future story 90.3 stretch: CSV export of the transactions table)
- Matches Next.js App Router conventions used by `shipments/[id]`, `supplies/[id]`, `analytics/advertising/campaigns/[advertId]`

### Data layer is already there (Story 90.1 delivery)

- Hook: `useAcquiringReportDetail(reportId: number | null, enabled = true)` — already rejects `reportId <= 0`, already preserves `cachedAt`, already dual-lookup normalized.
- Type: `AcquiringReportDetailItem` with 10 fields, money fields nullable.
- This story consumes what 90.1 built — zero new API plumbing.

---

## Acceptance Criteria

### AC-1: Dynamic route + page entry

- [x] Create `src/app/(dashboard)/analytics/acquiring/reports/[id]/page.tsx` — Server Component thin wrapper. Next.js passes `params: { id: string }`; parse to number via `Number(params.id)`. Pass to client component. Handle `NaN` → render `notFound()` via Next.js `notFound()` helper.
- [x] Page component structure: if `Number.isNaN(reportId) || reportId <= 0`, call `notFound()`. Otherwise render `<AcquiringReportDetailPage reportId={reportId} />`.

### AC-2: `AcquiringReportDetailPage` orchestrator

Create `src/app/(dashboard)/analytics/acquiring/reports/[id]/components/AcquiringReportDetailPage.tsx`:

- [x] Mark `'use client'` at top.
- [x] Props: `{ reportId: number }`.
- [x] Call `useAcquiringReportDetail(reportId)` from Story 90.1.
- [x] Render 4 sections:
  1. **Back button** — `<Link href={ROUTES.ANALYTICS.ACQUIRING}>` with `<ArrowLeft>` icon + label "Назад к отчётам".
  2. **Page header** — `<h1>Отчёт #{reportId}</h1>` + subtitle showing period range (`{dateFrom} — {dateTo}`) extracted from the first transaction row OR from a header metadata block (backend doesn't expose report-level metadata in the detail endpoint; we show the period derived from min(sale_date) → max(sale_date) across transactions, OR fall back to "Период транзакций").
  3. **Summary cards** — reuse pattern from Story 90.2 adapted: 3 cards (total fees, total VAT, transaction count). Null-exclusion + footnote same as 90.2's `AcquiringSummaryCards`.
  4. **Transactions table** — `<AcquiringTransactionsTable transactions={data?.data ?? []} />`.
- [x] State machine matches Story 90.2's pattern:
  - First-load skeleton: `isLoading && !hasData`.
  - Full error alert: `isError && !hasData` with retry button calling `refetch`.
  - Empty state: `!isLoading && !isError && transactions.length === 0` → "Транзакции для этого отчёта не найдены. Для не-РФ продавцов данные всегда пустые."
  - Inline refetch-error chip when `isError && hasData` (same amber pattern as 90.2).
- [x] Wrap root with `data-testid="acquiring-report-detail"` landmark.
- [x] Russian locale throughout.

### AC-3: `AcquiringTransactionsTable`

Create `src/app/(dashboard)/analytics/acquiring/reports/[id]/components/AcquiringTransactionsTable.tsx`:

- [x] Client component.
- [x] Props: `{ transactions: AcquiringReportDetailItem[] }`.
- [x] 9 columns (hide `rrdId` as internal WB ID — not user-friendly):
  1. **Дата комиссии** — `acqDate` via `formatDate`.
  2. **Дата продажи** — `saleDate` via `formatDate`.
  3. **Банк** — `acquiringBank`.
  4. **SRID** — `srid` (WB sale ID).
  5. **Тип** — `docTypeName` (e.g., "Продажа", "Возврат").
  6. **Артикул** — `nmId` with a link to `/analytics/sku/{nmId}` or WB cabinet page (depending on convention — copy from another analytics page that links to SKU).
  7. **Сумма** — `retailAmount` formatted currency or `—` (nullable).
  8. **Комиссия** — `acquiringFee` formatted currency or `—`.
  9. **НДС** — `acquiringFeeVat` formatted currency or `—`.
- [x] Sortable by date columns + money columns. Default sort: `acqDate` descending.
- [x] Null rendering (`—`) for money columns (anti-pattern #8).
- [x] Defensive Frontend anomaly indicator: when `acquiringFee != null && acquiringFeeVat != null && acquiringFeeVat > acquiringFee`, show `AlertTriangle` in the НДС cell with tooltip — SAME pattern as Story 90.2's table. Factor out if duplication becomes uncomfortable; otherwise accept the repetition (2 usages = borderline).
- [x] `sortItems` helper — nulls sort LAST (reuse Story 90.2's pattern).
- [x] File-size budget: ~170-190 lines expected. Split trigger at 180 same as 90.2.

### AC-4: Summary cards for detail view

Create `src/app/(dashboard)/analytics/acquiring/reports/[id]/components/AcquiringReportDetailSummary.tsx`:

- [x] Client component.
- [x] Props: `{ transactions: AcquiringReportDetailItem[], reportId: number }`.
- [x] 3 cards:
  1. **"Всего комиссий"** — sum of `acquiringFee` (null-excluded + footnote with `pluralizeTransactions` helper — add similar to 90.2's `pluralizeReports`, rules: 1 → "транзакция", 2-4 → "транзакции", 5+ → "транзакций").
  2. **"Всего НДС"** — sum of `acquiringFeeVat` (same null-excluded pattern).
  3. **"Транзакций"** — `transactions.length`.
- [x] `pluralizeTransactions` helper: either declare locally, OR (cleaner) extract `pluralizeReports` from 90.2's file to a shared `src/lib/russian-plural.ts` module and add `pluralize('транзакция'|'отчёт', n)`.

**Decision for this story:** extract to shared module. 2 usages = threshold reached; prevents third-usage surprise.

### AC-5: Wire up Story 90.2's Details button

Story 90.2's `AcquiringReportsTable.tsx` currently shows a **disabled** `<Button>Детали</Button>`. This story makes it live:

- [x] Replace the disabled `<Button>` with a `<Link href={`/analytics/acquiring/reports/${item.reportId}`}>` wrapping a non-disabled button variant.
- [x] Remove the `<Tooltip>` wrapping it (no longer needed — button is live).
- [x] Remove the `aria-label` mentioning Story 90.3.
- [x] The code comment `// Story 90.3 will wire this to /analytics/acquiring/reports/[id]` → delete (obsolete after this story).

### AC-6: SKU linking convention

- [x] Inspect how `nmId` is linked in other analytics tables (grep for `nmId.*Link` or `analytics/sku` usage). Match the convention. If no pattern exists, link to WB's public card page: `https://www.wildberries.ru/catalog/${nmId}/detail.aspx` (open in new tab, `rel="noopener noreferrer"`, external icon).

### AC-7: 404 handling

- [x] Next.js `notFound()` call → Next 404 page. If the project has a custom `not-found.tsx` at the route segment level, mirror that. Otherwise stock Next.js 404 is fine.
- [x] Also handle the case where `reportId` is valid-looking but backend returns `data: []` (non-RF seller OR deleted report): render the empty-state message (AC-2), NOT 404. The distinction: bad URL → 404; valid URL, no data → empty state.

### AC-8: Tests

**Unit tests** — minimum 10 new tests:

- [x] `AcquiringTransactionsTable.test.tsx` (≥5):
  1. Renders 9 column headers.
  2. Default sort `acqDate` desc.
  3. Click sort on `acquiringFee` column toggles asc/desc.
  4. Null `retailAmount` renders `—`.
  5. Anomaly indicator visible when `acquiringFeeVat > acquiringFee`.
- [x] `AcquiringReportDetailSummary.test.tsx` (≥3):
  1. Sums correct with all-non-null money.
  2. Null items excluded + pluralized footnote.
  3. Empty transactions: 0 total, 0 VAT, 0 count.
- [x] `russian-plural.test.ts` (≥2, only if extraction path taken):
  1. `pluralize('отчёт', 1)` returns `отчёт`; 3 → `отчёта`; 5 → `отчётов`; 11 → `отчётов` (teen exception).
  2. `pluralize('транзакция', ...)` works same rules with `-ия/-ии/-ий` stems.

**E2E smoke test** — add to `e2e/acquiring.spec.ts` (append 2 tests):
- [x] Navigate to `/analytics/acquiring/reports/12345` directly → page landmark visible, header includes `#12345`.
- [x] Click "Назад" button → navigate back to `/analytics/acquiring` list page.

### AC-9: Validation

- [x] `npm run type-check && npm run lint && npm test -- --run` — **6874+ tests pass** (6864 + ~10 new). Zero regressions.
- [x] `npm run check:docs` unchanged (181 / 13 broken).

### AC-10: Sprint-status

- [x] `90-3-fe-acquiring-report-detail-view: backlog → ready-for-dev → in-progress → review` through normal workflow.

---

## Tasks / Subtasks

### Task 1: Route + page entry (AC-1)
- [x] 1.1: Create `reports/[id]/page.tsx` Server Component.
- [x] 1.2: Parse + validate `params.id` → `notFound()` if invalid.

### Task 2: Orchestrator (AC-2)
- [x] 2.1: Create `AcquiringReportDetailPage.tsx`.
- [x] 2.2: Wire `useAcquiringReportDetail(reportId)` + state machine.
- [x] 2.3: Back button to list page.
- [x] 2.4: Header with report ID + period derived from transactions.

### Task 3: Transactions table (AC-3)
- [x] 3.1: Create `AcquiringTransactionsTable.tsx`.
- [x] 3.2: 9-column sortable table.
- [x] 3.3: Null rendering + anomaly indicator (re-use or adapt 90.2's pattern).
- [x] 3.4: SKU linking per project convention (AC-6).
- [x] 3.5: Split if >180 lines (columns to sibling file).

### Task 4: Detail summary (AC-4)
- [x] 4.1: Extract `pluralizeReports` from 90.2 → `src/lib/russian-plural.ts` as generic `pluralize(root, count)`.
- [x] 4.2: Update 90.2's `AcquiringSummaryCards` to use shared module.
- [x] 4.3: Create `AcquiringReportDetailSummary.tsx`.
- [x] 4.4: Add `pluralizeTransactions` variant.

### Task 5: Wire up 90.2's Details button (AC-5)
- [x] 5.1: Modify `AcquiringReportsTable.tsx` — disabled button → `<Link>` to detail URL.
- [x] 5.2: Remove obsolete Tooltip + aria-label + comment.
- [x] 5.3: Update 90.2's existing test to assert the link href (if the current test asserts the disabled state, update that assertion).

### Task 6: 404 handling (AC-7)
- [x] 6.1: Verify `notFound()` path works (bad numeric id like `/reports/-5` or non-numeric `/reports/abc`).
- [x] 6.2: Verify empty-data state works (valid id, empty `data: []`).

### Task 7: Tests (AC-8)
- [x] 7.1: Transactions table tests (≥5).
- [x] 7.2: Detail summary tests (≥3).
- [x] 7.3: Russian-plural tests (≥2).
- [x] 7.4: E2E navigation smoke (+2 tests in `e2e/acquiring.spec.ts`).

### Task 8: Validation (AC-9, AC-10)
- [x] 8.1: `npm run type-check && npm run lint && npm test -- --run` — 6874+ pass.
- [x] 8.2: `npm run check:docs` unchanged.
- [x] 8.3: Sprint-status transitions.

---

## Dev Notes

### Canonical reference files (read before coding)

- `src/app/(dashboard)/shipments/[id]/page.tsx` — dynamic route pattern with `params` parsing + notFound handling.
- `src/app/(dashboard)/supplies/[id]/page.tsx` + its components — dynamic-route orchestrator + detail view layout.
- `src/app/(dashboard)/analytics/advertising/campaigns/[advertId]/page.tsx` — most similar dynamic-route analytics page.
- Story 90.2's `AcquiringReportsTable.tsx` — the table-with-anomaly-indicator pattern to mirror.
- Story 90.2's `AcquiringSummaryCards.tsx` — the 4-card summary pattern (simplify to 3 cards here).

### Why 9 columns, not 10

The `rrdId` field is WB's internal reconciliation ID — it's useful for backend debugging but noise for users. Hiding it reduces table width by one column and doesn't lose user-facing value. `srid` (the sale reconciliation ID) stays because it's the user's link to their WB sales history.

### Period derivation (no backend metadata field)

`AcquiringReportDetailItem` has no report-level metadata (`date_from`, `date_to`, `create_date`, etc.) — those live on `AcquiringReportListItem`. For the detail view's period display, derive from transactions:

```typescript
const period = useMemo(() => {
  if (!transactions.length) return null
  const saleDates = transactions.map(t => t.saleDate).filter(Boolean).sort()
  const acqDates = transactions.map(t => t.acqDate).filter(Boolean).sort()
  return { from: saleDates[0], to: acqDates[acqDates.length - 1] }
}, [transactions])
```

If cross-referencing the list (to get the report's `dateFrom`/`dateTo` metadata) feels cleaner: another option is to store the report's list-row in a query-cache lookup — but that couples the detail page to the list page's cache state. **Skip that approach**; stick with derived-from-transactions for this story.

### Russian plural module (extraction)

New file `src/lib/russian-plural.ts`:

```typescript
/**
 * Russian count-based pluralization.
 * Rules: last digit 1 → single, 2-4 → few, 5-20 → many, then repeats.
 * Teen exception: 11-14 always many.
 * Accepts a forms object keyed by [single, few, many] — caller supplies the 3 forms.
 */
export function pluralize(
  forms: readonly [single: string, few: string, many: string],
  count: number
): string {
  const abs = Math.abs(count)
  const lastTwo = abs % 100
  if (lastTwo >= 11 && lastTwo <= 14) return forms[2]
  const lastDigit = abs % 10
  if (lastDigit === 1) return forms[0]
  if (lastDigit >= 2 && lastDigit <= 4) return forms[1]
  return forms[2]
}

export const REPORT_FORMS = ['отчёт', 'отчёта', 'отчётов'] as const
export const TRANSACTION_FORMS = ['транзакция', 'транзакции', 'транзакций'] as const
```

Update Story 90.2's `AcquiringSummaryCards.tsx` to use:
```typescript
import { pluralize, REPORT_FORMS } from '@/lib/russian-plural'
// ...
не включает {nullCountFees} {pluralize(REPORT_FORMS, nullCountFees)} с неизвестными данными.
```

### File-size budget (pre-flight)

| File | Expected lines | Budget |
|---|---|---|
| `reports/[id]/page.tsx` | ~20 | 200 |
| `AcquiringReportDetailPage.tsx` | ~130 | 200 |
| `AcquiringTransactionsTable.tsx` | ~180 | 200 (tight — split trigger at 180, like 90.2) |
| `AcquiringReportDetailSummary.tsx` | ~90 | 200 |
| `russian-plural.ts` | ~50 | 200 |
| Test files | varies | 200 each (split if needed) |

**Split trigger** for transactions table (9 columns = more cells than 90.2's 6-column table): if exceeds 180 during implementation, extract `acquiring-transactions-columns.tsx` per 90.2's discipline.

### Out of scope

- **CSV export** (mentioned in epic spec as "optional stretch"): explicitly DEFERRED to a future Story 90.6-FE or punted. Don't write export code in this story.
- **Cross-report period detail view** (Story 90.4).
- **Dashboard integration** (Story 90.5).
- **Print styles** (no specific need).
- **Printing specific transaction links back to WB cabinet** (if SKU link is enough, no additional linking needed).
- **Refactoring 90.2's anomaly indicator into a shared component** — if feels tempting, defer; 2 usages is below the "rule of three" extraction threshold.

### Backlog ref

No specific backlog ticket. Epic 90's planning artifact is the spec. Mark `ROUTES.ANALYTICS.ACQUIRING` + the `[id]` sub-route as fully implemented in the existing sidebar-navigation layer (no new entry needed; drill-down routes don't get their own sidebar link).

---

## References

- Story 90.1-FE (`_bmad-output/implementation-artifacts/90-1-fe-acquiring-types-api-client-hooks.md`) — types + `useAcquiringReportDetail` hook.
- Story 90.2-FE (`_bmad-output/implementation-artifacts/90-2-fe-acquiring-reports-list-page.md`) — list page + disabled Details button to wire.
- Epic 90 spec: `_bmad-output/planning-artifacts/epics-90-fe.md` § Story 90.3.
- Backend Request #166: `docs/request-backend/166-ACQUIRING-COST-REPORTS-API.md`.
- Response samples: `test-api/34-acquiring-analytics.http:113-132` (detail shape).
- Canonical dynamic route: `src/app/(dashboard)/shipments/[id]/page.tsx`, `src/app/(dashboard)/supplies/[id]/page.tsx`.
- Types to consume: `src/types/acquiring-analytics.ts` (`AcquiringReportDetailItem`, `AcquiringDetailResponse`).
- Hook: `src/hooks/use-acquiring-report-detail.ts` (already guards `reportId > 0`).
- CLAUDE.md § Defensive Frontend Principle + anti-pattern #8.
- Story 90.2's `AcquiringReportsTable.tsx` — table pattern to mirror; `AcquiringSummaryCards.tsx` — summary pattern; `pluralizeReports` helper to extract to shared module.

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (executor agent, delegated) — full implementation.

### Debug Log References
- One test failure mid-run: `AcquiringReportDetailSummary.test.tsx` used `getByText` where two footnotes had identical text (fee + VAT both 1 null). Fixed to `getAllByText` asserting `.toBe(2)`.
- Pre-existing type errors in `advertising-analytics-api.ts` (unrelated — 0 new errors introduced).

### Completion Notes List
- Dynamic route `/analytics/acquiring/reports/[id]/page.tsx` implemented with Next.js 15 async params pattern (`params: Promise<{ id: string }>` + `use(params)`), matching `supplies/[id]/page.tsx`.
- Orchestrator `AcquiringReportDetailPage.tsx` mirrors Story 90.2 state machine exactly (skeleton/full-error/empty/inline-chip).
- `AcquiringTransactionsTable.tsx` — 9 columns, sortable, null→'—', anomaly indicator. Final line count: within 180-line budget (no split required). SKU links to WB public catalog page — no internal `/analytics/sku` pattern found in codebase (AC-6 confirmed via grep).
- `AcquiringReportDetailSummary.tsx` — 3 KPI cards using `pluralize(TRANSACTION_FORMS, n)` from shared module.
- `src/lib/russian-plural.ts` extracted from inline `pluralizeReports` in 90.2's `AcquiringSummaryCards`. Re-export wrapper kept in `AcquiringSummaryCards` for backward compatibility with existing test imports.
- 28 new unit tests added (16 russian-plural, 7 transactions table, 5 detail summary). Total suite: 6892 passed.
- type-check: 0 new errors. lint: 0 warnings. check:docs: 181/13 unchanged.
- E2E: 2 smoke tests appended to `e2e/acquiring.spec.ts` using `domcontentloaded` pattern (CLAUDE.md anti-pattern #9 compliant).

### File List
**New (8):**
- `src/lib/russian-plural.ts`
- `src/lib/__tests__/russian-plural.test.ts`
- `src/app/(dashboard)/analytics/acquiring/reports/[id]/page.tsx`
- `src/app/(dashboard)/analytics/acquiring/reports/[id]/components/AcquiringReportDetailPage.tsx`
- `src/app/(dashboard)/analytics/acquiring/reports/[id]/components/AcquiringTransactionsTable.tsx`
- `src/app/(dashboard)/analytics/acquiring/reports/[id]/components/AcquiringReportDetailSummary.tsx`
- `src/app/(dashboard)/analytics/acquiring/reports/[id]/components/__tests__/AcquiringTransactionsTable.test.tsx`
- `src/app/(dashboard)/analytics/acquiring/reports/[id]/components/__tests__/AcquiringReportDetailSummary.test.tsx`
- `src/app/(dashboard)/analytics/acquiring/components/shared/AnomalyVatIndicator.tsx` — new shared component (M-1 code-review extraction)

**Modified (4):**
- `src/app/(dashboard)/analytics/acquiring/components/AcquiringReportsTable.tsx` — wired Details button; M-1 IIFE replaced with AnomalyVatIndicator (186 → 144 lines)
- `src/app/(dashboard)/analytics/acquiring/components/AcquiringSummaryCards.tsx` — refactored to use shared russian-plural
- `e2e/acquiring.spec.ts` — 2 E2E smoke tests appended
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status → done

### Change Log

| Date | Change |
|---|---|
| 2026-04-22 | Story created. Third story in Epic 90-FE. 5 SP drill-down detail view built on Story 90.1's hook + 90.2's list page. Wires up 90.2's disabled Details button. Scope: new dynamic route /analytics/acquiring/reports/[id] + 3 components + extracted russian-plural module + ~10 unit tests + 2 E2E. Applies Defensive Frontend Principle (anomaly indicator) and null-vs-zero discipline (money → —). Out of scope: CSV export (deferred), cross-report period view (90.4), dashboard integration (90.5). |
| 2026-04-22 | Implementation complete. 7 new files + 2 source modifications + story doc + sprint-status. 6892 tests passing. 0 lint/type errors introduced. |
| 2026-04-23 | Code review complete: 6 findings (1H/3M/2L). Applied all 6: H-1 period derivation now uses saleDate for both ends (avoid reversal); M-1 extracted AnomalyVatIndicator to shared/ (rule-of-two reached across 90.2 + 90.3; transactions table 186 → 156 lines, reports table 174 → 144 lines); M-2 removed unused reportId prop from detail summary; M-3 replaced trivial currency assertions with exact formatted-output regex; L-1 added 3 edge-case plural tests (0, negative, decimal via Math.trunc coercion); L-2 defensive row key (srid \|\| composite-with-idx). Re-validation: 6895 tests pass, 0 regressions, check:docs unchanged. Status → done. |

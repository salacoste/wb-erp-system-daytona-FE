# Story 90.4-FE: Acquiring Period Detail View

Status: done

## Story

**As a** business owner who wants to audit acquiring transactions across a date range rather than drill into a single report,
**I want** a cross-report "period detail" view that lists every acquiring transaction in a selectable period — regardless of which report grouped it,
**so that** when WB issues overlapping reports (same sale appearing in two reports) or when I need to audit a specific week, I can see all transactions in one deduplicated list.

**Epic**: 90-FE Acquiring Cost Reports UI
**Priority**: P2
**Estimate**: 4 story points
**Fourth story in epic** — Epic 90 stays `in-progress`. Consumes Story 90.1's `useAcquiringPeriodDetail` hook + reuses Story 90.3's transactions table.

---

## Problem Statement

Stories 90.2 (list) + 90.3 (single-report drill-down) cover the "by-report" axis of acquiring analytics. But WB's reporting system has a **cross-report concern**: reports can overlap (same sale appears in two reports if WB rebuilds the period mid-generation), and users sometimes need to audit "all acquiring transactions in week X" regardless of which report grouped them.

The backend already delivered the endpoint:

```
GET /v1/analytics/acquiring/detail?from=&to=
  → { data: AcquiringReportDetailItem[], cached_at: string }
```

Story 90.1 shipped the hook (`useAcquiringPeriodDetail`) + types + normalizer. Story 90.3 shipped the UI components (`AcquiringTransactionsTable` + `AnomalyVatIndicator` + `AcquiringReportDetailSummary` pattern + `russian-plural` module).

**This story assembles them into a cross-report page.** Minimal new code; maximum reuse.

### Scope boundary

**In scope:**
- New route `/analytics/acquiring/period`.
- Page orchestrator: `DateRangePickerExtended` + `useAcquiringPeriodDetail(from, to)` + state machine.
- Summary card (reuse pattern; 3 cards).
- Transaction table (REUSE Story 90.3's `AcquiringTransactionsTable` — import directly).
- Navigation link from `/analytics/acquiring` list page → `/analytics/acquiring/period`.
- Info tooltip explaining when period mode is useful.
- Tests + E2E smoke.

**Out of scope:**
- Sidebar entry for `/period` (the main Acquiring sidebar entry covers both surfaces; `/period` is reachable from inside `/analytics/acquiring`).
- Drill-from-period-to-single-report (user can click a transaction's `reportId` if we decide to add that link; for this story, it's a plain number).
- Story 90.5 (dashboard integration).
- CSV export (deferred per epic spec).

---

## Acceptance Criteria

### AC-1: New route

- [x] `src/app/(dashboard)/analytics/acquiring/period/page.tsx` — Server Component thin wrapper (~10 lines) rendering `<AcquiringPeriodDetailPage />`.

### AC-2: `AcquiringPeriodDetailPage` orchestrator

Create `src/app/(dashboard)/analytics/acquiring/period/components/AcquiringPeriodDetailPage.tsx`:

- [x] `'use client'`.
- [x] No props (owns all date-range state internally).
- [x] Default date range: **last 7 days** (period view is narrower than reports-list's 30 days — aligns with "audit this week" use case).
- [x] Controls row:
  - `DateRangePickerExtended` with the 7-day default + `id="acquiring-period-range"`.
  - Info tooltip: `<Info>` icon from `lucide-react` with tooltip text: "Эта страница показывает все транзакции эквайринга за выбранный период без группировки по отчётам. Используйте её, когда отчёты WB перекрываются или нужно аудитировать конкретную неделю."
- [x] Header: `<h1>Эквайринг за период</h1>` + subtitle `<p>Транзакции эквайринга без группировки по отчётам</p>`.
- [x] Back button: `<Link href={ROUTES.ANALYTICS.ACQUIRING}>` with `<ArrowLeft>` + label "Назад к отчётам".
- [x] `useAcquiringPeriodDetail(apiFrom, apiTo)` from Story 90.1.
- [x] State machine mirrors 90.2 + 90.3 (first-load skeleton, full error, empty, success, inline refetch-error chip):
  - Empty state text: "Транзакции за выбранный период не найдены. Для не-РФ продавцов данные всегда пустые."
- [x] Renders on success:
  - `<AcquiringPeriodSummary transactions={items} />` (AC-3)
  - `<AcquiringTransactionsTable transactions={items} />` — **import directly** from `src/app/(dashboard)/analytics/acquiring/reports/[id]/components/AcquiringTransactionsTable` (Story 90.3). Do NOT copy or duplicate.
- [x] `data-testid="acquiring-period-detail"` landmark on root container.

### AC-3: `AcquiringPeriodSummary`

Create `src/app/(dashboard)/analytics/acquiring/period/components/AcquiringPeriodSummary.tsx`:

- [x] `'use client'`.
- [x] Props: `{ transactions: AcquiringReportDetailItem[] }`.
- [x] 3 KPI cards (identical to 90.3's `AcquiringReportDetailSummary` structure):
  1. **Всего комиссий** — sum of `acquiringFee` (null-excluded + footnote via `pluralize(TRANSACTION_FORMS, nullCount)` from `@/lib/russian-plural`).
  2. **Всего НДС** — sum of `acquiringFeeVat` with same null handling.
  3. **Транзакций** — `transactions.length`.
- [x] Import `pluralize, TRANSACTION_FORMS` from `@/lib/russian-plural`.
- [x] Consider factoring to a shared `AcquiringTransactionsSummaryCards` base component if you notice the code diverges from 90.3's summary only in surface text — **BUT**: rule-of-two threshold. Default decision: **keep separate files** for 90.3 (by-report) and 90.4 (by-period). Factor to shared only if Story 90.5 needs a third summary instance. Honest duplication of ~85 lines beats premature abstraction for 2 sites.

### AC-4: Link from list page (Story 90.2's `AcquiringPageContent.tsx`)

- [x] Add a secondary action button or link in the `AcquiringPageContent` header row (near the `DateRangePickerExtended`): `<Link href="/analytics/acquiring/period">Детализация за период</Link>` styled as `<Button variant="outline">`.
- [x] Position: right side of the controls row, after the date picker. Keep it unobtrusive — users who want reports-list stay put; users who want cross-report can opt in.
- [x] Inverse link from `/period` back to `/analytics/acquiring` already covered by AC-2's back button.

### AC-5: Info tooltip

- [x] On the period-view header, render `<Info>` icon + `<Tooltip>` explaining the "why use this mode" (per AC-2 controls row).
- [x] Russian text. Match the voice of other tooltips in the codebase.

### AC-6: Tests

**Unit tests** — minimum 6 new:

- [x] `AcquiringPeriodSummary.test.tsx` (≥4, adapted from 90.3's `AcquiringReportDetailSummary.test.tsx`):
  1. Sums correct with all-non-null money (use regex assertions on formatted currency — don't regress to trivially-true assertions per 90.3's M-3 review lesson).
  2. Null items excluded + pluralized footnote visible.
  3. Empty transactions: 0 fees, 0 VAT, 0 count.
  4. Single transaction with null VAT only: VAT total shows `0 ₽` via `—` fallback OR null-excluded sum = 0 with no footnote if VAT had one null (semantics match 90.3's summary).
- [x] `AcquiringPeriodDetailPage.test.tsx` (≥2):
  1. Renders landmark + header + back button when data resolves.
  2. Empty state visible when `data: []`.
- [x] Don't duplicate tests for `AcquiringTransactionsTable` — those live with 90.3's tests and apply here by reuse.

**E2E** — append 2 tests to `e2e/acquiring.spec.ts`:

- [x] Navigate to `/analytics/acquiring/period` directly → landmark `acquiring-period-detail` visible + header "Эквайринг за период" present.
- [x] Click "Детализация за период" link from `/analytics/acquiring` list page → lands on `/period`. Use `domcontentloaded` + landmark waits per CLAUDE.md anti-pattern #9.

### AC-7: Validation

- [x] `npm run type-check && npm run lint && npm test -- --run` — **6904 tests pass** (6895 + 9 new). Zero regressions.
- [x] `npm run check:docs` unchanged (181 / 13).

### AC-8: Sprint status

- [x] `90-4-fe-acquiring-period-detail-view: ready-for-dev → review` through normal workflow.

---

## Tasks / Subtasks

### Task 1: Route (AC-1)
- [x] 1.1: Create `acquiring/period/page.tsx` Server Component.

### Task 2: Orchestrator (AC-2, AC-5)
- [x] 2.1: Create `AcquiringPeriodDetailPage.tsx` mirroring 90.2's `AcquiringPageContent.tsx` state machine.
- [x] 2.2: Wire `DateRangePickerExtended` (7-day default) + `useAcquiringPeriodDetail`.
- [x] 2.3: Back button + info tooltip.
- [x] 2.4: Import `AcquiringTransactionsTable` from Story 90.3's path.

### Task 3: Summary cards (AC-3)
- [x] 3.1: Create `AcquiringPeriodSummary.tsx`.
- [x] 3.2: Null-excluded sums + pluralized footnote.

### Task 4: Navigation link (AC-4)
- [x] 4.1: Modify Story 90.2's `AcquiringPageContent.tsx` — add "Детализация за период" link in controls row.

### Task 5: Tests (AC-6)
- [x] 5.1: `AcquiringPeriodSummary.test.tsx` (6 tests).
- [x] 5.2: `AcquiringPeriodDetailPage.test.tsx` (3 tests).
- [x] 5.3: E2E: +2 tests in `e2e/acquiring.spec.ts`.

### Task 6: Validation (AC-7, AC-8)
- [x] 6.1: `npm run type-check && npm run lint && npm test -- --run` → 6904 pass.
- [x] 6.2: `npm run check:docs` unchanged (181 / 13).
- [x] 6.3: Sprint-status transitions.

---

## Dev Notes

### Canonical references (read first)

- Story 90.3's `AcquiringReportDetailPage.tsx` — direct structural parallel. Mirror the state machine, section order, and back-button pattern.
- Story 90.3's `AcquiringReportDetailSummary.tsx` — template for the summary cards.
- Story 90.2's `AcquiringPageContent.tsx` — state machine pattern (the canonical version; 90.3 is also based on it).
- Story 90.1's `use-acquiring-period-detail.ts` — the hook (already handles `enabled` guard on empty strings).
- `src/lib/russian-plural.ts` — `pluralize` + `TRANSACTION_FORMS`.

### Why 7-day default (not 30-day)

Reports-list page uses 30-day default — covers "here's everything for the month." Period-detail page is for auditing; 7-day default matches the "what happened this week" use case. 30 days of raw transactions would be overwhelming (large cabinets might have thousands of rows). If user wants a month, they expand the picker; no harm done.

### Import path for the shared table

From `src/app/(dashboard)/analytics/acquiring/period/components/AcquiringPeriodDetailPage.tsx`:

```typescript
import { AcquiringTransactionsTable } from '@/app/(dashboard)/analytics/acquiring/reports/[id]/components/AcquiringTransactionsTable'
```

The import path includes `[id]` — this is an App Router filesystem path, and Next.js tolerates imports across route segments. Confirm by checking if this pattern is used elsewhere (it's fine in Next.js 15). If TS complains about path aliases, fallback to relative: `../../reports/[id]/components/AcquiringTransactionsTable`. The `@/` alias pattern is strongly preferred.

### File-size budget

| File | Expected | Budget |
|---|---|---|
| `period/page.tsx` | ~10 | 200 |
| `AcquiringPeriodDetailPage.tsx` | ~140 | 200 |
| `AcquiringPeriodSummary.tsx` | ~85 | 200 |
| Tests | ~100-130 each | 200 |

All well under budget. No split triggers at risk.

### Why NOT factor summary to shared base

Rule-of-two threshold: 90.3's summary + 90.4's summary = 2 sites. The files diverge in surface text ("Сводка по отчёту" vs "Сводка за период") and subtitle. Surface-text divergence is 6-10 lines; shared-base extraction would add 2 files (base + specialization) to avoid 10 duplicated lines. Net-negative. Keep separate. Extract only if Story 90.5 (dashboard integration) genuinely needs a third instance of the same three-card layout.

### Info tooltip text (copy-ready)

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Info className="h-4 w-4 text-muted-foreground cursor-help" aria-label="О странице" />
  </TooltipTrigger>
  <TooltipContent className="max-w-sm">
    <p className="text-xs">
      Эта страница показывает все транзакции эквайринга за выбранный период без группировки по отчётам.
      Используйте её, когда отчёты WB перекрываются или нужно аудитировать конкретную неделю.
    </p>
  </TooltipContent>
</Tooltip>
```

### Anomaly detection (inherited)

Because 90.4 reuses `AcquiringTransactionsTable` from 90.3, the VAT > fee anomaly indicator (via shared `AnomalyVatIndicator`) automatically works here. Same Defensive Frontend Principle guarantee — no extra code needed.

### Out of scope (reiterated)

- No new sidebar entry (the existing "Эквайринг" entry covers both surfaces).
- No drill-from-transaction-to-report (clicking reportId in the table takes no action; future story might wire).
- No date-range-boundary guards (DatePickerExtended enforces from ≤ to already).
- No CSV export.

### Backlog ref

No specific ticket. Epic 90 planning artifact (`_bmad-output/planning-artifacts/epics-90-fe.md` § Story 90.4) is the spec.

---

## References

- Story 90.1-FE foundation — `useAcquiringPeriodDetail` hook at `src/hooks/use-acquiring-period-detail.ts`.
- Story 90.2-FE list page — `AcquiringPageContent.tsx` (will be modified for AC-4 navigation link).
- Story 90.3-FE drill-down — `AcquiringTransactionsTable.tsx` (reused directly), `AcquiringReportDetailSummary.tsx` (template for AC-3), `AcquiringReportDetailPage.tsx` (template for AC-2), shared `AnomalyVatIndicator.tsx`.
- Backend endpoint: `GET /v1/analytics/acquiring/detail?from=&to=` (`docs/request-backend/166-ACQUIRING-COST-REPORTS-API.md`).
- Response samples: `test-api/34-acquiring-analytics.http:113-132`.
- Types: `src/types/acquiring-analytics.ts` (`AcquiringReportDetailItem`, `AcquiringDetailResponse`, `AcquiringPeriodDetailParams`).
- Epic 90 spec: `_bmad-output/planning-artifacts/epics-90-fe.md` § Story 90.4.
- Russian plural: `src/lib/russian-plural.ts`.
- CLAUDE.md § Defensive Frontend Principle + anti-pattern #8 + #9.

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet (executor, delegated)

### Debug Log References

### Completion Notes List

- Created `src/app/(dashboard)/analytics/acquiring/period/page.tsx` (~10 lines) — thin Server Component wrapper.
- Created `AcquiringPeriodDetailPage.tsx` (~135 lines) — full state machine orchestrator: 7-day default range, `useAcquiringPeriodDetail`, skeleton/error/empty/success branches, info tooltip with `TooltipProvider`, back button, imports `AcquiringTransactionsTable` directly from Story 90.3's path using `@/` alias.
- Created `AcquiringPeriodSummary.tsx` (~85 lines) — 3 KPI cards (fees, VAT, count) with null-excluded sums and pluralized footnotes; kept separate from 90.3's summary per rule-of-two spec note.
- Modified `AcquiringPageContent.tsx` — added `Link` import + "Детализация за период" outline button in controls row after date picker.
- Created `AcquiringPeriodSummary.test.tsx` (6 tests) — regex currency assertions, null-exclusion footnote, plural forms (транзакция/транзакции/транзакций).
- Created `AcquiringPeriodDetailPage.test.tsx` (3 tests) — mocked hook + `next/link` + `DateRangePickerExtended`; landmark/header/back-button/empty-state/skeleton coverage.
- Appended 2 E2E smoke tests to `e2e/acquiring.spec.ts` — direct navigation + link-click navigation using `domcontentloaded` per CLAUDE.md anti-pattern #9.
- Validation: 6904 tests passed (was 6895, +9), 0 lint errors, 0 new type errors in period files, check:docs 181/13 unchanged.

### File List

**New files (4):**
- `src/app/(dashboard)/analytics/acquiring/period/page.tsx`
- `src/app/(dashboard)/analytics/acquiring/period/components/AcquiringPeriodDetailPage.tsx`
- `src/app/(dashboard)/analytics/acquiring/period/components/AcquiringPeriodSummary.tsx`
- `src/app/(dashboard)/analytics/acquiring/period/components/__tests__/AcquiringPeriodSummary.test.tsx`
- `src/app/(dashboard)/analytics/acquiring/period/components/__tests__/AcquiringPeriodDetailPage.test.tsx`

**Modified files (2):**
- `src/app/(dashboard)/analytics/acquiring/components/AcquiringPageContent.tsx` — added Link + "Детализация за период" button
- `e2e/acquiring.spec.ts` — appended 2 E2E tests for Story 90.4

### Change Log

| Date | Change |
|---|---|
| 2026-04-23 | Story created. Fourth story in Epic 90-FE. 4 SP UI story — reuses Story 90.3's `AcquiringTransactionsTable` + `AnomalyVatIndicator` + `russian-plural` module. Scope: new `/analytics/acquiring/period` route + orchestrator + summary cards + navigation link from list page + info tooltip + ≥6 tests + 2 E2E. Default date range: 7 days (vs 30 days on reports list). No new infrastructure — pure assembly. Out of scope: sidebar entry, drill-from-transaction, CSV export, Story 90.5 dashboard integration. |
| 2026-04-24 | Story implemented by Claude Sonnet executor. All AC satisfied. 9 new tests (6 summary + 3 page). Full suite: 6904 passed. Lint clean. No new type errors. |
| 2026-04-24 | Code review complete: 4 findings (0H/2M/2L). Applied all 4: M-1 added `ACQUIRING_PERIOD` to `ROUTES.ANALYTICS` registry + updated list-page link; M-2 E2E locator scoped via `getByRole('link', {name: ...})`; L-1 skeleton uses `role="status" aria-busy="true"` with role-based test assertion (resilient + a11y win); L-2 `<Link><Button>` flipped to `<Button asChild><Link>` Radix Slot pattern (valid HTML, no nested interactive elements) — applied in 90.4 scope only, 90.2/90.3 pre-existing patterns left for separate cleanup. Re-validation: 6904 tests pass, 0 regressions, check:docs unchanged. Status → done. |

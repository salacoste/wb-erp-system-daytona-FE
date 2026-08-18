# 169.3-FE — Migrate Acquiring Report Transaction Detail (shadcn tokens)

Status: COMPLETE (not committed — left in worktree per protocol)
Branch: `cdx/epic-169-story-3-acquiring-report-detail-shadcn` (base 3262793b)
Scope: presentation-only token migration, `/analytics/acquiring/reports/[id]`.

## Changed files

1. `src/app/(dashboard)/analytics/acquiring/reports/[id]/components/AcquiringTransactionsTable.tsx` (SHARED with 169.2 period consumer — additive-only changes)
2. `src/app/(dashboard)/analytics/acquiring/reports/[id]/components/AcquiringReportDetailPage.tsx`
3. `src/app/(dashboard)/analytics/acquiring/reports/[id]/components/AcquiringReportDetailSummary.tsx`
4. `.../__tests__/AcquiringTransactionsTable.test.tsx` (8 → 14)
5. `.../__tests__/AcquiringReportDetailSummary.test.tsx` (6 → 8)
6. `.../__tests__/AcquiringReportDetailPage.test.tsx` — NEW (0 → 3)

`reports/[id]/page.tsx` (thin wrapper с notFound): inspected, no legacy tokens — untouched, as predicted.

## Class mapping (was → became)

| Location | was | became |
|---|---|---|
| DetailPage h1 | `text-3xl font-bold tracking-tight` | `text-2xl font-bold tracking-tight` (wave canon 168.11/169.1/169.2) |
| DetailPage inline refetch-error chip | `border-amber-200 bg-amber-50 ... text-amber-800` | `border-status-warning/30 bg-status-warning/15 ... text-status-warning` (matched-pair /15-chip idiom) |
| Summary money headlines («Всего комиссий»/«Всего НДС») | `text-2xl font-bold` | `text-2xl font-bold tabular-nums` |
| Summary footnotes ×2 | `text-xs text-amber-700` | `text-xs text-status-warning` |
| Table nmId link (L137) | `text-blue-600 hover:underline font-mono` | `text-status-information hover:underline font-mono` (168.11 delivery-link precedent) |
| Table money cells (Сумма/Комиссия/НДС) | `text-sm` | `text-sm tabular-nums` |

## SHARED-component changes (additive-only, public contract preserved)

- `AcquiringTransactionsTable` props: added optional `caption?: string`. Rendered as `<TableCaption>` ONLY when passed. Period consumer (169.2) doesn't pass it → its render byte-identical. Proven by new negative test ("does NOT render a caption when prop is omitted") + full whole-acquiring suite green.
- AX row-action identity: nmId link got `aria-label={`Товар ${nmId} на Wildberries (внешняя ссылка)`}`.
- Sortable th: added `aria-sort` (ascending/descending/undefined), `tabIndex={0}`, `onKeyDown` Enter/Space — copy of 169.1 `AcquiringReportsTable` idiom.
- DetailPage (route owner) passes `caption={`Транзакции отчёта #${reportId}`}` (RTC report identity).

## Tests

Baseline: 14 passed (TransactionsTable=8, Summary=6; no DetailPage test file existed). After: **25 passed, 0 failed** (TransactionsTable=14, Summary=8, DetailPage=3 — all baselines intact, count only grew).

Added:
- (a) h1 `text-2xl` pin + `not.text-3xl` (new DetailPage file).
- (b) inline chip matched-pair: `bg-status-warning/15` + `text-status-warning` + `border-status-warning/30` + `not.toContain('amber')` (DetailPage).
- (c) footnotes `text-status-warning`, no amber (Summary).
- (d) money headlines `tabular-nums`; counter explicitly NOT (Summary); table money cells idx 6/7/8 `tabular-nums`, bank cell NOT (TransactionsTable).
- (e) caption: rendered with report identity when passed (both directly and through DetailPage) + NOT rendered without prop (additive-proof for period consumer).
- (f) nmId link aria-label via `getByRole('link', {name})` + `text-status-information` + preserved `hover:underline`/`font-mono` + `not.text-blue-600` + href pin.
- (g) `aria-sort` state (default acqDate=descending, inactive th=null) + keyboard Enter→ascending / Space→descending.

All pins exact `getAttribute('class')` `toContain` / attribute matchers; no `[class*=]`.

## Commands + exit codes

- `npx vitest run "src/app/(dashboard)/analytics/acquiring/reports"` → baseline 14 passed → after 25 passed / 0 failed — exit 0
- `npx vitest run "src/app/(dashboard)/analytics/acquiring"` (whole acquiring, sibling regression) → **10 files / 93 passed / 0 failed** — exit 0 (no period-тест regressions from caption-prop)
- `npx tsc --noEmit` → exit 0
- `npx eslint ".../reports/[id]/components"` → exit 0 (0 problems)
- `npx prettier --write` on 3 files (multiline reflow only), then `--check` clean — exit 0

## Gaps (conscious deviations)

1. Prompt's whole-acquiring estimate said 107 tests; actual tree = 10 files / 93 (incl. my +11). Zero failures either way; the 107 figure was stale/approximate, not a regression.
2. Keyboard test uses `user.keyboard('{Enter}')`/`(' ')` after `.focus()` instead of raw dispatchKeyboard — same activation path as 169.1 semantics, jsdom-safe.
3. No test added for skeleton/rate-limit branches of DetailPage state machine — those branches are untouched by the migration (Alert/Skeleton shadcn-semantic, banner 169.1-owned); table/summary/chip coverage was the migration surface.
4. aria-sort asserted only on 2 of 5 sortable th (Дата комиссии default + Комиссия interactive) — representative pins; all sortable th share the same `th()` factory so single-factory coverage is structural.

## Review questions

- None blocking. Confirm counter card intentionally stays without `tabular-nums` (per inventory instruction) and that `Товар ... (внешняя ссылка)` aria-label wording is acceptable.

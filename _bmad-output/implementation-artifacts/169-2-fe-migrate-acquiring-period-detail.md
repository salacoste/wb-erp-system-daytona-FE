# 169.2-FE — Migrate Acquiring Period Detail (shadcn tokens)

Status: COMPLETE (not committed — left in worktree per protocol)
Branch: `cdx/epic-169-story-2-acquiring-period-shadcn` (base cc8ba015)
Scope: presentation-only token migration, `/analytics/acquiring/period`.

## Changed files

1. `src/app/(dashboard)/analytics/acquiring/period/components/AcquiringPeriodDetailPage.tsx`
2. `src/app/(dashboard)/analytics/acquiring/period/components/AcquiringPeriodSummary.tsx`
3. `src/app/(dashboard)/analytics/acquiring/period/components/__tests__/AcquiringPeriodDetailPage.test.tsx`
4. `src/app/(dashboard)/analytics/acquiring/period/components/__tests__/AcquiringPeriodSummary.test.tsx`

`period/page.tsx` (11-line wrapper): inspected, no legacy tokens — untouched, as predicted.

## Class mapping (was → became)

| Location | was | became |
|---|---|---|
| DetailPage h1 (L84) | `text-3xl font-bold tracking-tight` | `text-2xl font-bold tracking-tight` (wave canon, 168.11/169.1) |
| DetailPage inline refetch-error chip (L179) | `border-amber-200 bg-amber-50 ... text-amber-800` | `border-status-warning/30 bg-status-warning/15 ... text-status-warning` (matched-pair /15-chip, identical to 169.1 banner idiom) |
| Summary money headlines L60, L76 («Всего комиссий»/«Всего НДС») | `text-2xl font-bold` | `text-2xl font-bold tabular-nums` |
| Summary footnotes L62, L78 | `text-xs text-amber-700` | `text-xs text-status-warning` |
| «Транзакций» counter (L92) | `text-2xl font-bold` | NOT changed (not money — no tabular-nums, per inventory) |

Left untouched (already canonical / out of scope): back button (named, AX ok), Info-tooltip beside h1 (complements subtitle p, not tooltip-only), Alert variants (shadcn semantic), `AcquiringRateLimitBanner` (169.1-owned, imported read-only), `AcquiringTransactionsTable` (169.3-owned).

## Tests

Baseline: 11 passed (DetailPage=4, Summary=7). After: **16 passed, 0 failed** (DetailPage=7, Summary=9).

Added:
- (a) h1 `text-2xl` pin (exact `getAttribute('class')` contains).
- (b) inline chip matched-pair: contains `bg-status-warning/15` + `text-status-warning` + `border-status-warning/30` + `not.toContain('amber')`.
- (c) footnotes `text-status-warning`, no amber.
- (d) money headlines `tabular-nums`; counter explicitly NOT.
- (e) state-machine priority: 503 ApiError (no cached data) → rate-limit banner testid present AND generic full-error absent (was uncovered: DetailPage had only 4 tests, no rate-limit-vs-error priority case).

Used real `ApiError('Rate limited', 503)` from `@/types/api` (same idiom as AcquiringPageContent tests), not a fake response shape.

## Commands + exit codes

- `npx vitest run "src/app/(dashboard)/analytics/acquiring/period"` → 11 passed (baseline), 16 passed (after) — exit 0
- `npx tsc --noEmit` → exit 0
- `npx eslint <4 files>` → exit 0 (0 problems)
- `npx prettier --check <4 files>` → exit 0 after `--write` on 2 files (pre-existing long-line reflow only; no semantic change)

## Gaps (conscious deviations)

1. Rate-limit priority test asserts via `data-testid="acquiring-rate-limit-banner"` (banner is 169.1-owned surface; testid pin avoids coupling to its copy text).
2. Prettier `--write` reflowed two files (multiline `<p>` in Summary, `.closest('div')` chain in test) — cosmetic only.
3. No priority tests added for skeleton-vs-slow-loading (already covered by baseline tests 3-4) and full-error-vs-empty (full-error branch now indirectly pinned by the rate-limit test's negative assertion; a dedicated 500-full-error test was considered but the destructive-alert variant is shadcn-semantic and untouched by this migration).

## Review questions

- None blocking. Confirm counter card intentionally stays without `tabular-nums` (per inventory instruction).

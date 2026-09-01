# 168.10 FE — Migrate Time-Period Analytics (`/analytics/time-period`) to shadcn tokens

- **Status**: done — (was: "Code-complete (uncommitted in worktree, per wave protocol)"; synced by Story 174.5 on 2026-09-02; authoritative delivery/gate evidence: sprint-status.yaml row with PR/merge/review/vitest)
- **Branch**: `cdx/epic-168-story-10-time-period`
- **Base**: `6dbd2941` (origin/main)
- **Worktree**: `/private/tmp/wb-fe-168-10-migrate-time-period-analytics`

## Acceptance

All 20 legacy palette sites + 6 chart-hex sites across the owned surface replaced with
semantic tokens (pass-1 review recount: Tooltip 12 incl. `bg-white` dark-fix + Summary 6 +
ChartHelpCard 2; hex = 3 in `getMarginDotColor` + 3 recharts attrs — initial 19+4 tally
missed the tooltip container and the chart-attr trio); 3 visual states of margin sign
(pos/neg/zero) preserved everywhere (NOT a tier-collapse); behavior locked (labels,
formatters, hook calls, recharts config untouched);
targeted vitest green (only grew); lint/type-check/prettier gates green.

## Classification

- **Money sign** → `financial-positive|negative`; **zero** → `muted-foreground` (text) /
  `chart-reference` (SVG) — 3 states preserved.
- **Data-completeness** (missing COGS) → `status-warning`.
- **Neutral text** (labels, dates, «нет данных») → `muted-foreground`; week header → `foreground`.
- **SVG grid** → `border` semantics; **zero reference line** → `chart-reference` (consistent
  with zero dots).

## Changes (per file, was → became)

| File | Sites | Change |
|---|---|---|
| `margin-trend-chart/margin-trend-utils.ts` | 3 | `getMarginDotColor`: `#4CAF50`→`var(--color-chart-positive)`, `#EF4444`→`var(--color-chart-negative)`, `#9CA3AF`→`var(--color-chart-reference)`. `var()` valid in SVG fill/stroke attrs. |
| `MarginTrendChart.tsx` | 4 | CartesianGrid `stroke="#eee"`→`var(--color-border)`; ReferenceLine y=0 `stroke="#9ca3af"`→`var(--color-chart-reference)`; Line `stroke="#2563EB"`→`var(--color-chart-1)`. Dot radii/strokeWidth/dasharray untouched. |
| `margin-trend-chart/MarginTrendTooltip.tsx` | 12 | `bg-white`→`bg-popover` (**dark-mode bug fix**); `text-gray-900`→`text-foreground`; `text-gray-500`×2→`text-muted-foreground`; `text-gray-600`×5 (labels + zero value)→`text-muted-foreground`; margin value `text-green-600`/`text-red-600`→`text-financial-positive|negative`; missing-COGS `text-amber-600`→`text-status-warning`. `border` + `shadow-md` kept. |
| `margin-trend-chart/MarginTrendSummary.tsx` | 6 | labels `text-gray-500`×4→`text-muted-foreground`; max `text-green-600`→`text-financial-positive`; min `text-red-600`→`text-financial-negative`. Avg margin left uncolored (no new semantics). |
| `time-period/components/ChartHelpCard.tsx` | 2 | «Зелёные точки» `text-green-600`→`text-financial-positive`; «Красные точки» `text-red-600`→`text-financial-negative`. Legend WORDS unchanged (color+word WCAG redundancy); «Серые точки» already token. |
| `margin-trend-chart/MarginTrendStates.tsx` | 0 | already clean — untouched. |
| `time-period/page.tsx` | 0 | already clean — untouched. |

## Tests

- EXT `margin-trend-chart/__tests__/margin-trend-utils.test.ts` — hex pins → exact var-name
  pins (`var(--color-chart-positive|negative|reference)`), 168.1 precedent (pin var name, not RGB).
- EXT `MarginTrendChart.test.tsx` — 5 NEW `it` (all in a NEW direct-render describe for
  `MarginTrendTooltip` — recharts does not render Tooltip content in jsdom): bg-popover, margin
  value pos/neg/zero (selector = `span.font-medium` next to «Маржа:» label), missing-COGS
  status-warning; PLUS 2 exact assertions added into EXISTING summary max/min `it`s
  (`closest('p')` on value). Typed fixture via `MarginTrendPoint`, no `as any` in new code.
- EXT `time-period/__tests__/page.test.tsx` — +2 exact pins: help-card legend
  «Зелёные точки»/«Красные точки» token classes.
- No behavioral test touched.

## Raw-palette sweep proof (widened)

`grep -rnE "(bg|text|border|ring|divide|fill|stroke|outline|from|to)-(red|yellow|blue|green|gray|rose|amber|emerald|sky|orange|slate|zinc|neutral|stone|lime|teal|cyan|indigo|violet|purple|fuchsia|pink)(-[0-9]{3})?"` over
`MarginTrendChart.tsx`, `margin-trend-chart/`, `analytics/time-period/` → **0 hits** (exit 1).

## Known intentional deltas

1. **Line color** `#2563EB` → `var(--color-chart-1)` (light ≈ `#1579C4`, slightly darker;
   dark theme now adapts). Precedent: 168.1 SearchPerformanceWidget — known intentional delta.
2. **`bg-white` → `bg-popover` on tooltip container** — dark-mode BUG FIX (white tooltip in
   dark theme before). Improvement, not just token swap.

## Gates (worktree)

1. Targeted vitest before: **69 passed / 0 failed**; after: **76 passed / 0 failed** (3 files, only grew).
2. `npx eslint <8 touched files> --max-warnings 0` — **exit 0**.
3. `npx tsc --noEmit` — **exit 0**.
4. `npx prettier --check` — **pass** (after one `--write` pass).

## External consumers

- `useMarginTrends` hook, `margin-trends-normalizer`, `types/api.ts` — untouched (data-layer, forbidden).
- `MarginTrendChart` imported only by the time-period page (mocked there); no external DOM-class coupling.
- `e2e/margin-analytics.spec.ts` — untouched (not in owned surface).

## Gaps / review-questions

- None blocking. One semantic note (per spec, not a deviation): zero margin in the tooltip
  value uses `text-muted-foreground` while the zero SVG dot uses `chart-reference` — both are
  the established zero-idioms for their medium (text vs chart) and match the 168-series token map.
- **Carry-out (pass-2, outside owned surface → wave ledger)**: (1) 4 tooltip containers on
  `bg-white` (dark-mode defect class fixed here): `dashboard/ExpenseChartTooltip.tsx:29`,
  `PatternTooltip.tsx:54,72`, `StatusTooltip.tsx:47`; (2) `custom/MarginDisplay.tsx:72-90`
  legacy palette (`text-gray-600/green-600/red-600/gray-500/gray-400`).

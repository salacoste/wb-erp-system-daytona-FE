# Story 168.5 — Migrate Orders Analytics `/analytics/orders`

- **Status:** review (awaiting orchestrator commit/PR)
- **Branch / worktree:** `cdx/epic-168-story-5-orders-analytics` @ `/private/tmp/wb-fe-168-5-migrate-orders-analytics`
- **Base SHA:** `193ea5db`
- **Acceptance criterion:** Given the FBS Orders Analytics page (overview/trends/seasonality/comparison tabs) when migrated to shadcn semantic tokens then delta sign coloring, icon colors, tab structure, and Russian formatting (comma decimal, ∞ guard) remain correct — only presentation tokens change.

## Behavior-Lock Inventory (pre-flight)

Targeted baseline (all green, pre-edit):

- `npx vitest run "src/app/(dashboard)/analytics/orders"` → **82 passed / 0 failed** (2 files: page.test.tsx, ComparisonTable.test.tsx)

Locked (untouched semantics): `DeltaIndicator` sign rendering (+/− U+2212, ∞ for Infinity, comma decimal + NBSP `%`), `ComparisonTable` row set, `OverviewTab` SummaryCard grid + `OrdersCogsSummary` CogsMetricCard grid, `SeasonalityTab` InsightItems, page tab navigation, all Russian labels, mock structure in tests.

## Changes

| File | Change |
|---|---|
| `orders/components/ComparisonTable.tsx:41` | delta sign: `text-green-600` → `text-financial-positive`, `text-red-500` → `text-financial-negative` (168.4 deltaColorClass precedent). |
| `orders/components/OrdersCogsSummary.tsx:95,101,113` | icons: Выручка `text-green-600` → `text-financial-positive`; Себестоимость `text-blue-600` → `text-status-information`; Маржинальность `text-purple-600` → `text-primary` (168.3 KeyMetrics purple→primary precedent). Line 107 already `text-primary` — untouched. `CogsMetricCard` is a SHARED component (imported, not owned) — NOT edited; only icon classNames passed as props changed. |
| `orders/components/OverviewTab.tsx:107,114,121` | icons: DollarSign/Выручка → `text-financial-positive`; TrendingUp/Тренд → `text-status-information`; XCircle/Отмена → `text-financial-negative`. |
| `orders/components/SeasonalityTab.tsx:102,107,112` | icons: TrendingUp → `text-financial-positive`; TrendingDown → `text-financial-negative`; Calendar → `text-status-information`. |
| `orders/components/__tests__/ComparisonTable.test.tsx` | +3 pins: positive delta exact class, negative delta exact class (all four deltas negative — others default Infinity=positive), widened-regex legacy-palette DOM guard. |
| `orders/__tests__/page.test.tsx` | +2 pins in new describe block: OverviewTab three icon tokens via scoped `.text-financial-positive/-information/-negative` selectors (mocked Tabs render all tab contents); full-page legacy-palette DOM guard. |

**Forbidden files untouched:** page.tsx, loading.tsx (clean), shared components, all other routes.

## Token mapping table (old → new)

| Legacy | Semantic | Context |
|---|---|---|
| `text-green-600` | `text-financial-positive` | delta positive; Выручка icons (Cogs + Overview); Seasonality peak |
| `text-red-500` | `text-financial-negative` | delta negative; Отмены icon; Seasonality low |
| `text-blue-600` | `text-status-information` | Себестоимость icon; Средний заказ/день; Calendar |
| `text-purple-600` | `text-primary` | Маржинальность icon |

## Raw-palette sweep proof

Widened regex `(bg\|text\|border\|ring\|divide\|fill\|stroke\|outline)-(red\|yellow\|blue\|green\|gray\|rose\|amber\|emerald\|sky\|orange\|slate\|zinc\|neutral\|stone\|lime\|teal\|cyan\|indigo\|violet\|purple\|fuchsia\|pink)(-\d+)?` over `src/app/(dashboard)/analytics/orders/**` → **ZERO hits** after fixes (10 hits → 0; grep exit 1). page.tsx / loading.tsx were already clean.

## External consumers check

grep `analytics/orders` importers outside the route: only route-string references (`lib/routes.ts`, nav tests, layout test) and shared type/api modules — **no external component imports the orders route components**, no one pins the old classes.

## Gates (worktree, all green)

- Targeted vitest: **87 passed / 0 failed** (baseline 82 → 87; +5 pins)
- `npm run lint` → exit 0 (`--max-warnings 0`)
- `npm run type-check` → exit 0
- `npx prettier --check` on owned dirs → all pass (paren-glob form fails prettier's glob parser; directory invocation used)
- Full vitest / next build / e2e: intentionally NOT run (main session owns)

## Gaps / escalations

None. CogsMetricCard / SummaryCard are shared — only prop-passed icon classNames owned, as instructed.

## Lessons

_(placeholder — filled at review)_

## Change Log

- **2026-08-18 — implementation**: 10 token replacements across 4 components + 5 test pins (2 files). No other changes.

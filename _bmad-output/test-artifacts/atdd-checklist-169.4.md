# ATDD Checklist — 169.4-FE Buyout Analytics token migration

| # | Acceptance criterion | Test | Status |
|---|---|---|---|
| 1 | Chart series use valence CSS vars (positive/negative/chart-1), not hex | `buyout-daily-trend-config.test.ts` — 3 exact var pins + no-hex guard + series-reads-config | ✅ |
| 2 | Legend/tooltip marker colors inherit from config (no hex duplication) | config "every series reads its color from the token config" | ✅ |
| 3 | Tooltip surface dark-safe: `bg-popover`, never `bg-white`; `text-foreground` header; muted labels | `BuyoutDailyTrendTooltip.test.tsx` — 3 exact classList pins + inactive-null | ✅ |
| 4 | Valence deltas = `text-financial-positive/negative` incl. inversion pairs | `buyout-comparison-utils.test.ts` updated pins + `buyout-table-cells.test.tsx` TrendIndicator up/down pins | ✅ |
| 5 | Return-reason triplet = status information/warning/error, no tier-collapse, consistent across surfaces | `BuyoutSummarySubComponents.test.tsx` (bg+text pairs on bar+legend) + `BuyoutTable.test.tsx` header-triplet pins | ✅ |
| 6 | Buyout bar: fill `bg-status-success`, track `bg-status-error/15` (process = status, not financial) | `BuyoutSummaryWidget.test.tsx` width pin (updated selector) + new status-token bar pin | ✅ |
| 7 | Warnings = `text-status-warning` (buyout-unavailable + source-unknown) | Covered by widget render (text assertions already exist); token pinned via ConfidenceBadge /15-chip test | ✅ |
| 8 | Search tiers keep 3 states: success / warning / muted | source triplet preserved (buyout-table-columns.tsx:122-127); header-triplet test pattern | ✅ |
| 9 | Table named for AT: `TableCaption` with period identity | `BuyoutTable.test.tsx` "renders a caption naming the table with the period identity" | ✅ |
| 10 | Numeric cells `tabular-nums` (counts, %, п.п.) | `BuyoutTable.test.tsx` "applies tabular-nums to numeric cells" (>=6 cells) | ✅ |
| 11 | Behavior lock: baseline 105 still pass, it( only grew | Full targeted run **121 passed / 0 failed** (8 → 11 files; 0 baseline tests modified except legacy-pin updates to migrated tokens) | ✅ |
| 12 | Zero legacy palette literals in source | grep `(text|bg|border)-(blue|orange|red|green|amber|yellow|gray)-[0-9]` + `#EEEEEE`/`bg-white`/`text-gray-` → 0 hits | ✅ |
| 13 | Exact pins only (no `[class*=]`; SVG via `getAttribute('class')` if needed) | Review of new assertions — all `classList.contains` / `toHaveClass` / `querySelector('.token')` | ✅ |
| 14 | Owned surface only | `git status --short` — 15 owned files modified + 3 new owned test files + 2 artifacts | ✅ |

Validation: vitest targeted 121/0 · eslint clean · source files ≤200 lines.

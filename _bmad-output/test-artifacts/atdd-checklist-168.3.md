# ATDD Checklist — Story 168.3 (Migrate Analytical Dashboard /analytics/dashboard)

Acceptance criterion: Given complete, partial, pending, or failed sections when migrated to shadcn semantic tokens then metrics, periods, availability, top rankings, P&L, navigation, and recovery remain correct and one failed section does not hide valid evidence — only presentation tokens change.

| # | Invariant | Evidence | Result |
|---|---|---|---|
| 1 | PnLRow positive value → `text-financial-positive` | `pnl-waterfall/__tests__/semantic-tokens.test.tsx` (new) | PASS |
| 2 | PnLRow negative value → `text-financial-negative` | same file (new) | PASS |
| 3 | PnLRow total row → `bg-muted` + `border-border` | same file (new) | PASS |
| 4 | No legacy palette in PnLRow DOM (total/subtotal/highlights/tooltip) | legacy-palette regex guard, same file | PASS |
| 5 | KeyMetrics ROI card → `bg-status-information/10` + `text-status-information` | same file (exact classList.contains) | PASS |
| 6 | No legacy palette in KeyMetrics DOM (ROI + profit/unit + units + dormant cards) | regex guard, same file | PASS |
| 7 | GrossProfit COGS-coverage warning → `bg-status-warning/10` + `text-status-warning` | same file | PASS |
| 8 | No legacy palette in TopProductsTable DOM | guard appended to `__tests__/TopProductsTable.test.tsx` | PASS |
| 9 | No legacy palette in TopBrandsTable DOM | guard appended to `__tests__/TopBrandsTable.test.tsx` | PASS |
| 10 | Top tables profit/margin coloring semantic (pos→financial-positive, neg→financial-negative, ≥30% margin→financial-positive) | 3 pins per table flipped from `text-green-600`/`text-red-600` | PASS |
| 11 | h1 'Сводка по кабинету' present in all 3 branches, `text-foreground` | pre-existing page tests green; page.tsx diff tokens-only | PASS |
| 12 | P&L calculations/formatting unchanged (`usePnLCalculations`, `pnl-formatters`, zero-margin semantics) | files untouched; zeroMargin + pnl-calculations tests green | PASS |
| 13 | Russian labels/section titles/formulas/tooltips/testids/section order unchanged | no string changes in diff; all pre-existing tests green | PASS |
| 14 | Margin tone 4-tier preserved (≥30→financial-positive / ≥15→status-warning / ≥0→status-warning/80 / <0→financial-negative; post-pass-1 fix — no tier collapse) | local `getMarginColor` in owned rows; new pins: 20%→status-warning, 5%→status-warning/80, null→muted | PASS |
| 15 | Shared `top-table-utils.getMarginColor` NOT edited (172.1's surface) | file untouched in diff | PASS |
| 16 | Period selector / month-coverage notice / Suspense-loading structure unchanged | `page.tsx` token-only diff; coverage tests green | PASS |

Gaps: no e2e additions (main session owns e2e); no prior render coverage existed for PnLRow/KeyMetrics/GrossProfit sections — new `semantic-tokens.test.tsx` created; purple units-card mapped to `primary` (no purple status token) per plan instruction.

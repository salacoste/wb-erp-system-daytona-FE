# ATDD Checklist — Story 168.10 (Time-Period Analytics /analytics/time-period migration)

| # | Invariant | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Dot color pos → exact `var(--color-chart-positive)` (var name pinned, not RGB — 168.1 precedent) | margin-trend-utils.test getMarginDotColor exact-string pins | PASS |
| 2 | Dot color neg → exact `var(--color-chart-negative)` | margin-trend-utils.test getMarginDotColor exact-string pins | PASS |
| 3 | Dot color zero → exact `var(--color-chart-reference)` — 3 visual states preserved (NOT tier-collapse) | margin-trend-utils.test getMarginDotColor(0) pin | PASS |
| 4 | Tooltip margin value pos/neg/zero → exact `text-financial-positive` / `text-financial-negative` / `text-muted-foreground` | MarginTrendChart.test direct render of MarginTrendTooltip (recharts does not render Tooltip content in jsdom); span.font-medium next to «Маржа:» label, classList.contains exact | PASS |
| 5 | Tooltip container → exact `bg-popover` (dark-mode fix) | MarginTrendChart.test container.firstElementChild classList.contains('bg-popover') | PASS |
| 6 | Missing-COGS warning → exact `text-status-warning` (data-completeness semantics) | MarginTrendChart.test getByText(/Нет COGS/) classList.contains | PASS |
| 7 | Summary max margin → exact `text-financial-positive` on value `<p>` | MarginTrendChart.test getByText(/35/).closest('p') classList.contains | PASS |
| 8 | Summary min margin → exact `text-financial-negative` on value `<p>` | MarginTrendChart.test getByText(/-5/).closest('p') classList.contains | PASS |
| 9 | Summary avg margin stays uncolored (no new semantics introduced) | visual inspection — only className strings changed, avg `<p>` untouched | PASS |
| 10 | Help-card legend «Зелёные точки» → exact `text-financial-positive`, «Красные точки» → exact `text-financial-negative`; words unchanged (color+word WCAG redundancy kept); «Серые точки» muted-foreground already token | page.test.tsx classList.contains exact pins | PASS |
| 11 | Chart hex sites: grid → `var(--color-border)`, zero ReferenceLine → `var(--color-chart-reference)`, Line → `var(--color-chart-1)` | source pins (SVG attrs, var() valid — SearchPerformanceWidget.tsx:102 precedent 168.1) | PASS |
| 12 | Behavior-lock: labels, formatters, hook calls, props, recharts config (dot radii, strokeWidth, dasharray) — untouched | 69 baseline tests untouched + green; only className/stroke-string literals changed | PASS |
| 13 | Owned surface only: 20 legacy palette sites + 6 chart-hex sites across 5 prod files (pass-1 recount) | git status = 5 prod + 3 test files, all in owned surface; widened sweep → 0 hits | PASS |
| 14 | No `as any` in new test code; typed fixture (`MarginTrendPoint`) | tsc --noEmit exit 0; eslint --max-warnings 0 exit 0 | PASS |

Targeted gates: vitest 69→76 passed / 0 failed · eslint 0 · tsc 0 · prettier pass. Full vitest/build/e2e — main-session owned.

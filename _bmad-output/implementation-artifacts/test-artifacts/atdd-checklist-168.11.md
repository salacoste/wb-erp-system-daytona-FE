# ATDD Checklist — Story 168.11 (Unit Economics migration + profitability consolidation)

| # | Invariant | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Row margin >=20 → exact `text-financial-positive`; <10 → `text-financial-negative`; 10-20/null → muted (never colored) | UnitEconomicsTableRow.test token describe (3 its) | PASS |
| 2 | Row profitability Badge = single /15-chip set (`bg-X/15 text-X`), no inline style-color | UnitEconomicsTableRow.test it.each ×3 + style-null pin | PASS |
| 3 | sku `PROFITABILITY_COLORS` — all 6 statuses exact /15-chip strings (unknown = `bg-muted text-muted-foreground`) | types/__tests__/sku-financials-profitability-tokens.test it.each | PASS |
| 4 | sku `PROFITABILITY_HEX` — all 6 statuses exact `var(--color-…)` names; no raw hex in either map | same test file + no-hex guard | PASS |
| 5 | lib sentinel (enum-drift) → `var(--color-muted-foreground)`, `bg-muted text-muted-foreground` | unit-economics-config.test updated exact pins | PASS |
| 6 | `bgColor` field gone from `ProfitabilityStatusConfig` (interface + configs; no consumers) | tsc --noEmit exit 0 after field deletion; grep 0 consumers | PASS |
| 7 | CostCell 3-tier: >high → `text-status-error font-medium`; med<x<=high → `text-status-warning`; null/<=med → muted | unit-economics-table-utils.test updated selectors | PASS |
| 8 | MarginIndicator up/down → `financial-positive/negative`; null neutral | unit-economics-table-utils.test | PASS |
| 9 | Sort icon active → `text-status-information` (168.9 precedent); inactive muted | unit-economics-table-utils.test 3 its | PASS |
| 10 | SummaryCards margin value 3 states (pos/neg/neutral→`text-foreground`) + boundaries 20/10 | UnitEconomicsSummaryCards.test updated pins | PASS |
| 11 | SummaryCards 8 icon chips exact semantic tokens (primary/information/warning/information/information/positive/success/error) | UnitEconomicsSummaryCards.test NEW it.each ×8 | PASS |
| 12 | Empty info-box → `bg-status-information/10` surface + `text-status-information` heading + muted hints | NEW UnitEconomicsEmpty.test (3 its + negative legacy asserts) | PASS |
| 13 | Waterfall: profit → exact `var(--color-chart-positive)`, loss → exact `var(--color-chart-negative)` | NEW waterfall-chart-config.test | PASS |
| 14 | Waterfall categorical hex NOT collapsed (≥1 old hex remains; sign tokens collide with nothing) | NEW waterfall-chart-config.test anti-collapse guard | PASS |
| 15 | `transformToWaterfallData`: revenue + profit-pos → `var(--color-chart-positive)`, profit-neg → `var(--color-chart-negative)` | unit-economics-utils.test updated exact pins | PASS |
| 16 | Axes `var(--color-border)` ×2, ReferenceLine `var(--color-chart-reference)` | source pins (SVG attrs, var() valid — 168.10 idiom) | PASS |
| 17 | Behavior-lock: thresholds (20/10, high/med), formatters, query-keys, pagination/sort/export logic, Russian texts untouched | 631 baseline tests untouched + green; only color literals changed | PASS |
| 18 | Owned surface only; final widened sweep 0 legacy hits (hex exceptions enumerated) | record §sweep; git status = owned files only | PASS |

Targeted gates: vitest 631→665 passed / 0 failed · eslint 0 · tsc 0 · prettier pass. Full vitest/build/e2e — main-session owned.

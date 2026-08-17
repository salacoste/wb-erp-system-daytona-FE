# ATDD Checklist — Story 168.6 (Pricing Analytics migration)

| # | Invariant | Evidence | Result |
|---|-----------|----------|--------|
| 1 | MarginCell ≥15 → exact `text-financial-positive` | PricingTable.test `MarginCell pins financial-positive…` classList.contains exact | PASS |
| 2 | MarginCell [0,15) → exact `text-status-warning/80` (3-tier preserved, no tier-collapse) | PricingTable.test `MarginCell pins status-warning/80…` + negative contains for both financial tokens | PASS |
| 3 | MarginCell <0 → exact `text-financial-negative` | PricingTable.test `MarginCell pins financial-negative…` | PASS |
| 4 | MarginCell thresholds remain 15/0 (NOT 30/15/0) | Production ternary unchanged thresholds; pin values 20/10/−5 straddle tiers | PASS |
| 5 | GapCell gap≥0 → exact `text-financial-positive` (+ sign semantics) | PricingTable.test `GapCell pins financial-positive…` | PASS |
| 6 | GapCell gap<0 → exact `text-financial-negative` | PricingTable.test `GapCell pins financial-negative…` | PASS |
| 7 | «Ниже цели» card value → exact `text-financial-negative`, no `text-red-600` | PricingSummaryCards.test pin via title→sibling value element | PASS |
| 8 | «Выше цели» card value → exact `text-financial-positive`, no `text-green-600` | PricingSummaryCards.test pin | PASS |
| 9 | No legacy palette classes in pricing-table row markup (shared PriceBasisBadge excluded — out of scope) | PricingTable.test scoped DOM guard (tbody spans/tds, `[aria-label]` badge subtree excluded) | PASS |
| 10 | No legacy palette classes in summary-cards DOM | PricingSummaryCards.test container.innerHTML guard | PASS |
| 11 | Behavior-lock: signs, ru-RU locale, formatCurrency/formatPercentage, BD-37 null-gap, SPP-1.7 badge — untouched | 76 baseline tests untouched + all green (85/0 total); only className strings changed in production | PASS |
| 12 | Shared files/types/api/algorithms untouched; no external consumers break | git diff = 2 prod + 2 test files inside surface; importers grep → 0 outside route | PASS |

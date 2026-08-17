# ATDD Checklist — Story 168.5 (Migrate Orders Analytics /analytics/orders)

Acceptance criterion: Given the FBS Orders Analytics page when migrated to shadcn semantic tokens then delta sign coloring, icon colors, tab structure, and Russian formatting remain correct — only presentation tokens change.

| # | Invariant | Evidence | Result |
|---|---|---|---|
| 1 | positive delta → exact `text-financial-positive` class | `components/__tests__/ComparisonTable.test.tsx` new pin | PASS |
| 2 | negative delta → exact `text-financial-negative` class | same file new pin (all 4 deltas made negative; others default Infinity=positive) | PASS |
| 3 | ComparisonTable renders zero legacy palette classes | same file widened-regex DOM guard | PASS |
| 4 | OverviewTab icons: Выручка `text-financial-positive`, Средний заказ/день `text-status-information`, Отмены `text-financial-negative` | `__tests__/page.test.tsx` scoped selectors on `tab-content-overview` | PASS |
| 5 | Full page render contains zero legacy palette classes | `__tests__/page.test.tsx` widened-regex DOM guard | PASS |
| 6 | Δ semantics unchanged (∞ guard, U+2212 minus, comma decimal, NBSP %) | pre-existing Infinity/locale tests green, ComparisonTable.tsx diff token-only | PASS |
| 7 | OrdersCogsSummary icons: green→financial-positive, blue→status-information, purple→primary; Валовая прибыль stays `text-primary` | source diff; covered transitively by page DOM guard (mocked Tabs render all contents) | PASS |
| 8 | SeasonalityTab icons: green→financial-positive, red→financial-negative, blue→status-information | source diff; covered transitively by page DOM guard | PASS |
| 9 | Shared components (CogsMetricCard, SummaryCard) untouched | no edits outside owned route; only prop-passed icon classNames changed | PASS |
| 10 | Zero legacy palette in owned src tree | widened-regex grep → 0 hits (proof in impl record) | PASS |
| 11 | No external consumer pins old classes | grep importers of `analytics/orders` components → none outside route | PASS |
| 12 | Behavior-lock: baseline 82 → 87 passed, 0 failed (only +5 new pins) | targeted vitest gate | PASS |

Gaps: no e2e additions (main session owns e2e); OverviewTab/SeasonalityTab token pins are page-level (shared render through mocked Tabs) rather than per-component render tests — existing tests extend rather than create, per story instruction.

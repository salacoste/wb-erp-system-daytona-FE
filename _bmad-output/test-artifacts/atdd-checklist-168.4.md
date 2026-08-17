# ATDD Checklist — Story 168.4 (Migrate Finance History /analytics/finance-history)

Acceptance criterion: Given the multi-week P&L grid when migrated to shadcn semantic tokens then WoW delta coloring (incl. isNegativeMetric inversion), formatting, and page structure remain correct — only presentation tokens change.

| # | Invariant | Evidence | Result |
|---|---|---|---|
| 1 | up + normal metric → `text-financial-positive` | `__tests__/finance-history-delta.test.ts` pin flipped | PASS |
| 2 | up + negative metric → `text-financial-negative` (inversion preserved) | same file pin flipped, name notes inversion | PASS |
| 3 | down + normal metric → `text-financial-negative` | same file pin flipped | PASS |
| 4 | down + negative metric → `text-financial-positive` (inversion preserved) | same file pin flipped, name notes inversion | PASS |
| 5 | same tone → `text-muted-foreground` regardless of isNegativeMetric | pre-existing pin (unchanged) | PASS |
| 6 | `computeWowDelta` semantics unchanged (currency % / percent п.п. / null oldest-column / previous=0 null) | pre-existing tests green, file untouched except color line | PASS |
| 7 | Zero legacy palette in owned src tree | widened-regex grep → 0 hits (proof in impl record) | PASS |
| 8 | h1 'Финансовый отчёт: история' gains `text-foreground` (cross-route consistency) | page.tsx diff tokens-only | PASS |
| 9 | Table/Cell already semantic (hover/muted/border tokens) — untouched | visual pass, no diff | PASS |
| 10 | Page data flow / period selector / Alert copy unchanged | page.tsx token-only diff; pre-existing tests green | PASS |

Gaps: no e2e additions (main session owns e2e); no DOM legacy guard (pure .ts helper — unit pins are the guard per story instruction).

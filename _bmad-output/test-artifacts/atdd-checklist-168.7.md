# ATDD Checklist — Story 168.7 (Product Analytics /analytics/product/[nmId] migration)

| # | Invariant | Evidence | Result |
|---|-----------|----------|--------|
| 1 | iroasLabel `highly_effective` → exact `text-financial-positive` (full, NOT /80) | OrganicTab.test classList.contains exact + negative contains for `/80` | PASS |
| 2 | iroasLabel `effective` → exact `text-financial-positive/80` (weaker intensity — 4-tier preserved, no tier-collapse) | OrganicTab.test classList.contains exact + negative contains for full token | PASS |
| 3 | iroasLabel `marginal` → exact `text-status-warning` (full, sole warning tier) | OrganicTab.test classList.contains exact + negative contains for `/80` | PASS |
| 4 | iroasLabel `ineffective` → exact `text-financial-negative` | OrganicTab.test classList.contains exact | PASS |
| 5 | confidence `high` → exact `text-status-information` (data-quality, not financial-green) | OrganicTab.test row→td:last-child span pin | PASS |
| 6 | confidence `medium` → exact `text-status-warning` | OrganicTab.test row→td:last-child span pin | PASS |
| 7 | confidence `low` → exact `text-muted-foreground` (fallback untouched) | OrganicTab.test row→td:last-child span pin | PASS |
| 8 | No legacy palette classes in OrganicTab DOM output | OrganicTab.test container.innerHTML widened-regex guard (null match) | PASS |
| 9 | Behavior-lock: Russian labels, map-fallback semantics, table structure, empty state, chart delegation — untouched | 31 baseline tests untouched + all green (39/0 total); only className strings + comments changed in production | PASS |
| 10 | Owned surface only: 6 sites all in OrganicTab.tsx; no other component/routes/shared files touched | git status = 1 prod file modified + 1 NEW test file inside surface; sweep grep → 0 raw-palette hits in surface prod files | PASS |
| 11 | External consumers unaffected | importers grep for OrganicTab/components outside route → 0 | PASS |
| 12 | Test fixtures typed from `@/types/unified-product` (CorrelationDayItem, IncrementalRoasData) — no `as any` | tsc --noEmit exit 0; eslint --max-warnings 0 exit 0 | PASS |

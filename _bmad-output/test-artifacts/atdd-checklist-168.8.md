# ATDD Checklist — Story 168.8 (Reorder Analytics /analytics/reorder migration)

| # | Invariant | Evidence | Result |
|---|-----------|----------|--------|
| 1 | `pending` badge → exact `bg-status-warning/15` + `text-status-warning` | ReorderTable.test classList.contains exact pins (badge = getByText('Ожидает'), label is direct text child of Badge div) | PASS |
| 2 | `ordered` badge → exact `bg-status-information/15` + `text-status-information` | ReorderTable.test classList.contains exact pins | PASS |
| 3 | `received` badge → exact `bg-status-success/15` + `text-status-success` | ReorderTable.test classList.contains exact pins | PASS |
| 4 | `expired` badge stays `bg-muted text-muted-foreground` (untouched by 168.8, no status tint) | ReorderTable.test positive + negative classList.contains pins | PASS |
| 5 | «Ожидают» card icon svg → exact `text-status-warning` | ReorderSummaryCards.test label→closest card→svg classList.contains | PASS |
| 6 | «Заказано» card icon svg → exact `text-status-information` | same selector path | PASS |
| 7 | «Получено» card icon svg → exact `text-status-success` (semantic success, NOT financial-positive) | same selector path | PASS |
| 8 | «Покрытие» card icon svg → exact `text-status-error` (risk metric, NOT financial-negative) | same selector path | PASS |
| 9 | No legacy palette classes in ReorderTable DOM output | ReorderTable.test container.innerHTML widened-regex guard (null match) | PASS |
| 10 | No legacy palette classes in ReorderSummaryCards DOM output | ReorderSummaryCards.test container.innerHTML widened-regex guard (null match) | PASS |
| 11 | Behavior-lock: labels, Badge variant="outline", MetricCard layout, skeleton/empty/table structure, action buttons, formatting — untouched | 61 baseline tests untouched + all green (71/0 total); only className strings + comments changed in production | PASS |
| 12 | Owned surface only: 7 sites in 2 files; no other components/routes/shared files touched | git status = 2 prod + 2 test files, all inside `analytics/reorder`; raw-palette sweep → 0 hits in surface | PASS |
| 13 | External consumers unaffected | importers grep for ReorderSummaryCards/ReorderTable outside route → 0 | PASS |
| 14 | Test fixtures typed (`ReorderRecommendation` / inline metrics object) — no `as any` | tsc --noEmit exit 0; eslint --max-warnings 0 exit 0 | PASS |

Targeted gates: vitest 71/0 · lint 0 warnings · tsc 0 · prettier pass. Full vitest/build/e2e — main-session owned.

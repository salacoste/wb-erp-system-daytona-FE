# Story 91.1-FE: Remove totalRevenue from Search Analytics

Status: done

## Story

**As a** user of Search Analytics who sorts or filters by revenue,
**I want** the frontend to stop referencing the removed `totalRevenue` field,
**so that** search endpoints don't return errors when I use the Search Analytics page.

**Epic**: 91-FE Backend Contract Updates (Epics 89-93 Integration)
**Priority**: P1 (BREAKING — backend already removed the field; users may see errors NOW)
**Estimate**: 3 story points

---

## Problem Statement

Backend Epics 89-93 (2026-04-19) removed `totalRevenue` from all 3 search endpoints because the WB Search Analytics API never returned real revenue data — the field was always 0. Backend also removed `totalRevenue` from valid `orderBy` values.

**If a user visits Search Analytics and the frontend sends `orderBy=totalRevenue`, the backend returns a validation error.** This is a live production issue.

### Scope of removal

| File | Line(s) | What to remove |
|---|---|---|
| `src/types/search-analytics.ts` | 20 | `'totalRevenue'` from `SearchOrderBy` union |
| `src/types/search-analytics.ts` | 49 | `totalRevenue: number` from `SearchQueryItem` |
| `src/types/search-analytics.ts` | 77 | `totalRevenue: number` from `SearchProductItem` |
| `src/types/search-analytics.ts` | 100 | `totalRevenue: number` from `SearchOrderItem` |
| `src/types/search-analytics.ts` | 111 | `totalSearchRevenue: number` from `SearchOrdersSummary` |
| `SearchByProductTable.tsx` | 30, 54, 82 | Remove `'totalRevenue'` from SortField, COLUMNS array, and sort case |
| `SearchByQueryTable.tsx` | 30, 62, 90 | Same pattern |
| `SearchOrdersTable.tsx` | 24, 70-74, 95 | Remove from SortField, sort header, sort button, and table cell |
| `SearchOrdersTab.tsx` | 98 | Remove `totalSearchRevenue` from summary display |

### What's NOT being removed
- `totalOrders`, `totalImpressions`, `totalClicks`, `avgCtr`, `avgPosition` — all remain.
- The "Выручка ₽" column simply disappears from the 3 search tables.
- Default sort should fall back to `totalOrders` if the current default was `totalRevenue`.

---

## Acceptance Criteria

### AC-1: Remove types
- [ ] Remove `'totalRevenue'` from `SearchOrderBy` union type.
- [ ] Remove `totalRevenue: number` from `SearchQueryItem`, `SearchProductItem`, `SearchOrderItem`.
- [ ] Remove `totalSearchRevenue: number` from `SearchOrdersSummary`.
- [ ] `npm run type-check` surfaces all downstream consumers — fix each.

### AC-2: Remove UI columns + sort
- [ ] `SearchByProductTable.tsx` — remove "Выручка ₽" column from COLUMNS array, remove `'totalRevenue'` from SortField type, remove sort case.
- [ ] `SearchByQueryTable.tsx` — same.
- [ ] `SearchOrdersTable.tsx` — remove from SortField, remove sort header/button for revenue, remove `<TableCell>` that displayed `item.totalRevenue`.
- [ ] `SearchOrdersTab.tsx` — remove `totalSearchRevenue` from summary card display.

### AC-3: Default sort fallback
- [ ] If any component defaults to `orderBy: 'totalRevenue'`, change to `orderBy: 'totalOrders'`.
- [ ] Verify no hook or API call passes `totalRevenue` as a sort parameter.

### AC-4: Tests
- [ ] Existing search analytics tests pass (may need type updates if they reference `totalRevenue` in mock data).
- [ ] `npm run type-check && npm run lint` clean.
- [ ] `npm test -- --run` — 6789+ tests pass, zero regressions.

---

## Tasks / Subtasks

### Task 1: Remove types (AC-1)
- [ ] 1.1: Edit `src/types/search-analytics.ts` — remove all 5 field references.
- [ ] 1.2: Run `npm run type-check` to find all downstream breakage.

### Task 2: Fix UI components (AC-2)
- [ ] 2.1: Fix `SearchByProductTable.tsx` — remove column + SortField + sort case.
- [ ] 2.2: Fix `SearchByQueryTable.tsx` — same.
- [ ] 2.3: Fix `SearchOrdersTable.tsx` — remove column + SortField + sort header + cell.
- [ ] 2.4: Fix `SearchOrdersTab.tsx` — remove summary revenue display.

### Task 3: Default sort fallback (AC-3)
- [ ] 3.1: Grep `orderBy.*totalRevenue` across src/ — replace with `totalOrders`.
- [ ] 3.2: Verify hooks don't default to totalRevenue.

### Task 4: Test cleanup (AC-4)
- [ ] 4.1: Update any test mocks that include `totalRevenue` in search response fixtures.
- [ ] 4.2: `npm run type-check && npm run lint && npm test -- --run` — all green.

---

## Dev Notes

### This is a pure deletion story

No new code. Only removing references to a field that backend no longer sends. The cleanest type of change — every edit is a line removal or type-narrowing.

### Default sort

From the grep: hooks don't reference `totalRevenue` as a default. The sort state is local to each table component (useState). The initial sort field in each component should be checked — if it's `'totalRevenue'`, change to `'totalOrders'`.

### File-size impact

All files get SMALLER (removing columns/types). No risk of approaching 200-line limit.

### Backlog ref

Backlog task-10 tracks this. Mark as Done when story completes.

---

## References

- `docs/request-backend/166-ACQUIRING-COST-REPORTS-API.md` — context on backend changes
- Backlog doc-2 (Backend Epics 89-93 Full Changelog) — section 5: totalRevenue removal
- Backlog task-10 — original tracking task
- `src/types/search-analytics.ts` — primary type file
- `e2e/analytics/search-analytics.spec.ts` — may need fixture updates

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

### File List

### Change Log

| Date | Change |
|---|---|
| 2026-04-20 | Story created. P1 breaking change — backend already removed totalRevenue from search endpoints. Pure deletion: 5 type removals + 4 UI component cleanups + test fixture updates. |

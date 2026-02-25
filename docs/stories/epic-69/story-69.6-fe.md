# Story 69.6-FE: Data Source UX & Edge Cases

| Field | Value |
|-------|-------|
| Epic | 69-FE Buyout Analytics |
| Priority | P3 |
| SP | 3 |
| Status | ✅ Complete |

## Description

Как пользователь, я хочу корректное отображение данных из разных источников и понятные состояния при отсутствии данных.

## Acceptance Criteria

- AC1: `buyoutRatePct: null` (no sales) displays as "—", not 0%
- AC2: `returnBreakdown: null` shows "—" in all three reason columns
- AC3: Return breakdown (FBS realtime) shown separately from financial returns (weekly report)
- AC4: No misleading message when breakdown contradicts buyout rate (Request #154)
- AC5: Return reason tooltips: "Финансовые возвраты по отчёту WB (FBO+FBS)" on Возвраты column
- AC6: Return reason header tooltips: "По статусам FBS-заказов" on breakdown columns
- AC7: `returnsCount > salesCount` capped at 0% (anomaly state handled)

## Related Issues
- Request #154: Data source mismatch between weekly report and FBS statuses — backend fix pending

## Files

| File | Action | Lines |
|------|--------|-------|
| `src/app/(dashboard)/analytics/buyout/components/BuyoutTable.tsx` | Part of 69.4 | — |
| `src/app/(dashboard)/analytics/buyout/components/BuyoutSummaryWidget.tsx` | Part of 69.3 | — |

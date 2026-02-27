# Story 70.1-FE: Fix summary_total vs summary_rus Fallback

| Field | Value |
|-------|-------|
| Epic | 70-FE Validation Fixes |
| Priority | P1 |
| SP | 3 |
| Status | 📋 Ready for Dev |
| Group | A (D-1, D-2, D-4) |

## Description

Как финансовый аналитик, я хочу видеть корректные данные из одного источника (RUS или Total),
чтобы показатели Dashboard и Analytics были согласованы и не вводили в заблуждение.

## Problem

Frontend использует паттерн fallback `summary_rus?.field ?? summary_total?.field_total`,
из-за чего при null/0 в `summary_rus` берётся значение из `summary_total` (RUS+EAEU).
Результат: на одном экране часть метрик из RUS-only, часть из RUS+EAEU.

### Affected Metrics (W08)

| Metric | Screen (summary_total) | API summary_rus | Diff | D-ID |
|--------|----------------------|-----------------|------|------|
| Продажи gross | 194,314₽ | 180,202₽ | +14,112₽ | D-4 |
| К перечислению | 75,950₽ | 68,127₽ | +7,823₽ | D-2 |
| Логистика | 26,065₽ | 24,349₽ | +1,716₽ | D-1 |

## Root Cause

**File**: `src/app/(dashboard)/dashboard/components/DashboardContent.tsx`

```typescript
// Line ~145-170: fallback pattern
payoutTotal={s?.payout_total ?? st?.payout_total}
logisticsCost={s?.logistics_cost ?? st?.logistics_cost_total}
salesGross={s?.sales_gross ?? st?.sales_gross_total}
```

Where `s = summary_rus`, `st = summary_total`. When `s.field` is null/undefined/0,
falls back to `st.field_total` (includes EAEU).

Same pattern in `FinancialSummaryTable.tsx` and multi-week aggregation.

## Acceptance Criteria

- AC1: Dashboard использует ОДИН consistent source (summary_total ИЛИ summary_rus, не mix)
- AC2: Если выбран summary_total — все метрики из summary_total
- AC3: Если выбран summary_rus — все метрики из summary_rus, fallback на 0 (не на total)
- AC4: Multi-week aggregation (`useMultiWeekFinancialSummary`) использует тот же source
- AC5: FinancialSummaryTable получает данные из того же source
- AC6: Все existing unit тесты проходят
- AC7: Добавлен тест проверяющий что при наличии summary_total и summary_rus нет mixing

## Approach

### Option A: Always use summary_total (Recommended)
Summary_total — consolidated view, включает все регионы. Это то что WB реально перечисляет.

```typescript
// Replace scattered fallbacks with single source selection:
const summary = financialComparison.current?.summary_total
  ?? financialComparison.current?.summary_rus
  ?? null
```

### Option B: Always use summary_rus (RUS-only)
Если бизнес-требование — показывать только RUS без EAEU.

```typescript
const summary = financialComparison.current?.summary_rus ?? null
// Never fallback to summary_total
```

## Files to Modify

| File | Change | Lines |
|------|--------|-------|
| `src/app/(dashboard)/dashboard/components/DashboardContent.tsx` | Unify source selection | ~145-200 |
| `src/components/custom/FinancialSummaryTable.tsx` | Same pattern fix | ~290-320 |
| `src/hooks-v1/financial/hooks.ts` | Multi-week source selection | ~307-313 |
| `src/hooks-v1/financial/aggregation.ts` | Verify aggregation uses same source | ~45-70 |

## Test Plan

- Unit: mock finance-summary response with both summary_rus and summary_total
- Verify: all displayed metrics come from ONE source
- Regression: existing Dashboard/Analytics tests pass

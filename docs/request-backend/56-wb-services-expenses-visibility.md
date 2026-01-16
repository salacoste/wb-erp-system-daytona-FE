# Request #56: WB Services Expenses Visibility (Реклама, Джем, Прочие сервисы)

**Date**: 2025-12-13
**Status**: ANALYZED → READY FOR IMPLEMENTATION
**Priority**: Medium
**Related**: Request #51 (wb_commission_adj), Technical Debt (commission-separation.md)
**Architecture**: See `docs/architecture/adjustment-categorization-system.md` for flexible design

---

## Problem Statement

Расходы на рекламу (WB.Promotion), подписку Джем и прочие сервисы WB **существуют в базе данных**, но **НЕ ВИДНЫ** в UI финансовой аналитики - скрыты в общей сумме `other_adjustments_net`.

---

## ✅ Data Analysis Complete (2025-12-13)

### Где хранятся данные

**Поле**: `corrections` (НЕ `commission_other`!)
**Фильтр**: `reason = 'Удержание'`
**Классификация**: По полю `payload_json->>'bonus_type_name'`

### Обнаруженные категории

| Категория | bonus_type_name Pattern | Записей | Сумма |
|-----------|-------------------------|---------|-------|
| **WB.Promotion** | `LIKE '%Продвижен%'` | 18 | **800,226₽** |
| **Джем** | `LIKE '%Джем%'` | 4 | **72,162₽** |
| **Утилизация** | `LIKE '%утилизац%'` | 3 | 2,244₽ |
| Минимальный платеж | `= 'Остаток по минимальному платежу'` | 4 | 4,008₽ (в commission_other → wb_commission_adj ✅) |

### Пример недели W49:

```
other_adjustments_net = 51,063₽ (показывается в API)
├── WB.Promotion:      32,073₽  ← СКРЫТО
├── Джем:              18,990₽  ← СКРЫТО
└── (итого сервисы:    51,063₽)

wb_commission_adj = 2,153₽ (Минимальный платеж) ← ВИДНО ✅
```

---

## SQL Queries for Implementation

### 1. Новые поля в агрегации

```sql
-- WB Services Cost (total)
SUM(CASE
  WHEN reason = 'Удержание'
    AND (
      payload_json->>'bonus_type_name' LIKE '%Продвижен%'
      OR payload_json->>'bonus_type_name' LIKE '%Джем%'
      OR payload_json->>'bonus_type_name' LIKE '%утилизац%'
    )
  THEN ABS(corrections)
  ELSE 0
END) as wb_services_cost,

-- Breakdown: WB.Promotion only
SUM(CASE
  WHEN reason = 'Удержание'
    AND payload_json->>'bonus_type_name' LIKE '%Продвижен%'
  THEN ABS(corrections)
  ELSE 0
END) as wb_promotion_cost,

-- Breakdown: Джем subscription only
SUM(CASE
  WHEN reason = 'Удержание'
    AND payload_json->>'bonus_type_name' LIKE '%Джем%'
  THEN ABS(corrections)
  ELSE 0
END) as wb_jam_cost,

-- Breakdown: Other services (утилизация, etc.)
SUM(CASE
  WHEN reason = 'Удержание'
    AND payload_json->>'bonus_type_name' NOT LIKE '%Продвижен%'
    AND payload_json->>'bonus_type_name' NOT LIKE '%Джем%'
    AND payload_json->>'bonus_type_name' NOT LIKE '%минимальн%'
    AND corrections != 0
  THEN ABS(corrections)
  ELSE 0
END) as wb_other_services_cost
```

### 2. Проверочный запрос

```sql
-- Verify totals match current other_adjustments_net
SELECT
  week,
  other_adjustments_net,
  wb_services_cost_new,
  other_adjustments_net - wb_services_cost_new as remaining
FROM (
  SELECT
    SUBSTRING(report_id FROM '([0-9]{4}-W[0-9]{2})') as week,
    SUM(corrections + other_adjustments) as other_adjustments_net,
    SUM(CASE
      WHEN reason = 'Удержание'
        AND (payload_json->>'bonus_type_name' LIKE '%Продвижен%'
          OR payload_json->>'bonus_type_name' LIKE '%Джем%'
          OR payload_json->>'bonus_type_name' LIKE '%утилизац%')
      THEN ABS(corrections) ELSE 0 END) as wb_services_cost_new
  FROM wb_finance_raw
  WHERE report_id ~ '^(api|excel)-[0-9]{4}-W[0-9]{2}-'
  GROUP BY 1
) t
ORDER BY week DESC;
```

---

## Implementation Plan

### Phase 1: Database Schema (Prisma)

**File**: `prisma/schema.prisma`

Add to `WeeklyPayoutSummary` model:
```prisma
// WB Services costs (Request #56)
wbServicesCost      Decimal @default(0) @map("wb_services_cost") @db.Decimal(15, 2)
wbPromotionCost     Decimal @default(0) @map("wb_promotion_cost") @db.Decimal(15, 2)
wbJamCost           Decimal @default(0) @map("wb_jam_cost") @db.Decimal(15, 2)
wbOtherServicesCost Decimal @default(0) @map("wb_other_services_cost") @db.Decimal(15, 2)
```

### Phase 2: Aggregation Service

**File**: `src/aggregation/weekly-payout-aggregator.service.ts`

1. Add new fields to `RawAggregationRow` interface
2. Add SQL CASE statements in `aggregateByReportType()` query
3. Map fields in result transformation
4. Add to upsert operations

### Phase 3: API Response DTOs

**Files**:
- `src/analytics/dto/response/finance-summary-response.dto.ts`
- `src/analytics/dto/response/cabinet-summary-response.dto.ts`

```typescript
@ApiProperty({
  example: 51063.0,
  description: 'Total WB services cost (WB.Promotion + Джем + other services)',
})
wb_services_cost!: number;

@ApiProperty({
  example: { promotion: 32073.0, jam: 18990.0, other: 0.0 },
  description: 'WB services cost breakdown',
  nullable: true,
})
wb_services_breakdown?: {
  promotion: number;
  jam: number;
  other: number;
};
```

### Phase 4: Analytics Service

**File**: `src/analytics/weekly-analytics.service.ts`

Add new fields to query and response mapping.

### Phase 5: Documentation & Tests

1. Update `docs/API-PATHS-REFERENCE.md`
2. Update `docs/WB-DASHBOARD-METRICS.md`
3. Update `test-api/06-analytics-advanced.http`
4. Add unit tests for new aggregation logic

---

## Expected Outcome

### Before (current)

```
other_adjustments_net: 51,063₽  (WB.Promotion + Джем hidden inside)
wb_commission_adj:      2,153₽  (Минимальный платеж)
```

### After (implemented)

```
other_adjustments_net:  51,063₽  (unchanged - backward compat)
wb_services_cost:       51,063₽  (NEW - total WB services)
wb_services_breakdown:           (NEW - detailed breakdown)
├── promotion:          32,073₽  (WB.Promotion)
├── jam:                18,990₽  (Джем subscription)
└── other:                   0₽  (утилизация, etc.)
wb_commission_adj:       2,153₽  (unchanged)
```

---

## Migration Notes

1. **Backward Compatibility**: `other_adjustments_net` unchanged
2. **Historical Data**: Run re-aggregation after schema migration
3. **Default Values**: All new fields default to 0

---

## Acceptance Criteria

- [x] SQL analysis identifies WB services in `corrections` field
- [x] Filtering criteria determined: `reason='Удержание'` + `bonus_type_name` patterns
- [ ] Prisma schema updated with new fields
- [ ] Migration created and applied
- [ ] Aggregation service updated with new SQL
- [ ] API DTOs updated with new response fields
- [ ] API endpoints return `wb_services_cost` and breakdown
- [ ] Documentation updated
- [ ] Tests added and passing
- [ ] Historical data re-aggregated

---

## Files to Modify

### Backend
- `prisma/schema.prisma` - Add 4 new fields to WeeklyPayoutSummary + WeeklyPayoutTotal
- `src/aggregation/weekly-payout-aggregator.service.ts` - Add SQL aggregation
- `src/analytics/dto/response/finance-summary-response.dto.ts` - Add DTOs
- `src/analytics/dto/response/cabinet-summary-response.dto.ts` - Add DTOs
- `src/analytics/weekly-analytics.service.ts` - Map new fields

### Documentation
- `docs/API-PATHS-REFERENCE.md` - Document new fields
- `docs/WB-DASHBOARD-METRICS.md` - Update metrics reference
- `test-api/06-analytics-advanced.http` - Add test examples

### Frontend (after backend complete)
- `src/hooks/useExpenses.ts` - Add "Сервисы WB" category
- `src/components/custom/ExpenseChart.tsx` - New color/section
- `src/components/custom/FinancialSummaryTable.tsx` - New row
- `src/components/custom/PnLWaterfall.tsx` - New section

---

## 🆕 Flexible Categorization System (2025-12-13)

### Design Principles

1. **Direction Detection**: Знак значения определяет направление
   - `value > 0` → EXPENSE (расход/списание)
   - `value < 0` → INCOME (доход/начисление)
   - `value = 0` → NEUTRAL

2. **Category Classification**: Паттерн-матчинг по `bonus_type_name`
   - `PROMOTION` - WB Продвижение (`/продвижен/i`)
   - `SUBSCRIPTION_JAM` - Джем (`/джем/i`)
   - `DISPOSAL` - Утилизация (`/утилизац/i`)
   - `MINIMUM_PAYMENT` - Минимальный платеж (`/минимальн.*платеж/i`)
   - `OTHER` - Fallback для новых категорий

3. **Source Field Tracking**: Откуда пришли данные
   - `corrections` - WB сервисы (Promotion, Джем, Утилизация)
   - `commission_other` - Комиссии и корректировки
   - `other_adjustments` - Прочие корректировки

4. **Extensibility**: Новые категории WB добавляются в enum + pattern rules

### Key Insight: Already in total_commission_rub ⚠️

**НЕ ДОБАВЛЯТЬ в payout повторно**:
- `reason='Продажа'` → `commission_other` = 67,064₽ (уже в total_commission_rub!)
- `reason='Возврат'` → `commission_other` = 1,080₽ (уже в total_commission_rub!)

**Добавить как новую видимость**:
- `reason='Удержание'` + `corrections` = WB сервисы (Promotion, Джем, etc.)

📖 **Full architecture**: `docs/architecture/adjustment-categorization-system.md`

---

## References

- `docs/technical-debt/commission-separation.md` - Original problem description
- `docs/architecture/adjustment-categorization-system.md` - Flexible categorization system
- `src/aggregation/weekly-payout-aggregator.service.ts:300-304` - Current aggregation
- `frontend/docs/request-backend/51-wb-commission-adj-payout.md` - Related Request #51

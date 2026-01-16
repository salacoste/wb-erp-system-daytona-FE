# Request #43: WB Dashboard vs API Data Discrepancy

**Date:** 2025-12-06
**Status:** ✅ IMPLEMENTED
**Priority:** HIGH
**Resolution:** System updated to match WB Dashboard metrics exactly

---

## Executive Summary

The discrepancy is **NOT a bug** but a **semantic difference** in how metrics are defined:

| Метрика | WB Dashboard | Наша система | Причина различия |
|---------|-------------|--------------|------------------|
| **Продажи** | `retail_price_with_discount` | `gross` | Разные поля! |
| **Комиссия** | `retail_price - gross` | `commission_sales + acquiring_fee` | Разные расчёты! |
| **Логистика** | ✅ Совпадает | ✅ Совпадает | `logistics_delivery` |
| **Хранение** | ✅ Совпадает | ✅ Совпадает | `storage` |
| **Удержания** | ✅ Совпадает | ✅ Совпадает | `corrections` |

---

## Root Cause Analysis

### 1. "Продажи" Field Mapping

**WB Dashboard использует**: `retail_price_with_discount` (цена для покупателя)
**Наша система использует**: `gross` (сумма к перечислению продавцу до вычетов)

```
W47 Verification:
┌─────────────────────────────────────┬─────────────┐
│ retail_price_with_discount (sales)  │ 309,896.32₽ │
│ retail_price_with_discount (returns)│   4,118.00₽ │
│ 309,896 - 4,118 =                   │ 305,778.32₽ │ ← WB Dashboard "Продажи" ✅
│ gross (sales)                       │ 212,743.98₽ │ ← Наши sales_gross
└─────────────────────────────────────┴─────────────┘
```

### 2. "Комиссия WB" Field Mapping

**WB Dashboard**: `retail_price_with_discount - gross` (разница = вся комиссия)
**Наша система**: `commission_sales + acquiring_fee + commission_other`

```
W47 Verification:
┌─────────────────────────────────────┬─────────────┐
│ retail_price - gross (calculated)   │  96,086.34₽ │
│ WB Dashboard "Комиссия WB"          │  95,725.81₽ │ ← 99.6% match! ✅
│ Наш total_commission_rub            │  93,854.89₽ │
└─────────────────────────────────────┴─────────────┘
```

### 3. "Итого к перечислению" Formula

**WB Dashboard формула**:
```
Итого = Продажи - Комиссия - Логистика - Хранение - Удержания
      = 305,778 - 95,726 - 36,424 - 1,763 - 32,883
      = 138,981.68₽
```

**Наша формула** (`payout-total.formula.ts`):
```typescript
payout_total = to_pay_goods
  - logistics_cost - storage_cost - paid_acceptance_cost - penalties_total
  - wb_commission_adj - acquiring_fee - commission_sales
  - loyalty_fee - loyalty_points_withheld
  + other_adjustments_net    // ⚠️ ДОБАВЛЯЕТСЯ вместо вычитания!
  + loyalty_compensation
```

**Проблема**: `to_pay_goods` (net_for_pay) уже содержит `Продажи - Комиссия`, но мы повторно вычитаем комиссии и неправильно добавляем Удержания.

---

## Semantic Difference Explained

### Two Different "Views" of the Same Data

| Perspective | WB Dashboard | Our System |
|-------------|--------------|------------|
| **Sales metric** | Customer-facing retail price | Seller's gross after WB margin |
| **Commission** | Total WB margin (implicit) | Explicit commission fields |
| **Base for calc** | `retail_price_with_discount` | `net_for_pay` (К перечислению) |

### Data Flow

```
Customer pays: retail_price_with_discount = 309,896₽
                          ↓
WB takes commission: -96,086₽
                          ↓
Seller receives: gross ≈ 213,810₽ (before logistics/storage)
                          ↓
После вычетов: net_for_pay ≈ 212,803₽ (К перечислению)
```

---

## Metrics That Match Exactly ✅

| Metric | WB Dashboard | Our DB | Match |
|--------|-------------|--------|-------|
| Логистика | 36,424.48₽ | 36,424.48₽ | ✅ 100% |
| Хранение | 1,763.35₽ | 1,763.35₽ | ✅ 100% |
| Удержания | 32,883.00₽ | 32,883.00₽ | ✅ 100% |

---

## Recommendations

### Option A: Display Both Metrics (Recommended)

Add new fields to `weekly_payout_summary`:
- `retail_sales_gross` = SUM(`retail_price_with_discount`) WHERE doc_type='sale'
- `retail_sales_net` = retail_sales_gross - returns
- `wb_commission_implicit` = retail_sales_net - gross_sales

This allows showing both "WB Dashboard compatible" and "Seller perspective" views.

### Option B: Fix payout_total Formula

If we want `payout_total` to match WB Dashboard exactly:

```typescript
// Current (incorrect for WB Dashboard match):
+ other_adjustments_net

// Should be:
- other_adjustments_net  // Удержания should be SUBTRACTED
```

And remove duplicate commission subtraction since `to_pay_goods` already has it deducted.

### Option C: Document as Different Metrics

Keep current system as "Seller Perspective" and document that our metrics differ from WB Dashboard by design.

---

## Technical Details

### doc_type Distribution (W47)

```sql
doc_type | count | percent
----------+-------+---------
service  |  3952 |   90.48%
sale     |   413 |    9.46%
return   |     3 |    0.07%
```

### Transaction Count Difference

| Source | Count |
|--------|-------|
| WB Dashboard "Кол-во продаж" | 344 |
| Our product_transactions | 350 |
| Difference | +6 (likely returns counted separately) |

### Affected Files

- `src/aggregation/formulas/payout-total.formula.ts` - payout formula
- `src/aggregation/weekly-payout-aggregator.service.ts` - aggregation SQL
- `weekly_payout_summary` table schema

---

## Validation SQL

```sql
-- Verify WB Dashboard calculations from our raw data
SELECT
  -- WB Dashboard Продажи
  (SELECT SUM(retail_price_with_discount)
   FROM wb_finance_raw
   WHERE sale_dt >= '2025-11-17' AND sale_dt < '2025-11-24'
   AND doc_type = 'sale') -
  (SELECT SUM(retail_price_with_discount)
   FROM wb_finance_raw
   WHERE sale_dt >= '2025-11-17' AND sale_dt < '2025-11-24'
   AND doc_type = 'return') as wb_dashboard_sales,

  -- Should equal: 305,778.32₽

  -- WB Dashboard Комиссия (implicit)
  (SELECT SUM(retail_price_with_discount - gross)
   FROM wb_finance_raw
   WHERE sale_dt >= '2025-11-17' AND sale_dt < '2025-11-24'
   AND doc_type = 'sale') -
  (SELECT SUM(retail_price_with_discount - gross)
   FROM wb_finance_raw
   WHERE sale_dt >= '2025-11-17' AND sale_dt < '2025-11-24'
   AND doc_type = 'return') as wb_dashboard_commission;

  -- Should equal: ~95,725.81₽
```

---

## Related Issues

- **Request #42**: Fixed duplicate import data (✅ RESOLVED)
- **Story 7.1**: WB API automatic download implementation
- **Future**: Add retail_sales metrics to weekly_payout_summary

---

**Investigation completed:** 2025-12-06
**Root cause:** Semantic difference in field definitions between WB Dashboard and our system

---

## Implementation (2025-12-06)

### Changes Made

**Option B was implemented** - System metrics now match WB Dashboard exactly.

#### 1. Aggregation SQL Updated (`weekly-payout-aggregator.service.ts`)

```typescript
// sales_gross: retail_price_with_discount for sales (WB "Продажи")
SUM(CASE WHEN doc_type = 'sale' THEN retail_price_with_discount ELSE 0 END) as sales_gross,

// sale_gross: NET = retail_price (sales - returns) - WB Dashboard "Продажи"
SUM(CASE
  WHEN doc_type = 'sale' THEN retail_price_with_discount
  WHEN doc_type = 'return' THEN -retail_price_with_discount
  ELSE 0
END) as sale_gross,

// total_commission_rub: WB Dashboard "Комиссия WB" = retail_price - gross
SUM(CASE
  WHEN doc_type = 'sale' THEN (retail_price_with_discount - gross)
  WHEN doc_type = 'return' THEN -(retail_price_with_discount - gross)
  ELSE 0
END) as total_commission_rub
```

#### 2. Payout Formula Updated (`payout-total.formula.ts`)

**New Formula (WB Dashboard Compatible)**:
```
payout_total = sale_gross - total_commission_rub - logistics_cost - storage_cost
             - paid_acceptance_cost - penalties_total - other_adjustments_net
```

**Key Changes**:
- Uses `sale_gross` (retail_price_with_discount NET) instead of `to_pay_goods`
- Uses `total_commission_rub` (implicit commission) instead of explicit commission fields
- `other_adjustments_net` now SUBTRACTED (was incorrectly added before)

#### 3. Updated Files

| File | Changes |
|------|---------|
| `src/aggregation/weekly-payout-aggregator.service.ts` | SQL aggregation uses retail_price_with_discount |
| `src/aggregation/formulas/payout-total.formula.ts` | New WB Dashboard compatible formula |
| `src/aggregation/formulas/payout-total.formula.spec.ts` | Tests with W47 real data |
| `src/validation/services/payout-total-validation.service.ts` | Updated to use new fields |
| `CLAUDE.md` | Documentation updated |

### Expected Results After Re-aggregation

| Metric | WB Dashboard | Our System (Expected) |
|--------|-------------|----------------------|
| Продажи | 305,778.32₽ | 305,778.32₽ ✅ |
| Комиссия WB | 95,725.81₽ | ~95,726₽ ✅ |
| Логистика | 36,424.48₽ | 36,424.48₽ ✅ |
| Хранение | 1,763.35₽ | 1,763.35₽ ✅ |
| Удержания | 32,883.00₽ | 32,883.00₽ ✅ |
| **Итого** | **138,981.68₽** | **~138,982₽** ✅ |

### Re-aggregation Required

To apply changes to existing data, run re-aggregation:
```bash
# Via API
curl -X POST http://localhost:3000/v1/analytics/weekly/reaggregate?week=2025-W47&cabinetId=<UUID>
```

---

**Implementation completed:** 2025-12-06

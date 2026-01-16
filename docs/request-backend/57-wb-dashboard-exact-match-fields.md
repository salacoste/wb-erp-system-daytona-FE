# Request #57: WB Dashboard Exact Match Fields

**Date**: 2025-12-13
**Priority**: P1 - HIGH
**Status**: ✅ **IMPLEMENTED** (2025-12-13)

---

## Summary

Добавлены поля `wb_sales_gross` и `wb_returns_gross` для точного соответствия значениям WB Dashboard "Продажа" и "Возврат".

---

## Problem

Frontend отображает `sales_gross` (197,083.82₽), но WB Dashboard показывает "Продажа" = 131,134.76₽.

**Причина расхождения:**
- `sales_gross` = retail_price_with_discount (цена для покупателя ДО комиссии WB)
- WB "Продажа" = gross = retail_price - wb_commission (выручка продавца ПОСЛЕ комиссии WB)

---

## Solution

Добавлены новые поля:
- `wb_sales_gross` = SUM(gross) WHERE doc_type='sale'
- `wb_returns_gross` = SUM(gross) WHERE doc_type='return'

---

## API Changes

### Finance Summary Response

```json
{
  "summary_rus": {
    "sales_gross": 197083.82,
    "wb_sales_gross": 131134.76,
    "wb_returns_gross": 809.00
  },
  "summary_total": {
    "sales_gross_total": 202376.09,
    "wb_sales_gross_total": 135285.09,
    "wb_returns_gross_total": 809.00
  }
}
```

### New Fields

| Field | Type | Description |
|-------|------|-------------|
| `wb_sales_gross` | number | WB Dashboard "Продажа" exact match |
| `wb_returns_gross` | number | WB Dashboard "Возврат" exact match |
| `wb_sales_gross_total` | number | Consolidated (RUS + EAEU) |
| `wb_returns_gross_total` | number | Consolidated (RUS + EAEU) |

---

## Frontend Usage

### ⚠️ CRITICAL: WB Dashboard Shows NET (Sales - Returns)

**ВАЖНО**: WB Dashboard НЕ показывает отдельную строку "Возврат"!
Значение "Продажа" в WB Dashboard уже NET (за вычетом возвратов).

```typescript
// ПРАВИЛЬНО: Для отображения как на WB Dashboard
const wbSales = data.summary_total.wb_sales_gross_total;     // Продажи
const wbReturns = data.summary_total.wb_returns_gross_total; // Возвраты
const wbDashboardSales = wbSales - wbReturns;                // WB "Продажа" (NET)

// W48 Example: 153,220.48 - 7,954.00 = 145,266.48₽ ✅ WB EXACT MATCH
```

```typescript
// НЕПРАВИЛЬНО: Показывать wb_sales_gross напрямую
const wrong = data.summary_total.wb_sales_gross_total; // 153,220.48₽ ❌
// WB Dashboard показывает 145,266.48₽ (NET)
```

### For Full Revenue Analysis

```typescript
// Для полного анализа выручки:
const retailRevenue = data.summary_rus.sales_gross;        // 197,083.82₽
const wbCommission = data.summary_rus.total_commission_rub; // 65,499.06₽
const sellerGross = data.summary_rus.wb_sales_gross;       // 131,134.76₽

// Проверка: retailRevenue - wbCommission ≈ sellerGross
```

---

## Verification

### W49 (Dec 1-7, 2025) - Initial Implementation

| Metric | API Value | WB Dashboard | Match |
|--------|-----------|--------------|-------|
| wb_sales_gross | 131,134.76₽ | "Продажа" | ✅ |
| wb_returns_gross | 809.00₽ | "Возврат" | ✅ |
| sales_gross | 197,083.82₽ | (not shown) | N/A |

### W48 (Nov 24-30, 2024) - Formula Fix Verification

| Metric | API Value | WB Dashboard | Match |
|--------|-----------|--------------|-------|
| wb_sales_gross_total | 153,220.48₽ | - | - |
| wb_returns_gross_total | 7,954.00₽ | - | - |
| **NET (sales - returns)** | **145,266.48₽** | **145,266.48₽** | ✅ |
| └ Основной | 137,945.00₽ | 137,945.00₽ | ✅ |
| └ По выкупам | 7,321.48₽ | 7,321.48₽ | ✅ |

**Frontend Fix (2025-12-14)**: FinancialSummaryTable.tsx теперь вычисляет NET:
```typescript
const wbSalesNet = wbSales - wbReturns
```

---

## Database Changes

### weekly_payout_summary
```sql
ALTER TABLE weekly_payout_summary
ADD COLUMN wb_sales_gross DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN wb_returns_gross DECIMAL(15,2) NOT NULL DEFAULT 0;
```

### weekly_payout_total
```sql
ALTER TABLE weekly_payout_total
ADD COLUMN wb_sales_gross_total DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN wb_returns_gross_total DECIMAL(15,2) NOT NULL DEFAULT 0;
```

---

## Related Documentation

- `docs/API-PATHS-REFERENCE.md` - Request #57 section
- `docs/WB-DASHBOARD-METRICS.md` - Dashboard alignment guide
- Request #56 - WB Services breakdown (same session)

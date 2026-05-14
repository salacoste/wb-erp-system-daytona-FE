# Request #58: Агрегация retail_price_total (Сумма по ВАШИМ ценам)

**Date**: 2025-12-14
**Priority**: P2 - MEDIUM
**Status**: 🔲 PENDING

---

## Summary

Добавить агрегацию `retail_price_total = SUM(retail_price)` для отображения полной воронки продаж "от ВАШЕЙ цены до прибыли".

---

## Problem

Для построения полной воронки продаж не хватает агрегированного поля с суммой розничных цен **ДО скидок WB**.

### Текущая ситуация

| Поле | Формула | Описание |
|------|---------|----------|
| `sales_gross` | SUM(retail_price_with_discount) | Цена СО скидкой WB |
| `wb_sales_gross` | SUM(gross) | Выручка после комиссии WB |
| **??? (нет)** | SUM(retail_price) | **ВАША цена до скидок** |

### Воронка продаж (визуализация)

```
ВАША цена (retail_price)     ~250,000₽   100%
      ↓ Скидка WB            -53,000₽    -21%
После скидки (sales_gross)   197,000₽    79%
      ↓ Комиссия WB          -65,000₽    -26%
К перечислению (wb_sales)    131,000₽    52%
```

---

## Request

Добавить агрегацию в `weekly_payout_summary`:

```sql
SUM(CASE WHEN doc_type = 'sale' THEN retail_price ELSE 0 END) as retail_price_total
```

---

## Source Data

Поле `retail_price` уже есть в `wb_finance_raw`:

| Колонка Excel | Поле БД | Описание |
|---------------|---------|----------|
| "Цена розничная" | `retail_price` | Ваша цена до применения скидок WB |

---

## API Response Changes

### Finance Summary

```json
{
  "summary_rus": {
    "retail_price_total": 250000.00,
    "sales_gross": 197083.82,
    "wb_sales_gross": 131134.76
  },
  "summary_total": {
    "retail_price_total_combined": 256000.00,
    "sales_gross_total": 202376.09,
    "wb_sales_gross_total": 135285.09
  }
}
```

### New Fields

| Field | Type | Description |
|-------|------|-------------|
| `retail_price_total` | number | Сумма по ВАШИМ ценам (до скидок WB) |
| `retail_price_total_combined` | number | Consolidated (RUS + EAEU) |

---

## Database Changes

### weekly_payout_summary

```sql
ALTER TABLE weekly_payout_summary
ADD COLUMN retail_price_total DECIMAL(18,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN weekly_payout_summary.retail_price_total IS
'SUM(retail_price) WHERE doc_type=sale — сумма по ВАШИМ ценам до скидок WB';
```

### weekly_payout_total

```sql
ALTER TABLE weekly_payout_total
ADD COLUMN retail_price_total_combined DECIMAL(18,2) NOT NULL DEFAULT 0;
```

---

## Code Changes

### 1. Prisma Schema

```prisma
// weekly_payout_summary
retail_price_total    Decimal   @default(0) @db.Decimal(18, 2)

// weekly_payout_total
retail_price_total_combined    Decimal   @default(0) @db.Decimal(18, 2)
```

### 2. Weekly Payout Aggregator

```typescript
// src/aggregation/weekly-payout-aggregator.service.ts
SUM(CASE WHEN doc_type = 'sale' THEN retail_price ELSE 0 END) as retail_price_total
```

### 3. DTO Response

```typescript
@ApiProperty({ description: 'Сумма по ВАШИМ ценам (до скидок WB)' })
retail_price_total: number;
```

---

## Validation

После реализации проверить инварианты:

```
retail_price_total > sales_gross > wb_sales_gross
```

| Метрика | Формула проверки |
|---------|------------------|
| Скидка WB | `retail_price_total - sales_gross` |
| Комиссия WB | `sales_gross - wb_sales_gross` (≈ total_commission_rub) |

---

## Frontend Usage

После реализации можно добавить в Unit Economics (Epic 5):

```typescript
// Waterfall chart: полная воронка
const yourPrice = data.summary_rus.retail_price_total;      // 250,000₽
const wbDiscount = yourPrice - data.summary_rus.sales_gross; // 53,000₽
const afterDiscount = data.summary_rus.sales_gross;          // 197,000₽
const wbCommission = data.summary_rus.total_commission_rub;  // 65,000₽
const sellerGross = data.summary_rus.wb_sales_gross;         // 131,000₽

// Показать: "Потери на скидках WB" = 21% от ВАШЕЙ цены
const discountLossPct = (wbDiscount / yourPrice) * 100;
```

---

## Priority Justification

**P2 - MEDIUM** потому что:
- ✅ Основной функционал (payout_total, wb_sales_gross) работает
- ✅ Данные уже есть в wb_finance_raw
- ⭐ Полезно для полной картины экономики продаж
- ⭐ Позволит показать реальные "потери на скидках WB"

---

## Related

- Request #57 - WB Dashboard Exact Match (wb_sales_gross)
- Epic 5 - Unit Economics Analytics
- `docs/WB-DASHBOARD-METRICS.md`

## Backend Team Response

- **Status**: RESOLVED
- **Resolution date**: 2025-12-14
- **Summary**: `retail_price_total` field added to `weekly_payout_summary` and `weekly_payout_total` tables. Aggregated from `wb_finance_raw` using `SUM(retail_price)` for sales. Enables display of the full pricing waterfall (your price -> WB discount -> commission -> seller gross).
- **Remaining frontend action**: Use `retail_price_total` in Unit Economics waterfall chart to show discount loss percentage.

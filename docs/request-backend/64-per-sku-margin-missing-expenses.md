# Request #64: Per-SKU Margin Calculation - Missing Expense Components

## Дата
2025-12-18

## Статус
📋 **PENDING** - Требует реализации на backend

## Контекст

Epic 30 частично реализован, но при анализе данных W50 обнаружено, что несколько компонентов расходов **не заполняются** в `weekly_margin_fact`, хотя данные для них **существуют** в источниках.

### Текущее состояние weekly_margin_fact (W50)

```
nm_id: 148190182 (m61-5)
  revenueNetRub: 28680.99
  cogsRub: 10656.00
  grossProfitRub: 18024.99
  logisticsCostRub: 3790.23      ✅ Заполнено
  storageCostRub: 0.00           ❌ Должно быть 6.44₽
  commissionRub: 0.00            ❌ Должно быть ~2525₽
  acquiringFeeRub: 0.00          ❌ Должно быть ~505₽
  totalExpensesRub: 3790.23      ← Только логистика!
  operatingProfitRub: 14234.76   ← Завышено!
```

### Данные которые ЕСТЬ в источниках

**1. Storage (из `paid_storage_daily` - Epic 24)**
```sql
SELECT nm_id, SUM(warehouse_price) as storage_cost
FROM paid_storage_daily
WHERE date >= '2025-12-08' AND date <= '2025-12-14'
GROUP BY nm_id;

-- Результат:
-- 148190182: 6.44₽
-- 148190095: 33.66₽
-- 412096139: 13.59₽
```

**2. Commission (из `wb_finance_raw`)**
```sql
SELECT
  nm_id,
  SUM(ABS(commission_sales)) as commission_sales,
  SUM(ABS(commission_other)) as commission_other
FROM wb_finance_raw
WHERE sale_dt >= '2025-12-08' AND sale_dt < '2025-12-15'
  AND nm_id IS NOT NULL AND nm_id != 'UNKNOWN'
GROUP BY nm_id;

-- Результат для 148190182:
-- commission_sales: 2168.46₽
-- commission_other: 357.31₽
-- Итого: 2525.77₽
```

**3. Acquiring Fee (из `wb_finance_raw`)**
```sql
SELECT nm_id, SUM(ABS(acquiring_fee)) as acquiring_fee
FROM wb_finance_raw
WHERE sale_dt >= '2025-12-08' AND sale_dt < '2025-12-15'
  AND nm_id IS NOT NULL AND nm_id != 'UNKNOWN'
GROUP BY nm_id;

-- Результат для 148190182:
-- acquiring_fee: 505.12₽
```

## Требования

### 1. Заполнять `storageCostRub` из `paid_storage_daily`

**Источник**: `paid_storage_daily` (Epic 24)

```sql
-- При расчёте маржи для недели, JOIN с paid_storage_daily:
SELECT
  wm.nm_id,
  COALESCE(SUM(psd.warehouse_price), 0) as storage_cost
FROM weekly_margin_fact wm
LEFT JOIN paid_storage_daily psd
  ON psd.nm_id = wm.nm_id::text
  AND psd.cabinet_id = wm.cabinet_id
  AND psd.date BETWEEN week_start_date AND week_end_date
GROUP BY wm.nm_id
```

**Примечание**: Если записи в `paid_storage_daily` нет за какой-то день — это означает 0 остатка (товар распродан), а не отсутствие данных.

### 2. Заполнять `commissionRub` из `wb_finance_raw`

**Источник**: `wb_finance_raw`

```sql
SELECT
  nm_id,
  SUM(ABS(commission_sales) + ABS(commission_other)) as commission_total
FROM wb_finance_raw
WHERE sale_dt BETWEEN week_start AND week_end
  AND cabinet_id = ?
  AND nm_id IS NOT NULL AND nm_id != 'UNKNOWN'
GROUP BY nm_id
```

**Примечание**: Комиссия уже вычтена из `net_for_pay`, но для аналитики важно показывать её отдельно.

### 3. Заполнять `acquiringFeeRub` из `wb_finance_raw`

**Источник**: `wb_finance_raw`

```sql
SELECT
  nm_id,
  SUM(ABS(acquiring_fee)) as acquiring_fee
FROM wb_finance_raw
WHERE sale_dt BETWEEN week_start AND week_end
  AND cabinet_id = ?
  AND nm_id IS NOT NULL AND nm_id != 'UNKNOWN'
GROUP BY nm_id
```

### 4. Обновить формулу `totalExpensesRub`

**Текущая формула (НЕВЕРНАЯ)**:
```
totalExpensesRub = logisticsCostRub
```

**Правильная формула**:
```
totalExpensesRub = logisticsCostRub
                 + storageCostRub
                 + commissionRub
                 + acquiringFeeRub
                 + penaltiesRub
                 + paidAcceptanceCostRub
```

### 5. Пересчитать `operatingProfitRub` и `operatingMarginPercent`

```
operatingProfitRub = grossProfitRub - totalExpensesRub
operatingMarginPercent = (operatingProfitRub / revenueNetRub) × 100
```

## Ожидаемый результат для W50

**SKU 148190182 (m61-5) после исправления:**

| Поле | Было | Должно быть |
|------|------|-------------|
| logisticsCostRub | 3790.23 | 3790.23 ✅ |
| storageCostRub | 0 | 6.44 |
| commissionRub | 0 | 2525.77 |
| acquiringFeeRub | 0 | 505.12 |
| totalExpensesRub | 3790.23 | 6827.56 |
| operatingProfitRub | 14234.76 | 11197.43 |
| operatingMarginPercent | 49.63% | 39.04% |

## Валидация

Сумма per-SKU расходов должна приблизительно соответствовать общекабинетным:

```
SUM(logisticsCostRub) ≈ weekly_payout_summary.logistics_cost
SUM(storageCostRub) ≈ SUM(paid_storage_daily.warehouse_price) за период
SUM(commissionRub) ≈ weekly_payout_summary.total_commission_rub
```

## Приоритет

**Высокий** - текущий расчёт операционной прибыли занижает расходы и завышает маржу, что вводит пользователей в заблуждение.

## Файлы для изменения

1. `src/analytics/services/margin-calculation.service.ts` - основной расчёт маржи
2. `src/aggregation/weekly-payout-aggregator.service.ts` - если агрегация влияет на margin

## Связанные задачи

- Epic 24: Paid Storage Analytics ✅ (данные есть)
- Epic 30: Per-SKU Storage Costs Integration (частично реализовано)
- Request #60: Per-SKU Operational Costs ✅ (структура готова, данные не заполнены)
- Request #63: Operating Profit Formula Clarification

## Дополнительно: Отображение комиссии WB на фронте

После реализации backend, на странице `/analytics/sku` нужно:
1. Добавить колонку "Комиссия WB" (опционально, через columnVisibility)
2. Показывать breakdown расходов в tooltip или expandable row
3. Использовать `operating_margin_pct` вместо `margin_pct` как основной показатель

## Примечание о комиссии

**Важно**: Комиссия (`commission_sales + commission_other`) уже учтена в разнице между `gross` и `net_for_pay`. Однако:
- Для **by-sku endpoint** важно показывать её как отдельную статью расходов для аналитики
- Для **итогового payout_total** она уже вычтена и не должна вычитаться повторно

Формула проверки:
```
gross - commission_sales - commission_other - acquiring_fee ≈ net_for_pay (с погрешностью ≤1%)
```

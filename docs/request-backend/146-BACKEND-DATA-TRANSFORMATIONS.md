# 131: Трансформации данных бэкенда для фронтенда

**Дата создания**: 2026-02-01
**Версия**: 1.0
**Статус**: Актуально

---

## Введение

Данный документ описывает математические трансформации, агрегации и бизнес-логику, которые бэкенд применяет к данным WB API. Фронтенд-команде необходимо понимать, какие расчёты были произведены, чтобы корректно отображать данные на дашборде.

**Важно**: Бэкенд НЕ просто пробрасывает данные WB API "как есть" — он применяет значительные трансформации для получения бизнес-метрик.

---

## Оглавление

1. [wb_sales_gross_total (Выкупы)](#1-wb_sales_gross_total-выкупы)
2. [cogs_total (Себестоимость)](#2-cogs_total-себестоимость)
3. [logistics_cost_total (Логистика)](#3-logistics_cost_total-логистика)
4. [storage_cost_total (Хранение)](#4-storage_cost_total-хранение)
5. [advertising totalSpend (Реклама)](#5-advertising-totalspend-реклама)
6. [payout_total (К перечислению)](#6-payout_total-к-перечислению)
7. [margin_percent (Маржинальность)](#7-margin_percent-маржинальность)
8. [operating_profit (Операционная прибыль)](#8-operating_profit-операционная-прибыль)

---

## 1. wb_sales_gross_total (Выкупы)

### Источник данных WB API

**Endpoint**: `GET /api/v5/supplier/reportDetailByPeriod`
**Метод SDK**: `financesApi.getReportDetailByPeriod()`

### Исходные поля WB API

| Поле WB API | Описание |
|-------------|----------|
| `retail_price_with_discount` | Цена для покупателя с учётом скидок WB (руб.) |
| `doc_type` | Тип документа: `Продажа` или `Возврат` |
| `qty` | Количество: 1 = товар, 0 = услуга, 2 = транспорт |

### Трансформации бэкенда

1. **Фильтрация по типу операции**: Учитываются только записи с `doc_type = 'sale'` или `doc_type = 'return'`
2. **Фильтрация по qty**: Только товарные операции (`qty = 1`), исключая услуги (`qty = 0`) и транспорт (`qty = 2`)
3. **Раздельный учёт продаж и возвратов**:
   - `sales_gross` = SUM(`retail_price_with_discount`) WHERE `doc_type = 'sale'`
   - `returns_gross` = SUM(`retail_price_with_discount`) WHERE `doc_type = 'return'`
4. **Нетто-выручка**: `sale_gross` = `sales_gross` - `returns_gross`

### Формула расчёта

```sql
-- Агрегация в weekly_payout_summary
wb_sales_gross_total = SUM(
  CASE
    WHEN doc_type = 'sale' THEN retail_price_with_discount
    ELSE 0
  END
)

-- Для нетто (Request #41):
sale_gross_net = SUM(
  CASE
    WHEN doc_type = 'sale' THEN retail_price_with_discount
    WHEN doc_type = 'return' THEN -retail_price_with_discount
    ELSE 0
  END
)
```

### Бизнес-логика

- **WB возвращает положительные значения** для обоих типов (sale и return)
- **Бэкенд вычитает возвраты** из продаж для получения нетто-выручки
- **Результат может быть отрицательным** (если возвратов больше, чем продаж)
- **Агрегация**: daily → weekly по неделям ISO (Europe/Moscow)

### Связь с WB Dashboard

| Поле бэкенда | Поле WB Dashboard |
|--------------|-------------------|
| `wb_sales_gross` | "Продажа" (SUM of `gross` для sale) |
| `wb_returns_gross` | "Возврат" (SUM of `gross` для return) |
| `sale_gross` | Нетто: Продажа - Возврат |

**Файлы реализации**:
- `src/aggregation/weekly-payout-aggregator.service.ts:288-306`
- `docs/BUSINESS-LOGIC-REFERENCE.md#критичные-правила-фильтрации`

---

## 2. cogs_total (Себестоимость)

### Источник данных

**Таблица**: `cogs` (ручной ввод или CSV импорт)
**Связь**: По `nm_id` (артикул товара)

### Исходные поля

| Поле | Описание |
|------|----------|
| `unit_cost_rub` | Себестоимость единицы товара (руб.) |
| `valid_from` | Дата начала действия себестоимости |
| `valid_to` | Дата окончания (null = текущая версия) |

### Трансформации бэкенда

1. **Временное версионирование (Temporal Lookup)**:
   - Используется стратегия "Week Midpoint" (четверг недели)
   - Для каждой недели определяется `midpoint = (start + end) / 2`
   - COGS ищется как: `valid_from <= midpoint` с сортировкой по `valid_from DESC LIMIT 1`

2. **Агрегация по SKU**:
   ```typescript
   cogs_rub = unit_cost_rub × quantity_sold
   ```

3. **Расчёт покрытия**:
   ```typescript
   cogs_coverage_pct = (products_with_cogs / products_total) × 100
   ```

### Формула расчёта

```sql
-- Для одного SKU за неделю:
cogs_rub = (
  SELECT unit_cost_rub
  FROM cogs
  WHERE nm_id = :nm_id
    AND cabinet_id = :cabinet_id
    AND valid_from <= :week_midpoint
  ORDER BY valid_from DESC
  LIMIT 1
) × quantity_sold

-- Для всего кабинета за неделю:
cogs_total = SUM(cogs_rub) по всем SKU с продажами
```

### Бизнес-логика: Week Midpoint Strategy

**Принцип**: Если `valid_from ≤ четверг недели` → новая COGS применяется к этой неделе.

| Сценарий | valid_from | Midpoint (Thu) | Результат |
|----------|------------|----------------|-----------|
| COGS изменён в среду | 19.11.2025 | 21.11.2025 | Новая COGS ✓ |
| COGS изменён в пятницу | 22.11.2025 | 21.11.2025 | Старая COGS (применится с W48) |

**Рекомендация для пользователей**: Если COGS изменён в конце недели (Пт-Вс) и нужно применить к текущей неделе — установите `valid_from` на понедельник этой недели.

**Файлы реализации**:
- `src/analytics/services/margin-calculation.service.ts:547-589` (lookupCogs)
- `src/cogs/services/cogs.service.ts` (findCogsAtDate)
- `docs/BUSINESS-LOGIC-REFERENCE.md#cogs-temporal-lookup-week-midpoint-strategy`

---

## 3. logistics_cost_total (Логистика)

### Источник данных WB API

**Endpoint**: `GET /api/v5/supplier/reportDetailByPeriod`
**Поля в wb_finance_raw**:

| Поле WB | Описание |
|---------|----------|
| `logistics_delivery` | Стоимость доставки покупателю |
| `logistics_return` | Стоимость возврата товара |
| `transport_reimbursement` | Возмещение транспортных издержек (qty=2, информационный) |

### Трансформации бэкенда

1. **Агрегация компонентов**:
   ```sql
   logistics_cost = ABS(logistics_delivery) + ABS(logistics_return)
   ```

2. **ВАЖНО: Исключение transport_reimbursement**:
   - `transport_reimbursement` (qty=2) — это **информационный KPI**
   - Он **НЕ влияет** на `payout_total`
   - Хранится отдельно как `transport_reimbursement_neutral`

3. **Группировка по неделям**: По `report_id` (для API) или по `sale_dt` (для Excel)

### Формула расчёта

```sql
-- В weekly_payout_summary:
logistics_cost_total = SUM(ABS(logistics_delivery + logistics_return))

-- НЕ включает (Request #50):
transport_reimbursement_neutral = SUM(transport_reimbursement)  -- отдельно, для информации
```

### Бизнес-логика

- **WB включает логистику в отчёт по дате обработки**, а не по `sale_dt`
- **Request #50**: Логистика за отменённые заказы прошлых недель попадает в текущий отчёт
- **Фильтрация по report_id**: `report_id LIKE 'api-2025-W42-%'` для точного соответствия WB Dashboard

**Пример W49 (1-7 Dec 2025)**:
```
logistics_delivery = 24,139.82₽
logistics_return = 2,000.00₽
logistics_cost_total = 26,139.82₽ ✓ WB Dashboard MATCH
```

**Файлы реализации**:
- `src/aggregation/weekly-payout-aggregator.service.ts:316`
- `src/analytics/services/margin-calculation.service.ts:471-478`
- `docs/BUSINESS-LOGIC-REFERENCE.md#критичные-правила-фильтрации`

---

## 4. storage_cost_total (Хранение)

### Источник данных WB API

**Primary Source (Epic 24)**: `GET /api/v1/analytics/warehouses/stock/paid`
**Таблица**: `paid_storage_daily`

| Поле WB API | Описание |
|-------------|----------|
| `warehousePrice` | Стоимость хранения за день по складу (руб.) |
| `nmId` | Артикул товара |
| `date` | Дата расчёта |
| `warehouse` | Название склада WB |
| `volume` | Объём товара (литры) |

### Трансформации бэкенда

1. **Ежедневный импорт**: Cron в 06:00 MSK для всех кабинетов
2. **Агрегация по неделям**:
   ```sql
   storage_cost_total = SUM(warehouse_price)
   WHERE date BETWEEN week_start AND week_end
   ```

3. **Request #65: Источник для per-SKU хранения**:
   - `wb_finance_raw.storage` всегда = 0 для конкретных SKU (относится к `nm_id='UNKNOWN'`)
   - **Решение**: Используем `paid_storage_daily` как единственный источник per-SKU хранения

### Формула расчёта

```sql
-- Агрегация daily → weekly:
storage_cost_total = (
  SELECT SUM(warehouse_price)
  FROM paid_storage_daily
  WHERE cabinet_id = :cabinet_id
    AND date >= :week_start
    AND date <= :week_end
)

-- Per-SKU (для margin calculation):
storage_by_sku = (
  SELECT nm_id, SUM(warehouse_price) as storage_cost
  FROM paid_storage_daily
  WHERE cabinet_id = :cabinet_id
    AND date BETWEEN :week_start AND :week_end
  GROUP BY nm_id
)
```

### Бизнес-логика

- **WB считает хранение ежедневно** по объёму товара на складе
- **Тарифы**: зависят от склада, объёма и типа хранения
- **Merge strategy (Request #65)**:
  ```typescript
  // В margin-calculation.service.ts:183-184
  const storageBySku = await this.getStorageFromPaidStorageDaily(cabinetId, start, end);
  this.mergeStorageIntoExpenses(expensesBySku, storageBySku);
  ```

**Файлы реализации**:
- `src/analytics/services/storage-analytics.service.ts`
- `src/analytics/services/margin-calculation.service.ts:181-184`
- `docs/STORAGE-API-GUIDE.md`

---

## 5. advertising totalSpend (Реклама)

### Источник данных WB API

**Endpoint (Stats)**: `GET /adv/v2/stat` (WB Promotion API)
**Endpoint (Costs)**: `GET /adv/v1/upd` (WB UPD/Cost data)
**Таблицы**: `adv_daily_stats`, `adv_daily_cost`

| Поле WB API | Описание |
|-------------|----------|
| `sum` | Потрачено на рекламу за день (руб.) |
| `views` | Показы |
| `clicks` | Клики |
| `orders` | Заказы с рекламы |
| `updSum` | Стоимость по УПД |

### Трансформации бэкенда

1. **Ежедневный импорт**: Cron в 07:00 MSK
2. **Агрегация по date range**:
   ```sql
   totalSpend = SUM(spend) WHERE date BETWEEN :from AND :to
   ```

3. **ROAS/ROI расчёт (Story 33.5)**:
   ```typescript
   roas = revenue / spend           // Return on Ad Spend
   roi = (profit - spend) / spend   // Return on Investment
   ```

4. **Story 35.3: Organic vs Advertising split**:
   - `totalSales` = Все продажи (органика + реклама)
   - `organicSales` = totalSales - adRevenue
   - `organicContribution` = (organicSales / totalSales) × 100%

### Формула расчёта

```sql
-- Total spend за период:
totalSpend = SUM(spend) FROM adv_daily_stats
  WHERE cabinet_id = :cabinet_id
    AND date >= :from
    AND date <= :to

-- ROAS/ROI (per SKU or aggregate):
roas = CASE
  WHEN totalSpend > 0 THEN totalRevenue / totalSpend
  ELSE NULL
END

roi = CASE
  WHEN totalSpend > 0 THEN (totalProfit - totalSpend) / totalSpend
  ELSE NULL
END
```

### Бизнес-логика: Efficiency Classification

| Status | Условие | Рекомендация |
|--------|---------|--------------|
| `excellent` | ROAS > 5 | Масштабировать |
| `good` | ROAS 3-5 | Поддерживать |
| `moderate` | ROAS 1-3 | Оптимизировать |
| `poor` | ROAS 0.5-1 | Пересмотреть стратегию |
| `loss` | ROAS < 0.5 | Остановить |
| `unknown` | Нет данных | — |

**Файлы реализации**:
- `src/analytics/services/advertising-analytics.service.ts`
- `src/analytics/services/adv-campaign.service.ts`
- `docs/ADVERTISING-ANALYTICS-GUIDE.md`

---

## 6. payout_total (К перечислению)

### Источник данных

Агрегированные данные из `weekly_payout_summary`

### Трансформации бэкенда (Request #49 + #51)

**Формула WB Dashboard Compatible**:

```typescript
payout_total = toPayGoods
  - logisticsCost
  - storageCost
  - paidAcceptanceCost
  - penaltiesTotal
  - otherAdjustmentsNet
  - wbCommissionAdj
```

### Исходные поля

| Поле | Источник | Описание |
|------|----------|----------|
| `toPayGoods` | SUM(net_for_pay) | К перечислению за товар |
| `logisticsCost` | delivery + return | Стоимость логистики |
| `storageCost` | storage | Стоимость хранения |
| `paidAcceptanceCost` | paid_acceptance | Стоимость платной приёмки |
| `penaltiesTotal` | penalties | Общая сумма штрафов |
| `otherAdjustmentsNet` | corrections + other_adjustments | Прочие удержания |
| `wbCommissionAdj` | commission_other WHERE reason='Удержание' | Корректировка ВВ |

### Формула расчёта

```typescript
// src/aggregation/formulas/payout-total.formula.ts
export function calculatePayoutTotal(input: PayoutTotalInput): number {
  return (
    input.toPayGoods -
    input.logisticsCost -
    input.storageCost -
    input.paidAcceptanceCost -
    input.penaltiesTotal -
    input.otherAdjustmentsNet -
    input.wbCommissionAdj
  );
}
```

### Бизнес-логика

**КРИТИЧНО (Request #51)**: Фильтрация `wb_commission_adj`:

```sql
-- ПРАВИЛЬНО: только reason='Удержание'
SUM(CASE WHEN reason = 'Удержание' THEN ABS(commission_other) ELSE 0 END) as wb_commission_adj

-- НЕПРАВИЛЬНО: ВСЕ commission_other (двойной учёт!)
-- НЕ ИСПОЛЬЗОВАТЬ: SUM(ABS(commission_other)) as wb_commission_adj
```

| reason | Вычитаем? | Почему |
|--------|-----------|--------|
| Продажа | Нет | Уже в total_commission_rub |
| Возврат | Нет | Уже в total_commission_rub |
| Возмещение за ПВЗ | Нет | Это ДОХОД |
| **Удержание** | **Да** | Реальное удержание = "Корректировка ВВ" |

**Пример W49 (1-7 Dec 2025)**:
```
toPayGoods = 135,186.71₽
logisticsCost = 26,139.82₽
storageCost = 1,923.34₽
paidAcceptanceCost = 0₽
penaltiesTotal = 0₽
otherAdjustmentsNet = 51,063.00₽
wbCommissionAdj = 2,153.28₽
━━━━━━━━━━━━━━━━━━━━━━━━
payout_total = 53,907.27₽ ✓ WB Dashboard EXACT MATCH
```

**Файлы реализации**:
- `src/aggregation/formulas/payout-total.formula.ts`
- `src/aggregation/weekly-payout-aggregator.service.ts:477-499`

---

## 7. margin_percent (Маржинальность)

### Источник данных

- Revenue: `weekly_margin_fact.revenue_net_rub`
- COGS: `weekly_margin_fact.cogs_rub`

### Трансформации бэкенда (Story 10.4)

1. **Revenue calculation**: SUM(net_for_pay) для sales - returns
2. **COGS lookup**: Temporal versioning (Week Midpoint)
3. **Margin calculation**:
   ```typescript
   gross_profit = revenue_net - cogs
   margin_percent = (gross_profit / |revenue_net|) × 100
   markup_percent = (gross_profit / |cogs|) × 100
   ```

### Формула расчёта

```typescript
// src/analytics/services/margin-calculation.service.ts:605-622
calculateMargins(revenue: RevenueData, cogs: CogsData): MarginMetrics {
  const grossProfitRub = revenue.revenueNetRub.minus(cogs.cogsRub);

  // Margin %: (profit / revenue) × 100%
  const marginPercent = revenue.revenueNetRub.equals(0)
    ? new Decimal(0)
    : grossProfitRub.div(revenue.revenueNetRub.abs()).mul(100);

  // Markup %: (profit / cogs) × 100%
  const markupPercent = cogs.cogsRub.equals(0)
    ? new Decimal(0)
    : grossProfitRub.div(cogs.cogsRub.abs()).mul(100);

  return { grossProfitRub, marginPercent, markupPercent };
}
```

### Бизнес-логика

- **Zero revenue**: margin% = 0 (деление на ноль)
- **Zero COGS**: markup% = 0 (деление на ноль)
- **Negative values**: Допускаются (убыток)
- **Gross profit = 100% coverage ONLY**: `gross_profit` показывается только при `cogs_coverage_pct = 100%`

**Файлы реализации**:
- `src/analytics/services/margin-calculation.service.ts`
- `docs/stories/epic-10/story-10.4-margin-profit-calculation.md`

---

## 8. operating_profit (Операционная прибыль)

### Источник данных (Epic 26)

- Gross profit: `weekly_margin_fact.gross_profit_rub`
- Expenses: Агрегация из `wb_finance_raw`
- Storage: `paid_storage_daily` (Request #65)

### Трансформации бэкенда

1. **Агрегация расходов по SKU**:
   ```typescript
   total_expenses = logistics
     + storage
     + paid_acceptance
     + penalties
     + loyalty_fee
     + commission_deductible    // только reason='Удержание'
     + other_adjustments
     - loyalty_compensation     // компенсация уменьшает расходы
   ```

2. **ИСКЛЮЧЕНО из total_expenses** (уже в net_for_pay):
   - `acquiring_fee`
   - `commission_sales`

3. **Operating profit**:
   ```typescript
   operating_profit = gross_profit - total_expenses
   operating_margin% = (operating_profit / |revenue|) × 100%
   ```

### Формула расчёта

```typescript
// src/analytics/services/margin-calculation.service.ts:634-664
calculateOperatingMetrics(revenue, cogs, expenses): OperatingMetrics {
  const basicMetrics = this.calculateMargins(revenue, cogs);

  const operatingProfitRub = basicMetrics.grossProfitRub
    .minus(expenses.totalExpensesRub);

  const operatingMarginPercent = revenue.revenueNetRub.equals(0)
    ? new Decimal(0)
    : operatingProfitRub.div(revenue.revenueNetRub.abs()).mul(100);

  return {
    ...basicMetrics,
    logisticsCostRub: expenses.logisticsCostRub,
    storageCostRub: expenses.storageCostRub,
    // ... other expense fields
    totalExpensesRub: expenses.totalExpensesRub,
    operatingProfitRub,
    operatingMarginPercent,
  };
}
```

### Бизнес-логика

**Total Expenses Formula (per SKU)**:
```typescript
// src/analytics/services/margin-calculation.service.ts:522-532
totalExpensesRub = logisticsCostRub
  .plus(storageCostRub)         // Request #65: from paid_storage_daily
  .plus(paidAcceptanceCostRub)
  .plus(penaltiesRub)
  // acquiringFeeRub - EXCLUDED (already in net_for_pay)
  .plus(loyaltyFeeRub)
  .plus(commissionRub)          // Only 'Удержание' type
  .minus(loyaltyCompensationRub) // Compensation reduces expenses
  .plus(otherAdjustmentsRub.abs());
```

**Request #65: Storage Cost Source Change**:
- Проблема: `wb_finance_raw.storage` = 0 для конкретных SKU (относится к `nm_id='UNKNOWN'`)
- Решение: `paid_storage_daily` как источник per-SKU хранения

**Файлы реализации**:
- `src/analytics/services/margin-calculation.service.ts:416-544`
- `docs/epics/epic-26-per-sku-operating-profit.md`

---

## Сводная таблица источников данных

| Метрика | WB API Endpoint | Таблица БД | Агрегация |
|---------|-----------------|------------|-----------|
| `wb_sales_gross_total` | `reportDetailByPeriod` | `wb_finance_raw` | SUM по неделе |
| `cogs_total` | — (ручной ввод) | `cogs` | SUM(unit_cost × qty) |
| `logistics_cost_total` | `reportDetailByPeriod` | `wb_finance_raw` | SUM по report_id |
| `storage_cost_total` | `warehouses/stock/paid` | `paid_storage_daily` | SUM по дням недели |
| `advertising.totalSpend` | `adv/v2/stat`, `adv/v1/upd` | `adv_daily_stats` | SUM по date range |
| `payout_total` | — (расчётное) | `weekly_payout_summary` | Formula |
| `margin_percent` | — (расчётное) | `weekly_margin_fact` | Per-SKU calculation |
| `operating_profit` | — (расчётное) | `weekly_margin_fact` | Per-SKU calculation |

---

## Ключевые бизнес-правила

### 1. Знаковая конвенция (Sign Convention)

- WB Excel использует **ПОЛОЖИТЕЛЬНЫЕ знаки** для выплат
- Импортируем значения **AS-IS**, НЕ инвертируем
- Расходы хранятся как положительные, вычитаются в формулах

### 2. Временная зона

- Все даты в **Europe/Moscow** (MSK)
- ISO-недели: понедельник — воскресенье
- Week midpoint: четверг (для COGS lookup)

### 3. Multi-tenancy

- Все данные изолированы по `cabinet_id`
- JWT claims проверяются для каждого запроса
- Cascade delete для связанных данных

### 4. Точность расчётов

- Decimal precision: `Decimal(15, 2)` для денежных полей
- Округление: 2 знака после запятой для отображения
- Проценты: округление до 0.01%

---

## Связанная документация

| Документ | Описание |
|----------|----------|
| `docs/BUSINESS-LOGIC-REFERENCE.md` | Полный справочник бизнес-логики |
| `docs/architecture/04-data-models.md` | Модели данных |
| `docs/API-PATHS-REFERENCE.md` | API endpoints |
| `docs/STORAGE-API-GUIDE.md` | Storage Analytics API |
| `docs/ADVERTISING-ANALYTICS-GUIDE.md` | Advertising Analytics |
| `docs/epics/epic-26-per-sku-operating-profit.md` | Operating Profit Epic |

---

**Последнее обновление**: 2026-02-01
**Автор**: Backend Team (Claude Code Generation)

# Request #156: FBS Products Showing Storage Costs Despite No FBO Stock

## Problem Summary

Продукты категории "шпатлевка" (SP*) показывают затраты на хранение в аналитике, хотя:
1. Это FBS-товары (по словам продавца)
2. В `supply-planning` API у них **нет FBO остатков**
3. Но WB API "Платное хранение" возвращает данные о хранении на складах WB

---

## Evidence

### 1. WB Paid Storage Report (2026-02-13 - 2026-02-26)

Из выгрузки WB "Отчёт по платному хранению (номенклатуры)":

| Дата | Склад | Артикул | nm_id | Способ расчёта | Сумма |
|------|-------|---------|-------|----------------|-------|
| 2026-02-13 | Коледино | SP60PRO | 721654518 | короба: товары ниже базы | 0.10 ₽ |
| 2026-02-14 | Коледино | SP60PRO | 721654518 | короба: товары ниже базы | 0.10 ₽ |
| 2026-02-15 | Электросталь | SP30EVA | 721608415 | короба: товары ниже базы | 0.08 ₽ |
| 2026-02-21 | Белая дача | SP60EVA | 721620321 | короба: товары ниже базы | 0.13 ₽ |

**Способ расчёта = "короба: товары ниже базы"** — это **хранение на складе WB**, не приёмка.

### 2. Supply-Planning API Response

```bash
GET /v1/analytics/supply-planning?limit=100

---

## Backend Team Response

**Status**: RESOLVED (documented behavior)
**Resolution date**: 2026-03-29
**Summary**: FBS products showing storage costs is correct behavior - WB charges storage for FBS items that have physical stock at WB warehouses (stock transferred for fulfillment). The "короба: товары ниже базы" calculation method confirms these are legitimate storage charges, not a data error. Supply-planning API shows no FBO stock because items are FBS-fulfilled but stored at WB warehouses.
**Remaining frontend action**: None - this is expected behavior. Consider adding UI explanation that FBS items can incur storage costs at WB warehouses.
```

**Результат:** Только 1 товар (ter-13) с `current_stock: 0`.

**Шпатлевки ОТСУТСТВУЮТ в supply-planning:**

| Артикул | nm_id | В supply-planning | current_stock |
|---------|-------|-------------------|---------------|
| SP60PRO | 721654518 | ❌ НЕТ | — |
| SP30EVA | 721608415 | ❌ НЕТ | — |
| SP60EVA | 721620321 | ❌ НЕТ | — |
| SP30PRO | 721633014 | ❌ НЕТ | — |

### 3. Storage Analytics API Response

```bash
GET /v1/analytics/storage/by-sku?weekStart=2026-W07&weekEnd=2026-W07
```

**Результат:** Шпатлевки ЕСТЬ в storage analytics:

| nm_id | vendor_code | storage_cost_total | warehouses | days_stored |
|-------|-------------|--------------------| -----------|-------------|
| 721654518 | SP60PRO | 0.6 ₽ | Коледино | 6 |
| 721608415 | SP30EVA | 0.08 ₽ | Электросталь | 1 |

### 4. SKU Financials API Response

```bash
GET /v1/analytics/sku-financials?week=2026-W07
```

**Результат:**

| nm_id | sa_name | expenses.storage | expenses.storage_source |
|-------|---------|------------------|-------------------------|
| 721608415 | sp30eva | 0.08 ₽ | paid_storage_api |
| 721654518 | sp60pro | 0.6 ₽ | paid_storage_api |

---

## The Paradox

| Источник данных | Что показывает |
|-----------------|----------------|
| **WB Paid Storage API** | Хранение на складах WB (Коледино, Электросталь, Белая дача) |
| **Our supply-planning** | Нет FBO остатков для этих товаров |
| **Our storage/by-sku** | Есть затраты на хранение |

---

## Questions for Backend Team

### 1. Supply-Planning Data Source

Откуда берутся данные для `supply-planning`?
- WB API `analytics.getStocksByOffice()`?
- Таблица `inventory_snapshots`?
- Другой источник?

**Проблема:** Почему шпатлевки не попадают в supply-planning, если WB начисляет хранение?

### 2. Inventory Snapshots Sync

Есть ли данные в таблице `inventory_snapshots` для nm_id: 721654518, 721608415, 721620321, 721633014?

```sql
SELECT nm_id, date, total_stock, on_warehouse, in_way_to_client, in_way_from_client
FROM inventory_snapshots
WHERE nm_id IN ('721654518', '721608415', '721620321', '721633014')
ORDER BY date DESC
LIMIT 20;
```

### 3. Paid Storage vs Stock Correlation

Есть ли логика, которая связывает `paid_storage_daily` с остатками на складе?

**Гипотеза:** Товар может быть в `paid_storage_daily` (хранение), но не в `inventory_snapshots` (остатки) если:
- Возвраты, которые ещё не пересортированы
- Кросс-докинг
- Ошибка WB API

### 4. FBS vs FBO Detection

Есть ли в системе определение типа выполнения (FBO/FBS) для каждого товара?
- По `warehouseType` из orders?
- По наличию в `inventory_snapshots`?
- Другой метод?

---

## Possible Root Causes

### A. Data Sync Issue
- `inventory_snapshots` не синхронизируется для FBS-товаров
- Но `paid_storage_daily` импортируется для всех

### B. WB API Inconsistency
- WB API "Платное хранение" возвращает данные для FBS-товаров
- WB API "Stocks" не возвращает остатки для этих товаров
- Это баг WB или особенность?

### C. Returns/Cross-docking
- Возвраты лежат на складе WB → начисляется хранение
- Но в "Stocks API" они не учитываются

---

## Recommended Investigation Steps

1. **Проверить `inventory_snapshots`** — есть ли записи для шпатлевок?

2. **Проверить WB Stocks API** — что возвращает WB для этих nm_id?

3. **Сравнить даты** — когда появилось хранение vs когда были остатки?

4. **Проверить orders** — есть ли FBO заказы для этих товаров?

```sql
-- Check for FBO orders for these products
SELECT nm_id, COUNT(*) as order_count, SUM(total_price) as revenue
FROM orders_fbs
WHERE nm_id IN ('721654518', '721608415', '721620321', '721633014')
GROUP BY nm_id;
```

---

## Impact

- **User confusion:** Пользователи видят хранение для "FBS-товаров"
- **Margin accuracy:** Marginality может быть искажена
- **Decision making:** Неправильные выводы о складских расходах

---

## Priority

**Medium** — влияет на точность аналитики, но суммы небольшие

---

## Related

- Epic 24: Paid Storage Analytics
- Epic 27: Supply Planning
- Epic 31: SKU Financials
- Table: `paid_storage_daily`, `inventory_snapshots`

---

## Attachments

- WB Report: `frontend/docs/screenshots/Отчет по платному хранению (номенклатуры) за 2026-02-13 - 2026-02-26.xlsx`

---

---

## Backend Investigation Results (2026-02-27)

### Root Cause Analysis

**ВЫВОД: Ошибочного поведения НЕТ. Данные корректны.**

#### 1. Inventory Snapshots Data (Actual Stock Levels)

| nm_id | vendor_code | total_stock | in_way_to_client | last_stock_date | warehouse |
|-------|-------------|-------------|------------------|-----------------|-----------|
| 721654518 | SP60PRO | 0 | 2 | 2026-02-05 | Коледино |
| 721608415 | SP30EVA | 0 | 10 | None | - |
| 721620321 | SP60EVA | 0 | 4 | 2026-02-21 | Белая дача |
| 721633014 | SP30PRO | 0 | 1 | None | - |

**Ключевые факты:**
- Все 4 SKU имеют **total_stock = 0** (нет остатков на складах WB)
- `in_way_to_client` = товары УЖЕ ПРОДАНЫ и едут к клиентам
- Последний товар с остатком (721620321) был продан между 2026-02-21 и 2026-02-26

#### 2. Paid Storage Daily Data (Charges History)

| nm_id | last_charge_date | warehouse | amount | days_charged |
|-------|------------------|-----------|--------|--------------|
| 721654518 | 2026-02-14 | Коледино | 0.10₽ | 6 дней |
| 721608415 | 2026-02-15 | Электросталь | 0.08₽ | 1 день |
| 721620321 | 2026-02-21 | Белая дача | 0.13₽ | 1 день |
| 721633014 | Нет | - | 0₽ | 0 дней |

**Ключевые факты:**
- `paid_storage_daily` показывает **историю начислений**, не текущие остатки
- Начисления прекратились когда товар был продан (нет остатков = нет оплаты)
- Последняя оплата 2026-02-21 для 721620321 — после этого stock = 0

#### 3. Timeline for SP60PRO (721654518)

```
2026-02-05: total_stock=1 (последний остаток на складе Коледино)
2026-02-10: paid_storage_daily = 0.10₽ (хранение)
2026-02-14: paid_storage_daily = 0.10₽ (последнее начисление — конец биллингового периода)
2026-02-17: total_stock=0 (товар продан)
2026-02-26: total_stock=0, in_way_to_client=2 (только в пути к клиенту)
```

#### 4. Why Supply-Planning Shows 0

**Supply-planning API использует `inventory_snapshots` как источник данных:**
```typescript
// src/analytics/services/supply-planning.service.ts:166
const stocks = await this.getLatestStocks(cabinetId); // queries inventory_snapshots
```

**inventory_snapshots корректно показывает total_stock=0** — товаров на складе нет.

#### 5. The Misunderstanding

Фронтенд предположил:
> "Exists in paid_storage_daily (storage is charged)"

**Неверно!** `paid_storage_daily` — это **история начислений** за хранение. Когда товар продан:
- WB перестаёт начислять хранение (остатков = нет)
- `paid_storage_daily` перестаёт получать записи
- Последняя запись = конец биллингового периода, не наличие товара

---

## Conclusion

| Вопрос | Ответ |
|--------|-------|
| Шпатлевки есть в `inventory_snapshots`? | ✅ ДА, и корректно показывают total_stock=0 |
| Почему `paid_storage_daily` имеет записи? | Это история начислений за ПРЕДЫДУЩИЕ периоды когда товар был на складе |
| Почему `supply-planning` показывает 0? | ✅ ПРАВИЛЬНО — товаров на складе нет |
| Есть ли баг? | ❌ НЕТ — данные корректны |

---

## Recommendations for Frontend

1. **Clarify data source meaning:**
   - `paid_storage_daily` = storage charges history, NOT current stock
   - `inventory_snapshots` = current stock levels (correct source)
   - Storage charges continue for a billing period AFTER stock sells

2. **Update UI to show:**
   - "Last storage charge: 2026-02-14" instead of implying current storage
   - Distinguish between "has storage costs" vs "has stock in warehouse"

3. **Consider adding:**
   - Date of last storage charge in storage analytics
   - "No current warehouse stock" indicator when total_stock=0 but in_way_to_client>0

---

*Created: 2026-02-27*
*Reporter: Frontend Team*
*Backend Investigation: 2026-02-27*
*Status: RESOLVED - No bug, data is correct*

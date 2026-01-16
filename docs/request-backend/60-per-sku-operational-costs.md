# Request #60: Per-SKU Operational Costs in by-sku Endpoint

## Дата
2025-12-14

## Статус
✅ **IMPLEMENTED** (Epic 30 - 2025-12-14)

**Реализовано:**
- `storage_cost` - теперь берётся из `paid_storage_daily` (Epic 24)
- `storage_data_source` - индикатор источника данных (`"paid_storage_api"` или `"unavailable"`)
- `advertising_cost` - placeholder (null)
- `net_profit` - чистая прибыль = revenue_net - cogs - logistics - storage - penalties
- `net_margin_pct` - чистая маржа = (net_profit / revenue_net) × 100%

**Файлы изменены:**
- `src/analytics/weekly-analytics.service.ts` - SQL JOIN с paid_storage_daily
- `src/analytics/dto/response/sku-analytics.dto.ts` - новые поля DTO

**Документация:**
- `docs/epics/epic-30-per-sku-storage-costs-integration.md`
- `docs/stories/epic-30/`

---

## Контекст

Страница `/analytics/sku` показывает маржинальность по каждому SKU, но текущий расчёт использует только COGS без учёта операционных расходов:

```
Текущая формула:
profit = revenue_net - cogs
margin_pct = profit / revenue_net × 100
```

Это приводит к **завышенной марже** (например, 68% вместо реальных ~7.6%), потому что не учитываются:
- Логистика (доставка + возврат) per SKU
- Хранение per SKU
- Штрафы per SKU
- (будущее) Реклама per SKU

## Текущее состояние

Endpoint `GET /v1/analytics/weekly/by-sku` возвращает поля:
```json
{
  "logistics_cost": 0,   // ← всегда 0
  "storage_cost": 0,     // ← всегда 0
  "penalties": 0         // ← всегда 0
}
```

Но эти поля не заполняются реальными данными.

## Требования

### 1. Логистика per SKU (`logistics_cost`)

**Источник данных**: `wb_finance_raw`

```sql
-- Доставка покупателю
SELECT nm_id, SUM(ABS(logistics_delivery)) as delivery_cost
FROM wb_finance_raw
WHERE sale_dt BETWEEN week_start AND week_end
  AND cabinet_id = ?
  AND qty > 0  -- товарные операции
GROUP BY nm_id

-- Возврат
SELECT nm_id, SUM(ABS(logistics_return)) as return_cost
FROM wb_finance_raw
WHERE sale_dt BETWEEN week_start AND week_end
  AND cabinet_id = ?
  AND qty > 0
GROUP BY nm_id

logistics_cost = delivery_cost + return_cost
```

### 2. Хранение per SKU (`storage_cost`)

**Источник данных**: `paid_storage_daily` (Epic 24)

```sql
SELECT nm_id, SUM(warehouse_price) as storage_cost
FROM paid_storage_daily
WHERE date BETWEEN week_start AND week_end
  AND cabinet_id = ?
GROUP BY nm_id
```

### 3. Штрафы per SKU (`penalties`)

**Источник данных**: `wb_finance_raw`

```sql
SELECT nm_id, SUM(ABS(penalties)) as penalties
FROM wb_finance_raw
WHERE sale_dt BETWEEN week_start AND week_end
  AND cabinet_id = ?
  AND nm_id IS NOT NULL
GROUP BY nm_id
```

### 4. (Placeholder) Реклама per SKU (`advertising_cost`)

**Будущее поле** - будет добавлено позже при интеграции рекламных данных.

Пока вернуть `advertising_cost: null` или `advertising_cost: 0`.

### 5. Обновлённый расчёт profit и margin

```
net_profit = revenue_net - cogs - logistics_cost - storage_cost - penalties - (advertising_cost || 0)
net_margin_pct = net_profit / revenue_net × 100
```

## Ожидаемый формат ответа

```json
{
  "data": [
    {
      "nm_id": "147205694",
      "sa_name": "ll-20-bl",
      "total_units": 51,
      "revenue_gross": 14074.60,
      "revenue_net": 14074.60,

      // Операционные расходы per SKU
      "logistics_cost": 1523.45,      // ← заполнено
      "storage_cost": 234.12,         // ← заполнено
      "penalties": 0,                 // ← заполнено
      "advertising_cost": null,       // ← placeholder для будущего

      // COGS
      "cogs": 4488,
      "missing_cogs_flag": false,

      // Старые поля (для обратной совместимости)
      "profit": 9586.6,               // gross profit = revenue_net - cogs
      "margin_pct": 68.11,            // gross margin

      // Новые поля - чистая прибыль
      "net_profit": 7829.03,          // = revenue_net - cogs - logistics - storage - penalties
      "net_margin_pct": 55.62,        // = net_profit / revenue_net × 100

      // ... остальные поля
    }
  ]
}
```

## Проверка корректности

Сумма per-SKU должна примерно соответствовать (с погрешностью для записей без nm_id):

```
SUM(logistics_cost) ≈ summary_total.logistics_cost
SUM(storage_cost) ≈ summary_total.storage_cost (приблизительно)
SUM(penalties) ≈ summary_total.penalties_total
```

## W49 Пример для валидации

Ожидаемые агрегаты для W49:
- `logistics_cost_total`: 26,571.98₽
- `storage_cost_total`: 1,923.34₽
- `penalties_total`: 0₽

## Приоритет

**Высокий** - текущий расчёт маржи вводит пользователей в заблуждение.

## Связанные задачи

- Epic 24: Paid Storage Analytics (уже реализовано)
- Будущее: Integration с рекламными данными WB

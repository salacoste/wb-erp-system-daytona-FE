# FBS Data Analysis Report - Анализ данных FBS

**Дата:** 2026-01-31
**Статус:** ✅ Инфраструктура готова, требуется синхронизация данных

---

## Резюме

**Инфраструктура FBS полностью реализована.** Проблема "Orders = 0" — это отсутствие синхронизированных данных в таблице `OrderFbs`, а не баг API.

---

## 1. Текущее состояние инфраструктуры

### 1.1 Схема базы данных

| Таблица | Статус | Описание |
|---------|--------|----------|
| `orders_fbs` | ✅ Существует | Основная таблица FBS заказов |
| `order_status_history` | ✅ Существует | История статусов заказов |
| `order_wb_status_history` | ✅ Существует | Нативная история WB статусов |
| `supplies` | ✅ Существует | Поставки FBS |
| `supply_orders` | ✅ Существует | Связь поставок и заказов |

### 1.2 API Endpoints (Epic 40 - COMPLETE)

| Endpoint | Метод | Статус | Описание |
|----------|-------|--------|----------|
| `/v1/orders/sync` | POST | ✅ | Ручной запуск синхронизации |
| `/v1/orders/sync-status` | GET | ✅ | Статус синхронизации |
| `/v1/orders` | GET | ✅ | Список заказов (до 90 дней) |
| `/v1/orders/:id` | GET | ✅ | Детали заказа |
| `/v1/orders/:id/history` | GET | ✅ | Локальная история статусов |
| `/v1/orders/:id/wb-history` | GET | ✅ | Нативная WB история |
| `/v1/analytics/orders/volume` | GET | ✅ | Аналитика объёма заказов |
| `/v1/analytics/orders/sla` | GET | ✅ | SLA метрики |

### 1.3 Background Jobs (BullMQ)

| Очередь | Интервал | Статус |
|---------|----------|--------|
| `orders-fbs-sync` | Каждые 5 минут | ✅ Настроена |

---

## 2. Текущее состояние данных

### 2.1 Проблема

**Таблица `OrderFbs` практически пуста за период W04 (19-25 января).**

| Период | Количество заказов |
|--------|-------------------|
| 19-24 января | **0 заказов** |
| 25 января | 2 заказа |
| Всего за январь | ~8 заказов |

### 2.2 Причина

FBS синхронизация была включена **позже**, поэтому исторические данные за январь отсутствуют.

**Важно понимать**: Данные в `OrderFbs` и `WbFinanceRaw` — это **РАЗНЫЕ источники**:

| Источник | Что содержит | API |
|----------|--------------|-----|
| `OrderFbs` | FBS заказы в реальном времени | `/v1/analytics/orders/volume` |
| `WbFinanceRaw` | Финансовые транзакции из отчётов | `/v1/analytics/weekly/finance-summary` |

---

## 3. Как получить FBS данные

### 3.1 Запустить синхронизацию (для новых заказов)

```http
POST /v1/orders/sync
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

**Ответ:**
```json
{
  "jobId": "orders-fbs-sync:uuid:timestamp",
  "message": "Orders sync job enqueued"
}
```

### 3.2 Проверить статус синхронизации

```http
GET /v1/orders/sync-status
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

**Ответ:**
```json
{
  "enabled": true,
  "lastSyncAt": "2026-01-31T10:00:00.000Z",
  "nextSyncAt": "2026-01-31T10:05:00.000Z",
  "schedule": "Every 5 minutes",
  "timezone": "Europe/Moscow"
}
```

### 3.3 Получить заказы

```http
GET /v1/orders?from=2026-01-01&to=2026-01-31
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

**Ответ:**
```json
{
  "items": [
    {
      "orderId": "1234567890",
      "nmId": 12345678,
      "vendorCode": "SKU-ABC-001",
      "productName": "Product Name",
      "price": 1500.00,
      "salePrice": 1200.00,
      "supplierStatus": "new",
      "wbStatus": "waiting",
      "createdAt": "2026-01-25T10:30:00.000Z"
    }
  ],
  "pagination": { "total": 8, "limit": 100, "offset": 0 },
  "query": { "from": "2026-01-01", "to": "2026-01-31" }
}
```

### 3.4 Получить аналитику объёма

```http
GET /v1/analytics/orders/volume?from=2026-01-19&to=2026-01-25
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

**Ответ (если данные есть):**
```json
{
  "hourlyTrend": [{ "hour": 14, "count": 25 }],
  "dailyTrend": [{ "date": "2026-01-25", "count": 2 }],
  "peakHours": [14, 15, 13],
  "cancellationRate": 0.0,
  "b2bPercentage": 0.0,
  "totalOrders": 2,
  "statusBreakdown": [
    { "status": "new", "count": 2, "percentage": 100.0 }
  ],
  "period": { "from": "2026-01-19", "to": "2026-01-25" }
}
```

---

## 4. Рекомендации для Frontend

### 4.1 Обработка Orders = 0

**Вариант A: Показывать пустое состояние**

```typescript
if (ordersVolume.totalOrders === 0) {
  return (
    <Card title="Заказы FBS">
      <EmptyState
        icon={<OrdersIcon />}
        message="Нет данных FBS за выбранный период"
        description="Данные появятся после синхронизации заказов"
      />
    </Card>
  );
}
```

**Вариант B: Использовать product_transactions как альтернативу**

```typescript
// Если FBS заказов нет, показать транзакции продаж
const ordersCount = ordersVolume.totalOrders > 0
  ? ordersVolume.totalOrders
  : financeSummary.summary_total?.transaction_count_total ?? 0;

const ordersLabel = ordersVolume.totalOrders > 0
  ? "Заказы FBS"
  : "Транзакции (продажи)";
```

### 4.2 Разделить метрики

| Карточка | Источник данных | Эндпоинт |
|----------|-----------------|----------|
| **Заказы FBS** | `OrderFbs` | `/v1/analytics/orders/volume` |
| **Выкупы (Sales)** | `WbFinanceRaw` | `/v1/analytics/weekly/finance-summary` |

### 4.3 Формула теоретической прибыли

**Проблема:** При Orders = 0 формула даёт отрицательный результат.

```
// НЕПРАВИЛЬНО при Orders = 0:
Теор.прибыль = Заказы - COGS - Реклама - Логистика - Хранение
             = 0 - 35818 - 3728.55 - 17566.04 - 2024.94
             = -59137.53 ₽  // ❌ Неверно!
```

**Правильная формула (использовать Sales):**

```typescript
// ПРАВИЛЬНО - использовать Выкупы вместо Заказов:
const theoreticalProfit =
  financeSummary.summary_total.wb_sales_gross_total
  - financeSummary.summary_total.cogs_total
  - advertisingData.summary.totalSpend
  - financeSummary.summary_total.logistics_cost_total
  - financeSummary.summary_total.storage_cost_total;

// W04: 84377.52 - 35818 - 3728.55 - 17566.04 - 2024.94 = 25239.99 ₽ ✅
```

---

## 5. Синхронизация исторических данных

### 5.1 Ограничения WB API

| Параметр | Значение |
|----------|----------|
| Максимальный период | **90 дней** |
| Формат даты | ISO 8601 (YYYY-MM-DD) |

### 5.2 Запрос исторических данных

```http
# Получить заказы за последние 90 дней
GET /v1/orders?from=2025-11-01&to=2026-01-31&limit=1000
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

### 5.3 Backfill процедура

Если нужно загрузить исторические данные:

1. **Запустить ручную синхронизацию:**
   ```http
   POST /v1/orders/sync
   ```

2. **Проверить результат:**
   ```http
   GET /v1/orders/sync-status
   ```

3. **Получить заказы:**
   ```http
   GET /v1/orders?from=2025-11-01&to=2026-01-31
   ```

---

## 6. Итоги

### Что есть:
- ✅ Полная схема БД для FBS
- ✅ Все API эндпоинты реализованы
- ✅ Автоматическая синхронизация каждые 5 минут
- ✅ Analytics API для объёма, SLA, трендов

### Что требуется:
- ⚠️ Запустить синхронизацию для кабинета
- ⚠️ Frontend: обработать случай Orders = 0
- ⚠️ Frontend: использовать Sales вместо Orders в формуле прибыли

---

## 7. Связанная документация

| Документ | Описание |
|----------|----------|
| [121-DASHBOARD-MAIN-PAGE-ORDERS-API.md](./121-DASHBOARD-MAIN-PAGE-ORDERS-API.md) | Orders API документация |
| [128-DASHBOARD-QA-VERIFICATION-REPORT.md](./128-DASHBOARD-QA-VERIFICATION-REPORT.md) | QA отчёт W04 |
| [130-DASHBOARD-FBO-ORDERS-API.md](./130-DASHBOARD-FBO-ORDERS-API.md) | **Epic 60** - FBO/FBS разделение (PENDING) |
| `test-api/14-orders.http` | HTTP тесты FBS API |
| `docs/ORDERS-FBS-SYNC-GUIDE.md` | Руководство по синхронизации |

### Epic 60: FBO/FBS Analytics (COMPLETE)

**Статус:** ✅ COMPLETE (34 SP, 6 stories) - Реализовано 2026-02-01

Epic 60 решил проблему отсутствия FBO данных путём:
1. Синхронизации данных из WB Reports API (`getSupplierOrders`, `getSupplierSales`)
2. Разделения по `warehouseType` ("Склад WB" → FBO, "Склад продавца" → FBS)
3. Агрегации в таблице `fbo_fbs_analytics_daily`
4. Нового API `/v1/analytics/fulfillment/*` с FBO/FBS метриками

**Исправление FBS Empty State (2026-02-01):**
- `/v1/analytics/fulfillment/summary` теперь корректно возвращает `fbs.ordersCount` из таблицы `OrderFbs` как fallback
- До исправления: `fbs.ordersCount: 0`
- После исправления: `fbs.ordersCount: N` (реальное количество FBS заказов)

См. [130-DASHBOARD-FBO-ORDERS-API.md](./130-DASHBOARD-FBO-ORDERS-API.md) для полной спецификации.

---

**Заключение:** Backend полностью готов. Требуется:
1. Активировать синхронизацию FBS для кабинета
2. Обновить Frontend для корректной работы при отсутствии FBS данных

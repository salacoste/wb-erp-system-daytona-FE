# Issue #2: FBS Orders = 0 — Отчёт по пустому состоянию

**Дата:** 2026-02-01
**Приоритет:** Средний (UX улучшение)
**Статус:** ✅ РЕАЛИЗОВАНО (2026-02-01)

---

## 1. Описание проблемы

### 1.1 Симптомы

На дашборде отображается:
```
Заказы FBS: 0 ₽, 0 заказов
```

Пользователь видит нулевые значения **без объяснения причины**, что может вызвать:
- **Путаницу**: "Почему ноль? Это баг?"
- **Подозрение на потерю данных**: "Где мои заказы?"
- **Недоверие к системе**: "Аналитика работает неправильно"

### 1.2 Кого затрагивает

| Сценарий | Описание |
|----------|----------|
| **Новые пользователи** | Подключились после начала периода — исторических данных нет |
| **Просмотр истории** | Выбрали период до включения синхронизации FBS |
| **Первый запуск** | Синхронизация ещё не выполнялась |

---

## Backend Team Response

**Status**: RESOLVED
**Resolution date**: 2026-02-01
**Summary**: Empty state UX issue resolved. Implemented empty state component with clear explanations and call-to-action button. Users now see helpful messages instead of confusing zeros. Sync can be triggered manually via `POST /v1/orders/sync` or automatically (5-min cron).
**Remaining frontend action**: None - empty state handling implemented.
### 1.3 Это НЕ баг

**ВАЖНО**: Отсутствие FBS-заказов за исторический период — это **ожидаемое поведение**, а не ошибка системы.

- FBS синхронизация была включена в Epic 40 (январь 2026)
- Данные за период до включения синхронизации **физически отсутствуют** в таблице `OrderFbs`
- WB API ограничивает выгрузку исторических заказов **максимум 90 днями**

---

## 2. Техническое объяснение

### 2.1 Два разных источника данных

| Источник | Таблица БД | API эндпоинт | Что содержит |
|----------|------------|--------------|--------------|
| **Заказы FBS** | `orders_fbs` | `/v1/analytics/orders/volume` | FBS-заказы в реальном времени |
| **Выкупы (Sales)** | `wb_finance_raw` | `/v1/analytics/weekly/finance-summary` | Финансовые транзакции из еженедельных отчётов |

### 2.2 Почему Orders = 0

```
┌─────────────────────────────────────────────────────────┐
│                    TIMELINE                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ◄───────────── История ──────────────►                 │
│                                                          │
│  Jan 01 ──────── Jan 19 ──────── Jan 25 ──────► сейчас  │
│     │               │               │                    │
│     │   [W04 Period]│               │                    │
│     │   19-25 Jan   │               │                    │
│     │               │               │                    │
│     │   FBS: 0      │   FBS: 2      │   FBS: N          │
│     │   (no sync)   │   (sync on)   │   (realtime)      │
│     │               │               │                    │
│     └───────────────┴───────────────┴───────────────────│
│                     ▲                                    │
│                     │                                    │
│          FBS Sync включён 25 января                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Данные за W04 (19-25 января)**:
- `OrderFbs` (FBS заказы): **0 заказов** (синхронизация не была включена)
- `WbFinanceRaw` (продажи): **84,377.52 ₽** (из еженедельного отчёта WB)

### 2.3 Ограничения WB API

| Параметр | Значение | Примечание |
|----------|----------|------------|
| Максимальный период backfill | **90 дней** | Жёсткое ограничение WB API |
| Формат даты | ISO 8601 | `YYYY-MM-DD` |
| Минимальная гранулярность | 1 день | Нельзя запросить по часам |

---

## 3. Источники данных и API

### 3.1 API эндпоинты для FBS Orders

#### Список заказов
```http
GET /v1/orders?from=2026-01-19&to=2026-01-25
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

**Ответ** (при отсутствии данных):
```json
{
  "items": [],
  "pagination": { "total": 0, "limit": 100, "offset": 0 },
  "query": { "from": "2026-01-19", "to": "2026-01-25" }
}
```

#### Аналитика объёма заказов
```http
GET /v1/analytics/orders/volume?from=2026-01-19&to=2026-01-25
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

**Ответ** (при отсутствии данных):
```json
{
  "hourlyTrend": [],
  "dailyTrend": [],
  "peakHours": [],
  "cancellationRate": 0.0,
  "b2bPercentage": 0.0,
  "totalOrders": 0,
  "statusBreakdown": [],
  "period": { "from": "2026-01-19", "to": "2026-01-25" }
}
```

### 3.2 API эндпоинты для управления синхронизацией

#### Статус синхронизации
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

#### Ручной запуск синхронизации
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

#### Backfill исторических данных (до 90 дней)
```http
POST /v1/orders/backfill
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
Content-Type: application/json

{
  "dateFrom": "2026-01-01",
  "dateTo": "2026-01-31"
}
```

**Ответ:**
```json
{
  "jobId": "orders-fbs-sync:uuid:timestamp",
  "message": "Backfill job enqueued for 2026-01-01 to 2026-01-31",
  "dateFrom": "2026-01-01",
  "dateTo": "2026-01-31",
  "days": 30
}
```

---

## 4. UX-рекомендации

### 4.1 Empty State с объяснением

**Вместо:**
```
Заказы FBS: 0 ₽, 0 заказов
```

**Показывать:**
```
┌─────────────────────────────────────────────────────────┐
│  📦 Заказы FBS                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│     ℹ️ Нет данных FBS за выбранный период                │
│                                                          │
│     Синхронизация FBS-заказов была подключена позже.    │
│     Данные появятся для новых периодов автоматически.   │
│                                                          │
│     ┌─────────────────────────────────────┐             │
│     │  🔄 Загрузить историю (до 90 дней) │             │
│     └─────────────────────────────────────┘             │
│                                                          │
│     Последняя синхронизация: 31.01.2026, 13:00          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Компонент EmptyStateFBS

```typescript
// src/components/custom/orders/EmptyStateFBS.tsx

interface EmptyStateFBSProps {
  periodFrom: string;
  periodTo: string;
  lastSyncAt: string | null;
  onBackfill?: () => void;
  isBackfillLoading?: boolean;
}

export function EmptyStateFBS({
  periodFrom,
  periodTo,
  lastSyncAt,
  onBackfill,
  isBackfillLoading,
}: EmptyStateFBSProps) {
  const canBackfill = isWithin90Days(periodFrom);

  return (
    <Card className="p-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <PackageIcon className="h-12 w-12 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">
            Нет данных FBS за выбранный период
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Синхронизация FBS-заказов была подключена позже.
            Данные появятся для новых периодов автоматически.
          </p>
        </div>

        {canBackfill && onBackfill && (
          <Button
            variant="outline"
            onClick={onBackfill}
            disabled={isBackfillLoading}
          >
            {isBackfillLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Загрузить историю (до 90 дней)
              </>
            )}
          </Button>
        )}

        {!canBackfill && (
          <p className="text-xs text-muted-foreground">
            ⚠️ Период {periodFrom} — {periodTo} старше 90 дней.
            Загрузка истории недоступна.
          </p>
        )}

        {lastSyncAt && (
          <p className="text-xs text-muted-foreground">
            Последняя синхронизация: {formatDateTime(lastSyncAt)}
          </p>
        )}
      </div>
    </Card>
  );
}
```

### 4.3 Tooltip для метрики "Заказы FBS"

```typescript
// Tooltip content для информационной иконки (i)

const fbsOrdersTooltip = `
Заказы FBS — это заказы, обрабатываемые продавцом самостоятельно.

• Данные обновляются каждые 5 минут
• История доступна за последние 90 дней
• При отсутствии данных можно запустить синхронизацию вручную

Если заказов 0 для прошлого периода:
Возможно, синхронизация была подключена позже.
Нажмите "Загрузить историю" для получения данных.
`;
```

### 4.4 Кнопка "Загрузить историю"

```typescript
// Hook для backfill
export function useOrdersBackfill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dateFrom, dateTo }: BackfillParams) => {
      const response = await apiClient.post('/v1/orders/backfill', {
        dateFrom,
        dateTo,
      });
      return response.data;
    },
    onSuccess: () => {
      // Показать toast с jobId
      toast.success('Загрузка истории запущена. Данные появятся в течение нескольких минут.');

      // Инвалидировать кеш через 30 секунд
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['orders-volume'] });
      }, 30000);
    },
    onError: (error) => {
      if (error.response?.status === 400) {
        toast.error('Период превышает 90 дней. Выберите меньший диапазон.');
      } else {
        toast.error('Не удалось запустить загрузку. Попробуйте позже.');
      }
    },
  });
}
```

---

## 5. Бизнес-контекст

### 5.1 Почему "Выкупы" (Sales) — основная метрика

| Аспект | Заказы FBS | Выкупы (Sales) |
|--------|-----------|----------------|
| **Источник** | Realtime API (OrderFbs) | Еженедельный финотчёт WB |
| **Что показывает** | Заказы, созданные покупателями | Фактически оплаченные товары |
| **Возврат покупателя** | Включён до отмены | Не включён (только выкупленные) |
| **Финансовая точность** | Средняя (заказ ≠ деньги) | Высокая (деньги к перечислению) |
| **Доступность истории** | До 90 дней | Вся история (из отчётов) |

### 5.2 Рекомендация для дашборда

**Основные метрики (всегда из WbFinanceRaw):**
- **Выкупы** (`wb_sales_gross_total`) — главная метрика выручки
- **К перечислению** (`to_pay_total`) — финансовый результат
- **Маржа** — рассчитывается от выкупов

**Дополнительные метрики (из OrderFbs, если есть данные):**
- **Заказы FBS** — операционная метрика для отслеживания воронки
- **SLA Compliance** — контроль качества обработки заказов
- **Пиковые часы** — планирование ресурсов

### 5.3 Формула теоретической прибыли

**НЕПРАВИЛЬНО** (при Orders = 0):
```
Теор.прибыль = Заказы - COGS - Реклама - Логистика - Хранение
             = 0 - 35818 - 3728.55 - 17566.04 - 2024.94
             = -59137.53 ₽  ❌
```

**ПРАВИЛЬНО** (использовать Выкупы):
```typescript
const theoreticalProfit =
  financeSummary.summary_total.wb_sales_gross_total    // Выкупы
  - financeSummary.summary_total.cogs_total            // Себестоимость
  - advertisingData.summary.totalSpend                 // Реклама
  - financeSummary.summary_total.logistics_cost_total  // Логистика
  - financeSummary.summary_total.storage_cost_total;   // Хранение

// W04: 84377.52 - 35818 - 3728.55 - 17566.04 - 2024.94 = 25239.99 ₽ ✅
```

---

## 6. Чек-лист реализации

### Frontend (Реализовано 2026-02-01)

- [x] **EmptyStateFBS компонент** (`src/components/custom/dashboard/EmptyStateFBS.tsx`)
  - [x] Сообщение с объяснением ситуации
  - [x] Кнопка "Загрузить историю" (если период < 90 дней)
  - [x] Показ даты последней синхронизации
  - [x] Предупреждение для периодов > 90 дней

- [x] **Tooltip для "Заказы FBS"** (уже было в OrdersMetricCard)
  - [x] Объяснение что это за метрика
  - [x] Информационная иконка (i) с tooltip

- [x] **Карточка метрик** (`src/components/custom/dashboard/OrdersMetricCard.tsx`)
  - [x] При `totalOrders === 0` показывать EmptyStateFBS вместо "0 ₽"
  - [x] Передача periodFrom/periodTo из DashboardContent

- [x] **API интеграция**
  - [x] Функция `triggerOrdersBackfill` в `src/lib/api/orders.ts`
  - [x] Hook `useOrdersBackfill` в `src/hooks/useOrders.ts`
  - [x] Toast уведомления о статусе (sonner)

- [x] **Формула прибыли** (Issue #3 - отдельный фикс)
  - [x] Использовать `wb_sales_gross` вместо `sale_gross` для revenueTotal

### Backend (уже реализовано)

- [x] POST /v1/orders/backfill — загрузка исторических данных
- [x] GET /v1/orders/sync-status — статус синхронизации
- [x] POST /v1/orders/sync — ручной запуск синхронизации
- [x] GET /v1/analytics/orders/volume — аналитика объёма

---

## 7. Связанная документация

| Документ | Описание |
|----------|----------|
| [129-FBS-DATA-ANALYSIS-REPORT.md](./129-FBS-DATA-ANALYSIS-REPORT.md) | Технический анализ данных FBS |
| [93-epic-40-orders-fbs-frontend-guide.md](./93-epic-40-orders-fbs-frontend-guide.md) | Руководство по интеграции FBS API |
| [test-api/14-orders.http](../../../test-api/14-orders.http) | HTTP тесты FBS API |
| [docs/ORDERS-FBS-SYNC-GUIDE.md](../../../docs/ORDERS-FBS-SYNC-GUIDE.md) | Руководство по синхронизации |

---

## 8. Заключение

**Проблема**: Пользователь видит "Заказы FBS: 0" без понимания причины.

**Причина**: FBS синхронизация была подключена после выбранного периода — данные физически отсутствуют.

**Решение**:
1. Информативный Empty State с объяснением
2. Кнопка "Загрузить историю" для периодов до 90 дней
3. Tooltip с информацией о метрике
4. Использование "Выкупы" как основной финансовой метрики

**Статус Backend**: ✅ Готово (Epic 40 Complete)
**Статус Frontend**: ✅ Реализовано (2026-02-01)

---

## 9. Дополнительное исправление: FBS ordersCount Fallback

**Дата исправления**: 2026-02-01
**Статус**: ✅ RESOLVED

### Описание проблемы
Эндпоинт `/v1/analytics/fulfillment/summary` возвращал `fbs.ordersCount: 0` даже при наличии FBS заказов в таблице `OrderFbs`.

### Корневая причина
Сервис `FulfillmentAnalyticsService` не использовал данные из таблицы `OrderFbs` как fallback при подсчёте FBS заказов.

### Решение
Добавлен fallback в `FulfillmentAnalyticsService.getSummary()`:
- При отсутствии FBS данных в основном источнике (`reports_orders`)
- Система теперь проверяет таблицу `OrderFbs` и возвращает корректное количество

### До исправления
```json
{
  "summary": {
    "fbs": {
      "ordersCount": 0,
      "ordersRevenue": 0
    }
  }
}
```

### После исправления
```json
{
  "summary": {
    "fbs": {
      "ordersCount": 11,
      "ordersRevenue": 45000.00
    }
  }
}
```

### Затронутые файлы
- `src/analytics/services/fulfillment-analytics.service.ts`

---

*Отчёт подготовлен: 2026-02-01*
*Последнее обновление: 2026-02-01 (добавлено исправление FBS ordersCount fallback)*
*Автор: Claude Opus 4.5 (Financial Analytics Documentation Specialist)*

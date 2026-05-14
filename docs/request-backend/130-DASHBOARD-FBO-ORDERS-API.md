# 130: Dashboard FBO Orders API

**Дата создания:** 2026-02-01
**Последнее обновление:** 2026-02-01
**Статус:** ✅ COMPLETE - Backend Epic 60 реализован
**Приоритет:** P1 - HIGH
**Связанный Epic:** [Epic 60 - FBO/FBS Order Analytics Separation](../../../docs/epics/epic-60-fbo-fbs-analytics.md) (34 SP, 6 stories) - **COMPLETE**
**Запрашивает:** Frontend Team

> **🎉 Backend Ready!** Все 12 эндпоинтов Epic 60 реализованы. Синхронизация запускается автоматически каждые 15 минут.
>
> **Quick Start:**
> 1. Проверить статус: `GET /v1/analytics/fulfillment/sync-status`
> 2. Если `isDataAvailable: false`, запустить backfill: `POST /v1/orders/fbo/backfill`
> 3. Получить данные: `GET /v1/analytics/fulfillment/summary`

---

## Backend Team Response

**Status**: RESOLVED
**Resolution date**: 2026-02-01
**Summary**: Epic 60 (34 SP, 6 stories) complete. All 12 endpoints for FBO/FBS order analytics separation implemented. FBO sync runs automatically every 15 minutes. Backfill endpoint available for historical data.
**Remaining frontend action**: Integrate FBO data into dashboard. Check sync-status before displaying data, use backfill endpoint if needed.
---

## 1. Проблема

### Текущее состояние

Дашборд главной страницы отображает только заказы FBS:

```
┌─────────────────────────────────────┐
│  Заказы                    FBS only │
│  ┌─────────────┐ ┌─────────────┐    │
│  │ 156 шт.     │ │ 468 000 ₽   │    │
│  │ +12% ▲      │ │ +15% ▲      │    │
│  └─────────────┘ └─────────────┘    │
│                                      │
│  ⚠️ Нет данных FBS за период         │
└─────────────────────────────────────┘
```

### Проблемы бизнеса

1. **Неполная картина** — FBO заказы (выполнение складом WB) не отображаются
2. **Некорректный анализ** — невозможно сравнить эффективность FBO vs FBS
3. **Отсутствие метрик** — нет понимания доли FBO/FBS в общих продажах
4. **Пустое состояние** — сообщение "Нет данных FBS" вводит в заблуждение

### Что такое FBO/FBS?

| Тип | Название | Описание |
|-----|----------|----------|
| **FBO** | Fulfillment by Operator | Заказы, выполняемые со складов Wildberries |
| **FBS** | Fulfillment by Seller | Заказы, выполняемые со складов продавца |

---

## 2. Требуемые API эндпоинты

### 2.1 Агрегат FBO заказов

```http
GET /v1/analytics/fulfillment/summary
```

**Headers:**
| Header | Тип | Обязательный | Описание |
|--------|-----|--------------|----------|
| `Authorization` | string | Да | `Bearer {{token}}` |
| `X-Cabinet-Id` | UUID | Да | ID кабинета |

**Query Parameters:**
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `from` | string | Да | Начало периода (YYYY-MM-DD) |
| `to` | string | Да | Конец периода (YYYY-MM-DD, макс. 90 дней) |

**Response 200:**
```json
{
  "summary": {
    "fbo": {
      "ordersCount": 150,
      "ordersRevenue": 450000.00,
      "salesCount": 142,
      "salesRevenue": 420000.00,
      "forPayTotal": 380000.00,
      "returnsCount": 8,
      "returnsRevenue": 30000.00,
      "returnRate": 5.3,
      "avgOrderValue": 3000.00
    },
    "fbs": {
      "ordersCount": 85,
      "ordersRevenue": 255000.00,
      "salesCount": 80,
      "salesRevenue": 240000.00,
      "forPayTotal": 220000.00,
      "returnsCount": 5,
      "returnsRevenue": 15000.00,
      "returnRate": 5.9,
      "avgOrderValue": 3000.00
    },
    "total": {
      "ordersCount": 235,
      "ordersRevenue": 705000.00,
      "fboShare": 63.8,
      "fbsShare": 36.2
    }
  },
  "period": {
    "from": "2026-01-19",
    "to": "2026-01-25"
  }
}
```

**Ошибки:**
| Код | Описание |
|-----|----------|
| 400 `INVALID_DATE_FORMAT` | Неверный формат даты. Используйте YYYY-MM-DD |
| 400 `DATE_RANGE_EXCEEDED` | Диапазон дат не может превышать 90 дней |
| 401 | Unauthorized |
| 403 | Cabinet ID required |
| 404 `NO_DATA` | Данные FBO/FBS еще не синхронизированы |

---

### 2.2 Дневная разбивка FBO/FBS

```http
GET /v1/analytics/fulfillment/trends
```

**Query Parameters:**
| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `from` | string | Да | - | Начало периода (YYYY-MM-DD) |
| `to` | string | Да | - | Конец периода (YYYY-MM-DD) |
| `type` | enum | Нет | `all` | Тип: `fbo`, `fbs`, `all` |
| `metric` | enum | Нет | `orders` | Метрика: `orders`, `sales`, `revenue`, `returns` |

**Response 200:**
```json
{
  "trends": [
    {
      "date": "2026-01-19",
      "fbo": {
        "ordersCount": 25,
        "ordersRevenue": 75000.00,
        "salesRevenue": 70000.00,
        "returnsCount": 1
      },
      "fbs": {
        "ordersCount": 12,
        "ordersRevenue": 36000.00,
        "salesRevenue": 34000.00,
        "returnsCount": 0
      }
    },
    {
      "date": "2026-01-20",
      "fbo": {
        "ordersCount": 30,
        "ordersRevenue": 90000.00,
        "salesRevenue": 85000.00,
        "returnsCount": 2
      },
      "fbs": {
        "ordersCount": 15,
        "ordersRevenue": 45000.00,
        "salesRevenue": 42000.00,
        "returnsCount": 1
      }
    }
  ],
  "period": {
    "from": "2026-01-19",
    "to": "2026-01-25",
    "daysIncluded": 7
  }
}
```

---

### 2.3 Статус синхронизации FBO/FBS

```http
GET /v1/analytics/fulfillment/sync-status
```

**Response 200:**
```json
{
  "orders": {
    "lastSyncAt": "2026-02-01T06:00:00Z",
    "recordsCount": 15000,
    "dateRange": {
      "from": "2025-11-03",
      "to": "2026-02-01"
    }
  },
  "sales": {
    "lastSyncAt": "2026-02-01T07:00:00Z",
    "recordsCount": 14200,
    "dateRange": {
      "from": "2025-11-03",
      "to": "2026-02-01"
    }
  },
  "aggregation": {
    "lastRunAt": "2026-02-01T08:00:00Z",
    "status": "complete"
  },
  "isDataAvailable": true
}
```

**Response 200 (данные не синхронизированы):**
```json
{
  "orders": null,
  "sales": null,
  "aggregation": null,
  "isDataAvailable": false
}
```

---

## 3. Требования к карточке дашборда

### Вариант A: Отдельные карточки (Рекомендуется)

```
┌─────────────────────┐ ┌─────────────────────┐
│ Заказы FBO          │ │ Заказы FBS          │
│ ┌──────┐ ┌────────┐ │ │ ┌──────┐ ┌────────┐ │
│ │ 150  │ │450 000₽│ │ │ │ 85   │ │255 000₽│ │
│ │ +8%▲ │ │ +12%▲  │ │ │ │ -5%▼ │ │ -3%▼   │ │
│ └──────┘ └────────┘ │ │ └──────┘ └────────┘ │
│ 📦 Склады WB        │ │ 🏭 Склады продавца  │
└─────────────────────┘ └─────────────────────┘
```

### Вариант B: Объединённая карточка

```
┌─────────────────────────────────────────────┐
│ Заказы                          FBO + FBS   │
│ ┌───────────────┐ ┌───────────────────────┐ │
│ │ 235 шт.       │ │ 705 000 ₽             │ │
│ │ +5% ▲         │ │ +8% ▲                 │ │
│ └───────────────┘ └───────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ FBO: 150 (64%)    │    FBS: 85 (36%)    │ │
│ │ ████████████████  │    ██████████       │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Отображаемые метрики

| Метрика | Описание | Формула |
|---------|----------|---------|
| Количество заказов | Число заказов за период | `ordersCount` |
| Сумма заказов | Общая сумма в рублях | `ordersRevenue` |
| Изменение % | Сравнение с предыдущим периодом | `(current - previous) / previous * 100` |
| Доля FBO/FBS | Процент от общего количества | `fboCount / totalCount * 100` |

### Пустое состояние

Если `isDataAvailable === false`:

```
┌─────────────────────────────────────────────┐
│ Заказы FBO                                  │
│                                             │
│         📊 Данные FBO не загружены          │
│                                             │
│    Для отображения данных необходимо        │
│    синхронизировать историю заказов FBO     │
│                                             │
│        ┌────────────────────────┐           │
│        │ 🔄 Загрузить историю   │           │
│        └────────────────────────┘           │
│                                             │
│    ℹ️ Глубина данных: до 90 дней           │
└─────────────────────────────────────────────┘
```

### Кнопка "Загрузить историю FBO"

**Действие:** Вызов эндпоинта запуска синхронизации

```http
POST /v1/admin/fulfillment/sync
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
Content-Type: application/json

{
  "dataSource": "both",
  "dateFrom": "2025-11-01",
  "dateTo": "2026-02-01"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "FBO/FBS sync started",
  "jobId": "sync-fbo-fbs:cabinet-id:2026-02-01",
  "estimatedTime": "15-30 минут"
}
```

---

## 4. Сравнение FBS и FBO

| Аспект | FBS (текущий) | FBO (запрашиваемый) |
|--------|---------------|---------------------|
| **Источник данных** | Orders FBS API | Reports API |
| **Фильтр склада** | `Склад продавца` | `Склад WB` |
| **Глубина истории** | 30-365 дней | 90 дней |
| **Обновление** | Реалтайм (каждые 5 мин) | Ежедневно (06:00 MSK) |
| **Статус заказа** | Детальная история | Финальный статус |
| **Приоритет бэкенда** | Epic 40 (COMPLETE) | Epic 60 (PLANNED) |

### Технические различия

| Параметр | FBS API | Reports API (FBO) |
|----------|---------|-------------------|
| Rate Limit | 100 req/min | 1 req/min |
| Max записей | 500/запрос | 80,000/запрос |
| Поле типа склада | `warehouseId` | `warehouseType` |
| Значение FBO | — | `"Склад WB"` |
| Значение FBS | `warehouseId != 0` | `"Склад продавца"` |

---

## 5. TypeScript интерфейсы

```typescript
// ============================================================
// FBO/FBS Summary API
// ============================================================

interface FulfillmentMetrics {
  ordersCount: number;
  ordersRevenue: number;
  salesCount: number;
  salesRevenue: number;
  forPayTotal: number;
  returnsCount: number;
  returnsRevenue: number;
  returnRate: number;
  avgOrderValue: number;
}

interface FulfillmentTotal {
  ordersCount: number;
  ordersRevenue: number;
  fboShare: number;
  fbsShare: number;
}

interface FulfillmentSummaryResponse {
  summary: {
    fbo: FulfillmentMetrics;
    fbs: FulfillmentMetrics;
    total: FulfillmentTotal;
  };
  period: {
    from: string;
    to: string;
  };
}

// ============================================================
// FBO/FBS Trends API
// ============================================================

interface FulfillmentDayMetrics {
  ordersCount: number;
  ordersRevenue: number;
  salesRevenue: number;
  returnsCount: number;
}

interface FulfillmentTrendItem {
  date: string;
  fbo: FulfillmentDayMetrics;
  fbs: FulfillmentDayMetrics;
}

interface FulfillmentTrendsResponse {
  trends: FulfillmentTrendItem[];
  period: {
    from: string;
    to: string;
    daysIncluded: number;
  };
}

// ============================================================
// Sync Status API
// ============================================================

interface SyncDataInfo {
  lastSyncAt: string;
  recordsCount: number;
  dateRange: {
    from: string;
    to: string;
  };
}

interface FulfillmentSyncStatusResponse {
  orders: SyncDataInfo | null;
  sales: SyncDataInfo | null;
  aggregation: {
    lastRunAt: string;
    status: 'pending' | 'in_progress' | 'complete' | 'failed';
  } | null;
  isDataAvailable: boolean;
}

// ============================================================
// Start Sync API (Admin)
// ============================================================

interface StartSyncRequest {
  dataSource: 'orders' | 'sales' | 'both';
  dateFrom?: string;
  dateTo?: string;
}

interface StartSyncResponse {
  success: boolean;
  message: string;
  jobId: string;
  estimatedTime: string;
}
```

---

## 6. React Query хуки (пример)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Summary
export function useFulfillmentSummary(params: { from: string; to: string }) {
  return useQuery({
    queryKey: ['fulfillment', 'summary', params],
    queryFn: () => api.get<FulfillmentSummaryResponse>(
      '/v1/analytics/fulfillment/summary',
      { params }
    ),
    staleTime: 5 * 60 * 1000, // 5 минут
  });
}

// Trends
export function useFulfillmentTrends(params: {
  from: string;
  to: string;
  type?: 'fbo' | 'fbs' | 'all';
  metric?: 'orders' | 'sales' | 'revenue' | 'returns';
}) {
  return useQuery({
    queryKey: ['fulfillment', 'trends', params],
    queryFn: () => api.get<FulfillmentTrendsResponse>(
      '/v1/analytics/fulfillment/trends',
      { params }
    ),
    staleTime: 5 * 60 * 1000,
  });
}

// Sync Status
export function useFulfillmentSyncStatus() {
  return useQuery({
    queryKey: ['fulfillment', 'sync-status'],
    queryFn: () => api.get<FulfillmentSyncStatusResponse>(
      '/v1/analytics/fulfillment/sync-status'
    ),
    refetchInterval: 30000, // Каждые 30 сек
  });
}

// Start Sync (Admin)
export function useStartFulfillmentSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StartSyncRequest) =>
      api.post<StartSyncResponse>('/v1/admin/fulfillment/sync', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment'] });
    },
  });
}
```

---

## 7. Сценарии использования

### 7.1 Загрузка дашборда с данными FBO

```typescript
// Компонент FBOOrdersCard
function FBOOrdersCard({ dateRange }: { dateRange: DateRange }) {
  const { data: syncStatus, isLoading: syncLoading } = useFulfillmentSyncStatus();
  const { data: summary, isLoading } = useFulfillmentSummary({
    from: dateRange.from,
    to: dateRange.to,
  });

  // Проверка доступности данных
  if (syncLoading) return <CardSkeleton />;

  if (!syncStatus?.isDataAvailable) {
    return <FBOEmptyState onSyncClick={handleStartSync} />;
  }

  if (isLoading) return <CardSkeleton />;

  return (
    <MetricCard
      title="Заказы FBO"
      value={summary.summary.fbo.ordersCount}
      revenue={summary.summary.fbo.ordersRevenue}
      icon={<Package className="text-purple-500" />}
      trend={calculateTrend(summary, previousSummary)}
    />
  );
}
```

### 7.2 Пустое состояние и запуск синхронизации

```typescript
function FBOEmptyState({ onSyncClick }: { onSyncClick: () => void }) {
  const { mutate: startSync, isPending } = useStartFulfillmentSync();

  const handleSync = () => {
    startSync({
      dataSource: 'both',
      dateFrom: subDays(new Date(), 90).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
    });
    onSyncClick();
  };

  return (
    <Card className="p-6 text-center">
      <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="font-semibold mb-2">Данные FBO не загружены</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Для отображения данных необходимо синхронизировать историю заказов FBO
      </p>
      <Button onClick={handleSync} disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Загрузка...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Загрузить историю
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Глубина данных: до 90 дней
      </p>
    </Card>
  );
}
```

---

## 8. Rate Limits и Кэширование

| Эндпоинт | Rate Limit | Cache TTL |
|----------|------------|-----------|
| `/v1/analytics/fulfillment/summary` | 60 req/min | 5 минут |
| `/v1/analytics/fulfillment/trends` | 60 req/min | 5 минут |
| `/v1/analytics/fulfillment/sync-status` | 120 req/min | 30 секунд |
| `/v1/admin/fulfillment/sync` | 5 req/min | - |

---

## 9. Приоритет и таймлайн

### Бэкенд (Epic 60) - Статус: PLANNED

| Story | Название | SP | Блокирует фронтенд | Статус |
|-------|----------|-----|-------------------|--------|
| 60.1 | Database Schema | 5 | Нет | TODO |
| 60.2 | Orders Sync Service | 8 | Нет | TODO |
| 60.3 | Sales Sync Service | 8 | Нет | TODO |
| 60.4 | Daily Aggregation | 5 | Нет | TODO |
| 60.5 | **API Endpoints** | 5 | **Да** | TODO |
| 60.6 | Scheduler | 3 | Нет | TODO |

**Минимально необходимо для фронтенда:** Stories 60.1-60.5

**Полная документация Epic 60:** [docs/epics/epic-60-fbo-fbs-analytics.md](../../../docs/epics/epic-60-fbo-fbs-analytics.md)

### Фронтенд (ожидание)

После реализации Story 60.5:
1. Интеграция с новыми эндпоинтами (2-3 SP)
2. Карточка FBO на дашборде (2 SP)
3. Пустое состояние + кнопка синхронизации (1 SP)
4. Объединённый график FBO/FBS (2 SP)

**Общий таймлайн:**
- Бэкенд Epic 60: ~34 SP (2-3 недели)
- Фронтенд интеграция: ~8 SP (1 неделя после бэкенда)

---

## 10. Связанные документы

- [Epic 60: FBO/FBS Order Analytics Separation](../../../docs/epics/epic-60-fbo-fbs-analytics.md)
- [FBO/FBS Data Availability Guide](../../../docs/FBO-FBS-DATA-GUIDE.md)
- [Epic 40: Orders FBS](../../../docs/epics/epic-40-orders-fbs-realtime-sync.md) — текущая реализация FBS
- [Epic 51: Cross-API FBS Analytics](../../../docs/epics/epic-51-cross-api-fbs-analytics.md) — исторические данные FBS
- [121-DASHBOARD-MAIN-PAGE-ORDERS-API.md](./121-DASHBOARD-MAIN-PAGE-ORDERS-API.md) — текущий API заказов

---

---

## 11. Дополнительные эндпоинты Epic 60

Помимо основных эндпоинтов выше, Epic 60 также включает:

### 11.1 Детализация по продуктам

```http
GET /v1/analytics/fulfillment/products
```

**Query Parameters:**
| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `from` | string | Да | - | Начало периода (YYYY-MM-DD) |
| `to` | string | Да | - | Конец периода (YYYY-MM-DD) |
| `type` | enum | Нет | `all` | Тип: `fbo`, `fbs`, `all` |
| `limit` | number | Нет | `50` | Максимум продуктов |
| `sort` | enum | Нет | `revenue` | Сортировка: `revenue`, `orders`, `returns` |

**Response 200:**
```json
{
  "products": [
    {
      "nmId": 147205694,
      "supplierArticle": "ART-001",
      "category": "Одежда",
      "brand": "MyBrand",
      "fbo": {
        "ordersCount": 120,
        "salesRevenue": 350000.00,
        "returnsCount": 8,
        "returnRate": 6.7
      },
      "fbs": {
        "ordersCount": 45,
        "salesRevenue": 130000.00,
        "returnsCount": 2,
        "returnRate": 4.4
      },
      "recommendation": "Consider FBO - lower return rate"
    }
  ],
  "total": 156,
  "period": {
    "from": "2026-01-01",
    "to": "2026-01-31"
  }
}
```

---

**Автор:** Frontend Team (Claude Code PM Agent)
**Дата создания:** 2026-02-01
**Последнее обновление:** 2026-02-01
**Статус:** ✅ COMPLETE - Backend Epic 60 реализован (2026-02-01)

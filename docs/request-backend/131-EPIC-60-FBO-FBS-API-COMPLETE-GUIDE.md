# 131: Epic 60 - FBO/FBS API Complete Guide

**Дата создания:** 2026-02-01
**Статус:** ✅ COMPLETE - Backend Ready for Frontend Integration
**Epic:** [Epic 60 - FBO/FBS Order Analytics Separation](../../../docs/epics/epic-60-fbo-fbs-analytics.md)
**Story Points:** 34 SP (6 stories)
**PR:** https://github.com/salacoste/wb-erp-system-daytona/pull/4

---

## Quick Start для Frontend

### 1. Проверка доступности данных

```typescript
// React Query hook
const { data: syncStatus } = useQuery({
  queryKey: ['fbo-sync-status', cabinetId],
  queryFn: () => apiClient.get('/v1/analytics/fulfillment/sync-status'),
});

if (!syncStatus?.isDataAvailable) {
  // Показать empty state с кнопкой "Загрузить данные FBO"
}
```

### 2. Получение агрегированных данных

```typescript
const { data: summary } = useQuery({
  queryKey: ['fulfillment-summary', cabinetId, from, to],
  queryFn: () => apiClient.get(`/v1/analytics/fulfillment/summary?from=${from}&to=${to}`),
  enabled: syncStatus?.isDataAvailable,
});
```

---

## Все API Эндпоинты (12 эндпоинтов)

### Группа 1: Fulfillment Analytics (4 эндпоинта)

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/v1/analytics/fulfillment/summary` | Агрегат FBO/FBS за период |
| GET | `/v1/analytics/fulfillment/trends` | Дневная разбивка |
| GET | `/v1/analytics/fulfillment/products` | По товарам |
| GET | `/v1/analytics/fulfillment/sync-status` | Статус синхронизации |

### Группа 2: FBO Orders (6 эндпоинтов)

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/v1/orders/fbo` | Список FBO заказов (paginated) |
| GET | `/v1/orders/fbo/:orderId` | Детали заказа |
| GET | `/v1/orders/fbo/aggregate` | Агрегат заказов |
| GET | `/v1/orders/fbo/sync-status` | Статус синхронизации заказов |
| POST | `/v1/orders/fbo/sync` | Ручной запуск синхронизации |
| POST | `/v1/orders/fbo/backfill` | Загрузка исторических данных |

### Группа 3: FBO Sales (2 эндпоинта)

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/v1/sales/fbo` | Список FBO продаж (paginated) |
| GET | `/v1/sales/fbo/aggregate` | Агрегат продаж |

---

## Детальное описание эндпоинтов

### GET /v1/analytics/fulfillment/summary

**Назначение:** Главный эндпоинт для дашборда - агрегированные метрики FBO/FBS.

**Headers:**
```http
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

**Query Parameters:**
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| from | string | Да | YYYY-MM-DD |
| to | string | Да | YYYY-MM-DD (max 90 days) |

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

---

### GET /v1/analytics/fulfillment/trends

**Назначение:** Дневная разбивка для графиков.

**Query Parameters:**
| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| from | string | - | YYYY-MM-DD |
| to | string | - | YYYY-MM-DD |
| type | enum | `all` | `fbo`, `fbs`, `all` |
| metric | enum | `orders` | `orders`, `sales`, `revenue`, `returns` |

**Response 200:**
```json
{
  "trends": [
    {
      "date": "2026-01-19",
      "fbo": { "ordersCount": 25, "ordersRevenue": 75000.00, "salesRevenue": 70000.00 },
      "fbs": { "ordersCount": 12, "ordersRevenue": 36000.00, "salesRevenue": 34000.00 }
    }
  ],
  "period": { "from": "2026-01-19", "to": "2026-01-25", "daysIncluded": 7 }
}
```

---

### GET /v1/analytics/fulfillment/sync-status

**Назначение:** Проверка доступности данных (вызывать перед другими запросами).

**Response 200 (данные есть):**
```json
{
  "orders": {
    "lastSyncAt": "2026-02-01T06:00:00Z",
    "recordsCount": 15000,
    "dateRange": { "from": "2025-11-03", "to": "2026-02-01" }
  },
  "sales": {
    "lastSyncAt": "2026-02-01T07:00:00Z",
    "recordsCount": 14200,
    "dateRange": { "from": "2025-11-03", "to": "2026-02-01" }
  },
  "isDataAvailable": true
}
```

**Response 200 (данных нет):**
```json
{
  "orders": null,
  "sales": null,
  "isDataAvailable": false
}
```

---

### GET /v1/orders/fbo

**Назначение:** Список FBO заказов с пагинацией.

**Query Parameters:**
| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| from | string | 30 дней назад | YYYY-MM-DD |
| to | string | сегодня | YYYY-MM-DD |
| nm_id | number | - | Фильтр по nmId товара |
| limit | number | 100 | 1-1000 |
| offset | number | 0 | Смещение |
| sort_by | string | orderDate | orderDate, createdAt, totalPrice |
| sort_order | string | desc | asc, desc |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "srid": "12345678901234567890",
      "gNumber": "1234567890",
      "nmId": 123456,
      "barcode": "1234567890123",
      "supplierArticle": "ART-001",
      "warehouseType": "fbo",
      "warehouseName": "Коледино",
      "totalPrice": 1500.00,
      "discountPercent": 10,
      "orderDate": "2026-01-20T10:30:00Z",
      "isSupply": true,
      "isRealization": false
    }
  ],
  "meta": {
    "total": 150,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### POST /v1/orders/fbo/backfill

**Назначение:** Загрузка исторических данных FBO (до 90 дней).

**Request Body:**
```json
{
  "dateFrom": "2025-11-01",
  "dateTo": "2026-02-01"
}
```

**Response 202:**
```json
{
  "jobId": "uuid",
  "status": "queued",
  "message": "Backfill job queued successfully",
  "estimatedDuration": "5-10 minutes"
}
```

**Важно:** Этот эндпоинт ставит задачу в очередь. Используйте `/v1/orders/fbo/sync-status` для отслеживания прогресса.

---

### GET /v1/sales/fbo

**Назначение:** Список FBO продаж (завершённые транзакции).

**Query Parameters:** Аналогично `/v1/orders/fbo`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "srid": "12345678901234567890",
      "nmId": 123456,
      "finishedPrice": 1350.00,
      "forPay": 1200.00,
      "spp": 150.00,
      "isStorno": false,
      "orderDate": "2026-01-20T10:30:00Z"
    }
  ],
  "meta": { "total": 142, "limit": 100, "offset": 0, "hasMore": true }
}
```

---

## TypeScript Интерфейсы

```typescript
// Статус синхронизации
interface FulfillmentSyncStatus {
  orders: {
    lastSyncAt: string;
    recordsCount: number;
    dateRange: { from: string; to: string };
  } | null;
  sales: {
    lastSyncAt: string;
    recordsCount: number;
    dateRange: { from: string; to: string };
  } | null;
  isDataAvailable: boolean;
}

// Агрегат FBO/FBS
interface FulfillmentSummary {
  summary: {
    fbo: FulfillmentMetrics;
    fbs: FulfillmentMetrics;
    total: {
      ordersCount: number;
      ordersRevenue: number;
      fboShare: number;
      fbsShare: number;
    };
  };
  period: { from: string; to: string };
}

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

// FBO заказ
interface FboOrder {
  id: string;
  srid: string;
  gNumber: string;
  nmId: number;
  barcode: string;
  supplierArticle: string;
  warehouseType: 'fbo';
  warehouseName: string;
  totalPrice: number;
  discountPercent: number;
  orderDate: string;
  isSupply: boolean;
  isRealization: boolean;
}

// FBO продажа
interface FboSale {
  id: string;
  srid: string;
  nmId: number;
  finishedPrice: number;
  forPay: number;
  spp: number;
  isStorno: boolean;
  orderDate: string;
}
```

---

## React Query Hooks (рекомендуемая реализация)

```typescript
// hooks/useFulfillmentAnalytics.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Ключи запросов
export const fulfillmentKeys = {
  all: ['fulfillment'] as const,
  syncStatus: (cabinetId: string) => [...fulfillmentKeys.all, 'sync-status', cabinetId] as const,
  summary: (cabinetId: string, from: string, to: string) =>
    [...fulfillmentKeys.all, 'summary', cabinetId, from, to] as const,
  trends: (cabinetId: string, from: string, to: string) =>
    [...fulfillmentKeys.all, 'trends', cabinetId, from, to] as const,
  orders: (cabinetId: string, params: Record<string, unknown>) =>
    [...fulfillmentKeys.all, 'orders', cabinetId, params] as const,
};

// Статус синхронизации
export function useFulfillmentSyncStatus() {
  return useQuery({
    queryKey: fulfillmentKeys.syncStatus(useCabinetId()),
    queryFn: () => apiClient.get<FulfillmentSyncStatus>('/v1/analytics/fulfillment/sync-status'),
    staleTime: 60_000, // 1 минута
  });
}

// Агрегат FBO/FBS
export function useFulfillmentSummary(from: string, to: string) {
  const cabinetId = useCabinetId();
  const { data: syncStatus } = useFulfillmentSyncStatus();

  return useQuery({
    queryKey: fulfillmentKeys.summary(cabinetId, from, to),
    queryFn: () => apiClient.get<FulfillmentSummary>(
      `/v1/analytics/fulfillment/summary?from=${from}&to=${to}`
    ),
    enabled: !!syncStatus?.isDataAvailable,
    staleTime: 5 * 60_000, // 5 минут
  });
}

// Backfill мутация
export function useFboBackfill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { dateFrom: string; dateTo: string }) =>
      apiClient.post('/v1/orders/fbo/backfill', params),
    onSuccess: () => {
      // Инвалидировать статус синхронизации через 30 сек
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: fulfillmentKeys.all });
      }, 30_000);
    },
  });
}
```

---

## UI Компоненты

### Empty State Component

```tsx
// components/FboEmptyState.tsx
export function FboEmptyState() {
  const backfillMutation = useFboBackfill();

  const handleBackfill = () => {
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    backfillMutation.mutate({ dateFrom: from, dateTo: to });
  };

  return (
    <Card className="p-6 text-center">
      <ChartBarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-medium">Данные FBO не загружены</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Для отображения данных необходимо синхронизировать историю заказов FBO
      </p>
      <Button
        onClick={handleBackfill}
        disabled={backfillMutation.isPending}
        className="mt-4"
      >
        {backfillMutation.isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загрузка...</>
        ) : (
          <><RefreshCw className="mr-2 h-4 w-4" /> Загрузить историю (90 дней)</>
        )}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        Загрузка может занять 5-10 минут
      </p>
    </Card>
  );
}
```

### Dashboard Metrics Card

```tsx
// components/FulfillmentMetricsCard.tsx
export function FulfillmentMetricsCard({ from, to }: { from: string; to: string }) {
  const { data: syncStatus, isLoading: syncLoading } = useFulfillmentSyncStatus();
  const { data: summary, isLoading } = useFulfillmentSummary(from, to);

  if (syncLoading) return <CardSkeleton />;
  if (!syncStatus?.isDataAvailable) return <FboEmptyState />;
  if (isLoading) return <CardSkeleton />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Заказы FBO + FBS</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <MetricValue
            label="FBO"
            value={formatCurrency(summary.summary.fbo.ordersRevenue)}
            count={summary.summary.fbo.ordersCount}
            badge={`${summary.summary.total.fboShare.toFixed(1)}%`}
          />
          <MetricValue
            label="FBS"
            value={formatCurrency(summary.summary.fbs.ordersRevenue)}
            count={summary.summary.fbs.ordersCount}
            badge={`${summary.summary.total.fbsShare.toFixed(1)}%`}
          />
        </div>
        <Separator className="my-4" />
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Всего</span>
          <span className="font-bold">
            {formatCurrency(summary.summary.total.ordersRevenue)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Автоматическая синхронизация

Backend автоматически синхронизирует данные FBO каждые 15 минут:

- **Cron:** `0,15,30,45 * * * *` (Europe/Moscow)
- **Глубина:** Последние 7 дней (инкрементальная)
- **Rate Limit:** 1 запрос/мин к WB Reports API

Для первоначальной загрузки используйте `/v1/orders/fbo/backfill` (до 90 дней).

---

## Коды ошибок

| Код | Описание | Действие |
|-----|----------|----------|
| 400 `INVALID_DATE_FORMAT` | Неверный формат даты | Проверить YYYY-MM-DD |
| 400 `DATE_RANGE_EXCEEDED` | Диапазон > 90 дней | Уменьшить диапазон |
| 401 | Unauthorized | Обновить токен |
| 403 | Cabinet ID required | Добавить X-Cabinet-Id |
| 404 `NO_DATA` | Данные не синхронизированы | Показать empty state |
| 429 | Rate limit exceeded | Повторить через 60 сек |

---

## Связанная документация

- [130-DASHBOARD-FBO-ORDERS-API.md](./130-DASHBOARD-FBO-ORDERS-API.md) - Wireframes и бизнес-требования
- [docs/API-PATHS-REFERENCE.md](../../../docs/API-PATHS-REFERENCE.md#fbofbs-order-analytics-epic-60--complete) - Полная спецификация API
- [docs/epics/epic-60-fbo-fbs-analytics.md](../../../docs/epics/epic-60-fbo-fbs-analytics.md) - Epic обзор
- [docs/FBO-FBS-DATA-GUIDE.md](../../../docs/FBO-FBS-DATA-GUIDE.md) - FBO/FBS фильтрация

---

**Последнее обновление:** 2026-02-01
**Статус:** ✅ COMPLETE - Ready for Frontend Integration

**Fix (2026-02-01):** FBS `ordersCount` теперь корректно возвращает данные из `OrderFbs` таблицы как fallback.

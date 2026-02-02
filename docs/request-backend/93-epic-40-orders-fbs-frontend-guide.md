# Epic 40: Orders FBS Realtime Sync - Frontend Integration Guide

**Дата**: 2026-01-04
**Обновлено**: 2026-01-04 (Story 40.6 Enhancements)
**Статус**: ✅ EPIC COMPLETE (7/7 stories + enhancements)
**Приоритет**: Высокий - новый функционал для отслеживания заказов FBS

---

## 📋 Содержание

- [Последние изменения API](#-последние-изменения-api-2026-01-04)
- [Обзор](#обзор)
- [Документация](#документация)
- [API Endpoints](#api-endpoints)
- [TypeScript Types](#typescript-types)
- [React Integration Examples](#react-integration-examples)
- [Backend Observability](#backend-observability-story-406-enhancement)
- [Сценарии использования](#сценарии-использования)
- [Требования к Telegram](#требования-к-telegram)

---

## 🆕 Последние изменения API (2026-01-04)

### Story 40.6 Enhancements - Task 3: At-Risk Pagination

| Изменение | Endpoint | Описание |
|-----------|----------|----------|
| **At-Risk Pagination** | `GET /v1/analytics/orders/sla` | Новые параметры `atRiskLimit`, `atRiskOffset` |
| **atRiskTotal field** | `GET /v1/analytics/orders/sla` | Общее кол-во at-risk до пагинации |
| **cachedAt field** | All analytics endpoints | Время кеширования ответа |

**Breaking Changes**: Нет. Все изменения обратно совместимы.

### Story 40.6 Enhancements - Task 1: Prometheus Metrics (Backend)

Backend теперь отслеживает метрики для всех analytics endpoints:

| Метрика | Тип | Описание |
|---------|-----|----------|
| `orders_analytics_query_duration_ms` | Histogram | Латентность запросов |
| `orders_analytics_queries_total` | Counter | Общее кол-во запросов (success/error) |
| `orders_analytics_cache_hits_total` | Counter | Попадания в Redis cache |
| `orders_analytics_cache_misses_total` | Counter | Промахи cache |

> **Для фронтенда**: Эти метрики доступны в Grafana для мониторинга производительности API.

### Story 40.6 Enhancements - Task 2: Integration Tests

Backend имеет integration tests для сложных запросов. Запуск:
```bash
RUN_INTEGRATION_TESTS=1 npm run test:integration -- --testPathPattern=orders-analytics
```

---

## Обзор

Epic 40 добавляет полноценную систему отслеживания FBS-заказов (Fulfillment by Seller) с аналитикой скорости обработки, контролем SLA и Telegram-уведомлениями.

### Что позволяет делать

1. **Просматривать список заказов** с фильтрацией и сортировкой
2. **Отслеживать скорость обработки** заказов (подтверждение, сборка)
3. **Контролировать SLA** - видеть заказы под угрозой просрочки
4. **Анализировать объёмы** - тренды по часам/дням, пиковые часы
5. **Настраивать уведомления** в Telegram о новых заказах и предупреждениях SLA

---

## Документация

| Документ | Описание |
|----------|----------|
| [ORDERS-FBS-SYNC-GUIDE.md](../../../docs/ORDERS-FBS-SYNC-GUIDE.md) | Полное руководство по Epic 40 |
| [API-PATHS-REFERENCE.md](../../../docs/API-PATHS-REFERENCE.md) | Справочник всех API endpoints |
| [test-api/14-orders.http](../../../test-api/14-orders.http) | HTTP-примеры запросов |
| [test-api/40.7-orders-notifications.http](../../../test-api/40.7-orders-notifications.http) | Примеры для уведомлений |

---

## API Endpoints

### 1. Список заказов

```http
GET /v1/orders
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

**Query Parameters:**
| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `from` | ISO date | null | Начало периода |
| `to` | ISO date | null | Конец периода |
| `supplier_status` | enum | all | `new`, `confirm`, `complete`, `cancel` |
| `wb_status` | enum | all | `waiting`, `sorted`, `sold`, `canceled` |
| `nm_id` | number | null | Фильтр по артикулу WB |
| `sort_by` | string | `created_at` | `created_at`, `status_updated_at`, `price`, `sale_price` |
| `sort_order` | string | `desc` | `asc`, `desc` |
| `limit` | number | 100 | 1-1000 |
| `offset` | number | 0 | Пагинация |

**Response:**
```json
{
  "items": [
    {
      "orderId": "1234567890",
      "orderUid": "order-uid-abc123",
      "nmId": 12345678,
      "vendorCode": "SKU-ABC-001",
      "productName": "Название товара",
      "price": 1500.00,
      "salePrice": 1200.00,
      "supplierStatus": "new",
      "wbStatus": "waiting",
      "warehouseId": 507,
      "deliveryType": "fbs",
      "isB2B": false,
      "cargoType": "MGT",
      "createdAt": "2026-01-04T10:30:00.000Z",
      "statusUpdatedAt": "2026-01-04T11:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 100,
    "offset": 0
  },
  "query": {
    "from": "2026-01-01",
    "to": "2026-01-07"
  }
}
```

---

### 2. Детали заказа

```http
GET /v1/orders/{orderId}
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

**Response:** Расширенная информация с историей статусов:
```json
{
  "orderId": "1234567890",
  "nmId": 12345678,
  "vendorCode": "SKU-ABC-001",
  "productName": "Название товара",
  "price": 1500.00,
  "salePrice": 1200.00,
  "supplierStatus": "confirm",
  "wbStatus": "sorted",
  "address": {
    "fullAddress": "г. Москва, ул. Примерная, д. 1",
    "longitude": 37.6176,
    "latitude": 55.7558
  },
  "statusHistory": [
    {
      "supplierStatus": "new",
      "wbStatus": "waiting",
      "changedAt": "2026-01-04T10:30:00.000Z"
    },
    {
      "supplierStatus": "confirm",
      "wbStatus": "sorted",
      "changedAt": "2026-01-04T12:00:00.000Z"
    }
  ],
  "processingTimeSeconds": 5400,
  "syncedAt": "2026-01-04T12:05:00.000Z"
}
```

---

### 3. Аналитика скорости обработки

```http
GET /v1/analytics/orders/velocity?from=2026-01-01&to=2026-01-31
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

**Cache:** 5 минут | **Лимит периода:** 90 дней

**Response:**
```json
{
  "avgConfirmationTimeMinutes": 35.5,
  "avgCompletionTimeMinutes": 240.0,
  "p50ConfirmationMinutes": 28.0,
  "p95ConfirmationMinutes": 90.0,
  "p99ConfirmationMinutes": 120.0,
  "p50CompletionMinutes": 200.0,
  "p95CompletionMinutes": 480.0,
  "p99CompletionMinutes": 720.0,
  "byWarehouse": {
    "507": { "avgConfirmation": 30, "avgCompletion": 180 }
  },
  "byDeliveryType": {
    "fbs": { "avgConfirmation": 35, "avgCompletion": 200 }
  },
  "totalOrders": 150,
  "period": { "from": "2026-01-01", "to": "2026-01-31" }
}
```

**Применение в UI:**
- Виджет "Средняя скорость обработки"
- График перцентилей (p50/p95/p99)
- Breakdown по складам
- Сравнение FBS vs другие типы доставки

---

### 4. Контроль SLA

```http
GET /v1/analytics/orders/sla?confirmationSlaHours=2&completionSlaHours=24&atRiskLimit=20&atRiskOffset=0
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

**Cache:** 1 минута (real-time dashboard)

**Query Parameters:**
| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `confirmationSlaHours` | number | 2 | SLA подтверждения (часы) |
| `completionSlaHours` | number | 24 | SLA сборки (часы) |
| `atRiskLimit` | number | 20 | Макс. кол-во at-risk заказов (1-100) |
| `atRiskOffset` | number | 0 | Смещение для пагинации at-risk |

> **Story 40.6 Enhancement**: Добавлена пагинация для at-risk orders. При большом количестве проблемных заказов используйте `atRiskLimit` и `atRiskOffset` для постраничной загрузки.

**Response:**
```json
{
  "confirmationSlaHours": 2,
  "completionSlaHours": 24,
  "confirmationCompliancePercent": 95.5,
  "completionCompliancePercent": 92.3,
  "pendingOrdersCount": 12,
  "atRiskTotal": 45,
  "atRiskOrders": [
    {
      "orderId": "1234567890",
      "createdAt": "2026-01-04T10:00:00.000Z",
      "currentStatus": "new",
      "minutesRemaining": 25,
      "riskType": "confirmation",
      "isBreached": false
    }
  ],
  "breachedCount": 2,
  "cachedAt": "2026-01-04T12:00:00.000Z"
}
```

**Поля ответа:**
| Поле | Тип | Описание |
|------|-----|----------|
| `atRiskTotal` | number | **Общее** кол-во at-risk заказов (до пагинации) |
| `atRiskOrders` | array | Пагинированный список (max `atRiskLimit`) |
| `breachedCount` | number | Количество уже просроченных заказов |
| `cachedAt` | string | Время кеширования ответа |

**Пример пагинации:**
```typescript
// Первая страница
GET /v1/analytics/orders/sla?atRiskLimit=10&atRiskOffset=0
// → atRiskTotal: 45, atRiskOrders: [10 items]

// Вторая страница
GET /v1/analytics/orders/sla?atRiskLimit=10&atRiskOffset=10
// → atRiskTotal: 45, atRiskOrders: [10 items]
```

**Применение в UI:**
- Виджет "SLA Compliance" с процентами
- Список заказов "под угрозой" (atRiskOrders) с пагинацией
- Счётчик просроченных (breachedCount)
- Индикаторы: зелёный (>95%), жёлтый (85-95%), красный (<85%)
- **"Show all" кнопка** для загрузки остальных at-risk заказов

---

### 5. Тренды объёмов

```http
GET /v1/analytics/orders/volume?from=2026-01-01&to=2026-01-31
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

**Cache:** 5 минут | **Лимит периода:** 90 дней

**Response:**
```json
{
  "hourlyTrend": [
    { "hour": 0, "count": 5 },
    { "hour": 14, "count": 25 },
    { "hour": 15, "count": 22 }
  ],
  "dailyTrend": [
    { "date": "2026-01-04", "count": 150 },
    { "date": "2026-01-05", "count": 142 }
  ],
  "peakHours": [14, 15, 13],
  "cancellationRate": 3.5,
  "b2bPercentage": 12.0,
  "totalOrders": 500,
  "statusBreakdown": [
    { "status": "complete", "count": 400, "percentage": 80.0 },
    { "status": "cancel", "count": 18, "percentage": 3.6 }
  ],
  "period": { "from": "2026-01-01", "to": "2026-01-31" }
}
```

**Применение в UI:**
- График почасового распределения (heatmap)
- График дневных трендов (line chart)
- Виджет "Пиковые часы"
- Pie chart по статусам
- KPI: cancellationRate, b2bPercentage

---

### 6. Настройки уведомлений

#### Получить настройки

```http
GET /v1/notifications/orders/settings
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

**Response:**
```json
{
  "cabinetId": "550e8400-e29b-41d4-a716-446655440000",
  "newOrderEnabled": true,
  "slaWarningEnabled": true,
  "dailySummaryEnabled": true,
  "dailySummaryHour": 9,
  "quietHoursStart": 22,
  "quietHoursEnd": 8,
  "confirmationSlaWarningMinutes": 30,
  "completionSlaWarningMinutes": 120
}
```

#### Обновить настройки

```http
POST /v1/notifications/orders/settings
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
Content-Type: application/json

{
  "newOrderEnabled": true,
  "slaWarningEnabled": true,
  "dailySummaryEnabled": true,
  "dailySummaryHour": 9,
  "quietHoursStart": 22,
  "quietHoursEnd": 8,
  "confirmationSlaWarningMinutes": 30,
  "completionSlaWarningMinutes": 120
}
```

**Поля настроек:**
| Поле | Тип | Описание |
|------|-----|----------|
| `newOrderEnabled` | boolean | Уведомления о новых заказах |
| `slaWarningEnabled` | boolean | Предупреждения о приближении SLA |
| `dailySummaryEnabled` | boolean | Ежедневная сводка |
| `dailySummaryHour` | number (0-23) | Час отправки сводки (MSK) |
| `quietHoursStart` | number (0-23) | Начало тихих часов |
| `quietHoursEnd` | number (0-23) | Конец тихих часов |
| `confirmationSlaWarningMinutes` | number | За сколько минут до SLA подтверждения предупреждать |
| `completionSlaWarningMinutes` | number | За сколько минут до SLA сборки предупреждать |

---

### 7. Управление синхронизацией

#### Запустить синхронизацию вручную

```http
POST /v1/orders/sync
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

**Response:**
```json
{
  "jobId": "orders-fbs-sync:f75836f7-c0bc-4b2c-823c-a1f3508cce8e:1704387600000",
  "message": "Orders sync job enqueued"
}
```

#### Статус синхронизации

```http
GET /v1/orders/sync-status
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

**Response:**
```json
{
  "enabled": true,
  "lastSyncAt": "2026-01-04T10:00:00.000Z",
  "nextSyncAt": "2026-01-04T10:05:00.000Z",
  "schedule": "Every 5 minutes",
  "timezone": "Europe/Moscow"
}
```

---

## TypeScript Types

### SLA Metrics Types

```typescript
// src/types/orders-analytics.ts

export interface AtRiskOrder {
  orderId: string;
  createdAt: string;  // ISO 8601
  currentStatus: 'new' | 'confirm';
  minutesRemaining: number;  // 0 if already breached
  riskType: 'confirmation' | 'completion';
  isBreached: boolean;
}

export interface SlaMetricsResponse {
  confirmationSlaHours: number;
  completionSlaHours: number;
  confirmationCompliancePercent: number;
  completionCompliancePercent: number;
  pendingOrdersCount: number;
  atRiskTotal: number;      // Story 40.6 Enhancement: Total before pagination
  atRiskOrders: AtRiskOrder[];
  breachedCount: number;
  cachedAt?: string;        // ISO 8601
}

export interface SlaMetricsParams {
  confirmationSlaHours?: number;  // default: 2
  completionSlaHours?: number;    // default: 24
  atRiskLimit?: number;           // default: 20, max: 100
  atRiskOffset?: number;          // default: 0
}
```

### Velocity Metrics Types

```typescript
export interface BreakdownMetrics {
  avgConfirmation: number;  // minutes
  avgCompletion: number;    // minutes
}

export interface VelocityMetricsResponse {
  avgConfirmationTimeMinutes: number;
  avgCompletionTimeMinutes: number;
  p50ConfirmationMinutes: number;
  p95ConfirmationMinutes: number;
  p99ConfirmationMinutes: number;
  p50CompletionMinutes: number;
  p95CompletionMinutes: number;
  p99CompletionMinutes: number;
  byWarehouse: Record<string, BreakdownMetrics>;
  byDeliveryType: Record<string, BreakdownMetrics>;
  totalOrders: number;
  period: { from: string; to: string };
  cachedAt?: string;
}
```

### Volume Metrics Types

```typescript
export interface HourlyTrend {
  hour: number;   // 0-23
  count: number;
}

export interface DailyTrend {
  date: string;   // YYYY-MM-DD
  count: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

export interface VolumeMetricsResponse {
  hourlyTrend: HourlyTrend[];
  dailyTrend: DailyTrend[];
  peakHours: number[];           // Top 3 hours
  cancellationRate: number;      // Percentage
  b2bPercentage: number;         // Percentage
  totalOrders: number;
  statusBreakdown: StatusBreakdown[];
  period: { from: string; to: string };
  cachedAt?: string;
}
```

---

## React Integration Examples

### Hook для SLA Metrics с пагинацией

```typescript
// src/hooks/useSlaMetics.ts
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { SlaMetricsResponse, SlaMetricsParams } from '@/types/orders-analytics';

export function useSlaMetrics(cabinetId: string, params: SlaMetricsParams = {}) {
  const [atRiskPage, setAtRiskPage] = useState(0);
  const pageSize = params.atRiskLimit || 20;

  const query = useQuery<SlaMetricsResponse>({
    queryKey: ['sla-metrics', cabinetId, params, atRiskPage],
    queryFn: async () => {
      const response = await apiClient.get('/v1/analytics/orders/sla', {
        params: {
          confirmationSlaHours: params.confirmationSlaHours ?? 2,
          completionSlaHours: params.completionSlaHours ?? 24,
          atRiskLimit: pageSize,
          atRiskOffset: atRiskPage * pageSize,
        },
        headers: { 'X-Cabinet-Id': cabinetId },
      });
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute (matches backend cache)
    refetchInterval: 60 * 1000,
  });

  const loadNextPage = useCallback(() => {
    if (query.data && (atRiskPage + 1) * pageSize < query.data.atRiskTotal) {
      setAtRiskPage(prev => prev + 1);
    }
  }, [query.data, atRiskPage, pageSize]);

  const loadPrevPage = useCallback(() => {
    if (atRiskPage > 0) {
      setAtRiskPage(prev => prev - 1);
    }
  }, [atRiskPage]);

  return {
    ...query,
    atRiskPage,
    totalPages: query.data ? Math.ceil(query.data.atRiskTotal / pageSize) : 0,
    hasNextPage: query.data ? (atRiskPage + 1) * pageSize < query.data.atRiskTotal : false,
    hasPrevPage: atRiskPage > 0,
    loadNextPage,
    loadPrevPage,
  };
}
```

### Компонент SLA Dashboard

```tsx
// src/components/orders/SlaDashboard.tsx
import { useSlaMetrics } from '@/hooks/useSlaMetrics';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Props {
  cabinetId: string;
}

export function SlaDashboard({ cabinetId }: Props) {
  const {
    data,
    isLoading,
    atRiskPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    loadNextPage,
    loadPrevPage,
  } = useSlaMetrics(cabinetId);

  if (isLoading) return <div>Loading...</div>;
  if (!data) return null;

  const getComplianceColor = (percent: number) => {
    if (percent >= 95) return 'bg-green-500';
    if (percent >= 85) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground">Confirmation SLA</div>
          <div className="text-2xl font-bold">
            {data.confirmationCompliancePercent.toFixed(1)}%
          </div>
          <Badge className={getComplianceColor(data.confirmationCompliancePercent)}>
            {data.confirmationSlaHours}h threshold
          </Badge>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground">Completion SLA</div>
          <div className="text-2xl font-bold">
            {data.completionCompliancePercent.toFixed(1)}%
          </div>
          <Badge className={getComplianceColor(data.completionCompliancePercent)}>
            {data.completionSlaHours}h threshold
          </Badge>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground">Pending Orders</div>
          <div className="text-2xl font-bold">{data.pendingOrdersCount}</div>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground">At Risk / Breached</div>
          <div className="text-2xl font-bold text-orange-500">
            {data.atRiskTotal} / <span className="text-red-500">{data.breachedCount}</span>
          </div>
        </div>
      </div>

      {/* At-Risk Orders Table with Pagination */}
      <div className="border rounded-lg">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">
            At-Risk Orders ({data.atRiskTotal} total)
          </h3>
          <div className="text-sm text-muted-foreground">
            Page {atRiskPage + 1} of {totalPages}
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Order ID</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Risk Type</th>
              <th className="p-2 text-left">Time Remaining</th>
            </tr>
          </thead>
          <tbody>
            {data.atRiskOrders.map((order) => (
              <tr key={order.orderId} className="border-b">
                <td className="p-2">{order.orderId}</td>
                <td className="p-2">
                  <Badge variant={order.isBreached ? 'destructive' : 'warning'}>
                    {order.currentStatus}
                  </Badge>
                </td>
                <td className="p-2">{order.riskType}</td>
                <td className="p-2">
                  {order.isBreached
                    ? <span className="text-red-500">BREACHED</span>
                    : `${order.minutesRemaining} min`
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="p-4 flex justify-between">
          <Button
            variant="outline"
            onClick={loadPrevPage}
            disabled={!hasPrevPage}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={loadNextPage}
            disabled={!hasNextPage}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Cache Info */}
      {data.cachedAt && (
        <div className="text-xs text-muted-foreground">
          Data cached at: {new Date(data.cachedAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
```

---

## Backend Observability (Story 40.6 Enhancement)

### Prometheus Metrics

Backend предоставляет следующие метрики для мониторинга:

```
# Latency histogram (buckets: 50ms, 100ms, 200ms, 500ms, 1s, 2s, 5s)
orders_analytics_query_duration_ms{endpoint="velocity|sla|volume", cabinet_id="..."}

# Request counter
orders_analytics_queries_total{endpoint="velocity|sla|volume", cabinet_id="...", status="success|error"}

# Cache metrics
orders_analytics_cache_hits_total{endpoint="velocity|sla|volume"}
orders_analytics_cache_misses_total{endpoint="velocity|sla|volume"}
```

### Grafana Dashboard

Рекомендуемые панели для мониторинга:
- **Query Latency p95**: `histogram_quantile(0.95, orders_analytics_query_duration_ms)`
- **Cache Hit Rate**: `rate(cache_hits) / (rate(cache_hits) + rate(cache_misses))`
- **Error Rate**: `rate(queries_total{status="error"}) / rate(queries_total)`

### SLO (Service Level Objectives)

| Метрика | Target | Alert Threshold |
|---------|--------|-----------------|
| API p95 latency | < 500ms | > 500ms for 5 min |
| Error rate | < 1% | > 2% for 5 min |
| Cache hit rate | > 80% | < 60% for 10 min |

---

## Сценарии использования

### Страница "Заказы FBS"

```
┌─────────────────────────────────────────────────────────────┐
│  FBS Orders Dashboard                    [Sync Now] [⚙️]   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Total   │  │ SLA %   │  │ Avg Time│  │ At Risk │        │
│  │   150   │  │  95.5%  │  │  35 min │  │    3    │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
├─────────────────────────────────────────────────────────────┤
│  Filters: [Date Range] [Status ▼] [Article] [Search]       │
├─────────────────────────────────────────────────────────────┤
│  # │ Order ID  │ Product      │ Status │ Time   │ Actions │
│  1 │ 123456789 │ SKU-ABC-001  │ New    │ 25 min │ [View]  │
│  2 │ 123456790 │ SKU-DEF-002  │ Confirm│ 1h 30m │ [View]  │
└─────────────────────────────────────────────────────────────┘
```

### API Calls для этой страницы

1. **При загрузке:**
   - `GET /v1/analytics/orders/sla` → KPI виджеты
   - `GET /v1/analytics/orders/velocity` → Avg Time
   - `GET /v1/orders?limit=50` → Таблица заказов

2. **При фильтрации:**
   - `GET /v1/orders?supplier_status=new&from=...&to=...`

3. **При клике на заказ:**
   - `GET /v1/orders/{orderId}` → Модальное окно с деталями

4. **Кнопка "Sync Now":**
   - `POST /v1/orders/sync`

---

## Требования к Telegram

Для работы уведомлений пользователю необходимо:
1. Подключить Telegram бота (существующий функционал из Epic 34)
2. Включить нужные типы уведомлений в настройках

Система автоматически:
- Проверяет SLA каждую минуту (cron)
- Отправляет daily summary в указанный час
- Соблюдает тихие часы

---

## Миграция данных

Синхронизация заказов запускается автоматически:
- **Каждые 5 минут** для всех активных кабинетов
- **Сразу при добавлении WB ключа** - первичная загрузка

Исторические данные: система загружает заказы за последние 30 дней при первом запуске.

---

## Связанные эпики

| Epic | Описание | Связь |
|------|----------|-------|
| [Epic 34](./73-telegram-notifications-epic-34.md) | Telegram Notifications | Базовая интеграция Telegram |
| [Epic 33](./71-advertising-analytics-epic-33.md) | Advertising Analytics | Аналогичная структура sync |
| [Epic 35](./139-total-sales-organic-ad-split.md) | Total Sales & Organic | Daily sales sync |

---

## Контакты

При вопросах по API обращайтесь к backend-команде или смотрите:
- Swagger UI: `http://localhost:3000/api`
- Test API файлы: `test-api/14-orders.http`

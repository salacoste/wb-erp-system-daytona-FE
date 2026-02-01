# Epic 60: FBO/FBS Analytics - Уведомление для Frontend команды

**Дата**: 2026-02-01
**Статус**: Backend COMPLETE - Готово к интеграции
**Приоритет**: HIGH

---

## Краткое описание

Backend команда завершила реализацию **Epic 60 - FBO/FBS Order Analytics Separation**.

Теперь доступны новые API эндпоинты для разделения аналитики по типу фулфилмента:
- **FBO** (Fulfillment by Operator) - заказы со складов Wildberries
- **FBS** (Fulfillment by Seller) - заказы со складов продавца

---

## Документация

### Основные файлы

| Документ | Путь | Описание |
|----------|------|----------|
| **Полное руководство** | `frontend/docs/request-backend/131-EPIC-60-FBO-FBS-API-COMPLETE-GUIDE.md` | TypeScript интерфейсы, React Query hooks, примеры UI |
| **API спецификация** | `frontend/docs/request-backend/130-DASHBOARD-FBO-ORDERS-API.md` | Детальная спецификация эндпоинтов |
| **Индекс запросов** | `frontend/docs/request-backend/README.md` | Общий индекс документации |
| **FBS/Warehouses** | `frontend/docs/request-backend/README-SHARD-08-fbs-warehouses.md` | Связанные эпики (51, 52, 53, 60) |

### Backend реализация (для справки)

| Компонент | Путь |
|-----------|------|
| FBO Orders Sync Service | `src/analytics/services/fbo-orders-sync.service.ts` |
| FBO Sales Sync Service | `src/analytics/services/fbo-sales-sync.service.ts` |
| Scheduler (15 min) | `src/analytics/services/fbo-orders-scheduler.service.ts` |
| Queue Processor | `src/analytics/processors/fbo-orders-sync.processor.ts` |
| REST Controller | `src/analytics/controllers/fulfillment-analytics.controller.ts` |
| Prisma Schema | `prisma/schema.prisma` (reports_orders, reports_sales) |

---

## API Эндпоинты (12 штук)

### Analytics Endpoints

```
GET  /v1/analytics/fulfillment/summary     - Сводка FBO/FBS/Total
GET  /v1/analytics/fulfillment/trends      - Тренды по дням
GET  /v1/analytics/fulfillment/products    - Аналитика по товарам
GET  /v1/analytics/fulfillment/sync-status - Статус синхронизации
```

### Orders Endpoints

```
GET  /v1/orders/fbo                        - Список FBO заказов
GET  /v1/orders/fbo/:id                    - Детали FBO заказа
GET  /v1/orders/fbo/stats                  - Статистика FBO заказов
```

### Sales Endpoints

```
GET  /v1/sales/fbo                         - Список FBO продаж
GET  /v1/sales/fbo/stats                   - Статистика FBO продаж
```

### Admin Endpoints (Owner/Manager only)

```
POST /v1/admin/fulfillment/sync            - Ручной запуск синхронизации
GET  /v1/admin/fulfillment/sync/status     - Статус синхронизации
POST /v1/admin/fulfillment/backfill        - Импорт исторических данных
```

---

## Быстрый старт

### 1. Установить React Query hooks

```typescript
// frontend/src/hooks/useFulfillmentAnalytics.ts

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useFulfillmentSummary(params: {
  dateFrom: string;
  dateTo: string;
  fulfillmentType?: 'FBO' | 'FBS' | 'ALL';
}) {
  return useQuery({
    queryKey: ['fulfillment', 'summary', params],
    queryFn: () => apiClient.get('/v1/analytics/fulfillment/summary', { params }),
  });
}
```

### 2. Использовать в компоненте

```tsx
// frontend/src/components/custom/dashboard/FulfillmentMetrics.tsx

import { useFulfillmentSummary } from '@/hooks/useFulfillmentAnalytics';

export function FulfillmentMetrics() {
  const { data, isLoading } = useFulfillmentSummary({
    dateFrom: '2026-01-01',
    dateTo: '2026-01-31',
    fulfillmentType: 'ALL',
  });

  if (isLoading) return <Skeleton />;

  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricCard title="FBO Заказы" value={data.fbo.ordersCount} />
      <MetricCard title="FBS Заказы" value={data.fbs.ordersCount} />
      <MetricCard title="Всего" value={data.total.ordersCount} />
    </div>
  );
}
```

---

## TODO для Frontend

### Обязательные задачи

- [ ] Создать hook `useFulfillmentSummary` для `/v1/analytics/fulfillment/summary`
- [ ] Создать hook `useFulfillmentTrends` для `/v1/analytics/fulfillment/trends`
- [ ] Добавить FBO метрики на Dashboard
- [ ] Реализовать переключатель FBO/FBS/All
- [ ] Добавить статус синхронизации в UI

### Опциональные задачи

- [ ] Страница `/orders/fbo` для списка FBO заказов
- [ ] Страница `/sales/fbo` для списка FBO продаж
- [ ] Графики сравнения FBO vs FBS
- [ ] Admin панель для ручной синхронизации

---

## TypeScript интерфейсы

Полные интерфейсы доступны в:
`frontend/docs/request-backend/131-EPIC-60-FBO-FBS-API-COMPLETE-GUIDE.md`

Ключевые типы:

```typescript
interface FulfillmentSummaryResponse {
  fbo: FulfillmentMetrics;
  fbs: FulfillmentMetrics;
  total: FulfillmentMetrics;
  period: { dateFrom: string; dateTo: string };
  syncStatus: SyncStatus;
}

interface FulfillmentMetrics {
  ordersCount: number;
  salesCount: number;
  revenue: number;
  averageOrderValue: number;
  returnRate: number;
}

type FulfillmentType = 'FBO' | 'FBS';
```

---

## Тестирование

### Swagger UI
```
http://localhost:3000/api
```

### cURL примеры

```bash
# Получить сводку FBO/FBS
curl -X GET "http://localhost:3000/v1/analytics/fulfillment/summary?dateFrom=2026-01-01&dateTo=2026-01-31" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "X-Cabinet-Id: {CABINET_ID}"

# Получить список FBO заказов
curl -X GET "http://localhost:3000/v1/orders/fbo?limit=20" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "X-Cabinet-Id: {CABINET_ID}"
```

---

## Контакты

При возникновении вопросов:
1. Проверьте документацию в `frontend/docs/request-backend/`
2. Посмотрите Swagger UI на `http://localhost:3000/api`
3. Создайте issue в репозитории с тегом `epic-60`

---

**Статус Epic 60**: ✅ COMPLETE (34 Story Points, 6 Stories)

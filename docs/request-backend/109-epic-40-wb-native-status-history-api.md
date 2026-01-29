# Story 40.9: WB Native Status History API

**Дата:** 2026-01-29
**Эпик:** Epic 40 - Orders FBS Realtime Sync
**Статус:** Реализовано

---

## Обзор

Story 40.9 добавляет два новых эндпоинта для получения истории статусов заказа:

1. **WB Native History** - Детальная история из WB API с 40+ статус-кодами
2. **Full History** - Объединённая история (локальное отслеживание + WB API)

Эти эндпоинты дополняют существующий `/v1/orders/:orderId/history` (Story 40.8), который возвращает только локально отслеживаемые переходы статусов.

### Ключевые особенности

| Возможность | Описание |
|-------------|----------|
| 40+ статус-кодов | Детальные статусы WB (created, assembling, sorted_by_wh, и т.д.) |
| Расчёт длительности | Время в каждом статусе (в минутах) |
| Хронологическая сортировка | Все записи отсортированы по timestamp (oldest first) |
| Объединённая timeline | Merge локальной и WB истории в единый поток |

---

## Новые эндпоинты

### 1. GET /v1/orders/:orderId/wb-history

**Описание:** Получение истории статусов заказа напрямую из WB API. Возвращает хронологический список всех переходов с детальными WB статус-кодами (40+ возможных значений).

**Headers:**

| Header | Значение | Обязательный |
|--------|----------|--------------|
| `Authorization` | `Bearer {{token}}` | Да |
| `X-Cabinet-Id` | `{{cabinetId}}` | Да |

**Path Parameters:**

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `orderId` | string | Да | WB Order ID (числовая строка, например "1234567890") |

**Response 200:**

```json
{
  "orderId": "1234567890",
  "orderUid": "UID-123456",
  "wbHistory": [
    {
      "id": "uuid-1234-5678",
      "wbStatusCode": "created",
      "wbStatusChangedAt": "2026-01-02T10:00:00.000Z",
      "durationMinutes": null
    },
    {
      "id": "uuid-2345-6789",
      "wbStatusCode": "assembling",
      "wbStatusChangedAt": "2026-01-02T10:30:00.000Z",
      "durationMinutes": 30
    },
    {
      "id": "uuid-3456-7890",
      "wbStatusCode": "sorted_by_wh",
      "wbStatusChangedAt": "2026-01-02T11:00:00.000Z",
      "durationMinutes": 30
    },
    {
      "id": "uuid-4567-8901",
      "wbStatusCode": "received_by_client",
      "wbStatusChangedAt": "2026-01-03T15:30:00.000Z",
      "durationMinutes": 1770
    }
  ],
  "summary": {
    "totalTransitions": 4,
    "totalDurationMinutes": 1770,
    "currentWbStatus": "received_by_client",
    "createdAt": "2026-01-02T10:00:00.000Z",
    "lastUpdatedAt": "2026-01-03T15:30:00.000Z"
  }
}
```

**Поля ответа:**

| Поле | Тип | Описание |
|------|-----|----------|
| `orderId` | string | WB Order ID |
| `orderUid` | string | Order grouping UID |
| `wbHistory` | array | Хронологический список статусов (oldest first) |
| `wbHistory[].id` | string | UUID записи истории |
| `wbHistory[].wbStatusCode` | string | WB native статус-код (40+ значений) |
| `wbHistory[].wbStatusChangedAt` | string | Timestamp изменения (ISO 8601) |
| `wbHistory[].durationMinutes` | number \| null | Время в этом статусе (null для первой записи) |
| `summary.totalTransitions` | number | Общее количество переходов |
| `summary.totalDurationMinutes` | number \| null | Общая длительность от первого до последнего статуса |
| `summary.currentWbStatus` | string | Текущий WB статус-код |
| `summary.createdAt` | string | Timestamp первого статуса (ISO 8601) |
| `summary.lastUpdatedAt` | string | Timestamp последнего изменения (ISO 8601) |

**Коды ошибок:**

| Код | Описание |
|-----|----------|
| 400 | Невалидный формат orderId |
| 401 | Не авторизован (отсутствует или невалидный JWT) |
| 403 | Нет доступа к кабинету (заказ принадлежит другому кабинету) |
| 404 | Заказ не найден |

---

### 2. GET /v1/orders/:orderId/full-history

**Описание:** Получение объединённой истории статусов из двух источников: локальное отслеживание (supplier_status + wb_status) и WB native API (40+ статус-кодов). Все записи отсортированы хронологически по timestamp.

**Headers:**

| Header | Значение | Обязательный |
|--------|----------|--------------|
| `Authorization` | `Bearer {{token}}` | Да |
| `X-Cabinet-Id` | `{{cabinetId}}` | Да |

**Path Parameters:**

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `orderId` | string | Да | WB Order ID (числовая строка) |

**Response 200:**

```json
{
  "orderId": "1234567890",
  "orderUid": "UID-123456",
  "fullHistory": [
    {
      "source": "wb_native",
      "wbStatusCode": "created",
      "timestamp": "2026-01-02T10:00:00.000Z"
    },
    {
      "source": "local",
      "oldSupplierStatus": null,
      "newSupplierStatus": "new",
      "oldWbStatus": null,
      "newWbStatus": "waiting",
      "timestamp": "2026-01-02T10:05:00.000Z"
    },
    {
      "source": "wb_native",
      "wbStatusCode": "assembling",
      "timestamp": "2026-01-02T10:30:00.000Z"
    },
    {
      "source": "local",
      "oldSupplierStatus": "new",
      "newSupplierStatus": "confirm",
      "oldWbStatus": "waiting",
      "newWbStatus": "sorted",
      "timestamp": "2026-01-02T12:30:00.000Z"
    },
    {
      "source": "wb_native",
      "wbStatusCode": "sorted_by_wh",
      "timestamp": "2026-01-02T14:00:00.000Z"
    }
  ],
  "summary": {
    "localEntriesCount": 2,
    "wbNativeEntriesCount": 3,
    "totalEntriesCount": 5
  }
}
```

**Поля ответа - fullHistory (local):**

| Поле | Тип | Описание |
|------|-----|----------|
| `source` | `"local"` | Источник записи |
| `oldSupplierStatus` | string \| null | Предыдущий supplier_status (null для первой записи) |
| `newSupplierStatus` | string | Новый supplier_status |
| `oldWbStatus` | string \| null | Предыдущий wb_status (null для первой записи) |
| `newWbStatus` | string | Новый wb_status |
| `timestamp` | string | Время изменения (ISO 8601) |

**Поля ответа - fullHistory (wb_native):**

| Поле | Тип | Описание |
|------|-----|----------|
| `source` | `"wb_native"` | Источник записи |
| `wbStatusCode` | string | WB native статус-код |
| `timestamp` | string | Время изменения (ISO 8601) |

**Поля ответа - summary:**

| Поле | Тип | Описание |
|------|-----|----------|
| `localEntriesCount` | number | Количество записей из локального отслеживания |
| `wbNativeEntriesCount` | number | Количество записей из WB API |
| `totalEntriesCount` | number | Общее количество записей |

**Коды ошибок:**

| Код | Описание |
|-----|----------|
| 400 | Невалидный формат orderId |
| 401 | Не авторизован |
| 403 | Нет доступа к кабинету |
| 404 | Заказ не найден |

---

## TypeScript интерфейсы

```typescript
// src/types/orders-history.ts

// ============================================================
// WB History Types (GET /v1/orders/:orderId/wb-history)
// ============================================================

/**
 * Запись WB native истории статусов
 * Story 40.9 AC5
 */
export interface WbStatusHistoryEntry {
  /** UUID записи */
  id: string;
  /** WB native статус-код (40+ возможных значений) */
  wbStatusCode: string;
  /** Timestamp изменения статуса (ISO 8601) */
  wbStatusChangedAt: string;
  /** Время в этом статусе (минуты), null для первой записи */
  durationMinutes: number | null;
}

/**
 * Сводка по WB истории
 */
export interface WbHistorySummary {
  /** Общее количество переходов статусов */
  totalTransitions: number;
  /** Общая длительность от первого до последнего статуса (минуты) */
  totalDurationMinutes: number | null;
  /** Текущий WB статус-код */
  currentWbStatus: string;
  /** Timestamp первого статуса (ISO 8601) */
  createdAt: string;
  /** Timestamp последнего изменения (ISO 8601) */
  lastUpdatedAt: string;
}

/**
 * Ответ GET /v1/orders/:orderId/wb-history
 * Story 40.9 AC5
 */
export interface WbHistoryResponse {
  /** WB Order ID */
  orderId: string;
  /** Order grouping UID */
  orderUid: string;
  /** Хронологический список WB статусов (oldest first) */
  wbHistory: WbStatusHistoryEntry[];
  /** Сводная информация */
  summary: WbHistorySummary;
}

// ============================================================
// Full History Types (GET /v1/orders/:orderId/full-history)
// ============================================================

/**
 * Запись локальной истории статусов
 * Story 40.9 AC6
 */
export interface LocalHistoryEntry {
  source: 'local';
  /** Предыдущий supplier_status (null для первой записи) */
  oldSupplierStatus: string | null;
  /** Новый supplier_status */
  newSupplierStatus: string;
  /** Предыдущий wb_status (null для первой записи) */
  oldWbStatus: string | null;
  /** Новый wb_status */
  newWbStatus: string;
  /** Timestamp изменения (ISO 8601) */
  timestamp: string;
}

/**
 * Запись WB native истории для full-history
 * Story 40.9 AC6
 */
export interface WbNativeHistoryEntry {
  source: 'wb_native';
  /** WB native статус-код */
  wbStatusCode: string;
  /** Timestamp изменения (ISO 8601) */
  timestamp: string;
}

/**
 * Union тип для записи объединённой истории
 */
export type FullHistoryEntry = LocalHistoryEntry | WbNativeHistoryEntry;

/**
 * Сводка по объединённой истории
 */
export interface FullHistorySummary {
  /** Количество записей из локального отслеживания */
  localEntriesCount: number;
  /** Количество записей из WB API */
  wbNativeEntriesCount: number;
  /** Общее количество записей */
  totalEntriesCount: number;
}

/**
 * Ответ GET /v1/orders/:orderId/full-history
 * Story 40.9 AC6
 */
export interface FullHistoryResponse {
  /** WB Order ID */
  orderId: string;
  /** Order grouping UID */
  orderUid: string;
  /** Хронологический список всех статусов (merged, sorted by timestamp) */
  fullHistory: FullHistoryEntry[];
  /** Сводная информация */
  summary: FullHistorySummary;
}

// ============================================================
// Type Guards
// ============================================================

/**
 * Type guard для проверки локальной записи истории
 */
export function isLocalHistoryEntry(
  entry: FullHistoryEntry
): entry is LocalHistoryEntry {
  return entry.source === 'local';
}

/**
 * Type guard для проверки WB native записи
 */
export function isWbNativeHistoryEntry(
  entry: FullHistoryEntry
): entry is WbNativeHistoryEntry {
  return entry.source === 'wb_native';
}
```

---

## Примеры использования

### API Client функции

```typescript
// src/lib/api/orders-history.ts
import { apiClient } from '@/lib/api-client';
import type { WbHistoryResponse, FullHistoryResponse } from '@/types/orders-history';

/**
 * Получить WB native историю статусов заказа
 * Story 40.9 AC5
 */
export async function getWbHistory(
  orderId: string,
  cabinetId: string
): Promise<WbHistoryResponse> {
  return apiClient.get<WbHistoryResponse>(
    `/v1/orders/${orderId}/wb-history`,
    {
      headers: { 'X-Cabinet-Id': cabinetId },
    }
  );
}

/**
 * Получить объединённую историю статусов заказа
 * Story 40.9 AC6
 */
export async function getFullHistory(
  orderId: string,
  cabinetId: string
): Promise<FullHistoryResponse> {
  return apiClient.get<FullHistoryResponse>(
    `/v1/orders/${orderId}/full-history`,
    {
      headers: { 'X-Cabinet-Id': cabinetId },
    }
  );
}
```

### React Query Hooks

```typescript
// src/hooks/useOrderHistory.ts
import { useQuery } from '@tanstack/react-query';
import { getWbHistory, getFullHistory } from '@/lib/api/orders-history';
import { useAuthStore } from '@/stores/authStore';
import type { WbHistoryResponse, FullHistoryResponse } from '@/types/orders-history';

// Query keys factory
export const orderHistoryKeys = {
  all: ['order-history'] as const,
  wbHistory: (orderId: string) => [...orderHistoryKeys.all, 'wb', orderId] as const,
  fullHistory: (orderId: string) => [...orderHistoryKeys.all, 'full', orderId] as const,
};

/**
 * Hook для WB native истории статусов
 */
export function useWbHistory(orderId: string | undefined) {
  const { cabinetId } = useAuthStore();

  return useQuery<WbHistoryResponse>({
    queryKey: orderHistoryKeys.wbHistory(orderId ?? ''),
    queryFn: () => getWbHistory(orderId!, cabinetId!),
    enabled: !!orderId && !!cabinetId,
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Hook для объединённой истории статусов
 */
export function useFullHistory(orderId: string | undefined) {
  const { cabinetId } = useAuthStore();

  return useQuery<FullHistoryResponse>({
    queryKey: orderHistoryKeys.fullHistory(orderId ?? ''),
    queryFn: () => getFullHistory(orderId!, cabinetId!),
    enabled: !!orderId && !!cabinetId,
    staleTime: 30_000,
  });
}
```

### Компонент Timeline

```tsx
// src/components/custom/orders/OrderHistoryTimeline.tsx
import { useFullHistory, isLocalHistoryEntry, isWbNativeHistoryEntry } from '@/hooks/useOrderHistory';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface OrderHistoryTimelineProps {
  orderId: string;
}

export function OrderHistoryTimeline({ orderId }: OrderHistoryTimelineProps) {
  const { data, isLoading, error } = useFullHistory(orderId);

  if (isLoading) {
    return <div className="animate-pulse">Загрузка истории...</div>;
  }

  if (error || !data) {
    return <div className="text-red-500">Ошибка загрузки истории</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>История статусов</span>
          <Badge variant="outline">
            {data.summary.totalEntriesCount} записей
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.fullHistory.map((entry, index) => (
            <div
              key={`${entry.timestamp}-${index}`}
              className="flex items-start gap-4 border-l-2 border-gray-200 pl-4 pb-4"
            >
              {/* Source badge */}
              <Badge
                variant={entry.source === 'wb_native' ? 'default' : 'secondary'}
                className="shrink-0"
              >
                {entry.source === 'wb_native' ? 'WB' : 'Local'}
              </Badge>

              {/* Content */}
              <div className="flex-1 space-y-1">
                {isWbNativeHistoryEntry(entry) && (
                  <p className="font-medium">{entry.wbStatusCode}</p>
                )}
                {isLocalHistoryEntry(entry) && (
                  <p className="font-medium">
                    {entry.oldSupplierStatus || '—'} → {entry.newSupplierStatus}
                    <span className="text-muted-foreground mx-2">|</span>
                    {entry.oldWbStatus || '—'} → {entry.newWbStatus}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.timestamp), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          <p>Локальных записей: {data.summary.localEntriesCount}</p>
          <p>WB записей: {data.summary.wbNativeEntriesCount}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## WB Native статус-коды (40+)

Полный список возможных значений `wbStatusCode`:

| Код | Описание |
|-----|----------|
| `created` | Заказ создан |
| `assembling` | Сборка заказа |
| `assembled` | Заказ собран |
| `sorted_by_wh` | Отсортирован на складе |
| `on_delivery_to_client` | В доставке клиенту |
| `delivered` | Доставлен |
| `received_by_client` | Получен клиентом |
| `waiting_at_pickup_point` | Ожидает в пункте выдачи |
| `canceled` | Отменён |
| `canceled_by_client` | Отменён клиентом |
| `returned` | Возвращён |
| `return_in_progress` | Возврат в процессе |
| ... | и другие |

**Примечание:** Полный список статусов может расширяться WB API. Фронтенд должен корректно обрабатывать неизвестные статус-коды.

---

## Изменения для фронтенда

### UI Компоненты

- [ ] Добавить вкладку "WB История" в детали заказа (Order Details Modal)
- [ ] Создать компонент `WbHistoryTimeline` для отображения 40+ статусов WB
- [ ] Создать компонент `FullHistoryTimeline` для объединённой timeline
- [ ] Добавить цветовую кодировку по источнику (local vs wb_native)
- [ ] Показывать длительность в каждом статусе (durationMinutes)

### Взаимодействие

- [ ] Переключатель между "Локальная история" / "WB История" / "Полная история"
- [ ] Фильтрация по источнику в полной истории
- [ ] Сортировка по времени (oldest/newest first)

### Визуализация

- [ ] Timeline-компонент с иконками для разных источников
- [ ] Расчёт и отображение общего времени выполнения заказа
- [ ] Индикация текущего статуса заказа

---

## Связанные документы

| Документ | Описание |
|----------|----------|
| [Epic 40 Frontend Guide](93-epic-40-orders-fbs-frontend-guide.md) | Основной гайд по Epic 40 |
| [test-api/14-orders.http](../../../test-api/14-orders.http) | HTTP тесты для Orders API |
| [Story 40.8 - Local History](../../../docs/stories/epic-40/story-40.8-local-status-history.md) | Локальная история статусов |

---

## HTTP Test Examples

```http
### Get WB History
GET {{baseUrl}}/v1/orders/1234567890/wb-history
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}

### Get Full History (merged)
GET {{baseUrl}}/v1/orders/1234567890/full-history
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}

### Error: Invalid Order ID
GET {{baseUrl}}/v1/orders/invalid-id/wb-history
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
# Expected: 400 Bad Request

### Error: Order Not Found
GET {{baseUrl}}/v1/orders/99999999999999/wb-history
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
# Expected: 404 Not Found
```

---

**Swagger UI:** `http://localhost:3000/api`
**Backend Reference:** `test-api/14-orders.http`

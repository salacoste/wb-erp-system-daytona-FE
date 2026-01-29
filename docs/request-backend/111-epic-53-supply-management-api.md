# Epic 53: FBS Supply Management API

**Дата:** 2026-01-29
**Статус:** Реализовано
**Story Points:** 26 SP (6 историй)
**Версия API:** v1

## Обзор

Полный lifecycle управления поставками FBS (Fulfillment by Seller):

- Создание поставок для сборки заказов
- Добавление/удаление заказов в поставку
- Закрытие поставки и передача на доставку
- Генерация стикеров и документов для печати
- Автоматическая синхронизация статусов с WB

## Жизненный цикл поставки

```
┌─────────┐     добавить заказы     ┌────────────┐
│  OPEN   │ ───────────────────────>│   OPEN     │
│ (пусто) │                         │ (с заказами)│
└─────────┘                         └─────┬──────┘
                                          │ закрыть
                                          v
                                    ┌────────────┐
                                    │  CLOSED    │
                                    └─────┬──────┘
                                          │ WB принял
                                          v
                                    ┌────────────┐
                                    │ DELIVERING │
                                    └─────┬──────┘
                                          │ доставлено
                                          v
                                    ┌────────────┐
                                    │ DELIVERED  │
                                    └────────────┘

Альтернативный путь:
OPEN ──> CANCELLED (отмена поставки)
```

### Статусы поставки

| Статус | Описание | Действия |
|--------|----------|----------|
| `OPEN` | Поставка открыта, можно добавлять заказы | Добавить/удалить заказы, закрыть |
| `CLOSED` | Поставка закрыта, ожидает приёмки WB | Генерировать стикеры, скачать документы |
| `DELIVERING` | Поставка в пути на склад WB | Только просмотр |
| `DELIVERED` | Поставка принята на склад WB | Только просмотр |
| `CANCELLED` | Поставка отменена | Только просмотр |

## API Эндпоинты (9 методов)

### Общие заголовки для всех запросов

```http
Authorization: Bearer {{accessToken}}
X-Cabinet-Id: {{cabinetId}}
Content-Type: application/json
```

---

### 1. GET /v1/supplies

**Описание:** Получение списка поставок с фильтрацией и пагинацией

**Query Parameters:**

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `status` | string | Нет | - | Фильтр по статусу: `OPEN`, `CLOSED`, `DELIVERING`, `DELIVERED`, `CANCELLED` |
| `from` | string | Нет | - | Начальная дата (ISO 8601: `2026-01-01`) |
| `to` | string | Нет | - | Конечная дата (ISO 8601: `2026-01-31`) |
| `sortBy` | string | Нет | `createdAt` | Сортировка: `createdAt`, `closedAt`, `ordersCount` |
| `sortOrder` | string | Нет | `desc` | Порядок: `asc`, `desc` |
| `limit` | number | Нет | 50 | Кол-во записей (1-100) |
| `offset` | number | Нет | 0 | Смещение |

**Примеры запросов:**

```http
# Все поставки
GET /v1/supplies

# Открытые поставки
GET /v1/supplies?status=OPEN&limit=10

# Поставки за период
GET /v1/supplies?from=2026-01-01&to=2026-01-31

# С пагинацией
GET /v1/supplies?limit=20&offset=40
```

**Response 200:**

```json
{
  "items": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "wbSupplyId": "WB-GI-12345678",
      "name": "Поставка #1",
      "status": "OPEN",
      "ordersCount": 15,
      "totalItems": 45,
      "warehouseId": 507,
      "createdAt": "2026-01-28T10:00:00.000Z",
      "closedAt": null
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

---

### 2. POST /v1/supplies

**Описание:** Создание новой поставки

**Request Body:**

```json
{
  "name": "Поставка #1"  // Опционально, max 255 символов
}
```

**Response 201:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "wbSupplyId": "WB-GI-12345678",
  "name": "Поставка #1",
  "status": "OPEN",
  "createdAt": "2026-01-28T10:00:00.000Z"
}
```

**Примечания:**
- Если `name` не указан, поставка создаётся без имени
- `wbSupplyId` генерируется автоматически через WB API

---

### 3. GET /v1/supplies/:id

**Описание:** Получение детальной информации о поставке с заказами и документами

**Path Parameters:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | UUID | Внутренний ID поставки |

**Response 200:**

```json
{
  "supply": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "wbSupplyId": "WB-GI-12345678",
    "name": "Поставка #1",
    "status": "CLOSED",
    "ordersCount": 15,
    "totalItems": 45,
    "warehouseId": 507,
    "createdAt": "2026-01-28T10:00:00.000Z",
    "closedAt": "2026-01-28T15:00:00.000Z"
  },
  "orders": [
    {
      "orderId": "1234567890001",
      "nmId": 12345678,
      "article": "SKU-001",
      "salePrice": 1200.00,
      "supplierStatus": "confirm",
      "addedAt": "2026-01-28T11:00:00.000Z"
    }
  ],
  "documents": [
    {
      "id": "doc-uuid-123",
      "docType": "STICKER",
      "format": "png",
      "generatedAt": "2026-01-28T12:00:00.000Z",
      "fileSize": 50000
    }
  ]
}
```

---

### 4. POST /v1/supplies/:id/orders

**Описание:** Добавление заказов в поставку

**Path Parameters:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | UUID | ID поставки |

**Request Body:**

```json
{
  "orderIds": ["1234567890001", "1234567890002", "1234567890003"]
}
```

**Ограничения:**
- Минимум 1 заказ
- Максимум 1000 заказов за один запрос
- Поставка должна быть в статусе `OPEN`
- Заказы должны быть в статусе `confirm` или `complete`

**Response 200:**

```json
{
  "added": 2,
  "failed": 1,
  "errors": [
    "Order 1234567890003 failed: Invalid status"
  ]
}
```

---

### 5. DELETE /v1/supplies/:id/orders

**Описание:** Удаление заказов из поставки

**Path Parameters:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | UUID | ID поставки |

**Request Body:**

```json
{
  "orderIds": ["1234567890001"]
}
```

**Ограничения:**
- Поставка должна быть в статусе `OPEN`
- Максимум 1000 заказов за один запрос

**Response 200:**

```json
{
  "removed": 1
}
```

---

### 6. POST /v1/supplies/:id/close

**Описание:** Закрытие поставки

**Path Parameters:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | UUID | ID поставки |

**Ограничения:**
- Поставка должна быть в статусе `OPEN`
- Поставка должна содержать минимум 1 заказ

**Response 200:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "wbSupplyId": "WB-GI-12345678",
  "name": "Поставка #1",
  "status": "CLOSED",
  "createdAt": "2026-01-28T10:00:00.000Z",
  "closedAt": "2026-01-28T15:00:00.000Z"
}
```

---

### 7. POST /v1/supplies/:id/stickers

**Описание:** Генерация стикеров для поставки

**Path Parameters:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | UUID | ID поставки |

**Request Body:**

```json
{
  "format": "png"  // png | svg | zpl (default: png)
}
```

**Форматы стикеров:**

| Формат | Описание | Применение |
|--------|----------|------------|
| `png` | Растровое изображение | Обычные принтеры |
| `svg` | Векторное изображение | Высокое качество печати |
| `zpl` | ZPL-код для термопринтеров | Zebra и аналоги |

**Response 201:**

```json
{
  "id": "doc-uuid-123",
  "docType": "STICKER",
  "format": "png",
  "fileSize": 50000,
  "generatedAt": "2026-01-28T12:00:00.000Z"
}
```

---

### 8. GET /v1/supplies/:id/documents/:docType

**Описание:** Скачивание документа поставки

**Path Parameters:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | UUID | ID поставки |
| `docType` | string | Тип документа: `STICKER`, `BARCODE` |

**Response 200:**

Бинарный файл с соответствующим `Content-Type`:

| Формат | Content-Type |
|--------|--------------|
| `png` | `image/png` |
| `svg` | `image/svg+xml` |
| `zpl` | `application/x-zpl` |
| `pdf` | `application/pdf` |

**Headers ответа:**

```http
Content-Type: image/png
Content-Disposition: attachment; filename="STICKER.png"
```

---

### 9. POST /v1/supplies/sync

**Описание:** Ручной запуск синхронизации статусов поставок

**Rate Limit:** 1 запрос в 5 минут

**Response 202:**

```json
{
  "jobId": "supply-sync-cabinet-uuid-1706500000000",
  "message": "Sync job queued"
}
```

---

## TypeScript интерфейсы

```typescript
// ============================================================
// Enums
// ============================================================

export enum SupplyStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  DELIVERING = 'DELIVERING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum StickerFormat {
  PNG = 'png',
  SVG = 'svg',
  ZPL = 'zpl',
}

export enum SupplyDocType {
  STICKER = 'STICKER',
  BARCODE = 'BARCODE',
  QR_CODE = 'QR_CODE',
  PACKING_LIST = 'PACKING_LIST',
}

export enum SupplySortBy {
  CREATED_AT = 'createdAt',
  CLOSED_AT = 'closedAt',
  ORDERS_COUNT = 'ordersCount',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

// ============================================================
// Request DTOs
// ============================================================

export interface CreateSupplyRequest {
  name?: string; // max 255 chars
}

export interface AddOrdersRequest {
  orderIds: string[]; // WB order IDs, 1-1000 items
}

export interface RemoveOrdersRequest {
  orderIds: string[]; // WB order IDs, 1-1000 items
}

export interface GenerateStickersRequest {
  format?: StickerFormat; // default: 'png'
}

export interface ListSuppliesParams {
  status?: SupplyStatus;
  from?: string; // ISO date: '2026-01-01'
  to?: string; // ISO date: '2026-01-31'
  sortBy?: SupplySortBy;
  sortOrder?: SortOrder;
  limit?: number; // 1-100, default: 50
  offset?: number; // default: 0
}

// ============================================================
// Response DTOs
// ============================================================

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

export interface SupplyItem {
  id: string; // UUID
  wbSupplyId: string; // e.g., 'WB-GI-12345678'
  name: string | null;
  status: SupplyStatus;
  ordersCount: number;
  totalItems: number;
  warehouseId: number | null;
  createdAt: string; // ISO 8601
  closedAt: string | null; // ISO 8601
}

export interface ListSuppliesResponse {
  items: SupplyItem[];
  pagination: Pagination;
}

export interface CreateSupplyResponse {
  id: string;
  wbSupplyId: string;
  name: string | null;
  status: SupplyStatus;
  createdAt: string;
}

export interface CloseSupplyResponse extends CreateSupplyResponse {
  closedAt: string;
}

export interface SupplyOrder {
  orderId: string; // WB order ID as string
  nmId: number; // WB article
  article: string; // Supplier SKU
  salePrice: number; // RUB
  supplierStatus: string; // e.g., 'confirm'
  addedAt: string; // ISO 8601
}

export interface SupplyDocument {
  id: string;
  docType: SupplyDocType;
  format: string;
  generatedAt: string;
  fileSize: number | null;
}

export interface SupplyDetailsResponse {
  supply: SupplyItem;
  orders: SupplyOrder[];
  documents: SupplyDocument[];
}

export interface AddOrdersResult {
  added: number;
  failed: number;
  errors?: string[];
}

export interface RemoveOrdersResult {
  removed: number;
}

export interface DocumentGenerationResponse {
  id: string;
  docType: string;
  format: string;
  fileSize: number;
  generatedAt: string;
}

export interface TriggerSyncResponse {
  jobId: string;
  message: string;
}
```

---

## Коды ошибок

### HTTP статусы

| Код | Сценарий |
|-----|----------|
| 200 | Успешный запрос |
| 201 | Ресурс создан |
| 202 | Запрос принят в обработку (async) |
| 400 | Ошибка валидации / Бизнес-логика |
| 401 | Не авторизован (невалидный JWT) |
| 403 | Нет доступа к кабинету |
| 404 | Поставка не найдена |
| 429 | Превышен лимит запросов |

### Бизнес-ошибки (400 Bad Request)

| Ошибка | Сценарий |
|--------|----------|
| `Supply is already closed` | Попытка закрыть уже закрытую поставку |
| `Cannot add orders to closed supply` | Попытка добавить заказы в закрытую поставку |
| `Cannot remove orders from closed supply` | Попытка удалить заказы из закрытой поставки |
| `Cannot close empty supply. Add at least one order first.` | Попытка закрыть пустую поставку |
| `At least one order ID is required` | Пустой массив orderIds |
| `Cannot add more than 1000 orders at once` | Превышен лимит заказов |
| `format must be one of: png, svg, zpl` | Невалидный формат стикера |

### Примеры ошибок

```json
// 400 Bad Request - Validation error
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "name must not exceed 255 characters"
  ]
}

// 400 Bad Request - Business logic error
{
  "statusCode": 400,
  "message": "Cannot close empty supply. Add at least one order first."
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Supply not found"
}

// 429 Rate Limited
{
  "statusCode": 429,
  "message": "Rate limit exceeded. Try again in 5 minutes."
}
```

---

## Примеры использования (React/TypeScript)

### API сервис

```typescript
// services/supplies.api.ts
import { api } from './api-client';

export const suppliesApi = {
  // Список поставок
  list: (params?: ListSuppliesParams) =>
    api.get<ListSuppliesResponse>('/v1/supplies', { params }),

  // Создать поставку
  create: (data: CreateSupplyRequest) =>
    api.post<CreateSupplyResponse>('/v1/supplies', data),

  // Детали поставки
  getById: (id: string) =>
    api.get<SupplyDetailsResponse>(`/v1/supplies/${id}`),

  // Добавить заказы
  addOrders: (supplyId: string, data: AddOrdersRequest) =>
    api.post<AddOrdersResult>(`/v1/supplies/${supplyId}/orders`, data),

  // Удалить заказы
  removeOrders: (supplyId: string, data: RemoveOrdersRequest) =>
    api.delete<RemoveOrdersResult>(`/v1/supplies/${supplyId}/orders`, { data }),

  // Закрыть поставку
  close: (supplyId: string) =>
    api.post<CloseSupplyResponse>(`/v1/supplies/${supplyId}/close`),

  // Генерировать стикеры
  generateStickers: (supplyId: string, data: GenerateStickersRequest) =>
    api.post<DocumentGenerationResponse>(`/v1/supplies/${supplyId}/stickers`, data),

  // Скачать документ
  downloadDocument: (supplyId: string, docType: SupplyDocType) =>
    api.get(`/v1/supplies/${supplyId}/documents/${docType}`, {
      responseType: 'blob',
    }),

  // Ручная синхронизация
  triggerSync: () =>
    api.post<TriggerSyncResponse>('/v1/supplies/sync'),
};
```

### React Query хуки

```typescript
// hooks/useSupplies.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliesApi } from '../services/supplies.api';

// Список поставок
export function useSupplies(params?: ListSuppliesParams) {
  return useQuery({
    queryKey: ['supplies', params],
    queryFn: () => suppliesApi.list(params),
  });
}

// Детали поставки
export function useSupplyDetails(id: string) {
  return useQuery({
    queryKey: ['supply', id],
    queryFn: () => suppliesApi.getById(id),
    enabled: !!id,
  });
}

// Создать поставку
export function useCreateSupply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: suppliesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
    },
  });
}

// Добавить заказы
export function useAddOrders(supplyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddOrdersRequest) =>
      suppliesApi.addOrders(supplyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply', supplyId] });
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
    },
  });
}

// Закрыть поставку
export function useCloseSupply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (supplyId: string) => suppliesApi.close(supplyId),
    onSuccess: (_, supplyId) => {
      queryClient.invalidateQueries({ queryKey: ['supply', supplyId] });
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
    },
  });
}

// Скачать документ
export function useDownloadDocument() {
  return useMutation({
    mutationFn: async ({
      supplyId,
      docType
    }: {
      supplyId: string;
      docType: SupplyDocType;
    }) => {
      const response = await suppliesApi.downloadDocument(supplyId, docType);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${docType}.png`;
      link.click();
      window.URL.revokeObjectURL(url);
    },
  });
}
```

---

## Изменения для фронтенда

### Необходимые страницы и компоненты

- [ ] **Страница "Поставки"** (`/supplies`)
  - [ ] Таблица со списком поставок
  - [ ] Фильтры по статусу и дате
  - [ ] Пагинация
  - [ ] Сортировка по колонкам

- [ ] **Форма создания поставки**
  - [ ] Модальное окно или отдельная страница
  - [ ] Поле для имени поставки (опционально)
  - [ ] Кнопка "Создать"

- [ ] **Страница деталей поставки** (`/supplies/:id`)
  - [ ] Информация о поставке (статус, даты, склад)
  - [ ] Список заказов в поставке
  - [ ] Список сгенерированных документов
  - [ ] Действия: добавить заказы, удалить заказы, закрыть

- [ ] **Drag & drop заказов в поставку**
  - [ ] Список доступных заказов (статус confirm/complete)
  - [ ] Перетаскивание в поставку
  - [ ] Множественный выбор

- [ ] **Кнопка "Закрыть поставку"**
  - [ ] Подтверждение действия
  - [ ] Валидация (минимум 1 заказ)

- [ ] **Генерация и скачивание стикеров**
  - [ ] Выбор формата (PNG/SVG/ZPL)
  - [ ] Кнопка генерации
  - [ ] Прогресс-индикатор
  - [ ] Автоматическое скачивание

- [ ] **Отображение статуса доставки**
  - [ ] Цветовая индикация статусов
  - [ ] Timeline/progress bar
  - [ ] Кнопка "Обновить статус" (sync)

### UI компоненты

```typescript
// Цвета статусов поставки
const supplyStatusColors: Record<SupplyStatus, string> = {
  OPEN: 'blue',
  CLOSED: 'orange',
  DELIVERING: 'purple',
  DELIVERED: 'green',
  CANCELLED: 'red',
};

// Иконки статусов
const supplyStatusIcons: Record<SupplyStatus, IconType> = {
  OPEN: PackageOpen,
  CLOSED: PackageCheck,
  DELIVERING: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
};
```

---

## Связанные ресурсы

- **HTTP тесты:** `test-api/16-supplies.http`
- **DTO исходники:** `src/supplies/dto/supply.dto.ts`
- **Контроллер:** `src/supplies/controllers/supplies.controller.ts`
- **Story документация:** `docs/stories/epic-53/`
- **Swagger UI:** `http://localhost:3000/api` (раздел Supplies)

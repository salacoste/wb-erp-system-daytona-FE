# Request #98: Warehouses & Tariffs Coefficients API - BACKEND RESPONSE

**Date**: 2026-01-19
**Status**: ✅ IMPLEMENTED
**Priority**: P1 - IMPORTANT
**Related Epic**: Epic 43 (Price Calculator), Epic 44-FE (Price Calculator UI)
**Backend Stories**: 43.1, 43.5, 43.8, 43.9

---

## Summary

Backend реализовал полный набор сервисов для работы с тарифами WB:

| Сервис | Описание | Story |
|--------|----------|-------|
| **TariffsService** | Комиссии по категориям (FBO/FBS/DBS/EDBS) | 43.1 |
| **WbTariffSettingsService** | Глобальные настройки тарифов (БД) | 43.8 |
| **WarehousesTariffsService** | Склады + тарифы (логистика/хранение) | 43.5 |
| **AcceptanceCoefficientsService** | Коэффициенты приёмки FBO | 43.9 ✨ NEW |

---

## Ответы на вопросы Frontend команды

### 1. Кэширование ✅

| Данные | TTL | Обоснование |
|--------|-----|-------------|
| Warehouses list | 24h | Редко меняются |
| Commission rates | 24h | Редко меняются |
| Box tariffs | 1h | Коэффициенты могут меняться |
| Acceptance coefficients | 1h | Ежедневно обновляются |

### 2. Cargo Type Filtering ✅

Фильтрация по типу груза доступна через параметры эндпоинтов. Склады возвращаются с полным набором метаданных, фронтенд может фильтровать client-side.

### 3. FBS vs FBO Tariffs ✅

**Реализовано**: Параметр `fulfillmentType` позволяет выбрать тип:

```typescript
type FulfillmentType = 'FBO' | 'FBS' | 'DBS' | 'EDBS';

// API usage
GET /v1/tariffs/commissions/category/{id}?fulfillmentType=FBO
```

**Ключевое открытие**: FBS комиссия на **96.5% категорий выше** чем FBO (в среднем +3.38%).

### 4. Coefficient Expression Format ✅

Backend автоматически конвертирует:
- SDK возвращает: `"120"` (строка, проценты)
- Backend возвращает: `1.2` (число, множитель)

**Формула**: `parseFloat(value) / 100`

### 5. Return Logistics ✅

Реализовано в `WbTariffSettingsService`:

```typescript
// Возвратная логистика
getReturnLogisticsRate(fulfillmentType: 'FBO' | 'FBS'): Promise<number>

// Дефолтные значения
FBO: 50 ₽/товар
FBS: 50 ₽/товар
```

### 6. Commission by Category ✅

Полностью реализовано в `TariffsService`:

```typescript
// Все комиссии (7346 категорий)
getAllCommissions(cabinetId): Promise<CommissionRate[]>

// По категории
getCommissionByCategory(cabinetId, parentId): Promise<CommissionRate | null>

// По товару (nmId)
getCommissionByNmId(cabinetId, nmId): Promise<number | null>

// По типу выполнения
getCommissionByFulfillmentType(cabinetId, parentId, fulfillmentType): Promise<number | null>
```

---

## Реализованные API Endpoints

### 1. Commission Rates (TariffsService)

**Файл документации**: [`test-api/18-tariffs.http`](../../../test-api/18-tariffs.http) — секция 1

#### GET /v1/tariffs/commissions

Возвращает все комиссии по категориям (7346 категорий).

**Response:**
```json
{
  "data": {
    "commissions": [
      {
        "parentID": 123,
        "parentName": "Одежда",
        "subjectID": 456,
        "subjectName": "Платья",
        "paidStorageKgvp": 25,        // FBO commission %
        "kgvpMarketplace": 28,        // FBS commission % (обычно +3-4%)
        "kgvpSupplier": 10,           // DBS commission %
        "kgvpSupplierExpress": 5,     // EDBS commission %
        "kgvpBooking": 0,
        "kgvpPickup": 0
      }
    ],
    "meta": {
      "total": 7346,
      "cached": true,
      "cache_ttl_seconds": 86400
    }
  }
}
```

**Бизнес-логика**:
- Кэш 24 часа (тарифы редко меняются)
- Rate limit: 10 req/min (scope: `tariffs`)
- FBS комиссия в 96.5% случаев выше FBO

#### GET /v1/tariffs/commissions/category/{categoryId}

Комиссия для конкретной категории.

**Query Parameters:**
- `fulfillmentType` (optional): `FBO` | `FBS` | `DBS` | `EDBS`

**Response:**
```json
{
  "data": {
    "categoryId": 123,
    "categoryName": "Одежда",
    "fulfillmentType": "FBO",
    "commission_pct": 25,
    "source": "wb_api",
    "cached": true
  }
}
```

#### GET /v1/tariffs/commissions/product/{nmId}

Комиссия для товара (по nmId). Сначала определяет категорию товара, затем возвращает комиссию.

---

### 2. Global Tariff Settings (WbTariffSettingsService)

**Файл документации**: [`test-api/18-tariffs.http`](../../../test-api/18-tariffs.http) — секция 2

#### GET /v1/tariffs/settings

Глобальные настройки тарифов из БД. Используются как fallback когда WB API недоступен.

**Response:**
```json
{
  "data": {
    "default_commission_fbo_pct": 25.00,
    "default_commission_fbs_pct": 28.00,

    "acceptance_box_rate_per_liter": 1.70,
    "acceptance_pallet_rate": 500.00,

    "logistics_volume_tiers": [
      { "min": 0.001, "max": 0.2, "rate": 23 },
      { "min": 0.201, "max": 0.4, "rate": 26 },
      { "min": 0.401, "max": 0.6, "rate": 29 },
      { "min": 0.601, "max": 0.8, "rate": 30 },
      { "min": 0.801, "max": 1.0, "rate": 32 }
    ],

    "logistics_large_first_liter_rate": 46.00,
    "logistics_large_additional_liter_rate": 14.00,

    "return_logistics_fbo_rate": 50.00,
    "return_logistics_fbs_rate": 50.00,

    "storage_free_days": 60,
    "fbs_uses_fbo_logistics_rates": true
  }
}
```

**Бизнес-логика**:
- Single-row таблица `wb_tariff_settings` (id=1)
- Кэш 24 часа
- Источник данных: официальный PDF WB "Стоимость логистики, приёмки и хранения"

#### GET /v1/tariffs/settings/logistics

Расчёт стоимости логистики по объёму.

**Query Parameters:**
- `volumeLiters` (required): объём в литрах
- `fulfillmentType` (required): `FBO` | `FBS`

**Логика расчёта**:
```
Если volume ≤ 1L:
  → Используется volume_tier (23-32 ₽ фиксированно)

Если volume > 1L:
  → Прогрессивная формула: 46 + 14 × (volume - 1)

Примеры:
  0.5L → 29 ₽ (volume tier)
  1.5L → 46 + 14×0.5 = 53 ₽
  3.0L → 46 + 14×2.0 = 74 ₽
  5.0L → 46 + 14×4.0 = 102 ₽
```

#### GET /v1/tariffs/settings/acceptance/box

Расчёт стоимости приёмки для коробов.

**Query Parameters:**
- `volumeLiters` (required): объём в литрах

**Формула**: `1.70 ₽/литр × volumeLiters`

**⚠️ ВАЖНО**: Это базовая ставка! Для финальной стоимости нужно умножить на коэффициент склада из AcceptanceCoefficientsService.

#### GET /v1/tariffs/settings/storage/free

Проверка бесплатного периода хранения.

**Query Parameters:**
- `daysSinceShipment` (required): дней с момента поставки

**Логика**:
- Бесплатный период: **60 дней** (с 15 сентября 2025)
- `daysSinceShipment < 60` → хранение бесплатно

---

### 3. Warehouse Tariffs (WarehousesTariffsService)

**Файл документации**: [`test-api/18-tariffs.http`](../../../test-api/18-tariffs.http) — секция 3

#### GET /v1/tariffs/warehouses

Список всех складов WB.

**Response:**
```json
{
  "data": {
    "warehouses": [
      {
        "id": 507,
        "name": "Краснодар",
        "address": "...",
        "city": "Краснодар",
        "federalDistrict": "Южный ФО",
        "cargoType": 1,
        "deliveryType": 2,
        "latitude": 45.0355,
        "longitude": 38.9753
      }
    ],
    "meta": {
      "total": 50,
      "cached": true
    }
  }
}
```

#### GET /v1/tariffs/warehouses/box

Тарифы логистики и хранения по складам.

**Query Parameters:**
- `date` (optional): дата в формате `YYYY-MM-DD` (по умолчанию сегодня)

**Response:**
```json
{
  "data": {
    "tariffs": [
      {
        "warehouseName": "Краснодар",
        "geoName": "Южный ФО",

        "logistics": {
          "coefficient": 1.2,
          "baseLiterRub": 46.0,
          "additionalLiterRub": 14.0
        },

        "storage": {
          "coefficient": 1.0,
          "baseLiterRub": 0.07,
          "additionalLiterRub": 0.05
        }
      }
    ],
    "meta": {
      "date": "2026-01-19",
      "cached": true,
      "cache_ttl_seconds": 3600
    }
  }
}
```

**⚠️ ВАЖНО**: Этот эндпоинт НЕ возвращает коэффициенты приёмки! Используйте AcceptanceCoefficientsService.

---

### 4. Acceptance Coefficients (AcceptanceCoefficientsService) ✨ NEW

**Файл документации**: [`test-api/18-tariffs.http`](../../../test-api/18-tariffs.http) — секция 4

**Story**: 43.9 — Acceptance Coefficients Service

**SDK Module**: `ordersFBW` (НЕ `tariffs`!)

**Rate Limit**: 6 req/min (строже чем tariffs!)

#### GET /v1/tariffs/acceptance/coefficients

Коэффициенты приёмки для всех складов на 14 дней вперёд.

**Query Parameters:**
- `warehouseId` (optional): ID конкретного склада
- `warehouseIds` (optional): список ID через запятую

**Response:**
```json
{
  "data": {
    "coefficients": [
      {
        "warehouseId": 507,
        "warehouseName": "Краснодар",
        "date": "2026-01-20",

        "coefficient": 1,
        "isAvailable": true,
        "allowUnload": true,

        "boxTypeId": 2,
        "boxTypeName": "Boxes",

        "delivery": {
          "coefficient": 1.2,
          "baseLiterRub": 46.0,
          "additionalLiterRub": 14.0
        },

        "storage": {
          "coefficient": 1.0,
          "baseLiterRub": 0.07,
          "additionalLiterRub": 0.05
        },

        "isSortingCenter": false
      }
    ],
    "meta": {
      "total": 250,
      "available": 200,
      "unavailable": 50,
      "fetched_at": "2026-01-19T14:00:00Z",
      "cache_ttl_seconds": 3600
    }
  }
}
```

**Interpretation of `coefficient` field:**

| Value | Meaning | UI Recommendation |
|-------|---------|-------------------|
| `-1` | Приёмка недоступна | Показать "Недоступно", disabled |
| `0` | Приёмка бесплатная | Показать "Бесплатно" badge |
| `1` | Стандартная стоимость | Обычное отображение |
| `>1` | Повышенная стоимость | Показать warning (×1.5 = 150%) |

#### GET /v1/tariffs/acceptance/available

Список складов, доступных для приёмки на указанную дату.

**Query Parameters:**
- `date` (required): дата в формате `YYYY-MM-DD`
- `boxTypeId` (optional): `2` (Короба), `5` (Паллеты), `6` (Суперсейф)

**Response:**
```json
{
  "data": {
    "warehouses": [
      {
        "warehouseId": 507,
        "warehouseName": "Краснодар",
        "date": "2026-01-20",
        "coefficient": 0,
        "boxType": "Boxes",
        "isSortingCenter": false
      }
    ],
    "meta": {
      "date": "2026-01-20",
      "totalAvailable": 45,
      "filteredBy": "boxTypeId=2"
    }
  }
}
```

**Sorting**: Результаты отсортированы по `coefficient` ASC (самые дешёвые первыми).

---

## Формулы расчёта

### Комиссия WB

```typescript
// API field mapping
const COMMISSION_FIELD_MAP = {
  FBO: 'paidStorageKgvp',      // Fulfillment by Operator (склад WB)
  FBS: 'kgvpMarketplace',      // Fulfillment by Seller
  DBS: 'kgvpSupplier',         // Delivery by Seller
  EDBS: 'kgvpSupplierExpress', // Express DBS
};

// Usage
const commissionPct = commissionRate[COMMISSION_FIELD_MAP[fulfillmentType]];
```

### Логистика (Delivery)

```typescript
// Для товаров ≤ 1 литр — фиксированная ставка по тиру
const volumeTiers = [
  { min: 0.001, max: 0.2, rate: 23 },
  { min: 0.201, max: 0.4, rate: 26 },
  { min: 0.401, max: 0.6, rate: 29 },
  { min: 0.601, max: 0.8, rate: 30 },
  { min: 0.801, max: 1.0, rate: 32 },
];

// Для товаров > 1 литр — прогрессивная формула
const largeItemCost = firstLiterRate + additionalLiterRate * (volume - 1);
// Пример: 3L = 46 + 14 * 2 = 74 ₽

// С коэффициентом склада
const finalCost = baseCost * warehouseCoefficient;
// Пример: 74 * 1.2 = 88.80 ₽
```

### Приёмка (Acceptance)

```typescript
// Базовая формула
const acceptanceCost = baseRate * volumeLiters * coefficient;

// Пример: 5L, Краснодар (coefficient=1)
const cost = 1.70 * 5 * 1.0; // = 8.50 ₽

// Пример: 5L, склад с повышенным coefficient=1.5
const costHigh = 1.70 * 5 * 1.5; // = 12.75 ₽
```

### Хранение (Storage)

```typescript
// Формула
const storageCostPerDay = (baseLiterRub + additionalLiterRub * (volume - 1))
                          * coefficient
                          * daysStored;

// Бесплатный период
const isFree = daysSinceShipment < 60; // 60 дней бесплатно
```

---

## Frontend Integration Guide

### Story 44.12: Warehouse Dropdown

```tsx
import { useWarehouses } from '@/hooks/useTariffs';

function WarehouseSelector({ onSelect }) {
  const { data, isLoading } = useWarehouses();

  return (
    <Select onValueChange={onSelect}>
      {data?.warehouses.map(w => (
        <SelectItem key={w.id} value={String(w.id)}>
          {w.name} ({w.federalDistrict})
        </SelectItem>
      ))}
    </Select>
  );
}
```

### Story 44.13: Auto-fill Coefficients

```tsx
import { useAcceptanceCoefficients } from '@/hooks/useTariffs';

function PriceCalculatorForm({ warehouseId }) {
  const { data: coefficients } = useAcceptanceCoefficients(warehouseId);

  useEffect(() => {
    if (coefficients) {
      // Auto-fill form fields
      setValue('logistics_coefficient', coefficients.delivery.coefficient);
      setValue('storage_coefficient', coefficients.storage.coefficient);
      setValue('acceptance_coefficient', coefficients.coefficient);
    }
  }, [coefficients]);
}
```

### Story 44.14: Storage Cost Calculation

```tsx
function calculateStorageCost(
  volumeLiters: number,
  daysStored: number,
  storageCoefficient: number
): number {
  const baseLiterRub = 0.07;
  const additionalLiterRub = 0.05;

  const dailyCost = volumeLiters <= 1
    ? baseLiterRub * volumeLiters
    : baseLiterRub + additionalLiterRub * (volumeLiters - 1);

  return dailyCost * storageCoefficient * daysStored;
}
```

### Acceptance Availability Check

```tsx
function WarehouseAvailabilityBadge({ coefficient, allowUnload }) {
  if (coefficient === -1 || !allowUnload) {
    return <Badge variant="destructive">Недоступно</Badge>;
  }
  if (coefficient === 0) {
    return <Badge variant="success">Бесплатно</Badge>;
  }
  if (coefficient > 1) {
    return <Badge variant="warning">×{coefficient}</Badge>;
  }
  return <Badge variant="default">Стандартно</Badge>;
}
```

---

## API Client Example

```typescript
// src/lib/api/tariffs.ts

import { apiClient } from '@/lib/api-client';

// Commissions
export async function getCommissions(cabinetId: string) {
  return apiClient.get('/v1/tariffs/commissions');
}

export async function getCommissionByCategory(
  categoryId: number,
  fulfillmentType: 'FBO' | 'FBS' | 'DBS' | 'EDBS'
) {
  return apiClient.get(
    `/v1/tariffs/commissions/category/${categoryId}?fulfillmentType=${fulfillmentType}`
  );
}

// Warehouses
export async function getWarehouses() {
  return apiClient.get('/v1/tariffs/warehouses');
}

export async function getBoxTariffs(date?: string) {
  const params = date ? `?date=${date}` : '';
  return apiClient.get(`/v1/tariffs/warehouses/box${params}`);
}

// Acceptance Coefficients
export async function getAcceptanceCoefficients(warehouseIds?: number[]) {
  const params = warehouseIds
    ? `?warehouseIds=${warehouseIds.join(',')}`
    : '';
  return apiClient.get(`/v1/tariffs/acceptance/coefficients${params}`);
}

export async function getAvailableWarehouses(date: string, boxTypeId?: number) {
  const params = new URLSearchParams({ date });
  if (boxTypeId) params.append('boxTypeId', String(boxTypeId));
  return apiClient.get(`/v1/tariffs/acceptance/available?${params}`);
}
```

---

## Rate Limits

| Scope | Limit | Window | Endpoints |
|-------|-------|--------|-----------|
| `tariffs` | 10 req/min | 60s | commissions, warehouses, box |
| `orders_fbw` | 6 req/min | 60s | acceptance coefficients |

**⚠️ ВАЖНО**: Acceptance coefficients используют более строгий rate limit (6 req/min вместо 10).

---

## Cache Strategy

| Endpoint | Cache Key | TTL | Reason |
|----------|-----------|-----|--------|
| GET /commissions | `tariffs:commissions:{cabinetId}` | 24h | Редко меняются |
| GET /commissions/category | `tariffs:category:{cabinetId}:{parentId}` | 24h | Derived |
| GET /settings | `wb:tariff-settings:global` | 24h | Локальная БД |
| GET /warehouses | `tariffs:offices:{cabinetId}` | 24h | Редко меняются |
| GET /warehouses/box | `tariffs:box:{cabinetId}:{date}` | 1h | Коэффициенты меняются |
| GET /acceptance | `tariffs:acceptance:all:{cabinetId}` | 1h | Ежедневно обновляются |

---

## TypeScript Types

```typescript
// Commission Rate (from WB API)
interface CommissionRate {
  parentID: number;
  parentName?: string;
  subjectID: number;
  subjectName?: string;
  paidStorageKgvp: number;      // FBO %
  kgvpMarketplace: number;      // FBS %
  kgvpSupplier: number;         // DBS %
  kgvpSupplierExpress: number;  // EDBS %
  kgvpBooking: number;
  kgvpPickup: number;
}

// Acceptance Coefficient (transformed)
interface AcceptanceCoefficient {
  warehouseId: number;
  warehouseName: string;
  date: string;

  coefficient: number;    // -1 | 0 | ≥1
  isAvailable: boolean;
  allowUnload: boolean;

  boxTypeId: number;
  boxTypeName: string;

  delivery: {
    coefficient: number;
    baseLiterRub: number;
    additionalLiterRub: number;
  };

  storage: {
    coefficient: number;
    baseLiterRub: number;
    additionalLiterRub: number;
  };

  isSortingCenter: boolean;
}

// Available Warehouse (simplified)
interface AvailableWarehouse {
  warehouseId: number;
  warehouseName: string;
  date: string;
  coefficient: number;
  boxType: string;
  isSortingCenter: boolean;
}

type FulfillmentType = 'FBO' | 'FBS' | 'DBS' | 'EDBS';
type BoxTypeId = 2 | 5 | 6; // 2=Boxes, 5=Pallets, 6=Supersafe
```

---

## Documentation References

### Backend Documentation
- **API Test Collection**: [`test-api/18-tariffs.http`](../../../test-api/18-tariffs.http)
- **Knowledge Base**: [`docs/stories/epic-43/story-43.8-wb-tariffs-knowledge-base.md`](../../../docs/stories/epic-43/story-43.8-wb-tariffs-knowledge-base.md)
- **Story 43.1**: [`docs/stories/epic-43/story-43.1-tariffs-integration.md`](../../../docs/stories/epic-43/story-43.1-tariffs-integration.md)
- **Story 43.9**: [`docs/stories/epic-43/story-43.9-acceptance-coefficients-service.md`](../../../docs/stories/epic-43/story-43.9-acceptance-coefficients-service.md)

### Source Code
- **TariffsService**: `src/tariffs/tariffs.service.ts`
- **WbTariffSettingsService**: `src/tariffs/wb-tariff-settings.service.ts`
- **WarehousesTariffsService**: `src/tariffs/warehouses-tariffs.service.ts`
- **AcceptanceCoefficientsService**: `src/tariffs/acceptance-coefficients.service.ts`
- **Types**: `src/tariffs/types/acceptance-coefficients.types.ts`

### External
- [WB Tariffs API Docs](https://dev.wildberries.ru/openapi/wb-tariffs)
- [WB OrdersFBW API Docs](https://dev.wildberries.ru/openapi/wb-fulfillment-supplies)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-19 | Initial implementation (Stories 43.1, 43.5, 43.8, 43.9) |
| 2026-01-19 | FBO/FBS commission analysis (96.5% FBS > FBO) |
| 2026-01-19 | AcceptanceCoefficientsService implementation (OrdersFBW module) |
| 2026-01-19 | API documentation in test-api/18-tariffs.http |

---

**Status**: ✅ IMPLEMENTED
**Last Updated**: 2026-01-19
**Author**: Backend Team

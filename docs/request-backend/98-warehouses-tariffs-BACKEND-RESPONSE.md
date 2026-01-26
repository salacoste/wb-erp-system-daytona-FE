# Request #98: Warehouses & Tariffs Coefficients API - BACKEND RESPONSE

**Date**: 2026-01-19
**Status**: ✅ PRODUCTION READY
**Priority**: P1 - IMPORTANT
**Related Epic**: Epic 43 (Price Calculator), Epic 44-FE (Price Calculator UI)
**Backend Stories**: 43.1, 43.5, 43.8, 43.9
**Last Updated**: 2026-01-25

---

## ⚠️ CRITICAL: Two Tariff Systems

**Wildberries has TWO different tariff systems**, both **already implemented**:

| Система | Назначение | SDK Метод | Service | Endpoint |
|---------|------------|-----------|--------|----------|
| **Inventory (остатки)** | Фактические затраты на хранение | `sdk.tariffs.getTariffsBox()` | `WarehousesTariffsService` | `GET /v1/tariffs/warehouses-with-tariffs` |
| **Supply (поставка)** | Планирование поставок на 14 дней | `sdk.ordersFBW.getAcceptanceCoefficients()` | `AcceptanceCoefficientsService` | `GET /v1/tariffs/acceptance/coefficients` |

**Ключевое понимание**: Разница между Marketplace (более высокие ставки) и нашим API обусловлена тем, что:
- Marketplace показывает ставки **Supply** (для планирования)
- Наш API возвращает ставки **Inventory** (текущие затраты)

**Это правильное поведение** - системы serve разные цели.

### Когда использовать какую систему?

| Сценарий | Система | Endpoint | Причина |
|----------|---------|----------|---------|
| **Price Calculator** (текущие затраты) | Inventory | `/warehouses-with-tariffs` | Фактические ставки на сегодня |
| **Price Calculator** (планирование доставки) | Supply | `/acceptance/coefficients` | Прогноз на 14 дней |
| **Финансовые отчеты** | Inventory | `/warehouses-with-tariffs` | Реальные понесенные расходы |
| **Планирование поставок** | Supply | `/acceptance/coefficients/all` | 14-дневный прогноз |
| **Анализ затрат на хранение** | Inventory | `/warehouses-with-tariffs` | Фактические затраты |

📖 **Полное руководство**: [`108-two-tariff-systems-guide.md`](./108-two-tariff-systems-guide.md)

---

## ✅ IMPLEMENTATION STATUS

**ALL 6 ENDPOINTS IMPLEMENTED:**
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/v1/tariffs/warehouses-with-tariffs` | GET | ✅ | Aggregated warehouses + tariffs |
| `/v1/tariffs/warehouses` | GET | ✅ | Simplified warehouse list |
| `/v1/tariffs/commissions` | GET | ✅ | Commission categories |
| `/v1/tariffs/settings` | GET | ✅ | Global tariff settings |
| `/v1/tariffs/acceptance/coefficients` | GET | ✅ | Acceptance coefficients by warehouse |
| `/v1/tariffs/acceptance/coefficients/all` | GET | ✅ | All acceptance coefficients |

**NOT IMPLEMENTED (wishlist - filter client-side):**
| Endpoint | Status | Recommendation |
|----------|--------|----------------|
| `GET /v1/tariffs/commissions/category/:id` | ❌ NOT IMPLEMENTED | Use client-side filter on `/commissions` |
| `GET /v1/tariffs/commissions/product/:nmId` | ❌ NOT IMPLEMENTED | Use Products API category + filter |
| `GET /v1/tariffs/settings/logistics` | ❌ NOT IMPLEMENTED | Calculate client-side |
| `GET /v1/tariffs/settings/acceptance/box` | ❌ NOT IMPLEMENTED | Data in `/settings` |
| `GET /v1/tariffs/settings/storage/free` | ❌ NOT IMPLEMENTED | Data in `/settings` |
| `GET /v1/tariffs/warehouses/box` | ❌ WRONG PATH | Use `/warehouses-with-tariffs` |
| `GET /v1/tariffs/acceptance/available` | ❌ NOT IMPLEMENTED | Filter client-side |

**Actual API documentation**: See `test-api/18-tariffs.http`

### Storage Fallback Logic

When WB API returns zero or missing storage rates, the backend automatically applies fallback values from `WbTariffSettings`:

**Default Values**:
- `storage_box_base_per_day`: 0.11 ₽/день
- `storage_box_liter_per_day`: 0.11 ₽/литр/день

**Fallback Condition**: `storageBase > 0 ? storageBase : defaultStorageBasePerDay ?? storageBase`

**For Frontend Developers**:
- You don't need to implement fallback logic on the frontend
- The backend already substitutes default values when WB API returns 0
- See `frontend/docs/request-backend/105-tariffs-storage-fallback-guide.md` for details

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

#### ~~GET /v1/tariffs/commissions/category/{categoryId}~~ ❌ NOT IMPLEMENTED

> **⚠️ Этот endpoint НЕ реализован.**
>
> **Альтернатива:** Получите все комиссии через `GET /v1/tariffs/commissions` и отфильтруйте по `parentID` на клиенте.

#### ~~GET /v1/tariffs/commissions/product/{nmId}~~ ❌ NOT IMPLEMENTED

> **⚠️ Этот endpoint НЕ реализован.**
>
> **Альтернатива:** Используйте Products API для получения категории товара, затем найдите комиссию в `/commissions`.

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

#### ~~GET /v1/tariffs/settings/logistics~~ ❌ NOT IMPLEMENTED

> **⚠️ Этот endpoint НЕ реализован.**
>
> **Альтернатива:** Получите `logistics_volume_tiers` из `GET /v1/tariffs/settings` и рассчитайте на клиенте:
> ```typescript
> // Логика расчёта (client-side)
> if (volume <= 1) {
>   // Используется volume_tier (23-32 ₽ фиксированно)
> } else {
>   // Прогрессивная формула: 46 + 14 × (volume - 1)
> }
> ```

#### ~~GET /v1/tariffs/settings/acceptance/box~~ ❌ NOT IMPLEMENTED

> **⚠️ Этот endpoint НЕ реализован.**
>
> **Альтернатива:** Используйте `acceptance_box_rate_per_liter` из `GET /v1/tariffs/settings`:
> ```typescript
> const cost = settings.acceptance_box_rate_per_liter * volumeLiters * coefficient;
> ```

#### ~~GET /v1/tariffs/settings/storage/free~~ ❌ NOT IMPLEMENTED

> **⚠️ Этот endpoint НЕ реализован.**
>
> **Альтернатива:** Используйте `storage_free_days` из `GET /v1/tariffs/settings`:
> ```typescript
> const isFree = daysSinceShipment < settings.storage_free_days; // 60 дней
> ```

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

#### ~~GET /v1/tariffs/warehouses/box~~ ❌ NOT IMPLEMENTED (WRONG PATH)

> **⚠️ Этот endpoint НЕ существует!**
>
> **✅ Используйте:** `GET /v1/tariffs/warehouses-with-tariffs`
>
> ```json
> {
>   "warehouses": [
>     {
>       "id": 507,
>       "name": "Краснодар",
>       "federal_district": "Южный ФО",
>       "tariffs": {
>         "fbo": {
>           "logistics_coefficient": 1.2,
>           "delivery_base_rub": 46.0,
>           "delivery_liter_rub": 14.0
>         },
>         "storage": {
>           "coefficient": 1.0,
>           "base_per_day_rub": 0.07,
>           "liter_per_day_rub": 0.05
>         }
>       }
>     }
>   ],
>   "updated_at": "2026-01-22T10:00:00Z"
> }
> ```

**⚠️ ВАЖНО**: Для коэффициентов приёмки используйте `GET /v1/tariffs/acceptance/coefficients`.

---

### 4. Acceptance Coefficients (AcceptanceCoefficientsService) ✨ NEW

**Файл документации**: [`test-api/18-tariffs.http`](../../../test-api/18-tariffs.http) — секция 4

**Story**: 43.9 — Acceptance Coefficients Service

**SDK Module**: `ordersFBW` (НЕ `tariffs`!)

**Rate Limit**: 6 req/min (строже чем tariffs!)

#### GET /v1/tariffs/acceptance/coefficients/all

**SUPPLY System** - Коэффициенты приёмки для всех складов на 14 дней вперёд.

**Query Parameters:**
- `warehouseId` (optional): ID конкретного склада
- `warehouseIds` (optional): список ID через запятую

**Response (SUPPLY System):**
```json
{
  "coefficients": [
    {
      "warehouseId": 130744,
      "warehouseName": "Краснодар (Тихорецкая)",
      "date": "2026-01-27T00:00:00Z",
      "boxTypeId": 5,
      "boxTypeName": "Pallets",
      "coefficient": 1,
      "isAvailable": true,
      "allowUnload": true,
      "delivery": {
        "coefficient": 1.65,
        "baseLiterRub": 75,
        "additionalLiterRub": 23
      },
      "storage": {
        "coefficient": 1.65,
        "baseLiterRub": 41.25,
        "additionalLiterRub": 0
      },
      "isSortingCenter": false
    }
  ]
}
```

**Box Type Values:**
- `boxTypeId: 2` → "Boxes" (Коробки)
- `boxTypeId: 5` → "Pallets" (Паллеты)
- `boxTypeId: 6` → "Supersafe" (Суперсейф)

**Calculation Formulas (Backend Applied):**

```typescript
// Logistics Cost
logistics = (baseLiterRub + max(0, volume-1) × additionalLiterRub) × deliveryCoef

// Storage Cost (Per Day)
dailyStorage = (baseLiterRub + max(0, volume-1) × additionalLiterRub) × storageCoef
storage = dailyStorage × days
```

**IMPORTANT for Pallets (boxTypeId: 5):**
- `additionalLiterRub = 0` for storage (null in WB API)
- Storage becomes fixed rate: `baseLiterRub × storageCoef × days`

**Example Calculation (1 liter, 30 days, Краснодар Pallets):**

```typescript
// Logistics
logistics = (75 + 0 × 23) × 1.65 = 123.75 ₽

// Storage (Pallets have additionalLiterRub = 0)
dailyStorage = (41.25 + 0 × 0) × 1.65 = 68.06 ₽/день
storage = 68.06 × 30 = 2041.80 ₽

// Total
total = 123.75 + 2041.80 = 2165.55 ₽
```

**Coefficient Interpretation:**

| Value | Meaning | UI Recommendation |
|-------|---------|-------------------|
| `-1` | Приёмка недоступна | Показать "Недоступно", disabled |
| `0` | Приёмка бесплатная | Показать "Бесплатно" badge |
| `1` | Стандартная стоимость | Обычное отображение |
| `>1` | Повышенная стоимость | Показать warning (×1.65 = 165%) |

**Key Differences from INVENTORY System:**
- **Date-specific**: Returns coefficients for specific dates (14-day window)
- **Box type separated**: Different rates for Boxes vs Pallets
- **Forward-looking**: Planning rates, not current actual costs
- **Higher rates**: Typically 20-60% higher than INVENTORY rates
- **null handling**: Pallets have `additionalLiterRub = null` for storage (treated as 0)

#### ~~GET /v1/tariffs/acceptance/available~~ ❌ NOT IMPLEMENTED

> **⚠️ Этот endpoint НЕ реализован.**
>
> **Альтернатива:** Получите данные из `GET /v1/tariffs/acceptance/coefficients/all` и отфильтруйте на клиенте:
> ```typescript
> const available = coefficients.filter(c =>
>   c.coefficient >= 0 && c.allowUnload === true
> );
> // Сортировка по coefficient ASC
> available.sort((a, b) => a.coefficient - b.coefficient);
> ```

---

## Сравнительная таблица тарифных систем

| Характеристика | **INVENTORY System** | **SUPPLY System** |
|---------------|---------------------|-------------------|
| **Endpoint** | `/v1/tariffs/warehouses-with-tariffs` | `/v1/tariffs/acceptance/coefficients/all` |
| **Service** | `WarehousesTariffsService` | `AcceptanceCoefficientsService` |
| **SDK Method** | `sdk.tariffs.getTariffsBox()` | `sdk.ordersFBW.getAcceptanceCoefficients()` |
| **Назначение** | Фактические затраты на хранение | Планирование поставок на 14 дней |
| **Временной охват** | Текущие тарифы на сегодня | Прогноз на 14 дней вперёд |
| **Box Type** | Не разделяется (общие тарифы) | Разделяется: Boxes (2), Pallets (5), Supersafe (6) |
| **Date Field** | `effective_from`, `effective_until` | `date` (конкретная дата поставки) |
| **Warehouse IDs** | ID из `sdk.products.offices()` | ID из `sdk.ordersFBW.getAcceptanceCoefficients()` |
| **Rate Limit** | 10 req/min (scope: tariffs) | 6 req/min (scope: orders_fbw) |
| **Cache TTL** | 1 hour | 1 hour |
| **Уровень ставок** | Базовые (фактические) | Повышенные (планирование) |
| **Coef Expression** | Проценты → множитель (120% → 1.2) | Проценты → множитель (165% → 1.65) |
| **Storage null handling** | Использует fallback значения | `additionalLiterRub = 0` для Pallets |
| **Использовать для** | Price Calculator (текущие затраты) | Price Calculator (планирование доставки) |

### Когда использовать какую систему?

| Сценарий | Система | Endpoint | Причина |
|----------|---------|----------|---------|
| **Price Calculator** (текущие затраты) | INVENTORY | `/warehouses-with-tariffs` | Фактические ставки на сегодня |
| **Price Calculator** (планирование доставки) | SUPPLY | `/acceptance/coefficients/all` | Прогноз на 14 дней |
| **Финансовые отчеты** | INVENTORY | `/warehouses-with-tariffs` | Реальные понесенные расходы |
| **Планирование поставок** | SUPPLY | `/acceptance/coefficients/all` | 14-дневный прогноз |
| **Анализ затрат на хранение** | INVENTORY | `/warehouses-with-tariffs` | Фактические затраты |
| **Сравнение Boxes vs Pallets** | SUPPLY | `/acceptance/coefficients/all` | Разделение по boxTypeId |

### Warehouse ID Mapping

**IMPORTANT**: Different systems use different warehouse IDs!

| Warehouse Name | INVENTORY ID | SUPPLY ID |
|----------------|--------------|-----------|
| Краснодар | 507 | 130744 |
| Краснодар (Тихорецкая) | - | 130744 |
| Коледино | 117686 | 117686 |
| Электросталь | 117825 | 117825 |

**Solution**: Use `GET /v1/tariffs/acceptance/coefficients/all` to discover valid SUPPLY warehouse IDs.

---

## Формулы расчёта

### 1. Комиссия WB

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
// Logistics Formula (applies to BOTH systems)
logistics = (baseLiterRub + max(0, volume-1) × additionalLiterRub) × deliveryCoef

// Example: 3 liter item, Pallets (SUPPLY system)
logistics = (75 + 2 × 23) × 1.65
          = (75 + 46) × 1.65
          = 121 × 1.65
          = 199.65 ₽

// Example: 3 liter item, INVENTORY system
logistics = (46 + 2 × 14) × 1.2
          = (46 + 28) × 1.2
          = 74 × 1.2
          = 88.80 ₽
```

**INVENTORY System** (Current costs):
- Uses `logistics_coefficient` from tariffs
- Fixed rates: `delivery_base_rub`, `delivery_liter_rub`

**SUPPLY System** (Planning):
- Uses `delivery.coefficient` (multiplier, e.g., 1.65 = 165%)
- Per-box-type rates: `delivery.baseLiterRub`, `delivery.additionalLiterRub`
- Separates Boxes (2), Pallets (5), Supersafe (6)

### Приёмка (Acceptance) - SUPPLY System ONLY

**Only SUPPLY system provides acceptance coefficients:**

```typescript
// Acceptance availability coefficient
acceptanceAvailable = coefficient >= 0 && allowUnload

// Coefficient interpretation
-1 = Недоступно (unavailable)
 0 = Бесплатно (free)
 1 = Стандартно (standard)
>1 = Повышенная стоимость (increased cost, e.g., 1.65 = 165%)
```

**UI Display Recommendations:**
```typescript
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
```

### Хранение (Storage)

**BOTH SYSTEMS (INVENTORY & SUPPLY):**

```typescript
// Storage Formula (per day)
dailyStorage = (baseLiterRub + max(0, volume-1) × additionalLiterRub) × storageCoef

// Total storage cost
storage = dailyStorage × days

// Example: 1 liter, 30 days, Pallets (SUPPLY system)
dailyStorage = (41.25 + 0 × 0) × 1.65
            = 41.25 × 1.65
            = 68.06 ₽/день

storage = 68.06 × 30 = 2041.80 ₽

// Example: 1 liter, 30 days, INVENTORY system
dailyStorage = (0.07 + 0 × 0.05) × 1.0
            = 0.07 ₽/день

storage = 0.07 × 30 = 2.10 ₽
```

**IMPORTANT for Pallets (SUPPLY system, boxTypeId: 5):**
- `additionalLiterRub = 0` (null in WB API)
- Storage becomes **fixed rate**: `baseLiterRub × storageCoef × days`
- No volume-based calculation for storage

**INVENTORY System** (Current costs):
- Uses fallback values when WB API returns 0
- Default: `base_per_day_rub = 0.07 ₽`, `liter_per_day_rub = 0.05 ₽`

**SUPPLY System** (Planning):
- Per-box-type rates: `storage.baseLiterRub`, `storage.additionalLiterRub`
- Higher coefficients (e.g., 1.65 = 165%)

**Free Storage Period:**
```typescript
// Free storage for first 60 days
const isFree = daysSinceShipment < 60;
const storageCost = isFree ? 0 : dailyStorage × days;
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
  // ⚠️ Note: Uses /warehouses-with-tariffs, NOT /warehouses/box
  return apiClient.get(`/v1/tariffs/warehouses-with-tariffs${params}`);
}

// Acceptance Coefficients
export async function getAcceptanceCoefficients(warehouseIds?: number[]) {
  const params = warehouseIds
    ? `?warehouseIds=${warehouseIds.join(',')}`
    : '';
  return apiClient.get(`/v1/tariffs/acceptance/coefficients${params}`);
}

// ⚠️ NOT IMPLEMENTED - use client-side filtering instead:
// export async function getAvailableWarehouses(date: string, boxTypeId?: number) {
//   // Filter data from /acceptance/coefficients/all on client
// }
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

// Acceptance Coefficient (SUPPLY system, transformed)
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

// Warehouse with INVENTORY tariffs
interface Warehouse {
  id: number;
  name: string;
  city: string;
  federal_district: string | null;
  coordinates: {
    lat: number;
    lon: number;
  };
  cargo_type: 'MGT' | 'SGT' | 'KGT';
  delivery_types: string[];
  tariffs: WarehouseTariffs | null;
}

// INVENTORY System Tariffs
interface WarehouseTariffs {
  fbo: {
    delivery_base_rub: number;
    delivery_liter_rub: number;
    logistics_coefficient: number;
  };
  fbs: {
    delivery_base_rub: number;
    delivery_liter_rub: number;
    logistics_coefficient: number;
  };
  storage: {
    base_per_day_rub: number;
    liter_per_day_rub: number;
    coefficient: number;
  };
  effective_from: string;
  effective_until: string;
}

// SUPPLY System Date Tariffs
interface SupplyDateTariffs {
  date: string;
  warehouseId: number;
  warehouseName: string;
  coefficient: number;         // -1 | 0 | ≥1
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

// Extracted tariffs (normalized for calculation)
interface ExtractedTariffs {
  deliveryBaseLiterRub: number;
  deliveryPerLiterRub: number;
  storageBaseLiterRub: number;
  storagePerLiterRub: number;
  logisticsCoefficient: number;
  storageCoefficient: number;
  source: 'inventory' | 'supply';
  isAvailable?: boolean;
}

// Type definitions
type FulfillmentType = 'FBO' | 'FBS' | 'DBS' | 'EDBS';
type BoxTypeId = 2 | 5 | 6; // 2=Boxes, 5=Pallets, 6=Supersafe
type TariffSystem = 'inventory' | 'supply';
```

---

## Documentation References

### Backend Documentation
- **API Test Collection**: [`test-api/18-tariffs.http`](../../../test-api/18-tariffs.http)
- **Knowledge Base**: [`docs/stories/epic-43/story-43.8-wb-tariffs-knowledge-base.md`](../../../docs/stories/epic-43/story-43.8-wb-tariffs-knowledge-base.md)
- **Story 43.1**: [`docs/stories/epic-43/story-43.1-tariffs-integration.md`](../../../docs/stories/epic-43/story-43.1-tariffs-integration.md)
- **Story 43.9**: [`docs/stories/epic-43/story-43.9-acceptance-coefficients-service.md`](../../../docs/stories/epic-43/story-43.9-acceptance-coefficients-service.md)
- **[Tariffs Formulas Validation Report](104-tariffs-formulas-validation-report.md)** - Complete formula validation with examples (✅ ALL CHECKS PASSED)

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
| 2026-01-22 | **Documentation Audit**: Marked non-implemented endpoints, updated status |
| 2026-01-27 | **SUPPLY System Documentation**: Added boxTypeId, calculation formulas, real test results |

---

## Real Test Results (2026-01-27)

**Test Scenario**: Краснодар (Тихорецкая) warehouse, delivery date 2026-01-27

**SUPPLY API Response** (`/v1/tariffs/acceptance/coefficients/all`):

```json
{
  "coefficients": [
    {
      "warehouseId": 130744,
      "warehouseName": "Краснодар (Тихорецкая)",
      "date": "2026-01-27T00:00:00Z",
      "boxTypeId": 5,
      "boxTypeName": "Pallets",
      "coefficient": 1,
      "isAvailable": true,
      "allowUnload": true,
      "delivery": {
        "coefficient": 1.65,
        "baseLiterRub": 75,
        "additionalLiterRub": 23
      },
      "storage": {
        "coefficient": 1.65,
        "baseLiterRub": 41.25,
        "additionalLiterRub": 0
      },
      "isSortingCenter": false
    }
  ]
}
```

**Calculated Costs** (1 liter, 30 days):

| Component | Formula | Result |
|-----------|---------|--------|
| **Logistics** | `(75 + 0 × 23) × 1.65` | 123.75 ₽ |
| **Storage (daily)** | `(41.25 + 0 × 0) × 1.65` | 68.06 ₽/день |
| **Storage (30 days)** | `68.06 × 30` | 2041.80 ₽ |
| **TOTAL** | `123.75 + 2041.80` | **2165.55 ₽** |

**Key Findings**:
1. **Pallets have `additionalLiterRub = 0` for storage** (fixed rate per day)
2. **Coefficients are multipliers** (1.65 = 165%, not 1.65%)
3. **SUPPLY rates are significantly higher** than INVENTORY rates
4. **Backend handles comma decimal separator** (e.g., "0,13" → 0.13)
5. **Warehouse IDs differ** between systems (INVENTORY: 507, SUPPLY: 130744)

**Reference Test Script**: `src/scripts/test-krasnodar-tariffs-2026-01-27.ts`

---

**Status**: ✅ PRODUCTION READY (6 endpoints implemented)
**Last Updated**: 2026-01-27
**Author**: Backend Team

---

## ⚠️ Documentation Audit (2026-01-22)

**Реализовано:** 6 endpoints (см. Implementation Status выше)

**НЕ реализовано (wishlist):** 7 endpoints помечены как `❌ NOT IMPLEMENTED` с альтернативами:
- `GET /v1/tariffs/commissions/category/:id` → filter client-side
- `GET /v1/tariffs/commissions/product/:nmId` → use Products API
- `GET /v1/tariffs/settings/logistics` → calculate client-side
- `GET /v1/tariffs/settings/acceptance/box` → use `/settings` data
- `GET /v1/tariffs/settings/storage/free` → use `/settings` data
- `GET /v1/tariffs/warehouses/box` → use `/warehouses-with-tariffs`
- `GET /v1/tariffs/acceptance/available` → filter client-side

**Actual API Reference**: `test-api/15-tariffs-endpoints.http`, `test-api/18-tariffs.http`

---

**Status**: ✅ PRODUCTION READY (6 endpoints implemented)
**Last Updated**: 2026-01-25
**Author**: Backend Team

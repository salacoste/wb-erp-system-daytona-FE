# Request #98: Warehouses & Tariffs Coefficients API

**Date**: 2026-01-19
**Status**: ✅ IMPLEMENTED
**Priority**: P1 - IMPORTANT
**Related Epic**: Epic 44-FE (Price Calculator UI) - Phase 3
**Frontend Stories**: 44.12, 44.13, 44.14
**Backend Stories**: 43.1, 43.5, 43.8, 43.9

---

## ✅ BACKEND RESPONSE AVAILABLE

**См. полный ответ backend команды**: [98-warehouses-tariffs-BACKEND-RESPONSE.md](./98-warehouses-tariffs-BACKEND-RESPONSE.md)

**API Documentation**: [test-api/18-tariffs.http](../../../test-api/18-tariffs.http)

### Реализованные сервисы:

| Сервис | Story | Описание |
|--------|-------|----------|
| TariffsService | 43.1 | Комиссии по категориям (FBO/FBS) |
| WbTariffSettingsService | 43.8 | Глобальные настройки тарифов |
| WarehousesTariffsService | 43.5 | Склады + тарифы логистики/хранения |
| AcceptanceCoefficientsService | 43.9 | Коэффициенты приёмки FBO ✨ NEW |

---

## Summary

Запрос на реализацию API для получения списка складов WB и тарифных коэффициентов (логистика + хранение) для калькулятора цен.

**Контекст:** Price Calculator (Epic 44) требует точного расчёта логистики и хранения. Тарифы зависят от склада назначения и включают коэффициенты, которые меняются.

**Источник бизнес-логики:** [WB Seller Portal - Логистика и хранение](https://seller.wildberries.ru/instructions/ru/ru/material/logistics-acceptance-warehouse-storage-costs)

---

## User Story

> **Как** селлер,
> **Я хочу** выбрать склад для поставки и видеть актуальные коэффициенты,
> **Чтобы** точно рассчитать стоимость логистики и хранения для калькулятора цен.

---

## WB SDK Methods (Available)

### 1. Список складов

```typescript
// SDK Method
sdk.products.getOffices(): Promise<Office[]>

interface Office {
  id: number;              // Office ID
  name: string;            // Название склада
  address: string;         // Адрес
  city: string;            // Город
  cargoType: 1|2|3;        // 1=MGT, 2=SGT, 3=KGT+
  deliveryType: 1|2|3|5|6; // 1=FBS, 2=DBS, 3=DBW, 5=C&C, 6=EDBS
  federalDistrict: string; // Федеральный округ
  latitude: number;
  longitude: number;
}
```

**Rate Limit:** 60 req/min

### 2. Тарифы с коэффициентами (Box - мелкие товары)

```typescript
// SDK Method
sdk.tariffs.getTariffsBox(): Promise<ModelsWarehousesBoxRates>

interface ModelsWarehouseBoxRates {
  warehouseName: string;           // Название склада
  geoName: string;                 // Регион (ФО)

  // КОЭФФИЦИЕНТЫ
  boxDeliveryCoefExpr: string;     // Коэфф. логистики (%)
  boxStorageCoefExpr: string;      // Коэфф. хранения (%)

  // БАЗОВЫЕ ТАРИФЫ ЛОГИСТИКИ
  boxDeliveryBase: string;         // Первый литр (₽)
  boxDeliveryLiter: string;        // Доп. литр (₽)

  // БАЗОВЫЕ ТАРИФЫ ХРАНЕНИЯ
  boxStorageBase: string;          // Первый литр/день (₽)
  boxStorageLiter: string;         // Доп. литр/день (₽)
}
```

**Rate Limit:** 60 req/min

### 3. Тарифы (Pallet - крупные товары)

```typescript
// SDK Method
sdk.tariffs.getTariffsPallet(): Promise<ModelsWarehousesPalletRates>

interface ModelsWarehousePalletRates {
  warehouseName: string;
  palletDeliveryExpr: string;      // Коэфф. доставки (%)
  palletStorageExpr: string;       // Коэфф. хранения (%)
  palletDeliveryValueBase: string; // База доставки (₽)
  palletDeliveryValueLiter: string;// Доп. литр (₽)
  palletStorageValueExpr: string;  // Хранение монопаллеты (₽)
}
```

---

## Requested API Endpoints

### Endpoint 1: GET /v1/tariffs/warehouses

**Описание:** Список складов WB с базовой информацией

**✅ IMPLEMENTED** - Story 43.10

**Actual Response Format (Verified):**
```json
{
  "data": {
    "warehouses": [
      {
        "id": 507,
        "name": "Краснодар",
        "address": null,
        "city": "Краснодар",
        "federalDistrict": "Южный ФО"
      },
      {
        "id": 23,
        "name": "Коледино",
        "address": null,
        "city": "Подольск",
        "federalDistrict": "Центральный ФО"
      }
    ],
    "updated_at": "2026-01-21T10:00:00Z"
  }
}
```

**Field Mapping:**
- `id` (number) - Warehouse ID
- `name` (string) - Warehouse name
- `address` (null) - Not available in simplified response
- `city` (string) - City name
- `federalDistrict` (string | null) - Federal district
- `updated_at` (ISO string) - Response timestamp

**Curl Example:**
```bash
curl -X GET "http://localhost:3000/v1/tariffs/warehouses" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Cabinet-Id: YOUR_CABINET_ID" \
  | jq '.data.warehouses | length'

# Expected: 45-50 warehouses
```

### Endpoint 2: GET /v1/tariffs/box

**Описание:** Тарифы и коэффициенты для мелких товаров по всем складам

**Response:**
```json
{
  "data": {
    "effective_from": "2026-01-20",
    "effective_until": "2026-02-01",
    "warehouses": [
      {
        "warehouse_name": "Коледино",
        "geo_name": "Центральный ФО",

        "logistics_coefficient": 1.0,
        "storage_coefficient": 1.0,

        "delivery_base_rub": 46.0,
        "delivery_liter_rub": 14.0,

        "storage_base_rub": 0.07,
        "storage_liter_rub": 0.05
      },
      {
        "warehouse_name": "Хабаровск",
        "geo_name": "Дальневосточный ФО",

        "logistics_coefficient": 1.5,
        "storage_coefficient": 0.8,

        "delivery_base_rub": 46.0,
        "delivery_liter_rub": 14.0,

        "storage_base_rub": 0.07,
        "storage_liter_rub": 0.05
      }
    ]
  }
}
```

### Endpoint 3: GET /v1/tariffs/box/{warehouse_name}

**Описание:** Тарифы для конкретного склада

**Path Parameters:**
- `warehouse_name` - Название склада (URL-encoded)

**Response:**
```json
{
  "data": {
    "warehouse_name": "Коледино",
    "geo_name": "Центральный ФО",
    "effective_from": "2026-01-20",

    "logistics": {
      "coefficient": 1.0,
      "base_rub": 46.0,
      "per_liter_rub": 14.0
    },

    "storage": {
      "coefficient": 1.0,
      "base_per_day_rub": 0.07,
      "per_liter_per_day_rub": 0.05
    },

    "fbs": {
      "coefficient": 1.2,
      "base_rub": 50.0,
      "per_liter_rub": 16.0
    }
  }
}
```

---

## Questions for Backend Team

### 1. Кэширование

**Вопрос:** Какой TTL для кэширования тарифов?

**Предложение:**
- Warehouses list: 24 часа (редко меняется)
- Tariffs/coefficients: 1 час (могут меняться чаще)

### 2. Cargo Type Filtering

**Вопрос:** Нужно ли фильтровать склады по типу груза (MGT/SGT/KGT)?

**Контекст:** В калькуляторе пользователь вводит габариты → определяем тип груза → показываем только подходящие склады?

### 3. FBS vs FBO Tariffs

**Вопрос:** Какие тарифы использовать по умолчанию?

**Варианты:**
- FBO (склад WB) - `boxDeliveryBase/Liter`
- FBS (склад продавца) - `boxDeliveryMarketplaceBase/Liter`

**Предложение:** По умолчанию FBO, с возможностью переключения.

### 4. Coefficient Expression Format

**Вопрос:** Коэффициенты в SDK возвращаются как строки (`"125"` = 125%). Нужно ли нормализовать?

**Предложение:** Backend конвертирует в decimal (1.25) для удобства frontend.

### 5. Return Logistics

**Вопрос:** Использовать ли отдельный endpoint для тарифов возврата?

**SDK Method:** `sdk.tariffs.getTariffsReturn()`

### 6. Commission by Category

**Вопрос:** Планируется ли отдельный endpoint для категорий с комиссиями?

**Контекст:** Story 44.11 требует dropdown выбора категории для auto-fill комиссии.

---

## Implementation Proposal

### Backend Service Structure

```
src/tariffs/
├── tariffs.module.ts
├── tariffs.controller.ts        # API endpoints
├── tariffs.service.ts           # EXISTING (commission only)
├── warehouses.service.ts        # NEW
├── box-tariffs.service.ts       # NEW
└── dto/
    ├── warehouse.dto.ts
    └── box-tariff.dto.ts
```

### Caching Strategy

| Data | TTL | Redis Key Pattern |
|------|-----|-------------------|
| Warehouses list | 24h | `tariffs:warehouses:{cabinetId}` |
| Box tariffs (all) | 1h | `tariffs:box:all:{cabinetId}` |
| Box tariffs (single) | 1h | `tariffs:box:{warehouseName}:{cabinetId}` |

### Rate Limiting

| Endpoint | Limit | Scope |
|----------|-------|-------|
| GET /v1/tariffs/warehouses | 10/min | per cabinet |
| GET /v1/tariffs/box | 10/min | per cabinet |
| GET /v1/tariffs/box/{name} | 30/min | per cabinet |

---

## Frontend Usage (Phase 3)

### Story 44.12: Warehouse Dropdown
```tsx
// Component: WarehouseSelector.tsx
const { data: warehouses } = useWarehouses()

<Select onValueChange={handleWarehouseChange}>
  {warehouses.map(w => (
    <SelectItem key={w.id} value={w.name}>
      {w.name} ({w.federal_district})
    </SelectItem>
  ))}
</Select>
```

### Story 44.13: Auto-fill Coefficients
```tsx
// On warehouse selection
const { data: tariffs } = useBoxTariffs(selectedWarehouse)

// Auto-fill form fields
setValue('logistics_coefficient', tariffs.logistics.coefficient)
setValue('storage_coefficient', tariffs.storage.coefficient)
setValue('logistics_forward_rub', calculateLogistics(volume, tariffs))
```

### Story 44.14: Storage Calculation
```tsx
// Storage cost per unit per day
const storageCost = (volume * tariffs.storage.per_liter_per_day_rub)
                    * tariffs.storage.coefficient
                    * daysInStorage
```

---

## Timeline

| Phase | Description | ETA |
|-------|-------------|-----|
| Backend Response | Ответы на вопросы | Pending |
| Backend Implementation | Warehouses + Box Tariffs API | TBD |
| Frontend Stories | 44.12-44.14 | After Backend |

---

## References

- **WB Seller Portal:** [Логистика и хранение](https://seller.wildberries.ru/instructions/ru/ru/material/logistics-acceptance-warehouse-storage-costs)
- **WB API Docs:** [Tariffs API](https://dev.wildberries.ru/openapi/wb-tariffs)
- **Existing Implementation:** `src/tariffs/tariffs.service.ts` (commission rates)
- **Frontend Epic:** `docs/stories/epic-44/README.md`

---

**Status:** ✅ IMPLEMENTED - All endpoints working correctly

**Last Updated:** 2026-01-21

---

## Implementation Summary (2026-01-21)

### Fixes Applied

**Issue #1: Warehouse Response Format** - ✅ FIXED
- **File**: `src/tariffs/tariffs.controller.ts:215-221`
- **Change**: Response wrapped in `{data: {warehouses, updated_at}}`
- **Impact**: Frontend can now correctly unwrap and display warehouses

**Issue #2: Category Hierarchy** - ✅ FIXED
- **File**: `src/products/products.service.ts:1815`
- **Change**: Field reference `subjectName` → `category`
- **Impact**: Category data now correctly populated in products endpoint

### Frontend Integration Verified

```typescript
// Frontend type (src/types/tariffs.ts)
interface Warehouse {
  id: number;
  name: string;
  address?: string | null;
  city?: string;
  federalDistrict?: string | null;
}

// Frontend usage
const { data } = useWarehouses();
// Returns: { warehouses: Warehouse[], updated_at: string }
```

### Response Format Examples

**GET /v1/tariffs/warehouses:**
```json
{
  "data": {
    "warehouses": [
      { "id": 507, "name": "Краснодар", "address": null, "city": "Краснодар", "federalDistrict": "Южный ФО" }
    ],
    "updated_at": "2026-01-21T10:00:00Z"
  }
}
```

**GET /v1/products?include_dimensions=true:**
```json
{
  "products": [
    {
      "nm_id": "686701815",
      "sa_name": "Эпоксидная смола для творчества 5 кг",
      "dimensions": {
        "length_mm": 400,
        "width_mm": 300,
        "height_mm": 100,
        "volume_liters": 12.0
      },
      "category_hierarchy": {
        "subject_id": 123,
        "subject_name": "Клеи и герметики",
        "parent_id": 8,
        "parent_name": "Строительные материалы"
      }
    }
  ]
}
```

### Test Commands

```bash
# Test warehouses endpoint
curl -X GET "http://localhost:3000/v1/tariffs/warehouses" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Cabinet-Id: YOUR_CABINET_ID" \
  | jq '.data.warehouses | length'

# Test products with dimensions
curl -X GET "http://localhost:3000/v1/products?include_dimensions=true&q=686701815" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Cabinet-Id: YOUR_CABINET_ID" \
  | jq '.products[0] | {dimensions, category_hierarchy}'
```

---

*Status:* ✅ IMPLEMENTED
*Last Updated:* 2026-01-21

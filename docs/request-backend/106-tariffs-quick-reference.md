# Quick Reference: Tariffs API для Frontend

**Дата**: 2026-01-26
**Целевая аудитория**: Frontend-разработчики
**Epic**: Epic 43 (Price Calculator), Epic 44 (Tariffs)
**Статус**: Production Ready
**Обновлено**: Формулы проверены на production данных

---

## Краткая справочная таблица

| Endpoint | Назначение | Ключевые поля | Кеш |
|----------|-----------|---------------|-----|
| `GET /v1/tariffs/warehouses-with-tariffs` | Все тарифы по складам | storage, logistics, coefficients | 1ч |
| `GET /v1/tariffs/warehouses` | Список складов | id, name, city | 24ч |
| `GET /v1/tariffs/commissions` | Комиссии по категориям | FBO/FBS/DBS/EDBS % | 24ч |
| `GET /v1/tariffs/settings` | Глобальные настройки | Default rates | 24ч |
| `GET /v1/tariffs/acceptance/coefficients` | Коэффициенты приёмки | По warehouseId | 1ч |
| `GET /v1/tariffs/acceptance/coefficients/all` | Все коэффициенты | Все склады | 1ч |

---

## Основные endpoint'ы

### 1. GET /v1/tariffs/warehouses-with-tariffs

**Назначение**: Агрегированные данные складов + тарифы в одном запросе

**Query параметры**:
```typescript
{
  date?: string;           // YYYY-MM-DD (default: сегодня)
  cargo_type?: 'MGT' | 'SGT' | 'KGT';  // Фильтр по типу груза
  refresh?: boolean;       // Принудительный обнов кеша
}
```

**Пример запроса**:
```typescript
const response = await apiClient.get('/v1/tariffs/warehouses-with-tariffs', {
  params: {
    date: '2026-01-25',
    cargo_type: 'MGT'
  }
});
```

**Структура ответа**:
```typescript
{
  data: {
    warehouses: [
      {
        id: 507,
        name: "Краснодар",
        city: "Краснодар",
        federal_district: "Южный ФО",
        coordinates: { lat: 45.0355, lon: 38.975 },
        cargo_type: "MGT",
        delivery_types: ["FBS"],
        tariffs: {
          fbo: {
            delivery_base_rub: 46.0,
            delivery_liter_rub: 14.0,
            logistics_coefficient: 1.2
          },
          fbs: {
            delivery_base_rub: 46.0,
            delivery_liter_rub: 14.0,
            logistics_coefficient: 1.2
          },
          storage: {
            base_per_day_rub: 0.07,
            liter_per_day_rub: 0.05,
            coefficient: 1.0
          },
          effective_from: "2026-02-01",
          effective_until: "2026-01-31"
        }
      }
    ],
    meta: {
      total_warehouses: 45,
      with_tariffs: 42,
      without_tariffs: 3,
      tariff_date: "2026-01-25",
      fetched_at: "2026-01-25T10:30:00Z",
      cache_ttl_seconds: 3600
    }
  }
}
```

---

### 2. GET /v1/tariffs/warehouses

**Назначение**: Упрощённый список складов (без тарифов)

**Пример ответа**:
```typescript
{
  data: {
    warehouses: [
      {
        id: 507,
        name: "Краснодар",
        city: "Краснодар",
        federalDistrict: "Южный ФО"
      }
    ],
    updated_at: "2026-01-25T10:30:45Z"
  }
}
```

---

### 3. GET /v1/tariffs/commissions

**Назначение**: Все комиссии по категориям (7346 категорий)

**Структура ответа**:
```typescript
{
  commissions: [
    {
      parentID: 123,
      parentName: "Одежда",
      subjectID: 456,
      subjectName: "Платья",
      paidStorageKgvp: 25,        // FBO commission %
      kgvpMarketplace: 28,        // FBS commission %
      kgvpSupplier: 10,           // DBS commission %
      kgvpSupplierExpress: 5      // EDBS commission %
    }
  ],
  meta: {
    total: 7346,
    cached: true,
    cache_ttl_seconds: 86400,
    fetched_at: "2026-01-25T12:00:00Z"
  }
}
```

**⚠️ ВАЖНО**: Ответ НЕ обёрнут в `data` - поля `commissions` и `meta` на корневом уровне

---

### 4. GET /v1/tariffs/settings

**Назначение**: Глобальные настройки тарифов (fallback значения)

**Структура ответа**:
```typescript
{
  default_commission_fbo_pct: 25.0,
  default_commission_fbs_pct: 28.0,
  acceptance_box_rate_per_liter: 1.70,
  acceptance_pallet_rate: 500.0,
  logistics_volume_tiers: [
    { min: 0.001, max: 0.200, rate: 23.0 },
    { min: 0.201, max: 0.400, rate: 26.0 },
    { min: 0.401, max: 0.600, rate: 29.0 },
    { min: 0.601, max: 0.800, rate: 30.0 },
    { min: 0.801, max: 1.000, rate: 32.0 }
  ],
  logistics_large_first_liter_rate: 46.0,
  logistics_large_additional_liter_rate: 14.0,
  return_logistics_fbo_rate: 50.0,
  return_logistics_fbs_rate: 50.0,
  storage_free_days: 60,
  fbs_uses_fbo_logistics_rates: true,
  effective_from: "2025-09-01T00:00:00Z"
}
```

**⚠️ ВАЖНО**: Это DATABASE DEFAULTS - реальные тарифы по складам могут отличаться

---

### 5. GET /v1/tariffs/acceptance/coefficients

**Назначение**: Коэффициенты приёмки по конкретному складу

**Query параметры**:
```typescript
{
  warehouseId: number;  // REQUIRED - ID склада
}
```

**Пример ответа**:
```typescript
{
  coefficients: [
    {
      warehouseId: 507,
      warehouseName: "Краснодар",
      date: "2026-01-25",
      coefficient: 1.0,
      isAvailable: true,
      allowUnload: true,
      boxTypeId: 2,
      boxTypeName: "Boxes",
      delivery: {
        coefficient: 1.2,
        baseLiterRub: 46.0,
        additionalLiterRub: 14.0
      },
      storage: {
        coefficient: 1.0,
        baseLiterRub: 0.07,
        additionalLiterRub: 0.05
      },
      isSortingCenter: false
    }
  ],
  meta: {
    total: 14,
    available: 12,
    unavailable: 2,
    cache_ttl_seconds: 3600
  }
}
```

---

### 6. GET /v1/tariffs/acceptance/coefficients/all

**Назначение**: Все коэффициенты приёмки для всех складов

**Использование**: Для поиска реальных ID складов из WB API

---

## Маппинг полей (SDK → API → Frontend)

### Storage Rates

| SDK Field | API Response | Frontend Usage |
|-----------|--------------|----------------|
| `boxStorageBase` | `storage.base_per_day_rub` | Базовая ставка хранения/день |
| `boxStorageLiter` | `storage.liter_per_day_rub` | Дополнительный литр/день |
| `boxStorageCoefExpr` | `storage.coefficient` | Региональный коэффициент |

**Формула расчёта**:
```typescript
// Хранение за день (применяется коэффициент)
const dailyStorage = (base + max(0, volume - 1) * perLiter) * coefficient;

// Хранение за период
const totalStorage = dailyStorage * days;

// Пример 1: 1L, Pallets, Краснодар (Тихорецкая)
// daily = (41.25 + 0 × 0) × 1.65 = 68.06₽/день
// total (30 дней) = 68.06 × 30 = 2,041.88₽

// Пример 2: 5L коробка, Краснодар
// daily = (0.07 + (5 - 1) * 0.05) × 1.0 = 0.27₽/день
// total (30 дней) = 0.27 × 30 = 8.10₽
```

**ВАЖНО**: API возвращает ставки в ₽, коэффициент - множитель.

### Logistics Rates

| SDK Field | API Response | Frontend Usage |
|-----------|--------------|----------------|
| `boxDeliveryBase` | `fbo.delivery_base_rub` | Базовая ставка логистики FBO |
| `boxDeliveryLiter` | `fbo.delivery_liter_rub` | Дополнительный литр FBO |
| `boxDeliveryCoefExpr` | `fbo.logistics_coefficient` | Коэффициент логистики FBO |
| `boxDeliveryMarketplaceBase` | `fbs.delivery_base_rub` | Базовая ставка логистики FBS |
| `boxDeliveryMarketplaceLiter` | `fbs.delivery_liter_rub` | Дополнительный литр FBS |
| `boxDeliveryMarketplaceCoefExpr` | `fbs.logistics_coefficient` | Коэффициент логистики FBS |

**Формула расчёта**:
```typescript
// Логистика за поставку (применяется коэффициент)
const logisticsCost = (base + max(0, volume - 1) * perLiter) * coefficient;

// Пример 1: 1L, Pallets, Краснодар (Тихорецкая)
// (75 + 0 × 23) × 1.65 = 123.75₽

// Пример 2: 5L коробка, Коледино
// (46.0 + (5 - 1) * 14.0) * 1.2 = 116.40₽
```

**ВАЖНО**: API возвращает ставки в ₽, коэффициент - множитель.

---

## Frontend примеры кода

### React Hook для тарифов

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useWarehousesWithTariffs(params?: {
  date?: string;
  cargo_type?: 'MGT' | 'SGT' | 'KGT';
  refresh?: boolean;
}) {
  return useQuery({
    queryKey: ['tariffs', 'warehouses-with-tariffs', params],
    queryFn: () => apiClient.get('/v1/tariffs/warehouses-with-tariffs', { params }),
    staleTime: 60 * 60 * 1000, // 1 час
  });
}
```

### Компонент селектора складов

```typescript
import { useWarehousesWithTariffs } from '@/hooks/use-tariffs';

export function WarehouseSelector() {
  const { data, isLoading, error } = useWarehousesWithTariffs({
    cargo_type: 'MGT'
  });

  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;

  return (
    <select>
      {data?.warehouses.map(warehouse => (
        <option key={warehouse.id} value={warehouse.id}>
          {warehouse.name} ({warehouse.city})
        </option>
      ))}
    </select>
  );
}
```

### Расчёт стоимости хранения

```typescript
function calculateStorageCost(
  volume: number,
  days: number,
  tariffs: TransformedTariffsDto
): number {
  const { base_per_day_rub, liter_per_day_rub, coefficient } = tariffs.storage;

  // Используем || вместо ?? для обработки 0 значений
  const base = base_per_day_rub || 0.11; // fallback из настроек
  const liter = liter_per_day_rub || 0.05;
  const coef = coefficient || 1.0;

  // Формула: dailyStorage = (base + max(0, volume - 1) × liter) × coefficient
  const additionalLiters = Math.max(0, volume - 1);
  const dailyCost = (base + additionalLiters * liter) * coef;

  return dailyCost * days;
}

// Пример: Pallets, 1L, 30 дней, Краснодар (Тихорецкая)
// base = 41.25, liter = 0, coef = 1.65
// dailyCost = (41.25 + max(0, 1 - 1) × 0) × 1.65 = 68.0625₽
// totalStorage = 68.0625 × 30 = 2,041.88₽
```

---

## Частые проблемы и решения

### Проблема 1: storage.base_per_day_rub = 0

**Симптом**: Поле `storage.base_per_day_rub` приходит как `0`

**Причина**: WB API не возвращает данные о хранении для некоторых складов

**Решение**: Используйте fallback значение из настроек
```typescript
// ❌ НЕПРАВИЛЬНО - используйте ??
const base = tariffs.storage.base_per_day_rub ?? 0.11;

// ✅ ПРАВИЛЬНО - используйте ||
const base = tariffs.storage.base_per_day_rub || 0.11;
```

**См. документацию**: `frontend/docs/request-backend/105-...md`

---

### Проблема 2: Склад не найден в тарифах

**Симптом**: В ответе `warehouses.without_tariffs > 0`

**Причина**: Несовпадение названий складов между офисами и тарифами WB API

**Решение**: Используйте dedicated endpoint для поиска реальных ID:
```typescript
// Получить все коэффициенты для всех складов
const { data } = await apiClient.get('/v1/tariffs/acceptance/coefficients/all');

// Найти реальный ID склада по названию
const warehouse = data.coefficients.find(c =>
  c.warehouseName.includes('Краснодар')
);
```

---

### Проблема 3: Rate Limit (429 ошибка)

**Симптом**: HTTP 429 "Too Many Requests"

**Причины**:
- Превышен лимит запросов к WB API
- Нет коэффициента для указанного склада

**Решение**:
```typescript
try {
  const data = await apiClient.get('/v1/tariffs/acceptance/coefficients', {
    params: { warehouseId: 507 }
  });
} catch (error) {
  if (error.status === 429) {
    // Подождать и повторить
    const retryAfter = error.retryAfter || 60;
    setTimeout(() => retry(), retryAfter * 1000);
  }
}
```

---

## Rate Limits

| Scope | Лимит | Окно | Endpoint'ы |
|-------|-------|------|-----------|
| `tariffs` | 10 req/min | 60s | commissions, warehouses, settings |
| `orders_fbw` | 6 req/min | 60s | acceptance/coefficients |

**Обработка**:
- Кешируйте ответы на 1 час
- Используйте `refresh=true` только при необходимости
- Показывайте пользователю время до следующего запроса

---

## Интерпретация коэффициентов приёмки

| Значение | Значение | Действие |
|----------|----------|----------|
| -1 | Приёмка недоступна | Нельзя отправлять на этот склад |
| 0 | Приёмка бесплатна | Промо-период, без стоимости |
| 1 | Стандартная стоимость | Базовая ставка |
| >1 | Повышенная стоимость | Множитель (1.5 = 150% от базы) |

---

## Типы упаковки (Box Types)

### Box Type ID Mapping

| boxTypeID | BoxTypeName | Особенности расчёта |
|-----------|-------------|-------------------|
| 2 | Boxes (Короба) | Объём-based: `additionalLiterRub` имеет значение |
| 5 | Pallets (Монопаллеты) | Фиксированная ставка: `additionalLiterRub` = 0 |
| 6 | Supersafe (Суперсейф) | Объём-based: `additionalLiterRub` имеет значение |

### Различия в расчёте

**Boxes (Короба)** - объём-based расчёт:
```typescript
// Логистика
logistics = (baseLiterRub + max(0, volume - 1) × additionalLiterRub) × deliveryCoef

// Хранение в день
dailyStorage = (baseLiterRub + max(0, volume - 1) × additionalLiterRub) × storageCoef
```

**Pallets (Монопаллеты)** - фиксированная ставка:
```typescript
// Логистика (additionalLiterRub всегда 0)
logistics = (baseLiterRub + max(0, volume - 1) × 0) × deliveryCoef
           = baseLiterRub × deliveryCoef

// Хранение в день (additionalLiterRub всегда 0)
dailyStorage = (baseLiterRub + max(0, volume - 1) × 0) × storageCoef
              = baseLiterRub × storageCoef
```

### Реальный пример из API

**Склад**: Краснодар (Тихорецкая) - ID: 130744
**Дата**: 2026-01-27
**Товар**: 1 литр

**Pallets Response**:
```json
{
  "warehouseId": 130744,
  "warehouseName": "Краснодар (Тихорецкая)",
  "date": "2026-01-27T00:00:00Z",
  "boxTypeId": 5,
  "boxTypeName": "Pallets",
  "coefficient": 1,
  "delivery": {
    "coefficient": 1.65,
    "baseLiterRub": 75,
    "additionalLiterRub": 0
  },
  "storage": {
    "coefficient": 1.65,
    "baseLiterRub": 41.25,
    "additionalLiterRub": 0
  }
}
```

**Расчёт для 1 литра на 30 дней**:
```typescript
// Логистика
logistics = (75 + max(0, 1 - 1) × 0) × 1.65 = 75 × 1.65 = 123.75₽

// Хранение в день
dailyStorage = (41.25 + max(0, 1 - 1) × 0) × 1.65 = 41.25 × 1.65 = 68.0625₽

// Хранение за 30 дней
totalStorage = 68.0625 × 30 = 2,041.88₽

// ИТОГО
total = 123.75 + 2,041.88 = 2,165.63₽
```

**ВАЖНО**:
- API возвращает **RAW ставки** в ₽ (не коэффициенты)
- `coefficient` - множитель, применяемый при расчёте
- Для Pallets `additionalLiterRub` всегда = 0 (фиксированная ставка)
- Формула использует `max(0, volume - 1)` для расчёта дополнительных литров

---

## Frontend Best Practices

### 1. Кеширование

```typescript
// Кешируйте тарифы на 1 час
useQuery({
  queryKey: ['tariffs', 'warehouses'],
  queryFn: fetchTariffs,
  staleTime: 60 * 60 * 1000, // 1 час
  gcTime: 2 * 60 * 60 * 1000, // 2 часа
});
```

### 2. Обработка fallback значений

```typescript
// Всегда используйте || для storage полей
const storageBase = tariffs.storage.base_per_day_rub || 0.11;
const storageLiter = tariffs.storage.liter_per_day_rub || 0.05;
```

### 3. Обновление кеша

```typescript
// Принудительное обновление
const { refetch } = useWarehousesWithTariffs();

const handleRefresh = () => {
  refetch({
    cancelRefetch: false,
    throwOnError: true
  });
};
```

### 4. Показ даты актуальности

```typescript
// Показывайте пользователю дату тарифов
const tariffDate = data?.meta?.tariff_date;
const fetchedAt = data?.meta?.fetched_at;

<div>
  Тарифы на {tariffDate}
  (обновлено: {new Date(fetchedAt).toLocaleTimeString('ru-RU')})
</div>
```

---

## Ключевые поля для расчётов

### Для Price Calculator

```typescript
interface PriceCalculatorTariffs {
  // Логистика
  logistics: {
    base: number;        // delivery_base_rub (₽)
    perLiter: number;    // delivery_liter_rub (₽)
    coefficient: number; // logistics_coefficient (множитель)
  };

  // Хранение
  storage: {
    basePerDay: number;  // base_per_day_rub (₽/день)
    literPerDay: number; // liter_per_day_rub (₽/день)
    coefficient: number; // coefficient (множитель)
    freeDays: number;    // storage_free_days (из settings)
  };

  // Приёмка
  acceptance: {
    coefficient: number; // из acceptance/coefficients (множитель)
    baseRate: number;    // acceptance_box_rate_per_liter (₽)
  };

  // Комиссия
  commission: {
    fbo: number;  // paidStorageKgvp (%)
    fbs: number;  // kgvpMarketplace (%)
  };
}
```

**ВАЖНО**: Все ставки в API возвращаются в ₽ (rub), коэффициенты - безразмерные множители.

**Формулы (подтверждены на production)**:
```typescript
// Логистика
logistics = (baseLiterRub + max(0, volume - 1) × additionalLiterRub) × deliveryCoef

// Хранение в день
dailyStorage = (baseLiterRub + max(0, volume - 1) × additionalLiterRub) × storageCoef

// Хранение за период
totalStorage = dailyStorage × days
```

---

## Полезные утилиты

### Форматирование валюты

```typescript
function formatRubles(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
```

### Расчёт итоговой стоимости

```typescript
function calculateTotalCost(
  volume: number,
  days: number,
  tariffs: TransformedTariffsDto,
  acceptanceCoef: number
): {
  logistics: number;
  storage: number;
  acceptance: number;
  total: number;
} {
  // Логистика: (base + max(0, volume - 1) × perLiter) × coefficient
  const additionalLiters = Math.max(0, volume - 1);
  const logistics = (tariffs.fbo.delivery_base_rub +
    additionalLiters * tariffs.fbo.delivery_liter_rub) *
    tariffs.fbo.logistics_coefficient;

  // Хранение: ((base + max(0, volume - 1) × perLiter) × coefficient) × days
  const storageDaily = ((tariffs.storage.base_per_day_rub || 0.11) +
    additionalLiters * (tariffs.storage.liter_per_day_rub || 0.05)) *
    tariffs.storage.coefficient;
  const storage = storageDaily * days;

  // Приёмка
  const acceptance = 1.70 * volume * acceptanceCoef;

  return {
    logistics,
    storage,
    acceptance,
    total: logistics + storage + acceptance,
  };
}

// Пример: Pallets, 1L, 30 дней, Краснодар (Тихорецкая)
// additionalLiters = max(0, 1 - 1) = 0
// logistics = (75 + 0 × 23) × 1.65 = 123.75₽
// storageDaily = (41.25 + 0 × 0) × 1.65 = 68.0625₽
// storage = 68.0625 × 30 = 2,041.88₽
// acceptance = 1.70 × 1 × 1 = 1.70₽
// total = 123.75 + 2,041.88 + 1.70 = 2,167.33₽
```

---

## Дополнительная документация

- **API Paths Reference**: `docs/API-PATHS-REFERENCE.md` (раздел Epic 43)
- **Test Examples**: `test-api/18-tariffs.http`
- **Backend Implementation**: `src/tariffs/warehouses-tariffs.service.ts`
- **Base Rates Analysis**: `docs/WB-TARIFFS-BASE-RATES-ANALYSIS.md`
- **Frontend Integration**: `frontend/docs/request-backend/102-tariffs-base-rates-frontend-guide.md`

---

**Последнее обновление**: 2026-01-26
**Backend API**: http://localhost:3000/api (Swagger)
**Epic Status**: ✅ Complete (Epic 43: 10/10, Epic 44: 7/7)
**Обновления**:
- Формулы логистики и хранения проверены на production данных
- Добавлен раздел "Типы упаковки (Box Types)"
- Реальные примеры из API (Краснодар Тихорецкая, 2026-01-27)
- Уточнено различие между Pallets (фиксированная ставка) и Boxes (объём-based)

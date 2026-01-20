# Request #98: Backend Response - Warehouses & Tariffs API

**Date**: 2026-01-19
**Status**: 📋 DRAFT - Ожидает ревью Backend команды
**Original Request**: `98-warehouses-tariffs-coefficients-api.md`
**Priority**: P1 - IMPORTANT
**Related Epic**: Epic 44-FE (Price Calculator UI) - Phase 3

---

## Резюме обсуждения

После анализа SDK v2.5.0 и требований Frontend мы пришли к следующим выводам и рекомендациям.

---

## 1. Уточнение SDK методов

### ✅ Подтверждённые методы

| Данные | Правильный метод SDK | Примечание |
|--------|---------------------|------------|
| **Все склады WB** | `sdk.products.offices()` | Включает FBO + FBS склады |
| **Тарифы (коробы)** | `sdk.tariffs.getTariffsBox({ date })` | Логистика + хранение |
| **Тарифы (паллеты)** | `sdk.tariffs.getTariffsPallet({ date })` | Для КГТ товаров |

### ⚠️ Исправление

В первоначальном комментарии был указан `sdk.products.getWarehouses()` — это **склады продавца** (FBS only).

Для калькулятора нужны **все склады WB** → `sdk.products.offices()`.

---

## 2. Архитектурное предложение

### Вместо 3 endpoint'ов → 1 агрегированный

**Было предложено (Request #98):**
```
GET /v1/tariffs/warehouses        # отдельно склады
GET /v1/tariffs/box               # отдельно тарифы
GET /v1/tariffs/box/{name}        # тариф по складу
```

**Рекомендуем:**
```
GET /v1/tariffs/warehouses-with-tariffs?date=2026-01-19
```

### Преимущества агрегированного подхода

| Критерий | 3 endpoint'а | 1 агрегированный |
|----------|--------------|------------------|
| Запросов от Frontend | 2-3 | 1 |
| Matching Office↔Tariff | Frontend | Backend |
| Трансформация типов | Frontend | Backend |
| Сложность Frontend | Высокая | Низкая |
| Консистентность данных | Риск рассинхрона | Гарантирована |

---

## 3. API Contract (предложение)

### Endpoint

```
GET /v1/tariffs/warehouses-with-tariffs
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date` | string (ISO date) | No | today | Дата для тарифов |
| `cargo_type` | `MGT\|SGT\|KGT` | No | all | Фильтр по типу груза |

### Response

```json
{
  "data": {
    "warehouses": [
      {
        "id": 1,
        "name": "Коледино",
        "city": "Подольск",
        "federal_district": "Центральный ФО",
        "coordinates": {
          "lat": 55.3897,
          "lon": 37.5674
        },
        "cargo_type": "MGT",
        "delivery_types": ["FBS", "DBS"],

        "tariffs": {
          "fbo": {
            "delivery_base_rub": 46.0,
            "delivery_liter_rub": 14.0,
            "logistics_coefficient": 1.0
          },
          "fbs": {
            "delivery_base_rub": 50.0,
            "delivery_liter_rub": 16.0,
            "logistics_coefficient": 1.2
          },
          "storage": {
            "base_per_day_rub": 0.07,
            "liter_per_day_rub": 0.05,
            "coefficient": 1.0
          },
          "effective_from": "2026-01-20",
          "effective_until": "2026-02-01"
        }
      },
      {
        "id": 15,
        "name": "Хабаровск",
        "city": "Хабаровск",
        "federal_district": "Дальневосточный ФО",
        "coordinates": {
          "lat": 48.4827,
          "lon": 135.0838
        },
        "cargo_type": "MGT",
        "delivery_types": ["FBS"],

        "tariffs": {
          "fbo": {
            "delivery_base_rub": 46.0,
            "delivery_liter_rub": 14.0,
            "logistics_coefficient": 1.5
          },
          "fbs": {
            "delivery_base_rub": 50.0,
            "delivery_liter_rub": 16.0,
            "logistics_coefficient": 1.8
          },
          "storage": {
            "base_per_day_rub": 0.07,
            "liter_per_day_rub": 0.05,
            "coefficient": 0.8
          },
          "effective_from": "2026-01-20",
          "effective_until": "2026-02-01"
        }
      }
    ],
    "meta": {
      "total_warehouses": 45,
      "with_tariffs": 42,
      "without_tariffs": 3,
      "tariff_date": "2026-01-19",
      "fetched_at": "2026-01-19T10:00:00Z",
      "cache_ttl_seconds": 3600
    }
  }
}
```

### Warehouse без тарифов

Если для склада не найдены тарифы (fuzzy matching не сработал):

```json
{
  "id": 99,
  "name": "Новый Склад",
  "city": "Город",
  "federal_district": "ФО",
  "coordinates": { "lat": 0, "lon": 0 },
  "cargo_type": "MGT",
  "delivery_types": ["FBS"],

  "tariffs": null  // ← явно null
}
```

Frontend обработает это как "тарифы недоступны" и покажет ручной ввод.

---

## 4. Критичные трансформации данных

### 4.1 String → Number

SDK возвращает **строки**, Frontend ожидает **числа**:

```typescript
// SDK
boxDeliveryBase: "46"           // string
boxStorageBase: "0.07"          // string

// API Response
delivery_base_rub: 46.0         // number
storage_base_per_day_rub: 0.07  // number
```

**Реализация:**
```typescript
parseFloat(sdk.boxDeliveryBase || '0')
```

### 4.2 Коэффициенты ÷ 100

SDK возвращает проценты как целые числа в строках:

```typescript
// SDK
boxDeliveryCoefExpr: "125"      // = 125%
boxStorageCoefExpr: "80"        // = 80%

// API Response (для удобства калькулятора)
logistics_coefficient: 1.25     // = ×1.25
storage_coefficient: 0.80       // = ×0.80
```

**Реализация:**
```typescript
parseFloat(sdk.boxDeliveryCoefExpr || '100') / 100
```

### 4.3 Cargo Type Mapping

```typescript
// SDK
cargoType: 1 | 2 | 3

// API Response
cargo_type: 'MGT' | 'SGT' | 'KGT'

// Mapping
const CARGO_MAP = {
  1: 'MGT',  // Малогабарит
  2: 'SGT',  // Сверхгабарит
  3: 'KGT',  // Крупногабарит
};
```

### 4.4 Delivery Type Mapping

```typescript
// SDK
deliveryType: 1 | 2 | 3 | 5 | 6

// API Response
delivery_types: ('FBS' | 'DBS' | 'DBW' | 'CC' | 'EDBS')[]

// Mapping
const DELIVERY_MAP = {
  1: 'FBS',   // На склад WB
  2: 'DBS',   // Силами продавца
  3: 'DBW',   // Курьер WB
  5: 'CC',    // Самовывоз
  6: 'EDBS',  // Экспресс продавца
};
```

---

## 5. Matching Strategy (Office ↔ BoxRates)

### Проблема

SDK возвращает данные из разных источников:
- `offices()` → `Office.name = "Коледино"`
- `getTariffsBox()` → `BoxRates.warehouseName = "Коледино"`

Названия **должны** совпадать, но возможны вариации:
- Регистр: "коледино" vs "Коледино"
- Пробелы: "Коледино " vs "Коледино"
- Написание: "Коледино WB" vs "Коледино"

### Рекомендуемый алгоритм

```typescript
function matchWarehouseToTariff(
  office: Office,
  tariffs: ModelsWarehouseBoxRates[]
): ModelsWarehouseBoxRates | null {

  const normalize = (s: string) =>
    s?.toLowerCase()
     .trim()
     .replace(/\s+/g, ' ')
     .replace(/[^\wа-яё\s]/gi, '');  // убрать спецсимволы

  const officeName = normalize(office.name);

  // 1. Exact match
  let match = tariffs.find(t =>
    normalize(t.warehouseName) === officeName
  );

  // 2. Contains match (fallback)
  if (!match) {
    match = tariffs.find(t => {
      const tariffName = normalize(t.warehouseName);
      return tariffName?.includes(officeName) ||
             officeName?.includes(tariffName);
    });
  }

  return match;
}
```

### Логирование несовпадений

При production запуске рекомендуем логировать склады без тарифов:

```typescript
if (!match) {
  this.logger.warn(
    `Warehouse "${office.name}" (id=${office.id}) has no matching tariff`,
    { availableTariffs: tariffs.map(t => t.warehouseName) }
  );
}
```

---

## 6. Caching Strategy

### Рекомендуемые TTL

| Данные | TTL | Причина |
|--------|-----|---------|
| Offices (склады) | 24 часа | Редко меняются |
| BoxRates (тарифы) | 1 час | Могут меняться чаще |
| Aggregated response | 1 час | По минимальному TTL |

### Redis Key Pattern

```
tariffs:warehouses-with-tariffs:{cabinetId}:{date}
```

### Force Refresh

Добавить query parameter для принудительного обновления:

```
GET /v1/tariffs/warehouses-with-tariffs?date=2026-01-19&refresh=true
```

---

## 7. Rate Limiting

### SDK Limits (WB API)

| Метод | Лимит WB |
|-------|----------|
| `offices()` | 60 req/min |
| `getTariffsBox()` | 60 req/min |

### Наши API Limits (рекомендация)

| Endpoint | Лимит | Scope |
|----------|-------|-------|
| `GET /v1/tariffs/warehouses-with-tariffs` | 10/min | per cabinet |

С кэшированием 1 час — это более чем достаточно.

---

## 8. Вопросы для уточнения

### 8.1 Коэффициенты "уже учтены"?

SDK комментарий:
> "Коэффициент уже учтён в тарифах"

**Вопрос:** Базовые ставки (`boxDeliveryBase`) — это:
- A) Чистые ставки (нужно умножать на коэфф.)
- B) Уже умноженные (коэфф. только для информации)

**Для калькулятора критично знать правильную формулу!**

### 8.2 Return Logistics

Нужен ли отдельный endpoint для тарифов возврата?

```typescript
sdk.tariffs.getTariffsReturn({ date })
```

**Контекст:** Story 44.10 требует расчёт обратной логистики.

### 8.3 Pallet Tariffs (КГТ)

Нужна ли поддержка `getTariffsPallet()` в первой версии?

**Предложение:** MVP только Box tariffs, Pallet — Phase 2.

### 8.4 Интеграция с Price Calculator

Стоит ли расширить `POST /v1/products/price-calculator` чтобы принимать `warehouse_name` и автоматически подставлять тарифы?

```json
// Вариант A: Frontend делает 2 запроса
GET /v1/tariffs/warehouses-with-tariffs
POST /v1/products/price-calculator { logistics_forward_rub: 60.0, ... }

// Вариант B: Backend делает всё
POST /v1/products/price-calculator {
  warehouse_name: "Коледино",
  volume_liters: 2.5,
  // ... logistics автоматически
}
```

---

## 9. Implementation Checklist

### Backend Tasks

| # | Task | Priority | Estimate |
|---|------|----------|----------|
| 1 | Создать `WarehousesTariffsService` | CRITICAL | 4h |
| 2 | Создать `TariffsController` с endpoint | CRITICAL | 2h |
| 3 | Реализовать matching Office↔BoxRates | HIGH | 2h |
| 4 | Добавить трансформацию типов | HIGH | 1h |
| 5 | Настроить Redis caching | HIGH | 2h |
| 6 | Написать unit/e2e тесты | HIGH | 3h |
| 7 | Документация API | HIGH | 1h |
| **Total** | | | **~15h** |

### После Backend

| # | Frontend Story | Blocked By |
|---|---------------|------------|
| 1 | 44.12: Warehouse Dropdown | Backend endpoint |
| 2 | 44.13: Auto-fill Coefficients | 44.12 |
| 3 | 44.14: Storage Calculation | 44.13 |

---

## 10. Ожидаемый Timeline

| Phase | Description | ETA |
|-------|-------------|-----|
| ✅ Analysis | Данный документ | 2026-01-19 |
| ⏳ Backend Review | Ответы на вопросы 8.1-8.4 | TBD |
| ⏳ Backend Implementation | Endpoint + caching | TBD |
| ⏳ Frontend Stories | 44.12-44.14 | After Backend |

---

## References

- **Original Request**: `docs/request-backend/98-warehouses-tariffs-coefficients-api.md`
- **Epic 44 README**: `docs/stories/epic-44/README.md`
- **Price Calculator API**: `docs/request-backend/95-epic-43-price-calculator-api.md`
- **WB Tariffs Docs**: https://dev.wildberries.ru/openapi/wb-tariffs

---

**Status**: Ожидаем ревью и ответы от Backend команды

**Last Updated**: 2026-01-19

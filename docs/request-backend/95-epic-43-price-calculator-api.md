# Epic 43: Price Calculator API (Reverse Margin Calculator)

**Date**: 2026-01-16
**Status**: ✅ Implemented
**Backend Epic**: `docs/epics/epic-43-price-calculator.md`
**Stories**: 43.1 (TariffsService), 43.2 (PriceCalculatorService), 43.3 (API Endpoint), 43.4 (Testing & Docs)
**Frontend Guide**: `docs/PRICE-CALCULATOR-GUIDE.md`

---

## Summary

Обратный калькулятор цены — API для расчёта рекомендуемой цены продажи на основе целевой маржи с учётом всех затрат Wildberries.

**Ключевая особенность:** Вместо подбора цены итеративно, селлер вводит затраты и желаемую маржу → API возвращает оптимальную цену сразу.

---

## User Story

> **Как** селлер,
> **Я хочу** рассчитать цену продажи на основе целевой маржи с учётом всех затрат WB,
> **Чтобы** установить правильную цену с первого раза и получать ожидаемую прибыль.

---

## Endpoint

```
POST /v1/products/price-calculator
```

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization: Bearer <token>` | ✅ | JWT токен авторизации |
| `X-Cabinet-Id: <uuid>` | ✅ | ID кабинета селлера |
| `Content-Type: application/json` | ✅ | Формат данных |

---

## Request Body

### Обязательные поля

```json
{
  "target_margin_pct": 20.0,        // Целевая маржа % (0-100)
  "cogs_rub": 1500.0,               // Себестоимость ₽ (>= 0)
  "logistics_forward_rub": 200.0,    // Прямая логистика ₽ (>= 0)
  "logistics_reverse_rub": 150.0,    // Обратная логистика ₽ (>= 0)
  "buyback_pct": 98.0,               // % выкупа (0-100)
  "advertising_pct": 5.0,            // Реклама % от выручки (0-100)
  "storage_rub": 50.0                // Хранение ₽ (>= 0, может быть 0)
}
```

### Опциональные поля

```json
{
  "vat_pct": 20.0,                   // НДС % (default: 20)
  "acquiring_pct": 1.8,              // Эквайринг % (default: 1.8)
  "commission_pct": 10.0,            // Комиссия WB % (default: 10)
  "overrides": {
    "commission_pct": 15.0,         // Ручной override комиссии
    "nm_id": 123456                  // Для авто-определения комиссии (Story 43.1)
  }
}
```

---

## Formula Explanation (Внутренняя логика)

### Формула обратного расчёта

```
recommended_price = fixed_total / (1 - total_percentage_rate / 100)
```

Где:
- `fixed_total = cogs_rub + logistics_effective + storage_rub`
- `logistics_effective = logistics_forward + (logistics_reverse × (1 - buyback/100))`
- `total_percentage_rate = commission + acquiring + advertising + vat + margin`

### Пример пошагового расчёта

**Входные данные:**
- COGS: 1500₽
- Logistics forward: 200₽
- Logistics reverse: 150₽
- Buyback: 98%
- Storage: 50₽
- Advertising: 5%
- Target margin: 20%
- Commission: 10%
- VAT: 20%
- Acquiring: 1.8%

**Расчёт:**

1. **Return rate** (вероятность возврата):
   ```
   return_rate = 100% - 98% = 2%
   ```

2. **Effective logistics** (средняя логистика с учётом возвратов):
   ```
   logistics_effective = 200 + (150 × 0.02) = 203₽
   ```

3. **Fixed costs total**:
   ```
   fixed_total = 1500 + 203 + 50 = 1753₽
   ```

4. **Total percentage rate**:
   ```
   total_pct = 10 + 1.8 + 5 + 20 + 20 = 56.8%
   ```

5. **Recommended price**:
   ```
   price = 1753 / (1 - 0.568) = 1753 / 0.432 = 4057.87₽
   ```

---

## Response Structure

### Успешный ответ (200 OK)

```json
{
  "meta": {
    "cabinet_id": "uuid-cabinet",
    "calculated_at": "2026-01-16T12:00:00.000Z"
  },
  "result": {
    "recommended_price": 4057.87,
    "target_margin_pct": 20.0,
    "actual_margin_rub": 811.57,
    "actual_margin_pct": 20.0
  },
  "cost_breakdown": {
    "fixed_costs": {
      "cogs": 1500.00,
      "logistics_forward": 200.00,
      "logistics_reverse_effective": 3.00,
      "logistics_total": 203.00,
      "storage": 50.00,
      "fixed_total": 1753.00
    }
  },
  "percentage_breakdown": {
    "commission_wb": {
      "pct": 10.0,
      "rub": 405.79
    },
    "acquiring": {
      "pct": 1.8,
      "rub": 73.04
    },
    "advertising": {
      "pct": 5.0,
      "rub": 202.89
    },
    "vat": {
      "pct": 20.0,
      "rub": 811.57
    },
    "margin": {
      "pct": 20.0,
      "rub": 811.57
    },
    "percentage_total": {
      "pct": 56.8,
      "rub": 2304.86
    }
  },
  "intermediate_values": {
    "buyback_rate_pct": 98.0,
    "return_rate_pct": 2.0,
    "logistics_effective": 203.00,
    "total_percentage_rate": 56.8
  },
  "warnings": []
}
```

### Описание полей ответа

| Section | Field | Description |
|---------|-------|-------------|
| `result` | `recommended_price` | Рассчитанная цена продажи (₽) |
| `result` | `target_margin_pct` | Запрошенная маржа % |
| `result` | `actual_margin_rub` | Маржа в рублях |
| `result` | `actual_margin_pct` | Фактическая маржа % |
| `cost_breakdown.fixed_costs` | `cogs` | Себестоимость |
| `cost_breakdown.fixed_costs` | `logistics_total` | Логистика итоговая |
| `percentage_breakdown` | `commission_wb` | Комиссия WB |
| `percentage_breakdown` | `acquiring` | Эквайринг |
| `percentage_breakdown` | `advertising` | Реклама |
| `percentage_breakdown` | `vat` | НДС |
| `percentage_breakdown` | `margin` | Ваша прибыль |
| `intermediate_values` | `return_rate_pct` | % возвратов |

---

## Error Responses

### 400 Bad Request — Ошибка валидации

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "target_margin_pct",
        "issue": "must be between 0 and 100"
      }
    ],
    "trace_id": "uuid-trace"
  }
}
```

**Возможные причины:**
- Отрицательные значения для затрат
- Проценты вне диапазона 0-100
- `total_percentage_rate ≥ 100%` (деление на ноль невозможно)

### 401 Unauthorized — Нет токена

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication token",
    "details": [],
    "trace_id": "uuid"
  }
}
```

### 403 Forbidden — Нет доступа к кабинету

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied to this cabinet",
    "details": [],
    "trace_id": "uuid"
  }
}
```

---

## Usage Examples

### Example 1: Базовый расчёт (20% маржа)

```bash
curl -X POST https://api.example.com/v1/products/price-calculator \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Cabinet-Id: YOUR_CABINET_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "target_margin_pct": 20,
    "cogs_rub": 1500,
    "logistics_forward_rub": 200,
    "logistics_reverse_rub": 150,
    "buyback_pct": 98,
    "advertising_pct": 5,
    "storage_rub": 50
  }'
```

**Результат:** `recommended_price: 4057.87₽`

### Example 2: Высокомаржинальный товар (50% маржа)

```json
{
  "target_margin_pct": 50,
  "cogs_rub": 5000,
  "logistics_forward_rub": 400,
  "logistics_reverse_rub": 300,
  "buyback_pct": 90,
  "advertising_pct": 15,
  "storage_rub": 100
}
```

### Example 3: Точка безубыточности (0% маржа)

```json
{
  "target_margin_pct": 0,
  "cogs_rub": 1200,
  "logistics_forward_rub": 150,
  "logistics_reverse_rub": 100,
  "buyback_pct": 97,
  "advertising_pct": 4,
  "storage_rub": 40
}
```

### Example 4: С override комиссии

```json
{
  "target_margin_pct": 25,
  "cogs_rub": 2000,
  "logistics_forward_rub": 250,
  "logistics_reverse_rub": 180,
  "buyback_pct": 95,
  "advertising_pct": 8,
  "storage_rub": 75,
  "overrides": {
    "commission_pct": 12
  }
}
```

### Example 5: Сниженная ставка НДС (10%)

```json
{
  "target_margin_pct": 15,
  "cogs_rub": 800,
  "logistics_forward_rub": 100,
  "logistics_reverse_rub": 80,
  "buyback_pct": 99,
  "advertising_pct": 3,
  "storage_rub": 25,
  "vat_pct": 10
}
```

---

## Rate Limiting

- **Scope:** `products`
- **Limit:** 100 requests per minute
- **Behavior:** Returns 429 Too Many Requests при превышении

---

## Integration Notes

### Приоритет комиссии WB

API использует следующий приоритет для определения комиссии:

1. **`overrides.commission_pct`** — ручной override (высший приоритет)
2. **`request.commission_pct`** — на уровне запроса
3. **`overrides.nm_id`** — автоматический lookup через TariffsService (Story 43.1)
4. **Default 10%** — fallback

### Future Features (Story 43.1)

Когда реализован `TariffsService`:
- Передайте `overrides.nm_id` с артикулом товара
- Backend автоматически определит категорию и commission rate
- Если lookup fails — используется fallback 10% с warning в ответе

---

## Backend Implementation References

### Созданные файлы

| Файл | Описание |
|------|----------|
| `src/tariffs/tariffs.service.ts` | Интеграция с WB Tariffs API |
| `src/products/services/price-calculator.service.ts` | Основной сервис расчёта |
| `src/products/controllers/price-calculator.controller.ts` | HTTP endpoint |
| `src/products/dto/request/price-calculator-request.dto.ts` | Request DTO с валидацией |
| `src/products/dto/response/price-calculator-response.dto.ts` | Response DTO |
| `test/price-calculator.e2e-spec.ts` | E2E тесты |

### Тесты

- **Unit tests:** 51 тестов для PriceCalculatorService (100% coverage)
- **E2E tests:** 18 тест сценариев для API endpoint
- **Total:** 164 tests passing

---

## Documentation Links

### Для разработчиков

- **Epic PRD:** `docs/epics/epic-43-price-calculator.md`
- **Frontend Guide:** `docs/PRICE-CALCULATOR-GUIDE.md`
- **API Reference:** `docs/API-PATHS-REFERENCE.md` (строки 2049-2120)

### Stories

- **Story 43.1:** `docs/stories/epic-43/story-43.1-tariffs-integration.md` — WB Tariffs API
- **Story 43.2:** `docs/stories/epic-43/story-43.2-price-calculator-service.md` — Calculator Service
- **Story 43.3:** `docs/stories/epic-43/story-43.3-api-endpoint-dtos.md` — API & DTOs
- **Story 43.4:** `docs/stories/epic-43/story-43.4-testing-documentation.md` — Tests & Docs

---

## Checklist для Frontend интеграции

- [ ] Добавить UI форму для ввода параметров (target_margin, cogs, logistics, etc.)
- [ ] Отобразить breakdown затрат (fixed + percentage)
- [ ] Показать предупреждения (warnings) если есть
- [ ] Обработать все ошибки (400, 401, 403)
- [ ] Добавить пресеты для常见的 категорий товаров
- [ ] Валидировать ввод на фронте (минимально, для UX)

---

**Last Updated:** 2026-01-16
**Version:** 1.0

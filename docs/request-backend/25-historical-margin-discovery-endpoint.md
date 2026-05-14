# Request #25: Historical Margin Discovery Endpoint

## Статус
✅ **IMPLEMENTED** — Stories 23.8 and 23.9 deployed (2025-01-27)

> **Backend Response**: See `25-historical-margin-discovery-endpoint-backend.md`

---

## 🎯 Backend Response (2025-01-27)

### Decision

| Variant | Decision | Reason |
|---------|----------|--------|
| **Variant A** | ✅ **APPROVED** | Inline context, batch-optimized, minimal frontend changes |
| **Variant B** | ❌ **COVERED** | Story 23.8 already implements detailed history endpoint |

### Implementation

- **Story 23.9**: Historical Margin Context in Products List (Variant A)
  - Location: `docs/stories/epic-23/story-23.9-historical-margin-context-in-products.md`
  - Estimate: 3 hours
  - Priority: P1 - HIGH

- **Story 23.8**: Product Weeks with Sales Endpoint (covers Variant B use case)
  - Location: `docs/stories/epic-23/story-23.8-product-weeks-with-sales-endpoint.md`
  - Estimate: 4 hours
  - Priority: P1 - HIGH

### Combined Solution

```
┌─────────────────────────────────────────────────────────────────────┐
│  Product List (Story 23.9 - Variant A)                              │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │ Товар: Термобелье                                          │     │
│  │ Маржа за W47: — (нет продаж)                              │     │
│  │ Последняя: W44 (92.32%) ← INLINE from products endpoint   │     │
│  │ [История продаж →] ─────────────────────────────────────────┼──► │
│  └───────────────────────────────────────────────────────────┘  │  │
│                                                                  ▼  │
│  Detail View (Story 23.8 - Full History)                            │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │ GET /analytics/weekly/product-weeks?nm_id=173589742        │     │
│  │ Weeks: W44 (92%), W42 (88%), W40 (85%)                    │     │
│  │ Chart: [███████████]                                       │     │
│  └───────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Контекст

**Story**: 4.9 - Historical Margin Discovery
**Дата**: 2025-11-26
**Приоритет**: Medium

### Проблема

При `missing_data_reason: "NO_SALES_DATA"` за последнюю завершённую неделю (W47) пользователь видит "Нет продаж", хотя у товара могут быть продажи за предыдущие недели (W44) с рассчитанной маржой.

**Текущий UX:**
```
Товар: Термобелье (173589742)
COGS: 11.00 ₽ (с 11.01.2025)
Маржа: — (нет продаж)        ← Dead End, user thinks no margin exists
```

**Желаемый UX:**
```
Товар: Термобелье (173589742)
COGS: 11.00 ₽ (с 11.01.2025)
Маржа за W47: — (нет продаж)
Последняя: W44 (92.32%)      ← User sees historical margin exists!
[История продаж →]
```

---

## Запрос к Backend

### Вариант A: Расширение `/v1/products` (Рекомендуется)

Добавить optional поля в ответ `GET /v1/products?include_cogs=true`:

```json
{
  "nm_id": "173589742",
  "has_cogs": true,
  "cogs": { "unit_cost_rub": "11", "valid_from": "2025-01-11" },

  "current_margin_pct": null,
  "current_margin_period": "2025-W47",
  "missing_data_reason": "NO_SALES_DATA",

  // NEW: Historical margin context
  "last_sales_week": "2025-W44",           // Last week with qty=1 sales
  "last_sales_margin_pct": 92.32,          // Margin for that week
  "last_sales_qty": 5,                     // Units sold
  "weeks_since_last_sale": 3               // W47 - W44 = 3 weeks gap
}
```

**Условия возврата новых полей:**
- Только когда `include_cogs=true`
- Только когда `missing_data_reason === "NO_SALES_DATA"`
- Поиск в `weekly_margin_fact` за последние 12 недель

**SQL Query (примерный):**
```sql
SELECT week, margin_pct, qty
FROM weekly_margin_fact
WHERE nm_id = $1 AND cabinet_id = $2 AND margin_pct IS NOT NULL
ORDER BY week DESC
LIMIT 1
```

---

### Вариант B: Новый endpoint (Альтернатива)

```http
GET /v1/products/{nmId}/sales-history?weeks=12
Authorization: Bearer {jwt}
X-Cabinet-Id: {cabinet_id}
```

**Response:**
```json
{
  "nm_id": "173589742",
  "weeks_with_sales": [
    { "week": "2025-W44", "margin_pct": 92.32, "qty": 5, "revenue": 1431.59 },
    { "week": "2025-W43", "margin_pct": 88.15, "qty": 3, "revenue": 856.20 },
    { "week": "2025-W40", "margin_pct": 85.00, "qty": 2, "revenue": 570.80 }
  ],
  "total_weeks_checked": 12,
  "weeks_with_sales_count": 3
}
```

---

## Рекомендация Frontend

**Предпочитаем Вариант A** потому что:
1. Один запрос вместо двух (N+1 problem avoided)
2. Данные уже в контексте списка товаров
3. Минимальные изменения frontend кода
4. Батч-оптимизация (уже реализована для `include_cogs`)

---

## Acceptance Criteria для Backend

1. ✅ При `include_cogs=true` и `missing_data_reason: "NO_SALES_DATA"` добавлять:
   - `last_sales_week` (string | null) - ISO week
   - `last_sales_margin_pct` (number | null)
   - `last_sales_qty` (number | null)
   - `weeks_since_last_sale` (number | null)

2. ✅ Искать в `weekly_margin_fact` за последние 12 недель

3. ✅ Если нет продаж за 12 недель, все поля = `null`

4. ✅ Performance: не более +50ms к текущему времени ответа

5. ✅ Батч-оптимизация для списка товаров (как current margin)

---

## Влияние на Frontend

После реализации backend, frontend сможет показать:

```tsx
// ProductList.tsx
{product.missing_data_reason === 'NO_SALES_DATA' && (
  <div className="space-y-1">
    <span className="text-sm text-muted-foreground">
      — (нет продаж за {product.current_margin_period})
    </span>

    {product.last_sales_week && (
      <div className="text-xs">
        <span className="text-muted-foreground">Последняя: </span>
        <span className="text-green-600 font-medium">
          {product.last_sales_week} ({product.last_sales_margin_pct}%)
        </span>
      </div>
    )}

    <Link href={`/analytics/sku?nm_id=${product.nm_id}`}>
      <History className="h-3 w-3" />
      История продаж
    </Link>
  </div>
)}
```

---

## Timeline

| Этап | Срок | Статус |
|------|------|--------|
| Backend review | 2025-01-27 | ✅ Done |
| Backend implementation | 2025-01-27 | ✅ Done |
| Unit tests | 2025-01-27 | ✅ Done (19 tests) |
| Frontend integration | - | 🟡 Ready |
| Testing | - | ⏳ |

> **See**: `25-historical-margin-discovery-endpoint-backend.md` for implementation details

---

## Связанные документы

- **Story**: `docs/stories/4.9.historical-margin-discovery.md`
- **Integration Guide**: `docs/request-backend/24-margin-cogs-integration-guide.md`
- **Epic 17**: COGS & Margin Analytics
- **Request #15**: `include_cogs` parameter

---

> **Вопрос к Backend Team**: Какой вариант (A или B) предпочтительнее с точки зрения архитектуры и производительности?

## Backend Team Response

- **Status**: RESOLVED
- **Resolution date**: 2025-11-27
- **Summary**: Both endpoints (products-with-sales and historical margin context) are deployed and ready for integration. Option A (dedicated endpoint) was chosen. Story 23.8 (`/v1/products/:nmId/weeks-with-sales`) and Story 23.9 (historical margin context fields in products) are complete. See the companion `-backend.md` file for full implementation details.
- **Remaining frontend action**: Integrate the weeks-with-sales endpoint and historical margin context fields into the product detail view.

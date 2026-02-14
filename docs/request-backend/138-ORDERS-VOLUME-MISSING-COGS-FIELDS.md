# Backend Request #138: Orders Volume — Missing COGS Fields

**Дата**: 2026-02-14
**Приоритет**: HIGH
**Статус**: RESOLVED (2026-02-14)
**Обнаружено**: Dashboard → карточка "COGS по заказам" показывает 0 ₽ при 40/57 товарах с COGS

---

## Проблема

`GET /v1/analytics/orders/volume` **не возвращает COGS-поля**, хотя фронтенд (Story 61.4-FE) их ожидает.

### Что возвращает бэкенд сейчас

```json
{
  "totalOrders": 25,
  "peakHours": [16, 20, 15],
  "cancellationRate": 0,
  "b2bPercentage": 0,
  "statusBreakdown": [{"status": "complete", "count": 25, "percentage": 100}],
  "period": {"from": "2026-02-02", "to": "2026-02-08"},
  "dailyTrend": [{"date": "2026-02-02", "count": 3}, ...],
  "hourlyTrend": [{"hour": 0, "count": 0}, ...]
}
```

### Что ожидает фронтенд (Story 61.4-FE)

```json
{
  "total_orders": 25,
  "total_amount": 1092532,
  "cogs_total": 45000,           // ← MISSING
  "gross_profit": 1047532,       // ← MISSING
  "margin_pct": 95.88,           // ← MISSING
  "orders_with_cogs": 20,        // ← MISSING
  "cogs_coverage_pct": 80,       // ← MISSING
  "avg_cogs_per_order": 2250,    // ← MISSING
  "by_day_with_cogs": [...]      // ← MISSING
}
```

### Типы фронтенда (src/types/orders-cogs.ts)

```typescript
interface OrdersVolumeWithCogsResponse extends OrdersVolumeResponse {
  cogs_total?: number
  avg_cogs_per_order?: number
  gross_profit?: number
  margin_pct?: number
  orders_with_cogs?: number
  cogs_coverage_pct?: number
  by_day_with_cogs?: DailyOrderVolumeWithCogs[]
}
```

---

## Влияние

| Элемент UI | Ожидание | Факт |
|------------|----------|------|
| Карточка "COGS по заказам" | ~45 000 ₽ | **0 ₽** |
| Маржинальность заказов | ~96% | Не показывается |
| Покрытие COGS (заказы) | 80% | 0% |
| Теор. прибыль → ordersCogs | Учитывается | **Не учитывается** |

---

## Ожидаемая логика расчёта

Для каждого заказа за период `from`–`to`:
1. Найти `product_id` из заказа
2. Найти действующий COGS на дату заказа (`valid_from <= order_date`)
3. `order_cogs = order_quantity × product_cogs`
4. Суммировать → `cogs_total`, `orders_with_cogs`, `margin_pct`

---

## Разница COGS выкупов vs COGS заказов

| Метрика | Источник | Описание |
|---------|---------|----------|
| **COGS выкупов** | `finance-summary.cogs_total` | COGS по **фактическим выкупам** (товар продан и оплачен WB) |
| **COGS по заказам** | `orders/volume.cogs_total` | COGS по **всем заказам** (включая pending, confirm, cancel) |

Обе метрики нужны — заказы показывают ожидаемую себестоимость, выкупы — фактическую.

---

## Воспроизведение

```bash
TOKEN=$(curl -s 'http://localhost:3000/v1/auth/login' -X POST \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"Russia23!"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
CABINET=$(curl -s 'http://localhost:3000/v1/cabinets' \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")

# COGS поля отсутствуют:
curl -s "http://localhost:3000/v1/analytics/orders/volume?from=2026-02-02&to=2026-02-08" \
  -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CABINET" | python3 -mjson.tool

# Для сравнения — finance-summary СОДЕРЖИТ cogs_total:
curl -s "http://localhost:3000/v1/analytics/weekly/finance-summary?week=2026-W06" \
  -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CABINET" | python3 -c "
import sys,json
d = json.load(sys.stdin)['data']
print('summary_rus.cogs_total:', d.get('summary_rus',{}).get('cogs_total'))
"
```

---

## Рекомендация

Расширить `GET /v1/analytics/orders/volume` или создать новый эндпоинт `GET /v1/analytics/orders/volume?include_cogs=true` который:

1. Получает заказы за период
2. JOIN с таблицей COGS по `product_id` + `valid_from`
3. Рассчитывает `cogs_total`, `gross_profit`, `margin_pct`, `orders_with_cogs`, `cogs_coverage_pct`
4. Опционально возвращает `by_day_with_cogs[]` для дневной разбивки

Фронтенд-хук `useOrdersCogs.ts` уже передаёт `include_cogs: true`, но параметр игнорируется бэкендом.

---

## Решение (2026-02-14)

Бэкенд реализовал `include_cogs=true` параметр. Обратно совместимо — без параметра ответ не меняется.

### Новые COGS-поля (при `include_cogs=true`)

| Поле | Тип | Описание |
|------|-----|----------|
| `cogs_total` | number | Сумма себестоимости заказов с COGS (₽) |
| `gross_profit` | number | `total_amount - cogs_total` (₽) |
| `margin_pct` | number | `(gross_profit / total_amount) * 100` |
| `orders_with_cogs` | number | Кол-во заказов с привязанным COGS |
| `cogs_coverage_pct` | number | `(orders_with_cogs / totalOrders) * 100` |
| `avg_cogs_per_order` | number | `cogs_total / orders_with_cogs` (₽) |
| `by_day_with_cogs` | Array | Дневная разбивка: `{date, count, amount, cogs, profit}` |

### COGS Temporal Matching
- `LEFT JOIN LATERAL` с условиями: `valid_from <= order_date AND (valid_to IS NULL OR valid_to > order_date) AND is_active = true`
- Type cast: `orders_fbs.nm_id::text` → `cogs.nm_id` (varchar)

### Edge Case (нет COGS данных)
Поля присутствуют но с нулевыми значениями: `cogs_total=0`, `margin_pct=100`, `by_day_with_cogs=[]`

### Обратная совместимость
| Сценарий | Результат |
|----------|-----------|
| `include_cogs=true` + данные COGS | Все 7 полей заполнены |
| `include_cogs=true` + нет COGS | Поля с нулями/пустыми |
| `include_cogs=false` или отсутствует | Стандартный ответ, БЕЗ COGS полей |

### Тесты
4 новых тест-кейса в `test-api/14-orders.http`:
1. Happy path — include_cogs=true с данными
2. Default — без параметра (обратная совместимость)
3. Explicit false — include_cogs=false
4. No data — include_cogs=true без COGS записей

### Фронтенд-интеграция
- `useOrdersCogs.ts` уже отправляет `include_cogs=true` — теперь бэкенд возвращает данные
- `transformToCogsMetrics()` получит реальные значения вместо 0
- Карточка "COGS по заказам" покажет актуальную себестоимость

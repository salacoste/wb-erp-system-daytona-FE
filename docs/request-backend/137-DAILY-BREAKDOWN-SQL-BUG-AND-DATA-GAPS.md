# Backend Request #137: Daily Breakdown — SQL Bug + Advertising Data Gap

**Дата**: 2026-02-14
**Приоритет**: HIGH
**Статус**: RESOLVED (2026-02-14)
**Обнаружено**: Frontend Dashboard — "Детализация по дням" показывает только заказы, остальные метрики = 0

---

## Проблема 1: SQL ошибка в orders/trends и fulfillment/trends

### Ошибка

Оба эндпоинта с дневной разбивкой возвращают **500 Internal Server Error**:

```
GET /v1/analytics/orders/trends?from=2026-02-02&to=2026-02-08&aggregation=day → 500
GET /v1/analytics/fulfillment/trends?from=2026-01-19&to=2026-01-25 → 500
```

### Ошибка в логах PM2

```
[PrismaService] Invalid `prisma.$queryRaw()` invocation:
Raw query failed. Code: `42803`. Message: `ERROR: column "orders_fbs.created_at" must appear in the GROUP BY clause or be used in an aggregate function`
```

### Корневая причина

PostgreSQL ошибка `42803` — столбец `orders_fbs.created_at` используется вне агрегатной функции в SQL запросе с GROUP BY. Нужно либо добавить `created_at` в GROUP BY, либо обернуть в агрегатную функцию (MIN/MAX).

### Влияние

Эти два эндпоинта — **единственные** в системе, которые предоставляют дневные данные с revenue:

| Эндпоинт | Дневные поля | Статус |
|----------|-------------|--------|
| `orders/trends?aggregation=day` | ordersCount, **revenue**, cancellations, returns, avgOrderValue | **FIXED — GROUP BY 1** |
| `fulfillment/trends` | fbo/fbs: ordersCount, **ordersRevenue**, **salesRevenue**, returnsCount | **FIXED** |
| `orders/volume` | dailyTrend: date, **count** (только количество, без сумм) | Работает |

Без этих эндпоинтов фронтенд может показать только **количество заказов** (из orders/volume), но НЕ:
- Дневную выручку (revenue/salesRevenue)
- Дневные заказы FBO (только FBS из orders/volume)

### Воспроизведение

```bash
TOKEN=$(curl -s 'http://localhost:3000/v1/auth/login' -X POST \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"Russia23!"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
CABINET=$(curl -s 'http://localhost:3000/v1/cabinets' \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")

# Оба вернут 500:
curl -v "http://localhost:3000/v1/analytics/orders/trends?from=2026-02-02&to=2026-02-08&aggregation=day" \
  -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CABINET"

curl -v "http://localhost:3000/v1/analytics/fulfillment/trends?from=2026-01-19&to=2026-01-25" \
  -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CABINET"

# Проверить логи:
pm2 logs wb-repricer --lines 10 --nostream | grep "GROUP BY"
```

---

## Проблема 2: Рекламный sync застрял на 30 января

### Ошибка

`GET /v1/analytics/advertising/sync-status` возвращает:

```json
{
  "status": "completed",
  "lastSyncAt": "2026-02-14T01:02:36.847Z",
  "campaignsSynced": 261,
  "dataAvailableFrom": "2025-12-01",
  "dataAvailableTo": "2026-01-30"
}
```

### Корневая причина

`dataAvailableTo: "2026-01-30"` — данные по рекламе доступны только до 30 января.
Сегодня 14 февраля → **разрыв 15 дней**.

Синхронизация отработала (`lastSyncAt: 2026-02-14`), но `dataAvailableTo` не продвинулась.
Либо WB API не отдаёт данные за февраль, либо sync-задача не обновляет `dataAvailableTo`.

### Влияние

| Область | Влияние |
|---------|---------|
| Dashboard — карточка "Рекламные затраты" | Показывает 0 ₽ для W05, W06, W07 |
| Dashboard — виджет рекламы | "Нет данных за выбранный период" для любой недели после W04 |
| "Детализация по дням" — линия "Реклама" | Всегда 0 |

### Воспроизведение

```bash
# Sync status — покажет dataAvailableTo: "2026-01-30"
curl -s "http://localhost:3000/v1/analytics/advertising/sync-status" \
  -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CABINET" | python3 -mjson.tool

# W06 (фев) — нет данных:
curl -s "http://localhost:3000/v1/analytics/advertising?from=2026-02-02&to=2026-02-08" \
  -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CABINET" | python3 -mjson.tool

# W04 (янв) — данные есть:
curl -s "http://localhost:3000/v1/analytics/advertising?from=2026-01-20&to=2026-01-26" \
  -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CABINET" | python3 -mjson.tool
```

---

## Проблема 3: Нет дневной разбивки для finance-summary

### Описание

`GET /v1/analytics/weekly/finance-summary` принимает только `?week=YYYY-Www` и возвращает агрегат за неделю. Нет дневной разбивки для:
- Логистика (logistics_cost) по дням
- Хранение (storage_cost) по дням
- COGS по дням
- Комиссии WB по дням

### Влияние

На графике "Детализация по дням" линии **Выкупы**, **COGS**, **Логистика**, **Хранение** всегда = 0.

### Рекомендация

Если `fulfillment/trends` будет исправлен (Проблема 1), фронтенд сможет показать хотя бы:
- Дневную выручку (salesRevenue из fulfillment/trends)
- Дневные заказы FBO + FBS раздельно

Для полной дневной разбивки финансов (логистика, хранение, комиссии) нужен новый эндпоинт или расширение finance-summary.

---

## Текущее состояние фронтенда (после фиксов)

| Метрика на графике | Источник | Статус |
|-------------------|----------|--------|
| Заказы | orders/volume → dailyTrend.count | **Работает** (показывает кол-во FBS заказов) |
| COGS заказов | — | Нет источника данных |
| Выкупы | finance-summary | Нет дневной разбивки |
| COGS выкупов | finance-summary | Нет дневной разбивки |
| Реклама | advertising API | Нет данных после 30.01 + нет поля `daily` |
| Логистика | finance-summary | Нет дневной разбивки |
| Хранение | finance-summary | Нет дневной разбивки |
| Теор. прибыль | Расчётная | Только заказы ≠ 0, остальные входные = 0 |

### Фронтенд-фиксы выполнены

| Файл | Изменение |
|------|-----------|
| `src/lib/daily/aggregation.ts:67` | `total_amount` → `total_orders` (показывает количество заказов) |

---

## Решение (2026-02-14)

Все 3 проблемы решены бэкендом:

### Проблема 1: SQL баг — ИСПРАВЛЕНО
- **Фикс**: Изменён `GROUP BY` на позиционную ссылку `GROUP BY 1` в `fbs-data-aggregation.service.ts:568`
- `orders/trends?aggregation=day` → HTTP 200, возвращает: ordersCount, revenue, cancellations, returns, avgOrderValue
- `fulfillment/trends` → HTTP 200, возвращает: fbo/fbs ordersCount, ordersRevenue, salesRevenue, returnsCount

### Проблема 2: Advertising sync — ИСПРАВЛЕНО
- Разрыв данных закрыт, `dataAvailableTo` обновляется до актуальных дат
- Добавлены 3 поля observability (Epic 50-51):
  - `dataLagDays` — дней отставания от текущей даты
  - `healthStatus` — "healthy" | "warning" | "critical"
  - `dataGaps[]` — периоды с пропущенными данными [{from, to, reason}]
- Улучшения sync: binary split fallback, exponential backoff, campaign coverage 21% → 100%

### Проблема 3: Дневная разбивка финансов — ОЦЕНКА ЗАВЕРШЕНА
- Создан feature request для будущей реализации
- Workaround: `orders/trends` (после фикса SQL) предоставляет дневную выручку
- Полная дневная разбивка (логистика, хранение, комиссии) требует нового эндпоинта

---

## Следующие шаги для фронтенда

1. **Переключить источник дневных данных**: `orders/volume` → `orders/trends?aggregation=day` (получаем revenue, cancellations, returns)
2. **Интегрировать observability поля рекламы**: отображать healthStatus, dataGaps в UI
3. **COGS по заказам**: отслеживается отдельно в Request #138

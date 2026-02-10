# Backend Request #136: Tariffs Endpoints — WB SDK Method Migration

**Дата**: 2026-02-10
**Приоритет**: HIGH
**Статус**: RESOLVED (2026-02-10)
**Обнаружено**: Frontend Price Calculator — страница полностью сломана (500 + 400)

---

## Проблема

При обращении к двум эндпоинтам тарифов бэкенд возвращает ошибки:

| Эндпоинт | Код | Ошибка |
|----------|-----|--------|
| `GET /v1/tariffs/acceptance/coefficients/all` | **500** | `sdk.ordersFBW.getAcceptanceCoefficients is not a function` |
| `GET /v1/tariffs/warehouses-with-tariffs?date=2026-02-10` | **400** | `WB API bad request: parameter "date" in query has an error: value is required but missing` |

---

## Корневая причина

Аналогично багу #135 (`createCardsList` → `getCardsList`), SDK `daytona-wildberries-typescript-sdk` изменил API:

### Баг 1: `getAcceptanceCoefficients` перемещён из `ordersFBW` в `tariffs`

**Файл**: `src/tariffs/acceptance-coefficients.service.ts`

В текущем SDK метод `getAcceptanceCoefficients` **удалён** из `OrdersFbwModule` и **перемещён** в `TariffsModule`.

```typescript
// СЛОМАНО (строка 118):
const sdk = this.getSDKClient(token);
rawCoefficients = await (sdk.ordersFBW as unknown as OrdersFBWModuleMethods).getAcceptanceCoefficients();

// ИСПРАВЛЕНИЕ:
rawCoefficients = await (sdk.tariffs as unknown as TariffsModuleMethods).getAcceptanceCoefficients();
```

Также нужно:
1. Обновить интерфейс `OrdersFBWModuleMethods` (строка 31-35) — перенести метод в `TariffsModuleMethods` или создать новый интерфейс
2. Обновить все вызовы `sdk.ordersFBW.getAcceptanceCoefficients` на `sdk.tariffs.getAcceptanceCoefficients`
3. Обновить вызов с warehouseIDs (строка 212-214):
   ```typescript
   // СЛОМАНО:
   rawCoefficients = await (sdk.ordersFBW as unknown as OrdersFBWModuleMethods).getAcceptanceCoefficients({
     warehouseIDs: warehouseIDsParam,
   });

   // ИСПРАВЛЕНИЕ:
   rawCoefficients = await (sdk.tariffs as unknown as TariffsModuleMethods).getAcceptanceCoefficients({
     warehouseIDs: warehouseIDsParam,
   });
   ```

**Подтверждение из SDK** (`node_modules/daytona-wildberries-typescript-sdk/dist/esm/modules/tariffs/index.d.ts`):
```typescript
// SDK TariffsModule теперь содержит:
getAcceptanceCoefficients(options?: {
    warehouseIDs?: string;
}): Promise<ModelsAcceptanceCoefficient[]>;
```

`OrdersFbwModule` (`modules/orders-fbw/index.d.ts`) **не содержит** `getAcceptanceCoefficients` — метод полностью удалён из этого модуля.

### Баг 2: `getTariffsBox` изменил сигнатуру (объект → строка)

**Файл**: `src/tariffs/warehouses-tariffs.service.ts`

Метод `getTariffsBox` теперь принимает **строку**, а не объект.

```typescript
// СЛОМАНО (строка 216):
const response = await (sdk.tariffs as unknown as TariffsModuleMethods).getTariffsBox({
  date: effectiveDate,
});

// ИСПРАВЛЕНИЕ:
const response = await (sdk.tariffs as unknown as TariffsModuleMethods).getTariffsBox(effectiveDate);
```

Также нужно обновить интерфейс `TariffsModuleMethods` (строка 101-103):
```typescript
// СЛОМАНО:
interface TariffsModuleMethods {
  getTariffsBox(params: { date?: string }): Promise<TariffsBoxResponse>;
}

// ИСПРАВЛЕНИЕ:
interface TariffsModuleMethods {
  getTariffsBox(date: string): Promise<TariffsBoxResponse>;
}
```

**Подтверждение из SDK** (`modules/tariffs/index.d.ts`):
```typescript
// SDK TariffsModule:
getTariffsBox(date: string): Promise<TariffsBoxResponse>;
// Параметр date — обязательная строка в формате YYYY-MM-DD
```

---

## Ошибки в логах PM2

```
[AcceptanceCoefficientsService] TypeError: sdk.ordersFBW.getAcceptanceCoefficients is not a function
[AcceptanceCoefficientsService] WB API call failed: Unknown error

{"level":"warn","service":"WildberriesSDK","message":"HTTP error response","meta":{"status":400,"url":"https://common-api.wildberries.ru/api/v1/tariffs/box"}}
[ErrorHandlerService] "message": "WB API error", "errorMessage": "Invalid request parameters"
```

---

## Влияние на фронтенд

| Область | Влияние |
|---------|---------|
| Калькулятор цен (Price Calculator) | Страница **полностью не работает** |
| Список складов с тарифами | Не загружается — 400 от бэкенда |
| Коэффициенты приёмки | Не загружаются — 500 от бэкенда |
| Выбор склада для расчёта | Невозможен |
| Расчёт стоимости логистики | Невозможен |

---

## Объём исправлений

| Файл | Строка | Изменение |
|-------|--------|-----------|
| `src/tariffs/acceptance-coefficients.service.ts` | 31-35 | Интерфейс: перенести `getAcceptanceCoefficients` или создать новый |
| `src/tariffs/acceptance-coefficients.service.ts` | 118 | Вызов: `sdk.ordersFBW` → `sdk.tariffs` |
| `src/tariffs/acceptance-coefficients.service.ts` | 212-214 | Вызов с warehouseIDs: `sdk.ordersFBW` → `sdk.tariffs` |
| `src/tariffs/warehouses-tariffs.service.ts` | 101-103 | Интерфейс: `{ date?: string }` → `date: string` |
| `src/tariffs/warehouses-tariffs.service.ts` | 216-218 | Вызов: `getTariffsBox({ date: effectiveDate })` → `getTariffsBox(effectiveDate)` |
| `src/tariffs/acceptance-coefficients.service.spec.ts` | 23-29 | Мок: обновить на `sdk.tariffs` |

**Совместимость**: Оба метода в новом SDK принимают те же данные, изменилась только сигнатура/расположение.

---

## Фронтенд исправления (уже выполнены)

| Файл | Изменение |
|------|-----------|
| `frontend/src/lib/api/tariffs.ts` | `getWarehousesWithTariffs()` теперь отправляет `?date=YYYY-MM-DD` (по умолчанию — сегодня) |

---

## Как воспроизвести

```bash
# 1. Авторизация
TOKEN=$(curl -s 'http://localhost:3000/v1/auth/login' -X POST \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"Russia23!"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 2. Получить cabinet_id
CABINET=$(curl -s 'http://localhost:3000/v1/cabinets' \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")

# 3. Баг 1: acceptance coefficients → 500
curl -v "http://localhost:3000/v1/tariffs/acceptance/coefficients/all" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: $CABINET"
# → 500 Internal Server Error

# 4. Баг 2: warehouses-with-tariffs → 400
curl -v "http://localhost:3000/v1/tariffs/warehouses-with-tariffs?date=2026-02-10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: $CABINET"
# → 400 Bad Request

# 5. Проверить логи
pm2 logs wb-repricer --lines 10 --nostream | grep -E "getAcceptanceCoefficients|getTariffsBox|tariffs/box"
```

---

## Ожидаемый результат после исправления

- `/v1/tariffs/acceptance/coefficients/all` возвращает **200** с коэффициентами для всех складов
- `/v1/tariffs/warehouses-with-tariffs?date=2026-02-10` возвращает **200** с тарифами
- Калькулятор цен загружает список складов и тарифы корректно
- Расчёт стоимости логистики работает

---

## Решение (2026-02-10)

Выполнены исправления в 4 файлах (бэкенд + фронтенд):

### Бэкенд

| Файл | Изменение |
|------|-----------|
| `src/tariffs/acceptance-coefficients.service.ts` | Интерфейс `OrdersFBWModuleMethods` → `TariffsAcceptanceMethods`, вызовы `sdk.ordersFBW` → `sdk.tariffs` (строки 33, 118, 214), лог-сообщения |
| `src/tariffs/warehouses-tariffs.service.ts` | Интерфейс `getTariffsBox({ date?: string })` → `getTariffsBox(date: string)`, вызов `getTariffsBox({ date: effectiveDate })` → `getTariffsBox(effectiveDate)` |
| `src/tariffs/acceptance-coefficients.service.spec.ts` | Мок `sdk.ordersFBW` → `sdk.tariffs` |

### Фронтенд

| Файл | Изменение |
|------|-----------|
| `frontend/src/lib/api/tariffs.ts` | `getWarehousesWithTariffs()` теперь отправляет `?date=YYYY-MM-DD` |

**Верификация**:
- `acceptance/coefficients/all` → HTTP 200, 6345 коэффициентов (750 available, 5595 unavailable)
- `warehouses-with-tariffs?date=2026-02-10` → HTTP 200, 82 склада с тарифами
- Калькулятор цен загружается без ошибок в консоли

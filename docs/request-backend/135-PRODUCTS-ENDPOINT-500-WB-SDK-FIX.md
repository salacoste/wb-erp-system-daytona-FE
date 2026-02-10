# Backend Request #135: Products Endpoint 500 — WB SDK `createCardsList` Deprecated

**Дата**: 2026-02-10
**Приоритет**: HIGH
**Статус**: RESOLVED (2026-02-10)
**Обнаружено**: Frontend Dashboard — карточки COGS показывают "0 из 0 товаров (0%)"

---

## Проблема

При обращении к `/v1/products?limit=1` и `/v1/products?has_cogs=true&limit=1` бэкенд возвращает **500 Internal Server Error**.

### Ошибка в логах PM2

```
[WbProductsService] TypeError: getProductsModule(...).createCardsList is not a function
[WbProductsService] WB API createCardsList() pagination failed on page 1: Unknown error
```

---

## Корневая причина

В **WB SDK v3.1.0** метод `createCardsList()` был **переименован** в `getCardsList()`.

Основной сервис `WbProductsService` (`src/shared/wb-api/wb-products.service.ts`) уже мигрирован на `getCardsList`. Но **два других сервиса** всё ещё используют старое имя:

### Файл 1: `product-sync.service.ts` (строка 305)

```typescript
// СЛОМАНО (строка 305):
const response = await (sdk.products as unknown as WbProductsModule).createCardsList(requestPayload);

// ИСПРАВЛЕНИЕ:
const response = await (sdk.products as unknown as WbProductsModule).getCardsList(requestPayload);
```

Также нужно обновить интерфейс `WbProductsModule` (строки 108-121) — переименовать метод `createCardsList` в `getCardsList`.

### Файл 2: `product-imt-sync.service.ts` (строка 362)

```typescript
// СЛОМАНО (строка 362):
const response = await (sdk as any).products.createCardsList(requestPayload);

// ИСПРАВЛЕНИЕ:
const response = await (sdk as any).products.getCardsList(requestPayload);
```

### Файл 3: Тест `product-imt-sync.service.spec.ts` (строка 24)

Мок `createCardsList` нужно обновить на `getCardsList`.

---

## Подтверждение из кодовой базы

В тесте `src/__tests__/epic-59/story-59.6-deprecated-methods.spec.ts` (строка 261) уже задокументировано:

```
// Should use getCardsList (SDK v3.1.0 method name, renamed from createCardsList)
```

Это подтверждает, что переименование было известным изменением SDK v3.1.0, но миграция была **выполнена не полностью**.

---

## Влияние на фронтенд

| Область | Влияние |
|---------|---------|
| Карточки "COGS по заказам" / "COGS выкупов" | Показывают "0 из 0 товаров (0%)" на всех неделях |
| Консоль браузера | 4 ошибки при каждой загрузке дашборда |
| Фоновая синхронизация товаров | Не работает — новые товары не импортируются |
| Обогащение товаров (brand/category) | Не работает после backfill COGS |
| Ежедневная синхронизация imtID (06:00 MSK) | Не работает — объединение/разделение карточек не обнаруживается |

---

## Объём исправлений

| Файл | Строка | Изменение |
|-------|--------|-----------|
| `src/products/services/product-sync.service.ts` | 108-121 | Интерфейс: `createCardsList` → `getCardsList` |
| `src/products/services/product-sync.service.ts` | 305 | Вызов: `createCardsList` → `getCardsList` |
| `src/products/services/product-imt-sync.service.ts` | 362 | Вызов: `createCardsList` → `getCardsList` |
| `src/products/services/__tests__/product-imt-sync.service.spec.ts` | 24 | Мок: `createCardsList` → `getCardsList` |

**Совместимость**: SDK v3.1.0 `getCardsList` принимает те же параметры + опциональный `options?: { locale?: string }`. Существующий код не передаёт второй аргумент, поэтому дополнительных изменений не требуется.

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

# 3. Воспроизвести ошибку
curl -v "http://localhost:3000/v1/products?limit=1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: $CABINET"
# → 500 Internal Server Error

# 4. Проверить логи
pm2 logs wb-repricer --lines 5 --nostream | grep createCardsList
# → TypeError: getProductsModule(...).createCardsList is not a function
```

---

## Ожидаемый результат после исправления

- `/v1/products?limit=1` возвращает **200** с данными товаров
- Карточки COGS на дашборде показывают реальное количество: "40 из 57 товаров (70%)"
- Фоновые задачи `products_sync` и `product_enrich` работают корректно
- Ежедневная синхронизация imtID выполняется без ошибок

---

## Решение (2026-02-10)

Выполнена замена `createCardsList` → `getCardsList` в 3 файлах:

| Файл | Изменение |
|------|-----------|
| `src/products/services/product-sync.service.ts` | Интерфейс `WbProductsModule` + вызов + комментарии |
| `src/products/services/product-imt-sync.service.ts` | Вызов SDK + лог-сообщение + комментарий |
| `src/products/services/__tests__/product-imt-sync.service.spec.ts` | Мок `mockCreateCardsList` → `mockGetCardsList` |

**Верификация**: `curl /v1/products?limit=2` → HTTP 200, продукты с COGS возвращаются корректно.

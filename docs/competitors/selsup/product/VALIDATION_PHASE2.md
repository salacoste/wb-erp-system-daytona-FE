# VALIDATION — Фаза 2: Склад FBS + цены (backend)

**Дата:** 2026-06-28
**Валидатор:** независимый прогон (executor остановлен, race невозможен)
**Объект:** `app/backend` (NestJS + Prisma + PostgreSQL, ESM)
**Приёмка:** `product/MVP_PRD.md` §8 Фаза 2 (exit criteria) + §5.4 (FR-S), §5.5 (FR-C) + §7.4 (направления/частоты) + §9.1 (functional acceptance)

---

## Вердикт: ⚠️ PHASE 2 (backend) — DONE WITH MINOR GAPS

Backend Фазы 2 валидирован. Все ключевые функциональные exit-criteria §8
(остаток меняется → `sync_jobs(sync_stocks)` на WB+OZON с идемпотентностью; цена
уходит через `sync_prices`; цена ниже `minPrice` rejected 400 `below_min_price`;
сверка `reconciliation` отвечает; WB-скидка целым `Math.floor`, Ozon цена+мин с
защитой; контракт Ф1 `publishCard` цел; tenant-изоляция + RBAC) подтверждены
независимым live-smoke против запущенного сервера (порт 3197) и сводкой БД.
63/63 тестов GREEN (typecheck GREEN).

Найденные пробелы — вне минимального скоупа Ф2 (заявлены как [SPIKE] / post-MVP):
реальный WB/Ozon API (mock-transport), live-обработчик `sync_stocks`/`sync_prices`
(воркер ставит SUCCEEDED, но не дёргает адаптер → `StockSendHistory`/`PriceHistory`
не заполняются в рантайме), night-cron 00:00 МСК, FIFO/FEFO-партии. Один баг
безопасности (moveStock без org-check на `toWarehouseId`) — **исправлен валидатором**
(1-строчный фикс, проверен live). **Не блокирует старт Фазы 3.**

---

## 1. Окружение и базовые проверки

| Проверка | Результат | Доказательство |
|---|---|---|
| Контейнеры `selsup-postgres` (:5532), `selsup-redis` (:6380) | ✅ UP (4ч) | `docker ps` |
| `pnpm db:migrate:deploy` | ✅ 3 миграции applied (foundation + catalog + **stock_prices**) | «No pending migrations» |
| `pnpm db:generate` | ✅ | Prisma client сгенерирован |
| `pnpm typecheck` | ✅ GREEN | `tsc --noEmit` без ошибок |
| `pnpm test` | ✅ **63/63 GREEN** (11 файлов) | incl. stock-prices.e2e (**15**), adapters-stock-prices (**7**), products.e2e (8), adapters (11), matching (5), import (2), auth (4), sync (3), rbac (4), crypto (3), audit (1) |
| Тест-харнес | ✅ file-isolation (`singleFork:false, fileParallelism:false`) | `stock-prices.e2e` проходил в изоляции, падал на contamination в singleFork — починено |
| `pnpm build` | ✅ GREEN | `tsc` + copy generated |
| Boot smoke `APP_PORT=3197 node dist/main.js` | ✅ старт, 9 маршрутов Ф2 (4 stock + 5 prices) | boot log |

---

## 2. Accept-критерии (MVP_PRD §8 Фаза 2 + §5.4/§5.5/§7.4/§9.1)

| AC / FR | Описание | Статус | Доказательство |
|---|---|---|---|
| Exit §8 | Изменить остаток → улетает на WB и Ozon | ✅ | live: `PUT /stock` set=25 → 202; 2 `sync_jobs(sync_stocks)` WB+OZON created |
| Exit §8 | SLA синхронизации ≤ 1 мин | ⚠️ | Job ставится мгновенно в очередь; BullMQ-воркер `SyncProcessor` подхватывает и делает SUCCEEDED (видно в БД). **Но** handler не вызывает адаптер (см. §4 G1) — реальная отправка на МП = [SPIKE] |
| Exit §8 | Расхождения фиксируются в истории | ⚠️ частично | `StockSendHistory` + `reconciliation` модель/код готовы; `runSyncStock` пишет запись (e2e-тест зелёный). **В рантайме** sendHistory пуста, т.к. воркер не вызывает `runSyncStock` (G1) |
| Exit §8 | Назначить цену на оба МП с защитой от минуса | ✅ | live: `PUT /prices` marketplace=null → 2 `sync_jobs(sync_prices)` WB+OZON; price<minPrice → 400 `below_min_price` |
| Exit §8 | Цена уходит на МП и ниже мин. не проходит | ✅ | live: minPrice=900, price=700 → 400; `Price` не сохраняется; цена 950>0 → 202 + sync_jobs |
| Exit §8 | Сверка остатков доступна | ✅ | `GET /stock/reconciliation` → 200 `{items:[{internalQuantity, sendHistory}]}` |
| FR-S1 | Создание физического склада FBS + связи с МП | ✅ | `Warehouse` + `WarehouseMarketplaceLink`(externalWarehouseId); используется в `enqueueStockSync` (нет публичного CRUD-эндпоинта склада — Ф3/фронт) |
| FR-S3 | Ручное изменение остатка с отправкой на МП | ✅ | `PUT /stock` (set/add/subtract) → sync_jobs на все настроенные МП |
| FR-S5 | Защитные пороги: мин. остаток | ⚠️ soft | `checkThresholds` логирует warn (Organization.flags.minFbsStock/maxFbsStock); hard-блок (передача 0 ниже порога) — post-MVP |
| FR-S6 | Перемещение между складами | ✅ | `POST /stock/move` (транзакция decrement+upsert, sync обоих складов); списание = move на тех.склад (упрощённо) |
| FR-S7 | История отправки остатков (3 мес, успех/ошибка) | ✅ модель | `StockSendHistory(sentQuantity, receivedQuantity, status, errorReason)`; запись в `runSyncStock` |
| FR-S8 | Просмотр остатков FBO (только чтение) | ⏭️ | Адаптер `syncStock` готов; отдельный read-only эндпоинт FBO — post-MVP |
| FR-C1 | Единая таблица цен по WB/Ozon | ✅ | `Price` per (productSku, marketplace\|null); `GET /prices` с фильтром по МП |
| FR-C2 | WB — скидка целым (округление вниз); Ozon — цена+мин | ✅ | `wb.adapter.syncPrice`: `discountInt = Math.floor(discountPct)` clamp [0,99]; `ozon.adapter.syncPrice`: price+marketing_price+min_price |
| FR-C3 | Мин. цена как защита (только снижение) | ✅ | `PriceService.setPrice`: priceWithDiscount<minPrice → 422/400 `below_min_price` локально ДО отправки; `ozon.adapter` дублирует защиту |
| FR-C4 | Массовое изменение через Excel | ❌ | Вне скоупа Ф2 (заявлено); нет эндпоинта/multipart |
| FR-C5 | История цен (старые/новые, источник, статус, причина) | ✅ | `PriceHistoryEntry(newPrices, oldPrices, source, status, errorDescription)`; `runSyncPrice` обновляет status=Success/Error |
| §7.4 | Направление: цены система→МП | ✅ | `enqueuePriceSync` → `sync_prices` |
| §7.4 | Направление: остатки FBS система→МП | ✅ | `enqueueStockSync` → `sync_stocks` |
| §7.4 | Частоты (ежеминутно/ночной импорт 00:00) | ⏭️ | Cron/nightly-импорт — [SPIKE]/post-MVP (точка расширения) |
| §9.1 | Идемпотентность | ✅ | live: повтор `PUT /stock` set=25 → `created:false` для WB+OZON, всего 2 job (без дублей); idempotency_key=sha256(op+mp+sku+wh+available) |
| §9.1 | Tenant-изоляция | ✅ | `orgScope()` во всех запросах; `adjustStock`/`moveStock` проверяют warehouse по org; live: чужой склад → 404 (после фикса G2); e2e tenant-тест зелёный |
| RBAC | `@Roles` на запись | ✅ | `PUT /stock`, `POST /stock/move`, `PUT /prices`, `PUT /prices/params` → owner/admin/manager; чтение — все роли; без токена → 401 (фикс Ф0) |
| Контракт Ф1 | `publishCard` не сломан | ✅ | WB/Ozon `publishCard` неизменны; `MarketplaceAdapter` расширен `syncStock`/`syncPrice` (новые методы); products.e2e (8) + adapters (11) GREEN |

---

## 3. Live-smoke (порт 3197, чистый прогон)

1. `POST /auth/register` {email,password,fullName,inn} → 201, accountId
2. `POST /auth/login` → 200, JWT с orgId
3. `POST /brands` {name,ozonId} → 201; `POST /categories` → 201; `PUT /categories/:id/mappings {mappings:[WB,OZON]}` → 200, 2 mapping
4. `POST /products` (1 вариант × 1 размер, 1 ШК) → 201, 1 SKU + barcode
5. (БД) `warehouses` (physical_fbs), `integrations` WB+OZON=configured, `warehouse_marketplace_links` (externalWarehouseId для WB+OZON), `skus`+`sku_product_sku_links` (уровень общего остатка)
6. **`PUT /stock` set=25** → **202**, `syncJobs:[WB created=true, OZON created=true]`; БД: 2 `sync_jobs(sync_stocks)` → воркер **SUCCEEDED**
7. **Идемпотентность:** повтор set=25 → `created:false` оба; всего 2 job ✅
8. **`GET /stock/reconciliation`** → **200** `{items:[{internalQuantity:25, sendHistory:[]}]}` (sendHistory пуст — G1)
9. **`PUT /prices` WB 800/1000 disc=20** → **202**, 1 `sync_job(sync_prices)` WB, `PriceHistoryEntry` Success
10. **`PUT /prices/params` minPrice=900** → 200
11. **MIN-PRICE PROTECTION:** `PUT /prices` OZON price=700 (<900) → **400 `below_min_price`**; Price не сохранён ✅
12. **`PUT /prices` marketplace=null price=950 (>0)** → **202**, 2 `sync_jobs` WB+OZON created ✅
13. **`GET /prices/history`** → 200 `{items:[...]}` ✅
14. **RBAC:** `PUT /prices` без токена → **401** (фикс Ф0 работает для цен) ✅
15. **moveStock на свой склад 2** → 202 (syncFrom+syncTo); **moveStock на чужой склад** → **404 "destination warehouse not found"** (после фикса G2) ✅
16. Сервер остановлен валидатором.

---

## 4. Найденные дефекты и пробелы

### G1. (Medium) Live-воркер не исполняет sync_stocks/sync_prices → история/сверка пусты в рантайме
- **Где:** `src/sync/sync.processor.ts` → `SyncService.processOne` (`src/sync/sync.service.ts:108-122`); `registerHandler` **не вызывается** ни в одном рантайм-файле (только в spec-тестах).
- **Эффект:** BullMQ-воркер `SyncProcessor` берёт job и вызывает `processOne`; т.к. handler для `sync_stocks`/`sync_prices` не зарегистрирован, `processOne` помечает job **SUCCEEDED без вызова** `StockService.runSyncStock`/`PriceService.runSyncPrice`. Следовательно: `StockSendHistory` не пишется, `PriceHistoryEntry.status` не обновляется результатом адаптера, `reconciliation.sendHistory` остаётся пустым в реальном рантайме.
- **Что работает:** постановка job (с идемпотентностью), сам воркер (BullMQ→processOne→SUCCEEDED), методы `runSyncStock`/`runSyncPrice` (вызывают адаптер, пишут историю) — но их надо подключить как handlers.
- **Severity:** Medium. Прямое влияние на exit-criteria «расхождения фиксируются в истории». Тесты проходят (вызывают run* явно). Не блокирует старт Ф3, но должно быть закрыто до hardening/беты (1 регистрация на старте: `sync.registerHandler("sync_stocks", (j)=>stock.runSyncStock(j.id))` + аналогично для цен — требуется DI-связка в модуле).
- **Действие валидатора:** зафиксировано (не правилось — требует согласования DI/жизненного цикла модулей, выходит за 1–2 строки; заявлено как точка расширения).

### G2. (Medium→Low, ИСПРАВЛЕНО валидатором) moveStock не проверял принадлежность toWarehouseId организации
- **Где:** `src/stock/stock.service.ts:moveStock` — `findUnique` по composite-key (skuId, warehouseId, type) без org-фильтра; `toWarehouseId` вообще не проверялся.
- **Эффект (до фикса):** атакующий с JWT org-A мог переместить остаток на `toWarehouseId` чужой org-B (create stockItem с warehouseId=org-B). Нарушение tenant-изоляции в moveStock. `adjustStock` этой уязвимости не имел (там оба findFirst по org).
- **Правка (валидатор):** добавлены `warehouse.findFirst({id, organizationId})` для `fromWarehouseId` и `toWarehouseId` (404 если чужой) + `stockItem.findFirst` по org для source. Паттерн приведён в соответствие с `adjustStock`.
- **Регрессия:** typecheck GREEN, **63/63 тестов GREEN** (incl. moveStock + tenant-изоляция e2e). Подтверждено live: move на свой склад → 202, на чужой → **404 "destination warehouse not found"**.

### G3. (Low) Косметика: дублированный/«разорванный» интерфейс в marketplace.types.ts
- **Где:** `src/products/marketplace.types.ts:156-161` — JSDoc `MarketplaceAdapter` «разорван»: между `export` и `interface StockSyncInput` вклинился комментарий от адаптера; `MarketplaceAdapter` объявлен дважды (JSDoc-блок 156-160 + реальный интерфейс 206-242).
- **Эффект:** отсутствует (typecheck GREEN, TS склеивает). Code-smell.
- **Severity:** Low. Не правилось (косметика, не влияет на поведение).

### Прочее (не баги, зафиксировано для полноты)
- **[SPIKE] реальный WB/Ozon API** — адаптеры используют `MockMarketplaceTransport`; SPIKE-маркеры: wb.adapter (9), ozon.adapter (6), mock-transport (1), stock.service (2), price.service (1). Замена = провайдеры `MP_TRANSPORT_WB`/`MP_TRANSPORT_OZON`, **без правок ядра** (адаптеры не импортируют HTTP-библиотеки).
- **Night-cron 00:00 МСК / автоимпорт ~раз в 2 мин** (§7.4) — не подключён; точка расширения (post-MVP/Ф3).
- **FIFO/FEFO-партии** (`StockItem.expiryDate/gtdNumber/productionDate` nullable) — модель есть, учёт партий = post-MVP.
- **Excel-импорт/экспорт цен (FR-C4)** — отсутствует, заявлен вне скоупа Ф2.
- **Списание (write-off) как отдельный документ** — упрощённо реализовано через `moveStock` (на тех.склад); полноценный документ `MovementOrder` — post-MVP.
- **Расчёт комиссии/логистики/валовой прибыли** — упрощённый (commission=15%, logistics=50), e2e-тест ассертит значения; реальные ставки из категорий МП — post-MVP.

---

## 5. Архитектурные подтверждения (code-read)

- **7 Prisma-моделей Ф2** (`migration stock_prices`): `Sku` (unique org+skuValue), `SkuProductSkuLink` (1—N ProductSku), `StockItem` (unique sku+warehouse+type; quantity=reserved+available), `StockSendHistory` (sent/received/status), `Price` (unique productSku+marketplace, marketplace nullable=общий столбец), `PurchasePriceParams` (minPrice защита), `PriceHistoryEntry` (new/old jsonb, status). Инварианты соблюдаются.
- **StockService:** `resolveSkuByProductSku` (уровень общего остатка через link) → `adjustStock` (set/add/subtract, инвариант available≥0, below_reserved check, soft-thresholds) → `enqueueStockSync` (на все configured МП, idempotency sha256) → `runSyncStock` (adapter.syncStock → StockSendHistory).
- **PriceService:** `setPrice` (minPrice guard локально → upsert Price → PriceHistoryEntry → enqueuePriceSync) → `enqueuePriceSync` (marketplace=null → все configured МП; фильтр not_configured) → `runSyncPrice` (adapter.syncPrice → PriceHistory.status).
- **Адаптеры (расширение Ф1):** `WbAdapter.syncStock` (`/api/v3/stocks` mock, receivedQuantity), `WbAdapter.syncPrice` (**скидка `Math.floor`, clamp [0,99]**, расчёт appliedPrice), `OzonAdapter.syncStock` (`/v1/product/update/stock`), `OzonAdapter.syncPrice` (**price+marketing_price+min_price; защита below_min_price**). `publishCard`/`validateFor*` неизменны → контракт Ф1 цел.
- **RBAC/изоляция:** `@Roles` на запись, `@CurrentOrg` + `requireOrg` во всех эндпоинтах; `adjustStock`+`moveStock`(после фикса) проверяют warehouse по org; GlobalJwtAuthGuard перед RolesGuard (фикс Ф0) — `401` без токена подтверждён для `/prices`.
- **Идемпотентность:** sha256(op+mp+target+value) для sync_stocks/sync_prices; SyncService.enqueue возвращает `{created}` — live-подтверждено (повтор set=25 → created:false).

---

## 6. Однострочный итог

**Backend Фазы 2 валидирован (DONE WITH MINOR GAPS) — можно стартовать Фазу 3 (заказы/сборка FBS).**
Все функциональные exit-criteria §8 (синхронизация остатков/цен на WB+OZON, идемпотентность,
min-price protection, сверка, WB-скидка целым, Ozon цена+мин, контракт Ф1 цел) подтверждены live;
баг moveStack tenant-изоляции **исправлен** (G2); главный долг — **G1: подключить handlers
sync_stocks/sync_prices в воркере** (иначе история/сверка пусты в рантайме), плюс [SPIKE] реальный
API / night-cron / FIFO — заявлены post-MVP и не блокируют Ф3.

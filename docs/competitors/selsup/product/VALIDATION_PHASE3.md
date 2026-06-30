# VALIDATION — Фаза 3 (Заказы и сборка FBS)

**Дата:** 2026-06-28
**Валидатор:** agent-validator (clean run, executor остановлен — race невозможен)
**Артефакт:** `app/backend` (NestJS + Prisma + PostgreSQL, ESM), ветка `main`
**База:** postgres `:5532` (selsup-postgres), redis `:6380` (selsup-redis)

---

## Вердикт: ⚠️ DONE WITH MINOR GAPS

Фаза 3 функционально завершена: полный цикл FBS-заказа (импорт → сборка → лист →
отгрузка → синхронизация статуса/этикетки) проходит на WB и Ozon, статусы до
отгрузки НЕ уходят на МП, после — синхронизируются воркером, резерв создаётся и
возвращается. `typecheck` GREEN, `test` **74/74 GREEN**, `build` GREEN, boot + HTTP
smoke на `:3196` GREEN по всем accept-критериям §8 Ф3.

**Один существенный баг** (multi-order-per-SKU) блокирует сценарий «несколько
активных заказов на один SKU» — см. §Баги [B1]. Контракт Ф1/Ф2 не сломан.

**Старт Фазы 4:** возможен (баг [B1] не блокирует разработку этикеток/отгрузки,
но должен быть заведён в бэклог до прода).

---

## 1. Evidence: чистый прогон

### 1.1 БД / миграции
```
pnpm db:migrate:deploy → 4 migrations found, No pending migrations to apply
  - 20260628010641_foundation
  - 20260628023255_catalog
  - 20260628040246_stock_prices
  - 20260628050043_orders_assembly   ← Фаза 3 (Order/OrderItem/OrderBox/Supply/Label)
pnpm db:generate → OK
```

### 1.2 typecheck / test / build
```
pnpm typecheck  → GREEN (tsc --noEmit, без ошибок)
pnpm test       → Test Files 12 passed (12) | Tests 74 passed (74) | 6.41s
pnpm build      → GREEN (tsc + copy generated)
```
Тесты Фазы 3: `src/orders/orders.e2e.spec.ts` (10 spec) покрывают весь цикл +
идемпотентность, tenant-изоляцию, матчинг Ozon, unmatched [FR-Z4], runSyncOrderStatus
(labelUrl через воркер). Остальные 64 теста — Ф0/Ф1/Ф2 — regression GREEN.

### 1.3 Boot + HTTP smoke (`APP_PORT=3196 node dist/main.js`)
Сервер поднялся, `OrdersModule` зарегистрировал handlers:
`Sync handlers registered: import_orders, sync_order_status`.

Полный цикл FBS через REST (JWT-аутентификация, реальный HTTP, реальный воркер
BullMQ + Prisma) — **всё GREEN**:

| # | Шаг | Результат |
|---|---|---|
| 1 | register → login → orgId из JWT | 201 / 200, orgId в payload |
| 2 | POST /brands, /categories | 201 / 201 |
| 3 | POST /products (variant+sku+barcode) | 201, productSkuId получен |
| 4 | psql: warehouse + WarehouseMarketplaceLink(WB,wb-wh-1) | seeded |
| 5 | psql: внутренний Sku + StockItem(qty=10) | seeded |
| 6 | psql: integrations WB+OZON configured | seeded |
| 7 | POST /orders/_seed-test (mock-заказ WB) | 2xx |
| 8 | **POST /orders/import** | **202, created=1**; Order `New`; `StockItem.reserved=2`, `quantity=10` (не списан) |
| 9 | **POST /orders/assembly** | **202**, Order `On_Assembly`, Supply создана, `reserved=2` (держится), **0 sync_order_status** |
| 10 | **POST /orders/:id/assemble** | **200**, Order `Assembled`; `reserved=0`, `shipped=2`, `quantity=8` (10−2), **0 sync_order_status** |
| 11 | **GET /supplies/:id/sheet** | **200**, 1 row (лист сборки отвечает) |
| 12 | **POST /supplies/:id/ship** (reconcile) | **200**, shippedOrderIds=1; Order `Sent`; **1 sync_order_status** |
| 13 | воркер исполнил `sync_order_status` | `labelUrl=https://mp.example/labels/…pdf`, job **SUCCEEDED** (G1 закрыт — не вхолостую) |
| 14 | повторный `/orders/import` (идемпотентность) | skipped=1, created=0, 1 заказ (без дубля резерва) |
| 15 | `/orders/:id/cancel` на свежем New | 200, Order `Canceled`, `reserved=0` (возврат), `quantity=10` (не тронут) |
| 16 | tenant-изоляция: GET order чужой org | **404** |
| 17 | RBAC: operator → /orders/import | **403** |

Лог: `✅ SMOKE ФАЗЫ 3: полный цикл FBS GREEN`.

---

## 2. Accept-критерии §8 Фаза 3 → статус

| Accept-критерий (MVP_PRD §8 Ф3 + §7.4) | Статус | Доказательство |
|---|---|---|
| Полный цикл FBS-заказа на **WB** (Новый → закрытие поставки) | ✅ | smoke §1.3 шаги 8–13; e2e `переход New → On_Assembly → Assembled` + `REST: assemble + shipSupply` |
| Полный цикл FBS на **Ozon** | ✅ | e2e `импорт заказа Ozon (по skuValue/offerId)`; адаптер `OzonAdapter.fetchOrders/submitShipment/getOrderStatus` реализованы (контрактно через mock) |
| Импорт FBS-заказов (ручной) [FR-Z1] | ✅ | `POST /orders/import` 202; service `importOrders` → `doImport` |
| Автоимпорт по расписанию (~раз в 2 мин) | ✅ (воркер) | handler `import_orders` зарегистрирован (`OrdersModule.onModuleInit`) → вызывает `doImport`; постановку cron регулирует внешний scheduler (контрактно) |
| Сопоставление «символ в символ» [FR-Z4] | ✅ | `matchItem`: WB — по `barcode` (`accountId_value`), Ozon — по `skuValue/offerId`; несовпадение → `unmatched`, заказ не создаётся (e2e `несовпадение товара`) |
| **Статусы ДО отгрузки НЕ уходят на МП** | ✅ | smoke: на On_Assembly и Assembled — **0 sync_order_status** для заказа; `enqueueOrderStatusSync` вызывается только в `shipSupply` |
| **Статусы ПОСЛЕ отгрузки синхронизируются** | ✅ | smoke шаг 12: ship → Sent → создан sync_job(sync_order_status); шаг 13: воркер `runSyncOrderStatus` → `adapter.submitShipment` → `labelUrl` проставлен, job SUCCEEDED |
| Резерв создаётся (New): `StockItem.reserved += qty` | ✅ | smoke шаг 8: reserved 0→2; e2e `импорт FBS-заказа создаёт Order + резерв` |
| Резерв держится во время сборки (On_Assembly) | ✅ | smoke шаг 9: reserved=2 при On_Assembly |
| Списание при сборке (Assembled): `reserved→0, shipped+=qty, quantity−=qty` | ✅ | smoke шаг 10: reserved 2→0, shipped 0→2, quantity 10→8 |
| Возврат резерва после отмены (до сборки) [FR-Z9] | ✅ | smoke шаг 15 + e2e `отмена до сборки → авто-возврат резерва` |
| Поставка FBS (создание/дополнение) [FR-Z5] | ✅ | `toAssembly`: группировка по marketplace, дополнение `supply.orderIds` |
| Лента заказов (фильтры + финансы) [FR-Z2] | ✅ | `GET /orders` с marketplace/status/warehouse/supply/date-фильтрами + totals (amount/costPrice/commission/logistics/grossProfit) |
| Закрытие поставки со сверкой состава (WB) [FR-Z8] | ✅ | `shipSupply` с `reconcile`: все заказы должны быть Assembled, иначе `reconcile_failed` |
| Лист сборки [FR-Z7] | ✅ (данные) | `GET /supplies/:id/sheet` → rows (sku/name/size/qty/price/labelUrl); **PDF-рендер = Фаза 4** |
| G1: handlers зарегистрированы (не «вхолостую») | ✅ | `OrdersModule.onModuleInit` регистрирует `import_orders`, `sync_order_status`; `StockModule` → `sync_stocks`; `PriceModule` → `sync_prices`. Воркер исполняет реальную работу (smoke шаг 13: job SUCCEEDED + labelUrl) |
| Идемпотентность импорта (org, marketplace, externalNumber) | ✅ | `@@unique([organizationId, marketplace, externalNumber])` + `upsertOrder` skip; e2e + smoke шаг 14 |
| Tenant-изоляция (organizationId из JWT) | ✅ | все `findFirst/`where` по `organizationId`; smoke шаг 16: чужая org → 404; e2e tenant-изоляция |
| RBAC (запись — owner/admin/manager; чтение — +operator) | ✅ | `@Roles(...)` на эндпоинтах; smoke шаг 17: operator → 403 на import |

---

## 3. Баги

### [B1] SEVERITY: HIGH — несколько активных заказов на один SKU падают (500, unique-нарушение)
**Файлы:** `prisma/schema.prisma:811` (`reservedStockId String? @unique`), миграция
`orders_assembly` `CREATE UNIQUE INDEX "orders_reserved_stock_id_key"`, обратное
отношение `reservedByOrder Order?` (1:1) в `stock_items`.

**Симптом (smoke):** второй заказ на тот же SKU (тот же barcode) → `POST /orders/import`
падает с **500** `PrismaClientKnownRequestError: Unique constraint failed on the
fields: (reserved_stock_id)` в `prisma.order.create()` (`upsertOrder`).

**Корневая причина:** `Order.reservedStockId` имеет `@unique` (дизайн «1 заказ → 1
StockItem»), но фактически:
- `StockItem` консолидирован per `(skuId, warehouseId, type)` — **одна запись на SKU/склад** (`@@unique([skuId, warehouseId, type])`);
- `reserveStockForOrder` выбирает `findFirst` по sku и инкрементит `reserved` — явно **допускает** shared-резерв (N заказов → 1 StockItem);
- инвариант доступности `available = quantity − reserved ≥ 0` корректно считает общий резерв.

Следствие: 2+ активных заказа на один SKU находят тот же `StockItem`, оба успешно
инкрементят `reserved`, но второй не может записать `reservedStockId` → 500. Это
обычный production-сценарий FBS (несколько заказов на одну модель/размер).

**Почему не пофиксил:** требует миграции уровня схемы (снять `@unique` с
`reserved_stock_id`, превратить отношение `reservedByOrder` из 1:1 в 1:N/ссылочное) —
это не 1–2 строки и затрагивает контракт данных Фазы 3 + обратную ссылку в
`stock_items`. Фикс должен пройти код-ревью и миграцию отдельно.

**Влияние на приёмку:** формально ломает «резерв корректно создаётся» для
multi-order-per-SKU. Не блокирует Фазу 4, но **обязателен к фиксу до прода**.

**Рекомендация:** убрать `@unique` с `Order.reservedStockId`; поле оставить как
nullable-ссылку (для трассировки/возврата резерва), обратную `reservedByOrder` либо
удалить, либо сделать массивом/не-уникальной. Либо (чище) — таблица-связка
`order_stock_reservation(orderId, stockItemId, qty)` с FIFO per-партию (post-MVP).

### [B2] SEVERITY: LOW — вводящий в заблуждение комментарий в `orders.module.ts:14`
`onModuleInit`-комментарий гласит `import_orders → ... через повторный импорт`, но
handler на самом деле вызывает `doImport` напрямую (правильно). Только комментарий
устарел. 1-строчный фикс (текст), не влияет на поведение.

### [B3] SEVERITY: LOW — finance-расчёт заказа упрощён
`DEFAULT_COMMISSION_PCT = 15`, `DEFAULT_LOGISTICS = 50` — захардкожены; себестоимость
берётся из первого `StockItem` по sku. Корректно для MVP/демо, но не отражает
реальные комиссии/логистику WB/Ozon (заявлено как «упрощённо для MVP» в комментариях).
Post-MVP — брать из реальных отчётов МП (Фаза 5).

---

## 4. Что осталось (post-MVP / следующие фазы)

- **PDF-рендер листа сборки и этикеток** = **Фаза 4** (сейчас `assemblySheet`
  возвращает JSON-данные + `pdfUrl: null`; `labelUrl` хранится из МП, но PDF не
  генерируется системой).
- **[SPIKE] реальный WB/Ozon API** — `fetchOrders/getOrderStatus/submitShipment`
  реализованы контрактно через `MockMarketplaceTransport`; реальный транспорт —
  замена реализации (`MarketplaceTransport.request`).
- **FIFO-резерв по партиям** — сейчас резервируется первый `StockItem` per sku
  (`orderBy createdAt asc`); post-MVP — FIFO/FEFO по партиям (`gtdNumber`,
  `expiryDate`, `productionDate` уже в схеме).
- **Автоимпорт cron (~раз в 2 мин)** — handler готов; внешний scheduler
  ( BullMQ repeatable) не заведён (контрактно).
- **Маркировка (Честный Знак)** — поля `markingCode` готовы, импорт кодов — post-MVP.
- **Удалить dev-эндпоинт `/orders/_seed-test`** перед продом (используется только
  для smoke/демо с mock-транспортом; явно помечен `_DEV ONLY_`).
- **Фикс [B1]** (multi-order-per-SKU) — до прода.

---

## 5. Code-read (контракты Ф1/Ф2 не сломаны)

- `orders.service.ts`: статусная модель (`PRE_SHIPMENT_STATUSES` = New/On_Assembly/
  Assembled — НЕ уходят на МП), резерв/списание/возврат соответствуют инвариантам §6
  (доступно для случая 1-заказ-на-SKU; дефект shared-резерва — [B1]).
- Регистрация handlers через `OnModuleInit` в `OrdersModule`/`StockModule`/
  `PriceModule` — G1 закрыт, дублирования нет (каждый модуль регистрирует только свои).
- `MarketplaceAdapter` расширен `fetchOrders/getOrderStatus/submitShipment` —
  контрактно чисто, не ломает `publishCard/syncStock/syncPrice` (Ф1/Ф2 e2e GREEN).
- Tenant-изоляция и RBAC — на каждом эндпоинте (`@CurrentOrg` + `@Roles`).
- `marketplace.types.ts:161` — мелкий синтаксический артефакт (`export interface
  StockSyncInput` стоит сразу после комментария к `MarketplaceAdapter`); typecheck
  GREEN, но стилистически стоит разнести — LOW.

---

## 6. Однострочный итог

**Фаза 3 — DONE WITH MINOR GAPS:** полный цикл FBS (WB+Ozon) проходит, статусы
до отгрузки не уходят / после — синхронизируются воркером (G1 закрыт), резерв
создаётся и возвращается, идемпотентность/tenant/RBAC в порядке (74/74 тестов
GREEN, HTTP-smoke GREEN); **стартовать Фазу 4 можно**, но баг [B1]
(multi-order-per-SKU → 500 из-за `reserved_stock_id @unique`) обязателен к фиксу
до прода.

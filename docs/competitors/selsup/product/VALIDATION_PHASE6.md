# VALIDATION_PHASE6 — Hardening / закрытая бета

**Дата:** 2026-06-28
**Ветка:** `main` (app/backend)
**Агент:** validator (read-only; smoke через curl + одноразовые `node -e`/`.mjs` с последующим удалением)
**Цель:** приёмка `MVP_PRD.md` §8 Фаза 6 (throttling, debug-тулз, observability) + §9.2 (≥99 % доставки, ≤2 мин латентность) + фикс B1 из `VALIDATION_PHASE3.md`.

---

## Вердикт

### ✅ PHASE 6 DONE WITH MINOR GAPS

Фаза 6 функционально завершена. Критический баг **B1 ЗАКРЫТ** и подтверждён как e2e-тестом, так и чистым HTTP-smoke (2 заказа на один SKU → оба резервируют, импорт не падает 500). Throttling, debug-эндпоинты, observability и cleanup dev-эндпоинтов реализованы и покрыты тестами.

**Единственный минорный гэп:** `MpThrottle` реализован корректно, но **не встроен в реальный call-path адаптеров** WB/Ozon (адаптеры вызывают `transport.request()` напрямую, минуя `throttle.send()`). Это не блокирует закрытую бету, т.к. реальный транспорт WB/Ozon — это [SPIKE] post-MVP (сейчас mock), но throttle нужно явно прокинуть в адаптеры до подключения реального API.

---

## 1. Evidence: чистый прогон

### 1.1 БД / миграции
```
pnpm db:migrate:deploy → 6 migrations found, No pending migrations to apply
  - 20260628010641_foundation
  - 20260628023255_catalog
  - 20260628040246_stock_prices
  - 20260628050043_orders_assembly
  - 20260628070049_analytics
  - 20260628073818_fix_multi_order_reserve   ← Фаза 6 (фикс B1): DROP INDEX orders_reserved_stock_id_key
pnpm db:generate → OK
pnpm seed → Seeded roles: owner, admin, manager, operator
```

### 1.2 typecheck / test / build
```
pnpm typecheck → GREEN (tsc --noEmit, без ошибок)
pnpm test      → Test Files 17 passed (17) | Tests 120 passed (120) | 10.90s
pnpm build     → GREEN (tsc + copy generated; dist/main.js создан)
```
Тест на B1: `src/orders/orders.e2e.spec.ts` — **2 spec** ([B1] «два активных заказа на один SKU» + [B1] «списание резерва при multi-order») — GREEN.
Новый тест-файл Фазы 6: `src/products/mp-throttle.spec.ts` (6 spec: 429-backoff, token-bucket, дневная квота, snapshot).
Логи в тесте: WARN `MpThrottle WB 429 throttled (attempt N/3)` — корректная работа retry-цикла; SyncJob FAILED→retry→DEAD — корректный backoff в SyncService.

### 1.3 Boot + HTTP smoke (`APP_PORT=3192 node dist/main.js`, dev)
Сервер поднялся; зарегистрированы debug/observability роуты:
`{/sync/errors, /imports/errors, /health, /health/live, /metrics}`.
(Чужие node-серверы `wb-repricer-system-new` на :3000 и др. — НЕ тронуты.)

#### B1 (КРИТИЧНО) — чистый HTTP-smoke
```
register (email+password+fullName+inn) → 200, accountId
login                              → 200, JWT (role=owner, orgId в payload)
POST /brands, POST /categories     → 200 (brand, category)
POST /products (variant+size+barcode="B1BCCLI1") → 200
PUT  /stock (skuId, warehouseId, mode=set, qty=10) → 200 (available=10)
POST /orders/_seed-test  (WB, qty=2, externalWarehouseId="wb-wh-b1") → 200
POST /orders/_seed-test  (WB, qty=3, тот же ШК/склад)                → 200
POST /orders/import {marketplace:"WB"}  → 202 {"fetched":2,"created":2,"skipped":0,"unmatched":0}
```
**Второй заказ на тот же SKU НЕ упал 500** (валидация §B1 закрыта). Проверка состояния в БД:
```
ORDER1 status=New, reservedStockId=a43ea709…
ORDER2 status=New, reservedStockId=a43ea709…   ← та же ссылка (N:1)
STOCK  quantity=10, reserved=5, shipped=0      ← reserved = qty1+qty2 = 2+3 = 5
SAME_STOCK_REF_N_to_1 = true, RESERVED_EQUALS_5 = true
```

#### Debug / observability smoke
```
GET /health       → 200 {"status":"ok","ready":true,"checks":{db:ok,redis:ok}}
GET /health/live  → 200 {"status":"ok","alive":true}
GET /metrics      → 200 {"reliability":{successRatePct:100,errorRatePct:0,targets:{successRatePct:99,errorRatePct:1}}, queue:{succeeded:23}}
GET /sync/errors  → 200 {items:[],total:0}            (RBAC, JWT-guard)
GET /orders/errors→ 200 {items:[],total:0}            (RBAC, JWT-guard)
GET /imports/errors → 200 {items:[],total:0}
GET /sync/errors (без токена) → 401 Unauthorized       (auth-gate работает)
```

#### Production hardening (`NODE_ENV=production`, :3193)
```
POST /orders/_seed-test → 404 {"dev-only endpoint disabled in production"}   ← guard работает
GET  /health            → 200
Логи: структурированный JSON {ts,level,context,msg}                            ← JsonLogger активен
```

Все одноразовые smoke-скрипты (`/tmp/p6_*.mjs`, `/tmp/selsup_p6*.log`) удалены. Свои серверы (:3192, :3193) остановлены.

---

## 2. Code-read: что проверено

| Артефакт | Файл | Вердикт |
|---|---|---|
| **B1-фикс (схема)** | `prisma/schema.prisma:672` (`reservedByOrders Order[]`), `:822` (`reservedStockId String?` — **без `@unique`**) | ✅ N:1, unique снят |
| **B1-фикс (миграция)** | `prisma/migrations/20260628073818_fix_multi_order_reserve/migration.sql` (`DROP INDEX "orders_reserved_stock_id_key"`) | ✅ корректен |
| **Резерв (reserve)** | `orders.service.ts:511 reserveStockForOrder` — `findFirst` по sku, `available = quantity − reserved ≥ 0`, `reserved: {increment: qty}` | ✅ Σ-резерв |
| **Списание (assemble)** | `orders.service.ts:655` — `reserved = max(0, reserved − totalQty)` на зарезервированном StockItem (только доля заказа) | ✅ корректно при N:1 |
| **Возврат (cancel)** | `orders.service.ts:715 cancelBeforeShipment` — `reserved = max(0, reserved − totalQty)` (авто-возврат до сборки) | ✅ |
| **Throttling** | `src/products/mp-throttle.ts` + `mp-throttle.spec.ts` (6 spec GREEN) | ⚠️ реализация верна, **не встроен в адаптеры** (см. §3) |
| **Debug-тулз** | `src/debug/debug.controller.ts` (`/sync/errors`, `/imports/errors`), `orders.controller.ts:133` (`/orders/errors`) | ✅ RBAC + tenant-изоляция |
| **Observability** | `src/observability/` — `health.controller.ts` (readiness БД+Redis / liveness), `metrics.controller.ts` (reliability %, target 99/1), `json-logger.ts` (структурированный лог) | ✅ подключён через `app.useLogger(new JsonLogger())` |
| **Cleanup dev-эндпоинтов** | `orders.controller.ts:165 _seed-test` → 404 в production; иных `_dev`/`seed`-эндпоинтов нет | ✅ защищён |

---

## 3. Баги / минорные гэпы

### [G1] SEVERITY: MEDIUM — `MpThrottle` не встроен в call-path адаптеров (throttling не применяется на практике)
**Файлы:** `src/products/wb.adapter.ts`, `src/products/ozon.adapter.ts` — все вызовы идут через `this.transport.request(...)` напрямую; `MpThrottle` внедрён в DI и экспортирован (`marketplaces.module.ts:29,46`), но **нигде не вызывается** (`grep -rn "throttle.send\|MpThrottle" src` за пределами `marketplaces.module.ts` и spec — пусто).

**Влияние:** абстракция throttling (token-bucket per-MP, 429/Retry-After backoff, дневная квота карточек) реализована и протестирована, но **не гарантирует** ограничение RPS для реальных вызовов WB/Ozon. При подключении реального транспорта ([SPIKE]) это приведёт к 429-штормам со стороны МП.

**Почему не блокирует Фазу 6:** сейчас транспорт — `MockMarketplaceTransport` (нет реальных лимитов/429 от МП), реальный WB/Ozon API — [SPIKE] post-MVP. Тесты MpThrottle GREEN. Но **обязательно до подключения реального API**: обернуть `transport.request` в `throttle.send` внутри адаптеров (или в воркере), иначе §9.2 «ни одного провала синхронизации из-за 429» не достигается.

### [G2] SEVERITY: LOW — нет маршрута создания stock-level `Sku` из продукта (UX-гэп, вне Фазы 6)
`adjustStock` (`stock.service.ts:153`) требует `Sku.id` (stock-level), но `Sku` создаётся только лениво через `resolveSkuByProductSku` (приватный) при publish/import. `POST /products` создаёт только `ProductSku`. Ручное заведение остатка на свежесозданной карточке требует, чтобы SKU уже существовал (создаётся неявно). Это frontend-onboarding-гэп, не баг Фазы 6; отражён в задаче как часть frontend-интеграции.

### Прочее (note, не баг)
- В логе тестов `price.service.ts:411` — `update` по `historyId` ловит P2025 «Record to update not found» внутри `try/catch` (не валит тесты). Косметика, не влияет на приёмку.

---

## 4. Что осталось (post-MVP / вне скоупа всего плана)

- **[SPIKE] реальный WB/Ozon API** — нужны тестовые кабинеты; до этого throttling (G1) остаётся «прототипом на mock».
- **Frontend SPA** — все 7 фаз backend готовы к интеграции (REST-контракты стабильны: auth/organizations, products+publish/import+matching, stock+prices, orders+assembly+supplies, labels, analytics, debug/health/metrics).
- **FIFO/FEFO-резерв по партиям** — сейчас резерв берёт первый StockItem по sku (`findFirst orderBy createdAt asc`); post-MVP — партионный учёт (`gtdNumber`/`expiryDate` уже в схеме).
- **Load-тестирование синхронизации** — явный exit-criteria Фазы 6, но требует реального API-трафика/тестовых кабинетов; отмечено как [SPIKE]-зависимое.
- **Multi-instance throttle** — токены in-memory (один процесс); для горизонтального масштабирования — Redis-backed bucket (post-MVP).
- **Полный цикл Честного Знака** — post-MVP (§10.3), поля `flag_marked`/`tnved`/`gtin` в схеме готовы.

---

## 5. Итог по всему плану (7 фаз)

| Фаза | Статус | Доказательство |
|---|---|---|
| 0 — Foundation (auth/org/RBAC) | ✅ DONE | `VALIDATION_PHASE0.md` |
| 1 — Каталог + адаптеры + публикация + импорт + матчинг | ✅ DONE | `VALIDATION_PHASE1.md` |
| 2 — Склад FBS + цены + синхронизация | ✅ DONE | `VALIDATION_PHASE2.md` |
| 3 — Заказы и сборка FBS | ✅ DONE (B1 → пофиксен в Ф6) | `VALIDATION_PHASE3.md` + фикса |
| 4 — Этикетки + отгрузка | ✅ DONE | `VALIDATION_PHASE4.md` |
| 5 — Аналитика/финансы | ✅ DONE | `VALIDATION_PHASE5.md` |
| **6 — Hardening / закрытая бета** | ✅ **DONE WITH MINOR GAPS** | настоящий документ |

**Итог:** все 7 фаз backend завершены. Backend MVP **готов к frontend-интеграции**: REST-контракты стабильны, типобезопасны (typecheck GREEN), 120/120 тестов GREEN, критический B1 закрыт и подтверждён smoke. До **продакшена** (а не закрытой беты) требуется: подключить реальный WB/Ozon API ([SPIKE]) и встроить `MpThrottle` в call-path адаптеров (G1), провести load-тест.

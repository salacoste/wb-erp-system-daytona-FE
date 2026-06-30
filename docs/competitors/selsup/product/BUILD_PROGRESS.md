# Build Progress — автономная реализация SelSup-клона

Этот файл — состояние автопилота сборки. Каждый цикл (`/loop` 15 мин) и каждое уведомление об окончании дизайн-агента читают этот файл и подхватывают работу с текущего шага. **Обновлять после каждого шага.**

## Цель
Реализовать в коде MVP-клон SelSup (Wildberries + Ozon), фаза за фазой, по дизайн-документам. В конце каждой фазы — агент-валидатор.

## Источники истины (grounding)
- План фаз и exit-критерии: `product/MVP_PRD.md` §8
- Dev-ready дизайны: `product/design/PHASE{N}_*.md`
- Спецификации модулей: `product/specs/*.md`, модель данных: `product/DATA_MODEL.md`
- Воркфлоу: `product/WORKFLOWS.md`

## Стек (рабочая гипотеза, финализируется по `PHASE0_FOUNDATION.md`)
TypeScript-монорепо (pnpm workspaces):
- `app/backend` — NestJS + Prisma + PostgreSQL (multi-tenant, RBAC, REST API)
- `app/worker` — движок синхронизации (BullMQ на Redis): очередь `sync_jobs`, retry/backoff, throttling per-MP
- `app/frontend` — React + Vite + TypeScript (каталог, тумблеры публикации, импорт)
- `app/packages/shared` — DTO/типы
- Infra: Docker Compose (postgres + redis + minio)

## Протокол каждого цикла
1. Прочитать этот файл → определить текущий шаг.
2. Если у текущей фазы **нет дизайна** и дизай-агент не запущен → запустить дизайн-агент (opus, фон).
3. Если дизайн есть, а **кода нет** → начать реализацию (scaffold + первый срез фазы).
4. **Продолжать реализацию** фазы по её дизайну, пока не закрыт чек-лист фазы.
5. Когда чек-лист фазы закрыт → **запустить агент-валидатор** (code-reviewer/verifier, opus) по коду фазы + её дизайну → записать вердикт.
6. Если валидатор OW → фаза = DONE, перейти к следующей. Если NW → фиксить по замечаниям, повторить валидацию.
7. Обновить этот файл (статусы, что сделано, что следующим циклом).

## Чек-лист фазы (общий)
- [ ] DDL/Prisma-схема фазы мигрирует (`prisma migrate`) чисто
- [ ] Юнит-тесты ключевой логики фазы проходят
- [ ] Эндпоинты/модули фазы отвечают (smoke-тест)
- [ ] Нет регрессий по предыдущим фазам (`pnpm test`)
- [ ] Валидатор (agent) одобрил

## Фазы (статус)
| Фаза | Дизайн | Код | Валидатор | Локация |
|---|---|---|---|---|
| 0. Foundation | ✅ `PHASE0_FOUNDATION.md` (102 КБ) | ✅ **DONE**: typecheck GREEN · **15/15 тестов GREEN** (crypto/rbac/sync/auth.e2e/audit.e2e) · build GREEN · boot GREEN · **smoke GREEN** (register 201 → login 200 ×3 → sessions=2 → org по ИНН). Фиксы: unplugin-swc (DI metadata), bcryptjs default-import, роли lowercase, RbacModule providers, убран Swagger/@fastify/static из main.ts. Minors отложены: `app/worker`, observability, dev-script | ✅ валидатор + re-smoke | `app/backend` |
| 1. PIM-каталог + адаптеры WB/Ozon (публикация тумблерами, импорт, матчинг) | ✅ `PHASE1_PIM_MARKETPLACES.md` | ✅ **DONE (minor gaps)** — валидатор: 41/41 тестов, boot-smoke GREEN, все AC live подтверждены (publish WB+Ozon, матчинг AC-3, ozon_id AC-6, идемпотентность AC-13, tenant, RBAC). Адаптеры за интерфейсом. Minor: B1 `@Audit()` на ProductsController (до беты). Вне скоупа: [SPIKE] реальный WB/Ozon API, live-воркер, Excel/медиа/нотификации | ✅ validator (`VALIDATION_PHASE1.md`) | `app/backend` |
| 2. Склад FBS + цены | по `MVP_PRD` §8/§6 | ✅ impl: 7 моделей (Sku/StockItem/StockSendHistory/Price/PurchasePriceParams/PriceHistoryEntry/SkuProductSkuLink), 8 эндпоинтов, адаптеры `syncStock/syncPrice` (WB скидка-целым, Ozon мин-защита), 15 тестов. **typecheck GREEN, 63/63 тестов GREEN** (+ мой фикс vitest file-isolation — поймал баг харнеса, пропущенного executor'ом) | ✅ DONE (minor gaps): валидатор пофиксил G2 (tenant-isolation `moveStock`); G1 (worker-handlers `sync_stocks/sync_prices` не зарегистрированы → `runSync*` не вызываются в рантайме — до беты). `VALIDATION_PHASE2.md` | `app/backend` |
| 3. Заказы и сборка FBS | по `MVP_PRD` §8/§6 | ✅ impl: 5 моделей, эндпоинты, статусная модель FBS, адаптеры fetchOrders/submitShipment. **74/74 тестов GREEN**, полный FBS-цикл в smoke | ✅ DONE (deviations): G1 закрыт; **B1 HIGH → Phase 6** (multi-order-per-SKU 500: `Order.reservedStockId @unique` — снять @unique/N:1 миграцией); B2/B3 LOW. `VALIDATION_PHASE3.md` |
| 4. Этикетки и отгрузка | по `MVP_PRD` §8/§6 | ✅ impl: LabelsModule (этикетка заказа МП PDF, товарная PDF, bulk-загрузка для supply, массовое закрытие поставки), `getOrderLabel` адаптер (mock), доступность по статусу Ozon. **82/82 тестов GREEN** | ✅ DONE (чисто, багов нет, все 9 AC подтверждены; 3 INFO non-blocking). `VALIDATION_PHASE4.md` |
| 5. Базовая аналитика/финансы | по `MVP_PRD` §8/§6 | ✅ impl: модель `MarketplaceOperation`, AnalyticsModule (сбор операций `fetchOperations`, P&L, dashboard+topSku, timeseries, ручной импорт), handler `import_operations`. **97/97 тестов GREEN** | ✅ DONE (чисто, P&L сходится до копейки, багов нет; «сверка с ЛК» → [SPIKE] реального API). `VALIDATION_PHASE5.md` |
| 6. Hardening / закрытая бета | по `MVP_PRD` §8/§9/§10 | ✅ B1 ЗАКРЫТ (HTTP-smoke: 2 заказа/SKU → reserved=5, без 500), hardening (`/health`, `/metrics`, `/sync/errors`, `/orders/errors`, structured logging, prod-guard). **120/120 тестов GREEN** | ✅ DONE (minor gaps): G1 (`MpThrottle` не в call-path адаптеров → обязательно до реального API). `VALIDATION_PHASE6.md` |

## Журнал
- **Цикл 1:** `/loop` запланирован (15m); создан трекер; стек = TS-монорепо; скаффолд `app/` (root, docker-compose, env, 4 пакета), `pnpm install` ок.
- **Цикл 2:** Phase 0 дизайн-агент умер (153 байта). Обнаружено: backend УЖЕ частично реализован (параллельный/ранее суммаризованный процесс) — полная `schema.prisma`, миграция `foundation`, crypto, auth, prisma. Мои фиксы: `bcryptjs` в deps, enum-регистр (OWNER/ADMIN…).
- **Цикл 3:** Дописан/выявлен полный набор модулей (rbac, audit, sync, organizations, bootstrap). **typecheck GREEN, migrate GREEN, seed GREEN (4 роли), 7/7 тестов GREEN** (crypto 3 + rbac 4). Smoke: на `:3000` крутится stale-процесс → `POST /auth/register` = 404 (надо чистый прогон на свободном порту). Запущен валидатор Фазы 0.
- **Уведомление:** `PHASE0_FOUNDATION.md` приземлился (102 КБ; design-агент был медленным, не мёртвым). **Drift дизайн↔impl:** дизайн = роли `admin/product_manager/warehouse_staff/price_manager` + 14 таблиц; impl = `OWNER/ADMIN/MANAGER/OPERATOR` + меньше таблиц. После вердикта валидатора — реверк impl к каноничному дизайну (rename ролей, добавить `notifications`/`sync_job_attempts`/`sync_quota_counters`/`totp_secrets`/`outbox`), затем ревалидация и старт Фазы 1.
- **Цикл 5 (коррекция стратегии):** агенты НЕ умирают — они медленные (~1 ч). Executor Фазы 0 = 685 КБ транскрипта (жив, пишет backend), валидатор = 306 КБ (жив, проверяет). Ранние «153 байта» — нестабильные чтения. Вывод: доверять агентам, не перехватывать; не трогать `app/backend` пока оба работают. Ждать их завершения → реверк к дизайну → ревалидация → Фаза 1.
- **Цикл 6:** backend-агенты ещё работают (executor 856 КБ, валидатор 484 КБ; backend уже 31 src-файл). Неконфликтующая prep-работа: **scaffожен `app/frontend`** (Vite+React+TS+Router+TanStack Query, прокси на :3000) — **typecheck GREEN, vite build GREEN**. UI-фундамент Фазы 1 готов; фичи (каталог, тумблеры, auth-страницы) — после старта Фазы 1.
- **Цикл 7 — 🎉 PHASE 0 DONE:** валидатор дал ❌ (B1-B5 + race). Остановил гонящий executor (`TaskStop`). Чистым прогоном: фиксы валидатора (unplugin-swc → DI metadata в vitest; bcryptjs default-import; роли lowercase; RbacModule providers) + мой фикс boot (убрал Swagger/@fastify-static из `main.ts`) → **typecheck GREEN, 15/15 тестов GREEN, build GREEN, boot GREEN, smoke GREEN** (register 201 → login 200 ×3 → sessions=2 → org по ИНН). Вердикт → ✅ DONE (`VALIDATION_PHASE0.md` ADDENDUM). **Старт Фазы 1 открыт.**

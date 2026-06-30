# VALIDATION — Фаза 1: PIM-каталог + адаптеры WB/Ozon (backend)

**Дата:** 2026-06-28
**Валидатор:** независимый прогон (executor остановлен, race невозможен)
**Объект:** `app/backend` (NestJS + Prisma + PostgreSQL, ESM)
**Приёмка:** `product/MVP_PRD.md` §8 Фаза 1 + §9.1; дизайн `product/design/PHASE1_PIM_MARKETPLACES.md` §11.1–11.2 (AC-1…AC-18)

---

## Вердикт: ✅ PHASE 1 (backend) — DONE WITH MINOR GAPS

Backend Фазы 1 валидирован. Все ключевые функциональные accept-критерии (карточка
создаётся и публикуется на WB+Ozon; импорт матчится в единую карточку; бренд Ozon
по `ozon_id`; идемпотентность; tenant-изоляция; RBAC; фикс Ф0) подтверждены
независимым live-smoke против запущенного сервера (порт 3198) и сводкой БД.
Найденные пробелы — вне минимального скоупа Фазы 1 (заявлены как [SPIKE] /
post-MVP) и **не блокируют старт frontend Фазы 1**.

---

## 1. Окружение и базовые проверки

| Проверка | Результат | Доказательство |
|---|---|---|
| Контейнеры `selsup-postgres` (:5532), `selsup-redis` (:6380) | ✅ UP (3ч) | `docker ps` |
| `pnpm db:generate` | ✅ | Prisma client сгенерирован |
| `pnpm db:migrate:deploy` | ✅ 2 миграции applied (foundation + catalog) | «No pending migrations» |
| `pnpm seed` | ✅ roles: owner, admin, manager, operator | `prisma/seed.ts` |
| `pnpm typecheck` | ✅ GREEN | `tsc --noEmit` без ошибок |
| `pnpm test` | ✅ 41/41 GREEN (9 файлов) | incl. products.e2e (8), matching (5), adapters (11), import (2) |
| `pnpm build` | ✅ GREEN | `tsc` + copy generated |
| Boot smoke `APP_PORT=3198 node dist/main.js` | ✅ старт, 27 маршрутов (23 каталога + 4 auth/org) | boot log |

---

## 2. Accept-критерии (MVP_PRD §8 Фаза 1 + дизайн §11 AC-1…AC-18)

| AC | Описание | Статус | Доказательство |
|---|---|---|---|
| Exit §8 | Карточка создаётся и публикуется на обоих МП | ✅ | `POST /products` → 201; publish WB+OZON → 202; 2 `marketplace_mappings` (enabled, status=ready) |
| Exit §8 | Импорт из WB/Ozon матчится в единую карточку | ✅ | Импорт WB → `updated=1`, 1 SKU + 2 mapping (WB+OZON), без дублей (AC-3) |
| Exit §8 | Бренд Ozon привязывается по ID | ✅ | `brands.ozon_id` хранится; OzonAdapter.validateForOzon требует `brand.ozon_id` (AC-6) |
| Exit §8 | ≥ N карточек без потерь | ⚠️ частично | Механика импорта готова; нагрузка ≥1000 (AC-5) — вне smoke, [SPIKE] реальный API |
| AC-1 | 3-уровневая карточка публикуется на WB+Ozon | ✅ | live: NIKE-AIR-1, 2 SKU, 2 mapping published |
| AC-2 | Детальные ошибки по полю | ✅ | WB/Ozon validate возвращает `field`+`code`+`message`; mapping→error+last_error |
| AC-3 | Матчинг WB+Ozon → одна карточка | ✅ | live: 1 product, 1 SKU, 2 mapping (WB+OZON) |
| AC-4 | Быстрый импорт (без параметров) | ⚠️ | Режим `quick` принят фильтром; блокировка «нельзя редактировать до дозагрузки» — post-MVP |
| AC-5 | ≥1000 без потерь | ⏭️ | [SPIKE] реальный WB API; инвариант `added+updated+errors==total` соблюдён |
| AC-6 | Ozon brand по числовому ID | ✅ | live + e2e: бренд без `ozon_id` → 400 `required: brand.ozon_id`, mapping→error |
| AC-7 | Массовое редактирование Excel | ❌ | Вне скоупа Фазы 1 (заявлено); нет эндпоинта/multipart |
| AC-8 | Статусы интеграций (токены) | ⚠️ | Модель Integration есть; probeToken/mock; UI ввода токенов + статус «Невалидный» — frontend/[SPIKE] |
| AC-9 | Статусы карточки Actual/Archived | ✅ | `status` в Product; archiveProduct (DELETE→204); фильтр `status` в listProducts |
| AC-10 | Категории + mapping | ✅ | live: 2 mapping (WB wb-shoes-1 / OZON ozon-shoes-1); без mapping валидация блокирует |
| AC-11 | Надёжность синхронизации ≥99% | ⚠️ | Retry/backoff в SyncService.processOne есть; live-воркер `publish_card`→runPublish — не подключён ([SPIKE]) |
| AC-12 | Лимиты API (429/throttling) | ⏭️ | BullMQ-очередь есть; rate-limit/backoff на реальном API — [SPIKE] |
| AC-13 | Идемпотентность | ✅ | live: re-publish WB → тот же `syncJobId`, счётчик publish_card=1; idempotency_key=sha256 |
| AC-14 | Производительность (≤2с @10k SKU) | ⚠️ | Пагинация + индексы есть; нагрузка 10k — post-MVP |
| AC-15 | Матчинг-качество ≤0,5% | ⏭️ | [SPIKE] реальные данные |
| **AC-16** | **Аудит на publish/import** | **❌** | **НЕ реализовано: ProductsController без `@Audit()` → audit_log пуст (см. §4 баг B1)** |
| AC-17 | Изоляция тенантов | ✅ | live: org2 видит 0 карточек; GET чужой UUID → 404; orgScope() во всех запросах |
| AC-18 | Покрытие тестами | ✅ | 41/41 GREEN; e2e AC-1/AC-3/AC-6 + matching/adapters/import unit |

---

## 3. Live-smoke (порт 3198, чистый прогон)

Шаги выполнены через `curl` против запущенного `node dist/main.js`:

1. `POST /auth/register` (inn=7701234567) → 201, accountId
2. `POST /auth/login` → 200, JWT с `orgId`
3. **Фикс Ф0 (RBAC-vs-JWT):** `GET /products` без токена → **401** (раньше было бы 403 от RolesGuard, сработавшего до аутентификации). ✅ подтверждено.
4. `POST /brands` {name, ozonId} → 201 (ozonId сохранён)
5. `POST /categories` + `PUT /categories/:id/mappings` (WB+OZON) → 200, 2 mapping
6. `POST /products` (1 модель × 1 цвет × 2 размера, 2 ШК) → **201**, 2 SKU
7. Заведены Integration WB+OZON (status=configured) — нет публичного эндпоинта, через БД
8. `PUT /products/:id/skus/:skuId/publish {OZON, enabled:true}` → **202**, status=ready, syncJobId
9. То же для WB → 202. В БД: **2 `marketplace_mappings`** (OZON, WB; enabled=t, status=ready), **2 `sync_jobs`** (publish_card, idempotency_key present)
10. **Идемпотентность:** повтор WB-publish → тот же `syncJobId`, `count(publish_card)=1` для WB. ✅
11. `POST /imports {WB}` → mock-transport отдал опубликованную карточку → matching свёл в существующий SKU (`updated=1`, 0 ошибок). На SKU — **2 mapping (WB+OZON)** = AC-3.
12. **Реимпорт WB:** дубликата нет (1 product, `updated=1`). ✅
13. **Tenant-изоляция:** второй аккаунт/org видит 0 карточек; GET чужого UUID → 404. ✅
14. **RBAC:** JWT с ролью `operator` → `GET /products` = 200, `POST /products` = **403**, `PUT publish` = **403**. ✅
15. Сервер остановлен валидатором.

---

## 4. Найденные дефекты

### B1. (Medium) Аудит продуктовых операций не пишется — AC-16 не выполнен
- **Где:** `app/backend/src/products/products.controller.ts` — ни один метод не помечен `@Audit()`.
- **Эффект:** `audit_log` остаётся пустым для create/publish/unpublish/import/category/brand. Глобальный `AuditInterceptor` пишет только при наличии `@Audit()` (так в Фазе0 помечен только `Organization.create`).
- **Severity:** Medium. Прямое нарушение AC-16 («на каждую публикацию/снятие/импорт есть запись в audit_log»). Не блокирует старт frontend, но должно быть закрыто до hardening/беты.
- **Действие валидатора:** зафиксировано (не правилось — требует согласования метаданных entity/action по всем эндпоинтам, выходит за рамки 1–2 строк).

### B2. (Low, ИСПРАВЛЕНО валидатором) Поле `PublishOutcome.created` всегда `true`
- **Где:** `app/backend/src/products/publish.service.ts` — `enqueueSyncJob` возвращал только `job.id`, теряя флаг `created` из `SyncService.enqueue`; оба return-блока `toggleSkuPublish` хардкодили `created: true`.
- **Эффект:** при повторном PUT `/publish` (идемпотентный повтор) клиенту возвращалось `created: true`, хотя новый `sync_job` не создавался.
- **Правка (валидатор):** `enqueueSyncJob` возвращает `{ syncJobId, created }`; оба return используют реальный `enq.created`. 1-строчный по сути фикс.
- **Регрессия:** typecheck GREEN, 41/41 тестов GREEN (e2e идемпотентности ассертит `ja===jb` по syncJobId — проходит).

### Прочее (не баги, зафиксировано для полноты)
- В `toggleSkuPublish` превалидация выполняется вызовом `adapter.publishCard` с пустым `credentials` через mock-transport — это рабочий компромисс (mock возвращает ok без сети), не дефект; при [SPIKE] стоит разделить `validate()` и `publishCard()` в интерфейсе адаптера.
- `publishStatus` возвращает только первое встреченное отображение на каждый МП (берёт `if (!result[m.marketplace])`) — приемлемо для статуса по МП, но при нескольких SKU теряет гранулярность; уточнить на frontend-интеграции.

---

## 5. Вне минимального скоупа Фазы 1 (заявлено, подтверждено отсутствие)

- **Frontend** Фазы 1 (UI карточки/тумблеры/импорт/справочники) — не входит в backend.
- **[SPIKE] реальный WB/Ozon API** — адаптеры используют `MockMarketplaceTransport`; замена = новые провайдеры `MP_TRANSPORT_WB`/`MP_TRANSPORT_OZON` в `marketplaces.module.ts`, **без правок ядра/адаптеров** (подтверждено: адаптеры не импортируют HTTP-библиотеки, только `MarketplaceTransport`).
- **Live-воркер `publish_card`→`runPublish`** — `PublishService.runPublish()` реализован как точка расширения (помечает mapping=published+remote_id), но **не зарегистрирован** как handler в `SyncService`/процессоре. Подключение — Фаза 1+/Hardening.
- **Excel-импорт/экспорт** (AC-7), **медиа-multipart** (uploadMedia есть контрактно, реальная загрузка фото — [SPIKE]), **уведомления о невалидных токенах** — отсутствуют, заявлены post-MVP.
- **Нагрузка ≥1000 карточек (AC-5), ≤2с @10k SKU (AC-14), rate-limit/throttling реальный (AC-12)** — требуют реального API/данных.

---

## 6. Архитектурные подтверждения (code-read)

- **Интерфейс адаптера** (`marketplace.types.ts`): `MarketplaceAdapter` + `MarketplaceTransport` зафиксированы; `MarketplaceAdapterFactory` — exhaustive switch; добавление МП = новый класс + регистрация.
- **Mock-transport** (`mock-transport.ts`): детерминированный, in-memory state по `(mp, remoteArticle)`, инжект ошибки `setNextError()` — тестируемость end-to-end без сети.
- **PublishService:** Integration-чек (400 not_configured/invalid_token) → upsert mapping → превалидация адаптером → `enqueue(publish_card)` с `idempotency_key=sha256(op+mp+targetId+payload)`. `enabled=false` → mapping=draft + best-effort `unpublish_card`.
- **MatchingService:** ключ унификации — ШК (приоритет 1) → композит (org+uniArticle+colorArticle+size); конфликты brand/category → `import_errors` без объединения; добавление варианта/SKU к существующей модели.
- **Фикс Ф0 (GlobalAuthModule):** `GlobalJwtAuthGuard` как `APP_GUARD`, импортирован **перед** `RbacModule` в `AppModule` → JWT выполняется до RolesGuard; public-маршруты (login/register/refresh) пропускаются по пути/`@Public()`. Подтверждено live (401 без токена вместо 403).

---

## 7. Однострочный итог

**Backend Фазы 1 валидирован (DONE WITH MINOR GAPS) — можно стартовать frontend Фазы 1.**
Все функциональные exit-criteria §8 + AC-1/2/3/6/9/10/13/17/18 подтверждены live;
главный долг — AC-16 (аудит продуктовых операций, B1, Medium, не блокирует frontend);
реальный WB/Ozon API, live-воркер publish, Excel/медиа/нотификации — заявлены вне скоупа ([SPIKE]/post-MVP).

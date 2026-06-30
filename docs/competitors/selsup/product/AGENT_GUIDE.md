# AGENT_GUIDE — техническая документация для ИИ-агентов

> Эта база знаний — реверс-инжиниринг SaaS **SelSup** (сервис для продавцов на
> маркетплейсах WB/Ozon) на основе **419 статей** официальной базы знаний
> `selsup.ru/help`. Цель документа — научить ИИ-агента **быстро находить и
> правильно читать** нужный материал. Машинно-читаемый индекс: `manifest.json`.

## 0. TL;DR для агента
- **Источник истины (сырые факты)** — `corpus/<slug>.md` (419 статей, чистый текст) + `INDEX.md` (оглавление с исходными URL).
- **Анаитика (вторична, сгенерирована ИИ)** — `PRD/MVP_PRD/FEATURE_MAP/DATA_MODEL/INTEGRATIONS/WORKFLOWS/specs/*.md`. Каждый тезис помечен трассировкой `[файл §раздел]` — шли по ней к оригиналу для проверки.
- **Реализация (код)** — `app/backend` (NestJS, 120 тестов) + `app/frontend` (React). Контракты стабильны.
- Никогда не отвечай только по памяти — находи первоисточник в `corpus/` или `specs/` и цитируй с `[трассировкой]`.

---

## 1. Структура базы знаний (`product/`)

```
product/
├── AGENT_GUIDE.md            ← ВЫ ЗДЕСЬ (этот файл)
├── manifest.json             ← машинно-читаемый индекс всех артефактов
├── README.md                 ← точка входа для человека (ПМ)
├── INDEX.md                  ← реестр 419 статей (title | slug | URL | символы)
│
├── corpus/                   ← ИСТОЧНИК ИСТИНЫ: 419 чистых markdown-статей
│   ├── <slug>.md             ← одна статья = один файл (front-matter + текст)
│   └── ... (419 файлов, 4.8 МБ, ~2.6 М символов)
│
├── specs/                    ← 16 спецификаций модулей (по функциональной области)
│   ├── product-cards.md      (Карточки товаров / PIM)
│   ├── stocks-inventory.md   (Склад, остатки, адресное хранение)
│   ├── orders-assembly.md    (Заказы и сборка FBS/FBO/DBS)
│   ├── prices-strategies.md  (Цены, стратегии, акции)
│   ├── integrations-marketplaces.md (Интеграции WB/Ozon)
│   ├── integration-1s-moysklad.md   (1С/МойСклад/СБИС/API)
│   ├── fbo-deliveries.md     (Отгрузки, поставки FBO)
│   ├── marking-labels.md     (Маркировка, Честный Знак, этикетки)
│   ├── import-export.md      (Импорт/экспорт карточек)
│   ├── purchasing-production.md (Закупки, производство, комплекты)
│   ├── analytics-finance.md  (Аналитика, финансы, P&L)
│   ├── ai-modules.md         (AI: стратегии, финдир, фото, видео)
│   ├── automation-tasks.md   (Автоматизация, задания)
│   ├── crm-customers.md      (CRM, конкуренты)
│   ├── onboarding-account.md (Онбординг, аккаунт, тарифы)
│   └── support-misc.md       (Поддержка, служебное)
│
├── design/                   ← dev-ready дизайны фаз (для кодинга)
│   ├── PHASE0_FOUNDATION.md  (Foundation: БД, RBAC, sync-очередь, 14 таблиц)
│   └── PHASE1_PIM_MARKETPLACES.md (PIM + адаптеры WB/Ozon, DDL, REST API)
│
├── PRD.md                    ← полный PRD продукта (широкий, ~160 КБ)
├── MVP_PRD.md                ← MVP-срез (WB+Ozon) + 7-фазный roadmap
├── FEATURE_MAP.md            ← карта 16 модулей (608 возможностей, 190 воркфлоу)
├── DATA_MODEL.md             ← сквозная модель данных и связи
├── INTEGRATIONS.md           ← матрица интеграций (МП/1С/Честный Знак/логистика)
├── WORKFLOWS.md              ← 190 end-to-end бизнес-процессов
├── BUILD_PROGRESS.md         ← статус сборки (7 фаз backend + frontend)
└── VALIDATION_PHASE0..6.md   ← отчёты валидации каждой фазы (тесты/acceptance)
```

## 2. Форматы файлов

### 2.1 `corpus/<slug>.md` — статья базы знаний (ИСТОЧНИК ИСТИНЫ)
```markdown
---
title: 'Заказы FBS в модуле 1С'
slug: 22413
source: https://selsup.ru/help/22413/
chars: 10020
---

# <Title>

<чистый текст статьи: разделы, списки, таблицы; скриншоты как ![](../../out/...)>
```
- **front-matter** (YAML): `title`, `slug` (id статьи/URL-slug), `source` (оригинальный URL), `chars` (длина).
- Текст — чистый, без скриптов/навигации сайта. Изображения — локальные пути к зеркалу `out/selsup.ru/_kage/...`.
- **419 файлов**, имена = slug статьи. Соответствие slug↔title↔URL — в `INDEX.md`.

### 2.2 Аналитические документы (`PRD/specs/...`)
- Markdown с заголовками. **Каждый ключевой тезис помечен трассировкой** `[файл §раздел]`
  (напр. `[product-cards §Назначение]`, `[DATA_MODEL §Обзор п.3]`) — ведёт к источнику.
- **`[SPIKE]`** — пометка неподтверждённого элемента (реальные API/лимиты WB/Ozon), требующего проверки на тестовом кабинете.
- Роли RBAC — lowercase: `owner/admin/manager/operator`. Маркетплейсы — enum `WB|OZON`.

### 2.3 `INDEX.md`
Таблица: `| # | Статья (title) | Символов | Файл (corpus/<slug>.md) |`, ссылка title → исходный URL.
419 строк. Используй для поиска статьи по названию/теме.

## 3. Навигация по задаче (decision tree)

| Задача агента | Куда смотреть (в порядке приоритета) |
|---|---|
| «Как именно SelSup делает X?» (факт/поведение) | `INDEX.md` (найти статью) → `corpus/<slug>.md` (оригинал). Доп.: `specs/<модуль>.md` §раздел. |
| «Спроектировать фичу Y» | `MVP_PRD.md` (скоуп/фазы) → `specs/<модуль>.md` → `design/PHASE*.md` → `app/backend/src/<модуль>/` (реализация). |
| «Модель данных / сущности» | `DATA_MODEL.md` → `app/backend/prisma/schema.prisma` (канон реализации). |
| «Интеграция с WB/Ozon/1С» | `INTEGRATIONS.md` → `specs/integrations-*.md` → `app/backend/src/products/{wb,ozon}.adapter.ts`. |
| «Воркфлоу / end-to-end процесс» | `WORKFLOWS.md` (найти по ключевым словам) → `specs/<модуль>.md §воркфлоу`. |
| «Какой модуль за что отвечает» | `FEATURE_MAP.md` (карта 16 модулей + стат). |
| «Что уже реализовано и как» | `BUILD_PROGRESS.md` (статус фаз) → `VALIDATION_PHASE<N>.md` → `app/`. |
| «REST API эндпоинт» | `VALIDATION_PHASE<N>.md` (списки эндпоинтов по фазам) → `app/backend/src/<модуль>/<модуль>.controller.ts`. |

## 4. Рекомендуемый порядок чтения

**Для агента, отвечающего на вопросы о SelSup (RAG/answer):**
1. `INDEX.md` — найти релевантные статьи по теме.
2. `corpus/<slug>.md` — прочитать оригинал (источник истины).
3. `specs/<модуль>.md` — структурированная выжимка по модулю.
4. Отвечать с трассировкой `[corpus/<slug>.md]` / `[specs/<модуль> §раздел]`.

**Для агента-разработчика (дорабатывать код):**
1. `MVP_PRD.md` §8 (фазы) — понять, какая фаза/модуль.
2. `design/PHASE0_FOUNDATION.md` + `PHASE1_PIM_MARKETPLACES.md` — архитектура/DDL/API.
3. `app/backend/src/<модуль>/` — текущая реализация.
4. `VALIDATION_PHASE<N>.md` — что уже проверено, известные гэпы.

## 5. Query-рецепты (grep)

```bash
# найти статьи по теме (напр. «поставка FBS»)
grep -li 'поставк\|FBS' product/corpus/*.md

# найти сущность/поле в модели данных
grep -n 'reservedStockId\|StockItem' product/DATA_MODEL.md app/backend/prisma/schema.prisma

# найти эндпоинт
grep -rn '@Post\|@Put\|@Get' app/backend/src/<модуль>/

# найти, как адаптер вызывает API МП
grep -n 'transport.request\|submitShipment\|syncStock' app/backend/src/products/wb.adapter.ts

# трассировка: по ссылке [product-cards §Назначение]
sed -n '/## Назначение/,/##/p' product/specs/product-cards.md
```

## 6. Реализация (`app/`) — что может читать агент
- **backend** (`app/backend/src/`): модули `auth, rbac, prisma, crypto, sync, audit, organizations, products, stock, prices, orders, labels, analytics, debug, observability`.
  - **Схема БД (канон)**: `app/backend/prisma/schema.prisma` (Account, Organization, Product/Variant/Sku, StockItem, Price, Order/OrderItem/Supply/Label, MarketplaceOperation, SyncJob, AuditLog, Integration, Brand, Category…).
  - **REST API**: `src/<модуль>/<модуль>.controller.ts` (auth/organizations/products/stock/prices/orders/supplies/labels/analytics/brands/categories + debug/health/metrics).
  - **Адаптеры МП**: `src/products/{wb,ozon}.adapter.ts` + `marketplace.types.ts` (интерфейс), `mock-transport.ts` ([SPIKE] реальный API).
  - **Тесты (контракты поведения)**: `src/**/*.spec.ts` (120 тестов) — показывают, какEndpoints работают end-to-end.
- **frontend** (`app/frontend/src/`): pages (Login, Products, CreateProduct, Import, Refs, Stock, Prices, Orders, Analytics) + `api.ts` (типы + эндпоинты) + `auth.tsx`.

## 7. Конвенции (важно для агента)
- **Маркетплейсы**: `WB` (Wildberries), `OZON` (Ozon). В коде — enum.
- **Схемы работы**: `FBS` (со своего склада), `FBO` (склад МП), `DBS`, `realFBS`, дропшиппинг, КГТ.
- **Роли RBAC**: `owner, admin, manager, operator` (lowercase; разрешения в `prisma/seed.ts`).
- **Трассировка**: `[<файл> §<раздел>]` — ведёт к источнику. `[SPIKE]` — неподтверждено (нужен тестовый кабинет).
- **Единый PIM**: карточка создаётся один раз, публикуется на WB/Ozon «тумблерами» (marketplace_mappings). Модель Модель→Цвет→Размер; 1 SKU = общий остаток для связанных карточек.

## 8. Кейвы/ограничения
- **Аналитика (`PRD/specs/...`) сгенерирована ИИ** — может ошибаться. Сверяй критичные тезисы с `corpus/` (оригинал).
- **`[SPIKE]` элементы** (реальные эндпоинты/лимиты WB/Ozon API) не подтверждены — в коде используется `MockMarketplaceTransport`.
- **Реализация — MVP (только WB+Ozon, FBS)**: другие МП/AI/1С/CRM/FBO-поставки/производство описаны в `specs/` и `PRD`, но не в `app/`.
- Корпус — русскоязычный; ответы агенту тоже лучше давать на русском.

## 9. Машинно-читаемый индекс
`product/manifest.json` — структурированный список всех артефактов (путь, тип, размер, описание, списки модулей/фаз). Агент может парсить его для программного обнаружения ресурсов.

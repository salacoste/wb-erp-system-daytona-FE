# Фаза 1 — PIM-каталог + адаптеры Wildberries и Ozon (dev-ready дизайн)

> Документ техлида/системного архитектора для старта кодинга. Цель — команда
> frontend/backend начинает работу без додумывания: есть схема БД, контракты
> адаптеров, REST API, потоки публикации, бизнес-правила по каждому МП и
> тестируемые acceptance criteria.
>
> **Grounding.** Каждое решение трассируется к артефактам комплекта `product/`
> в формате `[файл §раздел]`. Специфика WB/Ozon API (имена методов, эндпоинты),
> отсутствующая в комплекте (открытый вопрос №1 `[MVP_PRD §10.4]`,
> `[integrations-marketplaces §открытые вопросы 1]`), помечена **[SPIKE]**.
>
> **Скоуп.** Только Фаза 1: ядро PIM + адаптеры WB/Ozon (публикация карточек,
> импорт с матчингом, статусная модель интеграций). Заказы, склад, цены,
> этикетки, маркировка, FBO, аналитика — другие фазы (`[MVP_PRD §8]`), но в
> схеме оставлены точки интеграции (`product_skus` используется складом/ценами/
> заказами; `sync_jobs` — единая очередь для всех обменов).

---

## 1. Цель и скоуп Фазы 1

### 1.1. Что строим (из `[MVP_PRD §8 Фаза 1]`, `[product-cards]`, `[integrations-marketplaces]`)

Модуль PIM-каталога и два маркетплейс-адаптера:

1. **Ядро PIM** — единый внутренний справочник товаров, не зависящий от площадки
   `[product-cards §Назначение]`, `[DATA_MODEL §Обзор п.2]`:
   - 3-уровневая модель **Модель (`products`) → Цвет (`product_variants`) →
     Размер (`product_skus`)** и упрощённая (без вариаций) `[product-cards §cap 6,15]`;
   - служебные параметры + параметры WB/Ozon (3 уровня, приоритет нижнего)
     `[product-cards §cap 15-17]`;
   - медиа (фото drag&drop, главное фото, «значки» МП для выборочной отправки,
     автодобавление белого фона) `[product-cards §cap 34]` (видео/rich —
     упрощённо, см. §9);
   - штрихкоды (автогенерация на размер, пометка использования по МП)
     `[product-cards §cap 59]`;
   - статусы `Actual / Not_Actual / Archived / Deleted` `[product-cards §cap 50-53]`;
   - внутренний каталог категорий с mapping на категории WB/Ozon
     `[product-cards §cap 25-30]`.
2. **Адаптеры WB и Ozon** — аутентификация, публикация карточек (создание/
   редактирование), загрузка медиа, импорт карточек с матчингом, статусы
   настройки интеграций, уведомления о невалидных токенах
   `[integrations-marketplaces §cap 1-6]`, `[MVP_PRD §7.2, §7.3]`.
3. **Механизм «тумблеров» публикации** — переключатели WB/Ozon, переключение +
   «Сохранить» отправляет карточку; для отдельного размера — галочка на размер
   `[product-cards §cap 3,4]`, `[WF-02]`.
4. **Справочники** — бренды (с `ozon_id` — числовой ID, не создаётся по API),
   производители (ИНН — точка интеграции с ЧЗ в post-MVP), категории
   `[product-cards §cap 22-30]`, `[DATA_MODEL §Brand/Manufacturer/Category]`.
5. **Импорт карточек из WB/Ozon** — быстрый (только новые) и обычный (полные
   данные) с автоматическим матчингом по ШК/артикулу `[MVP_PRD FR-P6]`,
   `[import-export §cap 5,8,22]`, WF-1/2.
6. **Массовое редактирование через Excel** (минимум: выгрузка шаблона → правка
   → загрузка с отправкой на МП) `[MVP_PRD FR-P8]`, `[product-cards §cap 43]`.
7. **Единая очередь синхронизации** `sync_jobs` с retry/backoff — ключевой
   риск №1 продукта `[MVP_PRD §1 цель 4, §10.1 риск 1]`, `[DATA_MODEL §6
   Background Task]`.

### 1.2. Что НЕ входит (явные границы)

| Что | Куда | Обоснование |
|---|---|---|
| Заказы, импорт/сборка FBS | Фаза 3 | `[MVP_PRD §8 Фаза 3]`; в Фазе 1 — только карточки |
| Склад FBS, остатки, синхронизация остатков | Фаза 2 | `[MVP_PRD §8 Фаза 2]`; `product_skus` готов как точка привязки `StockItem` |
| Цены, мин. цена, скидка WB целым числом | Фаза 2 | `[MVP_PRD FR-C1-C5]`; цена хранится в карточке (`price_*`), но отправка цен — Фаза 2 |
| Этикетки (заказа/товарные), маркировка, Честный Знак | Фазы 4 / post-MVP | `[MVP_PRD §8 Фаза 4]`, `[MVP_PRD §10.3]`; в схеме — `category.flag_marked`, `tnved`, `gtin` как готовность |
| FBO-поставки на склады МП | post-MVP | `[MVP_PRD §3.2]`; только чтение FBO-остатков — Фаза 2 |
| AI-Формализатор, SEO, фото/видео-AI | post-MVP | `[MVP_PRD §3.2]`; UI-хуки оставляем, логику нет |
| Браузерное расширение, копирование конкурента | post-MVP | `[product-cards §cap 11]` |
| Групповые карточки, конкуренты, rich-контент-редактор | post-MVP | `[product-cards §открытые вопросы 4,5]` |
| Другие МП (Яндекс, МегаМаркет, AliExpress…) | post-MVP | `[MVP_PRD §3.2]`; адаптер-интерфейс расширяем |

### 1.3. Exit criteria Фазы 1 (из `[MVP_PRD §8 Фаза 1]`)

- Карточка создаётся и публикуется на **обоих** МП (WB и Ozon) с детальными
  ошибками по каждому МП `[MVP_PRD FR-P5]`.
- Импорт из WB/Ozon матчится в единую карточку (по ШК/артикулу) `[MVP_PRD FR-P6]`.
- Бренд Ozon привязывается по числовому ID `[MVP_PRD §7.3]`, `[product-cards §cap 22]`.
- ≥ N карточек импортируются без потерь (цель N = 1000 при быстром импорте;
  учитывается суточный лимит WB 1000 новых/день `[product-cards §бизправила 15]`).
- Массовое редактирование через Excel выгружает/загружает/отправляет карточки.
- Подробные тестируемые критерии — раздел 11.

---

## 2. Архитектурный обзор

### 2.1. Принципы

1. **Ядро PIM не зависит от площадки.** Карточка — это внутренний агрегат
   (`products` + `product_variants` + `product_skus`), хранящий «канонические»
   данные. Знание о WB/Ozon изолировано в адаптерах и в таблице «тумблеров»
   `marketplace_mappings` `[product-cards §Назначение]`, `[DATA_MODEL §Обзор п.2]`.
2. **Паттерн адаптеров маркетплейсов.** Общий интерфейс `MarketplaceAdapter`
   (§5); конкретные `WildberriesAdapter`, `OzonAdapter`. Ядро PIM и очередь
   `sync_jobs` работают с интерфейсом, а не с конкретным МП. Добавление нового
   МП = новый класс + регистрация в фабрике, без правок ядра `[MVP_PRD §11]`.
3. **Единая очередь синхронизации** `sync_jobs` — все обмены с МП (публикация,
   импорт, в будущем — остатки/цены/заказы) идут через неё с retry/backoff.
   Это митигация риска №1 (`[MVP_PRD §1, §10.1]`). Очередь per-tenant
   (изолирована по `organization_id`), с приоритетами и политикой throttling
   под лимиты МП `[MVP_PRD §10.1 риск 1]`.
4. **«Тумблеры» публикации — декларативное состояние.** Переключатель WB/Ozon
   на SKU — это не немедленный вызов API, а установка целевого состояния в
   `marketplace_mappings` (`enabled=true`) и создание `sync_job(op=publish)`.
   Очередь приводит фактическое состояние МП в соответствие с целевым
   `[product-cards §cap 3]`, `[WF-02]`.
5. **Трансляция параметров в формат МП** — отдельный слой `MpFieldTranslator`,
   читающий каноническую карточку + параметры МП и формирующий payload
   конкретного МП `[product-cards §Назначение]` («SelSup берёт на себя
   трансляцию»).
6. **Идемпотентность** — на уровне `sync_jobs.idempotency_key` (см. §7) и
   матчинга по `(organization_id, unification_article, color, size)` и/или
   `barcode` `[DATA_MODEL §примечания 5,15]`.

### 2.2. Компоненты

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Frontend (SPA, ru)                             │
│  Карточки | Каталог(тумблеры) | Импорт-визард | Маппинг категорий     │
│  Интеграции(WB/Ozon статусы) | Журнал ошибок импорта | Excel-массовое │
└───────────────┬──────────────────────────────────────────────────────┘
                │ REST API (§6)
┌───────────────▼──────────────────────────────────────────────────────┐
│                          API Gateway / BFF                             │
│   authN (JWT) · RBAC · tenant-resolver (account_id из токена)         │
└───────────────┬──────────────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────────────┐
│                     Application Services (core)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ CatalogSvc  │  │ ImportSvc    │  │ PublishSvc   │  │ RefSvc     │ │
│  │ CRUD карточ │  │ WB/Ozon import│ │ оркестрация  │  │ бренды/кат│ │
│  │ + валидация │  │ + матчинг    │  │ тумблеров    │  │ производителя│
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └────────────┘ │
│         │                │                  │                          │
│         └────────────────┼──────────────────┘                          │
│                          │                                           │
│          ┌───────────────▼────────────────┐  ┌─────────────────────┐  │
│          │   MpFieldTranslator            │  │  MatchingService     │  │
│          │   канон→payload WB/Ozon        │  │  ключ=(article+цвет+ │  │
│          │   (обяз. поля, трансляция)     │  │  размер)/ШК, дедуп   │  │
│          └───────────────┬────────────────┘  └─────────────────────┘  │
└──────────────────────────┼───────────────────────────────────────────┘
                           │ создаёт/читает sync_jobs
┌──────────────────────────▼───────────────────────────────────────────┐
│              Sync Orchestrator (воркеры очереди sync_jobs)            │
│   pull sync_jobs (status=queued, by priority, per-org) →             │
│   retry+backoff (429/throttle) → update status/remote_id/audit       │
│   polymorphic dispatch: MarketplaceAdapter.publishCard(...)          │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ общий интерфейс
        ┌──────────────────┼──────────────────────┐
┌───────▼────────┐  ┌──────▼────────┐  ┌──────────▼─────────┐
│ Marketplace    │  │ Wildberries   │  │ Ozon               │
│ Adapter (iface)│  │ Adapter       │  │ Adapter            │
│                │  │ - auth(token) │  │ - auth(client,key) │
│ authenticate   │  │ - /cards CRUD │  │ - /v1/product/*    │
│ publishCard    │  │ - media upl   │  │ - /v1/product/list │
│ updateCard     │  │ - card/list   │  │ - /v1/category/*   │
│ fetchCards     │  │ - lim 1000/дн │  │ - brand по ID      │
│ getStatus      │  │   новых       │  │ - заказ 1 раз*     │
│ uploadMedia    │  │               │  │   (*Фаза 3)        │
└────────────────┘  └───────────────┘  └────────────────────┘
        │                  │                     │
        └──────────────────┴─────────────────────┘
                           │ HTTPS (retry/backoff, rate-limit tokens)
                  ┌────────▼─────────┐
                  │  WB API / Ozon API │
                  └──────────────────┘

PostgreSQL (каталог, тумблеры, sync_jobs, audit) · Object Storage (медиа)
```

### 2.3. Потоки данных (кратко)

- **Создание/публикация (Journey B):** Frontend → `POST /products` (сохраняет
  карточку) → пользователь включает тумблер WB → `POST /products/{id}/publish`
  {mp: wb} → PublishSvc создаёт `sync_jobs(op=publish, mp=wb, target_sku_id)`
  → Sync Orchestrator забирает, MpFieldTranslator строит payload, WBAdapter
  публикует → результат (`remote_id`, статус, ошибка) пишется в
  `marketplace_mappings` + `audit_log` `[WF-02]`.
- **Импорт (Journey A/B альтернатива):** Frontend →
  `POST /imports {source: wb, mode: quick|full}` → ImportSvc создаёт
  `sync_jobs(op=import, mp=wb)` → воркер вызывает `WBAdapter.fetchCards()` →
  MatchingService сводит с существующими по `(article+цвет+размер)`/ШК →
  upsert карточек + `marketplace_mappings(remote_id)` → ошибки в
  `import_errors` `[MVP_PRD Journey A/B]`, `[import-export WF-1/2]`.
- **Статус интеграции/невалидный токен:** адаптер при `401/403` от МП →
  `integrations.status='invalid_token'` + запись в `notifications` → Frontend
  показывает баннер «Перейти к настройкам» `[integrations-marketplaces §cap 4]`,
  `[MVP_PRD FR-I3]`.

---

## 3. Модель данных / схема БД каталога

PostgreSQL 15+. Multi-tenant: `organization_id` (→ `account_id`) на таблицах
каталога `[DATA_MODEL §примечания 1]`. `account_id` денормализован туда же для
индексации. JSONB — для вариативных параметров МП `[DATA_MODEL §примечания 2]`.

### 3.1. Перечень таблиц Фазы 1

| Таблица | Назначение | Источник |
|---|---|---|
| `organizations` | Tenant-контейнер (юрлицо/ИП) + тумблеры синхр. | `[DATA_MODEL §Organization]`, `[MVP_PRD §6]` |
| `integrations` | Подключение WB/Ozon: учётные данные (AES-256), статус, scheme | `[DATA_MODEL §Integration]`, `[FR-I1,I2]` |
| `notifications` | Уведомления (невалидный токен и др.) | `[DATA_MODEL §InvalidTokenNotification]` |
| `products` | Карточка-модель (верхний уровень PIM) | `[DATA_MODEL §Product]`, `[product-cards §сущность Карточка]` |
| `product_variants` | Цвет (вариация уровня цвета) | `[DATA_MODEL §ProductColor]` |
| `product_skus` | Размер = конечный SKU (учёт остатков) | `[DATA_MODEL §ProductSize]`, `[DATA_MODEL §Sku]` |
| `product_media` | Фото/видео/rich, привязка к цвету, «значки» МП | `[DATA_MODEL §Media]` |
| `product_attributes` | Параметры 3 уровней (модель/цвет/SKU) + параметры МП | `[DATA_MODEL §Parameter/ParameterValue]` |
| `barcodes` | Штрихкоды (несколько на SKU, пометка МП, gtin) | `[DATA_MODEL §Barcode]` |
| `categories` | Внутренний каталог категорий + ТНВЭД/флаги | `[DATA_MODEL §Category]` |
| `marketplace_category_mappings` | Связь категории SelSup↔категория WB/Ozon | `[DATA_MODEL §CategoryMarketplaceMapping]` |
| `brands` | Бренды, `ozon_id` (числовой), лого | `[DATA_MODEL §Brand]`, `[product-cards §cap 22]` |
| `manufacturers` | Производители (ИНН, страна) | `[DATA_MODEL §Manufacturer]` |
| `marketplace_mappings` | **Тумблеры** SKU→{WB,Ozon}: enabled, status, remote_id, last_sync | новый (объединяет `MarketplaceLink` + состояние) |
| `sync_jobs` | Единая очередь синхронизации (publish/import/…) | `[DATA_MODEL §BackgroundTask]`, `[MVP_PRD §10.1]` |
| `import_jobs` | Задача импорта (WB/Ozon/Excel) + статистика | `[DATA_MODEL §ImportExportJob]` |
| `import_errors` | Журнал «Ошибки импорта» | `[DATA_MODEL §ImportErrorLog]` |
| `audit_log` | Аудит «кто/когда/что» | `[DATA_MODEL §AuditLog]`, `[FR-O5]` |

> `users`, `roles`, `accounts`, `sessions` — Фаза 0 (созданы ранее). Здесь на
> них ссылаемся. `stock_items`, `prices`, `orders` — Фазы 2/3, но `product_skus`
> проектируется сейчас как их точка привязки.

### 3.2. SQL DDL (ключевые таблицы)

```sql
-- ===== TENANCY & ИНТЕГРАЦИИ =====

CREATE TABLE organizations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    inn             text NOT NULL,
    name            text NOT NULL,
    legal_address   text,
    bank_requisites jsonb NOT NULL DEFAULT '{}'::jsonb,
    tax_system      text NOT NULL CHECK (tax_system IN ('USN_Income','USN_Income_Expenses','OSNO')),
    -- тумблеры организации [integrations §settings, FR-I4]
    flags           jsonb NOT NULL DEFAULT '{
        "sync_stocks": false,
        "auto_import_orders": false
    }'::jsonb,
    default_brand_id        uuid,        -- -> brands(id)
    default_manufacturer_id uuid,        -- -> manufacturers(id)
    status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','archived','deleted')),
    deleted_at      timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (account_id, inn)
);
CREATE INDEX idx_organizations_account ON organizations(account_id) WHERE deleted_at IS NULL;

-- учётные данные хранятся ЗАШИФРОВАННЫМИ (AES-256) [FR-I1, DATA_MODEL §примечания 14]
-- credentials_enc = AES-256-encrypt(jsonb{api_token | client_id+api_key})
CREATE TABLE integrations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    service         text NOT NULL CHECK (service IN ('wildberries','ozon')),
    status          text NOT NULL DEFAULT 'not_configured'
                    CHECK (status IN ('not_configured','configured','partially_configured','invalid_token')),
    credentials_enc bytea,                 -- зашифрованный jsonb
    credentials_kid text,                  -- id ключа KMS для ротации
    scheme          text CHECK (scheme IN ('FBS','FBO')),  -- MVP: FBS
    -- последнее подтверждение валидности токена (probe-запрос к МП)
    token_checked_at timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    -- правило "1 организация = 1 ключ API МП" [FR-O3, INTEGRATIONS §принципы]
    UNIQUE (organization_id, service)
);

CREATE TABLE notifications (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    service         text NOT NULL,          -- 'wildberries' | 'ozon'
    type            text NOT NULL,          -- 'invalid_token' | ...
    is_read         boolean NOT NULL DEFAULT false,
    payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_unread ON notifications(account_id, is_read, created_at DESC);


-- ===== СПРАВОЧНИКИ (per-account) =====

CREATE TABLE brands (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id  uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name        text NOT NULL,
    ozon_name   text,                       -- "Название в Ozon"
    ozon_id     text,                       -- числовой external_id [product-cards §cap 22]
    logo_media_id uuid,                     -- -> product_media(id)
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (account_id, name)
);

CREATE TABLE manufacturers (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id         uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name               text NOT NULL,
    inn                text,                -- обязателен для ЧЗ (post-MVP) [DATA_MODEL §Manufacturer]
    production_country text NOT NULL DEFAULT 'Россия',
    requisites         jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at         timestamptz NOT NULL DEFAULT now(),
    UNIQUE (account_id, name)
);

CREATE TABLE categories (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id             uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name                   text NOT NULL,
    parent_id              uuid REFERENCES categories(id) ON DELETE RESTRICT,  -- иерархия
    tnved                  text,                -- для ЧЗ/маркировки (готовность) [product-cards §cap 30]
    category_type          text,                -- "Тип категории"
    ozon_commission        numeric(5,2),
    dimensions             jsonb,               -- {length,width,height} по умолчанию для категории
    weight                 numeric(10,3),
    flag_marked            boolean NOT NULL DEFAULT false,  -- авто по ТНВЭД [product-cards §cap 30]
    flag_split_color_size  boolean NOT NULL DEFAULT false,  -- разделение по цвету/размеру [§cap 30]
    name_template          text,                -- {цвет},{размер} [§cap 21]
    flag_remove_from_fbs   boolean NOT NULL DEFAULT false,
    default_params         jsonb NOT NULL DEFAULT '{}'::jsonb,
    status                 text NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','archived')),
    created_at             timestamptz NOT NULL DEFAULT now(),
    UNIQUE (account_id, name, parent_id)
);
CREATE INDEX idx_categories_account ON categories(account_id) WHERE status='active';

CREATE TABLE marketplace_category_mappings (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id           uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    marketplace           text NOT NULL CHECK (marketplace IN ('wildberries','ozon')),
    external_category_id  text NOT NULL,
    external_category_name text,
    matched_by            text NOT NULL DEFAULT 'manual'
                          CHECK (matched_by IN ('ai','manual','product_card')),  -- [§cap 26]
    created_at            timestamptz NOT NULL DEFAULT now(),
    -- одна внутренняя категория → ≤1 категория на каждый МП
    UNIQUE (category_id, marketplace)
);


-- ===== ЯДРО PIM =====

CREATE TABLE products (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    account_id              uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    unification_article     text NOT NULL,   -- "Артикул для объединения" [DATA_MODEL §Product]
    name                    text NOT NULL,
    label_name              text,            -- "Название для этикетки"
    brand_id                uuid NOT NULL REFERENCES brands(id),           -- обязательно [§бизправила 3]
    type                    text NOT NULL DEFAULT 'Product'
                            CHECK (type IN ('Product','Digital','Kit','Service')),
    manufacturer_id         uuid REFERENCES manufacturers(id),
    production_country      text NOT NULL,                              -- обязательно [§бизправила 4]
    category_id             uuid NOT NULL REFERENCES categories(id),     -- обязательно [§бизправила 7]
    price_with_discount     numeric(12,2) NOT NULL CHECK (price_with_discount >= 0),  -- обязательно [§бизправила 5]
    price_without_discount  numeric(12,2) NOT NULL CHECK (price_without_discount >= 0),
    vat_rate                numeric(5,2) DEFAULT 0,
    purchase_price          numeric(12,2),     -- точка интеграции Фазы 2 (FIFO упрощённый)
    extra_costs             numeric(12,2) DEFAULT 0,
    cost_price              numeric(12,2) GENERATED ALWAYS AS (COALESCE(purchase_price,0) + COALESCE(extra_costs,0)) STORED,
    description             text,
    -- габариты общие для всех МП; фиксируются при первом импорте [§бизправила 9, DATA_MODEL §примечания 26]
    dimensions              jsonb,            -- {length,width,height}
    weight                  numeric(10,3) NOT NULL,                       -- обязательно [§бизправила 6]
    status                  text NOT NULL DEFAULT 'Actual'
                            CHECK (status IN ('Actual','Not_Actual','Archived','Deleted')),  -- [§cap 50-53]
    photo_updated_at        timestamptz,
    created_by              uuid,             -- -> users(id)
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),
    -- уникальность артикула модели в рамках организации
    UNIQUE (organization_id, unification_article)
);
CREATE INDEX idx_products_org_status ON products(organization_id, status);
CREATE INDEX idx_products_account ON products(account_id);

-- Цвет = вариация уровня цвета [DATA_MODEL §ProductColor]
CREATE TABLE product_variants (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color_article   text NOT NULL,       -- "Артикул цвета"
    color_name      text,                -- из справочника/значение
    description     text,                -- параметры уровня цвета (для Ozon) [§cap 15]
    status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','archived','deleted')),
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (product_id, color_article)
);

-- Размер = КОНЕЧНЫЙ SKU (учёт остатков) [DATA_MODEL §ProductSize + §Sku]
-- Один product_skus = один SKU для склада/цен/заказов (Фазы 2/3 привяжутся сюда).
CREATE TABLE product_skus (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id          uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    product_id          uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,  -- денормализация для запросов
    organization_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    account_id          uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    size                text NOT NULL,
    russian_size        text,            -- "Российский размер" (WB) [§сущность Размер]
    manufacturer_size   text,
    wb_size             text,
    size_label          text,            -- ручное название (приоритет над шаблоном) [§бизправила 11]
    -- sku_value: стабильный внутренний идентификатор остатков [DATA_MODEL §Sku]
    sku_value           text NOT NULL,
    status              text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','archived','deleted')),
    created_at          timestamptz NOT NULL DEFAULT now(),
    -- уникальность "артикул+цвет+размер" в организации [import-export §бизправила]
    UNIQUE (organization_id, sku_value),
    UNIQUE (variant_id, size)
);
CREATE INDEX idx_product_skus_org ON product_skus(organization_id) WHERE status='active';
CREATE INDEX idx_product_skus_product ON product_skus(product_id);

-- Медиа [DATA_MODEL §Media]
CREATE TABLE product_media (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id       uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    product_id       uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id       uuid REFERENCES product_variants(id) ON DELETE SET NULL,  -- привязка к цвету [§cap 34]
    type             text NOT NULL DEFAULT 'photo'
                     CHECK (type IN ('photo','video','rich')),
    source           text NOT NULL DEFAULT 'uploaded'
                     CHECK (source IN ('uploaded','marketplace_url','external_url')),
    storage_key      text NOT NULL,       -- ключ в Object Storage / URL
    format           text,                -- jpeg|png|mp4|mov
    angle            text,                -- ракурс
    marketplace_marks jsonb NOT NULL DEFAULT '[]'::jsonb,  -- "значки" МП ['wb','ozon'] [§cap 34]
    is_main          boolean NOT NULL DEFAULT false,
    position         integer NOT NULL DEFAULT 0,
    rich_content_json jsonb,              -- rich-контент Ozon (post-MVP углублённо) [§cap 42]
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_media_product ON product_media(product_id, position);
-- ровно одно главное фото на товар/цвет (partial unique)
CREATE UNIQUE INDEX uq_media_main_per_variant
    ON product_media(product_id, COALESCE(variant_id,'00000000-0000-0000-0000-000000000000'))
    WHERE is_main = true;

-- Штрихкоды [DATA_MODEL §Barcode]
CREATE TABLE barcodes (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id          uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    product_sku_id      uuid NOT NULL REFERENCES product_skus(id) ON DELETE CASCADE,
    value               text NOT NULL,
    gtin                text,            -- для ЧЗ (post-MVP) [import-export §сущность GTIN]
    generation_source   text NOT NULL DEFAULT 'Marketplace'
                        CHECK (generation_source IN ('HonestSign','GS1RUS','Marketplace','Range','Manual')),
    marketplace_usage   jsonb NOT NULL DEFAULT '[]'::jsonb,  -- ['wb','ozon']
    created_at          timestamptz NOT NULL DEFAULT now()
);
-- уникальность ШК в рамках организации [DATA_MODEL §примечания 5, import-export §бизправила]
CREATE UNIQUE INDEX uq_barcode_value_per_org
    ON barcodes(account_id, value);  -- NOTE: ослабить до (account_id, value) если включена
                                      -- глобальная настройка allow_duplicate_across_orgs [import-export §cap 24]
CREATE INDEX idx_barcodes_sku ON barcodes(product_sku_id);

-- Параметры 3 уровней (модель/цвет/SKU) + параметры WB/Ozon [DATA_MODEL §Parameter/ParameterValue]
CREATE TABLE product_attributes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    entity_type     text NOT NULL CHECK (entity_type IN ('product','variant','sku','category')),
    entity_id       uuid NOT NULL,           -- FK-полиморфизм (product_id/variant_id/sku_id/category_id)
    -- параметр: либо служебный SelSup (dict-namespace 'selsup'), либо параметр МП ('wb'|'ozon')
    namespace       text NOT NULL CHECK (namespace IN ('selsup','wildberries','ozon')),
    param_code      text NOT NULL,           -- код параметра в рамках namespace
    value           jsonb NOT NULL,          -- значение (строка/число/массив/enum)
    -- видимость «глазиком» [§cap 17]
    is_visible      boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (entity_type, entity_id, namespace, param_code)
);
CREATE INDEX idx_attrs_entity ON product_attributes(entity_type, entity_id);
CREATE INDEX idx_attrs_mp ON product_attributes(account_id, namespace, param_code);


-- ===== ТУМБЛЕРЫ ПУБЛИКАЦИИ (ключевая таблица Фазы 1) =====
-- Объединяет: целевое состояние (enabled), фактический статус публикации,
-- remote_id (связь с МП) и last_sync. [product-cards §cap 3], [DATA_MODEL §MarketplaceLink]
CREATE TABLE marketplace_mappings (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_sku_id    uuid NOT NULL REFERENCES product_skus(id) ON DELETE CASCADE,
    organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    marketplace       text NOT NULL CHECK (marketplace IN ('wildberries','ozon')),

    -- целевое состояние ("тумблер")
    enabled           boolean NOT NULL DEFAULT false,

    -- фактический статус публикации на этом МП [§cap 50, FR-P5]
    status            text NOT NULL DEFAULT 'draft'
                      CHECK (status IN (
                          'draft',          -- черновик (тумблер выключен)
                          'ready',          -- готов к публикации (валидация ОК, ждёт отправки)
                          'publishing',     -- sync_job в работе
                          'published',      -- успешно на МП
                          'error',          -- ошибка (детали в last_error)
                          'archived'        -- снят с МП/в архиве
                      )),
    remote_id         text,                 -- ID карточки на МП (WB imt/nm; Ozon product_id)
    remote_article    text,                 -- артикул на МП (для матчинга) [DATA_MODEL §MarketplaceLink]
    remote_sku_id     text,                 -- ID вариации на МП (Ozon sku/fbo sku; WB nomenclature)
    last_error        jsonb,                -- {code, message, field?, raw} детальная ошибка [§cap 61]
    last_synced_at    timestamptz,
    last_sync_job_id  uuid,                 -- -> sync_jobs(id)
    published_at      timestamptz,

    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    -- ИНВАРИАНТ: ≤1 mapping на каждый МП для одного SKU [DATA_MODEL §примечания 5]
    UNIQUE (product_sku_id, marketplace)
);
CREATE INDEX idx_mpmap_status ON marketplace_mappings(organization_id, marketplace, status);
CREATE INDEX idx_mpmap_enabled_pending ON marketplace_mappings(organization_id, marketplace)
    WHERE enabled = true AND status IN ('draft','ready','error');


-- ===== ЕДИНАЯ ОЧЕРЕДЬ СИНХРОНИЗАЦИИ (риск №1) [DATA_MODEL §BackgroundTask, MVP_PRD §10.1] =====
CREATE TABLE sync_jobs (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id        uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    marketplace       text NOT NULL CHECK (marketplace IN ('wildberries','ozon')),

    op                text NOT NULL CHECK (op IN (
                          'publish_card',     -- создать/обновить карточку на МП
                          'unpublish_card',   -- снять (насколько позволяет МП) [§бизправила 1]
                          'upload_media',     -- загрузить медиа на МП
                          'import_cards',     -- импорт карточек из МП
                          'update_attrs'      -- обновление параметров только на МП [§cap 45]
                          -- Фазы 2/3 добавят: update_stock, update_price, import_orders
                      )),
    -- цель операции (полиморфно): SKU/медиа/импорт-задача
    target_type       text NOT NULL CHECK (target_type IN ('product_sku','product','media','import_job')),
    target_id         uuid NOT NULL,

    -- ИДЕМПОТЕНТНОСТЬ: один и тот же payload не выполняется дважды [DATA_MODEL §примечания 15]
    idempotency_key   text NOT NULL,        -- напр. sha256(op+target+payload_hash+mp)
    payload           jsonb NOT NULL DEFAULT '{}'::jsonb,  -- данные для адаптера

    status            text NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued','running','completed','failed','cancelled')),
    priority          integer NOT NULL DEFAULT 5,   -- 1(высш)…10; публикация < импорт
    attempts          integer NOT NULL DEFAULT 0,
    max_attempts      integer NOT NULL DEFAULT 5,
    last_error        jsonb,                -- {http_status, code, message, retry_after?}
    next_attempt_at   timestamptz NOT NULL DEFAULT now(),  -- для backoff
    started_at        timestamptz,
    finished_at       timestamptz,
    initiated_by      uuid,                 -- -> users(id); NULL = system/robot
    created_at        timestamptz NOT NULL DEFAULT now(),

    UNIQUE (idempotency_key)                -- защита от дублей
);
-- воркер: SELECT ... WHERE status='queued' AND next_attempt_at<=now()
--         ORDER BY priority, created_at FOR UPDATE SKIP LOCKED LIMIT N
CREATE INDEX idx_syncjobs_dispatch ON sync_jobs(status, next_attempt_at, priority, created_at);
CREATE INDEX idx_syncjobs_org ON sync_jobs(organization_id, marketplace, status);


-- ===== ИМПОРТ + ОШИБКИ + АУДИТ =====

CREATE TABLE import_jobs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source          text NOT NULL CHECK (source IN ('wildberries','ozon','excel')),
    mode            text NOT NULL DEFAULT 'full'
                    CHECK (mode IN ('quick','full')),     -- [import-export §cap 5]
    params          jsonb NOT NULL DEFAULT '{}'::jsonb,   -- {brand_filter?, visible_only?, warehouse_id?}
    status          text NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued','running','completed','failed')),
    stats           jsonb NOT NULL DEFAULT '{}'::jsonb,   -- {added, updated, errors, total}
    sync_job_id     uuid,                   -- -> sync_jobs(id)
    created_at      timestamptz NOT NULL DEFAULT now(),
    finished_at     timestamptz
);

CREATE TABLE import_errors (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    import_job_id   uuid NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
    account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    product_identifier text NOT NULL,        -- артикул/ШК/raw id
    reason          text NOT NULL,           -- 'duplicate_article','duplicate_barcode','product_not_found','api_error', ...
    raw_payload     jsonb,                   -- детальный контекст для отладки
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_import_errors_job ON import_errors(import_job_id);

CREATE TABLE audit_log (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id         uuid,                    -- -> users(id); NULL = system
    entity_type     text NOT NULL,           -- 'product' | 'marketplace_mapping' | 'integration' | ...
    entity_id       uuid,
    action          text NOT NULL,           -- 'create' | 'update' | 'publish' | 'import' | ...
    delta           jsonb,                   -- diff (старое/новое)
    ts              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON audit_log(account_id, entity_type, entity_id, ts DESC);
```

### 3.3. Связи и инварианты

- `organizations 1—N products 1—N product_variants 1—N product_skus`
  `[DATA_MODEL §иерархия товара]`.
- `product_skus 1—1 marketplace_mappings` per маркетплейс: `UNIQUE(product_sku_id, marketplace)`
  → **1 SKU → ≤1 mapping на каждый МП** `[DATA_MODEL §примечания 5]`.
- `barcodes`: уникальность `(account_id, value)`; флаг
  `allow_duplicate_barcodes_across_orgs` управляет ослаблением до
  `(account_id, organization_id, value)` `[import-export §cap 24, DATA_MODEL §примечания 5]`.
- `categories 1—N marketplace_category_mappings`, `UNIQUE(category_id, marketplace)`
  → одна внутренняя категория → ≤1 категория на каждый МП `[§cap 26]`.
- `sync_jobs.idempotency_key` UNIQUE → повторное создание той же публикации не
  порождает дубль задачи `[DATA_MODEL §примечания 15]`.
- `cost_price` — generated (`purchase_price + extra_costs`) `[product-cards
  §сущность Product]`.
- `integrations UNIQUE(organization_id, service)` → правило
  «1 организация = 1 ключ API МП» `[FR-O3]`.
- **Точки интеграции с будущими фазами:** `product_skus.id` ← `stock_items`
  (Фаза 2), `prices` (Фаза 2), `order_items` (Фаза 3); `sync_jobs.op` —
  расширяемое множество; `categories.flag_marked`+`tnved`+`barcodes.gtin` —
  готовность к Честному Знаку (post-MVP) `[MVP_PRD §10.3]`.

---

## 4. Алгоритм матчинга/унификации

### 4.1. Постановка

Один физический товар селлер продаёт и на WB, и на Ozon. Внутри системы он
должен быть **одной** сущностью: `products` (модель) → `product_variants`
(цвет) → `product_skus` (размер = SKU). Один SKU = один товар на нескольких МП
= 1 единица учёта `[DATA_MODEL §Обзор п.3]`, `[import-export §cap 7,8]`.

**Ключ унификации** (в порядке убывания силы) `[DATA_MODEL §примечания 5-6]`,
`[import-export §бизправила]`:
1. **Штрихкод** (`barcodes.value`) — первичный ключ матчинга; при совпадении ШК
   товары считаются одним SKU `[import-export §бизправила, "Матчинг приоритет"]`.
2. **`(organization_id, unification_article, color_article, size)`** —
   композитный ключ, если ШК отсутствует/не совпал `[DATA_MODEL §примечания 5]`.

> Артикул объединения `unification_article` формируется при импорте из
> артикула МП по правилам, специфичным для площадки: WB — IMT (артикул модели),
> «Артикул WB» — цвет; Ozon — параметр «Объединять на одной карточке» → артикул
> модели, цвет/размер извлекаются из параметров `[import-export §сущности,
> §интеграции Ozon]`.

### 4.2. Разрешение конфликтов при импорте с двух МП

Правила из `[import-export §бизправила]` и `[DATA_MODEL §примечания 6]`:

- **Приоритет матчинга:** сначала по ШК, затем по артикулу МП; при нахождении —
  обновляем связь (`marketplace_mappings.remote_id`), **не** создаём дубль.
- **Конфликты идентификаторов блокируют объединение:** если ШК совпадает, но
  `brand_id`/`category_id` различны (разные непустые значения) → запись в
  `import_errors` (reason=`match_conflict`), создание отдельной карточки,
  ручное объединение через UI merge (post-MVP тулз — `[MVP_PRD §6 Фаза 6]`).
- **Внутренние параметры SelSup (Название, Описание) при импорте автоматически
  НЕ обновляются** — только поля маркетплейсов (`product_attributes` с
  namespace=wb/ozon) `[import-export §бизправила]`.
- **Категория фиксируется при первом создании** и не меняется при последующих
  импортах `[product-cards §бизправила 8]`.
- **Габариты фиксируются при первом импорте**, обновляются только по тумблеру
  «обновлять габариты» `[product-cards §бизправила 9]`.

### 4.3. Псевдокод матчинга (на стороне ImportSvc при импорте карточки с МП)

```text
function ingestRemoteCard(org, mp, remoteCard):
    # 1. Нормализовать ключи из remoteCard
    uniArticle  = deriveUnificationArticle(mp, remoteCard)   # WB: imt; Ozon: "объединять на карточке"
    colorArticle= deriveColorArticle(mp, remoteCard)         # WB: артикул цвета; Ozon: параметр "Цвет"
    size        = deriveSize(mp, remoteCard)                 # при отсутствии -> uniArticle [import-export §бизправила]
    barcode     = normalize(remoteCard.barcode)              # EAN-13

    # 2. Поиск существующего SKU по ШК (приоритет) [import-export §бизправила]
    sku = null
    if barcode present:
        b = SELECT * FROM barcodes WHERE account_id=org.account_id AND value=barcode LIMIT 1
        if b exists:
            sku = SELECT * FROM product_skus WHERE id = b.product_sku_id
            # проверка конфликта [DATA_MODEL §примечания 6]
            if sku.unification_article != uniArticle OR sku.variant.color_article != colorArticle:
                # мягкий конфликт — разные ключи при том же ШК -> journal, не блокируем, но flagged
                insert import_errors(reason='barcode_key_mismatch', ...)

    # 3. Если не найден по ШК — поиск по композитному ключу
    if sku is null:
        sku = SELECT ps.* FROM product_skus ps
              JOIN product_variants pv ON pv.id = ps.variant_id
              JOIN products p ON p.id = pv.product_id
              WHERE ps.organization_id = org.id
                AND p.unification_article = uniArticle
                AND pv.color_article = colorArticle
                AND ps.size = size
              LIMIT 1

    # 4. Конфликт-резолв: brand/category [import-export §бизправила, DATA_MODEL §6]
    if sku is null:
        # проверим, нет ли конфликта по ШК с другой карточкой с иным brand/category
        if barcode present AND exists Barcode with different brand/category:
            insert import_errors(reason='match_conflict', product_identifier=barcode,
                                 raw_payload={mp, remoteCard})
            return  # НЕ объединяем; ждём ручного merge
        # создать новую карточку целиком (модель→цвет→размер)
        product  = createProduct(org, uniArticle, remoteCard)   # category фиксируется здесь [§бизправила 8]
        variant  = createVariant(product, colorArticle, remoteCard)
        sku      = createSku(variant, size, skuValue=genSkuValue(org))
        if barcode present: insertBarcode(sku, barcode, source=mp)
    else:
        # SKU существует — обновить связь и параметры МП (НЕ внутренние) [import-export §бизправила]
        updateProductSkuAttrs(sku, remoteCard, namespace=mp)   # только product_attributes namespace=mp

    # 5. Upsert тумблера-связи с МП [DATA_MODEL §MarketplaceLink]
    upsert marketplace_mappings(
        product_sku_id = sku.id, marketplace = mp,
        remote_id      = remoteCard.id,
        remote_article = remoteCard.article,
        remote_sku_id  = remoteCard.mpSkuId,
        # НЕ выставляем enabled=true автоматически — связь есть, но "тумблер" ставит пользователь.
        # Для импортированных карточек: status='published' (они уже на МП), enabled по умолчанию true.
        status = 'published', enabled = true, last_synced_at = now()
    )

    return sku
```

### 4.4. Дедуп

- `UNIQUE(organization_id, unification_article)` на `products` +
  `UNIQUE(variant_id, size)` на `product_skus` + `UNIQUE(account_id, value)` на
  `barcodes` гарантируют отсутствие дублей на уровне БД `[import-export
  §бизправила "Уникальность комбинации"]`.
- При попытке вставить дубль (нарушение UNIQUE) — catch, маршрутизация в
  `import_errors` (reason=`duplicate_article` / `Товар уже создан`), продолжение
  импорта `[import-export §сущность "Журнал ошибок"]`.
- Для «разных размеров/цветов = разные SKU» — композитный ключ на `product_skus`
  обеспечивает `[DATA_MODEL §Обзор п.3]`.

---

## 5. Контракты адаптеров

### 5.1. Общий интерфейс `MarketplaceAdapter`

Все обмены с МП идут через очередь `sync_jobs`; воркер Sync Orchestrator
получает полиморфный адаптер по `marketplace` и вызывает методы интерфейса
`[MVP_PRD §10.1 риск 1]`, `[DATA_MODEL §6]`.

```text
interface MarketplaceAdapter:
    # конфигурация/аутентификация
    authenticate(integration: Integration) -> AuthContext
    probeToken(integration: Integration) -> TokenStatus       # для проверки валидности -> integrations.status
    getService() -> 'wildberries' | 'ozon'

    # публикация карточек (создание/обновление) [product-cards §cap 3], [WF-02]
    publishCard(ctx, sku: CanonicalSku, payload: MpPayload) -> MpPublishResult
    updateCard(ctx, mapping: MarketplaceMapping, payload: MpPayload) -> MpPublishResult
    unpublishCard(ctx, mapping: MarketplaceMapping) -> MpResult    # ограничено: см. §5.4, §9

    # медиа
    uploadMedia(ctx, media: Media, mapping: MarketplaceMapping) -> MpMediaResult  # [§cap 34, DATA_MODEL §16]
    # WB: фото передаются ОТДЕЛЬНЫМ процессом после создания карточки [product-cards §интеграции WB]

    # импорт карточек из МП [import-export WF-1/2]
    fetchCards(ctx, filter: ImportFilter) -> Iterator<RemoteCard>
    # filter: {mode: quick|full, brand?, visible_only?, warehouse_id?(Ozon)} [import-export §cap 5,18,19]

    # статус/ошибки
    getCardStatus(ctx, mapping: MarketplaceMapping) -> MpCardStatus   # для синхронизации фактического статуса

    # лимиты/throttling (для Sync Orchestrator) [MVP_PRD §10.1 риск 1]
    getRateLimitState(ctx) -> RateLimitState
```

**Типы:**
```text
CanonicalSku     = { product, variant, sku, barcodes[], media[], attributes{selsup,wb,ozon}, categoryMapping }
MpPayload        = JSON, сформированный MpFieldTranslator из CanonicalSku + rules [product-cards §Назначение]
MpPublishResult  = { ok: bool, remote_id?, remote_sku_id?, errors: [{field, code, message}], raw? }
TokenStatus      = { valid: bool, expires_at?, reason? }
RateLimitState   = { rps_remaining?, daily_new_cards_remaining?, retry_after_ms? }
```

**Контракт ошибок** (единообразно для всех адаптеров → `sync_jobs.last_error`):
```text
MpError = {
  http_status: int,          # 401/403/422/429/5xx
  kind: 'auth'|'validation'|'rate_limit'|'server'|'network'|'quota',
  code: string,              # код МП ('internal_error','invalid_field',...)
  message: string,           # человекочитаемое (ru)
  field: string|null,        # какое поле не прошло валидацию МП [§cap 61]
  retryable: bool,           # 429/5xx/network -> true; 401/422 -> false
  retry_after_ms: int|null,  # из заголовка Retry-Retry-After (WB) / 429
  raw: object|null           # исходный ответ МП для отладки
}
```

### 5.2. Адаптер Wildberries

**Аутентификация** `[MVP_PRD §7.2]`, `[integrations-marketplaces §cap 1]`,
`[DATA_MODEL §примечания 14]`:
- Заголовок `Authorization: <API-токен>`. Токен из ЛК продавца; тип **не**
  «Только чтение» (нужны права на создание/редактирование карточек)
  `[product-cards §интеграции WB]`.
- `credentials_enc` = AES-256(jsonb`{api_token, stat_token?}`). `stat_token`
  (ключ статистики) — для цен со скидкой `[import-export §интеграции WB]`.
- Срок действия ограничен → регулярная ротация; `probeToken()` по таймеру +
  уведомление при `invalid_token` `[FR-I3]`.

**Эндпоинты WB API** **[SPIKE — точные имена/версии требуют верификации у WB;
в комплекте не приведены — `[MVP_PRD §10.4.1]`, `[integrations-marketplaces
§открытые вопросы 1]`]**. Используемые методы по практике WB OpenAPI:

| Операция | Метод WB (контрактно) | Назначение | Примечание |
|---|---|---|---|
| Создание/ред. карточки | `POST /content/v2/cards/upload` (пакет) | массовое создание/обновление nomenclatures | **лимит 1000 новых карточек/сутки** `[product-cards §бизправила 15]` |
| Получение карточек | `GET /content/v2/cards/list` (или `/filter`) | импорт ассортимента продавца | `[import-export §интеграции WB]` |
| Ошибки создания | `GET /content/v2/cards/upload/maintenance`/`errors` | детальные ошибки по полю `[§cap 61]` | poll после upload |
| Загрузка медиа | `POST /content/v3/media/save` (или через `chars`+URL) | фото/видео | **отдельная очередь; видео — вместе с фото** `[product-cards §интеграции WB, §бизправила 15]` |
| Статус карточки | `GET /content/v2/cards/{nmId}/info` | фактический статус/параметры | для `getCardStatus` |

> Все имена методов — **контрактные**, подлежат верификации в спайке
> (§12). Контракт адаптера (`publishCard`/`fetchCards`/`uploadMedia`)
> фиксируется независимо от конкретного URL; смена эндпоинта = правка только в
> `WildberriesAdapter`.

**Направления и частоты** `[MVP_PRD §7.2, §7.4]`:
- Карточки: **по событию** (тумблер/«Сохранить») — публикация; **по кнопке/ночам**
  — импорт.
- Медиа: отдельная подочередь `sync_jobs(op=upload_media)`, запускается после
  успешного `publish_card` (нужен `remote_id`) `[product-cards §бизправила 15,
  §интеграции WB]`.
- Цены/остатки/заказы — **Фазы 2/3** (не Фаза 1); точка интеграции — `sync_jobs.op`.

**Лимиты и особенности WB** `[product-cards §бизправила 15]`, `[DATA_MODEL
§примечания 16,20]`:
- **≤ 1000 новых карточек/сутки** (редактирование существующих — без лимита).
  Sync Orchestrator держит дневной счётчик и переводит «лишние» `publish_card`
  в `queued` до следующего дня (или `failed` с retryable) `[MVP_PRD FR-P5]`.
- **Rich-контент через API недоступен** — не отправляем `[§бизправила 15]`.
- **Видео WB передаётся вместе с фото** (иначе затирается) — `uploadMedia`
  группирует фото+видео одного SKU в один батч `[§бизправила 15]`.
- **Бренд не создаётся по API** — используется существующий (по имени/ID)
  `[§бизправила 3]`.
- **Запрещённые символы** в параметрах: `!@#$%^&*"№;%:?*+` → валидация до отправки
  `[integrations-marketplaces §бизнес-правила]`.

### 5.3. Адаптер Ozon

**Аутентификация** `[MVP_PRD §7.3]`, `[integrations-marketplaces §cap 1]`:
- Заголовки `Client-Id: <client_id>` + `Api-Key: <api_key>`. Тип ключа
  **«Admin»** `[MVP_PRD FR-I2]`, `[INTEGRATIONS §Ozon]`.
- `credentials_enc` = AES-256(jsonb`{client_id, api_key}`).
- Ozon Performance (`client_id`/`client_secret`) — **post-MVP** (потоварная
  реклама) `[MVP_PRD §7.3]`.

**Эндпоинты Ozon API** **[SPIKE — верификация у Ozon; в комплекте не приведены]**
(контрактно по практике Ozon Seller API `/v1/...`):

| Операция | Метод Ozon (контрактно) | Назначение | Примечание |
|---|---|---|---|
| Создание карточки | `POST /v1/product/import` (или `/v2/...`) | создание/обновление товаров | обязателен артикул (ID Ozon) + связь `[product-cards §интеграции Ozon]` |
| Обновление карточки | `POST /v1/product/update` / `/v1/product/info` | редактирование | описание через «Аннотацию», можно на уровне размера `[§бизправила 16]` |
| Список товаров | `POST /v1/product/list` | импорт ассортимента | `visible_only`, `warehouse_id` `[import-export §cap 18,19]` |
| Детали товара | `POST /v1/product/info` | параметры/статус | для `getCardStatus` |
| Категории/характерки | `POST /v1/category/...` , `/v1/description-category/...` | справочники категорий и атрибутов | для маппинга категорий §8 |
| Бренды | `POST /v1/brand/list` (поиск) | числовой ID бренда | **бренд привязывается по ID, не создаётся** `[§бизправила 16, §cap 22]` |
| Rich-контент | `POST /v1/product/import-rich-content` | rich JSON | **post-MVP углублённо**; в Фазе 1 — заглушка |

**Направления и частоты** `[MVP_PRD §7.3, §7.4]`:
- Карточки: публикация по событию; импорт по кнопке/ночам.
- Заказы/цены/остатки — Фазы 2/3.

**Лимиты и особенности Ozon** `[product-cards §бизправила 16]`, `[DATA_MODEL
§примечания 15]`:
- **«Тип Ozon» = последний уровень категории** — определяется категорией, не
  редактируется отдельно `[§бизправила 16]`.
- **Бренд по числовому ID** — берётся из `brands.ozon_id`; если пусто — ошибка
  валидации до отправки (`required: brand.ozon_id`) `[§cap 22, §WF-13]`.
- **Описание = «Аннотация»**, может быть на уровне размера `[§бизправила 16]`.
- **Заказ создаётся один раз и не редактируется** — строго для Фазы 3 (на
  уровне карточек не влияет) `[MVP_PRD §7.3]`.
- **До 5 видео** по ссылкам (RuTube/VK/Яндекс Диск) — параметр «Ozon.Видео:
  ссылка» `[§cap 40]`.
- **Rich-контент JSON** через API; если заполнен — отправляется именно он
  (старое описание не уйдёт) `[§бизправила 16]`.

### 5.4. Что НЕ делает адаптер (границы Фазы 1)

- `unpublishCard` — **удаление карточки на МП через систему невозможно**
  `[product-cards §бизправила 1]`. Тумблер «выкл» переводит `marketplace_mappings`
  в `draft/archived` и снимает товар с публикации только если МП это
  поддерживает; иначе — только архивация внутри системы.
- Не отправляет цены/остатки/заказы — Фазы 2/3.

---

## 6. Внутренний REST API (для фронтенда)

Соглашения: базовый путь `/api/v1`; `account_id`/`organization_id` — из JWT/
заголовка `X-Organization-Id`. Формат JSON. Ошибки — единый envelope
`{error: {code, message, details?}}`. RBAC по 4 ролям MVP `[FR-O4]`; запись —
роль «Менеджер товаров»/«Администратор», чтение — все.

### 6.1. Карточки (CRUD + модификации + валидация)

| Метод | Путь | Тело/Ответ | Описание / ошибки |
|---|---|---|---|
| `POST` | `/products` | body: `{unification_article, name, brand_id, category_id, production_country, price_with_discount, price_without_discount, weight, dimensions?, manufacturer_id?, variants:[{color_article, color_name, sizes:[{size, barcode?}]}], attributes?[]}` → `201 {product}` | Создание карточки (3-ур. или упрощённая) `[WF-02]`. **400** если нет обязательных (brand/category/country/prices/weight) `[§бизправила 3-7]`; **409** если `unification_article` занят в org. |
| `GET` | `/products` | query: `q, category_id, brand_id, status, mp_status, mp, page, size` → `200 {items, total, page}` | Список + фильтры (включая статусы публикации на МП через JOIN `marketplace_mappings`) `[FR-P7]`. SLA ≤ 2с при 10k SKU `[MVP_PRD §9.2]`. |
| `GET` | `/products/{id}` | → `200 {product, variants[], skus[], media[], attributes[], mappings{wb,ozon}}` | Полная карточка с тумблерами/статусами МП и remote_id. |
| `PATCH` | `/products/{id}` | body: поля продукта → `200 {product}` | Частичное обновление модели. **409** при смене category_id после создания — запрещено `[§бизправила 8]`. |
| `DELETE` | `/products/{id}` | → `204` | Удаление **только при отсутствии связей** (заказы/закупки/приёмки); иначе — архив `[§бизправила 2, WF-8]`. Фаза 1: запретить hard-delete (только → `Archived`), т.к. заказы появятся в Фазе 3. |
| `POST` | `/products/{id}/variants` | body: `{color_article, color_name, description?}` → `201 {variant}` | Добавить цвет. |
| `POST` | `/products/{id}/variants/{vid}/skus` | body: `{size, russian_size?, manufacturer_size?, wb_size?, barcode?}` → `201 {sku}` | Добавить размер; ШК автогенерируется, если не указан `[§cap 59]`. |
| `PATCH` | `/products/{id}/skus/{skuId}` | body: поля SKU → `200 {sku}` | Обновление размера. |
| `POST` | `/products/{id}/skus/{skuId}/barcodes` | body: `{value?, generation_source?}` → `201 {barcode}` | Добавить/сгенерировать ШК `[§cap 59]`. |
| `PUT` | `/products/{id}/attributes` | body: `[{entity_type, entity_id, namespace, param_code, value, is_visible?}]` → `200 {attributes[]}` | Параметры 3 уровней + параметры WB/Ozon (включая видимость «глазик») `[§cap 15-17]`. |
| `POST` | `/products/validate` | body: черновик карточки → `200 {valid, errors:[{mp, field, code, message}]}` | Превалидация перед публикацией (обяз. поля по каждому МП, §9). Без вызова API МП. |

### 6.2. Медиа

| Метод | Путь | Тело/Ответ | Описание |
|---|---|---|---|
| `POST` | `/products/{id}/media` | multipart: file + `{variant_id?, marketplace_marks?, is_main?, angle?}` → `201 {media}` | Загрузка фото drag&drop, привязка к цвету, «значки» МП, выбор главного `[§cap 34]`. |
| `PATCH` | `/products/{id}/media/{mid}` | body: `{is_main?, marketplace_marks?, position?}` → `200 {media}` | Смена главного/«значков»/порядка. |
| `DELETE` | `/products/{id}/media/{mid}` | → `204` | Удаление медиа. |

### 6.3. Публикация (тумблеры WB/Ozon) — ключевое `[FR-P5]`

| Метод | Путь | Тело/Ответ | Описание / ошибки |
|---|---|---|---|
| `PUT` | `/products/{id}/skus/{skuId}/publish` | body: `{marketplace: 'wildberries'\|'ozon', enabled: bool}` → `202 {mapping: {status}}` | Переключение тумблера. `enabled=true` → валидация (§9) → `mapping.status='ready'` + создаётся `sync_job(op=publish_card)`. `enabled=false` → `status='draft'` + `sync_job(op=unpublish_card)` (если поддерживается). `[WF-02]`. **400** если интеграция `not_configured`/`invalid_token`. **422** `validation_failed` с деталями по полям МП. |
| `POST` | `/products/{id}/publish` | body: `{marketplace, sku_ids:[]}` → `202 {accepted, rejected:[{sku_id, errors[]}]}` | Массовая/«на все размеры» публикация; объединённая карточка отправляется целиком `[§бизправила 12]`. |
| `GET` | `/products/{id}/publish-status` | → `200 {wb: {status, remote_id?, last_error?}, ozon: {...}}` | Статус публикации по МП (для UI-индикаторов). |
| `GET` | `/products/{id}/sync-jobs` | query: `marketplace?` → `200 {items:[{id, op, status, last_error?, created_at}]}` | История задач синхронизации карточки. |

### 6.4. Импорт

| Метод | Путь | Тело/Ответ | Описание |
|---|---|---|---|
| `POST` | `/imports` | body: `{source: 'wildberries'\|'ozon', mode:'quick'\|'full', params:{brand?, visible_only?, warehouse_id?}}` → `202 {import_job}` | Запуск импорта из МП `[import-export WF-1/2]`. Создаёт `sync_job(op=import_cards)`. |
| `POST` | `/imports/excel` | multipart: file + `{send_to?: 'wildberries'\|'ozon', delete_empty_cells?: bool}` → `202 {import_job}` | Массовое редактирование через Excel `[FR-P8, §cap 43]`. |
| `GET` | `/imports/{jobId}` | → `200 {import_job: {status, stats, sync_job_id}}` | Статус задачи импорта. |
| `GET` | `/imports/{jobId}/errors` | query: `page,size` → `200 {items:[{product_identifier, reason, raw_payload?}], total}` | Журнал «Ошибки импорта» `[§cap 23]`. |
| `GET` | `/imports/excel/template` | query: `category_id?` → `200 (xlsx file)` | Скачать Excel-шаблон `[WF-3]`. |

### 6.5. Справочники

| Метод | Путь | Тело/Ответ | Описание |
|---|---|---|---|
| `GET/POST/PATCH/DELETE` | `/brands` | CRUD брендов; POST body `{name, ozon_name?, ozon_id?, logo_media_id?}` | `[§cap 22]`. Ozon ID — числовой. |
| `GET/POST/PATCH/DELETE` | `/manufacturers` | CRUD; POST body `{name, inn?, production_country?}` | `[§cap 24]`. |
| `GET/POST/PATCH` | `/categories` | CRUD + иерархия; POST body `{name, parent_id?, tnved?, flag_split_color_size?, ...}` | `[§cap 25-31]`. |
| `PUT` | `/categories/{id}/mappings` | body: `[{marketplace, external_category_id, external_category_name?, matched_by?}]` | Связь категории с категорией WB/Ozon `[§cap 26]`. |
| `GET` | `/marketplaces/{mp}/categories` | query: `q, parent_id?` → `200 {items}` | Прокси к справочнику категорий МП (через адаптер) для выбора в UI маппинга. |

### 6.6. Интеграции и статусы

| Метод | Путь | Тело/Ответ | Описание |
|---|---|---|---|
| `GET` | `/integrations` | → `200 {items:[{organization_id, service, status, scheme}]}` | Статусы интеграций WB/Ozon по организациям `[§cap 3]`. |
| `PUT` | `/integrations/{orgId}/{service}` | body: `{api_token? \| {client_id, api_key}, scheme?}` → `200 {integration: {status}}` | Сохранение учётных данных (AES-256) + `probeToken()` → статус. `[FR-I1,I2]`. |
| `POST` | `/integrations/{orgId}/{service}/probe` | → `200 {valid, reason?}` | Принудительная проверка токена. |
| `GET` | `/notifications` | query: `unread_only?` → `200 {items}` | Уведомления (невалидный токен) `[FR-I3]`. |
| `PATCH` | `/notifications/{id}/read` | → `204` | Пометить прочитанным. |
| `GET` | `/sync-jobs` | query: `organization_id, marketplace, status, op, page` → `200 {items}` | Мониторинг очереди (для админа/отладки). |

### 6.7. Аудит

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/audit` | query: `entity_type, entity_id, action, from, to` → история `[FR-O5]`. |

---

## 7. Поток публикации (sequence)

### 7.1. End-to-end: пользователь переключает тумблер WB

```text
Пользователь        Frontend            API (PublishSvc)        БД                    Sync Orchestrator         WBAdapter           WB API
    │                  │                      │                   │                        │                       │                  │
    │ включить тумблер │                      │                   │                        │                       │                  │
    │ WB, Сохранить   │                      │                   │                        │                       │                  │
    │─────────────────>│                      │                   │                        │                       │                  │
    │                  │ PUT /skus/{id}/publish {mp:wb, enabled:true}                      │                       │                  │
    │                  │─────────────────────>│                   │                        │                       │                  │
    │                  │                      │ 1. LOAD CanonicalSku(product,variant,sku,   │                       │                  │
    │                  │                      │       media,attributes,categoryMapping)     │                       │                  │
    │                  │                      │──────────────────>│                        │                       │                  │
    │                  │                      │ 2. VALIDATE по правилам WB (§9):            │                       │                  │
    │                  │                      │    brand_id? country? prices? weight?       │                       │                  │
    │                  │                      │    category_mapping.wb? запрещённые символы?│                       │                  │
    │                  │                      │    [422 validation_failed -> возврат]       │                       │                  │
    │                  │                      │ 3. UPSERT marketplace_mappings               │                       │                  │
    │                  │                      │    (sku,wb) status='ready', enabled=true     │                       │                  │
    │                  │                      │──────────────────>│                        │                       │                  │
    │                  │                      │ 4. MpFieldTranslator.build(sku,'wb') -> payload│                     │                  │
    │                  │                      │ 5. CREATE sync_job(op=publish_card, mp=wb,   │                       │                  │
    │                  │                      │    target=product_sku, payload, idempotency_key=sha256(...))         │                  │
    │                  │                      │──────────────────>│ (status=queued)        │                       │                  │
    │                  │ 202 {mapping.status='ready'}             │                        │                       │                  │
    │                  │<─────────────────────│                   │                        │                       │                  │
    │ «Карточка отправлена»                  │                   │                        │                       │                  │
    │<─────────────────│                      │                   │                        │                       │                  │
    │                  │                      │                   │  POLL (воркер):         │                       │                  │
    │                  │                      │                   │  SELECT ... FOR UPDATE SKIP LOCKED  │              │                  │
    │                  │                      │                   │<───────────────────────│                       │                  │
    │                  │                      │                   │  UPDATE status='publishing', mapping.status='publishing'              │                  │
    │                  │                      │                   │<──────────────────────────────────│                    │                  │
    │                  │                      │                   │                        │ 6. WBAdapter.publishCard(ctx, sku, payload)             │                  │
    │                  │                      │                   │                        │─────────────────────>│                  │
    │                  │                      │                   │                        │                      │ POST /content/v2/cards/upload (payload)         │
    │                  │                      │                   │                        │                      │─────────────────>│
    │                  │                      │                   │                        │                      │   200/422/429/5xx │
    │                  │                      │                   │                        │                      │<─────────────────│
    │                  │                      │                   │                        │ 7. нормализовать результат -> MpPublishResult        │                  │
    │                  │                      │                   │                        │<─────────────────────│                  │
    │                  │                      │                   │  УСПЕХ:                                                       │                  │
    │                  │                      │                   │   mapping.status='published', remote_id, published_at       │                  │
    │                  │                      │                   │   sync_job.status='completed'                                │                  │
    │                  │                      │                   │   audit_log(action='publish', delta)                         │                  │
    │                  │                      │                   │   → СОЗДАТЬ sync_job(op=upload_media) [WB: фото отдельно]   │                  │
    │                  │                      │                   │<──────────────────────────────────│                    │                  │
    │                  │                      │                   │  ОШИБКА (422 validation):                                     │                  │
    │                  │                      │                   │   mapping.status='error', last_error={field,code,message}   │                  │
    │                  │                      │                   │   sync_job.status='failed' (не retryable)                   │                  │
    │                  │                      │                   │  ОШИБКА (429/5xx rate_limit/server):                         │                  │
    │                  │                      │                   │   attempts++, next_attempt_at=now()+backoff(retry_after)     │                  │
    │                  │                      │                   │   sync_job.status='queued' (retryable)                       │                  │
    │                  │                      │                   │<──────────────────────────────────│                    │                  │
```

### 7.2. Идемпотентность

- **`sync_jobs.idempotency_key = sha256(op + marketplace + target_id + hash(payload))`**,
  `UNIQUE`. Повторный PUT `/publish` с тем же payload → попытка вставить дубль
  → catch conflict → вернуть уже существующую задачу, новую не создавать
  `[DATA_MODEL §примечания 15]`.
- На стороне МП: повторная публикация существующей карточки = обновление (WB
  `cards/upload` с `nmID`; Ozon `product/update`) — идемпотентно по
  `remote_id`/`remote_article`.
- `mapping` `(product_sku_id, marketplace)` UNIQUE гарантирует один канал на SKU.

### 7.3. Retry/backoff/throttling `[MVP_PRD §10.1 риск 1]`, `[DATA_MODEL §примечания 16]`

- Политика по `MpError.kind`:
  - `auth` (401/403) → **не retry**; `integrations.status='invalid_token'` +
    `notifications`; воркер останавливает все `sync_jobs` этого МП/org
    `[FR-I3]`.
  - `validation` (422) → **не retry**; `mapping.status='error'`, детальная
    ошибка по полю.
  - `rate_limit` (429) → retry с `retry_after_ms` (из заголовка или экспонента);
    `attempts++`, `max_attempts=5`.
  - `server`/`network` (5xx/timeout) → экспоненциальный backoff (1с, 2с, 4с,
    8с, 16с) + jitter; до `max_attempts`.
- **Дневной лимит WB 1000 новых карточек** `[§бизправила 15]`: воркер ведёт
  счётчик `(org, date)` созданных карточек; при достижении — переводит
  оставшиеся `publish_card` в `queued` до 00:00 МСК (next_attempt_at = начало
  следующих суток), не считая это ошибкой.
- **Приоритеты очереди**: `publish_card` (priority 3) > `upload_media` (4) >
  `update_attrs` (5) > `import_cards` (7). Публикация пользователя важнее
  фонового импорта.
- **Throttling per-MP**: токен-ведро (token bucket) на RPS отдельно для WB и
  Ozon (`RateLimitState`), чтобы не упереться в 429 массово.

### 7.4. Аудит `[FR-O5]`, `[DATA_MODEL §AuditLog]`

На каждое изменение `marketplace_mappings` и завершение `sync_job` пишется
`audit_log` (`action='publish'/'unpublish'/'import'`, `delta={from,to}`). Это
обеспечивает «кто/когда/что» для критичных операций `[FR-O5]`.

---

## 8. UI-экраны и состояния

> Принципы UI из `[product-cards §WF-1/3/4]`, `[MVP_PRD FR-P1-P8]`, `[WF-02]`.
> Локализация ru, валюта RUB, МСК `[NFR-5]`.

### 8.1. Создание карточки (единая форма) `[WF-02]`, `[product-cards WF-1]`

**Шаги:** (1) Категория + mapping WB/Ozon → (2) Служебные параметры SelSup →
(3) Цвета/размеры (для одежды) → (4) Фото → (5) Параметры МП + тумблеры.

**Ключевые элементы:**
- Выбор категории с автоподстановкой mapping WB/Ozon и габаритов по умолчанию
  `[§cap 26,30]`.
- Служебные параметры: артикул объединения, название, бренд (обяз., для Ozon —
  предзаполненный ID из `brands.ozon_id`), тип, организация, производитель+
  страна, цены со/без скидки (обяз.), габариты/вес (обяз.) `[WF-02 шаг 2-3]`.
- Таблица цветов/размеров: артикул цвета + цвет; размер + рос. размер (WB) +
  размер производителя; ШК автогенерируется, редактируем `[§cap 14, WF-02
  шаг 4]`.
- Фото: drag&drop, привязка к цвету, «значки» МП (чекбоксы wb/ozon на каждое
  фото), выбор главного `[§cap 34]`.
- Параметры МП: отдельные секции WB/Ozon, видимость «глазиком», выделение
  обязательных оранжевым `[§cap 17]`.
- **Тумблеры публикации** внизу: WB и Ozon (отдельно), кнопка «Сохранить».
  Включение тумблера + Сохранить → `PUT /publish` → индикатор статуса
  `[§cap 3]`.

**Состояния карточки (агрегированные по SKU/МП для индикаторов):**
`draft` → `ready` → `publishing` → `published`; `→ error` (с детальным
сообщением и кнопкой «Открыть ошибку»/«Перейти к настройкам» при невалидном
токене) `[§cap 61]`.

### 8.2. Каталог (список товаров) `[FR-P7]`, `[product-cards §cap 50-54]`

**Ключевые элементы:**
- Таблица: артикул, название, категория, бренд, цены, **колонки статусов WB и
  Ozon** (иконки: черновик/готов/публикуется/опубликовано/ошибка), «дата
  изменения фото» `[§cap 38]`.
- **Тумблеры WB/Ozon инлайн** в строках (массово и поштучно) `[§cap 3,4]`.
- Фильтры: по категории, бренду, статусу карточки (`Actual/Archived`), по
  статусу публикации на МП (`published/error/not_published`), по МП, поиск по
  артикулу/названию/ШК `[FR-P7]`.
- Массовые действия: «В архив», «Удалить», массовое переключение тумблеров,
  «Выгрузить Excel» (массовое редактирование) `[§cap 43,49, WF-3]`.
- Сортировка; пагинация; SLA ≤ 2с при 10k SKU `[MVP_PRD §9.2]`.

### 8.3. Импорт-визард `[import-export WF-1/2]`, `[FR-P6]`

**Шаги:** (1) Источник (WB/Ozon/Excel) → (2) Параметры (режим быстрый/полный,
бренд для импорта, только видимые (Ozon), склад (Ozon), производитель) →
(3) Запуск → (4) Результаты.

**Состояния:**
- `queued` → `running` (прогресс: добавлено/обновлено/ошибки) → `completed`/
  `failed`.
- По завершении: статистика `{added, updated, errors}` + таблица «Ошибки
  импорта» (`product_identifier`, `reason`, раскрытие `raw_payload`) с кнопкой
  «Скачать файл ошибок» `[§cap 23]`.
- Для быстрого импорта: баннер «Идёт подтягивание параметров; карточки
  нельзя редактировать/отправлять до завершения» `[import-export §cap 5]`.

### 8.4. Маппинг категорий `[§cap 26-30]`

**Экран:** список внутренних категорий → для каждой — поля привязки к
категории WB и Ozon (поиск по справочнику МП через адаптер), ТНВЭД, флаги
(`flag_split_color_size`, `flag_marked`), габариты/вес по умолчанию, шаблон
названия. Кнопки «Сопоставить» (AI — post-MVP), «Показать дубликаты» (post-MVP)
`[§cap 26-28]`.

**Состояния:** «не сопоставлено» (предупреждение: нельзя публиковать на этот
МП — комиссия = 0 / валидация упадёт) / «сопоставлено» (показан
`external_category_name`) `[§бизправила 7]`.

### 8.5. Интеграции (статусы WB/Ozon) `[FR-I1-I3]`, `[§cap 1-4]`

Карточки организаций со статусами интеграций: «Настроить» / «Настроено» /
«Частично» / «Невалидный токен». Формы ввода: WB — API-токен (+ опц. ключ
статистики); Ozon — Client-Id + Api-Key. Баннер невалидного токена сверху всех
экранов с кнопкой «Перейти к настройкам» `[§cap 4, FR-I3]`.

### 8.6. Переходы состояний (mapping per SKU/МП)

```text
                 включить тумблер + валидация OK
   draft  ────────────────────────────────────>  ready
     ▲                                                │ (воркер забрал sync_job)
     │ включить тумблер выкл                          ▼
   archived  <─── unpublish (если МП поддерживает)  publishing
     │                                                │
     │                              успех ───────────> published
     │                                                │
     │                              ошибка 422 ──────> error ──(правка поля)──> ready
     │                              ошибка 429/5xx ──> publishing (retry)
```

---

## 9. Бизнес-правила и валидации по каждому МП

> Источник: `[product-cards §бизправила, §интеграции]`, `[MVP_PRD §7.2, §7.3]`,
> `[import-export §бизправила]`. Серверная превалидация (в `PublishSvc` /
> `MpFieldTranslator`) ДО создания `sync_job`, чтобы не тратить квоты МП на
 заведомо невалидные payload.

### 9.1. Общие обязательные поля (оба МП) `[product-cards §бизправила 3-7]`

| Поле | Правило | Источник |
|---|---|---|
| Бренд | обязателен; `brand_id` not null | `[§бизправила 3]` |
| Страна производства | обязательна; по умолчанию из производителя | `[§бизправила 4]` |
| Цена со скидкой / без скидки | обязательны; `>= 0` | `[§бизправила 5]` |
| Габариты и вес | обязательны (вес — для Ozon критичен: «Не указан вес упаковки») | `[§бизправила 6]` |
| Категория + mapping на МП | обязательна; без связи с категорией МП — комиссия = 0 / валидация | `[§бизправила 7]` |
| Запрещённые символы | нет `!@#$%^&*"№;%:?*+` в строковых параметрах | `[integrations §бизправила]` |
| Артикул (уник. ключ) | `(org, unification_article, color_article, size)` уникален | `[import-export §бизправила]` |

### 9.2. Wildberries — специфичные правила `[product-cards §интеграции/бизправила 15]`, `[MVP_PRD §7.2]`

| Аспект | Правило |
|---|---|
| Токен | тип **не** «Только чтение»; срок ограничен → ротация + уведомления |
| Бренд | не создаётся по API — используется существующий (по имени) |
| Категория | фиксируется при первом создании; mapping WB обязателен |
| Новый лимит | **≤ 1000 новых карточек/сутки/org**; редактирование — без лимита |
| Фото | передаются **отдельным процессом** после создания карточки (`upload_media`) |
| Видео | передаётся **вместе с фото** (иначе затирается); группировать в один батч |
| Rich-контент | через API **недоступен** — не отправляем |
| Размер | «Российский размер» автогенерируется для WB `[§сущность Размер]` |
| Скидка WB (цен) | отправляется **скидка целым числом** (округление вниз), не цена — **Фаза 2** (цены), но цена хранится в карточке |
| Запрещённые символы | валидация до отправки |

### 9.3. Ozon — специфичные правила `[product-cards §интеграции/бизправила 16]`, `[MVP_PRD §7.3]`

| Аспект | Правило |
|---|---|
| Токен | Client-Id + Api-Key, тип **«Admin»** |
| Бренд | **привязывается по числовому ID** (`brands.ozon_id`); не создаётся по API; если `ozon_id` пуст → ошибка валидации `required: brand.ozon_id` |
| Артикул | обязателен (ID Ozon) + связь (номер карточки/ссылка) |
| Категория | «Тип Ozon» = последний уровень категории; не редактируется отдельно; mapping Ozon обязателен |
| Описание | через «Аннотацию»; можно на уровне размера; если rich заполнен — отправляется rich (старое описание не уйдёт) |
| Цвет | из справочника Ozon, **маленькими буквами** (для одежды/обуви) `[import-export WF-7 шаг 6]` |
| Размер | **только числа** (для одежды/обуви) `[import-export WF-7 шаг 6]` |
| Вес | обязателен; типичная ошибка «Не указан вес для упаковки» |
| Видео | до 5 по ссылкам (RuTube/VK/Яндекс Диск) через параметр «Ozon.Видео: ссылка» |
| Rich-контент | JSON через API (post-MVP углублённо; в Фазе 1 — заглушка/необязательно) |
| Заказ | создаётся **один раз** и не редактируется (Фаза 3 — строго UX) |

### 9.4. Требования к медиа `[product-cards §cap 34-42, §бизправила 22]`

| Аспект | Правило |
|---|---|
| Кол-во фото | до 50 на товар (через Excel); на форму — drag&drop `[§cap 35]` |
| Главное фото | ровно одно на товар/цвет (`uq_media_main_per_variant`) |
| Фон | автодобавление белого фона под требования МП `[§cap 34]` |
| Привязка | к цвету (`variant_id`) `[§cap 34]` |
| «Значки» МП | `marketplace_marks` (wb/ozon) для выборочной отправки `[§cap 34]` |
| Форматы | фото jpeg/png; видео mp4/mov (post-MVP углублённо) |
| Копирование | при копировании карточки фото **не копируются** `[§бизправила 22]` |

### 9.5. Штрихкоды `[product-cards §cap 59]`, `[import-export §сущности]`

| Аспект | Правило |
|---|---|
| Генерация | автогенерация на размер; источник `Marketplace` по умолчанию `[§cap 59]` |
| Несколько ШК | разрешены; пометка `marketplace_usage` по МП; на этикетке — один `[§cap 59]` |
| Уникальность | `(account_id, value)`; дубли между организациями — по глобальной настройке `[import-export §cap 24]` |
| GTIN (ЧЗ) | начинается с 2 или 4; GTIN без первой цифры = EAN-13 (точка интеграции post-MVP) `[import-export §бизправила]` |

---

## 10. Edge-cases

| # | Сценарий | Поведение системы | Источник |
|---|---|---|---|
| E1 | **Частичный успех публикации**: одно поле не прошло валидацию МП (422) | `mapping.status='error'`, `last_error={field, code, message}`; UI показывает конкретное поле и сообщение МП; `sync_job.status='failed'` (не retry). Карточка остаётся `ready` по внутренним данным; правка поля → повтор `ready`→`publishing` | `[§cap 61]`, `[MVP_PRD FR-P5 "детальные ошибки"]` |
| E2 | **Полный успех на WB, ошибка на Ozon** (отдельные тумблеры) | Независимые `marketplace_mappings`: WB→`published` (с `remote_id`), Ozon→`error`. UI показывает разные статусы в колонках | `[§cap 3,5]` |
| E3 | **Расхождения при повторном импорте** (артикул тот же, параметры изменились на МП) | Обновляются **только** параметры МП (`product_attributes` namespace=wb/ozon); внутренние SelSup (название/описание) **не** трогаются; категория не меняется; габариты — по тумблеру «обновлять габариты» | `[import-export §бизправила, §cap 20,21]`, `[§бизправила 8,9]` |
| E4 | **Изменение обязательного поля после публикации** (напр. вес) | Сохранение PATCH → если `enabled=true` и статус `published` → авто-создание `sync_job(op=publish_card)` для доставки изменений на МП (тумблер «включён» = целевое состояние синхронизируется) | `[§cap 3]` (тумблер как целевое состояние) |
| E5 | **Rate-limit / 429** | `sync_job` retry: `attempts++`, `next_attempt_at=now()+retry_after`; `mapping.status` остаётся `publishing`; токен-ведро RPS снижает скорость; UI — «Публикуется» (без ошибки) | `[MVP_PRD §10.1]`, §7.3 |
| E6 | **Дневной лимит WB 1000 новых карточек исчерпан** | «Лишние» `publish_card` → `queued`, `next_attempt_at` = 00:00 МСК след. суток; `mapping.status` остаётся `ready`; в UI — индикатор «В очереди (лимит)»; не считается ошибкой | `[§бизправила 15]`, `[DATA_MODEL §20]` |
| E7 | **Невалидный/просроченный токен** (401/403) | `integrations.status='invalid_token'`; все `sync_jobs` этого МП/org → `cancelled`/приостановлены; `notifications` баннер «Перейти к настройкам»; `mapping.status` не сбрасывается в `error`, остаётся прежним (токен — не ошибка карточки) | `[FR-I3]`, `[§cap 4]` |
| E8 | **Дубликат при импорте** (нарушение UNIQUE) | catch conflict → `import_errors(reason='duplicate_article'/'Товар уже создан')`; импорт продолжается; карточка не дублируется | `[import-export §сущность Журнал ошибок]`, §4.4 |
| E9 | **Конфликт матчинга** (ШК совпал, но brand/category разные) | `import_errors(reason='match_conflict')`; отдельная карточка НЕ объединяется автоматически; ждёт ручного merge (post-MVP тулз) | `[import-export §бизправила]`, `[DATA_MODEL §6]`, §4.2 |
| E10 | **Рассинхрон остатков** (упоминание риска) | В Фазе 1 остатков нет; но `sync_jobs` проектируется так, что `update_stock` (Фаза 2) идёт через ту же очередь с теми же retry. Митигация на уровне Фазы 2: первый импорт — только заказы, без обновления остатков | `[MVP_PRD §10.1 риск 3]` |
| E11 | **Фото WB загружено до получения `remote_id`** | `upload_media` создаётся **только** после успешного `publish_card` (нужен `remote_id`/`nmId`); иначе — откладывается | `[§бизправила 15, §интеграции WB]` |
| E12 | **Видео WB без фото в батче** | `MpFieldTranslator` для WB группирует фото+видео SKU в один `upload_media` батч; пустой фото-список при наличии видео → превалидация-ошибка | `[§бизправила 15]` |
| E13 | **Параллельные `sync_jobs` на один SKU/МП** | `idempotency_key` UNIQUE + `SELECT ... FOR UPDATE SKIP LOCKED` гарантируют, что одновременно исполняется одна задача на target+mp; дубль — no-op | `[DATA_MODEL §15]`, §7.2 |
| E14 | **Быстрый импорт ещё не завершил подтягивание параметров** | Карточки в статусе «параметры подтягиваются» блокируют редактирование и публикацию (флаг в `import_jobs`/`products`); UI — баннер | `[import-export §cap 5]` |
| E15 | **Смена категории после создания** | Запрещена на уровне API (409) — категория фиксируется при первом создании | `[§бизправила 8]` |

---

## 11. Acceptance criteria Фазы 1

Тестируемые, по exit criteria `[MVP_PRD §8 Фаза 1]` + технические метрики
`[MVP_PRD §9.2]`.

### 11.1. Функциональные (end-to-end)

- **AC-1 (Journey B, FR-P1, P5).** Созданная в UI карточка (3-уровневая,
  одежда: 1 модель × 2 цвета × 3 размера) успешно публикуется на **WB** и на
  **Ozon** включением соответствующих тумблеров и «Сохранить». На обоих МП
  появляется в ЛК; `marketplace_mappings.status='published'`, `remote_id`
  заполнены.
- **AC-2 (FR-P5 детальные ошибки).** При публикации с заведомо невалидным
  полем (например, отсутствует `weight` для Ozon, или запрещённый символ в
  параметре) система возвращает **детальное** сообщение с указанием поля и
  причины для каждого МП; `mapping.status='error'`, `last_error.field`
  заполнено.
- **AC-3 (FR-P6 матчинг).** Импорт из WB, затем импорт из Ozon того же товара
  (тот же ШК) сводится в **одну** карточку: один `product_skus`, две
  `marketplace_mappings` (wb+ozon), без дублей. В UI «Ссылки» — значки обоих МП.
- **AC-4 (FR-P6 быстрый импорт).** Быстрый импорт создаёт карточки без
  параметров МП; до завершения фоновой дозагрузки карточки нельзя
  редактировать/публиковать (блокировка работает).
- **AC-5 (≥N без потерь).** Импорт ≥ 1000 карточек из WB (быстрый режим) не
  теряет позиции: `import_jobs.stats.added + updated + errors == total`.
- **AC-6 (Ozon brand by ID, FR-I2).** Карточка Ozon с брендом, у которого
  заполнен `brands.ozon_id`, публикуется; бренд НЕ создаётся по API
  (используется числовой ID). Без `ozon_id` — ошибка валидации
  `required: brand.ozon_id`.
- **AC-7 (FR-P8 массовое Excel).** Выгрузка Excel-шаблона → правка цены/
  описания → загрузка с `send_to=wb` → изменения уходят на WB; «Удалять
  значения параметров, где пустые ячейки» работает.
- **AC-8 (FR-I1-I3 интеграции).** Ввод валидного токена WB и Client-Id+ключ
  Ozon → статус «Настроено»; ввод невалидного → статус «Невалидный токен» +
  баннер с «Перейти к настройкам».
- **AC-9 (FR-P7 статусы/архив).** Статусы карточки `Actual/Archived`
  переключаются; архивная не публикуется; фильтр по статусу публикации работает.
- **AC-10 (категории/mapping).** Настроенный mapping категории на WB и Ozon
  позволяет публикации пройти; без mapping — валидация блокирует с понятной
  ошибкой.

### 11.2. Технические / надёжность `[MVP_PRD §9.2]`

- **AC-11 (надёжность синхронизации).** ≥ 99% `publish_card`/`upload_media`
  доводятся до `completed` (с учётом retry); доля неотработанных ошибок МП
  ≤ 1%.
- **AC-12 (лимиты API).** Ни один «провал» из-за 429/throttling: очереди +
  backoff + дневной счётчик WB 1000 — все «лишние» уходят в `queued` до
  следующего дня, без `failed`.
- **AC-13 (идемпотентность).** Повторный PUT `/publish` с тем же payload не
  создаёт дубль `sync_job` (idempotency_key) и не порождает дубль карточки на МП.
- **AC-14 (производительность).** Загрузка `/products` ≤ 2с при 10k SKU
  (индексы `idx_products_org_status`, пагинация); публикация одного SKU —
  создание `sync_job` ≤ 200мс (API отвечает 202, тяжёлое — в фоне).
- **AC-15 (матчинг-качество).** ≤ 0,5% нераспознанных карточек при импорте с
  корректным ШК/артикулом (из `[MVP_PRD §9.2]`).
- **AC-16 (аудит).** На каждую публикацию/снятие/импорт есть запись в
  `audit_log` с `user_id`/`initiated_by` и diff.
- **AC-17 (изоляция тенантов).** Ни один запрос не возвращает данные другой
  организации/аккаунта (`account_id`/`organization_id` из JWT на каждом запросе
  + индексы).
- **AC-18 (покрытие тестами).** Unit-покрытие `MpFieldTranslator`,
  `MatchingService`, `WildberriesAdapter`/`OzonAdapter` (на моках МП) ≥ 80%;
  E2E-тесты AC-1, AC-3, AC-6, AC-7 на тестовых кабинетах WB/Ozon (sandbox).

---

## 12. Открытые вопросы / спайки (до старта кодинга)

> Источники: `[MVP_PRD §10.4]`, `[integrations-marketplaces §открытые вопросы
> 1,3,5]`, `[product-cards §открытые вопросы]`. Что **обязательно** уточнить
> до/в первые дни кодинга (блокирует реализацию адаптеров).

### 12.1. Спайки (исследования с прототипом)

1. **[SPIKE-BLOCKER] Реальные эндпоинты и контракты WB API.** В комплекте
   имена методов не приведены (`[MVP_PRD §10.4.1]`). Зафиксировать: точные URL
   и версии для создания/обновления карточек (`/content/v2/cards/upload` и
   др.), получения списка (`/content/v2/cards/list`), загрузки медиа, получения
   ошибок по полю. Формат payload (nomenclature/characteristics). **Делать
   прототип на тестовом кабинете WB до реализации адаптера.** `[integrations-
   marketplaces §открытые вопросы 1]`
2. **[SPIKE-BLOCKER] Реальные эндпоинты Ozon Seller API.** Зафиксировать
   `/v1/product/import`, `/v1/product/list`, `/v1/product/info`,
   `/v1/category/...`, поиск бренда `/v1/brand/list` (получение числового ID).
   Формат `items[]`/`offer_id`. **Прототип на тестовом Ozon.**
3. **[SPIKE] Точные лимиты API WB и Ozon** (RPS, квоты на публикацию/цены/медиа,
   `Retry-After`/429-семантика). От этого зависят параметры token-bucket и
   `max_attempts`. `[MVP_PRD §10.4.1]`, `[MVP_PRD §10.1 риск 1]`
4. **[SPIKE] Формат детальных ошибок МП** по полю (нужно для §7.1 / E1, AC-2):
   как WB/Ozon возвращают `{field, code, message}` для 422 — структура
   `errors[]`. `[product-cards §cap 61]`
5. **[SPIKE] Маппинг категорий WB/Ozon: формат справочников категорий и
   характеристик** (`/category` tree, required attributes per category). От
   этого зависит экран §8.4 и валидация обязательных характеристик по
   категории. `[§cap 26-30]`

### 12.2. Решения, требуемые до кодинга (продукт/архитектура)

- **D1. Источник штрихкодов по умолчанию** (`Marketplace` vs `Range` vs `GS1
  RUS`) для генерации на размер `[product-cards §cap 59]`. Решить: автогенерация
  внутреннего диапазона vs запрос у МП.
- **D2. Стратегия для `allow_duplicate_barcodes_across_orgs`** по умолчанию
  (влияет на индекс `uq_barcode_value_per_org`) `[import-export §cap 24]`.
- **D3. Поведение тумблера «выкл» при `published`**: пробовать ли снять с
  публикации на МП (WB/Ozon могут не позволять) или только архивировать внутри
  системы `[§бизправила 1]`. Решение: внутри-системно всегда; на МП — best-
  effort, не падать.
- **D4. Хранилище медиа**: выбор Object Storage (S3-совместимое), лимиты
  размера/формата под «объём хранилища» (биллинг — post-MVP, но квоты нужны)
  `[DATA_MODEL §примечания 19]`.
- **D5. KMS/ротация ключей AES-256** для `integrations.credentials_enc`
  (`credentials_kid` — на что менять, как ротировать без простоя) `[FR-I1,
  DATA_MODEL §14]`.
- **D6. Тестовые кабинеты WB/Ozon** для CI/E2E (AC-18) — доступы, sandbox.
- **D7. N для exit-criteria AC-5** (целевое число карточек при быстром импорте
  «без потерь») — зафиксировать ≥1000.
- **D8. Частота ночного импорта и тайминг 00:00 МСК** для дневного счётчика WB
  `[MVP_PRD §7.4, §10.4.5]` — зафиксировать cron.

### 12.3. Явно отложенное (не Фаза 1, но учтено в схеме)

- Реальные форматы Excel-шаблонов по каждому МП (детальные колонки/валидации)
  — спайк в рамках AC-7, но full-coverage — Фаза 1+/Hardening `[product-cards
  §открытые вопросы 6]`.
- AI-автосопоставление категорий — post-MVP `[§cap 26-28]`.
- Тулз ручного merge/разъединения карточек (UI) — Фаза 6 (Hardening)
  `[MVP_PRD §6 Фаза 6]`; в Фазе 1 — только журнал `import_errors(match_conflict)`.

---

## Приложение A. Трассировка решений к источникам (summary)

| Решение | Источник |
|---|---|
| Ядро PIM не зависит от МП; тумблеры-курки | `[product-cards §Назначение]`, `[DATA_MODEL §Обзор]`, `[WF-02]` |
| 3-уровневая модель Модель→Цвет→Размер | `[DATA_MODEL §2]`, `[product-cards §cap 6,15]` |
| `product_skus` = SKU = точка привязки склада/цен/заказов | `[DATA_MODEL §Sku/StockItem]`, `[MVP_PRD §6]` |
| Единая очередь `sync_jobs` с retry/backoff (риск №1) | `[MVP_PRD §1, §10.1]`, `[DATA_MODEL §6]` |
| Матчинг по `(article+цвет+размер)`/ШК; дедуп | `[DATA_MODEL §примечания 5,6]`, `[import-export §бизправила]` |
| Бренд Ozon по числовому ID; не создаётся по API | `[product-cards §cap 22, §бизправила 3/16]`, `[MVP_PRD §7.3]` |
| WB: 1000 новых/день; фото отдельно; видео с фото; rich недоступен | `[product-cards §интеграции/бизправила 15]`, `[DATA_MODEL §16,20]` |
| Ozon: Client-Id+Admin key; «Тип» = категория; заказ 1 раз | `[MVP_PRD §7.3]`, `[product-cards §бизправила 16]` |
| Шифрование ключей AES-256 + уведомления | `[FR-I1,I3]`, `[DATA_MODEL §14]` |
| Категория фиксируется при создании; не меняется | `[product-cards §бизправила 8]` |
| Габариты фиксируются при первом импорте | `[product-cards §бизправила 9]`, `[DATA_MODEL §26]` |
| Удаление карточки на МП через систему невозможно | `[product-cards §бизправила 1]` |
| Идемпотентность по `external`/`idempotency_key` | `[DATA_MODEL §примечания 15]` |
| Имена API-методов WB/Ozon — [SPIKE] | `[MVP_PRD §10.4.1]`, `[integrations-marketplaces §открытые вопросы 1]` |


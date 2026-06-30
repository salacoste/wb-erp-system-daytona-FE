# Фаза 0 — Foundation: мультиарендность, auth/RBAC, очередь синхронизации, шифрование, аудит (dev-ready дизайн)

> Документ техлида/системного архитектора для старта кодинга. Цель — команда
> backend начинает каркас без додумывания: есть SQL DDL, схема очереди, модель
> ролей, схема шифрования, псевдокод воркера, тестируемые acceptance criteria.
>
> **Grounding.** Каждое решение трассируется к артефактам комплекта `product/`
> в формате `[файл §раздел]`. Технологический стек даётся как рекомендация с
> дефолтом; на уровне интерфейсов (адаптеры, контракты очереди, KMS-абстракция)
> проект stack-agnostic — смена языка/брокера не ломает модель данных и RBAC.
>
> **Согласование с Фазой 1.** Фаза 0 реализует **примитивы**, которые потребляет
> Фаза 1 (`PHASE1_PIM_MARKETPLACES.md`): таблицы `accounts`, `organizations`,
> `integrations`, `sync_jobs`, `audit_log`, `notifications` определены здесь и
> **без изменений** используются в Фазе 1. Имена сущностей, схема `sync_jobs`
> (`idempotency_key`, `priority`, `attempts`, `next_attempt_at`, `op`-enum),
> политика retry/backoff/throttling и приоритеты очереди (publish 3 > media 4 >
> attrs 5 > import 7) взяты из Фазы 1 и приведены к единому виду. Расхождения с
> Фазой 1 отсутствуют; явные пометки согласования отмечены как `[AC-PH1]`.

---

## 1. Цель и скоуп Фазы 0

### 1.1. Что строим (из `[MVP_PRD §8 Фаза 0]`, `[MVP_PRD §5.9 NFR-1…NFR-3, NFR-5]`)

Технологический фундамент SaaS, на котором стоят все остальные фазы:

1. **Мультиарендный каркас** `Account → Organization → Warehouse` через
   row-level изоляцию по `account_id`/`organization_id` `[DATA_MODEL §Обзор п.1,
   NFR-1]`.
2. **AuthN** — регистрация по телефону+email, вход логин/пароль, сброс пароля,
   лимит сессий = 2 устройства, (готовность) 2FA `[FR-O1, FR-O6, onboarding
   §cap 1,11,12,13]`.
3. **AuthZ (RBAC)** — 4 предустановленные роли MVP (Администратор, Менеджер
   товаров, Сотрудник склада, Управление ценами) + матрица прав роль×ресурс×
   действие + тонкие пермиссии (ограничение по организациям/брендам, флаги
   «можно публиковать карточки»/«собирать без сканирования») `[FR-O4, onboarding
   §cap 23,24,25]`.
4. **Единая очередь синхронизации** `sync_jobs` с retry/экспоненциальным
   backoff, идемпотентностью, dead-letter, per-MP throttling, приоритетами —
   **ключевой риск №1 продукта**; весь обмен с WB/Ozon идёт только через неё
   `[NFR-2, MVP_PRD §1 цель 4, §10.1 риск 1, DATA_MODEL §Обзор п.6, §примечания 4]`.
5. **Хранилище секретов** — шифрование API-ключей WB/Ozon at rest (envelope
   encryption, AES-256, ротация master key) `[NFR-3, FR-I1, onboarding §cap 37,
   DATA_MODEL §примечания 14]`.
6. **Аудит-лог** — append-only журнал «кто/когда/что» для критичных операций
   `[FR-O5, DATA_MODEL §Обзор п.6, §примечания 17]`.
7. **Наблюдаемость** — structured logging, метрики очереди (длина, % ошибок
   синка, латентность, throttle-превышения), tracing, алерты при нарушении SLA
   `[MVP_PRD §9.2]`.

### 1.2. Что НЕ входит в Фазу 0 (явные границы)

| Что | Куда | Обоснование |
|---|---|---|
| Карточки товаров, адаптеры WB/Ozon, матчинг | Фаза 1 | `[MVP_PRD §8 Фаза 1]`; Фаза 0 даёт очередь `sync_jobs.op` (расширяемое множество) и `integrations` (где хранятся зашифрованные токены), но сами адаптеры — Фаза 1 |
| Склад FBS, остатки, синхронизация остатков/цен | Фаза 2 | `[MVP_PRD §8 Фаза 2]`; очередь `sync_jobs` готова принять `op=update_stock`/`update_price` |
| Заказы, импорт/сборка FBS | Фаза 3 | `[MVP_PRD §8 Фаза 3]`; очередь готова принять `op=import_orders` |
| Этикетки, маркировка, Честный Знак | Фаза 4 / post-MVP | `[MVP_PRD §8 Фаза 4, §10.3]` |
| Тарифы/оплата/партнёрка (биллинг) | post-MVP | `[MVP_PRD §3.2]`; на Фазе 0 — единый внутренний тариф/фри-триал, в схеме `subscriptions` (опционально) как placeholder |
| Браузерное расширение, мобильные приложения, ТСД | post-MVP | `[onboarding §cap 34]`; auth — только web/SPA |
| Реальные вызовы WB/Ozon API (адаптеры) | Фаза 1 | В Фазе 0 — stub-адаптер (`EchoAdapter`) для тестирования очереди/throttling без реального МП `[PHASE1 §5]` |
| Связанные аккаунты клиентов (B2B-делегирование) | post-MVP | `[onboarding §cap 15, DATA_MODEL §ClientAccountLink]`; точка интеграции `client_account_links` зарезервирована |
| 2FA (полная реализация) | Фаза 0+, soft-blocker | Поле `two_factor_enabled` + таблица `totp_secrets` в схеме; полная реализация TOTP/SMS — best-effort в Фазе 0, но не блокирует exit criteria `[onboarding §cap 12, §открытые вопросы "Процедура 2FA"]` |

### 1.3. Exit criteria Фазы 0 (из `[MVP_PRD §8 Фаза 0]`)

- Регистрация и вход работают; организация создаётся по ИНН `[FR-O1, FR-O3]`.
- Фоновые задачи (через `sync_jobs`) исполняются и **ретраятся** при ошибке
  с экспоненциальным backoff `[MVP_PRD §8 Фаза 0]`.
- API-ключи WB/Ozon **шифруются at rest** (AES-256) `[FR-I1, NFR-3]`.
- Аудит-лог пишется на критичные операции `[FR-O5]`.
- RBAC enforced: роль без права не может выполнить действие (4 тестовых роли).
- Мультиарендная изоляция: запрос под аккаунтом A не видит данные аккаунта B
  `[NFR-1]`.
- Подробные тестируемые критерии — раздел 12.

---

## 2. Архитектурный обзор системы

### 2.1. Принципы `[PHASE1 §2.1, DATA_MODEL §Обзор]`

1. **Мультиарендность через `account_id`** на каждой tenant-таблице;
   индекс `(account_id, ...)` обязателен; изоляция на уровне строк +
   middleware-resolver `[DATA_MODEL §примечания 1]`.
2. **Единая очередь `sync_jobs`** — единственный путь обмена с внешними МП;
   application-сервисы только **создают** задачи, воркеры их исполняют
   `[DATA_MODEL §примечания 4]`. Это митигация риска №1 `[MVP_PRD §10.1]`.
3. **Паттерн адаптеров маркетплейсов** (контракт определён в Фазе 1
   `[PHASE1 §5]`); Фаза 0 реализует инфраструктуру очереди + stub-адаптер для
   тестов; реальные адаптеры WB/Ozon подключаются в Фазе 1 без правок ядра
   очереди.
4. **Синхронный API отвечает быстро, тяжёлое — в фоне.** API-эндпоинты,
   инициирующие обмен с МП, возвращают `202 Accepted` + создают `sync_job`;
   фактический вызов МП делает воркер `[PHASE1 §7.1, AC-PH1]`.
5. **Идемпотентность на двух уровнях:** `sync_jobs.idempotency_key` (UNIQUE)
   против дублей задач + бизнес-ключ (напр. `(external_number, marketplace)` для
   заказов) против дублей сущностей `[DATA_MODEL §примечания 15]`.
6. **Security by default:** ключи шифруются (envelope + AES-256) `[NFR-3]`;
   пароли — Argon2id; секреты в конфиге/vault, не в коде; rate limiting на API
   `[OWASP]`.
7. **Наблюдаемость с первого дня:** structured JSON-логи, correlation-id
   сквозной через API→воркер→адаптер; метрики очереди в Prometheus-совместимом
   формате.

### 2.2. Компоненты

```text
┌──────────────────────────────────────────────────────────────────────┐
│                        Frontend (SPA, ru, МСК)                         │
│  Логин/Регистрация | Организации | Сотрудники(роли) | Интеграции(WB/Ozon)│
│  Статус очереди sync_jobs | Аудит | Уведомления (невалидный токен)     │
└───────────────┬──────────────────────────────────────────────────────┘
                │ HTTPS, REST/JSON, JWT (access + refresh)
┌───────────────▼──────────────────────────────────────────────────────┐
│                          API Gateway / BFF                             │
│  · rate limiter (per-IP + per-account)                                │
│  · authN: verify JWT (RS256) · session-store check (лимит 2)          │
│  · tenant-resolver: account_id/organization_id из JWT + X-Org-Id      │
│  · RBAC guard: роль → permission check на каждом эндпоинте            │
└───────────────┬──────────────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────────────┐
│                     Application Services (core)                       │
│  ┌────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────────┐  │
│  │ AuthSvc    │ │ OrgSvc       │ │ UserSvc      │ │ IntegrationSvc│  │
│  │ reg/login/ │ │ org по ИНН,  │ │ сотрудники,  │ │ save token    │  │
│  │ refresh/   │ │ flags,soft-  │ │ roles,invite │ │ (AES-256 via  │  │
│  │ logout,2FA │ │ delete       │ │               │ │  Vault/KMS)   │  │
│  └─────┬──────┘ └──────┬───────┘ └──────┬───────┘ └───────┬───────┘  │
│        │  AuditWriter (общий)            │                  │          │
│  ┌─────▼────────────────────────────────▼──────────────────▼───────┐  │
│  │  TenantGuard / PermissionService (RBAC: role×resource×action)    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ создаёт/читает sync_jobs (всегда через Repo)
┌──────────────────────────▼───────────────────────────────────────────┐
│         Sync Orchestrator (воркеры очереди sync_jobs)                  │
│   dispatcher: SELECT ... FOR UPDATE SKIP LOCKED (by priority, per-org) │
│   → load creds (decrypt via Vault/KMS) → token-bucket throttle per-MP  │
│   → polymorphic dispatch: Adapter.execute(op, payload)                 │
│   → on error: classify (auth/validation/rate_limit/server/network)     │
│       retry+backoff / dead-letter / cancel-batch-on-invalid-token      │
│   → on success/fail: update status, write audit, emit metrics          │
└──────────────────────────┬───────────────────────────────────────────┘
        ┌───────────────────┼────────────────────────────┐
┌───────▼────────┐  ┌────────▼────────┐  ┌──────────────▼───────────┐
│ Adapter (iface)│  │ Stub/EchoAdapter│  │ (Фаза 1) WBAdapter,      │
│  execute(op)   │  │ для тестов Фазы │  │ OzonAdapter — реальные МП│
│  probeToken    │  │ 0 (без вызова МП)│  │                          │
└────────────────┘  └─────────────────┘  └──────────────────────────┘
                           │
        ┌──────────────────┴────────────────────┐
┌───────▼──────────┐  ┌────────────────▼─┐  ┌────────────────▼──────┐
│ PostgreSQL 15+   │  │ Redis            │  │ Object Storage (S3)   │
│ accounts, orgs,  │  │ сессии(опц.),    │  │ медиа Фазы 1, печать/ │
│ users, roles,    │  │ token-bucket     │  │ подпись org, бэкапы   │
│ memberships,     │  │ throttle state,  │  │ (audit export)        │
│ integrations(enc)│  │ idempotency cache│  │                       │
│ sync_jobs,       │  │ rate-limit win-  │  │                       │
│ sync_attempts,   │  │ dows, distributed│  │                       │
│ audit_log,       │  │ locks            │  │                       │
│ notifications    │  │                  │  │                       │
│ outbox           │  │                  │  │                       │
└──────────────────┘  └──────────────────┘  └───────────────────────┘

Observability: structured logs (stdout→Loki/ELK) · metrics (Prometheus) ·
tracing (OpenTelemetry, correlation-id из API) · alerts (SLA, dead-letter рост)
Vault/KMS: master keys (envelope encryption), rotation; воркеры получают
data-key на время выполнения задачи
```

### 2.3. Потоки данных (кратко)

- **Регистрация/вход:** Frontend → `POST /auth/register` → AuthSvc создаёт
  `accounts` (email=логин), сессию, выдаёт access+refresh JWT → `audit_log
  (action='signup')` `[FR-O1]`.
- **Создание организации по ИНН:** `POST /organizations {inn}` → OrgSvc
  заполняет поля (справочник ИНН/дачные-сервисы — best-effort), `audit_log
  (action='org_create')` `[FR-O3, W11]`.
- **Сохранение ключа WB/Ozon:** `PUT /integrations/{orgId}/{service}` →
  IntegrationSvc шифрует (envelope AES-256) → `integrations.credentials_enc` +
  `credentials_kid` → `probeToken()` через stub/адаптер → статус
  `configured`/`invalid_token` `[FR-I1, FR-I2, FR-I3]`.
- **Постановка в очередь (пример из Фазы 1, чтобы показать контракт):** пользователь
  переключает тумблер публикации → `PUT /products/{id}/skus/{sid}/publish` →
  PublishSvc создаёт `sync_jobs(op=publish_card, mp, idempotency_key=sha256(...))`
  → API возвращает `202` → воркер забирает, исполняет `[PHASE1 §7.1]`. В Фазе 0
  этот поток тестируется на stub-операциях (см. §5.7).
- **Аудит:** каждая мутация критичного ресурса и завершение `sync_job` пишут
  запись в `audit_log` через общий `AuditWriter` `[FR-O5]`.

### 2.4. Рекомендуемый стек (с обоснованием и stack-agnostic оговоркой)

| Слой | Рекомендация (дефолт) | Обоснование | Альтернатива (stack-agnostic) |
|---|---|---|---|
| **БД (основа)** | **PostgreSQL 15+** | Реляционная модель + jsonb для вариативных полей (`Role.permissions`, `sync_jobs.payload`, `Organization.flags`); `SELECT … FOR UPDATE SKIP LOCKED` — нативная очередь без внешнего брокера; row-level изоляция по `account_id` `[DATA_MODEL §примечания 1,2]` | Любая SQL-СУБД с RR-изоляцией и advisory-locks (MySQL — хуже для SKIP LOCKED; CockroachDB — если нужен multi-region) |
| **App-слой** | **Go (chi/gin) ИЛИ Node.js (NestJS/Fastify) + TypeScript** | Go: статическая типизация, низкий overhead воркеров, отличный story для конкурентных pull-воркеров; Node: быстрая разработка, общий язык с фронтендом, зрелая экосистема. Выбор — за командой | Python (FastAPI), Rust (axum) — если есть экспертиза; контракты (DTO/DTO-validation) — через OpenAPI, чтобы язык не mattered |
| **Очередь/воркеры** | **DB-очередь на `sync_jobs` + пул pull-воркеров** (дефолт для Фазы 0) | Один источник правды (транзакционность с бизнес-данными: создание `sync_job` коммитится вместе с `marketplace_mappings`/`audit_log` — нет рассинхрона outbox-паттерна вручную); `SKIP LOCKED` даёт безопасную конкуренцию; трассируемость задач в той же БД. Для MVP-нагрузки (см. §5.2) достаточно `[DATA_MODEL §примечания 4]` | Redis Streams / RabbitMQ — если нагрузка превысит ~десятки тысяч задач/мин (см. спайк §13.1); или внешний worker-pool (Temporal) — overkill для Фазы 0 |
| **Кэш/throttle/сессии** | **Redis** | Token-bucket throttling per-MP (атомарные Lua-скрипты); rate-limit windows API; distributed locks для единственного исполнителя задачи; (опц.) хранилище refresh-сессий | in-DB таблица `rate_limits` (медленнее, но без Redis); Memcached — без persist |
| **KMS/секреты** | **HashiCorp Vault (transit secret engine)** или обл. KMS (Yandex KMS/aws-kms-compatible) | Envelope encryption: master key не покидает KMS; воркеры получают data-key на время задачи; аудит доступа к ключам `[NFR-3, DATA_MODEL §примечания 14]` | DB-level pgcrypto (хуже: ключ в БД); внешняя `sops`+age (op-сложность) |
| **Object storage** | **S3-совместимое** (MinIO локально / обл. S3) | Медиа Фазы 1, печать/подпись организации, экспорт аудита `[DATA_MODEL §примечания 19]` | Файловая система (не для прод-мультиаренды) |
| **AuthN** | **JWT RS256 (access ~15 мин) + refresh (rotation, reuse-detection) + opaque session-id в БД для лимита 2 устройства** | Stateless access для горизонтального масштабирования API; refresh в БД позволяет enforce «не более 2 сессий» и отзыв `[FR-O6, onboarding §cap 13]` | Paseto; или полностью server-side sessions (opaque) — строже для отзыва, но stateful |
| **Observability** | **OpenTelemetry + Prometheus + Loki/ELK** | Сквозной correlation-id; метрики очереди из коробки; structured logs | Datadog/Grafana Cloud; или минимум — JSON-логи + alertmanager |
| **Деплой** | **Docker Compose (dev) → Kubernetes (prod)** или bare-metal + systemd | Мультиарендный SaaS требует изоляции воркеров и горизонтального масштабирования под нагрузку | Любой orchestrator |

> **Stack-agnostic оговорка.** На уровне интерфейсов Фаза 0 фиксирует:
> контракт `MarketplaceAdapter` (`PHASE1 §5`), контракт `JobQueue`
> (enqueue/dispatch/ack/nack/retry — §5.6), абстракцию `SecretStore`
> (encrypt/decrypt/rotate-key — §6), `PermissionService` (can(role,action,
> resource) — §4). Конкретный язык/брокер/KMS подключаются как implementation.
> Смена любого из них = замена adapter-класса, модель данных и RBAC не меняются.


---

## 3. Мультиарендность

### 3.1. Модель теннанта `[NFR-1, DATA_MODEL §Обзор п.1]`

- **Tenant = `Account`** (аккаунт селлера). Внутри аккаунта — несколько
  `Organization` (юрлица/ИП); у каждой организации — подключения к МП
  (`Integration`) и склады (`Warehouse`) `[DATA_MODEL §Обзор п.1]`.
- **Пользователь (`User`)** привязан к `account_id` с ролевым доступом и
  ограничениями по организациям/брендам `[onboarding §cap 23,25]`.
- **Иерархия:** `Account (1) — (N) Organization (1) — (N) Warehouse /
  Integration / Product / Order / …`. Все tenant-данные несут `account_id`
  (обязательный) и (где применимо) `organization_id` `[DATA_MODEL
  §примечания 1]`.

### 3.2. Стратегия изоляции: shared schema + `account_id` (row-level)

| Вариант | Выбор | Обоснование |
|---|---|---|
| Database-per-tenant | ❌ | Слишком дорого для SaaS с тысячами мелких селлеров; миграции N баз |
| Schema-per-tenant | ❌ | То же; PostgreSQL limit на schema count |
| **Shared schema + `account_id`** | ✅ **Дефолт** | Один источник правды, простые миграции, индекс `(account_id, ...)`; соответствует `[DATA_MODEL §примечания 1]` |

**Инварианты изоляции (на уровне БД и кода):**
1. Каждая tenant-таблица имеет `account_id uuid NOT NULL REFERENCES accounts(id)`
   и индекс как минимум `(account_id, ...)`; на hot-путях — композитные с
   фильтрующим полем (`WHERE deleted_at IS NULL`, `WHERE status='active'`)
   `[DATA_MODEL §примечания 1]`.
2. **Глобальные справочники** (`ColorDict`, `CurrencyDict`, `CountryDict`) —
   БЕЗ `account_id` `[DATA_MODEL §примечания 1]`.
3. **Row-Level Security (RLS) как defence-in-depth** (опционально, hardening):
   ```sql
   ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation_org ON organizations
       USING (account_id = current_setting('app.current_account_id')::uuid);
   ```
   App-слой устанавливает `SET LOCAL app.current_account_id = ?` в начале каждой
   транзакции из JWT-resolver. Это страховка от забытого `WHERE account_id=`.
   В Фазе 0 — рекомендуем, но не блокер (middleware-фильтрация обязательна).

### 3.3. Tenant-resolver middleware

- `account_id` и `organization_id` извлекаются из **JWT** (claim `act`=
  account_id); активная организация — из заголовка `X-Organization-Id` (или
  `org` claim), если пользователь работает в контексте конкретной org.
- **Middleware-контракт** (stack-agnostic):
  ```text
  TenantContext = {
      account_id:      uuid,        // из JWT, обязательный
      organization_id: uuid | null, // из X-Org-Id; null = "все мои org" (для owner)
      user_id:         uuid,        // из JWT
      role:            string,      // из JWT/membership
      brand_scope:     [uuid],      // ограничение видимости брендов
      org_scope:       [uuid] | 'all'
  }
  ```
- На каждый запрос resolver проверяет: `organization_id ∈ org_scope` пользователя
  (нельзя обратиться к чужой org) `[onboarding §cap 25 "ограничение по
  организации"]`.
- Все репозитории принимают `TenantContext` и **всегда** фильтруют по
  `account_id` (и `organization_id` где релевантно); отсутствие фильтра —
 	fail-fast в dev/test (assertion), чтобы исключить утечку `[AC-17 из PHASE1]`.

### 3.4. Скоупирование сущностей `[DATA_MODEL §сущности]`

| Сущность | Скоуп | Примечание |
|---|---|---|
| `accounts` | global (tenant root) | 1 строка = 1 теннант |
| `organizations` | per-account | `UNIQUE(account_id, inn)` `[FR-O3]` |
| `integrations` | per-organization | `UNIQUE(organization_id, service)` → «1 org = 1 ключ API МП» `[FR-O3, INTEGRATIONS §13]` |
| `users` / `memberships` | per-account | пользователь принадлежит аккаунту; membership даёт роль в (org | all) |
| `sync_jobs` | per-account + per-org | `account_id`, `organization_id` — для изоляции и диспетчеризации `[PHASE1 §3.2]` |
| `audit_log` | per-account | `account_id` обязателен; `organization_id` где применимо |
| `notifications` | per-account | `account_id`, `organization_id` |

### 3.5. «Один магазин — один аккаунт» `[INTEGRATIONS §13]`

- Подключение того же магазина (того же API-токена WB / того же `Client-Id`
  Ozon) на другом аккаунте **блокируется** `[INTEGRATIONS §13]`.
- Реализация: при сохранении `integrations` вычисляется `store_fingerprint`
  (для WB — SHA-256(api_token); для Ozon — SHA-256(client_id+api_key)) и
  проверяется глобальный partial-unique индекс:
  ```sql
  CREATE UNIQUE INDEX uq_integration_store_fingerprint
      ON integrations(store_fingerprint)
      WHERE store_fingerprint IS NOT NULL AND deleted_at IS NULL;
  ```
  Конфликт → `409 store_already_linked` с понятным сообщением `[INTEGRATIONS
  §13 "удаление ключа из кабинета не освобождает его"]`.


---

## 4. AuthN и AuthZ (RBAC)

### 4.1. Регистрация и вход `[FR-O1, FR-O6, onboarding §cap 1,11,12,13]`

- **Регистрация:** по `email` + `phone` + пароль. `email` — уникальный логин
  `[DATA_MODEL §Account]`. Пароль — **Argon2id** (memory=64MB, iterations=3,
  parallelism=4 — современный дефолт против GPU/ASIC). SLA регистрации ≤ 30с
  `[FR-O1]`.
- **Вход:** `POST /auth/login {email, password}` → проверка Argon2id → создание
  сессии (см. 4.2) → выдача пары токенов.
- **Сброс пароля:** `POST /auth/password/reset {email}` → email со ссылкой с
  одноразовым токеном (TTL 30 мин, привязка к `account_id`) → `POST
  /auth/password/reset/confirm {token, new_password}` `[W7]`.
- **2FA (готовность):** поле `accounts.two_factor_enabled` + таблица
  `totp_secrets` (шифруется, как секреты — §6). Полная реализация TOTP —
  best-effort в Фазе 0; не блокирует exit criteria `[onboarding §cap 12, §открытые
  вопросы "Процедура 2FA"]`.
- **Удаление организации — только админом** (основной аккаунт регистрации) с
  подтверждением кодом из email `[onboarding §бизправила, W13]` → в `audit_log`
  `action='org_delete'`.

### 4.2. Сессии, JWT, лимит 2 устройства `[FR-O6, onboarding §cap 13]`

- **Access token** (JWT RS256, TTL ~15 мин): claims `sub`=user_id, `act`=
  account_id, `sid`=session_id, `role`, `exp`. Stateless, проверяется публичным
  ключом на каждом запросе.
- **Refresh token** (opaque random, TTL ~30 дней): хранится в `sessions` с
  хешем; при обмене на access — **rotation + reuse-detection** (украденный
  refresh инвалидирует всю цепочку) `[best-practice]`.
- **Лимит сессий = 2:** при логине, если у аккаунта уже 2 активные сессии,
  **самая старая принудительно закрывается** (`sessions.active=false`,
  refresh-инвалидация) `[onboarding §cap 13 "система выбивает предыдущие
  сессии"]`. Реализуется атомарно:
  ```text
  BEGIN;
    INSERT INTO sessions(account_id, ...) VALUES(...);
    -- оставить только 2 самые свежие active
    UPDATE sessions SET active=false, revoked_at=now()
      WHERE account_id=? AND active=true
        AND id NOT IN (SELECT id FROM sessions
                       WHERE account_id=? AND active=true
                       ORDER BY created_at DESC LIMIT 2);
  COMMIT;
  ```
- **Logout:** `POST /auth/logout` → `sessions.active=false` (отзыв refresh);
  access живёт до exp (~15 мин) — приемлемо.
- **Хранение сессий:** таблица `sessions` в PostgreSQL (дефолт, чтобы enforce
  лимит 2 транзакционно с `accounts`); для high-throughput можно вынести в Redis,
  но лимит 2 тогда — через distributed lock. **Дефолт: PostgreSQL** (MVP-нагрузка
  невелика).

### 4.3. Модель ролей и прав `[FR-O4, onboarding §cap 23,24,25]`

#### 4.3.1. Роли

SelSup определяет 10 предустановленных ролей `[onboarding §cap 24, §сущность
Role]`. **MVP (Фаза 0) реализует 4** (из `[FR-O4, MVP_PRD §8 Фаза 0]`), остальные
— stub с полными `permissions` jsonb, чтобы UI Фазы 1+ мог их показывать:

| Роль (code) | Имя | В MVP | Краткое описание (из онбординга) |
|---|---|---|---|
| `admin` | Администратор | ✅ | Полный доступ (основной аккаунт) `[onboarding §Role]` |
| `product_manager` | Менеджер товаров | ✅ | Отгрузки, карточки, заказы; без аналитики, финансов, закупочных цен |
| `warehouse_staff` | Сотрудник склада | ✅ | Отгрузки, заказы, приёмка `[onboarding §Role]` |
| `price_manager` | Управление ценами | ✅ | Цены и акции `[onboarding §Role]` |
| `operator` | Оператор | stub | Только задания, без основного меню и товаров |
| `ads_analyst` | Рекламщик/аналитик | stub | Только аналитика и статистика |
| `buyer` | Закупщик | stub | Закупки, закупочные цены |
| `content_manager` | Контент-менеджер | stub | Создание карточек |
| `card_viewer` | Просмотр карточек | stub | Только просмотр «Товары» |
| `consultant` | Консультант | stub | Чаты, вопросы, отзывы (post-MVP CRM) |

> **[SPIKE] Точная матрица прав.** В комплекте `onboarding §открытые вопросы`
> явно указано: «Точная матрица ролей × разрешений не приведена — описаны только
> качественно». Раздел 4.3.2 даёт **рабочую проекцию для MVP**, основанную на
> качественных описаниях; её нужно валидировать с продуктом до кодинга (спайк
> D9, §13.2).

#### 4.3.2. Матрица прав (роль × ресурс × действие) — рабочая проекция для MVP

Действия: `view` (чтение), `create`, `update`, `delete`, `execute` (операция).
Ресурсы — модули из `[MVP_PRD §3.1]`. **X** = разрешено, **—** = запрещено,
**(v)** = view-only. Ограничения scope (по org/брендам, флаги) применяются
поверх — см. 4.3.3.

| Ресурс (модуль) | admin | product_manager | warehouse_staff | price_manager |
|---|---|---|---|---|
| **organizations** (view/create/update/delete) | X | (v) | — | — |
| **users & roles** (invite/assign/edit/delete) | X | — | — | — |
| **integrations** (save token, probe) | X | — | — | — |
| **products** (cards: view/create/update/delete) | X | X | (v) | (v) |
| **product publish** (тумблеры WB/Ozon) | X | X* | — | — |
| **import cards** (WB/Ozon/Excel) | X | X | — | — |
| **brands / manufacturers / categories** | X | X | — | — |
| **warehouses** (create/link FBS) | X | X | (v) | — |
| **stocks** (view/adjust/move/write-off) | X | X | X | — |
| **stock sync toggle** (org flag) | X | — | — | — |
| **prices** (view/update/min-price) | X | (v) | — | X |
| **orders** (view/import/assemble/close) | X | X | X | — |
| **labels** (order/product print) | X | X | X | — |
| **analytics / finance** (P&L, unit-econ) | X | — | — | (v) |
| **purchase price** (себестоимость) | X | — | — | — |
| **audit_log** (view) | X | — | — | — |
| **sync_jobs** (monitor queue) | X | — | — | — |

`*` product_manager может публиковать только если установлен флаг
`flag_can_publish_cards` `[onboarding §cap 25]`.

> Эта матрица — **отправная точка**; продукт должен подтвердить/уточнить до
> кодинга (спайк D9). Хранится как `Role.permissions jsonb` `[DATA_MODEL
> §Role]`, так что корректировка = миграция данных, не схемы.

#### 4.3.3. Тонкие пермиссии (scope + флаги) `[onboarding §cap 25]`

Поверх роли действуют:
- **Ограничение по организациям:** `memberships.org_scope` (`'all'` или массив
  `organization_id`) — пользователь видит только разрешённые org
  `[onboarding §cap 25]`.
- **Ограничение по брендам:** `memberships.brand_scope` — в «Товары»/«Цены» и
  выгрузках видны только товары выбранных брендов `[onboarding §cap 25]`.
- **Флаги:**
  - `flag_can_publish_cards` — «Разрешить обновлять и сохранять карточки на МП»
    `[onboarding §сущность User]`.
  - `flag_can_assemble_without_scan` — «Возможность собирать заказы без
    сканирования» `[onboarding §сущность User]`.

### 4.4. `PermissionService` (контракт, stack-agnostic)

```text
interface PermissionService:
    # can(user, action, resource, ctx?) -> bool — основная проверка
    can(ctx: TenantContext, action: Action, resource: Resource) -> bool:
        role_perms = ROLE_MATRIX[ctx.role]           # из Role.permissions
        allowed = role_perms.get(resource, {}).get(action, false)
        if not allowed: return false
        # тонкие пермиссии
        if resource == 'product_publish' and not ctx.flags.can_publish_cards:
            return false
        if resource == 'order_assemble' and ctx.flags.require_scan:
            return true   # флаг only DISABLES scan-requirement, не даёт право
        return true

    # scope-фильтры для репозиториев
    orgFilter(ctx) -> sql_fragment:   "organization_id = ANY(:org_scope)"
    brandFilter(ctx) -> sql_fragment: "brand_id = ANY(:brand_scope)"
```

Каждый эндпоинт декларирует требуемое `(action, resource)` (через guard/
middleware/decorator); guard вызывает `PermissionService.can(...)` и возвращает
`403 forbidden` при отказе `[AC из §12]`.

### 4.5. Эндпоинты auth (кратко, см. §10)

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/auth/register` | `{email, phone, password}` → `{access, refresh}` `[FR-O1]` |
| `POST` | `/auth/login` | `{email, password}` → `{access, refresh}`; лимит 2 сессии `[FR-O6]` |
| `POST` | `/auth/refresh` | `{refresh}` → `{access, refresh}` (rotation + reuse-detection) |
| `POST` | `/auth/logout` | отзыв текущей сессии |
| `POST` | `/auth/password/reset` | `{email}` → email со ссылкой `[W7]` |
| `POST` | `/auth/password/reset/confirm` | `{token, new_password}` |
| `GET` | `/me` | профиль + активная org + роль |
| `GET/POST/PATCH/DELETE` | `/organizations/{orgId}/members` | сотрудники/роли (admin) `[FR-O4]` |

---

## 5. Движок синхронизации / фоновая очередь (риск №1)

> **Ключевой риск продукта** — надёжность синхронизации остатков/цен/заказов с
> WB/Ozon `[MVP_PRD §1 цель 4, §10.1 риск 1]`. Этот раздел проработан детально.

### 5.1. Назначение и инвариант «только через очередь»

- **Весь обмен с внешними МП идёт исключительно через `sync_jobs`.**
  Application-сервисы (CatalogSvc, StockSvc, PriceSvc, OrderSvc — Фазы 1-3)
  **никогда не вызывают** WB/Ozon API напрямую в request-цикле; они создают
  `sync_job` и возвращают `202` `[NFR-2, DATA_MODEL §примечания 4, PHASE1 §2.1]`.
- Это даёт: retry/backoff, идемпотентность, throttle per-MP, приоритеты,
  аудитируемость, устойчивость к 429/5xx — без потери запросов при падении
  воркера (задача остаётся в `queued`) `[MVP_PRD §10.1 митигация]`.

### 5.2. Нагрузка на очередь (из частот обмена) `[MVP_PRD §7.4]`

| Поток | Направление | Частота | Нагрузка на очередь |
|---|---|---|---|
| Заказы FBS | WB/Ozon → система | автоимпорт ~раз в 2 мин `[integrations §cap 4]` | ~30 poll-задач/org/час → `op=import_orders` (Фаза 3) |
| Остатки FBS | система → WB/Ozon | при заказе/изменении + ночной импорт 00:00 МСК | всплески при массовом изменении; SLA отправки ≤ 1 мин `[FR-S4, §9.2]` |
| Цены | система → WB/Ozon | ежеминутно + после ручных изменений `[MVP_PRD §7.4]` | ~1 cron-задача/org/мин + on-demand |
| Карточки (публикация) | система → WB/Ozon | по событию (тумблер) | всплески; **лимит WB 1000 новых/день** `[PHASE1 §5.2]` |
| Медиа | система → WB | после publish_card | всплески; отдельная «подочередь» по `op` `[PHASE1 §5.2]` |
| Финансы | WB/Ozon → система | WB еженед./ежедневно; Ozon раз в месяц | низкая частота, тяжёлые payload |

> **Вывод для ёмкости:** на Фазу 0/MVP при ~десятках пилотных селлеров нагрузка
  невелика (порядка сотен задач/мин). **DB-очередь на `sync_jobs` (дефолт) —
  достаточно.** Переход на внешний брокер (Redis Streams/RabbitMQ) — когда
  нагрузка превысит ~10⁴ задач/мин или появится потребность в fan-out
  (см. спайк §13.1) `[§2.4]`.

### 5.3. Модель `sync_jobs` `[PHASE1 §3.2, DATA_MODEL §BackgroundTask]`

Согласовано с Фазой 1 один-в-один `[AC-PH1]`. Ключевые поля:

| Поле | Тип | Назначение |
|---|---|---|
| `id` | uuid PK | идентификатор задачи |
| `account_id`, `organization_id` | uuid FK | изоляция теннанта + диспетчеризация per-org |
| `marketplace` | enum `wildberries`/`ozon` | целевой МП (расширяется в post-MVP) |
| `op` | enum | тип операции (`publish_card`, `unpublish_card`, `upload_media`, `import_cards`, `update_attrs` — Фаза 1; `update_stock`, `update_price`, `import_orders` — добавят Фазы 2/3) |
| `target_type`, `target_id` | enum + uuid | полиморфная цель (`product_sku`, `product`, `media`, `import_job`) |
| `idempotency_key` | text **UNIQUE** | `sha256(op + marketplace + target_id + hash(payload))` — защита от дублей `[DATA_MODEL §примечания 15]` |
| `payload` | jsonb | данные для адаптера |
| `status` | enum | `queued`/`running`/`completed`/`failed`/`cancelled` |
| `priority` | int (1..10, 1=высш) | см. 5.5 |
| `attempts`, `max_attempts` | int | счётчик попыток / потолок (дефолт 5) |
| `last_error` | jsonb | `{http_status, kind, code, message, field?, retry_after?, retryable, raw?}` `[PHASE1 §5.1 MpError]` |
| `next_attempt_at` | timestamptz | когда воркер может забрать (backoff); дефолт `now()` |
| `started_at`, `finished_at` | timestamptz | время исполнения |
| `initiated_by` | uuid → users | NULL = system/robot (cron) |
| `created_at` | timestamptz | — |
| `throttle_key` | text | композитный ключ троттлинга (`mp:org` или `mp:org:bucket`), см. 5.6 |

Индексы (критичны для производительности диспетчера):
```sql
-- основной диспетчерский индекс
CREATE INDEX idx_syncjobs_dispatch
    ON sync_jobs(status, next_attempt_at, priority, created_at);
-- мониторинг per-org/per-mp
CREATE INDEX idx_syncjobs_org ON sync_jobs(organization_id, marketplace, status);
```

### 5.4. Диспетчер: pull-воркеры с `FOR UPDATE SKIP LOCKED`

```text
-- атомарный захват N задач (один воркер не забирает чужое)
BEGIN;
  SELECT id, ... FROM sync_jobs
   WHERE status = 'queued'
     AND next_attempt_at <= now()
   ORDER BY priority ASC, created_at ASC
   LIMIT :batch_size
   FOR UPDATE SKIP LOCKED;          -- конкуренция воркеров безопасна

  UPDATE sync_jobs
     SET status='running', started_at=now(), attempts=attempts+1
   WHERE id IN (:grabbed_ids);
COMMIT;
-- далее воркер исполняет каждую задачу через Adapter (см. 5.7)
```

- **Pool воркеров:** N процессов/горутин (дефолт `N = 4-8` на старте;
  настраивается; конкурентность per-MP ограничена троттлингом, см. 5.6).
- **Poll interval:** ~1с при пустой очереди; backoff poll до 5с; пробуждение по
  `NOTIFY` (опц.) при `enqueue` для мгновенной реакции на on-demand задачи.
- **Lease/visibility timeout:** задача в `running` дольше `lease_ttl` (~10 мин)
  → reaper-джоб возвращает её в `queued` (воркер упал/OOM). Поле `lease_expires_at`
  (опц., можно вычислить из `started_at + lease_ttl`).

### 5.5. Приоритеты `[PHASE1 §7.3, AC-PH1]`

| op | priority | Обоснование |
|---|---|---|
| `import_orders` (Фаза 3) | **1** | автоимпорт FBS-заказов — SLA ≤ 2 мин `[MVP_PRD §9.2]`, выше всего |
| `update_stock` (Фаза 2) | **2** | отправка остатков — SLA ≤ 1 мин `[§9.2]` |
| `publish_card` | **3** | публикация по тумблеру — пользователь ждёт `[PHASE1 §7.3]` |
| `upload_media` | **4** | после publish_card `[PHASE1 §7.3]` |
| `update_price` (Фаза 2) | **5** | отправка цен `[PHASE1 §7.3]` |
| `update_attrs` | **5** | обновление параметров МП `[PHASE1 §7.3]` |
| `import_cards` | **7** | фоновый импорт (менее приоритетен) `[PHASE1 §7.3]` |
| `fetch_finance` (Фаза 5) | **8** | низкочастотный тяжёлый |

### 5.6. Throttling per-MP (учёт лимитов WB/Ozon API) `[MVP_PRD §10.1 митигация, риск 1]`

- **Token bucket на RPS** отдельно для WB и Ozon, реализованный в Redis через
  Lua-скрипт (атомарный):
  ```text
  -- throttle_key = "mp:wb" (глобальный бакет) или "mp:wb:org:<id>" (per-tenant)
  -- capacity = RPS_limit, refill_rate = RPS_limit/sec
  -- воркер перед вызовом адаптера: acquire(throttle_key)
  --   если токенов нет -> отложить задачу (next_attempt_at = now() + wait_ms), status=queued
  ```
- **Глобальный vs per-tenant бакет:** лимиты WB/Ozon применяются к **аккаунту
  продавца** (токену), то есть per-org. Но чтобы один активный теннант не
  «съел» весь RPS-бюджет других, на воркер-уровне есть **глобальный ceiling per-MP**
  (`mp:wb`, `mp:ozon`) + per-tenant бакет (`mp:wb:org:<id>`). Берётся min
  `[best-practice]`.
- **Дневной лимит WB 1000 новых карточек/org** `[PHASE1 §5.2, §бизправила 15]`:
  воркер ведёт счётчик `(org, date, op='publish_card', kind='new')` в
  `sync_job_counters`; при достижении 1000 — оставшиеся `publish_card(new)`
  переносятся на `next_attempt_at = next_day_00:00_MSK`, status=`queued`, **не
  считаясь ошибкой** `[PHASE1 §7.3, E6]`.
- **Retry-After:** при 429 адаптер возвращает `retry_after_ms` (из заголовка
  или дефолт) → воркер ставит `next_attempt_at = now() + retry_after_ms`.

### 5.7. Retry с экспоненциальным backoff + классификация ошибок `[PHASE1 §7.3]`

Политика по `MpError.kind` (контракт ошибок из `[PHASE1 §5.1]`):

| kind | HTTP | Поведение |
|---|---|---|
| `auth` | 401/403 | **НЕ retry.** `integrations.status='invalid_token'` + `notifications`; **отмена всех** `sync_jobs` этого МП/org (`status='cancelled'`, отдельная транзакция). `mapping`-статусы не сбрасываются `[PHASE1 §7.3, E7]` |
| `validation` | 422 | **НЕ retry.** Целевая сущность → `status='error'`, `last_error.field`; `sync_jobs.status='failed'` `[PHASE1 §7.3, E1]` |
| `rate_limit` | 429 | **Retry** с `retry_after_ms`; `attempts++`; до `max_attempts` `[PHASE1 §7.3]` |
| `server` / `network` | 5xx / timeout | **Экспоненциальный backoff** с jitter; до `max_attempts` |

**Формула backoff** (для server/network; для rate_limit — `retry_after`):
```text
base      = 1s
factor    = 2
attempt_n delay = min(base * factor^(n-1), cap) + jitter
cap       = 300s (5 мин)
jitter    = random(0, base * factor^(n-1) * 0.5)   # full jitter
max_attempts = 5 (default; per-op настраивается: import_orders=8)
# delays для server-error: 1s, 2s, 4s, 8s, 16s (+jitter), затем dead-letter
```

### 5.8. Идемпотентность (не дублировать публикацию/обновление) `[DATA_MODEL §примечания 15]`

1. **Уровень задачи:** `sync_jobs.idempotency_key = sha256(op + marketplace +
   target_id + hash(payload))`, UNIQUE. Повторное создание той же задачи (двойной
   клик, ретрай запроса) → catch conflict → вернуть существующую, новую не
   создавать `[PHASE1 §7.2]`.
2. **Уровень адаптера:** повторная публикация существующей карточки = обновление
   (WB `cards/upload` с `nmID`; Ozon `product/update`) — идемпотентно по
   `remote_id`/`remote_article` `[PHASE1 §7.2]`.
3. **Уровень сущности (бизнес-ключ):** напр. заказы — `UNIQUE(organization_id,
   marketplace, external_number)` → повторный импорт не создаёт дубль заказа
   `[DATA_MODEL §примечания 15]`.
4. **Гарант единственного исполнителя:** `SELECT … FOR UPDATE SKIP LOCKED` +
   переход в `running` — две задачи с одним `target_id+mp` не исполняются
   одновременно (вторая ждёт / no-op по idempotency) `[PHASE1 E13]`.

### 5.9. Dead-letter

- При `attempts >= max_attempts` и ошибке retryable → `sync_jobs.status='failed'`
  (это и есть «dead-letter» в DB-очереди: задача не теряется, видна в мониторинге,
  не диспетчеризуется). Дополнительно — запись в `sync_job_attempts` (см. §9) с
  полным контекстом каждой попытки.
- **Алерты:** рост `failed` выше порога (напр. >1% за час, или >N абсолютных)
  → alertmanager → oncall `[MVP_PRD §9.2 "доля неотработанных ошибок МП ≤ 1%"]`.
- **Replay:** админ может перезапустить failed-задачу (`POST /sync-jobs/{id}/retry`)
  → сброс `attempts=0`, `status='queued'`, `next_attempt_at=now()`.

### 5.10. SLA очереди `[MVP_PRD §9.2]`

- Автоимпорт FBS-заказов: латентность **≤ 2 мин** от появления заказа в МП до
  импорта `[MVP_PRD §9.2, MVP_PRD §10.4.5]`.
- Отправка цены/остатка на МП: **≤ 1 мин** `[MVP_PRD §9.2]`.
- Надёжность: **≥ 99%** успешно доставленных операций (с retry); доля
  неотработанных ошибок МП **≤ 1%** `[MVP_PRD §9.2]`.
- Ни одного «провала» из-за 429/throttling: очереди + backoff + дневной
  счётчик WB `[MVP_PRD §9.2, AC-12 PHASE1]`.

### 5.11. Псевдокод воркера (stack-agnostic)

```text
function workerLoop():
    while not shutdown:
        jobs = claimJobs(batch_size=10)        # SELECT...FOR UPDATE SKIP LOCKED (§5.4)
        if jobs.empty():
            sleep(backoffPoll())               # 1s..5s
            continue
        for job in jobs:
            processJob(job)

function processJob(job):
    ctx = buildCtx(job)                         # account_id, org_id, mp, op, payload
    correlation_id = job.id                     # для tracing
    try:
        # 0. throttle-gate (§5.6)
        wait_ms = throttle.peek(job.throttle_key)   # Redis token-bucket
        if wait_ms > 0:
            requeue(job, next_attempt_at = now() + wait_ms)   # status=queued
            return
        # 1. проверить валидность токена (кэш) — иначе массовая отмена
        if integration(job).status == 'invalid_token':
            cancel(job, reason='invalid_token'); return
        # 2. загрузить секрет (decrypt via Vault/KMS) — §6
        creds = secretStore.decrypt(integration(job).credentials_enc, kid)
        adapter = adapterFactory.get(job.marketplace)   # stub в Фазе 0
        # 3. daily-quota gate (WB 1000/день) для op=publish_card(new)
        if job.op == 'publish_card' and job.payload.is_new:
            if dailyQuotaExhausted(job.org, 'wb_new_cards'):
                requeue(job, next_attempt_at = nextDay00_00MSK())   # §5.6
                return
        # 4. исполнить
        result = adapter.execute(op=job.op, ctx, creds, job.payload)
        # 5. успех
        markCompleted(job, result)              # status=completed, finished_at
        writeAudit(job, action=auditAction(job.op), delta=result.delta)
        emitMetric('sync_success', op=job.op, mp=job.marketplace)
    catch e as MpError:
        record = {http_status, kind, code, message, field, retry_after, retryable, raw}
        sync_job_attempts.insert({job_id, attempt=job.attempts, error=record, ts=now()})
        if record.kind == 'auth':               # 401/403 — массовая отмена
            invalidateIntegration(job.org, job.marketplace, reason=record)
            cancelBatch(org, mp, reason='invalid_token')   # §5.7
            notifyInvalidToken(job.org, job.marketplace)   # notifications
        elif record.retryable and job.attempts < job.max_attempts:
            delay = record.kind == 'rate_limit'
                       ? record.retry_after
                       : expBackoff(job.attempts)      # §5.7
            requeue(job, last_error=record, next_attempt_at = now()+delay)
            emitMetric('sync_retry', op, mp, attempt=job.attempts)
        else:                                   # non-retryable или attempts>=max
            markFailed(job, last_error=record)   # dead-letter (§5.9)
            emitMetric('sync_failed', op, mp, kind=record.kind)
            alertIfThresholdExceeded()           # §8
    catch e as Panic:                            # воркер-ошибка, не МП
        record = {kind='internal', message=str(e), retryable=true}
        requeueOrLeaseRecover(job, record)       # leave for reaper if crash
```

> **Stub-адаптер (`EchoAdapter`) для Фазы 0:** реализует `execute()` так: с
> заданной вероятностью возвращает `success` / `rate_limit(429)` /
> `validation(422)` / `server(500)` / `auth(401)` — конфигурируемо per-op.
> Позволяет **тестировать retry/backoff/throttle/quota/dead-letter без реального
> МП** (см. AC-4..AC-8 в §12).


---

## 6. Хранилище секретов (шифрование ключей WB/Ozon at rest) `[NFR-3, FR-I1, DATA_MODEL §примечания 14]`

### 6.1. Схема: envelope encryption

```text
┌─────────────────────────────────────────────────────────────────┐
│  KMS / Vault (transit)                                          │
│   master_key_v1 (никогда не покидает KMS; аудит доступа)        │
│   master_key_v2 (после ротации)                                 │
└─────────────────────────────────────────────────────────────────┘
                │ GenerateDataKey / Decrypt
┌───────────────▼─────────────────────────────────────────────────┐
│  Application (IntegrationSvc / worker)                          │
│   1. integrate: data_key = KMS.generateDataKey(master_kid)      │
│      -> plaintext_data_key (in-memory, TTL), ciphertext_data_key │
│   2. encrypt: credentials_enc = AES-256-GCM(plaintext_data_key, │
│                     jsonb{api_token | client_id+api_key}, aad)   │
│   3. store: integrations.credentials_enc (bytea) +              │
│             credentials_data_key_enc (bytea, обёрнутый data-key)│
│             credentials_kid (text, id master-ключа для ротации)  │
└─────────────────────────────────────────────────────────────────┘
```

- **Master key** живёт в Vault/KMS, **никогда** не попадает в БД/код/логи. Доступ
  к нему — через audit-логируемый KMS-API `[best-practice]`.
- **Data key (DEK)** генерируется per-запись (per-integration), шифрует
  `credentials` через AES-256-GCM (с AAD = `organization_id + service` — защита
  от подмены контекста). Обёрнутый (зашифрованный master-ключом) DEK хранится
  рядом (`credentials_data_key_enc`).
- Воркер при исполнении задачи: `KMS.decrypt(wrapped_DEK)` → plaintext DEK в
  памяти на время вызова адаптера → `AES.decrypt(credentials_enc, DEK)` →
  удалить DEK из памяти после `[best-practice]`.

### 6.2. Ротация master key `[onboarding §cap 37, PHASE1 §D5]`

- `integrations.credentials_kid` хранит текущий `kid` (напр. `mk_v1`).
- Ротация: новый `mk_v2` в KMS → background-джоб перебирает записи со старым
  `kid`, расшифровывает старым master, перешифровывает DEK новым (`kid=mk_v2`).
  Без простоя (старый `kid` остаётся валидным в KMS до завершения миграции).
- Срок действия WB-токенов ограничен → регулярная ротация + уведомления при
  `invalid_token` `[FR-I3, MVP_PRD §7.2]`.

### 6.3. Доступ воркеров

- Воркеры авторизуются в KMS через сервисный аккаунт с политикой
  `decrypt` только для нужных `kid`; audit-логируется каждый `decrypt`.
- В логах **никогда** не появляется plaintext-токен (redaction в structured
  logging: поля `api_token`, `api_key`, `Authorization` → `[REDACTED]`).
- `probeToken()` адаптера проверяет валидность (401/403 →
  `integrations.status='invalid_token'`) `[FR-I3]`.

---

## 7. Аудит-лог `[FR-O5, DATA_MODEL §Обзор п.6, §примечания 17]`

### 7.1. Свойства

- **Append-only:** `INSERT` only; нет `UPDATE`/`DELETE` через RLS/триггер
  (запрет на уровне роли app; backup-роль для retention-чистки). Защита от
  изменения: `REVOKE UPDATE, DELETE ON audit_log FROM app_role;`
- **Кто/когда/что:** `user_id` (NULL=system), `account_id`, `organization_id`,
  `entity_type`, `entity_id`, `action`, `delta` (diff старое/новое в jsonb),
  `ts`, `correlation_id` (для связи с `sync_jobs`/request), `ip`, `user_agent`
  `[FR-O5, onboarding §cap 28]`.

### 7.2. Аудируемые события `[FR-O5, onboarding §cap 28]`

- **Auth:** `signup`, `login`, `login_failed`, `logout`, `password_reset`,
  `role_assigned`, `role_revoked`.
- **Организации/сотрудники:** `org_create`, `org_update`, `org_delete` (с кодом
  email `[W13]`), `org_restore`, `member_invite`, `member_role_change`.
- **Интеграции:** `integration_save`, `integration_status_change` (→
  `invalid_token`).
- **Бизнес-операции (через sync_jobs):** `publish`, `unpublish`, `import`,
  `stock_update`, `price_update`, `order_assemble`, `order_close`, `order_label`
  `[FR-O5, PHASE1 §7.4]`.
- **Каждое завершение `sync_jobs`:** success/fail пишет `audit_log` через
  `AuditWriter` в той же транзакции, что и `status`-обновление `[PHASE1 §7.4]`.

### 7.3. Структура записи

```sql
-- схема в §9
audit_log(account_id, user_id, organization_id, entity_type, entity_id,
          action, delta jsonb, correlation_id, ip, user_agent, ts)
```

### 7.4. Retention `[DATA_MODEL §примечания 17]`

- Аудит действий сотрудников — **длительно** (минимум 1 год; соответствует
  «истории действий персонала» `[onboarding §cap 28]`).
- История отправки остатков — **3 месяца** `[DATA_MODEL §примечания 17]`.
- Партиционирование `audit_log` по месяцам (`PARTITION BY RANGE (ts)`) для
  эффективного retention (drop старых партиций) `[best-practice]`.

---

## 8. Наблюдаемость `[MVP_PRD §9.2]`

### 8.1. Structured logging

- JSON-логи на stdout: `ts, level, service, correlation_id, account_id?,
  organization_id?, user_id?, sync_job_id?, mp?, op?, msg, fields...`.
- **Redaction** секретов/PII (`api_token`, `api_key`, `password`,
  `Authorization`, `phone` частично) — на уровне log-pipeline `[§6.3]`.
- Уровни: `ERROR` (fail задачи, 5xx), `WARN` (retry, throttle, invalid_token),
  `INFO` ( lifecycle задачи, бизнес-события), `DEBUG` (dev only).

### 8.2. Метрики (Prometheus-совместимые)

| Метрика | Тип | Порог алерта |
|---|---|---|
| `sync_queue_depth{mp,status}` | gauge | `queued` растёт монотонно > N мин → warn |
| `sync_jobs_total{op,mp,status}` | counter | `failed`/total > 1% за час → `[§9.2]` |
| `sync_job_duration_seconds{op,mp}` | histogram | p95 > SLA (2 мин orders / 1 мин stock) → page |
| `sync_throttle_waits_total{mp}` | counter | всплеск → warn (узкое место RPS) |
| `sync_retry_total{op,mp,kind}` | counter | `rate_limit`-retry рост → квоты |
| `sync_dlq_total{op,mp}` (dead-letter) | counter | любой рост > N/час → page |
| `sync_invalid_token{mp}` | gauge | >0 → warn (требует внимания селлера) |
| `http_request_duration_seconds{route,status}` | histogram | p95 > 2с (`/products`) → `[§9.2]` |
| `auth_login_total{result}` | counter | `failed` всплеск → brute-force alert |
| `kms_decrypt_total{kid,result}` | counter | error → page |

### 8.3. Tracing

- **OpenTelemetry**, correlation-id генерируется в API-шлюзе, пробрасывается в
  воркер через `sync_jobs.correlation_id`, в адаптер и исходящий HTTP-вызов к МП
  (заголовок `X-Request-Id`). Связывает: API-запрос → создание sync_job →
  исполнение воркером → вызов МП → результат `[best-practice]`.

### 8.4. Алерты `[MVP_PRD §9.2]`

- SLA-нарушения: p95-латентность `import_orders` > 2 мин; `update_stock` > 1 мин.
- Рост dead-letter: `sync_dlq_total` rate > порог.
- Невалидные токены: `sync_invalid_token > 0` (селлер должен обновить).
- Деградация: `sync_queue_depth{status=queued}` не убывает > 10 мин (воркеры
  упали / тред-блокировка).

---

## 9. Схема БД Foundation (PostgreSQL DDL)

> Согласовано с Фазой 1 `[AC-PH1]`: таблицы `accounts`, `organizations`,
> `integrations`, `sync_jobs`, `audit_log`, `notifications` определены здесь и
> **без изменений** переиспользуются в `PHASE1 §3.2`. UUID PK, `timestamptz`,
> jsonb для вариативных полей `[DATA_MODEL §примечания 1,2]`.

```sql
-- ===================== TENANCY ROOT =====================
CREATE TABLE accounts (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email               text NOT NULL UNIQUE,           -- логин [DATA_MODEL §Account]
    phone               text,
    password_hash       text NOT NULL,                  -- Argon2id
    two_factor_enabled  boolean NOT NULL DEFAULT false, -- [onboarding §cap 12]
    max_sessions        integer NOT NULL DEFAULT 2,     -- лимит устройств [FR-O6]
    timezone            text NOT NULL DEFAULT 'Europe/Moscow', -- [NFR-5]
    referral_link       text,
    status              text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','suspended','deleted')),
    deleted_at          timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_accounts_status ON accounts(status) WHERE deleted_at IS NULL;

-- ===================== СЕССИИ (лимит 2) [FR-O6] =====================
CREATE TABLE sessions (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id          uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    refresh_token_hash  text NOT NULL,                  -- хеш refresh (reuse-detection)
    device_info         text,
    ip                  inet,
    user_agent          text,
    active              boolean NOT NULL DEFAULT true,
    created_at          timestamptz NOT NULL DEFAULT now(),
    expires_at          timestamptz NOT NULL,
    revoked_at          timestamptz,
    last_seen_at        timestamptz
);
CREATE INDEX idx_sessions_account_active ON sessions(account_id, active, created_at DESC);

-- TOTP-секреты (2FA; шифруются как секреты) [onboarding §cap 12]
CREATE TABLE totp_secrets (
    account_id      uuid PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    secret_enc      bytea NOT NULL,                     -- AES-256-GCM
    secret_data_key_enc bytea NOT NULL,                 -- обёрнутый DEK
    secret_kid      text NOT NULL,
    recovery_codes_hash text[] NOT NULL DEFAULT '{}',
    enabled_at      timestamptz NOT NULL DEFAULT now()
);

-- ===================== ОРГАНИЗАЦИИ =====================
CREATE TABLE organizations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    inn             text NOT NULL,
    name            text NOT NULL,
    legal_address   text,
    bank_requisites jsonb NOT NULL DEFAULT '{}'::jsonb,
    tax_system      text NOT NULL CHECK (tax_system IN ('USN_Income','USN_Income_Expenses','OSNO')),
    -- тумблеры организации [FR-I4, onboarding §settings]
    flags           jsonb NOT NULL DEFAULT '{
        "sync_stocks": false,
        "auto_import_orders": false,
        "quick_fbo_import": false,
        "fbo_min_threshold": 0
    }'::jsonb,
    default_brand_id        uuid,        -- -> brands(id) (Фаза 1)
    default_manufacturer_id uuid,        -- -> manufacturers(id) (Фаза 1)
    min_fbs_stock           integer NOT NULL DEFAULT 0,
    max_fbs_stock           integer,
    status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','archived','deleted')),
    deleted_at      timestamptz,         -- мягкое удаление [DATA_MODEL §примечания 18]
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (account_id, inn)
);
CREATE INDEX idx_organizations_account ON organizations(account_id) WHERE deleted_at IS NULL;

-- ===================== РОЛИ + ПРАВА =====================
CREATE TABLE roles (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code        text NOT NULL UNIQUE,    -- 'admin','product_manager',... [onboarding §cap 24]
    name        text NOT NULL,           -- "Администратор", ...
    permissions jsonb NOT NULL DEFAULT '{}'::jsonb,  -- матрица resource×action [§4.3.2]
    is_system   boolean NOT NULL DEFAULT true,       -- предустановленные роли (не удалять)
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- ===================== ПОЛЬЗОВАТЕЛИ + ЧЛЕНСТВО =====================
CREATE TABLE users (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id  uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    full_name   text NOT NULL,
    login       text NOT NULL,
    password_hash text NOT NULL,         -- Argon2id
    phone       text,
    email       text,
    position    text,                    -- должность [onboarding §сущность Position]
    active      boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (account_id, login)
);
CREATE INDEX idx_users_account ON users(account_id) WHERE active=true;

-- Членство: пользователь ↔ (набор организаций | все) + роль + scope/флаги
CREATE TABLE memberships (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id         uuid NOT NULL REFERENCES roles(id),
    -- org_scope: 'all' или конкретный набор [onboarding §cap 25]
    org_scope       jsonb NOT NULL DEFAULT '"all"'::jsonb,  -- "all" | [uuid,...]
    brand_scope     jsonb NOT NULL DEFAULT '[]'::jsonb,     -- []=все бренды | [uuid,...]
    flag_can_publish_cards          boolean NOT NULL DEFAULT false,  -- [onboarding §cap 25]
    flag_can_assemble_without_scan  boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, account_id)    -- одна роль на пользователя в рамках аккаунта (MVP)
);
CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_account ON memberships(account_id);

-- ===================== ИНТЕГРАЦИИ (ключи WB/Ozon, зашифрованные) =====================
-- [NFR-3, FR-I1, DATA_MODEL §примечания 14, PHASE1 §3.2]
CREATE TABLE integrations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    service         text NOT NULL CHECK (service IN ('wildberries','ozon')),
    status          text NOT NULL DEFAULT 'not_configured'
                    CHECK (status IN ('not_configured','configured','partially_configured','invalid_token')),
    credentials_enc bytea,                 -- AES-256-GCM(jsonb{api_token | client_id+api_key})
    credentials_data_key_enc bytea,        -- обёрнутый DEK (envelope)
    credentials_kid text,                  -- master-key id для ротации [§6.2]
    store_fingerprint text,                -- SHA-256(токена/client_id) — "1 магазин=1 аккаунт" [§3.5]
    scheme          text CHECK (scheme IN ('FBS','FBO')),   -- MVP: FBS
    token_checked_at timestamptz,
    deleted_at      timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    -- правило "1 организация = 1 ключ API МП" [FR-O3, INTEGRATIONS §13]
    UNIQUE (organization_id, service)
);
-- "один магазин — один аккаунт" (повторное подключение блокируется) [§3.5]
CREATE UNIQUE INDEX uq_integration_store_fingerprint
    ON integrations(store_fingerprint)
    WHERE store_fingerprint IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_integrations_org ON integrations(organization_id, service);

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

-- ===================== ЕДИНАЯ ОЧЕРЕДЬ СИНХРОНИЗАЦИИ (риск №1) =====================
-- [DATA_MODEL §BackgroundTask, MVP_PRD §10.1, PHASE1 §3.2 — AC-PH1]
CREATE TABLE sync_jobs (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id        uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    marketplace       text NOT NULL CHECK (marketplace IN ('wildberries','ozon')),

    op                text NOT NULL CHECK (op IN (
                          'publish_card','unpublish_card','upload_media',
                          'import_cards','update_attrs',
                          'update_stock','update_price','import_orders','fetch_finance'
                          -- Фазы 1/2/3/5 добавляют свои op; в Фазе 0 реально тестируются stub-op
                      )),
    target_type       text NOT NULL CHECK (target_type IN
                          ('product_sku','product','media','import_job','stock_item','price','order')),
    target_id         uuid NOT NULL,

    idempotency_key   text NOT NULL,        -- sha256(op+mp+target+hash(payload)) [§5.8]
    payload           jsonb NOT NULL DEFAULT '{}'::jsonb,
    throttle_key      text NOT NULL,        -- напр. 'wildberries:org:<id>' [§5.6]

    status            text NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued','running','completed','failed','cancelled')),
    priority          integer NOT NULL DEFAULT 5,    -- 1..10 [§5.5]
    attempts          integer NOT NULL DEFAULT 0,
    max_attempts      integer NOT NULL DEFAULT 5,
    last_error        jsonb,                -- MpError {http_status,kind,code,message,field,retry_after,retryable,raw}
    next_attempt_at   timestamptz NOT NULL DEFAULT now(),  -- backoff
    lease_expires_at  timestamptz,          -- reaper: возврат зависших running
    started_at        timestamptz,
    finished_at       timestamptz,
    initiated_by      uuid,                 -- -> users(id); NULL = system/cron
    correlation_id    uuid,                 -- tracing
    created_at        timestamptz NOT NULL DEFAULT now(),

    UNIQUE (idempotency_key)                -- защита от дублей [§5.8]
);
CREATE INDEX idx_syncjobs_dispatch
    ON sync_jobs(status, next_attempt_at, priority, created_at);
CREATE INDEX idx_syncjobs_org
    ON sync_jobs(organization_id, marketplace, status);

-- История попыток (dead-letter context)
CREATE TABLE sync_job_attempts (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_job_id uuid NOT NULL REFERENCES sync_jobs(id) ON DELETE CASCADE,
    attempt     integer NOT NULL,
    error       jsonb,                      -- MpError
    started_at  timestamptz NOT NULL,
    finished_at timestamptz NOT NULL,
    UNIQUE (sync_job_id, attempt)
);
CREATE INDEX idx_syncattempts_job ON sync_job_attempts(sync_job_id);

-- Дневные квоты (WB 1000 новых карточек/org) [§5.6, PHASE1 §5.2]
CREATE TABLE sync_quota_counters (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    counter_key     text NOT NULL,          -- 'wb_new_cards'
    period_date     date NOT NULL,
    used            integer NOT NULL DEFAULT 0,
    limit_value     integer NOT NULL,
    UNIQUE (organization_id, counter_key, period_date)
);

-- ===================== АУДИТ (append-only) [FR-O5] =====================
CREATE TABLE audit_log (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id         uuid,                   -- -> users(id); NULL = system
    organization_id uuid,                   -- -> organizations(id); NULL = account-level
    entity_type     text NOT NULL,          -- 'product'|'integration'|'order'|'sync_job'|...
    entity_id       uuid,
    action          text NOT NULL,          -- 'create'|'publish'|'login'|'org_delete'|...
    delta           jsonb,                  -- {from, to}
    correlation_id  uuid,
    ip              inet,
    user_agent      text,
    ts              timestamptz NOT NULL DEFAULT now()
) PARTITION BY RANGE (ts);                  -- партиции по месяцам (retention) [§7.4]
CREATE INDEX idx_audit_entity ON audit_log(account_id, entity_type, entity_id, ts DESC);
CREATE INDEX idx_audit_action ON audit_log(account_id, action, ts DESC);
-- Запрет UPDATE/DELETE для app-роли:
-- REVOKE UPDATE, DELETE ON audit_log FROM app_role;

-- ===================== OUTBOX (опц., при внешнем брокере) =====================
-- Используется ТОЛЬКО если выбран внешний брокер (Redis/RabbitMQ), чтобы
-- обеспечить exactly-once постановку в синхронной транзакции с бизнес-данными.
CREATE TABLE outbox (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    aggregate_type  text NOT NULL,
    aggregate_id    uuid NOT NULL,
    event_type      text NOT NULL,
    payload         jsonb NOT NULL,
    published       boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    published_at    timestamptz
);
CREATE INDEX idx_outbox_unpublished ON outbox(published, created_at) WHERE published=false;
-- При DB-очереди (дефолт) outbox не нужен: sync_jobs сам транзакционен.
```

### 9.1. Инварианты `[DATA_MODEL, PHASE1 §3.3]`

- `accounts 1—N organizations 1—N integrations/sync_jobs`.
- `integrations UNIQUE(organization_id, service)` → «1 org = 1 ключ API МП»
  `[FR-O3]`.
- `uq_integration_store_fingerprint` → «один магазин = один аккаунт» `[§3.5]`.
- `sync_jobs.idempotency_key` UNIQUE → нет дублей задач `[§5.8]`.
- `memberships UNIQUE(user_id, account_id)` → одна роль на пользователя (MVP);
  org/brand scope внутри `memberships`.
- Мягкое удаление: `organizations.deleted_at`; `status='deleted'` →
  cascade-очистка ключей/товаров только админом с кодом из email
  `[DATA_MODEL §примечания 18, onboarding W13]`.
- `audit_log` append-only + партиционирование + retention 1 год / 3 мес
  (история отправки остатков) `[§7.4]`.


---

## 10. Внутренний API scaffold

Соглашения: базовый путь `/api/v1`; JSON; `account_id`/`organization_id` — из
JWT/`X-Organization-Id`; единый error-envelope
`{error:{code, message, details?}}`. RBAC-guard на каждом эндпоинте
(`PermissionService.can`); rate-limit на API (per-IP + per-account) `[§11]`.

### 10.1. Auth `[FR-O1, FR-O6]`

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/auth/register` | `{email, phone, password}` → `201 {access, refresh, account}`. SLA ≤ 30с `[FR-O1]`. `409` если email занят. |
| `POST` | `/auth/login` | `{email, password}` → `200 {access, refresh}`; enforce лимит 2 сессии. `401` неверные данные. `429` brute-force rate-limit. |
| `POST` | `/auth/refresh` | `{refresh}` → `200 {access, refresh}` (rotation + reuse-detection). `401` при reuse → инвалидация цепочки. |
| `POST` | `/auth/logout` | → `204`; отзыв сессии. |
| `POST` | `/auth/password/reset` | `{email}` → `202` (email со ссылкой, TTL 30 мин). `[W7]` |
| `POST` | `/auth/password/reset/confirm` | `{token, new_password}` → `204`. |
| `POST` | `/auth/2fa/enable` | (best-effort) включает TOTP, возвращает QR + recovery codes. `[onboarding §cap 12]` |
| `POST` | `/auth/2fa/verify` | `{code}` → подтверждение. |
| `GET` | `/me` | → `200 {account, active_org, memberships, flags}`. |

### 10.2. Организации `[FR-O3, onboarding W11/W13]`

| Метод | Путь | RBAC | Описание |
|---|---|---|---|
| `POST` | `/organizations` | `admin` | `{inn, ...}` → `201 {organization}`; автозаполнение по ИНН. `[W11]` |
| `GET` | `/organizations` | role-scope | список (+ архивные по флагу). |
| `GET` | `/organizations/{id}` | scope-check | детали. |
| `PATCH` | `/organizations/{id}` | `admin` | обновление полей/тумблеров `flags`. `[FR-I4]` |
| `DELETE` | `/organizations/{id}` | `admin` | мягкое удаление с подтверждением кодом из email (`X-Confirm-Code`). `[W13]` |
| `POST` | `/organizations/{id}/restore` | `admin` | восстановление мягко удалённой. `[W14]` |

### 10.3. Сотрудники и роли `[FR-O4, onboarding W17]`

| Метод | Путь | RBAC | Описание |
|---|---|---|---|
| `GET` | `/organizations/{id}/members` | `admin` | список сотрудников в org. |
| `POST` | `/organizations/{id}/members` | `admin` | invite: `{full_name, login, password, role_code, org_scope, brand_scope, flags}`. `[W17]` |
| `PATCH` | `/organizations/{id}/members/{uid}` | `admin` | смена роли/scope/флагов. `[W18]` |
| `DELETE` | `/organizations/{id}/members/{uid}` | `admin` | удалить сотрудника. `[W18]` |
| `GET` | `/roles` | any | справочник ролей + `permissions`. |

### 10.4. Интеграции `[FR-I1, FR-I2, FR-I3]`

| Метод | Путь | RBAC | Описание |
|---|---|---|---|
| `GET` | `/integrations` | role-scope | статусы интеграций по org `[§cap 3]`. |
| `PUT` | `/integrations/{orgId}/{service}` | `admin` | `{api_token? | {client_id, api_key}, scheme?}` → шифрование + `probeToken()` → `200 {integration:{status}}`. `409 store_already_linked`. |
| `POST` | `/integrations/{orgId}/{service}/probe` | `admin` | принудительная проверка токена. |
| `GET` | `/notifications` | any | уведомления (невалидный токен). `[FR-I3]` |
| `PATCH` | `/notifications/{id}/read` | any | пометить прочитанным. |

### 10.5. Очередь синхронизации (мониторинг/отладка) `[FR-O5, §5]`

| Метод | Путь | RBAC | Описание |
|---|---|---|---|
| `GET` | `/sync-jobs` | `admin` | query: `organization_id, marketplace, status, op, page` → список. |
| `GET` | `/sync-jobs/{id}` | `admin` | детали + `sync_job_attempts`. |
| `POST` | `/sync-jobs/{id}/retry` | `admin` | перезапуск failed (сброс attempts). `[§5.9]` |
| `POST` | `/sync-jobs/stub/enqueue` | (dev/test) | тестовый эндпоинт для постановки stub-задачи (EchoAdapter) — для AC Фазы 0 без реального МП. |

### 10.6. Аудит `[FR-O5]`

| Метод | Путь | RBAC | Описание |
|---|---|---|---|
| `GET` | `/audit` | `admin` | query: `entity_type, entity_id, action, from, to, page` → история. `[FR-O5]` |

### 10.7. Health/readiness

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/health` | liveness: `200 {status:'ok'}`. |
| `GET` | `/ready` | readiness: проверка БД/Redis/KMS; `503` если зависимость down (для LB). |
| `GET` | `/metrics` | Prometheus (если не отдельный порт). |

---

## 11. Security baseline (OWASP top-10 минимум)

| Угроза (OWASP) | Митигация в Фазе 0 |
|---|---|
| **A01 Broken Access Control** | RBAC-guard на каждом эндпоинте (`PermissionService.can`); tenant-resolver; RLS как defence-in-depth; проверка `organization_id ∈ org_scope` `[§3.3, §4.4]` |
| **A02 Cryptographic Failures** | AES-256-GCM envelope для ключей МП `[§6]`; Argon2id для паролей; TLS 1.2+ everywhere; HSTS; redaction секретов в логах `[§8.1]` |
| **A03 Injection** | parameterized queries (никакой конкатенации SQL); ORM/query-builder; валидация входов (OpenAPI schema / class-validator) |
| **A04 Insecure Design** | threat-modeling на ключевые потоки (auth, queue, secret-store); principle of least privilege для сервисных аккаунтов KMS |
| **A05 Security Misconfiguration** | секреты в Vault/env, не в коде/репо; `REVOKE UPDATE,DELETE ON audit_log`; disabled default credentials; security headers (CSP, X-Frame-Options) |
| **A07 Auth Failures** | rate-limit на login (`429` + экспоненциальный backoff + CAPTCHA при повторных); rotation + reuse-detection refresh; лимит 2 сессии `[§4.2]`; 2FA (готовность) |
| **A08 Data Integrity Failures** | подпись JWT (RS256); проверка `aud`/`iss`/`exp`; неприоритетных Claims отклоняются |
| **A09 Logging/Monitoring Failures** | structured audit + sync metrics + alerts `[§7, §8]` |
| **A10 SSRF** | исходящие вызовы только к whitelist доменов WB/Ozon (в адаптерах Фазы 1); нет пользовательских URL в server-side fetch на Фазе 0 |

- **Rate limiting:** per-IP (напр. 100 req/мин) + per-account (напр. 600/мин);
  burst-token-bucket в Redis; `429` с `Retry-After`.
- **PII:** телефон/email хранятся, но redact в логах; экспорт аудита — только
  admin; соответствие 152-ФЗ (согласие при регистрации `[onboarding §cap 1]`).
- **Бэкапы/DR:** ежедневный pg_dump + WAL-archiving (PITR); шифрованные бэкапы в
  object storage; тест восстановления раз в квартал; RPO ≤ 1ч, RTO ≤ 4ч (target).
- **Секреты в конфиге:** `DATABASE_URL`, `JWT_PRIVATE_KEY`, `KMS_*` — env/vault,
  не git; `.env.example` без реальных значений.

---

## 12. Acceptance criteria Фазы 0 `[MVP_PRD §8 Фаза 0, §9.2]`

### 12.1. Мультиарендность

- **AC-0.1.** Запрос под аккаунтом A к `/organizations`, `/audit`, `/sync-jobs`
  **не возвращает** ни одной записи аккаунта B (автотест с 2 аккаунтами). `[NFR-1]`
- **AC-0.2.** Прямой запрос `GET /organizations/{id_B}` под аккаунтом A → `404`
  (не `403` с раскрытием существования). `[§3.3]`
- **AC-0.3.** Подключение того же WB-токена на аккаунте B (уже подключённом на A)
  → `409 store_already_linked`. `[§3.5, INTEGRATIONS §13]`

### 12.2. AuthN / сессии

- **AC-0.4.** Регистрация + вход → выдаётся access+refresh; `/me` возвращает
  корректный `account_id`. `[FR-O1]`
- **AC-0.5.** Третий логин (при 2 активных сессиях) **закрывает самую старую**;
  её refresh-токен перестаёт работать. `[FR-O6, §4.2]`
- **AC-0.6.** Reuse старого refresh-токена (после rotation) → инвалидация всей
  цепочки. `[§4.2]`
- **AC-0.7.** Сброс пароля по email-ссылке работает; токен одноразовый, TTL 30
  мин. `[W7]`

### 12.3. RBAC `[FR-O4]`

- **AC-0.8.** Пользователь с ролью `warehouse_staff` не может `POST /products`
  (create) → `403`; может `GET /products` (view). `[§4.3.2]`
- **AC-0.9.** `price_manager` не может `PUT /integrations` → `403`; может
  `PATCH /prices`. `[§4.3.2]`
- **AC-0.10.** `product_manager` без `flag_can_publish_cards` не может
  publish → `403`; с флагом — может. `[§4.3.3]`
- **AC-0.11.** Ограничение по брендам: пользователь с `brand_scope=[X]` видит в
  «Товары» только бренд X (тест на stub-данных Фазы 1 — на уровне фильтра
  репозитория). `[§4.3.3]`

### 12.4. Очередь синхронизации (риск №1)

- **AC-0.12.** Постановка stub-задачи (`POST /sync-jobs/stub/enqueue`) → задача
  появляется в `status='queued'`; воркер переводит в `running`→`completed`.
  `[§5.4, §5.11]`
- **AC-0.13 (retry).** Stub возвращает `server(500)` → задача ретраится с
  экспоненциальным backoff (1с, 2с, 4с…) до `max_attempts`; на каждой попытке
  запись в `sync_job_attempts`. `[§5.7]`
- **AC-0.14 (throttle).** Stub/config: RPS-лимит = 1/с; постановка 5 задач
  одновременно → выполняются не быстрее 1/с; лишние уходят в `queued` с
  `next_attempt_at`. `[§5.6]`
- **AC-0.15 (идемпотентность).** Двойная постановка той же задачи (одинаковый
  payload) → `idempotency_key` UNIQUE; создаётся **одна** задача. `[§5.8]`
- **AC-0.16 (auth → отмена пачки).** Stub возвращает `auth(401)` →
  `integrations.status='invalid_token'`, `notifications` создано, **все** задачи
  этого МП/org → `cancelled`. `[§5.7, FR-I3]`
- **AC-0.17 (validation → no retry).** Stub возвращает `validation(422)` → задача
  `failed` без retry; `last_error.field` заполнен. `[§5.7]`
- **AC-0.18 (dead-letter).** `attempts >= max_attempts` на retryable-ошибке →
  `failed` (dead-letter); метрика `sync_dlq_total` растёт; алерт срабатывает.
  `[§5.9]`
- **AC-0.19 (дневная квота WB).** Stub/config: лимит 1000; постановка 1001
  `publish_card(new)` → 1001-я уходит в `queued` до 00:00 МСК след. суток.
  `[§5.6, PHASE1 §5.2]`
- **AC-0.20 (приоритеты).** В очереди `import_orders` (prio 1) и `import_cards`
  (prio 7) — диспетчер забирает `import_orders` первым. `[§5.5]`
- **AC-0.21 (reaper).** Задача в `running` дольше `lease_ttl` без завершения →
  reaper возвращает в `queued`. `[§5.4]`

### 12.5. Шифрование at rest

- **AC-0.22.** Сохранение WB-токена → в `integrations.credentials_enc` лежит
  **шифр-текст** (grep по БД не находит plaintext-токен); расшифровка ключом KMS
  возвращает исходный токен. `[NFR-3, §6]`
- **AC-0.23.** Ротация master key (`mk_v1→mk_v2`) → все записи перешифрованы,
  `credentials_kid=mk_v2`; расшифровка по-прежнему работает без простоя.
  `[§6.2]`

### 12.6. Аудит `[FR-O5]`

- **AC-0.24.** На `login`, `org_create`, `integration_save`, завершение sync-job
  (success/fail) появляется запись в `audit_log` с `user_id`/`initiated_by` и
  `delta`. `[§7]`
- **AC-0.25.** `UPDATE`/`DELETE` на `audit_log` через app-роль → ошибка
  привилегий (append-only enforced). `[§7.1]`

### 12.7. Наблюдаемость / SLA

- **AC-0.26.** Метрики `sync_queue_depth`, `sync_jobs_total`, `sync_job_duration_seconds`
  экспонируются на `/metrics`; correlation-id пробрасывается из API в sync-job.
  `[§8]`
- **AC-0.27 (нагрузка).** При подаче 1000 stub-задач/мин (3 org, 2 МП) —
  средняя латентность `queued→running` < 5с; ни одна задача не теряется
  (`completed+failed+cancelled == enqueued`). `[§5.2, §9.2]`

---

## 13. Открытые вопросы / спайки (до/в первые дни кодинга)

> Источники: `[MVP_PRD §10.4]`, `[PHASE1 §12]`, `[onboarding §открытые вопросы]`.

### 13.1. Спайки (исследования с прототипом)

1. **[SPIKE] Выбор брокера очереди: DB-queue (`sync_jobs`) vs Redis Streams vs
   RabbitMQ.** Дефолт — DB-очередь (`SKIP LOCKED`). Спайк: нагрузочный тест на
   целевой пике (оценить по §5.2: ~десятки пилотов → сотни задач/мин; с запасом
   до 10⁴/мин). Критерий перехода на внешний брокер: рост `SKIP LOCKED`-latency
   или потребность в fan-out/приоритетных очередях как отдельных сущностях.
   `[§2.4, §5.2]`
2. **[SPIKE] KMS/Vault: конкретный провайдер и оверхед.** Vault transit vs
   Yandex KMS vs aws-kms-compatible. Замерить latency `GenerateDataKey`/`Decrypt`
   под целевой RPS воркеров (каждая sync-job = 1 decrypt) — кэшировать ли DEK
   short-TTL. `[§6, §8.2]`
3. **[SPIKE] Лимиты конкурентности воркеров под WB/Ozon.** Точные RPS-квоты WB
   и Ozon в комплекте не приведены `[MVP_PRD §10.4.1, PHASE1 §SPIKE-3]`. До
   реализации адаптеров (Фаза 1) — зафиксировать консервативные дефолты (напр.
   WB 5 RPS/org, Ozon 5 RPS/org) и параметры token-bucket; уточнить в Фазе 1 на
   реальных кабинетах. `[§5.6]`
4. **[SPIKE] 2FA: TOTP vs SMS.** Комплект описывает только восстановление 2FA
   через поддержку `[onboarding §открытые вопросы]`. Решить: TOTP (Google
   Authenticator) как дефолт (бесплатно, офлайн) vs SMS (платно, надёжнее для
   массового пользователя). Поле/таблица зарезервированы `[§4.1, §9]`.

### 13.2. Решения, требуемые до кодинга (продукт/архитектура)

- **D1. Уточнить матрицу прав роль×ресурс×действие** с продуктом (комплект даёт
  только качественное описание `[onboarding §открытые вопросы]`). Раздел 4.3.2 —
  рабочая проекция для MVP; валидировать и зафиксировать в `roles.permissions`.
- **D2. Канон identity: `email` = логин (уникльный) на аккаунте** (как SelSup
  `[DATA_MODEL §Account]`). Подтвердить: телефон — вторичное поле или
  обязательное? `[FR-O1]`
- **D3. Стратегия refresh-token store:** PostgreSQL `sessions` (дефолт) vs Redis.
  Дефолт — PostgreSQL (транзакционность с лимитом 2); уточнить под
  high-throughput. `[§4.2]`
- **D4. RLS: включать defence-in-depth RLS в Фазе 0 или в Hardening (Фаза 6).**
  Рекомендация: middleware-изоляция обязательна в Фазе 0; RLS — опционально,
  рекомендуется в прод-включении. `[§3.2]`
- **D5. Часовой пояс/локализация cron:** все расписания — МСК (`Europe/Moscow`)
  `[NFR-5]`; дневной счётчик WB сбрасывается в 00:00 МСК `[PHASE1 §D8]`.
- **D6. Retention аудита:** 1 год для `audit_log`, 3 мес для истории отправки
  остатков `[DATA_MODEL §примечания 17]` — подтвердить с юр./комплаенс.
- **D7. Биллинг на Фазе 0:** единый внутренний тариф/фри-триал без оплаты
  `[MVP_PRD §3.2]`; лимиты (org/сотрудники/SKU) — константы или `subscriptions`
  placeholder? Решить: `subscriptions` таблица опциональна в Фазе 0 (точка
  интеграции post-MVP). `[onboarding §cap 6-10]`
- **D8. Outbox-паттерн:** нужен только при выборе внешнего брокера. При
  DB-очереди (дефолт) — не нужен. Оставить таблицу зарезервированной. `[§9]`

### 13.3. Явно отложенное (точки интеграции зарезервированы в схеме)

- Реальные адаптеры WB/Ozon + верификация эндпоинтов — **Фаза 1** (`[PHASE1
  §SPIKE-1,2]`); контракт адаптера уже зафиксирован, Фаза 0 даёт stub.
- Связанные аккаунты клиентов (B2B-делегирование) — post-MVP; таблица
  `client_account_links` (как `[DATA_MODEL §ClientAccountLink]`) зарезервирована.
- Браузерное расширение, мобильные приложения — post-MVP; auth-only web в Фазе 0.
- Тарифы/оплата/партнёрка — post-MVP; `subscriptions` placeholder `[D7]`.

---

## Приложение A. Трассировка решений к источникам (summary)

| Решение | Источник |
|---|---|
| Мультиарендность Account→Org→Warehouse, shared schema + `account_id` | `[NFR-1]`, `[DATA_MODEL §Обзор п.1, §примечания 1]` |
| JWT(access)+refresh(rotation,reuse-detection); лимит сессий 2 | `[FR-O6]`, `[onboarding §cap 13]`, `[DATA_MODEL §Account/UserSession]` |
| 4 роли MVP + матрица прав (проекция) | `[FR-O4]`, `[onboarding §cap 23-25, §открытые вопросы]` |
| Единая очередь `sync_jobs` с retry/backoff/throttle (риск №1) | `[NFR-2]`, `[MVP_PRD §1,§10.1]`, `[DATA_MODEL §примечания 4]`, `[PHASE1 §3.2,§7.3]` |
| Идемпотентность `idempotency_key` + бизнес-ключи | `[DATA_MODEL §примечания 15]`, `[PHASE1 §7.2]` |
| Приоритеты: orders(1) > stock(2) > publish(3) > media(4) > price/attrs(5) > import(7) | `[PHASE1 §7.3]`, `[MVP_PRD §9.2]` |
| Дневная квота WB 1000 новых/день/org | `[PHASE1 §5.2, §бизправила 15]` |
| Envelope encryption AES-256 + ротация master key | `[NFR-3]`, `[FR-I1]`, `[DATA_MODEL §примечания 14]`, `[onboarding §cap 37]` |
| Аудит append-only + партиционирование + retention | `[FR-O5]`, `[DATA_MODEL §примечания 17]` |
| «Один магазин — один аккаунт» (store_fingerprint) | `[INTEGRATIONS §13]` |
| «1 организация = 1 ключ API МП» | `[FR-O3]`, `[INTEGRATIONS §принципы]` |
| Удаление org только админом с кодом из email; мягкое удаление | `[onboarding §бизправила, W13/W14]`, `[DATA_MODEL §примечания 18]` |
| Согласование имён/схемы очереди с Фазой 1 | `[PHASE1 §3.2, §7.3]` — AC-PH1 (расхождений нет) |
| Частоты обмена → нагрузка на очередь | `[MVP_PRD §7.4]`, `[integrations-marketplaces §cap 4]` |
| SLA: автоимпорт FBS ≤ 2 мин; отправка stock/price ≤ 1 мин; ≥99% доставки | `[MVP_PRD §9.2]` |


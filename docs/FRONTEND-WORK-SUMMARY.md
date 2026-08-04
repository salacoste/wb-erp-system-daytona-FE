# Frontend Work Summary

<!-- CURRENT-STATUS:START -->

**Создан**: 2026-01-30 (Backend Integration Analysis)
**Последнее обновление**: 2026-08-03
**Статус реализации**: 89 эпиков завершены; Epics 162-165 формируют текущую localhost-программу качества и продуктового завершения
**Локальный контур**: frontend `localhost:3100`; backend задаётся через `NEXT_PUBLIC_API_URL` (локальное значение по умолчанию — `http://localhost:3000`)
**Текущая проверка**: Vitest, Playwright, coverage, privacy scan, lint, type-check, format и local build smoke

## Executive Summary

Исторически отслеживаемая frontend-работа отмечена завершённой. Канонический
текущий подсчёт — 93 уникальных эпика (89 done, 2 in-progress, 2 backlog) и
5 untracked operational features в `docs/EPICS-AND-STORIES-TRACKER.md`.
Stories 127.1/127.2 реализованы; единственные явно backend-gated истории текущей
программы — 165.4 (persisted liquidity daily snapshots) и 165.5 (раздельные
report/analytics retry endpoints). Документационные Stories 165.1/165.2
подготовлены и остаются в `review` до подтверждённых PR merge и cleanup.
<!-- CURRENT-STATUS:END -->

---

## Локальный baseline 2026-08-03

- Localhost cleanup влит PR #86, merge SHA `4a24544d`; `main` синхронизирован с `origin/main`.
- Vitest: 1,047 файлов / 17,313 тестов; coverage observation — 74.56% lines и 73.41% statements.
- Успешно проверены type-check, ESLint, formatting, privacy, Orders Integrity, npm audit и production build (67/67 pages).
- Playwright обнаруживает 801 тест в 80 файлах. Полный live localhost E2E не заявлен как пройденный: во время аудита отсутствовали `.env.e2e` и сервисы на портах 3000/3100.
- Аудит E2E зафиксировал 88 owned-scope tautological assertions, 247 fixed waits и 30 bare skips; устранение разбито на Stories 162.2-162.10.

Канонические требования и 25 stories: `_bmad-output/planning-artifacts/epics-162-165-fe.md`. Исполнение — один story/branch/worktree/PR и один план в `.omx/plans/`.

### OpenWiki generation status

`openwiki/**` остаётся generated-only поверхностью и вручную не редактируется. Текущие generated pages ещё содержат устаревшие Tier-0/PM2/CI-certification и `max-warnings: 112` формулировки. Story 165.3 остаётся backlog до merge исправленных source docs; затем `.github/workflows/openwiki-update.yml` должен выполнить `npx openwiki@$OPENWIKI_VERSION code --update --print` в чистом изолированном worktree. Если provider credential недоступен, это фиксируется как blocker без ручной подмены generated output.

---

## Завершённые эпики (с 2026-01-30)

Перечислены только эпики, завершённые ПОСЛЕ создания этого документа.

### Epic 61-FE: Dashboard Data Integration (49 SP) ✅

- **Завершён**: 2026-02-02
- Revenue/profit/margin fixes, period context, 377+ tests (incl. 239 TDD bug fix tests)

### Epic 62-FE: Dashboard UI/UX Presentation (29 SP) ✅

- **Завершён**: 2026-02-02
- 8-card grid, Daily breakdown, 43 E2E tests, 28 components

### Epic 63-FE: Dashboard Business Logic Completion (36 SP) ✅

- **Завершён**: 2026-02-15
- Sales/storage/orders/expense widgets, period comparison, historical trends

### Epic 65-FE: Dashboard P&L Narrative Layout ✅

- **Завершён**: 2026-02-16
- P&L narrative 10-card layout, SimpleMetricCard pattern, flat grid, density settings

### Epic 66-FE: Tax & VAT Accounting (35 SP) ✅

- **Завершён**: 2026-02-26
- `/settings/tax`, backend tax data integration, net profit after tax, VAT support, 16-item UX audit

### Epic 68-FE: Monitoring Health Dashboard ✅

- **Завершён**: 2026-02-18
- `/monitoring` route, pipeline status, data completeness, Telegram status

### Epic 69-FE: Buyout Rate Analytics (28 SP) ✅

- **Завершён**: 2026-02-27
- `/analytics/buyout`, FBO estimated indicators, confidence badges, trends

### Epic 70-FE: Frontend Validation Fixes (13 SP) ✅

- **Stories 70.1–70.4**: ✅ Завершены 2026-02-27
- **Story 70.5**: ✅ Resolved — backend fixed funnel buyout enrichment (query-time JOIN из daily_sales_raw + orders_fbs)
- **Story 70.6**: ✅ Resolved — backend fixed liquidity endpoint (param rename + SQL fix + multi-tenancy)
- Подробности: `docs/FRONTEND-VALIDATION-REPORT.md`

### Funnel & Returns Analytics (Epic 68-71 backend requests) ✅

- **Завершены**: 2026-02-20
- `/analytics/funnel`, `/analytics/returns` — pages implemented

### Request #155: Analytical Profit/Margin ✅

- **Завершён**: 2026-02-22
- Аналитические profit/margin types, cards, operating margin formula, promotion cost splitting

---

## Ранее отмеченные пункты — текущий статус

### ~~Priority 1: Margin Polling Optimization~~ → ✅ ЗАВЕРШЕНО

- **Было**: «5-8 hours, fix infinite loop»
- **Факт**: `useMarginPollingWithQuery.ts` — TanStack Query с `refetchInterval`, 2.5s polling, max 24 attempts
- `usePendingMarginProducts.ts` — мемоизация через `productsKey`, бесконечный цикл отсутствует
- Все перечисленные файлы реализованы в source и проверяются общим локальным набором тестов; отдельной внешней сертификации нет

### ~~Priority 2.1: Telegram Notifications UI~~ → ✅ ЗАВЕРШЕНО (Epic 34-FE)

- **Было**: «❌ Not implemented, 4-6 hours»
- **Факт**: Полностью реализовано:
  - `TelegramBindingCard.tsx`, `TelegramBindingModal.tsx`, `UnbindConfirmationDialog.tsx`
  - `useTelegramBinding.ts`, `useNotificationPreferences.ts`
  - Notifications API (`src/lib/api/notifications.ts`)
  - Страница `/settings/notifications` с binding flow

### Priority 2.2: Orders Integrity Dashboard → ✅ IMPLEMENTED AND LOCALLY VALIDATED

- **Было**: «❌ Not implemented, 8-12 hours»
- **Факт**: маршрут `/orders/integrity`, компоненты, API/normalizer/hooks/types и unit-покрытие присутствуют в source.
- **Dedicated E2E**: `e2e/orders-integrity.spec.ts` проверяет локальные контракты авторизации, loading/error/empty states, шесть integrity-счётчиков и изоляцию кабинетов через обычный Playwright.
- **Проверка**: unit/integration тесты и dedicated E2E входят в локальный validation workflow; отдельного внешнего release gate нет.

### ~~Priority 3.1: Epic 40-FE Orders Module~~ → ✅ ЗАВЕРШЕНО (ранее)

- Был завершён до создания документа (2026-01-29)

### ~~Priority 3.2: Epic 51-FE FBS Historical Analytics~~ → ✅ ЗАВЕРШЕНО

- **Было**: «📋 Ready for Dev, 39 SP»
- **Факт**: `/analytics/orders` с 4 табами (overview, trends, seasonality, comparison), 365-day picker, backfill admin

### ~~Priority 3.3: Epic 53-FE Supply Management~~ → ✅ ЗАВЕРШЕНО

- **Было**: «📋 Ready for Dev, 34 SP»
- **Факт**: `/supplies` с CRUD, filters, status tracking, order picker, sticker generation, client-side sorting

### ~~Priority 3.4: Epic 24 Storage Analytics~~ → ✅ ЗАВЕРШЕНО

- **Было**: «⚠️ Partially implemented, 5 SP»
- **Факт**: `/analytics/storage` с 11 stories, SKU breakdown, top consumers, trends chart, multi-brand/warehouse filters
- Колонка хранения в таблице товаров (`ProductList.tsx`) — ✅ добавлена (фиолетовый цвет, tooltip с недельной стоимостью)

### ~~Priority 4.1: Advertising Smart Date Picker~~ → ℹ️ Не приоритетно

- Рекламная аналитика работает корректно (валидация D-18 подтвердила 100% точность)

### ~~Priority 4.2: Cache Timestamps Display~~ → ℹ️ Не реализовано

- Низкий приоритет, может быть добавлено по запросу

### ~~Priority 4.3: Validation Status Badges~~ → ℹ️ Не реализовано

- Низкий приоритет, заменено мониторинг-дашбордом (Epic 68-FE)

---

## Текущие backend-gated задачи

Requests #210 (buyout daily) и #211 (returns daily) доставлены и интегрированы:
`src/lib/api/buyout-daily.ts`, `src/hooks/use-buyout-daily.ts`,
`src/lib/api/returns-daily.ts`, `src/hooks/use-returns-daily.ts`, соответствующие
charts/page integration и тесты присутствуют в source.

Отложены только две новые истории:

- **165.4** — активировать liquidity trends после появления непустых persisted daily snapshots за несколько дат.
- **165.5** — добавить раздельный retry для report/analytics после появления отдельных backend endpoints.

~~D-12: Funnel buyoutCount=0~~ — ✅ Исправлено бекендом (2026-02-27): query-time buyout enrichment из `daily_sales_raw` + `orders_fbs`. Commit `39e47fa`.

~~D-14: Liquidity 500~~ — ✅ Исправлено бекендом (2026-02-27): `liquidity_filter` → `category_filter`, SQL fix `category` → `subject`, multi-tenancy leak fixed. Commit `d36a840`.

---

## Оставшийся бэклог

| Приоритет | Задача                            | Оценка | Статус                            |
| --------- | --------------------------------- | ------ | --------------------------------- |
| **P1**    | Local E2E reliability (Epic 162)  | epic   | 📋 1 done + 9 backlog             |
| **P1**    | Operator workflows (Epic 163)     | epic   | 📋 6 backlog                      |
| **P2**    | Boundary/maintenance debt (164)   | epic   | 📋 4 backlog                      |
| **P2**    | OpenWiki regeneration (165.3)     | story  | 📋 After 165.1/165.2 source merge |
| **P2**    | Liquidity daily trends (165.4)    | gated  | ⏸ Deferred: backend snapshots     |
| **P2**    | Per-status backfill retry (165.5) | gated  | ⏸ Deferred: backend endpoints     |
| **P4**    | Cache Timestamps Display          | 1h     | ℹ️ Optional                       |

---

## Recent Sprint: Epics 120-131 (June 2026)

| Epic   | Description                 | Key Deliverables                                               |
| ------ | --------------------------- | -------------------------------------------------------------- |
| 120-FE | Marketing Hub Redesign      | Hub page, product analytics, organic/paid split (7 stories)    |
| 121-FE | Alerts & Recommendations    | Alert rules dialog, pricing recommendations, reorder dashboard |
| 122-FE | Product Analytics Funnel    | Funnel + price history + E2E tests                             |
| 123-FE | AI Admin Polish             | 6 stories, 7 backend requests resolved                         |
| 124-FE | Test Coverage Flush         | 2,737 TODO stubs → real tests (13,533 total)                   |
| 125-FE | Zero-Test Route Coverage    | 247 baseline tests for 11 uncovered routes                     |
| 126-FE | Housekeeping                | Stale markers, E2E, edge-case tests                            |
| 127-FE | Marketing Phase 3           | Six delivered stories, including buyout/returns daily trends   |
| 128-FE | TypeScript Cleanup          | 64 TS errors → 0, 15 over-cap files → 0                        |
| 129-FE | FBS Enhanced Reconciliation | Real backend contract rewrite (14,064 tests)                   |
| 130-FE | E2E Smoke Tests             | 33 E2E tests for 6 core analytics routes                       |
| 131-FE | Documentation Catch-Up      | Radix jsdom patterns, retro actions                            |

---

## Полная таблица эпиков

| Epic   | Название                          |  SP | Статус         | Дата                  |
| ------ | --------------------------------- | --: | -------------- | --------------------- |
| 1-FE   | Foundation & Authentication       |   — | ✅ Complete    | —                     |
| 2-FE   | Onboarding & Initial Data Setup   |   — | ✅ Complete    | —                     |
| 3-FE   | Dashboard & Financial Overview    |   — | ✅ Complete    | —                     |
| 4-FE   | COGS Management & Margin Analysis |   — | ✅ Complete    | —                     |
| 5-FE   | COGS History Management           |   — | ✅ Complete    | —                     |
| 6-FE   | Advanced Analytics & Reporting    |   — | ✅ Complete    | —                     |
| 24-FE  | Paid Storage Analytics UI         |   — | ✅ Complete    | —                     |
| 33-FE  | Advertising Analytics UI          |   — | ✅ Complete    | —                     |
| 34-FE  | Telegram Notifications UI         |   — | ✅ Complete    | —                     |
| 36-FE  | Product Card Linking UI           |   — | ✅ Complete    | —                     |
| 37-FE  | Merged Group Table Display UI     |   — | ✅ Complete    | —                     |
| 40-FE  | Orders UI & WB Status History     |  26 | ✅ Complete    | 2026-01-29            |
| 42-FE  | Task Handlers Adaptation          |   — | ✅ Complete    | —                     |
| 44-FE  | Price Calculator UI               |   — | ✅ Complete    | —                     |
| 51-FE  | FBS Historical Analytics (365d)   |  39 | ✅ Complete    | 2026-02               |
| 52-FE  | Tariff Settings Admin UI          |   — | ✅ Complete    | —                     |
| 53-FE  | Supply Management UI              |  34 | ✅ Complete    | 2026-02               |
| 61-FE  | Dashboard Data Integration        |  49 | ✅ Complete    | 2026-02-02            |
| 62-FE  | Dashboard UI/UX Presentation      |  29 | ✅ Complete    | 2026-02-02            |
| 63-FE  | Dashboard Business Logic          |  36 | ✅ Complete    | 2026-02-15            |
| 65-FE  | Dashboard P&L Layout              |   — | ✅ Complete    | 2026-02-16            |
| 66-FE  | Tax & VAT Accounting              |  35 | ✅ Complete    | 2026-02-26            |
| 68-FE  | Monitoring Health Dashboard       |   — | ✅ Complete    | 2026-02-18            |
| 69-FE  | Buyout Rate Analytics             |  28 | ✅ Complete    | 2026-02-27            |
| 70-FE  | Validation Fixes                  |  13 | ✅ Complete    | 2026-02-27            |
| 127-FE | Marketing Phase 3                 |   — | ✅ Complete    | 2026-08-03 reconciled |
| 162-FE | Trustworthy Local Validation      |   — | 🚧 In progress | 2026-08-03            |
| 163-FE | Complete Operator Workflows       |   — | 📋 Backlog     | 2026-08-03            |
| 164-FE | Frontend Boundaries & Maintenance |   — | 📋 Backlog     | 2026-08-03            |
| 165-FE | Truthful Status & Backend Backlog |   — | 🚧 In progress | 2026-08-03            |

**Orders Integrity реализован и покрыт source/unit плюс dedicated local Playwright spec.**

---

## Open Questions (обновлено)

| #   | Вопрос                            | Исходный статус   | Текущий статус                                        |
| --- | --------------------------------- | ----------------- | ----------------------------------------------------- |
| 1   | Orders Analytics Backend Endpoint | To verify         | ✅ Верифицировано, работает                           |
| 2   | WB Status Translations            | Frontend mapping? | ✅ Реализовано в `wb-status-mapping.ts`, 40+ статусов |
| 3   | Warehouse ID Mapping              | Different IDs     | ✅ Используется `coefficients/all` с supply IDs       |

---

## References

### Analysis Documents

- `docs/MARGIN-INTEGRATION-ANALYSIS.md`
- `docs/ADVERTISING-INTEGRATION-ANALYSIS.md`
- `docs/ORDERS-SUPPLY-STORAGE-INTEGRATION-ANALYSIS.md`
- `docs/GENERAL-FRONTEND-INTEGRATION-ANALYSIS.md`

### Validation

- `docs/FRONTEND-VALIDATION-REPORT.md` — 23-page validation audit (2026-02-27)
- `docs/DATA-SOURCES-REFERENCE.md` — ROAS/storage data source documentation

### Epic 70-FE

- `docs/epics/epic-70-fe-validation-fixes.md`
- `docs/stories/epic-70/story-70.*.md`

---

**Исходный анализ**: 2026-01-30
**Обновлено**: 2026-08-03 — implementation tracker и локальный validation workflow актуализированы; устаревшая внешняя сертификация больше не является release gate

# Frontend Work Summary

**Создан**: 2026-01-30 (Backend Integration Analysis)
**Последнее обновление**: 2026-07-27
**Статус реализации**: отслеживаемые эпики завершены; это не является разрешением production-релиза
**Release Authorization**: **NO-GO** для безусловного production-релиза
**Certification boundary**: runtime **UNDETERMINED**; CERT-F01 **NOT_ELIGIBLE_FOR_CERT_F01**; repository-remediation certificate **NOT_ISSUED**
**Runtime contract**: lockfile-resolved Next.js 16.2.10; canonical Node.js 24.18.0/npm 11.11.0; `npm run dev` и `npm run start` используют frontend-порт 3100

---

## Executive Summary

**Backend Status**: вне области текущей frontend-сертификации; готовность backend к релизу этим документом не подтверждается
**Frontend implementation status**: исторически отслеживаемая работа отмечена завершённой; канонический текущий подсчёт — 89 уникальных эпиков и 5 untracked operational features в `docs/EPICS-AND-STORIES-TRACKER.md`

С момента исходного анализа (2026-01-30) объём и схема учёта эпиков неоднократно менялись, поэтому прежний счётчик «131 эпик» сохранён ниже только как исторический sprint label. Все пункты из исходного Priority 1–3 отмечены завершёнными. Остаток: 2 истории отложены до реализации бэкенда (#210 buyout daily trends, #211 returns daily trends).

**Текущая доказательная база** (capture 2026-07-26; publication reconciliation 2026-07-27):

- source-инвентарь: 72 route source-файла, 1,047 unit/integration test-файлов и 86 Playwright spec-файлов;
- integrated evidence base: 49/49 ожидаемых результатов совпали до reconciliation документации; последующий post-doc/reseal total здесь не заявляется; TypeScript, lint, format, AP8 и coverage governance 27/27 — PASS;
- evidence manifest: 7,000 entries; SHA-256 `e3dd85025cac37c2fa6ec84f9023b77330f450fa6aab8b0695ba2d3e939c6fa3`;
- Node 24.18.0/npm 11.11.0: Vitest 4.1.10 — 1,047/1,047 файлов и 17,296/17,296 тестов PASS;
- coverage: изолированный candidate-index run — lines 74.46%, statements 73.32%, functions 69.85%, branches 70.04%; на момент capture actual repository index возвращал `NOT_TRACKED` и fail-closed exit 1, а isolated candidate index был только локальным и не изменил actual index; commit `f0a470ca26bc1f31fabb04e7a8a4167144ee33c9` теперь отслеживает selection и policy, post-commit Node 24 selector/governance smoke прошёл; это не изменяет историческую evidence boundary и не влияет на release authorization;
- AP8: Node 24 rule/normalizer и изолированный Node 25 compatibility lane — PASS; Node 25 не использовался для канонических gates;
- builds: две Next.js 16.2.10 production-сборки с 67/67 страницами — PASS; strict source/candidate/runtime inputs неизменны, а первая сборка нормализовала generated `next-env.d.ts`, после чего он стабилизировался; incident 034 отделяет это событие от strict inputs; build IDs и output digests различаются, bit-for-bit reproducibility не заявляется;
- Tier-0: helper Vitest 8/8; safety 72/72; static list — 24 теста ровно в 2 файлах;
- live matrix: missing descriptor дал ожидаемый exit 3 и 38/38 `BLOCKED`, 0 `PASS`, 0 `FAIL`; malformed descriptor дал ожидаемый exit 1; verdict `UNDETERMINED`, CERT-F01 `NOT_ELIGIBLE_FOR_CERT_F01`, repository certificate `NOT_ISSUED`, release `NO-GO`;
- Orders Integrity: source/unit и dedicated live contract реализованы, credentialed live `PASS` отсутствует;
- candidate/external blockers: remediation закоммичен как `f0a470ca26bc1f31fabb04e7a8a4167144ee33c9`; отсутствуют independently fetched immutable candidate receipt, externally published runtime-input manifest, trusted signed sandbox и execution/cleanup authority, ECC, RRC, CERT-F01 и external attestation;
- Evidence: durable sanitized [G006 frontend readiness summary](evidence/frontend-readiness-g006-20260726.md); исходный root `.omx/tmp/g006-final-integrated-20260726T002604Z` является локальным и transient.

Инвентарь воспроизводится командами `find src/app -type f -name 'page.tsx' -print | LC_ALL=C sort -u | wc -l`, `find src -type f \( -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.spec.ts' -o -name '*.spec.tsx' \) -print | LC_ALL=C sort -u | wc -l` и `find e2e tests/e2e -type f -name '*.spec.ts' -print | LC_ALL=C sort -u | wc -l`.

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
- Все перечисленные файлы реализованы в source; текущая live-сертификация ожидает Tier-0 ECC

### ~~Priority 2.1: Telegram Notifications UI~~ → ✅ ЗАВЕРШЕНО (Epic 34-FE)

- **Было**: «❌ Not implemented, 4-6 hours»
- **Факт**: Полностью реализовано:
  - `TelegramBindingCard.tsx`, `TelegramBindingModal.tsx`, `UnbindConfirmationDialog.tsx`
  - `useTelegramBinding.ts`, `useNotificationPreferences.ts`
  - Notifications API (`src/lib/api/notifications.ts`)
  - Страница `/settings/notifications` с binding flow

### Priority 2.2: Orders Integrity Dashboard → ✅ SOURCE/UNIT IMPLEMENTED; LIVE UNDETERMINED

- **Было**: «❌ Not implemented, 8-12 hours»
- **Факт**: маршрут `/orders/integrity`, компоненты, API/normalizer/hooks/types и unit-покрытие присутствуют в source.
- **Dedicated E2E**: отдельный Playwright spec присутствует в текущем дереве, но его authentic live Tier-0 результат ещё не сертифицирован.
- **Release impact**: наличие source/unit/E2E-кода не меняет общий **NO-GO / UNDETERMINED** статус.

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

## Текущие блокеры (ожидают бекенд)

**Нет активных блокеров.** Все backend-зависимости из Priority 1-3 разрешены.
Ожидают backend: Requests #210 (buyout daily) и #211 (returns daily).

~~D-12: Funnel buyoutCount=0~~ — ✅ Исправлено бекендом (2026-02-27): query-time buyout enrichment из `daily_sales_raw` + `orders_fbs`. Commit `39e47fa`.

~~D-14: Liquidity 500~~ — ✅ Исправлено бекендом (2026-02-27): `liquidity_filter` → `category_filter`, SQL fix `category` → `subject`, multi-tenancy leak fixed. Commit `d36a840`.

---

## Оставшийся бэклог

| Приоритет            | Задача                             | Оценка            | Статус                                         |
| -------------------- | ---------------------------------- | ----------------- | ---------------------------------------------- |
| **P0 certification** | Orders Integrity live Tier-0 row   | environment-owned | ⏳ Spec present; authentic live result pending |
| **P2**               | Buyout Daily Trends (Story 127.1)  | 4-6h              | ⏳ Blocked: Backend Request #210               |
| **P2**               | Returns Daily Trends (Story 127.2) | 4-6h              | ⏳ Blocked: Backend Request #211               |
| **P4**               | Cache Timestamps Display           | 1h                | ℹ️ Optional                                    |

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
| 127-FE | Marketing Phase 3           | Comparison periods + cross-links (+ 2 deferred)                |
| 128-FE | TypeScript Cleanup          | 64 TS errors → 0, 15 over-cap files → 0                        |
| 129-FE | FBS Enhanced Reconciliation | Real backend contract rewrite (14,064 tests)                   |
| 130-FE | E2E Smoke Tests             | 33 E2E tests for 6 core analytics routes                       |
| 131-FE | Documentation Catch-Up      | Radix jsdom patterns, retro actions                            |

---

## Полная таблица эпиков

| Epic  | Название                          |  SP | Статус      | Дата       |
| ----- | --------------------------------- | --: | ----------- | ---------- |
| 1-FE  | Foundation & Authentication       |   — | ✅ Complete | —          |
| 2-FE  | Onboarding & Initial Data Setup   |   — | ✅ Complete | —          |
| 3-FE  | Dashboard & Financial Overview    |   — | ✅ Complete | —          |
| 4-FE  | COGS Management & Margin Analysis |   — | ✅ Complete | —          |
| 5-FE  | COGS History Management           |   — | ✅ Complete | —          |
| 6-FE  | Advanced Analytics & Reporting    |   — | ✅ Complete | —          |
| 24-FE | Paid Storage Analytics UI         |   — | ✅ Complete | —          |
| 33-FE | Advertising Analytics UI          |   — | ✅ Complete | —          |
| 34-FE | Telegram Notifications UI         |   — | ✅ Complete | —          |
| 36-FE | Product Card Linking UI           |   — | ✅ Complete | —          |
| 37-FE | Merged Group Table Display UI     |   — | ✅ Complete | —          |
| 40-FE | Orders UI & WB Status History     |  26 | ✅ Complete | 2026-01-29 |
| 42-FE | Task Handlers Adaptation          |   — | ✅ Complete | —          |
| 44-FE | Price Calculator UI               |   — | ✅ Complete | —          |
| 51-FE | FBS Historical Analytics (365d)   |  39 | ✅ Complete | 2026-02    |
| 52-FE | Tariff Settings Admin UI          |   — | ✅ Complete | —          |
| 53-FE | Supply Management UI              |  34 | ✅ Complete | 2026-02    |
| 61-FE | Dashboard Data Integration        |  49 | ✅ Complete | 2026-02-02 |
| 62-FE | Dashboard UI/UX Presentation      |  29 | ✅ Complete | 2026-02-02 |
| 63-FE | Dashboard Business Logic          |  36 | ✅ Complete | 2026-02-15 |
| 65-FE | Dashboard P&L Layout              |   — | ✅ Complete | 2026-02-16 |
| 66-FE | Tax & VAT Accounting              |  35 | ✅ Complete | 2026-02-26 |
| 68-FE | Monitoring Health Dashboard       |   — | ✅ Complete | 2026-02-18 |
| 69-FE | Buyout Rate Analytics             |  28 | ✅ Complete | 2026-02-27 |
| 70-FE | Validation Fixes                  |  13 | ✅ Complete | 2026-02-27 |

**Orders Integrity реализован в source/unit и имеет dedicated E2E spec; live Tier-0 результат остаётся неподтверждённым.**

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
**Обновлено**: 2026-07-25 — implementation tracker актуализирован; release authorization остаётся **NO-GO**, runtime status — **UNDETERMINED / NOT_ELIGIBLE_FOR_CERT_F01**

# Request #232 — BE main не собирается и не совместим с dev-БД/.env: search-coverage деплой-дрейф

**Дата**: 2026-09-13
**Автор**: FE агент-команда (сессия-15, задача FE-потребления Task-139.6/139.7)
**Адресат**: BE команда
**Приоритет**: HIGH — BE main не компилируется; `/v1/analytics/search/orders` 500 на dev-стенде

## Problem

FE-сессия-15 выполняла rebuild dev-BE (`npm run rebuild`) для живой верификации
FE-потребления coverage-контракта (Task-139.6/139.7) и обнаружила три слоя дрейфа
на BE main (`9c063dea5`):

### 1. BE main не компилируется — 16 × TS2559

`npx nest build` падает:

```
Found 16 error(s).
src/analytics/services/search-analytics-integration.service.ts:153:61 — TS2559:
Type 'Omit<PrismaClient<...>, "$on" | ...>' has no properties in common with
type 'SearchAnalyticsCoverageClient'.
```

Те же ошибки в `search-analytics-query.service.ts` (×2), `search-position-trends.service.ts` (×5)
и `search-analytics-integration.service.ts` (×3) — все на вызовах
`getSearchAnalyticsCoverage(tx, ...)`. Похоже, `tx` ожидается типа
расширенного клиента (`SearchAnalyticsCoverageClient`, объявлен в
`src/analytics/services/search-analytics-coverage.ts`), а передаётся транзакционный
клиент базового `PrismaClient`. `tsc` при этом эмитит dist (сборка «зелёная»
только визуально в pm2-логах сборки).

### 2. Dev-БД отстаёт от кода — 500 на `/v1/analytics/search/orders`

После rebuild (новый dist) endpoint начал отдавать 500:

```
PrismaClientKnownRequestError: Raw query failed. Code: 42P01.
Message: relation "search_analytics_daily_coverage" does not exist
```

после ручного создания таблицы — следующий слой:

```
Code: 42703. Message: column sqp.period_grain does not exist
```

Оба объекта определены в миграции
`prisma/migrations/20260906013500_add_search_attribution_period_provenance/migration.sql`,
которая на dev-БД не применена. `npx prisma migrate status` показывает
`Following migrations have not yet been applied: 0_baseline` — история миграций БД
не связана с деревом (baseline drift), поэтому `prisma migrate deploy` на стенде
запускать нельзя (попытается накатить все 80 миграций с нуля).

**FE-стороной применено хирургически (idempotent DDL из миграции 20260906013500):
CREATE TABLE `search_analytics_daily_coverage`, 3 nullable колонки
`period_start/period_end/period_grain` на `search_query_performance`, CHECK-constraint
и индекс.** После этого endpoint отвечает 200 с полным coverage-контрактом
(сейчас `coveredDayCount: 0` — ledger пуст, ожидает наполнения инджестом).

### 3. `.env` dev-стенда отстаёт от config.validation

Новый dist падал на бутстрапе:

```
Error: Environment validation failed: MOYSKLAD_TOKEN requires MOYSKLAD_BOOTSTRAP_CABINET_ID
```

FE-стороной добавлено в `../.env`: `MOYSKLAD_BOOTSTRAP_CABINET_ID=<значение
MOYSKLAD_CABINET_ID>` (бэкап: `.env.bak-s15-20260913`).

## Impact

- BE main не проходит `npm run rebuild` → у любого разработчика/агента rebuild
  роняет процесс (pm2 restart с кривым dist = даунтайм dev-API для всех сессий).
- Dev-БД без миграции 20260906013500 → `/v1/analytics/search/orders` 500,
  `/v1/monitoring/dashboard` отдаёт `searchAnalytics: null`.
- FE-фича потребления coverage (search orders notice, CSV-метаданные,
  monitoring status card) готова и смержена; её живая верификация ограничена
  пустым ledger (см. `_bmad-output/implementation-artifacts/debt-session15-search-coverage.md`).

## Fix Scope (BE)

1. Починить типизацию `getSearchAnalyticsCoverage(tx, ...)` — 16 TS2559
   (принимать `Prisma.TransactionClient` либо приводить к расширенному клиенту
   консистентно с тем, как сервисы его получают).
2. Восстановить/перебазировать историю миграций dev-БД (baseline),
   задокументировать процедуру для стенда.
3. Обновить `.env.example`-доку/рунбук: `MOYSKLAD_BOOTSTRAP_CABINET_ID`
   обязателен при непустом `MOYSKLAD_TOKEN`.

## Reproduction

```bash
cd wb-repricer-system-new   # BE repo
npx nest build              # → Found 16 error(s) TS2559
# на dev-БД без миграции 20260906013500:
curl -s "http://localhost:3000/v1/analytics/search/orders?from=2026-08-24&to=2026-08-30&groupBy=query" \
  -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB"   # → 500 42P01/42703
```

## Resolution

_(заполняет BE команда)_

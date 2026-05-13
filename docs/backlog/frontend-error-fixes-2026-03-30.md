# Frontend Error Fixes Backlog — 2026-03-30

> Источник: полный browser-аудит всех 15 страниц + ответы бекенда от 30.03.2026
> **Triaged 2026-05-13**: All 7 fixes (F1-F7) are RESOLVED.

## Triage Results (2026-05-13)

| Fix | Description | Status | Resolved By |
|-----|-------------|--------|-------------|
| F1 | Graceful seller-info / jam-status | RESOLVED | Epic 84-FE (Stories 84-1, 84-2) |
| F2 | useProductsCount endpoint | RESOLVED | Uses `/v1/products?limit=1` + `pagination.total` |
| F3 | Unit-economics 404 handling | RESOLVED | Standard empty-state pattern (Epic 87-FE) |
| F4 | Default week = lastCompletedWeek | RESOLVED | `getLastCompletedWeek()` pattern codified |
| F5 | Remove shipment-cost/by-sku | RESOLVED | Backend shipped endpoint; Epic 85.2-FE integrated it |
| F6 | COGS page X-Cabinet-Id | RESOLVED | api-client.ts auto-injects header (core pattern) |
| F7 | Dashboard COGS widget fallback | RESOLVED | Works with fixed useProductsCount (F2) |

## Сводка (original)

## Обновления по ответам бекенда (30.03.2026)

- **seller-info** — ✅ ИСПРАВЛЕНО бекендом. Теперь 200 `{ name: "", tradeMark: "" }` при ошибке
- **jam-status** — ✅ ИСПРАВЛЕНО бекендом. Теперь 200 `{ tier: "none", checkedAt, probeCallsMade: 0 }` при ошибке
- **products** — Работает корректно (401 при отсутствии токена). Нужно проверить X-Cabinet-Id header
- **products/count** — ❌ НЕ СУЩЕСТВУЕТ. Есть `/v1/products/cogs-coverage`
- **unit-economics** — Реализован (Epic 27). 404 = NO_DATA_FOR_WEEK (ожидаемо)
- **shipment-cost/by-sku** — ❌ НЕ РЕАЛИЗОВАН. Убрать вызов с фронтенда

---

## HIGH — Адаптация к новым backend responses

### F1: Обработать graceful seller-info / jam-status в sidebar

**Контекст**: Бекенд исправил 500 → теперь возвращает 200 с fallback данными. Фронтенд должен корректно обрабатывать пустые значения.

**Файлы**:
- `src/hooks/useSellerInfo.ts`
- `src/hooks/useJamStatus.ts`
- `src/components/custom/SidebarCabinetInfo.tsx`

**Что сделать**:
1. `SidebarCabinetInfo`: обработать `seller.name === ""` — показать "Кабинет" или short cabinetId вместо пустоты/skeleton
2. `SidebarCabinetInfo`: обработать `jam.tier === "none"` — не показывать Jam badge (уже работает через `jam ? ... : null`, но проверить что `tier: "none"` не рендерит badge с текстом "Нет подписки")
3. Добавить `retry: false` в оба хука (бекенд вернул graceful response — ретрай не нужен, данные не изменятся)
4. Обработать `isError` fallback на случай если бекенд откатит фикс

**AC**:
- [ ] При `name: ""` sidebar показывает fallback текст (не пустоту)
- [ ] При `tier: "none"` Jam badge не рендерится
- [ ] Нет лишних retry при graceful 200
- [ ] Нет console.error от этих endpoints

**Оценка**: 1 час

---

### F2: Fix useProductsCount — endpoint не существует

**Контекст**: Бекенд подтвердил: **`/v1/products/count` не существует**. Есть `/v1/products/cogs-coverage` который возвращает count.

**Файл**: `src/hooks/useProducts.ts` (строка ~104-113)

**Что сделать**:
1. Найти `useProductsCount` хук — изменить endpoint с `/v1/products/count` на `/v1/products/cogs-coverage`
2. Обновить тип ответа если отличается
3. Обновить тесты

**AC**:
- [ ] `useProductsCount` вызывает `/v1/products/cogs-coverage`
- [ ] Dashboard COGS widget показывает реальный count
- [ ] Нет console.error от products/count

**Оценка**: 1 час

---

## MEDIUM — Unit Economics

### F3: Handle 404 NO_DATA_FOR_WEEK на unit-economics

**Контекст**: Бекенд подтвердил: endpoint реализован (Epic 27). 404 = `NO_DATA_FOR_WEEK` — ожидаемое поведение при отсутствии данных за неделю. W13 (текущая) не имеет данных до импорта еженедельного отчёта.

**Страница**: `/analytics/unit-economics`

**Что сделать**:
1. В хуке: обработать 404 как "нет данных" (`retry: false` для 404)
2. В компоненте: при 404 показать empty state "Нет данных за неделю {week}. Данные появятся после импорта еженедельного отчёта."
3. При других ошибках — error alert с retry

**AC**:
- [ ] При 404 NO_DATA_FOR_WEEK — empty state с сообщением
- [ ] При 500 — error alert с retry
- [ ] Нет вечных skeleton loaders

**Оценка**: 2 часа

---

### F4: Unit-economics default week = lastCompletedWeek

**Проблема**: По умолчанию запрашивает W13 (текущая). Нужно W12 (последняя завершённая).

**Что сделать**:
1. Применить `getLastCompletedWeek()` из `src/lib/margin-helpers.ts`
2. W13 доступна для ручного выбора, но не по умолчанию

**AC**:
- [ ] По умолчанию W12
- [ ] W13 выбираема вручную → показывает empty state (F3)

**Оценка**: 1 час

---

### F5: Убрать вызов /v1/shipment-cost/by-sku

**Контекст**: Бекенд подтвердил: **endpoint НЕ РЕАЛИЗОВАН**, нет в коде/доках/бэклоге. Аналитика per-SKU по стоимости доставки — отдельная будущая задача.

**Что сделать**:
1. Найти где вызывается `/v1/shipment-cost/by-sku` на фронтенде
2. Убрать вызов
3. В UI: показать "—" в колонке стоимости доставки (или убрать колонку если она зависит только от этого endpoint)

**AC**:
- [ ] Нет вызова `/v1/shipment-cost/by-sku`
- [ ] Нет 404 на странице unit-economics
- [ ] Колонка доставки показывает "—" или скрыта

**Оценка**: 30 мин

---

## LOW — Polish

### F6: COGS page — проверить X-Cabinet-Id header

**Контекст**: Бекенд подтвердил: products endpoint работает, токен у тестового кабинета ЕСТЬ. Ошибка может быть в том, что фронтенд не передаёт `X-Cabinet-Id` или JWT не содержит этот cabinet_id.

**Что сделать**:
1. Проверить что `api-client.ts` передаёт `X-Cabinet-Id` из authStore
2. Проверить что JWT claims содержат cabinet_id
3. Если header передаётся корректно — это backend issue, эскалировать

**AC**:
- [ ] Products загружаются на странице COGS
- [ ] ИЛИ: найден и задокументирован root cause

**Оценка**: 1 час (диагностика)

---

### F7: Dashboard COGS widget — fallback при ошибке

**Проблема**: "COGS не заполнен — 0 из 0 товаров" при ошибке загрузки товаров.

**Что сделать**:
1. Если useProductsCount (после фикса F2) возвращает ошибку — показать "Товары не загружены"
2. Добавить ссылку "Проверить настройки →"

**Оценка**: 30 мин

---

## Порядок выполнения

```
F2 (fix useProductsCount endpoint) → F1 (sidebar graceful) → F5 (remove by-sku call) → F3+F4 (unit-economics) → F6 (diagnose products) → F7 (widget polish)
```

F2 первым — потому что root cause самый ясный и фикс простой.
F5 рядом — удалить несуществующий endpoint.
F3+F4 вместе — одна страница.
F6 диагностика — может закрыть F7 автоматически.

# Epic 65 — Stories Wave 3: Бэкенд-зависимые метрики + WB API

**Wave 3**: Метрики, требующие нового бэкенд-функционала или WB API интеграции.

---

## Story 65.9: Остатки + Капитализация (WB Stocks API)

**Описание**: Карточка "Остатки" с разбивкой по 3 подкатегориям + карточки капитализации.

**Бэкенд-статус**:
- Таблица `InventorySnapshot` уже существует в Prisma-схеме (prisma/schema.prisma:623):
  - `totalStock` (Int) — общий остаток (`total_stock`)
  - `inWayToClient` (Int, default 0) — в пути к клиентам (`in_way_to_client`)
  - `inWayFromClient` (Int, default 0) — в пути от клиентов (`in_way_from_client`)
  - `warehouseBreakdown` (Json, default "[]") — JSON разбивка по складам
  - Unique constraint: `[cabinetId, date, nmId]`
- Данные заполняются через Epic 56 (Historical Stocks Import) — POST /v1/imports/stocks/historical
- Нужен API эндпоинт для агрегации по кабинету (последний snapshot date).

**Данные**:
- Остатки шт (ИТОГО) = `SUM(totalStock) + SUM(inWayToClient) + SUM(inWayFromClient)` по всем SKU на последнюю дату snapshot
- На складах МП = `SUM(totalStock)` (в InventorySnapshot `totalStock` = количество физически НА складе WB)
- В пути к клиентам = `SUM(inWayToClient)`
- В пути от клиентов = `SUM(inWayFromClient)`
- **ВАЖНО**: `totalStock` в Prisma = остаток на складе, БЕЗ учёта товаров в пути. Подтверждено в `regional-stock.service.ts:238-240`.
- Капитализация по себес. = `SUM(stock * cogs_per_unit)` — JOIN InventorySnapshot с Cogs таблицей
- Капитализация по розн. = `SUM(stock * retail_price)` — JOIN InventorySnapshot с Product

**Примечание**: Существующий эндпоинт `GET /v1/analytics/liquidity` уже возвращает `summary.total_stock_units` и `summary.total_frozen_capital`, но НЕ содержит разбивку `inWayToClient`/`inWayFromClient`. Нужен отдельный эндпоинт или расширение liquidity.

**AC**:
- [ ] AC-65.9.1: Карточка "Остатки" показывает `N шт` с иконкой разбивки (3 подкатегории)
- [ ] AC-65.9.2: Тултип/попover с 3 подкатегориями: на складах МП, в пути к клиентам, в пути от клиентов
- [ ] AC-65.9.3: Карточка "Капитализация по себес." — `N ₽`
- [ ] AC-65.9.4: Карточка "Капитализация по розн." — `N ₽`
- [ ] AC-65.9.5: Если COGS не заполнен (cogs_coverage < 100%) — капитализация по себес. = "—" или показать частичное с пометкой
- [ ] AC-65.9.6: Graceful: при отсутствии данных остатков (нет snapshot) — "Нет данных. Импортируйте остатки"
- [ ] AC-65.9.7: Дата последнего обновления остатков отображается (из `syncedAt`)

**Backend Request**: #140 — Inventory aggregation endpoint
```
GET /v1/inventory/summary
Headers: Authorization + X-Cabinet-Id (cabinetId из JWT claims)

Response: {
  totalStock: number,           // ИТОГО = onWarehouse + inWayToClient + inWayFromClient
  onWarehouse: number,          // SUM(InventorySnapshot.totalStock) — физически на складах WB
  inWayToClient: number,
  inWayFromClient: number,
  capitalizationByCogs: number | null,   // null если COGS не заполнен
  capitalizationByRetail: number,
  cogsCoveragePct: number,               // % SKU с COGS для капитализации
  warehouseBreakdown: Array<{name: string, count: number}>,
  snapshotDate: string,                  // дата последнего snapshot (YYYY-MM-DD)
  snapshotSyncedAt: string               // ISO timestamp синхронизации
}
```

**Примечание к API**: `cabinet_id` НЕ передаётся в query — он берётся из заголовка `X-Cabinet-Id`, как все другие эндпоинты в проекте.

**Фронтенд-файлы**:
- NEW: `src/components/custom/dashboard/InventoryCard.tsx`
- NEW: `src/components/custom/dashboard/InventoryBreakdownPopover.tsx`
- NEW: `src/components/custom/dashboard/CapitalizationCard.tsx`
- NEW: `src/hooks/useInventorySummary.ts`
- NEW: `src/lib/api/inventory.ts`
- NEW: `src/types/inventory-summary.ts`

**Сложность**: L | **Приоритет**: High
**Зависимость**: Backend Request #140

---

## Story 65.10: Оборачиваемость (по продажам и заказам)

**Описание**: 2 карточки оборачиваемости — ключевые метрики управления запасами.

**Данные**:
- `turnoverBySales = totalStock / (salesCount / daysInPeriod)` дней
- `turnoverByOrders = totalStock / (ordersCount / daysInPeriod)` дней
- `daysInPeriod` = 7 (неделя) или длина выбранного периода

**Источники данных**:
- `totalStock` — из Story 65.9 (inventory summary endpoint)
- `salesCount`, `ordersCount` — из `GET /v1/analytics/fulfillment/summary?from=...&to=...`
  - Ответ: `summary.total.ordersCount`, `summary.fbo.salesCount + summary.fbs.salesCount`
  - **ВАЖНО**: Эти данные НЕ в finance-summary, а в fulfillment/summary endpoint
- Альтернативно: `GET /v1/analytics/liquidity` уже возвращает `turnover_days` per-SKU, но не агрегировано на уровне дашборда

**AC**:
- [ ] AC-65.10.1: Карточка "Оборачиваемость по продажам" — `N Дн.`
- [ ] AC-65.10.2: Карточка "Оборачиваемость по заказам" — `N Дн.`
- [ ] AC-65.10.3: Сравнение: `±дн. (±%)`
- [ ] AC-65.10.4: Инвертированное: снижение дней = хорошо (зелёный)
- [ ] AC-65.10.5: Цветовая индикация: зелёный <30дн, жёлтый 30-90, красный >90
- [ ] AC-65.10.6: Тултип: формула + объяснение что означает
- [ ] AC-65.10.7: Если нет данных остатков или продаж — "Нет данных"
- [ ] AC-65.10.8: Деление на ноль: если salesCount=0 или ordersCount=0 — отображать "∞" или "—"

**Файлы**:
- NEW: `src/components/custom/dashboard/TurnoverCard.tsx`
- EDIT: `DashboardMetricsGrid.tsx` или новая секция

**Сложность**: S | **Приоритет**: High
**Зависимость**: Story 65.9 (нужны остатки), fulfillment/summary endpoint (уже существует)

---

## Story 65.11: Налоги и налоговая база

**Описание**: Карточки "Налоги" и "Налоговая база" с автоматическим расчётом.

**Бэкенд-статус**:
- Поле `taxSystem` НЕ существует в модели `Cabinet` Prisma-схемы (schema.prisma:10-50)
- Нужен backend request для добавления поля в Cabinet и расширения PUT эндпоинта (или нового PATCH /settings)

**Реализация**:
- Налоговая база зависит от выбранной системы
- Налог = налоговая_база * ставка
- Ставка: нужен выбор системы налогообложения в настройках кабинета

**Системы налогообложения (MVP)**:
| Система | Ставка | База | Формула на фронте |
|---------|--------|------|-------------------|
| УСН 6% (Доходы) | 6% | NET выручка (продажи - возвраты) | `sale_gross_total * 0.06` |
| УСН 15% (Доходы-Расходы) | 15% | NET выручка - Все расходы WB - Себестоимость - Реклама | `MAX((sale_gross_total - logistics_cost_total - storage_cost_total - paid_acceptance_cost_total - penalties_total - other_adjustments_net_total - cogs_total - advertising_spend) * 0.15, sale_gross_total * 0.01)` |
| Ручной ввод | Пользовательская | — | Пользователь вводит сумму налога вручную |

**ВАЖНО по формулам**:
- Используем `sale_gross_total` (NET = sales - returns), НЕ `sales_gross_total` (gross) — для налогов учитывается фактический доход
- Для УСН 15% используем `other_adjustments_net_total` (НЕ `wb_services_cost_total`), т.к. `wb_services_cost` уже ВКЛЮЧЕНА в `other_adjustments_net`
- Для УСН 15%: минимальный налог = 1% от дохода (законодательное требование)
- `advertising_spend` берётся из `advertising/analytics` API (`summary.total_spend`)

**Примечание по налогам**: ОСН (НДС) и Патент — сложные системы, требующие профессионального бухгалтерского учёта. В MVP поддерживаем только УСН 6%, УСН 15% и ручной ввод. ОСН/Патент можно добавить позже.

**Примечание по УСН 15%**: Формула упрощена. В реальности база = доходы - расходы, где в расходы входят все подтверждённые расходы. Для MVP используем доступные данные из finance-summary как приблизительный расчёт. Пользователь может переключиться на ручной ввод для точности.

**AC**:
- [ ] AC-65.11.1: Карточка "Налоги" — `₽ / % от выр.` (% считается как налог / sale_gross_total * 100, где sale_gross_total = NET выручка)
- [ ] AC-65.11.2: Карточка "Налоговая база" — `₽`
- [ ] AC-65.11.3: Сравнение с прошлым периодом
- [ ] AC-65.11.4: Настройка налоговой системы в профиле кабинета (отдельная страница настроек)
- [ ] AC-65.11.5: По умолчанию УСН 6% (самая распространённая для ИП на WB)
- [ ] AC-65.11.6: Режим "Ручной ввод" — поле для суммы налога за период
- [ ] AC-65.11.7: При отсутствии настройки — показать плашку "Настройте систему налогообложения"

**Backend Request**: #141 — Tax settings in cabinet profile
```
# Добавить поле в модель Cabinet:
#   taxSystem  String? @map("tax_system") @db.VarChar(20)  // "usn6" | "usn15" | "manual"
#   taxRate    Decimal? @map("tax_rate") @db.Decimal(5,2)  // для кастомной ставки

# ВАЖНО: Текущий бэкенд использует PUT /v1/cabinets/:id (НЕ PATCH),
# и UpdateCabinetDto принимает только { name?: string }.
# Нужно: расширить UpdateCabinetDto или создать отдельный PATCH endpoint для настроек.

# Вариант 1: Расширить PUT /v1/cabinets/:id
PUT /v1/cabinets/:id
Body: { name?: string, taxSystem?: "usn6" | "usn15" | "manual", taxRate?: number }

# Вариант 2: Новый endpoint для настроек кабинета
PATCH /v1/cabinets/:id/settings
Body: { taxSystem: "usn6" | "usn15" | "manual", taxRate?: number }
```

**Фронтенд-файлы**:
- NEW: `src/components/custom/dashboard/TaxCard.tsx`
- NEW: `src/components/custom/dashboard/TaxBaseCard.tsx`
- EDIT: `src/types/cabinet.ts` — добавить `taxSystem?: string`, `taxRate?: number`
- NEW: `src/components/custom/settings/TaxSettings.tsx`

**Сложность**: L | **Приоритет**: Medium
**Зависимость**: Backend Request #141

---

## Story 65.12: Штрафы и компенсации (раздельно)

**Описание**: Разделить текущий `penalties_total` на штрафы и компенсации.

**Данные (Prisma schema)**:
Таблица `WbFinanceRaw` (schema.prisma:170) содержит:
- `penalties` (Decimal) — штрафы (строка 209)
- `corrections` (Decimal) — коррекции/компенсации (строка 210)
- `docType` (String?) — тип документа (строка 176)
- `reason` (String?) — причина (строка 177)

**Текущее состояние**:
- `WeeklyPayoutSummary.penaltiesTotal` (Decimal) — содержит итого штрафов (строка 252)
- Поля `corrections_total` / `compensations` в `WeeklyPayoutSummary` НЕ существуют
- Для компенсаций нужна НОВАЯ агрегация: `SUM(corrections)` из `WbFinanceRaw` GROUP BY week, cabinet_id
- Бэкенд должен или добавить поле в WeeklyPayoutSummary, или агрегировать из WbFinanceRaw на лету

**AC**:
- [ ] AC-65.12.1: Карточка "Штрафы" — `₽ / % от выр.` (используем красную индикацию)
- [ ] AC-65.12.2: Карточка "Компенсации" — `₽ / % от выр.` (зелёная индикация)
- [ ] AC-65.12.3: Сравнение с прошлым периодом
- [ ] AC-65.12.4: Штрафы: рост = плохо (инвертированное сравнение)
- [ ] AC-65.12.5: Компенсации: рост = хорошо (прямое сравнение)
- [ ] AC-65.12.6: `% от выр.` = значение / sales_gross_total * 100

**Backend Request**: #142 — Separate penalties and compensations in finance-summary
```
GET /v1/analytics/weekly/finance-summary?week=YYYY-Wxx
Response (расширение summary_total): {
  ...existing,
  penalties_amount: number,      // SUM(penalties) из WbFinanceRaw (только штрафы)
  corrections_amount: number,    // SUM(corrections) из WbFinanceRaw (компенсации/коррекции)
}

Примечание: текущее поле `penalties_total` = penalties_amount (для обратной совместимости).
Новое поле `corrections_amount` агрегируется из WbFinanceRaw.corrections.
```

**Фронтенд-файлы**:
- NEW: `src/components/custom/dashboard/PenaltiesCard.tsx`
- NEW: `src/components/custom/dashboard/CompensationsCard.tsx`
- EDIT: `src/types/finance-summary.ts` — добавить `penalties_amount?`, `corrections_amount?`

**Сложность**: M | **Приоритет**: Medium
**Зависимость**: Backend Request #142

---

## Story 65.13: Реализация (GMV)

**Описание**: Отдельная карточка "Реализация" — полный объём товарооборота включая возвраты.

**Данные**:
- **Реализация = `sales_gross_total`** (валовые продажи ДО вычета возвратов)
  - Поле существует в finance-summary response (API-PATHS-REFERENCE.md строка 33)
  - Поле существует в `WeeklyPayoutSummary.salesGross` (schema.prisma:274)
  - Определение: `SUM(retail_price_with_discount) WHERE doc_type='sale'` из WbFinanceRaw
- **НЕ путать с**:
  - `sale_gross_total` = NET продажи (sales_gross - returns_gross) — это текущие "Продажи"
  - `wb_sales_gross_total` = SUM(gross) WHERE doc_type='sale' — это "Продажа" как на WB Dashboard

**Корректная формула**:
```
Реализация = sales_gross_total
(это полный объём продаж до вычета возвратов)

Отличие:
  sales_gross_total = 153,220₽  (валовые продажи)
  sale_gross_total  = 145,266₽  (нетто = продажи - возвраты)
  Разница = returns_gross_total = 7,954₽ (возвраты)
```

**AC**:
- [ ] AC-65.13.1: Карточка "Реализация" — `N ₽`
- [ ] AC-65.13.2: Сравнение: `±₽ (±%)`
- [ ] AC-65.13.3: Тултип: "Полный объём реализации до вычета возвратов"
- [ ] AC-65.13.4: Значение всегда >= "Продажи" (sale_gross_total)
- [ ] AC-65.13.5: Данные берутся из существующего finance-summary response — бэкенд НЕ требуется

**Backend проверка**:
- `sales_gross_total` уже есть в finance-summary (Request #41) -- ПОДТВЕРЖДЕНО
- `sales_gross` есть в summary_rus/eaeu -- ПОДТВЕРЖДЕНО
- Дополнительный бэкенд НЕ нужен

**Файлы**:
- NEW: `src/components/custom/dashboard/GmvCard.tsx`
- EDIT: `DashboardMetricsGrid.tsx`

**Сложность**: S | **Приоритет**: Medium
**Зависимость**: Нет (данные уже в finance-summary)

---

## Story 65.14: Операционные расходы (пользовательский ввод)

**Описание**: Позволить пользователю вводить операционные расходы (аренда, зарплата, и т.д.) для полного P&L.

**Реализация**:
- Новая таблица для хранения пользовательских расходов (в бэкенде)
- Форма ввода расходов по категориям
- Учёт в формулах: Чистая прибыль, ROI (Wave 1: Story 65.3)

**AC**:
- [ ] AC-65.14.1: Карточка "Опер. расходы" на дашборде — `₽ / % от выр.`
- [ ] AC-65.14.2: Кнопка "Ввести" на карточке
- [ ] AC-65.14.3: Dialog с формой: категория + сумма + период
- [ ] AC-65.14.4: Категории: Аренда, Зарплата, Упаковка, Транспорт, Прочее
- [ ] AC-65.14.5: Данные сохраняются помесячно
- [ ] AC-65.14.6: Пересчёт Чистой прибыли и ROI при изменении
- [ ] AC-65.14.7: Инвертированное сравнение (рост = плохо)
- [ ] AC-65.14.8: Возможность удалить/редактировать введённые расходы

**Backend Request**: #143 — Operational expenses CRUD
```
POST /v1/expenses
Body: { category: string, amount: number, month: string }
Headers: Authorization + X-Cabinet-Id

GET /v1/expenses?month=YYYY-MM
Headers: Authorization + X-Cabinet-Id

PUT /v1/expenses/:id
Body: { category?: string, amount?: number, month?: string }

DELETE /v1/expenses/:id
```

**Примечание**: `cabinetId` берётся из заголовка `X-Cabinet-Id`, не из body.

**Фронтенд-файлы**:
- NEW: `src/components/custom/dashboard/OperationalExpensesCard.tsx`
- NEW: `src/components/custom/expenses/ExpenseInputDialog.tsx`
- NEW: `src/hooks/useOperationalExpenses.ts`
- NEW: `src/lib/api/expenses.ts`
- NEW: `src/types/expenses.ts`

**Сложность**: XL | **Приоритет**: Low
**Зависимость**: Backend Request #143

---

## Story 65.15: Прочие удержания

**Описание**: Карточка "Прочие удержания" — агрегация мелких удержаний WB.

**Данные (все поля уже доступны в finance-summary)**:
- `wb_services_cost_total` — стоимость сервисов WB (итого)
- Подкатегории для тултипа:
  - `wb_promotion_cost_total` — WB.Продвижение
  - `wb_jam_cost_total` — Джем (подписка)
  - `wb_other_services_cost_total` — Прочие сервисы (утилизация и т.д.)
- Все поля существуют в:
  - `WeeklyPayoutSummary` Prisma-схеме (строки 276-281)
  - Finance-summary API response (Request #56, API-PATHS-REFERENCE.md строка 62)
- **ВАЖНО**: WB services costs уже ВКЛЮЧЕНЫ в `other_adjustments_net`. Новые поля дают только видимость разбивки.

**AC**:
- [ ] AC-65.15.1: Карточка "Прочие удержания" — `₽ / % от выр.` (значение = `wb_services_cost_total`)
- [ ] AC-65.15.2: Инвертированное сравнение (рост = плохо)
- [ ] AC-65.15.3: Тултип с разбивкой: Продвижение, Джем, Прочие сервисы (с суммами)
- [ ] AC-65.15.4: `% от выр.` = wb_services_cost_total / sales_gross_total * 100

**Файлы**:
- NEW: `src/components/custom/dashboard/OtherDeductionsCard.tsx`
- EDIT: `DashboardMetricsGrid.tsx`

**Сложность**: S | **Приоритет**: Low
**Зависимость**: Нет (данные уже в finance-summary)

---

## Зависимости Wave 3

```
65.9  (Остатки) → Backend #140 (inventory aggregation)
65.10 (Оборачиваемость) → 65.9 + fulfillment/summary (уже есть)
65.11 (Налоги) → Backend #141 (tax settings in Cabinet model)
65.12 (Штрафы/Компенсации) → Backend #142 (corrections aggregation)
65.13 (Реализация) → НЕТ зависимостей (sales_gross_total уже в API)
65.14 (Опер. расходы) → Backend #143 (expenses CRUD + новая таблица)
65.15 (Прочие удержания) → НЕТ зависимостей (wb_services_cost уже в API)
```

## Backend Requests Summary

| # | Описание | Сложность | Приоритет | Prisma изменения |
|---|----------|-----------|-----------|------------------|
| #140 | Inventory summary aggregation (new endpoint) | L | High | Нет (InventorySnapshot уже есть) |
| #141 | Tax settings in cabinet profile | M | Medium | Да: добавить taxSystem, taxRate в Cabinet |
| #142 | Separate penalties and compensations | M | Medium | Да: добавить corrections_total в WeeklyPayoutSummary ИЛИ агрегация из WbFinanceRaw |
| #143 | Operational expenses CRUD (new table + endpoints) | L | Low | Да: новая модель OperationalExpense |

**Примечание**: #139 (Logistics breakdown) — относится к Wave 2 (Story 65.6), не к Wave 3.

## Оценка трудозатрат

| Story | Размер | Часы (FE) | Часы (BE) | Зависимость |
|-------|--------|-----------|-----------|-------------|
| 65.9 Остатки + Капитализация | L | 6-8 | 8-12 | Backend #140 |
| 65.10 Оборачиваемость | S | 2-3 | — | 65.9 + fulfillment (есть) |
| 65.11 Налоги | L | 6-8 | 4-6 | Backend #141 |
| 65.12 Штрафы/Компенсации | M | 3-4 | 4-6 | Backend #142 |
| 65.13 Реализация | S | 1-2 | — | Нет (данные есть) |
| 65.14 Опер. расходы | XL | 8-12 | 8-12 | Backend #143 |
| 65.15 Прочие удержания | S | 1-2 | — | Нет (данные есть) |
| **ИТОГО** | | **27-39** | **24-36** | |

---

## PM Validation Notes (2026-02-15)

**Validated by**: PM Agent (Claude Opus 4.6)
**Status**: VALIDATED WITH CORRECTIONS

### Issues Found and Fixed:

1. **Story 65.9**: Fixed API request to remove `?cabinet_id=XXX` from query string — project uses `X-Cabinet-Id` header consistently. Added `snapshotDate`, `snapshotSyncedAt`, `cogsCoveragePct` to response spec. Added reference to existing liquidity endpoint as alternative data source. Added Prisma schema line references.

2. **Story 65.10**: Added explicit data source clarification — `salesCount`/`ordersCount` come from `fulfillment/summary` endpoint, NOT from `finance-summary`. Added edge case AC for division by zero. Added fulfillment as explicit dependency.

3. **Story 65.11**: Major corrections to tax formulas:
   - Removed ОСН (НДС) and Патент from MVP scope (too complex for automated calculation)
   - Added "Ручной ввод" mode as practical alternative
   - Fixed УСН 15% formula: specified which expense fields to subtract (was vague "Расходы")
   - Noted that `taxSystem` field does NOT exist in Cabinet model yet (confirmed via Prisma schema)
   - Added disclaimer about approximation for УСН 15%

4. **Story 65.12**: Clarified that `corrections` field exists in `WbFinanceRaw` (line 210) but there is NO `corrections_total` in `WeeklyPayoutSummary`. Backend must either add new aggregated field or aggregate from raw data. Renamed response field to `corrections_amount` (matches WbFinanceRaw field name `corrections`).

5. **Story 65.13**: Fixed INCORRECT formula. Was: `sale_gross + wb_returns_gross` (wrong — `sale_gross` is already NET). Correct value: `sales_gross_total` (the gross sales before returns subtraction). Added clear explanation of difference between `sales_gross_total`, `sale_gross_total`, and `wb_sales_gross_total`. Changed backend dependency to "None" since `sales_gross_total` already exists in finance-summary (Request #41). Reduced hours estimate accordingly.

6. **Story 65.14**: Fixed API spec — removed `cabinetId` from POST body (uses X-Cabinet-Id header). Added missing AC items.

7. **Story 65.15**: Added Prisma line references and API reference for Request #56. Added note that wb_services_cost is already included in other_adjustments_net. Added formula for % calculation. Reduced hours since no backend needed.

8. **Backend Requests Summary**: Removed #139 (belongs to Wave 2). Added "Prisma changes" column. Updated dependency graph.

### Schema Verification Summary:
| Reference | Verified | Notes |
|-----------|----------|-------|
| `InventorySnapshot.totalStock` | Correct | schema.prisma:628 |
| `InventorySnapshot.inWayToClient` | Correct | schema.prisma:629 |
| `InventorySnapshot.inWayFromClient` | Correct | schema.prisma:630 |
| `WbFinanceRaw.penalties` | Correct | schema.prisma:209 |
| `WbFinanceRaw.corrections` | Correct | schema.prisma:210 |
| `WeeklyPayoutSummary.penaltiesTotal` | Correct | schema.prisma:252 |
| `WeeklyPayoutSummary.salesGross` | Correct | schema.prisma:274 |
| `WeeklyPayoutSummary.returnsGross` | Correct | schema.prisma:273 |
| `WeeklyPayoutSummary.wbServicesCost` | Correct | schema.prisma:281 |
| `WeeklyPayoutSummary.wbPromotionCost` | Correct | schema.prisma:278 |
| `WeeklyPayoutSummary.wbJamCost` | Correct | schema.prisma:276 |
| `WeeklyPayoutSummary.wbOtherServicesCost` | Correct | schema.prisma:277 |
| `Cabinet.taxSystem` | NOT FOUND | Needs backend #141 migration |
| `WeeklyPayoutSummary.correctionsTotal` | NOT FOUND | Needs backend #142 |
| `finance-summary.sales_gross_total` | Correct | API-PATHS-REFERENCE.md:33 |
| `finance-summary.wb_services_cost_total` | Correct | API-PATHS-REFERENCE.md:91 |

---

## PM Final Validation — 2026-02-15 (Round 2: Deep Cross-Reference)

**Validated by**: Senior PM Agent (Claude Opus 4.6)
**Method**: Cross-referenced every field name with Prisma schema (schema.prisma), API-PATHS-REFERENCE.md, test-api/*.http files, frontend TypeScript types, and backend controller/service code.

### Validation Summary

| Story | Verdict | Notes |
|-------|---------|-------|
| 65.9 (Остатки + Капитализация) | ⚠️ NEEDS FIX (APPLIED) | Fixed `onWarehouse` formula: Prisma `totalStock` = on-warehouse only, NOT grand total. Response `totalStock` = grand total = onWarehouse + inWayToClient + inWayFromClient. Confirmed via `regional-stock.service.ts:238-240`. |
| 65.10 (Оборачиваемость) | ✅ READY | Formulas correct. `salesCount` from `fbo.salesCount + fbs.salesCount` (FulfillmentTotal does NOT have salesCount -- confirmed in fulfillment.ts:59-64). Division-by-zero AC present. Can TDD with mock inventory + fulfillment data. |
| 65.11 (Налоги) | ⚠️ NEEDS FIX (APPLIED) | 3 fixes: (1) Backend uses `PUT /v1/cabinets/:id` (NOT PATCH), `UpdateCabinetDto` only accepts `{ name }`. (2) Tax base changed from `sales_gross_total` to `sale_gross_total` (NET revenue). (3) УСН 15% fixed: uses `other_adjustments_net_total` instead of `wb_services_cost_total` (avoids double-counting), added `advertising_spend`, added MIN tax rule. Can TDD tax calculation logic with mock taxSystem config. |
| 65.12 (Штрафы/Компенсации) | ✅ READY | Prisma fields verified: `WbFinanceRaw.penalties` (line 209), `WbFinanceRaw.corrections` (line 210). No `correctionsTotal` in WeeklyPayoutSummary -- backend must aggregate from raw. AC complete. Can TDD with mock finance-summary containing new fields. |
| 65.13 (Реализация) | ✅ READY | `sales_gross_total` confirmed in: FinanceSummary type (line 11), API-PATHS-REFERENCE.md (line 33: 153220.48), Prisma `WeeklyPayoutTotal.salesGrossTotal` (line 319). No backend needed. Immediately TDD-ready. |
| 65.14 (Опер. расходы) | ✅ READY | CRUD spec complete. No `/v1/expenses` endpoint exists in backend (verified grep). No `OperationalExpense` model in Prisma (verified grep). All AC testable. Can TDD with mock expenses API. |
| 65.15 (Прочие удержания) | ✅ READY | All fields confirmed: `wb_services_cost_total` (Prisma line 326/frontend type line 48), `wb_promotion_cost_total` (Prisma 323/type 50), `wb_jam_cost_total` (Prisma 321/type 52), `wb_other_services_cost_total` (Prisma 322/type 54). No backend needed. Immediately TDD-ready. |

### Backend Requests Status

| Request | Spec Complete | Prisma Verified | API Method Verified | Notes |
|---------|:------------:|:---------------:|:-------------------:|-------|
| #140 (Inventory Summary) | ✅ | ✅ `InventorySnapshot` exists (line 623) | N/A (new endpoint) | `totalStock` naming disambiguation added. Semantics: Prisma `totalStock` = on-warehouse; Response `totalStock` = grand total. |
| #141 (Tax Settings) | ⚠️ FIXED | ❌ `taxSystem`/`taxRate` NOT in Cabinet | ❌ No PATCH on cabinets | Fixed: clarified that current backend uses PUT+UpdateCabinetDto(name only). Two API variants proposed. |
| #142 (Penalties/Compensations) | ✅ | ✅ `WbFinanceRaw.penalties` (209), `corrections` (210) | N/A (extend existing) | `correctionsTotal` NOT in WeeklyPayoutSummary. Backend must add field or aggregate from WbFinanceRaw. |
| #143 (Operational Expenses) | ✅ | ❌ `OperationalExpense` NOT in schema | ❌ No `/v1/expenses` endpoint | New model + CRUD. Spec is complete and well-defined. |

### Prisma Deep Verification (Round 2)

| Field Reference in Stories | Prisma Line | Verified | Type |
|---------------------------|:-----------:|:--------:|------|
| `InventorySnapshot.totalStock` | 628 | ✅ | Int |
| `InventorySnapshot.inWayToClient` | 629 | ✅ | Int (default 0) |
| `InventorySnapshot.inWayFromClient` | 630 | ✅ | Int (default 0) |
| `InventorySnapshot.warehouseBreakdown` | 631 | ✅ | Json (default "[]") |
| `InventorySnapshot.syncedAt` | 632 | ✅ | DateTime |
| `InventorySnapshot unique constraint` | 636 | ✅ | [cabinetId, date, nmId] |
| `WbFinanceRaw.penalties` | 209 | ✅ | Decimal(15,2) |
| `WbFinanceRaw.corrections` | 210 | ✅ | Decimal(15,2) |
| `WbFinanceRaw.docType` | 176 | ✅ | String? VarChar(50) |
| `WbFinanceRaw.reason` | 177 | ✅ | String? VarChar(100) |
| `WeeklyPayoutSummary.penaltiesTotal` | 252 | ✅ | Decimal(15,2) |
| `WeeklyPayoutSummary.salesGross` | 274 | ✅ | Decimal(15,2) |
| `WeeklyPayoutSummary.returnsGross` | 273 | ✅ | Decimal(15,2) |
| `WeeklyPayoutSummary.wbServicesCost` | 281 | ✅ | Decimal(15,2) |
| `WeeklyPayoutSummary.wbPromotionCost` | 278 | ✅ | Decimal(15,2) |
| `WeeklyPayoutSummary.wbJamCost` | 276 | ✅ | Decimal(15,2) |
| `WeeklyPayoutSummary.wbOtherServicesCost` | 277 | ✅ | Decimal(15,2) |
| `WeeklyPayoutSummary.retailPriceTotal` | 272 | ✅ | Decimal(15,2) |
| `WeeklyPayoutTotal.salesGrossTotal` | 319 | ✅ | Decimal(15,2) |
| `WeeklyPayoutTotal.retailPriceTotalCombined` | 317 | ✅ | Decimal(15,2) |
| `WeeklyPayoutTotal.wbServicesCostTotal` | 326 | ✅ | Decimal(15,2) |
| `Cabinet.taxSystem` | — | ❌ NOT FOUND | Needs migration |
| `Cabinet.taxRate` | — | ❌ NOT FOUND | Needs migration |
| `OperationalExpense` model | — | ❌ NOT FOUND | Needs new model |

### Frontend Types Cross-Check

| Story | Frontend Type | Field | Exists | Notes |
|-------|--------------|-------|:------:|-------|
| 65.13 | `FinanceSummary` | `sales_gross_total` | ✅ (line 11) | Used as "Реализация" |
| 65.13 | `FinanceSummary` | `sale_gross_total` | ✅ (line 15) | NET = sales - returns |
| 65.15 | `FinanceSummary` | `wb_services_cost_total` | ✅ (line 48) | |
| 65.15 | `FinanceSummary` | `wb_promotion_cost_total` | ✅ (line 50) | |
| 65.15 | `FinanceSummary` | `wb_jam_cost_total` | ✅ (line 52) | |
| 65.15 | `FinanceSummary` | `wb_other_services_cost_total` | ✅ (line 54) | |
| 65.12 | `FinanceSummary` | `penalties_amount` | ❌ | Needs addition after backend #142 |
| 65.12 | `FinanceSummary` | `corrections_amount` | ❌ | Needs addition after backend #142 |
| 65.10 | `FulfillmentTotal` | `salesCount` | ❌ | NOT in `total` -- must use `fbo.salesCount + fbs.salesCount` |
| 65.10 | `FulfillmentMetrics` | `salesCount` | ✅ (line 49) | Per FBO/FBS |
| 65.10 | `FulfillmentTotal` | `ordersCount` | ✅ (line 60) | In `total` |
| 65.9 | N/A | `InventorySummary` type | ❌ | New type needed |
| 65.14 | N/A | `OperationalExpense` type | ❌ | New type needed |

### Backend Controller Cross-Check

| Endpoint | Controller | Method | Status |
|----------|-----------|--------|--------|
| `PUT /v1/cabinets/:id` | `CabinetsController` | `@Put(':id')` | ✅ Exists (only accepts `name`) |
| `PATCH /v1/cabinets/:id` | — | — | ❌ Does NOT exist |
| `GET /v1/inventory/summary` | — | — | ❌ Does NOT exist (needs #140) |
| `POST /v1/expenses` | — | — | ❌ Does NOT exist (needs #143) |
| `GET /v1/expenses` | — | — | ❌ Does NOT exist (needs #143) |
| `GET /v1/analytics/fulfillment/summary` | `FulfillmentAnalyticsController` | ✅ | ✅ Exists and confirmed |
| `GET /v1/analytics/weekly/finance-summary` | `WeeklyAnalyticsController` | ✅ | ✅ Exists and confirmed |

### TDD Readiness: CONFIRMED

**Frontend TDD**: Can proceed with mocks for ALL stories:
- **65.13, 65.15**: Immediately testable -- data already in existing API response. No mocks needed.
- **65.10**: Testable with mock inventory summary + existing fulfillment types.
- **65.9**: Testable with mock `InventorySummary` response type.
- **65.11**: Testable with mock `taxSystem` config + tax calculation pure functions.
- **65.12**: Testable with mock extended `FinanceSummary` containing `penalties_amount`, `corrections_amount`.
- **65.14**: Testable with mock expenses CRUD responses.

**Backend TDD**: Requires the following before implementation:
- #140: Prisma schema unchanged (InventorySnapshot exists). Need new service + controller.
- #141: Prisma migration required (add `taxSystem`, `taxRate` to Cabinet). Need DTO extension.
- #142: Aggregation service change needed. May need Prisma migration (add `correctionsTotal` to WeeklyPayoutSummary) OR aggregate from WbFinanceRaw on-the-fly.
- #143: New Prisma model + migration + full CRUD service/controller.

**Risk Items**:
1. `totalStock` naming confusion between Prisma (on-warehouse) and API response (grand total) -- documented and clarified.
2. `corrections` field in WbFinanceRaw contains mixed data (WB services + compensations) -- requires `reason`-based filtering per gap analysis Risk #7.
3. Cabinet update API uses PUT (not PATCH) -- backend team needs to decide approach.
4. `retail_price_total` for "Ср. цена до скидок" (Wave 1 C8) verified: exists in both WeeklyPayoutSummary (line 272) and WeeklyPayoutTotal (line 317 as `retailPriceTotalCombined`), and in frontend type (line 64).

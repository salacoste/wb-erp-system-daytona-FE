# Epic 65 — Stories Wave 1-2: Фронтенд-расчётные метрики + Тултипы

**Wave 1**: Расчётные метрики (только фронтенд, данные уже есть)
**Wave 2**: Подкатегории с тултипами (фронтенд + частично бэкенд)

---

## Общее замечание: Проброс fulfillment-данных

Текущий `DashboardContent.tsx` передаёт из `fulfillmentQuery` только `ordersCount` (total).
Для историй 65.1, 65.2, 65.4, 65.5 необходимо пробросить дополнительные поля из fulfillment:
- `salesCount` = `fbo.salesCount + fbs.salesCount` (нет на `total`, нужна агрегация)
- `salesRevenue` = `fbo.salesRevenue + fbs.salesRevenue` (нет на `total`, нужна агрегация)
- `ordersRevenue` = `total.ordersRevenue` (есть на total)
- `returnsCount` = `fbo.returnsCount + fbs.returnsCount` (нет на `total`, нужна агрегация)
- `returnsRevenue` = `fbo.returnsRevenue + fbs.returnsRevenue` (нет на `total`, нужна агрегация)

**Тип `FulfillmentTotal`** содержит только: `ordersCount`, `ordersRevenue`, `fboShare`, `fbsShare`.
**Тип `FulfillmentMetrics`** (fbo/fbs каждый) содержит: `ordersCount`, `ordersRevenue`, `salesCount`, `salesRevenue`, `forPayTotal`, `returnsCount`, `returnsRevenue`, `returnRate`, `avgOrderValue`.

Поэтому для `salesCount`, `salesRevenue`, `returnsCount`, `returnsRevenue` нужна ручная агрегация `fbo + fbs` в `DashboardContent.tsx` или в новом хелпере.

---

## Story 65.1: Процент выкупа (Buyout Rate)

**Описание**: Добавить карточку "Процент выкупа" — показывает долю выкупленных заказов.

**Данные**:
- `salesCount` = `fulfillmentQuery.current.summary.fbo.salesCount + fulfillmentQuery.current.summary.fbs.salesCount`
  - **Важно**: `FulfillmentTotal` НЕ содержит `salesCount` — нужна агрегация fbo + fbs
- `ordersCount` = `fulfillmentQuery.current.summary.total.ordersCount`
- Формула: `buyoutRate = salesCount / ordersCount * 100`
- Для сравнения: аналогично из `fulfillmentQuery.previous`

**AC**:
- [ ] AC-65.1.1: Карточка показывает `XX,XX%` с иконкой ShoppingBag
- [ ] AC-65.1.2: Сравнение с прошлым периодом в формате процентных пунктов: `+-X,X пп` (абсолютная разница процентов, как в `MarginCard.formatPp()`). Цвет: зелёный если рост, красный если падение.
- [ ] AC-65.1.3: Тултип: "Процент выкупленных заказов за период. Формула: выкупы шт / заказы шт * 100"
- [ ] AC-65.1.4: Цвет зелёный при >=80%, жёлтый 60-80%, красный <60%
- [ ] AC-65.1.5: Graceful: если fulfillment недоступен или `ordersCount === 0` — показывать "---"

**Паттерн сравнения**: Использовать тот же подход, что и `MarginCard.tsx` (строка 75): `diff = currentRate - previousRate`, формат `formatPp(diff)`. НЕ использовать `calculateComparison()`, т.к. для процентных метрик нужны п.п., а не относительное изменение.

**Файлы**:
- NEW: `src/components/custom/dashboard/BuyoutRateCard.tsx`
- EDIT: `src/components/custom/dashboard/DashboardMetricsGrid.tsx` — добавить props `salesCount`, `ordersCount`, `previousSalesCount`, `previousOrdersCount` + карточку в секцию ВЫРУЧКА
- EDIT: `src/app/(dashboard)/dashboard/components/DashboardContent.tsx` — агрегировать `fbo.salesCount + fbs.salesCount` и пробросить в grid

**Сложность**: S | **Приоритет**: High

---

## Story 65.2: Средние показатели (4 метрики)

**Описание**: Добавить карточки средних показателей: цена до скидок, цена продажи, логистика/шт, прибыль/шт.

**Данные**:
- `avgPriceBeforeDiscount` = `fulfillment.total.ordersRevenue / fulfillment.total.ordersCount`
  - Источник: `FulfillmentTotal` — оба поля доступны
  - **Примечание**: `ordersRevenue` = розничная цена (retail_price), а не выручка продавца
- `avgSalePrice` = `sale_gross / salesCount`
  - `sale_gross`: из finance-summary (`s?.sale_gross ?? st?.sale_gross_total`)
  - `salesCount`: из fulfillment `fbo.salesCount + fbs.salesCount` (агрегация)
- `avgLogisticsPerUnit` = `logistics_cost / salesCount`
  - `logistics_cost`: из finance-summary
  - `salesCount`: из fulfillment (агрегация fbo + fbs)
- `avgProfitPerUnit` = `gross_profit / salesCount`
  - `gross_profit`: из finance-summary (`s?.gross_profit ?? st?.gross_profit`, тип `number | null`)
  - `salesCount`: из fulfillment (агрегация fbo + fbs)
  - **Условие отображения**: `gross_profit != null` И `salesCount > 0`. Поле `gross_profit` будет `null` когда COGS не заполнен. Не привязываемся к `cogsCoverage` — проверяем сам факт наличия значения.

**AC**:
- [ ] AC-65.2.1: 4 мини-карточки в отдельной секции "Средние показатели"
- [ ] AC-65.2.2: Каждая показывает `X руб.` + сравнение `+-руб. (+-%)` с прошлым периодом. Использовать `calculateComparison()` (подходит для рублёвых метрик).
- [ ] AC-65.2.3: avgProfitPerUnit красный если <0, зелёный если >0
- [ ] AC-65.2.4: Graceful degradation: если `gross_profit == null` — avgProfitPerUnit показывает "---" с подсказкой "Заполните COGS"
- [ ] AC-65.2.5: Graceful degradation: если `salesCount === 0` или `salesCount == null` — все 4 метрики кроме avgPriceBeforeDiscount показывают "---". avgPriceBeforeDiscount использует `ordersCount` из total (guard: `ordersCount === 0` -> "---")

**Файлы**:
- NEW: `src/components/custom/dashboard/AveragesSection.tsx`
- NEW: `src/components/custom/dashboard/AverageMetricCard.tsx`
- EDIT: `src/components/custom/dashboard/DashboardMetricsGrid.tsx` — добавить секцию средних + props
- EDIT: `src/app/(dashboard)/dashboard/components/DashboardContent.tsx` — пробросить `salesCount`, `ordersRevenue`, `ordersCount` из fulfillment

**Сложность**: M | **Приоритет**: Medium

---

## Story 65.3: ROI (Return on Investment)

**Описание**: Карточка ROI — рентабельность инвестиций.

**Данные**:
- `roi = gross_profit / (cogs_total + operationalExpenses) * 100`
- На текущий момент `operationalExpenses = 0` (будет добавлен в Wave 3)
- Fallback: `roi = gross_profit / cogs_total * 100`
- `gross_profit`: из finance-summary (`s?.gross_profit ?? st?.gross_profit`, тип `number | null`)
- `cogs_total`: из finance-summary (`s?.cogs_total ?? st?.cogs_total`, тип `number | null`)
- **Оба поля уже передаются** в `DashboardMetricsGrid` как `grossProfit` и `cogsTotal`
- **Guard условия**: ROI показывается ТОЛЬКО когда `grossProfit != null` И `cogsTotal != null` И `cogsTotal > 0`
  - `grossProfit == null` -> "---" (COGS не заполнен)
  - `cogsTotal == null` или `cogsTotal === 0` -> "---" (деление на ноль)

**AC**:
- [ ] AC-65.3.1: Показывает `XX,X%` с иконкой TrendingUp
- [ ] AC-65.3.2: Сравнение в формате процентных пунктов: `+-X,X пп` (как MarginCard). Цвет: зелёный если рост, красный если падение.
- [ ] AC-65.3.3: Цвет значения: зелёный >100%, жёлтый 50-100%, красный <50%
- [ ] AC-65.3.4: Если `grossProfit == null` ИЛИ `cogsTotal == null` ИЛИ `cogsTotal === 0` — показывать "---" с кнопкой "Заполнить COGS" (переход по `ROUTES.COGS.ROOT`)
- [ ] AC-65.3.5: Тултип: "ROI = Валовая прибыль / Себестоимость * 100%. Показывает рентабельность вложений в товар."

**Файлы**:
- NEW: `src/components/custom/dashboard/RoiCard.tsx`
- EDIT: `src/components/custom/dashboard/DashboardMetricsGrid.tsx` — добавить карточку (данные уже есть в props)

**Сложность**: S | **Приоритет**: Medium

---

## Story 65.4: ДРРз — Реклама от заказов

**Описание**: Расширить карточку рекламы: добавить ДРР (от реализации) и ДРРз (от заказов).

**Данные**:
- `drr = totalSpend / saleGross * 100` — уже вычисляется в AdvertisingCard как `pctOfSales` (строка 68). Переименовать label в "ДРР".
  - `totalSpend`: prop `AdvertisingCardProps.totalSpend` (из `advertisingQuery.current?.summary?.total_spend`)
  - `saleGross`: prop `AdvertisingCardProps.saleGross` (из finance-summary)
  - **Примечание**: наш `saleGross` = NET sales (выкупы - возвраты). Конкурент использует "реализацию". У нас нет отдельного поля "реализация", `saleGross` - ближайший аналог.
- `drrz = totalSpend / ordersRevenue * 100` — НОВЫЙ расчёт
  - `ordersRevenue`: из `fulfillmentQuery.current.summary.total.ordersRevenue` (тип `number`, есть на `FulfillmentTotal`)
  - **Примечание**: `ordersRevenue` = розничная цена (retail_price), НЕ выручка продавца. Совпадает с определением конкурента.
  - Guard: `ordersRevenue === 0` или `ordersRevenue == null` -> не показывать ДРРз

**AC**:
- [ ] AC-65.4.1: Переименовать существующий `pctOfSales` label с "от продаж" на "ДРР: XX,XX% от продаж". Добавить ниже "ДРРз: XX,XX% от заказов".
- [ ] AC-65.4.2: Формат: `XX,XX%` для каждого, используя `formatPercentage()` из `@/lib/utils`
- [ ] AC-65.4.3: Тултип объясняет разницу: "ДРР — доля рекламных расходов от продаж. ДРРз — от суммы заказов (розничная цена). ДРРз всегда ниже ДРР."
- [ ] AC-65.4.4: Если `ordersRevenue` недоступен (fulfillment не загружен) — показывать только ДРР без ДРРз

**Файлы**:
- EDIT: `src/components/custom/dashboard/AdvertisingCard.tsx` — добавить prop `ordersRevenue`, отобразить ДРРз
- EDIT: `src/components/custom/dashboard/DashboardMetricsGrid.tsx` — добавить prop `ordersRevenue` в interface и передать в AdvertisingCard
- EDIT: `src/app/(dashboard)/dashboard/components/DashboardContent.tsx` — пробросить `fulfillmentQuery.current?.summary.total.ordersRevenue`

**Сложность**: S | **Приоритет**: Low

---

## Story 65.5: Возвраты (руб. / шт)

**Описание**: Отдельная карточка возвратов.

**Данные**:
- `returnsRevenue` из fulfillment:
  - `fbo.returnsRevenue + fbs.returnsRevenue` (агрегация, т.к. `FulfillmentTotal` НЕ содержит `returnsRevenue`)
- `returnsCount` из fulfillment:
  - `fbo.returnsCount + fbs.returnsCount` (агрегация, т.к. `FulfillmentTotal` НЕ содержит `returnsCount`)
- Альтернативный источник суммы: finance-summary `wb_returns_gross` (уже передаётся как `wbReturnsGross`)
  - **Рекомендация**: использовать `wb_returns_gross` для суммы (единый источник с SalesNetCard), fulfillment для количества
- Для сравнения: аналогично из previous-period fulfillment + finance-summary

**AC**:
- [ ] AC-65.5.1: Карточка "Возвраты" с `X руб. / Y шт`. Сумма из `wbReturnsGross` (уже в DashboardMetricsGrid props), количество из fulfillment `returnsCount` (агрегация fbo+fbs).
- [ ] AC-65.5.2: Сравнение суммы с прошлым периодом: `+-руб. (+-%)` используя `calculateComparison(currentWbReturnsGross, previousWbReturnsGross, true)`. Previous `wbReturnsGross` нужно добавить в `PreviousPeriodData`.
- [ ] AC-65.5.3: Инвертированное сравнение (рост возвратов = плохо = красный). Параметр `invertComparison=true` в `calculateComparison()`.
- [ ] AC-65.5.4: Красный акцент, иконка RotateCcw
- [ ] AC-65.5.5: Graceful: если fulfillment недоступен — показывать только руб. из `wbReturnsGross`, количество "---"

**Файлы**:
- NEW: `src/components/custom/dashboard/ReturnsCard.tsx`
- EDIT: `src/components/custom/dashboard/DashboardMetricsGrid.tsx` — добавить props `returnsCount`, `previousReturnsCount`, `previousWbReturnsGross` + карточку
- EDIT: `src/app/(dashboard)/dashboard/components/DashboardContent.tsx` — агрегировать `fbo.returnsCount + fbs.returnsCount` и пробросить
- EDIT: `src/hooks/usePreviousPeriodData.ts` — добавить `wbReturnsGross` в `PreviousPeriodData` (из `s?.wb_returns_gross ?? st?.wb_returns_gross_total`)

**Сложность**: S | **Приоритет**: Medium

---

## Story 65.6: Логистика — разбивка по 4 типам (тултип)

**Описание**: Добавить тултип/поповер к карточке логистики с 4 подкатегориями.

**Данные (НУЖЕН БЭКЕНД)**:
Текущий бэкенд возвращает только `logistics_cost` (итого). Нужна разбивка:
1. К клиенту при продаже — `logistics_delivery` (doc_type = 'sale')
2. К клиенту при отмене — `logistics_delivery` (doc_type = 'cancel')
3. От клиента при отмене — `logistics_return` (doc_type = 'cancel')
4. От клиента при возврате — `logistics_return` (doc_type = 'return')

Источник данных: `WbFinanceRaw` таблица имеет `logistics_delivery`, `logistics_return`, `doc_type`.

**AC**:
- [ ] AC-65.6.1: Иконка-бейдж "4" на карточке логистики (при наличии данных разбивки)
- [ ] AC-65.6.2: При клике — Popover (shadcn/ui `Popover`) с 4 строками: название, `formatCurrency(value)`, `formatPercentage(value / saleGross * 100)` от выручки
- [ ] AC-65.6.3: Все строки красным цветом (расходы). Наибольшая по значению выделена жирным.
- [ ] AC-65.6.4: Graceful: если бэкенд не вернул разбивку (поля `logistics_breakdown` отсутствуют или `undefined`) — показывать только итого без бейджа. Компонент работает без Backend Request #139.
- [ ] AC-65.6.5: Сумма 4 подкатегорий в поповере должна совпадать с основным значением `logisticsCost` карточки (допуск ±1 руб. на округление)

**Backend Request**: Новый эндпоинт или расширение `finance-summary`:
```
GET /v1/analytics/weekly/finance-summary?week=YYYY-Wxx&include_logistics_breakdown=true
```

**Файлы**:
- EDIT: `src/components/custom/dashboard/LogisticsMetricCard.tsx` — добавить props для breakdown + бейдж
- NEW: `src/components/custom/dashboard/LogisticsBreakdownPopover.tsx`
- EDIT: `src/types/finance-summary.ts` — добавить опциональные типы разбивки логистики

**Сложность**: M | **Приоритет**: High
**Зависимость**: Backend request #139

---

## Story 65.7: Комиссия — разбивка: скидка МП / номинальная / эквайринг

**Описание**: Тултип/поповер для WbCommissionsCard с 3 подкатегориями.

**Данные (УЖЕ ЕСТЬ в props WbCommissionsCard)**:
- Скидка МП = `wbCommissionAdj` (из `wb_commission_adj` finance-summary)
  - **Примечание**: маппинг `wb_commission_adj` = "Скидка МП" нужно верифицировать с бэкенд-командой. Семантически это "корректировка комиссии WB", что может включать скидку МП.
- Номинальная комиссия = `commissionSales` (из `commission_sales` finance-summary)
- Эквайринг = `acquiringFee` (из `acquiring_fee` finance-summary)

Все 3 поля уже передаются в `WbCommissionsCard` из `DashboardContent.tsx`.
Текущая карточка суммирует 6 полей (включая `loyaltyFee`, `penaltiesTotal`, `wbServicesCost`).
Поповер покажет 3 основные подкатегории + "Прочие" = `loyaltyFee + penaltiesTotal + wbServicesCost`.

**AC**:
- [ ] AC-65.7.1: Иконка-бейдж "4" на карточке комиссий (4 строки: Скидка МП, Номинальная комиссия, Эквайринг, Прочие)
- [ ] AC-65.7.2: При клике — Popover (shadcn/ui `Popover`) с 4 строками: название, `formatCurrency(value)`, `formatPercentage(value / saleGross * 100)` от выручки
- [ ] AC-65.7.3: `wbCommissionAdj` (Скидка МП) показана зелёным цветом (компенсация продавцу, обычно отрицательное число). Остальные строки красным.
- [ ] AC-65.7.4: Итого нетто (внизу поповера) = `wbCommissionAdj + commissionSales + acquiringFee + loyaltyFee + penaltiesTotal + wbServicesCost`. Должно совпадать с основным значением карточки (та же `sumNullable()` функция).
- [ ] AC-65.7.5: "Прочие" строка = `sumNullable(loyaltyFee, penaltiesTotal, wbServicesCost)`. Показывается если хотя бы одно из 3 полей не null.
- [ ] AC-65.7.6: Все 6 полей доступны из текущих props `WbCommissionsCard` — новый проброс данных НЕ нужен. Поповер получает данные через те же props.
- [ ] AC-65.7.7: Примечание: сравнение по подкатегориям НЕ реализуется (нет отдельных previous-period значений для каждого поля в `PreviousPeriodData` — только `wbCommissionsTotal` агрегированный). Сравнение только на уровне общей карточки.

**Файлы**:
- EDIT: `src/components/custom/dashboard/WbCommissionsCard.tsx` — добавить бейдж и клик для поповера
- NEW: `src/components/custom/dashboard/CommissionBreakdownPopover.tsx`

**Сложность**: S | **Приоритет**: High

---

## Story 65.8: Настройка видимости виджетов

**Описание**: Кнопка "Настройка виджетов" — пользователь выбирает, какие карточки показывать.

**Реализация**:
- Zustand store с localStorage persistence для сохранения настроек
- Sheet/Dialog с toggle-переключателями
- По умолчанию все карточки включены

**Реализация (детали)**:
- Zustand store: `{ visibleWidgets: Record<WidgetId, boolean>, toggleWidget(id), resetAll() }`
- `WidgetId` = enum строк: `'orders' | 'sales' | 'commissions' | 'logistics' | 'payout' | 'storage' | 'cogs' | 'advertising' | 'grossProfit' | 'margin' | 'buyoutRate' | 'averages' | 'roi' | 'returns'`
- localStorage key: `wb-repricer-dashboard-widgets`
- Default: все `true`

**AC**:
- [ ] AC-65.8.1: Кнопка "Настройка виджетов" с иконкой Settings в заголовке дашборда (рядом с `DashboardPeriodSelector`)
- [ ] AC-65.8.2: Sheet (shadcn/ui `Sheet`, side="right") со списком всех виджетов и `Switch` toggle для каждого. Виджеты сгруппированы по секциям (Выручка, Расходы WB, и т.д.)
- [ ] AC-65.8.3: Настройки сохраняются в localStorage через Zustand `persist` middleware
- [ ] AC-65.8.4: Кнопка "Сбросить" в футере Sheet возвращает все к default (все включены)
- [ ] AC-65.8.5: Анимация скрытия/показа карточек через `cn('transition-all duration-300', !visible && 'hidden')`
- [ ] AC-65.8.6: Минимум 3 виджета должны быть включены (нельзя скрыть все). Валидация при toggle.

**Файлы**:
- NEW: `src/stores/dashboardWidgetsStore.ts`
- NEW: `src/components/custom/dashboard/WidgetSettingsSheet.tsx`
- EDIT: `src/app/(dashboard)/dashboard/components/DashboardContent.tsx` — добавить кнопку + фильтрацию
- EDIT: `src/components/custom/dashboard/DashboardMetricsGrid.tsx` — условный рендер карточек на основе store

**Сложность**: M | **Приоритет**: Low

---

## Зависимости Wave 1-2

```
65.1 (Процент выкупа) -> нет зависимостей (fulfillment данные уже загружаются)
65.2 (Средние)        -> 65.1 (переиспользует salesCount агрегацию) | graceful без COGS
65.3 (ROI)            -> нет зависимостей (grossProfit + cogsTotal уже в props)
65.4 (ДРРз)           -> нет зависимостей (ordersRevenue доступен на FulfillmentTotal)
65.5 (Возвраты)       -> 65.1 (переиспользует fulfilment агрегацию)
65.6 (Логистика тултип) -> Backend Request #139 (разбивка логистики)
65.7 (Комиссия тултип)  -> нет зависимостей (все 6 полей уже в WbCommissionsCard props)
65.8 (Настройка виджетов) -> после 65.1-65.7 (нужен полный список виджетов)
```

**Рекомендуемый порядок реализации**:
1. 65.1 (создаёт инфраструктуру агрегации fulfillment fbo+fbs)
2. 65.5 (переиспользует ту же агрегацию)
3. 65.2 (переиспользует salesCount + данные finance-summary)
4. 65.3 (независимая, данные есть)
5. 65.4 (добавляет ordersRevenue проброс)
6. 65.7 (данные уже в props, только UI)
7. 65.6 (зависит от бэкенда)
8. 65.8 (после всех карточек)

## Оценка трудозатрат

| Story | Размер | Часы | Зависимость |
|-------|--------|------|-------------|
| 65.1 Процент выкупа | S | 2-3 | --- |
| 65.2 Средние показатели | M | 4-6 | 65.1 (salesCount) |
| 65.3 ROI | S | 2-3 | --- |
| 65.4 ДРРз | S | 1-2 | --- |
| 65.5 Возвраты | S | 2-3 | 65.1 (fulfillment агрегация) |
| 65.6 Логистика тултип | M | 4-6 | Backend #139 |
| 65.7 Комиссия тултип | S | 2-3 | --- |
| 65.8 Настройка виджетов | M | 4-6 | 65.1-65.7 |
| **ИТОГО** | | **21-32** | |

---

## PM Validation Notes (2026-02-15)

**Validated by**: PM Agent (Claude Opus 4.6)
**Status**: VALIDATED WITH CORRECTIONS

### Corrections Applied

1. **FulfillmentTotal type gap identified and documented**: `FulfillmentTotal` only contains `ordersCount`, `ordersRevenue`, `fboShare`, `fbsShare`. It does NOT contain `salesCount`, `salesRevenue`, `returnsCount`, `returnsRevenue`. All stories requiring these fields now explicitly document the need for `fbo + fbs` manual aggregation.

2. **Story 65.1**: Added explicit note that `salesCount` requires `fbo.salesCount + fbs.salesCount` aggregation (not available on `total`). Added AC-65.1.5 for graceful degradation. Updated file list to include specific props needed.

3. **Story 65.2**: Clarified data sources per metric -- each formula now shows which API endpoint provides each field. Added AC-65.2.5 for division-by-zero guard. Added note that `ordersRevenue` is retail price, not seller revenue.

4. **Story 65.3**: Clarified that `grossProfit` and `cogsTotal` are already in `DashboardMetricsGrid` props -- no new data piping needed. Clarified COGS coverage dependency (cogsCoverage already available).

5. **Story 65.4**: Expanded file list -- need to edit 3 files (AdvertisingCard + Grid + DashboardContent), not just 2. Added note that `ordersRevenue` = retail_price.

6. **Story 65.5**: Clarified that `returnsCount/returnsRevenue` need fbo+fbs aggregation. Added recommendation to use `wb_returns_gross` for monetary value (consistent with SalesNetCard). Added AC-65.5.5 for graceful fallback.

7. **Story 65.7**: Added note that `wb_commission_adj` = "Скидка МП" mapping needs backend verification. Added AC-65.7.5 for "Прочие" line grouping `loyaltyFee + penaltiesTotal + wbServicesCost`. Current card sums 6 fields; popover should show all.

8. **Added "Общее замечание"** section at top documenting the fulfillment data piping requirement that affects stories 65.1, 65.2, 65.4, 65.5.

9. **Added recommended implementation order** based on data dependencies (65.1 creates infrastructure reused by 65.2 and 65.5).

10. **Updated dependency table** to reflect actual dependencies (65.2 and 65.5 depend on 65.1 for fulfillment aggregation infrastructure).

### Verified as Correct

- All 8 stories have proper AC, file lists, data sources, and sizing
- `commissionSales`, `acquiringFee`, `wbCommissionAdj` are already passed to WbCommissionsCard (Story 65.7)
- `advertisingSpend`, `saleGross` already passed to AdvertisingCard (Story 65.4)
- `grossProfit`, `cogsTotal`, `cogsCoverage` already in DashboardMetricsGrid props (Story 65.3)
- LogisticsMetricCard correctly identified as needing backend extension (Story 65.6)
- No missing Wave 1-2 stories identified -- scope is appropriate for frontend-calculable metrics + tooltips

### Open Questions for Backend Team
1. **Confirm `wb_commission_adj` = "Скидка МП"**: Is this the marketplace discount field? (Story 65.7)
2. **Backend Request #139**: Logistics breakdown endpoint -- ETA? (Story 65.6)

---

## PM Final Validation -- 2026-02-15

**Validator**: Senior PM Agent (Claude Opus 4.6)
**Method**: Cross-referenced every field name, formula, and data source against actual TypeScript types and component implementations.

### Validation Summary

| Story | Verdict | Notes |
|-------|---------|-------|
| 65.1 Процент выкупа | ✅ READY | Fixed: comparison format clarified to use percentage points (`formatPp`) pattern from MarginCard, not `calculateComparison()`. Added `ordersCount === 0` guard. |
| 65.2 Средние показатели | ✅ READY | Fixed: `avgProfitPerUnit` guard condition clarified to check `gross_profit != null` (not vague "нет COGS"). Division-by-zero guards for all 4 metrics explicitly specified per denominator. |
| 65.3 ROI | ✅ READY | Fixed: added explicit division-by-zero guard (`cogsTotal === 0` or `null`). Comparison format corrected to percentage points (п.п.). Tooltip text specified. |
| 65.4 ДРРз | ✅ READY | Fixed: clarified that existing `pctOfSales` in AdvertisingCard should be relabeled to "ДРР". Added AC-65.4.4 for graceful fallback when fulfillment unavailable. Guard for `ordersRevenue === 0` added. |
| 65.5 Возвраты | ✅ READY | Fixed: added `previousWbReturnsGross` to file list (needs to be added to `PreviousPeriodData` and `usePreviousPeriodData.ts`). Specified `invertComparison=true` for `calculateComparison()`. |
| 65.6 Логистика тултип | ✅ READY | Added AC-65.6.5 for sum validation. Clarified graceful degradation works without Backend #139. Specified Popover component from shadcn/ui. **Blocked by backend** but story is ready for implementation once data is available. |
| 65.7 Комиссия тултип | ✅ READY | Fixed: badge count set to "4" definitively. Added AC-65.7.6 confirming no new data piping needed. Added AC-65.7.7 documenting that per-subcategory comparison is NOT available (only aggregate `wbCommissionsTotal` in PreviousPeriodData). |
| 65.8 Настройка виджетов | ✅ READY | Added implementation details: `WidgetId` enum, localStorage key, default values. Added AC-65.8.6 for minimum widget count validation. Specified Sheet component from shadcn/ui. |

### Detailed Verification Against TypeScript Types

**Verified Type Mappings** (field -> type -> location):

| Story | Field | Type | Source File:Line |
|-------|-------|------|------------------|
| 65.1 | `FulfillmentTotal.ordersCount` | `number` | `fulfillment.ts:60` |
| 65.1 | `FulfillmentMetrics.salesCount` | `number` | `fulfillment.ts:49` |
| 65.2 | `FulfillmentTotal.ordersRevenue` | `number` | `fulfillment.ts:61` |
| 65.2 | `FinanceSummary.sale_gross` | `number?` | `finance-summary.ts:16` |
| 65.2 | `FinanceSummary.logistics_cost` | `number?` | `finance-summary.ts:24` |
| 65.2 | `FinanceSummary.gross_profit` | `number \| null` | `finance-summary.ts:72` |
| 65.3 | `FinanceSummary.cogs_total` | `number \| null` | `finance-summary.ts:68` |
| 65.4 | `AdvertisingSummary.total_spend` | `number` | `advertising-analytics.ts:107` |
| 65.5 | `FinanceSummary.wb_returns_gross` | `number?` | `finance-summary.ts:61` |
| 65.5 | `FulfillmentMetrics.returnsCount` | `number` | `fulfillment.ts:52` |
| 65.7 | `FinanceSummary.wb_commission_adj` | `number?` | `finance-summary.ts:31` |
| 65.7 | `FinanceSummary.commission_sales` | `number?` | `finance-summary.ts:40` |
| 65.7 | `FinanceSummary.acquiring_fee` | `number?` | `finance-summary.ts:38` |

**Verified Existing Props** (already piped through DashboardContent -> DashboardMetricsGrid):

| Prop | Passed at DashboardContent line | Used by |
|------|---------------------------------|---------|
| `grossProfit` | L159 | 65.3 (ROI) |
| `cogsTotal` | L153 | 65.3 (ROI) |
| `cogsCoverage` | L154 | 65.3 (ROI) |
| `advertisingSpend` | L157 | 65.4 (ДРРз) |
| `saleGross` | L140 | 65.2, 65.4 |
| `wbReturnsGross` | L142 | 65.5 (Возвраты) |
| `commissionSales` | L143 | 65.7 (Комиссия) |
| `acquiringFee` | L144 | 65.7 (Комиссия) |
| `wbCommissionAdj` | L147 | 65.7 (Комиссия) |
| `loyaltyFee` | L145 | 65.7 (Комиссия) |
| `penaltiesTotal` | L146 | 65.7 (Комиссия) |
| `wbServicesCost` | L148 | 65.7 (Комиссия) |
| `logisticsCost` | L149 | 65.6 (Логистика) |

**New Props Required** (NOT yet piped):

| Prop | Needed by | Source | Action |
|------|-----------|--------|--------|
| `salesCount` (fbo+fbs) | 65.1, 65.2, 65.5 | `fulfillmentQuery.current.summary.fbo.salesCount + fbs.salesCount` | Add aggregation in DashboardContent |
| `ordersRevenue` | 65.2, 65.4 | `fulfillmentQuery.current.summary.total.ordersRevenue` | Pass through to Grid |
| `returnsCount` (fbo+fbs) | 65.5 | `fulfillmentQuery.current.summary.fbo.returnsCount + fbs.returnsCount` | Add aggregation in DashboardContent |
| `previousSalesCount` | 65.1, 65.2 | `fulfillmentQuery.previous.summary.fbo.salesCount + fbs.salesCount` | Add aggregation in DashboardContent |
| `previousOrdersCount` | 65.1 | `fulfillmentQuery.previous.summary.total.ordersCount` | Pass through to Grid |
| `previousReturnsCount` | 65.5 | `fulfillmentQuery.previous.summary.fbo.returnsCount + fbs.returnsCount` | Add aggregation in DashboardContent |
| `previousWbReturnsGross` | 65.5 | Add to `PreviousPeriodData` | Edit usePreviousPeriodData.ts |
| `previousOrdersRevenue` | 65.2 | `fulfillmentQuery.previous.summary.total.ordersRevenue` | Already in PreviousPeriodData as `ordersAmount` |

### Formula Verification

| Formula | Verified | Notes |
|---------|----------|-------|
| `buyoutRate = salesCount / ordersCount * 100` | OK | Guard: ordersCount > 0 |
| `avgPriceBeforeDiscount = ordersRevenue / ordersCount` | OK | Guard: ordersCount > 0. ordersRevenue is retail price (intentional). |
| `avgSalePrice = sale_gross / salesCount` | OK | Guard: salesCount > 0 |
| `avgLogisticsPerUnit = logistics_cost / salesCount` | OK | Guard: salesCount > 0 |
| `avgProfitPerUnit = gross_profit / salesCount` | OK | Guard: salesCount > 0 AND gross_profit != null |
| `roi = gross_profit / cogs_total * 100` | OK | Guard: cogs_total > 0 AND cogs_total != null AND gross_profit != null |
| `drr = totalSpend / saleGross * 100` | OK | Guard: saleGross > 0 (existing logic in AdvertisingCard L68) |
| `drrz = totalSpend / ordersRevenue * 100` | OK | Guard: ordersRevenue > 0 |
| Commission netto = sum of 6 fields | OK | Matches existing `sumNullable()` in WbCommissionsCard |

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `wb_commission_adj` may not exactly equal "Скидка МП" | Medium | Story 65.7 documents this as open question. Popover label can be "Корректировка комиссии" until confirmed. |
| Backend Request #139 (logistics breakdown) delay | Low | Story 65.6 has graceful degradation (AC-65.6.4). Frontend works without it. |
| `PreviousPeriodData` interface change (adding `wbReturnsGross`) | Low | Backward compatible (new optional field). Only affects Story 65.5. |
| 200-line file limit | Medium | New components are small (S-size). DashboardMetricsGrid is 256 lines -- may need splitting after adding new cards. Monitor during 65.1 implementation. |

### TDD Readiness: CONFIRMED

All 8 stories are implementation-ready with the corrections applied above. Every acceptance criterion is:
- **Specific**: exact field names, component names, and format strings provided
- **Measurable**: numeric thresholds, color values, and format patterns defined
- **Testable**: each AC maps to a unit test assertion (render, check value, check color, check guard)
- **Data-verified**: every field cross-referenced against TypeScript types with file:line citations

**Recommended test structure per story**:
- Unit test: render component with mock data, verify display format
- Guard test: render with null/zero/undefined values, verify "---" fallback
- Comparison test: render with current + previous, verify comparison format and color
- Snapshot test: verify no unexpected UI regression

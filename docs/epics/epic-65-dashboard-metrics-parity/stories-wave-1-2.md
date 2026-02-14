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
- [ ] AC-65.1.1: Карточка показывает `XX,XX%` с иконкой
- [ ] AC-65.1.2: Сравнение с прошлым периодом: `+-пп (+-%)`
- [ ] AC-65.1.3: Тултип: "Процент выкупленных заказов за период"
- [ ] AC-65.1.4: Цвет зелёный при >=80%, жёлтый 60-80%, красный <60%
- [ ] AC-65.1.5: Graceful: если fulfillment недоступен — показывать "---"

**Файлы**:
- NEW: `src/components/custom/dashboard/BuyoutRateCard.tsx`
- EDIT: `src/components/custom/dashboard/DashboardMetricsGrid.tsx` — добавить props `salesCount`, `ordersCount`, `previousSalesCount`, `previousOrdersCount` + карточку
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
  - `gross_profit`: из finance-summary (доступно при COGS >= 100%)
  - `salesCount`: из fulfillment (агрегация fbo + fbs)

**AC**:
- [ ] AC-65.2.1: 4 мини-карточки в отдельной секции "Средние показатели"
- [ ] AC-65.2.2: Каждая показывает `X руб.` + сравнение `+-руб. (+-%)` с прошлым периодом
- [ ] AC-65.2.3: avgProfitPerUnit красный если <0, зелёный если >0
- [ ] AC-65.2.4: Graceful degradation: если нет COGS — avgProfitPerUnit показывает "---"
- [ ] AC-65.2.5: Graceful degradation: если salesCount = 0 или нет данных — показывать "---"

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
- `gross_profit`: из finance-summary (`s?.gross_profit ?? st?.gross_profit`)
- `cogs_total`: из finance-summary (`s?.cogs_total ?? st?.cogs_total`)
- **Оба поля уже передаются** в `DashboardMetricsGrid` как `grossProfit` и `cogsTotal`

**AC**:
- [ ] AC-65.3.1: Показывает `XX%` с иконкой TrendingUp
- [ ] AC-65.3.2: Сравнение: `+-пп (+-%)` с прошлым периодом
- [ ] AC-65.3.3: Цвет: зелёный >100%, жёлтый 50-100%, красный <50%
- [ ] AC-65.3.4: Если COGS не заполнен (cogsCoverage < 100%) — показывать "---" с кнопкой "Заполнить COGS"
- [ ] AC-65.3.5: Тултип: формула и объяснение

**Файлы**:
- NEW: `src/components/custom/dashboard/RoiCard.tsx`
- EDIT: `src/components/custom/dashboard/DashboardMetricsGrid.tsx` — добавить карточку (данные уже есть в props)

**Сложность**: S | **Приоритет**: Medium

---

## Story 65.4: ДРРз — Реклама от заказов

**Описание**: Расширить карточку рекламы: добавить ДРР (от реализации) и ДРРз (от заказов).

**Данные**:
- `drr = advertisingSpend / sale_gross * 100` (уже есть как `pctOfSales` в AdvertisingCard)
- `drrz = advertisingSpend / ordersRevenue * 100` (от суммы заказов)
- `ordersRevenue`: из `fulfillmentQuery.current.summary.total.ordersRevenue`
  - **Примечание**: `ordersRevenue` = розничная цена (retail_price), НЕ выручка продавца
  - Это совпадает с определением конкурента: "заказы в ₽" = розничная стоимость заказов

**AC**:
- [ ] AC-65.4.1: Показывать оба ДРР в карточке рекламы: "ДРР: XX,XX% от продаж" и "ДРРз: XX,XX% от заказов"
- [ ] AC-65.4.2: Формат: `XX,XX%` для каждого
- [ ] AC-65.4.3: Тултип объясняет разницу между ДРР и ДРРз

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
- [ ] AC-65.5.1: Карточка "Возвраты" с `X руб. / Y шт`
- [ ] AC-65.5.2: Сравнение с прошлым периодом: `+-руб. (+-%)`
- [ ] AC-65.5.3: Инвертированное сравнение (рост возвратов = плохо = красный)
- [ ] AC-65.5.4: Красный акцент, иконка RotateCcw
- [ ] AC-65.5.5: Graceful: если fulfillment недоступен — показывать только руб. из wb_returns_gross

**Файлы**:
- NEW: `src/components/custom/dashboard/ReturnsCard.tsx`
- EDIT: `src/components/custom/dashboard/DashboardMetricsGrid.tsx` — добавить props `returnsCount`, `previousReturnsCount` + карточку
- EDIT: `src/app/(dashboard)/dashboard/components/DashboardContent.tsx` — агрегировать `fbo.returnsCount + fbs.returnsCount` и пробросить

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
- [ ] AC-65.6.1: Иконка-бейдж "4" на карточке логистики (при наличии данных)
- [ ] AC-65.6.2: При клике — поповер с 4 строками: название, руб., % от выручки
- [ ] AC-65.6.3: Каждая строка с цветовой индикацией
- [ ] AC-65.6.4: Graceful: если бэкенд не вернул разбивку — показывать только итого без бейджа

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
- [ ] AC-65.7.1: Иконка-бейдж "3" (или "4" если показываем "Прочие") на карточке комиссий
- [ ] AC-65.7.2: При клике — поповер с строками: название, руб., % от выручки
- [ ] AC-65.7.3: Скидка МП показана зелёным (компенсация), остальные красным
- [ ] AC-65.7.4: Итого нетто = сумма всех (должно совпадать с основным значением карточки)
- [ ] AC-65.7.5: "Прочие" строка = `loyaltyFee + penaltiesTotal + wbServicesCost` (объединить мелкие статьи)

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

**AC**:
- [ ] AC-65.8.1: Кнопка "Настройка виджетов" с иконкой Settings в заголовке дашборда
- [ ] AC-65.8.2: Sheet/Dialog со списком всех виджетов и toggle для каждого
- [ ] AC-65.8.3: Настройки сохраняются в localStorage через Zustand persist
- [ ] AC-65.8.4: Кнопка "Сбросить" возвращает все к default (все включены)
- [ ] AC-65.8.5: Анимация скрытия/показа карточек (CSS transition)

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

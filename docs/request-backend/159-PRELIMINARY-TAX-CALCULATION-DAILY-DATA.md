# Request #159: Предварительный расчёт налогов для незавершённых недель (Daily Data)

**Date**: 2026-03-01
**Status**: 🟡 Pending
**Priority**: P1
**Related**: Backend Epic 72 (Tax Accounting), Task-50 (НДС/VAT), Frontend Epic 66-FE, Request #156, #155
**Requested By**: Frontend Team

---

## 1. Проблема

### Текущее поведение

Налоговые метрики (`TaxMetrics`) доступны **ТОЛЬКО** из endpoint `GET /v1/analytics/weekly/finance-summary?week=YYYY-Www` в поле `summary_total.tax`. Этот endpoint возвращает данные только для **завершённых** недель (присутствующих в `available-weeks`).

**Результат**: Для текущей (незавершённой) недели пользователь **не видит налоговые данные** на дашборде, хотя:
1. Налоговая система **настроена** в кабинете (`taxSystem`, `taxRate`, `vatPayer`, `vatRate`)
2. Данные о заказах и рекламе **доступны в реальном времени**
3. Пользователь ожидает видеть **предварительные** налоговые расчёты

### Бизнес-контекст

Продавцы WB принимают оперативные решения на основе чистой прибыли после налогов. Без предварительного расчёта налогов за текущую неделю:
- Невозможно оценить реальную маржинальность в реальном времени
- Нельзя планировать налоговые платежи до закрытия недели
- Дашборд показывает неполную картину (заказы/реклама есть, налоги — нет)

---

## 2. Текущая архитектура налогов

### 2.1 Настройки кабинета

**Endpoint**: `GET /v1/cabinets/:id`

```json
{
  "id": "uuid",
  "name": "My Cabinet",
  "taxSystem": "usn6",
  "taxRate": null,
  "vatPayer": true,
  "vatRate": 20
}
```

| taxSystem | Описание | taxRate |
|-----------|----------|---------|
| `null` | Не настроена | Игнорируется |
| `"usn6"` | УСН 6% (по доходам) | Авто null |
| `"usn15"` | УСН 15% (по прибыли) | Авто null |
| `"manual"` | Пользовательская ставка | Обязателен (0-100) |

НДС: `vatPayer: boolean`, `vatRate: 0 | 5 | 20 | 22 | null`

### 2.2 TaxMetrics DTO (из finance-summary)

```typescript
interface TaxMetrics {
  // Налог на доход (Epic 72)
  tax_amount: number | null       // Сумма налога
  tax_base: number | null         // База: выручка (USN6/manual) или прибыль (USN15)
  effective_tax_rate: number | null // Применённая ставка (%)
  tax_system: string | null       // 'usn6' | 'usn15' | 'manual'
  is_minimum_rule: boolean        // true = применено правило мин. 1% (USN15)
  net_profit_after_tax: number | null // Чистая прибыль после налога на доход

  // НДС (Task-50)
  vat_payer: boolean
  vat_rate: number | null         // 0, 5, 20, 22
  vat_output: number | null       // НДС от продаж
  vat_payable: number | null      // НДС к уплате
  revenue_excl_vat: number | null // Выручка без НДС
  net_profit_after_all_tax: number | null // После ВСЕХ налогов
}
```

**Расположение в ответе**: `summary_total.tax` (ТОЛЬКО). `summary_rus.tax` и `summary_eaeu.tax` — всегда `null`.

### 2.3 Формулы расчёта (бекенд, Epic 72)

**УСН 6% (по доходам)**:
```
tax_base = sales_gross_total (выручка)
tax_amount = tax_base × 6%
net_profit_after_tax = payout_total - tax_amount
```

**УСН 15% (по прибыли)**:
```
расходы = логистика + хранение + приёмка + штрафы + корректировки + COGS + реклама
прибыль = выручка − расходы
стандартный_налог = прибыль × 15%
минимальный_налог = выручка × 1%
tax_amount = MAX(стандартный_налог, минимальный_налог)
is_minimum_rule = (минимальный_налог > стандартный_налог)
```

**Manual (пользовательская ставка)**:
```
tax_base = sales_gross_total (выручка)
tax_amount = tax_base × (taxRate / 100)
```

**НДС (Task-50)**:
```
vat_output = sales_gross_total × vat_rate / (100 + vat_rate)
revenue_excl_vat = sales_gross_total - vat_output
vat_payable = vat_output - vat_input (vat_input из COGS если есть)
```

---

## 3. Доступные данные в реальном времени (Daily Endpoints)

### 3.1 Заказы — `GET /v1/analytics/orders/trends`

```
GET /v1/analytics/orders/trends?from=2026-02-24&to=2026-03-02&aggregation=day
```

Возвращает **ежедневно**:
```json
{
  "trends": [
    {
      "date": "2026-02-24",
      "ordersCount": 150,
      "revenue": 450000.00,
      "cancellations": 5,
      "returns": 3,
      "avgOrderValue": 3000.00
    }
  ],
  "summary": {
    "totalOrders": 900,
    "totalRevenue": 2700000.00
  }
}
```

**Примечание**: `revenue` = только FBS заказы (`dataSource.primary: "orders_fbs"`). Не включает FBO.

### 3.2 Реклама — `GET /v1/analytics/advertising`

```
GET /v1/analytics/advertising?from=2026-02-24&to=2026-03-02&include_daily=true
```

Возвращает:
```json
{
  "summary": {
    "total_spend": 85000.00,
    "total_revenue": 340000.00
  },
  "daily": [
    { "date": "2026-02-24", "spend": 12000.00 }
  ]
}
```

### 3.3 COGS по дням — `GET /v1/analytics/orders/volume`

```
GET /v1/analytics/orders/volume?from=2026-02-24&to=2026-03-02&include_cogs=true
```

Возвращает `by_day_with_cogs`:
```json
{
  "cogs_total": 180000.00,
  "by_day_with_cogs": [
    { "date": "2026-02-24", "cogs": 25000.00 }
  ]
}
```

### 3.4 Fulfillment — `GET /v1/fulfillment/summary`

```
GET /v1/fulfillment/summary?from=2026-02-24&to=2026-03-02
```

Возвращает агрегат FBO+FBS:
```json
{
  "total": {
    "ordersCount": 1200,
    "ordersRevenue": 3600000.00,
    "ordersRevenueDiscounted": 3200000.00
  },
  "fbo": { "ordersCount": 800, "salesCount": 700, "returnsCount": 15 },
  "fbs": { "ordersCount": 400, "salesCount": 350, "returnsCount": 8 }
}
```

**Важно**: `ordersRevenue` = розничная цена (retail_price), НЕ выручка продавца.

### 3.5 Финансовые данные (daily) — НЕ ДОСТУПНЫ ❌

`GET /v1/analytics/weekly/finance-summary` — принимает ТОЛЬКО `?week=YYYY-Www`. **Нет ежедневной разбивки**. Нет данных о логистике, хранении, приёмке, штрафах по дням.

---

## 4. Предлагаемое решение

### Вариант A: Новый endpoint для предварительного налогового расчёта (Рекомендуемый)

**Endpoint**: `GET /v1/analytics/tax/preliminary`

**Параметры**:
```
from=2026-02-24    (начало периода)
to=2026-03-02      (конец периода)
```

**Логика**:
1. Читает `taxSystem`, `taxRate`, `vatPayer`, `vatRate` из настроек кабинета
2. Если `taxSystem === null` → возвращает `null` (налоги не настроены)
3. Агрегирует доступные ежедневные данные за период
4. Рассчитывает предварительные налоги по формулам Epic 72
5. Возвращает `TaxMetrics` с пометкой `preliminary: true`

**Ответ**:
```json
{
  "tax": {
    "tax_amount": 162000.00,
    "tax_base": 2700000.00,
    "effective_tax_rate": 6.00,
    "tax_system": "usn6",
    "is_minimum_rule": false,
    "net_profit_after_tax": null,

    "vat_payer": true,
    "vat_rate": 20,
    "vat_output": 450000.00,
    "vat_payable": 420000.00,
    "revenue_excl_vat": 2250000.00,
    "net_profit_after_all_tax": null,

    "preliminary": true,
    "data_completeness": {
      "revenue_source": "orders_fbs",
      "has_logistics": false,
      "has_storage": false,
      "has_acceptance": false,
      "has_penalties": false,
      "has_cogs": true,
      "has_advertising": true
    }
  }
}
```

### Вариант B: Расширить finance-summary для незавершённых недель

Расширить `GET /v1/analytics/weekly/finance-summary?week=YYYY-Www` чтобы для незавершённых недель он:
1. Не возвращал 404
2. Возвращал `tax` объект на основе доступных daily данных
3. Помечал `preliminary: true`

**Плюсы**: Не нужен новый endpoint, фронтенд не меняется
**Минусы**: Смешивает "точные" и "предварительные" данные в одном endpoint

---

## 5. Расчёт налогов на базе ежедневных данных

### 5.1 УСН 6% (по доходам)

Самый простой случай — нужна только выручка.

**Источник выручки**: `orders/trends.summary.totalRevenue` (FBS)

```
Пример: Неделя W09 (24 фев — 2 мар), 5 дней прошло

Выручка FBS за 5 дней = 2 700 000 ₽
tax_base = 2 700 000
tax_amount = 2 700 000 × 6% = 162 000 ₽
```

**Примечание**: Выручка FBS (`orders/trends`) ≠ полная выручка продавца (`sale_gross` из weekly report). Это приближение, поэтому расчёт помечается `preliminary: true`.

### 5.2 УСН 15% (по прибыли)

Самый сложный случай — нужна выручка И расходы.

**Доступные расходы** (daily):
- ✅ COGS: `orders/volume?include_cogs=true` → `cogs_total`
- ✅ Реклама: `advertising?include_daily=true` → `summary.total_spend`

**Недоступные расходы** (только из weekly report):
- ❌ Логистика (`logistics_cost`)
- ❌ Хранение (`storage_cost`)
- ❌ Платная приёмка (`paid_acceptance_cost`)
- ❌ Штрафы (`penalties_total`)
- ❌ Корректировки (`wb_commission_adj`, `other_adjustments_net`)

```
Пример: Неделя W09, 5 дней

Выручка FBS = 2 700 000 ₽
Известные расходы:
  COGS = 180 000 ₽
  Реклама = 85 000 ₽
  Логистика = ? (не доступна daily)
  Хранение = ? (не доступно daily)
  Приёмка = ? (не доступна daily)
  Штрафы = ? (не доступны daily)

Вариант A: Считать только по известным расходам
  прибыль = 2 700 000 - 180 000 - 85 000 = 2 435 000
  стандартный = 2 435 000 × 15% = 365 250
  минимальный = 2 700 000 × 1% = 27 000
  tax_amount = 365 250 (стандартный > минимальный)

Вариант B: Экстраполировать расходы из последней завершённой недели
  W08 логистика = 120 000, хранение = 45 000, приёмка = 15 000, штрафы = 3 000
  Экстраполяция на 5/7 дней:
  логистика ≈ 120 000 × 5/7 = 85 714
  хранение ≈ 45 000 × 5/7 = 32 143
  ...
  прибыль = 2 700 000 - 180 000 - 85 000 - 85 714 - 32 143 - ... = X
  tax_amount = X × 15% (или мин. 1%)
```

**Рекомендация**: Вариант A (только известные расходы) + обязательная пометка `data_completeness` с флагами какие расходы учтены. Фронтенд покажет предупреждение пользователю.

### 5.3 Manual (пользовательская ставка)

Аналогично УСН 6% — только выручка нужна.

```
tax_base = totalRevenue (из orders/trends)
tax_amount = tax_base × (taxRate / 100)
```

### 5.4 НДС

```
vat_output = totalRevenue × vat_rate / (100 + vat_rate)
revenue_excl_vat = totalRevenue - vat_output
vat_input = cogs_total × vat_rate / (100 + vat_rate)  // если COGS доступен
vat_payable = vat_output - vat_input
```

---

## 6. Пример полного ответа

### Кабинет: УСН 6% + НДС 20%

```
Настройки: taxSystem="usn6", vatPayer=true, vatRate=20
Период: 2026-02-24 — 2026-03-01 (незавершённая неделя W09)

Данные из daily endpoints:
  orders/trends → totalRevenue = 2 700 000
  advertising → total_spend = 85 000
  orders/volume → cogs_total = 180 000
```

**Ожидаемый ответ**:
```json
{
  "tax": {
    "tax_amount": 135000.00,
    "tax_base": 2250000.00,
    "effective_tax_rate": 6.00,
    "tax_system": "usn6",
    "is_minimum_rule": false,
    "net_profit_after_tax": null,

    "vat_payer": true,
    "vat_rate": 20,
    "vat_output": 450000.00,
    "vat_payable": 420000.00,
    "revenue_excl_vat": 2250000.00,
    "net_profit_after_all_tax": null,

    "preliminary": true,
    "data_completeness": {
      "revenue_source": "orders_fbs",
      "has_logistics": false,
      "has_storage": false,
      "has_acceptance": false,
      "has_penalties": false,
      "has_cogs": true,
      "has_advertising": true
    }
  }
}
```

**Расчёт по шагам**:
```
1. НДС:
   vat_output = 2 700 000 × 20 / 120 = 450 000
   vat_input = 180 000 × 20 / 120 = 30 000
   vat_payable = 450 000 - 30 000 = 420 000
   revenue_excl_vat = 2 700 000 - 450 000 = 2 250 000

2. УСН 6% (на выручку без НДС):
   tax_base = 2 250 000
   tax_amount = 2 250 000 × 6% = 135 000

3. net_profit_after_tax = null (не рассчитываем — нет payout_total)
4. net_profit_after_all_tax = null (аналогично)
```

### Кабинет: УСН 15% без НДС

```
Настройки: taxSystem="usn15", vatPayer=false
Период: та же неделя W09

Данные:
  totalRevenue = 2 700 000
  cogs_total = 180 000
  total_spend (ads) = 85 000
  логистика/хранение/приёмка/штрафы = НЕ ДОСТУПНЫ
```

**Ожидаемый ответ**:
```json
{
  "tax": {
    "tax_amount": 365250.00,
    "tax_base": 2435000.00,
    "effective_tax_rate": 15.00,
    "tax_system": "usn15",
    "is_minimum_rule": false,
    "net_profit_after_tax": null,

    "vat_payer": false,
    "vat_rate": null,
    "vat_output": null,
    "vat_payable": null,
    "revenue_excl_vat": null,
    "net_profit_after_all_tax": null,

    "preliminary": true,
    "data_completeness": {
      "revenue_source": "orders_fbs",
      "has_logistics": false,
      "has_storage": false,
      "has_acceptance": false,
      "has_penalties": false,
      "has_cogs": true,
      "has_advertising": true
    }
  }
}
```

**Расчёт**:
```
расходы_известные = COGS(180 000) + реклама(85 000) = 265 000
прибыль = 2 700 000 - 265 000 = 2 435 000
стандартный = 2 435 000 × 15% = 365 250
минимальный = 2 700 000 × 1% = 27 000
tax_amount = MAX(365 250, 27 000) = 365 250
is_minimum_rule = false
```

---

## 7. Интеграция с фронтендом

### 7.1 Текущее состояние фронтенда

После реализации «показа частичных данных для незавершённых недель»:
- `isFinanceAvailable = false` для текущей недели
- `summary = null` (принудительно)
- `TaxWarningBanner` скрыт (`isFinanceAvailable && <TaxWarningBanner .../>`)
- Налоговые карточки показывают «—»

### 7.2 После реализации этого запроса

Фронтенд сможет:
1. Вызывать `GET /v1/analytics/tax/preliminary?from=...&to=...` для незавершённых периодов
2. Передавать `TaxMetrics` в существующие компоненты (`TaxCard`, `NetProfitCard`)
3. Показывать бейдж «Предварительно» рядом с налоговыми метриками
4. Показывать tooltip с `data_completeness` — какие расходы учтены, а какие нет
5. Убрать `isFinanceAvailable` guard с `TaxWarningBanner` — баннер будет отображаться корректно

### 7.3 Файлы фронтенда (затронутые)

| Файл | Изменение |
|------|-----------|
| `src/hooks/usePreliminaryTax.ts` | **NEW** — хук для предварительных налогов |
| `src/lib/api/tax.ts` | **NEW** — API функция |
| `src/types/finance-summary.ts` | Расширить TaxMetrics полями `preliminary`, `data_completeness` |
| `src/components/custom/dashboard/TaxCard.tsx` | Показывать бейдж «Предварительно» |
| `src/components/custom/dashboard/DashboardContent.tsx` | Убрать guard, подключить preliminary tax |

---

## 8. Критерии приёмки

### Обязательные (MVP)

- [ ] Endpoint `GET /v1/analytics/tax/preliminary?from=...&to=...` возвращает `TaxMetrics`
- [ ] Расчёт УСН 6% на базе `orders/trends.totalRevenue`
- [ ] Расчёт УСН 15% на базе доступных расходов (COGS + реклама)
- [ ] Расчёт manual ставки
- [ ] Расчёт НДС (если `vatPayer=true`)
- [ ] Поле `preliminary: true` в ответе
- [ ] Поле `data_completeness` с флагами доступных данных
- [ ] Если `taxSystem === null` → возвращает `{ tax: null }`
- [ ] 401 для неавторизованных, 403 для wrong cabinet

### Желательные

- [ ] `net_profit_after_tax` рассчитан если хотя бы выручка и COGS доступны
- [ ] Кеширование с TTL 60s (данные daily меняются часто)
- [ ] Экстраполяция расходов из последней завершённой недели (Вариант B из п. 5.2)

---

## 9. Вопросы к бекенд-команде

1. **Источник выручки**: `orders/trends.totalRevenue` = только FBS. Для полноценного расчёта нужна FBO выручка. Есть ли daily endpoint для FBO revenue? Или использовать `fulfillment/summary.ordersRevenueDiscounted`?

2. **Расходы для USN 15%**: Есть ли возможность получить ежедневные данные по логистике/хранению из существующих таблиц (например, `paid_storage_daily` для хранения)?

3. **Пересчёт при закрытии недели**: Когда неделя закрывается и появляется finance-summary, предварительные расчёты заменяются точными автоматически? Или нужен механизм инвалидации?

4. **Реюзабельность**: Можно ли переиспользовать существующие сервисы расчёта налогов из Epic 72 (`TaxCalculationService`?) с подменой источника данных (daily вместо weekly)?

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-03-01 | Frontend Team (Claude) | Initial document created |

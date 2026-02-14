# Epic 65 — Backend Gap Analysis & API Specifications

Анализ текущих возможностей бэкенда и необходимых доработок для Dashboard Metrics Parity.

---

## 1. Текущие данные: что уже доступно

### finance-summary (полный набор полей)

| Группа | Поле | Описание | Используется |
|--------|------|----------|:------------:|
| **Выручка** | `sale_gross` / `sale_gross_total` | NET продажи (sales - returns) | ✅ |
| | `sales_gross` / `sales_gross_total` | Только продажи (doc_type='sale') | ✅ |
| | `returns_gross` / `returns_gross_total` | Только возвраты | ❌ Не на дашборде |
| | `wb_sales_gross` / `wb_sales_gross_total` | WB Dashboard "Продажа" exact | ✅ SalesNetCard |
| | `wb_returns_gross` / `wb_returns_gross_total` | WB Dashboard "Возврат" exact | ✅ SalesNetCard |
| | `to_pay_goods` / `to_pay_goods_total` | К перечислению за товар | ❌ |
| **Комиссии** | `commission_sales` / `_total` | Комиссия продаж | ✅ WbCommissionsCard |
| | `acquiring_fee` / `_total` | Эквайринг | ✅ WbCommissionsCard |
| | `loyalty_fee` / `_total` | Лояльность | ✅ WbCommissionsCard |
| | `wb_commission_adj` / `_total` | Корректировки (Удержание) | ✅ WbCommissionsCard |
| | `total_commission_rub` / `_total` | Общая комиссия WB | ❌ Не используется |
| | `retail_price_total` / `_combined` | Розничная цена итого | ❌ |
| **Расходы** | `logistics_cost` / `_total` | Логистика итого | ✅ LogisticsCard |
| | `storage_cost` / `_total` | Хранение | ✅ StorageCard |
| | `paid_acceptance_cost` / `_total` | Платная приёмка | ✅ StorageCard |
| | `penalties_total` | Штрафы | ✅ WbCommissionsCard |
| **WB Сервисы** | `wb_services_cost` / `_total` | Сервисы WB итого | ✅ WbCommissionsCard |
| | `wb_promotion_cost` / `_total` | Продвижение WB | ❌ Не на дашборде |
| | `wb_jam_cost` / `_total` | Подписка Джем | ❌ |
| | `wb_other_services_cost` / `_total` | Прочие сервисы | ❌ |
| **Прочее** | `other_adjustments_net` / `_total` | Корректировки и сервисы | ❌ |
| | `seller_delivery_revenue` / `_total` | DBS/EDBS доставка | ❌ |
| | `loyalty_compensation` / `_total` | Компенсация лояльности | ❌ |
| | `loyalty_points_withheld` / `_total` | Удержание баллов | ❌ |
| **COGS** | `cogs_total` | Себестоимость | ✅ CostsCard |
| | `cogs_coverage_pct` | % покрытия | ✅ CostsCard |
| | `gross_profit` | Валовая прибыль | ✅ GrossProfitCard |
| | `margin_pct` | Маржинальность | ✅ MarginCard |
| **Итого** | `payout_total` | К перечислению | ✅ PayoutCard |

### fulfillment/summary

| Поле | Описание | Используется |
|------|----------|:------------:|
| `total.ordersCount` | Заказы (FBO+FBS) | ✅ OrdersCard |
| `total.ordersRevenue` | Сумма заказов (розничная цена!) | ❌ Убрали |
| `total.fboShare` / `fbsShare` | Доли FBO/FBS | ❌ |
| `fbo.salesCount` / `fbs.salesCount` | Выкупы | ❌ Нужно для 65.1 |
| `fbo.salesRevenue` / `fbs.salesRevenue` | Выручка выкупов | ❌ |
| `fbo.returnsCount` / `fbs.returnsCount` | Возвраты шт | ❌ Нужно для 65.5 |
| `fbo.returnsRevenue` / `fbs.returnsRevenue` | Возвраты ₽ | ❌ Нужно для 65.5 |

### advertising/analytics

| Поле | Описание | Используется |
|------|----------|:------------:|
| `summary.total_spend` | Расходы на рекламу | ✅ AdvertisingCard |
| `summary.overall_roas` | ROAS | ✅ AdvertisingCard |
| `summary.total_sales` | Продажи через рекламу | ❌ |

---

## 2. GAP: Что отсутствует в бэкенде

### Категория A: Данные доступны, нужна агрегация/эндпоинт

| # | Метрика | Источник данных | Что нужно сделать |
|---|---------|----------------|-------------------|
| A1 | **Логистика по 4 типам** | `WbFinanceRaw.logistics_delivery`, `logistics_return`, `doc_type` | Агрегация по doc_type в finance-summary |
| A2 | **Штрафы отдельно** | `WbFinanceRaw.penalties` | Уже агрегируется как `penalties_total = SUM(ABS(penalties))`. Нужно разделить по знаку: штрафы (penalties > 0) vs компенсации штрафов (penalties < 0) |
| A3 | **Компенсации отдельно** | `WbFinanceRaw.corrections` | Поле `corrections` сейчас суммируется вместе с `other_adjustments` в `other_adjustments_net`. Нужно выделить `corrections` отдельно. **Важно**: `corrections` содержит как удержания WB (Продвижение, Джем), так и компенсации — нужна фильтрация по `reason` |
| A4 | **Реализация (GMV)** | `WeeklyPayoutSummary.salesGross` | `salesGross` = SUM(net_for_pay) WHERE doc_type='sale' — это и есть Реализация (gross sales before returns deduction). `sale_gross` = salesGross - returnsGross (NET). Поле уже доступно, нужно только вывести на дашборд |

### Категория B: Нужен новый эндпоинт/таблица

| # | Метрика | Что нужно | Сложность |
|---|---------|-----------|-----------|
| B1 | **Остатки** | Агрегация `InventorySnapshot` по кабинету | M |
| B2 | **Капитализация по себес.** | JOIN InventorySnapshot × COGS | M |
| B3 | **Капитализация по розн.** | JOIN InventorySnapshot × Products (retail_price) | M |
| B4 | **Налоги** | Настройка налоговой системы в кабинете + расчёт | L |
| B5 | **Операционные расходы** | Новая таблица + CRUD | L |

### Категория C: Только фронтенд-расчёты (бэкенд не нужен)

| # | Метрика | Формула | Данные для расчёта |
|---|---------|---------|-------------------|
| C1 | **Процент выкупа** | salesCount / ordersCount × 100 | fulfillment.fbo.salesCount + fbs.salesCount, total.ordersCount |
| C2 | **ROI** | net_profit / (cogs_total + operational_expenses) × 100 | finance-summary + expenses (см. формулу в секции 4). При отсутствии opex: gross_profit / cogs_total × 100 (упрощённый) |
| C3 | **ДРРз** | adSpend / ordersRevenue × 100 | advertising + fulfillment |
| C4 | **Ср. цена продажи** | sale_gross / salesCount | finance-summary + fulfillment |
| C5 | **Ср. логистика/шт** | logistics_cost / salesCount | finance-summary + fulfillment |
| C6 | **Ср. прибыль/шт** | gross_profit / salesCount | finance-summary + fulfillment |
| C7 | **Оборачиваемость** | totalStock / (salesCount / days) | inventorySummary + fulfillment |
| C8 | **Ср. цена до скидок** | retail_price_total / salesCount | finance-summary + fulfillment. **Примечание**: `retail_price_total` = SUM(retail_price) WHERE doc_type='sale', поэтому делить нужно на salesCount (количество выкупов), а не ordersCount |

---

## 3. Backend Requests

### Request #139: Logistics Breakdown by doc_type

**Цель**: Разбивка логистики на 4 подкатегории.

**Текущее состояние**: `WbFinanceRaw` содержит `logistics_delivery` и `logistics_return` с `doc_type` (sale/return/cancel).

**Предлагаемое решение**: Расширить finance-summary response:

```json
{
  "summary_rus": {
    "logistics_cost": 23748,
    "logistics_breakdown": {
      "delivery_on_sale": 16602.31,
      "delivery_on_cancel": 4845.49,
      "return_on_cancel": 2200.00,
      "return_on_return": 100.00
    }
  }
}
```

**SQL агрегация** (в existing aggregation service):
```sql
SUM(CASE WHEN doc_type = 'sale' THEN logistics_delivery ELSE 0 END) as delivery_on_sale,
SUM(CASE WHEN doc_type IN ('cancel', 'storno') THEN logistics_delivery ELSE 0 END) as delivery_on_cancel,
SUM(CASE WHEN doc_type IN ('cancel', 'storno') THEN logistics_return ELSE 0 END) as return_on_cancel,
SUM(CASE WHEN doc_type = 'return' THEN logistics_return ELSE 0 END) as return_on_return
```

**Сложность**: M | **Изменения**: aggregation service + response DTO

---

### Request #140: Inventory Summary Aggregation

**Цель**: Агрегировать остатки по кабинету из InventorySnapshot.

**Предлагаемое API**:
```
GET /v1/inventory/summary
Headers: Authorization, X-Cabinet-Id

Response: {
  data: {
    totalStock: 2988,
    onWarehouse: 2756,
    inWayToClient: 207,
    inWayFromClient: 25,
    capitalizationByCogs: 0,       // null если COGS не заполнен
    capitalizationByRetail: 2297861,
    uniqueSkus: 145,
    lastUpdated: "2026-02-14T10:00:00Z",
    warehouseBreakdown: [
      { name: "Коледино", count: 1200 },
      { name: "Подольск", count: 800 }
    ]
  }
}
```

**Реализация**: Агрегация из `InventorySnapshot` WHERE `cabinetId` = X, latest snapshot per nmId.

**Маппинг полей Prisma → Response**:
- `totalStock` (Prisma: `total_stock`) → `totalStock` (кол-во на складах WB)
- `onWarehouse` = `SUM(totalStock)` (в InventorySnapshot `totalStock` = количество на складе, без учёта в пути)
- `inWayToClient` (Prisma: `in_way_to_client`) → `inWayToClient`
- `inWayFromClient` (Prisma: `in_way_from_client`) → `inWayFromClient`
- `warehouseBreakdown` (Prisma: `warehouse_breakdown` JSON) → группировка по складам

**Примечание**: `totalStock` в InventorySnapshot хранит остаток на складе, `inWayToClient`/`inWayFromClient` — отдельные поля. Итоговый `totalStock` в response = SUM(totalStock) + SUM(inWayToClient) + SUM(inWayFromClient).

**Сложность**: M

---

### Request #141: Tax Settings in Cabinet Profile

**Цель**: Хранить налоговую систему кабинета для автоматического расчёта налогов.

**Изменение Prisma schema**:
```prisma
model Cabinet {
  // ... existing fields
  taxSystem     String?   @map("tax_system") @db.VarChar(10) // usn6, usn15, osn, patent
  taxRate       Decimal?  @map("tax_rate") @db.Decimal(5, 2)  // custom rate override
}
```

**API**:
```
PATCH /v1/cabinets/:id
Body: { taxSystem: "usn6", taxRate?: 6.0 }
```

**Сложность**: S

---

### Request #142: Separate Penalties and Compensations

**Цель**: Разделить штрафы и компенсации для отдельного отображения.

**Текущее состояние**:
- `penalties_total = SUM(ABS(penalties))` — агрегируется корректно как штрафы
- `corrections` поле в WbFinanceRaw суммируется с `other_adjustments` в `other_adjustments_net`
- WB Services (Продвижение, Джем, Прочие) уже выделены из `corrections` (Request #56)
- `other_adjustments_net = SUM(other_adjustments + corrections)` — включает как корректировки, так и удержания

**Нужно**:
1. Выделить `corrections` отдельно от `other_adjustments` в response
2. Разделить `penalties` по знаку: штрафы (>0) vs компенсации штрафов (<0)

**Расширение response**:
```json
{
  "summary_rus": {
    "penalties_total": 0,
    "penalties_fines": 0,             // NEW: SUM(penalties) WHERE penalties > 0
    "penalties_compensations": 0,      // NEW: ABS(SUM(penalties)) WHERE penalties < 0
    "corrections_total": 0,            // NEW: SUM(corrections) — отдельно от other_adjustments
    "other_adjustments_only": 0        // NEW: SUM(other_adjustments) — без corrections
  }
}
```

**Важно**: WB Services (`wb_promotion_cost`, `wb_jam_cost`, `wb_other_services_cost`) уже выделены из `corrections` через Request #56. Новые поля должны быть согласованы, чтобы не было двойного учёта.

**Сложность**: S-M (нужна аккуратная работа с агрегацией, чтобы не сломать `other_adjustments_net`)

---

### Request #143: Operational Expenses CRUD

**Цель**: CRUD для пользовательских операционных расходов.

**Новая таблица**:
```prisma
model OperationalExpense {
  id          String   @id @default(uuid()) @db.Uuid
  cabinetId   String   @map("cabinet_id") @db.Uuid
  category    String   @db.VarChar(50) // rent, salary, packaging, transport, other
  amount      Decimal  @db.Decimal(15, 2)
  month       String   @db.VarChar(7) // YYYY-MM
  description String?  @db.VarChar(255)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  cabinet     Cabinet  @relation(fields: [cabinetId], references: [id])

  @@unique([cabinetId, category, month])
  @@index([cabinetId, month])
  @@map("operational_expenses")
}
```

**API**:
```
POST   /v1/expenses          — создать расход
GET    /v1/expenses?month=YYYY-MM  — список за месяц
PUT    /v1/expenses/:id      — обновить
DELETE /v1/expenses/:id      — удалить
GET    /v1/expenses/summary?from=&to=  — итого за период
```

**Сложность**: L

---

## 4. Формулы для фронтенд-расчётов

### Чистая прибыль (Net Profit)
```
net_profit = sale_gross_total
           - cogs_total
           - logistics_cost_total
           - storage_cost_total
           - paid_acceptance_cost_total
           - penalties_total
           - other_adjustments_net_total
           - wb_commission_adj_total
           - advertising_spend          // из advertising/analytics API
           - operational_expenses        // из Request #143 (пользовательский ввод)
           - taxes                       // из Request #141 (расчётные)
```

**Важно о комиссиях**:
- `sale_gross_total` = SUM(net_for_pay) — это выручка ПОСЛЕ вычета комиссий WB (commission_sales, acquiring_fee уже вычтены WB из розничной цены)
- Поэтому `commission_sales` и `acquiring_fee` НЕ вычитаются отдельно в формуле чистой прибыли
- `wb_commission_adj_total` — это отдельная корректировка ("Удержание"), НЕ дублирование основной комиссии
- `other_adjustments_net_total` = SUM(other_adjustments + corrections) — включает WB Services (Продвижение, Джем)

### Прибыль без операционных
```
profit_no_opex = net_profit + operational_expenses
```

### Маржинальность
```
net_margin_pct = net_profit / sale_gross_total × 100
```

### ROI
```
roi = net_profit / (cogs_total + operational_expenses) × 100
```

### Налоги
```
// Налоговая база для УСН = sale_gross_total (NET = sales - returns)
// Для ОСН = розничная цена (retail_price)

// УСН 6% (Доходы)
tax_base = sale_gross_total         // Доходы = NET выручка
tax = tax_base × taxRate            // taxRate из Cabinet settings (default 0.06)

// УСН 15% (Доходы-Расходы)
tax_base = sale_gross_total - (logistics_cost_total + storage_cost_total + paid_acceptance_cost_total
           + penalties_total + advertising_spend + cogs_total + other_adjustments_net_total)
tax = MAX(tax_base × 0.15, sale_gross_total × 0.01)  // Минимальный налог = 1% от дохода

// ОСН (НДС 20%)
tax = sale_gross_total × 0.20 / 1.20  // НДС "в том числе" (упрощённый расчёт)
```

**Примечание**: Налоговый расчёт сильно упрощён. Не учитывает: страховые взносы (вычитаются из УСН 6%), торговый сбор, авансовые платежи, нюансы ОСН (НДС к вычету), патентную систему. Рекомендуется добавить дисклеймер в UI.

### Оборачиваемость
```
days_in_period = periodType === 'week' ? 7 : daysInMonth(month)
daily_sales = salesCount / days_in_period
turnover_by_sales = totalStock / daily_sales  // дней

daily_orders = ordersCount / days_in_period
turnover_by_orders = totalStock / daily_orders  // дней
```

---

## 5. Приоритизация Backend Requests

| Приоритет | Request | Блокирует | Сложность |
|-----------|---------|-----------|-----------|
| 1 (High) | #140 Inventory Summary | 65.9 + 65.10 (остатки, оборачиваемость) | M |
| 2 (High) | #139 Logistics Breakdown | 65.6 (логистика тултип) | M |
| 3 (Medium) | #142 Penalties/Compensations | 65.12 (штрафы отдельно) | S-M |
| 4 (Medium) | #141 Tax Settings | 65.11 (налоги) | S |
| 5 (Low) | #143 Operational Expenses | 65.14 (опер. расходы) | L |

---

## 6. Риски и ограничения

1. **fulfillment ordersRevenue ≠ seller revenue**: `ordersRevenue` — розничная цена (до комиссий WB), нельзя использовать как финансовую метрику продавца. Для ДРРз (C3) использовать с оговоркой.
2. **orders/trends = FBS only**: Нет FBO заказов, нельзя использовать как единственный источник ordersCount. Для общих заказов использовать `fulfillment/summary.total.ordersCount`.
3. **COGS coverage < 100%**: Формулы прибыли/маржи/ROI ненадёжны при неполном покрытии. Рекомендуется показывать `cogs_coverage_pct` рядом с метрикой и добавлять визуальное предупреждение.
4. **InventorySnapshot freshness**: Данные могут быть неактуальны (зависит от периодичности синхронизации). Поле `syncedAt` покажет дату последнего обновления.
5. **Налоговый расчёт**: Упрощённый, не учитывает все нюансы налогового законодательства (страховые взносы, торговый сбор, авансовые платежи). Обязателен дисклеймер в UI.
6. **fulfillment.total не содержит salesCount**: `total` объект включает только `ordersCount`, `ordersRevenue`, `fboShare`, `fbsShare`. Для получения `salesCount` фронтенд должен вычислять: `fbo.salesCount + fbs.salesCount`.
7. **corrections ≠ компенсации**: Поле `corrections` в WbFinanceRaw содержит разнородные записи: удержания за WB-сервисы (Продвижение, Джем), штрафные компенсации, прочие корректировки. Разделение на "компенсации" vs "удержания" требует фильтрации по `reason` и `payload_json->>'bonus_type_name'`.
8. **Комиссия нетто**: Конкурент показывает "Комиссия = Скидка МП + Номинальная комиссия + Эквайринг". В нашей системе: `total_commission_rub` = general commission metric, `commission_sales` = номинальная, `acquiring_fee` = эквайринг, `wb_commission_adj` = корректировка (Удержание). Скидка МП может быть рассчитана: `retail_price_total - sales_gross_total - total_commission_rub_total` (разница между розничной ценой и суммой продаж + комиссия). Требуется верификация формулы на реальных данных.
9. **Двойной учёт WB Services**: `wb_services_cost` (Request #56) УЖЕ включена в `other_adjustments_net`. При добавлении новых полей в Request #142 нужно аккуратно разделять, чтобы сумма подкатегорий = `other_adjustments_net`.

---

## 7. Validation Log

**Validated by**: Backend Architect Agent
**Date**: 2026-02-15
**Method**: Cross-reference with Prisma schema, backend aggregation SQL, API-PATHS-REFERENCE.md, test-api HTTP files, frontend types

### Corrections Applied

| # | Section | Issue | Fix |
|---|---------|-------|-----|
| 1 | 2/A2 | `penalties_total` described as needing separation from something, but it is already a standalone aggregate `SUM(ABS(penalties))` | Clarified: penalties is already separate. Need sign-based split (fines vs compensations) |
| 2 | 2/A3 | Described `corrections` as "compensations" — oversimplified | Clarified: `corrections` is mixed (WB services + compensations + deductions), needs `reason`-based filtering |
| 3 | 2/A4 | Formula `salesGross + returnsGross` for Реализация | Fixed: Реализация = `salesGross` only (gross sales before return deduction). `sale_gross = salesGross - returnsGross` is NET |
| 4 | 2/C2 | ROI formula `gross_profit / cogs_total` contradicts Section 4 formula | Fixed: aligned with Section 4 (`net_profit / (cogs + opex)`), with fallback noted |
| 5 | 2/C8 | Avg price before discounts divides by `ordersCount` | Fixed: `retail_price_total` is SUM for doc_type='sale' — must divide by `salesCount` |
| 6 | 3/#140 | `onWarehouse` field not in Prisma schema | Added field mapping clarification: `totalStock` in InventorySnapshot = on-warehouse stock |
| 7 | 3/#142 | Request described as splitting `penalties_total` | Rewrote: need both sign-based penalty split AND separate `corrections` extraction |
| 8 | 4/Net Profit | Formula used `sale_gross` without `_total` suffix, no explanation of commission handling | Added `_total` suffixes, added clarification that `sale_gross_total` is post-commission |
| 9 | 4/Taxes | USN 15% missing minimum tax rule | Added `MAX(tax, 1% of revenue)` minimum tax |
| 10 | 6/Risks | Only 5 risks listed, missing critical items | Added 4 risks: salesCount not in total, corrections semantics, commission netto mapping, WB Services double-counting |

### Verified Correct

- Section 1: All finance-summary field names match Prisma schema (`WeeklyPayoutSummary`, `WeeklyPayoutTotal`)
- Section 1: fulfillment/summary fields match `FulfillmentMetrics` interface and backend service
- Section 2/A1: Logistics breakdown correctly identifies need — current aggregation does `SUM(ABS(logistics_delivery + logistics_return))` without doc_type split
- Section 3/#139: SQL aggregation pattern is correct; `doc_type` values ('sale', 'return', 'cancel', 'storno') match backend usage
- Section 3/#140: InventorySnapshot model has correct fields (`totalStock`, `inWayToClient`, `inWayFromClient`, `warehouseBreakdown`)
- Section 3/#141: Cabinet model extension is straightforward; PATCH endpoint already exists
- Section 3/#143: OperationalExpense table design is sound; unique constraint on [cabinetId, category, month] is appropriate
- Section 4: Turnover formulas are mathematically correct
- Section 5: Priority ordering is reasonable (inventory blocks most downstream metrics)
- Section 2/B3: `Products` model does NOT have `retail_price` field (only `nmId`, `vendorCode`, `brand`, `category`, `subject`). Capitalization by retail would need data from `WbFinanceRaw.retailPrice` or `InventorySnapshot` enrichment. **Minor gap noted but not blocking.**

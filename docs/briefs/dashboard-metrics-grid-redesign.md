# Product Brief: Dashboard Metrics Grid Redesign

**Epic**: 64-FE (proposed)
**Priority**: High
**Author**: Product Manager
**Date**: 2026-02-14
**Status**: Draft

---

## 1. Problem Statement

The current 8-card metrics grid does not follow a P&L (Profit & Loss) information flow. A Wildberries seller opening the dashboard cannot answer the three fundamental questions within 3 seconds:

1. "Сколько я заработал?" (How much did I earn?)
2. "Сколько я потратил?" (How much did I spend?)
3. "Сколько мне заплатят?" (How much will I get paid?)

### Current Layout (problematic)

```
Row 1: Заказы FBO/FBS (252шт) | COGS заказов (10K) | Выкупы (124K) | COGS выкупов (56K)
Row 2: Реклама (10K)          | Логистика (27K)    | Хранение (1.6K)| Теор.прибыль (28K)
```

### Specific Problems

| # | Problem | Impact |
|---|---------|--------|
| 1 | No P&L flow (Revenue -> Costs -> Profit) | User scans left-to-right but sees random metrics |
| 2 | "Заказы FBO/FBS" shows count (252) as primary, revenue (1M) as tiny subtitle | The most valuable number is visually deprioritized |
| 3 | Two separate COGS cards with no margin % visible | User cannot assess profitability at a glance |
| 4 | Missing "К перечислению" (payout) | THE most important metric for WB sellers is absent |
| 5 | "Теор. прибыль" mixes order revenue with buyout expenses | Inconsistent formula base confuses financial analysis |
| 6 | No margin % shown anywhere in the grid | CFOs need margin, not just absolute numbers |

---

## 2. User Stories

### US-1: P&L Flow at a Glance (Business Owner)

**As a** business owner with 500+ SKUs on Wildberries,
**I want** the dashboard to show my weekly P&L in a natural left-to-right, top-to-bottom flow,
**so that** I can understand my financial position within 3 seconds of opening the page.

**Acceptance**: Row 1 reads as "Revenue story", Row 2 reads as "Cost story", ending with profit/payout.

### US-2: Payout Visibility (Business Owner)

**As a** Wildberries seller who relies on weekly payouts for cash flow,
**I want** to see "К перечислению" (payout amount) prominently on the dashboard,
**so that** I know exactly how much money WB will transfer to my bank account this week.

**Acceptance**: Payout card is visually prominent (highlighted border), shows `payout_total` from finance-summary API.

### US-3: Margin Analysis (CFO)

**As a** financial director analyzing profitability,
**I want** to see margin percentage alongside revenue and COGS,
**so that** I can quickly assess whether our margins are healthy without opening a separate report.

**Acceptance**: Margin % is displayed as subtitle on the Gross Profit card. Green when positive, red when negative.

### US-4: Cost Structure Awareness (CFO)

**As a** financial director managing expenses,
**I want** Row 2 to show my cost categories with their share of revenue,
**so that** I can identify which cost line is growing disproportionately.

**Acceptance**: Each expense card shows "X% от выручки" as subtitle. Inverted comparison (cost decrease = green).

### US-5: Period Comparison (Business Owner)

**As a** business owner tracking weekly dynamics,
**I want** every metric card to show comparison with the previous period,
**so that** I can spot trends without switching between weeks manually.

**Acceptance**: Each card shows delta badge (green/red) with percentage and absolute difference vs. previous period.

---

## 3. Proposed Layout

### Information Architecture: P&L Flow

```
Row 1 (Revenue Story):  Money In -> What Sold -> What We Keep -> What WB Pays
Row 2 (Cost Story):     Ad Spend -> Delivery  -> WB Fees      -> Net Result
```

### Card Specification

#### Row 1: Revenue Flow

| Position | Card | Current | Proposed |
|----------|------|---------|----------|
| R1C1 | Orders | Заказы FBO/FBS (count primary) | **Заказы** (revenue primary) |
| R1C2 | Buyouts | Выкупы (no context) | **Выкупы** (with buyout rate %) |
| R1C3 | Gross Profit | COGS выкупов (raw number) | **Валовая прибыль** (margin %) |
| R1C4 | Payout | Missing entirely | **К перечислению** (highlighted) |

#### Row 2: Cost Structure

| Position | Card | Current | Proposed |
|----------|------|---------|----------|
| R2C1 | Advertising | Реклама (no ROAS) | **Реклама** (with ROAS) |
| R2C2 | Logistics | Логистика (ok) | **Логистика** (with % of revenue) |
| R2C3 | WB Commission | COGS заказов (misplaced) | **Комиссия WB** (new metric) |
| R2C4 | Net Profit | Теор. прибыль (inconsistent) | **Чистая прибыль** (consistent formula) |

---

## 4. Detailed Card Specifications

### Card 1 (R1C1): Заказы

| Property | Value |
|----------|-------|
| **Title** | Заказы |
| **Icon** | Package (blue-500) |
| **Primary metric** | Orders revenue in RUB (from orders/trends API or fulfillment summary `total.ordersRevenue`) |
| **Format** | `formatCurrency()` e.g. "242 738 ₽" |
| **Subtitle** | Order count: "25 шт (FBO: 224, FBS: 28)" |
| **Comparison** | vs previous period revenue, standard direction (increase = green) |
| **Color** | Blue (#3B82F6) for value |
| **Tooltip** | "Сумма всех заказов за период. Включает FBO (со склада WB) и FBS (со склада продавца). Не все заказы будут выкуплены." |
| **Data source** | `fulfillmentQuery.current.summary.total.ordersRevenue` or `orders/trends` revenue |
| **Rationale** | Revenue is what matters to a seller, not count. Count moves to subtitle. |

### Card 2 (R1C2): Выкупы

| Property | Value |
|----------|-------|
| **Title** | Выкупы |
| **Icon** | ShoppingBag (green-500) |
| **Primary metric** | `wb_sales_gross_total` from finance-summary |
| **Format** | `formatCurrency()` e.g. "124 423 ₽" |
| **Subtitle** | Buyout rate: "Выкуп: XX%" (calculated as `wb_sales_gross / ordersRevenue * 100` when both available) |
| **Comparison** | vs previous period `wb_sales_gross_total`, standard direction |
| **Color** | Green (#22C55E) for value |
| **Tooltip** | "Фактическая выручка продавца за выкупленные товары. Отличается от заказов, так как часть заказов возвращается." |
| **Data source** | `summaryRus.wb_sales_gross` or `summaryTotal.wb_sales_gross_total` |
| **Rationale** | Buyout rate % shows conversion from orders to actual revenue. Critical for understanding returns impact. |

### Card 3 (R1C3): Валовая прибыль

| Property | Value |
|----------|-------|
| **Title** | Валовая прибыль |
| **Icon** | TrendingUp (green-500 or red-500 based on sign) |
| **Primary metric** | `gross_profit` from finance-summary (backend-calculated: `wb_sales_gross - cogs_total`) |
| **Format** | `formatCurrency()` e.g. "-7 231 ₽" |
| **Subtitle** | Margin %: "Маржа: XX,X%" (calculated as `(wb_sales_gross - cogs_total) / wb_sales_gross * 100`) |
| **Comparison** | vs previous period `gross_profit`, standard direction |
| **Value color** | Green (#22C55E) when >= 0, Red (#EF4444) when < 0 |
| **Subtitle color** | Same semantic: green/red based on margin sign |
| **Tooltip** | "Выручка минус себестоимость товаров (COGS). Показывает прибыль до вычета расходов на логистику, рекламу и комиссии." |
| **COGS warning** | If `cogs_coverage_pct < 100`, show badge: "COGS: XX%" with link to COGS assignment page |
| **Data source** | `summaryRus.gross_profit` or calculated `wb_sales_gross - cogs_total` |
| **Rationale** | Replaces separate "COGS выкупов" card. Shows the result of Revenue - COGS, which is what matters. Margin % is the key CFO metric. |

### Card 4 (R1C4): К перечислению

| Property | Value |
|----------|-------|
| **Title** | К перечислению |
| **Icon** | Wallet (primary/blue-600) |
| **Primary metric** | `payout_total` from finance-summary |
| **Format** | `formatCurrency()` e.g. "49 293 ₽" |
| **Subtitle** | "За товар: XX ₽" showing `to_pay_goods_total` |
| **Comparison** | vs previous period `payout_total`, standard direction |
| **Value color** | Blue (#3B82F6) |
| **Visual emphasis** | Highlighted card: border-2 border-blue-500, gradient background `from-blue-50 to-white` |
| **Tooltip** | "Итоговая сумма к перечислению от Wildberries на ваш расчётный счёт. Учитывает все комиссии, штрафы и удержания." |
| **Data source** | `financialComparison.current.summary_total.payout_total` |
| **Rationale** | THE most important number for a WB seller. "How much money am I actually getting?" Currently missing from the grid entirely. |

### Card 5 (R2C1): Реклама

| Property | Value |
|----------|-------|
| **Title** | Реклама |
| **Icon** | Megaphone (yellow-600) |
| **Primary metric** | `total_spend` from advertising API |
| **Format** | `formatCurrency()` e.g. "10 473 ₽" |
| **Subtitle** | "ROAS: X.Xx" (from advertising API `roas` field) or "XX% от выручки" |
| **Comparison** | vs previous period `total_spend`, **inverted** direction (decrease = green) |
| **Value color** | Yellow (#F59E0B) |
| **Tooltip** | "Расходы на рекламу в Wildberries. ROAS = выручка / расходы на рекламу." |
| **Data source** | `advertisingQuery.current.summary.total_spend`, `advertisingQuery.current.summary.roas` |
| **Rationale** | Keeps current card but adds ROAS as subtitle for efficiency context. |

### Card 6 (R2C2): Логистика

| Property | Value |
|----------|-------|
| **Title** | Логистика |
| **Icon** | Truck (red-500) |
| **Primary metric** | `logistics_cost_total` from finance-summary |
| **Format** | `formatCurrency()` e.g. "27 232 ₽" |
| **Subtitle** | "XX% от выручки" (calculated as `logistics_cost / wb_sales_gross * 100`) |
| **Comparison** | vs previous period `logistics_cost_total`, **inverted** direction |
| **Value color** | Red (#EF4444) |
| **Tooltip** | "Расходы на доставку товаров покупателям и возвраты." |
| **Data source** | `summaryRus.logistics_cost` or `summaryTotal.logistics_cost_total` |
| **Rationale** | Same as current, already well-implemented. |

### Card 7 (R2C3): Удержания WB

| Property | Value |
|----------|-------|
| **Title** | Удержания WB |
| **Icon** | Building2 (purple-500) |
| **Primary metric** | Sum of: `commission_sales_total` + `storage_cost_total` + `penalties_total` + `other_adjustments_net_total` |
| **Format** | `formatCurrency()` e.g. "70 680 ₽" |
| **Subtitle** | "Комиссия: XX ₽ | Хранение: XX ₽" (top 2 components) |
| **Comparison** | vs previous period same sum, **inverted** direction |
| **Value color** | Purple (#7C4DFF) |
| **Tooltip** | "Все удержания Wildberries: комиссия за продажу, хранение, штрафы и прочие корректировки. Не включает логистику и рекламу (показаны отдельно)." |
| **Data source** | Multiple fields from finance-summary, summed |
| **Expandable** | Click to see breakdown popover with all components |
| **Rationale** | Replaces separate "Хранение" card. Combines all WB-side deductions into one card, since individual amounts (storage 1.6K, penalties 0) are too small for dedicated cards. Gives seller a complete picture of "what WB takes". |

### Card 8 (R2C4): Чистая прибыль

| Property | Value |
|----------|-------|
| **Title** | Чистая прибыль |
| **Icon** | Calculator (dynamic color) |
| **Primary metric** | `wb_sales_gross - cogs_total - total_spend - logistics_cost - storage_cost - penalties - other_adjustments` |
| **Format** | `formatCurrency()` e.g. "-38 107 ₽" |
| **Subtitle** | "Рентаб.: XX,X%" (net margin = net profit / wb_sales_gross * 100) |
| **Comparison** | vs previous period, standard direction |
| **Value color** | Green (#22C55E) when >= 0, Red (#EF4444) when < 0 |
| **Visual emphasis** | Highlighted card: border-2, gradient background (green-50 or red-50 based on sign) |
| **Tooltip** | "Чистая прибыль = Выкупы - COGS - Реклама - Логистика - Удержания WB. Показывает реальный финансовый результат за период." |
| **COGS warning** | Same as Card 3: if `cogs_coverage_pct < 100`, show incomplete data badge |
| **Expandable** | "Показать разбивку" link opens breakdown popover (reuse ProfitBreakdownPopover pattern) |
| **Data source** | Calculated from finance-summary + advertising API fields |
| **Rationale** | Replaces "Теор. прибыль". Uses consistent base (Выкупы, not Заказы). Includes ALL costs, not just COGS+logistics+storage+advertising. The name "Чистая прибыль" is clearer than "Теоретическая прибыль". |

---

## 5. Visual Flow Diagram

```
ROW 1 (Revenue Story):
  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌═════════════╗
  │  Заказы     │ -> │  Выкупы     │ -> │ Вал.прибыль │ -> ║К перечисл.  ║
  │  242 738 ₽  │    │  124 423 ₽  │    │  -7 231 ₽   │    ║  49 293 ₽   ║
  │  25 шт      │    │  Выкуп: 51% │    │  Маржа: -6%  │    ║  За товар:  ║
  │  (FBO/FBS)  │    │  +12%       │    │  COGS: 80%   │    ║  131 951 ₽  ║
  └─────────────┘    └─────────────┘    └─────────────┘    ╚═════════════╝
       blue              green           green/red           blue highlight

ROW 2 (Cost Story):
  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌═════════════╗
  │  Реклама    │    │  Логистика  │    │ Удержания   │    ║Чист.прибыль ║
  │  10 473 ₽   │    │  27 232 ₽   │    │  70 680 ₽   │    ║ -38 107 ₽   ║
  │  ROAS: 8.1x │    │  22% выруч. │    │ Ком: 15K    │    ║ Рент: -31%  ║
  │  -3%        │    │  +5%        │    │ Хран: 1.7K  │    ║             ║
  └─────────────┘    └─────────────┘    └─────────────┘    ╚═════════════╝
       yellow             red              purple          green/red highlight
```

The eye naturally follows:
1. Left-to-right in Row 1: "I got orders -> some were bought -> here is my gross margin -> here is what WB pays me"
2. Left-to-right in Row 2: "I spent on ads -> delivery costs -> WB took fees -> here is my real profit"

---

## 6. Data Source Mapping

### Fields from `finance-summary` API (weekly)

| Card | Field(s) | Fallback |
|------|----------|----------|
| Card 2: Выкупы | `wb_sales_gross` / `wb_sales_gross_total` | `sale_gross_total` |
| Card 3: Вал. прибыль | `gross_profit`, `cogs_total`, `cogs_coverage_pct` | Calculate: `wb_sales_gross - cogs_total` |
| Card 4: К перечислению | `payout_total`, `to_pay_goods_total` | None (always present) |
| Card 6: Логистика | `logistics_cost` / `logistics_cost_total` | None |
| Card 7: Удержания WB | `commission_sales_total`, `storage_cost_total`, `penalties_total`, `other_adjustments_net_total` | Use `_total` suffix variants |
| Card 8: Чистая прибыль | All above combined | Calculate from components |

### Fields from `fulfillment` API

| Card | Field(s) |
|------|----------|
| Card 1: Заказы | `summary.total.ordersRevenue`, `summary.total.ordersCount`, `summary.fbo.*`, `summary.fbs.*` |

### Fields from `advertising` API

| Card | Field(s) |
|------|----------|
| Card 5: Реклама | `summary.total_spend`, `summary.roas` |

### Previous Period (all cards)

Same fields from `financialComparison.previous`, `fulfillmentQuery.previous`, `advertisingQuery.previous`.

---

## 7. Acceptance Criteria

### Functional

- [ ] All 8 cards render with correct data from their respective APIs
- [ ] Row 1 follows Revenue flow: Orders -> Buyouts -> Gross Profit -> Payout
- [ ] Row 2 follows Cost flow: Advertising -> Logistics -> WB Fees -> Net Profit
- [ ] "К перечислению" card shows `payout_total` with highlighted styling
- [ ] "Валовая прибыль" card shows margin % as subtitle
- [ ] "Удержания WB" card aggregates commission + storage + penalties + other adjustments
- [ ] "Чистая прибыль" uses consistent formula based on Выкупы (not Заказы)
- [ ] All cards show period comparison (delta badge with % change)
- [ ] Expense cards (Row 2, cards 5-7) use inverted comparison logic
- [ ] Cards 4 and 8 have highlighted visual treatment (border-2, gradient background)
- [ ] Breakdowns are expandable via popover on cards 7 and 8

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| COGS coverage = 0% | Cards 3, 8: Show "COGS не назначен" badge, link to COGS page, value shows "---" |
| COGS coverage < 100% | Cards 3, 8: Show "COGS: XX%" warning badge, calculate with available data, yellow border |
| COGS coverage = 100% | Cards 3, 8: Normal display, green COGS badge |
| No orders data (fulfillment not synced) | Card 1: Show "Нет данных" + sync button (current behavior) |
| No advertising data | Card 5: Show "---" for spend, hide ROAS subtitle |
| `payout_total` = 0 | Card 4: Show "0 ₽" (valid scenario for weeks with only deductions) |
| Negative payout | Card 4: Show negative value in red (seller owes WB) |
| `gross_profit` negative | Card 3: Red value, red margin %, red trend indicator |
| No previous period available | All cards: Hide comparison badge, show only current value |
| All values null (first week) | Show skeleton or "Нет данных" consistently across all cards |
| Buyout rate > 100% | Card 2: Cap display at 100%, add tooltip explaining data timing |
| Orders revenue = 0 | Card 2: Hide buyout rate subtitle (division by zero) |

### Non-Functional

- [ ] Grid responsive: 4 cols (xl), 2 cols (md), 1 col (sm) -- same as current
- [ ] Each card min-height 120px, highlighted cards min-height 140px
- [ ] WCAG 2.1 AA: all cards have `role="article"`, `aria-label`, color contrast >= 4.5:1
- [ ] Keyboard navigable: Tab through cards, Enter to expand breakdowns
- [ ] Russian locale: all numbers formatted with spaces and comma decimal
- [ ] Tooltips on every card explaining the metric
- [ ] Loading: skeleton grid (reuse `DashboardMetricsGridSkeleton`)
- [ ] Error: individual card error states with retry button (reuse `MetricCardError`)

---

## 8. Migration Plan

### What Changes

| Current Component | Action | New Component |
|-------------------|--------|---------------|
| `FulfillmentMetricCard` | **Modify** | Show revenue as primary, count as subtitle |
| `SalesMetricCard` | **Modify** | Add buyout rate % subtitle |
| `SalesCogsMetricCard` | **Replace** | New `GrossProfitMetricCard` with margin % |
| `OrdersCogsMetricCard` | **Remove** | Data moves into Card 7 (Удержания) context |
| (missing) | **Create** | New `PayoutMetricCard` (highlighted) |
| `AdvertisingMetricCard` | **Modify** | Add ROAS subtitle |
| `LogisticsMetricCard` | **Keep** | Minor: ensure % of revenue subtitle |
| `StorageMetricCard` | **Replace** | New `WbDeductionsMetricCard` (aggregated) |
| `TheoreticalProfitCard` | **Replace** | New `NetProfitCard` (consistent formula) |

### Props Changes to `DashboardMetricsGrid`

New props needed:
- `payoutTotal: number | undefined`
- `toPayGoodsTotal: number | undefined`
- `grossProfit: number | undefined`
- `marginPct: number | undefined`
- `commissionSalesTotal: number | undefined`
- `penaltiesTotal: number | undefined`
- `otherAdjustmentsTotal: number | undefined`
- `roas: number | undefined`
- `ordersRevenue: number | undefined` (already available via fulfillment)

Props to remove:
- `ordersCogs` (no longer a standalone card)

### `PreviousPeriodData` Changes

Add fields:
- `payoutTotal: number | null`
- `grossProfit: number | null`
- `commissionSalesTotal: number | null`
- `penaltiesTotal: number | null`
- `otherAdjustmentsTotal: number | null`
- `roas: number | null`

Remove:
- `ordersCogs: number | null`

---

## 9. Implementation Stories

| Story | Title | Estimate | Dependencies |
|-------|-------|----------|--------------|
| 64.1-FE | Modify FulfillmentMetricCard: revenue primary, count subtitle | 2 SP | None |
| 64.2-FE | Modify SalesMetricCard: add buyout rate % | 1 SP | None |
| 64.3-FE | Create GrossProfitMetricCard (replaces SalesCogsMetricCard) | 3 SP | None |
| 64.4-FE | Create PayoutMetricCard (new, highlighted) | 3 SP | None |
| 64.5-FE | Modify AdvertisingMetricCard: add ROAS subtitle | 1 SP | None |
| 64.6-FE | Create WbDeductionsMetricCard (replaces StorageMetricCard) | 3 SP | None |
| 64.7-FE | Create NetProfitCard (replaces TheoreticalProfitCard) | 3 SP | 64.3 |
| 64.8-FE | Update DashboardMetricsGrid layout and props | 2 SP | 64.1-64.7 |
| 64.9-FE | Update DashboardContent data wiring | 2 SP | 64.8 |
| 64.10-FE | Update PreviousPeriodData and comparison hooks | 2 SP | 64.8 |
| 64.11-FE | Unit tests for all new/modified cards | 3 SP | 64.1-64.10 |
| 64.12-FE | E2E test: dashboard metrics grid flow | 2 SP | 64.11 |

**Total estimate**: 27 SP (~2 sprints)

---

## 10. Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| `gross_profit` field not always populated by backend | Medium | Card 3 shows "---" | Frontend calculates fallback: `wb_sales_gross - cogs_total` |
| Fulfillment API returns 404 (not deployed) | Low | Card 1 degrades | Keep current "Скоро" fallback state |
| ROAS field missing from advertising API summary | Low | Card 5 missing subtitle | Calculate client-side: `wb_sales_gross / total_spend` |
| Aggregated "Удержания WB" confuses users used to seeing "Хранение" separately | Medium | User complaints | Expandable breakdown popover shows all components individually |
| `payout_total` can be negative (seller owes WB) | Low | Visual confusion | Red color + tooltip explaining scenario |

---

## 11. Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Time to answer "how much will I get paid" | N/A (metric missing) | < 2 seconds | User testing |
| Dashboard comprehension score | Untested | > 80% correct answers in 5-question quiz | User testing with 10 sellers |
| Support tickets about dashboard confusion | Baseline TBD | -50% | Support ticket tracking |
| Dashboard bounce rate | Baseline TBD | -20% | Analytics |

---

## Appendix A: Formula Reference

```
Валовая прибыль = wb_sales_gross - cogs_total
Маржа %        = (wb_sales_gross - cogs_total) / wb_sales_gross * 100
Выкуп %        = wb_sales_gross / ordersRevenue * 100
ROAS           = wb_sales_gross / total_spend  (where total_spend > 0)
Удержания WB   = commission_sales + storage_cost + penalties + other_adjustments_net
Чистая прибыль = wb_sales_gross - cogs_total - total_spend - logistics_cost
                 - commission_sales - storage_cost - penalties - other_adjustments_net
Рентабельность = Чистая прибыль / wb_sales_gross * 100
```

## Appendix B: Color Reference

| Element | Hex | CSS Class | Usage |
|---------|-----|-----------|-------|
| Orders | #3B82F6 | `text-blue-500` | Card 1 value |
| Buyouts / Revenue | #22C55E | `text-green-500` | Card 2 value, positive profit |
| Loss | #EF4444 | `text-red-500` | Negative values, logistics cost |
| Payout highlight | #3B82F6 | `border-blue-500` | Card 4 border |
| Advertising | #F59E0B | `text-yellow-600` | Card 5 value |
| WB Deductions | #7C4DFF | `text-purple-500` | Card 7 value |
| Profit highlight (positive) | #22C55E | `border-green-500` | Card 8 border when positive |
| Profit highlight (negative) | #EF4444 | `border-red-500` | Card 8 border when negative |
| COGS warning | #F59E0B | `border-yellow-500` | Cards 3, 8 when coverage < 100% |

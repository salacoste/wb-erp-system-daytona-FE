---
id: doc-1
title: Monitor Dashboard — Backend Spec & Frontend Implementation Plan
type: other
created_date: '2026-04-18 15:16'
---
## Overview

Monitor Dashboard — new page inspired by Indeepa's monitor, adapted for our analytics platform (no repricer). Consists of 5 blocks, powered by 8 parallel API requests, all from existing backend endpoints.

**Route (proposed):** `/monitoring/dashboard` or `/monitor`
**All backend endpoints are READY** — no backend blockers.

---

## Block 1: KPI Cards ("Суточный пульс")

| Metric | Endpoint | Field | Status |
|---|---|---|---|
| Артикулов всего | `GET /v1/products/cogs-coverage` | `productCount` | ✅ Ready |
| Артикулов с COGS | same | `productsWithCogs` | ✅ Ready |
| Покрытие COGS, % | same | `cogsPercent` | ✅ Ready |
| Выкуп за 30д, % | `GET /v1/analytics/buyout/summary?from=30d_ago&to=today&source=blended` | `overallBuyoutRatePct` | ✅ Ready |
| Уведомлений WB | ❌ | — | No WB notifications API |
| Артикулов в акциях | ❌ | — | No promo-participation API |

---

## Block 2: Metrics Table (4 periods — Today / Yesterday / 30d / prev 30d)

**Source:** `GET /v1/analytics/daily/finance?from=YYYY-MM-DD&to=YYYY-MM-DD`

4 parallel requests:
```
todayData    = daily/finance?from=today&to=today
yesterdayData = daily/finance?from=yesterday&to=yesterday
last30Data   = daily/finance?from=30d_ago&to=today
prev30Data   = daily/finance?from=60d_ago&to=30d_ago
```

**Field mapping from response:**

| UI Metric | Source | Computation |
|---|---|---|
| Заказы, шт | data[] | `sum(salesCount + returnsCount)` |
| Продажи, шт | data[] | `sum(salesCount)` |
| Выручка, руб | summary | `totalRevenue` |
| Продажи по себестоимости, руб | summary | `totalCogs` |
| Расходы, руб | mixed | `totalLogistics + totalStorage + sum(penalties + paidAcceptance + commission)` |
| Маржа, руб | summary | `totalOperatingProfit` (NEW field from backend Epics 89-91) |
| Возвраты, шт | data[] | `sum(returnsCount)` |

**Type definition:**
```typescript
interface MonitorPeriodMetrics {
  ordersCount: number;
  salesCount: number;
  revenue: number;
  cogs: number;
  expenses: number;
  margin: number; // from totalOperatingProfit
  returnsCount: number;
}
```

**Note:** "Today" for daily/finance may have no data (daily_sales_raw updates with lag). For real-time today orders, supplement with:
`GET /v1/analytics/orders/volume?from=today&to=today` → `orderCount`, `ordersSumRub`

---

## Block 3: Weekly Chart (7 days)

**Source:** `GET /v1/analytics/daily/finance?from=7d_ago&to=today`

3 lines on chart:
- **Продажи** (blue): `day.salesCount`
- **Заказы** (green): `day.salesCount + day.returnsCount`
- **Возвраты** (orange): `day.returnsCount`

For real-time orders accuracy: supplement with `GET /v1/analytics/orders/volume?from=7d_ago&to=today`

---

## Block 4: Buyout Rate (30d)

**Source:** `GET /v1/analytics/buyout/summary?from=30d_ago&to=today&source=blended`
**Field:** `overallBuyoutRatePct` (number, e.g., 93)

---

## Block 5: Last Recalculations + Errors

**Source:** `GET /v1/monitoring/dashboard`

- **Last recalc:** `pipelines.filter(p => p.lastSuccessAt).sort(by lastSuccessAt desc)[0]`
- **Errors:** `pipelines.filter(p => p.status !== 'healthy')`

No WB notifications API exists — replace with pipeline health indicators.

---

## Full API Request Schema

```
Monitor Dashboard load:
├─ Parallel block 1 (KPI cards):
│   ├─ GET /v1/products/cogs-coverage
│   └─ GET /v1/analytics/buyout/summary
│
├─ Parallel block 2 (Table — 4 periods):
│   ├─ GET /v1/analytics/daily/finance?from=today&to=today
│   ├─ GET /v1/analytics/daily/finance?from=yesterday&to=yesterday
│   ├─ GET /v1/analytics/daily/finance?from=30d_ago&to=today
│   └─ GET /v1/analytics/daily/finance?from=60d_ago&to=30d_ago
│
├─ Parallel block 3 (Weekly chart):
│   └─ GET /v1/analytics/daily/finance?from=7d_ago&to=today
│
├─ Parallel block 4 (Monitoring):
│   └─ GET /v1/monitoring/dashboard
│
└─ Total: 8 parallel requests
```

All data backend-cached (10 min TTL). Frontend can poll every 5-10 min.

---

## Not Available (Indeepa features we can't replicate)

| Indeepa Metric | Status | Reason |
|---|---|---|
| Репрайсер errors | ❌ | We don't have a repricer |
| WB Notifications (83) | ❌ | WB has no seller notifications API |
| Promo participation count | ❌ | WB has no promo-participation API |

---

## Dependencies

- `totalOperatingProfit` field requires backend Epics 89-91 integration (see backlog task-11)
- All other endpoints are production-ready
- Existing hooks can be reused: `useDailyMetrics`, `useBuyoutAnalytics`; new hook needed for `cogs-coverage` and `monitoring/dashboard`

# /analytics/dashboard — Сводка по кабинету (Cabinet Summary)
**Route:** `/analytics/dashboard` · **Filters state:** week=W26, type=week (URL-synced)

## 1. Load
- HTTP statusMap (all 200): `GET /v1/analytics/weekly/cabinet-summary?weekStart=2026-W26&weekEnd=2026-W26`, `GET /v1/analytics/weekly/available-weeks`, `GET /v1/analytics/supply-planning`, cabinet meta.
- Renders: H1 "Сводка по кабинету", period selector (Неделя/Месяц), P&L waterfall (Выручка → Удержания → К перечислению → Валовая прибыль → Ключевые метрики), TopProducts + TopBrands tables, PnLWaterfall.
- No console errors.

## 2. Interactive elements
- **Period selector (Неделя/Месяц)** → URL updates `?week=2026-W26&type=week`. **PASS.**
- **Week selector** → drives `weekStart/weekEnd` for cabinet-summary. **PASS.**
- COGS warning banner: "Требуется 100% покрытие себестоимости… 3% (1/37)" — graceful handling when cogs coverage incomplete. ✅

## 3. Data vs API (`GET /v1/analytics/weekly/cabinet-summary`)
| Rendered (W26) | API field | Match |
|---|---|---|
| Продажи (GMV) 624 532 ₽ | `order_sum` / GMV (sale_gross+returns) | ✅ |
| Возвраты −4 198 ₽ | `summary.totals.returns_gross = 4198` | ✅ |
| Продажи (розница) 620 334 ₽ | `summary.totals.sale_gross = 620333.59` | ✅ |
| Комиссия WB 37,6% −233 181 ₽ | commission component | ✅ |
| Логистика 12,0% −74 635 ₽ | logistics component | ✅ |
| К перечислению 311 545 ₽ (50,2%) | `summary.totals.payout_total = 311545.26` | ✅ |
| "WB удерживает 49,8%" | derived from payout/sale ratio | ✅ |

## 4. AP#8 runtime
- COGS-dependent "Валовая прибыль" section shows coverage warning instead of fabricated number when cogs incomplete. ✅

## 5. Findings
- None. All values API-faithful, period selector URL-synced.

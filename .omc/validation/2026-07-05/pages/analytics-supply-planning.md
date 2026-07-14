# /analytics/supply-planning — Планирование поставок

**Route:** `/analytics/supply-planning` · **Filters state:** default (velocity_weeks=4, safety_stock_days=14), no week param, sort by days_until_stockout asc
**Validated:** 2026-07-06 · FE `:3100` · BE `:3000` · cabinet `f75836f7-…`

## 1. Load — ✅
- `/v1/analytics/supply-planning?limit=20` (no `week`) → **200** (50 SKUs total, paginated)
- Summary cards (5 risk buckets + Требуют внимания + Требуется капитал + В пути), table (10 cols), per-row expandable detail drawer. No skeleton stuck, no console errors specific to this page.

## 2. Interactive elements — ✅
| Element | Action | Effect | Verdict |
|---|---|---|---|
| Summary card click (e.g. «Критично 9») | click | filters table to that risk bucket (`show_only=stockout_risk`) | ✅ (config) |
| Sort headers (Статус/Артикул/Остаток/В пути/Скорость/Дней/Заказать/Сумма/Цена) | click | toggles sort, URL `?sort_by&sort_order` | ✅ |
| Запас (safety_stock_days) selector | change | `?safety_stock_days=` | ✅ |
| Скорость (velocity_weeks) selector | change | `?velocity_weeks=` | ✅ |
| Обновить button | click | refetch | ✅ |
| CSV export | click | downloads CSV | ✅ (not deep-tested) |
| Показать детали (row) | click e476 | inline detail drawer expands (Текущая ситуация / Тренд / Распределение по складам / Прогноз на 7 дней / Рекомендация по заказу / Анализ затрат) | ✅ |
| Заказать / Срочно buttons | click | supply-creation flow | ✅ (not deep-tested) |
| Копировать инфо / Отметить заказ / История заказов (in drawer) | click | drawer actions | ✅ |

## 3. Data vs API — ✅ exact (but see BD-41 uniform-velocity)
Raw payload: `supply-planning-W26.raw.json`.

| Rendered | API field | ✅/⚠️/❌ |
|---|---|---|
| Summary «Нет в наличии 7 SKU» | `summary.out_of_stock_count = 7` | ✅ |
| Summary «Критично 9 SKU» | `summary.stockout_critical = 9` | ✅ |
| Summary «Внимание 1 SKU» | `summary.stockout_warning = 1` | ✅ |
| Summary «Низкий запас 0 SKU» | `summary.stockout_low = 0` | ✅ |
| Summary «В норме 33 SKU» | `summary.healthy_stock = 33` | ✅ |
| Summary «Требуют внимания 17 SKU» | `50 − healthy_stock(33) − ... = 17` (out_of_stock 7 + critical 9 + warning 1) | ✅ |
| Summary «(16 срочно)» | `reorder_urgent = 11` + `out_of_stock = 7` − 2 (overlap) ≈ 16 | ⚠️ derivation unclear (counts reconcile numerically; exact formula not source-traced) |
| Summary «Требуется капитал 547 870 ₽» | `summary.total_reorder_value = 547870` | ✅ exact |
| Row ter-10 «Остаток 5 / 14 шт/д / Сегодня / 318 шт / 219 420 ₽ / —» | `current_stock=5` / `avg_daily_sales=14.39` / `days_until_stockout=0` / `reorder_quantity=318` / `reorder_value=219420` / `selling_price=null→—` | ✅ |
| Row k-01 (no cogs) «Сумма — / Цена 103 ₽ / Заказать» | `reorder_value=null→—` (AP#8 ✅) / `selling_price=103` | ✅ |
| Row er1500un (no cogs) «Сумма — / Цена —» | `reorder_value=null→—` / `selling_price=null→—` | ✅ |

## 4. AP#8 runtime — ✅ (cleaner than storage)
- `reorder_value: toNullableNumber(...) ?? undefined` (`supply-planning-normalizer.ts:50`) → renders «—» when null. ✅
- `cogs_per_unit`, `selling_price`, `days_until_stockout` use `toNullableNumber` → nulls propagate. ✅
- No-cogs items (k-01, er1500un) show «Себестоимость не указана» in drawer + «—» for Сумма/Цена. ✅ Defensive Frontend Principle respected.
- **BUT `avg_daily_sales: toNullableNumber(...) ?? 0`** (`:39`) — BD-5 normalizer concern. On current data the backend returns a **uniform 14.39 for every item** (see BD-41 below), so `null→0` is NOT the active failure mode; instead the backend's synthetic uniform velocity is the problem. `total_reorder_value ?? 0` (`:80`) is fine (547870 is a real value).

## 5. Findings
- **BD-5 (downgraded — normalizer `?? 0` is latent, NOT active).** `supply-planning-normalizer.ts:39` `avg_daily_sales ?? 0` would zero null velocity, but the backend currently returns a uniform synthetic `14.39` for ALL items (not null), so no "0 шт/д" is rendered. The FE adds a «Нет данных о тренде продаж» tooltip + the detail drawer shows «Недостаточно данных» / «Нет данных» for trend. Latent defensive gap remains; active defect is BE-owned (BD-41).
- **BD-17 (CONFIRMED LIVE, low/labeling).** Detail drawer «Рекомендация по заказу → Горизонт планирования: 8 дней» — the value is `safety_stock_units(121) / avg_daily_sales(14.39) = 8.4 ≈ 8`, i.e. **safety-stock coverage days, not a planning horizon**. File:line `SupplyDetailRightColumn.tsx` + `supply-planning-utils.ts:67-72`. The label "Горизонт планирования" is misleading. Fix: rename «Срок покрытия страхового запаса (дней)». Already in the BD audit (BD-17).
- **BE-BUG (BE-BUGS-C.md) — uniform synthetic velocity.** Every one of the 50 SKUs returns `avg_daily_sales = 14.39` (and `days_until_stockout = 0`) — even healthy items («В норме 33 SKU»). The reorder quantities (318/315/323/320 шт) and «Требуется капитал 547 870 ₽» are computed from this uniform velocity, so the per-SKU recommendation is unreliable. Forecast-source breakdown says `ml:43, velocity:7`, yet all rows show identical 14.39 → the ML path is returning a constant. See `BE-BUGS-C.md` BE-C-1.
- **BD-42 (new, low/advisory).** «Прогноз на 7 дней» for k-01 (stock=0) shows 0→0 шт СТОКАУТ each day + «≈ 98 шт упущенных продаж / ≈ 10 058 ₽» — the loss is derived from the same uniform 14/day velocity, so the ₽-loss figure inherits BD-41's unreliability. Defensive advisory only (no fabricated null), flagging data-lineage.

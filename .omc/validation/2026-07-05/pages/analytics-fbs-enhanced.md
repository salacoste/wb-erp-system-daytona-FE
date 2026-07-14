# /analytics/fbs-enhanced — Расширенная аналитика FBS

**Route:** `/analytics/fbs-enhanced` · **Filters state:** period 07.06.2026—06.07.2026 (last 30 days, default)
**Validated:** 2026-07-06 · FE `:3100` · BE `:3000` · cabinet `f75836f7-…`

## 1. Load — ✅ (KNOWN BE-500 from matrix D1 is FIXED)
- `/v1/analytics/fbs/enhanced?from=2026-06-07&to=2026-07-06` → **200** (was 500 in the UX-validation matrix D1; now returns full payload).
- Page renders 5 sections: Статистика заказов, Аналитика остатков, Региональное распределение, Расчётные метрики, Воронка конверсии. No console errors, no skeleton stuck.
- **D1 RESOLVED.** No BE bug to file here — the 500 is gone.

## 2. Interactive elements — ✅
| Element | Action | Effect | Verdict |
|---|---|---|---|
| Period button «Выбран период: 07.06—06.07» | click | opens date range picker | ✅ |
| "Очистить период" (img) | click | clears range | ✅ (not deep-tested) |
| Regional table sort / pagination | — | — | ✅ (config) |

## 3. Data vs API — ✅ exact
Raw payload: `fbs-enhanced.raw.json`.

**Статистика заказов** (FBS orders empty in W26 → all 0):
| Rendered | API (`orderStats`) | ✅/⚠️/❌ |
|---|---|---|
| «Всего заказов 0» | `ordersCount=0` | ✅ |
| «Сумма заказов 0 ₽» | `ordersSumRub=0` | ✅ |
| «Доставлено 0» | `deliveredOrders=0` | ✅ |
| «Отменено 0» | `cancelCount=0` | ✅ |
| «Процент выкупа 0,0 %» | `buyoutRate=0` | ✅ |
| «Процент отмен 0,0 %» | `cancelRate=0` | ✅ |
| «Средний чек: 0 ₽» | `avgOrderValue=0` | ✅ |

**Аналитика остатков:**
| Rendered | API (`stockAnalytics`) | ✅ |
|---|---|---|
| «Товары (SKU) 51» | `productCount=51` | ✅ |
| «Единиц на складе 3 870» | `totalStock=3870` | ✅ |
| «Доступно 3 870» | `availableStock=3870` | ✅ |
| «Зарезервировано 0» | `reservedStock=0` | ✅ |
| «В пути 0» | `inTransit=0` | ✅ |

**Расчётные метрики:**
| Rendered | API (`calculatedMetrics`) | ✅/⚠️/❌ |
|---|---|---|
| «Оборачиваемость 0,00 раз за период» | `turnoverRate=0` | ✅ (literal 0, no sales) |
| «Дней покрытия остатков **999,0**» | `stockCoverageDays=999` | ⚠️ **BD-43** (999 sentinel shown as real number) |
| «Заказов на товар 0,00» | `ordersPerProduct=0` | ✅ |

**Воронка конверсии:**
| Rendered | API (`orderStats`) | ✅ |
|---|---|---|
| «Конверсия в корзину —» | `addToCartPercent=null → '—'` | ✅ AP#8 |
| «Конверсия в заказ —» | `ordersPercent=null → '—'` | ✅ AP#8 |

## 4. AP#8 runtime — ⚠️ one defect (BD-43)
- `addToCartPercent`/`ordersPercent` null → «—». ✅
- `turnoverRate`/`ordersPerProduct` literal 0 → "0,00" (acceptable: real zero, no sales). ✅
- **BD-43:** `stockCoverageDays = 999` (backend sentinel for "no sales → infinite coverage") is rendered as **"999,0"** via `formatDecimal(stockCoverageDays, 1)` (`FbsCalculatedMetricsSection.tsx:71-73`). The null-guard (`== null ? '—'`) misses it because 999 is a number. So the user sees "999,0 дней покрытия" — reads as a real ~3-year coverage, not "never sells / indeterminate". Same defect class as BD-4 (liquidity `turnover_days` 999 sentinel). Fix: treat `stockCoverageDays >= 999` (or `== null`) as «∞» / «—» / «Нет данных».

## 5. Findings
- **D1 (matrix, BE-500 on `/fbs/enhanced`) — RESOLVED.** Endpoint now 200; page fully renders. No BE bug to file.
- **BD-43 (new, low/medium — labeling).** "Дней покрытия остатков 999,0" renders the backend's 999 "never sells" sentinel as a literal number. File:line `src/app/(dashboard)/analytics/fbs-enhanced/components/FbsCalculatedMetricsSection.tsx:69-73`. Fix: coalesce `stockCoverageDays == null || stockCoverageDays >= 999 → '—'` (or "∞"). Same class as BD-4 (sentinel-rendered-as-real).
- **BD-9 (as-cast concern, from prior audit)** — `fbs-enhanced.ts` passes `calculatedMetrics`/`orderStats` through with `as unknown as` boundary cast. On current data the inner fields are AP#8-faithful (null→«—», 0→0), so no active numeric defect — the cast remains a latent boundary-bypass hazard (BD-9 stands as documented, not re-verified as active).
- **No BE-owned fbs-enhanced bugs** (the 500 is fixed).

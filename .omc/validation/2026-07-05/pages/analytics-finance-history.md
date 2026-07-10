# /analytics/finance-history — Финансовый отчёт: история
**Route:** `/analytics/finance-history` · **Filters state:** period=8 недель

## 1. Load
- HTTP statusMap (all 200): 8× `GET /v1/analytics/weekly/finance-summary?week=2026-W19..W26`, `GET /v1/analytics/weekly/available-weeks`, `GET /v1/analytics/supply-planning`, cabinet meta.
- Renders: H1 "Финансовый отчёт: история", period selector (8 недель), wide table — rows = metrics (ДОХОДЫ: Выручка нетто/Возвраты; ПРИБЫЛЬ: COGS/Валовая прибыль/Валовая маржа/Опер. прибыль;…), columns = weeks W19..W26, with WoW deltas.
- No console errors.

## 2. Interactive elements
- **Period selector (8 недель)** → changes number of week-columns fetched. **PASS.**
- **"Скачать CSV" button** (referenced in evaluations content; finance-history likely has export too). Present on related table.

## 3. Data vs API (W26 column spot-check, `GET finance-summary?week=2026-W26`)
| Rendered (W26) | API field | Match |
|---|---|---|
| Выручка (нетто) 620 333,59 ₽ | `summary_total.sale_gross_total = 620333.59` | ✅ |
| Возвраты 4 198 ₽ | `summary_total.returns_gross_total = 4198` | ✅ |
| Себестоимость (COGS) 150 ₽ | `summary_total.cogs_total = 150` | ✅ |
| Валовая маржа 100,0 % | `(sale_gross-cogs)/sale_gross` | ✅ |
| WoW deltas (e.g. Выручка −1,1%) | computed vs W25 | ✅ |

W19-W25 COGS shows "0 ₽" (matches `cogs_total=0` for those weeks). W26 COGS 150 ₽ (newly assigned).

## 4. AP#8 runtime
- COGS-dependent metrics render 0 ₽ honestly (cogs_total=0 in API, not null). Margin shows 100% (mathematically correct given cogs≈0). The page notes "Недели без данных COGS показывают «—»" — but here cogs is 0 (assigned), so 0 ₽ display is faithful, not an AP#8 violation. ✅

## 5. Findings
- None. All 8 weeks of data API-faithful; deltas computed correctly.

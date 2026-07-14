# /cogs/price-calculator — Калькулятор цены

**Route:** `/cogs/price-calculator` · **Filters state:** FBO/FBS toggle, warehouse, box type, qty, turnover, dimensions, target margin, fixed costs, % costs, tax, SPP.
**Validated:** 2026-07-06 · live BE :3000 + FE :3100 (Playwright).

## 1. Load
- Form renders fully (two-column layout on desktop, sticky results panel). FBO default, warehouse selector («Загрузка складов…» then loads), box-type, turnover slider (20 дней, среднее), dimensions, target margin (Средняя), all cost inputs ✅.
- Console: 404s for sidebar prefetch links (`/acquiring`, `/acquiring/period`, `/analytics/fbs-stock`…) — **not page-specific** (sidebar renders those as Next prefetch 404s app-wide). No price-calculator-blocking error.

## 2. Interactive elements
| Element | Action | Effect | Verdict |
|---|---|---|---|
| «Тип исполнения» FBO/FBS toggle | click | switches fulfillment_type (FBS zeroes storage_rub in request) | ✅ (design) |
| Себестоимость (COGS) input | enter `846` | accepted | ✅ |
| Маржа slider/input | set `25` | accepted | ✅ |
| «Рассчитать цену» button | click | `POST /v1/products/price-calculator` fired; results panel renders (РЕКОМЕНДУЕМАЯ ЦЕНА, МИНИМАЛЬНАЯ ЦЕНА, МАРЖА, Структура цены chart) | ✅ flow |
| «Сохранить пресет» / «Сбросить» | render | present | ✅ (rendered) |
| Category select (commissions) | — | «Выберите категорию для точной комиссии. Без категории используется 15%» — defaults 15% | ✅ |

## 3. Data vs API — ⚠️ headline divergence (by design, but under-flagged)
FE request body captured live:
```json
{"target_margin_pct":25,"cogs_rub":846,"logistics_forward_rub":0,"logistics_reverse_rub":0,
 "buyback_pct":98,"advertising_pct":5,"storage_rub":0,"vat_pct":0,"acquiring_pct":1.8,
 "box_type":"box","turnover_days":20}
```
Direct curl of that exact body returns:
```json
{"result":{"recommended_price":1453.61,"actual_margin_rub":363.4,"actual_margin_pct":25},
 "percentage_breakdown":{"commission_wb":145.36,"acquiring":26.16,"advertising":72.68,"margin":363.4}}
```

| Rendered | Source | Verdict |
|---|---|---|
| «РЕКОМЕНДУЕМАЯ ЦЕНА **2 004,74 ₽**» | FE-local `calculateTwoLevelPricing` (`src/lib/two-level-pricing.ts:74`) — **NOT** API `result.recommended_price` (1453.61) | ⚠️ **diverges** |
| «МИНИМАЛЬНАЯ ЦЕНА (пол) **1 095,85 ₽**» | FE-local `calculateTwoLevelPricing:70` | ⚠️ FE-only (no API counterpart) |
| «МАРЖА 25,0 % — Отлично / 501,18 ₽» | FE-local | ⚠️ differs from API `actual_margin_rub=363.4` |
| «Комиссия WB 15,0%: **145,36 ₽**» | matches API `percentage_breakdown.commission_wb=145.36` | ✅ |
| «Эквайринг 1,8%: **26,16 ₽**» | matches API `acquiring=26.16` | ✅ |
| «Реклама (ДРР 10,0%): **72,68 ₽**» | matches API `advertising=72.68` — **but rendered as "10,0 %" while the request sent `advertising_pct: 5`** | ⚠️ BD-15 |
| «Налог с выручки (6,0 %) 120,28 ₽» | FE-local (request `vat_pct:0`, so this is the income-tax branch) | ⚠️ FE-only |

## 4. AP#8 runtime
- N/A — all values are user-entered or computed from them; no nullable upstream money/ratio on this page.

## 5. Findings
- **BD-15 (FE, 🟠) — recommended price diverges from backend; label collision.** The headline «РЕКОМЕНДУЕМАЯ ЦЕНА 2 004,74 ₽» is computed by the FE's local two-level pricer (`src/lib/two-level-pricing.ts`, Story 44.20-FE) and **does not equal** the backend `result.recommended_price` (1453.61) for the same inputs. The component (`src/components/custom/price-calculator/PriceCalculatorResults.tsx:61`) calls `calculateTwoLevelPricing(formData, commissionPct)` and ignores `data.result.recommended_price` entirely for the headline. Two concrete drivers of the divergence:
  1. **Dual DRR fields:** `toApiRequest` sends `advertising_pct: data.advertising_pct` (=5), but `toTwoLevelFormData` feeds `drr_pct: data.drr_pct` (=10) into the local calc. So the local calc applies 10% DRR while the API applies 5% — different recommended prices. (`src/components/custom/price-calculator/priceCalculatorUtils.ts:53 vs :99`.)
  2. **Different formula class:** the local calc folds DRR + margin into the percentage-rate denominator (`price = fixedCosts/(1−Σrate)`), the backend uses its own model; even with matching DRR they generally won't agree.
  - **Impact:** a user comparing the FE headline to a backend-derived value (or to a competitor's quote) sees two different "recommended prices" under the same label — a C1/C2-class meaning contradiction. Either (a) reconcile the FE local pricer with the backend formula + unify `advertising_pct`/`drr_pct` into one field, or (b) label the FE headline distinctly (e.g. «Рекомендуемая цена (2-уровневая)») and surface the backend `recommended_price` as a secondary tile.
- **Secondary (info):** the "Структура цены" segments that DO match the API (commission/acquiring/advertising) prove the request plumbing is correct; the divergence is purely the local headline computation.

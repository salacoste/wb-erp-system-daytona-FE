# /analytics/brand-share — Доля бренда в категории (PR4b, NEW)

**Route:** `/analytics/brand-share` · **Filters state:** brand=null → Space Chemical → Trekka; category cascaded; date range empty (BE default 7d)
**Validated:** 2026-07-06 · live BE `:3000` + rendered via Playwright `:3100`

## 1. Load
- `GET /v1/analytics/brand-share/brands` → **200** (`["DURABOND","Omen taro","Protape","Space Chemical","Trekka","О,ДЕНЬ"]` — 6 brands).
- Page renders: H1 «Доля бренда в категории», 3-filter bar (Бренд / Категория / Период), chart card.
- No console errors. Skeleton states present (`brand-share-brands-skeleton`, `brand-share-report-skeleton`).

## 2. Interactive elements — cascading flow ✅
| Action | Effect | Verdict |
|---|---|---|
| Brand Select disabled while brands loading | `disabled={brandsQuery.isLoading}` | ✅ |
| Category Select disabled until brand chosen | hint «Сначала выберите бренд» shown when `!brand`; `disabled={!brand \|\| subjectsQuery.isLoading}` | ✅ |
| Open Brand dropdown | lists all 6 live brands + «— не выбран —» | ✅ |
| Pick "Space Chemical" | category Select enables; «Сначала выберите бренд» hint disappears; `parent-subjects?brand=Space+Chemical` fetched (200, 8 categories) | ✅ |
| Open Category dropdown | populated ONLY after brand set — cascading enablement correct (8 categories: Автоаксессуары…, Автозапчасти, Автохимия и автокосметика, …) | ✅ |
| Pick "Автохимия и автокосметика" (parentId=8896) | `brand-share?brand=Space+Chemical&parentId=8896` fetched (200, empty report) → chart empty-state «Нет данных о доле бренда за выбранный период» | ✅ |
| **Change brand → Trekka** | **parentId resets to null** («— не выбрана —»); `parent-subjects?brand=Trekka` re-fetched (200). `handleBrandChange` calls `onParentIdChange(null)` — confirmed in code (`BrandShareView.tsx:63-64`) AND in rendered DOM | ✅ |
| Date-from / Date-to native inputs | wire to `dateRange` state; «Без выбора — последние 7 дней» hint | ✅ |

Cascading spec from the task brief: **brand Select → cascading category Select (populated only after brand chosen) → recharts dual-axis chart** — fully implemented and verified live.

## 3. Data vs API
- Brands list: rendered 6 options == API `string[6]` ✅.
- Parent-subjects (Space Chemical): 8 rendered categories == API `[{parentId,parentName}] × 8` ✅.
- Report: API returns `{report: []}` for ALL brand×category×date combinations tested (6 brands, 90-day window) → chart correctly renders empty-state. **No numeric reconciliation possible (no report data exists).**

## 4. AP#8 runtime ✅ (verified at code + contract level)
- `toNullableShareMetric` (`src/lib/api/brand-share.ts:59-62`): maps a `0` share → `null` per contract §2 (0 = no-data sentinel on low-volume days). `brandRating` uses `toNullableMetric` (0 is real rating).
- Chart `connectNulls={false}` on pricePercent/qtyPercent Lines → null renders as a **line gap**, never «0 %» (`BrandShareChart.tsx:173,184`).
- Tooltip `formatMetricValue`: `value == null || !Number.isFinite(value)` → «—» (`BrandShareChart.tsx:47`).
- **Cannot confirm at runtime with real data** (report universally empty — see BE-D-1), but the normalizer + chart paths are contract-faithful and unit-covered.

## 5. Findings
- **BE-D-1** 🟠 BE — report universally empty (see `BE-BUGS-D.md`). Brands + parent-subjects populate; the time-series `report` is `[]` for every brand/category/90-day-window combo. Page renders correct empty-state but the feature is non-operational on live data.
- **AP#8 / cascading / 503 → friendly RU error** — all implemented correctly per source; the 503 path (`errorMessageFor` → «Сервис Wildberries временно недоступен…») couldn't be triggered live (BE returned 200 with empty data, not 503).
- No FE defects. The PR4b normalizer fix (`toNullableShareMetric`, the contract §2 rule) is correctly in place.

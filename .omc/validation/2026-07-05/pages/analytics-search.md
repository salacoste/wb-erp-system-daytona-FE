# /analytics/search — Поисковая аналитика (Epic 71-FE)

**Route:** `/analytics/search` · **Filters state:** default 30-day range; 4 tabs (orders/by-product/by-query/position-trends)
**Validated:** 2026-07-06 · live BE `:3000` + rendered Playwright `:3100`

## 1. Load
- Page renders: H1 «Поисковая аналитика», date-range picker, comparison-period selector, `SearchSellerBadge` (shows «Space Chemical»).
- **`RequireJam requiredTier="standard"` gate blocks the 4-tab content** for this cabinet (no WB Jam subscription) → renders paywall «Доступно с подпиской WB Джем / Джем Стандарт / Подробнее о WB Джем» (`SearchPageContent.tsx:117`). The `TabsList` does NOT mount (`tabs:[]`, `gated:true` from live eval).
- No console errors. **The gating is intentional, not a defect** — but it prevented rendered-table validation; data correctness validated at API level instead (§3).

## 2. Interactive elements
- DateRangePickerExtended, ComparisonPeriodSelector mount and are interactive (above the Jam gate). ✅
- Tabs (Заказы / По товарам / По запросам / Позиции): **cannot exercise — gated by RequireJam.** Code paths (`SearchOrdersTab`, `SearchByProductTab`, `SearchByQueryTab`, `SearchPositionTrendsTab`) verified at source; `defaultTab = initialQuery ? 'by-query' : 'orders'` (119.2-FE F-1 cross-page link handling). ✅ code-correct.
- `?query=` URL param → defaults to by-query tab + pre-populates input (Story 119.2-FE Pass-1 F-1). Verified at source; not testable through the gate.

## 3. Data vs API (API-level, gate blocked render)
| Endpoint | Params | Status | Result |
|---|---|---|---|
| `/v1/analytics/search/orders` | from/to (30d) | **200** | `summary{totalSearchOrders:0,…}, items:[]` — empty |
| `/v1/analytics/search/by-product` | nmId=147205694, from/to | **200** | `{queries:[],totalQueries:0}` — empty for this SKU |
| `/v1/analytics/search/by-query` | query=клей, from/to | **200** | `{products:[],totalProducts:0}` — empty |
| `/v1/analytics/search/position/trends` | (no params required) | **200** | (params: direction/limit/min_queries) |
| `/v1/analytics/search/position-movers` | (params: period) | **200** |  |
| `/v1/analytics/search/page-one-opportunities` | — | **200** | `{opportunities:[]}` — empty |

**Parameter contract findings (BE validation strict):**
- `by-product` requires `nmId` (integer) + `from` + `to`; rejects `week` («property week should not exist»). FE sends correct params (`search-analytics.ts:36-41`). ✅
- `by-query` requires `query` (≥1 char) + `from` + `to`. FE sends correctly (`search-analytics.ts:56-60`). ✅
- `position/trends` REJECTS `from`/`to` («property from should not exist») — uses only `direction`/`limit`/`min_queries`. FE sends correct params (`search-position-trends.ts:46-53`). ✅
- `position/movers` uses only `period`. FE correct (`search-position-trends.ts:62-65`). ✅

## 4. AP#8 runtime
- Cannot verify rendered (Jam gate). The normalizers (`search-analytics-normalizer.ts`, `search-position-trends-normalizer.ts`) are in place; `summary` fields (`searchOrderShareInflated: false`, etc.) are boolean flags, not money/ratio. No fabrication risk identified at the data layer.

## 5. Findings
- **BD-D-1** 🟡 FE (process) — the entire search feature is gated by `RequireJam`; on a non-Jam cabinet the 4 tabs render NOTHING (paywall only). Cannot validate rendered numbers. **Recommend re-running this validation on a Jam-enabled cabinet.** Not a code bug, but a validation-coverage gap.
- **Data condition:** all search endpoints return empty for this cabinet (no search-attribution data ingested). Consistent with the dashboard's empty advertising-search funnel.
- No code-level FE defects in the param-construction paths.

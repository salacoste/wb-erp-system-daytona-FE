# /analytics/cross-reference — Кросс-анализ (Story 73.7-FE)

**Route:** `/analytics/cross-reference` · **Filters state:** default 14-day range (23.06.2026 — 06.07.2026)
**Validated:** 2026-07-06 · live BE `:3000` + rendered Playwright `:3100`

## 1. Load
- Page renders: H1 «Кросс-анализ», subtitle «Сравнение органики и рекламы по товарам», date-range picker, comparison toggle.
- **`RequireJam` gate blocks the cross-reference content** for this cabinet → paywall «Доступно с подпиской WB Джем» (same as `/search`). The CrossReferenceTable / OverlapSummaryCards / OrganicVsAdScatter / CannibalizationAnalysis / InsightsCards do NOT mount.
- No console errors. **Gating intentional** — but blocks rendered validation; data correctness validated at API level (§3).

## 2. Interactive elements
- DateRangePickerExtended + ExportCsvButton mounts above the gate. ✅
- Cross-reference content (tables, scatter, overlap cards, cannibalization, top-wasted-spend): **cannot exercise — gated.** Code paths verified at source:
  - `useSearchOrders(apiFrom, apiTo, {groupBy:'product'})` + `useSearchOrders(…,{groupBy:'query'})` → 2 query streams.
  - `useAdvertisingAnalytics({from,to,view_by:'imtId'})` → ad stream.
  - `mergedData` = product-keyed merge of search + ad; `overlapSummary = computeOverlapSummary(mergedData)`; `topWastedSpend = getTopWastedSpend(mergedData)`. ✅ code-correct.

## 3. Data vs API (API-level, gate blocked render)
| Endpoint | Params | Status | Result |
|---|---|---|---|
| `/v1/analytics/search/orders` | from/to, groupBy=product | **200** | `{items:[],summary:{totalSearchOrders:0,…}}` — empty |
| `/v1/analytics/advertising` | from/to, group_by=imtId | **200** | **rich data** — e.g. MK-400-White (nmId 994700366): views 11154, clicks 678, orders 53, spend 6301, revenue 23802, organicSales 6463, organicContribution 21.35, roas 3.78, roi 277.75 |

**The merge would show ad-only rows** (search side empty → no overlap, all ad products have 0 organic attribution → 100% ad / 0% organic). The cross-reference "overlap" + "cannibalization" analysis is structurally limited by the empty search-orders data.

## 4. AP#8 runtime
- Cannot verify rendered. The ad normalizer (`advertising-analytics` normalizers) preserves nullable money fields; `organicContribution`, `roas`, `roi` are ratio fields — render path uses the advertising analytics normalizer chain (already validated in P0 advertising audit). No new AP#8 risk identified.

## 5. Findings
- **BD-D-1** 🟡 FE (process) — same Jam gate as `/search`; cannot validate rendered cross-reference tables/charts on this cabinet. **Recommend re-running on a Jam-enabled cabinet.**
- **Data condition:** search-orders empty → cross-reference reduces to ad-only view. The ad side has rich, correct data (reconciled in P0 advertising audit).
- No code-level FE defects in the merge/overlap/cannibalization logic (source review).

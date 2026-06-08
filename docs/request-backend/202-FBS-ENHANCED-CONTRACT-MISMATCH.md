# 202 — FBS Enhanced analytics: FE↔backend contract mismatch (4 of 5 sections)

**Status**: ✅ **DELIVERED** — Same fix as #182. FE-compat field aliases added in `FbsEnhancedAnalyticsController` (`src/analytics/controllers/fbs-enhanced-analytics.controller.ts:230-298`). All FE-expected keys now present alongside backend-native keys. See #182 for full field mapping. FE normalizer rewrite still needed to consume the real+aliased shape.
**Severity**: HIGH (page renders fabricated zeros/dashes against live data for 4 of 5 sections)
**Found**: iter-137 read-only audit of `/analytics/fbs-enhanced`, verified against backend source (not just docs).
**Endpoint**: `GET /v1/analytics/fbs/enhanced?from=&to=`

## Problem

The frontend `fbs-enhanced` domain (types + normalizer + 5 section components) was built against a **fictional contract** — `request-backend/169 §1.2` used `{ ... }` placeholders for the inner fields, so the FE author invented camelCase field names the backend never sends. Result: every section **except `calculatedMetrics`** silently renders `0` (counts) or `—` (money/ratio) because the normalizer reads keys that don't exist in the response — even when the backend returns real data.

## Root Cause (authoritative — verified against backend code, NOT docs)

The **actual** response is built in `src/analytics/controllers/fbs-analytics.controller.ts:699-731` (the response-building code — this supersedes both the stale `@ApiResponse` Swagger decorator at :606-635 AND the test-mock fixtures, which disagree with each other and with this code).

Field-by-field (FE reads → backend actually sends):

| Section | FE normalizer reads (`fbs-enhanced-normalizer.ts`) | Backend actually returns (controller:699-731) |
|---|---|---|
| orderStats | `totalOrders`, `deliveredOrders`, `returnedOrders`, `returnRate`, `buyoutRate`✅, `averageOrderValue` | `ordersCount`, `ordersSumRub`, `cancelCount`, `cancelRate`, `buyoutCount`, `buyoutRate`✅, `avgOrderValue`, `addToCartPercent`, `ordersPercent` |
| stockAnalytics | `totalSkus`, `totalUnits`, `lowStockSkus`, `outOfStockSkus`, `avgDaysOfCover` | `totalStock`, `availableStock`, `reservedStock`, `inTransit`, `productCount` |
| regionalData | `regionName`, `orderShare`, `stockShare` | `region`, `quantity`, `percentage` |
| calculatedMetrics | `turnoverRate`, `stockCoverageDays`, `ordersPerProduct` | **MATCHES** ✅ (the only working section) |
| funnelData | `productViews`, `cartAdds`, `orders`, `deliveries` | backend exposes funnel as `orderStats.addToCartPercent`/`ordersPercent` (+ a separate `funnelData` if present) |

Only `buyoutRate` (orderStats) and the entire `calculatedMetrics` object line up.

## Impact

- Order Stats → "Всего заказов: 0", "Доставлено: 0", "Средний чек: —" despite real `ordersCount`/`avgOrderValue`.
- Stock Analytics → all cards `0`/`—` despite real `totalStock`/`productCount`.
- Regional Data → empty bars, `—` tooltips (real keys `region`/`quantity`/`percentage`).
- Funnel → fully collapsed (all stages 0).
- **The unit test suite is GREEN but false-assuring**: every fixture (`fbs-enhanced-empty.ts`, normalizer-test fixtures, all 5 component tests) mirrors the fictional shape, so the tests actively mask the defect.

## Reconciliation needed (NOT a mechanical rename)

Some FE-displayed metrics have **no backend source** — this requires a product/contract decision, not just a key remap:
- `lowStockSkus`, `outOfStockSkus`, `avgDaysOfCover` (Stock Analytics) — backend sends none of these.
- `deliveredOrders`, `returnedOrders`, `returnRate` (Order Stats) — backend sends `buyoutCount`/`cancelCount`/`cancelRate` (different concepts).

**Questions for backend/product:**
1. Confirm the real response shape (controller:699-731) is current — the Swagger decorator (:606-635) is stale and should be corrected regardless.
2. For the FE-only metrics above: should the backend ADD them, or should the FE DROP those cards / re-derive from available fields (e.g. show cancelRate instead of returnRate)?

## Fix scope (FE-led, after reconciliation)

Rewrite `src/types/fbs-enhanced.ts` + `src/lib/api/fbs-enhanced-normalizer.ts` to the real keys (count-vs-nullable-money classification per real semantics), update the 5 section components for dropped/renamed fields, and **rewrite all fixtures + tests against the real shape** (the current green suite is false assurance). Per the audit this needs architect/planner review for cross-module risk; do NOT ship a blind remap.

## Note

This is the same defect CLASS as `request-backend/181` (fbs-stock contract mismatch) — both domains were built against placeholder contracts. The FE degrades *safely* (zeros/dashes, no crash, no `?? 0` money fabrication), which is why it surfaced as "empty page" rather than a runtime error.

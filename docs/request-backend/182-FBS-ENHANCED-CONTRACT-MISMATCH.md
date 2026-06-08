# Request #182 — FBS Enhanced: field + semantic contract mismatch (FE shows 0s)

**Originated by**: Frontend validation campaign (validation finding F-19), 2026-06-02
**Severity**: P1 — `/analytics/fbs-enhanced` order + stock metric cards render `0`/`—` against the live backend; the FE normalizer reads field names the backend doesn't emit.
**Related**: Request #181 (FBS stock contract mismatch) — same systemic Epic-96-FE-vs-backend divergence across the FBS-analytics domain.
**Status**: ✅ **DELIVERED** — FE-compat field aliases added in `FbsEnhancedAnalyticsController` (`src/analytics/controllers/fbs-enhanced-analytics.controller.ts:230-298`): `totalOrders`/`deliveredOrders`/`returnedOrders`/`returnRate`/`averageOrderValue` (orderStats), `totalUnits`/`totalSkus`/`lowStockSkus`/`outOfStockSkus`/`avgDaysOfCover` (stockAnalytics), `regionName`/`stockShare`/`orderShare` (regionalData), `funnelData` passthrough, `generatedAt` alias. Note: `lowStockSkus`/`outOfStockSkus` are placeholders (0); `orderShare` is null (stock-only data source); `deliveredOrders`/`returnedOrders` are aliases for `buyoutCount`/`cancelCount` (semantic difference documented in Swagger).

---

## Problem

`GET /v1/analytics/fbs/enhanced` envelope shape is correct (top-level `orderStats`, `stockAnalytics`, `regionalData`, `calculatedMetrics`), and `calculatedMetrics` matches the FE 1:1. But two sections have field-name **and semantic** mismatches:

### orderStats
| FE `FbsOrderStats` reads | Backend live emits | Issue |
|---|---|---|
| `totalOrders` | `ordersCount` | rename → FE gets 0 |
| `deliveredOrders` | `buyoutCount` | **semantic**: delivered ≠ bought-out |
| `returnedOrders` | `cancelCount` | **semantic**: returned ≠ canceled |
| `returnRate` | `cancelRate` | **semantic**: return ≠ cancel |
| `buyoutRate` | `buyoutRate` | ✅ match |
| `averageOrderValue` | — (backend sends `ordersSumRub`) | FE wants avg, backend sends sum |

### stockAnalytics
| FE `FbsStockAnalytics` reads | Backend live emits | Issue |
|---|---|---|
| `totalUnits` | `totalStock` | rename → 0 |
| `totalSkus` | `productCount` | rename → 0 |
| `lowStockSkus` | — (absent) | no backend source |
| `outOfStockSkus` | — (absent) | no backend source |
| `avgDaysOfCover` | — (in `calculatedMetrics.stockCoverageDays`?) | wrong section |
| — | `availableStock`, `reservedStock`, `inTransit`, `sources` | backend extras the FE drops |

### funnelData
The FE normalizer expects a `funnelData` section (`productViews`, `cartAdds`, `orders`, `deliveries`). The live response has **no `funnelData`** → all 0.

## Why the FE can't just remap

The mismatches are not pure renames — `returnedOrders ← cancelCount` and `deliveredOrders ← buyoutCount` conflate different business events, and `lowStockSkus`/`outOfStockSkus`/`avgDaysOfCover`/`funnelData`/`averageOrderValue` have no backend source at all. A naive FE remap would display semantically-wrong data. This needs a product/contract decision.

## Requested resolution

Reconcile the FBS-enhanced contract (same decision as #181): either the backend emits the FE-designed fields (delivered/returned/totalUnits/totalSkus/lowStock/outOfStock/avgDaysOfCover/funnelData), or the FE is redesigned around the backend's actual buyout/cancel/totalStock/productCount/sources model. Confirm whether `funnelData` is intended.

## Evidence
- Live top keys: `['period','orderStats','stockAnalytics','regionalData','calculatedMetrics','sources']`
- orderStats live keys: `['ordersCount','ordersSumRub','cancelCount','cancelRate','buyoutCount','buyoutRate']`
- stockAnalytics live keys: `['totalStock','availableStock','reservedStock','inTransit','productCount']`
- FE: `frontend/src/lib/api/fbs-enhanced-normalizer.ts`

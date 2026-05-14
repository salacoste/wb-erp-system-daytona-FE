# 152: Funnel Sync — SDK Method Name Mismatch

## Problem

`funnel_sync` task completes with `synced=0, errors=0` because the WB API batch call fails:

```
ERROR [ProductFunnelSyncService] Batch 1 failed: sdk.analytics.getProductsProduct is not a function
```

The sync finds 49 products and attempts to call the WB Analytics API, but the SDK method doesn't exist under the name used.

## Root Cause

In `src/shared/wb-api/wb-analytics.service.ts`, the `WbAnalyticsModule` interface declares:

```typescript
interface WbAnalyticsModule {
  getProductsProduct(params: {...}): Promise<unknown>;
}
```

But the actual SDK (`daytona-wildberries-typescript-sdk` v3.1.0) publishes this method as:

```typescript
createProductsProduct(period, options): Promise<...>
```

**All 3 analytics stock methods have the same prefix mismatch:**

| Backend Calls | SDK Actual Method |
|---------------|-------------------|
| `getProductsGroup()` | `createProductsGroup()` |
| `getProductsProduct()` | `createProductsProduct()` |
| `getProductsSize()` | `createProductsSize()` |

The `@ts-expect-error` cast on line 38 suppresses TypeScript errors, so this only fails at runtime.

## Impact

---

## Backend Team Response

**Status**: RESOLVED
**Resolution date**: 2026-02-19
**Summary**: Fixed SDK method name mismatch in analytics service. All 3 methods renamed: `getProductsGroup` -> `createProductsGroup`, `getProductsProduct` -> `createProductsProduct`, `getProductsSize` -> `createProductsSize`. The `@ts-expect-error` cast that was suppressing TypeScript errors has been addressed.
**Remaining frontend action**: None - funnel sync now processes products correctly.
- `/analytics/funnel` page shows all zeros — no funnel data ever synced
- `product_funnel_daily` table remains empty (0 rows)
- Funnel sync status shows `lastSyncAt: null`

## Fix Scope

**File**: `src/shared/wb-api/wb-analytics.service.ts`

1. Rename interface methods: `getProductsProduct` → `createProductsProduct` (and Group/Size)
2. OR add wrapper methods that call the correct SDK names

**File**: `src/analytics/services/product-funnel-sync.service.ts`

Verify the call signature matches — SDK expects `(period, options)` not `(cabinetId, period, options)`.

## Verification

After fix:
1. `npx nest build && pm2 restart wb-repricer wb-repricer-worker`
2. Enqueue: `POST /v1/tasks/enqueue { "task_type": "funnel_sync", "payload": {} }`
3. Worker logs should show: `synced=49, errors=0`
4. API: `GET /v1/analytics/funnel?from=2025-01-01&to=2026-02-19&groupBy=product` should return items
5. Funnel sync status: `lastSyncAt` should be non-null

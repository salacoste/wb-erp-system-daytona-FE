# Request #186 — `/v1/products/cogs/bulk?format=v2` ignores format, returns legacy shape

**Originated by**: Frontend validation campaign (finding F-34, double-unwrap audit), 2026-06-02
**Severity**: P2 — the FE bulk-COGS page (`/cogs/bulk`) is coded against the v2 contract; the endpoint returns the legacy shape, which (combined with an FE double-read bug, fixed separately) crashed the upload. FE is being hardened to consume the legacy shape, but `marginRecalculation` (a v2-only field driving the post-upload margin-recalc polling UX) is unavailable until the endpoint honors v2.
**Status**: PENDING BACKEND

---

## Problem

The FE calls `POST /v1/products/cogs/bulk?format=v2` (the only bulk endpoint the FE uses — `frontend/src/hooks/useBulkCogsAssignment.ts:43`). The `format=v2` query param is documented (`src/cogs/cogs.controller.ts:79-86`) to return:

```
{ data: { succeeded, failed, results[], message, marginRecalculation? } }
```

But the **products** controller endpoint (`src/products/products.controller.ts:466` → `productsService.bulkAssignCogs`) **ignores `format=v2`** and returns the LEGACY shape (LIVE-VERIFIED 2026-06-02):

```
{ totalItems, createdItems, skippedItems, errors: [{ nm_id, error }] }
```

Live POST to `/v1/products/cogs/bulk?format=v2` (test cabinet, real nm_id) returned `{totalItems, createdItems, skippedItems, errors}` with no `data` envelope and no `succeeded`/`results`/`marginRecalculation`.

## Impact

- The FE expected `succeeded`/`failed`/`results`/`marginRecalculation`. None exist in the legacy response.
- The post-upload **margin-recalculation polling UX** (`useBulkCogsAssignmentWithPolling`) depends on `marginRecalculation.{status,weeks,taskId}`, which the legacy shape cannot provide → the FE can only show created/skipped counts, not the margin-recalc progress.

## Requested fix

Make `POST /v1/products/cogs/bulk?format=v2` honor the `format=v2` param and return the standardized v2 envelope `{ data: { succeeded, failed, results[], message, marginRecalculation? } }` — matching the documented Epic 18 Request #09 contract already implemented on the cogs controller. (Or confirm the FE should migrate to a different endpoint that returns v2.)

## FE side (done independently)

The FE had a second bug: it read `response.data.succeeded` after `apiClient` already unwraps the `{ data }` envelope (double-unwrap, F-30 class) → `TypeError` on every upload. The FE is being hardened with a boundary normalizer that accepts BOTH the legacy shape (current backend reality) and the v2 shape (once this ticket lands), so bulk COGS works either way. `marginRecalculation` stays unavailable until v2 is honored.

## Evidence
- FE: `frontend/src/hooks/useBulkCogsAssignment.ts:42-48` (calls `?format=v2`, reads `response.data.succeeded`).
- Backend: `src/products/products.controller.ts:466`, `src/cogs/cogs.controller.ts:79-86` (v2 doc).
- Live: POST `/v1/products/cogs/bulk?format=v2` → `{totalItems, createdItems, skippedItems, errors}`.
- No global `{data}`-wrapping interceptor (main.ts:123 = Log/Metrics/ClassSerializer only).

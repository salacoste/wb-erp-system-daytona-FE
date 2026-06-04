# Request #186 — `/v1/products/cogs/bulk?format=v2` ignores format, returns legacy shape

**Originated by**: Frontend validation campaign (finding F-34, double-unwrap audit), 2026-06-02
**Severity**: P2 — the FE bulk-COGS page (`/cogs/bulk`) is coded against the v2 contract; the endpoint returns the legacy shape, which (combined with an FE double-read bug, fixed separately) crashed the upload. FE is being hardened to consume the legacy shape, but `marginRecalculation` (a v2-only field driving the post-upload margin-recalc polling UX) is unavailable until the endpoint honors v2.
**Status**: RESOLVED (backend, 2026-06-04) — `?format=v2` now honored; `marginRecalculation` included. See "Backend resolution" below.

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

---

## Backend resolution (2026-06-04)

`POST /v1/products/cogs/bulk` now honors `?format=v2`, returning the same standardized envelope
shape as `POST /v1/cogs/bulk?format=v2`:

```
{ data: { succeeded, failed, results[], message, marginRecalculation? } }
```

Without `format` (or any non-`v2` value) the legacy shape `{ totalItems, createdItems, skippedItems, errors }`
is returned unchanged (backward compatible).

### Result shape: products vs cogs `BulkUploadResult`

`ProductsService.bulkAssignCogs` previously returned `{ totalItems, createdItems, skippedItems, errors }`
— NOT structurally compatible with the cogs `BulkUploadResult` consumed by `transformToV2Format`:
it lacked `detailedResults` (the source of the v2 `results[]`) and `marginRecalculation`. Its `errors[]`
items also use `{ index, nmId, code, message }` whereas v2 `results[]` failures use
`{ nm_id, success:false, error_code, error_message }`.

**Decision: reuse `cogsService.transformToV2Format`, not a new adapter.** `bulkAssignCogs` was upgraded
to return a full `BulkUploadResult` (return type now `Promise<BulkUploadResult>`):
- `detailedResults` = successes from the inner `cogsService.bulkUpload(...)` result + one failure entry per
  merged error (WB-API validation errors + COGS-creation errors), mapped via a small module-level
  `mapErrorToItemResult()` helper (`nmId→nm_id`, `code→error_code`, `message→error_message`) so field
  names match the cogs v2 output and the FE's single normalizer handles both endpoints.
- The legacy fields (`totalItems`, `createdItems`, `skippedItems`, `errors`) are unchanged, so the
  non-v2 path is byte-compatible with the old response.

**One robustness fix to the shared transform.** The products result folds errors into `skippedItems`
(`skippedItems = bulkResult.skippedItems + errors.length`) while ALSO returning them in `errors[]`, but
the cogs result keeps `skippedItems = 0` and puts failures only in `errors[]`. The old
`failed = skippedItems + errors.length` formula double-counted under the products convention. Fixed
`transformToV2Format` to derive `failed` from `detailedResults` (count of `success === false`) when present,
falling back to the legacy formula only when `detailedResults` is empty — correct for BOTH callers (cogs
`failed` is unchanged: `totalItems - createdItems == errors.length`). The transform now also passes
`marginRecalculation` through when present.

### marginRecalculation: INCLUDED (not a follow-up)

`bulkAssignCogs` already aggregates affected weeks and enqueues a SINGLE batch
`recalculate_weekly_margin` job (Epic 20 Story 20.4). That enqueue outcome is now surfaced as
`marginRecalculation: { triggered, affectedWeeks, taskUuid }` (`taskUuid` = the BullMQ jobId
`margin-batch-<cabinetId>-<ts>`). On enqueue failure (or no affected weeks) it emits
`{ triggered: false, affectedWeeks: [] }`. Note: there is NO `status`/`estimatedTimeSec` — the batch job is
fire-and-forget; the FE polling UX should drive status from its existing margin-status polling using
`affectedWeeks` + `taskUuid`. (If the FE specifically needs `status`/`estimatedTimeSec` in this envelope,
that is a separate follow-up — the current job-enqueue path does not compute them.)

### Files changed (backend only)
- `src/products/products.controller.ts` — injected `CogsService`; added `@Query('format')` + `@ApiQuery`
  and a v2 `oneOf` `@ApiResponse`; `format === 'v2'` → `cogsService.transformToV2Format(result)`,
  else legacy.
- `src/products/products.service.ts` — `bulkAssignCogs` now returns `Promise<BulkUploadResult>` with
  `detailedResults` + `marginRecalculation`; added module-level `mapErrorToItemResult()`.
- `src/cogs/services/cogs.service.ts` — `transformToV2Format` derives `failed` from `detailedResults` and
  passes through `marginRecalculation`.
- `src/products/products.controller.spec.ts` — added `CogsService` mock (delegating to the real transform);
  split the bulk test into legacy (no `format`) and v2 (`format='v2'`) cases.

### Verification
- `npm test -- products.controller cogs.service` → 71 passed, 0 failed.
- `npx eslint` on the 4 changed files → 0 errors.
- `npx tsc --noEmit` → 0 errors in the touched files (3 pre-existing errors in an unrelated,
  already-modified `src/analytics/services/acquiring-reports.service.ts` are NOT part of this change).
- `bash scripts/check-endpoint-doc-drift.sh` → exit 0, matches baseline (9 entries) — adding a query
  param + response variant did not change routes.

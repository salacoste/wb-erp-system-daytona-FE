# 222 — Card Write-back: Async Queue (sync → 202 + jobId)

> **BREAKING CONTRACT CHANGE for the FE team** (IE1 HIGH-2).
> The PIM card write-back mass-op endpoints (`/upload`, `/update`, `/move-nm`)
> are now **asynchronous**. They no longer block the HTTP request and no longer
> return the WB result inline. Behind the `CARD_WRITEBACK_ENABLED` kill switch
> (default **OFF**), so this only matters once write-back is armed.

## What changed

| Aspect | Before (phase-1) | After (IE1 HIGH-2) |
|---|---|---|
| `POST /upload`, `/update`, `/move-nm` | Synchronous — blocked up to minutes, returned the WB result | **Async** — enqueues a BullMQ job, returns `202 { jobId, status }` immediately |
| Result delivery | Inline in the POST response | **Poll** `GET /jobs/:jobId` |
| Idempotency | None (double-submit = double WB write) | **jobId dedup** — identical request fingerprint → same `jobId` (BullMQ returns the existing job, no duplicate WB write) |
| HTTP status on POST | `200 OK` | **`202 Accepted`** |
| Gateway-timeout risk | High (mass ops ran inline) | None (enqueue is instant) |

## Endpoints

Base path: `/v1/products/cards` · Auth: `JwtAuthGuard + CabinetGuard` (`X-Cabinet-Id` header).

### POST `/v1/products/cards/upload` · `/update` · `/move-nm`

Request bodies are **unchanged** (`UploadCardsDto` / `UpdateCardsDto` / `MoveNmDto`
with the per-action `confirmationToken`, D44).

**Response — `202 Accepted`** (was `200`):
```json
{
  "jobId": "2c3f...e1a0",   // SHA256 hex — poll with this id
  "status": "queued"
}
```

**Gates (unchanged, checked BEFORE enqueue — fail fast, never queues):**
- `CARD_WRITEBACK_ENABLED=false` → `403 Forbidden` (write-back is OFF).
- Missing `confirmationToken` → `403 Forbidden` (D44).

### GET `/v1/products/cards/jobs/:jobId`  *(new — poll here)*

Returns the BullMQ job state + result/error. Scoped to the caller's cabinet —
a `jobId` encoding a different cabinet returns `403`; an unknown/expired id
returns `404`.

**`200 OK`**
```json
{
  "jobId": "2c3f...e1a0",
  "status": "completed",          // completed | failed | active | delayed | waiting
  "result": {                     // the WbCardApiService result (null until completed)
    "success": true,
    "uploadId": "...",
    "processedCount": 3,
    "errors": []
  },
  "error": null                   // failure reason (string) when status === "failed"
}
```

Failed job example:
```json
{ "jobId": "2c3f...e1a0", "status": "failed", "result": null, "error": "WB rejected payload: invalid subject" }
```

## Idempotency / dedup

`jobId = SHA256(cabinetId | op | fingerprint(items) | confirmationToken)`.

`fingerprint(items)` sorts the items by their stable identifier (vendorCode for
upload, nmID for update, nmId for movenm) and sorts object keys recursively, so
**two structurally identical requests produce the same `jobId`**. BullMQ then
returns the existing job instead of creating a duplicate — a double-click or
retry of the **same** mass-op does NOT produce a second WB write.

A genuinely different payload (different vendorCode / nmID / token) produces a
different `jobId` and runs as a separate job.

> **FE note:** the confirmation token is part of the fingerprint. To dedup a
> re-submit, reuse the SAME token. A fresh token = a new job.

## Error semantics (status endpoint)

| WB error class | Processor behaviour | `status` |
|---|---|---|
| Terminal (400 / 401 / 403, or the service's fail-closed `ServiceUnavailableException` from the match-before-create lookup) | `UnrecoverableError` — fails immediately, **no retry** | `failed` |
| Transient (429 / 5xx / network) | BullMQ retries (5 attempts, exponential backoff); the service's internal retry handles most of these first | `active`/`waiting` → `completed`/`failed` |

The match-before-create idempotency (CRITICAL-1), fail-closed lookup, and the
`CARD_WRITEBACK_ENABLED` + D44 gates are **all preserved** — they live in
`WbCardApiService`, which the worker calls as-is (the write logic is reused,
not duplicated).

## FE integration recipe

1. `POST /upload|update|move-nm` → capture `jobId` from the `202` body.
2. Poll `GET /jobs/:jobId` every ~2-5 s while `status` ∈ {`waiting`,`active`,`delayed`}.
3. On `completed` → read `result` (same shape as the old inline result).
4. On `failed` → read `error` and surface to the user (terminal WB error; re-enqueue with a corrected payload + fresh token).

## Deferred (next fire — HIGH-3)

Per-item partial-failure detail inside the status `result` is **not** enriched
here — `result` is the raw `WbCardApiService` result (`{ success, uploadId,
errors, processedCount }`). A richer per-item rollup (which nmId succeeded vs
failed inside a batch) is deferred to HIGH-3.

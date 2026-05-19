# Request #166 — Add `?modelId=` and `?nmId=` filter params to `GET /v1/ai/evaluations/sku-accuracy`

**Status**: OPEN
**Story**: 110.3-FE (SKU accuracy table)
**Priority**: High — cabinet-isolation discipline requires model-scoped responses

---

## Problem

`GET /v1/ai/evaluations/sku-accuracy` currently returns **all SKUs for the entire cabinet** regardless of which model the user is viewing. The frontend sends `?modelId=<uuid>` and `?nmId=<nmId>` query params (shipped in Story 110.3-FE), but the backend silently ignores them and returns a cabinet-wide response.

This causes two issues:

1. **Incorrect scope**: The SKU accuracy table on `/analytics/models/[id]/evaluations/sku-accuracy` shows SKUs from all models in the cabinet, not just the selected model.
2. **Per-SKU drill-down broken**: The `?nmId=N` filter cannot scope to a single SKU, so the detail view must scan the full cabinet response to find the requested SKU — this is fragile and does not scale.

---

## Ask

Add two optional query parameters to `GET /v1/ai/evaluations/sku-accuracy`:

| Param | Type | Required | Behavior |
|---|---|---|---|
| `modelId` | `string` (UUID) | No (recommended) | Filter response to SKUs evaluated by this model only |
| `nmId` | `number` | No | Further filter to a single SKU (used for per-SKU drill-down) |

**Precedent**: Story 110.2-FE F-1 implemented the same pattern for `GET /v1/ai/evaluations?modelId=<uuid>`. Follow identical filter logic.

---

## Expected behavior

### With `?modelId=<uuid>` only

Return only `skuAccuracies` entries where the underlying evaluations were produced by the specified model. If `modelId` is unknown, return `{ skuAccuracies: [] }` (not 404).

### With `?modelId=<uuid>&nmId=<nmId>`

Return at most one `skuAccuracies` entry matching both the model and the SKU. Used by the per-SKU drill-down view.

### Without params

Maintain current behavior (cabinet-wide response) for backwards compatibility.

---

## Current contract (test-api/99-ai.http:77)

```http
GET {{baseUrl}}/v1/ai/evaluations/sku-accuracy
```

Response already includes `naiveBaseline`, `naiveMape`, `naiveAccuracyPercent`, `evaluationCount` fields per the example in test-api/99-ai.http:77. As of Story 110.3-FE Task 2 + 3rd-pass F-1: `naiveAccuracyPercent` and `evaluationCount` are normalized in `normalizeSkuAccuracyEntry`; `naiveBaseline` (units, per-history-entry, distinct from `naiveMape` which is the percentage error) is normalized in `normalizeSkuAccuracyHistoryEntry` with AP#8 null preservation. UI rendering of `naiveBaseline` is deferred to a later story.

---

## Frontend readiness

The frontend is **already sending** these params:

```typescript
// src/lib/api/ai/evaluations.ts — getSkuAccuracy()
const queryParams = new URLSearchParams()
queryParams.set('modelId', params.modelId)
if (params.nmId != null) queryParams.set('nmId', String(params.nmId))
```

The `queryKey` already includes `[cabinetId, modelId, nmId]` for proper cache isolation. Once the backend ships this filter, the frontend will scope automatically — no frontend changes required.

---

## Cabinet-isolation rationale

Per Story 97.5-FE multi-tenant cabinet-isolation discipline: query keys are scoped by `cabinetId` AND `modelId` AND `nmId`. Without server-side filtering, different models in the same cabinet return identical data, which defeats the purpose of model-level navigation.

---

## Validation criteria

- `GET /v1/ai/evaluations/sku-accuracy?modelId=<uuid>` returns only SKUs for that model
- `GET /v1/ai/evaluations/sku-accuracy?modelId=<uuid>&nmId=12345678` returns at most 1 entry
- `GET /v1/ai/evaluations/sku-accuracy` (no params) still works (backwards compat)
- Unknown `modelId` returns `{ skuAccuracies: [] }` not 404

---

## Example requests

### 1. Cabinet-wide (no params) — current behavior, backwards compat

```bash
curl -X GET "http://localhost:3000/v1/ai/evaluations/sku-accuracy" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "X-Cabinet-Id: <cabinet_id>"
```

Expected response (all SKUs for the cabinet):

```json
{
  "skuAccuracies": [
    {
      "nmId": 12345678,
      "vendorCode": "MY-SKU-001",
      "history": [
        {
          "evaluationDate": "2026-05-01",
          "predictedUnits": 50,
          "actualUnits": 48,
          "mapeUnits": 4.17,
          "naiveMape": 8.33
        }
      ],
      "avgAiMape": 4.17,
      "avgNaiveMape": 8.33,
      "aiAccuracyPercent": 49.9,
      "naiveAccuracyPercent": 81.7,
      "evaluationCount": 1
    }
  ]
}
```

### 2. Model-scoped — filter by modelId

```bash
curl -X GET "http://localhost:3000/v1/ai/evaluations/sku-accuracy?modelId=3caaa9f1-ddfd-4fe6-a8df-43db48653ba6" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "X-Cabinet-Id: <cabinet_id>"
```

Expected response (only SKUs evaluated by the specified model):

```json
{
  "skuAccuracies": [
    {
      "nmId": 12345678,
      "vendorCode": "MY-SKU-001",
      "history": [ /* same shape as above */ ],
      "avgAiMape": 4.17,
      "avgNaiveMape": 8.33,
      "aiAccuracyPercent": 49.9,
      "naiveAccuracyPercent": 81.7,
      "evaluationCount": 1
    }
  ]
}
```

Unknown `modelId` must return `{ "skuAccuracies": [] }` — NOT 404.

### 3. Model + SKU-scoped — single SKU detail

```bash
curl -X GET "http://localhost:3000/v1/ai/evaluations/sku-accuracy?modelId=3caaa9f1-ddfd-4fe6-a8df-43db48653ba6&nmId=12345678" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "X-Cabinet-Id: <cabinet_id>"
```

Expected response (at most one entry matching both model and SKU):

```json
{
  "skuAccuracies": [
    {
      "nmId": 12345678,
      "vendorCode": "MY-SKU-001",
      "history": [
        {
          "evaluationDate": "2026-05-01",
          "predictedUnits": 50,
          "actualUnits": 48,
          "mapeUnits": 4.17,
          "naiveMape": 8.33
        },
        {
          "evaluationDate": "2026-04-01",
          "predictedUnits": 45,
          "actualUnits": 42,
          "mapeUnits": 7.14,
          "naiveMape": 9.52
        }
      ],
      "avgAiMape": 5.66,
      "avgNaiveMape": 8.93,
      "aiAccuracyPercent": 41.2,
      "naiveAccuracyPercent": 79.3,
      "evaluationCount": 2
    }
  ]
}
```

Unknown `nmId` (or nmId not belonging to the model) must return `{ "skuAccuracies": [] }` — NOT 404.

---

## References

- Precedent: Story 110.2-FE F-1 (`GET /v1/ai/evaluations?modelId=`)
- Current endpoint contract: `../test-api/99-ai.http:77`
- Frontend types: `src/types/ai/evaluations.ts` (`SkuAccuracyEntry`, `SkuAccuracyListResponse`)
- Frontend fetcher: `src/lib/api/ai/evaluations.ts` (`getSkuAccuracy`)
- Frontend hook: `src/hooks/useAiSkuAccuracy.ts`

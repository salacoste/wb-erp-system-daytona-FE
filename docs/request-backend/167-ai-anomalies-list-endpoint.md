# Request #167 — Add `GET /v1/ai/anomalies` list endpoint

**Status**: OPEN
**Story**: 112.3-FE (Anomaly resolution admin UI)
**Priority**: High — frontend ships with stub + backend-pending UX until this endpoint lands

---

## Problem

`PATCH /v1/ai/anomalies/{id}/resolve` exists (Story 108.1-FE, documented in `../test-api/99-ai.http:829`), but there is **no `GET /v1/ai/anomalies` list endpoint**. Without a list endpoint, operators cannot see which anomaly IDs need resolution — they must know IDs out-of-band (e.g., from a database query). This prevents the anomaly resolution workflow from functioning without developer intervention.

Story 112.3-FE ships a full resolution UI (`/analytics/ai-admin/anomalies`) with an inline fallback form for manually entering known anomaly IDs. The full table view activates once this endpoint ships — the frontend stub only needs a body replacement (no type or hook changes required).

---

## Ask

Add `GET /v1/ai/anomalies` to the backend with the following contract:

| Param | Type | Required | Behavior |
|---|---|---|---|
| `status` | `'pending' \| 'resolved'` | No | Filter by resolution status. Omit for all anomalies. |
| `page` | `number` | No | Pagination page (1-indexed, default 1) |
| `limit` | `number` | No | Items per page (default 20, max 100) |

**Access control**: Owner and Manager roles only (mirrors `PATCH /v1/ai/anomalies/{id}/resolve` RBAC). Return 403 for Analyst and Service roles.

---

## Expected response shape

```json
{
  "anomalies": [
    {
      "id": "3caaa9f1-ddfd-4fe6-a8df-43db48653ba6",
      "nmId": 12345678,
      "forecastId": "forecast-uuid-optional",
      "anomalyType": "demand_spike",
      "triggeredAt": "2026-05-15T10:23:00Z",
      "status": "pending",
      "cabinetId": "cabinet-uuid",
      "modelId": "model-uuid-optional"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### Per-entry shape

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` (UUID) | Yes | Anomaly record ID — used in `PATCH /v1/ai/anomalies/{id}/resolve` |
| `nmId` | `number` | Yes | WB product article (номенклатурный ID) |
| `forecastId` | `string` (UUID) | No | Associated forecast ID if available |
| `anomalyType` | `string` | Yes | Type label (e.g. `demand_spike`, `demand_drop`, `data_gap`) |
| `triggeredAt` | `string` (ISO 8601) | Yes | Timestamp when anomaly was detected |
| `status` | `'pending' \| 'resolved'` | Yes | Current resolution status |
| `cabinetId` | `string` | Yes | Cabinet that owns this anomaly (for audit) |
| `modelId` | `string` (UUID) | No | Model that triggered the anomaly if traceable |

---

## Current contract (existing resolve endpoint for reference)

```http
PATCH /v1/ai/anomalies/{id}/resolve
Authorization: Bearer <JWT_TOKEN>
X-Cabinet-Id: <cabinet_id>
Content-Type: application/json

{
  "resolutionCause": "seasonal",
  "resolutionNote": "Holiday demand spike — expected pattern"
}
```

`resolutionCause` is one of: `seasonal`, `pricing_error`, `quality_issue`, `tariff_change`, `category_reclassification`, `other` (Story 108.1-FE `ResolutionCause` enum — `src/types/ai/system.ts:41-47`).

---

## Validation criteria

- `GET /v1/ai/anomalies` returns paginated list scoped to the requesting cabinet
- `GET /v1/ai/anomalies?status=pending` returns only unresolved anomalies
- `GET /v1/ai/anomalies?status=resolved` returns only resolved anomalies
- `GET /v1/ai/anomalies?page=2&limit=10` returns page 2 with up to 10 entries
- Analyst and Service roles receive 403
- Empty cabinet returns `{ anomalies: [], total: 0, page: 1, limit: 20 }` — NOT 404

---

## Example requests

### 1. All anomalies (default pagination)

```bash
curl -X GET "http://localhost:3000/v1/ai/anomalies" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "X-Cabinet-Id: <cabinet_id>"
```

### 2. Pending anomalies only

```bash
curl -X GET "http://localhost:3000/v1/ai/anomalies?status=pending" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "X-Cabinet-Id: <cabinet_id>"
```

### 3. Paginated

```bash
curl -X GET "http://localhost:3000/v1/ai/anomalies?page=2&limit=10" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "X-Cabinet-Id: <cabinet_id>"
```

---

## Example curls

```bash
# Cabinet-wide listing (default: status=pending, page=1, limit=20)
curl -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CABINET_ID" \
  https://api.wb-repricer.local/v1/ai/anomalies

# Status-filtered (resolved anomalies)
curl -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CABINET_ID" \
  'https://api.wb-repricer.local/v1/ai/anomalies?status=resolved'

# Paginated (page 2, 50 per page)
curl -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CABINET_ID" \
  'https://api.wb-repricer.local/v1/ai/anomalies?page=2&limit=50'
```

---

## Frontend readiness

The frontend is **ready to consume this endpoint** once it ships. Steps to activate:

1. Open `src/lib/api/ai/system.ts` — find `getAnomalies` function
2. Replace the stub body (returns empty list) with:
   ```typescript
   const params = new URLSearchParams()
   if (_params?.status) params.set('status', _params.status)
   if (_params?.page != null) params.set('page', String(_params.page))
   if (_params?.limit != null) params.set('limit', String(_params.limit))
   const query = params.toString()
   return apiClient.get<AnomalyListResponse>(`/v1/ai/anomalies${query ? `?${query}` : ''}`)
   ```
3. Remove the `// PENDING BACKEND: #167` comment
4. The `useAnomalies` hook, `<AnomaliesList>` component, and full table UI activate automatically

No type changes, no hook changes, no test changes required on backend ship.

---

## References

- Existing resolve endpoint: `../test-api/99-ai.http:829` (`PATCH /v1/ai/anomalies/{id}/resolve`)
- Frontend types: `src/types/ai/system.ts` (`AnomalyEntry`, `AnomalyStatus`, `AnomalyListResponse`)
- Frontend fetcher stub: `src/lib/api/ai/system.ts` (`getAnomalies`)
- Frontend hook: `src/hooks/useAnomalies.ts`
- Frontend UI: `src/app/(dashboard)/analytics/ai-admin/anomalies/`
- Story file: `_bmad-output/implementation-artifacts/112-3-fe-anomaly-resolution-admin-ui.md`

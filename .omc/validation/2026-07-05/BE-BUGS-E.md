# BE-BUGS-E — Cluster E (AI-admin + misc analytics) backend-owned issues

> Validation date: 2026-07-06 (live FE `:3100` / BE `:3000`, cabinet `f75836f7-…-a1f3508cce8e`, W26).
> Cluster E pages: `/analytics/models*`, `/analytics/ai-admin/*`, `/analytics/dashboard`, `/analytics`, `/analytics/alerts`, `/analytics/gaps`, `/analytics/finance-history`, `/analytics/time-period`.

---

## BE-E-1 — `POST /v1/notifications/orders/settings` rejects `cabinetId` that its own GET response includes (cross-cluster, surfaces on Cluster E pages)

| | |
|---|---|
| **Endpoint** | `POST /v1/notifications/orders/settings` |
| **Request** | Body = the exact object returned by `GET /v1/notifications/orders/settings` (which contains `cabinetId`). FE re-POSTs the fetched object on save (`src/lib/api/notifications.ts:133`). |
| **Response** | `400 BAD_REQUEST` — `{"error":{"code":"BAD_REQUEST","message":"Validation failed","details":[{"field":"property","issue":"cabinetId should not exist","message":"property cabinetId should not exist"}],"trace_id":"bc108b3a-…"}}` |
| **Expected** | Either (a) GET omits `cabinetId` from the DTO, or (b) POST ignores/accepts `cabinetId` (whitelist it). Round-trip GET→POST must succeed. |
| **Actual** | Every save of the Order Notification Settings form fails with 400 because the FE echoes back the `cabinetId` field the GET put in the object. POST without `cabinetId` returns 201. |
| **Repro** | `curl -X POST -H "Authorization: Bearer $(cat /tmp/feval-token)" -H "X-Cabinet-Id: $(cat /tmp/feval-cab)" -H "Content-Type: application/json" -d "$(curl -s -H "Authorization: Bearer $(cat /tmp/feval-token)" -H "X-Cabinet-Id: $(cat /tmp/feval-cab)" http://localhost:3000/v1/notifications/orders/settings)" http://localhost:3000/v1/notifications/orders/settings` → 400. |
| **trace_id** | `bc108b3a-…` (representative) |
| **Impact** | **High** — users cannot persist Order Notification Settings toggles (new-order, SLA-warning, daily-summary, quiet hours) via the Settings UI. Seen live in browser console during Cluster E navigation (settings sidebar is shared). Note: this bug is rooted in the Settings domain but is exercised cluster-wide because the notification-settings hook mounts on the dashboard layout. |

---

## BE-E-2 — `GET /v1/imports/gaps` ignores `X-Cabinet-Id` header, requires `cabinet_id` query param (inconsistent with rest of API)

| | |
|---|---|
| **Endpoint** | `GET /v1/imports/gaps?dateFrom=…&dateTo=…` |
| **Request** | `X-Cabinet-Id` header only (the standard cabinet-scoping mechanism used across all other `/v1/analytics/*` and `/v1/ai/*` endpoints). |
| **Response** | `400 BAD_REQUEST` — `{"error":{"code":"BAD_REQUEST","message":"cabinet_id query parameter is required","trace_id":"523deb38-13b7-4e46-8678-a73b6458847e",…}}` |
| **Expected** | Endpoint honors `X-Cabinet-Id` header like every other cabinet-scoped endpoint. |
| **Actual** | Header is ignored; `cabinet_id` must be passed as a query param. The FE already works around this (`src/lib/api/financial-gaps.ts` builds `URLSearchParams({cabinet_id, dateFrom, dateTo})`), so the page renders correctly — but the contract is inconsistent and any other client relying on the header alone will break. |
| **Repro** | `curl -H "Authorization: Bearer $(cat /tmp/feval-token)" -H "X-Cabinet-Id: $(cat /tmp/feval-cab)" "http://localhost:3000/v1/imports/gaps?dateFrom=2026-06-01&dateTo=2026-06-28"` → 400. Adding `&cabinet_id=$(cat /tmp/feval-cab)` → 200. |
| **trace_id** | `523deb38-13b7-4e46-8678-a73b6458847e` |
| **Impact** | **Low** (FE mitigated) — no user-visible defect on `/analytics/gaps`; logged for contract consistency. Same inconsistency may apply to `POST /v1/imports/gaps/analyze` and `POST /v1/imports/gaps/remediate` (FE also sends `cabinet_id` in body for those). |

---

## Summary
- **2 BE-owned issues** captured for Cluster E.
- **0 blockers** for Cluster E page rendering / data correctness (both BE issues are either FE-mitigated (BE-E-2) or rooted in the shared Settings domain (BE-E-1)).
- All Cluster E pages load with 200 status maps and display API-faithful data.

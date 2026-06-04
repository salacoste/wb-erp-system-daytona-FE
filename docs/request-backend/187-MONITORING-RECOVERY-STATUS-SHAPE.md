# Request #187 — `/v1/monitoring/recovery-status`: envelope + missing task fields

**Originated by**: Frontend validation campaign (finding F-41), 2026-06-02
**Severity**: P2 — the `/monitoring` Recovery tab shows "Нет задач для восстановления" (empty) despite the backend returning 6 recovery tasks; and the RecoveryPanel renders 4 task fields the response omits. FE is being hardened (envelope unwrap + FE-derived display names + graceful degradation), but the config fields need the backend.
**Status**: PENDING BACKEND

---

## Problem A — response envelope (FE-fixable, but documenting the shape)

`GET /v1/monitoring/recovery-status?cabinetId=…` returns (LIVE-VERIFIED 2026-06-02):

```json
{ "success": true, "data": [ { …6 RecoveryTask items… } ] }
```

The FE `apiClient` auto-unwraps the `{ data }` envelope → the hook receives the bare array, but `RecoveryPanel` reads `data.tasks` → undefined → empty state. (FE fix: construct `{ tasks: [...] }` at the API boundary — being handled FE-side.)

## Problem B — missing task fields (needs backend)

Each live item has only:
```json
{ "taskType": "...", "status": "...", "lastAttempt": "...", "totalAttempts": N, "canRetry": bool }
```

But `RecoveryPanel` (+ its `Tip` tooltip) renders 4 fields that are NOT in the response:

| FE-rendered field | Where | Current render with missing field |
|---|---|---|
| `displayName` | task name cell + confirm dialog | blank task name |
| `maxRetries` | `{totalAttempts}/{maxRetries}` cell | "N/undefined" |
| `cooldownMinutes` | Tip tooltip | "пауза: undefined мин" |
| `maxWindowDays` | Tip tooltip | "Макс. период: undefined дн." |

## Requested fix

Add `displayName`, `maxRetries`, `cooldownMinutes`, `maxWindowDays` to each item in the `recovery-status` response (the backend knows these per task-type config). Optionally drop the `{success, data}` envelope to match the FE-canonical `{ tasks: [...] }`, or keep it (FE unwraps).

## FE side (being handled)

- Unwrap the envelope → `{ tasks }` so the 6 tasks render.
- Derive `displayName` from `taskType` via a FE label map (interim, until backend sends it).
- Gracefully degrade `maxRetries`/`cooldownMinutes`/`maxWindowDays` (render "—" / hide the Tip) instead of "undefined" until this ticket lands.

## Evidence
- Live: `recovery-status` → `{success, data:[6 items]}`; item keys = `[canRetry, lastAttempt, status, taskType, totalAttempts]`.
- FE: `src/lib/api/monitoring.ts:64` (getRecoveryStatus, no unwrap handling); `src/app/(dashboard)/monitoring/components/RecoveryPanel.tsx:56,85,95,183-184` (reads `data.tasks`, `displayName`, `maxRetries`, `cooldownMinutes`, `maxWindowDays`).

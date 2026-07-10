# /analytics/ai-admin/preferences — Настройки AI (Owner-gated)
**Route:** `/analytics/ai-admin/preferences` · **Filters state:** none

## 1. Load
- HTTP statusMap (all 200): `GET /v1/ai/preferences`, `GET /v1/analytics/supply-planning`, cabinet meta. Accessible as **Owner**.
- Renders: H1 "Настройки AI", "Управление AI функциями для текущего кабинета.", "Включить AI прогнозы" switch (checked when `aiEnabled:true`).
- No console errors.

## 2. Interactive elements
- **"Включить AI прогнозы" switch** → toggles PATCH `/v1/ai/preferences` body `{aiEnabled: bool}`. Verified live: toggle off → API returns `{aiEnabled:false}` + switch unchecked; toggle on → `{aiEnabled:true}` + switch checked. **PASS (mutation confirmed end-to-end).**
- **Role-gate**: Owner-only (`AiPreferencesForm` + `useUpdateAiPreferences`). ✅

## 3. Data vs API
| Rendered | API field (`GET /v1/ai/preferences`) | Match |
|---|---|---|
| switch `[checked]` | `aiEnabled: true` | ✅ |
| "Когда отключено, все AI-эндпоинты возвращают пустые ответы…" | (description text) | ✅ honest copy |

## 4. AP#8 runtime
- N/A (boolean toggle).

## 5. Findings
- None. Toggle mutation round-trips correctly.

# /analytics/acquiring (+/period, /reports/[id]) — Аналитика эквайринга

**Route:** `/analytics/acquiring`, `/analytics/acquiring/period`, `/analytics/acquiring/reports/123`
**Filters state:** default 30-day range (07.06.2026 — 06.07.2026)
**Validated:** 2026-07-06 · live BE `:3000` + rendered Playwright `:3100`

## 1. Load
| Route | Endpoint | Status | Render |
|---|---|---|---|
| `/acquiring` | `GET /v1/analytics/acquiring/reports?from=2026-06-07&to=2026-07-06` | **200** `{data:[],cached_at}` | «Отчёты за выбранный период не найдены. Для не-РФ продавцов данные всегда пустые (см. Request #166).» ✅ |
| `/acquiring/period` | `GET /v1/analytics/acquiring/detail?from=2026-06-30&to=2026-07-06` | **200** `{data:[],cached_at}` | «Транзакции за выбранный период не найдены. Для не-РФ продавцов данные всегда пустые.» ✅ |
| `/acquiring/reports/123` | (no real report id — list is empty) | n/a | renders shell «Отчёт #123» / «Период транзакций» (no crash on missing id) ✅ |

No console errors. Date-range picker, «Рекомендуемая агрегация: Ежедневно», «Выбрано: N дней» all render.

## 2. Interactive elements
- DateRangePickerExtended → updates `from`/`to` → refetch. ✅ (default 30d applied to both sub-routes)
- "Назад к отчётам" link on `/period` and `/reports/[id]` → back to `/acquiring`. ✅
- Reports table: empty-state with the non-RF explanatory note (good defensive copy). ✅
- `/reports/[id]` does not 404 the route on a non-existent id — renders a data-missing shell (acceptable; no real ids to test the populated path).

## 3. Data vs API
- Both endpoints return `{data:[], cached_at}` — empty for this cabinet. No numeric reconciliation possible. The FE unwraps `data` and renders the empty-state. ✅ faithful.
- **Parameter contract:** endpoint requires `from`+`to` (YYYY-MM-DD); a bare `?limit=5` → 400 «Both "from" and "to" query parameters are required». The FE always sends both (verified `acquiring-analytics.ts:67-68,101-102`). ✅

## 4. AP#8 runtime
- No money/ratio fields to display on empty data. The empty-states are honest (no fabricated zeros). ✅

## 5. Findings
- **Data condition, not a bug:** acquiring data is empty because the test cabinet is a non-RF seller (Request #166, acknowledged in the FE copy). The pages handle this gracefully with clear RU messaging.
- No FE defects (`BD-*`): none. No BE defects beyond the known non-RF data gap (already documented as Request #166, not re-filed).
- `/reports/[id]` populated-path untestable (no report ids exist on this cabinet).

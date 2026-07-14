# /analytics/gaps — Пропуски в данных
**Route:** `/analytics/gaps` · **Filters state:** dateFrom=2026-06-06, dateTo=2026-07-06 (last 30 days, auto)

## 1. Load
- HTTP statusMap (all 200): `GET /v1/imports/gaps?cabinet_id=…&dateFrom=2026-06-06&dateTo=2026-07-06`, `GET /v1/analytics/supply-planning`, cabinet meta.
- Renders: H1 "Пропуски в данных", coverage stats (Покрытие / Всего дней / Пропущено), missing-days list with "Анализ" buttons.
- No console errors.

## 2. Interactive elements
- **"Анализ" button per missing day** → POST `/v1/imports/gaps/analyze` `{cabinet_id, missing_date}`. **PASS** (buttons present).
- **Remediate action** → POST `/v1/imports/gaps/remediate`. Wired.
- Date-range auto-computed to last 30 days from today (2026-07-06).

## 3. Data vs API (`GET /v1/imports/gaps` for 06-06→07-06)
| Renderered | API field | Match |
|---|---|---|
| Покрытие 74,0 % | `coverage_percent: 74` | ✅ |
| Всего дней 31 | `total_days: 31` | ✅ |
| Пропущено 8 | `missing_days: 8` | ✅ |
| 8 missing-day rows (06-29…07-06) | `missing_dates[8]` | ✅ |

Missing days are W27 (06-29→07-06, current/future week not yet imported) — data is correct, not a defect.

## 4. AP#8 runtime
- Coverage %, day counts are non-null numbers. ✅

## 5. Findings
- **BE-E-2 (low):** `GET /v1/imports/gaps` requires `cabinet_id` query param (ignores `X-Cabinet-Id` header) — FE already mitigates by sending it in query string. No user-visible defect. See `BE-BUGS-E.md`.

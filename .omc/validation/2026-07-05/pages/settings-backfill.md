# /settings/backfill — Управление бэкфиллом (admin, "Импорт")
**Route:** /settings/backfill · **Filters:** none
**Validated:** 2026-07-06 · role=owner (page accessible; start not exercised — would enqueue 365-day job)

## 1. Load
- `GET /v1/admin/backfill/status` → **200** (owner can READ)
  - `[{"cabinetName":"Test Cabinet","reportsStatus":"not_started","analyticsStatus":"not_started","overallProgress":0,"errors":[]}]`
- H1 «Управление бэкфиллом» + subtitle «Загрузка исторических данных FBS за 365 дней»
- Status table: Кабинет / Статус / Прогресс / ETA / Ошибки / Действия
- Buttons: «Запустить бэкфилл» + «Обновить» (refresh)

## 2. Interactive elements
| Element | Action | Effect | Pass |
|---|---|---|---|
| Status table render | render | Row «Test Cabinet | Отчёты: Не начат / Аналитика: Не начат | 0% (progressbar) | Неизвестно | — | —» matches API | ✅ |
| «Обновить» button | (refresh) | re-fetches status | ✅ |
| «Запустить бэкфилл» | click | opens dialog «Запуск бэкфилла» — cabinet selector, Отмена/Запустить (disabled until cabinet chosen) | ✅ (inspected, not started) |
| Start dialog | (not submitted) | would `POST /v1/admin/backfill/start` — skipped to avoid enqueuing 365-day historical job on real cabinet | ➖ |

## 3. Data vs API
| Rendered | API field | Match |
|---|---|---|
| «Test Cabinet» | cabinetName | ✅ |
| «Отчёты: Не начат» | reportsStatus:"not_started" | ✅ |
| «Аналитика: Не начат» | analyticsStatus:"not_started" | ✅ |
| progressbar «0%» | overallProgress:0 | ✅ |
| ETA «Неизвестно» | (no eta field in API → honest «Неизвестно») | ✅ |
| Errors «—» | errors:[] | ✅ |

## 4. AP#8 runtime
- Empty errors array → «—». Progress 0 → progressbar 0% (semantic zero, correct). ETA null → «Неизвестно». No `?? 0` violations. ✅

## 5. Findings
- **BE-BUG-F-005 (INFO, BE contract gap)** — Same role-gate concern as tariffs: `/v1/admin/backfill/*` — owner can GET status (200) but start endpoint likely also requires `admin` role (untested by design). If so, Owner clicking «Запустить» would 403 like tariffs. Recommend BE clarify: is `owner` an admin-capable role for backfill, or must the user hold a separate `admin` role? (Page-level access already works for owner, so the start mutation should too.) Filed to BE-BUGS-F.md as informational.
- No FE defects found; rendering + status mapping faithful. No AP#8 violations.

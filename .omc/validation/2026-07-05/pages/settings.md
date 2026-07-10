# /settings — root landing (redirect index)
**Route:** /settings · **Validated:** 2026-07-06

## 1. Load — `GET /settings` → **redirect to /settings/notifications** ✅

## 2-5. Findings
- **Feb 404 RESOLVED.** `/settings` now redirects to `/settings/notifications` (the first tab). The settings shell renders a 6-tab sub-nav: Кабинет / Уведомления / Налоги / Тарифы / Расходы / Импорт. Each tab's content validated in its own doc:
  - cabinet → `settings-cabinet.md` (BD-FE-002 Invalid Date)
  - notifications → `settings-notifications.md` (BD-FE-001 cabinetId round-trip)
  - tax → `settings-tax.md` (BD-FE-004 vatRate null)
  - tariffs → `settings-tariffs.md` (BD-FE-005/BE-BUG-F-004 admin role)
  - expenses → `settings-expenses.md` (BD-FE-003 Decimal NaN)
  - backfill → `settings-backfill.md` (BE-BUG-F-005 role note)
- No defects in the redirect itself.

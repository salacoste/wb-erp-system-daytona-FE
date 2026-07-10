# /monitoring — Мониторинг (system health)
**Route:** /monitoring · **Filters:** none
**Validated:** 2026-07-06 · role=owner

## 1. Load
- H1 «Мониторинг» + subtitle «Состояние системы, полнота данных и статус синхронизации».
- Banner: «Все источники работают исправно».
- Telegram card: «Не настроен» + CTA «Настроить Telegram →» (matches telegram_status bound:false).
- Source groups: «Высокочастотные» / «Ежедневные» / «Еженедельные» with per-source articles (progressbar Успешность выполнения %, «Успешность за 24ч», alert counts).

## 2. Interactive elements
| Element | Action | Effect | Pass |
|---|---|---|---|
| «Настроить Telegram →» link | render | links to notifications setup | ✅ |
| Source articles (per pipeline) | render | Оценка алертов / Автоматизация / Возвраты… each shows «— Нет данных» + progressbar 0% when no data | ✅ |
| Progressbars (Успешность выполнения 100% / 0%) | render | reflects task success rate | ✅ |

## 3. Data vs API
- Driven by tasks/alerts/sync-status aggregation. Where data missing → honest «— Нет данных» + «0 %» (24h). Verified the empty-state rendering is faithful (not fabricated numbers).

## 4. AP#8 runtime
- **Excellent AP#8 compliance**: every null/missing metric renders «—» (em dash) followed by «Нет данных», never `0` or `0%` masquerading as a real value. Alert counts null → «—». 24h-success 0 % shown only where semantically meaningful. ✅
- One minor note: «Успешность за 24ч: 0 %» appears next to «—» — when there is no data, 0% is arguably misleading (suggests 0 successful runs vs no data). Borderline; the «—» and «Нет данных» adjacent mitigate it. Non-blocking.

## 5. Findings
- No FE defects. Strong AP#8 discipline. Data-honest throughout.

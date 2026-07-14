# /settings/notifications — Telegram Уведомления
**Route:** /settings/notifications (also `/settings` root → redirects here) · **Filters:** none
**Validated:** 2026-07-06 · role=owner · telegram_bound=false (unbound)

## 1. Load
- `/settings` (root) → **302/redirect** to `/settings/notifications` ✅ (Feb 404 RESOLVED)
- Settings sub-nav: 6 tabs (Кабинет, Уведомления, Налоги, Тарифы, Расходы, Импорт) — all linked correctly
- `GET /v1/notifications/preferences` → **200** (`telegram_bound:false`, daily_digest:false)
- `GET /v1/notifications/telegram/status` → **200** (`bound:false`)
- `GET /v1/notifications/orders/settings` → **200** (newOrder/slaWarning/dailySummary all `true`, dailySummaryHour:9, confirmationSlaWarningMinutes:30, completionSlaWarningMinutes:120)
- H1 «Telegram Уведомления»; sections: Telegram-bind CTA, «Настройки уведомлений» (gated), «Тихие часы» (gated), «Уведомления о заказах FBS» (active)

## 2. Interactive elements
| Element | Action | Effect | Pass |
|---|---|---|---|
| Settings sub-nav links | click each | navigates to /settings/{cabinet,notifications,tax,tariffs,expenses,backfill} | ✅ |
| «Подключить Telegram» button | (not clicked — would start binding flow via @Kernel_crypto_bot) | renders; bot handle shown | ✅ |
| FBS «Новый заказ» switch [checked] | click off | `POST /v1/notifications/orders/settings` → **400 BAD_REQUEST** `"cabinetId should not exist"`; switch stays checked; toast/error logged | ❌ **BD-FE-001** |
| FBS «Предупреждение SLA» / «Ежедневная сводка» switches | render [checked] | (blocked by same 400 — all 3 share the patch fn) | ❌ BD-FE-001 |
| Preferences form (task_completed etc.) | gated behind Telegram bind | cannot exercise until bound | ➖ |

## 3. Data vs API
| Rendered | API field | Match |
|---|---|---|
| 3 FBS switches all ON | newOrderEnabled/slaWarningEnabled/dailySummaryEnabled = true | ✅ |
| dailySummaryHour (in «Время уведомлений») | dailySummaryHour:9 | ✅ |
| SLA thresholds (Пороги предупреждений SLA) | confirmationSlaWarningMinutes:30, completionSlaWarningMinutes:120 | ✅ |
| «Подключите Telegram» gating | telegram_bound:false | ✅ |

## 4. AP#8 runtime
- N/A — boolean toggles + small integer thresholds; no money/ratio.

## 5. Findings
- **BD-FE-001 (BLOCKER, FE)** — FBS order-notifications switches do NOT persist. `src/components/custom/settings/OrderNotificationSettings.tsx:46` calls `updateSettings({ ...settings, ...partial })`, spreading the **full GET response** (which includes `cabinetId`) into the POST body. The BE DTO `UpdateOrderNotificationSettingsDto` whitelists fields and rejects `cabinetId` → 400 `"property cabinetId should not exist"`. **Fix**: send only the writable fields (omit `cabinetId`), e.g. destructure `const { cabinetId, ...rest } = settings; updateSettings({ ...rest, ...partial })` or build an explicit payload. Console trace: `API Error [400] ... Failed to update order notification settings: ApiError: Validation failed` (trace_id `08fc4fc5-…`, `830d92ae-…`). Repro: load page, toggle any FBS switch, observe 400 in network/console.
- **BE-BUG-F-001 (BE, round-trip mismatch)** — `PUT /v1/notifications/preferences` rejects `quiet_hours.timezone`, but `GET /v1/notifications/preferences` **includes** `timezone:"Europe/Moscow"` in the response. Round-trip impossible without FE stripping timezone. Same DTO-inconsistency class as BD-FE-001 but BE-owned. Repro: `curl -X PUT ... -d '{"quiet_hours":{...,"timezone":"Europe/Moscow"}}'` → 400 `quiet_hours.property timezone should not exist`. Workaround confirmed: omit timezone → 200. (Filed to BE-BUGS-F.md.)
- No AP#8 violations; no fabrication.

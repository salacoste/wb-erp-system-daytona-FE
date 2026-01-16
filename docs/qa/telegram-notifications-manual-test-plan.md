# Telegram Notifications - Manual Test Plan

**Date**: 2025-12-30
**Epic**: Epic 34-FE - Telegram Notifications
**Tester**: Frontend Team
**Backend Status**: ✅ JWT Authentication Fixed, All Endpoints Operational
**Frontend Status**: ✅ Phase 1 Complete

---

## Test Environment Setup

### Prerequisites

✅ **Backend Requirements**:
- Backend server running on `http://localhost:3000`
- JWT authentication working (confirmed 2025-12-29)
- Telegram bot operational (`@Kernel_crypto_bot`)

✅ **Frontend Requirements**:
- Frontend dev server running (`npm run dev`)
- Test user account created

✅ **Test Credentials**:
```
Email: test@test.com
Password: Russia23!
Cabinet ID: f75836f7-c0bc-4b2c-823c-a1f3508cce8e
```

✅ **Required Tools**:
- Telegram mobile app OR Telegram Desktop
- Browser DevTools open (Network tab + Console)

---

## Test Scenarios

### Scenario 1: Initial Page Load (Not Bound)

**Objective**: Verify empty state and initial UI

**Steps**:
1. Login to frontend with test credentials
2. Navigate to `/settings/notifications`
3. Observe page content

**Expected Results**:
- ✅ Page title: "Telegram Уведомления"
- ✅ Hero banner displayed (blue gradient card)
- ✅ Feature list visible:
  - "Мгновенные уведомления о задачах"
  - "Тихие часы"
  - "Ежедневная сводка"
- ✅ CTA button: "Подключить Telegram" (blue, Telegram color)
- ✅ Notification Preferences Panel shows **disabled overlay** with lock icon
- ✅ Quiet Hours Panel shows **disabled overlay** with lock icon
- ✅ Help section visible at bottom

**Acceptance Criteria**:
- [ ] All UI elements render correctly
- [ ] No console errors
- [ ] Disabled overlays have blur effect
- [ ] Mobile responsive (test at 375px width)

---

### Scenario 2: Start Binding Flow

**Objective**: Verify binding code generation

**Steps**:
1. Click "Подключить Telegram" button in hero banner
2. Observe modal open

**Expected Results - Modal UI**:
- ✅ Modal title: "Подключение Telegram"
- ✅ Loading spinner appears (blue Telegram color)
- ✅ After 1-2 seconds, binding code displays

**Expected Results - Binding Code Display**:
- ✅ "Шаг 1: Откройте бот в Telegram" heading
- ✅ Bot mention: "@Kernel_crypto_bot"
- ✅ Verification code in monospace font: `/start ABC123` (8-char code)
- ✅ "Копировать" button with copy icon
- ✅ "или" divider line
- ✅ "Открыть в Telegram" button (full width, blue)
- ✅ Countdown timer: "Код действителен ещё: 10:00"
- ✅ Progress bar (blue, full width)
- ✅ Polling message: "Ожидаем подтверждения..."

**Acceptance Criteria - Network Tab**:
- [ ] `POST /v1/notifications/telegram/bind` → 200 OK
- [ ] Response contains: `binding_code`, `deep_link`, `expires_at`
- [ ] `GET /v1/notifications/telegram/status` starts polling every 3 seconds

**Acceptance Criteria - Console**:
- [ ] No errors
- [ ] Polling logs appear every 3s (if debug logs enabled)

---

### Scenario 3: Copy Binding Code

**Objective**: Verify copy-to-clipboard functionality

**Steps**:
1. In open modal, click "Копировать" button
2. Paste clipboard content into text editor

**Expected Results**:
- ✅ Toast notification: "Команда скопирована!"
- ✅ Clipboard contains: `/start ABC123` (with `/start ` prefix)

**Acceptance Criteria**:
- [ ] Copy succeeds
- [ ] Toast appears
- [ ] Command includes `/start ` prefix

---

### Scenario 4: Deep Link to Telegram

**Objective**: Verify deep link opens Telegram app

**Steps**:
1. Click "Открыть в Telegram" button
2. Observe new browser tab or Telegram app opening

**Expected Results**:
- ✅ New tab opens with URL: `https://t.me/Kernel_crypto_bot?start=ABC123`
- ✅ Telegram app/web opens (if installed)
- ✅ Bot chat opened with pre-filled `/start ABC123` command

**Acceptance Criteria**:
- [ ] Link opens correctly
- [ ] Bot chat accessible
- [ ] Code pre-filled (if supported by Telegram client)

---

### Scenario 5: Complete Binding in Telegram

**Objective**: Verify end-to-end binding flow

**Steps**:
1. In Telegram app, send `/start ABC123` command to `@Kernel_crypto_bot`
2. Wait for bot response
3. Observe frontend modal (keep it open)

**Expected Results - Telegram Bot**:
- ✅ Bot responds within 1-2 seconds
- ✅ Message confirms binding: "✅ Telegram успешно подключен!"
- ✅ Shows username and cabinet info

**Expected Results - Frontend Modal**:
- ✅ After 3-6 seconds (next poll), modal auto-closes
- ✅ Toast notification: "Telegram успешно подключен!"
- ✅ Page updates to show "bound" state

**Acceptance Criteria - Network Tab**:
- [ ] `GET /v1/notifications/telegram/status` eventually returns `{"bound": true, "telegram_username": "...", ...}`
- [ ] Polling stops after `bound: true`

**Acceptance Criteria - UI**:
- [ ] Hero banner disappears
- [ ] TelegramBindingCard appears (green badge "Подключено")
- [ ] Notification Preferences Panel enabled (no overlay)
- [ ] Quiet Hours Panel enabled (no overlay)

---

### Scenario 6: Verify Bound State

**Objective**: Verify post-binding UI state

**Steps**:
1. After successful binding, observe `/settings/notifications` page

**Expected Results - Telegram Binding Card**:
- ✅ Status badge: "Подключено" (green)
- ✅ Telegram icon
- ✅ Shows username: "@username"
- ✅ Shows binding date
- ✅ "Отключить Telegram" button (red/destructive variant)

**Expected Results - Notification Preferences Panel**:
- ✅ No disabled overlay
- ✅ Event type toggles functional:
  - "Задача выполнена" (default: ON)
  - "Ошибки" (default: ON)
  - "Зависшие задачи" (default: OFF)
  - "Ежедневная сводка" (default: ON)
- ✅ Digest time picker shows time (e.g., "09:00")
- ✅ Language selector (ru/en)

**Expected Results - Quiet Hours Panel**:
- ✅ No disabled overlay
- ✅ Enable toggle (default: OFF)
- ✅ Time range pickers (From/To)
- ✅ Timezone selector

**Acceptance Criteria**:
- [ ] All panels functional
- [ ] No console errors
- [ ] All toggles clickable

---

### Scenario 7: Update Notification Preferences

**Objective**: Verify preferences update flow

**Steps**:
1. Toggle "Задача выполнена" OFF
2. Change language to "en"
3. Wait 1-2 seconds

**Expected Results**:
- ✅ Toggle updates instantly (optimistic update)
- ✅ No loading spinner (optimistic UI)
- ✅ After 1-2 seconds, success confirmation (or toast)

**Acceptance Criteria - Network Tab**:
- [ ] `PUT /v1/notifications/preferences` → 200 OK
- [ ] Request body: `{"preferences": {"task_completed": false}, "language": "en"}`
- [ ] Response matches updated preferences

**Acceptance Criteria - Persistence**:
- [ ] Reload page → preferences persist
- [ ] `GET /v1/notifications/preferences` returns updated values

---

### Scenario 8: Configure Quiet Hours

**Objective**: Verify quiet hours configuration

**Steps**:
1. Enable quiet hours toggle
2. Set "From": 23:00
3. Set "To": 08:00
4. Select timezone: "Europe/Moscow"
5. Save (if there's a save button)

**Expected Results**:
- ✅ Toggle enables time pickers
- ✅ Time pickers accept input
- ✅ Timezone selector shows options
- ✅ Values save to backend

**Acceptance Criteria - Network Tab**:
- [ ] `PUT /v1/notifications/preferences` → 200 OK
- [ ] Request body includes: `{"quiet_hours": {"enabled": true, "from": "23:00", "to": "08:00"}, "timezone": "Europe/Moscow"}`

**Acceptance Criteria - Validation**:
- [ ] Invalid time ranges rejected (e.g., same start/end time)
- [ ] Invalid timezone rejected

---

### Scenario 9: Countdown Timer Behavior

**Objective**: Verify timer accuracy and visual feedback

**Steps**:
1. Start new binding flow (unbind first if already bound)
2. Observe countdown timer for 60 seconds

**Expected Results - Timer Countdown**:
- ✅ Starts at 10:00 (600 seconds)
- ✅ Decrements every second
- ✅ Format: "MM:SS" (e.g., "09:59", "09:58", ...)

**Expected Results - Progress Bar Color**:
- ✅ 10:00 - 2:01 → Blue (`bg-[#0088CC]`)
- ✅ 2:00 - 0:31 → Orange (`bg-orange-500`)
- ✅ 0:30 - 0:00 → Red (`bg-red-500`) + pulsing animation

**Expected Results - Polling Messages**:
- ✅ 0-5 seconds: "Ожидаем подтверждения..."
- ✅ 6-60 seconds: "Всё ещё ожидаем... Проверьте Telegram."
- ✅ 61+ seconds: "Подтверждение занимает дольше обычного. Убедитесь, что вы отправили команду боту."

**Acceptance Criteria**:
- [ ] Timer accuracy ±1 second
- [ ] Color transitions occur at correct thresholds
- [ ] Polling message changes correctly

---

### Scenario 10: Code Expiration

**Objective**: Verify behavior when code expires

**Steps**:
1. Start binding flow
2. Wait 10 minutes (or manually advance system time)
3. Observe modal

**Expected Results**:
- ✅ Timer reaches 0:00
- ✅ Progress bar disappears or becomes red
- ✅ Error alert appears: "Код истёк. Пожалуйста, закройте окно и попробуйте снова."
- ✅ Polling stops

**Acceptance Criteria**:
- [ ] Clear error message
- [ ] Polling stops (no unnecessary requests)
- [ ] User can close modal and retry

---

### Scenario 11: Unbind Telegram

**Objective**: Verify unbind flow

**Steps**:
1. From bound state, click "Отключить Telegram" button
2. Observe confirmation dialog
3. Confirm unbind
4. Observe page updates

**Expected Results - Confirmation Dialog**:
- ✅ Dialog title: "Отключить Telegram?"
- ✅ Warning message about losing notifications
- ✅ "Отменить" button (secondary)
- ✅ "Отключить" button (destructive/red)

**Expected Results - After Confirm**:
- ✅ Toast: "Telegram отключен"
- ✅ Page reverts to "not bound" state:
  - Hero banner appears
  - Binding card disappears
  - Preferences/quiet hours show disabled overlays

**Acceptance Criteria - Network Tab**:
- [ ] `DELETE /v1/notifications/telegram/unbind` → 200 OK
- [ ] `GET /v1/notifications/telegram/status` returns `{"bound": false}`

**Acceptance Criteria - Cleanup**:
- [ ] No orphaned data in frontend state
- [ ] Can re-bind immediately after unbind

---

### Scenario 12: Error Handling - Binding Failure

**Objective**: Verify error handling when binding fails

**Steps**:
1. Simulate backend error (stop backend OR modify code to return 500)
2. Click "Подключить Telegram"
3. Observe error handling

**Expected Results**:
- ✅ Toast error: "Не удалось создать код привязки. Попробуйте ещё раз."
- ✅ Modal stays open OR closes
- ✅ User can retry

**Acceptance Criteria**:
- [ ] Error message user-friendly
- [ ] Console shows technical error details
- [ ] No infinite loading state

---

### Scenario 13: Error Handling - 401 Unauthorized

**Objective**: Verify behavior when JWT expires

**Steps**:
1. Clear JWT token from localStorage (or wait for expiration)
2. Try to access `/settings/notifications`
3. Observe redirect/error

**Expected Results**:
- ✅ Redirect to `/login` page
- ✅ OR: Error message "Session expired"
- ✅ User can re-login

**Acceptance Criteria**:
- [ ] No infinite loops
- [ ] Clear user guidance
- [ ] After re-login, can access notifications page

---

### Scenario 14: Mobile Responsiveness

**Objective**: Verify mobile layout

**Steps**:
1. Open DevTools
2. Set viewport to 375px width (iPhone SE)
3. Navigate through all binding flow states

**Expected Results - Mobile Layout**:
- ✅ Hero banner: Full width, readable text
- ✅ Modal: Max 90vh height, scrollable
- ✅ Binding code: Readable monospace font
- ✅ Buttons: Full width, thumb-friendly (min 44px height)
- ✅ Timer: Readable font size
- ✅ Cards: Full width, no horizontal scroll

**Acceptance Criteria**:
- [ ] No horizontal scroll
- [ ] All text readable without zoom
- [ ] Buttons easily tappable
- [ ] No layout breaks

---

### Scenario 15: Accessibility

**Objective**: Verify keyboard navigation and screen reader support

**Steps**:
1. Use Tab key to navigate page
2. Use screen reader (VoiceOver/NVDA) to read content
3. Complete binding flow with keyboard only

**Expected Results - Keyboard Navigation**:
- ✅ All interactive elements reachable via Tab
- ✅ Focus visible (outline/ring)
- ✅ Modal traps focus (Tab cycles within modal)
- ✅ Escape key closes modal

**Expected Results - Screen Reader**:
- ✅ Progress bar announces time remaining
- ✅ Polling status has `aria-live="polite"`
- ✅ Buttons have descriptive labels
- ✅ Form fields have labels

**Acceptance Criteria**:
- [ ] WCAG 2.1 AA compliance
- [ ] No keyboard traps
- [ ] Meaningful ARIA labels

---

## Test Execution Log

### Tester Information
- **Name**: ___________________________
- **Date**: ___________________________
- **Environment**: Dev / Staging / Production
- **Browser**: Chrome / Firefox / Safari / Edge
- **Version**: ___________________________

### Scenario Results

| # | Scenario | Status | Notes |
|---|----------|--------|-------|
| 1 | Initial Page Load | ⬜ Pass / ⬜ Fail | |
| 2 | Start Binding Flow | ⬜ Pass / ⬜ Fail | |
| 3 | Copy Binding Code | ⬜ Pass / ⬜ Fail | |
| 4 | Deep Link | ⬜ Pass / ⬜ Fail | |
| 5 | Complete Binding | ⬜ Pass / ⬜ Fail | |
| 6 | Bound State | ⬜ Pass / ⬜ Fail | |
| 7 | Update Preferences | ⬜ Pass / ⬜ Fail | |
| 8 | Quiet Hours | ⬜ Pass / ⬜ Fail | |
| 9 | Timer Behavior | ⬜ Pass / ⬜ Fail | |
| 10 | Code Expiration | ⬜ Pass / ⬜ Fail | |
| 11 | Unbind | ⬜ Pass / ⬜ Fail | |
| 12 | Binding Failure | ⬜ Pass / ⬜ Fail | |
| 13 | 401 Unauthorized | ⬜ Pass / ⬜ Fail | |
| 14 | Mobile | ⬜ Pass / ⬜ Fail | |
| 15 | Accessibility | ⬜ Pass / ⬜ Fail | |

### Summary
- **Total Scenarios**: 15
- **Passed**: _____ / 15
- **Failed**: _____ / 15
- **Blocker Issues**: _____

---

## Known Issues (Pre-Testing)

### From Code Review
1. **API Client Inconsistency** - Uses raw `fetch` instead of `apiClient` (non-blocking for testing)
2. **Query Keys** - Missing factory pattern (non-blocking for testing)

---

## Bug Report Template

```markdown
## Bug #[NUMBER]: [Short Title]

**Severity**: Critical / High / Medium / Low
**Scenario**: [Scenario number]
**Steps to Reproduce**:
1.
2.
3.

**Expected**:
**Actual**:
**Screenshot**: [Attach if applicable]
**Console Errors**: [Paste if applicable]
**Network**: [Request/response if applicable]
```

---

**Document Version**: 1.0
**Last Updated**: 2025-12-30
**Next Review**: After test execution

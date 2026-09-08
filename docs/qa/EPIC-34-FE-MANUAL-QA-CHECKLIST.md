# Epic 34-FE: Manual QA Testing Checklist

**Epic**: Epic 34-FE - Telegram Notifications UI
**Test Date**: 2025-12-29
**Tester**: [Your Name]
**Environment**: Development (localhost:3100)
**Browser**: Chrome (latest)

---

## 🎯 Test Scope

**Stories to Test**:

- Story 34.1-FE: API client & hooks (7 unit tests already passing)
- Story 34.2-FE: Telegram Binding Flow
- Story 34.3-FE: Notification Preferences Panel
- Story 34.4-FE: Quiet Hours & Timezone
- Story 34.5-FE: Settings Page Layout

**Out of Scope**: Backend API integration (mock data assumed)

---

## 📋 Pre-Test Setup

### Environment Verification

- [ ] Dev server running: `npm run dev` on port 3100
- [ ] Browser: Chrome with DevTools open
- [ ] Screen sizes to test: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
- [ ] Network throttling: OFF (full speed)

### Test Data Preparation

```typescript
// Mock auth state (if needed)
{
  "access_token": "mock_token_12345",
  "cabinet_id": "test_cabinet_001",
  "username": "test_user"
}
```

---

## 🧪 Test Cases

### TC-001: Page Access & Empty State (Story 34.5-FE)

**Objective**: Verify `/settings/notifications` page loads correctly when Telegram NOT bound

**Steps**:

1. Navigate to `http://localhost:3100/settings/notifications`
2. Observe initial page load

**Expected Results**:

- [ ] ✅ Page loads without errors
- [ ] ✅ Hero banner visible with:
  - Light blue gradient background (#E3F2FD → #BBDEFB)
  - Title: "Подключите Telegram для получения уведомлений"
  - 3 feature bullets with icons (✓ Мгновенные уведомления, ✓ Настройка типов, ✓ Тихие часы)
  - CTA button: "Подключить Telegram" (Telegram Blue #0088CC)
- [ ] ✅ Three disabled panels visible:
  - TelegramBindingCard (locked)
  - NotificationPreferencesPanel (locked with 🔒 overlay)
  - QuietHoursPanel (locked with 🔒 overlay)
- [ ] ✅ H1 heading: "📱 Telegram Уведомления"
- [ ] ✅ Vertical stack layout (not grid)
- [ ] ✅ Max-width: 1024px, centered

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-002: Binding Modal Opens (Story 34.2-FE)

**Objective**: Verify binding modal opens when "Подключить Telegram" clicked

**Steps**:

1. From TC-001, click "Подключить Telegram" button (hero banner or card)
2. Observe modal appearance

**Expected Results**:

- [ ] ✅ Modal opens with centered overlay
- [ ] ✅ Backdrop: blurred background (`backdrop-blur-sm`)
- [ ] ✅ Modal width: 480-560px on desktop
- [ ] ✅ Modal title: "Подключение Telegram" (H2, 24px)
- [ ] ✅ Close button (X) in top-right corner
- [ ] ✅ Modal background: White (`bg-white`), not transparent
- [ ] ✅ Content sections visible:
  - "Шаг 1: Откройте бот в Telegram"
  - Verification code display
  - Deep link button
  - Countdown timer
  - Polling indicator

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-003: Binding Code Display (Story 34.2-FE)

**Objective**: Verify binding code is displayed correctly with copy functionality

**Steps**:

1. With modal open (from TC-002)
2. Observe verification code section

**Expected Results**:

- [ ] ✅ Verification code format: `/start ABC123XY` (8-char alphanumeric)
- [ ] ✅ Code displayed in monospace font (`font-mono`)
- [ ] ✅ Code container: Light gray background (`bg-gray-100`)
- [ ] ✅ Copy button visible with icon: "📋 Копировать"
- [ ] ✅ Click copy button → Code copied to clipboard
- [ ] ✅ Toast notification: "Код скопирован" (optional)

**Test Copy Functionality**:

1. Click "📋 Копировать" button
2. Open text editor and paste (Cmd+V / Ctrl+V)
3. Verify pasted text matches: `/start ABC123XY`

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-004: Deep Link Button (Story 34.2-FE)

**Objective**: Verify Telegram deep link button opens correctly

**Steps**:

1. With modal open (from TC-002)
2. Observe deep link button
3. Click button (or inspect URL)

**Expected Results**:

- [ ] ✅ Button text: "📱 Открыть в Telegram"
- [ ] ✅ Button color: Telegram Blue (#0088CC)
- [ ] ✅ Button full-width on mobile
- [ ] ✅ Hover state: Darker blue
- [ ] ✅ Click opens: `https://t.me/Kernel_crypto_bot?start=ABC123XY` in new tab
- [ ] ✅ URL contains binding code from previous step

**Note**: Deep link may not work if Telegram not installed. Verify URL format only.

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-005: Countdown Timer Animation (Story 34.2-FE)

**Objective**: Verify countdown timer displays and updates correctly

**Steps**:

1. With modal open (from TC-002)
2. Observe countdown timer for 10-15 seconds
3. Note color changes

**Expected Results**:

- [ ] ✅ Initial text: "Код действителен ещё: 9:59" (or similar)
- [ ] ✅ Timer counts down every second (9:59 → 9:58 → 9:57)
- [ ] ✅ Progress bar animates smoothly (width decreases)
- [ ] ✅ Progress bar colors:
  - 10:00 - 2:01: Telegram Blue (#0088CC)
  - 2:00 - 0:31: Warning Orange (#FF9800)
  - 0:30 - 0:00: Error Red (#E53935) with pulsation
- [ ] ✅ When expired (0:00): Text changes to "Код истёк. Получите новый код."
- [ ] ✅ Progress bar shows 0% when expired

**Test Color Transitions** (optional):

1. Wait until timer reaches 2:00 → Verify color changes to Orange
2. Wait until timer reaches 0:30 → Verify color changes to Red

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-006: Polling Indicator (Story 34.2-FE)

**Objective**: Verify polling spinner and dynamic text updates

**Steps**:

1. With modal open (from TC-002)
2. Observe polling indicator below countdown timer
3. Wait for text changes (if dynamic text implemented)

**Expected Results**:

- [ ] ✅ Spinner visible (24x24px spinning animation)
- [ ] ✅ Initial text: "Ожидаем подтверждения..."
- [ ] ✅ Spinner animates continuously
- [ ] ✅ Dynamic text updates (optional):
  - 0-5s: "Ожидаем подтверждения..."
  - 5-60s: "Всё ещё ожидаем... Проверьте Telegram."
  - > 60s: "Подтверждение занимает дольше обычного..."

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-007: Modal Close Behavior (Story 34.2-FE)

**Objective**: Verify modal can be closed and state resets

**Steps**:

1. With modal open (from TC-002)
2. Click close button (X) in top-right
3. Re-open modal

**Expected Results**:

- [ ] ✅ Click X button → Modal closes smoothly
- [ ] ✅ ESC key → Modal closes (keyboard accessible)
- [ ] ✅ Click outside modal (backdrop) → Modal closes
- [ ] ✅ Re-open modal → New binding code generated
- [ ] ✅ Countdown timer resets to 10:00

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-008: Notification Preferences Panel - Empty State (Story 34.3-FE)

**Objective**: Verify preferences panel shows when Telegram NOT bound (locked state)

**Steps**:

1. Navigate to `/settings/notifications` (not bound state)
2. Scroll to "⚙️ Настройки уведомлений" card

**Expected Results**:

- [ ] ✅ Card visible but disabled
- [ ] ✅ Lock overlay visible with text: "🔒 Подключите Telegram, чтобы настроить уведомления"
- [ ] ✅ Overlay semi-transparent (allows seeing content below)
- [ ] ✅ All interactive elements disabled (switches, buttons)
- [ ] ✅ 4 event type cards visible (but not clickable):
  - ☑️ Задача выполнена успешно
  - ☐ Задача завершилась с ошибкой
  - ☐ Задача зависла
  - ☑️ Ежедневный дайджест

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-009: Event Type Cards - Enabled State (Story 34.3-FE)

**Objective**: Verify event type cards display correctly when Telegram IS bound

**Prerequisite**: Mock state where `telegram_bound: true` (or complete binding flow)

**Steps**:

1. Set mock state or complete binding
2. Observe event type cards in preferences panel

**Expected Results**:

- [ ] ✅ Lock overlay removed
- [ ] ✅ 4 event type cards interactive
- [ ] ✅ **Enabled card** (task_completed, daily_digest):
  - 2px Telegram Blue border (#0088CC)
  - Checkmark icon (☑️) or filled checkbox
  - Toggle switch ON
  - Light blue background tint (optional)
- [ ] ✅ **Disabled card** (task_failed, task_stalled):
  - 1px Gray 300 border
  - Empty checkbox icon (☐)
  - Toggle switch OFF
  - White background
- [ ] ✅ Event titles visible:
  - "Задача выполнена успешно"
  - "Задача завершилась с ошибкой"
  - "Задача зависла"
  - "Ежедневный дайджест"

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-010: Event Type Toggle Interaction (Story 34.3-FE)

**Objective**: Verify event type toggles respond to clicks

**Prerequisite**: Telegram bound state (from TC-009)

**Steps**:

1. Click on "Задача завершилась с ошибкой" card (anywhere on card)
2. Observe state change
3. Click toggle switch directly
4. Click card again to toggle off

**Expected Results**:

- [ ] ✅ Click card → Toggle switch flips ON
- [ ] ✅ Border changes: Gray → Telegram Blue (2px)
- [ ] ✅ Checkbox icon changes: ☐ → ☑️
- [ ] ✅ Click toggle switch directly → Same behavior
- [ ] ✅ Click again → Toggle OFF, border reverts to Gray
- [ ] ✅ Dirty state indicator appears (⚠️ "У вас есть несохранённые изменения")
- [ ] ✅ "Сохранить настройки" button becomes enabled (not disabled)

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-011: Event Descriptions Always Visible (Story 34.3-FE)

**Objective**: Verify descriptions are always visible (not hidden in tooltips)

**Steps**:

1. Observe all 4 event type cards
2. Read descriptions under each title

**Expected Results**:

- [ ] ✅ Each card shows description text immediately (no hover required)
- [ ] ✅ Descriptions visible:
  - **task_completed**: "Уведомления при завершении импорта, синхронизации, расчёта маржи"
  - **task_failed**: "Уведомления при ошибках после всех попыток retry"
  - **task_stalled**: "Уведомления когда задача выполняется более 30 минут"
  - **daily_digest**: "Сводка за день: успешные, ошибки, задачи в очереди"
- [ ] ✅ Text wraps to max 2 lines with ellipsis (`line-clamp-2`)
- [ ] ✅ Font: 14px regular, Gray 600 color

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-012: Language Switcher (Story 34.3-FE)

**Objective**: Verify language radio buttons work correctly

**Prerequisite**: Telegram bound state

**Steps**:

1. Locate "Язык уведомлений:" section
2. Observe radio buttons
3. Click between 🇷🇺 Русский and 🇬🇧 English

**Expected Results**:

- [ ] ✅ Two radio buttons visible: 🇷🇺 Русский | 🇬🇧 English
- [ ] ✅ Horizontal layout (side-by-side)
- [ ] ✅ Default selected: 🇷🇺 Русский (or based on preferences)
- [ ] ✅ **Selected state**:
  - Telegram Blue border (#0088CC)
  - Light blue background tint
  - Filled radio button
- [ ] ✅ **Unselected state**:
  - Gray 300 border
  - White background
  - Empty radio button
- [ ] ✅ Click 🇬🇧 English → Selection changes
- [ ] ✅ Dirty state indicator appears
- [ ] ✅ Save button becomes enabled

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-013: Daily Digest Conditional Time Picker (Story 34.3-FE)

**Objective**: Verify time picker appears ONLY when daily digest enabled

**Prerequisite**: Telegram bound state

**Steps**:

1. Ensure "Ежедневный дайджест" is OFF
2. Observe card (no time picker visible)
3. Toggle "Ежедневный дайджест" ON
4. Observe time picker appears

**Expected Results**:

- [ ] ✅ When digest OFF: No time picker visible
- [ ] ✅ Toggle digest ON → Time picker slides down (200ms animation)
- [ ] ✅ Time picker label: "🕐 Время отправки:"
- [ ] ✅ Time picker: Native `<input type="time">` (HH:MM format)
- [ ] ✅ Default time: 08:00
- [ ] ✅ Time picker editable (click and change time)
- [ ] ✅ Toggle digest OFF → Time picker slides up (200ms animation)

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-014: Manual Save Strategy ⭐ CRITICAL (Story 34.3-FE)

**Objective**: Verify manual save button works with dirty state detection

**Prerequisite**: Telegram bound state

**Steps**:

1. Load preferences panel (no changes made)
2. Observe "Сохранить настройки" button state
3. Make a change (toggle any event type)
4. Observe dirty state warning
5. Click "Сохранить настройки"
6. Observe state after save

**Expected Results**:

- [ ] ✅ **Initial state**: "Сохранить настройки" button DISABLED (gray)
- [ ] ✅ Make change → Button becomes ENABLED (Primary Red #E53935)
- [ ] ✅ Warning banner appears: "⚠️ У вас есть несохранённые изменения"
- [ ] ✅ Click "Сохранить настройки" → Loading spinner (optional)
- [ ] ✅ Success toast appears: "Настройки сохранены" (3s auto-dismiss)
- [ ] ✅ Warning banner disappears
- [ ] ✅ Button becomes DISABLED again
- [ ] ✅ All changes persisted (verify by refreshing page)

**Test Navigation Prevention**:

1. Make changes without saving
2. Attempt to navigate away (click browser back or another link)
3. **Expected**: Browser shows confirmation dialog: "You have unsaved changes. Leave page?"

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-015: Cancel Button (Story 34.3-FE)

**Objective**: Verify cancel button resets to last saved state

**Prerequisite**: Telegram bound state

**Steps**:

1. Make changes to preferences (toggle 2-3 event types)
2. Observe dirty state
3. Click "Отменить" button
4. Observe state reset

**Expected Results**:

- [ ] ✅ "Отменить" button visible next to "Сохранить настройки"
- [ ] ✅ Button secondary style (not primary)
- [ ] ✅ Click "Отменить" → All changes revert to last saved state
- [ ] ✅ Dirty state warning disappears
- [ ] ✅ "Сохранить настройки" button becomes disabled
- [ ] ✅ No API call made (local state reset only)

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-016: Quiet Hours Panel - Empty State (Story 34.4-FE)

**Objective**: Verify quiet hours panel shows when Telegram NOT bound (locked state)

**Steps**:

1. Navigate to `/settings/notifications` (not bound state)
2. Scroll to "🌙 Тихие часы" card

**Expected Results**:

- [ ] ✅ Card visible but disabled
- [ ] ✅ Lock overlay visible: "🔒 Подключите Telegram, чтобы настроить тихие часы"
- [ ] ✅ All controls disabled (toggle, time pickers, timezone dropdown)
- [ ] ✅ Content visible through overlay

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-017: Quiet Hours Toggle (Story 34.4-FE)

**Objective**: Verify quiet hours can be enabled/disabled

**Prerequisite**: Telegram bound state

**Steps**:

1. Locate "🌙 Тихие часы" card
2. Observe initial state (quiet hours OFF)
3. Toggle "Включить тихие часы" ON
4. Observe time pickers appear

**Expected Results**:

- [ ] ✅ Initial toggle OFF
- [ ] ✅ Time pickers hidden when OFF
- [ ] ✅ Toggle ON → Time pickers slide down (animation)
- [ ] ✅ Two time pickers visible:
  - "С:" (from time)
  - "До:" (to time)
- [ ] ✅ Time pickers native `<input type="time">` (mobile-friendly)
- [ ] ✅ Default values: 23:00 - 07:00 (or similar)
- [ ] ✅ Toggle OFF → Time pickers slide up

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-018: Time Picker Interaction (Story 34.4-FE)

**Objective**: Verify time pickers work with 24-hour format

**Prerequisite**: Quiet hours enabled (from TC-017)

**Steps**:

1. Click "С:" time picker
2. Change time to 22:00
3. Click "До:" time picker
4. Change time to 08:00

**Expected Results**:

- [ ] ✅ Time picker opens native browser picker (desktop) or spinner (mobile)
- [ ] ✅ 24-hour format (HH:MM, not 12-hour AM/PM)
- [ ] ✅ 15-minute step intervals (00, 15, 30, 45)
- [ ] ✅ Width: 120px on desktop, full-width on mobile
- [ ] ✅ Selected time displays in picker
- [ ] ✅ Dirty state indicator appears when changed

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-019: Timezone Dropdown (Story 34.4-FE)

**Objective**: Verify timezone dropdown shows grouped Russian timezones

**Prerequisite**: Quiet hours enabled

**Steps**:

1. Locate timezone dropdown below time pickers
2. Click to open dropdown
3. Observe grouped structure

**Expected Results**:

- [ ] ✅ Label: "Часовой пояс:"
- [ ] ✅ Dropdown uses shadcn/ui Select component
- [ ] ✅ Width: 240px on desktop, full-width on mobile
- [ ] ✅ Default value: Auto-detected (e.g., "Europe/Moscow")
- [ ] ✅ **Grouped structure**:
  - Group 1: "Europe" (Калининград, Москва, Самара)
  - Group 2: "Asia" (Екатеринбург, Владивосток, etc.)
- [ ] ✅ Format: "Москва (GMT+3)" (city + offset)
- [ ] ✅ Total zones: 10-15 popular Russian timezones
- [ ] ✅ Select different timezone → Selection changes
- [ ] ✅ Dirty state indicator appears

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-020: Current Time Preview (Story 34.4-FE)

**Objective**: Verify current time in selected timezone displays and updates

**Prerequisite**: Quiet hours enabled

**Steps**:

1. Observe text below timezone dropdown
2. Wait 60 seconds
3. Verify time updates

**Expected Results**:

- [ ] ✅ Text format: "ℹ️ Сейчас в Europe/Moscow: 14:32"
- [ ] ✅ Font: 14px, Gray 600
- [ ] ✅ Time accurate for selected timezone
- [ ] ✅ Time updates every 60 seconds (wait and verify)
- [ ] ✅ Change timezone → Time updates immediately to new zone

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-021: Overnight Period Visual Hint (Story 34.4-FE)

**Objective**: Verify hint appears when quiet hours span midnight

**Prerequisite**: Quiet hours enabled

**Steps**:

1. Set time range: С: 23:00, До: 07:00 (overnight period)
2. Observe hint banner
3. Change to non-overnight: С: 08:00, До: 18:00
4. Verify hint disappears

**Expected Results**:

- [ ] ✅ **Overnight period (from > to)**: Hint visible
- [ ] ✅ Hint text: "💡 Тихие часы: 23:00 - 07:00 (период через полночь)"
- [ ] ✅ Light Orange background (#FFF3E0)
- [ ] ✅ Orange border (1px)
- [ ] ✅ Lightbulb icon (💡)
- [ ] ✅ **Non-overnight period (from < to)**: Hint NOT visible
- [ ] ✅ Hint appears/disappears dynamically when time changes

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-022: Active Quiet Hours Badge (Story 34.4-FE)

**Objective**: Verify badge appears when current time within quiet hours

**Prerequisite**: Quiet hours enabled with specific time range

**Setup**: Set quiet hours to include current time (e.g., if current time is 15:00, set 14:00 - 16:00)

**Steps**:

1. Configure quiet hours to include current time
2. Save preferences
3. Observe active badge

**Expected Results**:

- [ ] ✅ Badge visible: "🌙 Сейчас активны тихие часы"
- [ ] ✅ Light Blue background (#E3F2FD)
- [ ] ✅ Blue border (1px)
- [ ] ✅ Moon icon (🌙)
- [ ] ✅ Badge updates every 60 seconds
- [ ] ✅ Handles overnight periods correctly (test at midnight if possible)
- [ ] ✅ **When current time NOT in quiet hours**: Badge NOT visible

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-023: Vertical Stack Layout ⭐ CRITICAL (Story 34.5-FE)

**Objective**: Verify page uses vertical stack, NOT grid layout

**Steps**:

1. View `/settings/notifications` page
2. Resize browser window (1920px → 1024px → 768px)

**Expected Results**:

- [ ] ✅ **Desktop (>1024px)**:
  - Cards arranged vertically (one below another)
  - NOT side-by-side grid
  - Max-width: 1024px
  - Centered horizontally
  - 24px spacing between cards
- [ ] ✅ **Tablet (640px - 1024px)**:
  - Still vertical stack
  - 20px spacing between cards
  - Full-width within container
- [ ] ✅ **Mobile (<640px)**:
  - Full-width cards
  - 16px spacing between cards
  - Reduced padding (24px → 16px)

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-024: Mobile Responsive Behavior (Story 34.5-FE)

**Objective**: Verify mobile layout changes (viewport <640px)

**Steps**:

1. Open DevTools → Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
2. Select iPhone 12 Pro (390x844) or custom (375x667)
3. Observe layout changes

**Expected Results**:

- [ ] ✅ H1 title: 36px → 28px (smaller on mobile)
- [ ] ✅ Cards: Full-width (no max-width constraint)
- [ ] ✅ Card padding: 24px → 16px
- [ ] ✅ Spacing between cards: 24px → 16px
- [ ] ✅ Back link: "← Настройки" (instead of full breadcrumbs)
- [ ] ✅ All content remains readable and accessible
- [ ] ✅ No horizontal scrolling
- [ ] ✅ Buttons full-width on mobile (e.g., "Подключить Telegram")

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-025: Accessibility - Keyboard Navigation (WCAG 2.1 AA)

**Objective**: Verify all interactive elements are keyboard accessible

**Steps**:

1. Load page
2. Press TAB repeatedly to navigate through all elements
3. Use SPACE/ENTER to activate elements

**Expected Results**:

- [ ] ✅ TAB key moves focus through all interactive elements in logical order:
  1. "Подключить Telegram" button
  2. Event type toggles (4)
  3. Language radio buttons (2)
  4. Daily digest time picker
  5. Quiet hours toggle
  6. Time pickers (2)
  7. Timezone dropdown
  8. "Сохранить настройки" button
  9. "Отменить" button
- [ ] ✅ Focus indicators visible (blue outline or similar)
- [ ] ✅ SPACE/ENTER activates buttons and toggles
- [ ] ✅ Arrow keys work in dropdowns and radio buttons
- [ ] ✅ ESC key closes modal

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-026: Accessibility - Screen Reader Compatibility (WCAG 2.1 AA)

**Objective**: Verify screen reader announces elements correctly

**Tools**: Chrome DevTools → Accessibility tab, or actual screen reader (NVDA/JAWS)

**Steps**:

1. Open Accessibility tab in DevTools
2. Inspect each component
3. Verify aria-labels and roles

**Expected Results**:

- [ ] ✅ All buttons have aria-labels or descriptive text
- [ ] ✅ Toggle switches: `role="switch"`, `aria-checked="true|false"`
- [ ] ✅ Event type cards: `aria-describedby` linking title to description
- [ ] ✅ Modal: `role="dialog"`, `aria-labelledby`, `aria-describedby`
- [ ] ✅ Form inputs: Associated `<label>` elements
- [ ] ✅ Dynamic content: `aria-live="polite"` for toast notifications
- [ ] ✅ Disabled elements: `aria-disabled="true"`
- [ ] ✅ Headings: Logical hierarchy (H1 → H2 → H3)

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-027: Accessibility - Color Contrast (WCAG 2.1 AA)

**Objective**: Verify sufficient color contrast for text and interactive elements

**Tools**: Chrome DevTools → Inspect element → Contrast ratio

**Steps**:

1. Inspect text elements
2. Check contrast ratios in DevTools

**Expected Results**:

- [ ] ✅ **Normal text** (16px): Contrast ratio ≥ 4.5:1
- [ ] ✅ **Large text** (24px+): Contrast ratio ≥ 3:1
- [ ] ✅ **UI components**: Contrast ratio ≥ 3:1 (borders, icons)
- [ ] ✅ Primary Red (#E53935) on white: Sufficient contrast
- [ ] ✅ Telegram Blue (#0088CC) on white: Sufficient contrast
- [ ] ✅ Gray text (#6B7280) on white: Sufficient contrast

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-028: Browser Console Errors

**Objective**: Verify zero errors and warnings in browser console

**Steps**:

1. Open DevTools → Console tab
2. Navigate to `/settings/notifications`
3. Perform all interactions (open modal, toggle settings, save)
4. Observe console output

**Expected Results**:

- [ ] ✅ Zero JavaScript errors
- [ ] ✅ Zero React errors (hydration, rendering)
- [ ] ✅ Zero TypeScript errors
- [ ] ✅ Zero WCAG accessibility warnings
- [ ] ✅ Zero network errors (404, 500)
- [ ] ✅ All API calls return expected status codes

**Acceptable Warnings**:

- [ ] ⚠️ Development mode warnings (e.g., "Download the React DevTools")
- [ ] ⚠️ Third-party library warnings (if any, document)

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-029: Page Load Performance

**Objective**: Verify page loads within acceptable time

**Steps**:

1. Open DevTools → Network tab
2. Refresh page (Cmd+R / Ctrl+R)
3. Observe load times

**Expected Results**:

- [ ] ✅ **Time to First Byte (TTFB)**: <500ms
- [ ] ✅ **First Contentful Paint (FCP)**: <1.5s
- [ ] ✅ **Largest Contentful Paint (LCP)**: <2.5s
- [ ] ✅ Total page load: <3s
- [ ] ✅ All JavaScript bundles: <500KB total
- [ ] ✅ No render-blocking resources

**Tools**: Lighthouse audit (optional)

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

### TC-030: Cross-Browser Compatibility (Optional)

**Objective**: Verify functionality in multiple browsers

**Browsers to Test**:

- Chrome (primary)
- Firefox (optional)
- Safari (optional)
- Edge (optional)

**Steps**:

1. Open `/settings/notifications` in each browser
2. Perform key flows:
   - Open binding modal
   - Toggle preferences
   - Save settings

**Expected Results**:

- [ ] ✅ All browsers: Page loads correctly
- [ ] ✅ All browsers: Modal opens and closes
- [ ] ✅ All browsers: Toggles work
- [ ] ✅ All browsers: Native time pickers render correctly
- [ ] ✅ All browsers: No console errors

**Actual Results**:
[To be filled by tester]

**Status**: ⬜ PASS / ❌ FAIL

---

## 📊 Test Summary

**Total Test Cases**: 30
**Passed**: [ ] / 30
**Failed**: [ ] / 30
**Blocked**: [ ] / 30
**Pass Rate**: [ ]%

---

## 🐛 Bugs Found

### Bug #1: [Title]

**Severity**: Critical / Major / Minor
**Test Case**: TC-XXX
**Description**: [What went wrong]
**Steps to Reproduce**:

1. [Step 1]
2. [Step 2]

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Screenshots**: [Attach if available]

---

## ✅ QA Sign-Off

**Tester Name**: ___________________
**Date**: 2025-12-29
**Time**: ___________________

**Overall Assessment**:

- [ ] ✅ PASS - Ready for E2E testing
- [ ] ⚠️ CONDITIONAL PASS - Minor issues (document)
- [ ] ❌ FAIL - Critical issues found, requires fixes

**Comments**:
[Additional notes or observations]

---

**Next Step**: Phase 2 - E2E Tests (Playwright)

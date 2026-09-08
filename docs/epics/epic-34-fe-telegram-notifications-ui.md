# Epic 34-FE: Telegram Notifications User Interface

**Epic ID**: Epic 34-FE
**Backend Epic**: Epic 34 (✅ COMPLETE)
**Status**: ✅ **PRODUCTION READY** + 📋 **UX Improvements Awaiting PO Approval** (Updated 2025-12-30)
**Priority**: Medium
**Estimated Effort**: 8 stories, ~25 SP (~8-11 days frontend)

- Original: 6 stories, 21 SP ✅ COMPLETE
- UX Improvements: 2 stories, 4 SP 📋 AWAITING APPROVAL
  **Created**: 2025-12-29
  **Author**: Sarah (PO)
  **Related**: Epic 34 (Backend), Request #73
  **UX Review**: UX Expert Live Review (2025-12-30) - Score: 8.5/10 → 9.5/10 with improvements

**📄 Developer Handoff**: [DEV-HANDOFF-EPIC-34-FE.md](../DEV-HANDOFF-EPIC-34-FE.md)

- [Bot Configuration Guide](../DEV-HANDOFF-EPIC-34-FE.md#-telegram-bot-configuration-urgent-action-required)
- [Monitoring Implementation](../DEV-HANDOFF-EPIC-34-FE.md#-monitoring--analytics-implementation-recommended)
- [Testing & Deployment](../DEV-HANDOFF-EPIC-34-FE.md#testing-status)

---

## 📋 Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [User Stories](#user-stories)
4. [Page Structure](#page-structure)
5. [API Integration](#api-integration)
6. [UX Design Requirements](#ux-design-requirements)
7. [Success Metrics](#success-metrics)
8. [Implementation Order](#implementation-order)

---

## Problem Statement

### Current State

**Backend Status**: ✅ COMPLETE

- Telegram bot integration implemented
- REST API endpoints ready (`/v1/notifications/*`)
- Message templates (ru/en) working
- BullMQ event listener active
- Rate limiting in place

**Frontend Status**: ❌ MISSING

- No UI for Telegram binding
- No settings page for notification preferences
- No visibility of binding status
- Users cannot configure quiet hours, language, or event preferences
- No way to test notifications before real events

### User Impact

**Без UI пользователи НЕ МОГУТ**:

1. Привязать свой Telegram-аккаунт к платформе
2. Настроить, какие события будут отправлять уведомления
3. Установить тихие часы (night mode)
4. Выбрать язык уведомлений (ru/en)
5. Протестировать, работают ли уведомления
6. Отключить уведомления без полной отвязки

### Business Value

| Ценность                      | Описание                                                            |
| ----------------------------- | ------------------------------------------------------------------- |
| **Instant Awareness**         | Мгновенные уведомления о состоянии импортов/синхронизаций           |
| **Reduced Manual Monitoring** | Не нужно постоянно проверять дашборд на наличие ошибок              |
| **Faster Issue Resolution**   | Немедленное оповещение = быстрое реагирование                       |
| **User Engagement**           | Проактивная коммуникация повышает доверие к платформе               |
| **Mobile-First**              | Telegram доступен на всех устройствах без установки доп. приложений |

---

## Solution Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  /settings/notifications                                      │
│    │                                                          │
│    ├─> TelegramBindingCard (Story 34.2-FE)                   │
│    │     • Binding flow modal                                │
│    │     • Status polling (3s interval)                      │
│    │     • Deep link button                                  │
│    │     • Unbind action                                     │
│    │                                                          │
│    ├─> NotificationPreferencesPanel (Story 34.3-FE)          │
│    │     • Event type toggles                                │
│    │     • Language switcher                                 │
│    │     • Daily digest time picker                          │
│    │                                                          │
│    ├─> QuietHoursConfiguration (Story 34.4-FE)               │
│    │     • Quiet hours toggle                                │
│    │     • Time pickers (from/to)                            │
│    │     • Timezone selector                                 │
│    │                                                          │
│    └─> TestNotificationButton                                │
│          • Send test notification                            │
│          • Toast feedback                                    │
│                                                               │
│  Header/Sidebar                                               │
│    └─> BindingStatusIndicator                                │
│          • 🔔 (bound) / 🔕 (not bound)                      │
│          • Tooltip with status                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (/v1/notifications/*)               │
│                                                               │
│  POST /telegram/bind      → Generate binding code            │
│  GET  /telegram/status    → Poll binding status              │
│  DELETE /telegram/unbind  → Remove binding                   │
│  GET  /preferences        → Get settings                     │
│  PUT  /preferences        → Update settings                  │
│  POST /test               → Send test notification           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   [Telegram Bot @Kernel_crypto_bot]
```

### Key Components

| Component                      | Purpose                    | File                               |
| ------------------------------ | -------------------------- | ---------------------------------- |
| `TelegramBindingCard`          | Привязка/отвязка Telegram  | `TelegramBindingCard.tsx`          |
| `NotificationPreferencesPanel` | Настройки событий, язык    | `NotificationPreferencesPanel.tsx` |
| `QuietHoursConfiguration`      | Тихие часы, timezone       | `QuietHoursConfiguration.tsx`      |
| `BindingStatusIndicator`       | Индикатор статуса (header) | `BindingStatusIndicator.tsx`       |
| `TestNotificationButton`       | Тестовое уведомление       | `TestNotificationButton.tsx`       |

### React Query Hooks

| Hook                         | Purpose                 | File                            |
| ---------------------------- | ----------------------- | ------------------------------- |
| `useTelegramBinding`         | Привязка/статус/отвязка | `useTelegramBinding.ts`         |
| `useNotificationPreferences` | CRUD preferences        | `useNotificationPreferences.ts` |
| `useTestNotification`        | Тестовое уведомление    | `useTestNotification.ts`        |

---

## User Stories

### Story 34.1-FE: TypeScript Types & API Client

**Goal**: Создать типобезопасную основу для работы с Telegram API.

**Deliverables**:

- ✅ TypeScript interfaces для всех DTO (Request #73)
- ✅ API client functions в `lib/api/notifications.ts`
- ✅ React Query hooks с правильными типами

**Files**:

- `src/types/notifications.ts` - TypeScript типы
- `src/lib/api/notifications.ts` - API клиент
- `src/hooks/useTelegramBinding.ts` - React Query хуки
- `src/hooks/useNotificationPreferences.ts` - React Query хуки

**Acceptance Criteria**:

1. Все типы из Request #73 определены
2. API client functions покрыты типами
3. TypeScript strict mode без ошибок
4. Zero `any` types (используем `unknown` где нужно)

**Effort**: 2 SP (4-6 часов)

**Technical Notes**:

- Timezone validation через `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Time format validation: `/^([01]\d|2[0-3]):([0-5]\d)$/`
- Language enum: `'ru' | 'en'`

---

### Story 34.2-FE: Telegram Binding Flow

**Goal**: Реализовать процесс привязки Telegram-аккаунта с polling статуса.

**Deliverables**:

- ✅ Modal/Dialog с кодом привязки
- ✅ Deep link кнопка (открывает Telegram)
- ✅ Polling статуса каждые 3 секунды
- ✅ Отображение статуса привязки
- ✅ Кнопка отвязки аккаунта
- ✅ Toast notifications для успеха/ошибок

**User Flow**:

```
1. User clicks "Подключить Telegram" button
2. Modal opens with:
   - Binding code (e.g., "A1B2C3D4")
   - Instructions: "Отправьте /start A1B2C3D4 боту @Kernel_crypto_bot"
   - "Открыть в Telegram" button (deep link)
   - Countdown timer (10 минут)
3. Polling starts (GET /telegram/status каждые 3s)
4. When bound=true:
   - Modal closes
   - Success toast: "Telegram подключен!"
   - Indicator updates to 🔔
5. Alternative: User closes modal → polling stops
```

**Component**: `TelegramBindingCard.tsx`

**Props**:

```typescript
interface TelegramBindingCardProps {
  // No props - uses internal state
}
```

**States**:

- `not_bound` - Показываем кнопку "Подключить Telegram"
- `binding_in_progress` - Modal открыт, показываем код, polling активен
- `bound` - Показываем статус (@username) и кнопку "Отключить"

**Acceptance Criteria**:

1. Кнопка "Подключить Telegram" вызывает `POST /telegram/bind`
2. Modal показывает binding code и deep link
3. Deep link открывает Telegram с `/start <код>`
4. Polling статуса каждые 3 секунды (макс 10 минут)
5. При `bound=true` modal закрывается, показывается success toast
6. Кнопка "Отключить" вызывает `DELETE /telegram/unbind` с подтверждением
7. При закрытии modal polling останавливается

**Effort**: 5 SP (8-12 часов)

**🎨 UX EXPERT INPUT NEEDED**:

- [ ] **Binding Modal Design**: Layout, визуальная иерархия, цветовая схема
- [ ] **Countdown Timer**: Формат отображения, стиль (прогресс-бар или текст?)
- [ ] **Deep Link Button**: Стиль, иконка, расположение
- [ ] **Polling Indicator**: Как показать, что идёт ожидание подключения?
- [ ] **Unbind Confirmation**: Диалог подтверждения или inline?

---

### Story 34.3-FE: Notification Preferences Panel

**Goal**: Панель настроек типов событий, языка и дайджеста.

**Deliverables**:

- ✅ Toggles для event types (task_completed, task_failed, task_stalled, daily_digest)
- ✅ Language switcher (ru/en) с флагами
- ✅ Time picker для daily digest time
- ✅ Auto-save или manual save button
- ✅ Loading states при обновлении

**Component**: `NotificationPreferencesPanel.tsx`

**Props**:

```typescript
interface NotificationPreferencesPanelProps {
  // No props - fetches data internally
}
```

**Event Types Display**:

```
☑️ Задача выполнена успешно (task_completed)
   Уведомления при завершении импорта, синхронизации, расчёта маржи

☑️ Ошибки выполнения задач (task_failed)
   Уведомления при ошибках после всех попыток retry

☐ Задача зависла (task_stalled)
   Уведомления когда задача выполняется более 30 минут

☑️ Ежедневный дайджест (daily_digest)
   Сводка за день: успешные, ошибки, в очереди
   [Время: 08:00 ▼]
```

**Language Switcher**:

```
[🇷🇺 Русский] [🇬🇧 English]
```

**Acceptance Criteria**:

1. Toggles работают (изменение state)
2. Language switcher переключает язык
3. Daily digest time picker (HH:MM format)
4. При изменении digest toggle, time picker появляется/скрывается
5. Save button вызывает `PUT /preferences` с partial update
6. Success toast после сохранения
7. Error handling для validation ошибок

**Effort**: 5 SP (8-12 часов)

**🎨 UX EXPERT INPUT NEEDED**:

- [ ] **Event Type Cards**: Визуальное оформление каждого типа события
- [ ] **Toggle Style**: Switch или checkbox? Цветовая схема
- [ ] **Language Switcher**: Кнопки, dropdown, или radio buttons?
- [ ] **Daily Digest Section**: Отдельная карточка или inline?
- [ ] **Save Strategy**: Auto-save при изменении или manual button?
- [ ] **Descriptions**: Как показать пояснения к каждому типу события?

---

### Story 34.4-FE: Quiet Hours & Timezone Configuration

**Goal**: Настройка тихих часов с выбором timezone.

**Deliverables**:

- ✅ Toggle для включения quiet hours
- ✅ Time pickers для "from" и "to"
- ✅ Timezone selector (IANA timezones)
- ✅ Валидация времени (to > from)
- ✅ Preview текущего времени в выбранном timezone

**Component**: `QuietHoursConfiguration.tsx`

**Props**:

```typescript
interface QuietHoursConfigurationProps {
  // No props - part of preferences
}
```

**Layout**:

```
☑️ Тихие часы
   Уведомления не будут отправляться в заданный период

   С:  [23:00 ▼]  До:  [07:00 ▼]

   Часовой пояс:  [Europe/Moscow ▼]

   ℹ️ Сейчас в Europe/Moscow: 14:32
```

**Timezone Selector Options**:

- Europe/Moscow (по умолчанию)
- Europe/Kaliningrad
- Europe/Samara
- Asia/Yekaterinburg
- Asia/Krasnoyarsk
- Asia/Vladivostok
- (+ other popular timezones)

**Acceptance Criteria**:

1. Toggle включает/выключает quiet hours
2. Time pickers работают (HH:MM format)
3. Timezone dropdown с популярными зонами
4. Validation: "to" время должно быть позже "from" (или overnight logic)
5. Preview показывает текущее время в выбранном timezone
6. Сохранение через общий `PUT /preferences`

**Effort**: 3 SP (5-7 часов)

**🎨 UX EXPERT INPUT NEEDED**:

- [ ] **Time Pickers**: Native HTML time input или custom component?
- [ ] **Timezone Dropdown**: Группировка по регионам? Поиск?
- [ ] **Current Time Preview**: Где разместить, формат отображения?
- [ ] **Overnight Handling**: Как показать "23:00-07:00" визуально?
- [ ] **Visual Feedback**: Как показать активные тихие часы?

---

### Story 34.5-FE: Settings Page Layout & Integration

**Goal**: Интеграция всех компонентов на странице `/settings/notifications`.

**Deliverables**:

- ✅ Page `/settings/notifications`
- ✅ Навигация в sidebar (Settings → Notifications)
- ✅ Binding status indicator в header
- ✅ Test notification button
- ✅ Breadcrumbs (Главная > Настройки > Уведомления)
- ✅ Responsive layout (mobile/tablet)

**Page Layout**:

```
┌────────────────────────────────────────────────────────────┐
│  Главная > Настройки > Уведомления                          │
│                                                              │
│  📱 Telegram Уведомления                                     │
│  ──────────────────────────────────────────────────────────│
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  TelegramBindingCard                                  │  │
│  │  • Status: 🔔 Подключен (@username)                   │  │
│  │  • [Отключить Telegram]                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NotificationPreferencesPanel                         │  │
│  │  • Event type toggles                                 │  │
│  │  • Language switcher                                  │  │
│  │  • Daily digest settings                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  QuietHoursConfiguration                              │  │
│  │  • Quiet hours toggle                                 │  │
│  │  • Time pickers                                       │  │
│  │  • Timezone selector                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [Отправить тестовое уведомление]                           │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

**Binding Status Indicator** (Header/Sidebar):

- 🔔 (green badge) - Telegram подключен
- 🔕 (gray) - Telegram не подключен
- Tooltip: "Telegram: подключен (@username)" или "Нажмите для подключения"
- Click → redirect to `/settings/notifications`

**Acceptance Criteria**:

1. Page доступна по `/settings/notifications`
2. Sidebar link "Уведомления" активна
3. Breadcrumbs корректно отображаются
4. Все компоненты (Stories 34.2-34.4) интегрированы
5. Test notification button внизу страницы
6. Binding status indicator в header с tooltip
7. Responsive layout (320px+)

**Effort**: 3 SP (5-7 часов)

**🎨 UX EXPERT INPUT NEEDED**:

- [ ] **Page Layout**: Расположение компонентов, spacing, визуальная иерархия
- [ ] **Card Design**: Как оформить каждую секцию (borders, shadows, backgrounds)?
- [ ] **Status Indicator**: Иконка, цвет, размер, анимация?
- [ ] **Mobile Layout**: Как адаптировать для мобильных устройств?
- [ ] **Empty State**: Как показать, если Telegram не подключен?

---

### Story 34.6-FE: Testing & Documentation

**Goal**: Обеспечить качество и поддерживаемость кода.

**Deliverables**:

- ✅ Unit tests для hooks (useTelegramBinding, useNotificationPreferences)
- ✅ Component tests для основных компонентов
- ✅ E2E test для binding flow (Playwright)
- ✅ Documentation в README
- ✅ Storybook stories (опционально)

**Test Coverage Goals**:

- Unit Tests: 70%+
- Integration Tests: 30%+
- E2E Tests: Critical flows

**Test Scenarios**:

**Unit Tests** (Vitest):

```typescript
// useTelegramBinding.test.ts
- Should call POST /telegram/bind on startBinding()
- Should poll GET /telegram/status every 3s
- Should stop polling after 10 minutes
- Should call DELETE /telegram/unbind on unbind()

// useNotificationPreferences.test.ts
- Should fetch GET /preferences on mount
- Should call PUT /preferences on update
- Should validate time format (HH:MM)
- Should validate timezone (IANA)
```

**E2E Tests** (Playwright):

```typescript
// telegram-binding.spec.ts
test('Full binding flow', async ({ page }) => {
  // 1. Navigate to /settings/notifications
  // 2. Click "Подключить Telegram"
  // 3. Modal opens with binding code
  // 4. Verify deep link is present
  // 5. Mock binding status to bound=true
  // 6. Verify modal closes
  // 7. Verify success toast
  // 8. Verify status indicator changes to 🔔
});
```

**Documentation**:

- README update с Telegram Notifications section
- API integration guide
- Component props documentation
- Troubleshooting guide

**Acceptance Criteria**:

1. Unit tests passing (≥70% coverage)
2. Component tests для всех основных компонентов
3. E2E test для binding flow
4. README обновлён
5. Все компоненты документированы (JSDoc)

**Effort**: 3 SP (5-7 часов)

---

### Story 34.7-FE: Empty State Hero Banner 🔴 CRITICAL

**Goal**: Implement compelling hero banner for empty state to increase binding conversion from 20% to 48% (+140%).

**UX Expert Priority**: 🔴 **CRITICAL**
**Business Impact**: **+140% conversion rate** (2.4x improvement)

**Problem**:

```
Current empty state (when not bound):
  ℹ️ Telegram не подключен
  Подключите Telegram для получения уведомлений о задачах
  [Подключить Telegram]  ← Small button, low visibility

Result: Only 40% of users click → 20% overall conversion ⚠️
```

**Solution**:

```
Hero Banner (gradient background, rocket icon, benefits list):
╔═════════════════════════════════════════╗
║  🚀 Получайте уведомления в Telegram     ║
║                                         ║
║  ✓ Быстрее email на 80%                 ║
║  ✓ Не пропустите критичные ошибки       ║
║  ✓ Настраиваемый ежедневный дайджест    ║
║                                         ║
║  [Подключить Telegram →] (Large CTA)    ║
╚═════════════════════════════════════════╝

Result: 80% of users click → 48% overall conversion ✅
```

**Deliverables**:

- Gradient background (`from-telegram/5 via-white to-telegram/10`)
- Rocket icon 🚀 (48px, centered)
- 3 benefits list with green checkmarks ✓
- Large primary CTA button (Telegram Blue)
- Decorative blur elements
- Responsive design (desktop/tablet/mobile)

**Component**: `TelegramBindingCard.tsx` (lines 94-113 replacement)

**Tailwind Config Update**: Add Telegram brand colors (`#0088CC`, `#006699`)

**Acceptance Criteria**:

1. Hero banner shows when `isBound === false`
2. Gradient background with border and decorative elements
3. 3 benefits with bold keywords and checkmarks
4. Large CTA button (full-width mobile, auto desktop)
5. Clicking CTA opens `TelegramBindingModal`
6. WCAG 2.1 AA compliant (all text ≥4.5:1 contrast)
7. Responsive (375px to 1680px)

**Effort**: 3 SP (2-3 hours)

**References**:

- Story Doc: `docs/stories/epic-34/story-34.7-fe-empty-state-hero-banner.md`
- UX Review: `docs/code-review/UX-LIVE-REVIEW-EPIC-34-FE-2025-12-30.md` (Issue #1)

---

### Story 34.8-FE: Binding Timestamp Display 🔵 NICE-TO-HAVE

**Goal**: Add timestamp showing when Telegram was connected for context and troubleshooting.

**UX Expert Priority**: 🔵 **LOW** (polish, not critical)
**Business Impact**: ~30% reduction in "When did I bind?" support tickets

**Problem**:

```
Current bound state:
  🔔 Подключен
  @salacoste
  [Отключить Telegram]

Issues:
  - No context about when binding occurred
  - Users ask "When did I connect?" (support tickets)
  - Missing transparency about account state
```

**Solution**:

```
Bound state with timestamp:
  🔔 Подключен
  @salacoste
  Подключено: 29 декабря 2025, 14:30  ← NEW
  [Отключить Telegram]
```

**Deliverables**:

- Timestamp display below username (12px, gray-500)
- Russian date formatting: "DD месяца YYYY, HH:MM"
- `formatBindingDate` helper function using `Intl.DateTimeFormat`
- Conditional rendering (only when `status.bound_at` exists)
- Graceful handling of invalid timestamps

**Component**: `TelegramBindingCard.tsx` (~line 130-134 modification)

**Type Update**: `BindingStatusResponseDto.bound_at?: string`

**Backend Dependency**: ⚠️ Backend must provide `bound_at` field in `/v1/notifications/telegram/status`

**Acceptance Criteria**:

1. Timestamp shows when `bound_at` provided
2. Format: "Подключено: DD месяца YYYY, HH:MM"
3. Russian locale (`ru-RU`)
4. Handles invalid timestamps gracefully ("Дата неизвестна")
5. WCAG 2.1 AA contrast (gray-500 on white = 4.6:1)

**Effort**: 1 SP (30-60 minutes)

**References**:

- Story Doc: `docs/stories/epic-34/story-34.8-fe-binding-timestamp-display.md`
- UX Review: `docs/code-review/UX-LIVE-REVIEW-EPIC-34-FE-2025-12-30.md` (Issue #4)

---

## Page Structure

### `/settings/notifications` - Main Settings Page

**Route**: `/app/(dashboard)/settings/notifications/page.tsx`

**Components Hierarchy**:

```
page.tsx
  └─> SettingsLayout
        ├─> Breadcrumbs
        ├─> PageHeader
        │     └─> "Telegram Уведомления"
        ├─> TelegramBindingCard (Story 34.2)
        ├─> NotificationPreferencesPanel (Story 34.3)
        ├─> QuietHoursConfiguration (Story 34.4)
        └─> TestNotificationButton
```

### Sidebar Navigation

**Add to Sidebar**:

```
Settings
  └─> Уведомления 🔔
```

### Header Integration

**Status Indicator**:

```typescript
// In Header component
<BindingStatusIndicator />
  // Shows: 🔔 (bound) or 🔕 (not bound)
  // Tooltip: "Telegram: подключен (@username)"
  // Click: Navigate to /settings/notifications
```

---

## API Integration

### Endpoints Summary

| Endpoint                            | Method | Purpose               | Hook                                       |
| ----------------------------------- | ------ | --------------------- | ------------------------------------------ |
| `/v1/notifications/telegram/bind`   | POST   | Generate binding code | `useTelegramBinding.startBinding()`        |
| `/v1/notifications/telegram/status` | GET    | Poll binding status   | `useTelegramBinding.status` (auto-refetch) |
| `/v1/notifications/telegram/unbind` | DELETE | Remove binding        | `useTelegramBinding.unbind()`              |
| `/v1/notifications/preferences`     | GET    | Get preferences       | `useNotificationPreferences.data`          |
| `/v1/notifications/preferences`     | PUT    | Update preferences    | `useNotificationPreferences.update()`      |
| `/v1/notifications/test`            | POST   | Test notification     | `useTestNotification.send()`               |

### React Query Hooks Design

#### `useTelegramBinding()`

```typescript
// src/hooks/useTelegramBinding.ts
export function useTelegramBinding() {
  // GET /telegram/status
  const { data: status, refetch } = useQuery({
    queryKey: ['telegram-status'],
    queryFn: () => notificationsApi.getBindingStatus(),
    refetchInterval: (data) => {
      // Poll every 3s if binding in progress
      return data?.bound ? false : 3000;
    },
  });

  // POST /telegram/bind
  const startBinding = useMutation({
    mutationFn: () => notificationsApi.startBinding(),
    onSuccess: () => {
      // Start polling
      refetch();
    },
  });

  // DELETE /telegram/unbind
  const unbind = useMutation({
    mutationFn: () => notificationsApi.unbind(),
    onSuccess: () => {
      queryClient.invalidateQueries(['telegram-status']);
    },
  });

  return {
    status: status?.bound ?? false,
    username: status?.telegram_username,
    startBinding: startBinding.mutateAsync,
    unbind: unbind.mutateAsync,
    isLoading: startBinding.isPending || unbind.isPending,
  };
}
```

#### `useNotificationPreferences()`

```typescript
// src/hooks/useNotificationPreferences.ts
export function useNotificationPreferences() {
  // GET /preferences
  const { data, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => notificationsApi.getPreferences(),
  });

  // PUT /preferences
  const update = useMutation({
    mutationFn: (dto: UpdateNotificationPreferencesDto) =>
      notificationsApi.updatePreferences(dto),
    onSuccess: () => {
      queryClient.invalidateQueries(['notification-preferences']);
      toast.success('Настройки сохранены');
    },
  });

  return {
    preferences: data,
    isLoading,
    update: update.mutateAsync,
  };
}
```

#### `useTestNotification()`

```typescript
// src/hooks/useTestNotification.ts
export function useTestNotification() {
  const send = useMutation({
    mutationFn: () => notificationsApi.sendTestNotification(),
    onSuccess: (data) => {
      if (data.sent) {
        toast.success('Тестовое уведомление отправлено в Telegram');
      } else {
        toast.error(`Ошибка: ${data.message}`);
      }
    },
    onError: (error) => {
      toast.error('Telegram не подключен');
    },
  });

  return {
    send: send.mutateAsync,
    isSending: send.isPending,
  };
}
```

---

## UX Design Requirements

### Color Scheme

**Telegram Brand Colors**:

- Primary Blue: `#0088CC` (Telegram brand)
- Success Green: `#22C55E` (bound status)
- Gray: `#9CA3AF` (not bound status)

**Status Indicators**:

- 🔔 Bound: Green badge
- 🔕 Not Bound: Gray icon
- ⏳ Binding in Progress: Blue spinner

### Typography

- Page Title: H1 (32px, bold)
- Section Headers: H2 (24px, semi-bold)
- Event Type Labels: 16px, regular
- Descriptions: 14px, gray-600

### Spacing

- Page padding: 24px
- Card spacing: 16px between cards
- Toggle spacing: 12px between items
- Button spacing: 8px between buttons

### Interactive Elements

**Toggles**:

- Use shadcn/ui Switch component
- Blue when enabled, gray when disabled
- Smooth animation (200ms)

**Buttons**:

- Primary: Blue background (Telegram brand)
- Secondary: Gray outline
- Danger: Red for unbind action

**Time Pickers**:

- Native HTML5 time input (mobile-friendly)
- Fallback to custom component if needed

### Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation for all toggles
- Screen reader support
- Focus indicators
- Aria labels for status indicators

---

## 🎨 UX EXPERT: Design Questions Checklist

### Story 34.2-FE: Binding Flow

- [ ] **Q1**: Binding modal - центрированный overlay или side panel?
- [ ] **Q2**: Countdown timer - прогресс-бар, текстовый счётчик, или оба?
- [ ] **Q3**: Deep link button - стиль, иконка (Telegram logo?), расположение?
- [ ] **Q4**: Polling indicator - spinner, pulse animation, или текст "Ожидание..."?
- [ ] **Q5**: Unbind confirmation - inline alert или отдельный dialog?

### Story 34.3-FE: Preferences Panel

- [ ] **Q6**: Event type cards - как визуально отличить включенные от выключенных?
- [ ] **Q7**: Descriptions - expandable sections, tooltips, или всегда видимы?
- [ ] **Q8**: Language switcher - radio buttons, tabs, или dropdown?
- [ ] **Q9**: Daily digest section - отдельная карточка или inline с другими event types?
- [ ] **Q10**: Save strategy - auto-save (debounced) или manual "Сохранить" button?

### Story 34.4-FE: Quiet Hours

- [ ] **Q11**: Time pickers - native HTML или custom styled component?
- [ ] **Q12**: Timezone dropdown - группировка по регионам? Поиск? Популярные сверху?
- [ ] **Q13**: Current time preview - где показать (tooltip, inline text, отдельная строка)?
- [ ] **Q14**: Overnight visual - как показать "23:00-07:00" (пересекает полночь)?
- [ ] **Q15**: Active quiet hours indicator - как показать, что СЕЙЧАС тихие часы?

### Story 34.5-FE: Page Layout

- [ ] **Q16**: Card layout - вертикальный stack или grid (2 columns на desktop)?
- [ ] **Q17**: Spacing - сколько пикселей между секциями?
- [ ] **Q18**: Mobile layout - все карточки collapse или какие-то остаются expanded?
- [ ] **Q19**: Empty state - что показать, если Telegram не подключен (hero banner, inline hint)?
- [ ] **Q20**: Status indicator в header - размер иконки, цвет badge, анимация при hover?

### General Design

- [ ] **Q21**: Локализация UI - где взять переводы для элементов (кнопки, labels)?
- [ ] **Q22**: Error states - как показать ошибки (toast, inline alert, modal)?
- [ ] **Q23**: Loading states - скелетоны, spinners, или disabled states?
- [ ] **Q24**: Success feedback - только toast или дополнительные визуальные эффекты?
- [ ] **Q25**: Responsive breakpoints - mobile (<640px), tablet (640-1024px), desktop (>1024px)?

---

## Success Metrics

### Adoption Metrics

| Metric              | Target               | Measurement                          |
| ------------------- | -------------------- | ------------------------------------ |
| Binding rate        | >30% of active users | Track `telegram_user_bindings` table |
| Successful bindings | >95% success rate    | Track binding attempts vs completed  |
| Settings changes    | >50% users customize | Track `PUT /preferences` calls       |

### Engagement Metrics

| Metric                  | Target                    | Measurement                               |
| ----------------------- | ------------------------- | ----------------------------------------- |
| Page visits             | >20% of active users/week | Track `/settings/notifications` pageviews |
| Test notifications sent | >10% users test           | Track `POST /test` calls                  |
| Unbind rate             | <5%                       | Track `DELETE /unbind` calls              |

### Quality Metrics

| Metric                       | Target     | Measurement                         |
| ---------------------------- | ---------- | ----------------------------------- |
| Polling latency              | <500ms p95 | Track API response times            |
| Binding completion time      | <60s p95   | Track time from bind → status=bound |
| Settings update success rate | >99%       | Track failed PUT requests           |

---

## Implementation Order

**Recommended sequence**:

1. **Story 34.1-FE** (Types & API) - Foundation (2 SP) ✅ COMPLETE
2. **Story 34.2-FE** (Binding Flow) - Core functionality (5 SP) ✅ COMPLETE
3. **Story 34.3-FE** (Preferences Panel) - Main settings (5 SP) ✅ COMPLETE
4. **Story 34.4-FE** (Quiet Hours) - Advanced settings (3 SP) ✅ COMPLETE
5. **Story 34.5-FE** (Page Layout) - Integration (3 SP) ✅ COMPLETE
6. **Story 34.6-FE** (Testing & Docs) - Quality (3 SP) ✅ COMPLETE
7. **Story 34.7-FE** (Empty State Hero Banner) - **UX Improvement** (3 SP) 🔴 CRITICAL - **+140% conversion**
8. **Story 34.8-FE** (Binding Timestamp Display) - UX Polish (1 SP) 🔵 NICE-TO-HAVE

**Original Total**: 21 SP (~7-10 days frontend) ✅ COMPLETE
**UX Improvements Total**: 4 SP (~3-4 hours) 📋 AWAITING PO APPROVAL

### Sprint Planning

**Sprint 1 (10 SP)** - ✅ COMPLETE:

- Story 34.1-FE (2 SP)
- Story 34.2-FE (5 SP)
- Story 34.3-FE (3 SP из 5 SP - base implementation)

**Sprint 2 (11 SP)** - ✅ COMPLETE:

- Story 34.3-FE (2 SP - polish & edge cases)
- Story 34.4-FE (3 SP)
- Story 34.5-FE (3 SP)
- Story 34.6-FE (3 SP)

**Sprint 3 (UX Improvements - 4 SP)** - 📋 PLANNED:

- Story 34.7-FE (3 SP) - 🔴 **HIGH PRIORITY**: Hero banner (2.4x ROI)
- Story 34.8-FE (1 SP) - 🔵 **LOW PRIORITY**: Timestamp display (polish)

### UX Expert Review (2025-12-30)

**Overall Score**: 8.5/10 → **9.5/10** (with improvements)

**UX Expert Findings**:

- ✅ **Issue #2 (Save Feedback)**: ALREADY IMPLEMENTED (spinner + toast)
- ✅ **Issue #3 (Unbind Confirmation)**: ALREADY IMPLEMENTED (AlertDialog)
- ❌ **Issue #1 (Hero Banner)**: MISSING - 🔴 CRITICAL (Story 34.7-FE)
- ❌ **Binding Timestamp**: MISSING - 🔵 NICE-TO-HAVE (Story 34.8-FE)

**Business Impact**: Hero banner increases binding conversion from **20% → 48%** (+140% lift)

**References**:

- UX Review: `docs/code-review/UX-LIVE-REVIEW-EPIC-34-FE-2025-12-30.md`
- Implementation Plan: `docs/implementation-plans/epic-34-fe-ux-improvements-plan.md`

---

## Dependencies

### Required Before Implementation

- ✅ Epic 34 (Backend) - COMPLETE
- ✅ Request #73 API documentation - COMPLETE
- ⏳ UX Expert design review - PENDING
- ⏳ Wireframes/mockups - PENDING

### External Dependencies

- `telegraf` - Backend bot framework (уже установлен)
- `@tanstack/react-query` - Frontend data fetching (уже используется)
- shadcn/ui components: Switch, Dialog, Select, TimePicker

### Affected Files

- `src/app/(dashboard)/settings/notifications/page.tsx` - NEW
- `src/components/custom/TelegramBindingCard.tsx` - NEW
- `src/components/custom/NotificationPreferencesPanel.tsx` - NEW
- `src/components/custom/QuietHoursConfiguration.tsx` - NEW
- `src/components/custom/BindingStatusIndicator.tsx` - NEW
- `src/hooks/useTelegramBinding.ts` - NEW
- `src/hooks/useNotificationPreferences.ts` - NEW
- `src/types/notifications.ts` - NEW
- `src/lib/api/notifications.ts` - NEW

---

## Risk Assessment

| Risk                       | Likelihood | Impact | Mitigation                                     |
| -------------------------- | ---------- | ------ | ---------------------------------------------- |
| UX design delays           | Medium     | Medium | Start with basic UI, iterate based on feedback |
| Polling performance impact | Low        | Low    | 3s interval is safe, stop after 10 min         |
| Timezone complexity        | Medium     | Low    | Use Intl API, test popular timezones           |
| Mobile binding flow        | Medium     | Medium | Deep link works on mobile, test thoroughly     |
| User confusion on binding  | Low        | Medium | Clear instructions, video tutorial (optional)  |

---

## Security Considerations

### Data Privacy

- No phone numbers stored (only telegram_id, chat_id)
- Binding codes expire in 10 minutes
- User can unbind anytime
- Notification messages don't contain sensitive financial data

### Client-Side Security

- No storage of binding codes after use
- Polling stops after modal close
- HTTPS-only for API calls
- JWT authentication required for all requests

---

## Related Documentation

### Backend

- [TELEGRAM-NOTIFICATIONS-GUIDE.md](../../../docs/TELEGRAM-NOTIFICATIONS-GUIDE.md)
- [Request #73: Telegram Notifications API](../request-backend/73-telegram-notifications-epic-34.md)
- [Epic 34 (Backend)](../../../docs/epics/epic-34-telegram-notifications.md)

### Frontend Implementation (✅ COMPLETE)

- **[Developer Handoff](../DEV-HANDOFF-EPIC-34-FE.md)** - Production readiness guide
  - [Bot Configuration](../DEV-HANDOFF-EPIC-34-FE.md#-telegram-bot-configuration-urgent-action-required) - Update bot username
  - [Monitoring Setup](../DEV-HANDOFF-EPIC-34-FE.md#-monitoring--analytics-implementation-recommended) - Analytics implementation
  - [Testing Guide](../DEV-HANDOFF-EPIC-34-FE.md#testing-status) - E2E & Manual QA
  - [Deployment Checklist](../DEV-HANDOFF-EPIC-34-FE.md#-final-notes) - Production deployment
- [API Integration Guide](../API-INTEGRATION-GUIDE-EPIC-34-FE.md) - Backend team reference
- [CHANGELOG](../CHANGELOG-EPIC-34-FE.md) - Complete implementation history
- [QA Summary](../qa/EPIC-34-FE-QA-SUMMARY.md) - Final QA report
- [Manual QA Checklist](../qa/EPIC-34-FE-MANUAL-QA-CHECKLIST.md) - 30 test cases
- [E2E Testing Guide](../qa/E2E-TESTING-GUIDE.md) - Playwright setup

### Architecture & Standards

- [Frontend Architecture](../front-end-architecture.md)
- [Component Standards](../front-end-spec.md)

---

**Last Updated**: 2025-12-30 (Implementation Complete)
**Status**: ✅ **PRODUCTION READY** - Awaiting bot config + monitoring
**Author**: Sarah (PO)
**Completed**:

1. ✅ All 6 stories implemented (21 SP)
2. ✅ Manual QA: 30/30 test cases passed
3. ✅ E2E tests ready (Playwright)
4. ✅ WCAG 2.1 AA compliance verified
5. ✅ Developer handoff document complete

**Pending**:

1. ⏳ Update Telegram bot username to `@Kernel_crypto_bot` (already done in code)
2. ⏳ Implement monitoring system (2-3h, see [Handoff Guide](../DEV-HANDOFF-EPIC-34-FE.md#-monitoring--analytics-implementation-recommended))
3. ⏳ Run E2E tests on staging (1h)
4. ⏳ Production deployment

# Epic 34-FE: UX Expert Requirements & Design Questions

**Date**: 2025-12-29
**Epic**: Epic 34-FE - Telegram Notifications UI
**UX Expert**: [To be assigned]
**Status**: 📋 Awaiting Design

---

## 📋 Overview

Вам необходимо подготовить дизайн для **страницы настроек Telegram-уведомлений** (`/settings/notifications`).

**Контекст**:

- Бэкенд API готов (Epic 34 ✅ COMPLETE)
- Пользователи смогут подключить Telegram и настроить уведомления о задачах
- Основная аудитория: продавцы на Wildberries (русскоязычные, мобильные устройства)

**Цель**: Создать интуитивный интерфейс для:

1. Привязки Telegram-аккаунта (процесс с кодом верификации)
2. Настройки типов уведомлений (успех, ошибки, дайджест)
3. Конфигурации тихих часов и языка сообщений

---

## 🎨 Design Deliverables

### Required

1. **Binding Flow Wireframes** (Story 34.2-FE)
   - Modal/Dialog для процесса привязки
   - Состояния: не подключен → ввод кода → ожидание → подключен
   - Mobile + Desktop layouts

2. **Notification Preferences Panel** (Story 34.3-FE)
   - Event type toggles (4 типа)
   - Language switcher (ru/en)
   - Daily digest time picker
   - Mobile + Desktop layouts

3. **Quiet Hours Configuration** (Story 34.4-FE)
   - Time pickers (from/to)
   - Timezone selector
   - Current time preview
   - Mobile + Desktop layouts

4. **Full Page Layout** (Story 34.5-FE)
   - Complete `/settings/notifications` page
   - Component arrangement
   - Spacing, typography, colors
   - Responsive breakpoints

5. **Status Indicator** (Header/Sidebar)
   - Binding status icon
   - Tooltip design
   - Animation states

### Optional (Nice to Have)

- **Interactive Prototype** (Figma, Adobe XD)
- **Component States** (hover, active, disabled, error)
- **Dark Mode** (если применимо)
- **Accessibility Annotations** (WCAG guidelines)

---

## 🎯 Design Constraints

### Brand Identity

**Existing Design System**:

- **Primary Color**: Red `#E53935` (WB Repricer brand)
- **Telegram Brand**: Blue `#0088CC` (use for Telegram-specific elements)
- **Typography**: System default (см. `docs/front-end-spec.md`)
- **Component Library**: shadcn/ui

**Color Palette for Notifications**:

```
Success:  #22C55E (green)
Error:    #EF4444 (red)
Warning:  #F59E0B (yellow)
Info:     #0088CC (telegram blue)
Neutral:  #9CA3AF (gray)
```

### Technical Constraints

- **Component Library**: shadcn/ui (Switch, Dialog, Select, Button, etc.)
- **Responsive Breakpoints**:
  - Mobile: <640px
  - Tablet: 640-1024px
  - Desktop: >1024px
- **Accessibility**: WCAG 2.1 AA
- **Supported Browsers**: Modern browsers (Chrome, Safari, Firefox, Edge)

---

## 🔍 Design Questions (25 вопросов)

### Story 34.2-FE: Telegram Binding Flow

#### Q1: Modal Layout

**Вопрос**: Как показать процесс привязки Telegram?
**Опции**:

- A) Центрированный modal overlay (стандартный Dialog)
- B) Side panel справа (slide-in drawer)
- C) Full-page overlay
  **Рекомендация PO**: Modal overlay (более привычен для пользователей)
  **Ваше решение**: _______

#### Q2: Countdown Timer

**Вопрос**: Как визуализировать 10-минутный countdown для кода верификации?
**Опции**:

- A) Текстовый счётчик: "Код действителен ещё 9:45"
- B) Круговой прогресс-бар (radial progress)
- C) Линейный прогресс-бар
- D) Комбинация: прогресс-бар + текст
  **Рекомендация PO**: Текст + линейный прогресс-бар (наиболее информативно)
  **Ваше решение**: _______

#### Q3: Deep Link Button

**Вопрос**: Как оформить кнопку "Открыть в Telegram"?
**Требования**:

- Должна быть primary action в modal
- Иконка Telegram logo?
- Текст кнопки: "Открыть в Telegram" или "Перейти в бот"?
  **Mockup needed**: Да
  **Ваше решение**: _______

#### Q4: Polling Indicator

**Вопрос**: Как показать, что идёт ожидание подтверждения от Telegram?
**Опции**:

- A) Spinner + текст "Ожидаем подтверждения..."
- B) Pulse animation на коде верификации
- C) Progress bar с animated dots
- D) Static text только
  **Рекомендация PO**: Spinner + текст (clear feedback)
  **Ваше решение**: _______

#### Q5: Unbind Confirmation

**Вопрос**: Как показать подтверждение отключения Telegram?
**Опции**:

- A) Inline alert с кнопками "Отменить" / "Отключить"
- B) Отдельный confirmation dialog
- C) Toast notification с undo action
  **Важно**: Отключение - необратимое действие, требует внимания
  **Ваше решение**: _______

---

### Story 34.3-FE: Notification Preferences Panel

#### Q6: Event Type Cards

**Вопрос**: Как визуально показать включенные vs выключенные типы событий?
**Требования**:

- 4 типа событий (task_completed, task_failed, task_stalled, daily_digest)
- Каждый тип имеет название, описание, toggle
  **Опции**:
- A) Карточки с разным background (зелёный = вкл, серый = выкл)
- B) Border highlight для включенных
- C) Только изменение цвета toggle switch
  **Mockup needed**: Да
  **Ваше решение**: _______

#### Q7: Event Descriptions

**Вопрос**: Как показать пояснения к каждому типу события?
**Примеры описаний**:

- "task_completed": "Уведомления при завершении импорта, синхронизации, расчёта маржи"
- "task_failed": "Уведомления при ошибках после всех попыток retry"
  **Опции**:
- A) Всегда видимые (текст под заголовком)
- B) Tooltips (hover/click)
- C) Expandable sections (accordion)
  **Рекомендация PO**: Всегда видимые (mobile-friendly, no hidden info)
  **Ваше решение**: _______

#### Q8: Language Switcher

**Вопрос**: Как показать переключатель языка уведомлений (ru/en)?
**Опции**:

- A) Radio buttons с флагами: [🇷🇺 Русский] [🇬🇧 English]
- B) Dropdown select
- C) Toggle switch с флагом и названием
- D) Tabs
  **Важно**: Это НЕ язык интерфейса, а язык Telegram-сообщений
  **Ваше решение**: _______

#### Q9: Daily Digest Section

**Вопрос**: Как показать настройки ежедневного дайджеста?
**Требования**:

- Toggle "daily_digest"
- Time picker "digest_time" (появляется только если digest включен)
  **Опции**:
- A) Отдельная карточка (визуально отделена от остальных event types)
- B) Inline с другими event types, но time picker показывается conditionally
- C) Expandable section под toggle
  **Ваше решение**: _______

#### Q10: Save Strategy

**Вопрос**: Когда сохранять изменения настроек?
**Опции**:

- A) Auto-save при каждом изменении (с debounce 500ms)
- B) Manual save button внизу страницы "Сохранить настройки"
- C) Both: auto-save + manual button для явного контроля
  **Плюсы auto-save**: UX как в современных приложениях
  **Плюсы manual**: явный контроль, можно отменить
  **Рекомендация PO**: Manual button (пользователь контролирует изменения)
  **Ваше решение**: _______

---

### Story 34.4-FE: Quiet Hours Configuration

#### Q11: Time Pickers

**Вопрос**: Какой time picker использовать?
**Опции**:

- A) Native HTML `<input type="time">` (работает на мобильных)
- B) Custom styled dropdown с часами/минутами
- C) shadcn/ui TimePicker component (если есть)
  **Важно**: Mobile-friendly, touch-friendly
  **Рекомендация PO**: Native HTML (проще, работает везде)
  **Ваше решение**: _______

#### Q12: Timezone Dropdown

**Вопрос**: Как показать выбор timezone?
**Требования**:

- ~10-15 популярных IANA timezones (Europe/Moscow, Europe/Kaliningrad, etc.)
- Группировка по регионам?
- Поиск?
  **Опции**:
- A) Simple dropdown без группировки
- B) Grouped dropdown (Europe, Asia, etc.)
- C) Searchable dropdown (react-select style)
  **Рекомендация PO**: Grouped dropdown (удобно для навигации)
  **Ваше решение**: _______

#### Q13: Current Time Preview

**Вопрос**: Где показать текущее время в выбранном timezone?
**Пример**: "Сейчас в Europe/Moscow: 14:32"
**Опции**:

- A) Inline text под timezone dropdown
- B) Tooltip на timezone dropdown (hover)
- C) Отдельная строка с иконкой часов
  **Рекомендация PO**: Inline text (всегда видимо, помогает пользователю)
  **Ваше решение**: _______

#### Q14: Overnight Quiet Hours Visual

**Вопрос**: Как визуально показать "overnight" quiet hours (например, 23:00-07:00)?
**Требования**:

- Пользователь может установить from=23:00, to=07:00 (пересекает полночь)
  **Опции**:
- A) Просто показать "23:00 - 07:00" (пользователь понимает)
- B) Добавить hint: "Тихие часы: 23:00 - 07:00 (через полночь)"
- C) Visual timeline с highlighted quiet period
  **Ваше решение**: _______

#### Q15: Active Quiet Hours Indicator

**Вопрос**: Как показать, что СЕЙЧАС активны тихие часы?
**Сценарий**: Пользователь открывает настройки в 02:00, quiet hours = 23:00-07:00
**Опции**:

- A) Badge "Сейчас активны тихие часы" с иконкой 🌙
- B) Yellow highlight на time pickers
- C) Не показывать (информация в tooltip)
  **Ваше решение**: _______

---

### Story 34.5-FE: Settings Page Layout

#### Q16: Card Layout

**Вопрос**: Как расположить компоненты на странице?
**Компоненты**:

1. TelegramBindingCard
2. NotificationPreferencesPanel
3. QuietHoursConfiguration
4. TestNotificationButton

**Опции**:

- A) Вертикальный stack (один под другим)
- B) Grid 2 columns на desktop (например, Binding слева, Preferences справа)
- C) Tabs (каждый компонент = отдельная вкладка)
  **Рекомендация PO**: Вертикальный stack (проще для мобильных)
  **Ваше решение**: _______

#### Q17: Spacing

**Вопрос**: Сколько пикселей между секциями?
**Требования**:

- Page padding
- Card spacing
- Section spacing внутри карточек
  **Рекомендация PO**: Использовать spacing scale из Tailwind (16px, 24px)
  **Ваше решение**: _______

#### Q18: Mobile Layout

**Вопрос**: Как адаптировать для мобильных (<640px)?
**Требования**:

- Все карточки должны быть видны
- Time pickers должны работать на тач-экранах
  **Опции**:
- A) Все карточки expandable (collapsed by default)
- B) Все карточки expanded (scroll вниз)
- C) Accordion (одна карточка expanded at a time)
  **Рекомендация PO**: Expanded (проще навигация, no hidden content)
  **Ваше решение**: _______

#### Q19: Empty State

**Вопрос**: Что показать, если Telegram не подключен?
**Сценарий**: Пользователь первый раз заходит на `/settings/notifications`
**Опции**:

- A) Hero banner с CTA "Подключить Telegram" + пояснение зачем
- B) Inline hint в TelegramBindingCard
- C) Empty state placeholder (иллюстрация + текст)
  **Рекомендация PO**: Hero banner (привлекает внимание, объясняет ценность)
  **Mockup needed**: Да
  **Ваше решение**: _______

#### Q20: Status Indicator (Header)

**Вопрос**: Как показать статус привязки Telegram в header/sidebar?
**Требования**:

- Должен быть виден на всех страницах
- Click → navigate to `/settings/notifications`
  **Опции**:
- A) Иконка 🔔 (bound) / 🔕 (not bound) с badge
- B) Text link "Telegram" с цветным индикатором
- C) Avatar-style icon с tooltip
  **Mockup needed**: Да
  **Ваше решение**: _______

---

### General Design Questions

#### Q21: UI Локализация

**Вопрос**: Откуда взять переводы для UI элементов (labels, buttons)?
**Требования**:

- Основной язык интерфейса: русский
- Английский - опционально (для будущего)
  **Рекомендация PO**: Пока только русский, английские переводы можем добавить позже
  **Ваше решение**: _______

#### Q22: Error States

**Вопрос**: Как показать ошибки?
**Примеры ошибок**:

- API call failed
- Validation error (invalid time format)
- Binding code expired
  **Опции**:
- A) Toast notifications только
- B) Inline alert под полем с ошибкой
- C) Both: toast + inline alert для validation
  **Рекомендация PO**: Toast для API errors, inline для validation
  **Ваше решение**: _______

#### Q23: Loading States

**Вопрос**: Как показать loading states?
**Сценарии**:

- Fetching preferences (GET /preferences)
- Updating preferences (PUT /preferences)
- Starting binding (POST /bind)
  **Опции**:
- A) Skeleton loaders для всей страницы
- B) Spinners на кнопках (при сохранении)
- C) Disabled states + overlay spinner
  **Рекомендация PO**: Skeleton для initial load, button spinners для mutations
  **Ваше решение**: _______

#### Q24: Success Feedback

**Вопрос**: Как показать успешное сохранение?
**Сценарии**:

- Preferences saved
- Telegram connected
- Test notification sent
  **Опции**:
- A) Toast notification только
- B) Toast + checkmark animation на кнопке
- C) Toast + green highlight flash на изменённых полях
  **Рекомендация PO**: Toast + checkmark на кнопке (двойной feedback)
  **Ваше решение**: _______

#### Q25: Responsive Breakpoints

**Вопрос**: Какие breakpoints использовать?
**Предложение**:

- Mobile: <640px
- Tablet: 640-1024px
- Desktop: >1024px
  **Требования**:
- Mobile: все компоненты стакаются вертикально
- Tablet: возможно 2 columns для некоторых секций
- Desktop: full layout с sidebar
  **Ваше решение**: _______

---

## 📐 Wireframe Guidelines

### Binding Flow (Story 34.2-FE)

**Initial State (Not Bound)**:

```
┌──────────────────────────────────────────┐
│  📱 Telegram Уведомления                  │
│  ────────────────────────────────────────│
│                                           │
│  Статус: 🔕 Не подключен                  │
│                                           │
│  Получайте мгновенные уведомления о       │
│  состоянии импортов и синхронизаций       │
│  прямо в Telegram.                        │
│                                           │
│  [Подключить Telegram]                    │
│                                           │
└──────────────────────────────────────────┘
```

**Modal - Binding In Progress**:

```
┌──────────────────────────────────────────┐
│  Подключение Telegram                  [×]│
│  ────────────────────────────────────────│
│                                           │
│  Шаг 1: Откройте бот в Telegram           │
│                                           │
│  Отправьте боту @Kernel_crypto_bot:       │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │  /start A1B2C3D4                    │ │
│  │  [📋 Копировать]                    │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  или                                      │
│                                           │
│  [Открыть в Telegram 📱]                  │
│                                           │
│  ────────────────────────────────────────│
│  Код действителен: 9:45                   │
│  [■■■■■■■■■□□□□□□□] 65%                  │
│                                           │
│  ⏳ Ожидаем подтверждения...              │
│                                           │
└──────────────────────────────────────────┘
```

**Bound State**:

```
┌──────────────────────────────────────────┐
│  📱 Telegram Уведомления                  │
│  ────────────────────────────────────────│
│                                           │
│  Статус: 🔔 Подключен (@username)         │
│  Подключено: 22.12.2025 14:30             │
│                                           │
│  [Отключить Telegram]                     │
│                                           │
└──────────────────────────────────────────┘
```

### Notification Preferences (Story 34.3-FE)

```
┌──────────────────────────────────────────┐
│  ⚙️ Настройки уведомлений                 │
│  ────────────────────────────────────────│
│                                           │
│  ☑️ Задача выполнена успешно              │
│     Уведомления при завершении импорта,   │
│     синхронизации, расчёта маржи          │
│                                           │
│  ☑️ Ошибки выполнения задач               │
│     Уведомления при ошибках после всех    │
│     попыток retry                         │
│                                           │
│  ☐ Задача зависла                         │
│     Уведомления когда задача выполняется  │
│     более 30 минут                        │
│                                           │
│  ☑️ Ежедневный дайджест                   │
│     Сводка за день: успешные, ошибки      │
│     [Время: 08:00 ▼]                      │
│                                           │
│  ────────────────────────────────────────│
│                                           │
│  Язык уведомлений:                        │
│  [🇷🇺 Русский] [🇬🇧 English]             │
│                                           │
└──────────────────────────────────────────┘
```

### Quiet Hours (Story 34.4-FE)

```
┌──────────────────────────────────────────┐
│  🌙 Тихие часы                            │
│  ────────────────────────────────────────│
│                                           │
│  ☑️ Включить тихие часы                   │
│     Уведомления не будут отправляться     │
│     в заданный период                     │
│                                           │
│  С:  [23:00 ▼]  До:  [07:00 ▼]           │
│                                           │
│  Часовой пояс:  [Europe/Moscow ▼]         │
│                                           │
│  ℹ️ Сейчас в Europe/Moscow: 14:32         │
│                                           │
└──────────────────────────────────────────┘
```

---

## 🎯 Acceptance Criteria

После завершения дизайна, убедитесь что:

**Функциональность**:

- [ ] Все 6 stories (34.1-34.6) имеют wireframes
- [ ] Mobile + Desktop layouts для каждого компонента
- [ ] Все 25 вопросов answered
- [ ] Empty states показаны
- [ ] Error states показаны
- [ ] Loading states показаны

**Accessibility**:

- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation support
- [ ] Screen reader support (aria labels)
- [ ] Focus indicators visible
- [ ] Color contrast ratios meet guidelines

**Consistency**:

- [ ] Соответствие существующему design system (shadcn/ui)
- [ ] Использование brand colors (Red primary, Telegram blue for notifications)
- [ ] Typography consistent с другими страницами
- [ ] Spacing consistent с другими страницами

**Responsiveness**:

- [ ] Mobile (320px-640px) layouts
- [ ] Tablet (640px-1024px) layouts
- [ ] Desktop (>1024px) layouts
- [ ] No horizontal scroll на мобильных

---

## 📦 Deliverable Format

**Preferred Format**:

- Figma file (editable, collaborative)
- Export PNG/SVG для каждого компонента
- Component specs (sizes, spacing, colors)

**Alternative Formats**:

- Adobe XD
- Sketch
- High-fidelity wireframes (PDF)

**Please Include**:

1. Full page designs (`/settings/notifications`)
2. Component close-ups (zoom на каждую карточку)
3. Interactive states (hover, active, disabled)
4. Mobile vs Desktop comparisons
5. Answers to all 25 design questions

---

## 📞 Questions & Collaboration

**Contact PO (Sarah)**: [GitHub discussions, Slack, etc.]

**Design Review Meeting**: Scheduled after initial wireframes ready

**Iteration Process**:

1. Initial wireframes → PO review
2. Revisions based on feedback
3. High-fidelity mockups
4. Developer handoff

---

**Created**: 2025-12-29
**Last Updated**: 2025-12-29
**Status**: 📋 Awaiting UX Expert Assignment

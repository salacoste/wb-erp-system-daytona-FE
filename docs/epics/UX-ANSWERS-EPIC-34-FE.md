# Epic 34-FE: UX Expert Answers & Design Recommendations

**Date**: 2025-12-29
**UX Expert**: Sally
**Epic**: Epic 34-FE - Telegram Notifications UI
**Status**: ✅ Complete

---

## 📋 Executive Summary

Этот документ содержит **детальные ответы на 25 дизайн-вопросов** от Product Owner для Epic 34-FE (Telegram Notifications UI). Все рекомендации основаны на:

1. ✅ **Существующей дизайн-системе проекта** (`front-end-spec.md`)
2. ✅ **Best practices** для notification settings UI
3. ✅ **Accessibility requirements** (WCAG 2.1 AA)
4. ✅ **Mobile-first approach** для русскоязычных пользователей Wildberries

---

## 🎨 Design System Context (Краткая справка)

**Используемые цвета:**

- **Primary Red**: `#E53935` (основной бренд WB Repricer)
- **Telegram Blue**: `#0088CC` (для Telegram-специфичных элементов)
- **Success Green**: `#4CAF50`
- **Error Red**: `#E53935`
- **Warning Orange**: `#FF9800`
- **Gray Scale**: #F5F5F5 (backgrounds) → #212121 (dark text)

**Типографика:**

- H2 (Section Headers): 24-28px, semi-bold/bold
- Body: 14-16px, regular
- Labels: 14px, medium

**Spacing:**

- Card padding: 20-24px
- Section spacing: 32-48px
- Form field spacing: 16-20px

**Компоненты:**

- **shadcn/ui**: Switch, Dialog, Select, Button, Alert, Badge

**Breakpoints:**

- Mobile: <640px
- Tablet: 640-1024px
- Desktop: >1024px

---

## Story 34.2-FE: Telegram Binding Flow

### Q1: Modal Layout ⭐ CRITICAL

**Вопрос**: Как показать процесс привязки Telegram?

**Ответ**: **A) Центрированный modal overlay (стандартный Dialog)**

**Обоснование:**

- ✅ **Согласованность**: В проекте уже используются модальные окна (см. `Component 10: Modal/Dialog` в `front-end-spec.md`)
- ✅ **Фокус внимания**: Центрированный modal привлекает внимание к критическому процессу привязки
- ✅ **Mobile-friendly**: Modal overlay адаптируется на мобильных (занимает почти весь экран)
- ✅ **Знакомый паттерн**: Большинство пользователей ожидают modal для такого важного действия

**Технические детали:**

- Компонент: `shadcn/ui Dialog`
- Размер: 480-560px ширина на desktop, full-screen на mobile (<640px)
- Backdrop: Overlay с `backdrop-blur-sm` и `bg-black/50`
- Animation: Fade-in + scale transform (200ms)

**UX рекомендации:**

- Кнопка закрытия (X) в правом верхнем углу
- Закрытие по клику на backdrop (с подтверждением, если процесс начат)
- ESC key для закрытия
- Заголовок modal: "Подключение Telegram" (H2, 24px, semi-bold)

**Альтернативы отклонены:**

- ❌ **Side panel**: Менее заметен, больше подходит для secondary actions
- ❌ **Full-page overlay**: Слишком тяжеловесно для этой задачи

---

### Q2: Countdown Timer ⭐ CRITICAL

**Вопрос**: Как визуализировать 10-минутный countdown для кода верификации?

**Ответ**: **D) Комбинация: Линейный прогресс-бар + текст**

**Обоснование:**

- ✅ **Двойной feedback**: Текст для точности ("9:45 осталось"), прогресс-бар для визуальной динамики
- ✅ **Читаемость**: Текст понятен сразу, прогресс-бар показывает общую картину
- ✅ **Urgency indicator**: Когда остается <2 минут, можно менять цвет прогресс-бара на Warning Orange (#FF9800)

**Визуальный дизайн:**

```
┌─────────────────────────────────────────────┐
│  Код действителен ещё: 9:45                 │
│  ████████████████████░░░░░░░░░░ 65%         │
└─────────────────────────────────────────────┘
```

**Технические детали:**

- **Текст**: 14px, medium weight, Gray 700 (#616161)
- **Прогресс-бар**:
  - Высота: 8px
  - Цвет заполнения: Telegram Blue (#0088CC) → Warning Orange (#FF9800) когда <2 мин
  - Цвет фона: Gray 200 (#EEEEEE)
  - Border-radius: 4px (скругленные углы)
- **Update interval**: Каждую секунду обновлять текст и прогресс

**Состояния:**

1. **Normal** (10:00 - 2:01): Blue прогресс-бар
2. **Warning** (2:00 - 0:31): Orange прогресс-бар
3. **Critical** (0:30 - 0:00): Red прогресс-бар, пульсация
4. **Expired** (0:00): Показать "Код истёк. Получите новый код."

**Accessibility:**

- aria-label="Код действителен ещё 9 минут 45 секунд"
- role="timer" на прогресс-баре

---

### Q3: Deep Link Button

**Вопрос**: Как оформить кнопку "Открыть в Telegram"?

**Ответ**: **Primary CTA с Telegram logo и специфичным стилем**

**Дизайн кнопки:**

- **Background**: Telegram Blue (#0088CC) — специфичный цвет для Telegram-действий
- **Text**: "Открыть в Telegram" — ясно и конкретно
- **Icon**: Telegram paper plane logo слева от текста (20x20px)
- **Size**: Height 44px (мобильный минимум), padding 16px 24px
- **Typography**: 16px, semi-bold, white text
- **Border-radius**: 8px (consistent с проектом)
- **Width**: Full-width на mobile, auto на desktop (центрировано)

**Hover/Active states:**

- **Hover**: Background #0077B3 (darker blue)
- **Active/Pressed**: Background #006699
- **Focus ring**: 2px outline, Telegram Blue with offset

**Расположение в modal:**

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
│  │  /start A1B2C3D4        [📋 Копир.] │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  ────── или ──────                        │
│                                           │
│  [📱 Открыть в Telegram]  ← Primary CTA  │
│                                           │
│  Код действителен: 9:45                   │
│  ████████████████████░░░░░░ 65%           │
│                                           │
└──────────────────────────────────────────┘
```

**Технические детали:**

- Deep link: `https://t.me/Kernel_crypto_bot?start=A1B2C3D4`
- На mobile: Откроет приложение Telegram автоматически
- На desktop: Откроет Telegram Web или предложит скачать приложение
- Fallback: Если deep link не работает, показать инструкцию с копированием команды

**Accessibility:**

- aria-label="Открыть бота WB Repricer в приложении Telegram"
- Keyboard accessible (Tab to focus, Enter to activate)

---

### Q4: Polling Indicator

**Вопрос**: Как показать, что идёт ожидание подтверждения от Telegram?

**Ответ**: **A) Spinner + текст "Ожидаем подтверждения..."**

**Визуальный дизайн:**

```
┌──────────────────────────────────────────┐
│  ⏳ Ожидаем подтверждения...              │
│     (spinner animation)                   │
└──────────────────────────────────────────┘
```

**Технические детали:**

- **Spinner**: 24x24px, Telegram Blue (#0088CC), 1.5s rotation
- **Text**: 14px, regular, Gray 600 (#757575)
- **Layout**: Flexbox, center-aligned, gap 8px между spinner и текстом
- **Position**: Под прогресс-баром, над кнопкой закрытия modal

**Состояния polling:**

1. **Initial** (0-5s): "Ожидаем подтверждения..."
2. **In Progress** (5s+): "Всё ещё ожидаем... Проверьте Telegram."
3. **Long Wait** (>60s): "Подтверждение занимает дольше обычного. Убедитесь, что вы отправили команду боту."

**Accessibility:**

- role="status" на контейнере
- aria-live="polite" для динамического текста
- aria-busy="true" пока polling активен

**UX рекомендации:**

- Polling interval: 3 секунды (как указано в требованиях)
- Max polling duration: 10 минут (совпадает с временем жизни кода)
- После 10 минут: Показать "Код истёк. Пожалуйста, закройте окно и попробуйте снова."

---

### Q5: Unbind Confirmation

**Вопрос**: Как показать подтверждение отключения Telegram?

**Ответ**: **B) Отдельный confirmation dialog**

**Обоснование:**

- ✅ **Критичность действия**: Отключение — необратимое действие, требует явного подтверждения
- ✅ **Фокус внимания**: Отдельный dialog привлекает внимание к серьёзности действия
- ✅ **Ясность**: Пользователь точно понимает, что произойдёт
- ✅ **Стандартный паттерн**: Используется в проекте для destructive actions

**Визуальный дизайн:**

```
┌──────────────────────────────────────────┐
│  Отключить Telegram?                   [×]│
│  ────────────────────────────────────────│
│                                           │
│  ⚠️ Вы уверены, что хотите отключить      │
│     Telegram-уведомления?                 │
│                                           │
│  • Вы перестанете получать уведомления    │
│    о задачах                              │
│  • Настройки будут сброшены               │
│  • Вы сможете переподключить Telegram     │
│    в любое время                          │
│                                           │
│  ────────────────────────────────────────│
│                                           │
│  [Отменить]        [Отключить Telegram]   │
│  (secondary)            (danger)          │
│                                           │
└──────────────────────────────────────────┘
```

**Технические детали:**

- **Title**: "Отключить Telegram?" (H3, 20px, semi-bold)
- **Warning icon**: ⚠️ (Warning Orange #FF9800, 24x24px)
- **Body text**: 14px, regular, Gray 700 (#616161)
- **Bullet points**: Ясно объясняют последствия

**Кнопки:**

1. **Отменить** (Secondary button):
   - Background: White
   - Border: 1px solid Gray 300 (#E0E0E0)
   - Text: Gray 700 (#616161), 14px, medium
   - Hover: Background Gray 100 (#F5F5F5)

2. **Отключить Telegram** (Danger button):
   - Background: Error Red (#E53935)
   - Text: White, 14px, semi-bold
   - Hover: Background #D32F2F (darker red)
   - Focus ring: 2px Red outline

**Button order:**

- **Desktop**: [Отменить] слева, [Отключить] справа (стандартный паттерн)
- **Mobile**: Vertical stack, [Отключить] сверху (более заметная кнопка), [Отменить] снизу

**Поведение:**

- Клик на "Отменить" → закрывает dialog, ничего не происходит
- Клик на "Отключить Telegram" → вызывает `DELETE /telegram/unbind`, показывает loading spinner, закрывает dialog после успеха, показывает toast "Telegram отключен"

**Accessibility:**

- role="alertdialog" на modal
- aria-labelledby="dialog-title"
- aria-describedby="dialog-description"
- Focus trap: Фокус остаётся внутри dialog

---

## Story 34.3-FE: Notification Preferences Panel

### Q6: Event Type Cards

**Вопрос**: Как визуально показать включенные vs выключенные типы событий?

**Ответ**: **B) Border highlight для включенных + цветовое изменение toggle**

**Обоснование:**

- ✅ **Accessibility**: Не полагаемся только на цвет (border + toggle state)
- ✅ **Консистентность**: Соответствует дизайн-системе проекта (borders, не background changes)
- ✅ **Читаемость**: Белый background всегда, легко читать текст

**Визуальный дизайн:**

**Enabled Event Type:**

```
┌─────────────────────────────────────────┐ ← Border: 2px Telegram Blue (#0088CC)
│  ☑️ Задача выполнена успешно         [●]│ ← Toggle: Blue, ON
│                                          │
│  Уведомления при завершении импорта,     │
│  синхронизации, расчёта маржи            │
│                                          │
└─────────────────────────────────────────┘
```

**Disabled Event Type:**

```
┌─────────────────────────────────────────┐ ← Border: 1px Gray 300 (#E0E0E0)
│  ☐ Задача зависла                    [○]│ ← Toggle: Gray, OFF
│                                          │
│  Уведомления когда задача выполняется    │
│  более 30 минут                          │
│                                          │
└─────────────────────────────────────────┘
```

**Технические детали:**

**Card (Enabled state):**

- Border: 2px solid Telegram Blue (#0088CC)
- Background: White (#FFFFFF)
- Shadow: shadow-sm (subtle elevation)
- Padding: 20px
- Border-radius: 8px

**Card (Disabled state):**

- Border: 1px solid Gray 300 (#E0E0E0)
- Background: White (#FFFFFF)
- Shadow: none
- Padding: 20px
- Border-radius: 8px
- Text color: Gray 600 (#757575) для description (slightly muted)

**Toggle Switch** (shadcn/ui Switch):

- **ON state**: Background Telegram Blue (#0088CC), white circle
- **OFF state**: Background Gray 300 (#E0E0E0), white circle
- **Size**: 44x24px (track), 20x20px (thumb)
- **Animation**: 200ms ease-in-out transition

**Icon:**

- Checkmark (☑️) для enabled: Telegram Blue (#0088CC), 20x20px
- Empty checkbox (☐) для disabled: Gray 400 (#BDBDBD), 20x20px

**Layout:**

```
┌──────────────────────────────────────────┐
│  [Icon] Название события         [Toggle]│ ← Flexbox, space-between
│                                           │
│  Описание события (wrap text)             │ ← 2-line limit, truncate if longer
│                                           │
└──────────────────────────────────────────┘
```

**Accessibility:**

- aria-checked="true|false" на toggle
- aria-label="Включить уведомления о завершении задач" на toggle
- role="switch" на toggle element

**UX рекомендации:**

- Клик на ВСЕЙ карточке toggles switch (не только на самом switch)
- Визуальный feedback: border меняется instantly после toggle
- No confirmation dialog — изменения сохраняются через "Сохранить настройки" button внизу

---

### Q7: Event Descriptions

**Вопрос**: Как показать пояснения к каждому типу события?

**Ответ**: **A) Всегда видимые (текст под заголовком)**

**Обоснование:**

- ✅ **Mobile-friendly**: Tooltips не работают на touch devices
- ✅ **No hidden information**: Пользователь сразу понимает, что делает каждая опция
- ✅ **Accessibility**: Screen readers читают описание вместе с названием
- ✅ **Reduces cognitive load**: Не нужно hover/click для понимания опции

**Визуальный дизайн:**

```
┌─────────────────────────────────────────┐
│  ☑️ Задача выполнена успешно         [●]│ ← Title: 16px, medium
│                                          │
│  Уведомления при завершении импорта,     │ ← Description: 14px, regular
│  синхронизации, расчёта маржи            │    Gray 600 (#757575)
│                                          │    Max 2 lines, truncate with "..."
└─────────────────────────────────────────┘
```

**Технические детали:**

- **Title**: 16px, medium weight, Gray 800 (#424242)
- **Description**: 14px, regular, Gray 600 (#757575)
- **Line height**: 1.5 (для читаемости)
- **Max lines**: 2 lines с `line-clamp-2` (Tailwind utility)
- **Spacing**: 8px между title и description

**Content guidelines:**
Описания должны быть:

1. **Конкретными**: "Уведомления при завершении импорта" вместо "Когда задачи завершены"
2. **Краткими**: Максимум 2 строки (на desktop ~80 символов)
3. **Actionable**: Объясняют, КОГДА придёт уведомление

**Примеры описаний:**

- **task_completed**: "Уведомления при завершении импорта, синхронизации, расчёта маржи"
- **task_failed**: "Уведомления при ошибках после всех попыток retry"
- **task_stalled**: "Уведомления когда задача выполняется более 30 минут"
- **daily_digest**: "Сводка за день: успешные задачи, ошибки, задачи в очереди"

**Accessibility:**

- aria-describedby связывает title с description
- Description читается screen reader'ом автоматически

---

### Q8: Language Switcher

**Вопрос**: Как показать переключатель языка уведомлений (ru/en)?

**Ответ**: **A) Radio buttons с флагами: [🇷🇺 Русский] [🇬🇧 English]**

**Обоснование:**

- ✅ **Ясность**: Сразу видны ОБА варианта (не спрятаны в dropdown)
- ✅ **Quick toggle**: Один клик для смены языка
- ✅ **Visual**: Флаги помогают быстро идентифицировать язык
- ✅ **Accessibility**: Radio buttons лучше поддерживаются screen readers

**Визуальный дизайн:**

```
┌──────────────────────────────────────────┐
│  Язык уведомлений:                        │ ← Label: 16px, medium
│                                           │
│  ⚫ 🇷🇺 Русский     ⚪ 🇬🇧 English        │ ← Radio buttons, inline
│                                           │
└──────────────────────────────────────────┘
```

**Технические детали:**

**Radio Button (Selected):**

- Border: 2px solid Telegram Blue (#0088CC)
- Background: Light Blue (#E3F2FD) — subtle highlight
- Inner circle: Telegram Blue (#0088CC)
- Text: Gray 800 (#424242), 14px, medium
- Padding: 12px 20px
- Border-radius: 8px

**Radio Button (Unselected):**

- Border: 1px solid Gray 300 (#E0E0E0)
- Background: White (#FFFFFF)
- Inner circle: Empty (just border)
- Text: Gray 600 (#757575), 14px, regular
- Padding: 12px 20px
- Border-radius: 8px

**Flag icons:**

- Size: 20x20px
- Position: Left of text, 8px spacing
- Use Unicode emoji или SVG flags

**Layout:**

- **Desktop**: Horizontal (side-by-side), gap 16px
- **Mobile**: Horizontal (если помещаются) или vertical stack

**HTML structure:**

```html
<fieldset>
  <legend>Язык уведомлений:</legend>
  <div class="flex gap-4">
    <label class="radio-card">
      <input type="radio" name="language" value="ru" checked />
      <span>🇷🇺 Русский</span>
    </label>
    <label class="radio-card">
      <input type="radio" name="language" value="en" />
      <span>🇬🇧 English</span>
    </label>
  </div>
</fieldset>
```

**Accessibility:**

- role="radiogroup" на контейнере
- aria-label="Выберите язык уведомлений"
- Keyboard navigation: Arrow keys для переключения между options

**UX примечание:**

- Ясно указать: "Это язык Telegram-сообщений, а не интерфейса платформы"
- Hint text под switcher: "Язык интерфейса платформы настраивается отдельно в Профиле"

---

### Q9: Daily Digest Section

**Вопрос**: Как показать настройки ежедневного дайджеста?

**Ответ**: **B) Inline с другими event types, но time picker показывается conditionally**

**Обоснование:**

- ✅ **Консистентность**: Daily digest — это тоже event type, логично в одном списке
- ✅ **Простота**: Не нужна отдельная карточка для одной опции
- ✅ **Progressive disclosure**: Time picker появляется только когда digest включен

**Визуальный дизайн:**

**Daily Digest DISABLED:**

```
┌─────────────────────────────────────────┐
│  ☐ Ежедневный дайджест               [○]│
│                                          │
│  Сводка за день: успешные, ошибки,       │
│  задачи в очереди                        │
│                                          │
└─────────────────────────────────────────┘
```

**Daily Digest ENABLED:**

```
┌─────────────────────────────────────────┐ ← Border: 2px Blue
│  ☑️ Ежедневный дайджест              [●]│
│                                          │
│  Сводка за день: успешные, ошибки,       │
│  задачи в очереди                        │
│                                          │
│  🕐 Время отправки: [08:00 ▼]           │ ← Time picker (appears conditionally)
│                                          │
└─────────────────────────────────────────┘
```

**Технические детали:**

**Time Picker (conditional render):**

- **Visibility**: `display: none` when digest OFF, `display: block` when digest ON
- **Animation**: Slide-down animation (200ms ease) when appearing
- **Component**: Native HTML `<input type="time">` OR shadcn/ui Select with time options
- **Default value**: "08:00" (8 AM)

**Layout:**

```
┌──────────────────────────────────────────┐
│  [Checkbox] Название                [Toggle]│ ← Standard event card
│                                            │
│  Описание события                          │
│                                            │
│  {if enabled}                              │ ← Conditional section
│    🕐 Время отправки: [Time Picker]       │
│  {/if}                                     │
│                                            │
└──────────────────────────────────────────┘
```

**Time Picker Design:**

- **Label**: "Время отправки:" (14px, medium, Gray 700)
- **Icon**: 🕐 clock icon (16x16px, Gray 600)
- **Dropdown/Input**: 120px width, 40px height
- **Options**: Hourly intervals 00:00 - 23:00 (или каждые 30 минут)
- **Border**: 1px Gray 300, border-radius 6px
- **Focus state**: 2px Telegram Blue outline

**Spacing:**

- 12px margin-top от description до time picker
- Time picker внутри card padding (не отдельная секция)

**Accessibility:**

- aria-hidden="true|false" на time picker section (в зависимости от toggle state)
- aria-label="Выберите время отправки дайджеста" на time picker
- Announce change via screen reader: "Ежедневный дайджест включен. Выберите время отправки."

**UX рекомендации:**

- Когда toggle OFF → ON: Автоматически focus на time picker
- Default time: 08:00 (логичное утреннее время)
- Hint text: "Дайджест отправляется в указанное время по вашему часовому поясу"

---

### Q10: Save Strategy ⭐ CRITICAL

**Вопрос**: Когда сохранять изменения настроек?

**Ответ**: **B) Manual save button внизу страницы "Сохранить настройки"**

**Обоснование:**

- ✅ **User control**: Пользователь явно контролирует, когда изменения применяются
- ✅ **Error prevention**: Можно отменить случайные изменения (не сохранять)
- ✅ **Consistency**: В проекте используется manual save для COGS и других форм
- ✅ **Batch changes**: Пользователь может изменить несколько настроек, потом сохранить все сразу

**Визуальный дизайн:**

**Save button placement:**

```
┌──────────────────────────────────────────┐
│  NotificationPreferencesPanel             │
│  ────────────────────────────────────────│
│                                           │
│  [Event Type Cards...]                    │
│  [Language Switcher...]                   │
│  [QuietHoursConfiguration...]             │
│                                           │
│  ────────────────────────────────────────│ ← Divider
│                                           │
│  [Отменить]         [Сохранить настройки]│ ← Action bar
│  (secondary)              (primary)       │
│                                           │
└──────────────────────────────────────────┘
```

**Button Design:**

**"Сохранить настройки" (Primary button):**

- Background: Primary Red (#E53935) — стандартный primary action в проекте
- Text: White, 14px, semi-bold
- Icon: ✓ checkmark слева (16x16px)
- Size: Height 44px, padding 14px 24px
- Border-radius: 8px
- Width: Auto на desktop, full-width на mobile

**Hover/States:**

- Hover: Background #D32F2F (darker red)
- Active: Background #C62828
- Disabled: Background Gray 300 (#E0E0E0), Gray 600 text (когда нет изменений)
- Loading: Spinner + "Сохранение..." text

**"Отменить" (Secondary button):**

- Background: White
- Border: 1px solid Gray 300 (#E0E0E0)
- Text: Gray 700 (#616161), 14px, medium
- Hover: Background Gray 100 (#F5F5F5)
- **Функция**: Сбросить все изменения к последнему сохранённому состоянию

**Dirty State Detection:**

```typescript
// Показать индикатор unsaved changes
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

// Включить/выключить save button
<Button
  disabled={!hasUnsavedChanges || isSaving}
  onClick={handleSave}
>
  Сохранить настройки
</Button>
```

**Unsaved Changes Indicator:**

```
┌──────────────────────────────────────────┐
│  ⚠️ У вас есть несохранённые изменения    │ ← Warning banner (появляется когда dirty)
│                                           │    Background: Warning Orange #FFF3E0
└──────────────────────────────────────────┘
```

**Navigation Prevention:**

- Если `hasUnsavedChanges === true` и пользователь пытается уйти со страницы:
  - Показать confirmation dialog: "У вас есть несохранённые изменения. Покинуть страницу без сохранения?"
  - [Отменить] | [Покинуть без сохранения]

**Success Feedback:**
После успешного сохранения:

- Toast notification: "Настройки сохранены" (Success Green, 3s auto-dismiss)
- Кнопка "Сохранить настройки" становится disabled
- Unsaved changes banner исчезает

**Error Handling:**
Если сохранение fails:

- Toast notification: "Не удалось сохранить настройки. Попробуйте ещё раз." (Error Red)
- Кнопка "Сохранить настройки" остаётся active
- Allow retry

**Accessibility:**

- aria-live="polite" на unsaved changes banner
- aria-busy="true" на save button во время loading

**Альтернатива (отклонена):**

- ❌ **Auto-save**: Может приводить к случайным изменениям, менее predictable, не согласуется с остальной системой

---

## Story 34.4-FE: Quiet Hours Configuration

### Q11: Time Pickers

**Вопрос**: Какой time picker использовать?

**Ответ**: **A) Native HTML `<input type="time">` (работает на мобильных)**

**Обоснование:**

- ✅ **Mobile-friendly**: Открывает native time picker на iOS/Android (оптимизировано для touch)
- ✅ **Accessibility**: Встроенная поддержка keyboard navigation и screen readers
- ✅ **Performance**: Не требует дополнительных библиотек
- ✅ **Consistency**: Пользователи знакомы с native pickers своей ОС

**Визуальный дизайн:**

```
┌──────────────────────────────────────────┐
│  С:  [23:00 ▼]   До:  [07:00 ▼]         │
│       ↑ Native       ↑ Native             │
│       time input     time input           │
└──────────────────────────────────────────┘
```

**Технические детали:**

**HTML:**

```html
<label>
  С:
  <input
    type="time"
    value="23:00"
    step="900"  <!-- 15-minute intervals -->
    class="time-picker"
  />
</label>
```

**CSS Styling:**

```css
.time-picker {
  width: 120px;
  height: 44px;
  padding: 10px 12px;
  border: 1px solid #E0E0E0; /* Gray 300 */
  border-radius: 6px;
  font-size: 14px;
  color: #424242; /* Gray 800 */
}

.time-picker:focus {
  outline: 2px solid #0088CC; /* Telegram Blue */
  outline-offset: 2px;
}

.time-picker:disabled {
  background: #EEEEEE; /* Gray 200 */
  color: #BDBDBD; /* Gray 400 */
  cursor: not-allowed;
}
```

**Format:**

- **24-hour format**: "23:00" (easier для русскоязычных пользователей)
- **Step interval**: 15 минут (00:00, 00:15, 00:30, 00:45, 01:00, ...)
- **Validation**: Автоматическая через browser (не позволяет вводить invalid time)

**Desktop Enhancement (optional):**

- Можно добавить custom styled dropdown для desktop (shadcn/ui Select)
- Но на mobile ВСЕГДА использовать native `<input type="time">`

**Browser Support:**

- Modern browsers: Полная поддержка
- Fallback (старые browsers): Текстовое поле с placeholder "HH:MM", validation через JavaScript

**Accessibility:**

- aria-label="Начало тихих часов" на "from" picker
- aria-label="Конец тихих часов" на "to" picker
- Keyboard navigation: Tab между pickers, Arrow keys для изменения времени

---

### Q12: Timezone Dropdown

**Вопрос**: Как показать выбор timezone?

**Ответ**: **B) Grouped dropdown (Europe, Asia, etc.)**

**Обоснование:**

- ✅ **Organization**: Группировка по регионам помогает быстро найти нужную зону
- ✅ **Scalability**: 10-15 популярных timezones легко организовать
- ✅ **User-friendly**: Не перегружаем пользователя всеми 400+ IANA timezones

**Визуальный дизайн:**

```
┌──────────────────────────────────────────┐
│  Часовой пояс:                            │
│                                           │
│  [Europe/Moscow ▼]                        │ ← Dropdown trigger
│                                           │
│  ℹ️ Сейчас в Europe/Moscow: 14:32         │ ← Current time preview
│                                           │
└──────────────────────────────────────────┘

Dropdown открыт:
┌──────────────────────────────────────────┐
│  Europe                                   │ ← Group header
│    • Europe/Kaliningrad (GMT+2)           │
│    • Europe/Moscow (GMT+3) ✓              │ ← Selected
│    • Europe/Samara (GMT+4)                │
│  ──────────────────────────────────────  │
│  Asia                                     │
│    • Asia/Yekaterinburg (GMT+5)           │
│    • Asia/Krasnoyarsk (GMT+7)             │
│    • Asia/Vladivostok (GMT+10)            │
└──────────────────────────────────────────┘
```

**Технические детали:**

**Component**: shadcn/ui Select (or custom dropdown)

**Группы timezones:**

```javascript
const timezones = [
  {
    group: "Europe",
    zones: [
      { value: "Europe/Kaliningrad", label: "Калининград (GMT+2)", offset: "+02:00" },
      { value: "Europe/Moscow", label: "Москва (GMT+3)", offset: "+03:00" },
      { value: "Europe/Samara", label: "Самара (GMT+4)", offset: "+04:00" },
    ]
  },
  {
    group: "Asia",
    zones: [
      { value: "Asia/Yekaterinburg", label: "Екатеринбург (GMT+5)", offset: "+05:00" },
      { value: "Asia/Omsk", label: "Омск (GMT+6)", offset: "+06:00" },
      { value: "Asia/Krasnoyarsk", label: "Красноярск (GMT+7)", offset: "+07:00" },
      { value: "Asia/Irkutsk", label: "Иркутск (GMT+8)", offset: "+08:00" },
      { value: "Asia/Yakutsk", label: "Якутск (GMT+9)", offset: "+09:00" },
      { value: "Asia/Vladivostok", label: "Владивосток (GMT+10)", offset: "+10:00" },
      { value: "Asia/Magadan", label: "Магадан (GMT+11)", offset: "+11:00" },
      { value: "Asia/Kamchatka", label: "Камчатка (GMT+12)", offset: "+12:00" },
    ]
  }
];
```

**Dropdown Design:**

- **Trigger**: 240px width (desktop), full-width (mobile)
- **Trigger height**: 44px
- **Border**: 1px Gray 300 (#E0E0E0), border-radius 6px
- **Dropdown panel**: Max-height 320px, scroll if needed
- **Group header**: 14px, semi-bold, Gray 700, uppercase
- **Option**: 14px, regular, Gray 800, padding 10px 16px
- **Selected option**: Checkmark ✓, Telegram Blue background tint

**Current Time Preview:**

- Position: Below dropdown, 8px spacing
- Icon: ℹ️ info icon (16x16px, Info Blue #2196F3)
- Text: 14px, regular, Gray 600 (#757575)
- Format: "Сейчас в Europe/Moscow: 14:32" (HH:MM, 24-hour)
- Update: Real-time (каждую минуту)

**Accessibility:**

- aria-label="Выберите часовой пояс"
- role="combobox" на trigger
- role="option" на каждом item
- Keyboard navigation: Arrow keys, Enter to select

**UX рекомендации:**

- Default value: Определить автоматически через `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Если автоматическое определение не сработало → default "Europe/Moscow"

---

### Q13: Current Time Preview

**Вопрос**: Где показать текущее время в выбранном timezone?

**Ответ**: **A) Inline text под timezone dropdown**

**Обоснование:**

- ✅ **Always visible**: Пользователь всегда видит, какое сейчас время в выбранной зоне
- ✅ **Contextual**: Помогает понять, правильно ли выбран timezone
- ✅ **No interaction needed**: Не требует hover/click

**Визуальный дизайн:**

```
┌──────────────────────────────────────────┐
│  Часовой пояс:                            │
│  [Europe/Moscow ▼]                        │
│                                           │
│  ℹ️ Сейчас в Europe/Moscow: 14:32         │ ← Preview (всегда виден)
│                                           │
└──────────────────────────────────────────┘
```

**Технические детали:**

- **Icon**: ℹ️ info icon (16x16px, Info Blue #2196F3)
- **Text**: 14px, regular, Gray 600 (#757575)
- **Format**: "Сейчас в {timezone}: {HH:MM}"
- **Update frequency**: Каждые 60 секунд (не нужно каждую секунду для экономии ресурсов)
- **Layout**: Flexbox, gap 8px между icon и text

**JavaScript Implementation:**

```javascript
const getCurrentTimeInTimezone = (timezone) => {
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(new Date());
};

// Update every minute
useEffect(() => {
  const updateTime = () => {
    setCurrentTime(getCurrentTimeInTimezone(selectedTimezone));
  };

  updateTime(); // Initial
  const interval = setInterval(updateTime, 60000); // Every 60s

  return () => clearInterval(interval);
}, [selectedTimezone]);
```

**Accessibility:**

- aria-live="polite" (announces time updates to screen readers)
- role="status"

**UX Enhancement:**

- Когда пользователь меняет timezone → preview обновляется instantly
- Highlight preview с subtle animation (fade-in) при изменении timezone

---

### Q14: Overnight Quiet Hours Visual

**Вопрос**: Как визуально показать "overnight" quiet hours (например, 23:00-07:00)?

**Ответ**: **B) Добавить hint: "Тихие часы: 23:00 - 07:00 (через полночь)"**

**Обоснование:**

- ✅ **Clarity**: Ясно объясняет, что период пересекает полночь
- ✅ **Simple**: Не требует сложной визуализации (timeline)
- ✅ **Accessibility**: Текстовая подсказка доступна для screen readers

**Визуальный дизайн:**

```
┌──────────────────────────────────────────┐
│  ☑️ Включить тихие часы                   │
│     Уведомления не будут отправляться     │
│     в заданный период                     │
│                                           │
│  С:  [23:00 ▼]  До:  [07:00 ▼]           │
│                                           │
│  💡 Тихие часы: 23:00 - 07:00             │ ← Hint (появляется автоматически)
│     (период через полночь)                 │
│                                           │
└──────────────────────────────────────────┘
```

**Технические детали:**

**Hint Display Logic:**

```javascript
const isOvernightPeriod = (fromTime, toTime) => {
  const from = parseInt(fromTime.split(':')[0]);
  const to = parseInt(toTime.split(':')[0]);
  return to < from; // 23:00 > 07:00 → overnight
};

// Conditionally show hint
{isOvernightPeriod(quietHoursFrom, quietHoursTo) && (
  <div className="overnight-hint">
    💡 Тихие часы: {quietHoursFrom} - {quietHoursTo} (период через полночь)
  </div>
)}
```

**Hint Design:**

- **Icon**: 💡 lightbulb (20x20px, Warning Orange #FF9800) — привлекает внимание
- **Background**: Light Orange (#FFF3E0) — subtle highlight
- **Border**: 1px solid Warning Orange (#FF9800)
- **Padding**: 12px 16px
- **Border-radius**: 6px
- **Text**: 14px, regular, Gray 700 (#616161)
- **Position**: Below time pickers, 12px margin-top

**Alternative Wording:**

- "Период пересекает полночь: 23:00 сегодня - 07:00 завтра"
- "Тихие часы с 23:00 вечера до 07:00 утра (8 часов)"

**Accessibility:**

- role="note" на hint container
- aria-live="polite" (announces когда hint появляется)

**UX рекомендации:**

- Hint появляется **только** когда overnight period detected
- Не показывать hint для нормальных периодов (08:00 - 22:00)
- Можно добавить duration: "Тихие часы: 23:00 - 07:00 (8 часов)"

---

### Q15: Active Quiet Hours Indicator

**Вопрос**: Как показать, что СЕЙЧАС активны тихие часы?

**Ответ**: **A) Badge "Сейчас активны тихие часы" с иконкой 🌙**

**Обоснование:**

- ✅ **Immediate visibility**: Пользователь сразу видит, что сейчас тихий период
- ✅ **Contextual**: Появляется только когда текущее время попадает в quiet hours
- ✅ **Clear communication**: Текст + иконка = ясное сообщение

**Визуальный дизайн:**

```
┌──────────────────────────────────────────┐
│  ☑️ Включить тихие часы                   │
│                                           │
│  С:  [23:00 ▼]  До:  [07:00 ▼]           │
│                                           │
│  ┌────────────────────────────────────┐  │
│  │ 🌙 Сейчас активны тихие часы       │  │ ← Active badge
│  │    (уведомления не отправляются)   │  │
│  └────────────────────────────────────┘  │
│                                           │
└──────────────────────────────────────────┘
```

**Badge Design:**

- **Background**: Info Blue (#E3F2FD) — subtle blue tint
- **Border**: 1px solid Info Blue (#2196F3)
- **Icon**: 🌙 moon icon (20x20px)
- **Text**: 14px, medium weight, Info Blue (#2196F3)
- **Padding**: 12px 16px
- **Border-radius**: 6px
- **Position**: Below time pickers, 12px margin-top

**Display Logic:**

```javascript
const isQuietHoursActive = (from, to, timezone) => {
  const now = new Date();
  const currentTime = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);

  const [currentHour, currentMin] = currentTime.split(':').map(Number);
  const [fromHour, fromMin] = from.split(':').map(Number);
  const [toHour, toMin] = to.split(':').map(Number);

  const current = currentHour * 60 + currentMin;
  const start = fromHour * 60 + fromMin;
  const end = toHour * 60 + toMin;

  // Handle overnight periods
  if (start > end) {
    return current >= start || current < end;
  }
  return current >= start && current < end;
};

// Conditionally render badge
{quietHoursEnabled && isQuietHoursActive(from, to, timezone) && (
  <ActiveBadge />
)}
```

**Badge States:**

- **Active** (current time in quiet hours): Blue badge shown
- **Inactive** (current time outside quiet hours): Badge hidden

**Accessibility:**

- role="status"
- aria-live="polite" (announces когда badge appears/disappears)
- aria-label="Тихие часы сейчас активны. Уведомления не отправляются."

**UX рекомендации:**

- Badge автоматически исчезает когда quiet hours period ends
- Update badge каждые 60 секунд (проверять, всё ещё active?)
- Если пользователь меняет time pickers → instant recheck

---

## Story 34.5-FE: Settings Page Layout

### Q16: Card Layout ⭐ CRITICAL

**Вопрос**: Как расположить компоненты на странице?

**Ответ**: **A) Вертикальный stack (один под другим)**

**Обоснование:**

- ✅ **Mobile-first**: Вертикальный stack идеально работает на всех размерах экранов
- ✅ **Consistency**: В проекте используется vertical stacking для dashboard cards
- ✅ **Readability**: Естественный flow сверху вниз, легко читать и понимать структуру
- ✅ **Simplicity**: Не нужна сложная grid логика

**Визуальный дизайн:**

**Desktop (>1024px):**

```
┌────────────────────────────────────────────────────────┐
│  Главная > Настройки > Уведомления                      │ ← Breadcrumbs
│                                                          │
│  📱 Telegram Уведомления                                 │ ← H1 Page Title
│  ──────────────────────────────────────────────────────│
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📱 Подключение Telegram                         │  │ ← Card 1
│  │  ────────────────────────────────────────────────│  │
│  │  Статус: 🔔 Подключен (@username)                │  │
│  │  [Отключить Telegram]                            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │  ← 24px spacing
│  ┌──────────────────────────────────────────────────┐  │
│  │  ⚙️ Настройки уведомлений                        │  │ ← Card 2
│  │  ────────────────────────────────────────────────│  │
│  │  [Event Type Cards...]                           │  │
│  │  [Language Switcher...]                          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │  ← 24px spacing
│  ┌──────────────────────────────────────────────────┐  │
│  │  🌙 Тихие часы                                    │  │ ← Card 3
│  │  ────────────────────────────────────────────────│  │
│  │  [Time Pickers, Timezone...]                     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │  ← 32px spacing
│  ────────────────────────────────────────────────────  │ ← Divider
│                                                          │
│  [🔔 Отправить тестовое уведомление]                    │ ← Test button
│                                                          │  ← 24px spacing
│  [Отменить]                   [Сохранить настройки]     │ ← Action bar
│                                                          │
└────────────────────────────────────────────────────────┘
```

**Mobile (<640px):**

- Same vertical stack
- Cards full-width
- Reduced spacing (16-20px между cards)
- Action buttons: vertical stack (full-width)

**Технические детали:**

**Page Container:**

- Max-width: 1024px (centered on large screens)
- Padding: 24px (desktop), 16px (mobile)
- Background: White (#FFFFFF)

**Card Design:**

- Border: 1px solid Gray 300 (#E0E0E0)
- Border-radius: 8px
- Shadow: shadow-md (стандарт для cards в проекте)
- Padding: 24px (desktop), 20px (mobile)
- Background: White (#FFFFFF)

**Card Spacing:**

- Between cards: 24px (desktop), 20px (tablet), 16px (mobile)
- Before action bar: 32px (визуальное разделение)

**Card Headers:**

- Icon + Title layout (Flexbox, gap 12px)
- Icon: 24x24px
- Title: H2 (24px, semi-bold, Gray 800)
- Divider below header: 1px Gray 200, 16px margin-bottom

**Responsive Behavior:**

```css
.settings-page {
  max-width: 1024px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px; /* spacing between cards */
}

@media (max-width: 640px) {
  .settings-page {
    padding: 16px;
    gap: 16px;
  }
}
```

**Accessibility:**

- Logical heading hierarchy (H1 → H2 → H3)
- Landmark regions: `<main>` для page content
- Skip link для keyboard users

**Альтернатива (отклонена):**

- ❌ **Grid 2 columns**: Сложнее на mobile, не согласуется с остальными страницами проекта

---

### Q17: Spacing

**Вопрос**: Сколько пикселей между секциями?

**Ответ**: **Используем spacing scale из проекта (16px, 24px, 32px)**

**Обоснование:**

- ✅ **Consistency**: Соответствует существующей spacing system проекта
- ✅ **Visual hierarchy**: Разные уровни spacing для разных типов контента

**Spacing Guidelines:**

**Page-level:**

- Page padding: **24px** (desktop), **16px** (mobile/tablet)
- Container max-width: **1024px**

**Card-level:**

- Card padding: **24px** (desktop), **20px** (mobile)
- Card spacing (between cards): **24px** (desktop), **20px** (tablet), **16px** (mobile)
- Card border-radius: **8px**

**Section-level:**

- Section spacing (перед action bar): **32px**
- Between major sections within card: **20px**
- Between related elements (e.g., label + input): **8px**

**Component-level:**

- Between form fields: **16px**
- Between event type cards: **12px**
- Between toggle and description: **8px**
- Between icon and text: **8px**

**Visual Reference:**

```
Page padding: 24px
│
│  Card 1 (padding: 24px)
│
│  ← 24px spacing
│
│  Card 2 (padding: 24px)
│    │
│    │  Section (margin-bottom: 20px)
│    │
│    │  Form field
│    │  ← 16px spacing
│    │  Form field
│
│  ← 24px spacing
│
│  Card 3
│
│  ← 32px spacing (before action bar)
│
│  Action Bar
```

**Tailwind CSS Classes:**

- `gap-2` (8px)
- `gap-3` (12px)
- `gap-4` (16px)
- `gap-5` (20px)
- `gap-6` (24px)
- `gap-8` (32px)

**Responsive Adjustments:**

```css
/* Desktop */
.card-spacing { gap: 24px; }

/* Tablet */
@media (max-width: 1024px) {
  .card-spacing { gap: 20px; }
}

/* Mobile */
@media (max-width: 640px) {
  .card-spacing { gap: 16px; }
}
```

---

### Q18: Mobile Layout

**Вопрос**: Как адаптировать для мобильных (<640px)?

**Ответ**: **B) Все карточки expanded (scroll вниз)**

**Обоснование:**

- ✅ **No hidden content**: Всё доступно без дополнительных кликов
- ✅ **Simpler interaction**: Не нужно expand/collapse, просто scroll
- ✅ **Consistency**: Соответствует mobile-first approach проекта
- ✅ **Better accessibility**: Screen readers видят весь контент сразу

**Mobile Layout Adaptations:**

**1. Card Layout:**

- Full-width cards
- Reduced padding: 20px → 16px
- Smaller spacing: 24px → 16px between cards

**2. Telegram Binding Card:**

- Status и username: Vertical stack
- "Отключить" button: Full-width

**3. Event Type Cards:**

- Toggle остаётся справа (не переносится)
- Description может wrap на 3-4 lines (instead of 2)

**4. Language Switcher:**

- Если не помещается horizontal → vertical stack
- Full-width radio buttons

**5. Time Pickers:**

- Full-width inputs (не fixed 120px)
- Vertical stack для "С" и "До" labels

**6. Timezone Dropdown:**

- Full-width dropdown (не 240px)

**7. Action Bar:**

- Vertical stack buttons
- "Сохранить настройки" сверху (more prominent)
- "Отменить" снизу
- Both full-width

**8. Breadcrumbs:**

- Скрыть intermediate levels, показать только: "← Настройки"
- Back button слева

**Visual Reference (Mobile):**

```
┌──────────────────────────────┐
│  ← Настройки                  │ ← Back link
│                               │
│  📱 Telegram Уведомления       │ ← H1 (28px, smaller)
│  ─────────────────────────────│
│                               │
│  ┌─────────────────────────┐ │
│  │ 📱 Подключение          │ │ ← Card 1 (full-width)
│  │ ────────────────────────│ │
│  │ Статус: 🔔 Подключен    │ │
│  │ @username               │ │
│  │                         │ │
│  │ [Отключить Telegram]    │ │ ← Full-width button
│  └─────────────────────────┘ │
│                               │ ← 16px spacing
│  ┌─────────────────────────┐ │
│  │ ⚙️ Настройки            │ │ ← Card 2
│  │ ────────────────────────│ │
│  │ [Event cards...]        │ │
│  │ (scrollable)            │ │
│  └─────────────────────────┘ │
│                               │ ← 16px spacing
│  ┌─────────────────────────┐ │
│  │ 🌙 Тихие часы           │ │ ← Card 3
│  │ ────────────────────────│ │
│  │ С: [23:00 ▼]            │ │ ← Full-width
│  │ До: [07:00 ▼]           │ │
│  └─────────────────────────┘ │
│                               │ ← 24px spacing
│  ─────────────────────────────│ ← Divider
│                               │
│  [🔔 Тестовое уведомление]   │ ← Full-width
│                               │ ← 16px spacing
│  [Сохранить настройки]       │ ← Primary (top)
│  [Отменить]                  │ ← Secondary (bottom)
│                               │
└──────────────────────────────┘
```

**Responsive CSS:**

```css
/* Mobile adjustments */
@media (max-width: 640px) {
  .page-title {
    font-size: 28px; /* smaller than desktop 32-36px */
  }

  .card {
    padding: 16px; /* reduced from 24px */
    margin-bottom: 16px; /* reduced from 24px */
  }

  .action-bar {
    flex-direction: column; /* vertical stack */
    gap: 12px;
  }

  .action-bar button {
    width: 100%; /* full-width buttons */
  }
}
```

**Touch Target Optimization:**

- Minimum 44x44px для всех interactive elements
- Buttons: height 44px minimum
- Toggles: 44x24px track (already compliant)
- Time pickers: height 44px

**Accessibility:**

- Scroll behavior: smooth
- Focus management: сохраняется при scroll
- Screen reader: логический порядок чтения (top to bottom)

---

### Q19: Empty State ⭐ CRITICAL

**Вопрос**: Что показать, если Telegram не подключен?

**Ответ**: **A) Hero banner с CTA "Подключить Telegram" + пояснение зачем**

**Обоснование:**

- ✅ **High visibility**: Hero banner привлекает внимание к главной задаче
- ✅ **Educational**: Объясняет ценность фичи (зачем нужны уведомления)
- ✅ **Clear CTA**: Одна primary action, ясно что делать дальше
- ✅ **Onboarding**: Помогает пользователям понять feature при первом визите

**Визуальный дизайн (Empty State):**

```
┌────────────────────────────────────────────────────────┐
│  Главная > Настройки > Уведомления                      │
│                                                          │
│  📱 Telegram Уведомления                                 │
│  ──────────────────────────────────────────────────────│
│                                                          │
│  ╔══════════════════════════════════════════════════╗  │
│  ║                                                   ║  │
│  ║         📱 Получайте уведомления в Telegram       ║  │ ← Hero Banner
│  ║                                                   ║  │
│  ║  Мгновенные push-уведомления о состоянии ваших    ║  │
│  ║  задач — импорты, синхронизации, расчёты.         ║  │
│  ║                                                   ║  │
│  ║  ✅ Импорт завершён                               ║  │
│  ║  ⚠️ Ошибка синхронизации                         ║  │
│  ║  📊 Ежедневный отчёт                              ║  │
│  ║                                                   ║  │
│  ║        [📱 Подключить Telegram]                   ║  │ ← Primary CTA
│  ║                                                   ║  │
│  ╚══════════════════════════════════════════════════╝  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ⚙️ Настройки уведомлений                        │  │ ← Disabled state
│  │  ────────────────────────────────────────────────│  │
│  │  🔒 Подключите Telegram, чтобы настроить          │  │
│  │     уведомления                                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└────────────────────────────────────────────────────────┘
```

**Hero Banner Design:**

- **Background**: Light Blue gradient (#E3F2FD → #BBDEFB)
- **Border**: 2px solid Telegram Blue (#0088CC)
- **Border-radius**: 12px (slightly larger для hero)
- **Padding**: 40px (desktop), 24px (mobile)
- **Shadow**: shadow-lg (prominent elevation)

**Content Layout:**

- **Icon**: 📱 large telegram icon (48x48px) centered
- **Heading**: "Получайте уведомления в Telegram" (H2, 24px, semi-bold, Gray 800)
- **Description**: 16px, regular, Gray 700, centered, max-width 480px
- **Feature List**: 3 bullet points with icons
- **CTA Button**: Primary Telegram Blue button, centered, 44px height

**Feature List:**

```
✅ Импорт завершён — Узнавайте о готовности данных
⚠️ Ошибка синхронизации — Реагируйте на проблемы мгновенно
📊 Ежедневный отчёт — Получайте сводку в удобное время
```

**CTA Button:**

- Background: Telegram Blue (#0088CC)
- Text: "Подключить Telegram" (16px, semi-bold, white)
- Icon: 📱 Telegram logo (20x20px)
- Size: 200px width (auto на mobile), 44px height
- Border-radius: 8px

**Disabled State (Other Cards):**
Когда Telegram не подключен:

- **NotificationPreferencesPanel**: Показать lock icon + message
  - "🔒 Подключите Telegram, чтобы настроить уведомления"
- **QuietHoursConfiguration**: Скрыть полностью (не показывать disabled)

**Behavior:**

- Клик на CTA → открывает Telegram Binding Modal (см. Q1)
- После успешного binding → hero banner исчезает, показываются active cards

**Accessibility:**

- role="region" на hero banner
- aria-label="Онбординг Telegram уведомлений"
- Heading hierarchy: H1 (page) → H2 (hero) → H3 (card titles)

---

### Q20: Status Indicator (Header) ⭐ CRITICAL

**Вопрос**: Как показать статус привязки Telegram в header/sidebar?

**Ответ**: **A) Иконка 🔔 (bound) / 🔕 (not bound) с badge**

**Обоснование:**

- ✅ **Universal icon**: Bell = notifications (общепринятый символ)
- ✅ **At-a-glance status**: Цвет badge показывает состояние без клика
- ✅ **Space-efficient**: Компактно вписывается в header/sidebar
- ✅ **Clickable**: Navigate to settings page

**Визуальный дизайн:**

**Header Placement (Desktop):**

```
┌────────────────────────────────────────────────────────┐
│  WB Repricer          [🔍] [🔔] [💬] [@user]          │ ← Top Navbar
│                              ↑                          │
│                         Status Indicator                │
└────────────────────────────────────────────────────────┘
```

**Indicator States:**

**1. Telegram Bound (Connected):**

```
  🔔 ← Bell icon (24x24px, Telegram Blue #0088CC)
  ●  ← Green badge (8x8px circle, Success Green #4CAF50)
      positioned top-right of bell
```

**2. Telegram Not Bound:**

```
  🔕 ← Muted bell icon (24x24px, Gray 400 #BDBDBD)
  ●  ← Gray badge (8x8px circle, Gray 400 #BDBDBD)
```

**Технические детали:**

**Icon Design:**

- **Size**: 24x24px (consistent с другими header icons)
- **Color (bound)**: Telegram Blue (#0088CC)
- **Color (not bound)**: Gray 400 (#BDBDBD)
- **Badge**: 8x8px circle, absolute position top-right

**Badge Position:**

```css
.notification-icon {
  position: relative;
  width: 24px;
  height: 24px;
}

.status-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid white; /* outline для visibility */
}

.status-badge.connected {
  background: #4CAF50; /* Success Green */
}

.status-badge.disconnected {
  background: #BDBDBD; /* Gray 400 */
}
```

**Tooltip:**

- **Hover (bound)**: "Telegram подключен (@username). Нажмите для настройки."
- **Hover (not bound)**: "Telegram не подключен. Нажмите для подключения."
- **Position**: Below icon
- **Background**: Gray 800 (#424242), white text
- **Delay**: 300ms (не показывать мгновенно)

**Click Behavior:**

- Click → navigate to `/settings/notifications`
- Если not bound → показать hero banner с CTA
- Если bound → показать settings page

**Sidebar Alternative (если нужен):**

```
┌─────────────────────────┐
│  Dashboard              │
│  COGS Management        │
│  Analytics              │
│  Settings               │
│    • Profile            │
│    • Уведомления 🔔●    │ ← Indicator inline
│  Logout                 │
└─────────────────────────┘
```

**Responsive Behavior:**

- **Desktop**: Header navbar (right side)
- **Tablet**: Header navbar (icons may be slightly smaller)
- **Mobile**: Может быть спрятан в hamburger menu или показан в collapsed navbar

**Accessibility:**

- aria-label="Telegram notifications status: connected" или "...not connected"
- role="button"
- aria-describedby="notification-tooltip"
- Keyboard accessible (Tab to focus, Enter to navigate)

---

## General Design Questions

### Q21: UI Локализация

**Вопрос**: Откуда взять переводы для UI элементов (labels, buttons)?

**Ответ**: **Пока только русский, английские переводы добавим позже**

**Обоснование:**

- ✅ **Target audience**: Основная аудитория — русскоязычные продавцы на Wildberries
- ✅ **Simplicity**: Не усложняем первую версию, focus на функциональность
- ✅ **Future-ready**: Можно добавить i18n позже, когда появится demand

**Approach:**

**Сейчас (v1):**

- Все UI элементы на русском языке
- Hardcoded strings в компонентах
- Комментарии в коде: `// TODO: i18n - extract to translations`

**В будущем (v2):**

- Добавить i18n library (например, `next-intl` или `react-i18next`)
- Создать translation files:
  - `ru.json` (русский, default)
  - `en.json` (английский)
- Извлечь все строки из компонентов в translation keys

**Примеры строк для перевода:**

```javascript
// Current (v1 - hardcoded Russian)
<Button>Подключить Telegram</Button>
<Label>Язык уведомлений:</Label>
<Text>Сохранить настройки</Text>

// Future (v2 - with i18n)
<Button>{t('telegram.connect')}</Button>
<Label>{t('settings.language_label')}</Label>
<Text>{t('actions.save_settings')}</Text>
```

**Translation Keys Structure (для будущего):**

```json
{
  "telegram": {
    "connect": "Подключить Telegram",
    "disconnect": "Отключить Telegram",
    "status_connected": "Подключен",
    "status_not_connected": "Не подключен"
  },
  "settings": {
    "language_label": "Язык уведомлений:",
    "quiet_hours": "Тихие часы",
    "timezone": "Часовой пояс"
  },
  "actions": {
    "save_settings": "Сохранить настройки",
    "cancel": "Отменить",
    "send_test": "Отправить тестовое уведомление"
  }
}
```

**Note:**

- Язык уведомлений (ru/en) — это ОТДЕЛЬНАЯ настройка (для Telegram-сообщений)
- Язык UI — это будущая фича (сейчас только русский)

---

### Q22: Error States

**Вопрос**: Как показать ошибки?

**Ответ**: **C) Both: toast для API errors, inline для validation**

**Обоснование:**

- ✅ **Context-appropriate**: Разные типы ошибок требуют разного feedback
- ✅ **Immediate feedback**: Validation errors показываются сразу при вводе
- ✅ **Non-blocking**: Toast для API errors не блокирует UI

**Error Types & Display:**

**1. Validation Errors (Inline)**

```
┌──────────────────────────────────────────┐
│  С:  [99:99 ▼]  ← Invalid input           │
│  ⚠️ Неверный формат времени               │ ← Inline error (below field)
│     (используйте HH:MM)                   │
└──────────────────────────────────────────┘
```

**Inline Error Design:**

- **Icon**: ⚠️ warning (16x16px, Error Red #E53935)
- **Text**: 14px, regular, Error Red (#E53935)
- **Position**: Below invalid field, 4px margin-top
- **Background**: None (just red text)

**2. API Errors (Toast Notification)**

```
┌──────────────────────────────────────────┐
│  ❌ Не удалось сохранить настройки        │ ← Toast (top-right corner)
│     Попробуйте ещё раз или обновите       │
│     страницу.                             │
│                                      [×]  │
└──────────────────────────────────────────┘
```

**Toast Design:**

- **Background**: Error Red (#E53935)
- **Text**: White, 14px, medium
- **Icon**: ❌ cross mark (20x20px, white)
- **Position**: Top-right corner, fixed
- **Width**: 320px (desktop), 90% screen width (mobile)
- **Padding**: 16px 20px
- **Border-radius**: 8px
- **Shadow**: shadow-lg
- **Duration**: 5 seconds auto-dismiss (или manual close)
- **Close button**: X icon (16x16px, white)

**3. Network Errors (Toast + Retry)**

```
┌──────────────────────────────────────────┐
│  🌐 Ошибка сети                           │
│     Проверьте подключение к интернету     │
│                                           │
│     [Повторить попытку]             [×]  │
└──────────────────────────────────────────┘
```

**4. Session Expired (Modal)**

```
┌──────────────────────────────────────────┐
│  Сессия истекла                        [×]│
│  ────────────────────────────────────────│
│                                           │
│  Ваша сессия истекла. Пожалуйста,         │
│  войдите снова.                           │
│                                           │
│  [Войти]                                  │
│                                           │
└──────────────────────────────────────────┘
```

**Error Messages (Examples):**

**Validation:**

- "Неверный формат времени (используйте HH:MM)"
- "Начало тихих часов должно отличаться от конца"
- "Пожалуйста, выберите хотя бы один тип события"

**API:**

- "Не удалось сохранить настройки. Попробуйте ещё раз."
- "Telegram уже подключен к другому аккаунту"
- "Код верификации истёк. Пожалуйста, получите новый код."

**Network:**

- "Ошибка сети. Проверьте подключение к интернету."
- "Сервер не отвечает. Попробуйте позже."

**Accessibility:**

- role="alert" на toast notifications
- aria-live="assertive" для критичных ошибок
- aria-describedby связывает поле с inline error

---

### Q23: Loading States

**Вопрос**: Как показать loading states?

**Ответ**: **B) Spinners на кнопках (при сохранении) + Skeleton для initial load**

**Обоснование:**

- ✅ **Context-specific**: Показывает, ЧТО именно загружается
- ✅ **Non-blocking**: Skeleton позволяет видеть структуру страницы
- ✅ **User control**: Button spinners показывают, что action в процессе

**Loading State Types:**

**1. Initial Page Load (Skeleton Loaders)**

```
┌──────────────────────────────────────────┐
│  ████████████████░░░░░░░░░░░░░░░░░░░░░   │ ← Title skeleton
│  ──────────────────────────────────────  │
│                                           │
│  ┌──────────────────────────────────────┐│
│  │ ████████░░░░░░░░                      ││ ← Card skeleton
│  │ ░░░░░░░░░░░░░░░░░░░░                  ││
│  │ ████████████░░░░░░                    ││
│  └──────────────────────────────────────┘│
│                                           │
└──────────────────────────────────────────┘
```

**Skeleton Design:**

- **Background**: Gray 200 (#EEEEEE)
- **Animation**: Shimmer effect (gradient moving left-to-right)
- **Shape**: Matches actual content (text lines, buttons, cards)
- **Duration**: Показывается пока `isLoading === true`

**2. Button Loading (Spinners)**

```
┌──────────────────────────────────────────┐
│  [⏳ Сохранение...]                       │ ← Button with spinner
│   ↑ Spinner (16x16px)                     │
└──────────────────────────────────────────┘
```

**Button Loading States:**

**"Сохранить настройки" (loading):**

- Background: Primary Red (#E53935) — same color, NOT disabled gray
- Text: "Сохранение..." (white, 14px)
- Icon: Spinner animation (16x16px, white, 1s rotation)
- Disabled: `disabled={true}` (prevent double-click)
- Width: Fixed width (не меняется при изменении текста)

**"Подключить Telegram" (loading):**

- Background: Telegram Blue (#0088CC)
- Text: "Подключение..."
- Icon: Spinner (16x16px, white)

**3. Polling Indicator (Binding Process)**

```
┌──────────────────────────────────────────┐
│  ⏳ Ожидаем подтверждения...              │ ← Spinner + text
│     (см. Q4)                              │
└──────────────────────────────────────────┘
```

**4. Time Picker Loading (Fetching Preferences)**

- Time picker: Disabled state (gray background) + skeleton value
- Spinner: Small (12x12px) внутри input field (right side)

**Spinner Design:**

```css
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Loading State Priorities:**

1. **Critical**: Button actions (save, connect) — показать сразу
2. **Important**: Initial page load — skeleton loaders
3. **Secondary**: Polling indicators — subtle, non-blocking

**Accessibility:**

- aria-busy="true" на loading elements
- aria-label="Сохранение настроек..." на button spinner
- Screen reader announcement: "Загрузка страницы настроек..."

---

### Q24: Success Feedback

**Вопрос**: Как показать успешное сохранение?

**Ответ**: **B) Toast + checkmark animation на кнопке**

**Обоснование:**

- ✅ **Double feedback**: Toast для visibility, checkmark для direct feedback
- ✅ **Clear confirmation**: Пользователь точно знает, что действие успешно
- ✅ **Satisfying**: Checkmark animation даёт ощущение "завершённости"

**Success Feedback Flow:**

**1. User clicks "Сохранить настройки"**

```
[Сохранить настройки] → Click
```

**2. Button loading state (200ms)**

```
[⏳ Сохранение...] ← Spinner + text
```

**3. Success response received**

```
[✓ Сохранено] ← Checkmark animation (500ms)
  ↑ Checkmark fades in + slight scale animation
```

**4. Button returns to normal + Toast appears**

```
[Сохранить настройки] ← Disabled (no changes)

┌──────────────────────────────────────────┐
│  ✅ Настройки сохранены                   │ ← Success toast (top-right)
│                                      [×]  │
└──────────────────────────────────────────┘
```

**Success Toast Design:**

- **Background**: Success Green (#4CAF50)
- **Text**: White, 14px, medium
- **Icon**: ✅ checkmark (20x20px, white)
- **Position**: Top-right corner, fixed
- **Width**: 280px (desktop), 90% screen width (mobile)
- **Padding**: 16px 20px
- **Border-radius**: 8px
- **Shadow**: shadow-lg
- **Duration**: 3 seconds auto-dismiss
- **Animation**: Slide-in from right (200ms ease-out)

**Button Checkmark Animation:**

```css
/* Checkmark appears */
.checkmark-icon {
  animation: checkmark-pop 500ms ease-out;
}

@keyframes checkmark-pop {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
```

**Timeline:**

1. Click → 0ms: Button loading state
2. API response → 200ms: Checkmark animation starts
3. Checkmark visible → 500ms: Toast appears
4. Toast auto-dismiss → 3500ms: Toast fades out

**Success Messages (Examples):**

- "Настройки сохранены"
- "Telegram подключен"
- "Тестовое уведомление отправлено"
- "Тихие часы обновлены"

**Alternative Success Indicators:**

**For Test Notification:**

```
┌──────────────────────────────────────────┐
│  ✅ Тестовое уведомление отправлено       │
│     Проверьте Telegram                    │
└──────────────────────────────────────────┘
```

**For Telegram Connected:**

```
┌──────────────────────────────────────────┐
│  ✅ Telegram подключен                    │
│     Добро пожаловать, @username!          │
└──────────────────────────────────────────┘
```

**Accessibility:**

- role="status" на toast
- aria-live="polite" (не перебивает screen reader)
- aria-label="Настройки успешно сохранены" на checkmark

---

### Q25: Responsive Breakpoints

**Вопрос**: Какие breakpoints использовать?

**Ответ**: **Используем стандартные Tailwind breakpoints проекта**

**Breakpoints:**

- **Mobile**: `<640px` (default, no prefix)
- **Tablet**: `640px - 1024px` (sm: and md:)
- **Desktop**: `>1024px` (lg: and xl:)

**Обоснование:**

- ✅ **Consistency**: Соответствует всему проекту (см. `front-end-spec.md`)
- ✅ **Tailwind default**: Не нужно переопределять breakpoints
- ✅ **Well-tested**: Проверенные значения для большинства устройств

**Responsive Behavior by Component:**

### **Telegram Binding Modal**

- **Desktop (>1024px)**: 480-560px width, centered
- **Tablet (640-1024px)**: 90% screen width, centered
- **Mobile (<640px)**: Full-screen modal (100% width, 100% height)

### **Event Type Cards**

- **Desktop**: Grid 1 column, full-width cards
- **Tablet**: Same as desktop
- **Mobile**: Same layout, reduced padding (20px → 16px)

### **Language Switcher**

- **Desktop**: Horizontal radio buttons (side-by-side)
- **Tablet**: Horizontal (если помещается)
- **Mobile**: Vertical stack (full-width buttons) если не помещается

### **Time Pickers**

- **Desktop**: Fixed width 120px
- **Tablet**: Fixed width 120px
- **Mobile**: Full-width inputs

### **Timezone Dropdown**

- **Desktop**: 240px width
- **Tablet**: 200px width
- **Mobile**: Full-width

### **Action Bar (Save buttons)**

- **Desktop**: Horizontal layout, right-aligned
  ```
  [Отменить]              [Сохранить настройки]
  ```
- **Tablet**: Same as desktop
- **Mobile**: Vertical stack, full-width buttons
  ```
  [Сохранить настройки] ← Primary (top)
  [Отменить]            ← Secondary (bottom)
  ```

**Tailwind CSS Examples:**

```jsx
// Mobile-first approach
<div className="
  w-full              /* Mobile: full-width */
  sm:w-80             /* Tablet: 320px */
  lg:w-96             /* Desktop: 384px */
">
  <Button className="
    w-full            /* Mobile: full-width */
    sm:w-auto         /* Tablet+: auto width */
  ">
    Сохранить
  </Button>
</div>
```

**Typography Scaling:**

- **H1 (Page Title)**:
  - Mobile: 28px
  - Tablet: 32px
  - Desktop: 36px
- **H2 (Card Title)**:
  - Mobile: 20px
  - Tablet: 22px
  - Desktop: 24px
- **Body**:
  - Mobile: 14px
  - Tablet: 14px
  - Desktop: 16px

**Spacing Scaling:**

- **Page padding**:
  - Mobile: 16px
  - Tablet: 20px
  - Desktop: 24px
- **Card spacing**:
  - Mobile: 16px
  - Tablet: 20px
  - Desktop: 24px
- **Card padding**:
  - Mobile: 16px
  - Tablet: 20px
  - Desktop: 24px

**Touch Target Sizes (Mobile):**

- Buttons: Minimum 44x44px
- Toggles: 44x24px track
- Radio buttons: 44x44px hit area
- Time pickers: 44px height
- Dropdown triggers: 44px height

**Testing Strategy:**

- Test on physical devices: iPhone SE (375px), iPad (768px), Desktop (1280px)
- Chrome DevTools: Responsive mode
- Safari iOS: Real device testing

---

## 🎯 Summary: Critical Design Decisions

Вот **ключевые решения**, которые блокируют разработку (требуют немедленного approval):

| Question                  | Decision                         | Rationale                                   |
| ------------------------- | -------------------------------- | ------------------------------------------- |
| **Q1: Modal Layout**      | ✅ Центрированный modal overlay  | Согласованность с проектом, mobile-friendly |
| **Q2: Countdown Timer**   | ✅ Линейный прогресс-бар + текст | Двойной feedback (точность + визуал)        |
| **Q10: Save Strategy**    | ✅ Manual save button            | User control, consistency, error prevention |
| **Q16: Card Layout**      | ✅ Вертикальный stack            | Mobile-first, consistency, simplicity       |
| **Q19: Empty State**      | ✅ Hero banner с CTA             | High visibility, educational, clear CTA     |
| **Q20: Status Indicator** | ✅ Bell icon 🔔 с badge          | Universal, at-a-glance, space-efficient     |

---

## 📝 Next Steps (для Product Owner)

После approval этих ответов:

1. ✅ **Create Story Files**: Создать individual story files для каждой Story 34.x-FE
2. ✅ **Wireframe Creation** (optional): Figma wireframes на базе этих ответов
3. ✅ **Frontend Planning Session**: Обсудить с frontend team оценки и timeline
4. ✅ **Component Specs**: Детализировать spacing, colors, typography для каждого компонента
5. ✅ **Accessibility Review**: Финальная проверка WCAG compliance

---

**Готово! Все 25 вопросов answered с детальными рекомендациями и обоснованиями.**

**Created**: 2025-12-29
**Author**: Sally (UX Expert)
**Status**: ✅ Ready for PO Review

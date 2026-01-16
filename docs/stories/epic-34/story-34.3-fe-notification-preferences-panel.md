# Story 34.3-FE: Notification Preferences Panel

**Epic**: Epic 34-FE - Telegram Notifications UI
**Story ID**: Story 34.3-FE
**Effort**: 5 SP (8-12 hours)
**Status**: ✅ UX Design Approved, 📋 Ready for Development
**Dependencies**: Story 34.1-FE (Types & API Client)
**UX Answers**: Q6-Q10 from UX-ANSWERS-EPIC-34-FE.md

---

## 📋 Summary

Implement notification preferences panel allowing users to configure event types, language, daily digest, and save settings. Includes 4 event type cards, language switcher, and manual save strategy.

---

## 🎯 User Story

**As a** seller using WB Repricer System
**I want to** customize which notifications I receive and when
**So that** I only get relevant alerts that match my workflow preferences

---

## ✅ Acceptance Criteria

### 1. Event Type Cards (Q6 - Border Highlight)
- [ ] 4 event type cards: task_completed, task_failed, task_stalled, daily_digest
- [ ] Enabled state: 2px Telegram Blue border, checkmark icon
- [ ] Disabled state: 1px Gray 300 border, empty checkbox icon
- [ ] Toggle switch (shadcn/ui Switch) on each card
- [ ] Click anywhere on card to toggle switch

### 2. Event Descriptions (Q7 - Always Visible)
- [ ] Description text visible under each event title
- [ ] Max 2 lines with truncation (line-clamp-2)
- [ ] Clear, specific explanations of when notifications sent
- [ ] 14px regular font, Gray 600 color

### 3. Language Switcher (Q8 - Radio Buttons)
- [ ] Two radio buttons: 🇷🇺 Русский | 🇬🇧 English
- [ ] Horizontal layout (side-by-side)
- [ ] Selected state: Telegram Blue border, light blue background
- [ ] Unselected state: Gray 300 border, white background

### 4. Daily Digest Section (Q9 - Conditional Time Picker)
- [ ] Daily digest as standard event type card
- [ ] Time picker appears ONLY when digest enabled
- [ ] Slide-down animation (200ms) when showing/hiding
- [ ] Default time: 08:00
- [ ] Time picker uses native `<input type="time">` (mobile-friendly)

### 5. Save Strategy (Q10 - Manual Save Button) ⭐ CRITICAL
- [ ] "Сохранить настройки" button at bottom (Primary Red #E53935)
- [ ] "Отменить" button (secondary, resets to last saved state)
- [ ] Dirty state detection (unsaved changes warning)
- [ ] Navigation prevention when unsaved changes exist
- [ ] Success toast: "Настройки сохранены" (3s auto-dismiss)
- [ ] Button disabled when no changes made

### 6. Accessibility (WCAG 2.1 AA)
- [ ] Keyboard navigation between all interactive elements
- [ ] aria-labels on all toggles and buttons
- [ ] aria-describedby linking titles to descriptions
- [ ] Screen reader announces state changes

---

## 📝 Component Specifications

### Component: `NotificationPreferencesPanel.tsx`

**Location**: `src/components/notifications/NotificationPreferencesPanel.tsx`

**Purpose**: Main preferences panel with event types, language, and save logic

#### Props
```typescript
interface NotificationPreferencesPanelProps {
  disabled?: boolean;  // Disable when Telegram not bound
}
```

#### Visual Mockup (Desktop)
```
┌──────────────────────────────────────────────────────────────┐
│  ⚙️ Настройки уведомлений                                     │
│  ──────────────────────────────────────────────────────────  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ☑️ Задача выполнена успешно                       [●]│  │ ← ENABLED
│  │                                                        │  │   (2px Telegram Blue border)
│  │  Уведомления при завершении импорта, синхронизации,   │  │
│  │  расчёта маржи                                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │  ← 12px spacing
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ☐ Задача завершилась с ошибкой                    [○]│  │ ← DISABLED
│  │                                                        │  │   (1px Gray 300 border)
│  │  Уведомления при ошибках после всех попыток retry    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ☐ Задача зависла                                  [○]│  │
│  │                                                        │  │
│  │  Уведомления когда задача выполняется более 30 минут  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ☑️ Ежедневный дайджест                            [●]│  │
│  │                                                        │  │
│  │  Сводка за день: успешные, ошибки, задачи в очереди   │  │
│  │                                                        │  │
│  │  🕐 Время отправки: [08:00 ▼]  ← Conditional          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │  ← 20px spacing
│  Язык уведомлений:                                             │
│                                                                │
│  ⚫ 🇷🇺 Русский     ⚪ 🇬🇧 English                             │
│                                                                │
│  ──────────────────────────────────────────────────────────  │
│                                                                │
│  ⚠️ У вас есть несохранённые изменения  ← Warning banner      │
│                                                                │
│  [Отменить]                        [Сохранить настройки]      │
│  (secondary)                              (primary)            │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

#### Code Structure
```typescript
function NotificationPreferencesPanel({ disabled = false }: Props) {
  const { preferences, updatePreferences, isUpdating } = useNotificationPreferences();

  // Local state for form
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync local state with fetched preferences
  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
      setHasUnsavedChanges(false);
    }
  }, [preferences]);

  // Detect changes
  useEffect(() => {
    if (preferences) {
      const hasChanges = JSON.stringify(localPreferences) !== JSON.stringify(preferences);
      setHasUnsavedChanges(hasChanges);
    }
  }, [localPreferences, preferences]);

  // Event type toggle handler
  const toggleEventType = (eventType: keyof typeof preferences.preferences) => {
    setLocalPreferences((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [eventType]: !prev.preferences[eventType],
      },
    }));
  };

  // Language change handler
  const changeLanguage = (lang: 'ru' | 'en') => {
    setLocalPreferences((prev) => ({
      ...prev,
      language: lang,
    }));
  };

  // Digest time change handler
  const changeDigestTime = (time: string) => {
    setLocalPreferences((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        digest_time: time,
      },
    }));
  };

  // Save handler
  const handleSave = () => {
    updatePreferences(localPreferences, {
      onSuccess: () => {
        toast.success('Настройки сохранены');
        setHasUnsavedChanges(false);
      },
      onError: () => {
        toast.error('Не удалось сохранить настройки. Попробуйте ещё раз.');
      },
    });
  };

  // Cancel handler (reset to last saved)
  const handleCancel = () => {
    setLocalPreferences(preferences);
    setHasUnsavedChanges(false);
  };

  // Navigation prevention when unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (!localPreferences) return <SkeletonLoader />;

  return (
    <Card className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚙️</span>
          <h3 className="text-2xl font-semibold">Настройки уведомлений</h3>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Event Type Cards */}
        <div className="space-y-3">
          <EventTypeCard
            title="Задача выполнена успешно"
            description="Уведомления при завершении импорта, синхронизации, расчёта маржи"
            enabled={localPreferences.preferences.task_completed}
            onToggle={() => toggleEventType('task_completed')}
          />

          <EventTypeCard
            title="Задача завершилась с ошибкой"
            description="Уведомления при ошибках после всех попыток retry"
            enabled={localPreferences.preferences.task_failed}
            onToggle={() => toggleEventType('task_failed')}
          />

          <EventTypeCard
            title="Задача зависла"
            description="Уведомления когда задача выполняется более 30 минут"
            enabled={localPreferences.preferences.task_stalled}
            onToggle={() => toggleEventType('task_stalled')}
          />

          {/* Daily Digest with Conditional Time Picker */}
          <EventTypeCard
            title="Ежедневный дайджест"
            description="Сводка за день: успешные задачи, ошибки, задачи в очереди"
            enabled={localPreferences.preferences.daily_digest}
            onToggle={() => toggleEventType('daily_digest')}
          >
            {/* Conditional Time Picker */}
            {localPreferences.preferences.daily_digest && (
              <div className="mt-3 animate-slide-down">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span>🕐</span>
                  Время отправки:
                  <input
                    type="time"
                    value={localPreferences.preferences.digest_time}
                    onChange={(e) => changeDigestTime(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-telegram-blue"
                  />
                </label>
              </div>
            )}
          </EventTypeCard>
        </div>

        {/* Language Switcher */}
        <div className="pt-4">
          <label className="block text-base font-medium text-gray-700 mb-3">
            Язык уведомлений:
          </label>
          <div className="flex gap-4">
            <LanguageRadio
              value="ru"
              label="🇷🇺 Русский"
              selected={localPreferences.language === 'ru'}
              onSelect={() => changeLanguage('ru')}
            />
            <LanguageRadio
              value="en"
              label="🇬🇧 English"
              selected={localPreferences.language === 'en'}
              onSelect={() => changeLanguage('en')}
            />
          </div>
        </div>

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <Alert variant="warning" className="bg-orange-50 border-orange-500">
            <span className="text-orange-700">⚠️ У вас есть несохранённые изменения</span>
          </Alert>
        )}

        {/* Action Bar */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center gap-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={!hasUnsavedChanges || isUpdating}
            >
              Отменить
            </Button>

            <Button
              variant="default"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isUpdating}
              className="bg-primary-red hover:bg-primary-red-dark"
            >
              {isUpdating ? (
                <>
                  <Spinner className="mr-2" />
                  Сохранение...
                </>
              ) : (
                <>
                  <span className="mr-2">✓</span>
                  Сохранить настройки
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Component: `EventTypeCard.tsx`

**Location**: `src/components/notifications/EventTypeCard.tsx`

**Purpose**: Reusable card for each notification event type

#### Props
```typescript
interface EventTypeCardProps {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  children?: React.ReactNode;  // For conditional time picker
}
```

#### Code Structure
```typescript
function EventTypeCard({ title, description, enabled, onToggle, children }: Props) {
  return (
    <div
      onClick={onToggle}
      className={cn(
        'relative cursor-pointer rounded-lg p-5 transition-all',
        'hover:shadow-md',
        enabled
          ? 'border-2 border-telegram-blue bg-white shadow-sm'
          : 'border border-gray-300 bg-white'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Icon + Title + Description */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">
              {enabled ? '☑️' : '☐'}
            </span>
            <h4 className="text-base font-medium text-gray-800">
              {title}
            </h4>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2">
            {description}
          </p>
        </div>

        {/* Toggle Switch */}
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          onClick={(e) => e.stopPropagation()} // Prevent double-toggle
          className={cn(
            'data-[state=checked]:bg-telegram-blue',
            'data-[state=unchecked]:bg-gray-300'
          )}
          aria-label={`Переключить уведомления: ${title}`}
        />
      </div>

      {/* Conditional Content (e.g., time picker for daily digest) */}
      {children}
    </div>
  );
}
```

---

### Component: `LanguageRadio.tsx`

**Location**: `src/components/notifications/LanguageRadio.tsx`

**Purpose**: Custom radio button for language selection

#### Props
```typescript
interface LanguageRadioProps {
  value: 'ru' | 'en';
  label: string;  // e.g., "🇷🇺 Русский"
  selected: boolean;
  onSelect: () => void;
}
```

#### Code Structure
```typescript
function LanguageRadio({ value, label, selected, onSelect }: Props) {
  return (
    <label
      className={cn(
        'flex items-center gap-2 px-5 py-3 rounded-lg cursor-pointer transition-all',
        'border-2',
        selected
          ? 'border-telegram-blue bg-blue-50 text-gray-800 font-medium'
          : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
      )}
    >
      <input
        type="radio"
        name="language"
        value={value}
        checked={selected}
        onChange={onSelect}
        className="sr-only"  // Hide native radio, use custom styling
      />

      {/* Custom Radio Circle */}
      <div className={cn(
        'w-5 h-5 rounded-full border-2 flex items-center justify-center',
        selected
          ? 'border-telegram-blue'
          : 'border-gray-400'
      )}>
        {selected && (
          <div className="w-3 h-3 rounded-full bg-telegram-blue" />
        )}
      </div>

      <span>{label}</span>
    </label>
  );
}
```

---

## 🎨 Design Specifications

### Event Type Card States
```typescript
// Enabled state
const enabledCardStyles = {
  border: '2px solid #0088CC',  // Telegram Blue
  background: '#FFFFFF',
  shadow: 'shadow-sm',
  icon: '☑️',
  toggleBg: '#0088CC',
};

// Disabled state
const disabledCardStyles = {
  border: '1px solid #E0E0E0',  // Gray 300
  background: '#FFFFFF',
  shadow: 'none',
  icon: '☐',
  toggleBg: '#E0E0E0',
  textColor: 'text-gray-600',  // Description slightly muted
};
```

### Language Switcher States
```typescript
// Selected state
const selectedLanguageStyles = {
  border: '2px solid #0088CC',
  background: '#E3F2FD',  // Light Blue
  text: '#424242',        // Gray 800
  fontWeight: 'medium',
};

// Unselected state
const unselectedLanguageStyles = {
  border: '1px solid #E0E0E0',
  background: '#FFFFFF',
  text: '#757575',  // Gray 600
  fontWeight: 'regular',
};
```

### Save Button States
```typescript
// Primary button (enabled)
const saveButtonEnabled = {
  background: '#E53935',     // Primary Red
  text: 'white',
  icon: '✓',
  hover: '#D32F2F',
};

// Disabled state (no changes)
const saveButtonDisabled = {
  background: '#E0E0E0',     // Gray 300
  text: '#757575',           // Gray 600
  cursor: 'not-allowed',
};

// Loading state
const saveButtonLoading = {
  background: '#E53935',
  text: 'Сохранение...',
  spinner: true,
};
```

### Spacing & Layout
```typescript
const spacing = {
  cardGap: 'space-y-3',          // 12px between event cards
  sectionGap: 'space-y-5',       // 20px between major sections
  cardPadding: 'p-5',            // 20px
  actionBarMarginTop: 'pt-6',   // 24px
};
```

### Animations
```css
/* Slide-down animation for time picker */
@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-down {
  animation: slide-down 200ms ease-out;
}
```

---

## 🧪 Testing Requirements

### Unit Tests
```typescript
describe('NotificationPreferencesPanel', () => {
  it('toggles event type on card click', () => {
    render(<NotificationPreferencesPanel />);

    const card = screen.getByText('Задача выполнена успешно').closest('div');
    fireEvent.click(card);

    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('shows time picker when daily digest enabled', () => {
    render(<NotificationPreferencesPanel />);

    const digestCard = screen.getByText('Ежедневный дайджест').closest('div');
    fireEvent.click(digestCard);

    expect(screen.getByLabelText(/Время отправки/)).toBeInTheDocument();
  });

  it('enables save button when changes made', async () => {
    render(<NotificationPreferencesPanel />);

    const saveButton = screen.getByText('Сохранить настройки');
    expect(saveButton).toBeDisabled();

    // Make a change
    const card = screen.getByText('Задача выполнена успешно').closest('div');
    fireEvent.click(card);

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
  });

  it('shows unsaved changes warning', async () => {
    render(<NotificationPreferencesPanel />);

    // Make a change
    const card = screen.getByText('Задача выполнена успешно').closest('div');
    fireEvent.click(card);

    await waitFor(() => {
      expect(screen.getByText(/несохранённые изменения/)).toBeInTheDocument();
    });
  });

  it('resets changes on cancel', () => {
    render(<NotificationPreferencesPanel />);

    // Make a change
    const card = screen.getByText('Задача выполнена успешно').closest('div');
    fireEvent.click(card);

    // Click cancel
    const cancelButton = screen.getByText('Отменить');
    fireEvent.click(cancelButton);

    // Verify changes reverted
    expect(screen.queryByText(/несохранённые изменения/)).not.toBeInTheDocument();
  });
});
```

---

## 📦 Dependencies

**shadcn/ui Components**:
```bash
npx shadcn-ui@latest add card
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add button
npx shadcn-ui@latest add alert
```

**Additional Utils**:
- `react-hot-toast` for notifications
- `clsx` or `cn` utility for conditional classes

---

## 🚀 Implementation Order

1. **Phase 1: Event Type Cards** (3-4h)
   - Create `EventTypeCard` component
   - Implement toggle logic
   - Add border highlight states
   - Add descriptions

2. **Phase 2: Language Switcher** (1-2h)
   - Create `LanguageRadio` component
   - Implement radio button group
   - Add selected/unselected states

3. **Phase 3: Daily Digest Conditional** (1-2h)
   - Add time picker to daily digest card
   - Implement slide-down animation
   - Handle conditional rendering

4. **Phase 4: Save Strategy** (2-3h) ⭐ CRITICAL
   - Implement dirty state detection
   - Add save/cancel buttons
   - Add navigation prevention
   - Add success/error toasts

5. **Phase 5: Testing** (2-3h)
   - Write unit tests
   - Test unsaved changes flow
   - Test mobile responsive layout

---

## ✅ Definition of Done

- [ ] All 6 acceptance criteria met (Q6-Q10)
- [ ] Event type cards toggle correctly with visual feedback
- [ ] Language switcher works on desktop and mobile
- [ ] Daily digest time picker shows/hides conditionally
- [ ] **Manual save button prevents data loss** ⭐
- [ ] Unsaved changes warning appears when needed
- [ ] Navigation prevention works when unsaved changes exist
- [ ] Mobile responsive (<640px: vertical stack, full-width)
- [ ] WCAG 2.1 AA compliance verified
- [ ] Unit tests passing (>80% coverage)
- [ ] Code review completed

---

**Created**: 2025-12-29
**Author**: Claude Code
**UX Design**: Sally (UX Expert)
**Status**: 📋 Ready for Development
**Previous Story**: Story 34.2-FE (Telegram Binding Flow)
**Next Story**: Story 34.4-FE (Quiet Hours & Timezone Configuration)

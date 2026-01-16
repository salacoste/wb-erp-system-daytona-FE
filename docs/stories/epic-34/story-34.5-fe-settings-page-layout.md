# Story 34.5-FE: Settings Page Layout

**Epic**: Epic 34-FE - Telegram Notifications UI
**Story ID**: Story 34.5-FE
**Effort**: 3 SP (5-7 hours)
**Status**: ✅ UX Design Approved, 📋 Ready for Development
**Dependencies**: Stories 34.1-34.4 (All component stories)
**UX Answers**: Q16-Q20 from UX-ANSWERS-EPIC-34-FE.md

---

## 📋 Summary

Integrate all notification components into complete `/settings/notifications` page with proper layout, spacing, responsive behavior, empty states, and header status indicator.

---

## 🎯 User Story

**As a** seller using WB Repricer System
**I want** a well-organized settings page for Telegram notifications
**So that** I can easily configure all notification preferences in one place

---

## ✅ Acceptance Criteria

### 1. Card Layout (Q16 - Vertical Stack) ⭐ CRITICAL
- [ ] Vertical stack layout (one card below another)
- [ ] Three main cards: TelegramBindingCard, NotificationPreferencesPanel, QuietHoursConfiguration
- [ ] Max-width: 1024px, centered on large screens
- [ ] 24px spacing between cards (desktop), 16px (mobile)
- [ ] Consistent card styling (border, shadow, padding)

### 2. Spacing (Q17 - Design System)
- [ ] Page padding: 24px (desktop), 16px (mobile)
- [ ] Card spacing: 24px (desktop), 20px (tablet), 16px (mobile)
- [ ] Section spacing: 32px before action bar
- [ ] Element spacing: 8px (small gaps), 16px (form fields)

### 3. Mobile Layout (Q18 - Expanded Cards)
- [ ] All cards full-width on mobile (<640px)
- [ ] Vertical scroll (no accordion/collapse)
- [ ] Reduced padding: 24px → 16px
- [ ] H1 title: 36px (desktop) → 28px (mobile)
- [ ] Back link: "← Настройки" (instead of full breadcrumbs)

### 4. Empty State (Q19 - Hero Banner) ⭐ CRITICAL
- [ ] Hero banner when Telegram not bound
- [ ] Light Blue gradient background (#E3F2FD → #BBDEFB)
- [ ] Feature list: 3 bullet points with icons
- [ ] Primary CTA: "Подключить Telegram" (Telegram Blue)
- [ ] Disabled preferences card with lock icon hint

### 5. Status Indicator (Q20 - Header Bell Icon) ⭐ CRITICAL
- [ ] Bell icon 🔔 in header/navbar (24x24px)
- [ ] Bound state: Telegram Blue (#0088CC) + Green badge
- [ ] Not bound state: Gray 400 (#BDBDBD) + Gray badge
- [ ] Tooltip: "Telegram подключен (@username)" or "Telegram не подключен"
- [ ] Click navigates to `/settings/notifications`

### 6. Accessibility (WCAG 2.1 AA)
- [ ] Logical heading hierarchy (H1 → H2 → H3)
- [ ] Landmark regions: `<main>` for page content
- [ ] Skip link for keyboard users
- [ ] Focus management on page load

---

## 📝 Page Implementation

### Page: `/app/(dashboard)/settings/notifications/page.tsx`

**Location**: `src/app/(dashboard)/settings/notifications/page.tsx`

**Purpose**: Main settings page integrating all notification components

#### Visual Mockup (Desktop - Bound State)
```
┌────────────────────────────────────────────────────────────────┐
│  Header: [Logo] [Dashboard] [Analytics] [Settings] [🔔●] [@user]│ ← Status indicator
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  Главная > Настройки > Уведомления                              │ ← Breadcrumbs
│                                                                  │
│  📱 Telegram Уведомления                                         │ ← H1 (36px)
│  ──────────────────────────────────────────────────────────────│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📱 Подключение Telegram                                 │  │ ← Card 1
│  │  ────────────────────────────────────────────────────────│  │
│  │  Статус: 🔔 Подключен                                    │  │
│  │  @username                                                │  │
│  │  [Отключить Telegram]                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │  ← 24px spacing
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ⚙️ Настройки уведомлений                                │  │ ← Card 2
│  │  ────────────────────────────────────────────────────────│  │
│  │  [Event Type Cards...]                                   │  │
│  │  [Language Switcher...]                                  │  │
│  │  ⚠️ Несохранённые изменения                              │  │
│  │  [Отменить] [Сохранить настройки]                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │  ← 24px spacing
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🌙 Тихие часы                                            │  │ ← Card 3
│  │  ────────────────────────────────────────────────────────│  │
│  │  [Time Pickers, Timezone...]                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │  ← 32px spacing
│  ──────────────────────────────────────────────────────────────│ ← Divider
│                                                                  │
│  [🔔 Отправить тестовое уведомление]                            │ ← Test button
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

#### Visual Mockup (Empty State - Not Bound)
```
┌────────────────────────────────────────────────────────────────┐
│  Главная > Настройки > Уведомления                              │
│                                                                  │
│  📱 Telegram Уведомления                                         │
│  ──────────────────────────────────────────────────────────────│
│                                                                  │
│  ╔══════════════════════════════════════════════════════════╗  │
│  ║                                                           ║  │
│  ║        📱 Получайте уведомления в Telegram                ║  │ ← Hero Banner
│  ║                                                           ║  │
│  ║  Мгновенные push-уведомления о состоянии ваших задач      ║  │
│  ║  — импорты, синхронизации, расчёты.                       ║  │
│  ║                                                           ║  │
│  ║  ✅ Импорт завершён — Узнавайте о готовности данных       ║  │
│  ║  ⚠️ Ошибка синхронизации — Реагируйте мгновенно          ║  │
│  ║  📊 Ежедневный отчёт — Получайте сводку в удобное время   ║  │
│  ║                                                           ║  │
│  ║             [📱 Подключить Telegram]                      ║  │
│  ║                                                           ║  │
│  ╚══════════════════════════════════════════════════════════╝  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ⚙️ Настройки уведомлений                                │  │ ← Disabled card
│  │  ────────────────────────────────────────────────────────│  │
│  │  🔒 Подключите Telegram, чтобы настроить уведомления     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

#### Code Structure
```typescript
export default function NotificationsSettingsPage() {
  const { status, isBound } = useTelegramBinding();
  const [showBindingModal, setShowBindingModal] = useState(false);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Главная', href: '/dashboard' },
          { label: 'Настройки', href: '/settings' },
          { label: 'Уведомления', href: '/settings/notifications' },
        ]}
      />

      {/* Page Container */}
      <div className="max-w-4xl mx-auto px-6 py-8 sm:px-8 sm:py-10">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span>📱</span>
            Telegram Уведомления
          </h1>
        </div>

        {/* Empty State (Not Bound) */}
        {!isBound ? (
          <div className="space-y-6">
            {/* Hero Banner */}
            <HeroBanner onConnect={() => setShowBindingModal(true)} />

            {/* Disabled Preferences Card */}
            <Card className="opacity-50 pointer-events-none">
              <CardHeader>
                <h3 className="text-2xl font-semibold flex items-center gap-3">
                  <span>⚙️</span>
                  Настройки уведомлений
                </h3>
              </CardHeader>
              <CardContent>
                <Alert className="bg-gray-50 border-gray-300">
                  <span className="text-2xl mr-2">🔒</span>
                  <p className="text-gray-600">
                    Подключите Telegram, чтобы настроить уведомления
                  </p>
                </Alert>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Bound State - All Components */
          <div className="space-y-6">
            {/* Telegram Binding Card */}
            <TelegramBindingCard />

            {/* Notification Preferences Panel */}
            <NotificationPreferencesPanel />

            {/* Quiet Hours Configuration */}
            <QuietHoursConfiguration />

            {/* Test Notification Section */}
            <div className="pt-8 border-t border-gray-200">
              <TestNotificationButton />
            </div>
          </div>
        )}
      </div>

      {/* Binding Modal */}
      <TelegramBindingModal
        open={showBindingModal}
        onOpenChange={setShowBindingModal}
        onSuccess={() => {
          setShowBindingModal(false);
          toast.success('Telegram подключен!');
        }}
      />
    </main>
  );
}
```

---

### Component: `HeroBanner.tsx`

**Location**: `src/components/notifications/HeroBanner.tsx`

**Purpose**: Empty state hero banner with value proposition

#### Props
```typescript
interface HeroBannerProps {
  onConnect: () => void;
}
```

#### Code Structure
```typescript
function HeroBanner({ onConnect }: Props) {
  return (
    <Card className="relative overflow-hidden border-2 border-telegram-blue shadow-lg">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 opacity-70" />

      <CardContent className="relative z-10 py-10 px-8 text-center">
        {/* Icon */}
        <div className="mb-4">
          <span className="text-6xl">📱</span>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          Получайте уведомления в Telegram
        </h2>

        {/* Description */}
        <p className="text-base text-gray-700 max-w-md mx-auto mb-6">
          Мгновенные push-уведомления о состоянии ваших задач — импорты,
          синхронизации, расчёты.
        </p>

        {/* Feature List */}
        <ul className="text-left max-w-md mx-auto mb-8 space-y-2">
          <li className="flex items-start gap-2 text-gray-700">
            <span className="text-xl">✅</span>
            <span>
              <strong>Импорт завершён</strong> — Узнавайте о готовности данных
            </span>
          </li>
          <li className="flex items-start gap-2 text-gray-700">
            <span className="text-xl">⚠️</span>
            <span>
              <strong>Ошибка синхронизации</strong> — Реагируйте на проблемы мгновенно
            </span>
          </li>
          <li className="flex items-start gap-2 text-gray-700">
            <span className="text-xl">📊</span>
            <span>
              <strong>Ежедневный отчёт</strong> — Получайте сводку в удобное время
            </span>
          </li>
        </ul>

        {/* CTA Button */}
        <Button
          size="lg"
          onClick={onConnect}
          className="bg-telegram-blue hover:bg-telegram-blue-dark text-white font-semibold"
        >
          <span className="mr-2 text-xl">📱</span>
          Подключить Telegram
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

### Component: `TelegramStatusIndicator.tsx`

**Location**: `src/components/notifications/TelegramStatusIndicator.tsx`

**Purpose**: Status indicator in header/navbar

#### Props
```typescript
interface TelegramStatusIndicatorProps {
  className?: string;
}
```

#### Code Structure
```typescript
function TelegramStatusIndicator({ className }: Props) {
  const { isBound, status } = useTelegramBinding();
  const router = useRouter();

  const handleClick = () => {
    router.push('/settings/notifications');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className={cn(
              'relative p-2 rounded-lg transition-colors',
              'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-telegram-blue',
              className
            )}
            aria-label={
              isBound
                ? `Telegram подключен (${status?.telegram_username})`
                : 'Telegram не подключен'
            }
          >
            {/* Bell Icon */}
            <span className={cn(
              'text-2xl',
              isBound ? 'text-telegram-blue' : 'text-gray-400'
            )}>
              {isBound ? '🔔' : '🔕'}
            </span>

            {/* Status Badge */}
            <span
              className={cn(
                'absolute top-1 right-1',
                'w-2 h-2 rounded-full border-2 border-white',
                isBound ? 'bg-green-500' : 'bg-gray-400'
              )}
            />
          </button>
        </TooltipTrigger>

        <TooltipContent side="bottom">
          {isBound ? (
            <p>
              Telegram подключен <strong>{status?.telegram_username}</strong>.
              <br />
              Нажмите для настройки.
            </p>
          ) : (
            <p>
              Telegram не подключен.
              <br />
              Нажмите для подключения.
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

### Component: `TestNotificationButton.tsx`

**Location**: `src/components/notifications/TestNotificationButton.tsx`

**Purpose**: Send test notification button

#### Code Structure
```typescript
function TestNotificationButton() {
  const [isSending, setIsSending] = useState(false);

  const handleSendTest = async () => {
    setIsSending(true);
    try {
      await sendTestNotification();
      toast.success('Тестовое уведомление отправлено! Проверьте Telegram.');
    } catch (error) {
      toast.error('Не удалось отправить тестовое уведомление.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSendTest}
      disabled={isSending}
      className="w-full sm:w-auto"
    >
      {isSending ? (
        <>
          <Spinner className="mr-2" />
          Отправка...
        </>
      ) : (
        <>
          <span className="mr-2">🔔</span>
          Отправить тестовое уведомление
        </>
      )}
    </Button>
  );
}
```

---

## 🎨 Design Specifications

### Page Layout
```typescript
const pageLayout = {
  maxWidth: '1024px',
  margin: '0 auto',
  padding: {
    desktop: '24px',
    tablet: '20px',
    mobile: '16px',
  },
};
```

### Card Spacing
```typescript
const cardSpacing = {
  gap: {
    desktop: '24px',   // space-y-6
    tablet: '20px',    // space-y-5
    mobile: '16px',    // space-y-4
  },
  padding: {
    desktop: '24px',
    mobile: '16px',
  },
};
```

### Typography Scaling
```typescript
const typography = {
  h1: {
    desktop: '36px',
    mobile: '28px',
    fontWeight: 'bold',
  },
  h2: {
    desktop: '24px',
    mobile: '20px',
    fontWeight: 'semibold',
  },
  body: {
    desktop: '16px',
    mobile: '14px',
  },
};
```

### Hero Banner Styles
```typescript
const heroBannerStyles = {
  background: 'linear-gradient(to bottom right, #E3F2FD, #BBDEFB)',
  border: '2px solid #0088CC',
  borderRadius: '12px',
  padding: {
    desktop: '40px',
    mobile: '24px',
  },
  shadow: 'shadow-lg',
};
```

### Status Indicator Styles
```typescript
const statusIndicatorStyles = {
  iconSize: '24px',
  badgeSize: '8px',
  colors: {
    bound: {
      icon: '#0088CC',      // Telegram Blue
      badge: '#4CAF50',     // Success Green
    },
    notBound: {
      icon: '#BDBDBD',      // Gray 400
      badge: '#BDBDBD',
    },
  },
};
```

---

## 🧪 Testing Requirements

### Unit Tests
```typescript
describe('NotificationsSettingsPage', () => {
  it('shows hero banner when not bound', () => {
    // Mock useTelegramBinding with isBound: false
    render(<NotificationsSettingsPage />);

    expect(screen.getByText(/Получайте уведомления в Telegram/)).toBeInTheDocument();
    expect(screen.getByText('Подключить Telegram')).toBeInTheDocument();
  });

  it('shows all cards when bound', () => {
    // Mock useTelegramBinding with isBound: true
    render(<NotificationsSettingsPage />);

    expect(screen.getByText('Подключение Telegram')).toBeInTheDocument();
    expect(screen.getByText('Настройки уведомлений')).toBeInTheDocument();
    expect(screen.getByText('Тихие часы')).toBeInTheDocument();
  });

  it('opens binding modal when CTA clicked', () => {
    render(<NotificationsSettingsPage />);

    const ctaButton = screen.getByText('Подключить Telegram');
    fireEvent.click(ctaButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('TelegramStatusIndicator', () => {
  it('shows bound state with green badge', () => {
    // Mock isBound: true
    render(<TelegramStatusIndicator />);

    const indicator = screen.getByLabelText(/Telegram подключен/);
    expect(indicator).toHaveTextContent('🔔');
  });

  it('navigates to settings page on click', () => {
    const router = useRouter();
    render(<TelegramStatusIndicator />);

    const indicator = screen.getByRole('button');
    fireEvent.click(indicator);

    expect(router.push).toHaveBeenCalledWith('/settings/notifications');
  });
});
```

### E2E Tests
```typescript
test('complete settings page flow', async ({ page }) => {
  await page.goto('/settings/notifications');

  // Verify empty state
  await expect(page.locator('text=Получайте уведомления в Telegram')).toBeVisible();

  // Click CTA
  await page.click('text=Подключить Telegram');

  // Verify modal opens
  await expect(page.locator('dialog')).toBeVisible();

  // ... complete binding flow (see Story 34.2-FE)

  // After binding, verify all cards visible
  await expect(page.locator('text=Настройки уведомлений')).toBeVisible();
  await expect(page.locator('text=Тихие часы')).toBeVisible();

  // Test navigation via header icon
  await page.click('[aria-label*="Telegram подключен"]');
  await expect(page.url()).toContain('/settings/notifications');
});
```

---

## 📦 Dependencies

**No new dependencies** - uses components from Stories 34.1-34.4

**Required Components**:
- `TelegramBindingCard` (Story 34.2)
- `NotificationPreferencesPanel` (Story 34.3)
- `QuietHoursConfiguration` (Story 34.4)

---

## 🚀 Implementation Order

1. **Phase 1: Page Structure** (1-2h)
   - Create page file `page.tsx`
   - Add breadcrumbs navigation
   - Set up responsive container

2. **Phase 2: Empty State** (1-2h)
   - Create `HeroBanner` component
   - Add feature list
   - Implement CTA button logic

3. **Phase 3: Bound State Integration** (1-2h)
   - Integrate all 3 component cards
   - Add test notification button
   - Implement proper spacing

4. **Phase 4: Status Indicator** (1h) ⭐ CRITICAL
   - Create `TelegramStatusIndicator`
   - Add to header/navbar
   - Implement tooltip
   - Add click navigation

5. **Phase 5: Testing** (1-2h)
   - Write unit tests
   - Write E2E test
   - Test mobile responsive layout

---

## ✅ Definition of Done

- [ ] All 6 acceptance criteria met (Q16-Q20)
- [ ] **Vertical stack layout** implemented ⭐
- [ ] Correct spacing across all breakpoints
- [ ] Mobile layout with full-width cards (<640px)
- [ ] **Hero banner** shows when not bound ⭐
- [ ] **Status indicator** in header works correctly ⭐
- [ ] Test notification button functional
- [ ] WCAG 2.1 AA compliance verified
- [ ] Unit tests passing (>80% coverage)
- [ ] E2E test passing
- [ ] Tested on mobile devices (iOS/Android)

---

**Created**: 2025-12-29
**Author**: Claude Code
**UX Design**: Sally (UX Expert)
**Status**: 📋 Ready for Development
**Previous Story**: Story 34.4-FE (Quiet Hours & Timezone)
**Next Story**: Story 34.6-FE (Testing & Documentation)

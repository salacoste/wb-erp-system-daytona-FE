# Story 34.2-FE: Telegram Binding Flow

**Epic**: Epic 34-FE - Telegram Notifications UI
**Story ID**: Story 34.2-FE
**Effort**: 5 SP (8-12 hours)
**Status**: ✅ UX Design Approved, 📋 Ready for Development
**Dependencies**: Story 34.1-FE (Types & API Client)
**UX Answers**: Q1-Q5 from UX-ANSWERS-EPIC-34-FE.md

---

## 📋 Summary

Implement the complete Telegram binding flow with modal interface, verification code display, polling mechanism, and unbind functionality. User-friendly onboarding experience for connecting Telegram bot.

---

## 🎯 User Story

**As a** seller using WB Repricer System
**I want to** easily connect my Telegram account to receive notifications
**So that** I get instant updates about my tasks directly in Telegram

---

## ✅ Acceptance Criteria

### 1. Binding Modal (Q1 - Centered Modal Overlay)
- [ ] Centered modal overlay using shadcn/ui Dialog
- [ ] 480-560px width on desktop, full-screen on mobile (<640px)
- [ ] Backdrop with `backdrop-blur-sm` and `bg-black/50`
- [ ] Close button (X) in top-right corner
- [ ] ESC key closes modal (with confirmation if binding started)
- [ ] Modal title: "Подключение Telegram" (H2, 24px, semi-bold)

### 2. Countdown Timer (Q2 - Progress Bar + Text)
- [ ] Linear progress bar showing time remaining
- [ ] Text display: "Код действителен ещё: 9:45"
- [ ] Progress bar changes color based on time:
  - 10:00 - 2:01: Telegram Blue (#0088CC)
  - 2:00 - 0:31: Warning Orange (#FF9800)
  - 0:30 - 0:00: Error Red (#E53935) with pulsation
- [ ] Updates every second
- [ ] Shows "Код истёк. Получите новый код." when expired

### 3. Deep Link Button (Q3 - Telegram Blue CTA)
- [ ] Primary button with Telegram branding
- [ ] Background: Telegram Blue (#0088CC)
- [ ] Text: "Открыть в Telegram" with paper plane icon (20x20px)
- [ ] Full-width on mobile, centered on desktop
- [ ] Deep link format: `https://t.me/Kernel_crypto_bot?start={code}`
- [ ] Opens native Telegram app on mobile

### 4. Polling Indicator (Q4 - Spinner + Text)
- [ ] Spinner (24x24px) with text "Ожидаем подтверждения..."
- [ ] 3-second polling interval
- [ ] Dynamic text updates:
  - 0-5s: "Ожидаем подтверждения..."
  - 5s+: "Всё ещё ожидаем... Проверьте Telegram."
  - >60s: "Подтверждение занимает дольше обычного..."
- [ ] Stops polling when bound or code expired

### 5. Unbind Confirmation (Q5 - Separate Dialog)
- [ ] Confirmation dialog with warning icon
- [ ] Explains consequences (bullet points)
- [ ] Two buttons: "Отменить" (secondary), "Отключить Telegram" (danger)
- [ ] Success toast after unbind: "Telegram отключен"

### 6. Accessibility (WCAG 2.1 AA)
- [ ] All interactive elements keyboard accessible
- [ ] aria-labels on all icons and buttons
- [ ] Focus trap within modal
- [ ] Screen reader announcements for state changes

---

## 📝 Component Specifications

### Component: `TelegramBindingCard.tsx`

**Location**: `src/components/notifications/TelegramBindingCard.tsx`

**Purpose**: Main card showing Telegram binding status and triggering bind/unbind flows

#### Props
```typescript
interface TelegramBindingCardProps {
  onBindingComplete?: () => void;
  onUnbindComplete?: () => void;
}
```

#### States

**1. Not Bound (Empty State)**
```typescript
<Card>
  <CardHeader>
    <div className="flex items-center gap-3">
      <span className="text-2xl">📱</span>
      <h3>Подключение Telegram</h3>
    </div>
  </CardHeader>
  <CardContent>
    <Alert variant="info">
      <p>Telegram не подключен</p>
      <p>Подключите Telegram для получения уведомлений о задачах</p>
    </Alert>
    <Button onClick={openBindingModal}>Подключить Telegram</Button>
  </CardContent>
</Card>
```

**2. Bound (Connected State)**
```typescript
<Card>
  <CardHeader>
    <div className="flex items-center gap-3">
      <span className="text-2xl">📱</span>
      <h3>Подключение Telegram</h3>
    </div>
  </CardHeader>
  <CardContent>
    <div className="flex items-center gap-2">
      <span className="text-xl">🔔</span>
      <Badge variant="success">Подключен</Badge>
    </div>
    <p className="text-sm text-gray-600">@{username}</p>
    <Button variant="destructive" onClick={openUnbindDialog}>
      Отключить Telegram
    </Button>
  </CardContent>
</Card>
```

---

### Component: `TelegramBindingModal.tsx`

**Location**: `src/components/notifications/TelegramBindingModal.tsx`

**Purpose**: Modal dialog for binding flow with code display and polling

#### Props
```typescript
interface TelegramBindingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}
```

#### Visual Mockup (Desktop)
```
┌──────────────────────────────────────────────────────────┐
│  Подключение Telegram                                  [×]│
│  ──────────────────────────────────────────────────────  │
│                                                            │
│  Шаг 1: Откройте бот в Telegram                           │
│                                                            │
│  Отправьте боту @Kernel_crypto_bot:                        │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  /start A1B2C3D4                     [📋 Копировать] │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ────── или ──────                                         │
│                                                            │
│  [📱 Открыть в Telegram]  ← Telegram Blue (#0088CC)       │
│                                                            │
│  Код действителен ещё: 9:45                                │
│  ████████████████████░░░░░░░░░░ 65%                        │
│                                                            │
│  ⏳ Ожидаем подтверждения...                               │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

#### Code Structure
```typescript
function TelegramBindingModal({ open, onOpenChange, onSuccess }: Props) {
  const [bindingCode, setBindingCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds

  const { startBinding, status, isBound } = useTelegramBinding();

  // Start binding when modal opens
  useEffect(() => {
    if (open && !bindingCode) {
      startBinding.mutate(undefined, {
        onSuccess: (data) => {
          setBindingCode(data.binding_code);
          setExpiresAt(data.expires_at);
        },
      });
    }
  }, [open]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.floor(
        (new Date(expiresAt).getTime() - Date.now()) / 1000
      );
      setTimeRemaining(Math.max(0, remaining));

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Success handler
  useEffect(() => {
    if (isBound) {
      onSuccess();
      onOpenChange(false);
    }
  }, [isBound]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeRemaining / 600) * 100;
  const progressColor = timeRemaining > 120 ? 'bg-telegram-blue' :
                        timeRemaining > 30 ? 'bg-orange-500' :
                        'bg-red-500';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Подключение Telegram</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Instructions */}
          <div>
            <h4 className="font-medium mb-2">Шаг 1: Откройте бот в Telegram</h4>
            <p className="text-sm text-gray-600 mb-4">
              Отправьте боту @Kernel_crypto_bot:
            </p>

            {/* Verification Code */}
            <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
              <code className="flex-1 font-mono text-lg">
                /start {bindingCode || '...'}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard.writeText(`/start ${bindingCode}`)}
              >
                📋 Копировать
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-sm text-gray-500">или</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* Deep Link Button */}
          <Button
            className="w-full bg-telegram-blue hover:bg-telegram-blue-dark"
            size="lg"
            onClick={() => window.open(`https://t.me/Kernel_crypto_bot?start=${bindingCode}`, '_blank')}
          >
            <span className="mr-2">📱</span>
            Открыть в Telegram
          </Button>

          {/* Countdown Timer */}
          {timeRemaining > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Код действителен ещё: <strong>{formatTime(timeRemaining)}</strong>
              </p>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${progressColor} transition-all duration-1000`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <Alert variant="destructive">
              <p>Код истёк. Пожалуйста, закройте окно и попробуйте снова.</p>
            </Alert>
          )}

          {/* Polling Indicator */}
          {!isBound && timeRemaining > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Spinner className="w-6 h-6" />
              <p>
                {timeRemaining > 55 ? 'Ожидаем подтверждения...' :
                 timeRemaining > 540 ? 'Всё ещё ожидаем... Проверьте Telegram.' :
                 'Подтверждение занимает дольше обычного. Убедитесь, что вы отправили команду боту.'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Component: `UnbindConfirmationDialog.tsx`

**Location**: `src/components/notifications/UnbindConfirmationDialog.tsx`

**Purpose**: Confirmation dialog for removing Telegram binding

#### Visual Mockup
```
┌──────────────────────────────────────────────────────────┐
│  Отключить Telegram?                                   [×]│
│  ──────────────────────────────────────────────────────  │
│                                                            │
│  ⚠️ Вы уверены, что хотите отключить                       │
│     Telegram-уведомления?                                  │
│                                                            │
│  • Вы перестанете получать уведомления о задачах           │
│  • Настройки будут сброшены                                │
│  • Вы сможете переподключить Telegram в любое время        │
│                                                            │
│  ──────────────────────────────────────────────────────  │
│                                                            │
│  [Отменить]                     [Отключить Telegram]       │
│  (secondary)                          (danger)             │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

#### Code Structure
```typescript
interface UnbindConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

function UnbindConfirmationDialog({ open, onOpenChange, onConfirm }: Props) {
  const { unbind, isUnbinding } = useTelegramBinding();

  const handleUnbind = () => {
    unbind(undefined, {
      onSuccess: () => {
        onConfirm();
        onOpenChange(false);
        toast.success('Telegram отключен');
      },
      onError: (error) => {
        toast.error('Не удалось отключить Telegram. Попробуйте ещё раз.');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-orange-500 text-2xl">⚠️</span>
            Отключить Telegram?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-gray-700">
            Вы уверены, что хотите отключить Telegram-уведомления?
          </p>

          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Вы перестанете получать уведомления о задачах</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Настройки будут сброшены</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Вы сможете переподключить Telegram в любое время</span>
            </li>
          </ul>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUnbinding}
          >
            Отменить
          </Button>
          <Button
            variant="destructive"
            onClick={handleUnbind}
            disabled={isUnbinding}
          >
            {isUnbinding ? 'Отключение...' : 'Отключить Telegram'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🎨 Design Specifications

### Colors (Tailwind Classes)
```typescript
const colors = {
  telegramBlue: 'bg-[#0088CC] hover:bg-[#0077B3]',
  successGreen: 'bg-[#4CAF50]',
  errorRed: 'bg-[#E53935]',
  warningOrange: 'bg-[#FF9800]',
  gray100: 'bg-gray-100',
  gray200: 'bg-gray-200',
  gray600: 'text-gray-600',
};
```

### Typography
```typescript
const typography = {
  dialogTitle: 'text-2xl font-semibold',  // 24px
  stepHeader: 'text-base font-medium',    // 16px
  body: 'text-sm',                        // 14px
  code: 'font-mono text-lg',              // 18px (verification code)
};
```

### Spacing
```typescript
const spacing = {
  modalPadding: 'p-6',           // 24px
  sectionGap: 'space-y-6',       // 24px between sections
  elementGap: 'gap-2',           // 8px between small elements
};
```

### Animations
```css
/* Countdown timer pulsation (when <30s) */
@keyframes pulse-red {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-pulse-red {
  animation: pulse-red 1.5s ease-in-out infinite;
}

/* Checkmark pop animation (on success) */
@keyframes checkmark-pop {
  0% { opacity: 0; transform: scale(0.5); }
  50% { transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}
```

---

## 🧪 Testing Requirements

### Unit Tests
```typescript
// TelegramBindingCard.test.tsx
describe('TelegramBindingCard', () => {
  it('shows "Подключить Telegram" button when not bound', () => {
    // Mock useTelegramBinding hook with isBound: false
    render(<TelegramBindingCard />);
    expect(screen.getByText('Подключить Telegram')).toBeInTheDocument();
  });

  it('shows username and "Отключить" when bound', () => {
    // Mock useTelegramBinding hook with isBound: true
    render(<TelegramBindingCard />);
    expect(screen.getByText('@testuser')).toBeInTheDocument();
    expect(screen.getByText('Отключить Telegram')).toBeInTheDocument();
  });
});

// TelegramBindingModal.test.tsx
describe('TelegramBindingModal', () => {
  it('displays verification code after opening', async () => {
    render(<TelegramBindingModal open={true} onOpenChange={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/\/start A1B2C3D4/)).toBeInTheDocument();
    });
  });

  it('updates countdown timer every second', async () => {
    render(<TelegramBindingModal open={true} onOpenChange={jest.fn()} />);
    const initialTime = screen.getByText(/9:45/);
    await waitFor(() => {
      expect(screen.getByText(/9:44/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('shows expired message when timer reaches 0', async () => {
    // Mock expires_at to be in the past
    render(<TelegramBindingModal open={true} onOpenChange={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/Код истёк/)).toBeInTheDocument();
    });
  });
});
```

### E2E Tests (Playwright)
```typescript
test('complete binding flow', async ({ page }) => {
  // Navigate to settings
  await page.goto('/settings/notifications');

  // Click "Подключить Telegram"
  await page.click('text=Подключить Telegram');

  // Verify modal opens
  await expect(page.locator('dialog')).toBeVisible();
  await expect(page.locator('text=Подключение Telegram')).toBeVisible();

  // Verify verification code displayed
  await expect(page.locator('code:has-text("/start")')).toBeVisible();

  // Click deep link button
  await page.click('text=Открыть в Telegram');

  // Verify polling starts
  await expect(page.locator('text=Ожидаем подтверждения')).toBeVisible();

  // Simulate backend returning bound: true
  // (requires API mocking or real Telegram interaction)

  // Verify modal closes and success state
  await expect(page.locator('text=Telegram подключен')).toBeVisible();
});
```

---

## 📦 Dependencies

**shadcn/ui Components**:
```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add button
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add badge
```

**Additional Utils**:
- `react-hot-toast` or `sonner` for toast notifications
- `lucide-react` for icons

---

## 🚀 Implementation Order

1. **Phase 1: Basic Card** (2-3h)
   - Create `TelegramBindingCard` with bound/not bound states
   - Integrate `useTelegramBinding` hook
   - Add "Подключить" button handler

2. **Phase 2: Binding Modal** (3-4h)
   - Create `TelegramBindingModal` component
   - Implement verification code display
   - Add countdown timer with progress bar
   - Implement deep link button

3. **Phase 3: Polling Logic** (1-2h)
   - Add polling indicator UI
   - Handle success/error/expired states
   - Auto-close modal on success

4. **Phase 4: Unbind Flow** (1-2h)
   - Create `UnbindConfirmationDialog`
   - Add unbind logic with confirmation
   - Show success toast

5. **Phase 5: Testing** (2-3h)
   - Write unit tests
   - Write E2E test
   - Test on mobile devices

---

## ✅ Definition of Done

- [ ] All 5 acceptance criteria met (Q1-Q5)
- [ ] Countdown timer works correctly with color changes
- [ ] Polling stops when bound or code expired
- [ ] Unbind confirmation prevents accidental disconnection
- [ ] Mobile responsive (full-screen modal <640px)
- [ ] WCAG 2.1 AA compliance verified
- [ ] Unit tests passing (>80% coverage)
- [ ] E2E test passing
- [ ] Code review completed
- [ ] Tested on iOS/Android with real Telegram app

---

**Created**: 2025-12-29
**Author**: Claude Code
**UX Design**: Sally (UX Expert)
**Status**: 📋 Ready for Development
**Previous Story**: Story 34.1-FE (Types & API Client)
**Next Story**: Story 34.3-FE (Notification Preferences Panel)

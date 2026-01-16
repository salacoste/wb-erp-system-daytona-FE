# Story 34.6-FE: Testing & Documentation

**Epic**: Epic 34-FE - Telegram Notifications UI
**Story ID**: Story 34.6-FE
**Effort**: 3 SP (5-7 hours)
**Status**: 📋 Ready for Development
**Dependencies**: Stories 34.1-34.5 (All implementation stories complete)
**UX Answers**: Q21-Q25 from UX-ANSWERS-EPIC-34-FE.md

---

## 📋 Summary

Comprehensive testing suite, documentation updates, accessibility verification, and final quality assurance to ensure Epic 34-FE is production-ready.

---

## 🎯 User Story

**As a** development team
**We want** comprehensive tests and documentation for Telegram notifications UI
**So that** the feature is reliable, maintainable, and well-understood by all stakeholders

---

## ✅ Acceptance Criteria

### 1. Unit Tests (>80% Coverage)
- [ ] All API client functions tested with MSW
- [ ] All React Query hooks tested
- [ ] All UI components tested with React Testing Library
- [ ] Edge cases covered (network errors, expired codes, overnight periods)
- [ ] Coverage report generated: >80% lines, >70% branches

### 2. Integration Tests
- [ ] Full binding flow tested
- [ ] Preferences save flow tested
- [ ] Quiet hours with timezone calculations tested
- [ ] Error states and recovery tested

### 3. E2E Tests (Playwright)
- [ ] Complete user journey: not bound → bind → configure → save
- [ ] Unbind flow tested
- [ ] Mobile responsive layouts tested
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

### 4. Accessibility Audit (WCAG 2.1 AA)
- [ ] Automated testing (axe-core, Lighthouse)
- [ ] Manual keyboard navigation testing
- [ ] Screen reader testing (NVDA/JAWS/VoiceOver)
- [ ] Color contrast verification
- [ ] Focus management validation

### 5. Documentation Updates
- [ ] README updated with Telegram notifications feature
- [ ] CHANGELOG updated with Epic 34-FE entries
- [ ] API integration guide created
- [ ] Component Storybook stories created (optional)

### 6. Final QA
- [ ] Code review completed
- [ ] Performance testing (Lighthouse score >90)
- [ ] Security review (no exposed tokens, XSS prevention)
- [ ] Production readiness checklist completed

---

## 📝 Testing Strategy

### Test Pyramid

```
        /\
       /  \      E2E Tests (5%)
      /────\     - Complete user journeys
     /      \    - Cross-browser validation
    /────────\
   /  Integration  \   (15%)
  /──────────────\  - API + UI integration
 /    Unit Tests   \ (80%)
/─────────────────\ - Components, hooks, utils
```

---

## 1️⃣ Unit Tests

### API Client Tests (`src/__tests__/api/notifications.test.ts`)

**Coverage Target**: 100% (all endpoints)

```typescript
import { describe, expect, it, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import * as api from '@/lib/api/notifications';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Telegram Binding API', () => {
  describe('startTelegramBinding', () => {
    it('should generate binding code successfully', async () => {
      server.use(
        http.post('/v1/notifications/telegram/bind', () => {
          return HttpResponse.json({
            binding_code: 'A1B2C3D4',
            expires_at: '2025-12-29T14:00:00Z',
            instructions: 'Send /start A1B2C3D4 to @Kernel_crypto_bot',
            deep_link: 'https://t.me/Kernel_crypto_bot?start=A1B2C3D4',
          });
        })
      );

      const result = await api.startTelegramBinding();

      expect(result.binding_code).toBe('A1B2C3D4');
      expect(result.deep_link).toContain('t.me/Kernel_crypto_bot');
    });

    it('should handle API errors correctly', async () => {
      server.use(
        http.post('/v1/notifications/telegram/bind', () => {
          return HttpResponse.json(
            {
              error: {
                code: 'RATE_LIMITED',
                message: 'Too many requests',
              },
            },
            { status: 429 }
          );
        })
      );

      await expect(api.startTelegramBinding()).rejects.toThrow('Too many requests');
    });
  });

  // Add tests for all 6 endpoints...
});
```

### React Query Hook Tests (`src/__tests__/hooks/useTelegramBinding.test.tsx`)

**Coverage Target**: >80%

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTelegramBinding } from '@/hooks/useTelegramBinding';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useTelegramBinding', () => {
  it('should poll binding status every 3 seconds when not bound', async () => {
    const { result } = renderHook(() => useTelegramBinding(), {
      wrapper: createWrapper(),
    });

    // Initial state: not bound
    expect(result.current.isBound).toBe(false);

    // Wait for polling
    await waitFor(
      () => {
        expect(result.current.status).toBeDefined();
      },
      { timeout: 5000 }
    );

    // Verify polling continued
    expect(result.current.isCheckingStatus).toBe(true);
  });

  it('should stop polling when bound', async () => {
    // Mock API to return bound: true
    const { result } = renderHook(() => useTelegramBinding(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isBound).toBe(true);
    });

    // Verify polling stopped
    expect(result.current.isCheckingStatus).toBe(false);
  });
});
```

### Component Tests

**Example: `TelegramBindingCard.test.tsx`**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TelegramBindingCard } from '@/components/notifications/TelegramBindingCard';

// Mock hooks
jest.mock('@/hooks/useTelegramBinding', () => ({
  useTelegramBinding: () => ({
    isBound: false,
    status: null,
    startBinding: jest.fn(),
    unbind: jest.fn(),
  }),
}));

describe('TelegramBindingCard', () => {
  it('shows "Подключить Telegram" button when not bound', () => {
    render(<TelegramBindingCard />);
    expect(screen.getByText('Подключить Telegram')).toBeInTheDocument();
  });

  it('opens binding modal when button clicked', () => {
    render(<TelegramBindingCard />);
    const button = screen.getByText('Подключить Telegram');
    fireEvent.click(button);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // Add more test cases...
});
```

---

## 2️⃣ Integration Tests

### Full Binding Flow Test

```typescript
describe('Telegram Binding Flow Integration', () => {
  it('completes full binding flow successfully', async () => {
    // 1. Start binding
    const { result } = renderHook(() => useTelegramBinding(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startBinding();
    });

    await waitFor(() => {
      expect(result.current.bindingCode).toBeDefined();
    });

    // 2. Simulate backend confirming binding
    server.use(
      http.get('/v1/notifications/telegram/status', () => {
        return HttpResponse.json({
          bound: true,
          telegram_user_id: 123456789,
          telegram_username: 'testuser',
          binding_expires_at: null,
        });
      })
    );

    // 3. Wait for polling to detect bound status
    await waitFor(() => {
      expect(result.current.isBound).toBe(true);
    });

    // 4. Verify preferences now accessible
    const prefsHook = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(prefsHook.result.current.preferences).toBeDefined();
    });
  });
});
```

---

## 3️⃣ E2E Tests (Playwright)

### Complete User Journey

**File**: `e2e/telegram-notifications.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Telegram Notifications Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/notifications');
  });

  test('complete flow: bind → configure → save', async ({ page }) => {
    // Step 1: Verify empty state
    await expect(page.locator('text=Получайте уведомления в Telegram')).toBeVisible();

    // Step 2: Click CTA to bind
    await page.click('text=Подключить Telegram');

    // Step 3: Verify modal opens with code
    await expect(page.locator('dialog')).toBeVisible();
    await expect(page.locator('code:has-text("/start")')).toBeVisible();

    // Step 4: Simulate successful binding (mock API)
    // (In real test, would require Telegram bot interaction)

    // Step 5: Configure preferences
    await page.click('text=Задача выполнена успешно');
    await page.selectOption('select[name="language"]', 'en');

    // Step 6: Save settings
    await page.click('text=Сохранить настройки');
    await expect(page.locator('text=Настройки сохранены')).toBeVisible();
  });

  test('mobile responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    // Verify all cards full-width
    const cards = page.locator('[role="region"]');
    const firstCard = cards.first();
    const box = await firstCard.boundingBox();

    expect(box?.width).toBeGreaterThan(350); // Nearly full viewport width
  });

  test('keyboard navigation', async ({ page }) => {
    // Tab through all interactive elements
    await page.keyboard.press('Tab'); // Focus on first button
    await page.keyboard.press('Tab'); // Focus on next element
    // ... continue tabbing

    // Verify focus visible
    const focused = await page.locator(':focus');
    await expect(focused).toBeVisible();
  });
});
```

### Cross-Browser Testing

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

---

## 4️⃣ Accessibility Testing

### Automated Testing

**Lighthouse CI Configuration** (`.lighthouserc.json`):
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/settings/notifications"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:performance": ["warn", { "minScore": 0.9 }]
      }
    }
  }
}
```

**axe-core Integration** (`src/__tests__/a11y/notifications.a11y.test.tsx`):
```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { NotificationsSettingsPage } from '@/app/(dashboard)/settings/notifications/page';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  it('should have no accessibility violations (empty state)', async () => {
    const { container } = render(<NotificationsSettingsPage />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations (bound state)', async () => {
    // Mock isBound: true
    const { container } = render(<NotificationsSettingsPage />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
```

### Manual Testing Checklist

**Keyboard Navigation**:
- [ ] All interactive elements reachable via Tab
- [ ] Focus indicators visible on all elements
- [ ] Logical tab order (top to bottom, left to right)
- [ ] Modals trap focus correctly
- [ ] ESC key closes modals

**Screen Reader Testing**:
- [ ] NVDA (Windows): All content announced correctly
- [ ] JAWS (Windows): Aria-labels read properly
- [ ] VoiceOver (macOS/iOS): Landmarks and headings navigable
- [ ] All images have alt text or aria-labels
- [ ] Form inputs have associated labels

**Color Contrast**:
- [ ] All text meets WCAG AA standards (4.5:1 for normal text)
- [ ] Interactive elements meet 3:1 contrast ratio
- [ ] Disabled states still readable
- [ ] Error messages have sufficient contrast

---

## 5️⃣ Documentation Updates

### README.md Updates

```markdown
## Features

### Telegram Notifications (Epic 34-FE)

Receive instant push notifications about background tasks directly in Telegram.

**Key Features**:
- ✅ Bind Telegram account with simple verification code
- ⚙️ Configure notification types (success, errors, stalled tasks, daily digest)
- 🌙 Set quiet hours with timezone support
- 🌐 Multilingual notifications (Russian/English)

**Setup**:
1. Navigate to Settings → Notifications
2. Click "Подключить Telegram"
3. Send verification code to @Kernel_crypto_bot
4. Configure your notification preferences

**Documentation**: See `docs/epics/epic-34-fe-telegram-notifications-ui.md`
```

### CHANGELOG.md Updates

```markdown
## [Unreleased]

### Added
- **Epic 34-FE**: Telegram Notifications UI
  - Story 34.1-FE: TypeScript types and API client for Telegram notifications
  - Story 34.2-FE: Telegram binding flow with verification code modal
  - Story 34.3-FE: Notification preferences panel with event type configuration
  - Story 34.4-FE: Quiet hours and timezone configuration
  - Story 34.5-FE: Complete settings page layout at `/settings/notifications`
  - Story 34.6-FE: Comprehensive testing suite and documentation

### Changed
- Header: Added Telegram status indicator (bell icon with badge)

### Dependencies
- Added `@tanstack/react-query` for server state management
- Added `react-hot-toast` for toast notifications
```

### API Integration Guide

**File**: `docs/guides/telegram-notifications-api.md`

```markdown
# Telegram Notifications API Integration Guide

## Overview
This guide explains how to integrate with the Telegram notifications API endpoints.

## Authentication
All requests require:
- `Authorization: Bearer {jwt_token}`
- `X-Cabinet-Id: {cabinet_id}`

## Endpoints

### POST /v1/notifications/telegram/bind
Generates a binding code for Telegram verification.

**Request**:
```json
{
  "language": "ru"  // optional: "ru" | "en"
}
```

**Response**:
```json
{
  "binding_code": "A1B2C3D4",
  "expires_at": "2025-12-29T14:00:00Z",
  "instructions": "Send /start A1B2C3D4 to @Kernel_crypto_bot",
  "deep_link": "https://t.me/Kernel_crypto_bot?start=A1B2C3D4"
}
```

[... continue with all endpoints ...]
```

### Component Storybook Stories (Optional)

**File**: `src/components/notifications/TelegramBindingCard.stories.tsx`

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { TelegramBindingCard } from './TelegramBindingCard';

const meta: Meta<typeof TelegramBindingCard> = {
  title: 'Notifications/TelegramBindingCard',
  component: TelegramBindingCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TelegramBindingCard>;

export const NotBound: Story = {
  args: {
    isBound: false,
  },
};

export const Bound: Story = {
  args: {
    isBound: true,
    username: 'testuser',
  },
};
```

---

## 6️⃣ Final QA Checklist

### Code Review
- [ ] All code follows project conventions
- [ ] No console.log statements in production code
- [ ] TypeScript strict mode compliance (zero errors)
- [ ] ESLint warnings addressed
- [ ] Prettier formatting applied
- [ ] No hardcoded values (use constants/env vars)

### Performance Testing
- [ ] Lighthouse Performance score >90
- [ ] First Contentful Paint <1.8s
- [ ] Largest Contentful Paint <2.5s
- [ ] Total Blocking Time <200ms
- [ ] Cumulative Layout Shift <0.1

### Security Review
- [ ] No exposed API keys or tokens in frontend code
- [ ] XSS prevention: All user inputs sanitized
- [ ] CSRF protection via JWT tokens
- [ ] Sensitive data not logged to console
- [ ] Deep links validated before opening

### Production Readiness
- [ ] All environment variables documented
- [ ] Error boundaries implemented
- [ ] Loading states for all async operations
- [ ] Error messages user-friendly (no stack traces)
- [ ] Analytics events tracked (optional)
- [ ] Feature flag support (optional)

---

## 📊 Coverage Reports

### Expected Coverage Metrics

| Category | Target | Measurement |
|----------|--------|-------------|
| Unit Tests | >80% | Lines covered / Total lines |
| Integration Tests | >70% | Critical paths tested |
| E2E Tests | 100% | User journeys covered |
| Accessibility | WCAG 2.1 AA | axe-core violations = 0 |
| Performance | >90 | Lighthouse score |

### Running Tests

```bash
# Unit tests with coverage
npm run test -- --coverage

# E2E tests
npm run test:e2e

# Accessibility tests
npm run test:a11y

# Lighthouse CI
npm run lighthouse
```

---

## 🚀 Implementation Order

1. **Phase 1: Unit Tests** (2-3h)
   - Write tests for API client functions
   - Write tests for React Query hooks
   - Write tests for UI components
   - Generate coverage report

2. **Phase 2: Integration Tests** (1-2h)
   - Write full binding flow test
   - Write preferences save flow test
   - Write quiet hours calculation tests

3. **Phase 3: E2E Tests** (1-2h)
   - Write complete user journey test
   - Write mobile responsive test
   - Run cross-browser tests

4. **Phase 4: Accessibility Audit** (1h)
   - Run axe-core tests
   - Run Lighthouse CI
   - Manual keyboard navigation testing
   - Screen reader testing

5. **Phase 5: Documentation** (1-2h)
   - Update README.md
   - Update CHANGELOG.md
   - Create API integration guide
   - Create Storybook stories (optional)

6. **Phase 6: Final QA** (1-2h)
   - Code review
   - Performance testing
   - Security review
   - Production readiness checklist

---

## ✅ Definition of Done

- [ ] All unit tests passing (>80% coverage)
- [ ] All integration tests passing (>70% coverage)
- [ ] E2E test suite passing across all browsers
- [ ] Zero accessibility violations (axe-core)
- [ ] WCAG 2.1 AA compliance verified manually
- [ ] Lighthouse Performance score >90
- [ ] Documentation updated (README, CHANGELOG, guides)
- [ ] Code review completed and approved
- [ ] Security review completed
- [ ] Production deployment checklist completed

---

**Created**: 2025-12-29
**Author**: Claude Code
**Status**: 📋 Ready for Development
**Previous Story**: Story 34.5-FE (Settings Page Layout)
**Epic Completion**: ✅ All Stories Created

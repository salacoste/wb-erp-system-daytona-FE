# E2E Testing Guide: Epic 34-FE

**Epic**: Epic 34-FE - Telegram Notifications UI
**Test Framework**: Playwright
**Coverage**: 10 comprehensive E2E test scenarios

---

## 📋 Test Suite Overview

### Test Coverage

**Total Test Cases**: 10 E2E scenarios

| TC ID | Test Name | Coverage | Priority |
|-------|-----------|----------|----------|
| TC-E2E-001 | Empty State & Hero Banner | Story 34.5-FE | 🔴 Critical |
| TC-E2E-002 | Complete Binding Flow | Stories 34.2-FE, 34.5-FE | 🔴 Critical |
| TC-E2E-003 | Notification Preferences Configuration | Story 34.3-FE | 🔴 Critical |
| TC-E2E-004 | Quiet Hours with Timezone | Story 34.4-FE | 🔴 Critical |
| TC-E2E-005 | Unbind Flow | Story 34.2-FE | 🔴 Critical |
| TC-E2E-006 | Mobile Responsive Layouts | Story 34.5-FE | 🟡 High |
| TC-E2E-007 | Accessibility Compliance (WCAG 2.1 AA) | All stories | 🟡 High |
| TC-E2E-008 | Language Switcher | Story 34.3-FE | 🟢 Medium |
| TC-E2E-009 | Daily Digest Conditional Time Picker | Story 34.3-FE | 🟢 Medium |
| TC-E2E-010 | Cancel Button Resets Changes | Story 34.3-FE | 🟢 Medium |

---

## 🛠️ Setup

### Prerequisites

1. **Node.js** 18+ installed
2. **Playwright** installed

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

3. **Dev server** running on `localhost:3100`

```bash
# Terminal 1: Start dev server
npm run dev
```

---

## 🚀 Running Tests

### Run All E2E Tests

```bash
# Run all tests (headless mode)
npx playwright test tests/e2e/telegram-notifications.spec.ts

# Run with UI mode (interactive)
npx playwright test tests/e2e/telegram-notifications.spec.ts --ui

# Run in headed mode (see browser)
npx playwright test tests/e2e/telegram-notifications.spec.ts --headed
```

### Run Specific Test

```bash
# Run single test by name
npx playwright test tests/e2e/telegram-notifications.spec.ts -g "TC-E2E-002"

# Run only critical tests
npx playwright test tests/e2e/telegram-notifications.spec.ts -g "Critical"
```

### Generate HTML Report

```bash
# Run tests and generate report
npx playwright test tests/e2e/telegram-notifications.spec.ts --reporter=html

# Open report in browser
npx playwright show-report
```

---

## 📊 Test Execution Matrix

### Browser Coverage

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Primary |
| Firefox | Latest | ✅ Supported |
| Safari | Latest | ✅ Supported |
| Edge | Latest | ⚠️ Optional |

Run tests on all browsers:

```bash
npx playwright test tests/e2e/telegram-notifications.spec.ts --project=chromium
npx playwright test tests/e2e/telegram-notifications.spec.ts --project=firefox
npx playwright test tests/e2e/telegram-notifications.spec.ts --project=webkit
```

### Device Emulation

```bash
# Test mobile viewport (iPhone 12 Pro)
npx playwright test tests/e2e/telegram-notifications.spec.ts --project="Mobile Chrome"

# Test tablet viewport (iPad)
npx playwright test tests/e2e/telegram-notifications.spec.ts --project="Mobile Safari"
```

---

## 🐛 Debugging Tests

### Debug Mode

```bash
# Run with debug inspector
npx playwright test tests/e2e/telegram-notifications.spec.ts --debug

# Run specific test in debug mode
npx playwright test tests/e2e/telegram-notifications.spec.ts --debug -g "TC-E2E-002"
```

### Visual Debugging

```bash
# Take screenshots on failure
npx playwright test tests/e2e/telegram-notifications.spec.ts --screenshot=only-on-failure

# Record video of test execution
npx playwright test tests/e2e/telegram-notifications.spec.ts --video=on-first-retry
```

### Test Traces

```bash
# Capture trace for debugging
npx playwright test tests/e2e/telegram-notifications.spec.ts --trace=on

# View trace in browser
npx playwright show-trace trace.zip
```

---

## 📝 Test Scenarios Explained

### TC-E2E-001: Empty State & Hero Banner

**Purpose**: Verify hero banner displays when Telegram not bound

**Critical Checks**:
- Hero banner visible with light blue gradient
- 3 feature bullets present
- "Подключить Telegram" CTA button (Telegram Blue)
- Lock overlays on disabled panels

**User Journey**: First-time visitor → sees empty state → clicks CTA

---

### TC-E2E-002: Complete Binding Flow ⭐ CRITICAL

**Purpose**: Verify full Telegram binding flow works end-to-end

**Critical Checks**:
1. Modal opens on CTA click
2. Binding code displays (`/start ABC123XY`)
3. Countdown timer animates correctly
4. Progress bar changes color (Blue → Orange → Red)
5. Copy button copies code to clipboard
6. Deep link button opens Telegram
7. Polling spinner visible
8. Modal closes on successful binding
9. Bound state displays with username

**User Journey**: Not bound → click "Подключить Telegram" → modal → enter code in Telegram → bound

---

### TC-E2E-003: Notification Preferences Configuration ⭐ CRITICAL

**Purpose**: Verify preferences can be changed and saved

**Critical Checks**:
1. Preferences panel enabled when bound
2. Event type toggles work (click card or switch)
3. Border changes (Gray → Telegram Blue)
4. Dirty state warning appears
5. Save button becomes enabled (Primary Red)
6. PUT request sent to API
7. Success toast displays
8. Dirty warning disappears
9. Save button becomes disabled

**User Journey**: Bound → toggle event type → see dirty warning → click save → success

---

### TC-E2E-004: Quiet Hours with Timezone

**Purpose**: Verify quiet hours configuration with timezone support

**Critical Checks**:
1. Quiet hours toggle enables time pickers
2. Native `<input type="time">` works
3. Overnight hint appears when `from > to`
4. Timezone dropdown shows grouped zones
5. Current time preview updates
6. Save persists preferences

**User Journey**: Bound → enable quiet hours → set 23:00 - 07:00 → select timezone → save

---

### TC-E2E-005: Unbind Flow

**Purpose**: Verify Telegram can be unbound safely

**Critical Checks**:
1. "Отключить Telegram" button visible when bound
2. Confirmation dialog opens with warning
3. Cancel button closes dialog without unbinding
4. Confirm button triggers DELETE request
5. Success toast displays
6. Hero banner reappears (unbound state)

**User Journey**: Bound → click "Отключить Telegram" → confirm → unbound

---

### TC-E2E-006: Mobile Responsive Layouts

**Purpose**: Verify UI adapts to mobile viewports

**Critical Checks**:
1. H1 title smaller on mobile (28px vs 36px)
2. Cards full-width
3. CTA button full-width
4. No horizontal scrolling
5. Modal full-screen on mobile

**Viewport**: iPhone 12 Pro (390x844)

---

### TC-E2E-007: Accessibility Compliance (WCAG 2.1 AA)

**Purpose**: Verify UI meets WCAG 2.1 AA standards

**Critical Checks**:
1. Only one H1 per page
2. All buttons have accessible names
3. Form inputs have labels
4. Toggle switches have `aria-checked`
5. Keyboard navigation works (Tab key)
6. Modal has `aria-labelledby` or `aria-describedby`
7. Zero WCAG violations (axe-core)

**Tools**: Playwright, axe-core (optional)

---

### TC-E2E-008: Language Switcher

**Purpose**: Verify language can be changed

**Critical Checks**:
1. Russian selected by default
2. Click English changes selection
3. Dirty state warning appears
4. Save persists language choice

---

### TC-E2E-009: Daily Digest Conditional Time Picker

**Purpose**: Verify time picker shows/hides based on digest toggle

**Critical Checks**:
1. Time picker visible when digest enabled
2. Default time 08:00
3. Toggle digest OFF → time picker slides up
4. Toggle digest ON → time picker slides down
5. Time can be changed
6. Dirty state appears on change

---

### TC-E2E-010: Cancel Button Resets Changes

**Purpose**: Verify cancel button reverts unsaved changes

**Critical Checks**:
1. Make changes → dirty warning appears
2. Click "Отменить" → changes revert
3. Dirty warning disappears
4. Save button becomes disabled
5. No API call made (local reset only)

---

## 🎯 Expected Results

### Success Criteria

- **All 10 tests PASS** (100% pass rate)
- **Zero console errors** during test execution
- **Zero WCAG violations** (TC-E2E-007)
- **All critical paths covered** (binding, preferences, unbind)
- **Mobile responsive** (TC-E2E-006)
- **Accessibility compliant** (TC-E2E-007)

### Performance Benchmarks

| Metric | Target | Acceptable |
|--------|--------|------------|
| Total test suite duration | <2 min | <3 min |
| Single test duration | <10s | <15s |
| Modal open/close | <500ms | <1s |
| API response time (mocked) | <100ms | <200ms |

---

## 🔧 Troubleshooting

### Common Issues

**Issue 1: "Dev server not running"**
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3100
```
**Solution**: Start dev server in separate terminal: `npm run dev`

---

**Issue 2: "Element not found"**
```
Error: locator.click: Timeout 30000ms exceeded
```
**Solution**: Check `data-testid` attributes are present in components

---

**Issue 3: "Modal not opening"**
```
Error: expect(modal).toBeVisible() - Expected visible, got hidden
```
**Solution**: Verify button selector is correct, check for loading states

---

**Issue 4: "Tests pass locally but fail in CI"**
```
Error: Inconsistent behavior in CI environment
```
**Solution**: Add `await page.waitForLoadState('networkidle')` before assertions

---

## 📦 Playwright Configuration

**Location**: `playwright.config.ts`

**Key Settings**:
```typescript
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3100',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['iPhone 12 Pro'] },
    },
  ],
});
```

---

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run dev &
      - run: npx playwright test tests/e2e/telegram-notifications.spec.ts
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📚 Additional Resources

- **Playwright Docs**: https://playwright.dev
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **axe-core**: https://github.com/dequelabs/axe-core
- **Epic 34-FE Stories**: `/frontend/docs/stories/epic-34/`

---

**Created**: 2025-12-29
**Author**: James (Tech Lead)
**Status**: Ready for execution

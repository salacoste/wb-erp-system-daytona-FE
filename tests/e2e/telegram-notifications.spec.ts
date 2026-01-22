import { test, expect, type Page } from '@playwright/test';

/**
 * Epic 34-FE: Telegram Notifications UI - E2E Tests
 *
 * Test Coverage:
 * - TC-E2E-001: Empty state and hero banner
 * - TC-E2E-002: Complete binding flow
 * - TC-E2E-003: Notification preferences configuration
 * - TC-E2E-004: Quiet hours with timezone
 * - TC-E2E-005: Unbind flow
 * - TC-E2E-006: Mobile responsive layouts
 * - TC-E2E-007: Accessibility compliance
 *
 * Prerequisites:
 * - Dev server running on localhost:3100
 * - Backend API mocked (MSW or test server)
 */

test.describe('Epic 34-FE: Telegram Notifications UI', () => {

  // ============================================================================
  // Setup & Helpers
  // ============================================================================

  test.beforeEach(async ({ page }) => {
    // Navigate to notifications settings page
    await page.goto('http://localhost:3100/settings/notifications');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  /**
   * Helper: Mock unbound state (Telegram not connected)
   */
  async function mockUnboundState(page: Page) {
    await page.route('**/v1/notifications/telegram/status', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          bound: false,
          telegram_user_id: null,
          telegram_username: null,
          binding_expires_at: null,
        }),
      });
    });
  }

  /**
   * Helper: Mock bound state (Telegram connected)
   */
  async function mockBoundState(page: Page) {
    await page.route('**/v1/notifications/telegram/status', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          bound: true,
          telegram_user_id: 123456789,
          telegram_username: 'test_user',
          binding_expires_at: null,
        }),
      });
    });

    await page.route('**/v1/notifications/preferences', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cabinet_id: 'test_cabinet_001',
          telegram_enabled: true,
          telegram_bound: true,
          telegram_username: 'test_user',
          preferences: {
            task_completed: true,
            task_failed: false,
            task_stalled: false,
            daily_digest: true,
            digest_time: '08:00',
          },
          language: 'ru',
          quiet_hours: {
            enabled: false,
            from: '23:00',
            to: '07:00',
            timezone: 'Europe/Moscow',
          },
        }),
      });
    });
  }

  // ============================================================================
  // TC-E2E-001: Empty State & Hero Banner
  // ============================================================================

  test('TC-E2E-001: Should display hero banner when Telegram not bound', async ({ page }) => {
    await mockUnboundState(page);
    await page.reload();

    // Verify hero banner visible
    const heroBanner = page.locator('[data-testid="hero-banner"]');
    await expect(heroBanner).toBeVisible();

    // Verify hero banner content
    await expect(heroBanner).toContainText('Подключите Telegram');
    await expect(heroBanner).toContainText('Мгновенные уведомления');
    await expect(heroBanner).toContainText('Настройка типов уведомлений');
    await expect(heroBanner).toContainText('Тихие часы');

    // Verify CTA button
    const ctaButton = heroBanner.locator('button:has-text("Подключить Telegram")');
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toHaveCSS('background-color', 'rgb(0, 136, 204)'); // Telegram Blue

    // Verify disabled panels with lock overlays
    const preferencesPanel = page.locator('[data-testid="preferences-panel"]');
    const quietHoursPanel = page.locator('[data-testid="quiet-hours-panel"]');

    await expect(preferencesPanel).toContainText('🔒');
    await expect(quietHoursPanel).toContainText('🔒');
  });

  // ============================================================================
  // TC-E2E-002: Complete Binding Flow
  // ============================================================================

  test('TC-E2E-002: Should complete Telegram binding flow', async ({ page }) => {
    await mockUnboundState(page);
    await page.reload();

    // Step 1: Click "Подключить Telegram" button
    const ctaButton = page.locator('button:has-text("Подключить Telegram")').first();
    await ctaButton.click();

    // Step 2: Verify modal opens
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Подключение Telegram');

    // Mock binding code generation
    await page.route('**/v1/notifications/telegram/bind', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          binding_code: 'ABC123XY',
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
          instructions: 'Отправьте боту @Kernel_crypto_bot команду /start ABC123XY',
          deep_link: 'https://t.me/Kernel_crypto_bot?start=ABC123XY',
        }),
      });
    });

    // Wait for binding code to appear
    await expect(modal.locator('code:has-text("/start")')).toBeVisible();
    await expect(modal.locator('code:has-text("ABC123XY")')).toBeVisible();

    // Step 3: Verify countdown timer
    const countdownText = modal.locator('text=/Код действителен ещё:/');
    await expect(countdownText).toBeVisible();

    // Step 4: Verify progress bar
    const progressBar = modal.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();

    // Step 5: Verify copy button
    const copyButton = modal.locator('button:has-text("Копировать")');
    await expect(copyButton).toBeVisible();

    // Test copy functionality (requires clipboard permissions)
    await copyButton.click();
    // Note: Clipboard assertion may require special permissions

    // Step 6: Verify deep link button
    const deepLinkButton = modal.locator('button:has-text("Открыть в Telegram")');
    await expect(deepLinkButton).toBeVisible();
    await expect(deepLinkButton).toHaveCSS('background-color', 'rgb(0, 136, 204)'); // Telegram Blue

    // Step 7: Verify polling indicator
    const pollingIndicator = modal.locator('text=/Ожидаем подтверждения/');
    await expect(pollingIndicator).toBeVisible();

    // Step 8: Simulate successful binding (after polling)
    await page.route('**/v1/notifications/telegram/status', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          bound: true,
          telegram_user_id: 123456789,
          telegram_username: 'test_user',
          binding_expires_at: null,
        }),
      });
    });

    // Wait for modal to close (on successful binding)
    await page.waitForTimeout(3000); // Simulate polling interval
    await expect(modal).not.toBeVisible();

    // Step 9: Verify bound state displays
    const bindingCard = page.locator('[data-testid="telegram-binding-card"]');
    await expect(bindingCard).toContainText('Подключен');
    await expect(bindingCard).toContainText('@test_user');
  });

  // ============================================================================
  // TC-E2E-003: Notification Preferences Configuration
  // ============================================================================

  test('TC-E2E-003: Should configure notification preferences and save', async ({ page }) => {
    await mockBoundState(page);
    await page.reload();

    // Step 1: Verify preferences panel is enabled
    const preferencesPanel = page.locator('[data-testid="preferences-panel"]');
    await expect(preferencesPanel).toBeVisible();
    await expect(preferencesPanel).not.toContainText('🔒'); // No lock overlay

    // Step 2: Toggle "Задача завершилась с ошибкой" (task_failed)
    const taskFailedCard = preferencesPanel.locator('[data-testid="event-card-task_failed"]');
    await expect(taskFailedCard).toBeVisible();

    const taskFailedToggle = taskFailedCard.locator('[role="switch"]');
    const initialState = await taskFailedToggle.getAttribute('aria-checked');
    await taskFailedToggle.click();

    // Verify toggle state changed
    const newState = await taskFailedToggle.getAttribute('aria-checked');
    expect(newState).not.toBe(initialState);

    // Step 3: Verify dirty state warning appears
    const dirtyWarning = page.locator('text=/несохранённые изменения/i');
    await expect(dirtyWarning).toBeVisible();

    // Step 4: Verify save button is enabled
    const saveButton = preferencesPanel.locator('button:has-text("Сохранить настройки")');
    await expect(saveButton).toBeEnabled();
    await expect(saveButton).toHaveCSS('background-color', 'rgb(229, 57, 53)'); // Primary Red

    // Step 5: Mock successful save
    await page.route('**/v1/notifications/preferences', (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            cabinet_id: 'test_cabinet_001',
            telegram_enabled: true,
            telegram_bound: true,
            telegram_username: 'test_user',
            preferences: {
              task_completed: true,
              task_failed: true, // Changed
              task_stalled: false,
              daily_digest: true,
              digest_time: '08:00',
            },
            language: 'ru',
            quiet_hours: {
              enabled: false,
              from: '23:00',
              to: '07:00',
              timezone: 'Europe/Moscow',
            },
          }),
        });
      } else {
        route.continue();
      }
    });

    // Click save button
    await saveButton.click();

    // Step 6: Verify success toast appears
    const successToast = page.locator('text=/Настройки сохранены/i');
    await expect(successToast).toBeVisible();

    // Step 7: Verify dirty warning disappears
    await expect(dirtyWarning).not.toBeVisible();

    // Step 8: Verify save button becomes disabled
    await expect(saveButton).toBeDisabled();
  });

  // ============================================================================
  // TC-E2E-004: Quiet Hours with Timezone Configuration
  // ============================================================================

  test('TC-E2E-004: Should configure quiet hours with timezone', async ({ page }) => {
    await mockBoundState(page);
    await page.reload();

    // Step 1: Locate quiet hours panel
    const quietHoursPanel = page.locator('[data-testid="quiet-hours-panel"]');
    await expect(quietHoursPanel).toBeVisible();

    // Step 2: Enable quiet hours
    const quietHoursToggle = quietHoursPanel.locator('[role="switch"]').first();
    await quietHoursToggle.click();

    // Step 3: Verify time pickers appear
    const fromTimePicker = quietHoursPanel.locator('input[type="time"]').first();
    const toTimePicker = quietHoursPanel.locator('input[type="time"]').last();

    await expect(fromTimePicker).toBeVisible();
    await expect(toTimePicker).toBeVisible();

    // Step 4: Set overnight period (23:00 - 07:00)
    await fromTimePicker.fill('23:00');
    await toTimePicker.fill('07:00');

    // Step 5: Verify overnight hint appears
    const overnightHint = quietHoursPanel.locator('text=/период через полночь/i');
    await expect(overnightHint).toBeVisible();
    await expect(overnightHint).toContainText('💡');

    // Step 6: Change timezone
    const timezoneSelect = quietHoursPanel.locator('[role="combobox"]');
    await timezoneSelect.click();

    // Select "Asia/Vladivostok"
    const vladivostokOption = page.locator('text=/Владивосток/');
    await vladivostokOption.click();

    // Step 7: Verify current time preview updates
    const timePreview = quietHoursPanel.locator('text=/Сейчас в/');
    await expect(timePreview).toContainText('Vladivostok');

    // Step 8: Save preferences
    const saveButton = quietHoursPanel.locator('button:has-text("Сохранить настройки")');
    await saveButton.click();

    // Verify success
    const successToast = page.locator('text=/Настройки сохранены/i');
    await expect(successToast).toBeVisible();
  });

  // ============================================================================
  // TC-E2E-005: Unbind Flow
  // ============================================================================

  test('TC-E2E-005: Should unbind Telegram with confirmation', async ({ page }) => {
    await mockBoundState(page);
    await page.reload();

    // Step 1: Locate unbind button
    const bindingCard = page.locator('[data-testid="telegram-binding-card"]');
    const unbindButton = bindingCard.locator('button:has-text("Отключить Telegram")');
    await expect(unbindButton).toBeVisible();

    // Step 2: Click unbind button
    await unbindButton.click();

    // Step 3: Verify confirmation dialog opens
    const confirmDialog = page.locator('[role="dialog"]:has-text("Отключить Telegram?")');
    await expect(confirmDialog).toBeVisible();

    // Step 4: Verify warning content
    await expect(confirmDialog).toContainText('⚠️');
    await expect(confirmDialog).toContainText('перестанете получать уведомления');
    await expect(confirmDialog).toContainText('Настройки будут сброшены');

    // Step 5: Verify two buttons present
    const cancelButton = confirmDialog.locator('button:has-text("Отменить")');
    const confirmButton = confirmDialog.locator('button:has-text("Отключить Telegram")');

    await expect(cancelButton).toBeVisible();
    await expect(confirmButton).toBeVisible();

    // Step 6: Test cancel button
    await cancelButton.click();
    await expect(confirmDialog).not.toBeVisible();

    // Step 7: Re-open dialog and confirm unbind
    await unbindButton.click();
    await expect(confirmDialog).toBeVisible();

    // Mock successful unbind
    await page.route('**/v1/notifications/telegram/unbind', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    // Mock unbound state after unbind
    await page.route('**/v1/notifications/telegram/status', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          bound: false,
          telegram_user_id: null,
          telegram_username: null,
          binding_expires_at: null,
        }),
      });
    });

    await confirmButton.click();

    // Step 8: Verify success toast
    const successToast = page.locator('text=/Telegram отключен/i');
    await expect(successToast).toBeVisible();

    // Step 9: Verify hero banner reappears (unbound state)
    const heroBanner = page.locator('[data-testid="hero-banner"]');
    await expect(heroBanner).toBeVisible();
  });

  // ============================================================================
  // TC-E2E-006: Mobile Responsive Layouts
  // ============================================================================

  test('TC-E2E-006: Should display correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport (iPhone 12 Pro)
    await page.setViewportSize({ width: 390, height: 844 });

    await mockUnboundState(page);
    await page.reload();

    // Step 1: Verify H1 title size on mobile
    const pageTitle = page.locator('h1');
    await expect(pageTitle).toBeVisible();

    // Check font size (should be 28px on mobile, not 36px)
    const titleFontSize = await pageTitle.evaluate((el) =>
      window.getComputedStyle(el).fontSize
    );
    expect(parseInt(titleFontSize)).toBeLessThan(32); // Should be 28px or similar

    // Step 2: Verify cards are full-width
    const heroBanner = page.locator('[data-testid="hero-banner"]');
    const bannerWidth = await heroBanner.evaluate((el) => (el as HTMLElement).offsetWidth);
    const viewportWidth = page.viewportSize()?.width || 0;

    // Cards should be nearly full-width (accounting for padding)
    expect(bannerWidth).toBeGreaterThan(viewportWidth * 0.9);

    // Step 3: Verify CTA button is full-width
    const ctaButton = heroBanner.locator('button:has-text("Подключить Telegram")');
    const buttonWidth = await ctaButton.evaluate((el) => (el as HTMLElement).offsetWidth);

    // Button should be full-width within card
    expect(buttonWidth).toBeGreaterThan(bannerWidth * 0.9);

    // Step 4: Verify no horizontal scrolling
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

    // Step 5: Test modal on mobile
    await ctaButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Modal should be full-screen on mobile
    const modalWidth = await modal.evaluate((el) => (el as HTMLElement).offsetWidth);
    expect(modalWidth).toBeGreaterThan(viewportWidth * 0.9);
  });

  // ============================================================================
  // TC-E2E-007: Accessibility Compliance (WCAG 2.1 AA)
  // ============================================================================

  test('TC-E2E-007: Should meet WCAG 2.1 AA accessibility requirements', async ({ page }) => {
    await mockBoundState(page);
    await page.reload();

    // Step 1: Verify page has proper heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1); // Only one H1

    const h2Elements = page.locator('h2');
    const h2Count = await h2Elements.count();
    expect(h2Count).toBeGreaterThan(0); // H2 elements present

    // Step 2: Verify all buttons have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const accessibleName = await button.getAttribute('aria-label') ||
                             await button.textContent();
      expect(accessibleName).toBeTruthy();
    }

    // Step 3: Verify form inputs have labels
    const inputs = page.locator('input');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');

      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        const hasLabel = await label.count() > 0;
        expect(hasLabel || ariaLabel).toBeTruthy();
      }
    }

    // Step 4: Verify toggle switches have proper ARIA attributes
    const switches = page.locator('[role="switch"]');
    const switchCount = await switches.count();

    for (let i = 0; i < switchCount; i++) {
      const switchEl = switches.nth(i);
      const ariaChecked = await switchEl.getAttribute('aria-checked');
      expect(ariaChecked === 'true' || ariaChecked === 'false').toBeTruthy();
    }

    // Step 5: Test keyboard navigation
    await page.keyboard.press('Tab'); // First focusable element
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();

    // Navigate through several elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus moves to interactive elements
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.tagName === 'BUTTON' ||
             el?.tagName === 'INPUT' ||
             el?.getAttribute('role') === 'switch';
    });
    expect(focused).toBeTruthy();

    // Step 6: Verify modal dialog ARIA attributes
    const bindingCard = page.locator('[data-testid="telegram-binding-card"]');
    const unbindButton = bindingCard.locator('button:has-text("Отключить Telegram")');
    await unbindButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    const ariaLabelledBy = await dialog.getAttribute('aria-labelledby');
    const ariaDescribedBy = await dialog.getAttribute('aria-describedby');

    expect(ariaLabelledBy || ariaDescribedBy).toBeTruthy();

    // Step 7: Verify no WCAG violations (requires axe-core)
    // Note: This requires @axe-core/playwright package
    // await injectAxe(page);
    // const results = await checkA11y(page);
    // expect(results.violations).toHaveLength(0);
  });

  // ============================================================================
  // TC-E2E-008: Language Switcher
  // ============================================================================

  test('TC-E2E-008: Should switch notification language', async ({ page }) => {
    await mockBoundState(page);
    await page.reload();

    // Step 1: Locate language switcher
    const preferencesPanel = page.locator('[data-testid="preferences-panel"]');
    const languageLabel = preferencesPanel.locator('text=/Язык уведомлений/');
    await expect(languageLabel).toBeVisible();

    // Step 2: Verify Russian selected by default
    const russianRadio = preferencesPanel.locator('[data-testid="language-radio-ru"]');
    const englishRadio = preferencesPanel.locator('[data-testid="language-radio-en"]');

    await expect(russianRadio).toHaveAttribute('aria-checked', 'true');
    await expect(englishRadio).toHaveAttribute('aria-checked', 'false');

    // Step 3: Click English radio button
    await englishRadio.click();

    // Step 4: Verify selection changed
    await expect(englishRadio).toHaveAttribute('aria-checked', 'true');
    await expect(russianRadio).toHaveAttribute('aria-checked', 'false');

    // Step 5: Verify dirty state warning
    const dirtyWarning = page.locator('text=/несохранённые изменения/i');
    await expect(dirtyWarning).toBeVisible();

    // Step 6: Save preferences
    const saveButton = preferencesPanel.locator('button:has-text("Сохранить настройки")');
    await saveButton.click();

    // Verify success
    const successToast = page.locator('text=/Настройки сохранены/i');
    await expect(successToast).toBeVisible();
  });

  // ============================================================================
  // TC-E2E-009: Daily Digest Conditional Time Picker
  // ============================================================================

  test('TC-E2E-009: Should show/hide digest time picker conditionally', async ({ page }) => {
    await mockBoundState(page);
    await page.reload();

    // Step 1: Locate daily digest card
    const preferencesPanel = page.locator('[data-testid="preferences-panel"]');
    const digestCard = preferencesPanel.locator('[data-testid="event-card-daily_digest"]');

    // Step 2: Verify time picker is visible (digest enabled by default)
    const timePicker = digestCard.locator('input[type="time"]');
    await expect(timePicker).toBeVisible();
    await expect(timePicker).toHaveValue('08:00');

    // Step 3: Disable daily digest
    const digestToggle = digestCard.locator('[role="switch"]');
    await digestToggle.click();

    // Step 4: Verify time picker slides up (hidden)
    await expect(timePicker).not.toBeVisible();

    // Step 5: Re-enable daily digest
    await digestToggle.click();

    // Step 6: Verify time picker slides down (visible again)
    await expect(timePicker).toBeVisible();

    // Step 7: Change time
    await timePicker.fill('09:30');

    // Step 8: Verify dirty state
    const dirtyWarning = page.locator('text=/несохранённые изменения/i');
    await expect(dirtyWarning).toBeVisible();
  });

  // ============================================================================
  // TC-E2E-010: Cancel Button Resets Changes
  // ============================================================================

  test('TC-E2E-010: Should reset changes when cancel button clicked', async ({ page }) => {
    await mockBoundState(page);
    await page.reload();

    // Step 1: Make changes
    const preferencesPanel = page.locator('[data-testid="preferences-panel"]');
    const taskFailedCard = preferencesPanel.locator('[data-testid="event-card-task_failed"]');
    const taskFailedToggle = taskFailedCard.locator('[role="switch"]');

    // Get initial state
    const initialState = await taskFailedToggle.getAttribute('aria-checked');

    // Toggle
    await taskFailedToggle.click();

    // Step 2: Verify dirty state
    const dirtyWarning = page.locator('text=/несохранённые изменения/i');
    await expect(dirtyWarning).toBeVisible();

    // Step 3: Click cancel button
    const cancelButton = preferencesPanel.locator('button:has-text("Отменить")');
    await cancelButton.click();

    // Step 4: Verify state reverted
    const revertedState = await taskFailedToggle.getAttribute('aria-checked');
    expect(revertedState).toBe(initialState);

    // Step 5: Verify dirty warning gone
    await expect(dirtyWarning).not.toBeVisible();

    // Step 6: Verify save button disabled
    const saveButton = preferencesPanel.locator('button:has-text("Сохранить настройки")');
    await expect(saveButton).toBeDisabled();
  });

});

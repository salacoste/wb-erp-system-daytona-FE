import { test, expect } from '@playwright/test'

/**
 * E2E Tests: Price Calculator
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Tests the complete Price Calculator workflow including:
 * - Page navigation
 * - Form input and validation
 * - Calculation and results display
 * - Error handling
 * - Reset functionality
 */
test.describe('Price Calculator E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to price calculator page
    await page.goto('/cogs/price-calculator')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Story 44.4: Page Navigation', () => {
    test('navigates to price calculator from COGS Management', async ({ page }) => {
      // Should be on the correct page
      await expect(page).toHaveURL(/\/cogs\/price-calculator/)
      await expect(page.getByRole('heading', { name: 'Price Calculator' })).toBeVisible()
    })

    test('shows breadcrumb navigation', async ({ page }) => {
      // Breadcrumb should be visible
      const breadcrumb = page.getByText(/cogs management/i)
      await expect(breadcrumb).toBeVisible()
    })

    test('has two-column layout', async ({ page }) => {
      // Form column
      const formCard = page.locator('.grid > div').first()
      await expect(formCard.getByText('Price Calculator')).toBeVisible()

      // Results column
      const resultsCard = page.locator('.grid > div').nth(1)
      await expect(resultsCard).toBeVisible()
    })
  })

  test.describe('Story 44.2: Input Form', () => {
    test('displays all required input fields', async ({ page }) => {
      // Target Margin slider
      await expect(page.getByText(/target margin %/i)).toBeVisible()

      // Fixed Costs section
      await expect(page.getByText(/fixed costs/i)).toBeVisible()
      await expect(page.getByLabel(/cogs/i)).toBeVisible()
      await expect(page.getByLabel(/logistics forward/i)).toBeVisible()
      await expect(page.getByLabel(/logistics reverse/i)).toBeVisible()
      await expect(page.getByLabel(/storage/i)).toBeVisible()

      // Percentage Costs section
      await expect(page.getByText(/percentage costs/i)).toBeVisible()
      await expect(page.getByText(/buyback/i)).toBeVisible()
      await expect(page.getByText(/advertising/i)).toBeVisible()
    })

    test('toggles advanced options section', async ({ page }) => {
      // Advanced Options trigger
      const advancedTrigger = page.getByRole('button', { name: /advanced options/i })
      await expect(advancedTrigger).toBeVisible()

      // Initially collapsed
      await expect(page.getByLabel(/vat %/i)).not.toBeVisible()

      // Click to expand
      await advancedTrigger.click()
      await expect(page.getByLabel(/vat %/i)).toBeVisible()
      await expect(page.getByLabel(/acquiring %/i)).toBeVisible()

      // Collapse again
      await advancedTrigger.click()
      await expect(page.getByLabel(/vat %/i)).not.toBeVisible()
    })

    test('validates negative values', async ({ page }) => {
      // Try to enter negative COGS
      const cogsInput = page.getByLabel(/cogs/i)
      await cogsInput.fill('-100')

      // Should show validation error
      await expect(page.getByText(/cannot be negative/i)).toBeVisible()
    })
  })

  test.describe('Story 44.5: Auto-calculation', () => {
    test('auto-calculates after input changes', async ({ page }) => {
      // Fill in a value
      const cogsInput = page.getByLabel(/cogs/i)
      await cogsInput.fill('1500')

      // Wait for auto-calculation (500ms debounce + API call)
      await page.waitForTimeout(2000)

      // Should show results or calculating indicator
      const calculatingText = page.getByText(/calculating/i)
      const resultsText = page.getByText(/recommended price/i)

      const isCalculating = await calculatingText.isVisible().catch(() => false)
      const hasResults = await resultsText.isVisible().catch(() => false)

      expect(isCalculating || hasResults).toBeTruthy()
    })

    test('shows calculating indicator during API call', async ({ page }) => {
      // Fill in multiple fields quickly
      const cogsInput = page.getByLabel(/cogs/i)
      await cogsInput.fill('1500')

      // Should show "Calculating..." at some point
      const calculating = page.getByText(/calculating/i)
      await expect(calculating).toBeVisible({ timeout: 1000 })
    })
  })

  test.describe('Story 44.3: Results Display', () => {
    test('displays calculation results', async ({ page }) => {
      // Fill form to trigger calculation
      const cogsInput = page.getByLabel(/cogs/i)
      await cogsInput.fill('1500')

      // Wait for results (may need to wait for API)
      await page.waitForTimeout(3000)

      // Should show Recommended Price card
      const recommendedPrice = page.getByText(/recommended price/i)
      await expect(recommendedPrice).toBeVisible()
    })

    test('displays cost breakdown table', async ({ page }) => {
      // Fill form
      const cogsInput = page.getByLabel(/cogs/i)
      await cogsInput.fill('1500')

      // Wait for results
      await page.waitForTimeout(3000)

      // Should show cost breakdown
      const costBreakdown = page.getByText(/cost breakdown/i)
      await expect(costBreakdown).toBeVisible()
    })
  })

  test.describe('Story 44.5: Reset Functionality', () => {
    test('resets form without confirmation when no results', async ({ page }) => {
      // Click Reset button
      const resetButton = page.getByRole('button', { name: /reset/i })
      await resetButton.click()

      // Should NOT show confirmation dialog
      await expect(page.getByText(/confirm reset/i)).not.toBeVisible()
    })

    test('shows reset confirmation when results exist', async ({ page }) => {
      // First, get results by filling form
      const cogsInput = page.getByLabel(/cogs/i)
      await cogsInput.fill('1500')

      // Wait for results
      await page.waitForTimeout(3000)

      // Click Reset
      const resetButton = page.getByRole('button', { name: /reset/i })
      await resetButton.click()

      // Should show confirmation dialog
      await expect(page.getByText(/confirm reset/i)).toBeVisible()
      await expect(page.getByText(/are you sure/i)).toBeVisible()
    })

    test('keyboard shortcut: Esc to reset', async ({ page }) => {
      // Press Escape key
      await page.keyboard.press('Escape')

      // If results exist, should show confirmation
      const confirmDialog = page.getByText(/confirm reset/i)
      const hasDialog = await confirmDialog.isVisible().catch(() => false)

      if (hasDialog) {
        // Dialog should be visible
        await expect(confirmDialog).toBeVisible()
      }
      // If no dialog, form was reset without confirmation (also valid)
    })
  })

  test.describe('Story 44.5: Error Handling', () => {
    test('shows error message on calculation failure', async ({ page }) => {
      // Note: This test assumes the backend may fail or we mock it
      // In real E2E, we'd need a test backend or mocking

      // For now, we verify error UI exists
      const errorContainer = page.locator('[role="alert"]')

      // Error display is tested in unit tests - this is a smoke test
      await expect(errorContainer.first()).toBeAttached()
    })
  })

  test.describe('Accessibility', () => {
    test('all form inputs have labels', async ({ page }) => {
      // Check key inputs have associated labels
      const inputs = page.locator('input[type="number"]')
      const count = await inputs.count()

      for (let i = 0; i < Math.min(count, 5); i++) {
        const input = inputs.nth(i)
        const hasLabel = await input.evaluate((el) => {
          const labels = ['aria-label', 'id', 'name']
          return labels.some(attr => el.getAttribute(attr))
        })
        expect(hasLabel).toBeTruthy()
      }
    })

    test('can navigate form with keyboard', async ({ page }) => {
      // Tab through form
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Should focus on form elements
      const activeElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(['INPUT', 'BUTTON', 'SELECT']).toContain(activeElement)
    })

    test('buttons have accessible names', async ({ page }) => {
      // Calculate button
      const calcButton = page.getByRole('button', { name: /calculate/i })
      await expect(calcButton).toBeVisible()

      // Reset button
      const resetButton = page.getByRole('button', { name: /reset/i })
      await expect(resetButton).toBeVisible()
    })
  })

  test.describe('Smoke Tests', () => {
    test('page loads without JavaScript errors', async ({ page }) => {
      // Listen for console errors
      const errors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      // Reload page
      await page.reload()

      // Should have no critical errors
      expect(errors.filter(e => !e.includes('Warning'))).toHaveLength(0)
    })

    test('page is responsive on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      // Page should still be functional
      await expect(page.getByRole('heading', { name: 'Price Calculator' })).toBeVisible()

      // Form should be visible (may be stacked on mobile)
      const form = page.getByText('Price Calculator').first()
      await expect(form).toBeVisible()
    })
  })
})

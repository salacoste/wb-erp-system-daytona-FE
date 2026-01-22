# Test Plan: Story 44.23-FE - Form Card Visual Upgrade

## Overview

| Attribute | Value |
|-----------|-------|
| **Story** | 44.23-FE |
| **Title** | Form Card Visual Upgrade |
| **Type** | Visual Enhancement |
| **Priority** | P0 - CRITICAL |
| **Effort** | 3 SP |
| **QA Owner** | TBD |
| **Created** | 2026-01-20 |

## Test Scope

This test plan covers visual upgrades to the Price Calculator form:
- Enhanced Card Header with icon and primary border
- Section grouping with colored backgrounds (primary/blue/purple/amber)
- Input field focus enhancements
- Action section upgrade (buttons, spacing, gradient)
- Mobile stacking behavior

---

## Test Categories

### 1. Visual Regression Tests

| ID | Test Case | Expected Result | Tool |
|----|-----------|-----------------|------|
| VR-001 | Capture form card screenshot | Form with all section backgrounds visible | Percy/Chromatic |
| VR-002 | Compare section color groupings | Primary, blue, purple, amber sections distinct | Percy/Chromatic |
| VR-003 | Capture button gradient effect | Submit button gradient visible | Percy/Chromatic |

### 2. Accessibility Tests (WCAG 2.1 AA)

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| A11Y-001 | Input contrast on primary/5 background | Contrast ratio >= 4.5:1 | High |
| A11Y-002 | Input contrast on blue-50 background | Contrast ratio >= 4.5:1 | High |
| A11Y-003 | Input contrast on purple-50 background | Contrast ratio >= 4.5:1 | High |
| A11Y-004 | Input contrast on amber-50 background | Contrast ratio >= 4.5:1 | High |
| A11Y-005 | Focus states visible on all backgrounds | Focus ring clearly visible | High |
| A11Y-006 | Tab navigation through form | Tab order correct, focus visible | High |
| A11Y-007 | Section icons are decorative | Icons have `aria-hidden="true"` | Medium |
| A11Y-008 | Label associations unchanged | All inputs have associated labels | High |

### 3. Responsive Tests

| ID | Breakpoint | Test Case | Expected Result |
|----|------------|-----------|-----------------|
| R-001 | 375px (Mobile) | Buttons stacked vertically | `flex-col` applied |
| R-002 | 375px (Mobile) | Section padding reduced | `p-3` instead of `p-4` |
| R-003 | 768px (Tablet) | Buttons side by side | `md:flex-row` applied |
| R-004 | 1024px (Desktop) | Full section styling | All backgrounds, full padding |
| R-005 | All breakpoints | Form usability | Form remains usable at all sizes |

### 4. Cross-Browser Tests

| ID | Browser | Test Case | Expected Result |
|----|---------|-----------|-----------------|
| CB-001 | Chrome | Section backgrounds render | All colored backgrounds visible |
| CB-002 | Firefox | Section backgrounds render | All colored backgrounds visible |
| CB-003 | Safari | Button gradient render | Gradient displays correctly |
| CB-004 | Edge | Form styling consistent | All styles applied correctly |

### 5. Functional Tests

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| F-001 | Form submission still works | Submit triggers calculation | High |
| F-002 | Reset functionality works | Reset clears all fields | High |
| F-003 | Tab navigation through fields | Correct tab order preserved | High |
| F-004 | Enter key submits form | Form submitted on Enter | Medium |

---

## Test Cases by Acceptance Criteria

### AC1: Enhanced Card Header

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-001 | Header primary border | Inspect header | `border-b-4 border-b-primary` visible | High |
| TC-002 | Header padding | Inspect header | `py-5` applied | Medium |
| TC-003 | Header background | Inspect header | `bg-muted/30` background | Medium |
| TC-004 | Calculator icon present | View header | Calculator icon before title | High |
| TC-005 | Icon container styling | Inspect icon wrapper | `p-2 bg-primary/10 rounded-lg` | Medium |
| TC-006 | Title text size | Inspect title | `text-xl` applied | Low |

### AC2: Section Grouping with Visual Dividers

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-007 | Target Margin section | Inspect section | `bg-primary/5 rounded-lg p-4` | High |
| TC-008 | Fixed Costs section | Inspect section | `bg-blue-50 rounded-lg p-4` | High |
| TC-009 | Percentage Costs section | Inspect section | `bg-purple-50 rounded-lg p-4` | High |
| TC-010 | Tax Configuration section | Inspect section | `bg-amber-50 rounded-lg p-4` | High |
| TC-011 | Section left border accent | Inspect all sections | `border-l-4` visible on each | High |
| TC-012 | Target section icon | View section | Target icon displayed | Medium |
| TC-013 | Fixed Costs section icon | View section | Package icon displayed | Medium |
| TC-014 | Percentage section icon | View section | Percent icon displayed | Medium |
| TC-015 | Tax section icon | View section | Receipt icon displayed | Medium |
| TC-016 | Section headers styling | Inspect section headers | Left border accent visible | Medium |

### AC3: Input Field Enhancements

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-017 | Input focus ring animation | Focus on input field | `focus-within:ring-2 focus-within:ring-primary/20` | High |
| TC-018 | Label-input spacing | Inspect spacing | `gap-2` between label and input | Medium |
| TC-019 | Focus state visibility on primary bg | Focus input in Target Margin | Focus ring visible | High |
| TC-020 | Focus state visibility on blue bg | Focus input in Fixed Costs | Focus ring visible | High |
| TC-021 | Focus state visibility on purple bg | Focus input in Percentage Costs | Focus ring visible | High |
| TC-022 | Focus state visibility on amber bg | Focus input in Tax section | Focus ring visible | High |

### AC4: Action Section Upgrade

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-023 | Button spacing | Inspect action section | `gap-4` between buttons | High |
| TC-024 | Top border separator | Inspect action section | `border-t pt-6` visible | High |
| TC-025 | Submit button gradient | Inspect submit button | `bg-gradient-to-r from-primary to-primary/80` | High |
| TC-026 | Submit button icon | View submit button | Calculator icon displayed | Medium |
| TC-027 | Reset button icon | View reset button | RotateCcw icon displayed | Medium |
| TC-028 | Button hover shadow | Hover over submit | `hover:shadow-md` visible | Medium |
| TC-029 | Button hover gradient change | Hover over submit | Gradient shifts on hover | Medium |
| TC-030 | Submit button transition | Hover and observe | Smooth `transition-all duration-200` | Medium |

### AC5: Mobile Optimization

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-031 | Buttons stack on mobile | View on 375px | Buttons in `flex-col` layout | High |
| TC-032 | Buttons row on desktop | View on 768px+ | Buttons in `flex-row` layout | High |
| TC-033 | Section padding on mobile | View on 375px | `p-3` instead of `p-4` | Medium |
| TC-034 | Section padding on desktop | View on 768px+ | `md:p-4` applied | Medium |
| TC-035 | Form usability on mobile | Complete form on mobile | All fields accessible and usable | High |

---

## Pre-conditions

1. Story 44.20 (Two-Level Pricing Display) is complete
2. Price Calculator page accessible at `/cogs/price-calculator`
3. User authenticated with valid cabinet
4. All form sections visible (Target Margin, Fixed Costs, Percentage Costs, Tax)

## Test Data Requirements

| Data | Description | Purpose |
|------|-------------|---------|
| Valid form inputs | All required fields with valid values | Test form submission |
| Empty form | Reset state | Test reset functionality |
| Device viewports | 375px, 768px, 1024px | Test responsive behavior |

---

## Automation Candidates

### Playwright E2E Tests

```typescript
test.describe('Form Card Visual Upgrade', () => {
  test('should display Calculator icon in header', async ({ page }) => {
    await page.goto('/cogs/price-calculator')
    const headerIcon = page.locator('[data-testid="form-header-icon"]')
    await expect(headerIcon).toBeVisible()
  })

  test('should display primary border on header', async ({ page }) => {
    await page.goto('/cogs/price-calculator')
    const header = page.locator('[data-testid="form-card-header"]')
    await expect(header).toHaveClass(/border-b-4/)
    await expect(header).toHaveClass(/border-b-primary/)
  })

  test('should display colored section backgrounds', async ({ page }) => {
    await page.goto('/cogs/price-calculator')

    const targetSection = page.locator('[data-testid="target-margin-section"]')
    await expect(targetSection).toHaveClass(/bg-primary/)

    const fixedCostsSection = page.locator('[data-testid="fixed-costs-section"]')
    await expect(fixedCostsSection).toHaveClass(/bg-blue-50/)

    const percentageSection = page.locator('[data-testid="percentage-costs-section"]')
    await expect(percentageSection).toHaveClass(/bg-purple-50/)

    const taxSection = page.locator('[data-testid="tax-section"]')
    await expect(taxSection).toHaveClass(/bg-amber-50/)
  })

  test('should stack buttons on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/cogs/price-calculator')

    const actionsContainer = page.locator('[data-testid="form-actions"]')
    await expect(actionsContainer).toHaveClass(/flex-col/)
  })

  test('should show buttons side by side on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/cogs/price-calculator')

    const actionsContainer = page.locator('[data-testid="form-actions"]')
    await expect(actionsContainer).toHaveClass(/md:flex-row/)
  })

  test('should show focus ring on input focus', async ({ page }) => {
    await page.goto('/cogs/price-calculator')
    const input = page.locator('input').first()
    await input.focus()

    // Check for focus ring on parent
    const inputWrapper = input.locator('..')
    await expect(inputWrapper).toHaveClass(/focus-within:ring-2/)
  })

  test('should submit form and show results', async ({ page }) => {
    await page.goto('/cogs/price-calculator')
    await fillCalculatorForm(page)
    await page.click('[data-testid="calculate-button"]')

    // Verify results appear
    const results = page.locator('[data-testid="price-calculator-results"]')
    await expect(results).toBeVisible()
  })

  test('should reset form on reset button click', async ({ page }) => {
    await page.goto('/cogs/price-calculator')
    await fillCalculatorForm(page)
    await page.click('[data-testid="reset-button"]')

    // Verify form is reset
    const marginInput = page.locator('[data-testid="target-margin-input"]')
    await expect(marginInput).toHaveValue('')
  })
})
```

### Visual Regression Priority

| Test | Tool | Automation Priority |
|------|------|---------------------|
| Full form with all section backgrounds | Percy/Chromatic | High |
| Button gradient and styling | Playwright + screenshot | High |
| Mobile layout (stacked buttons) | Playwright | High |
| Focus states on different backgrounds | Playwright | Medium |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Section backgrounds reduce input contrast | High | Verify contrast on all backgrounds |
| Focus states invisible on colored backgrounds | High | Test focus visibility per section |
| Mobile padding too small for touch targets | Medium | Verify touch targets >= 44px |
| Form functionality regression | High | Include functional tests |

---

## Definition of Done Checklist

- [ ] All AC verification tests passed (TC-001 to TC-035)
- [ ] Visual regression screenshots captured
- [ ] Accessibility tests passed (contrast, focus, tab navigation)
- [ ] Responsive tests passed (mobile stacking verified)
- [ ] Cross-browser tests passed
- [ ] Form submission and reset still functional
- [ ] Tab navigation works correctly
- [ ] Test results documented

---

## Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| QA Engineer | | | Pending |
| Developer | | | Pending |
| Product Owner | | | Pending |

---

**Last Updated**: 2026-01-20

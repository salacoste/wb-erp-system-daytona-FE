# Test Plan: Story 44.22-FE - Hero Price Display Enhancement

## Overview

| Attribute | Value |
|-----------|-------|
| **Story** | 44.22-FE |
| **Title** | Hero Price Display Enhancement |
| **Type** | Visual Enhancement |
| **Priority** | P0 - CRITICAL |
| **Effort** | 2 SP |
| **QA Owner** | TBD |
| **Created** | 2026-01-20 |

## Test Scope

This test plan covers visual enhancement of the recommended price display:
- Gradient background implementation
- Ring effect styling
- Price gap indicator color coding (Green/Yellow/Red)
- Visual hierarchy (minimum/recommended/customer prices)
- Responsive font sizing

---

## Test Categories

### 1. Visual Regression Tests

| ID | Test Case | Expected Result | Tool |
|----|-----------|-----------------|------|
| VR-001 | Capture hero price section screenshot | Screenshot with gradient, ring, shadow | Percy/Chromatic |
| VR-002 | Compare price gap states (Green/Yellow/Red) | All three color states rendered correctly | Percy/Chromatic |
| VR-003 | Verify visual hierarchy of price levels | Recommended price most prominent | Percy/Chromatic |

### 2. Accessibility Tests (WCAG 2.1 AA)

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| A11Y-001 | Hero price text contrast on gradient | Contrast ratio >= 4.5:1 | High |
| A11Y-002 | Price gap indicator has text alternative | Icons + descriptive text present | High |
| A11Y-003 | Gradient doesn't reduce readability | Text fully readable on gradient | High |
| A11Y-004 | Drop-shadow doesn't affect contrast | Shadow is decorative only | Medium |
| A11Y-005 | Ring is decorative (no focus change) | Ring doesn't alter focus behavior | Medium |

### 3. Responsive Tests

| ID | Breakpoint | Test Case | Expected Result |
|----|------------|-----------|-----------------|
| R-001 | 375px (Mobile) | Hero price font size | `text-3xl` applied |
| R-002 | 768px (Tablet) | Ring offset reduction | Reduced ring offset |
| R-003 | 1024px (Desktop) | Full hero treatment | `text-4xl` or `text-5xl`, full effects |
| R-004 | All breakpoints | Gradient visibility | Gradient visible at all sizes |

### 4. Cross-Browser Tests

| ID | Browser | Test Case | Expected Result |
|----|---------|-----------|-----------------|
| CB-001 | Chrome | Gradient + ring rendering | All effects render correctly |
| CB-002 | Firefox | Gradient + ring rendering | All effects render correctly |
| CB-003 | Safari | Gradient + ring rendering | All effects render correctly |
| CB-004 | Edge | Gradient + ring rendering | All effects render correctly |

### 5. Functional Tests

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| F-001 | Price value updates on recalculation | Value changes with transition | High |
| F-002 | Copy functionality still works | Copy button functional | High |
| F-003 | Price gap calculation accuracy | Correct percentage displayed | High |

---

## Test Cases by Acceptance Criteria

### AC1: Enhanced Recommended Price Visual

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-001 | Verify gradient background | Inspect hero section | `bg-gradient-to-br from-primary/10 via-primary/5 to-background` | High |
| TC-002 | Verify font size desktop | View on 1024px+ | `text-4xl` or `text-5xl` applied | High |
| TC-003 | Verify font size mobile | View on 375px | `text-3xl` applied | High |
| TC-004 | Verify decorative ring | Inspect hero section | `ring-2 ring-primary/20 ring-offset-2` | High |
| TC-005 | Verify shadow elevation | Inspect hero section | `shadow-lg` applied | High |
| TC-006 | Gradient color correctness | Verify gradient colors | Uses primary color with opacity | Medium |

### AC2: Price Value Emphasis

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-007 | Verify text drop-shadow | Inspect price value | `drop-shadow-sm` applied | Medium |
| TC-008 | Value animation on change | Change inputs, recalculate | Value transitions with `duration-300` | High |
| TC-009 | Currency symbol styling | Inspect currency | `font-normal text-2xl` for lighter weight | Medium |
| TC-010 | Currency symbol position | Verify layout | Symbol after value, lighter weight | Low |

### AC3: Price Gap Indicator Enhancement

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-011 | Gap > 20% - Green indicator | Set target margin > 20% gap | `bg-green-50 text-green-700 border-green-200` | High |
| TC-012 | Gap 10-20% - Yellow indicator | Set target margin 10-20% gap | `bg-yellow-50 text-yellow-700 border-yellow-200` | High |
| TC-013 | Gap < 10% - Red indicator | Set target margin < 10% gap | `bg-red-50 text-red-700 border-red-200` | High |
| TC-014 | Icon for Green gap | Verify icon | TrendingUp icon displayed | Medium |
| TC-015 | Icon for Yellow gap | Verify icon | TrendingUp icon displayed | Medium |
| TC-016 | Icon for Red gap | Verify icon | AlertTriangle icon displayed | Medium |
| TC-017 | Border visibility | Inspect indicator | `border` class applied | Medium |
| TC-018 | Padding and rounded corners | Inspect indicator | `p-3 rounded-lg` applied | Low |

### AC4: Visual Hierarchy Reinforcement

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-019 | Minimum price styling | Inspect minimum price | Muted, smaller (`text-xl`) | High |
| TC-020 | Recommended price styling | Inspect recommended price | Prominent, largest (`text-4xl`) | High |
| TC-021 | Customer price styling | Inspect customer price | Secondary, medium (`text-lg`) | High |
| TC-022 | Visual progression top-to-bottom | View all three prices | Clear size/emphasis progression | High |
| TC-023 | Minimum price less prominent | Compare to hero | Clearly subordinate visually | Medium |

### AC5: Responsive Behavior

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-024 | Desktop full effects | View on 1024px+ | All effects active: gradient, ring, full sizes | High |
| TC-025 | Tablet reduced effects | View on 768px | Reduced ring offset, gradient maintained | Medium |
| TC-026 | Mobile simplified | View on 375px | Simpler treatment, reduced font sizes | High |
| TC-027 | Font size step down | Compare mobile vs desktop | Font sizes reduced by one step on mobile | Medium |

---

## Pre-conditions

1. Story 44.20 (Two-Level Pricing Display) is complete
2. Price Calculator page accessible at `/cogs/price-calculator`
3. User authenticated with valid cabinet
4. Product data available for various margin scenarios

## Test Data Requirements

| Data | Description | Purpose |
|------|-------------|---------|
| High margin product | Product with > 20% price gap | Test green indicator |
| Medium margin product | Product with 10-20% price gap | Test yellow indicator |
| Low margin product | Product with < 10% price gap | Test red indicator |
| Various form inputs | Different cost/margin combinations | Test all gap scenarios |

### Test Scenarios for Price Gap

| Scenario | Inputs | Expected Gap | Color |
|----------|--------|--------------|-------|
| High Margin | COGS: 1000, Target: 35% | > 20% | Green |
| Medium Margin | COGS: 2000, Target: 20% | 10-20% | Yellow |
| Low Margin | COGS: 3000, Target: 8% | < 10% | Red |

---

## Automation Candidates

### Playwright E2E Tests

```typescript
test.describe('Hero Price Display', () => {
  test('should display gradient background on hero section', async ({ page }) => {
    await page.goto('/cogs/price-calculator')
    // Fill form and calculate
    await fillCalculatorForm(page)
    await page.click('[data-testid="calculate-button"]')

    const heroSection = page.locator('[data-testid="recommended-price-section"]')
    await expect(heroSection).toHaveClass(/bg-gradient-to-br/)
  })

  test('should show green indicator when gap > 20%', async ({ page }) => {
    await page.goto('/cogs/price-calculator')
    await fillHighMarginScenario(page)
    await page.click('[data-testid="calculate-button"]')

    const gapIndicator = page.locator('[data-testid="price-gap-indicator"]')
    await expect(gapIndicator).toHaveClass(/bg-green-50/)
    await expect(gapIndicator).toHaveClass(/text-green-700/)
  })

  test('should show yellow indicator when gap 10-20%', async ({ page }) => {
    await fillMediumMarginScenario(page)
    const gapIndicator = page.locator('[data-testid="price-gap-indicator"]')
    await expect(gapIndicator).toHaveClass(/bg-yellow-50/)
  })

  test('should show red indicator when gap < 10%', async ({ page }) => {
    await fillLowMarginScenario(page)
    const gapIndicator = page.locator('[data-testid="price-gap-indicator"]')
    await expect(gapIndicator).toHaveClass(/bg-red-50/)
  })

  test('should use larger font on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    const priceValue = page.locator('[data-testid="recommended-price-value"]')
    await expect(priceValue).toHaveClass(/text-4xl|text-5xl/)
  })

  test('should use smaller font on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const priceValue = page.locator('[data-testid="recommended-price-value"]')
    await expect(priceValue).toHaveClass(/text-3xl/)
  })
})
```

### Visual Regression Priority

| Test | Tool | Automation Priority |
|------|------|---------------------|
| Hero section with all effects | Percy/Chromatic | High |
| Green/Yellow/Red gap indicators | Playwright + screenshot | High |
| Responsive font sizes | Playwright | High |
| Ring and shadow effects | Percy | Medium |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gradient reduces text readability | High | Verify contrast ratio >= 4.5:1 |
| Price gap calculation edge cases | Medium | Test boundary values (10%, 20%) |
| Ring/shadow not visible on all browsers | Low | Cross-browser testing |
| Animation performance on mobile | Medium | Use CSS transitions, test on real devices |

---

## Definition of Done Checklist

- [ ] All AC verification tests passed (TC-001 to TC-027)
- [ ] Visual regression screenshots captured for all states
- [ ] Accessibility tests passed (contrast ratios verified)
- [ ] Responsive tests passed on all breakpoints
- [ ] Cross-browser tests passed
- [ ] Price gap indicator shows correct colors for all thresholds
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

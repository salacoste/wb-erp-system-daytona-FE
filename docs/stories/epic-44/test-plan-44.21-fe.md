# Test Plan: Story 44.21-FE - Card Elevation System & Shadow Hierarchy

## Overview

| Attribute | Value |
|-----------|-------|
| **Story** | 44.21-FE |
| **Title** | Card Elevation System & Shadow Hierarchy |
| **Type** | Visual Enhancement |
| **Priority** | P0 - CRITICAL |
| **Effort** | 2 SP |
| **QA Owner** | TBD |
| **Created** | 2026-01-20 |

## Test Scope

This test plan covers visual elevation hierarchy across Price Calculator UI components:
- PriceCalculatorForm Card (Level 1)
- TwoLevelPricingDisplay Card (Level 2)
- Hero Price Section (Level 3)
- CostBreakdownChart Card (Level 1 + accent)

---

## Test Categories

### 1. Visual Regression Tests

| ID | Test Case | Expected Result | Tool |
|----|-----------|-----------------|------|
| VR-001 | Capture baseline screenshot of Price Calculator page | Screenshot saved for comparison | Percy/Chromatic |
| VR-002 | Compare shadow rendering across cards | Visual hierarchy clearly visible | Percy/Chromatic |
| VR-003 | Verify gradient background on results card | Gradient visible: `from-background to-muted/30` | Percy/Chromatic |

### 2. Accessibility Tests (WCAG 2.1 AA)

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| A11Y-001 | Verify shadows don't affect text contrast ratio | Contrast ratio >= 4.5:1 | High |
| A11Y-002 | Verify focus states visible with shadows | Focus ring clearly visible on all cards | High |
| A11Y-003 | Test keyboard navigation through cards | Tab order preserved, focus visible | High |
| A11Y-004 | Verify shadows are purely decorative | No semantic meaning conveyed by shadows alone | Medium |

### 3. Responsive Tests

| ID | Breakpoint | Test Case | Expected Result |
|----|------------|-----------|-----------------|
| R-001 | 375px (Mobile) | Check shadow reduction | Shadows reduced to `shadow-sm` max |
| R-002 | 768px (Tablet) | Check shadow scaling | Appropriate shadows for viewport |
| R-003 | 1024px (Desktop) | Check full shadow hierarchy | All shadow levels visible (sm/md/lg) |
| R-004 | 1440px (Large Desktop) | Check shadow consistency | Shadows consistent, no overflow |

### 4. Cross-Browser Tests

| ID | Browser | Test Case | Expected Result |
|----|---------|-----------|-----------------|
| CB-001 | Chrome | Render shadow hierarchy | All shadows render correctly |
| CB-002 | Firefox | Render shadow hierarchy | All shadows render correctly |
| CB-003 | Safari | Render shadow hierarchy | All shadows render correctly |
| CB-004 | Edge | Render shadow hierarchy | All shadows render correctly |

### 5. Performance Tests

| ID | Test Case | Expected Result | Threshold |
|----|-----------|-----------------|-----------|
| P-001 | Check layout shift on shadow transitions | CLS < 0.1 | WCAG |
| P-002 | Verify hover transition smoothness | No jank, 60fps | Visual |
| P-003 | Mobile shadow rendering performance | No noticeable lag | < 100ms |

### 6. Dark Mode Tests (If Applicable)

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| DM-001 | Verify shadows visible on dark backgrounds | Shadows adapted for dark mode |
| DM-002 | Check gradient on dark backgrounds | Gradient visible and appropriate |

---

## Test Cases by Acceptance Criteria

### AC1: Define Elevation Levels

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-001 | Verify Level 0 (Background) | Inspect page background | No shadow (`shadow-none`) | High |
| TC-002 | Verify Level 1 (Form/Chart) | Inspect form card | `shadow-sm` applied | High |
| TC-003 | Verify Level 2 (Results) | Inspect results card | `shadow-md` applied | High |
| TC-004 | Verify Level 3 (Hero) | Inspect recommended price section | `shadow-lg` applied | High |
| TC-005 | Visual hierarchy comparison | View all cards together | Clear visual depth progression | High |

### AC2: Update PriceCalculatorForm Card

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-006 | Form card base shadow | Load page, inspect form card | `shadow-sm` class present | High |
| TC-007 | Form card hover shadow | Hover over form card | Shadow transitions to `shadow-md` | High |
| TC-008 | Shadow transition timing | Hover and observe transition | Smooth transition, ~200ms | Medium |
| TC-009 | Form card border radius | Inspect form card | `rounded-xl` applied | Medium |
| TC-010 | Hover state on mobile | Tap form card on mobile | No hover effect (touch device) | Medium |

### AC3: Update TwoLevelPricingDisplay Card

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-011 | Results card shadow | Inspect results card | `shadow-md` class present | High |
| TC-012 | Results card gradient | Inspect results card background | Gradient `from-background to-muted/30` visible | High |
| TC-013 | Hero price section elevation | Inspect recommended price section | `shadow-lg` applied, most prominent | High |
| TC-014 | Border radius consistency | Inspect results card | `rounded-xl` applied | Medium |

### AC4: Update CostBreakdownChart Card

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-015 | Chart card shadow | Inspect chart card | `shadow-sm` class present | High |
| TC-016 | Chart card accent border | Inspect chart card | `border-l-4 border-l-primary` visible | High |
| TC-017 | Chart card padding | Inspect chart card | Increased padding for breathing room | Medium |
| TC-018 | Accent border color | Verify border color | Matches primary color `#E53935` | Medium |

### AC5: Mobile Responsiveness

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-019 | Mobile shadow reduction | View on 375px viewport | Max `shadow-sm` applied | High |
| TC-020 | Visual hierarchy on mobile | View all cards on mobile | Hierarchy maintained despite reduced shadows | High |
| TC-021 | 768px breakpoint | View on tablet | Shadows appropriate for screen size | Medium |
| TC-022 | 1024px breakpoint | View on desktop | Full shadow hierarchy active | Medium |

---

## Pre-conditions

1. Story 44.20 (Two-Level Pricing Display) is complete
2. Price Calculator page accessible at `/cogs/price-calculator`
3. User authenticated and has cabinet with products
4. Test data available for price calculation

## Test Data Requirements

| Data | Description | Source |
|------|-------------|--------|
| Product with COGS | Product with assigned COGS for calculation | Test fixtures |
| Calculation inputs | Valid form inputs (margins, costs, taxes) | Test fixtures |
| Various viewports | Device emulation settings | Browser DevTools |

---

## Automation Candidates

### Playwright E2E Tests

```typescript
// Recommended for automation
test.describe('Card Elevation System', () => {
  test('should apply correct shadow classes to form card', async ({ page }) => {
    await page.goto('/cogs/price-calculator')
    const formCard = page.locator('[data-testid="price-calculator-form"]')
    await expect(formCard).toHaveClass(/shadow-sm/)
  })

  test('should transition shadow on hover', async ({ page }) => {
    await page.goto('/cogs/price-calculator')
    const formCard = page.locator('[data-testid="price-calculator-form"]')
    await formCard.hover()
    await expect(formCard).toHaveClass(/shadow-md/)
  })

  test('should apply shadow-lg to hero price section', async ({ page }) => {
    // Fill form and calculate first
    const heroSection = page.locator('[data-testid="recommended-price-section"]')
    await expect(heroSection).toHaveClass(/shadow-lg/)
  })
})
```

### Visual Regression Tests

| Test | Tool | Automation Priority |
|------|------|---------------------|
| Full page screenshot comparison | Percy/Chromatic | High |
| Shadow rendering at breakpoints | Playwright + screenshot | High |
| Hover state screenshots | Playwright | Medium |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Shadow performance on older mobile devices | Medium | Test on low-end devices, verify CSS-only shadows |
| Browser inconsistency in shadow rendering | Low | Cross-browser testing matrix |
| Dark mode shadow visibility | Medium | Include dark mode tests if applicable |

---

## Definition of Done Checklist

- [ ] All AC verification tests passed (TC-001 to TC-022)
- [ ] Visual regression baseline captured
- [ ] Accessibility tests passed (A11Y-001 to A11Y-004)
- [ ] Responsive tests passed on all breakpoints
- [ ] Cross-browser tests passed
- [ ] Performance tests passed (no CLS issues)
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

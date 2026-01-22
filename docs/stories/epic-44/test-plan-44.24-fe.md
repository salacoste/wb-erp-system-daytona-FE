# Test Plan: Story 44.24-FE - Enhanced Slider with Visual Zones

## Overview

| Attribute | Value |
|-----------|-------|
| **Story** | 44.24-FE |
| **Title** | Enhanced Slider with Visual Zones |
| **Type** | Visual Enhancement |
| **Priority** | P1 - HIGH |
| **Effort** | 2 SP |
| **QA Owner** | TBD |
| **Created** | 2026-01-20 |

## Test Scope

This test plan covers visual zone enhancements for the margin slider:
- Zone overlay background (red 0-10%, yellow 10-25%, green 25%+)
- Dynamic track color based on current value
- Value badge with zone-based styling
- Zone labels below slider
- Tooltip on thumb hover

---

## Test Categories

### 1. Visual Regression Tests

| ID | Test Case | Expected Result | Tool |
|----|-----------|-----------------|------|
| VR-001 | Capture slider at 5% (low zone) | Red track, red badge, zone overlay | Percy/Chromatic |
| VR-002 | Capture slider at 18% (medium zone) | Yellow track, yellow badge | Percy/Chromatic |
| VR-003 | Capture slider at 35% (high zone) | Green track, green badge | Percy/Chromatic |
| VR-004 | Capture zone overlay | Three-colored zone background visible | Percy/Chromatic |

### 2. Accessibility Tests (WCAG 2.1 AA)

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| A11Y-001 | Zone labels provide text alternative | "Низкая", "Средняя", "Высокая" labels present | High |
| A11Y-002 | Keyboard navigation works | Arrow keys change value | High |
| A11Y-003 | Color is not sole indicator | Labels always present with colors | High |
| A11Y-004 | Badge text states zone name | Badge shows "Низкая", "Средняя", or "Высокая" | High |
| A11Y-005 | Focus ring visible on slider | Focus ring visible on all backgrounds | High |
| A11Y-006 | Screen reader announces value | ARIA attributes present | Medium |

### 3. Responsive Tests

| ID | Breakpoint | Test Case | Expected Result |
|----|------------|-----------|-----------------|
| R-001 | 375px (Mobile) | Zone overlay visible | Zones visible, scaled appropriately |
| R-002 | 375px (Mobile) | Labels visible | Zone labels readable |
| R-003 | 768px (Tablet) | Full slider experience | All elements visible |
| R-004 | 1024px (Desktop) | Full slider experience | All elements visible |

### 4. Cross-Browser Tests

| ID | Browser | Test Case | Expected Result |
|----|---------|-----------|-----------------|
| CB-001 | Chrome | Zone colors render | Red/yellow/green zones visible |
| CB-002 | Firefox | Zone colors render | Red/yellow/green zones visible |
| CB-003 | Safari | Slider interaction | Slider functions correctly |
| CB-004 | Edge | Zone colors render | All colors display correctly |

### 5. Functional Tests

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| F-001 | Slider value changes form state | Value updates in form | High |
| F-002 | Input field syncs with slider | Typing value updates slider | High |
| F-003 | Keyboard arrow keys work | Up/Down arrows change value | High |
| F-004 | Value stays within bounds | Cannot exceed min/max | Medium |

---

## Test Cases by Acceptance Criteria

### AC1: Visual Zone Overlay

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-001 | Red zone visible (0-10%) | View slider | `bg-red-100` zone at 0-10% width | High |
| TC-002 | Yellow zone visible (10-25%) | View slider | `bg-yellow-100` zone at 10-25% width | High |
| TC-003 | Green zone visible (25%+) | View slider | `bg-green-100` zone from 25% to end | High |
| TC-004 | Zone transitions | View zone boundaries | Subtle gradient transitions (if implemented) | Medium |
| TC-005 | Zone doesn't overwhelm slider | View slider | Zones visible but slider track on top | High |
| TC-006 | Zone proportions correct | Measure zone widths | Red: ~20%, Yellow: ~30%, Green: ~50% of track | Medium |

### AC2: Dynamic Track Color

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-007 | Track red at 5% | Set value to 5% | Track fill is `bg-red-500` | High |
| TC-008 | Track yellow at 15% | Set value to 15% | Track fill is `bg-yellow-500` | High |
| TC-009 | Track green at 35% | Set value to 35% | Track fill is `bg-green-500` | High |
| TC-010 | Color transition on drag | Drag from 5% to 35% | Color changes smoothly through zones | High |
| TC-011 | Track at boundary 10% | Set value to exactly 10% | Track changes from red to yellow | High |
| TC-012 | Track at boundary 25% | Set value to exactly 25% | Track changes from yellow to green | High |

### AC3: Value Badge Enhancement

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-013 | Low zone badge | Set value 0-9% | `bg-red-100 text-red-700 border-red-200` | High |
| TC-014 | Medium zone badge | Set value 10-24% | `bg-yellow-100 text-yellow-700 border-yellow-200` | High |
| TC-015 | High zone badge | Set value 25%+ | `bg-green-100 text-green-700 border-green-200` | High |
| TC-016 | Badge text - Low | Set value 5% | Badge shows "Низкая" | High |
| TC-017 | Badge text - Medium | Set value 18% | Badge shows "Средняя" | High |
| TC-018 | Badge text - High | Set value 30% | Badge shows "Высокая" | High |
| TC-019 | Badge shadow | Inspect badge | `shadow-sm` applied for depth | Medium |
| TC-020 | Badge updates on value change | Drag slider across zones | Badge color and text update | High |

### AC4: Zone Labels

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-021 | "Низкая" label position | View slider | Label at ~5% position (left side) | High |
| TC-022 | "Средняя" label position | View slider | Label at ~17.5% position (center-left) | High |
| TC-023 | "Высокая" label position | View slider | Label at ~37.5% position (right side) | High |
| TC-024 | Label colors match zones | Inspect labels | Red, yellow, green text colors | Medium |
| TC-025 | Label size | Inspect labels | `text-xs` for unobtrusiveness | Medium |
| TC-026 | Labels readable | View labels | Text clearly readable | High |

### AC5: Tooltip on Hover

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-027 | Tooltip appears on hover | Hover over slider thumb | Tooltip visible | High |
| TC-028 | Tooltip shows value | Hover at 20% | Tooltip shows "20%" | High |
| TC-029 | Tooltip shows zone label | Hover at 20% | Tooltip shows "20% (Средняя маржа)" | High |
| TC-030 | Tooltip follows thumb | Drag slider | Tooltip moves with thumb | Medium |
| TC-031 | Tooltip disappears on mouseout | Move mouse away | Tooltip hides | Medium |

---

## Zone Boundary Tests

| TC ID | Value | Expected Zone | Expected Track Color | Expected Badge |
|-------|-------|---------------|---------------------|----------------|
| TC-032 | 0% | Low | Red | Низкая (red) |
| TC-033 | 5% | Low | Red | Низкая (red) |
| TC-034 | 9.9% | Low | Red | Низкая (red) |
| TC-035 | 10% | Medium | Yellow | Средняя (yellow) |
| TC-036 | 17% | Medium | Yellow | Средняя (yellow) |
| TC-037 | 24.9% | Medium | Yellow | Средняя (yellow) |
| TC-038 | 25% | High | Green | Высокая (green) |
| TC-039 | 35% | High | Green | Высокая (green) |
| TC-040 | 50% | High | Green | Высокая (green) |

---

## Pre-conditions

1. Story 44.20 (Two-Level Pricing Display) is complete
2. Price Calculator page accessible at `/cogs/price-calculator`
3. User authenticated with valid cabinet
4. Margin slider visible in Target Margin section

## Test Data Requirements

| Data | Description | Purpose |
|------|-------------|---------|
| Value 5% | Low zone value | Test red zone |
| Value 15% | Medium zone value | Test yellow zone |
| Value 30% | High zone value | Test green zone |
| Boundary values | 0%, 10%, 25%, 50% | Test zone transitions |

---

## Automation Candidates

### Playwright E2E Tests

```typescript
test.describe('Enhanced Margin Slider', () => {
  test('should display zone overlay', async ({ page }) => {
    await page.goto('/cogs/price-calculator')

    const zoneOverlay = page.locator('[data-testid="slider-zone-overlay"]')
    await expect(zoneOverlay).toBeVisible()

    // Check zone colors
    const redZone = page.locator('[data-testid="zone-low"]')
    await expect(redZone).toHaveClass(/bg-red-100/)

    const yellowZone = page.locator('[data-testid="zone-medium"]')
    await expect(yellowZone).toHaveClass(/bg-yellow-100/)

    const greenZone = page.locator('[data-testid="zone-high"]')
    await expect(greenZone).toHaveClass(/bg-green-100/)
  })

  test('should show red track and badge at 5%', async ({ page }) => {
    await page.goto('/cogs/price-calculator')

    // Set slider to 5%
    await page.fill('[data-testid="margin-input"]', '5')

    const badge = page.locator('[data-testid="margin-badge"]')
    await expect(badge).toHaveClass(/bg-red-100/)
    await expect(badge).toHaveClass(/text-red-700/)
    await expect(badge).toHaveText('Низкая')
  })

  test('should show yellow track and badge at 18%', async ({ page }) => {
    await page.goto('/cogs/price-calculator')

    await page.fill('[data-testid="margin-input"]', '18')

    const badge = page.locator('[data-testid="margin-badge"]')
    await expect(badge).toHaveClass(/bg-yellow-100/)
    await expect(badge).toHaveText('Средняя')
  })

  test('should show green track and badge at 35%', async ({ page }) => {
    await page.goto('/cogs/price-calculator')

    await page.fill('[data-testid="margin-input"]', '35')

    const badge = page.locator('[data-testid="margin-badge"]')
    await expect(badge).toHaveClass(/bg-green-100/)
    await expect(badge).toHaveText('Высокая')
  })

  test('should display zone labels', async ({ page }) => {
    await page.goto('/cogs/price-calculator')

    await expect(page.getByText('Низкая')).toBeVisible()
    await expect(page.getByText('Средняя')).toBeVisible()
    await expect(page.getByText('Высокая')).toBeVisible()
  })

  test('should navigate with keyboard', async ({ page }) => {
    await page.goto('/cogs/price-calculator')

    const slider = page.locator('[data-testid="margin-slider"]')
    await slider.focus()

    // Press arrow up
    await page.keyboard.press('ArrowUp')

    const input = page.locator('[data-testid="margin-input"]')
    // Value should have increased
    const value = await input.inputValue()
    expect(parseFloat(value)).toBeGreaterThan(0)
  })

  test('should update badge on slider drag', async ({ page }) => {
    await page.goto('/cogs/price-calculator')

    // Start in low zone
    await page.fill('[data-testid="margin-input"]', '5')
    let badge = page.locator('[data-testid="margin-badge"]')
    await expect(badge).toHaveText('Низкая')

    // Move to high zone
    await page.fill('[data-testid="margin-input"]', '30')
    await expect(badge).toHaveText('Высокая')
  })
})
```

### Visual Regression Priority

| Test | Tool | Automation Priority |
|------|------|---------------------|
| Slider in all three zones | Percy/Chromatic | High |
| Zone overlay colors | Playwright + screenshot | High |
| Badge states (red/yellow/green) | Playwright | High |
| Zone labels alignment | Playwright | Medium |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Zone colors only indicator (accessibility) | High | Verify labels always present |
| Keyboard navigation broken | High | Test with keyboard only |
| Zone boundaries incorrect | Medium | Test exact boundary values |
| Tooltip not appearing | Medium | Test hover interaction |
| Mobile touch interaction issues | Medium | Test on real touch devices |

---

## Definition of Done Checklist

- [ ] All AC verification tests passed (TC-001 to TC-040)
- [ ] Zone overlay displays three colored zones
- [ ] Track color changes dynamically based on value
- [ ] Badge shows correct zone label and color
- [ ] Zone labels visible and aligned
- [ ] Tooltip works on hover (if implemented)
- [ ] Keyboard navigation functional
- [ ] Zone boundaries tested (0%, 10%, 25%, 50%)
- [ ] Mobile responsive verified
- [ ] Accessibility tests passed
- [ ] Cross-browser tests passed
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

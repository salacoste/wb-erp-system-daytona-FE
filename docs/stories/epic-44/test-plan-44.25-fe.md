# Test Plan: Story 44.25-FE - Loading States & Micro-interactions

## Overview

| Attribute | Value |
|-----------|-------|
| **Story** | 44.25-FE |
| **Title** | Loading States & Micro-interactions |
| **Type** | Visual Enhancement |
| **Priority** | P1 - HIGH |
| **Effort** | 3 SP |
| **QA Owner** | TBD |
| **Created** | 2026-01-20 |

## Test Scope

This test plan covers loading states and micro-interactions:
- Skeleton loader for results (with progress indicator)
- Value transition animations (count up/down)
- Copy button success animation (scale + checkmark)
- Form submit feedback (spinner, pulse, success flash)
- Hover & focus micro-interactions (lift, scale, press)
- `prefers-reduced-motion` support

---

## Test Categories

### 1. Visual Regression Tests

| ID | Test Case | Expected Result | Tool |
|----|-----------|-----------------|------|
| VR-001 | Capture skeleton loader state | Skeleton matches result layout | Percy/Chromatic |
| VR-002 | Capture copy button success state | Checkmark icon, green color, scale | Percy/Chromatic |
| VR-003 | Capture card hover state | Slight scale lift visible | Percy/Chromatic |

### 2. Accessibility Tests (WCAG 2.1 AA)

| ID | Test Case | Expected Result | Priority |
|----|-----------|-----------------|----------|
| A11Y-001 | `prefers-reduced-motion` support | Animations disabled/reduced when enabled | High |
| A11Y-002 | Loading state announced | `aria-live="polite"` present | High |
| A11Y-003 | Copy success announced | `aria-live="assertive"` announcement | High |
| A11Y-004 | No flashing animations | Animations don't cause seizure risk | High |
| A11Y-005 | Focus states remain clear | Focus visible with transitions | High |
| A11Y-006 | Screen reader compatible | Loading and success states read correctly | Medium |

### 3. Responsive Tests

| ID | Breakpoint | Test Case | Expected Result |
|----|------------|-----------|-----------------|
| R-001 | 375px (Mobile) | Skeleton loader display | Skeleton scales to mobile layout |
| R-002 | 375px (Mobile) | Animations work | Animations smooth on mobile |
| R-003 | 1024px (Desktop) | Full animation experience | All micro-interactions active |
| R-004 | All breakpoints | Progress indicator visible | Progress shows during loading |

### 4. Cross-Browser Tests

| ID | Browser | Test Case | Expected Result |
|----|---------|-----------|-----------------|
| CB-001 | Chrome | Animation rendering | All animations smooth |
| CB-002 | Firefox | Animation rendering | All animations smooth |
| CB-003 | Safari | Animation rendering | CSS transitions work |
| CB-004 | Edge | Animation rendering | All animations smooth |

### 5. Performance Tests

| ID | Test Case | Expected Result | Threshold |
|----|-----------|-----------------|-----------|
| P-001 | Animation smoothness | No jank during animations | 60fps |
| P-002 | No layout shift on loading | CLS < 0.1 | WCAG |
| P-003 | RequestAnimationFrame used | JS animations use RAF | Check code |
| P-004 | GPU-accelerated transforms | Uses transform, not width/height | Check CSS |

---

## Test Cases by Acceptance Criteria

### AC1: Enhanced Loading State

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-001 | Skeleton appears on submit | Click calculate button | Skeleton loader visible | High |
| TC-002 | Skeleton matches result layout | Compare to results | Layout similar (3 price sections) | High |
| TC-003 | Pulse animation on skeleton | Observe skeleton | `animate-pulse` visible | High |
| TC-004 | Progress indicator present | View during loading | Progress bar or percentage visible | High |
| TC-005 | Progress increases | Wait during loading | Progress value increases over time | Medium |
| TC-006 | Background gradient animation | Observe loading state | Subtle gradient animation | Low |
| TC-007 | Skeleton hero section styled | Inspect hero skeleton | Primary border/background hint | Medium |

### AC2: Value Transition Animations

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-008 | Price animates on change | Change inputs, recalculate | Value counts up/down | High |
| TC-009 | Animation duration | Observe animation | ~300ms duration | Medium |
| TC-010 | Value slides in direction | Increase value | New value slides from below | Medium |
| TC-011 | Currency symbol static | Observe during animation | "₽" doesn't animate | Medium |
| TC-012 | Smooth easing | Observe animation curve | Ease-out cubic or similar | Low |
| TC-013 | No flicker on rapid changes | Rapidly recalculate | No visual glitches | High |

### AC3: Copy Button Success Animation

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-014 | Button scales on copy | Click copy button | Button scales to ~110% | High |
| TC-015 | Checkmark icon appears | Click copy button | CheckCircle2 icon replaces Copy icon | High |
| TC-016 | Checkmark animation | Observe icon | Icon enters with zoom-in animation | Medium |
| TC-017 | Green color on success | Click copy button | Button/icon turns green | High |
| TC-018 | Tooltip shows "Скопировано!" | Click copy button | Tooltip visible for ~2s | Medium |
| TC-019 | Button returns to normal | Wait 2s after copy | Button returns to default state | High |
| TC-020 | Smooth icon transition | Observe transition | `transition-transform` smooth | Medium |
| TC-021 | Multiple copies work | Click copy twice | Animation repeats correctly | Medium |

### AC4: Form Submit Feedback

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-022 | Submit button shows spinner | Click calculate | Loader2 spinner visible inside button | High |
| TC-023 | Button width constant | Observe during loading | Width doesn't change | High |
| TC-024 | Pulse effect on button | Observe during loading | Subtle pulse animation | Medium |
| TC-025 | Success flash on results | After calculation completes | Brief green flash on results card | Medium |
| TC-026 | Button text changes | During loading | Shows "Расчёт..." | High |
| TC-027 | Button disabled during loading | Click during loading | Cannot submit again | High |

### AC5: Hover & Focus Micro-interactions

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-028 | Input lift on focus | Focus on input field | Shadow transitions `shadow-sm` to `shadow-md` | High |
| TC-029 | Card scale on hover | Hover over card | `scale-[1.01]` applied | Medium |
| TC-030 | Collapsible height animation | Expand/collapse section | Smooth height transition | Medium |
| TC-031 | Button press effect | Click and hold button | `scale-95` on active | Medium |
| TC-032 | Transition timing | Observe all transitions | Smooth, ~200ms duration | Medium |
| TC-033 | Focus states visible | Tab through form | Focus rings visible | High |

---

## Reduced Motion Tests

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| TC-034 | Enable reduced motion | Set `prefers-reduced-motion: reduce` | Animations disabled/reduced | High |
| TC-035 | Skeleton still visible | Enable reduced motion, load | Skeleton visible without pulse | High |
| TC-036 | Values update without animation | Enable reduced motion | Values change instantly | High |
| TC-037 | Copy feedback still works | Enable reduced motion | Checkmark appears, no animation | High |
| TC-038 | Transitions shortened | Enable reduced motion | Transitions instant or very fast | Medium |

---

## Animation Timing Tests

| TC ID | Animation | Expected Duration | Easing |
|-------|-----------|-------------------|--------|
| TC-039 | Value transition | 300ms | ease-out |
| TC-040 | Copy button scale | 200ms | ease-out |
| TC-041 | Card hover scale | 200ms | ease |
| TC-042 | Button press | 150ms | ease |
| TC-043 | Focus shadow transition | 200ms | ease |
| TC-044 | Icon zoom-in | 200ms | ease-out |

---

## Pre-conditions

1. Story 44.20 (Two-Level Pricing Display) is complete
2. Price Calculator page accessible at `/cogs/price-calculator`
3. User authenticated with valid cabinet
4. Valid form data for calculation

## Test Data Requirements

| Data | Description | Purpose |
|------|-------------|---------|
| Valid form inputs | Complete cost/margin data | Trigger calculation |
| Different margin values | Various calculation scenarios | Test value animations |
| Slow network | Throttled connection | Test loading state duration |

---

## Automation Candidates

### Playwright E2E Tests

```typescript
test.describe('Loading States & Micro-interactions', () => {
  test('should display skeleton loader during calculation', async ({ page }) => {
    await page.goto('/cogs/price-calculator')
    await fillCalculatorForm(page)

    // Click calculate and immediately check for skeleton
    await page.click('[data-testid="calculate-button"]')
    const skeleton = page.locator('[data-testid="results-skeleton"]')
    await expect(skeleton).toBeVisible()
  })

  test('should show progress indicator in skeleton', async ({ page }) => {
    await page.goto('/cogs/price-calculator')
    await fillCalculatorForm(page)

    await page.click('[data-testid="calculate-button"]')
    const progress = page.locator('[data-testid="loading-progress"]')
    await expect(progress).toBeVisible()
  })

  test('should animate copy button on success', async ({ page }) => {
    await page.goto('/cogs/price-calculator')
    await fillCalculatorForm(page)
    await page.click('[data-testid="calculate-button"]')
    await page.waitForSelector('[data-testid="results"]')

    // Click copy button
    await page.click('[data-testid="copy-recommended-price"]')

    // Check for checkmark icon
    const checkIcon = page.locator('[data-testid="copy-recommended-price"] svg')
    await expect(checkIcon).toBeVisible()

    // Check for success class
    const button = page.locator('[data-testid="copy-recommended-price"]')
    await expect(button).toHaveClass(/text-green-600/)
  })

  test('should show spinner in submit button during loading', async ({ page }) => {
    await page.goto('/cogs/price-calculator')
    await fillCalculatorForm(page)

    // Slow down network to see loading state
    await page.route('**/api/**', route => {
      setTimeout(() => route.continue(), 1000)
    })

    await page.click('[data-testid="calculate-button"]')

    const spinner = page.locator('[data-testid="calculate-button"] .animate-spin')
    await expect(spinner).toBeVisible()
  })

  test('should maintain button width during loading', async ({ page }) => {
    await page.goto('/cogs/price-calculator')
    await fillCalculatorForm(page)

    const button = page.locator('[data-testid="calculate-button"]')
    const initialWidth = await button.evaluate(el => el.offsetWidth)

    await page.click('[data-testid="calculate-button"]')

    const loadingWidth = await button.evaluate(el => el.offsetWidth)
    expect(loadingWidth).toBe(initialWidth)
  })

  test('should respect prefers-reduced-motion', async ({ page }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' })

    await page.goto('/cogs/price-calculator')
    await fillCalculatorForm(page)
    await page.click('[data-testid="calculate-button"]')

    // Skeleton should not have pulse animation
    const skeleton = page.locator('[data-testid="results-skeleton"]')
    const hasNoAnimation = await skeleton.evaluate(el => {
      const style = window.getComputedStyle(el)
      return style.animationDuration === '0s' || style.animation === 'none'
    })

    expect(hasNoAnimation).toBe(true)
  })

  test('should scale card on hover', async ({ page }) => {
    await page.goto('/cogs/price-calculator')
    await fillCalculatorForm(page)
    await page.click('[data-testid="calculate-button"]')
    await page.waitForSelector('[data-testid="results"]')

    const card = page.locator('[data-testid="results-card"]')
    await card.hover()

    // Check transform applied
    const transform = await card.evaluate(el =>
      window.getComputedStyle(el).transform
    )
    expect(transform).not.toBe('none')
  })

  test('should show input shadow change on focus', async ({ page }) => {
    await page.goto('/cogs/price-calculator')

    const input = page.locator('input[type="number"]').first()
    await input.focus()

    const inputWrapper = input.locator('..')
    await expect(inputWrapper).toHaveClass(/shadow-md|focus-within:ring/)
  })
})
```

### Visual Regression Priority

| Test | Tool | Automation Priority |
|------|------|---------------------|
| Skeleton loader state | Percy/Chromatic | High |
| Copy button success state | Playwright + screenshot | High |
| Card hover state | Playwright | Medium |
| Button loading state | Playwright | High |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Animations cause jank | High | Use GPU-accelerated transforms only |
| Reduced motion not respected | High | Test with media query emulation |
| Loading state too brief to see | Medium | Test with network throttling |
| Animation conflicts with functionality | High | Test all interactions during animations |
| Value animation causes flickering | Medium | Debounce rapid value changes |

---

## Definition of Done Checklist

- [ ] All AC verification tests passed (TC-001 to TC-044)
- [ ] Skeleton loader implemented and shows during calculation
- [ ] Progress indicator visible in loading state
- [ ] Copy button shows success animation (scale + checkmark + green)
- [ ] Value changes animate smoothly
- [ ] Submit button shows spinner, maintains width
- [ ] Hover/focus micro-interactions work
- [ ] `prefers-reduced-motion` respected (TC-034 to TC-038)
- [ ] Performance verified (60fps, no jank)
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

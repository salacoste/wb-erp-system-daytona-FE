# Accessibility Report: Epic 37 - MergedGroupTable

**Date**: 2026-01-02
**Tested By**: QA Automation
**Tool**: axe-core 4.11.0 via @axe-core/playwright
**WCAG Standard**: WCAG 2.1 AA

---

## Executive Summary

| Metric               | Result             |
| -------------------- | ------------------ |
| **Total Violations** | 2 → 1              |
| **Critical**         | 1                  |
| **Serious**          | 1 → 0 ✅ FIXED     |
| **Overall Status**   | ⚠️ **1 REMAINING** |

---

## Violations Found

### 1. aria-valid-attr-value (Critical)

**Rule ID**: `aria-valid-attr-value`
**Impact**: Critical
**WCAG**: 4.1.2 (Name, Role, Value)

**Description**: ARIA attributes must have valid values. The `aria-controls` attribute references an element ID that doesn't exist in the DOM.

**Affected Element**:

```html
<button type="button" role="tab" aria-selected="true"
  aria-controls="radix-_r_3_-content-sku"
  id="radix-_r_3_-trigger-sku" ...>
```

**Location**: View toggle tabs (shadcn/ui Tabs component)

**Root Cause**: Radix UI tabs generate dynamic IDs, but the content panel ID doesn't match the `aria-controls` reference at the time of axe-core scan.

**Recommendation**:

1. **Option A**: Update to latest @radix-ui/react-tabs (may be fixed)
2. **Option B**: Use custom toggle buttons instead of Tabs (already have GroupByToggle.tsx)
3. **Option C**: Add `aria-controls` manually with stable IDs

**Priority**: 🔴 High (blocks screen reader users)

---

### 2. color-contrast (Serious) ✅ FIXED

**Rule ID**: `color-contrast`
**Impact**: Serious
**WCAG**: 1.4.3 (Contrast Minimum)
**Status**: ✅ **FIXED on 2026-01-02**

**Original Issue**: The sidebar active link had white text on `#E53935` background, which provided only 4.22:1 contrast ratio (minimum required: 4.5:1).

**Fix Applied**:
Changed active link background from `#E53935` to `#C62828` (Material Red 800).

| Before                | After                 |
| --------------------- | --------------------- |
| `#E53935` (4.22:1) ❌ | `#C62828` (5.48:1) ✅ |

**Files Updated**:

1. ✅ `src/styles/globals.css` - CSS variables updated
2. ✅ `src/app/(dashboard)/layout.tsx` - active link updated
3. ✅ `src/components/custom/Sidebar.tsx` - active link updated
4. ✅ `src/components/custom/Sidebar.test.tsx` - test assertions updated

**Verification**: All 5 Sidebar unit tests pass with new color.

---

## Test Results Summary

| Test                       | Status          | Notes                                         |
| -------------------------- | --------------- | --------------------------------------------- |
| WCAG 2.1 AA violations     | ❌ 2 violations | See above                                     |
| Color contrast (rowspan)   | ✅ Pass         | 5.2:1                                         |
| Color contrast (aggregate) | ✅ Pass         | 10.8:1                                        |
| Color contrast (detail)    | ✅ Pass         | 8.4:1                                         |
| Keyboard navigation        | ⚠️ Partial      | Toggle buttons work, table headers need focus |
| ARIA labels                | ⚠️ Partial      | Crown icon needs aria-label                   |
| Focus indicators           | ✅ Pass         | Visible outline on all interactive elements   |
| Landmarks                  | ✅ Pass         | main, nav regions present                     |
| Mobile touch targets       | ✅ Pass         | Buttons ≥44px                                 |

---

## Components Tested

### Epic 37 Components (MergedGroupTable)

- `MergedGroupTable.tsx` - ✅ Accessible
- `GroupByToggle.tsx` - ⚠️ Uses Radix Tabs (aria issue)
- Crown icon (Lucide) - ⚠️ Needs aria-label

### Shared Components

- Sidebar active link - ❌ Color contrast issue
- Table component - ✅ Semantic structure

---

## Remediation Plan

### Immediate (Before Production)

1. **Fix color contrast** in sidebar:

   ```diff
   - bg-[#E53935] text-white
   + bg-[#C62828] text-white
   ```

2. **Add aria-label** to crown icon:
   ```tsx
   <Crown
     className="h-4 w-4 text-yellow-600"
     aria-label="Главный товар"
   />
   ```

### Post-MVP

3. **Replace Radix Tabs** with custom GroupByToggle:
   - Current GroupByToggle.tsx already has proper aria-pressed
   - Can remove Radix tabs dependency for this use case

---

## Appendix: axe-core Full Output

```
aria-valid-attr-value (critical)
  Ensure all ARIA attributes have valid values
  https://dequeuniversity.com/rules/axe/4.11/aria-valid-attr-value

  Affected: #radix-_r_3_-trigger-sku
  Message: Invalid ARIA attribute value: aria-controls="radix-_r_3_-content-sku"

color-contrast (serious)
  Elements must meet minimum color contrast ratio thresholds
  https://dequeuniversity.com/rules/axe/4.11/color-contrast

  Affected: .bg-[#E53935] > span
  Message: Element has insufficient color contrast of 4.22
           (foreground: #ffffff, background: #e53935)
           Expected contrast ratio of 4.5:1
```

---

## Manual Testing Required

The following tests require human testers:

| Test               | Tool     | Time  | Status     |
| ------------------ | -------- | ----- | ---------- |
| VoiceOver (macOS)  | Cmd+F5   | 1h    | 🚧 Pending |
| NVDA (Windows)     | NVDA     | 1h    | 🚧 Pending |
| TalkBack (Android) | Settings | 30min | 🚧 Pending |
| iOS VoiceOver      | Settings | 30min | 🚧 Pending |

---

**Report Version**: 1.0
**Generated**: 2026-01-02
**Status**: ⚠️ **2 violations found - fixes required**

# Story 44.44-FE: Price Calculator Preset Save/Load

**Epic**: Epic 44-FE - Price Calculator UI
**Priority**: P2 (Enhancement)
**Points**: 3
**Status**: 📋 Ready for Dev
**Created**: 2026-01-27
**Depends On**:
- Story 44.2 ✅ (Input Form Component)
- Story 44.4 ✅ (Page Layout & Integration)
- Story 44.27 ✅ (Warehouse Integration)

---

## User Story

**As a** seller using the price calculator,
**I want** to save my frequently used calculation parameters,
**So that** I don't have to re-enter them every time I open the page.

**Non-goals**:
- Multiple presets (only one preset per user)
- Server-side preset storage
- Sharing presets between users
- Preset versioning or history

---

## Acceptance Criteria

### AC1: Save Preset Button

- [ ] "Сохранить пресет" button visible in form header/footer
- [ ] On click: saves all form values to localStorage key `price-calculator-preset`
- [ ] Shows success toast: "Пресет сохранён"
- [ ] Button disabled while form is invalid
- [ ] Button shows loading state during save operation

### AC2: Load Preset on Page Load

- [ ] On page mount: check localStorage for `price-calculator-preset`
- [ ] If preset exists: populate all form fields with saved values
- [ ] If preset missing: use default form values
- [ ] Handle migration: if preset format changed, reset to defaults with warning
- [ ] Log preset load for debugging (development only)

### AC3: Clear Preset Button

- [ ] "Очистить пресет" button visible when preset exists
- [ ] On click: removes `price-calculator-preset` from localStorage
- [ ] Resets form to default values
- [ ] Shows info toast: "Пресет очищен"
- [ ] Button hidden when no preset exists

### AC4: Visual Indicator

- [ ] When preset is loaded: show badge/indicator "Пресет загружен"
- [ ] Badge placed near form header
- [ ] Badge dismissible or auto-hides after 3 seconds
- [ ] Badge includes icon (e.g., 💾 or ✓)

### AC5: Preset Version Migration

- [ ] Include `version` field in preset schema
- [ ] On load: check if preset version matches current schema version
- [ ] If version mismatch: discard preset, show warning toast
- [ ] Warning: "Формат пресета устарел, используются стандартные значения"

### AC6: Form Fields Covered

- [ ] All input fields from `PriceCalculatorFormValues` saved:
  - COGS (cost)
  - Target margin
  - Fulfillment type (FBO/FBS)
  - Warehouse ID
  - Box type ID
  - Dimensions (length, width, height, weight)
  - Tax configuration (rate, type)
  - DRR (advertising percentage)
  - Turnover days
  - Units per package
- [ ] Excluded from preset (dynamic data):
  - Delivery date (changes daily)
  - Calculation results
  - API-fetched coefficients

---

## API Contract

### localStorage Schema

```typescript
interface PriceCalculatorPreset {
  version: 1
  savedAt: string // ISO date string
  data: Partial<PriceCalculatorFormValues>
}

// Example stored value
{
  "version": 1,
  "savedAt": "2026-01-27T10:30:00.000Z",
  "data": {
    "cost": 500,
    "targetMargin": 25,
    "fulfillmentType": "FBO",
    "warehouseId": 507,
    "boxTypeId": 2,
    "length": 20,
    "width": 15,
    "height": 10,
    "weight": 0.5,
    "taxRate": 6,
    "taxType": "income",
    "drrPercent": 5,
    "turnoverDays": 30,
    "unitsPerPackage": 1
  }
}
```

### localStorage Key

- **Key**: `price-calculator-preset`
- **Max size**: ~2KB (form data only)

---

## Implementation Notes

### File Structure

```
src/
├── components/custom/price-calculator/
│   ├── PriceCalculatorForm.tsx              # UPDATE - Add preset buttons
│   ├── PresetIndicator.tsx                  # CREATE - Badge component
│   └── usePriceCalculatorPreset.ts          # CREATE - Preset hook
└── lib/
    └── preset-utils.ts                      # CREATE - Preset validation
```

### New Hook: usePriceCalculatorPreset

```typescript
// src/components/custom/price-calculator/usePriceCalculatorPreset.ts

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { PriceCalculatorFormValues } from '@/types/price-calculator'

const PRESET_KEY = 'price-calculator-preset'
const CURRENT_VERSION = 1

interface PriceCalculatorPreset {
  version: number
  savedAt: string
  data: Partial<PriceCalculatorFormValues>
}

interface UsePresetReturn {
  hasPreset: boolean
  isPresetLoaded: boolean
  loadPreset: () => Partial<PriceCalculatorFormValues> | null
  savePreset: (values: PriceCalculatorFormValues) => void
  clearPreset: () => void
}

export function usePriceCalculatorPreset(): UsePresetReturn {
  const [hasPreset, setHasPreset] = useState(false)
  const [isPresetLoaded, setIsPresetLoaded] = useState(false)

  // Check for preset on mount
  useEffect(() => {
    const stored = localStorage.getItem(PRESET_KEY)
    setHasPreset(!!stored)
  }, [])

  const loadPreset = useCallback((): Partial<PriceCalculatorFormValues> | null => {
    try {
      const stored = localStorage.getItem(PRESET_KEY)
      if (!stored) return null

      const preset: PriceCalculatorPreset = JSON.parse(stored)

      // Version migration check
      if (preset.version !== CURRENT_VERSION) {
        console.warn('[Preset] Version mismatch, discarding preset')
        localStorage.removeItem(PRESET_KEY)
        toast.warning('Формат пресета устарел, используются стандартные значения')
        setHasPreset(false)
        return null
      }

      setIsPresetLoaded(true)
      return preset.data
    } catch (error) {
      console.error('[Preset] Failed to load:', error)
      localStorage.removeItem(PRESET_KEY)
      setHasPreset(false)
      return null
    }
  }, [])

  const savePreset = useCallback((values: PriceCalculatorFormValues) => {
    try {
      const preset: PriceCalculatorPreset = {
        version: CURRENT_VERSION,
        savedAt: new Date().toISOString(),
        data: {
          cost: values.cost,
          targetMargin: values.targetMargin,
          fulfillmentType: values.fulfillmentType,
          warehouseId: values.warehouseId,
          boxTypeId: values.boxTypeId,
          length: values.length,
          width: values.width,
          height: values.height,
          weight: values.weight,
          taxRate: values.taxRate,
          taxType: values.taxType,
          drrPercent: values.drrPercent,
          turnoverDays: values.turnoverDays,
          unitsPerPackage: values.unitsPerPackage,
        },
      }

      localStorage.setItem(PRESET_KEY, JSON.stringify(preset))
      setHasPreset(true)
      toast.success('Пресет сохранён')
    } catch (error) {
      console.error('[Preset] Failed to save:', error)
      toast.error('Не удалось сохранить пресет')
    }
  }, [])

  const clearPreset = useCallback(() => {
    localStorage.removeItem(PRESET_KEY)
    setHasPreset(false)
    setIsPresetLoaded(false)
    toast.info('Пресет очищен')
  }, [])

  return {
    hasPreset,
    isPresetLoaded,
    loadPreset,
    savePreset,
    clearPreset,
  }
}
```

### PresetIndicator Component

```typescript
// src/components/custom/price-calculator/PresetIndicator.tsx

import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'

interface PresetIndicatorProps {
  isVisible: boolean
  autoHideMs?: number
}

export function PresetIndicator({
  isVisible,
  autoHideMs = 3000,
}: PresetIndicatorProps) {
  const [show, setShow] = useState(isVisible)

  useEffect(() => {
    if (isVisible) {
      setShow(true)
      const timer = setTimeout(() => setShow(false), autoHideMs)
      return () => clearTimeout(timer)
    }
  }, [isVisible, autoHideMs])

  if (!show) return null

  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
      💾 Пресет загружен
    </Badge>
  )
}
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Калькулятор цены                                                    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 💾 Пресет загружен  [×]              (auto-hides after 3s)   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  [Form fields...]                                                    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  [Сохранить пресет]  [Очистить пресет]  [Рассчитать]         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

Button States:
- "Сохранить пресет" - Always visible, disabled if form invalid
- "Очистить пресет" - Only visible when preset exists
- "Рассчитать" - Primary action button
```

---

## Invariants & Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No preset exists | Load default values, hide "Очистить пресет" button |
| Preset exists | Load preset values, show indicator, show clear button |
| Preset version mismatch | Discard preset, show warning, load defaults |
| Corrupted JSON in localStorage | Remove corrupted data, load defaults |
| localStorage unavailable | Fail silently, disable preset features |
| Form invalid | Disable "Сохранить пресет" button |
| Save while preset exists | Overwrite existing preset |
| Browser private mode | localStorage may not persist, handle gracefully |

---

## Test Scenarios

### Unit Tests

| Test | Input | Expected |
|------|-------|----------|
| loadPreset - no preset | localStorage empty | Returns null |
| loadPreset - valid preset | Valid preset in storage | Returns preset data |
| loadPreset - wrong version | Version 0 preset | Returns null, shows warning |
| loadPreset - corrupted JSON | Invalid JSON | Returns null, clears storage |
| savePreset - success | Valid form values | Saves to localStorage, toast shown |
| clearPreset - success | Preset exists | Removes from localStorage, toast shown |

### Integration Tests

| Test | Scenario | Expected |
|------|----------|----------|
| Save and reload | Save preset, reload page | Form populated with saved values |
| Clear and reload | Clear preset, reload page | Form has default values |
| Indicator auto-hide | Load preset | Indicator shows, hides after 3s |
| Button visibility | No preset | "Очистить пресет" hidden |
| Button visibility | Preset exists | "Очистить пресет" visible |

### E2E Tests

| Test | Flow | Verification |
|------|------|--------------|
| Full save flow | Fill form, save, reload | Values persisted |
| Full clear flow | Save, clear, reload | Default values |
| Cross-session persistence | Save, close browser, reopen | Values persisted |

---

## Observability

- **Logs**: Log preset load/save operations (development only)
- **Analytics**: Track preset usage (save/load/clear events)
- **Metrics**: Monitor preset adoption rate

---

## Security

- **Data Scope**: Only form values stored, no sensitive data
- **Storage**: Client-side only, never sent to server
- **Validation**: Validate preset structure before applying

---

## Accessibility (WCAG 2.1 AA)

- [ ] Save/Clear buttons have aria-labels
- [ ] Preset indicator announced to screen readers
- [ ] Toast notifications accessible
- [ ] Button disabled states communicated
- [ ] Color contrast >= 4.5:1 for indicator badge

---

## Definition of Done

- [ ] usePriceCalculatorPreset hook created
- [ ] Save preset functionality working
- [ ] Load preset on page mount working
- [ ] Clear preset functionality working
- [ ] Version migration handling implemented
- [ ] PresetIndicator component created
- [ ] Button visibility logic correct
- [ ] Unit tests written (>90% coverage)
- [ ] Integration tests for save/load cycle
- [ ] E2E test for persistence
- [ ] No ESLint errors
- [ ] Accessibility audit passed
- [ ] Code review completed

---

## Related Documentation

- **Form Component**: Story 44.2 (Input Form Component)
- **Page Layout**: Story 44.4 (Page Layout & Integration)
- **Form Hook**: `src/components/custom/price-calculator/usePriceCalculatorForm.ts`
- **Sonner Toast**: Already in project for notifications

---

**Created**: 2026-01-27
**Author**: PM (Preset Save/Load Feature)
**Phase**: Phase 6 (Enhancement)

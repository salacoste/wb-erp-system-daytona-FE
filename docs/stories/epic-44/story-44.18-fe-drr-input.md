# Story 44.18: DRR Input (Advertising Percentage)

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 📋 Ready for Dev
**Priority**: P1 - IMPORTANT
**Effort**: 1 SP
**Depends On**: Story 44.2 (Input Form)
**Requirements Ref**: PRICE-CALCULATOR-REQUIREMENTS.md Section 2, Step 12

---

## User Story

**As a** Seller,
**I want** to specify my DRR (advertising expense percentage) in the price calculator,
**So that** I can factor in my planned advertising costs when calculating the recommended price.

**Non-goals**:
- Actual advertising campaign management
- DRR calculation from historical data
- Multiple DRR values for different channels
- Advertising ROI analysis

---

## Background: DRR (Доля Рекламных Расходов)

**DRR** = Доля Рекламных Расходов (Share of Advertising Expenses)

### Definition
- Percentage of selling price allocated to advertising
- Variable cost (unlike COGS, logistics - fixed costs)
- Affects final margin calculation

### Formula Impact
```typescript
// DRR is subtracted from margin as % of price
advertising_cost = recommended_price * (drr_pct / 100)

// In two-level pricing:
// 1. Minimum price = without DRR (fixed costs only)
// 2. Recommended price = with DRR + target margin
```

### Common Values
| Seller Type | Typical DRR |
|-------------|-------------|
| Новый продавец | 5-10% |
| Средний продавец | 3-7% |
| Топ-продавец | 2-5% |
| Без рекламы | 0% |

---

## Acceptance Criteria

### AC1: DRR Input Field
- [ ] Input field for "DRR" (Доля рекламных расходов)
- [ ] Numeric input with % suffix
- [ ] Range: 0-30%
- [ ] Default: 5%
- [ ] Step: 0.5%
- [ ] Slider + input combo (like margin slider)

### AC2: Field Label and Tooltip
- [ ] Label: "DRR (Доля рекламных расходов)"
- [ ] Tooltip explaining:
  - What DRR means
  - How it affects price calculation
  - Typical values for different seller types

### AC3: Visual Feedback
- [ ] Color indicator based on DRR level:
  - 0-3%: Green (low advertising spend)
  - 3-7%: Yellow (moderate)
  - 7-15%: Orange (high)
  - >15%: Red (very high)
- [ ] Warning message if DRR > 15%

### AC4: Advertising Cost Preview
- [ ] Show calculated advertising cost in ₽ (when price available)
- [ ] Format: "Расходы на рекламу: X ₽"
- [ ] Update in real-time as DRR or price changes

### AC5: Form State Integration
- [ ] Store `drr_pct` in form state
- [ ] Include in calculation request
- [ ] Reset to default (5%) on form reset
- [ ] Distinguish from existing `advertising_pct` field (if different)

---

## Context & References

- **Requirements**: `PRICE-CALCULATOR-REQUIREMENTS.md` Section 2, Step 12
- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Story 44.2**: Input Form Component
- **Story 44.20**: Two-Level Pricing (shows DRR in breakdown)

### Relationship to Existing Fields

The existing form has `advertising_pct` field. This story may:
1. **Rename** existing field to `drr_pct` with enhanced UI, OR
2. **Replace** the simple input with slider + preview

---

## Implementation Notes

### File Structure

```
src/
└── components/
    └── custom/
        └── price-calculator/
            ├── PriceCalculatorForm.tsx           # UPDATE - Enhance advertising field
            └── DrrSlider.tsx                     # CREATE (or use MarginSlider pattern)
```

### Component Structure

```typescript
// src/components/custom/price-calculator/DrrSlider.tsx
'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DrrSliderProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  advertisingCost?: number    // Calculated cost in ₽
  error?: string
}

// DRR level classification
function getDrrLevel(drr: number): {
  level: 'low' | 'moderate' | 'high' | 'very-high'
  color: string
  bgColor: string
} {
  if (drr <= 3) return { level: 'low', color: 'text-green-600', bgColor: 'bg-green-100' }
  if (drr <= 7) return { level: 'moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
  if (drr <= 15) return { level: 'high', color: 'text-orange-600', bgColor: 'bg-orange-100' }
  return { level: 'very-high', color: 'text-red-600', bgColor: 'bg-red-100' }
}

const DRR_LEVEL_LABELS = {
  'low': 'Низкий',
  'moderate': 'Умеренный',
  'high': 'Высокий',
  'very-high': 'Очень высокий',
} as const

export function DrrSlider({
  value,
  onChange,
  disabled,
  advertisingCost,
  error,
}: DrrSliderProps) {
  const { level, color, bgColor } = getDrrLevel(value)
  const isVeryHigh = value > 15

  return (
    <div className="space-y-3">
      {/* Label and Tooltip */}
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          DRR (Доля рекламных расходов)
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-medium">DRR — процент от цены на рекламу</p>
              <p className="mt-1 text-xs">Это переменный расход, который влияет на финальную маржу.</p>
              <ul className="mt-2 text-xs space-y-0.5">
                <li>• Новые продавцы: 5-10%</li>
                <li>• Средние: 3-7%</li>
                <li>• Топ-продавцы: 2-5%</li>
                <li>• Без рекламы: 0%</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </Label>

        <Badge variant="outline" className={cn('text-xs', bgColor, color)}>
          {DRR_LEVEL_LABELS[level]}
        </Badge>
      </div>

      {/* Slider + Input */}
      <div className="flex items-center gap-4">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={0}
          max={30}
          step={0.5}
          disabled={disabled}
          className="flex-1"
        />
        <div className="flex items-center gap-1 w-20">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            min={0}
            max={30}
            step={0.5}
            disabled={disabled}
            className="w-16 text-center"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>

      {/* Warning for very high DRR */}
      {isVeryHigh && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <AlertTriangle className="h-3 w-3" />
          Очень высокий DRR может привести к убыточности
        </div>
      )}

      {/* Advertising Cost Preview */}
      {advertisingCost !== undefined && advertisingCost > 0 && (
        <div className="text-sm text-muted-foreground">
          Расходы на рекламу:{' '}
          <span className="font-medium text-foreground">
            {advertisingCost.toLocaleString('ru-RU', {
              style: 'currency',
              currency: 'RUB',
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
```

### Form Data Updates

```typescript
// Update FormData interface in PriceCalculatorForm.tsx
interface FormData {
  drr_pct: number              // Renamed from advertising_pct
  // ... existing fields ...
}

// Update defaultValues
const defaultValues: FormData = {
  drr_pct: 5,                  // Default 5%
  // ... existing defaults ...
}
```

### Calculation Integration

```typescript
// In price calculation
const advertising_cost_rub = recommended_price * (drr_pct / 100)
const net_margin_rub = gross_margin_rub - advertising_cost_rub

// For results display
const calculatedAdvertisingCost = useMemo(() => {
  if (calculationResult?.result.recommended_price && drrPct > 0) {
    return calculationResult.result.recommended_price * (drrPct / 100)
  }
  return undefined
}, [calculationResult, drrPct])
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ DRR (Доля рекламных расходов)                    [?] [Умер.]│
├─────────────────────────────────────────────────────────────┤
│ ╔═══════════════════●═══════════════════╗    [ 5.0 ] %      │
│ 0%                   ▲                 30%                   │
│                      5%                                      │
├─────────────────────────────────────────────────────────────┤
│ Расходы на рекламу: 202,89 ₽                                │
└─────────────────────────────────────────────────────────────┘

When DRR > 15%:
┌─────────────────────────────────────────────────────────────┐
│ DRR (Доля рекламных расходов)            [?] [Очень высокий]│
├─────────────────────────────────────────────────────────────┤
│ ╔═══════════════════════════════════●═══╗    [18.0 ] %      │
│ 0%                                  ▲   30%                  │
│                                    18%                       │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ Очень высокий DRR может привести к убыточности           │
│ Расходы на рекламу: 730,42 ₽                                │
└─────────────────────────────────────────────────────────────┘
```

### Invariants & Edge Cases

| Scenario | Handling |
|----------|----------|
| DRR = 0% | Valid - no advertising |
| DRR = 30% | Maximum value |
| DRR > 30% | Validation error |
| DRR negative | Validation error |
| No price calculated | Don't show advertising cost preview |
| Form reset | Reset to 5% |

---

## Observability

- **Analytics**: Track DRR distribution across users
- **Metrics**: Average DRR value, % using 0%
- **Logs**: Log DRR for calculation debugging

---

## Security

- **Input Validation**: DRR 0-30%
- **XSS Prevention**: No user-generated HTML
- **State Isolation**: DRR stored in controlled state only

---

## Accessibility (WCAG 2.1 AA)

- [ ] Slider has `aria-label` and `aria-valuenow`
- [ ] Input has associated label
- [ ] Level badge accessible to screen readers
- [ ] Color contrast ≥4.5:1
- [ ] Touch targets ≥44×44px
- [ ] Warning announced to screen readers

---

## Testing Requirements

### Unit Tests
- [ ] DrrSlider renders with default value
- [ ] Slider and input sync correctly
- [ ] Level badge changes based on value
- [ ] Warning shows for very high DRR
- [ ] Advertising cost preview displays

### Integration Tests
- [ ] DRR affects calculation results
- [ ] Form reset clears to default
- [ ] Two-level pricing reflects DRR

---

## Dev Agent Record

### File List
| File | Change Type | Lines (Est.) | Description |
|------|-------------|--------------|-------------|
| `src/components/custom/price-calculator/DrrSlider.tsx` | CREATE | ~120 | DRR slider component |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | UPDATE | +15 | Add DRR slider |
| `src/types/price-calculator.ts` | UPDATE | +5 | Rename advertising_pct to drr_pct |

### Change Log
_(To be filled by Dev Agent during implementation)_

---

## QA Results

_(To be filled after implementation)_

**Reviewer**:
**Date**:
**Gate Decision**:

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | DRR Input Field | ⏳ | |
| AC2 | Label and Tooltip | ⏳ | |
| AC3 | Visual Feedback | ⏳ | |
| AC4 | Advertising Cost Preview | ⏳ | |
| AC5 | Form State Integration | ⏳ | |

---

## Definition of Done

- [ ] All Acceptance Criteria verified (AC1-AC5)
- [ ] Component created with proper TypeScript types
- [ ] Unit tests written and passing
- [ ] No ESLint errors
- [ ] Accessibility audit passed
- [ ] Code review completed
- [ ] QA Gate passed

---

**Created**: 2026-01-20
**Last Updated**: 2026-01-20

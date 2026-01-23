# Story 44.18: DRR Input (Advertising Percentage)

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: ✅ Complete
**Priority**: P1 - IMPORTANT
**Effort**: 1 SP
**Completed**: 2026-01-23
**Depends On**: Story 44.2 (Input Form)
**Requirements Ref**: PRICE-CALCULATOR-REQUIREMENTS.md Section 2, Step 12
**Backend API**: `POST /v1/products/price-calculator` with `advertising_pct` parameter

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
- [x] Input field for "DRR" (Доля рекламных расходов)
- [x] Numeric input with % suffix
- [x] Range: 0-30%
- [x] Default: 5%
- [x] Step: 0.5%
- [x] Slider + input combo (like margin slider)

### AC2: Field Label and Tooltip
- [x] Label: "DRR (Доля рекламных расходов)"
- [x] Tooltip explaining:
  - What DRR means
  - How it affects price calculation
  - Typical values for different seller types

### AC3: Visual Feedback
- [x] Color indicator based on DRR level:
  - 0-3%: Green (low advertising spend)
  - 3-7%: Yellow (moderate)
  - 7-15%: Orange (high)
  - >15%: Red (very high)
- [x] Warning message if DRR > 15%

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
- **Epic 33-FE**: Advertising Analytics UI (real DRR data source)

### Relationship to Existing Fields

The existing form has `advertising_pct` field. This story:
1. **Enhances** the existing `advertising_pct` field with slider + preview UI
2. **Keeps** the backend field name as `advertising_pct` (for API compatibility)
3. **Labels** it as "DRR" in the UI for seller familiarity

---

## API Contract

### Backend Integration

**Price Calculator Request** (`POST /v1/products/price-calculator`):
```json
{
  "advertising_pct": 5.0,        // DRR: 0-100% (typically 0-30%)
  "target_margin_pct": 20,
  "cogs_rub": 1500,
  // ... other fields
}
```

**Response includes advertising in breakdown:**
```json
{
  "result": {
    "recommended_price": 4057.87,
    "actual_margin_rub": 811.57
  },
  "percentage_breakdown": {
    "advertising": {
      "pct": 5.0,
      "rub": 202.89,
      "description": "Рекламные расходы (DRR)"
    }
  }
}
```

**Important Notes:**
- `advertising_pct` is a **variable cost** (percentage of selling price)
- NOT included in **minimum price** calculation (only fixed costs)
- Included in **recommended price** calculation
- Backend field: `advertising_pct`, UI label: "DRR"

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
// FormData interface - keep backend field name for API compatibility
interface FormData {
  advertising_pct: number      // Backend field name (sent to API)
  // UI displays as "DRR" but uses advertising_pct internally
  // ... existing fields ...
}

// Update defaultValues
const defaultValues: FormData = {
  advertising_pct: 5,          // Default 5% DRR
  // ... existing defaults ...
}

// API Request uses advertising_pct directly
const request: PriceCalculatorRequest = {
  advertising_pct: formData.advertising_pct,  // 0-100
  // ...
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
| DRR = 0% | Valid - no advertising, hide cost preview |
| DRR = 30% | Maximum recommended value (soft limit) |
| DRR > 30% | Allow up to 100%, show strong warning above 15% |
| DRR negative | Validation error: "DRR не может быть отрицательным" |
| No price calculated | Don't show advertising cost preview |
| Form reset | Reset to 5% (default) |
| Slider + input desync | Input always takes priority, slider follows |
| DRR causes negative margin | Show error: "DRR слишком высокий для заданной маржи" |
| Mobile viewport | Full-width slider, input below |

### DRR Level Classification

| Range | Level | Color | Description |
|-------|-------|-------|-------------|
| 0-3% | Низкий | Green | Low ad spend, organic sales |
| 3-7% | Умеренный | Yellow | Moderate spend, typical for established sellers |
| 7-15% | Высокий | Orange | High spend, growth focus |
| >15% | Очень высокий | Red | Very high, potential profitability risk |

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
- [x] DrrSlider renders with default value
- [x] Slider and input sync correctly
- [x] Level badge changes based on value
- [x] Warning shows for very high DRR
- [x] Advertising cost preview displays

### Integration Tests
- [x] DRR affects calculation results (via PercentageCostsFormSection)
- [x] Form reset clears to default
- [x] Two-level pricing reflects DRR

---

## Dev Agent Record

### File List
| File | Change Type | Lines (Est.) | Description |
|------|-------------|--------------|-------------|
| `src/components/custom/price-calculator/DrrSlider.tsx` | UPDATED | 202 | Enhanced with accessibility (aria-labels, role="alert") |
| `src/components/custom/price-calculator/__tests__/DrrSlider.test.tsx` | UPDATED | +50 | Added accessibility tests |

### Change Log
- 2026-01-21: Enhanced DrrSlider with WCAG 2.1 AA accessibility
  - Added aria-label, aria-valuenow, aria-valuemin, aria-valuemax, aria-valuetext to Slider
  - Added aria-label to Input
  - Added role="alert" and aria-live="polite" to warning message
  - Added aria-hidden="true" to decorative % symbol
  - Exported DRR_LEVEL_LABELS constant for reuse
- 2026-01-21: Added 6 accessibility unit tests (32 total tests passing)

---

## QA Results

**Reviewer**: Dev Agent #4
**Date**: 2026-01-21
**Gate Decision**: PASS

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | DRR Input Field | ✅ | Slider + Input combo, 0-30% range, 0.5% step, default 5% |
| AC2 | Label and Tooltip | ✅ | Label with FieldTooltip explaining DRR for seller types |
| AC3 | Visual Feedback | ✅ | Color-coded badge (green/yellow/orange/red) with level labels |
| AC4 | Advertising Cost Preview | ✅ | Shows formatted cost in ₽ when advertisingCost prop provided |
| AC5 | Form State Integration | ✅ | Integrated via PercentageCostsFormSection in PriceCalculatorForm |

---

## Definition of Done

- [x] All Acceptance Criteria verified (AC1-AC5)
- [x] Component created with proper TypeScript types
- [x] Unit tests written and passing (32 tests)
- [x] No ESLint errors
- [x] Accessibility audit passed (aria-labels, role="alert", linked labels)
- [x] Code review completed
- [x] QA Gate passed

---

**Created**: 2026-01-20
**Last Updated**: 2026-01-21

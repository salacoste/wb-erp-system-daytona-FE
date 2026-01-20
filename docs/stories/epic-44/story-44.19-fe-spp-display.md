# Story 44.19: SPP Display (Customer Price)

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 📋 Ready for Dev
**Priority**: P2 - NORMAL
**Effort**: 1 SP
**Depends On**: Story 44.3 (Results Display), Story 44.20 (Two-Level Pricing)
**Requirements Ref**: PRICE-CALCULATOR-REQUIREMENTS.md Section 2, Step 13

---

## User Story

**As a** Seller,
**I want** to see the customer-facing price after SPP discount in the price calculator,
**So that** I understand what price my customers will actually see on WB.

**Non-goals**:
- SPP auto-detection from WB API
- SPP history tracking
- SPP per-product configuration
- Customer segment analysis

---

## Background: SPP (Скидка Постоянного Покупателя)

**SPP** = Скидка Постоянного Покупателя (Permanent Buyer Discount)

### How SPP Works
- WB provides this discount **at their expense**
- Applied AFTER seller sets their price
- Does NOT affect seller's revenue
- Customers see the discounted price

### Formula
```typescript
customer_price = recommended_price * (1 - spp_pct / 100)

// Example:
// recommended_price = 4,057.87 ₽
// spp_pct = 10%
// customer_price = 4,057.87 * 0.90 = 3,652.08 ₽
```

### Important Notes
- Seller receives full `recommended_price`
- SPP is informational - helps seller understand market positioning
- SPP typically ranges 0-30% (varies by buyer loyalty level)

---

## Acceptance Criteria

### AC1: SPP Input Field
- [ ] Input field for "СПП" (SPP percentage)
- [ ] Numeric input with % suffix
- [ ] Range: 0-30%
- [ ] Default: 0% (no discount)
- [ ] Step: 1%
- [ ] Simple input (no slider needed)

### AC2: SPP Explanation
- [ ] Label: "СПП (Скидка постоянного покупателя)"
- [ ] Tooltip explaining:
  - SPP is provided by WB at their expense
  - Does not affect seller revenue
  - Shows what customer sees

### AC3: Customer Price Display
- [ ] Show calculated customer price in results section
- [ ] Format: "Цена для покупателя: X ₽"
- [ ] Sub-text: "(с учётом СПП Y%)"
- [ ] Only display if SPP > 0

### AC4: Price Comparison
- [ ] Show both prices side-by-side when SPP > 0:
  - "Ваша цена: X ₽"
  - "Цена для покупателя: Y ₽"
- [ ] Visual indication that seller receives full price
- [ ] Difference amount: "Скидка WB: Z ₽"

### AC5: Form State Integration
- [ ] Store `spp_pct` in form state
- [ ] Customer price calculated client-side (not sent to API)
- [ ] Reset to 0% on form reset

---

## Context & References

- **Requirements**: `PRICE-CALCULATOR-REQUIREMENTS.md` Section 2, Step 13
- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Story 44.3**: Results Display (where customer price appears)
- **Story 44.20**: Two-Level Pricing (shows in results)

---

## Implementation Notes

### File Structure

```
src/
└── components/
    └── custom/
        └── price-calculator/
            ├── PriceCalculatorForm.tsx           # UPDATE - Add SPP input
            ├── PriceCalculatorResults.tsx        # UPDATE - Add customer price
            └── SppInput.tsx                      # CREATE - SPP input component
            └── CustomerPriceDisplay.tsx          # CREATE - Customer price display
```

### Component Structure

```typescript
// src/components/custom/price-calculator/SppInput.tsx
'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface SppInputProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  error?: string
}

export function SppInput({
  value,
  onChange,
  disabled,
  error,
}: SppInputProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        СПП (Скидка постоянного покупателя)
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>СПП — скидка, которую WB предоставляет покупателям за свой счёт.</p>
            <p className="mt-2 text-xs"><strong>Важно:</strong> Вы получаете полную сумму без учёта СПП. Эта скидка показывает, какую цену увидит покупатель.</p>
          </TooltipContent>
        </Tooltip>
      </Label>

      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={0}
          max={30}
          step={1}
          disabled={disabled}
          className="w-20"
        />
        <span className="text-muted-foreground">%</span>
      </div>

      {value > 0 && (
        <p className="text-xs text-muted-foreground">
          Покупатель увидит цену со скидкой {value}%
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
```

```typescript
// src/components/custom/price-calculator/CustomerPriceDisplay.tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { User, Store } from 'lucide-react'

interface CustomerPriceDisplayProps {
  recommendedPrice: number
  sppPct: number
  className?: string
}

export function CustomerPriceDisplay({
  recommendedPrice,
  sppPct,
  className,
}: CustomerPriceDisplayProps) {
  // Only show if SPP > 0
  if (sppPct <= 0) return null

  const customerPrice = recommendedPrice * (1 - sppPct / 100)
  const discountAmount = recommendedPrice - customerPrice

  return (
    <Card className={className}>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {/* Seller receives */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Store className="h-4 w-4" />
              <span>Ваша цена (получаете вы):</span>
            </div>
            <span className="font-medium">
              {formatCurrency(recommendedPrice)}
            </span>
          </div>

          {/* Customer sees */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Цена для покупателя:</span>
            </div>
            <div className="text-right">
              <span className="font-medium text-lg">
                {formatCurrency(customerPrice)}
              </span>
              <Badge variant="secondary" className="ml-2 text-xs">
                -{sppPct}%
              </Badge>
            </div>
          </div>

          {/* WB discount */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              Скидка WB (за их счёт):
            </span>
            <span className="text-xs text-green-600 font-medium">
              -{formatCurrency(discountAmount)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Form Data Updates

```typescript
// Update FormData interface in PriceCalculatorForm.tsx
interface FormData {
  spp_pct: number              // NEW - 0-30%
  // ... existing fields ...
}

// Update defaultValues
const defaultValues: FormData = {
  spp_pct: 0,                  // Default: no SPP
  // ... existing defaults ...
}
```

### Results Integration

```typescript
// In PriceCalculatorResults.tsx
interface PriceCalculatorResultsProps {
  data: PriceCalculatorResponse
  sppPct: number               // NEW - for customer price display
}

export function PriceCalculatorResults({
  data,
  sppPct,
}: PriceCalculatorResultsProps) {
  const recommendedPrice = data.result.recommended_price

  return (
    <div className="space-y-4">
      {/* ... existing results ... */}

      {/* Customer Price (if SPP > 0) */}
      <CustomerPriceDisplay
        recommendedPrice={recommendedPrice}
        sppPct={sppPct}
      />
    </div>
  )
}
```

### UI Layout

```
Form Section:
┌─────────────────────────────────────────────────────────────┐
│ СПП (Скидка постоянного покупателя)                    [?]  │
│ [  10  ] %                                                  │
│ Покупатель увидит цену со скидкой 10%                       │
└─────────────────────────────────────────────────────────────┘

Results Section (when SPP > 0):
┌─────────────────────────────────────────────────────────────┐
│ 🏪 Ваша цена (получаете вы):           4 057,87 ₽           │
│ 👤 Цена для покупателя:          3 652,08 ₽  [-10%]        │
├─────────────────────────────────────────────────────────────┤
│ Скидка WB (за их счёт):                -405,79 ₽            │
└─────────────────────────────────────────────────────────────┘
```

### Invariants & Edge Cases

| Scenario | Handling |
|----------|----------|
| SPP = 0% | Don't show customer price section |
| SPP = 30% | Maximum value |
| SPP > 30% | Validation error |
| SPP negative | Validation error |
| No calculation result | Don't show customer price |
| Form reset | Reset SPP to 0% |

---

## Observability

- **Analytics**: Track SPP usage (% of users entering SPP > 0)
- **Metrics**: Average SPP value entered
- **Logs**: Log SPP for calculation debugging

---

## Security

- **Input Validation**: SPP 0-30%
- **XSS Prevention**: No user-generated HTML
- **State Isolation**: SPP stored in controlled state only

---

## Accessibility (WCAG 2.1 AA)

- [ ] Input has associated label
- [ ] Tooltip accessible via keyboard
- [ ] Color contrast ≥4.5:1
- [ ] Touch targets ≥44×44px
- [ ] Price comparison readable by screen readers
- [ ] Icons have accessible labels

---

## Testing Requirements

### Unit Tests
- [ ] SppInput renders with default value
- [ ] SppInput validates range (0-30%)
- [ ] CustomerPriceDisplay shows when SPP > 0
- [ ] CustomerPriceDisplay hidden when SPP = 0
- [ ] Customer price calculated correctly

### Integration Tests
- [ ] SPP input updates results display
- [ ] Form reset clears SPP to 0
- [ ] Customer price shows in results

---

## Dev Agent Record

### File List
| File | Change Type | Lines (Est.) | Description |
|------|-------------|--------------|-------------|
| `src/components/custom/price-calculator/SppInput.tsx` | CREATE | ~60 | SPP input component |
| `src/components/custom/price-calculator/CustomerPriceDisplay.tsx` | CREATE | ~70 | Customer price display |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | UPDATE | +10 | Add SPP input |
| `src/components/custom/price-calculator/PriceCalculatorResults.tsx` | UPDATE | +10 | Add customer price |

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
| AC1 | SPP Input Field | ⏳ | |
| AC2 | SPP Explanation | ⏳ | |
| AC3 | Customer Price Display | ⏳ | |
| AC4 | Price Comparison | ⏳ | |
| AC5 | Form State Integration | ⏳ | |

---

## Definition of Done

- [ ] All Acceptance Criteria verified (AC1-AC5)
- [ ] Components created with proper TypeScript types
- [ ] Unit tests written and passing
- [ ] No ESLint errors
- [ ] Accessibility audit passed
- [ ] Code review completed
- [ ] QA Gate passed

---

**Created**: 2026-01-20
**Last Updated**: 2026-01-20

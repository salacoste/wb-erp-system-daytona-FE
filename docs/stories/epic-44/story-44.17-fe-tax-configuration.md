# Story 44.17: Tax Configuration (Rate + Type)

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 📋 Ready for Dev
**Priority**: P1 - IMPORTANT
**Effort**: 2 SP
**Depends On**: Story 44.2 (Input Form)
**Requirements Ref**: PRICE-CALCULATOR-REQUIREMENTS.md Section 2, Step 10

---

## User Story

**As a** Seller,
**I want** to configure my tax rate and tax calculation type in the price calculator,
**So that** I get an accurate recommended price that accounts for my specific tax regime.

**Non-goals**:
- Tax regime auto-detection from cabinet settings
- Tax calculation/filing functionality
- Multiple tax rate combinations
- Regional tax variations

---

## Background: Russian Tax Regimes

| Tax Regime | Rate | Type | Description |
|------------|------|------|-------------|
| УСН Доходы | 6% | income | Tax on total revenue |
| УСН Доходы-Расходы | 15% | profit | Tax on profit after expenses |
| Самозанятый | 6% | income | Self-employed tax on revenue |
| ИП на ОСН | 13% | profit | Individual on general system |
| ООО на ОСН | 20% | profit | Company on general system |

### Tax Calculation Impact

**Income Tax (`tax_type: 'income'`):**
- Tax calculated as % of total revenue (selling price)
- Added to percentage costs in price formula
- `tax_amount = recommended_price * tax_rate_pct / 100`

**Profit Tax (`tax_type: 'profit'`):**
- Tax calculated as % of profit after all expenses
- NOT included in main formula
- Calculated separately: `profit_tax = net_margin * tax_rate_pct / 100`

---

## Acceptance Criteria

### AC1: Tax Rate Input Field
- [ ] Input field for "Ставка налога" (Tax Rate)
- [ ] Numeric input with % suffix
- [ ] Range: 0-50%
- [ ] Default: 6%
- [ ] Step: 1% (allow decimals)
- [ ] Quick preset buttons for common rates (6%, 13%, 15%, 20%)

### AC2: Tax Type Selection
- [ ] Select/Radio for "Тип налога" (Tax Type)
- [ ] Options:
  - `income` - "Налог с выручки" (Tax on revenue)
  - `profit` - "Налог с прибыли" (Tax on profit)
- [ ] Default: `income` (most common for small sellers)
- [ ] Clear icons/indicators for each type

### AC3: Tax Regime Presets
- [ ] Collapsible section "Популярные налоговые режимы"
- [ ] Preset buttons:
  - УСН Доходы (6%, income)
  - УСН Доходы-Расходы (15%, profit)
  - Самозанятый (6%, income)
  - ИП на ОСН (13%, profit)
  - ООО на ОСН (20%, profit)
- [ ] Clicking preset fills both rate and type
- [ ] Visual indication of currently matching preset

### AC4: Tax Impact Preview
- [ ] Show tax impact on margin in real-time
- [ ] For income tax: "Налог с выручки: X ₽ (Y%)"
- [ ] For profit tax: "Налог с прибыли: X ₽ от маржи"
- [ ] Warning if tax rate > 20%: "Высокая ставка налога"

### AC5: Tooltip Explanations
- [ ] Tooltip for tax rate explaining range and impact
- [ ] Tooltip for tax type explaining the difference
- [ ] Link to tax regime guide (external, opens in new tab)

### AC6: Form State Integration
- [ ] Store `tax_rate_pct` in form state (number)
- [ ] Store `tax_type` in form state ('income' | 'profit')
- [ ] Include both in calculation request
- [ ] Reset to defaults on form reset

---

## Context & References

- **Requirements**: `PRICE-CALCULATOR-REQUIREMENTS.md` Section 2, Step 10
- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Story 44.2**: Input Form Component
- **Story 44.20**: Two-Level Pricing (uses tax in formulas)

---

## Implementation Notes

### File Structure

```
src/
└── components/
    └── custom/
        └── price-calculator/
            ├── PriceCalculatorForm.tsx           # UPDATE - Add tax section
            └── TaxConfigurationSection.tsx       # CREATE - Tax inputs
```

### Type Definitions

```typescript
// src/types/price-calculator.ts

export type TaxType = 'income' | 'profit'

export interface TaxConfiguration {
  tax_rate_pct: number
  tax_type: TaxType
}

export interface TaxPreset {
  id: string
  name: string
  rate: number
  type: TaxType
  description: string
}

export const TAX_PRESETS: TaxPreset[] = [
  { id: 'usn-income', name: 'УСН Доходы', rate: 6, type: 'income', description: 'Упрощённая система, налог с выручки' },
  { id: 'usn-profit', name: 'УСН Доходы-Расходы', rate: 15, type: 'profit', description: 'Упрощённая система, налог с прибыли' },
  { id: 'self-employed', name: 'Самозанятый', rate: 6, type: 'income', description: 'Налог на профессиональный доход' },
  { id: 'ip-osn', name: 'ИП на ОСН', rate: 13, type: 'profit', description: 'НДФЛ для индивидуальных предпринимателей' },
  { id: 'ooo-osn', name: 'ООО на ОСН', rate: 20, type: 'profit', description: 'Налог на прибыль для организаций' },
] as const
```

### Component Structure

```typescript
// src/components/custom/price-calculator/TaxConfigurationSection.tsx
'use client'

import { useState } from 'react'
import { UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Info, ChevronDown, ExternalLink, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaxType, TaxPreset, FormData } from '@/types/price-calculator'
import { TAX_PRESETS } from '@/types/price-calculator'

interface TaxConfigurationSectionProps {
  taxRate: number
  taxType: TaxType
  setValue: UseFormSetValue<FormData>
  disabled?: boolean
  calculatedTaxAmount?: number    // From calculation results
  recommendedPrice?: number       // For percentage display
}

export function TaxConfigurationSection({
  taxRate,
  taxType,
  setValue,
  disabled,
  calculatedTaxAmount,
  recommendedPrice,
}: TaxConfigurationSectionProps) {
  const [presetsOpen, setPresetsOpen] = useState(false)

  // Find matching preset (if any)
  const matchingPreset = TAX_PRESETS.find(
    p => p.rate === taxRate && p.type === taxType
  )

  // Calculate tax percentage of price
  const taxPctOfPrice = recommendedPrice && recommendedPrice > 0
    ? (calculatedTaxAmount ?? 0) / recommendedPrice * 100
    : 0

  const isHighTaxRate = taxRate > 20

  return (
    <div className="space-y-4">
      {/* Tax Rate Input */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Ставка налога
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Процент налога от выручки или прибыли в зависимости от вашего налогового режима.</p>
              <p className="mt-1 text-xs text-muted-foreground">Типичные значения: 6% (УСН), 13% (НДФЛ), 15-20% (прибыль).</p>
            </TooltipContent>
          </Tooltip>
        </Label>

        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={taxRate}
            onChange={(e) => setValue('tax_rate_pct', parseFloat(e.target.value) || 0)}
            min={0}
            max={50}
            step={1}
            disabled={disabled}
            className="w-24"
          />
          <span className="text-muted-foreground">%</span>

          {/* Quick rate buttons */}
          <div className="flex gap-1 ml-2">
            {[6, 13, 15, 20].map(rate => (
              <Button
                key={rate}
                type="button"
                variant={taxRate === rate ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setValue('tax_rate_pct', rate)}
                disabled={disabled}
                className="h-7 px-2"
              >
                {rate}%
              </Button>
            ))}
          </div>
        </div>

        {isHighTaxRate && (
          <div className="flex items-center gap-1 text-xs text-yellow-600">
            <AlertTriangle className="h-3 w-3" />
            Высокая ставка налога
          </div>
        )}
      </div>

      {/* Tax Type Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Тип налога
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p><strong>Налог с выручки</strong> — % от общей суммы продаж (УСН Доходы, Самозанятый).</p>
              <p className="mt-1"><strong>Налог с прибыли</strong> — % от прибыли после всех расходов (УСН Доходы-Расходы, ОСН).</p>
            </TooltipContent>
          </Tooltip>
        </Label>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={taxType === 'income' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setValue('tax_type', 'income')}
            disabled={disabled}
            className="flex-1"
          >
            <span className="font-medium">С выручки</span>
          </Button>
          <Button
            type="button"
            variant={taxType === 'profit' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setValue('tax_type', 'profit')}
            disabled={disabled}
            className="flex-1"
          >
            <span className="font-medium">С прибыли</span>
          </Button>
        </div>

        {matchingPreset && (
          <Badge variant="outline" className="text-xs">
            {matchingPreset.name}
          </Badge>
        )}
      </div>

      {/* Tax Impact Preview */}
      {calculatedTaxAmount !== undefined && calculatedTaxAmount > 0 && (
        <div className="p-3 bg-muted/50 rounded-md text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {taxType === 'income' ? 'Налог с выручки:' : 'Налог с прибыли:'}
            </span>
            <span className="font-medium">
              {calculatedTaxAmount.toLocaleString('ru-RU', {
                style: 'currency',
                currency: 'RUB',
                minimumFractionDigits: 2,
              })}
              {taxType === 'income' && taxPctOfPrice > 0 && (
                <span className="text-muted-foreground ml-1">
                  ({taxPctOfPrice.toFixed(1)}%)
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Tax Presets */}
      <Collapsible open={presetsOpen} onOpenChange={setPresetsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-between"
          >
            Популярные налоговые режимы
            <ChevronDown className={cn(
              'h-4 w-4 transition-transform',
              presetsOpen && 'rotate-180'
            )} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TAX_PRESETS.map(preset => {
              const isActive = preset.rate === taxRate && preset.type === taxType

              return (
                <Button
                  key={preset.id}
                  type="button"
                  variant={isActive ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setValue('tax_rate_pct', preset.rate)
                    setValue('tax_type', preset.type)
                  }}
                  disabled={disabled}
                  className="h-auto py-2 justify-start"
                >
                  <div className="text-left">
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {preset.rate}% {preset.type === 'income' ? 'с выручки' : 'с прибыли'}
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>

          <a
            href="https://www.nalog.gov.ru/rn77/taxation/taxes/usn/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 mt-3 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
            Подробнее о налоговых режимах
          </a>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
```

### Form Data Updates

```typescript
// Update FormData interface in PriceCalculatorForm.tsx
interface FormData {
  tax_rate_pct: number           // NEW - 0-50%
  tax_type: TaxType              // NEW - 'income' | 'profit'
  // ... existing fields ...
}

// Update defaultValues
const defaultValues: FormData = {
  tax_rate_pct: 6,               // Default: УСН Доходы
  tax_type: 'income',            // Default: tax on revenue
  // ... existing defaults ...
}
```

### Calculation Formula Impact

```typescript
// For income tax (included in percentage rate)
if (tax_type === 'income') {
  const total_pct_rate = commission_rate + acquiring_rate + drr_rate + tax_rate + margin_rate
  const recommended_price = fixed_costs / (1 - total_pct_rate)
}

// For profit tax (calculated separately)
if (tax_type === 'profit') {
  const total_pct_rate = commission_rate + acquiring_rate + drr_rate + margin_rate
  const recommended_price = fixed_costs / (1 - total_pct_rate)
  const profit_tax = (recommended_price * margin_rate) * (tax_rate_pct / 100)
  const net_margin_after_tax = gross_margin - profit_tax
}
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Налоги                                                      │
├─────────────────────────────────────────────────────────────┤
│ Ставка налога                                          [?]  │
│ [  6  ] %   [6%] [13%] [15%] [20%]                          │
│                                                             │
│ Тип налога                                             [?]  │
│ ┌──────────────────────┬──────────────────────┐             │
│ │    ███ С выручки ███ │      С прибыли       │             │
│ └──────────────────────┴──────────────────────┘             │
│ [УСН Доходы]                                                │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Налог с выручки: 243,47 ₽ (6,0%)                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Популярные налоговые режимы                           [▼]   │
│ ┌─────────────────────┬─────────────────────┐               │
│ │ ███ УСН Доходы ███  │ УСН Доходы-Расходы  │               │
│ │ 6% с выручки        │ 15% с прибыли       │               │
│ ├─────────────────────┼─────────────────────┤               │
│ │ Самозанятый         │ ИП на ОСН           │               │
│ │ 6% с выручки        │ 13% с прибыли       │               │
│ ├─────────────────────┼─────────────────────┤               │
│ │ ООО на ОСН          │                     │               │
│ │ 20% с прибыли       │                     │               │
│ └─────────────────────┴─────────────────────┘               │
│ 🔗 Подробнее о налоговых режимах                            │
└─────────────────────────────────────────────────────────────┘
```

### Invariants & Edge Cases

| Scenario | Handling |
|----------|----------|
| Tax rate = 0 | Valid - no tax applied |
| Tax rate > 50% | Validation error |
| Tax rate negative | Validation error |
| Preset clicked | Both rate and type update |
| Type changed | Recalculate with new type |
| Form reset | Reset to defaults (6%, income) |

---

## Observability

- **Analytics**: Track most used tax presets
- **Metrics**: Income vs profit tax selection ratio
- **Logs**: Log tax configuration for debugging

---

## Security

- **Input Validation**: Tax rate 0-50%, type enum validation
- **XSS Prevention**: No user-generated HTML
- **External Link**: Use `rel="noopener noreferrer"`

---

## Accessibility (WCAG 2.1 AA)

- [ ] All inputs have associated labels
- [ ] Tax type buttons have proper ARIA attributes
- [ ] Tooltips accessible via keyboard
- [ ] Color contrast ≥4.5:1
- [ ] Touch targets ≥44×44px
- [ ] Screen reader announces preset selection
- [ ] Warning icon has accessible text

---

## Testing Requirements

### Unit Tests
- [ ] TaxConfigurationSection renders with defaults
- [ ] Tax rate input accepts valid values
- [ ] Tax type selection toggles correctly
- [ ] Preset buttons set both rate and type
- [ ] High tax rate warning displays

### Integration Tests
- [ ] Tax configuration affects calculation
- [ ] Form reset clears to defaults
- [ ] Income vs profit calculation differs

### E2E Tests
- [ ] User can enter custom tax rate
- [ ] User can select tax type
- [ ] User can use preset buttons
- [ ] Tax impact preview updates

---

## Dev Agent Record

### File List
| File | Change Type | Lines (Est.) | Description |
|------|-------------|--------------|-------------|
| `src/components/custom/price-calculator/TaxConfigurationSection.tsx` | CREATE | ~180 | Tax configuration component |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | UPDATE | +20 | Add tax section |
| `src/types/price-calculator.ts` | UPDATE | +25 | Add tax types and presets |

### Change Log
_(To be filled by Dev Agent during implementation)_

### Implementation Notes
_(To be filled by Dev Agent during implementation)_

### Review Follow-ups
_(To be filled by AI Code Review)_

---

## QA Results

_(To be filled after implementation)_

**Reviewer**:
**Date**:
**Gate Decision**:

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Tax Rate Input | ⏳ | |
| AC2 | Tax Type Selection | ⏳ | |
| AC3 | Tax Regime Presets | ⏳ | |
| AC4 | Tax Impact Preview | ⏳ | |
| AC5 | Tooltip Explanations | ⏳ | |
| AC6 | Form State Integration | ⏳ | |

---

## Definition of Done

- [ ] All Acceptance Criteria verified (AC1-AC6)
- [ ] Component created with proper TypeScript types
- [ ] Unit tests written and passing
- [ ] Integration tests with form flow
- [ ] No ESLint errors
- [ ] Accessibility audit passed
- [ ] Code review completed
- [ ] Documentation updated
- [ ] QA Gate passed

---

**Created**: 2026-01-20
**Last Updated**: 2026-01-20

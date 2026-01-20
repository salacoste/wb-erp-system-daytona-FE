# Story 44.20: Two-Level Pricing Display

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 📋 Ready for Dev
**Priority**: P0 - CRITICAL
**Effort**: 3 SP
**Depends On**: Story 44.3 (Results Display), Story 44.15-44.19 (new inputs)
**Requirements Ref**: PRICE-CALCULATOR-REQUIREMENTS.md Section 5, Section 8

---

## User Story

**As a** Seller,
**I want** to see both minimum and recommended prices with complete cost breakdowns,
**So that** I understand the price floor and can make informed pricing decisions.

**Non-goals**:
- Price history tracking
- Competitor price comparison
- Dynamic price recommendations
- Export pricing scenarios

---

## Background: Two-Level Pricing Concept

### Pricing Levels

**Level 1: Minimum Price (Минимальная цена)** - "Price Floor"
- Covers ONLY fixed costs (COGS, logistics, storage, acceptance)
- NO margin, NO DRR (advertising)
- **Formula**: `minimum_price = fixed_costs / (1 - commission_rate - acquiring_rate - tax_rate)`
- **Purpose**: Below this price, seller loses money

**Level 2: Recommended Price (Рекомендуемая цена)** - "Target Price"
- Includes fixed costs + DRR + target margin
- **Formula**: `recommended_price = fixed_costs / (1 - total_pct_rate)`
- **Purpose**: Achieves seller's target profit margin

### Cost Categories

**Fixed Costs (Фиксированные расходы):**
- Себестоимость (COGS)
- Логистика прямая
- Логистика возвратная (эффективная)
- Хранение (FBO only)
- Приёмка (FBO only)

**Percentage Costs (Процентные расходы):**
- Комиссия WB
- Эквайринг
- Налог с выручки (if income tax)
- DRR (реклама) - NOT in minimum price
- Маржа - NOT in minimum price

---

## Acceptance Criteria

### AC1: Two-Level Price Display Header
- [ ] Show minimum price prominently: "МИНИМАЛЬНАЯ ЦЕНА: X ₽"
- [ ] Label: "покрывает фиксированные расходы"
- [ ] Show recommended price: "РЕКОМЕНДУЕМАЯ ЦЕНА: Y ₽"
- [ ] Label: "с учётом маржи и рекламы"
- [ ] Show customer price if SPP > 0: "Цена для покупателя: Z ₽"
- [ ] Visual hierarchy: recommended > minimum > customer

### AC2: Price Comparison Visual
- [ ] Show price gap between minimum and recommended
- [ ] Format: "Запас прибыльности: X ₽ (+Y%)"
- [ ] Color-coded indicator:
  - Green: gap > 20%
  - Yellow: gap 10-20%
  - Red: gap < 10%
- [ ] Warning if recommended ≈ minimum (tight margin)

### AC3: Fixed Costs Breakdown Section
- [ ] Section header: "ФИКСИРОВАННЫЕ ЗАТРАТЫ: X ₽"
- [ ] Line items:
  - Себестоимость (COGS): X ₽
  - Логистика (прямая): X ₽
  - Логистика (возвратная эфф.): X ₽
  - Хранение: X ₽ (FBO only)
  - Приёмка: X ₽ (FBO only)
- [ ] Total fixed costs subtotal

### AC4: Percentage Costs Breakdown Section
- [ ] Section header: "ПРОЦЕНТНЫЕ ЗАТРАТЫ: X ₽"
- [ ] Line items (each with % and ₽):
  - Комиссия WB (X%): Y ₽
  - Эквайринг (X%): Y ₽
  - Налог с выручки (X%): Y ₽ (if income tax)
- [ ] Subtotal of percentage costs

### AC5: Variable Costs Breakdown (DRR)
- [ ] Section header: "ПЕРЕМЕННЫЕ ЗАТРАТЫ: X ₽"
- [ ] Line item: DRR Реклама (X%): Y ₽
- [ ] Note: "Не включено в минимальную цену"

### AC6: Margin Section
- [ ] Section header: "МАРЖА (X%): Y ₽"
- [ ] For profit tax: show "Чистая прибыль после налога: Z ₽"
- [ ] Visual margin indicator (progress bar or gauge)

### AC7: Summary Footer
- [ ] Three-line summary:
  ```
  МИНИМАЛЬНАЯ ЦЕНА (пол)          X ₽
  РЕКОМЕНДУЕМАЯ ЦЕНА              Y ₽
  ЦЕНА ДЛЯ ПОКУПАТЕЛЯ (СПП X%)   Z ₽
  ```
- [ ] Copy buttons for each price

### AC8: Responsive Layout
- [ ] Desktop: side-by-side minimum/recommended
- [ ] Mobile: stacked vertical layout
- [ ] Collapsible breakdown sections on mobile

---

## Context & References

- **Requirements**: `PRICE-CALCULATOR-REQUIREMENTS.md` Section 5, Section 8
- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Story 44.3**: Results Display (existing component to update)
- **Story 44.19**: SPP Display (customer price)

---

## Implementation Notes

### File Structure

```
src/
└── components/
    └── custom/
        └── price-calculator/
            ├── PriceCalculatorResults.tsx        # UPDATE - Major refactor
            ├── TwoLevelPriceHeader.tsx           # CREATE - Price header
            ├── CostBreakdownSection.tsx          # UPDATE - New structure
            ├── FixedCostsBreakdown.tsx           # CREATE - Fixed costs
            ├── PercentageCostsBreakdown.tsx      # CREATE - % costs
            ├── VariableCostsBreakdown.tsx        # CREATE - DRR
            ├── MarginSection.tsx                 # CREATE - Margin display
            └── PriceSummaryFooter.tsx            # CREATE - Summary
```

### Type Definitions

```typescript
// src/types/price-calculator.ts

export interface TwoLevelPricingResult {
  minimumPrice: number
  recommendedPrice: number
  customerPrice: number
  priceGap: {
    rub: number
    pct: number
  }

  fixedCosts: {
    cogs: number
    logisticsForward: number
    logisticsReverseEffective: number
    storage: number        // FBO only
    acceptance: number     // FBO only
    total: number
  }

  percentageCosts: {
    commissionWb: { pct: number; rub: number }
    acquiring: { pct: number; rub: number }
    taxIncome: { pct: number; rub: number } | null  // Only for income tax
    total: { pct: number; rub: number }
  }

  variableCosts: {
    drr: { pct: number; rub: number }
    total: { pct: number; rub: number }
  }

  margin: {
    pct: number
    rub: number
    afterTax: number | null  // Only for profit tax
  }
}
```

### Main Component Structure

```typescript
// src/components/custom/price-calculator/TwoLevelPriceHeader.tsx
'use client'

import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TwoLevelPriceHeaderProps {
  minimumPrice: number
  recommendedPrice: number
  customerPrice?: number
  sppPct?: number
  priceGap: { rub: number; pct: number }
}

export function TwoLevelPriceHeader({
  minimumPrice,
  recommendedPrice,
  customerPrice,
  sppPct,
  priceGap,
}: TwoLevelPriceHeaderProps) {
  // Price gap indicator color
  const gapColor = priceGap.pct > 20 ? 'text-green-600'
    : priceGap.pct > 10 ? 'text-yellow-600'
    : 'text-red-600'

  const isTightMargin = priceGap.pct < 10

  return (
    <div className="space-y-4">
      {/* Minimum Price */}
      <div className="p-4 border rounded-lg bg-muted/30">
        <div className="text-sm text-muted-foreground uppercase tracking-wide">
          Минимальная цена
        </div>
        <div className="text-2xl font-bold">
          {formatCurrency(minimumPrice)}
        </div>
        <div className="text-xs text-muted-foreground">
          покрывает фиксированные расходы (пол цены)
        </div>
      </div>

      {/* Recommended Price */}
      <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
        <div className="text-sm text-muted-foreground uppercase tracking-wide">
          Рекомендуемая цена
        </div>
        <div className="text-3xl font-bold text-primary">
          {formatCurrency(recommendedPrice)}
        </div>
        <div className="text-xs text-muted-foreground">
          с учётом маржи и рекламы
        </div>
      </div>

      {/* Customer Price (if SPP > 0) */}
      {customerPrice && sppPct && sppPct > 0 && (
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground uppercase tracking-wide">
            Цена для покупателя
          </div>
          <div className="text-xl font-bold">
            {formatCurrency(customerPrice)}
            <Badge variant="secondary" className="ml-2 text-xs">
              СПП -{sppPct}%
            </Badge>
          </div>
        </div>
      )}

      {/* Price Gap Indicator */}
      <div className={cn('p-3 rounded-lg bg-muted/50 text-sm', gapColor)}>
        <div className="flex justify-between items-center">
          <span>Запас прибыльности:</span>
          <span className="font-medium">
            +{formatCurrency(priceGap.rub)} (+{priceGap.pct.toFixed(1)}%)
          </span>
        </div>
        {isTightMargin && (
          <div className="mt-1 text-xs text-red-600">
            ⚠️ Низкий запас прибыльности — есть риск убытков
          </div>
        )}
      </div>
    </div>
  )
}
```

### Cost Breakdown Components

```typescript
// src/components/custom/price-calculator/FixedCostsBreakdown.tsx
'use client'

import { formatCurrency } from '@/lib/utils'
import type { TwoLevelPricingResult } from '@/types/price-calculator'

interface FixedCostsBreakdownProps {
  costs: TwoLevelPricingResult['fixedCosts']
  fulfillmentType: 'FBO' | 'FBS'
}

export function FixedCostsBreakdown({
  costs,
  fulfillmentType,
}: FixedCostsBreakdownProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between font-medium text-sm">
        <span>ФИКСИРОВАННЫЕ ЗАТРАТЫ</span>
        <span>{formatCurrency(costs.total)}</span>
      </div>

      <div className="space-y-1 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>├─ Себестоимость (COGS)</span>
          <span>{formatCurrency(costs.cogs)}</span>
        </div>
        <div className="flex justify-between">
          <span>├─ Логистика (прямая)</span>
          <span>{formatCurrency(costs.logisticsForward)}</span>
        </div>
        <div className="flex justify-between">
          <span>├─ Логистика (возвратная эфф.)</span>
          <span>{formatCurrency(costs.logisticsReverseEffective)}</span>
        </div>

        {fulfillmentType === 'FBO' && (
          <>
            <div className="flex justify-between">
              <span>├─ Хранение</span>
              <span>{formatCurrency(costs.storage)}</span>
            </div>
            <div className="flex justify-between">
              <span>└─ Приёмка</span>
              <span>{formatCurrency(costs.acceptance)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

```typescript
// src/components/custom/price-calculator/PercentageCostsBreakdown.tsx
'use client'

import { formatCurrency } from '@/lib/utils'
import type { TwoLevelPricingResult } from '@/types/price-calculator'

interface PercentageCostsBreakdownProps {
  costs: TwoLevelPricingResult['percentageCosts']
}

export function PercentageCostsBreakdown({
  costs,
}: PercentageCostsBreakdownProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between font-medium text-sm">
        <span>ПРОЦЕНТНЫЕ ЗАТРАТЫ</span>
        <span>{formatCurrency(costs.total.rub)}</span>
      </div>

      <div className="space-y-1 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>├─ Комиссия WB ({costs.commissionWb.pct}%)</span>
          <span>{formatCurrency(costs.commissionWb.rub)}</span>
        </div>
        <div className="flex justify-between">
          <span>├─ Эквайринг ({costs.acquiring.pct}%)</span>
          <span>{formatCurrency(costs.acquiring.rub)}</span>
        </div>
        {costs.taxIncome && (
          <div className="flex justify-between">
            <span>└─ Налог с выручки ({costs.taxIncome.pct}%)</span>
            <span>{formatCurrency(costs.taxIncome.rub)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
```

```typescript
// src/components/custom/price-calculator/VariableCostsBreakdown.tsx
'use client'

import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { TwoLevelPricingResult } from '@/types/price-calculator'

interface VariableCostsBreakdownProps {
  costs: TwoLevelPricingResult['variableCosts']
}

export function VariableCostsBreakdown({
  costs,
}: VariableCostsBreakdownProps) {
  if (costs.drr.pct === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex justify-between font-medium text-sm">
        <span>ПЕРЕМЕННЫЕ ЗАТРАТЫ</span>
        <span>{formatCurrency(costs.total.rub)}</span>
      </div>

      <div className="space-y-1 text-sm text-muted-foreground">
        <div className="flex justify-between items-center">
          <span>└─ DRR Реклама ({costs.drr.pct}%)</span>
          <span>{formatCurrency(costs.drr.rub)}</span>
        </div>
      </div>

      <Badge variant="outline" className="text-xs">
        Не включено в минимальную цену
      </Badge>
    </div>
  )
}
```

### Calculation Helper

```typescript
// src/lib/two-level-pricing.ts

import type { PriceCalculatorFormData, TwoLevelPricingResult } from '@/types/price-calculator'

/**
 * Calculate two-level pricing from form data
 */
export function calculateTwoLevelPricing(
  formData: PriceCalculatorFormData,
  commissionPct: number
): TwoLevelPricingResult {
  // Fixed costs
  const fixedCosts = {
    cogs: formData.cogs_rub,
    logisticsForward: formData.logistics_forward_rub,
    logisticsReverseEffective: formData.logistics_reverse_rub * (1 - formData.buyback_pct / 100),
    storage: formData.fulfillment_type === 'FBO' ? formData.storage_rub : 0,
    acceptance: formData.fulfillment_type === 'FBO' ? formData.acceptance_cost : 0,
    total: 0,
  }
  fixedCosts.total = Object.values(fixedCosts).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0) - fixedCosts.total

  // Percentage rates
  const commissionRate = commissionPct / 100
  const acquiringRate = formData.acquiring_pct / 100
  const drrRate = formData.drr_pct / 100
  const marginRate = formData.target_margin_pct / 100

  // Tax handling
  const taxRate = formData.tax_type === 'income' ? formData.tax_rate_pct / 100 : 0

  // LEVEL 1: Minimum price (no margin, no DRR)
  const minPctRate = commissionRate + acquiringRate + taxRate
  const minimumPrice = fixedCosts.total / (1 - minPctRate)

  // LEVEL 2: Recommended price (with margin and DRR)
  const totalPctRate = minPctRate + drrRate + marginRate
  const recommendedPrice = fixedCosts.total / (1 - totalPctRate)

  // Customer price (after SPP)
  const customerPrice = recommendedPrice * (1 - formData.spp_pct / 100)

  // Price gap
  const priceGap = {
    rub: recommendedPrice - minimumPrice,
    pct: ((recommendedPrice - minimumPrice) / minimumPrice) * 100,
  }

  // Percentage costs (based on recommended price)
  const percentageCosts = {
    commissionWb: { pct: commissionPct, rub: recommendedPrice * commissionRate },
    acquiring: { pct: formData.acquiring_pct, rub: recommendedPrice * acquiringRate },
    taxIncome: taxRate > 0
      ? { pct: formData.tax_rate_pct, rub: recommendedPrice * taxRate }
      : null,
    total: {
      pct: minPctRate * 100,
      rub: recommendedPrice * minPctRate,
    },
  }

  // Variable costs
  const variableCosts = {
    drr: { pct: formData.drr_pct, rub: recommendedPrice * drrRate },
    total: { pct: formData.drr_pct, rub: recommendedPrice * drrRate },
  }

  // Margin
  const grossMargin = recommendedPrice * marginRate
  const margin = {
    pct: formData.target_margin_pct,
    rub: grossMargin,
    afterTax: formData.tax_type === 'profit'
      ? grossMargin * (1 - formData.tax_rate_pct / 100)
      : null,
  }

  return {
    minimumPrice,
    recommendedPrice,
    customerPrice,
    priceGap,
    fixedCosts,
    percentageCosts,
    variableCosts,
    margin,
  }
}
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐    │
│  │  МИНИМАЛЬНАЯ ЦЕНА:           3 214,00 ₽             │    │
│  │  (покрывает фиксированные расходы)                   │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ██ РЕКОМЕНДУЕМАЯ ЦЕНА:      4 057,87 ₽ ██          │    │
│  │  (с учётом маржи и рекламы)                          │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Цена для покупателя:        3 652,08 ₽  [-10%]     │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Запас прибыльности: +843,87 ₽ (+26,3%)  ✅         │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  ФИКСИРОВАННЫЕ ЗАТРАТЫ              1 753,00 ₽              │
│  ├─ Себестоимость (COGS)            1 500,00 ₽              │
│  ├─ Логистика (прямая)                 74,00 ₽              │
│  ├─ Логистика (возвратная эфф.)        53,00 ₽              │
│  ├─ Хранение                           50,00 ₽              │
│  └─ Приёмка                            76,00 ₽              │
├─────────────────────────────────────────────────────────────┤
│  ПРОЦЕНТНЫЕ ЗАТРАТЫ                 1 493,30 ₽              │
│  ├─ Комиссия WB (25%)                 405,79 ₽              │
│  ├─ Эквайринг (2%)                     81,16 ₽              │
│  └─ Налог с выручки (6%)              243,47 ₽              │
├─────────────────────────────────────────────────────────────┤
│  ПЕРЕМЕННЫЕ ЗАТРАТЫ                   202,89 ₽              │
│  └─ DRR Реклама (5%)                  202,89 ₽              │
│  [Не включено в минимальную цену]                           │
├─────────────────────────────────────────────────────────────┤
│  МАРЖА (20%)                          811,57 ₽              │
│  └─ Чистая прибыль                    811,57 ₽              │
├─────────────────────────────────────────────────────────────┤
│  ═══════════════════════════════════════════════            │
│  МИНИМАЛЬНАЯ ЦЕНА (пол)             3 214,00 ₽   [📋]       │
│  РЕКОМЕНДУЕМАЯ ЦЕНА                 4 057,87 ₽   [📋]       │
│  ЦЕНА ДЛЯ ПОКУПАТЕЛЯ (СПП 10%)      3 652,08 ₽   [📋]       │
│  ═══════════════════════════════════════════════            │
└─────────────────────────────────────────────────────────────┘
```

### Invariants & Edge Cases

| Scenario | Handling |
|----------|----------|
| Minimum ≈ Recommended | Show tight margin warning |
| Minimum > Recommended | Invalid state (show error) |
| SPP = 0 | Don't show customer price |
| DRR = 0 | Don't show variable costs section |
| FBS mode | Don't show storage/acceptance lines |
| Profit tax | Show after-tax margin |
| All zero inputs | Show placeholder state |

---

## Observability

- **Analytics**: Track two-level pricing understanding (scroll depth, time on section)
- **Metrics**: Average price gap %, tight margin warnings frequency
- **Logs**: Log pricing calculations for debugging

---

## Security

- **Input Validation**: All calculations use validated form data
- **XSS Prevention**: No user-generated HTML
- **State Isolation**: Pricing calculated client-side only

---

## Accessibility (WCAG 2.1 AA)

- [ ] Price sections have proper headings (h2/h3)
- [ ] Color coding has text alternatives
- [ ] Copy buttons have accessible labels
- [ ] Collapsible sections keyboard accessible
- [ ] Color contrast ≥4.5:1
- [ ] Screen reader announces price levels

---

## Testing Requirements

### Unit Tests
- [ ] TwoLevelPriceHeader renders both prices
- [ ] FixedCostsBreakdown shows FBO-only items
- [ ] PercentageCostsBreakdown handles income/profit tax
- [ ] VariableCostsBreakdown hides when DRR=0
- [ ] Price gap calculated correctly
- [ ] calculateTwoLevelPricing formulas correct

### Integration Tests
- [ ] Full breakdown updates on form change
- [ ] FBO/FBS switch updates breakdown
- [ ] Tax type change updates breakdown
- [ ] Copy buttons work for all prices

### E2E Tests
- [ ] User sees minimum and recommended prices
- [ ] User can copy each price
- [ ] Breakdown sections collapsible on mobile
- [ ] Warning shows for tight margin

---

## Dev Agent Record

### File List
| File | Change Type | Lines (Est.) | Description |
|------|-------------|--------------|-------------|
| `src/components/custom/price-calculator/TwoLevelPriceHeader.tsx` | CREATE | ~100 | Price header with gap |
| `src/components/custom/price-calculator/FixedCostsBreakdown.tsx` | CREATE | ~50 | Fixed costs section |
| `src/components/custom/price-calculator/PercentageCostsBreakdown.tsx` | CREATE | ~50 | % costs section |
| `src/components/custom/price-calculator/VariableCostsBreakdown.tsx` | CREATE | ~40 | DRR section |
| `src/components/custom/price-calculator/MarginSection.tsx` | CREATE | ~40 | Margin display |
| `src/components/custom/price-calculator/PriceSummaryFooter.tsx` | CREATE | ~60 | Summary with copy |
| `src/components/custom/price-calculator/PriceCalculatorResults.tsx` | UPDATE | +50 | Integrate new components |
| `src/lib/two-level-pricing.ts` | CREATE | ~100 | Calculation helpers |
| `src/types/price-calculator.ts` | UPDATE | +30 | Add TwoLevelPricingResult |

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
| AC1 | Two-Level Price Display Header | ⏳ | |
| AC2 | Price Comparison Visual | ⏳ | |
| AC3 | Fixed Costs Breakdown | ⏳ | |
| AC4 | Percentage Costs Breakdown | ⏳ | |
| AC5 | Variable Costs (DRR) | ⏳ | |
| AC6 | Margin Section | ⏳ | |
| AC7 | Summary Footer | ⏳ | |
| AC8 | Responsive Layout | ⏳ | |

---

## Definition of Done

- [ ] All Acceptance Criteria verified (AC1-AC8)
- [ ] Components created with proper TypeScript types
- [ ] Unit tests written and passing
- [ ] Integration tests with form flow
- [ ] Responsive layout verified (mobile/tablet/desktop)
- [ ] No ESLint errors
- [ ] Accessibility audit passed
- [ ] Code review completed
- [ ] QA Gate passed

---

**Created**: 2026-01-20
**Last Updated**: 2026-01-20

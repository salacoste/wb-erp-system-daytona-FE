# Story 44.20: Two-Level Pricing Display

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: ✅ Complete
**Priority**: P0 - CRITICAL
**Effort**: 3 SP
**Completed**: 2026-01-23
**Depends On**: Story 44.3 (Results Display), Story 44.15-44.19 (all V2 inputs)
**Requirements Ref**: PRICE-CALCULATOR-REQUIREMENTS.md Section 5, Section 8
**Backend API**: `POST /v1/products/price-calculator` (returns full breakdown)

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

- [x] Show minimum price prominently: "МИНИМАЛЬНАЯ ЦЕНА: X ₽"
- [x] Label: "покрывает фиксированные расходы"
- [x] Show recommended price: "РЕКОМЕНДУЕМАЯ ЦЕНА: Y ₽"
- [x] Label: "с учётом маржи и рекламы"
- [x] Show customer price if SPP > 0: "Цена для покупателя: Z ₽"
- [x] Visual hierarchy: recommended > minimum > customer

### AC2: Price Comparison Visual

- [x] Show price gap between minimum and recommended
- [x] Format: "Запас прибыльности: X ₽ (+Y%)"
- [x] Color-coded indicator:
  - Green: gap > 20%
  - Yellow: gap 10-20%
  - Red: gap < 10%
- [x] Warning if recommended ≈ minimum (tight margin)

### AC3: Fixed Costs Breakdown Section

- [x] Section header: "ФИКСИРОВАННЫЕ ЗАТРАТЫ: X ₽"
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
- **Story 44.15**: Fulfillment Type (FBO/FBS affects costs)
- **Story 44.16**: Category Selection (commission rate)
- **Story 44.17**: Tax Configuration (tax in breakdown)
- **Story 44.18**: DRR Input (variable costs)
- **Story 44.19**: SPP Display (customer price)

---

## API Contract

### Backend Response Structure

**POST /v1/products/price-calculator Response:**

```json
{
  "result": {
    "recommended_price": 4057.87,
    "target_margin_pct": 20.0,
    "actual_margin_rub": 811.57,
    "actual_margin_pct": 20.0
  },

  "fixed_costs": {
    "cogs": { "rub": 1500.00 },
    "logistics_to_customer": { "rub": 74.00 },
    "logistics_return_effective": { "rub": 53.00 },
    "storage": { "rub": 50.00 },                    // FBO only
    "acceptance": { "rub": 76.00 },                 // FBO only
    "total": { "rub": 1753.00 }
  },

  "percentage_breakdown": {
    "commission_wb": { "pct": 25.0, "rub": 1014.47 },
    "acquiring": { "pct": 2.0, "rub": 81.16 },
    "advertising": { "pct": 5.0, "rub": 202.89 },
    "vat": { "pct": 6.0, "rub": 243.47 },
    "margin": { "pct": 20.0, "rub": 811.57 }
  },

  "summary": {
    "fixed_costs_total": 1753.00,
    "percentage_costs_total": 2353.56,
    "total_costs": 4106.56,
    "profit_before_tax": 811.57
  }
}
```

### Frontend Calculation: Minimum Price

**Backend returns `recommended_price`** (with margin + DRR). Frontend calculates **minimum_price** (without margin, without DRR):

```typescript
// Minimum price formula (frontend-only calculation)
const minPctRate = commission_pct/100 + acquiring_pct/100 + tax_income_pct/100
const minimumPrice = fixedCostsTotal / (1 - minPctRate)

// Example:
// fixedCostsTotal = 1753 ₽
// minPctRate = 0.25 + 0.02 + 0.06 = 0.33
// minimumPrice = 1753 / (1 - 0.33) = 1753 / 0.67 = 2616.42 ₽
```

### Customer Price (with SPP)

```typescript
// Frontend-only (SPP not sent to backend)
const customerPrice = recommendedPrice * (1 - sppPct / 100)
// 4057.87 × 0.90 = 3652.08 ₽
```

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

/**
 * Two-Level Pricing Result
 * Combined from API response + frontend calculations
 */
export interface TwoLevelPricingResult {
  // Price levels
  minimumPrice: number        // Frontend-calculated (no margin, no DRR)
  recommendedPrice: number    // From API (with margin + DRR)
  customerPrice: number       // Frontend-calculated (with SPP discount)

  // Price gap analysis
  priceGap: {
    rub: number               // Absolute difference
    pct: number               // Percentage difference
  }

  // Fixed costs (from API)
  fixedCosts: {
    cogs: number
    logisticsForward: number
    logisticsReverseEffective: number
    storage: number           // FBO only (0 for FBS)
    acceptance: number        // FBO only (0 for FBS)
    total: number
  }

  // Percentage costs (from API + calculated)
  percentageCosts: {
    commissionWb: { pct: number; rub: number }
    acquiring: { pct: number; rub: number }
    taxIncome: { pct: number; rub: number } | null  // Only for income tax type
    total: { pct: number; rub: number }
  }

  // Variable costs (DRR/advertising)
  variableCosts: {
    drr: { pct: number; rub: number }
    total: { pct: number; rub: number }
  }

  // Margin breakdown
  margin: {
    pct: number               // Target margin percentage
    rub: number               // Gross margin in rubles
    afterTax: number | null   // Net margin after profit tax (only for profit tax type)
  }
}

/**
 * Price gap status for UI display
 */
export type PriceGapStatus = 'excellent' | 'good' | 'normal' | 'low' | 'critical'

export interface PriceGapStatusConfig {
  status: PriceGapStatus
  color: string
  bgColor: string
  message: string
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

import type {
  PriceCalculatorFormData,
  PriceCalculatorResponse,
  TwoLevelPricingResult
} from '@/types/price-calculator'

/**
 * Calculate two-level pricing from API response + form data
 *
 * Backend provides: recommended_price, cost breakdowns
 * Frontend calculates: minimum_price, customer_price, price_gap
 */
export function calculateTwoLevelPricing(
  apiResponse: PriceCalculatorResponse,
  formData: PriceCalculatorFormData,
  commissionPct: number
): TwoLevelPricingResult {
  // Use backend values for fixed costs
  const fixedCosts = {
    cogs: apiResponse.fixed_costs.cogs.rub,
    logisticsForward: apiResponse.fixed_costs.logistics_to_customer.rub,
    logisticsReverseEffective: apiResponse.fixed_costs.logistics_return_effective.rub,
    storage: apiResponse.fixed_costs.storage?.rub ?? 0,       // FBO only
    acceptance: apiResponse.fixed_costs.acceptance?.rub ?? 0, // FBO only
    total: apiResponse.fixed_costs.total.rub,
  }

  // Percentage rates from form/API
  const commissionRate = commissionPct / 100
  const acquiringRate = formData.acquiring_pct / 100
  const taxRate = formData.tax_type === 'income' ? formData.tax_rate_pct / 100 : 0
  const drrRate = formData.advertising_pct / 100  // Note: advertising_pct = DRR
  const marginRate = formData.target_margin_pct / 100

  // LEVEL 1: Minimum price (frontend calculation)
  // Excludes: margin, DRR (variable costs)
  // Includes: commission, acquiring, income tax
  const minPctRate = commissionRate + acquiringRate + taxRate
  const minimumPrice = fixedCosts.total / (1 - minPctRate)

  // LEVEL 2: Recommended price (from API)
  const recommendedPrice = apiResponse.result.recommended_price

  // LEVEL 3: Customer price (frontend calculation with SPP)
  const customerPrice = recommendedPrice * (1 - formData.spp_pct / 100)

  // Price gap (recommended vs minimum)
  const priceGap = {
    rub: recommendedPrice - minimumPrice,
    pct: minimumPrice > 0 ? ((recommendedPrice - minimumPrice) / minimumPrice) * 100 : 0,
  }

  // Percentage costs (from API breakdown)
  const percentageCosts = {
    commissionWb: {
      pct: apiResponse.percentage_breakdown.commission_wb.pct,
      rub: apiResponse.percentage_breakdown.commission_wb.rub,
    },
    acquiring: {
      pct: apiResponse.percentage_breakdown.acquiring.pct,
      rub: apiResponse.percentage_breakdown.acquiring.rub,
    },
    taxIncome: taxRate > 0 ? {
      pct: apiResponse.percentage_breakdown.vat.pct,
      rub: apiResponse.percentage_breakdown.vat.rub,
    } : null,
    total: {
      pct: minPctRate * 100,
      rub: recommendedPrice * minPctRate,
    },
  }

  // Variable costs (DRR from API)
  const variableCosts = {
    drr: {
      pct: apiResponse.percentage_breakdown.advertising.pct,
      rub: apiResponse.percentage_breakdown.advertising.rub,
    },
    total: {
      pct: apiResponse.percentage_breakdown.advertising.pct,
      rub: apiResponse.percentage_breakdown.advertising.rub,
    },
  }

  // Margin (from API + profit tax calculation)
  const grossMargin = apiResponse.result.actual_margin_rub
  const margin = {
    pct: apiResponse.result.actual_margin_pct,
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

/**
 * Get price gap status for UI display
 */
export function getPriceGapStatus(gapPct: number): {
  status: 'excellent' | 'good' | 'normal' | 'low' | 'critical'
  color: string
  bgColor: string
  message: string
} {
  if (gapPct > 30) return {
    status: 'excellent',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    message: 'Высокий запас прибыльности'
  }
  if (gapPct > 20) return {
    status: 'good',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    message: 'Хороший запас прибыльности'
  }
  if (gapPct > 10) return {
    status: 'normal',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    message: 'Умеренный запас прибыльности'
  }
  if (gapPct > 5) return {
    status: 'low',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    message: 'Низкий запас прибыльности'
  }
  return {
    status: 'critical',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    message: '⚠️ Критически низкий запас — риск убытков'
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

| Scenario                         | Handling                                                        |
| -------------------------------- | --------------------------------------------------------------- |
| Minimum ≈ Recommended (gap < 5%) | Show tight margin warning (red)                                 |
| Minimum > Recommended            | Invalid state: Show error "Ошибка расчёта: маржа отрицательная" |
| SPP = 0%                         | Don't show customer price row (hide section)                    |
| DRR = 0%                         | Don't show variable costs section (all zeros)                   |
| FBS mode                         | Don't show storage/acceptance lines (0 values)                  |
| Profit tax                       | Show "Чистая прибыль после налога" with calculated value        |
| Income tax                       | Include tax in percentage costs breakdown                       |
| All zero inputs                  | Show placeholder: "Заполните данные для расчёта"                |
| API error                        | Show error state with retry button                              |
| Very high margin (>50%)          | Show info message about competitiveness                         |
| Negative actual margin           | Show error highlighting, prevent copy                           |
| Mobile viewport (<640px)         | Vertical stack, collapsible sections                            |

### Price Gap Classification

| Gap %  | Status      | Color  | Message                                     |
| ------ | ----------- | ------ | ------------------------------------------- |
| > 30%  | Отлично     | Green  | "Высокий запас прибыльности"                |
| 20-30% | Хорошо      | Green  | "Хороший запас прибыльности"                |
| 10-20% | Норма       | Yellow | "Умеренный запас прибыльности"              |
| 5-10%  | Низкий      | Orange | "Низкий запас прибыльности"                 |
| < 5%   | Критический | Red    | "⚠️ Критически низкий запас — риск убытков" |

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

| File                                                                | Change Type | Lines (Est.) | Description                                      |
| ------------------------------------------------------------------- | ----------- | ------------ | ------------------------------------------------ |
| `src/components/custom/price-calculator/TwoLevelPriceHeader.tsx`    | CREATE      | ~100         | Price header with min/rec/customer prices        |
| `src/components/custom/price-calculator/TwoLevelPricingDisplay.tsx` | CREATE      | ~80          | Main container for two-level display             |
| `src/components/custom/price-calculator/FixedCostsSection.tsx`      | CREATE      | ~60          | Fixed costs breakdown (COGS, logistics, storage) |
| `src/components/custom/price-calculator/PercentageCostsSection.tsx` | CREATE      | ~60          | Percentage costs (commission, acquiring, tax)    |
| `src/components/custom/price-calculator/VariableCostsSection.tsx`   | CREATE      | ~40          | Variable costs (DRR)                             |
| `src/components/custom/price-calculator/MarginSection.tsx`          | CREATE      | ~50          | Margin display with profit tax                   |
| `src/components/custom/price-calculator/PriceSummaryFooter.tsx`     | CREATE      | ~70          | Summary footer with copy buttons                 |
| `src/components/custom/price-calculator/PriceGapIndicator.tsx`      | CREATE      | ~40          | Price gap status indicator                       |
| `src/components/custom/price-calculator/PriceCalculatorResults.tsx` | UPDATE      | +30          | Integrate TwoLevelPricingDisplay                 |
| `src/lib/two-level-pricing.ts`                                      | CREATE      | ~120         | Calculation helpers + gap status                 |
| `src/types/price-calculator.ts`                                     | UPDATE      | +40          | TwoLevelPricingResult, PriceGapStatus types      |

### Dependencies on Previous Stories

| Story | Component/Type Used                                                  |
| ----- | -------------------------------------------------------------------- |
| 44.15 | `FulfillmentType` for conditional rendering (FBO storage/acceptance) |
| 44.16 | `commissionPct` from category selection                              |
| 44.17 | `tax_type`, `tax_rate_pct` for tax breakdown                         |
| 44.18 | `advertising_pct` (DRR) for variable costs                           |
| 44.19 | `spp_pct` for customer price calculation                             |

### Change Log

_(To be filled by Dev Agent during implementation)_

---

## QA Results

_(To be filled after implementation)_

**Reviewer**:
**Date**:
**Gate Decision**:

### AC Verification

| AC  | Requirement                    | Status | Evidence |
| --- | ------------------------------ | ------ | -------- |
| AC1 | Two-Level Price Display Header | ⏳     |          |
| AC2 | Price Comparison Visual        | ⏳     |          |
| AC3 | Fixed Costs Breakdown          | ⏳     |          |
| AC4 | Percentage Costs Breakdown     | ⏳     |          |
| AC5 | Variable Costs (DRR)           | ⏳     |          |
| AC6 | Margin Section                 | ⏳     |          |
| AC7 | Summary Footer                 | ⏳     |          |
| AC8 | Responsive Layout              | ⏳     |          |

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

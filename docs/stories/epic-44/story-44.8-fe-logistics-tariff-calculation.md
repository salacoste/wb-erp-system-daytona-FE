# Story 44.8: Logistics Tariff Calculation

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: Ready for Dev
**Priority**: P1 - IMPORTANT
**Effort**: 2 SP
**Depends On**: Story 44.7 (Product Dimensions Input)

---

## User Story

**As a** Seller,
**I want** the logistics cost to be automatically calculated from product dimensions,
**So that** I get accurate logistics forward cost without manual lookup of WB tariff tables.

**Non-goals**:
- Backend API changes (frontend-only calculation)
- Logistics reverse calculation (uses buyback % adjustment)
- FBS/FBO logistics mode selection (assume FBO standard)
- Regional tariff variations (use Moscow base rates)
- Promotional/discounted tariff periods

---

## Acceptance Criteria

### AC1: Volume-Based Tariff Calculation (≤1 Liter)
- [ ] Calculate volume from dimensions (L × W × H in cm → liters)
- [ ] Apply tiered pricing for volumes ≤1 liter:
  - 0.001-0.1 L: 23 ₽/L (minimum charge 2.30 ₽)
  - 0.101-0.2 L: 25 ₽/L
  - 0.201-0.3 L: 27 ₽/L
  - 0.301-0.5 L: 29 ₽/L
  - 0.501-1.0 L: 32 ₽/L
- [ ] Display calculated tariff with tier indicator

### AC2: Large Volume Calculation (>1 Liter)
- [ ] For volumes >1 liter, apply formula: `46 + (volume - 1) × 14`
- [ ] First liter charged at 46 ₽
- [ ] Each additional liter charged at 14 ₽
- [ ] Display breakdown: "First liter: 46 ₽ + X liters × 14 ₽ = Y ₽"

### AC3: Calculation Breakdown Display
- [ ] Show applied tariff tier or formula
- [ ] Display volume calculation: "L × W × H = X liters"
- [ ] Show final logistics cost in ₽
- [ ] Tooltip explaining WB logistics tariff structure

### AC4: Form Integration
- [ ] Auto-fill `logistics_forward_rub` field when dimensions entered
- [ ] Allow manual override of calculated value
- [ ] Show "Calculated" badge when auto-filled
- [ ] Show "Manual" badge when user overrides

---

## Context & References

- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Story 44.7**: Product Dimensions Input (dependency)
- **Story 44.2**: `docs/stories/epic-44/story-44.2-fe-input-form-component.md`
- **WB Tariff Source**: Wildberries Seller Portal → Logistics → Tariff Calculator
- **Backend API**: `docs/request-backend/95-epic-43-price-calculator-api.md`

---

## Implementation Notes

### File Structure

```
src/
├── lib/
│   └── logistics-tariff.ts              # CREATE - Tariff calculation logic
└── components/
    └── custom/
        └── price-calculator/
            ├── LogisticsTariffDisplay.tsx  # CREATE - Tariff breakdown display
            ├── PriceCalculatorForm.tsx     # UPDATE - Integrate tariff calculation
            └── DimensionsInput.tsx         # EXISTS (from Story 44.7)
```

### TypeScript Interfaces

```typescript
// src/lib/logistics-tariff.ts

/**
 * WB Logistics Tariff Tiers (≤1 liter)
 * Source: Wildberries Seller Portal, January 2026
 */
export const LOGISTICS_TARIFF_TIERS = [
  { minVolume: 0.001, maxVolume: 0.1, pricePerLiter: 23, minCharge: 2.30 },
  { minVolume: 0.101, maxVolume: 0.2, pricePerLiter: 25, minCharge: null },
  { minVolume: 0.201, maxVolume: 0.3, pricePerLiter: 27, minCharge: null },
  { minVolume: 0.301, maxVolume: 0.5, pricePerLiter: 29, minCharge: null },
  { minVolume: 0.501, maxVolume: 1.0, pricePerLiter: 32, minCharge: null },
] as const;

/**
 * Large volume pricing (>1 liter)
 */
export const LARGE_VOLUME_PRICING = {
  firstLiterCharge: 46,    // ₽ for first liter
  additionalPerLiter: 14,  // ₽ per each additional liter
} as const;

/**
 * Product dimensions in centimeters
 */
export interface ProductDimensions {
  length_cm: number;
  width_cm: number;
  height_cm: number;
}

/**
 * Tariff calculation result
 */
export interface LogisticsTariffResult {
  volume_liters: number;
  logistics_cost_rub: number;
  tariff_tier: string;           // e.g., "0.1-0.2 L" or ">1 L"
  calculation_breakdown: string; // Human-readable breakdown
  is_large_volume: boolean;
}

/**
 * Calculate volume in liters from dimensions in cm
 */
export function calculateVolumeLiters(dimensions: ProductDimensions): number {
  const volumeCm3 = dimensions.length_cm * dimensions.width_cm * dimensions.height_cm;
  const volumeLiters = volumeCm3 / 1000; // 1 liter = 1000 cm³
  return Math.round(volumeLiters * 1000) / 1000; // Round to 3 decimal places
}

/**
 * Calculate logistics tariff based on volume
 */
export function calculateLogisticsTariff(
  dimensions: ProductDimensions
): LogisticsTariffResult {
  const volume = calculateVolumeLiters(dimensions);

  // Large volume pricing (>1 liter)
  if (volume > 1) {
    const additionalLiters = Math.ceil(volume - 1);
    const cost = LARGE_VOLUME_PRICING.firstLiterCharge +
                 (additionalLiters * LARGE_VOLUME_PRICING.additionalPerLiter);

    return {
      volume_liters: volume,
      logistics_cost_rub: cost,
      tariff_tier: '>1 L',
      calculation_breakdown: `Первый литр: 46 ₽ + ${additionalLiters} л × 14 ₽ = ${cost} ₽`,
      is_large_volume: true,
    };
  }

  // Tiered pricing (≤1 liter)
  const tier = LOGISTICS_TARIFF_TIERS.find(
    t => volume >= t.minVolume && volume <= t.maxVolume
  );

  if (!tier) {
    // Volume too small (< 0.001 L) - use minimum tier
    const minTier = LOGISTICS_TARIFF_TIERS[0];
    return {
      volume_liters: volume,
      logistics_cost_rub: minTier.minCharge!,
      tariff_tier: `<0.001 L (мин.)`,
      calculation_breakdown: `Минимальный тариф: ${minTier.minCharge} ₽`,
      is_large_volume: false,
    };
  }

  let cost = volume * tier.pricePerLiter;

  // Apply minimum charge if applicable
  if (tier.minCharge && cost < tier.minCharge) {
    cost = tier.minCharge;
  }

  // Round to 2 decimal places
  cost = Math.round(cost * 100) / 100;

  return {
    volume_liters: volume,
    logistics_cost_rub: cost,
    tariff_tier: `${tier.minVolume}-${tier.maxVolume} L`,
    calculation_breakdown: `${volume.toFixed(3)} л × ${tier.pricePerLiter} ₽/л = ${cost} ₽`,
    is_large_volume: false,
  };
}
```

### Component Structure

```typescript
// src/components/custom/price-calculator/LogisticsTariffDisplay.tsx
interface LogisticsTariffDisplayProps {
  result: LogisticsTariffResult | null;
  isCalculated: boolean;          // true = auto-filled, false = manual override
  onUseCalculated?: () => void;   // Re-apply calculated value
}

// Usage in PriceCalculatorForm.tsx
const [tariffResult, setTariffResult] = useState<LogisticsTariffResult | null>(null);
const [isLogisticsManual, setIsLogisticsManual] = useState(false);

// Watch dimensions and recalculate tariff
useEffect(() => {
  if (dimensions.length_cm && dimensions.width_cm && dimensions.height_cm) {
    const result = calculateLogisticsTariff(dimensions);
    setTariffResult(result);

    // Auto-fill if not manually overridden
    if (!isLogisticsManual) {
      setValue('logistics_forward_rub', result.logistics_cost_rub);
    }
  }
}, [dimensions, isLogisticsManual]);
```

### Tariff Display Component

```typescript
// src/components/custom/price-calculator/LogisticsTariffDisplay.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Calculator, RefreshCw } from 'lucide-react';
import type { LogisticsTariffResult } from '@/lib/logistics-tariff';

interface LogisticsTariffDisplayProps {
  result: LogisticsTariffResult | null;
  isCalculated: boolean;
  onUseCalculated?: () => void;
  className?: string;
}

export function LogisticsTariffDisplay({
  result,
  isCalculated,
  onUseCalculated,
  className,
}: LogisticsTariffDisplayProps) {
  if (!result) return null;

  return (
    <div className={cn('text-sm text-muted-foreground space-y-1', className)}>
      {/* Volume calculation */}
      <div className="flex items-center gap-2">
        <Calculator className="h-3 w-3" />
        <span>Объём: {result.volume_liters.toFixed(3)} л</span>
        <Badge variant={isCalculated ? 'secondary' : 'outline'} className="text-xs">
          {isCalculated ? 'Рассчитано' : 'Вручную'}
        </Badge>
      </div>

      {/* Tariff tier */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            <span>Тариф: {result.tariff_tier}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="font-medium">Тарифы логистики WB</p>
          <ul className="text-xs mt-1 space-y-0.5">
            <li>0.001-0.1 л: 23 ₽/л (мин. 2.30 ₽)</li>
            <li>0.1-0.2 л: 25 ₽/л</li>
            <li>0.2-0.3 л: 27 ₽/л</li>
            <li>0.3-0.5 л: 29 ₽/л</li>
            <li>0.5-1.0 л: 32 ₽/л</li>
            <li>&gt;1 л: 46 ₽ + (объём - 1) × 14 ₽</li>
          </ul>
        </TooltipContent>
      </Tooltip>

      {/* Calculation breakdown */}
      <div className="text-xs">{result.calculation_breakdown}</div>

      {/* Re-apply button (if manual override) */}
      {!isCalculated && onUseCalculated && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onUseCalculated}
          className="h-6 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Применить расчёт
        </Button>
      )}
    </div>
  );
}
```

### Form Integration

```typescript
// In PriceCalculatorForm.tsx - Add to logistics_forward_rub field

// After the Input field for logistics_forward_rub:
<LogisticsTariffDisplay
  result={tariffResult}
  isCalculated={!isLogisticsManual}
  onUseCalculated={() => {
    if (tariffResult) {
      setValue('logistics_forward_rub', tariffResult.logistics_cost_rub);
      setIsLogisticsManual(false);
    }
  }}
/>

// Add onChange handler to detect manual override:
<Input
  {...register('logistics_forward_rub')}
  onChange={(e) => {
    register('logistics_forward_rub').onChange(e);
    setIsLogisticsManual(true);
  }}
/>
```

---

## Invariants & Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Volume < 0.001 L | Use minimum charge (2.30 ₽) |
| Volume exactly 1 L | Use tier 0.5-1.0 L (32 ₽/L) |
| Volume 1.001 L | Use large volume formula (46 + 0.001 × 14 ≈ 46 ₽) |
| Large volume (10 L) | 46 + 9 × 14 = 172 ₽ |
| Dimensions not entered | No tariff calculation, field empty |
| Manual override | Keep user value, show "Manual" badge |
| Dimension changed after override | Ask to recalculate or keep manual |
| Zero dimension value | Invalid input, no calculation |
| Negative dimension | Validation error |

### Edge Case: Fractional Liters for Large Volume

For volumes > 1 liter, WB rounds up additional liters:
- 1.1 L → 46 + 1 × 14 = 60 ₽ (ceil(0.1) = 1)
- 1.9 L → 46 + 1 × 14 = 60 ₽ (ceil(0.9) = 1)
- 2.1 L → 46 + 2 × 14 = 74 ₽ (ceil(1.1) = 2)

---

## Observability

- **Logs**: Log tariff tier applied for analytics
- **Analytics**: Track auto-fill vs manual override ratio
- **Metrics**: Average calculated logistics cost by volume tier

---

## Security

- **Input Validation**: All dimension inputs must be positive numbers
- **Max Values**: Limit dimensions to reasonable max (e.g., 200 cm per side)
- **No External API**: All calculation is client-side, no data exposure

---

## Accessibility (WCAG 2.1 AA)

- [ ] Tariff breakdown announced to screen readers
- [ ] Tooltip accessible via keyboard (Tab + Enter)
- [ ] Badge text provides context (not color-only)
- [ ] Calculation result has aria-live="polite"
- [ ] Re-apply button has descriptive aria-label

---

## Dev Agent Record

### File List
| File | Change Type | Description |
|------|-------------|-------------|
| `src/lib/logistics-tariff.ts` | CREATE | Tariff calculation logic with tier constants |
| `src/components/custom/price-calculator/LogisticsTariffDisplay.tsx` | CREATE | Tariff breakdown display component |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | UPDATE | Integrate tariff calculation with dimensions |

### Change Log
_To be filled during implementation_

### Review Follow-ups
_To be filled during code review_

---

## QA Results

**Reviewer**: _Pending_
**Date**: _Pending_
**Gate Decision**: _Pending_

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Tiered pricing ≤1L | ⏳ | |
| AC2 | Large volume >1L | ⏳ | |
| AC3 | Breakdown display | ⏳ | |
| AC4 | Form integration | ⏳ | |

### Test Scenarios
| Volume (L) | Expected Cost | Tier |
|------------|---------------|------|
| 0.05 | 2.30 ₽ (min) | 0.001-0.1 L |
| 0.1 | 2.30 ₽ | 0.001-0.1 L |
| 0.15 | 3.75 ₽ | 0.1-0.2 L |
| 0.25 | 6.75 ₽ | 0.2-0.3 L |
| 0.4 | 11.60 ₽ | 0.3-0.5 L |
| 0.75 | 24.00 ₽ | 0.5-1.0 L |
| 1.0 | 32.00 ₽ | 0.5-1.0 L |
| 1.5 | 60.00 ₽ | >1 L |
| 5.0 | 102.00 ₽ | >1 L |
| 10.0 | 172.00 ₽ | >1 L |

### Accessibility Check
| Check | Status | Evidence |
|-------|--------|----------|
| Screen reader support | ⏳ | |
| Keyboard navigation | ⏳ | |
| Color contrast | ⏳ | |
| aria-live updates | ⏳ | |

---

## Notes

- **WB Tariff Source**: Wildberries Seller Portal logistics calculator (January 2026 rates)
- **Tariff Updates**: Rates may change; consider adding a "last updated" indicator
- **Future Enhancement**: Fetch live rates from WB API if available
- **Regional Variations**: Current implementation uses Moscow base rates; regional multipliers out of scope

---

**Last Updated**: 2026-01-19

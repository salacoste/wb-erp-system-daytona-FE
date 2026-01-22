# Story 44.8: Logistics Tariff Calculation

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 📋 Ready for Dev
**Priority**: P1 - IMPORTANT
**Effort**: 2 SP
**Depends On**: Story 44.7 (Volume + Cargo Type) ✅, Story 44.12 (Warehouse Selection)

---

## User Story

**As a** Seller,
**I want** the logistics forward cost to be automatically calculated from product volume and warehouse tariffs,
**So that** I get accurate logistics costs without manual lookup of WB tariff tables.

**Non-goals**:
- Backend API changes (use existing tariffs API)
- Logistics reverse calculation (covered in Story 44.10)
- FBS logistics mode (assume FBO for this story)
- Regional tariff variations beyond warehouse selection

---

## Background: WB Logistics Tariff System (from Backend Response #98)

### Box Tariffs Structure (MGT/SGT)

WB calculates box logistics using volume-based pricing with warehouse-specific coefficients:

```
logistics_forward = (baseLiterRub + (volume - 1) × additionalLiterRub) × coefficient
```

**Where:**
- `baseLiterRub` = Cost for first liter (e.g., 48 ₽)
- `additionalLiterRub` = Cost per additional liter (e.g., 5 ₽)
- `volume` = Product volume in liters (from Story 44.7)
- `coefficient` = Warehouse-specific acceptance coefficient (from Story 44.13)

### Backend API Response (from Request #98)

```json
{
  "dtFromMin": "2026-01-20T00:00:00Z",
  "dtNextBox": "2026-01-27T00:00:00Z",
  "warehouseList": [
    {
      "warehouseID": 507,
      "warehouseName": "Коледино",
      "boxDeliveryAndStorageExpr": "48*1+5*x",
      "boxDeliveryBase": "48*1",
      "boxDeliveryLiter": "5*x",
      "boxStorageBase": "1*1",
      "boxStorageLiter": "1*x"
    }
  ],
  "coefficient": [
    {
      "date": "2026-01-20",
      "coefficient": 100
    }
  ]
}
```

**Key formulas from SDK:**
- `baseLiterRub = 48` (from `boxDeliveryBase = "48*1"`)
- `additionalLiterRub = 5` (from `boxDeliveryLiter = "5*x"`)
- `coefficient = 100 / 100 = 1.0` (normalized from integer)

---

## Acceptance Criteria

### AC1: Volume-Based Tariff Calculation (from Story 44.7 dimensions)
- [ ] Use volume from Story 44.7 dimension inputs
- [ ] Apply WB logistics formula: `(base + (volume - 1) × per_liter) × coefficient`
- [ ] For volume ≤ 1L: Use only base rate (no additional liters)
- [ ] For volume > 1L: Add per-liter charges for additional volume
- [ ] Display calculated tariff with breakdown

### AC2: Warehouse Tariff Integration (from Backend API)
- [ ] When warehouse selected (Story 44.12), fetch tariffs from API
- [ ] Use `boxDeliveryBase` for first liter cost (e.g., 48 ₽)
- [ ] Use `boxDeliveryLiter` for additional liter cost (e.g., 5 ₽)
- [ ] Apply warehouse coefficient (normalized: 100 → 1.0, 125 → 1.25)
- [ ] Show tariff source: "Тариф склада {warehouse_name}"

### AC3: Calculation Breakdown Display
- [ ] Show 4-step breakdown:
  1. "Объём: X л" (Volume from dimensions)
  2. "Базовый тариф (1 л): Y ₽" (Base rate)
  3. "Доп. литры (Z л): W ₽" (Additional liter charges)
  4. "Коэффициент склада: ×K" (Warehouse coefficient)
- [ ] Show final: "Итого логистика: X ₽"
- [ ] Breakdown collapsible (collapsed by default)

### AC4: Form Integration
- [ ] Auto-fill `logistics_forward_rub` field when all inputs provided
- [ ] Allow manual override of calculated value
- [ ] Show "Рассчитано" badge when auto-filled
- [ ] Show "Вручную" badge when user overrides
- [ ] "Восстановить" button to revert to calculated value

### AC5: Fallback Mode (No Warehouse Selected)
- [ ] If no warehouse selected, use default tariffs:
  - `baseLiterRub = 46 ₽`
  - `additionalLiterRub = 14 ₽`
  - `coefficient = 1.0`
- [ ] Show info notice: "Выберите склад для точного расчёта"
- [ ] Allow manual input of tariff values

### AC6: Real-time Updates
- [ ] Recalculate when volume changes (from Story 44.7)
- [ ] Recalculate when warehouse changes (from Story 44.12)
- [ ] Recalculate when coefficient changes (from Story 44.13)
- [ ] Debounce recalculation (300ms delay)

---

## API Contract (Backend Request #98)

### Get Warehouse Tariffs

**Endpoint**: `GET /v1/tariffs/acceptance/coefficients?warehouseId={id}`

**Request**:
```http
GET /v1/tariffs/acceptance/coefficients?warehouseId=507
Authorization: Bearer {token}
X-Cabinet-Id: {cabinet_id}
```

**Response**:
```json
{
  "data": {
    "warehouseId": 507,
    "warehouseName": "Коледино",
    "tariffs": {
      "boxDeliveryBase": 48,
      "boxDeliveryLiter": 5,
      "boxStorageBase": 1,
      "boxStorageLiter": 1
    },
    "coefficients": [
      {
        "date": "2026-01-20",
        "coefficient": 1.0
      },
      {
        "date": "2026-01-21",
        "coefficient": 1.25
      }
    ],
    "effectiveFrom": "2026-01-20T00:00:00Z",
    "effectiveUntil": "2026-01-27T00:00:00Z"
  }
}
```

---

## Context & References

- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Backend Request #98**: `docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md`
- **SDK Reference**: `docs/stories/epic-44/SDK-WAREHOUSES-TARIFFS-REFERENCE.md`
- **Story 44.7**: Product Dimensions Input (volume source)
- **Story 44.12**: Warehouse Selection (tariff source)
- **Story 44.13**: Coefficient Auto-fill (coefficient source)

---

## Implementation Notes

### File Structure

```
src/
├── lib/
│   └── logistics-tariff.ts              # CREATE - Tariff calculation logic
├── components/
│   └── custom/
│       └── price-calculator/
│           ├── LogisticsTariffDisplay.tsx  # CREATE - Tariff breakdown display
│           ├── LogisticsTariffCalculator.tsx # CREATE - Calculator with form integration
│           └── PriceCalculatorForm.tsx     # UPDATE - Integrate tariff calculation
└── types/
    └── tariffs.ts                       # UPDATE - Add box tariff types
```

### TypeScript Interfaces

```typescript
// src/types/tariffs.ts

/**
 * Box delivery tariffs from WB API
 */
export interface BoxDeliveryTariffs {
  /** First liter base cost (RUB) */
  baseLiterRub: number
  /** Additional liter cost (RUB) */
  additionalLiterRub: number
  /** Warehouse coefficient (normalized: 1.0, 1.25, etc.) */
  coefficient: number
}

/**
 * Logistics tariff calculation result
 */
export interface LogisticsTariffResult {
  /** Product volume in liters */
  volumeLiters: number
  /** Base cost for first liter (RUB) */
  baseCost: number
  /** Additional liters cost (RUB) */
  additionalLitersCost: number
  /** Applied coefficient */
  coefficient: number
  /** Final logistics cost (RUB) */
  totalCost: number
  /** Calculation breakdown for display */
  breakdown: LogisticsTariffBreakdown
  /** Source of tariff data */
  source: 'warehouse' | 'default' | 'manual'
}

export interface LogisticsTariffBreakdown {
  volumeDisplay: string      // "3,00 л"
  baseRateDisplay: string    // "48 ₽ (первый литр)"
  additionalDisplay: string  // "2 л × 5 ₽ = 10 ₽"
  coefficientDisplay: string // "×1.25"
  totalDisplay: string       // "72,50 ₽"
}

/**
 * Default tariffs (fallback when no warehouse selected)
 */
export const DEFAULT_BOX_TARIFFS: BoxDeliveryTariffs = {
  baseLiterRub: 46,
  additionalLiterRub: 14,
  coefficient: 1.0,
}
```

### Calculation Functions

```typescript
// src/lib/logistics-tariff.ts

import type { BoxDeliveryTariffs, LogisticsTariffResult } from '@/types/tariffs'

/**
 * Calculate logistics forward cost using WB formula
 *
 * Formula: (baseLiterRub + (volume - 1) × additionalLiterRub) × coefficient
 *
 * @param volumeLiters - Product volume in liters (from Story 44.7)
 * @param tariffs - Box delivery tariffs (from warehouse or default)
 * @returns Calculated logistics cost and breakdown
 */
export function calculateLogisticsTariff(
  volumeLiters: number,
  tariffs: BoxDeliveryTariffs
): LogisticsTariffResult {
  if (volumeLiters <= 0) {
    return createZeroResult(tariffs)
  }

  // Calculate additional liters (first liter is included in base)
  const additionalLiters = Math.max(0, volumeLiters - 1)

  // Base cost for first liter
  const baseCost = tariffs.baseLiterRub

  // Cost for additional liters
  const additionalLitersCost = additionalLiters * tariffs.additionalLiterRub

  // Total before coefficient
  const subtotal = baseCost + additionalLitersCost

  // Apply warehouse coefficient
  const totalCost = subtotal * tariffs.coefficient

  // Round to 2 decimal places
  const finalCost = Math.round(totalCost * 100) / 100

  return {
    volumeLiters,
    baseCost,
    additionalLitersCost,
    coefficient: tariffs.coefficient,
    totalCost: finalCost,
    breakdown: createBreakdown(
      volumeLiters,
      baseCost,
      additionalLiters,
      tariffs.additionalLiterRub,
      tariffs.coefficient,
      finalCost
    ),
    source: 'warehouse',
  }
}

function createBreakdown(
  volume: number,
  baseCost: number,
  additionalLiters: number,
  additionalRate: number,
  coefficient: number,
  total: number
): LogisticsTariffBreakdown {
  return {
    volumeDisplay: `${volume.toFixed(2).replace('.', ',')} л`,
    baseRateDisplay: `${baseCost} ₽ (первый литр)`,
    additionalDisplay: additionalLiters > 0
      ? `${additionalLiters.toFixed(1)} л × ${additionalRate} ₽ = ${(additionalLiters * additionalRate).toFixed(2)} ₽`
      : 'Нет доп. литров',
    coefficientDisplay: coefficient !== 1.0 ? `×${coefficient.toFixed(2)}` : '×1.00',
    totalDisplay: `${total.toFixed(2).replace('.', ',')} ₽`,
  }
}

function createZeroResult(tariffs: BoxDeliveryTariffs): LogisticsTariffResult {
  return {
    volumeLiters: 0,
    baseCost: 0,
    additionalLitersCost: 0,
    coefficient: tariffs.coefficient,
    totalCost: 0,
    breakdown: {
      volumeDisplay: '0,00 л',
      baseRateDisplay: '—',
      additionalDisplay: '—',
      coefficientDisplay: '—',
      totalDisplay: '0,00 ₽',
    },
    source: 'default',
  }
}

/**
 * Parse WB tariff expression (e.g., "48*1", "5*x")
 * Returns the numeric value before the multiplier
 */
export function parseTariffExpression(expr: string): number {
  const match = expr.match(/^(\d+)\*/)
  return match ? parseInt(match[1], 10) : 0
}

/**
 * Normalize WB coefficient (integer 100 → decimal 1.0)
 */
export function normalizeCoefficient(coefficient: number): number {
  // WB returns 100 for 1.0, 125 for 1.25, etc.
  return coefficient / 100
}
```

### Component Structure

```typescript
// src/components/custom/price-calculator/LogisticsTariffCalculator.tsx

interface LogisticsTariffCalculatorProps {
  /** Volume in liters from Story 44.7 */
  volumeLiters: number
  /** Selected warehouse ID from Story 44.12 */
  warehouseId: number | null
  /** Warehouse coefficient from Story 44.13 */
  coefficient: number
  /** Current value in form */
  value: number
  /** Change handler */
  onChange: (value: number) => void
  /** Auto-calculate enabled */
  autoCalculate: boolean
  /** Toggle auto-calculate */
  onAutoCalculateChange: (enabled: boolean) => void
  /** Disabled state */
  disabled?: boolean
}

export function LogisticsTariffCalculator({
  volumeLiters,
  warehouseId,
  coefficient,
  value,
  onChange,
  autoCalculate,
  onAutoCalculateChange,
  disabled,
}: LogisticsTariffCalculatorProps) {
  // Fetch warehouse tariffs when warehouse selected
  const { data: tariffs, isLoading } = useWarehouseTariffs(warehouseId)

  // Calculate logistics cost
  const result = useMemo(() => {
    const effectiveTariffs: BoxDeliveryTariffs = tariffs
      ? {
          baseLiterRub: tariffs.boxDeliveryBase,
          additionalLiterRub: tariffs.boxDeliveryLiter,
          coefficient: coefficient,
        }
      : DEFAULT_BOX_TARIFFS

    return calculateLogisticsTariff(volumeLiters, effectiveTariffs)
  }, [volumeLiters, tariffs, coefficient])

  // Auto-update form value when auto-calculate enabled
  useEffect(() => {
    if (autoCalculate && result.totalCost !== value) {
      onChange(result.totalCost)
    }
  }, [autoCalculate, result.totalCost, value, onChange])

  const isManualOverride = !autoCalculate || value !== result.totalCost

  return (
    <div className="space-y-4">
      {/* No warehouse notice */}
      {!warehouseId && (
        <Alert variant="info">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Выберите склад для точного расчёта логистики
          </AlertDescription>
        </Alert>
      )}

      {/* Auto-calculate toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="auto-calc-logistics">Рассчитать автоматически</Label>
        <Switch
          id="auto-calc-logistics"
          checked={autoCalculate}
          onCheckedChange={onAutoCalculateChange}
          disabled={disabled || isLoading}
        />
      </div>

      {/* Input field with badge */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Логистика прямая, ₽</Label>
          <AutoFillBadge source={isManualOverride ? 'manual' : 'auto'} />
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            value={value}
            onChange={(e) => {
              onChange(parseFloat(e.target.value) || 0)
              onAutoCalculateChange(false)
            }}
            disabled={disabled || (autoCalculate && !isLoading)}
            className="flex-1"
            min={0}
            step={0.01}
          />
          {isManualOverride && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onChange(result.totalCost)
                onAutoCalculateChange(true)
              }}
              title="Восстановить расчётное значение"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tariff breakdown */}
      <LogisticsTariffDisplay
        result={result}
        warehouseName={tariffs?.warehouseName}
        isLoading={isLoading}
      />
    </div>
  )
}
```

### Tariff Display Component

```typescript
// src/components/custom/price-calculator/LogisticsTariffDisplay.tsx

interface LogisticsTariffDisplayProps {
  result: LogisticsTariffResult
  warehouseName?: string
  isLoading?: boolean
}

export function LogisticsTariffDisplay({
  result,
  warehouseName,
  isLoading,
}: LogisticsTariffDisplayProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
        Показать расчёт
        {warehouseName && (
          <span className="text-xs">({warehouseName})</span>
        )}
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2 space-y-1 text-sm border-l-2 border-muted pl-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Объём:</span>
          <span>{result.breakdown.volumeDisplay}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Базовый тариф:</span>
          <span>{result.breakdown.baseRateDisplay}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Доп. литры:</span>
          <span>{result.breakdown.additionalDisplay}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Коэффициент:</span>
          <span>{result.breakdown.coefficientDisplay}</span>
        </div>

        <Separator className="my-2" />

        <div className="flex justify-between font-medium">
          <span className="text-muted-foreground">Итого логистика:</span>
          <span className="text-primary">{result.breakdown.totalDisplay}</span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Логистика                                            [?]    │
├─────────────────────────────────────────────────────────────┤
│ ℹ️ Выберите склад для точного расчёта логистики              │
├─────────────────────────────────────────────────────────────┤
│ Рассчитать автоматически                         [========] │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Логистика прямая, ₽                    [Рассчитано]   │   │
│ │ [    72.50    ]                              [↺]      │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ▸ Показать расчёт (Коледино)                                │
│   ├─ Объём:                            3,00 л               │
│   ├─ Базовый тариф:                    48 ₽ (первый литр)   │
│   ├─ Доп. литры:                       2 л × 5 ₽ = 10 ₽     │
│   ├─ Коэффициент:                      ×1.25                │
│   ├──────────────────────────────────────────               │
│   └─ Итого логистика:                  72,50 ₽              │
└─────────────────────────────────────────────────────────────┘
```

---

## Invariants & Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Volume < 0.001 L | Use minimum 1 L for calculation |
| Volume exactly 1 L | Only base rate applies (no additional liters) |
| Volume 1.001 L | Base + 0.001L additional (minimal extra) |
| Large volume (10 L) | Base + 9L additional |
| Coefficient = 0 | Treat as 1.0 (no adjustment) |
| Coefficient > 5.0 | Allow but show warning |
| No warehouse selected | Use DEFAULT_BOX_TARIFFS |
| Manual override | Keep user value, show "Вручную" badge |
| Dimension changed | Recalculate if auto-calculate enabled |
| Warehouse changed | Refetch tariffs, recalculate |

### Test Scenarios

| Volume (L) | Base (₽) | Per-L (₽) | Coef | Expected Cost |
|------------|----------|-----------|------|---------------|
| 1.0 | 48 | 5 | 1.0 | 48.00 ₽ |
| 2.0 | 48 | 5 | 1.0 | 53.00 ₽ |
| 3.0 | 48 | 5 | 1.0 | 58.00 ₽ |
| 3.0 | 48 | 5 | 1.25 | 72.50 ₽ |
| 5.0 | 48 | 5 | 1.0 | 68.00 ₽ |
| 10.0 | 48 | 5 | 1.5 | 117.00 ₽ |
| 0.5 | 48 | 5 | 1.0 | 48.00 ₽ (min 1L) |

---

## Observability

- **Logs**: Log tariff calculation results for debugging
- **Analytics**: Track auto-fill vs manual override ratio
- **Metrics**: Average calculated logistics cost by volume tier

---

## Security

- **Input Validation**: All inputs validated (volume ≥ 0, coefficient ≥ 1.0)
- **Max Values**: Limit coefficient to reasonable max (e.g., 10.0)
- **No External API**: Calculation is client-side with cached tariffs

---

## Accessibility (WCAG 2.1 AA)

- [ ] Tariff breakdown announced to screen readers
- [ ] Collapsible section keyboard accessible (Enter/Space to toggle)
- [ ] Badge text provides context (not color-only)
- [ ] Calculation result has `aria-live="polite"`
- [ ] Loading state announced to screen readers
- [ ] Restore button has descriptive `aria-label`

---

## Dev Agent Record

### File List
| File | Change Type | Description |
|------|-------------|-------------|
| `src/lib/logistics-tariff.ts` | CREATE | Tariff calculation logic with WB formula |
| `src/types/tariffs.ts` | UPDATE | Add box tariff types |
| `src/components/custom/price-calculator/LogisticsTariffCalculator.tsx` | CREATE | Calculator with auto-fill |
| `src/components/custom/price-calculator/LogisticsTariffDisplay.tsx` | CREATE | Tariff breakdown display |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | UPDATE | Integrate tariff calculator |

### Change Log
_To be filled during implementation_

### Review Follow-ups
_To be filled during code review_

---

## Definition of Done

- [ ] All Acceptance Criteria verified (AC1-AC6)
- [ ] Components created with proper TypeScript types
- [ ] Calculation matches WB formula exactly
- [ ] Auto-fill and manual override work correctly
- [ ] Fallback mode works when no warehouse selected
- [ ] Unit tests written for logistics-tariff.ts
- [ ] Component tests for LogisticsTariffCalculator
- [ ] No ESLint errors
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Code review completed
- [ ] Documentation updated
- [ ] QA Gate passed

---

## QA Results

**Reviewer**: _Pending_
**Date**: _Pending_
**Gate Decision**: _Pending_

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Volume-based calculation | ⏳ | |
| AC2 | Warehouse tariff integration | ⏳ | |
| AC3 | Breakdown display | ⏳ | |
| AC4 | Form integration | ⏳ | |
| AC5 | Fallback mode | ⏳ | |
| AC6 | Real-time updates | ⏳ | |

### Accessibility Check
| Check | Status | Evidence |
|-------|--------|----------|
| Screen reader support | ⏳ | |
| Keyboard navigation | ⏳ | |
| Color contrast | ⏳ | |
| aria-live updates | ⏳ | |

---

**Created**: 2026-01-19
**Last Updated**: 2026-01-20

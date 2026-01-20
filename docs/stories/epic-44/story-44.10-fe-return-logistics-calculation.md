# Story 44.10: Return Logistics Calculation

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: Ready for Dev
**Priority**: P1 - IMPORTANT
**Effort**: 2 SP
**Depends On**: Story 44.9 (KTR Coefficient Implementation)

---

## User Story

**As a** Seller,
**I want** the return logistics cost to be auto-calculated from forward logistics with КТР coefficient and buyback percentage applied,
**So that** I get an accurate effective return cost without manual calculations.

**Non-goals**:
- Backend API changes (frontend-only calculation)
- Modifying existing form validation schema (extend only)
- КТР coefficient UI (covered in Story 44.9)

---

## Acceptance Criteria

### AC1: Auto-Calculate Return Logistics from Forward Logistics
- [ ] When `logistics_forward_rub` changes, auto-calculate base return logistics
- [ ] Formula: `base_return = logistics_forward_rub` (same tariff per WB docs)
- [ ] Show calculated value in `logistics_reverse_rub` field
- [ ] Display "(авто)" label when auto-calculated
- [ ] Update in real-time as forward logistics changes

### AC2: Apply КТР Coefficient to Return Logistics
- [ ] Formula: `return_with_ktr = base_return × ktr_coefficient`
- [ ] КТР coefficient sourced from Story 44.9 implementation
- [ ] Display breakdown: "Base: X ₽ × КТР Y = Z ₽"
- [ ] Recalculate when either forward logistics or КТР changes

### AC3: Calculate Effective Return Cost Based on Buyback
- [ ] Formula: `effective_return = return_with_ktr × (100 - buyback_pct) / 100`
- [ ] If buyback = 100%, effective return = 0 ₽
- [ ] If buyback = 50%, effective return = 50% of return with КТР
- [ ] Display final effective value prominently
- [ ] Show calculation breakdown in tooltip or collapsible section

### AC4: Return Logistics Breakdown Display
- [ ] Show 3-step breakdown:
  1. "Базовый возврат: X ₽" (Base return = forward logistics)
  2. "С учётом КТР (×Y): Z ₽" (After КТР coefficient)
  3. "Эффективный (buyback W%): V ₽" (Final effective cost)
- [ ] Collapsible breakdown section (collapsed by default)
- [ ] Expand icon/chevron to show/hide breakdown
- [ ] Breakdown updates in real-time

### AC5: Manual Override Option
- [ ] Toggle switch: "Рассчитать автоматически" (default: ON)
- [ ] When OFF, `logistics_reverse_rub` becomes editable
- [ ] Manual value persists until toggle switched back to auto
- [ ] Visual indicator when manual override is active
- [ ] Warning if manual value differs significantly (>20%) from calculated

### AC6: Form Integration
- [ ] Auto-fill `logistics_reverse_rub` field in PriceCalculatorForm
- [ ] Pass calculated `logistics_reverse_rub` to API request
- [ ] Validate that effective return ≥ 0
- [ ] Handle edge case: forward logistics = 0 (return = 0)

---

## Context & References

- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Story 44.9**: `docs/stories/epic-44/story-44.9-fe-ktr-coefficient-implementation.md`
- **Story 44.2**: Input Form Component (base form implementation)
- **WB Documentation**: Return logistics = Forward logistics × КТР

---

## Implementation Notes

### File Structure

```
src/
├── components/
│   └── custom/
│       └── price-calculator/
│           ├── ReturnLogisticsCalculator.tsx    # CREATE - Auto-calc component
│           ├── ReturnLogisticsBreakdown.tsx     # CREATE - Breakdown display
│           └── PriceCalculatorForm.tsx          # UPDATE - Integrate return calc
├── lib/
│   └── return-logistics-utils.ts                # CREATE - Calculation functions
└── hooks/
    └── useReturnLogistics.ts                    # CREATE - State management hook
```

### Calculation Functions

```typescript
// src/lib/return-logistics-utils.ts

/**
 * Calculate base return logistics (same as forward per WB rules)
 */
export function calculateBaseReturnLogistics(forwardLogistics: number): number {
  return forwardLogistics
}

/**
 * Apply КТР coefficient to return logistics
 */
export function calculateReturnWithKtr(
  baseReturn: number,
  ktrCoefficient: number
): number {
  return baseReturn * ktrCoefficient
}

/**
 * Calculate effective return cost after buyback adjustment
 * @param returnWithKtr - Return logistics after КТР applied
 * @param buybackPct - Buyback percentage (0-100)
 * @returns Effective return cost (0 if buyback = 100%)
 */
export function calculateEffectiveReturn(
  returnWithKtr: number,
  buybackPct: number
): number {
  // Return rate = 100 - buyback %
  const returnRate = (100 - buybackPct) / 100
  return returnWithKtr * returnRate
}

/**
 * Full return logistics calculation
 */
export interface ReturnLogisticsResult {
  baseReturn: number
  returnWithKtr: number
  effectiveReturn: number
  ktrApplied: number
  buybackPct: number
}

export function calculateReturnLogistics(
  forwardLogistics: number,
  ktrCoefficient: number,
  buybackPct: number
): ReturnLogisticsResult {
  const baseReturn = calculateBaseReturnLogistics(forwardLogistics)
  const returnWithKtr = calculateReturnWithKtr(baseReturn, ktrCoefficient)
  const effectiveReturn = calculateEffectiveReturn(returnWithKtr, buybackPct)

  return {
    baseReturn,
    returnWithKtr,
    effectiveReturn,
    ktrApplied: ktrCoefficient,
    buybackPct,
  }
}
```

### ReturnLogisticsCalculator Component

```typescript
// src/components/custom/price-calculator/ReturnLogisticsCalculator.tsx
interface ReturnLogisticsCalculatorProps {
  forwardLogistics: number
  ktrCoefficient: number
  buybackPct: number
  value: number
  onChange: (value: number) => void
  autoCalculate: boolean
  onAutoCalculateChange: (auto: boolean) => void
}

export function ReturnLogisticsCalculator({
  forwardLogistics,
  ktrCoefficient,
  buybackPct,
  value,
  onChange,
  autoCalculate,
  onAutoCalculateChange,
}: ReturnLogisticsCalculatorProps) {
  // Calculate values
  const calculated = useMemo(
    () => calculateReturnLogistics(forwardLogistics, ktrCoefficient, buybackPct),
    [forwardLogistics, ktrCoefficient, buybackPct]
  )

  // Auto-update when auto-calculate enabled
  useEffect(() => {
    if (autoCalculate) {
      onChange(calculated.effectiveReturn)
    }
  }, [autoCalculate, calculated.effectiveReturn, onChange])

  // Check if manual value differs significantly (>20%)
  const manualDiffWarning = !autoCalculate &&
    Math.abs(value - calculated.effectiveReturn) / calculated.effectiveReturn > 0.2

  return (
    <div className="space-y-3">
      {/* Auto-calculate toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="auto-calc-return">Рассчитать автоматически</Label>
        <Switch
          id="auto-calc-return"
          checked={autoCalculate}
          onCheckedChange={onAutoCalculateChange}
        />
      </div>

      {/* Input field */}
      <div className="relative">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          disabled={autoCalculate}
          className={cn(autoCalculate && 'bg-muted')}
        />
        {autoCalculate && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            (авто)
          </span>
        )}
      </div>

      {/* Warning for significant manual difference */}
      {manualDiffWarning && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Значение отличается от расчётного на &gt;20%
          </AlertDescription>
        </Alert>
      )}

      {/* Breakdown section */}
      <ReturnLogisticsBreakdown result={calculated} />
    </div>
  )
}
```

### ReturnLogisticsBreakdown Component

```typescript
// src/components/custom/price-calculator/ReturnLogisticsBreakdown.tsx
interface ReturnLogisticsBreakdownProps {
  result: ReturnLogisticsResult
}

export function ReturnLogisticsBreakdown({ result }: ReturnLogisticsBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
        Показать расчёт
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Базовый возврат:</span>
          <span>{formatCurrency(result.baseReturn)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            С учётом КТР (×{result.ktrApplied.toFixed(2)}):
          </span>
          <span>{formatCurrency(result.returnWithKtr)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span className="text-muted-foreground">
            Эффективный (buyback {result.buybackPct}%):
          </span>
          <span>{formatCurrency(result.effectiveReturn)}</span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

### Form Integration Pattern

```typescript
// In PriceCalculatorForm.tsx - add return logistics calculator
const [autoCalcReturn, setAutoCalcReturn] = useState(true)

// Watch dependencies for return calculation
const forwardLogistics = watch('logistics_forward_rub')
const ktrCoefficient = watch('ktr_coefficient') // From Story 44.9
const buybackPct = watch('buyback_pct')

// Integrate ReturnLogisticsCalculator component
<FormField
  control={control}
  name="logistics_reverse_rub"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Логистика возврата, ₽</FormLabel>
      <ReturnLogisticsCalculator
        forwardLogistics={forwardLogistics || 0}
        ktrCoefficient={ktrCoefficient || 1.0}
        buybackPct={buybackPct || 98}
        value={field.value}
        onChange={field.onChange}
        autoCalculate={autoCalcReturn}
        onAutoCalculateChange={setAutoCalcReturn}
      />
      <FormMessage />
    </FormItem>
  )}
/>
```

### Invariants & Edge Cases

| Case | Handling |
|------|----------|
| Forward logistics = 0 | Return = 0, no КТР applied |
| КТР coefficient = 0 | Treat as 1.0 (no adjustment) |
| Buyback = 100% | Effective return = 0 |
| Buyback = 0% | Full return cost applied |
| Manual override active | Preserve user value, show warning if >20% diff |
| Negative values | Validation prevents (min: 0) |

---

## Observability

- **Logs**: Track auto-calculate vs manual override usage
- **Analytics**: Track when users override calculated values
- **Metrics**: Distribution of buyback percentages used

---

## Security

- **Input Validation**: All numeric inputs validated (min: 0)
- **XSS Prevention**: No user-generated HTML in breakdown display
- **State Isolation**: Component state isolated per calculation

---

## Accessibility (WCAG 2.1 AA)

- [ ] Toggle switch has associated label
- [ ] Breakdown content has proper heading structure
- [ ] Collapsible section announced to screen readers
- [ ] Numeric values formatted for screen readers
- [ ] Warning alerts have role="alert"
- [ ] Color contrast ≥4.5:1 for all text
- [ ] Focus visible on all interactive elements

---

## Test Scenarios

### Unit Tests (return-logistics-utils.ts)

| Test | Input | Expected Output |
|------|-------|-----------------|
| Base return equals forward | forward=100 | baseReturn=100 |
| КТР applied correctly | base=100, ktr=1.2 | returnWithKtr=120 |
| Buyback 100% = zero return | return=100, buyback=100 | effective=0 |
| Buyback 50% = half return | return=100, buyback=50 | effective=50 |
| Buyback 0% = full return | return=100, buyback=0 | effective=100 |
| Combined calculation | fwd=50, ktr=1.5, buyback=80 | eff=15 |

### Component Tests

| Test | Scenario | Expected |
|------|----------|----------|
| Auto-calculate ON | Change forward logistics | Return updates automatically |
| Auto-calculate OFF | Change forward logistics | Return unchanged |
| Toggle auto OFF | Switch to manual | Input becomes editable |
| Toggle auto ON | Switch back | Value recalculated |
| Warning display | Manual differs >20% | Warning shown |
| Breakdown expand | Click toggle | Shows 3-step breakdown |

---

## Dev Agent Record

### File List
| File | Change Type | Lines (est) | Description |
|------|-------------|-------------|-------------|
| `src/lib/return-logistics-utils.ts` | CREATE | ~60 | Calculation functions |
| `src/components/custom/price-calculator/ReturnLogisticsCalculator.tsx` | CREATE | ~90 | Auto-calc component |
| `src/components/custom/price-calculator/ReturnLogisticsBreakdown.tsx` | CREATE | ~50 | Breakdown display |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | UPDATE | +30 | Integrate return calc |
| `src/lib/__tests__/return-logistics-utils.test.ts` | CREATE | ~80 | Unit tests |

### Change Log
(To be filled during implementation)

### Review Follow-ups
(To be filled after code review)

---

## QA Results

**Reviewer**: (To be filled)
**Date**: (To be filled)
**Gate Decision**: (To be filled)

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Auto-calculate from forward | ⏳ | |
| AC2 | Apply КТР coefficient | ⏳ | |
| AC3 | Calculate effective with buyback | ⏳ | |
| AC4 | Breakdown display | ⏳ | |
| AC5 | Manual override option | ⏳ | |
| AC6 | Form integration | ⏳ | |

### Accessibility Check
| Check | Status | Evidence |
|-------|--------|----------|
| Toggle label | ⏳ | |
| Collapsible announcement | ⏳ | |
| Warning alerts | ⏳ | |
| Color contrast | ⏳ | |
| Focus management | ⏳ | |

---

**Last Updated**: 2026-01-19

# Story 44.10: Return Logistics Calculation

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 📋 Ready for Dev
**Priority**: P1 - IMPORTANT
**Effort**: 2 SP
**Depends On**: Story 44.8 (Logistics Tariff), Story 44.9 (Coefficients)

---

## User Story

**As a** Seller,
**I want** the return logistics cost to be auto-calculated from forward logistics with buyback percentage applied,
**So that** I get an accurate effective return cost without manual calculations.

**Non-goals**:
- Separate return logistics coefficient (WB uses same coefficient as forward)
- Backend API changes (frontend-only calculation)
- Return logistics tariff tables (uses forward logistics base)

---

## Background: WB Return Logistics (from Backend API Epic 43)

### Return Logistics Business Rules

1. **Base Return = Forward Logistics**: Same tariff structure
2. **Effective Return = Base × (100 - buyback_pct) / 100**
3. **Buyback**: Percentage of items NOT returned (customers keep the goods)

**Example Calculation:**
- Forward logistics: 72.50 ₽
- Buyback: 98% (typical WB value)
- Return rate: 100 - 98 = 2%
- **Effective return**: 72.50 × 0.02 = **1.45 ₽**

### Backend API Request (Story 43)

```json
{
  "logistics_forward_rub": 72.50,
  "buyback_pct": 98,
  // Backend calculates: logistics_reverse_effective = 72.50 × (1 - 0.98) = 1.45
}
```

### Backend API Response

```json
{
  "cost_breakdown": {
    "fixed_costs": {
      "logistics_forward": 72.50,
      "logistics_reverse_effective": 1.45,
      "logistics_total": 73.95
    }
  }
}
```

---

## Acceptance Criteria

### AC1: Auto-Calculate Return Logistics from Forward Logistics
- [ ] When `logistics_forward_rub` changes, auto-calculate base return logistics
- [ ] Formula: `base_return = logistics_forward_rub` (same tariff per WB docs)
- [ ] Update in real-time as forward logistics changes
- [ ] Show base return value: "Базовая обратная: X ₽"

### AC2: Calculate Effective Return Cost Based on Buyback
- [ ] Formula: `effective_return = base_return × (100 - buyback_pct) / 100`
- [ ] If buyback = 100%, effective return = 0 ₽
- [ ] If buyback = 98%, effective return = 2% of forward logistics
- [ ] If buyback = 0%, effective return = 100% of forward logistics
- [ ] Display final effective value prominently

### AC3: Return Logistics Breakdown Display
- [ ] Show 3-step breakdown:
  1. "Базовая обратная логистика: X ₽" (= forward logistics)
  2. "Buyback (выкуп): Y%" (percentage of items kept)
  3. "Эффективная обратная: Z ₽" (final effective cost)
- [ ] Collapsible breakdown section (collapsed by default)
- [ ] Breakdown updates in real-time

### AC4: Manual Override Option
- [ ] Toggle switch: "Рассчитать автоматически" (default: ON)
- [ ] When OFF, `logistics_reverse_rub` becomes editable
- [ ] Manual value persists until toggle switched back to auto
- [ ] Visual indicator when manual override is active
- [ ] Warning if manual value differs significantly (>50%) from calculated

### AC5: Form Integration
- [ ] Display effective return in form summary section
- [ ] Pass `logistics_reverse_rub = base_return` to API (not effective)
- [ ] Backend calculates effective based on buyback_pct
- [ ] Validate that base return ≥ 0
- [ ] Handle edge case: forward logistics = 0 (return = 0)

### AC6: UI Display Integration
- [ ] Show in cost breakdown summary:
  - "Логистика прямая: 72,50 ₽"
  - "Логистика обратная (эфф.): 1,45 ₽"
  - "Итого логистика: 73,95 ₽"
- [ ] Effective return shown in muted text if small (< 5 ₽)
- [ ] Color coding: effective return always shown as cost (red/neutral)

---

## API Contract (Backend Story 43)

### Request
```http
POST /v1/products/price-calculator
Authorization: Bearer {token}
X-Cabinet-Id: {cabinet_id}
Content-Type: application/json

{
  "target_margin_pct": 20,
  "cogs_rub": 1500,
  "logistics_forward_rub": 72.50,
  "logistics_reverse_rub": 72.50,  // Base return (same as forward)
  "buyback_pct": 98,
  "advertising_pct": 5,
  "storage_rub": 50
}
```

### Response
```json
{
  "cost_breakdown": {
    "fixed_costs": {
      "cogs": 1500.00,
      "logistics_forward": 72.50,
      "logistics_reverse_effective": 1.45,
      "logistics_total": 73.95,
      "storage": 50.00,
      "fixed_total": 1623.95
    }
  },
  "inputs_used": {
    "logistics_reverse_rub": 72.50,
    "buyback_pct": 98,
    "logistics_reverse_effective": 1.45
  }
}
```

---

## Context & References

- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Backend API**: `docs/request-backend/95-epic-43-price-calculator-api.md`
- **Story 44.8**: Logistics Tariff Calculation (forward logistics source)
- **Story 44.9**: Logistics Coefficients (coefficient applies to forward)
- **Story 44.2**: Input Form Component (buyback input)

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
```

### TypeScript Interfaces

```typescript
// src/lib/return-logistics-utils.ts

/**
 * Return logistics calculation result
 */
export interface ReturnLogisticsResult {
  /** Base return logistics (same as forward) */
  baseReturn: number
  /** Effective return after buyback adjustment */
  effectiveReturn: number
  /** Buyback percentage used */
  buybackPct: number
  /** Return rate (100 - buyback) */
  returnRatePct: number
  /** Calculation breakdown for display */
  breakdown: ReturnLogisticsBreakdown
}

export interface ReturnLogisticsBreakdown {
  baseReturnDisplay: string      // "72,50 ₽"
  buybackDisplay: string         // "98%"
  returnRateDisplay: string      // "2%"
  effectiveReturnDisplay: string // "1,45 ₽"
}
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
 * Calculate effective return cost after buyback adjustment
 * @param baseReturn - Base return logistics (= forward logistics)
 * @param buybackPct - Buyback percentage (0-100)
 * @returns Effective return cost (0 if buyback = 100%)
 */
export function calculateEffectiveReturn(
  baseReturn: number,
  buybackPct: number
): number {
  // Return rate = 100 - buyback %
  const returnRatePct = 100 - buybackPct
  const effectiveReturn = baseReturn * (returnRatePct / 100)
  return Math.round(effectiveReturn * 100) / 100
}

/**
 * Full return logistics calculation
 */
export function calculateReturnLogistics(
  forwardLogistics: number,
  buybackPct: number
): ReturnLogisticsResult {
  const baseReturn = calculateBaseReturnLogistics(forwardLogistics)
  const effectiveReturn = calculateEffectiveReturn(baseReturn, buybackPct)
  const returnRatePct = 100 - buybackPct

  return {
    baseReturn,
    effectiveReturn,
    buybackPct,
    returnRatePct,
    breakdown: createBreakdown(baseReturn, buybackPct, returnRatePct, effectiveReturn),
  }
}

function createBreakdown(
  baseReturn: number,
  buybackPct: number,
  returnRatePct: number,
  effectiveReturn: number
): ReturnLogisticsBreakdown {
  return {
    baseReturnDisplay: formatCurrency(baseReturn),
    buybackDisplay: `${buybackPct}%`,
    returnRateDisplay: `${returnRatePct}%`,
    effectiveReturnDisplay: formatCurrency(effectiveReturn),
  }
}

/**
 * Check if manual value differs significantly from calculated
 */
export function hasSignificantDifference(
  manualValue: number,
  calculatedValue: number,
  thresholdPct: number = 50
): boolean {
  if (calculatedValue === 0) return manualValue > 0
  const difference = Math.abs(manualValue - calculatedValue)
  const percentDiff = (difference / calculatedValue) * 100
  return percentDiff > thresholdPct
}
```

### Component Structure

```typescript
// src/components/custom/price-calculator/ReturnLogisticsCalculator.tsx

interface ReturnLogisticsCalculatorProps {
  /** Forward logistics cost */
  forwardLogistics: number
  /** Buyback percentage */
  buybackPct: number
  /** Current value in form (base return, NOT effective) */
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

export function ReturnLogisticsCalculator({
  forwardLogistics,
  buybackPct,
  value,
  onChange,
  autoCalculate,
  onAutoCalculateChange,
  disabled,
}: ReturnLogisticsCalculatorProps) {
  // Calculate values
  const result = useMemo(
    () => calculateReturnLogistics(forwardLogistics, buybackPct),
    [forwardLogistics, buybackPct]
  )

  // Auto-update when auto-calculate enabled
  useEffect(() => {
    if (autoCalculate && value !== result.baseReturn) {
      onChange(result.baseReturn)
    }
  }, [autoCalculate, result.baseReturn, value, onChange])

  // Check if manual value differs significantly (>50%)
  const manualDiffWarning = !autoCalculate &&
    hasSignificantDifference(value, result.baseReturn, 50)

  return (
    <div className="space-y-3">
      {/* Auto-calculate toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="auto-calc-return">Рассчитать автоматически</Label>
        <Switch
          id="auto-calc-return"
          checked={autoCalculate}
          onCheckedChange={onAutoCalculateChange}
          disabled={disabled}
        />
      </div>

      {/* Input field (base return) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Логистика обратная (базовая), ₽</Label>
          <AutoFillBadge source={autoCalculate ? 'auto' : 'manual'} />
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            value={value}
            onChange={(e) => {
              onChange(parseFloat(e.target.value) || 0)
              onAutoCalculateChange(false)
            }}
            disabled={disabled || autoCalculate}
            className={cn(autoCalculate && 'bg-muted')}
            min={0}
            step={0.01}
          />
          {!autoCalculate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onChange(result.baseReturn)
                onAutoCalculateChange(true)
              }}
              title="Восстановить расчётное значение"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Warning for significant manual difference */}
      {manualDiffWarning && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Значение значительно отличается от расчётного ({formatCurrency(result.baseReturn)})
          </AlertDescription>
        </Alert>
      )}

      {/* Effective return display */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">
          Эффективная обратная (с учётом buyback {buybackPct}%):
        </span>
        <span className="font-medium text-primary">
          {formatCurrency(result.effectiveReturn)}
        </span>
      </div>

      {/* Breakdown section */}
      <ReturnLogisticsBreakdown result={result} />
    </div>
  )
}
```

### Breakdown Component

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
      <CollapsibleContent className="mt-2 space-y-1 text-sm border-l-2 border-muted pl-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Базовая обратная логистика:</span>
          <span>{result.breakdown.baseReturnDisplay}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Buyback (выкуп):</span>
          <span>{result.breakdown.buybackDisplay}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Процент возврата:</span>
          <span>{result.breakdown.returnRateDisplay}</span>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between font-medium">
          <span className="text-muted-foreground">Эффективная обратная:</span>
          <span className="text-primary">{result.breakdown.effectiveReturnDisplay}</span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Логистика обратная                                   [?]    │
├─────────────────────────────────────────────────────────────┤
│ Рассчитать автоматически                       [========]   │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Логистика обратная (базовая), ₽     [Автозаполнено]   │   │
│ │ [    72.50    ]                              [↺]      │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ Эффективная обратная (с учётом buyback 98%):    1,45 ₽     │
│                                                             │
│ ▸ Показать расчёт                                           │
│   ├─ Базовая обратная логистика:           72,50 ₽         │
│   ├─ Buyback (выкуп):                      98%             │
│   ├─ Процент возврата:                     2%              │
│   ├──────────────────────────────────────────              │
│   └─ Эффективная обратная:                 1,45 ₽          │
└─────────────────────────────────────────────────────────────┘
```

---

## Invariants & Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Forward logistics = 0 | Base return = 0, effective = 0 |
| Buyback = 100% | Effective return = 0 ₽ |
| Buyback = 0% | Effective return = 100% of base |
| Buyback = 98% (typical) | Effective return = 2% of base |
| Manual override active | Preserve user value, show warning if >50% diff |
| Negative values | Validation prevents (min: 0) |
| Forward logistics changed | Recalculate base and effective return |

### Test Scenarios

| Forward (₽) | Buyback (%) | Base Return (₽) | Effective Return (₽) |
|-------------|-------------|-----------------|---------------------|
| 72.50 | 98 | 72.50 | 1.45 |
| 72.50 | 100 | 72.50 | 0.00 |
| 72.50 | 0 | 72.50 | 72.50 |
| 72.50 | 50 | 72.50 | 36.25 |
| 100.00 | 95 | 100.00 | 5.00 |
| 0.00 | 98 | 0.00 | 0.00 |

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

## Dev Agent Record

### File List
| File | Change Type | Lines (Est.) | Description |
|------|-------------|--------------|-------------|
| `src/lib/return-logistics-utils.ts` | CREATE | ~60 | Calculation functions |
| `src/components/custom/price-calculator/ReturnLogisticsCalculator.tsx` | CREATE | ~90 | Auto-calc component |
| `src/components/custom/price-calculator/ReturnLogisticsBreakdown.tsx` | CREATE | ~50 | Breakdown display |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | UPDATE | +30 | Integrate return calc |
| `src/lib/__tests__/return-logistics-utils.test.ts` | CREATE | ~80 | Unit tests |

### Change Log
_(To be filled during implementation)_

### Review Follow-ups
_(To be filled after code review)_

---

## Definition of Done

- [ ] All Acceptance Criteria verified (AC1-AC6)
- [ ] Components created with proper TypeScript types
- [ ] Calculation matches Backend formula exactly
- [ ] Auto-fill and manual override work correctly
- [ ] Breakdown displays correctly
- [ ] Unit tests written for return-logistics-utils.ts
- [ ] Component tests for ReturnLogisticsCalculator
- [ ] No ESLint errors
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Code review completed
- [ ] Documentation updated
- [ ] QA Gate passed

---

## QA Results

**Reviewer**: _(To be filled)_
**Date**: _(To be filled)_
**Gate Decision**: _(To be filled)_

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Auto-calculate from forward | ⏳ | |
| AC2 | Calculate effective with buyback | ⏳ | |
| AC3 | Breakdown display | ⏳ | |
| AC4 | Manual override option | ⏳ | |
| AC5 | Form integration | ⏳ | |
| AC6 | UI display integration | ⏳ | |

### Accessibility Check
| Check | Status | Evidence |
|-------|--------|----------|
| Toggle label | ⏳ | |
| Collapsible announcement | ⏳ | |
| Warning alerts | ⏳ | |
| Color contrast | ⏳ | |
| Focus management | ⏳ | |

---

**Created**: 2026-01-19
**Last Updated**: 2026-01-20

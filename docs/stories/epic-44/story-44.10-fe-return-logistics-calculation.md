# Story 44.10: Return Logistics Calculation

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 📋 Ready for Dev
**Priority**: P1 - IMPORTANT
**Effort**: 2 SP
**Depends On**: Story 44.8 (Logistics Tariff), Story 44.9 (Coefficients)

---

## ⚠️ CRITICAL: Reverse Logistics = MANUAL ONLY

**IMPORTANT NOTE FROM BACKEND TEAM**:

- **Forward logistics**: Auto-fill supported (when warehouse + volume/dimensions provided)
- **Reverse logistics**: MANUAL ONLY! User must manually enter `logistics_reverse_rub`
- **Cargo type classification affects input requirements**:
  - **MGT** (≤60cm): Normal logistics applies
  - **SGT** (≤120cm): Normal logistics applies
  - **KGT** (>120cm): Manual input REQUIRED + error displayed if not entered
- **Effective calculation**: Backend applies `reverse_effective = reverse × (1 - buyback_pct/100)`

---

## User Story

**As a** Seller,
**I want** to manually enter return logistics cost and see the effective return cost calculated with buyback percentage applied,
**So that** I understand the true logistics impact of returns adjusted for customer retention.

**Non-goals**:

- Auto-fill reverse logistics (must be entered manually by user)
- Separate return logistics coefficient (WB uses same coefficient as forward)
- Backend API changes (frontend displays effective, backend calculates it)

---

## Background: WB Return Logistics (from Backend API Epic 43)

### Return Logistics Business Rules

1. **Reverse Logistics = MANUAL ENTRY**: User must manually enter `logistics_reverse_rub` in form
   - No auto-fill from forward logistics
   - Required field for cost breakdown
   - Cargo type classification affects validation (see below)

2. **Effective Return Formula** (Backend calculates):

   ```
   reverse_effective = reverse × (1 - buyback_pct / 100)
   ```

   Where:
   - `reverse` = User-entered return logistics cost (₽)
   - `buyback_pct` = Percentage of items NOT returned (customer retention)
   - `1 - buyback_pct/100` = Return rate as decimal

3. **Buyback Percentage**: Percentage of items NOT returned (customers keep the goods)
   - 100% buyback = No returns expected, effective reverse = 0
   - 98% buyback (typical) = 2% return rate, effective reverse = 2% of entered reverse cost
   - 0% buyback = All items returned, effective reverse = 100% of entered reverse cost

### Cargo Type Classification (Affects Reverse Logistics Input)

| Classification | Size Limit | Reverse Logistics     | Notes                                    |
| -------------- | ---------- | --------------------- | ---------------------------------------- |
| **MGT**        | ≤60cm      | Manual input accepted | Standard reverse logistics               |
| **SGT**        | ≤120cm     | Manual input accepted | Standard reverse logistics               |
| **KGT**        | >120cm     | **REQUIRED ENTRY**    | Must enter value + show error if missing |

### Example Calculations

**Example 1: Typical Product (SGT, Buyback 98%)**

- User enters reverse logistics: 72.50 ₽
- Buyback: 98% (customers keep items)
- Return rate: 100 - 98 = 2%
- **Effective return**: 72.50 × (1 - 0.98) = 72.50 × 0.02 = **1.45 ₽**

**Example 2: High-Value Item (KGT, Buyback 95%)**

- User enters reverse logistics: 150.00 ₽ (required for KGT)
- Buyback: 95% (customers keep items)
- Return rate: 100 - 95 = 5%
- **Effective return**: 150.00 × (1 - 0.95) = 150.00 × 0.05 = **7.50 ₽**

**Example 3: High Return Rate (MGT, Buyback 70%)**

- User enters reverse logistics: 45.00 ₽
- Buyback: 70% (customers keep items)
- Return rate: 100 - 70 = 30%
- **Effective return**: 45.00 × (1 - 0.70) = 45.00 × 0.30 = **13.50 ₽**

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

### AC1: Manual Entry of Return Logistics Cost

- [ ] Input field: "Логистика обратная (обязательно), ₽"
- [ ] Required field - form cannot submit without value
- [ ] Input accepts decimal values (0.01 minimum)
- [ ] Validation: value must be ≥ 0
- [ ] Clear label indicating MANUAL ENTRY required
- [ ] Help text: "Введите стоимость доставки возврата товара"

### AC2: KGT Cargo Type Validation

- [ ] If cargo type = KGT (>120cm), add **required** indicator
- [ ] If KGT without value entered, show error: "Для карго KGT требуется ввести стоимость возврата"
- [ ] Validation runs before form submission
- [ ] Error prevents API request
- [ ] MGT/SGT types: field is required but no special validation

### AC3: Effective Return Cost Calculation

- [ ] Formula: `effective_return = logistics_reverse_rub × (1 - buyback_pct / 100)`
- [ ] If buyback = 100%, effective return = 0 ₽
- [ ] If buyback = 98%, effective return = 2% of entered reverse cost
- [ ] If buyback = 0%, effective return = 100% of entered reverse cost
- [ ] Display final effective value prominently
- [ ] Update in real-time when either reverse cost or buyback changes
- [ ] Backend performs actual calculation; frontend shows preview only

### AC4: Return Logistics Breakdown Display

- [ ] Show 4-step breakdown:
  1. "Стоимость возврата (введено): X ₽" (user entry)
  2. "Buyback (выкуп): Y%" (percentage of items kept)
  3. "Процент возврата: Z%" (100 - buyback)
  4. "Эффективная обратная: W ₽" (final effective cost)
- [ ] Collapsible breakdown section (collapsed by default)
- [ ] Breakdown updates in real-time as values change
- [ ] Show calculation formula inline for transparency

### AC5: Form Integration

- [ ] Display effective return in form summary section
- [ ] Pass `logistics_reverse_rub = <user_entered_value>` to API
- [ ] Backend calculates `logistics_reverse_effective` based on buyback_pct
- [ ] Validate that return ≥ 0
- [ ] Handle edge case: reverse = 0 (effective = 0)
- [ ] Proper error handling for invalid entries

### AC6: UI Display Integration

- [ ] Show in cost breakdown summary:
  - "Логистика прямая: 72,50 ₽"
  - "Логистика обратная (эфф.): 1,45 ₽"
  - "Итого логистика: 73,95 ₽"
- [ ] Effective return shown with appropriate styling
- [ ] Input field clearly labeled as REQUIRED
- [ ] Help icon with explanation: "Стоимость доставки товара в обратном направлении (от покупателя к Wildberries)"

### AC7: Buyback Formula Documentation

- [ ] Display formula clearly in breakdown: `effective = reverse × (1 - buyback% ÷ 100)`
- [ ] Example shown: "72,50 × (1 - 0,98) = 1,45"
- [ ] Help text explains buyback: "Процент товаров, оставленных покупателями"
- [ ] Visual separator between input and calculation sections

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
  /** User-entered reverse logistics cost (₽) - MANUAL ENTRY */
  reverseLogistics: number
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
  reverseLogisticsDisplay: string  // "72,50 ₽" (user-entered)
  buybackDisplay: string            // "98%"
  returnRateDisplay: string         // "2%"
  effectiveReturnDisplay: string    // "1,45 ₽" (backend-calculated)
  formulaDisplay: string            // "72,50 × (1 - 0,98) = 1,45 ₽"
}
```

### Calculation Functions

```typescript
// src/lib/return-logistics-utils.ts

/**
 * Calculate effective return cost after buyback adjustment
 * IMPORTANT: Reverse logistics is MANUAL ENTRY - this function shows preview only
 * @param reverseLogistics - User-entered return logistics cost (₽)
 * @param buybackPct - Buyback percentage (0-100)
 * @returns Effective return cost (0 if buyback = 100%)
 *
 * Formula: effective = reverse × (1 - buyback_pct / 100)
 */
export function calculateEffectiveReturn(
  reverseLogistics: number,
  buybackPct: number
): number {
  // Return rate = 100 - buyback %
  const returnRatePct = 100 - buybackPct
  const effectiveReturn = reverseLogistics * (returnRatePct / 100)
  return Math.round(effectiveReturn * 100) / 100
}

/**
 * Full return logistics calculation
 */
export function calculateReturnLogistics(
  reverseLogistics: number,
  buybackPct: number
): ReturnLogisticsResult {
  const effectiveReturn = calculateEffectiveReturn(reverseLogistics, buybackPct)
  const returnRatePct = 100 - buybackPct

  return {
    reverseLogistics,        // User-entered value (not auto-calculated)
    effectiveReturn,         // Backend-calculated value
    buybackPct,
    returnRatePct,
    breakdown: createBreakdown(reverseLogistics, buybackPct, returnRatePct, effectiveReturn),
  }
}

/**
 * Validate reverse logistics entry for KGT cargo type
 * @param cargoType - Cargo classification (MGT, SGT, or KGT)
 * @param reverseLogistics - Entered value in ₽
 * @returns { valid: boolean, error?: string }
 */
export function validateReverseLogistics(
  cargoType: 'MGT' | 'SGT' | 'KGT',
  reverseLogistics: number
): { valid: boolean; error?: string } {
  if (reverseLogistics < 0) {
    return { valid: false, error: 'Стоимость возврата не может быть отрицательной' }
  }

  if (cargoType === 'KGT' && reverseLogistics === 0) {
    return {
      valid: false,
      error: 'Для карго KGT (>120см) требуется ввести стоимость возврата'
    }
  }

  return { valid: true }
}

function createBreakdown(
  reverseLogistics: number,
  buybackPct: number,
  returnRatePct: number,
  effectiveReturn: number
): ReturnLogisticsBreakdown {
  const reverseDisplay = formatCurrency(reverseLogistics)
  const effectiveDisplay = formatCurrency(effectiveReturn)
  const formulaDisplay = `${reverseDisplay} × (1 - ${(buybackPct / 100).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}) = ${effectiveDisplay}`

  return {
    reverseLogisticsDisplay: reverseDisplay,
    buybackDisplay: `${buybackPct}%`,
    returnRateDisplay: `${returnRatePct}%`,
    effectiveReturnDisplay: effectiveDisplay,
    formulaDisplay,
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
  /** Buyback percentage */
  buybackPct: number
  /** Cargo type classification (MGT, SGT, KGT) */
  cargoType: 'MGT' | 'SGT' | 'KGT'
  /** Current value in form (user-entered reverse logistics cost) */
  value: number
  /** Change handler */
  onChange: (value: number) => void
  /** Disabled state */
  disabled?: boolean
  /** Error message (from validation) */
  error?: string
}

export function ReturnLogisticsCalculator({
  buybackPct,
  cargoType,
  value,
  onChange,
  disabled,
  error,
}: ReturnLogisticsCalculatorProps) {
  // Calculate effective return for display (preview only)
  const result = useMemo(
    () => calculateReturnLogistics(value, buybackPct),
    [value, buybackPct]
  )

  // Validate for KGT cargo type
  const validation = useMemo(
    () => validateReverseLogistics(cargoType, value),
    [cargoType, value]
  )

  return (
    <div className="space-y-3">
      {/* Input field (manual entry required) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="reverse-logistics">
            Логистика обратная{cargoType === 'KGT' ? ' (обязательно)' : ''}, ₽
          </Label>
          <span className="text-xs text-muted-foreground">РУЧНОЙ ВВОД</span>
        </div>
        <Input
          id="reverse-logistics"
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          disabled={disabled}
          min={0}
          step={0.01}
          placeholder="0,00"
          className={cn(error && 'border-destructive')}
        />
        <p className="text-xs text-muted-foreground">
          {cargoType === 'KGT'
            ? 'Карго KGT (>120см): обязателен ввод стоимости возврата'
            : 'Введите стоимость доставки товара в обратном направлении'}
        </p>
      </div>

      {/* Validation error */}
      {error || (cargoType === 'KGT' && !validation.valid) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || validation.error}
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
        Показать расчёт эффективной стоимости
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2 text-sm border-l-2 border-muted pl-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Стоимость возврата (введено):</span>
          <span>{result.breakdown.reverseLogisticsDisplay}</span>
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

        <div className="space-y-2 bg-muted/30 p-2 rounded">
          <p className="text-xs text-muted-foreground">Формула расчёта:</p>
          <code className="text-xs font-mono">
            {result.breakdown.formulaDisplay}
          </code>
        </div>

        <Separator className="my-2" />

        <div className="flex justify-between font-medium bg-primary/5 p-2 rounded">
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
│ Логистика обратная (обязательно), ₽        РУЧНОЙ ВВОД      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ [    72.50    ]                                      │   │
│ │ Карго KGT (>120см): обязателен ввод стоимости       │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ Эффективная обратная (с учётом buyback 98%):    1,45 ₽     │
│                                                             │
│ ▸ Показать расчёт эффективной стоимости                    │
│   ├─ Стоимость возврата (введено):         72,50 ₽         │
│   ├─ Buyback (выкуп):                      98%             │
│   ├─ Процент возврата:                     2%              │
│   │                                                         │
│   │ Формула расчёта:                                       │
│   │ 72,50 × (1 - 0,98) = 1,45 ₽                           │
│   │                                                         │
│   ├──────────────────────────────────────────              │
│   └─ Эффективная обратная:                 1,45 ₽          │
└─────────────────────────────────────────────────────────────┘
```

---

## Invariants & Edge Cases

| Scenario                  | Expected Behavior                                       |
| ------------------------- | ------------------------------------------------------- |
| Reverse logistics = 0     | User must enter value (required field)                  |
| Buyback = 100%            | Effective return = 0 ₽                                  |
| Buyback = 0%              | Effective return = 100% of entered reverse              |
| Buyback = 98% (typical)   | Effective return = 2% of entered reverse                |
| Cargo type = KGT          | Error if reverse logistics not entered (validation)     |
| Cargo type = MGT/SGT      | Reverse logistics required but no special validation    |
| Negative values           | Validation prevents (min: 0)                            |
| Reverse logistics changed | Recalculate effective return immediately                |
| Empty field on KGT        | Error shown: "Для карго KGT (>120см) требуется ввод..." |

### Test Scenarios

| Reverse (₽) | Buyback (%) | Cargo Type | Effective Return (₽) | Status                        |
| ----------- | ----------- | ---------- | -------------------- | ----------------------------- |
| 72.50       | 98          | SGT        | 1.45                 | ✅ Valid                      |
| 72.50       | 100         | MGT        | 0.00                 | ✅ Valid                      |
| 72.50       | 0           | MGT        | 72.50                | ✅ Valid                      |
| 72.50       | 50          | SGT        | 36.25                | ✅ Valid                      |
| 150.00      | 95          | KGT        | 7.50                 | ✅ Valid (KGT required)       |
| 0           | 98          | KGT        | 0.00                 | ❌ Error (KGT requires entry) |
| -5.00       | 98          | MGT        | -                    | ❌ Invalid (negative)         |

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

| File                                                                   | Change Type | Lines (Est.) | Description           |
| ---------------------------------------------------------------------- | ----------- | ------------ | --------------------- |
| `src/lib/return-logistics-utils.ts`                                    | CREATE      | ~60          | Calculation functions |
| `src/components/custom/price-calculator/ReturnLogisticsCalculator.tsx` | CREATE      | ~90          | Auto-calc component   |
| `src/components/custom/price-calculator/ReturnLogisticsBreakdown.tsx`  | CREATE      | ~50          | Breakdown display     |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx`       | UPDATE      | +30          | Integrate return calc |
| `src/lib/__tests__/return-logistics-utils.test.ts`                     | CREATE      | ~80          | Unit tests            |

### Change Log

_(To be filled during implementation)_

### Review Follow-ups

_(To be filled after code review)_

---

## Definition of Done

- [ ] All Acceptance Criteria verified (AC1-AC7)
- [ ] MANUAL ONLY input field implemented (no auto-fill from forward)
- [ ] KGT cargo type validation implemented with error messages
- [ ] Effective return calculation matches Backend formula exactly
- [ ] Breakdown displays formula: `reverse × (1 - buyback% ÷ 100)`
- [ ] Component displays effective return as preview (backend calculates actual)
- [ ] Unit tests written for return-logistics-utils.ts
- [ ] Unit tests written for KGT validation function
- [ ] Component tests for ReturnLogisticsCalculator
- [ ] No ESLint errors
- [ ] File size ≤200 lines (split components if needed)
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

| AC  | Requirement                      | Status | Evidence |
| --- | -------------------------------- | ------ | -------- |
| AC1 | Auto-calculate from forward      | ⏳     |          |
| AC2 | Calculate effective with buyback | ⏳     |          |
| AC3 | Breakdown display                | ⏳     |          |
| AC4 | Manual override option           | ⏳     |          |
| AC5 | Form integration                 | ⏳     |          |
| AC6 | UI display integration           | ⏳     |          |

### Accessibility Check

| Check                    | Status | Evidence |
| ------------------------ | ------ | -------- |
| Toggle label             | ⏳     |          |
| Collapsible announcement | ⏳     |          |
| Warning alerts           | ⏳     |          |
| Color contrast           | ⏳     |          |
| Focus management         | ⏳     |          |

---

**Created**: 2026-01-19
**Last Updated**: 2026-01-24
**Updated By**: Backend Team Clarifications - MANUAL ONLY Reverse Logistics
**Status**: Updated with backend logistics requirements (KGT validation, buyback formula)

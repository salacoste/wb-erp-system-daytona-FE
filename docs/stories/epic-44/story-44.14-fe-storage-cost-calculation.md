# Story 44.14: Storage Cost Calculation

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: Blocked (Backend)
**Priority**: P1 - IMPORTANT
**Effort**: 2 SP
**Depends On**: Story 44.7 (Volume), Story 44.13 (Storage Tariffs), Request #98 (Backend API)

---

## User Story

**As a** Seller,
**I want** to calculate storage costs based on product volume, warehouse tariffs, and estimated storage duration,
**So that** I can accurately factor storage expenses into my price calculations and avoid underestimating costs for slow-moving inventory.

**Non-goals**:
- Real-time storage tariff fetching from WB API (depends on Request #98)
- Historical storage cost analysis
- Storage optimization recommendations
- Automatic storage duration prediction

---

## Backend Dependency

**Request #98**: Warehouses & Tariffs Coefficients API
**Status**: Pending Backend Response

> "Запрос отправлен команде backend, ожидаем уточнения по ряду вопросов."

**Blocking Questions**:
1. Caching TTL for storage tariffs
2. Coefficient normalization (string "125" -> decimal 1.25)
3. FBS vs FBO storage tariff differentiation

**Required API Response** (from Request #98):
```json
{
  "storage": {
    "coefficient": 1.0,
    "base_per_day_rub": 0.07,
    "per_liter_per_day_rub": 0.05
  }
}
```

---

## WB Storage Business Rules

### Key Principles (from official WB documentation)

1. **Tariff Lock**: Storage tariff is fixed at the moment of delivery to warehouse
   - Even after returns, the original tariff applies
   - Tariff depends on warehouse selected at delivery

2. **Volume-Based Pricing**:
   - Cost calculated per liter of product volume
   - First liter has base rate, additional liters have per-liter rate

3. **Coefficient Application**:
   - Storage coefficient varies by warehouse
   - Applied as multiplier to base storage cost

### Storage Cost Formulas

```
# Daily storage cost
daily_storage = (base_per_day + (volume - 1) * per_liter_per_day) * storage_coefficient

# Total storage cost for period
total_storage = daily_storage * days_in_storage

# Where:
#   base_per_day = First liter base rate (e.g., 0.07 RUB/day)
#   per_liter_per_day = Additional liter rate (e.g., 0.05 RUB/day)
#   volume = Product volume in liters (from Story 44.7)
#   storage_coefficient = Warehouse coefficient (from Story 44.13)
#   days_in_storage = User input (default: 14 days)
```

**Example Calculation**:
- Volume: 3.0 liters
- Base rate: 0.07 RUB/day
- Per-liter rate: 0.05 RUB/day
- Coefficient: 1.0
- Days: 14

```
daily = (0.07 + (3.0 - 1) * 0.05) * 1.0 = 0.17 RUB/day
total = 0.17 * 14 = 2.38 RUB
```

---

## Acceptance Criteria

### AC1: Storage Days Input Field
- [ ] Add numeric input "Срок хранения (дней)" (Storage duration in days)
- [ ] Default value: 14 days (typical WB inventory turnover)
- [ ] Minimum: 1 day
- [ ] Maximum: 365 days (1 year)
- [ ] Step: 1 (whole days only)
- [ ] Quick presets: 7, 14, 30, 60, 90 days (clickable chips)

### AC2: Daily Storage Cost Calculation
- [ ] Calculate daily storage cost per unit using WB formula
- [ ] Display daily rate: "X,XX ₽/день" (X.XX RUB/day)
- [ ] Update in real-time as volume or coefficient changes
- [ ] Show "0,00 ₽/день" when volume is 0

### AC3: Total Storage Cost Calculation
- [ ] Calculate total storage: `daily_cost * days`
- [ ] Display prominently: "Итого хранение: X,XX ₽" (Total storage: X.XX RUB)
- [ ] Update in real-time as any input changes
- [ ] Auto-fill `storage_rub` field in main calculator form

### AC4: Calculation Breakdown Display
- [ ] Show expandable breakdown section
- [ ] Display 3-step calculation:
  1. "Базовая ставка: X,XX ₽/день" (Base: first liter rate)
  2. "Доп. литры (Y л): Z,ZZ ₽/день" (Additional liters rate)
  3. "Коэффициент склада: ×K" (Warehouse coefficient)
- [ ] Show final: "Итого за период (N дней): X,XX ₽"

### AC5: Long Storage Warning
- [ ] Show warning alert when storage > 30 days
- [ ] Warning text: "Хранение более 30 дней значительно увеличивает расходы. Рассмотрите оптимизацию запасов."
- [ ] Warning severity: amber/yellow
- [ ] Critical warning when storage > 60 days (red)

### AC6: Form Integration
- [ ] Auto-fill `storage_rub` field in PriceCalculatorForm
- [ ] Pass calculated storage cost to API request
- [ ] Validate storage_rub >= 0
- [ ] Handle edge case: missing tariff data (show manual input option)

### AC7: Fallback Mode (While Backend Pending)
- [ ] If tariff API unavailable, show manual input fields:
  - "Базовая ставка (₽/день)" (Base rate per day)
  - "Ставка за литр (₽/день/л)" (Per-liter rate per day)
- [ ] Default manual values: base=0.07, per_liter=0.05 (common WB rates)
- [ ] Note: "Введите тарифы вручную или дождитесь обновления API"

---

## Context & References

- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Story 44.7**: `docs/stories/epic-44/story-44.7-fe-dimension-volume-calculation.md` (Volume input)
- **Story 44.13**: Storage Tariffs Auto-fill (depends on Request #98)
- **Request #98**: `docs/request-backend/98-warehouses-tariffs-coefficients-api.md`
- **Backend Response Draft**: `docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE-DRAFT.md`
- **SDK Reference**: [`SDK-WAREHOUSES-TARIFFS-REFERENCE.md`](./SDK-WAREHOUSES-TARIFFS-REFERENCE.md) — Full SDK types, transformations, formulas
- **Implementation Roadmap**: [`PHASE-3-IMPLEMENTATION-ROADMAP.md`](./PHASE-3-IMPLEMENTATION-ROADMAP.md)
- **WB Documentation**: [Стоимость хранения](https://seller.wildberries.ru/instructions/ru/ru/material/logistics-acceptance-warehouse-storage-costs)

---

## Implementation Notes

### File Structure

```
src/
├── components/
│   └── custom/
│       └── price-calculator/
│           ├── StorageCostCalculator.tsx        # CREATE - Main storage calculator
│           ├── StorageDaysInput.tsx             # CREATE - Days input with presets
│           ├── StorageCostBreakdown.tsx         # CREATE - Breakdown display
│           └── PriceCalculatorForm.tsx          # UPDATE - Integrate storage calc
├── lib/
│   └── storage-cost-utils.ts                    # CREATE - Calculation functions
└── hooks/
    └── useStorageCost.ts                        # CREATE - State management hook
```

### Type Definitions

```typescript
// src/types/price-calculator.ts - Add storage types

export interface StorageTariff {
  /** First liter base rate per day (RUB) */
  base_per_day: number
  /** Additional liter rate per day (RUB) */
  per_liter_per_day: number
  /** Warehouse storage coefficient */
  coefficient: number
}

export interface StorageCostResult {
  /** Daily storage cost per unit (RUB) */
  daily_cost: number
  /** Total storage cost for period (RUB) */
  total_cost: number
  /** Number of storage days */
  days: number
  /** Volume used in calculation (liters) */
  volume_liters: number
  /** Tariff used */
  tariff: StorageTariff
}

export interface StorageCostInputs {
  /** Product volume in liters */
  volume_liters: number
  /** Number of storage days */
  days: number
  /** Storage tariff (from API or manual) */
  tariff: StorageTariff
}
```

### Calculation Functions

```typescript
// src/lib/storage-cost-utils.ts

import type { StorageTariff, StorageCostResult, StorageCostInputs } from '@/types/price-calculator'

/**
 * Default WB storage tariffs (used as fallback)
 */
export const DEFAULT_STORAGE_TARIFF: StorageTariff = {
  base_per_day: 0.07,
  per_liter_per_day: 0.05,
  coefficient: 1.0,
}

/**
 * Calculate daily storage cost per unit
 * Formula: (base_per_day + (volume - 1) * per_liter_per_day) * coefficient
 */
export function calculateDailyStorageCost(
  volumeLiters: number,
  tariff: StorageTariff
): number {
  if (volumeLiters <= 0) return 0

  const additionalLiters = Math.max(0, volumeLiters - 1)
  const baseCost = tariff.base_per_day + additionalLiters * tariff.per_liter_per_day
  return baseCost * tariff.coefficient
}

/**
 * Calculate total storage cost for a period
 */
export function calculateTotalStorageCost(
  volumeLiters: number,
  days: number,
  tariff: StorageTariff
): number {
  const dailyCost = calculateDailyStorageCost(volumeLiters, tariff)
  return dailyCost * days
}

/**
 * Full storage cost calculation with breakdown
 */
export function calculateStorageCost(inputs: StorageCostInputs): StorageCostResult {
  const dailyCost = calculateDailyStorageCost(inputs.volume_liters, inputs.tariff)
  const totalCost = dailyCost * inputs.days

  return {
    daily_cost: dailyCost,
    total_cost: totalCost,
    days: inputs.days,
    volume_liters: inputs.volume_liters,
    tariff: inputs.tariff,
  }
}

/**
 * Get storage warning level based on days
 */
export function getStorageWarningLevel(days: number): 'none' | 'warning' | 'critical' {
  if (days > 60) return 'critical'
  if (days > 30) return 'warning'
  return 'none'
}

/**
 * Storage days presets for quick selection
 */
export const STORAGE_DAYS_PRESETS = [7, 14, 30, 60, 90] as const
```

### Component Structure

```typescript
// src/components/custom/price-calculator/StorageCostCalculator.tsx

interface StorageCostCalculatorProps {
  /** Product volume in liters (from Story 44.7) */
  volumeLiters: number
  /** Storage tariff (from Story 44.13 or manual) */
  tariff: StorageTariff | null
  /** Current storage days value */
  days: number
  /** Storage days change handler */
  onDaysChange: (days: number) => void
  /** Calculated storage cost */
  value: number
  /** Storage cost change handler (for auto-fill) */
  onChange: (value: number) => void
  /** Disable all inputs */
  disabled?: boolean
}

export function StorageCostCalculator({
  volumeLiters,
  tariff,
  days,
  onDaysChange,
  value,
  onChange,
  disabled,
}: StorageCostCalculatorProps) {
  // Use default tariff if API tariff not available
  const effectiveTariff = tariff ?? DEFAULT_STORAGE_TARIFF
  const isUsingFallback = tariff === null

  // Calculate storage cost
  const result = useMemo(
    () => calculateStorageCost({
      volume_liters: volumeLiters,
      days,
      tariff: effectiveTariff,
    }),
    [volumeLiters, days, effectiveTariff]
  )

  // Auto-update parent form value
  useEffect(() => {
    onChange(result.total_cost)
  }, [result.total_cost, onChange])

  // Warning level
  const warningLevel = getStorageWarningLevel(days)

  return (
    <div className="space-y-4">
      {/* Fallback notice */}
      {isUsingFallback && (
        <Alert variant="info">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Используются стандартные тарифы. Для точного расчёта выберите склад.
          </AlertDescription>
        </Alert>
      )}

      {/* Days input with presets */}
      <StorageDaysInput
        value={days}
        onChange={onDaysChange}
        disabled={disabled}
      />

      {/* Cost display */}
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">Стоимость хранения/день:</span>
        <span className="font-medium">{formatCurrency(result.daily_cost)}/день</span>
      </div>

      <div className="flex justify-between items-center text-lg">
        <span className="font-medium">Итого хранение:</span>
        <span className="font-bold text-primary">
          {formatCurrency(result.total_cost)}
        </span>
      </div>

      {/* Warning for long storage */}
      {warningLevel === 'warning' && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Хранение более 30 дней значительно увеличивает расходы. Рассмотрите оптимизацию запасов.
          </AlertDescription>
        </Alert>
      )}

      {warningLevel === 'critical' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Хранение более 60 дней: высокие расходы! Рекомендуем пересмотреть объём поставки.
          </AlertDescription>
        </Alert>
      )}

      {/* Calculation breakdown */}
      <StorageCostBreakdown result={result} />
    </div>
  )
}
```

### Storage Days Input Component

```typescript
// src/components/custom/price-calculator/StorageDaysInput.tsx

interface StorageDaysInputProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function StorageDaysInput({ value, onChange, disabled }: StorageDaysInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="storage-days">Срок хранения (дней)</Label>

      {/* Preset chips */}
      <div className="flex gap-2 flex-wrap">
        {STORAGE_DAYS_PRESETS.map((preset) => (
          <Button
            key={preset}
            variant={value === preset ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(preset)}
            disabled={disabled}
            type="button"
          >
            {preset}
          </Button>
        ))}
      </div>

      {/* Custom input */}
      <Input
        id="storage-days"
        type="number"
        min={1}
        max={365}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 14)}
        disabled={disabled}
        className="w-32"
      />
    </div>
  )
}
```

### Breakdown Component

```typescript
// src/components/custom/price-calculator/StorageCostBreakdown.tsx

interface StorageCostBreakdownProps {
  result: StorageCostResult
}

export function StorageCostBreakdown({ result }: StorageCostBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const additionalLiters = Math.max(0, result.volume_liters - 1)
  const baseCost = result.tariff.base_per_day
  const additionalCost = additionalLiters * result.tariff.per_liter_per_day

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
        Показать расчёт
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2 space-y-1 text-sm border-l-2 border-muted pl-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Базовая ставка (1 л):</span>
          <span>{formatCurrency(baseCost)}/день</span>
        </div>

        {additionalLiters > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Доп. литры ({additionalLiters.toFixed(1)} л):
            </span>
            <span>{formatCurrency(additionalCost)}/день</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Коэффициент склада:
          </span>
          <span>×{result.tariff.coefficient.toFixed(2)}</span>
        </div>

        <Separator className="my-2" />

        <div className="flex justify-between font-medium">
          <span className="text-muted-foreground">Итого/день:</span>
          <span>{formatCurrency(result.daily_cost)}</span>
        </div>

        <div className="flex justify-between font-medium">
          <span className="text-muted-foreground">
            За {result.days} дней:
          </span>
          <span className="text-primary">{formatCurrency(result.total_cost)}</span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Расчёт хранения                                      [?]    │
├─────────────────────────────────────────────────────────────┤
│ ℹ️ Используются стандартные тарифы. Выберите склад.         │
├─────────────────────────────────────────────────────────────┤
│ Срок хранения (дней)                                        │
│ [7] [14] [30] [60] [90]     Своё: [_14_]                   │
│                                                             │
│ Объём товара:                              3,00 л           │
│ Стоимость хранения/день:                   0,17 ₽/день      │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Итого хранение:                          2,38 ₽         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ⚠️ Хранение более 30 дней значительно увеличивает расходы.  │
│                                                             │
│ ▸ Показать расчёт                                           │
│   ├─ Базовая ставка (1 л):           0,07 ₽/день            │
│   ├─ Доп. литры (2.0 л):             0,10 ₽/день            │
│   ├─ Коэффициент склада:             ×1.00                  │
│   ├──────────────────────────────────────────               │
│   ├─ Итого/день:                     0,17 ₽                 │
│   └─ За 14 дней:                     2,38 ₽                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Invariants & Edge Cases

| Case | Handling |
|------|----------|
| Volume = 0 | Storage cost = 0, show "Введите габариты товара" |
| Days = 0 | Treat as 1 day minimum |
| Days > 365 | Show validation error, cap at 365 |
| Tariff API unavailable | Use DEFAULT_STORAGE_TARIFF fallback |
| Coefficient = 0 | Treat as 1.0 (no adjustment) |
| Very large volume (>100L) | Allow calculation, consider warning |
| Negative inputs | Validation prevents (min: 0/1) |

---

## Observability

- **Analytics**: Track storage days distribution, identify common patterns
- **Metrics**: Average storage days selected, warning display frequency
- **Logs**: Log when fallback tariff used (backend API unavailable indicator)

---

## Security

- **Input Validation**: All numeric inputs validated (min/max ranges)
- **XSS Prevention**: No user-generated HTML in breakdown display
- **State Isolation**: Component state isolated per calculation

---

## Accessibility (WCAG 2.1 AA)

- [ ] Storage days input has associated label
- [ ] Preset buttons have aria-pressed state
- [ ] Warning alerts have role="alert" and aria-live="polite"
- [ ] Collapsible section announced to screen readers
- [ ] Color contrast >= 4.5:1 for all text
- [ ] Focus visible on all interactive elements
- [ ] Touch targets >= 44x44px for preset buttons

---

## Test Scenarios

### Unit Tests (storage-cost-utils.ts)

| Test | Input | Expected Output |
|------|-------|-----------------|
| Daily cost - 1 liter | vol=1, base=0.07, per_liter=0.05, coef=1.0 | daily=0.07 |
| Daily cost - 3 liters | vol=3, base=0.07, per_liter=0.05, coef=1.0 | daily=0.17 |
| Daily cost with coefficient | vol=2, base=0.07, per_liter=0.05, coef=1.5 | daily=0.18 |
| Total cost 14 days | vol=3, days=14, daily=0.17 | total=2.38 |
| Volume = 0 | vol=0 | daily=0, total=0 |
| Warning level 7 days | days=7 | 'none' |
| Warning level 31 days | days=31 | 'warning' |
| Warning level 61 days | days=61 | 'critical' |

### Component Tests

| Test | Scenario | Expected |
|------|----------|----------|
| Default render | Mount with default props | Shows 14 days, calculates cost |
| Preset selection | Click "30" preset | Days updates to 30, cost recalculates |
| Custom input | Enter 45 in input | Days updates, warning shown |
| Fallback notice | tariff=null | Shows info alert about fallback |
| Warning display | days=35 | Shows amber warning |
| Critical warning | days=70 | Shows red critical warning |
| Breakdown expand | Click "Показать расчёт" | Shows 3-step breakdown |
| Form integration | Change days | storage_rub field updates |

---

## Dev Agent Record

### File List
| File | Change Type | Lines (Est.) | Description |
|------|-------------|--------------|-------------|
| `src/lib/storage-cost-utils.ts` | CREATE | ~80 | Storage calculation functions |
| `src/types/price-calculator.ts` | UPDATE | +20 | Add storage types |
| `src/components/custom/price-calculator/StorageCostCalculator.tsx` | CREATE | ~100 | Main storage component |
| `src/components/custom/price-calculator/StorageDaysInput.tsx` | CREATE | ~50 | Days input with presets |
| `src/components/custom/price-calculator/StorageCostBreakdown.tsx` | CREATE | ~70 | Breakdown display |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | UPDATE | +20 | Integrate storage calculator |
| `src/lib/__tests__/storage-cost-utils.test.ts` | CREATE | ~100 | Unit tests |

### Change Log
_(To be filled during implementation)_

### Review Follow-ups
_(To be filled after code review)_

---

## QA Results

**Reviewer**: (To be filled)
**Date**: (To be filled)
**Gate Decision**: (To be filled)

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Storage days input field | ⏳ Blocked | |
| AC2 | Daily storage cost calculation | ⏳ Blocked | |
| AC3 | Total storage cost calculation | ⏳ Blocked | |
| AC4 | Calculation breakdown display | ⏳ Blocked | |
| AC5 | Long storage warning | ⏳ Blocked | |
| AC6 | Form integration | ⏳ Blocked | |
| AC7 | Fallback mode | ⏳ Blocked | |

### Accessibility Check
| Check | Status | Evidence |
|-------|--------|----------|
| Input labels | ⏳ | |
| Preset button states | ⏳ | |
| Warning alerts | ⏳ | |
| Collapsible section | ⏳ | |
| Color contrast | ⏳ | |
| Focus management | ⏳ | |

---

## Unblock Criteria

This story will be unblocked when:

1. [ ] Request #98 backend response received
2. [ ] Story 44.13 (Storage Tariffs Auto-fill) implementation complete
3. [ ] Storage tariff API endpoint available OR fallback mode approved

**Alternative Path**: If backend is delayed, implement with fallback mode (AC7) first, then integrate API when available.

---

**Created**: 2026-01-19
**Last Updated**: 2026-01-19

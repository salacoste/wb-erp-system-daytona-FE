# Story 44.14: Storage Cost Calculation

> ⚠️ **DEPRECATED** (2026-01-24)
>
> This story has been superseded by the **turnover_days** approach implemented in Story 44.32.
>
> **Changes:**
>
> - `StorageDaysInput` component: **DELETED**
> - `StorageCostCalculator` component: **DELETED**
> - `StorageCostBreakdown` component: **DELETED**
> - `storage-cost-utils.ts`: **NOT CREATED** (functionality integrated into TurnoverDaysInput)
>
> **Current Implementation:**
>
> - Storage cost is calculated as: `dailyStorageCost × turnover_days`
> - `TurnoverDaysInput` component (Story 44.32) handles storage duration input
> - Daily storage cost comes from warehouse tariffs (Story 44.27)
>
> See [Story 44.32](./story-44.32-fe-missing-price-calc-fields.md) for current implementation.

---

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: ⛔ DEPRECATED (superseded by Story 44.32)
**Priority**: P1 - IMPORTANT
**Effort**: 2 SP
**Depends On**: Story 44.7 (Volume) ✅, Story 44.12 (Warehouse) ✅

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

## Backend API Status: READY (Request #98)

Backend has implemented storage tariffs as part of the warehouse API:

- `docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md`
- `docs/stories/epic-44/SDK-WAREHOUSES-TARIFFS-REFERENCE.md`

### Storage Tariff Data (from Warehouse API)

```json
{
  "warehouseID": 507,
  "warehouseName": "Коледино",
  "boxStorageBase": "1*1",    // 1 RUB base per day
  "boxStorageLiter": "1*x"    // 1 RUB per liter per day
}
```

**Tariff Parsing**:

```typescript
const baseLiterRub = parseTariffExpression("1*1") // → 1
const perLiterRub = parseTariffExpression("1*x")  // → 1
```

**Key Points**:

1. Storage tariffs come from warehouse data (Story 44.12)
2. Coefficient is 1.0 by default (no storage coefficient in API)
3. Formula matches logistics pattern: `(base + (volume-1) × per_liter) × coefficient`

---

## Backend Clarifications (2026-01-24)

### 60-Day Free Storage Grace Period (NEW - Backend Update)

**Source**: Backend team confirmation
**Implementation Date**: 2026-01-24

Wildberries provides **60 days of FREE storage** before any charges apply. This is a mandatory policy applied to all sellers.

```
billable_days = max(0, inventory_turnover_days - 60)
total_storage_cost = daily_cost × billable_days  (NOT × full turnover_days)
```

**Key Impact on Frontend**:

1. **Formula Update**: Use `billable_days` instead of `turnover_days` in final calculation
2. **UI Change**: Show "БЕСПЛАТНО (60 дней)" when `turnover_days ≤ 60`
3. **Breakdown**: Display both free period and billable days in calculation details
4. **Warnings**: Adjust thresholds (now 90+ days warning, 120+ days critical instead of 30/60)

**Examples**:

- 45-day turnover → 0 billable days → Cost = 0 (FREE)
- 60-day turnover → 0 billable days → Cost = 0 (FREE)
- 61-day turnover → 1 billable day → Cost = daily_rate × 1
- 90-day turnover → 30 billable days → Cost = daily_rate × 30

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

### 60-Day Free Storage Policy

**Critical Business Rule**: Wildberries provides **60 days of FREE storage** before charging begins. This is a mandatory discount applied to all sellers.

```
# Billable storage days calculation (2026-01-24 Backend Update)
billable_days = max(0, inventory_turnover_days - 60)

# Key Points:
# - First 60 days: FREE (no charge)
# - Days 61+: Billable at warehouse tariff rate
# - Formula only applies daily_cost if billable_days > 0
# - Example: 90 day turnover → (90 - 60) = 30 billable days charged
```

### Storage Cost Formulas

```
# Volume calculation (from Story 44.7 dimensions)
volume_liters = (length_cm × width_cm × height_cm) / 1000
# Minimum: 1 liter (products smaller than 1L round up to 1L)

# Daily storage cost per unit
daily_storage = (base_per_day + (volume - 1) * per_liter_per_day) * storage_coefficient

# Billable days (2026-01-24 Backend Clarification - NEW)
billable_days = max(0, turnover_days - 60)

# Total storage cost for period (only charged for days > 60)
total_storage = daily_storage * billable_days

# Where:
#   base_per_day = First liter base rate (e.g., 0.07 RUB/day)
#   per_liter_per_day = Additional liter rate (e.g., 0.05 RUB/day)
#   volume = Product volume in liters (from Story 44.7, minimum 1L)
#   storage_coefficient = Warehouse coefficient (from Story 44.13)
#   turnover_days = Inventory turnover days (estimated by seller, Story 44.32)
#   billable_days = max(0, turnover_days - 60) [2026-01-24: Backend Clarification]
```

**Example Calculation - Within Free Period (< 60 days)**:

- Dimensions: 10cm × 10cm × 15cm
- Volume: (10 × 10 × 15) / 1000 = 1.5 liters
- Base rate: 0.07 RUB/day
- Per-liter rate: 0.05 RUB/day
- Coefficient: 1.0
- Turnover days: 45 days (estimated)

```
# Step 1: Calculate volume
volume_liters = (10 × 10 × 15) / 1000 = 1.5 liters ✓

# Step 2: Calculate daily cost
daily = (0.07 + (1.5 - 1) * 0.05) * 1.0
daily = (0.07 + 0.5 * 0.05) = (0.07 + 0.025) = 0.095 RUB/day

# Step 3: Calculate billable days (2026-01-24 Backend Rule)
billable_days = max(0, 45 - 60) = max(0, -15) = 0 days

# Step 4: Calculate total
total = 0.095 * 0 = 0.00 RUB  ← FREE! (within 60-day grace period)
```

**Example Calculation - Beyond Free Period (> 60 days)**:

- Same product as above
- Turnover days: 90 days (estimated)

```
# Steps 1-2: Same as above
daily = 0.095 RUB/day

# Step 3: Calculate billable days (NEW - 2026-01-24 Backend Rule)
billable_days = max(0, 90 - 60) = 30 billable days

# Step 4: Calculate total
total = 0.095 * 30 = 2.85 RUB  ← Charged only for days 61-90
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

### AC3: Total Storage Cost Calculation (With 60-Day Grace Period)

- [ ] Calculate billable days: `billable_days = max(0, turnover_days - 60)`
- [ ] Calculate total storage: `daily_cost * billable_days` (NOT full turnover days)
- [ ] Display prominently: "Итого хранение: X,XX ₽" (Total storage: X.XX RUB)
- [ ] **NEW (2026-01-24)**: Show "БЕСПЛАТНО (60 дней)" when turnover_days ≤ 60
- [ ] Update in real-time as any input changes
- [ ] Auto-fill `storage_rub` field in main calculator form

### AC3a: Auto-Fill Indicators (2026-01-24 Backend Clarification)

- [ ] **Can auto-fill if**: warehouse_name provided AND (volume_liters provided OR dimensions L×W×H provided)
- [ ] **Cannot auto-fill if**: Missing either warehouse_name OR both volume AND dimensions
- [ ] Show lock icon 🔒 when auto-fill not possible (manual entry required)
- [ ] Show info icon ℹ️ when auto-fill is active (warehouse tariff applied)

### AC4: Calculation Breakdown Display (With 60-Day Free Period)

- [ ] Show expandable breakdown section
- [ ] Display volume calculation step:
  1. "Объём (L × W × H / 1000): X,XX л" (Volume: dimensions calculation)
- [ ] Display 3-step daily cost calculation: 2. "Базовая ставка: X,XX ₽/день" (Base: first liter rate) 3. "Доп. литры (Y л): Z,ZZ ₽/день" (Additional liters rate) 4. "Коэффициент склада: ×K" (Warehouse coefficient)
- [ ] **NEW (2026-01-24)**: Show free period calculation: 5. "60 дней бесплатно" (60 days free storage) 6. "Платные дни: max(0, N - 60) = M дней" (Billable days calculation)
- [ ] Show final: "Итого за M платных дней: X,XX ₽"

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
  /** Total storage cost for period (RUB) - only for billable days */
  total_cost: number
  /** Inventory turnover days (estimated) */
  turnover_days: number
  /** Billable days (2026-01-24: after 60-day grace period) */
  billable_days: number
  /** Volume used in calculation (liters) */
  volume_liters: number
  /** Whether in free storage period (turnover_days <= 60) */
  is_free_period: boolean
  /** Tariff used */
  tariff: StorageTariff
}

export interface StorageCostInputs {
  /** Product volume in liters (from Story 44.7 or dimensions) */
  volume_liters: number
  /** Inventory turnover days (estimated, from Story 44.32) */
  turnover_days: number
  /** Storage tariff (from warehouse API or manual fallback) */
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
 * Calculate billable storage days (2026-01-24: 60-day free period)
 * Formula: billable_days = max(0, inventory_turnover_days - 60)
 * @param turnoverDays Inventory turnover days (estimated)
 * @returns Number of days charged at warehouse tariff rate
 */
export function calculateBillableDays(turnoverDays: number): number {
  return Math.max(0, turnoverDays - 60)
}

/**
 * Calculate total storage cost for a period (2026-01-24: Accounting for 60-day free period)
 * @param volumeLiters Product volume in liters
 * @param turnoverDays Inventory turnover days (estimated)
 * @param tariff Storage tariff rates
 * @returns Total cost only for billable days (after 60-day grace period)
 */
export function calculateTotalStorageCost(
  volumeLiters: number,
  turnoverDays: number,
  tariff: StorageTariff
): number {
  const dailyCost = calculateDailyStorageCost(volumeLiters, tariff)
  const billableDays = calculateBillableDays(turnoverDays)
  return dailyCost * billableDays
}

/**
 * Full storage cost calculation with breakdown (2026-01-24: 60-day free period)
 */
export function calculateStorageCost(inputs: StorageCostInputs): StorageCostResult {
  const dailyCost = calculateDailyStorageCost(inputs.volume_liters, inputs.tariff)
  const billableDays = calculateBillableDays(inputs.turnover_days)
  const totalCost = dailyCost * billableDays
  const isFreePeriod = inputs.turnover_days <= 60

  return {
    daily_cost: dailyCost,
    total_cost: totalCost,
    turnover_days: inputs.turnover_days,
    billable_days: billableDays,
    volume_liters: inputs.volume_liters,
    is_free_period: isFreePeriod,
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
  /** Product volume in liters (from Story 44.7 or calculated from dimensions) */
  volumeLiters: number
  /** Storage tariff (from Story 44.13 warehouse API or manual fallback) */
  tariff: StorageTariff | null
  /** Current inventory turnover days value (from Story 44.32) */
  turnoverDays: number
  /** Turnover days change handler */
  onTurnoverDaysChange: (days: number) => void
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
  turnoverDays,
  onTurnoverDaysChange,
  value,
  onChange,
  disabled,
}: StorageCostCalculatorProps) {
  // Use default tariff if API tariff not available
  const effectiveTariff = tariff ?? DEFAULT_STORAGE_TARIFF
  const isUsingFallback = tariff === null

  // Calculate storage cost (2026-01-24: With 60-day grace period)
  const result = useMemo(
    () => calculateStorageCost({
      volume_liters: volumeLiters,
      turnover_days: turnoverDays,
      tariff: effectiveTariff,
    }),
    [volumeLiters, turnoverDays, effectiveTariff]
  )

  // Auto-update parent form value
  useEffect(() => {
    onChange(result.total_cost)
  }, [result.total_cost, onChange])

  // Warning level based on turnover days
  const warningLevel = getStorageWarningLevel(turnoverDays)

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

      {/* Turnover days input with presets (2026-01-24: renamed from "days") */}
      <StorageDaysInput
        value={turnoverDays}
        onChange={onTurnoverDaysChange}
        disabled={disabled}
      />

      {/* Cost display */}
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">Стоимость хранения/день:</span>
        <span className="font-medium">{formatCurrency(result.daily_cost)}/день</span>
      </div>

      {/* Free period indicator (2026-01-24 NEW) */}
      {result.is_free_period ? (
        <div className="flex justify-between items-center text-lg bg-green-50 p-3 rounded">
          <span className="font-medium">Итого хранение:</span>
          <span className="font-bold text-green-700">
            БЕСПЛАТНО (60 дней) ✓
          </span>
        </div>
      ) : (
        <div className="flex justify-between items-center text-lg">
          <span className="font-medium">Итого хранение (платные дни {result.billable_days}):</span>
          <span className="font-bold text-primary">
            {formatCurrency(result.total_cost)}
          </span>
        </div>
      )}

      {/* Warning for long storage (beyond 60-day free period) */}
      {warningLevel === 'warning' && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Хранение более 90 дней значительно увеличивает расходы (учитывая бесплатные 60 дней).
            Рассмотрите оптимизацию запасов.
          </AlertDescription>
        </Alert>
      )}

      {warningLevel === 'critical' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Хранение более 120 дней: очень высокие расходы! Рекомендуем пересмотреть объём поставки.
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
        {/* Volume calculation (2026-01-24 NEW) */}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Объём товара:</span>
          <span>{result.volume_liters.toFixed(2)} л</span>
        </div>

        <Separator className="my-2" />

        {/* Daily cost breakdown */}
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

        {/* 60-day grace period breakdown (2026-01-24 NEW) */}
        <Separator className="my-2" />
        <div className="flex justify-between text-green-700 font-medium">
          <span>60 дней бесплатно</span>
          <span>✓</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Платные дни (max(0, {result.turnover_days} - 60)):
          </span>
          <span>{result.billable_days} дней</span>
        </div>

        <Separator className="my-2" />

        <div className="flex justify-between font-medium">
          <span className="text-muted-foreground">
            Итого хранение за {result.billable_days} платных дней:
          </span>
          <span className="text-primary">{formatCurrency(result.total_cost)}</span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

### UI Layout (2026-01-24: Updated with 60-day grace period)

**Example 1: Within Free Period (45 days turnover)**:

```
┌─────────────────────────────────────────────────────────────┐
│ Расчёт хранения                                      [?]    │
├─────────────────────────────────────────────────────────────┤
│ ℹ️ Используются стандартные тарифы. Выберите склад.         │
├─────────────────────────────────────────────────────────────┤
│ Оборачиваемость запасов (дней)                              │
│ [7] [14] [30] [60] [90]     Своё: [_45_]                   │
│                                                             │
│ Стоимость хранения/день:                   0,10 ₽/день      │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Итого хранение:                  БЕСПЛАТНО (60 дней) ✓  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ▸ Показать расчёт                                           │
│   ├─ Объём товара:                  1,50 л                  │
│   ├──────────────────────────────────────────               │
│   ├─ Базовая ставка (1 л):          0,07 ₽/день            │
│   ├─ Доп. литры (0.5 л):            0,03 ₽/день            │
│   ├─ Коэффициент склада:            ×1.00                  │
│   ├─ Итого/день:                    0,10 ₽                 │
│   ├──────────────────────────────────────────               │
│   ├─ 60 дней бесплатно:             ✓                      │
│   ├─ Платные дни (max(0, 45-60)):   0 дней                 │
│   └─ Итого хранение:                0,00 ₽                 │
└─────────────────────────────────────────────────────────────┘
```

**Example 2: Beyond Free Period (90 days turnover)**:

```
┌─────────────────────────────────────────────────────────────┐
│ Расчёт хранения                                      [?]    │
├─────────────────────────────────────────────────────────────┤
│ ℹ️ Используются стандартные тарифы. Выберите склад.         │
├─────────────────────────────────────────────────────────────┤
│ Оборачиваемость запасов (дней)                              │
│ [7] [14] [30] [60] [90]     Своё: [_90_]                   │
│                                                             │
│ Стоимость хранения/день:                   0,10 ₽/день      │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Итого хранение (платные дни 30):           3,00 ₽      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ⚠️ Хранение более 90 дней увеличивает расходы.              │
│                                                             │
│ ▸ Показать расчёт                                           │
│   ├─ Объём товара:                  1,50 л                  │
│   ├──────────────────────────────────────────               │
│   ├─ Базовая ставка (1 л):          0,07 ₽/день            │
│   ├─ Доп. литры (0.5 л):            0,03 ₽/день            │
│   ├─ Коэффициент склада:            ×1.00                  │
│   ├─ Итого/день:                    0,10 ₽                 │
│   ├──────────────────────────────────────────               │
│   ├─ 60 дней бесплатно:             ✓                      │
│   ├─ Платные дни (max(0, 90-60)):   30 дней                │
│   └─ Итого хранение за 30 платных дней: 3,00 ₽            │
└─────────────────────────────────────────────────────────────┘
```

---

## Invariants & Edge Cases

| Case                           | Handling                                            |
| ------------------------------ | --------------------------------------------------- |
| Volume = 0                     | Storage cost = 0, show "Введите габариты товара"    |
| Turnover days ≤ 60             | Show "БЕСПЛАТНО (60 дней)" in green, total_cost = 0 |
| Turnover days = 61             | billable_days = 1, charge for 1 day only            |
| Turnover days > 365            | Show validation error, cap at 365                   |
| Tariff API unavailable         | Use DEFAULT_STORAGE_TARIFF fallback                 |
| Coefficient = 0                | Treat as 1.0 (no adjustment)                        |
| Very large volume (>100L)      | Allow calculation, consider warning                 |
| Negative inputs                | Validation prevents (min: 0/1)                      |
| Dimensions smaller than 1L     | Round up to minimum 1 liter                         |
| warehouse_name missing         | Cannot auto-fill tariff, show manual entry option   |
| warehouse_name + dimensions    | Can auto-fill volume, look up tariff from warehouse |
| warehouse_name + volume_liters | Can auto-fill tariff from warehouse                 |

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

| Test                               | Input                                      | Expected Output      |
| ---------------------------------- | ------------------------------------------ | -------------------- |
| Daily cost - 1 liter               | vol=1, base=0.07, per_liter=0.05, coef=1.0 | daily=0.07           |
| Daily cost - 3 liters              | vol=3, base=0.07, per_liter=0.05, coef=1.0 | daily=0.17           |
| Daily cost with coefficient        | vol=2, base=0.07, per_liter=0.05, coef=1.5 | daily=0.18           |
| Billable days - within free period | turnover=45                                | billable=0           |
| Billable days - beyond free period | turnover=90                                | billable=30          |
| Total cost - free period           | vol=3, turnover=45, daily=0.17             | total=0.00           |
| Total cost - partial charge        | vol=3, turnover=90, daily=0.17             | total=5.10           |
| Volume = 0                         | vol=0                                      | daily=0, total=0     |
| is_free_period flag - 45 days      | turnover=45                                | is_free_period=true  |
| is_free_period flag - 61 days      | turnover=61                                | is_free_period=false |
| Warning level 45 days              | turnover=45                                | 'none'               |
| Warning level 95 days              | turnover=95                                | 'warning'            |
| Warning level 121 days             | turnover=121                               | 'critical'           |

### Component Tests

| Test             | Scenario                 | Expected                              |
| ---------------- | ------------------------ | ------------------------------------- |
| Default render   | Mount with default props | Shows 14 days, calculates cost        |
| Preset selection | Click "30" preset        | Days updates to 30, cost recalculates |
| Custom input     | Enter 45 in input        | Days updates, warning shown           |
| Fallback notice  | tariff=null              | Shows info alert about fallback       |
| Warning display  | days=35                  | Shows amber warning                   |
| Critical warning | days=70                  | Shows red critical warning            |
| Breakdown expand | Click "Показать расчёт"  | Shows 3-step breakdown                |
| Form integration | Change days              | storage_rub field updates             |

---

## Dev Agent Record

### File List

| File                                                               | Change Type | Lines (Est.) | Description                   |
| ------------------------------------------------------------------ | ----------- | ------------ | ----------------------------- |
| `src/lib/storage-cost-utils.ts`                                    | CREATE      | ~80          | Storage calculation functions |
| `src/types/price-calculator.ts`                                    | UPDATE      | +20          | Add storage types             |
| `src/components/custom/price-calculator/StorageCostCalculator.tsx` | CREATE      | ~100         | Main storage component        |
| `src/components/custom/price-calculator/StorageDaysInput.tsx`      | CREATE      | ~50          | Days input with presets       |
| `src/components/custom/price-calculator/StorageCostBreakdown.tsx`  | CREATE      | ~70          | Breakdown display             |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx`   | UPDATE      | +20          | Integrate storage calculator  |
| `src/lib/__tests__/storage-cost-utils.test.ts`                     | CREATE      | ~100         | Unit tests                    |

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

| AC  | Requirement                    | Status | Evidence |
| --- | ------------------------------ | ------ | -------- |
| AC1 | Storage days input field       | ⏳     |          |
| AC2 | Daily storage cost calculation | ⏳     |          |
| AC3 | Total storage cost calculation | ⏳     |          |
| AC4 | Calculation breakdown display  | ⏳     |          |
| AC5 | Long storage warning           | ⏳     |          |
| AC6 | Form integration               | ⏳     |          |
| AC7 | Fallback mode                  | ⏳     |          |

### Accessibility Check

| Check                | Status | Evidence |
| -------------------- | ------ | -------- |
| Input labels         | ⏳     |          |
| Preset button states | ⏳     |          |
| Warning alerts       | ⏳     |          |
| Collapsible section  | ⏳     |          |
| Color contrast       | ⏳     |          |
| Focus management     | ⏳     |          |

---

## Unblock Status: READY

All blocking dependencies resolved:

1. [x] Request #98 backend response received (2026-01-20)
2. [x] Storage tariffs available from warehouse API (Story 44.12)
3. [x] Fallback mode with default tariffs available

**Implementation Path**: Use warehouse storage tariffs from Story 44.12, with fallback to defaults when no warehouse selected.

---

**Created**: 2026-01-19
**Last Updated**: 2026-01-20
**Unblocked**: 2026-01-20 (Backend API Ready - Request #98)

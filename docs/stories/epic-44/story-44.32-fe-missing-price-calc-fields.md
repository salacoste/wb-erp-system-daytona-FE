# Story 44.32: Missing Price Calculator Fields (Phase 1 HIGH Priority)

> **Note (2026-01-24)**: This story implements the **unified turnover_days approach** for storage cost calculation.
>
> **Key Design Decision:**
> - `turnover_days` is the **SOLE** storage duration input (no separate `storage_days` field)
> - Storage cost formula: `storage_rub = dailyStorageCost × turnover_days`
> - `dailyStorageCost` comes from warehouse tariffs (Story 44.27)
> - This approach supersedes the original Story 44.14 (StorageDaysInput/StorageCostCalculator)
>
> **Deleted Components (originally planned in Story 44.14):**
> - `StorageDaysInput.tsx` - NOT CREATED
> - `StorageCostCalculator.tsx` - NOT CREATED
> - `StorageCostBreakdown.tsx` - NOT CREATED
> - `storage-cost-utils.ts` - NOT CREATED

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: ✅ Complete
**Priority**: P0 - HIGH
**Effort**: 5 SP
**Completed**: 2026-01-23
**Depends On**: Story 44.2 (Input Form), Story 44.15 (FBO/FBS Selection), Story 44.27 (Warehouse Integration)
**Requirements Ref**: PRICE-CALCULATOR-REQUIREMENTS.md Section 14.2, Section 8
**Backend API**: `POST /v1/products/price-calculator` (existing endpoint with extended fields)

---

## User Story

**As a** Seller,
**I want** to specify additional product attributes (box type, weight threshold, turnover days, localization),
**So that** the price calculator can accurately calculate costs based on actual WB tariff structures.

**Non-goals**:
- Pallet-specific tariff UI (complex tariff calculation remains backend)
- ROI calculation and investment analysis (Phase 3)
- Advanced expense tracking (Phase 2 MEDIUM priority fields)

---

## Background: Competitor Analysis Gap

Competitor analysis revealed 9 missing fields in Price Calculator V2. This story implements **4 HIGH priority fields** that directly impact tariff calculation accuracy:

1. **Box Type** (Короб/Монопаллета) - Different tariff structures (box vs pallet)
2. **Weight >25kg** - Heavy items incur 1.5x logistics multiplier
3. **Localization Index (КТР)** - Regional delivery coefficient (1.0-2.5x)
4. **Turnover Days** - Storage cost calculation multiplier (FBO only)

**Source**: PRICE-CALCULATOR-REQUIREMENTS.md Section 14.2

---

## Acceptance Criteria

### AC1: Box Type Selection (FBO Only)
- [x] Show radio buttons: "Короб" (Box) | "Монопаллета" (Pallet)
- [x] Default: "Короб" selected
- [x] Condition: Only shown when `fulfillment_type === 'FBO'`
- [x] Field: `box_type` (enum: 'box' | 'pallet')
- [x] Tooltip: "Тип доставки влияет на стоимость приёмки"
- [x] Visual indicator showing which type is selected

### AC2: Weight Threshold Checkbox
- [x] Show checkbox: "Вес превышает 25 кг"
- [x] Default: unchecked (false)
- [x] Field: `weight_exceeds_25kg` (boolean)
- [x] Applies to BOTH FBO and FBS
- [x] Tooltip: "Тяжеловесные товары (>25 кг) имеют повышенный коэффициент логистики (~1.5x)"
- [x] Show warning when checked: "Учтён повышенный тариф логистики для тяжеловесных грузов"

### AC3: Localization Index Input
- [x] Show number input: "Индекс локализации (КТР)"
- [x] Range: 0.5 - 3.0, step 0.1
- [x] Default: 1.0 (auto-filled from warehouse selection)
- [x] Field: `localization_index` (number)
- [x] Applies to BOTH FBO and FBS
- [x] Tooltip: "Коэффициент доставки в удалённые регионы (1.0 = Москва/ЦФО, 1.5-2.5 = Дальний Восток)"
- [x] Show source indicator: "Авто: из коэффициента склада" or "Вручную"

### AC4: Turnover Days Input (FBO Only) - **PRIMARY STORAGE DURATION FIELD**
- [x] Show number input: "Оборачиваемость, дней"
- [x] Range: 1-365
- [x] Default: 20 (typical WB inventory turnover)
- [x] Field: `turnover_days` (number)
- [x] Condition: Only shown when `fulfillment_type === 'FBO'`
- [x] Tooltip: "Сколько дней товар лежит на складе до продажи. Влияет на общую стоимость хранения."
- [x] **Auto-calculate `storage_rub`**: `storage_rub = dailyStorageCost × turnover_days`
- [x] `dailyStorageCost` sourced from warehouse tariffs (Story 44.27)
- [x] Display preview: "Хранение за период: {total} ₽"
- [x] Slider for visual adjustment (1-365 days)

> **Note**: This is the ONLY storage duration input in the calculator. There is no separate
> `storage_days` field - the `turnover_days` approach handles all storage cost calculation.

### AC5: Form Integration
- [x] All new fields integrate into existing `PriceCalculatorForm` component
- [x] Form validation: `localization_index` between 0.5-3.0, `turnover_days` between 1-365
- [x] Fields participate in form watch (real-time calculation updates)
- [x] Form submission includes all new fields in `POST /v1/products/price-calculator`
- [x] Values persist across form re-renders

### AC6: Conditional Display Logic
- [x] `box_type` hidden when `fulfillment_type === 'FBS'`
- [x] `turnover_days` hidden when `fulfillment_type === 'FBS'`
- [x] Smooth transitions when switching FBO/FBS (fade in/out)
- [x] No layout shift when fields appear/disappear

### AC7: Warehouse Auto-fill Integration
- [x] On warehouse selection: auto-fill `localization_index` from `delivery.coefficient`
- [x] Store original coefficient value before manual override
- [x] Show "Изменён" badge when `localization_index` manually modified
- [x] Reset to warehouse coefficient when warehouse changes (unless manually locked)

### AC8: Results Display Impact
- [x] Two-Level Pricing (Story 44.20) shows updated calculations
- [x] Cost breakdown shows individual components affected by new fields:
  - "Логистика WB" includes weight multiplier
  - "Логистика WB" includes localization index
  - "Хранение" shows total with turnover days applied
  - "Приёмка" reflects box type tariff
- [x] Visual indicators show which multipliers are active

### AC9: Tooltip Explanations
- [x] All new fields have helper tooltips (Russian)
- [x] Tooltips explain business impact on calculation
- [x] Icons trigger tooltip on hover/click
- [x] Tooltips are mobile-friendly (tap to show)

### AC10: Mobile Responsive
- [x] All fields stack vertically on mobile (<640px)
- [x] Radio buttons use full width on mobile
- [x] Number inputs show +/- buttons on mobile
- [x] Tooltips don't overflow viewport

---

## Context & References

- **Requirements**: `PRICE-CALCULATOR-REQUIREMENTS.md` Section 14.2 (HIGH Priority Fields)
- **Parent Epic**: `docs/stories/epic-44/README.md`
- **Story 44.15**: Fulfillment Type (FBO/FBS - determines field visibility)
- **Story 44.27**: Warehouse Integration (auto-fill `localization_index`)
- **Story 44.20**: Two-Level Pricing Display (shows updated calculations)
- **Backend Request**: `frontend/docs/request-backend/98-warehouses-tariffs-coefficients-api.md`

**Gap Analysis Source**: Competitor analysis revealed missing fields that impact calculation accuracy by 5-15% when omitted.

---

## API Contract

### Request Body Extension

**POST /v1/products/price-calculator** (existing endpoint with new fields):

```typescript
interface PriceCalculatorRequestV2 {
  // ... existing fields ...

  // NEW FIELDS - Phase 1 HIGH Priority
  box_type?: 'box' | 'pallet';         // FBO only, default: 'box'
  weight_exceeds_25kg?: boolean;        // Default: false
  localization_index?: number;          // Default: 1.0 (auto-fill)
  turnover_days?: number;               // FBO only, default: 20
}
```

### Calculation Impact (Backend)

Backend applies multipliers to existing calculation logic:

```typescript
// Weight multiplier (applies to logistics)
const weightMultiplier = weight_exceeds_25kg ? 1.5 : 1.0;

// Localization index (applies to logistics)
const effectiveLocalization = localization_index ?? logistics_coefficient;

// Box type (applies to acceptance cost FBO only)
const acceptanceRate = box_type === 'pallet'
  ? PALLET_ACCEPTANCE_RATE  // ~500 ₽ fixed
  : BOX_ACCEPTANCE_RATE * volume_liters;  // ~1.70 ₽/L

// Turnover days (applies to storage cost FBO only)
const storageTotal = storage_per_day * turnover_days;
```

### Example Request

```json
{
  "target_margin_pct": 20,
  "cogs_rub": 1500,
  "buyback_pct": 98,
  "fulfillment_type": "FBO",
  "category_id": 123,
  "warehouse_id": 507,

  // NEW FIELDS
  "box_type": "box",
  "weight_exceeds_25kg": false,
  "localization_index": 1.2,
  "turnover_days": 20,

  // ... existing fields ...
  "acquiring_pct": 2,
  "storage_rub": 2.5,
  "acceptance_type": "paid",
  "tax_rate_pct": 6,
  "tax_type": "income",
  "drr_pct": 5,
  "spp_pct": 10
}
```

---

## Implementation Notes

### File Structure

```
src/
├── components/
│   └── custom/
│       └── price-calculator/
│           ├── PriceCalculatorForm.tsx          # UPDATE - Add new fields
│           ├── BoxTypeSelector.tsx              # CREATE - Radio group
│           ├── WeightThresholdCheckbox.tsx      # CREATE - Checkbox with warning
│           ├── LocalizationIndexInput.tsx        # CREATE - Number input + auto-fill
│           ├── TurnoverDaysInput.tsx            # CREATE - Number input + preview
│           └── FormFieldTooltip.tsx             # CREATE - Reusable tooltip
├── hooks/
│   └── useWarehouseCoefficients.ts              # UPDATE - Auto-fill logic
└── types/
    └── price-calculator.ts                      # UPDATE - Extend types
```

### Type Definitions

```typescript
// src/types/price-calculator.ts

/**
 * Extended form data with Phase 1 HIGH priority fields
 */
export interface PriceCalculatorFormData {
  // ... existing fields ...

  // Phase 1 HIGH Priority Fields
  box_type?: 'box' | 'pallet';
  weight_exceeds_25kg?: boolean;
  localization_index?: number;
  turnover_days?: number;
}

/**
 * Box type configuration
 */
export type BoxType = 'box' | 'pallet';

export const BOX_TYPE_CONFIG: Record<BoxType, {
  label: string;
  description: string;
  apiId: number;
  icon?: string;
}> = {
  box: {
    label: 'Короб',
    description: 'Стандартная доставка в коробе',
    apiId: 2,
  },
  pallet: {
    label: 'Монопаллета',
    description: 'Крупногабаритные товары на паллете',
    apiId: 5,
  },
};

/**
 * Localization index ranges
 */
export const LOCALIZATION_RANGES = {
  MIN: 0.5,
  MAX: 3.0,
  STEP: 0.1,
  DEFAULT: 1.0,
  ZONES: {
    central: { min: 1.0, max: 1.2, label: 'Центральный ФО' },
    regional: { min: 1.3, max: 1.7, label: 'Регионы' },
    remote: { min: 1.8, max: 2.5, label: 'Дальний Восток / Крайний Север' },
  } as const,
};
```

### Component: BoxTypeSelector

```typescript
// src/components/custom/price-calculator/BoxTypeSelector.tsx
'use client'

import { Controller, Control } from 'react-hook-form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { BOX_TYPE_CONFIG, type BoxType } from '@/types/price-calculator';
import { FormFieldTooltip } from './FormFieldTooltip';

interface BoxTypeSelectorProps {
  control: Control<PriceCalculatorFormData>;
  disabled?: boolean;
}

export function BoxTypeSelector({
  control,
  disabled = false,
}: BoxTypeSelectorProps) {
  return (
    <Controller
      name="box_type"
      control={control}
      defaultValue="box"
      render={({ field }) => (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label>Тип упаковки</Label>
            <FormFieldTooltip content="Тип доставки влияет на стоимость приёмки: Короб (~1.70 ₽/л) или Монопаллета (~500 ₽ фикс)." />
          </div>

          <RadioGroup
            value={field.value || 'box'}
            onValueChange={(value) => field.onChange(value as BoxType)}
            disabled={disabled}
            className="grid grid-cols-2 gap-4"
          >
            {(Object.keys(BOX_TYPE_CONFIG) as BoxType[]).map((type) => (
              <div
                key={type}
                className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem value={type} id={`box-${type}`} />
                <Label
                  htmlFor={`box-${type}`}
                  className="flex-1 cursor-pointer font-normal"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{BOX_TYPE_CONFIG[type].label}</span>
                    <span className="text-xs text-muted-foreground">
                      {BOX_TYPE_CONFIG[type].description}
                    </span>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}
    />
  );
}
```

### Component: WeightThresholdCheckbox

```typescript
// src/components/custom/price-calculator/WeightThresholdCheckbox.tsx
'use client'

import { Controller, Control } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { FormFieldTooltip } from './FormFieldTooltip';

interface WeightThresholdCheckboxProps {
  control: Control<PriceCalculatorFormData>;
  disabled?: boolean;
}

export function WeightThresholdCheckbox({
  control,
  disabled = false,
}: WeightThresholdCheckboxProps) {
  return (
    <Controller
      name="weight_exceeds_25kg"
      control={control}
      defaultValue={false}
      render={({ field }) => (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors flex-1">
              <Checkbox
                id="weight-checkbox"
                checked={field.value || false}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
              <Label
                htmlFor="weight-checkbox"
                className="cursor-pointer flex-1"
              >
                Вес превышает 25 кг
              </Label>
              <FormFieldTooltip content="Тяжеловесные товары (>25 кг) имеют повышенный коэффициент логистики (~1.5x). Критично для мебели, бытовой техники, спорттоваров." />
            </div>
          </div>

          {field.value && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Учтён повышенный тариф логистики для тяжеловесных грузов (коэффициент ~1.5x)
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    />
  );
}
```

### Component: LocalizationIndexInput

```typescript
// src/components/custom/price-calculator/LocalizationIndexInput.tsx
'use client'

import { Controller, Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FormFieldTooltip } from './FormFieldTooltip';
import { LOCALIZATION_RANGES } from '@/types/price-calculator';
import { CheckCircle2, Edit3 } from 'lucide-react';

interface LocalizationIndexInputProps {
  control: Control<PriceCalculatorFormData>;
  disabled?: boolean;
  source?: 'auto' | 'manual';
  originalValue?: number;
}

export function LocalizationIndexInput({
  control,
  disabled = false,
  source = 'manual',
  originalValue,
}: LocalizationIndexInputProps) {
  return (
    <Controller
      name="localization_index"
      control={control}
      defaultValue={LOCALIZATION_RANGES.DEFAULT}
      rules={{
        min: LOCALIZATION_RANGES.MIN,
        max: LOCALIZATION_RANGES.MAX,
      }}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="localization-index">Индекс локализации (КТР)</Label>
            <FormFieldTooltip content="Коэффициент доставки в удалённые регионы: 1.0 = Москва/ЦФО, 1.5-2.5 = Дальний Восток. Автозаполнение из коэффициента склада." />
            {source === 'auto' && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Авто
              </Badge>
            )}
            {source === 'manual' && originalValue !== undefined && field.value !== originalValue && (
              <Badge variant="outline" className="text-xs">
                <Edit3 className="w-3 h-3 mr-1" />
                Изменён
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Input
              id="localization-index"
              type="number"
              step={LOCALIZATION_RANGES.STEP}
              min={LOCALIZATION_RANGES.MIN}
              max={LOCALIZATION_RANGES.MAX}
              value={field.value || LOCALIZATION_RANGES.DEFAULT}
              onChange={(e) => field.onChange(parseFloat(e.target.value))}
              disabled={disabled}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">
              {field.value < 1.0 && '(близкий регион)'}
              {field.value >= 1.0 && field.value <= 1.2 && '(Центральный ФО)'}
              {field.value > 1.2 && field.value <= 1.7 && '(Регионы)'}
              {field.value > 1.7 && '(Дальний Восток / Крайний Север)'}
            </span>
          </div>

          {fieldState.error && (
            <p className="text-sm text-destructive">
              Значение должно быть от {LOCALIZATION_RANGES.MIN} до {LOCALIZATION_RANGES.MAX}
            </p>
          )}
        </div>
      )}
    />
  );
}
```

### Component: TurnoverDaysInput

```typescript
// src/components/custom/price-calculator/TurnoverDaysInput.tsx
'use client'

import { Controller, Control, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { FormFieldTooltip } from './FormFieldTooltip';
import { formatCurrency } from '@/lib/utils';
import type { PriceCalculatorFormData } from '@/types/price-calculator';

interface TurnoverDaysInputProps {
  control: Control<PriceCalculatorFormData>;
  disabled?: boolean;
  storagePerDay?: number; // Calculated from volume * coefficient
}

export function TurnoverDaysInput({
  control,
  disabled = false,
  storagePerDay = 0,
}: TurnoverDaysInputProps) {
  const turnoverDays = useWatch({
    control,
    name: 'turnover_days',
  });

  const totalStorage = (turnoverDays || 20) * storagePerDay;

  return (
    <Controller
      name="turnover_days"
      control={control}
      defaultValue={20}
      rules={{
        min: 1,
        max: 365,
        valueAsNumber: true,
      }}
      render={({ field, fieldState }) => (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="turnover-days">Оборачиваемость, дней</Label>
            <FormFieldTooltip content="Сколько дней товар лежит на складе до продажи. Влияет на общую стоимость хранения. Типично: 20 дней для WB." />
          </div>

          <div className="flex items-center gap-4">
            <Input
              id="turnover-days"
              type="number"
              min={1}
              max={365}
              value={field.value || 20}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 20)}
              disabled={disabled}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">дней</span>
          </div>

          <div className="space-y-2">
            <Slider
              value={[field.value || 20]}
              onValueChange={([value]) => field.onChange(value)}
              min={1}
              max={365}
              step={1}
              disabled={disabled}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 день</span>
              <span>快速 (快速销售)</span>
              <span>20 дней (среднее)</span>
              <span>365 дней (медленно)</span>
            </div>
          </div>

          {storagePerDay > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">
                Хранение за период: <strong>{formatCurrency(totalStorage)} ₽</strong>
                <span className="text-muted-foreground">
                  {' '}({storagePerDay.toFixed(2)} ₽/день × {field.value || 20} дней)
                </span>
              </p>
            </div>
          )}

          {fieldState.error && (
            <p className="text-sm text-destructive">
              Значение должно быть от 1 до 365 дней
            </p>
          )}
        </div>
      )}
    />
  );
}
```

### Hook: Warehouse Auto-fill Integration

```typescript
// src/hooks/useWarehouseCoefficients.ts (UPDATE)
import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import type { PriceCalculatorFormData } from '@/types/price-calculator';

interface UseWarehouseAutoFillProps {
  control: Control<PriceCalculatorFormData>;
  warehouseData?: {
    delivery_coefficient?: number;
    storage_coefficient?: number;
    acceptance_coefficient?: number;
  };
}

export function useWarehouseAutoFill({
  control,
  warehouseData,
}: UseWarehouseAutoFillProps) {
  const fulfillmentType = useWatch({ control, name: 'fulfillment_type' });
  const localizationIndex = useWatch({ control, name: 'localization_index' });

  useEffect(() => {
    if (warehouseData?.delivery_coefficient) {
      // Auto-fill localization index only if not manually modified
      // Check if current value matches original warehouse value
      const isAutoFilled = localizationIndex === undefined ||
                         localizationIndex === warehouseData.delivery_coefficient;

      if (isAutoFilled) {
        control.setValue('localization_index', warehouseData.delivery_coefficient, {
          shouldValidate: true,
          shouldDirty: false, // Don't mark as dirty if auto-filling
        });
      }
    }
  }, [warehouseData?.delivery_coefficient, control]);

  // Reset to default values when warehouse changes
  useEffect(() => {
    if (warehouseData) {
      // Only reset if user hasn't manually overridden
      if (localizationIndex === undefined) {
        control.setValue('localization_index', warehouseData.delivery_coefficient || 1.0);
      }
    }
  }, [warehouseData, control, localizationIndex]);
}
```

### Form Integration

```typescript
// src/components/custom/price-calculator/PriceCalculatorForm.tsx (UPDATE)
'use client'

import { useForm } from 'react-hook-form';
import { BoxTypeSelector } from './BoxTypeSelector';
import { WeightThresholdCheckbox } from './WeightThresholdCheckbox';
import { LocalizationIndexInput } from './LocalizationIndexInput';
import { TurnoverDaysInput } from './TurnoverDaysInput';
import { useWarehouseAutoFill } from '@/hooks/useWarehouseCoefficients';
import type { PriceCalculatorFormData } from '@/types/price-calculator';

export function PriceCalculatorForm() {
  const { control, watch, setValue } = useForm<PriceCalculatorFormData>({
    defaultValues: {
      fulfillment_type: 'FBO',
      box_type: 'box',
      weight_exceeds_25kg: false,
      localization_index: 1.0,
      turnover_days: 20,
      // ... other defaults
    },
  });

  const fulfillmentType = watch('fulfillment_type');
  const { data: warehouseData } = useWarehouseCoefficients(watch('warehouse_id'));

  // Auto-fill logic
  useWarehouseAutoFill({ control, warehouseData });

  return (
    <form>
      {/* ... existing fields ... */}

      {/* NEW FIELDS - Phase 1 HIGH Priority */}
      {fulfillmentType === 'FBO' && (
        <>
          <BoxTypeSelector control={control} />
          <TurnoverDaysInput
            control={control}
            storagePerDay={watch('storage_rub')}
          />
        </>
      )}

      <WeightThresholdCheckbox control={control} />

      <LocalizationIndexInput
        control={control}
        source={warehouseData ? 'auto' : 'manual'}
        originalValue={warehouseData?.delivery_coefficient}
      />

      {/* ... rest of form ... */}
    </form>
  );
}
```

### Calculation Preview Display

```typescript
// Show in PriceCalculatorResults component (Story 44.20)
<div className="space-y-2">
  <div className="flex justify-between font-medium text-sm">
    <span>ФИКСИРОВАННЫЕ ЗАТРАТЫ</span>
    <span>{formatCurrency(fixedCosts.total)}</span>
  </div>

  <div className="space-y-1 text-sm text-muted-foreground">
    {/* Existing items */}
    <div className="flex justify-between">
      <span>├─ Себестоимость (COGS)</span>
      <span>{formatCurrency(costs.cogs)}</span>
    </div>

    {/* Logistics with multipliers shown */}
    <div className="flex justify-between">
      <span>
        ├─ Логистика WB (прямая)
        {formData.weight_exceeds_25kg && (
          <Badge variant="outline" className="ml-2 text-xs">×1.5 вес</Badge>
        )}
        {formData.localization_index && formData.localization_index > 1.0 && (
          <Badge variant="outline" className="ml-2 text-xs">
            ×{formData.localization_index} КТР
          </Badge>
        )}
      </span>
      <span>{formatCurrency(costs.logisticsForward)}</span>
    </div>

    {/* Turnover days shown for storage */}
    {fulfillmentType === 'FBO' && formData.turnover_days && (
      <div className="flex justify-between">
        <span>├─ Хранение ({formData.turnover_days} дн × {storagePerDay.toFixed(2)} ₽/дн)</span>
        <span>{formatCurrency(costs.storage)}</span>
      </div>
    )}

    {/* Box type shown for acceptance */}
    {fulfillmentType === 'FBO' && formData.box_type && (
      <div className="flex justify-between">
        <span>├─ Приёмка ({formData.box_type === 'pallet' ? 'Монопаллета' : 'Короб'})</span>
        <span>{formatCurrency(costs.acceptance)}</span>
      </div>
    )}

    {/* ... rest of breakdown ... */}
  </div>
</div>
```

---

## Invariants & Edge Cases

| Scenario | Handling |
|----------|----------|
| FBS mode | Hide `box_type`, `turnover_days` (not applicable) |
| `localization_index` < 0.5 | Show validation error, clamp to 0.5 |
| `localization_index` > 3.0 | Show validation error, clamp to 3.0 |
| `turnover_days` < 1 | Show validation error, clamp to 1 |
| `turnover_days` > 365 | Show validation error, clamp to 365 |
| Warehouse selection changes | Auto-fill `localization_index` unless manually locked |
| User modifies auto-filled value | Show "Изменён" badge, preserve on warehouse change |
| No warehouse selected | Use default `localization_index = 1.0` |
| `storage_rub` = 0 | Hide total storage preview in `TurnoverDaysInput` |
| Very high `turnover_days` (>90) | Show warning: "Длительное хранение снизит маржинальность" |

---

## Observability

- **Analytics**: Track field usage frequency, default value acceptance
- **Metrics**: Average values entered for each field, override rate
- **Logs**: Log auto-fill logic for debugging warehouse integration

---

## Security

- **Input Validation**: All number fields have min/max constraints
- **XSS Prevention**: No user-generated HTML
- **Type Safety**: TypeScript enums for `box_type`

---

## Accessibility (WCAG 2.1 AA)

- [ ] All inputs have associated labels
- [ ] Radio buttons keyboard navigable
- [ ] Tooltips accessible via keyboard
- [ ] Color contrast ≥4.5:1
- [ ] Error messages read by screen readers
- [ ] Alert for weight threshold has role="alert"

---

## Testing Requirements

### Unit Tests
- [ ] `BoxTypeSelector` renders both options
- [ ] `WeightThresholdCheckbox` shows warning when checked
- [ ] `LocalizationIndexInput` validates range (0.5-3.0)
- [ ] `TurnoverDaysInput` calculates total correctly
- [ ] Auto-fill logic works for `localization_index`
- [ ] FBS mode hides FBO-only fields

### Integration Tests
- [ ] Form submission includes all new fields
- [ ] Warehouse selection triggers auto-fill
- [ ] FBO/FBS switch shows/hides correct fields
- [ ] Real-time calculation updates on field change

### E2E Tests
- [ ] User can select box type
- [ ] User can check weight threshold
- [ ] User can modify localization index
- [ ] User can set turnover days
- [ ] Form submits with all new fields
- [ ] Results display shows updated calculations

---

## Dev Agent Record

### File List
| File | Change Type | Lines (Est.) | Description |
|------|-------------|--------------|-------------|
| `src/components/custom/price-calculator/BoxTypeSelector.tsx` | CREATE | ~60 | Radio group for box/pallet selection |
| `src/components/custom/price-calculator/WeightThresholdCheckbox.tsx` | CREATE | ~50 | Checkbox with warning alert |
| `src/components/custom/price-calculator/LocalizationIndexInput.tsx` | CREATE | ~80 | Number input with auto-fill indicator |
| `src/components/custom/price-calculator/TurnoverDaysInput.tsx` | CREATE | ~90 | Number input + slider + total preview |
| `src/components/custom/price-calculator/FormFieldTooltip.tsx` | CREATE | ~30 | Reusable tooltip component |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | UPDATE | +40 | Integrate new fields |
| `src/hooks/useWarehouseCoefficients.ts` | UPDATE | +30 | Auto-fill logic for localization_index |
| `src/types/price-calculator.ts` | UPDATE | +50 | New type definitions |

### Dependencies on Previous Stories
| Story | Component/Type Used |
|-------|---------------------|
| 44.2 | `PriceCalculatorForm` (integration point) |
| 44.15 | `fulfillment_type` (determines field visibility) |
| 44.27 | Warehouse selection (auto-fill source) |
| 44.20 | Two-Level Pricing (shows calculation impact) |

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
| AC1 | Box Type Selection | ⏳ | |
| AC2 | Weight Threshold Checkbox | ⏳ | |
| AC3 | Localization Index Input | ⏳ | |
| AC4 | Turnover Days Input | ⏳ | |
| AC5 | Form Integration | ⏳ | |
| AC6 | Conditional Display Logic | ⏳ | |
| AC7 | Warehouse Auto-fill Integration | ⏳ | |
| AC8 | Results Display Impact | ⏳ | |
| AC9 | Tooltip Explanations | ⏳ | |
| AC10 | Mobile Responsive | ⏳ | |

---

## Definition of Done

- [ ] All Acceptance Criteria verified (AC1-AC10)
- [ ] Components created with proper TypeScript types
- [ ] Unit tests written and passing (≥80% coverage)
- [ ] Integration tests with form flow
- [ ] E2E tests for user interactions
- [ ] Responsive layout verified (mobile/tablet/desktop)
- [ ] No ESLint errors
- [ ] Accessibility audit passed
- [ ] Code review completed
- [ ] QA Gate passed

---

**Created**: 2026-01-21
**Last Updated**: 2026-01-21
**Priority**: P0 - HIGH (direct calculation accuracy impact)
**Business Value**: 5-15% calculation accuracy improvement for professional sellers

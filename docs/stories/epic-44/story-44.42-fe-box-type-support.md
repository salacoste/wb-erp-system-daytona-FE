# Story 44.42-FE: Box Type Selection Support

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 📋 Ready for Dev
**Priority**: P1 - IMPORTANT (Calculation accuracy for different delivery types)
**Effort**: 5 SP
**Created**: 2026-01-26
**Depends On**:

- Story 44.12 ✅ (Warehouse Selection)
- Story 44.40 📋 (Two Tariff Systems Integration)
- Story 44.41 📋 (Storage Tariff Fix)

---

## Problem Statement

**CRITICAL GAP**: The Price Calculator does not support boxTypeId selection, yet Wildberries has **THREE distinct delivery types** with different tariff structures:

| boxTypeId | Name                  | Storage Formula Difference                                     |
| --------- | --------------------- | -------------------------------------------------------------- |
| **2**     | Boxes (Коробки)       | Standard: `(baseLiterRub + (V-1) * additionalLiterRub) * coef` |
| **5**     | Pallets (Монопаллеты) | Fixed rate: `baseLiterRub * coef` (additionalLiterRub = 0)     |
| **6**     | Supersafe (Суперсейф) | Standard formula                                               |

### Evidence from Backend Documentation

```json
{
  "boxTypeId": 5,
  "boxTypeName": "Pallets",
  "storage": {
    "coefficient": 1.65,
    "baseLiterRub": 41.25,
    "additionalLiterRub": 0   // ← CRITICAL: 0 for Pallets!
  }
}
```

**Impact**: Without boxType selection, Pallets users get incorrect storage calculations because the formula differs.

---

## User Story

**As a** Seller using Pallets or Supersafe delivery,
**I want** to select my delivery box type in the Price Calculator,
**So that** storage and logistics costs are calculated with the correct tariffs for my delivery method.

**Non-goals**:

- Box type recommendations based on product size
- Multi-box type comparison view
- Historical box type tariff trends

---

## Acceptance Criteria

### AC1: Box Type Dropdown

- [ ] Add "Тип доставки" (Delivery Type) dropdown below warehouse selection
- [ ] Options:
  - `Коробки` (Boxes) - boxTypeId: 2 - DEFAULT
  - `Монопаллеты` (Pallets) - boxTypeId: 5
  - `Суперсейф` (Supersafe) - boxTypeId: 6
- [ ] Default selection: `Коробки` (most common)
- [ ] Persist selection in form state

### AC2: API Integration

- [ ] Filter `/v1/tariffs/acceptance/coefficients/all` response by selected boxTypeId
- [ ] Query parameters: `?warehouseId={id}&boxTypeId={type}`
- [ ] If no data for selected boxType at warehouse, show "Недоступно для данного склада"
- [ ] Log when box type changes tariff source

### AC3: Tariff Display Update

- [ ] Show selected box type in tariff display section
- [ ] Display box-type-specific tariffs:
  ```
  Тип доставки: Монопаллеты
  Логистика: 75 + 23×(V-1) ₽ × 1.65
  Хранение: 41.25 ₽/день × 1.65 (фиксированная ставка)
  ```
- [ ] For Pallets, show "(фиксированная ставка)" indicator for storage

### AC4: Pallets Special Handling

- [ ] When boxTypeId = 5 (Pallets), storage formula changes:
  ```typescript
  // Standard (Boxes, Supersafe):
  dailyStorage = (baseLiterRub + max(0, volume-1) * additionalLiterRub) * coefficient

  // Pallets (additionalLiterRub = 0):
  dailyStorage = baseLiterRub * coefficient  // Volume-independent!
  ```
- [ ] Show explanation tooltip: "Для монопаллет хранение не зависит от объёма товара"
- [ ] Volume input still affects logistics, but NOT storage for Pallets

### AC5: Available Box Types Per Warehouse

- [ ] Some warehouses may not support all box types
- [ ] Fetch available box types from API response:
  ```typescript
  const availableBoxTypes = coefficients
    .filter(c => c.warehouseId === selectedWarehouse && c.isAvailable)
    .map(c => c.boxTypeId)
  // Unique: [2, 5, 6] or subset
  ```
- [ ] Disable unavailable box types in dropdown with tooltip "Недоступно на этом складе"
- [ ] Auto-switch to available type if current selection becomes unavailable

### AC6: Form Integration

- [ ] Add `boxTypeId` to form state and API request
- [ ] Include in calculation payload:
  ```typescript
  {
    warehouseId: 130744,
    boxTypeId: 5,       // NEW
    deliveryDate: "2026-01-27",
    volumeLiters: 3.5,
    // ...
  }
  ```
- [ ] On warehouse change, reset boxType to default (Boxes) if not available

### AC7: Visual Design

- [ ] Box type selector styled consistently with warehouse selector
- [ ] Icon per type:
  - 📦 Boxes (Коробки)
  - 🔲 Pallets (Монопаллеты)
  - 🔒 Supersafe (Суперсейф)
- [ ] Compact display in results: "Коробки" badge next to warehouse name

---

## API Contract Reference

### SUPPLY System with boxTypeId

**Endpoint**: `GET /v1/tariffs/acceptance/coefficients/all`

**Response includes boxTypeId**:

```json
{
  "coefficients": [
    {
      "warehouseId": 130744,
      "warehouseName": "Краснодар (Тихорецкая)",
      "date": "2026-01-27",
      "boxTypeId": 2,
      "boxTypeName": "Boxes",
      "delivery": { "coefficient": 1.65, "baseLiterRub": 75, "additionalLiterRub": 23 },
      "storage": { "coefficient": 1.65, "baseLiterRub": 41.25, "additionalLiterRub": 12.5 }
    },
    {
      "warehouseId": 130744,
      "warehouseName": "Краснодар (Тихорецкая)",
      "date": "2026-01-27",
      "boxTypeId": 5,
      "boxTypeName": "Pallets",
      "delivery": { "coefficient": 1.65, "baseLiterRub": 75, "additionalLiterRub": 23 },
      "storage": { "coefficient": 1.65, "baseLiterRub": 41.25, "additionalLiterRub": 0 }
    },
    {
      "warehouseId": 130744,
      "warehouseName": "Краснодар (Тихорецкая)",
      "date": "2026-01-27",
      "boxTypeId": 6,
      "boxTypeName": "Supersafe",
      "delivery": { "coefficient": 1.65, "baseLiterRub": 75, "additionalLiterRub": 23 },
      "storage": { "coefficient": 1.65, "baseLiterRub": 41.25, "additionalLiterRub": 12.5 }
    }
  ]
}
```

**Note**: Same warehouse has different entries per boxTypeId!

---

## Implementation Notes

### File Structure

```
src/
├── types/
│   └── price-calculator.ts                 # UPDATE - Add BoxTypeId type
├── lib/
│   └── box-type-utils.ts                   # CREATE - Box type config & helpers
├── hooks/
│   └── useAcceptanceCoefficients.ts        # UPDATE - Filter by boxTypeId
├── components/custom/price-calculator/
│   ├── BoxTypeSelector.tsx                 # CREATE - Box type dropdown
│   ├── WarehouseSection.tsx                # UPDATE - Include box type
│   └── PriceCalculatorForm.tsx             # UPDATE - Add boxTypeId field
└── lib/
    └── storage-cost-utils.ts               # UPDATE - Handle Pallets formula
```

### Type Definitions

```typescript
// src/types/price-calculator.ts

/** Wildberries box/delivery types */
export type BoxTypeId = 2 | 5 | 6

export interface BoxTypeInfo {
  id: BoxTypeId
  name: string
  nameRu: string
  icon: string
  description: string
  storageFormula: 'standard' | 'fixed'
}

export const BOX_TYPES: Record<BoxTypeId, BoxTypeInfo> = {
  2: {
    id: 2,
    name: 'Boxes',
    nameRu: 'Коробки',
    icon: '📦',
    description: 'Стандартная поставка в коробках',
    storageFormula: 'standard',
  },
  5: {
    id: 5,
    name: 'Pallets',
    nameRu: 'Монопаллеты',
    icon: '🔲',
    description: 'Поставка на паллетах (фикс. ставка хранения)',
    storageFormula: 'fixed',
  },
  6: {
    id: 6,
    name: 'Supersafe',
    nameRu: 'Суперсейф',
    icon: '🔒',
    description: 'Безопасное хранение ценных товаров',
    storageFormula: 'standard',
  },
}
```

### Box Type Selector Component

```typescript
// src/components/custom/price-calculator/BoxTypeSelector.tsx

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BOX_TYPES, type BoxTypeId } from '@/types/price-calculator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface BoxTypeSelectorProps {
  value: BoxTypeId
  onChange: (value: BoxTypeId) => void
  availableTypes: BoxTypeId[]
  disabled?: boolean
}

export function BoxTypeSelector({
  value,
  onChange,
  availableTypes,
  disabled,
}: BoxTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="box-type">Тип доставки</Label>
      <Select
        value={String(value)}
        onValueChange={(v) => onChange(Number(v) as BoxTypeId)}
        disabled={disabled}
      >
        <SelectTrigger id="box-type">
          <SelectValue placeholder="Выберите тип" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(BOX_TYPES).map((boxType) => {
            const isAvailable = availableTypes.includes(boxType.id)
            return (
              <Tooltip key={boxType.id}>
                <TooltipTrigger asChild>
                  <SelectItem
                    value={String(boxType.id)}
                    disabled={!isAvailable}
                    className={!isAvailable ? 'opacity-50' : ''}
                  >
                    <span className="flex items-center gap-2">
                      <span>{boxType.icon}</span>
                      <span>{boxType.nameRu}</span>
                      {boxType.storageFormula === 'fixed' && (
                        <Badge variant="outline" className="text-xs">фикс.</Badge>
                      )}
                    </span>
                  </SelectItem>
                </TooltipTrigger>
                {!isAvailable && (
                  <TooltipContent>
                    Недоступно на этом складе
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </SelectContent>
      </Select>

      {BOX_TYPES[value].storageFormula === 'fixed' && (
        <p className="text-sm text-muted-foreground">
          {BOX_TYPES[value].icon} Хранение не зависит от объёма товара
        </p>
      )}
    </div>
  )
}
```

### Storage Formula Update

```typescript
// src/lib/storage-cost-utils.ts - UPDATE

import { BOX_TYPES, type BoxTypeId } from '@/types/price-calculator'

/**
 * Calculate daily storage cost with box type awareness
 * @param volumeLiters Product volume
 * @param tariff Storage tariff
 * @param boxTypeId Box type (affects formula for Pallets)
 */
export function calculateDailyStorageCost(
  volumeLiters: number,
  tariff: NormalizedStorageTariffs,
  boxTypeId: BoxTypeId = 2
): number {
  if (volumeLiters <= 0) return 0

  const boxType = BOX_TYPES[boxTypeId]

  // Pallets use fixed rate (volume-independent)
  if (boxType.storageFormula === 'fixed') {
    return tariff.baseLiterRub * tariff.coefficient
  }

  // Standard formula: base + (volume-1) * additional
  const additionalLiters = Math.max(0, volumeLiters - 1)
  const baseCost = tariff.baseLiterRub + additionalLiters * tariff.additionalLiterRub
  return baseCost * tariff.coefficient
}
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Склад и доставка                                           │
├─────────────────────────────────────────────────────────────┤
│  Склад WB:                                                  │
│  [Краснодар (Тихорецкая) ▼]                                │
│                                                             │
│  Тип доставки:                                              │
│  [📦 Коробки ▼]                                             │
│                                                             │
│    📦 Коробки           ← Available                        │
│    🔲 Монопаллеты [фикс.] ← Available                       │
│    🔒 Суперсейф         ← Disabled: Недоступно              │
│                                                             │
│  Дата сдачи товара:  [27.01.2026 ▼]  Коэф.: ×1.65          │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Тарифы (Монопаллеты):                                   │ │
│  │   Логистика: (75 + 23×(V-1)) × 1.65                     │ │
│  │   Хранение: 41.25 × 1.65 = 68.06 ₽/день                 │ │
│  │   (фиксированная ставка для паллет)                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Invariants & Edge Cases

| Scenario                      | Expected Behavior                                          |
| ----------------------------- | ---------------------------------------------------------- |
| No warehouse selected         | Box type selector disabled, shows "Сначала выберите склад" |
| Warehouse supports only Boxes | Pallets/Supersafe disabled in dropdown                     |
| Warehouse changed             | Reset boxType to default (Boxes) if current not available  |
| Pallets selected              | Storage formula uses fixed rate (no additionalLiterRub)    |
| Volume changed with Pallets   | Logistics updates, storage stays same                      |
| Date changed                  | Refetch tariffs for selected boxType + date                |
| API returns no box types      | Show error, allow manual tariff entry                      |

---

## Test Scenarios

### Unit Tests

| Test                   | Input                                           | Expected                     |
| ---------------------- | ----------------------------------------------- | ---------------------------- |
| Storage - Boxes, 1L    | vol=1, boxType=2, base=10, add=5, coef=1.5      | 15.00                        |
| Storage - Boxes, 3L    | vol=3, boxType=2, base=10, add=5, coef=1.5      | 30.00                        |
| Storage - Pallets, 1L  | vol=1, boxType=5, base=41.25, add=0, coef=1.65  | 68.06                        |
| Storage - Pallets, 3L  | vol=3, boxType=5, base=41.25, add=0, coef=1.65  | 68.06 (same!)                |
| Storage - Pallets, 10L | vol=10, boxType=5, base=41.25, add=0, coef=1.65 | 68.06 (same!)                |
| Available types filter | API returns [2, 5]                              | Only Boxes & Pallets enabled |

### Integration Tests

| Test                       | Scenario                                     | Expected                             |
| -------------------------- | -------------------------------------------- | ------------------------------------ |
| Select Pallets             | Warehouse + Pallets boxType                  | Storage shows fixed rate             |
| Volume change with Pallets | Change volume 1L → 5L                        | Storage unchanged, logistics updates |
| Warehouse change           | Change warehouse with different availability | BoxType resets if unavailable        |
| Date change                | Change date                                  | Refetches tariffs for boxType        |

### E2E Tests

| Test                | Flow                                 | Verification             |
| ------------------- | ------------------------------------ | ------------------------ |
| Full flow - Boxes   | Select warehouse, Boxes, calculate   | Standard storage formula |
| Full flow - Pallets | Select warehouse, Pallets, calculate | Fixed storage formula    |
| Unavailable type    | Select warehouse without Supersafe   | Supersafe disabled       |

---

## Observability

- **Analytics**: Track box type selection distribution
- **Metrics**: Pallets usage rate (expect ~5-10%)
- **Logs**: Log box type changes with warehouse context

---

## Security

- **Input Validation**: boxTypeId validated against enum [2, 5, 6]
- **API Injection Prevention**: boxTypeId passed as number, not string

---

## Accessibility (WCAG 2.1 AA)

- [ ] Box type selector has associated label
- [ ] Disabled items explained via tooltip
- [ ] Icon + text for each option (not icon-only)
- [ ] Keyboard navigable dropdown
- [ ] Color contrast >= 4.5:1

---

## Definition of Done

- [ ] BoxTypeId type and constants defined
- [ ] BoxTypeSelector component created
- [ ] API integration filters by boxTypeId
- [ ] Storage formula updated for Pallets
- [ ] Unavailable types disabled in dropdown
- [ ] Auto-reset on warehouse change
- [ ] Unit tests written (>90% coverage)
- [ ] Integration tests for Pallets scenario
- [ ] E2E test for box type selection
- [ ] No ESLint errors
- [ ] Accessibility audit passed
- [ ] Code review completed

---

## Related Documentation

- **Analysis**: `docs/stories/epic-44/ANALYSIS-PRICE-CALCULATOR-SYNC-2026-01-26.md`
- **Backend API**: `docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md`
- **Story 44.40**: Two Tariff Systems Integration
- **Story 44.41**: Storage Tariff Fix

---

**Created**: 2026-01-26
**Author**: PM (Box Type Support)
**Backend Reference**: Request #98 - Box Types section

# Story 44.27-FE: Warehouse & Coefficients Integration

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: ✅ Complete
**Priority**: P0 - CRITICAL (Blocks real price calculation)
**Effort**: 2 SP
**Completed**: 2026-01-23
**Depends On**: Story 44.12 (Warehouse Selection) ✅, Story 44.13 (Auto-fill Coefficients) ✅

---

## Background

**Проблема пользователя:**
> "У нас на нашей странице все так же не внедрено и отсутствует возможность выбора склада, куда товар будет отгружен. Также из-за этого не реализован функционал получения коэффициентов для хранения в случае ФБО и для логистики в обоих случаях."

**Текущее состояние:**
- ✅ `WarehouseSelect.tsx` - создан и работает
- ✅ `WarehouseSection.tsx` - создан, включает коэффициенты и хранение
- ✅ `useWarehouseCoefficients.ts` - hook для получения коэффициентов
- ✅ `useAcceptanceCoefficients.ts` - API hook для backend
- ❌ **НЕ интегрировано в `PriceCalculatorForm.tsx`**

**Бизнес-логика коэффициентов:**
1. **Базовая ставка** - единая для всех складов (backend знает)
2. **Коэффициент склада** - повышающий/понижающий множитель (100 = 1.0, 125 = 1.25)
3. **Итоговая ставка** = Базовая × Коэффициент
4. **Применяется к**:
   - Хранение (только ФБО)
   - Логистика доставки (ФБО и ФБС)
   - Логистика возврата (ФБО и ФБС)

---

## User Story

**As a** Seller,
**I want** to select a warehouse and see auto-filled coefficients for logistics and storage in the price calculator,
**So that** I can get accurate price calculations based on actual WB tariffs for my chosen fulfillment warehouse.

**Non-goals**:
- Warehouse recommendation based on location
- Multiple warehouse comparison
- Warehouse capacity/availability indicators
- Real-time warehouse status updates

---

## Acceptance Criteria

### AC1: WarehouseSection Integration
- [x] Add `WarehouseSection` component to `PriceCalculatorForm.tsx`
- [x] Place after `FulfillmentTypeSelector`, before `CategorySelector`
- [x] Pass required props: `warehouseId`, `storageDays`, `volumeLiters`, `fulfillmentType`
- [x] Component visible in both FBO and FBS modes

### AC2: Form State for Warehouse
- [x] Add form state: `warehouseId: number | null`
- [x] Add form state: `warehouseName: string | null`
- [x] Add form state: `turnover_days: number` (default: 20) - storage duration in days
- [x] Add form state: `storageRub: number` (calculated as `dailyStorageCost × turnover_days`)
- [x] Add form state: `logisticsCoefficient: number` (default: 1.0)
- [x] Add form state: `storageCoefficient: number` (default: 1.0)

### AC3: Volume Calculation for Warehouse
- [x] Calculate volume from dimensions: `(length × width × height) / 1000` liters
- [x] Pass calculated volume to `WarehouseSection`
- [x] Volume updates in real-time as dimensions change
- [x] Minimum volume: 0.1 liters (validation)

### AC4: Coefficient Application to Logistics
- [x] When coefficients auto-fill, recalculate logistics costs
- [x] Forward logistics: `base_tariff × logistics_coefficient`
- [x] Return logistics: `base_tariff × logistics_coefficient × return_rate`
- [x] Show coefficient impact in logistics breakdown

### AC5: Storage Cost Integration (FBO only)
- [x] Calculate `storage_rub` as: `dailyStorageCost × turnover_days`
- [x] `dailyStorageCost` comes from warehouse tariffs (`boxStorageBase` + volume calculation)
- [x] `turnover_days` input handled by `TurnoverDaysInput` component (Story 44.32)
- [x] Pass storage cost to API request
- [x] Hide storage section when FBS mode selected

### AC6: Delivery Date Selection (Story 44.26a)
- [x] When warehouse selected, show delivery date picker
- [x] Calendar shows 14-day coefficient preview
- [x] Selected date determines which coefficient applies
- [x] Default: tomorrow or first available date with coefficient > 0

### AC7: API Request Integration
- [x] Include `warehouse_id` in API request (if selected)
- [x] Include `logistics_coefficient` in API request
- [x] Include `storage_coefficient` in API request (FBO)
- [x] Include `storage_rub` calculated value
- [x] Backend uses coefficients in price calculation

---

## API Contract

### Backend Endpoints Used

**1. Get Warehouses List** (Story 44.12)
```http
GET /v1/tariffs/warehouses
Authorization: Bearer {token}
X-Cabinet-Id: {cabinet_id}
```

**Response:**
```json
{
  "data": {
    "warehouseList": [
      {
        "warehouseID": 507,
        "warehouseName": "Коледино",
        "boxDeliveryBase": "48*1",
        "boxDeliveryLiter": "5*x",
        "boxStorageBase": "1*1",
        "boxStorageLiter": "1*x"
      }
    ]
  }
}
```

**2. Get Acceptance Coefficients** (Story 44.13)
```http
GET /v1/tariffs/acceptance/coefficients?warehouseId=507
Authorization: Bearer {token}
X-Cabinet-Id: {cabinet_id}
```

**Response:**
```json
{
  "data": {
    "warehouseId": 507,
    "warehouseName": "Коледино",
    "coefficients": [
      { "date": "2026-01-22", "coefficient": 100 },
      { "date": "2026-01-23", "coefficient": 125 },
      { "date": "2026-01-24", "coefficient": 150 }
    ],
    "effectiveFrom": "2026-01-22T00:00:00Z",
    "effectiveUntil": "2026-02-05T00:00:00Z"
  }
}
```

**Coefficient Normalization:**
```typescript
const normalizedCoefficient = rawCoefficient / 100
// 100 → 1.0, 125 → 1.25, 150 → 1.5
```

---

## Implementation Notes

### Files to Modify

```
src/components/custom/price-calculator/
├── PriceCalculatorForm.tsx           # UPDATE - Add WarehouseSection
├── usePriceCalculatorForm.ts         # UPDATE - Add warehouse state
└── priceCalculatorUtils.ts           # UPDATE - Add warehouse to API request
```

### Form State Updates

```typescript
// usePriceCalculatorForm.ts - Add to FormData

export interface FormData {
  // ... existing fields

  // Warehouse & Coefficients (Story 44.27)
  warehouse_id: number | null
  warehouse_name: string | null
  turnover_days: number          // Storage duration (replaces storage_days)
  logistics_coefficient: number
  storage_coefficient: number
  delivery_date: string | null
}

export const defaultFormValues: FormData = {
  // ... existing defaults

  warehouse_id: null,
  warehouse_name: null,
  turnover_days: 20,             // Default 20 days (WB typical inventory turnover)
  logistics_coefficient: 1.0,
  storage_coefficient: 1.0,
  delivery_date: null,
}
```

> **Note (2026-01-24)**: The `storage_days` field was renamed to `turnover_days` as part of the
> unified storage approach in Story 44.32. Storage cost is calculated as:
> `storage_rub = dailyStorageCost × turnover_days`

### PriceCalculatorForm Integration

```typescript
// PriceCalculatorForm.tsx - Add after FulfillmentTypeSelector

import { WarehouseSection } from './WarehouseSection'
import { TurnoverDaysInput } from './TurnoverDaysInput'  // Story 44.32

// Add state
const [warehouseId, setWarehouseId] = useState<number | null>(null)
const [turnoverDays, setTurnoverDays] = useState(20)   // Default 20 days
const [storageRub, setStorageRub] = useState(0)

// Calculate volume from dimensions
const volumeLiters = useMemo(() => {
  const length = lengthCm || 0
  const width = widthCm || 0
  const height = heightCm || 0
  if (length <= 0 || width <= 0 || height <= 0) return 0
  return (length * width * height) / 1000
}, [lengthCm, widthCm, heightCm])

// Calculate daily storage cost from warehouse tariffs
const dailyStorageCost = useMemo(() => {
  if (!warehouseData) return 0
  // Parse tariff: boxStorageBase (e.g., "1*1") + boxStorageLiter × volume
  return calculateDailyStorageCost(volumeLiters, warehouseData)
}, [volumeLiters, warehouseData])

// In form JSX, after FulfillmentTypeSelector:
<WarehouseSection
  warehouseId={warehouseId}
  onWarehouseChange={(id, warehouse) => {
    setWarehouseId(id)
    setValue('warehouse_id', id)
    setValue('warehouse_name', warehouse?.name ?? null)
  }}
  volumeLiters={volumeLiters}
  disabled={disabled}
  fulfillmentType={fulfillmentType}
  onDeliveryDateChange={(date, coefficient) => {
    setValue('delivery_date', date)
    setValue('logistics_coefficient', coefficient)
  }}
/>

{/* TurnoverDaysInput handles storage duration (Story 44.32) */}
{fulfillmentType === 'FBO' && (
  <TurnoverDaysInput
    control={control}
    storagePerDay={dailyStorageCost}
    onStorageChange={(totalStorage) => {
      setStorageRub(totalStorage)
      setValue('storage_rub', totalStorage)
    }}
  />
)}
```

> **Note (2026-01-24)**: Storage calculation is now handled by `TurnoverDaysInput` component.
> The formula is: `storage_rub = dailyStorageCost × turnover_days`
> See Story 44.32 for `TurnoverDaysInput` implementation details.

### API Request Update

```typescript
// priceCalculatorUtils.ts - toApiRequest function

export function toApiRequest(data: FormData): PriceCalculatorRequest {
  return {
    // ... existing fields

    // Warehouse & Coefficients (Story 44.27)
    warehouse_id: data.warehouse_id ?? undefined,
    logistics_coefficient: data.logistics_coefficient,
    storage_coefficient: data.storage_coefficient,
    storage_rub: data.storage_rub,
    delivery_date: data.delivery_date ?? undefined,
  }
}
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Калькулятор цены                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [FBO] [FBS]                           ← FulfillmentTypeSelector
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🏭 Склад и хранение                                  │   │ ← NEW!
│  │                                                       │   │
│  │ Склад WB: [Коледино ▼]                               │   │
│  │                                                       │   │
│  │ Дата отгрузки: [22.01.2026 ▼]  Коэфф: 1.25          │   │
│  │                                                       │   │
│  │ Коэфф. логистики: 1.25 [Автозаполнено]              │   │
│  │ Коэфф. хранения:  1.00 [Автозаполнено]              │   │
│  │                                                       │   │
│  │ Оборачиваемость: [20] дней                            │   │ ← FBO only (TurnoverDaysInput)
│  │ Хранение за период: 2,38 ₽                           │   │ ← dailyStorageCost × turnover_days
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Поиск товара]                        ← ProductSearchSelect
│  [Категория]                           ← CategorySelector
│  [Габариты]                            ← DimensionInputSection
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Invariants & Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| No warehouse selected | Coefficients = 1.0, storage manual input |
| Warehouse API error | Show error, allow manual coefficient entry |
| FBS mode | Hide storage section, show logistics coefficient only |
| FBO mode | Show storage section + storage coefficient |
| Volume = 0 | Show "Введите габариты" warning, storage = 0 |
| Coefficient > 2.0 | Allow but show warning about high cost |
| Warehouse cleared | Reset all coefficients to 1.0 |
| Delivery date unavailable | Use first available date with coefficient > 0 |

---

## Observability

- **Analytics**: Track warehouse selection frequency by ID
- **Metrics**: Coefficient distribution (how often > 1.0)
- **Logs**: Log coefficient auto-fill events, manual overrides

---

## Security

- **Input Validation**: Warehouse ID validated as integer
- **XSS Prevention**: Warehouse names displayed as text
- **Authentication**: API requires Bearer token and Cabinet ID

---

## Accessibility (WCAG 2.1 AA)

- [ ] Warehouse dropdown has role="combobox" with aria-expanded
- [ ] Coefficient fields have associated labels
- [ ] Storage section announced when visibility changes
- [ ] Delivery date calendar keyboard navigable
- [ ] Color contrast ≥ 4.5:1 for all text
- [ ] Focus trap within dropdown when open

---

## Test Scenarios

### Unit Tests

| Test | Input | Expected |
|------|-------|----------|
| Volume calculation | 30×20×10 cm | 6.0 liters |
| Coefficient normalization | 125 | 1.25 |
| Storage cost | 6L, 14 days, coeff 1.0 | calculated value |

### Integration Tests

| Test | Scenario | Expected |
|------|----------|----------|
| Warehouse select | Select Коледино | Coefficients auto-fill |
| Mode switch | FBO → FBS | Storage section hides |
| Dimension change | Update height | Volume recalculates |
| API request | Submit form | Request includes warehouse_id |

### E2E Tests

| Test | Scenario | Expected |
|------|----------|----------|
| Full flow | Select warehouse, enter data, calculate | Price includes coefficients |
| No warehouse | Calculate without warehouse | Works with default 1.0 |

---

## Dev Agent Record

### File List

| File | Change Type | Lines (Est.) | Description |
|------|-------------|--------------|-------------|
| `PriceCalculatorForm.tsx` | UPDATE | +50 | Add WarehouseSection integration |
| `usePriceCalculatorForm.ts` | UPDATE | +20 | Add warehouse form state |
| `priceCalculatorUtils.ts` | UPDATE | +10 | Add warehouse to API request |

### Change Log
_(To be filled during implementation)_

### Review Follow-ups
_(To be filled after code review)_

---

## Definition of Done

- [ ] All Acceptance Criteria verified (AC1-AC7)
- [ ] WarehouseSection visible in form
- [ ] Coefficients auto-fill on warehouse selection
- [ ] Storage calculation works for FBO
- [ ] API request includes warehouse data
- [ ] Unit tests passing
- [ ] E2E test for warehouse flow
- [ ] No ESLint errors
- [ ] Accessibility audit passed
- [ ] Code review completed
- [ ] QA Gate passed

---

## QA Checklist

### Functional Verification

| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| WarehouseSection visible | Shows in form | [ ] |
| Select warehouse | Coefficients auto-fill | [ ] |
| FBO mode | Storage section visible | [ ] |
| FBS mode | Storage section hidden | [ ] |
| Change dimensions | Volume updates | [ ] |
| Submit form | Request includes warehouse | [ ] |
| Clear warehouse | Coefficients reset to 1.0 | [ ] |

### Accessibility Verification

| Check | Status |
|-------|--------|
| Keyboard navigation | [ ] |
| Screen reader | [ ] |
| Color contrast | [ ] |
| Focus management | [ ] |

---

**Created**: 2026-01-21
**Last Updated**: 2026-01-21
**Unblocked**: Yes (all dependencies complete)

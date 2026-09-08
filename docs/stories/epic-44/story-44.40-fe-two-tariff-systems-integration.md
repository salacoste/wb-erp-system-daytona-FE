# Story 44.40-FE: Two Tariff Systems Integration (CRITICAL)

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 📋 Ready for Dev
**Priority**: P0 - CRITICAL (Fixes incorrect tariff usage)
**Effort**: 5 SP
**Created**: 2026-01-26
**Depends On**:

- Story 44.12 ✅ (Warehouse Selection)
- Story 44.13 ✅ (Auto-fill Coefficients)
- Story 44.26a 📋 (Delivery Date Selection)
- Story 44.27 ✅ (Warehouse Integration)

---

## Background

**CRITICAL DISCOVERY**: Wildberries has TWO different tariff systems:

| System        | Purpose                 | Endpoint                                  | Use Case                              |
| ------------- | ----------------------- | ----------------------------------------- | ------------------------------------- |
| **INVENTORY** | Current actual costs    | `/v1/tariffs/warehouses-with-tariffs`     | Financial reports, margin calculation |
| **SUPPLY**    | 14-day forward planning | `/v1/tariffs/acceptance/coefficients/all` | Delivery planning, cost estimation    |

**Current Problem**: The Price Calculator currently uses INVENTORY system tariffs statically, but when a user selects a **FUTURE delivery date**, ALL tariffs (baseLiterRub, additionalLiterRub, coefficients) MUST come from the **SUPPLY system** for that specific date.

**Why This Matters**:

- Supply tariffs are typically HIGHER than Inventory tariffs (conservative estimates)
- Marketplace UI shows Supply rates; our calculator shows Inventory rates
- Without this fix, cost estimates for future deliveries are INACCURATE

---

## User Story

**As a** Seller,
**I want** the Price Calculator to use the correct tariff system based on my selected delivery date,
**So that** I get accurate cost estimates - current costs for today, or planning rates for future deliveries.

**Non-goals**:

- Historical tariff lookup (out of scope)
- Tariff comparison UI (future enhancement)
- Automatic tariff system selection guidance

---

## Acceptance Criteria

### AC1: Tariff System Selection Logic

- [ ] When **NO delivery date** selected OR date is **TODAY**: Use **INVENTORY** system
- [ ] When delivery date is **TOMORROW or later**: Use **SUPPLY** system
- [ ] On delivery date change: Automatically refresh tariffs from correct system
- [ ] Show indicator of which tariff system is active: "Текущие тарифы" / "Тарифы на дату поставки"

### AC2: SUPPLY System Data Structure

- [ ] Create new type `SupplyDateTariffs` with full tariff data per date:
  ```typescript
  interface SupplyDateTariffs {
    date: string
    warehouseId: number
    warehouseName: string
    coefficient: number        // -1 = unavailable, 0 = free, ≥1 = cost
    isAvailable: boolean
    allowUnload: boolean
    boxTypeId: number
    delivery: {
      coefficient: number
      baseLiterRub: number     // CRITICAL: Must use this for future dates
      additionalLiterRub: number  // CRITICAL: Must use this for future dates
    }
    storage: {
      coefficient: number
      baseLiterRub: number     // CRITICAL: Must use this for future dates
      additionalLiterRub: number
    }
  }
  ```
- [ ] Parse `/acceptance/coefficients/all` response to extract full tariff data
- [ ] Store date-specific tariffs in state

### AC3: DeliveryDateState Enhancement

- [ ] Update `DeliveryDateState` to include full tariff data:
  ```typescript
  interface DeliveryDateState {
    date: string | null
    coefficient: number
    formattedDate: string
    status: 'base' | 'elevated' | 'high' | 'peak' | 'unavailable'
    tariffSystem: 'inventory' | 'supply'  // NEW
    tariffs: {                             // NEW - from SUPPLY system
      delivery: {
        coefficient: number
        baseLiterRub: number
        additionalLiterRub: number
      }
      storage: {
        coefficient: number
        baseLiterRub: number
        additionalLiterRub: number
      }
    } | null
  }
  ```

### AC4: WarehouseSection Tariff Display

- [ ] When delivery date selected (future), display SUPPLY tariffs for that date
- [ ] Show tooltip: "Тарифы на {date} (планирование поставки)"
- [ ] When delivery date is TODAY or not set, display INVENTORY tariffs
- [ ] Show tooltip: "Текущие тарифы (фактические расходы)"
- [ ] Visual distinction: Use badge "📅 Тарифы на дату" vs "📊 Текущие тарифы"

### AC5: Coefficient Calendar Enhancement

- [ ] Show full tariff preview on hover:
  - Date
  - Coefficient (as ×1.25 format)
  - Base logistics cost for 1L
  - Storage cost per day
- [ ] Color coding remains same (green/yellow/orange/red/gray)
- [ ] Tooltip format:
  ```
  21 января 2026
  Коэффициент: ×1.25
  Логистика: 46 + 14×(V-1) ₽
  Хранение: 0.07 + 0.05×V ₽/день
  ```

### AC6: API Hook Updates

- [ ] Update `useAcceptanceCoefficients` to return full tariff data (not just coefficient)
- [ ] Add `useSupplyTariffsByDate(warehouseId, date)` hook
- [ ] Add `useTariffSystem(deliveryDate)` hook that returns 'inventory' | 'supply'

### AC7: Calculation Integration

- [ ] When calculating logistics forward cost:
  - If tariffSystem = 'supply': use `delivery.baseLiterRub` and `delivery.additionalLiterRub` from SUPPLY
  - If tariffSystem = 'inventory': use existing warehouse tariffs
- [ ] When calculating storage cost:
  - If tariffSystem = 'supply': use `storage.baseLiterRub` and `storage.additionalLiterRub` from SUPPLY
  - If tariffSystem = 'inventory': use existing warehouse tariffs
- [ ] Formula must use tariff-system-specific coefficients

### AC8: UI Indicators

- [ ] Show active tariff system in form header:
  - 📊 "Текущие тарифы (Inventory)" - for today/no date
  - 📅 "Тарифы на 21.01.2026 (Supply)" - for future date
- [ ] Show info tooltip explaining the difference
- [ ] Visual indicator (blue badge for supply, gray for inventory)

---

## API Contract

### INVENTORY System (Current Costs)

**Endpoint**: `GET /v1/tariffs/warehouses-with-tariffs`

**When to use**:

- No delivery date selected
- Delivery date is TODAY
- Financial reporting / margin calculation

**Response Structure**:

```json
{
  "data": {
    "warehouses": [{
      "id": 507,
      "name": "Краснодар",
      "tariffs": {
        "fbo": {
          "delivery_base_rub": 46.0,
          "delivery_liter_rub": 14.0,
          "logistics_coefficient": 1.2
        },
        "storage": {
          "base_per_day_rub": 0.07,
          "liter_per_day_rub": 0.05,
          "coefficient": 1.0
        }
      }
    }]
  }
}
```

### SUPPLY System (Planning)

**Endpoint**: `GET /v1/tariffs/acceptance/coefficients/all`

**When to use**:

- Delivery date is TOMORROW or later (14-day window)
- Supply planning
- Cost estimation for future deliveries

**Response Structure**:

```json
{
  "coefficients": [{
    "warehouseId": 507,
    "warehouseName": "Краснодар",
    "date": "2026-01-27",
    "coefficient": 1,
    "isAvailable": true,
    "allowUnload": true,
    "boxTypeId": 2,
    "delivery": {
      "coefficient": 1.2,
      "baseLiterRub": 46.0,
      "additionalLiterRub": 14.0
    },
    "storage": {
      "coefficient": 1.0,
      "baseLiterRub": 0.07,
      "additionalLiterRub": 0.05
    }
  }]
}
```

**Rate Limits**:

- Inventory: 10 req/min
- Supply: **6 req/min** (stricter!)

**Cache**:

- Both systems: 1 hour TTL

---

## Implementation Notes

### File Structure

```
src/
├── types/
│   └── tariffs.ts                           # UPDATE - Add SupplyDateTariffs type
├── hooks/
│   ├── useWarehousesWithTariffs.ts          # EXISTS - INVENTORY system
│   ├── useAcceptanceCoefficients.ts         # UPDATE - Return full tariff data
│   ├── useSupplyTariffsByDate.ts            # CREATE - Get tariffs for specific date
│   └── useTariffSystem.ts                   # CREATE - Determine which system to use
├── components/custom/price-calculator/
│   ├── DeliveryDatePicker.tsx               # UPDATE - Store full tariff data
│   ├── CoefficientCalendar.tsx              # UPDATE - Show tariff preview on hover
│   ├── WarehouseSection.tsx                 # UPDATE - Display system-specific tariffs
│   ├── TariffSystemIndicator.tsx            # CREATE - Show active tariff system
│   └── PriceCalculatorForm.tsx              # UPDATE - Use correct tariff system
└── lib/
    └── tariff-system-utils.ts               # CREATE - Tariff system selection logic
```

### New Types

```typescript
// src/types/tariffs.ts

/** Supply system tariff data per date */
export interface SupplyDateTariffs {
  date: string
  warehouseId: number
  warehouseName: string
  coefficient: number
  isAvailable: boolean
  allowUnload: boolean
  boxTypeId: number
  boxTypeName: string
  delivery: {
    coefficient: number
    baseLiterRub: number
    additionalLiterRub: number
  }
  storage: {
    coefficient: number
    baseLiterRub: number
    additionalLiterRub: number
  }
  isSortingCenter: boolean
}

/** Active tariff system */
export type TariffSystem = 'inventory' | 'supply'

/** Enhanced delivery date state with tariffs */
export interface EnhancedDeliveryDateState {
  date: string | null
  coefficient: number
  formattedDate: string
  status: 'base' | 'elevated' | 'high' | 'peak' | 'unavailable'
  tariffSystem: TariffSystem
  supplyTariffs: SupplyDateTariffs | null
}
```

### Tariff System Selection Logic

```typescript
// src/lib/tariff-system-utils.ts

import { TariffSystem } from '@/types/tariffs'

/**
 * Determine which tariff system to use based on delivery date
 *
 * @param deliveryDate - Selected delivery date (ISO string) or null
 * @returns 'inventory' for today/no date, 'supply' for future dates
 */
export function determineTariffSystem(deliveryDate: string | null): TariffSystem {
  if (!deliveryDate) return 'inventory'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const delivery = new Date(deliveryDate)
  delivery.setHours(0, 0, 0, 0)

  // If delivery is today or earlier, use inventory (actual costs)
  if (delivery <= today) return 'inventory'

  // If delivery is tomorrow or later, use supply (planning rates)
  return 'supply'
}

/**
 * Check if date is within SUPPLY system's 14-day window
 */
export function isDateInSupplyWindow(date: string): boolean {
  const today = new Date()
  const targetDate = new Date(date)
  const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 1 && diffDays <= 14
}

/**
 * Get human-readable tariff system label
 */
export function getTariffSystemLabel(system: TariffSystem, date?: string): string {
  if (system === 'inventory') {
    return 'Текущие тарифы (фактические расходы)'
  }
  return date
    ? `Тарифы на ${formatDate(date)} (планирование поставки)`
    : 'Тарифы на дату поставки'
}
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                       USER ACTIONS                                   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. SELECT WAREHOUSE                                                 │
│     └── Fetch INVENTORY tariffs (current costs)                      │
│         └── GET /v1/tariffs/warehouses-with-tariffs                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. SELECT DELIVERY DATE (optional)                                  │
│     ├── IF date = TODAY or NULL:                                     │
│     │   └── Use INVENTORY tariffs (already loaded)                   │
│     │       └── indicator: "📊 Текущие тарифы"                       │
│     │                                                                │
│     └── IF date = TOMORROW+ (within 14 days):                        │
│         └── Fetch SUPPLY tariffs for that date                       │
│             └── GET /v1/tariffs/acceptance/coefficients/all          │
│             └── Filter by warehouseId + date                         │
│             └── Use delivery.baseLiterRub, delivery.additionalLiterRub│
│             └── indicator: "📅 Тарифы на 21.01.2026"                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. CALCULATE COSTS                                                  │
│     ├── tariffSystem = 'inventory':                                  │
│     │   └── logistics = warehouse.tariffs.fbo.delivery_base_rub      │
│     │   └── storage = warehouse.tariffs.storage.base_per_day_rub     │
│     │                                                                │
│     └── tariffSystem = 'supply':                                     │
│         └── logistics = supplyTariffs.delivery.baseLiterRub          │
│         └── storage = supplyTariffs.storage.baseLiterRub             │
└─────────────────────────────────────────────────────────────────────┘
```

### UI Layout - Tariff System Indicator

```
┌─────────────────────────────────────────────────────────────────────┐
│  Калькулятор цены                                                    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 📊 Текущие тарифы                                          [?] │ │
│  │ Фактические расходы на сегодня                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  -- OR when future date selected --                                  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 📅 Тарифы на 27 января 2026                                [?] │ │
│  │ Тарифы планирования поставки (SUPPLY)                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  [FBO] [FBS]                                                         │
│                                                                      │
│  Склад WB: [Краснодар ▼]                                            │
│                                                                      │
│  Дата сдачи товара: [27.01.2026 ▼]  Коэффициент: ×1.25             │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Тарифы на выбранную дату:                                       │ │
│  │   Логистика: 46 + 14×(V-1) ₽                                    │ │
│  │   Коэфф. логистики: ×1.2                                        │ │
│  │   Хранение: 0.07 + 0.05×V ₽/день                                │ │
│  │   Коэфф. хранения: ×1.0                                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ...                                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Invariants & Edge Cases

| Scenario                         | Expected Behavior                                                |
| -------------------------------- | ---------------------------------------------------------------- |
| No delivery date selected        | Use INVENTORY system, show "Текущие тарифы"                      |
| Delivery date = today            | Use INVENTORY system, show "Текущие тарифы"                      |
| Delivery date = tomorrow         | Use SUPPLY system, show "Тарифы на {date}"                       |
| Delivery date > 14 days          | Show warning "Дата за пределами 14-дневного окна", use INVENTORY |
| SUPPLY data unavailable for date | Show "Поставка недоступна", disable calculation                  |
| SUPPLY coefficient = -1          | Show "Недоступно", block date selection                          |
| SUPPLY coefficient = 0           | Show "Бесплатная приёмка", use 0 for acceptance cost             |
| Rate limit hit on SUPPLY         | Show cooldown, use cached data if available                      |
| Warehouse changed                | Reset delivery date, fetch new SUPPLY data                       |
| Date changed                     | Fetch SUPPLY tariffs for new date, update all calculations       |

---

## Test Scenarios

### Unit Tests

| Test                            | Input           | Expected                    |
| ------------------------------- | --------------- | --------------------------- |
| determineTariffSystem(null)     | No date         | 'inventory'                 |
| determineTariffSystem(today)    | Today's date    | 'inventory'                 |
| determineTariffSystem(tomorrow) | Tomorrow's date | 'supply'                    |
| determineTariffSystem(day+7)    | 7 days ahead    | 'supply'                    |
| determineTariffSystem(day+15)   | 15 days ahead   | 'inventory' (out of window) |
| isDateInSupplyWindow(tomorrow)  | Tomorrow        | true                        |
| isDateInSupplyWindow(day+14)    | 14 days         | true                        |
| isDateInSupplyWindow(day+15)    | 15 days         | false                       |

### Integration Tests

| Test                               | Scenario          | Expected                                        |
| ---------------------------------- | ----------------- | ----------------------------------------------- |
| Select warehouse only              | No date           | Uses INVENTORY tariffs                          |
| Select warehouse + today           | Date = today      | Uses INVENTORY tariffs                          |
| Select warehouse + tomorrow        | Date = tomorrow   | Fetches SUPPLY, uses SUPPLY tariffs             |
| Change date from today to tomorrow | Date changes      | Switches from INVENTORY to SUPPLY               |
| Change warehouse                   | Warehouse changes | Resets date, refetches SUPPLY for new warehouse |

### E2E Tests

| Test                | Flow                                     | Verification                          |
| ------------------- | ---------------------------------------- | ------------------------------------- |
| Full flow - current | Select warehouse, no date, calculate     | INVENTORY tariffs used in calculation |
| Full flow - future  | Select warehouse, future date, calculate | SUPPLY tariffs used in calculation    |
| Tariff indicator    | Select future date                       | Badge shows "📅 Тарифы на {date}"     |
| Unavailable date    | Select gray date                         | Error message, calculation blocked    |

---

## Observability

- **Analytics**: Track tariff system usage (inventory vs supply)
- **Metrics**: Rate limit hits on SUPPLY API
- **Logs**: Log tariff system switches with date context
- **Errors**: Track SUPPLY data fetch failures

---

## Security

- **Input Validation**: Dates validated within 14-day window
- **Rate Limiting**: Respect 6 req/min on SUPPLY endpoint
- **Authentication**: All requests require Bearer token + Cabinet ID

---

## Accessibility (WCAG 2.1 AA)

- [ ] Tariff system indicator has aria-label
- [ ] Date selection announces tariff system change
- [ ] Unavailable dates announced to screen readers
- [ ] Tariff tooltip accessible via keyboard
- [ ] Color contrast ≥ 4.5:1 for all indicators

---

## Definition of Done

- [ ] determineTariffSystem logic implemented and tested
- [ ] useSupplyTariffsByDate hook created
- [ ] DeliveryDateState enhanced with tariffs
- [ ] WarehouseSection displays correct tariff system
- [ ] CoefficientCalendar shows tariff preview
- [ ] TariffSystemIndicator component created
- [ ] Calculation uses correct tariff source
- [ ] Unit tests written (>90% coverage)
- [ ] Integration tests for tariff switching
- [ ] E2E test for full flow
- [ ] No ESLint errors
- [ ] Accessibility audit passed
- [ ] Code review completed

---

## Related Documentation

- **Two Tariff Systems Guide**: `docs/request-backend/108-two-tariff-systems-guide.md`
- **Backend Stories**: Epic 43, Stories 43.5, 43.9
- **API Reference**: Backend tariffs endpoints
- **Existing Stories**: 44.12, 44.13, 44.26a, 44.27

---

**Created**: 2026-01-26
**Author**: PM (Two Tariff Systems Integration)
**Backend Reference**: Request #108

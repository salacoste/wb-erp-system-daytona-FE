# Story 44.41-FE: Storage Tariff Zero Bug Fix

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 📋 Ready for Dev
**Priority**: P0 - CRITICAL (Calculation accuracy)
**Effort**: 3 SP
**Created**: 2026-01-26
**Depends On**:
- Story 44.12 ✅ (Warehouse Selection)
- Story 44.40 📋 (Two Tariff Systems Integration)
- Story 44.14 ⛔ DEPRECATED (Storage Cost Calculation - superseded by 44.32)

---

## Problem Statement

**CRITICAL BUG**: The Price Calculator UI displays "0.00 ₽/день" for storage costs, even though the backend SUPPLY API correctly returns non-zero storage tariffs.

### Evidence from Backend Documentation

**Backend returns** (from `docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md`):
```json
{
  "warehouseId": 130744,
  "warehouseName": "Краснодар (Тихорецкая)",
  "storage": {
    "coefficient": 1.65,
    "baseLiterRub": 41.25,        // <- CORRECT: Non-zero value!
    "additionalLiterRub": 0       // <- For Pallets only
  }
}
```

**Frontend displays**: "0.00 ₽/день" for storage

### Root Cause Hypotheses

1. **BoxTypeId Filtering**: Frontend may be filtering by `boxTypeId: 2` (Boxes), missing `boxTypeId: 5` (Pallets) with correct data
2. **Field Name Mismatch**: Frontend expecting `base_per_day_rub` but API returns `baseLiterRub`
3. **INVENTORY vs SUPPLY Confusion**: May be using INVENTORY system (returns 0) instead of SUPPLY
4. **Missing Data Extraction**: Not extracting `storage` object from acceptance coefficients response

---

## User Story

**As a** Seller,
**I want** the storage cost to display accurate tariff values from WB API,
**So that** I can trust the Price Calculator for accurate cost estimation.

**Non-goals**:
- Changing backend API structure
- Historical storage rate lookup
- Multi-warehouse storage comparison

---

## Acceptance Criteria

### AC1: Debug Storage Tariff Source

- [ ] Add console logging to identify which API response provides storage data
- [ ] Log the exact `baseLiterRub` and `additionalLiterRub` values received
- [ ] Verify field names match between API response and frontend types
- [ ] Document which tariff system (INVENTORY vs SUPPLY) is being used

### AC2: Fix Field Name Mapping

- [ ] Update storage tariff extraction to handle both naming conventions:
  - INVENTORY system: `base_per_day_rub`, `liter_per_day_rub`
  - SUPPLY system: `baseLiterRub`, `additionalLiterRub`
- [ ] Create unified tariff extraction function:
  ```typescript
  function extractStorageTariffs(response): StorageTariffs {
    // Handle both naming conventions
    return {
      baseLiterRub: response.baseLiterRub ?? response.base_per_day_rub ?? 0,
      additionalLiterRub: response.additionalLiterRub ?? response.liter_per_day_rub ?? 0,
      coefficient: response.coefficient ?? 1.0
    }
  }
  ```

### AC3: Apply Backend Fallback Logic

- [ ] If storage tariffs are still 0 after extraction, apply backend fallback:
  ```typescript
  const DEFAULT_STORAGE_TARIFFS = {
    baseLiterRub: 0.11,        // From WbTariffSettings.storage_box_base_per_day
    additionalLiterRub: 0.11,  // From WbTariffSettings.storage_box_liter_per_day
    coefficient: 1.0
  }
  ```
- [ ] Show indicator when using fallback values: "Используются стандартные тарифы"
- [ ] Log fallback activation for monitoring

### AC4: Verify SUPPLY System Usage

- [ ] Confirm SUPPLY API is being called when delivery date selected
- [ ] Verify storage tariffs from SUPPLY response are extracted:
  ```typescript
  // From /v1/tariffs/acceptance/coefficients/all response
  const storageTariffs = coefficient.storage
  // NOT from /v1/tariffs/warehouses-with-tariffs
  ```
- [ ] Update Story 44.40 integration to pass storage tariffs correctly

### AC5: Storage Cost Display Validation

- [ ] Display correct daily storage cost: `(baseLiterRub + (volume-1) * additionalLiterRub) * coefficient`
- [ ] For 1 liter: `41.25 * 1.65 = 68.06 ₽/день` (not 0.00!)
- [ ] For 3 liters: `(41.25 + 2 * 0) * 1.65 = 68.06 ₽/день` (Pallets have additionalLiterRub=0)
- [ ] Show breakdown in expandable section

### AC6: Error State Handling

- [ ] If API returns empty/null storage object, show warning
- [ ] If storage rates are 0 and no fallback available, show manual input option
- [ ] Log error with warehouse and date context for debugging

---

## API Contract Reference

### SUPPLY System Response (Correct Source)

**Endpoint**: `GET /v1/tariffs/acceptance/coefficients/all`

```json
{
  "coefficients": [{
    "warehouseId": 130744,
    "warehouseName": "Краснодар (Тихорецкая)",
    "date": "2026-01-27",
    "storage": {
      "coefficient": 1.65,
      "baseLiterRub": 41.25,
      "additionalLiterRub": 0
    }
  }]
}
```

### INVENTORY System Response (May Return 0)

**Endpoint**: `GET /v1/tariffs/warehouses-with-tariffs`

```json
{
  "warehouses": [{
    "id": 507,
    "name": "Краснодар",
    "tariffs": {
      "storage": {
        "base_per_day_rub": 0.07,
        "liter_per_day_rub": 0.05,
        "coefficient": 1.0
      }
    }
  }]
}
```

**Note**: INVENTORY rates are typically LOWER than SUPPLY rates.

---

## Implementation Notes

### File Changes

```
src/
├── lib/
│   ├── tariff-extraction-utils.ts          # CREATE - Unified tariff extraction
│   └── storage-cost-utils.ts               # UPDATE - Use new extraction
├── hooks/
│   └── useAcceptanceCoefficients.ts        # UPDATE - Extract storage tariffs
├── components/custom/price-calculator/
│   └── WarehouseSection.tsx                # UPDATE - Display extracted tariffs
└── types/
    └── tariffs.ts                          # UPDATE - Add unified types
```

### Unified Tariff Types

```typescript
// src/types/tariffs.ts

/** Normalized storage tariffs (works with both INVENTORY and SUPPLY) */
export interface NormalizedStorageTariffs {
  baseLiterRub: number
  additionalLiterRub: number
  coefficient: number
  source: 'inventory' | 'supply' | 'fallback'
}

/** Storage tariff extraction result */
export interface StorageTariffExtraction {
  tariffs: NormalizedStorageTariffs
  usingFallback: boolean
  rawResponse: unknown
}
```

### Extraction Utility

```typescript
// src/lib/tariff-extraction-utils.ts

import type { NormalizedStorageTariffs, StorageTariffExtraction } from '@/types/tariffs'

const DEFAULT_STORAGE_TARIFFS: NormalizedStorageTariffs = {
  baseLiterRub: 0.11,
  additionalLiterRub: 0.11,
  coefficient: 1.0,
  source: 'fallback',
}

/**
 * Extract storage tariffs from API response with fallback
 * Handles both INVENTORY and SUPPLY naming conventions
 */
export function extractStorageTariffs(
  storageResponse: unknown,
  source: 'inventory' | 'supply'
): StorageTariffExtraction {
  if (!storageResponse || typeof storageResponse !== 'object') {
    console.warn('[StorageTariffs] Empty response, using fallback')
    return {
      tariffs: DEFAULT_STORAGE_TARIFFS,
      usingFallback: true,
      rawResponse: storageResponse,
    }
  }

  const storage = storageResponse as Record<string, unknown>

  // SUPPLY system field names
  const baseLiterRub = typeof storage.baseLiterRub === 'number'
    ? storage.baseLiterRub
    : typeof storage.base_per_day_rub === 'number'
      ? storage.base_per_day_rub
      : 0

  const additionalLiterRub = typeof storage.additionalLiterRub === 'number'
    ? storage.additionalLiterRub
    : typeof storage.liter_per_day_rub === 'number'
      ? storage.liter_per_day_rub
      : 0

  const coefficient = typeof storage.coefficient === 'number'
    ? storage.coefficient
    : 1.0

  // Apply fallback if base rate is 0
  if (baseLiterRub === 0) {
    console.warn('[StorageTariffs] baseLiterRub=0, applying fallback')
    return {
      tariffs: {
        ...DEFAULT_STORAGE_TARIFFS,
        coefficient, // Keep actual coefficient
      },
      usingFallback: true,
      rawResponse: storageResponse,
    }
  }

  return {
    tariffs: {
      baseLiterRub,
      additionalLiterRub,
      coefficient,
      source,
    },
    usingFallback: false,
    rawResponse: storageResponse,
  }
}
```

### Debug Logging (Temporary)

```typescript
// Add to useAcceptanceCoefficients.ts

function processStorageData(coefficients) {
  console.group('[StorageTariffs Debug]')
  console.log('Raw coefficients:', coefficients)

  const coefficient = coefficients[0]
  console.log('Selected coefficient:', coefficient)
  console.log('storage object:', coefficient?.storage)
  console.log('storage.baseLiterRub:', coefficient?.storage?.baseLiterRub)
  console.log('storage.additionalLiterRub:', coefficient?.storage?.additionalLiterRub)

  const extracted = extractStorageTariffs(coefficient?.storage, 'supply')
  console.log('Extracted tariffs:', extracted)
  console.groupEnd()

  return extracted
}
```

---

## Invariants & Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| API returns baseLiterRub = 0 | Apply fallback (0.11), show indicator |
| API returns null storage object | Apply full fallback, show warning |
| SUPPLY unavailable, INVENTORY used | Use INVENTORY rates (lower but valid) |
| Coefficient = 0 | Treat as 1.0 (no coefficient shouldn't zero out rate) |
| Pallets (additionalLiterRub = 0) | Valid case, calculate with 0 additional |
| Network error | Show error state, offer manual input |

---

## Test Scenarios

### Unit Tests

| Test | Input | Expected |
|------|-------|----------|
| Extract SUPPLY format | `{baseLiterRub: 41.25, additionalLiterRub: 0, coefficient: 1.65}` | Same values, source='supply' |
| Extract INVENTORY format | `{base_per_day_rub: 0.07, liter_per_day_rub: 0.05, coefficient: 1.0}` | Normalized to baseLiterRub=0.07 |
| Fallback on zero | `{baseLiterRub: 0, coefficient: 1.5}` | baseLiterRub=0.11, usingFallback=true |
| Fallback on null | `null` | Full default tariffs, usingFallback=true |
| Pallets valid zero | `{baseLiterRub: 41.25, additionalLiterRub: 0}` | additionalLiterRub=0, usingFallback=false |

### Integration Tests

| Test | Scenario | Expected |
|------|----------|----------|
| SUPPLY response | Select warehouse + future date | Storage from SUPPLY, coefficient applied |
| INVENTORY fallback | Select warehouse, no date | Storage from INVENTORY (lower rate) |
| Display verification | Краснодар Pallets, 1L | "68.06 ₽/день" (41.25 * 1.65) |
| Fallback indicator | API returns 0 | "Используются стандартные тарифы" shown |

---

## Observability

- **Metrics**: Track fallback activation rate (should be <5%)
- **Logs**: Log all tariff extractions with source and values
- **Alerts**: Alert if fallback rate exceeds 10%
- **Analytics**: Track which warehouses return 0 storage rates

---

## Security

- No additional security concerns
- Input validation already handled in existing stories

---

## Accessibility (WCAG 2.1 AA)

- [ ] Fallback indicator has aria-label
- [ ] Storage rate changes announced to screen readers
- [ ] Color contrast maintained for indicator badges

---

## Definition of Done

- [ ] extractStorageTariffs utility created and tested
- [ ] Both INVENTORY and SUPPLY field names handled
- [ ] Fallback logic implemented (baseLiterRub=0 triggers fallback)
- [ ] Debug logging added (can be disabled in production)
- [ ] Storage cost displays correct non-zero values
- [ ] Fallback indicator shown when defaults applied
- [ ] Unit tests written (>90% coverage)
- [ ] Integration test for Краснодар Pallets scenario
- [ ] No ESLint errors
- [ ] Code review completed

---

## Related Documentation

- **Analysis**: `docs/stories/epic-44/ANALYSIS-PRICE-CALCULATOR-SYNC-2026-01-26.md`
- **Backend API**: `docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md`
- **Story 44.40**: Two Tariff Systems Integration
- **Story 44.14**: Storage Cost Calculation (DEPRECATED but has formula reference)

---

**Created**: 2026-01-26
**Author**: PM (Storage Tariff Bug Fix)
**Backend Reference**: Request #98, #105 (fallback guide)

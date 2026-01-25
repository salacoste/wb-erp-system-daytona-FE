# Acceptance Coefficients Data Analysis

**Date**: 2026-01-24
**Epic**: Story 43.9 (Acceptance Coefficients Service)
**Issue**: Frontend reports values higher than expected

---

## Problem Description

Frontend team reports incorrect values from `GET /v1/tariffs/acceptance/coefficients/all`:

| Field | Expected | Actual | Ratio |
|-------|----------|--------|-------|
| `delivery.baseLiterRub` | ~46-48 ₽ | 110 ₽ | **2.4×** |
| `delivery.additionalLiterRub` | ~5-14 ₽ | 33 ₽ | **2.4-6.6×** |
| `storage.baseLiterRub` | ~0.07 ₽ | 65 ₽ | **928×** |

**Test case**: Warehouse "Казань", product volume 0.15L

---

## Root Cause Analysis

### 1. Different API Sources

**CRITICAL**: The acceptance coefficients endpoint uses a **DIFFERENT WB SDK API** than the price calculator:

| Feature | SDK Module | SDK Method | Purpose |
|---------|------------|------------|---------|
| **Price Calculator** | `sdk.tariffs` | `getTariffsBox()` | Standard logistics tariffs |
| **Acceptance Coefficients** | `sdk.ordersFBW` | `getAcceptanceCoefficients()` | FBO acceptance costs |

**Source**: `src/tariffs/acceptance-coefficients.service.ts:8-10`
```typescript
/**
 * IMPORTANT: Uses sdk.ordersFBW module, NOT sdk.tariffs!
 *
 * SDK Method: sdk.ordersFBW.getAcceptanceCoefficients({ warehouseIDs?: string })
 */
```

### 2. What OrdersFBW API Returns

Based on test data (`acceptance-coefficients.service.spec.ts:55-71`):

```typescript
// Mock data (TEST VALUES - not actual production data)
{
  warehouseID: 507,
  warehouseName: 'Краснодар',
  deliveryCoef: '120',              // 120% coefficient
  deliveryBaseLiter: '5.50',       // 5.50 ₽ per liter
  deliveryAdditionalLiter: '2.25',  // 2.25 ₽ per liter
  storageCoef: '100',               // 100% coefficient
  storageBaseLiter: '3.00',        // 3.00 ₽ per liter
  storageAdditionalLiter: '1.50',   // 1.50 ₽ per liter
}
```

**Note**: These are TEST VALUES with low rates. Production values from WB API may be significantly different.

### 3. Data Transformation

**File**: `src/tariffs/acceptance-coefficients.service.ts:364-400`

```typescript
private transformCoefficient(raw: ModelsAcceptanceCoefficient): AcceptanceCoefficient {
  // Coefficients: DIVIDE by 100 (percentage to multiplier)
  const deliveryCoef = this.parseCoefficient(raw.deliveryCoef);      // "120" → 1.2
  const storageCoef = this.parseCoefficient(raw.storageCoef);        // "100" → 1.0

  return {
    ...
    delivery: {
      coefficient: deliveryCoef,
      baseLiterRub: this.parseNumeric(raw.deliveryBaseLiter),      // STRING → NUMBER
      additionalLiterRub: this.parseNumeric(raw.deliveryAdditionalLiter),
    },
    storage: {
      coefficient: storageCoef,
      baseLiterRub: this.parseNumeric(raw.storageBaseLiter),      // STRING → NUMBER
      additionalLiterRub: this.parseNumeric(raw.storageAdditionalLiter),
    },
  };
}

private parseNumeric(value: string | undefined, defaultValue = 0): number {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}
```

**Key insight**: The `baseLiterRub` values are **NOT divided by any coefficient** - they are parsed directly from strings to numbers.

---

## Why Values Are Higher Than Expected

### Hypothesis 1: Coefficient Applied in WB API Response

The OrdersFBW API might return rates that **already include the coefficient**:

```
Expected flow:
  base_rate = 46 ₽
  coefficient = 1.2 (120%)
  final_rate = 46 × 1.2 = 55.20 ₽

Actual WB API might return:
  baseLiterRub = 110 ₽ (already with coefficient applied?)
```

**Evidence**: 110 ₽ ≈ 46 × 2.4 (possible coefficient applied)

### Hypothesis 2: Different Rate Structure

OrdersFBW API has **different rate structure** than Tariffs API:

| API | Purpose | Rates |
|-----|---------|-------|
| `sdk.tariffs.getTariffsBox()` | Standard logistics | 46₽ base + 14₽/liter |
| `sdk.ordersFBW.getAcceptanceCoefficients()` | FBO acceptance | Variable (higher) |

**Reason**: FBO acceptance may have premium pricing due to:
- Priority processing
- Guaranteed acceptance window
- Higher operational costs

### Hypothesis 3: Units Confusion

**Possible units in WB API response**:
- Per 1000 liters instead of per liter?
- Per cubic meter instead of per liter?
- Per pallet instead of per box?

**Example**: If 110 ₽ is per 1000 liters:
- Actual per liter: 110 / 1000 = 0.11 ₽/liter (closer to expected 0.07 ₽)

### Hypothesis 4: Storage Rate Interpretation

**Storage rates** from OrdersFBW may be:
- **Monthly rate** instead of daily?
- **Per 1000 liters** instead of per liter?
- **Per pallet** instead of per box?

**Example**: 65 ₽ could be:
- Monthly rate: 65 ₽/month ÷ 30 days = 2.17 ₽/day
- Per 1000L: 65 ₽/1000L = 0.065 ₽/liter (close to expected 0.07 ₽)

---

## Raw Data Request

To diagnose the issue, we need to see **raw WB SDK response** for warehouse "Казань":

### Requested Debug Endpoint

```http
### Debug endpoint (to be added)
GET /v1/tariffs/acceptance/coefficients/debug?warehouseId=117501

Response should include:
{
  "warehouseId": 117501,
  "warehouseName": "Казань",
  "raw_wb_sdk_response": {
    "warehouseID": 117501,
    "warehouseName": "Казань",
    "deliveryCoef": "XXX",        ← RAW from WB
    "deliveryBaseLiter": "XXX",   ← RAW from WB
    "deliveryAdditionalLiter": "XXX", ← RAW from WB
    "storageCoef": "XXX",
    "storageBaseLiter": "XXX",
    "storageAdditionalLiter": "XXX",
    ...
  },
  "transformed_response": {
    "delivery": {
      "coefficient": X.XX,
      "baseLiterRub": XX.XX,
      "additionalLiterRub": XX.XX
    },
    "storage": {
      "coefficient": X.XX,
      "baseLiterRub": XX.XX,
      "additionalLiterRub": XX.XX
    }
  }
}
```

---

## Recommended Actions

### 1. Add Debug Logging (Temporary)

**File**: `src/tariffs/acceptance-coefficients.service.ts`

```typescript
// After line 123 (after fetching from WB API)
private async getAllAcceptanceCoefficients(cabinetId: string): Promise<AcceptanceCoefficient[]> {
  // ... existing code ...

  // 4. Fetch from WB API
  let rawCoefficients: ModelsAcceptanceCoefficient[];
  try {
    this.logger.debug('Calling WB API sdk.ordersFBW.getAcceptanceCoefficients()');
    rawCoefficients = await (sdk.ordersFBW as unknown as OrdersFBWModuleMethods).getAcceptanceCoefficients();

    // === ADD DEBUG LOGGING ===
    this.logger.debug(`Raw WB SDK response (first 3 items):`);
    rawCoefficients.slice(0, 3).forEach(raw => {
      this.logger.debug(JSON.stringify({
        warehouse: raw.warehouseName,
        deliveryCoef: raw.deliveryCoef,
        deliveryBaseLiter: raw.deliveryBaseLiter,
        deliveryAdditionalLiter: raw.deliveryAdditionalLiter,
        storageCoef: raw.storageCoef,
        storageBaseLiter: raw.storageBaseLiter,
        storageAdditionalLiter: raw.storageAdditionalLiter,
      }, null, 2));
    });
    // === END DEBUG LOGGING ===

  } catch (error) {
    // ... existing error handling ...
  }

  // ... rest of method ...
}
```

### 2. Create Debug Endpoint (Recommended)

**New endpoint**: `GET /v1/tariffs/acceptance/coefficients/debug?warehouseId={id}`

**File**: `src/tariffs/tariffs.controller.ts`

```typescript
@Get('acceptance/coefficients/debug')
@ApiOperation({
  summary: 'Debug acceptance coefficients (shows raw WB SDK response)',
  description: 'Returns both raw WB SDK response and transformed response for debugging',
})
async getAcceptanceCoefficientsDebug(
  @Query('warehouseId') warehouseId: number,
  @Headers('X-Cabinet-Id') cabinetId: string,
) {
  const raw = await this.acceptanceCoefficientsService.getRawResponse(cabinetId, warehouseId);
  const transformed = await this.acceptanceCoefficientsService.getAcceptanceByWarehouse(cabinetId, warehouseId);

  return {
    warehouseId,
    raw_wb_sdk_response: raw,
    transformed_response: transformed,
  };
}
```

### 3. Compare Both APIs Side-by-Side

**Test** both endpoints for the same warehouse:

```bash
# Tariffs API (used by Price Calculator)
GET /v1/tariffs/warehouses-with-tariffs?warehouseName=Казань

# Acceptance Coefficients API (used by Frontend)
GET /v1/tariffs/acceptance/coefficients/all
```

**Compare**:
- `boxDeliveryBase` vs `delivery.baseLiterRub`
- `boxDeliveryLiter` vs `delivery.additionalLiterRub`
- `boxStorageBase` vs `storage.baseLiterRub`

---

## Expected vs Actual Data (Test Mock)

### Test Data (from spec file)

```typescript
// Test mock values (LOW RATES)
{
  warehouseName: 'Краснодар',
  delivery: {
    coefficient: 1.2,           // 120%
    baseLiterRub: 5.50,       // ← Expected by test
    additionalLiterRub: 2.25,  // ← Expected by test
  },
  storage: {
    coefficient: 1.0,           // 100%
    baseLiterRub: 3.00,       // ← Expected by test
    additionalLiterRub: 1.50,  // ← Expected by test
  }
}
```

### Production Data (Actual WB API Response)

**Unknown** - We need to see raw WB SDK response to understand actual values.

---

## Next Steps

### For Backend Team

1. **Add debug logging** to `AcceptanceCoefficientsService` to log raw WB SDK response
2. **Create debug endpoint** `/v1/tariffs/acceptance/coefficients/debug` to show raw vs transformed data
3. **Test with warehouse "Казань"** to capture actual WB API response
4. **Document** the exact difference between:
   - `sdk.tariffs.getTariffsBox()` response
   - `sdk.ordersFBW.getAcceptanceCoefficients()` response

### For Frontend Team

1. **Verify** which endpoint you're calling:
   - `GET /v1/tariffs/acceptance/coefficients/all` ← OrdersFBW API
   - `GET /v1/tariffs/warehouses-with-tariffs` ← Tariffs API

2. **Use correct endpoint**:
   - For **Price Calculator**: Use `/v1/tariffs/warehouses-with-tariffs`
   - For **FBO Acceptance info**: Use `/v1/tariffs/acceptance/coefficients/all`

3. **Do NOT mix** acceptance coefficients with standard logistics tariffs

---

## Code References

| File | Lines | Description |
|------|-------|-------------|
| `src/tariffs/acceptance-coefficients.service.ts` | 1-13 | Important comment about OrdersFBW vs Tariffs |
| `src/tariffs/acceptance-coefficients.service.ts` | 88-137 | Main fetching method |
| `src/tariffs/acceptance-coefficients.service.ts` | 364-400 | Transformation logic |
| `src/tariffs/types/acceptance-coefficients.types.ts` | 18-33 | Raw SDK response interface |
| `src/tariffs/acceptance-coefficients.service.spec.ts` | 55-100 | Test mock data |

---

## Summary

**The issue is likely that**:
1. OrdersFBW API (`getAcceptanceCoefficients`) returns **different rates** than Tariffs API (`getTariffsBox`)
2. OrdersFBW API may have **premium pricing** for FBO acceptance
3. Units may be different (per 1000L, per pallet, monthly, etc.)
4. **Raw WB SDK response** is needed to confirm

**Recommended action**: Add debug endpoint to show raw WB SDK response vs transformed response.

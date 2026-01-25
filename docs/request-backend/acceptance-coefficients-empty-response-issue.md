# Issue Analysis: Acceptance Coefficients API Returns Empty Array

**Date**: 2026-01-24
**Severity**: High (blocks Frontend calendar feature)
**Affected**: Frontend team, Price Calculator with acceptance costs

---

## Problem Statement

**Frontend Report**:
```
Endpoint: GET /v1/tariffs/acceptance/coefficients?warehouseId=1733387774
Warehouse: Владимир (ID: 1733387774)
Expected: Array of acceptance coefficients for 14 days forward
Actual: Empty array [] OR 404 Not Found
```

**Impact**:
- Frontend cannot display calendar for acceptance date selection
- Price Calculator cannot calculate acceptance costs
- Users cannot see acceptance coefficients for certain warehouses

---

## Root Cause Analysis

### 1. Wrong Endpoint Usage (MOST LIKELY)

**Critical Issue**: There are TWO endpoints with similar paths:

| Endpoint | Purpose | When to Use |
|----------|---------|-------------|
| `GET /v1/tariffs/acceptance/coefficients` | **PER WAREHOUSE** | Specific warehouse |
| `GET /v1/tariffs/acceptance/coefficients/all` | **ALL WAREHOUSES** | Discovery & dropdowns |

**Frontend is calling**:
```
GET /v1/tariffs/acceptance/coefficients?warehouseId=1733387774
```

**Should call**:
```
GET /v1/tariffs/acceptance/coefficients/all
```

### 2. WB SDK Behavior

**SDK Method**: `sdk.ordersFBW.getAcceptanceCoefficients({ warehouseIDs?: string })`

**Key Question**: What does `getAcceptanceCoefficients()` return when:
- **NO parameters**: Returns ALL warehouses OR limited set?
- **WITH warehouseIDs parameter**: Returns only specified warehouses?

**Hypothesis**: The WB SDK might:
1. Return only warehouses that have acceptance data available
2. Not include all warehouses in every response
3. Require warehouseIDs parameter to get specific warehouses

### 3. Warehouse ID Mismatch

**Warehouse ID**: 1733387774 (Владимир)

**Possible Issues**:
- This ID might not be a valid WB office ID in the OrdersFBW system
- The ID might be from a different ID system (e.g., products database)
- WB SDK might return a different ID for Владимир

---

## Endpoint Comparison

### Endpoint 1: GET /v1/tariffs/acceptance/coefficients (PER WAREHOUSE)

**File**: `src/tariffs/tariffs.controller.ts:328-349`

```typescript
@Get('acceptance/coefficients')
@Roles(UserRole.Manager, UserRole.Owner, UserRole.Analyst, UserRole.Admin)
async getAcceptanceCoefficients(
  @Query('warehouseId', ParseIntPipe) warehouseId: number,
  @CurrentCabinet() cabinetId: string,
): Promise<AcceptanceCoefficientsResponseDto> {
  const result = await this.acceptanceCoefficientsService.getAcceptanceByWarehouse(cabinetId, warehouseId);

  if (!result || result.length === 0) {
    throw new NotFoundException(`No acceptance coefficients found for warehouse ${warehouseId}`);
  }

  return {
    coefficients: result,
    meta: {
      total: result.length,
      available: result.filter((c) => c.isAvailable).length,
      unavailable: result.filter((c) => !c.isAvailable).length,
      cache_ttl_seconds: 3600,
    },
  };
}
```

**Behavior**:
- Fetches from WB SDK: `getAcceptanceCoefficients({ warehouseIDs: "1733387774" })`
- If warehouse not in WB SDK response → returns empty array
- Throws `NotFoundException` if result is empty

### Endpoint 2: GET /v1/tariffs/acceptance/coefficients/all (ALL WAREHOUSES)

**File**: `src/tariffs/tariffs/controller.ts:269-298`

```typescript
@Get('acceptance/coefficients/all')
@Roles(UserRole.Manager, UserRole.Owner, UserRole.Analyst, UserRole.Admin)
async getAllAcceptanceCoefficients(@CurrentCabinet() cabinetId: string): Promise<AcceptanceCoefficientsResponseDto> {
  const result = await this.acceptanceCoefficientsService.getAllAcceptanceCoefficients(cabinetId);

  return {
    coefficients: result,
    meta: {
      total: result.length,
      available: result.filter((c) => c.isAvailable).length,
      unavailable: result.filter((c) => !c.isAvailable).length),
      cache_ttl_seconds: 3600,
    },
  };
}
```

**Behavior**:
- Fetches from WB SDK: `getAcceptanceCoefficients()` (NO parameters)
- Returns ALL warehouses with acceptance data
- Used to discover available warehouses and their IDs

---

## Service Implementation Details

**File**: `src/tariffs/acceptance-coefficients.service.ts:148-232`

```typescript
async getAcceptanceByWarehouse(
  cabinetId: string,
  warehouseIds: number | number[],
): Promise<AcceptanceCoefficient[]> {
  // Normalize to array
  const ids = Array.isArray(warehouseIds) ? warehouseIds : [warehouseIds];

  // Check cache for each warehouse
  for (const warehouseId of ids) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      results.push(...cached);
    } else {
      uncachedIds.push(warehouseId);
    }
  }

  // If all cached, return
  if (uncachedIds.length === 0) {
    return results;
  }

  // Fetch from WB API with warehouseIDs filter
  const warehouseIDsParam = uncachedIds.join(',');
  rawCoefficients = await sdk.ordersFBW.getAcceptanceCoefficients({
    warehouseIDs: warehouseIDsParam,  // ← KEY: Pass warehouseIDs to WB API
  });

  // Transform and cache
  const fetchedCoefficients = rawCoefficients.map((raw) => this.transformCoefficient(raw));
  results.push(...fetchedCoefficients);

  return results;
}
```

**Key Logic**:
1. Service passes `warehouseIDs` parameter to WB SDK
2. WB SDK filters response to only include specified warehouses
3. If warehouse not in WB SDK response → empty result

---

## Why Владимир (1733387774) Returns Empty

### Hypothesis 1: Warehouse Not in WB SDK Response

**Scenario**: WB SDK `getAcceptanceCoefficients()` doesn't include Владимир in its default response, and when specifically queried with `warehouseIDs: "1733387774"`, it still returns no data.

**Evidence**: The service transforms whatever WB SDK returns. If WB SDK doesn't return data for this warehouse, backend returns empty.

### Hypothesis 2: Wrong Warehouse ID

**Scenario**: ID 1733387774 is not a valid WB office ID in the OrdersFBW system.

**Possible Causes**:
- ID from products database vs offices database
- Old warehouse that's no longer in WB system
- ID from different WB API module

**Solution**: Frontend needs to get the correct WB office ID from:
- `GET /v1/tariffs/warehouses` (returns simplified warehouse list)
- OR `GET /v1/tariffs/acceptance/coefficients/all` (returns all with acceptance data)

### Hypothesis 3: No Acceptance Data Available

**Scenario**: Владимир warehouse exists but has no acceptance coefficient data for the requested date range.

**Evidence**: WB SDK might only return warehouses that have active acceptance slots.

---

## Recommended Solutions

### Solution 1: Use ALL Endpoint for Discovery (RECOMMENDED)

**Frontend should**:
1. Call `GET /v1/tariffs/acceptance/coefficients/all` to get ALL warehouses
2. Find Владимир in the response
3. Get the correct `warehouseID` from the response
4. Use that ID for per-warehouse queries

**Example Flow**:
```typescript
// Step 1: Get all warehouses with acceptance data
const all = await apiClient.get('/v1/tariffs/acceptance/coefficients/all');

// Step 2: Find Владимир
const vladimir = all.data.coefficients.find(w =>
  w.warehouseName === 'Владимир'
);

// Step 3: Use correct warehouse ID
const warehouseId = vladimir.warehouseId;  // Use THIS ID, not 1733387774

// Step 4: Get specific warehouse coefficients (optional)
const specific = await apiClient.get(
  `/v1/tariffs/acceptance/coefficients?warehouseId=${warehouseId}`
);
```

### Solution 2: Validate Warehouse ID Before API Call

**Frontend validation**:
```typescript
// Get list of valid warehouses first
const { data: { warehouses } } = await apiClient.get('/v1/tariffs/warehouses');

// Check if requested warehouse exists
const validWarehouse = warehouses.find(w => w.id === warehouseId);

if (!validWarehouse) {
  throw new Error(`Warehouse ${warehouseId} not found. Valid warehouses: ${warehouses.map(w => w.name).join(', ')}`);
}

// Then fetch acceptance coefficients
const coefficients = await apiClient.get(
  `/v1/tariffs/acceptance/coefficients?warehouseId=${warehouseId}`
);
```

### Solution 3: Backend Enhancement (Optional)

**Add validation endpoint**:
```typescript
@Get('acceptance/coefficients/validate')
async validateWarehouseId(
  @Query('warehouseId') warehouseId: number,
  @CurrentCabinet() cabinetId: string,
): Promise<{ valid: boolean; availableWarehouses: Array<{id: number, name: string}>}> {
  const allCoefficients = await this.acceptanceCoefficientsService.getAllAcceptanceCoefficients(cabinetId);
  const warehouseExists = allCoefficients.some(c => c.warehouseId === warehouseId);

  return {
    valid: warehouseExists,
    availableWarehouses: [
      ...new Set(allCoefficients.map(c => ({
        id: c.warehouseId,
        name: c.warehouseName,
      })))
    ],
  };
}
```

---

## Action Items for Backend Team

### 1. Add Debug Logging (HIGH PRIORITY)

**File**: `src/tariffs/acceptance-coefficients.service.ts`

**After line 196** (after WB API call):
```typescript
// === ADD DEBUG LOGGING ===
this.logger.debug(`Raw WB SDK response count: ${rawCoefficients.length}`);
rawCoefficients.slice(0, 5).forEach((raw, idx) => {
  this.logger.debug(`[${idx}] warehouseID=${raw.warehouseID}, name=${raw.warehouseName}`);
});
this.logger.debug(`All warehouseIDs in response:`, [
  ...new Set(rawCoefficients.map(r => r.warehouseID))
]);
// === END DEBUG LOGGING ===
```

### 2. Add Validation Endpoint (MEDIUM PRIORITY)

Create `GET /v1/tariffs/acceptance/coefficients/validate?warehouseId={id}` that:
- Checks if warehouse exists in acceptance coefficients data
- Returns list of available warehouses if requested warehouse not found
- Helps frontend debug warehouse ID issues

### 3. Document Warehouse ID Sources

Create documentation explaining:
- Where warehouse IDs come from (products vs offices)
- Which IDs to use for which API endpoints
- How to map between different ID systems

---

## Frontend Fix (Immediate)

**Change from**:
```typescript
// WRONG: Direct query with potentially wrong ID
const { data } = await apiClient.get(
  `/v1/tariffs/acceptance/coefficients?warehouseId=${warehouseId}`
);
```

**To**:
```typescript
// CORRECT: Get all warehouses first, find by name, use correct ID
const { data: allData } = await apiClient.get(
  '/v1/tariffs/acceptance/coefficients/all'
);

const warehouse = allData.coefficients.find(w =>
  w.warehouseName === 'Владимир' ||
  w.warehouseName.includes('Владимир')
);

if (!warehouse) {
  // Show error: warehouse not found, list available warehouses
  return;
}

const warehouseId = warehouse.warehouseId;
const { data } = await apiClient.get(
  `/v1/tariffs/acceptance/coefficients?warehouseId=${warehouseId}`
);
```

---

## Summary

**Root Cause**: Frontend is using `warehouseId=1733387774` which may not be a valid WB office ID in the OrdersFBW system.

**Immediate Fix**: Use `GET /v1/tariffs/acceptance/coefficients/all` to:
1. Get all warehouses with acceptance data
2. Find Владимир by name
3. Get the correct `warehouseId`
4. Use correct ID for subsequent queries

**Backend Action**: Add debug logging to show what warehouse IDs WB SDK actually returns.

---

**Related Files**:
- `src/tariffs/tariffs.controller.ts:269-349` - Endpoint handlers
- `src/tariffs/acceptance-coefficients.service.ts:148-232` - Service implementation
- `src/tariffs/types/acceptance-coefficients.types.ts` - Type definitions
- `src/lib/api/tariffs.ts` - Frontend API client
- `src/hooks/useAcceptanceCoefficients.ts` - Frontend hook

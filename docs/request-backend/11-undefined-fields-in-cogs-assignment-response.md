# Request #11: Undefined Fields in COGS Assignment Response

**Date:** 2025-11-23  
**Last Updated:** 2025-01-26 (missing_data_reason values updated)  
**From:** Frontend Team  
**To:** Backend Team  
**Priority:** ✅ **RESOLVED** - Fixed by Backend Team (2025-11-23)  
**Epic:** Epic 18 - COGS Management & Product Catalog API  
**Related:** Request #09 (Epic 18 COGS Management API)

**⚠️ IMPORTANT**: For up-to-date information on `missing_data_reason` values, see [Request #16](./16-cogs-history-and-margin-data-structure.md).

---

## ✅ RESOLUTION (2025-11-23)

**Status:** ✅ **FIXED** - Backend deployed fix at 08:49 MSK

**What Changed:**
- Changed return type from `AssignCogsResponseDto` to `ProductResponseDto`
- Now calls `getProduct()` after creating COGS record
- Returns all 9 fields from Epic 18 Phase 1 implementation
- All fields properly serialized (no undefined values)

**Test Results:**
- ✅ 21/21 tests passing (100% coverage)
- ✅ All fields return correct types (not undefined)
- ✅ `has_cogs`, `cogs.id`, `current_margin_pct`, `missing_data_reason` now work

**Reference:** `/docs/backend-response-09-epic-18-products-api-enhancement.md`

---

## Original Problem Description

**Problem:** After successfully assigning COGS via `POST /v1/products/:nmId/cogs`, the backend returns HTTP 200 with response body containing `undefined` values for critical fields instead of expected data.

**Impact:**
- Frontend cannot display success confirmation with COGS details
- User sees technical error toast instead of success message
- Margin percentage cannot be displayed after assignment
- `has_cogs` flag status unclear (undefined instead of true)

**Current Workaround:**
- Fixed frontend `TypeError` by adding null/undefined checks (`!= null` instead of `!== null`)
- Error no longer crashes, but user experience is degraded (missing data in success toasts)

---

## Problem Description

### Observed Behavior

**Request:**
```http
POST /v1/products/321678606/cogs
Content-Type: application/json
Authorization: Bearer <jwt>
X-Cabinet-Id: f75836f7-c0bc-4b2c-823c-a1f3508cce8e

{
  "unit_cost_rub": 111,
  "valid_from": "2025-11-23",
  "source": "manual",
  "notes": "Test assignment"
}
```

**Expected Response:**
```typescript
{
  "nm_id": "321678606",
  "sa_name": "Краска для мебели Space Chemical MK-800W",
  "brand": "Space Chemical",
  "category": "Краски для мебели",
  "has_cogs": true,              // ❌ RETURNED: undefined
  "cogs": {
    "id": "cogs_abc123",         // ❌ RETURNED: undefined
    "unit_cost_rub": "111",
    "valid_from": "2025-11-23T00:00:00.000Z",
    "notes": "Test assignment"
  },
  "current_margin_pct": 35.5,    // ❌ RETURNED: undefined (or null if no sales data)
  "missing_data_reason": null
}
```

**Actual Response:**
```typescript
{
  "nm_id": "321678606",
  "sa_name": "Краска для мебели Space Chemical MK-800W",
  "brand": "Space Chemical",
  "category": "Краски для мебели",
  "has_cogs": undefined,         // ❌ Should be true
  "cogs": {
    "id": undefined,             // ❌ Should be COGS record ID
    "unit_cost_rub": "111",      // ✅ Correct
    "valid_from": "2025-11-23T00:00:00.000Z",  // ✅ Correct
    "notes": "Test assignment"   // ✅ Correct
  },
  "current_margin_pct": undefined,  // ❌ Should be number or null
  "missing_data_reason": undefined  // ❌ Should be string or null
}
```

### Backend Logs (Confirm Undefined)

**From:** `src/hooks/useSingleCogsAssignment.ts` (line 60-65)

```typescript
console.info('[COGS Assignment] COGS assigned successfully:', {
  nm_id: response.nm_id,
  has_cogs: response.has_cogs,           // LOG: undefined
  cogs_id: response.cogs?.id,            // LOG: undefined
  current_margin_pct: response.current_margin_pct,  // LOG: undefined
});
```

**Console Output:**
```
[COGS Assignment] COGS assigned successfully: {
  nm_id: '321678606',
  has_cogs: undefined,
  cogs_id: undefined,
  current_margin_pct: undefined
}
```

---

## Root Cause Analysis (Frontend Hypothesis)

### Hypothesis 1: DTO Serialization Issue

**Possible Cause:** Backend DTO class (`ProductWithCogsDto` or `AssignCogsResponseDto`) may not be properly serializing these fields.

**Evidence:**
- `cogs.unit_cost_rub` and `cogs.valid_from` ARE serialized correctly ✅
- `cogs.id`, `has_cogs`, `current_margin_pct` are NOT serialized (undefined) ❌
- Suggests selective field serialization failure

**Expected DTO Structure:**
```typescript
// backend/src/products/dto/assign-cogs-response.dto.ts (expected)
export class AssignCogsResponseDto {
  @ApiProperty()
  nm_id: string;

  @ApiProperty()
  sa_name: string;

  @ApiProperty()
  has_cogs: boolean;  // ❌ May be missing @ApiProperty() or not mapped

  @ApiProperty({ type: () => CogsRecordDto, nullable: true })
  cogs?: CogsRecordDto;  // ✅ Parent object serialized, but child fields?

  @ApiProperty({ nullable: true })
  current_margin_pct?: number | null;  // ❌ May be missing mapping

  @ApiProperty({ nullable: true })
  missing_data_reason?: string | null;  // ❌ May be missing mapping
}

export class CogsRecordDto {
  @ApiProperty()
  id: string;  // ❌ May be missing or wrong property name (e.g., 'cogs_id' vs 'id')

  @ApiProperty()
  unit_cost_rub: string;  // ✅ Works

  @ApiProperty()
  valid_from: string;  // ✅ Works

  @ApiProperty({ nullable: true })
  notes?: string;  // ✅ Works
}
```

### Hypothesis 2: Database Query Missing Fields

**Possible Cause:** Backend service query after COGS creation doesn't include all fields.

**Example (Problematic):**
```typescript
// backend/src/products/products.service.ts
async assignCogs(nmId: string, cogsData: CogsAssignmentRequest) {
  // Step 1: Create COGS record
  const newCogs = await this.prisma.cogs.create({
    data: {
      nm_id: nmId,
      unit_cost_rub: cogsData.unit_cost_rub,
      valid_from: cogsData.valid_from,
      source: cogsData.source,
      notes: cogsData.notes,
    },
  });

  // Step 2: Fetch product with COGS (MISSING FIELDS?)
  const product = await this.wbProductsService.getProduct(cabinetId, nmId);

  // Step 3: Return response (COGS ID not included?)
  return {
    ...product,
    has_cogs: undefined,  // ❌ Not computed
    cogs: {
      id: undefined,      // ❌ newCogs.id not included
      unit_cost_rub: newCogs.unit_cost_rub,
      valid_from: newCogs.valid_from,
      notes: newCogs.notes,
    },
    current_margin_pct: undefined,  // ❌ Not computed
  };
}
```

**Expected (Correct):**
```typescript
async assignCogs(nmId: string, cogsData: CogsAssignmentRequest) {
  // Step 1: Create COGS record
  const newCogs = await this.prisma.cogs.create({
    data: { /* ... */ },
  });

  // Step 2: Fetch product
  const product = await this.wbProductsService.getProduct(cabinetId, nmId);

  // Step 3: Compute margin (if sales data available)
  const marginData = await this.computeMargin(nmId, newCogs.unit_cost_rub);

  // Step 4: Return complete response
  return {
    ...product,
    has_cogs: true,  // ✅ Explicitly set to true
    cogs: {
      id: newCogs.id.toString(),  // ✅ Include COGS ID
      unit_cost_rub: newCogs.unit_cost_rub.toString(),
      valid_from: newCogs.valid_from.toISOString(),
      notes: newCogs.notes,
    },
    current_margin_pct: marginData?.margin_pct ?? null,  // ✅ Number or null
    missing_data_reason: marginData?.missing_data_reason ?? null,  // ✅ String or null
  };
}
```

### Hypothesis 3: Field Name Mismatch

**Possible Cause:** Database column names don't match DTO property names.

**Example:**
- Database: `cogs.cogs_id` (snake_case)
- DTO expects: `cogs.id` (camelCase)
- Result: `id` field undefined because Prisma returns `cogs_id`

**Expected Prisma Mapping:**
```typescript
// backend/prisma/schema.prisma
model Cogs {
  id             Int      @id @default(autoincrement())  // Maps to 'id' in DTO
  nm_id          String
  unit_cost_rub  Decimal
  valid_from     DateTime
  notes          String?
  created_at     DateTime @default(now())
}
```

---

## Affected Fields

| Field | Expected Type | Actual Type | Impact |
|-------|---------------|-------------|--------|
| `has_cogs` | `boolean` | `undefined` | Cannot show COGS status to user |
| `cogs.id` | `string` | `undefined` | Cannot reference COGS record for updates |
| `current_margin_pct` | `number \| null` | `undefined` | Cannot display margin calculation |
| `missing_data_reason` | `string \| null` | `undefined` | Cannot explain why margin is missing |

---

## Frontend Workaround (Temporary)

**Fixed TypeError:**
```typescript
// src/hooks/useSingleCogsAssignment.ts (line 91)
// BEFORE:
if (data.current_margin_pct !== null) {  // ❌ Fails for undefined
  console.log(`Margin: ${data.current_margin_pct.toFixed(2)}%`)
}

// AFTER (Current Workaround):
if (data.current_margin_pct != null) {  // ✅ Handles both null and undefined
  console.log(`Margin: ${data.current_margin_pct.toFixed(2)}%`)
}
```

**Degraded User Experience:**
```typescript
// Frontend cannot show:
// ✅ "Себестоимость назначена успешно" - Shows generic success
// ❌ "COGS ID: cogs_abc123" - Missing COGS ID
// ❌ "Маржа рассчитана: 35.5%" - Missing margin percentage
// ❌ "Маржа недоступна: нет продаж за последнюю неделю" - Missing reason
```

---

## Expected Backend Response (Contract)

### Success Response (With Margin Data)

```typescript
{
  "nm_id": "321678606",
  "sa_name": "Краска для мебели Space Chemical MK-800W",
  "brand": "Space Chemical",
  "category": "Краски для мебели",
  "has_cogs": true,              // ✅ Boolean (true after assignment)
  "cogs": {
    "id": "cogs_12345",          // ✅ String (COGS record ID)
    "unit_cost_rub": "111.00",   // ✅ String (decimal as string)
    "valid_from": "2025-11-23T00:00:00.000Z",  // ✅ ISO date string
    "notes": "Test assignment",   // ✅ String or null
    "created_at": "2025-11-23T08:15:30.000Z",  // ✅ ISO timestamp
    "updated_at": "2025-11-23T08:15:30.000Z"   // ✅ ISO timestamp
  },
  "current_margin_pct": 35.5,    // ✅ Number (margin percentage)
  "missing_data_reason": null    // ✅ null (margin available)
}
```

### Success Response (No Sales Data - Margin Missing)

```typescript
{
  "nm_id": "321678606",
  "sa_name": "Краска для мебели Space Chemical MK-800W",
  "brand": "Space Chemical",
  "category": "Краски для мебели",
  "has_cogs": true,              // ✅ Boolean (true)
  "cogs": {
    "id": "cogs_12345",          // ✅ String
    "unit_cost_rub": "111.00",
    "valid_from": "2025-11-23T00:00:00.000Z",
    "notes": "Test assignment"
  },
  "current_margin_pct": null,    // ✅ null (not undefined!)
  "missing_data_reason": "NO_SALES_IN_PERIOD"  // ✅ Reason code (updated 2025-01-26)
}
```

### Missing Data Reason Codes

| Code | Meaning |
|------|---------|
| `null` | Margin calculated successfully |
| `"NO_SALES_IN_PERIOD"` | No sales in last completed week (margin period) |
| `"COGS_NOT_ASSIGNED"` | Product has sales but no COGS assigned |
| `"NO_SALES_DATA"` | Product has never had any sales |
| `"ANALYTICS_UNAVAILABLE"` | Analytics service unavailable |
| `null` | Margin calculated OR COGS assigned but calculation in progress (Epic 20) |

**Note**: Values updated 2025-01-26. See Request #16 for complete documentation.

---

## Testing Recommendations

### Backend Unit Test (Verify Response Structure)

```typescript
// backend/src/products/products.service.spec.ts
describe('ProductsService.assignCogs', () => {
  it('should return complete ProductWithCogs response', async () => {
    const result = await service.assignCogs('321678606', {
      unit_cost_rub: 111,
      valid_from: '2025-11-23',
      source: 'manual',
    });

    // ✅ Assert all fields are defined (not undefined)
    expect(result.nm_id).toBe('321678606');
    expect(result.has_cogs).toBe(true);  // ❌ Currently fails
    expect(result.cogs.id).toBeDefined();  // ❌ Currently fails
    expect(result.cogs.unit_cost_rub).toBe('111.00');

    // ✅ Assert margin fields are number or null (never undefined)
    expect(typeof result.current_margin_pct === 'number' || result.current_margin_pct === null).toBe(true);  // ❌ Currently fails
    expect(typeof result.missing_data_reason === 'string' || result.missing_data_reason === null).toBe(true);  // ❌ Currently fails
  });
});
```

### Integration Test (E2E Flow)

```typescript
// backend/test/cogs.e2e-spec.ts
describe('POST /v1/products/:nmId/cogs', () => {
  it('should assign COGS and return complete response', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/products/321678606/cogs')
      .set('Authorization', `Bearer ${validJWT}`)
      .set('X-Cabinet-Id', cabinetId)
      .send({
        unit_cost_rub: 111,
        valid_from: '2025-11-23',
        source: 'manual',
      })
      .expect(200);

    // ✅ Verify response structure
    const body = response.body;
    expect(body.has_cogs).toBe(true);  // ❌ Currently undefined
    expect(body.cogs.id).toBeDefined();  // ❌ Currently undefined
    expect(body.current_margin_pct).not.toBe(undefined);  // ❌ Currently fails
    expect(body.missing_data_reason).not.toBe(undefined);  // ❌ Currently fails
  });
});
```

---

## Investigation Checklist for Backend Team

### 1. Check DTO Serialization
- [ ] Verify `AssignCogsResponseDto` includes all fields with `@ApiProperty()`
- [ ] Verify `CogsRecordDto` includes `id` field with correct mapping
- [ ] Check if `class-transformer` decorators are needed (e.g., `@Expose()`)

### 2. Check Service Layer Mapping
- [ ] Verify `assignCogs()` method computes `has_cogs = true` after creation
- [ ] Verify newly created COGS record ID is included in response
- [ ] Verify margin calculation is attempted (even if result is null)
- [ ] Verify `missing_data_reason` is set (null or reason code)

### 3. Check Database Query
- [ ] Verify Prisma query includes all required fields
- [ ] Check field name mapping (snake_case DB vs camelCase DTO)
- [ ] Verify COGS record is successfully created (check DB logs)

### 4. Check Null vs Undefined Handling
- [ ] Ensure fields are explicitly set to `null` (not `undefined`) when data missing
- [ ] JavaScript: `undefined` means "field missing", `null` means "no value available"
- [ ] TypeScript: Use `field: Type | null` (not `field?: Type`)

---

## Request to Backend Team

**Please investigate and fix:**
1. Why `has_cogs` returns `undefined` instead of `true` after successful COGS assignment
2. Why `cogs.id` returns `undefined` instead of the created COGS record ID
3. Why `current_margin_pct` returns `undefined` instead of `number | null`
4. Why `missing_data_reason` returns `undefined` instead of `string | null`

**Expected Deliverables:**
1. Fix backend response to include all fields with correct values
2. Add unit test verifying response structure (no undefined fields)
3. Update API documentation with complete response schema
4. Confirm margin calculation logic runs (even if result is null)

**Note:** Frontend workaround is in place to prevent crashes, but user experience is degraded until backend fix is deployed.

---

## Related Issues

**Frontend Fixes (Already Deployed):**
- ✅ Fixed `TypeError: Cannot read properties of undefined (reading 'toFixed')` in `useSingleCogsAssignment.ts:91`
- ✅ Fixed same error in `SingleCogsForm.tsx:107`
- ✅ Changed `!== null` checks to `!= null` (handles both null and undefined)

**Backend Issues (Needs Investigation):**
- ❌ `has_cogs` serialization missing
- ❌ `cogs.id` field not included in response
- ❌ `current_margin_pct` computation missing
- ❌ `missing_data_reason` not populated

---

## Contact & Coordination

**Frontend Team:**
- Reporter: Sarah (r2d2@example.com)
- Files Modified:
  - `frontend/src/hooks/useSingleCogsAssignment.ts`
  - `frontend/src/components/custom/SingleCogsForm.tsx`

**Backend Team:**
- Please investigate files:
  - `src/products/products.service.ts` (assignCogs method)
  - `src/products/dto/assign-cogs-response.dto.ts` (DTO serialization)
  - `src/products/products.controller.ts` (endpoint handler)

**Slack:** `#epic-18-cogs-api`
**Priority:** 🟡 Medium (workaround in place, but degrades UX)

---

## Appendix: Related Documentation

**Request #09:** Epic 18 COGS Management API Requirements
- `docs/request-backend/09-epic-18-cogs-management-api.md`
- Defines expected `ProductWithCogs` response structure

**Epic 17:** COGS Analytics (Deployed)
- `docs/request-backend/07-cogs-margin-analytics-includecogs-parameter.md`
- Uses similar `current_margin_pct` and `missing_data_reason` fields

**Frontend Types:**
- `frontend/src/types/api.ts` - TypeScript interface definitions
- `ProductWithCogs` interface expects all fields to be defined (not undefined)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-23
**Status:** 🟡 Awaiting Backend Investigation

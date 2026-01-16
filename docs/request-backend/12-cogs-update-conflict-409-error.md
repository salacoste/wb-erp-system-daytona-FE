# Request #12: COGS Update Returns 409 Conflict Instead of Updating

**Date:** 2025-11-23
**From:** Frontend Team
**To:** Backend Team
**Priority:** ✅ **RESOLVED** - Fixed by Backend Team (2025-11-23)
**Epic:** Epic 18 - COGS Management & Product Catalog API
**Related:** Request #09 (Epic 18 COGS Management API - Section: Duplicate Handling)

---

## ✅ RESOLUTION (2025-11-23)

**Status:** ✅ **FIXED** - Backend deployed idempotent UPDATE logic at 08:49 MSK

**What Changed:**
- Removed 409 Conflict exception for duplicate `(nm_id, valid_from)`
- Implemented UPDATE logic when COGS exists with same date
- Version number increments on update (`version++`)
- `updated_at` timestamp refreshed automatically
- Full idempotency: same request can be sent multiple times safely

**Test Results:**
- ✅ 21/21 tests passing (100% coverage)
- ✅ UPDATE instead of 409 Conflict ✅
- ✅ Bulk upload now updates duplicates ✅
- ✅ Version tracking works correctly ✅

**Reference:** `/docs/backend-response-09-epic-18-products-api-enhancement.md`

**User Impact:**
- ✅ Can now correct COGS typos without changing dates
- ✅ Can re-upload bulk files (idempotent operation)
- ✅ "Update" button works as expected (no workaround needed)

---

## Original Problem Description

**Problem:** Backend returns HTTP 409 Conflict when attempting to update existing COGS for the same `valid_from` date, instead of updating the existing record as specified in Epic 18 requirements.

**Impact:**
- ❌ Users **cannot update** COGS values for already assigned products
- ❌ Users **cannot correct mistakes** in COGS assignments
- ❌ Breaks temporal versioning workflow (cannot modify current active COGS)
- ⚠️ Workaround exists: change `valid_from` date to create new version (confusing UX)

**Business Impact:**
- Users forced to use workaround (change date to tomorrow) to update COGS
- Confusion about "update" vs "create new version" semantics
- Historical COGS data becomes incorrect if date is changed to work around the bug

---

## Problem Description

### Current Behavior (Incorrect)

**Scenario:** User assigns COGS to product, then wants to update the value.

**Step 1:** Initial COGS assignment (Success ✅)
```http
POST /v1/products/321678606/cogs
Content-Type: application/json
Authorization: Bearer <jwt>
X-Cabinet-Id: f75836f7-c0bc-4b2c-823c-a1f3508cce8e

{
  "unit_cost_rub": 111,
  "valid_from": "2025-11-23",
  "source": "manual",
  "notes": "Initial assignment"
}
```

**Response:** HTTP 200 OK ✅
```json
{
  "nm_id": "321678606",
  "sa_name": "Краска для мебели Space Chemical MK-800W",
  "has_cogs": true,
  "cogs": {
    "id": "cogs_abc123",
    "unit_cost_rub": "111.00",
    "valid_from": "2025-11-23T00:00:00.000Z",
    "notes": "Initial assignment"
  }
}
```

**Step 2:** Update COGS value (Error ❌)
```http
POST /v1/products/321678606/cogs
Content-Type: application/json
Authorization: Bearer <jwt>
X-Cabinet-Id: f75836f7-c0bc-4b2c-823c-a1f3508cce8e

{
  "unit_cost_rub": 113,          // ✏️ Updated value (was 111)
  "valid_from": "2025-11-23",    // ⚠️ Same date
  "source": "manual",
  "notes": "Updated cost"
}
```

**Response:** HTTP 409 Conflict ❌
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "COGS entry already exists for nm_id=321678606 at valid_from=2025-11-23",
    "details": [],
    "trace_id": "c627bebb-6781-439c-a780-d3146aa95b9d",
    "timestamp": "2025-11-23T05:30:24.482Z",
    "path": "/v1/products/321678606/cogs"
  }
}
```

**User Experience:**
- ⚠️ Frontend shows error alert: "COGS entry already exists for nm_id=321678606 at valid_from=2025-11-23"
- ❌ User confused: "I want to UPDATE the COGS, not create duplicate!"
- 🔄 User forced to change date to tomorrow as workaround

---

## Expected Behavior (Per Epic 18 Spec)

### Reference: Request #09 - Section "Duplicate Handling"

> **Quote from Epic 18 Specification:**
>
> **Duplicate Handling:**
> - If COGS for `(nm_id, valid_from)` already exists → **UPDATE** existing record
> - Increment `version` number
> - Set `updated_at` timestamp

**Source:** `docs/request-backend/09-epic-18-cogs-management-api.md` (Lines 480-484)

### Expected HTTP 200 Response (Update Success)

**Request (Same as Step 2 Above):**
```http
POST /v1/products/321678606/cogs

{
  "unit_cost_rub": 113,
  "valid_from": "2025-11-23",
  "source": "manual",
  "notes": "Updated cost"
}
```

**Expected Response:** HTTP 200 OK ✅
```json
{
  "nm_id": "321678606",
  "sa_name": "Краска для мебели Space Chemical MK-800W",
  "has_cogs": true,
  "cogs": {
    "id": "cogs_abc123",           // ✅ Same ID (updated, not created)
    "unit_cost_rub": "113.00",     // ✅ Updated value
    "valid_from": "2025-11-23T00:00:00.000Z",  // ✅ Same date
    "notes": "Updated cost",        // ✅ Updated notes
    "version": 2,                   // ✅ Incremented version (was 1)
    "updated_at": "2025-11-23T05:35:00.000Z"  // ✅ Updated timestamp
  }
}
```

**Database State:**
```sql
-- BEFORE UPDATE:
SELECT * FROM cogs WHERE nm_id = 321678606 AND valid_to IS NULL;
-- Result:
-- id=123, nm_id=321678606, unit_cost_rub=111.00, valid_from='2025-11-23',
-- version=1, updated_at='2025-11-23 05:30:00'

-- AFTER UPDATE:
SELECT * FROM cogs WHERE nm_id = 321678606 AND valid_to IS NULL;
-- Result:
-- id=123, nm_id=321678606, unit_cost_rub=113.00, valid_from='2025-11-23',
-- version=2, updated_at='2025-11-23 05:35:00'
```

---

## Business Use Cases (Why Update is Required)

### Use Case 1: Correct Data Entry Mistake
**Scenario:** User enters COGS as 1110 RUB instead of 111 RUB (typo)

**Expected Flow:**
1. User notices error immediately
2. User updates COGS to correct value (111 RUB)
3. **Same date** because COGS was always 111 RUB (not 1110)
4. Version increments to track correction

**Current Broken Flow:**
1. User notices error
2. Backend returns 409 Conflict ❌
3. User forced to change date to tomorrow
4. **Historical data now incorrect** (COGS shows 1110 for today, 111 starting tomorrow)

### Use Case 2: Supplier Price Change (Same Delivery)
**Scenario:** Supplier notifies price change on shipment that arrived today

**Expected Flow:**
1. User assigns initial COGS based on invoice
2. Supplier sends corrected invoice (same delivery date)
3. User updates COGS with **same valid_from** date
4. Single record with correct final price

**Current Broken Flow:**
1. User assigns initial COGS
2. Backend rejects update with 409 ❌
3. User creates new version with tomorrow's date
4. **Data shows two different prices** for same shipment (confusing analytics)

### Use Case 3: Bulk Import Correction
**Scenario:** User uploads 100 products via Excel, finds 10 have incorrect COGS

**Expected Flow:**
1. Re-upload corrected Excel file with same dates
2. Backend updates 10 records, skips 90 unchanged
3. Version increments for updated records

**Current Broken Flow:**
1. Re-upload fails with 409 for all 100 products ❌
2. User must manually change dates or delete original records first
3. Temporal versioning history becomes meaningless

---

## Root Cause Analysis

### Backend Service Logic (Hypothesis)

**Current Implementation (Incorrect):**
```typescript
// backend/src/products/products.service.ts
async assignCogs(nmId: string, cogsData: CogsAssignmentRequest) {
  // Step 1: Check for existing COGS with same (nm_id, valid_from)
  const existing = await this.prisma.cogs.findFirst({
    where: {
      nm_id: nmId,
      valid_from: cogsData.valid_from,
    },
  });

  // Step 2: If exists → REJECT with 409 ❌
  if (existing) {
    throw new ConflictException(
      `COGS entry already exists for nm_id=${nmId} at valid_from=${cogsData.valid_from}`
    );
  }

  // Step 3: Create new COGS (only reached if no duplicate)
  const newCogs = await this.prisma.cogs.create({
    data: { /* ... */ },
  });

  return newCogs;
}
```

**Expected Implementation (Correct):**
```typescript
// backend/src/products/products.service.ts
async assignCogs(nmId: string, cogsData: CogsAssignmentRequest) {
  // Step 1: Check for existing COGS with same (nm_id, valid_from)
  const existing = await this.prisma.cogs.findFirst({
    where: {
      nm_id: nmId,
      valid_from: cogsData.valid_from,
    },
  });

  // Step 2: If exists → UPDATE (not reject!) ✅
  if (existing) {
    const updated = await this.prisma.cogs.update({
      where: { id: existing.id },
      data: {
        unit_cost_rub: cogsData.unit_cost_rub,
        notes: cogsData.notes,
        source: cogsData.source,
        version: existing.version + 1,  // ✅ Increment version
        updated_at: new Date(),          // ✅ Update timestamp
      },
    });
    return updated;
  }

  // Step 3: Create new COGS if no duplicate
  const newCogs = await this.prisma.cogs.create({
    data: {
      nm_id: nmId,
      unit_cost_rub: cogsData.unit_cost_rub,
      valid_from: cogsData.valid_from,
      notes: cogsData.notes,
      source: cogsData.source,
      version: 1,  // ✅ First version
    },
  });

  return newCogs;
}
```

---

## Temporal Versioning Clarification

### Semantic Distinction: Update vs New Version

**UPDATE (Same Date):**
- User **corrects** existing COGS value
- Database: **UPDATE** existing record
- `valid_from` unchanged, `version` increments
- **Use Case:** Typo correction, same-day price adjustment

**NEW VERSION (Different Date):**
- User **changes** COGS starting from new date
- Database: **INSERT** new record, close old record
- `valid_from` changes, new row created
- **Use Case:** Supplier price change effective from future date

### Example Database States

**Scenario: Initial Assignment**
```sql
INSERT INTO cogs (nm_id, unit_cost_rub, valid_from, valid_to, version)
VALUES (321678606, 111.00, '2025-11-23', NULL, 1);

-- Result:
-- id=123, nm_id=321678606, unit_cost_rub=111.00,
-- valid_from='2025-11-23', valid_to=NULL, version=1
```

**Scenario: UPDATE (Same Date) - Correct Current Behavior**
```sql
-- User updates COGS to 113.00 with same date (correction)
UPDATE cogs
SET unit_cost_rub = 113.00, version = 2, updated_at = NOW()
WHERE id = 123;

-- Result (Single Record):
-- id=123, nm_id=321678606, unit_cost_rub=113.00,
-- valid_from='2025-11-23', valid_to=NULL, version=2
```

**Scenario: NEW VERSION (Different Date) - Temporal Versioning**
```sql
-- User creates new COGS starting 2025-12-01 (future price change)

-- Step 1: Close current version
UPDATE cogs
SET valid_to = '2025-11-30'
WHERE id = 123;

-- Step 2: Create new version
INSERT INTO cogs (nm_id, unit_cost_rub, valid_from, valid_to, version)
VALUES (321678606, 120.00, '2025-12-01', NULL, 1);

-- Result (Two Records):
-- id=123, unit_cost_rub=113.00, valid_from='2025-11-23', valid_to='2025-11-30', version=2
-- id=456, unit_cost_rub=120.00, valid_from='2025-12-01', valid_to=NULL, version=1
```

**Key Insight:**
- `version` tracks **corrections** to same temporal period
- New temporal period starts with `version=1` again
- Both mechanisms are needed for different use cases

---

## Testing Requirements

### Unit Test (Backend Service)

```typescript
// backend/src/products/products.service.spec.ts
describe('ProductsService.assignCogs - Duplicate Handling', () => {
  it('should UPDATE existing COGS when valid_from matches', async () => {
    // Step 1: Create initial COGS
    await service.assignCogs('321678606', {
      unit_cost_rub: 111,
      valid_from: '2025-11-23',
      source: 'manual',
      notes: 'Initial',
    });

    // Step 2: Update with same date (should not throw)
    const result = await service.assignCogs('321678606', {
      unit_cost_rub: 113,
      valid_from: '2025-11-23',  // ✅ Same date
      source: 'manual',
      notes: 'Updated',
    });

    // ✅ Assert: Same ID (updated, not created)
    expect(result.id).toBeDefined();

    // ✅ Assert: Updated values
    expect(result.unit_cost_rub).toBe('113.00');
    expect(result.notes).toBe('Updated');

    // ✅ Assert: Version incremented
    expect(result.version).toBe(2);

    // ✅ Assert: Only one record exists
    const allRecords = await prisma.cogs.findMany({
      where: { nm_id: '321678606' },
    });
    expect(allRecords.length).toBe(1);
  });

  it('should CREATE new version when valid_from differs', async () => {
    // Step 1: Create initial COGS
    await service.assignCogs('321678606', {
      unit_cost_rub: 111,
      valid_from: '2025-11-23',
      source: 'manual',
    });

    // Step 2: Create new version with different date
    await service.assignCogs('321678606', {
      unit_cost_rub: 120,
      valid_from: '2025-12-01',  // ✅ Different date
      source: 'manual',
    });

    // ✅ Assert: Two records exist
    const allRecords = await prisma.cogs.findMany({
      where: { nm_id: '321678606' },
    });
    expect(allRecords.length).toBe(2);

    // ✅ Assert: First record closed
    const oldRecord = allRecords.find(r => r.valid_from === '2025-11-23');
    expect(oldRecord.valid_to).toBe('2025-11-30');

    // ✅ Assert: New record active
    const newRecord = allRecords.find(r => r.valid_from === '2025-12-01');
    expect(newRecord.valid_to).toBeNull();
  });
});
```

### Integration Test (E2E)

```typescript
// backend/test/cogs.e2e-spec.ts
describe('POST /v1/products/:nmId/cogs - Duplicate Handling', () => {
  it('should update COGS when same valid_from is sent twice', async () => {
    // Step 1: Initial assignment
    await request(app.getHttpServer())
      .post('/v1/products/321678606/cogs')
      .set('Authorization', `Bearer ${validJWT}`)
      .set('X-Cabinet-Id', cabinetId)
      .send({
        unit_cost_rub: 111,
        valid_from: '2025-11-23',
        source: 'manual',
      })
      .expect(200);

    // Step 2: Update with same date
    const response = await request(app.getHttpServer())
      .post('/v1/products/321678606/cogs')
      .set('Authorization', `Bearer ${validJWT}`)
      .set('X-Cabinet-Id', cabinetId)
      .send({
        unit_cost_rub: 113,
        valid_from: '2025-11-23',  // ✅ Same date
        source: 'manual',
      })
      .expect(200);  // ✅ NOT 409!

    // ✅ Verify updated value
    expect(response.body.cogs.unit_cost_rub).toBe('113.00');
    expect(response.body.cogs.version).toBe(2);
  });
});
```

---

## Frontend Workaround (Temporary)

**Current User Instruction:**
> ⚠️ "To update COGS, change the date to tomorrow and submit. This will create a new version starting from the new date."

**Problems with Workaround:**
1. Confusing UX (users expect "Update" button to update, not create new version)
2. Historical data becomes incorrect if user just wanted to fix a typo
3. Creates unnecessary temporal versions for simple corrections
4. Bulk uploads become nearly impossible (all dates must be shifted)

**Recommendation:** Remove workaround once backend fix is deployed.

---

## Error Code Clarification

### HTTP 409 Conflict - When to Use

**Correct Use Cases for 409:**
- ✅ Concurrent write conflict (optimistic locking failure)
- ✅ Resource already exists AND cannot be updated (e.g., immutable records)
- ✅ Business rule violation (e.g., "Cannot delete COGS with active sales")

**Incorrect Use Case (This Bug):**
- ❌ COGS already exists for `(nm_id, valid_from)` → Should **UPDATE**, not reject

### Recommended Error Codes

| Scenario | HTTP Status | Action |
|----------|-------------|--------|
| COGS exists, same `valid_from` | **200 OK** | UPDATE existing record ✅ |
| COGS exists, different `valid_from` | **200 OK** | CREATE new version, close old ✅ |
| Invalid `unit_cost_rub` (negative) | **400 Bad Request** | Validation error ✅ |
| Product `nm_id` not found | **404 Not Found** | Product doesn't exist ✅ |
| User doesn't own cabinet | **403 Forbidden** | Authorization error ✅ |
| Optimistic lock failure (version mismatch) | **409 Conflict** | Concurrent write detected ✅ |

---

## Request to Backend Team

### Required Changes

**Please fix the following:**

1. **Remove 409 Conflict Check** for `(nm_id, valid_from)` duplicates
2. **Implement UPDATE Logic** when COGS exists with same date:
   - Update `unit_cost_rub`, `notes`, `source`
   - Increment `version` number
   - Update `updated_at` timestamp
   - Return HTTP 200 with updated record
3. **Keep CREATE Logic** when COGS has different date (temporal versioning)
4. **Add Unit Tests** to verify UPDATE behavior (see Testing Requirements section)
5. **Add E2E Tests** to verify endpoint behavior

### Expected Behavior Summary

**Decision Tree:**
```
POST /v1/products/:nmId/cogs with { valid_from: X }
  |
  ├─ COGS exists with valid_from = X?
  |    ├─ YES → UPDATE existing record (version++, updated_at=NOW)
  |    |         Return HTTP 200 with updated record ✅
  |    |
  |    └─ NO → Check if COGS exists with valid_from ≠ X?
  |         ├─ YES → Close old COGS (valid_to = X-1 day)
  |         |         CREATE new COGS (valid_from = X, version=1)
  |         |         Return HTTP 200 with new record ✅
  |         |
  |         └─ NO → CREATE new COGS (version=1)
  |                  Return HTTP 200 with new record ✅
```

### Implementation Checklist

- [ ] Modify `assignCogs()` service method to handle UPDATE case
- [ ] Ensure `version` field is incremented on UPDATE
- [ ] Ensure `updated_at` timestamp is updated on UPDATE
- [ ] Verify single record exists after UPDATE (not duplicate)
- [ ] Add unit test: UPDATE existing COGS with same date
- [ ] Add unit test: CREATE new version with different date
- [ ] Add E2E test: POST same COGS twice → expect 200 both times
- [ ] Update API documentation (Swagger) to reflect UPDATE behavior
- [ ] Remove 409 Conflict error from documentation for this scenario

---

## Success Criteria

### Functional Requirements ✅

- [ ] `POST /v1/products/:nmId/cogs` with existing `valid_from` returns **HTTP 200** (not 409)
- [ ] Updated COGS has incremented `version` number
- [ ] Updated COGS has same `id` (not new record)
- [ ] Updated COGS has current `updated_at` timestamp
- [ ] Database contains **single record** after update (not duplicate)
- [ ] Temporal versioning still works for different `valid_from` dates

### Testing Requirements ✅

- [ ] Unit test: UPDATE existing COGS (same date) passes
- [ ] Unit test: CREATE new version (different date) passes
- [ ] E2E test: POST → POST → GET returns updated value
- [ ] E2E test: Verify database state after update (single record)

### User Experience ✅

- [ ] Users can correct COGS mistakes without changing dates
- [ ] Users can re-upload bulk COGS files (idempotent operation)
- [ ] "Update" button in UI works as expected (no workaround needed)

---

## Related Documentation

**Epic 18 Specification:**
- `docs/request-backend/09-epic-18-cogs-management-api.md`
- Section: "Duplicate Handling" (Lines 480-484)
- Quote: "If COGS for (nm_id, valid_from) already exists → UPDATE existing record"

**Related Issues:**
- Request #11: Undefined fields in COGS assignment response
- Request #09: Epic 18 COGS Management API requirements

**Frontend Files:**
- `frontend/src/components/custom/SingleCogsForm.tsx` - COGS assignment form
- `frontend/src/hooks/useSingleCogsAssignment.ts` - API integration hook

**Backend Files (Expected):**
- `backend/src/products/products.service.ts` - COGS assignment logic
- `backend/src/products/products.controller.ts` - Endpoint handler
- `backend/prisma/schema.prisma` - COGS table schema

---

## Contact & Coordination

**Frontend Team:**
- Reporter: Sarah (r2d2@example.com)
- Status: Workaround communicated to users, awaiting backend fix

**Backend Team:**
- Action Required: Fix 409 Conflict logic, implement UPDATE
- Expected Delivery: [To be discussed]

**Slack:** `#epic-18-cogs-api`
**Priority:** 🔴 HIGH (blocks COGS correction workflow)

---

## Appendix: Screenshot Evidence

**User Flow:**
1. User assigns COGS: 111 RUB on 2025-11-23 ✅
2. User updates COGS: 113 RUB on 2025-11-23 ❌ **409 Conflict**
3. Error message: "COGS entry already exists for nm_id=321678606 at valid_from=2025-11-23"

**Console Logs:**
```
❌ API Error [409]: {
  "error": {
    "code": "CONFLICT",
    "message": "COGS entry already exists for nm_id=321678606 at valid_from=2025-11-23",
    "trace_id": "c627bebb-6781-439c-a780-d3146aa95b9d"
  }
}

❌ [COGS Assignment] Failed to assign COGS to product 321678606:
   ApiError: COGS entry already exists for nm_id=321678606 at valid_from=2025-11-23
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-23
**Status:** 🔴 Awaiting Backend Fix

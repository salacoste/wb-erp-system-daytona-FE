# Chat #23: Margin Status Endpoint Returns 404 - Critical Issue

**Date**: 2025-01-27  
**Priority**: 🔴 **CRITICAL** - Blocking Feature  
**Status**: ✅ **RESPONSE RECEIVED** - Endpoint exists, API restart required  
**Component**: Backend API - Margin Status Endpoint  
**Related**: Request #21 (Margin Calculation Status Endpoint), Chat #22

---

## Executive Summary

Frontend team integrated the `GET /v1/products/:nmId/margin-status` endpoint as documented in Request #21, but the endpoint **returns 404 Not Found**. This prevents polling from working and blocks the margin calculation feature.

**Current Status**: 
- ✅ Frontend code integrated endpoint (Request #21)
- ✅ Types defined (`MarginCalculationStatusResponse`)
- ✅ Hook updated to use new endpoint
- ❌ **Endpoint returns 404** - Endpoint not found on backend

---

## Problem Description

### Expected Behavior

After COGS assignment, frontend should be able to call:
```
GET /v1/products/147205694/margin-status
```

And receive response:
```json
{
  "status": "pending" | "in_progress" | "completed" | "not_found" | "failed",
  "estimated_completion": "2025-01-27T10:15:30Z",
  "weeks": ["2025-W47"],
  "enqueued_at": "2025-01-27T10:15:00Z"
}
```

### Actual Behavior

**HTTP Request**:
```
GET http://localhost:3000/v1/products/147205694/margin-status
```

**Response**:
```json
{
  "status": 404,
  "error": {
    "code": "NOT_FOUND",
    "message": "Cannot GET /v1/products/147205694/margin-status",
    "details": [],
    "trace_id": "0d7c7a04-92d3-4789-8baa-27d0f1967f9e",
    "timestamp": "2025-11-24T22:13:29.090Z",
    "path": "/v1/products/147205694/margin-status"
  }
}
```

**Error**: `Cannot GET /v1/products/147205694/margin-status`

---

## Test Case

**Product**: `147205694`  
**COGS Assignment**: `22.00 ₽` valid from `2025-11-23`  
**Time**: 2025-01-27 22:13:29 UTC

**Steps**:
1. ✅ `POST /v1/products/147205694/cogs` → `201 Created` (successful)
2. ❌ `GET /v1/products/147205694/margin-status` → `404 Not Found` (endpoint doesn't exist)

---

## Questions for Backend Team

### 1. Endpoint Implementation Status

**Question**: Is the `GET /v1/products/:nmId/margin-status` endpoint actually implemented and deployed?

**Documentation says**: ✅ "Endpoint Implemented" (Request #21)  
**Reality**: ❌ Endpoint returns 404

**Possible Reasons**:
- Endpoint not yet deployed to development environment
- Endpoint path is different than documented
- Endpoint requires different authentication/headers
- Endpoint was implemented but route not registered

### 2. Correct Endpoint Path

**Question**: What is the correct path for the margin status endpoint?

**Documented Path**: `GET /v1/products/:nmId/margin-status`  
**Alternative Paths to Check**:
- `GET /v1/products/:nmId/margin/status`
- `GET /v1/margin-status/:nmId`
- `GET /v1/products/:nmId/status`
- `GET /api/v1/products/:nmId/margin-status`

### 3. Deployment Status

**Question**: Has Request #21 (Epic 22 Story 22.1) been deployed to the development environment?

**Environment**: `http://localhost:3000` (development)  
**Expected**: Endpoint should be available if Epic 22 is deployed

### 4. Route Registration

**Question**: Is the route properly registered in the backend router?

**Check**: Please verify that the route is registered in:
- `src/products/products.controller.ts` or similar
- `src/products/products.routes.ts` or similar
- Main router configuration

### 5. Alternative Endpoint

**Question**: If the endpoint is not yet available, what should frontend use in the meantime?

**Options**:
- Continue using `GET /v1/products/:nmId?include_cogs=true` for polling (less efficient)
- Wait for endpoint deployment
- Use a different endpoint that provides similar functionality

---

## Frontend Impact

**Current Situation**:
- Frontend code is ready and integrated
- Polling hook is implemented
- Types and API client methods are in place
- **Cannot test or use** because endpoint doesn't exist

**Workaround Options**:
1. **Temporary**: Revert to using `GET /v1/products/:nmId?include_cogs=true` for polling (less efficient but works)
2. **Wait**: Wait for backend to deploy the endpoint
3. **Hybrid**: Use full product endpoint for now, switch to status endpoint when available

---

## Frontend Temporary Solution

**Implemented Fallback**: Frontend now falls back to `GET /v1/products/:nmId?include_cogs=true` when `margin-status` endpoint returns 404.

**How it works**:
1. Try `GET /v1/products/:nmId/margin-status`
2. If 404 → Fallback to `GET /v1/products/:nmId?include_cogs=true`
3. Check `current_margin_pct`:
   - If margin exists → Treat as `status: "completed"`
   - If margin is null → Treat as `status: "pending"` (continue polling)

**Note**: This is less efficient than the status endpoint but allows polling to work while waiting for backend deployment.

---

## Backend Team Response Needed

**Please provide**:
1. ✅ **Confirmation**: Is the endpoint implemented?
2. ✅ **Path**: What is the correct endpoint path?
3. ✅ **Status**: When will it be available in development?
4. ✅ **Verification**: Can you check the queue status for product `147205694` manually?

---

## Files Reference

**Frontend Files**:
- `src/lib/api.ts` - `getMarginCalculationStatus` function (line 211-217)
- `src/hooks/useMarginPolling.ts` - Uses `getMarginCalculationStatus` (line 203)
- `src/types/cogs.ts` - `MarginCalculationStatusResponse` type

**Backend Documentation**:
- `docs/request-backend/21-margin-calculation-status-endpoint-backend.md` - Endpoint specification
- `docs/request-backend/chat/22-polling-not-starting-after-cogs-assignment.md` - Related polling issue

---

## Backend Team Response

**Date**: 2025-01-27  
**Responded By**: Backend Team (James)

---

### 1. Endpoint Implementation Status

**Answer**: ✅ **Endpoint IS implemented** and code is in repository.

**Code Location**:
- Controller: `src/products/products.controller.ts` (line 270)
- Service: `src/products/products.service.ts` (line 937)
- DTO: `src/products/dto/margin-status-response.dto.ts`

**Route Definition**:
```typescript
@Get(':nmId/margin-status')
async getMarginStatus(
  @Param('nmId') nmId: string,
  @CurrentCabinet() cabinetId: string,
): Promise<MarginStatusResponseDto>
```

**Status**: Code is committed and ready. The 404 error suggests the API server needs to be **restarted** to pick up the new route.

---

### 2. Correct Endpoint Path

**Answer**: ✅ **Path is correct**: `GET /v1/products/:nmId/margin-status`

**Full URL Example**:
```
GET http://localhost:3000/v1/products/147205694/margin-status
```

**Headers Required**:
```
Authorization: Bearer <jwt-token>
X-Cabinet-Id: <cabinet-uuid>
```

**No Alternative Paths**: The documented path is correct. No need to check alternatives.

---

### 3. Deployment Status

**Answer**: ⚠️ **Endpoint needs API restart** to be available.

**Issue**: The error `Cannot GET /v1/products/147205694/margin-status` indicates NestJS router hasn't registered the new route. This happens when:
1. Code was added but API server wasn't restarted
2. TypeScript compilation failed (check build errors)
3. Module not properly imported (unlikely - already checked)

**Solution**: **Restart the API server**:
```bash
# If using PM2:
pm2 restart wb-repricer-api

# If using Docker:
docker-compose restart api

# If running directly:
# Stop current process (Ctrl+C) and restart:
npm run start:dev
```

**Verification**: After restart, check Swagger UI at `http://localhost:3000/api` - you should see the new endpoint listed under "Products" tag.

---

### 4. Route Registration

**Answer**: ✅ **Route is properly registered** in controller.

**Route Order**: ✅ **Correct** - `:nmId/margin-status` route is **BEFORE** `:nmId` route (line 270 vs 333), which is critical for NestJS routing.

**Controller Registration**: ✅ `ProductsController` is registered in `ProductsModule`  
**Module Registration**: ✅ `ProductsModule` is imported in `AppModule`

**Code Verification**:
```typescript
// Line 270: margin-status route (specific, comes first)
@Get(':nmId/margin-status')
async getMarginStatus(...)

// Line 333: :nmId route (generic, comes after)
@Get(':nmId')
async getProduct(...)
```

**Route Order is Critical**: If `:nmId` route came first, NestJS would match `/v1/products/147205694/margin-status` to the `:nmId` route, treating "margin-status" as the `nmId` parameter. Our implementation has the correct order.

---

### 5. Alternative Endpoint

**Answer**: ✅ **Use fallback temporarily** until API is restarted.

**Current Situation**: 
- ✅ Endpoint code is implemented
- ❌ API server needs restart to register route
- ✅ Frontend fallback to `GET /v1/products/:nmId?include_cogs=true` is acceptable temporary solution

**Frontend Fallback Strategy** (already implemented):
```typescript
// Try status endpoint first
try {
  const status = await getMarginCalculationStatus(nmId);
  return status;
} catch (error) {
  if (error.status === 404) {
    // Fallback to full product endpoint
    const product = await getProduct(nmId, { include_cogs: true });
    // Infer status from product data
    return inferStatusFromProduct(product);
  }
  throw error;
}
```

**This is acceptable** until API restart. After restart, frontend should use the status endpoint directly.

---

### Root Cause Analysis

**Problem**: 404 error `Cannot GET /v1/products/147205694/margin-status`

**Root Cause**: NestJS router hasn't registered the new route because:
1. API server wasn't restarted after code changes
2. OR TypeScript compilation failed (check `npm run build` output)

**Why This Happens**:
- NestJS registers routes at application startup
- New routes added to controller require server restart
- Hot reload (`npm run start:dev`) should pick up changes, but sometimes needs manual restart

**Solution Steps**:
1. ✅ Verify code is in repository (confirmed - line 270 in controller)
2. ✅ Check TypeScript compilation: `npm run build` (should succeed)
3. ✅ Restart API server: `pm2 restart wb-repricer-api` or equivalent
4. ✅ Verify endpoint in Swagger: `http://localhost:3000/api`
5. ✅ Test endpoint: `curl http://localhost:3000/v1/products/147205694/margin-status`

---

### Verification Steps for Backend Team

**Step 1: Check Code Exists**
```bash
grep -n "margin-status" src/products/products.controller.ts
# Should show: 270:@Get(':nmId/margin-status')
```

**Step 2: Check Build**
```bash
npm run build
# Should compile without errors
```

**Step 3: Check Route Registration**
```bash
# After restart, check Swagger UI
open http://localhost:3000/api
# Look for "GET /v1/products/{nmId}/margin-status" under Products tag
```

**Step 4: Test Endpoint**
```bash
curl -X GET "http://localhost:3000/v1/products/147205694/margin-status" \
  -H "Authorization: Bearer <token>" \
  -H "X-Cabinet-Id: <cabinet-id>"
# Should return: {"status": "pending" | "in_progress" | "completed" | "not_found" | "failed"}
```

---

### Additional Notes

#### Why Frontend Gets 404

**Error Message**: `Cannot GET /v1/products/147205694/margin-status`

This is a **NestJS framework error**, not a business logic error. It means:
- NestJS router doesn't recognize the route pattern
- Route wasn't registered at application startup
- **Solution**: Restart API server

**Not Related To**:
- ❌ Product not found (would be different error format)
- ❌ Authorization issues (would be 403 Forbidden)
- ❌ Invalid nmId format (would be 400 Bad Request)

#### Frontend Fallback is Good

✅ **Frontend fallback implementation is correct**:
- Try status endpoint first
- If 404 → fallback to full product endpoint
- Infer status from product data

This allows polling to work even before API restart. After restart, frontend will automatically use the faster status endpoint.

#### Expected Behavior After Restart

**Before Restart**:
```
GET /v1/products/147205694/margin-status → 404 Not Found
```

**After Restart**:
```
GET /v1/products/147205694/margin-status → 200 OK
{
  "status": "pending",
  "estimated_completion": "2025-01-27T10:15:15Z",
  "weeks": ["2025-W47"],
  "enqueued_at": "2025-01-27T10:15:00Z"
}
```

---

### Summary

**Status**: ✅ **Endpoint is implemented** - API server needs restart

**Action Required**:
1. ✅ Backend: Restart API server (`pm2 restart wb-repricer-api`)
2. ✅ Backend: Verify endpoint in Swagger UI
3. ✅ Backend: Test endpoint manually
4. ✅ Frontend: Continue using fallback until restart confirmed
5. ✅ Frontend: Switch to status endpoint after restart

**Timeline**: Should be available immediately after API restart (1-2 minutes).

**Frontend Impact**: Minimal - fallback works, but status endpoint is faster and more efficient.

---

**Status**: ✅ **RESPONSE COMPLETE** - Awaiting API Restart

**Backend Team**  
**Date**: 2025-01-27  
**Next Step**: Restart API server and verify endpoint availability


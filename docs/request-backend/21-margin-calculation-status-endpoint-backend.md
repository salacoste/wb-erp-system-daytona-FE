# Request #21: Margin Calculation Status Endpoint - Backend Response

**Date**: 2025-01-27  
**Priority**: ✅ **RESOLVED**  
**Status**: ✅ **COMPLETED** - Endpoint Implemented  
**Component**: Backend API - Products Module (Epic 22 Story 22.1)  
**Related**: Request #20 (Frontend Polling Implementation Issues)

---

## Executive Summary

✅ **Endpoint Implemented**: `GET /v1/products/:nmId/margin-status`

Backend team has implemented a lightweight status endpoint specifically designed to solve frontend polling inefficiency issues identified in Request #20. This endpoint provides real-time margin calculation task status without requiring full product data fetch.

**QA Status**: ✅ **PASS** - All tests passing, production-ready

---

## Solution Overview

### Problem Addressed (from Request #20)

Frontend team identified two critical issues:
1. **Polling hook not restarting** after COGS assignment
2. **Infinite re-render loop** in `usePendingMarginProducts` hook
3. **No efficient way** to check if margin calculation task is queued/processing

### Backend Solution

**New Endpoint**: `GET /v1/products/:nmId/margin-status`

This endpoint:
- ✅ Checks BullMQ queue for pending/active margin calculation jobs
- ✅ Verifies margin data existence in `weekly_margin_fact` table
- ✅ Returns lightweight status response (< 100ms p95 target)
- ✅ Provides estimated completion time for pending/in-progress tasks
- ✅ Includes error information for failed tasks

**Epic**: Epic 22 - Margin Calculation Status Endpoint  
**Story**: Story 22.1 - Implementation completed and QA verified

---

## API Endpoint Specification

### Endpoint

```
GET /v1/products/:nmId/margin-status
```

### Authentication

- **Required**: JWT Bearer token
- **Required Header**: `X-Cabinet-Id` (cabinet UUID)

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nmId` | string | Yes | Product article number (numeric string) |

### Response Format

**Status Code**: `200 OK`

```json
{
  "status": "pending" | "in_progress" | "completed" | "not_found" | "failed",
  "estimated_completion": "2025-01-27T10:15:30Z",  // Optional: ISO timestamp
  "weeks": ["2025-W47", "2025-W48"],                // Optional: ISO weeks being calculated
  "enqueued_at": "2025-01-27T10:15:00Z",            // Optional: ISO timestamp
  "started_at": "2025-01-27T10:15:05Z",             // Optional: ISO timestamp (in_progress only)
  "error": "Database connection timeout"            // Optional: Error message (failed only)
}
```

### Status Values

| Status | Description | When Returned |
|--------|-------------|---------------|
| `pending` | Task is queued but not started | Job found in BullMQ `waiting` state |
| `in_progress` | Task is currently processing | Job found in BullMQ `active` state |
| `completed` | Margin calculation finished | No job found, but margin data exists in `weekly_margin_fact` |
| `not_found` | No task and no margin data | No job found and no margin data in database |
| `failed` | Task failed (within last 24h) | Job found in BullMQ `failed` state |

### Optional Fields

**Field Presence Rules**:

- `estimated_completion`: Only present when `status` is `pending` or `in_progress`
- `weeks`: Only present when `status` is `pending` or `in_progress`
- `enqueued_at`: Only present when `status` is `pending`, `in_progress`, or `failed`
- `started_at`: Only present when `status` is `in_progress`
- `error`: Only present when `status` is `failed`

### Error Responses

**400 Bad Request**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid nmId format: abc. Expected numeric string."
  }
}
```

**403 Forbidden**:
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Product does not belong to user's cabinet"
  }
}
```

**404 Not Found**:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Product with nm_id=12345 not found"
  }
}
```

**500 Internal Server Error**:
```json
{
  "error": {
    "code": "INTERNAL",
    "message": "Queue service error: Redis connection timeout"
  }
}
```

---

## Usage Examples

### Example 1: Check Status After COGS Assignment

**Scenario**: User assigns COGS, frontend wants to check if margin calculation is queued.

**Request**:
```http
GET /v1/products/12345/margin-status
Authorization: Bearer <jwt-token>
X-Cabinet-Id: 123e4567-e89b-12d3-a456-426614174000
```

**Response** (Task Queued):
```json
{
  "status": "pending",
  "estimated_completion": "2025-01-27T10:15:15Z",
  "weeks": ["2025-W47"],
  "enqueued_at": "2025-01-27T10:15:00Z"
}
```

**Frontend Action**: Start polling with interval (e.g., 2-3 seconds), show "Расчёт маржи..." indicator.

---

### Example 2: Task Processing

**Request**: Same as Example 1

**Response** (Task Processing):
```json
{
  "status": "in_progress",
  "estimated_completion": "2025-01-27T10:15:20Z",
  "weeks": ["2025-W47"],
  "enqueued_at": "2025-01-27T10:15:00Z",
  "started_at": "2025-01-27T10:15:05Z"
}
```

**Frontend Action**: Continue polling, show progress indicator with estimated completion time.

---

### Example 3: Calculation Completed

**Request**: Same as Example 1

**Response** (Completed):
```json
{
  "status": "completed"
}
```

**Frontend Action**: Stop polling, refresh product data via `GET /v1/products/:nmId?include_cogs=true` to get updated margin values.

---

### Example 4: No Task Found (No COGS or No Sales)

**Request**: Same as Example 1

**Response** (Not Found):
```json
{
  "status": "not_found"
}
```

**Frontend Action**: No polling needed. Product either has no COGS assigned or no sales data. Show appropriate message to user.

---

### Example 5: Task Failed

**Request**: Same as Example 1

**Response** (Failed):
```json
{
  "status": "failed",
  "enqueued_at": "2025-01-27T10:15:00Z",
  "error": "Database connection timeout"
}
```

**Frontend Action**: Show error message to user, provide "Retry calculation" button that calls `POST /v1/tasks/enqueue` (see Request #17).

---

## Frontend Integration Guide

### Recommended Polling Strategy

**Step 1**: After COGS Assignment

```typescript
// After POST /v1/products/:nmId/cogs returns 201
const startPolling = async (nmId: string) => {
  const checkStatus = async () => {
    const response = await fetch(`/v1/products/${nmId}/margin-status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Cabinet-Id': cabinetId,
      },
    });
    const status = await response.json();
    
    if (status.status === 'completed') {
      // Stop polling, refresh product data
      clearInterval(pollInterval);
      await refreshProductData(nmId);
    } else if (status.status === 'failed') {
      // Stop polling, show error
      clearInterval(pollInterval);
      showError(status.error);
    }
    // Continue polling for 'pending' or 'in_progress'
  };
  
  // Poll every 2-3 seconds
  const pollInterval = setInterval(checkStatus, 2500);
  
  // Initial check
  await checkStatus();
};
```

**Step 2**: Polling Interval

- **Recommended**: 2-3 seconds
- **Maximum**: 5 seconds (to avoid excessive load)
- **Stop Condition**: When `status === 'completed'` or `status === 'failed'`

**Step 3**: Timeout Handling

- **Recommended Timeout**: 60 seconds (for single product)
- **Recommended Timeout**: 90 seconds (for bulk assignment)
- **Action on Timeout**: Show "Calculation taking longer than expected" message, allow manual retry

### Estimated Completion Times

Based on backend implementation and historical data:

| Scenario | Estimated Time | Notes |
|----------|----------------|-------|
| Single product (1 week) | 5-10 seconds | Fast calculation |
| Historical (7 weeks) | 20-30 seconds | Multiple weeks processed |
| Bulk (500 products) | 45-60 seconds | Aggregated task processing |

**Note**: `estimated_completion` field in response provides backend-calculated estimate based on queue position and processing time.

### Error Handling

**Network Errors**:
- Retry with exponential backoff (1s, 2s, 4s)
- Show "Connection error" message after 3 retries

**400 Bad Request**:
- Invalid `nmId` format - frontend validation should prevent this
- Log error for debugging

**403 Forbidden**:
- Product doesn't belong to cabinet - should not happen if frontend validates cabinet access
- Log error for debugging

**404 Not Found**:
- Product doesn't exist - stop polling, show "Product not found" message

**500 Internal Server Error**:
- Queue service unavailable - retry with exponential backoff
- Show "Service temporarily unavailable" message

---

## Comparison with Previous Approach

### Old Approach (Request #20 Problem)

**Issue**: Frontend had to poll full product endpoint:
```typescript
// ❌ Inefficient: Fetches full product data every poll
GET /v1/products/:nmId?include_cogs=true
```

**Problems**:
- Fetches unnecessary data (product details, COGS info, etc.)
- Slower response time
- More server load
- Harder to detect task status (had to check `current_margin_pct === null`)

### New Approach (Request #21 Solution)

**Solution**: Lightweight status endpoint:
```typescript
// ✅ Efficient: Only checks task status
GET /v1/products/:nmId/margin-status
```

**Benefits**:
- ✅ Fast response (< 100ms p95 target)
- ✅ Minimal data transfer
- ✅ Clear status values (`pending`, `in_progress`, `completed`, `failed`)
- ✅ Estimated completion time included
- ✅ Error information for failed tasks

---

## Migration Guide

### Step 1: Replace Polling Endpoint

**Before**:
```typescript
const response = await fetch(`/v1/products/${nmId}?include_cogs=true`);
const product = await response.json();
const isCalculating = product.current_margin_pct === null && 
                      product.missing_data_reason === null;
```

**After**:
```typescript
const response = await fetch(`/v1/products/${nmId}/margin-status`);
const status = await response.json();
const isCalculating = status.status === 'pending' || 
                      status.status === 'in_progress';
```

### Step 2: Update Polling Logic

**Before**: Check `current_margin_pct` and `missing_data_reason` from product response

**After**: Check `status` field from status endpoint response

### Step 3: Handle New Status Values

```typescript
switch (status.status) {
  case 'pending':
  case 'in_progress':
    // Continue polling
    showProgressIndicator(status.estimated_completion);
    break;
  case 'completed':
    // Stop polling, refresh product data
    stopPolling();
    refreshProductData(nmId);
    break;
  case 'failed':
    // Stop polling, show error
    stopPolling();
    showError(status.error);
    break;
  case 'not_found':
    // No task, no margin data
    stopPolling();
    showNoDataMessage();
    break;
}
```

---

## Performance Characteristics

### Response Time Targets

- **p50**: < 50ms
- **p95**: < 100ms (AC13 requirement)
- **p99**: < 200ms

**Validation**: Performance tests added in `test/products/margin-status-performance.e2e-spec.ts`

### Queue Query Efficiency

- **Parallel Queries**: Uses `Promise.all()` to fetch waiting/active/failed jobs simultaneously
- **Failed Jobs Limit**: Limited to 100 jobs (last 24 hours) to prevent performance degradation
- **Database Query**: Minimal `findFirst` query with single field select for existence check

---

## Testing

### Backend Test Coverage

✅ **Unit Tests**: 14 tests
- 8 tests for `QueueService.findJobsByProductId()`
- 6 tests for `ProductsService.getMarginCalculationStatus()`

✅ **E2E Tests**: Full flow testing
- File: `test/products/margin-status.e2e-spec.ts`
- Tests: COGS assignment → status check → completion verification

✅ **Performance Tests**: Response time validation
- File: `test/products/margin-status-performance.e2e-spec.ts`
- Validates: p95 < 100ms requirement (AC13)

✅ **DTO Validation Tests**: Field constraints
- File: `src/products/dto/margin-status-response.dto.spec.ts`

### QA Gate Status

**Gate**: ✅ **PASS**  
**Location**: `docs/qa/gates/22.1-margin-calculation-status-endpoint.yml`

**Summary**: All acceptance criteria met, comprehensive test coverage, production-ready.

---

## Related Documentation

- **Epic 22**: `docs/epics/epic-22-margin-calculation-status-endpoint.md`
- **Story 22.1**: `docs/stories/epic-22/story-22.1-margin-calculation-status-endpoint.md`
- **Request #20**: `frontend/docs/request-backend/20-frontend-polling-implementation-issues.md` (Original request)
- **Request #14**: `frontend/docs/request-backend/14-automatic-margin-recalculation-on-cogs-update-backend.md` (Epic 20 - Automatic recalculation)
- **Request #18**: `frontend/docs/request-backend/18-missing-margin-and-missing-data-reason-scenarios-backend.md` (Missing margin scenarios)

---

## Next Steps for Frontend

1. ✅ **Update Polling Hook**: Replace `GET /v1/products/:nmId?include_cogs=true` with `GET /v1/products/:nmId/margin-status`
2. ✅ **Implement Status Handling**: Add switch statement for all 5 status values
3. ✅ **Add Progress Indicator**: Show estimated completion time when `status === 'pending'` or `'in_progress'`
4. ✅ **Error Handling**: Display error message when `status === 'failed'`
5. ✅ **Stop Polling**: Stop polling when `status === 'completed'` or `'failed'`, then refresh product data

---

## Questions & Answers

### Q: How often should we poll this endpoint?

**A**: Recommended interval is **2-3 seconds**. Maximum 5 seconds to avoid excessive load. Backend is optimized for frequent polling (< 100ms response time).

### Q: What happens if we poll while task is processing multiple weeks?

**A**: Response will include `weeks` array with all weeks being calculated (e.g., `["2025-W47", "2025-W48", "2025-W49"]`). Status remains `in_progress` until all weeks are processed.

### Q: Can we use this endpoint to check status for products without COGS?

**A**: Yes, but it will return `status: "not_found"` (no task and no margin data). This is expected - no calculation needed if COGS is not assigned.

### Q: What if task fails? How do we retry?

**A**: When `status === 'failed'`, response includes `error` field with error message. Frontend can show error to user and provide "Retry" button that calls `POST /v1/tasks/enqueue` (see Request #17 for details).

### Q: How accurate is `estimated_completion`?

**A**: Estimated completion is calculated based on:
- Number of weeks being processed
- Queue position (if waiting)
- Historical processing times

It's an approximation. Actual completion may vary by ±5-10 seconds depending on system load.

---

## Summary

✅ **Endpoint Ready**: `GET /v1/products/:nmId/margin-status` is implemented, tested, and production-ready.

✅ **QA Verified**: All tests passing, gate status PASS.

✅ **Performance**: Meets < 100ms p95 target.

✅ **Documentation**: Complete API specification, examples, and integration guide provided.

**Frontend team can now implement efficient polling using this lightweight status endpoint, solving the issues identified in Request #20.**

---

**Backend Team**
**Date**: 2025-01-27
**Status**: ✅ Ready for Frontend Integration

---

## Current Status (2026-01-30)

### Implementation Status
- ✅ Finance summary endpoint working
- ✅ COGS data available (40 records in `cogs` table)
- ✅ Margin calculation status endpoint implemented
- ❌ Margin calculation aggregation: **NOT IMPLEMENTED**

### Why Returns Null
The endpoint returns `null` for margin fields because `weekly_margin_fact` table is not being populated by the data aggregation pipeline.

### Expected Behavior
When `weekly_margin_fact` has data:
```json
{
  "cogs_total": 53626.0,
  "cogs_coverage_pct": 100.0,
  "gross_profit": 102038.76,
  "margin_pct": 33.4
}
```

### Roadmap
- **Epic 56**: Completed (2026-01-29) - Historical COGS import from WB API
  - Does NOT populate `weekly_margin_fact`
  - Only imports COGS data into `cogs` table
- **Future**: Separate Epic needed for margin data aggregation
  - Required: Pipeline to aggregate `cogs` → `weekly_margin_fact`
  - Trigger points: COGS assignment, historical import, weekly scheduled task
  - See **Request #113** for complete documentation

### FrontEnd Action Required
Display empty state when:
- `cogs_total === null`
- `gross_profit === null`

See `frontend/docs/request-backend/113-margin-calculation-empty-state-behavior.md` for implementation details.


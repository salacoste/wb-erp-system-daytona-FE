# COGS Bulk Upload - Backend Changes Integration Plan

**Date**: 2026-01-30
**Epic**: 18 (COGS Management)
**Story**: 4.2 (Bulk COGS Assignment)
**Status**: Ready for Implementation

---

## Executive Summary

Backend team has **fixed COGS bulk upload to automatically trigger margin recalculation**. This eliminates the need for manual margin calculation triggers after bulk COGS assignments.

**Key Changes**:
- `POST /v1/cogs/bulk-upload` now returns `marginRecalculation` field
- Margin recalculation is **automatically enqueued** on bulk upload
- No more manual `/v1/tasks/enqueue` calls needed
- Frontend must handle new response format and display calculation status

**Impact**: Medium - 4 frontend files to modify, UI updates needed for margin calculation status

---

## Backend Changes Summary

### 1. Fixed Files

**Backend File**: `src/cogs/services/cogs.service.ts`

**Changes**:
1. Added `marginRecalculation` field to `BulkUploadResult` interface
2. `bulkUpload()` method now automatically triggers margin recalculation
3. Added `enqueueMarginRecalculationForBulk()` method
4. All 45 COGS service tests pass ✅

### 2. Data Verification

**Filled Data**: Weeks 2025-W47 to 2026-W04
- **834 COGS records** created
- **Total cogs_total**: 1,667,748 ₽
- **100% COGS coverage**

**API Verified**:
```json
// 2026-W03
{
  "cogs_total": 46293,
  "coverage": "100%"
}

// 2026-W04
{
  "cogs_total": 35818,
  "coverage": "100%"
}
```

---

## New API Response Format

### Endpoint: POST /v1/cogs/bulk-upload

### Old Response Format (Before Fix)

```typescript
{
  "createdItems": number,
  "updatedItems": number,
  "errors": Array<{
    nm_id: string,
    error: string
  }>
}
```

### New Response Format (After Fix)

```typescript
{
  "createdItems": number,
  "updatedItems": number,
  "errors": Array<{
    nm_id: string,
    error: string
  }>,
  "marginRecalculation": {
    "weeks": string[],              // ISO weeks affected (e.g., ["2026-W03", "2026-W04"])
    "status": "pending" | "in_progress" | "completed",
    "taskId": string                // Task UUID for tracking
  }
}
```

### Response Examples

**Example 1: Successful Bulk Upload with Margin Recalculation**
```json
{
  "createdItems": 50,
  "updatedItems": 0,
  "errors": [],
  "marginRecalculation": {
    "weeks": ["2026-W03", "2026-W04"],
    "status": "pending",
    "taskId": "task_abc123def456"
  }
}
```

**Example 2: Partial Success with Errors**
```json
{
  "createdItems": 45,
  "updatedItems": 0,
  "errors": [
    { "nm_id": "123456", "error": "PRODUCT_NOT_FOUND" },
    { "nm_id": "789012", "error": "DUPLICATE_ENTRY" }
  ],
  "marginRecalculation": {
    "weeks": ["2026-W03"],
    "status": "pending",
    "taskId": "task_xyz789"
  }
}
```

**Example 3: No Margin Recalculation (No Sales Data)**
```json
{
  "createdItems": 10,
  "updatedItems": 0,
  "errors": []
  // Note: marginRecalculation field ABSENT if no sales data exists
}
```

---

## Frontend Files to Modify

### 1. `/src/types/cogs.ts`

**Purpose**: Add new `marginRecalculation` type definition

**Changes**:
```typescript
// Add new type after BulkCogsUploadResponse (line ~316)

/**
 * Margin recalculation status from bulk COGS upload
 * Backend automatically enqueues margin calculation after bulk upload
 * Request #118/119 - Backend fix for automatic margin recalculation
 */
export interface MarginRecalculationStatus {
  /** ISO weeks affected by bulk COGS upload (e.g., ["2026-W03", "2026-W04"]) */
  weeks: string[]
  /** Current status of margin recalculation task */
  status: 'pending' | 'in_progress' | 'completed'
  /** Task UUID for tracking margin calculation progress */
  taskId: string
}

/**
 * Bulk COGS upload result (V2 format)
 * Use query parameter: ?format=v2
 * UPDATED: Now includes marginRecalculation field
 */
export interface BulkCogsUploadResponse {
  data: {
    succeeded: number       // Count of successful assignments
    failed: number          // Count of failed assignments
    results: BulkCogsResult[] // Detailed results for each item
    message: string         // Summary message in Russian
    marginRecalculation?: MarginRecalculationStatus // NEW: Automatic margin recalculation
  }
}
```

---

### 2. `/src/hooks/useBulkCogsAssignment.ts`

**Purpose**: Update hook to handle new `marginRecalculation` field

**Changes**:
```typescript
// In onSuccess callback (line ~83), extract marginRecalculation info

onSuccess: (data, variables) => {
  // ... existing invalidation logic ...

  // Log detailed results
  const { succeeded, failed, results, marginRecalculation } = data.data

  console.log(`✅ Bulk COGS assignment completed:`)
  console.log(`   Succeeded: ${succeeded}/${variables.items.length}`)
  console.log(`   Failed: ${failed}/${variables.items.length}`)

  // NEW: Log margin recalculation status
  if (marginRecalculation) {
    console.log(`   Margin Recalculation:`)
    console.log(`     Status: ${marginRecalculation.status}`)
    console.log(`     Weeks: ${marginRecalculation.weeks.join(', ')}`)
    console.log(`     Task ID: ${marginRecalculation.taskId}`)
  }

  // ... existing error logging ...
}
```

---

### 3. `/src/hooks/useBulkCogsAssignmentWithPolling.ts`

**Purpose**: Update polling hook to use `marginRecalculation.weeks` info

**Changes**:
```typescript
// In mutate function onSuccess callback (line ~172), update polling logic

onSuccess: (response) => {
  // Show success toast for bulk COGS assignment
  const { succeeded, failed, marginRecalculation } = response.data
  toast.success('Себестоимость назначена', {
    description: `Успешно: ${succeeded}, Ошибок: ${failed}`,
  })

  // Start polling if any products succeeded AND margin recalculation triggered
  if (succeeded > 0 && marginRecalculation) {
    // Get sample product IDs (first 10 from successful items)
    const successfulItems = response.data.results
      .filter((r) => r.success)
      .slice(0, 10)
      .map((r) => r.nm_id)

    if (successfulItems.length > 0) {
      // NEW: Show polling started notification with weeks info
      const estimatedSeconds = Math.round(
        pollingStrategy.estimatedTime / 1000,
      )

      // NEW: Include affected weeks in toast message
      const weeksText = marginRecalculation.weeks.length > 0
        ? ` (${marginRecalculation.weeks.join(', ')})`
        : ''

      toast.info(`Расчёт маржи для ${succeeded} товаров начат...${weeksText}`, {
        description: `Ожидаемое время: ~${estimatedSeconds}с`,
      })

      // Start polling
      setSampleNmIds(successfulItems)
      setIsPolling(true)
      setPollingAttempts(0)
      setPollingTimeout(false)
      // Add all sample products to polling store
      successfulItems.forEach((nmId) => addPollingProduct(nmId))
    }
  } else if (succeeded > 0 && !marginRecalculation) {
    // NEW: Handle case where margin recalculation was not triggered
    // This happens when no sales data exists for uploaded COGS
    toast.info('Себестоимость назначена', {
      description: 'Маржа будет рассчитана после импорта продаж',
    })
  }

  // ... rest of callback logic ...
}
```

---

### 4. `/src/components/custom/BulkCogsForm.tsx`

**Purpose**: Display margin recalculation status in results dialog

**Changes**:
```typescript
// In Results Dialog (line ~627), add margin recalculation section

{/* Results Dialog */}
<Dialog open={showResults} onOpenChange={setShowResults}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Результаты массового назначения</DialogTitle>
    </DialogHeader>

    {resultData && (
      <div className="space-y-4">
        {/* NEW: Margin Recalculation Status */}
        {resultData.data.marginRecalculation && (
          <Alert variant="default" className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <div className="font-medium mb-1">
                Пересчёт маржи запущен автоматически
              </div>
              <div className="text-sm space-y-1">
                <div>Статус: <span className="font-medium">{getStatusText(resultData.data.marginRecalculation.status)}</span></div>
                {resultData.data.marginRecalculation.weeks.length > 0 && (
                  <div>Недели: {resultData.data.marginRecalculation.weeks.join(', ')}</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* NEW: No Margin Recalculation Warning */}
        {resultData.data.succeeded > 0 && !resultData.data.marginRecalculation && (
          <Alert variant="default" className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
              <div className="font-medium mb-1">Пересчёт маржи не требуется</div>
              <div className="text-sm">
                Для загруженных недель нет данных о продажах. Маржа будет рассчитана автоматически после импорта финансовых отчетов.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Margin Calculation Status */}
        {isPolling && resultData.data.succeeded > 0 && (
          <MarginCalculationStatus
            isPolling={isPolling}
            attempts={pollingAttempts}
            maxAttempts={pollingStrategy.maxAttempts}
            estimatedTime={pollingStrategy.estimatedTime}
            isBulk={true}
            bulkCount={resultData.data.succeeded}
          />
        )}

        {/* ... rest of existing results UI ... */}
      </div>
    )}

    <DialogFooter>
      {/* ... existing footer logic ... */}
    </DialogFooter>
  </DialogContent>
</Dialog>

// Helper function to translate status to Russian
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'В очереди',
    'in_progress': 'Выполняется',
    'completed': 'Завершено'
  }
  return statusMap[status] || status
}
```

---

## Implementation Steps

### Step 1: Update Type Definitions

**File**: `src/types/cogs.ts`

1. Add `MarginRecalculationStatus` interface
2. Update `BulkCogsUploadResponse` to include optional `marginRecalculation` field

**Testing**: TypeScript compilation should pass

---

### Step 2: Update Hook Logic

**File**: `src/hooks/useBulkCogsAssignment.ts`

1. Extract `marginRecalculation` from response data
2. Log margin recalculation status to console

**Testing**:
- Run bulk COGS upload
- Check console logs for margin recalculation info
- Verify TypeScript compilation

---

### Step 3: Update Polling Hook

**File**: `src/hooks/useBulkCogsAssignmentWithPolling.ts`

1. Check for `marginRecalculation` field before starting polling
2. Update toast message to include affected weeks
3. Handle case where margin recalculation is NOT triggered (no sales data)

**Testing**:
- Test bulk upload with sales data (should show weeks info)
- Test bulk upload without sales data (should show "no recalculation" message)

---

### Step 4: Update UI Component

**File**: `src/components/custom/BulkCogsForm.tsx`

1. Add `marginRecalculation` status section in results dialog
2. Add "no recalculation" warning for missing sales data
3. Add status text translation helper

**Testing**:
- Visual verification of results dialog
- Check status display for different scenarios
- Verify accessibility (ARIA labels, keyboard navigation)

---

## Test Cases

### Unit Tests

**File**: `src/hooks/__tests__/useBulkCogsAssignment.test.ts`

```typescript
describe('useBulkCogsAssignment - with margin recalculation', () => {
  it('should extract marginRecalculation from response', async () => {
    const mockResponse = {
      data: {
        succeeded: 10,
        failed: 0,
        results: [],
        message: 'Success',
        marginRecalculation: {
          weeks: ['2026-W03', '2026-W04'],
          status: 'pending',
          taskId: 'task_123'
        }
      }
    }

    const { result } = renderHook(() => useBulkCogsAssignment())
    await act(async () => {
      await result.current.mutate({ items: mockItems })
    })

    expect(result.current.data?.data.marginRecalculation).toEqual({
      weeks: ['2026-W03', '2026-W04'],
      status: 'pending',
      taskId: 'task_123'
    })
  })

  it('should handle response without marginRecalculation', async () => {
    const mockResponse = {
      data: {
        succeeded: 5,
        failed: 0,
        results: [],
        message: 'Success'
        // No marginRecalculation field
      }
    }

    const { result } = renderHook(() => useBulkCogsAssignment())
    await act(async () => {
      await result.current.mutate({ items: mockItems })
    })

    expect(result.current.data?.data.marginRecalculation).toBeUndefined()
  })
})
```

**File**: `src/components/custom/__tests__/BulkCogsForm.test.tsx`

```typescript
describe('BulkCogsForm - margin recalculation UI', () => {
  it('should display margin recalculation status', async () => {
    const mockResult = {
      data: {
        succeeded: 10,
        failed: 0,
        results: [],
        marginRecalculation: {
          weeks: ['2026-W03'],
          status: 'pending',
          taskId: 'task_123'
        }
      }
    }

    render(<BulkCogsForm />)
    // ... fill form and submit ...

    expect(screen.getByText(/Пересчёт маржи запущен автоматически/i)).toBeInTheDocument()
    expect(screen.getByText(/2026-W03/i)).toBeInTheDocument()
  })

  it('should show warning when no margin recalculation', async () => {
    const mockResult = {
      data: {
        succeeded: 5,
        failed: 0,
        results: []
        // No marginRecalculation
      }
    }

    render(<BulkCogsForm />)
    // ... fill form and submit ...

    expect(screen.getByText(/Пересчёт маржи не требуется/i)).toBeInTheDocument()
    expect(screen.getByText(/нет данных о продажах/i)).toBeInTheDocument()
  })
})
```

### Integration Tests

**Manual Testing Checklist**:

- [ ] Bulk upload with sales data → Shows margin recalculation status
- [ ] Bulk upload without sales data → Shows "no recalculation" warning
- [ ] Bulk upload with errors → Shows both errors and margin recalculation
- [ ] Polling starts when margin recalculation is pending
- [ ] Polling does NOT start when no margin recalculation
- [ ] Toast messages display correct week information
- [ ] Results dialog shows all status information
- [ ] Keyboard navigation works in results dialog
- [ ] Screen reader announces status updates

---

## Rollback Plan

### If Backend Changes Cause Issues

**Scenario 1**: New response format breaks existing functionality

**Rollback Steps**:
1. Revert frontend changes to files:
   - `src/types/cogs.ts` (remove `MarginRecalculationStatus`)
   - `src/hooks/useBulkCogsAssignment.ts` (remove `marginRecalculation` extraction)
   - `src/hooks/useBulkCogsAssignmentWithPolling.ts` (remove weeks display logic)
   - `src/components/custom/BulkCogsForm.tsx` (remove status display)

2. Use feature flag to disable new UI:
   ```typescript
   const showMarginRecalculation = false // Set via environment variable
   ```

3. Request backend team to:
   - Revert `bulkUpload()` changes
   - Remove `marginRecalculation` field from response
   - Re-run 45 COGS service tests to verify

**Scenario 2**: Polling logic breaks after changes

**Rollback Steps**:
1. Keep type definitions (backward compatible)
2. Revert polling hook changes only
3. Keep existing polling logic (sample product checking)
4. Request backend team to investigate `marginRecalculation` data

---

## Migration Notes

### Backward Compatibility

The new `marginRecalculation` field is **optional** in the response.

**Old Behavior**: Frontend polls for margin calculation using sample products
**New Behavior**: Frontend uses `marginRecalculation.weeks` info for better UX

**Compatibility**: Frontend code checks for `marginRecalculation` existence:
```typescript
if (marginRecalculation) {
  // Use new weeks info
} else {
  // Fall back to old polling behavior
}
```

### Database State

**Current Data**: Weeks 2025-W47 to 2026-W04 have COGS data filled
- 834 COGS records
- 1,667,748 ₽ total cogs
- 100% coverage

**No Migration Required**: Backend changes are API-only

---

## Related Documentation

- [Backend Questions Analysis](../../request-backend/118-backend-team-questions-detailed-analysis.md) - Root cause analysis
- [Quick Answers Summary](../../request-backend/119-quick-answers-summary.md) - TL;DR of backend changes
- [Margin COGS Integration](../../MARGIN-COGS-BACKEND-INTEGRATION.md) - Margin calculation patterns
- [COGS Temporal Logic](../../COGS-BACKDATING-BUSINESS-LOGIC.md) - Week midpoint strategy
- [API Integration Guide](../../api-integration-guide.md) - Complete endpoint catalog

---

## Questions for Backend Team

1. **Task Status Endpoint**: Is there an endpoint to query `taskId` status? (e.g., `GET /v1/tasks/{taskId}`)
2. **Error Handling**: What happens if margin recalculation fails? Will `marginRecalculation.status` be `"failed"`?
3. **Week Calculation**: How does backend determine which weeks are affected? (based on `valid_from` dates?)
4. **Rate Limiting**: Are there any rate limits on bulk upload + margin recalculation?

---

## Success Criteria

**Integration Complete When**:
- [ ] All 4 frontend files updated
- [ ] TypeScript compilation passes
- [ ] Unit tests pass (new tests added)
- [ ] Manual testing checklist complete
- [ ] UI displays margin recalculation status correctly
- [ ] Polling behavior works as expected
- [ ] Documentation updated (this file)
- [ ] Backend team confirms integration working

---

**Next Steps**: Implement changes in order: Types → Hooks → Components → Tests

**Estimated Time**: 2-3 hours for implementation + 1 hour for testing

**Owner**: Frontend Team

**Reviewers**: Backend Team (for API validation), QA (for testing)

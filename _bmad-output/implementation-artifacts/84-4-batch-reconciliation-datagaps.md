# Story 84.4: Batch Reconciliation + DataGapsAlert

Status: ready-for-dev

## Story

As a seller viewing the dashboard,
I want the system to automatically reconcile failed import batches and only warn me about truly missing data,
so that I don't see false warnings about data gaps that were already resolved by auto-import.

## Acceptance Criteria

1. Dashboard calls `POST /v1/imports/historical/:batchId/reconcile` for each failed batch on load
2. Reconciled batches (`reconciled: true`) are NOT counted as failed
3. `failedBatchCount > 0` shows yellow DataGapsAlert
4. `failedBatchCount = 0` shows no alert
5. Session cache: already-reconciled batches skip API call on re-render
6. Reconcile errors (404/401) count batch as failed (conservative)

## Tasks / Subtasks

- [ ] Task 1: Create reconcile API function (AC: #1)
  - [ ] 1.1: Create `src/lib/api/imports-reconcile.ts` with `reconcileBatch(batchId)`
  - [ ] 1.2: Response type: `{ reconciled: boolean, newStatus: string, weeksWithData: number }`

- [ ] Task 2: Update useProcessingStatus (AC: #1-#6)
  - [ ] 2.1: Replace `const failedBatchCount = 0` with reconcile logic
  - [ ] 2.2: After fetching batches, filter failed ones
  - [ ] 2.3: Call `reconcileBatch()` for each failed batch (parallel via `Promise.allSettled`)
  - [ ] 2.4: Add `reconciledIds` ref for session cache — skip already-reconciled
  - [ ] 2.5: Count remaining failed (non-reconciled) batches as `failedBatchCount`

- [ ] Task 3: Verify DataGapsAlert wiring (AC: #3, #4)
  - [ ] 3.1: Confirm `DashboardContent.tsx` already renders DataGapsAlert when `failedBatchCount > 0`
  - [ ] 3.2: No changes needed if wiring is already in place

- [ ] Task 4: Tests + lint
  - [ ] 4.1: Unit test for `reconcileBatch` API function
  - [ ] 4.2: Lint + type-check

## Dev Notes

### Backend Endpoint

```
POST /v1/imports/historical/:batchId/reconcile
Headers: Authorization: Bearer {token}, X-Cabinet-Id: {cabinetId}
No body required.

Response:
{
  reconciled: boolean,    // true if status changed
  newStatus: string,      // "completed" if all weeks have data
  weeksWithData: number   // count of weeks found in wb_finance_raw
}
```

### Current State (to replace)

```typescript
// useProcessingStatus.ts line 100 — REPLACE THIS:
const failedBatchCount = 0

// WITH reconcile logic that calls API and counts truly-failed batches
```

### Session Cache Pattern

```typescript
// Inside useProcessingStatus hook or aggregateProcessingStatus:
const reconciledIdsRef = useRef(new Set<string>())

// Before calling reconcile:
const failedBatches = batches.filter(b =>
  (b.status === 'failed' || b.status === 'cancelled') &&
  !reconciledIdsRef.current.has(b.id)
)

// After reconcile:
if (result.reconciled) reconciledIdsRef.current.add(batch.id)
```

### DataGapsAlert Already Wired

`DashboardContent.tsx` already has:
```typescript
const failedBatchCount = processingStatus?.failedBatchCount ?? 0
// ...
{!isFailed && failedBatchCount > 0 && <DataGapsAlert failedCount={failedBatchCount} />}
```

No changes needed there — just need `failedBatchCount` to return real value.

### Architecture Constraints

- Files < 200 lines, no `as` casts, no `any`
- `Promise.allSettled` for parallel reconcile (don't fail-fast)
- `useRef` for session cache (survives re-renders, not persisted)
- Reconcile in `queryFn` (not in component) — keeps logic in hook

### Previous Stories Intelligence

- 84.1-84.3: `as` cast violations caught in code review — don't reintroduce
- Party mode decision: use `reconciledIds` ref for session cache
- DataGapsAlert component already exists and is tested

### Files to Create/Modify

| File | Action | Lines |
|------|--------|:---:|
| NEW `src/lib/api/imports-reconcile.ts` | CREATE | ~20 |
| `src/hooks/useProcessingStatus.ts` | MODIFY (replace hardcoded 0) | ~+25 |

### References

- [Source: _bmad-output/planning-artifacts/epics-80-83-fe.md#Story-844]
- [Source: src/app/(dashboard)/dashboard/components/DashboardAlerts.tsx] — DataGapsAlert
- [Source: src/app/(dashboard)/dashboard/components/DashboardContent.tsx:121-143] — wiring

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

### File List

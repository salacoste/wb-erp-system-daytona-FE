# Story 42.1-FE: TypeScript Types Update

**Epic**: [42-FE Task Handlers Adaptation](../../epics/epic-42-fe-task-handlers-adaptation.md)
**Status**: ✅ Complete
**Completed**: 2026-01-29
**Priority**: Required
**Points**: 1
**Estimated Time**: 30 min - 1 hour

---

## User Story

**As a** frontend developer
**I want** TypeScript types to reflect current backend task API
**So that** I have accurate type checking and IDE support for task operations

---

## Background

Backend Epic 42 deprecated `enrich_cogs` task type and introduced `recalculate_weekly_margin` as the replacement.

**Current state of `src/types/api.ts` Task.type union (lines 40-46):**
- `finances_weekly_ingest` ✓
- `products_sync` ✓
- `enrich_cogs` ✓ (needs @deprecated JSDoc)
- `weekly_margin_aggregate` ✓
- `weekly_sanity_check` ✓
- `publish_weekly_views` ✓
- **MISSING**: `recalculate_weekly_margin`

**Type safety gap**: `useManualMarginRecalculation.ts` (line 49) already uses `recalculate_weekly_margin` but the type isn't in the union.

---

## Acceptance Criteria

### AC1: Task Type Union Updated
```gherkin
Given the Task interface in api.ts (lines 38-53)
When I review the type union
Then it should include:
  - 'recalculate_weekly_margin' (ADD - currently missing, used in useManualMarginRecalculation)
  - 'enrich_cogs' (KEEP - mark with @deprecated JSDoc)
  - Other types remain unchanged
```

### AC2: Deprecation JSDoc
```gherkin
Given the Task.type union
When 'enrich_cogs' is used
Then JSDoc should show deprecation warning
And suggest using 'recalculate_weekly_margin' instead
```

### AC3: New Response Types
```gherkin
Given new task types
When tasks complete
Then proper response types should be available:
  - SanityCheckResult
  - WeeklyAggregateResult
  - MarginRecalcResult
```

---

## Technical Implementation

### File: `src/types/api.ts`

**Current** (lines 38-53):
```typescript
export interface Task {
  uuid: string
  type:
    | 'finances_weekly_ingest'
    | 'products_sync'
    | 'enrich_cogs'             // ← needs @deprecated JSDoc
    | 'weekly_margin_aggregate'
    | 'weekly_sanity_check'
    | 'publish_weekly_views'
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'dlq' | 'cancelled'
  // ...
}
```

**Changes Required**:
1. Add `recalculate_weekly_margin` to the union (fixes type gap with useManualMarginRecalculation)
2. Add `@deprecated` JSDoc comment to `enrich_cogs`

**Updated** (replace lines 38-53):
```typescript
/**
 * Task types for processing status
 */
export interface Task {
  uuid: string
  type:
    | 'finances_weekly_ingest'
    | 'products_sync'
    | 'recalculate_weekly_margin'  // Epic 42: recommended for margin recalc
    | 'weekly_margin_aggregate'
    | 'weekly_sanity_check'
    | 'publish_weekly_views'
    /** @deprecated Use 'recalculate_weekly_margin' instead. Backend Epic 42. */
    | 'enrich_cogs'
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'dlq' | 'cancelled'
  progress?: number // 0-100
  result?: unknown
  error?: string
  created_at: string
  updated_at: string
}
```

### New File: `src/types/tasks.ts`

```typescript
/**
 * Task Queue Types
 * Reference: docs/request-backend/94-epic-42-tech-debt-task-handlers.md
 */

/**
 * Task types available for POST /v1/tasks/enqueue
 */
export type TaskType =
  | 'finances_weekly_ingest'
  | 'products_sync'
  | 'recalculate_weekly_margin'
  | 'weekly_margin_aggregate'
  | 'weekly_sanity_check'
  | 'publish_weekly_views'
  /** @deprecated Use 'recalculate_weekly_margin' instead */
  | 'enrich_cogs'

/**
 * Margin recalculation task payload
 */
export interface MarginRecalcPayload {
  weeks: string[]  // ISO weeks, e.g. ["2025-W49"]
  nm_ids?: string[]  // Optional: specific products only
}

/**
 * Margin recalculation task result
 */
export interface MarginRecalcResult {
  status: 'completed'
  successCount: number
  failureCount: number
  weeks: string[]
}

/**
 * Weekly sanity check payload
 */
export interface SanityCheckPayload {
  week?: string  // Optional: specific week, all weeks if empty
}

/**
 * Weekly sanity check result
 * Contains data quality information including products without COGS
 */
export interface SanityCheckResult {
  status: 'completed'
  weeks_validated: number
  checks_passed: number
  checks_failed: number
  warnings: string[]
  /** First 100 nm_ids without COGS assignment */
  missing_cogs_products: string[]
  /** Total count of products without COGS */
  missing_cogs_total: number
  duration_ms: number
}

/**
 * Weekly aggregate payload
 * 4 modes available: single week, multiple weeks, date range, all weeks
 */
export interface WeeklyAggregatePayload {
  week?: string  // Single week mode
  weeks?: string[]  // Multiple weeks mode
  dateFrom?: string  // Date range mode (ISO date)
  dateTo?: string  // Date range mode (ISO date)
  // Empty object = all weeks
}

/**
 * Weekly aggregate result
 */
export interface WeeklyAggregateResult {
  status: 'completed'
  weeks_processed: number
  summaries_created: number
  totals_created: number
  duration_ms: number
}

/**
 * Generic task enqueue request
 */
export interface EnqueueTaskRequest<T = unknown> {
  task_type: TaskType
  payload: T
  priority?: number  // 1=critical, 5=normal, 9=bulk
}

/**
 * Task enqueue response
 */
export interface EnqueueTaskResponse {
  task_uuid: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  enqueued_at: string
  /** @deprecated Indicates task type is deprecated */
  deprecated?: boolean
}
```

---

## Definition of Done

- [ ] `Task.type` union updated in `api.ts` (lines 38-53)
- [ ] `enrich_cogs` has JSDoc deprecation warning
- [ ] `recalculate_weekly_margin` added to union (fixes type gap with `useManualMarginRecalculation.ts`)
- [ ] New `src/types/tasks.ts` file created with all interfaces
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] Existing tests pass
- [ ] Self-review completed

## Implementation Steps

1. **Edit `src/types/api.ts`** (lines 38-53):
   - Add `| 'recalculate_weekly_margin'` after `'products_sync'`
   - Add `/** @deprecated Use 'recalculate_weekly_margin' instead. Backend Epic 42. */` before `| 'enrich_cogs'`

2. **Create `src/types/tasks.ts`**:
   - Copy the template from Technical Implementation section below
   - Contains: TaskType union, payload types, result types, enqueue request/response

3. **Verify**:
   - Run `npm run type-check` - should pass
   - Run `npm run lint` - should pass
   - Check IDE shows deprecation warning on `enrich_cogs`

---

## Testing

### Manual Verification
1. Run `npm run type-check` - no errors
2. Run `npm run lint` - no warnings on new types
3. IDE shows deprecation warning when using `enrich_cogs`

### Automated
- No new tests required (type-only changes)
- Existing tests should pass

---

## Non-goals

- Backend task handler implementation (already complete in Epic 42)
- Runtime behavior changes (type-only changes)
- Breaking changes to existing API contracts
- Migration of existing task data
- E2E testing for task queue

---

## Notes

- **Low risk**: Type-only changes, no runtime impact
- **No breaking changes**: All types are additive or deprecation-only
- Backend backward compatible until `enrich_cogs` fully removed

---

## Related

- [Request #94](../../request-backend/94-epic-42-tech-debt-task-handlers.md)
- [useManualMarginRecalculation.ts](../../../src/hooks/useManualMarginRecalculation.ts) - uses `recalculate_weekly_margin` (line 49), needs type in union

## Files to Modify

| File | Change |
|------|--------|
| `src/types/api.ts` | Update Task.type union (lines 38-53) |
| `src/types/tasks.ts` | **CREATE** - New file with task-specific types |

---

*Created: 2026-01-06*
*Updated: 2026-01-29 - Corrected current state analysis, added implementation steps*

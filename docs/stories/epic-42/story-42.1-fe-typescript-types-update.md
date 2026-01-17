# Story 42.1-FE: TypeScript Types Update

**Epic**: [42-FE Task Handlers Adaptation](../../epics/epic-42-fe-task-handlers-adaptation.md)
**Status**: 📋 Ready for Development
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

Backend Epic 42 deprecated `enrich_cogs` task type and added two new types:
- `weekly_sanity_check` - data quality validation
- `weekly_margin_aggregate` - re-aggregation standalone

Current `Task.type` in `src/types/api.ts` needs update.

---

## Acceptance Criteria

### AC1: Task Type Union Updated
```gherkin
Given the Task interface in api.ts
When I review the type union
Then it should include:
  - 'recalculate_weekly_margin' (ADDED)
  - 'weekly_sanity_check' (already present)
  - 'weekly_margin_aggregate' (already present)
  - 'enrich_cogs' (mark deprecated)
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

**Current** (line ~40-47):
```typescript
export interface Task {
  uuid: string
  type:
    | 'finances_weekly_ingest'
    | 'products_sync'
    | 'enrich_cogs'  // ← deprecated
    | 'weekly_margin_aggregate'
    | 'weekly_sanity_check'
    | 'publish_weekly_views'
  // ...
}
```

**Updated**:
```typescript
export interface Task {
  uuid: string
  type:
    | 'finances_weekly_ingest'
    | 'products_sync'
    | 'recalculate_weekly_margin'  // ← ADD: recommended for margin recalc
    | 'weekly_margin_aggregate'
    | 'weekly_sanity_check'
    | 'publish_weekly_views'
    /** @deprecated Use 'recalculate_weekly_margin' instead */
    | 'enrich_cogs'
  // ...
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

- [ ] `Task.type` union updated in `api.ts`
- [ ] `enrich_cogs` has JSDoc deprecation warning
- [ ] `recalculate_weekly_margin` added to union
- [ ] New `src/types/tasks.ts` file created with all interfaces
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] Existing tests pass
- [ ] Self-review completed

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
- [useManualMarginRecalculation.ts](../../../src/hooks/useManualMarginRecalculation.ts) - already uses correct type

---

*Created: 2026-01-06*

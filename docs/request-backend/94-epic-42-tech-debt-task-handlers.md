# Request #94: Epic 42 - Task Handlers Update

**Date**: 2026-01-06
**Epic**: 42 - Technical Debt Resolution
**Stories**: 42.1, 42.2, 42.3
**Status**: Backend Complete

---

## Summary for Frontend Team

Epic 42 resolves technical debt in task queue handlers. **Key change**: `enrich_cogs` task is **DEPRECATED** - use `recalculate_weekly_margin` instead.

---

## Breaking Changes

### `enrich_cogs` Task - DEPRECATED

**Old approach** (deprecated):
```typescript
// DON'T USE THIS - will still work but is deprecated
POST /v1/tasks/enqueue
{
  "task_type": "enrich_cogs",
  "payload": { "week": "2025-W49" }
}
```

**New approach** (recommended):
```typescript
// USE THIS INSTEAD
POST /v1/tasks/enqueue
{
  "task_type": "recalculate_weekly_margin",
  "payload": { "weeks": ["2025-W49"] }
}
```

**Why deprecated?**
- Original intent (update `wb_finance_raw.unit_cost_rub`) not possible - column doesn't exist
- COGS is stored in separate `cogs` table and joined at query time
- Story 23.3 already auto-triggers margin recalculation after import
- `recalculate_weekly_margin` task already exists and works correctly

**Backwards compatibility**: `enrich_cogs` still works but:
- Returns `deprecated: true` in response
- Logs deprecation warning
- Internally calls margin recalculation

---

## New/Updated Task Types

### 1. `weekly_margin_aggregate` (Story 42.2)

Standalone weekly payout re-aggregation. Use when you need to re-aggregate weekly summaries without full recalculation.

**Endpoint**: `POST /v1/tasks/enqueue`

**4 Modes**:

| Mode | Payload | Use Case |
|------|---------|----------|
| Single week | `{ "week": "2025-W49" }` | Re-aggregate specific week |
| Multiple weeks | `{ "weeks": ["2025-W48", "2025-W49"] }` | Re-aggregate several weeks |
| Date range | `{ "dateFrom": "2025-12-01", "dateTo": "2025-12-31" }` | Re-aggregate all weeks in range |
| All weeks | `{}` | Re-aggregate entire cabinet (use with caution) |

**Request**:
```typescript
const response = await fetch('/v1/tasks/enqueue', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Cabinet-Id': cabinetId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    task_type: 'weekly_margin_aggregate',
    payload: { week: '2025-W49' },
    priority: 5
  })
});
```

**Response** (task status):
```typescript
interface WeeklyAggregateResult {
  status: 'completed';
  weeks_processed: number;
  summaries_created: number;
  totals_created: number;
  duration_ms: number;
}
```

---

### 2. `weekly_sanity_check` (Story 42.3)

Data integrity validation. Use to validate financial data and identify products without COGS.

**Endpoint**: `POST /v1/tasks/enqueue`

**2 Modes**:

| Mode | Payload | Use Case |
|------|---------|----------|
| Specific week | `{ "week": "2025-W49" }` | Validate single week |
| All weeks | `{}` | Validate all weeks with data |

**Request**:
```typescript
const response = await fetch('/v1/tasks/enqueue', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Cabinet-Id': cabinetId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    task_type: 'weekly_sanity_check',
    payload: { week: '2025-W49' },
    priority: 5
  })
});
```

**Response** (task status):
```typescript
interface SanityCheckResult {
  status: 'completed';
  weeks_validated: number;
  checks_passed: number;
  checks_failed: number;
  warnings: string[];  // Human-readable warnings like "[2025-W49] Row balance discrepancy: 1.5%"
  missing_cogs_products: string[];  // First 100 nm_id without COGS
  missing_cogs_total: number;       // Total count of products without COGS
  duration_ms: number;
}
```

**Validation Checks Performed**:
1. **Row Balance** - gross - fees ≈ net_for_pay (±1% tolerance)
2. **Alternative Reconstruction** - WB formula validation (±0.1%)
3. **Storno Control** - storno ≤ 5% of original amounts
4. **Transport Exclusion** - qty=2 rows properly excluded
5. **Missing COGS** - products without COGS assignment

---

### 3. `recalculate_weekly_margin` (RECOMMENDED)

Use this instead of `enrich_cogs` for margin recalculation.

**Endpoint**: `POST /v1/tasks/enqueue`

**Request**:
```typescript
const response = await fetch('/v1/tasks/enqueue', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Cabinet-Id': cabinetId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    task_type: 'recalculate_weekly_margin',
    payload: { weeks: ['2025-W49', '2025-W48'] },
    priority: 5
  })
});
```

**Response** (task status):
```typescript
interface MarginRecalcResult {
  status: 'completed';
  successCount: number;
  failureCount: number;
  weeks: string[];
}
```

---

## Task Status Polling

After enqueueing a task, poll for status:

```typescript
// Enqueue returns task_uuid
const enqueueResponse = await fetch('/v1/tasks/enqueue', { ... });
const { task_uuid } = await enqueueResponse.json();

// Poll for completion
const statusResponse = await fetch(`/v1/tasks/${task_uuid}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Cabinet-Id': cabinetId
  }
});

const taskStatus = await statusResponse.json();
// taskStatus.status: 'pending' | 'in_progress' | 'completed' | 'failed'
// taskStatus.metrics: result data when completed
```

---

## Frontend Action Items

### Required Changes

1. **Replace `enrich_cogs`** calls with `recalculate_weekly_margin`:
   ```typescript
   // Before (deprecated)
   task_type: 'enrich_cogs'
   payload: { week: '2025-W49' }

   // After (recommended)
   task_type: 'recalculate_weekly_margin'
   payload: { weeks: ['2025-W49'] }
   ```

2. **Handle deprecation flag** in responses (optional but recommended):
   ```typescript
   if (result.deprecated) {
     console.warn('Task type is deprecated, consider updating to recommended alternative');
   }
   ```

### Optional Enhancements

1. **Use `weekly_sanity_check`** to show data quality indicators:
   - Display `missing_cogs_products` count as warning
   - Show validation warnings to users

2. **Use `weekly_margin_aggregate`** for manual re-aggregation:
   - Admin panel feature to fix aggregation issues
   - Bulk re-aggregation after data corrections

---

## API Reference

| Task Type | Status | Payload | Use Case |
|-----------|--------|---------|----------|
| `recalculate_weekly_margin` | ✅ Active | `{ weeks: string[] }` | Margin recalculation |
| `weekly_margin_aggregate` | ✅ New | `{ week?, weeks?, dateFrom?, dateTo? }` | Re-aggregate summaries |
| `weekly_sanity_check` | ✅ New | `{ week? }` | Data validation |
| `enrich_cogs` | ⚠️ **DEPRECATED** | `{ week?, weeks? }` | Use `recalculate_weekly_margin` |

---

## Related Documentation

- [TASKS-API-EXPLANATION.md](../../../docs/TASKS-API-EXPLANATION.md)
- [API-PATHS-REFERENCE.md](../../../docs/API-PATHS-REFERENCE.md)
- [Story 42.1](../../../docs/stories/epic-42/story-42.1-enrich-cogs-handler.md)
- [Story 42.2](../../../docs/stories/epic-42/story-42.2-weekly-aggregate-handler.md)
- [Story 42.3](../../../docs/stories/epic-42/story-42.3-sanity-check-handler.md)
- [test-api/09-tasks.http](../../../test-api/09-tasks.http) - Interactive API examples

---

## Questions?

Contact backend team if you need:
- Clarification on task types
- Additional response fields
- New task functionality

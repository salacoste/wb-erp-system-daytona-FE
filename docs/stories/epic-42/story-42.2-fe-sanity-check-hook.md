# Story 42.2-FE: Add Sanity Check Hook

**Epic**: [42-FE Task Handlers Adaptation](../../epics/epic-42-fe-task-handlers-adaptation.md)
**Status**: ✅ Complete
**Completed**: 2026-01-29
**Priority**: Optional
**Points**: 2
**Estimated Time**: 2-3 hours

---

## User Story

**As a** seller using WB Repricer
**I want** to see data quality indicators
**So that** I know when my financial data has issues or products are missing COGS

---

## Background

Backend Story 42.3 added `weekly_sanity_check` task that validates:
1. Row balance (gross - fees ≈ net_for_pay)
2. Alternative formula reconstruction
3. Storno control (≤5%)
4. Missing COGS products

This hook enables frontend to trigger validation and display results.

---

## Acceptance Criteria

### AC1: Hook Available
```gherkin
Given the useSanityCheck hook is implemented
When I import it in a component
Then I can trigger sanity check for a specific week or all weeks
And receive validation results
```

### AC2: Polling Support
```gherkin
Given a sanity check task is enqueued
When the task is processing
Then the hook should poll for completion
And return final results when done
```

### AC3: Error Handling
```gherkin
Given a sanity check request
When the request fails
Then appropriate error is thrown
And toast notification shown
```

---

## Technical Implementation

### Types to Add: `src/types/tasks.ts` (NEW FILE)

```typescript
/**
 * Task-related types for Epic 42 task handlers
 * Story 42.2-FE: Sanity Check Hook
 */

/**
 * Payload for weekly sanity check task
 * 2 Modes:
 * - Specific week: { week: "2025-W49" }
 * - All weeks: {} (empty object)
 */
export interface SanityCheckPayload {
  /** Optional: specific week to validate (ISO format, e.g., "2025-W49") */
  week?: string
}

/**
 * Response from POST /v1/tasks/enqueue
 */
export interface EnqueueTaskResponse {
  task_uuid: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  enqueued_at: string
  /** Present when task type is deprecated (e.g., enrich_cogs) */
  deprecated?: boolean
}

/**
 * Result from weekly_sanity_check task
 * Returned in task status response as `metrics` when status='completed'
 *
 * Reference: docs/request-backend/94-epic-42-tech-debt-task-handlers.md
 */
export interface SanityCheckResult {
  /** Task completion status */
  status: 'completed'
  /** Number of weeks validated */
  weeks_validated: number
  /** Number of checks that passed */
  checks_passed: number
  /** Number of checks that failed */
  checks_failed: number
  /** Human-readable warnings (e.g., "[2025-W49] Row balance discrepancy: 1.5%") */
  warnings: string[]
  /** First 100 nm_ids without COGS assignment */
  missing_cogs_products: string[]
  /** Total count of products without COGS */
  missing_cogs_total: number
  /** Task execution time in milliseconds */
  duration_ms: number
}

/**
 * Task status response from GET /v1/tasks/{task_uuid}
 */
export interface TaskStatusResponse {
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  /** Result metrics when status='completed' */
  metrics?: SanityCheckResult
  /** Error message when status='failed' */
  error?: string
}
```

### New File: `src/hooks/useSanityCheck.ts`

```typescript
/**
 * Hook for triggering weekly sanity check (data quality validation)
 * Story 42.2-FE: Add Sanity Check Hook
 *
 * Returns data quality metrics including:
 * - Validation checks passed/failed
 * - Warnings about data issues
 * - Products without COGS assignment
 *
 * Reference: docs/request-backend/94-epic-42-tech-debt-task-handlers.md
 */

import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import type {
  SanityCheckPayload,
  SanityCheckResult,
  EnqueueTaskResponse,
  TaskStatusResponse,
} from '@/types/tasks'

interface UseSanityCheckOptions {
  /** Auto-poll for result after enqueue */
  enablePolling?: boolean
  /** Polling interval in ms (default: 2000) */
  pollInterval?: number
  /** Max polling attempts (default: 30) */
  maxAttempts?: number
}

/**
 * Hook to trigger and monitor weekly sanity check
 *
 * @example
 * const {
 *   runCheck,
 *   result,
 *   isPending,
 *   isPolling
 * } = useSanityCheck();
 *
 * // Run for specific week
 * runCheck({ week: '2025-W49' });
 *
 * // Run for all weeks
 * runCheck({});
 *
 * // Access results when complete
 * if (result) {
 *   console.log(`Checks passed: ${result.checks_passed}`);
 *   console.log(`Missing COGS: ${result.missing_cogs_total}`);
 * }
 */
export function useSanityCheck(options: UseSanityCheckOptions = {}) {
  const { enablePolling = true, pollInterval = 2000, maxAttempts = 30 } = options
  const { cabinetId } = useAuthStore()

  // Track task UUID for polling
  const [taskUuid, setTaskUuid] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)

  // Enqueue sanity check task
  const enqueueMutation = useMutation({
    mutationFn: async (payload: SanityCheckPayload): Promise<EnqueueTaskResponse> => {
      if (!cabinetId) {
        throw new Error('Cabinet ID is required')
      }

      const response = await apiClient.post<EnqueueTaskResponse>(
        '/v1/tasks/enqueue',
        {
          task_type: 'weekly_sanity_check',
          payload: {
            cabinet_id: cabinetId,
            ...payload,
          },
          priority: 5,
        }
      )

      return response
    },
    onSuccess: (data) => {
      setTaskUuid(data.task_uuid)
      setAttempts(0)
      toast.info('Проверка качества данных запущена', {
        description: 'Ожидайте результатов...',
      })
    },
    onError: (error: Error) => {
      toast.error('Ошибка запуска проверки', {
        description: error.message,
      })
    },
  })

  // Poll for task status
  const statusQuery = useQuery({
    queryKey: ['sanity-check-status', taskUuid],
    queryFn: async (): Promise<SanityCheckResult | null> => {
      if (!taskUuid || !cabinetId) return null

      const response = await apiClient.get<TaskStatusResponse>(
        `/v1/tasks/${taskUuid}`
      )

      if (response.status === 'completed' && response.metrics) {
        return response.metrics
      }

      if (response.status === 'failed') {
        throw new Error(response.error || 'Sanity check failed')
      }

      // Still processing
      return null
    },
    enabled: enablePolling && !!taskUuid && attempts < maxAttempts,
    refetchInterval: (query) => {
      const data = query.state.data
      // Stop polling when complete or max attempts reached
      if (data || attempts >= maxAttempts) return false
      setAttempts((a) => a + 1)
      return pollInterval
    },
  })

  // Show result toast when complete
  useEffect(() => {
    if (statusQuery.data) {
      const result = statusQuery.data
      if (result.checks_failed > 0) {
        toast.warning('Обнаружены проблемы с данными', {
          description: `${result.checks_failed} проверок не пройдено`,
        })
      } else {
        toast.success('Все проверки пройдены', {
          description: `${result.checks_passed} проверок выполнено`,
        })
      }
      setTaskUuid(null) // Stop polling
    }
  }, [statusQuery.data])

  return {
    /** Trigger sanity check (fire-and-forget) */
    runCheck: enqueueMutation.mutate,
    /** Trigger sanity check (returns Promise) */
    runCheckAsync: enqueueMutation.mutateAsync,
    /** True while enqueueing task */
    isEnqueuing: enqueueMutation.isPending,
    /** True while polling for result */
    isPolling: statusQuery.isFetching && !!taskUuid,
    /** True while either enqueueing or polling */
    isPending: enqueueMutation.isPending || (statusQuery.isFetching && !!taskUuid),
    /** Sanity check result when complete */
    result: statusQuery.data,
    /** Error from enqueue or polling */
    error: enqueueMutation.error || statusQuery.error,
    /** Current task UUID being tracked */
    taskUuid,
  }
}

export type { SanityCheckResult, SanityCheckPayload }
```

---

## Definition of Done

- [ ] `src/types/tasks.ts` created with all task-related types
- [ ] `useSanityCheck` hook implemented in `src/hooks/useSanityCheck.ts`
- [ ] Hook exports proper types (`SanityCheckResult`, `SanityCheckPayload`)
- [ ] Polling works correctly (2s interval, 30 max attempts)
- [ ] Toast notifications for all states (info, success, warning, error)
- [ ] TypeScript compiles without errors
- [ ] Unit tests written (≥80% coverage)
- [ ] JSDoc documentation complete

---

## Testing

### Unit Tests: `src/hooks/__tests__/useSanityCheck.test.ts`

```typescript
describe('useSanityCheck', () => {
  it('should enqueue sanity check task')
  it('should poll for task completion')
  it('should return result on completion')
  it('should handle errors gracefully')
  it('should stop polling after max attempts')
  it('should show toast on completion')
})
```

### Manual Testing
1. Trigger sanity check via dev tools
2. Verify polling behavior
3. Check toast notifications

---

## UI Integration (Future)

This hook can be used in:
- Dashboard data quality indicator
- Settings page "Run Data Check" button
- COGS management page for missing COGS alert

---

## Non-goals

- Backend sanity check implementation (already complete in Epic 42.3)
- UI components for displaying results (Story 42.3-FE)
- Automatic polling on dashboard mount (implement when needed)
- Rate limiting enforcement (backend responsibility)
- Data quality scoring algorithms (backend responsibility)

---

## Notes

- **Optional story** - implement when data quality features needed
- Backend must have `weekly_sanity_check` handler (Epic 42.3) ✅
- Consider rate limiting (1 check per 5 minutes)
- **Types location**: Create new `src/types/tasks.ts` file (doesn't exist yet)
- **Polling pattern**: Similar to `useProcessingStatus.ts` but with mutation trigger

---

## API Reference

### Validation Checks Performed by Backend
1. **Row Balance** - gross - fees ≈ net_for_pay (±1% tolerance)
2. **Alternative Reconstruction** - WB formula validation (±0.1%)
3. **Storno Control** - storno ≤ 5% of original amounts
4. **Transport Exclusion** - qty=2 rows properly excluded
5. **Missing COGS** - products without COGS assignment

### Response Example
```json
{
  "status": "completed",
  "weeks_validated": 12,
  "checks_passed": 47,
  "checks_failed": 3,
  "warnings": [
    "[2025-W49] Row balance discrepancy: 1.5%",
    "[2025-W48] Missing COGS for 15 products"
  ],
  "missing_cogs_products": ["12345678", "87654321"],
  "missing_cogs_total": 15,
  "duration_ms": 2345
}
```

---

## Related

- [Story 42.3-FE](./story-42.3-fe-missing-cogs-alert.md) - UI component for missing COGS
- [Request #94](../../request-backend/94-epic-42-tech-debt-task-handlers.md) - Backend API contract

---

*Created: 2026-01-06*
*Validated: 2026-01-29* (API contract verified against Request #94)

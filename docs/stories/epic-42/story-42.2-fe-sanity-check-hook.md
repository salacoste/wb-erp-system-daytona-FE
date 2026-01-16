# Story 42.2-FE: Add Sanity Check Hook

**Epic**: [42-FE Task Handlers Adaptation](../../epics/epic-42-fe-task-handlers-adaptation.md)
**Status**: 📋 Backlog (Optional)
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
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import type {
  SanityCheckPayload,
  SanityCheckResult,
  EnqueueTaskResponse
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
 *   mutate: runCheck,
 *   data: result,
 *   isPending
 * } = useSanityCheck();
 *
 * // Run for specific week
 * runCheck({ week: '2025-W49' });
 *
 * // Run for all weeks
 * runCheck({});
 */
export function useSanityCheck(options: UseSanityCheckOptions = {}) {
  const { enablePolling = true, pollInterval = 2000, maxAttempts = 30 } = options
  const queryClient = useQueryClient()
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

      const response = await apiClient.get<{
        status: string
        metrics?: SanityCheckResult
      }>(`/v1/tasks/${taskUuid}`)

      if (response.status === 'completed' && response.metrics) {
        return response.metrics as SanityCheckResult
      }

      if (response.status === 'failed') {
        throw new Error('Sanity check failed')
      }

      // Still processing
      return null
    },
    enabled: enablePolling && !!taskUuid && attempts < maxAttempts,
    refetchInterval: (data) => {
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
    runCheck: enqueueMutation.mutate,
    runCheckAsync: enqueueMutation.mutateAsync,
    isEnqueuing: enqueueMutation.isPending,
    isPolling: statusQuery.isFetching && !!taskUuid,
    isPending: enqueueMutation.isPending || (statusQuery.isFetching && !!taskUuid),
    result: statusQuery.data,
    error: enqueueMutation.error || statusQuery.error,
    taskUuid,
  }
}

export type { SanityCheckResult, SanityCheckPayload }
```

---

## Definition of Done

- [ ] `useSanityCheck` hook implemented
- [ ] Hook exports proper types
- [ ] Polling works correctly
- [ ] Toast notifications for states
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

## Notes

- **Optional story** - implement when data quality features needed
- Backend must have `weekly_sanity_check` handler (Epic 42.3) ✅
- Consider rate limiting (1 check per 5 minutes)

---

## Related

- [Story 42.3-FE](./story-42.3-fe-missing-cogs-alert.md) - UI component for missing COGS
- [Request #94](../../request-backend/94-epic-42-tech-debt-task-handlers.md)

---

*Created: 2026-01-06*

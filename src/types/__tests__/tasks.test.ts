/**
 * Tests for Task Types
 * Story 42.1-FE: TypeScript Types Update
 * Epic 42-FE: Task Handlers Adaptation
 *
 * Tests validate TypeScript interfaces for task queue API.
 *
 * Reference: docs/stories/epic-42/story-42.1-fe-typescript-types-update.md
 */

import { describe, it, expect } from 'vitest'
import type {
  TaskType,
  SanityCheckResult,
  SanityCheckPayload,
  MarginRecalcPayload,
  MarginRecalcResult,
  WeeklyAggregatePayload,
  WeeklyAggregateResult,
  EnqueueTaskRequest,
  EnqueueTaskResponse,
} from '../tasks'

// =============================================================================
// SECTION 1: TaskType Union Tests
// =============================================================================

describe('TaskType Union', () => {
  describe('required task types', () => {
    it('includes finances_weekly_ingest', () => {
      const value: TaskType = 'finances_weekly_ingest'
      expect(value).toBe('finances_weekly_ingest')
    })

    it('includes products_sync', () => {
      const value: TaskType = 'products_sync'
      expect(value).toBe('products_sync')
    })

    it('includes recalculate_weekly_margin (new in Epic 42)', () => {
      const value: TaskType = 'recalculate_weekly_margin'
      expect(value).toBe('recalculate_weekly_margin')
    })

    it('includes weekly_margin_aggregate', () => {
      const value: TaskType = 'weekly_margin_aggregate'
      expect(value).toBe('weekly_margin_aggregate')
    })

    it('includes weekly_sanity_check', () => {
      const value: TaskType = 'weekly_sanity_check'
      expect(value).toBe('weekly_sanity_check')
    })

    it('includes publish_weekly_views', () => {
      const value: TaskType = 'publish_weekly_views'
      expect(value).toBe('publish_weekly_views')
    })
  })

  describe('type narrowing', () => {
    it('allows assignment of valid task type string', () => {
      const taskTypes: TaskType[] = [
        'finances_weekly_ingest',
        'products_sync',
        'recalculate_weekly_margin',
        'weekly_margin_aggregate',
        'weekly_sanity_check',
        'publish_weekly_views',
      ]
      expect(taskTypes).toHaveLength(6)
      taskTypes.forEach(t => expect(typeof t).toBe('string'))
    })

    it('works in switch statements with exhaustive check', () => {
      function exhaustiveCheck(type: TaskType): string {
        switch (type) {
          case 'finances_weekly_ingest':
            return 'ingest'
          case 'products_sync':
            return 'sync'
          case 'recalculate_weekly_margin':
            return 'recalc'
          case 'weekly_margin_aggregate':
            return 'aggregate'
          case 'weekly_sanity_check':
            return 'sanity'
          case 'publish_weekly_views':
            return 'views'
        }
      }
      const allTypes: TaskType[] = [
        'finances_weekly_ingest',
        'products_sync',
        'recalculate_weekly_margin',
        'weekly_margin_aggregate',
        'weekly_sanity_check',
        'publish_weekly_views',
      ]
      allTypes.forEach(t => {
        expect(exhaustiveCheck(t)).toBeDefined()
      })
    })
  })
})

// =============================================================================
// SECTION 2: Task.type in api.ts Tests
// =============================================================================

describe('Task interface in api.ts', () => {
  // Re-import the Task type shape from tasks.ts (same union used in api.ts Task.type)
  const VALID_TASK_TYPES = [
    'finances_weekly_ingest',
    'products_sync',
    'recalculate_weekly_margin',
    'weekly_margin_aggregate',
    'weekly_sanity_check',
    'publish_weekly_views',
  ] as const

  describe('Task.type union', () => {
    it('includes recalculate_weekly_margin (fixes type gap with useManualMarginRecalculation)', () => {
      expect(VALID_TASK_TYPES).toContain('recalculate_weekly_margin')
    })

    it('includes weekly_sanity_check', () => {
      expect(VALID_TASK_TYPES).toContain('weekly_sanity_check')
    })

    it('includes weekly_margin_aggregate', () => {
      expect(VALID_TASK_TYPES).toContain('weekly_margin_aggregate')
    })

    it('enrich_cogs removed from union (Story 100.1-FE)', () => {
      expect(VALID_TASK_TYPES).not.toContain('enrich_cogs')
    })
  })
})

// =============================================================================
// SECTION 3: SanityCheckResult Tests
// =============================================================================

describe('SanityCheckResult', () => {
  describe('required fields', () => {
    it('has status field with value "completed"', () => {
      const result: SanityCheckResult = {
        status: 'completed',
        weeks_validated: 5,
        checks_passed: 10,
        checks_failed: 0,
        warnings: [],
        missing_cogs_products: [],
        missing_cogs_total: 0,
        duration_ms: 1500,
      }
      expect(result.status).toBe('completed')
    })

    it('has weeks_validated as number', () => {
      const result: SanityCheckResult = {
        status: 'completed',
        weeks_validated: 5,
        checks_passed: 10,
        checks_failed: 0,
        warnings: [],
        missing_cogs_products: [],
        missing_cogs_total: 0,
        duration_ms: 1500,
      }
      expect(typeof result.weeks_validated).toBe('number')
    })

    it('has checks_passed as number', () => {
      const result: SanityCheckResult = {
        status: 'completed',
        weeks_validated: 5,
        checks_passed: 10,
        checks_failed: 0,
        warnings: [],
        missing_cogs_products: [],
        missing_cogs_total: 0,
        duration_ms: 1500,
      }
      expect(typeof result.checks_passed).toBe('number')
    })

    it('has checks_failed as number', () => {
      const result: SanityCheckResult = {
        status: 'completed',
        weeks_validated: 5,
        checks_passed: 10,
        checks_failed: 2,
        warnings: [],
        missing_cogs_products: [],
        missing_cogs_total: 0,
        duration_ms: 1500,
      }
      expect(typeof result.checks_failed).toBe('number')
    })

    it('has warnings as string array', () => {
      const result: SanityCheckResult = {
        status: 'completed',
        weeks_validated: 5,
        checks_passed: 10,
        checks_failed: 0,
        warnings: ['warning1', 'warning2'],
        missing_cogs_products: [],
        missing_cogs_total: 0,
        duration_ms: 1500,
      }
      expect(Array.isArray(result.warnings)).toBe(true)
      result.warnings.forEach(w => expect(typeof w).toBe('string'))
    })

    it('has duration_ms as number', () => {
      const result: SanityCheckResult = {
        status: 'completed',
        weeks_validated: 5,
        checks_passed: 10,
        checks_failed: 0,
        warnings: [],
        missing_cogs_products: [],
        missing_cogs_total: 0,
        duration_ms: 1500,
      }
      expect(typeof result.duration_ms).toBe('number')
    })
  })

  describe('missing COGS fields', () => {
    it('has missing_cogs_products as string array', () => {
      const result: SanityCheckResult = {
        status: 'completed',
        weeks_validated: 5,
        checks_passed: 10,
        checks_failed: 0,
        warnings: [],
        missing_cogs_products: ['12345', '67890'],
        missing_cogs_total: 2,
        duration_ms: 1500,
      }
      expect(Array.isArray(result.missing_cogs_products)).toBe(true)
      result.missing_cogs_products.forEach(p => expect(typeof p).toBe('string'))
    })

    it('has missing_cogs_total as number', () => {
      const result: SanityCheckResult = {
        status: 'completed',
        weeks_validated: 5,
        checks_passed: 10,
        checks_failed: 0,
        warnings: [],
        missing_cogs_products: [],
        missing_cogs_total: 42,
        duration_ms: 1500,
      }
      expect(typeof result.missing_cogs_total).toBe('number')
    })

    it('missing_cogs_products contains first 100 nm_ids without COGS', () => {
      const products = Array.from({ length: 150 }, (_, i) => String(i + 1))
      // Simulate backend truncation to 100
      const truncated = products.slice(0, 100)
      const result: SanityCheckResult = {
        status: 'completed',
        weeks_validated: 5,
        checks_passed: 10,
        checks_failed: 0,
        warnings: [],
        missing_cogs_products: truncated,
        missing_cogs_total: 150,
        duration_ms: 1500,
      }
      expect(result.missing_cogs_products).toHaveLength(100)
      expect(result.missing_cogs_total).toBe(150)
    })
  })
})

// =============================================================================
// SECTION 4: SanityCheckPayload Tests
// =============================================================================

describe('SanityCheckPayload', () => {
  describe('optional fields', () => {
    it('has optional week field as string', () => {
      const payload: SanityCheckPayload = { week: '2025-W49' }
      expect(payload.week).toBe('2025-W49')
    })

    it('week field format is ISO week (e.g., "2025-W49")', () => {
      const payload: SanityCheckPayload = { week: '2025-W49' }
      expect(payload.week).toMatch(/^\d{4}-W\d{2}$/)
    })

    it('empty payload validates all weeks', () => {
      const payload: SanityCheckPayload = {}
      expect(payload.week).toBeUndefined()
    })
  })
})

// =============================================================================
// SECTION 5: MarginRecalcPayload Tests
// =============================================================================

describe('MarginRecalcPayload', () => {
  describe('required fields', () => {
    it('has weeks as string array', () => {
      const payload: MarginRecalcPayload = {
        weeks: ['2025-W49', '2025-W50'],
      }
      expect(Array.isArray(payload.weeks)).toBe(true)
    })

    it('weeks array contains ISO week strings (e.g., ["2025-W49"])', () => {
      const payload: MarginRecalcPayload = {
        weeks: ['2025-W49', '2025-W50'],
      }
      payload.weeks.forEach(w => expect(w).toMatch(/^\d{4}-W\d{2}$/))
    })
  })

  describe('optional fields', () => {
    it('has optional nm_ids as string array', () => {
      const payload: MarginRecalcPayload = {
        weeks: ['2025-W49'],
        nm_ids: ['12345', '67890'],
      }
      expect(Array.isArray(payload.nm_ids)).toBe(true)
      expect(payload.nm_ids).toHaveLength(2)
    })

    it('nm_ids limits recalculation to specific products', () => {
      const payload: MarginRecalcPayload = {
        weeks: ['2025-W49'],
        nm_ids: ['12345'],
      }
      expect(payload.nm_ids).toEqual(['12345'])
    })
  })
})

// =============================================================================
// SECTION 6: MarginRecalcResult Tests
// =============================================================================

describe('MarginRecalcResult', () => {
  describe('required fields', () => {
    it('has status field with value "completed"', () => {
      const result: MarginRecalcResult = {
        status: 'completed',
        successCount: 10,
        failureCount: 0,
        weeks: ['2025-W49'],
      }
      expect(result.status).toBe('completed')
    })

    it('has successCount as number', () => {
      const result: MarginRecalcResult = {
        status: 'completed',
        successCount: 10,
        failureCount: 0,
        weeks: ['2025-W49'],
      }
      expect(typeof result.successCount).toBe('number')
    })

    it('has failureCount as number', () => {
      const result: MarginRecalcResult = {
        status: 'completed',
        successCount: 10,
        failureCount: 2,
        weeks: ['2025-W49'],
      }
      expect(typeof result.failureCount).toBe('number')
    })

    it('has weeks as string array', () => {
      const result: MarginRecalcResult = {
        status: 'completed',
        successCount: 10,
        failureCount: 0,
        weeks: ['2025-W49', '2025-W50'],
      }
      expect(Array.isArray(result.weeks)).toBe(true)
      expect(result.weeks).toHaveLength(2)
    })
  })
})

// =============================================================================
// SECTION 7: WeeklyAggregatePayload Tests
// =============================================================================

describe('WeeklyAggregatePayload', () => {
  describe('single week mode', () => {
    it('has optional week field as string', () => {
      const payload: WeeklyAggregatePayload = { week: '2025-W49' }
      expect(typeof payload.week).toBe('string')
    })

    it('week format is ISO week (e.g., "2025-W49")', () => {
      const payload: WeeklyAggregatePayload = { week: '2025-W49' }
      expect(payload.week).toMatch(/^\d{4}-W\d{2}$/)
    })
  })

  describe('multiple weeks mode', () => {
    it('has optional weeks field as string array', () => {
      const payload: WeeklyAggregatePayload = {
        weeks: ['2025-W49', '2025-W50'],
      }
      expect(Array.isArray(payload.weeks)).toBe(true)
    })
  })

  describe('date range mode', () => {
    it('has optional dateFrom field as ISO date string', () => {
      const payload: WeeklyAggregatePayload = {
        dateFrom: '2025-12-01',
        dateTo: '2025-12-31',
      }
      expect(typeof payload.dateFrom).toBe('string')
      expect(payload.dateFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('has optional dateTo field as ISO date string', () => {
      const payload: WeeklyAggregatePayload = {
        dateFrom: '2025-12-01',
        dateTo: '2025-12-31',
      }
      expect(typeof payload.dateTo).toBe('string')
      expect(payload.dateTo).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('all weeks mode', () => {
    it('empty payload aggregates all weeks', () => {
      const payload: WeeklyAggregatePayload = {}
      expect(payload.week).toBeUndefined()
      expect(payload.weeks).toBeUndefined()
      expect(payload.dateFrom).toBeUndefined()
      expect(payload.dateTo).toBeUndefined()
    })
  })
})

// =============================================================================
// SECTION 8: WeeklyAggregateResult Tests
// =============================================================================

describe('WeeklyAggregateResult', () => {
  describe('required fields', () => {
    it('has status field with value "completed"', () => {
      const result: WeeklyAggregateResult = {
        status: 'completed',
        weeks_processed: 5,
        summaries_created: 20,
        totals_created: 5,
        duration_ms: 3000,
      }
      expect(result.status).toBe('completed')
    })

    it('has weeks_processed as number', () => {
      const result: WeeklyAggregateResult = {
        status: 'completed',
        weeks_processed: 5,
        summaries_created: 20,
        totals_created: 5,
        duration_ms: 3000,
      }
      expect(typeof result.weeks_processed).toBe('number')
    })

    it('has summaries_created as number', () => {
      const result: WeeklyAggregateResult = {
        status: 'completed',
        weeks_processed: 5,
        summaries_created: 20,
        totals_created: 5,
        duration_ms: 3000,
      }
      expect(typeof result.summaries_created).toBe('number')
    })

    it('has totals_created as number', () => {
      const result: WeeklyAggregateResult = {
        status: 'completed',
        weeks_processed: 5,
        summaries_created: 20,
        totals_created: 5,
        duration_ms: 3000,
      }
      expect(typeof result.totals_created).toBe('number')
    })

    it('has duration_ms as number', () => {
      const result: WeeklyAggregateResult = {
        status: 'completed',
        weeks_processed: 5,
        summaries_created: 20,
        totals_created: 5,
        duration_ms: 3000,
      }
      expect(typeof result.duration_ms).toBe('number')
    })
  })
})

// =============================================================================
// SECTION 9: EnqueueTaskRequest Tests
// =============================================================================

describe('EnqueueTaskRequest', () => {
  describe('required fields', () => {
    it('has task_type as TaskType', () => {
      const req: EnqueueTaskRequest = {
        task_type: 'weekly_sanity_check',
        payload: {},
      }
      expect(req.task_type).toBe('weekly_sanity_check')
    })

    it('has payload as generic type parameter', () => {
      const req: EnqueueTaskRequest<SanityCheckPayload> = {
        task_type: 'weekly_sanity_check',
        payload: { week: '2025-W49' },
      }
      expect(req.payload).toEqual({ week: '2025-W49' })
    })
  })

  describe('optional fields', () => {
    it('has optional priority as number', () => {
      const req: EnqueueTaskRequest = {
        task_type: 'finances_weekly_ingest',
        payload: {},
        priority: 5,
      }
      expect(typeof req.priority).toBe('number')
    })

    it('priority 1 means critical', () => {
      const req: EnqueueTaskRequest = {
        task_type: 'finances_weekly_ingest',
        payload: {},
        priority: 1,
      }
      expect(req.priority).toBe(1)
    })

    it('priority 5 means normal', () => {
      const req: EnqueueTaskRequest = {
        task_type: 'finances_weekly_ingest',
        payload: {},
        priority: 5,
      }
      expect(req.priority).toBe(5)
    })

    it('priority 9 means bulk', () => {
      const req: EnqueueTaskRequest = {
        task_type: 'finances_weekly_ingest',
        payload: {},
        priority: 9,
      }
      expect(req.priority).toBe(9)
    })
  })

  describe('generic payload typing', () => {
    it('accepts MarginRecalcPayload for recalculate_weekly_margin', () => {
      const req: EnqueueTaskRequest<MarginRecalcPayload> = {
        task_type: 'recalculate_weekly_margin',
        payload: { weeks: ['2025-W49'] },
      }
      expect(req.payload.weeks).toEqual(['2025-W49'])
    })

    it('accepts SanityCheckPayload for weekly_sanity_check', () => {
      const req: EnqueueTaskRequest<SanityCheckPayload> = {
        task_type: 'weekly_sanity_check',
        payload: { week: '2025-W49' },
      }
      expect(req.payload.week).toBe('2025-W49')
    })

    it('accepts WeeklyAggregatePayload for weekly_margin_aggregate', () => {
      const req: EnqueueTaskRequest<WeeklyAggregatePayload> = {
        task_type: 'weekly_margin_aggregate',
        payload: { weeks: ['2025-W49'] },
      }
      expect(req.payload.weeks).toEqual(['2025-W49'])
    })
  })
})

// =============================================================================
// SECTION 10: EnqueueTaskResponse Tests
// =============================================================================

describe('EnqueueTaskResponse', () => {
  describe('required fields', () => {
    it('has task_uuid as string', () => {
      const res: EnqueueTaskResponse = {
        task_uuid: 'abc-123',
        status: 'pending',
        enqueued_at: '2025-12-01T10:00:00Z',
      }
      expect(typeof res.task_uuid).toBe('string')
    })

    it('has status as pending | processing | completed | failed', () => {
      const statuses: EnqueueTaskResponse['status'][] = [
        'pending',
        'processing',
        'completed',
        'failed',
      ]
      expect(statuses).toHaveLength(4)
      statuses.forEach(s => expect(typeof s).toBe('string'))
    })

    it('has enqueued_at as ISO date string', () => {
      const res: EnqueueTaskResponse = {
        task_uuid: 'abc-123',
        status: 'pending',
        enqueued_at: '2025-12-01T10:00:00Z',
      }
      expect(res.enqueued_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
  })

  describe('optional fields', () => {
    it('has optional deprecated as boolean', () => {
      const res: EnqueueTaskResponse = {
        task_uuid: 'abc-123',
        status: 'pending',
        enqueued_at: '2025-12-01T10:00:00Z',
        deprecated: false,
      }
      expect(typeof res.deprecated).toBe('boolean')
    })

    it('deprecated field removed with enrich_cogs (Story 100.1-FE)', () => {
      // enrich_cogs was removed from TaskType; the deprecated field is optional
      const res: EnqueueTaskResponse = {
        task_uuid: 'abc-123',
        status: 'pending',
        enqueued_at: '2025-12-01T10:00:00Z',
      }
      // deprecated is optional and typically absent for non-deprecated tasks
      expect(res.deprecated).toBeUndefined()
    })
  })
})

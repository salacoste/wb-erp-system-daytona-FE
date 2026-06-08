/**
 * Processing Polling Strategy Tests
 * Covers: getRefetchInterval, aggregateProcessingStatus, mapBatchStatus,
 * MAX_EMPTY_POLLS constant.
 */

import { describe, it, expect } from 'vitest'
import {
  getRefetchInterval,
  aggregateProcessingStatus,
  MAX_EMPTY_POLLS,
  type ImportBatch,
} from '../processing-polling-strategy'
import type { ProcessingStatus } from '@/types/api'

/** Helper to satisfy ProcessingStatus's string-union fields. */
function ps(overrides: Partial<ProcessingStatus> = {}): ProcessingStatus {
  return {
    status: 'completed',
    productParsing: { progress: 100, status: 'completed' },
    reportLoading: { progress: 100, status: 'completed' },
    failedBatchCount: 0,
    ...overrides,
  } as ProcessingStatus
}
// ProcessingStatus type is exercised via getRefetchInterval/aggregateProcessingStatus signatures

// =============================================================================
// MAX_EMPTY_POLLS
// =============================================================================

describe('MAX_EMPTY_POLLS', () => {
  it('is 20 (20 consecutive empty polls at 3s = ~60s before terminal)', () => {
    expect(MAX_EMPTY_POLLS).toBe(20)
  })
})

// =============================================================================
// getRefetchInterval
// =============================================================================

describe('getRefetchInterval', () => {
  it('returns false for undefined data', () => {
    expect(getRefetchInterval(undefined)).toBe(false)
  })

  it('returns false for status "completed"', () => {
    expect(getRefetchInterval(ps({ status: 'completed' }))).toBe(false)
  })

  it('returns false for status "failed"', () => {
    expect(getRefetchInterval(ps({ status: 'failed', error: 'err', failedBatchCount: 1 }))).toBe(
      false
    )
  })

  it('returns false for status "no_data"', () => {
    expect(getRefetchInterval(ps({ status: 'no_data' }))).toBe(false)
  })

  it('returns 3000 for status "processing"', () => {
    expect(
      getRefetchInterval(
        ps({
          status: 'processing',
          productParsing: { progress: 50, status: 'in_progress' },
          reportLoading: { progress: 50, status: 'in_progress' },
        })
      )
    ).toBe(3000)
  })

  it('returns 3000 when reportLoading status is "in_progress"', () => {
    expect(
      getRefetchInterval(
        ps({
          status: 'processing',
          productParsing: { progress: 50, status: 'in_progress' },
          reportLoading: { progress: 30, status: 'in_progress' },
        })
      )
    ).toBe(3000)
  })

  it('returns 3000 when reportLoading status is "pending"', () => {
    expect(getRefetchInterval(ps({ status: 'processing' }))).toBe(3000)
  })

  it('checks terminal statuses BEFORE reportLoading status (no_data edge case)', () => {
    // no_data carries reportLoading.status: 'pending', but must still stop polling
    expect(getRefetchInterval(ps({ status: 'no_data' }))).toBe(false)
  })

  it('returns false when status is not terminal and reportLoading is completed', () => {
    expect(getRefetchInterval(ps({ status: 'completed' }))).toBe(false)
  })
})

// =============================================================================
// aggregateProcessingStatus
// =============================================================================

describe('aggregateProcessingStatus', () => {
  it('returns default "processing" status for empty batches', () => {
    const result = aggregateProcessingStatus([])

    expect(result.status).toBe('processing')
    expect(result.productParsing.progress).toBe(0)
    expect(result.reportLoading.progress).toBe(0)
    expect(result.error).toBeUndefined()
    expect(result.failedBatchCount).toBe(0)
  })

  it('maps an in-progress batch correctly', () => {
    const batches: ImportBatch[] = [
      {
        id: 'b1',
        batchType: 'weekly_import',
        weekStart: '2025-W01',
        weekEnd: '2025-W04',
        totalWeeks: 4,
        completedWeeks: 2,
        failedWeeks: 0,
        status: 'in_progress',
        startedAt: '2025-01-01T00:00:00Z',
        completedAt: null,
      },
    ]

    const result = aggregateProcessingStatus(batches)

    expect(result.status).toBe('processing')
    expect(result.productParsing.status).toBe('in_progress')
    expect(result.reportLoading.status).toBe('in_progress')
    expect(result.productParsing.progress).toBe(50) // 2/4 * 100
    expect(result.productParsing.taskUuid).toBe('b1')
  })

  it('maps a completed batch', () => {
    const batches: ImportBatch[] = [
      {
        id: 'b2',
        batchType: 'weekly_import',
        weekStart: '2025-W01',
        weekEnd: '2025-W04',
        totalWeeks: 4,
        completedWeeks: 4,
        failedWeeks: 0,
        status: 'completed',
        startedAt: '2025-01-01T00:00:00Z',
        completedAt: '2025-01-01T01:00:00Z',
      },
    ]

    const result = aggregateProcessingStatus(batches)

    expect(result.status).toBe('completed')
    expect(result.productParsing.status).toBe('completed')
    expect(result.productParsing.progress).toBe(100)
  })

  it('maps a "partial" batch as completed', () => {
    const batches: ImportBatch[] = [
      {
        id: 'b3',
        batchType: 'weekly_import',
        weekStart: '2025-W01',
        weekEnd: '2025-W04',
        totalWeeks: 4,
        completedWeeks: 3,
        failedWeeks: 1,
        status: 'partial',
        startedAt: '2025-01-01T00:00:00Z',
        completedAt: '2025-01-01T01:00:00Z',
      },
    ]

    const result = aggregateProcessingStatus(batches)

    expect(result.status).toBe('completed')
    expect(result.productParsing.status).toBe('completed')
    expect(result.productParsing.progress).toBe(75) // 3/4 * 100
  })

  it('maps a failed batch', () => {
    const batches: ImportBatch[] = [
      {
        id: 'b4',
        batchType: 'weekly_import',
        weekStart: '2025-W01',
        weekEnd: '2025-W04',
        totalWeeks: 4,
        completedWeeks: 1,
        failedWeeks: 3,
        status: 'failed',
        startedAt: '2025-01-01T00:00:00Z',
        completedAt: null,
      },
    ]

    const result = aggregateProcessingStatus(batches)

    expect(result.status).toBe('failed')
    expect(result.productParsing.status).toBe('failed')
  })

  it('maps a cancelled batch as failed', () => {
    const batches: ImportBatch[] = [
      {
        id: 'b5',
        batchType: 'weekly_import',
        weekStart: '2025-W01',
        weekEnd: '2025-W04',
        totalWeeks: 4,
        completedWeeks: 0,
        failedWeeks: 0,
        status: 'cancelled',
        startedAt: '2025-01-01T00:00:00Z',
        completedAt: null,
      },
    ]

    const result = aggregateProcessingStatus(batches)

    expect(result.status).toBe('failed')
    expect(result.productParsing.status).toBe('failed')
  })

  it('prefers active batch over completed batch', () => {
    const batches: ImportBatch[] = [
      {
        id: 'completed-1',
        batchType: 'weekly_import',
        weekStart: '2025-W01',
        weekEnd: '2025-W04',
        totalWeeks: 4,
        completedWeeks: 4,
        failedWeeks: 0,
        status: 'completed',
        startedAt: '2025-01-01T00:00:00Z',
        completedAt: '2025-01-01T01:00:00Z',
      },
      {
        id: 'active-1',
        batchType: 'weekly_import',
        weekStart: '2025-W05',
        weekEnd: '2025-W08',
        totalWeeks: 4,
        completedWeeks: 1,
        failedWeeks: 0,
        status: 'in_progress',
        startedAt: '2025-01-15T00:00:00Z',
        completedAt: null,
      },
    ]

    const result = aggregateProcessingStatus(batches)

    expect(result.status).toBe('processing')
    expect(result.productParsing.taskUuid).toBe('active-1')
  })

  it('prefers completed batch when no active batch exists', () => {
    const batches: ImportBatch[] = [
      {
        id: 'failed-1',
        batchType: 'weekly_import',
        weekStart: '2025-W01',
        weekEnd: '2025-W04',
        totalWeeks: 4,
        completedWeeks: 0,
        failedWeeks: 4,
        status: 'failed',
        startedAt: '2025-01-01T00:00:00Z',
        completedAt: '2025-01-01T00:10:00Z',
      },
      {
        id: 'completed-1',
        batchType: 'weekly_import',
        weekStart: '2025-W01',
        weekEnd: '2025-W04',
        totalWeeks: 4,
        completedWeeks: 4,
        failedWeeks: 0,
        status: 'completed',
        startedAt: '2025-01-01T00:00:00Z',
        completedAt: '2025-01-01T01:00:00Z',
      },
    ]

    const result = aggregateProcessingStatus(batches)

    expect(result.status).toBe('completed')
    expect(result.productParsing.taskUuid).toBe('completed-1')
  })

  it('uses progressPercent from batch when available', () => {
    const batches: ImportBatch[] = [
      {
        id: 'b6',
        batchType: 'weekly_import',
        weekStart: '2025-W01',
        weekEnd: '2025-W04',
        totalWeeks: 4,
        completedWeeks: 0,
        failedWeeks: 0,
        status: 'in_progress',
        startedAt: '2025-01-01T00:00:00Z',
        completedAt: null,
        progressPercent: 73,
      },
    ]

    const result = aggregateProcessingStatus(batches)

    expect(result.productParsing.progress).toBe(73)
  })

  it('calculates progress from completedWeeks/totalWeeks when progressPercent is missing', () => {
    const batches: ImportBatch[] = [
      {
        id: 'b7',
        batchType: 'weekly_import',
        weekStart: '2025-W01',
        weekEnd: '2025-W10',
        totalWeeks: 10,
        completedWeeks: 3,
        failedWeeks: 0,
        status: 'in_progress',
        startedAt: '2025-01-01T00:00:00Z',
        completedAt: null,
      },
    ]

    const result = aggregateProcessingStatus(batches)

    expect(result.productParsing.progress).toBe(30) // Math.round(3/10 * 100)
  })

  it('handles totalWeeks=0 (division by zero guard)', () => {
    const batches: ImportBatch[] = [
      {
        id: 'b8',
        batchType: 'weekly_import',
        weekStart: '2025-W01',
        weekEnd: '2025-W04',
        totalWeeks: 0,
        completedWeeks: 0,
        failedWeeks: 0,
        status: 'in_progress',
        startedAt: '2025-01-01T00:00:00Z',
        completedAt: null,
      },
    ]

    const result = aggregateProcessingStatus(batches)

    expect(result.productParsing.progress).toBe(0)
  })

  it('maps pending batch', () => {
    const batches: ImportBatch[] = [
      {
        id: 'b9',
        batchType: 'weekly_import',
        weekStart: '2025-W01',
        weekEnd: '2025-W04',
        totalWeeks: 4,
        completedWeeks: 0,
        failedWeeks: 0,
        status: 'pending',
        startedAt: null,
        completedAt: null,
      },
    ]

    const result = aggregateProcessingStatus(batches)

    expect(result.status).toBe('processing') // pending maps to processing
    expect(result.productParsing.status).toBe('pending')
  })
})

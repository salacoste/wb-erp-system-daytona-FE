import { describe, it, expect } from 'vitest'
import { healthReportSuccessCount } from '../health-report-utils'

describe('healthReportSuccessCount', () => {
  // Backend sets tasksExecuted = taskExecution.success.length (health-report.service.ts:129) —
  // it IS the success count. Live 2026-06-01: tasksExecuted 5 = 5 succeeded (+ 2 failed + 3
  // not-run, total 10 expected). The correct "Успешно" is tasksExecuted itself.
  it('returns tasksExecuted directly (it is already the success count)', () => {
    expect(healthReportSuccessCount({ tasksExecuted: 5 })).toBe(5)
  })

  it('does NOT subtract failed/pending', () => {
    // Locks against re-introducing the bug: 5 succeeded that day even though 2 failed + 3 not-run.
    const summary = { tasksExecuted: 5, tasksFailed: 2, tasksPending: 3 }
    expect(healthReportSuccessCount(summary)).toBe(5)
    expect(healthReportSuccessCount(summary)).not.toBe(3) // old buggy `executed − failed`
    expect(healthReportSuccessCount(summary)).not.toBe(0) // over-corrected `executed − failed − pending`
  })

  it('returns 0 only when zero tasks succeeded', () => {
    expect(healthReportSuccessCount({ tasksExecuted: 0 })).toBe(0)
  })
})

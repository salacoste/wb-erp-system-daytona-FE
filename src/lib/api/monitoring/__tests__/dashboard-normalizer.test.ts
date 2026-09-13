import { describe, expect, it } from 'vitest'
import { normalizeDashboardSearchAnalytics } from '../dashboard-normalizer'

describe('normalizeDashboardSearchAnalytics', () => {
  it('fails closed as unknown for absent metadata', () => {
    expect(normalizeDashboardSearchAnalytics(undefined)).toMatchObject({
      status: 'unknown',
      coverage: { coverageKnown: false, status: 'unknown' },
    })
  })

  it('keeps covered zero-row distinct from unknown and error', () => {
    const result = normalizeDashboardSearchAnalytics({
      totalQueries: 0,
      totalSearchImpressions: 0,
      status: 'no_data',
      coverage: {
        coverageKnown: true,
        requestedDayCount: 1,
        coveredDayCount: 1,
        missingDayCount: 0,
        coverageComplete: true,
        coveredDates: ['2026-05-01'],
        missingDates: [],
        status: 'complete',
      },
    })
    expect(result).toMatchObject({ status: 'no_data', totalQueries: 0 })
  })

  it('downgrades optimistic status when the coverage partition is malformed', () => {
    const result = normalizeDashboardSearchAnalytics({
      status: 'complete',
      coverage: { coverageKnown: true, coverageComplete: true },
    })
    expect(result).toMatchObject({ status: 'unknown', coverage: { coverageKnown: false } })
  })

  it.each([
    [
      'non-contiguous complete dates',
      {
        requestedDayCount: 2,
        coveredDayCount: 2,
        missingDayCount: 0,
        coverageComplete: true,
        coveredDates: ['2026-05-01', '2026-05-03'],
        missingDates: [],
        status: 'complete',
      },
    ],
    [
      'foreign count-consistent partition',
      {
        requestedDayCount: 3,
        coveredDayCount: 3,
        missingDayCount: 0,
        coverageComplete: true,
        coveredDates: ['2026-05-01', '2026-05-02', '2026-05-04'],
        missingDates: [],
        status: 'complete',
      },
    ],
  ])('fails closed at the dashboard boundary for %s', (_label, coverage) => {
    const result = normalizeDashboardSearchAnalytics({
      status: 'complete',
      coverage: { coverageKnown: true, ...coverage },
    })

    expect(result).toMatchObject({
      status: 'unknown',
      coverage: { coverageKnown: false, status: 'unknown' },
    })
  })
})

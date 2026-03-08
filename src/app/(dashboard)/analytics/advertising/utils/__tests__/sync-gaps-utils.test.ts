import { deriveDayStatuses, calculateCoverage } from '../sync-gaps-utils'

describe('deriveDayStatuses', () => {
  it('returns all complete when no gaps and within bounds', () => {
    const result = deriveDayStatuses('2026-03-01', '2026-03-03', [], '2026-01-01', '2026-03-31')
    expect(result).toEqual([
      { date: '2026-03-01', status: 'complete' },
      { date: '2026-03-02', status: 'complete' },
      { date: '2026-03-03', status: 'complete' },
    ])
  })

  it('marks days within a gap as missing', () => {
    const gaps = [{ from: '2026-03-02', to: '2026-03-02', missingDays: 1 }]
    const result = deriveDayStatuses('2026-03-01', '2026-03-03', gaps, '2026-01-01', '2026-03-31')
    expect(result[0].status).toBe('complete')
    expect(result[1].status).toBe('missing')
    expect(result[2].status).toBe('complete')
  })

  it('marks days outside availability bounds as unavailable', () => {
    const result = deriveDayStatuses('2026-03-01', '2026-03-05', [], '2026-03-03', '2026-03-04')
    expect(result[0].status).toBe('unavailable')
    expect(result[1].status).toBe('unavailable')
    expect(result[2].status).toBe('complete')
    expect(result[3].status).toBe('complete')
    expect(result[4].status).toBe('unavailable')
  })

  it('handles multi-day gap ranges', () => {
    const gaps = [{ from: '2026-03-02', to: '2026-03-04', missingDays: 3 }]
    const result = deriveDayStatuses('2026-03-01', '2026-03-05', gaps, '2026-01-01', '2026-12-31')
    expect(result.map(d => d.status)).toEqual([
      'complete',
      'missing',
      'missing',
      'missing',
      'complete',
    ])
  })

  it('returns empty array when from > to', () => {
    expect(deriveDayStatuses('2026-03-05', '2026-03-01')).toEqual([])
  })

  it('handles undefined gaps and bounds', () => {
    const result = deriveDayStatuses('2026-03-01', '2026-03-02', undefined, null, null)
    expect(result).toEqual([
      { date: '2026-03-01', status: 'complete' },
      { date: '2026-03-02', status: 'complete' },
    ])
  })

  it('handles single day range', () => {
    const result = deriveDayStatuses('2026-03-01', '2026-03-01', [], '2026-01-01', '2026-12-31')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ date: '2026-03-01', status: 'complete' })
  })

  it('handles multiple gap ranges', () => {
    const gaps = [
      { from: '2026-03-02', to: '2026-03-02', missingDays: 1 },
      { from: '2026-03-04', to: '2026-03-04', missingDays: 1 },
    ]
    const result = deriveDayStatuses('2026-03-01', '2026-03-05', gaps, '2026-01-01', '2026-12-31')
    expect(result.map(d => d.status)).toEqual([
      'complete',
      'missing',
      'complete',
      'missing',
      'complete',
    ])
  })
})

describe('calculateCoverage', () => {
  it('returns 100% when all complete', () => {
    const statuses = [
      { date: '2026-03-01', status: 'complete' as const },
      { date: '2026-03-02', status: 'complete' as const },
    ]
    expect(calculateCoverage(statuses)).toEqual({ synced: 2, total: 2, percent: 100 })
  })

  it('returns 0% when all missing', () => {
    const statuses = [
      { date: '2026-03-01', status: 'missing' as const },
      { date: '2026-03-02', status: 'missing' as const },
    ]
    expect(calculateCoverage(statuses)).toEqual({ synced: 0, total: 2, percent: 0 })
  })

  it('calculates partial coverage correctly', () => {
    const statuses = [
      { date: '2026-03-01', status: 'complete' as const },
      { date: '2026-03-02', status: 'missing' as const },
      { date: '2026-03-03', status: 'unavailable' as const },
    ]
    expect(calculateCoverage(statuses)).toEqual({ synced: 1, total: 3, percent: 33 })
  })

  it('returns zeros for empty array', () => {
    expect(calculateCoverage([])).toEqual({ synced: 0, total: 0, percent: 0 })
  })

  it('counts only complete as synced (not unavailable)', () => {
    const statuses = [
      { date: '2026-03-01', status: 'complete' as const },
      { date: '2026-03-02', status: 'unavailable' as const },
    ]
    expect(calculateCoverage(statuses)).toEqual({ synced: 1, total: 2, percent: 50 })
  })
})

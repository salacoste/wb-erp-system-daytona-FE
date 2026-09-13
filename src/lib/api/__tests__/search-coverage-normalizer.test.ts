import { describe, expect, it } from 'vitest'
import { normalizeSearchCoverage, normalizeSearchDataStatus } from '../search-coverage-normalizer'

const COMPLETE = {
  coverageKnown: true,
  requestedDayCount: 2,
  coveredDayCount: 2,
  missingDayCount: 0,
  coverageComplete: true,
  coveredDates: ['2026-05-01', '2026-05-02'],
  missingDates: [],
  status: 'complete',
}

const UNKNOWN = {
  coverageKnown: false,
  requestedDayCount: 0,
  coveredDayCount: 0,
  missingDayCount: 0,
  coverageComplete: false,
  coveredDates: [],
  missingDates: [],
  status: 'unknown',
}

describe('normalizeSearchCoverage', () => {
  it('preserves a valid complete partition', () => {
    expect(normalizeSearchCoverage(COMPLETE, { from: '2026-05-01', to: '2026-05-02' })).toEqual(
      COMPLETE
    )
  })

  it('preserves a valid partial partition', () => {
    const partial = {
      ...COMPLETE,
      coveredDayCount: 1,
      missingDayCount: 1,
      coverageComplete: false,
      coveredDates: ['2026-05-01'],
      missingDates: ['2026-05-02'],
      status: 'partial',
    }
    expect(normalizeSearchCoverage(partial)).toEqual(partial)
  })

  it.each([
    ['non-contiguous complete dates', { ...COMPLETE, coveredDates: ['2026-05-01', '2026-05-03'] }],
    [
      'foreign count-consistent partial dates',
      {
        ...COMPLETE,
        requestedDayCount: 3,
        coveredDayCount: 2,
        missingDayCount: 1,
        coverageComplete: false,
        coveredDates: ['2026-05-01', '2026-05-03'],
        missingDates: ['2026-05-04'],
        status: 'partial',
      },
    ],
  ])('fails closed without an expected period for %s', (_label, raw) => {
    expect(normalizeSearchCoverage(raw)).toEqual(UNKNOWN)
  })

  it.each([
    ['requestedDayCount', '2'],
    ['requestedDayCount', true],
    ['requestedDayCount', 1.5],
    ['requestedDayCount', -1],
    ['requestedDayCount', Number.NaN],
    ['requestedDayCount', Number.POSITIVE_INFINITY],
    ['requestedDayCount', {}],
    ['requestedDayCount', null],
    ['coveredDayCount', '2'],
    ['coveredDayCount', true],
    ['coveredDayCount', 1.5],
    ['coveredDayCount', -1],
    ['coveredDayCount', Number.NaN],
    ['coveredDayCount', Number.POSITIVE_INFINITY],
    ['coveredDayCount', {}],
    ['coveredDayCount', null],
    ['missingDayCount', '0'],
    ['missingDayCount', false],
    ['missingDayCount', 0.5],
    ['missingDayCount', -1],
    ['missingDayCount', Number.NaN],
    ['missingDayCount', Number.POSITIVE_INFINITY],
    ['missingDayCount', {}],
    ['missingDayCount', null],
  ])('rejects non-strict scalar metadata for %s=%p', (field, value) => {
    expect(normalizeSearchCoverage({ ...COMPLETE, [field]: value })).toEqual(UNKNOWN)
  })

  it.each([
    ['absent metadata', undefined],
    ['duplicate dates', { ...COMPLETE, coveredDates: ['2026-05-01', '2026-05-01'] }],
    [
      'overlapping dates',
      {
        ...COMPLETE,
        coveredDayCount: 1,
        missingDayCount: 1,
        coverageComplete: false,
        coveredDates: ['2026-05-01'],
        missingDates: ['2026-05-01'],
        status: 'partial',
      },
    ],
    ['count mismatch', { ...COMPLETE, coveredDayCount: 1 }],
    ['status mismatch', { ...COMPLETE, status: 'partial' }],
    ['malformed date', { ...COMPLETE, coveredDates: ['2026-05-01', 'bad-date'] }],
  ])('fails closed as unknown for %s', (_label, raw) => {
    expect(normalizeSearchCoverage(raw)).toEqual(UNKNOWN)
  })

  it.each([
    [
      'zero-day complete',
      { ...COMPLETE, requestedDayCount: 0, coveredDayCount: 0, coveredDates: [] },
    ],
    ['impossible calendar date', { ...COMPLETE, coveredDates: ['2026-05-01', '2026-02-31'] }],
    ['foreign date', { ...COMPLETE, coveredDates: ['2026-05-01', '2026-05-03'] }],
    [
      'complete partition mislabeled partial',
      { ...COMPLETE, coverageComplete: false, status: 'partial' },
    ],
  ])('rejects %s against the endpoint period', (_label, raw) => {
    expect(normalizeSearchCoverage(raw, { from: '2026-05-01', to: '2026-05-02' })).toMatchObject({
      coverageKnown: false,
      coverageComplete: false,
      status: 'unknown',
    })
  })

  it('rejects a malformed or reversed expected period', () => {
    expect(
      normalizeSearchCoverage(COMPLETE, { from: '2026-05-02', to: '2026-05-01' })
    ).toMatchObject({ coverageKnown: false, status: 'unknown' })
  })

  it('preserves an explicit retrieval error without treating it as coverage', () => {
    const result = normalizeSearchCoverage({
      coverageKnown: false,
      requestedDayCount: 2,
      coveredDayCount: 0,
      missingDayCount: 2,
      coverageComplete: false,
      coveredDates: [],
      missingDates: ['2026-05-01', '2026-05-02'],
      status: 'error',
    })
    expect(result).toEqual({
      coverageKnown: false,
      requestedDayCount: 0,
      coveredDayCount: 0,
      missingDayCount: 0,
      coverageComplete: false,
      coveredDates: [],
      missingDates: [],
      status: 'error',
    })
  })
})

describe('normalizeSearchDataStatus', () => {
  it('defaults absent and malformed values to unknown, not retrieval error', () => {
    expect(normalizeSearchDataStatus(undefined)).toBe('unknown')
    expect(normalizeSearchDataStatus('invalid')).toBe('unknown')
  })

  it('preserves explicit unknown and error states', () => {
    expect(normalizeSearchDataStatus('unknown')).toBe('unknown')
    expect(normalizeSearchDataStatus('error')).toBe('error')
  })
})

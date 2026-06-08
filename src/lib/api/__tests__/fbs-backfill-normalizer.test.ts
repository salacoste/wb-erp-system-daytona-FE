/**
 * FBS Backfill Status Boundary Normalizer Tests
 */

import { describe, it, expect } from 'vitest'
import { normalizeBackfillStatusResponse } from '../fbs-backfill-normalizer'

describe('normalizeBackfillStatusResponse', () => {
  it('normalizes an array of cabinet statuses', () => {
    const raw = [
      {
        cabinetId: 'cab-1',
        cabinetName: 'Main Cabinet',
        reportsStatus: 'completed',
        analyticsStatus: 'in_progress',
        overallProgress: 75,
        estimatedEta: '2026-01-15T18:00:00Z',
        errors: [],
      },
      {
        cabinetId: 'cab-2',
        cabinetName: 'Secondary Cabinet',
        reportsStatus: 'pending',
        analyticsStatus: 'pending',
        overallProgress: 0,
        estimatedEta: null,
        errors: ['Connection timeout'],
      },
    ]
    const result = normalizeBackfillStatusResponse(raw)
    expect(result).toHaveLength(2)
    expect(result[0].cabinetId).toBe('cab-1')
    expect(result[0].cabinetName).toBe('Main Cabinet')
    expect(result[0].reportsStatus).toBe('completed')
    expect(result[0].analyticsStatus).toBe('in_progress')
    expect(result[0].overallProgress).toBe(75)
    expect(result[0].estimatedEta).toBe('2026-01-15T18:00:00Z')
    expect(result[0].errors).toEqual([])
    expect(result[1].cabinetId).toBe('cab-2')
    expect(result[1].reportsStatus).toBe('pending')
    expect(result[1].overallProgress).toBe(0)
    expect(result[1].estimatedEta).toBeNull()
    expect(result[1].errors).toEqual(['Connection timeout'])
  })

  it('handles snake_case field aliases', () => {
    const raw = [
      {
        cabinet_id: 'cab-3',
        cabinet_name: 'Test Cabinet',
        reports_status: 'failed',
        analytics_status: 'failed',
        overall_progress: 50,
        estimated_eta: '2026-02-01',
        errors: ['Error A', 'Error B'],
      },
    ]
    const result = normalizeBackfillStatusResponse(raw)
    expect(result[0].cabinetId).toBe('cab-3')
    expect(result[0].cabinetName).toBe('Test Cabinet')
    expect(result[0].reportsStatus).toBe('failed')
    expect(result[0].analyticsStatus).toBe('failed')
    expect(result[0].overallProgress).toBe(50)
    expect(result[0].estimatedEta).toBe('2026-02-01')
    expect(result[0].errors).toEqual(['Error A', 'Error B'])
  })

  it('returns empty array for non-array input', () => {
    expect(normalizeBackfillStatusResponse(null)).toEqual([])
    expect(normalizeBackfillStatusResponse({})).toEqual([])
    expect(normalizeBackfillStatusResponse('string')).toEqual([])
    expect(normalizeBackfillStatusResponse(42)).toEqual([])
  })

  it('defaults fields on empty object', () => {
    const raw = [{}]
    const result = normalizeBackfillStatusResponse(raw)
    expect(result).toHaveLength(1)
    expect(result[0].cabinetId).toBe('')
    expect(result[0].cabinetName).toBe('')
    expect(result[0].overallProgress).toBe(0)
    expect(result[0].estimatedEta).toBeNull()
    expect(result[0].errors).toEqual([])
  })

  it('converts errors to strings', () => {
    const raw = [{ errors: [new Error('fail'), 42, null] }]
    const result = normalizeBackfillStatusResponse(raw)
    expect(result[0].errors).toEqual(['Error: fail', '42', 'null'])
  })

  it('defaults errors to empty array when not array', () => {
    const raw = [{ errors: null }]
    const result = normalizeBackfillStatusResponse(raw)
    expect(result[0].errors).toEqual([])
  })

  it('handles empty array input', () => {
    const result = normalizeBackfillStatusResponse([])
    expect(result).toEqual([])
  })
})

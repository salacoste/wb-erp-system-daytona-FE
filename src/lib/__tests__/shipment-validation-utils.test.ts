/**
 * Unit tests for shipment-validation-utils
 * Epic 76-FE, Story 76.4
 */

import { describe, it, expect } from 'vitest'
import { extractValidationErrors } from '../shipment-validation-utils'
import { ApiError } from '@/types/api'

// ============================================================================
// extractValidationErrors
// ============================================================================

describe('extractValidationErrors', () => {
  it('returns null for non-ApiError input', () => {
    expect(extractValidationErrors(new Error('generic'))).toBeNull()
  })

  it('returns null for string input', () => {
    expect(extractValidationErrors('error')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(extractValidationErrors(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(extractValidationErrors(undefined)).toBeNull()
  })

  it('returns null for ApiError with non-400 status', () => {
    const err = new ApiError('Not Found', 404, { message: 'not found' })
    expect(extractValidationErrors(err)).toBeNull()
  })

  it('returns null for 500 status', () => {
    const err = new ApiError('Internal', 500)
    expect(extractValidationErrors(err)).toBeNull()
  })

  it('returns null for 400 with empty errors array', () => {
    const err = new ApiError('Bad Request', 400, { errors: [] })
    expect(extractValidationErrors(err)).toBeNull()
  })

  it('returns null for 400 with no errors field', () => {
    const err = new ApiError('Bad Request', 400, { message: 'bad' })
    expect(extractValidationErrors(err)).toBeNull()
  })

  it('returns null for 400 with undefined data', () => {
    const err = new ApiError('Bad Request', 400)
    expect(extractValidationErrors(err)).toBeNull()
  })

  it('extracts single validation error', () => {
    const err = new ApiError('Bad Request', 400, {
      errors: [{ errorCode: 'MISSING_COGS', message: 'COGS not set for SKU' }],
    })
    const result = extractValidationErrors(err)
    expect(result).not.toBeNull()
    expect(result).toHaveLength(1)
    expect(result![0].code).toBe('MISSING_COGS')
    expect(result![0].message).toBe('COGS not set for SKU')
  })

  it('extracts multiple validation errors', () => {
    const err = new ApiError('Bad Request', 400, {
      errors: [
        { errorCode: 'MISSING_COGS', message: 'COGS missing' },
        { errorCode: 'MISSING_PACKAGING', message: 'Packaging missing' },
      ],
    })
    const result = extractValidationErrors(err)
    expect(result).toHaveLength(2)
    expect(result![0].code).toBe('MISSING_COGS')
    expect(result![1].code).toBe('MISSING_PACKAGING')
  })

  it('maps affectedIds to strings', () => {
    const err = new ApiError('Bad Request', 400, {
      errors: [
        {
          errorCode: 'ZERO_UNITS',
          message: 'Zero units',
          affectedIds: [123, 'abc', 456],
        },
      ],
    })
    const result = extractValidationErrors(err)
    expect(result![0].affectedIds).toEqual(['123', 'abc', '456'])
  })

  it('handles error without affectedIds', () => {
    const err = new ApiError('Bad Request', 400, {
      errors: [{ errorCode: 'EMPTY_SHIPMENT', message: 'Empty' }],
    })
    const result = extractValidationErrors(err)
    expect(result![0].affectedIds).toBeUndefined()
  })
})

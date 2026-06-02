/**
 * Tests for ApiError predicates (src/types/api.ts).
 * Validation F-21: isForbiddenError distinguishes an expected 403 permission
 * state (show a "lacks role" message, suppress retry) from a generic load error.
 */

import { describe, it, expect } from 'vitest'
import { ApiError, isForbiddenError } from '../api'

describe('isForbiddenError', () => {
  it('true for an ApiError with status 403', () => {
    expect(isForbiddenError(new ApiError('Forbidden', 403))).toBe(true)
  })

  it('false for other ApiError statuses', () => {
    expect(isForbiddenError(new ApiError('Unauthorized', 401))).toBe(false)
    expect(isForbiddenError(new ApiError('Server error', 500))).toBe(false)
    expect(isForbiddenError(new ApiError('Not found', 404))).toBe(false)
  })

  it('false for a plain Error (no status) and non-error values', () => {
    expect(isForbiddenError(new Error('boom'))).toBe(false)
    expect(isForbiddenError(null)).toBe(false)
    expect(isForbiddenError(undefined)).toBe(false)
    expect(isForbiddenError({ status: 403 })).toBe(false) // not an ApiError instance
  })
})

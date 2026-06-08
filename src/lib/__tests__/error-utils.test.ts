/**
 * Unit Tests for Error Utilities
 * Covers: checkWbTokenError
 */

import { describe, it, expect } from 'vitest'
import { ApiError } from '@/types/api'
import { checkWbTokenError } from '../error-utils'

describe('checkWbTokenError', () => {
  it('returns false for null', () => {
    expect(checkWbTokenError(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(checkWbTokenError(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(checkWbTokenError('')).toBe(false)
  })

  it('returns true for ApiError with 401 and WB API token message', () => {
    const error = new ApiError('Invalid WB API token', 401)
    expect(checkWbTokenError(error)).toBe(true)
  })

  it('returns false for ApiError with 401 but wrong message', () => {
    const error = new ApiError('Unauthorized', 401)
    expect(checkWbTokenError(error)).toBe(false)
  })

  it('returns false for ApiError with WB API token message but wrong status', () => {
    const error = new ApiError('Invalid WB API token', 403)
    expect(checkWbTokenError(error)).toBe(false)
  })

  it('returns false for ApiError with 500', () => {
    const error = new ApiError('Internal error', 500)
    expect(checkWbTokenError(error)).toBe(false)
  })

  it('returns true for plain object with status 401 and WB API token message', () => {
    const error = { status: 401, message: 'Invalid WB API token' }
    expect(checkWbTokenError(error)).toBe(true)
  })

  it('returns true for nested data.error structure with UNAUTHORIZED code', () => {
    const error = {
      status: 401,
      data: {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid WB API token provided',
        },
      },
    }
    expect(checkWbTokenError(error)).toBe(true)
  })

  it('returns false for nested data.error with wrong code', () => {
    const error = {
      status: 401,
      data: {
        error: {
          code: 'FORBIDDEN',
          message: 'Invalid WB API token',
        },
      },
    }
    expect(checkWbTokenError(error)).toBe(false)
  })

  it('returns false for nested data.error with wrong message', () => {
    const error = {
      status: 401,
      data: {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Session expired',
        },
      },
    }
    expect(checkWbTokenError(error)).toBe(false)
  })

  it('returns false for generic Error', () => {
    expect(checkWbTokenError(new Error('something'))).toBe(false)
  })

  it('returns false for number', () => {
    expect(checkWbTokenError(401)).toBe(false)
  })
})

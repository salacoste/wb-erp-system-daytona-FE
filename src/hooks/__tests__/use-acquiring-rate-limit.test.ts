import { describe, it, expect } from 'vitest'
import { ApiError } from '@/types/api'
import { getAcquiringRateLimit } from '../use-acquiring-rate-limit'

describe('getAcquiringRateLimit (Story 96.9-FE review fix L-8 / L3-1)', () => {
  it('returns not-rate-limited for null error', () => {
    expect(getAcquiringRateLimit(null)).toEqual({ isRateLimited: false })
  })

  it('returns not-rate-limited for undefined error', () => {
    expect(getAcquiringRateLimit(undefined)).toEqual({ isRateLimited: false })
  })

  it('returns not-rate-limited for plain Error (non-ApiError)', () => {
    expect(getAcquiringRateLimit(new Error('network'))).toEqual({ isRateLimited: false })
  })

  it('returns not-rate-limited for ApiError with non-503 status', () => {
    expect(getAcquiringRateLimit(new ApiError('500 oops', 500))).toEqual({ isRateLimited: false })
  })

  it('returns rate-limited with parsed Retry-After when present', () => {
    const err = new ApiError('rate limit', 503)
    err.retryAfter = 45
    expect(getAcquiringRateLimit(err)).toEqual({ isRateLimited: true, retryAfterSeconds: 45 })
  })

  it('falls back to 60 sec when Retry-After is undefined', () => {
    expect(getAcquiringRateLimit(new ApiError('rate limit', 503))).toEqual({
      isRateLimited: true,
      retryAfterSeconds: 60,
    })
  })
})

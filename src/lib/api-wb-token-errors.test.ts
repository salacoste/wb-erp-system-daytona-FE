/**
 * Unit tests for api-wb-token-errors (FE-D1 fix-wave)
 *
 * Pins the CRITICAL retry contract: every mapped branch of
 * handleWbTokenUpdateError must re-throw an ApiError CLASS instance carrying
 * the ORIGINAL HTTP status, so the mutation retry predicate
 * (src/lib/mutation-retry.ts) can classify 4xx as permanent and skip the
 * retry. Before the fix these branches threw flat Error(...) instances —
 * the predicate saw an unknown error and retried the 400 PUT (e2e
 * WB-TOKEN-BROWSER-02 "Expected 1, Received 2").
 *
 * UI-copy contract: getErrorMessage (wb-token-form-helpers.ts) maps by
 * error.message content + error.data?.code, both preserved verbatim here.
 */

import { describe, it, expect } from 'vitest'
import { ApiError } from '@/types/api'
import { handleWbTokenUpdateError } from './api-wb-token-errors'

/** Runs the handler, returns the thrown error narrowed to ApiError (no casts). */
function catchAsApiError(input: unknown): ApiError {
  try {
    handleWbTokenUpdateError(input)
  } catch (error) {
    if (error instanceof ApiError) return error
    throw new Error(
      `expected ApiError, got ${error instanceof Error ? error.constructor.name : typeof error}`
    )
  }
  throw new Error('handler must throw')
}

describe('handleWbTokenUpdateError (FE-D1: preserve type + status)', () => {
  it.each([400, 403, 404, 401])('re-throws an ApiError instance for input status %i', status => {
    const thrown = catchAsApiError(new ApiError('backend rejected', status))
    expect(thrown.status).toBe(status)
  })

  it('preserves the original status through the 400 branch (predicate input)', () => {
    const thrown = catchAsApiError(new ApiError('Invalid token', 400))
    expect(thrown.status).toBe(400)
    expect(thrown.message).toBe('Invalid token or missing X-Cabinet-Id header')
  })

  it('carries the original data through (getErrorMessage reads data.code)', () => {
    const data = { code: 'INVALID_TOKEN', message: 'wb rejected', details: [] }
    const thrown = catchAsApiError(new ApiError('Invalid token', 400, data))
    expect(thrown.status).toBe(400)
    expect(thrown.data).toEqual(data)
  })

  it('code-based branches also preserve type + status (RATE_LIMITED at 500)', () => {
    const thrown = catchAsApiError(
      new ApiError('rate limited upstream', 500, { code: 'RATE_LIMITED' })
    )
    expect(thrown).toBeInstanceOf(ApiError)
    expect(thrown.status).toBe(500)
    expect(thrown.message).toContain('rate limit')
  })

  it('does not wrap when the handler falls through (5xx passthrough stays ApiError)', () => {
    const original = new ApiError('boom', 502)
    const thrown = catchAsApiError(original)
    expect(thrown).toBe(original)
  })

  it('re-throws non-Error inputs unchanged (fallthrough branch)', () => {
    expect(() => handleWbTokenUpdateError('raw failure')).toThrow('raw failure')
  })
})

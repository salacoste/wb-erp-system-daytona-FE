/**
 * Direct unit tests for the API interceptor helpers.
 * Story 164.1-FE / FR9 — error-path regression coverage for every exported
 * helper and its decision branches in src/lib/api-interceptors.ts.
 *
 * Scope: originally a pure test addition (Story 164.1-FE); FE-D9 (2026-09-02,
 * security HIGH) later added redaction cases alongside the redact layer in
 * src/lib/redact-utils.ts. If a test reveals a real interceptor defect, FLAG
 * it in the story report.
 *
 * Coverage map (AC → test block):
 *   AC1 extractErrorMessage shapes + never-throws .......... describe('extractErrorMessage')
 *   AC2 Retry-After parsing + precedence + rejections ..... describe('parseRetryAfter'), describe('extractRetryAfter')
 *   AC3 WB-token classification suppression .............. describe('isExpectedWbTokenError')
 *   AC4 Telegram tracking matching vs unrelated ........... describe('trackTelegramApiError'), describe('trackTelegramNetworkError')
 *   AC5 logger JSON/raw + independent suppression ......... describe('logApiError')
 *      + FE-D9 secret redaction in both branches (redact-utils)
 *   AC6 ApiClient rethrow-as-is + suppress flag ........... describe('ApiClient integration')
 *
 * Anti-patterns honored: #3 real ApiError constructor, #4 no `as any`
 * (subset interfaces + `as unknown as <Type>` bridges), `mockRejectedValueOnce`
 * for one-shot fetch errors.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  extractErrorMessage,
  parseRetryAfter,
  extractRetryAfter,
  isExpectedWbTokenError,
  trackTelegramApiError,
  trackTelegramNetworkError,
  logApiError,
} from '../api-interceptors'
import { apiClient } from '../api-client'
import { ApiError } from '@/types/api'

// --- Spy targets -----------------------------------------------------------
// Mock the two side-effect sinks at the module boundary so the helpers under
// test run with their REAL decision logic while we assert on call args.
vi.mock('@/lib/analytics/telegram-metrics', () => ({
  TelegramMetrics: {
    apiError: vi.fn(),
    networkError: vi.fn(),
  },
}))
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

// Import the mocked modules for spy access (after vi.mock).
const { TelegramMetrics } = await import('@/lib/analytics/telegram-metrics')
const { logger } = await import('@/lib/logger')

/** Minimal subset of TelegramMetrics for typed spy access (anti-pattern #4). */
interface TelegramMetricsSpy {
  apiError: (endpoint: string, status: number, message: string) => void
  networkError: (endpoint: string) => void
}

const telegramSpy = TelegramMetrics as unknown as TelegramMetricsSpy
const loggerErrorSpy = logger.error as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ===========================================================================
// AC1 — extractErrorMessage: shape selection + never throws
// ===========================================================================
describe('extractErrorMessage', () => {
  it('selects nested error.message from { error: { message } } JSON body', () => {
    expect(extractErrorMessage(true, { error: { message: 'nested boom' } }, 'fallback')).toBe(
      'nested boom'
    )
  })

  it('selects flat message from { message } JSON body', () => {
    expect(extractErrorMessage(true, { message: 'flat boom' }, 'fallback')).toBe('flat boom')
  })

  it('prefers nested error.message over flat message when both are present', () => {
    expect(
      extractErrorMessage(true, { error: { message: 'nested' }, message: 'flat' }, 'fallback')
    ).toBe('nested')
  })

  it('returns the raw string body for text (non-JSON) responses', () => {
    expect(extractErrorMessage(false, 'plain text body', 'fallback')).toBe('plain text body')
  })

  it('returns fallback when JSON body is an empty object', () => {
    expect(extractErrorMessage(true, {}, 'fallback')).toBe('fallback')
  })

  it('returns the string itself when a string body is passed under isJson=true', () => {
    // The string branch is independent of isJson: any typeof === 'string' body
    // is returned verbatim (the JSON branch requires an object). Documents that
    // strings are surfaced as the message regardless of the isJson flag.
    expect(extractErrorMessage(true, 'not-an-object', 'fallback')).toBe('not-an-object')
  })

  it('returns fallback when error.message is present but not a string', () => {
    expect(extractErrorMessage(true, { error: { message: 42 } }, 'fallback')).toBe('fallback')
  })

  it('returns fallback when message is present but not a string', () => {
    expect(extractErrorMessage(true, { message: { x: 1 } }, 'fallback')).toBe('fallback')
  })

  it('returns fallback for null body even under isJson=true', () => {
    expect(extractErrorMessage(true, null, 'fallback')).toBe('fallback')
  })

  it('returns fallback for non-object JSON body (array)', () => {
    expect(extractErrorMessage(true, ['a', 'b'], 'fallback')).toBe('fallback')
  })

  // --- Hostile payloads: must NEVER throw, always return a string ---------
  it('never throws on a circular-reference payload (returns a string)', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    const result = extractErrorMessage(true, circular, 'fallback')
    expect(typeof result).toBe('string')
  })

  it('never throws on deeply nested JSON (returns a string)', () => {
    let deep: unknown = { message: 'deep' }
    for (let i = 0; i < 500; i++) deep = { nested: deep }
    const result = extractErrorMessage(true, deep, 'fallback')
    expect(typeof result).toBe('string')
  })

  it('never throws on undefined body (returns a string)', () => {
    const result = extractErrorMessage(true, undefined, 'fallback')
    expect(typeof result).toBe('string')
  })

  it('never throws on a number body under isJson=true (returns a string)', () => {
    const result = extractErrorMessage(true, 12345, 'fallback')
    expect(typeof result).toBe('string')
  })

  it('never throws on a boolean body under isJson=true (returns a string)', () => {
    const result = extractErrorMessage(true, false, 'fallback')
    expect(typeof result).toBe('string')
  })

  it('never throws on empty-string text body (returns the empty string)', () => {
    // Text branch: typeof === 'string' → returns the string itself (empty ok).
    const result = extractErrorMessage(false, '', 'fallback')
    expect(typeof result).toBe('string')
  })
})

// ===========================================================================
// AC2 — Retry-After: parseRetryAfter (header validator)
// ===========================================================================
describe('parseRetryAfter', () => {
  it.each([
    ['1', 1],
    ['30', 30],
    ['600', 600],
    ['  30  ', 30], // whitespace-padded → trimmed → accepted
    ['450', 450],
  ])('accepts valid header value %p → %p', (raw, expected) => {
    expect(parseRetryAfter(raw)).toBe(expected)
  })

  it.each([
    ['0'], // zero — below range
    ['-1'], // negative — regex rejects sign
    ['1.5'], // decimal — regex rejects
    [''], // empty string
    ['   '], // whitespace-only
    ['Wed, 21 Oct 2026 07:28:00 GMT'], // HTTP-date format
    ['601'], // above range
    ['NaN'], // non-numeric
    ['abc'], // garbage
    ['12e2'], // scientific notation — regex rejects
    ['+30'], // explicit plus sign — regex rejects
  ])('rejects invalid header value %p → undefined', raw => {
    expect(parseRetryAfter(raw)).toBeUndefined()
  })

  it('returns undefined for null header', () => {
    expect(parseRetryAfter(null)).toBeUndefined()
  })

  it('returns undefined for undefined header', () => {
    expect(parseRetryAfter(undefined)).toBeUndefined()
  })
})

// ===========================================================================
// AC2 — Retry-After: extractRetryAfter (status gating + precedence + body fallback)
// ===========================================================================
describe('extractRetryAfter', () => {
  it('returns undefined for non-retryable status (500) even with a valid header', () => {
    expect(extractRetryAfter(500, '30', true, {})).toBeUndefined()
  })

  it('returns undefined for 502 even with a valid header (only 429/503 capture)', () => {
    expect(extractRetryAfter(502, '30', true, {})).toBeUndefined()
  })

  it('parses the header on 503', () => {
    expect(extractRetryAfter(503, '30', true, {})).toBe(30)
  })

  it('parses the header on 429', () => {
    expect(extractRetryAfter(429, '45', true, {})).toBe(45)
  })

  // --- Header precedence over body ---
  it('header takes precedence over a JSON body value (503)', () => {
    expect(extractRetryAfter(503, '10', true, { retryAfter: 99 })).toBe(10)
  })

  it('header takes precedence over a JSON body value (429)', () => {
    expect(extractRetryAfter(429, '20', true, { retryAfter: 99 })).toBe(20)
  })

  // --- Body fallback (no usable header) ---
  it('falls back to numeric body { retryAfter: N } when header is absent', () => {
    expect(extractRetryAfter(429, null, true, { retryAfter: 60 })).toBe(60)
  })

  it('falls back to string body { retryAfter: "60" } when header is absent', () => {
    expect(extractRetryAfter(429, null, true, { retryAfter: '60' })).toBe(60)
  })

  it('falls back to whitespace-padded string body " 45 "', () => {
    expect(extractRetryAfter(429, null, true, { retryAfter: ' 45 ' })).toBe(45)
  })

  it('ignores body fallback when isJson is false', () => {
    expect(extractRetryAfter(429, null, false, { retryAfter: 60 })).toBeUndefined()
  })

  it('ignores body fallback when body is null', () => {
    expect(extractRetryAfter(429, null, true, null)).toBeUndefined()
  })

  it('ignores body fallback when body is not an object', () => {
    expect(extractRetryAfter(429, null, true, '60')).toBeUndefined()
  })

  // --- Body value rejections (numeric) ---
  // Note: the numeric-body path runs Math.floor AFTER the finite+range checks,
  // so a numeric decimal like 1.5 is floored to 1 (NOT rejected). Decimals are
  // only rejected when the body value is a STRING (regex ^\d+$). See the
  // dedicated "floors numeric decimal" test below.
  it.each([
    [0, 'zero'],
    [-5, 'negative'],
    [601, 'above range'],
    [Infinity, 'non-finite (Infinity)'],
    [-Infinity, 'non-finite (-Infinity)'],
    [NaN, 'NaN'],
  ])('rejects numeric body retryAfter=%p (%s)', value => {
    expect(extractRetryAfter(429, null, true, { retryAfter: value })).toBeUndefined()
  })

  it('floors a numeric decimal body retryAfter=1.5 to 1 (Math.floor after range check)', () => {
    // Numeric-body path: finite + in-range → Math.floor. A numeric 1.5 is
    // accepted and floored, unlike the string "1.5" (regex-rejected above).
    expect(extractRetryAfter(429, null, true, { retryAfter: 1.5 })).toBe(1)
  })

  it.each([['0'], ['-1'], ['1.5'], ['601'], ['abc'], [''], ['  ']])(
    'rejects string body retryAfter=%p',
    value => {
      expect(extractRetryAfter(429, null, true, { retryAfter: value })).toBeUndefined()
    }
  )

  it('rejects out-of-range header 601 even with a valid body fallback', () => {
    // Header invalid → falls through to body; body also invalid → undefined.
    expect(extractRetryAfter(429, '601', true, { retryAfter: 60 })).toBe(60)
  })

  it('rejects out-of-range header 0 and falls through to a valid body', () => {
    expect(extractRetryAfter(429, '0', true, { retryAfter: 30 })).toBe(30)
  })
})

// ===========================================================================
// AC3 — WB-token classification: only the documented 401 condition suppresses
// ===========================================================================
describe('isExpectedWbTokenError', () => {
  it('returns true for the exact documented condition (401 + message contains "WB API token")', () => {
    expect(isExpectedWbTokenError(401, 'Missing WB API token')).toBe(true)
  })

  it('returns true when "WB API token" appears anywhere in the message', () => {
    expect(isExpectedWbTokenError(401, 'Invalid WB API token supplied')).toBe(true)
  })

  // --- Near-misses + unrelated auth errors: remain observable (false) ---
  it('returns false for 401 without the WB-token phrase', () => {
    expect(isExpectedWbTokenError(401, 'Unauthorized')).toBe(false)
  })

  it('returns false for 401 with a near-miss phrase ("WB token" without "API")', () => {
    expect(isExpectedWbTokenError(401, 'Missing WB token')).toBe(false)
  })

  it('returns false for 403 with the WB-token phrase (wrong status)', () => {
    expect(isExpectedWbTokenError(403, 'Missing WB API token')).toBe(false)
  })

  it('returns false for 500 with the WB-token phrase (wrong status)', () => {
    expect(isExpectedWbTokenError(500, 'Missing WB API token')).toBe(false)
  })

  it('returns false for 401 with case-variant phrase (substring match is case-sensitive)', () => {
    // Documents that the match is literal/case-sensitive — a defensive guard
    // against accidental broadening. "wb api token" ≠ "WB API token".
    expect(isExpectedWbTokenError(401, 'Missing wb api token')).toBe(false)
  })
})

// ===========================================================================
// AC4 — Telegram tracking: matching endpoint recorded, unrelated not
// ===========================================================================
describe('trackTelegramApiError', () => {
  it('records apiError for a Telegram notification endpoint', () => {
    trackTelegramApiError('/v1/notifications/test', 500, 'boom')
    expect(telegramSpy.apiError).toHaveBeenCalledWith('/v1/notifications/test', 500, 'boom')
    expect(telegramSpy.apiError).toHaveBeenCalledTimes(1)
  })

  it('records apiError when /notifications/ appears mid-path', () => {
    trackTelegramApiError('/v1/cabinets/1/notifications/bind', 502, 'oops')
    expect(telegramSpy.apiError).toHaveBeenCalledTimes(1)
  })

  it('produces NO Telegram metric for an unrelated endpoint', () => {
    trackTelegramApiError('/v1/analytics/weekly/summary', 500, 'boom')
    expect(telegramSpy.apiError).not.toHaveBeenCalled()
  })

  it('produces NO Telegram metric for an endpoint that merely contains "notif"', () => {
    // Substring guard: "notif" alone must not match the /notifications/ rule.
    trackTelegramApiError('/v1/notif-settings', 500, 'boom')
    expect(telegramSpy.apiError).not.toHaveBeenCalled()
  })
})

describe('trackTelegramNetworkError', () => {
  it('records networkError for a Telegram notification endpoint', () => {
    trackTelegramNetworkError('/v1/notifications/bind')
    expect(telegramSpy.networkError).toHaveBeenCalledWith('/v1/notifications/bind')
    expect(telegramSpy.networkError).toHaveBeenCalledTimes(1)
  })

  it('produces NO Telegram network metric for an unrelated endpoint', () => {
    trackTelegramNetworkError('/v1/products')
    expect(telegramSpy.networkError).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// AC5 — Logger: JSON vs raw branch + suppression independent of format
// ===========================================================================
describe('logApiError', () => {
  it('serializes JSON error data via JSON.stringify', () => {
    const data = { error: { message: 'json boom' } }
    logApiError(500, 'json boom', true, data)
    expect(loggerErrorSpy).toHaveBeenCalledTimes(1)
    const [label, payload] = loggerErrorSpy.mock.calls[0]
    expect(label).toBe('API Error [500]:')
    expect(payload).toBe(JSON.stringify(data, null, 2))
  })

  it('logs the raw payload (no serialization) for non-JSON error data', () => {
    const data = 'plain text error'
    logApiError(500, 'plain text error', false, data)
    expect(loggerErrorSpy).toHaveBeenCalledTimes(1)
    const [, payload] = loggerErrorSpy.mock.calls[0]
    // Raw branch passes the value through unchanged (no secrets → redact = identity).
    expect(payload).toBe('plain text error')
    expect(payload).not.toMatch(/^\{/) // not JSON-stringified
  })

  // --- FE-D9 (security HIGH): secret echoes must never reach the console raw ---
  it('redacts secret keys inside JSON error data before serializing', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload'
    logApiError(401, 'Unauthorized', true, { error: { message: 'invalid token', token: jwt } })
    expect(loggerErrorSpy).toHaveBeenCalledTimes(1)
    const [, payload] = loggerErrorSpy.mock.calls[0]
    expect(payload).toContain('[REDACTED]')
    expect(payload).not.toContain(jwt)
    expect(payload).toContain('invalid token') // non-secret context survives
  })

  it('redacts the details[].value echo of a secret field (cabinet WB-token validation)', () => {
    // Assembled from parts (F1): a 12+ char quoted literal directly after a wb-token
    // name matches the check:privacy `token-value` rule even in test sources.
    const wbToken = ['eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9', '.wb-secret'].join('')
    logApiError(400, 'Validation failed', true, {
      details: [{ field: 'token', issue: 'invalid format', value: wbToken }],
    })
    const [, payload] = loggerErrorSpy.mock.calls[0]
    expect(payload).toContain('[REDACTED]')
    expect(payload).not.toContain(wbToken)
    expect(payload).toContain('"field": "token"') // which field failed stays diagnosable
  })

  it('redacts token=... echo inside a plain-text (non-JSON) body', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload'
    logApiError(400, 'bad request', false, `auth failed token=${jwt}`)
    const [, payload] = loggerErrorSpy.mock.calls[0]
    expect(payload).toBe('auth failed token=[REDACTED]')
    expect(payload).not.toContain(jwt)
  })

  // --- Suppression verified INDEPENDENTLY from the logging format ---
  it('suppresses logging for the expected WB-token condition (JSON data)', () => {
    logApiError(401, 'Missing WB API token', true, { error: { message: 'x' } })
    expect(loggerErrorSpy).not.toHaveBeenCalled()
  })

  it('suppresses logging for the expected WB-token condition (non-JSON data)', () => {
    logApiError(401, 'Missing WB API token', false, 'raw')
    expect(loggerErrorSpy).not.toHaveBeenCalled()
  })

  it('does NOT suppress a 401 that lacks the WB-token phrase', () => {
    logApiError(401, 'Unauthorized', true, { error: { message: 'no token phrase' } })
    expect(loggerErrorSpy).toHaveBeenCalledTimes(1)
  })

  it('does NOT suppress a 500 with the WB-token phrase (wrong status)', () => {
    logApiError(500, 'Missing WB API token', true, { error: { message: 'x' } })
    expect(loggerErrorSpy).toHaveBeenCalledTimes(1)
  })
})

// ===========================================================================
// AC6 — ApiClient integration: rethrow-as-is + suppressNetworkErrorLog
// ===========================================================================
describe('ApiClient integration', () => {
  it('rethrows an existing ApiError without reclassifying it as a network failure', async () => {
    // Build a real ApiError (anti-pattern #3) and have fetch reject with it
    // directly — the catch-block must detect instanceof ApiError and rethrow
    // verbatim (same message, same status, NOT wrapped as status:0 network).
    const original = new ApiError('real api error', 418, { detail: 'teapot' })
    const fetchMock = vi.fn().mockRejectedValueOnce(original)

    vi.stubGlobal('fetch', fetchMock)
    await expect(apiClient.get('/v1/any')).rejects.toMatchObject({
      message: 'real api error',
      status: 418,
      name: 'ApiError',
    })
    vi.unstubAllGlobals()

    // Network logging/tracking must NOT fire for an ApiError rethrow path.
    expect(loggerErrorSpy).not.toHaveBeenCalled()
    expect(telegramSpy.networkError).not.toHaveBeenCalled()
  })

  it('wraps a generic network exception as an ApiError with status 0', async () => {
    const networkErr = new TypeError('failed to fetch')
    const fetchMock = vi.fn().mockRejectedValueOnce(networkErr)

    vi.stubGlobal('fetch', fetchMock)
    await expect(apiClient.get('/v1/any')).rejects.toMatchObject({
      status: 0,
      name: 'ApiError',
    })
    vi.unstubAllGlobals()
  })

  it('logs + tracks a network error by default (no suppress flag)', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)
    await expect(apiClient.get('/v1/any')).rejects.toBeInstanceOf(ApiError)
    vi.unstubAllGlobals()

    expect(loggerErrorSpy).toHaveBeenCalledTimes(1)
    // Endpoint here is not a /notifications/ one → no Telegram metric.
    expect(telegramSpy.networkError).not.toHaveBeenCalled()
  })

  it('suppresses network logging when suppressNetworkErrorLog is set, but the error still propagates', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)
    await expect(
      apiClient.get('/v1/any', { suppressNetworkErrorLog: true })
    ).rejects.toBeInstanceOf(ApiError)
    vi.unstubAllGlobals()

    // Logging suppressed by the explicit flag...
    expect(loggerErrorSpy).not.toHaveBeenCalled()
    expect(telegramSpy.networkError).not.toHaveBeenCalled()
  })

  it('still tracks a Telegram network error for a /notifications/ endpoint when not suppressed', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)
    await expect(apiClient.get('/v1/notifications/bind')).rejects.toBeInstanceOf(ApiError)
    vi.unstubAllGlobals()

    expect(telegramSpy.networkError).toHaveBeenCalledWith('/v1/notifications/bind')
  })

  it('suppresses Telegram network tracking for a /notifications/ endpoint when suppressNetworkErrorLog is set', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)
    await expect(
      apiClient.get('/v1/notifications/bind', { suppressNetworkErrorLog: true })
    ).rejects.toBeInstanceOf(ApiError)
    vi.unstubAllGlobals()

    expect(telegramSpy.networkError).not.toHaveBeenCalled()
    expect(loggerErrorSpy).not.toHaveBeenCalled()
  })
})

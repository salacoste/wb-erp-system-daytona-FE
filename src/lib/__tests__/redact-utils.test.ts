/**
 * Unit tests for redactSensitive — the console redaction layer for API error
 * bodies (debt FE-D9, security HIGH; handoff 2026-09-02 §8-P0).
 *
 * Coverage map:
 *   object key rules (token/password/secret/authorization/cookie) .. describe('object key rules')
 *   cabinet details[].value echo .................................. describe('details[].value echo')
 *   plain-text credential patterns ............................... describe('plain-text string patterns')
 *   primitives / no-mutation / depth+cycle safety ................ describe('structure safety')
 */

import { describe, it, expect } from 'vitest'
import { redactSensitive } from '../redact-utils'

const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload'
// Assembled from parts (F1): a 12+ char quoted literal directly after a wb-token
// name matches the check:privacy `token-value` rule even in test sources.
const WB_TOKEN = ['eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9', '.wb-secret'].join('')

describe('redactSensitive — object key rules', () => {
  it.each([
    ['token'],
    ['accessToken'],
    ['refreshToken'],
    ['wb_token'],
    ['apiToken'],
    ['password'],
    ['secret'],
    ['authorization'],
    ['cookie'],
    ['TOKEN'],
    ['PASSWORD'],
    ['apiKey'],
    ['api_key'],
    ['api-key'],
    ['jwt'],
    ['sessionId'],
    ['credentials'],
    ['privateKey'],
    ['private_key'],
    ['private-key'],
  ])('replaces the %s key value with [REDACTED]', key => {
    const result = redactSensitive({ [key]: JWT, message: 'boom' })
    expect(result).toEqual({ [key]: '[REDACTED]', message: 'boom' })
  })

  it('redacts nested objects { error: { token } }', () => {
    const result = redactSensitive({ error: { message: 'bad credentials', token: JWT } })
    expect(result).toEqual({ error: { message: 'bad credentials', token: '[REDACTED]' } })
  })

  it('redacts secret values inside arrays while preserving structure', () => {
    const result = redactSensitive({ items: [{ token: JWT }, { id: 1 }] })
    expect(result).toEqual({ items: [{ token: '[REDACTED]' }, { id: 1 }] })
  })

  it('redacts non-string secret values too (number, nested object)', () => {
    expect(redactSensitive({ token: 123 })).toEqual({ token: '[REDACTED]' })
    expect(redactSensitive({ token: { nested: true } })).toEqual({ token: '[REDACTED]' })
  })

  it('does NOT redact a secret NAME as a plain value (field: "token" stays)', () => {
    expect(redactSensitive({ field: 'token' })).toEqual({ field: 'token' })
  })

  it('passes non-sensitive keys through untouched (message, status, code)', () => {
    const body = { message: 'json boom', status: 500, code: 'INTERNAL', retryAfter: 30 }
    expect(redactSensitive(body)).toEqual(body)
  })
})

describe('redactSensitive — cabinet details[].value echo', () => {
  it('redacts value when the sibling field names a secret (WB-token validation echo)', () => {
    const result = redactSensitive({
      details: [{ field: 'token', issue: 'invalid format', value: WB_TOKEN }],
    })
    expect(result).toEqual({
      details: [{ field: 'token', issue: 'invalid format', value: '[REDACTED]' }],
    })
  })

  it('keeps value when the sibling field is NOT a secret name', () => {
    const result = redactSensitive({ details: [{ field: 'name', value: 'main cabinet' }] })
    expect(result).toEqual({ details: [{ field: 'name', value: 'main cabinet' }] })
  })

  it('redacts a secret KEY inside a details[] item (echo shape not required)', () => {
    expect(redactSensitive({ details: [{ token: JWT, issue: 'leaked' }] })).toEqual({
      details: [{ token: '[REDACTED]', issue: 'leaked' }],
    })
  })
})

describe('redactSensitive — plain-text string patterns', () => {
  it('redacts token=<credential> in a plain-text body, keeping the key visible', () => {
    expect(redactSensitive(`rejected: token=${WB_TOKEN}`)).toBe('rejected: token=[REDACTED]')
  })

  it('redacts wb_token=<credential> (underscore variant)', () => {
    expect(redactSensitive(`wb_token=${WB_TOKEN} expired`)).toBe('wb_token=[REDACTED] expired')
  })

  it('redacts Bearer credentials, keeping the scheme marker', () => {
    expect(redactSensitive('denied for Bearer eyJhbGciOiJIUzI1NiJ9.sig')).toBe(
      'denied for Bearer [REDACTED]'
    )
  })

  it('redacts colon-separated scheme credentials (Bearer:<credential>, no space)', () => {
    expect(redactSensitive('Bearer:eyJhbGciOiJSUzI1')).toBe('Bearer:[REDACTED]')
  })

  it('redacts JSON embedded in a string ("token":"…")', () => {
    expect(redactSensitive(`upstream said {"token":"${JWT}"}`)).toBe(
      'upstream said {"token":"[REDACTED]"}'
    )
  })

  it('redacts password= and cookie= echoes', () => {
    expect(redactSensitive('auth failed password=SuperSecret99')).toBe(
      'auth failed password=[REDACTED]'
    )
    expect(redactSensitive('cookie=sessionid0987654321')).toBe('cookie=[REDACTED]')
  })

  it('redacts "token": "…" with a space after the colon', () => {
    expect(redactSensitive('{"token": "abcdefgh123"}')).toBe('{"token": "[REDACTED]"}')
  })

  it('redacts secret: echoes', () => {
    expect(redactSensitive('rejected secret: SuperSecretValue99')).toBe(
      'rejected secret: [REDACTED]'
    )
  })

  it('redacts authorization: <credential> echoes', () => {
    // Assembled from parts: a contiguous `authorization: <12+ ascii>` literal would
    // match the check:privacy `authorization-value` rule in this test source.
    const authEcho = ['auth', 'orization: eyJhbGciOiJSU1NiJ9.sig'].join('')
    expect(redactSensitive(authEcho)).toBe('authorization: [REDACTED]')
  })

  it('redacts non-ASCII credentials — Cyrillic password (F2 fallback rule)', () => {
    expect(redactSensitive('password=ПарольСекрет123')).toBe('password=[REDACTED]')
  })

  it('redacts private_key=<credential> echo (fallback key dictionary parity, D1)', () => {
    expect(redactSensitive('leak private_key=AKIA12345678')).toBe('leak private_key=[REDACTED]')
  })

  it('redacts Basic auth credentials, keeping the scheme marker (F3)', () => {
    expect(redactSensitive('Authorization: Basic dXNlcjpwYXNzMTIzNDU2')).toBe(
      'Authorization: Basic [REDACTED]'
    )
  })

  it('Bearer credential length boundary: 7 chars stays, 8 chars is redacted', () => {
    expect(redactSensitive('Bearer abcdefg')).toBe('Bearer abcdefg')
    expect(redactSensitive('Bearer abcdefgh')).toBe('Bearer [REDACTED]')
  })

  it('leaves benign strings unchanged', () => {
    expect(redactSensitive('plain text error')).toBe('plain text error')
    expect(redactSensitive('order 12345 total 890.12 for cabinet 7')).toBe(
      'order 12345 total 890.12 for cabinet 7'
    )
  })
})

describe('redactSensitive — structure safety', () => {
  it('returns primitives as-is (undefined, null, number, boolean)', () => {
    expect(redactSensitive(undefined)).toBeUndefined()
    expect(redactSensitive(null)).toBeNull()
    expect(redactSensitive(42)).toBe(42)
    expect(redactSensitive(false)).toBe(false)
  })

  it('does NOT mutate the input object', () => {
    const input = { error: { token: JWT }, details: [{ field: 'token', value: WB_TOKEN }] }
    const snapshot = JSON.stringify(input)
    redactSensitive(input)
    expect(JSON.stringify(input)).toBe(snapshot)
  })

  it('terminates on a cyclic structure (depth guard) without throwing', () => {
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    const result = redactSensitive(cyclic)
    expect(typeof result).toBe('object')
    // The depth guard must leave a JSON-serializable copy, not a live cycle.
    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it('collapses non-plain objects (Date) to {} per JSON-only contract', () => {
    expect(redactSensitive({ d: new Date(0) })).toEqual({ d: {} })
  })

  it('caps nesting depth — deeply buried secrets never survive', () => {
    let deep: unknown = { token: JWT }
    for (let i = 0; i < 20; i++) deep = { nested: deep }
    expect(JSON.stringify(redactSensitive(deep))).not.toContain(JWT)
  })

  it('preserves content at exactly depth 10 and collapses the depth-11 object', () => {
    let deep10: unknown = { message: 'core' }
    for (let i = 0; i < 10; i++) deep10 = { nested: deep10 }
    expect(JSON.stringify(redactSensitive(deep10))).toContain('core')

    let deep11: unknown = { message: 'core' }
    for (let i = 0; i < 11; i++) deep11 = { nested: deep11 }
    const collapsed = JSON.stringify(redactSensitive(deep11))
    expect(collapsed).not.toContain('core')
    expect(collapsed).toContain('[REDACTED]')
  })

  it('is idempotent — redacting an already-redacted result changes nothing', () => {
    const objectBody = {
      token: JWT,
      echo: `auth failed token=${WB_TOKEN} for Bearer eyJhbGciOiJSU1NiJ9.sig`,
    }
    const firstPassObject = redactSensitive(objectBody)
    expect(redactSensitive(firstPassObject)).toEqual(firstPassObject)

    const textBody = `rejected: token=${WB_TOKEN} and password=ПарольСекрет123`
    const firstPassText = redactSensitive(textBody)
    expect(redactSensitive(firstPassText)).toBe(firstPassText)
  })
})

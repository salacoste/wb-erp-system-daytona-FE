/**
 * Pins for central logger redaction (Wave D, debt registry residual).
 *
 * logger.warn/logger.error wrap every arg with the canon FE-D9 redactor
 * (redactSensitive) so the 131 call sites that bypass logApiError are covered
 * WITHOUT touching them. Error instances are carved out — redactSensitive's
 * JSON-only contract collapses them to {} (message/stack non-enumerable).
 *
 * Coverage map:
 *   warn/error redact secrets, keep benign fields .... describe('warn/error redact')
 *   idempotency through the real logApiError path .... describe('double-redaction safety')
 *   debug/info stay unredacted (dev-only tracing) .... describe('debug/info unchanged')
 *   '[warn]'/'[error]' prefixes preserved ............ asserted in every redact pin
 *   Error-instance passthrough ....................... describe('Error passthrough')
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { logger } from '../logger'
import { redactSensitive } from '../redact-utils'
import { logApiError } from '../api-interceptors'

// Secrets assembled from parts (F1, redact-utils.test.ts precedent): a 12+ char
// literal directly after a token-ish name would match the check:privacy
// token-value rule even in test sources.
const JWT = ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', '.payload.sig'].join('')
const WB_TOKEN = ['wb1234567890abcdefgh', 'cdef'].join('')

describe('logger warn/error redact sensitive args', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('warn redacts a Bearer credential in a string, keeping the prefix', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.warn('request denied for', `Bearer ${WB_TOKEN}`)
    expect(warnSpy).toHaveBeenCalledWith('[warn]', 'request denied for', 'Bearer [REDACTED]')
  })

  it('error redacts a Bearer credential in a string, keeping the prefix', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('request denied for', `Bearer ${WB_TOKEN}`)
    expect(errorSpy).toHaveBeenCalledWith('[error]', 'request denied for', 'Bearer [REDACTED]')
  })

  it('warn redacts a password-keyed object while keeping benign fields', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.warn('login failed', { password: 'Short1abc', userId: 42, message: 'bad creds' })
    expect(warnSpy).toHaveBeenCalledWith('[warn]', 'login failed', {
      password: '[REDACTED]',
      userId: 42,
      message: 'bad creds',
    })
  })

  it('error redacts a token-keyed body and an embedded token=value string', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('cabinet rejected:', { token: JWT, status: 400 }, `echo wb_token=${WB_TOKEN} end`)
    expect(errorSpy).toHaveBeenCalledWith(
      '[error]',
      'cabinet rejected:',
      {
        token: '[REDACTED]',
        status: 400,
      },
      'echo wb_token=[REDACTED] end'
    )
  })

  it('does not mutate caller objects and passes primitives through', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const input = { token: JWT, keep: 'visible' }
    logger.warn('snapshot:', input, 42, null)
    expect(input).toEqual({ token: JWT, keep: 'visible' })
    expect(warnSpy).toHaveBeenCalledWith(
      '[warn]',
      'snapshot:',
      {
        token: '[REDACTED]',
        keep: 'visible',
      },
      42,
      null
    )
  })
})

describe('double-redaction safety (logApiError path shape)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('a body redacted then stringified by logApiError survives the logger pass verbatim', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const body = { message: 'rejected', token: JWT, echo: `token=${WB_TOKEN}` }

    // The real logApiError: redactSensitive -> JSON.stringify -> logger.error
    // (which applies the redactor to the string a second time).
    logApiError(500, 'server error', true, body)

    const expected = JSON.stringify(redactSensitive(body), null, 2)
    expect(errorSpy).toHaveBeenCalledWith('[error]', 'API Error [500]:', expected)
    expect(expected).toContain('[REDACTED]')
    expect(expected).not.toContain('payload.sig')
  })

  it('raw (never-redacted) bodies are redacted by logger.error alone', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('raw body:', { token: JWT }, `password=${WB_TOKEN} trailing`)
    const flat = errorSpy.mock.calls[0].map(String).join(' ')
    expect(flat).toContain('[REDACTED]')
    expect(flat).not.toContain('payload.sig')
    expect(flat).not.toContain('cdef')
  })
})

describe('debug/info stay unredacted (dev-only tracing)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('debug/info emit raw args without the redactor', async () => {
    vi.resetModules()
    vi.stubEnv('NODE_ENV', 'development')
    const devLogger = await import('../logger')
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const secret = `token=${WB_TOKEN}`

    devLogger.debug(secret)
    devLogger.info(secret)

    expect(infoSpy).toHaveBeenNthCalledWith(1, '[debug]', secret)
    expect(infoSpy).toHaveBeenNthCalledWith(2, '[info]', secret)
  })
})

describe('Error instances pass through intact', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('warn/error preserve the Error identity, message and stack', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = new Error('route failed with detail')

    logger.warn('warn path:', err)
    logger.error('error path:', err)

    expect(warnSpy.mock.calls[0][2]).toBe(err)
    expect(errorSpy.mock.calls[0][2]).toBe(err)
    expect(errorSpy).toHaveBeenCalledWith('[error]', 'error path:', err)
  })
})

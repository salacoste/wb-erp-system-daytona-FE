/**
 * Story 167.7 behavior-lock: validation schema + error-state copy mapping
 * (getErrorMessage) pinned independently of presentation.
 */
import { describe, it, expect } from 'vitest'
import {
  wbTokenFormSchema,
  getErrorMessage,
  sanitizeFallbackMessage,
  type WbTokenFormData,
} from './wb-token-form-helpers'

const VALID_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

describe('wbTokenFormSchema (validation semantics locked)', () => {
  it('accepts a structurally valid JWT token', () => {
    const result = wbTokenFormSchema.safeParse({ token: VALID_JWT })
    expect(result.success).toBe(true)
  })

  it('rejects an empty token with the required-field message', () => {
    const result = wbTokenFormSchema.safeParse({ token: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('WB API токен обязателен')
    }
  })

  it('rejects a too-short token with the min-length message', () => {
    const result = wbTokenFormSchema.safeParse({ token: 'a.b.c' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Токен кажется слишком коротким. Пожалуйста, проверьте токен.'
      )
    }
  })

  it('rejects a long token without the 3-part JWT structure', () => {
    const result = wbTokenFormSchema.safeParse({
      token: 'invalid-token-format-without-proper-jwt-structure-that-is-long-enough',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some(
          issue => issue.message === 'Формат токена кажется неверным. Пожалуйста, проверьте токен.'
        )
      ).toBe(true)
    }
  })

  it('derived form data type accepts the valid shape', () => {
    const data: WbTokenFormData = { token: VALID_JWT }
    expect(data.token.split('.')).toHaveLength(3)
  })
})

describe('getErrorMessage (per-error-state copy mapping locked)', () => {
  const withData = (message: string, code?: string): Error => {
    const error = new Error(message) as Error & { data?: { code?: string } }
    if (code) error.data = { code }
    return error
  }

  it('maps WB-rejected / invalid / expired tokens to «Токен недействителен» with recovery link', () => {
    for (const error of [
      withData('WB rejected', 'invalid_token'),
      withData('Token validation failed', 'token_validation_failed'),
      withData('session expired'),
    ]) {
      const info = getErrorMessage(error)
      expect(info.title).toBe('Токен недействителен')
      expect(info.showLink).toBe(true)
    }
  })

  it('maps rate limiting to «Превышен лимит запросов» without link', () => {
    const info = getErrorMessage(withData('Rate limit exceeded'))
    expect(info.title).toBe('Превышен лимит запросов')
    expect(info.showLink).toBe(false)
  })

  it('maps network failures to «Ошибка сети» without link', () => {
    const info = getErrorMessage(withData('Network connection refused'))
    expect(info.title).toBe('Ошибка сети')
    expect(info.showLink).toBe(false)
  })

  it('maps permission failures (403/forbidden) to «Нет доступа» without link', () => {
    const info = getErrorMessage(withData('Forbidden: permission denied'))
    expect(info.title).toBe('Нет доступа')
    expect(info.showLink).toBe(false)
  })

  it('maps cabinet-not-found to «Кабинет не найден» without link', () => {
    const info = getErrorMessage(withData('Cabinet not found'))
    expect(info.title).toBe('Кабинет не найден')
    expect(info.showLink).toBe(false)
  })

  it('falls back to a scrubbed benign message with the recovery link (expired-session path)', () => {
    // 'User not authenticated' matches no classification branch and carries no
    // internal markers — FE-D3 scrub must pass benign text through untouched.
    const info = getErrorMessage(withData('User not authenticated'))
    expect(info.title).toBe('Ошибка сохранения токена')
    expect(info.message).toBe('User not authenticated')
    expect(info.showLink).toBe(true)
  })

  it('fallback scrubs + bounds the raw message (FE-D3; previously a verbatim echo)', () => {
    // FE-D3: the fallback branch no longer echoes error.message verbatim — raw
    // text is scrubbed (stack frames, URLs, internal markers) before display.
    const info = getErrorMessage(
      new Error('Service unavailable\n    at saveToken (http://localhost:3000/src/x.ts:1:1))')
    )
    expect(info.message).toBe('Service unavailable')
  })
})

describe('getErrorMessage fallback sanitize contract (FE-D3 regression pins)', () => {
  it('a. removes stack-trace lines and URLs from the fallback message', () => {
    const info = getErrorMessage(
      new Error('Service unavailable\n    at saveToken (http://localhost:3000/src/x.ts:1:1))')
    )
    expect(info.message).not.toContain(' at ')
    expect(info.message).not.toContain('http://')
    expect(info.message).toContain('Service unavailable')
  })

  it('b. strips JWT-like token sequences from the fallback message', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiIs.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    const info = getErrorMessage(new Error(`Auth failed: ${jwt} denied`))
    expect(info.message).not.toContain(jwt)
    expect(info.message).not.toContain('SflKxwRJSMeKKF2QT4')
    expect(info.message).toContain('Auth failed')
  })

  it('c. truncates long fallback messages to 200 code points + ellipsis', () => {
    const longMessage =
      'The provisioning service could not complete the request because an upstream dependency ' +
      'returned an unexpected answer while the workspace record was being linked to the newly ' +
      'submitted credential sentinelTailCheck alpha beta gamma delta epsilon zeta eta theta'
    const info = getErrorMessage(new Error(longMessage))
    expect(info.message.length).toBeLessThanOrEqual(201)
    expect(Array.from(info.message).length).toBeLessThanOrEqual(201)
    expect(info.message.endsWith('…')).toBe(true)
    expect(info.message).not.toContain('sentinelTailCheck')
  })

  it('d. falls back to the generic message when scrubbing removes everything', () => {
    const info = getErrorMessage(
      new Error('/var/lib/app/internal/prisma/client eyJhbGciOiJIUzI1NiJ9 select * from users')
    )
    expect(info.message).toBe('Произошла неизвестная ошибка. Попробуйте снова.')
    expect(info.title).toBe('Ошибка сохранения токена')
    expect(info.showLink).toBe(true)
  })

  it('e. passes benign short messages through untouched (guards against over-scrubbing)', () => {
    const info = getErrorMessage(new Error('User not authenticated'))
    expect(info.message).toBe('User not authenticated')
  })

  it('rider-1: strips scheme-agnostic connection strings carrying credentials', () => {
    const info = getErrorMessage(
      new Error('DB handshake failed: postgresql://admin:SuperSecret@db.internal:5432/app')
    )
    expect(info.message).not.toContain('SuperSecret')
    expect(info.message).toContain('DB handshake failed')
  })

  it('rider-3: truncation never splits surrogate pairs (emoji input >200 code points)', () => {
    // /u flag: without it the class matches BOTH halves of well-formed pairs;
    // with /u only LONE (split) surrogates match — the actual defect signal.
    const info = getErrorMessage(new Error('🚀'.repeat(250)))
    expect(info.message).not.toMatch(/[\uD800-\uDFFF]/u)
    expect(Array.from(info.message).length).toBeLessThanOrEqual(201)
  })
})

describe('sanitizeFallbackMessage (FE-D3 rider pins — direct unit level)', () => {
  it('rider-2a: verbal-SQL scrub preserves benign «Please select a … from …» prose verbatim', () => {
    const message = 'Please select a cabinet from the list'
    expect(sanitizeFallbackMessage(message)).toBe(message)
  })

  it('rider-2b: verbal-SQL scrub preserves benign «update … set …» prose verbatim', () => {
    const message = 'Failed to update the field set for product 123'
    expect(sanitizeFallbackMessage(message)).toBe(message)
  })

  it('rider-5: non-string input returns the generic fallback instead of throwing', () => {
    expect(sanitizeFallbackMessage(undefined as unknown as string)).toBe(
      'Произошла неизвестная ошибка. Попробуйте снова.'
    )
  })

  it('pass-2: empty string returns the generic fallback (old `||` contract preserved)', () => {
    expect(sanitizeFallbackMessage('')).toBe('Произошла неизвестная ошибка. Попробуйте снова.')
  })

  it('pass-2: benign Cyrillic prose passes through verbatim (product locale over-scrub guard)', () => {
    const message = 'Не удалось сохранить токен. Проверьте данные и повторите попытку.'
    expect(sanitizeFallbackMessage(message)).toBe(message)
  })

  it('wave-2 item-1: DDL fragments (drop/truncate/alter table) are scrubbed from the message', () => {
    const result = sanitizeFallbackMessage('select * from users; drop table sessions now')
    expect(result).not.toContain('drop table')
  })

  it('wave-2 item-3: hard 200-cut branch yields exactly 201 code points (word-cut false branch)', () => {
    // Reviewer's literal form was 'a'.repeat(240), but a 240-char [a-f] run
    // collides with the hex/blob scrub classes (it gets scrubbed, testing the
    // wrong branch). Inert '!' filler preserves the tested mechanism: the only
    // space sits in the first half, so the word-boundary cut is skipped and the
    // full 200-code-point cut + '…' is returned.
    const result = sanitizeFallbackMessage('word ' + '!'.repeat(240))
    expect(Array.from(result).length).toBe(201)
    expect(result.endsWith('…')).toBe(true)
  })

  it('wave-2 item-4: content beyond the 4096 pre-bound is dropped (accepted trade-off, pinned)', () => {
    // Tail marker placed ONCE, beyond the 4096-unit pre-bound: the slice drops
    // it before any scrub/truncate sees it.
    const head = ('x'.repeat(40) + ' ').repeat(200) // 200 * 41 = 8200 UTF-16 units
    const result = sanitizeFallbackMessage(head + 'SECRET-TAIL-MARKER')
    expect(result).not.toContain('SECRET-TAIL-MARKER')
  })

  it('wave-2 item-5: full-JWT pattern eats short signatures the >=40 blob rule cannot catch', () => {
    // Signature 'c2hvcnQ' is 7 chars: generic-eyJ would leave it (not >=40, not
    // hex) — only the header.payload.signature rule removes the whole token.
    const result = sanitizeFallbackMessage('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2hvcnQ')
    expect(result).not.toContain('c2hvcnQ')
  })
})

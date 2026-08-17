/**
 * Story 167.7 behavior-lock: validation schema + error-state copy mapping
 * (getErrorMessage) pinned independently of presentation.
 */
import { describe, it, expect } from 'vitest'
import { wbTokenFormSchema, getErrorMessage, type WbTokenFormData } from './wb-token-form-helpers'

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

  it('falls back to echoing the raw message with the recovery link (expired-session path)', () => {
    // 'User not authenticated' matches no branch — pre-existing fallback semantics
    const info = getErrorMessage(withData('User not authenticated'))
    expect(info.title).toBe('Ошибка сохранения токена')
    expect(info.message).toBe('User not authenticated')
    expect(info.showLink).toBe(true)
  })

  it('fallback echoes the raw message verbatim (pre-existing semantics, no scrubbing)', () => {
    // Documented gap: the fallback branch echoes error.message as-is, so a
    // server that embeds the token in its error text would surface it. This is
    // pre-existing behavior owned by the fallback branch — preserved, not changed.
    const info = getErrorMessage(new Error('Service unavailable'))
    expect(info.message).toBe('Service unavailable')
  })
})

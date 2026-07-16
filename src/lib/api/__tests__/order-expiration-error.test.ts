import { describe, expect, it } from 'vitest'
import {
  extractExpirationMinimumDate,
  isExpirationOutcomeUncertain,
} from '../order-expiration-error'
import { ApiError } from '@/types/api'

describe('extractExpirationMinimumDate', () => {
  it('extracts only the standardized too-early 400 envelope', () => {
    const error = new ApiError('Дата слишком ранняя', 400, {
      error: {
        code: 'ORDER_EXPIRATION_DATE_TOO_EARLY',
        details: { minimumDate: '2026-08-15' },
      },
    })
    expect(extractExpirationMinimumDate(error)).toBe('2026-08-15')
  })

  it.each([
    new Error('not an ApiError'),
    new ApiError('wrong status', 409, {
      error: { code: 'ORDER_EXPIRATION_DATE_TOO_EARLY', details: { minimumDate: '2026-08-15' } },
    }),
    new ApiError('wrong code', 400, {
      error: { code: 'OTHER', details: { minimumDate: '2026-08-15' } },
    }),
    new ApiError('bad envelope', 400, {
      code: 'ORDER_EXPIRATION_DATE_TOO_EARLY',
      minimumDate: '2026-08-15',
    }),
    new ApiError('bad date', 400, {
      error: { code: 'ORDER_EXPIRATION_DATE_TOO_EARLY', details: { minimumDate: '15.08.2026' } },
    }),
    new ApiError('impossible date', 400, {
      error: { code: 'ORDER_EXPIRATION_DATE_TOO_EARLY', details: { minimumDate: '2026-02-30' } },
    }),
  ])('returns null for unrelated or malformed errors', error => {
    expect(extractExpirationMinimumDate(error)).toBeNull()
  })
})

describe('isExpirationOutcomeUncertain', () => {
  it('accepts only the standardized 502 uncertain-outcome envelope', () => {
    expect(
      isExpirationOutcomeUncertain(
        new ApiError('Неопределённый исход', 502, {
          error: { code: 'ORDER_EXPIRATION_OUTCOME_UNCERTAIN' },
        })
      )
    ).toBe(true)
  })

  it.each([
    new Error('plain error'),
    new ApiError('wrong status', 409, {
      error: { code: 'ORDER_EXPIRATION_OUTCOME_UNCERTAIN' },
    }),
    new ApiError('wrong code', 502, { error: { code: 'OTHER' } }),
    new ApiError('bad envelope', 502, { code: 'ORDER_EXPIRATION_OUTCOME_UNCERTAIN' }),
  ])('rejects unrelated errors', error => {
    expect(isExpirationOutcomeUncertain(error)).toBe(false)
  })
})

/**
 * Tests for russian-plural.ts
 * Epic 90-FE Story 90.3: shared pluralization module
 */

import { describe, it, expect } from 'vitest'
import { pluralize, REPORT_FORMS, TRANSACTION_FORMS, DAY_FORMS } from '../russian-plural'

describe('pluralize — REPORT_FORMS', () => {
  it('n=1 → "отчёт" (single)', () => {
    expect(pluralize(REPORT_FORMS, 1)).toBe('отчёт')
  })

  it('n=2 → "отчёта" (few)', () => {
    expect(pluralize(REPORT_FORMS, 2)).toBe('отчёта')
  })

  it('n=3 → "отчёта" (few)', () => {
    expect(pluralize(REPORT_FORMS, 3)).toBe('отчёта')
  })

  it('n=4 → "отчёта" (few)', () => {
    expect(pluralize(REPORT_FORMS, 4)).toBe('отчёта')
  })

  it('n=5 → "отчётов" (many)', () => {
    expect(pluralize(REPORT_FORMS, 5)).toBe('отчётов')
  })

  it('n=11 → "отчётов" (teen exception)', () => {
    expect(pluralize(REPORT_FORMS, 11)).toBe('отчётов')
  })

  it('n=12 → "отчётов" (teen exception)', () => {
    expect(pluralize(REPORT_FORMS, 12)).toBe('отчётов')
  })

  it('n=14 → "отчётов" (teen exception)', () => {
    expect(pluralize(REPORT_FORMS, 14)).toBe('отчётов')
  })

  it('n=21 → "отчёт" (last digit 1, not teen)', () => {
    expect(pluralize(REPORT_FORMS, 21)).toBe('отчёт')
  })

  it('n=22 → "отчёта" (last digit 2, not teen)', () => {
    expect(pluralize(REPORT_FORMS, 22)).toBe('отчёта')
  })

  it('n=25 → "отчётов" (many)', () => {
    expect(pluralize(REPORT_FORMS, 25)).toBe('отчётов')
  })
})

describe('pluralize — TRANSACTION_FORMS', () => {
  it('n=1 → "транзакция" (single)', () => {
    expect(pluralize(TRANSACTION_FORMS, 1)).toBe('транзакция')
  })

  it('n=2 → "транзакции" (few)', () => {
    expect(pluralize(TRANSACTION_FORMS, 2)).toBe('транзакции')
  })

  it('n=5 → "транзакций" (many)', () => {
    expect(pluralize(TRANSACTION_FORMS, 5)).toBe('транзакций')
  })

  it('n=11 → "транзакций" (teen exception)', () => {
    expect(pluralize(TRANSACTION_FORMS, 11)).toBe('транзакций')
  })

  it('n=21 → "транзакция" (last digit 1, not teen)', () => {
    expect(pluralize(TRANSACTION_FORMS, 21)).toBe('транзакция')
  })
})

describe('pluralize — DAY_FORMS', () => {
  it('n=1 → "день" (single)', () => {
    expect(pluralize(DAY_FORMS, 1)).toBe('день')
  })

  it('n=2 → "дня" (few)', () => {
    expect(pluralize(DAY_FORMS, 2)).toBe('дня')
  })

  it('n=7 → "дней" (many)', () => {
    expect(pluralize(DAY_FORMS, 7)).toBe('дней')
  })

  it('n=14 → "дней" (teen exception)', () => {
    expect(pluralize(DAY_FORMS, 14)).toBe('дней')
  })

  it('n=21 → "день" (last digit 1, not teen) — regression for Story 103.4 polish', () => {
    expect(pluralize(DAY_FORMS, 21)).toBe('день')
  })

  it('n=28 → "дней" (many)', () => {
    expect(pluralize(DAY_FORMS, 28)).toBe('дней')
  })
})

describe('pluralize — edge cases', () => {
  it('n=0 returns many form (standard Russian grammar)', () => {
    expect(pluralize(REPORT_FORMS, 0)).toBe('отчётов')
    expect(pluralize(TRANSACTION_FORMS, 0)).toBe('транзакций')
  })

  it('negative count uses Math.abs (mirrors positive)', () => {
    expect(pluralize(REPORT_FORMS, -1)).toBe('отчёт')
    expect(pluralize(REPORT_FORMS, -3)).toBe('отчёта')
    expect(pluralize(REPORT_FORMS, -11)).toBe('отчётов')
  })

  it('decimal counts follow Math.trunc — 1.5 truncates to 1 (single form)', () => {
    // Math.trunc(Math.abs(1.5)) = 1 → last digit 1 → single form
    expect(pluralize(REPORT_FORMS, 1.5)).toBe('отчёт')
    // Math.trunc(Math.abs(2.9)) = 2 → last digit 2 → few form
    expect(pluralize(REPORT_FORMS, 2.9)).toBe('отчёта')
  })
})

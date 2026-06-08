/**
 * cogs-history-utils Unit Tests
 *
 * Verifies Russian plural form helper:
 * - Returns correct form for 1, 2-4, 5-20, 21, 22-24, etc.
 */

import { describe, it, expect } from 'vitest'
import { getPluralForm } from '../cogs-history-utils'

describe('getPluralForm', () => {
  it('returns "one" form for 1', () => {
    expect(getPluralForm(1, 'запись', 'записи', 'записей')).toBe('запись')
  })

  it('returns "few" form for 2-4', () => {
    expect(getPluralForm(2, 'запись', 'записи', 'записей')).toBe('записи')
    expect(getPluralForm(3, 'запись', 'записи', 'записей')).toBe('записи')
    expect(getPluralForm(4, 'запись', 'записи', 'записей')).toBe('записи')
  })

  it('returns "many" form for 5-20', () => {
    expect(getPluralForm(5, 'запись', 'записи', 'записей')).toBe('записей')
    expect(getPluralForm(10, 'запись', 'записи', 'записей')).toBe('записей')
    expect(getPluralForm(20, 'запись', 'записи', 'записей')).toBe('записей')
  })

  it('returns "many" form for 11-19 (teen exception)', () => {
    expect(getPluralForm(11, 'запись', 'записи', 'записей')).toBe('записей')
    expect(getPluralForm(15, 'запись', 'записи', 'записей')).toBe('записей')
    expect(getPluralForm(19, 'запись', 'записи', 'записей')).toBe('записей')
  })

  it('returns "one" form for 21', () => {
    expect(getPluralForm(21, 'запись', 'записи', 'записей')).toBe('запись')
  })

  it('returns "few" form for 22-24', () => {
    expect(getPluralForm(22, 'запись', 'записи', 'записей')).toBe('записи')
    expect(getPluralForm(23, 'запись', 'записи', 'записей')).toBe('записи')
    expect(getPluralForm(24, 'запись', 'записи', 'записей')).toBe('записи')
  })

  it('returns "many" form for 0', () => {
    expect(getPluralForm(0, 'запись', 'записи', 'записей')).toBe('записей')
  })

  it('returns "many" form for 100+', () => {
    expect(getPluralForm(100, 'запись', 'записи', 'записей')).toBe('записей')
    expect(getPluralForm(111, 'запись', 'записи', 'записей')).toBe('записей')
    expect(getPluralForm(121, 'запись', 'записи', 'записей')).toBe('запись')
  })
})

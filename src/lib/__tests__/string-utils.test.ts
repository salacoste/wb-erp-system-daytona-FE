import { describe, expect, it } from 'vitest'

import { truncateQuery } from '@/lib/string-utils'

describe('truncateQuery', () => {
  it('returns short string unchanged', () => expect(truncateQuery('hello')).toBe('hello'))
  it('returns string at max length unchanged', () =>
    expect(truncateQuery('a'.repeat(24))).toBe('a'.repeat(24)))
  it('truncates and adds ellipsis beyond max', () =>
    expect(truncateQuery('a'.repeat(30), 24)).toBe('a'.repeat(24) + '…'))
  it('respects custom maxChars', () => expect(truncateQuery('abcdef', 3)).toBe('abc…'))
  it('handles empty string', () => expect(truncateQuery('')).toBe(''))
  it('handles Cyrillic correctly (multi-byte)', () => {
    const cyrillic = 'ПриветМирТестДлиннаяСтрока'
    const result = truncateQuery(cyrillic, 10)
    expect(Array.from(result)).toHaveLength(11) // 10 chars + ellipsis
  })
  it('handles emoji correctly (code-point aware)', () => {
    const emoji = '🎉🎊🎈🎁🎀🎂🍰🍦🧁🍪🍮🍬🍭🍫'
    const result = truncateQuery(emoji, 5)
    expect(Array.from(result)).toHaveLength(6) // 5 emoji + ellipsis
  })
})

import { describe, expect, it } from 'vitest'
import { createSearchRegex } from '../storage-sku-table-utils'

describe('createSearchRegex', () => {
  it('returns null for a blank search', () => {
    expect(createSearchRegex('   ')).toBeNull()
  })

  it('matches regex metacharacters as literal text', () => {
    const pattern = createSearchRegex('SKU[1].*')

    expect(pattern?.test('prefix sku[1].* suffix')).toBe(true)
    expect(pattern?.test('SKU1anything')).toBe(false)
  })
})

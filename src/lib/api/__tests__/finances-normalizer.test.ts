/**
 * NEW-7 — Finances normalizer boundary tests.
 *
 * Covers nullability (AP#8: money → null, not 0), case/variant coercion, and
 * malformed-body guards (non-array bodies → empty array, non-string fields →
 * undefined). Mirrors the liquidity normalizer test discipline.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeAccountBalance,
  normalizeDocumentCategories,
  normalizeDocuments,
  normalizeDocumentDownload,
  normalizeDocumentCategory,
  normalizeDocumentItem,
} from '../finances-normalizer'

describe('normalizeAccountBalance', () => {
  it('preserves a populated balance (camelCase, money as-is)', () => {
    const out = normalizeAccountBalance({ currency: 'RUB', current: 100, forWithdraw: 50 })
    expect(out).toEqual({ currency: 'RUB', current: 100, forWithdraw: 50 })
  })

  it('preserves null money fields (AP#8 — never collapses to 0)', () => {
    const out = normalizeAccountBalance({ currency: null, current: null, forWithdraw: null })
    expect(out).toEqual({ currency: null, current: null, forWithdraw: null })
  })

  it('coerces missing fields to null (defensive)', () => {
    const out = normalizeAccountBalance({})
    expect(out).toEqual({ currency: null, current: null, forWithdraw: null })
  })

  it('rejects non-number money (NaN string → null, not NaN)', () => {
    const out = normalizeAccountBalance({ current: 'abc', forWithdraw: 'x' })
    expect(out.current).toBeNull()
    expect(out.forWithdraw).toBeNull()
  })

  it('reads forWithdraw from the BE camelCase key (not snake_case for_withdraw)', () => {
    const out = normalizeAccountBalance({ forWithdraw: 42 })
    expect(out.forWithdraw).toBe(42)
  })

  it('handles a non-object body defensively', () => {
    expect(normalizeAccountBalance(null)).toEqual({
      currency: null,
      current: null,
      forWithdraw: null,
    })
    expect(normalizeAccountBalance('oops')).toEqual({
      currency: null,
      current: null,
      forWithdraw: null,
    })
  })
})

describe('normalizeDocumentCategories', () => {
  it('maps a populated category array', () => {
    const out = normalizeDocumentCategories([{ name: 'PA', title: 'ПА' }])
    expect(out).toEqual([{ name: 'PA', title: 'ПА' }])
  })

  it('returns [] for a non-array body (malformed guard)', () => {
    expect(normalizeDocumentCategories(null)).toEqual([])
    expect(normalizeDocumentCategories({ categories: [] })).toEqual([])
    expect(normalizeDocumentCategories('oops')).toEqual([])
  })

  it('coerces non-string fields to undefined (defensive)', () => {
    const out = normalizeDocumentCategories([{ name: 123, title: null }])
    expect(out).toEqual([{ name: undefined, title: undefined }])
  })
})

describe('normalizeDocumentCategory (single)', () => {
  it('drops non-string name/title', () => {
    expect(normalizeDocumentCategory({ name: 1, title: {} })).toEqual({
      name: undefined,
      title: undefined,
    })
  })
})

describe('normalizeDocuments', () => {
  it('maps a populated documents array (camelCase)', () => {
    const out = normalizeDocuments([
      {
        serviceName: 'svc/a',
        name: 'Doc A',
        category: 'ПА',
        extensions: ['pdf', 'xlsx'],
        creationTime: '2026-01-01T00:00:00Z',
        viewed: true,
      },
    ])
    expect(out[0]).toEqual({
      serviceName: 'svc/a',
      name: 'Doc A',
      category: 'ПА',
      extensions: ['pdf', 'xlsx'],
      creationTime: '2026-01-01T00:00:00Z',
      viewed: true,
    })
  })

  it('returns [] for a non-array body (malformed guard)', () => {
    expect(normalizeDocuments(null)).toEqual([])
    expect(normalizeDocuments({ documents: [] })).toEqual([])
  })

  it('drops non-string entries from extensions and returns undefined when empty', () => {
    const out = normalizeDocuments([{ extensions: ['pdf', 123, null] }])
    expect(out[0].extensions).toEqual(['pdf'])
    const empty = normalizeDocuments([{ extensions: [123, null] }])
    expect(empty[0].extensions).toBeUndefined()
  })

  it('coerces a non-boolean viewed to undefined', () => {
    const out = normalizeDocuments([{ viewed: 'yes' }])
    expect(out[0].viewed).toBeUndefined()
  })
})

describe('normalizeDocumentItem (single)', () => {
  it('maps all fields and guards optionals', () => {
    expect(normalizeDocumentItem({ serviceName: 's' })).toEqual({
      serviceName: 's',
      name: undefined,
      category: undefined,
      extensions: undefined,
      creationTime: undefined,
      viewed: undefined,
    })
  })
})

describe('normalizeDocumentDownload', () => {
  it('preserves a populated download (base64)', () => {
    const out = normalizeDocumentDownload({
      fileName: 'a.pdf',
      extension: 'pdf',
      document: 'AAAA',
    })
    expect(out).toEqual({ fileName: 'a.pdf', extension: 'pdf', document: 'AAAA' })
  })

  it('coerces missing fields to null', () => {
    expect(normalizeDocumentDownload({})).toEqual({
      fileName: null,
      extension: null,
      document: null,
    })
  })

  it('rejects non-string document (defensive)', () => {
    expect(normalizeDocumentDownload({ document: 123 })).toEqual({
      fileName: null,
      extension: null,
      document: null,
    })
  })
})

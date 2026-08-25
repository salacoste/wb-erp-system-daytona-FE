/**
 * brand-share-view-helpers tests — Story 170.4 pure functions
 * (extracted so the View stays under the line cap; no hook mocking needed).
 */
import { describe, it, expect } from 'vitest'
import {
  isInvalidBrandShareRange,
  formatBrandSharePeriodLabel,
  resolveBrandShareCategoryName,
} from '../brand-share-view-helpers'

describe('isInvalidBrandShareRange', () => {
  it('is invalid only when dateFrom is strictly after dateTo', () => {
    expect(isInvalidBrandShareRange({ dateFrom: '2026-07-10', dateTo: '2026-07-01' })).toBe(true)
    expect(isInvalidBrandShareRange({ dateFrom: '2026-07-01', dateTo: '2026-07-01' })).toBe(false)
    expect(isInvalidBrandShareRange({ dateFrom: '2026-07-01', dateTo: '2026-07-10' })).toBe(false)
  })
  it('is never invalid with a missing side (open windows are legal)', () => {
    expect(isInvalidBrandShareRange({ dateFrom: '2026-07-10' })).toBe(false)
    expect(isInvalidBrandShareRange({ dateTo: '2026-07-01' })).toBe(false)
    expect(isInvalidBrandShareRange({})).toBe(false)
  })
})

describe('formatBrandSharePeriodLabel', () => {
  it('formats a full window as «DD.MM.YYYY — DD.MM.YYYY»', () => {
    expect(formatBrandSharePeriodLabel({ dateFrom: '2026-07-01', dateTo: '2026-07-07' })).toBe(
      '01.07.2026 — 07.07.2026'
    )
  })
  it('labels open windows with «с»/«по»', () => {
    expect(formatBrandSharePeriodLabel({ dateFrom: '2026-07-01' })).toBe('с 01.07.2026')
    expect(formatBrandSharePeriodLabel({ dateTo: '2026-07-07' })).toBe('по 07.07.2026')
  })
  it('returns null when empty (caller falls back to «последние 7 дней»)', () => {
    expect(formatBrandSharePeriodLabel({})).toBeNull()
  })
})

describe('resolveBrandShareCategoryName', () => {
  const subjects = [{ parentId: 8555, parentName: 'Отделочные материалы' }]
  it('resolves the selected parentId to its name', () => {
    expect(resolveBrandShareCategoryName(subjects, 8555)).toBe('Отделочные материалы')
  })
  it('returns null for no selection or unknown id (renders «—»)', () => {
    expect(resolveBrandShareCategoryName(subjects, null)).toBeNull()
    expect(resolveBrandShareCategoryName(subjects, 1)).toBeNull()
  })
})

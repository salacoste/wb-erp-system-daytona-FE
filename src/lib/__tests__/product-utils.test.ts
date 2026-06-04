/**
 * Unit tests for product-utils (Story 44.33-FE) — regression coverage added iter-130.
 *
 * Pure null-safe category-hierarchy accessors (no React/IO). Tests pin the implemented contract,
 * including the deliberate `||` vs `??` fallback nuances (empty-string subject_name vs id 0).
 */

import { describe, it, expect } from 'vitest'
import {
  getCategoryDisplayName,
  getCategoryName,
  getParentCategoryName,
  getCategoryId,
} from '@/lib/product-utils'
import type { CategoryHierarchy } from '@/types/product'

const full: CategoryHierarchy = {
  subject_id: 105,
  subject_name: 'Платья',
  parent_id: 10,
  parent_name: 'Женская одежда',
}
const topLevel: CategoryHierarchy = {
  subject_id: 201,
  subject_name: 'Электроника',
  parent_id: null,
  parent_name: null,
}

describe('getCategoryDisplayName', () => {
  it('renders "Parent → Subject" when parent_name is present', () => {
    expect(getCategoryDisplayName(full)).toBe('Женская одежда → Платья')
  })

  it('renders just the subject when parent_name is null (top-level)', () => {
    expect(getCategoryDisplayName(topLevel)).toBe('Электроника')
  })

  it('returns "Без категории" for null / undefined', () => {
    expect(getCategoryDisplayName(null)).toBe('Без категории')
    expect(getCategoryDisplayName(undefined)).toBe('Без категории')
  })
})

describe('getCategoryName', () => {
  it('returns the subject_name', () => {
    expect(getCategoryName(full)).toBe('Платья')
  })

  it('returns "Без категории" for null / undefined', () => {
    expect(getCategoryName(null)).toBe('Без категории')
    expect(getCategoryName(undefined)).toBe('Без категории')
  })

  it('falls back to "Без категории" for an empty subject_name (|| semantics)', () => {
    expect(getCategoryName({ ...full, subject_name: '' })).toBe('Без категории')
  })
})

describe('getParentCategoryName', () => {
  it('returns the parent_name when present', () => {
    expect(getParentCategoryName(full)).toBe('Женская одежда')
  })

  it('returns "—" when parent_name is null, or for null / undefined input', () => {
    expect(getParentCategoryName(topLevel)).toBe('—')
    expect(getParentCategoryName(null)).toBe('—')
    expect(getParentCategoryName(undefined)).toBe('—')
  })
})

describe('getCategoryId', () => {
  it('returns the subject_id', () => {
    expect(getCategoryId(full)).toBe(105)
  })

  it('returns null for null / undefined', () => {
    expect(getCategoryId(null)).toBeNull()
    expect(getCategoryId(undefined)).toBeNull()
  })

  it('passes through subject_id 0 (?? semantics — only null/undefined fall back)', () => {
    expect(getCategoryId({ ...full, subject_id: 0 })).toBe(0)
  })
})

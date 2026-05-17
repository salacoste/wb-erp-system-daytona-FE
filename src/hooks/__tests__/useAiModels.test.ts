/**
 * useAiModels — cabinet-isolation regression tests.
 * Story 109.3-FE: asserts different cabinetIds produce different queryKeys
 * (prevents cross-cabinet cache collision — cabinet-isolation discipline, Story 97.5-FE).
 */
import { describe, it, expect } from 'vitest'
import { aiModelsKeys } from '../useAiModels'

describe('aiModelsKeys', () => {
  it('different cabinetIds produce DIFFERENT list keys (no cache collision)', () => {
    const keyA = aiModelsKeys.list('cab-A')
    const keyB = aiModelsKeys.list('cab-B')
    expect(keyA).not.toEqual(keyB)
  })

  it('null cabinetId produces a key with null (unauthenticated state isolated)', () => {
    const key = aiModelsKeys.list(null)
    expect(key).toContain(null)
  })

  it('same cabinetId produces identical keys (cache reuse)', () => {
    const keyA = aiModelsKeys.list('cab-123')
    const keyB = aiModelsKeys.list('cab-123')
    expect(keyA).toEqual(keyB)
  })
})

/**
 * Consumer-wiring proof for acquiring-empty fixture factories.
 * Story 96.9-FE 3rd-pass review fix M3-3 (2026-05-08).
 *
 * Pattern 3 § "Testing requirement": shared-fixture module MUST have ≥1 test
 * consuming it in the first downstream test file (proves the wiring).
 *
 * Context: grep showed `emptyAcquiringDetailResponse`, `emptyAcquiringReport`,
 * and `emptyAcquiringTransaction` had ZERO consumers across src/ and e2e/.
 * Only `emptyAcquiringListResponse` was consumed by AcquiringPageContent.test.tsx.
 * AC-1 of Story 96.9-FE explicitly required all 4 factories — so this file
 * adds token consumer tests rather than deleting the unused factories.
 */

import { describe, it, expect } from 'vitest'
import {
  emptyAcquiringDetailResponse,
  emptyAcquiringListResponse,
  emptyAcquiringReport,
  emptyAcquiringTransaction,
} from '../acquiring-empty'

describe('acquiring-empty fixtures (Story 96.9-FE M3-3 — Pattern 3 wiring proof)', () => {
  it('emptyAcquiringListResponse: data=[], cachedAt=""', () => {
    expect(emptyAcquiringListResponse()).toEqual({ data: [], cachedAt: '' })
  })

  it('emptyAcquiringDetailResponse: data=[], cachedAt=""', () => {
    expect(emptyAcquiringDetailResponse()).toEqual({ data: [], cachedAt: '' })
  })

  it('emptyAcquiringReport: money fields null, IDs/strings zero/empty', () => {
    const r = emptyAcquiringReport()
    expect(r.acquiringFeeSum).toBeNull()
    expect(r.acquiringFeeVatSum).toBeNull()
    expect(r.reportId).toBe(0)
    expect(r.sellerFinanceName).toBe('')
  })

  it('emptyAcquiringTransaction: money fields null, IDs zero, strings empty', () => {
    const t = emptyAcquiringTransaction()
    expect(t.retailAmount).toBeNull()
    expect(t.acquiringFee).toBeNull()
    expect(t.acquiringFeeVat).toBeNull()
    expect(t.rrdId).toBe(0)
    expect(t.nmId).toBe(0)
    expect(t.acqDate).toBe('')
  })
})

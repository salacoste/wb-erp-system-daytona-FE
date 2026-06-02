/**
 * WB Status config — Validation F-11
 * Live backend emits `ready_for_pickup` (~11% of orders) and `declined_by_client`
 * (~2%) which were absent from WB_STATUS_CONFIG → rendered as raw machine codes.
 * These tests pin the resolution + guard the unknown-code fallback.
 */

import { describe, it, expect } from 'vitest'
import { getWbStatusConfig, getWbStatusLabel } from '../wb-status-helpers'
import { isValidWbStatus } from '@/types/orders-guards'

describe('WB status config — F-11 live statuses', () => {
  it('ready_for_pickup resolves to a real delivery config (not raw-code fallback)', () => {
    const c = getWbStatusConfig('ready_for_pickup')
    expect(c.label).toBe('Готов к выдаче')
    expect(c.labelEn).toBe('Ready for pickup')
    expect(c.category).toBe('delivery')
    expect(c.isFinal).toBe(false)
  })

  it('declined_by_client resolves to a cancellation/refusal config (non-final per backend)', () => {
    const c = getWbStatusConfig('declined_by_client')
    expect(c.label).toBe('Отказ при получении')
    expect(c.labelEn).toBe('Declined by client')
    expect(c.category).toBe('cancellation')
    // review F3: backend FINAL_WB_STATUSES excludes declined_by_client → FE not final
    expect(c.isFinal).toBe(false)
  })

  it('the two F-11 labels are distinct from canceled_by_client (not conflated)', () => {
    expect(getWbStatusLabel('declined_by_client')).not.toBe(getWbStatusLabel('canceled_by_client'))
    expect(getWbStatusLabel('canceled_by_client')).toBe('Отменён клиентом')
  })

  it('genuinely unknown codes still fall back to the raw code (regression guard)', () => {
    expect(getWbStatusLabel('totally_made_up_status')).toBe('totally_made_up_status')
  })

  // review F1/F2: the runtime guard must accept the new statuses (it was the
  // second hardcoded enumeration that F-11 originally left stale).
  it('isValidWbStatus accepts the new F-11 statuses', () => {
    expect(isValidWbStatus('ready_for_pickup')).toBe(true)
    expect(isValidWbStatus('declined_by_client')).toBe(true)
    expect(isValidWbStatus('canceled_by_client')).toBe(true)
    expect(isValidWbStatus('not_a_status')).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import {
  readHistoricalSppEnabled,
  selectHistoricalSppValues,
  setHistoricalSppSearchParam,
} from '../historical-spp-state'

describe('historical SPP URL state', () => {
  it('defaults historical financial data to enabled', () => {
    expect(readHistoricalSppEnabled(new URLSearchParams())).toBe(true)
    expect(readHistoricalSppEnabled(new URLSearchParams('include_cogs=true'))).toBe(true)
  })

  it('preserves an explicit disabled state in the URL', () => {
    expect(readHistoricalSppEnabled(new URLSearchParams('include_cogs=false'))).toBe(false)
  })

  it('updates only include_cogs and preserves unrelated SKU filters', () => {
    const existing = new URLSearchParams('weekStart=2026-W30&weekEnd=2026-W31&nm_id=123')

    expect(setHistoricalSppSearchParam(existing, false).toString()).toBe(
      'weekStart=2026-W30&weekEnd=2026-W31&nm_id=123&include_cogs=false'
    )
    expect(setHistoricalSppSearchParam(existing, true).toString()).toBe(
      'weekStart=2026-W30&weekEnd=2026-W31&nm_id=123&include_cogs=true'
    )
    expect(existing.has('include_cogs')).toBe(false)
  })

  it('scrubs stale enabled-cache values while disabled and preserves explicit zero when enabled', () => {
    expect(selectHistoricalSppValues({ spp_rub: 125.5, spp_pct: 12.55 }, false)).toEqual({
      sppRub: null,
      sppPct: null,
    })
    expect(selectHistoricalSppValues({ spp_rub: 0, spp_pct: 0 }, true)).toEqual({
      sppRub: 0,
      sppPct: 0,
    })
  })
})

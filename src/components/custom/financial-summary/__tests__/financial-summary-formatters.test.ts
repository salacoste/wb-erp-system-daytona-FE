/**
 * Russian-locale guard for pctOfTurnover (financial-summary P&L "% of turnover" column).
 *
 * Regression fix (2026-06-04): rendered dot-locale "12.3%" via `.toFixed(1) + '%'` — no comma
 * decimal, no mandatory NBSP before "%". The Russian-locale rule requires "12,3 %" (comma +
 * U+00A0). check:locale-percent counted the dot-locale form in its baseline but never verified
 * the rendered string, so it drifted untested. These tests lock NBSP + comma + the em-dash guard.
 */

import { describe, it, expect } from 'vitest'
import { pctOfTurnover } from '../financial-summary-formatters'

const NBSP = ' '

describe('pctOfTurnover — Russian locale', () => {
  it('renders comma decimal + NBSP before "%", never dot-locale', () => {
    const out = pctOfTurnover(123, 1000) // 12.3%
    expect(out).toBe(`12,3${NBSP}%`)
    expect(out).not.toMatch(/12\.3/) // never dot decimal
    expect(out).not.toMatch(/12,3%/) // old no-NBSP form must be gone
  })

  it('keeps exactly 1 decimal place (matches the previous .toFixed(1))', () => {
    expect(pctOfTurnover(500, 1000)).toBe(`50,0${NBSP}%`) // whole value still shows ",0"
    expect(pctOfTurnover(1, 3)).toBe(`33,3${NBSP}%`) // 33.333… → 33,3
  })

  it('renders the em dash when base is non-positive (unknown ratio, anti-pattern #8)', () => {
    expect(pctOfTurnover(100, 0)).toBe('—')
    expect(pctOfTurnover(100, -50)).toBe('—')
  })

  it('handles value > base (over 100%) and zero numerator', () => {
    expect(pctOfTurnover(1500, 1000)).toBe(`150,0${NBSP}%`)
    expect(pctOfTurnover(0, 1000)).toBe(`0,0${NBSP}%`)
  })

  it('renders the minus sign for negative value (expense credit/refund row)', () => {
    // base > 0 with value < 0 occurs for WB adjustment rows (e.g. "Корректировка ВВ")
    expect(pctOfTurnover(-50, 1000)).toBe(`-5,0${NBSP}%`)
  })
})

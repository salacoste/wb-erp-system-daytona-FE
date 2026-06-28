/**
 * Tests for the persona-preset extension of useDashboardWidgetsStore (TZ-4):
 * applyPersona, persona persistence, reset clears persona, backward-compat with the
 * pre-TZ-4 storage format (no persona field).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useDashboardWidgetsStore } from '../dashboardWidgetsStore'
import { HIDDEN_BY_PERSONA, type Persona } from '../persona-presets'

const STORAGE_KEY = 'wb-repricer-dashboard-widgets'

describe('useDashboardWidgetsStore — persona presets (TZ-4)', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    // Prime a truly fresh state (persona null) — resetAll() intentionally sets Owner, so
    // setState directly to test the "no persona yet" first-load path.
    useDashboardWidgetsStore.setState({ persona: null })
  })

  it('persona is null by default (no persisted value)', () => {
    expect(useDashboardWidgetsStore.getState().persona).toBeNull()
  })

  it('applyPersona sets the persona field', () => {
    useDashboardWidgetsStore.getState().applyPersona('Ops')
    expect(useDashboardWidgetsStore.getState().persona).toBe('Ops')
  })

  it('applyPersona hides exactly that persona hidden widgets (keeps the rest visible)', () => {
    useDashboardWidgetsStore.getState().applyPersona('Ops')
    const { visibleWidgets } = useDashboardWidgetsStore.getState()
    for (const id of HIDDEN_BY_PERSONA.Ops) {
      expect(visibleWidgets[id]).toBe(false)
    }
    // A widget NOT in the hidden set stays visible
    expect(visibleWidgets.orders).toBe(true)
  })

  it('applyPersona Owner hides nothing (all visible)', () => {
    useDashboardWidgetsStore.getState().applyPersona('Owner')
    const { visibleWidgets } = useDashboardWidgetsStore.getState()
    expect(Object.values(visibleWidgets).every(Boolean)).toBe(true)
  })

  it('applyPersona persists visibleWidgets + persona to localStorage', () => {
    useDashboardWidgetsStore.getState().applyPersona('CFO')
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!) as {
      state: { visibleWidgets: Record<string, boolean>; persona: Persona }
    }
    expect(parsed.state.persona).toBe('CFO')
    for (const id of HIDDEN_BY_PERSONA.CFO) {
      expect(parsed.state.visibleWidgets[id]).toBe(false)
    }
  })

  it('resetAll restores the all-visible Owner persona (not null — avoids role-default re-clobber)', () => {
    useDashboardWidgetsStore.getState().applyPersona('Ops')
    useDashboardWidgetsStore.getState().resetAll()
    const state = useDashboardWidgetsStore.getState()
    expect(state.persona).toBe('Owner')
    expect(Object.values(state.visibleWidgets).every(Boolean)).toBe(true)
  })

  it('rejects a corrupted persisted persona at the storage boundary (read as null)', () => {
    const allTrue = {
      orders: true,
      sales: true,
      commissions: true,
      logistics: true,
      payout: true,
      storage: true,
      cogs: true,
      advertising: true,
      grossProfit: true,
      margin: true,
      buyoutRate: true,
      averages: true,
      roi: true,
      returns: true,
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { visibleWidgets: allTrue, persona: 'Garbage' } })
    )
    expect(useDashboardWidgetsStore.getState().persona).toBeNull()
  })

  it('re-hydrates a persisted persona from localStorage on a cross-tab storage event', () => {
    const persisted = {
      state: {
        visibleWidgets: {
          orders: true,
          sales: true,
          commissions: false,
          logistics: true,
          payout: true,
          storage: true,
          cogs: true,
          advertising: true,
          grossProfit: true,
          margin: true,
          buyoutRate: true,
          averages: true,
          roi: true,
          returns: true,
        },
        persona: 'Ops' as Persona,
      },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
    // A write in another tab fires a 'storage' event in this tab.
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))
    const { persona, visibleWidgets } = useDashboardWidgetsStore.getState()
    expect(persona).toBe('Ops')
    expect(visibleWidgets.commissions).toBe(false)
  })

  it('backward-compat: pre-TZ-4 storage without persona → persona null, widgets restored (on cross-tab storage event)', () => {
    const legacy = {
      state: {
        visibleWidgets: {
          orders: false,
          sales: true,
          commissions: true,
          logistics: true,
          payout: true,
          storage: true,
          cogs: true,
          advertising: true,
          grossProfit: true,
          margin: true,
          buyoutRate: true,
          averages: true,
          roi: true,
          returns: true,
        },
      },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy))
    // A write in another tab fires a 'storage' event in this tab.
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))
    const { persona, visibleWidgets } = useDashboardWidgetsStore.getState()
    expect(persona).toBeNull()
    expect(visibleWidgets.orders).toBe(false)
  })
})

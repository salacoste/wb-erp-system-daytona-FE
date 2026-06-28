/**
 * Tests for useDashboardWidgetsStore
 * Story 65.8: Widget visibility toggles, minimum enforcement, reset
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useDashboardWidgetsStore, WIDGET_LABELS, type WidgetId } from '../dashboardWidgetsStore'

describe('useDashboardWidgetsStore', () => {
  beforeEach(() => {
    // Reset to default state and clear localStorage
    localStorage.removeItem('wb-repricer-dashboard-widgets')
    useDashboardWidgetsStore.getState().resetAll()
  })

  it('has all widgets visible by default', () => {
    const { visibleWidgets } = useDashboardWidgetsStore.getState()
    const widgetIds = Object.keys(visibleWidgets) as WidgetId[]

    expect(widgetIds.length).toBe(Object.keys(WIDGET_LABELS).length)
    widgetIds.forEach(id => {
      expect(visibleWidgets[id]).toBe(true)
    })
  })

  it('toggles a widget off', () => {
    useDashboardWidgetsStore.getState().toggleWidget('orders')

    const { visibleWidgets } = useDashboardWidgetsStore.getState()
    expect(visibleWidgets.orders).toBe(false)
  })

  it('toggles a widget back on', () => {
    useDashboardWidgetsStore.getState().toggleWidget('orders')
    useDashboardWidgetsStore.getState().toggleWidget('orders')

    const { visibleWidgets } = useDashboardWidgetsStore.getState()
    expect(visibleWidgets.orders).toBe(true)
  })

  it('prevents toggling below minimum visible widgets (3)', () => {
    // Toggle off all but 3 widgets
    const allIds = Object.keys(WIDGET_LABELS) as WidgetId[]
    const idsToToggleOff = allIds.slice(3) // keep first 3 visible

    idsToToggleOff.forEach(id => {
      useDashboardWidgetsStore.getState().toggleWidget(id)
    })

    // At this point exactly 3 are visible. Trying to toggle another should be blocked.
    const beforeToggle = useDashboardWidgetsStore.getState().visibleWidgets
    useDashboardWidgetsStore.getState().toggleWidget(allIds[0])

    const afterToggle = useDashboardWidgetsStore.getState().visibleWidgets
    // The widget should remain visible (toggle was blocked)
    expect(afterToggle[allIds[0]]).toBe(beforeToggle[allIds[0]])
  })

  it('resets all widgets to visible', () => {
    // Toggle some off first
    useDashboardWidgetsStore.getState().toggleWidget('orders')
    useDashboardWidgetsStore.getState().toggleWidget('sales')

    useDashboardWidgetsStore.getState().resetAll()

    const { visibleWidgets } = useDashboardWidgetsStore.getState()
    expect(visibleWidgets.orders).toBe(true)
    expect(visibleWidgets.sales).toBe(true)
  })

  it('persists widget state to localStorage', () => {
    useDashboardWidgetsStore.getState().toggleWidget('cogs')

    const raw = localStorage.getItem('wb-repricer-dashboard-widgets')
    expect(raw).not.toBeNull()

    const parsed = JSON.parse(raw!) as {
      state: { visibleWidgets: Record<string, boolean> }
    }
    expect(parsed.state.visibleWidgets.cogs).toBe(false)
  })

  it('re-hydrates from localStorage on a cross-tab storage event', () => {
    // Another tab writes localStorage with orders off.
    const customState = {
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
    localStorage.setItem('wb-repricer-dashboard-widgets', JSON.stringify(customState))

    // A write in another tab fires a 'storage' event in this tab.
    window.dispatchEvent(new StorageEvent('storage', { key: 'wb-repricer-dashboard-widgets' }))

    const { visibleWidgets } = useDashboardWidgetsStore.getState()
    expect(visibleWidgets.orders).toBe(false)
  })

  it('defends against a corrupt all-false persisted state (resets to the all-visible default)', () => {
    // A below-minimum state a user could never reach via the UI (e.g. left by a
    // prior bug) arrives via a cross-tab write.
    const corrupt = {
      state: {
        visibleWidgets: {
          orders: false,
          sales: false,
          commissions: false,
          logistics: false,
          payout: false,
          storage: false,
          cogs: false,
          advertising: false,
          grossProfit: false,
          margin: false,
          buyoutRate: false,
          averages: false,
          roi: false,
          returns: false,
        },
        persona: null,
      },
    }
    localStorage.setItem('wb-repricer-dashboard-widgets', JSON.stringify(corrupt))
    window.dispatchEvent(new StorageEvent('storage', { key: 'wb-repricer-dashboard-widgets' }))

    // The corrupt below-minimum state is rejected → all-visible default applied
    // (so the widget-settings toggles never render all-off).
    const { visibleWidgets } = useDashboardWidgetsStore.getState()
    expect(Object.values(visibleWidgets).filter(Boolean).length).toBeGreaterThanOrEqual(3)
    expect(visibleWidgets.orders).toBe(true)
  })

  it('WIDGET_LABELS has a label for every WidgetId', () => {
    const allIds = Object.keys(WIDGET_LABELS) as WidgetId[]
    allIds.forEach(id => {
      expect(typeof WIDGET_LABELS[id]).toBe('string')
      expect(WIDGET_LABELS[id].length).toBeGreaterThan(0)
    })
  })
})

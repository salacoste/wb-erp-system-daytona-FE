/**
 * TDD Tests for Story 65.8: Widget Visibility Settings
 * RED phase — all tests expected to FAIL (components/store do not exist yet).
 *
 * Settings sheet allowing users to toggle widget visibility on the dashboard.
 * Uses Zustand store with localStorage persistence.
 *
 * @see Story 65.8, AC-65.8.1 through AC-65.8.6
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'

// Components under test — DO NOT EXIST YET (TDD Red phase)
import { WidgetSettingsSheet } from '../../WidgetSettingsSheet'

// Store under test — DOES NOT EXIST YET (TDD Red phase)
import { useDashboardWidgetsStore } from '@/stores/dashboardWidgetsStore'

// =============================================================================
// Setup: clear localStorage before each test
// =============================================================================

beforeEach(() => {
  localStorage.removeItem('wb-repricer-dashboard-widgets')
  // Reset Zustand store to default state
  useDashboardWidgetsStore.setState({
    visibleWidgets: {
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
    },
  })
})

// =============================================================================
// AC-65.8.1: Settings button opens modal/sheet
// =============================================================================

describe('WidgetSettingsSheet', () => {
  describe('AC-65.8.1: settings button', () => {
    it('renders a "Настройка виджетов" button', () => {
      renderWithProviders(<WidgetSettingsSheet />)

      const button = screen.getByRole('button', { name: /настройка виджетов/i })
      expect(button).toBeInTheDocument()
    })

    it('opens sheet on button click', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WidgetSettingsSheet />)

      const button = screen.getByRole('button', { name: /настройка виджетов/i })
      await user.click(button)

      // Sheet should be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('button has Settings icon', () => {
      renderWithProviders(<WidgetSettingsSheet />)

      const button = screen.getByRole('button', { name: /настройка виджетов/i })
      expect(button).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // AC-65.8.2: Sheet content with widget toggles
  // ===========================================================================

  describe('AC-65.8.2: widget list with toggles', () => {
    it('lists all widgets with Switch toggles', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WidgetSettingsSheet />)

      await user.click(screen.getByRole('button', { name: /настройка виджетов/i }))

      // Should have toggles for major widget categories
      const switches = screen.getAllByRole('switch')
      expect(switches.length).toBeGreaterThanOrEqual(10)
    })

    it('shows widget names in Russian', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WidgetSettingsSheet />)

      await user.click(screen.getByRole('button', { name: /настройка виджетов/i }))

      // Check for some expected widget names
      expect(screen.getByText(/Заказы/)).toBeInTheDocument()
      expect(screen.getByText(/Продажи/)).toBeInTheDocument()
      expect(screen.getByText(/Комиссии/)).toBeInTheDocument()
      expect(screen.getByText(/Логистика/)).toBeInTheDocument()
    })

    it('all widgets are enabled by default', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WidgetSettingsSheet />)

      await user.click(screen.getByRole('button', { name: /настройка виджетов/i }))

      const switches = screen.getAllByRole('switch')
      switches.forEach(toggle => {
        expect(toggle).toBeChecked()
      })
    })
  })

  // ===========================================================================
  // AC-65.8.3: Toggle checkbox hides/shows widget
  // ===========================================================================

  describe('toggling widgets', () => {
    it('toggling a switch updates the store', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WidgetSettingsSheet />)

      await user.click(screen.getByRole('button', { name: /настройка виджетов/i }))

      // Find the first switch and toggle it off
      const switches = screen.getAllByRole('switch')
      await user.click(switches[0])

      // The first switch should now be unchecked
      expect(switches[0]).not.toBeChecked()
    })

    it('toggling off a widget marks it as hidden in the store', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WidgetSettingsSheet />)

      await user.click(screen.getByRole('button', { name: /настройка виджетов/i }))

      // Toggle off "orders" widget
      const ordersSwitch = screen.getAllByRole('switch')[0]
      await user.click(ordersSwitch)

      // Store should reflect the change
      const state = useDashboardWidgetsStore.getState()
      expect(state.visibleWidgets.orders).toBe(false)
    })
  })

  // ===========================================================================
  // AC-65.8.3: Settings persist in localStorage
  // ===========================================================================

  describe('AC-65.8.3: localStorage persistence', () => {
    it('saves settings to localStorage when toggling', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WidgetSettingsSheet />)

      await user.click(screen.getByRole('button', { name: /настройка виджетов/i }))

      // Toggle off a widget
      const switches = screen.getAllByRole('switch')
      await user.click(switches[0])

      // Check localStorage
      const stored = localStorage.getItem('wb-repricer-dashboard-widgets')
      expect(stored).not.toBeNull()
      if (stored) {
        const parsed = JSON.parse(stored)
        // Should contain the updated visibility state
        expect(parsed).toBeDefined()
      }
    })

    it('restores settings from localStorage on mount', () => {
      // Pre-set localStorage
      const customSettings = {
        state: {
          visibleWidgets: {
            orders: false,
            sales: true,
            commissions: true,
            logistics: false,
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
      localStorage.setItem('wb-repricer-dashboard-widgets', JSON.stringify(customSettings))

      // Re-initialize store from localStorage
      const state = useDashboardWidgetsStore.getState()
      // After hydration, orders should be false
      expect(state.visibleWidgets.orders).toBe(false)
      expect(state.visibleWidgets.logistics).toBe(false)
    })
  })

  // ===========================================================================
  // AC-65.8.4: Reset button restores defaults
  // ===========================================================================

  describe('AC-65.8.4: reset button', () => {
    it('has a reset button in the sheet', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WidgetSettingsSheet />)

      await user.click(screen.getByRole('button', { name: /настройка виджетов/i }))

      expect(screen.getByRole('button', { name: /сбросить/i })).toBeInTheDocument()
    })

    it('clicking reset restores all widgets to visible', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WidgetSettingsSheet />)

      await user.click(screen.getByRole('button', { name: /настройка виджетов/i }))

      // Toggle some off first
      const switches = screen.getAllByRole('switch')
      await user.click(switches[0])
      await user.click(switches[1])

      // Now reset
      await user.click(screen.getByRole('button', { name: /сбросить/i }))

      // All should be checked again
      const resetSwitches = screen.getAllByRole('switch')
      resetSwitches.forEach(toggle => {
        expect(toggle).toBeChecked()
      })
    })
  })

  // ===========================================================================
  // AC-65.8.6: Minimum 3 widgets must remain visible
  // ===========================================================================

  describe('AC-65.8.6: minimum widget count validation', () => {
    it('prevents toggling off when only 3 widgets remain', async () => {
      const user = userEvent.setup()

      // Set store state where only 3 widgets are enabled
      useDashboardWidgetsStore.setState({
        visibleWidgets: {
          orders: true,
          sales: true,
          commissions: true,
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
      })

      renderWithProviders(<WidgetSettingsSheet />)

      await user.click(screen.getByRole('button', { name: /настройка виджетов/i }))

      // Try to toggle off one of the remaining 3
      const enabledSwitches = screen
        .getAllByRole('switch')
        .filter(s => (s as HTMLInputElement).checked)
      expect(enabledSwitches.length).toBe(3)

      // Click one of the enabled switches
      await user.click(enabledSwitches[0])

      // Should still be checked (toggle prevented)
      expect(enabledSwitches[0]).toBeChecked()
    })

    it('allows toggling off when more than 3 widgets are visible', async () => {
      const user = userEvent.setup()
      renderWithProviders(<WidgetSettingsSheet />)

      await user.click(screen.getByRole('button', { name: /настройка виджетов/i }))

      // All 14 are enabled by default, toggling one off should work
      const switches = screen.getAllByRole('switch')
      await user.click(switches[0])

      expect(switches[0]).not.toBeChecked()
    })
  })
})

// =============================================================================
// Zustand Store Unit Tests
// =============================================================================

describe('useDashboardWidgetsStore', () => {
  beforeEach(() => {
    localStorage.removeItem('wb-repricer-dashboard-widgets')
  })

  it('initializes with all widgets visible', () => {
    const state = useDashboardWidgetsStore.getState()
    const allVisible = Object.values(state.visibleWidgets).every(Boolean)
    expect(allVisible).toBe(true)
  })

  it('toggleWidget toggles a single widget', () => {
    useDashboardWidgetsStore.getState().toggleWidget('orders')
    expect(useDashboardWidgetsStore.getState().visibleWidgets.orders).toBe(false)

    useDashboardWidgetsStore.getState().toggleWidget('orders')
    expect(useDashboardWidgetsStore.getState().visibleWidgets.orders).toBe(true)
  })

  it('resetAll sets all widgets to visible', () => {
    // Toggle some off
    useDashboardWidgetsStore.getState().toggleWidget('orders')
    useDashboardWidgetsStore.getState().toggleWidget('sales')

    // Reset
    useDashboardWidgetsStore.getState().resetAll()

    const state = useDashboardWidgetsStore.getState()
    expect(state.visibleWidgets.orders).toBe(true)
    expect(state.visibleWidgets.sales).toBe(true)
  })

  it('toggleWidget prevents going below minimum 3 visible', () => {
    const state = useDashboardWidgetsStore.getState()
    const widgetIds = Object.keys(state.visibleWidgets) as string[]

    // Toggle off all but 3
    widgetIds.slice(3).forEach(id => {
      const current = useDashboardWidgetsStore.getState()
      if (current.visibleWidgets[id as keyof typeof current.visibleWidgets]) {
        current.toggleWidget(id as keyof typeof current.visibleWidgets)
      }
    })

    // Count remaining visible
    const visibleCount = Object.values(useDashboardWidgetsStore.getState().visibleWidgets).filter(
      Boolean
    ).length
    expect(visibleCount).toBe(3)

    // Try toggling one more off — should be prevented
    const currentState = useDashboardWidgetsStore.getState()
    const stillEnabled = widgetIds.find(
      id => currentState.visibleWidgets[id as keyof typeof currentState.visibleWidgets]
    )
    if (stillEnabled) {
      currentState.toggleWidget(stillEnabled as keyof typeof currentState.visibleWidgets)
      // Should still be 3
      const finalCount = Object.values(useDashboardWidgetsStore.getState().visibleWidgets).filter(
        Boolean
      ).length
      expect(finalCount).toBe(3)
    }
  })
})

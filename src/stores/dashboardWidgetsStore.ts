'use client'

/**
 * Zustand store for dashboard widget visibility settings + persona presets (TZ-4).
 * Persists user preferences (visibleWidgets + persona) to localStorage via
 * dashboardWidgetsStorage. Minimum 3 widgets must remain visible at all times.
 *
 * Uses manual localStorage sync with a custom getState override so reading the
 * store always reflects the latest localStorage value.
 *
 * @see Story 65.8: Widget Visibility Settings
 * @see docs/ux/IMPLEMENTATION-TZ.md (TZ-4 persona presets)
 */

import { create } from 'zustand'
import { HIDDEN_BY_PERSONA, type Persona } from './persona-presets'
import {
  countVisible,
  readFromStorage,
  writeToStorage,
  type PersistedState,
} from './dashboardWidgetsStorage'

/** All widget identifiers available on the dashboard */
export type WidgetId =
  | 'orders'
  | 'sales'
  | 'commissions'
  | 'logistics'
  | 'payout'
  | 'storage'
  | 'cogs'
  | 'advertising'
  | 'grossProfit'
  | 'margin'
  | 'buyoutRate'
  | 'averages'
  | 'roi'
  | 'returns'

/** Map of widget ID to Russian display label */
export const WIDGET_LABELS: Record<WidgetId, string> = {
  orders: 'Заказы',
  sales: 'Продажи',
  commissions: 'Комиссии',
  logistics: 'Логистика',
  payout: 'К перечислению',
  storage: 'Хранение',
  cogs: 'Себестоимость',
  advertising: 'Реклама',
  grossProfit: 'Валовая прибыль',
  margin: 'Маржа',
  buyoutRate: 'Процент выкупа',
  averages: 'Средние показатели',
  roi: 'ROI',
  returns: 'Возвраты',
}

export type VisibleWidgets = Record<WidgetId, boolean>

/** Minimum number of widgets that must remain visible */
const MIN_VISIBLE_WIDGETS = 3

/** Default state: all widgets visible */
const DEFAULT_VISIBLE: VisibleWidgets = {
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

/** Resolve a persona's full visibility config: all-visible default minus its hidden set. */
function personaPreset(persona: Persona): VisibleWidgets {
  const widgets = { ...DEFAULT_VISIBLE }
  for (const id of HIDDEN_BY_PERSONA[persona]) {
    widgets[id] = false
  }
  return widgets
}

interface DashboardWidgetsState {
  visibleWidgets: VisibleWidgets
  /** Active persona preset, or null when none applied yet (role default applied by PersonaSelector). */
  persona: Persona | null
  toggleWidget: (id: WidgetId) => void
  applyPersona: (persona: Persona) => void
  resetAll: () => void
}

const initialStored: PersistedState | null = readFromStorage()

export const useDashboardWidgetsStore = create<DashboardWidgetsState>()((set, get) => ({
  visibleWidgets: initialStored?.visibleWidgets ?? { ...DEFAULT_VISIBLE },
  persona: initialStored?.persona ?? null,

  toggleWidget: (id: WidgetId) => {
    const current = get().visibleWidgets
    const isCurrentlyVisible = current[id]

    // Prevent going below minimum visible count
    if (isCurrentlyVisible && countVisible(current) <= MIN_VISIBLE_WIDGETS) {
      return
    }

    const updated = { ...current, [id]: !isCurrentlyVisible }
    writeToStorage(updated, get().persona)
    set({ visibleWidgets: updated })
  },

  applyPersona: (persona: Persona) => {
    const visibleWidgets = personaPreset(persona)
    writeToStorage(visibleWidgets, persona)
    set({ visibleWidgets, persona })
  },

  resetAll: () => {
    // Reset to the all-visible Owner preset (NOT persona null) so PersonaSelector's
    // role-default effect (which only fires when persona===null) doesn't immediately
    // re-apply a persona and undo the user's reset. (TZ-4 review.)
    const defaults = { ...DEFAULT_VISIBLE }
    writeToStorage(defaults, 'Owner')
    set({ visibleWidgets: defaults, persona: 'Owner' })
  },
}))

/**
 * Keep localStorage in sync when state changes externally (e.g., setState).
 */
useDashboardWidgetsStore.subscribe(state => {
  writeToStorage(state.visibleWidgets, state.persona)
})

/**
 * Override getState to hydrate from localStorage first.
 * Ensures external localStorage writes (e.g., from tests or other tabs)
 * are always reflected in the store state.
 */
const originalGetState = useDashboardWidgetsStore.getState.bind(useDashboardWidgetsStore)
useDashboardWidgetsStore.getState = () => {
  const stored = readFromStorage()
  const current = originalGetState()
  if (stored) {
    const merged = { ...current, visibleWidgets: stored.visibleWidgets, persona: stored.persona }
    const widgetsChanged =
      JSON.stringify(current.visibleWidgets) !== JSON.stringify(stored.visibleWidgets)
    const personaChanged = current.persona !== stored.persona
    if (widgetsChanged || personaChanged) {
      useDashboardWidgetsStore.setState({
        visibleWidgets: stored.visibleWidgets,
        persona: stored.persona,
      })
    }
    return merged
  }
  return current
}

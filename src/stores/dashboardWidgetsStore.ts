'use client'

/**
 * Zustand store for dashboard widget visibility settings + persona presets (TZ-4).
 * Persists user preferences (visibleWidgets + persona) to localStorage via
 * dashboardWidgetsStorage. Minimum 3 widgets must remain visible at all times.
 *
 * Persistence: a single `subscribe` writes on every state change, and a
 * `storage`-event listener re-hydrates on cross-tab writes. There is NO
 * `getState` override — overriding it would break useSyncExternalStore's
 * snapshot-stability contract (see the comment below the store).
 *
 * @see Story 65.8: Widget Visibility Settings
 * @see docs/ux/IMPLEMENTATION-TZ.md (TZ-4 persona presets)
 */

import { create } from 'zustand'
import { HIDDEN_BY_PERSONA, type Persona } from './persona-presets'
import {
  STORAGE_KEY,
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

// Single in-memory read at module load. Same-tab external localStorage writes
// are NOT re-hydrated (browsers fire `storage` only for OTHER tabs) — all in-app
// writers must go through the store actions, which persist via the subscribe below.
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

    set({ visibleWidgets: { ...current, [id]: !isCurrentlyVisible } })
  },

  applyPersona: (persona: Persona) => {
    set({ visibleWidgets: personaPreset(persona), persona })
  },

  resetAll: () => {
    // Reset to the all-visible Owner preset (NOT persona null) so PersonaSelector's
    // role-default effect (which only fires when persona===null) doesn't immediately
    // re-apply a persona and undo the user's reset. (TZ-4 review.)
    set({ visibleWidgets: { ...DEFAULT_VISIBLE }, persona: 'Owner' })
  },
}))

/**
 * Persist to localStorage on every state change — the single canonical write path
 * (actions no longer write explicitly, so this covers toggleWidget / applyPersona /
 * resetAll + any external setState).
 */
useDashboardWidgetsStore.subscribe(state => {
  writeToStorage(state.visibleWidgets, state.persona)
})

/**
 * Cross-tab sync: when another tab writes localStorage, re-hydrate this store.
 *
 * This REPLACES a former `getState` override that re-read localStorage on every
 * call and returned a fresh object each time. That violated useSyncExternalStore's
 * snapshot-stability contract (getSnapshot must return a cached, referentially-
 * stable value when nothing changed), and under Concurrent React it caused the
 * widget toggles to not reflect clicks in the browser — while jsdom tests passed
 * (localStorage is empty there, so the override was a no-op). The storage-event
 * listener achieves the same cross-tab reflection without breaking the snapshot.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key !== STORAGE_KEY) return
    const stored = readFromStorage()
    if (stored) {
      useDashboardWidgetsStore.setState({
        visibleWidgets: stored.visibleWidgets,
        persona: stored.persona,
      })
    }
  })
}

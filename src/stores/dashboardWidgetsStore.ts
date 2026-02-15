'use client'

/**
 * Zustand store for dashboard widget visibility settings.
 * Persists user preferences to localStorage.
 * Minimum 3 widgets must remain visible at all times.
 *
 * Uses manual localStorage sync with a custom getState override
 * so reading the store always reflects the latest localStorage value.
 * Format in localStorage: { state: { visibleWidgets: {...} } }
 *
 * @see Story 65.8: Widget Visibility Settings
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-1-2.md
 */

import { create } from 'zustand'

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

/** localStorage key for persistence */
const STORAGE_KEY = 'wb-repricer-dashboard-widgets'

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

function countVisible(widgets: VisibleWidgets): number {
  return Object.values(widgets).filter(Boolean).length
}

/** Read persisted widgets from localStorage */
function readFromStorage(): VisibleWidgets | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      state?: { visibleWidgets?: VisibleWidgets }
    }
    return parsed?.state?.visibleWidgets ?? null
  } catch {
    return null
  }
}

/** Write state to localStorage in persist-compatible format */
function writeToStorage(visibleWidgets: VisibleWidgets): void {
  if (typeof window === 'undefined') return
  try {
    const data = { state: { visibleWidgets } }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Silently ignore storage errors (quota, etc.)
  }
}

interface DashboardWidgetsState {
  visibleWidgets: VisibleWidgets
  toggleWidget: (id: WidgetId) => void
  resetAll: () => void
}

export const useDashboardWidgetsStore = create<DashboardWidgetsState>()((set, get) => ({
  visibleWidgets: readFromStorage() ?? { ...DEFAULT_VISIBLE },

  toggleWidget: (id: WidgetId) => {
    const current = get().visibleWidgets
    const isCurrentlyVisible = current[id]

    // Prevent going below minimum visible count
    if (isCurrentlyVisible && countVisible(current) <= MIN_VISIBLE_WIDGETS) {
      return
    }

    const updated = { ...current, [id]: !isCurrentlyVisible }
    writeToStorage(updated)
    set({ visibleWidgets: updated })
  },

  resetAll: () => {
    const defaults = { ...DEFAULT_VISIBLE }
    writeToStorage(defaults)
    set({ visibleWidgets: defaults })
  },
}))

/**
 * Keep localStorage in sync when state changes externally (e.g., setState).
 */
useDashboardWidgetsStore.subscribe(state => {
  writeToStorage(state.visibleWidgets)
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
    // Merge stored widgets into current state (without triggering set)
    const merged = { ...current, visibleWidgets: stored }
    // Sync in-memory state silently if localStorage differs
    const currentJson = JSON.stringify(current.visibleWidgets)
    const storedJson = JSON.stringify(stored)
    if (currentJson !== storedJson) {
      useDashboardWidgetsStore.setState({ visibleWidgets: stored })
    }
    return merged
  }
  return current
}

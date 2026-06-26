/**
 * localStorage I/O for the dashboard widgets store (TZ-4 extraction).
 *
 * Centralises read/write + the persisted-persona validation so a corrupted
 * localStorage value cannot crash the store (Boundary Normalizer Pattern), and
 * keeps dashboardWidgetsStore.ts under the 200-line cap.
 *
 * Format: { state: { visibleWidgets: {...}, persona: 'Owner'|'Ops'|'CFO'|null } }
 */

import type { Persona } from './persona-presets'
import { isPersonaValue } from './persona-presets'
import type { VisibleWidgets } from './dashboardWidgetsStore'

export const STORAGE_KEY = 'wb-repricer-dashboard-widgets'

export interface PersistedState {
  visibleWidgets: VisibleWidgets
  persona: Persona | null
}

/** Count visible widgets (min-3 invariant guard). */
export function countVisible(widgets: VisibleWidgets): number {
  return Object.values(widgets).filter(Boolean).length
}

/** Read persisted widgets + persona from localStorage; persona is validated. */
export function readFromStorage(): PersistedState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      state?: { visibleWidgets?: VisibleWidgets; persona?: unknown }
    }
    if (!parsed?.state?.visibleWidgets) return null
    const persona = isPersonaValue(parsed.state.persona) ? parsed.state.persona : null
    return { visibleWidgets: parsed.state.visibleWidgets, persona }
  } catch {
    return null
  }
}

/** Write state to localStorage in persist-compatible format. */
export function writeToStorage(visibleWidgets: VisibleWidgets, persona: Persona | null): void {
  if (typeof window === 'undefined') return
  try {
    const data = { state: { visibleWidgets, persona } }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Silently ignore storage errors (quota, etc.)
  }
}

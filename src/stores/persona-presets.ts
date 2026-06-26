/**
 * Dashboard persona presets (TZ-4).
 *
 * Each persona = a widget-visibility config over the 14-widget model. Selecting a
 * persona applies its preset (which dashboard sections are visible). The role→persona
 * default (Owner|Manager→Owner, Analyst→CFO, Service→CFO) is applied on first load; the
 * user can override via the header PersonaSelector, persisted to localStorage.
 *
 * Defined as the set of widgets each persona HIDES (relative to the all-visible default)
 * so this module needs only a type-only import of WidgetId — no runtime cycle with the
 * store, which performs the merge over DEFAULT_VISIBLE in `applyPersona`.
 *
 * Visibility-only for TZ-4 (AC: "selecting a persona changes the widget-visibility
 * preset"). Ordering is deferred to TZ-5 (grid tier restructure).
 *
 * @see docs/ux/IMPLEMENTATION-TZ.md (TZ-4)
 */

import type { WidgetId } from './dashboardWidgetsStore'

export type Persona = 'Owner' | 'Ops' | 'CFO'

export const PERSONA_LABELS: Record<Persona, string> = {
  Owner: 'Владелец',
  Ops: 'Операции',
  CFO: 'Финансист',
}

/**
 * Widgets HIDDEN per persona (relative to the all-visible default).
 * - Owner  hides nothing — generalist sees the full dashboard.
 * - Ops    focuses on operations (orders, returns, storage, logistics, cogs, buyout
 *          rate, payout) and hides the financial-analytical widgets.
 * - CFO    focuses on the P&L (revenue, profit, margins, commissions, payout, ROI) and
 *          hides the physical/operational widgets.
 */
export const HIDDEN_BY_PERSONA: Record<Persona, readonly WidgetId[]> = {
  Owner: [],
  Ops: ['commissions', 'advertising', 'grossProfit', 'margin', 'averages', 'roi'],
  CFO: ['returns', 'storage', 'logistics', 'buyoutRate'],
}

/**
 * Default persona for a system role:
 * Owner|Manager → Owner, Analyst|Service → CFO. Unknown/null → Owner.
 */
export function personaForRole(role: string | null | undefined): Persona {
  switch (role) {
    case 'Owner':
    case 'Manager':
      return 'Owner'
    case 'Analyst':
    case 'Service':
      return 'CFO'
    default:
      return 'Owner'
  }
}

const PERSONA_IDS: readonly Persona[] = ['Owner', 'Ops', 'CFO']

/**
 * Type guard: validate an untrusted persisted value is a known persona.
 * Used at the storage-read boundary so a corrupted/manually-edited localStorage
 * value cannot crash `personaPreset` (Boundary Normalizer Pattern).
 */
export function isPersonaValue(value: unknown): value is Persona {
  return typeof value === 'string' && PERSONA_IDS.some(p => p === value)
}

/**
 * Unit-Economics Boundary Normalizer — Validation F-43.
 *
 * GET /v1/analytics/unit-economics items use backend field names that differ from the
 * frontend-canonical UnitEconomicsItem:
 *   - backend `quantity_sold`  → FE `units_sold`  (the delivery-cost sub-feature reads
 *     `units_sold` in 3 places; without the map it's always undefined → delivery metrics
 *     silently compute nothing and the "Ср. доставка" card shows "—").
 *   - backend `missing_cogs`   → FE `has_cogs`    (INVERTED semantics: has_cogs = !missing_cogs).
 * These were dormant while the page rendered an empty state (the apiClient double-unwrap,
 * fixed alongside this); F-43 made the page render, exposing them. Map them at the boundary
 * so components never see the raw shape (Boundary Normalizer Pattern).
 */

import type { UnitEconomicsItem, UnitEconomicsResponse } from '@/types/unit-economics'

function normalizeUnitEconomicsItem(raw: Record<string, unknown>): UnitEconomicsItem {
  const unitsSold =
    typeof raw.units_sold === 'number'
      ? raw.units_sold
      : typeof raw.quantity_sold === 'number'
        ? raw.quantity_sold
        : undefined

  // has_cogs is the FE-canonical (positive) flag; backend sends the inverse `missing_cogs`.
  const hasCogs = typeof raw.has_cogs === 'boolean' ? raw.has_cogs : raw.missing_cogs !== true

  // Drop the raw backend keys so they don't survive on the canonical object (debugger
  // clarity + avoids leaking quantity_sold/missing_cogs into CSV export / logs).
  const { quantity_sold: _qs, missing_cogs: _mc, ...rest } = raw
  void _qs
  void _mc
  return {
    ...(rest as unknown as UnitEconomicsItem),
    units_sold: unitsSold,
    has_cogs: hasCogs,
  }
}

/** Normalize the unit-economics response, mapping backend item field names to FE-canonical. */
export function normalizeUnitEconomicsResponse(raw: UnitEconomicsResponse): UnitEconomicsResponse {
  const data = Array.isArray(raw?.data)
    ? raw.data.map(item => normalizeUnitEconomicsItem(item as unknown as Record<string, unknown>))
    : []
  return { ...raw, data }
}

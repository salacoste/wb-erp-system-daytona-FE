/**
 * Waterfall Chart Colors & Category Configuration
 * Story 5.3: Cost Breakdown Visualization
 *
 * Extracted from waterfall-chart-utils.ts (file size compliance).
 */

/** Color scheme from UX specs */
export const WATERFALL_COLORS = {
  revenue: '#2196F3', // Blue - starting point
  cogs: '#FF9800', // Orange - significant cost
  commission: '#9C27B0', // Purple - WB brand
  logistics_delivery: '#00BCD4', // Teal - movement
  logistics_return: '#4DD0E1', // Cyan - related to delivery
  storage: '#795548', // Brown - warehouse
  paid_acceptance: '#FFC107', // Amber - processing
  penalties: '#F44336', // Red - negative
  other_deductions: '#9E9E9E', // Gray - misc
  advertising: '#14B8A6', // Teal - marketing
  delivery_to_warehouse: '#06B6D4', // Cyan - seller delivery cost
  profit: '#4CAF50', // Green - positive outcome
  loss: '#F44336', // Red - negative outcome
}

/**
 * Cost categories configuration for waterfall chart bars.
 * Indexed by `key` for runtime lookup of label + color when ordering is
 * driven externally (e.g., by `meta.cost_category_order` from backend).
 *
 * The array order below is the FALLBACK order — used only when the backend
 * does not provide `cost_category_order` in the response meta. Real ordering
 * for production cabinets comes from the backend (per request-backend/173 § F4)
 * via `transformToWaterfallData(..., categoryOrder)`. Story 96.3-FE.
 */
export const COST_CATEGORIES = [
  { key: 'cogs', label: 'COGS', color: WATERFALL_COLORS.cogs },
  { key: 'commission', label: 'Комиссия', color: WATERFALL_COLORS.commission },
  { key: 'logistics_delivery', label: 'Доставка', color: WATERFALL_COLORS.logistics_delivery },
  { key: 'logistics_return', label: 'Возвраты', color: WATERFALL_COLORS.logistics_return },
  { key: 'storage', label: 'Хранение', color: WATERFALL_COLORS.storage },
  {
    key: 'delivery_to_warehouse',
    label: 'Доставка на склад',
    color: WATERFALL_COLORS.delivery_to_warehouse,
  },
  { key: 'paid_acceptance', label: 'Приёмка', color: WATERFALL_COLORS.paid_acceptance },
  { key: 'penalties', label: 'Штрафы', color: WATERFALL_COLORS.penalties },
  { key: 'other_deductions', label: 'Прочее', color: WATERFALL_COLORS.other_deductions },
  { key: 'advertising', label: 'Реклама', color: WATERFALL_COLORS.advertising },
]

/** Lookup table: category key → { label, color }. Built from COST_CATEGORIES. */
export const COST_CATEGORY_BY_KEY: Record<string, { label: string; color: string }> =
  Object.fromEntries(COST_CATEGORIES.map(c => [c.key, { label: c.label, color: c.color }]))

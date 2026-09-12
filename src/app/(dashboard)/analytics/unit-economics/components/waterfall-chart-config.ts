/**
 * Waterfall Chart Colors & Category Configuration
 * Story 5.3: Cost Breakdown Visualization
 *
 * Extracted from waterfall-chart-utils.ts (file size compliance).
 */

/**
 * Color scheme — C5 wave-4 token migration (owner decision (a), 2026-09-12):
 * every value is a full-form `var(--color-*)` presentation token (no raw hex,
 * no hsl wrappers). Story 168.11's tier-collapse concern (13 series must stay
 * visually distinct) is preserved by distance offsets — logistics_return maps to
 * valence-2 and penalties to valence-4 because chart-4/chart-8 are byte-twins of
 * chart-positive/chart-negative in at least one theme. Same-name/cross-ref note:
 * this is the LIVE waterfall palette — it intentionally diverges from lib
 * unit-economics-config COST_CATEGORIES (which stays strict chart-1..10 1:1) on
 * exactly the 3 distance-offset categories; both configs are token-clean. Canon
 * form, exact role mapping and pairwise distinctness are enforced by
 * __tests__/waterfall-chart-config.test.ts.
 */
export const WATERFALL_COLORS = {
  revenue: 'var(--color-chart-9)', // Neutral start bar
  cogs: 'var(--color-chart-1)', // COGS — primary cost
  commission: 'var(--color-chart-2)', // WB commission
  logistics_delivery: 'var(--color-chart-3)', // Buyer delivery
  logistics_return: 'var(--color-valence-2)', // Return logistics (distance offset: chart-4 ≡ chart-positive)
  storage: 'var(--color-chart-5)', // Warehouse storage
  paid_acceptance: 'var(--color-chart-7)', // Paid acceptance fee
  penalties: 'var(--color-valence-4)', // Penalties (distance offset: chart-8 ≡ chart-negative)
  other_deductions: 'var(--color-valence-neutral)', // Misc deductions (avoids revenue collision on chart-9)
  advertising: 'var(--color-chart-10)', // Marketing spend
  delivery_to_warehouse: 'var(--color-chart-6)', // Seller delivery to warehouse
  profit: 'var(--color-chart-positive)', // Positive outcome (168.11 token)
  loss: 'var(--color-chart-negative)', // Negative outcome (168.11 token)
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

/**
 * WB Native Status Code Mapping
 * Barrel re-export — preserves consumer API
 *
 * Split into modules (Story 74.5):
 * - wb-status-data-core.ts: Types + creation/seller/warehouse/logistics entries
 * - wb-status-data-delivery.ts: delivery/cancellation/return/other + merged config
 * - wb-status-helpers.ts: Helper functions + category labels/icons
 */

// Types
export type { WbStatusCategory, WbStatusConfig } from './wb-status-data-core'

// Data
export { WB_STATUS_CONFIG } from './wb-status-data-delivery'

// Helpers
export {
  getWbStatusConfig,
  getWbStatusLabel,
  getWbStatusLabelEn,
  isWbStatusFinal,
  getWbStatusCategory,
  getStatusesByCategory,
  getFinalStatuses,
  WB_STATUS_CATEGORY_LABELS,
  WB_STATUS_CATEGORY_ICONS,
} from './wb-status-helpers'

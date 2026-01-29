/**
 * Supplies Utility Re-exports
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 * Epic 53-FE: Supply Management UI
 *
 * Re-exports supply status helpers and configuration from types module.
 */

// Re-export status configuration and helpers from types
export {
  SUPPLY_STATUS_CONFIG,
  getSupplyStatusConfig,
  getSupplyStatusLabel,
  isSupplyFinal,
  canModifySupply,
  canGenerateStickers,
} from '@/types/supplies'

export type { SupplyStatusConfig } from '@/types/supplies'

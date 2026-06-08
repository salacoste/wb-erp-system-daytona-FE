/**
 * Supplies UI Configuration & Helper Functions
 * Split from supplies.ts for file size compliance
 */

import type { SupplyStatus } from './core'

// =============================================================================
// UI Configuration Types
// =============================================================================

/** Status configuration for UI display */
export interface SupplyStatusConfig {
  label: string
  color: string
  bgColor: string
  icon: string
}

/** Status configuration map with Russian labels */
export const SUPPLY_STATUS_CONFIG: Record<SupplyStatus, SupplyStatusConfig> = {
  OPEN: {
    label: 'Открыта',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: 'PackageOpen',
  },
  CLOSED: {
    label: 'Закрыта',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    icon: 'PackageCheck',
  },
  DELIVERING: {
    label: 'В пути',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    icon: 'Truck',
  },
  DELIVERED: {
    label: 'Доставлена',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    icon: 'CheckCircle',
  },
  CANCELLED: {
    label: 'Отменена',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    icon: 'XCircle',
  },
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Neutral fallback for an unrecognized/out-of-enum status (status-honesty): an unknown
 * lifecycle state must not masquerade as the blue "Открыта" (OPEN, implies editable).
 */
const SUPPLY_STATUS_FALLBACK_CONFIG: SupplyStatusConfig = {
  label: 'Неизвестно',
  color: 'text-gray-600',
  bgColor: 'bg-gray-50',
  icon: 'HelpCircle',
}

/** Get status configuration for a given status */
export function getSupplyStatusConfig(status: SupplyStatus): SupplyStatusConfig {
  return SUPPLY_STATUS_CONFIG[status] ?? SUPPLY_STATUS_FALLBACK_CONFIG
}

/** Get status label in Russian */
export function getSupplyStatusLabel(status: SupplyStatus): string {
  return getSupplyStatusConfig(status).label
}

/** Check if supply is in final state (DELIVERED or CANCELLED) */
export function isSupplyFinal(status: SupplyStatus): boolean {
  return status === 'DELIVERED' || status === 'CANCELLED'
}

/** Check if supply can be modified (add/remove orders) - only OPEN */
export function canModifySupply(status: SupplyStatus): boolean {
  return status === 'OPEN'
}

/** Check if supply can generate stickers - only CLOSED */
export function canGenerateStickers(status: SupplyStatus): boolean {
  return status === 'CLOSED'
}

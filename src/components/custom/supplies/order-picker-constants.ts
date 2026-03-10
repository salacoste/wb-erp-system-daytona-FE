/**
 * Order Picker Constants & Helpers
 * Story 53.5-FE: Order Picker Drawer
 * Epic 53-FE: Supply Management UI
 *
 * Extracted from OrderPickerDrawer.tsx for file-size compliance (Epic 74).
 */

// =============================================================================
// Constants
// =============================================================================

export const MAX_SELECTION = 1000
export const NEAR_LIMIT_THRESHOLD = 900
export const LIST_HEIGHT = 500 // Height of virtualized list

// =============================================================================
// Types
// =============================================================================

export interface OrderPickerDrawerProps {
  supplyId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

// =============================================================================
// Russian Pluralization
// =============================================================================

export function pluralizeOrders(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod100 >= 11 && mod100 <= 14) return 'заказов'
  if (mod10 === 1) return 'заказ'
  if (mod10 >= 2 && mod10 <= 4) return 'заказа'
  return 'заказов'
}

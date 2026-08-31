/**
 * WB Status Data — Return + Other Categories
 * Extracted from wb-status-data-delivery.ts for 200-line cap compliance
 */

import type { WbStatusConfig } from './wb-status-data-core'

/** WB status entries: return (5) and other / edge cases (4) */
export const WB_STATUS_CONFIG_RETURNS: Record<string, WbStatusConfig> = {
  // === Returns (5) ===
  return_requested: {
    label: 'Запрошен возврат',
    labelEn: 'Return requested',
    category: 'return',
    color: 'text-status-warning-foreground',
    bgColor: 'bg-status-warning',
    isFinal: false,
    sortOrder: 60,
  },
  return_at_pvz: {
    label: 'Возврат на ПВЗ',
    labelEn: 'Return at pickup point',
    category: 'return',
    color: 'text-status-warning-foreground',
    bgColor: 'bg-status-warning',
    isFinal: false,
    sortOrder: 61,
  },
  return_in_transit: {
    label: 'Возврат в пути',
    labelEn: 'Return in transit',
    category: 'return',
    color: 'text-status-warning-foreground',
    bgColor: 'bg-status-warning',
    isFinal: false,
    sortOrder: 62,
  },
  return_received: {
    label: 'Возврат получен',
    labelEn: 'Return received',
    category: 'return',
    color: 'text-status-warning-foreground',
    bgColor: 'bg-status-warning',
    isFinal: true,
    sortOrder: 63,
  },
  refunded: {
    label: 'Возврат средств',
    labelEn: 'Refunded',
    category: 'return',
    color: 'text-status-warning-foreground',
    bgColor: 'bg-status-warning',
    isFinal: true,
    sortOrder: 64,
  },
  // === Other / Edge Cases (4) ===
  defect: {
    label: 'Брак',
    labelEn: 'Defect',
    category: 'other',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    isFinal: true,
    sortOrder: 70,
  },
  lost: {
    label: 'Утерян',
    labelEn: 'Lost',
    category: 'other',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    isFinal: true,
    sortOrder: 71,
  },
  damaged: {
    label: 'Повреждён',
    labelEn: 'Damaged',
    category: 'other',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    isFinal: true,
    sortOrder: 72,
  },
  expired: {
    label: 'Истёк срок',
    labelEn: 'Expired',
    category: 'other',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    isFinal: true,
    sortOrder: 73,
  },
}

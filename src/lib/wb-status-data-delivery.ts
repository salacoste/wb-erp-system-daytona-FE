/**
 * WB Status Data — Delivery, Cancellation, Return, Other Categories
 * Merges with core data to produce complete WB_STATUS_CONFIG
 * Extracted from wb-status-mapping.ts (Story 74.5)
 */

import type { WbStatusConfig } from './wb-status-data-core'
import { WB_STATUS_CONFIG_CORE } from './wb-status-data-core'

/** WB status entries: delivery, cancellation, return, other */
const WB_STATUS_CONFIG_DELIVERY: Record<string, WbStatusConfig> = {
  // === Delivery - Success (3) ===
  received_by_client: {
    label: 'Получен клиентом',
    labelEn: 'Received by client',
    category: 'delivery',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    isFinal: true,
    sortOrder: 40,
  },
  sold: {
    label: 'Продан',
    labelEn: 'Sold',
    category: 'delivery',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    isFinal: true,
    sortOrder: 41,
  },
  delivering: {
    label: 'Доставляется',
    labelEn: 'Delivering',
    category: 'delivery',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    isFinal: false,
    sortOrder: 42,
  },
  // === Cancellations (6) ===
  canceled: {
    label: 'Отменён',
    labelEn: 'Canceled',
    category: 'cancellation',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    isFinal: true,
    sortOrder: 50,
  },
  canceled_by_seller: {
    label: 'Отменён продавцом',
    labelEn: 'Canceled by seller',
    category: 'cancellation',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    isFinal: true,
    sortOrder: 51,
  },
  canceled_by_wh: {
    label: 'Отменён складом',
    labelEn: 'Canceled by warehouse',
    category: 'cancellation',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    isFinal: true,
    sortOrder: 52,
  },
  canceled_by_client: {
    label: 'Отменён клиентом',
    labelEn: 'Canceled by client',
    category: 'cancellation',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    isFinal: true,
    sortOrder: 53,
  },
  canceled_by_wb: {
    label: 'Отменён WB',
    labelEn: 'Canceled by WB',
    category: 'cancellation',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    isFinal: true,
    sortOrder: 54,
  },
  cancel: {
    label: 'Отмена',
    labelEn: 'Cancel',
    category: 'cancellation',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    isFinal: true,
    sortOrder: 55,
  },
  // === Returns (5) ===
  return_requested: {
    label: 'Запрошен возврат',
    labelEn: 'Return requested',
    category: 'return',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    isFinal: false,
    sortOrder: 60,
  },
  return_at_pvz: {
    label: 'Возврат на ПВЗ',
    labelEn: 'Return at pickup point',
    category: 'return',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    isFinal: false,
    sortOrder: 61,
  },
  return_in_transit: {
    label: 'Возврат в пути',
    labelEn: 'Return in transit',
    category: 'return',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    isFinal: false,
    sortOrder: 62,
  },
  return_received: {
    label: 'Возврат получен',
    labelEn: 'Return received',
    category: 'return',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    isFinal: true,
    sortOrder: 63,
  },
  refunded: {
    label: 'Возврат средств',
    labelEn: 'Refunded',
    category: 'return',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    isFinal: true,
    sortOrder: 64,
  },
  // === Other / Edge Cases (4) ===
  defect: {
    label: 'Брак',
    labelEn: 'Defect',
    category: 'other',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    isFinal: true,
    sortOrder: 70,
  },
  lost: {
    label: 'Утерян',
    labelEn: 'Lost',
    category: 'other',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    isFinal: true,
    sortOrder: 71,
  },
  damaged: {
    label: 'Повреждён',
    labelEn: 'Damaged',
    category: 'other',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    isFinal: true,
    sortOrder: 72,
  },
  expired: {
    label: 'Истёк срок',
    labelEn: 'Expired',
    category: 'other',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    isFinal: true,
    sortOrder: 73,
  },
}

/** Default config for unknown status codes */
export const UNKNOWN_STATUS_CONFIG: WbStatusConfig = {
  label: 'Неизвестный статус',
  labelEn: 'Unknown status',
  category: 'other',
  color: 'text-gray-500',
  bgColor: 'bg-gray-50',
  isFinal: false,
  sortOrder: 99,
}

/** Complete WB Status Config — merged from core + delivery halves */
export const WB_STATUS_CONFIG: Record<string, WbStatusConfig> = {
  ...WB_STATUS_CONFIG_CORE,
  ...WB_STATUS_CONFIG_DELIVERY,
}

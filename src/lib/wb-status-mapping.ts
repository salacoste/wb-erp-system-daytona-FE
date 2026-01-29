/**
 * WB Native Status Code Mapping
 *
 * Frontend maintains this mapping as backend doesn't provide a translation endpoint.
 * Reference: docs/stories/epic-40/story-40.9-wb-native-status-history.md
 *
 * TODO: Backend may add GET /v1/orders/status-dictionary in future sprint
 *
 * @see Epic 40.9-FE: Orders UI & WB Native Status History
 */

export type WbStatusCategory =
  | 'creation'
  | 'seller_processing'
  | 'warehouse'
  | 'logistics'
  | 'delivery'
  | 'cancellation'
  | 'return'
  | 'other'

export interface WbStatusConfig {
  /** Russian label for display */
  label: string
  /** English label (original from WB) */
  labelEn: string
  /** Status category for grouping */
  category: WbStatusCategory
  /** Tailwind text color class */
  color: string
  /** Tailwind background color class */
  bgColor: string
  /** Is this a final/terminal status? */
  isFinal: boolean
  /** Sort priority within category (lower = earlier) */
  sortOrder: number
}

/**
 * Comprehensive WB Status Code Configuration
 * 40+ status codes from WB API
 */
export const WB_STATUS_CONFIG: Record<string, WbStatusConfig> = {
  // === Order Creation (1) ===
  created: {
    label: 'Создан',
    labelEn: 'Created',
    category: 'creation',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    isFinal: false,
    sortOrder: 1,
  },

  // === Seller Processing (4) ===
  waiting: {
    label: 'Ожидает сборки',
    labelEn: 'Waiting',
    category: 'seller_processing',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    isFinal: false,
    sortOrder: 10,
  },
  assembling: {
    label: 'На сборке',
    labelEn: 'Assembling',
    category: 'seller_processing',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    isFinal: false,
    sortOrder: 11,
  },
  assembled: {
    label: 'Собран',
    labelEn: 'Assembled',
    category: 'seller_processing',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    isFinal: false,
    sortOrder: 12,
  },
  ready_for_supply: {
    label: 'Готов к отгрузке',
    labelEn: 'Ready for supply',
    category: 'seller_processing',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    isFinal: false,
    sortOrder: 13,
  },

  // === Warehouse Intake (3) ===
  sorted: {
    label: 'Отсортирован',
    labelEn: 'Sorted',
    category: 'warehouse',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    isFinal: false,
    sortOrder: 20,
  },
  sorted_by_wh: {
    label: 'Отсортирован на складе',
    labelEn: 'Sorted by warehouse',
    category: 'warehouse',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    isFinal: false,
    sortOrder: 21,
  },
  accepted_by_wh: {
    label: 'Принят складом',
    labelEn: 'Accepted by warehouse',
    category: 'warehouse',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    isFinal: false,
    sortOrder: 22,
  },

  // === Logistics (6) ===
  on_way_to_storage: {
    label: 'В пути на склад хранения',
    labelEn: 'On way to storage',
    category: 'logistics',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    isFinal: false,
    sortOrder: 30,
  },
  accepted_at_storage: {
    label: 'Принят на складе хранения',
    labelEn: 'Accepted at storage',
    category: 'logistics',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    isFinal: false,
    sortOrder: 31,
  },
  sorted_by_wb: {
    label: 'Отсортирован WB',
    labelEn: 'Sorted by WB',
    category: 'logistics',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    isFinal: false,
    sortOrder: 32,
  },
  on_way_to_pvz: {
    label: 'В пути на ПВЗ',
    labelEn: 'On way to pickup point',
    category: 'logistics',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    isFinal: false,
    sortOrder: 33,
  },
  arrived_at_pvz: {
    label: 'Прибыл на ПВЗ',
    labelEn: 'Arrived at pickup point',
    category: 'logistics',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    isFinal: false,
    sortOrder: 34,
  },
  on_way_to_client: {
    label: 'В пути к клиенту',
    labelEn: 'On way to client',
    category: 'logistics',
    color: 'text-indigo-800',
    bgColor: 'bg-indigo-100',
    isFinal: false,
    sortOrder: 35,
  },

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

/**
 * Default config for unknown status codes
 * Used as fallback when WB returns a code not in our mapping
 */
const UNKNOWN_STATUS_CONFIG: WbStatusConfig = {
  label: 'Неизвестный статус',
  labelEn: 'Unknown status',
  category: 'other',
  color: 'text-gray-500',
  bgColor: 'bg-gray-50',
  isFinal: false,
  sortOrder: 99,
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get status configuration with fallback for unknown codes
 */
export function getWbStatusConfig(statusCode: string): WbStatusConfig {
  return (
    WB_STATUS_CONFIG[statusCode] ?? {
      ...UNKNOWN_STATUS_CONFIG,
      label: statusCode, // Show raw code as label for unknown statuses
      labelEn: statusCode,
    }
  )
}

/**
 * Get Russian label for a WB status code
 */
export function getWbStatusLabel(statusCode: string): string {
  return getWbStatusConfig(statusCode).label
}

/**
 * Get English label for a WB status code
 */
export function getWbStatusLabelEn(statusCode: string): string {
  return getWbStatusConfig(statusCode).labelEn
}

/**
 * Check if status is a final/terminal state
 */
export function isWbStatusFinal(statusCode: string): boolean {
  return getWbStatusConfig(statusCode).isFinal
}

/**
 * Get category for a WB status code
 */
export function getWbStatusCategory(statusCode: string): WbStatusCategory {
  return getWbStatusConfig(statusCode).category
}

/**
 * Get all status codes for a given category
 */
export function getStatusesByCategory(
  category: WbStatusCategory
): Array<{ code: string; config: WbStatusConfig }> {
  return Object.entries(WB_STATUS_CONFIG)
    .filter(([, config]) => config.category === category)
    .map(([code, config]) => ({ code, config }))
    .sort((a, b) => a.config.sortOrder - b.config.sortOrder)
}

/**
 * Get all final status codes
 */
export function getFinalStatuses(): string[] {
  return Object.entries(WB_STATUS_CONFIG)
    .filter(([, config]) => config.isFinal)
    .map(([code]) => code)
}

/**
 * Category labels for UI grouping
 */
export const WB_STATUS_CATEGORY_LABELS: Record<WbStatusCategory, string> = {
  creation: 'Создание заказа',
  seller_processing: 'Обработка продавцом',
  warehouse: 'Склад',
  logistics: 'Логистика',
  delivery: 'Доставка',
  cancellation: 'Отмена',
  return: 'Возврат',
  other: 'Прочее',
}

/**
 * Category icons (Lucide icon names)
 */
export const WB_STATUS_CATEGORY_ICONS: Record<WbStatusCategory, string> = {
  creation: 'Plus',
  seller_processing: 'Package',
  warehouse: 'Warehouse',
  logistics: 'Truck',
  delivery: 'CheckCircle',
  cancellation: 'XCircle',
  return: 'RotateCcw',
  other: 'HelpCircle',
}

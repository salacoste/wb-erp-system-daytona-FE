/**
 * WB Status Data — Core Categories
 * Categories: creation, seller_processing, warehouse, logistics
 * Extracted from wb-status-mapping.ts (Story 74.5)
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
  label: string
  labelEn: string
  category: WbStatusCategory
  color: string
  bgColor: string
  isFinal: boolean
  sortOrder: number
}

/** WB status entries: creation, seller_processing, warehouse, logistics */
export const WB_STATUS_CONFIG_CORE: Record<string, WbStatusConfig> = {
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
}

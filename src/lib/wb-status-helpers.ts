/**
 * WB Status Helper Functions
 * Extracted from wb-status-mapping.ts (Story 74.5)
 */

import type { WbStatusCategory, WbStatusConfig } from './wb-status-data-core'
import { WB_STATUS_CONFIG, UNKNOWN_STATUS_CONFIG } from './wb-status-data-delivery'

/** Get status configuration with fallback for unknown codes */
export function getWbStatusConfig(statusCode: string): WbStatusConfig {
  return (
    WB_STATUS_CONFIG[statusCode] ?? {
      ...UNKNOWN_STATUS_CONFIG,
      label: statusCode,
      labelEn: statusCode,
    }
  )
}

/** Get Russian label for a WB status code */
export function getWbStatusLabel(statusCode: string): string {
  return getWbStatusConfig(statusCode).label
}

/** Get English label for a WB status code */
export function getWbStatusLabelEn(statusCode: string): string {
  return getWbStatusConfig(statusCode).labelEn
}

/** Check if status is a final/terminal state */
export function isWbStatusFinal(statusCode: string): boolean {
  return getWbStatusConfig(statusCode).isFinal
}

/** Get category for a WB status code */
export function getWbStatusCategory(statusCode: string): WbStatusCategory {
  return getWbStatusConfig(statusCode).category
}

/** Get all status codes for a given category */
export function getStatusesByCategory(
  category: WbStatusCategory
): Array<{ code: string; config: WbStatusConfig }> {
  return Object.entries(WB_STATUS_CONFIG)
    .filter(([, config]) => config.category === category)
    .map(([code, config]) => ({ code, config }))
    .sort((a, b) => a.config.sortOrder - b.config.sortOrder)
}

/** Get all final status codes */
export function getFinalStatuses(): string[] {
  return Object.entries(WB_STATUS_CONFIG)
    .filter(([, config]) => config.isFinal)
    .map(([code]) => code)
}

/** Category labels for UI grouping */
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

/** Category icons (Lucide icon names) */
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

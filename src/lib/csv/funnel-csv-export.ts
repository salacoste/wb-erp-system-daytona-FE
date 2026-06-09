/**
 * Pure helper: converts FunnelProductItem[] to a CSV string with UTF-8 BOM.
 * No side effects — Blob/DOM/download handled by <ExportCsvButton>.
 */

import type { FunnelProductItem } from '@/types/analytics-funnel'
import { formatNumber, formatPercentage } from '@/lib/utils'
import { escapeCsvCell, prefixUtf8Bom } from './csv-helpers'

const HEADERS = [
  'Артикул (nmId)',
  'Артикул продавца',
  'Бренд',
  'Просмотры',
  'Корзина',
  'Заказы',
  'Заказы (₽)',
  'Выкупы',
  'Выкупы (₽)',
  'Отмены',
  'Отмены (₽)',
  'Конверсия в корзину %',
  'Конверсия в заказ %',
  'Выкуп %',
  'Отмена %',
  'Общая конверсия %',
]

/**
 * Converts a single FunnelProductItem to a CSV row array (string values).
 * AP#8: null rates → '—' (em-dash). Opaque nmId uses String() per AP#10.
 */
function itemToRow(item: FunnelProductItem): string[] {
  return [
    String(item.nmId),
    item.vendorCode ?? '—',
    item.brandName ?? '—',
    formatNumber(item.openCardCount),
    formatNumber(item.addToCartCount),
    formatNumber(item.ordersCount),
    formatNumber(item.ordersSumRub),
    formatNumber(item.buyoutCount),
    formatNumber(item.buyoutSumRub),
    formatNumber(item.cancelCount),
    formatNumber(item.cancelSumRub),
    formatPercentage(item.cartConversion),
    formatPercentage(item.orderConversion),
    formatPercentage(item.buyoutConversion),
    formatPercentage(item.cancelRate),
    formatPercentage(item.totalConversion),
  ]
}

/**
 * Exports funnel per-SKU data to a CSV string with UTF-8 BOM prefix.
 * Empty items array → returns BOM + headers only (no error).
 *
 * @param items - Array of FunnelProductItem (already normalized).
 * @returns CSV string starting with UTF-8 BOM (charCodeAt(0) === 0xFEFF).
 */
export function exportFunnelToCsv(items: FunnelProductItem[]): string {
  const headerRow = HEADERS.map(escapeCsvCell).join(',')
  const dataRows = items.map(item => itemToRow(item).map(escapeCsvCell).join(','))
  const csvBody = [headerRow, ...dataRows].join('\r\n')
  return prefixUtf8Bom(csvBody)
}

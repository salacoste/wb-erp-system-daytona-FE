/**
 * Pure helper: converts BySkuReturnItem[] to a CSV string with UTF-8 BOM.
 * No side effects — Blob/DOM/download handled by <ExportCsvButton>.
 */

import type { BySkuReturnItem } from '@/types/analytics-returns'
import { formatPercentage } from '@/lib/utils'
import { escapeCsvCell, prefixUtf8Bom } from './csv-helpers'

function fmt(n: number): string {
  return n.toLocaleString('ru-RU')
}

const HEADERS = [
  'Артикул (nmId)',
  'Товар',
  'Бренд',
  'Продажи',
  'Возвраты',
  '% возврата',
  'До отправки',
  'Отказ ПВЗ',
  'После получения',
  'Аномалия',
]

/**
 * Converts a single BySkuReturnItem to a CSV row array (string values).
 * AP#8: null returnRate → '—' (em-dash).
 */
function itemToRow(item: BySkuReturnItem): string[] {
  return [
    String(item.nmId),
    item.productName ?? '—',
    item.brand ?? '—',
    item.salesCount != null ? fmt(item.salesCount) : '—',
    fmt(item.totalReturns),
    item.returnRate != null ? formatPercentage(item.returnRate) : '—',
    fmt(item.cancelBeforeShipment),
    fmt(item.refusalAtPvz),
    fmt(item.returnAfterReceipt),
    item.anomalyFlag ? 'Да' : 'Нет',
  ]
}

/**
 * Exports returns per-SKU data to a CSV string with UTF-8 BOM prefix.
 * Empty data array → returns BOM + headers only (no error).
 *
 * @param items - Array of BySkuReturnItem (already normalized).
 * @returns CSV string starting with UTF-8 BOM.
 */
export function exportReturnsToCsv(items: BySkuReturnItem[]): string {
  const headerRow = HEADERS.map(escapeCsvCell).join(',')
  const dataRows = items.map(item => itemToRow(item).map(escapeCsvCell).join(','))
  const csvBody = [headerRow, ...dataRows].join('\r\n')
  return prefixUtf8Bom(csvBody)
}

/**
 * Pure helper: converts BySkuBuyoutItem[] to a CSV string with UTF-8 BOM.
 * No side effects — Blob/DOM/download handled by <ExportCsvButton>.
 */

import type { BySkuBuyoutItem } from '@/types/analytics-buyout'
import { formatPercentage } from '@/lib/utils'
import { escapeCsvCell, prefixUtf8Bom } from './csv-helpers'

function fmt(n: number): string {
  return n.toLocaleString('ru-RU')
}

const HEADERS = [
  'Артикул (nmId)',
  'Артикул продавца',
  'Товар',
  'Бренд',
  'Продажи',
  'Возвраты',
  'Выкуп %',
  'До отправки',
  'Отказ ПВЗ',
  'После получения',
  'Тренд',
  'Уверенность',
]

/** Maps trend direction to Russian display string. */
function fmtTrend(trend: string | undefined): string {
  if (!trend) return '—'
  switch (trend) {
    case 'up':
      return 'Рост'
    case 'down':
      return 'Снижение'
    case 'stable':
      return 'Стабильно'
    default:
      return trend
  }
}

/** Maps confidence level to Russian display string. */
function fmtConfidence(c: string | undefined): string {
  if (!c) return '—'
  switch (c) {
    case 'high':
      return 'Высокая'
    case 'medium':
      return 'Средняя'
    case 'low':
      return 'Низкая'
    default:
      return c
  }
}

/**
 * Converts a single BySkuBuyoutItem to a CSV row array (string values).
 * AP#8: null buyoutRatePct → '—' (em-dash).
 */
function itemToRow(item: BySkuBuyoutItem): string[] {
  const rb = item.returnBreakdown
  return [
    String(item.nmId),
    item.supplierArticle ?? '—',
    item.productName ?? '—',
    item.brand ?? '—',
    fmt(item.salesCount),
    fmt(item.returnsCount),
    item.buyoutRatePct != null ? formatPercentage(item.buyoutRatePct) : '—',
    rb != null ? String(rb.cancelBeforeShipment) : '—',
    rb != null ? String(rb.refusalAtPvz) : '—',
    rb != null ? String(rb.returnAfterReceipt) : '—',
    fmtTrend(item.trend),
    fmtConfidence(item.confidence),
  ]
}

/**
 * Exports buyout per-SKU data to a CSV string with UTF-8 BOM prefix.
 * Empty data array → returns BOM + headers only (no error).
 *
 * @param items - Array of BySkuBuyoutItem (already normalized).
 * @returns CSV string starting with UTF-8 BOM.
 */
export function exportBuyoutToCsv(items: BySkuBuyoutItem[]): string {
  const headerRow = HEADERS.map(escapeCsvCell).join(',')
  const dataRows = items.map(item => itemToRow(item).map(escapeCsvCell).join(','))
  const csvBody = [headerRow, ...dataRows].join('\r\n')
  return prefixUtf8Bom(csvBody)
}

/**
 * Pure helper: converts CrossReferenceItem[] to a CSV string with UTF-8 BOM.
 * No side effects — Blob/DOM/download handled by <ExportCsvButton>.
 */

import type {
  CrossReferenceItem,
  Channel,
} from '@/app/(dashboard)/analytics/cross-reference/utils/cross-reference-utils'
import { escapeCsvCell, prefixUtf8Bom } from './csv-helpers'

function fmt(n: number): string {
  return n.toLocaleString('ru-RU')
}

function fmtCurrency(n: number | null): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

const CHANNEL_LABELS: Record<Channel, string> = {
  organic: 'Органика',
  ad: 'Реклама',
  both: 'Оба',
}

const HEADERS = [
  'Артикул (nmId)',
  'Артикул продавца',
  'Заказы (поиск)',
  'Уник. запросы',
  'Расход (₽)',
  'Рекл. клики',
  'Рекл. выручка (₽)',
  'Канал',
]

/**
 * Converts a single CrossReferenceItem to a CSV row array (string values).
 * AP#8: null adRevenue / uniqueQueries → '—' (em-dash).
 */
function itemToRow(item: CrossReferenceItem): string[] {
  return [
    String(item.nmId),
    item.vendorCode ?? '—',
    fmt(item.totalOrders),
    item.uniqueQueries != null ? fmt(item.uniqueQueries) : '—',
    fmtCurrency(item.adSpend),
    fmt(item.adClicks),
    fmtCurrency(item.adRevenue),
    CHANNEL_LABELS[item.channel],
  ]
}

/**
 * Exports cross-reference merged data to a CSV string with UTF-8 BOM prefix.
 * Empty items array → returns BOM + headers only (no error).
 *
 * @param items - Array of CrossReferenceItem (already merged).
 * @returns CSV string starting with UTF-8 BOM.
 */
export function exportCrossReferenceToCsv(items: CrossReferenceItem[]): string {
  const headerRow = HEADERS.map(escapeCsvCell).join(',')
  const dataRows = items.map(item => itemToRow(item).map(escapeCsvCell).join(','))
  const csvBody = [headerRow, ...dataRows].join('\r\n')
  return prefixUtf8Bom(csvBody)
}

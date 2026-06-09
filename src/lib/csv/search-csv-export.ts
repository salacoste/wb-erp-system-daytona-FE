/**
 * Pure helper: converts search analytics data to CSV strings with UTF-8 BOM.
 * No side effects — Blob/DOM/download handled by <ExportCsvButton>.
 */

import type { SearchQueryItem, SearchProductItem } from '@/types/search-analytics'
import { escapeCsvCell, prefixUtf8Bom } from './csv-helpers'

function fmt(n: number): string {
  return n.toLocaleString('ru-RU')
}

/** Format percent value (0-100 scale) with 1 decimal, Russian locale. */
function fmtPct(n: number | null): string {
  if (n == null) return '—'
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'
}

const BY_PRODUCT_HEADERS = [
  'Запрос',
  'Ср. позиция',
  'Показы',
  'Клики',
  'CTR %',
  'В корзину',
  'Заказы',
]

function queryItemToRow(item: SearchQueryItem): string[] {
  return [
    item.searchQuery,
    fmt(item.avgPosition),
    fmt(item.totalImpressions),
    fmt(item.totalClicks),
    fmtPct(item.avgCtr),
    fmt(item.searchCartAdds ?? 0),
    fmt(item.totalOrders),
  ]
}

/**
 * Exports by-product search query data to CSV with UTF-8 BOM.
 * Empty queries array → BOM + headers only.
 */
export function exportSearchByProductToCsv(queries: SearchQueryItem[]): string {
  const headerRow = BY_PRODUCT_HEADERS.map(escapeCsvCell).join(',')
  const dataRows = queries.map(q => queryItemToRow(q).map(escapeCsvCell).join(','))
  return prefixUtf8Bom([headerRow, ...dataRows].join('\r\n'))
}

const BY_QUERY_HEADERS = [
  'Артикул (nmId)',
  'Артикул продавца',
  'Ср. позиция',
  'Показы',
  'Клики',
  'CTR %',
  'В корзину',
  'Заказы',
]

function productItemToRow(item: SearchProductItem): string[] {
  return [
    String(item.nmId),
    item.vendorCode ?? '—',
    fmt(item.avgPosition),
    fmt(item.totalImpressions),
    fmt(item.totalClicks),
    fmtPct(item.avgCtr),
    fmt(item.searchCartAdds ?? 0),
    fmt(item.totalOrders),
  ]
}

/**
 * Exports by-query product ranking data to CSV with UTF-8 BOM.
 * Empty products array → BOM + headers only.
 */
export function exportSearchByQueryToCsv(products: SearchProductItem[]): string {
  const headerRow = BY_QUERY_HEADERS.map(escapeCsvCell).join(',')
  const dataRows = products.map(p => productItemToRow(p).map(escapeCsvCell).join(','))
  return prefixUtf8Bom([headerRow, ...dataRows].join('\r\n'))
}

/**
 * Pure helper: converts search analytics data to CSV strings with UTF-8 BOM.
 * No side effects — Blob/DOM/download handled by <ExportCsvButton>.
 */

import type {
  SearchAnalyticsCoverageStatus,
  SearchOrderItem,
  SearchOrdersSummary,
  SearchQueryItem,
  SearchProductItem,
} from '@/types/search-analytics'
import { escapeCsvCell, prefixUtf8Bom } from './csv-helpers'

function fmt(n: number): string {
  return n.toLocaleString('ru-RU')
}

/** Format percent value (0-100 scale) with 1 decimal, Russian locale. */
function fmtPct(n: number | null): string {
  // Preface-review F2: unknown NUMERIC -> empty cell (uniform sentinel across this
  // module — spreadsheet filters for blanks catch all unknowns; '—' mixed with '' hid them).
  if (n == null) return ''
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'
}

const BY_PRODUCT_HEADERS = [
  'Запрос',
  'Ср. позиция',
  'Показы',
  'Ср. конверсия добавления в корзину %',
  'В корзину',
  'Заказы',
]

function queryItemToRow(item: SearchQueryItem): string[] {
  return [
    item.searchQuery,
    item.avgPosition == null ? '' : fmt(item.avgPosition), // 170.7: unknown position -> empty cell
    fmt(item.totalImpressions),
    // BE: avgCtr is the average WB addToCart/openCard conversion (%) — NOT a click rate.
    // totalClicks (the legacy "Клики"/"CTR %" columns) is WB addToCart mislabeled
    // (deprecated alias of searchCartAdds) — exporting it as clicks was a semantic lie.
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
  'Ср. конверсия добавления в корзину %',
  'В корзину',
  'Заказы',
]

function productItemToRow(item: SearchProductItem): string[] {
  return [
    String(item.nmId),
    item.vendorCode ?? '—',
    item.avgPosition == null ? '' : fmt(item.avgPosition), // 170.7: unknown position -> empty cell
    fmt(item.totalImpressions),
    fmtPct(item.avgCtr), // BE: addToCart conversion %, see queryItemToRow
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

const ORDERS_HEADERS = ['Запрос', 'Заказы', 'Товаров']

function orderItemToRow(item: SearchOrderItem): string[] {
  return [String(item.key), fmt(item.totalOrders), fmt(item.uniqueProducts ?? 0)]
}

/** Orders-export coverage metadata: full summary minus the derived status label input. */
export type SearchOrdersCoverageMeta = Omit<SearchOrdersSummary, 'status'> & {
  status?: SearchAnalyticsCoverageStatus
}

function coverageStatusLabel(meta: SearchOrdersCoverageMeta): string {
  if (!meta.coverageKnown) return meta.status === 'error' ? 'Ошибка' : 'Неизвестно'
  return meta.coverageComplete ? 'Полное' : 'Неполное'
}

/**
 * Prepends the Task-139.6 coverage metadata block so a partial/unknown range is
 * visible inside the exported file itself, then a blank line, then the data section.
 * 'Расчёт метрик' appears only when coverage is KNOWN-but-incomplete (it explains the
 * covered-dates-only computation; asserting it under a denied authority would
 * fabricate a computation claim — Pass-1 M2).
 */
function coverageMetaRows(meta: SearchOrdersCoverageMeta): string[] {
  const rows: string[][] = [
    ['Статус покрытия', coverageStatusLabel(meta)],
    ['Запрошено дней', fmt(meta.requestedDayCount)],
    ['Покрыто дней', fmt(meta.coveredDayCount)],
    ['Дней без покрытия', fmt(meta.missingDayCount)],
    ['Даты без покрытия', meta.missingDates.join(', ')],
  ]
  if (meta.coverageKnown && !meta.coverageComplete) {
    rows.push(['Расчёт метрик', 'Только по покрытым датам'])
  }
  return rows.map(row => row.map(escapeCsvCell).join(','))
}

/**
 * Exports search-attributed orders (groupBy=query) to CSV with UTF-8 BOM.
 * When `meta` is provided, a coverage metadata block precedes the data section.
 * Empty items array → BOM + metadata (if any) + headers only.
 */
export function exportSearchOrdersToCsv(
  items: SearchOrderItem[],
  meta?: SearchOrdersCoverageMeta
): string {
  const headerRow = ORDERS_HEADERS.map(escapeCsvCell).join(',')
  const dataRows = items.map(i => orderItemToRow(i).map(escapeCsvCell).join(','))
  const sections = meta ? [...coverageMetaRows(meta), ''] : []
  return prefixUtf8Bom([...sections, headerRow, ...dataRows].join('\r\n'))
}

/**
 * Pure helper: converts SkuAccuracyEntry[] to a CSV string with UTF-8 BOM.
 * No side effects — Blob/DOM/download handled by <ExportCsvButton>.
 * Story 110.5-FE Task 2.
 */

import type { SkuAccuracyEntry } from '@/types/ai/evaluations'
import { formatPercentage, formatNumber } from '@/lib/utils'
import { escapeCsvCell, prefixUtf8Bom } from './csv-helpers'

const HEADERS = [
  'Артикул',
  'Vendor code',
  'Средний AI MAPE',
  'Средний Naive MAPE',
  'AI точность %',
  'Naive точность %',
  'Кол-во оценок',
]

/**
 * Converts a single SkuAccuracyEntry to a CSV row array (string values).
 * AP#8: null percentage fields → '—' (em-dash, U+2014).
 * nmId: opaque ID — String() per Story 110.3 F-8 (no locale separator on IDs).
 * evaluationCount: semantic-zero count — formatNumber (0 is valid).
 */
function entryToRow(entry: SkuAccuracyEntry): string[] {
  return [
    entry.nmId !== null ? String(entry.nmId) : '—',
    entry.vendorCode ?? '—',
    entry.avgAiMape !== null ? formatPercentage(entry.avgAiMape) : '—',
    entry.avgNaiveMape !== null ? formatPercentage(entry.avgNaiveMape) : '—',
    entry.aiAccuracyPercent !== null ? formatPercentage(entry.aiAccuracyPercent) : '—',
    entry.naiveAccuracyPercent !== null ? formatPercentage(entry.naiveAccuracyPercent) : '—',
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: evaluationCount is a count field, 0 is meaningful
    formatNumber(entry.evaluationCount),
  ]
}

/**
 * Exports SKU accuracy data to a CSV string with UTF-8 BOM prefix.
 * Empty array → returns BOM + headers only (no error).
 *
 * @param skuAccuracies - Array of SkuAccuracyEntry (already normalized).
 * @returns CSV string starting with UTF-8 BOM (charCodeAt(0) === 0xFEFF).
 */
export function exportSkuAccuracyToCsv(skuAccuracies: SkuAccuracyEntry[]): string {
  const headerRow = HEADERS.map(escapeCsvCell).join(',')
  const dataRows = skuAccuracies.map(entry => entryToRow(entry).map(escapeCsvCell).join(','))
  const csvBody = [headerRow, ...dataRows].join('\r\n')
  return prefixUtf8Bom(csvBody)
}

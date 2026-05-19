/**
 * Pure helper: converts EvaluationEntry[] to a CSV string with UTF-8 BOM.
 * No side effects — Blob/DOM/download handled by <ExportCsvButton>.
 * Story 110.5-FE Task 1.
 */

import type { EvaluationEntry } from '@/types/ai/evaluations'
import { formatDate, formatCurrency, formatPercentage, formatNumber } from '@/lib/utils'
import { escapeCsvCell, prefixUtf8Bom } from './csv-helpers'

const HEADERS = [
  'Дата оценки',
  'ID прогноза',
  'Артикул',
  'Прогноз (ед.)',
  'Факт (ед.)',
  'Прогноз (выручка)',
  'Факт (выручка)',
  'MAPE (ед.)',
  'MAPE (выручка)',
  'Горизонт (дней)',
]

/**
 * Converts a single EvaluationEntry to a CSV row array (string values).
 * AP#8: null mapeUnits / mapeRevenue → '—' (em-dash, U+2014).
 * Opaque IDs (forecastId, nmId) use raw/String() — NOT formatNumber.
 */
function entryToRow(entry: EvaluationEntry): string[] {
  return [
    formatDate(entry.evaluationDate),
    entry.forecastId,
    // nmId: opaque identifier — String() per Story 110.3 F-8 (no locale separator on IDs)
    entry.nmId !== null ? String(entry.nmId) : '—',
    formatNumber(entry.predictedUnits),
    formatNumber(entry.actualUnits),
    formatCurrency(entry.predictedRevenue),
    formatCurrency(entry.actualRevenue),
    // AP#8: null MAPE → em-dash, never 0
    entry.mapeUnits !== null ? formatPercentage(entry.mapeUnits) : '—',
    entry.mapeRevenue !== null ? formatPercentage(entry.mapeRevenue) : '—',
    formatNumber(entry.horizonDays),
  ]
}

/**
 * Exports evaluations to a CSV string with UTF-8 BOM prefix.
 * Empty evaluations array → returns BOM + headers only (no error).
 *
 * @param evaluations - Array of EvaluationEntry (already normalized).
 * @param options.evaluatedAt - ISO datetime string for metadata (unused in CSV body).
 * @returns CSV string starting with UTF-8 BOM (charCodeAt(0) === 0xFEFF).
 */
export function exportEvaluationsToCsv(
  evaluations: EvaluationEntry[],
  _options?: { evaluatedAt?: string | null }
): string {
  const headerRow = HEADERS.map(escapeCsvCell).join(',')
  const dataRows = evaluations.map(entry => entryToRow(entry).map(escapeCsvCell).join(','))
  const csvBody = [headerRow, ...dataRows].join('\r\n')
  return prefixUtf8Bom(csvBody)
}

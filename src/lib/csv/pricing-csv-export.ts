/**
 * Pure helper: converts PriceRecommendation[] to a CSV string with UTF-8 BOM.
 * No side effects — Blob/DOM/download handled by <ExportCsvButton>.
 */

import type { PriceRecommendation } from '@/types/price-recommendations'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { escapeCsvCell, prefixUtf8Bom } from './csv-helpers'

/** Formats ISO date string to DD.MM.YYYY for Russian locale. */
function fmtDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('ru-RU')
}

const HEADERS = [
  'Артикул (nmId)',
  'Артикул продавца',
  'Товар',
  'Текущая цена (₽)',
  'Безубыточность (₽)',
  'Рекомендованная цена (₽)',
  'Маржа текущая %',
  'Целевая маржа %',
  'Разрыв (₽)',
  'Разрыв %',
  'Маржа рекомендованная %',
  'Дата расчёта',
]

/**
 * Converts a single PriceRecommendation to a CSV row array (string values).
 * AP#8: null money/ratio fields → '—' (em-dash). Opaque nmId uses String() per AP#10.
 */
function itemToRow(item: PriceRecommendation): string[] {
  return [
    String(item.nmId),
    item.vendorCode ?? '—',
    item.productName ?? '—',
    item.lastPrice != null ? formatCurrency(item.lastPrice) : '—',
    formatCurrency(item.breakEvenPrice),
    formatCurrency(item.recommendedPrice),
    item.marginAtCurrentPct != null ? formatPercentage(item.marginAtCurrentPct) : '—',
    formatPercentage(item.targetMarginPct),
    item.gap != null ? formatCurrency(item.gap) : '—',
    item.gapPct != null ? formatPercentage(item.gapPct) : '—',
    formatPercentage(item.marginAtRecommendedPct),
    fmtDate(item.computedAt),
  ]
}

/**
 * Exports pricing recommendations to a CSV string with UTF-8 BOM prefix.
 * Empty data array → returns BOM + headers only (no error).
 *
 * @param items - Array of PriceRecommendation (already normalized).
 * @returns CSV string starting with UTF-8 BOM.
 */
export function exportPricingToCsv(items: PriceRecommendation[]): string {
  const headerRow = HEADERS.map(escapeCsvCell).join(',')
  const dataRows = items.map(item => itemToRow(item).map(escapeCsvCell).join(','))
  const csvBody = [headerRow, ...dataRows].join('\r\n')
  return prefixUtf8Bom(csvBody)
}

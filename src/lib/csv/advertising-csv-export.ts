/**
 * Pure helper: converts AdvertisingItem[] to a CSV string with UTF-8 BOM.
 * No side effects — Blob/DOM/download handled by <ExportCsvButton>.
 */

import type { AdvertisingItem } from '@/types/advertising-analytics'
import { formatPercentage } from '@/lib/utils'
import { escapeCsvCell, prefixUtf8Bom } from './csv-helpers'

function fmt(n: number): string {
  return n.toLocaleString('ru-RU')
}

function fmtCurrency(n: number | null): string {
  if (n == null) return '—'
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Maps efficiency status to Russian display string. */
function fmtEfficiency(status: string): string {
  const map: Record<string, string> = {
    excellent: 'Отлично',
    good: 'Хорошо',
    moderate: 'Средне',
    poor: 'Плохо',
    loss: 'Убыток',
    unknown: '—',
  }
  return map[status] ?? status
}

const HEADERS = [
  'Название',
  'Показы',
  'Клики',
  'CTR %',
  'CPC ₽',
  'Заказы',
  'Расход ₽',
  'Продажи ₽',
  'Прибыль ₽',
  'ROAS',
  'Эффективность',
]

function itemToRow(item: AdvertisingItem): string[] {
  return [
    item.product_name ?? item.brand ?? item.category ?? item.key,
    fmt(item.views),
    fmt(item.clicks),
    item.ctr != null ? formatPercentage(item.ctr) : '—',
    fmtCurrency(item.cpc),
    fmt(item.orders),
    fmt(item.spend),
    fmtCurrency(item.revenue),
    fmtCurrency(item.profit_after_ads ?? item.profit),
    item.roas != null ? fmt(item.roas) : '—',
    fmtEfficiency(item.efficiency_status),
  ]
}

/**
 * Exports advertising performance data to CSV with UTF-8 BOM prefix.
 * Empty data array → BOM + headers only.
 */
export function exportAdvertisingToCsv(items: AdvertisingItem[]): string {
  const headerRow = HEADERS.map(escapeCsvCell).join(',')
  const dataRows = items.map(i => itemToRow(i).map(escapeCsvCell).join(','))
  return prefixUtf8Bom([headerRow, ...dataRows].join('\r\n'))
}

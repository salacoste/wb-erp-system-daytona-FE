import type { UnitEconomicsResponse } from '@/types/unit-economics'
import { escapeCsvCellAlwaysQuoted, prefixUtf8Bom } from '@/lib/csv/csv-helpers'

const CSV_HEADERS = [
  'SKU',
  'Название',
  'Выручка',
  'COGS %',
  'Комиссия %',
  'Логистика %',
  'Хранение %',
  'Доставка на склад %',
  'Маржа %',
  'Прибыль',
  'Статус',
]

/**
 * Encode one CSV cell: delegates to escapeCsvCell for OWASP defanging + RFC 4180 quoting.
 * Consolidated from local duplicate into lib/csv/csv-helpers.ts.
 */
function encodeCsvCell(value: unknown): string {
  return escapeCsvCellAlwaysQuoted(value == null ? '' : String(value))
}

/** Build the unit-economics CSV content (pure, testable — no DOM/Blob side effects). */
export function buildUnitEconomicsCsv(data: UnitEconomicsResponse): string {
  const rows = data.data.map(item => [
    item.sku_id,
    item.product_name,
    item.revenue,
    // null COGS % (no COGS assigned) → "—", matching the delivery_to_warehouse convention below (rule 5).
    item.costs_pct.cogs != null ? item.costs_pct.cogs.toFixed(1) : '—',
    item.costs_pct.commission.toFixed(1),
    (item.costs_pct.logistics_delivery + item.costs_pct.logistics_return).toFixed(1),
    item.costs_pct.storage.toFixed(1),
    item.costs_pct.delivery_to_warehouse != null
      ? item.costs_pct.delivery_to_warehouse.toFixed(1)
      : '—',
    item.net_margin_pct != null ? item.net_margin_pct.toFixed(1) : '—',
    item.net_profit,
    item.profitability_status,
  ])

  return [
    CSV_HEADERS.map(encodeCsvCell).join(','),
    ...rows.map(row => row.map(encodeCsvCell).join(',')),
  ].join('\n')
}

/** Export unit economics data to CSV file (Story 5.2 + Story 77.4 delivery column). */
export function exportUnitEconomicsCsv(data: UnitEconomicsResponse, selectedWeek: string) {
  // prefixUtf8Bom: Excel on Windows (RU locale) needs the BOM to detect UTF-8, else the
  // Cyrillic headers + product names render as mojibake on double-click open.
  const blob = new Blob([prefixUtf8Bom(buildUnitEconomicsCsv(data))], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `unit-economics-${selectedWeek}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

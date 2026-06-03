import type { UnitEconomicsResponse } from '@/types/unit-economics'
import { prefixUtf8Bom } from '@/lib/csv/csv-helpers'

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
 * Encode one CSV cell:
 *  - OWASP CSV-injection: defang a leading formula trigger (= + - @ TAB CR LF) with a `'`
 *    prefix so a hostile product name like `=HYPERLINK(...)` can't execute when opened in Excel.
 *  - RFC 4180: double embedded `"` then wrap (an unescaped `"` in a product name would shift
 *    every following column).
 * NOTE: mirrors supply-table-export's encodeCsvCell — see queued consolidation into
 * lib/csv/csv-helpers once the Epic-113 evaluations-csv WIP lands.
 */
function encodeCsvCell(value: unknown): string {
  let s = value == null ? '' : String(value)
  if (/^[=+\-@\t\r\n]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

/** Build the unit-economics CSV content (pure, testable — no DOM/Blob side effects). */
export function buildUnitEconomicsCsv(data: UnitEconomicsResponse): string {
  const rows = data.data.map(item => [
    item.sku_id,
    item.product_name,
    item.revenue,
    item.costs_pct.cogs.toFixed(1),
    item.costs_pct.commission.toFixed(1),
    (item.costs_pct.logistics_delivery + item.costs_pct.logistics_return).toFixed(1),
    item.costs_pct.storage.toFixed(1),
    item.costs_pct.delivery_to_warehouse != null
      ? item.costs_pct.delivery_to_warehouse.toFixed(1)
      : '—',
    item.net_margin_pct.toFixed(1),
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

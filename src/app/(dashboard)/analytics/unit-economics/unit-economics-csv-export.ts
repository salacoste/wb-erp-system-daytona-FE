import type { UnitEconomicsResponse } from '@/types/unit-economics'

/** Export unit economics data to CSV file (Story 5.2 + Story 77.4 delivery column). */
export function exportUnitEconomicsCsv(data: UnitEconomicsResponse, selectedWeek: string) {
  const headers = [
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

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `unit-economics-${selectedWeek}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

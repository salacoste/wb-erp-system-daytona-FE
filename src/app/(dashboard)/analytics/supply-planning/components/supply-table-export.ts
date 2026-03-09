import type { SupplyPlanningItem } from '@/types/supply-planning'

/**
 * Export supply planning data as CSV file.
 * Extracted from SupplyPlanningTable.tsx — Story 6.3.
 */
export function exportSupplyTableCSV(data: SupplyPlanningItem[]) {
  const headers = [
    'Статус',
    'Артикул',
    'Название',
    'Остаток',
    'В пути',
    'Скорость (шт/день)',
    'Дней до стокаута',
    'Рекомендация (шт)',
    'Сумма заказа (₽)',
  ]

  const rows = data.map(item => [
    item.stockout_risk,
    item.sku_id,
    item.product_name,
    item.current_stock,
    item.in_transit,
    item.avg_daily_sales.toFixed(1),
    item.days_until_stockout ?? 'N/A',
    item.reorder_quantity,
    item.reorder_value,
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `supply-planning-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

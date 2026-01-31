'use client'

/**
 * Status Pie Chart Component
 * Story 63.7-FE: Orders Status Breakdown Chart
 * Epic 63 - Dashboard Enhancements (Orders Analytics)
 *
 * Donut/pie chart visualization for status breakdown.
 * Shows total count in center with clickable segments.
 *
 * @see docs/stories/epic-63/story-63.7-fe-orders-status-breakdown.md
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { getStatusColor, STATUS_ORDER, type OrderStatus } from '@/lib/orders-status-config'
import type { StatusBreakdownItem } from '@/types/orders-volume'
import { StatusTooltip } from './StatusTooltip'

export interface StatusPieChartProps {
  /** Status breakdown items */
  data: StatusBreakdownItem[]
  /** Total orders count */
  total: number
  /** Chart height in pixels */
  height?: number
  /** Click handler for segment navigation */
  onSegmentClick?: (status: OrderStatus) => void
}

/**
 * Donut chart for order status distribution
 * Shows total in center, clickable segments for filtering
 */
export function StatusPieChart({ data, total, height = 200, onSegmentClick }: StatusPieChartProps) {
  // Sort data by STATUS_ORDER for consistent rendering
  const chartData = [...data]
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
    .map(item => ({
      ...item,
      fill: getStatusColor(item.status),
    }))

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            animationDuration={300}
            onClick={(_, index) => {
              const item = chartData[index]
              if (item && onSegmentClick) {
                onSegmentClick(item.status)
              }
            }}
            style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
          >
            {chartData.map(entry => (
              <Cell key={`cell-${entry.status}`} fill={entry.fill} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<StatusTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center total */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-gray-900">{total.toLocaleString('ru-RU')}</span>
        <span className="text-xs text-gray-500">заказов</span>
      </div>
    </div>
  )
}

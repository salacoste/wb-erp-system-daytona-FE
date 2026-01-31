'use client'

/**
 * Status Stacked Bar Component
 * Story 63.7-FE: Orders Status Breakdown Chart
 * Epic 63 - Dashboard Enhancements (Orders Analytics)
 *
 * Horizontal stacked bar chart for status breakdown.
 * Shows all statuses as proportional segments.
 *
 * @see docs/stories/epic-63/story-63.7-fe-orders-status-breakdown.md
 */

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { getStatusColor, STATUS_ORDER, type OrderStatus } from '@/lib/orders-status-config'
import type { StatusBreakdownItem } from '@/types/orders-volume'
import { StatusTooltip } from './StatusTooltip'

export interface StatusStackedBarProps {
  /** Status breakdown items */
  data: StatusBreakdownItem[]
  /** Chart height in pixels */
  height?: number
  /** Click handler for segment navigation */
  onSegmentClick?: (status: OrderStatus) => void
}

/**
 * Horizontal stacked bar chart for status distribution
 * Shows percentages below each segment
 */
export function StatusStackedBar({ data, height = 60, onSegmentClick }: StatusStackedBarProps) {
  // For stacked bar, we need a single data point with all values
  const stackedData = [
    STATUS_ORDER.reduce(
      (acc, status) => {
        const item = data.find(d => d.status === status)
        acc[status] = item?.percentage ?? 0
        return acc
      },
      { name: 'status' } as Record<string, number | string>
    ),
  ]

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={stackedData}
        layout="vertical"
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis type="category" dataKey="name" hide />
        <Tooltip content={<StatusTooltip />} cursor={{ fill: 'transparent' }} />
        {STATUS_ORDER.map(status => {
          const item = data.find(d => d.status === status)
          if (!item || item.count === 0) return null

          return (
            <Bar
              key={status}
              dataKey={status}
              stackId="a"
              fill={getStatusColor(status)}
              radius={status === 'complete' ? [4, 0, 0, 4] : status === 'cancel' ? [0, 4, 4, 0] : 0}
              onClick={() => onSegmentClick?.(status)}
              style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
            >
              <Cell
                fill={getStatusColor(status)}
                // Add payload for tooltip
                // @ts-expect-error - Recharts Cell accepts custom props
                payload={{ status, count: item.count, percentage: item.percentage }}
              />
            </Bar>
          )
        })}
      </BarChart>
    </ResponsiveContainer>
  )
}

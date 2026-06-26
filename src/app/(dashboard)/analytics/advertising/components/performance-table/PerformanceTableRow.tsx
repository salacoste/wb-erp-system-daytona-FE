/** Table row component — extracted for 200-line limit */

'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import type {
  AdvertisingItem,
  MultiCampaignSkuWarning,
  ViewByMode,
} from '@/types/advertising-analytics'
import { formatCurrency, formatPercentRaw } from './performance-table-formatters'
import {
  renderValue,
  renderName,
  renderOrganicSales,
  renderTotalSales,
  renderROAS,
} from './performance-table-columns'
import { renderROI, renderOrganicContribution } from './performance-table-metric-cells'
import { EfficiencyBadge } from '../EfficiencyBadge'
import { MergedProductBadge } from '@/components/analytics/MergedProductBadge'
import { MultiCampaignWarningBadge } from '../MultiCampaignWarningBadge'

interface PerformanceTableRowProps {
  item: AdvertisingItem
  viewBy: ViewByMode
  nameColumn: { key: string; label: string } | null
  warningMap: Map<number, MultiCampaignSkuWarning>
  renderIdentifier: (item: AdvertisingItem) => React.ReactNode
}

export function PerformanceTableRow({
  item,
  viewBy,
  nameColumn,
  warningMap,
  renderIdentifier,
}: PerformanceTableRowProps) {
  const warning = item.sku_id ? warningMap.get(Number(item.sku_id)) : undefined

  return (
    <TableRow>
      <TableCell className="font-medium">{renderIdentifier(item)}</TableCell>
      {nameColumn && (
        <TableCell>
          {item.type === 'merged_group' && item.mergedProducts ? (
            <div className="flex items-center">
              <span className="font-medium">Группа #{item.imtId}</span>
              <MergedProductBadge imtId={item.imtId!} mergedProducts={item.mergedProducts} />
            </div>
          ) : (
            renderName(item, viewBy)
          )}
        </TableCell>
      )}
      <TableCell className="text-right">{renderValue(item, 'spend', formatCurrency)}</TableCell>
      <TableCell className="text-right">{renderTotalSales(item)}</TableCell>
      <TableCell className="hidden lg:table-cell text-right">
        {renderValue(item, 'revenue', formatCurrency)}
      </TableCell>
      <TableCell className="hidden lg:table-cell text-right">{renderOrganicSales(item)}</TableCell>
      <TableCell className="hidden lg:table-cell text-right">
        {renderOrganicContribution(item)}
      </TableCell>
      <TableCell className="text-right">
        {warning ? (
          <div className="flex items-center justify-end gap-1">
            {renderValue(item, 'profit', formatCurrency)}
            <MultiCampaignWarningBadge campaigns={warning.campaigns} message={warning.message} />
          </div>
        ) : (
          renderValue(item, 'profit', formatCurrency)
        )}
      </TableCell>
      <TableCell className="text-right">{renderROAS(item)}</TableCell>
      <TableCell className="hidden lg:table-cell text-right">{renderROI(item)}</TableCell>
      <TableCell className="hidden lg:table-cell text-right">
        {renderValue(item, 'ctr', formatPercentRaw)}
      </TableCell>
      <TableCell>
        <EfficiencyBadge status={item.efficiency_status} showRecommendation />
      </TableCell>
    </TableRow>
  )
}

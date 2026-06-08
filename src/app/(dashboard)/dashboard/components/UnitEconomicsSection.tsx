/**
 * Unit Economics Dashboard Section
 * Wires UnitEconomicsSummaryBanner + UnitEconomicsTable into the dashboard.
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  UnitEconomicsSummaryBanner,
  UnitEconomicsTable,
  ProfitabilityFilter,
} from '@/components/custom/dashboard'
import type { SortField, SortOrder, SortState } from '@/components/custom/dashboard'
import type { UnitEconomicsSortBy } from '@/types/unit-economics'
import type { StatusCount } from '@/components/custom/dashboard/UnitEconomicsSummaryBanner'
import type { ExtendedProfitabilityStatus } from '@/lib/profitability-utils'
import { ALL_PROFITABILITY_STATUSES } from '@/lib/profitability-utils'
import { useUnitEconomics } from '@/hooks/useUnitEconomics'
import type { UnitEconomicsItem } from '@/types/unit-economics'
import { useDashboardPeriod } from '@/hooks/useDashboardPeriod'
import { useDataAvailability } from '@/hooks/useDataAvailability'
import { useAvailableWeeks } from '@/hooks/useFinancialSummary'

/** Map SortField to server-side sort_by (net_profit has no server sort) */
function toServerSort(field: SortField): UnitEconomicsSortBy | undefined {
  if (field === 'net_profit') return undefined
  return field as UnitEconomicsSortBy
}

/** Coerce nullable sort value to number (null → sorts as lowest) */
function sortVal(v: number | null): number {
  return v ?? 0
}

/** Extract numeric value from item by SortField for client-side sorting */
function getItemValue(item: UnitEconomicsItem, field: SortField): number {
  switch (field) {
    case 'revenue':
      return item.revenue
    case 'net_margin_pct':
      return sortVal(item.net_margin_pct)
    case 'cogs_pct':
      return sortVal(item.costs_pct.cogs)
    case 'net_profit':
      return item.net_profit
  }
}

/** Sort data client-side (used for net_profit or local re-sort) */
function sortData(items: UnitEconomicsItem[], sort: SortState): UnitEconomicsItem[] {
  const { field, order } = sort
  const dir = order === 'asc' ? 1 : -1
  return [...items].sort((a, b) => (getItemValue(a, field) - getItemValue(b, field)) * dir)
}

/** Compute status counts from items */
function computeStatusCounts(items: UnitEconomicsItem[]): StatusCount[] {
  const counts = new Map<ExtendedProfitabilityStatus, number>()
  for (const status of ALL_PROFITABILITY_STATUSES) {
    counts.set(status, 0)
  }
  for (const item of items) {
    const s: ExtendedProfitabilityStatus = item.has_cogs ? item.profitability_status : 'unknown'
    counts.set(s, (counts.get(s) ?? 0) + 1)
  }
  return ALL_PROFITABILITY_STATUSES.map(status => ({
    status,
    count: counts.get(status) ?? 0,
  }))
}

export function UnitEconomicsSection() {
  const { periodType, selectedWeek, selectedMonth } = useDashboardPeriod()
  const { data: availableWeeks } = useAvailableWeeks()
  const { isFinanceAvailable } = useDataAvailability(
    periodType,
    selectedWeek,
    selectedMonth,
    availableWeeks
  )
  const week = periodType === 'week' ? selectedWeek : undefined

  const [sortState, setSortState] = useState<SortState>({
    field: 'revenue',
    order: 'desc',
  })
  const [selectedStatuses, setSelectedStatuses] = useState<ExtendedProfitabilityStatus[]>([])

  const serverSort = toServerSort(sortState.field)
  const { data, isLoading } = useUnitEconomics(
    {
      week: week ?? '',
      view_by: 'sku',
      sort_by: serverSort,
      sort_order: serverSort ? sortState.order : undefined,
      limit: 100,
    },
    { enabled: !!week && isFinanceAvailable }
  )

  const handleSort = useCallback((field: SortField, order: SortOrder) => {
    setSortState({ field, order })
  }, [])

  const handleStatusClick = useCallback((status: ExtendedProfitabilityStatus) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }, [])

  const handleFilterChange = useCallback((statuses: ExtendedProfitabilityStatus[]) => {
    setSelectedStatuses(statuses)
  }, [])

  const rawItems = data?.data ?? []
  const sortedItems = sortState.field === 'net_profit' ? sortData(rawItems, sortState) : rawItems
  const filteredItems =
    selectedStatuses.length > 0
      ? sortedItems.filter(i =>
          selectedStatuses.some(f => (f === 'unknown' ? !i.has_cogs : i.profitability_status === f))
        )
      : sortedItems
  const statusCounts = useMemo(() => computeStatusCounts(rawItems), [rawItems])

  if (!week || !isFinanceAvailable) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Унитарная экономика</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <UnitEconomicsSummaryBanner statusCounts={statusCounts} onStatusClick={handleStatusClick} />
        <ProfitabilityFilter
          selectedStatuses={selectedStatuses}
          onFilterChange={handleFilterChange}
        />
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Загрузка...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Нет данных для отображения
          </div>
        ) : (
          <UnitEconomicsTable data={filteredItems} onSort={handleSort} currentSort={sortState} />
        )}
      </CardContent>
    </Card>
  )
}

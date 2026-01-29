/**
 * Period Comparison Table Component
 * Story 51.7-FE: Period Comparison UI
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Side-by-side comparison of two periods with deltas.
 * Shows metrics for both periods with percentage change and visual indicators.
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useFbsCompare } from '@/hooks/useFbsAnalytics'
import {
  ComparisonPeriodPicker,
  calculatePresetPeriods,
  formatDateRangeRu,
  type PeriodRange,
  type ComparisonPreset,
} from './ComparisonPeriodPicker'
import { METRICS_CONFIG } from './period-comparison-helpers'
import { DeltaCell, ComparisonTableSkeleton } from './PeriodComparisonSubcomponents'

/** Props for PeriodComparisonTable */
export interface PeriodComparisonTableProps {
  /** Additional CSS classes */
  className?: string
}

/**
 * PeriodComparisonTable - Compare two time periods with metrics and deltas
 */
export function PeriodComparisonTable({ className }: PeriodComparisonTableProps) {
  // Initialize with MoM preset
  const initialPeriods = useMemo(() => calculatePresetPeriods('mom'), [])

  const [preset, setPreset] = useState<ComparisonPreset>('mom')
  const [period1, setPeriod1] = useState<PeriodRange>(initialPeriods.period1)
  const [period2, setPeriod2] = useState<PeriodRange>(initialPeriods.period2)

  // Fetch comparison data
  const { data, isLoading, isError, error, refetch } = useFbsCompare({
    period1From: period1.from,
    period1To: period1.to,
    period2From: period2.from,
    period2To: period2.to,
  })

  // Handle period changes - switch to custom when user manually changes
  const handlePeriod1Change = useCallback((newPeriod: PeriodRange) => {
    setPeriod1(newPeriod)
    setPreset('custom')
  }, [])

  const handlePeriod2Change = useCallback((newPeriod: PeriodRange) => {
    setPeriod2(newPeriod)
    setPreset('custom')
  }, [])

  const handlePresetChange = useCallback((newPreset: ComparisonPreset) => {
    setPreset(newPreset)
  }, [])

  // Format period headers with date ranges
  const period1Header = useMemo(() => formatDateRangeRu(period1.from, period1.to), [period1])
  const period2Header = useMemo(() => formatDateRangeRu(period2.from, period2.to), [period2])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Сравнение периодов</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ComparisonPeriodPicker
          period1={period1}
          period2={period2}
          preset={preset}
          onPeriod1Change={handlePeriod1Change}
          onPeriod2Change={handlePeriod2Change}
          onPresetChange={handlePresetChange}
          disabled={isLoading}
        />

        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error?.message || 'Не удалось загрузить данные сравнения'}</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Повторить
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isLoading && <ComparisonTableSkeleton />}

        {!isLoading && !isError && data && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="w-[180px]">
                    Метрика
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    <span className="text-xs text-muted-foreground block">Период 1</span>
                    <span className="text-sm">{period1Header}</span>
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    <span className="text-xs text-muted-foreground block">Период 2</span>
                    <span className="text-sm">{period2Header}</span>
                  </TableHead>
                  <TableHead scope="col" className="text-center">
                    Изменение
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {METRICS_CONFIG.map((metric, idx) => {
                  const Icon = metric.icon
                  return (
                    <TableRow key={metric.key} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                      <TableCell scope="row" className="font-medium">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {metric.label}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {metric.format(metric.getValue(data.period1))}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {metric.format(metric.getValue(data.period2))}
                      </TableCell>
                      <TableCell>
                        <DeltaCell
                          delta={metric.getDelta(data.comparison)}
                          deltaPct={metric.getDeltaPct(data.comparison)}
                          formatDelta={metric.formatDelta}
                          inverse={metric.inverse}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {!isLoading && !isError && !data && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Нет данных для выбранных периодов. Попробуйте выбрать другие даты.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

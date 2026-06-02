'use client'

/**
 * SkuAccuracyOverview — container for the SKU accuracy overview table.
 * Story 110.3-FE Task 5: state-precedence chain loading → error → empty → happy.
 * Extracted from page.tsx to respect file-size discipline.
 */

import { useState, useMemo } from 'react'
import { useAiSkuAccuracy } from '@/hooks/useAiSkuAccuracy'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SkuAccuracyTable } from './SkuAccuracyTable'
import { ExportCsvButton } from '@/components/custom/ai/ExportCsvButton'
import { exportSkuAccuracyToCsv } from '@/lib/csv/sku-accuracy-csv-export'
import type { SkuSortColumn, SkuSortDirection } from './sku-accuracy-helpers'

interface SkuAccuracyOverviewProps {
  modelId: string
}

export function SkuAccuracyOverview({ modelId }: SkuAccuracyOverviewProps) {
  const [sortCol, setSortCol] = useState<SkuSortColumn>('avgAiMape')
  const [sortDir, setSortDir] = useState<SkuSortDirection>('asc')

  const { data, isLoading, isError, error } = useAiSkuAccuracy(modelId)

  function handleSortClick(col: SkuSortColumn) {
    if (sortCol === col) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  // iter-63: derive entries + CSV memos BEFORE the early returns below. These useMemo hooks
  // previously sat AFTER the isLoading/isError returns — once the page actually loaded data
  // (after the modelId-400 fix) the render reached them, changing the hook count vs the
  // loading render → "Rendered more hooks than during the previous render" crash (Rules of Hooks).
  const entries = data?.skuAccuracies ?? []
  const csvFileName = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return `sku-accuracy-${modelId}-${today}.csv`
  }, [modelId])
  const csvContent = useMemo(() => exportSkuAccuracyToCsv(entries), [entries])

  // State-precedence chain (Story 109.5-FE F-17): loading → error → empty → happy
  if (isLoading) {
    return (
      <div className="space-y-4 p-6" data-testid="sku-accuracy-skeleton">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Ошибка загрузки данных по SKU
            {error?.message ? `: ${error.message}` : ''}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            Нет данных по точности SKU для этой модели. Данные появятся после первой оценки.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-end pb-2">
        <ExportCsvButton csvContent={csvContent} fileName={csvFileName} />
      </CardHeader>
      <CardContent className="pt-0">
        <SkuAccuracyTable
          entries={entries}
          modelId={modelId}
          sortCol={sortCol}
          sortDir={sortDir}
          onSortClick={handleSortClick}
        />
      </CardContent>
    </Card>
  )
}

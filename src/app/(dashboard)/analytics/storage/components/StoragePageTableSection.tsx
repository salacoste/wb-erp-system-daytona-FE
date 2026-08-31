'use client'

/**
 * Storage Analytics - Table section (Top Consumers + By-SKU table)
 * Extracted from storage/page.tsx for file size compliance
 */

import { Trophy, List } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StorageBySkuTable } from './StorageBySkuTable'
import { TopConsumersWidget } from './TopConsumersWidget'
import type { StorageBySkuResponse } from '@/types/storage-analytics/by-sku'
import type { TopConsumersResponse } from '@/types/storage-analytics'

interface StoragePageTableSectionProps {
  bySkuData: StorageBySkuResponse | undefined
  topConsumers: TopConsumersResponse['top_consumers'] | undefined
  isLoadingBySku: boolean
  isLoadingTopConsumers: boolean
  /** Story 169.12 (AC-2): per-section recoverable error */
  topConsumersError?: unknown
}

export function StoragePageTableSection({
  bySkuData,
  topConsumers,
  isLoadingBySku,
  isLoadingTopConsumers,
  topConsumersError,
}: StoragePageTableSectionProps) {
  return (
    <>
      {/* Top Consumers Section - Story 24.4-fe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            Топ-5 по расходам на хранение
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Story 169.12 (AC-2, review F1): background-refresh failure with
              retained data → Alert + widget coexist; Alert-only when no data.
              No retry Button — recovery rides the existing refetch paths. */}
          {topConsumersError ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Не удалось обновить топ товаров по расходам на хранение. Отображены последние
                загруженные данные.
              </AlertDescription>
            </Alert>
          ) : null}
          {(!topConsumersError || (topConsumers ?? []).length > 0) && (
            <TopConsumersWidget data={topConsumers ?? []} isLoading={isLoadingTopConsumers} />
          )}
        </CardContent>
      </Card>

      {/* Storage by SKU Table - Story 24.3-fe */}
      <Card>
        <CardHeader>
          <h2 className="sr-only">Детализация по хранению</h2>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5 text-muted-foreground" />
            Все товары
            {bySkuData?.pagination?.total && (
              <span className="text-sm font-normal text-muted-foreground">
                ({bySkuData.pagination.total})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StorageBySkuTable data={bySkuData?.data ?? []} isLoading={isLoadingBySku} />
        </CardContent>
      </Card>
    </>
  )
}

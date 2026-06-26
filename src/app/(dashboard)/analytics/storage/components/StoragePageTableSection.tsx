'use client'

/**
 * Storage Analytics - Table section (Top Consumers + By-SKU table)
 * Extracted from storage/page.tsx for file size compliance
 */

import { Trophy, List } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StorageBySkuTable } from './StorageBySkuTable'
import { TopConsumersWidget } from './TopConsumersWidget'
import type { StorageBySkuResponse } from '@/types/storage-analytics/by-sku'
import type { TopConsumersResponse } from '@/types/storage-analytics'

interface StoragePageTableSectionProps {
  bySkuData: StorageBySkuResponse | undefined
  topConsumers: TopConsumersResponse['top_consumers'] | undefined
  isLoadingBySku: boolean
  isLoadingTopConsumers: boolean
}

export function StoragePageTableSection({
  bySkuData,
  topConsumers,
  isLoadingBySku,
  isLoadingTopConsumers,
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
          <div className="overflow-x-auto">
            <TopConsumersWidget data={topConsumers ?? []} isLoading={isLoadingTopConsumers} />
          </div>
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
          <div className="overflow-x-auto">
            <StorageBySkuTable data={bySkuData?.data ?? []} isLoading={isLoadingBySku} />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
